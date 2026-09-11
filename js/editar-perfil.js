
let tokenEdicion = null;
let perfilOriginal = null;

document.addEventListener('DOMContentLoaded', function () {
    iniciarEdicionPerfil();
    iniciarFormulario();
    iniciarFotoPerfil();
    iniciarRevocarAcceso();
    iniciarCerrarSesion();
});

/* =========================================================
   INICIO Y CARGA DEL ESPACIO PERSONAL
   ========================================================= */

async function iniciarEdicionPerfil() {
    const params = new URLSearchParams(window.location.search);
    tokenEdicion = params.get('token');

    if (!tokenEdicion) {
        mostrarError('No se encontró un enlace de acceso válido.');
        return;
    }

    try {
        const respuesta = await fetch(
            'api/enlace_edicion.php?token=' + encodeURIComponent(tokenEdicion),
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await respuesta.json();

        if (!respuesta.ok || !data.exito || !data.usuario) {
            throw new Error(
                data.mensaje || 'El enlace no es válido o ya no está disponible.'
            );
        }

        perfilOriginal = data.usuario;

        guardarEnlacePersonal();

        cargarPerfil(data.usuario);
        cargarSolicitudes(data.solicitudes || []);

        mostrarFormulario();
    } catch (error) {
        console.error('[EDITAR PERFIL]', error);
        mostrarError(
            error.message || 'No fue posible cargar tu espacio personal.'
        );
    }
}


/* =========================================================
   PERFIL
   ========================================================= */

function cargarPerfil(usuario) {
    establecerValor('nombre', usuario.nombre);
    establecerValor('apellido', usuario.apellido);
    establecerValor('empresa', usuario.empresa);
    establecerValor('cargo', usuario.cargo);
    establecerValor('intereses', usuario.intereses);
    establecerValor('busca', usuario.busca);
    establecerValor('descripcion', usuario.descripcion);

    const correo = document.getElementById('correo');

    if (correo) {
        correo.value = usuario.correo || '';
    }

    mostrarFotoPerfil(usuario);
}


function mostrarFotoPerfil(usuario) {
    const preview = document.getElementById('foto-perfil-preview');

    if (!preview) {
        return;
    }

    if (usuario && usuario.foto_perfil) {
        preview.innerHTML = `
            <img
                src="${escaparHtml(usuario.foto_perfil)}"
                alt="Foto de perfil"
            >
        `;
        return;
    }

    const nombre = String(usuario?.nombre || '').trim();
    const apellido = String(usuario?.apellido || '').trim();
    const iniciales = (
        (nombre.charAt(0) || '') +
        (apellido.charAt(0) || '')
    ).toUpperCase();

    preview.innerHTML = `
        <span>${escaparHtml(iniciales || '--')}</span>
    `;
}


function iniciarFotoPerfil() {
    const input = document.getElementById('foto-perfil');

    if (!input) {
        return;
    }

    input.addEventListener('change', function () {
        const archivo = input.files && input.files[0];

        if (!archivo) {
            if (perfilOriginal) {
                mostrarFotoPerfil(perfilOriginal);
            }
            return;
        }

        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tiposPermitidos.includes(archivo.type)) {
            mostrarMensajeFormulario(
                'Solo se permiten imágenes JPG, PNG o WEBP.',
                'danger'
            );
            input.value = '';
            if (perfilOriginal) {
                mostrarFotoPerfil(perfilOriginal);
            }
            return;
        }

        if (archivo.size > 5 * 1024 * 1024) {
            mostrarMensajeFormulario(
                'La imagen no puede superar los 5 MB.',
                'danger'
            );
            input.value = '';
            if (perfilOriginal) {
                mostrarFotoPerfil(perfilOriginal);
            }
            return;
        }

        ocultarMensajeFormulario();

        const preview = document.getElementById('foto-perfil-preview');
        if (!preview) {
            return;
        }

        const url = URL.createObjectURL(archivo);
        preview.innerHTML = `
            <img
                src="${url}"
                alt="Vista previa de la foto"
                onload="URL.revokeObjectURL(this.src)"
            >
        `;
    });
}


async function subirFotoPerfil() {
    const input = document.getElementById('foto-perfil');

    if (!input || !input.files || !input.files.length) {
        return null;
    }

    const formData = new FormData();
    formData.append('token', tokenEdicion);
    formData.append('foto', input.files[0]);

    const respuesta = await fetch(
        'api/foto_perfil.php',
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        }
    );

    let data = null;

    try {
        data = await respuesta.json();
    } catch (error) {
        throw new Error('El servidor devolvió una respuesta inválida al subir la foto.');
    }

    if (!respuesta.ok || !data.exito) {
        throw new Error(
            data.mensaje || 'No fue posible subir la foto.'
        );
    }

    input.value = '';
    return data;
}


function establecerValor(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = valor || '';
    }
}


/* =========================================================
   GUARDAR PERFIL
   ========================================================= */

function iniciarFormulario() {
    const formulario = document.getElementById('editar-perfil-form');

    if (!formulario) {
        return;
    }

    formulario.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (!tokenEdicion) {
            mostrarMensajeFormulario(
                'El enlace de acceso no es válido.',
                'danger'
            );
            return;
        }

        const botonGuardar = document.getElementById('btn-guardar');
        const textoOriginal = botonGuardar
            ? botonGuardar.textContent
            : '';

        const datos = {
            token: tokenEdicion,
            nombre: obtenerValor('nombre'),
            apellido: obtenerValor('apellido'),
            empresa: obtenerValor('empresa'),
            cargo: obtenerValor('cargo'),
            intereses: obtenerValor('intereses'),
            busca: obtenerValor('busca'),
            descripcion: obtenerValor('descripcion')
        };

        try {
            if (botonGuardar) {
                botonGuardar.disabled = true;
                botonGuardar.textContent = 'Guardando...';
            }

            ocultarMensajeFormulario();

            const respuesta = await fetch(
                'api/enlace_edicion.php',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(datos)
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.exito) {
                throw new Error(
                    data.mensaje || 'No fue posible guardar los cambios.'
                );
            }

            perfilOriginal = {
                ...perfilOriginal,
                ...datos
            };

            const resultadoFoto = await subirFotoPerfil();

            if (resultadoFoto && resultadoFoto.foto_perfil) {
                perfilOriginal.foto_perfil = resultadoFoto.foto_perfil;
                mostrarFotoPerfil(perfilOriginal);
            }

            mostrarMensajeFormulario(
                'Tus datos fueron actualizados correctamente.',
                'success'
            );

        } catch (error) {
            console.error('[GUARDAR PERFIL]', error);

            mostrarMensajeFormulario(
                error.message || 'No fue posible guardar los cambios.',
                'danger'
            );

        } finally {
            if (botonGuardar) {
                botonGuardar.disabled = false;
                botonGuardar.textContent = textoOriginal || 'Guardar cambios';
            }
        }
    });
}


function obtenerValor(id) {
    const elemento = document.getElementById(id);

    return elemento
        ? elemento.value.trim()
        : '';
}


/* =========================================================
   SOLICITUDES DE REUNIÓN
   ========================================================= */

function cargarSolicitudes(solicitudes) {
    const contenedor = document.getElementById('solicitudes-container');
    const contador = document.getElementById('solicitudes-contador');
    const mensaje = document.getElementById('solicitudes-mensaje');
    const lista = document.getElementById('solicitudes-lista');

    if (!contenedor || !lista) {
        return;
    }

    lista.innerHTML = '';

    const solicitudesValidas = Array.isArray(solicitudes)
        ? solicitudes
        : [];

    if (contador) {
        contador.textContent = solicitudesValidas.length;
    }

    if (!solicitudesValidas.length) {
        if (mensaje) {
            mensaje.textContent = 'No tienes solicitudes de reunión todavía.';
            mensaje.classList.remove('d-none');
        }

        contenedor.classList.remove('d-none');
        return;
    }

    if (mensaje) {
        mensaje.classList.add('d-none');
    }

    solicitudesValidas.forEach(function (solicitud) {
        lista.appendChild(crearSolicitudElemento(solicitud));
    });

    contenedor.classList.remove('d-none');
}


function crearSolicitudElemento(solicitud) {
    const tarjeta = document.createElement('div');

    tarjeta.className = 'card border-0 shadow-sm mb-3';

    const estado = normalizarEstado(solicitud.estado);

    const nombre = escaparHtml(
        solicitud.solicitante_nombre_completo ||
        [
            solicitud.solicitante_nombre,
            solicitud.solicitante_apellido
        ]
            .filter(Boolean)
            .join(' ') ||
        'Participante'
    );

    const empresa = escaparHtml(solicitud.solicitante_empresa || '');
    const cargo = escaparHtml(solicitud.solicitante_cargo || '');
    const intereses = escaparHtml(solicitud.solicitante_intereses || '');
    const busca = escaparHtml(solicitud.solicitante_busca || '');
    const descripcion = escaparHtml(
        solicitud.solicitante_descripcion || ''
    );

    const mensaje = escaparHtml(solicitud.mensaje || '');
    const horario = escaparHtml(solicitud.horario || '');
    const evento = escaparHtml(solicitud.evento_nombre || '');

    let estadoHtml = '';
    let accionesHtml = '';

    if (estado === 'pendiente') {
        estadoHtml = `
            <span class="badge text-bg-warning">
                Pendiente
            </span>
        `;

        accionesHtml = `
            <div class="d-flex flex-wrap gap-2 mt-3">
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    data-accion-solicitud="aceptar"
                    data-solicitud-id="${Number(solicitud.id)}"
                >
                    Aceptar reunión
                </button>

                <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    data-accion-solicitud="rechazar"
                    data-solicitud-id="${Number(solicitud.id)}"
                >
                    Rechazar
                </button>
            </div>
        `;
    } else if (estado === 'aceptada') {
        estadoHtml = `
            <span class="badge text-bg-success">
                Aceptada
            </span>
        `;
    } else if (estado === 'rechazada') {
        estadoHtml = `
            <span class="badge text-bg-secondary">
                Rechazada
            </span>
        `;
    } else {
        estadoHtml = `
            <span class="badge text-bg-secondary">
                ${escaparHtml(solicitud.estado || 'Sin estado')}
            </span>
        `;
    }

    let perfilSolicitante = '';

    if (empresa || cargo) {
        perfilSolicitante += `
            <div class="text-muted small mb-2">
                ${empresa}${empresa && cargo ? ' · ' : ''}${cargo}
            </div>
        `;
    }

    if (intereses) {
        perfilSolicitante += `
            <div class="small mb-2">
                <strong>Le interesa:</strong>
                ${intereses}
            </div>
        `;
    }

    if (busca) {
        perfilSolicitante += `
            <div class="small mb-2">
                <strong>Busca:</strong>
                ${busca}
            </div>
        `;
    }

    if (descripcion) {
        perfilSolicitante += `
            <div class="small mb-2">
                <strong>Sobre su perfil:</strong>
                ${descripcion}
            </div>
        `;
    }

    tarjeta.innerHTML = `
        <div class="card-body">

            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                    <h5 class="card-title mb-1">
                        ${nombre}
                    </h5>

                    ${perfilSolicitante}
                </div>

                <div class="flex-shrink-0">
                    ${estadoHtml}
                </div>
            </div>

            ${
                evento
                    ? `
                        <div class="small text-muted mb-1">
                            <strong>Evento:</strong> ${evento}
                        </div>
                    `
                    : ''
            }

            ${
                horario
                    ? `
                        <div class="small mb-3">
                            <strong>Horario:</strong> ${horario}
                        </div>
                    `
                    : ''
            }

            ${
                mensaje
                    ? `
                        <div class="bg-light rounded p-3 small">
                            <strong>Mensaje:</strong><br>
                            ${mensaje}
                        </div>
                    `
                    : ''
            }

            ${accionesHtml}

        </div>
    `;

    tarjeta
        .querySelectorAll('[data-accion-solicitud]')
        .forEach(function (boton) {
            boton.addEventListener('click', function () {
                const accion = boton.dataset.accionSolicitud;
                const solicitudId = parseInt(
                    boton.dataset.solicitudId,
                    10
                );

                procesarSolicitud(
                    solicitudId,
                    accion,
                    tarjeta
                );
            });
        });

    return tarjeta;
}


/* =========================================================
   ACEPTAR / RECHAZAR SOLICITUD
   ========================================================= */

async function procesarSolicitud(
    solicitudId,
    accion,
    tarjeta
) {
    if (!solicitudId || !['aceptar', 'rechazar'].includes(accion)) {
        return;
    }

    const mensajeConfirmacion = accion === 'aceptar'
        ? '¿Quieres aceptar esta solicitud de reunión?'
        : '¿Quieres rechazar esta solicitud de reunión?';

    if (!window.confirm(mensajeConfirmacion)) {
        return;
    }

    const botones = tarjeta
        ? tarjeta.querySelectorAll('button')
        : [];

    botones.forEach(function (boton) {
        boton.disabled = true;
    });

    try {
        const respuesta = await fetch(
            'api/solicitudes.php',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    solicitud_id: solicitudId,
                    accion: accion
                })
            }
        );

        const data = await respuesta.json();

        if (!respuesta.ok || !data.exito) {
            throw new Error(
                data.mensaje || 'No fue posible procesar la solicitud.'
            );
        }

        await recargarSolicitudes();

    } catch (error) {
        console.error('[SOLICITUD]', error);

        alert(
            error.message ||
            'No fue posible procesar la solicitud.'
        );

        botones.forEach(function (boton) {
            boton.disabled = false;
        });
    }
}


/* =========================================================
   RECARGAR SOLICITUDES
   ========================================================= */

async function recargarSolicitudes() {
    if (!tokenEdicion) {
        return;
    }

    try {
        const respuesta = await fetch(
            'api/enlace_edicion.php?token=' +
            encodeURIComponent(tokenEdicion),
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await respuesta.json();

        if (!respuesta.ok || !data.exito) {
            throw new Error(
                data.mensaje ||
                'No fue posible actualizar las solicitudes.'
            );
        }

        cargarSolicitudes(data.solicitudes || []);

    } catch (error) {
        console.error('[RECARGAR SOLICITUDES]', error);

        const mensaje = document.getElementById('solicitudes-mensaje');

        if (mensaje) {
            mensaje.textContent =
                error.message ||
                'No fue posible actualizar las solicitudes.';
            mensaje.classList.remove('d-none');
        }
    }
}


/* =========================================================
   REVOCAR ACCESO AL ENLACE
   ========================================================= */

function iniciarRevocarAcceso() {
    const boton = document.getElementById('btn-revocar-acceso');

    if (!boton) {
        return;
    }

    boton.addEventListener('click', async function () {
        if (!tokenEdicion) {
            mostrarError('No se encontró un enlace válido.');
            return;
        }

        const confirmar = window.confirm(
            '¿Seguro que quieres revocar este enlace de acceso? ' +
            'Después tendrás que solicitar un nuevo enlace para volver a entrar.'
        );

        if (!confirmar) {
            return;
        }

        const textoOriginal = boton.textContent;

        try {
            boton.disabled = true;
            boton.textContent = 'Revocando...';

            const respuesta = await fetch(
                'api/enlace_edicion.php',
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        token: tokenEdicion
                    })
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.exito) {
                throw new Error(
                    data.mensaje ||
                    'No fue posible revocar el acceso.'
                );
            }

            sessionStorage.removeItem(
                'meet_to_match_enlace_personal'
            );

            window.location.href = 'index.html';

        } catch (error) {
            console.error('[REVOCAR ACCESO]', error);

            alert(
                error.message ||
                'No fue posible revocar el acceso.'
            );

            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    });
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function iniciarCerrarSesion() {
    const boton = document.getElementById('btn-cerrar-sesion');

    if (!boton) {
        return;
    }

    boton.addEventListener('click', async function () {
        const textoOriginal = boton.textContent;

        try {
            boton.disabled = true;
            boton.textContent = 'Cerrando sesión...';

            const respuesta = await fetch(
                'api/auth.php?accion=logout',
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.exito) {
                throw new Error(
                    data.mensaje ||
                    'No fue posible cerrar la sesión.'
                );
            }

            /*
             * No eliminamos:
             * meet_to_match_enlace_personal
             *
             * El token sigue siendo válido aunque la sesión
             * se cierre. Así "Mi espacio" puede volver a abrir
             * el mismo enlace personal.
             */

            window.location.href = 'index.html';

        } catch (error) {
            console.error('[CERRAR SESION]', error);

            alert(
                error.message ||
                'No fue posible cerrar la sesión.'
            );

            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    });
}


/* =========================================================
   SESIÓN / ENLACE PERSONAL
   ========================================================= */

function guardarEnlacePersonal() {
    if (!tokenEdicion) {
        return;
    }

    try {
        const enlaceActual = new URL(
            window.location.href
        ).href;

        sessionStorage.setItem(
            'meet_to_match_enlace_personal',
            enlaceActual
        );
    } catch (error) {
        console.warn(
            '[SESSION STORAGE] No fue posible guardar el enlace.',
            error
        );
    }
}


/* =========================================================
   ESTADOS VISUALES
   ========================================================= */

function mostrarFormulario() {
    const cargando = document.getElementById('estado-cargando');
    const error = document.getElementById('estado-error');
    const formulario = document.getElementById('estado-formulario');
    const exito = document.getElementById('estado-exito');

    if (cargando) {
        cargando.classList.add('d-none');
    }

    if (error) {
        error.classList.add('d-none');
    }

    if (exito) {
        exito.classList.add('d-none');
    }

    if (formulario) {
        formulario.classList.remove('d-none');
    }
}


function mostrarError(mensaje) {
    const cargando = document.getElementById('estado-cargando');
    const formulario = document.getElementById('estado-formulario');
    const error = document.getElementById('estado-error');
    const mensajeError = document.getElementById('estado-error-mensaje');

    if (cargando) {
        cargando.classList.add('d-none');
    }

    if (formulario) {
        formulario.classList.add('d-none');
    }

    if (mensajeError) {
        mensajeError.textContent =
            mensaje || 'No fue posible cargar la información.';
    }

    if (error) {
        error.classList.remove('d-none');
    }
}


function mostrarMensajeFormulario(
    mensaje,
    tipo = 'success'
) {
    const elemento = document.getElementById(
        'editar-perfil-mensaje'
    );

    if (!elemento) {
        return;
    }

    elemento.className =
        'alert alert-' + tipo;

    elemento.textContent = mensaje || '';

    elemento.classList.remove('d-none');
}


function ocultarMensajeFormulario() {
    const elemento = document.getElementById(
        'editar-perfil-mensaje'
    );

    if (!elemento) {
        return;
    }

    elemento.classList.add('d-none');
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function normalizarEstado(estado) {
    return String(estado || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}


function escaparHtml(valor) {
    const texto = String(valor ?? '');

    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
