// dibujo-carrera.js — El mapa de tu carrera en pixel art (v118, mejorado en la v119).
//
// Es un mapa PROPIO: no usa internet ni mapas de nadie. Con los puntos del GPS dibuja el camino que corres y, alrededor,
// un paisaje inventado que cambia por zonas cada 3 km (pradera, bosque, pantano, desierto, nieve y tierras del abismo; ver
// encuentros.ZONAS), con ríos, lagos, árboles y rocas. El paisaje sale de un «azar fijo» por casilla: el mismo lugar se
// dibuja siempre igual, así nada «baila» cuando el mapa se vuelve a dibujar.
// Devuelve texto SVG (como los demás dibujos). shape-rendering="crispEdges" deja los bordes en cuadritos.

import { ZONAS, KM_POR_ZONA, zonaDelKm } from "./encuentros.js";

export const LIENZO = { ancho: 320, alto: 240, margen: 30, minMetros: 160 };
const CASILLA = 16;   // el suelo se pinta en cuadros de 16 × 16

// Un número entre 0 y 1 que siempre sale igual para la misma casilla.
const azar = (i, j, k = 0) => {
    const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
    return x - Math.floor(x);
};
const r1 = (n) => n.toFixed(1);

// lat/lon -> puntos del lienzo. Se ajusta para que quepa todo el recorrido (al menos LIENZO.minMetros de lado).
function proyectar(traza) {
    const lat0 = traza.reduce((s, p) => s + p[0], 0) / traza.length;
    const k = Math.cos((lat0 * Math.PI) / 180) * 111320;
    const xs = traza.map((p) => p[1] * k);
    const ys = traza.map((p) => -p[0] * 110540);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const ancho = Math.max(x1 - x0, LIENZO.minMetros);
    const alto = Math.max(y1 - y0, LIENZO.minMetros * 0.75);
    const escala = Math.min((LIENZO.ancho - LIENZO.margen * 2) / ancho, (LIENZO.alto - LIENZO.margen * 2) / alto);
    return (p) => [LIENZO.ancho / 2 + (p[1] * k - cx) * escala, LIENZO.alto / 2 + (-p[0] * 110540 - cy) * escala];
}

// ===== Las piezas del paisaje (cada una mide unos 10 × 12 puntos) =====
const PIEZAS = {
    pradera: (x, y, r) => r < 0.5
        ? `<rect x="${r1(x - 1)}" y="${r1(y + 3)}" width="2" height="4" fill="#5a3a1e"/><rect x="${r1(x - 5)}" y="${r1(y - 3)}" width="10" height="6" fill="#2f7a3a"/>
           <rect x="${r1(x - 3)}" y="${r1(y - 6)}" width="6" height="3" fill="#3f9a4a"/><rect x="${r1(x - 2)}" y="${r1(y - 2)}" width="2" height="2" fill="#58b862"/>`
        : `<rect x="${r1(x)}" y="${r1(y)}" width="2" height="2" fill="#f4d35e"/><rect x="${r1(x + 4)}" y="${r1(y + 2)}" width="2" height="2" fill="#f28ab2"/>
           <rect x="${r1(x - 3)}" y="${r1(y + 3)}" width="2" height="2" fill="#eef2ff"/>`,
    bosque: (x, y) => `<rect x="${r1(x - 1)}" y="${r1(y + 4)}" width="2" height="3" fill="#3a2614"/>
           <rect x="${r1(x - 5)}" y="${r1(y)}" width="10" height="4" fill="#174a26"/><rect x="${r1(x - 4)}" y="${r1(y - 4)}" width="8" height="4" fill="#1f5a2e"/>
           <rect x="${r1(x - 2)}" y="${r1(y - 8)}" width="4" height="4" fill="#2a6e3a"/>`,
    pantano: (x, y, r) => r < 0.5
        ? `<rect x="${r1(x - 6)}" y="${r1(y)}" width="12" height="4" fill="#2c4a52"/><rect x="${r1(x - 4)}" y="${r1(y + 1)}" width="5" height="1" fill="#5a8a96"/>`
        : `<rect x="${r1(x - 2)}" y="${r1(y - 6)}" width="1" height="8" fill="#6a8a3a"/><rect x="${r1(x + 1)}" y="${r1(y - 4)}" width="1" height="6" fill="#7a9a4a"/>
           <rect x="${r1(x - 2)}" y="${r1(y - 7)}" width="1" height="2" fill="#5a3a1e"/>`,
    desierto: (x, y, r) => r < 0.45
        ? `<rect x="${r1(x - 1)}" y="${r1(y - 7)}" width="3" height="11" fill="#3a8a4a"/><rect x="${r1(x - 4)}" y="${r1(y - 3)}" width="2" height="4" fill="#3a8a4a"/>
           <rect x="${r1(x - 4)}" y="${r1(y - 1)}" width="3" height="2" fill="#3a8a4a"/><rect x="${r1(x + 3)}" y="${r1(y - 5)}" width="2" height="4" fill="#3a8a4a"/>`
        : `<rect x="${r1(x - 4)}" y="${r1(y)}" width="8" height="4" fill="#8a7050"/><rect x="${r1(x - 2)}" y="${r1(y - 2)}" width="4" height="2" fill="#a08460"/>`,
    nieve: (x, y) => `<rect x="${r1(x - 1)}" y="${r1(y + 4)}" width="2" height="3" fill="#3a2614"/>
           <rect x="${r1(x - 5)}" y="${r1(y)}" width="10" height="4" fill="#1f4a3a"/><rect x="${r1(x - 3)}" y="${r1(y - 4)}" width="6" height="4" fill="#285a46"/>
           <rect x="${r1(x - 1)}" y="${r1(y - 7)}" width="2" height="3" fill="#2e6a52"/><rect x="${r1(x - 3)}" y="${r1(y - 4)}" width="6" height="1" fill="#eef3fa"/>
           <rect x="${r1(x - 5)}" y="${r1(y)}" width="10" height="1" fill="#eef3fa"/>`,
    volcan: (x, y, r) => r < 0.5
        ? `<rect x="${r1(x - 4)}" y="${r1(y - 2)}" width="8" height="6" fill="#241a1e"/><rect x="${r1(x - 2)}" y="${r1(y - 4)}" width="4" height="2" fill="#2e2226"/>`
        : `<rect x="${r1(x - 5)}" y="${r1(y)}" width="10" height="1" fill="#ff7a2a"/><rect x="${r1(x - 2)}" y="${r1(y - 1)}" width="4" height="1" fill="#ffb020"/>`,
};

// Agua según la zona: lago normal, lago helado, charco de lava o un oasis.
function lago(x, y, zona, tam) {
    const colores = { nieve: ["#a8d4f0", "#dff1ff"], volcan: ["#d84a1a", "#ffb020"], pantano: ["#2c4a52", "#5a8a96"] }[zona] || ["#2f6fb8", "#7ab8ee"];
    const w = 18 * tam;
    const h = 10 * tam;
    const palmera = zona === "desierto"
        ? `<rect x="${r1(x + w / 2 - 2)}" y="${r1(y - 12)}" width="2" height="12" fill="#7a5a2a"/><rect x="${r1(x + w / 2 - 7)}" y="${r1(y - 14)}" width="12" height="3" fill="#3a8a4a"/>` : "";
    return `<rect x="${r1(x - w / 2)}" y="${r1(y - h / 2 + 2)}" width="${r1(w)}" height="${r1(h - 4)}" fill="${colores[0]}"/>
        <rect x="${r1(x - w / 2 + 3)}" y="${r1(y - h / 2)}" width="${r1(w - 6)}" height="${r1(h)}" fill="${colores[0]}"/>
        <rect x="${r1(x - w / 4)}" y="${r1(y - 1)}" width="${r1(w / 3)}" height="1.5" fill="${colores[1]}"/>${palmera}`;
}

// ===== El mapa =====
// opciones = { traza: [[lat, lon]…], banderas: [[lat, lon]…] (una por km), encuentros: [{ km, resultado, jefe }…], km: lo corrido }
// Devuelve { svg, aqui: { x, y } en % (dónde va tu héroe) o null, zona (la del final del recorrido) }.
export function mapaDeCarrera({ traza = [], banderas = [], encuentros = [], km = 0 } = {}) {
    const lista = (traza || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]));
    const { ancho, alto } = LIENZO;
    const zonaFinal = zonaDelKm(Math.floor(km) + 1);
    if (!lista.length) {
        return {
            svg: `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" role="img" aria-label="Mapa de tu carrera">
                <rect width="${ancho}" height="${alto}" fill="${zonaFinal.suelo[0]}"/>
                <text x="160" y="124" text-anchor="middle" fill="#eef2ff" font-size="13">Buscando señal del GPS…</text></svg>`,
            aqui: null, zona: zonaFinal,
        };
    }
    const aPantalla = proyectar(lista);
    const puntos = lista.map(aPantalla);
    // Cada punto del camino sabe en qué km va (aproximado: por su lugar en la lista).
    const kmDelPunto = (i) => (puntos.length > 1 ? (i / (puntos.length - 1)) * km : 0);
    const muestra = Math.max(1, Math.ceil(puntos.length / 90));   // para no medir contra todos los puntos

    // ¿Qué zona tiene una casilla? La del punto del camino más cercano. Y qué tan lejos queda del camino.
    const cerca = (x, y) => {
        let mejor = Infinity;
        let indice = 0;
        for (let i = 0; i < puntos.length; i += muestra) {
            const d = (puntos[i][0] - x) ** 2 + (puntos[i][1] - y) ** 2;
            if (d < mejor) { mejor = d; indice = i; }
        }
        const ultimo = puntos.length - 1;
        const dUltimo = (puntos[ultimo][0] - x) ** 2 + (puntos[ultimo][1] - y) ** 2;
        if (dUltimo < mejor) { mejor = dUltimo; indice = ultimo; }
        return { zona: zonaDelKm(Math.floor(kmDelPunto(indice)) + 1), distancia: Math.sqrt(mejor) };
    };

    // 1) El suelo, casilla por casilla, con el color de su zona (en cuadros, como un tablero).
    const suelo = [];
    const decorado = [];
    const agua = [];
    const columnas = Math.ceil(ancho / CASILLA);
    const filas = Math.ceil(alto / CASILLA);
    for (let j = 0; j < filas; j++) {
        for (let i = 0; i < columnas; i++) {
            const cx = i * CASILLA + CASILLA / 2;
            const cy = j * CASILLA + CASILLA / 2;
            const { zona, distancia } = cerca(cx, cy);
            suelo.push(`<rect x="${i * CASILLA}" y="${j * CASILLA}" width="${CASILLA}" height="${CASILLA}" fill="${zona.suelo[(i + j) % 2]}"/>`);
            if (azar(i, j, 3) < 0.35) suelo.push(`<rect x="${i * CASILLA + 3 + Math.floor(azar(i, j, 4) * 9)}" y="${j * CASILLA + 3 + Math.floor(azar(i, j, 5) * 9)}" width="1" height="2" fill="${zona.detalle}"/>`);
            // 2) Lo que hay encima: un lago (raro y lejos del camino) o una pieza del paisaje de su zona.
            if (distancia < CASILLA * 1.1) continue;
            const r = azar(i, j);
            if (r < 0.035 && distancia > CASILLA * 2.2) agua.push(lago(cx, cy, zona.id, 1 + azar(j, i) * 0.6));
            else if (r < (zona.id === "bosque" ? 0.42 : 0.24)) decorado.push(PIEZAS[zona.id](cx + (azar(j, i, 1) - 0.5) * 6, cy + (azar(i, j, 2) - 0.5) * 6, azar(i, j, 6)));
        }
    }

    // 3) Un río que cruza el mapa (su forma depende del lugar donde empezaste). El camino pasa por encima con un puente.
    const semilla = azar(Math.round(lista[0][0] * 1000), Math.round(lista[0][1] * 1000));
    const vertical = semilla > 0.5;
    const base = (vertical ? ancho : alto) * (0.2 + semilla * 0.6);
    const curva = (t) => base + Math.sin(t / 34 + semilla * 6) * 14 + Math.sin(t / 13) * 4;
    const largo = vertical ? alto : ancho;
    const orilla = [];
    for (let t = -4; t <= largo + 4; t += 4) orilla.push(vertical ? [curva(t), t] : [t, curva(t)]);
    const rio = orilla.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ");
    const rioSvg = `<polyline points="${rio}" fill="none" stroke="#1e4f8a" stroke-width="15"/>
        <polyline points="${rio}" fill="none" stroke="#2f6fb8" stroke-width="11"/>
        <polyline points="${rio}" fill="none" stroke="#7ab8ee" stroke-width="1.5" stroke-dasharray="3 7"/>`;
    // Los puentes: donde el camino toca el río, unas tablas de madera.
    const puentes = puntos.filter((p, i) => i % 2 === 0 && Math.abs((vertical ? p[0] - curva(p[1]) : p[1] - curva(p[0]))) < 6)
        .slice(0, 8).map((p) => `<rect x="${r1(p[0] - 6)}" y="${r1(p[1] - 6)}" width="12" height="12" fill="#8a5a2a"/>
            <rect x="${r1(p[0] - 6)}" y="${r1(p[1] - 2)}" width="12" height="1" fill="#5a3a1e"/><rect x="${r1(p[0] - 6)}" y="${r1(p[1] + 2)}" width="12" height="1" fill="#5a3a1e"/>`).join("");

    // 4) El camino que corriste (borde oscuro y tierra clara).
    const camino = puntos.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ");

    // 5) Las banderas de cada km: dorada si venciste a su criatura, gris si escapó, morada si era un jefe vencido.
    const marcas = (banderas || []).map((b, n) => {
        const [x, y] = aPantalla(b);
        const pelea = (encuentros || []).find((e) => e.km === n + 1);
        const color = !pelea?.resultado ? "#fbbf24" : pelea.resultado === "vencida" ? (pelea.jefe ? "#c084fc" : "#4ade80") : "#8a8a96";
        return `<rect x="${r1(x)}" y="${r1(y - 15)}" width="1.6" height="15" fill="#2a2030"/>
            <rect x="${r1(x + 1.6)}" y="${r1(y - 15)}" width="12" height="8" fill="${color}" stroke="#2a2030" stroke-width=".8"/>
            <text x="${r1(x + 7.6)}" y="${r1(y - 8.6)}" text-anchor="middle" font-size="6.5" fill="#1a1222" font-weight="700">${n + 1}</text>`;
    }).join("");

    const [sx, sy] = puntos[0];
    const [ex, ey] = puntos[puntos.length - 1];
    const svg = `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" role="img" aria-label="Mapa de tu carrera">
        ${suelo.join("")}${rioSvg}${agua.join("")}${decorado.join("")}
        <polyline points="${camino}" fill="none" stroke="#3b2a1a" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
        <polyline points="${camino}" fill="none" stroke="#d2b074" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${puentes}
        <rect x="${r1(sx - 4)}" y="${r1(sy - 4)}" width="8" height="8" fill="#4ade80" stroke="#0b0816" stroke-width="1.2"/>
        ${marcas}
        <rect x="${r1(ex - 3)}" y="${r1(ey - 3)}" width="6" height="6" fill="#f87171" stroke="#0b0816" stroke-width="1.2"/></svg>`;
    return { svg, aqui: { x: (ex / ancho) * 100, y: (ey / alto) * 100 }, zona: zonaFinal };
}

export { ZONAS, KM_POR_ZONA };
