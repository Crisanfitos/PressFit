# Instrucciones para Usar los Scripts SQL

## Paso 1: Obtener tu User ID

Primero necesitas tu UUID de usuario. Ejecuta esto en Supabase SQL Editor:

```sql
SELECT id, email FROM profiles WHERE email = 'tu_email@ejemplo.com';
```

Copia el `id` que te devuelve (algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

## Paso 2: Eliminar el Workout Problemático (IMPORTANTE - Hazlo primero)

Ejecuta en Supabase SQL Editor:

```sql
DELETE FROM workout_sets WHERE workout_id = '25d0a644-99c9-41e0-a6fd-c657c4b61c94';
DELETE FROM workouts WHERE id = '25d0a644-99c9-41e0-a6fd-c657c4b61c94';
```

Esto eliminará el workout que está causando el problema (modo ACTIVE sin datos).

## Paso 3: Limpiar Base de Datos (OPCIONAL)

Si quieres empezar limpio, abre `cleanup_and_mock_data.sql` y:

1. Busca TODAS las ocurrencias de `'YOUR_USER_ID'` 
2. Reemplázalas con tu UUID real (el que obtuviste en Paso 1)
3. Copia la sección "SCRIPT 2: LIMPIAR BASE DE DATOS"
4. Pégala y ejecútala en Supabase SQL Editor

⚠️ **CUIDADO**: Esto borrará TODOS tus workouts y rutinas, pero **NO** borrará:
- Tu perfil de usuario
- Tus métricas (peso, altura, etc.)
- Tus fotos de progreso
- Los ejercicios disponibles

## Paso 4: Cargar Datos Mock (OPCIONAL)

Si quieres datos de ejemplo de la semana pasada:

1. Abre `cleanup_and_mock_data.sql`
2. Busca `'YOUR_USER_ID'` en la sección "SCRIPT 3"
3. Reemplázalo con tu UUID real
4. Copia TODO el script del "SCRIPT 3"
5. Pégalo y ejecútalo en Supabase SQL Editor

Esto creará:
- Una rutina de 5 días (Lunes a Viernes)
- 5 workouts completados de la semana pasada (18-22 Nov)
- 4 ejercicios por día con sets realistas
- Lunes: Pecho y Espalda
- Martes: Hombro, Bíceps, Tríceps
- Miércoles: Piernas
- Jueves: Espalda, Tríceps, Bíceps
- Viernes: Pecho y Hombro

## ¿Qué hacer ahora?

**Opción Rápida (solo arreglar el bug):**
- Ejecuta solo el Paso 2
- Reinicia la app
- El botón debería mostrar "Empezar Entrenamiento"

**Opción Completa (empezar limpio con datos mock):**
- Ejecuta Paso 2, 3 y 4
- Reinicia la app
- Tendrás una semana completa de entrenamientos pasados y una rutina configurada
