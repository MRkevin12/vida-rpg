// dibujo-ejercicios.js — Las figuras que hacen cada ejercicio (v77): una demostración animada para que veas el movimiento.
//
// Cada ejercicio de gym.js tiene un MOVIMIENTO (gym.MOVIMIENTO_DE). Aquí hay 13 movimientos dibujados con una figura sencilla
// (de lado o de frente) con tu color de piel y de pelo. Cada uno es un par de poses: la de ARRIBA (a) y la de ABAJO (b), con las
// coordenadas de las articulaciones; la animación pasa de una a otra y vuelve (animaciones SMIL de SVG: funcionan en Safari y
// Chrome del iPhone y no hace falta JavaScript para moverlas).
//
// Lienzo: 120 × 100. El suelo está en y = 92. La figura de pie mide unos 80 de alto.
//
// Articulaciones (de lado): S hombro · H cadera · E codo · M mano · K rodilla · A tobillo · T punta del pie · c cabeza.
// De frente: lo mismo con 1 (izquierda) y 2 (derecha). Este archivo solo devuelve texto SVG: no guarda nada.

import { APARIENCIA } from "./avatar.js";

const CONTORNO = "#1a0f08";
const CALZONCILLO = "#2d3b63";
const HIERRO = "#aab4cc";
const DISCO = "#2a2440";

const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const trazoD = (puntos) => `M${puntos.map((p) => p.join(" ")).join(" L")}`;
const ANIM = `calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" repeatCount="indefinite"`;

// Una línea gruesa que pasa por varios puntos, de la pose a a la pose b.
function trazo(a, b, color, ancho, animar, dur, contorno = true) {
    const da = trazoD(a);
    const movimiento = animar ? `<animate attributeName="d" values="${da};${trazoD(b)};${da}" dur="${dur}s" ${ANIM}/>` : "";
    const linea = (c, w) => `<path d="${da}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${movimiento}</path>`;
    return (contorno ? linea(CONTORNO, ancho + 1.8) : "") + linea(color, ancho);
}

// Un dibujo que se mueve entero (la cabeza, una pesa…) de la posición a a la b. El dibujo está centrado en (0, 0).
function rigido(a, b, dibujo, animar, dur) {
    const mover = animar ? `<animateTransform attributeName="transform" type="translate" values="${a.join(" ")};${b.join(" ")};${a.join(" ")}" dur="${dur}s" ${ANIM}/>` : "";
    return `<g transform="translate(${a.join(" ")})">${mover}${dibujo}</g>`;
}

const pesa = (r = 3.4) => `<circle r="${r}" fill="${DISCO}" stroke="${HIERRO}" stroke-width="1"/><circle r="${r * 0.35}" fill="${HIERRO}"/>`;
const discoGrande = () => `<circle r="5" fill="${DISCO}" stroke="${HIERRO}" stroke-width="1.1"/><circle r="1.6" fill="${HIERRO}"/>`;

function cabeza(pelo, frente) {
    const ojos = frente ? '<circle cx="-2.2" cy="0.4" r=".7" fill="#1a0f08"/><circle cx="2.2" cy="0.4" r=".7" fill="#1a0f08"/>' : '<circle cx="2.8" cy="0.2" r=".75" fill="#1a0f08"/>';
    const cabello = frente
        ? `<path d="M-5.9 0 A5.9 5.9 0 0 1 5.9 0 Q0 -3.6 -5.9 0 Z" fill="${pelo}"/>`
        : `<path d="M-5.9 1.4 A5.9 5.9 0 0 1 4.6 -3.6 L2.2 -1.4 Q-2 -3 -5.9 1.4 Z" fill="${pelo}"/>`;
    return { cuerpo: (piel) => `<circle r="5.6" fill="${piel}" stroke="${CONTORNO}" stroke-width=".9"/>${cabello}${ojos}` };
}

// ===== Las poses =====
// Cada una trae a (arriba) y b (abajo) con sus articulaciones, y lo que va con ellas: fijos (lo que no se mueve, como el banco),
// extras (cables y barras que se estiran: [puntos en a, puntos en b, grosor]) y pesas (a qué articulación van pegadas).
const DE_PIE = { c: [60, 17], S: [60, 26], H: [60, 48], K: [60, 68], A: [60, 88], T: [68, 89] };
const SUELO = '<path d="M4 92 H116" stroke="#3a2c68" stroke-width="1.4"/>';

const MOVIMIENTOS = {
    // De lado, de pie: solo se mueve el antebrazo.
    curl: {
        vista: "lado", fijos: SUELO,
        a: { ...DE_PIE, E: [60, 38], M: [61, 49] }, b: { ...DE_PIE, E: [61, 38], M: [70, 31] },
        pesas: ["M"],
    },
    // De lado, de pie, con cable: el codo quieto y el antebrazo sube y baja.
    triceps: {
        vista: "lado", fijos: `${SUELO}<path d="M86 4 L86 92" stroke="#3a2c68" stroke-width="2.4"/><rect x="82" y="2" width="8" height="5" rx="1.5" fill="#4a3d78"/>`,
        a: { ...DE_PIE, E: [64, 37], M: [70, 27] }, b: { ...DE_PIE, E: [64, 37], M: [66, 48] },
        extras: [[[[86, 5], [70, 27]], [[86, 5], [66, 48]], 0.9]], pesas: [],
    },
    // De lado, de pie: los brazos empujan hacia arriba.
    press_vertical: {
        vista: "lado", fijos: SUELO,
        a: { ...DE_PIE, E: [66, 33], M: [63, 23] }, b: { ...DE_PIE, E: [62, 16], M: [61, 7] },
        pesas: ["M"],
    },
    // Tumbado en el banco: empuja hacia arriba.
    press_horizontal: {
        vista: "lado",
        fijos: `${SUELO}<rect x="24" y="70" width="66" height="4.4" rx="1.5" fill="#4a3d78" stroke="#8a7ac8" stroke-width=".6"/><path d="M32 74 L32 92 M82 74 L82 92" stroke="#3a2c68" stroke-width="2.4"/>`,
        a: { c: [33, 62], S: [43, 64], H: [70, 64], K: [84, 58], A: [86, 86], T: [93, 89], E: [51, 58], M: [44, 51] },
        b: { c: [33, 62], S: [43, 64], H: [70, 64], K: [84, 58], A: [86, 86], T: [93, 89], E: [44, 52], M: [44, 41] },
        pesas: ["M"], disco: true,
    },
    // De frente, de pie: los brazos suben a los lados.
    elevacion_lateral: {
        vista: "frente", fijos: SUELO,
        a: { c: [60, 20], S1: [50, 31], S2: [70, 31], H1: [55, 60], H2: [65, 60], K1: [55, 75], K2: [65, 75], A1: [55, 90], A2: [65, 90], E1: [47, 43], E2: [73, 43], M1: [46, 55], M2: [74, 55] },
        b: { c: [60, 20], S1: [50, 31], S2: [70, 31], H1: [55, 60], H2: [65, 60], K1: [55, 75], K2: [65, 75], A1: [55, 90], A2: [65, 90], E1: [38, 32], E2: [82, 32], M1: [27, 33], M2: [93, 33] },
        pesas: ["M1", "M2"],
    },
    // De frente, sentado: tira de la barra hacia el pecho.
    jalon: {
        vista: "frente",
        fijos: `${SUELO}<rect x="44" y="62" width="32" height="4" rx="1.5" fill="#4a3d78"/><path d="M60 0 L60 3" stroke="#cfd6e8" stroke-width=".9"/>`,
        a: { c: [60, 24], S1: [50, 34], S2: [70, 34], H1: [54, 60], H2: [66, 60], K1: [47, 64], K2: [73, 64], A1: [47, 88], A2: [73, 88], E1: [40, 20], E2: [80, 20], M1: [36, 6], M2: [84, 6] },
        b: { c: [60, 24], S1: [50, 34], S2: [70, 34], H1: [54, 60], H2: [66, 60], K1: [47, 64], K2: [73, 64], A1: [47, 88], A2: [73, 88], E1: [41, 45], E2: [79, 45], M1: [46, 35], M2: [74, 35] },
        extras: [[[[60, 0], [60, 6]], [[60, 0], [60, 35]], 0.9], [["M1", "M2"], ["M1", "M2"], 2.4]], pesas: [],
    },
    // De lado, sentado: tira del cable hacia el abdomen.
    remo: {
        vista: "lado",
        fijos: `${SUELO}<rect x="42" y="66" width="20" height="4" rx="1.5" fill="#4a3d78"/><path d="M96 58 L96 80" stroke="#8a7ac8" stroke-width="2.4"/><path d="M106 30 L106 92" stroke="#3a2c68" stroke-width="2.6"/>`,
        a: { c: [52, 31], S: [52, 40], H: [52, 64], K: [72, 60], A: [90, 68], T: [96, 70], E: [66, 44], M: [80, 46] },
        b: { c: [52, 31], S: [52, 40], H: [52, 64], K: [72, 60], A: [90, 68], T: [96, 70], E: [45, 51], M: [58, 52] },
        extras: [[[[106, 46], [80, 46]], [[106, 46], [58, 52]], 0.9]], pesas: [],
    },
    // De lado: baja la cadera y las rodillas se doblan.
    sentadilla: {
        vista: "lado", fijos: SUELO,
        a: { ...DE_PIE, E: [66, 32], M: [74, 30] },
        b: { c: [68, 38], S: [62, 46], H: [50, 64], K: [70, 68], A: [60, 88], T: [68, 89], E: [70, 47], M: [80, 45] },
        pesas: [],
    },
    // De lado: la cadera va hacia atrás y el torso se inclina con la barra pegada a las piernas.
    bisagra: {
        vista: "lado", fijos: SUELO,
        a: { ...DE_PIE, E: [61, 38], M: [62, 50] },
        b: { c: [82, 39], S: [73, 43], H: [52, 50], K: [58, 68], A: [60, 88], T: [68, 89], E: [74, 54], M: [73, 66] },
        pesas: ["M"], disco: true,
    },
    // Boca abajo en el banco: el talón sube hacia el glúteo.
    curl_femoral: {
        vista: "lado",
        fijos: `${SUELO}<rect x="22" y="70" width="64" height="4.4" rx="1.5" fill="#4a3d78" stroke="#8a7ac8" stroke-width=".6"/><path d="M30 74 L30 92 M78 74 L78 92" stroke="#3a2c68" stroke-width="2.4"/>`,
        a: { c: [30, 63], S: [40, 66], H: [66, 66], K: [82, 66], A: [100, 67], T: [105, 67], E: [36, 71], M: [29, 71] },
        b: { c: [30, 63], S: [40, 66], H: [66, 66], K: [82, 66], A: [82, 44], T: [87, 41], E: [36, 71], M: [29, 71] },
        pesas: [],
    },
    // De lado, de pie: sube sobre las puntas de los pies.
    talones: {
        vista: "lado", fijos: SUELO,
        a: { ...DE_PIE, E: [60, 38], M: [61, 50] },
        b: { c: [60, 11], S: [60, 20], H: [60, 42], K: [60, 62], A: [60, 82], T: [68, 89], E: [60, 32], M: [61, 44] },
        pesas: ["M"],
    },
    // Tumbado en el suelo: enrolla el torso hacia las rodillas.
    abdominales: {
        vista: "lado",
        fijos: '<path d="M4 92 H116" stroke="#3a2c68" stroke-width="1.4"/><rect x="14" y="89.4" width="100" height="2.6" rx="1.3" fill="#3a3060"/>',
        a: { c: [29, 83], S: [38, 85], H: [64, 85], K: [78, 69], A: [88, 86], T: [95, 88], E: [37, 78], M: [31, 82] },
        b: { c: [40, 66], S: [46, 74], H: [64, 85], K: [78, 69], A: [88, 86], T: [95, 88], E: [47, 67], M: [41, 70] },
        pesas: [],
    },
    // De frente, de pie: los hombros suben hacia las orejas.
    encogimiento: {
        vista: "frente", fijos: SUELO,
        a: { c: [60, 20], S1: [50, 31], S2: [70, 31], H1: [55, 60], H2: [65, 60], K1: [55, 75], K2: [65, 75], A1: [55, 90], A2: [65, 90], E1: [47, 43], E2: [73, 43], M1: [46, 56], M2: [74, 56] },
        b: { c: [60, 19], S1: [50, 26], S2: [70, 26], H1: [55, 60], H2: [65, 60], K1: [55, 75], K2: [65, 75], A1: [55, 90], A2: [65, 90], E1: [47, 38], E2: [73, 38], M1: [46, 51], M2: [74, 51] },
        pesas: ["M1", "M2"],
    },
};

export const LISTA_DE_MOVIMIENTOS = Object.keys(MOVIMIENTOS);

// Resuelve los puntos de un extra: pueden ser coordenadas o nombres de articulación ("M1").
const punto = (p, pose) => (typeof p === "string" ? pose[p] : p);

// El dibujo de un movimiento. apariencia = la del avatar (piel y pelo); animar = false deja solo la pose de arriba.
export function dibujarMovimiento(clave, apariencia = {}, { animar = true, dur = 2.4 } = {}) {
    const def = MOVIMIENTOS[clave] || MOVIMIENTOS.curl;
    const piel = (APARIENCIA.piel[apariencia.piel] || APARIENCIA.piel.media).color;
    const pelo = (APARIENCIA.pelo[apariencia.pelo] || APARIENCIA.pelo.castano).color;
    const { a, b } = def;
    const frente = def.vista === "frente";
    const pieces = [];
    const t = (pa, pb, color, ancho, contorno) => trazo(pa, pb, color, ancho, animar, dur, contorno);

    if (frente) {
        const medio = (pose, p, q) => lerp(pose[p], pose[q], 0.5);
        // Piernas, torso, calzoncillos, hombros, brazos.
        for (const n of ["1", "2"]) pieces.push(t([a["H" + n], a["K" + n], a["A" + n]], [b["H" + n], b["K" + n], b["A" + n]], piel, 6));
        pieces.push(t([medio(a, "S1", "S2"), medio(a, "H1", "H2")], [medio(b, "S1", "S2"), medio(b, "H1", "H2")], piel, 15));
        for (const n of ["1", "2"]) pieces.push(t([a["H" + n], lerp(a["H" + n], a["K" + n], 0.4)], [b["H" + n], lerp(b["H" + n], b["K" + n], 0.4)], CALZONCILLO, 8, false));
        pieces.push(t([a.H1, a.H2], [b.H1, b.H2], CALZONCILLO, 12, false));
        pieces.push(t([a.S1, a.S2], [b.S1, b.S2], piel, 6));
        for (const n of ["1", "2"]) pieces.push(t([a["S" + n], a["E" + n], a["M" + n]], [b["S" + n], b["E" + n], b["M" + n]], piel, 4.6));
    } else {
        pieces.push(t([a.H, a.K, a.A, a.T], [b.H, b.K, b.A, b.T], piel, 6.4));
        pieces.push(t([a.S, a.H], [b.S, b.H], piel, 10));
        pieces.push(t([a.H, lerp(a.H, a.K, 0.45)], [b.H, lerp(b.H, b.K, 0.45)], CALZONCILLO, 9.4, false));
        pieces.push(t([a.S, a.E, a.M], [b.S, b.E, b.M], piel, 4.6));
    }
    // Barras y cables.
    for (const [ea, eb, grosor] of def.extras || []) {
        pieces.push(trazo(ea.map((p) => punto(p, a)), eb.map((p) => punto(p, b)), HIERRO, grosor, animar, dur, false));
    }
    // Pesas pegadas a las manos.
    for (const j of def.pesas || []) pieces.push(rigido(a[j], b[j], def.disco ? discoGrande() : pesa(), animar, dur));
    pieces.push(rigido(a.c, b.c, cabeza(pelo, frente).cuerpo(piel), animar, dur));

    return `<svg class="gym-demo-svg" viewBox="0 0 120 100" role="img" aria-label="Así se hace: ${clave.replaceAll("_", " ")}" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="100" rx="8" fill="#150f2a"/><rect x="0" y="0" width="120" height="100" rx="8" fill="none" stroke="#3a2c68" stroke-width="1"/>
        ${def.fijos || ""}${pieces.join("")}</svg>`;
}
