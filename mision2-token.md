# Roadmap: Enlace de edición de perfil por correo (GUID temporal)

**Repo:** `manosYaEducation/meet_to_match_gen18`
**Referencia funcional:** `Objetivos.md`, sección B ("Flujo de Edición de Perfil por Correo (GUID)")
**Rama de trabajo:** crear `Feature/<Autor>/<YYYY-MM-DD>-guid-edicion-perfil` desde `main` (o desde el `Release` activo). El PR debe apuntar a esa rama, **nunca directo a `main`**.

Este documento resume todas las decisiones ya tomadas y deja el trabajo listo para que otra sesión/IA lo implemente sin tener que volver a levantar contexto.

---

## 1. Decisiones de diseño ya cerradas

| Punto | Decisión |
|---|---|
| Invalidación del guid | Solo al **guardar exitosamente** el formulario (no al solo abrir el link) |
| Expiración del enlace | **24 horas** desde que se genera |
| Página de edición | **Nueva vista dedicada** `editar-perfil.html` (no se reutiliza `registro.html`) |
| Almacenamiento del token | **Texto plano** en la base de datos (no hasheado) |
| Anti-spam | Cooldown: **máx. 1 solicitud de enlace cada 5 minutos por usuario** (reutilizar token vigente dentro de esa ventana, sin reenviar correo) |
| Ubicación del formulario "solicitar enlace" | **Modal dentro de `index.html`** (portal público), junto al botón "Ver mis solicitudes" |
| Campos editables vía guid | nombre, apellido, empresa, cargo, intereses, busca, descripción. **El correo NO es editable** por este flujo (evita cambio de identidad) |

---

## 2. Archivos a crear

```
adm/database/schema.sql                → AGREGAR tabla enlaces_edicion (ver §3)
adm/api/db.php                          → MODIFICAR asegurarEsquema() para crear la tabla si falta
adm/api/mail.php                        → AGREGAR función enviarCorreoEdicionPerfil()
api/enlace_edicion.php                  → NUEVO — endpoint público (POST/GET/PUT)
editar-perfil.html                      → NUEVO — vista de edición vía token (raíz, como index.html)
js/editar-perfil.js                     → NUEVO — lógica de la vista anterior
index.html                              → MODIFICAR — agregar botón + modal "Editar mi perfil"
js/index.js                             → MODIFICAR — lógica del modal (llamar a POST /api/enlace_edicion.php)
```

No se toca `adm/api/usuarios.php` ni `adm/api/solicitudes.php`. El endpoint nuevo va en `api/` (raíz), al mismo nivel que `api/solicitudes.php`, porque es **público** y debe seguir su mismo patrón defensivo (nunca revelar si un correo existe, respuestas genéricas).

---

## 3. Migración SQL

Agregar a `adm/database/schema.sql` y replicar como bloque `CREATE TABLE IF NOT EXISTS` dentro de `asegurarEsquema()` en `adm/api/db.php` (mismo patrón que usan `bloques_horarios` e `importaciones_luma`):

```sql
CREATE TABLE IF NOT EXISTS enlaces_edicion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token CHAR(64) NOT NULL UNIQUE,
  expira_en DATETIME NOT NULL,
  usado_en DATETIME NULL DEFAULT NULL,
  ip_solicitud VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_enlaces_token (token),
  INDEX idx_enlaces_usuario (usuario_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

---

## 4. Endpoint `api/enlace_edicion.php`

Calcar la estructura y el tono defensivo de `api/solicitudes.php` (requiere `adm/api/db.php` y `adm/api/mail.php`). Reglas concretas:

### `POST` — solicitar enlace
- Body: `{ "email": "..." }`
- Normalizar (`strtolower(trim())`), validar formato de correo.
- Buscar `usuario_id` por correo. **Si no existe, responder el mismo mensaje genérico de éxito** (no crear nada, no enviar correo) — igual que hace `solicitudes.php` con el solicitante.
- Si existe:
  - Buscar si hay un token de ese `usuario_id` con `usado_en IS NULL` y `created_at > NOW() - INTERVAL 5 MINUTE`.
    - Si existe → **no crear uno nuevo, no reenviar correo**. Responder igual el mensaje genérico (el usuario no debe notar la diferencia).
    - Si no existe → generar `token = bin2hex(random_bytes(32))`, `expira_en = NOW() + INTERVAL 24 HOUR`, invalidar (o simplemente ignorar, ya que `usado_en` los filtra) tokens previos no usados del mismo usuario, insertar, y llamar a `enviarCorreoEdicionPerfil()`.
- Responder siempre: `{ "exito": true, "mensaje": "Si el correo corresponde a un participante registrado, recibirás un enlace para editar tu perfil." }`

### `GET ?token=...`
- Buscar token con `usado_en IS NULL AND expira_en > NOW()`.
- Si no es válido (no existe, ya usado, o expirado): responder **error genérico** sin distinguir el motivo — `{ "exito": false, "mensaje": "Enlace inválido o expirado" }` (404).
- Si es válido: devolver los datos editables del usuario asociado (nombre, apellido, empresa, cargo, intereses, busca, descripcion). **No devolver el correo como campo editable** (se puede mostrar de forma read-only si se quiere dar contexto, pero no se acepta de vuelta en el PUT).

### `PUT` — guardar cambios
- Body: `{ "token": "...", "nombre": "...", ... }`
- `beginTransaction()`.
- `SELECT ... FROM enlaces_edicion WHERE token = ? FOR UPDATE` → validar igual que en el GET (existe, no usado, no expirado). Si falla, `rollBack()` y error genérico.
- `UPDATE usuarios SET ... WHERE id = usuario_id` con los campos permitidos (whitelist explícita, igual que hace `adm/api/usuarios.php` con `trim()` por campo).
- Si el `UPDATE` fue exitoso: `UPDATE enlaces_edicion SET usado_en = NOW() WHERE id = ?`.
- `commit()`.
- Si cualquier paso falla antes del commit, `rollBack()` — el token sigue vivo y el usuario puede reintentar con el mismo link hasta que expire.

---

## 5. `mail.php` — nueva función

Copiar el esqueleto de `enviarCorreoSolicitudReunion()`:

```php
function enviarCorreoEdicionPerfil(PDO $conn, int $usuarioId, string $token)
{
    // misma verificación correoHabilitado() / autoload de PHPMailer
    // SELECT nombre, apellido, correo FROM usuarios WHERE id = ?
    // $link = baseUrlPoc() . '/editar-perfil.html?token=' . urlencode($token);
    // mismo estilo de plantilla HTML que la función existente
    // asunto sugerido: "Enlace para editar tu perfil - Meet to Match Gen18"
}
```

Se llama **después** del `commit()` del `POST`, igual que en `solicitudes.php` (si el correo falla, no se revierte la creación del token — se loguea con `error_log()`).

---

## 6. Frontend

### `index.html`
- Agregar botón "Editar mi perfil" junto al botón existente "Ver mis solicitudes" (línea ~30).
- Agregar un modal nuevo (mismo patrón que `solicitudModal` ya existente): input de correo + botón "Enviar enlace".

### `js/index.js`
- Handler del submit del modal → `POST` a `api/enlace_edicion.php` → mostrar el mensaje genérico de respuesta (éxito visual, sin importar si el correo existía).

### `editar-perfil.html` (nuevo)
- Layout similar a `registro.html` pero:
  - Sin campo correo editable (mostrarlo read-only si se quiere dar contexto).
  - Sin selector de `tipo_usuario` (no es parte de los campos editables acordados).
  - Al cargar, lee `?token=` de la URL vía `URLSearchParams`.
  - Si no hay token en la URL → mostrar mensaje "Enlace inválido" directamente, sin llamar a la API.

### `js/editar-perfil.js` (nuevo)
- `GET api/enlace_edicion.php?token=...` al cargar → si falla, mostrar mensaje de error + link a "solicitar uno nuevo" (abre el modal de `index.html`, o redirige a `index.html#solicitar-enlace`).
- Si es válido, precargar el formulario.
- Submit → `PUT api/enlace_edicion.php` con `{ token, ...campos }`.
- Tras éxito, mostrar confirmación y **deshabilitar el formulario** (el token ya no sirve).

---

## 7. Checklist de pruebas antes del PR

- [ ] Solicitar enlace con correo **no registrado** → responde igual que con uno registrado, no crea fila en `enlaces_edicion`.
- [ ] Solicitar enlace 2 veces seguidas (< 5 min) con el mismo correo registrado → solo se genera/envía un token.
- [ ] Abrir el link válido → carga los datos correctos, **no invalida el token todavía**.
- [ ] Abrir el link, cerrar sin guardar, volver a abrir el mismo link más tarde (dentro de las 24h) → debe seguir funcionando (invalidación es solo al guardar, según lo acordado).
- [ ] Guardar cambios → el `UPDATE` se refleja en `usuarios`, y el token queda con `usado_en` seteado.
- [ ] Reintentar usar el mismo link después de guardado exitoso → error genérico de enlace inválido.
- [ ] Esperar (o forzar en BD) que `expira_en` quede en el pasado → el link debe rechazarse igual que uno usado, con el mismo mensaje.
- [ ] Confirmar que el endpoint nunca devuelve en ninguna respuesta si el correo existe o no (revisar todas las ramas de `POST`).
- [ ] Confirmar que `correo` no llega a actualizarse aunque se envíe manualmente en el body del `PUT` (whitelist de campos en el backend, no confiar en el frontend).

---

## 8. Notas de contexto del proyecto (para quien retome esto)

- Stack: PHP puro + MySQL + Bootstrap + XAMPP. Sin frameworks JS.
- `adm/api/db.php` maneja conexión PDO y autogestiona el esquema (`asegurarEsquema()`) — así que agregar la tabla ahí es la forma "oficial" de migrar, no hace falta un script de migración aparte.
- El endpoint público (`api/`) sigue una filosofía de **no dar pistas** a un atacante: mismos mensajes de error, mismo tiempo de respuesta idealmente, sin exponer IDs internos. `api/solicitudes.php` es la referencia de estilo a seguir al pie de la letra.
- `adm/api/mail.php` usa PHPMailer vía `vendor/autoload.php` (Composer) y variables de entorno en `.env` (`MAIL_ENABLED`, `MAIL_HOST`, etc. — ver `adm/docs/CONFIGURACION_SMTP.md`).
- Convención de ramas/commits del usuario: ver skill `git-control` (Conventional Commits, ramas `Feature/<Autor>/<fecha>-<descripcion>`, PR siempre hacia una rama de trabajo, nunca directo a `main`).