# PressFit — Guía de Ejecución de Pruebas E2E con Maestro y Expo

Esta guía explica cómo ejecutar las pruebas End-to-End (E2E) utilizando **Maestro** y **Expo CLI** con el emulador Android (`emulator-5554`).

---

## 🚀 Requisitos Previos

1. **Emulador Android iniciado** en tu sistema (verificable con `emulator-5554`).
2. **Servidor Expo activo en localhost**.

---

## 🛠️ Flujo de Ejecución (Paso a Paso)

### Paso 1: Iniciar el servidor de desarrollo de Expo en Localhost
En una terminal principal, ejecuta:
```bash
npm run start:localhost
```
*(O `npx expo start --localhost` / `npx expo run:android` para instalar el build dev client en el emulador).*

---

### Paso 2: Ejecutar los Tests E2E con Maestro
En una **segunda terminal**, ejecuta la suite de pruebas que desees. Al apuntar a un archivo específico, Maestro mostrará **feedback en tiempo real paso por paso**:

* **Probar solo el flujo de Login (`login_flow.yaml`)**:
  ```bash
  npm run test:e2e
  ```

* **Probar el flujo completo Happy Path (`smoke_flow.yaml`)**:
  ```bash
  npm run test:e2e:smoke
  ```

* **Ejecutar todos los flujos de la carpeta `e2e/maestro/`**:
  ```bash
  npm run test:e2e:all
  ```

---

## 🔍 Notas de Diagnóstico y Feedback

* **Feedback paso a paso**: Si ejecutas Maestro sobre un único archivo `.yaml` (ej. `npm run test:e2e`), Maestro renderizará en la terminal cada paso con su estado (`[PASS]`, `[WAIT]`, etc.) en tiempo real.
* **Timeout o cuelgue**: Si Maestro parece colgado, verifica que la app `com.crisanfitos.pressfit` esté abierta o disponible en el emulador apuntando al bundler `localhost:8081`.
