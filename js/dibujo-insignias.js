// dibujo-insignias.js — El dibujo de cada insignia, en pixel art (v101).
//
// Cada insignia mide 24 × 28 puntos: arriba una cinta y abajo la medalla, con el ícono del logro
// en el centro (los íconos de iconos.js). La forma depende del grado:
//   bronce = medalla redonda · plata = escudo · oro = estrella de ocho puntas · leyenda = emblema con corona.
// Se dibuja "punto por punto": una función dice de qué color es cada punto, y después se juntan los
// puntos seguidos del mismo color en un solo rectángulo (así el SVG queda corto).

import { ICONOS, icono } from "./iconos.js";
import { POR_ID } from "./insignias.js";

const ANCHO = 24;
const ALTO = 28;
const TINTA = "#140c22";

// Los tonos de cada grado: luz, medio, sombra y la cinta (dos colores).
const COLORES = {
    bronce:  { luz: "#f2b27a", medio: "#c27e44", sombra: "#7a4520", cinta: ["#b3202e", "#e8384f"] },
    plata:   { luz: "#ffffff", medio: "#b9c2d6", sombra: "#646c8a", cinta: ["#2a68c4", "#4cb3f2"] },
    oro:     { luz: "#fff3a6", medio: "#ffcb3d", sombra: "#9a5212", cinta: ["#7034c2", "#b06cf0"] },
    leyenda: { luz: "#ead0ff", medio: "#9a55e0", sombra: "#3f1b78", cinta: ["#ffcb3d", "#de8f1b"], borde: "#ffcb3d" },
};
const BLOQUEADA = { luz: "#3a3350", medio: "#2a2440", sombra: "#1c1830", cinta: ["#2a2440", "#3a3350"] };

// ¿Este punto (x, y) es parte de la medalla? Cada grado tiene su forma. El centro de la medalla es (11.5, 16.5).
const FORMAS = {
    bronce: (x, y) => Math.hypot(x - 11.5, y - 16.5) <= 9.6,
    plata: (x, y) => {
        if (y < 7 || y > 27 || x < 2 || x > 21) return false;
        if (y <= 19) return true;
        return Math.abs(x - 11.5) <= 9.5 - (y - 19) * 1.15;   // la punta de abajo
    },
    oro: (x, y) => {
        const dx = x - 11.5, dy = y - 16.5;
        const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        return r <= 7.4 + 2.6 * Math.max(0, Math.cos(8 * a));   // ocho puntas
    },
    leyenda: (x, y) => Math.hypot(x - 11.5, y - 17) <= 8.8 || (y >= 5 && y <= 9 && x >= 5 && x <= 18 && (x % 4 !== 1 || y >= 8)),   // círculo + corona
};

// El color de cada punto. La luz viene de arriba a la izquierda.
function colorDe(x, y, forma, c, grado) {
    // La cinta: dos tiras que bajan hasta la medalla.
    if (y <= 7 && (x >= 7 && x <= 10)) return c.cinta[0];
    if (y <= 7 && (x >= 13 && x <= 16)) return c.cinta[1];
    if (!forma(x, y)) {
        const toca = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => forma(x + a, y + b));
        return toca ? TINTA : null;
    }
    // Un borde de dos tonos (en la leyenda, dorado) y el centro sombreado en diagonal.
    const enBorde = [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([a, b]) => !forma(x + a, y + b));
    if (enBorde) return grado === "leyenda" && c.borde ? c.borde : x + y < 28 ? c.luz : c.sombra;
    return x + y < 24 ? c.luz : x + y > 33 ? c.sombra : c.medio;
}

// Puntos sueltos (x, y, color) → rectángulos SVG, juntando los seguidos del mismo color en cada fila.
function aRectangulos(colorEn, ancho, alto) {
    let svg = "";
    for (let y = 0; y < alto; y++) {
        let x = 0;
        while (x < ancho) {
            const c = colorEn(x, y);
            if (!c) { x++; continue; }
            let fin = x + 1;
            while (fin < ancho && colorEn(fin, y) === c) fin++;
            svg += `<rect x="${x}" y="${y}" width="${fin - x}" height="1" fill="${c}"/>`;
            x = fin;
        }
    }
    return svg;
}

// El ícono del centro: sus filas de letras de iconos.js, en pequeño (cada punto del ícono = 0,75 de la medalla).
function iconoEnMedio(nombre) {
    const filas = ICONOS[nombre];
    if (!filas) return "";
    const lado = 12, x0 = 11.5 - lado / 2, y0 = 16.5 - lado / 2;
    // Se reutiliza el dibujo del ícono como un SVG dentro del SVG (con su propio viewBox de 16 × 16).
    return `<svg x="${x0}" y="${y0}" width="${lado}" height="${lado}" viewBox="0 0 16 16" shape-rendering="crispEdges">${iconoTrazos(nombre)}</svg>`;
}

// (Se pide prestado el dibujo del ícono ya hecho por iconos.js: está en icono(nombre), pero ese trae su
// propio <svg class="pxi">. Aquí se saca solo lo de adentro.)
const iconoTrazos = (nombre) => icono(nombre).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

const hechas = new Map();

// La insignia dibujada. bloqueada = todavía no la ganaste (sale oscura y sin ícono, con un «?»).
export function dibujarInsignia(id, { bloqueada = false, clase = "insignia-svg" } = {}) {
    const insignia = POR_ID[id];
    if (!insignia) return "";
    const clave = `${id}-${bloqueada ? 1 : 0}`;
    if (!hechas.has(clave)) {
        const c = bloqueada ? BLOQUEADA : COLORES[insignia.grado];
        const forma = FORMAS[insignia.grado];
        const fondo = aRectangulos((x, y) => colorDe(x, y, forma, c, insignia.grado), ANCHO, ALTO);
        const centro = bloqueada ? `<svg x="5.5" y="10.5" width="12" height="12" viewBox="0 0 16 16" shape-rendering="crispEdges" opacity=".55">${iconoTrazos("pregunta")}</svg>` : iconoEnMedio(insignia.icono);
        hechas.set(clave, `${fondo}${centro}`);
    }
    return `<svg class="${clase}" viewBox="0 0 ${ANCHO} ${ALTO}" shape-rendering="crispEdges" role="img" aria-label="Insignia: ${insignia.nombre}" xmlns="http://www.w3.org/2000/svg">${hechas.get(clave)}</svg>`;
}

// La insignia pequeña que va prendida en el pecho del avatar (dentro del dibujo del avatar, en sus coordenadas).
export function insigniaEnElPecho(id, x = 86, y = 69, ancho = 11) {   // 11 de ancho: en el sprite de la Torre ocupa ~4 puntos y se reconoce
    if (!POR_ID[id]) return "";
    const alto = (ancho * ALTO) / ANCHO;
    return `<g class="insignia-pecho">${dibujarInsignia(id).replace("<svg ", `<svg x="${x}" y="${y}" width="${ancho}" height="${alto}" `)}</g>`;
}
