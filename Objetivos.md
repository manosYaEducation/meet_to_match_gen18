# Documento Provisorio de Objetivos y Arquitectura del Sistema

* **Objetivo General**: Desarrollar e implementar un sistema de *matchmaking* y agendamiento B2B descentralizado (inspirado en plataformas como EtMday), operando bajo un modelo de accesos por enlaces temporales (`guid`) sin contraseñas, dividido en un portal público de descubrimiento y un panel de gestión administrativa.

---

## **1. Módulos y Arquitectura del Proyecto**

### **A. Portal Público (Visitantes y Directorio)**

* **Directorio de Participantes**: Visualización abierta del listado de personas registradas e indexadas (cuya información base es previamente validada y alimentada desde la administración).
* **Consulta de Bloques Horarios**: Visualización pública de la disponibilidad de bloques asignados a cada perfil base dentro del sistema.
* **Solicitud de Reunión por Correo**: Mecanismo donde un visitante interesado selecciona un bloque disponible y autentica su solicitud ingresando su correo electrónico para activar el proceso de *match*.

### **B. Flujo de Edición de Perfil por Correo (`GUID`)**

* **Solicitud de Enlace**: Botón de acceso exclusivo para que el participante solicite la edición de su perfil ingresando su correo registrado.
* **Generación de Token Único (`guid`)**: El sistema emite un identificador temporal seguro y lo despacha vía correo electrónico.
* **Sesión de Edición Segura**: Enlace directo que valida el `guid`, lo inactiva tras su primer uso por motivos de seguridad, y despliega el formulario privado para actualizar datos personales, fotografías y disponibilidad de bloques.

### **C. Panel de Administración y Visor Interno**

* **Gestión Centralizada**: Espacio reservado para los administradores del evento para dar altas, bajas y control de los perfiles públicos.
* **Visor de Estado**: Herramienta de supervisión para corroborar en tiempo real los espacios solicitados, permitiendo a la organización apoyar y auditar el avance de las reuniones y *matches*.

---