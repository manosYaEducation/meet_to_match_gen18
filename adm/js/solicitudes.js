let usuariosSolicitud = [];

function horarioSolicitud(solicitud) {
  if (solicitud.bloque_inicio && solicitud.bloque_fin) {
    return formatearHorario(solicitud.bloque_inicio, solicitud.bloque_fin);
  }
  return solicitud.disponibilidad_sugerida || 'Horario no informado';
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioQuery = new URLSearchParams(window.location.search).get('usuario');
  if (usuarioQuery) setUsuarioId(usuarioQuery);
  await cargarSelectorUsuarios();
  await cargarSolicitudes();

  document.getElementById('selector-usuario').addEventListener('change', async (event) => {
    setUsuarioId(event.target.value);
    await cargarUsuarioActual();
    await cargarSolicitudes();
  });
});

async function cargarSelectorUsuarios() {
  const data = await apiGet(API_USUARIOS);
  usuariosSolicitud = data.exito ? data.usuarios : [];
  const select = document.getElementById('selector-usuario');
  const actual = getUsuarioId();

  select.innerHTML = usuariosSolicitud.map((u) => `
    <option value="${u.id}" ${String(actual) === String(u.id) ? 'selected' : ''}>
      ${escapar(u.nombre)} ${escapar(u.apellido || '')} - ${escapar(u.tipo_usuario)}
    </option>
  `).join('');

  if (!actual && usuariosSolicitud.length) {
    setUsuarioId(usuariosSolicitud[0].id);
    select.value = usuariosSolicitud[0].id;
  }
}

async function cargarSolicitudes() {
  const id = getUsuarioId();
  if (!id) return;

  const [recibidas, enviadas] = await Promise.all([
    apiGet(`${API_SOLICITUDES}?recibidas=${id}`),
    apiGet(`${API_SOLICITUDES}?enviadas=${id}`)
  ]);

  renderRecibidas(recibidas.exito ? recibidas.solicitudes : []);
  renderEnviadas(enviadas.exito ? enviadas.solicitudes : []);
}

function renderRecibidas(solicitudes) {
  const cont = document.getElementById('solicitudes-recibidas');
  if (!solicitudes.length) {
    cont.innerHTML = '<div class="col-12"><div class="empty-state">No tienes solicitudes recibidas.</div></div>';
    return;
  }

  cont.innerHTML = solicitudes.map((s) => `
    <div class="col-lg-6">
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between gap-2 mb-2">
            <h3 class="h5 mb-0">${escapar(s.solicitante_nombre)} ${escapar(s.solicitante_apellido || '')}</h3>
            <span class="status-pill ${estadoClase(s.estado)}">${escapar(s.estado)}</span>
          </div>
          <p class="small-muted mb-2">${escapar(s.solicitante_cargo || 'Participante')} - ${escapar(s.solicitante_empresa || 'Sin empresa')}</p>
          <p><strong>Horario:</strong> ${escapar(horarioSolicitud(s))}</p>
          <p><strong>Mensaje:</strong> ${escapar(s.mensaje || 'Sin mensaje')}</p>
          <div class="border rounded p-3 mb-3" data-theme="dark" style="background-color: var(--poc-panel-bg); color: var(--poc-text); border-color: var(--poc-border) !important;">
            <div class="profile-label">Intereses</div>
            <p class="mb-2">${escapar(s.solicitante_intereses || 'No informado')}</p>
            <div class="profile-label">Busca</div>
            <p class="mb-0">${escapar(s.solicitante_busca || 'No informado')}</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-action-accept" type="button" onclick="actualizarEstado(${s.id}, 'Aceptada')" ${s.estado !== 'Pendiente' ? 'disabled' : ''}>Aceptar</button>
            <button class="btn btn-action-reject" type="button" onclick="actualizarEstado(${s.id}, 'Rechazada')" ${s.estado !== 'Pendiente' ? 'disabled' : ''}>Rechazar</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderEnviadas(solicitudes) {
  const cont = document.getElementById('solicitudes-enviadas');
  if (!solicitudes.length) {
    cont.innerHTML = '<div class="col-12"><div class="empty-state">No has enviado solicitudes.</div></div>';
    return;
  }

  cont.innerHTML = solicitudes.map((s) => `
    <div class="col-lg-6">
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between gap-2 mb-2">
            <h3 class="h5 mb-0">${escapar(s.receptor_nombre)} ${escapar(s.receptor_apellido || '')}</h3>
            <span class="status-pill ${estadoClase(s.estado)}">${escapar(s.estado)}</span>
          </div>
          <p class="small-muted mb-2">${escapar(s.receptor_cargo || 'Participante')} - ${escapar(s.receptor_empresa || 'Sin empresa')}</p>
          <p><strong>Horario:</strong> ${escapar(horarioSolicitud(s))}</p>
          <p class="mb-0"><strong>Tu mensaje:</strong> ${escapar(s.mensaje || 'Sin mensaje')}</p>
        </div>
      </div>
    </div>
  `).join('');
}

async function actualizarEstado(id, estado) {
  const result = await apiSend(API_SOLICITUDES, 'PUT', { id, estado, usuario_id: getUsuarioId() });
  if (!result.exito) {
    alert(result.mensaje || 'No se pudo actualizar');
    return;
  }
  await cargarSolicitudes();
}
