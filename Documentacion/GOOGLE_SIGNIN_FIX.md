# Solución: Error "no ID token present" en Google Sign-In

## Problema
Google Sign-In permite seleccionar la cuenta pero falla con el error "no ID token present!". Esto ocurre porque **falta el SHA-1 fingerprint** en la configuración de Firebase.

## Solución Paso a Paso

### Paso 1: Obtener el SHA-1 Fingerprint

**Opción A: Desde Android Studio**
1. Abre Android Studio
2. En el panel derecho, click en **Gradle** (o View > Tool Windows > Gradle)
3. Navega a: `PressFit > Tasks > android > signingReport`
4. Doble click en `signingReport`
5. En la consola, busca la sección **Variant: debug**
6. Copia el valor de **SHA1** (ejemplo: `A1:B2:C3:D4:...`)

**Opción B: Desde la terminal (si keytool está en PATH)**
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```
Busca la línea que dice `SHA1:` y copia el valor.

### Paso 2: Agregar SHA-1 a Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto **pressfit-a1804**
3. Click en el ícono de **configuración** (⚙️) > **Project Settings**
4. Scroll hasta **Your apps** > selecciona tu app Android (`com.pressfit`)
5. Click en **Add fingerprint**
6. Pega el **SHA-1** que copiaste
7. Click **Save**

### Paso 3: Descargar nuevo google-services.json

1. En la misma página, click en **Download google-services.json**
2. Reemplaza el archivo en: `android/app/google-services.json`

### Paso 4: Rebuild la app

1. Detén la app en tu móvil
2. En la terminal, ejecuta:
   ```bash
   npm run android
   ```
3. Prueba Google Sign-In de nuevo

## Verificación

Después de estos pasos, al pulsar "Sign in with Google":
1. Se abrirá el selector de cuenta
2. Seleccionas tu cuenta
3. **Deberías ser redirigido a la app autenticado** (sin errores)

## Alternativa Temporal

Si no puedes obtener el SHA-1 ahora, **usa el login con email/password** que ya está funcionando:
1. Regístrate con un email y contraseña
2. Inicia sesión con esas credenciales
