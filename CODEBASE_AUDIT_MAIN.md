# Auditoría Técnica Completa de la Rama Main

## Resumen Ejecutivo

- **Estado general**: El proyecto tiene una base sólida usando React Native y Supabase, pero presenta importantes deudas técnicas, malas prácticas de tipado, potencial código no manejado correctamente ante fallos de red/sincronización y problemas de seguridad graves a nivel base de datos.
- **Nivel de riesgo**: Alto (Debido a la ausencia de Row Level Security y manejo de errores inconsistente en llamadas de red).
- **Hallazgos críticos**: 2
- **Hallazgos importantes**: 3
- **Hallazgos medios**: 3
- **Hallazgos menores**: 1
- **Estimación de deuda técnica**: Media-Alta. Hay mucho código acoplado, uso de tipos evasivos (`any`), falta de RLS en base de datos.

## Contexto del Repositorio

- **Tecnologías detectadas**: React Native (0.81.5), Expo (54), TypeScript, Supabase (JS 2.90.1), Maestro (E2E), Jest.
- **Frameworks**: React Navigation 7, NativeWind/Tailwind.
- **Versiones**: React 19.1.0, Node.js (probablemente 20 por el CI).
- **Arquitectura identificada**: MVC-ish (Modelos en `types/`, Vistas en `screens/` y `components/`, Controladores (hooks) en `controllers/`, Servicios en `services/`). Persistencia mediante `OfflineStorageService` y Supabase, sincronización usando `SyncService`.

## Hallazgos Críticos

### HALLAZGO-001
### Título: Falta de Row Level Security (RLS) y Políticas de Acceso en Supabase
### Severidad: Crítica
### Categoría: Seguridad
### Ubicación exacta:
- Archivo: `supabase/migrations/20260728000000_initial_schema.sql`
- Directorio: `supabase/migrations/`
### Evidencia:
El esquema inicial (`20260728000000_initial_schema.sql`) crea las tablas (`usuarios`, `rutinas_semanales`, `rutinas_diarias`, etc.) pero **no** habilita RLS (`ALTER TABLE x ENABLE ROW LEVEL SECURITY;`) y tampoco crea políticas de acceso (Policies).
### Impacto:
Cualquier usuario autenticado con la llave anónima de Supabase puede consultar, modificar y eliminar datos de **cualquier otro usuario**. Un atacante podría simplemente enviar peticiones REST y borrar o robar toda la base de datos de usuarios, métricas y rutinas.
### Probabilidad: Alta
### Escenario de fallo:
Un atacante obtiene la URL y el anon-key (los cuales son públicos en el cliente web/móvil) y hace solicitudes a `/rest/v1/usuarios` para extraer la base de datos entera de usuarios registrados en el sistema, ya que el API de PostgREST está habilitado y RLS no bloquea a los usuarios de leer data ajena.
### Recomendación:
Añadir migraciones que ejecuten `ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;` en todas las tablas y crear las políticas correspondientes. Por ejemplo:
```sql
CREATE POLICY "Users can only read their own data" ON usuarios FOR SELECT USING (auth.uid() = id);
```
### Confianza: 100%

### HALLAZGO-002
### Título: Ingesta Insegura de Errores de Red y Descarte Silencioso en `SyncService`
### Severidad: Crítica
### Categoría: Integridad de Datos / Arquitectura
### Ubicación exacta:
- Archivo: `src/services/SyncService.ts`
- Método: `processQueue`
### Evidencia:
```typescript
let success = false;
if (executorFn) {
    try {
        success = await executorFn(op);
    } catch {
        success = false;
    }
} else {
    // Default fallback: simulate successful processing
    success = true;
}
```
Y si `success` es `true`, la operación se descarta de la cola.
### Impacto:
El sincronizador asume el éxito automático si no se pasa `executorFn`, o en ciertos casos si la función de ejecución ignora errores. Esto lleva a una pérdida silenciosa de datos offline; el usuario asume que guardó la rutina en la base de datos, pero la mutación se pierde para siempre de la cola.
### Probabilidad: Media
### Escenario de fallo:
El dispositivo pierde conexión, añade la operación a la cola. Cuando vuelve el internet, el listener llama a `processQueue()` sin argumentos o con una función ejecutora vacía, provocando que la operación se marque como exitosa y se elimine sin haberse sincronizado con el backend.
### Recomendación:
El listener automático debe tener acceso al executorFn real que llame a las mutaciones correctas en Supabase, o el backend debería proveer un mapeo de `type` a ejecutores de red. Nunca hacer fallback a `success = true` para operaciones asíncronas no procesadas.
### Confianza: 95%

## Hallazgos Altos

### HALLAZGO-003
### Título: Fuga Excesiva del Tipo `any` en Controladores y Servicios
### Severidad: Alta
### Categoría: Mantenibilidad y Tipado
### Ubicación exacta:
- Directorio: `src/controllers/`, `src/screens/`
- Archivos: `useWorkoutController.ts`, `useRoutineController.ts`, `WorkoutScreen.tsx`, etc.
### Evidencia:
Hay casi 40-50 referencias directas a `any` y `any[]`.
Ejemplo: `const [workout, setWorkout] = useState<any>(null);` o en iteraciones `data.ejercicios_programados.map((ex: any) => ...)`.
### Impacto:
Se pierde por completo la seguridad de tipos proporcionada por TypeScript, haciendo que refactorizaciones del backend (por ejemplo, cambios de `snake_case` a `camelCase` o renombramiento de campos) no generen errores de compilación, fallando estrepitosamente en tiempo de ejecución.
### Probabilidad: Alta
### Escenario de fallo:
El equipo backend modifica la columna `notas_sesion` a `notas` en `ejercicios_programados`. Al haber `any` en `useWorkoutController`, el frontend no alerta de esto. El usuario pierde todas sus notas sin enterarse y las guarda como "undefined".
### Recomendación:
Utilizar estrictamente las interfaces de `src/types/models.ts` como `RoutineDay`, `ScheduledExercise`, `Serie`, etc. Reemplazar `any` por `unknown` si el formato es dudoso y usar Type Guards o validaciones zod/joi.
### Confianza: 100%

### HALLAZGO-004
### Título: Condición de Carrera Potencial (Race Condition) en `WorkoutService.addSet`
### Severidad: Alta
### Categoría: Concurrencia
### Ubicación exacta:
- Archivo: `src/services/WorkoutService.ts`
- Método: `addSet`
### Evidencia:
```typescript
const { data: maxOrderData } = await supabase
    .from('ejercicios_programados')
    .select('orden_ejecucion')
    .eq('rutina_diaria_id', workoutId)
    .order('orden_ejecucion', { ascending: false })
    .limit(1)
    .maybeSingle();
const nextOrder = (maxOrderData?.orden_ejecucion || 0) + 1;
```
### Impacto:
Si dos solicitudes llegan de manera simultánea para agregar un ejercicio nuevo al workout, ambas obtendrán el mismo `maxOrderData.orden_ejecucion`, provocando un conflicto de llaves o, peor aún, dos ejercicios compartiendo el mismo `orden_ejecucion`, arruinando el sistema de ordenado.
### Probabilidad: Baja/Media (Alta si la red es lenta o se hace click rápido)
### Escenario de fallo:
El usuario toca rápidamente el botón "Añadir Ejercicio" dos veces. El sistema envía las consultas a Supabase simultáneamente. Ambas devuelven que el orden es 3. Ambos nuevos ejercicios se insertan con orden 4.
### Recomendación:
Hacer uso de una función RPC en PostgreSQL (Supabase) que se encargue atómicamente de calcular el orden máximo e insertar. Ejemplo: `add_exercise_to_workout(workout_id, exercise_id)` y dentro transaccionar `COALESCE(MAX(orden_ejecucion), 0) + 1`.
### Confianza: 90%

### HALLAZGO-005
### Título: Ingesta Excesiva e Ilimitada en History Offline
### Severidad: Alta
### Categoría: Rendimiento / Memoria
### Ubicación exacta:
- Archivo: `src/services/OfflineStorageService.ts`
- Método: `saveWorkouts` / `saveHistory`
### Evidencia:
No hay política de limpieza. Si el usuario realiza entrenamientos todos los días, todos se van acumulando en un gran JSON bajo las llaves de AsyncStorage (`@pressfit_history`, etc.).
### Impacto:
Dado que AsyncStorage almacena en texto plano serializado como JSON en la memoria del dispositivo, el tiempo de parseo crece exponencialmente con el uso a lo largo de los meses (Memory Bloat). Esto puede causar cuellos de botella bloqueantes al iniciar la aplicación (`JSON.parse` de 10-20MB bloquea el Main Thread de JS).
### Probabilidad: Alta a medio-largo plazo.
### Escenario de fallo:
Después de 6-12 meses usando la app offline, el usuario tiene cientos de rutinas. Iniciar la app tarda 10 segundos porque `AsyncStorage.getItem('@pressfit_workouts')` y su parseo saturan el hilo de JS.
### Recomendación:
Establecer una purga automática del almacenamiento offline, dejando por ejemplo solo los datos del último mes o de la semana pasada de caché.
### Confianza: 95%


## Hallazgos Medios

### HALLAZGO-006
### Título: Fallback ciego al cacheo sin comprobación de sincronización
### Severidad: Media
### Categoría: Flujo de Datos / Estado Lógico
### Ubicación exacta:
- Archivo: `src/services/WorkoutService.ts`
- Método: `getWorkoutDetails`
### Evidencia:
Si la petición a Supabase falla, se carga la caché offline y se retorna directamente. Sin embargo, no se notifica a la capa de UI de que los datos son "Stale" (obsoletos) si la falla de red ocurrió habiendo conexión. Además, si hay conexión pero la API retorna un error HTTP 500, enmascara el error devolviendo los de caché asumiendo comportamiento Offline.
### Impacto:
El usuario puede interactuar con datos que no están actualizados, especialmente si usa la aplicación en múltiples dispositivos.
### Probabilidad: Media
### Escenario de fallo:
El usuario edita su rutina en la web (hipotética) o iPad. Abre su teléfono y el servidor de Supabase da error 500. La app le muestra la rutina vieja de caché y el usuario no sabe que está fallando.
### Recomendación:
Propagar en la respuesta `ServiceResponse` un flag `isOffline` o `isCached` para que la UI informe al usuario que está viendo datos cacheados.
### Confianza: 100%

### HALLAZGO-007
### Título: Posible Bloqueo de UI por parseo pesado en deduplicación
### Severidad: Media
### Categoría: Rendimiento
### Ubicación exacta:
- Archivo: `src/services/SyncService.ts`
- Método: `deduplicateEntities`
### Evidencia:
Realiza deduplicación recorriendo Arrays completos con conversiones a mapa, además parseando fechas cada vez con `parseEntityTimestamp`.
### Impacto:
Puede bloquear el hilo de Javascript de React Native.
### Probabilidad: Baja/Media
### Escenario de fallo:
Deduplicación de cientos de ejercicios al sincronizar tras estar offline por mucho tiempo.
### Recomendación:
Memoizar y evitar llamar funciones síncronas costosas de validación o deduplicación masiva en el thread principal si las colecciones crecen. Considerar WebWorkers o `InteractionManager`.
### Confianza: 85%

### HALLAZGO-008
### Título: Uso del log nativo para errores
### Severidad: Media
### Categoría: Observabilidad
### Ubicación exacta:
- Archivo: `src/services/SentryService.ts` y todos los Controllers.
### Evidencia:
En toda la app hay `console.error` sueltos para fallas de red, y SentryService solo se invoca usando `ErrorBoundary`, pero no se llama a `SentryService.captureException` en los bloques `catch` de los Controllers o Services (como `useProfileController`, `WorkoutService`).
### Impacto:
Se pierden valiosos logs de errores no fatales en producción.
### Probabilidad: Alta
### Escenario de fallo:
Una consulta de base de datos falla pero es capturada por el `catch` y retorna `data: null`. El usuario ve un fallo, pero Sentry no recibe nada porque `console.error` no lo envía.
### Recomendación:
Cambiar los múltiples `console.error` por una abstracción como `Logger.error()` que encapsule `SentryService.captureException(err)`.
### Confianza: 100%

## Hallazgos Bajos

### HALLAZGO-009
### Título: Catch de Promesas Ignorados
### Severidad: Baja
### Categoría: Manejo de Errores
### Ubicación exacta:
- Archivo: `src/services/TimerNotificationService.ts`
### Evidencia:
`await Notifications.dismissNotificationAsync(id).catch(() => { });`
### Impacto:
Fallos en la gestión de permisos o notificaciones locales se silencian.
### Probabilidad: Media
### Escenario de fallo:
El usuario revoca el permiso de notificaciones, esto lanza una excepción que se traga y es invisible para observabilidad.
### Recomendación:
Aunque sea una desestimación de notificaciones, ignorar ciegamente promesas rechazadas puede ocultar fallos de permisos en iOS/Android.
### Confianza: 100%

## Funcionalidades Incompletas o Sospechosamente Inacabadas

- **Gestión Completa de Sincronización Automática:** `SyncService.processQueue` tiene el "todo" y el default fallback `success = true`, pero la implementación donde los mutadores reales en la red interactúan con la cola parece escasa o manual a través del Listener de Red.
- **Soporte Offline Mixto:** Algunos hooks, como `useCalendarController`, asumen estar siempre online o al menos no demuestran tener un flujo offline robusto como el de los entrenamientos individuales, lo que provocará que la app se muestre rota parcialmente (calendario vacío pero se puede ver el workout de hoy en caché).

## Código Muerto y Elementos Sin Uso

- **E2E Variables No Utilizadas de Forma Real en el Entorno:** Vemos `.env.e2e.example`, `fixtures`, y mock adapters complejos. El código tiene muchas condicionales `if (isE2EMockEnabled())`, lo cual acopla código de prueba en la aplicación de producción (aunque dependa de Expo flags, hincha el bundle).
- **Controladores / Tipos de Importación:** Muchas variables importadas a tipo `any` en `useWeeklyRoutineController` que podrían ser inferidas.

## Riesgos de Producción

1. **Destrucción de BD (Sin RLS):** Como se detalló en el Hallazgo Crítico, cualquier usuario registrado o con acceso a la red y el token anon de supabase, puede dropear datos de otros usuarios. (Grave).
2. **Pérdida de Entrenamientos:** Debido a la mala gestión de `SyncService` combinada con su uso agresivo de almacenamiento asíncrono sin políticas estrictas de reintentos con backoff exponencial, un cierre inesperado puede dejar un estado corrupto.
3. **Múltiples re-renderizados:** Múltiples dependencias no memoizadas en `useEffect` en Controladores acoplados, pueden ralentizar la app en móviles viejos.

## Problemas de Seguridad

- **Falta de Row Level Security (RLS)**: En Supabase, esto significa que cualquier cliente podría leer, editar o borrar datos ajenos, rompiendo por completo la confidencialidad de datos. (HALLAZGO-001)

## Problemas de Rendimiento

- **Memory Bloating de Historial Offline**: Como el historial no tiene límite, cargar AsyncStorage puede volver lenta la aplicación o incluso bloquear el Hilo principal de JS al iniciar si se tienen años de datos. (HALLAZGO-005)
- **Falta de Memoización**: `SyncService.deduplicateEntities` y algunas manipulaciones de arreglos en controladores son costosas. (HALLAZGO-007)

## Problemas de Mantenibilidad

- **Abuso de `any`**: Decenas de variables marcadas como `any`, ignorando la potencia de TypeScript y dejando el código expuesto a regresiones al modificar el modelo de base de datos. (HALLAZGO-003)
- **Bloques `catch` Silenciosos**: Tragar errores de red y de notificaciones oculta problemas de código. (HALLAZGO-009)

## Problemas de Arquitectura

- **SyncService Acoplado y Débil**: La lógica para sincronizar datos offline carece de robustez. Retornar `true` ciegamente cuando no hay un executor daña los datos guardados al fingir éxito. (HALLAZGO-002)

## Riesgos de Escalabilidad

- **Condiciones de Carrera (Race Conditions) al Añadir Sets/Ejercicios**: Basarse en calcular de lado del cliente el índice máximo (`orden_ejecucion + 1`) es inestable bajo estrés y no escala si varios clientes u operaciones asincrónicas actúan sobre el mismo recurso. (HALLAZGO-004)

## Riesgos Operativos

- **Monitoreo Deficiente (Sentry mal implementado)**: Los errores de capa de red en los Controllers son solo emitidos por `console.error`. Si la aplicación se rompe en producción sin llegar al `ErrorBoundary`, no existirá constancia de la falla, cegando a los desarrolladores ante incidentes críticos. (HALLAZGO-008)

## Recomendaciones Priorizadas

### Corto Plazo
1. Modificar urgentemente los archivos de migración (o lanzar uno nuevo de inmediato) que habilite Row Level Security (RLS) en todas las tablas (`usuarios`, `rutinas_*`, `series`, etc) en la base de datos de Supabase e implementar las correspondientes Policies para segmentar por `auth.uid()`.
2. Remover el default `success = true` en el `processQueue` del `SyncService`.

### Medio Plazo
1. Tipar estrictamente todo el código. Sustituir las declaraciones de estado como `useState<any>()` por las interfaces definidas en `src/types/models.ts`.
2. Integrar `SentryService` directamente en las capas de API o en los Catch de los Controllers, en lugar de depender únicamente de `console.error`.
3. Mejorar el manejo de la concurrencia utilizando Transacciones SQL en PostgreSQL a través de llamadas RPC, especialmente para cálculos de `orden_ejecucion`.

### Largo Plazo
1. Eliminar código de Mockeo (E2E mocks) del bundle en producción aislando estas capas detrás de una Inyección de Dependencias, o purificando los constructos con Babel.
2. Añadir políticas de limpieza (cache eviction) o paginación en `AsyncStorage` para evitar el "Memory Bloating" acumulando históricos de años.

## Top 20 Problemas Más Importantes

| Posición | ID Hallazgo | Título / Descripción Breve | Severidad | Probabilidad | Impacto | Categoría |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | HALLAZGO-001 | Fuga y Manipulación Total de BD (Falta RLS Supabase) | Crítica | Alta | Extremo | Seguridad |
| 2 | HALLAZGO-002 | Pérdida de Datos Offline (`success = true` sin executor) | Crítica | Media | Grave | Integridad |
| 3 | HALLAZGO-003 | Abuso de `any` anulando Type Safety | Alta | Alta | Moderado | Mantenibilidad |
| 4 | HALLAZGO-008 | Falsos Positivos de Exito Silenciosos y Falta de Logs (Sentry) | Media | Alta | Moderado | Observabilidad |
| 5 | HALLAZGO-005 | Memory Bloating por Caché Infinita de History | Alta | Alta | Moderado | Rendimiento |
| 6 | HALLAZGO-004 | Race Conditions calculando `orden_ejecucion` client-side | Alta | Media | Moderado | Concurrencia |
| 7 | HALLAZGO-006 | UI sin indicadores de Datos "Stale" cacheados offline | Media | Media | Menor | UX / Lógica |
| 8 | HALLAZGO-007 | Parseo pesado de Arrays sin memoizar en UI Thread | Media | Baja | Menor | Rendimiento |
| 9 | HALLAZGO-009 | Permisos fallidos tragados silenciosamente | Baja | Media | Menor | Manejo Errores |
| 10 | N/A | Feature Flags/Mocks E2E en bundle de producción | Baja | Alta | Menor | Deuda Técnica |

## Conclusión Final

El proyecto **PressFit** muestra una promesa significativa como aplicación React Native limpia y bien pensada desde el UX/UI. El uso de React Navigation 7 y Expo denotan un stack moderno y eficiente. Sin embargo, sufre de deficiencias subyacentes críticas, destacando particularmente la **falta de seguridad en la Base de Datos (Row Level Security deshabilitado)** y las **fugas de tipos (`any`) excesivas**. La arquitectura de sincronización offline es ambiciosa pero vulnerable a fallos y descartes silenciosos de estado. Corrigiendo el modelo de datos (RLS) y estabilizando el tipado, el proyecto pasará de riesgo Alto a bajo/medio y estará listo para escalar adecuadamente y en un futuro dar un mejor soporte para Offline.
