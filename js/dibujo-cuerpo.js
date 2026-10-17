// dibujo-cuerpo.js — El cuerpo del avatar: medidas, cuello, manos, cara y pelo.
//
// El lienzo mide 200 × 200 y el personaje está de pie, centrado en x = 100:
//   cabeza y 29–54 · hombros y 67 · cintura y 100 · rodillas y 143 · pies y 181.
// "Izquierda" y "derecha" son las de la PANTALLA (no las del personaje).
//
// p = la paleta de este avatar (colores y materiales; se arma en dibujo.js).

import { TRAZO, capsula, oscurecer, aclarar } from "./dibujo-base.js";


// ===== Medidas =====
// Todas las partes (ropa, armadura, armas) se colocan usando estos puntos.
// (v74) Cuánto crece cada medida con el físico de gimnasio (0 a 5) y con la corpulencia (d.corpulencia: de -1, muy delgado, a 1,1).
const FISICO_HOMBROS = [0, 0.8, 1.6, 2.4, 3.4, 4.4];
const FISICO_BRAZO = [0, 0.55, 1.1, 1.6, 2.3, 3.0];
const FISICO_MUSLO = [0, 0.35, 0.7, 1.05, 1.5, 1.9];

export function esqueleto(d) {
    const fem = d.apariencia.cuerpo === "femenino";
    const fuerte = d.rasgos.fuerza >= 1 ? 1 : 0;       // Fuerza nivel 3+: brazos y hombros más anchos
    const fisico = Math.max(0, Math.min(5, d.fisico || 0));   // (v66, v74) el gimnasio: más ancho de hombros, brazos y piernas
    const corp = d.corpulencia || 0;                   // (v74) tu peso en la pestaña del gimnasio: cintura, cadera y piernas
    const H = (fem ? 19 : 22) + fuerte * 0.9 + FISICO_HOMBROS[fisico] + corp * 0.7;   // medio ancho de hombros
    const centro = (fem ? 6.4 : 7.4) + corp * 0.7;     // separación de las piernas
    return {
        fem,
        H,
        cintura: (fem ? 11.8 : 14.8) + corp * 2.8,
        cadera: (fem ? 16 : 15.6) + corp * 1.9,
        brazo: (fem ? 5 : 5.8) + fuerte * 0.9 + FISICO_BRAZO[fisico] + corp * 0.9,   // radio del brazo en el hombro
        muslo: (fem ? 7.7 : 8.2) + FISICO_MUSLO[fisico] + corp * 1.5,                        // radios de la pierna: muslo, rodilla y tobillo
        rodilla: 5.9,
        tobillo: 4.5,
        // Brazo izquierdo: relajado junto al cuerpo.
        izq: { hombro: [100 - H + 1, 67.5], codo: [100 - H - 3, 88.5], muneca: [100 - H - 1.4, 106.5], mano: [100 - H - 0.8, 111.6] },
        // Brazo derecho: un poco adelantado; es el que sostiene el arma.
        der: { hombro: [100 + H - 1, 67.5], codo: [100 + H + 4, 87.5], muneca: [100 + H + 6.4, 103.4], mano: [100 + H + 7.2, 108] },
        // Piernas: el peso va en la izquierda; la derecha se abre un poco (se ve menos rígido).
        piernaIzq: { cadera: [100 - centro, 111], rodilla: [100 - centro - 1, 143], tobillo: [100 - centro - 1.8, 171.5], punta: -1 },
        piernaDer: { cadera: [100 + centro, 111], rodilla: [100 + centro + 2.2, 143], tobillo: [100 + centro + 3.8, 171.5], punta: 1 },
    };
}

// Contorno del torso: hombros → cintura → cadera.
export function formaTorso(e, bajo = 110) {
    const { H, cintura: C, cadera: K } = e;
    return `M${100 - H} 67 Q${100 - H + 0.6} 61.4 95 59.4 L105 59.4 Q${100 + H - 0.6} 61.4 ${100 + H} 67
            L${100 + C + 2.4} 84 Q${100 + C - 0.4} 93 ${100 + C} 100 L${100 + K} ${bajo} Q100 ${bajo + 4.5} ${100 - K} ${bajo}
            L${100 - C} 100 Q${100 - C + 0.4} 93 ${100 - C - 2.4} 84 Z`;
}

// Varias formas con UN solo contorno alrededor (sin rayas donde se juntan):
// primero se pintan todas con borde oscuro grueso y encima todas con su color.
// textura (opcional): la trama de la tela o el grano del cuero, encima y casi transparente.
export function silueta(formas, relleno, grosor = 0.85, textura = "") {
    const caminos = formas.map((d) => `<path d="${d}"/>`).join("");
    return `<g fill="${TRAZO}" stroke="${TRAZO}" stroke-width="${grosor * 2}" stroke-linejoin="round">${caminos}</g>
            <g fill="${relleno}">${caminos}</g>
            ${textura ? `<g fill="${textura}" opacity=".2">${caminos}</g>` : ""}`;
}

// Las dos cápsulas de una pierna o un brazo: [de arriba a la articulación, de ahí hacia abajo].
export function tramos(arriba, medio, abajo, r1, r2, r3) {
    return [capsula(...arriba, r1, ...medio, r2), capsula(...medio, r2, ...abajo, r3)];
}


// ===== Cuello y manos =====

export function cuello(e, p) {
    const a = e.fem ? 4 : 4.9;     // medio ancho
    return `<path d="M${100 - a} 49 L${100 - a - 0.3} 61 Q100 64.5 ${100 + a + 0.3} 61 L${100 + a} 49 Z" fill="${p.m("piel")}" stroke="${TRAZO}" stroke-width=".7"/>
            <path d="M${100 - a} 51 Q100 58.5 ${100 + a} 51 L${100 + a} 49 L${100 - a} 49 Z" fill="${p.pielSombra}" opacity=".75"/>`;
}

// Agranda un dibujo alrededor del punto (x, y).
const agrandar = (x, y, k = 1.18) => `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`;

// Mano abierta y relajada. lado = -1 (izquierda) o 1 (derecha): hacia dónde queda el pulgar.
export function mano([x, y], p, lado = -1, relleno = p.m("piel")) {
    return `<g transform="${agrandar(x, y)}"><path d="M${x - 3.1} ${y - 3.4} Q${x + 3.5} ${y - 4} ${x + 3.3} ${y + 0.8} Q${x + 3} ${y + 4.6} ${x + 0.2} ${y + 5} Q${x - 3} ${y + 4.6} ${x - 3.4} ${y + 0.6} Z"
                  fill="${relleno}" stroke="${TRAZO}" stroke-width=".75" stroke-linejoin="round"/>
            <path d="M${x - lado * 2.6} ${y - 1.6} Q${x - lado * 4.4} ${y + 0.4} ${x - lado * 2.9} ${y + 2.6}" fill="${relleno}" stroke="${TRAZO}" stroke-width=".7" stroke-linecap="round"/>
            <path d="M${x - 0.9} ${y + 2.3} L${x - 0.9} ${y + 4.5} M${x + 1} ${y + 2.3} L${x + 1} ${y + 4.4}" stroke="${TRAZO}" stroke-width=".45" opacity=".55"/></g>`;
}

// Puño cerrado (sostiene un arma).
export function puno([x, y], p, relleno = p.m("piel")) {
    return `<g transform="${agrandar(x, y)}"><path d="M${x - 3.6} ${y - 2.9} Q${x} ${y - 4.1} ${x + 3.6} ${y - 2.9} Q${x + 4.5} ${y} ${x + 3.6} ${y + 3} Q${x} ${y + 4} ${x - 3.6} ${y + 3} Q${x - 4.5} ${y} ${x - 3.6} ${y - 2.9} Z"
                  fill="${relleno}" stroke="${TRAZO}" stroke-width=".75" stroke-linejoin="round"/>
            <path d="M${x - 3.4} ${y - 0.9} L${x + 3.4} ${y - 0.9} M${x - 3.5} ${y + 1.1} L${x + 3.5} ${y + 1.1}" stroke="${TRAZO}" stroke-width=".45" opacity=".5"/></g>`;
}


// ===== Cara =====

// Cada rostro cambia las cejas [extremo, centro, entrecejo], el alto de los ojos y la boca.
const ROSTROS = {
    // (v113) Diferencias más marcadas: cejas más inclinadas, ojos más grandes o más chicos y la boca (ceno = hacia abajo).
    sereno:   { cejas: [39.3, 38.1, 38.9], ojo: 2.4, grosor: 1.15 },
    decidido: { cejas: [37.9, 37.9, 39.7], ojo: 1.9, grosor: 1.5, ceno: true },
    amable:   { cejas: [40.0, 37.2, 38.2], ojo: 3.1, grosor: 1.0, sonrie: true },
    curtido:  { cejas: [38.6, 38.2, 39.7], ojo: 2.0, grosor: 1.75, cicatriz: true },
    severo:   { cejas: [38.1, 38.4, 39.6], ojo: 1.7, grosor: 1.6, ceno: true },    // (v102)
    cansado:  { cejas: [40.0, 38.8, 39.2], ojo: 1.7, grosor: 1.1 },    // (v102) ojeroso
};

function formaCabeza(e) {
    const m = e.fem ? 6.3 : 7.7;     // medio ancho de la mandíbula
    const b = e.fem ? 2.3 : 3.2;     // medio ancho del mentón
    return `M90.4 38 C90.2 31 95 29.3 100 29.3 C105 29.3 109.8 31 109.6 38 L109.4 43
            C109.2 47 ${100 + m + 0.4} 49.6 ${100 + m - 1.8} 51.8 C${100 + b + 0.6} 53.8 ${100 + b - 1.2} 54.4 100 54.4
            C${100 - b + 1.2} 54.4 ${100 - b - 0.6} 53.8 ${100 - m + 1.8} 51.8 C${100 - m - 0.4} 49.6 90.8 47 90.6 43 Z`;
}

// La cara completa (sin pelo ni sombrero).
export function cara(d, e, p) {
    const r = d.rasgos;
    const rostro = ROSTROS[d.apariencia.rostro] || ROSTROS.sereno;
    const animo = d.animo;
    const dormido = animo === "dormido";
    // Herido o caído en combate: cara de cansancio y una curita en la mejilla.
    const herido = animo === "herido" || animo === "caido";
    const cansado = animo === "cansado" || herido;
    const forma = formaCabeza(e);

    // --- Ojos ---
    // Se dibuja el izquierdo y el derecho es su espejo (así quedan simétricos).
    const alto = cansado ? rostro.ojo * 0.55 : rostro.ojo;
    let ojoIzq;
    if (dormido) {
        ojoIzq = `<path d="M93.9 41.6 Q96.1 43 98.3 41.7" fill="none" stroke="${TRAZO}" stroke-width=".85" stroke-linecap="round"/>`;
    } else {
        ojoIzq = `<path d="M93.8 41.7 Q96 ${41.7 - alto * 0.78} 98.4 41.6 Q96.1 ${41.7 + alto * 0.62} 93.8 41.7 Z" fill="#f6f1e7"/>
                  <circle cx="96.25" cy="41.55" r="1.3" fill="${p.ojos}"/>
                  <circle cx="96.25" cy="41.55" r="1.18" fill="none" stroke="${oscurecer(p.ojos, 0.55)}" stroke-width=".26"/>
                  <circle cx="96.25" cy="41.55" r=".62" fill="${TRAZO}"/>
                  <path d="M94.1 41.3 Q96 ${41.5 - alto * 0.7} 98.2 41.2" fill="none" stroke="${p.pielSombra}" stroke-width=".55" opacity=".55"/>
                  <path d="M93.5 41.8 Q96 ${41.5 - alto * 0.86} 98.6 41.5" fill="none" stroke="${TRAZO}" stroke-width="${e.fem ? 0.95 : 0.75}" stroke-linecap="round"/>
                  ${e.fem ? `<path d="M93.6 41.7 L92.5 40.8" stroke="${TRAZO}" stroke-width=".7" stroke-linecap="round"/>` : ""}`;
    }
    const brillos = dormido ? "" : `<circle cx="95.8" cy="41.1" r=".38" fill="#fff"/><circle cx="103.3" cy="41.1" r=".38" fill="#fff"/>`;

    // --- Cejas --- (más fieras si está "en llamas", caídas si está cansado)
    let [extremo, centro, entrecejo] = rostro.cejas;
    if (animo === "llamas") entrecejo += 0.5;
    if (cansado) extremo += 0.5;
    const colorCeja = oscurecer(p.pelo, 0.25);
    const cejaIzq = dormido
        ? `<path d="M93.4 39.4 Q95.8 38.8 98.4 39.3" fill="none" stroke="${colorCeja}" stroke-width="${rostro.grosor}" stroke-linecap="round"/>`
        : `<path d="M93.1 ${extremo} Q95.5 ${centro} 98.7 ${entrecejo}" fill="none" stroke="${colorCeja}" stroke-width="${rostro.grosor * (e.fem ? 0.8 : 1)}" stroke-linecap="round"/>`;

    // --- Boca --- seria por defecto; sonríe si está contento (más con Carisma).
    const contento = animo === "feliz" || animo === "llamas" || rostro.sonrie || r.carisma >= 1;
    const labios = e.fem ? oscurecer(mezclaRosa(p.piel), 0.1) : oscurecer(p.pielSombra, 0.35);
    let boca;
    if (dormido || cansado) {
        boca = `<path d="M98 49.9 L102 49.9" stroke="${labios}" stroke-width=".9" stroke-linecap="round"/>`;
    } else if (rostro.ceno && animo !== "feliz" && animo !== "llamas") {
        boca = `<path d="M97.3 50.7 Q100 49.5 102.7 50.7" fill="none" stroke="${labios}" stroke-width="1.05" stroke-linecap="round"/>`;
    } else if (contento) {
        const curva = r.carisma >= 1 ? 52.1 : 51.4;
        boca = `<path d="M97.1 49.4 Q100 ${curva} 102.9 49.4" fill="none" stroke="${labios}" stroke-width="1" stroke-linecap="round"/>`;
    } else {
        boca = `<path d="M97.6 49.8 Q100 50.4 102.4 49.8" fill="none" stroke="${labios}" stroke-width=".95" stroke-linecap="round"/>`;
    }
    const labioInferior = `<path d="M98.7 51.5 Q100 52 101.3 51.5" fill="none" stroke="${p.pielSombra}" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;

    // --- Detalles del rostro ---
    const cicatriz = rostro.cicatriz
        ? `<path d="M104.6 37.2 L106.3 45.6" stroke="${aclarar(p.piel, 0.45)}" stroke-width=".8" stroke-linecap="round"/>
           <path d="M104.6 37.2 L106.3 45.6" stroke="${p.pielSombra}" stroke-width=".3" stroke-linecap="round"/>`
        : "";
    const curita = herido
        ? `<g transform="rotate(-24 106 45.6)"><rect x="103.6" y="44.7" width="4.8" height="1.9" rx=".7" fill="#e6d6b8" stroke="${TRAZO}" stroke-width=".22"/>
               <rect x="105.4" y="44.9" width="1.2" height="1.5" fill="#cdb88f"/></g>
           <path d="M93.2 35.6 L95.4 37" stroke="#8f2a2a" stroke-width=".45" stroke-linecap="round" opacity=".75"/>`
        : "";
    const pecas = d.apariencia.rostro === "amable"
        ? `<g fill="${p.pielSombra}" opacity=".7"><circle cx="94.2" cy="45.3" r=".32"/><circle cx="95.6" cy="46" r=".32"/><circle cx="104.4" cy="46" r=".32"/><circle cx="105.8" cy="45.3" r=".32"/></g>`
        : "";

    return `
        <!-- orejas (van detrás de la cara) -->
        <g fill="${p.m("piel")}" stroke="${TRAZO}" stroke-width=".7">
            <ellipse cx="90.5" cy="43" rx="1.7" ry="3"/><ellipse cx="109.5" cy="43" rx="1.7" ry="3"/></g>
        ${r.riqueza >= 2 ? `<g fill="none" stroke="${p.oroPlano}" stroke-width=".8"><circle cx="90.1" cy="46.8" r="1.05"/><circle cx="109.9" cy="46.8" r="1.05"/></g>` : ""}
        <path d="${forma}" fill="${p.m("piel")}" stroke="${TRAZO}" stroke-width=".85" stroke-linejoin="round"/>
        <!-- sombra del lado derecho y luz en la frente: le dan volumen a la cara -->
        <path d="M104.5 30 C109 31.5 109.8 34 109.6 38 L109.4 43 C109.2 47 108 49.6 105.9 51.8 C104 53.6 102 54.3 100.6 54.4 C104 51 106.4 46 106.2 40 C106.1 36 105.6 32.5 104.5 30 Z" fill="${p.pielSombra}" opacity=".5"/>
        <ellipse cx="96.3" cy="34.6" rx="3.4" ry="1.9" fill="#fff" opacity=".13"/>
        <path d="M92.6 46.2 Q94.6 47.6 96.4 46.4" fill="none" stroke="#fff" stroke-width=".8" opacity=".1" stroke-linecap="round"/>
        <!-- cuencas de los ojos (un poco hundidas), mejillas y la sombra bajo el labio -->
        <g fill="${p.pielSombra}" opacity=".3"><ellipse cx="96.2" cy="40.4" rx="3.3" ry="1.7"/><ellipse cx="103.8" cy="40.4" rx="3.3" ry="1.7"/></g>
        <g fill="#c4584a" opacity=".13"><ellipse cx="93.8" cy="46.4" rx="2.5" ry="1.4"/><ellipse cx="106.2" cy="46.4" rx="2.5" ry="1.4"/></g>
        <ellipse cx="100" cy="52.6" rx="2.2" ry=".8" fill="${p.pielSombra}" opacity=".35"/>
        ${pecas}${cicatriz}${curita}${d.apariencia.rostro === "cansado" ? `<g fill="${p.pielSombra}" opacity=".55"><ellipse cx="96.2" cy="44" rx="2.6" ry=".9"/><ellipse cx="103.8" cy="44" rx="2.6" ry=".9"/></g>` : ""}
        ${marcaDeCara(d.apariencia.marca, p)}
        ${cejaIzq}<g transform="translate(200 0) scale(-1 1)">${cejaIzq}</g>
        <g class="ojos">${ojoIzq}<g transform="translate(200 0) scale(-1 1)">${ojoIzq}</g>${brillos}</g>
        <!-- nariz -->
        <path d="M100.4 42.6 L99.3 46.3 Q100.1 47.1 101.3 46.7" fill="none" stroke="${p.pielSombra}" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M99.5 42.4 L98.9 45.4" stroke="#fff" stroke-width=".6" opacity=".14" stroke-linecap="round"/>
        ${boca}${labioInferior}`;
}

// (v102) Las marcas de la cara: cicatrices, pintura de guerra, una runa o un lunar.
function marcaDeCara(marca, p) {
    const claro = "#e9c9b0";
    switch (marca) {
        case "cicatriz":   // atraviesa el ojo izquierdo, de la ceja a la mejilla
            return `<path d="M94.4 36.4 L97.6 47.2" stroke="${claro}" stroke-width="1" stroke-linecap="round" opacity=".9"/>
                    <path d="M94.4 36.4 L97.6 47.2" stroke="${p.pielSombra}" stroke-width=".35" stroke-linecap="round"/>
                    <path d="M95 39 L96.4 38.6 M96 42.6 L97.4 42.2 M96.8 45.4 L98 45" stroke="${p.pielSombra}" stroke-width=".3"/>`;
        case "mejilla":    // una línea en la mejilla derecha
            return `<path d="M104.6 45.6 L108.2 47.8" stroke="${claro}" stroke-width=".9" stroke-linecap="round"/>
                    <path d="M104.6 45.6 L108.2 47.8" stroke="${p.pielSombra}" stroke-width=".3" stroke-linecap="round"/>`;
        case "guerra":     // dos franjas oscuras bajo los ojos
            return `<g fill="#1a1428" opacity=".85"><path d="M92.2 44.6 L97.6 44.2 L97.2 45.6 L92.6 46 Z"/><path d="M107.8 44.6 L102.4 44.2 L102.8 45.6 L107.4 46 Z"/>
                    <path d="M99.4 30.6 L100.6 30.6 L100.4 36.4 L99.6 36.4 Z"/></g>`;
        case "runa":       // un signo azul que brilla en la frente
            return `<path d="M100 31.2 L100 36 M98.2 32.4 L100 34 L101.8 32.4" fill="none" stroke="#5ad0ff" stroke-width=".7" stroke-linecap="round"/>
                    <path d="M100 31.2 L100 36" stroke="#5ad0ff" stroke-width="2" opacity=".2"/>`;
        case "lunar":
            return `<circle cx="104.8" cy="48.6" r=".55" fill="#3a2418"/>`;
        default:
            return "";
    }
}

// (v102) Los complementos: parche, pendientes, cinta, aros o venda. Van encima del pelo de adelante.
export function complemento(d, p) {
    switch (d.apariencia.complemento) {
        case "parche":
            return `<path d="M90.6 36.4 L109.4 34.2" stroke="${TRAZO}" stroke-width=".7"/>
                    <path d="M93.2 39.2 Q96.4 37.6 99.2 39.4 L98.8 43.2 Q96.2 45 93.6 43.4 Z" fill="#1a1414" stroke="${TRAZO}" stroke-width=".5"/>`;
        case "pendiente":
            return `<circle cx="90.2" cy="47.6" r="1.1" fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".35"/>
                    <path d="M90.2 48.6 L90.2 50.6" stroke="${p.oroPlano}" stroke-width=".6"/><circle cx="90.2" cy="51.2" r=".7" fill="#e8384f"/>`;
        case "cinta":
            return `<path d="M89.8 35.6 Q100 32.4 110.2 35.6 L110 37.8 Q100 34.8 90 37.8 Z" fill="${p.borde}" stroke="${TRAZO}" stroke-width=".55"/>
                    <path d="M109.8 36.6 L113.6 40 L112.4 41 M110 37 L112 42.4" stroke="${p.borde}" stroke-width="1" stroke-linecap="round"/>`;
        case "aros":
            return `<g fill="none" stroke="${p.oroPlano}" stroke-width=".7"><circle cx="90.1" cy="47" r="1.1"/><circle cx="109.9" cy="47" r="1.1"/>
                    <circle cx="90.4" cy="44.6" r=".6"/></g>`;
        case "venda":
            return `<path d="M89.6 33.6 Q100 29.8 110.4 33.6 L110.6 37 Q100 33.2 89.4 37 Z" fill="#e8e0cc" stroke="${TRAZO}" stroke-width=".5"/>
                    <path d="M93 33.2 L95 36.2 M99 31.8 L100.4 35 M105 32.6 L106.4 35.8" stroke="#bdb39a" stroke-width=".45"/>
                    <path d="M106 33 Q107.2 34.4 106.4 35.6" stroke="#a83a3a" stroke-width=".9" opacity=".7" fill="none"/>`;
        default:
            return "";
    }
}

// Un tono rosado para los labios, a partir del color de la piel.
function mezclaRosa(piel) {
    const rojo = "#b4505a";
    const [a, b] = [piel, rojo].map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
    return "#" + a.map((valor, i) => Math.round(valor * 0.45 + b[i] * 0.55).toString(16).padStart(2, "0")).join("");
}

// Anteojos finos de metal (Intelecto nivel 3+).
export function lentes(p) {
    return `<g fill="rgba(190,225,255,.12)" stroke="${p.oroOscuro}" stroke-width=".85">
                <circle cx="96.1" cy="41.8" r="2.75"/><circle cx="103.9" cy="41.8" r="2.75"/></g>
            <g fill="none" stroke="${p.oroClaro}" stroke-width=".4">
                <circle cx="96.1" cy="41.8" r="2.75"/><circle cx="103.9" cy="41.8" r="2.75"/>
                <path d="M98.8 41.5 Q100 40.7 101.2 41.5 M93.4 41.4 L90.7 40.7 M106.6 41.4 L109.3 40.7"/></g>
            <path d="M94.5 40.6 L95.5 40 M102.3 40.6 L103.3 40" stroke="#fff" stroke-width=".45" opacity=".8" stroke-linecap="round"/>`;
}


// ===== Barba =====

export function barba(d, p) {
    const color = p.m("pelo");
    const formas = {
        bigote: `<path d="M96 49 Q100 46.9 104 49 Q102 50 100 49.2 Q98 50 96 49 Z" fill="${color}"/>`,
        candado: `<path d="M95.9 48.9 Q100 46.9 104.1 48.9 L103.7 52.4 Q100 56 96.3 52.4 Z" fill="${color}"/>`,
        completa: `<path d="M90.7 43 C91 48.6 93.4 52.8 96.5 54.7 Q100 56.6 103.5 54.7 C106.6 52.8 109 48.6 109.3 43 C108.2 46.6 106.4 48.3 104 48.7 Q100 47 96 48.7 C93.6 48.3 91.8 46.6 90.7 43 Z" fill="${color}"/>
                   <path d="M93 49.5 Q94.5 52 96.6 53.3 M107 49.5 Q105.5 52 103.4 53.3" fill="none" stroke="${p.peloLuz}" stroke-width=".5" opacity=".6"/>`,
        // (v102)
        perilla: `<path d="M98.4 52 Q100 51.2 101.6 52 L101.2 56.4 Q100 57.4 98.8 56.4 Z" fill="${color}"/>
                  <path d="M96.6 49 Q100 47.6 103.4 49 Q101.8 49.8 100 49.2 Q98.2 49.8 96.6 49 Z" fill="${color}"/>`,
        patillas: `<path d="M90.6 41 L91.2 48.4 Q92.4 49.6 93 48 L92.4 41.6 Z M109.4 41 L108.8 48.4 Q107.6 49.6 107 48 L107.6 41.6 Z" fill="${color}"/>`,
        larga: `<path d="M90.7 43 C90.6 52 93.6 60.6 100 63.4 C106.4 60.6 109.4 52 109.3 43 C108.2 46.6 106.4 48.3 104 48.7 Q100 47 96 48.7 C93.6 48.3 91.8 46.6 90.7 43 Z" fill="${color}"/>
                <path d="M94.4 52 Q96 58 99 61.4 M105.6 52 Q104 58 101 61.4 M100 55 L100 62" fill="none" stroke="${p.peloLuz}" stroke-width=".5" opacity=".55"/>`,
        corta: `<path d="M91.2 45 C91.8 49.6 94 52.8 96.8 54.2 Q100 55.4 103.2 54.2 C106 52.8 108.2 49.6 108.8 45 C107.6 47.8 106 49 104 49.2 Q100 47.8 96 49.2 C94 49 92.4 47.8 91.2 45 Z" fill="${color}" opacity=".75"/>
                <path d="M96 49 Q100 47.4 104 49 Q102 49.8 100 49.2 Q98 49.8 96 49 Z" fill="${color}"/>`,
    };
    if (formas[d.apariencia.barba]) return formas[d.apariencia.barba];
    // Rostro curtido sin barba: una sombra de barba de varios días.
    if (d.apariencia.rostro === "curtido" && d.apariencia.cuerpo !== "femenino") {
        return `<path d="M91.2 45 C91.8 49.6 94 52.8 96.8 54.2 Q100 55.4 103.2 54.2 C106 52.8 108.2 49.6 108.8 45 C107.6 47.8 106 49 104 49.2 Q100 47.8 96 49.2 C94 49 92.4 47.8 91.2 45 Z" fill="${p.pelo}" opacity=".22"/>`;
    }
    return "";
}


// ===== Pelo =====
// Cada peinado tiene dos capas: "atras" (se pinta antes que la cabeza) y
// "frente" (encima de la frente). Las rayas claras son el brillo del pelo.

export function pelo(d, p) {
    const color = p.m("pelo");
    const borde = `stroke="${TRAZO}" stroke-width=".7" stroke-linejoin="round"`;
    const brillo = (camino, grosor = 0.8) =>
        `<path d="${camino}" fill="none" stroke="${p.peloLuz}" stroke-width="${grosor}" stroke-linecap="round" opacity=".75"/>`;
    // Mechones: líneas finas y oscuras que siguen la dirección del pelo (le dan textura).
    const mechones = (...caminos) => caminos.map((camino) =>
        `<path d="${camino}" fill="none" stroke="${oscurecer(p.pelo, 0.5)}" stroke-width=".32" stroke-linecap="round" opacity=".6"/>`).join("");

    switch (d.apariencia.peinado) {
        case "calvo":
            return { atras: "", frente: `<ellipse cx="96" cy="32.6" rx="3.2" ry="1.6" fill="#fff" opacity=".2"/>` };

        case "rapado":
            return { atras: "", frente: `<path d="M90.5 39.6 C89.6 31.5 94 28.9 100 28.8 C106 28.9 110.4 31.5 109.5 39.6 C108.6 35.6 105.8 33.5 100 33.3 C94.2 33.5 91.4 35.6 90.5 39.6 Z" fill="${p.pelo}" opacity=".8"/>` };

        case "largo":
            return {
                atras: `<path d="M89.3 40 C87.6 28 93 26.2 100 26.2 C107 26.2 112.4 28 110.7 40 C111.9 52 114.8 62 114.4 75 Q110.6 78.6 107 75.4 L106 58 L94 58 L93 75.4 Q89.4 78.6 85.6 75 C85.2 62 88.1 52 89.3 40 Z" fill="${color}" ${borde}/>
                        ${brillo("M88.6 52 Q87.2 62 87.6 72", 0.7)}${brillo("M111.6 54 Q112.6 63 112.2 71", 0.6)}${mechones("M89.6 48 Q88.6 60 89.4 71", "M110.4 48 Q111.4 60 110.6 71", "M91 54 Q90.6 62 91.2 70")}`,
                frente: `<path d="M90.3 42 C89 33 92.6 27.5 100 27.3 C107.4 27.5 111 33 109.7 42 C108.6 36.8 105.2 33.6 100 31.8 C94.8 33.6 91.4 36.8 90.3 42 Z" fill="${color}" ${borde}/>
                         <path d="M90.4 40 C88.6 46 88 53 88.6 59.6 Q90.4 59 91.2 56 C90.8 50 91.2 45 92.3 42 Z" fill="${color}"/>
                         <path d="M109.6 40 C111.4 46 112 53 111.4 59.6 Q109.6 59 108.8 56 C109.2 50 108.8 45 107.7 42 Z" fill="${color}"/>
                         ${brillo("M93.4 32.6 Q96 29.6 99.4 29.2")}${brillo("M89.6 45 Q89 51 89.4 56", 0.6)}${mechones("M91.6 38.6 Q92.6 33 97.8 29.8", "M102.4 29.8 Q107.4 33 108.4 38.6", "M95.6 33.6 Q99.4 30.8 104 31.4")}`,
            };

        case "recogido":   // coleta alta que cae sobre un hombro
            return {
                atras: `<path d="M105.6 28.8 C113 27.2 117.8 33 116.6 41 C115.8 49 117 56 114.8 63.4 Q112.4 65.2 110.5 63 C111.6 55 110 47 110.8 40 C111.2 35 109.4 31.6 105.6 30.4 Z" fill="${color}" ${borde}/>
                        ${brillo("M113.6 34 Q115 42 114 52", 0.7)}${mechones("M112.2 36 Q113.6 46 112.6 58", "M115 38 Q115.8 47 114.6 56")}
                        <ellipse cx="109.4" cy="30.2" rx="2.2" ry="1.5" fill="${p.borde}" stroke="${TRAZO}" stroke-width=".6" transform="rotate(25 109.4 30.2)"/>`,
                frente: `<path d="M90.3 40.8 C89.2 32.4 92.8 27.7 100 27.5 C107.2 27.7 110.8 32.4 109.7 40.8 C108.8 36 105.6 32.9 100 32.5 C94.4 32.9 91.2 36 90.3 40.8 Z" fill="${color}" ${borde}/>
                         ${brillo("M93.6 32 Q96.4 29.4 100 29.1")}${brillo("M102 29.4 Q105.4 30.2 107.4 32.6", 0.6)}${mechones("M92.4 37 Q95 31.6 100 30.4", "M100.6 30.4 Q105.6 31.2 108.4 36.6", "M96 34 Q100 31.6 104.6 32.6")}`,
            };

        case "melena":     // media melena con flequillo
            return {
                atras: `<path d="M88.8 40 C87.2 28.6 93 26 100 26 C107 26 112.8 28.6 111.2 40 C112.3 47 112.8 53 111.5 59 Q107.6 61.8 104.6 58.4 L95.4 58.4 Q92.4 61.8 88.5 59 C87.2 53 87.7 47 88.8 40 Z" fill="${color}" ${borde}/>`,
                frente: `<path d="M90.2 41.8 C89 33 92.6 27.3 100 27.1 C107.4 27.3 111 33 109.8 41.8 C109.2 38.8 108 36.8 106.6 35.8 C104.5 37.7 101.2 38.5 98 37.9 C95.2 37.4 92.6 36.6 91.4 35.6 C90.6 37.4 90.3 39.4 90.2 41.8 Z" fill="${color}" ${borde}/>
                         <path d="M90.5 40 C89.3 45 89.1 51 90.1 56.6 Q91.9 57.4 92.5 55.2 C91.8 50 91.8 45 92.3 41.5 Z" fill="${color}" ${borde}/>
                         <path d="M109.5 40 C110.7 45 110.9 51 109.9 56.6 Q108.1 57.4 107.5 55.2 C108.2 50 108.2 45 107.7 41.5 Z" fill="${color}" ${borde}/>
                         ${brillo("M93.2 32.4 Q96 29.4 99.6 29")}${brillo("M95 35.4 Q98 36.6 101 36.2", 0.6)}${mechones("M92.6 35 Q95.6 30.8 100.6 30.2", "M100 36.6 Q103.6 33.8 107.6 35", "M90.8 44 Q90.4 50 91 55.4", "M109.2 44 Q109.6 50 109 55.4")}`,
            };

        case "rizado": {   // rizos con volumen: muchos círculos formando una nube
            const rizos = [];
            for (let i = 0; i <= 10; i++) {            // el arco de arriba
                const a = Math.PI * (1.02 + i * 0.096);
                rizos.push([100 + 12 * Math.cos(a), 36.5 + 11.5 * Math.sin(a), 4.4]);
            }
            rizos.push([100, 30, 7], [94.5, 31, 5.5], [105.5, 31, 5.5], [88.6, 41, 3.4], [111.4, 41, 3.4]);
            const circulos = rizos.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join("");
            const nube = `<g fill="${TRAZO}" stroke="${TRAZO}" stroke-width="1.5">${circulos}</g><g fill="${color}">${circulos}</g>`;
            const linea = [[91.8, 36.2, 2.7], [94.8, 33.9, 3.1], [98.6, 33.2, 3.3], [102.6, 33.4, 3.2], [106, 34.4, 3], [108.6, 36.6, 2.5]]
                .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
            return {
                atras: nube,
                frente: `<g fill="${color}">${linea}</g>
                         ${brillo("M92 27 Q94.6 24.2 98 23.8", 0.9)}${brillo("M101.6 25.6 Q104.6 25 107 27", 0.7)}${brillo("M89.6 33 Q90 30.6 91.6 29", 0.7)}`,
            };
        }

        case "cresta":     // lados rapados y copete alto
            return {
                atras: "",
                frente: `<path d="M90.5 39.6 C89.8 33 92.6 29.6 96 28.8 L104 28.8 C107.4 29.6 110.2 33 109.5 39.6 C108.8 36 107 34 104.8 33.4 L95.2 33.4 C93 34 91.2 36 90.5 39.6 Z" fill="${p.pelo}" opacity=".7"/>
                         <path d="M92.6 35.4 C91.8 29.4 95.6 24.4 101.8 23.6 C106.6 23 109.8 25.4 110.4 28.5 C108.4 27.5 106.6 27.7 105.4 28.7 C107.7 30 109 32.3 109 35.2 C106 32.8 101.5 32.5 97.7 33.4 C95.5 34 93.8 34.6 92.6 35.4 Z" fill="${color}" ${borde}/>
                         ${brillo("M95.4 30 Q98.4 26.2 103 25.4", 0.9)}${brillo("M97.4 31.6 Q100.4 29.4 104 29.4", 0.6)}${mechones("M94.6 32.4 Q98.6 27.2 105.6 26.2", "M96.8 33.4 Q101.6 30.6 107.6 31.8", "M99 31.6 Q103 28.4 108.8 28.6")}`,
            };

        // (v102) Trenza: el pelo recogido atrás en una trenza que cae por la espalda.
        case "trenza": {
            const eslabones = [0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${i % 2 ? 108.4 : 109.6}" cy="${40 + i * 5.2}" rx="2.6" ry="3.2" fill="${color}" ${borde}/>`).join("");
            return {
                atras: `${eslabones}<rect x="107.6" y="69.6" width="3.2" height="2" rx=".6" fill="${p.borde}" stroke="${TRAZO}" stroke-width=".5"/>`,
                frente: `<path d="M90.3 40.6 C89.2 32.4 92.8 27.6 100 27.4 C107.2 27.6 110.8 32.4 109.7 40.6 C108.8 36 105.6 32.8 100 32.4 C94.4 32.8 91.2 36 90.3 40.6 Z" fill="${color}" ${borde}/>
                         ${brillo("M93.6 32 Q96.4 29.4 100 29.1")}${mechones("M92.4 37 Q95 31.6 100 30.4", "M100.6 30.4 Q105.6 31.2 108.4 36.6")}`,
            };
        }
        // (v102) En punta: mechones cortos y levantados.
        case "puntas":
            return {
                atras: "",
                frente: `<path d="M90.4 40.2 L89 33.4 L92.2 34.4 L91.8 28.8 L95.4 31.2 L96.4 25.6 L99.6 30 L101.6 24.6 L103.6 29.8 L106.8 25.8 L107 31.4 L110.6 29.4 L109.4 34.6 L111 35.4 L109.6 40.2 C108.8 36.4 105.6 33.6 100 33.2 C94.4 33.6 91.2 36.4 90.4 40.2 Z" fill="${color}" ${borde}/>
                         ${brillo("M94.6 31.6 L95.8 27.6", 0.7)}${brillo("M100.4 30 L101.4 26.6", 0.7)}${mechones("M93 36.6 Q96 33 99.6 32.2", "M101 32.2 Q105 33 107.6 36.4")}`,
            };
        // (v102) Raya al lado: corto y peinado hacia un lado, con un mechón que cae sobre la frente.
        case "lado":
            return {
                atras: "",
                frente: `<path d="M90.2 40.6 C89 32.6 92.4 27.4 100 27.2 C107.6 27.4 111 32.6 109.8 40.6 C109 36.6 107.6 34.4 105.6 33.4 C101 33.4 96.8 35.2 93.6 38.8 C92.2 39.2 91 39.8 90.2 40.6 Z" fill="${color}" ${borde}/>
                         <path d="M93.6 38.8 Q99 33.6 105.6 33.4 Q100 36 97.8 40.4 Q95.6 39.4 93.6 38.8 Z" fill="${color}" ${borde}/>
                         <path d="M96 28.4 L95.2 33.2" stroke="${oscurecer(p.pelo, 0.4)}" stroke-width=".55"/>
                         ${brillo("M98 29.4 Q102.4 28.6 106.4 31.4")}${mechones("M97 32 Q101.6 30 107.6 33.4", "M94.6 37.2 Q99 34 104.6 33.8")}`,
            };
        // (v102) Moño: el pelo recogido en un moño alto.
        case "mono":
            return {
                atras: `<circle cx="100" cy="24.4" r="5.4" fill="${color}" ${borde}/>${brillo("M97 21.6 Q99.6 20 102.2 21", 0.7)}${mechones("M96.2 25 Q100 22 103.8 25")}`,
                frente: `<path d="M90.3 40.8 C89.2 32.4 92.8 27.7 100 27.5 C107.2 27.7 110.8 32.4 109.7 40.8 C108.8 36 105.6 32.9 100 32.5 C94.4 32.9 91.2 36 90.3 40.8 Z" fill="${color}" ${borde}/>
                         <path d="M95.4 28.6 Q100 27.2 104.6 28.6 L104.2 30 Q100 28.8 95.8 30 Z" fill="${p.borde}" stroke="${TRAZO}" stroke-width=".5"/>
                         ${brillo("M93.6 32 Q96.4 29.4 100 29.1")}${mechones("M92.4 37 Q95 31.6 100 30.4", "M100.6 30.4 Q105.6 31.2 108.4 36.6")}`,
            };

        default:           // "corto": corto, peinado de lado
            return {
                atras: "",
                frente: `<path d="M90.2 40.6 C89 33 92 27.5 100 27.3 C108 27.5 111.2 33 109.8 40.6 C109.2 37 107.8 35 105.4 34.2 C102 35.7 97.5 35.9 94.6 33.9 C92.4 35.3 90.8 37.4 90.2 40.6 Z" fill="${color}" ${borde}/>
                         <path d="M90.4 39.6 L90.7 44.4 L92 40.4 Z M109.6 39.6 L109.3 44.4 L108 40.4 Z" fill="${p.pelo}"/>
                         ${brillo("M93.8 31.4 Q97 28.8 101.4 28.9")}${brillo("M96.4 33 Q99.4 31.6 103 32", 0.6)}${mechones("M91.8 37.4 Q93.8 31.6 99 29.6", "M95.4 34.2 Q99 31.2 104.8 30.8", "M101.6 34.6 Q105.8 33.2 108.6 36.4")}`,
            };
    }
}
