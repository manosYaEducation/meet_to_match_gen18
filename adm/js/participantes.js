let usuarios = [];
let usuarioActual = null;
let perfilSeleccionado = null;
let perfilModal;
let solicitudModal;
let cargoSeleccionado = '';
let tipoSeleccionado = '';

document.addEventListener('DOMContentLoaded', async () => {
  perfilModal = new bootstrap.Modal(document.getElementById('perfilModal'));
  solicitudModal = new bootstrap.Modal(document.getElementById('solicitudModal'));
  usuarioActual = await cargarUsuarioActual();
  await cargarParticipantes();

  const inputBuscar = document.getElementById('buscar');
  if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
      renderParticipantes();
    });
  }

  const selectCargo = document.getElementById('filtro-cargo');
  if (selectCargo) {
    selectCargo.addEventListener('change', () => {
      cargoSeleccionado = selectCargo.value.trim();
      renderParticipantes();
    });
  }

  // Filtro por tipo/categoría
  const tipoItems = document.querySelectorAll('#filtro-tipo-grupo .filter-radio-item');
  tipoItems.forEach(item => {
    item.addEventListener('click', (e) => {
      tipoItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const radio = item.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      tipoSeleccionado = item.getAttribute('data-tipo') || '';
      renderParticipantes();
    });
  });

  // Botón limpiar filtros
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      if (inputBuscar) inputBuscar.value = '';
      if (selectCargo) selectCargo.value = '';
      cargoSeleccionado = '';
      tipoSeleccionado = '';
      tipoItems.forEach(i => {
        if (i.getAttribute('data-tipo') === '') {
          i.classList.add('active');
          const r = i.querySelector('input[type="radio"]');
          if (r) r.checked = true;
        } else {
          i.classList.remove('active');
        }
      });
      renderParticipantes();
    });
  }

  document.getElementById('btnAbrirSolicitud').addEventListener('click', abrirSolicitud);
  document.getElementById('solicitud-form').addEventListener('submit', enviarSolicitud);

  const urlParams = new URLSearchParams(window.location.search);
  const verPerfilId = urlParams.get('ver_perfil');
  if (verPerfilId) {
    verPerfil(verPerfilId);
  }
});

async function cargarParticipantes() {
  const data = await apiGet(API_USUARIOS);
  usuarios = data.exito ? data.usuarios : [];
  actualizarContadoresSidebar();
  poblarFiltroCargos();
  renderParticipantes();
}

function actualizarContadoresSidebar() {
  const countTodos = document.getElementById('count-todos');
  const countExpositor = document.getElementById('count-expositor');
  const countAsistente = document.getElementById('count-asistente');
  const countOrganizador = document.getElementById('count-organizador');

  if (countTodos) countTodos.textContent = usuarios.length;
  if (countExpositor) countExpositor.textContent = usuarios.filter(u => String(u.tipo_usuario).toLowerCase() === 'expositor').length;
  if (countAsistente) countAsistente.textContent = usuarios.filter(u => String(u.tipo_usuario).toLowerCase() === 'asistente').length;
  if (countOrganizador) countOrganizador.textContent = usuarios.filter(u => String(u.tipo_usuario).toLowerCase() === 'organizador').length;
}

function poblarFiltroCargos() {
  const select = document.getElementById('filtro-cargo');
  if (!select) return;

  const cargos = [];
  const vistos = new Set();

  usuarios.forEach((usuario) => {
    const cargo = String(usuario.cargo || '').trim();
    if (!cargo || vistos.has(cargo.toLowerCase())) return;
    vistos.add(cargo.toLowerCase());
    cargos.push(cargo);
  });

  select.innerHTML = '<option value="">Todos los cargos</option>' + cargos.map((cargo) => `
    <option value="${escapar(cargo)}">${escapar(cargo)}</option>
  `).join('');

  if (cargoSeleccionado) {
    select.value = cargoSeleccionado;
  }
}

function obtenerIniciales(nombre, apellido) {
  const n = (nombre || '').trim().charAt(0).toUpperCase();
  const a = (apellido || '').trim().charAt(0).toUpperCase();
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
  return gradientes[(id || 0) % gradientes.length];
}

function renderParticipantes() {
  const grid = document.getElementById('participantes-grid');
  const mensaje = document.getElementById('participantes-mensaje');
  const contadorEl = document.getElementById('contador-participantes');
  const badgeTotalFiltros = document.getElementById('badge-total-filtros');
  
  const q = (document.getElementById('buscar')?.value || '').trim().toLowerCase();
  const cargo = cargoSeleccionado.trim().toLowerCase();
  const tipo = tipoSeleccionado.trim().toLowerCase();

  const filtrados = usuarios.filter((u) => {
    const texto = `${u.nombre} ${u.apellido || ''} ${u.empresa || ''} ${u.cargo || ''} ${u.intereses || ''}`.toLowerCase();
    const cargoUsuario = String(u.cargo || '').trim().toLowerCase();
    const tipoUsuario = String(u.tipo_usuario || '').trim().toLowerCase();

    const cumpleTexto = !q || texto.includes(q);
    const cumpleCargo = !cargo || cargoUsuario === cargo;
    const cumpleTipo = !tipo || tipoUsuario === tipo;

    return cumpleTexto && cumpleCargo && cumpleTipo;
  });

  if (contadorEl) {
    contadorEl.textContent = `Mostrando ${filtrados.length} de ${usuarios.length} participantes`;
  }

  if (badgeTotalFiltros) {
    badgeTotalFiltros.textContent = tipoSeleccionado || (q || cargo ? 'Filtrado' : 'Todos');
  }

  if (mensaje) mensaje.innerHTML = '';

  if (!filtrados.length) {
    grid.innerHTML = '<div class="col-12"><div class="empty-state">No se encontraron participantes con los filtros seleccionados.</div></div>';
    return;
  }

  grid.innerHTML = filtrados.map((u) => {
    const esUsuarioActual = usuarioActual && String(usuarioActual.id) === String(u.id);
    const iniciales = obtenerIniciales(u.nombre, u.apellido);
    const avatarBg = obtenerColorAvatar(u.id);
    
    // Formatear intereses en chips
    const interesesLista = (u.intereses || '')
      .split(/[,;]/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const interesesHtml = interesesLista.length > 0
      ? interesesLista.slice(0, 3).map(item => `<span class="badge-tag">${escapar(item)}</span>`).join('')
      : '<span class="text-white opacity-50 small">Sin intereses informados</span>';

    return `
      <div class="col-12 col-md-6 col-xxl-4 d-flex">
        <div class="card participant-card-v2 w-100 shadow-sm">
          <div class="card-body d-flex flex-column p-4">
            
            <!-- Avatar Circular Superior -->
            <div class="text-center mb-3">
              <div class="participant-avatar-large mx-auto shadow" style="background: ${avatarBg};">
                <span class="avatar-initials">${escapar(iniciales)}</span>
              </div>
            </div>

            <!-- Cabecera de la Tarjeta: Nombre y Tipo -->
            <div class="text-center mb-2">
              <div class="d-flex justify-content-center align-items-center gap-2 mb-1">
                <h3 class="h5 mb-0 text-white fw-bold">${escapar(u.nombre)} ${escapar(u.apellido || '')}</h3>
                ${esUsuarioActual ? '<span class="badge bg-secondary badge-xs">Tú</span>' : ''}
              </div>
              <p class="participant-role-sub text-white opacity-75 mb-0">
                ${escapar(u.cargo || 'Participante')}${u.empresa ? ` en <strong>${escapar(u.empresa)}</strong>` : ''}
              </p>
            </div>

            <hr class="card-divider my-3">

            <!-- Bloques de Propiedades Estructuradas -->
            <div class="participant-props-list flex-grow-1">
              
              <!-- Categoría / Rol -->
              <div class="prop-item mb-2">
                <span class="prop-label">Categoría:</span>
                <span class="badge-role-pill badge-role-${escapar(String(u.tipo_usuario).toLowerCase())}">
                  ${escapar(u.tipo_usuario)}
                </span>
              </div>

              <!-- Empresa / Institución -->
              <div class="prop-item mb-2">
                <span class="prop-label">Institución:</span>
                <span class="prop-value text-white">${escapar(u.empresa || 'No especificada')}</span>
              </div>

              <!-- Intereses / Áreas -->
              <div class="prop-item mb-2">
                <span class="prop-label d-block mb-1">Intereses y enfoque:</span>
                <div class="d-flex flex-wrap gap-1">
                  ${interesesHtml}
                </div>
              </div>

              ${u.busca ? `
                <div class="prop-item mb-2">
                  <span class="prop-label">Busca:</span>
                  <p class="prop-text-snippet mb-0 text-white opacity-75">${escapar(u.busca)}</p>
                </div>
              ` : ''}
            </div>

            <!-- Enlace Ver Más -->
            <div class="text-start my-2">
              <a href="#" class="participant-link-more" onclick="verPerfil(${u.id}); return false;">
                Ver más detalles
              </a>
            </div>

            <!-- Botón de Acción Inferior Redondeado -->
            <div class="mt-2 pt-2">
              ${esUsuarioActual ? `
                <button class="btn btn-outline-secondary rounded-pill w-100 py-2 fw-semibold" disabled>
                  Tu perfil
                </button>
              ` : usuarioActual ? `
                <button class="btn btn-primary rounded-pill w-100 py-2 fw-bold btn-action-pill" onclick="abrirSolicitudDirecta(${u.id})">
                  Solicitar reunión
                </button>
              ` : `
                <button class="btn btn-primary rounded-pill w-100 py-2 fw-bold btn-action-pill" onclick="verPerfil(${u.id})">
                  Solicitar reunión
                </button>
              `}
            </div>

          </div>
        </div>
      </div>
    `;
  }).join('');
}

function verPerfil(id) {
  perfilSeleccionado = usuarios.find((u) => String(u.id) === String(id));
  if (!perfilSeleccionado) return;

  const iniciales = obtenerIniciales(perfilSeleccionado.nombre, perfilSeleccionado.apellido);
  const avatarBg = obtenerColorAvatar(perfilSeleccionado.id);

  document.getElementById('perfilTitulo').innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <div class="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold" style="width: 38px; height: 38px; background: ${avatarBg}; font-size: 0.9rem;">
        ${escapar(iniciales)}
      </div>
      <div>
        <div class="fw-bold">${escapar(perfilSeleccionado.nombre)} ${escapar(perfilSeleccionado.apellido || '')}</div>
        <span class="badge bg-primary text-white" style="font-size: 0.72rem;">${escapar(perfilSeleccionado.tipo_usuario)}</span>
      </div>
    </div>
  `;

  document.getElementById('perfilContenido').innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <div class="profile-label">Empresa / institución</div>
        <p class="mb-0 text-white">${escapar(perfilSeleccionado.empresa || 'No informado')}</p>
      </div>
      <div class="col-md-6">
        <div class="profile-label">Cargo / rol</div>
        <p class="mb-0 text-white">${escapar(perfilSeleccionado.cargo || 'No informado')}</p>
      </div>
      <div class="col-12">
        <div class="profile-label">Intereses</div>
        <p class="mb-0 text-white">${escapar(perfilSeleccionado.intereses || 'No informado')}</p>
      </div>
      <div class="col-12">
        <div class="profile-label">Busca en el evento</div>
        <p class="mb-0 text-white">${escapar(perfilSeleccionado.busca || 'No informado')}</p>
      </div>
      <div class="col-12">
        <div class="profile-label">Descripción</div>
        <p class="mb-0 text-white">${escapar(perfilSeleccionado.descripcion || 'No informado')}</p>
      </div>
    </div>
  `;

  const btn = document.getElementById('btnAbrirSolicitud');
  btn.disabled = !usuarioActual || String(usuarioActual.id) === String(perfilSeleccionado.id);
  btn.textContent = !usuarioActual ? 'Regístrate para solicitar' : 'Solicitar reunión';
  perfilModal.show();
}

function abrirSolicitudDirecta(id) {
  perfilSeleccionado = usuarios.find((u) => String(u.id) === String(id));
  if (!perfilSeleccionado) return;
  abrirSolicitud();
}

function seleccionarHorarioSlot(boton, id, texto) {
  document.querySelectorAll('.slot-time-btn').forEach(b => b.classList.remove('active'));
  boton.classList.add('active');

  document.getElementById('bloque_horario_id').value = id;
  document.getElementById('horario-seleccionado-texto').textContent = texto;
  document.getElementById('horario-seleccionado-container').style.display = 'block';
  document.getElementById('btnEnviarSolicitud').disabled = false;
}

async function abrirSolicitud() {
  if (!usuarioActual || !perfilSeleccionado) return;

  const iniciales = obtenerIniciales(perfilSeleccionado.nombre, perfilSeleccionado.apellido);
  const avatarBg = obtenerColorAvatar(perfilSeleccionado.id);

  const previewEl = document.getElementById('solicitudDestino');
  if (previewEl) {
    previewEl.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style="width: 48px; height: 48px; background: ${avatarBg}; font-size: 1.1rem; flex-shrink: 0;">
          ${escapar(iniciales)}
        </div>
        <div class="overflow-hidden">
          <div class="small text-white opacity-75">Reunión privada con:</div>
          <div class="h6 mb-0 text-white fw-bold text-truncate">${escapar(perfilSeleccionado.nombre)} ${escapar(perfilSeleccionado.apellido || '')}</div>
          <div class="small text-white opacity-75 text-truncate">${escapar(perfilSeleccionado.cargo || 'Participante')}${perfilSeleccionado.empresa ? ` en ${escapar(perfilSeleccionado.empresa)}` : ''}</div>
        </div>
      </div>
    `;
  }

  document.getElementById('receptor_id').value = perfilSeleccionado.id;
  document.getElementById('bloque_horario_id').value = '';
  document.getElementById('solicitud-mensaje').innerHTML = '';
  document.getElementById('horario-seleccionado-container').style.display = 'none';
  document.getElementById('horario-seleccionado-texto').textContent = '';
  
  const container = document.getElementById('horarios-slots-container');
  const ayuda = document.getElementById('horarios-ayuda');
  const boton = document.getElementById('btnEnviarSolicitud');
  
  container.innerHTML = '<div class="text-center py-4 text-white opacity-75 small">Cargando horarios libres...</div>';
  boton.disabled = true;
  solicitudModal.show();

  const data = await apiGet(`${API_HORARIOS}?solicitante_id=${usuarioActual.id}&receptor_id=${perfilSeleccionado.id}`);
  const disponibles = data.exito ? data.bloques.filter((bloque) => bloque.disponible) : [];

  if (!disponibles.length) {
    container.innerHTML = `
      <div class="p-3 text-center text-white opacity-75">
        <div class="mb-1 fw-bold">No hay horarios disponibles</div>
        <div class="small">${escapar(data.mensaje || 'Ambas personas tienen ocupados los bloques del evento.')}</div>
      </div>
    `;
    ayuda.textContent = '0 disponibles';
    return;
  }

  ayuda.textContent = `${disponibles.length} horarios disponibles`;

  // Agrupar horarios por fecha
  const gruposPorFecha = {};
  disponibles.forEach(bloque => {
    const dInicio = new Date(String(bloque.inicio).replace(' ', 'T'));
    const fechaKey = isNaN(dInicio.getTime()) ? 'Horarios disponibles' : new Intl.DateTimeFormat('es-CL', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).format(dInicio);
    
    const fechaTitulo = fechaKey.charAt(0).toUpperCase() + fechaKey.slice(1);
    
    if (!gruposPorFecha[fechaTitulo]) {
      gruposPorFecha[fechaTitulo] = [];
    }
    gruposPorFecha[fechaTitulo].push(bloque);
  });

  let html = '';
  for (const [fechaTitulo, bloques] of Object.entries(gruposPorFecha)) {
    html += `
      <div class="slots-date-group mb-3">
        <div class="slots-date-header small fw-bold text-white opacity-90 mb-2 pb-1 border-bottom border-secondary border-opacity-25">
          ${escapar(fechaTitulo)}
        </div>
        <div class="slots-grid">
          ${bloques.map(b => {
            const dIni = new Date(String(b.inicio).replace(' ', 'T'));
            const dFin = new Date(String(b.fin).replace(' ', 'T'));
            const horaTexto = !isNaN(dIni.getTime()) && !isNaN(dFin.getTime())
              ? `${new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(dIni)} - ${new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(dFin)}`
              : formatearHorario(b.inicio, b.fin);
            
            const textoCompleto = `${fechaTitulo}, ${horaTexto}`;

            return `
              <button type="button" class="slot-time-btn" data-id="${b.id}" onclick="seleccionarHorarioSlot(this, ${b.id}, '${escapar(textoCompleto)}')">
                <span class="slot-time-text">${escapar(horaTexto)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

async function enviarSolicitud(event) {
  event.preventDefault();
  const mensaje = document.getElementById('solicitud-mensaje');
  const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

  if (!formData.bloque_horario_id) {
    mensaje.innerHTML = '<div class="alert alert-warning py-2 small">Por favor selecciona un horario de la lista.</div>';
    return;
  }

  const result = await apiSend(API_SOLICITUDES, 'POST', {
    solicitante_id: usuarioActual.id,
    receptor_id: formData.receptor_id,
    mensaje: formData.mensaje,
    bloque_horario_id: formData.bloque_horario_id
  });

  if (!result.exito) {
    mensaje.innerHTML = `<div class="alert alert-danger">${escapar(result.mensaje || 'No se pudo enviar')}</div>`;
    return;
  }

  const avisoCorreo = result.correo && !result.correo.enviado ? `<br><small>${escapar(result.correo.mensaje)}</small>` : '';
  mensaje.innerHTML = `<div class="alert alert-success">${escapar(result.mensaje || 'Solicitud enviada')}. Puedes revisar el estado en Mis solicitudes.${avisoCorreo}</div>`;
  setTimeout(() => {
    solicitudModal.hide();
    perfilModal.hide();
  }, 900);
}
