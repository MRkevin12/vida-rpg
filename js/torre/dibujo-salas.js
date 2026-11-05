// dibujo-salas.js — Las salas de la Torre y de las mazmorras: el fondo de cada zona (192 × 128, se pixela sin contorno).
//
// Salió de dibujo-monstruos.js, que lo reexporta (`export *`): se sigue usando `dibujarSala(zona)` y `SALA` desde allí.

import { aclarar, oscurecer, nuevoId } from "../dibujo/dibujo-base.js";


// ===== Las salas: el fondo de cada zona =====
// Un dibujo de 192 × 128: arriba la pared (o el cielo) y abajo el piso de baldosas.
// También se convierte en pixel art, pero sin contorno.

export const SALA = { ancho: 192, alto: 128 };
const HORIZONTE = 56;     // dónde termina la pared y empieza el piso

// suelo: "baldosas" (si no se dice), "agua" o "tierra".
const COLORES_SALA = {
    //            pared: [arriba, abajo]      piso: [lejos, cerca]        líneas del piso    luz del lugar
    cripta:     { pared: ["#141a36", "#2a3660"], piso: ["#1a2240", "#46557f"], junta: "#10152c", luz: "#8fdcff" },
    biblioteca: { pared: ["#170f1c", "#33202c"], piso: ["#20151a", "#5c4232"], junta: "#140b10", luz: "#ffc670" },
    fragua:     { pared: ["#150a0c", "#381a15"], piso: ["#190e10", "#4c2b25"], junta: "#0c0506", luz: "#ff8a30" },
    cima:       { pared: ["#090d2a", "#3d3880"], piso: ["#20274a", "#5b648c"], junta: "#131931", luz: "#cdd8ff" },
    // v38: sobre la tormenta
    nubes:      { pared: ["#2a4a8a", "#9ab8e4"], piso: ["#b8c4dc", "#eef2fc"], junta: "#8a98b8", luz: "#ffffff" },
    corona:     { pared: ["#0e0814", "#3a2a1a"], piso: ["#241a0c", "#6a5020"], junta: "#160e06", luz: "#ffd27a" },
    // Mazmorra del Abismo (v29)
    cisterna:   { pared: ["#071014", "#16303a"], piso: ["#06141a", "#1d4250"], junta: "#3a7a86", luz: "#5ae0c8", suelo: "agua" },
    raices:     { pared: ["#0a0806", "#2a2016"], piso: ["#100c08", "#3a2c1e"], junta: "#0a0704", luz: "#a8ff6a", suelo: "tierra" },
    santuario:  { pared: ["#0c0610", "#2a1230"], piso: ["#120816", "#3a1c36"], junta: "#08040a", luz: "#ff4a6a" },
    abismo:     { pared: ["#020106", "#160822"], piso: ["#08040e", "#26122e"], junta: "#05020a", luz: "#c05aff", suelo: "tierra" },
    // Minas de la Codicia (v64)
    galerias:   { pared: ["#150f08", "#3a2a14"], piso: ["#1a120a", "#4a3a22"], junta: "#0c0804", luz: "#ffb04a", suelo: "tierra" },
    veta:       { pared: ["#1a1204", "#5a4010"], piso: ["#201606", "#6a4e14"], junta: "#120c02", luz: "#ffd23c" },
    tesoreria:  { pared: ["#1a1004", "#6a4a10"], piso: ["#2a1c06", "#8a6a1a"], junta: "#140c02", luz: "#fff0a0" },
    // La Fragua Profunda (v73)
    hornos:     { pared: ["#120a08", "#3a1c14"], piso: ["#1a0e0a", "#4a2a1e"], junta: "#0a0504", luz: "#ff7a2a", suelo: "tierra" },
    yunque:     { pared: ["#14100e", "#4a3a30"], piso: ["#1c1410", "#5a4636"], junta: "#0c0806", luz: "#ffb04a" },
    corazon:    { pared: ["#08102a", "#1a3a7a"], piso: ["#0c1636", "#244a8a"], junta: "#050a1c", luz: "#7ac8ff" },
    // Laberinto de los Ecos (v64)
    pasillos:   { pared: ["#10162a", "#3a4a7a"], piso: ["#161e38", "#4a5a8a"], junta: "#0c1226", luz: "#c8e0ff" },
    ecos:       { pared: ["#0a1020", "#24406a"], piso: ["#0e1830", "#2a4a7a"], junta: "#080e1c", luz: "#7affff" },
    silencio:   { pared: ["#06060e", "#1a1a30"], piso: ["#0a0a16", "#26263e"], junta: "#04040a", luz: "#e8e8ff", suelo: "tierra" },
};

// Números "al azar" que siempre salen iguales (para repartir libros y estrellas sin
// que cambien cada vez que se dibuja).
function sorteo(semilla) {
    let valor = semilla;
    return () => {
        valor = (valor * 1664525 + 1013904223) % 4294967296;
        return valor / 4294967296;
    };
}

// El piso: baldosas en perspectiva. Las líneas que se alejan apuntan todas al mismo punto
// lejano (el "punto de fuga") y las que cruzan están cada vez más juntas hacia el fondo.
// En el agua no hay baldosas: solo ondas, cada vez más juntas hacia el fondo. En la tierra,
// piedras sueltas.
function pisoDeSala(s, id) {
    const { ancho, alto } = SALA;
    let lineas = "";
    if (s.suelo === "agua") {
        const azar = sorteo(5);
        for (let k = 1; k <= 7; k++) {
            const y = HORIZONTE + (alto - HORIZONTE) * (k / 8) ** 1.6;
            for (let x = azar() * 30; x < ancho; x += 26 + azar() * 22) {
                const largo = 6 + k * 2 + azar() * 8;
                lineas += `M${x.toFixed(1)} ${y.toFixed(1)} q${(largo / 2).toFixed(1)} -1.6 ${largo.toFixed(1)} 0 `;
            }
        }
    } else if (s.suelo === "tierra") {
        const azar = sorteo(9);
        for (let k = 0; k < 22; k++) {
            const y = HORIZONTE + 4 + azar() * (alto - HORIZONTE - 6);
            const x = azar() * ancho;
            const r = 1 + ((y - HORIZONTE) / (alto - HORIZONTE)) * 3.4;
            lineas += `M${(x - r).toFixed(1)} ${y.toFixed(1)} q${r.toFixed(1)} ${(-r).toFixed(1)} ${(r * 2).toFixed(1)} 0 `;
        }
    } else {
        for (let k = 1; k <= 5; k++) {
            const y = (HORIZONTE + (alto - HORIZONTE) * (k / 6) ** 2).toFixed(1);
            lineas += `M0 ${y} L${ancho} ${y} `;
        }
        for (let x = -264; x <= ancho + 264; x += 40) lineas += `M96 18 L${x} ${alto} `;
    }
    return `<rect y="${HORIZONTE}" width="${ancho}" height="${alto - HORIZONTE}" fill="url(#${id}-piso)"/>
            <g clip-path="url(#${id}-recorte)">
                <path d="${lineas}" fill="none" stroke="${s.junta}" stroke-width="1"/>
                <ellipse cx="96" cy="102" rx="84" ry="22" fill="${s.luz}" opacity=".13"/>
            </g>`;
}

// Una columna, con su lado claro (la luz viene de la izquierda), base y capitel.
function columna(x, ancho, color) {
    return `<rect x="${x}" width="${ancho}" height="${HORIZONTE + 5}" fill="${color}"/>
            <rect x="${x}" width="${ancho * 0.28}" height="${HORIZONTE + 5}" fill="${aclarar(color, 0.22)}"/>
            <rect x="${x + ancho * 0.72}" width="${ancho * 0.28}" height="${HORIZONTE + 5}" fill="${oscurecer(color, 0.45)}"/>
            <rect x="${x - 2}" y="6" width="${ancho + 4}" height="4" fill="${aclarar(color, 0.12)}"/>
            <rect x="${x - 3}" y="${HORIZONTE + 1}" width="${ancho + 6}" height="5" fill="${oscurecer(color, 0.25)}"/>`;
}

// Una llama pequeña con su resplandor (antorchas y velas).
function llamita(x, y, color, tamano = 1) {
    return `<circle cx="${x}" cy="${y}" r="${13 * tamano}" fill="${color}" opacity=".16"/>
            <circle cx="${x}" cy="${y}" r="${6 * tamano}" fill="${color}" opacity=".28"/>
            <path d="M${x} ${y - 5 * tamano} Q${x + 3 * tamano} ${y} ${x} ${y + 3 * tamano} Q${x - 3 * tamano} ${y} ${x} ${y - 5 * tamano} Z" fill="${color}"/>
            <rect x="${x - 0.6}" y="${y - 1}" width="1.2" height="2.6" fill="#fff"/>`;
}

// Los ladrillos de una pared: filas de líneas, una corrida respecto de la otra.
function ladrillos(color, alto = 14, ancho = 24) {
    let d = "";
    for (let fila = 0, y = alto; y < HORIZONTE; fila++, y += alto) {
        d += `M0 ${y} L${SALA.ancho} ${y} `;
        for (let x = fila % 2 ? ancho / 2 : 0; x < SALA.ancho; x += ancho) d += `M${x} ${y - alto} L${x} ${y} `;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1"/>`;
}

const PAREDES = {
    // Cripta: muros de piedra, nichos oscuros y antorchas de fuego azul.
    cripta(s) {
        const nicho = (x) => `<path d="M${x - 10} ${HORIZONTE} L${x - 10} 30 Q${x} 14 ${x + 10} 30 L${x + 10} ${HORIZONTE} Z" fill="#090c1e"/>
                              <ellipse cx="${x}" cy="${HORIZONTE - 2}" rx="8" ry="4" fill="${s.luz}" opacity=".18"/>`;
        return `${ladrillos(oscurecer(s.pared[1], 0.55))}
                ${nicho(48)}${nicho(96)}${nicho(144)}
                ${columna(14, 13, "#2b3558")}${columna(66, 11, "#2b3558")}${columna(115, 11, "#2b3558")}${columna(165, 13, "#2b3558")}
                <rect x="70.4" y="30" width="2.2" height="9" fill="#4a3a2a"/><rect x="119.4" y="30" width="2.2" height="9" fill="#4a3a2a"/>
                ${llamita(71.5, 26, s.luz)}${llamita(120.5, 26, s.luz)}`;
    },

    // Biblioteca: estantes llenos de libros, una ventana alta y una alfombra.
    biblioteca(s) {
        const azar = sorteo(7);
        const lomos = ["#7a2a2a", "#2a4a7a", "#2a6a4a", "#8a6a2a", "#5a2a6a", "#484e60", "#8a3a1a", "#a08a60"];
        const estante = (x1, x2) => {
            let libros = "";
            for (const base of [19, 36, 53]) {
                for (let x = x1 + 2; x < x2 - 4;) {
                    const ancho = 2 + Math.floor(azar() * 3);
                    const alto = 9 + Math.floor(azar() * 5);
                    libros += `<rect x="${x}" y="${base - alto}" width="${ancho}" height="${alto}" fill="${lomos[Math.floor(azar() * lomos.length)]}"/>`;
                    x += ancho + (azar() < 0.15 ? 2 : 0.6);
                }
                libros += `<rect x="${x1}" y="${base}" width="${x2 - x1}" height="2" fill="#4a2e1c"/>`;
            }
            return `<rect x="${x1}" y="2" width="${x2 - x1}" height="${HORIZONTE - 2}" fill="#1a0f0c"/>${libros}
                    <rect x="${x1 - 2}" width="2.6" height="${HORIZONTE}" fill="#5a3a22"/><rect x="${x2 - 0.6}" width="2.6" height="${HORIZONTE}" fill="#3a2416"/>`;
        };
        return `${estante(4, 78)}${estante(114, 188)}
                <path d="M84 ${HORIZONTE} L84 20 Q96 2 108 20 L108 ${HORIZONTE} Z" fill="#3a3c8a"/>
                <path d="M86 ${HORIZONTE} L86 21 Q96 6 106 21 L106 ${HORIZONTE} Z" fill="#6a68c0"/>
                <circle cx="100" cy="20" r="4" fill="#e8ecff"/>
                <path d="M96 6 L96 ${HORIZONTE} M86 30 L106 30 M86 42 L106 42" stroke="#1a1020" stroke-width="1.4"/>
                <rect x="80.4" y="36" width="1.6" height="16" fill="#8a6a2a"/><rect x="110" y="36" width="1.6" height="16" fill="#8a6a2a"/>
                ${llamita(81.2, 33, s.luz, 0.7)}${llamita(110.8, 33, s.luz, 0.7)}`;
    },

    // Fragua: un horno encendido al fondo, tuberías y cadenas.
    fragua(s) {
        const cadena = (x, largo) => `<path d="M${x} 0 L${x} ${largo}" stroke="#6a6a72" stroke-width="1.6" stroke-dasharray="2 1.4"/>
                                      <path d="M${x - 2} ${largo} q2 4 4 0" fill="none" stroke="#8a8a92" stroke-width="1.2"/>`;
        return `${ladrillos(oscurecer(s.pared[1], 0.6), 10, 20)}
                <circle cx="96" cy="42" r="44" fill="${s.luz}" opacity=".16"/>
                <path d="M68 ${HORIZONTE} L68 26 Q96 2 124 26 L124 ${HORIZONTE} Z" fill="#0c0506"/>
                <path d="M73 ${HORIZONTE} L73 28 Q96 9 119 28 L119 ${HORIZONTE} Z" fill="#e2400f"/>
                <path d="M79 ${HORIZONTE} L79 33 Q96 18 113 33 L113 ${HORIZONTE} Z" fill="#ff9a1f"/>
                <path d="M86 ${HORIZONTE} L86 40 Q96 30 106 40 L106 ${HORIZONTE} Z" fill="#ffe45a"/>
                <path d="M80 26 L80 ${HORIZONTE} M88 20 L88 ${HORIZONTE} M96 18 L96 ${HORIZONTE} M104 20 L104 ${HORIZONTE} M112 26 L112 ${HORIZONTE}" stroke="#0c0506" stroke-width="1.8"/>
                <rect y="7" width="${SALA.ancho}" height="4" fill="#4a4048"/><rect y="7" width="${SALA.ancho}" height="1.2" fill="#7a707a"/>
                <path d="M24 5 l0 8 M60 5 l0 8 M132 5 l0 8 M168 5 l0 8" stroke="#2a2228" stroke-width="2.4"/>
                ${cadena(20, 30)}${cadena(40, 22)}${cadena(150, 26)}${cadena(172, 34)}`;
    },

    // Cima: sin pared. El cielo de noche, la luna, nubes de tormenta y las almenas.
    cima() {
        const azar = sorteo(11);
        let estrellas = "";
        for (let i = 0; i < 34; i++) estrellas += `<rect x="${Math.floor(azar() * 190)}" y="${Math.floor(azar() * 36)}" width="1" height="1" fill="#fff" opacity="${(0.5 + azar() * 0.5).toFixed(2)}"/>`;
        let almenas = "";
        for (let x = -4; x < SALA.ancho; x += 18) almenas += `<rect x="${x}" y="${HORIZONTE - 11}" width="11" height="12" fill="#39406a"/><rect x="${x}" y="${HORIZONTE - 11}" width="11" height="2" fill="#5a6290"/>`;
        return `${estrellas}
                <circle cx="150" cy="17" r="15" fill="#cdd8ff" opacity=".14"/><circle cx="150" cy="17" r="9" fill="#e8ecff"/>
                <circle cx="147" cy="15" r="2" fill="#bcc4e6"/><circle cx="153" cy="20" r="1.4" fill="#bcc4e6"/>
                <path d="M0 44 L24 32 L40 42 L62 28 L84 44 L110 34 L134 46 L160 36 L192 46 L192 ${HORIZONTE} L0 ${HORIZONTE} Z" fill="#141838"/>
                <ellipse cx="34" cy="8" rx="34" ry="8" fill="#1a1f4a"/><ellipse cx="68" cy="5" rx="26" ry="6" fill="#1a1f4a"/>
                <ellipse cx="20" cy="13" rx="20" ry="5" fill="#252b60"/><ellipse cx="176" cy="4" rx="24" ry="6" fill="#1a1f4a"/>
                <path d="M44 12 l-5 10 l4 0 l-6 12 l10 -15 l-4 0 l4 -7 Z" fill="#fff7a0"/>
                <rect y="${HORIZONTE - 3}" width="${SALA.ancho}" height="5" fill="#2c3258"/>${almenas}`;
    },
};

// Las paredes de la Mazmorra del Abismo (v29).
Object.assign(PAREDES, {
    // Cisternas: bóvedas de piedra medio hundidas, cadenas y agua que gotea.
    cisterna(s) {
        const boveda = (x, ancho) => `<path d="M${x} ${HORIZONTE} L${x} 26 Q${x + ancho / 2} 2 ${x + ancho} 26 L${x + ancho} ${HORIZONTE} Z" fill="#03080a"/>
                                       <path d="M${x - 3} 27 Q${x + ancho / 2} -2 ${x + ancho + 3} 27" fill="none" stroke="#2a4a52" stroke-width="3"/>`;
        const gota = (x, y) => `<rect x="${x}" y="${y}" width="1" height="5" fill="${s.luz}" opacity=".5"/>`;
        return `${ladrillos(oscurecer(s.pared[1], 0.55), 12, 22)}
                ${boveda(18, 40)}${boveda(76, 40)}${boveda(134, 40)}
                ${columna(4, 10, "#1e343c")}${columna(62, 10, "#1e343c")}${columna(120, 10, "#1e343c")}${columna(178, 10, "#1e343c")}
                <ellipse cx="96" cy="${HORIZONTE - 4}" rx="70" ry="6" fill="${s.luz}" opacity=".08"/>
                <path d="M38 0 L38 18 M154 0 L154 22" stroke="#4a5a5e" stroke-width="1.6" stroke-dasharray="2 1.4"/>
                ${gota(40, 30)}${gota(98, 22)}${gota(150, 36)}${gota(70, 44)}
                <path d="M0 ${HORIZONTE - 6} L${SALA.ancho} ${HORIZONTE - 6}" stroke="#2a5058" stroke-width="1.2"/>`;
    },

    // Bosque de raíces: tierra, raíces que cuelgan del techo y hongos que brillan.
    raices(s) {
        const azar = sorteo(13);
        let raices = "";
        for (let i = 0; i < 14; i++) {
            const x = 6 + i * 13.4 + azar() * 6;
            const largo = 12 + azar() * 30;
            raices += `<path d="M${x.toFixed(1)} 0 C${(x - 4).toFixed(1)} ${(largo * 0.4).toFixed(1)} ${(x + 5).toFixed(1)} ${(largo * 0.7).toFixed(1)} ${(x + 1).toFixed(1)} ${largo.toFixed(1)}"
                        fill="none" stroke="${i % 2 ? "#4a3624" : "#3a2a1a"}" stroke-width="${(1.2 + azar() * 2).toFixed(1)}" stroke-linecap="round"/>`;
        }
        let hongos = "";
        for (const [x, y, r] of [[22, 50, 3], [30, 52, 2], [70, 48, 2.6], [128, 50, 3.4], [138, 53, 2], [176, 49, 2.6]]) {
            hongos += `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="${s.luz}" opacity=".12"/>
                       <path d="M${x - r} ${y} Q${x} ${y - r * 1.4} ${x + r} ${y} Z" fill="${s.luz}"/><rect x="${x - 0.5}" y="${y}" width="1" height="${r}" fill="#d8cdb0"/>`;
        }
        return `<path d="M0 30 C20 26 40 34 60 28 C80 22 100 32 120 26 C140 20 160 30 192 24 L192 ${HORIZONTE} L0 ${HORIZONTE} Z" fill="#1a140c"/>
                <path d="M0 42 C30 38 50 46 80 40 C110 34 140 44 192 38 L192 ${HORIZONTE} L0 ${HORIZONTE} Z" fill="#241a10"/>
                ${raices}${hongos}`;
    },

    // Santuario: columnas negras, velas, estandartes y un altar con el símbolo de las Sombras.
    santuario(s) {
        const vela = (x, alto) => `<rect x="${x - 1.4}" y="${HORIZONTE - alto}" width="2.8" height="${alto}" fill="#1a1418"/>${llamita(x, HORIZONTE - alto - 3, s.luz, 0.6)}`;
        const estandarte = (x) => `<path d="M${x} 6 L${x + 14} 6 L${x + 14} 36 L${x + 7} 30 L${x} 36 Z" fill="#4a0f20"/>
                                   <circle cx="${x + 7}" cy="18" r="3.6" fill="none" stroke="#c8283a" stroke-width="1.2"/>`;
        return `${ladrillos(oscurecer(s.pared[1], 0.6), 14, 28)}
                ${columna(10, 12, "#1c1020")}${columna(170, 12, "#1c1020")}
                ${estandarte(36)}${estandarte(142)}
                <circle cx="96" cy="22" r="20" fill="${s.luz}" opacity=".1"/>
                <circle cx="96" cy="22" r="12" fill="none" stroke="#c8283a" stroke-width="2"/>
                <path d="M96 12 L104 28 L88 28 Z" fill="none" stroke="#c8283a" stroke-width="1.4"/>
                <circle cx="96" cy="23" r="2.4" fill="${s.luz}"/>
                <path d="M74 ${HORIZONTE} L76 44 L116 44 L118 ${HORIZONTE} Z" fill="#160a18"/><rect x="74" y="42" width="44" height="3" fill="#3a1c36"/>
                ${vela(80, 8)}${vela(112, 8)}${vela(60, 12)}${vela(132, 12)}${vela(28, 6)}${vela(164, 6)}`;
    },

    // Abismo: sin paredes. Oscuridad, rocas que flotan y, al fondo, un remolino que mira.
    abismo(s) {
        const azar = sorteo(17);
        let motas = "";
        for (let i = 0; i < 30; i++) motas += `<rect x="${Math.floor(azar() * 190)}" y="${Math.floor(azar() * 52)}" width="1" height="1" fill="${s.luz}" opacity="${(0.3 + azar() * 0.6).toFixed(2)}"/>`;
        const roca = (x, y, ancho) => `<path d="M${x} ${y} L${x + ancho} ${y - 2} L${x + ancho * 0.8} ${y + ancho * 0.5} L${x + ancho * 0.3} ${y + ancho * 0.6} Z" fill="#1c1024"/>
                                       <path d="M${x} ${y} L${x + ancho} ${y - 2}" stroke="#4a2a5a" stroke-width="1"/>`;
        return `${motas}
                <ellipse cx="96" cy="26" rx="46" ry="20" fill="${s.luz}" opacity=".08"/>
                <ellipse cx="96" cy="26" rx="30" ry="12" fill="none" stroke="#3a1a4a" stroke-width="3"/>
                <ellipse cx="96" cy="26" rx="18" ry="7" fill="none" stroke="#5a2a6a" stroke-width="2"/>
                <ellipse cx="96" cy="26" rx="7" ry="4" fill="#0a0410"/><ellipse cx="96" cy="26" rx="2" ry="3.4" fill="${s.luz}"/>
                ${roca(18, 14, 14)}${roca(150, 10, 18)}${roca(40, 40, 10)}${roca(160, 42, 12)}`;
    },
});

// Las paredes de la Torre sobre la tormenta (v38).
Object.assign(PAREDES, {
    // Puentes de nubes: cielo de día, el sol, nubes, un puente lejano con arcos y el mar de nubes.
    nubes() {
        const nube = (x, y, ancho, color) => `<ellipse cx="${x}" cy="${y}" rx="${ancho}" ry="${(ancho * 0.32).toFixed(1)}" fill="${color}"/>
            <ellipse cx="${(x - ancho * 0.35).toFixed(1)}" cy="${(y - ancho * 0.15).toFixed(1)}" rx="${(ancho * 0.45).toFixed(1)}" ry="${(ancho * 0.28).toFixed(1)}" fill="${color}"/>
            <ellipse cx="${(x + ancho * 0.3).toFixed(1)}" cy="${(y - ancho * 0.18).toFixed(1)}" rx="${(ancho * 0.4).toFixed(1)}" ry="${(ancho * 0.3).toFixed(1)}" fill="${color}"/>`;
        return `<circle cx="38" cy="16" r="16" fill="#fff8d0" opacity=".25"/><circle cx="38" cy="16" r="8" fill="#fff8e0"/>
                ${nube(150, 18, 26, "#e8eefc")}${nube(84, 30, 20, "#dce6f8")}${nube(20, 40, 18, "#f4f7ff")}
                <path d="M100 40 L192 34 L192 38 L100 44 Z" fill="#c8d0e4"/>
                <path d="M112 43.4 q6 -6 12 -0.8 M136 41.8 q6 -6 12 -0.8 M160 40.2 q6 -6 12 -0.8" fill="none" stroke="#8a96b4" stroke-width="1.2"/>
                <path d="M0 ${HORIZONTE} L0 46 C20 42 34 50 56 46 C78 42 92 50 116 47 C140 44 160 50 192 46 L192 ${HORIZONTE} Z" fill="#f0f4ff"/>
                <path d="M0 48 C20 44 34 52 56 48 M120 49 C140 46 160 51 192 48" fill="none" stroke="#c8d4ec" stroke-width="1.2"/>`;
    },

    // Corona de la Llama: noche estrellada entre columnas de oro y, al centro, el pedestal apagado.
    corona(s) {
        const azar = sorteo(23);
        let estrellas = "";
        for (let i = 0; i < 28; i++) estrellas += `<rect x="${Math.floor(azar() * 190)}" y="${Math.floor(azar() * 40)}" width="1" height="1" fill="#fff" opacity="${(0.4 + azar() * 0.6).toFixed(2)}"/>`;
        return `${estrellas}
                <path d="M6 10 Q96 -12 186 10" fill="none" stroke="#c8a040" stroke-width="3"/>
                ${columna(10, 12, "#8a6a20")}${columna(54, 10, "#8a6a20")}${columna(128, 10, "#8a6a20")}${columna(170, 12, "#8a6a20")}
                <circle cx="96" cy="34" r="22" fill="${s.luz}" opacity=".06"/>
                <path d="M84 ${HORIZONTE} L86 40 L106 40 L108 ${HORIZONTE} Z" fill="#3a2c18"/>
                <rect x="82" y="36" width="28" height="5" fill="#c8a040"/>
                <path d="M88 36 Q96 30 104 36 Z" fill="#2a2016"/>
                <path d="M96 30 q-2.4 -5 0.6 -9 q2 4 -0.6 9" fill="none" stroke="#6a6478" stroke-width="1.2"/>`;
    },
});

// Detalles que van sobre el piso de cada sala.
const SUELOS = {
    cripta: () => "",
    biblioteca: () => `<path d="M76 ${HORIZONTE} L116 ${HORIZONTE} L160 ${SALA.alto} L32 ${SALA.alto} Z" fill="#4a2260" opacity=".8"/>
                       <path d="M80 ${HORIZONTE} L48 ${SALA.alto} M112 ${HORIZONTE} L144 ${SALA.alto}" stroke="#c79a3a" stroke-width="1.2"/>`,
    fragua: (s) => `<path d="M10 120 l16 -9 l-5 -10 l18 -8 l-3 -9 M182 116 l-14 -8 l6 -10 l-16 -9 l2 -8 M70 126 l8 -8 l-3 -6" fill="none" stroke="${s.luz}" stroke-width="1.6" stroke-linejoin="round"/>
                    <path d="M10 120 l16 -9 l-5 -10 l18 -8 M182 116 l-14 -8 l6 -10 l-16 -9" fill="none" stroke="#ffe45a" stroke-width=".6" stroke-linejoin="round"/>`,
    cima: () => `<path d="M30 76 l20 0 M120 90 l30 0 M60 112 l34 0 M150 68 l16 0" stroke="#cdd8ff" stroke-width="1" opacity=".35"/>`,
    nubes: () => `<ellipse cx="20" cy="${HORIZONTE + 6}" rx="26" ry="5" fill="#ffffff" opacity=".75"/>
                  <ellipse cx="176" cy="${HORIZONTE + 8}" rx="24" ry="5" fill="#ffffff" opacity=".75"/>
                  <ellipse cx="96" cy="124" rx="70" ry="6" fill="#ffffff" opacity=".35"/>`,
    corona: () => `<ellipse cx="96" cy="96" rx="58" ry="16" fill="none" stroke="#c8a040" stroke-width="1.4" opacity=".7"/>
                   <ellipse cx="96" cy="96" rx="36" ry="10" fill="none" stroke="#c8a040" stroke-width="1" opacity=".5"/>`,
    cisterna: (s) => `<ellipse cx="62" cy="96" rx="12" ry="2.4" fill="none" stroke="${s.luz}" stroke-width=".8" opacity=".5"/>
                      <ellipse cx="160" cy="106" rx="16" ry="3" fill="none" stroke="${s.luz}" stroke-width=".8" opacity=".4"/>
                      <path d="M96 ${HORIZONTE} L84 128 L108 128 Z" fill="${s.luz}" opacity=".07"/>`,
    raices: (s) => `<path d="M0 70 C30 66 40 74 70 72 M120 80 C140 76 160 82 192 78" fill="none" stroke="#4a3624" stroke-width="2.4" stroke-linecap="round"/>
                    <circle cx="24" cy="104" r="2" fill="${s.luz}"/><circle cx="168" cy="96" r="2.4" fill="${s.luz}"/>`,
    santuario: () => `<path d="M80 ${HORIZONTE} L112 ${HORIZONTE} L150 ${SALA.alto} L42 ${SALA.alto} Z" fill="#4a0f20" opacity=".85"/>
                      <path d="M84 ${HORIZONTE} L56 ${SALA.alto} M108 ${HORIZONTE} L136 ${SALA.alto}" stroke="#c8283a" stroke-width="1.2"/>`,
    abismo: (s) => `<path d="M0 ${HORIZONTE + 2} L${SALA.ancho} ${HORIZONTE + 2}" stroke="${s.luz}" stroke-width="1" opacity=".4"/>
                    <path d="M20 128 l14 -20 l-6 -10 l12 -12 M172 128 l-10 -18 l8 -10 l-12 -14 M96 128 l4 -16 l-6 -8" fill="none" stroke="${s.luz}" stroke-width="1.4" stroke-linejoin="round" opacity=".75"/>`,
};

export function dibujarSala(zona) {
    const clave = COLORES_SALA[zona] ? zona : "cripta";
    const s = COLORES_SALA[clave];
    const id = nuevoId("sala");
    const { ancho, alto } = SALA;
    return `<svg viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="${id}-pared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.pared[0]}"/><stop offset="1" stop-color="${s.pared[1]}"/></linearGradient>
            <linearGradient id="${id}-piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.piso[0]}"/><stop offset="1" stop-color="${s.piso[1]}"/></linearGradient>
            <radialGradient id="${id}-borde" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#05030c" stop-opacity="0"/><stop offset="1" stop-color="#05030c" stop-opacity=".6"/></radialGradient>
            <clipPath id="${id}-recorte"><rect y="${HORIZONTE}" width="${ancho}" height="${alto - HORIZONTE}"/></clipPath>
        </defs>
        <rect width="${ancho}" height="${HORIZONTE}" fill="url(#${id}-pared)"/>
        ${PAREDES[clave](s)}
        ${pisoDeSala(s, id)}
        <g clip-path="url(#${id}-recorte)">${SUELOS[clave](s)}</g>
        <rect y="${HORIZONTE}" width="${ancho}" height="2" fill="#05030c" opacity=".45"/>
        <rect width="${ancho}" height="${alto}" fill="url(#${id}-borde)"/>
    </svg>`;
}

// (v64) Las salas de las mazmorras nuevas reutilizan las paredes y los suelos de otras (con sus propios colores).
Object.assign(PAREDES, {
    galerias: PAREDES.fragua, veta: PAREDES.fragua, tesoreria: PAREDES.corona,
    pasillos: PAREDES.cripta, ecos: PAREDES.biblioteca, silencio: PAREDES.abismo,
    hornos: PAREDES.fragua, yunque: PAREDES.fragua, corazon: PAREDES.fragua,   // (v73)
});
Object.assign(SUELOS, {
    galerias: SUELOS.fragua, veta: SUELOS.fragua, tesoreria: SUELOS.corona || SUELOS.fragua,
    pasillos: SUELOS.cripta || SUELOS.abismo, ecos: SUELOS.biblioteca || SUELOS.abismo, silencio: SUELOS.abismo,
    hornos: SUELOS.fragua, yunque: SUELOS.fragua, corazon: SUELOS.fragua,   // (v73)
});

// Las criaturas que tienen dibujo (las pruebas revisan que sean todas las del bestiario).
