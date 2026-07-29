document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('horarios-form').addEventListener('submit', crearBloques);
  await cargarBloques();
});

async function cargarBloques() {
  const contenedor = document.getElementById('horarios-lista');
  const total = document.getElementById('horarios-total');
  const data = await apiGet(API_HORARIOS);
  const bloques = data.exito ? data.bloques : [];

  total.textContent = `${bloques.length} bloque${bloques.length === 1 ? '' : 's'}`;
  if (!bloques.length) {
    contenedor.innerHTML = '<div class="col-12"><div class="empty-state">Todavía no hay bloques configurados.</div></div>';
    return;
  }

  contenedor.innerHTML = bloques.map((bloque) => `
    <div class="col-md-6">
      <div class="card h-100 shadow-sm schedule-card">
        <div class="card-body py-3">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <div>
              <strong>${escapar(formatearHorario(bloque.inicio, bloque.fin))}</strong>
              <div class="small-muted">${escapar(bloque.evento_nombre || 'Evento')}</div>
            </div>
            <span class="badge text-bg-success">Activo</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function crearBloques(event) {
  event.preventDefault();
  const mensaje = document.getElementById('horarios-mensaje');
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  mensaje.innerHTML = '<div class="alert alert-info">Creando bloques...</div>';

  const result = await apiSend(API_HORARIOS, 'POST', data);
  if (!result.exito) {
    mensaje.innerHTML = `<div class="alert alert-danger">${escapar(result.mensaje || 'No se pudieron crear los bloques')}</div>`;
    return;
  }

  mensaje.innerHTML = `<div class="alert alert-success">${escapar(result.mensaje)}</div>`;
  await cargarBloques();
}
