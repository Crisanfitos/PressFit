# 📋 Tablero de Backlog Activo — PressFit Expo

> **Estado**: Activo (Poblado con Issues PF-131 a PF-170)  
> **Última Actualización del Tablero**: `2026-07-28 23:00:00 CEST`  
> **Última Issue Histórica**: `PF-130`  
> **Siguiente Issue Disponible**: `PF-171`

---

## 🚦 Vistas Rápidas del Tablero

* **En Progreso (`IN_PROGRESS_*`)**: 0 tickets
* **Pendientes en Backlog (`BACKLOG`)**: 30 tickets (`PF-138`, `PF-139`, `PF-141`, `PF-143` a `PF-145`, `PF-147` a `PF-170`)
* **Bloqueados (`IN_PROGRESS_BLOCKED`)**: 0 tickets
* **Completados (`DONE`)**: 140 tickets (`PF-001` a `PF-137`, `PF-140`, `PF-142`, `PF-146`)

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
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-25 08:25:15 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio del análisis pre-coding. Inspección de tipos existentes y uso de `any`.
- `2026-07-25 08:26:30 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras baseline verde (203/203 tests).
- `2026-07-25 08:27:30 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de construcción tras aprobación del plan.
- `2026-07-28 21:13:00 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Reemplazados más de 25 casts `any` por tipos estrictos de `models.ts` en servicios.
- `2026-07-28 21:13:45 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Tests unitarios (203/203) y de componentes (72/72) 100% en verde.
- `2026-07-28 21:14:00 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit 8c27118). Rama feature/strict-typescript-models preservada.
```

---

### 🟡 Prioridad P2 — Medias (Deuda Técnica y Refactorización)

#### PF-138
```markdown
---
id: PF-138
title: "[Refactor]: Descomposición de RoutineService.ts (32 KB) en sub-servicios de dominio"
epic: EPIC-02
status: BACKLOG
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-24T20:03:25+02:00"
closed_at: null
related_historical_tickets: [PF-106, PF-126]
---

### 🎯 Objetivo
Extraer responsabilidades de entrenamientos diarios a `DailyWorkoutService.ts`.

### 🛠️ Archivos Implicados
- `src/services/RoutineService.ts`
- `src/services/DailyWorkoutService.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
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
updated_at: "2026-07-24T20:03:25+02:00"
closed_at: null
related_historical_tickets: [PF-020, PF-090]
---

### 🎯 Objetivo
Separar métricas de fotos/peso corporal del historial de volúmenes de entrenamiento.

### 🛠️ Archivos Implicados
- `src/services/ProgressService.ts`
- `src/services/HistoryService.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
```

---

#### PF-140
```markdown
---
id: PF-140
title: "[Task]: Creación del módulo central de utilidades compartidas src/utils/"
epic: EPIC-01
status: DONE
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T23:00:00+02:00"
closed_at: "2026-07-28T23:00:00+02:00"
related_historical_tickets: []
---

### 🎯 Objetivo
Poblar `src/utils/` con helpers puros de formateo de KG, fechas y validaciones de IMC.

### 🛠️ Archivos Implicados
- `src/utils/dateUtils.ts`
- `src/utils/formatters.ts`
- `__tests__/unit/utils/formatters.test.ts`
- `__tests__/unit/utils/dateUtils.test.ts`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 22:56:00 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding para PF-140.
- `2026-07-28 22:57:00 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras validación exitosa de baseline tests (203 unit, 72 components en verde).
- `2026-07-28 22:58:00 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de la fase de construcción en rama feature/central-utils-module.
- `2026-07-28 22:59:00 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a pruebas tras poblar src/utils/formatters.ts, actualizar src/utils/dateUtils.ts y escribir sus respectivas test suites.
- `2026-07-28 22:59:30 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Verificación de suites de prueba unitarias (228/228) y componentes (72/72) 100% en verde.
- `2026-07-28 23:00:00 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit 6dde42d). Rama feature/central-utils-module preservada.
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
updated_at: "2026-07-24T20:03:25+02:00"
closed_at: null
related_historical_tickets: [PF-118]
---

### 🎯 Objetivo
Mostrar una advertencia prudencial cuando el peso sugerido proviene de una sesión realizada hace más de 14 días.

### 🛠️ Archivos Implicados
- `src/services/WorkoutService.ts`
- `src/components/WorkoutSetRow.tsx`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
```

---

#### PF-142
```markdown
---
id: PF-142
title: "[UX / Performance]: Optimización del tiempo del Splash Screen inicial"
epic: EPIC-06
status: DONE
priority: LOW
reporter: Usuario / Antigravity AI
assignee: Antigravity AI
created_at: "2026-07-24T20:03:25+02:00"
updated_at: "2026-07-28T21:07:00+02:00"
closed_at: "2026-07-28T21:07:00+02:00"
related_historical_tickets: []
---

### 🎯 Objetivo
Sustituir la espera hardcodeada de 3000ms en `AuthContext.tsx` por una resolución dinámica basada en la sesión.

### 🛠️ Archivos Implicados
- `src/context/AuthContext.tsx`

### 📜 Historial de Modificaciones
- `2026-07-24 20:03:25 CEST` | Estado: CREATED ➔ BACKLOG | Antigravity AI | Registrado en backlog inicial.
- `2026-07-28 21:02:00 CEST` | Estado: BACKLOG ➔ IN_PROGRESS_ANALYSIS | Antigravity AI | Inicio de la fase de análisis pre-coding para PF-142.
- `2026-07-28 21:04:00 CEST` | Estado: IN_PROGRESS_ANALYSIS ➔ IN_PROGRESS_DESIGN | Antigravity AI | Tránsito a diseño tras baseline verde (203/203 tests, 13 suites).
- `2026-07-28 21:05:00 CEST` | Estado: IN_PROGRESS_DESIGN ➔ IN_PROGRESS_BUILD | Antigravity AI | Inicio de construcción tras aprobación del plan.
- `2026-07-28 21:06:00 CEST` | Estado: IN_PROGRESS_BUILD ➔ IN_PROGRESS_TEST | Antigravity AI | Tránsito a pruebas tras modificar initializeAuth en AuthContext.tsx.
- `2026-07-28 21:07:00 CEST` | Estado: IN_PROGRESS_TEST ➔ IN_REVIEW | Antigravity AI | Tests unitarios (203/203) y componentes (72/72) en verde.
- `2026-07-28 21:07:00 CEST` | Estado: IN_REVIEW ➔ DONE | Antigravity AI | Issue resuelta y fusionada en main (Commit aea60e8). Rama fix/splash-screen-optimization preservada.
```

---

### 🟢 Prioridad P3 — Mejoras & Cobertura de Tests

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
updated_at: "2026-07-24T20:03:25+02:00"
closed_at: null
related_historical_tickets: []
---
### 🛠️ Archivos Implicados
- `__tests__/unit/services/AuthService.test.ts`
- `__tests__/unit/context/AuthContext.test.tsx`
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
updated_at: "2026-07-24T20:03:25+02:00"
closed_at: null
related_historical_tickets: []
---
### 🛠️ Archivos Implicados
- `__tests__/unit/services/TimerNotificationService.test.ts`
- `__tests__/unit/services/ProgressService.test.ts`
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
updated_at: "2026-07-24T20:03:25+02:00"
closed_at: null
related_historical_tickets: [PF-044, PF-112, PF-114, PF-116]
---
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `e2e/maestro/smoke_flow.yaml`
- `.github/workflows/ci.yml`
```

#### PF-148
```markdown
---
id: PF-148
title: "[Task]: Centralización de Mocks Nativos (Haptics, ViewShot, SQLite, Sentry)"
epic: EPIC-00-BLOCKING
status: BACKLOG
priority: HIGH
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `jest.setup.js`
- `__tests__/mocks/nativeModules.ts`
```

#### PF-149
```markdown
---
id: PF-149
title: "[Task]: Harness de prueba de integración aislada para clientes Supabase y almacenamiento local"
epic: EPIC-00-BLOCKING
status: BACKLOG
priority: HIGH
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `__tests__/mocks/supabaseMockClient.ts`
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/lib/storage/localDatabase.ts`
```

#### PF-151
```markdown
---
id: PF-151
title: "[Task]: Motor de Cola de Mutaciones Offline (SyncService)"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: HIGH
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/SyncService.ts`
```

#### PF-152
```markdown
---
id: PF-152
title: "[Task]: Estrategia y Algoritmo de Resolución de Conflictos de Fechas"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: HIGH
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/SyncService.ts`
```

#### PF-153
```markdown
---
id: PF-153
title: "[UI]: Componente OfflineBanner para indicación visual de red"
epic: EPIC-07-OFFLINE
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/OfflineBanner.tsx`
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/AnalyticsService.ts`
- `src/utils/analyticsUtils.ts`
```

#### PF-155
```markdown
---
id: PF-155
title: "[Feature]: Algoritmo de Agregación de Series Efectivas por Grupo Muscular"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/AnalyticsService.ts`
```

#### PF-156
```markdown
---
id: PF-156
title: "[UI]: Componente Dashboard de Métricas Avanzadas & Gráfico 1RM"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/screens/PhysicalProgressScreen.tsx`
```

#### PF-157
```markdown
---
id: PF-157
title: "[UI]: Indicador de Fatiga y RPE Promedio Semanal"
epic: EPIC-04-ANALYTICS
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/FatigueLevelCard.tsx`
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/FloatingTimerPill.tsx`
```

#### PF-159
```markdown
---
id: PF-159
title: "[Task]: Sistema de Feedback Háptico Integrado (HapticService)"
epic: EPIC-02-INGYM
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/HapticService.ts`
```

#### PF-160
```markdown
---
id: PF-160
title: "[Feature]: Sugerencia Inteligente de Peso y RPE/RIR Basada en Histórico"
epic: EPIC-02-INGYM
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/controllers/useWorkoutController.ts`
```

#### PF-161
```markdown
---
id: PF-161
title: "[UI]: Rediseño UX e Interactividad de WorkoutSetRow"
epic: EPIC-02-INGYM
status: BACKLOG
priority: LOW
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/WorkoutSetRow.tsx`
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/SocialCardCanvas.tsx`
```

#### PF-163
```markdown
---
id: PF-163
title: "[Feature]: Motor de Captura y Generación de Imagen (ShareService)"
epic: EPIC-09-SOCIAL
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/ShareService.ts`
```

#### PF-164
```markdown
---
id: PF-164
title: "[UI / Integration]: Diálogo Nativo de Compartir (ShareModal)"
epic: EPIC-09-SOCIAL
status: BACKLOG
priority: LOW
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/ShareModal.tsx`
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/screens/OnboardingScreen.tsx`
```

#### PF-166
```markdown
---
id: PF-166
title: "[Data]: Semilla de Rutinas Prémium Predefinidas (presetRoutines.json)"
epic: EPIC-08-ONBOARDING
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/assets/data/presetRoutines.json`
```

#### PF-167
```markdown
---
id: PF-167
title: "[Feature]: Motor de Clonación e Importación de Plantilla a Rutina Personal"
epic: EPIC-08-ONBOARDING
status: BACKLOG
priority: MEDIUM
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/services/RoutineService.ts`
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
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/i18n/index.ts`
```

#### PF-169
```markdown
---
id: PF-169
title: "[Refactor]: Wrapper Sistémico KeyboardAwareContainer"
epic: EPIC-11-UX-I18N
status: BACKLOG
priority: LOW
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/components/KeyboardAwareContainer.tsx`
```

#### PF-170
```markdown
---
id: PF-170
title: "[UI]: Selector de Idioma en Pantalla de Ajustes de Usuario"
epic: EPIC-11-UX-I18N
status: BACKLOG
priority: LOW
assignee: Antigravity AI
created_at: "2026-07-28T22:53:00+02:00"
---
### 🛠️ Archivos Implicados
- `src/screens/SettingsScreen.tsx`
```

