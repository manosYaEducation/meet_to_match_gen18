# Meet to Match Gen18

Prueba de concepto simple para el evento.

El objetivo es demostrar este flujo:

1. Un asistente se registra desde un formulario.
2. Su perfil aparece en la lista de participantes.
3. Busca y abre el perfil de un expositor o participante.
4. Elige un bloque horario disponible y solicita una reunion privada con mensaje.
5. El receptor revisa la solicitud y su horario.
6. Acepta o rechaza; el sistema impide reuniones superpuestas.
7. El solicitante revisa el estado y el horario de la reunion.

El organizador tambien puede importar el listado historico exportado por Luma. La importacion usa el correo para crear o actualizar perfiles sin duplicarlos, omite registros no aprobados por defecto y permite corregir el rol despues de cargar el archivo.

Cada registro manual exige seleccionar una categoria: `Organizador`, `Expositor` o `Asistente`. Para conservarla en las exportaciones de Luma, se deben crear esos tres tipos de entrada con los mismos nombres. El importador tambien reconoce columnas llamadas `Tipo de participante` o `Categoria`.

## Stack

- PHP puro
- Bootstrap
- MySQL
- XAMPP

## Estructura

```text
/
|-- api/                 Endpoints PHP, conexion MySQL y correo
|-- css/                 Estilos compartidos
|-- database/            Esquema SQL y datos demo
|-- datos/               CSV ficticio para pruebas
|-- docs/                Documentacion tecnica y de configuracion
|-- js/                  Logica del frontend
|-- scripts/             Herramientas de consola
|-- tests/               Pruebas PHP
|-- *.html               Paginas publicas servidas directamente por XAMPP
|-- instalar.php         Instalador web local
|-- manifest.json        Configuracion PWA
`-- sw.js                Service worker de la PWA
```

Las paginas HTML permanecen en la raiz porque usan rutas relativas y XAMPP las
publica directamente desde esta carpeta. Los ejecutables de tunel, archivos ZIP,
logs, credenciales y exportaciones reales de Luma no forman parte del proyecto.

La configuracion SMTP se explica en
[`docs/CONFIGURACION_SMTP.md`](docs/CONFIGURACION_SMTP.md).

## Abrir

Primero ejecutar el instalador:

```text
http://localhost/MeetToMatchGen18/instalar.php
```

Luego abrir:

```text
http://localhost/MeetToMatchGen18/
```

Para probar la carga de participantes, abrir:

```text
http://localhost/MeetToMatchGen18/importar.html
```

El CSV real de Luma contiene datos personales y no debe agregarse al repositorio. Para una demostracion segura se puede usar `datos/luma_participantes_demo.csv`.

Opcionalmente, se puede importar desde consola usando el PHP de XAMPP:

```powershell
C:\xampp\php\php.exe scripts\importar_luma_cli.php "C:\ruta\exportacion-luma.csv"
```

## Alcance

Este proyecto no incluye login real, chat, sincronizacion con calendarios externos, videollamadas, IA ni integracion directa con la API de Luma. La carga desde Luma se realiza manualmente mediante CSV.
