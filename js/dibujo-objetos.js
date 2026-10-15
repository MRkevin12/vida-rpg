// dibujo-objetos.js — El equipamiento: lo que va en la cabeza, el pecho, la mano y la espalda.
//
// Los sombreros se dibujan sobre la cabeza (centro x = 100, coronilla y = 29).
// Las armas se dibujan "sueltas", alrededor del punto (0, 0), que es donde las agarra
// la mano, con la punta hacia arriba. Luego dibujo.js las mueve a la mano y las inclina.
// Las armaduras de pecho (v34) van encima de la ropa de la etapa, con la forma del torso.

import { TRAZO, mate, metal, halo, destello, pivote } from "./dibujo-base.js";
import { formaTorso } from "./dibujo-cuerpo.js";

const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;


// ===== Cabeza =====

// Hasta qué altura tapa el pelo cada sombrero (dibujo.js recorta el pelo por encima).
export const TAPA_PELO = { "gorra": 34.5, "sombrero-mago": 34.5, "casco": 38.5, "yelmo-alado": 38.5, "capucha": 36, "yelmo-astado": 38.5 };

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

        case "cinta-hierro":    // (v74) cinta de entrenamiento de tela roja con una placa de hierro y el nudo al costado
            return `<defs>${metal(`${p.id}-cinta`, "#9aa3b2")}</defs>
                    <path d="M109.4 36.4 Q114.6 36.2 117 41.4 Q113.4 40.6 110.4 40 Z M110 38.4 Q115.6 41 114.6 46.6 Q112.4 43 109.8 41 Z" fill="#b3202f" ${borde(0.5)}/>
                    <path d="M89.2 36.8 Q100 31.8 110.8 36.8 L110.6 40.4 Q100 35.4 89.4 40.4 Z" fill="#b3202f" ${borde(0.7)}/>
                    <path d="M91 37.4 Q100 33.4 109 37.4" fill="none" stroke="#e5606a" stroke-width=".5" opacity=".7"/>
                    <path d="M94 35 L106 35 L105.2 39.2 Q100 37.6 94.8 39.2 Z" fill="url(#${p.id}-cinta)" ${borde(0.6)}/>
                    <path d="M96.4 36.2 L103.6 36.2" stroke="#fff" stroke-width=".5" opacity=".75"/>
                    <circle cx="95.6" cy="37.2" r=".5" fill="${TRAZO}"/><circle cx="104.4" cy="37.2" r=".5" fill="${TRAZO}"/>`;

        case "diadema":         // diadema de plata en la frente, con un zafiro en forma de gota
            return `<defs>${metal(`${p.id}-plata`, "#c9d2e0")}${halo(`${p.id}-zafiro`, "#7cc4ff", 0.7)}</defs>
                    <path d="M89.4 37.6 Q100 32.4 110.6 37.6 L110.4 39.6 Q100 34.6 89.6 39.6 Z" fill="url(#${p.id}-plata)" ${borde(0.6)}/>
                    <path d="M92 37 Q100 33.6 108 37" fill="none" stroke="#fff" stroke-width=".45" opacity=".8"/>
                    <circle class="orbe" cx="100" cy="36.8" r="4.6" fill="url(#${p.id}-zafiro)"/>
                    <path d="M100 33.4 Q102.2 36 101.6 37.6 Q100.8 39.4 100 39.4 Q99.2 39.4 98.4 37.6 Q97.8 36 100 33.4 Z" fill="#2f6fd6" stroke="#dfe7f5" stroke-width=".6"/>
                    <path d="M99.4 35.6 L99.8 36.8" stroke="#fff" stroke-width=".55" stroke-linecap="round"/>
                    <circle cx="93.4" cy="37.2" r=".8" fill="#9fd4ff" stroke="${TRAZO}" stroke-width=".25"/>
                    <circle cx="106.6" cy="37.2" r=".8" fill="#9fd4ff" stroke="${TRAZO}" stroke-width=".25"/>`;

        case "yelmo-astado": {  // yelmo cerrado de hierro, con protector nasal y dos cuernos de marfil
            const cuerno = `<path d="M91.6 33.4 C86 32.4 81.6 28.2 80.8 21 C83.6 24.6 87 26.4 91 27 C91.6 29 91.8 31.2 91.6 33.4 Z" fill="url(#${p.id}-cuerno)" ${borde(0.7)}/>
                            <path d="M90.4 32.6 l1 -2.2 M87.4 31.2 l1.4 -2 M84.6 28.6 l1.6 -1.6 M82.6 25.4 l1.6 -1" stroke="#7a6a48" stroke-width=".5" opacity=".7"/>`;
            return `<defs>${mate(`${p.id}-cuerno`, "#ece0bf", 0.35, 0.45)}${metal(`${p.id}-hierro`, "#8a93a6")}</defs>
                    ${cuerno}<g transform="translate(200 0) scale(-1 1)">${cuerno}</g>
                    <path d="M88.6 43 C87.6 27.6 93 24.2 100 24.2 C107 24.2 112.4 27.6 111.4 43 L111.4 49 Q109.4 50.8 107.5 49 L107.3 41 Q100 38 92.7 41 L92.5 49 Q90.6 50.8 88.6 49 Z"
                          fill="url(#${p.id}-hierro)" ${borde(0.85)}/>
                    <path d="M98.6 36.6 L101.4 36.6 L101 46.6 L99 46.6 Z" fill="url(#${p.id}-hierro)" ${borde(0.6)}/>
                    <path d="M90.4 35.6 Q100 31 109.6 35.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.2"/>
                    <path d="M100 24.6 L100 34" stroke="${TRAZO}" stroke-width=".8" opacity=".5"/>
                    <g fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".3"><circle cx="93" cy="34.6" r=".7"/><circle cx="107" cy="34.6" r=".7"/><circle cx="90.4" cy="45" r=".65"/><circle cx="109.6" cy="45" r=".65"/></g>
                    <path d="M92.4 30.4 Q94.6 26.6 98.4 25.6" fill="none" stroke="#fff" stroke-width="1" opacity=".45" stroke-linecap="round"/>`;
        }

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

        case "yelmo-alado": {   // yelmo de acero con protector nasal y dos alas de plumas blancas
            // Cada ala es un abanico de 4 plumas que salen del costado del yelmo.
            const plumas = [[22, 12.5], [40, 15.5], [58, 14], [76, 10.5]].map(([angulo, largo]) => `
                <g transform="translate(90.6 33.4) rotate(${-angulo})">
                    <path d="M0 0 C2.6 ${-largo * 0.3} 2.2 ${-largo * 0.75} 0 ${-largo} C-2.4 ${-largo * 0.78} -2.8 ${-largo * 0.3} 0 0 Z"
                          fill="url(#${p.id}-pluma)" ${borde(0.5)}/>
                    <path d="M0 -0.6 L0 ${-largo * 0.92}" stroke="#b8b0a0" stroke-width=".45"/>
                    <path d="M-0.9 ${-largo * 0.3} Q-1.6 ${-largo * 0.55} -0.6 ${-largo * 0.82}" fill="none" stroke="#fff" stroke-width=".55" opacity=".7"/>
                </g>`).join("");
            return `<defs>${mate(`${p.id}-pluma`, "#f4f1ea", 0.15, 0.45)}</defs>
                    ${[0, 1].map((lado) => `<g ${lado ? 'transform="translate(200 0) scale(-1 1)"' : ""}>${plumas}
                        <path d="M88.4 35.8 Q89.4 31.4 91.8 30.6 L92.6 35.4 Z" fill="${p.m("oro")}" ${borde(0.5)}/></g>`).join("")}
                    <path d="M88.8 42 C88 28.4 93.4 24.6 100 24.6 C106.6 24.6 112 28.4 111.2 42 L111.2 47.6 Q109.4 49.6 107.6 47.6 L107.4 40.2 Q100 36.6 92.6 40.2 L92.4 47.6 Q90.6 49.6 88.8 47.6 Z"
                          fill="${p.m("acero")}" ${borde(0.85)}/>
                    <path d="M99 37.4 L101 37.4 L100.7 46 L99.3 46 Z" fill="${p.m("acero")}" ${borde(0.5)}/>
                    <path d="M90 36.4 Q100 31.6 110 36.4 L109.7 39.6 Q100 35 90.3 39.6 Z" fill="${p.m("oro")}" ${borde(0.6)}/>
                    <g fill="${p.oroClaro}" stroke="${TRAZO}" stroke-width=".3">
                        <circle cx="93.4" cy="36.6" r=".65"/><circle cx="97.4" cy="35.2" r=".65"/><circle cx="102.6" cy="35.2" r=".65"/><circle cx="106.6" cy="36.6" r=".65"/></g>
                    <path d="M100 24.8 L100 34" stroke="#fff" stroke-width="1.1" opacity=".5"/>
                    <path d="M92.4 30.4 Q94.6 26.6 98.4 25.6" fill="none" stroke="#fff" stroke-width="1" opacity=".45" stroke-linecap="round"/>`;
        }

        case "capucha": {       // capucha de tela gruesa con esclavina sobre los hombros y borde de cuero
            const capucha = "M86.4 53 C84 36 88 23.6 100 22 C112 23.6 116 36 113.6 53 C111.6 51 110.4 46.4 110.2 40.4 C108.6 32.6 104.6 29.2 100 29 C95.4 29.2 91.4 32.6 89.8 40.4 C89.6 46.4 88.4 51 86.4 53 Z";
            const esclavina = "M86.4 52.4 C84.6 57.6 82 61.2 79.4 64.6 Q100 71.4 120.6 64.6 C118 61.2 115.4 57.6 113.6 52.4 C111.4 55.4 106.4 60.4 100 61.2 C93.6 60.4 88.6 55.4 86.4 52.4 Z";
            return `<defs>${mate(`${p.id}-capucha`, "#2e3340", 0.2, 0.55)}</defs>
                    <path d="${esclavina}" fill="url(#${p.id}-capucha)" ${borde(0.85)}/>
                    <path d="${esclavina}" fill="${p.m("tejido")}" opacity=".28"/>
                    <path d="M83.4 60.4 Q86.6 63.6 90.6 65.4 M116.6 60.4 Q113.4 63.6 109.4 65.4 M100 61.6 L100 68.8" fill="none" stroke="#000" stroke-width=".8" opacity=".3"/>
                    <path d="M88.6 55.6 C91.6 58.6 95.6 60.6 100 61.2 C104.4 60.6 108.4 58.6 111.4 55.6" fill="none" stroke="#6b4628" stroke-width="1.1"/>
                    <circle cx="100" cy="61.4" r="1.2" fill="${p.m("acero")}" stroke="${TRAZO}" stroke-width=".4"/>
                    <path d="${capucha}" fill="url(#${p.id}-capucha)" ${borde(0.85)}/>
                    <path d="${capucha}" fill="${p.m("tejido")}" opacity=".28"/>
                    <path d="M89.8 40.4 C91.4 32.6 95.4 29.2 100 29 C104.6 29.2 108.6 32.6 110.2 40.4" fill="none" stroke="#000" stroke-width="2.6" opacity=".3"/>
                    <path d="M89.8 40.4 C91.4 32.6 95.4 29.2 100 29 C104.6 29.2 108.6 32.6 110.2 40.4" fill="none" stroke="#6b4628" stroke-width="1.1"/>
                    <path d="M92.6 26.6 Q96 23.6 100 23.2" fill="none" stroke="#fff" stroke-width="1" opacity=".18" stroke-linecap="round"/>
                    <path d="M111.4 34 C112.6 40 112.4 46 111.6 50" fill="none" stroke="#000" stroke-width="1.6" opacity=".25" stroke-linecap="round"/>`;
        }

        case "corona-dragon":   // legendaria: oro oscuro, cuernos de dragón y una gema que arde
            return `<defs>${halo(`${p.id}-brasa`, "#ff5a3c", 0.75)}</defs>
                    <circle class="orbe" cx="100" cy="29.4" r="8" fill="url(#${p.id}-brasa)"/>
                    ${[0, 1].map((lado) => `<g ${lado ? 'transform="translate(200 0) scale(-1 1)"' : ""}>
                        <path d="M91.4 33.6 C87.4 28.4 85.6 22.2 87.6 15.2 C88.8 21 91 24.8 94.6 27.2 Z" fill="#e6d8b8" stroke="#3a2a14" stroke-width=".6" stroke-linejoin="round"/>
                        <path d="M88.6 18 Q88.4 22.6 90.6 26 M89.6 27.6 Q91 29.6 92.6 30.4" fill="none" stroke="#9c8a62" stroke-width=".45"/>
                    </g>`).join("")}
                    <path d="M90.4 35.6 L90 29.6 Q100 25.6 110 29.6 L109.6 35.6 Q100 32.2 90.4 35.6 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".85" stroke-linejoin="round"/>
                    <path d="M90.4 35.6 L90 29.6 Q100 25.6 110 29.6 L109.6 35.6 Q100 32.2 90.4 35.6 Z" fill="#2b1608" opacity=".38"/>
                    <path d="M94.4 28.6 L96.2 23.2 L98 27.6 Z M102 27.6 L103.8 23.2 L105.6 28.6 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".6" stroke-linejoin="round"/>
                    <path d="M100 25.8 L102.6 29.4 L100 33 L97.4 29.4 Z" fill="#dc2626" stroke="#450a0a" stroke-width=".55"/>
                    <path d="M99 27.6 L100 26.6" stroke="#fecaca" stroke-width=".7" stroke-linecap="round"/>
                    <path d="M91.4 31.4 Q100 28 108.6 31.4" fill="none" stroke="${p.oroClaro}" stroke-width=".5" opacity=".7"/>
                    ${destello(104.6, 22.6, 1.8, "chispa", "#ffd7c2")}`;

        default:
            return "";
    }
}


// ===== Mano =====

// Cuánto se inclina cada arma en la mano (en grados; positivo = punta hacia afuera).
export const INCLINACION = { "espada-madera": 13, "espada-jefe": 13, "baston": 3, "laud": 7,
                             "hacha": 10, "mandoble": 12, "lanza-dragon": 5, "baculo-arcano": 3, "daga": 18, "martillo": 8 };

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

        case "hacha":           // hacha de guerra: mango de fresno y una hoja de acero en media luna
            return `<defs>${mate(`${p.id}-mango`, "#6b4423", 0.28, 0.5)}</defs>
                    <path d="M-1.8 14 L-1.6 -46 L1.6 -46 L1.8 14 Z" fill="url(#${p.id}-mango)" ${borde(0.7)}/>
                    <path d="M-0.4 10 Q-0.8 -14 -0.4 -42" fill="none" stroke="#fff" stroke-width=".5" opacity=".2"/>
                    <path d="M-1.8 -3 h3.6 M-1.8 0 h3.6 M-1.8 3 h3.6 M-1.8 6 h3.6" stroke="#2a180b" stroke-width=".9"/>
                    <path d="M1.6 -45 C8.4 -46.4 15.4 -50.6 18 -57 C20.4 -48.6 20.4 -35.6 17.8 -27.2 C14.2 -32.6 8.2 -35.6 1.6 -35.4 Z"
                          fill="${p.m("acero")}" ${borde(0.85)}/>
                    <path d="M1.6 -40.2 C7.6 -40.8 12.6 -43 15.6 -46" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".45"/>
                    <path d="M18 -56 C19.6 -48.6 19.6 -36.6 17.8 -28.2" fill="none" stroke="#fff" stroke-width="1" opacity=".75"/>
                    <path d="M-1.6 -43 L-8.4 -40.6 L-1.6 -37.4 Z" fill="${p.m("acero")}" ${borde(0.6)}/>
                    <rect x="-2.7" y="-47.6" width="5.4" height="13" rx="1" fill="${p.m("acero")}" ${borde(0.6)}/>
                    <path d="M-1.6 -47.6 L0 -53.6 L1.6 -47.6 Z" fill="${p.m("acero")}" ${borde(0.5)}/>
                    <g fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".3"><circle cx="0" cy="-44.4" r=".8"/><circle cx="0" cy="-38" r=".8"/></g>
                    ${destello(17.2, -52, 1.6, "chispa", "#fff")}`;

        case "daga":            // daga corta de hoja curva, con guarda en «S» y un anillo en el pomo
            return `<path d="M-2 -4 L-2.2 -22 Q-1 -30 2.4 -34 Q2.6 -26 2.2 -22 L2 -4 Z" fill="${p.m("acero")}" ${borde(0.7)}/>
                    <path d="M0 -6 Q0.4 -22 2 -31" fill="none" stroke="#fff" stroke-width=".55" opacity=".7"/>
                    <path d="M-6.4 -6.4 Q-4 -3 0 -4.6 Q4 -6.2 6.4 -2.8" fill="none" stroke="${TRAZO}" stroke-width="3" stroke-linecap="round"/>
                    <path d="M-6.4 -6.4 Q-4 -3 0 -4.6 Q4 -6.2 6.4 -2.8" fill="none" stroke="${p.oroPlano}" stroke-width="1.6" stroke-linecap="round"/>
                    <rect x="-1.6" y="-3.6" width="3.2" height="8.6" fill="#2a1a12" ${borde(0.5)}/>
                    <path d="M-1.6 -1.6 L1.6 -0.6 M-1.6 0.8 L1.6 1.8 M-1.6 3.2 L1.6 4.2" stroke="#6b4628" stroke-width=".55"/>
                    <circle cx="0" cy="7.6" r="2.4" fill="none" stroke="${TRAZO}" stroke-width="2"/>
                    <circle cx="0" cy="7.6" r="2.4" fill="none" stroke="${p.oroPlano}" stroke-width="1"/>
                    ${destello(1.6, -30, 1.3, "chispa", "#fff")}`;

        case "martillo":        // martillo de guerra: mango largo, cabeza de acero con bandas de oro y un pico atrás
            return `<defs>${mate(`${p.id}-mango`, "#5a3a22", 0.28, 0.5)}</defs>
                    <path d="M-1.8 16 L-1.6 -44 L1.6 -44 L1.8 16 Z" fill="url(#${p.id}-mango)" ${borde(0.7)}/>
                    <path d="M-1.8 -2 h3.6 M-1.8 1 h3.6 M-1.8 4 h3.6 M-1.8 7 h3.6" stroke="#2a180b" stroke-width=".9"/>
                    <path d="M-11 -56 L9 -56 L9 -40 L-11 -40 Z" fill="${p.m("acero")}" ${borde(0.85)}/>
                    <path d="M-11 -56 L-11 -40 L-13 -42 L-13 -54 Z" fill="${p.m("acero")}" ${borde(0.6)}/>
                    <path d="M9 -53 L17 -48 L9 -43 Z" fill="${p.m("acero")}" ${borde(0.7)}/>
                    <path d="M-6 -56 L-6 -40 M4 -56 L4 -40" stroke="${p.m("oro")}" stroke-width="1.6"/>
                    <path d="M-10 -54.4 L8 -54.4" stroke="#fff" stroke-width=".7" opacity=".6"/>
                    <path d="M-11 -41.4 L9 -41.4" stroke="${TRAZO}" stroke-width=".7" opacity=".5"/>
                    <circle cx="0" cy="17.4" r="2.2" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".5"/>
                    ${destello(-8, -53, 1.6, "chispa", "#fff")}`;

        case "mandoble":        // espada de dos manos: hoja larga con canal, gavilanes rectos y pomo de bronce
            return `<path d="M-2.7 -6 L-2.7 -68 L0 -77 L2.7 -68 L2.7 -6 Z" fill="${p.m("acero")}" ${borde(0.85)}/>
                    <path d="M0 -7 L0 -76.4 L2.7 -68 L2.7 -6 Z" fill="#000" opacity=".2"/>
                    <path d="M0 -12 L0 -60" stroke="${TRAZO}" stroke-width="1.3" opacity=".38"/>
                    <path d="M-1.8 -9 L-1.8 -66" stroke="#fff" stroke-width=".65" opacity=".7"/>
                    <path d="M-12.6 -8 L12.6 -8 L11.4 -4.6 L-11.4 -4.6 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".65" stroke-linejoin="round"/>
                    <circle cx="-12.4" cy="-6.3" r="1.7" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".5"/>
                    <circle cx="12.4" cy="-6.3" r="1.7" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".5"/>
                    <rect x="-1.9" y="-4.6" width="3.8" height="15.6" fill="#3a2414" ${borde(0.6)}/>
                    <path d="M-1.9 -2.4 L1.9 -1 M-1.9 0.6 L1.9 2 M-1.9 3.6 L1.9 5 M-1.9 6.6 L1.9 8" stroke="#6b4628" stroke-width=".7"/>
                    <path d="M0 10.6 L3.2 13.6 L0 16.8 L-3.2 13.6 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".6"/>
                    ${destello(-1.6, -71, 2, "chispa", "#fff")}`;

        case "lanza-dragon":    // legendaria: asta oscura con escamas de oro y una punta en forma de llama
            return `<defs>${halo(`${p.id}-fuego`, "#ff6a3d", 0.75)}${mate(`${p.id}-asta`, "#3b1f12", 0.25, 0.5)}
                          <linearGradient id="${p.id}-llama" x1="0" y1="1" x2="0" y2="0">
                              <stop offset="0" stop-color="#7f1d1d"/><stop offset=".55" stop-color="#ef4444"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>
                    <ellipse class="orbe" cx="0" cy="-64" rx="11" ry="17" fill="url(#${p.id}-fuego)"/>
                    <path d="M-1.5 72 L-1.5 -52 L1.5 -52 L1.5 72 Z" fill="url(#${p.id}-asta)" ${borde(0.7)}/>
                    <path d="M-1.5 -10 q1.5 1.8 3 0 M-1.5 -6 q1.5 1.8 3 0 M-1.5 -2 q1.5 1.8 3 0 M-1.5 2 q1.5 1.8 3 0 M-1.5 6 q1.5 1.8 3 0 M-1.5 10 q1.5 1.8 3 0"
                          fill="none" stroke="${p.oroPlano}" stroke-width=".55"/>
                    <path d="M-3.4 -52 L3.4 -52 L2.2 -56.4 L-2.2 -56.4 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".6"/>
                    <path d="M0 -81 C3.2 -74.6 6.4 -68.4 4.6 -62.2 C6.8 -63.2 7.4 -60 6 -57.2 C4.2 -56.2 2.4 -56.4 0 -56.4 C-2.4 -56.4 -4.2 -56.2 -6 -57.2 C-7.4 -60 -6.8 -63.2 -4.6 -62.2 C-6.4 -68.4 -3.2 -74.6 0 -81 Z"
                          fill="url(#${p.id}-llama)" stroke="#450a0a" stroke-width=".7" stroke-linejoin="round"/>
                    <path d="M0 -79 L0 -58.4" stroke="#fff7d6" stroke-width=".7" opacity=".85"/>
                    ${destello(-3.4, -74, 2, "chispa", "#fff")}${destello(5.6, -66, 1.3, "chispa", "#ffe1c2")}`;

        case "baculo-arcano": { // legendario: anillo de plata con un orbe violeta y runas que giran
            const runas = [0, 90, 180, 270].map((angulo) => `<path transform="rotate(${angulo} 0 -48)" d="M0 -62.6 l1.5 2.1 l-1.5 2.1 l-1.5 -2.1 Z" fill="#ead7ff"/>`).join("");
            return `<defs>${mate(`${p.id}-vara`, "#2a1f3d", 0.25, 0.5)}${halo(`${p.id}-arcano`, "#c084fc", 0.8)}
                          <radialGradient id="${p.id}-orbe" cx=".35" cy=".35" r=".7">
                              <stop offset="0" stop-color="#f5e8ff"/><stop offset=".45" stop-color="#a855f7"/><stop offset="1" stop-color="#3b0764"/></radialGradient></defs>
                    <path d="M-1.9 72 Q-2.4 20 -1.8 -37 L1.8 -37 Q2.4 20 1.9 72 Z" fill="url(#${p.id}-vara)" ${borde(0.75)}/>
                    <path d="M-0.5 60 Q-1 20 -0.4 -33" fill="none" stroke="#fff" stroke-width=".55" opacity=".2"/>
                    <path d="M-2.2 -10 h4.4 v2.4 h-4.4 Z M-2.3 18 h4.6 v2.4 h-4.6 Z" fill="${p.m("acero")}" stroke="${TRAZO}" stroke-width=".45"/>
                    <circle class="orbe" cx="0" cy="-48" r="17" fill="url(#${p.id}-arcano)"/>
                    <path d="M-1.8 -37 Q-6.4 -38.6 -8 -41.6 M1.8 -37 Q6.4 -38.6 8 -41.6" fill="none" stroke="${p.m("acero")}" stroke-width="2.2" stroke-linecap="round"/>
                    <circle cx="0" cy="-48" r="10.4" fill="none" stroke="${TRAZO}" stroke-width="3.6"/>
                    <circle cx="0" cy="-48" r="10.4" fill="none" stroke="${p.m("acero")}" stroke-width="2.4"/>
                    <circle cx="0" cy="-48" r="5.8" fill="url(#${p.id}-orbe)" stroke="#3b0764" stroke-width=".6"/>
                    <path d="M-2.2 -50.2 Q-1.4 -52 0.4 -52.4" fill="none" stroke="#fff" stroke-width=".8" opacity=".85" stroke-linecap="round"/>
                    ${pivote(0, -48, "runas-giro", runas)}`;
        }

        default:
            return "";
    }
}


// ===== Espalda =====

// La «Capa real»: violeta con borde de oro.
export const COLOR_CAPA_REAL = "#4c1d95";
export const COLOR_CAPA_FRAGUA = "#c2410c";   // (v74) la capa de la Fragua: naranja de brasa

// Capa. La del héroe es del color de su traje; la «Capa carmesí» y la «Capa real» se compran.
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

// Capa de plumas de cuervo: la capa negra con filas de plumas que brillan en violeta.
export function capaCuervo(e, p) {
    const H = e.H;
    const mitad = (y) => H - 3 + ((y - 61) / (168 - 61)) * 18;   // medio ancho de la capa a esa altura
    let plumas = "";
    for (const y of [88, 104, 120, 136, 152, 166]) {
        const ancho = mitad(y) - 3;
        for (let x = 100 - ancho; x < 100 + ancho - 4; x += 6) {
            plumas += `M${x.toFixed(1)} ${y} q3 6 6 0 `;
        }
    }
    return `${capa(e, p, "#2c2640", false)}
            <path d="${plumas}" fill="none" stroke="#8f7fc6" stroke-width=".85" opacity=".7"/>
            <path d="M${100 - H + 4} 64 C${100 - H - 2} 96 ${100 - H - 6} 130 ${100 - H - 12} 160" fill="none" stroke="#9a8ad0" stroke-width=".8" opacity=".35"/>
            <path d="M${100 - H + 1} 62 l-4 6 l3 -1 l-2 5 l4 -6 l-3 1 Z M${100 + H - 1} 62 l4 6 l-3 -1 l2 5 l-4 -6 l3 1 Z" fill="#2a2438" ${borde(0.5)}/>`;
}

// Escudo redondo: de madera con borde de acero, colgado en la espalda (asoma por la izquierda).
export function escudo(p, cx = 78, cy = 88) {
    const r = 21;
    let tablas = "";
    for (let x = cx - r + 7; x < cx + r - 3; x += 7) tablas += `M${x} ${cy - r + 2} L${x} ${cy + r - 2} `;
    return `<defs>${mate(`${p.id}-escudo`, "#7a4f2a", 0.3, 0.55)}</defs>
            <g transform="rotate(-14 ${cx} ${cy})">
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${p.id}-escudo)" ${borde(0.9)}/>
                <path d="${tablas}" stroke="#3e2512" stroke-width=".7" opacity=".7"/>
                <circle cx="${cx}" cy="${cy}" r="${r - 1.4}" fill="none" stroke="${p.m("acero")}" stroke-width="2.6"/>
                <path d="M${cx - r + 4} ${cy} L${cx + r - 4} ${cy}" stroke="${p.m("acero")}" stroke-width="2.2"/>
                <circle cx="${cx}" cy="${cy}" r="5" fill="${p.m("acero")}" ${borde(0.6)}/>
                <circle cx="${cx - 1.4}" cy="${cy - 1.4}" r="1.4" fill="#fff" opacity=".6"/>
                <path d="M${cx - r + 4} ${cy - 10} Q${cx - 10} ${cy - r + 2} ${cx} ${cy - r + 1.6}" fill="none" stroke="#fff" stroke-width="1" opacity=".3"/>
            </g>`;
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

// Alas de dragón (legendarias): membrana roja oscura con huesos de marfil y garras en la punta.
export function alasDragon(p) {
    const ala = `
        <path d="M93 66 C83 52 70 40 51 29 L45.6 33.6 C51.6 39.6 53.6 46 51.6 52 C45.6 50 39.6 52 35.6 58 C41.6 60 45.6 64 45.6 70
                 C39.6 70 34.6 74 32.6 80 C41.6 80 49.6 82 55.6 88 C63.6 84 75.6 80 93 80 Z"
              fill="url(#${p.id}-membrana)" stroke="#1f0606" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M91 70 C80 60 66 52 51.6 52 M90 74 C77 70 61 70 45.6 70 M91 78 C79 79 66 83 55.6 88" fill="none" stroke="#000" stroke-width="2" opacity=".18"/>
        <path d="M93 66 C81 53 67 41 51 29 M90 70 C78 61 64 54 51.6 52 M90 74 C77 71 61 70 45.6 70 M91 78 C79 79 66 83 55.6 88"
              fill="none" stroke="#d9cba8" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M70 47 C68 52 70 58 66 61 M62 63 C60 66 61 70 58 71" fill="none" stroke="#ff8a6a" stroke-width=".45" opacity=".55"/>
        <path d="M51 29 L46 24.6 L49.6 31 Z M51.6 52 L46.6 50.2 L50.4 53.6 Z M45.6 70 L40.6 69.4 L44.8 72 Z" fill="#efe4c8" stroke="#1f0606" stroke-width=".4"/>`;
    return `<defs><linearGradient id="${p.id}-membrana" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#8f1d1d"/><stop offset=".55" stop-color="#4c0b0b"/><stop offset="1" stop-color="#1f0606"/></linearGradient>
                ${halo(`${p.id}-ala-brasa`, "#ff5a3c", 0.32)}</defs>
            <g class="alas">
                <circle class="orbe" cx="100" cy="58" r="58" fill="url(#${p.id}-ala-brasa)"/>
                ${ala}<g transform="translate(200 0) scale(-1 1)">${ala}</g></g>`;
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


// ===== Pecho (v34) =====
// Las armaduras de pecho, sobre la ropa de la etapa. e = las medidas del cuerpo (esqueleto).

// El peto: la placa del pecho, de los hombros a la cintura.
function formaPeto(e) {
    const { H, cintura: C } = e;
    return `M${100 - H + 3} 65.4 Q100 59 ${100 + H - 3} 65.4 L${100 + C + 2.8} 84 Q${100 + C + 0.6} 92 ${100 + C + 0.8} 99
            Q100 103.6 ${100 - C - 0.8} 99 Q${100 - C - 0.6} 92 ${100 - C - 2.8} 84 Z`;
}

// Placas que cuelgan de la cintura y protegen la cadera (las corazas).
function faldaDePlacas(e, color, ribete) {
    const { cintura: C, cadera: K } = e;
    let placas = "";
    for (const [y, sale] of [[97.6, 0], [104.4, 1.6]]) {
        placas += `<path d="M${100 - C - 1 - sale} ${y} Q100 ${y + 4} ${100 + C + 1 + sale} ${y} L${100 + K + 1 + sale} ${y + 7} Q100 ${y + 11} ${100 - K - 1 - sale} ${y + 7} Z"
                         fill="${color}" ${borde(0.75)}/>
                   <path d="M100 ${y + 2.4} L100 ${y + 10}" stroke="${TRAZO}" stroke-width=".6" opacity=".45"/>
                   <path d="M${100 - K - 0.6 - sale} ${y + 6.2} Q100 ${y + 10} ${100 + K + 0.6 + sale} ${y + 6.2}" fill="none" stroke="${ribete}" stroke-width=".7"/>`;
    }
    return placas;
}

export function armaduraDePecho(id, e, p) {
    const { H, cintura: C, cadera: K } = e;
    const peto = formaPeto(e);
    const luz = `<path d="M${100 - H + 6} 68.6 Q${100 - 9} 66 ${100 - 4.4} 69.6" fill="none" stroke="#fff" stroke-width="1" opacity=".45" stroke-linecap="round"/>`;
    const sombraDerecha = `<path d="M100 61.6 L${100 + H - 3} 65.4 L${100 + C + 2.8} 84 Q${100 + C + 0.6} 92 ${100 + C + 0.8} 99 Q106 101.6 101.4 102 Q104.6 82 100 61.6 Z" fill="${TRAZO}" opacity=".22"/>`;
    switch (id) {
        case "peto-cuero":      // cuero curtido con costuras, tachas de bronce y cordones al centro
            return `<defs>${mate(`${p.id}-curtido`, "#7a4e2c", 0.28, 0.55)}</defs>
                    <path d="${peto}" fill="url(#${p.id}-curtido)" ${borde(0.85)}/>
                    <path d="${peto}" fill="${p.m("grano")}" opacity=".35"/>
                    ${sombraDerecha}
                    <path d="M${100 - H + 6} 67.4 Q100 62 ${100 + H - 6} 67.4 M${100 - C - 0.6} 96.4 Q100 100.4 ${100 + C + 0.6} 96.4" fill="none" stroke="#d9b48a" stroke-width=".6" stroke-dasharray="1.4 1.1"/>
                    <path d="M97.4 66 L102.6 70 M102.6 66 L97.4 70 M97.4 72 L102.6 76 M102.6 72 L97.4 76 M97.4 78 L102.6 82 M102.6 78 L97.4 82" stroke="#e8d3a8" stroke-width=".7" stroke-linecap="round"/>
                    <path d="M100 63.4 L100 98" stroke="${TRAZO}" stroke-width=".7" opacity=".5"/>
                    <g fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".3">
                        <circle cx="${100 - H + 7}" cy="70" r=".9"/><circle cx="${100 + H - 7}" cy="70" r=".9"/>
                        <circle cx="${100 - C + 1}" cy="86" r=".9"/><circle cx="${100 + C - 1}" cy="86" r=".9"/>
                        <circle cx="${100 - C + 2}" cy="94" r=".9"/><circle cx="${100 + C - 2}" cy="94" r=".9"/></g>
                    ${luz}`;

        case "cota-malla": {    // malla de anillos de acero hasta la cadera, con cinturón de cuero
            const forma = formaTorso(e, 113);
            return `<defs>${metal(`${p.id}-malla-metal`, "#9aa3b2")}
                        <pattern id="${p.id}-malla" width="2.4" height="2" patternUnits="userSpaceOnUse">
                            <circle cx="1.2" cy="1" r=".85" fill="none" stroke="#2b303c" stroke-width=".38"/></pattern></defs>
                    <path d="${forma}" fill="url(#${p.id}-malla-metal)" ${borde(0.85)}/>
                    <path d="${forma}" fill="url(#${p.id}-malla)" opacity=".75"/>
                    <path d="M100 61 L${100 + H} 67 L${100 + C + 2.4} 84 Q${100 + C - 0.4} 93 ${100 + C} 100 L${100 + K} 113 Q104 115 102 114.6 Q105 90 100 61 Z" fill="${TRAZO}" opacity=".2"/>
                    <path d="M${100 - K} 113 Q100 117.4 ${100 + K} 113" fill="none" stroke="#5a6070" stroke-width="1.4" stroke-dasharray="1.6 1"/>
                    <path d="M94.4 59.8 Q100 64.4 105.6 59.8 L105.8 63 Q100 67.4 94.2 63 Z" fill="url(#${p.id}-malla-metal)" ${borde(0.6)}/>
                    <path d="M${100 - C - 0.4} 99 Q100 103.4 ${100 + C + 0.4} 99 L${100 + C + 0.8} 102.6 Q100 107 ${100 - C - 0.8} 102.6 Z" fill="${p.m("cuero")}" ${borde(0.7)}/>
                    <rect x="97.6" y="100.6" width="4.8" height="4.2" rx=".8" fill="none" stroke="${p.m("oro")}" stroke-width="1"/>
                    ${luz}`;
        }

        case "tunica-arcana": { // túnica de arcanista: añil con ribetes de plata, runas que brillan y un fajín
            const forma = `M${100 - H + 2} 66 Q100 58.6 ${100 + H - 2} 66 L${100 + C + 2.4} 84 Q${100 + C} 93 ${100 + C + 0.6} 100
                           L${100 + K + 1.4} 124 Q100 126.4 ${100 - K - 1.4} 124 L${100 - C - 0.6} 100 Q${100 - C} 93 ${100 - C - 2.4} 84 Z`;
            const runas = [70, 77, 84, 91].map((y) => `<path d="M100 ${y - 2.4} L101.8 ${y} L100 ${y + 2.4} L98.2 ${y} Z" fill="#b9e6ff"/>`).join("");
            return `<defs>${mate(`${p.id}-arcana`, "#2b2a6e", 0.3, 0.55)}${halo(`${p.id}-runas`, "#7cc4ff", 0.6)}</defs>
                    <path d="${forma}" fill="url(#${p.id}-arcana)" ${borde(0.85)}/>
                    <path d="${forma}" fill="${p.m("tejido")}" opacity=".2"/>
                    <path d="M100 61 L${100 + H - 2} 66 L${100 + C + 2.4} 84 Q${100 + C} 93 ${100 + C + 0.6} 100 L${100 + K + 1.4} 124 Q104 125.6 102 125.4 Q105 90 100 61 Z" fill="${TRAZO}" opacity=".2"/>
                    <path d="${forma}" fill="none" stroke="#c9d2e0" stroke-width=".9" opacity=".8"/>
                    <path d="M93.6 60 L100 72 L106.4 60" fill="none" stroke="#c9d2e0" stroke-width="1.4"/>
                    <ellipse class="orbe" cx="100" cy="81" rx="6" ry="15" fill="url(#${p.id}-runas)"/>
                    ${runas}
                    <path d="M${100 - H + 5} 67 L${100 + C + 1} 101 L${100 + C - 3} 104 L${100 - H + 2} 70 Z" fill="#c9d2e0" ${borde(0.6)} opacity=".9"/>
                    <path d="M${100 - C - 1} 101 Q100 105 ${100 + C + 1} 101" fill="none" stroke="#c9d2e0" stroke-width="1.6"/>
                    ${luz}`;
        }

        case "coraza":          // coraza de acero pulido: arista al centro, ribete de oro y placas de cadera
            return `<defs>${metal(`${p.id}-coraza`, "#b9c3d4")}${mate(`${p.id}-placas`, "#6f7a8e", 0.3, 0.5)}</defs>
                    ${faldaDePlacas(e, `url(#${p.id}-placas)`, p.oroPlano)}
                    <path d="${peto}" fill="url(#${p.id}-coraza)" ${borde(0.9)}/>
                    ${sombraDerecha}
                    <path d="M100 62 L100 100" stroke="#fff" stroke-width="1" opacity=".55"/>
                    <path d="M100 62 L100 100" stroke="${TRAZO}" stroke-width=".5" opacity=".5" transform="translate(.8 0)"/>
                    <path d="M${100 - H + 4.6} 66.6 Q100 60.4 ${100 + H - 4.6} 66.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.6"/>
                    <path d="M${100 - C - 0.4} 97.6 Q100 102.2 ${100 + C + 0.4} 97.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.4"/>
                    <path d="M${100 - C - 1.6} 80 Q${100 - 7} 85.6 100 84 Q${100 + 7} 85.6 ${100 + C + 1.6} 80" fill="none" stroke="${TRAZO}" stroke-width=".7" opacity=".6"/>
                    <path d="M100 70.6 L103.4 74.6 L100 79.2 L96.6 74.6 Z" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".6"/>
                    <path d="M94.6 59.6 Q100 63.8 105.4 59.6 L105.6 62.4 Q100 66.6 94.4 62.4 Z" fill="url(#${p.id}-coraza)" ${borde(0.6)}/>
                    ${luz}${destello(100 - H + 8, 69, 1.8, "chispa", "#fff")}`;

        case "peto-constante":  // (v74) placas de acero con una franja roja y unas pesas grabadas: el peto de quien no falta
            return `<defs>${metal(`${p.id}-cons`, "#a9b2c2")}${mate(`${p.id}-banda`, "#b3202f", 0.25, 0.5)}</defs>
                    <path d="${peto}" fill="url(#${p.id}-cons)" ${borde(0.9)}/>
                    ${sombraDerecha}
                    <path d="M${100 - H + 5} 70 Q100 65.6 ${100 + H - 5} 70 L${100 + C + 1} 77.6 Q100 81.6 ${100 - C - 1} 77.6 Z" fill="url(#${p.id}-banda)" ${borde(0.6)}/>
                    <path d="M${100 - H + 5.6} 71.6 Q100 67.4 ${100 + H - 5.6} 71.6" fill="none" stroke="#e5606a" stroke-width=".5" opacity=".7"/>
                    <path d="M100 62 L100 98" stroke="${TRAZO}" stroke-width=".7" opacity=".4"/>
                    <path d="M${100 - H + 4.6} 66.6 Q100 60.4 ${100 + H - 4.6} 66.6 M${100 - C - 0.4} 97.6 Q100 102.2 ${100 + C + 0.4} 97.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.4"/>
                    <g stroke="${TRAZO}" stroke-width=".5"><rect x="91.4" y="84" width="2.4" height="7" rx=".6" fill="#d9dee8"/><rect x="94.4" y="85.2" width="1.8" height="4.6" rx=".5" fill="#9aa3b2"/>
                       <rect x="105.8" y="85.2" width="1.8" height="4.6" rx=".5" fill="#9aa3b2"/><rect x="106.2" y="84" width="2.4" height="7" rx=".6" fill="#d9dee8"/>
                       <path d="M96.2 87.5 L105.8 87.5" stroke-width="1.1"/></g>
                    <path d="M94.6 59.6 Q100 63.8 105.4 59.6 L105.6 62.4 Q100 66.6 94.4 62.4 Z" fill="url(#${p.id}-cons)" ${borde(0.6)}/>
                    ${luz}`;

        case "coraza-titan":    // (v74) legendaria: acero azul del cielo con relieve de músculos, ribetes de brasa y un yunque en el pecho
            return `<defs>${metal(`${p.id}-titan`, "#5f7fb0")}${halo(`${p.id}-brasa`, "#ff8a2a", 0.8)}${mate(`${p.id}-placas`, "#3d5688", 0.3, 0.5)}</defs>
                    ${faldaDePlacas(e, `url(#${p.id}-placas)`, "#ff9a3a")}
                    <path d="${peto}" fill="url(#${p.id}-titan)" ${borde(0.9)}/>
                    ${sombraDerecha}
                    <path d="M${100 - H + 5} 69 Q${100 - 9} 66 98.4 70.4 L98 82 Q${100 - 8} 86 ${100 - H + 7} 78 Z M${100 + H - 5} 69 Q${100 + 9} 66 101.6 70.4 L102 82 Q${100 + 8} 86 ${100 + H - 7} 78 Z" fill="#7f9fd0" opacity=".45" ${borde(0.5)}/>
                    <path d="M${100 - C + 1.6} 87.6 Q100 90.4 ${100 + C - 1.6} 87.6 M${100 - C + 1.2} 92.6 Q100 95.6 ${100 + C - 1.2} 92.6 M100 88 L100 98" fill="none" stroke="${TRAZO}" stroke-width=".7" opacity=".6"/>
                    <path d="M${100 - H + 4.6} 66.6 Q100 60.4 ${100 + H - 4.6} 66.6 M${100 - C - 0.4} 97.6 Q100 102.2 ${100 + C + 0.4} 97.6" fill="none" stroke="#ff9a3a" stroke-width="1.6"/>
                    <circle class="orbe" cx="100" cy="77" r="9" fill="url(#${p.id}-brasa)"/>
                    <path d="M94.6 80.4 L105.4 80.4 L103.4 77 L96.6 77 Z M97.4 80.4 L97.4 83.8 L102.6 83.8 L102.6 80.4" fill="#ffd9a0" stroke="${TRAZO}" stroke-width=".6" stroke-linejoin="round"/>
                    <path d="M94.4 59.6 Q100 63.8 105.6 59.6 L105.8 62.4 Q100 66.6 94.2 62.4 Z" fill="url(#${p.id}-titan)" ${borde(0.6)}/>
                    ${luz}${destello(100 + H - 8, 70, 2, "chispa", "#fff")}`;

        case "coraza-vigia":    // legendaria: plata blanca, esmalte de cielo, oro y la Llama del Vigía en el pecho
            return `<defs>${metal(`${p.id}-vigia`, "#e2e8f2")}${halo(`${p.id}-llama`, "#ffb347", 0.85)}
                        <linearGradient id="${p.id}-fuego" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0" stop-color="#c2410c"/><stop offset=".55" stop-color="#fb923c"/><stop offset="1" stop-color="#fff3c4"/></linearGradient>
                        ${mate(`${p.id}-placas`, "#8f9bb3", 0.3, 0.5)}</defs>
                    ${faldaDePlacas(e, `url(#${p.id}-placas)`, p.oroPlano)}
                    <path d="${peto}" fill="url(#${p.id}-vigia)" ${borde(0.9)}/>
                    <path d="M${100 - H + 6} 69 Q${100 - 7} 66 97 70 L96 92 Q${100 - C + 2} 92 ${100 - C - 1} 86 Z" fill="#3b6fd8" opacity=".55"/>
                    <path d="M${100 + H - 6} 69 Q${100 + 7} 66 103 70 L104 92 Q${100 + C - 2} 92 ${100 + C + 1} 86 Z" fill="#2b54b0" opacity=".55"/>
                    ${sombraDerecha}
                    <path d="M${100 - H + 4.6} 66.6 Q100 60.4 ${100 + H - 4.6} 66.6 M${100 - C - 0.4} 97.6 Q100 102.2 ${100 + C + 0.4} 97.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.6"/>
                    <path d="M96 70 L96 92 M104 70 L104 92" stroke="${p.m("oro")}" stroke-width=".9"/>
                    <circle class="orbe" cx="100" cy="80" r="11" fill="url(#${p.id}-llama)"/>
                    <path d="M100 71.4 C103.4 75.6 104.6 79.4 102.6 83.4 C102 85.4 100.6 86.6 100 86.6 C99.4 86.6 98 85.4 97.4 83.4 C95.4 79.4 96.6 75.6 100 71.4 Z"
                          fill="url(#${p.id}-fuego)" stroke="#7c2d12" stroke-width=".6" stroke-linejoin="round"/>
                    <path d="M100 77 C101.4 79 101.4 81.4 100 83.4 C98.6 81.4 98.6 79 100 77 Z" fill="#fff7d6"/>
                    <path d="M94.6 59.6 Q100 63.8 105.4 59.6 L105.6 62.4 Q100 66.6 94.4 62.4 Z" fill="url(#${p.id}-vigia)" ${borde(0.6)}/>
                    ${luz}${destello(100 + H - 8, 70, 2, "chispa", "#fff")}`;

        default:
            return "";
    }
}


// ===== Miniaturas (para la tienda y el inventario) =====
// Cada objeto se dibuja solo, encuadrado. "vista" es el recuadro que se muestra.

const VISTAS = {
    "gorra": "83 14 40 30", "sombrero-mago": "78 10 44 34", "casco": "82 11 36 43", "corona": "86 18 28 20",
    "espada-madera": "-34 -52 68 68", "espada-jefe": "-39 -66 78 82", "baston": "-36 -64 72 86", "laud": "-30 -29 60 66",
    "capa": "58 52 84 128", "alas": "30 30 140 68",
    "yelmo-alado": "73 14 54 38", "capucha": "76 19 48 54", "corona-dragon": "83 12 34 27",
    "hacha": "-14 -52 66 68", "mandoble": "-16 -70 64 90", "lanza-dragon": "-36 -84 72 92", "baculo-arcano": "-38 -68 76 88",
    "capa-real": "58 52 84 128", "alas-dragon": "28 22 144 72",
    // v34
    "diadema": "86 28 28 16", "yelmo-astado": "76 15 48 38", "daga": "-22 -38 42 50", "martillo": "-20 -62 52 82",
    "escudo": "50 60 56 56", "capa-cuervo": "58 52 84 128",
    "peto-cuero": "68 56 64 50", "cota-malla": "68 56 64 64", "tunica-arcana": "66 56 68 72",
    "coraza": "66 56 68 66", "coraza-vigia": "66 56 68 66",
    // v74: las recompensas de constancia del gimnasio
    "cinta-hierro": "85 28 34 20", "peto-constante": "66 56 68 56", "coraza-titan": "66 56 68 66", "capa-fragua": "58 52 84 128",
};

export function miniatura(id, p, e) {
    const vista = VISTAS[id];
    if (!vista) return null;
    let dibujo;
    if (id === "capa") dibujo = capa(e, p, "#8f1d2c", true);
    else if (id === "capa-real") dibujo = capa(e, p, COLOR_CAPA_REAL, true);
    else if (id === "capa-fragua") dibujo = capa(e, p, COLOR_CAPA_FRAGUA, true);
    else if (id === "capa-cuervo") dibujo = capaCuervo(e, p);
    else if (id === "escudo") dibujo = escudo(p);
    else if (armaduraDePecho(id, e, p)) dibujo = armaduraDePecho(id, e, p);
    else if (id === "alas") dibujo = alas(p);
    else if (id === "alas-dragon") dibujo = alasDragon(p);
    else if (INCLINACION[id] !== undefined) dibujo = `<g transform="rotate(${["baston", "lanza-dragon", "baculo-arcano", "martillo"].includes(id) ? 20 : 32})">${arma(id, p)}</g>`;
    else dibujo = sombrero(id, p);
    if (id === "capucha") dibujo = `<path d="M89.8 40.4 C91.4 32.6 95.4 29.2 100 29 C104.6 29.2 108.6 32.6 110.2 40.4 L110.6 54 Q100 63 89.4 54 Z" fill="#0b0816"/>${dibujo}`;
    return { vista, dibujo };
}
