-- ==============================================================================
-- TEST USER INSERT SCRIPT (VERSIÓN COMPATIBLE CON AUTH)
-- ==============================================================================
-- IMPORTANTE: Este script usa un usuario EXISTENTE de tu base de datos.
-- 
-- PASO 1: Ejecuta esta query para obtener tu ID de usuario:
--         SELECT id, email FROM auth.users LIMIT 5;
--
-- PASO 2: Reemplaza 'TU_USER_ID_AQUI' con tu ID real de la query anterior.
--
-- PASO 3: Ejecuta el resto del script.
-- ==============================================================================

-- ⚠️ REEMPLAZA ESTE UUID CON TU ID DE USUARIO REAL ⚠️
-- Ejecuta primero: SELECT id, email FROM auth.users LIMIT 5;
-- Luego copia tu ID aquí:

DO $$
DECLARE
    -- ═══════════════════════════════════════════════════════════
    -- ⚠️ IMPORTANTE: REEMPLAZA ESTE UUID CON TU ID DE USUARIO ⚠️
    -- ═══════════════════════════════════════════════════════════
    test_user_id UUID := 'REEMPLAZA_CON_TU_USER_ID'; -- <-- CAMBIA ESTO
    -- ═══════════════════════════════════════════════════════════
    
    -- IDs para rutinas
    plantilla_id UUID;
    rutina_normal_id UUID;
    
    -- IDs para días
    plantilla_lunes_id UUID;
    plantilla_miercoles_id UUID;
    plantilla_viernes_id UUID;
    normal_lunes_id UUID;
    normal_miercoles_id UUID;
    normal_viernes_id UUID;
    
    -- IDs para ejercicios programados
    ep_press_banca_id UUID;
    ep_sentadilla_id UUID;
    ep_peso_muerto_id UUID;
    ep_normal_press_id UUID;
    ep_normal_sentadilla_id UUID;
    
    -- IDs de ejercicios del catálogo
    ejercicio_press_banca_id UUID;
    ejercicio_sentadilla_id UUID;
    ejercicio_peso_muerto_id UUID;
    
    -- Fecha del lunes de esta semana
    lunes_semana_actual DATE;
BEGIN
    -- ═══════════════════════════════════════════════════════════
    -- VALIDACIONES INICIALES
    -- ═══════════════════════════════════════════════════════════
    
    -- Verificar que se reemplazó el UUID
    IF test_user_id::TEXT = 'REEMPLAZA_CON_TU_USER_ID' THEN
        RAISE EXCEPTION '❌ ERROR: Debes reemplazar "REEMPLAZA_CON_TU_USER_ID" con tu UUID real de auth.users. Ejecuta: SELECT id, email FROM auth.users LIMIT 5;';
    END IF;
    
    -- Verificar que el usuario existe en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RAISE EXCEPTION '❌ ERROR: El usuario con ID % no existe en auth.users. Verifica el ID.', test_user_id;
    END IF;
    
    -- Calcular el lunes de la semana actual
    lunes_semana_actual := date_trunc('week', CURRENT_DATE)::DATE;
    
    -- Obtener IDs de ejercicios existentes (los primeros 3)
    SELECT id INTO ejercicio_press_banca_id FROM public.ejercicios LIMIT 1 OFFSET 0;
    SELECT id INTO ejercicio_sentadilla_id FROM public.ejercicios LIMIT 1 OFFSET 1;
    SELECT id INTO ejercicio_peso_muerto_id FROM public.ejercicios LIMIT 1 OFFSET 2;
    
    -- Verificar que existen ejercicios
    IF ejercicio_press_banca_id IS NULL THEN
        RAISE EXCEPTION '❌ ERROR: No hay ejercicios en la tabla ejercicios. Inserta algunos primero.';
    END IF;

    -- ==============================================================================
    -- 1. ASEGURAR QUE EL USUARIO EXISTE EN public.usuarios
    -- ==============================================================================
    
    INSERT INTO public.usuarios (id, email, nombre, apellidos, peso, altura)
    SELECT 
        test_user_id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', 'Usuario'),
        'Test',
        75.00,
        1.75
    FROM auth.users au WHERE au.id = test_user_id
    ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Usuario configurado: %', test_user_id;

    -- ==============================================================================
    -- 2. LIMPIAR DATOS PREVIOS DEL USUARIO (para evitar duplicados)
    -- ==============================================================================
    
    DELETE FROM public.rutinas_semanales WHERE usuario_id = test_user_id;
    RAISE NOTICE '🧹 Datos previos limpiados';

    -- ==============================================================================
    -- 3. CREAR RUTINA SEMANAL PLANTILLA
    -- ==============================================================================
    
    plantilla_id := uuid_generate_v4();
    
    INSERT INTO public.rutinas_semanales (
        id, usuario_id, nombre, es_plantilla, activa, objetivo
    ) VALUES (
        plantilla_id,
        test_user_id,
        'Plantilla_Fuerza Básica',
        TRUE,
        FALSE,
        'Rutina de fuerza 3 días/semana'
    );
    
    RAISE NOTICE '✅ Plantilla creada: %', plantilla_id;

    -- ==============================================================================
    -- 4. CREAR DÍAS DE LA PLANTILLA
    -- ==============================================================================
    
    -- Lunes (con ejercicio)
    plantilla_lunes_id := uuid_generate_v4();
    INSERT INTO public.rutinas_diarias (id, rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (plantilla_lunes_id, plantilla_id, 'Lunes', NULL);
    
    -- Martes (descanso)
    INSERT INTO public.rutinas_diarias (rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (plantilla_id, 'Martes', NULL);
    
    -- Miércoles (con ejercicio)
    plantilla_miercoles_id := uuid_generate_v4();
    INSERT INTO public.rutinas_diarias (id, rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (plantilla_miercoles_id, plantilla_id, 'Miércoles', NULL);
    
    -- Jueves (descanso)
    INSERT INTO public.rutinas_diarias (rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (plantilla_id, 'Jueves', NULL);
    
    -- Viernes (con ejercicio)
    plantilla_viernes_id := uuid_generate_v4();
    INSERT INTO public.rutinas_diarias (id, rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (plantilla_viernes_id, plantilla_id, 'Viernes', NULL);
    
    -- Sábado y Domingo (descanso)
    INSERT INTO public.rutinas_diarias (rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES 
        (plantilla_id, 'Sábado', NULL),
        (plantilla_id, 'Domingo', NULL);
    
    RAISE NOTICE '✅ 7 días de plantilla creados';

    -- ==============================================================================
    -- 5. CREAR EJERCICIOS PROGRAMADOS PARA LA PLANTILLA
    -- ==============================================================================
    
    -- Lunes: Press Banca
    ep_press_banca_id := uuid_generate_v4();
    INSERT INTO public.ejercicios_programados (id, rutina_diaria_id, ejercicio_id, orden_ejecucion)
    VALUES (ep_press_banca_id, plantilla_lunes_id, ejercicio_press_banca_id, 1);
    
    -- Miércoles: Sentadilla
    ep_sentadilla_id := uuid_generate_v4();
    INSERT INTO public.ejercicios_programados (id, rutina_diaria_id, ejercicio_id, orden_ejecucion)
    VALUES (ep_sentadilla_id, plantilla_miercoles_id, ejercicio_sentadilla_id, 1);
    
    -- Viernes: Peso Muerto
    ep_peso_muerto_id := uuid_generate_v4();
    INSERT INTO public.ejercicios_programados (id, rutina_diaria_id, ejercicio_id, orden_ejecucion)
    VALUES (ep_peso_muerto_id, plantilla_viernes_id, ejercicio_peso_muerto_id, 1);
    
    RAISE NOTICE '✅ 3 ejercicios programados creados';

    -- ==============================================================================
    -- 6. CREAR SERIES PARA LOS EJERCICIOS DE LA PLANTILLA
    -- ==============================================================================
    
    -- Press Banca: 4 series
    INSERT INTO public.series (ejercicio_programado_id, numero_serie, repeticiones, peso_utilizado, rpe)
    VALUES 
        (ep_press_banca_id, 1, 8, 60.00, 7),
        (ep_press_banca_id, 2, 8, 60.00, 8),
        (ep_press_banca_id, 3, 6, 65.00, 8),
        (ep_press_banca_id, 4, 6, 65.00, 9);
    
    -- Sentadilla: 4 series
    INSERT INTO public.series (ejercicio_programado_id, numero_serie, repeticiones, peso_utilizado, rpe)
    VALUES 
        (ep_sentadilla_id, 1, 5, 80.00, 7),
        (ep_sentadilla_id, 2, 5, 85.00, 8),
        (ep_sentadilla_id, 3, 5, 85.00, 8),
        (ep_sentadilla_id, 4, 5, 90.00, 9);
    
    -- Peso Muerto: 3 series
    INSERT INTO public.series (ejercicio_programado_id, numero_serie, repeticiones, peso_utilizado, rpe)
    VALUES 
        (ep_peso_muerto_id, 1, 5, 100.00, 7),
        (ep_peso_muerto_id, 2, 5, 110.00, 8),
        (ep_peso_muerto_id, 3, 3, 120.00, 9);
    
    RAISE NOTICE '✅ 11 series creadas para plantilla';

    -- ==============================================================================
    -- 7. CREAR RUTINA SEMANAL NORMAL (copiada de la plantilla)
    -- ==============================================================================
    
    rutina_normal_id := uuid_generate_v4();
    
    INSERT INTO public.rutinas_semanales (
        id, usuario_id, nombre, es_plantilla, activa, 
        copiada_de_id, fecha_inicio_semana, objetivo
    ) VALUES (
        rutina_normal_id,
        test_user_id,
        'Fuerza Básica',
        FALSE,
        TRUE,
        plantilla_id,
        lunes_semana_actual,
        'Rutina de fuerza 3 días/semana'
    );
    
    RAISE NOTICE '✅ Rutina normal creada (copiada de plantilla)';

    -- ==============================================================================
    -- 8. CREAR DÍAS DE LA RUTINA NORMAL (con estados variados)
    -- ==============================================================================
    
    -- Lunes (COMPLETADO)
    normal_lunes_id := uuid_generate_v4();
    INSERT INTO public.rutinas_diarias (
        id, rutina_semanal_id, nombre_dia, fecha_dia, 
        completada, hora_inicio, hora_fin
    ) VALUES (
        normal_lunes_id, 
        rutina_normal_id, 
        'Lunes', 
        lunes_semana_actual,
        TRUE,
        (lunes_semana_actual + TIME '10:00:00')::TIMESTAMP WITH TIME ZONE,
        (lunes_semana_actual + TIME '11:15:00')::TIMESTAMP WITH TIME ZONE
    );
    
    -- Martes (descanso)
    INSERT INTO public.rutinas_diarias (rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (rutina_normal_id, 'Martes', lunes_semana_actual + 1);
    
    -- Miércoles (EN PROGRESO)
    normal_miercoles_id := uuid_generate_v4();
    INSERT INTO public.rutinas_diarias (
        id, rutina_semanal_id, nombre_dia, fecha_dia,
        completada, hora_inicio, hora_fin
    ) VALUES (
        normal_miercoles_id,
        rutina_normal_id,
        'Miércoles',
        lunes_semana_actual + 2,
        FALSE,
        ((lunes_semana_actual + 2) + TIME '18:30:00')::TIMESTAMP WITH TIME ZONE,
        NULL
    );
    
    -- Jueves (descanso)
    INSERT INTO public.rutinas_diarias (rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES (rutina_normal_id, 'Jueves', lunes_semana_actual + 3);
    
    -- Viernes (PENDIENTE)
    normal_viernes_id := uuid_generate_v4();
    INSERT INTO public.rutinas_diarias (
        id, rutina_semanal_id, nombre_dia, fecha_dia,
        completada, hora_inicio, hora_fin
    ) VALUES (
        normal_viernes_id,
        rutina_normal_id,
        'Viernes',
        lunes_semana_actual + 4,
        FALSE,
        NULL,
        NULL
    );
    
    -- Sábado y Domingo
    INSERT INTO public.rutinas_diarias (rutina_semanal_id, nombre_dia, fecha_dia)
    VALUES 
        (rutina_normal_id, 'Sábado', lunes_semana_actual + 5),
        (rutina_normal_id, 'Domingo', lunes_semana_actual + 6);
    
    RAISE NOTICE '✅ 7 días de rutina normal creados (con estados variados)';

    -- ==============================================================================
    -- 9. CREAR EJERCICIOS PROGRAMADOS PARA LA RUTINA NORMAL
    -- ==============================================================================
    
    -- Lunes: Press Banca (completado)
    ep_normal_press_id := uuid_generate_v4();
    INSERT INTO public.ejercicios_programados (id, rutina_diaria_id, ejercicio_id, orden_ejecucion, notas_sesion)
    VALUES (ep_normal_press_id, normal_lunes_id, ejercicio_press_banca_id, 1, 'Buen día, me sentí fuerte');
    
    -- Miércoles: Sentadilla (en progreso)
    ep_normal_sentadilla_id := uuid_generate_v4();
    INSERT INTO public.ejercicios_programados (id, rutina_diaria_id, ejercicio_id, orden_ejecucion)
    VALUES (ep_normal_sentadilla_id, normal_miercoles_id, ejercicio_sentadilla_id, 1);
    
    RAISE NOTICE '✅ 2 ejercicios para rutina normal';

    -- ==============================================================================
    -- 10. CREAR SERIES PARA LA RUTINA NORMAL
    -- ==============================================================================
    
    -- Press Banca del Lunes (COMPLETADO)
    INSERT INTO public.series (ejercicio_programado_id, numero_serie, repeticiones, peso_utilizado, rpe)
    VALUES 
        (ep_normal_press_id, 1, 8, 62.50, 7),
        (ep_normal_press_id, 2, 8, 62.50, 7),
        (ep_normal_press_id, 3, 7, 67.50, 8),
        (ep_normal_press_id, 4, 6, 67.50, 9);
    
    -- Sentadilla del Miércoles (EN PROGRESO - 2 de 4 completadas)
    INSERT INTO public.series (ejercicio_programado_id, numero_serie, repeticiones, peso_utilizado, rpe)
    VALUES 
        (ep_normal_sentadilla_id, 1, 5, 82.50, 7),
        (ep_normal_sentadilla_id, 2, 5, 87.50, 8),
        (ep_normal_sentadilla_id, 3, NULL, NULL, NULL),
        (ep_normal_sentadilla_id, 4, NULL, NULL, NULL);
    
    RAISE NOTICE '✅ 8 series para rutina normal';

    -- ==============================================================================
    -- RESUMEN FINAL
    -- ==============================================================================
    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════════════';
    RAISE NOTICE '✅ DATASET DE TEST CREADO EXITOSAMENTE';
    RAISE NOTICE '══════════════════════════════════════════════════';
    RAISE NOTICE '👤 Usuario ID: %', test_user_id;
    RAISE NOTICE '📋 Plantilla ID: %', plantilla_id;
    RAISE NOTICE '📅 Rutina Normal ID: %', rutina_normal_id;
    RAISE NOTICE '📆 Lunes Semana Actual: %', lunes_semana_actual;
    RAISE NOTICE '';
    RAISE NOTICE '📊 Resumen:';
    RAISE NOTICE '   - 2 rutinas semanales (1 plantilla + 1 normal)';
    RAISE NOTICE '   - 14 rutinas diarias (7 por cada rutina)';
    RAISE NOTICE '   - 5 ejercicios programados';
    RAISE NOTICE '   - 19 series con datos';
    RAISE NOTICE '══════════════════════════════════════════════════';
    
END $$;

-- ==============================================================================
-- VERIFICACIÓN: Ejecuta estas queries para ver los datos creados
-- ==============================================================================

-- Ver rutinas semanales del usuario
-- SELECT id, nombre, es_plantilla, activa, copiada_de_id, fecha_inicio_semana 
-- FROM public.rutinas_semanales 
-- ORDER BY es_plantilla DESC;

-- Ver rutinas diarias con estados
-- SELECT rd.nombre_dia, rd.fecha_dia, rd.completada, 
--        CASE 
--          WHEN rd.fecha_dia IS NULL THEN 'PLANTILLA'
--          WHEN rd.hora_fin IS NOT NULL THEN 'COMPLETADA'
--          WHEN rd.hora_inicio IS NOT NULL THEN 'EN_PROGRESO'
--          ELSE 'PENDIENTE'
--        END as estado
-- FROM public.rutinas_diarias rd
-- JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
-- ORDER BY rs.es_plantilla DESC, rd.nombre_dia;
