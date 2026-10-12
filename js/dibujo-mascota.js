// dibujo-mascota.js — La mascota: un dragón que crece con tus misiones.
//
// Se dibuja alrededor del punto (0, 0), mirando hacia la izquierda (hacia tu
// personaje), con el suelo en y = 16. Tiene tres etapas: huevo → cría → adulto.
// Si la descuidas (3 días sin misiones) pierde el color y se ve apagada.
//
// Para que se vea como un animal y no como un muñeco:
//   - escamas: un dibujo pequeño que se repite (un "patrón") encima de la piel;
//   - alas de membrana: piel delgada y un poco transparente estirada entre huesos;
//   - cuernos y garras de marfil, vientre de placas color hueso;
//   - ojo de reptil (pupila rasgada) que brilla.

import { TRAZO, SOMBRA, mate, halo, mezclar, aclarar, oscurecer, nuevoId } from "./dibujo-base.js";

// Escamas: arcos pequeños, en filas alternadas (como tejas).
function escamas(id, color) {
    return `<pattern id="${id}" width="2.6" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
                <path d="M0 2.2 Q1.3 .4 2.6 2.2" fill="none" stroke="${color}" stroke-width=".32"/>
                <path d="M-1.3 1.1 Q0 -.7 1.3 1.1 M1.3 1.1 Q2.6 -.7 3.9 1.1" fill="none" stroke="${color}" stroke-width=".32"/>
                <circle cx="1.3" cy="1.5" r=".35" fill="#fff" opacity=".18"/></pattern>`;
}

export function cuerpoMascota(m) {
    const id = nuevoId("m");
    // Triste = colores apagados (se mezclan con gris).
    const c = (color) => (m.triste ? mezclar(color, "#565266", 0.6) : color);
    const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;
    const sombra = (ancho) => `<ellipse cx="0" cy="16.6" rx="${ancho}" ry="2.8" fill="#000" opacity=".45"/>
                               <ellipse cx="0" cy="16.4" rx="${ancho * 0.55}" ry="1.4" fill="#000" opacity=".4"/>`;
    let dibujo;

    if (m.etapa.clave === "huevo") {
        // Huevo de dragón: cáscara de escamas oscuras, como obsidiana, con grietas por las que sale luz.
        const forma = "M0 -15 C8.6 -15 12 -2 12 5 C12 12.6 6.6 16.6 0 16.6 C-6.6 16.6 -12 12.6 -12 5 C-12 -2 -8.6 -15 0 -15 Z";
        dibujo = `<defs>
                <radialGradient id="${id}-h" cx="35%" cy="28%" r="80%">
                    <stop offset="0" stop-color="${c("#5b6fc4")}"/><stop offset=".45" stop-color="${c("#28336e")}"/>
                    <stop offset="1" stop-color="${c("#0e1230")}"/></radialGradient>
                ${halo(`${id}-l`, c("#5fe0ff"), 0.6)}${escamas(`${id}-e`, c("#9fb2ff"))}</defs>
            ${sombra(11)}
            ${m.triste ? "" : `<circle class="orbe" cx="0" cy="2" r="19" fill="url(#${id}-l)"/>`}
            <g class="huevo">
                <path d="${forma}" fill="url(#${id}-h)" ${borde(0.9)}/>
                <path d="${forma}" fill="url(#${id}-e)" opacity=".55"/>
                <!-- brillo de la cáscara (refleja la luz como una piedra pulida) -->
                <path d="M-5.6 -10 Q-8.4 -4 -8.2 2" fill="none" stroke="#fff" stroke-width="1.7" opacity=".32" stroke-linecap="round"/>
                <ellipse cx="-4.4" cy="-9.4" rx="1.6" ry="1" fill="#fff" opacity=".45" transform="rotate(-30 -4.4 -9.4)"/>
                <!-- grietas: oscuras por fuera y con luz por dentro -->
                <path d="M-2 -11 L1.4 -6 L-1 -2 L3.4 2.6 L1 6 M1.4 -6 L4.4 -7.4" fill="none" stroke="${TRAZO}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path class="orbe" d="M-2 -11 L1.4 -6 L-1 -2 L3.4 2.6 L1 6 M1.4 -6 L4.4 -7.4" fill="none" stroke="${c("#a8f4ff")}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>
            </g>`;
    } else {
        const adulto = m.etapa.clave === "adulto";
        const piel = c(adulto ? "#4a2a86" : "#34509e");
        const membrana = c(adulto ? "#7a3fb8" : "#5a7ad0");
        const vientre = c("#d8bf8a");             // placas del vientre, color hueso
        const marfil = c("#ece0bf");              // cuernos y garras
        const ojo = m.triste ? "#8a8798" : "#ffb43a";
        const defs = `<defs>${mate(`${id}-p`, piel, 0.32, 0.6)}${escamas(`${id}-e`, oscurecer(piel, 0.6))}
                <linearGradient id="${id}-a" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stop-color="${oscurecer(membrana, 0.45)}"/><stop offset=".5" stop-color="${membrana}"/>
                    <stop offset="1" stop-color="${aclarar(membrana, 0.35)}"/></linearGradient>
                ${mate(`${id}-v`, vientre, 0.35, 0.45)}${mate(`${id}-c`, marfil, 0.3, 0.5)}
                ${halo(`${id}-l`, c(adulto ? "#9a6cff" : "#7fa4ff"), 0.4)}${halo(`${id}-o`, "#ffb43a", 0.8)}
                ${halo(`${id}-ao`, SOMBRA, 0.5, 0.4)}</defs>`;
        const f = `fill="url(#${id}-p)"`;
        // Un camino con su relleno y, encima, las escamas casi transparentes.
        const conEscamas = (d, grosor) => `<path d="${d}" ${f} ${borde(grosor)}/><path d="${d}" fill="url(#${id}-e)" opacity=".5"/>`;
        // Ojo de reptil: brilla y tiene la pupila rasgada.
        const ojoReptil = (x, y, r, giro) => `${m.triste ? "" : `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="url(#${id}-o)" opacity=".7"/>`}
                <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${ojo}" stroke="${TRAZO}" stroke-width=".45" transform="rotate(${giro} ${x} ${y})"/>
                <ellipse cx="${x}" cy="${y}" rx="${r * 0.22}" ry="${r * 0.72}" fill="${TRAZO}" transform="rotate(${giro} ${x} ${y})"/>
                <circle cx="${x - r * 0.35}" cy="${y - r * 0.3}" r="${r * 0.18}" fill="#fff" opacity=".9"/>`;

        if (!adulto) {
            // Cría: pequeña, sentada, con alitas.
            const cuerpo = "M8 8 C10 0 4 -4 -1 -3 C-4 -2.6 -5 -6 -5 -9 C-5 -13 -8 -15 -12 -14.6 L-19 -12 L-17.6 -8.6 L-13 -8 C-11 -4 -11 0 -9 4 C-10 10 -6 15.6 0 16 L7 16 C10 14.6 9.4 11 8 8 Z";
            dibujo = `${defs}${sombra(12)}
                <g class="mascota-cuerpo">
                    ${conEscamas("M4 10 C14 10 20 14 15.6 16 C11 17.4 5 16 2 14 Z", 0.8)}
                    <path d="M17.6 13 l3.6 -2.4 l-0.6 4.6 Z" fill="url(#${id}-c)" ${borde(0.5)}/>
                    <g class="ala-mascota">
                        <path d="M3 -1 Q3.4 -9 9.4 -14.4 Q10.8 -8.8 15.6 -10 Q14 -4.6 17.6 -2 Q12.4 0 12.2 3.4 Q7 2.4 3 -1 Z" fill="url(#${id}-a)" opacity=".92" ${borde(0.7)}/>
                        <!-- huesos del ala: más gruesos cerca del cuerpo -->
                        <path d="M3 -1 Q5 -8 9.4 -14.4 M3.4 -0.8 Q9 -5 15.6 -10 M3.8 -0.4 Q10 -1.6 17.6 -2" fill="none" stroke="${oscurecer(membrana, 0.55)}" stroke-width=".9" stroke-linecap="round"/>
                        <path d="M5.6 -6 Q8 -7.6 10.4 -9.6 M7 -2.4 Q10.4 -3.2 13.4 -4.6" fill="none" stroke="${aclarar(membrana, 0.4)}" stroke-width=".3" opacity=".7"/>
                    </g>
                    ${conEscamas(cuerpo, 0.9)}
                    <!-- sombra donde el cuello se junta con el cuerpo -->
                    <ellipse cx="-6.4" cy="-3" rx="4.6" ry="2.4" fill="url(#${id}-ao)"/>
                    <path d="M-9 4 C-6 2 -2 3 0 6 C1.6 9.6 0.6 13.6 -2 15.8 C-6.6 15 -9.6 10.6 -9 4 Z" fill="url(#${id}-v)" stroke="${TRAZO}" stroke-width=".4"/>
                    <path d="M-8.6 6.6 Q-4.6 5.6 -0.4 8.4 M-8.2 9.8 Q-4 9.2 0 11.4 M-7.2 12.8 Q-4 12.6 -0.8 14.2" fill="none" stroke="${oscurecer(vientre, 0.45)}" stroke-width=".45"/>
                    <path d="M-10.6 -14.4 L-8.6 -19.6 L-7 -13.6 Z" fill="url(#${id}-c)" ${borde(0.5)}/>
                    <path d="M-9.9 -16.2 L-8 -16.6 M-9.4 -17.6 L-8.2 -17.9" stroke="${oscurecer(marfil, 0.4)}" stroke-width=".3"/>
                    <path d="M-5.6 -10 l2.6 -1.4 l-1 2.8 Z M-5 -6 l2.6 -1 l-1.2 2.6 Z" fill="url(#${id}-c)" ${borde(0.4)}/>
                    ${ojoReptil(-12.4, -11.6, 1.7, -10)}
                    <circle cx="-17.6" cy="-11" r=".45" fill="${TRAZO}"/>
                    <path d="M-18.6 -9.4 Q-16 -8.4 -13.6 -8.6" fill="none" stroke="${TRAZO}" stroke-width=".5"/>
                    <path d="M-6 16 l-1.4 0 M-3.4 16.2 l-1.2 0 M3 16.2 l1.4 0" stroke="${marfil}" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M-3 -1.6 Q0.6 -2.4 4 0 M-11.4 -13.6 Q-9.4 -14.6 -7.4 -13.8" fill="none" stroke="#fff" stroke-width=".9" opacity=".3" stroke-linecap="round"/>
                </g>`;
        } else {
            // Adulto: sentado, con el cuello erguido, cuernos y las alas a medio abrir.
            const cuerpo = "M11 9 C14 -1 7 -6 0 -5 C-4 -4.6 -5.6 -9 -5.4 -14 C-5 -20 -9 -23.4 -14 -22.6 L-25 -18.6 L-23 -14 L-16.6 -13.6 C-14 -9 -14.6 -3 -12 3 C-13.6 10 -8 16 0 16.4 L9 16.4 C13 14.6 12.6 12 11 9 Z";
            dibujo = `${defs}${sombra(19)}
                ${m.triste ? "" : `<circle cx="2" cy="-4" r="30" fill="url(#${id}-l)"/>`}
                <g class="mascota-cuerpo">
                    <!-- cola, con su punta de púas -->
                    ${conEscamas("M6 9 C20 8 30 12 26 15.4 C21 18 10 17 4 14.6 Z", 0.8)}
                    <path d="M26.6 12 l5 -3.4 l-0.4 6.6 Z M24 11.4 l2.4 -3 l.6 3.4 Z" fill="url(#${id}-c)" ${borde(0.5)}/>
                    <!-- ala: membrana translúcida entre los huesos -->
                    <g class="ala-mascota">
                        <path d="M4 -4 Q4.4 -20 13 -31 Q16.4 -20.6 25.6 -25 Q23.6 -14.6 31 -10.6 Q23 -4.6 19.6 3.6 Q11 1.6 4 -4 Z" fill="url(#${id}-a)" opacity=".9" ${borde(0.8)}/>
                        <path d="M4 -4 Q7 -19 13 -31 M4.6 -3.6 Q13 -14 25.6 -25 M5.2 -3 Q17 -7 31 -10.6" fill="none" stroke="${oscurecer(membrana, 0.6)}" stroke-width="1.25" stroke-linecap="round"/>
                        <path d="M4 -4 Q7 -19 13 -31 M4.6 -3.6 Q13 -14 25.6 -25 M5.2 -3 Q17 -7 31 -10.6" fill="none" stroke="${aclarar(membrana, 0.3)}" stroke-width=".35" stroke-linecap="round" opacity=".6"/>
                        <!-- venas finas en la membrana -->
                        <path d="M8 -12 Q11 -14 13 -18 M9 -7 Q14 -9 18 -14 M12 -3 Q17 -4 22 -7 M15 0 Q19 -1 23 -3" fill="none" stroke="${oscurecer(membrana, 0.4)}" stroke-width=".3" opacity=".7"/>
                        <circle cx="13" cy="-31" r=".9" fill="${marfil}" ${borde(0.35)}/>
                    </g>
                    <!-- cuerpo, cuello y cabeza -->
                    ${conEscamas(cuerpo, 0.95)}
                    <ellipse cx="-8" cy="-4.6" rx="5.6" ry="3" fill="url(#${id}-ao)"/>
                    <!-- placas del pecho -->
                    <path d="M-12 3 C-8 0 -3 1.6 0 5.6 C2 10 0.6 14 -2.6 16.2 C-8.6 15.6 -12.6 10.6 -12 3 Z" fill="url(#${id}-v)" stroke="${TRAZO}" stroke-width=".45"/>
                    <path d="M-11.6 6.4 Q-6 5.2 -0.8 8.4 M-11 9.8 Q-5.6 9.2 -0.4 12 M-9 13.2 Q-4.8 13 -1.4 14.8" fill="none" stroke="${oscurecer(vientre, 0.5)}" stroke-width=".5"/>
                    <path d="M-14.4 -9 Q-10.6 -9.6 -8.6 -6 M-13.6 -4 Q-10 -4.6 -8 -1.6" fill="none" stroke="${vientre}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
                    <!-- cuernos de marfil, con anillos, y púas del cuello -->
                    <path d="M-11 -22.6 L-6 -32 L-5.6 -21.6 Z M-7.6 -21.4 L0 -28.6 L-3.4 -18.6 Z" fill="url(#${id}-c)" ${borde(0.6)}/>
                    <path d="M-9.4 -25.4 L-6.6 -25.2 M-8.2 -28 L-6.2 -27.8 M-4.6 -22.6 L-3 -21.4 M-2.6 -24.8 L-1.4 -23.6" stroke="${oscurecer(marfil, 0.45)}" stroke-width=".35"/>
                    <path d="M-5.6 -15 l3.4 -1.6 l-1.2 3.6 Z M-5.4 -10 l3.4 -1 l-1.6 3.2 Z M-3.6 -5.6 l3.2 -0.4 l-2 2.8 Z" fill="url(#${id}-c)" ${borde(0.45)}/>
                    <!-- cara: hocico, ceja ósea y el ojo -->
                    <path d="M-25 -18.6 L-16 -21 L-15 -17 L-22.6 -14.4 Z" fill="${TRAZO}" opacity=".18"/>
                    <path d="M-18.4 -21.8 L-12.4 -20.8" stroke="${TRAZO}" stroke-width="1.1" stroke-linecap="round"/>
                    ${ojoReptil(-14.6, -18.8, 1.75, -18)}
                    <circle cx="-23.2" cy="-17.6" r=".55" fill="${TRAZO}"/>
                    <path d="M-24 -15 Q-20 -13.6 -16.4 -13.8" fill="none" stroke="${TRAZO}" stroke-width=".6"/>
                    <path d="M-21 -14.2 l.5 1.5 l.7 -1.4 M-18.4 -13.8 l.5 1.4 l.7 -1.4" fill="${marfil}" stroke="${TRAZO}" stroke-width=".3"/>
                    <!-- pata delantera y garras -->
                    ${conEscamas("M-8 6 C-10 9 -9.6 13 -8 16.4 L-3 16.4 C-3.6 12 -3 9 -2 6.6 Z", 0.75)}
                    <path d="M-8.6 16.2 l-1.6 .6 M-6 16.6 l-1.2 .6 M-3.6 16.6 l-0.8 .6 M5 16.6 l1.6 .4 M8 16.6 l1.6 .2" stroke="${marfil}" stroke-width="1.5" stroke-linecap="round"/>
                    <!-- luz en el lomo y en la cabeza -->
                    <path d="M-4.6 -18 Q-2.6 -12 -4 -6 M0 -3.4 Q5 -3 8.6 1 M-20.6 -19.6 Q-17 -21.4 -13 -21.6" fill="none" stroke="#fff" stroke-width="1" opacity=".3" stroke-linecap="round"/>
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
