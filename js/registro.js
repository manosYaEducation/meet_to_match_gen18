document.getElementById('registro-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const mensaje = document.getElementById('registro-mensaje');
  const data = Object.fromEntries(new FormData(form).entries());

  mensaje.innerHTML = '<div class="alert alert-info">Guardando perfil...</div>';

  const result = await apiSend(API_USUARIOS, 'POST', data);

  if (!result.exito) {
    mensaje.innerHTML = `<div class="alert alert-danger">${escapar(result.mensaje || 'No se pudo guardar')}</div>`;
    return;
  }

  setUsuarioId(result.id);
  mensaje.innerHTML = '<div class="alert alert-success">Perfil creado. Redirigiendo...</div>';
  setTimeout(() => {
    window.location.href = 'participantes.html';
  }, 600);
});
