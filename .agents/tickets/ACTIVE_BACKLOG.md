# 📋 Tablero de Backlog Activo — PressFit Expo

> **Estado**: Activo (Poblado con Issues PF-131 a PF-170)  
> **Última Actualización del Tablero**: `2026-07-28 23:00:00 CEST`  
> **Última Issue Histórica**: `PF-130`  
> **Siguiente Issue Disponible**: `PF-171`

---

## 🚦 Vistas Rápidas del Tablero

* **En Progreso (`IN_PROGRESS_*`)**: 0 tickets
* **Pendientes en Backlog (`BACKLOG`)**: 29 tickets (`PF-139`, `PF-141`, `PF-143` a `PF-145`, `PF-147` a `PF-170`)
* **Bloqueados (`IN_PROGRESS_BLOCKED`)**: 0 tickets
* **Completados (`DONE`)**: 141 tickets (`PF-001` a `PF-138`, `PF-140`, `PF-142`, `PF-146`)

---

## 🟡 Pendientes en Backlog (`BACKLOG`)

### 🔴 Prioridad P0 — Críticas (Estabilidad & Prevención de Crashes)

#### PF-131
```markdown
---
id: PF-131
title: "[Bug Fix]: Auditoría y resolución de fechas/zonas horarias en servicios y controllers"
epic: EPIC-06
status: DONE
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-24T20:17:00+02:00"
closed_at: "2026-07-24T20:17:00+02:00"
related_historical_tickets: [PF-120]
---

### 🎯 Objetivo
Garantizar que el formateo, parsing y almacenamiento de fechas sea 100% consistente en zonas horarias locales y UTC en todos los controladores y servicios.

### 📋 Criterios de Aceptación
- [x] Ningún servicio hace `new Date("YYYY-MM-DD")` sin especificar hora/timezone local.
- [x] Las consultas de entrenamientos semanales filtran con límites de medianoche local sin desfase UTC.
- [x] Todos los tests de controladores de fecha pasan en verde.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Inspeccionar `PF-120` en `Documentacion/jira_knowledge_base/issues/PF-120...`.
- Revisar `RoutineService.ts`, `WorkoutService.ts`, `ProgressService.ts` y controladores de calendario.

### 🛠️ Archivos Implicados
- `src/services/RoutineService.ts`
- `src/services/WorkoutService.ts`
- `src/services/ProgressService.ts`
- `src/controllers/useCalendarController.ts`
- `src/controllers/useProgressController.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial desde reporte de análisis.
- `2026-07-24 20:12:00 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding.
- `2026-07-24 20:14:00 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación exitosa de baseline tests.
- `2026-07-24 20:15:00 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción (Build) tras aprobación automática del plan.
- `2026-07-24 20:16:00 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a fase de pruebas tras aplicar todos los cambios en servicios y controladores.
- `2026-07-24 20:17:00 CEST` | Estado: IN_PROGRESS_TEST ➔ DONE | Antigravity AI | Desarrollo finalizado y verificado mediante pruebas unitarias y de componentes (100% verde).
```

---

#### PF-132
```markdown
---
id: PF-132
title: "[Task]: Integración de Error Boundaries por Screen e integración de Sentry"
epic: EPIC-12
status: DONE
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-24T20:31:00+02:00"
closed_at: "2026-07-24T20:31:00+02:00"
related_historical_tickets: []
---

### 🎯 Objetivo
Evitar cierres inesperados de la app (pantalla blanca) envolviendo la navegación en Error Boundaries con UI de recuperación.

### 📋 Criterios de Aceptación
- [x] Componente `ErrorBoundary.tsx` reutilizable con botón "Reintentar".
- [x] Integración en `RootNavigator.tsx` y pantallas principales.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `App.tsx` y `RootNavigator.tsx`.

### 🛠️ Archivos Implicados
- `App.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/navigation/RootNavigator.tsx`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial desde reporte de análisis.
- `2026-07-24 20:26:00 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding.
- `2026-07-24 20:28:00 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación de tests baseline en verde.
- `2026-07-24 20:29:00 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción tras aprobación automática del plan.
- `2026-07-24 20:30:00 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a fase de pruebas tras implementar Error Boundaries, SentryService y escribir sus respectivos tests.
- `2026-07-24 20:31:00 CEST` | Estado: IN_PROGRESS_TEST ➔ DONE | Antigravity AI | Desarrollo finalizado y verificado mediante pruebas unitarias y de componentes (100% verde).
```

---

#### PF-133
```markdown
---
id: PF-133
title: "[Bug Fix]: Persistencia y reconciliación del cronómetro de descanso (count-up) tras el cierre de la App"
epic: EPIC-03
status: DONE
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-24T20:44:30+02:00"
closed_at: "2026-07-24T20:44:30+02:00"
related_historical_tickets: [PF-016, PF-036, PF-056, PF-068]
---

### 🎯 Objetivo
Garantizar que el cronómetro de descanso (que cuenta hacia arriba en segundos desde 0) continúe acumulando tiempo correctamente tras un cierre forzado (kill) de la aplicación, reanudando la cuenta transcurrida desde `started_at` sin reiniciarse a 0 ni corromper el estado.

### 📋 Criterios de Aceptación
- [x] Al reabrir la app tras un kill, se calcula `Date.now() - started_at` para mostrar el tiempo transcurrido exacto del cronómetro.
- [x] La notificación en segundo plano/pantalla de bloqueo se re-sincroniza con el tiempo acumulado.
- [x] Los botones de Detener / Resetear del cronómetro funcionan sin pérdidas de estado.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- El temporizador es un **cronómetro ascendente desde 00:00** (no cuenta atrás). El usuario lo inicia y lo consulta libremente.
- Consultar expedientes históricos de `EPIC-03` (`PF-016`, `PF-056`, `PF-068`).

### 🛠️ Archivos Implicados
- `src/components/RestTimer.tsx`
- `src/services/TimerNotificationService.ts`
- `src/controllers/useWorkoutController.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial. Especificación actualizada para cronómetro ascendente.
- `2026-07-24 20:35:40 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding para PF-133.
- `2026-07-24 20:37:10 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación exitosa de baseline tests (168 tests, 10 suites en verde).
- `2026-07-24 20:38:30 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de construcción tras aprobación de plan de implementación.
- `2026-07-24 20:44:30 CEST` | Estado: IN_PROGRESS_BUILD ➔ DONE | Antigravity AI | Desarrollo y pruebas finalizados con éxito. Reconciliación tras app kill implementada en RestTimer.tsx, checkActiveRestTimer en TimerNotificationService.ts, auto-detección en WorkoutScreen.tsx y suites de test unitarias y de componentes 100% en verde (176 unit, 72 components). Commit merge: `3ddf2b5`.
```

---

### 🟠 Prioridad P1 — Altas (Seguridad, Desduplicación y CI/CD)

#### PF-134
```markdown
---
id: PF-134
title: "[Bug Fix]: Refactor de Autenticación: eliminación de nonce inservible y unificación AuthContext/AuthService"
epic: EPIC-01
status: DONE
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-24T20:47:25+02:00"
closed_at: "2026-07-24T20:47:25+02:00"
related_historical_tickets: [PF-086]
---

### 🎯 Objetivo
Eliminar la duplicación de código entre `AuthContext` y `AuthService`, haciendo que el Context consuma el Servicio, y resolver la llamada a `Crypto.randomUUID()`.

### 📋 Criterios de Aceptación
- [x] `AuthContext` delega todas las llamadas Supabase a `AuthService`.
- [x] Se corrige o remueve la generación de `nonce` huérfana.

### 🛠️ Archivos Implicados
- `src/context/AuthContext.tsx`
- `src/services/AuthService.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-24 20:45:30 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding.
- `2026-07-24 20:45:57 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación de baseline tests (176/176 tests en verde).
- `2026-07-24 20:46:10 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción (Build) tras aprobación del plan.
- `2026-07-24 20:46:35 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a fase de pruebas tras refactorizar AuthService y AuthContext y agregar AuthService.test.ts.
- `2026-07-24 20:47:15 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Verificación de suites de pruebas unitarias (187/187 verde) y componentes (72/72 verde).
- `2026-07-24 20:47:25 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit d0da7b0).
```

---

#### PF-135
```markdown
---
id: PF-135
title: "[Bug Fix]: Robustecimiento del parser manual de URLs de OAuth para Google Sign-In"
epic: EPIC-06
status: DONE
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-25T08:23:30+02:00"
closed_at: "2026-07-25T08:23:30+02:00"
related_historical_tickets: [PF-086]
---

### 🎯 Objetivo
Sustituir el parser manual frágil en `AuthContext.tsx` por una función probada con unit tests que admita deeplinks nativos y valores con `=`.

### 🛠️ Archivos Implicados
- `src/context/AuthContext.tsx`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-25 08:19:00 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding. Revisión de PF-086 y parser manual en AuthContext.tsx.
- `2026-07-25 08:19:45 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación exitosa de baseline tests (187/187 tests, 12 suites en verde).
- `2026-07-25 08:21:00 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de construcción tras aprobación del plan de implementación.
- `2026-07-25 08:22:30 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a pruebas tras crear parseOAuthCallbackUrl.ts, refactorizar AuthContext.tsx y escribir 16 tests unitarios.
- `2026-07-25 08:23:00 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Tests unitarios (203/203) y de componentes (72/72) en verde.
- `2026-07-25 08:23:30 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit 431401b). Rama fix/oauth-url-parser preservada.
```

---

#### PF-136
```markdown
---
id: PF-136
title: "[Task]: Pipeline de Integración Continua (CI/CD) con GitHub Actions"
epic: EPIC-10
status: DONE
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:38:00+02:00"
closed_at: "2026-07-28T22:38:00+02:00"
related_historical_tickets: [PF-104, PF-128]
---

### 🎯 Objetivo
Automatizar los ejecuciones de `npm run test:unit` y `npm run test:components` en GitHub Actions en cada Push y PR.

### 🛠️ Archivos Implicados
- `.github/workflows/ci.yml`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:36:30 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding para PF-136.
- `2026-07-28 22:36:45 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación de baseline tests (203/203 verde).
- `2026-07-28 22:37:00 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción del workflow de CI.
- `2026-07-28 22:37:15 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Creado .github/workflows/ci.yml. Inicio de la fase de verificación de suites de test.
- `2026-07-28 22:37:50 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Tests unitarios (203/203) y de componentes (72/72) 100% en verde.
- `2026-07-28 22:38:00 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit 9a75b3b). Rama feature/ci-pipeline preservada.
```

---

#### PF-137
```markdown
---
id: PF-137
title: "[Task]: Definición de interfaces TypeScript estrictas para modelos de Supabase"
epic: EPIC-01
status: DONE
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T21:14:00+02:00"
closed_at: "2026-07-28T21:14:00+02:00"
related_historical_tickets: []
---

### 🎯 Objetivo
Definir interfaces estrictas para `Routine`, `Workout`, `Exercise`, `User`, `Set` eliminando casts a `any`.

### 🛠️ Archivos Implicados
- `src/types/models.ts`
- `src/services/RoutineService.ts`
- `src/services/WorkoutService.ts`
- `src/services/UserService.ts`

### 📜 Historial de Modificaciones
---

#### PF-138
```markdown
---
id: PF-138
title: "[Refactor]: Descomposición de RoutineService.ts (32 KB) en sub-servicios de dominio"
epic: EPIC-02
status: DONE
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T23:04:15+02:00"
closed_at: "2026-07-28T23:04:15+02:00"
related_historical_tickets: [PF-106, PF-126]
---

### 🎯 Objetivo
Descomponer el archivo monolítico `RoutineService.ts` (32 KB) extrayendo la gestión de entrenamientos diarios a `DailyWorkoutService.ts`.

### 📋 Criterios de Aceptación
- [x] Creación de `DailyWorkoutService.ts` encapsulando la lógica de `startDailyWorkout`, `finishDailyWorkout` y gestión de estado diario.
- [x] Preservación del 100% de la API pública en `RoutineService.ts` actuando como fachada sin romper controladores existentes.
- [x] Cobertura de tests unitarios mantenida al 100% en verde.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `RoutineService.ts` (líneas 1 a 650) e identificar funciones que operan exclusivamente sobre `rutinas_diarias`.

### 🛠️ Archivos Implicados
- `src/services/RoutineService.ts`
- `src/services/DailyWorkoutService.ts`
- `__tests__/unit/services/RoutineService.test.ts`
- `__tests__/unit/services/DailyWorkoutService.test.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:59:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios de aceptación completados.
- `2026-07-28 23:02:15 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding.
- `2026-07-28 23:03:00 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación exitosa de baseline tests (228/228 en verde).
- `2026-07-28 23:03:15 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción (Build).
- `2026-07-28 23:03:35 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a fase de pruebas tras crear DailyWorkoutService.ts, refactorizar RoutineService.ts y añadir DailyWorkoutService.test.ts.
- `2026-07-28 23:04:15 CEST` | Estado: IN_PROGRESS_TEST ➔ DONE | Antigravity AI | Descomposición completada con éxito. Creado DailyWorkoutService.ts, RoutineService.ts actúa como fachada y suite completa de pruebas unitarias y componentes 100% en verde. Commit merge: 3112528.
```

---

#### PF-139
```markdown
---
id: PF-139
title: "[Refactor]: Descomposición de ProgressService.ts (10 KB) y creación de HistoryService.ts"
epic: EPIC-04
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:59:00+02:00"
closed_at: null
related_historical_tickets: [PF-020, PF-090]
---

### 🎯 Objetivo
Separar la lógica de fotos de progreso y métricas corporales del historial de volúmenes de entrenamiento creando `HistoryService.ts`.

### 📋 Criterios de Aceptación
- [ ] Creación de `HistoryService.ts` dedicado exclusivamente a consultas de histórico de series y cargas.
- [ ] `ProgressService.ts` se enfoca únicamente en fotos de avance y registros antropométricos.
- [ ] Preservación de firmas de funciones y paso de tests en verde.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Inspeccionar `ProgressService.ts` y controladores asociados `useProgressController`.

### 🛠️ Archivos Implicados
- `src/services/ProgressService.ts`
- `src/services/HistoryService.ts`
- `__tests__/unit/services/ProgressService.test.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:59:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios de aceptación completados.
```

---

#### PF-141
```markdown
---
id: PF-141
title: "[UX / Feature]: Aviso de caducidad al copiar pesos de entrenamientos anteriores (>14 días)"
epic: EPIC-02
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:59:00+02:00"
closed_at: null
related_historical_tickets: [PF-118]
---

### 🎯 Objetivo
Mostrar una alerta o badge prudencial en la interfaz de entrenamiento cuando el peso sugerido o copiado proviene de una sesión realizada hace más de 14 días.

### 📋 Criterios de Aceptación
- [ ] `WorkoutService.ts` retorna la bandera `isStale: true` cuando `days_diff > 14`.
- [ ] Componente `WorkoutSetRow.tsx` renderiza una indicación ámbar ("Referencia de hace 15+ días").

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `PF-118` donde se eliminó la restricción rígida de 7 días.

### 🛠️ Archivos Implicados
- `src/services/WorkoutService.ts`
- `src/components/WorkoutSetRow.tsx`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:59:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios de aceptación completados.
```

---

#### PF-143
```markdown
---
id: PF-143
title: "[Test]: Pruebas unitarias para AuthService y AuthContext"
epic: EPIC-05
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:59:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Incrementar la cobertura de pruebas unitarias y de componentes para `AuthService` y `AuthContext`.

### 📋 Criterios de Aceptación
- [ ] Suite de pruebas para `signInWithEmail`, `signUpWithEmail`, `signOut` y listener de estado.
- [ ] Cobertura de tests para el contexto de autenticación en RNTL > 85%.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `AuthService.ts` y `AuthContext.tsx`.

### 🛠️ Archivos Implicados
- `__tests__/unit/services/AuthService.test.ts`
- `__tests__/unit/context/AuthContext.test.tsx`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:59:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

---

#### PF-144
```markdown
---
id: PF-144
title: "[Test]: Pruebas unitarias para TimerNotificationService y ProgressService"
epic: EPIC-05
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:59:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Escribir suites de pruebas unitarias dedicadas para `TimerNotificationService` y `ProgressService`.

### 📋 Criterios de Aceptación
- [ ] Verificación de programación y cancelación de notificaciones en `TimerNotificationService`.
- [ ] Verificación de cálculo de promedios de peso corporal y fotos en `ProgressService`.

### 🛠️ Archivos Implicados
- `__tests__/unit/services/TimerNotificationService.test.ts`
- `__tests__/unit/services/ProgressService.test.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:59:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

---

#### PF-145
```markdown
---
id: PF-145
title: "[Refactor]: Componente KeyboardAwareContainer para resolución sistémica de teclado"
epic: EPIC-06
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:59:00+02:00"
closed_at: null
related_historical_tickets: [PF-044, PF-112, PF-114, PF-116]
---

### 🎯 Objetivo
Resolver de forma sistémica la superposición del teclado virtual sobre inputs de texto creando un wrapper global reutilizable.

### 📋 Criterios de Aceptación
- [ ] Componente `KeyboardAwareContainer.tsx` envolviendo `KeyboardAvoidingView` y `ScrollView`.
- [ ] Aplicado en `WorkoutScreen`, `RoutineEditScreen` y formulación de perfiles.

### 🛠️ Archivos Implicados
- `src/components/KeyboardAwareContainer.tsx`
```

---

#### PF-146
```markdown
---
id: PF-146
title: "[Task]: Sistema de Migraciones de BD formales mediante Supabase CLI"
epic: EPIC-01
status: DONE
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T22:44:00+02:00"
closed_at: "2026-07-28T22:44:00+02:00"
related_historical_tickets: [PF-006, PF-007]
---
### 🛠️ Archivos Implicados
- `supabase/config.toml`
- `supabase/migrations/20260728000000_initial_schema.sql`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:42:30 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding para PF-146.
- `2026-07-28 22:42:55 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras baseline verde (203/203 unit tests).
- `2026-07-28 22:43:05 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción de las migraciones SQL.
- `2026-07-28 22:43:22 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Creados config.toml y 20260728000000_initial_schema.sql. Inicio de verificación de tests.
- `2026-07-28 22:43:50 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Tests unitarios (203/203) y de componentes (72/72) 100% en verde.
- `2026-07-28 22:44:00 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit c8f3081). Rama feature/supabase-migrations preservada.
```

---

## 🛑 ÉPICA 0: Necesidades Bloqueantes (Infraestructura & Pruebas E2E)

#### PF-147
```markdown
---
id: PF-147
title: "[Task]: Harness de Automatización E2E con Maestro para flujos críticos de la App"
epic: EPIC-00-BLOCKING
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: [PF-110]
---

### 🎯 Objetivo
Configurar Maestro E2E para ejecutar pruebas automatizadas en emulador Android del flujo completo: Login -> Crear Rutina -> Iniciar Workout -> Completar Serie -> Finalizar.

### 📋 Criterios de Aceptación
- [ ] Archivo `e2e/maestro/smoke_flow.yaml` ejecutable sin errores.
- [ ] Comando `npm run test:e2e` que lanza la suite sobre la build preview.
- [ ] Integración opcional en el workflow de CI de GitHub Actions.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `PF-110` donde los tests con Maestro quedaron como borrador WIP.

### 🛠️ Archivos Implicados
- `e2e/maestro/smoke_flow.yaml`
- `.github/workflows/ci.yml`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial de Épica 0.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios de aceptación completados.
```

#### PF-148
```markdown
---
id: PF-148
title: "[Task]: Centralización de Mocks Nativos (Haptics, ViewShot, SQLite, Sentry)"
epic: EPIC-00-BLOCKING
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Crear mocks reutilizables en `jest.setup.js` y `__tests__/mocks/` para `expo-haptics`, `react-native-view-shot`, `@tanstack/react-query` y `Sentry`.

### 📋 Criterios de Aceptación
- [ ] Ningún test RNTL o unitario falla al importar componentes nativos avanzadas.
- [ ] Mocks exportados y configurados globalmente.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `jest.setup.js`.

### 🛠️ Archivos Implicados
- `jest.setup.js`
- `__tests__/mocks/nativeModules.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial de Épica 0.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios de aceptación completados.
```

#### PF-149
```markdown
---
id: PF-149
title: "[Task]: Harness de prueba de integración aislada para clientes Supabase y almacenamiento local"
epic: EPIC-00-BLOCKING
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Proveer un mock stateful en memoria de Supabase para probar operaciones CRUD complejas y simulación de desconexión sin depender de red externa.

### 📋 Criterios de Aceptación
- [ ] Mock Client permite alternar estados de red (online/offline) dinámicamente durante los tests.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Revisar `src/lib/supabase.ts`.

### 🛠️ Archivos Implicados
- `__tests__/mocks/supabaseMockClient.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial de Épica 0.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

---

## 📶 ÉPICA 1: Offline-First & Sincronización Transparente (EPIC-07)

#### PF-150
```markdown
---
id: PF-150
title: "[Task]: Configuración del Almacenamiento Local (Local DB / Query Cache Persistente)"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Implementar réplica local de datos en AsyncStorage / React Query Persist client para permitir lectura/escritura de entrenamientos sin red.

### 📋 Criterios de Aceptación
- [ ] Persistencia local activa.
- [ ] Lectura instantánea de rutinas (< 50ms) desde caché local.

### 🔍 Contexto e Información Requerida (Pre-Coding)
- Configuración de `@tanstack/react-query` y `@react-native-async-storage/async-storage`.

### 🛠️ Archivos Implicados
- `src/lib/storage/localDatabase.ts`
- `src/lib/supabase.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

#### PF-151
```markdown
---
id: PF-151
title: "[Task]: Motor de Cola de Mutaciones Offline (SyncService)"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Crear `SyncService.ts` para encolar operaciones FIFO creadas sin conexión y procesarlas automáticamente al detectar reconexión de red.

### 📋 Criterios de Aceptación
- [ ] Cola `sync_queue` persistida localmente.
- [ ] Listener `NetInfo` que vacía la cola en orden estricto al reconectar.

### 🛠️ Archivos Implicados
- `src/services/SyncService.ts`
- `src/services/WorkoutService.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

#### PF-152
```markdown
---
id: PF-152
title: "[Task]: Estrategia y Algoritmo de Resolución de Conflictos de Fechas"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: [PF-131]
---

### 🎯 Objetivo
Resolver conflictos entre mutaciones locales desfasadas y el servidor mediante algoritmo *Last-Write-Wins* apoyado en `updated_at`.

### 📋 Criterios de Aceptación
- [ ] Cero duplicados en tablas de `series` y `rutinas_diarias`.
- [ ] Pruebas unitarias de resolución de conflictos en verde.

### 🛠️ Archivos Implicados
- `src/services/SyncService.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

#### PF-153
```markdown
---
id: PF-153
title: "[UI]: Componente OfflineBanner para indicación visual de red"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Crear un banner visual no intrusivo que notifique al usuario cuando la app está en modo offline.

### 📋 Criterios de Aceptación
- [ ] Animación de entrada/salida fluida al cambiar el estado de conexión.
- [ ] Test RNTL del componente.

### 🛠️ Archivos Implicados
- `src/components/OfflineBanner.tsx`
- `App.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

---

## 📊 ÉPICA 2: Analytics & Engine de Métricas Avanzadas (EPIC-04)

#### PF-154
```markdown
---
id: PF-154
title: "[Feature]: Motor de Cálculo de 1RM Estimado (Fórmulas Brzycki & Epley)"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Implementar motor de cálculo de 1 Rep Max estimado utilizando las fórmulas de Brzycki y Epley.

### 📋 Criterios de Aceptación
- [ ] Funciones puras en `analyticsUtils.ts` con cobertura del 100%.
- [ ] Integración en `AnalyticsService.ts`.

### 🛠️ Archivos Implicados
- `src/services/AnalyticsService.ts`
- `src/utils/analyticsUtils.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos y criterios completados.
```

#### PF-155
```markdown
---
id: PF-155
title: "[Feature]: Algoritmo de Agregación de Series Efectivas por Grupo Muscular"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Agrupar y sumar el número de series efectivas realizadas por cada grupo muscular en la semana actual.

### 📋 Criterios de Aceptación
- [ ] Exclusión automática de series de calentamiento.
- [ ] Retorno estructurado para gráficos de distribución.

### 🛠️ Archivos Implicados
- `src/services/AnalyticsService.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-156
```markdown
---
id: PF-156
title: "[UI]: Componente Dashboard de Métricas Avanzadas & Gráfico 1RM"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Integrar el gráfico interactivo de proyección de 1RM por ejercicio en la pantalla de progreso.

### 📋 Criterios de Aceptación
- [ ] Selector de ejercicio funcional.
- [ ] Renderizado sin fallos con `react-native-gifted-charts`.

### 🛠️ Archivos Implicados
- `src/screens/PhysicalProgressScreen.tsx`
- `src/components/AdvancedMetricsCard.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-157
```markdown
---
id: PF-157
title: "[UI]: Indicador de Fatiga y RPE Promedio Semanal"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Mostrar una tarjeta semáforo con el nivel de fatiga acumulado y RPE medio semanal.

### 📋 Criterios de Aceptación
- [ ] Indicador Verde (Óptimo), Amarillo (Alto) o Rojo (Sobreentrenamiento).

### 🛠️ Archivos Implicados
- `src/components/FatigueLevelCard.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

---

## 🏋️‍♂️ ÉPICA 3: In-Gym Experience & Live Session UX (EPIC-02)

#### PF-158
```markdown
---
id: PF-158
title: "[UI / Component]: Floating Rest-Timer Pill (PIP Style) Global"
epic: EPIC-02-INGYM
status: BACKLOG
priority: HIGH
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: [PF-133]
---

### 🎯 Objetivo
Crear una píldora flotante persistente que muestre el tiempo de descanso restante mientras el usuario navega fuera de la pantalla de entrenamiento.

### 📋 Criterios de Aceptación
- [ ] Animación de aparición/desaparición fluida (Reanimated).
- [ ] Tap en la píldora redirige de vuelta a `WorkoutScreen`.

### 🛠️ Archivos Implicados
- `src/components/FloatingTimerPill.tsx`
- `src/navigation/RootNavigator.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-159
```markdown
---
id: PF-159
title: "[Task]: Sistema de Feedback Háptico Integrado (HapticService)"
epic: EPIC-02-INGYM
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Proveer un servicio centralizado de respuesta háptica (`HapticService`) envolviendo `expo-haptics`.

### 📋 Criterios de Aceptación
- [ ] Vibraciones suaves al marcar series completadas.
- [ ] Patrón de vibración al finalizar el RestTimer.

### 🛠️ Archivos Implicados
- `src/services/HapticService.ts`
- `src/components/WorkoutSetRow.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-160
```markdown
---
id: PF-160
title: "[Feature]: Sugerencia Inteligente de Peso y RPE/RIR Basada en Histórico"
epic: EPIC-02-INGYM
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: [PF-118]
---

### 🎯 Objetivo
Precargar sugerencias inteligentes de peso y reps basadas en las series equivalentes de la sesión anterior.

### 📋 Criterios de Aceptación
- [ ] Placeholders dinámicos en los campos de entrada de series.

### 🛠️ Archivos Implicados
- `src/controllers/useWorkoutController.ts`
- `src/services/WorkoutService.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-161
```markdown
---
id: PF-161
title: "[UI]: Rediseño UX e Interactividad de WorkoutSetRow"
epic: EPIC-02-INGYM
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Mejorar los controles táctiles de incremento rápido (+2.5kg, -2.5kg) en la fila de serie.

### 📋 Criterios de Aceptación
- [ ] Botones de ajuste rápido funcionales sin abrir teclado.

### 🛠️ Archivos Implicados
- `src/components/WorkoutSetRow.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

---

## 📲 ÉPICA 4: Generador de Tarjetas Visuales & Social Sharing (EPIC-09)

#### PF-162
```markdown
---
id: PF-162
title: "[UI]: Componente Canvas de Tarjeta de Logro Estilizada (SocialCardCanvas)"
epic: EPIC-09-SOCIAL
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Crear componente canvas visual (9:16 y 1:1) formateado para resumen de entrenamiento y PRs.

### 📋 Criterios de Aceptación
- [ ] Renderizado estilizado con branding de PressFit.

### 🛠️ Archivos Implicados
- `src/components/SocialCardCanvas.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-163
```markdown
---
id: PF-163
title: "[Feature]: Motor de Captura y Generación de Imagen (ShareService)"
epic: EPIC-09-SOCIAL
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Convertir el canvas visual en archivo de imagen PNG mediante `react-native-view-shot`.

### 📋 Criterios de Aceptación
- [ ] Retorno de URI de archivo temporal nativo.

### 🛠️ Archivos Implicados
- `src/services/ShareService.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-164
```markdown
---
id: PF-164
title: "[UI / Integration]: Diálogo Nativo de Compartir (ShareModal)"
epic: EPIC-09-SOCIAL
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Abrir la hoja nativa de compartir del sistema operativo con la tarjeta generada.

### 📋 Criterios de Aceptación
- [ ] Integración con `Share.share`.

### 🛠️ Archivos Implicados
- `src/components/ShareModal.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

---

## 🎓 ÉPICA 5: Onboarding Guiado & Biblioteca de Plantillas (EPIC-08)

#### PF-165
```markdown
---
id: PF-165
title: "[UI / Screen]: Flujo de Onboarding Interactivo en 3 Pasos"
epic: EPIC-08-ONBOARDING
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Crear asistente de configuración inicial para nuevos usuarios en 3 pasos.

### 📋 Criterios de Aceptación
- [ ] Selección de Objetivo, Días/Semana y Nivel.

### 🛠️ Archivos Implicados
- `src/screens/OnboardingScreen.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-166
```markdown
---
id: PF-166
title: "[Data]: Semilla de Rutinas Prémium Predefinidas (presetRoutines.json)"
epic: EPIC-08-ONBOARDING
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Proveer archivo de plantillas de rutinas (Push/Pull/Legs, Torso/Pierna, Fullbody).

### 📋 Criterios de Aceptación
- [ ] Estructura JSON validada con TypeScript models.

### 🛠️ Archivos Implicados
- `src/assets/data/presetRoutines.json`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-167
```markdown
---
id: PF-167
title: "[Feature]: Motor de Clonación e Importación de Plantilla a Rutina Personal"
epic: EPIC-08-ONBOARDING
status: BACKLOG
priority: MEDIUM
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Clonar la plantilla seleccionada e insertarla como rutina semanal activa del usuario en Supabase.

### 📋 Criterios de Aceptación
- [ ] Método `importPresetRoutine` en `RoutineService`.

### 🛠️ Archivos Implicados
- `src/services/RoutineService.ts`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

---

## 🌍 ÉPICA 6: Internacionalización (i18n) & Refinamiento Global UX (EPIC-11)

#### PF-168
```markdown
---
id: PF-168
title: "[Feature]: Configuración de react-i18next y Extracción de Diccionarios (es.json, en.json)"
epic: EPIC-11-UX-I18N
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Configurar `react-i18next` y extraer diccionarios de texto en español e inglés.

### 📋 Criterios de Aceptación
- [ ] Detección automática del idioma del dispositivo.

### 🛠️ Archivos Implicados
- `src/i18n/index.ts`
- `src/i18n/locales/es.json`
- `src/i18n/locales/en.json`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-169
```markdown
---
id: PF-169
title: "[Refactor]: Wrapper Sistémico KeyboardAwareContainer"
epic: EPIC-11-UX-I18N
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Envolver pantallas de la aplicación en el container global de resolución de teclado.

### 📋 Criterios de Aceptación
- [ ] Cero solapamiento de teclado en formularios.

### 🛠️ Archivos Implicados
- `src/components/KeyboardAwareContainer.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

#### PF-170
```markdown
---
id: PF-170
title: "[UI]: Selector de Idioma en Pantalla de Ajustes de Usuario"
epic: EPIC-11-UX-I18N
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: null
related_historical_tickets: []
---

### 🎯 Objetivo
Permitir al usuario cambiar el idioma de la aplicación manualmente desde Ajustes.

### 📋 Criterios de Aceptación
- [ ] Persistencia de la preferencia de idioma en AsyncStorage.

### 🛠️ Archivos Implicados
- `src/screens/SettingsScreen.tsx`

### 📜 Historial de Modificaciones
- `2026-07-28 22:53:00 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 23:00:00 CEST` | Estado: BACKLOG | Antigravity AI | Metadatos completados.
```

