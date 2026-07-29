const API_USUARIOS = 'api/usuarios.php';
const API_SOLICITUDES = 'api/solicitudes.php';
const API_HORARIOS = 'api/horarios.php';
const STORAGE_USER_ID = 'poc_usuario_id';
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
}
initTheme();

function getUsuarioId() {
  return localStorage.getItem(STORAGE_USER_ID);
}

function setUsuarioId(id) {
  localStorage.setItem(STORAGE_USER_ID, String(id));
}

function limpiarSesionDemo() {
  localStorage.removeItem(STORAGE_USER_ID);
  window.location.href = 'registro.html';
}

function escapar(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function estadoClase(estado) {
  const normal = String(estado || '').toLowerCase();
  if (normal === 'aceptada') return 'status-aceptada';
  if (normal === 'rechazada') return 'status-rechazada';
  return 'status-pendiente';
}

async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}

async function apiSend(url, method, data) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function cargarUsuarioActual() {
  const id = getUsuarioId();
  const label = document.getElementById('usuario-actual-label');

  if (!id) {
    if (label) label.textContent = 'Sin usuario';
    return null;
  }

  const data = await apiGet(`${API_USUARIOS}?id=${id}`);
  if (!data.exito) {
    localStorage.removeItem(STORAGE_USER_ID);
    if (label) label.textContent = 'Sin usuario';
    return null;
  }

  const usuario = data.usuario;
  if (label) label.textContent = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
  return usuario;
}

function navbar() {
  return `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <a class="navbar-brand fw-bold" href="index.html">
          <span class="brand-dot me-2"></span>Meet to Match Gen18
        </a>
        <button class="navbar-toggler bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="index.html">Inicio</a></li>
            <li class="nav-item"><a class="nav-link" href="registro.html">Registro</a></li>
            <li class="nav-item"><a class="nav-link" href="participantes.html">Participantes</a></li>
            <li class="nav-item"><a class="nav-link" href="solicitudes.html">Solicitudes</a></li>
            <li class="nav-item"><a class="nav-link" href="horarios.html">Horarios</a></li>
            <li class="nav-item"><a class="nav-link" href="importar.html">Importar Luma</a></li>
          </ul>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-primary" type="button" onclick="mostrarMiQR()" id="btn-mi-qr" style="display: none;">Mi QR</button>
            <button class="btn btn-sm btn-outline-warning" type="button" onclick="abrirEscanerQR()">Escanear</button>
            <span class="navbar-text small">Usuario: <strong id="usuario-actual-label">...</strong></span>
            <button class="btn btn-sm btn-outline-light" type="button" onclick="limpiarSesionDemo()">Cambiar</button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="container py-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <div>
          <a class="navbar-brand fw-bold d-inline-flex align-items-center gap-2" href="index.html">
            <span class="brand-dot"></span>Meet to Match Gen18
          </a>
          <p class="small text-white-50 mb-0 mt-1">Conecta asistentes, expositores y organizaciones durante el evento.</p>
        </div>
        <p class="small text-white-50 mb-0 mt-1">Prueba de concepto, sujeta a futuras modificaciones.</p>
      </div>
    </footer>
  `;
}

function formatearHorario(inicio, fin) {
  if (!inicio || !fin) return 'Horario no informado';
  const desde = new Date(String(inicio).replace(' ', 'T'));
  const hasta = new Date(String(fin).replace(' ', 'T'));
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return 'Horario no informado';

  const fecha = new Intl.DateTimeFormat('es-CL', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(desde);
  const horaFin = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(hasta);
  return `${fecha} - ${horaFin}`;
}

function inyectarModalesQR() {
  const container = document.getElementById('qr-modals-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal fade" id="miQrModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content qr-modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title w-100 text-center">Mi codigo QR</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body text-center pb-4">
            <p class="small text-muted mb-3">Muestra este codigo para que otros vean tu perfil.</p>
            <div id="mi-qr-code" class="d-flex justify-content-center bg-white p-3 rounded shadow-sm d-inline-block"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="escanearQrModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered qr-modal-dialog">
        <div class="modal-content qr-modal-content">
          <div class="modal-header qr-modal-header">
            <div><p class="qr-modal-kicker mb-1">Conexion rapida</p><h5 class="modal-title">Escanear codigo QR</h5></div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body qr-modal-body">
            <div class="qr-reader-shell"><div id="qr-reader"></div></div>
          </div>
          <div class="modal-footer qr-modal-footer">
            <span class="qr-tip-dot"></span><p class="small text-muted mb-0">Apunta la camara al codigo QR de otro participante.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function inyectarBottomNav() {
  const div = document.createElement('div');
  div.className = 'bottom-nav d-lg-none shadow-lg';
  div.innerHTML = `
    <a href="index.html" class="nav-item">
      <span>🏠</span>
      <small>Inicio</small>
    </a>
    <a href="participantes.html" class="nav-item">
      <span>👥</span>
      <small>Personas</small>
    </a>
    <a href="solicitudes.html" class="nav-item">
      <span>✉️</span>
      <small>Reuniones</small>
    </a>
    <a href="#" onclick="abrirEscanerQR(); return false;" class="nav-item qr-btn">
      <span>📷</span>
      <small>Escanear</small>
    </a>
  `;
  document.body.appendChild(div);
}

let qrcodeObj = null;
let html5QrcodeScanner = null;

function mostrarMiQR() {
  const id = getUsuarioId();
  if (!id) {
    alert('Debes estar registrado para tener un QR.');
    return;
  }

  const urlBase = window.location.href.split('/').slice(0, -1).join('/');
  const profileUrl = `${urlBase}/participantes.html?ver_perfil=${id}`;
  const qrContainer = document.getElementById('mi-qr-code');
  if (!qrContainer) return;

  qrContainer.innerHTML = '';
  qrcodeObj = new QRCode(qrContainer, {
    text: profileUrl,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  const modal = new bootstrap.Modal(document.getElementById('miQrModal'));
  modal.show();
}

function mejorarInterfazScannerQR() {
  const reader = document.getElementById('qr-reader');
  if (!reader) return;

  reader.querySelectorAll('button').forEach(button => {
    const text = button.textContent.trim();
    if (text.includes('Request Camera Permissions')) button.textContent = 'Permitir camara';
    if (text.includes('Stop Scanning')) button.textContent = 'Detener scanner';
    if (text.includes('Start Scanning')) button.textContent = 'Iniciar scanner';
  });

  reader.querySelectorAll('a').forEach(link => {
    const text = link.textContent.trim();
    if (text.includes('Scan an Image File')) link.textContent = 'Escanear imagen';
    if (text.includes('Scan using camera directly')) link.textContent = 'Usar camara';
  });
}

function abrirEscanerQR() {
  const modalEl = document.getElementById('escanearQrModal');
  if (!modalEl) return;

  const modal = new bootstrap.Modal(modalEl);
  modalEl.addEventListener('hidden.bs.modal', () => {
    if (html5QrcodeScanner) {
      html5QrcodeScanner.clear().catch(error => console.error('No se pudo limpiar el scanner QR', error));
      html5QrcodeScanner = null;
    }
  }, { once: true });

  modal.show();

  setTimeout(() => {
    html5QrcodeScanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 230, height: 230 },
      rememberLastUsedCamera: true
    }, false);

    html5QrcodeScanner.render((decodedText) => {
      html5QrcodeScanner.clear();
      modal.hide();
      window.location.href = decodedText;
    }, () => {});

    setTimeout(mejorarInterfazScannerQR, 250);
  }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('app-navbar');
  if (nav) nav.innerHTML = navbar();

  const footerEl = document.getElementById('app-footer');
  if (footerEl) footerEl.innerHTML = footer();

  inyectarModalesQR();
  inyectarBottomNav();

  cargarUsuarioActual().then(usuario => {
    if (usuario) {
      const btnQR = document.getElementById('btn-mi-qr');
      if (btnQR) btnQR.style.display = 'inline-block';
    }
  });

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registrado', reg))
        .catch(err => console.log('Error SW', err));
    });
  }
});
