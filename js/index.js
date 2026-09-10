let usuarios = [];
let perfilSeleccionado = null;
let perfilModal = null;
let solicitudModal = null;

let cargoSeleccionado = '';
let tipoSeleccionado = '';


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener('DOMContentLoaded', async function () {

  const perfilModalEl = document.getElementById('perfilModal');
  const solicitudModalEl = document.getElementById('solicitudModal');

  if (perfilModalEl && typeof bootstrap !== 'undefined') {
    perfilModal = new bootstrap.Modal(perfilModalEl);
  }

  if (solicitudModalEl && typeof bootstrap !== 'undefined') {
    solicitudModal = new bootstrap.Modal(solicitudModalEl);
  }

  await cargarParticipantes();

  configurarFiltros();
  configurarEventos();
  initCorreoAccesoModal();

  const urlParams = new URLSearchParams(window.location.search);
  const verPerfilId = urlParams.get('ver_perfil');

  if (verPerfilId) {
    verPerfil(verPerfilId);
  }

});


/* =========================================================
   PARTICIPANTES
   ========================================================= */

async function cargarParticipantes() {

  try {

    const data = await apiGet(API_USUARIOS);

    if (
      data &&
      data.exito &&
      Array.isArray(data.usuarios)
    ) {
      usuarios = data.usuarios;
    } else {
      usuarios = [];
    }

    actualizarContadoresSidebar();
    poblarFiltroCargos();
    renderParticipantes();

  } catch (error) {

    console.error('Error cargando participantes:', error);

    usuarios = [];

    const mensaje = document.getElementById(
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


function actualizarContadoresSidebar() {

  const countTodos =
    document.getElementById('count-todos');

  const countExpositor =
    document.getElementById('count-expositor');

  const countAsistente =
    document.getElementById('count-asistente');

  const countOrganizador =
    document.getElementById('count-organizador');


  if (countTodos) {
    countTodos.textContent = usuarios.length;
  }


  if (countExpositor) {

    countExpositor.textContent =
      usuarios.filter(function (u) {
        return String(u.tipo_usuario || '')
          .toLowerCase() === 'expositor';
      }).length;

  }


  if (countAsistente) {

    countAsistente.textContent =
      usuarios.filter(function (u) {
        return String(u.tipo_usuario || '')
          .toLowerCase() === 'asistente';
      }).length;

  }


  if (countOrganizador) {

    countOrganizador.textContent =
      usuarios.filter(function (u) {
        return String(u.tipo_usuario || '')
          .toLowerCase() === 'organizador';
      }).length;

  }

}


function poblarFiltroCargos() {

  const select =
    document.getElementById('filtro-cargo');

  if (!select) {
    return;
  }

  const cargos = [];
  const vistos = new Set();

  usuarios.forEach(function (usuario) {

    const cargo =
      String(usuario.cargo || '').trim();

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
    return a.localeCompare(b, 'es');
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


  select.innerHTML = html;


  if (cargoSeleccionado) {
    select.value = cargoSeleccionado;
  }

}


/* =========================================================
   FILTROS
   ========================================================= */

function configurarFiltros() {

  const inputBuscar =
    document.getElementById('buscar');

  if (inputBuscar) {

    inputBuscar.addEventListener(
      'input',
      renderParticipantes
    );

  }


  const selectCargo =
    document.getElementById('filtro-cargo');

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
          i.classList.remove('active');
        });


        item.classList.add('active');


        const radio =
          item.querySelector(
            'input[type="radio"]'
          );


        if (radio) {
          radio.checked = true;
        }


        tipoSeleccionado =
          item.getAttribute('data-tipo') || '';


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
            item.getAttribute('data-tipo') === '';


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
const API_ENLACE_EDICION = 'api/enlace_edicion.php';

function initCorreoAccesoModal() {

  const form = document.getElementById('correo-acceso-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = document.getElementById('correo-acceso-input');
    const correo = (input.value || '').trim();

    if (!correo) return;

    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true;

    try {

      const result = await apiSend(API_ENLACE_EDICION, 'POST', { email: correo });

      alert(
        result.mensaje ||
        'Si el correo corresponde a un participante registrado, recibirás un enlace para editar tu perfil.'
      );

      form.reset();

      const modalEl = document.getElementById('correoAccesoModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

    } catch (error) {

      console.error('Error solicitando enlace de edicion:', error);
      alert('No fue posible procesar tu solicitud. Intenta nuevamente.');

    } finally {

      if (boton) boton.disabled = false;

    }
  });

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
    document.getElementById('buscar');


  const q =
    buscarEl
      ? String(buscarEl.value || '')
          .trim()
          .toLowerCase()
      : '';


  const cargo =
    String(cargoSeleccionado || '')
      .trim()
      .toLowerCase();


  const tipo =
    String(tipoSeleccionado || '')
      .trim()
      .toLowerCase();


  const filtrados =
    usuarios.filter(function (usuario) {

      const texto =
        (
          String(usuario.nombre || '') + ' ' +
          String(usuario.apellido || '') + ' ' +
          String(usuario.empresa || '') + ' ' +
          String(usuario.cargo || '') + ' ' +
          String(usuario.intereses || '')
        ).toLowerCase();


      const cargoUsuario =
        String(usuario.cargo || '')
          .trim()
          .toLowerCase();


      const tipoUsuario =
        String(usuario.tipo_usuario || '')
          .trim()
          .toLowerCase();


      const cumpleTexto =
        !q || texto.includes(q);


      const cumpleCargo =
        !cargo || cargoUsuario === cargo;


      const cumpleTipo =
        !tipo || tipoUsuario === tipo;


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
      (q || cargo ? 'Filtrado' : 'Todos');

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
      String(usuario.intereses || '')
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

              <div
                class="participant-avatar-large mx-auto shadow"
                style="background: ${avatarBg};"
              >
                <span class="avatar-initials">
                  ${escapar(iniciales)}
                </span>
              </div>

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
                    String(usuario.tipo_usuario || '')
                      .toLowerCase()
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


  grid.innerHTML = html;


  /* Eventos después de pintar */

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
          this.getAttribute('data-perfil-id');

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
          this.getAttribute('data-solicitud-id');

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

      return String(usuario.id) === String(id);

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

        <div
          class="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
          style="
            width: 38px;
            height: 38px;
            background: ${avatarBg};
            font-size: 0.9rem;
          "
        >
          ${escapar(iniciales)}
        </div>

        <div>

          <div class="fw-bold">
            ${escapar(perfilSeleccionado.nombre || '')}
            ${escapar(perfilSeleccionado.apellido || '')}
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

      return String(usuario.id) === String(id);

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
        escapar(perfilSeleccionado.empresa);
    }


    previewEl.innerHTML = `
      <div class="d-flex align-items-center gap-3">

        <div
          class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
          style="
            width: 48px;
            height: 48px;
            background: ${avatarBg};
            font-size: 1.1rem;
            flex-shrink: 0;
          "
        >
          ${escapar(iniciales)}
        </div>


        <div class="overflow-hidden">

          <div class="small text-white opacity-75">
            Reunión privada con:
          </div>


          <div class="h6 mb-0 text-white fw-bold text-truncate">
            ${escapar(perfilSeleccionado.nombre || '')}
            ${escapar(perfilSeleccionado.apellido || '')}
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


  /*
   * El textarea real es:
   * solicitud-mensaje-input
   *
   * El elemento:
   * solicitud-mensaje
   *
   * es solamente el contenedor de mensajes
   * de estado de la solicitud.
   */

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
    horarioSeleccionado.style.display = 'none';
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
        Cargando horarios libres...
      </div>
    `;

  }


  if (boton) {
    boton.disabled = true;
  }


  try {

    const data =
      await apiGet(
        API_HORARIOS +
        '?receptor_id=' +
        encodeURIComponent(
          perfilSeleccionado.id
        )
      );


    let disponibles = [];


    if (
      data &&
      data.exito &&
      Array.isArray(data.bloques)
    ) {

      disponibles =
        data.bloques.filter(function (bloque) {

          return (
            bloque &&
            (
              bloque.disponible === true ||
              bloque.disponible === 1 ||
              bloque.disponible === '1'
            )
          );

        });

    }


    if (!disponibles.length) {

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
                  : 'No existen horarios disponibles para esta reunión.'
              )}
            </div>

          </div>
        `;

      }


      if (ayuda) {
        ayuda.textContent = '0 disponibles';
      }


      if (solicitudModal) {
        solicitudModal.show();
      }


      return;
    }


    if (ayuda) {

      ayuda.textContent =
        disponibles.length +
        ' horarios disponibles';

    }


    const gruposPorFecha = {};


    disponibles.forEach(function (bloque) {

      const dInicio =
        convertirFecha(
          bloque.inicio
        );


      let fechaTitulo =
        'Horarios disponibles';


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
          fechaFormateada.charAt(0).toUpperCase() +
          fechaFormateada.slice(1);

      }


      if (!gruposPorFecha[fechaTitulo]) {
        gruposPorFecha[fechaTitulo] = [];
      }


      gruposPorFecha[fechaTitulo].push(
        bloque
      );

    });


    let html = '';


    Object.keys(gruposPorFecha).forEach(
      function (fechaTitulo) {

        const bloques =
          gruposPorFecha[fechaTitulo];


        html += `
          <div class="slots-date-group mb-3">

            <div
              class="slots-date-header small fw-bold text-white opacity-90 mb-2 pb-1 border-bottom border-secondary border-opacity-25"
            >
              ${escapar(fechaTitulo)}
            </div>

            <div class="slots-grid">
        `;


        bloques.forEach(function (bloque) {

          const dIni =
            convertirFecha(
              bloque.inicio
            );


          const dFin =
            convertirFecha(
              bloque.fin
            );


          let horaTexto = 'Horario disponible';


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


          html += `
            <button
              type="button"
              class="slot-time-btn"
              data-slot-id="${Number(bloque.id)}"
            >
              <span class="slot-time-text">
                ${escapar(horaTexto)}
              </span>
            </button>
          `;

        });


        html += `
            </div>
          </div>
        `;

      }
    );


    if (container) {
      container.innerHTML = html;
    }


    /* Eventos de los horarios */

    const slots =
      container
        ? container.querySelectorAll(
            '.slot-time-btn'
          )
        : [];


    slots.forEach(function (slot) {

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

    });


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
    .querySelectorAll('.slot-time-btn')
    .forEach(function (b) {

      b.classList.remove('active');

    });


  boton.classList.add('active');


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
    textoEl.textContent = texto;
  }


  const container =
    document.getElementById(
      'horario-seleccionado-container'
    );


  if (container) {
    container.style.display = 'block';
  }


  const botonEnviar =
    document.getElementById(
      'btnEnviarSolicitud'
    );


  if (botonEnviar) {
    botonEnviar.disabled = false;
  }

}


/* =========================================================
   ENVÍO DE SOLICITUD
   ========================================================= */

async function enviarSolicitud(event) {

  event.preventDefault();


  const form =
    event.currentTarget;


  /* ---------------------------------------------------------
     CORREO
     --------------------------------------------------------- */

  const emailInput =
    document.getElementById(
      'solicitante_email'
    );


  const email =
    emailInput
      ? emailInput.value.trim()
      : '';


  /* ---------------------------------------------------------
     NOMBRE OPCIONAL
     --------------------------------------------------------- */

  const nombreInput =
    document.getElementById(
      'solicitante_nombre'
    );


  const nombre =
    nombreInput
      ? nombreInput.value.trim()
      : '';


  /* ---------------------------------------------------------
     RECEPTOR
     --------------------------------------------------------- */

  const receptorInput =
    document.getElementById(
      'receptor_id'
    );


  const receptorId =
    receptorInput
      ? receptorInput.value
      : '';


  /* ---------------------------------------------------------
     HORARIO
     --------------------------------------------------------- */

  const bloqueInput =
    document.getElementById(
      'bloque_horario_id'
    );


  const bloqueHorarioId =
    bloqueInput
      ? bloqueInput.value
      : '';


  /* ---------------------------------------------------------
     MENSAJE
     --------------------------------------------------------- */

  const mensajeInput =
    document.getElementById(
      'solicitud-mensaje-input'
    );


  const mensajeTexto =
    mensajeInput
      ? mensajeInput.value.trim()
      : '';


  /* ---------------------------------------------------------
     VALIDACIONES
     --------------------------------------------------------- */

  if (!email) {

    mostrarMensajeSolicitud(
      'Por favor ingresa tu correo electrónico.',
      'warning'
    );


    if (emailInput) {
      emailInput.focus();
    }


    return;
  }


  if (!validarEmail(email)) {

    mostrarMensajeSolicitud(
      'Por favor ingresa un correo electrónico válido.',
      'warning'
    );


    if (emailInput) {
      emailInput.focus();
    }


    return;
  }


  if (!receptorId) {

    mostrarMensajeSolicitud(
      'No se pudo identificar al participante.',
      'danger'
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


  /* ---------------------------------------------------------
     ENVÍO
     --------------------------------------------------------- */

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

    const result =
      await apiSend(
        API_SOLICITUDES,
        'POST',
        {
          email: email,
          nombre: nombre,
          receptor_id: receptorId,
          bloque_horario_id: bloqueHorarioId,
          mensaje: mensajeTexto
        }
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


    mostrarMensajeSolicitud(
      result.mensaje ||
      'Si los datos corresponden a un participante autorizado, tu solicitud será procesada.',
      'success'
    );


    setTimeout(function () {

      if (solicitudModal) {
        solicitudModal.hide();
      }


      if (perfilModal) {
        perfilModal.hide();
      }


      form.reset();


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
        horarioSeleccionado.style.display = 'none';
      }


      const horarioTexto =
        document.getElementById(
          'horario-seleccionado-texto'
        );


      if (horarioTexto) {
        horarioTexto.textContent = '';
      }


      if (boton) {
        boton.disabled = true;
      }

    }, 1200);


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


  return (n + a) || 'P';

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
    Math.abs(Number(id) || 0) %
    gradientes.length
  ];

}


function convertirFecha(valor) {

  if (!valor) {
    return new Date(NaN);
  }


  return new Date(
    String(valor).replace(' ', 'T')
  );

}


/* =========================================================
   ESCAPADO HTML
   ========================================================= */

function escapar(valor) {

  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}