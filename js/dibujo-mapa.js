// dibujo-mapa.js — El mapa del reino, dibujado como el mapa del mundo de un juego de rol clásico (v26).
//
// Cada región se dibuja en SVG en un lienzo de 192 × 416 puntos y después pixel.js lo
// convierte en pixel art (como la Torre). De abajo hacia arriba:
//   el cielo y, a lo lejos, la Torre → el suelo de la región → el paisaje (árboles, montañas,
//   dunas, islas…) → el camino → los lugares (cofres, santuarios, guaridas, la fortaleza)
//   → la niebla sobre lo que todavía no exploras.
// Tu héroe y tu mascota NO van aquí: se ponen encima, como imágenes aparte, para que se muevan.
//
// Todo es grande y simple: lo que mida menos de un punto desaparece al pixelar.

import { LIENZO, LUGARES_POR_REGION, puntosDelCamino, tramoDe, CIUDADELA } from "./mapa.js";

const { ancho: ANCHO, alto: ALTO } = LIENZO;
const CIELO = 24;                     // alto de la franja del cielo
const LINEA = "#1a1222";              // las líneas oscuras de los dibujos

// Números "al azar" que siempre salen iguales para la misma semilla (así el paisaje no
// cambia cada vez que se dibuja).
function sorteo(semilla) {
    let valor = semilla;
    return () => {
        valor = (valor * 1664525 + 1013904223) % 4294967296;
        return valor / 4294967296;
    };
}

// Distancia de un punto al camino (a cada tramo entre dos lugares).
function distanciaAlCamino(x, y, puntos) {
    let menor = Infinity;
    for (let i = 1; i < puntos.length; i++) {
        const [a, b] = [puntos[i - 1], puntos[i]];
        const largo = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
        const t = Math.max(0, Math.min(1, ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / largo));
        menor = Math.min(menor, Math.hypot(x - (a.x + t * (b.x - a.x)), y - (a.y + t * (b.y - a.y))));
    }
    return menor;
}

// El camino como una curva suave que pasa por todos los lugares (curva de Catmull-Rom
// convertida a curvas de Bézier, que es lo que entiende SVG).
function caminoSuave(puntos) {
    let d = `M${puntos[0].x} ${puntos[0].y}`;
    for (let i = 0; i < puntos.length - 1; i++) {
        const p0 = puntos[Math.max(0, i - 1)];
        const [p1, p2] = [puntos[i], puntos[i + 1]];
        const p3 = puntos[Math.min(puntos.length - 1, i + 2)];
        const c1 = [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6];
        const c2 = [p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6];
        d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2.x} ${p2.y}`;
    }
    return d;
}


// ===== Los colores de cada región =====
const PALETAS = {
    valle:     { suelo: "#4f8a3a", claro: "#68a84a", oscuro: "#3d6e2e", camino: "#b08a5a", borde: "#5e4430",
                 cielo: ["#7fb8e6", "#cfe6f4"], lejos: "#7aa0b8" },
    bosque:    { suelo: "#2f5a2c", claro: "#3e7036", oscuro: "#22441f", camino: "#9a7a52", borde: "#4a3424",
                 cielo: ["#6f97b0", "#b8d0d8"], lejos: "#4f6e72" },
    montanas:  { suelo: "#7a7064", claro: "#958a7c", oscuro: "#5c544a", camino: "#b8a888", borde: "#4a4038",
                 cielo: ["#8ea8cc", "#dfe6f2"], lejos: "#8a94aa" },
    desierto:  { suelo: "#d4ac64", claro: "#e6c483", oscuro: "#b58b4b", camino: "#a07a4a", borde: "#6e5030",
                 cielo: ["#e8b878", "#f8e2b8"], lejos: "#c89a64" },
    mar:       { suelo: "#2a64a4", claro: "#4a8ad0", oscuro: "#1b4a80", camino: "#8a6440", borde: "#4a3420",
                 cielo: ["#6aa4dc", "#c8e2f6"], lejos: "#5a88b8", arena: "#dcc47e", pasto: "#5a9a48" },
    ciudadela: { suelo: "#6e6c78", claro: "#8a8894", oscuro: "#55535e", camino: "#c0b6a2", borde: "#4a4650",
                 cielo: ["#3a2f6a", "#b88aa8"], lejos: "#4a3f6e" },
};


// ===== El paisaje: un dibujo para cada cosa =====
// (x, y) es el punto donde la cosa toca el suelo (el centro de su base).

const arbol = (x, y, copa, tronco = "#5a3a20") => `
    <ellipse cx="${x + 1}" cy="${y}" rx="6" ry="2" fill="#000" opacity=".25"/>
    <rect x="${x - 1}" y="${y - 5}" width="2.4" height="5" fill="${tronco}"/>
    <circle cx="${x}" cy="${y - 9}" r="6" fill="${copa}" stroke="${LINEA}" stroke-width="1"/>
    <circle cx="${x - 2}" cy="${y - 11}" r="2.6" fill="#fff" opacity=".18"/>`;

const pino = (x, y, color) => `
    <ellipse cx="${x + 1}" cy="${y}" rx="5" ry="1.8" fill="#000" opacity=".25"/>
    <rect x="${x - 1}" y="${y - 3}" width="2" height="3" fill="#4a2e1a"/>
    <path d="M${x} ${y - 18} L${x + 6} ${y - 3} L${x - 6} ${y - 3} Z" fill="${color}" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${x} ${y - 18} L${x - 6} ${y - 3} L${x - 1} ${y - 3} Z" fill="#fff" opacity=".12"/>`;

const flores = (x, y, a, b) => `<rect x="${x - 3}" y="${y - 2}" width="2" height="2" fill="${a}"/><rect x="${x + 1}" y="${y - 3}" width="2" height="2" fill="${b}"/>
    <rect x="${x - 1}" y="${y}" width="2" height="2" fill="${a}"/>`;

const matas = (x, y, color) => `<path d="M${x - 3} ${y} l1 -3 l1 3 M${x} ${y} l1 -4 l1 4 M${x + 3} ${y} l1 -3 l1 3" fill="none" stroke="${color}" stroke-width="1"/>`;

const roca = (x, y, color = "#8a8a90") => `
    <path d="M${x - 5} ${y} L${x - 4} ${y - 4} L${x} ${y - 6} L${x + 4} ${y - 4} L${x + 5} ${y} Z" fill="${color}" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${x - 3} ${y - 3} L${x} ${y - 5}" stroke="#fff" stroke-width="1" opacity=".3"/>`;

const colina = (x, y, color) => `<path d="M${x - 14} ${y} Q${x} ${y - 14} ${x + 14} ${y} Z" fill="${color}" stroke="${LINEA}" stroke-width="1" opacity=".9"/>`;

const montana = (x, y, t = 1) => {
    const [w, h] = [14 * t, 22 * t];
    return `<path d="M${x - w} ${y} L${x} ${y - h} L${x + w} ${y} Z" fill="#6e6e7c" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M${x} ${y - h} L${x + w} ${y} L${x + w * 0.2} ${y} Z" fill="#4e4e5c"/>
        <path d="M${x} ${y - h} L${x - w * 0.36} ${y - h * 0.64} L${x - w * 0.12} ${y - h * 0.7} L${x + w * 0.06} ${y - h * 0.6} L${x + w * 0.34} ${y - h * 0.66} Z" fill="#eef2ff"/>`;
};

const hongo = (x, y) => `<rect x="${x - 0.6}" y="${y - 3}" width="1.6" height="3" fill="#efe6c8"/>
    <path d="M${x - 3} ${y - 3} Q${x} ${y - 7} ${x + 3} ${y - 3} Z" fill="#c8323a" stroke="${LINEA}" stroke-width=".8"/>
    <rect x="${x - 1}" y="${y - 5}" width="1" height="1" fill="#fff"/>`;

const duna = (x, y, claro, oscuro) => `<path d="M${x - 16} ${y} Q${x - 4} ${y - 8} ${x + 8} ${y - 2} Q${x + 14} ${y} ${x + 18} ${y}" fill="${claro}" stroke="${oscuro}" stroke-width="1"/>`;

const cactus = (x, y) => `<rect x="${x - 1.5}" y="${y - 12}" width="3" height="12" rx="1.5" fill="#4a8a4a" stroke="${LINEA}" stroke-width=".8"/>
    <path d="M${x - 1.5} ${y - 6} h-3 v-4 M${x + 1.5} ${y - 8} h3 v-3" fill="none" stroke="#4a8a4a" stroke-width="2.4" stroke-linecap="round"/>`;

const huesos = (x, y) => `<path d="M${x - 4} ${y - 1} L${x + 4} ${y - 3} M${x - 2} ${y - 4} L${x + 1} ${y}" stroke="#efe6c8" stroke-width="1.4" stroke-linecap="round"/>`;

const ola = (x, y, color) => `<path d="M${x - 5} ${y} q2.5 -2.5 5 0 t5 0" fill="none" stroke="${color}" stroke-width="1"/>`;

const casa = (x, y, techo = "#8a2a22") => `
    <ellipse cx="${x + 1}" cy="${y}" rx="7" ry="1.8" fill="#000" opacity=".25"/>
    <rect x="${x - 5}" y="${y - 7}" width="10" height="7" fill="#c8b898" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 7} ${y - 6} L${x} ${y - 12} L${x + 7} ${y - 6} Z" fill="${techo}" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <rect x="${x - 1}" y="${y - 4}" width="2.4" height="4" fill="#3a2418"/>
    <rect x="${x + 2}" y="${y - 6}" width="2" height="2" fill="#ffd27a"/>`;

const estandarte = (x, y, color) => `<rect x="${x}" y="${y - 14}" width="1.2" height="14" fill="#3a3040"/>
    <path d="M${x + 1.2} ${y - 14} h6 l-2 2.5 l2 2.5 h-6 Z" fill="${color}" stroke="${LINEA}" stroke-width=".6"/>`;

const palmera = (x, y) => `<path d="M${x} ${y} Q${x + 2} ${y - 7} ${x + 1} ${y - 13}" fill="none" stroke="#7a5a32" stroke-width="2"/>
    <path d="M${x + 1} ${y - 13} q-6 -1 -8 3 M${x + 1} ${y - 13} q6 -1 8 3 M${x + 1} ${y - 13} q-3 -5 -7 -4 M${x + 1} ${y - 13} q3 -5 7 -4"
          fill="none" stroke="#3f8a3a" stroke-width="2" stroke-linecap="round"/>`;

// Qué se pone en cada región y con qué frecuencia (cada número es la probabilidad acumulada).
function cosaDelPaisaje(tipo, x, y, azar, c) {
    const r = azar();
    switch (tipo) {
        case "valle":
            if (r < 0.28) return arbol(x, y, r < 0.14 ? "#3f8a36" : "#2f6b2a");
            if (r < 0.45) return flores(x, y, "#f4e4a0", r < 0.36 ? "#e88aa0" : "#ffffff");
            if (r < 0.62) return matas(x, y, c.oscuro);
            if (r < 0.7) return colina(x, y, c.claro);
            if (r < 0.74) return roca(x, y);
            return "";
        case "bosque":
            if (r < 0.5) return pino(x, y, r < 0.25 ? "#1f4a2a" : "#2c6a3a");
            if (r < 0.72) return arbol(x, y, r < 0.62 ? "#2a5a26" : "#356b2c", "#4a2e1a");
            if (r < 0.8) return hongo(x, y);
            if (r < 0.9) return matas(x, y, c.claro);
            return "";
        case "montanas":
            if (r < 0.3) return montana(x, y, 0.7 + azar() * 0.6);
            if (r < 0.48) return roca(x, y, "#8a8478");
            if (r < 0.6) return pino(x, y, "#2c4a3a");
            if (r < 0.7) return matas(x, y, c.oscuro);
            return "";
        case "desierto":
            if (r < 0.3) return duna(x, y, c.claro, c.oscuro);
            if (r < 0.42) return cactus(x, y);
            if (r < 0.52) return roca(x, y, "#9a7450");
            if (r < 0.58) return huesos(x, y);
            return "";
        case "mar":
            if (r < 0.55) return ola(x, y, r < 0.3 ? c.claro : "#8cbcec");
            if (r < 0.62) return roca(x, y, "#5a6070");
            return "";
        case "ciudadela":
            if (r < 0.3) return casa(x, y, r < 0.15 ? "#8a2a22" : "#4a3a6a");
            if (r < 0.4) return estandarte(x, y, r < 0.35 ? "#c8a040" : "#7a2a8a");
            if (r < 0.48) return arbol(x, y, "#3a6a3a");
            return "";
        default:
            return "";
    }
}

// El paisaje de toda la región: cosas repartidas en una rejilla, lejos del camino.
function paisaje(tipo, puntos, c, region) {
    const azar = sorteo(1000 + region * 37);
    const cosas = [];
    for (let y = CIELO + 14; y < ALTO - 2; y += 11) {
        for (let x = 6; x < ANCHO - 4; x += 12) {
            const [px, py] = [x + (azar() - 0.5) * 8, y + (azar() - 0.5) * 6];
            if (distanciaAlCamino(px, py, puntos) < 13) continue;
            if (py < 60 && Math.abs(px - puntos[LUGARES_POR_REGION].x) < 30) continue;   // el lugar de la fortaleza
            const cosa = cosaDelPaisaje(tipo, Math.round(px), Math.round(py), azar, c);
            if (cosa) cosas.push({ y: py, cosa });
        }
    }
    // De atrás (arriba) hacia adelante (abajo): así lo de adelante tapa a lo de atrás.
    return cosas.sort((a, b) => a.y - b.y).map((c2) => c2.cosa).join("");
}

// Manchas suaves de color en el suelo, para que no se vea de un solo tono.
function manchas(c, region) {
    const azar = sorteo(77 + region);
    let d = "";
    for (let i = 0; i < 46; i++) {
        const [x, y] = [azar() * ANCHO, CIELO + azar() * (ALTO - CIELO)];
        const color = azar() < 0.5 ? c.claro : c.oscuro;
        d += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(8 + azar() * 16).toFixed(0)}" ry="${(4 + azar() * 7).toFixed(0)}" fill="${color}" opacity=".45"/>`;
    }
    return d;
}

// El cielo y, a lo lejos, la Torre (cada región más cerca). En la Ciudadela la Torre está en el mapa.
function cielo(tipo, c, tramo, id) {
    const torreLejos = tramo === CIUDADELA ? "" : (() => {
        const alto = 7 + tramo * 3.2;
        const x = 152;
        return `<path d="M${x - 2.4} ${CIELO} L${x - 1.6} ${CIELO - alto} L${x} ${CIELO - alto - 4} L${x + 1.6} ${CIELO - alto} L${x + 2.4} ${CIELO} Z" fill="#2a2440"/>
                <rect x="${x - 0.5}" y="${CIELO - alto + 3}" width="1" height="1" fill="#ffd27a"/>`;
    })();
    return `<rect width="${ANCHO}" height="${CIELO + 2}" fill="url(#${id}-cielo)"/>
        <path d="M0 ${CIELO} L18 ${CIELO - 6} L34 ${CIELO - 3} L56 ${CIELO - 9} L80 ${CIELO - 4} L104 ${CIELO - 8} L126 ${CIELO - 3} L170 ${CIELO - 7} L192 ${CIELO - 4} L192 ${CIELO + 2} L0 ${CIELO + 2} Z" fill="${c.lejos}"/>
        ${torreLejos}`;
}


// ===== Los lugares del camino =====

const marca = (p, alcanzado) => `<circle cx="${p.x}" cy="${p.y}" r="2.6" fill="${alcanzado ? "#f2c94c" : "#3a3240"}" stroke="${LINEA}" stroke-width="1"/>`;

function cofre(p, abierto, alcanzado) {
    const { x, y } = p;
    const madera = alcanzado ? "#8a5a2a" : "#5a4a3a";
    const tapa = abierto
        ? `<path d="M${x - 5} ${y - 4} L${x - 4} ${y - 9} L${x + 4} ${y - 9} L${x + 5} ${y - 4} Z" fill="#6a4220" stroke="${LINEA}" stroke-width="1"/>`
        : `<path d="M${x - 5} ${y - 4} Q${x} ${y - 9} ${x + 5} ${y - 4} Z" fill="${madera}" stroke="${LINEA}" stroke-width="1"/>`;
    return `<ellipse cx="${x}" cy="${y + 2}" rx="7" ry="2" fill="#000" opacity=".3"/>
        ${tapa}
        <rect x="${x - 5}" y="${y - 4}" width="10" height="6" fill="${madera}" stroke="${LINEA}" stroke-width="1"/>
        <rect x="${x - 5}" y="${y - 2}" width="10" height="1.2" fill="#e6b23c"/>
        ${abierto ? `<rect x="${x - 3}" y="${y - 5}" width="6" height="2" fill="#f2c94c"/>` : `<rect x="${x - 1}" y="${y - 3}" width="2" height="2.4" fill="#f2c94c"/>`}`;
}

function santuario(p, alcanzado, reclamado) {
    const { x, y } = p;
    return `<ellipse cx="${x}" cy="${y + 2}" rx="6" ry="2" fill="#000" opacity=".3"/>
        <rect x="${x - 5}" y="${y - 1}" width="10" height="3" fill="#a8a4b4" stroke="${LINEA}" stroke-width="1"/>
        <rect x="${x - 2.5}" y="${y - 9}" width="5" height="8" fill="#c8c4d4" stroke="${LINEA}" stroke-width="1"/>
        ${alcanzado && !reclamado ? `<circle cx="${x}" cy="${y - 12}" r="4" fill="#ffd27a" opacity=".4"/>` : ""}
        <path d="M${x} ${y - 14} q2 2.5 0 4.4 q-2 -1.9 0 -4.4 Z" fill="${alcanzado ? "#ff9a1f" : "#6a6474"}"/>`;
}

// La guarida de un señor: una cueva en la roca con su estandarte. Rojo y con ojos que brillan
// si el señor sigue ahí; blanco si ya cayó.
function guarida(p, libre, alcanzada) {
    const { x, y } = p;
    return `<ellipse cx="${x}" cy="${y + 2}" rx="10" ry="2.4" fill="#000" opacity=".35"/>
        <path d="M${x - 10} ${y + 1} L${x - 8} ${y - 8} L${x - 3} ${y - 13} L${x + 4} ${y - 12} L${x + 9} ${y - 7} L${x + 10} ${y + 1} Z"
              fill="${libre ? "#8a8494" : "#4a4250"}" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M${x - 8} ${y - 8} L${x - 3} ${y - 13} L${x} ${y - 12}" stroke="#fff" stroke-width="1" opacity=".25"/>
        <path d="M${x - 4} ${y + 1} L${x - 4} ${y - 4} Q${x} ${y - 9} ${x + 4} ${y - 4} L${x + 4} ${y + 1} Z" fill="#0c0812"/>
        ${libre ? `<path d="M${x - 2} ${y - 2} h4" stroke="#ffd27a" stroke-width="1" opacity=".7"/>`
                : `<rect x="${x - 2}" y="${y - 3}" width="1.2" height="1.2" fill="#ff3a3a"/><rect x="${x + 1}" y="${y - 3}" width="1.2" height="1.2" fill="#ff3a3a"/>`}
        <rect x="${x + 6}" y="${y - 22}" width="1.2" height="12" fill="#3a3040"/>
        <path d="M${x + 7.2} ${y - 22} h7 l-2.4 3 l2.4 3 h-7 Z" fill="${libre ? "#eef2ff" : "#b01c2c"}" stroke="${LINEA}" stroke-width=".7"/>
        ${alcanzada && libre ? `<rect x="${x + 9}" y="${y - 21}" width="2" height="1" fill="#2a8a4a"/>` : ""}`;
}

// Un memorial de la Ciudadela: un obelisco que se enciende cuando caen los 5 señores de su campaña.
function memorial(p, encendido) {
    const { x, y } = p;
    return `<ellipse cx="${x}" cy="${y + 2}" rx="7" ry="2" fill="#000" opacity=".3"/>
        <rect x="${x - 6}" y="${y - 2}" width="12" height="4" fill="#9a96a6" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${x - 3} ${y - 2} L${x - 2} ${y - 16} L${x} ${y - 19} L${x + 2} ${y - 16} L${x + 3} ${y - 2} Z" fill="#c8c4d4" stroke="${LINEA}" stroke-width="1"/>
        ${encendido ? `<circle cx="${x}" cy="${y - 22}" r="5" fill="#ffd27a" opacity=".45"/>
                       <path d="M${x} ${y - 26} q2.6 3 0 5.6 q-2.6 -2.6 0 -5.6 Z" fill="#ffb020"/>` : ""}`;
}

// La fortaleza al final de la región. La puerta se abre cuando la región queda libre.
function fortaleza(p, abierta) {
    const { x } = p;
    const y = p.y + 4;
    const muro = "#9a96a6";
    const almenas = (x0, ancho) => Array.from({ length: Math.floor(ancho / 4) }, (_, i) =>
        `<rect x="${x0 + i * 4}" y="${y - 0}" width="2.4" height="3" fill="${muro}" stroke="${LINEA}" stroke-width=".6"/>`).join("");
    const torreon = (tx) => `<rect x="${tx - 5}" y="${y - 30}" width="10" height="30" fill="${muro}" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${tx - 6} ${y - 30} L${tx} ${y - 39} L${tx + 6} ${y - 30} Z" fill="#5a3a6a" stroke="${LINEA}" stroke-width="1"/>
        <rect x="${tx - 1}" y="${y - 24}" width="2" height="3" fill="${abierta ? "#ffd27a" : "#2a2230"}"/>
        ${estandarte(tx, y - 38, abierta ? "#eef2ff" : "#b01c2c")}`;
    return `<ellipse cx="${x}" cy="${y + 2}" rx="24" ry="3" fill="#000" opacity=".35"/>
        ${torreon(x - 16)}${torreon(x + 16)}
        <rect x="${x - 12}" y="${y - 20}" width="24" height="20" fill="${muro}" stroke="${LINEA}" stroke-width="1"/>
        <g transform="translate(0 -23)">${almenas(x - 12, 24)}</g>
        <path d="M${x - 5} ${y} L${x - 5} ${y - 9} Q${x} ${y - 15} ${x + 5} ${y - 9} L${x + 5} ${y} Z" fill="${abierta ? "#ffd27a" : "#1a1222"}" stroke="${LINEA}" stroke-width="1"/>
        ${abierta ? "" : `<path d="M${x - 5} ${y - 6} h10 M${x - 5} ${y - 3} h10 M${x - 2} ${y - 11} v11 M${x + 2} ${y - 11} v11" stroke="#5a5060" stroke-width=".8"/>`}`;
}

// La Torre, al final de la Ciudadela.
function laTorre(p, encendida) {
    const { x } = p;
    const y = p.y + 4;
    let ventanas = "";
    for (let i = 0; i < 6; i++) ventanas += `<rect x="${x - 1}" y="${y - 10 - i * 9}" width="2" height="3" fill="${encendida || i < 2 ? "#ffd27a" : "#2a2230"}"/>`;
    return `<ellipse cx="${x}" cy="${y + 2}" rx="16" ry="3" fill="#000" opacity=".4"/>
        ${encendida ? `<circle cx="${x}" cy="${y - 64}" r="12" fill="#ffd27a" opacity=".35"/>` : ""}
        <path d="M${x - 11} ${y} L${x - 8} ${y - 58} L${x + 8} ${y - 58} L${x + 11} ${y} Z" fill="#8a8698" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${x + 2} ${y - 58} L${x + 8} ${y - 58} L${x + 11} ${y} L${x + 4} ${y} Z" fill="#6a6678"/>
        <rect x="${x - 10}" y="${y - 62}" width="20" height="5" fill="#9a96a8" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${x - 8} ${y - 62} L${x} ${y - 80} L${x + 8} ${y - 62} Z" fill="#4a3a6a" stroke="${LINEA}" stroke-width="1"/>
        ${ventanas}
        <path d="M${x - 4} ${y} L${x - 4} ${y - 7} Q${x} ${y - 11} ${x + 4} ${y - 7} L${x + 4} ${y} Z" fill="#1a1222"/>`;
}

// El punto de partida: una fogata.
const fogata = (p) => `<ellipse cx="${p.x}" cy="${p.y + 2}" rx="6" ry="2" fill="#000" opacity=".3"/>
    <path d="M${p.x - 5} ${p.y + 1} L${p.x + 5} ${p.y - 1} M${p.x - 5} ${p.y - 1} L${p.x + 5} ${p.y + 1}" stroke="#6a4220" stroke-width="2" stroke-linecap="round"/>
    <path d="M${p.x} ${p.y - 8} q4 4 1 8 q-1 -2 -3 -1 q-1 -4 2 -7 Z" fill="#ff8a1f"/>
    <path d="M${p.x} ${p.y - 4} q2 2 0 4 q-2 -2 0 -4 Z" fill="#ffe45a"/>`;


// ===== El mapa entero =====
// datos = { region (número global), alcanzado (lugares alcanzados en esta región: 0…25),
//           lugares: { n: { tipo, reclamado, libre } } para los lugares especiales,
//           regionLibre (los 4 señores cayeron) }
export function dibujarMapa(datos) {
    const tramo = tramoDe(datos.region);
    const tipo = ["valle", "bosque", "montanas", "desierto", "mar", "ciudadela"][tramo];
    const c = PALETAS[tipo];
    const puntos = puntosDelCamino();
    const id = `mapa${datos.region}`;
    const camino = caminoSuave(puntos);

    // El mar: el camino va por una cadena de islas.
    const islas = tipo === "mar" ? `
        <path d="${camino}" fill="none" stroke="${c.arena}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${camino}" fill="none" stroke="${c.pasto}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="26" cy="300" r="11" fill="${c.arena}"/><circle cx="26" cy="300" r="7" fill="${c.pasto}"/>
        <circle cx="168" cy="170" r="9" fill="${c.arena}"/><circle cx="168" cy="170" r="5" fill="${c.pasto}"/>` : "";
    // La Ciudadela: un empedrado (rejilla de piedras) y una muralla.
    const empedrado = tipo === "ciudadela" ? `<rect y="${CIELO}" width="${ANCHO}" height="${ALTO - CIELO}" fill="url(#${id}-piedras)"/>
        <rect y="300" width="${ANCHO}" height="6" fill="#8a8894" stroke="${LINEA}" stroke-width="1"/>` : "";
    // El valle: un lago lejos del camino.
    const lago = tipo === "valle" ? `<ellipse cx="22" cy="210" rx="16" ry="9" fill="#3a78b8" stroke="${LINEA}" stroke-width="1"/>
        <path d="M14 208 h6 M24 212 h6" stroke="#8cbcec" stroke-width="1"/>` : "";
    // El desierto: un oasis.
    const oasis = tipo === "desierto" ? `<ellipse cx="170" cy="260" rx="13" ry="6" fill="#3a9ac8" stroke="${LINEA}" stroke-width="1"/>${palmera(162, 258)}${palmera(178, 256)}` : "";

    // Los lugares del camino.
    const lugares = puntos.map((p, n) => {
        if (n === 0) return fogata(p);
        const lugar = datos.lugares[n] || { tipo: "camino" };
        const alcanzado = n <= datos.alcanzado;
        switch (lugar.tipo) {
            case "tesoro": return cofre(p, lugar.reclamado, alcanzado);
            case "santuario": return santuario(p, alcanzado, lugar.reclamado);
            case "guarida": return guarida(p, lugar.libre, alcanzado);
            case "memorial": return memorial(p, lugar.libre);
            case "fortaleza": return tramo === CIUDADELA ? laTorre(p, datos.regionLibre) : fortaleza(p, datos.regionLibre && alcanzado);
            default: return marca(p, alcanzado);
        }
    });

    // La niebla cubre lo que está más allá del siguiente lugar (lo que todavía no exploras).
    const limite = datos.alcanzado >= LUGARES_POR_REGION ? null : puntos[Math.min(LUGARES_POR_REGION, datos.alcanzado + 1)].y - 8;
    const niebla = limite === null ? "" : `<rect width="${ANCHO}" height="${limite}" fill="url(#${id}-niebla)"/>
        ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${i * 30 + 8}" cy="${limite - 6}" rx="20" ry="7" fill="#2a2440" opacity=".5"/>`).join("")}`;

    return `<svg viewBox="0 0 ${ANCHO} ${ALTO}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="${id}-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cielo[0]}"/><stop offset="1" stop-color="${c.cielo[1]}"/></linearGradient>
            <linearGradient id="${id}-niebla" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1c1830" stop-opacity=".8"/><stop offset=".86" stop-color="#1c1830" stop-opacity=".66"/>
                <stop offset="1" stop-color="#1c1830" stop-opacity="0"/></linearGradient>
            <radialGradient id="${id}-borde" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#05030c" stop-opacity="0"/><stop offset="1" stop-color="#05030c" stop-opacity=".55"/></radialGradient>
            <pattern id="${id}-piedras" width="8" height="6" patternUnits="userSpaceOnUse">
                <path d="M0 6 H8 M4 0 V3 M0 3 H8 M0 3 V6" fill="none" stroke="${c.oscuro}" stroke-width="1"/></pattern>
        </defs>
        <rect width="${ANCHO}" height="${ALTO}" fill="${c.suelo}"/>
        ${manchas(c, datos.region)}
        ${empedrado}${islas}${lago}${oasis}
        ${cielo(tipo, c, tramo, id)}
        ${paisaje(tipo, puntos, c, datos.region)}
        <path d="${camino}" fill="none" stroke="${c.borde}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${camino}" fill="none" stroke="${c.camino}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${camino}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 5" opacity=".25"/>
        ${lugares.reverse().join("")}
        ${niebla}
        <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}-borde)"/>
    </svg>`;
}

export const MEDIDAS = { ancho: ANCHO, alto: ALTO };
