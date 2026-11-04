// dibujo-ejercicios-piezas.js — Las piezas con que se arman las figuras del gym: medidas del esqueleto, cuentas con
// puntos, cinemática inversa (articulacion), colores, partes del cuerpo (torso, cabeza, brazos, piernas),
// pesas, máquinas y cómo poner un cuerpo de lado o de frente.
//
// Salió de dibujo-ejercicios.js, que lo reexporta (`export *`). Los movimientos están en dibujo-ejercicios-movimientos.js.

import { APARIENCIA } from "./avatar.js";


export const ANCHO = 120;
export const ALTO = 110;
export const SUELO = 104;
// El largo de cada hueso (en puntos). Una persona de pie mide unos 81 puntos (7,5 cabezas).
export const MEDIDAS = { cuello: 2.5, torso: 25, brazo: 14, antebrazo: 12, muslo: 20, pierna: 19.5, tobillo: 2.8 };

// ===== Cuentas con puntos [x, y] =====
export const rad = (grados) => (grados * Math.PI) / 180;
export const dir = (grados) => [Math.sin(rad(grados)), Math.cos(rad(grados))];   // un paso de largo 1 en esa dirección
export const sumar = (p, v, largo = 1) => [p[0] + v[0] * largo, p[1] + v[1] * largo];
export const restar = (p, q) => [p[0] - q[0], p[1] - q[1]];
const largoDe = (v) => Math.hypot(v[0], v[1]);
export const unitario = (v) => { const l = largoDe(v) || 1; return [v[0] / l, v[1] / l]; };
export const mezcla = (a, b, u) => a + (b - a) * u;
export const mezclaP = (p, q, u) => [mezcla(p[0], q[0], u), mezcla(p[1], q[1], u)];
export const n1 = (x) => Math.round(x * 10) / 10;
const pt = (p) => `${n1(p[0])} ${n1(p[1])}`;
// La luz viene de arriba y un poco de adelante (de la derecha): lo que mira hacia ella se ve más claro.
const LUZ = unitario([0.45, -1]);

// Una curva suave y cerrada que pasa por todos los puntos (curva de Catmull-Rom convertida a curvas de Bézier).
export function curvaCerrada(puntos) {
    const n = puntos.length;
    let d = `M${pt(puntos[0])}`;
    for (let i = 0; i < n; i++) {
        const [p0, p1, p2, p3] = [puntos[(i - 1 + n) % n], puntos[i], puntos[(i + 1) % n], puntos[(i + 2) % n]];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
    }
    return `${d}Z`;
}

// ===== Cinemática inversa =====
// El hombro está en a y la mano tiene que llegar a b. Los huesos miden l1 y l2. ¿Dónde cae el codo?
// Con la ley de los cosenos se calcula cuánto avanza el codo por la línea a→b (x) y cuánto se aparta de ella (y).
// lado = 1 o -1: hacia qué lado de la línea se dobla. Si b queda muy lejos, el brazo se estira derecho hacia b.
export function articulacion(a, b, l1, l2, lado) {
    const eje = unitario(restar(b, a));
    const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(largoDe(restar(b, a)), l1 + l2 - 0.01));
    const x = (d * d + l1 * l1 - l2 * l2) / (2 * d);
    const y = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    return sumar(sumar(a, eje, x), [-eje[1] * lado, eje[0] * lado], y);
}

// Un brazo con sus dos ángulos (hombro y codo) o con la mano puesta en un lugar (el codo se busca solo).
export const brazo = (S, angulo1, angulo2) => {
    const E = sumar(S, dir(angulo1), MEDIDAS.brazo);
    return { S, E, M: sumar(E, dir(angulo2), MEDIDAS.antebrazo) };
};
export const brazoHacia = (S, objetivo, lado) => {
    const E = articulacion(S, objetivo, MEDIDAS.brazo, MEDIDAS.antebrazo, lado);
    return { S, E, M: sumar(E, unitario(restar(objetivo, E)), MEDIDAS.antebrazo) };
};
export const piernaHacia = (H, objetivo, lado) => {
    const K = articulacion(H, objetivo, MEDIDAS.muslo, MEDIDAS.pierna, lado);
    return { H, K, A: sumar(K, unitario(restar(objetivo, K)), MEDIDAS.pierna) };
};

// El cuerpo de pie, armado desde el tobillo (así los pies no se mueven del suelo).
// espinilla: cuánto se va la rodilla hacia adelante; muslo: cuánto se va la cadera hacia atrás; torso: cuánto se inclina el pecho.
export function dePie(A, { espinilla = 0, muslo = 0, torso = 0 } = {}) {
    const K = sumar(A, dir(180 - espinilla), MEDIDAS.pierna);
    const H = sumar(K, dir(180 + muslo), MEDIDAS.muslo);
    const S = sumar(H, dir(180 - torso), MEDIDAS.torso);
    return { H, S, piernas: [{ H, K, A, planta: [1, 0] }] };
}
export const tobilloEn = (x) => [x, SUELO - MEDIDAS.tobillo];

// De frente: las caderas, los hombros y las piernas a partir del centro (x) de la persona.
// sentado: las piernas vienen hacia ti (los muslos se ven cortos). subir: cuánto suben los hombros (encogimientos).
export function deFrente(x, { sentado = false, subir = 0 } = {}) {
    const yCadera = sentado ? 82 : SUELO - MEDIDAS.tobillo - MEDIDAS.pierna - MEDIDAS.muslo;
    const yHombro = yCadera - MEDIDAS.torso;
    const lados = [-1, 1].map((s) => {
        const H = [x + s * 5, yCadera];
        const A = [x + s * (sentado ? 9 : 5.5), SUELO - MEDIDAS.tobillo];
        const K = sentado ? [x + s * 8.4, yCadera + 4.6] : [x + s * 5.3, A[1] - MEDIDAS.pierna];
        return { s, H, K, A, S: [x + s * 10.5, yHombro - subir] };
    });
    return { centro: x, yCadera, yHombro, N: [x, yHombro - MEDIDAS.cuello], lados, subir };
}

// ===== Los colores =====
const CONTORNO = "#160d1c";
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const aHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const mezclarColor = (a, b, t) => aHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

// Un material: base (la parte iluminada), sombra, luz (el brillo) y línea (el trazo de adentro, más oscuro).
const material = (base, sombra, luz, linea) => ({ base, sombra, luz, linea });
export const HIERRO = material("#4a5163", "#2b2f3a", "#9aa3b5", "#15131c");
export const ACERO = material("#8d97ad", "#596178", "#d5dbe8", "#15131c");
export const DISCO = material("#26232f", "#17151e", "#4b475c", "#0b0a10");
export const CUERO = material("#5a2a35", "#3d1b24", "#7d3b4a", "#1a0b11");
export const SHORT = material("#2c3555", "#1d2440", "#3e4a72", "#0f1328");
const TOP = material("#33283f", "#221a2c", "#4a3c5c", "#110b17");   // el top deportivo (cuerpo femenino)
const CABLE = "#a9b1c4";

// Los colores de tu piel y de tu pelo, y los de las partes del lado de atrás (más oscuras: están en la sombra).
export function paletaDe(apariencia = {}) {
    const piel = APARIENCIA.piel[apariencia.piel] || APARIENCIA.piel.media;
    const pelo = (APARIENCIA.pelo[apariencia.pelo] || APARIENCIA.pelo.castano).color;
    const linea = mezclarColor(piel.sombra, "#1a0f08", 0.5);
    return {
        piel: material(piel.color, piel.sombra, mezclarColor(piel.color, "#ffffff", 0.24), linea),
        lejos: material(piel.sombra, mezclarColor(piel.sombra, "#1a0f08", 0.28), null, linea),
        pelo: material(pelo, mezclarColor(pelo, "#000000", 0.35), mezclarColor(pelo, "#ffffff", 0.2), mezclarColor(pelo, "#000000", 0.6)),
        ojo: "#1a1218",
        femenino: apariencia.cuerpo === "femenino",
        peinado: apariencia.peinado || "corto",
        barba: apariencia.barba || "ninguna",
    };
}

// ===== Las piezas del cuerpo =====

// Una cápsula entre p y q (redonda en las puntas) con radios rp y rq. Los bultos ensanchan el medio hacia adelante
// (frente) y hacia atrás: así se forman el bíceps, el cuádriceps o la pantorrilla. mira = -1 da vuelta "adelante".
function capsula(p, q, rp, rq, frente = 0, atras = 0, mira = 1) {
    const eje = unitario(restar(q, p));
    const n = [eje[1] * mira, -eje[0] * mira];
    const medio = mezclaP(p, q, 0.45);
    const radio = (rp + rq) / 2;
    const [p1, q1, q2, p2] = [sumar(p, n, rp), sumar(q, n, rq), sumar(q, n, -rq), sumar(p, n, -rp)];
    const [c1, c2] = [sumar(medio, n, radio + frente), sumar(medio, n, -(radio + atras))];
    const barrido = mira === 1 ? 1 : 0;
    return `M${pt(p1)} Q${pt(c1)} ${pt(q1)} A${n1(rq)} ${n1(rq)} 0 0 ${barrido} ${pt(q2)} Q${pt(c2)} ${pt(p2)} A${n1(rp)} ${n1(rp)} 0 0 ${barrido} ${pt(p1)}Z`;
}

// Una parte con volumen: primero toda en sombra (con su línea), encima la parte iluminada (más chica y corrida hacia
// la luz) y un brillo. Es como se sombrea a mano un sprite: dos o tres tonos del mismo color, sin degradados.
export function parte(p, q, rp, rq, color, { frente = 0, atras = 0, mira = 1 } = {}) {
    const eje = unitario(restar(q, p));
    const n = [eje[1] * mira, -eje[0] * mira];
    const hacia = n[0] * LUZ[0] + n[1] * LUZ[1];   // -1 a 1: cuánto mira "adelante" hacia la luz
    let svg = `<path d="${capsula(p, q, rp, rq, frente, atras, mira)}" fill="${color.sombra}" stroke="${color.linea}" stroke-width="1"/>`;
    const k = 0.7;
    const corre = (punto, r) => sumar(punto, n, hacia * r * (1 - k));
    svg += `<path d="${capsula(corre(p, rp), corre(q, rq), rp * k, rq * k, frente * k, atras * k, mira)}" fill="${color.base}"/>`;
    if (color.luz) {
        const brillo = (punto, r) => sumar(punto, n, hacia * r * 0.5);
        svg += `<path d="${capsula(brillo(mezclaP(p, q, 0.12), rp), brillo(mezclaP(p, q, 0.7), rq), rp * 0.3, rq * 0.25, frente * 0.3, 0, mira)}" fill="${color.luz}"/>`;
    }
    return svg;
}

// Un círculo con volumen (hombros, puños, rodillas).
export function bola(c, r, color) {
    const corrido = sumar(c, LUZ, r * 0.22);
    let svg = `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${n1(r)}" fill="${color.sombra}" stroke="${color.linea}" stroke-width="1"/>`;
    svg += `<circle cx="${n1(corrido[0])}" cy="${n1(corrido[1])}" r="${n1(r * 0.74)}" fill="${color.base}"/>`;
    if (color.luz) {
        const b = sumar(c, LUZ, r * 0.48);
        svg += `<circle cx="${n1(b[0])}" cy="${n1(b[1])}" r="${n1(Math.max(0.7, r * 0.28))}" fill="${color.luz}"/>`;
    }
    return svg;
}

// Un punto de pixel art exacto (los ojos, las cejas): un cuadrito de 1 × 1 en la casilla donde cae p.
const punto = (p, color) => `<rect x="${Math.floor(p[0])}" y="${Math.floor(p[1])}" width="1" height="1" fill="${color}"/>`;

// El pie: del tobillo A sale hacia "planta" (del talón a la punta). abajo = hacia la suela.
export function pie(A, planta, color, mira = 1) {
    const abajo = [-planta[1] * mira, planta[0] * mira];
    const P = (adelante, hacia) => sumar(sumar(A, planta, adelante), abajo, hacia);
    const puntos = [P(-1.6, -1.2), P(-2.6, 1.0), P(-2.0, 2.7), P(3, 2.8), P(8.2, 2.7), P(8.6, 1.6), P(6.4, 0.4), P(3.2, -0.6), P(1.2, -1.6)];
    const d = curvaCerrada(puntos);
    return `<path d="${d}" fill="${color.sombra}" stroke="${color.linea}" stroke-width="1"/>
        <path d="${curvaCerrada([P(-1.2, -0.8), P(-1.8, 0.8), P(2.6, 1.6), P(7.4, 1.6), P(6, 0.4), P(3, -0.4), P(1, -1.2)])}" fill="${color.base}"/>`;
}

// El puño: una bola al final del antebrazo.
export const puno = (brazoX, color) => bola(sumar(brazoX.M, unitario(restar(brazoX.M, brazoX.E)), 1.5), 2.1, color);
export const centroDelPuno = (brazoX) => sumar(brazoX.M, unitario(restar(brazoX.M, brazoX.E)), 1.6);

// Un brazo entero: hombro (deltoides), brazo con bíceps, antebrazo y puño. k = cuánto músculo (según tu nivel de gym).
// El hombro va primero (detrás): así el brazo lo tapa en parte y se ve redondo, no como una bola pegada.
// biceps: cuánto se marca el bíceps (más en la pose de la victoria).
export function brazoEntero(b, color, k, mira = 1, { biceps = 0.9, conPuno = true } = {}) {
    return bola(sumar(b.S, unitario(restar(b.E, b.S)), 0.6), 3.5 * k, color)
        + parte(b.S, b.E, 3.3 * k, 2.4 * k, color, { frente: biceps * k, atras: 0.5 * k, mira })
        + parte(b.E, b.M, 2.5 * k, 1.7, color, { frente: 0.3, atras: 0.9 * k, mira })
        + (conPuno ? puno(b, color) : "");
}

// Una pierna entera: muslo con cuádriceps, pantorrilla y pie.
function piernaEntera(l, color, k, mira = 1) {
    const espinilla = unitario(restar(l.A, l.K));
    const planta = l.planta || [espinilla[1] * mira, -espinilla[0] * mira];
    return parte(l.H, l.K, 5.6 * k, 3.3, color, { frente: 1.3 * k, atras: 0.6, mira })
        + parte(l.K, l.A, 3.1, 2.0, color, { frente: 0, atras: 1.7 * k, mira })
        + pie(l.A, planta, color, mira);
}

// El short: tapa la cadera y la parte de arriba del muslo (ajustado, no como un globo).
const pernera = (l, k, mira = 1) => parte(l.H, mezclaP(l.H, l.K, 0.36), 5.8 * k, 4.6 * k, SHORT, { frente: 0.2, mira });

// ===== El torso de lado =====
// Los puntos del contorno en coordenadas del torso: [a, b] = a lo largo (desde la cadera) y hacia adelante (el pecho).
function contornoTorso(k, femenino) {
    const L = MEDIDAS.torso;
    const pecho = femenino ? 0.9 : k;
    return [
        [L + 1.6, 2.4], [L - 0.6, 5.0 * pecho], [L - 5.5, 6.8 * pecho], [L - 9.8, 5.2], [L - 15, 4.7], [L - 21, 5.0], [1.6, 4.9],
        [-1.6, 1.4], [-2.8, -2.8], [1.2, -6.0], [6.6, -4.2], [13, -5.0], [19, -6.3 * k], [L - 0.8, -5.4 * k], [L + 1.6, -1.9],
    ];
}

// El marco del torso: dónde está la cadera (H), hacia dónde va (u, de la cadera al hombro) y hacia dónde mira (f).
export function marcoTorso(H, S, mira = 1) {
    const u = unitario(restar(S, H));
    return { H, S, u, f: [-u[1] * mira, u[0] * mira], mira };
}
export const enTorso = (m, a, b) => sumar(sumar(m.H, m.u, a), m.f, b);

function torsoDeLado(m, pal, k) {
    const puntos = contornoTorso(k, pal.femenino);
    const mundo = puntos.map(([a, b]) => enTorso(m, a, b));
    const hacia = m.f[0] * LUZ[0] + m.f[1] * LUZ[1];   // ¿el pecho mira a la luz?
    const iluminado = puntos.map(([a, b]) => enTorso(m, a * 0.97 + 0.4, b * 0.78 + hacia * 1.2));
    const L = MEDIDAS.torso;
    let svg = `<path d="${curvaCerrada(mundo)}" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width="1"/>`;
    svg += `<path d="${curvaCerrada(iluminado)}" fill="${pal.piel.base}"/>`;
    // El pecho y el abdomen: la línea de abajo del pectoral, los cuadritos del abdomen y una luz en el pectoral.
    const linea = (a1, b1, a2, b2) => `<path d="M${pt(enTorso(m, a1, b1))} L${pt(enTorso(m, a2, b2))}" stroke="${pal.piel.linea}" stroke-width="1" opacity=".55"/>`;
    if (!pal.femenino) {
        svg += `<path d="M${pt(enTorso(m, L - 9.4, 4.4))} Q${pt(enTorso(m, L - 8.6, 1.5))} ${pt(enTorso(m, L - 6.5, 0.4))}" fill="none" stroke="${pal.piel.linea}" stroke-width="1" opacity=".7"/>`;
        svg += `<ellipse cx="${n1(enTorso(m, L - 3.6, 3.8 * k)[0])}" cy="${n1(enTorso(m, L - 3.6, 3.8 * k)[1])}" rx="1.6" ry="1.6" fill="${pal.piel.luz}"/>`;
        if (k > 1.04) svg += linea(L - 13, 4.3, L - 13, 2.6) + linea(L - 17, 4.2, L - 17, 2.6);
    }
    svg += linea(L - 20.5, 4.4, L - 20.5, 3.4);   // el ombligo
    // El omóplato y el dorsal: una sombra en la espalda.
    svg += `<path d="M${pt(enTorso(m, L - 2.5, -4.2 * k))} Q${pt(enTorso(m, L - 9, -2.2))} ${pt(enTorso(m, L - 15, -3.4))}" fill="none" stroke="${pal.piel.linea}" stroke-width="1" opacity=".45"/>`;
    if (pal.femenino) {
        const top = [[L - 0.4, 4.9], [L - 5.5, 6.6], [L - 11, 5.3], [L - 11.6, -5.0], [L - 1.6, -5.4]].map(([a, b]) => enTorso(m, a, b));
        svg += `<path d="${curvaCerrada(top)}" fill="${TOP.base}" stroke="${TOP.linea}" stroke-width="1"/>`;
        svg += `<path d="M${pt(enTorso(m, L - 10.6, 5.2))} L${pt(enTorso(m, L - 11.2, -4.8))}" stroke="${TOP.luz}" stroke-width="1"/>`;
    }
    return svg;
}

// El short sobre la cadera (de lado).
function shortDeLado(m) {
    const puntos = [[6.4, 5.1], [1.6, 5.2], [-1.8, 1.6], [-3.0, -2.9], [1.2, -6.3], [6.4, -4.5]].map(([a, b]) => enTorso(m, a, b));
    return `<path d="${curvaCerrada(puntos)}" fill="${SHORT.base}" stroke="${SHORT.linea}" stroke-width="1"/>
        <path d="M${pt(enTorso(m, 6.1, 4.6))} L${pt(enTorso(m, 6.1, -4.1))}" stroke="${SHORT.luz}" stroke-width="1.2"/>`;
}

// ===== La cabeza =====
// Se dibuja en sus propias coordenadas (x = hacia la cara, y = hacia abajo, centro en 0, 0) y se lleva a su lugar.
function cabezaDeLado(m, pal, giro = 0) {
    const arriba = rotar(m.u, giro * m.mira);
    const frente = rotar(m.f, giro * m.mira);
    const N = sumar(m.S, m.u, MEDIDAS.cuello);
    const C = sumar(sumar(N, arriba, 5.4), frente, 0.5);
    const enCabeza = (x, y) => sumar(sumar(C, frente, x), arriba, -y);
    const cara = [[0.6, -5.7], [3.4, -4.6], [4.6, -2.2], [4.7, -0.6], [5.9, 1.3], [4.7, 2.1], [4.9, 3.0], [4.2, 4.7], [2.2, 5.6], [-0.4, 4.7], [-3.4, 3.1], [-4.7, 0.0], [-3.8, -3.9]];
    let svg = parte(sumar(m.S, m.u, -0.5), sumar(N, arriba, 1.6), 2.7, 2.5, pal.piel);   // el cuello
    svg += cabelloDetras(pal, enCabeza, "lado");
    svg += `<path d="${curvaCerrada(cara.map(([x, y]) => enCabeza(x, y)))}" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width="1"/>`;
    svg += `<path d="${curvaCerrada([[0.8, -5], [3.2, -4], [4.1, -1.8], [4.1, 0.4], [5.0, 1.3], [4.0, 2.1], [4.2, 3.0], [3.6, 4.2], [1.8, 4.8], [0.4, 3.0], [0.2, -2]].map(([x, y]) => enCabeza(x, y)))}" fill="${pal.piel.base}"/>`;
    // La oreja, la barba y el pelo.
    svg += `<ellipse cx="${n1(enCabeza(-0.8, 0.8)[0])}" cy="${n1(enCabeza(-0.8, 0.8)[1])}" rx="1.2" ry="1.2" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width=".8"/>`;
    svg += barbaDeLado(pal, enCabeza);
    svg += cabelloArriba(pal, enCabeza, "lado");
    // El ojo y la ceja: puntos exactos, para que se lean aunque la cara mida pocos puntos.
    svg += punto(enCabeza(3.3, -0.3), pal.ojo) + punto(enCabeza(2.4, -1.6), pal.pelo.linea) + punto(enCabeza(3.6, -1.7), pal.pelo.linea);
    svg += punto(enCabeza(4.4, 3.0), pal.piel.linea);   // la boca
    return svg;
}

// Gira una dirección unos grados (para levantar o bajar la cabeza respecto del torso).
export const rotar = (v, grados) => {
    const [c, s] = [Math.cos(rad(grados)), Math.sin(rad(grados))];
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};

export function cabezaDeFrente(N, pal) {
    const C = [N[0], N[1] - 5.6];
    const enCabeza = (x, y) => [C[0] + x, C[1] + y];
    const cara = [[0, -5.8], [3.4, -4.9], [4.6, -1.8], [4.3, 1.8], [2.8, 4.6], [0, 5.6], [-2.8, 4.6], [-4.3, 1.8], [-4.6, -1.8], [-3.4, -4.9]];
    let svg = parte([N[0], N[1] + 2.4], [N[0], N[1] - 1.2], 3.0, 2.8, pal.piel);   // el cuello
    svg += cabelloDetras(pal, enCabeza, "frente");
    for (const s of [-1, 1]) svg += `<ellipse cx="${n1(C[0] + s * 4.6)}" cy="${n1(C[1] + 0.6)}" rx="1.1" ry="1.5" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width=".8"/>`;
    svg += `<path d="${curvaCerrada(cara.map(([x, y]) => enCabeza(x, y)))}" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width="1"/>`;
    svg += `<path d="${curvaCerrada(cara.map(([x, y]) => enCabeza(x * 0.8 + 0.7, y * 0.86 - 0.3)))}" fill="${pal.piel.base}"/>`;
    svg += barbaDeFrente(pal, enCabeza);
    svg += cabelloArriba(pal, enCabeza, "frente");
    for (const s of [-1, 1]) {
        svg += punto(enCabeza(s * 1.9, -0.2), pal.ojo);
        svg += punto(enCabeza(s * 1.9, -1.5), pal.pelo.linea) + punto(enCabeza(s * 2.9, -1.6), pal.pelo.linea);
    }
    svg += punto(enCabeza(0.2, 1.6), pal.piel.sombra);                                        // la nariz
    svg += punto(enCabeza(-0.6, 3.1), pal.piel.linea) + punto(enCabeza(0.6, 3.1), pal.piel.linea);   // la boca
    return svg;
}

// El pelo de arriba (la "gorra" de pelo) según tu peinado.
function cabelloArriba(pal, enCabeza, vista) {
    const p = pal.peinado;
    if (p === "calvo") return "";
    const forma = vista === "lado"
        ? [[3.9, -3.4], [2.8, -5.8], [-0.6, -6.4], [-3.9, -4.8], [-5.1, -1.2], [-4.7, 2.3], [-3.3, 2.1], [-1.6, -0.9], [1.0, -2.8], [3.0, -2.5]]
        : [[0, -6.4], [3.6, -5.4], [4.9, -2.2], [4.5, 0], [3.8, -2.4], [1.4, -3.6], [-1.4, -3.4], [-3.8, -2.4], [-4.5, 0], [-4.9, -2.2], [-3.6, -5.4]];
    const color = p === "rapado" ? material(mezclarColor(pal.pelo.base, pal.piel.sombra, 0.45), pal.pelo.base, null, pal.pelo.linea) : pal.pelo;
    let svg = `<path d="${curvaCerrada(forma.map(([x, y]) => enCabeza(x, y)))}" fill="${color.base}" stroke="${color.linea}" stroke-width="1"/>`;
    if (color.luz) {
        const brillo = vista === "lado" ? [[1.8, -5.0], [-0.6, -5.6], [-2.6, -4.6], [-0.4, -4.4]] : [[1.2, -5.6], [3.2, -4.6], [2.4, -4.1], [0.6, -4.8]];
        svg += `<path d="${curvaCerrada(brillo.map(([x, y]) => enCabeza(x, y)))}" fill="${color.luz}"/>`;
    }
    if (p === "cresta" || p === "puntas") {
        const picos = vista === "lado" ? [[2.6, -5.6], [1.4, -8.0], [0.4, -6.2], [-1.0, -7.8], [-1.8, -6.0]] : [[-2.4, -5.6], [-1.4, -8.2], [0, -6.4], [1.4, -8.2], [2.4, -5.6]];
        svg += `<path d="M${picos.map(([x, y]) => pt(enCabeza(x, y))).join(" L")}Z" fill="${color.base}" stroke="${color.linea}" stroke-width="1"/>`;
    }
    if (p === "mono") svg += bola(enCabeza(vista === "lado" ? -3.6 : 0, vista === "lado" ? -5.6 : -7.4), 2.3, pal.pelo);
    return svg;
}

// El pelo que cae detrás de la cabeza (melena, largo, coleta, trenza).
function cabelloDetras(pal, enCabeza, vista) {
    const p = pal.peinado;
    if (p === "melena" || p === "largo") {
        const largo = p === "largo" ? 13 : 8;
        const forma = vista === "lado"
            ? [[-1, -5.6], [-5.2, -3], [-6, largo * 0.5], [-5.6, largo], [-2.6, largo + 0.6], [-2.2, 3]]
            : [[0, -6.2], [5.4, -3.4], [6.2, largo * 0.6], [5.4, largo], [-5.4, largo], [-6.2, largo * 0.6], [-5.4, -3.4]];
        return `<path d="${curvaCerrada(forma.map(([x, y]) => enCabeza(x, y)))}" fill="${pal.pelo.sombra}" stroke="${pal.pelo.linea}" stroke-width="1"/>`;
    }
    if ((p === "recogido" || p === "trenza") && vista === "lado") {
        return parte(enCabeza(-4.6, -1.4), enCabeza(-7.2, 7), 1.9, 1.3, pal.pelo);
    }
    return "";
}

function barbaDeLado(pal, enCabeza) {
    const b = pal.barba;
    if (b === "ninguna") return "";
    if (b === "bigote") return punto(enCabeza(4.6, 2.2), pal.pelo.base) + punto(enCabeza(3.7, 2.3), pal.pelo.base);
    const largo = b === "larga" ? 2.5 : 0;
    const forma = [[-0.6, 2.6], [1.8, 4.2], [3.8, 2.4], [4.9, 2.4], [4.6, 4.8 + largo], [2.4, 6 + largo], [-0.2, 5]];
    return `<path d="${curvaCerrada(forma.map(([x, y]) => enCabeza(x, y)))}" fill="${pal.pelo.base}" stroke="${pal.pelo.linea}" stroke-width=".8"/>`;
}

function barbaDeFrente(pal, enCabeza) {
    const b = pal.barba;
    if (b === "ninguna") return "";
    if (b === "bigote") return [-1.4, -0.4, 0.6, 1.6].map((x) => punto(enCabeza(x, 2.3), pal.pelo.base)).join("");
    const largo = b === "larga" ? 2.5 : 0;
    const forma = [[-4.2, 1.2], [-2.4, 3.2], [2.4, 3.2], [4.2, 1.2], [3.2, 4.6 + largo], [0, 6.2 + largo], [-3.2, 4.6 + largo]];
    return `<path d="${curvaCerrada(forma.map(([x, y]) => enCabeza(x, y)))}" fill="${pal.pelo.base}" stroke="${pal.pelo.linea}" stroke-width=".8"/>
        <path d="M${pt(enCabeza(-1.2, 3.1))} L${pt(enCabeza(1.2, 3.1))}" stroke="${pal.piel.linea}" stroke-width="1"/>`;
}

// ===== El torso de frente =====
// (v168) cuerpo.escala: si el pecho se inclina hacia ti (o hacia atrás), el torso se ve más corto (1 = derecho).
export function torsoDeFrente(cuerpo, pal, k) {
    const { centro: x, yCadera, subir } = cuerpo;
    const yH = cuerpo.yHombro;
    const esc = cuerpo.escala ?? 1;
    const Y = (b) => yH + b * esc;   // cuánto hacia abajo desde los hombros (achicado si el torso se inclina)
    const ancho = pal.femenino ? 0.9 : 1;
    // Medio contorno (el lado derecho); el izquierdo es su espejo. [cuánto al lado, cuánto hacia abajo desde los hombros]
    const mitad = [[2.6, -1.4], [6.6, -0.8 - subir * 0.9], [10.2 * ancho, 0.4 - subir], [10.7 * ancho, 6.2], [11.1 * ancho * k, 9.6], [9.2, 16], [7.5, 20.5], [8.6, 25.4], [5.2, 29.4]];
    const der = mitad.map(([a, b]) => [x + a, Y(b)]);
    const izq = [...mitad].reverse().map(([a, b]) => [x - a, Y(b)]);
    const contorno = [...der, [x, Y(29.8)], ...izq];
    let svg = `<path d="${curvaCerrada(contorno)}" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width="1"/>`;
    svg += `<path d="${curvaCerrada(contorno.map(([a, b]) => [x + (a - x) * 0.8 + 1.2, yH + (b - yH) * 0.93 - 0.4]))}" fill="${pal.piel.base}"/>`;
    // Pectorales, abdomen y ombligo.
    if (pal.femenino) {
        svg += `<path d="M${x - 9.6} ${Y(2)} Q${x} ${Y(4)} ${x + 9.6} ${Y(2)} L${x + 9.4} ${Y(10)} Q${x} ${Y(12)} ${x - 9.4} ${Y(10)}Z" fill="${TOP.base}" stroke="${TOP.linea}" stroke-width="1"/>`;
        svg += `<path d="M${x - 9} ${Y(10.2)} Q${x} ${Y(12)} ${x + 9} ${Y(10.2)}" fill="none" stroke="${TOP.luz}" stroke-width="1"/>`;
    } else {
        for (const s of [-1, 1]) {
            svg += `<path d="M${x + s * 0.6} ${Y(9.4)} Q${x + s * 5} ${Y(11)} ${x + s * 9.2 * k} ${Y(6)}" fill="none" stroke="${pal.piel.linea}" stroke-width="1" opacity=".7"/>`;
            if (s === 1) svg += `<ellipse cx="${x + 4.6}" cy="${Y(4.6)}" rx="2.6" ry="${1.8 * esc}" fill="${pal.piel.luz}"/>`;
        }
        svg += `<path d="M${x} ${Y(3)} L${x} ${Y(22)}" stroke="${pal.piel.linea}" stroke-width="1" opacity=".45"/>`;
        if (k > 1.04) for (const y of [13.5, 17]) svg += `<path d="M${x - 3.4} ${Y(y)} L${x + 3.4} ${Y(y)}" stroke="${pal.piel.linea}" stroke-width="1" opacity=".4"/>`;
    }
    svg += punto([x, Y(21.4)], pal.piel.linea);
    // El short.
    const corto = [[x - 8.4, yCadera - 3.6], [x + 8.4, yCadera - 3.6], [x + 9.3, yCadera + 1], [x + 5.6, yCadera + 5.4], [x, yCadera + 4.6], [x - 5.6, yCadera + 5.4], [x - 9.3, yCadera + 1]];
    svg += `<path d="${curvaCerrada(corto)}" fill="${SHORT.base}" stroke="${SHORT.linea}" stroke-width="1"/>`;
    svg += `<path d="M${x - 8} ${yCadera - 2.6} L${x + 8} ${yCadera - 2.6}" stroke="${SHORT.luz}" stroke-width="1.2"/>`;
    return svg;
}

// Las piernas de frente.
function piernasDeFrente(cuerpo, pal, k) {
    let svg = "";
    for (const l of cuerpo.lados) {
        svg += parte(l.H, l.K, 5.0 * k, 3.4, pal.piel, { frente: 0.6, atras: 0.6 });
        svg += parte(l.K, l.A, 3.1, 1.9, pal.piel, { frente: l.s * 0.9 * k, atras: -l.s * 0.3 });
        // El pie de frente: un trapecio redondeado que apunta un poco hacia afuera. (v168) Se mide desde el tobillo
        // (ay + 2.4 es el suelo cuando estás de pie): así el pie también se dibuja bien si cuelgas de una barra.
        const [ax, ay] = l.A;
        const d = curvaCerrada([[ax - 2.2, ay - 0.6], [ax + 2.2, ay - 0.6], [ax + 2.6 + l.s * 1.2, ay + 2.4], [ax + l.s * 0.6, ay + 3], [ax - 2.6 + l.s * 1.2, ay + 2.4]]);
        svg += `<path d="${d}" fill="${pal.piel.sombra}" stroke="${pal.piel.linea}" stroke-width="1"/>`;
    }
    for (const l of cuerpo.lados) svg += parte(l.H, mezclaP(l.H, l.K, cuerpo.lados[0].K[1] - cuerpo.lados[0].H[1] < 8 ? 0.7 : 0.4), 5.6 * k, 4.8 * k, SHORT);
    return svg;
}

// ===== Las pesas y las máquinas =====
// Mancuerna vista de punta (el mango apunta hacia ti): un hexágono de hierro.
export function mancuernaDePunta(c, r = 3.6) {
    const vertices = (radio) => Array.from({ length: 6 }, (_, i) => sumar(c, dir(30 + i * 60), radio));
    return `<path d="M${vertices(r).map(pt).join(" L")}Z" fill="${HIERRO.sombra}" stroke="${HIERRO.linea}" stroke-width="1"/>
        <path d="M${vertices(r * 0.72).map((p) => pt(sumar(p, LUZ, 0.5))).join(" L")}Z" fill="${HIERRO.base}"/>
        <circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="1.1" fill="${ACERO.base}" stroke="${HIERRO.linea}" stroke-width=".6"/>`;
}

// Mancuerna vista de lado (el mango de izquierda a derecha), centrada en c.
export function mancuernaDeLado(c) {
    let svg = `<rect x="${n1(c[0] - 4.6)}" y="${n1(c[1] - 0.8)}" width="9.2" height="1.6" fill="${ACERO.base}" stroke="${HIERRO.linea}" stroke-width=".6"/>`;
    for (const s of [-1, 1]) {
        const x = c[0] + s * 4.6;
        svg += `<rect x="${n1(x - 1.7)}" y="${n1(c[1] - 3.4)}" width="3.4" height="6.8" rx=".8" fill="${HIERRO.sombra}" stroke="${HIERRO.linea}" stroke-width="1"/>`;
        svg += `<rect x="${n1(x - 0.9)}" y="${n1(c[1] - 2.8)}" width="1.6" height="4.4" fill="${HIERRO.base}"/>`;
    }
    return svg;
}

// Un disco grande (visto de frente: la barra pasa por su centro), con su borde, su anillo y su buje de acero.
export function disco(c, r = 9.5) {
    const brillo = sumar(c, LUZ, r * 0.12);
    return `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${DISCO.sombra}" stroke="${DISCO.linea}" stroke-width="1"/>
        <circle cx="${n1(brillo[0])}" cy="${n1(brillo[1])}" r="${n1(r * 0.86)}" fill="${DISCO.base}"/>
        <circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${n1(r * 0.55)}" fill="none" stroke="${DISCO.luz}" stroke-width="1"/>
        <circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="2.2" fill="${ACERO.sombra}" stroke="${DISCO.linea}" stroke-width=".8"/>`;
}

// La punta de la barra (se ve de frente, como un círculo de acero).
export const puntaDeBarra = (c) => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="1.6" fill="${ACERO.base}" stroke="${HIERRO.linea}" stroke-width=".8"/><rect x="${Math.floor(c[0] - 0.6)}" y="${Math.floor(c[1] - 1)}" width="1" height="1" fill="${ACERO.luz}"/>`;

export const cable = (a, b) => `<path d="M${pt(a)} L${pt(b)}" stroke="${CABLE}" stroke-width="1"/>`;
export const barraRecta = (a, b, grosor = 1.6) => `<path d="M${pt(a)} L${pt(b)}" stroke="${HIERRO.linea}" stroke-width="${grosor + 1.2}" stroke-linecap="round"/><path d="M${pt(a)} L${pt(b)}" stroke="${ACERO.base}" stroke-width="${grosor}" stroke-linecap="round"/>`;

// La torre de pesas (las placas que suben cuando tiras del cable). x = su borde izquierdo; subida = cuánto suben.
export function pilaDePesas(x, subida) {
    let svg = "";
    for (let i = 0; i < 7; i++) {
        const sube = i >= 3 ? subida : 0;   // la clavija toma las 4 de arriba
        const y = SUELO - 3 - (i + 1) * 2.6 - sube;
        svg += `<rect x="${x}" y="${n1(y)}" width="13" height="2.4" fill="${i % 2 ? HIERRO.base : HIERRO.sombra}" stroke="${HIERRO.linea}" stroke-width=".7"/>`;
    }
    const arriba = SUELO - 3 - 7 * 2.6 - subida;
    return svg + cable([x + 6.5, arriba], [x + 6.5, 6]);
}

// Cuánto suben las pesas: lo que se alarga el cable desde la polea hasta la mano (la mitad, por la polea doble).
export const subidaDeCable = (polea, mano, manoInicio) => Math.max(0, (largoDe(restar(polea, mano)) - largoDe(restar(polea, manoInicio))) * 0.5);

// ===== Cómo dibujar un cuerpo de lado =====
// cuerpo = { H, S, mira, brazos: [cerca, lejos], piernas: [cerca, lejos], giroCabeza }
// detras / delante: lo que va detrás del cuerpo (un disco) o delante (la punta de la barra, el puño sobre la barra…).
// (v168) sobreElTorso: lo que tapa el torso pero queda debajo del brazo de adelante (la almohadilla del banco Scott).
export function cuerpoDeLado(cuerpo, pal, k, { detras = "", entre = "", sobreElTorso = "", delante = "" } = {}) {
    const m = marcoTorso(cuerpo.H, cuerpo.S, cuerpo.mira || 1);
    const [brazoCerca, brazoLejos = desplazarBrazo(brazoCerca, m)] = cuerpo.brazos;
    const [piernaCerca, piernaLejos = desplazarPierna(piernaCerca, m)] = cuerpo.piernas;
    let svg = detras;
    svg += piernaEntera(piernaLejos, pal.lejos, k, m.mira) + pernera(piernaLejos, k, m.mira);
    svg += brazoEntero(brazoLejos, pal.lejos, k, m.mira);
    svg += entre;
    svg += torsoDeLado(m, pal, k) + shortDeLado(m);
    svg += cabezaDeLado(m, pal, cuerpo.giroCabeza || 0);
    svg += sobreElTorso;
    svg += piernaEntera(piernaCerca, pal.piel, k, m.mira) + pernera(piernaCerca, k, m.mira);
    svg += brazoEntero(brazoCerca, pal.piel, k, m.mira);
    return svg + delante;
}

// Si un movimiento no dice dónde van el brazo y la pierna de atrás, se ponen igual que los de adelante pero un poco corridos.
function desplazarBrazo(b, m) {
    const corrido = sumar([0, 0], m.f, -1.2);
    return { S: sumar(b.S, corrido), E: sumar(b.E, corrido), M: sumar(b.M, corrido) };
}
function desplazarPierna(l, m) {
    const corrido = sumar(sumar([0, 0], m.f, -2.4), m.u, 0.4);
    return { ...l, H: sumar(l.H, corrido), K: sumar(l.K, corrido), A: [l.A[0] - 2.2, l.A[1]] };
}

// ===== Cómo dibujar un cuerpo de frente =====
// brazos: [izquierdo, derecho]. bajoLasManos: lo que el puño agarra (una barra, el mango de una mancuerna);
// sobreLasManos: lo que tapa el puño (una mancuerna vista de punta). biceps: cuánto se marca el bíceps.
// (v168) sobreElTorso: lo que tapa el torso pero queda debajo de los brazos (la almohadilla del pecho).
export function cuerpoDeFrente(cuerpo, brazos, pal, k, { detras = "", delanteDeLasPiernas = "", sobreElTorso = "", bajoLasManos = "", sobreLasManos = "", biceps = 0.7 } = {}) {
    let svg = detras;
    svg += piernasDeFrente(cuerpo, pal, k);
    svg += delanteDeLasPiernas;
    svg += torsoDeFrente(cuerpo, pal, k);
    svg += cabezaDeFrente(cuerpo.N, pal);
    svg += sobreElTorso;
    // La luz viene de la derecha: el brazo izquierdo queda un poco en sombra. mira da vuelta el izquierdo (es su espejo).
    for (const [i, b] of brazos.entries()) svg += brazoEntero(b, i === 0 ? pal.lejos : pal.piel, k, i === 0 ? -1 : 1, { biceps, conPuno: false });
    svg += bajoLasManos;
    for (const [i, b] of brazos.entries()) svg += puno(b, i === 0 ? pal.lejos : pal.piel);
    return svg + sobreLasManos;
}

// ===== (v168) Piezas para los movimientos nuevos =====
// El ángulo de una dirección, como lo usa rotate() de SVG (0 = hacia la derecha, 90 = hacia abajo).
const anguloDe = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
// Una mancuerna de lado, girada para que el mango siga la dirección v (por ejemplo, la del antebrazo).
export const mancuernaGirada = (c, v) => `<g transform="rotate(${n1(anguloDe(v))} ${n1(c[0])} ${n1(c[1])})">${mancuernaDeLado(c)}</g>`;

// Un disco visto de canto (la barra va de lado a lado, como en las figuras de frente): un rectángulo alto y angosto.
function discoDeCanto(c, r = 9.5, grosor = 3.2) {
    return `<rect x="${n1(c[0] - grosor / 2)}" y="${n1(c[1] - r)}" width="${grosor}" height="${n1(r * 2)}" rx="1" fill="${DISCO.sombra}" stroke="${DISCO.linea}" stroke-width="1"/>
        <rect x="${n1(c[0] - grosor / 2 + 0.8)}" y="${n1(c[1] - r + 1.4)}" width="1" height="${n1(r * 2 - 2.8)}" fill="${DISCO.luz}"/>`;
}
// La barra vista de frente, centrada en c, con dos discos en cada punta.
export function barraDeFrente(c, largo = 88) {
    const mitad = largo / 2;
    let svg = barraRecta([c[0] - mitad, c[1]], [c[0] + mitad, c[1]], 1.6);
    for (const s of [-1, 1]) svg += discoDeCanto([c[0] + s * (mitad - 9), c[1]]) + discoDeCanto([c[0] + s * (mitad - 5.6), c[1]], 7.5);
    return svg;
}

// Un cuerpo de frente armado a mano: la cadera en yCadera y los hombros en yHombro. Si el pecho se inclina hacia ti,
// los hombros quedan más cerca de la cadera (el torso se ve más corto). piernas(s) da la rodilla K y el tobillo A de cada lado.
export function cuerpoFrente(x, yCadera, yHombro, piernas) {
    const lados = [-1, 1].map((s) => ({ s, H: [x + s * 5, yCadera], ...piernas(s), S: [x + s * 10.5, yHombro] }));
    return { centro: x, yCadera, yHombro, escala: (yCadera - yHombro) / MEDIDAS.torso, N: [x, yHombro - MEDIDAS.cuello], lados, subir: 0 };
}

// Un brazo de frente que apunta en parte hacia ti: se ve más corto (eso se llama escorzo; los huesos no se estiran,
// solo se ven de punta). giro: 0 = estirado al costado, 90 = apunta hacia ti. doblez: cuánto se dobla el codo. bajar: cuánto cae.
export function brazoHaciaTi(S, s, giro, doblez, bajar = 0) {
    const E = [S[0] + s * MEDIDAS.brazo * Math.cos(rad(giro)), S[1] + bajar];
    return { S, E, M: [E[0] + s * MEDIDAS.antebrazo * Math.cos(rad(giro + doblez)), E[1] + bajar * 0.5] };
}

// Sentado en el banco inclinado: la cadera en el asiento, la espalda en el respaldo (40° desde el suelo) y los pies en el suelo.
export const CADERA_INCLINADO = [64, 78.5];
export function sentadoInclinado() {
    const H = CADERA_INCLINADO;
    const S = sumar(H, dir(-130), MEDIDAS.torso);
    const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
    return { H, S, piernas: [pierna(H, 86), pierna(sumar(H, [-1, 1]), 83)] };
}

// Apoyado en el banco plano: la rodilla y la mano de atrás sobre el banco, la otra pierna en el suelo y el torso casi horizontal.
export function apoyadoEnBanco() {
    const H = [42, 62.6];
    const S = sumar(H, dir(92), MEDIDAS.torso);
    const rodilla = sumar(H, dir(14), MEDIDAS.muslo);
    const enElBanco = { H: sumar(H, [-0.8, -0.6]), K: rodilla, A: sumar(rodilla, dir(-88), MEDIDAS.pierna), planta: unitario([-1, -0.15]) };
    const enElSuelo = { ...piernaHacia(sumar(H, [0.6, 0.4]), [36, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] };
    return { H, S, piernas: [enElSuelo, enElBanco], apoyo: brazoHacia(sumar(S, [-0.6, -0.8]), [82, 82.5], 1) };
}

// Las máquinas (no se mueven: van en el fondo). Colores de hierro y cuero oscuro con su contorno.
export const marco = (d, grosor = 2.4) => `<path d="${d}" fill="none" stroke="#0d0b12" stroke-width="${grosor + 1.6}" stroke-linecap="square"/><path d="${d}" fill="none" stroke="${HIERRO.base}" stroke-width="${grosor}" stroke-linecap="square"/>`;
export const almohadilla = (px, py, ancho, alto) => `<rect x="${px}" y="${py}" width="${ancho}" height="${alto}" rx="1" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><rect x="${px + 1}" y="${py + 0.6}" width="${ancho - 2}" height="${Math.max(1, alto * 0.35)}" fill="${CUERO.base}"/>`;

// (v168) Una almohadilla inclinada: de a a b, con su grosor repartido a los dos lados de la línea.
export function almohadillaEntre(a, b, grosor = 4.4) {
    const v = restar(b, a);
    return `<g transform="rotate(${n1(anguloDe(v))} ${n1(a[0])} ${n1(a[1])})">${almohadilla(n1(a[0]), n1(a[1] - grosor / 2), n1(largoDe(v)), grosor)}</g>`;
}
// Un respaldo: la almohadilla que va a lo largo de la espalda de un torso que sale de la cadera H con ese ángulo
// (como en dir()), desde/hasta = de qué parte del torso a cuál, separada de la línea del torso (para que quede detrás).
export function respaldo(H, angulo, desde, hasta, separacion = 8) {
    const eje = dir(angulo), atras = [eje[1], -eje[0]];
    return almohadillaEntre(sumar(sumar(H, eje, desde), atras, separacion), sumar(sumar(H, eje, hasta), atras, separacion), 4.6);
}
// Un rodillo de cuero (el que se apoya en las piernas en las máquinas) y una polea (la rueda por donde pasa el cable).
export const rodillo = (c, r = 2.8) => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><circle cx="${n1(c[0] + 0.5)}" cy="${n1(c[1] - 0.5)}" r="${n1(r * 0.57)}" fill="${CUERO.base}"/>`;
export const ruedaDePolea = (c, r = 2.6) => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>`;
// La torre de una polea, a la derecha. yPolea: a qué altura sale el cable (9 = arriba).
export function torreDePolea(yPolea) {
    const soporte = yPolea > 12 ? marco(`M96 ${yPolea} L93 ${yPolea}`, 1.4) : "";
    return marco(`M96 4 L96 ${SUELO} M114 4 L114 ${SUELO} M92 4 L116 4 M94 ${SUELO - 1} L116 ${SUELO - 1}`) + soporte
        + `<path d="M100 8 L100 ${SUELO - 3} M111 8 L111 ${SUELO - 3}" stroke="#2b2f3a" stroke-width="1"/><circle cx="93" cy="${yPolea}" r="2.6" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/><circle cx="105.5" cy="6" r="2.2" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>`;
}
