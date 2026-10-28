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

import { APARIENCIA } from "./avatar.js";

export const ANCHO = 120;
export const ALTO = 110;
export const SUELO = 104;
// El largo de cada hueso (en puntos). Una persona de pie mide unos 81 puntos (7,5 cabezas).
export const MEDIDAS = { cuello: 2.5, torso: 25, brazo: 14, antebrazo: 12, muslo: 20, pierna: 19.5, tobillo: 2.8 };

// ===== Cuentas con puntos [x, y] =====
const rad = (grados) => (grados * Math.PI) / 180;
const dir = (grados) => [Math.sin(rad(grados)), Math.cos(rad(grados))];   // un paso de largo 1 en esa dirección
const sumar = (p, v, largo = 1) => [p[0] + v[0] * largo, p[1] + v[1] * largo];
const restar = (p, q) => [p[0] - q[0], p[1] - q[1]];
const largoDe = (v) => Math.hypot(v[0], v[1]);
const unitario = (v) => { const l = largoDe(v) || 1; return [v[0] / l, v[1] / l]; };
const mezcla = (a, b, u) => a + (b - a) * u;
const mezclaP = (p, q, u) => [mezcla(p[0], q[0], u), mezcla(p[1], q[1], u)];
const n1 = (x) => Math.round(x * 10) / 10;
const pt = (p) => `${n1(p[0])} ${n1(p[1])}`;
// La luz viene de arriba y un poco de adelante (de la derecha): lo que mira hacia ella se ve más claro.
const LUZ = unitario([0.45, -1]);

// Una curva suave y cerrada que pasa por todos los puntos (curva de Catmull-Rom convertida a curvas de Bézier).
function curvaCerrada(puntos) {
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
const brazo = (S, angulo1, angulo2) => {
    const E = sumar(S, dir(angulo1), MEDIDAS.brazo);
    return { S, E, M: sumar(E, dir(angulo2), MEDIDAS.antebrazo) };
};
const brazoHacia = (S, objetivo, lado) => {
    const E = articulacion(S, objetivo, MEDIDAS.brazo, MEDIDAS.antebrazo, lado);
    return { S, E, M: sumar(E, unitario(restar(objetivo, E)), MEDIDAS.antebrazo) };
};
const piernaHacia = (H, objetivo, lado) => {
    const K = articulacion(H, objetivo, MEDIDAS.muslo, MEDIDAS.pierna, lado);
    return { H, K, A: sumar(K, unitario(restar(objetivo, K)), MEDIDAS.pierna) };
};

// El cuerpo de pie, armado desde el tobillo (así los pies no se mueven del suelo).
// espinilla: cuánto se va la rodilla hacia adelante; muslo: cuánto se va la cadera hacia atrás; torso: cuánto se inclina el pecho.
function dePie(A, { espinilla = 0, muslo = 0, torso = 0 } = {}) {
    const K = sumar(A, dir(180 - espinilla), MEDIDAS.pierna);
    const H = sumar(K, dir(180 + muslo), MEDIDAS.muslo);
    const S = sumar(H, dir(180 - torso), MEDIDAS.torso);
    return { H, S, piernas: [{ H, K, A, planta: [1, 0] }] };
}
const tobilloEn = (x) => [x, SUELO - MEDIDAS.tobillo];

// De frente: las caderas, los hombros y las piernas a partir del centro (x) de la persona.
// sentado: las piernas vienen hacia ti (los muslos se ven cortos). subir: cuánto suben los hombros (encogimientos).
function deFrente(x, { sentado = false, subir = 0 } = {}) {
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
const HIERRO = material("#4a5163", "#2b2f3a", "#9aa3b5", "#15131c");
const ACERO = material("#8d97ad", "#596178", "#d5dbe8", "#15131c");
const DISCO = material("#26232f", "#17151e", "#4b475c", "#0b0a10");
const CUERO = material("#5a2a35", "#3d1b24", "#7d3b4a", "#1a0b11");
const SHORT = material("#2c3555", "#1d2440", "#3e4a72", "#0f1328");
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
function parte(p, q, rp, rq, color, { frente = 0, atras = 0, mira = 1 } = {}) {
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
function bola(c, r, color) {
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
function pie(A, planta, color, mira = 1) {
    const abajo = [-planta[1] * mira, planta[0] * mira];
    const P = (adelante, hacia) => sumar(sumar(A, planta, adelante), abajo, hacia);
    const puntos = [P(-1.6, -1.2), P(-2.6, 1.0), P(-2.0, 2.7), P(3, 2.8), P(8.2, 2.7), P(8.6, 1.6), P(6.4, 0.4), P(3.2, -0.6), P(1.2, -1.6)];
    const d = curvaCerrada(puntos);
    return `<path d="${d}" fill="${color.sombra}" stroke="${color.linea}" stroke-width="1"/>
        <path d="${curvaCerrada([P(-1.2, -0.8), P(-1.8, 0.8), P(2.6, 1.6), P(7.4, 1.6), P(6, 0.4), P(3, -0.4), P(1, -1.2)])}" fill="${color.base}"/>`;
}

// El puño: una bola al final del antebrazo.
const puno = (brazoX, color) => bola(sumar(brazoX.M, unitario(restar(brazoX.M, brazoX.E)), 1.5), 2.1, color);
const centroDelPuno = (brazoX) => sumar(brazoX.M, unitario(restar(brazoX.M, brazoX.E)), 1.6);

// Un brazo entero: hombro (deltoides), brazo con bíceps, antebrazo y puño. k = cuánto músculo (según tu nivel de gym).
// El hombro va primero (detrás): así el brazo lo tapa en parte y se ve redondo, no como una bola pegada.
// biceps: cuánto se marca el bíceps (más en la pose de la victoria).
function brazoEntero(b, color, k, mira = 1, { biceps = 0.9, conPuno = true } = {}) {
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
function marcoTorso(H, S, mira = 1) {
    const u = unitario(restar(S, H));
    return { H, S, u, f: [-u[1] * mira, u[0] * mira], mira };
}
const enTorso = (m, a, b) => sumar(sumar(m.H, m.u, a), m.f, b);

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
const rotar = (v, grados) => {
    const [c, s] = [Math.cos(rad(grados)), Math.sin(rad(grados))];
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};

function cabezaDeFrente(N, pal) {
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
function torsoDeFrente(cuerpo, pal, k) {
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
function mancuernaDePunta(c, r = 3.6) {
    const vertices = (radio) => Array.from({ length: 6 }, (_, i) => sumar(c, dir(30 + i * 60), radio));
    return `<path d="M${vertices(r).map(pt).join(" L")}Z" fill="${HIERRO.sombra}" stroke="${HIERRO.linea}" stroke-width="1"/>
        <path d="M${vertices(r * 0.72).map((p) => pt(sumar(p, LUZ, 0.5))).join(" L")}Z" fill="${HIERRO.base}"/>
        <circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="1.1" fill="${ACERO.base}" stroke="${HIERRO.linea}" stroke-width=".6"/>`;
}

// Mancuerna vista de lado (el mango de izquierda a derecha), centrada en c.
function mancuernaDeLado(c) {
    let svg = `<rect x="${n1(c[0] - 4.6)}" y="${n1(c[1] - 0.8)}" width="9.2" height="1.6" fill="${ACERO.base}" stroke="${HIERRO.linea}" stroke-width=".6"/>`;
    for (const s of [-1, 1]) {
        const x = c[0] + s * 4.6;
        svg += `<rect x="${n1(x - 1.7)}" y="${n1(c[1] - 3.4)}" width="3.4" height="6.8" rx=".8" fill="${HIERRO.sombra}" stroke="${HIERRO.linea}" stroke-width="1"/>`;
        svg += `<rect x="${n1(x - 0.9)}" y="${n1(c[1] - 2.8)}" width="1.6" height="4.4" fill="${HIERRO.base}"/>`;
    }
    return svg;
}

// Un disco grande (visto de frente: la barra pasa por su centro), con su borde, su anillo y su buje de acero.
function disco(c, r = 9.5) {
    const brillo = sumar(c, LUZ, r * 0.12);
    return `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${DISCO.sombra}" stroke="${DISCO.linea}" stroke-width="1"/>
        <circle cx="${n1(brillo[0])}" cy="${n1(brillo[1])}" r="${n1(r * 0.86)}" fill="${DISCO.base}"/>
        <circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${n1(r * 0.55)}" fill="none" stroke="${DISCO.luz}" stroke-width="1"/>
        <circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="2.2" fill="${ACERO.sombra}" stroke="${DISCO.linea}" stroke-width=".8"/>`;
}

// La punta de la barra (se ve de frente, como un círculo de acero).
const puntaDeBarra = (c) => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="1.6" fill="${ACERO.base}" stroke="${HIERRO.linea}" stroke-width=".8"/><rect x="${Math.floor(c[0] - 0.6)}" y="${Math.floor(c[1] - 1)}" width="1" height="1" fill="${ACERO.luz}"/>`;

const cable = (a, b) => `<path d="M${pt(a)} L${pt(b)}" stroke="${CABLE}" stroke-width="1"/>`;
const barraRecta = (a, b, grosor = 1.6) => `<path d="M${pt(a)} L${pt(b)}" stroke="${HIERRO.linea}" stroke-width="${grosor + 1.2}" stroke-linecap="round"/><path d="M${pt(a)} L${pt(b)}" stroke="${ACERO.base}" stroke-width="${grosor}" stroke-linecap="round"/>`;

// La torre de pesas (las placas que suben cuando tiras del cable). x = su borde izquierdo; subida = cuánto suben.
function pilaDePesas(x, subida) {
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
const subidaDeCable = (polea, mano, manoInicio) => Math.max(0, (largoDe(restar(polea, mano)) - largoDe(restar(polea, manoInicio))) * 0.5);

// ===== Cómo dibujar un cuerpo de lado =====
// cuerpo = { H, S, mira, brazos: [cerca, lejos], piernas: [cerca, lejos], giroCabeza }
// detras / delante: lo que va detrás del cuerpo (un disco) o delante (la punta de la barra, el puño sobre la barra…).
// (v168) sobreElTorso: lo que tapa el torso pero queda debajo del brazo de adelante (la almohadilla del banco Scott).
function cuerpoDeLado(cuerpo, pal, k, { detras = "", entre = "", sobreElTorso = "", delante = "" } = {}) {
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
function cuerpoDeFrente(cuerpo, brazos, pal, k, { detras = "", delanteDeLasPiernas = "", sobreElTorso = "", bajoLasManos = "", sobreLasManos = "", biceps = 0.7 } = {}) {
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
const mancuernaGirada = (c, v) => `<g transform="rotate(${n1(anguloDe(v))} ${n1(c[0])} ${n1(c[1])})">${mancuernaDeLado(c)}</g>`;

// Un disco visto de canto (la barra va de lado a lado, como en las figuras de frente): un rectángulo alto y angosto.
function discoDeCanto(c, r = 9.5, grosor = 3.2) {
    return `<rect x="${n1(c[0] - grosor / 2)}" y="${n1(c[1] - r)}" width="${grosor}" height="${n1(r * 2)}" rx="1" fill="${DISCO.sombra}" stroke="${DISCO.linea}" stroke-width="1"/>
        <rect x="${n1(c[0] - grosor / 2 + 0.8)}" y="${n1(c[1] - r + 1.4)}" width="1" height="${n1(r * 2 - 2.8)}" fill="${DISCO.luz}"/>`;
}
// La barra vista de frente, centrada en c, con dos discos en cada punta.
function barraDeFrente(c, largo = 88) {
    const mitad = largo / 2;
    let svg = barraRecta([c[0] - mitad, c[1]], [c[0] + mitad, c[1]], 1.6);
    for (const s of [-1, 1]) svg += discoDeCanto([c[0] + s * (mitad - 9), c[1]]) + discoDeCanto([c[0] + s * (mitad - 5.6), c[1]], 7.5);
    return svg;
}

// Un cuerpo de frente armado a mano: la cadera en yCadera y los hombros en yHombro. Si el pecho se inclina hacia ti,
// los hombros quedan más cerca de la cadera (el torso se ve más corto). piernas(s) da la rodilla K y el tobillo A de cada lado.
function cuerpoFrente(x, yCadera, yHombro, piernas) {
    const lados = [-1, 1].map((s) => ({ s, H: [x + s * 5, yCadera], ...piernas(s), S: [x + s * 10.5, yHombro] }));
    return { centro: x, yCadera, yHombro, escala: (yCadera - yHombro) / MEDIDAS.torso, N: [x, yHombro - MEDIDAS.cuello], lados, subir: 0 };
}

// Un brazo de frente que apunta en parte hacia ti: se ve más corto (eso se llama escorzo; los huesos no se estiran,
// solo se ven de punta). giro: 0 = estirado al costado, 90 = apunta hacia ti. doblez: cuánto se dobla el codo. bajar: cuánto cae.
function brazoHaciaTi(S, s, giro, doblez, bajar = 0) {
    const E = [S[0] + s * MEDIDAS.brazo * Math.cos(rad(giro)), S[1] + bajar];
    return { S, E, M: [E[0] + s * MEDIDAS.antebrazo * Math.cos(rad(giro + doblez)), E[1] + bajar * 0.5] };
}

// Sentado en el banco inclinado: la cadera en el asiento, la espalda en el respaldo (40° desde el suelo) y los pies en el suelo.
const CADERA_INCLINADO = [64, 78.5];
function sentadoInclinado() {
    const H = CADERA_INCLINADO;
    const S = sumar(H, dir(-130), MEDIDAS.torso);
    const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
    return { H, S, piernas: [pierna(H, 86), pierna(sumar(H, [-1, 1]), 83)] };
}

// Apoyado en el banco plano: la rodilla y la mano de atrás sobre el banco, la otra pierna en el suelo y el torso casi horizontal.
function apoyadoEnBanco() {
    const H = [42, 62.6];
    const S = sumar(H, dir(92), MEDIDAS.torso);
    const rodilla = sumar(H, dir(14), MEDIDAS.muslo);
    const enElBanco = { H: sumar(H, [-0.8, -0.6]), K: rodilla, A: sumar(rodilla, dir(-88), MEDIDAS.pierna), planta: unitario([-1, -0.15]) };
    const enElSuelo = { ...piernaHacia(sumar(H, [0.6, 0.4]), [36, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] };
    return { H, S, piernas: [enElSuelo, enElBanco], apoyo: brazoHacia(sumar(S, [-0.6, -0.8]), [82, 82.5], 1) };
}

// ===== Los movimientos =====
// Cada uno: vista ("lado" o "frente"), fondo (las máquinas que no se mueven, ver dibujarFondoEjercicio) y
// dibujar(u, pal, k): el cuerpo y lo que se mueve en ese instante.
const MOVIMIENTOS = {
    // De pie, con mancuernas: el codo se queda quieto y el antebrazo sube.
    curl: {
        vista: "lado", fondo: "sala", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56));
            const b = brazo(c.S, mezcla(3, 12, u), mezcla(6, 150, u));
            const lejos = brazo(sumar(c.S, [-1.2, 0]), mezcla(3, 12, u), mezcla(6, 150, u));
            return cuerpoDeLado({ ...c, brazos: [b, lejos] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // De pie frente a la polea: los codos pegados al cuerpo y el antebrazo baja hasta estirar el brazo.
    triceps: {
        vista: "lado", fondo: "polea-alta", encuadre: [30, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(50), { espinilla: 4, muslo: 4, torso: 12 });
            const b = brazo(c.S, 6, mezcla(120, 8, u));
            const inicio = brazo(c.S, 6, 120);
            const polea = [93, 9];
            return pilaDePesas(99, subidaDeCable(polea, centroDelPuno(b), centroDelPuno(inicio)))
                + cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { delante: cable(polea, centroDelPuno(b)) + puntaDeBarra(centroDelPuno(b)) });
        },
    },
    // Sentado, de frente: las mancuernas suben desde los hombros hasta arriba de la cabeza.
    press_vertical: {
        vista: "frente", fondo: "asiento", encuadre: [18, 102],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const brazos = cuerpo.lados.map((l) => brazo(l.S, l.s * mezcla(78, 158, u), l.s * mezcla(-178, -171, u)));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: brazos.map((b) => mancuernaDeLado(centroDelPuno(b))).join("") });
        },
    },
    // Acostado en el banco: la barra baja al pecho y sube con los brazos estirados.
    press_horizontal: {
        vista: "lado", fondo: "banco", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 75], S = [45, 75];
            const b = brazoHacia(S, mezclaP([50, 66], [46, 49.5], u), 1);
            const lejos = brazoHacia(sumar(S, [0, 1]), mezclaP([50, 66], [46, 49.5], u), 1);
            const pierna = piernaHacia(H, [91, SUELO - MEDIDAS.tobillo], -1);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [{ ...pierna, planta: [1, 0] }, { ...piernaHacia(sumar(H, [-1, 1]), [88, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] }], giroCabeza: -8 }, pal, k, {
                entre: disco(barra),
                delante: puntaDeBarra(barra),
            });
        },
    },
    // De pie, de frente: los brazos suben a los lados hasta la altura de los hombros.
    elevacion_lateral: {
        vista: "frente", fondo: "sala", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60);
            const brazos = cuerpo.lados.map((l) => {
                const a1 = mezcla(10, 86, u);
                return brazo(l.S, l.s * a1, l.s * (a1 - 10));
            });
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { sobreLasManos: brazos.map((b) => mancuernaDePunta(centroDelPuno(b), 3.4)).join("") });
        },
    },
    // Sentado en la máquina, de frente: tira de la barra desde arriba hasta el pecho.
    jalon: {
        vista: "frente", fondo: "jalon", encuadre: [16, 104],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const y = mezcla(cuerpo.yHombro - 25, cuerpo.yHombro + 0.5, u);
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * mezcla(21.5, 18, u), y], l.s));
            const manos = brazos.map(centroDelPuno);
            const yBarra = (manos[0][1] + manos[1][1]) / 2;
            const barra = barraRecta([33, yBarra + 2.2], [38, yBarra]) + barraRecta([38, yBarra], [82, yBarra]) + barraRecta([82, yBarra], [87, yBarra + 2.2]);
            const rodillo = `<rect x="43" y="77.6" width="34" height="4.4" rx="2" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><rect x="44" y="78.2" width="32" height="1.6" fill="${CUERO.luz}"/>`;
            return cable([60, 3], [60, yBarra]) + cuerpoDeFrente(cuerpo, brazos, pal, k, { delanteDeLasPiernas: rodillo, bajoLasManos: barra });
        },
    },
    // Sentado, de lado: tira del cable hacia el abdomen y endereza la espalda.
    remo: {
        vista: "lado", fondo: "polea-baja", encuadre: [14, 120],
        dibujar(u, pal, k) {
            const H = [38, 85.5];
            const S = sumar(H, dir(180 - mezcla(18, -6, u)), MEDIDAS.torso);
            const S0 = sumar(H, dir(162), MEDIDAS.torso);
            const objetivo = (s, t) => mezclaP(sumar(s, [24.5, 5]), sumar(s, [9.5, 13.5]), t);
            const b = brazoHacia(S, objetivo(S, u), 1);
            const lejos = brazoHacia(sumar(S, [-1, 0.5]), objetivo(S, u), 1);
            const pierna = piernaHacia(H, [75, 93], -1);
            const polea = [101, 91];
            const mano = centroDelPuno(b);
            return pilaDePesas(102, subidaDeCable(polea, mano, centroDelPuno(brazoHacia(S0, objetivo(S0, 0), 1))))
                + cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [{ ...pierna, planta: [0, -1] }, { ...piernaHacia(sumar(H, [-1, 0.5]), [73, 94], -1), planta: [0, -1] }] }, pal, k, {
                    delante: cable(polea, mano) + puntaDeBarra(mano),
                });
        },
    },
    // Sentadilla con barra: la cadera baja y va atrás, las rodillas avanzan y el pecho se inclina.
    sentadilla: {
        vista: "lado", fondo: "jaula", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56), { espinilla: 34 * u, muslo: 72 * u, torso: 40 * u });
            const m = marcoTorso(c.H, c.S);
            const barra = enTorso(m, MEDIDAS.torso - 1.6, -4.4);
            const b = brazoHacia(c.S, sumar(sumar(barra, m.f, 1.6), m.u, -0.4), -1);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Peso muerto rumano: la cadera va hacia atrás, la espalda recta y la barra baja pegada a las piernas.
    bisagra: {
        vista: "lado", fondo: "sala", encuadre: [24, 96],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56), { espinilla: 5 * u, muslo: 28 * u, torso: 55 * u });
            const b = brazo(c.S, mezcla(4, 0, u), mezcla(2, 0, u));
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Boca abajo en la máquina: el talón sube hacia el glúteo empujando el rodillo.
    curl_femoral: {
        vista: "lado", fondo: "banco-femoral", encuadre: [14, 110],
        dibujar(u, pal, k) {
            const H = [60, 74], S = [35, 74];
            const K = sumar(H, dir(93), MEDIDAS.muslo);
            const A = sumar(K, dir(mezcla(92, 192, u)), MEDIDAS.pierna);
            const pierna = { H, K, A };
            const lejos = { H: sumar(H, [0, -1.2]), K: sumar(K, [-0.6, -1.2]), A: sumar(sumar(K, [-0.6, -1.2]), dir(mezcla(92, 192, u)), MEDIDAS.pierna) };
            const espinilla = unitario(restar(A, K));
            const rodillo = sumar(sumar(A, [espinilla[1], -espinilla[0]], -3.4), espinilla, -1.6);   // detrás del tobillo
            const eje = [81.5, 82];
            const palanca = barraRecta(eje, rodillo, 1.8) + `<circle cx="${n1(rodillo[0])}" cy="${n1(rodillo[1])}" r="2.8" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><circle cx="${n1(rodillo[0] + 0.5)}" cy="${n1(rodillo[1] - 0.5)}" r="1.6" fill="${CUERO.base}"/>`;
            const b = brazoHacia(S, [25, 85], -1);
            return cuerpoDeLado({ H, S, mira: -1, brazos: [b], piernas: [pierna, lejos], giroCabeza: -38 }, pal, k, { delante: palanca });
        },
    },
    // De pie sobre un escalón: los talones bajan y suben sobre la punta de los pies.
    talones: {
        vista: "lado", fondo: "escalon", encuadre: [24, 100],
        dibujar(u, pal, k) {
            const angulo = mezcla(-14, 36, u);
            const planta = [Math.cos(rad(angulo)), Math.sin(rad(angulo))];
            const abajo = [-planta[1], planta[0]];
            const bolaDelPie = [67.5, 96];
            const A = sumar(sumar(bolaDelPie, planta, -6), abajo, -MEDIDAS.tobillo);
            const c = dePie(A);
            c.piernas[0].planta = planta;
            const b = brazo(c.S, 3, 2);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { entre: mancuernaDePunta(centroDelPuno(sumar3(b, [-1.2, 0])), 3.2), delante: mancuernaDePunta(centroDelPuno(b), 3.4) });
        },
    },
    // Acostado en la colchoneta: el pecho sube hacia las rodillas y baja despacio.
    abdominales: {
        vista: "lado", fondo: "colchoneta", encuadre: [6, 114],
        dibujar(u, pal, k) {
            const H = [66, 95];
            const S = sumar(H, dir(mezcla(-92, -126, u)), MEDIDAS.torso);
            const m = marcoTorso(H, S);
            const nuca = sumar(sumar(m.S, m.u, MEDIDAS.cuello + 4.6), m.f, -4.2);
            const b = brazoHacia(S, nuca, -1);
            const pierna = piernaHacia(H, [88, 98], -1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [{ ...pierna, planta: [1, 0] }, { ...piernaHacia(sumar(H, [-1, 0.5]), [85, 98.5], -1), planta: [1, 0] }] }, pal, k);
        },
    },
    // De pie, de frente: los hombros suben hacia las orejas.
    encogimiento: {
        vista: "frente", fondo: "sala", encuadre: [24, 96],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { subir: 3.8 * u });
            const brazos = cuerpo.lados.map((l) => brazo(l.S, l.s * 5, l.s * 3));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { sobreLasManos: brazos.map((b) => mancuernaDePunta(centroDelPuno(b), 3.4)).join("") });
        },
    },

    // ===== (v168) Los movimientos nuevos: cada ejercicio con una figura que se parece a lo que haces =====
    // --- Pecho ---
    // Sentado en el banco inclinado: las mancuernas suben desde el pecho hasta arriba de los hombros.
    press_inclinado: {
        vista: "lado", fondo: "banco-inclinado", encuadre: [14, 100],
        dibujar(u, pal, k) {
            const { H, S, piernas } = sentadoInclinado();
            const mano = mezclaP(sumar(S, [5, -5]), sumar(S, [1.5, -25.4]), u);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [0.8, 0.8]), sumar(mano, [0.8, 0.4]), 1);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -6 }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Acostado en el banco plano, una mancuerna en cada mano: bajan junto al pecho y suben con los brazos estirados.
    press_mancuernas: {
        vista: "lado", fondo: "banco-libre", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 75], S = [45, 75];
            const mano = mezclaP([50.5, 67], [46, 49.5], u);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [0, 1]), sumar(mano, [0.6, 0.6]), 1);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 91), pierna(sumar(H, [-1, 1]), 88)], giroCabeza: -8 }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Acostado en el banco declinado (la cabeza más abajo, las piernas trabadas en los rodillos): la barra baja al pecho y sube.
    press_declinado: {
        vista: "lado", fondo: "banco-declinado", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 72];
            const S = sumar(H, dir(-70), MEDIDAS.torso);
            const mano = mezclaP(sumar(S, [4.5, -9.5]), sumar(S, [1, -25.4]), u);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [0.6, 0.9]), mano, 1);
            const pierna = (cadera, muslo, espinilla) => {
                const K = sumar(cadera, dir(muslo), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(espinilla), MEDIDAS.pierna) };
            };
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 118, 8), pierna(sumar(H, [-0.8, 1]), 116, 5)], giroCabeza: -4 }, pal, k, {
                entre: disco(barra),
                delante: puntaDeBarra(barra),
            });
        },
    },
    // Sentado en la máquina de aperturas (pec deck), de frente: los brazos se cierran delante del pecho, como abrazando un árbol.
    aperturas: {
        vista: "frente", fondo: "pec-deck", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const giro = mezcla(4, 102, u);   // 0 = los brazos al costado, 90 = apuntan hacia ti
            const brazos = cuerpo.lados.map((l) => brazoHaciaTi(l.S, l.s, giro, 14, 1.6));
            const manijas = brazos.map(centroDelPuno).map((m) => barraRecta([m[0], m[1] - 4.5], [m[0], m[1] + 4.5], 1.4)).join("");
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: manijas });
        },
    },
    // De pie entre dos poleas altas, de frente: los brazos bajan casi estirados y las manos se juntan delante de la cadera.
    cruce_poleas: {
        vista: "frente", fondo: "poleas-dobles", encuadre: [0, 120],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60);
            const angulo = mezcla(122, -18, u);   // 180 = arriba, 90 = al costado, 0 = abajo
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, sumar(l.S, [l.s * Math.sin(rad(angulo)), Math.cos(rad(angulo))], 25.7), l.s));
            const inicio = cuerpo.lados.map((l) => centroDelPuno(brazoHacia(l.S, sumar(l.S, [l.s * Math.sin(rad(122)), Math.cos(rad(122))], 25.7), l.s)));
            const manos = brazos.map(centroDelPuno);
            const poleas = [[16.5, 18], [103.5, 18]];
            const pesas = pilaDePesas(1, subidaDeCable(poleas[0], manos[0], inicio[0])) + pilaDePesas(106, subidaDeCable(poleas[1], manos[1], inicio[1]));
            const cables = manos.map((m, i) => cable(poleas[i], m)).join("");
            return pesas + cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: cables });
        },
    },
    // De frente al suelo: el cuerpo recto como una tabla baja hasta casi tocar el suelo y sube con los brazos estirados.
    flexion: {
        vista: "lado", fondo: "colchoneta", encuadre: [10, 112],
        dibujar(u, pal, k) {
            const A = [22, 95.5];
            const alto = mezcla(19, 3.5, u);   // cuántos grados sube la línea del cuerpo desde los pies
            const linea = [Math.cos(rad(alto)), -Math.sin(rad(alto))];
            const K = sumar(A, linea, MEDIDAS.pierna);
            const H = sumar(K, linea, MEDIDAS.muslo);
            const S = sumar(H, linea, MEDIDAS.torso);
            const planta = unitario([0.5, 0.87]);   // en puntas de pie
            const mano = [83, 100.4];
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-0.6, -0.8]), sumar(mano, [-1.5, 0]), 1);
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-1.2, -0.4]), A: sumar(A, [-1.6, 0]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -8 }, pal, k);
        },
    },
    // Entre las barras paralelas: los brazos se doblan hacia atrás, el cuerpo baja inclinado hacia adelante y vuelve a subir.
    fondos: {
        vista: "lado", fondo: "paralelas", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const mano = [60, 61];
            const S = mezclaP([61.5, 35.6], [67, 46.5], u);
            const inclinacion = mezcla(10, 32, u);
            const H = sumar(S, dir(-inclinacion), MEDIDAS.torso);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-1, 0.4]), [59, 61], 1);
            const pierna = (cadera, atras) => piernaHacia(cadera, sumar(cadera, [-atras, 25.5]), -1);   // las rodillas dobladas, los pies atrás
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 7), pierna(sumar(H, [-1.6, 0.6]), 3)], giroCabeza: -inclinacion * 0.6 }, pal, k);
        },
    },

    // --- Tríceps ---
    // Acostado en el banco (press francés): los codos quietos apuntando arriba y la barra baja hasta la frente.
    press_frances: {
        vista: "lado", fondo: "banco-libre", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 75], S = [45, 75];
            const antebrazo = mezcla(-42, -166, u);
            const b = brazo(S, 196, antebrazo);
            const lejos = brazo(sumar(S, [0, 1]), 196, antebrazo);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 91), pierna(sumar(H, [-1, 1]), 88)], giroCabeza: -8 }, pal, k, {
                entre: disco(barra, 6.5),
                delante: puntaDeBarra(barra),
            });
        },
    },
    // De espaldas a la polea alta, inclinado hacia adelante: la cuerda sale de detrás de la cabeza y los brazos se estiran arriba.
    extension_cuerda: {
        vista: "lado", fondo: "polea-alta", encuadre: [22, 120],
        dibujar(u, pal, k) {
            const H = [57, 63.5];
            const S = sumar(H, dir(210), MEDIDAS.torso);   // mira a la izquierda: inclinado 30° hacia adelante
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], 1), planta: [-1, 0] });
            // El brazo va un poco por detrás de la línea del torso y la cabeza mira un poco abajo: así no se tapan.
            const b = brazo(S, 200, mezcla(30, 196, u));
            const inicio = brazo(S, 200, 30);
            const polea = [93, 9];
            const mano = centroDelPuno(b);
            return pilaDePesas(99, subidaDeCable(polea, mano, centroDelPuno(inicio)))
                + cuerpoDeLado({ H, S, mira: -1, brazos: [b], piernas: [pierna(H, 50), pierna(sumar(H, [1.2, 0.4]), 64)], giroCabeza: 14 }, pal, k, {
                    entre: cable(polea, mano),
                    delante: puntaDeBarra(mano),
                });
        },
    },
    // De pie, una mancuerna con las dos manos: los codos arriba junto a la cabeza y la pesa sube desde la nuca.
    extension_arriba: {
        vista: "lado", fondo: "sala", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56));
            const antebrazo = mezcla(-14, -176, u);
            const b = brazo(c.S, 188, antebrazo);
            const lejos = brazo(sumar(c.S, [-1.2, 0.3]), 188, antebrazo);
            const hacia = unitario(restar(b.M, b.E));
            return cuerpoDeLado({ ...c, brazos: [b, lejos], giroCabeza: 6 }, pal, k, { entre: mancuernaGirada(sumar(centroDelPuno(b), hacia, 3.4), hacia) });
        },
    },
    // Apoyado en el banco: el brazo pegado al cuerpo y el antebrazo se estira hacia atrás.
    patada_triceps: {
        vista: "lado", fondo: "banco-plano", encuadre: [12, 104],
        dibujar(u, pal, k) {
            const { H, S, piernas, apoyo } = apoyadoEnBanco();
            const b = brazo(S, -84, mezcla(4, -86, u));
            const hacia = unitario(restar(b.M, b.E));
            return cuerpoDeLado({ H, S, brazos: [b, apoyo], piernas, giroCabeza: -12 }, pal, k, { delante: mancuernaGirada(centroDelPuno(b), [-hacia[1], hacia[0]]) });
        },
    },
    // Con las manos en el borde de un banco y los talones en el suelo: los codos se doblan hacia atrás y la cadera baja.
    fondos_banco: {
        vista: "lado", fondo: "banco-corto", encuadre: [4, 94],
        dibujar(u, pal, k) {
            const mano = [33.5, 81.6];
            const S = mezclaP([45.5, 59], [47.5, 69.5], u);
            const H = sumar(S, dir(-4), MEDIDAS.torso);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: unitario([0.3, -1]) });
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-1, 0.4]), sumar(mano, [-1, 0]), 1);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 72), pierna(sumar(H, [-1.4, 0.6]), 69.5)] }, pal, k);
        },
    },

    // --- Hombros ---
    // De pie, de lado: los brazos casi estirados suben hacia adelante hasta la altura de los hombros.
    elevacion_frontal: {
        vista: "lado", fondo: "sala", encuadre: [22, 106],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52));
            const a = mezcla(6, 96, u);
            const b = brazo(c.S, a, a + 6);
            const lejos = brazo(sumar(c.S, [-1.2, 0]), a, a + 6);
            return cuerpoDeLado({ ...c, brazos: [b, lejos] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Pájaros en la máquina (reverse pec deck), con el pecho contra la almohadilla: los brazos casi estirados empiezan
    // juntos adelante y se abren hacia atrás hasta formar una T.
    pajaros: {
        vista: "frente", fondo: "pec-deck-inverso", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const giro = mezcla(100, 2, u);   // 90 = los brazos apuntan hacia ti, 0 = al costado
            const brazos = cuerpo.lados.map((l) => brazoHaciaTi(l.S, l.s, giro, 6, 0.8));
            const manijas = brazos.map(centroDelPuno).map((m) => barraRecta([m[0], m[1] - 4.5], [m[0], m[1] + 4.5], 1.4)).join("");
            const pecho = marco("M60 80 L60 86", 2) + almohadilla(51, 60, 18, 22);   // la almohadilla del pecho, delante de ti
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { sobreElTorso: pecho, bajoLasManos: manijas });
        },
    },
    // De pie frente a la polea: tira de la cuerda hacia la cara con los codos altos.
    face_pull: {
        vista: "lado", fondo: "polea-cara", encuadre: [26, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(46), { torso: -6 });
            const inicio = sumar(c.S, [24.6, -3]);
            const mano = mezclaP(inicio, sumar(c.S, [3.5, -11]), u);
            const b = brazoHacia(c.S, mano, -1);
            const lejos = brazoHacia(sumar(c.S, [-1.2, 0.2]), sumar(mano, [-1.2, 0.3]), -1);
            const polea = [93, 29];
            const punta = centroDelPuno(b);
            return pilaDePesas(99, subidaDeCable(polea, punta, centroDelPuno(brazoHacia(c.S, inicio, -1))))
                + cuerpoDeLado({ ...c, brazos: [b, lejos] }, pal, k, { delante: cable(polea, punta) + puntaDeBarra(punta) });
        },
    },

    // --- Espalda ---
    // Una rodilla y una mano en el banco: la mancuerna sube desde abajo hasta la cadera, con el codo hacia atrás.
    remo_mancuerna: {
        vista: "lado", fondo: "banco-plano", encuadre: [12, 104],
        dibujar(u, pal, k) {
            const { H, S, piernas, apoyo } = apoyadoEnBanco();
            const b = brazoHacia(S, mezclaP(sumar(S, [0.5, 25.4]), [50, 67], u), 1);
            return cuerpoDeLado({ H, S, brazos: [b, apoyo], piernas, giroCabeza: -12 }, pal, k, { delante: mancuernaDeLado(centroDelPuno(b)) });
        },
    },

    // --- Bíceps ---
    // Sentado en el banco inclinado: los brazos cuelgan por detrás del cuerpo y el antebrazo sube.
    curl_inclinado: {
        vista: "lado", fondo: "banco-inclinado", encuadre: [14, 100],
        dibujar(u, pal, k) {
            const { H, S, piernas } = sentadoInclinado();
            const antebrazo = mezcla(-6, 148, u);
            const b = brazo(S, -8, antebrazo);
            const lejos = brazo(sumar(S, [0.8, 0.8]), -8, antebrazo);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -4 }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Sentado en el banco Scott: los brazos apoyados en la almohadilla inclinada y el antebrazo sube hasta el hombro.
    curl_predicador: {
        vista: "lado", fondo: "scott", encuadre: [18, 98],
        dibujar(u, pal, k) {
            const H = [44, 78];
            const S = sumar(H, dir(164), MEDIDAS.torso);
            const antebrazo = mezcla(42, 166, u);
            const b = brazo(S, 46, antebrazo);
            const lejos = brazo(sumar(S, [-1, 0.4]), 46, antebrazo);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 62), pierna(sumar(H, [-1, 0.6]), 59)], giroCabeza: 10 }, pal, k, {
                entre: disco(barra, 6),
                sobreElTorso: almohadillaEntre([48.5, 60.8], [58.5, 70.5], 6.5),   // la almohadilla, delante del pecho y debajo del brazo
                delante: puntaDeBarra(barra),
            });
        },
    },
    // Sentado en la punta del banco, inclinado: el codo apoyado en el muslo y la mancuerna sube hacia el hombro.
    curl_concentrado: {
        vista: "lado", fondo: "banco-corto", encuadre: [4, 92],
        dibujar(u, pal, k) {
            const H = [36, 81.6];
            const S = sumar(H, dir(138), MEDIDAS.torso);
            const b = brazo(S, 4, mezcla(-2, 158, u));
            const cerca = piernaHacia(H, [58, SUELO - MEDIDAS.tobillo], -1);
            const lejos = piernaHacia(sumar(H, [-1, 0.4]), [55, SUELO - MEDIDAS.tobillo], -1);
            const apoyo = brazoHacia(sumar(S, [-1, 0.5]), sumar(lejos.K, [-1, -4.5]), 1);   // la otra mano en la rodilla
            return cuerpoDeLado({ H, S, brazos: [b, apoyo], piernas: [{ ...cerca, planta: [1, 0] }, { ...lejos, planta: [1, 0] }], giroCabeza: 14 }, pal, k, {
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Colgado de la barra, de frente: el cuerpo sube hasta que la barbilla pasa la barra (los codos bajan hacia los costados).
    dominada: {
        vista: "frente", fondo: "barra-frente", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const yHombro = mezcla(38.6, 17.5, u);
            const yCadera = yHombro + MEDIDAS.torso;
            // Las rodillas dobladas y los pies hacia atrás: la espinilla se aleja de ti y se ve más corta.
            const cuerpo = cuerpoFrente(60, yCadera, yHombro, (s) => ({ K: [60 + s * 5.4, yCadera + 19.6], A: [60 + s * 4.6, yCadera + 27.5] }));
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 20, 15.2], l.s));
            return cuerpoDeFrente(cuerpo, brazos, pal, k);
        },
    },
    // Remo con barra (o en barra T), inclinado: la barra sube desde abajo hasta el abdomen, con los codos hacia atrás.
    remo_inclinado: {
        vista: "lado", fondo: "sala", encuadre: [20, 100],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52), { espinilla: 14, muslo: 50, torso: 64 });
            const m = marcoTorso(c.H, c.S);
            const b = brazoHacia(c.S, mezclaP(sumar(c.S, [0.6, 25.4]), enTorso(m, 9, 9.5), u), 1);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -14 }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // De pie frente a la polea alta, un poco inclinado: los brazos casi estirados bajan desde arriba hasta los muslos.
    pullover: {
        vista: "lado", fondo: "polea-alta", encuadre: [26, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52), { espinilla: 8, muslo: 22, torso: 34 });
            const a = mezcla(150, 12, u);
            const b = brazo(c.S, a, a + 8);
            const polea = [93, 9];
            const mano = centroDelPuno(b);
            return pilaDePesas(99, subidaDeCable(polea, mano, centroDelPuno(brazo(c.S, 150, 158))))
                + cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { delante: cable(polea, mano) + puntaDeBarra(mano) });
        },
    },
    // En el banco de hiperextensiones (45°): el torso cuelga hacia el suelo y sube hasta quedar en línea con las piernas.
    hiperextension: {
        vista: "lado", fondo: "hiperextension", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const linea = dir(135);   // las piernas suben a 45°
            const A = [26, 86];
            const K = sumar(A, linea, MEDIDAS.pierna);
            const H = sumar(K, linea, MEDIDAS.muslo);
            const S = sumar(H, dir(mezcla(12, 135, u)), MEDIDAS.torso);
            const m = marcoTorso(H, S);
            const b = brazoHacia(S, enTorso(m, MEDIDAS.torso - 7, 6.5), -1);   // los brazos cruzados sobre el pecho
            const lejos = { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-0.8, -0.8]), A: sumar(A, [-0.8, -0.8]) };
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [{ H, K, A }, lejos], giroCabeza: mezcla(-10, 0, u) }, pal, k);
        },
    },
    // Colgado de la barra, de lado: las rodillas suben hasta la altura de la cadera y bajan despacio.
    colgado_rodillas: {
        vista: "lado", fondo: "barra-lado", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const S = [56.5, 32];
            const H = sumar(S, dir(mezcla(0, 8, u)), MEDIDAS.torso);   // la pelvis se adelanta un poco
            const pierna = (cadera, muslo, espinilla) => {
                const K = sumar(cadera, dir(muslo), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(espinilla), MEDIDAS.pierna) };
            };
            const muslo = mezcla(4, 100, u), espinilla = mezcla(-2, -6, u);
            const mano = [49, 7.4];   // las manos un poco por detrás de la cabeza: así el brazo no tapa la cara
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-1.2, 0]), sumar(mano, [-1.2, 0]), 1);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, muslo, espinilla), pierna(sumar(H, [-1.6, 0.4]), muslo - 4, espinilla - 2)] }, pal, k);
        },
    },

    // --- Cuádriceps ---
    // En la prensa inclinada: los pies empujan la plataforma, que sube y baja por sus rieles; las rodillas llegan cerca del pecho.
    prensa: {
        vista: "lado", fondo: "prensa", encuadre: [6, 112],
        dibujar(u, pal, k) {
            const A = sumar([70, 60], RIEL_PRENSA, -18 * u);
            return enLaPrensa(A, PLANTA_PRENSA, pal, k);
        },
    },
    // En la prensa con las piernas casi estiradas: solo se mueven los tobillos, que empujan la plataforma con la punta del pie.
    talones_prensa: {
        vista: "lado", fondo: "prensa", encuadre: [6, 112],
        dibujar(u, pal, k) {
            return enLaPrensa([70.5, 59.5], rotar(PLANTA_PRENSA, mezcla(-8, 30, u)), pal, k);
        },
    },
    // Sentado en la máquina de extensiones: la pierna sube hasta quedar estirada y baja despacio.
    extension_cuadriceps: {
        vista: "lado", fondo: "extension", encuadre: [16, 104],
        dibujar(u, pal, k) {
            const H = [48, 78];
            const S = sumar(H, dir(190), MEDIDAS.torso);   // un poco echado hacia atrás, contra el respaldo
            const pierna = (cadera, angulo) => {
                const K = sumar(cadera, dir(92), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(angulo), MEDIDAS.pierna) };
            };
            const angulo = mezcla(4, 86, u);   // 0 = la espinilla colgando, 90 = la pierna estirada
            const cerca = pierna(H, angulo), lejos = pierna(sumar(H, [-0.8, -1]), angulo - 2);
            const e = unitario(restar(cerca.A, cerca.K));
            const centro = sumar(sumar(cerca.A, [e[1], -e[0]], 3.6), e, -2);   // el rodillo, delante del tobillo
            const palanca = barraRecta([69.5, 78.7], centro, 1.8) + rodillo(centro);
            const b = brazoHacia(S, [H[0] + 5, H[1] + 3], 1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { delante: palanca });
        },
    },
    // En la máquina hack: la espalda apoyada en el respaldo, que baja por los rieles inclinados mientras las rodillas se doblan.
    hack: {
        vista: "lado", fondo: "hack", encuadre: [14, 100],
        dibujar(u, pal, k) {
            const H = sumar([58, 63], dir(35), mezcla(0, 17, u));
            const S = sumar(H, dir(215), MEDIDAS.torso);   // echado hacia atrás 35°
            const planta = unitario([1, -0.27]);
            const pie = [72, 98.8];
            const cerca = { ...piernaHacia(H, pie, -1), planta };
            const lejos = { ...piernaHacia(sumar(H, [-0.6, 0.8]), sumar(pie, [-2, 0.5]), -1), planta };
            const m = marcoTorso(H, S);
            const hombrera = almohadillaEntre(enTorso(m, MEDIDAS.torso + 2.5, -5), enTorso(m, MEDIDAS.torso + 2.5, 4), 3.6);
            const b = brazoHacia(S, enTorso(m, MEDIDAS.torso + 1, 8), 1);   // las manos en las manijas, junto a los hombros
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { detras: respaldo(H, 215, -2, 27), entre: hombrera });
        },
    },
    // Hack con barra: la barra va detrás de las piernas, con los brazos estirados; baja la cadera con el pecho alto.
    hack_barra: {
        vista: "lado", fondo: "sala", encuadre: [20, 100],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56), { espinilla: 36 * u, muslo: 76 * u, torso: 24 * u });
            const b = brazo(c.S, -2, -2);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Zancada con mancuernas: un pie adelante y otro atrás; la cadera baja recta hasta que la rodilla de atrás casi toca el suelo.
    zancada: {
        vista: "lado", fondo: "sala", encuadre: [18, 96],
        dibujar(u, pal, k) {
            const H = [52, mezcla(66, 80.6, u)];
            const S = sumar(H, dir(178), MEDIDAS.torso);
            const adelante = { ...piernaHacia(H, [66, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] };
            const atras = { ...piernaHacia(sumar(H, [-1, 0.6]), [38, 96.6], -1), planta: unitario([0.8, 0.6]) };   // en puntas de pie
            const b = brazo(S, 3, 2);
            const lejos = brazo(sumar(S, [-1.2, 0]), 3, 2);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [adelante, atras] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Sentadilla búlgara: el empeine de atrás apoyado en un banco; la cadera baja sobre la pierna de adelante.
    bulgara: {
        vista: "lado", fondo: "banco-corto", encuadre: [2, 94],
        dibujar(u, pal, k) {
            const H = [53, mezcla(66, 80, u)];
            const S = sumar(H, dir(172), MEDIDAS.torso);
            const adelante = { ...piernaHacia(H, [68, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] };
            const atras = { ...piernaHacia(sumar(H, [-1, 0.6]), [28, 81.6], -1), planta: unitario([-1, -0.12]) };   // la suela mira hacia arriba
            const b = brazo(S, 3, 2);
            const lejos = brazo(sumar(S, [-1.2, 0]), 3, 2);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [adelante, atras] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Sentadilla goblet: una mancuerna de pie contra el pecho, con los codos abajo; el pecho queda más derecho.
    sentadilla_goblet: {
        vista: "lado", fondo: "sala", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(54), { espinilla: 40 * u, muslo: 76 * u, torso: 24 * u });
            const m = marcoTorso(c.H, c.S);
            const b = brazoHacia(c.S, enTorso(m, MEDIDAS.torso - 8, 8.5), 1);
            const pesa = mancuernaGirada(enTorso(m, MEDIDAS.torso - 5.5, 10), m.u);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { sobreElTorso: pesa });
        },
    },
    // Sentadilla frontal: la barra apoyada delante de los hombros, con los codos altos; el pecho queda más derecho.
    sentadilla_frontal: {
        vista: "lado", fondo: "jaula", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(54), { espinilla: 40 * u, muslo: 76 * u, torso: 22 * u });
            const m = marcoTorso(c.H, c.S);
            const barra = enTorso(m, MEDIDAS.torso + 0.6, 5.6);
            // El brazo apunta adelante (los codos altos) y el antebrazo vuelve hacia la barra.
            const E = sumar(c.S, rotar(m.f, -14), MEDIDAS.brazo);
            const b = { S: c.S, E, M: sumar(E, unitario(restar(barra, E)), MEDIDAS.antebrazo - 1.4) };
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Sentadilla sumo, de frente: los pies muy abiertos, las rodillas hacia afuera y la mancuerna colgando entre las piernas.
    sentadilla_sumo: {
        vista: "frente", fondo: "sala", encuadre: [14, 106],
        dibujar(u, pal, k) {
            const yCadera = mezcla(62.5, 79, u);
            // Al bajar, el muslo apunta hacia ti y hacia afuera: se ve más corto (escorzo).
            const cuerpo = cuerpoFrente(60, yCadera, yCadera - MEDIDAS.torso * mezcla(1, 0.94, u), (s) => ({
                K: [60 + s * mezcla(10.8, 17.6, u), mezcla(82, 83.5, u)], A: [60 + s * 16, SUELO - MEDIDAS.tobillo],
            }));
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 2.2, cuerpo.yHombro + 23.5], -l.s));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: mancuernaGirada([60, cuerpo.yHombro + 30.6], [0, 1]) });
        },
    },
    // Buenos días: la barra en la espalda, las piernas casi estiradas y el torso baja hasta casi quedar horizontal.
    buenos_dias: {
        vista: "lado", fondo: "jaula", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(54), { espinilla: 6 * u, muslo: 30 * u, torso: 80 * u });
            const m = marcoTorso(c.H, c.S);
            const barra = enTorso(m, MEDIDAS.torso - 1.6, -4.4);
            const b = brazoHacia(c.S, sumar(sumar(barra, m.f, 1.6), m.u, -0.4), -1);
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -22 * u }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Peso muerto: la barra sale del suelo (u = 0) y sube pegada a las piernas hasta quedar de pie (u = 1).
    peso_muerto: {
        vista: "lado", fondo: "sala", encuadre: [20, 100],
        dibujar(u, pal, k) {
            const t = 1 - u;   // cuánto falta para estar de pie
            const c = dePie(tobilloEn(54), { espinilla: 25 * t, muslo: 70 * t, torso: 66 * t });
            const b = brazo(c.S, 4 * u, 2 * u);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -16 * t }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Peso muerto sumo, de frente: los pies muy abiertos y las manos por dentro de las rodillas; la barra sube desde el suelo.
    peso_muerto_sumo: {
        vista: "frente", fondo: "sala", encuadre: [6, 114],
        dibujar(u, pal, k) {
            const escala = mezcla(0.62, 1, u);   // abajo el pecho se inclina hacia ti: el torso se ve más corto
            const yHombro = mezcla(66.9, 37.5, u);
            const yCadera = yHombro + MEDIDAS.torso * escala;
            const cuerpo = cuerpoFrente(60, yCadera, yHombro, (s) => ({ K: [60 + s * mezcla(18, 10.8, u), mezcla(84, 82, u)], A: [60 + s * 16, SUELO - MEDIDAS.tobillo] }));
            const yBarra = yHombro + 27.6;
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 8, yBarra - 1.6], l.s));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: barraDeFrente([60, yBarra]) });
        },
    },

    // --- Isquiosurales ---
    // Sentado en la máquina: la pierna estirada baja empujando el rodillo hasta quedar doblada debajo del asiento.
    curl_femoral_sentado: {
        vista: "lado", fondo: "femoral-sentado", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [46, 76];
            const S = sumar(H, dir(192), MEDIDAS.torso);   // un poco echado hacia atrás, contra el respaldo
            const pierna = (cadera, angulo) => {
                const K = sumar(cadera, dir(90), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(angulo), MEDIDAS.pierna) };
            };
            const angulo = mezcla(80, -8, u);   // de casi estirada (adelante) a doblada debajo del asiento
            const cerca = pierna(H, angulo), lejos = pierna(sumar(H, [-0.8, -1]), angulo + 2);
            const e = unitario(restar(cerca.A, cerca.K));
            const centro = sumar(sumar(cerca.A, [-e[1], e[0]], 3.4), e, -2);   // el rodillo, detrás del tobillo
            const palanca = barraRecta([67.5, 76], centro, 1.8) + rodillo(centro);
            const b = brazoHacia(S, [H[0] + 6, H[1] + 2.5], 1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { delante: palanca });
        },
    },
    // Curl nórdico: de rodillas con los tobillos trabados; el cuerpo recto cae despacio hacia adelante y vuelve.
    nordico: {
        vista: "lado", fondo: "nordico", encuadre: [10, 106],
        dibujar(u, pal, k) {
            const K = [48, 98];
            const A = sumar(K, dir(-92), MEDIDAS.pierna);   // la espinilla en el suelo, hacia atrás
            const inclinacion = mezcla(4, 62, u);
            const H = sumar(K, dir(180 - inclinacion), MEDIDAS.muslo);
            const S = sumar(H, dir(176 - inclinacion), MEDIDAS.torso);
            const m = marcoTorso(H, S);
            // Los brazos cruzados en el pecho; abajo se adelantan, listos para frenar en el suelo.
            const b = brazoHacia(S, mezclaP(enTorso(m, MEDIDAS.torso - 7, 6.5), sumar(S, [7, 12]), u), -1);
            const planta = unitario([-0.42, 0.91]);
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-1, 0.4]), K: sumar(K, [-1.6, -0.6]), A: sumar(A, [-1.6, -0.6]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b], piernas, giroCabeza: -6 * u }, pal, k);
        },
    },
    // De pie en la máquina, con el pecho apoyado: el talón sube hacia el glúteo empujando el rodillo.
    curl_femoral_pie: {
        vista: "lado", fondo: "femoral-pie", encuadre: [16, 100],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52), { torso: 14 });
            const K = sumar(c.H, dir(10), MEDIDAS.muslo);
            const cerca = { H: c.H, K, A: sumar(K, dir(mezcla(4, -112, u)), MEDIDAS.pierna) };
            const e = unitario(restar(cerca.A, K));
            const centro = sumar(sumar(cerca.A, [-e[1], e[0]], 3.4), e, -2);   // el rodillo, detrás del tobillo
            const palanca = barraRecta([57, 81.4], centro, 1.8) + rodillo(centro);
            const b = brazoHacia(c.S, [69, 51], 1);   // las manos en las manijas
            return cuerpoDeLado({ ...c, brazos: [b], piernas: [cerca, { ...c.piernas[0], H: sumar(c.H, [-1, 0.4]) }] }, pal, k, { delante: palanca });
        },
    },

    // --- Pantorrillas ---
    // Sentado, con un peso sobre las rodillas: los talones bajan y suben sobre la punta de los pies.
    talones_sentado: {
        vista: "lado", fondo: "talones-sentado", encuadre: [16, 104],
        dibujar(u, pal, k) {
            const angulo = mezcla(-14, 30, u);
            const planta = [Math.cos(rad(angulo)), Math.sin(rad(angulo))];
            const abajo = [-planta[1], planta[0]];
            const A = sumar(sumar([72, 96], planta, -6), abajo, -MEDIDAS.tobillo);   // la punta del pie queda quieta en el escalón
            const H = [44, 77];
            const S = sumar(H, dir(174), MEDIDAS.torso);
            const cerca = { ...piernaHacia(H, A, -1), planta };
            const lejos = { ...piernaHacia(sumar(H, [-0.8, -0.8]), sumar(A, [-1.6, -0.4]), -1), planta };
            // La almohadilla apoyada sobre las rodillas, en una palanca con su disco, que sube con ellas.
            const sobre = sumar(cerca.K, [-4, -8.4]);
            const pivote = [92, 90];
            const palanca = barraRecta(pivote, sumar(sobre, [4, 2]), 2) + disco(sumar(mezclaP(pivote, sobre, 0.4), [0, -5]), 6.5)
                + almohadillaEntre(sumar(sobre, [-5, 0]), sumar(sobre, [6, 0]), 3.8);
            const b = brazoHacia(S, sumar(sobre, [-1, -1]), 1);   // las manos sobre la almohadilla
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { delante: palanca });
        },
    },
    // Talones tipo burro: inclinado a 90°, los antebrazos apoyados adelante; los talones bajan y suben en el escalón.
    talones_burro: {
        vista: "lado", fondo: "burro", encuadre: [24, 116],
        dibujar(u, pal, k) {
            const angulo = mezcla(-14, 34, u);
            const planta = [Math.cos(rad(angulo)), Math.sin(rad(angulo))];
            const abajo = [-planta[1], planta[0]];
            const A = sumar(sumar([60.5, 96], planta, -6), abajo, -MEDIDAS.tobillo);
            const c = dePie(A, { torso: 86 });
            c.piernas[0].planta = planta;
            const b = brazoHacia(c.S, [98, 64.5], 1);   // el antebrazo apoyado en la almohadilla
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -16 }, pal, k);
        },
    },

    // --- Glúteos ---
    // Acostado boca arriba con las rodillas dobladas: la cadera sube hasta quedar en línea con los hombros y las rodillas.
    puente: {
        vista: "lado", fondo: "colchoneta", encuadre: [8, 100],
        dibujar(u, pal, k) {
            const S = [34, 95];
            const H = sumar(S, dir(mezcla(90, 122, u)), MEDIDAS.torso);
            const pie = [78, SUELO - MEDIDAS.tobillo];
            const cerca = { ...piernaHacia(H, pie, -1), planta: [1, 0] };
            const lejos = { ...piernaHacia(sumar(H, [-1, -0.8]), sumar(pie, [-2, 0]), -1), planta: [1, 0] };
            const b = brazoHacia(S, [S[0] + 25, 99.6], 1);   // los brazos en el suelo, a los costados
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos], giroCabeza: -6 }, pal, k);
        },
    },
    // Hip thrust: la espalda alta en el borde del banco y la barra sobre la cadera, que sube hasta quedar horizontal.
    hip_thrust: {
        vista: "lado", fondo: "banco-corto", encuadre: [4, 100],
        dibujar(u, pal, k) {
            const S = [34, 81.5];
            const H = sumar(S, dir(mezcla(52, 92, u)), MEDIDAS.torso);   // 52 = la cadera abajo, cerca del suelo; 90 = horizontal
            const pie = [80, SUELO - MEDIDAS.tobillo];
            const cerca = { ...piernaHacia(H, pie, -1), planta: [1, 0] };
            const lejos = { ...piernaHacia(sumar(H, [-1, -0.8]), sumar(pie, [-2.5, 0]), -1), planta: [1, 0] };
            const m = marcoTorso(H, S);
            const barra = enTorso(m, 0.5, 7.4);   // la barra sobre la cadera
            const b = brazoHacia(S, sumar(barra, [-2.5, 0.5]), -1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos], giroCabeza: mezcla(-10, 14, u) }, pal, k, { entre: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Patada de glúteo en polea baja: el cable va al tobillo y la pierna se va hacia atrás, casi estirada.
    patada_gluteo: {
        vista: "lado", fondo: "polea-suelo", encuadre: [24, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(64), { espinilla: 4, muslo: 6, torso: 30 });
            const pierna = (t) => {
                const muslo = mezcla(10, -40, t);
                const K = sumar(c.H, dir(muslo), MEDIDAS.muslo);
                return { H: c.H, K, A: sumar(K, dir(muslo - 14), MEDIDAS.pierna) };
            };
            const cerca = pierna(u);
            const polea = [93, 97];
            const b = brazoHacia(c.S, [93.5, 52], 1);   // las manos en la torre
            return pilaDePesas(99, subidaDeCable(polea, cerca.A, pierna(0).A))
                + cuerpoDeLado({ ...c, brazos: [b], piernas: [cerca, { ...c.piernas[0], H: sumar(c.H, [-1, 0.4]) }] }, pal, k, { delante: cable(polea, cerca.A) });
        },
    },
    // Sentado en la máquina de abducción, de frente: las rodillas se abren empujando las almohadillas hacia afuera.
    abduccion: {
        vista: "frente", fondo: "asiento", encuadre: [14, 106],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            for (const l of cuerpo.lados) {
                l.K = [60 + l.s * mezcla(8.4, 17, u), cuerpo.yCadera + 4.6];
                l.A = [60 + l.s * mezcla(9, 13.5, u), SUELO - MEDIDAS.tobillo];
            }
            const almohadillas = cuerpo.lados.map((l) => marco(`M${n1(l.K[0] + l.s * 6.5)} ${n1(l.K[1] + 6)} L${60 + l.s * 5} 95`, 1.6)
                + almohadilla(n1(l.K[0] + l.s * 6.5 - 2.5), n1(l.K[1] - 7), 5, 14)).join("");
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 13.5, 72], -l.s));   // las manos en las manijas
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { delanteDeLasPiernas: almohadillas });
        },
    },

    // --- Abdomen ---
    // Plancha sobre los antebrazos: el cuerpo recto como una tabla; casi quieto, solo se nota la respiración.
    plancha: {
        vista: "lado", fondo: "colchoneta", encuadre: [10, 104],
        dibujar(u, pal, k) {
            const A = [20, 95.5];
            const linea = (alto) => [Math.cos(rad(alto)), -Math.sin(rad(alto))];
            const hombro = (alto) => sumar(A, linea(alto), MEDIDAS.pierna + MEDIDAS.muslo + MEDIDAS.torso);
            const alto = mezcla(9.2, 10, u);
            const K = sumar(A, linea(alto), MEDIDAS.pierna), H = sumar(K, linea(alto), MEDIDAS.muslo), S = hombro(alto);
            const mano = sumar(hombro(9.2), [12, 14.2]);   // el antebrazo en el suelo, hacia adelante
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-0.6, -0.8]), sumar(mano, [-1.5, 0]), 1);
            const planta = unitario([0.5, 0.87]);   // en puntas de pie
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-1.2, -0.4]), A: sumar(A, [-1.6, 0]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -6 }, pal, k);
        },
    },
    // De rodillas frente a la polea alta: la cuerda junto a la frente y el torso se enrolla hacia el suelo.
    crunch_polea: {
        vista: "lado", fondo: "polea-alta", encuadre: [22, 120],
        dibujar(u, pal, k) {
            const pose = (t) => {
                const K = [56, 99.5];
                const A = sumar(K, dir(-91), MEDIDAS.pierna);
                const H = sumar(K, dir(mezcla(186, 194, t)), MEDIDAS.muslo);   // la cadera se va un poco atrás
                const S = sumar(H, dir(180 - mezcla(18, 82, t)), MEDIDAS.torso);
                const m = marcoTorso(H, S);
                return { K, A, H, S, b: brazoHacia(S, enTorso(m, MEDIDAS.torso + 6, 4.5), 1) };
            };
            const { K, A, H, S, b } = pose(u);
            const polea = [93, 9];
            const punta = centroDelPuno(b);
            const planta = unitario([-1, -0.25]);   // el empeine en el suelo
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-1, 0.4]), K: sumar(K, [-1.6, 0]), A: sumar(A, [-1.6, 0]), planta }];
            return pilaDePesas(99, subidaDeCable(polea, punta, centroDelPuno(pose(0).b)))
                + cuerpoDeLado({ H, S, brazos: [b], piernas, giroCabeza: mezcla(0, 12, u) }, pal, k, { delante: cable(polea, punta) + puntaDeBarra(punta) });
        },
    },
    // Giro ruso, de frente: sentado, echado hacia atrás con las rodillas arriba; el disco va de un lado de la cadera al otro.
    giro_ruso: {
        vista: "frente", fondo: "colchoneta", encuadre: [14, 106],
        dibujar(u, pal, k) {
            const giro = mezcla(-1, 1, u);   // -1 = el disco a tu izquierda, 1 = a tu derecha
            const cuerpo = cuerpoFrente(60 + giro * 1.4, 96.5, 96.5 - MEDIDAS.torso * 0.74, () => ({}));   // echado atrás: el torso se ve más corto
            const centro = [60 + 14 * Math.sin(rad(giro * 90)), 88 - 8 * Math.cos(rad(giro * 90))];   // el disco hace un arco
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [centro[0] + l.s * 2.6, centro[1]], -l.s));
            // Las piernas: los muslos suben hacia ti (se ven cortos) y las rodillas quedan delante de todo: van al final.
            let piernas = "";
            for (const s of [-1, 1]) {
                const color = s < 0 ? pal.lejos : pal.piel;
                const H = [60 + s * 5, 96.5], K = [60 + s * 8.5, 86.5], A = [60 + s * 7, SUELO - MEDIDAS.tobillo];
                // Del más lejano al más cercano: el short, el muslo que sale de él, la espinilla, el pie y la rodilla.
                piernas += parte(H, K, 4.6 * k, 3.8, color) + parte(H, mezclaP(H, K, 0.3), 5.2 * k, 4.8 * k, SHORT)
                    + parte(K, A, 3.1, 1.9, color, { frente: s * 0.9 * k, atras: -s * 0.3 })
                    + `<path d="${curvaCerrada([[A[0] - 2.2, A[1] - 0.6], [A[0] + 2.2, A[1] - 0.6], [A[0] + 2.6 + s * 1.2, A[1] + 2.4], [A[0] + s * 0.6, A[1] + 3], [A[0] - 2.6 + s * 1.2, A[1] + 2.4]])}" fill="${color.sombra}" stroke="${color.linea}" stroke-width="1"/>`
                    + bola(K, 3.6, color);
            }
            return torsoDeFrente(cuerpo, pal, k) + cabezaDeFrente([cuerpo.N[0] + giro * 1.6, cuerpo.N[1]], pal)
                + brazos.map((b, i) => brazoEntero(b, i === 0 ? pal.lejos : pal.piel, k, i === 0 ? -1 : 1, { conPuno: false })).join("")
                + disco(centro, 5.5) + brazos.map((b, i) => puno(b, i === 0 ? pal.lejos : pal.piel)).join("")
                + piernas;
        },
    },
    // Acostado boca arriba: las piernas estiradas suben hasta quedar verticales y bajan sin tocar el suelo.
    elevacion_piernas: {
        vista: "lado", fondo: "colchoneta", encuadre: [8, 112],
        dibujar(u, pal, k) {
            const H = [62, 95], S = [37, 95];
            const linea = dir(mezcla(96, 178, u));   // 90 = estiradas sobre el suelo, 180 = hacia arriba
            const K = sumar(H, linea, MEDIDAS.muslo), A = sumar(K, linea, MEDIDAS.pierna);
            const lejos = { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-0.8, -0.8]), A: sumar(A, [-0.8, -0.8]) };
            const b = brazoHacia(S, [S[0] + 25, 99.6], 1);   // los brazos en el suelo, a los costados
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [{ H, K, A }, lejos], giroCabeza: -4 }, pal, k);
        },
    },
    // Rueda abdominal: de rodillas, la rueda rueda hacia adelante hasta que el cuerpo queda casi estirado, y vuelve.
    rueda: {
        vista: "lado", fondo: "colchoneta", encuadre: [8, 116],
        dibujar(u, pal, k) {
            const K = [40, 99.5];
            const A = sumar(K, dir(-91), MEDIDAS.pierna);
            const H = sumar(K, dir(180 - mezcla(15, 64, u)), MEDIDAS.muslo);
            const S = sumar(H, dir(180 - mezcla(75, 83, u)), MEDIDAS.torso);
            // La rueda va por el suelo, adelante, a la distancia de los brazos casi estirados.
            const yRueda = 97.6;
            const centro = [S[0] + Math.sqrt(Math.max(0, 25.4 ** 2 - (yRueda - S[1]) ** 2)), yRueda];
            const b = brazoHacia(S, centro, 1);
            const ruedita = `<circle cx="${n1(centro[0])}" cy="${n1(centro[1])}" r="4.4" fill="${DISCO.sombra}" stroke="${DISCO.linea}" stroke-width="1"/>
                <circle cx="${n1(centro[0])}" cy="${n1(centro[1])}" r="2.6" fill="none" stroke="${DISCO.luz}" stroke-width="1"/>${puntaDeBarra(centro)}`;
            const planta = unitario([-1, -0.25]);
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-1, 0.4]), K: sumar(K, [-1.6, 0]), A: sumar(A, [-1.6, 0]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b], piernas, giroCabeza: -10 }, pal, k, { entre: ruedita });
        },
    },
};

// (v168) La prensa de piernas: los rieles suben a 45° y la plataforma se mueve por ellos, siempre pegada a la planta del pie.
const RIEL_PRENSA = dir(135);                    // hacia arriba y adelante
const PLANTA_PRENSA = unitario([-1, -1]);        // la planta apoyada en la plataforma (los dedos hacia arriba)
const CENTRO_PRENSA = [69.8, 56];                // dónde está la plataforma con las piernas estiradas
function enLaPrensa(A, planta, pal, k) {
    const H = [44, 86];
    const S = sumar(H, dir(-124), MEDIDAS.torso);   // el respaldo, echado hacia atrás
    const cerca = { ...piernaHacia(H, A, -1), planta };
    const lejos = { ...piernaHacia(sumar(H, [-0.8, -0.6]), sumar(A, [-1.4, -0.6]), -1), planta };
    // La plataforma toca la punta de la planta (donde empuja el pie) y solo se mueve a lo largo del riel.
    const abajo = [-planta[1], planta[0]];
    const bola = sumar(sumar(A, planta, 6.5), abajo, 2.7);
    const avance = (bola[0] - CENTRO_PRENSA[0]) * RIEL_PRENSA[0] + (bola[1] - CENTRO_PRENSA[1]) * RIEL_PRENSA[1];
    const c = sumar(CENTRO_PRENSA, RIEL_PRENSA, avance + 1.8);
    const lado = [RIEL_PRENSA[1], -RIEL_PRENSA[0]];   // a lo largo de la plataforma
    const plataforma = barraRecta(sumar(c, lado, 10), sumar(c, lado, -9), 3)
        + barraRecta(sumar(c, lado, -9), sumar(sumar(c, lado, -9), RIEL_PRENSA, 9), 2)
        + disco(sumar(sumar(c, RIEL_PRENSA, 8), lado, -1), 7.5);
    const b = brazoHacia(S, [40, 88], 1);   // las manos en las manijas del asiento
    return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos], giroCabeza: 8 }, pal, k, { detras: plataforma });
}

// (v158) La pose de la victoria, para «¡Todo hecho!»: de frente, saca bíceps con los dos brazos.
const VICTORIA = {
    vista: "frente", fondo: "sala", encuadre: [20, 100],
    dibujar(u, pal, k) {
        const cuerpo = deFrente(60);
        const brazos = cuerpo.lados.map((l) => brazo(l.S, l.s * mezcla(98, 104, u), l.s * mezcla(140, 200, u)));
        return cuerpoDeFrente(cuerpo, brazos, pal, k, { biceps: mezcla(0.8, 2.2, u) });
    },
};

const sumar3 = (b, v) => ({ S: sumar(b.S, v), E: sumar(b.E, v), M: sumar(b.M, v) });

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

// Las máquinas (no se mueven: van en el fondo). Colores de hierro y cuero oscuro con su contorno.
const marco = (d, grosor = 2.4) => `<path d="${d}" fill="none" stroke="#0d0b12" stroke-width="${grosor + 1.6}" stroke-linecap="square"/><path d="${d}" fill="none" stroke="${HIERRO.base}" stroke-width="${grosor}" stroke-linecap="square"/>`;
const almohadilla = (px, py, ancho, alto) => `<rect x="${px}" y="${py}" width="${ancho}" height="${alto}" rx="1" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><rect x="${px + 1}" y="${py + 0.6}" width="${ancho - 2}" height="${Math.max(1, alto * 0.35)}" fill="${CUERO.base}"/>`;

// (v168) Una almohadilla inclinada: de a a b, con su grosor repartido a los dos lados de la línea.
function almohadillaEntre(a, b, grosor = 4.4) {
    const v = restar(b, a);
    return `<g transform="rotate(${n1(anguloDe(v))} ${n1(a[0])} ${n1(a[1])})">${almohadilla(n1(a[0]), n1(a[1] - grosor / 2), n1(largoDe(v)), grosor)}</g>`;
}
// Un respaldo: la almohadilla que va a lo largo de la espalda de un torso que sale de la cadera H con ese ángulo
// (como en dir()), desde/hasta = de qué parte del torso a cuál, separada de la línea del torso (para que quede detrás).
function respaldo(H, angulo, desde, hasta, separacion = 8) {
    const eje = dir(angulo), atras = [eje[1], -eje[0]];
    return almohadillaEntre(sumar(sumar(H, eje, desde), atras, separacion), sumar(sumar(H, eje, hasta), atras, separacion), 4.6);
}
// Un rodillo de cuero (el que se apoya en las piernas en las máquinas) y una polea (la rueda por donde pasa el cable).
const rodillo = (c, r = 2.8) => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><circle cx="${n1(c[0] + 0.5)}" cy="${n1(c[1] - 0.5)}" r="${n1(r * 0.57)}" fill="${CUERO.base}"/>`;
const ruedaDePolea = (c, r = 2.6) => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>`;
// La torre de una polea, a la derecha. yPolea: a qué altura sale el cable (9 = arriba).
function torreDePolea(yPolea) {
    const soporte = yPolea > 12 ? marco(`M96 ${yPolea} L93 ${yPolea}`, 1.4) : "";
    return marco(`M96 4 L96 ${SUELO} M114 4 L114 ${SUELO} M92 4 L116 4 M94 ${SUELO - 1} L116 ${SUELO - 1}`) + soporte
        + `<path d="M100 8 L100 ${SUELO - 3} M111 8 L111 ${SUELO - 3}" stroke="#2b2f3a" stroke-width="1"/><circle cx="93" cy="${yPolea}" r="2.6" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/><circle cx="105.5" cy="6" r="2.2" fill="${ACERO.sombra}" stroke="#0d0b12" stroke-width="1"/>`;
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
