// libros.js — Los libros largos de la sección Historia (v70): «El Centinela» (Casio) y «La linterna de Orrin» (Marta).
//
// Cada libro vive en su propio archivo con la misma forma (ID, TITULO, CAPITULOS, PREMIO, PUERTA, libroDe…). Este
// registro los junta para que acciones.js, app.js y vistas.js los traten igual. PUERTA dice dónde se abren: con tu
// récord en un lugar de la Torre (`lugar`), los primeros capítulos desde `libre` y el final desde `final`.

import * as casio from "./libro-casio.js";
import * as orrin from "./libro-orrin.js";

export const REGISTRO = { casio, orrin };
export const IDS = Object.keys(REGISTRO);
export const libroPorId = (id) => REGISTRO[id] || null;

// Tu récord en el lugar que abre ese libro (pisos de la Torre o sótanos de la Mazmorra).
export function recordDe(estado, id) {
    const libro = REGISTRO[id];
    return libro ? estado.arcade?.records?.[libro.PUERTA.lugar] || 0 : 0;
}

// El libro con tu nombre puesto y los capítulos que ya puedes abrir.
export const libroDeEstado = (estado, id) => REGISTRO[id].libroDe(estado.personaje.nombre, recordDe(estado, id));

// ¿Ese capítulo (desde 0) está abierto con ese récord?
export function capituloAbierto(libro, capitulo, record) {
    return record >= (capitulo < libro.CAPITULOS_LIBRES ? libro.PUERTA.libre : libro.PUERTA.final);
}
