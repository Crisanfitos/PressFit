# PressFit — Guía de Ejecución de Pruebas E2E con Maestro y Expo

Esta guía explica cómo ejecutar las pruebas End-to-End (E2E) utilizando **Maestro** y **Expo CLI** con el emulador Android (`emulator-5554`).

---

## 🔐 Configuración de Credenciales E2E

Para ejecutar flujos que requieren autenticación:
1. Copia el archivo de ejemplo `e2e/.env.e2e.example` a `e2e/.env.e2e`:
   ```bash
   cp e2e/.env.e2e.example e2e/.env.e2e
   ```
2. Configura tus credenciales de prueba en `e2e/.env.e2e`:
   ```env
   E2E_TEST_EMAIL=tu-email-de-prueba@pressfit.com
   E2E_TEST_PASSWORD=tu-password-de-prueba
   ```
3. El archivo `e2e/.env.e2e` está protegido en `.gitignore` y el ejecutor `e2e/run-maestro.js` inyecta automáticamente estas variables a Maestro.

---

## 📲 Manejo de Expo Dev Client (Development Build)

Cuando la aplicación se construye con Expo Dev Client, al lanzar la app es común que aparezca la pantalla de **Development Servers** (`http://10.0.2.2:8081` o `http://localhost:8081`).

- **Auto-Conexión en Maestro**: Todos los flujos YAML de Maestro en `e2e/maestro/` incluyen el paso condicional:
  ```yaml
  - tapOn:
      text: ".*8081.*"
      optional: true
  ```
  Esto hace que si aparece la pantalla de la launcher de Expo Dev Client, Maestro pulse automáticamente en el servidor de desarrollo `http://10.0.2.2:8081` para cargar el bundle de la aplicación sin detener la prueba.

---

## 🛠️ Flujo de Ejecución Incremental

En una **segunda terminal**, ejecuta cualquiera de los flujos incrementales:

* **01 — Hello World (Verificar lanzamiento)**:
  ```bash
  npm run test:e2e:01
  ```

* **02 — Assert Screen (Verificar pantalla de Bienvenida)**:
  ```bash
  npm run test:e2e:02
  ```

* **03 — Tap & Input (Verificar navegación e inserción de texto en Login)**:
  ```bash
  npm run test:e2e:03
  ```

* **04 — Login & Logout (Verificar autenticación completa y cierre de sesión)**:
  ```bash
  npm run test:e2e:04
  ```

* **Smoke Test Completo (Happy Path de entrenamiento)**:
  ```bash
  npm run test:e2e:smoke
  ```

---

## 💡 Consejo sobre el Menú Flotante de Expo (Dev Menu)

Si el menú desplegable de desarrollo de Expo aparece sobre la interfaz:
* Puedes presionar `Ctrl + M` (en Windows/Linux) o `Cmd + D` (en macOS) para abrir/cerrar el menú de desarrollo.
* O sacudir el emulador desde la barra de herramientas de Android Studio (botón `...` ➔ `Virtual Sensors` ➔ `Move`).
