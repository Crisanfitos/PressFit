# 🚀 Guía de Despliegue a Producción - PressFit

Esta guía detalla los pasos necesarios para preparar y desplegar la aplicación **PressFit** en producción, asegurando que Google Sign-In y otros servicios funcionen correctamente.

## 🔐 1. Gestión de Claves (Keystores)

La aplicación utiliza dos keystores diferentes. Es CRÍTICO no perder el de producción.

### Debug Keystore (Desarrollo)
- **Ubicación**: `android/app/debug.keystore`
- **Uso**: Se usa automáticamente al ejecutar `npm run android`.
- **SHA-1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **Estado**: Configurado y funcionando.

### Release Keystore (Producción)
- **Ubicación**: `android/app/pressfit-release.keystore`
- **Uso**: Se usa para generar el APK/AAB final para Google Play.
- **SHA-1**: `90:ED:46:93:7B:6B:AD:FB:88:12:FA:70:F9:C6:34:15:4A:7C:91:5A`
- **Contraseña**: (La que definiste al crearlo)
- **Alias**: (El que definiste, usualmente `my-key-alias` o similar)

> [!IMPORTANT]
> **NUNCA subas el archivo `pressfit-release.keystore` al repositorio.** Guárdalo en un lugar seguro (Google Drive, 1Password, USB seguro).

---

## ☁️ 2. Configuración Google Sign-In para Producción

Para que el login funcione en la app descargada de la tienda (o el APK de release), debes configurar el **SHA-1 de Release** en Firebase y Google Cloud.

### Paso 2.1: Verificar SHA-1 en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Project Settings -> Your apps -> Android.
3. Asegúrate de que el SHA-1 de Release (`90:ED:46...`) esté agregado.

### Paso 2.2: Crear OAuth Client para Producción
1. Ve a [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Crea un **NUEVO** OAuth Client ID para Android.
3. Usa el Package Name: `com.pressfit`.
4. Usa el **SHA-1 de Release**: `90:ED:46:93:7B:6B:AD:FB:88:12:FA:70:F9:C6:34:15:4A:7C:91:5A`.
5. **Guarda el Client ID** que se genere.

### Paso 2.3: Actualizar google-services.json
Firebase no siempre actualiza el archivo automáticamente con múltiples clientes. Para producción, tu `google-services.json` debe tener **AMBOS** clientes (Debug y Release) en el array `oauth_client`.

Edita `android/app/google-services.json` y asegúrate de que `oauth_client` se vea así:

```json
"oauth_client": [
  {
    "client_id": "CLIENT_ID_DEBUG_QUE_YA_TIENES",
    "client_type": 1,
    "android_info": {
      "package_name": "com.pressfit",
      "certificate_hash": "5E8F16062EA3CD2C4A0D547876BAA6F38CABF625" // Hash Debug
    }
  },
  {
    "client_id": "NUEVO_CLIENT_ID_DE_RELEASE",
    "client_type": 1,
    "android_info": {
      "package_name": "com.pressfit",
      "certificate_hash": "90ED46937B6BADFB8812FA70F9C634154A7C915A" // Hash Release
    }
  },
  {
    "client_id": "WEB_CLIENT_ID_DE_SUPABASE",
    "client_type": 3
  }
]
```

---

## 📦 3. Generar APK/AAB de Producción

Para generar la versión final:

1. **Limpiar proyecto**:
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Generar Release Bundle (AAB)** (Recomendado para Play Store):
   ```bash
   ./gradlew bundleRelease
   ```
   El archivo estará en: `android/app/build/outputs/bundle/release/app-release.aab`

3. **Generar APK (para pruebas locales)**:
   ```bash
   ./gradlew assembleRelease
   ```
   El archivo estará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🛡️ 4. Seguridad y Git

Hemos configurado `.gitignore` para ignorar archivos sensibles.

**Archivos que NO se subirán:**
- `*.keystore` (claves de firma)
- `google-services.json` (configuración de Firebase)
- `android/app/build/` (archivos generados)
- `node_modules/`

**Recomendación**:
Si trabajas en equipo, comparte el `google-services.json` y los keystores de forma segura (ej. 1Password, Vault), **nunca** por chat o email inseguro.

---

## 🔄 5. Actualización de Versiones

Para futuras actualizaciones:

1. Abre `package.json` y sube la versión (ej. `0.1.0` -> `0.1.1`).
2. Abre `android/app/build.gradle` y actualiza:
   - `versionCode`: Incrementa en 1 (ej. `2` -> `3`).
   - `versionName`: Iguala al package.json (ej. `"0.1.1"`).

---

## ✅ Checklist Pre-Lanzamiento

- [ ] SHA-1 Release agregado a Firebase.
- [ ] OAuth Client de Release creado en Google Cloud.
- [ ] `google-services.json` actualizado con ambos clientes.
- [ ] App probada en modo Release (`npm run android -- --mode=release`).
- [ ] Versión actualizada en `package.json` y `build.gradle`.
