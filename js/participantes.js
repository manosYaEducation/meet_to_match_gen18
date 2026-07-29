let usuarios = [];
let usuarioActual = null;
let perfilSeleccionado = null;
let perfilModal;
let solicitudModal;
let cargoSeleccionado = '';

document.addEventListener('DOMContentLoaded', async () => {
  perfilModal = new bootstrap.Modal(document.getElementById('perfilModal'));
  solicitudModal = new bootstrap.Modal(document.getElementById('solicitudModal'));
  usuarioActual = await cargarUsuarioActual();
  await cargarParticipantes();

  document.getElementById('buscar').addEventListener('input', () => {
    renderParticipantes();
  });

  document.getElementById('filtro-cargo').addEventListener('change', () => {
    cargoSeleccionado = document.getElementById('filtro-cargo').value.trim();
    renderParticipantes();
  });

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
  poblarFiltroCargos();
  renderParticipantes();
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

function renderParticipantes() {
  const grid = document.getElementById('participantes-grid');
  const mensaje = document.getElementById('participantes-mensaje');
  const q = document.getElementById('buscar').value.trim().toLowerCase();
  const cargo = cargoSeleccionado.trim().toLowerCase();

  const filtrados = usuarios.filter((u) => {
    const texto = `${u.nombre} ${u.apellido || ''} ${u.empresa || ''} ${u.cargo || ''} ${u.intereses || ''}`.toLowerCase();
    const cargoUsuario = String(u.cargo || '').trim().toLowerCase();
    return texto.includes(q) && (!cargo || cargoUsuario === cargo);
  });

  mensaje.innerHTML = '';

  if (!filtrados.length) {
    grid.innerHTML = '<div class="col-12"><div class="empty-state">No hay participantes para mostrar.</div></div>';
    return;
  }

  grid.innerHTML = filtrados.map((u) => `
    <div class="col-md-6 col-xl-4">
      <div class="card participant-card shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between gap-2 mb-2">
            <span class="badge text-bg-dark participant-type">${escapar(u.tipo_usuario)}</span>
            ${usuarioActual && String(usuarioActual.id) === String(u.id) ? '<span class="badge text-bg-secondary">Tu perfil</span>' : ''}
          </div>
          <h3 class="h5 mb-1">${escapar(u.nombre)} ${escapar(u.apellido || '')}</h3>
          <p class="mb-1">${escapar(u.cargo || 'Participante')}</p>
          <p class="small-muted mb-2">${escapar(u.empresa || 'Sin empresa')}</p>
          <p class="mb-3">${escapar(u.intereses || 'Sin intereses registrados')}</p>
          <button class="btn btn-primary w-100" type="button" onclick="verPerfil(${u.id})">Ver perfil</button>
        </div>
      </div>
    </div>
  `).join('');
}

function verPerfil(id) {
  perfilSeleccionado = usuarios.find((u) => String(u.id) === String(id));
  if (!perfilSeleccionado) return;

  document.getElementById('perfilTitulo').textContent = `${perfilSeleccionado.nombre} ${perfilSeleccionado.apellido || ''}`.trim();
  document.getElementById('perfilContenido').innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <div class="profile-label">Empresa / institucion</div>
        <p>${escapar(perfilSeleccionado.empresa || 'No informado')}</p>
      </div>
      <div class="col-md-6">
        <div class="profile-label">Cargo / rol</div>
        <p>${escapar(perfilSeleccionado.cargo || 'No informado')}</p>
      </div>
      <div class="col-12">
        <div class="profile-label">Intereses</div>
        <p>${escapar(perfilSeleccionado.intereses || 'No informado')}</p>
      </div>
      <div class="col-12">
        <div class="profile-label">Busca</div>
        <p>${escapar(perfilSeleccionado.busca || 'No informado')}</p>
      </div>
      <div class="col-12">
        <div class="profile-label">Descripcion</div>
        <p>${escapar(perfilSeleccionado.descripcion || 'No informado')}</p>
      </div>
    </div>
  `;

  const btn = document.getElementById('btnAbrirSolicitud');
  btn.disabled = !usuarioActual || String(usuarioActual.id) === String(perfilSeleccionado.id);
  btn.textContent = !usuarioActual ? 'Registrate para solicitar' : 'Solicitar reunion';
  perfilModal.show();
}

async function abrirSolicitud() {
  if (!usuarioActual || !perfilSeleccionado) return;
  document.getElementById('receptor_id').value = perfilSeleccionado.id;
  document.getElementById('solicitudDestino').textContent = `Solicitud para ${perfilSeleccionado.nombre} ${perfilSeleccionado.apellido || ''}`;
  document.getElementById('solicitud-mensaje').innerHTML = '';
  const select = document.getElementById('bloque_horario_id');
  const ayuda = document.getElementById('horarios-ayuda');
  const boton = document.getElementById('btnEnviarSolicitud');
  select.innerHTML = '<option value="">Cargando horarios...</option>';
  select.disabled = true;
  boton.disabled = true;
  solicitudModal.show();

  const data = await apiGet(`${API_HORARIOS}?solicitante_id=${usuarioActual.id}&receptor_id=${perfilSeleccionado.id}`);
  const disponibles = data.exito ? data.bloques.filter((bloque) => bloque.disponible) : [];

  if (!disponibles.length) {
    select.innerHTML = '<option value="">No hay horarios disponibles</option>';
    ayuda.textContent = data.mensaje || 'Ambas personas tienen ocupados los bloques disponibles.';
    return;
  }

  select.innerHTML = '<option value="">Selecciona un horario</option>' + disponibles.map((bloque) => `
    <option value="${bloque.id}">${escapar(formatearHorario(bloque.inicio, bloque.fin))}</option>
  `).join('');
  select.disabled = false;
  boton.disabled = false;
  ayuda.textContent = `${disponibles.length} horarios libres para ambas personas.`;
}

async function enviarSolicitud(event) {
  event.preventDefault();
  const mensaje = document.getElementById('solicitud-mensaje');
  const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

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
