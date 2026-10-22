// dibujo-pista.js — La pista de atletismo en pixel art (v131; rehecha en la v147 con el estilo del mapa de la calle).
//
// En una pista el GPS dibuja círculos encimados: por eso aquí se dibuja la pista de verdad (400 m en el carril 1: dos
// rectas de 84,39 m y dos curvas de 36,8 m de radio) y tu héroe va sobre ella según los metros que llevas en la vuelta.
// La salida está al inicio de la recta de abajo y se corre en sentido contrario a las agujas del reloj, como en cualquier pista.
//
// (v147) Con el mismo lenguaje de la calle (dibujo-carrera.js y dibujo-carrera-piezas.js):
//   - pasto en cuadritos de 8 × 8 con manchas, matas, árboles y arbustos (las mismas piezas de la calle);
//   - la pista y sus bordillos en FILAS de puntos: sus bordes quedan en escalón, como en el pixel art;
//   - gradas con asientos (un <pattern>: un dibujo chico que se repite, así pesa poco), torres de luz y un marcador
//     con tus km y el ritmo de tu último km;
//   - la luz según la hora: de noche se encienden las torres y alrededor de tu héroe hay un brillo tibio.
// Toda la pista cabe en el centro del dibujo: se ve entera aunque la caja del mapa recorte los lados (de pie, la caja es
// cuadrada) o arriba y abajo (con el teléfono acostado).
// Lo que no cambia con los metros (el pasto, la pista, las gradas…) se arma UNA vez por hora del día y se guarda: el mapa
// se vuelve a dibujar cada segundo y así el teléfono trabaja poco.

import * as piezas from "./dibujo-carrera-piezas.js";
import { textoSegundos } from "./running.js";

const { n1, cuadros, nuevoPintor, LIENZO, PALETAS, azar, tonoDelSuelo } = piezas;

// Las medidas de la pista, en metros. borde: el borde de adentro del carril 1. carril: lo que mide de ancho cada carril.
export const PISTA = { recta: 84.39, radio: 36.8, borde: 36.5, carril: 1.22, carriles: 6 };

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

// ===== Dónde va cada cosa en el dibujo (320 × 240 puntos) =====
const { ancho: W, alto: H } = LIENZO;
const EXTERIOR = PISTA.borde + PISTA.carril * PISTA.carriles;   // el borde de afuera del carril 6 (43,82 m)
// Cuántos puntos mide un metro: la pista ocupa unos 224 × 114 puntos en el centro (de pie se ven 240 de ancho y,
// acostado, 160 de alto: cabe en los dos).
const ESCALA = Math.min((W - 96) / (PISTA.recta + 2 * EXTERIOR), (H - 110) / (2 * EXTERIOR));
const CX = W / 2;
const CY = H / 2;
const MEDIA_RECTA = (PISTA.recta * ESCALA) / 2;   // media recta, en puntos
const aPuntos = ([x, y]) => [CX + x * ESCALA, CY + y * ESCALA];

// ¿El punto (x, y) cae dentro del «estadio» (rectángulo con las puntas redondas) de r metros?
function dentroDelEstadio(x, y, r) {
    const dx = Math.max(0, Math.abs(x - CX) - MEDIA_RECTA);
    return dx * dx + (y - CY) ** 2 <= (r * ESCALA) ** 2;
}

// Las filas (de 1 punto de alto) que ocupa un estadio de r metros, como cuadros [x, y, ancho, alto]. Las filas iguales
// seguidas se juntan en un solo cuadro: así hay menos cuadros y el borde queda en escalón (pixel art).
function filasDelEstadio(r) {
    const R = r * ESCALA;
    const filas = [];
    for (let y = Math.floor(CY - R); y < Math.ceil(CY + R); y++) {
        const dy = Math.abs(y + 0.5 - CY);
        if (dy > R) continue;
        const medio = MEDIA_RECTA + Math.sqrt(R * R - dy * dy);
        const x0 = Math.round(CX - medio);
        const x1 = Math.round(CX + medio);
        const ultima = filas[filas.length - 1];
        if (ultima && ultima[0] === x0 && ultima[2] === x1 - x0 && ultima[1] + ultima[3] === y) ultima[3] += 1;
        else filas.push([x0, y, x1 - x0, 1]);
    }
    return filas;
}

// Un estadio de r metros como trazo (para las líneas de los carriles, que son muy finas para hacerlas en filas).
function estadio(r) {
    const R = r * ESCALA;
    return `M${n1(CX - MEDIA_RECTA)} ${n1(CY - R)}h${n1(2 * MEDIA_RECTA)}a${n1(R)} ${n1(R)} 0 0 1 0 ${n1(2 * R)}h${n1(-2 * MEDIA_RECTA)}a${n1(R)} ${n1(R)} 0 0 1 0 ${n1(-2 * R)}Z`;
}

// Un punto de un estadio de r metros, a p metros de la salida (como puntoEnPista, pero en cualquier carril).
function puntoDelEstadio(p, r) {
    const L = PISTA.recta;
    const total = 2 * L + 2 * Math.PI * r;
    p = ((p % total) + total) % total;
    if (p < L) return [-L / 2 + p, r];
    p -= L;
    if (p < Math.PI * r) { const t = Math.PI / 2 - p / r; return [L / 2 + r * Math.cos(t), r * Math.sin(t)]; }
    p -= Math.PI * r;
    if (p < L) return [L / 2 - p, -r];
    p -= L;
    const t = -Math.PI / 2 - p / r;
    return [-L / 2 + r * Math.cos(t), r * Math.sin(t)];
}

// Las gradas: la grande arriba (con techo) y una más chica abajo. [x, y, ancho, alto], en puntos.
const GRADA_ARRIBA = [84, 14, 152, 35];
const GRADA_ABAJO = [100, 192, 120, 25];
const MARCADOR = [130, 221, 60, 14];
// Las torres de luz, en las cuatro esquinas (x, y de su base).
const TORRES = [[54, 68], [266, 68], [54, 200], [266, 200]];
const dentroDe = ([x0, y0, w, h], x, y, margen = 0) => x >= x0 - margen && x <= x0 + w + margen && y >= y0 - margen && y <= y0 + h + margen;

// Colores de la pista.
const COLORES = {
    pista: "#a6452c", granoOscuro: "#8f3a24", granoClaro: "#bb5638",
    bordilloFuera: "#cfc8b8", bordilloDentro: "#e6dfd0", linea: "#f3e9df",
    campo: "#2c6a3a", campoClaro: "#317442", cal: "#e2ecdc",
};

// ===== Lo que no cambia con los metros (se arma una vez por momento del día) =====
// «§» queda en lugar del prefijo de los id: cada mapa pone el suyo (si hay varios mapas en la pantalla, no se mezclan).
const FIJAS = new Map();

function partesFijas(momento) {
    if (FIJAS.has(momento)) return FIJAS.get(momento);
    const noche = momento === "noche";

    // 1) El pasto de afuera, en cuadritos de 8 × 8 con manchas (lo que queda debajo de la pista o de las gradas no se dibuja).
    const pasto = PALETAS.pradera;
    const suelo = nuevoPintor();
    for (let j = 0; j < H / 8; j++) {
        let desde = 0;
        let color = null;
        const cerrar = (hasta) => { if (color) suelo.cuadro(desde * 8, j * 8, (hasta - desde) * 8, 8, color); };
        for (let i = 0; i <= W / 8; i++) {
            const [x, y] = [i * 8, j * 8];
            const tapada = i === W / 8 || [[x, y], [x + 8, y], [x, y + 8], [x + 8, y + 8]].every(([a, b]) => dentroDelEstadio(a, b, EXTERIOR + 1))
                || [GRADA_ARRIBA, GRADA_ABAJO].some((g) => dentroDe(g, x, y) && dentroDe(g, x + 8, y + 8));
            const c = tapada ? null : pasto.suelo[tonoDelSuelo(i, j)];
            if (c !== color) { cerrar(i); desde = i; color = c; }
        }
    }
    // Matas y florcitas sueltas donde hay pasto.
    const detalle = nuevoPintor();
    for (let k = 0; k < 90; k++) {
        const x = Math.floor(azar(k, 1, 301) * (W - 4)) + 2;
        const y = Math.floor(azar(k, 2, 302) * (H - 6)) + 3;
        if (dentroDelEstadio(x, y, EXTERIOR + 3) || dentroDe(GRADA_ARRIBA, x, y, 4) || dentroDe(GRADA_ABAJO, x, y, 6) || dentroDe(MARCADOR, x, y, 3)) continue;
        if (k % 7 === 0) {
            detalle.cuadro(x, y + 1, 1, 1, pasto.pasto[0]);
            detalle.cuadro(x, y, 1, 1, ["#cdb85a", "#cfd3df", "#a8586e"][k % 3]);
        } else {
            detalle.cuadro(x, y, 1, 3, pasto.pasto[0]);
            detalle.cuadro(x + 1, y + 1, 1, 1, pasto.pasto[1]);
        }
    }

    // 2) La pista: el bordillo de afuera, el tartán rojo, el bordillo de adentro y el campo (cada uno tapa al anterior).
    const capas = [
        [EXTERIOR + 1.6 / ESCALA, "rgba(0,0,0,.25)", 1],   // una sombrita del bordillo sobre el pasto
        [EXTERIOR + 1.4 / ESCALA, COLORES.bordilloFuera, 0],
        [EXTERIOR, COLORES.pista, 0],
        [PISTA.borde + 1.1 / ESCALA, COLORES.bordilloDentro, 0],
        [PISTA.borde, COLORES.campo, 0],
    ];
    const pista = capas.map(([r, color, dy]) => cuadros(filasDelEstadio(r).map(([x, y, w, h]) => [x, y + dy, w, h, color]))).join("");
    // El grano del tartán: puntitos más oscuros y más claros, regados por los carriles.
    const grano = nuevoPintor();
    for (let k = 0; k < 110; k++) {
        const r = PISTA.borde + 0.3 + azar(k, 3, 303) * (PISTA.carril * PISTA.carriles - 0.6);
        const [x, y] = aPuntos(puntoDelEstadio(azar(k, 4, 304) * 2 * (PISTA.recta + Math.PI * r), r));
        grano.cuadro(Math.round(x), Math.round(y), k % 4 ? 1 : 2, 1, k % 3 ? COLORES.granoOscuro : COLORES.granoClaro);
    }
    // Las líneas de los carriles (finas, como pintura blanca un poco gastada).
    const lineas = Array.from({ length: PISTA.carriles - 1 }, (_, i) => estadio(PISTA.borde + PISTA.carril * (i + 1))).join("");
    // La salida y meta: una franja de cuadros blancos y negros a lo ancho de los carriles, al empezar la recta de abajo.
    const meta = nuevoPintor();
    const xMeta = Math.round(CX - MEDIA_RECTA);
    for (let y = Math.round(CY + PISTA.borde * ESCALA) + 1, n = 0; y < CY + EXTERIOR * ESCALA; y++, n++) {
        meta.cuadro(xMeta - 1, y, 1, 1, n % 2 ? "#14101c" : "#f4f1ea");
        meta.cuadro(xMeta, y, 1, 1, n % 2 ? "#f4f1ea" : "#14101c");
    }

    // 3) El campo del centro: pasto cortado en franjas, la cancha de fútbol con sus líneas de cal, el foso de arena del
    //    salto largo (curva de la izquierda) y el círculo de lanzamiento (curva de la derecha).
    const campo = [];
    const [c0, c1] = [Math.round(CX - MEDIA_RECTA), Math.round(CX + MEDIA_RECTA)];
    const [f0, f1] = [Math.round(CY - PISTA.borde * ESCALA) + 1, Math.round(CY + PISTA.borde * ESCALA) - 1];
    for (let x = c0, n = 0; x < c1; x += 12, n++) if (n % 2) campo.push([x, f0, Math.min(12, c1 - x), f1 - f0, COLORES.campoClaro]);
    const [cw, ch] = [96, 60];
    const [cx0, cy0] = [CX - cw / 2, CY - ch / 2];
    const cal = COLORES.cal;
    campo.push(
        [cx0, cy0, cw, 1, cal], [cx0, cy0 + ch - 1, cw, 1, cal], [cx0, cy0, 1, ch, cal], [cx0 + cw - 1, cy0, 1, ch, cal],   // el borde
        [CX, cy0, 1, ch, cal],                                                                                          // la mitad
        [cx0, CY - 14, 14, 1, cal], [cx0, CY + 13, 14, 1, cal], [cx0 + 13, CY - 14, 1, 28, cal],                         // las áreas
        [cx0 + cw - 14, CY - 14, 14, 1, cal], [cx0 + cw - 14, CY + 13, 14, 1, cal], [cx0 + cw - 14, CY - 14, 1, 28, cal],
        [cx0 - 3, CY - 6, 3, 12, "#d8d6e0"], [cx0 + cw, CY - 6, 3, 12, "#d8d6e0"],                                      // los arcos
        [cx0 - 2, CY - 5, 1, 10, "#8a8896"], [cx0 + cw + 1, CY - 5, 1, 10, "#8a8896"],
    );
    // El círculo del centro, en cuadritos.
    for (let a = 0; a < 24; a++) {
        const t = (a / 24) * 2 * Math.PI;
        campo.push([Math.round(CX + Math.cos(t) * 8), Math.round(CY + Math.sin(t) * 8), 1, 1, cal]);
    }
    // El foso de arena (salto largo) con su pasillo, y el círculo de lanzamiento.
    const xFoso = Math.round(CX - MEDIA_RECTA - 34);
    campo.push([xFoso, CY - 4, 16, 8, "#7a6440"], [xFoso + 1, CY - 3, 14, 6, "#c8a86a"], [xFoso + 3, CY - 2, 3, 1, "#e0c890"], [xFoso + 16, CY - 1, 16, 2, "#8f3a24"]);
    const xTiro = Math.round(CX + MEDIA_RECTA + 26);
    campo.push([xTiro - 3, CY - 2, 6, 4, "#8a8896"], [xTiro - 2, CY - 3, 4, 6, "#8a8896"], [xTiro - 2, CY - 1, 4, 2, "#5a5866"]);
    for (let k = 1; k < 5; k++) campo.push([xTiro - 3 - k * 3, CY - 2 - k * 2, 1, 1, cal], [xTiro - 3 - k * 3, CY + 1 + k * 2, 1, 1, cal]);

    // 4) Las gradas: asientos (el <pattern>), escaleras, el muro de adelante, el techo de la grande y unos pocos espectadores.
    const gradas = [];
    const luces = nuevoPintor();
    const halos = nuevoPintor();
    const grada = ([x, y, w, h], techo) => {
        gradas.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#§asi)"/>`);
        const lista = [];
        for (let e = x + 37; e < x + w - 10; e += 38) lista.push([e, y, 4, h, "#5c5a68"], [e, y, 1, h, "#77758a"]);   // escaleras
        if (techo) {
            lista.push([x - 4, y - 10, w + 8, 9, "#1d1b27"], [x - 4, y - 2, w + 8, 1, "#3d3b4a"], [x - 4, y - 1, w + 8, 1, "#0e0b14"]);
            for (let px = x + 6; px < x + w; px += 14) {
                lista.push([px, y - 3, 2, 1, noche ? "#fff2c0" : "#6a6878"]);   // las lámparas del techo
                if (noche) halos.cuadro(px - 2, y - 4, 6, 4, "rgba(255,230,160,.22)");
            }
        }
        // El muro que da a la pista (arriba de la grada de abajo, abajo de la grada de arriba).
        const yMuro = techo ? y + h : y - 5;
        lista.push([x - 4, yMuro, w + 8, 5, "#2b2935"], [x - 4, techo ? yMuro : yMuro + 4, w + 8, 1, "#6a6878"]);
        // Los espectadores: cabeza y camiseta, en lugares fijos.
        for (let k = 0; k < 10; k++) {
            const sx = x + 1 + Math.floor(azar(k, x, 311) * (w / 6)) * 6;
            const sy = y + 1 + Math.floor(azar(k, y, 312) * (h / 5 - 1)) * 5;
            lista.push([sx + 1, sy + 1, 3, 2, ["#a8344a", "#3a6ab0", "#e9b949", "#e8e4f4", "#2f7a48"][k % 5]], [sx + 2, sy, 1, 1, ["#e0b088", "#a8704a", "#7a4a2a"][k % 3]]);
        }
        gradas.push(cuadros(lista));
    };
    grada(GRADA_ARRIBA, true);
    grada(GRADA_ABAJO, false);
    // Banderas sobre el techo: dos dibujos que se turnan (como los pájaros de la calle).
    const banderas = [[118, "#a8344a"], [CX, "#e9b949"], [202, "#3a6ab0"]];
    const asta = cuadros(banderas.map(([x]) => [x, 0, 1, 5, "#8a8896"]));
    const flamea = (b) => banderas.map(([x, color]) => cuadros(b ? [[x + 1, 1, 3, 1, color], [x + 2, 2, 3, 1, color], [x + 1, 3, 2, 1, color]] : [[x + 1, 0, 4, 3, color]])).join("");
    const banderasSvg = `${asta}<g class="cr-alaA">${flamea(false)}</g><g class="cr-alaB" opacity="0">${flamea(true)}</g>`;

    // El marcador (la pantalla; los números van aparte porque cambian).
    const [mx, my, mw, mh] = MARCADOR;
    const marcador = cuadros([[mx + 6, my + mh, 2, 3, "#3a3846"], [mx + mw - 8, my + mh, 2, 3, "#3a3846"], [mx - 1, my - 1, mw + 2, mh + 2, "#0e0b14"],
        [mx, my, mw, mh, "#3a3846"], [mx + 1, my + 1, mw - 2, mh - 2, "#0b0912"]]);
    if (noche) halos.cuadro(mx - 3, my - 3, mw + 6, mh + 6, "rgba(255,200,110,.14)");

    // 5) Los árboles y arbustos de alrededor (las mismas piezas de la calle) y las torres de luz. Se dibujan de arriba abajo.
    const defs = new Map();
    const pedir = (nombre) => {
        const clave = piezas.normalizar(nombre);
        if (!defs.has(clave)) defs.set(clave, { ...piezas.pieza(clave, momento), id: `§_${defs.size.toString(36)}` });
        return defs.get(clave);
    };
    const objetos = [];
    const poner = (nombre, x, y, fase = 0) => {
        const pz = pedir(nombre);
        let svg = `<use href="#${pz.id}" x="${Math.round(x)}" y="${Math.round(y)}"/>`;
        if (pz.copa) svg += `<use href="#${pz.id}-c" x="${Math.round(x)}" y="${Math.round(y)}" class="cr-mece f${fase}"/>`;
        objetos.push({ y, svg });
    };
    const ARBOLES = ["pinoM", "hojaM", "pinoG", "hojaG", "pinoS", "hojaS"];
    for (let j = 0; j < 12; j++) {
        const y = 20 + j * 19 + Math.round((azar(j, 5, 305) - 0.5) * 6);
        poner(`${ARBOLES[Math.floor(azar(j, 6, 306) * 6)]}-bosque`, 16 + (azar(j, 7, 307) - 0.5) * 16, y, j % 4);
        poner(`${ARBOLES[Math.floor(azar(j, 8, 308) * 6)]}-pradera`, 304 + (azar(j, 9, 309) - 0.5) * 16, y + 9, (j + 2) % 4);
    }
    for (const [x, y, nombre] of [[70, 22, "pinoM-bosque"], [250, 24, "hojaM-pradera"], [76, 234, "arbusto-pradera"], [244, 236, "arbusto-pradera"],
        [38, 112, "arbusto-bosque"], [284, 132, "arbusto-pradera"], [92, 236, "roca-pradera"]]) poner(nombre, x, y);
    for (const [x, y] of TORRES) {
        const lampara = noche ? "#fff6c8" : "#b8b6c6";
        objetos.push({ y, svg: cuadros([[x - 4, y - 1, 9, 2, "rgba(0,0,0,.3)"], [x - 2, y - 2, 4, 2, "#3a3846"], [x - 1, y - 24, 2, 22, "#5a5866"], [x - 1, y - 24, 1, 22, "#7a788a"],
            [x - 6, y - 30, 12, 6, "#0e0b14"], [x - 5, y - 29, 10, 4, "#24222e"]]) });
        for (let k = 0; k < 3; k++) luces.cuadro(x - 4 + k * 3, y - 28, 2, 2, lampara);
        if (noche) halos.cuadro(x - 8, y - 32, 16, 10, "rgba(255,240,190,.3)");
    }
    objetos.sort((a, b) => a.y - b.y);
    const piezasDefs = [...defs.values()].map((pz) => `<g id="${pz.id}">${pz.base}</g>${pz.copa ? `<g id="${pz.id}-c">${pz.copa}</g>` : ""}`).join("");

    // 6) La luz de la hora. De noche: todo más oscuro, pero las torres alumbran la pista (un brillo grande desde cada una).
    let luz;
    if (noche) {
        const focos = TORRES.map(([x, y]) => {
            const [fx, fy] = [x + (CX - x) * 0.38, y - 26 + (CY - y + 26) * 0.38];
            return `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="96" fill="url(#§foco)"/>`;
        }).join("");
        // La oscuridad es menor en el centro (el estadio) y mayor en las orillas (los árboles de afuera).
        luz = {
            defs: '<radialGradient id="§foco"><stop offset="0" stop-color="#fff3cc" stop-opacity=".2"/><stop offset=".6" stop-color="#fff3cc" stop-opacity=".08"/><stop offset="1" stop-color="#fff3cc" stop-opacity="0"/></radialGradient>'
                + `<radialGradient id="§noche" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="200"><stop offset="0" stop-color="#0a1030" stop-opacity=".42"/><stop offset=".55" stop-color="#0a1030" stop-opacity=".5"/><stop offset="1" stop-color="#0a1030" stop-opacity=".76"/></radialGradient>`,
            svg: `<rect width="${W}" height="${H}" fill="url(#§noche)"/>${focos}`,
        };
    } else {
        luz = piezas.capaDeLuz(momento, "§", CX, CY);
    }

    // El patrón de los asientos: 6 × 5 puntos (borde del escalón, asiento y su respaldo, y el escalón de abajo).
    const asientos = `<pattern id="§asi" width="6" height="5" patternUnits="userSpaceOnUse" x="${GRADA_ARRIBA[0]}" y="${GRADA_ARRIBA[1]}">`
        + cuadros([[0, 0, 6, 5, "#45434f"], [0, 0, 6, 1, "#2a2834"], [1, 1, 4, 1, "#4a6aa8"], [1, 2, 4, 1, "#2e4a80"], [0, 4, 6, 1, "#55535f"]]) + "</pattern>";

    const fijas = {
        defs: `${asientos}${piezasDefs}${luz.defs}`,
        abajo: `<rect width="${W}" height="${H}" fill="${pasto.suelo[1]}"/>${suelo.svg()}${detalle.svg()}${pista}${grano.svg()}`
            + `<path d="${lineas}" fill="none" stroke="${COLORES.linea}" stroke-width=".55" stroke-opacity=".6"/>${cuadros(campo)}${meta.svg()}`
            + `${gradas.join("")}${marcador}${banderasSvg}${objetos.map((o) => o.svg).join("")}`,
        luz: luz.svg,
        encima: `${halos.svg()}${luces.svg()}`,
    };
    FIJAS.set(momento, fijas);
    return fijas;
}

// Un nombre corto para los id del SVG, distinto para cada mapa (como en la calle).
function prefijo(texto) {
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    return `p${(h % 1679616).toString(36)}`;
}

// ===== El mapa de la pista =====
// opciones = { metros: lo corrido, largo: 400, hora: 0–24 (la luz), reloj: ms (las fases de las animaciones),
//              parciales: segundos de cada km (el marcador muestra el último), vivo: es la carrera en curso (rastro de luz
//              y sombra de tu héroe; si no, un cuadro rojo donde terminaste) }.
// Devuelve { svg, aqui, rumbo, zona: { nombre } } como mapaDeCarrera.
export function mapaDePista({ metros = 0, largo = 400, hora, reloj = 0, parciales = [], vivo = false } = {}) {
    const momento = piezas.momentoDelDia(hora);
    const fijas = partesFijas(momento);
    const p = prefijo(`${Math.round(metros)}|${largo}|${momento}|${vivo}`);

    // Lo que llevas de esta vuelta: una banda dorada suave con una línea de puntos encima, sobre el carril 1.
    const enVuelta = ((metros % largo) + largo) % largo;
    const camino = (desde, hasta) => {
        const lista = [];
        for (let m = desde; m < hasta; m += 4) lista.push(aPuntos(puntoEnPista(m, largo)));
        lista.push(aPuntos(puntoEnPista(hasta, largo)));
        return lista.length > 1 ? `M${lista.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(" ")}` : "";
    };
    const dVuelta = camino(0, enVuelta);
    let avance = dVuelta ? `<path d="${dVuelta}" stroke="#fbbf24" stroke-opacity=".3" stroke-width="4"/><path d="${dVuelta}" stroke="#ffd76a" stroke-width="1.2" stroke-dasharray="2 2"/>` : "";
    // Detrás de ti, mientras corres, la pista se ilumina a tu paso (los últimos 150 m, en tres trozos que se apagan).
    if (vivo) {
        avance += [[0, 50, 0.7], [50, 100, 0.42], [100, 150, 0.2]].map(([a, b, op]) => {
            const d = metros - a > 0 ? camino(Math.max(0, metros - b), metros - a) : "";
            return d ? `<path d="${d}" stroke="#ffe9a8" stroke-opacity="${op}" stroke-width="2"/>` : "";
        }).join("");
    }
    const [ex, ey] = aPuntos(puntoEnPista(metros, largo));
    const tu = vivo
        ? `<path fill="rgba(0,0,0,.4)" d="M${n1(ex - 7)} ${n1(ey - 1)}h14v3h-14zM${n1(ex - 5)} ${n1(ey - 2)}h10v5h-10z"/>`
        : `<rect x="${n1(ex - 3)}" y="${n1(ey - 3)}" width="6" height="6" fill="#f87171" stroke="#0b0816" stroke-width="1.2"/>`;
    // (v146) Hacia dónde corres: de aquí al punto de la pista 2 m más adelante (en las curvas, la tangente).
    const [sx, sy] = aPuntos(puntoEnPista(metros + 2, largo));
    const largoRumbo = Math.hypot(sx - ex, sy - ey) || 1;
    const rumbo = { x: (sx - ex) / largoRumbo, y: (sy - ey) / largoRumbo };

    // El marcador: tus km y el ritmo de tu último km (o los metros de esta vuelta, si todavía no cumples el primero).
    const ultimo = (parciales || []).filter((s) => Number.isFinite(s) && s > 0).at(-1);
    const km = (metros / 1000).toFixed(2).replace(".", ",");
    const textoMarcador = `${km} KM · ${ultimo ? textoSegundos(ultimo) : `${Math.round(enVuelta)} M`}`;
    const [mx, my, mw, mh] = MARCADOR;
    const marcador = `<text x="${mx + mw / 2}" y="${my + mh / 2 + 2.2}" text-anchor="middle" font-size="6" font-weight="700" fill="#ffcf6a">${textoMarcador}</text>`;

    // (v147) De noche, un brillo tibio alrededor de tu héroe.
    const tibio = vivo && momento === "noche"
        ? `<circle cx="${n1(ex)}" cy="${n1(ey - 8)}" r="30" fill="url(#§tibio)"/>` : "";
    const defsTibio = tibio ? '<radialGradient id="§tibio"><stop offset="0" stop-color="#ffc070" stop-opacity=".3"/><stop offset=".55" stop-color="#ffa040" stop-opacity=".14"/><stop offset="1" stop-color="#ff9030" stop-opacity="0"/></radialGradient>' : "";

    const vueltas = Math.floor(metros / largo);
    const svg = `<svg class="run-mapa-svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Tu carrera en la pista" data-momento="${momento}" style="${piezas.fases(reloj)}">
        <defs>${fijas.defs}${defsTibio}</defs>${fijas.abajo}
        <g fill="none" stroke-linejoin="round" stroke-linecap="round">${avance}</g>${tu}
        ${fijas.luz}${tibio}${fijas.encima}${marcador}</svg>`.replaceAll("§", p);
    return { svg, aqui: { x: (ex / W) * 100, y: (ey / H) * 100 }, rumbo, zona: { nombre: `🏟️ Pista · ${vueltas === 1 ? "1 vuelta" : `${vueltas} vueltas`} · ${Math.round(enVuelta)}/${largo} m` } };
}
