-- ==============================================================================
-- CONFIGURACIÓN INICIAL Y EXTENSIONES
-- ==============================================================================

-- Habilitar extensión para generar UUIDs (Identificadores únicos universales)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar automáticamente el campo 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 1. TABLA DE USUARIOS (Perfil Público/Privado)
-- ==============================================================================
-- Nota: Esta tabla extiende la tabla 'auth.users' de Supabase.
-- No guardamos contraseñas aquí. Se gestionan en el esquema 'auth'.

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    nombre TEXT,
    apellidos TEXT,
    peso NUMERIC(5,2), -- Ej: 85.50
    altura NUMERIC(3,2), -- Ej: 1.80 (metros)
    imc NUMERIC(4,2), -- Índice de Masa Corporal
    grasa_corporal NUMERIC(4,1) CHECK (grasa_corporal BETWEEN 0 AND 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) - Seguridad a nivel de fila
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Usuarios ven su propio perfil" ON public.usuarios
    FOR ALL USING (auth.uid() = id);

-- Trigger para manejar updated_at
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 2. TABLA DE FOTOS DE PROGRESO
-- ==============================================================================

CREATE TABLE public.fotos_progreso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL, -- URL pública del Storage de Supabase
    comentario TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fotos_progreso ENABLE ROW LEVEL SECURITY;

-- Política: Solo el dueño ve sus fotos
CREATE POLICY "Usuarios gestionan sus fotos" ON public.fotos_progreso
    FOR ALL USING (auth.uid() = usuario_id);

CREATE TRIGGER update_fotos_progreso_updated_at
    BEFORE UPDATE ON public.fotos_progreso
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 3. TABLA DE EJERCICIOS (Catálogo Maestro) - MIGRACIÓN
-- ==============================================================================

-- Renombrar tabla existente
ALTER TABLE public.exercises RENAME TO ejercicios;

-- Renombrar columnas
ALTER TABLE public.ejercicios RENAME COLUMN name TO titulo;
ALTER TABLE public.ejercicios RENAME COLUMN video_url TO url_video;
ALTER TABLE public.ejercicios RENAME COLUMN image_url TO url_foto;
ALTER TABLE public.ejercicios RENAME COLUMN primary_muscles TO musculos_primarios;
ALTER TABLE public.ejercicios RENAME COLUMN secondary_muscles TO musculos_secundarios;
ALTER TABLE public.ejercicios RENAME COLUMN difficulty TO dificultad;
ALTER TABLE public.ejercicios RENAME COLUMN category TO categoria;


-- Habilitar RLS (ya debería estar, pero aseguramos)
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;

-- Política: Todo el mundo puede LEER ejercicios
DROP POLICY IF EXISTS "Exercises are viewable by everyone." ON public.ejercicios;
CREATE POLICY "Ejercicios públicos para leer" ON public.ejercicios
    FOR SELECT USING (true);

CREATE TRIGGER update_ejercicios_updated_at
    BEFORE UPDATE ON public.ejercicios
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 4. TABLA DE NOTAS PERSONALES SOBRE EJERCICIOS
-- ==============================================================================

CREATE TABLE public.notas_personales_ejercicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    ejercicio_id UUID NOT NULL REFERENCES public.ejercicios(id) ON DELETE CASCADE,
    contenido_nota TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un usuario solo debería tener una nota general por ejercicio (opcional)
    UNIQUE(usuario_id, ejercicio_id)
);

ALTER TABLE public.notas_personales_ejercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gestionan sus notas" ON public.notas_personales_ejercicios
    FOR ALL USING (auth.uid() = usuario_id);

CREATE TRIGGER update_notas_ejercicios_updated_at
    BEFORE UPDATE ON public.notas_personales_ejercicios
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 5. TABLA DE RUTINAS SEMANALES
-- ==============================================================================

CREATE TABLE public.rutinas_semanales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    
    -- Identidad y Clonado
    nombre TEXT NOT NULL DEFAULT 'Nueva Rutina',
    copiada_de_id UUID REFERENCES public.rutinas_semanales(id) ON DELETE SET NULL, -- Referencia recursiva
    es_plantilla BOOLEAN DEFAULT FALSE, -- Si es TRUE, es un modelo a copiar
    
    -- Datos de la semana real
    fecha_inicio_semana DATE,
    objetivo TEXT,
    activa BOOLEAN DEFAULT FALSE, -- Marca cual es la rutina en curso
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.rutinas_semanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gestionan sus rutinas" ON public.rutinas_semanales
    FOR ALL USING (auth.uid() = usuario_id);

CREATE TRIGGER update_rutinas_semanales_updated_at
    BEFORE UPDATE ON public.rutinas_semanales
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 6. TABLA DE RUTINAS DIARIAS
-- ==============================================================================

CREATE TABLE public.rutinas_diarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rutina_semanal_id UUID NOT NULL REFERENCES public.rutinas_semanales(id) ON DELETE CASCADE,
    
    nombre_dia TEXT NOT NULL, -- 'Lunes', 'Día de Pierna', etc.
    fecha_dia DATE, -- Puede ser NULL si es una plantilla
    
    -- Estado y Tiempos
    completada BOOLEAN DEFAULT FALSE,
    hora_inicio TIMESTAMP WITH TIME ZONE,
    hora_fin TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.rutinas_diarias ENABLE ROW LEVEL SECURITY;

-- Política compleja simplificada: si tienes acceso a la semanal, tienes a la diaria
-- En Supabase a veces se hacen joins en las políticas, pero por rendimiento simplificamos:
-- Como el usuario crea la rutina, es el dueño.
CREATE POLICY "Usuarios ven sus dias" ON public.rutinas_diarias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rutinas_semanales rs 
            WHERE rs.id = rutinas_diarias.rutina_semanal_id 
            AND rs.usuario_id = auth.uid()
        )
    );

CREATE TRIGGER update_rutinas_diarias_updated_at
    BEFORE UPDATE ON public.rutinas_diarias
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 7. TABLA DE EJERCICIOS PROGRAMADOS (La Instancia)
-- ==============================================================================

CREATE TABLE public.ejercicios_programados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rutina_diaria_id UUID NOT NULL REFERENCES public.rutinas_diarias(id) ON DELETE CASCADE,
    ejercicio_id UUID NOT NULL REFERENCES public.ejercicios(id) ON DELETE RESTRICT,
    
    orden_ejecucion INTEGER NOT NULL DEFAULT 1,
    notas_sesion TEXT, -- Comentario específico de este día ("Me dolió el hombro hoy")
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ejercicios_programados ENABLE ROW LEVEL SECURITY;

-- Política de acceso basada en cascada (Similar a rutinas diarias)
CREATE POLICY "Usuarios gestionan sus ejercicios programados" ON public.ejercicios_programados
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rutinas_diarias rd
            JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
            WHERE rd.id = ejercicios_programados.rutina_diaria_id
            AND rs.usuario_id = auth.uid()
        )
    );

CREATE TRIGGER update_ejer_prog_updated_at
    BEFORE UPDATE ON public.ejercicios_programados
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 8. TABLA DE SERIES
-- ==============================================================================

CREATE TABLE public.series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ejercicio_programado_id UUID NOT NULL REFERENCES public.ejercicios_programados(id) ON DELETE CASCADE,
    
    numero_serie INTEGER NOT NULL, -- 1, 2, 3...
    repeticiones INTEGER,
    peso_utilizado NUMERIC(6,2), -- Kilos o Libras
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10), -- Esfuerzo Percibido
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gestionan sus series" ON public.series
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ejercicios_programados ep
            JOIN public.rutinas_diarias rd ON ep.rutina_diaria_id = rd.id
            JOIN public.rutinas_semanales rs ON rd.rutina_semanal_id = rs.id
            WHERE ep.id = series.ejercicio_programado_id
            AND rs.usuario_id = auth.uid()
        )
    );

CREATE TRIGGER update_series_updated_at
    BEFORE UPDATE ON public.series
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==============================================================================
-- AUTOMATIZACIÓN DE USUARIOS (Auth -> Public)
-- ==============================================================================
-- Esta función asegura que cuando un usuario se registra en Supabase Auth,
-- se crea automáticamente su ficha en nuestra tabla 'public.usuarios'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador tras el registro
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==============================================================================
-- CONFIGURACIÓN DE STORAGE (Buckets)
-- ==============================================================================
-- Nota: Esto se suele hacer en la UI, pero aquí está el SQL para crearlo si tienes permisos.
-- Insertamos en la tabla de configuración interna de Supabase 'storage.buckets'

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-progreso', 'fotos-progreso', false) -- Privado, requiere token/autenticación
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('multimedia-ejercicios', 'multimedia-ejercicios', true) -- Público para ver videos/iconos
ON CONFLICT (id) DO NOTHING;

-- Políticas de Seguridad para Storage (Simplificadas)
-- 1. Fotos Progreso: Usuario solo ve y sube las suyas (carpeta con su uuid)
CREATE POLICY "Acceso Fotos Progreso" ON storage.objects
FOR ALL USING (
    bucket_id = 'fotos-progreso' 
    AND auth.uid()::text = (storage.foldername(name))[1] 
);

-- 2. Multimedia Ejercicios: Cualquiera ve, solo admin sube (esto último requiere configurar roles admin)
CREATE POLICY "Ver Multimedia Ejercicios" ON storage.objects
FOR SELECT USING ( bucket_id = 'multimedia-ejercicios' );


-- ==============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN DE LA ESTRUCTURA
-- ==============================================================================

COMMENT ON TABLE public.usuarios IS 'Perfil extendido del usuario. Se sincroniza con auth.users automáticamente. Contiene datos biométricos.';
COMMENT ON COLUMN public.usuarios.email IS 'Email único validado. Coincide con el login de Supabase.';

COMMENT ON TABLE public.rutinas_semanales IS 'Contenedor principal. Puede actuar como plantilla (es_plantilla=true) o como una semana activa de entrenamiento.';
COMMENT ON COLUMN public.rutinas_semanales.copiada_de_id IS 'Puntero a la rutina anterior o plantilla de la que nació esta semana. Vital para gráficas de progreso.';

COMMENT ON TABLE public.rutinas_diarias IS 'Representa un día (Lunes, Martes). Contiene los tiempos de inicio y fin para calcular duración de sesión.';

COMMENT ON TABLE public.ejercicios_programados IS 'Tabla pivote/intermedia. Instancia un ejercicio del catálogo dentro de un día específico. Contiene las notas de esa sesión específica.';

COMMENT ON TABLE public.series IS 'La unidad mínima de datos. Guarda repeticiones, peso y RPE (esfuerzo 1-10).';

COMMENT ON TABLE public.fotos_progreso IS 'Galería del usuario. Las imágenes reales viven en Supabase Storage, aquí guardamos la URL y metadata.';