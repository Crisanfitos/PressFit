# PressFit 🏋️‍♂️

![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

> **Nota Personal**: Este proyecto nació de una frustración real. Después de probar innumerables aplicaciones de fitness, sentía que ninguna se adaptaba a lo que yo buscaba: una herramienta simple, limpia y sin distracciones, pero lo suficientemente potente para registrar mis datos de entrenamiento de forma efectiva. PressFit es mi respuesta a esa necesidad, desarrollada desde cero para ser la app que yo mismo quería usar.

## 📱 Sobre el Proyecto

PressFit es una aplicación móvil de seguimiento de entrenamientos diseñada para eliminar la fricción en el gimnasio. El objetivo es simple: menos tiempo configurando la app y más tiempo levantando peso.

La aplicación permite a los usuarios planificar sus rutinas semanales, registrar cada serie, repetición y peso en tiempo real, y visualizar su progreso a lo largo del tiempo mediante gráficos intuitivos. Todo esto envuelto en una interfaz moderna, rápida y agradable de usar.

## ✨ Características Principales

- **📅 Planificación Semanal Intuitiva**: Organiza tus rutinas por días de la semana. De un vistazo, sabes exactamente qué te toca entrenar hoy.
- **📝 Registro de Entrenamientos en Vivo**: Una interfaz optimizada para registrar tus series, repeticiones y peso (incluyendo RPE) mientras entrenas, sin menús complicados.
- **📈 Visualización de Progreso**: Gráficos detallados (powered by Victory Native) que te permiten ver tu evolución de fuerza y volumen en cada ejercicio a lo largo del tiempo.
- **👤 Gestión de Perfil Completa**: Personaliza tu perfil, gestiona tu foto (con integración de cámara y galería) y mantén tus datos actualizados.
- **🔐 Autenticación Robusta**: Sistema de login seguro utilizando Google Sign-In y correo electrónico, gestionado integramente por Supabase.
- **☁️ Sincronización en la Nube**: Todos tus datos están seguros y sincronizados en tiempo real gracias a PostgreSQL.

## 🛠️ Stack Tecnológico

Este proyecto ha sido construido utilizando un stack moderno y eficiente, priorizando el rendimiento y la experiencia de desarrollo.

### Frontend
- **[React Native](https://reactnative.dev/) (v0.82)**: Framework principal para crear una experiencia nativa fluida en Android (y iOS).
- **[NativeWind](https://www.nativewind.dev/) (TailwindCSS)**: Para el estilizado de la UI. Permite un desarrollo rápido de interfaces hermosas y consistentes utilizando las clases de utilidad de Tailwind.
- **[React Navigation](https://reactnavigation.org/) (v7)**: La última versión para manejar la navegación entre pantallas, pestañas y stacks de forma nativa.
- **[Victory Native](https://formidable.com/open-source/victory/docs/native/)**: Librería potente para la creación de gráficos de datos y visualización de progreso.

### Backend & Servicios
- **[Supabase](https://supabase.com/)**: La columna vertebral del backend.
  - **PostgreSQL**: Base de datos relacional para una estructura de datos sólida (Rutinas, Ejercicios, Logs).
  - **Auth**: Gestión de autenticación segura y manejo de sesiones (incluyendo OAuth con Google).
  - **Storage**: Almacenamiento de archivos multimedia (fotos de perfil).

## 🚀 Instalación y Desarrollo

Si deseas ejecutar este proyecto en tu entorno local:

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/Crisanfitos/PressFit.git
    cd PressFit
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Necesitarás configurar tu proyecto en Supabase y obtener las credenciales. Crea un archivo `.env` en la raíz y añade:
    ```env
    SUPABASE_URL=tu_url_de_supabase
    SUPABASE_ANON_KEY=tu_key_anonima
    ```

4.  **Ejecutar en Android**:
    Asegúrate de tener un emulador corriendo o un dispositivo conectado.
    ```bash
    npm run android
    ```

# PressFit 🏋️‍♂️ (English Version)

![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

> **Personal Note**: This project was born out of real frustration. After trying countless fitness apps, I felt that none of them fit what I was looking for: a simple, clean, and distraction-free tool, yet powerful enough to effectively track my workout data. PressFit is my answer to that need, developed from scratch to be the app I personally wanted to use.

## 📱 About the Project

PressFit is a mobile workout tracking application designed to eliminate friction in the gym. The goal is simple: less time configuring the app and more time lifting weights.

The application allows users to plan their weekly routines, log every set, rep, and weight in real-time, and visualize their progress over time through intuitive charts. All of this is wrapped in a modern, fast, and pleasant-to-use interface.

## ✨ Key Features

- **📅 Intuitive Weekly Planning**: Organize your routines by days of the week. At a glance, you know exactly what you need to train today.
- **📝 Live Workout Logging**: An interface optimized for logging your sets, reps, and weight (including RPE) while you train, without complicated menus.
- **📈 Progress Visualization**: Detailed charts (powered by Victory Native) that allow you to see your strength and volume evolution for each exercise over time.
- **👤 Complete Profile Management**: Customize your profile, manage your photo (with camera and gallery integration), and keep your data updated.
- **🔐 Robust Authentication**: Secure login system using Google Sign-In and email, fully managed by Supabase.
- **☁️ Cloud Synchronization**: All your data is secure and synchronized in real-time thanks to PostgreSQL.

## 🛠️ Tech Stack

This project has been built using a modern and efficient stack, prioritizing performance and developer experience.

### Frontend
- **[React Native](https://reactnative.dev/) (v0.82)**: Main framework for creating a fluid native experience on Android (and iOS).
- **[NativeWind](https://www.nativewind.dev/) (TailwindCSS)**: For UI styling. Allows for rapid development of beautiful and consistent interfaces using Tailwind utility classes.
- **[React Navigation](https://reactnavigation.org/) (v7)**: The latest version for handling navigation between screens, tabs, and stacks natively.
- **[Victory Native](https://formidable.com/open-source/victory/docs/native/)**: Powerful library for creating data charts and progress visualization.

### Backend & Services
- **[Supabase](https://supabase.com/)**: The backbone of the backend.
  - **PostgreSQL**: Relational database for a solid data structure (Routines, Exercises, Logs).
  - **Auth**: Secure authentication management and session handling (including OAuth with Google).
  - **Storage**: Multimedia file storage (profile photos).

## 🚀 Installation and Development

If you wish to run this project in your local environment:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Crisanfitos/PressFit.git
    cd PressFit
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    You will need to configure your project in Supabase and obtain the credentials. Create a `.env` file in the root and add:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Run on Android**:
    Make sure you have an emulator running or a device connected.
    ```bash
    npm run android
    ```

---

*This project is a constant work in progress, improving with every workout.* 🚀
