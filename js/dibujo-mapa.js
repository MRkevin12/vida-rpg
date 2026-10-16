// dibujo-mapa.js — El mapa del reino, dibujado como el mapa del mundo de un juego de rol clásico (v26).
//
// Cada región se dibuja en SVG en un lienzo de 192 × 416 puntos y después pixel.js lo
// convierte en pixel art (como la Torre). De abajo hacia arriba:
//   el cielo y, a lo lejos, la Torre → el suelo de la región → el paisaje (árboles, montañas,
//   dunas, islas…) → el camino → los lugares (cofres, santuarios, guaridas, la fortaleza)
//   → la niebla sobre lo que todavía no exploras.
// La Torre está en el Valle del Comienzo, junto al punto de partida (v37); en las demás regiones
// se ve a lo lejos: más chica cuanto más lejos del valle (el camino da la vuelta y vuelve a él).
// Tu héroe y tu mascota NO van aquí: se ponen encima, como imágenes aparte, para que se muevan.
//
// Todo es grande y simple: lo que mida menos de un punto desaparece al pixelar.

import { LIENZO, LUGARES_POR_REGION, puntosDelCamino, tramoDe, CIUDADELA, TORRE_VALLE } from "./mapa.js";

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
function paisaje(tipo, puntos, c, region, evitar = () => false) {
    const azar = sorteo(1000 + region * 37);
    const cosas = [];
    for (let y = CIELO + 14; y < ALTO - 2; y += 11) {
        for (let x = 6; x < ANCHO - 4; x += 12) {
            const [px, py] = [x + (azar() - 0.5) * 8, y + (azar() - 0.5) * 6];
            if (distanciaAlCamino(px, py, puntos) < 13) continue;
            if (evitar(px, py)) continue;                  // (v85) lo que se dibuja aparte: aldeas, ríos, barcos…
            if (py < 60 && Math.abs(px - puntos[LUGARES_POR_REGION].x) < 30) continue;   // el lugar de la fortaleza
            if (tipo === "valle" && px > TORRE_VALLE.x - 18 && py > TORRE_VALLE.y - 86) continue;   // la Torre
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

// El cielo y, a lo lejos, la Torre. En el valle no: ahí está en el mapa, junto a la partida.
// Cuanto más lejos del valle, más chica (el camino es una vuelta: la Ciudadela queda cerca otra vez).
function cielo(tipo, c, tramo, id, encendida) {
    const torreLejos = tramo === 0 ? "" : (() => {
        const lejos = Math.min(tramo, 6 - tramo);          // 1 (bosque, Ciudadela) … 3 (desierto)
        const alto = 22 - lejos * 4;
        const x = 152;
        return `${encendida ? `<circle cx="${x}" cy="${CIELO - alto - 4}" r="4" fill="#ffd27a" opacity=".45"/>` : ""}
                <path d="M${x - 2.4} ${CIELO} L${x - 1.6} ${CIELO - alto} L${x} ${CIELO - alto - 4} L${x + 1.6} ${CIELO - alto} L${x + 2.4} ${CIELO} Z" fill="#2a2440"/>
                <rect x="${x - 0.5}" y="${CIELO - alto + 3}" width="1" height="1" fill="#ffd27a"/>`;
    })();
    return `<rect width="${ANCHO}" height="${CIELO + 2}" fill="url(#${id}-cielo)"/>
        ${nubesYAves(tipo)}
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

// La Torre de los Vigías, en el valle, junto a la partida (v37). Sus ventanas se encienden de
// abajo hacia arriba con los pisos que subiste (6 ventanas para los `tope` pisos: 30 desde la
// v38), y arriba arde la Llama cuando terminas la saga.
function laTorre(p, pisos, encendida, tope = 30) {
    const { x } = p;
    const y = p.y + 4;
    const luces = Math.ceil((Math.min(tope, pisos) * 6) / tope);
    let ventanas = "";
    for (let i = 0; i < 6; i++) ventanas += `<rect x="${x - 1}" y="${y - 10 - i * 9}" width="2" height="3" fill="${i < luces ? "#ffd27a" : "#2a2230"}"/>`;
    const llama = encendida ? `<circle cx="${x}" cy="${y - 84}" r="12" fill="#ffd27a" opacity=".35"/>
        <path d="M${x} ${y - 92} q4 5 0 9 q-4 -4 0 -9 Z" fill="#ffb020"/>` : "";
    return `<g class="torre-valle"><ellipse cx="${x}" cy="${y + 2}" rx="16" ry="3" fill="#000" opacity=".4"/>
        ${llama}
        <path d="M${x - 11} ${y} L${x - 8} ${y - 58} L${x + 8} ${y - 58} L${x + 11} ${y} Z" fill="#8a8698" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${x + 2} ${y - 58} L${x + 8} ${y - 58} L${x + 11} ${y} L${x + 4} ${y} Z" fill="#6a6678"/>
        <rect x="${x - 10}" y="${y - 62}" width="20" height="5" fill="#9a96a8" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${x - 8} ${y - 62} L${x} ${y - 80} L${x + 8} ${y - 62} Z" fill="#4a3a6a" stroke="${LINEA}" stroke-width="1"/>
        ${ventanas}
        <path d="M${x - 4} ${y} L${x - 4} ${y - 7} Q${x} ${y - 11} ${x + 4} ${y - 7} L${x + 4} ${y} Z" fill="#1a1222"/></g>`;
}

// El brasero de los Vigías, al final de la Ciudadela: ahí se junta el fuego de los cuatro
// memoriales. Se enciende cuando arden los cuatro.
function brasero(p, encendido) {
    const { x } = p;
    const y = p.y + 4;
    const fuego = encendido ? `<circle cx="${x}" cy="${y - 34}" r="13" fill="#ffd27a" opacity=".4"/>
        <path d="M${x - 9} ${y - 27} q2 -10 6 -14 q0 6 3 7 q1 -9 5 -13 q2 8 4 11 q1 -3 3 -5 q2 6 -2 14 Z" fill="#ff8a1f"/>
        <path d="M${x - 4} ${y - 27} q1 -6 4 -9 q2 5 4 9 Z" fill="#ffe45a"/>` : "";
    return `<g class="brasero"><ellipse cx="${x}" cy="${y + 2}" rx="14" ry="3" fill="#000" opacity=".35"/>
        <rect x="${x - 10}" y="${y - 4}" width="20" height="4" fill="#8a8698" stroke="${LINEA}" stroke-width="1"/>
        <rect x="${x - 4}" y="${y - 20}" width="8" height="16" fill="#9a96a8" stroke="${LINEA}" stroke-width="1"/>
        <path d="M${x - 13} ${y - 27} L${x + 13} ${y - 27} L${x + 8} ${y - 20} L${x - 8} ${y - 20} Z" fill="#6a6678" stroke="${LINEA}" stroke-width="1"/>
        ${fuego}</g>`;
}

// El punto de partida: una fogata.
const fogata = (p) => `<ellipse cx="${p.x}" cy="${p.y + 2}" rx="6" ry="2" fill="#000" opacity=".3"/>
    <path d="M${p.x - 5} ${p.y + 1} L${p.x + 5} ${p.y - 1} M${p.x - 5} ${p.y - 1} L${p.x + 5} ${p.y + 1}" stroke="#6a4220" stroke-width="2" stroke-linecap="round"/>
    <path d="M${p.x} ${p.y - 8} q4 4 1 8 q-1 -2 -3 -1 q-1 -4 2 -7 Z" fill="#ff8a1f"/>
    <path d="M${p.x} ${p.y - 4} q2 2 0 4 q-2 -2 0 -4 Z" fill="#ffe45a"/>`;




// ===== (v85) Más cosas en el mapa: ríos, aldeas, campamentos, barcos, señales… =====
// Cada región tiene sus propios «puntos de interés». Un repartidor los coloca lejos del camino y sin
// pisarse (siempre en los mismos sitios: no hay azar), y el paisaje de siempre se aparta de ellos.

// La x del camino a una altura y (entre dos lugares).
function xDelCamino(y, puntos) {
    for (let i = 1; i < puntos.length; i++) {
        const [a, b] = [puntos[i - 1], puntos[i]];
        if (y <= a.y && y >= b.y) return a.x + ((a.y - y) / (a.y - b.y)) * (b.x - a.x);
    }
    return puntos[0].x;
}

// Busca un sitio libre: lejos del camino y de lo que ya se puso. lado = "izq" | "der" | "ambos".
function repartidor(puntos, ocupado) {
    return function ubicar({ yMin, yMax, lado = "ambos", margen = 18, radio = 12 }) {
        const xs = lado === "izq" ? [30, 42, 54, 66, 22] : lado === "der" ? [160, 148, 136, 124, 168]
            : [30, 160, 42, 148, 54, 136, 66, 124];
        for (let y = yMin; y <= yMax; y += 7) {
            for (const x of xs) {
                if (distanciaAlCamino(x, y, puntos) < margen) continue;
                if (ocupado.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + radio)) continue;
                ocupado.push({ x, y, r: radio });
                return { x, y };
            }
        }
        return null;
    };
}

const sombra = (x, y, rx = 7) => `<ellipse cx="${x + 1}" cy="${y}" rx="${rx}" ry="1.8" fill="#000" opacity=".25"/>`;
const humo = (x, y) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".5"/><circle cx="${x + 2}" cy="${y - 4}" r="2.6" fill="#fff" opacity=".35"/><circle cx="${x}" cy="${y - 8}" r="3" fill="#fff" opacity=".22"/>`;

// --- Valle ---
const aldea = (x, y) => `${casa(x - 11, y - 4, "#8a2a22")}${casa(x + 8, y, "#3a5a8a")}${casa(x - 2, y + 8, "#8a5a22")}
    ${humo(x - 9, y - 18)}<rect x="${x - 18}" y="${y + 4}" width="1.6" height="5" fill="#6a4a2a"/><rect x="${x - 20}" y="${y + 5}" width="6" height="1.4" fill="#6a4a2a"/>`;
const molino = (x, y) => `${sombra(x, y, 8)}<path d="M${x - 6} ${y} L${x - 4} ${y - 16} L${x + 4} ${y - 16} L${x + 6} ${y} Z" fill="#d8c8a8" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${x - 6} ${y - 15} L${x} ${y - 22} L${x + 6} ${y - 15} Z" fill="#8a2a22" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <rect x="${x - 1.4}" y="${y - 5}" width="2.8" height="5" fill="#3a2418"/>
    <path d="M${x} ${y - 16} L${x - 11} ${y - 25} M${x} ${y - 16} L${x + 11} ${y - 7} M${x} ${y - 16} L${x + 11} ${y - 25} M${x} ${y - 16} L${x - 11} ${y - 7}" stroke="#5a3a20" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M${x - 11} ${y - 25} l5 1.5 l-3 3 Z M${x + 11} ${y - 7} l-5 -1.5 l3 -3 Z M${x + 11} ${y - 25} l-1.5 5 l-3 -3 Z M${x - 11} ${y - 7} l1.5 -5 l3 3 Z" fill="#eadfc4" stroke="${LINEA}" stroke-width=".6"/>`;
const campo = (x, y) => `<rect x="${x - 15}" y="${y - 8}" width="30" height="16" fill="#a8864a" stroke="${LINEA}" stroke-width="1"/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${x - 14} ${y - 6 + i * 3.4} H${x + 14}" stroke="${i % 2 ? "#d8b84a" : "#6a9a3a"}" stroke-width="2"/>`).join("")}`;
const pajar = (x, y) => `${sombra(x, y, 6)}<path d="M${x - 6} ${y} Q${x - 6} ${y - 11} ${x} ${y - 11} Q${x + 6} ${y - 11} ${x + 6} ${y} Z" fill="#d8b84a" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 3} ${y - 3} L${x + 3} ${y - 7}" stroke="#a8862a" stroke-width="1"/>`;
const granero = (x, y) => `${sombra(x, y, 11)}<rect x="${x - 10}" y="${y - 12}" width="20" height="12" fill="#a8342a" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 12} ${y - 11} L${x} ${y - 21} L${x + 12} ${y - 11} Z" fill="#6a2a22" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <rect x="${x - 4}" y="${y - 8}" width="8" height="8" fill="#e8dcc0" stroke="${LINEA}" stroke-width=".8"/>
    <path d="M${x - 4} ${y - 8} L${x + 4} ${y} M${x + 4} ${y - 8} L${x - 4} ${y}" stroke="#a8342a" stroke-width="1"/>`;
const ciervo = (x, y) => `<ellipse cx="${x}" cy="${y - 4}" rx="4.5" ry="2.6" fill="#8a5a32" stroke="${LINEA}" stroke-width=".8"/>
    <rect x="${x - 3.6}" y="${y - 3}" width="1.2" height="4" fill="#6a4222"/><rect x="${x + 2.4}" y="${y - 3}" width="1.2" height="4" fill="#6a4222"/>
    <path d="M${x + 4} ${y - 5} L${x + 6} ${y - 9}" stroke="#6a4222" stroke-width="1.6"/><circle cx="${x + 6.4}" cy="${y - 9.4}" r="1.6" fill="#8a5a32" stroke="${LINEA}" stroke-width=".6"/>
    <path d="M${x + 6} ${y - 11} l-1 -3 M${x + 7} ${y - 11} l1 -3" stroke="#d8c8a8" stroke-width=".9"/>`;
const ciervos = (x, y) => `${ciervo(x, y)}${ciervo(x + 11, y + 4)}`;
const pozo = (x, y) => `${sombra(x, y, 6)}<rect x="${x - 4.5}" y="${y - 5}" width="9" height="5" fill="#9a96a6" stroke="${LINEA}" stroke-width="1"/>
    <rect x="${x - 4.5}" y="${y - 12}" width="1.4" height="8" fill="#5a3a20"/><rect x="${x + 3.1}" y="${y - 12}" width="1.4" height="8" fill="#5a3a20"/>
    <path d="M${x - 6} ${y - 11} L${x} ${y - 16} L${x + 6} ${y - 11} Z" fill="#8a2a22" stroke="${LINEA}" stroke-width=".8"/>`;

// --- Bosque ---
const cabana = (x, y) => `${casa(x, y, "#4a3a22")}${humo(x + 4, y - 14)}<rect x="${x - 9}" y="${y - 3}" width="4" height="3" fill="#6a4a2a" stroke="${LINEA}" stroke-width=".6"/>`;
const estanque = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="7" fill="#2a5a7a" stroke="${LINEA}" stroke-width="1"/>
    <ellipse cx="${x - 3}" cy="${y - 1}" rx="3.4" ry="1.6" fill="#4a9a4a"/><ellipse cx="${x + 5}" cy="${y + 2}" rx="2.6" ry="1.2" fill="#4a9a4a"/>
    <path d="M${x - 9} ${y - 2} h5 M${x + 1} ${y + 3} h6" stroke="#8cbcec" stroke-width="1"/>
    <path d="M${x + 11} ${y - 3} v-6 M${x + 13} ${y - 2} v-7" stroke="#6a8a3a" stroke-width="1.2"/>`;
const tronco = (x, y) => `${sombra(x, y, 10)}<rect x="${x - 10}" y="${y - 5}" width="20" height="5" rx="2.4" fill="#6a4222" stroke="${LINEA}" stroke-width="1"/>
    <ellipse cx="${x - 10}" cy="${y - 2.5}" rx="1.6" ry="2.5" fill="#c8a06a"/><path d="M${x - 2} ${y - 5} q1 -3 3 -2" stroke="#3a8a3a" stroke-width="1.6" fill="none"/>`;
const ruinas = (x, y) => `${sombra(x, y, 12)}<rect x="${x - 11}" y="${y - 14}" width="5" height="14" fill="#9a96a6" stroke="${LINEA}" stroke-width="1"/>
    <rect x="${x + 6}" y="${y - 9}" width="5" height="9" fill="#8a8696" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 11} ${y - 14} Q${x - 2} ${y - 22} ${x + 4} ${y - 15}" fill="none" stroke="#9a96a6" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M${x - 11} ${y - 7} h5 M${x + 6} ${y - 4} h5" stroke="${LINEA}" stroke-width=".7"/><path d="M${x - 7} ${y - 14} q-2 4 -1 8" stroke="#3a8a3a" stroke-width="1.2" fill="none"/>`;
const arbolGigante = (x, y) => `${sombra(x, y, 14)}<path d="M${x - 5} ${y} Q${x - 3} ${y - 12} ${x - 3} ${y - 20} L${x + 3} ${y - 20} Q${x + 3} ${y - 12} ${x + 5} ${y} Z" fill="#5a3a20" stroke="${LINEA}" stroke-width="1"/>
    <circle cx="${x}" cy="${y - 28}" r="13" fill="#2a6a2a" stroke="${LINEA}" stroke-width="1"/><circle cx="${x - 9}" cy="${y - 22}" r="8" fill="#336f30" stroke="${LINEA}" stroke-width="1"/>
    <circle cx="${x + 9}" cy="${y - 22}" r="8" fill="#336f30" stroke="${LINEA}" stroke-width="1"/><circle cx="${x - 4}" cy="${y - 32}" r="4" fill="#fff" opacity=".14"/>`;
const luciernagas = (x, y) => [[-8, -4], [0, -9], [7, -2], [-3, 3], [10, -8]].map(([dx, dy]) =>
    `<circle cx="${x + dx}" cy="${y + dy}" r="3" fill="#e8f58a" opacity=".25"/><circle cx="${x + dx}" cy="${y + dy}" r="1.2" fill="#f4ffb0"/>`).join("");

// --- Montañas ---
const cascada = (x, y) => `${montana(x, y, 1.3)}<path d="M${x - 2} ${y - 24} L${x + 2} ${y - 24} L${x + 3} ${y} L${x - 3} ${y} Z" fill="#a8d8f0" opacity=".9"/>
    <path d="M${x} ${y - 22} v20" stroke="#fff" stroke-width="1" opacity=".7"/><ellipse cx="${x}" cy="${y + 1}" rx="9" ry="2.6" fill="#7ab8e0" stroke="${LINEA}" stroke-width=".8"/>`;
const atalaya = (x, y) => `${sombra(x, y, 7)}<rect x="${x - 5}" y="${y - 18}" width="10" height="18" fill="#8a8698" stroke="${LINEA}" stroke-width="1"/>
    <rect x="${x - 7}" y="${y - 22}" width="14" height="5" fill="#6a6678" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 7} ${y - 22} h2.4 v-2.6 h-2.4 Z M${x - 1.2} ${y - 22} h2.4 v-2.6 h-2.4 Z M${x + 4.6} ${y - 22} h2.4 v-2.6 h-2.4 Z" fill="#6a6678" stroke="${LINEA}" stroke-width=".6"/>
    <rect x="${x - 1}" y="${y - 12}" width="2" height="3" fill="#ffd27a"/>${estandarte(x + 7, y - 20, "#c8a040")}`;
const tienda = (x, y, color = "#c8a040") => `${sombra(x, y, 9)}<path d="M${x - 9} ${y} L${x} ${y - 14} L${x + 9} ${y} Z" fill="${color}" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${x} ${y - 14} L${x + 9} ${y} L${x + 2} ${y} Z" fill="#000" opacity=".18"/><path d="M${x - 2.4} ${y} L${x} ${y - 6} L${x + 2.4} ${y} Z" fill="#2a1a10"/>
    <rect x="${x - 0.5}" y="${y - 18}" width="1" height="5" fill="#3a3040"/>`;
const campamento = (x, y, c1 = "#c8a040", c2 = "#a8452e") => `${tienda(x - 9, y, c1)}${tienda(x + 8, y + 3, c2)}${fogata({ x: x - 1, y: y + 11 })}`;
const hito = (x, y) => `${sombra(x, y, 5)}<ellipse cx="${x}" cy="${y - 1.4}" rx="5" ry="2" fill="#8a8a90" stroke="${LINEA}" stroke-width=".8"/>
    <ellipse cx="${x}" cy="${y - 4.6}" rx="3.6" ry="1.7" fill="#9a9aa0" stroke="${LINEA}" stroke-width=".8"/><ellipse cx="${x}" cy="${y - 7.4}" rx="2.2" ry="1.4" fill="#aaaab0" stroke="${LINEA}" stroke-width=".8"/>`;
const lagoHelado = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="7" fill="#bfe0f2" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 8} ${y - 1} l6 2 M${x + 2} ${y - 3} l5 3 M${x - 3} ${y + 3} l7 -1" stroke="#fff" stroke-width="1" opacity=".8"/>`;

// --- Desierto ---
const obelisco = (x, y) => `${sombra(x, y, 7)}<rect x="${x - 6}" y="${y - 3}" width="12" height="3" fill="#b89a68" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 3.4} ${y - 3} L${x - 2.4} ${y - 22} L${x} ${y - 26} L${x + 2.4} ${y - 22} L${x + 3.4} ${y - 3} Z" fill="#d8b878" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 1} ${y - 18} h2 M${x - 1} ${y - 13} h2 M${x - 1} ${y - 8} h2" stroke="#8a6a3a" stroke-width="1"/>`;
const columnas = (x, y) => `${sombra(x, y, 11)}<rect x="${x - 11}" y="${y - 13}" width="4.4" height="13" fill="#d8b878" stroke="${LINEA}" stroke-width="1"/>
    <rect x="${x - 2}" y="${y - 8}" width="4.4" height="8" fill="#c8a868" stroke="${LINEA}" stroke-width="1"/>
    <rect x="${x + 6}" y="${y - 11}" width="4.4" height="11" fill="#d8b878" stroke="${LINEA}" stroke-width="1"/><path d="M${x - 12} ${y - 13} h6.4 M${x + 5} ${y - 11} h6.4" stroke="${LINEA}" stroke-width="1.4"/>`;
const costillas = (x, y) => `<path d="M${x - 14} ${y} Q${x} ${y - 5} ${x + 14} ${y}" fill="none" stroke="#efe6c8" stroke-width="1.6"/>
    ${[-9, -4, 1, 6, 11].map((d) => `<path d="M${x + d} ${y - 2 + (Math.abs(d) > 8 ? 1 : 0)} q-1 -9 -5 -10" fill="none" stroke="#efe6c8" stroke-width="1.5" stroke-linecap="round"/>`).join("")}
    <circle cx="${x + 17}" cy="${y - 2}" r="3" fill="#efe6c8" stroke="${LINEA}" stroke-width=".8"/><rect x="${x + 16}" y="${y - 3}" width="1" height="1" fill="${LINEA}"/>`;
const camello = (x, y) => `<ellipse cx="${x}" cy="${y - 6}" rx="6" ry="3.4" fill="#c8a060" stroke="${LINEA}" stroke-width=".8"/>
    <circle cx="${x - 2}" cy="${y - 10}" r="2.6" fill="#c8a060" stroke="${LINEA}" stroke-width=".8"/><circle cx="${x + 2.4}" cy="${y - 10}" r="2.6" fill="#c8a060" stroke="${LINEA}" stroke-width=".8"/>
    <path d="M${x + 5} ${y - 7} Q${x + 8} ${y - 12} ${x + 10} ${y - 13}" stroke="#c8a060" stroke-width="2" fill="none"/><circle cx="${x + 11}" cy="${y - 13}" r="1.8" fill="#c8a060" stroke="${LINEA}" stroke-width=".7"/>
    <path d="M${x - 4} ${y - 4} v5 M${x - 1} ${y - 3} v4 M${x + 2} ${y - 3} v4 M${x + 4.6} ${y - 4} v5" stroke="#8a6a3a" stroke-width="1.3"/>`;
const caravana = (x, y) => `${camello(x - 10, y)}${camello(x + 6, y + 4)}`;
const remolinoArena = (x, y) => `<path d="M${x - 10} ${y} q10 -4 20 0 M${x - 8} ${y - 5} q8 -3 16 0 M${x - 6} ${y - 10} q6 -3 12 0" fill="none" stroke="#f4dca0" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;

// --- Mar ---
const faro = (x, y) => `<ellipse cx="${x}" cy="${y + 2}" rx="15" ry="6" fill="#dcc47e" stroke="${LINEA}" stroke-width="1"/><ellipse cx="${x}" cy="${y + 1}" rx="10" ry="3.6" fill="#5a9a48"/>
    <path d="M${x - 4} ${y} L${x - 3} ${y - 22} L${x + 3} ${y - 22} L${x + 4} ${y} Z" fill="#eef2ff" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 3.6} ${y - 7} h7.2 M${x - 3.2} ${y - 14} h6.4" stroke="#c8323a" stroke-width="2.6"/>
    <rect x="${x - 3.6}" y="${y - 27}" width="7.2" height="5" fill="#ffd27a" stroke="${LINEA}" stroke-width="1"/><path d="M${x - 5} ${y - 27} L${x} ${y - 32} L${x + 5} ${y - 27} Z" fill="#8a2a22" stroke="${LINEA}" stroke-width="1"/>
    <circle cx="${x}" cy="${y - 24.5}" r="9" fill="#ffd27a" opacity=".28"/>`;
const barco = (x, y, vela = "#eef2ff") => `${ola(x, y + 1, "#8cbcec")}<path d="M${x - 10} ${y - 3} L${x + 10} ${y - 3} L${x + 6} ${y + 2} L${x - 6} ${y + 2} Z" fill="#8a5a32" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <rect x="${x - 0.6}" y="${y - 17}" width="1.4" height="14" fill="#5a3a20"/><path d="M${x + 1} ${y - 16} Q${x + 9} ${y - 10} ${x + 8} ${y - 4} L${x + 1} ${y - 4} Z" fill="${vela}" stroke="${LINEA}" stroke-width=".8"/>
    <path d="M${x - 1} ${y - 15} Q${x - 7} ${y - 10} ${x - 6} ${y - 5} L${x - 1} ${y - 5} Z" fill="${vela}" stroke="${LINEA}" stroke-width=".8" opacity=".92"/>`;
const aleta = (x, y) => `<path d="M${x - 7} ${y} L${x} ${y - 11} L${x + 6} ${y} Z" fill="#4a5a78" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${x - 11} ${y + 1} q5 -3 10 0 t10 0 t8 0" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
const arrecife = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="6" fill="#3a8ac0" opacity=".7"/>
    <path d="M${x - 8} ${y + 1} v-5 M${x - 8} ${y - 2} l-2 -2 M${x - 8} ${y - 3} l2 -2 M${x} ${y + 2} v-7 M${x} ${y - 3} l-2 -2 M${x} ${y - 4} l2 -2 M${x + 8} ${y + 1} v-4 M${x + 8} ${y - 1} l2 -2"
          stroke="#e8645a" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="${x - 4}" cy="${y + 3}" r="1.6" fill="#f4a8c0"/><circle cx="${x + 5}" cy="${y + 3}" r="1.4" fill="#f4d87a"/>`;
const remolino = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="6" fill="none" stroke="#8cbcec" stroke-width="1.4"/><ellipse cx="${x}" cy="${y}" rx="8" ry="3.6" fill="none" stroke="#bcdcf4" stroke-width="1.4"/>
    <ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.6" fill="#0f2f58"/>`;
const gaviotas = (x, y) => `<path d="M${x - 8} ${y} q3 -4 6 0 q3 -4 6 0 M${x + 6} ${y - 7} q2.4 -3 5 0 q2.4 -3 5 0" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`;

// --- Ciudadela ---
const puesto = (x, y, color) => `${sombra(x, y, 7)}<rect x="${x - 6}" y="${y - 6}" width="12" height="6" fill="#8a6a4a" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 8} ${y - 6} L${x - 6} ${y - 13} H${x + 6} L${x + 8} ${y - 6} Z" fill="${color}" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${x - 4} ${y - 6.4} v-6 M${x} ${y - 6.4} v-6 M${x + 4} ${y - 6.4} v-6" stroke="#fff" stroke-width="1.2" opacity=".55"/>
    <circle cx="${x - 3}" cy="${y - 3}" r="1.4" fill="#d83a3a"/><circle cx="${x + 1}" cy="${y - 3}" r="1.4" fill="#e8c83a"/><circle cx="${x + 4}" cy="${y - 3}" r="1.4" fill="#4aa84a"/>`;
const mercado = (x, y) => `${puesto(x - 9, y, "#a8342a")}${puesto(x + 9, y + 4, "#3a5a9a")}`;
const fuente = (x, y) => `${sombra(x, y, 11)}<ellipse cx="${x}" cy="${y - 2}" rx="11" ry="5" fill="#a8a4b4" stroke="${LINEA}" stroke-width="1"/>
    <ellipse cx="${x}" cy="${y - 3}" rx="8.4" ry="3.6" fill="#4a8ac0"/><rect x="${x - 1.4}" y="${y - 13}" width="2.8" height="10" fill="#c8c4d4" stroke="${LINEA}" stroke-width=".8"/>
    <path d="M${x} ${y - 13} q-5 1 -6 6 M${x} ${y - 13} q5 1 6 6" fill="none" stroke="#bcdcf4" stroke-width="1.2"/>`;
const estatua = (x, y) => `${sombra(x, y, 7)}<rect x="${x - 5}" y="${y - 6}" width="10" height="6" fill="#9a96a6" stroke="${LINEA}" stroke-width="1"/>
    <rect x="${x - 2.4}" y="${y - 17}" width="4.8" height="11" fill="#c8c4d4" stroke="${LINEA}" stroke-width="1"/><circle cx="${x}" cy="${y - 20}" r="3" fill="#c8c4d4" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x + 2.4} ${y - 15} L${x + 8} ${y - 24}" stroke="#c8c4d4" stroke-width="1.6"/><path d="M${x + 8} ${y - 24} l-1.4 -3 l3 1 Z" fill="#c8a040"/>`;
const barracon = (x, y) => `${sombra(x, y, 14)}<rect x="${x - 13}" y="${y - 12}" width="26" height="12" fill="#8a8698" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 15} ${y - 12} L${x - 10} ${y - 18} H${x + 10} L${x + 15} ${y - 12} Z" fill="#4a3a6a" stroke="${LINEA}" stroke-width="1" stroke-linejoin="round"/>
    <rect x="${x - 8}" y="${y - 8}" width="3" height="3.4" fill="#ffd27a"/><rect x="${x + 5}" y="${y - 8}" width="3" height="3.4" fill="#ffd27a"/>
    <path d="M${x - 3} ${y} v-6 q3 -4 6 0 v6 Z" fill="#1a1222"/>${estandarte(x + 13, y - 12, "#7a2a8a")}`;
const antorcha = (x, y) => `<rect x="${x - 0.8}" y="${y - 9}" width="1.6" height="9" fill="#5a3a20"/><circle cx="${x}" cy="${y - 12}" r="4.4" fill="#ffd27a" opacity=".35"/>
    <path d="M${x} ${y - 16} q2.4 2.6 0 5 q-2.4 -2.4 0 -5 Z" fill="#ff9a1f"/>`;

// --- En todas las regiones ---
const poste = (x, y, lado) => `${sombra(x, y, 4)}<rect x="${x - 0.8}" y="${y - 12}" width="1.8" height="12" fill="#6a4222"/>
    <path d="M${x + 0.6} ${y - 11} h${6 * lado} l${2 * lado} 2 l${-2 * lado} 2 h${-6 * lado} Z" fill="#c8a06a" stroke="${LINEA}" stroke-width=".7"/>
    <path d="M${x - 0.6} ${y - 6} h${-5 * lado} l${-2 * lado} 2 l${2 * lado} 2 h${5 * lado} Z" fill="#b8905a" stroke="${LINEA}" stroke-width=".7"/>`;
const brujula = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#1a1222" opacity=".55" stroke="#e8d8a0" stroke-width="1"/>
    <path d="M${x} ${y - 8} L${x + 2.4} ${y} L${x} ${y + 8} L${x - 2.4} ${y} Z" fill="#e8d8a0"/><path d="M${x - 8} ${y} L${x} ${y - 2.4} L${x + 8} ${y} L${x} ${y + 2.4} Z" fill="#b8a870"/>
    <path d="M${x} ${y - 8} L${x + 2.4} ${y} L${x - 2.4} ${y} Z" fill="#c8323a"/>`;
const muelle = (x, y) => `<rect x="${x - 12}" y="${y - 1}" width="12" height="5" fill="#8a6440" stroke="${LINEA}" stroke-width="1"/>
    <path d="M${x - 9} ${y - 1} v5 M${x - 5} ${y - 1} v5 M${x - 1} ${y - 1} v5" stroke="#5a3a20" stroke-width="1"/><rect x="${x - 12}" y="${y + 4}" width="1.6" height="4" fill="#5a3a20"/><rect x="${x - 2}" y="${y + 4}" width="1.6" height="4" fill="#5a3a20"/>`;

function nubesYAves(tipo) {
    const nube = (x, y, k = 1) => `<ellipse cx="${x}" cy="${y}" rx="${9 * k}" ry="${2.6 * k}" fill="#fff" opacity=".55"/><ellipse cx="${x + 4 * k}" cy="${y - 2 * k}" rx="${5 * k}" ry="${2.4 * k}" fill="#fff" opacity=".55"/>`;
    const nubes = tipo === "desierto" ? nube(30, 7, 0.8) : tipo === "ciudadela" ? "" : `${nube(26, 7)}${nube(104, 5, 0.8)}${nube(168, 9, 0.7)}`;
    const ave = (x, y) => `<path d="M${x - 4} ${y} q2 -3 4 0 q2 -3 4 0" fill="none" stroke="${tipo === "ciudadela" ? "#1a1222" : "#3a3446"}" stroke-width="1.1" stroke-linecap="round"/>`;
    const luna = tipo === "ciudadela" ? `<circle cx="30" cy="9" r="5" fill="#f4ecc8"/><circle cx="32" cy="8" r="4.4" fill="#4a3a7a"/>` : "";
    return `${nubes}${luna}${ave(64, 12)}${ave(76, 8)}${tipo === "mar" ? ave(130, 11) : ""}`;
}

// Qué lleva cada región: dónde buscar sitio y cómo dibujarlo.
const INTERES = {
    valle: [
        { y: [330, 392], lado: "izq", margen: 22, radio: 24, dibujo: aldea },
        { y: [236, 292], lado: "izq", margen: 20, radio: 16, dibujo: molino },
        { y: [280, 332], lado: "der", margen: 22, radio: 20, dibujo: campo },
        { y: [236, 300], lado: "der", margen: 16, radio: 10, dibujo: pajar },
        { y: [168, 232], lado: "der", margen: 22, radio: 18, dibujo: granero },
        { y: [96, 160], lado: "izq", margen: 18, radio: 16, dibujo: (x, y) => ciervo(x, y) + ciervo(x + 11, y + 4) },
        { y: [56, 130], lado: "der", margen: 16, radio: 8, dibujo: pozo },
    ],
    bosque: [
        { y: [296, 384], lado: "der", margen: 22, radio: 16, dibujo: cabana },
        { y: [226, 292], lado: "izq", margen: 20, radio: 18, dibujo: estanque },
        { y: [320, 392], lado: "izq", margen: 16, radio: 12, dibujo: tronco },
        { y: [120, 200], lado: "der", margen: 20, radio: 16, dibujo: ruinas },
        { y: [60, 140], lado: "izq", margen: 24, radio: 18, dibujo: arbolGigante },
        { y: [150, 270], lado: "izq", margen: 12, radio: 14, dibujo: luciernagas },
        { y: [100, 180], lado: "der", margen: 12, radio: 14, dibujo: luciernagas },
    ],
    montanas: [
        { y: [200, 310], lado: "izq", margen: 22, radio: 20, dibujo: cascada },
        { y: [250, 340], lado: "der", margen: 20, radio: 14, dibujo: atalaya },
        { y: [330, 394], lado: "izq", margen: 22, radio: 22, dibujo: (x, y) => campamento(x, y, "#c8a040", "#8a3a2e") },
        { y: [150, 230], lado: "der", margen: 14, radio: 8, dibujo: hito },
        { y: [60, 130], lado: "izq", margen: 20, radio: 18, dibujo: lagoHelado },
        { y: [40, 110], lado: "der", margen: 18, radio: 12, dibujo: atalaya },
    ],
    desierto: [
        { y: [320, 394], lado: "izq", margen: 22, radio: 24, dibujo: campamento },
        { y: [236, 312], lado: "der", margen: 20, radio: 12, dibujo: obelisco },
        { y: [136, 224], lado: "izq", margen: 20, radio: 16, dibujo: columnas },
        { y: [56, 134], lado: "der", margen: 22, radio: 20, dibujo: costillas },
        { y: [160, 250], lado: "der", margen: 18, radio: 20, dibujo: caravana },
        { y: [300, 380], lado: "der", margen: 14, radio: 14, dibujo: remolinoArena },
        { y: [60, 140], lado: "izq", margen: 14, radio: 14, dibujo: remolinoArena },
    ],
    mar: [
        { y: [246, 340], lado: "izq", margen: 26, radio: 20, dibujo: faro },
        { y: [320, 394], lado: "der", margen: 24, radio: 14, dibujo: (x, y) => barco(x, y) },
        { y: [140, 214], lado: "izq", margen: 24, radio: 14, dibujo: (x, y) => barco(x, y, "#f4d87a") },
        { y: [196, 262], lado: "der", margen: 24, radio: 14, dibujo: aleta },
        { y: [96, 170], lado: "der", margen: 24, radio: 16, dibujo: arrecife },
        { y: [56, 120], lado: "izq", margen: 24, radio: 16, dibujo: remolino },
        { y: [290, 360], lado: "izq", margen: 20, radio: 10, dibujo: gaviotas },
    ],
    ciudadela: [
        { y: [320, 392], lado: "izq", margen: 22, radio: 24, dibujo: mercado },
        { y: [236, 300], lado: "der", margen: 20, radio: 14, dibujo: fuente },
        { y: [156, 226], lado: "izq", margen: 18, radio: 12, dibujo: estatua },
        { y: [56, 132], lado: "der", margen: 24, radio: 18, dibujo: barracon },
        { y: [56, 132], lado: "izq", margen: 24, radio: 18, dibujo: barracon },
    ],
};

// Un río (o barranco o canal) que cruza el mapa de lado a lado con un puente donde lo cruza el camino.
// y = por dónde pasa, entre dos lugares, para que no tape ninguno.
const CRUCES = {
    valle:     { y: 347.4, ancho: 8, agua: "#3a78b8", orilla: "#2a4a6a", puente: "madera" },
    bosque:    { y: 208.4, ancho: 6, agua: "#3a6a8a", orilla: "#1f3a2a", puente: "madera" },
    montanas:  { y: 138.9, ancho: 8, agua: "#1c1626", orilla: "#4a4038", puente: "cuerda" },
    ciudadela: { y: 277.9, ancho: 6, agua: "#3a5a8a", orilla: "#55535e", puente: "piedra" },
};

function rioDe(cruce) {
    const y = cruce.y;
    const d = `M-4 ${y} Q12 ${y - 5} 28 ${y} T60 ${y} T96 ${y} T130 ${y} T164 ${y} T196 ${y}`;
    return `<path d="${d}" fill="none" stroke="${cruce.orilla}" stroke-width="${cruce.ancho + 3}" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${cruce.agua}" stroke-width="${cruce.ancho}" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3 9" opacity=".35"/>`;
}

function puenteDe(cruce, puntos) {
    const x = Math.round(xDelCamino(cruce.y, puntos));
    const y = cruce.y;
    const h = cruce.ancho + 6;
    const tablones = Array.from({ length: Math.floor(h / 2.4) }, (_, i) => `<path d="M${x - 6} ${y - h / 2 + 1.2 + i * 2.4} h12" stroke="${LINEA}" stroke-width=".6" opacity=".6"/>`).join("");
    if (cruce.puente === "piedra") {
        return `<rect x="${x - 7}" y="${y - h / 2}" width="14" height="${h}" fill="#a8a4b4" stroke="${LINEA}" stroke-width="1"/>${tablones}
            <rect x="${x - 7}" y="${y - h / 2}" width="2" height="${h}" fill="#8a8696"/><rect x="${x + 5}" y="${y - h / 2}" width="2" height="${h}" fill="#8a8696"/>`;
    }
    const bordes = cruce.puente === "cuerda"
        ? `<path d="M${x - 7} ${y - h / 2} v${h} M${x + 7} ${y - h / 2} v${h}" stroke="#d8c8a0" stroke-width="1.2"/>`
        : `<rect x="${x - 7}" y="${y - h / 2}" width="1.4" height="${h}" fill="#5a3a20"/><rect x="${x + 5.6}" y="${y - h / 2}" width="1.4" height="${h}" fill="#5a3a20"/>`;
    return `<rect x="${x - 6}" y="${y - h / 2}" width="12" height="${h}" fill="#a8774a" stroke="${LINEA}" stroke-width="1"/>${tablones}${bordes}`;
}

// Todo lo nuevo de una región: { antes (va bajo el camino), despues (va sobre él), evitar (para que el paisaje se aparte) }.
function interesesDeRegion(tipo, puntos) {
    const ocupado = [];
    const cruce = CRUCES[tipo];
    const franja = cruce ? [cruce.y - cruce.ancho / 2 - 7, cruce.y + cruce.ancho / 2 + 7] : null;
    if (tipo === "valle") ocupado.push({ x: TORRE_VALLE.x, y: TORRE_VALLE.y - 40, r: 34 }, { x: 22, y: 210, r: 18 });   // la Torre y el lago
    ocupado.push({ x: puntos[LUGARES_POR_REGION].x, y: puntos[LUGARES_POR_REGION].y, r: 38 });                     // la fortaleza
    if (tipo === "mar") ocupado.push({ x: 26, y: 300, r: 14 }, { x: 168, y: 170, r: 12 });                          // las islas de siempre
    if (tipo === "desierto") ocupado.push({ x: 170, y: 260, r: 18 });                                               // el oasis
    ocupado.push({ x: 20, y: 44, r: 12 });                                                                          // la brújula
    const ubicar = repartidor(puntos, ocupado);
    const piezas = [];
    for (const it of INTERES[tipo] || []) {
        const sitio = ubicar({ yMin: it.y[0], yMax: it.y[1], lado: it.lado, margen: it.margen, radio: it.radio });
        if (sitio) piezas.push({ y: sitio.y, svg: it.dibujo(sitio.x, sitio.y) });
    }
    // Las señales del camino (en lugares sin nada especial) y, en la Ciudadela, antorchas.
    const lados = [1, -1, 1, -1];
    [3, 9, 14, 19].forEach((n, i) => {
        const p = puntos[n];
        piezas.push({ y: p.y, svg: poste(p.x + 10 * lados[i], p.y + 3, lados[i]) });
    });
    if (tipo === "ciudadela") {
        for (const n of [2, 4, 6, 8, 11, 13, 16, 18, 21, 23]) {
            const p = puntos[n];
            piezas.push({ y: p.y, svg: antorcha(p.x - 9, p.y + 2) + antorcha(p.x + 9, p.y + 2) });
        }
    }
    if (tipo === "mar") piezas.push({ y: puntos[0].y, svg: muelle(puntos[0].x - 6, puntos[0].y + 4) });
    piezas.sort((a, b) => a.y - b.y);
    return {
        antes: cruce ? rioDe(cruce) : "",
        despues: `${cruce ? puenteDe(cruce, puntos) : ""}${piezas.map((q) => q.svg).join("")}${brujula(20, 44)}`,
        evitar: (x, y) => ocupado.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + 3) || Boolean(franja && y > franja[0] && y < franja[1]),
    };
}

// ===== El mapa entero =====
// datos = { region (número global), alcanzado (lugares alcanzados en esta región: 0…25),
//           lugares: { n: { tipo, reclamado, libre } } para los lugares especiales,
//           regionLibre (los 4 señores cayeron) }
export function dibujarMapa(datos) {
    const tramo = tramoDe(datos.region);
    const torre = datos.torre || { pisos: 0, encendida: false };
    const tipo = ["valle", "bosque", "montanas", "desierto", "mar", "ciudadela"][tramo];
    const c = PALETAS[tipo];
    const puntos = puntosDelCamino();
    const id = `mapa${datos.region}`;
    const camino = caminoSuave(puntos);
    const intereses = interesesDeRegion(tipo, puntos);

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
            case "fortaleza": return tramo === CIUDADELA ? brasero(p, datos.regionLibre) : fortaleza(p, datos.regionLibre && alcanzado);
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
        ${empedrado}${islas}${lago}${oasis}${intereses.antes}
        ${cielo(tipo, c, tramo, id, torre.encendida)}
        ${paisaje(tipo, puntos, c, datos.region, intereses.evitar)}
        ${tramo === 0 ? laTorre(TORRE_VALLE, torre.pisos, torre.encendida, torre.tope) : ""}
        <path d="${camino}" fill="none" stroke="${c.borde}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${camino}" fill="none" stroke="${c.camino}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${camino}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 5" opacity=".25"/>
        ${intereses.despues}
        ${lugares.reverse().join("")}
        ${niebla}
        <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}-borde)"/>
    </svg>`;
}

export const MEDIDAS = { ancho: ANCHO, alto: ALTO };
