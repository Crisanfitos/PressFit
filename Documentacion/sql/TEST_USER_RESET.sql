-- ==============================================================================
-- TEST USER RESET SCRIPT
-- ==============================================================================
-- Este script elimina TODOS los datos del usuario de test.
-- Gracias a las políticas ON DELETE CASCADE, basta con eliminar de las tablas padre.
-- 
-- IMPORTANTE: Solo afecta al usuario con ID '11111111-1111-1111-1111-111111111111'
-- ==============================================================================

DO $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
    deleted_series INT;
    deleted_ejercicios INT;
    deleted_dias INT;
    deleted_rutinas INT;
BEGIN
    -- ==============================================================================
    -- OPCIÓN 1: ELIMINACIÓN EN CASCADA DESDE RUTINAS SEMANALES
    -- ==============================================================================
    -- Al eliminar rutinas_semanales, se eliminan automáticamente:
    -- - rutinas_diarias (FK con CASCADE)
    -- - ejercicios_programados (FK con CASCADE desde rutinas_diarias)
    -- - series (FK con CASCADE desde ejercicios_programados)
    
    -- Contar antes de eliminar (para reportar)
    SELECT COUNT(*) INTO deleted_series
    FROM public.series s
    JOIN public.ejercicios_programados ep ON s.ejercicio_programado_id = ep.id
    JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = test_user_id;
    
    SELECT COUNT(*) INTO deleted_ejercicios
    FROM public.ejercicios_programados ep
    JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = test_user_id;
    
    SELECT COUNT(*) INTO deleted_dias
    FROM public.rutinas_diarias rd
    JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
    WHERE rs.usuario_id = test_user_id;
    
    SELECT COUNT(*) INTO deleted_rutinas
    FROM public.rutinas_semanales
    WHERE usuario_id = test_user_id;
    
    -- Eliminar rutinas semanales (cascada elimina todo lo demás)
    DELETE FROM public.rutinas_semanales
    WHERE usuario_id = test_user_id;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DATOS DE RUTINAS ELIMINADOS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Series eliminadas: %', deleted_series;
    RAISE NOTICE 'Ejercicios programados eliminados: %', deleted_ejercicios;
    RAISE NOTICE 'Rutinas diarias eliminadas: %', deleted_dias;
    RAISE NOTICE 'Rutinas semanales eliminadas: %', deleted_rutinas;
    RAISE NOTICE '==========================================';

END $$;

-- ==============================================================================
-- OPCIÓN 2: ELIMINAR TAMBIÉN EL USUARIO (opcional)
-- ==============================================================================
-- Descomenta las siguientes líneas si también quieres eliminar el usuario
-- Esto eliminará también fotos_progreso, notas_personales_ejercicios, etc.

/*
DELETE FROM public.usuarios
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Nota: Esto NO elimina el usuario de auth.users (Supabase Auth)
-- Para tests, normalmente solo necesitamos limpiar los datos, no el usuario
*/

-- ==============================================================================
-- VERIFICACIÓN: Confirmar que los datos fueron eliminados
-- ==============================================================================

-- Verificar que no hay rutinas
SELECT COUNT(*) as rutinas_restantes 
FROM public.rutinas_semanales 
WHERE usuario_id = '11111111-1111-1111-1111-111111111111';

-- Verificar que el usuario aún existe (si no ejecutaste la Opción 2)
SELECT id, email, nombre 
FROM public.usuarios 
WHERE id = '11111111-1111-1111-1111-111111111111';
