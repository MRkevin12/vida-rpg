// dibujo-mascota.js — La mascota: un dragón que crece con tus misiones.
//
// Se dibuja alrededor del punto (0, 0), mirando hacia la izquierda (hacia tu
// personaje), con el suelo en y = 16. Tiene tres etapas: huevo → cría → adulto.
// Si la descuidas (3 días sin misiones) pierde el color y se ve apagada.

import { TRAZO, mate, halo, mezclar, nuevoId } from "./dibujo-base.js";

export function cuerpoMascota(m) {
    const id = nuevoId("m");
    // Triste = colores apagados (se mezclan con gris).
    const c = (color) => (m.triste ? mezclar(color, "#565266", 0.6) : color);
    const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;
    const sombra = (ancho) => `<ellipse cx="0" cy="16.6" rx="${ancho}" ry="2.8" fill="#000" opacity=".42"/>`;
    let dibujo;

    if (m.etapa.clave === "huevo") {
        // Huevo de dragón: escamas oscuras y grietas por las que sale luz.
        dibujo = `<defs>${mate(`${id}-h`, c("#2f3f8f"), 0.3, 0.6)}${halo(`${id}-l`, c("#5fe0ff"), 0.6)}</defs>
            ${sombra(11)}
            ${m.triste ? "" : `<circle class="orbe" cx="0" cy="2" r="19" fill="url(#${id}-l)"/>`}
            <g class="huevo">
                <path d="M0 -15 C8.6 -15 12 -2 12 5 C12 12.6 6.6 16.6 0 16.6 C-6.6 16.6 -12 12.6 -12 5 C-12 -2 -8.6 -15 0 -15 Z" fill="url(#${id}-h)" ${borde(0.9)}/>
                <!-- escamas -->
                <g fill="none" stroke="${c("#7f95e6")}" stroke-width=".8" opacity=".7">
                    <path d="M-7 -5 Q-4.6 -2 -2.3 -5 Q0 -2 2.3 -5 Q4.6 -2 7 -5"/>
                    <path d="M-10 1 Q-7.6 4 -5 1 Q-2.5 4 0 1 Q2.5 4 5 1 Q7.6 4 10 1"/>
                    <path d="M-10.6 7 Q-8 10 -5.3 7 Q-2.6 10 0 7 Q2.6 10 5.3 7 Q8 10 10.6 7"/>
                    <path d="M-7 12.4 Q-4.6 15 -2.3 12.4 Q0 15 2.3 12.4 Q4.6 15 7 12.4"/>
                </g>
                <path d="M-5 -10 Q-7.6 -4 -7.6 2" fill="none" stroke="#fff" stroke-width="1.6" opacity=".3" stroke-linecap="round"/>
                <path class="orbe" d="M-2 -11 L1.4 -6 L-1 -2 L3.4 2.6 L1 6" fill="none" stroke="${c("#8ff0ff")}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </g>`;
    } else {
        const adulto = m.etapa.clave === "adulto";
        const piel = c(adulto ? "#5a2fc2" : "#4a63d8");
        const vientre = c(adulto ? "#c9b2ff" : "#b9d0ff");
        const cuerno = c("#e9c46a");
        const ojo = m.triste ? "#8a8798" : "#ffd24a";
        const defs = `<defs>${mate(`${id}-p`, piel, 0.3, 0.55)}${mate(`${id}-a`, c(adulto ? "#8a5cf0" : "#7f95e6"), 0.35, 0.5)}
                            ${mate(`${id}-v`, vientre, 0.3, 0.35)}${halo(`${id}-l`, c(adulto ? "#b08cff" : "#8fb4ff"), 0.45)}</defs>`;
        const f = `fill="url(#${id}-p)"`;

        if (!adulto) {
            // Cría: pequeña, sentada, con alitas.
            dibujo = `${defs}${sombra(12)}
                <g class="mascota-cuerpo">
                    <path d="M4 10 C14 10 20 14 15.6 16 C11 17.4 5 16 2 14 Z" ${f} ${borde()}/>
                    <path d="M17.6 13 l3.6 -2.4 l-0.6 4.6 Z" fill="${cuerno}" ${borde(0.5)}/>
                    <g class="ala-mascota">
                        <path d="M3 -1 Q3.4 -9 9.4 -14.4 Q10.8 -8.8 15.6 -10 Q14 -4.6 17.6 -2 Q12.4 0 12.2 3.4 Q7 2.4 3 -1 Z" fill="url(#${id}-a)" ${borde(0.75)}/>
                        <path d="M3 -1 Q5 -8 9.4 -14.4 M3.4 -0.8 Q9 -5 15.6 -10 M3.8 -0.4 Q10 -1.6 17.6 -2" fill="none" stroke="${TRAZO}" stroke-width=".4" opacity=".5"/>
                    </g>
                    <path d="M8 8 C10 0 4 -4 -1 -3 C-4 -2.6 -5 -6 -5 -9 C-5 -13 -8 -15 -12 -14.6 L-19 -12 L-17.6 -8.6 L-13 -8 C-11 -4 -11 0 -9 4 C-10 10 -6 15.6 0 16 L7 16 C10 14.6 9.4 11 8 8 Z" ${f} ${borde(0.9)}/>
                    <path d="M-9 4 C-6 2 -2 3 0 6 C1.6 9.6 0.6 13.6 -2 15.8 C-6.6 15 -9.6 10.6 -9 4 Z" fill="url(#${id}-v)" opacity=".9"/>
                    <path d="M-8 7.6 Q-4 7 -0.6 9 M-7 11.4 Q-3.6 11 -0.4 12.6" fill="none" stroke="${TRAZO}" stroke-width=".4" opacity=".4"/>
                    <path d="M-10.6 -14.4 L-8.6 -19.6 L-7 -13.6 Z" fill="${cuerno}" ${borde(0.5)}/>
                    <path d="M-5.6 -10 l2.6 -1.4 l-1 2.8 Z M-5 -6 l2.6 -1 l-1.2 2.6 Z" fill="${cuerno}" ${borde(0.4)}/>
                    <circle cx="-12.4" cy="-11.6" r="1.7" fill="${ojo}" stroke="${TRAZO}" stroke-width=".5"/>
                    <ellipse cx="-12.6" cy="-11.6" rx=".5" ry="1.2" fill="${TRAZO}"/>
                    <circle cx="-17.6" cy="-11" r=".45" fill="${TRAZO}"/>
                    <path d="M-18.6 -9.4 Q-16 -8.4 -13.6 -8.6" fill="none" stroke="${TRAZO}" stroke-width=".5"/>
                    <path d="M-6 16 l-1.4 0 M-3.4 16.2 l-1.2 0 M3 16.2 l1.4 0" stroke="${cuerno}" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M-3 -1.6 Q0.6 -2.4 4 0" fill="none" stroke="#fff" stroke-width="1" opacity=".3" stroke-linecap="round"/>
                </g>`;
        } else {
            // Adulto: sentado, con el cuello erguido, cuernos y las alas a medio abrir.
            dibujo = `${defs}${sombra(19)}
                ${m.triste ? "" : `<circle cx="2" cy="-4" r="30" fill="url(#${id}-l)"/>`}
                <g class="mascota-cuerpo">
                    <!-- cola -->
                    <path d="M6 9 C20 8 30 12 26 15.4 C21 18 10 17 4 14.6 Z" ${f} ${borde()}/>
                    <path d="M26.6 12 l5 -3.4 l-0.4 6.6 Z" fill="${cuerno}" ${borde(0.5)}/>
                    <!-- ala de atrás y ala de adelante -->
                    <g class="ala-mascota">
                        <path d="M4 -4 Q4.4 -20 13 -31 Q16.4 -20.6 25.6 -25 Q23.6 -14.6 31 -10.6 Q23 -4.6 19.6 3.6 Q11 1.6 4 -4 Z" fill="url(#${id}-a)" ${borde(0.85)}/>
                        <path d="M4 -4 Q7 -19 13 -31 M4.6 -3.6 Q13 -14 25.6 -25 M5.2 -3 Q17 -7 31 -10.6" fill="none" stroke="${TRAZO}" stroke-width=".55" opacity=".55"/>
                        <path d="M9 -22 Q12 -16 14 -10 M19 -18 Q20 -13 21 -8" fill="none" stroke="#fff" stroke-width=".8" opacity=".22" stroke-linecap="round"/>
                    </g>
                    <!-- cuerpo, cuello y cabeza -->
                    <path d="M11 9 C14 -1 7 -6 0 -5 C-4 -4.6 -5.6 -9 -5.4 -14 C-5 -20 -9 -23.4 -14 -22.6 L-25 -18.6 L-23 -14 L-16.6 -13.6 C-14 -9 -14.6 -3 -12 3 C-13.6 10 -8 16 0 16.4 L9 16.4 C13 14.6 12.6 12 11 9 Z" ${f} ${borde(0.95)}/>
                    <!-- placas claras del pecho -->
                    <path d="M-12 3 C-8 0 -3 1.6 0 5.6 C2 10 0.6 14 -2.6 16.2 C-8.6 15.6 -12.6 10.6 -12 3 Z" fill="url(#${id}-v)" opacity=".92"/>
                    <path d="M-11.4 6.6 Q-6 5.6 -1 8.6 M-10 10.4 Q-5.6 10 -0.4 12.4 M-7.6 13.8 Q-4.6 13.6 -1.6 15" fill="none" stroke="${TRAZO}" stroke-width=".45" opacity=".45"/>
                    <path d="M-14.4 -9 Q-10.6 -9.6 -8.6 -6 M-13.6 -4 Q-10 -4.6 -8 -1.6" fill="none" stroke="${vientre}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
                    <!-- cuernos y púas del cuello -->
                    <path d="M-11 -22.6 L-6 -32 L-5.6 -21.6 Z M-7.6 -21.4 L0 -28.6 L-3.4 -18.6 Z" fill="${cuerno}" ${borde(0.6)}/>
                    <path d="M-5.6 -15 l3.4 -1.6 l-1.2 3.6 Z M-5.4 -10 l3.4 -1 l-1.6 3.2 Z M-3.6 -5.6 l3.2 -0.4 l-2 2.8 Z" fill="${cuerno}" ${borde(0.45)}/>
                    <!-- cara -->
                    <path d="M-25 -18.6 L-16 -21 L-15 -17 L-22.6 -14.4 Z" fill="${TRAZO}" opacity=".2"/>
                    <path d="M-18 -21.6 L-12.6 -20.6" stroke="${TRAZO}" stroke-width="1" stroke-linecap="round"/>
                    <path d="M-17 -20.4 L-12.4 -19.4 L-13.6 -16.6 Z" fill="${ojo}" stroke="${TRAZO}" stroke-width=".5" stroke-linejoin="round"/>
                    <ellipse cx="-14.4" cy="-18.8" rx=".5" ry="1.3" fill="${TRAZO}" transform="rotate(-18 -14.4 -18.8)"/>
                    <circle cx="-23.2" cy="-17.6" r=".55" fill="${TRAZO}"/>
                    <path d="M-24 -15 Q-20 -13.6 -16.4 -13.8" fill="none" stroke="${TRAZO}" stroke-width=".6"/>
                    <path d="M-21 -14.2 l.5 1.5 l.7 -1.4 M-18.4 -13.8 l.5 1.4 l.7 -1.4" fill="#fff" stroke="${TRAZO}" stroke-width=".3"/>
                    <!-- pata delantera y garras -->
                    <path d="M-8 6 C-10 9 -9.6 13 -8 16.4 L-3 16.4 C-3.6 12 -3 9 -2 6.6 Z" ${f} ${borde(0.75)}/>
                    <path d="M-8.6 16.2 l-1.6 .6 M-6 16.6 l-1.2 .6 M-3.6 16.6 l-0.8 .6 M5 16.6 l1.6 .4 M8 16.6 l1.6 .2" stroke="${cuerno}" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M-4.6 -18 Q-2.6 -12 -4 -6 M0 -3.4 Q5 -3 8.6 1" fill="none" stroke="#fff" stroke-width="1" opacity=".28" stroke-linecap="round"/>
                </g>`;
        }
    }
    return `<g class="mascota ${m.triste ? "triste" : ""}">${dibujo}</g>`;
}

// La mascota sola, en grande (para la pantalla Personaje).
export function dibujarMascota(m) {
    return `<svg class="avatar-svg" viewBox="-36 -36 72 56" role="img" aria-label="Mascota: ${m.etapa.nombre}"
                 xmlns="http://www.w3.org/2000/svg">${cuerpoMascota(m)}</svg>`;
}
