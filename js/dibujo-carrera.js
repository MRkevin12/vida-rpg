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

// lat/lon -> metros (desde el primer punto) -> puntos del lienzo.
// Modo «todo»: se ajusta para que quepa todo el recorrido (al menos LIENZO.minMetros de lado).
// Modo «seguir» (v131): una ventana fija de VENTANA_SEGUIR metros de ancho centrada en donde vas, para ver de cerca hacia dónde corres.
export const VENTANA_SEGUIR = 420;
function proyectar(traza, seguir = false) {
    const [lat0, lon0] = traza[0];
    const k = Math.cos((lat0 * Math.PI) / 180) * 111320;
    const aMetros = (p) => [(p[1] - lon0) * k, -(p[0] - lat0) * 110540];
    const metros = traza.map(aMetros);
    let cx;
    let cy;
    let escala;
    if (seguir) {
        [cx, cy] = metros[metros.length - 1];
        escala = LIENZO.ancho / VENTANA_SEGUIR;
    } else {
        const xs = metros.map((m) => m[0]);
        const ys = metros.map((m) => m[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        cx = (x0 + x1) / 2;
        cy = (y0 + y1) / 2;
        const ancho = Math.max(x1 - x0, LIENZO.minMetros);
        const alto = Math.max(y1 - y0, LIENZO.minMetros * 0.75);
        escala = Math.min((LIENZO.ancho - LIENZO.margen * 2) / ancho, (LIENZO.alto - LIENZO.margen * 2) / alto);
    }
    const W = LIENZO.ancho / 2;
    const H = LIENZO.alto / 2;
    return {
        escala,
        aMetros,
        aPantalla: (p) => { const [x, y] = aMetros(p); return [W + (x - cx) * escala, H + (y - cy) * escala]; },
        metrosAPantalla: (x, y) => [W + (x - cx) * escala, H + (y - cy) * escala],
        aMundo: (x, y) => [(x - W) / escala + cx, (y - H) / escala + cy],
    };
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
// opciones = { traza: [[lat, lon]…], banderas: [[lat, lon]…] (una por km), encuentros: [{ km, resultado, jefe }…], km: lo corrido,
//              seguir: true (te sigue de cerca) o false (todo el recorrido), flecha: dibujar hacia dónde vas }
// porZona: cada cuántos km cambia el paisaje (las carreras viejas, sin dato, usan 3).
// Devuelve { svg, aqui: { x, y } en % (dónde va tu héroe) o null, zona (la del final del recorrido) }.
// El paisaje y el río están anclados al TERRENO (en metros), así no «bailan» cuando el mapa te sigue.
export function mapaDeCarrera({ traza = [], banderas = [], encuentros = [], km = 0, seguir = false, flecha = false, porZona = 3 } = {}) {
    const lista = (traza || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]));
    const { ancho, alto } = LIENZO;
    const zonaFinal = zonaDelKm(Math.floor(km) + 1, porZona);
    if (!lista.length) {
        return {
            svg: `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Mapa de tu carrera">
                <rect width="${ancho}" height="${alto}" fill="${zonaFinal.suelo[0]}"/>
                <text x="160" y="124" text-anchor="middle" fill="#eef2ff" font-size="13">Buscando señal del GPS…</text></svg>`,
            aqui: null, zona: zonaFinal,
        };
    }
    const vista = proyectar(lista, seguir);
    const { escala, aPantalla, metrosAPantalla, aMundo, aMetros } = vista;
    const puntos = lista.map(aPantalla);
    const enMetros = lista.map(aMetros);
    // Cada punto del camino sabe en qué km va (aproximado: por su lugar en la lista).
    const kmDelPunto = (i) => (puntos.length > 1 ? (i / (puntos.length - 1)) * km : 0);
    const muestra = Math.max(1, Math.ceil(puntos.length / 90));   // para no medir contra todos los puntos

    // ¿Qué zona tiene un lugar? La del punto del camino más cercano. Y qué tan lejos queda del camino (en puntos del lienzo).
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
        return { zona: zonaDelKm(Math.floor(kmDelPunto(indice)) + 1, porZona), distancia: Math.sqrt(mejor) };
    };

    // 1) El suelo en casillas fijas al terreno (cada una mide `paso` metros) y, encima, lagos o piezas del paisaje.
    const paso = CASILLA / escala;
    const [mx0, my0] = aMundo(0, 0);
    const [mx1, my1] = aMundo(ancho, alto);
    const suelo = [];
    const decorado = [];
    const agua = [];
    for (let wj = Math.floor(my0 / paso); wj * paso < my1; wj++) {
        for (let wi = Math.floor(mx0 / paso); wi * paso < mx1; wi++) {
            const [x, y] = metrosAPantalla(wi * paso, wj * paso);
            const cx = x + CASILLA / 2;
            const cy = y + CASILLA / 2;
            const { zona, distancia } = cerca(cx, cy);
            suelo.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${CASILLA + 0.2}" height="${CASILLA + 0.2}" fill="${zona.suelo[(((wi + wj) % 2) + 2) % 2]}"/>`);
            if (azar(wi, wj, 3) < 0.35) suelo.push(`<rect x="${r1(x + 3 + Math.floor(azar(wi, wj, 4) * 9))}" y="${r1(y + 3 + Math.floor(azar(wi, wj, 5) * 9))}" width="1" height="2" fill="${zona.detalle}"/>`);
            if (distancia < CASILLA * 1.1) continue;
            const r = azar(wi, wj);
            if (r < 0.035 && distancia > CASILLA * 2.2) agua.push(lago(cx, cy, zona.id, 1 + azar(wj, wi) * 0.6));
            else if (r < (zona.id === "bosque" ? 0.42 : 0.24)) decorado.push(PIEZAS[zona.id](cx + (azar(wj, wi, 1) - 0.5) * 6, cy + (azar(wi, wj, 2) - 0.5) * 6, azar(wi, wj, 6)));
        }
    }

    // 2) Un río que cruza el terreno (su forma depende del lugar donde empezaste; está en metros). El camino lo cruza con puentes.
    const semilla = azar(Math.round(lista[0][0] * 1000), Math.round(lista[0][1] * 1000));
    const vertical = semilla > 0.5;
    const base = (semilla * 7) % 1 < 0.5 ? -(70 + ((semilla * 13) % 1) * 150) : 70 + ((semilla * 13) % 1) * 150;   // a 70–220 m de la salida
    const curva = (t) => base + Math.sin(t / 60 + semilla * 6) * 30 + Math.sin(t / 23) * 8;   // metros
    const [desde, hasta] = vertical ? [my0 - 30, my1 + 30] : [mx0 - 30, mx1 + 30];
    const orilla = [];
    for (let t = desde; t <= hasta; t += Math.max(1, 4 / escala)) orilla.push(vertical ? metrosAPantalla(curva(t), t) : metrosAPantalla(t, curva(t)));
    const rio = orilla.map((q) => `${r1(q[0])},${r1(q[1])}`).join(" ");
    const grosor = Math.max(10, 16 * escala);
    const rioSvg = `<polyline points="${rio}" fill="none" stroke="#1e4f8a" stroke-width="${r1(grosor + 4)}"/>
        <polyline points="${rio}" fill="none" stroke="#2f6fb8" stroke-width="${r1(grosor)}"/>
        <polyline points="${rio}" fill="none" stroke="#7ab8ee" stroke-width="1.5" stroke-dasharray="3 7"/>`;
    const puentes = enMetros.map((m, i) => ({ m, q: puntos[i] }))
        .filter(({ m, q }, i) => i % 2 === 0 && q[0] > -10 && q[0] < ancho + 10 && q[1] > -10 && q[1] < alto + 10
            && Math.abs(vertical ? m[0] - curva(m[1]) : m[1] - curva(m[0])) < Math.max(8, 7 / escala))
        .slice(0, 8).map(({ q }) => `<rect x="${r1(q[0] - 6)}" y="${r1(q[1] - 6)}" width="12" height="12" fill="#8a5a2a"/>
            <rect x="${r1(q[0] - 6)}" y="${r1(q[1] - 2)}" width="12" height="1" fill="#5a3a1e"/><rect x="${r1(q[0] - 6)}" y="${r1(q[1] + 2)}" width="12" height="1" fill="#5a3a1e"/>`).join("");

    // 3) El camino que corriste (borde oscuro y tierra clara).
    const camino = puntos.map((q) => `${r1(q[0])},${r1(q[1])}`).join(" ");

    // 4) Las banderas de cada km: verde si venciste a su criatura, gris si escapó, morada si era un jefe vencido.
    const marcas = (banderas || []).map((b, n) => {
        const [x, y] = aPantalla(b);
        const pelea = (encuentros || []).find((e) => e.km === n + 1);
        const color = !pelea?.resultado ? "#fbbf24" : pelea.resultado === "vencida" ? (pelea.jefe ? "#c084fc" : "#4ade80") : "#8a8a96";
        return `<rect x="${r1(x)}" y="${r1(y - 15)}" width="1.6" height="15" fill="#2a2030"/>
            <rect x="${r1(x + 1.6)}" y="${r1(y - 15)}" width="12" height="8" fill="${color}" stroke="#2a2030" stroke-width=".8"/>
            <text x="${r1(x + 7.6)}" y="${r1(y - 8.6)}" text-anchor="middle" font-size="6.5" fill="#1a1222" font-weight="700">${n + 1}</text>`;
    }).join("");

    // 5) (v131) Hacia dónde vas: una flechita delante de ti (con la dirección de los últimos ~15 m).
    const [ex, ey] = puntos[puntos.length - 1];
    let flechaSvg = "";
    if (flecha && enMetros.length > 1) {
        const fin = enMetros[enMetros.length - 1];
        let atras = enMetros.length - 2;
        while (atras > 0 && Math.hypot(fin[0] - enMetros[atras][0], fin[1] - enMetros[atras][1]) < 15) atras -= 1;
        const dx = fin[0] - enMetros[atras][0];
        const dy = fin[1] - enMetros[atras][1];
        const largo = Math.hypot(dx, dy);
        if (largo > 3) {
            const [ux, uy] = [dx / largo, dy / largo];
            const punta = [ex + ux * 26, ey + uy * 26];   // una flecha alargada (punta lejos, base angosta) para que se note hacia dónde apunta
            const [b1, b2] = [[ex + ux * 12 - uy * 4, ey + uy * 12 + ux * 4], [ex + ux * 12 + uy * 4, ey + uy * 12 - ux * 4]];
            flechaSvg = `<polygon points="${r1(punta[0])},${r1(punta[1])} ${r1(b1[0])},${r1(b1[1])} ${r1(b2[0])},${r1(b2[1])}" fill="#fbbf24" stroke="#1a1222" stroke-width="1.2"/>`;
        }
    }

    const [sx, sy] = puntos[0];
    const svg = `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Mapa de tu carrera">
        ${suelo.join("")}${rioSvg}${agua.join("")}${decorado.join("")}
        <polyline points="${camino}" fill="none" stroke="#3b2a1a" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
        <polyline points="${camino}" fill="none" stroke="#d2b074" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${puentes}
        <rect x="${r1(sx - 4)}" y="${r1(sy - 4)}" width="8" height="8" fill="#4ade80" stroke="#0b0816" stroke-width="1.2"/>
        ${marcas}${flechaSvg}
        <rect x="${r1(ex - 3)}" y="${r1(ey - 3)}" width="6" height="6" fill="#f87171" stroke="#0b0816" stroke-width="1.2"/></svg>`;
    return { svg, aqui: { x: (ex / ancho) * 100, y: (ey / alto) * 100 }, zona: zonaFinal };
}

// ===== (v131) La pista de atletismo =====
// En una pista el GPS dibuja círculos encimados; aquí se dibuja la pista de verdad (400 m en el carril 1: dos rectas de 84,39 m y
// dos curvas de 36,8 m de radio) y tu héroe va sobre ella según los metros que llevas en la vuelta. La salida está al inicio de la
// recta de abajo y se corre en sentido contrario a las agujas del reloj, como en cualquier pista.
const PISTA = { recta: 84.39, radio: 36.8, borde: 36.5, carril: 1.22, carriles: 6 };

// Dónde estás (en metros desde el centro de la pista) a `m` metros de la salida, en el carril 1.
export function puntoEnPista(m, largo = 400) {
    const { recta: L, radio: R } = PISTA;
    let p = ((m % largo) + largo) % largo;
    p *= (2 * L + 2 * Math.PI * R) / largo;   // por si la pista no mide exactamente 400 m
    if (p < L) return [-L / 2 + p, R];
    p -= L;
    if (p < Math.PI * R) { const t = Math.PI / 2 - p / R; return [L / 2 + R * Math.cos(t), R * Math.sin(t)]; }
    p -= Math.PI * R;
    if (p < L) return [L / 2 - p, -R];
    p -= L;
    const t = -Math.PI / 2 - p / R;
    return [-L / 2 + R * Math.cos(t), R * Math.sin(t)];
}

// opciones = { metros: lo corrido, largo: 400, vueltas: true }. Devuelve { svg, aqui, zona: { nombre } } como mapaDeCarrera.
export function mapaDePista({ metros = 0, largo = 400 } = {}) {
    const { ancho, alto } = LIENZO;
    const { recta: L, borde, carril, carriles } = PISTA;
    const exterior = borde + carril * carriles;
    const s = Math.min((ancho - 36) / (L + 2 * exterior), (alto - 70) / (2 * exterior));
    const [cx, cy] = [ancho / 2, alto / 2 + 4];
    const aP = ([x, y]) => [cx + x * s, cy + y * s];
    // Un «estadio» (rectángulo con las puntas redondas) de radio r metros.
    const estadio = (r) => `M${r1(cx - (L / 2) * s)} ${r1(cy - r * s)} h${r1(L * s)} a${r1(r * s)} ${r1(r * s)} 0 0 1 0 ${r1(2 * r * s)} h${r1(-L * s)} a${r1(r * s)} ${r1(r * s)} 0 0 1 0 ${r1(-2 * r * s)} Z`;
    const lineas = Array.from({ length: carriles - 1 }, (_, i) => `<path d="${estadio(borde + carril * (i + 1))}" fill="none" stroke="#f4e6e0" stroke-width=".7" opacity=".7"/>`).join("");
    // Las gradas, arriba y abajo.
    const grada = (y, alto2) => Array.from({ length: 4 }, (_, i) => `<rect x="14" y="${r1(y + i * (alto2 / 4))}" width="${ancho - 28}" height="${r1(alto2 / 4 - 1)}" fill="${["#5a5266", "#6a6276", "#5a5266", "#4a4256"][i]}"/>`).join("")
        + Array.from({ length: 26 }, (_, i) => `<rect x="${18 + i * 11}" y="${r1(y + 2 + (i % 4) * (alto2 / 4))}" width="3" height="3" fill="${["#f87171", "#fbbf24", "#60a5fa", "#4ade80", "#eef2ff"][i % 5]}"/>`).join("");
    // El campo de fútbol del centro.
    const campoAncho = L * s * 0.95;
    const campoAlto = borde * 2 * s * 0.72;
    const campo = `<rect x="${r1(cx - campoAncho / 2)}" y="${r1(cy - campoAlto / 2)}" width="${r1(campoAncho)}" height="${r1(campoAlto)}" fill="none" stroke="#eef7e6" stroke-width="1"/>
        <line x1="${r1(cx)}" y1="${r1(cy - campoAlto / 2)}" x2="${r1(cx)}" y2="${r1(cy + campoAlto / 2)}" stroke="#eef7e6" stroke-width="1"/>
        <circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(campoAlto * 0.18)}" fill="none" stroke="#eef7e6" stroke-width="1"/>`;
    // La salida/meta: una franja blanca a lo ancho de los carriles.
    const [mx, my] = aP([-L / 2, borde]);
    const meta = `<rect x="${r1(mx - 1)}" y="${r1(my)}" width="2.5" height="${r1(carril * carriles * s)}" fill="#ffffff"/>`;
    // Lo que llevas de esta vuelta, en dorado sobre el carril 1.
    const enVuelta = metros % largo;
    const traza = [];
    for (let m = 0; m <= enVuelta; m += 4) traza.push(aP(puntoEnPista(m, largo)));
    traza.push(aP(puntoEnPista(enVuelta, largo)));
    const avance = traza.length > 1 ? `<polyline points="${traza.map((q) => `${r1(q[0])},${r1(q[1])}`).join(" ")}" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linejoin="round"/>` : "";
    const [ex, ey] = aP(puntoEnPista(metros, largo));
    const vueltas = Math.floor(metros / largo);
    const svg = `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Tu carrera en la pista">
        <rect width="${ancho}" height="${alto}" fill="#2a6a38"/>
        ${grada(4, 26)}${grada(alto - 30, 26)}
        <path d="${estadio(exterior + 1.5)}" fill="#e7e2d8"/>
        <path d="${estadio(exterior)}" fill="#b5482e"/>
        <path d="${estadio(borde)}" fill="#2e7a40" stroke="#f4e6e0" stroke-width="1"/>
        ${lineas}${campo}${meta}${avance}
        <rect x="${r1(ex - 3)}" y="${r1(ey - 3)}" width="6" height="6" fill="#f87171" stroke="#0b0816" stroke-width="1.2"/></svg>`;
    return { svg, aqui: { x: (ex / ancho) * 100, y: (ey / alto) * 100 }, zona: { nombre: `🏟️ Pista · ${vueltas === 1 ? "1 vuelta" : `${vueltas} vueltas`} · ${Math.round(enVuelta)}/${largo} m` } };
}

export { ZONAS, KM_POR_ZONA };
