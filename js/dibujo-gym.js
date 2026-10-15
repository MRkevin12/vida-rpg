// dibujo-gym.js — El avatar SIN ROPA de la pestaña del gimnasio (v74).
//
// Sirve para ver tu avance con claridad: el cuerpo en calzoncillos, sin armadura ni ropa. Cambia con dos números que
// calcula la pestaña del gimnasio (ver gym.js y vistas-gym.js):
//   d.fisico      0 a 5, según tu nivel de gym: más hombros y brazos, y el músculo se va marcando
//                 (pecho → hombros y bíceps → abdomen → seis cuadritos, oblicuos y venas).
//   d.corpulencia -1 (muy delgado) a 1,1 (con sobrepeso), según tu IMC: cambia la cintura, la cadera y las piernas; con
//                 más grasa el abdomen se redondea y el músculo se ve menos; con menos, se marcan las costillas.
// Las medidas del cuerpo salen de esqueleto() (dibujo-cuerpo.js), que también lee esos dos números.
//
// Este archivo solo devuelve texto SVG; dibujo.js lo junta con la cabeza y el fondo (dibujarAvatarGym).

import { TRAZO } from "./dibujo-base.js";
import { formaTorso, silueta, tramos, mano } from "./dibujo-cuerpo.js";

const entre = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;
const entre01 = (x) => Math.max(0, Math.min(1, x));

// Una raya de sombra o de luz (opacidad ya calculada; si es muy baja no se dibuja).
const sombra = (trazo, op, grosor = 0.8) => (op > 0.04 ? `<path d="${trazo}" fill="none" stroke="${TRAZO}" stroke-width="${grosor}" stroke-linecap="round" opacity="${op.toFixed(2)}"/>` : "");
const luz = (trazo, op, grosor = 0.9) => (op > 0.04 ? `<path d="${trazo}" fill="none" stroke="#fff" stroke-width="${grosor}" stroke-linecap="round" opacity="${op.toFixed(2)}"/>` : "");

const COLOR_CALZONCILLO = "#2d3b63";
const COLOR_CINTA = "#1d2747";
const COLOR_RAYA = "#8a9fd4";


// ===== Piernas y pies descalzos =====

function pie(pierna) {
    const s = pierna.punta;
    const [ax] = pierna.tobillo;
    return `M${ax - 4.5 * s} 169 L${ax - 4.9 * s} 178.5 Q${ax - 5 * s} 181.4 ${ax - 2.5 * s} 181.4 L${ax + 9.6 * s} 181.4
            Q${ax + 12.8 * s} 181 ${ax + 11.6 * s} 178 Q${ax + 9.2 * s} 175.3 ${ax + 5 * s} 173.5 L${ax + 4.5 * s} 169 Z`;
}

export function piernasDesnudas(d, e, p) {
    const f = d.fisico || 0;
    const corp = d.corpulencia || 0;
    const def = entre01(1 - Math.max(0, corp) * 1.1);
    const lados = [e.piernaIzq, e.piernaDer];
    const radios = [e.muslo, e.rodilla, e.tobillo];
    const formas = lados.flatMap((l) => [...tramos(l.cadera, l.rodilla, l.tobillo, ...radios), pie(l)]);

    const detalle = lados.map((l) => {
        const s = l.punta;
        const [kx, ky] = l.rodilla;
        // Rótula, cuádriceps (separación) y pantorrilla.
        const a = entre(l.cadera, l.rodilla, 0.25);
        const b = entre(l.cadera, l.rodilla, 0.86);
        const pant = entre(l.rodilla, l.tobillo, 0.3);
        let t = `<path d="M${kx - 3.2} ${ky + 1} Q${kx} ${ky - 1.6} ${kx + 3.2} ${ky + 1}" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".35"/>`;
        t += sombra(`M${a[0] + s * 2.2} ${a[1]} Q${(a[0] + b[0]) / 2 + s * 3.4} ${(a[1] + b[1]) / 2} ${b[0] + s * 2} ${b[1]}`, (f >= 3 ? 0.18 + 0.05 * f : 0) * def, 0.7);
        t += luz(`M${a[0] - s * 1.6} ${a[1] + 2} Q${(a[0] + b[0]) / 2 - s * 2.2} ${(a[1] + b[1]) / 2} ${b[0] - s * 1.8} ${b[1] - 3}`, (f >= 2 ? 0.1 + 0.03 * f : 0) * def);
        if (f >= 2) t += `<ellipse cx="${pant[0] - s * 0.6}" cy="${pant[1] + 2}" rx="${e.rodilla * 0.5}" ry="${e.rodilla * 1.1}" fill="#fff" opacity="${0.05 + 0.015 * f}"/>`;
        return t;
    }).join("");

    return `${silueta(formas, p.m("piel"), 0.85)}
            <path d="M100 112 L${e.piernaIzq.rodilla[0] + 5} 143 L${e.piernaDer.rodilla[0] - 5} 143 Z" fill="${TRAZO}" opacity=".22"/>
            ${detalle}`;
}


// ===== Calzoncillos =====

export function calzoncillos(e) {
    const C = e.cintura;
    const K = e.cadera;
    const pantalon = `M${100 - C - 1.2} 100.4 Q100 104.6 ${100 + C + 1.2} 100.4 L${100 + K + 2.8} 120.4 Q${100 + K * 0.7} 123.4 103.6 121.2 L100 111.6
                      L96.4 121.2 Q${100 - K * 0.7} 123.4 ${100 - K - 2.8} 120.4 Z`;
    const cinta = `M${100 - C - 0.8} 97.8 Q100 101.8 ${100 + C + 0.8} 97.8 L${100 + C + 1.4} 101.6 Q100 105.8 ${100 - C - 1.4} 101.6 Z`;
    return `<path d="${pantalon}" fill="${COLOR_CALZONCILLO}" ${borde(0.8)}/>
            <path d="M${100 - K - 2} 117 Q${100 - K * 0.5} 120.6 97.4 119.4 M${100 + K + 2} 117 Q${100 + K * 0.5} 120.6 102.6 119.4" fill="none" stroke="${COLOR_RAYA}" stroke-width=".7" opacity=".7"/>
            <path d="M100 105 L100 111.6" stroke="${TRAZO}" stroke-width=".6" opacity=".6"/>
            <path d="M${100 + C * 0.5} 103.6 Q${100 + K * 0.8} 110 ${100 + K + 1} 118" fill="none" stroke="${TRAZO}" stroke-width=".6" opacity=".25"/>
            <path d="${cinta}" fill="${COLOR_CINTA}" ${borde(0.7)}/>
            <path d="M${100 - C + 1} 100 Q100 103.8 ${100 + C - 1} 100" fill="none" stroke="${COLOR_RAYA}" stroke-width=".5" opacity=".8"/>`;
}


// ===== Torso sin ropa =====

export function torsoDesnudo(d, e, p) {
    const { H, cintura: C, cadera: K } = e;
    const f = d.fisico || 0;
    const corp = d.corpulencia || 0;
    const def = entre01(1 - Math.max(0, corp) * 1.1);                           // la grasa tapa el músculo
    const flaco = corp < -0.35 ? entre01((-corp - 0.35) / 0.65) : 0;           // con poco peso se marcan las costillas
    const x = (k) => 100 + k;

    let capas = silueta([formaTorso(e, 112)], p.m("piel"), 0.85);
    capas += `<path d="M100 62 L${x(H)} 67 L${x(C + 2.4)} 84 Q${x(C - 0.4)} 93 ${x(C)} 100 L${x(K)} 112 Q104 114 101.6 113.6 Q106 90 100 62 Z" fill="${p.pielSombra}" opacity=".32"/>`;

    // Clavículas, pezones y ombligo (siempre).
    capas += sombra(`M96 63.6 Q${x(-H / 2)} 65 ${x(-H + 4)} 66.4 M104 63.6 Q${x(H / 2)} 65 ${x(H - 4)} 66.4`, 0.28 + flaco * 0.2, 0.7);
    capas += `<circle cx="${x(-H * 0.42)}" cy="74.6" r=".9" fill="${p.pielSombra}" opacity=".8"/><circle cx="${x(H * 0.42)}" cy="74.6" r=".9" fill="${p.pielSombra}" opacity=".8"/>`;
    const yOmbligo = 95.4 + Math.max(0, corp) * 2.6;
    capas += `<path d="M99 ${yOmbligo} Q100 ${yOmbligo + 1.8} 101 ${yOmbligo}" fill="none" stroke="${TRAZO}" stroke-width=".6" opacity=".55"/>`;

    // El pecho: la línea de abajo de los pectorales, el esternón y la luz.
    capas += `<path d="M${x(-H + 5.5)} 71.4 Q${x(-9)} 83 100 77.4 Q${x(9)} 83 ${x(H - 5.5)} 71.4 Q100 73.6 ${x(-H + 5.5)} 71.4 Z" fill="${TRAZO}" opacity="${((f >= 1 ? 0.04 + 0.018 * f : 0) * def).toFixed(3)}"/>`;
    capas += sombra(`M${x(-H + 5.5)} 71.6 Q${x(-9)} 83 100 77.4 Q${x(9)} 83 ${x(H - 5.5)} 71.6`, (f >= 1 ? 0.18 + 0.06 * f : 0) * def, 0.9);
    capas += sombra("M100 66 L100 77.4", (f >= 2 ? 0.2 + 0.04 * f : 0) * def, 0.8);
    capas += luz(`M${x(-H + 7)} 70.4 Q${x(-10)} 72 ${x(-4)} 75.4 M${x(H - 7)} 70.4 Q${x(10)} 72 ${x(4)} 75.4`, (f >= 2 ? 0.14 + 0.04 * f : 0) * def);

    // El abdomen: línea central, cuadritos (de 4 a 6), oblicuos y serratos.
    const filas = f >= 5 ? [82.6, 87.8, 93, 98] : f >= 4 ? [84, 89.4, 94.8] : f >= 3 ? [87, 93] : [];
    if (f >= 3) capas += sombra("M100 79.4 L100 99.4", 0.3 * def, 0.8);
    for (const y of filas) capas += sombra(`M${x(-C + 3.4)} ${y} Q100 ${y + 1.6} ${x(C - 3.4)} ${y}`, (0.2 + 0.04 * f) * def, 0.8);
    if (f >= 4) {
        capas += sombra(`M${x(-C - 0.6)} 86 Q${x(-C + 1.6)} 92 ${x(-C + 2.6)} 99 M${x(C + 0.6)} 86 Q${x(C - 1.6)} 92 ${x(C - 2.6)} 99`, 0.26 * def, 0.8);
        capas += luz(`M${x(-C + 4.4)} ${filas[0] + 1.4} L${x(-C + 4.4)} ${filas[0] + 3.4} M${x(C - 4.4)} ${filas[0] + 1.4} L${x(C - 4.4)} ${filas[0] + 3.4}`, 0.16 * def);
    }
    if (f >= 5) {
        capas += sombra(`M${x(-C - 1.8)} 79.4 l3 2.2 M${x(-C - 2)} 83 l3 2.2 M${x(C + 1.8)} 79.4 l-3 2.2 M${x(C + 2)} 83 l-3 2.2`, 0.26 * def, 0.7);
        capas += luz(`M${x(-H + 8)} 68.4 Q${x(-10)} 70.4 ${x(-5)} 73.4`, 0.2 * def, 1.1);
    }

    // Más peso: el abdomen se redondea. Menos peso: se marcan las costillas.
    if (corp > 0.2) {
        capas += `<ellipse cx="100" cy="${93 + corp * 1.4}" rx="${C - 1.2 + corp * 1.4}" ry="${6 + corp * 4}" fill="${p.pielSombra}" opacity="${(0.1 + corp * 0.16).toFixed(2)}"/>`;
        capas += sombra(`M${x(-C + 1.2)} 98 Q100 ${103 + corp * 3} ${x(C - 1.2)} 98`, 0.22 + corp * 0.18, 0.8);
        capas += luz(`M${x(-C + 4)} 88 Q${x(-C + 2)} 93 ${x(-C + 4)} 97`, 0.1 + corp * 0.06);
    }
    if (flaco) {
        for (const y of [75.4, 79, 82.6]) {
            capas += sombra(`M${x(-C + 0.6)} ${y} Q${x(-5)} ${y + 1.8} ${x(-1.4)} ${y} M${x(C - 0.6)} ${y} Q${x(5)} ${y + 1.8} ${x(1.4)} ${y}`, 0.3 * flaco, 0.7);
        }
    }
    return capas;
}


// ===== Brazos sin ropa =====
// Devuelve las dos capas de siempre: atras (el brazo, antes del torso) y frente (la mano).
export function brazoDesnudo(lado, d, e, p) {
    const b = e[lado];
    const s = lado === "izq" ? -1 : 1;
    const f = d.fisico || 0;
    const corp = d.corpulencia || 0;
    const def = entre01(1 - Math.max(0, corp) * 1.1);
    const [r1, r2, r3] = [e.brazo, e.brazo - 0.7, e.brazo - 1.6];
    const [arriba, abajo] = tramos(b.hombro, b.codo, b.muneca, r1, r2, r3);
    const [hx, hy] = b.hombro;
    const [bx, by] = entre(b.hombro, b.codo, 0.5);
    const angulo = (Math.atan2(b.codo[1] - b.hombro[1], b.codo[0] - b.hombro[0]) * 180) / Math.PI - 90;

    let capas = silueta([arriba, abajo], p.m("piel"));
    // Codo y bíceps (el bulto crece con el nivel), hombro (deltoides) y tríceps.
    capas += `<path d="M${b.codo[0] - r2 + 0.6} ${b.codo[1] - 0.6} Q${b.codo[0]} ${b.codo[1] + 1.6} ${b.codo[0] + r2 - 0.6} ${b.codo[1] - 0.8}" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".4"/>`;
    if (f >= 1) {
        capas += `<ellipse cx="${bx - s * 0.5}" cy="${by - 0.6}" rx="${r1 * 0.55}" ry="${r1 * (0.9 + f * 0.08)}" fill="#fff" opacity="${((0.06 + f * 0.022) * def).toFixed(3)}" transform="rotate(${angulo.toFixed(1)} ${bx} ${by})"/>`;
        capas += sombra(`M${bx + s * r1 * 0.55} ${by - r1 * 0.2} Q${bx + s * r1 * 0.2} ${by + r1 * 0.9} ${bx - s * r1 * 0.1} ${by + r1 * 1.4}`, (0.12 + 0.04 * f) * def, 0.7);
    }
    if (f >= 2) {
        capas += `<ellipse cx="${hx}" cy="${hy + 1.2}" rx="${r1 * 0.95}" ry="${r1 * 0.75}" fill="#fff" opacity="${((0.05 + f * 0.018) * def).toFixed(3)}"/>`;
        capas += sombra(`M${hx - r1 * 0.9} ${hy + 4.2} Q${hx} ${hy + 6.6} ${hx + r1 * 0.9} ${hy + 4.2}`, (0.1 + 0.03 * f) * def, 0.7);
    }
    if (f >= 3) {
        const a = entre(b.hombro, b.codo, 0.28);
        const c = entre(b.hombro, b.codo, 0.8);
        capas += sombra(`M${a[0] + s * r1 * 0.7} ${a[1]} Q${(a[0] + c[0]) / 2 + s * r1 * 0.9} ${(a[1] + c[1]) / 2} ${c[0] + s * r1 * 0.6} ${c[1]}`, 0.2 * def, 0.7);
    }
    if (f >= 5) {
        const a = entre(b.codo, b.muneca, 0.22);
        const c = entre(b.codo, b.muneca, 0.82);
        capas += `<path d="M${a[0] - s * 0.6} ${a[1]} Q${(a[0] + c[0]) / 2 + s * 1.2} ${(a[1] + c[1]) / 2} ${c[0]} ${c[1]}" fill="none" stroke="#4a6a92" stroke-width=".6" stroke-linecap="round" opacity="${(0.4 * def).toFixed(2)}"/>`;
    }
    return { atras: capas, frente: mano(b.mano, p, s) };
}
