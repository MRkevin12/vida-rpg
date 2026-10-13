// dibujo-mascota.js — Tus mascotas: el dragón y las que se adoptan en la Tienda (v26).
//
// Cada una se dibuja alrededor del punto (0, 0), mirando hacia la izquierda (hacia tu
// personaje), con el suelo en y = 16. Tienen tres etapas: huevo → cría → adulta.
// Si la descuidas (3 días sin misiones) pierde el color y se ve apagada.
//
// Para que se vean como animales y no como muñecos:
//   - texturas: escamas, plumas o pelo, casi transparentes encima del color;
//   - alas de membrana (dragones) o de plumas (aves), con su luz y su sombra;
//   - garras y cuernos de marfil, picos con brillo;
//   - ojos que brillan (de reptil, de ave rapaz o de búho).
//
// El dragón de escarcha es el mismo dibujo que el dragón, con otros colores (como en los
// juegos clásicos). Las crías de las demás especies son la adulta en pequeño.

import { TRAZO, SOMBRA, mate, halo, mezclar, aclarar, oscurecer, nuevoId } from "./dibujo-base.js";

// Escamas: arcos pequeños, en filas alternadas (como tejas).
function escamas(id, color) {
    return `<pattern id="${id}" width="2.6" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
                <path d="M0 2.2 Q1.3 .4 2.6 2.2" fill="none" stroke="${color}" stroke-width=".32"/>
                <path d="M-1.3 1.1 Q0 -.7 1.3 1.1 M1.3 1.1 Q2.6 -.7 3.9 1.1" fill="none" stroke="${color}" stroke-width=".32"/>
                <circle cx="1.3" cy="1.5" r=".35" fill="#fff" opacity=".18"/></pattern>`;
}

// Plumas: pequeñas "u" en filas, como el plumaje del pecho.
function plumas(id, color) {
    return `<pattern id="${id}" width="3" height="2.4" patternUnits="userSpaceOnUse">
                <path d="M0 0 Q1.5 2 3 0" fill="none" stroke="${color}" stroke-width=".35"/>
                <path d="M-1.5 1.2 Q0 3.2 1.5 1.2 M1.5 1.2 Q3 3.2 4.5 1.2" fill="none" stroke="${color}" stroke-width=".35"/></pattern>`;
}

// Las sombras en el suelo (una amplia y suave, y otra más oscura justo debajo).
const sombra = (ancho) => `<ellipse cx="0" cy="16.6" rx="${ancho}" ry="2.8" fill="#000" opacity=".45"/>
                           <ellipse cx="0" cy="16.4" rx="${ancho * 0.55}" ry="1.4" fill="#000" opacity=".4"/>`;


// ===== Huevos =====
// Todas las especies nacen de un huevo; cambia el color de la cáscara y el de la luz que sale por las grietas.
const HUEVOS = {
    dragon:    { claro: "#5b6fc4", medio: "#28336e", oscuro: "#0e1230", escamas: "#9fb2ff", luz: "#5fe0ff", grieta: "#a8f4ff" },
    escarcha:  { claro: "#eaf6ff", medio: "#9cc8e8", oscuro: "#3e6f9a", escamas: "#ffffff", luz: "#bff3ff", grieta: "#ffffff" },
    cuervo:    { claro: "#5a6378", medio: "#2a2f3e", oscuro: "#101219", escamas: "#8a93a8", luz: "#9fb2ff", grieta: "#d8def0" },
    buho:      { claro: "#efe4c8", medio: "#c9b48a", oscuro: "#7d6440", escamas: "#7d6440", luz: "#ffc670", grieta: "#ffe9b0" },
    basilisco: { claro: "#6fa86a", medio: "#2f5e36", oscuro: "#122a18", escamas: "#e0c050", luz: "#d8ff6a", grieta: "#f2ffb0" },
    grifo:     { claro: "#e8c88a", medio: "#a87a3e", oscuro: "#5a3a18", escamas: "#fff0c0", luz: "#ffd23c", grieta: "#fff3b0" },
    fenix:     { claro: "#ffb35a", medio: "#c2410c", oscuro: "#5a1205", escamas: "#ffe45a", luz: "#ff8a1f", grieta: "#fff3a0" },
};

function huevo(id, h, c, triste) {
    const forma = "M0 -15 C8.6 -15 12 -2 12 5 C12 12.6 6.6 16.6 0 16.6 C-6.6 16.6 -12 12.6 -12 5 C-12 -2 -8.6 -15 0 -15 Z";
    const grietas = "M-2 -11 L1.4 -6 L-1 -2 L3.4 2.6 L1 6 M1.4 -6 L4.4 -7.4";
    return `<defs>
            <radialGradient id="${id}-h" cx="35%" cy="28%" r="80%">
                <stop offset="0" stop-color="${c(h.claro)}"/><stop offset=".45" stop-color="${c(h.medio)}"/>
                <stop offset="1" stop-color="${c(h.oscuro)}"/></radialGradient>
            ${halo(`${id}-l`, c(h.luz), 0.6)}${escamas(`${id}-e`, c(h.escamas))}</defs>
        ${sombra(11)}
        ${triste ? "" : `<circle class="orbe" cx="0" cy="2" r="19" fill="url(#${id}-l)"/>`}
        <g class="huevo">
            <path d="${forma}" fill="url(#${id}-h)" stroke="${TRAZO}" stroke-width=".9" stroke-linejoin="round"/>
            <path d="${forma}" fill="url(#${id}-e)" opacity=".55"/>
            <!-- brillo de la cáscara (refleja la luz como una piedra pulida) -->
            <path d="M-5.6 -10 Q-8.4 -4 -8.2 2" fill="none" stroke="#fff" stroke-width="1.7" opacity=".32" stroke-linecap="round"/>
            <ellipse cx="-4.4" cy="-9.4" rx="1.6" ry="1" fill="#fff" opacity=".45" transform="rotate(-30 -4.4 -9.4)"/>
            <!-- grietas: oscuras por fuera y con luz por dentro -->
            <path d="${grietas}" fill="none" stroke="${TRAZO}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="orbe" d="${grietas}" fill="none" stroke="${c(h.grieta)}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>
        </g>`;
}


// ===== El dragón (y el dragón de escarcha) =====

const COLORES_DRAGON = {
    dragon: {
        cria:   { piel: "#34509e", membrana: "#5a7ad0", luz: "#7fa4ff" },
        adulto: { piel: "#4a2a86", membrana: "#7a3fb8", luz: "#9a6cff" },
        vientre: "#d8bf8a", marfil: "#ece0bf", ojo: "#ffb43a",
    },
    escarcha: {
        cria:   { piel: "#7fb2d8", membrana: "#cfe8ff", luz: "#bff3ff" },
        adulto: { piel: "#5f93c2", membrana: "#cfe8ff", luz: "#bff3ff" },
        vientre: "#eef6ff", marfil: "#ffffff", ojo: "#7ff3ff",
    },
};

function dragon(id, m, c, colores) {
    const adulto = m.etapa.clave === "adulto";
    const tono = adulto ? colores.adulto : colores.cria;
    const piel = c(tono.piel);
    const membrana = c(tono.membrana);
    const vientre = c(colores.vientre);       // placas del vientre, color hueso
    const marfil = c(colores.marfil);         // cuernos y garras
    const ojo = m.triste ? "#8a8798" : colores.ojo;
    const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;
    const defs = `<defs>${mate(`${id}-p`, piel, 0.32, 0.6)}${escamas(`${id}-e`, oscurecer(piel, 0.6))}
            <linearGradient id="${id}-a" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stop-color="${oscurecer(membrana, 0.45)}"/><stop offset=".5" stop-color="${membrana}"/>
                <stop offset="1" stop-color="${aclarar(membrana, 0.35)}"/></linearGradient>
            ${mate(`${id}-v`, vientre, 0.35, 0.45)}${mate(`${id}-c`, marfil, 0.3, 0.5)}
            ${halo(`${id}-l`, c(tono.luz), 0.4)}${halo(`${id}-o`, colores.ojo, 0.8)}
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
        return `${defs}${sombra(12)}
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
    }
    // Adulto: sentado, con el cuello erguido, cuernos y las alas a medio abrir.
    const cuerpo = "M11 9 C14 -1 7 -6 0 -5 C-4 -4.6 -5.6 -9 -5.4 -14 C-5 -20 -9 -23.4 -14 -22.6 L-25 -18.6 L-23 -14 L-16.6 -13.6 C-14 -9 -14.6 -3 -12 3 C-13.6 10 -8 16 0 16.4 L9 16.4 C13 14.6 12.6 12 11 9 Z";
    return `${defs}${sombra(19)}
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


// ===== Las especies que se adoptan =====
// Cada función dibuja la ADULTA. Recibe el id (para sus degradados), c() (apaga los colores
// si está triste) y si está triste.

const linea = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round" stroke-linecap="round"`;

// Ojo de ave: un círculo de color con la pupila negra y un brillo.
const ojoDeAve = (x, y, r, color) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${TRAZO}" stroke-width=".4"/>
        <circle cx="${x - r * 0.1}" cy="${y}" r="${r * 0.55}" fill="${TRAZO}"/><circle cx="${x - r * 0.4}" cy="${y - r * 0.35}" r="${r * 0.22}" fill="#fff"/>`;

// Cuervo: posado, con el pico largo y las plumas negras de reflejo azul.
function cuervo(id, c, triste) {
    const negro = c("#20242f");
    const pico = c("#3a3d48");
    const brillo = c("#5b78c4");
    return `<defs>${mate(`${id}-n`, negro, 0.32, 0.55)}${mate(`${id}-a`, oscurecer(negro, 0.1), 0.38, 0.5)}${plumas(`${id}-pl`, brillo)}
            ${mate(`${id}-pi`, pico, 0.45, 0.5)}</defs>
        ${sombra(13)}
        <g class="mascota-cuerpo">
            <!-- patas -->
            <path d="M-1 8 L-3 16 M4 8 L5 16 M-6 16.4 L-1 16 L1 16.6 M2 16.4 L6 16 L9 16.6" fill="none" stroke="${c("#2a2a30")}" stroke-width="1.2" stroke-linecap="round"/>
            <!-- cola en abanico -->
            <path d="M8 1 L26 8 L27 11 L24 12.6 L8 7 Z" fill="url(#${id}-a)" ${linea()}/>
            <path d="M10 3 L25 9.4 M9 5.4 L24 11.4" fill="none" stroke="${brillo}" stroke-width=".4" opacity=".5"/>
            <!-- cuerpo -->
            <path d="M-11 -7 C-7 -13 7 -11 13 -2 C17 4 11 10 2 10 C-6 10 -13 4 -11 -7 Z" fill="url(#${id}-n)" ${linea(0.9)}/>
            <path d="M-11 -7 C-7 -13 7 -11 13 -2 C17 4 11 10 2 10 C-6 10 -13 4 -11 -7 Z" fill="url(#${id}-pl)" opacity=".45"/>
            <!-- ala plegada, con sus plumas largas -->
            <g class="ala-mascota">
                <path d="M-4 -5 C3 -10 13 -6 21 5 C12 6 2 5 -3 1 Z" fill="url(#${id}-a)" ${linea()}/>
                <path d="M2 -4 C8 -2 13 1 19 4 M0 -1 C6 1 11 3 16 5 M-2 1 C3 3 8 4 12 5" fill="none" stroke="${brillo}" stroke-width=".45" opacity=".6"/>
            </g>
            <!-- cuello y cabeza -->
            <path d="M-15 -9 C-17 -16 -12 -20 -7 -19 C-3 -18 -2 -14 -4 -9 C-6 -6 -12 -5 -15 -9 Z" fill="url(#${id}-n)" ${linea(0.9)}/>
            <path d="M-13 -6 C-12 -3 -8 -2 -6 -4" fill="none" stroke="${brillo}" stroke-width=".5" opacity=".6"/>
            <!-- pico -->
            <path d="M-15 -15 C-20 -16 -26 -14 -29 -11.4 C-25 -11.6 -20 -11.4 -15 -11 Z" fill="url(#${id}-pi)" ${linea(0.7)}/>
            <path d="M-15 -12.6 L-27 -11.8" stroke="${TRAZO}" stroke-width=".5"/>
            ${ojoDeAve(-11.6, -15.2, 1.5, triste ? "#7a7888" : "#c9d2e8")}
            <path d="M-12 -18.4 Q-8 -20 -5 -17" fill="none" stroke="#fff" stroke-width=".7" opacity=".25"/>
        </g>`;
}

// Búho: erguido, con penachos, el disco de la cara claro y ojos grandes de miel.
function buho(id, c, triste) {
    const pluma = c("#7a5a3a");
    const claro = c("#e8d8b4");
    const ojo = triste ? "#8a8798" : "#ffb020";
    return `<defs>${mate(`${id}-p`, pluma, 0.3, 0.55)}${mate(`${id}-cl`, claro, 0.25, 0.35)}${plumas(`${id}-pl`, oscurecer(pluma, 0.5))}
            ${halo(`${id}-o`, "#ffb020", 0.7)}</defs>
        ${sombra(12)}
        <g class="mascota-cuerpo">
            <!-- cuerpo -->
            <path d="M-12 -2 C-13 -12 -7 -15 0 -15 C7 -15 13 -12 12 -2 C12 8 7 15 0 15.4 C-7 15 -12 8 -12 -2 Z" fill="url(#${id}-p)" ${linea(0.9)}/>
            <!-- pecho claro, con sus marcas en "v" -->
            <path d="M-7 -4 C-7 -8 7 -8 7 -4 C7 6 4 12 0 13 C-4 12 -7 6 -7 -4 Z" fill="url(#${id}-cl)"/>
            <path d="M-7 -4 C-7 -8 7 -8 7 -4 C7 6 4 12 0 13 C-4 12 -7 6 -7 -4 Z" fill="url(#${id}-pl)" opacity=".7"/>
            <!-- alas a los lados -->
            <g class="ala-mascota">
                <path d="M7 -8 C14 -6 15 4 11 13 C9 9 7 2 7 -8 Z" fill="${oscurecer(pluma, 0.25)}" ${linea(0.7)}/>
                <path d="M9 -4 L12 4 M8.6 1 L11 9" stroke="${claro}" stroke-width=".5" opacity=".6"/>
            </g>
            <path d="M-7 -8 C-14 -6 -15 4 -11 13 C-9 9 -7 2 -7 -8 Z" fill="${oscurecer(pluma, 0.15)}" ${linea(0.7)}/>
            <!-- garras sobre el suelo -->
            <path d="M-4 15 l-1.4 1.6 M-2.6 15.4 l-.4 1.6 M2.6 15.4 l.4 1.6 M4 15 l1.4 1.6" stroke="${c("#d8bf8a")}" stroke-width="1.2" stroke-linecap="round"/>
            <!-- cabeza, penachos y el disco de la cara -->
            <path d="M-10 -24 L-6 -19 L-11 -18 Z M8 -24 L4 -19 L9 -18 Z" fill="url(#${id}-p)" ${linea(0.7)}/>
            <ellipse cx="-1" cy="-16" rx="11.6" ry="9" fill="url(#${id}-p)" ${linea(0.9)}/>
            <circle cx="-5.4" cy="-16" r="5" fill="url(#${id}-cl)" ${linea(0.5)}/>
            <circle cx="3.4" cy="-16" r="5" fill="url(#${id}-cl)" ${linea(0.5)}/>
            ${triste ? "" : `<circle cx="-5.4" cy="-16" r="5" fill="url(#${id}-o)" opacity=".5"/><circle cx="3.4" cy="-16" r="5" fill="url(#${id}-o)" opacity=".5"/>`}
            ${ojoDeAve(-5.4, -16, 3, ojo)}${ojoDeAve(3.4, -16, 3, ojo)}
            <path d="M-2.4 -13.4 L-1 -9.6 L0.4 -13.4 Z" fill="${c("#3a2a1a")}" ${linea(0.4)}/>
            <path d="M-10 -21 Q-5 -24 0 -22.4" fill="none" stroke="#fff" stroke-width=".7" opacity=".25"/>
        </g>`;
}

// Basilisco: un lagarto con corona de escamas doradas y la mirada encendida.
function basilisco(id, c, triste) {
    const piel = c("#2f6a3e");
    const oro = c("#e0b23c");
    const ojo = triste ? "#8a8798" : "#e6ff5a";
    return `<defs>${mate(`${id}-p`, piel, 0.32, 0.6)}${escamas(`${id}-e`, oscurecer(piel, 0.6))}${mate(`${id}-o`, oro, 0.45, 0.5)}
            ${mate(`${id}-v`, c("#c8c08a"), 0.3, 0.45)}${halo(`${id}-g`, "#e6ff5a", 0.8)}</defs>
        ${sombra(20)}
        <g class="mascota-cuerpo">
            <!-- cola enroscada -->
            <path d="M8 6 C20 2 32 4 32 11 C32 16 24 17 20 14 C24 14 27 12 26 10 C24 8 16 10 8 13 Z" fill="url(#${id}-p)" ${linea(0.8)}/>
            <path d="M8 6 C20 2 32 4 32 11 C32 16 24 17 20 14 C24 14 27 12 26 10 C24 8 16 10 8 13 Z" fill="url(#${id}-e)" opacity=".5"/>
            <!-- patas de atrás -->
            <path d="M6 9 C9 12 9 14 11 16.4 L6 16.4 C5 14 3 12 2 11 Z" fill="url(#${id}-p)" ${linea(0.7)}/>
            <!-- cuerpo -->
            <path d="M-16 4 C-14 -4 0 -7 11 -2 C16 1 14 10 6 12 L-10 12 C-16 11 -18 8 -16 4 Z" fill="url(#${id}-p)" ${linea(0.9)}/>
            <path d="M-16 4 C-14 -4 0 -7 11 -2 C16 1 14 10 6 12 L-10 12 C-16 11 -18 8 -16 4 Z" fill="url(#${id}-e)" opacity=".5"/>
            <path d="M-12 9 C-6 12 2 12 8 10" fill="none" stroke="url(#${id}-v)" stroke-width="2.4" stroke-linecap="round"/>
            <!-- púas doradas del lomo -->
            <path d="M-8 -4 l2 -5 l2 4 Z M-2 -5 l2 -5 l2 5 Z M4 -4 l2 -4 l2 4 Z M9 -2 l2 -3 l1.6 3.6 Z" fill="url(#${id}-o)" ${linea(0.45)}/>
            <!-- patas de adelante, con garras -->
            <path d="M-12 8 C-15 11 -15 14 -14 16.4 L-9 16.4 C-10 13 -9 11 -7 9 Z" fill="url(#${id}-p)" ${linea(0.7)}/>
            <path d="M-15 16.4 l-1.4 .4 M-13 16.6 l-1 .6 M-10.6 16.6 l-.6 .6 M7 16.4 l1.4 .4 M9.6 16.6 l1 .4" stroke="${c("#ece0bf")}" stroke-width="1.2" stroke-linecap="round"/>
            <!-- cabeza -->
            <path d="M-15 -1 C-18 -7 -26 -8 -32 -3 L-33 1 C-28 4 -21 6 -15 6 Z" fill="url(#${id}-p)" ${linea(0.9)}/>
            <path d="M-33 1 C-28 2.6 -22 3 -17 3" fill="none" stroke="${TRAZO}" stroke-width=".6"/>
            <!-- la corona: escamas doradas en punta -->
            <path d="M-26 -5.4 L-25 -14 L-22 -6.6 L-19.6 -15.4 L-17.6 -6 L-15 -12 L-13.6 -3 Z" fill="url(#${id}-o)" ${linea(0.6)}/>
            <circle cx="-19.6" cy="-9.4" r=".9" fill="${c("#c2283a")}" stroke="${TRAZO}" stroke-width=".3"/>
            <!-- el ojo que petrifica -->
            ${triste ? "" : `<circle cx="-24" cy="-3" r="4.4" fill="url(#${id}-g)"/>`}
            <ellipse cx="-24" cy="-3" rx="1.9" ry="1.5" fill="${ojo}" stroke="${TRAZO}" stroke-width=".4"/>
            <ellipse cx="-24" cy="-3" rx=".45" ry="1.3" fill="${TRAZO}"/>
            <circle cx="-31" cy="-1.6" r=".5" fill="${TRAZO}"/>
            <path d="M-34 1.4 l-3 -1.2 M-34 1.4 l-3 1.6" stroke="${c("#c2283a")}" stroke-width=".6" stroke-linecap="round"/>
            <path d="M-28 -6 Q-22 -8 -16 -5" fill="none" stroke="#fff" stroke-width=".7" opacity=".3"/>
        </g>`;
}

// Grifo: cabeza, alas y garras de águila; cuerpo, patas de atrás y cola de león.
function grifo(id, c, triste) {
    const leon = c("#b8894a");
    const blanco = c("#f2ead6");
    const ala = c("#8a6232");
    const oro = c("#e6b23c");
    const ojo = triste ? "#8a8798" : "#ffb020";
    return `<defs>${mate(`${id}-l`, leon, 0.3, 0.55)}${mate(`${id}-b`, blanco, 0.25, 0.4)}${mate(`${id}-a`, ala, 0.35, 0.55)}
            ${mate(`${id}-o`, oro, 0.45, 0.5)}${plumas(`${id}-pl`, oscurecer(blanco, 0.45))}</defs>
        ${sombra(19)}
        <g class="mascota-cuerpo">
            <!-- cola de león con su borla -->
            <path d="M9 10 C20 12 26 6 27 -2" fill="none" stroke="${TRAZO}" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M9 10 C20 12 26 6 27 -2" fill="none" stroke="${leon}" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M27 -2 C24 -4 25 -8 28 -9 C31 -7 31 -3 27 -2 Z" fill="${oscurecer(leon, 0.45)}" ${linea(0.5)}/>
            <!-- ala: plumas largas en capas -->
            <g class="ala-mascota">
                <path d="M2 -6 C4 -20 14 -30 26 -31 C22 -24 26 -18 30 -15 C24 -14 26 -8 28 -4 C20 -4 10 -2 2 -6 Z" fill="url(#${id}-a)" ${linea(0.8)}/>
                <path d="M6 -10 C12 -18 18 -24 25 -28 M7 -7 C14 -12 21 -15 28 -15 M8 -5 C15 -7 21 -6 27 -5" fill="none" stroke="${oscurecer(ala, 0.5)}" stroke-width=".7"/>
                <path d="M4 -8 C7 -17 13 -24 20 -27" fill="none" stroke="${aclarar(ala, 0.4)}" stroke-width=".6" opacity=".7"/>
            </g>
            <!-- cuerpo de león, sentado -->
            <path d="M12 8 C14 -1 8 -6 0 -5 C-6 -5 -11 -1 -12 4 C-13 11 -8 16.4 0 16.4 L10 16.4 C14 15 14 11 12 8 Z" fill="url(#${id}-l)" ${linea(0.9)}/>
            <path d="M6 10 C8 13 9 15 10 16.4" fill="none" stroke="${oscurecer(leon, 0.45)}" stroke-width=".7"/>
            <!-- pecho de plumas blancas -->
            <path d="M-12 -4 C-8 -9 -2 -8 0 -2 C1 4 -2 9 -6 11 C-11 9 -14 3 -12 -4 Z" fill="url(#${id}-b)" ${linea(0.6)}/>
            <path d="M-12 -4 C-8 -9 -2 -8 0 -2 C1 4 -2 9 -6 11 C-11 9 -14 3 -12 -4 Z" fill="url(#${id}-pl)" opacity=".6"/>
            <!-- patas delanteras de águila -->
            <path d="M-8 8 L-9 16 M-3 8 L-3 16" stroke="${TRAZO}" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M-8 8 L-9 16 M-3 8 L-3 16" stroke="${oro}" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M-12 16.6 L-9 16 L-7 16.8 M-6 16.6 L-3 16 L-1 16.8" fill="none" stroke="${c("#ece0bf")}" stroke-width="1.1" stroke-linecap="round"/>
            <!-- cabeza de águila -->
            <path d="M-6 -12 C-6 -20 -12 -24 -17 -22 C-21 -20 -21 -15 -18 -12 C-15 -9 -9 -8 -6 -12 Z" fill="url(#${id}-b)" ${linea(0.9)}/>
            <path d="M-6 -12 C-6 -20 -12 -24 -17 -22 C-21 -20 -21 -15 -18 -12 C-15 -9 -9 -8 -6 -12 Z" fill="url(#${id}-pl)" opacity=".5"/>
            <path d="M-8 -21 L-4 -26 L-5 -19 Z M-10 -22.6 L-8 -28 L-6.6 -21.6 Z" fill="url(#${id}-b)" ${linea(0.5)}/>
            <!-- pico ganchudo -->
            <path d="M-19 -19 C-24 -19 -27 -16 -26 -12 C-25 -14 -23 -15 -20 -15 Z" fill="url(#${id}-o)" ${linea(0.7)}/>
            <path d="M-20 -15.4 C-22 -14.6 -23 -13.6 -24 -12.6" fill="none" stroke="${TRAZO}" stroke-width=".5"/>
            <path d="M-17 -20.6 L-12.6 -19.6" stroke="${TRAZO}" stroke-width="1" stroke-linecap="round"/>
            ${ojoDeAve(-15, -18.4, 1.4, ojo)}
            <path d="M-16 -22 Q-12 -24 -8 -21" fill="none" stroke="#fff" stroke-width=".7" opacity=".35"/>
        </g>`;
}

// Fénix: un ave de fuego, con las alas abiertas y la cola de llamas.
function fenix(id, c, triste) {
    const rojo = c("#d23a12");
    const naranja = c("#ff8a1f");
    const oro = c("#ffd23c");
    return `<defs>${mate(`${id}-r`, rojo, 0.35, 0.55)}${mate(`${id}-n`, naranja, 0.4, 0.5)}${mate(`${id}-o`, oro, 0.5, 0.45)}
            ${halo(`${id}-l`, "#ff8a1f", 0.55)}${plumas(`${id}-pl`, oscurecer(rojo, 0.5))}</defs>
        ${sombra(14)}
        ${triste ? "" : `<circle class="orbe" cx="0" cy="-6" r="30" fill="url(#${id}-l)"/>`}
        <g class="mascota-cuerpo">
            <!-- cola: plumas largas como llamas -->
            <path d="M6 4 C14 8 22 14 34 13 C26 16 20 17 12 13 C18 18 24 22 30 22 C20 24 12 19 6 12 Z" fill="url(#${id}-n)" ${linea(0.7)}/>
            <path d="M8 6 C16 10 22 12 30 13 M8 9 C14 14 20 18 26 20" fill="none" stroke="${oro}" stroke-width=".7" opacity=".8"/>
            <!-- ala de atrás -->
            <path d="M0 -8 C6 -22 18 -30 30 -28 C24 -22 28 -18 32 -16 C24 -14 26 -10 28 -6 C18 -6 8 -4 0 -8 Z" fill="url(#${id}-r)" ${linea(0.7)} opacity=".9"/>
            <!-- ala de adelante -->
            <g class="ala-mascota">
                <path d="M-2 -6 C2 -18 10 -26 20 -30 C17 -22 21 -19 24 -16 C17 -14 19 -10 21 -6 C12 -5 4 -3 -2 -6 Z" fill="url(#${id}-n)" ${linea(0.8)}/>
                <path d="M2 -8 C7 -15 12 -21 18 -26 M3 -6 C9 -10 15 -13 22 -15 M4 -5 C10 -6 15 -6 20 -6" fill="none" stroke="${oro}" stroke-width=".7" opacity=".85"/>
            </g>
            <!-- cuerpo -->
            <path d="M-12 -4 C-10 -10 0 -10 6 -4 C10 2 8 10 0 12 C-7 13 -13 7 -12 -4 Z" fill="url(#${id}-r)" ${linea(0.9)}/>
            <path d="M-12 -4 C-10 -10 0 -10 6 -4 C10 2 8 10 0 12 C-7 13 -13 7 -12 -4 Z" fill="url(#${id}-pl)" opacity=".5"/>
            <path d="M-10 -2 C-8 4 -4 8 0 9" fill="none" stroke="${oro}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
            <!-- patas -->
            <path d="M-4 11 L-5 16 M1 11 L2 16 M-8 16.4 L-5 16 L-3 16.6 M-1 16.4 L2 16 L4 16.6" fill="none" stroke="${c("#8a3a12")}" stroke-width="1.1" stroke-linecap="round"/>
            <!-- la cresta: tres plumas de fuego que salen hacia atrás -->
            <path d="M-17 -24 C-15 -29 -10 -30 -7 -35 C-6 -30 -9 -26 -13 -23 Z" fill="url(#${id}-n)" ${linea(0.6)}/>
            <path d="M-15 -23 C-11 -26 -6 -26 -2 -30 C-2 -25 -6 -23 -11 -21 Z" fill="url(#${id}-o)" ${linea(0.6)}/>
            <path d="M-19 -24 C-19 -29 -16 -32 -16 -37 C-13 -33 -14 -28 -16 -24 Z" fill="url(#${id}-o)" ${linea(0.6)}/>
            <!-- cuello largo y cabeza dorada -->
            <path d="M-11 -5 C-14 -10 -14 -16 -15 -20 C-16 -24 -20 -26 -23 -24 C-26 -22 -25 -18 -22 -17 C-19 -15 -19 -9 -16 -3 Z" fill="url(#${id}-n)" ${linea(0.9)}/>
            <path d="M-13 -6 C-15 -11 -15 -15 -16 -19" fill="none" stroke="${oro}" stroke-width=".8" opacity=".8"/>
            <!-- pico -->
            <path d="M-24 -22 C-27 -22 -30 -21 -32 -19 C-29 -19.6 -26.6 -19.4 -24 -18.6 Z" fill="url(#${id}-o)" ${linea(0.6)}/>
            ${ojoDeAve(-20.6, -21.6, 1.3, triste ? "#7a7888" : "#fff3a0")}
            <path d="M-23 -25 Q-19 -26.6 -16 -24" fill="none" stroke="#fff" stroke-width=".6" opacity=".4"/>
            <!-- chispas -->
            ${triste ? "" : `<circle class="orbe" cx="-26" cy="-26" r=".9" fill="${oro}"/><circle class="orbe" cx="14" cy="-32" r=".8" fill="${oro}"/><circle class="orbe" cx="34" cy="6" r=".9" fill="${oro}"/>`}
        </g>`;
}

const ESPECIES = { cuervo, buho, basilisco, grifo, fenix };

// La cría de una especie que se adopta: la adulta en pequeño, apoyada en el mismo suelo.
const enPequeno = (dibujo) => `<g transform="translate(0 16) scale(.7) translate(0 -16)">${dibujo}</g>`;

export function cuerpoMascota(m) {
    const id = nuevoId("m");
    const especie = HUEVOS[m.especie] ? m.especie : "dragon";
    // Triste = colores apagados (se mezclan con gris).
    const c = (color) => (m.triste ? mezclar(color, "#565266", 0.6) : color);
    let dibujo;
    if (m.etapa.clave === "huevo") dibujo = huevo(id, HUEVOS[especie], c, m.triste);
    else if (COLORES_DRAGON[especie]) dibujo = dragon(id, m, c, COLORES_DRAGON[especie]);
    else {
        const adulta = ESPECIES[especie](id, c, m.triste);
        dibujo = m.etapa.clave === "adulto" ? adulta : enPequeno(adulta);
    }
    return `<g class="mascota mascota-${especie} ${m.triste ? "triste" : ""}">${dibujo}</g>`;
}

// La mascota sola, en grande (para la pantalla Personaje y la Tienda).
export function dibujarMascota(m) {
    return `<svg class="avatar-svg" viewBox="-36 -36 72 56" role="img" aria-label="Mascota: ${m.etapa.nombre}"
                 xmlns="http://www.w3.org/2000/svg">${cuerpoMascota(m)}</svg>`;
}
