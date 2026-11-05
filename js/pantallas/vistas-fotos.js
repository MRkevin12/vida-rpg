// vistas-fotos.js — Lo que se VE de las fotos de progreso (v197, rehecho en v198): la tarjeta semanal de Hoy,
// la ventana «Mis fotos» (una portada por álbum) y la subventana de cada álbum (fotos por mes, visor y comparador).
// Solo arma HTML; guardar y leer las fotos lo hace fotos.js, y los botones app-foto.js.
//
// Cada álbum lleva el TEMA de su misión: el ícono y el color de su atributo (💪 rosa para Fuerza, 🧠 celeste
// para Intelecto…). Llega listo en `tema` ({ icono, color, nombre, etiqueta }) y se aplica con --tema en el CSS.
// Las fotos llegan ya con su dirección temporal (url) porque leerlas de IndexedDB es asíncrono.

import { esc } from "./vistas-comun.js";
import { fechaLegible, fechaCorta, diasEntre } from "../fechas.js";
import { faltaFotoSemanal } from "../fotos.js";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// «2026-11» → «noviembre 2026»
const nombreDeMes = (clave) => `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(0, 4)}`;

// «hoy», «ayer» o «hace 5 días».
function hace(fecha, hoy) {
    const dias = diasEntre(fecha, hoy);
    return dias <= 0 ? "hoy" : dias === 1 ? "ayer" : `hace ${dias} días`;
}

// El color llega de una lista fija de la app, pero igual se limpia: solo deja pasar un color como #a1b2c3.
const colorSeguro = (color) => (/^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "#a78bfa");


// ===== Hoy: la tarjeta de la foto de la semana =====

// La tarjeta de Hoy que pide la foto de progreso de la semana (o nada si ya la tomaste o el recordatorio está apagado).
export function tarjetaFotoSemanal(estado, ctx) {
    if (!faltaFotoSemanal(estado, ctx.hoy)) return "";
    return `
        <section class="panel foto-semanal">
            <p class="etiqueta">Cada semana</p>
            <h2 class="titulo-juego">📷 Foto de progreso</h2>
            <p class="nota">Todavía no tomas la foto de esta semana. Mismo lugar, misma luz y mismo ángulo: así el cambio se nota.</p>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="fotos-semanal">📷 Tomar la foto</button>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-abrir">Ver mis fotos</button>
        </section>`;
}


// ===== La ventana «Mis fotos»: una portada por álbum =====

//   albumes: [{ id, tema, cuenta, ultima, portada }]  (portada = url de la foto más reciente, o null)
export function contenidoGaleria({ albumes, semanal, hoy }) {
    const total = albumes.reduce((suma, a) => suma + a.cuenta, 0);
    const tarjetas = albumes.map((a) => `
        <button type="button" class="album-tarjeta ${a.cuenta ? "" : "album-vacio-tarjeta"}" style="--tema: ${colorSeguro(a.tema.color)}"
                data-accion="fotos-album" data-album="${esc(a.id)}" aria-label="Álbum ${esc(a.tema.nombre)}, ${plural(a.cuenta, "foto", "fotos")}">
            <span class="album-portada">${a.portada
                ? `<img src="${a.portada}" alt="" loading="lazy">`
                : `<span class="album-vacio" aria-hidden="true">${esc(a.tema.icono)}</span>`}</span>
            <span class="album-insignia" aria-hidden="true">${esc(a.tema.icono)}</span>
            <span class="album-info">
                <b>${esc(a.tema.nombre)}</b>
                <small>${a.cuenta ? `${plural(a.cuenta, "foto", "fotos")} · ${hace(a.ultima, hoy)}` : "Sin fotos aún"}</small>
            </span>
        </button>`).join("");
    return `
        <div class="ritual-cabecera">
            <h2 class="titulo-juego" tabindex="-1" autofocus>📷 Mis fotos</h2>
        </div>
        <p class="nota">${total ? `${plural(total, "foto guardada", "fotos guardadas")}. ` : ""}Cada misión con foto tiene su álbum. Toca uno para abrirlo.</p>
        <div class="albumes-grilla">${tarjetas}</div>
        <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-recordatorio">🔔 Recordarme la foto de progreso cada semana: ${semanal ? "sí" : "no"}</button>
        <p class="ficha-nota">Las fotos viven solo en este teléfono, reducidas. La copia de seguridad no las incluye: si borras la app, se pierden.</p>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="cerrar">Cerrar</button>
        </div>`;
}


// ===== La subventana de un álbum =====

// Una foto grande con su fecha.
function figura(foto) {
    return `<figure class="foto-visor-figura">
                <img src="${foto.url}" alt="Foto del ${esc(fechaLegible(foto.fecha))}">
                <figcaption>${esc(fechaLegible(foto.fecha))}</figcaption>
            </figure>`;
}

// Arriba de las miniaturas: la ayuda, una foto grande (con anterior/siguiente y borrar) o dos para comparar.
function visor(fotos, seleccion) {
    const elegidas = seleccion.map((fecha) => fotos.find((f) => f.fecha === fecha)).filter(Boolean)
        .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));   // la más vieja a la izquierda
    if (!elegidas.length) {
        return `<p class="nota album-ayuda">Toca una foto para verla. Toca dos para compararlas${fotos.length > 1 ? ", o usa «Antes y después»" : ""}.</p>`;
    }
    if (elegidas.length === 1) {
        const i = fotos.findIndex((f) => f.fecha === elegidas[0].fecha);
        return `<div class="foto-visor" data-visor>${figura(elegidas[0])}</div>
                <div class="foto-nav">
                    <button type="button" class="boton boton-secundario" data-accion="fotos-mover" data-paso="-1" ${i <= 0 ? "disabled" : ""}>‹ Antes</button>
                    <button type="button" class="boton boton-secundario" data-accion="fotos-mover" data-paso="1" ${i >= fotos.length - 1 ? "disabled" : ""}>Después ›</button>
                </div>
                <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-borrar" data-fecha="${elegidas[0].fecha}">🗑️ Borrar esta foto</button>`;
    }
    const dias = diasEntre(elegidas[0].fecha, elegidas[1].fecha);
    return `<div class="foto-visor foto-visor-doble" data-visor>${elegidas.map(figura).join("")}</div>
            <p class="nota foto-visor-dias">Entre las dos pasaron ${plural(dias, "día", "días")}.</p>`;
}

// Las miniaturas agrupadas por mes, de lo más nuevo a lo más viejo.
function meses(fotos, seleccion) {
    const grupos = new Map();
    for (const f of [...fotos].reverse()) {
        const clave = f.fecha.slice(0, 7);
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave).push(f);
    }
    return [...grupos].map(([clave, lista]) => `
        <section class="album-mes">
            <h3 class="album-mes-titulo"><span>${nombreDeMes(clave)}</span><small>${plural(lista.length, "foto", "fotos")}</small></h3>
            <div class="fotos-grilla">${lista.map((f) => `
                <button type="button" class="foto-mini" data-accion="fotos-elegir" data-fecha="${f.fecha}" aria-pressed="${seleccion.includes(f.fecha)}">
                    <img src="${f.url}" alt="Foto del ${esc(fechaLegible(f.fecha))}" loading="lazy">
                    <span>${esc(fechaCorta(f.fecha))}</span>
                </button>`).join("")}</div>
        </section>`).join("");
}

//   album: { id, tema }   fotos: [{ fecha, url }] de la más vieja a la más nueva   seleccion: hasta 2 fechas
export function contenidoAlbum({ album, fotos, seleccion, hoy }) {
    const t = album.tema;
    const primera = fotos[0];
    const ultima = fotos[fotos.length - 1];
    const datos = fotos.length
        ? `<span class="album-dato">📸 ${plural(fotos.length, "foto", "fotos")}</span>
           <span class="album-dato">📅 ${esc(fechaCorta(primera.fecha))}${fotos.length > 1 ? ` → ${esc(fechaCorta(ultima.fecha))}` : ""}</span>
           <span class="album-dato">⏳ ${diasEntre(primera.fecha, hoy) <= 0 ? "empezaste hoy" : `${plural(diasEntre(primera.fecha, hoy), "día", "días")} de camino`}</span>`
        : "";
    const acciones = [
        fotos.length > 1 ? `<button type="button" class="boton boton-secundario" data-accion="fotos-antes-despues">↔ Antes y después</button>` : "",
        album.id === "progreso" ? `<button type="button" class="boton boton-principal" data-accion="fotos-nueva">➕ Foto de hoy</button>` : "",
    ].join("");
    return `
        <div class="album-ventana" style="--tema: ${colorSeguro(t.color)}">
            <header class="album-cabecera">
                <span class="album-cabecera-icono" aria-hidden="true">${esc(t.icono)}</span>
                <div class="album-cabecera-texto">
                    <p class="etiqueta">Álbum · ${esc(t.etiqueta)}</p>
                    <h2 class="titulo-juego" tabindex="-1" autofocus>${esc(t.nombre)}</h2>
                </div>
                <button type="button" class="boton-icono" data-accion="cerrar" aria-label="Cerrar el álbum">✕</button>
            </header>
            ${datos ? `<div class="album-datos">${datos}</div>` : ""}
            ${acciones ? `<div class="album-acciones">${acciones}</div>` : ""}
            ${fotos.length ? visor(fotos, seleccion) : `<p class="nota album-ayuda">Aún no hay fotos aquí. ${album.id === "progreso" ? "Toca «Foto de hoy» para empezar." : "Se guardarán al completar la misión."}</p>`}
            ${meses(fotos, seleccion)}
        </div>`;
}
