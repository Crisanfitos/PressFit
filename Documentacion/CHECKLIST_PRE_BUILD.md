# ✅ Checklist de Verificación Pre-Build

Usa este checklist antes de construir tu APK de producción.

## 🔐 Seguridad y Configuración

- [ ] **Keystore generado**
  - Archivo: `android/app/pressfit-release.keystore`
  - Comando: `keytool -genkeypair -v -storetype PKCS12 -keystore android/app/pressfit-release.keystore -alias pressfit-key -keyalg RSA -keysize 2048 -validity 10000`
  - Backup guardado en lugar seguro (OneDrive, Google Drive, USB, etc.)

- [ ] **Contraseñas configuradas**
  - Archivo: `android/gradle.properties`
  - Variables: `PRESSFIT_RELEASE_STORE_PASSWORD` y `PRESSFIT_RELEASE_KEY_PASSWORD`
  - Contraseñas documentadas en lugar seguro (gestor de contraseñas recomendado)

- [ ] **Firebase configurado**
  - SHA-1 del keystore agregado en Firebase Console
  - Comando: `.\get-sha1.ps1`
  - Archivo `google-services.json` actualizado

- [ ] **Credenciales de Supabase verificadas**
  - URL: `https://suaxmalkquricsbwkczt.supabase.co`
  - Anon Key configurada correctamente
  - Proyecto activo en Supabase Console

## 🔨 Build Configuration

- [ ] **Versión actualizada** (si es actualización)
  - `versionCode` incrementado en `android/app/build.gradle`
  - `versionName` actualizado (ej: "1.1", "2.0")

- [ ] **Dependencias instaladas**
  - Comando: `npm install`
  - Sin errores ni warnings críticos

- [ ] **Código de debug removido**
  - ✅ Ya removido: `supabase.auth.signOut()` de `App.tsx`
  - No hay console.logs con información sensible
  - No hay TODOs críticos pendientes

## 🧪 Pruebas Pre-Build

- [ ] **App funciona en modo development**
  - `npm run android` ejecuta sin errores
  - Login/SignUp funciona
  - Google Sign-In funciona
  - Navegación entre pantallas funciona
  - Imágenes se cargan correctamente

- [ ] **Build limpio**
  - Comando: `cd android; .\gradlew clean`
  - Sin errores de compilación

## 📦 Construcción del APK

- [ ] **APK construido exitosamente**
  - Comando: `.\build-apk.ps1` o `cd android; .\gradlew assembleRelease`
  - APK generado en: `android/app/build/outputs/apk/release/app-release.apk`
  - Tamaño razonable (50-80 MB aproximadamente)

- [ ] **APK firmado correctamente**
  - Comando: `jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk`
  - Mensaje: "jar verified"

## 📱 Pruebas del APK

- [ ] **Instalación exitosa**
  - Comando: `adb install -r android/app/build/outputs/apk/release/app-release.apk`
  - O instalación manual desde el dispositivo

- [ ] **Funcionalidad completa**
  - [ ] App abre sin crashear
  - [ ] Pantalla de bienvenida se muestra
  - [ ] Registro de nuevo usuario funciona
  - [ ] Login con email/password funciona
  - [ ] Google Sign-In funciona
  - [ ] Sesión persiste al cerrar y abrir la app
  - [ ] Crear rutina de ejercicios funciona
  - [ ] Ver biblioteca de ejercicios funciona
  - [ ] Seguimiento de progreso funciona
  - [ ] Subir/ver fotos funciona
  - [ ] Gráficos de progreso se muestran
  - [ ] Logout funciona

- [ ] **Pruebas en múltiples dispositivos** (recomendado)
  - [ ] Android 8 (API 26) o superior
  - [ ] Android 11 (API 30)
  - [ ] Android 13 (API 33) o superior
  - [ ] Diferentes tamaños de pantalla (pequeña, mediana, grande)

## 🚀 Pre-Publicación (Google Play Store)

- [ ] **AAB generado** (si vas a publicar en Play Store)
  - Comando: `cd android; .\gradlew bundleRelease`
  - AAB en: `android/app/build/outputs/bundle/release/app-release.aab`

- [ ] **Materiales de publicación preparados**
  - [ ] Icono de la app (512x512 PNG)
  - [ ] Feature Graphic (1024x500 PNG)
  - [ ] Screenshots (mínimo 2, recomendado 8)
  - [ ] Descripción corta (80 caracteres max)
  - [ ] Descripción completa
  - [ ] Política de privacidad (URL)
  - [ ] Categoría seleccionada
  - [ ] Calificación de contenido

- [ ] **Información legal**
  - [ ] Términos y condiciones
  - [ ] Política de privacidad publicada
  - [ ] Permisos justificados (cámara, almacenamiento, etc.)

## 📊 Monitoreo y Analytics (Opcional pero recomendado)

- [ ] **Firebase Analytics configurado**
- [ ] **Firebase Crashlytics configurado**
- [ ] **Eventos personalizados implementados**

## 🔄 Post-Publicación

- [ ] **Backup del keystore realizado**
  - Archivo: `pressfit-release.keystore`
  - Ubicaciones: 2-3 lugares diferentes (nube + físico)

- [ ] **Documentación actualizada**
  - Número de versión documentado
  - Cambios principales listados
  - Problemas conocidos documentados

- [ ] **Plan de actualización**
  - Roadmap de próximas features
  - Calendario de actualizaciones

---

## 🆘 Si algo falla

### APK no se construye
1. Verifica contraseñas en `gradle.properties`
2. Ejecuta `.\gradlew clean`
3. Verifica que el keystore existe: `Test-Path android\app\pressfit-release.keystore`

### APK se construye pero crashea
1. Revisa logs: `adb logcat | Select-String "AndroidRuntime"`
2. Verifica que todas las dependencias nativas estén linkeadas
3. Prueba reconstruir: `.\gradlew clean assembleRelease`

### Google Sign-In no funciona
1. Verifica SHA-1 en Firebase Console
2. Descarga nuevo `google-services.json`
3. Reconstruye el APK

### Supabase no conecta
1. Verifica credenciales en `src/lib/supabase.js`
2. Verifica conexión a internet
3. Revisa estado del proyecto en Supabase Console

---

## 📝 Notas

**Fecha del último build**: ___________________

**Versión**: ___________________

**Notas adicionales**:
- 
- 
- 

**Problemas encontrados**:
- 
- 
- 

**Soluciones aplicadas**:
- 
- 
- 
