# Guía de Despliegue y Control de Versiones - PressFit Expo

Esta guía detalla los pasos para generar una build (APK/AAB) de la aplicación **PressFit Expo** y cómo gestionar correctamente el versionado para actualizaciones.

## 1. Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

1.  **EAS CLI** (Expo Application Services):
    ```bash
    npm install -g eas-cli
    ```
2.  **Cuenta de Expo**: Debes tener una cuenta en [expo.dev](https://expo.dev) y estar logueado en tu terminal:
    ```bash
    eas login
    ```

## 2. Configuración Inicial (Solo la primera vez)

Si aún no tienes configurado EAS en el proyecto, ejecuta:

```bash
eas build:configure
```

Esto generará un archivo `eas.json`. Asegúrate de configurarlo para que soporte builds de Android (APK para pruebas o AAB para tienda).

Ejemplo de `eas.json` recomendado:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

*   **preview**: Genera un `.apk` instalable directamente en cualquier Android. Útil para pruebas rápidas.
*   **production**: Genera un `.aab` (Android App Bundle). Este es el formato requerido para subir a Google Play Console.

## 3. Estrategia de Versionado (IMPORTANTE)

Para que el dispositivo o la tienda detecten que es una **nueva actualización**, debes modificar dos valores en el archivo `app.json` **ANTES** de cada deploy.

Abre `PressFit_Expo/app.json` y busca la sección `expo`:

```json
{
  "expo": {
    "name": "PressFit_Expo",
    "version": "1.0.0", 
    "android": {
      "versionCode": 1,
      ...
    },
    "ios": {
      "buildNumber": "1",
      ...
    }
  }
}
```

### ¿Qué cambiar?

1.  **`version` (Visible al usuario):**
    *   Sigue el formato `MAJOR.MINOR.PATCH` (ej. `1.0.0`, `1.0.1`, `1.1.0`).
    *   Cámbialo cuando hagas cambios visibles o nuevas funcionalidades.
    *   Ejemplo: De `1.0.0` pasa a `1.0.1` para correcciones pequeñas.

2.  **`android.versionCode` (Interno del sistema - CRÍTICO):**
    *   Es un número entero (`1`, `2`, `3`...).
    *   **DEBE aumentar en cada build que subas**. Si intentas instalar una APK con el mismo `versionCode` que la anterior, Android no la actualizará. Si intentas subirla a la Play Store, la rechazará.
    *   **Regla:** Suma +1 cada vez que ejecutes `eas build`.

3.  **`ios.buildNumber` (Solo iOS):**
    *   Equivalente al `versionCode` de Android. También debe aumentar con cada build.

### Ejemplo de flujo de actualización:

**Situación Actual:**
- `version`: "1.0.0"
- `versionCode`: 1

**Haces cambios y quieres desplegar una nueva versión:**
1.  Editas `app.json`.
2.  Cambias `version` a "1.0.1" (opcional si es pequeño).
3.  Cambias `versionCode` a **2**.
4.  Guardas el archivo.
5.  Ejecutas el comando de build.

## 4. Comandos de Despliegue

Asegúrate de estar en la carpeta del proyecto Expo:
```bash
cd PressFit_Expo
```

### Opción A: Build para Pruebas (APK)
Para generar un archivo `.apk` que puedes enviar por WhatsApp, Drive o instalar directo en tu móvil.

```bash
eas build --profile preview --platform android
```
*Esto usará la configuración "preview" de tu `eas.json`.*

### Opción B: Build para Producción (Play Store - AAB)
Para generar el archivo final que se sube a la tienda.

```bash
eas build --profile production --platform android
```

### Opción C: Compilación Local (Avanzado)
> [!WARNING]
> COMPILACIÓN LOCAL EN WINDOWS
> El comando `eas build --local` para Android **NO funciona directamente en Windows**. Requiere macOS, Linux o usar WSL (Windows Subsystem for Linux).
>
> Si estás en Windows y no tienes WSL configurado, **usa la Opción A o B (Cloud Build)**. Es gratuito y lo procesan los servidores de Expo.

Si tienes un entorno compatible (macOS/Linux/WSL), puedes usar:

```bash
eas build --profile preview --platform android --local
```

## 5. Resumen del Proceso Diario

1.  Terminas de programar tus cambios.
2.  Abres `app.json`.
3.  Incrementas `versionCode` (+1).
4.  (Opcional) Incrementas `version`.
5.  Corres `eas build --profile preview --platform android`.
6.  Esperas el link de descarga y lo instalas.
