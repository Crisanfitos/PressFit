# 📱 Guía Completa para Construir APK de PressFit

## ✅ Cambios Realizados

1. ✅ Configurado release keystore en `build.gradle`
2. ✅ Eliminado código de cierre de sesión automático en `App.tsx`
3. ✅ Agregadas propiedades de keystore en `gradle.properties`
4. ✅ Creado archivo de ejemplo `gradle.properties.example`

---

## 🔑 Paso 1: Generar Release Keystore (Solo una vez)

**IMPORTANTE: Solo necesitas hacer esto UNA VEZ. Guarda bien el keystore y las contraseñas.**

### Opción A: Usando la ruta completa de keytool (Recomendado si keytool no está en PATH)

```powershell
cd c:\PressFit\PressFitNew\android\app
& "C:\Program Files\Java\jdk-20\bin\keytool.exe" -genkeypair -v -storetype PKCS12 -keystore pressfit-release.keystore -alias pressfit-key -keyalg RSA -keysize 2048 -validity 10000
```

### Opción B: Si keytool está en tu PATH

```powershell
cd c:\PressFit\PressFitNew\android\app
keytool -genkeypair -v -storetype PKCS12 -keystore pressfit-release.keystore -alias pressfit-key -keyalg RSA -keysize 2048 -validity 10000
```

**Nota**: Si tienes otra versión de JDK, ajusta la ruta. Ubicaciones comunes:
- `C:\Program Files\Java\jdk-20\bin\keytool.exe`
- `C:\Program Files\Java\latest\bin\keytool.exe`
- `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`

Cuando te pida información:
- **Contraseña del keystore**: Elige una contraseña SEGURA (mínimo 6 caracteres)
- **Contraseña de la clave**: Usa la MISMA contraseña
- **Nombre y apellido**: Tu nombre
- **Unidad organizativa**: PressFit
- **Organización**: PressFit
- **Ciudad**: Tu ciudad
- **Estado**: Tu estado/provincia
- **Código del país (2 letras)**: Tu país (ej: MX, ES, AR, etc.)

⚠️ **MUY IMPORTANTE**: 
- Guarda el archivo `pressfit-release.keystore` en un lugar seguro (haz backup)
- Guarda las contraseñas en un lugar seguro (las necesitarás siempre)
- **SIN ESTE ARCHIVO NO PODRÁS ACTUALIZAR TU APP EN PLAY STORE**

---

## ⚙️ Paso 2: Configurar las Contraseñas

Edita el archivo `c:\PressFit\PressFitNew\android\gradle.properties`:

```properties
# Reemplaza TU_PASSWORD_AQUI con la contraseña que usaste
PRESSFIT_RELEASE_STORE_FILE=pressfit-release.keystore
PRESSFIT_RELEASE_KEY_ALIAS=pressfit-key
PRESSFIT_RELEASE_STORE_PASSWORD=TU_PASSWORD_AQUI
PRESSFIT_RELEASE_KEY_PASSWORD=TU_PASSWORD_AQUI
```

⚠️ **IMPORTANTE**: No subas este archivo a Git con las contraseñas reales. Considera usar un `.gitignore` local.

---

## 🏗️ Paso 3: Construir el APK de Release

### Opción A: APK Normal (Recomendado para pruebas)

```powershell
cd c:\PressFit\PressFitNew\android
.\gradlew clean
.\gradlew assembleRelease
```

El APK se generará en:
```
c:\PressFit\PressFitNew\android\app\build\outputs\apk\release\app-release.apk
```

### Opción B: Bundle AAB (Para Google Play Store)

```powershell
cd c:\PressFit\PressFitNew\android
.\gradlew clean
.\gradlew bundleRelease
```

El AAB se generará en:
```
c:\PressFit\PressFitNew\android\app\build\outputs\bundle\release\app-release.aab
```

---

## 📦 Paso 4: Instalar el APK en tu Dispositivo

### Método 1: Usando ADB (Android Debug Bridge)

```powershell
# Conecta tu dispositivo por USB y habilita "Depuración USB"
adb install c:\PressFit\PressFitNew\android\app\build\outputs\apk\release\app-release.apk
```

### Método 2: Transferencia Manual

1. Copia el archivo `app-release.apk` a tu teléfono (por USB, correo, Drive, etc.)
2. En el teléfono, abre el archivo APK
3. Permite "Instalar desde fuentes desconocidas" si te lo pide
4. Instala la aplicación

---

## 🔍 Verificación de Funcionalidad

Una vez instalado, verifica:

### ✅ Checklist de Pruebas

- [ ] La app se abre sin crashear
- [ ] Puedes registrarte/iniciar sesión
- [ ] Google Sign-In funciona correctamente
- [ ] Puedes ver y crear rutinas de ejercicios
- [ ] Las imágenes se cargan correctamente
- [ ] El seguimiento de progreso funciona
- [ ] La app persiste la sesión al cerrar y abrir

### 🐛 Si algo no funciona:

1. **La app crashea al abrir:**
   - Verifica que el keystore esté firmado correctamente
   - Revisa los logs: `adb logcat | Select-String "ReactNative"`

2. **Google Sign-In no funciona:**
   - Verifica que `google-services.json` esté correctamente configurado
   - El SHA-1 del keystore debe estar registrado en Firebase Console:
   ```powershell
   # Opción 1: Usar el script
   .\get-sha1.ps1
   
   # Opción 2: Manual con ruta completa
   & "C:\Program Files\Java\jdk-20\bin\keytool.exe" -list -v -keystore c:\PressFit\PressFitNew\android\app\pressfit-release.keystore -alias pressfit-key
   ```
   Copia el SHA-1 y agrégalo en Firebase Console → Project Settings → Your apps → Android app

3. **Supabase no conecta:**
   - Las credenciales hardcodeadas deberían funcionar
   - Verifica tu conexión a internet
   - Revisa la consola de Supabase para errores

---

## 🚀 Para Publicar en Google Play Store

Cuando estés listo para publicar:

1. **Genera el AAB** (no APK):
   ```powershell
   cd c:\PressFit\PressFitNew\android
   .\gradlew bundleRelease
   ```

2. **Incrementa la versión** en `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Incrementa este número
   versionName "1.1"  // Incrementa la versión visible
   ```

3. **Sube el AAB** a Google Play Console

4. **Completa la información requerida**:
   - Descripción de la app
   - Screenshots
   - Política de privacidad
   - Categoría
   - Calificación de contenido

---

## 🔒 Seguridad - Recomendaciones Adicionales

### 1. Variables de Entorno (Opcional pero recomendado)

Para producción, considera mover las credenciales de Supabase a variables de entorno:

```bash
npm install react-native-config
```

Crea un archivo `.env`:
```
SUPABASE_URL=https://suaxmalkquricsbwkczt.supabase.co
SUPABASE_ANON_KEY=sb_publishable_RtII2YjTppIzINNZrUrWHg_dcG1nj3M
```

Y usa `Config.SUPABASE_URL` en lugar de hardcodear.

### 2. Habilitar ProGuard (Opcional)

Para reducir el tamaño del APK y ofuscar el código:

En `android/app/build.gradle`:
```gradle
def enableProguardInReleaseBuilds = true
```

---

## 📊 Tamaño del APK

El APK incluye múltiples arquitecturas. Tamaño esperado:
- **APK Universal**: ~50-80 MB (incluye todas las arquitecturas)
- **AAB (Play Store)**: Play Store genera APKs optimizados de ~20-30 MB por arquitectura

Para reducir tamaño, puedes generar APKs separados por arquitectura:
```powershell
.\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

---

## 🆘 Solución de Problemas Comunes

### Error: "Keystore was tampered with, or password was incorrect"
- Verifica que la contraseña en `gradle.properties` sea correcta
- Asegúrate de que el archivo `pressfit-release.keystore` no esté corrupto

### Error: "SDK location not found"
- Crea/edita `android/local.properties`:
  ```
  sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
  ```

### Error: "Task :app:validateSigningRelease FAILED"
- El keystore no existe o la ruta es incorrecta
- Verifica que `pressfit-release.keystore` esté en `android/app/`

### APK se instala pero crashea inmediatamente
- Revisa logs: `adb logcat | Select-String "AndroidRuntime"`
- Verifica que todas las dependencias nativas estén linkeadas correctamente
- Prueba limpiar y reconstruir: `.\gradlew clean assembleRelease`

---

## 📝 Comandos Útiles

```powershell
# Ver información del keystore
& "C:\Program Files\Java\jdk-20\bin\keytool.exe" -list -v -keystore app\pressfit-release.keystore -alias pressfit-key

# Verificar si el APK está firmado
jarsigner -verify -verbose -certs app\build\outputs\apk\release\app-release.apk

# Ver tamaño del APK
Get-Item app\build\outputs\apk\release\app-release.apk | Select-Object Length

# Instalar APK por ADB
adb install -r app\build\outputs\apk\release\app-release.apk

# Ver logs en tiempo real
adb logcat | Select-String "ReactNativeJS"
```

---

## ✅ Checklist Final

Antes de construir el APK final, asegúrate de:

- [ ] Keystore generado y guardado de forma segura
- [ ] Contraseñas configuradas en `gradle.properties`
- [ ] Código de cierre de sesión automático removido
- [ ] `versionCode` y `versionName` correctos
- [ ] Google Services configurado correctamente
- [ ] Credenciales de Supabase funcionando
- [ ] Probado en modo debug (`npm run android`)
- [ ] Limpiado build anterior (`.\gradlew clean`)

---

## 🎉 ¡Listo!

Ahora tu app está lista para ser construida y distribuida. Si encuentras algún problema, revisa la sección de "Solución de Problemas" o los logs de error.

**Próximos pasos recomendados:**
1. Probar el APK en múltiples dispositivos
2. Implementar analytics (Firebase Analytics)
3. Configurar crash reporting (Firebase Crashlytics)
4. Optimizar el rendimiento
5. Preparar la publicación en Play Store
