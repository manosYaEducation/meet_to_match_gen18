
/* =========================================================
   API PÚBLICA
   ========================================================= */

const API_USUARIOS = 'api/usuarios.php';
const API_SOLICITUDES = 'api/solicitudes.php';
const API_HORARIOS = 'api/horarios.php';


/* =========================================================
   TEMA
   ========================================================= */

function initTheme() {
  document.documentElement.setAttribute(
    'data-theme',
    'dark'
  );
}

initTheme();


/* =========================================================
   UTILIDADES
   ========================================================= */

/**
 * Escapa valores antes de insertarlos dentro de HTML.
 */
function escapar(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


/* =========================================================
   API
   ========================================================= */

/**
 * GET público.
 */
async function apiGet(url) {

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error(
      'El servidor devolvió una respuesta inválida.'
    );
  }

  if (!res.ok) {
    throw new Error(
      data.mensaje ||
      'No fue posible completar la solicitud.'
    );
  }

  return data;
}


/**
 * POST público.
 *
 * El backend es quien decide qué puede hacer el visitante.
 * Nunca debemos enviar desde aquí:
 *
 * - solicitante_id
 * - usuarioActual
 * - datos de sesión
 */
// async function apiSend(
//   url,
//   method,
//   data
// ) {

//   const res = await fetch(url, {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json'
//     },
//     body: JSON.stringify(data)
//   });


//   let result;

//   try {
//     result = await res.json();
//   } catch {
//     throw new Error(
//       'El servidor devolvió una respuesta inválida.'
//     );
//   }


//   if (!res.ok) {
//     throw new Error(
//       result.mensaje ||
//       'No fue posible completar la solicitud.'
//     );
//   }


//   return result;
// }
async function apiSend(url, method, data) {

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });

  /*
   * Primero leemos como TEXTO.
   *
   * Esto nos permite ver qué está devolviendo realmente PHP
   * cuando la respuesta no es JSON válido.
   */
  const texto = await res.text();

  console.log('API RESPONSE:', {
    url,
    status: res.status,
    contentType: res.headers.get('content-type'),
    body: texto
  });

  let result;

  try {
    result = JSON.parse(texto);
  } catch (error) {

    console.error(
      'Respuesta no JSON del servidor:',
      texto
    );

    throw new Error(
      'El servidor devolvió una respuesta inválida.'
    );
  }

  if (!res.ok) {
    throw new Error(
      result.mensaje ||
      'No fue posible completar la solicitud.'
    );
  }

  return result;
}

/* =========================================================
   FORMATO DE HORARIOS
   ========================================================= */

function formatearHorario(
  inicio,
  fin
) {

  if (!inicio || !fin) {
    return 'Horario no informado';
  }


  const desde =
    new Date(
      String(inicio).replace(' ', 'T')
    );

  const hasta =
    new Date(
      String(fin).replace(' ', 'T')
    );


  if (
    Number.isNaN(desde.getTime()) ||
    Number.isNaN(hasta.getTime())
  ) {
    return 'Horario no informado';
  }


  const fecha =
    new Intl.DateTimeFormat(
      'es-CL',
      {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    ).format(desde);


  const horaFin =
    new Intl.DateTimeFormat(
      'es-CL',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    ).format(hasta);


  return `${fecha} - ${horaFin}`;
}


/* =========================================================
   FOOTER PÚBLICO
   ========================================================= */

function footer() {

  return `
    <footer class="footer">

      <div
        class="container py-4
               d-flex flex-column flex-md-row
               justify-content-between
               align-items-center gap-3"
      >

        <div>

          <a
            class="navbar-brand fw-bold
                   d-inline-flex align-items-center gap-2"
            href="index.html"
          >
            <span class="brand-dot"></span>
            Meet to Match Gen18
          </a>

          <p class="small text-white-50 mb-0 mt-1">
            Conecta asistentes, expositores y organizaciones
            durante el evento.
          </p>

        </div>


        <p class="small text-white-50 mb-0 mt-1">
          Prueba de concepto, sujeta a futuras modificaciones.
        </p>

      </div>

    </footer>
  `;
}


/* =========================================================
   INICIALIZACIÓN GLOBAL
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    const footerEl =
      document.getElementById('app-footer');

    if (footerEl) {
      footerEl.innerHTML = footer();
    }


    /*
     * Service Worker / PWA
     */

    if ('serviceWorker' in navigator) {

      window.addEventListener(
        'load',
        () => {

          navigator.serviceWorker
            .register('sw.js')
            .then(reg => {
              console.log(
                'Service Worker registrado',
                reg
              );
            })
            .catch(err => {
              console.log(
                'Error registrando Service Worker',
                err
              );
            });

        }
      );

    }

  }
);
