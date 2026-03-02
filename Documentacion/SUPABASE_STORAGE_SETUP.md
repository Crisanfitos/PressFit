# Configuración de Supabase Storage para Fotos de Perfil

## Paso 1: Crear Buckets en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/suaxmalkquricsbwkczt
2. En el menú lateral, haz clic en **Storage**
3. Haz clic en **Create a new bucket**

### Crear bucket para fotos de perfil:
- **Name**: `profile-photos`
- **Public bucket**: ✅ Activar (para que las fotos sean accesibles públicamente)
- Haz clic en **Create bucket**

### Crear bucket para fotos de progreso:
- **Name**: `progress-photos`
- **Public bucket**: ✅ Activar
- Haz clic en **Create bucket**

## Paso 2: Configurar Políticas de Seguridad (RLS)

### Para `profile-photos`:

1. Haz clic en el bucket `profile-photos`
2. Ve a la pestaña **Policies**
3. Haz clic en **New Policy**

**Política 1: Permitir subida (INSERT)**
```sql
-- Nombre: Users can upload their own profile photos
-- Operación: INSERT
-- Target roles: authenticated

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Política 2: Permitir lectura pública (SELECT)**
```sql
-- Nombre: Public profile photos are viewable by everyone
-- Operación: SELECT
-- Target roles: public

CREATE POLICY "Public profile photos are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
```

**Política 3: Permitir actualización (UPDATE)**
```sql
-- Nombre: Users can update their own profile photos
-- Operación: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Política 4: Permitir eliminación (DELETE)**
```sql
-- Nombre: Users can delete their own profile photos
-- Operación: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Para `progress-photos`:

Repite las mismas políticas pero cambiando `profile-photos` por `progress-photos`:

```sql
-- INSERT
CREATE POLICY "Users can upload their own progress photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT
CREATE POLICY "Public progress photos are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'progress-photos');

-- UPDATE
CREATE POLICY "Users can update their own progress photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE
CREATE POLICY "Users can delete their own progress photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Paso 3: Verificar Configuración

1. Ve a **Storage** > **Policies**
2. Deberías ver 8 políticas en total (4 para cada bucket)
3. Verifica que todas estén habilitadas (toggle verde)

## Paso 4: Probar la Funcionalidad

Una vez configurado:

1. **Reconstruye la app** (importante para permisos):
   ```bash
   npm run android
   ```

2. **Prueba la subida de foto**:
   - Abre la app
   - Ve a Perfil
   - Toca el avatar
   - Selecciona "Cámara" o "Galería"
   - Toma/selecciona una foto
   - Debería subirse a Supabase

3. **Verifica en Supabase**:
   - Ve a Storage > profile-photos
   - Deberías ver tu foto subida

## Solución de Problemas

### Error: "new row violates row-level security policy"
- Verifica que las políticas estén creadas correctamente
- Asegúrate de que el usuario esté autenticado

### Error: "Bucket not found"
- Verifica que los nombres de los buckets sean exactamente `profile-photos` y `progress-photos`
- Revisa que estén marcados como públicos

### La foto no se muestra
- Verifica que el bucket sea público
- Revisa la consola del navegador/app para errores
- Verifica que la URL de la foto sea correcta

## Estructura de Archivos en Storage

```
profile-photos/
  └── {user_id}-{timestamp}.jpg

progress-photos/
  └── {user_id}-{timestamp}.jpg
```

## Notas Importantes

- Las fotos se guardan con el formato: `{user_id}-{timestamp}.{extension}`
- El `user_id` asegura que cada usuario solo pueda modificar sus propias fotos
- Los buckets son públicos para que las fotos sean visibles sin autenticación
- Las políticas RLS protegen la escritura/eliminación
