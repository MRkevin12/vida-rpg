// vistas-fotos.js — Lo que se VE de las fotos de progreso (v197): la galería con su comparador
// y la tarjeta semanal de Hoy. Solo arma HTML; guardar y leer las fotos lo hace fotos.js, y los botones app-foto.js.
//
// Las fotos llegan ya con su dirección temporal (url) porque leerlas de IndexedDB es asíncrono
// y las vistas son funciones simples que devuelven texto.

import { esc } from "./vistas-comun.js";
import { fechaLegible, fechaCorta, diasEntre } from "../fechas.js";
import { faltaFotoSemanal } from "../fotos.js";

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

// Una foto grande con su fecha.
function figura(foto) {
    return `<figure class="foto-visor-figura">
                <img src="${foto.url}" alt="Foto del ${esc(fechaLegible(foto.fecha))}">
                <figcaption>${esc(fechaLegible(foto.fecha))}</figcaption>
            </figure>`;
}

// Lo que se ve debajo de las miniaturas: nada, una foto grande o dos juntas para comparar.
function visor(fotos, seleccion) {
    const elegidas = seleccion.map((fecha) => fotos.find((f) => f.fecha === fecha)).filter(Boolean)
        .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));   // la más vieja a la izquierda
    if (!elegidas.length) return `<p class="nota">Toca una foto para verla. Toca dos para compararlas.</p>`;
    if (elegidas.length === 1) {
        return `<div class="foto-visor">${figura(elegidas[0])}</div>
                <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-borrar" data-fecha="${elegidas[0].fecha}">🗑️ Borrar esta foto</button>`;
    }
    const dias = diasEntre(elegidas[0].fecha, elegidas[1].fecha);
    return `<div class="foto-visor foto-visor-doble">${elegidas.map(figura).join("")}</div>
            <p class="nota foto-visor-dias">Entre las dos pasaron ${dias} ${dias === 1 ? "día" : "días"}.</p>`;
}

// El contenido de la ventana de fotos.
//   albumes: [{ id, nombre, cuenta }]   album: el id del que estás viendo
//   fotos: [{ fecha, url }] de ese álbum (de la más vieja a la más nueva)   seleccion: hasta 2 fechas
export function contenidoGaleria({ albumes, album, fotos, seleccion, semanal }) {
    const chips = albumes.map((a) => `
        <button type="button" class="boton boton-chico ${a.id === album ? "" : "boton-secundario"}" data-accion="fotos-album" data-album="${esc(a.id)}"
                aria-pressed="${a.id === album}">${esc(a.nombre)} <small>${a.cuenta}</small></button>`).join("");
    const miniaturas = fotos.length
        ? `<div class="fotos-grilla">${fotos.map((f) => `
            <button type="button" class="foto-mini" data-accion="fotos-elegir" data-fecha="${f.fecha}" aria-pressed="${seleccion.includes(f.fecha)}">
                <img src="${f.url}" alt="Foto del ${esc(fechaLegible(f.fecha))}" loading="lazy">
                <span>${esc(fechaCorta(f.fecha))}</span>
            </button>`).join("")}</div>`
        : `<p class="nota">Aún no hay fotos en este álbum.</p>`;
    return `
        <div class="ritual-cabecera">
            <h2 class="titulo-juego" tabindex="-1" autofocus>📷 Fotos de progreso</h2>
        </div>
        <div class="fotos-albumes" role="group" aria-label="Álbumes">${chips}</div>
        ${album === "progreso" ? `<button type="button" class="boton boton-principal boton-ancho" data-accion="fotos-nueva">➕ Foto de hoy</button>` : ""}
        ${miniaturas}
        ${visor(fotos, seleccion)}
        <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-recordatorio">🔔 Recordarme cada semana: ${semanal ? "sí" : "no"}</button>
        <p class="ficha-nota">Las fotos viven solo en este teléfono, reducidas. La copia de seguridad no las incluye: si borras la app, se pierden.</p>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="cerrar">Cerrar</button>
        </div>`;
}
