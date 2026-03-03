# Documentación de Pruebas Unitarias - Routine Service (Mocked Coverage)

Este documento detalla todas las pruebas simuladas (mocked) que se han añadido al archivo `__tests__/unit/routineService.coverage.test.ts` con el objetivo de lograr el 100% de cobertura del servicio sin depender de una base de datos real.

## __tests__/unit/routineService.coverage.test.ts

En este archivo de tests, utilizamos `jest.spyOn()` para simular (mock) todas las interacciones con `supabase.from()`. El objetivo es validar la lógica iterativa de `RoutineService` según las respuestas esperadas o de error de la API, sin hacer lecturas orgánicas.

### 1. `getWeeklyRoutineWithDays`
Prueba la función encargada de agrupar y ordenar los días y ejercicios de una rutina semanal completa.
- **should return data successfully with sorted exercises**: Verifica que si Supabase retorna correctamente una rutina junto a sus días y ejercicios programados, la función los ordene apropiadamente basándose en el parámetro `orden_ejecucion`.
- **should return error if supabase throws**: Valida que ante una caída del SDK de Supabase (error falso introducido en el mock), el servicio la intercepte y devuelva un mensaje de error constructivo sin crashear la app o el componente frontend.
- **should handle undefined rutinas_diarias gracefully**: Comprueba que si la rutina existe, pero no ha establecido días por alguna razón (e.g., creación asíncrona interrumpida), el servicio devuelve datos seguros sin fallar tratando de leer variables inexistentes.

### 2. `getUserRoutines`
Prueba la función que solicita todas las rutinas de un usuario y sus plantillas.
- **should return routines successfully**: Verifica que se reciba un mapeo correcto del vector de rutinas asignadas al ID del usuario enviado por los mocks.
- **should return error if fetching user routines fails**: Verifica que de caer la solicitud (i.e. límite de tasa), devuelva un formato estandar `ServiceResponse` indicando un estado error no nulo.

### 3. `getRoutineDayById`
- **should fetch day by id and sort**: Valida que al buscar el UUID de un día (`rutinas_diarias`), el bloque de ejercicios subyacente regrese ordenado correctamente.
- **should return error handling**: Comprueba que si la consulta única del día da error, el servicio devuelve la estructura `error` capturada intacta.

### 4. `getRoutineDayByDate`
- **should fetch day by date and sort**: Verifica que la solicitud basada en el string de la fecha (`YYYY-MM-DD`) filtre y reciba el día del calendario adecuadamente, asegurando un sort seguro de iteraciones.
- **should return error handling for date**: Validacion de la bandera de fallos en query mediante fetch de fecha.

### 5. `getRoutineDayByName`
- **should fetch day by name template**: Valora los escenarios donde pedimos un "Lunes" abstracto en lugar de un día calendárico en especifico (útil p. ej. cuando creamos rutinas default o inicializamos). Toma una copia única garantizada.
- **should error when fetching day by name**: Valida que si falla la obtención abstraida del nombre, vuelva una respuesta segura sin afectar la creación de la plantilla.

### 6. Utils: `getStartOfWeek` & `getMondayOfCurrentWeek`
- **should return YYYY-MM-DD for current week monday**: Esta prueba engaña al sistema forzando temporalmente una fecha (jueves p. ejemplo) y exigiendo que la unidad retorne imperativamente el "Lunes" de esa misma semana con el padding correcto (`YYYY-MM-DD`). 
- **should return ISO string for start of week**: Como la anterior pero devolviendo la sintaxis estandarizada ISO de JavaScript y comprobando que apunte al primer día laborable de la semana.

### 7. `getWorkoutStatsForRoutineDay`
Evalúa la inferencia lógica que la App hace basándose en la finalización de los ejercicios del día.
- **should return valid stats for a completed day**: Valida que cuente y diferencie correctamente los ID's únicos, si la rutina es enviada y los tiempos de inicio y fin restados no dan negativo y superan los cinco minutos (duración estimada confiable).
- **should return null stats gracefully if day not found**: Valida que si no existe el día (p. ej hoy es Lunes pero en la plantilla solo hay Martes), en lugar de romper, la respuesta vacíe contadores a `0` sin reportar pánico.
- **should return error if fetching stats throws**: Verifica la envoltura en try-catch principal de la lectura en este fragmento.

### 8. `getActiveWorkout`
- **should get active workout successfully**: Comprueba que encuentre rápidamente aquel día de la semana actual que tenga un `hora_inicio` no-nulo y una bandera `completada` falsa.
- **should return error if failed to get active workout**: Prueba controlada asegurándose de que la interfaz muestre a los usuarios qué fue lo que falló si Supabase cae momentáneamente en un reintento.

### 9. Mutaciones Generales: CRUD
- **getAllWeeklyRoutines**: Comprueba que `select('*')` extrae sin condicionantes más allá del ID, priorizando rutinas en la consulta.
- **createWeeklyRoutine**: Examina si el insert del master transaccional (donde se meten registros hijos por cada día de la semana) es capaz de resolver exitosamente y generar los días base.
- **updateWeeklyRoutine**: Verifica las mutaciones directas de campos sencillos como titulo descripción sobre el identificador existente.
- **deleteWeeklyRoutine**: Cersiora una simple validación a la base de datos para borrar un objeto y probar que si en efecto retorna solo un valor `{ error: null }` significa que el borrado fue propicio.

### 10. `startDailyWorkout`
- **should update start time**: Comprueba el proceso transaccional más complejo donde primero consulta localmente si es una plantilla, y si no ha empezado clona el valor entero en un log local fechado y añade `hora_inicio`.

### 11. `getOrCreateRoutineDay`
- **should return existing non-completed day**: Trata de buscar primero en el registro un día coincidente y si este está sin completar lo retorna íntegro pre-guardado.
- **should return error if get fails**: Garantiza que si hay fallo recabando información abstracta lance su alerta generalizada.

### 12. Listas y Agrupaciones en Rango (`getWorkoutsForDateRange`)
- **should perform in query for multiple ids**: Valida que inyectando un array de ID's como filtro (`.in(...)`), además de la fecha límite y de arranque, aglomere inteligentemente los días pasados del calendario en un buffer de rendimiento de Supabase.

### 13. Funciones Menores de Actualización
- **startWeeklySession**: Verifica si el estado activo de la semana se pone de bandera general y arranca las actualizaciones.
- **getRoutineDayStatus**: Test crucial donde si tiene fecha de inicio pero `isCompleted` es falso regresa `IN_PROGRESS`, si está completo es `COMPLETED` si la orden del día ya superó la actual fecha (e.g. tocaba ayer Martes y hoy es Miércoles) asume `MISSED`, y si es hoy `PENDING`.
- **setActiveRoutine**: Desactiva todas las demás marcadas con el usuario y solo activa iterativamente el índice que se le provee al backend.
- **createRoutineFromTemplate**: Revisa el desencuadre transaccional mediante RPC sobrecargado.
- **updateRoutineDayDescription**: Verifica el control del string de descripción.
