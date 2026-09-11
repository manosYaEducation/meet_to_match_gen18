let usuarios = [];
let perfilSeleccionado = null;
let perfilModal = null;
let solicitudModal = null;

let cargoSeleccionado = '';
let tipoSeleccionado = '';

let estadoAuthActual = null;


/* =========================================================
   HUB PROVIDENCIA
   ========================================================= */

const hubData = {
  subterraneo: {
    floorName: 'Planta Subterráneo',
    image: 'PLACEHOLDER_MAPA_SUBTERRANEO',
    zones: [
      {
        id: 'sub_dev_expo',
        name: 'ESPACIO para exposición developers'
      },
      {
        id: 'sub_salas',
        name: 'Espacio Cerrado como salas'
      },
      {
        id: 'sub_vip',
        name: 'Espacio Cerrado VIP'
      },
      {
        id: 'sub_pasillo',
        name: 'Pasillo y Ascensor'
      }
    ]
  },

  piso1: {
    floorName: 'Planta Primer Piso',
    image: 'PLACEHOLDER_MAPA_PISO1',
    zones: [
      {
        id: 'p1_acreditacion',
        name: 'Entrada y Acreditación'
      },
      {
        id: 'p1_charlas',
        name: 'Espacio de sillas para ver charlas'
      },
      {
        id: 'p1_escenario',
        name: 'Escenario Principal'
      },
      {
        id: 'p1_podcast',
        name: 'Posible espacio transmisión podcast'
      }
    ]
  },

  piso2: {
    floorName: 'Planta Segundo Piso',
    image: 'PLACEHOLDER_MAPA_PISO2',
    zones: [
      {
        id: 'p2_conversacion',
        name: 'Espacio con mesas para conversación'
      },
      {
        id: 'p2_pitch',
        name: 'Espacios para posibles pitch de inversión o alianzas'
      },
      {
        id: 'p2_pasillo_mesas',
        name: 'Pasillo con 3 mesas ingreso'
      }
    ]
  }
};


let hubPisoSeleccionado = '';
let hubZonaSeleccionada = '';


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener('DOMContentLoaded', async function () {

  const estadoAuth = await obtenerEstadoAuth();

  estadoAuthActual = estadoAuth;

  console.log('Estado autenticación:', estadoAuth);

  actualizarEstadoSesion(
    estadoAuth
  );

  const perfilModalEl =
    document.getElementById('perfilModal');

  const solicitudModalEl =
    document.getElementById('solicitudModal');


  if (
    perfilModalEl &&
    typeof bootstrap !== 'undefined'
  ) {

    perfilModal =
      new bootstrap.Modal(perfilModalEl);

  }


  if (
    solicitudModalEl &&
    typeof bootstrap !== 'undefined'
  ) {

    solicitudModal =
      new bootstrap.Modal(solicitudModalEl);

  }


  await cargarParticipantes();

  configurarFiltros();
  configurarEventos();
  initCorreoAccesoModal();


  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  const verPerfilId =
    urlParams.get('ver_perfil');


  if (verPerfilId) {
    verPerfil(verPerfilId);
  }

});


async function obtenerEstadoAuth() {

  try {

    return await apiGet(
      'api/auth.php'
    );

  } catch (error) {

    return {
      exito: false,
      autenticado: false
    };

  }

}


/* =========================================================
   ESTADO DE SESIÓN / ESPACIO PERSONAL
   ========================================================= */

function usuarioEstaLogeado() {

  return !!(
    estadoAuthActual &&
    estadoAuthActual.exito &&
    estadoAuthActual.autenticado &&
    estadoAuthActual.usuario &&
    estadoAuthActual.usuario.id
  );

}


function obtenerUsuarioLogeado() {

  if (!usuarioEstaLogeado()) {
    return null;
  }

  return estadoAuthActual.usuario;

}


function actualizarEstadoSesion(estadoAuth) {

  const usuarioConectado =
    document.getElementById(
      'usuario-conectado'
    );

  const botonSolicitudes =
    document.getElementById(
      'btn-ver-solicitudes'
    );

  const nombreElemento =
    document.getElementById(
      'usuario-conectado-nombre'
    );


  if (
    !estadoAuth ||
    !estadoAuth.exito ||
    !estadoAuth.autenticado ||
    !estadoAuth.usuario
  ) {

    if (usuarioConectado) {

      usuarioConectado.classList.add(
        'd-none'
      );

      usuarioConectado.classList.remove(
        'd-flex'
      );

    }


    if (botonSolicitudes) {

      botonSolicitudes.classList.remove(
        'd-none'
      );

    }


    return;
  }


  const usuario =
    estadoAuth.usuario;


  const nombreCompleto =
    [
      usuario.nombre,
      usuario.apellido
    ]
      .filter(Boolean)
      .join(' ')
      .trim();


  if (nombreElemento) {

    nombreElemento.textContent =
      nombreCompleto
        ? '● ' + nombreCompleto
        : '● Conectado';

  }


  if (usuarioConectado) {

    usuarioConectado.classList.remove(
      'd-none'
    );

    usuarioConectado.classList.add(
      'd-flex'
    );

  }


  /*
   * Si ya está conectado no necesitamos
   * pedir correo para acceder.
   *
   * El botón se mantiene oculto hasta
   * implementar la vista de solicitudes.
   */
  if (botonSolicitudes) {

    botonSolicitudes.classList.add(
      'd-none'
    );

  }


  configurarMiEspacio();
  configurarCerrarSesionIndex();

}


/* =========================================================
   MI ESPACIO
   ========================================================= */

function configurarMiEspacio() {

  const boton =
    document.getElementById(
      'btn-mi-espacio'
    );


  if (!boton) {
    return;
  }


  if (
    boton.dataset.configurado === '1'
  ) {
    return;
  }


  boton.dataset.configurado = '1';


  boton.addEventListener(
    'click',
    async function (event) {

      event.preventDefault();


      const enlaceGuardado =
        sessionStorage.getItem(
          'meet_to_match_enlace_personal'
        );


      if (enlaceGuardado) {

        window.location.href =
          enlaceGuardado;

        return;
      }


      try {

        boton.disabled = true;


        const textoOriginal =
          boton.textContent;


        boton.dataset.textoOriginal =
          textoOriginal;


        boton.textContent =
          'Cargando...';


        const respuesta =
          await fetch(
            'api/enlace_edicion.php?accion=mi_enlace',
            {
              method: 'GET',

              headers: {
                'Accept':
                  'application/json'
              },

              credentials:
                'same-origin'
            }
          );


        const data =
          await respuesta.json();


        console.log(
          '[MI ESPACIO]',
          data
        );


        if (
          !respuesta.ok ||
          !data.exito ||
          !data.enlace
        ) {

          throw new Error(
            data.mensaje ||
            'No fue posible recuperar tu espacio personal.'
          );

        }


        const enlaceCompleto =
          new URL(
            data.enlace,
            window.location.href
          ).href;


        sessionStorage.setItem(
          'meet_to_match_enlace_personal',
          enlaceCompleto
        );


        window.location.href =
          data.enlace;


      } catch (error) {

        console.error(
          '[MI ESPACIO]',
          error
        );


        alert(
          error.message ||
          'No encontramos tu espacio personal. Solicita nuevamente tu acceso.'
        );


      } finally {

        boton.disabled = false;


        if (
          boton.dataset.textoOriginal
        ) {

          boton.textContent =
            boton.dataset.textoOriginal;

        }

      }

    }
  );

}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function configurarCerrarSesionIndex() {

  const boton =
    document.getElementById(
      'btn-cerrar-sesion-index'
    );


  if (!boton) {
    return;
  }


  if (
    boton.dataset.configurado === '1'
  ) {
    return;
  }


  boton.dataset.configurado = '1';


  boton.addEventListener(
    'click',
    async function () {

      const confirmar =
        confirm(
          '¿Quieres cerrar la sesión?'
        );


      if (!confirmar) {
        return;
      }


      try {

        boton.disabled = true;

        boton.textContent =
          'Cerrando sesión...';


        const respuesta =
          await fetch(
            'api/auth.php?accion=logout',
            {
              method: 'POST',

              headers: {
                'Accept':
                  'application/json'
              },

              credentials:
                'same-origin'
            }
          );


        const data =
          await respuesta.json();


        if (
          !respuesta.ok ||
          !data.exito
        ) {

          throw new Error(
            data.mensaje ||
            'No fue posible cerrar la sesión.'
          );

        }


        /*
         * Cerrar sesión solamente destruye
         * la sesión PHP.
         *
         * El token sigue siendo válido.
         */

        window.location.reload();


      } catch (error) {

        console.error(
          '[INDEX][LOGOUT]',
          error
        );


        alert(
          'No fue posible cerrar la sesión. Intenta nuevamente.'
        );


        boton.disabled = false;

        boton.textContent =
          'Cerrar sesión';

      }

    }
  );

}


/* =========================================================
   PARTICIPANTES
   ========================================================= */

async function cargarParticipantes() {

  try {

    const data =
      await apiGet(API_USUARIOS);


    if (
      data &&
      data.exito &&
      Array.isArray(data.usuarios)
    ) {

      usuarios =
        data.usuarios;

    } else {

      usuarios = [];

    }


    asegurarFiltrosTipo();

    actualizarContadoresSidebar();
    poblarFiltroCargos();
    renderParticipantes();


  } catch (error) {

    console.error(
      'Error cargando participantes:',
      error
    );


    usuarios = [];


    const mensaje =
      document.getElementById(
        'participantes-mensaje'
      );


    if (mensaje) {

      mensaje.innerHTML = `
        <div class="alert alert-danger">
          No fue posible cargar los participantes.
        </div>
      `;

    }

  }

}


/* =========================================================
   CATEGORÍAS DINÁMICAS
   ========================================================= */

function obtenerSlugTipo(tipo) {

  const texto =
    String(tipo || '')
      .trim()
      .toLowerCase();


  if (!texto) {
    return '';
  }


  if (texto === 'developers') {
    return 'developer';
  }


  return texto
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      '');
}


function obtenerNombreCategoria(tipo) {

  const texto =
    String(tipo || '')
      .trim();


  if (!texto) {
    return 'Participantes';
  }


  const mapa = {
    'Expositor': 'Expositores',
    'Asistente': 'Asistentes',
    'Organizador': 'Organizadores',
    'Developers': 'Developers'
  };


  if (mapa[texto]) {
    return mapa[texto];
  }


  return texto;
}


function asegurarFiltrosTipo() {

  const contenedor =
    document.getElementById(
      'filtro-tipo-grupo'
    );


  if (!contenedor) {
    return;
  }


  const tipos = [];
  const vistos = new Set();


  usuarios.forEach(function (usuario) {

    const tipo =
      String(
        usuario.tipo_usuario || ''
      ).trim();


    if (!tipo) {
      return;
    }


    const clave =
      tipo.toLowerCase();


    if (vistos.has(clave)) {
      return;
    }


    vistos.add(clave);

    tipos.push(tipo);

  });


  tipos.sort(function (a, b) {

    return a.localeCompare(
      b,
      'es'
    );

  });


  tipos.forEach(function (tipo) {

    const yaExiste =
      Array.from(
        contenedor.querySelectorAll(
          '.filter-radio-item'
        )
      ).some(function (item) {

        return String(
          item.getAttribute(
            'data-tipo'
          ) || ''
        )
          .trim()
          .toLowerCase() ===
          tipo.toLowerCase();

      });


    if (yaExiste) {
      return;
    }


    const slug =
      obtenerSlugTipo(
        tipo
      );


    if (!slug) {
      return;
    }


    const label =
      document.createElement(
        'label'
      );


    label.className =
      'filter-radio-item';


    label.setAttribute(
      'data-tipo',
      tipo
    );


    const input =
      document.createElement(
        'input'
      );


    input.type =
      'radio';

    input.name =
      'tipo_filter';

    input.value =
      tipo;

    input.className =
      'd-none';


    const dot =
      document.createElement(
        'span'
      );


    dot.className =
      'filter-dot';


    const nombre =
      document.createElement(
        'span'
      );


    nombre.className =
      'filter-name';


    nombre.textContent =
      obtenerNombreCategoria(
        tipo
      );


    const contador =
      document.createElement(
        'span'
      );


    contador.className =
      'badge rounded-pill bg-dark ms-auto';


    contador.id =
      'count-' + slug;


    contador.textContent =
      '0';


    label.appendChild(
      input
    );

    label.appendChild(
      dot
    );

    label.appendChild(
      nombre
    );

    label.appendChild(
      contador
    );


    contenedor.appendChild(
      label
    );

  });

}


function actualizarContadoresSidebar() {

  asegurarFiltrosTipo();


  const countTodos =
    document.getElementById(
      'count-todos'
    );


  if (countTodos) {

    countTodos.textContent =
      usuarios.length;

  }


  const tipoItems =
    document.querySelectorAll(
      '#filtro-tipo-grupo .filter-radio-item'
    );


  tipoItems.forEach(function (item) {

    const tipo =
      String(
        item.getAttribute(
          'data-tipo'
        ) || ''
      ).trim();


    if (!tipo) {
      return;
    }


    const slug =
      obtenerSlugTipo(
        tipo
      );


    if (!slug) {
      return;
    }


    const contador =
      document.getElementById(
        'count-' + slug
      );


    if (!contador) {
      return;
    }


    const total =
      usuarios.filter(
        function (usuario) {

          return String(
            usuario.tipo_usuario || ''
          )
            .trim()
            .toLowerCase() ===
            tipo.toLowerCase();

        }
      ).length;


    contador.textContent =
      total;

  });

}


function poblarFiltroCargos() {

  const select =
    document.getElementById(
      'filtro-cargo'
    );


  if (!select) {
    return;
  }


  const cargos = [];
  const vistos = new Set();


  usuarios.forEach(function (usuario) {

    const cargo =
      String(
        usuario.cargo || ''
      ).trim();


    if (!cargo) {
      return;
    }


    const clave =
      cargo.toLowerCase();


    if (vistos.has(clave)) {
      return;
    }


    vistos.add(clave);
    cargos.push(cargo);

  });


  cargos.sort(function (a, b) {

    return a.localeCompare(
      b,
      'es'
    );

  });


  let html =
    '<option value="">Todos los cargos</option>';


  cargos.forEach(function (cargo) {

    html +=
      '<option value="' +
      escapar(cargo) +
      '">' +
      escapar(cargo) +
      '</option>';

  });


  select.innerHTML =
    html;


  if (cargoSeleccionado) {

    select.value =
      cargoSeleccionado;

  }

}


/* =========================================================
   FILTROS
   ========================================================= */

function configurarFiltros() {

  const inputBuscar =
    document.getElementById(
      'buscar'
    );


  if (inputBuscar) {

    inputBuscar.addEventListener(
      'input',
      renderParticipantes
    );

  }


  const selectCargo =
    document.getElementById(
      'filtro-cargo'
    );


  if (selectCargo) {

    selectCargo.addEventListener(
      'change',
      function () {

        cargoSeleccionado =
          selectCargo.value.trim();

        renderParticipantes();

      }
    );

  }


  const tipoItems =
    document.querySelectorAll(
      '#filtro-tipo-grupo .filter-radio-item'
    );


  tipoItems.forEach(function (item) {

    item.addEventListener(
      'click',
      function () {

        tipoItems.forEach(function (i) {

          i.classList.remove(
            'active'
          );

        });


        item.classList.add(
          'active'
        );


        const radio =
          item.querySelector(
            'input[type="radio"]'
          );


        if (radio) {
          radio.checked = true;
        }


        tipoSeleccionado =
          item.getAttribute(
            'data-tipo'
          ) || '';


        renderParticipantes();

      }
    );

  });


  const btnLimpiar =
    document.getElementById(
      'btn-limpiar-filtros'
    );


  if (btnLimpiar) {

    btnLimpiar.addEventListener(
      'click',
      function () {

        if (inputBuscar) {
          inputBuscar.value = '';
        }


        if (selectCargo) {
          selectCargo.value = '';
        }


        cargoSeleccionado = '';
        tipoSeleccionado = '';


        tipoItems.forEach(function (item) {

          const esTodos =
            item.getAttribute(
              'data-tipo'
            ) === '';


          item.classList.toggle(
            'active',
            esTodos
          );


          const radio =
            item.querySelector(
              'input[type="radio"]'
            );


          if (radio) {
            radio.checked = esTodos;
          }

        });


        renderParticipantes();

      }
    );

  }

}


/* =========================================================
   EVENTOS
   ========================================================= */

const API_ENLACE_EDICION =
  'api/enlace_edicion.php';


function initCorreoAccesoModal() {

  const form =
    document.getElementById(
      'correo-acceso-form'
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    'submit',
    async function (event) {

      event.preventDefault();


      const input =
        document.getElementById(
          'correo-acceso-input'
        );


      const correo =
        (input.value || '').trim();


      if (!correo) {
        return;
      }


      const boton =
        form.querySelector(
          'button[type="submit"]'
        );


      if (boton) {
        boton.disabled = true;
      }


      try {

        const result =
          await apiSend(
            API_ENLACE_EDICION,
            'POST',
            {
              email: correo
            }
          );


        alert(
          result.mensaje ||
          'Si el correo corresponde a un participante registrado, recibirás un enlace para editar tu perfil.'
        );


        form.reset();


        const modalEl =
          document.getElementById(
            'correoAccesoModal'
          );


        const modal =
          bootstrap.Modal.getInstance(
            modalEl
          );


        if (modal) {
          modal.hide();
        }


      } catch (error) {

        console.error(
          'Error solicitando enlace de edicion:',
          error
        );


        alert(
          'No fue posible procesar tu solicitud. Intenta nuevamente.'
        );


      } finally {

        if (boton) {
          boton.disabled = false;
        }

      }

    }
  );

}


function configurarEventos() {

  const btnAbrirSolicitud =
    document.getElementById(
      'btnAbrirSolicitud'
    );


  if (btnAbrirSolicitud) {

    btnAbrirSolicitud.addEventListener(
      'click',
      abrirSolicitud
    );

  }


  const solicitudForm =
    document.getElementById(
      'solicitud-form'
    );


  if (solicitudForm) {

    solicitudForm.addEventListener(
      'submit',
      enviarSolicitud
    );

  }


  const hubFloorSelect =
    document.getElementById(
      'hub-floor-select'
    );


  if (hubFloorSelect) {

    hubFloorSelect.addEventListener(
      'change',
      manejarSeleccionPisoHub
    );

  }


  const hubZoneSelect =
    document.getElementById(
      'hub-zone-select'
    );


  if (hubZoneSelect) {

    hubZoneSelect.addEventListener(
      'change',
      manejarSeleccionZonaHub
    );

  }

}


/* =========================================================
   IDENTIDAD DEL SOLICITANTE
   ========================================================= */

function actualizarIdentidadSolicitud() {

  const bloqueSesion =
    document.getElementById(
      'solicitante-identidad-sesion'
    );

  const bloqueCorreo =
    document.getElementById(
      'solicitante-identidad-correo'
    );

  const nombreSesion =
    document.getElementById(
      'solicitante-sesion-nombre'
    );

  const emailInput =
    document.getElementById(
      'solicitante_email'
    );

  const nombreInput =
    document.getElementById(
      'solicitante_nombre'
    );


  if (usuarioEstaLogeado()) {

    const usuario =
      obtenerUsuarioLogeado();


    const nombreCompleto =
      [
        usuario.nombre,
        usuario.apellido
      ]
        .filter(Boolean)
        .join(' ')
        .trim();


    if (nombreSesion) {

      nombreSesion.textContent =
        nombreCompleto ||
        'Sesión activa';

    }


    if (bloqueSesion) {

      bloqueSesion.style.display =
        'block';

    }


    if (bloqueCorreo) {

      bloqueCorreo.style.display =
        'none';

    }


    /*
     * Importante:
     * Los campos anónimos quedan deshabilitados
     * para que el required del correo no bloquee
     * el submit cuando existe sesión.
     */
    if (emailInput) {

      emailInput.required = false;
      emailInput.disabled = true;

    }


    if (nombreInput) {

      nombreInput.disabled = true;

    }

    return;
  }


  /*
   * Usuario anónimo.
   */
  if (bloqueSesion) {

    bloqueSesion.style.display =
      'none';

  }


  if (bloqueCorreo) {

    bloqueCorreo.style.display =
      'block';

  }


  if (emailInput) {

    emailInput.required = true;
    emailInput.disabled = false;

  }


  if (nombreInput) {

    nombreInput.disabled = false;

  }

}


/* =========================================================
   HUB PROVIDENCIA
   ========================================================= */

function reiniciarUbicacionHub() {

  hubPisoSeleccionado = '';
  hubZonaSeleccionada = '';


  const floorSelect =
    document.getElementById(
      'hub-floor-select'
    );


  if (floorSelect) {

    floorSelect.value = '';

  }


  const mapContainer =
    document.getElementById(
      'hub-map-container'
    );


  if (mapContainer) {

    mapContainer.style.display =
      'none';

  }


  const floorName =
    document.getElementById(
      'hub-floor-name'
    );


  if (floorName) {

    floorName.textContent =
      'Mapa';

  }


  const mapPlaceholder =
    document.getElementById(
      'hub-map-placeholder'
    );


  if (mapPlaceholder) {

    mapPlaceholder.textContent =
      'PLACEHOLDER_MAPA';

  }


  const zoneContainer =
    document.getElementById(
      'hub-zone-container'
    );


  if (zoneContainer) {

    zoneContainer.style.display =
      'none';

  }


  const zoneSelect =
    document.getElementById(
      'hub-zone-select'
    );


  if (zoneSelect) {

    zoneSelect.innerHTML = `
      <option value="">
        Selecciona una zona
      </option>
    `;

    zoneSelect.value = '';
    zoneSelect.disabled = true;

  }


  const selectedContainer =
    document.getElementById(
      'hub-location-selected'
    );


  if (selectedContainer) {

    selectedContainer.style.display =
      'none';

  }


  const selectedText =
    document.getElementById(
      'hub-location-selected-text'
    );


  if (selectedText) {

    selectedText.textContent =
      '';

  }

}


function manejarSeleccionPisoHub(event) {

  const piso =
    event.target.value;


  hubPisoSeleccionado =
    piso;


  hubZonaSeleccionada =
    '';


  const floorData =
    hubData[piso];


  const mapContainer =
    document.getElementById(
      'hub-map-container'
    );


  const floorName =
    document.getElementById(
      'hub-floor-name'
    );


  const mapPlaceholder =
    document.getElementById(
      'hub-map-placeholder'
    );


  const zoneContainer =
    document.getElementById(
      'hub-zone-container'
    );


  const zoneSelect =
    document.getElementById(
      'hub-zone-select'
    );


  const selectedContainer =
    document.getElementById(
      'hub-location-selected'
    );


  const selectedText =
    document.getElementById(
      'hub-location-selected-text'
    );


  if (!floorData) {

    if (mapContainer) {
      mapContainer.style.display =
        'none';
    }


    if (zoneContainer) {
      zoneContainer.style.display =
        'none';
    }


    if (zoneSelect) {

      zoneSelect.innerHTML = `
        <option value="">
          Selecciona una zona
        </option>
      `;

      zoneSelect.value = '';
      zoneSelect.disabled = true;

    }


    if (selectedContainer) {
      selectedContainer.style.display =
        'none';
    }


    if (selectedText) {
      selectedText.textContent = '';
    }


    return;
  }


  if (mapContainer) {

    mapContainer.style.display =
      'block';

  }


  if (floorName) {

    floorName.textContent =
      floorData.floorName;

  }


  if (mapPlaceholder) {

    mapPlaceholder.textContent =
      floorData.image;

  }


  if (zoneSelect) {

    let options = `
      <option value="">
        Selecciona una zona
      </option>
    `;


    floorData.zones.forEach(
      function (zone) {

        options += `
          <option value="${escapar(zone.id)}">
            ${escapar(zone.name)}
          </option>
        `;

      }
    );


    zoneSelect.innerHTML =
      options;


    zoneSelect.value = '';
    zoneSelect.disabled = false;

  }


  if (zoneContainer) {

    zoneContainer.style.display =
      'block';

  }


  if (selectedContainer) {

    selectedContainer.style.display =
      'none';

  }


  if (selectedText) {

    selectedText.textContent =
      '';

  }

}


function manejarSeleccionZonaHub(event) {

  const zonaId =
    event.target.value;


  hubZonaSeleccionada =
    zonaId;


  const floorData =
    hubData[hubPisoSeleccionado];


  if (!floorData || !zonaId) {

    const selectedContainer =
      document.getElementById(
        'hub-location-selected'
      );


    if (selectedContainer) {

      selectedContainer.style.display =
        'none';

    }


    return;
  }


  const zona =
    floorData.zones.find(
      function (item) {

        return item.id === zonaId;

      }
    );


  if (!zona) {
    return;
  }


  const selectedContainer =
    document.getElementById(
      'hub-location-selected'
    );


  const selectedText =
    document.getElementById(
      'hub-location-selected-text'
    );


  if (selectedText) {

    selectedText.textContent =
      'Hub Providencia · ' +
      floorData.floorName +
      ' · ' +
      zona.name;

  }


  if (selectedContainer) {

    selectedContainer.style.display =
      'block';

  }

}


/* =========================================================
   RENDER PARTICIPANTES
   ========================================================= */

function renderParticipantes() {

  const grid =
    document.getElementById(
      'participantes-grid'
    );


  const mensaje =
    document.getElementById(
      'participantes-mensaje'
    );


  const contadorEl =
    document.getElementById(
      'contador-participantes'
    );


  const badgeTotalFiltros =
    document.getElementById(
      'badge-total-filtros'
    );


  if (!grid) {
    return;
  }


  const buscarEl =
    document.getElementById(
      'buscar'
    );


  const q =
    buscarEl
      ? String(
          buscarEl.value || ''
        )
          .trim()
          .toLowerCase()
      : '';


  const cargo =
    String(
      cargoSeleccionado || ''
    )
      .trim()
      .toLowerCase();


  const tipo =
    String(
      tipoSeleccionado || ''
    )
      .trim()
      .toLowerCase();


  const filtrados =
    usuarios.filter(function (usuario) {

      const texto =
        (
          String(
            usuario.nombre || ''
          ) +
          ' ' +
          String(
            usuario.apellido || ''
          ) +
          ' ' +
          String(
            usuario.empresa || ''
          ) +
          ' ' +
          String(
            usuario.cargo || ''
          ) +
          ' ' +
          String(
            usuario.intereses || ''
          )
        ).toLowerCase();


      const cargoUsuario =
        String(
          usuario.cargo || ''
        )
          .trim()
          .toLowerCase();


      const tipoUsuario =
        String(
          usuario.tipo_usuario || ''
        )
          .trim()
          .toLowerCase();


      const cumpleTexto =
        !q ||
        texto.includes(q);


      const cumpleCargo =
        !cargo ||
        cargoUsuario === cargo;


      const cumpleTipo =
        !tipo ||
        tipoUsuario === tipo;


      return (
        cumpleTexto &&
        cumpleCargo &&
        cumpleTipo
      );

    });


  if (contadorEl) {

    contadorEl.textContent =
      'Mostrando ' +
      filtrados.length +
      ' de ' +
      usuarios.length +
      ' participantes';

  }


  if (badgeTotalFiltros) {

    badgeTotalFiltros.textContent =
      tipoSeleccionado ||
      (q || cargo
        ? 'Filtrado'
        : 'Todos');

  }


  if (mensaje) {
    mensaje.innerHTML = '';
  }


  if (!filtrados.length) {

    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          No se encontraron participantes
          con los filtros seleccionados.
        </div>
      </div>
    `;

    return;
  }


  let html = '';


  filtrados.forEach(function (usuario) {

    const iniciales =
      obtenerIniciales(
        usuario.nombre,
        usuario.apellido
      );


    const avatarBg =
      obtenerColorAvatar(
        usuario.id
      );


    const interesesLista =
      String(
        usuario.intereses || ''
      )
        .split(/[,;]/)
        .map(function (i) {
          return i.trim();
        })
        .filter(function (i) {
          return i.length > 0;
        });


    let interesesHtml = '';


    if (interesesLista.length > 0) {

      interesesLista
        .slice(0, 3)
        .forEach(function (item) {

          interesesHtml += `
            <span class="badge-tag">
              ${escapar(item)}
            </span>
          `;

        });

    } else {

      interesesHtml = `
        <span class="text-white opacity-50 small">
          Sin intereses informados
        </span>
      `;

    }


    let buscaHtml = '';


    if (usuario.busca) {

      buscaHtml = `
        <div class="prop-item mb-2">

          <span class="prop-label">
            Busca:
          </span>

          <p class="prop-text-snippet mb-0 text-white opacity-75">
            ${escapar(usuario.busca)}
          </p>

        </div>
      `;

    }


    html += `
      <div class="col-12 col-md-6 col-xxl-4 d-flex">

        <div class="card participant-card-v2 w-100 shadow-sm">

          <div class="card-body d-flex flex-column p-4">

            <div class="text-center mb-3">

              ${
                usuario.foto_perfil
                  ? `
                    <div class="participant-avatar-large mx-auto shadow">
                      <img
                        src="${escapar(usuario.foto_perfil)}"
                        alt="Foto de ${escapar(usuario.nombre || 'participante')}"
                        class="participant-avatar-image"
                      >
                    </div>
                  `
                  : `
                    <div
                      class="participant-avatar-large mx-auto shadow"
                      style="background: ${avatarBg};"
                    >
                      <span class="avatar-initials">
                        ${escapar(iniciales)}
                      </span>
                    </div>
                  `
              }

            </div>


            <div class="text-center mb-2">

              <h3 class="h5 mb-1 text-white fw-bold">
                ${escapar(usuario.nombre || '')}
                ${escapar(usuario.apellido || '')}
              </h3>


              <p class="participant-role-sub text-white opacity-75 mb-0">

                ${escapar(
                  usuario.cargo ||
                  'Participante'
                )}

                ${
                  usuario.empresa
                    ? ' en <strong>' +
                      escapar(usuario.empresa) +
                      '</strong>'
                    : ''
                }

              </p>

            </div>


            <hr class="card-divider my-3">


            <div class="participant-props-list flex-grow-1">

              <div class="prop-item mb-2">

                <span class="prop-label">
                  Categoría:
                </span>

                <span
                  class="badge-role-pill badge-role-${escapar(
                    String(
                      usuario.tipo_usuario || ''
                    ).toLowerCase()
                  )}"
                >
                  ${escapar(
                    usuario.tipo_usuario ||
                    'Participante'
                  )}
                </span>

              </div>


              <div class="prop-item mb-2">

                <span class="prop-label">
                  Institución:
                </span>

                <span class="prop-value text-white">
                  ${escapar(
                    usuario.empresa ||
                    'No especificada'
                  )}
                </span>

              </div>


              <div class="prop-item mb-2">

                <span class="prop-label d-block mb-1">
                  Intereses y enfoque:
                </span>

                <div class="d-flex flex-wrap gap-1">
                  ${interesesHtml}
                </div>

              </div>

              ${buscaHtml}

            </div>


            <div class="text-start my-2">

              <a
                href="#"
                class="participant-link-more"
                data-perfil-id="${Number(usuario.id)}"
              >
                Ver más detalles
              </a>

            </div>


            <div class="mt-2 pt-2">

              <button
                type="button"
                class="btn btn-primary rounded-pill w-100 py-2 fw-bold btn-action-pill"
                data-solicitud-id="${Number(usuario.id)}"
              >
                Solicitar reunión
              </button>

            </div>

          </div>

        </div>

      </div>
    `;

  });


  grid.innerHTML =
    html;


  const linksPerfil =
    grid.querySelectorAll(
      '.participant-link-more'
    );


  linksPerfil.forEach(function (link) {

    link.addEventListener(
      'click',
      function (event) {

        event.preventDefault();


        const id =
          this.getAttribute(
            'data-perfil-id'
          );


        verPerfil(id);

      }
    );

  });


  const botonesSolicitud =
    grid.querySelectorAll(
      '[data-solicitud-id]'
    );


  botonesSolicitud.forEach(function (boton) {

    boton.addEventListener(
      'click',
      function () {

        const id =
          this.getAttribute(
            'data-solicitud-id'
          );


        abrirSolicitudDirecta(id);

      }
    );

  });

}


/* =========================================================
   PERFIL
   ========================================================= */

function verPerfil(id) {

  perfilSeleccionado =
    usuarios.find(function (usuario) {

      return String(usuario.id) ===
        String(id);

    });


  if (!perfilSeleccionado) {
    return;
  }


  const iniciales =
    obtenerIniciales(
      perfilSeleccionado.nombre,
      perfilSeleccionado.apellido
    );


  const avatarBg =
    obtenerColorAvatar(
      perfilSeleccionado.id
    );


  const titulo =
    document.getElementById(
      'perfilTitulo'
    );


  if (titulo) {

    titulo.innerHTML = `
      <div class="d-flex align-items-center gap-2">

        ${
          perfilSeleccionado.foto_perfil
            ? `
              <div class="profile-avatar-small shadow-sm">
                <img
                  src="${escapar(perfilSeleccionado.foto_perfil)}"
                  alt="Foto de perfil"
                  class="participant-avatar-image"
                >
              </div>
            `
            : `
              <div
                class="profile-avatar-small d-inline-flex align-items-center justify-content-center text-white fw-bold"
                style="background: ${avatarBg};"
              >
                ${escapar(iniciales)}
              </div>
            `
        }

        <div>

          <div class="fw-bold">
            ${escapar(
              perfilSeleccionado.nombre || ''
            )}
            ${escapar(
              perfilSeleccionado.apellido || ''
            )}
          </div>

          <span
            class="badge bg-primary text-white"
            style="font-size: 0.72rem;"
          >
            ${escapar(
              perfilSeleccionado.tipo_usuario ||
              'Participante'
            )}
          </span>

        </div>

      </div>
    `;

  }


  const contenido =
    document.getElementById(
      'perfilContenido'
    );


  if (contenido) {

    contenido.innerHTML = `

      <div class="row g-3">

        <div class="col-md-6">

          <div class="profile-label">
            Empresa / institución
          </div>

          <p class="mb-0 text-white">
            ${escapar(
              perfilSeleccionado.empresa ||
              'No informado'
            )}
          </p>

        </div>


        <div class="col-md-6">

          <div class="profile-label">
            Cargo / rol
          </div>

          <p class="mb-0 text-white">
            ${escapar(
              perfilSeleccionado.cargo ||
              'No informado'
            )}
          </p>

        </div>


        <div class="col-12">

          <div class="profile-label">
            Intereses
          </div>

          <p class="mb-0 text-white">
            ${escapar(
              perfilSeleccionado.intereses ||
              'No informado'
            )}
          </p>

        </div>


        <div class="col-12">

          <div class="profile-label">
            Busca en el evento
          </div>

          <p class="mb-0 text-white">
            ${escapar(
              perfilSeleccionado.busca ||
              'No informado'
            )}
          </p>

        </div>


        <div class="col-12">

          <div class="profile-label">
            Descripción
          </div>

          <p class="mb-0 text-white">
            ${escapar(
              perfilSeleccionado.descripcion ||
              'No informado'
            )}
          </p>

        </div>

      </div>

    `;

  }


  if (perfilModal) {
    perfilModal.show();
  }

}


/* =========================================================
   SOLICITUD
   ========================================================= */

function abrirSolicitudDirecta(id) {

  perfilSeleccionado =
    usuarios.find(function (usuario) {

      return String(usuario.id) ===
        String(id);

    });


  if (!perfilSeleccionado) {
    return;
  }


  abrirSolicitud();

}


async function abrirSolicitud() {

  if (!perfilSeleccionado) {
    return;
  }


  const usuarioActual =
    obtenerUsuarioLogeado();


  /*
   * Si existe sesión usamos automáticamente
   * esa identidad.
   *
   * Si no existe sesión, permitimos continuar
   * y solicitamos correo en el formulario.
   */


  /*
   * Evitar solicitarse una reunión a sí mismo
   * solamente cuando existe sesión.
   */
  if (
    usuarioActual &&
    String(usuarioActual.id) ===
    String(perfilSeleccionado.id)
  ) {

    alert(
      'No puedes solicitar una reunión contigo mismo.'
    );

    return;
  }


  const iniciales =
    obtenerIniciales(
      perfilSeleccionado.nombre,
      perfilSeleccionado.apellido
    );


  const avatarBg =
    obtenerColorAvatar(
      perfilSeleccionado.id
    );


  const previewEl =
    document.getElementById(
      'solicitudDestino'
    );


  if (previewEl) {

    let empresaTexto = '';


    if (perfilSeleccionado.empresa) {

      empresaTexto =
        ' en ' +
        escapar(
          perfilSeleccionado.empresa
        );

    }


    previewEl.innerHTML = `
      <div class="d-flex align-items-center gap-3">

        ${
          perfilSeleccionado.foto_perfil
            ? `
              <div class="meeting-avatar-small shadow-sm">
                <img
                  src="${escapar(perfilSeleccionado.foto_perfil)}"
                  alt="Foto de perfil"
                  class="participant-avatar-image"
                >
              </div>
            `
            : `
              <div
                class="meeting-avatar-small d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                style="background: ${avatarBg};"
              >
                ${escapar(iniciales)}
              </div>
            `
        }


        <div class="overflow-hidden">

          <div class="small text-white opacity-75">
            Reunión privada con:
          </div>


          <div class="h6 mb-0 text-white fw-bold text-truncate">
            ${escapar(
              perfilSeleccionado.nombre || ''
            )}
            ${escapar(
              perfilSeleccionado.apellido || ''
            )}
          </div>


          <div class="small text-white opacity-75 text-truncate">
            ${escapar(
              perfilSeleccionado.cargo ||
              'Participante'
            )}${empresaTexto}
          </div>

        </div>

      </div>
    `;

  }


  /*
   * Configurar identidad del solicitante.
   */
  actualizarIdentidadSolicitud();


  const receptorInput =
    document.getElementById(
      'receptor_id'
    );


  if (receptorInput) {

    receptorInput.value =
      perfilSeleccionado.id;

  }


  const horarioInput =
    document.getElementById(
      'bloque_horario_id'
    );


  if (horarioInput) {
    horarioInput.value = '';
  }


  const mensajeInput =
    document.getElementById(
      'solicitud-mensaje-input'
    );


  if (mensajeInput) {
    mensajeInput.value = '';
  }


  const mensajeEstado =
    document.getElementById(
      'solicitud-mensaje'
    );


  if (mensajeEstado) {
    mensajeEstado.innerHTML = '';
  }


  reiniciarUbicacionHub();


  const horarioSeleccionado =
    document.getElementById(
      'horario-seleccionado-container'
    );


  if (horarioSeleccionado) {

    horarioSeleccionado.style.display =
      'none';

  }


  const horarioTexto =
    document.getElementById(
      'horario-seleccionado-texto'
    );


  if (horarioTexto) {
    horarioTexto.textContent = '';
  }


  const container =
    document.getElementById(
      'horarios-slots-container'
    );


  const ayuda =
    document.getElementById(
      'horarios-ayuda'
    );


  const boton =
    document.getElementById(
      'btnEnviarSolicitud'
    );


  if (container) {

    container.innerHTML = `
      <div class="text-center py-4 text-white opacity-75 small">
        Cargando horarios...
      </div>
    `;

  }


  if (boton) {
    boton.disabled = true;
  }


  try {

    /*
     * Usuario logueado:
     * receptor + solicitante.
     *
     * Usuario anónimo:
     * solamente receptor.
     */
    let url =
      API_HORARIOS +
      '?receptor_id=' +
      encodeURIComponent(
        perfilSeleccionado.id
      );


    if (usuarioActual) {

      url +=
        '&solicitante_id=' +
        encodeURIComponent(
          usuarioActual.id
        );

    }


    const data =
      await apiGet(url);


    let bloques = [];


    if (
      data &&
      data.exito &&
      Array.isArray(data.bloques)
    ) {

      bloques =
        data.bloques.filter(
          function (bloque) {
            return !!bloque;
          }
        );

    }


    if (!bloques.length) {

      if (container) {

        container.innerHTML = `
          <div class="p-3 text-center text-white opacity-75">

            <div class="mb-1 fw-bold">
              No hay horarios disponibles
            </div>

            <div class="small">
              ${escapar(
                data && data.mensaje
                  ? data.mensaje
                  : 'No existen horarios configurados para este evento.'
              )}
            </div>

          </div>
        `;

      }


      if (ayuda) {
        ayuda.textContent =
          '0 horarios';
      }


      if (solicitudModal) {
        solicitudModal.show();
      }


      return;
    }


    const disponibles =
      bloques.filter(
        function (bloque) {

          return (
            bloque.ocupado !== true &&
            bloque.ocupado !== 1 &&
            bloque.ocupado !== '1' &&
            (
              bloque.disponible === true ||
              bloque.disponible === 1 ||
              bloque.disponible === '1'
            )
          );

        }
      );


    if (ayuda) {

      ayuda.textContent =
        disponibles.length +
        ' disponibles · ' +
        bloques.length +
        ' horarios';

    }


    const gruposPorFecha = {};


    bloques.forEach(
      function (bloque) {

        const dInicio =
          convertirFecha(
            bloque.inicio
          );


        let fechaTitulo =
          'Horarios';


        if (!isNaN(dInicio.getTime())) {

          const fechaFormateada =
            new Intl.DateTimeFormat(
              'es-CL',
              {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }
            ).format(dInicio);


          fechaTitulo =
            fechaFormateada
              .charAt(0).toUpperCase() +
            fechaFormateada.slice(1);

        }


        if (!gruposPorFecha[fechaTitulo]) {

          gruposPorFecha[fechaTitulo] =
            [];

        }


        gruposPorFecha[
          fechaTitulo
        ].push(bloque);

      }
    );


    let html = '';


    Object.keys(
      gruposPorFecha
    ).forEach(
      function (fechaTitulo) {

        const bloques =
          gruposPorFecha[
            fechaTitulo
          ];


        html += `
          <div class="slots-date-group mb-3">

            <div
              class="slots-date-header small fw-bold text-white opacity-90 mb-2 pb-1 border-bottom border-secondary border-opacity-25"
            >
              ${escapar(fechaTitulo)}
            </div>

            <div class="slots-grid">
        `;


        bloques.forEach(
          function (bloque) {

            const dIni =
              convertirFecha(
                bloque.inicio
              );


            const dFin =
              convertirFecha(
                bloque.fin
              );


            let horaTexto =
              'Horario';


            if (
              !isNaN(dIni.getTime()) &&
              !isNaN(dFin.getTime())
            ) {

              const horaInicio =
                new Intl.DateTimeFormat(
                  'es-CL',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }
                ).format(dIni);


              const horaFin =
                new Intl.DateTimeFormat(
                  'es-CL',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }
                ).format(dFin);


              horaTexto =
                horaInicio +
                ' - ' +
                horaFin;

            } else {

              horaTexto =
                formatearHorario(
                  bloque.inicio,
                  bloque.fin
                );

            }


            const estaOcupado =
              bloque.ocupado === true ||
              bloque.ocupado === 1 ||
              bloque.ocupado === '1';


            const estaDisponible =
              bloque.disponible === true ||
              bloque.disponible === 1 ||
              bloque.disponible === '1';


            const puedeSeleccionarse =
              !estaOcupado &&
              estaDisponible;


            if (puedeSeleccionarse) {

              html += `
                <button
                  type="button"
                  class="slot-time-btn"
                  data-slot-id="${Number(bloque.id)}"
                >

                  <span class="slot-time-text">
                    ${escapar(horaTexto)}
                  </span>

                  <span class="slot-status-text">
                    🟢 Disponible
                  </span>

                </button>
              `;

            } else {

              html += `
                <button
                  type="button"
                  class="slot-time-btn slot-time-btn-closed"
                  disabled
                  aria-disabled="true"
                >

                  <span class="slot-time-text">
                    ${escapar(horaTexto)}
                  </span>

                  <span class="slot-status-text">
                    🔒 Cerrado
                  </span>

                </button>
              `;

            }

          }
        );


        html += `
            </div>
          </div>
        `;

      }
    );


    if (container) {
      container.innerHTML = html;
    }


    const slots =
      container
        ? container.querySelectorAll(
            '.slot-time-btn:not(:disabled)'
          )
        : [];


    slots.forEach(
      function (slot) {

        slot.addEventListener(
          'click',
          function () {

            const id =
              this.getAttribute(
                'data-slot-id'
              );


            const texto =
              this.querySelector(
                '.slot-time-text'
              )?.textContent ||
              'Horario seleccionado';


            seleccionarHorarioSlot(
              this,
              id,
              texto
            );

          }
        );

      }
    );


  } catch (error) {

    console.error(
      'Error cargando horarios:',
      error
    );


    if (container) {

      container.innerHTML = `
        <div class="alert alert-danger small">
          No fue posible cargar los horarios.
        </div>
      `;

    }

  }


  if (solicitudModal) {
    solicitudModal.show();
  }

}


/* =========================================================
   SELECCIÓN DE HORARIO
   ========================================================= */

function seleccionarHorarioSlot(
  boton,
  id,
  texto
) {

  document
    .querySelectorAll(
      '.slot-time-btn'
    )
    .forEach(
      function (b) {

        b.classList.remove(
          'active'
        );

      }
    );


  boton.classList.add(
    'active'
  );


  const input =
    document.getElementById(
      'bloque_horario_id'
    );


  if (input) {
    input.value = id;
  }


  const textoEl =
    document.getElementById(
      'horario-seleccionado-texto'
    );


  if (textoEl) {
    textoEl.textContent =
      texto;
  }


  const container =
    document.getElementById(
      'horario-seleccionado-container'
    );


  if (container) {

    container.style.display =
      'block';

  }


  const botonEnviar =
    document.getElementById(
      'btnEnviarSolicitud'
    );


  if (botonEnviar) {

    botonEnviar.disabled =
      false;

  }

}


/* =========================================================
   ENVÍO DE SOLICITUD
   ========================================================= */

async function enviarSolicitud(event) {

  event.preventDefault();


  const usuarioActual =
    obtenerUsuarioLogeado();


  /*
   * Datos del usuario anónimo.
   *
   * Si hay sesión, estos campos estarán deshabilitados
   * y no necesitamos utilizarlos.
   */
  const emailInput =
    document.getElementById(
      'solicitante_email'
    );


  const nombreInput =
    document.getElementById(
      'solicitante_nombre'
    );


  const email =
    emailInput
      ? emailInput.value.trim()
      : '';


  const nombreAnonimo =
    nombreInput
      ? nombreInput.value.trim()
      : '';


  /*
   * Si NO hay sesión, el correo es obligatorio.
   */
  if (!usuarioActual) {

    if (!email) {

      mostrarMensajeSolicitud(
        'Ingresa tu correo electrónico para solicitar una reunión.',
        'warning'
      );

      return;
    }


    if (!validarEmail(email)) {

      mostrarMensajeSolicitud(
        'Ingresa un correo electrónico válido.',
        'warning'
      );

      return;
    }

  }


  const receptorInput =
    document.getElementById(
      'receptor_id'
    );


  const receptorId =
    receptorInput
      ? receptorInput.value
      : '';


  const bloqueInput =
    document.getElementById(
      'bloque_horario_id'
    );


  const bloqueHorarioId =
    bloqueInput
      ? bloqueInput.value
      : '';


  const mensajeInput =
    document.getElementById(
      'solicitud-mensaje-input'
    );


  const mensajeTexto =
    mensajeInput
      ? mensajeInput.value.trim()
      : '';


  let mensajeFinal =
    mensajeTexto;


  /*
   * Ubicación Hub.
   */
  if (
    hubPisoSeleccionado &&
    hubZonaSeleccionada
  ) {

    const floorData =
      hubData[hubPisoSeleccionado];


    if (floorData) {

      const zona =
        floorData.zones.find(
          function (item) {

            return item.id ===
              hubZonaSeleccionada;

          }
        );


      if (zona) {

        const ubicacion =
          'Ubicación: Hub Providencia · ' +
          floorData.floorName +
          ' · ' +
          zona.name;


        mensajeFinal =
          mensajeFinal
            ? mensajeFinal +
              '\n\n' +
              ubicacion
            : ubicacion;

      }

    }

  }


  /*
   * Contacto:
   *
   * - Con sesión: usamos nombre de la sesión.
   * - Sin sesión: usamos el nombre ingresado.
   */
  let nombreContacto = '';


  if (usuarioActual) {

    nombreContacto =
      [
        usuarioActual.nombre,
        usuarioActual.apellido
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

  } else {

    nombreContacto =
      nombreAnonimo;

  }


  if (nombreContacto) {

    const contacto =
      'Contacto: ' +
      nombreContacto;


    mensajeFinal =
      mensajeFinal
        ? mensajeFinal +
          '\n\n' +
          contacto
        : contacto;

  }


  if (!receptorId) {

    mostrarMensajeSolicitud(
      'No se pudo identificar al participante.',
      'danger'
    );


    return;
  }


  /*
   * Solo verificamos "yo mismo" cuando hay sesión.
   *
   * En modo anónimo el backend resuelve al usuario
   * mediante el correo y también hace esta validación.
   */
  if (
    usuarioActual &&
    String(usuarioActual.id) ===
    String(receptorId)
  ) {

    mostrarMensajeSolicitud(
      'No puedes solicitar una reunión contigo mismo.',
      'warning'
    );


    return;
  }


  if (!bloqueHorarioId) {

    mostrarMensajeSolicitud(
      'Por favor selecciona un horario de la lista.',
      'warning'
    );


    return;
  }


  const boton =
    document.getElementById(
      'btnEnviarSolicitud'
    );


  if (boton) {
    boton.disabled = true;
  }


  mostrarMensajeSolicitud(
    'Validando y enviando solicitud...',
    'info'
  );


  try {

    /*
     * =====================================================
     * PAYLOAD
     * =====================================================
     *
     * CON SESIÓN:
     * la API obtiene el solicitante desde $_SESSION.
     *
     * SIN SESIÓN:
     * la API busca al solicitante mediante email.
     */
    const payload = {

      receptor_id:
        receptorId,

      bloque_horario_id:
        bloqueHorarioId,

      mensaje:
        mensajeFinal

    };


    if (!usuarioActual) {

      payload.email =
        email;

      payload.nombre =
        nombreAnonimo;

    }


    const result =
      await apiSend(
        API_SOLICITUDES,
        'POST',
        payload
      );


    if (!result || !result.exito) {

      mostrarMensajeSolicitud(
        result && result.mensaje
          ? result.mensaje
          : 'No se pudo procesar la solicitud.',
        'danger'
      );


      if (boton) {
        boton.disabled = false;
      }


      return;
    }


    const mensajeEstado =
      document.getElementById(
        'solicitud-mensaje'
      );


    if (mensajeEstado) {

      mensajeEstado.innerHTML = `
        <div class="alert alert-success py-2 small">
          <strong>Solicitud enviada correctamente.</strong>
        </div>
      `;

    }


    setTimeout(
      function () {

        if (solicitudModal) {
          solicitudModal.hide();
        }


        if (perfilModal) {
          perfilModal.hide();
        }


        const form =
          document.getElementById(
            'solicitud-form'
          );


        if (form) {
          form.reset();
        }


        const horarioInput =
          document.getElementById(
            'bloque_horario_id'
          );


        if (horarioInput) {
          horarioInput.value = '';
        }


        const receptorInput =
          document.getElementById(
            'receptor_id'
          );


        if (receptorInput) {
          receptorInput.value = '';
        }


        const mensajeInput =
          document.getElementById(
            'solicitud-mensaje-input'
          );


        if (mensajeInput) {
          mensajeInput.value = '';
        }


        const mensajeEstado =
          document.getElementById(
            'solicitud-mensaje'
          );


        if (mensajeEstado) {
          mensajeEstado.innerHTML = '';
        }


        const horarioSeleccionado =
          document.getElementById(
            'horario-seleccionado-container'
          );


        if (horarioSeleccionado) {

          horarioSeleccionado.style.display =
            'none';

        }


        const horarioTexto =
          document.getElementById(
            'horario-seleccionado-texto'
          );


        if (horarioTexto) {
          horarioTexto.textContent = '';
        }


        /*
         * Limpiar datos anónimos.
         */
        const emailInput =
          document.getElementById(
            'solicitante_email'
          );


        if (emailInput) {
          emailInput.value = '';
        }


        const nombreInput =
          document.getElementById(
            'solicitante_nombre'
          );


        if (nombreInput) {
          nombreInput.value = '';
        }


        reiniciarUbicacionHub();


        actualizarIdentidadSolicitud();


        if (boton) {
          boton.disabled = true;
        }

      },
      1200
    );


  } catch (error) {

    console.error(
      'Error enviando solicitud:',
      error
    );


    mostrarMensajeSolicitud(
      'No fue posible procesar la solicitud.',
      'danger'
    );


    if (boton) {
      boton.disabled = false;
    }

  }

}


/* =========================================================
   UTILIDADES
   ========================================================= */

function mostrarMensajeSolicitud(
  texto,
  tipo
) {

  if (!tipo) {
    tipo = 'info';
  }


  const elemento =
    document.getElementById(
      'solicitud-mensaje'
    );


  if (!elemento) {
    return;
  }


  elemento.innerHTML = `
    <div class="alert alert-${escapar(tipo)} py-2 small">
      ${escapar(texto)}
    </div>
  `;

}


function validarEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );

}


function obtenerIniciales(
  nombre,
  apellido
) {

  const n =
    String(nombre || '')
      .trim()
      .charAt(0)
      .toUpperCase();


  const a =
    String(apellido || '')
      .trim()
      .charAt(0)
      .toUpperCase();


  return (
    n + a
  ) || 'P';

}


function obtenerColorAvatar(id) {

  const gradientes = [

    'linear-gradient(135deg, #37a9df, #1688bd)',
    'linear-gradient(135deg, #f58220, #d96d16)',
    'linear-gradient(135deg, #614385, #516395)',
    'linear-gradient(135deg, #10384f, #37a9df)',
    'linear-gradient(135deg, #20bf6b, #0fb9b1)',
    'linear-gradient(135deg, #eb3b5a, #fa8231)'

  ];


  return gradientes[
    Math.abs(
      Number(id) || 0
    ) %
    gradientes.length
  ];

}


function convertirFecha(valor) {

  if (!valor) {
    return new Date(NaN);
  }


  return new Date(
    String(valor)
      .replace(
        ' ',
        'T'
      )
  );

}


function formatearHorario(
  inicio,
  fin
) {

  if (!inicio || !fin) {
    return 'Horario';
  }


  const extraerHora =
    function (valor) {

      const texto =
        String(valor);


      const partes =
        texto.split(' ');


      if (partes.length > 1) {

        return partes[1]
          .substring(0, 5);

      }


      return texto
        .substring(0, 5);

    };


  return (
    extraerHora(inicio) +
    ' - ' +
    extraerHora(fin)
  );

}


/* =========================================================
   ESCAPADO HTML
   ========================================================= */

function escapar(valor) {

  return String(
    valor ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}