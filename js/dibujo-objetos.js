// dibujo-objetos.js — El equipamiento: lo que va en la cabeza, en la mano y en la espalda.
//
// Los sombreros se dibujan sobre la cabeza (centro x = 100, coronilla y = 29).
// Las armas se dibujan "sueltas", alrededor del punto (0, 0), que es donde las agarra
// la mano, con la punta hacia arriba. Luego dibujo.js las mueve a la mano y las inclina.

import { TRAZO, mate, halo, destello } from "./dibujo-base.js";

const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;


// ===== Cabeza =====

// Hasta qué altura tapa el pelo cada sombrero (dibujo.js recorta el pelo por encima).
export const TAPA_PELO = { "gorra": 34.5, "sombrero-mago": 34.5, "casco": 38.5 };

export function sombrero(id, p) {
    switch (id) {
        case "gorra":           // boina de aprendiz, caída hacia un lado, con una pluma
            return `<defs>${mate(`${p.id}-gorra`, "#3d5a80", 0.25, 0.5)}</defs>
                    <path d="M107.6 31.6 Q112 21 119.6 18.4 Q117.4 25.6 111.6 32.6 Z" fill="#e9eef7" ${borde(0.6)}/>
                    <path d="M108.6 31.4 Q113 24 118.4 19.6" fill="none" stroke="#9fb0c9" stroke-width=".5"/>
                    <path d="M89 38.2 C86.4 29.4 92 23.4 101 23.2 C110.4 23 115.6 28.6 114 35 C113.2 38 110.8 38.8 108.6 38 Q100 34.2 89 38.2 Z" fill="url(#${p.id}-gorra)" ${borde()}/>
                    <path d="M89 38.2 C86.4 29.4 92 23.4 101 23.2 C110.4 23 115.6 28.6 114 35 C113.2 38 110.8 38.8 108.6 38 Q100 34.2 89 38.2 Z" fill="${p.m("tejido")}" opacity=".22"/>
                    <path d="M94 26.4 Q99.4 30 108.6 28.6 M97.4 24.4 Q104 27.4 112.6 30.6" fill="none" stroke="${TRAZO}" stroke-width=".45" opacity=".4"/>
                    <path d="M92 28.6 Q95.4 25.4 100 25" fill="none" stroke="#fff" stroke-width="1" opacity=".3" stroke-linecap="round"/>
                    <path d="M88.8 37.6 Q100 33 110.8 37.4 L111 40 Q100 35.8 88.6 40.2 Z" fill="#2b3f5c" ${borde(0.75)}/>
                    <circle cx="107.6" cy="35.4" r="1.3" fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".4"/>`;

        case "sombrero-mago":   // ala ancha y cono torcido, con banda y hebilla
            return `<defs>${mate(`${p.id}-mago`, "#3a2a78", 0.2, 0.55)}</defs>
                    <ellipse cx="100" cy="36.4" rx="19.6" ry="4.4" fill="#1e1547" ${borde()}/>
                    <path d="M91.4 35.4 Q95.2 25 100.6 17.8 Q105.6 13.4 110 16.2 Q106 17.4 105.6 21.6 Q108 28 108.8 35.4 Q100 38.6 91.4 35.4 Z" fill="url(#${p.id}-mago)" ${borde()}/>
                    <path d="M91.4 35.4 Q95.2 25 100.6 17.8 Q105.6 13.4 110 16.2 Q106 17.4 105.6 21.6 Q108 28 108.8 35.4 Q100 38.6 91.4 35.4 Z" fill="${p.m("tejido")}" opacity=".22"/>
                    <path d="M97.6 24.4 Q100.6 19.4 104.4 17" fill="none" stroke="#fff" stroke-width=".9" opacity=".3" stroke-linecap="round"/>
                    <ellipse cx="100" cy="35.6" rx="19" ry="3.9" fill="url(#${p.id}-mago)" ${borde(0.75)}/>
                    <path d="M92 31.4 Q100 34.6 108.2 31.4 L108.8 35 Q100 38.2 91.4 35 Z" fill="${p.m("oro")}" ${borde(0.6)}/>
                    <rect x="97.6" y="31.4" width="4.8" height="4.6" rx=".8" fill="${p.oroClaro}" ${borde(0.55)}/>
                    <rect x="99" y="32.8" width="2" height="1.8" fill="#3a2a78"/>
                    ${destello(103.4, 25.4, 1.7)}${destello(96.6, 28.6, 1.2)}`;

        case "casco":           // yelmo abierto con visera levantada y penacho
            return `<defs>${mate(`${p.id}-penacho`, "#b3202e", 0.25, 0.5)}</defs>
                    <path d="M100.4 24.8 Q98.2 14.4 107.4 15 Q114.6 16.2 116.2 24.6 Q111 19.8 106.8 21.6 Q103.8 23 103.2 25.6 Z" fill="url(#${p.id}-penacho)" ${borde(0.75)}/>
                    <path d="M103 20.6 Q107 17.6 111.6 19.4 M103.4 23 Q106.6 19.8 110 20.4" fill="none" stroke="#ff9aa5" stroke-width=".5" opacity=".7"/>
                    <path d="M88.6 43 C87.6 27.6 93 24.2 100 24.2 C107 24.2 112.4 27.6 111.4 43 L111.4 48.8 Q109.4 50.8 107.5 48.8 L107.3 40 Q100 36.2 92.7 40 L92.5 48.8 Q90.6 50.8 88.6 48.8 Z"
                          fill="${p.m("acero")}" ${borde(0.85)}/>
                    <path d="M92.7 40 Q100 36.2 107.3 40 L107.5 48.8 M92.5 48.8 L92.7 40" fill="none" stroke="${p.m("oro")}" stroke-width="1"/>
                    <path d="M90 36.6 Q100 31.4 110 36.6 L109.6 40 Q100 35.2 90.4 40 Z" fill="${p.m("acero")}" ${borde(0.75)}/>
                    <path d="M93.4 36.6 L96.4 35.4 M98.4 34.8 L101.6 34.8 M103.6 35.4 L106.6 36.6" stroke="${TRAZO}" stroke-width=".8" stroke-linecap="round" opacity=".75"/>
                    <path d="M100 24.4 L100 33.4" stroke="#fff" stroke-width="1.1" opacity=".55"/>
                    <g fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".3">
                        <circle cx="91.6" cy="38" r=".7"/><circle cx="95.6" cy="36.4" r=".7"/><circle cx="104.4" cy="36.4" r=".7"/><circle cx="108.4" cy="38" r=".7"/>
                        <circle cx="90.6" cy="44.6" r=".65"/><circle cx="109.4" cy="44.6" r=".65"/></g>
                    <path d="M92.4 30.4 Q94.6 26.6 98.4 25.6" fill="none" stroke="#fff" stroke-width="1" opacity=".45" stroke-linecap="round"/>`;

        case "corona":          // corona de oro con gemas
            return `<path d="M90.6 34.8 L89.8 25.4 L94.6 30 L97.2 23 L100 28.8 L102.8 23 L105.4 30 L110.2 25.4 L109.4 34.8 Q100 31.4 90.6 34.8 Z"
                          fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".85" stroke-linejoin="round"/>
                    <path d="M90.8 34.4 Q100 31 109.2 34.4 L109.5 32 Q100 28.8 90.5 32 Z" fill="${p.oroOscuro}" opacity=".45"/>
                    <g stroke="${TRAZO}" stroke-width=".35">
                        <path d="M100 29.4 L101.6 31.4 L100 33.2 L98.4 31.4 Z" fill="#e11d48"/>
                        <circle cx="94.4" cy="32" r="1.1" fill="#2563eb"/><circle cx="105.6" cy="32" r="1.1" fill="#059669"/>
                        <circle cx="89.8" cy="25.2" r="1" fill="#fff7d6"/><circle cx="97.2" cy="22.8" r="1" fill="#fff7d6"/>
                        <circle cx="102.8" cy="22.8" r="1" fill="#fff7d6"/><circle cx="110.2" cy="25.2" r="1" fill="#fff7d6"/>
                    </g>
                    <path d="M91.6 28.6 L93.6 30.6 M96.8 25.8 L97.6 28" stroke="#fff" stroke-width=".7" opacity=".7" stroke-linecap="round"/>
                    ${destello(107.4, 22.4, 2)}`;

        default:
            return "";
    }
}


// ===== Mano =====

// Cuánto se inclina cada arma en la mano (en grados; positivo = punta hacia afuera).
export const INCLINACION = { "espada-madera": 13, "espada-jefe": 13, "baston": 3, "laud": 7 };

export function arma(id, p) {
    switch (id) {
        case "espada-madera":   // espada de entrenamiento, de madera
            return `<defs>${mate(`${p.id}-madera`, "#b98a52", 0.3, 0.45)}</defs>
                    <path d="M-2.3 -4 L-2.3 -46 Q0 -52.6 2.3 -46 L2.3 -4 Z" fill="url(#${p.id}-madera)" ${borde(0.75)}/>
                    <path d="M0 -4 L0 -50 L2.3 -46 L2.3 -4 Z" fill="#000" opacity=".16"/>
                    <path d="M0 -6 L0 -45 M-1.1 -12 L-1.1 -30 M1.1 -22 L1.1 -40" stroke="#7a5326" stroke-width=".4" opacity=".7"/>
                    <path d="M2.3 -30 l-1.4 1.2 l1.4 1.4" fill="none" stroke="${TRAZO}" stroke-width=".5"/>
                    <rect x="-7" y="-5" width="14" height="3.2" rx="1.4" fill="#7a5326" ${borde(0.7)}/>
                    <rect x="-1.5" y="-1.8" width="3" height="10" fill="#d9cfb8" ${borde(0.6)}/>
                    <path d="M-1.5 0.4 L1.5 1.6 M-1.5 2.8 L1.5 4 M-1.5 5.2 L1.5 6.4" stroke="#8b8168" stroke-width=".5"/>
                    <circle cx="0" cy="9.6" r="2.3" fill="#7a5326" ${borde(0.6)}/>`;

        case "espada-jefe":     // espada legendaria: hoja larga con runas rojas que brillan
            return `<defs>${halo(`${p.id}-runa`, "#ff3b4e", 0.7)}</defs>
                    <ellipse class="orbe" cx="0" cy="-33" rx="9" ry="34" fill="url(#${p.id}-runa)"/>
                    <path d="M-2.9 -5 L-2.9 -55 L0 -64 L2.9 -55 L2.9 -5 Z" fill="${p.m("acero")}" ${borde(0.8)}/>
                    <path d="M0 -6 L0 -63.4 L2.9 -55 L2.9 -5 Z" fill="#000" opacity=".22"/>
                    <path d="M0 -6 L0 -57" stroke="${TRAZO}" stroke-width="1.5" opacity=".35"/>
                    ${destello(-1.6, -60, 2.2, "chispa", "#fff")}
                    <path d="M-1.9 -8 L-1.9 -54" stroke="#fff" stroke-width=".7" opacity=".7"/>
                    <path class="orbe" d="M0 -14 l-1 -2 l1 -2 l1 2 Z M0 -26 l-1 -2 l1 -2 l1 2 Z M0 -38 l-1 -2 l1 -2 l1 2 Z M0 -50 l-1 -2 l1 -2 l1 2 Z" fill="#ff4d5e"/>
                    <path d="M-9.6 -7.4 Q-8 -4 -3 -5.4 L3 -5.4 Q8 -4 9.6 -7.4 Q9.4 -1.6 3 -1.4 L-3 -1.4 Q-9.4 -1.6 -9.6 -7.4 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".7" stroke-linejoin="round"/>
                    <path d="M0 -5.6 L1.9 -3.4 L0 -1.2 L-1.9 -3.4 Z" fill="#e11d48" stroke="${TRAZO}" stroke-width=".4"/>
                    <rect x="-1.7" y="-1.6" width="3.4" height="10" fill="#5b0f1a" ${borde(0.6)}/>
                    <path d="M-1.7 0.6 L1.7 1.8 M-1.7 3 L1.7 4.2 M-1.7 5.4 L1.7 6.6" stroke="${p.oroPlano}" stroke-width=".5"/>
                    <path d="M0 8 L3 10.8 L0 13.8 L-3 10.8 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".6"/>`;

        case "baston":          // bastón de madera con un cristal que flota
            return `<defs>${mate(`${p.id}-vara`, "#5a3a22", 0.25, 0.5)}${halo(`${p.id}-cristal`, "#5fd4ff", 0.75)}
                          ${mate(`${p.id}-cuarzo`, "#7fe0ff", 0.6, 0.45)}</defs>
                    <path d="M-1.9 72 Q-2.6 20 -1.7 -38 L1.7 -38 Q2.6 20 1.9 72 Z" fill="url(#${p.id}-vara)" ${borde(0.75)}/>
                    <path d="M-0.5 60 Q-1 20 -0.4 -34" fill="none" stroke="#fff" stroke-width=".6" opacity=".25"/>
                    <path d="M0.9 66 Q1.4 40 0.8 10 M-1.2 30 Q-1.4 0 -1 -30 M0.6 0 Q1 -18 0.7 -36" fill="none" stroke="#2a180c" stroke-width=".35" opacity=".6"/>
                    <path d="M-2.2 -8 h4.4 v2.6 h-4.4 Z M-2.3 20 h4.6 v2.6 h-4.6 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".45"/>
                    <path d="M-1.7 -38 Q-7.6 -41 -6.6 -49 Q-4.4 -44 -1.2 -43 Z M1.7 -38 Q7.6 -41 6.6 -49 Q4.4 -44 1.2 -43 Z" fill="url(#${p.id}-vara)" ${borde(0.7)}/>
                    <circle class="orbe" cx="0" cy="-50" r="11" fill="url(#${p.id}-cristal)"/>
                    <path d="M0 -58 L4.2 -50 L0 -42 L-4.2 -50 Z" fill="url(#${p.id}-cuarzo)" stroke="#12728f" stroke-width=".7" stroke-linejoin="round"/>
                    <path d="M0 -58 L0 -42 M-4.2 -50 L4.2 -50" stroke="#fff" stroke-width=".45" opacity=".6"/>
                    <path d="M-2 -51.6 L-0.6 -55" stroke="#fff" stroke-width=".8" opacity=".9" stroke-linecap="round"/>
                    ${destello(-8.4, -57, 1.5, "chispa", "#bff0ff")}${destello(7.6, -60.4, 1.2, "chispa", "#bff0ff")}`;

        case "laud":            // laúd: se sostiene por el mástil y la caja cuelga
            return `<defs>${mate(`${p.id}-laud`, "#b8742c", 0.35, 0.5)}</defs>
                    <path d="M-1.5 6 L-1.5 -17 L1.5 -17 L1.5 6 Z" fill="#4a2f17" ${borde(0.7)}/>
                    <path d="M-2.3 -17 L-3.6 -25.6 L2 -27 L2.3 -17 Z" fill="#3a2412" ${borde(0.7)}/>
                    <path d="M-3.6 -19.6 h-2.2 M-3.9 -22.6 h-2.2 M2.3 -19.6 h2.2 M2.2 -22.6 h2.2" stroke="#d9c58a" stroke-width="1.1" stroke-linecap="round"/>
                    <path d="M0 4 C-10.6 6 -11.6 21 -8 28 C-5 33.6 5 33.6 8 28 C11.6 21 10.6 6 0 4 Z" fill="url(#${p.id}-laud)" ${borde(0.85)}/>
                    <path d="M-5 9 C-8 14 -8.4 22 -6 27.4 M5 9 C8 14 8.4 22 6 27.4" fill="none" stroke="#7a4a17" stroke-width=".5" opacity=".8"/>
                    <circle cx="0" cy="16" r="3.3" fill="#2a1a0c" stroke="${p.oroPlano}" stroke-width=".8"/>
                    <path d="M-2.4 16 h4.8 M0 13.6 v4.8 M-1.7 14.3 l3.4 3.4 M1.7 14.3 l-3.4 3.4" stroke="${p.oroPlano}" stroke-width=".3" opacity=".8"/>
                    <rect x="-3.4" y="24.4" width="6.8" height="1.7" rx=".5" fill="#3a2412"/>
                    <path d="M-0.9 -25 L-0.9 25 M0 -25.4 L0 25 M0.9 -25.8 L0.9 25" stroke="#efe3b8" stroke-width=".3"/>
                    <path d="M-1.9 -12.4 h3.8 v2.4 h-3.8 Z" fill="${p.borde}" stroke="${TRAZO}" stroke-width=".4"/>
                    <path d="M1.9 -11.4 q3.4 2.4 2.2 7" fill="none" stroke="${p.borde}" stroke-width="1.1" stroke-linecap="round"/>`;

        default:
            return "";
    }
}


// ===== Espalda =====

// Capa. La del héroe es del color de su traje; la «Capa carmesí» se compra.
export function capa(e, p, color, conOro) {
    const H = e.H;
    const ancho = H + 15;
    const x = (k) => (100 + ancho * k).toFixed(1);   // k de -1 (borde izquierdo) a 1 (derecho)
    const forma = `M${100 - H + 3} 61.4 Q100 55.6 ${100 + H - 3} 61.4 C${100 + H + 6} 92 ${100 + H + 13} 132 ${x(1)} 168
                     Q${x(0.83)} 174.4 ${x(0.66)} 169 Q${x(0.48)} 175.4 ${x(0.3)} 170 Q${x(0.14)} 175.8 100 171
                     Q${x(-0.14)} 175.8 ${x(-0.3)} 170 Q${x(-0.48)} 175.4 ${x(-0.66)} 169 Q${x(-0.83)} 174.4 ${x(-1)} 168
                     C${100 - H - 13} 132 ${100 - H - 6} 92 ${100 - H + 3} 61.4 Z`;
    return `<defs>${mate(`${p.id}-capa`, color, 0.16, 0.55)}</defs>
            <path d="${forma}" fill="url(#${p.id}-capa)" ${borde(0.9)}/>
            <path d="${forma}" fill="${p.m("tejido")}" opacity=".16"/>
            <!-- pliegues: franjas oscuras que bajan hasta el borde -->
            <g fill="${TRAZO}" opacity=".2">
                <path d="M${100 - H + 5} 64 C${100 - H - 2} 100 ${x(-0.74)} 140 ${x(-0.66)} 169 Q${x(-0.58)} 172.4 ${x(-0.5)} 172 C${x(-0.56)} 140 ${100 - H + 4} 100 ${100 - H + 8} 64 Z"/>
                <path d="M${100 + H - 9} 63 C${100 + H - 3} 100 ${x(0.34)} 140 ${x(0.3)} 170 Q${x(0.4)} 174.4 ${x(0.5)} 172.6 C${x(0.56)} 140 ${100 + H + 3} 100 ${100 + H - 4} 63 Z"/>
                <path d="M96 62 C95 100 97 140 100 171 Q103 172.6 106 171.6 C103 140 102 100 102 62 Z"/>
            </g>
            <path d="M${100 - H + 4} 64 C${100 - H - 5} 96 ${x(-0.92)} 134 ${x(-0.97)} 164" fill="none" stroke="#fff" stroke-width="1" opacity=".16" stroke-linecap="round"/>
            ${conOro ? `<path d="M${x(-1)} 166.4 Q${x(-0.83)} 172.8 ${x(-0.66)} 167.4 Q${x(-0.48)} 173.8 ${x(-0.3)} 168.4 Q${x(-0.14)} 174.2 100 169.4
                                 Q${x(0.14)} 174.2 ${x(0.3)} 168.4 Q${x(0.48)} 173.8 ${x(0.66)} 167.4 Q${x(0.83)} 172.8 ${x(1)} 166.4" fill="none" stroke="${p.m("oro")}" stroke-width="1.5"/>` : ""}`;
}

// Alas de luz: plumas blancas que brillan.
export function alas(p) {
    const ala = `
        <circle cx="64" cy="64" r="36" fill="url(#${p.id}-ala-luz)"/>
        <path d="M93 67 C78 45 56 33 37 37.6 C43.6 41.6 46 48 45 54 C50.4 52 53.6 58 52.4 64 C57.6 62 60.6 68 59.4 74 C64.6 72 67.6 78 66.4 84
                 C71.6 82 74.6 87 74.4 92 C80.4 88 88.4 84 93 80 Z" fill="url(#${p.id}-ala)" stroke="#86aee6" stroke-width=".8" stroke-linejoin="round"/>
        <path d="M91 69.6 C77 54 61 44.6 46.6 44.6 M91 74 C79 62.4 67 56.4 54.6 56.4 M91 78 C81 70.4 73 68.4 64.6 70.4 M90.4 81 C84 77 79 77 74.6 80"
              fill="none" stroke="#86aee6" stroke-width=".6" opacity=".8"/>
        <path d="M93 67 C85 55.4 73 47.6 62.6 47.6 C68.6 51.6 70.6 57.6 70.6 61.6 C76.6 59.6 80.6 65.6 80.6 69.6 C85.6 68.6 90 71.6 93 73.6 Z" fill="#fff" opacity=".9"/>
        <path d="M88 64 C80 54 70 48.6 62.6 47.6" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`;
    return `<defs>${halo(`${p.id}-ala-luz`, "#bfe2ff", 0.5)}
                <linearGradient id="${p.id}-ala" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3f0ff"/><stop offset="1" stop-color="#a9cbf5"/></linearGradient></defs>
            <g class="alas">${ala}<g transform="translate(200 0) scale(-1 1)">${ala}</g></g>`;
}

// Libro de hechizos (Intelecto nivel 6+): va en la mano izquierda. (x, y) = centro de la mano.
export function libro([x, y], p) {
    return `<g transform="rotate(-9 ${x} ${y})">
                <rect x="${x - 7.4}" y="${y - 9.6}" width="10.6" height="14.6" rx="1.2" fill="#efe6cf" ${borde(0.6)}/>
                <rect x="${x - 8.4}" y="${y - 10.4}" width="10.6" height="14.6" rx="1.3" fill="${p.m("gema")}" ${borde(0.8)}/>
                <rect x="${x - 8.4}" y="${y - 10.4}" width="2.3" height="14.6" rx="1" fill="${TRAZO}" opacity=".35"/>
                <path d="M${x - 5} ${y - 8.6} h5.6 v10.8 h-5.6 Z" fill="none" stroke="${p.m("oro")}" stroke-width=".6"/>
                <path d="M${x - 2.2} ${y - 6} l1.7 2.6 l-1.7 2.6 l-1.7 -2.6 Z" fill="${p.oroClaro}"/>
                <path d="M${x - 0.4} ${y + 4.2} v3.4 l-1 -1 l-1 1 v-3.4" fill="#c2183f" stroke="${TRAZO}" stroke-width=".3"/>
            </g>`;
}


// ===== Miniaturas (para la tienda y el inventario) =====
// Cada objeto se dibuja solo, encuadrado. "vista" es el recuadro que se muestra.

const VISTAS = {
    "gorra": "83 14 40 30", "sombrero-mago": "78 10 44 34", "casco": "82 11 36 43", "corona": "86 18 28 20",
    "espada-madera": "-34 -52 68 68", "espada-jefe": "-39 -66 78 82", "baston": "-36 -64 72 86", "laud": "-30 -29 60 66",
    "capa": "58 52 84 128", "alas": "30 30 140 68",
};

export function miniatura(id, p, e) {
    const vista = VISTAS[id];
    if (!vista) return null;
    let dibujo;
    if (id === "capa") dibujo = capa(e, p, "#8f1d2c", true);
    else if (id === "alas") dibujo = alas(p);
    else if (INCLINACION[id] !== undefined) dibujo = `<g transform="rotate(${id === "baston" ? 20 : 32})">${arma(id, p)}</g>`;
    else dibujo = sombrero(id, p);
    return { vista, dibujo };
}
