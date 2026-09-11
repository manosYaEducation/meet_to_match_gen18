const API_AGENDA = 'api/agenda.php';

let solicitudesCache = [];
let usuariosCache = [];
let bloquesCache = [];
let eventoActual = null;

document.addEventListener('DOMContentLoaded', async () => {

  if (typeof navbar === 'function') {
    document.getElementById('app-navbar').innerHTML = navbar();
  }
  if (typeof footer === 'function') {
    document.getElementById('app-footer').innerHTML = footer();
  }

  document.getElementById('filtro-estado-solicitud')
    .addEventListener('change', renderSolicitudes);

  document.getElementById('selector-evento')
    .addEventListener('change', (event) => {
      eventoActual = event.target.value;
      cargarAgenda();
    });

  document.getElementById('agendar-form')
    .addEventListener('submit', enviarAgendarManual);

  await cargarUsuarios();
  await cargarSolicitudes();
  await cargarAgenda();

});


/* =========================================================
   USUARIOS (para los selects del modal "Agendar reunión")
   ========================================================= */

async function cargarUsuarios() {

  try {

    const data = await apiGet(API_USUARIOS);
    usuariosCache = (data && data.exito && Array.isArray(data.usuarios)) ? data.usuarios : [];

    const opciones = usuariosCache
      .map((u) => `<option value="${u.id}">${escapar(u.nombre || '')} ${escapar(u.apellido || '')} — ${escapar(u.empresa || 'Sin empresa')}</option>`)
      .join('');

    document.getElementById('agendar-solicitante').innerHTML = '<option value="">Selecciona...</option>' + opciones;
    document.getElementById('agendar-receptor').innerHTML = '<option value="">Selecciona...</option>' + opciones;

  } catch (error) {
    console.error('Error cargando usuarios:', error);
  }

}


/* =========================================================
   TODAS LAS SOLICITUDES
   ========================================================= */

async function cargarSolicitudes() {

  const mensaje = document.getElementById('solicitudes-admin-mensaje');

  try {

    const data = await apiGet(API_SOLICITUDES);
    solicitudesCache = (data && data.exito && Array.isArray(data.solicitudes))
      ? data.solicitudes
      : [];

    renderSolicitudes();

  } catch (error) {
    console.error('Error cargando solicitudes:', error);
    mensaje.innerHTML = '<div class="alert alert-danger">No fue posible cargar las solicitudes.</div>';
  }

}

function renderSolicitudes() {

  const lista = document.getElementById('solicitudes-admin-lista');
  const contador = document.getElementById('contador-solicitudes');
  const filtro = document.getElementById('filtro-estado-solicitud').value;

  const filtradas = filtro
    ? solicitudesCache.filter((s) => s.estado === filtro)
    : solicitudesCache;

  contador.textContent = `Mostrando ${filtradas.length} de ${solicitudesCache.length} solicitudes`;

  if (!filtradas.length) {
    lista.innerHTML = '<div class="col-12"><div class="empty-state">No hay solicitudes con ese filtro.</div></div>';
    return;
  }

  lista.innerHTML = filtradas.map((s) => {

    const horario = s.bloque_etiqueta
      ? escapar(s.bloque_etiqueta)
      : '<span class="text-warning">Sin horario asignado</span>';

    const estadoBadge = {
      Pendiente: 'bg-warning text-dark',
      Aceptada: 'bg-success',
      Rechazada: 'bg-danger'
    }[s.estado] || 'bg-secondary';

    const nombreSolicitante = (s.solicitante_nombre || s.solicitante_apellido)
      ? `${escapar(s.solicitante_nombre || '')} ${escapar(s.solicitante_apellido || '')}`.trim()
      : '<span class="text-white opacity-50">Usuario no encontrado</span>';

    const nombreReceptor = (s.receptor_nombre || s.receptor_apellido)
      ? `${escapar(s.receptor_nombre || '')} ${escapar(s.receptor_apellido || '')}`.trim()
      : '<span class="text-white opacity-50">Usuario no encontrado</span>';

    const botones = s.estado === 'Pendiente'
      ? `
        <button class="btn btn-sm btn-success" data-accion="Aceptada" data-id="${s.id}">Aceptar</button>
        <button class="btn btn-sm btn-outline-danger" data-accion="Rechazada" data-id="${s.id}">Rechazar</button>
      `
      : '';

    return `
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge ${estadoBadge}">${escapar(s.estado)}</span>
              <button class="btn btn-sm btn-outline-secondary" data-accion="Eliminar" data-id="${s.id}">Eliminar</button>
            </div>
            <p class="mb-1">
              <strong>${nombreSolicitante}</strong>
              &rarr;
              <strong>${nombreReceptor}</strong>
            </p>
            <p class="small text-white opacity-75 mb-1">Horario: ${horario}</p>
            ${s.mensaje ? `<p class="small text-white opacity-75 mb-2">"${escapar(s.mensaje)}"</p>` : ''}
            <div class="d-flex gap-2 mt-2">${botones}</div>
          </div>
        </div>
      </div>
    `;

  }).join('');

  lista.querySelectorAll('[data-accion]').forEach((boton) => {
    boton.addEventListener('click', () => manejarAccionSolicitud(boton));
  });

}

async function manejarAccionSolicitud(boton) {

  const id = boton.getAttribute('data-id');
  const accion = boton.getAttribute('data-accion');

  boton.disabled = true;

  try {

    let result;

    if (accion === 'Eliminar') {
      if (!confirm('¿Eliminar esta solicitud?')) {
        boton.disabled = false;
        return;
      }
      result = await apiSend(API_SOLICITUDES + '?id=' + encodeURIComponent(id), 'DELETE', {});
    } else {
      result = await apiSend(API_SOLICITUDES, 'PUT', { id, estado: accion });
    }

    if (!result.exito) {
      alert(result.mensaje || 'No se pudo completar la accion');
      boton.disabled = false;
      return;
    }

    await cargarSolicitudes();
    await cargarAgenda();

  } catch (error) {
    console.error('Error en accion de solicitud:', error);
    alert('No fue posible completar la accion.');
    boton.disabled = false;
  }

}


/* =========================================================
   AGENDA POR HORARIO (varias reuniones en paralelo por bloque)
   ========================================================= */

async function cargarAgenda() {

  const mensaje = document.getElementById('agenda-mensaje');
  const selector = document.getElementById('selector-evento');

  try {

    const url = eventoActual
      ? `${API_AGENDA}?evento_id=${encodeURIComponent(eventoActual)}`
      : API_AGENDA;

    const data = await apiGet(url);

    if (!data || !data.exito) {
      mensaje.innerHTML = '<div class="alert alert-danger">No fue posible cargar la agenda.</div>';
      return;
    }

    if (selector.options.length !== (data.eventos || []).length) {
      selector.innerHTML = (data.eventos || []).map((e) =>
        `<option value="${e.id}">${escapar(e.nombre)}${e.activo ? '' : ' (inactivo)'}</option>`
      ).join('');
    }

    eventoActual = String(data.evento_id || '');
    selector.value = eventoActual;

    bloquesCache = data.bloques || [];

    document.getElementById('agendar-bloque').innerHTML = bloquesCache
      .map((b) => `<option value="${b.bloque_id}">${escapar(b.etiqueta || '')}</option>`)
      .join('');

    renderAgendaSinHorario(data.solicitudes_sin_horario || []);
    renderAgendaBloques(bloquesCache);

    mensaje.innerHTML = '';

  } catch (error) {
    console.error('Error cargando agenda:', error);
    mensaje.innerHTML = '<div class="alert alert-danger">No fue posible cargar la agenda.</div>';
  }

}

function renderAgendaSinHorario(huerfanas) {

  const wrapper = document.getElementById('agenda-sin-horario-wrapper');
  const lista = document.getElementById('agenda-sin-horario-lista');

  if (!huerfanas.length) {
    wrapper.classList.add('d-none');
    lista.innerHTML = '';
    return;
  }

  wrapper.classList.remove('d-none');

  lista.innerHTML = huerfanas.map((h) => `
    <div class="col-12 col-lg-6">
      <div class="card h-100 border-warning">
        <div class="card-body">
          <span class="badge bg-warning text-dark mb-2">Aceptada, sin horario</span>
          <p class="mb-1">
            <strong>${escapar(h.solicitante_nombre || '')} ${escapar(h.solicitante_apellido || '')}</strong>
            &rarr;
            <strong>${escapar(h.receptor_nombre || '')} ${escapar(h.receptor_apellido || '')}</strong>
          </p>
          ${h.mensaje ? `<p class="small text-white opacity-75 mb-0">"${escapar(h.mensaje)}"</p>` : ''}
        </div>
      </div>
    </div>
  `).join('');

}

function renderAgendaBloques(bloques) {

  const lista = document.getElementById('agenda-lista');

  if (!bloques.length) {
    lista.innerHTML = '<div class="col-12"><div class="empty-state">No hay bloques horarios activos para este evento.</div></div>';
    return;
  }

  lista.innerHTML = bloques.map((b) => {

    const reuniones = b.reuniones || [];
    const total = b.total_reuniones || 0;

    const listaReuniones = reuniones.length
      ? `
        <ul class="list-unstyled small mb-0 mt-2">
          ${reuniones.map((r) => `
            <li class="mb-1">
              <strong>${escapar(r.solicitante_nombre || '')} ${escapar(r.solicitante_apellido || '')}</strong>
              (${escapar(r.solicitante_correo || '')})
              &harr;
              <strong>${escapar(r.receptor_nombre || '')} ${escapar(r.receptor_apellido || '')}</strong>
              (${escapar(r.receptor_correo || '')})
            </li>
          `).join('')}
        </ul>
      `
      : '<p class="mb-0 small text-white opacity-50 mt-2">Sin reuniones en este horario</p>';

    return `
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <strong>${escapar(b.etiqueta || '')}</strong>
              <span class="badge ${total > 0 ? 'bg-primary' : 'bg-secondary'}">
                ${total} reunion${total === 1 ? '' : 'es'}
              </span>
            </div>
            ${listaReuniones}
            <button
              class="btn btn-sm btn-outline-primary mt-2"
              type="button"
              data-agendar-bloque="${b.bloque_id}"
              data-bs-toggle="modal"
              data-bs-target="#agendarModal"
            >
              + Agendar aquí
            </button>
          </div>
        </div>
      </div>
    `;

  }).join('');

  lista.querySelectorAll('[data-agendar-bloque]').forEach((boton) => {
    boton.addEventListener('click', () => {
      document.getElementById('agendar-bloque').value = boton.getAttribute('data-agendar-bloque');
    });
  });

}


/* =========================================================
   MODAL: AGENDAR REUNIÓN MANUALMENTE
   ========================================================= */

async function enviarAgendarManual(event) {

  event.preventDefault();

  const solicitanteId = document.getElementById('agendar-solicitante').value;
  const receptorId = document.getElementById('agendar-receptor').value;
  const bloqueId = document.getElementById('agendar-bloque').value;
  const mensajeTexto = document.getElementById('agendar-mensaje').value.trim();
  const resultado = document.getElementById('agendar-mensaje-resultado');

  if (!solicitanteId || !receptorId || !bloqueId) {
    resultado.innerHTML = '<div class="alert alert-warning py-2 small">Selecciona ambas personas y un horario.</div>';
    return;
  }

  if (solicitanteId === receptorId) {
    resultado.innerHTML = '<div class="alert alert-warning py-2 small">No puedes agendar a la misma persona consigo misma.</div>';
    return;
  }

  const boton = event.target.querySelector('button[type="submit"]');
  boton.disabled = true;
  resultado.innerHTML = '<div class="alert alert-info py-2 small">Agendando...</div>';

  try {

    const result = await apiSend(API_SOLICITUDES, 'POST', {
      solicitante_id: solicitanteId,
      receptor_id: receptorId,
      bloque_horario_id: bloqueId,
      mensaje: mensajeTexto,
      estado: 'Aceptada'
    });

    if (!result.exito) {
      resultado.innerHTML = `<div class="alert alert-danger py-2 small">${escapar(result.mensaje || 'No se pudo agendar')}</div>`;
      boton.disabled = false;
      return;
    }

    resultado.innerHTML = '<div class="alert alert-success py-2 small">Reunión agendada correctamente.</div>';

    await cargarSolicitudes();
    await cargarAgenda();

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('agendarModal'));
      if (modal) modal.hide();
      event.target.reset();
      resultado.innerHTML = '';
      boton.disabled = false;
    }, 900);

  } catch (error) {
    console.error('Error agendando reunion:', error);
    resultado.innerHTML = '<div class="alert alert-danger py-2 small">No fue posible agendar la reunión.</div>';
    boton.disabled = false;
  }

}