# MediHub - Sistema de Gestión Clínica

Bienvenido a MediHub, un Sistema de Gestión Clínica integral diseñado para digitalizar y optimizar las operaciones de un centro de salud.

## ¿De qué se trata este sistema?

MediHub es una aplicación web moderna construida para manejar el ciclo de vida completo de la atención al paciente, desde el registro inicial hasta el seguimiento post-consulta. Su propósito es centralizar la información, mejorar la eficiencia del personal médico y administrativo, y garantizar la privacidad y seguridad de los datos.

### Flujo de Trabajo Principal

1.  **Admisión y Gestión de Pacientes**: El personal registra a los pacientes, diferenciando entre **Titulares** (afiliados principales) y **Beneficiarios** (sus dependientes). El sistema mantiene un repositorio central de todas las personas.
2.  **Sala de Espera Virtual**: Los pacientes registrados para una consulta entran en una cola de espera digital, permitiendo al personal monitorear en tiempo real quién espera, por cuánto tiempo y para qué servicio.
3.  **Consulta Médica Digital (HCE)**: El médico atiende al paciente, documentando toda la interacción en la **Historia Clínica Electrónica (HCE)**. Esto incluye:
    *   Anamnesis (motivo de consulta, enfermedad actual).
    *   Antecedentes personales, familiares y gineco-obstétricos.
    *   Examen físico y signos vitales.
    *   Diagnósticos basados en el catálogo internacional **CIE-10**.
    *   Plan de tratamiento, incluyendo recetas médicas y órdenes de laboratorio o imagenología.
4.  **Bitácora de Tratamiento**: Las órdenes que requieren ejecución (como curas, inyecciones, etc.) se listan en una bitácora para que el personal de enfermería las administre y documente.
5.  **Administración y Reportes**: El sistema cuenta con módulos para que los administradores gestionen empresas, servicios, catálogos (CIE-10) y, lo más importante, la seguridad de los usuarios y sus roles. También permite generar reportes clave, como estadísticas de morbilidad.

## Estado Actual del Sistema

El sistema se encuentra en un estado funcional y estable. Las características principales descritas anteriormente están implementadas y operativas. El problema de autenticación ha sido resuelto, sentando una base sólida para futuras expansiones.

Se puede considerar que está en una fase **"Beta"**: listo para ser utilizado, probado en un entorno real para recopilar feedback, y para comenzar a construir nuevas funcionalidades sobre él.

## Modelo de Seguridad y Privacidad

La seguridad y la privacidad son los pilares fundamentales de MediHub. El sistema implementa un robusto modelo de **Control de Acceso Basado en Roles (RBAC)** que garantiza la confidencialidad de la información.

### ¿Cómo funciona?

1.  **Permisos**: Cada acción crítica dentro del sistema (ej. `users.manage` para "Gestionar Usuarios" o `hce.view` para "Ver Historia Clínica") está definida como un **permiso**.
2.  **Roles**: Los permisos se agrupan en **Roles** lógicos que reflejan las funciones del personal de la clínica (ej. "Doctor", "Enfermera", "Recepcionista", "Administrador").
3.  **Usuarios**: A cada usuario se le asigna un único rol.

Cuando un usuario intenta realizar una acción, el sistema verifica si el rol de ese usuario tiene el permiso requerido. Si no lo tiene, la acción se bloquea de forma segura.

Por ejemplo, un usuario con el rol "Doctor" tendrá permiso para realizar consultas (`consultation.perform`), pero no para gestionar usuarios (`users.manage`). El rol "Superusuario" está diseñado para tener acceso total a todas las funcionalidades, ideal para la administración y configuración inicial del sistema.

Este modelo asegura el principio de **"mínimo privilegio"**: cada usuario solo tiene acceso a la información y a las funciones estrictamente necesarias para cumplir con su trabajo, protegiendo así la integridad y privacidad de los datos de los pacientes.

## Pila Tecnológica

*   **Framework**: Next.js con App Router
*   **Lenguaje**: TypeScript
*   **UI**: React, ShadCN UI, Tailwind CSS
*   **Base de Datos**: SQLite
*   **Autenticación y Sesiones**: Iron Session
*   **Funcionalidades de IA**: Genkit