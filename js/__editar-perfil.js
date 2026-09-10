/* =========================================================
   EDITAR PERFIL + MIS SOLICITUDES

   Flujo real:
   - GET api/enlace_edicion.php?token=... valida el enlace y
     trae los datos editables.
   - PUT api/enlace_edicion.php guarda los cambios y consume
     el token (queda inválido para un próximo uso).

   Pendiente (fuera de este alcance):
   - Cargar solicitudes-recibidas / solicitudes-enviadas reales.
   ========================================================= */

const API_ENLACE_EDICION = 'api/enlace_edicion.php';
let tokenActual = '';

document.addEventListener('DOMContentLoaded', () => {

  const params = new URLSearchParams(window.location.search);
  const correoInput = document.getElementById('acceso-correo');
  const guidInput = document.getElementById('acceso-guid');

  if (params.get('correo')) correoInput.value = params.get('correo');
  if (params.get('token')) guidInput.value = params.get('token');

  const accesoForm = document.getElementById('acceso-form');
  const accesoMensaje = document.getElementById('acceso-mensaje');
  const contenidoProtegido = document.getElementById('contenido-protegido');
  const perfilForm = document.getElementById('editar-perfil-form');

  async function validarYMostrar(token) {

    accesoMensaje.innerHTML =
      '<div class="alert alert-info">Validando enlace...</div>';

    try {

      const result = await apiGet(
        API_ENLACE_EDICION + '?token=' + encodeURIComponent(token)
      );

      if (!result.exito) {
        accesoMensaje.innerHTML =
          '<div class="alert alert-danger">' +
          escapar(result.mensaje || 'Enlace inválido o expirado') +
          '</div>';
        contenidoProtegido.classList.add('d-none');
        return;
      }

      tokenActual = token;

      const usuario = result.usuario;
      perfilForm.nombre.value = usuario.nombre || '';
      perfilForm.apellido.value = usuario.apellido || '';
      perfilForm.empresa.value = usuario.empresa || '';
      perfilForm.cargo.value = usuario.cargo || '';
      perfilForm.intereses.value = usuario.intereses || '';
      perfilForm.busca.value = usuario.busca || '';
      perfilForm.descripcion.value = usuario.descripcion || '';

      accesoMensaje.innerHTML = '';
      contenidoProtegido.classList.remove('d-none');

    } catch (error) {

      console.error('Error validando enlace:', error);
      accesoMensaje.innerHTML =
        '<div class="alert alert-danger">Enlace inválido o expirado</div>';
      contenidoProtegido.classList.add('d-none');

    }

  }

  accesoForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const guid = guidInput.value.trim();
    if (!guid) return;

    validarYMostrar(guid);
  });

  // Si el enlace ya trae el token, validamos de inmediato.
  if (params.get('token')) {
    validarYMostrar(params.get('token'));
  }

  perfilForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const mensaje = document.getElementById('editar-perfil-mensaje');
    const boton = document.getElementById('perfilForm-submit') ||
      perfilForm.querySelector('button[type="submit"]');

    if (!tokenActual) {
      mensaje.innerHTML =
        '<div class="alert alert-danger">Enlace inválido o expirado</div>';
      return;
    }

    const datos = Object.fromEntries(new FormData(perfilForm).entries());
    datos.token = tokenActual;

    if (boton) boton.disabled = true;
    mensaje.innerHTML = '<div class="alert alert-info">Guardando cambios...</div>';

    try {

      const result = await apiSend(API_ENLACE_EDICION, 'PUT', datos);

      if (!result.exito) {
        mensaje.innerHTML =
          '<div class="alert alert-danger">' +
          escapar(result.mensaje || 'No se pudo guardar') +
          '</div>';
        if (boton) boton.disabled = false;
        return;
      }

      mensaje.innerHTML =
        '<div class="alert alert-success">' +
        escapar(result.mensaje || 'Perfil actualizado correctamente') +
        '</div>';

      // El token ya quedó consumido: se deshabilita el formulario.
      Array.from(perfilForm.elements).forEach((el) => { el.disabled = true; });
      tokenActual = '';

    } catch (error) {

      console.error('Error guardando perfil:', error);
      mensaje.innerHTML =
        '<div class="alert alert-danger">No fue posible guardar los cambios.</div>';
      if (boton) boton.disabled = false;

    }

  });

});