# MediHub - Sistema de Gestión Clínica Integral

Bienvenido a **MediHub**, la solución moderna para la gestión clínica diseñada para optimizar el flujo de trabajo en centros de salud. Este sistema centraliza la administración de pacientes, consultas médicas, y procesos administrativos, potenciado ahora por **Inteligencia Artificial** y una base de datos robusta en **PostgreSQL**.

## 🚀 Características Principales

### Gestión Clínica y Administrativa
*   **Admisión de Pacientes**: Registro detallado de Titulares y Beneficiarios.
*   **Sala de Espera Virtual**: Monitoreo en tiempo real del flujo de pacientes.
*   **Historia Clínica Electrónica (HCE)**: Documentación completa de consultas, diagnósticos (CIE-10), y antecedentes.
*   **Bitácora de Tratamiento**: Gestión de órdenes médicas para enfermería.
*   **Seguridad RBAC**: Control de acceso basado en roles para proteger la data sensible.

### ✨ Nuevas Funcionalidades de IA (Powered by Google Genkit)
MediHub integra inteligencia artificial para asistir al personal médico:
*   **Generación de Recetas**: Creación automática de recetas basadas en el diagnóstico y tratamiento.
*   **Consentimientos Informados**: Sugerencia inteligente de formularios de consentimiento según el procedimiento.
*   **Resumen de Historia Clínica**: Generación de resúmenes concisos del historial del paciente para una revisión rápida.

---

## 🛠️ Pila Tecnológica

*   **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, ShadCN UI.
*   **Backend**: Next.js Server Actions.
*   **Base de Datos**: **PostgreSQL** (Migrado de SQLite para mayor escalabilidad y concurrencia).
*   **Inteligencia Artificial**: Google Genkit + Gemini API.
*   **Escritorio**: Electron (para la versión instalable en Windows).
*   **Autenticación**: Iron Session.

---

## ⚙️ Configuración y Requisitos

### Prerrequisitos
1.  **Node.js** (v18 o superior).
2.  **PostgreSQL**: Debe tener una instancia de PostgreSQL corriendo localmente o en la nube.

### Variables de Entorno
Cree un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
# Base de Datos (PostgreSQL)
POSTGRES_URL="postgresql://usuario:password@localhost:5432/medihub_db"

# Inteligencia Artificial (Google Gemini)
GEMINI_API_KEY="su_api_key_de_google_aqui"

# Seguridad (Cadena aleatoria de 32+ caracteres)
SESSION_PASSWORD="cookie_password_invulnerable_y_larga_de_al_menos_32_caracteres"
```

---

## 🚀 Guía de Inicio Rápido

### Desarrollo
Para iniciar el servidor de desarrollo:

```bash
npm install
npm run dev
# El sistema estará disponible en http://localhost:3000
```

### Producción
Para construir e iniciar la versión optimizada:

```bash
npm run build
npm run start
```

### Versión de Escritorio (Electron)
Para probar la aplicación de escritorio:

```bash
npm run electron:dev
```

Para construir el instalador (.exe):
```bash
npm run electron:build
```

---

## 👥 Roles del Sistema

El sistema viene preconfigurado con los siguientes roles y permisos clave:

*   **Superusuario**: Acceso total al sistema.
*   **Admin**: Gestión de usuarios, configuraciones y empresas.
*   **Doctores (Pediatra/Familiar)**: Realización de consultas, visión de HCE, gestión de recetas.
*   **Enfermera**: Gestión de bitácora de tratamientos y administración de medicamentos.
*   **Recepcionista/Secretaria**: Gestión de sala de espera, registro de pacientes y admisión.

---
**Nota**: Este proyecto está en constante evolución. Si encuentra algún problema, por favor repórtelo al equipo de desarrollo.