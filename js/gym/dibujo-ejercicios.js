// dibujo-ejercicios.js — Las figuras que hacen cada ejercicio (v77; rehechas en la v158).
//
// (v158) Antes eran figuras de palitos que se estiraban al moverse. Ahora son cuerpos de verdad, en pixel art:
//   1. Un ESQUELETO con huesos de largo fijo (MEDIDAS). Cada movimiento tiene una función pose(u):
//      u = 0 es la posición de inicio y u = 1 la de máxima contracción (o el fondo del movimiento).
//      Para que los pies no resbalen y la barra no cambie de largo, algunas articulaciones se calculan "al revés"
//      (articulacion(): sabes dónde va la mano y se busca dónde cae el codo; eso se llama cinemática inversa).
//   2. Sobre el esqueleto va el CUERPO: cada parte (muslo, brazo…) es una cápsula con músculo (más gruesa en el medio),
//      con su sombra y su luz, en tu color de piel y de pelo (los de tu avatar).
//   3. Una REPETICIÓN son 20 cuadros (CUADROS): se queda quieto un instante, sube, aprieta arriba y baja más despacio.
//      tiraDeMovimiento() pone los 20 cuadros uno al lado del otro; retratos.js los convierte en pixel art y los
//      muestra uno tras otro, como los dibujos animados de los juegos viejos.
//   (v168) Eran 13 movimientos y muchos ejercicios se veían como otro (la plancha como un abdominal, las dominadas
//      como el jalón). Ahora hay 64: cada ejercicio del catálogo (gym.js › MOVIMIENTO_DE) tiene una figura que se le parece,
//      con sus máquinas (MAQUINAS). En las figuras de frente, lo que apunta hacia ti se ve más corto (brazoHaciaTi, escala).
//
// Lienzo de cada cuadro: 120 × 110 puntos (1 unidad = 1 punto de pixel art). El suelo está en y = 104.
// Ángulos: 0 = hacia abajo, 90 = hacia adelante (la derecha), 180 = hacia arriba, -90 = hacia atrás.
// Este archivo solo devuelve texto SVG y números: no guarda nada ni toca la pantalla.

import { ANCHO, ALTO, SUELO, HIERRO, ACERO, CUERO, paletaDe, puntaDeBarra, cable, barraRecta, CADERA_INCLINADO, marco, almohadilla, almohadillaEntre, respaldo, rodillo, ruedaDePolea, torreDePolea } from "./dibujo-ejercicios-piezas.js";
import { MOVIMIENTOS, VICTORIA } from "./dibujo-ejercicios-movimientos.js";
export * from "./dibujo-ejercicios-piezas.js";   // (orden) las piezas del cuerpo, pesas y máquinas

export const LISTA_DE_MOVIMIENTOS = Object.keys(MOVIMIENTOS);
const movimientoPorClave = (clave) => (clave === "victoria" ? VICTORIA : MOVIMIENTOS[clave] || MOVIMIENTOS.curl);
export const fondoDe = (clave) => movimientoPorClave(clave).fondo;   // varios ejercicios comparten la misma sala
// (v158) La parte del cuadro que importa (de x0 a x1): la escena se acerca a ella cuando la pantalla es alta y angosta.
// Arriba deja 4 puntos de aire (para las fichas del escenario). Devuelve el viewBox: [x, y, ancho, alto].
export function encuadreDe(clave) {
    const [x0, x1] = movimientoPorClave(clave).encuadre || [0, ANCHO];
    return [x0, -4, x1 - x0, ALTO + 4];
}

// Cuánto músculo tiene la figura: 1 al empezar y hasta 1,25 con el físico más alto (sale del nivel de gym).
export const musculoDe = (fisico = 0) => 1 + Math.max(0, Math.min(5, fisico)) * 0.05;

// Un cuadro: el cuerpo (y lo que se mueve) en el instante u. Sin fondo: el fondo es otra imagen (dibujarFondoEjercicio).
export function dibujarCuadro(clave, apariencia, u, { fisico = 0 } = {}) {
    const pal = paletaDe(apariencia);
    return movimientoPorClave(clave).dibujar(Math.max(0, Math.min(1, u)), pal, musculoDe(fisico));
}

// ===== La animación: 20 cuadros por repetición =====
// u de cada cuadro y cuánto dura (en segundos). suave() hace que arranque y frene despacio (como un movimiento real).
const suave = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
export const CUADROS = (() => {
    const lista = [{ u: 0, dura: 0.5 }];                                                  // quieto abajo
    for (let i = 1; i <= 8; i++) lista.push({ u: suave(i / 8), dura: i === 8 ? 0.45 : 0.09 });   // sube (y aprieta arriba)
    for (let i = 1; i <= 11; i++) lista.push({ u: 1 - suave(i / 12), dura: 0.1 });              // baja más despacio
    return lista;
})();
export const DURACION = CUADROS.reduce((suma, c) => suma + c.dura, 0);

// Todos los cuadros en una tira (uno al lado del otro) para convertirla en pixel art de una sola vez.
// Devuelve el SVG y lo que necesita la animación: dónde empieza cada cuadro (x) y en qué momento se muestra (tiempos, de 0 a 1).
export function tiraDeMovimiento(clave, apariencia, { fisico = 0 } = {}) {
    const n = CUADROS.length;
    const cuadros = CUADROS.map((c, i) => `<g transform="translate(${i * ANCHO} 0)">${dibujarCuadro(clave, apariencia, c.u, { fisico })}</g>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO * n} ${ALTO}" shape-rendering="crispEdges">${cuadros}</svg>`;
    return { svg, cuadros: n, ...animacionDeTira() };
}

// Los valores de la animación (no dependen del ejercicio): x de cada cuadro y en qué momento empieza.
export function animacionDeTira() {
    let t = 0;
    const tiempos = CUADROS.map((c) => { const inicio = t; t += c.dura; return Math.round((inicio / DURACION) * 10000) / 10000; });
    return { valores: CUADROS.map((_, i) => -i * ANCHO), tiempos, duracion: Math.round(DURACION * 100) / 100 };
}

// ===== El fondo: el gimnasio y las máquinas que no se mueven =====
// Es más grande que el cuadro (de x = -80 a 200 y de y = -60 a 110): si la pantalla es más ancha o más alta que el
// dibujo, se sigue viendo la sala en vez de una franja vacía. Colores planos y oscuros, para que la figura resalte.
export const FONDO = { x: -80, y: -60, ancho: 280, alto: 170 };
const MURO = "#1b1534", MURO_OSCURO = "#151029", ZOCALO = "#120d22", RIBETE = "#2f2652", PISO = "#0f0b1c", PISO_LUZ = "#2a2148";

export function dibujarFondoEjercicio(clave) {
    const { x, y, ancho, alto } = FONDO;
    const fondo = movimientoPorClave(clave).fondo;
    const paneles = Array.from({ length: 8 }, (_, i) => x + 20 + i * 36).map((px) => `<path d="M${px} ${y} L${px} 74" stroke="${MURO_OSCURO}" stroke-width="2"/>`).join("");
    const lamparas = [-50, 60, 170].map((lx) => `<path d="M${lx} ${y} L${lx} -14" stroke="#2a2346" stroke-width="1"/><path d="M${lx - 6} -8 L${lx - 3} -14 L${lx + 3} -14 L${lx + 6} -8Z" fill="#2c2540" stroke="#0d0918" stroke-width="1"/><rect x="${lx - 4}" y="-8" width="8" height="1.4" fill="#ffd98a"/>`).join("");
    const juntas = Array.from({ length: 14 }, (_, i) => x + 10 + i * 20).map((px) => `<path d="M${px} ${SUELO + 1} L${px - 3} ${y + alto}" stroke="#171128" stroke-width="1"/>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${ancho} ${alto}" shape-rendering="crispEdges">
        <defs><radialGradient id="foco-ej" cx="60" cy="10" r="78" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#e9c46a" stop-opacity=".2"/><stop offset=".55" stop-color="#8b6fd8" stop-opacity=".08"/><stop offset="1" stop-color="#8b6fd8" stop-opacity="0"/></radialGradient></defs>
        <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="${MURO}"/>
        ${paneles}
        <rect x="${x}" y="74" width="${ancho}" height="${SUELO - 74}" fill="${ZOCALO}"/>
        <rect x="${x}" y="73" width="${ancho}" height="2" fill="${RIBETE}"/>
        ${decoracionLejana()}
        <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="url(#foco-ej)"/>
        ${lamparas}
        <rect x="${x}" y="${SUELO}" width="${ancho}" height="${y + alto - SUELO}" fill="${PISO}"/>
        ${juntas}
        <rect x="${x}" y="${SUELO}" width="${ancho}" height="1" fill="${PISO_LUZ}"/>
        <ellipse cx="60" cy="${SUELO + 1}" rx="26" ry="2.2" fill="#000" opacity=".35"/>
        ${MAQUINAS[fondo] || ""}
    </svg>`;
}

// Lo que se ve a los lados en una pantalla ancha: un estante de mancuernas (izquierda) y un árbol de discos (derecha).
function decoracionLejana() {
    const estante = `<rect x="-62" y="80" width="40" height="3" fill="#2a2346" stroke="#0d0918" stroke-width="1"/><path d="M-60 83 L-60 ${SUELO} M-24 83 L-24 ${SUELO}" stroke="#2a2346" stroke-width="2"/>`
        + [-56, -48, -40, -32].map((mx) => `<rect x="${mx - 2.5}" y="74" width="5" height="6" fill="#211c33" stroke="#0d0918" stroke-width="1"/>`).join("");
    const arbol = `<path d="M182 50 L182 ${SUELO}" stroke="#2a2346" stroke-width="2"/><path d="M174 ${SUELO} L190 ${SUELO}" stroke="#2a2346" stroke-width="2"/>`
        + [[178, 64, 7], [186, 76, 8], [178, 90, 9]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1d1830" stroke="#0d0918" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="2" fill="#2f2848"/>`).join("");
    const espejo = `<rect x="128" y="18" width="34" height="50" fill="#1f1a3a" stroke="#2f2652" stroke-width="2"/><path d="M134 62 L150 24 M142 64 L156 32" stroke="#2c2650" stroke-width="2"/>`;
    return estante + arbol + espejo;
}

// El asiento con respaldo alto (se ve de frente).
const ASIENTO = marco(`M60 88 L60 ${SUELO} M50 ${SUELO - 1} L70 ${SUELO - 1}`) + almohadilla(47, 44, 26, 40) + almohadilla(44, 84, 32, 4.4);

const MAQUINAS = {
    sala: "",
    banco: marco(`M30 84 L30 ${SUELO} M80 84 L80 ${SUELO} M26 ${SUELO - 1} L36 ${SUELO - 1} M74 ${SUELO - 1} L86 ${SUELO - 1} M30 90 L80 90`)
        + marco(`M34 48 L34 ${SUELO} M30 ${SUELO - 1} L40 ${SUELO - 1}`) + marco("M34 52 L38 52 L38 49", 1.6)
        + almohadilla(22, 79.6, 68, 4.6),
    "banco-femoral": marco(`M30 84 L30 ${SUELO} M76 84 L76 ${SUELO} M26 ${SUELO - 1} L36 ${SUELO - 1} M72 ${SUELO - 1} L84 ${SUELO - 1} M24 86 L30 86`)
        + marco("M81 80 L81 88", 3) + almohadilla(22, 79.6, 58, 4.6) + `<circle cx="81.5" cy="82" r="2.4" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>`,
    asiento: ASIENTO,
    jalon: marco(`M24 2 L24 ${SUELO} M96 2 L96 ${SUELO} M22 2 L98 2 M60 88 L60 ${SUELO} M50 ${SUELO - 1} L70 ${SUELO - 1}`)
        + `<circle cx="60" cy="3.5" r="3" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>` + almohadilla(46, 84, 28, 4.4),
    "polea-alta": torreDePolea(9),
    "polea-baja": marco(`M99 20 L99 ${SUELO} M117 20 L117 ${SUELO} M97 20 L119 20 M97 ${SUELO - 1} L119 ${SUELO - 1}`)
        + `<path d="M103 22 L103 ${SUELO - 3} M114 22 L114 ${SUELO - 3}" stroke="#2b2f3a" stroke-width="1"/><circle cx="101" cy="91" r="2.4" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>`
        + marco(`M26 92 L26 ${SUELO} M56 92 L56 ${SUELO} M22 ${SUELO - 1} L60 ${SUELO - 1} M80 86 L82 ${SUELO}`) + almohadilla(20, 88.4, 40, 4.4)
        + `<rect x="78" y="84" width="4" height="14" fill="${HIERRO.sombra}" stroke="#0d0b12" stroke-width="1"/>`,
    jaula: `<g opacity=".55">${marco(`M30 22 L30 ${SUELO} M88 22 L88 ${SUELO} M28 22 L90 22 M26 ${SUELO - 1} L92 ${SUELO - 1} M30 70 L40 70 M78 70 L88 70`)}</g>`,
    escalon: `<rect x="66" y="96" width="30" height="${SUELO - 96}" fill="#2a2440" stroke="#0d0b12" stroke-width="1"/><rect x="67" y="96.6" width="28" height="1.4" fill="#3d3560"/>`,
    colchoneta: `<rect x="10" y="100.6" width="100" height="${SUELO - 100.6}" rx="1" fill="#2a2148" stroke="#0d0b12" stroke-width="1"/><rect x="11" y="101" width="98" height="1" fill="#3a2f62"/>`,

    // ===== (v168) Las máquinas de los movimientos nuevos =====
    "banco-libre": marco(`M30 84 L30 ${SUELO} M80 84 L80 ${SUELO} M26 ${SUELO - 1} L36 ${SUELO - 1} M74 ${SUELO - 1} L86 ${SUELO - 1} M30 90 L80 90`) + almohadilla(22, 79.6, 68, 4.6),
    "banco-inclinado": marco(`M66 87 L66 ${SUELO} M56 ${SUELO - 1} L76 ${SUELO - 1} M54 84 L44 ${SUELO - 1} M38 ${SUELO - 1} L50 ${SUELO - 1}`)
        + respaldo(CADERA_INCLINADO, -130, -1, 27) + almohadilla(54, 82.2, 22, 4.4),
    "banco-declinado": marco(`M48 92 L48 ${SUELO} M78 80 L78 ${SUELO} M95 81 L95 ${SUELO} M42 ${SUELO - 1} L100 ${SUELO - 1} M40 50 L40 ${SUELO} M35 ${SUELO - 1} L45 ${SUELO - 1}`)
        + marco("M40 54 L44 54 L44 51", 1.6) + respaldo([70, 72], -70, -3, 34) + almohadillaEntre([75.3, 77.7], [86.8, 71.6], 4.6) + rodillo([94.8, 79.4]),
    "pec-deck": marco(`M26 10 L26 ${SUELO} M94 10 L94 ${SUELO} M24 10 L96 10 M22 ${SUELO - 1} L30 ${SUELO - 1} M90 ${SUELO - 1} L98 ${SUELO - 1} M26 30 L47 30 M73 30 L94 30`) + ASIENTO,
    "poleas-dobles": marco(`M0 4 L0 ${SUELO} M15 4 L15 ${SUELO} M-2 4 L17 4 M105 4 L105 ${SUELO} M120 4 L120 ${SUELO} M103 4 L122 4 M-2 ${SUELO - 1} L17 ${SUELO - 1} M103 ${SUELO - 1} L122 ${SUELO - 1}`)
        + marco("M15 18 L16.5 18 M105 18 L103.5 18", 1.4) + ruedaDePolea([16.5, 18]) + ruedaDePolea([103.5, 18]) + ruedaDePolea([7.5, 6], 2.2) + ruedaDePolea([112.5, 6], 2.2)
        + cable([7.5, 3.8], [16.5, 15.4]) + cable([112.5, 3.8], [103.5, 15.4]),
    "polea-cara": torreDePolea(29),
    "banco-plano": marco(`M22 88 L22 ${SUELO} M86 88 L86 ${SUELO} M18 ${SUELO - 1} L26 ${SUELO - 1} M82 ${SUELO - 1} L90 ${SUELO - 1}`) + almohadilla(16, 84.4, 76, 4.4),
    "banco-corto": marco(`M7 88 L7 ${SUELO} M32 88 L32 ${SUELO} M3 ${SUELO - 1} L11 ${SUELO - 1} M28 ${SUELO - 1} L36 ${SUELO - 1}`) + almohadilla(1, 84.4, 36, 4.4),
    paralelas: marco(`M40 64 L40 ${SUELO} M80 64 L80 ${SUELO} M34 ${SUELO - 1} L46 ${SUELO - 1} M74 ${SUELO - 1} L86 ${SUELO - 1}`) + marco("M34 63 L86 63", 2),
    scott: marco(`M44 85 L44 ${SUELO} M36 ${SUELO - 1} L52 ${SUELO - 1} M56 70 L62 ${SUELO} M56 ${SUELO - 1} L70 ${SUELO - 1}`) + almohadilla(34, 80.5, 20, 4.4),
    "pec-deck-inverso": marco(`M26 10 L26 ${SUELO} M94 10 L94 ${SUELO} M24 10 L96 10 M22 ${SUELO - 1} L30 ${SUELO - 1} M90 ${SUELO - 1} L98 ${SUELO - 1} M26 30 L47 30 M73 30 L94 30`)
        + marco(`M60 88 L60 ${SUELO} M50 ${SUELO - 1} L70 ${SUELO - 1}`) + almohadilla(44, 84, 32, 4.4),
    "barra-frente": marco(`M18 6 L18 ${SUELO} M102 6 L102 ${SUELO} M14 ${SUELO - 1} L22 ${SUELO - 1} M98 ${SUELO - 1} L106 ${SUELO - 1}`) + barraRecta([18, 13.5], [102, 13.5], 1.8),
    "barra-lado": marco(`M94 1 L94 ${SUELO} M88 ${SUELO - 1} L100 ${SUELO - 1} M47 2 L94 2 M49 2 L49 4`) + puntaDeBarra([48.8, 5.8]),
    hiperextension: marco(`M54 70 L64 ${SUELO} M30 95 L36 ${SUELO} M23 83 L18 87 L18 ${SUELO} M12 ${SUELO - 1} L70 ${SUELO - 1}`)
        + almohadillaEntre([49.7, 72.9], [58.2, 64.4], 4.6) + marco("M22.4 88.2 L30.9 96.7", 2.2) + rodillo([23, 83]),
    prensa: marco(`M56 85 L108 33 M44 94 L44 ${SUELO} M24 80 L24 ${SUELO} M62 79 L62 ${SUELO} M100 41 L100 ${SUELO} M14 ${SUELO - 1} L112 ${SUELO - 1}`, 2)
        + respaldo([44, 86], -124, -3, 30) + almohadillaEntre([37, 91.6], [52, 90.2], 4.4),
    extension: marco(`M50 87 L50 ${SUELO} M40 ${SUELO - 1} L76 ${SUELO - 1} M70 79 L72 87 L72 ${SUELO} M52 86 L57 86`)
        + respaldo([48, 78], 190, -1, 22) + almohadilla(36, 82, 32, 4.4) + ruedaDePolea([69.5, 78.7], 2.2),
    "femoral-sentado": marco(`M48 85 L48 ${SUELO} M36 ${SUELO - 1} L82 ${SUELO - 1} M74 62 L74 ${SUELO} M67.5 76 L74 76 M66 67.4 L74 66`)
        + respaldo([46, 76], 192, -1, 22) + almohadilla(32, 80.4, 32, 4.4) + almohadilla(55, 65.2, 13, 4.2) + ruedaDePolea([67.5, 76], 2.2),
    nordico: `<rect x="30" y="99.4" width="32" height="${SUELO - 99.4}" rx="1" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><rect x="31" y="99.9" width="30" height="1" fill="${CUERO.base}"/>`
        + marco(`M22 92 L22 ${SUELO} M16 ${SUELO - 1} L28 ${SUELO - 1} M22 93 L28.5 93`, 1.8) + rodillo([28.5, 93], 2.6),
    "femoral-pie": marco(`M72 34 L72 ${SUELO} M64 ${SUELO - 1} L86 ${SUELO - 1} M67 52 L72 52 M66 74 L72 74 M57 81.4 L72 81.4 M72 34 L78 30`, 2)
        + almohadilla(63, 44, 4.4, 16) + almohadilla(61.5, 68, 4.4, 12) + ruedaDePolea([57, 81.4], 2),
    "talones-sentado": marco(`M44 84 L44 ${SUELO} M34 ${SUELO - 1} L100 ${SUELO - 1} M92 90 L92 ${SUELO}`) + almohadilla(32, 79.6, 24, 4.4)
        + `<rect x="68" y="96" width="14" height="${SUELO - 96}" fill="#2a2440" stroke="#0d0b12" stroke-width="1"/><rect x="69" y="96.6" width="12" height="1.4" fill="#3d3560"/>` + ruedaDePolea([92, 90], 2.2),
    burro: `<rect x="58" y="96" width="28" height="${SUELO - 96}" fill="#2a2440" stroke="#0d0b12" stroke-width="1"/><rect x="59" y="96.6" width="26" height="1.4" fill="#3d3560"/>`
        + marco(`M96 70 L96 ${SUELO} M88 ${SUELO - 1} L104 ${SUELO - 1}`) + almohadilla(84, 65.6, 24, 4.4),
    "polea-suelo": torreDePolea(97),
    hack: marco(`M24.1 35.5 L65.4 94.5 M24 36 L24 ${SUELO} M18 ${SUELO - 1} L92 ${SUELO - 1}`, 2.2)
        + `<path d="M60 ${SUELO} L90 96.6 L90 ${SUELO}Z" fill="${HIERRO.sombra}" stroke="#0d0b12" stroke-width="1"/><path d="M62 ${SUELO - 0.6} L89 97.4" stroke="${HIERRO.luz}" stroke-width="1"/>`,
};
// (v168) Los nombres de los fondos que existen (las pruebas revisan que cada movimiento use uno de ellos).
export const NOMBRES_DE_FONDOS = Object.keys(MAQUINAS);
