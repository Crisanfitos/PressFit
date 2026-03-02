# PressFit - Project TODO

## Core Features

### Authentication & User Management
- [x] Pantalla de Bienvenida (Welcome Screen)
- [x] Pantalla de Registro (Sign Up) - Con validaciones
- [x] Pantalla de Inicio de Sesión (Sign In) - Con validaciones
- [x] Integración con Supabase Auth
- [x] Google Sign-In (configurado, pendiente SHA-1 correcto)
- [x] Email/Password Authentication
- [x] Gestión de sesiones con Supabase
- [x] Password visibility toggles
- [x] Email autocapitalization fix

### Navigation & Layout
- [x] Estructura de navegación principal (Bottom Tab Navigation)
- [x] Navegación entre pantallas (Stack Navigation)
- [x] Componentes de cabecera personalizados

### Rutinas y Ejercicios
- [x] Pantalla Plan Semanal (Weekly Plan) - Refactorizada a StyleSheet
- [x] Pantalla Workout (Workout Screen) - Refactorizada a StyleSheet
- [x] Pantalla Biblioteca de Ejercicios (Exercise Library) - Refactorizada a StyleSheet
- [ ] Pantalla Detalle de Ejercicio (Exercise Detail) - Pendiente refactoring
- [ ] Funcionalidad para agregar series y repeticiones
- [ ] Guardar progreso de entrenamientos en Supabase

### Progreso y Estadísticas
- [x] Pantalla Progreso General (Progress Overview) - Refactorizada a StyleSheet
- [x] Pantalla Progreso Diario (Daily Progress) - Refactorizada a StyleSheet
- [x] Pantalla Progreso Semanal (Weekly Progress) - Refactorizada a StyleSheet
- [ ] Pantalla Progreso Mensual (Monthly Progress) - Pendiente refactoring
- [ ] Pantalla Progreso por Ejercicio (Exercise Progress) - Pendiente refactoring
- [ ] Gráficos de evolución de volumen y peso
- [ ] Cálculo y visualización de PRs (Personal Records)

### Perfil de Usuario
- [x] Pantalla Perfil (User Profile) - Refactorizada a StyleSheet
- [x] Integración con datos reales de Supabase
- [x] Hook useUserProfile para fetch de datos
- [x] Botón de cerrar sesión funcional
- [ ] Edición de datos físicos (peso, altura, IMC, grasa corporal)
- [ ] Galería de fotos de progreso (Progress Photos)
- [ ] Pantalla Detalle de Cambio Físico (Physical Change Detail)
- [ ] Comparación de fotos antes/después

### Base de Datos y Backend
- [x] Esquema de base de datos en Supabase (PostgreSQL)
- [x] Tabla de usuarios (profiles)
- [x] Tabla de métricas de usuario (user_metrics)
- [x] Tabla de rutinas (routines)
- [x] Tabla de ejercicios (exercises)
- [x] Tabla de entrenamientos (workouts)
- [x] Tabla de series (workout_sets)
- [x] Tabla de fotos de progreso (progress_photos)
- [x] Tabla de récords personales (personal_records)
- [x] Row Level Security (RLS) policies
- [x] Trigger para crear perfil al registrarse

### Integración Supabase
- [x] Configuración de Supabase client
- [x] AuthContext con Supabase
- [x] Google Sign-In con Supabase (configurado)
- [x] Email/Password con Supabase
- [x] Fetch de datos de usuario
- [ ] CRUD de rutinas
- [ ] CRUD de ejercicios
- [ ] CRUD de entrenamientos
- [ ] CRUD de series
- [ ] Obtener progreso diario/semanal/mensual
- [ ] Obtener progreso por ejercicio
- [ ] Gestión de fotos de progreso con Supabase Storage

### UI/UX
- [x] Sistema de colores: Verde (#13ec6d) como color primario
- [x] Tema oscuro por defecto
- [x] Tipografía consistente (Lexend)
- [x] Refactoring de NativeWind a StyleSheet
  - [x] LoginScreen
  - [x] SignUpScreen
  - [x] ProfileScreen
  - [x] ProgressScreen
  - [x] WeeklyPlanScreen
  - [x] WorkoutScreen
  - [x] ExerciseLibraryScreen
  - [x] DailyProgressScreen
  - [x] WeeklyProgressScreen
  - [ ] MonthlyProgressScreen
  - [ ] ExerciseTrackingScreen
  - [ ] ExerciseDetailScreen
  - [ ] PhysicalProgressScreen
- [ ] Animaciones y transiciones suaves
- [ ] Indicadores de estado (Pendiente, Completado, Relax)
- [x] Botones flotantes para acciones principales

### Validación y Seguridad
- [x] Validación de formularios (email, password)
- [x] Manejo de errores con mensajes al usuario
- [x] Row Level Security en Supabase
- [x] Protección de rutas autenticadas (AuthContext)

### Funcionalidades Pendientes
- [ ] Implementar botón "Editar Perfil"
- [ ] Implementar botón "Agregar Foto de Progreso"
- [ ] Implementar botón "Ver Cambio Físico"
- [ ] Implementar botón "Agregar Rutina"
- [ ] Implementar botón "Guardar Progreso" en WorkoutScreen
- [ ] Implementar botón "Finalizar Entrenamiento"
- [ ] Crear/editar rutinas personalizadas
- [ ] Agregar ejercicios a rutinas
- [ ] Registrar entrenamientos completados
- [ ] Subir fotos de progreso
- [ ] Comparar fotos de progreso

### Testing
- [ ] Pruebas de autenticación
- [ ] Pruebas de componentes
- [ ] Pruebas de integración con Supabase

### Deployment
- [ ] Configuración de variables de entorno (.env)
- [ ] Build para producción
- [ ] Publicación en Google Play (Android)
- [ ] Publicación en App Store (iOS) - Opcional

## Design Reference
- Colores: Verde primario (#13ec6d), Fondo oscuro (#102218)
- Tipografía: Lexend (400, 500, 700)
- Bordes redondeados: 8px (default), 12px (lg), 24px (xl)
- Uso de StyleSheet nativo de React Native

## Bugs & Fixes
- [x] Corregir error de NativeWind en pantallas
- [x] Fix email autocapitalization
- [x] Fix password visibility toggles
- [x] Deshabilitar confirmación de email en Supabase
- [x] Configurar Google Sign-In con SHA-1
- [ ] Verificar que Google Sign-In funcione en dispositivo físico

## Notes
- La aplicación está diseñada para ser una herramienta de seguimiento de entrenamiento
- Enfoque en visualización de progreso y estadísticas
- Interfaz intuitiva y amigable para usuarios de fitness
- Soporte para múltiples tipos de ejercicios y rutinas personalizadas
- Backend con Supabase (PostgreSQL + Auth + Storage)

