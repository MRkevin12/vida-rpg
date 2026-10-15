// ataques.js — Cómo SE VE el ataque de cada criatura (v67).
//
// Antes la criatura solo embestía y a tu héroe le salía un número. Ahora cada una ataca a su manera:
// garras, tajos, mordidas, escupitajos, bolas de fuego, rayos de sus ojos… Este archivo solo decide el
// ESTILO de cada criatura y calcula por dónde viaja el ataque; el dibujo está en estilos.css (clases `ff-atq-*`)
// y vistas.js pone el HTML dentro de la escena de batalla.
//
// Los estilos de «cuerpo a cuerpo» pasan encima de tu héroe; los demás (proyectiles y rayos) viajan desde la criatura.

import { FAMILIA_DE_CRIATURA } from "./sonido.js";

export const ESTILOS = {
    garras:     { nombre: "Zarpazo",    cuerpo: true  },
    tajo:       { nombre: "Tajo",       cuerpo: true  },
    mordida:    { nombre: "Mordida",    cuerpo: true  },
    golpe:      { nombre: "Golpe pesado", cuerpo: true },
    escupitajo: { nombre: "Escupitajo", cuerpo: false },
    aguijon:    { nombre: "Aguijón",    cuerpo: false },
    espectral:  { nombre: "Espectro",   cuerpo: false },
    fuego:      { nombre: "Bola de fuego", cuerpo: false },
    rayo:       { nombre: "Rayo",       cuerpo: false },
    esquirlas:  { nombre: "Esquirlas",  cuerpo: false },
    rafaga:     { nombre: "Ráfaga",     cuerpo: false },
};

// Lo normal de cada familia de criaturas (las mismas de sonido.js, que decide cómo suenan).
const POR_FAMILIA = {
    chillido: "garras", hueso: "tajo", baba: "escupitajo", bicho: "aguijon", espectral: "espectral", bestia: "garras",
    fuego: "fuego", metal: "golpe", cristal: "esquirlas", viento: "rafaga", rugido: "mordida", ojo: "rayo",
};

// Las que no atacan como el resto de su familia.
const EXCEPCIONES = {
    tajo: ["esqueleto", "caballero", "vigia-caido", "mi-minero", "mi-capataz", "centinela", "mi-centinela", "la-gemelo"],
    mordida: ["sierpe", "mimico", "mi-mimico", "can", "sabueso", "la-can"],
    fuego: ["dragon", "mi-dragon", "cieno-magma"],
    golpe: ["kraken", "arbol", "raiz", "apagador", "mi-golem"],
};

// El estilo de ataque de una criatura. `familia` es su familia de sonido (ver FAMILIA_DE_CRIATURA en sonido.js).
export function estiloDe(id, familia = FAMILIA_DE_CRIATURA[id]) {
    for (const [estilo, ids] of Object.entries(EXCEPCIONES)) {
        if (ids.includes(id)) return estilo;
    }
    return POR_FAMILIA[familia] || "garras";
}

// Dónde está cada uno en la escena, en «puntos» de pixel art (la sala mide 192 × 128).
const X_CRIATURA = 62;
const X_HEROE = 150;

// Todo lo que el dibujo necesita saber del recorrido: dónde sale y dónde llega el ataque, el largo y el ángulo del rayo.
// criatura = { talla, vuela }; fuerte = golpe fuerte (más grande); falla = tu héroe esquivó.
export function recorrido(criatura = {}, { fuerte = false, falla = false } = {}) {
    const talla = criatura.talla || 96;
    const x0 = Math.round(X_CRIATURA + talla * 0.38);             // por delante de la criatura
    const y0 = Math.round(10 + (criatura.vuela ? 12 : 0) + talla * 0.42);
    const x1 = falla ? 210 : X_HEROE - 8;                         // si esquivas, pasa de largo y sale de la escena
    const y1 = falla ? y0 + 10 : 34;
    const largo = Math.round(Math.hypot(x1 - x0, y1 - y0));
    const angulo = Math.round((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI * 10) / 10;   // CSS: positivo = hacia abajo
    return { x0, y0, x1, y1, largo, angulo: -angulo, tam: fuerte ? 1.8 : 1.25 };
}

// Las variables CSS del recorrido, para el atributo style.
export function estiloCss(r) {
    return `--x0: ${r.x0}; --y0: ${r.y0}; --x1: ${r.x1}; --y1: ${r.y1}; --largo: ${r.largo}; --ang: ${r.angulo}deg; --tam: ${r.tam}`;
}

// El HTML del ataque (dentro de la escena). Cada <i> es una pieza que el CSS anima.
export function htmlDelAtaque(estilo, criatura, { fuerte = false, falla = false } = {}) {
    if (!ESTILOS[estilo]) return "";
    const r = recorrido(criatura, { fuerte, falla });
    // Los que tiran varias piezas a la vez.
    const piezas = estilo === "esquirlas" || estilo === "rafaga"
        ? [-9, 0, 9].map((dy, i) => `<i class="a" style="--dy: ${dy}; --n: ${i}"></i>`).join("")
        : '<i class="a"></i>';
    // (si esquivas, el proyectil pasa de largo y no hay impacto; los golpes cuerpo a cuerpo sí dibujan su pieza «b»)
    const impacto = falla && !ESTILOS[estilo].cuerpo ? "" : '<i class="b"></i>';
    return `<span class="ff-atq ff-atq-${estilo} ${fuerte ? "fuerte" : ""} ${falla ? "falla" : ""}" style="${estiloCss(r)}" aria-hidden="true">${piezas}${impacto}</span>`;
}
