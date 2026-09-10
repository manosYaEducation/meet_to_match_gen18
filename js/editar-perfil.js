let tokenEdicion = null;
let perfilOriginal = null;


document.addEventListener('DOMContentLoaded', () => {

  iniciarEdicionPerfil();

});


async function iniciarEdicionPerfil() {

  const params = new URLSearchParams(window.location.search);

  tokenEdicion = params.get('token');

  /*
   * No hay token.
   *
   * No llamamos al backend porque ni siquiera existe
   * una credencial que validar.
   */
  if (!tokenEdicion) {

    mostrarError('Enlace inválido o expirado');

    return;
  }


  /*
   * Validación adicional del formato esperado.
   *
   * El backend sigue siendo la autoridad real.
   */
  if (!/^[a-fA-F0-9]{64}$/.test(tokenEdicion)) {

    mostrarError('Enlace inválido o expirado');

    return;
  }


  try {

    const respuesta = await fetch(
      `api/enlace_edicion.php?token=${encodeURIComponent(tokenEdicion)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    );


    const data = await respuesta.json();


    if (!respuesta.ok || !data.exito || !data.usuario) {

      mostrarError(
        data.mensaje || 'Enlace inválido o expirado'
      );

      return;
    }


    /*
     * El token sigue vivo.
     *
     * El GET NO lo consume.
     */
    perfilOriginal = data.usuario;

    cargarPerfil(data.usuario);

    mostrarFormulario();

  } catch (error) {

    console.error(
      '[EDITAR PERFIL][GET]',
      error
    );

    mostrarError(
      'No fue posible validar el enlace. Intenta nuevamente.'
    );

  }

}


function cargarPerfil(usuario) {

  const campos = [
    'nombre',
    'apellido',
    'empresa',
    'cargo',
    'intereses',
    'busca',
    'descripcion'
  ];


  campos.forEach(campo => {

    const input = document.getElementById(campo);

    if (!input) {
      return;
    }

    input.value = usuario[campo] ?? '';

  });


  /*
   * El endpoint actual no devuelve correo.
   *
   * Por eso dejamos este campo vacío.
   *
   * Si posteriormente el GET incluye correo solo como
   * dato informativo, esta parte lo mostrará.
   */
  const correo = document.getElementById('correo');

  if (correo) {

    correo.value = usuario.correo ?? '';

  }

}


function mostrarFormulario() {

  ocultar('estado-cargando');
  ocultar('estado-error');
  ocultar('estado-exito');

  mostrar('estado-formulario');

}


function mostrarError(mensaje) {

  ocultar('estado-cargando');
  ocultar('estado-formulario');
  ocultar('estado-exito');

  const mensajeElemento =
    document.getElementById('estado-error-mensaje');

  if (mensajeElemento) {

    mensajeElemento.textContent =
      mensaje || 'Enlace inválido o expirado';

  }

  mostrar('estado-error');

}


function mostrarExito() {

  ocultar('estado-cargando');
  ocultar('estado-error');
  ocultar('estado-formulario');

  mostrar('estado-exito');

}


function mostrar(id) {

  const elemento = document.getElementById(id);

  if (elemento) {

    elemento.classList.remove('d-none');

  }

}


function ocultar(id) {

  const elemento = document.getElementById(id);

  if (elemento) {

    elemento.classList.add('d-none');

  }

}


/* ============================================================
   GUARDAR CAMBIOS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const formulario =
    document.getElementById('editar-perfil-form');

  if (!formulario) {
    return;
  }


  formulario.addEventListener('submit', async event => {

    event.preventDefault();

    await guardarPerfil();

  });

});


async function guardarPerfil() {

  if (!tokenEdicion) {

    mostrarMensaje(
      'Enlace inválido o expirado.',
      'danger'
    );

    return;
  }


  const boton =
    document.getElementById('btn-guardar');


  const datos = {

    token: tokenEdicion,

    nombre: obtenerValor('nombre'),

    apellido: obtenerValor('apellido'),

    empresa: obtenerValor('empresa'),

    cargo: obtenerValor('cargo'),

    intereses: obtenerValor('intereses'),

    busca: obtenerValor('busca'),

    descripcion: obtenerValor('descripcion')

  };


  /*
   * El correo NO se incluye.
   *
   * Tampoco usuario_id.
   *
   * El backend determinará el usuario exclusivamente
   * a partir del token.
   */


  try {

    boton.disabled = true;

    boton.textContent = 'Guardando...';


    const respuesta = await fetch(
      'api/enlace_edicion.php',
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },

        body: JSON.stringify(datos)
      }
    );


    const data = await respuesta.json();


    if (!respuesta.ok || !data.exito) {

      mostrarMensaje(
        data.mensaje || 'No fue posible guardar los cambios.',
        'danger'
      );

      boton.disabled = false;
      boton.textContent = 'Guardar cambios';

      return;
    }


    /*
     * IMPORTANTE:
     *
     * El backend ya marcó usado_en.
     *
     * Desde este momento no intentamos reutilizar el token.
     */
    tokenEdicion = null;

    mostrarExito();


  } catch (error) {

    console.error(
      '[EDITAR PERFIL][PUT]',
      error
    );

    mostrarMensaje(
      'Ocurrió un error al guardar los cambios. Intenta nuevamente.',
      'danger'
    );

    boton.disabled = false;
    boton.textContent = 'Guardar cambios';

  }

}


function obtenerValor(id) {

  const elemento =
    document.getElementById(id);

  if (!elemento) {
    return '';
  }

  return elemento.value.trim();

}


function mostrarMensaje(mensaje, tipo = 'info') {

  const contenedor =
    document.getElementById('editar-perfil-mensaje');

  if (!contenedor) {
    return;
  }


  contenedor.innerHTML = '';


  const alerta =
    document.createElement('div');

  alerta.className =
    `alert alert-${tipo} mb-0`;

  alerta.textContent = mensaje;


  contenedor.appendChild(alerta);

}