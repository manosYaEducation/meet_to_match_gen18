const formLuma = document.getElementById('luma-form');
const mensajeLuma = document.getElementById('importacion-mensaje');
const cuerpoUsuarios = document.getElementById('usuarios-luma');

function mostrarResumen(resumen) {
  const errores = resumen.detalle_errores?.length
    ? `<details class="mt-2"><summary>Ver errores</summary><ul class="mb-0">${resumen.detalle_errores.map(error => `<li>${escapar(error)}</li>`).join('')}</ul></details>`
    : '';
  mensajeLuma.innerHTML = `
    <div class="alert alert-success mb-0">
      <strong>Importación terminada.</strong>
      Creados: ${resumen.creados}, actualizados: ${resumen.actualizados}, omitidos: ${resumen.omitidos}, errores: ${resumen.errores}.
      ${errores}
    </div>`;
}

async function cargarUsuariosLuma() {
  const data = await apiGet('api/importar_luma.php');
  if (!data.exito || data.usuarios.length === 0) {
    cuerpoUsuarios.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Todavía no hay participantes importados.</td></tr>';
    return;
  }

  cuerpoUsuarios.innerHTML = data.usuarios.map(usuario => `
    <tr>
      <td>${escapar(`${usuario.nombre} ${usuario.apellido || ''}`.trim())}</td>
      <td>${escapar(usuario.correo)}</td>
      <td>${escapar(usuario.luma_ticket || 'Sin ticket')}</td>
      <td>
        <select class="form-select form-select-sm" id="rol-${usuario.id}">
          ${['Asistente', 'Expositor', 'Organizador'].map(rol => `<option${rol === usuario.tipo_usuario ? ' selected' : ''}>${rol}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn btn-sm btn-meet-outline" type="button" onclick="guardarRol(${usuario.id})">Guardar</button></td>
    </tr>`).join('');
}

async function guardarRol(id) {
  const tipo = document.getElementById(`rol-${id}`).value;
  const data = await apiSend('api/usuarios.php', 'PATCH', { id, tipo_usuario: tipo });
  mensajeLuma.innerHTML = `<div class="alert ${data.exito ? 'alert-success' : 'alert-danger'} mb-0">${escapar(data.mensaje)}</div>`;
}

formLuma.addEventListener('submit', async event => {
  event.preventDefault();
  const boton = document.getElementById('btn-importar');
  boton.disabled = true;
  mensajeLuma.innerHTML = '<div class="alert alert-info mb-0">Procesando CSV...</div>';

  try {
    const formData = new FormData(formLuma);
    const respuesta = await fetch('api/importar_luma.php', { method: 'POST', body: formData });
    const data = await respuesta.json();
    if (!data.exito) throw new Error(data.mensaje || 'No se pudo importar el archivo.');
    mostrarResumen(data.resumen);
    await cargarUsuariosLuma();
  } catch (error) {
    mensajeLuma.innerHTML = `<div class="alert alert-danger mb-0">${escapar(error.message)}</div>`;
  } finally {
    boton.disabled = false;
  }
});
cargarUsuariosLuma().catch(error => {
  mensajeLuma.innerHTML = `<div class="alert alert-danger">${escapar(error.message)}</div>`;
});
