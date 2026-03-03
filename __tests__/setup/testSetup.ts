
import dotenv from 'dotenv';
// NOTA: No importamos createClient aquí para el mock, lo hacemos dentro.

// Cargar variables de entorno (también lo haremos dentro del mock por si acaso)
dotenv.config();

// ==============================================================================
// MOCKS
// ==============================================================================

// Mock AsyncStorage globalmente
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock del módulo src/lib/supabase
// Usamos require() dentro para evitar problemas de hoisting
jest.mock('../../src/lib/supabase', () => {
    require('dotenv').config(); // Asegurar carga de vars
    const { createClient } = require('@supabase/supabase-js');

    // Configuración
    const supabaseUrl = 'https://suaxmalkquricsbwkczt.supabase.co';
    // Prioridad: Service Role Key > Anon Key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_RtII2YjTppIzINNZrUrWHg_dcG1nj3M';

    console.log('[MOCK] Inicializando Supabase Client...');
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('✅ [MOCK] Usando SERVICE ROLE KEY (Bypassing RLS)');
    } else {
        console.log('⚠️ [MOCK] Usando ANON KEY (Sujeto a RLS)');
    }

    const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    return {
        supabase: client
    };
});

// Importamos la instancia YA MOCKEADA
import { supabase } from '../../src/lib/supabase';

// ==============================================================================
// CONSTANTES GLOBALES DE TEST (DINÁMICAS)
// ==============================================================================

export let TEST_USER = {
    id: '204efe8a-b79a-41a5-8536-f2feef30e049', // UUID real proporcionado
    email: 'test_user_pressfit@test.local',
    nombre: 'Usuario',
    apellidos: 'Test'
};

// Timeout extendido
jest.setTimeout(30000);

beforeAll(async () => {
    try {
        console.log('🔄 setup: Verificando conexión Supabase...');
        // Verificar conexión básica
        const { error: countError } = await supabase.from('rutinas_semanales').select('count', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ setup: Error conectando (posible RLS block):', countError.message);
        } else {
            console.log('✅ setup: Conexión OK.');
        }

        // AUTO-DESCUBRIMIENTO DE USUARIO
        console.log('🔍 setup: Buscando usuario de test ...');

        const { data: templates } = await supabase
            .from('rutinas_semanales')
            .select('usuario_id')
            .eq('es_plantilla', true)
            .limit(1);

        if (templates && templates.length > 0) {
            const foundUserId = templates[0].usuario_id;
            console.log(`✅ setup: USUARIO ENCONTRADO: ${foundUserId}`);
            TEST_USER.id = foundUserId;
        } else {
            console.warn('⚠️ setup: NO SE ENCONTRÓ LA PLANTILLA.');
            console.warn('   Causa probable 1: No hay rutinas creadas en la base de datos.');
            console.warn('   Causa probable 2: RLS está bloqueando (Anon Key). Necesitas SUPABASE_SERVICE_ROLE_KEY en .env');
        }

    } catch (e) {
        console.error('❌ CRITICAL SETUP ERROR:', e);
        // No lanzamos para que se vean los fails individuales si es parcial
    }
});
