# Configuracion SMTP

El archivo `.env` contiene la configuracion local del proyecto. No se versiona
porque puede incluir contraseñas. Para crear uno nuevo se debe copiar
`.env.ejemplo` y reemplazar solamente los valores locales.

## Variables de correo

```env
MAIL_ENABLED=false
MAIL_HOST=mail.tu-dominio.cl
MAIL_PORT=587
MAIL_USERNAME=correo@tu-dominio.cl
MAIL_PASSWORD=REEMPLAZAR
MAIL_FROM=correo@tu-dominio.cl
MAIL_FROM_NAME="Meet to Match POC"
```

- `MAIL_ENABLED`: con `true`, el sistema intenta enviar un correo al crear una
  solicitud. Con `false`, guarda la solicitud sin enviar correo.
- `MAIL_HOST`: nombre del servidor SMTP entregado por el proveedor de correo.
- `MAIL_PORT`: puerto de conexion. El proyecto usa STARTTLS con `587` y SMTPS
  con `465`.
- `MAIL_USERNAME`: cuenta utilizada para autenticarse en el servidor SMTP.
- `MAIL_PASSWORD`: contraseña SMTP o contraseña de aplicacion de esa cuenta.
- `MAIL_FROM`: direccion que aparece como remitente. Normalmente debe coincidir
  con `MAIL_USERNAME` o estar autorizada por el servidor.
- `MAIL_FROM_NAME`: nombre visible del remitente.

Las lineas que comienzan con `;` son comentarios del archivo INI y PHP no las
interpreta como configuracion.

## Seguridad

1. Nunca subir `.env`, contraseñas reales, capturas con credenciales ni archivos
   exportados de participantes.
2. Mantener `MAIL_ENABLED=false` mientras se configura o rota una contraseña.
3. Preferir una contraseña de aplicacion exclusiva para este sistema.
4. Si una contraseña se publica o aparece en una captura, revocarla en el
   proveedor de correo y generar una nueva. Ocultarla en Git no corrige una
   credencial que ya fue expuesta.
5. Actualizar la nueva clave solo en el `.env` local o en las variables seguras
   del servidor de produccion.

## Prueba recomendada

Después de configurar una credencial nueva:

1. Usar una cuenta de prueba como receptor.
2. Cambiar temporalmente `MAIL_ENABLED=true`.
3. Crear una solicitud desde la interfaz.
4. Confirmar que el correo llega y que el enlace apunta al entorno correcto.
5. Si todavía no se necesitan notificaciones reales, volver a
   `MAIL_ENABLED=false`.
