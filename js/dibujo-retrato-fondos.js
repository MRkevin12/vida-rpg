// dibujo-retrato-fondos.js — Los fondos que puedes elegir para tu retrato de la cabecera (v189).
//
// El retrato es muy pequeño (32 × 32 puntos), así que cada fondo es simple: un degradado y dos o tres formas grandes.
// Se dibuja en el mismo espacio que el retrato: la ventana va de x = 75 a 125 y de y = 11 a 61 (ver dibujo.js, «vista»).
// El fondo se pinta de 60 a 140 de ancho y de 0 a 80 de alto, para que sobre un poco por todos lados.
//
// Para agregar un fondo: ponlo en FONDOS_RETRATO y escribe su dibujo en DIBUJOS (una función que devuelve texto SVG).
// Nada más: la lista de Ajustes y las pruebas lo toman de aquí.

export const FONDO_RETRATO_INICIAL = "clase";   // el de siempre: el color de tu clase con un halo

// id (lo que se guarda), nombre y un emoji para el botón.
export const FONDOS_RETRATO = [
    { id: "clase",      nombre: "Tu clase",      icono: "🛡️" },
    { id: "noche",      nombre: "Noche",         icono: "🌙" },
    { id: "atardecer",  nombre: "Atardecer",     icono: "🌅" },
    { id: "bosque",     nombre: "Bosque",        icono: "🌲" },
    { id: "oceano",     nombre: "Océano",        icono: "🌊" },
    { id: "volcan",     nombre: "Volcán",        icono: "🌋" },
    { id: "nieve",      nombre: "Montañas",      icono: "🏔️" },
    { id: "castillo",   nombre: "Castillo",      icono: "🏰" },
    { id: "cristal",    nombre: "Cristales",     icono: "💎" },
    { id: "galaxia",    nombre: "Galaxia",       icono: "🌌" },
    { id: "dorado",     nombre: "Dorado",        icono: "✨" },
    { id: "liso",       nombre: "Liso",          icono: "⬛" },
];

export const IDS_FONDO_RETRATO = FONDOS_RETRATO.map((f) => f.id);

// Un id que no existe (por ejemplo, de una copia vieja o dañada) cae en el fondo de siempre.
export function fondoValido(id) {
    return IDS_FONDO_RETRATO.includes(id) ? id : FONDO_RETRATO_INICIAL;
}

// Un degradado de arriba hacia abajo. «paradas» = [[posición 0–1, color], …]. «n» distingue un degradado de otro.
function vertical(base, paradas) {
    const pasos = paradas.map(([p, color]) => `<stop offset="${p}" stop-color="${color}"/>`).join("");
    return {
        defs: `<linearGradient id="${base}" x1="0" y1="0" x2="0" y2="1">${pasos}</linearGradient>`,
        relleno: `<rect x="60" y="0" width="80" height="80" fill="url(#${base})"/>`,
    };
}

// Estrellitas fijas (siempre en el mismo lugar, para que el retrato no cambie cada vez que se dibuja).
const ESTRELLAS = [[80, 17], [88, 14], [96, 20], [112, 15], [119, 22], [104, 12], [84, 26], [122, 31], [78, 34], [116, 40]];
function estrellas(color, cuantas = ESTRELLAS.length) {
    return ESTRELLAS.slice(0, cuantas).map(([x, y]) => `<rect x="${x}" y="${y}" width="1.6" height="1.6" fill="${color}"/>`).join("");
}

// Cada dibujo recibe: d (el avatar), p (la paleta, con p.id único) y oscurecer/m para colores de la clase.
const DIBUJOS = {
    // El de siempre: el color de tu clase, más oscuro, con el brillo de tu clase detrás de la cabeza.
    clase: (d, p, { oscurecer }) =>
        `<rect x="60" width="80" height="80" fill="${oscurecer(d.clase.oscuro, 0.5)}"/><circle cx="100" cy="40" r="36" fill="${p.m("gema-luz")}"/>`,

    noche: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#070a1f"], [0.6, "#1b1d54"], [1, "#3a2a78"]]);
        return `<defs>${g.defs}</defs>${g.relleno}${estrellas("#e9ecff")}
            <circle cx="115" cy="24" r="6.5" fill="#fff4c9"/><circle cx="117.5" cy="22.5" r="5.6" fill="#1b1d54"/>`;
    },

    atardecer: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#3b1b6b"], [0.45, "#c2410c"], [0.8, "#fbbf24"], [1, "#fde68a"]]);
        return `<defs>${g.defs}</defs>${g.relleno}
            <circle cx="100" cy="52" r="15" fill="#fff1b8" opacity=".9"/>
            <path d="M60 58 Q80 46 100 56 T140 52 V80 H60 Z" fill="#2a1346"/>
            <path d="M60 66 Q90 56 120 66 T140 64 V80 H60 Z" fill="#1a0b2e"/>`;
    },

    bosque: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#0d3b2e"], [0.7, "#14532d"], [1, "#052e16"]]);
        const pino = (x, alto, color) => `<path d="M${x} ${64 - alto} L${x - 7} 64 L${x + 7} 64 Z" fill="${color}"/>`;
        return `<defs>${g.defs}</defs>${g.relleno}
            ${pino(72, 40, "#0a2a1c")}${pino(128, 44, "#0a2a1c")}${pino(84, 30, "#0e3a26")}${pino(116, 34, "#0e3a26")}
            <rect x="60" y="62" width="80" height="18" fill="#04200f"/>
            <circle cx="90" cy="30" r="1.4" fill="#d9f99d"/><circle cx="110" cy="22" r="1.4" fill="#d9f99d"/><circle cx="82" cy="46" r="1.2" fill="#d9f99d"/><circle cx="120" cy="42" r="1.2" fill="#d9f99d"/>`;
    },

    oceano: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#0c4a6e"], [0.5, "#0e7490"], [1, "#083344"]]);
        const ola = (y, color) => `<path d="M60 ${y} Q68 ${y - 4} 76 ${y} T92 ${y} T108 ${y} T124 ${y} T140 ${y} V80 H60 Z" fill="${color}"/>`;
        return `<defs>${g.defs}</defs>${g.relleno}
            <circle cx="116" cy="22" r="5" fill="#cffafe" opacity=".85"/>
            ${ola(44, "#0e7490")}${ola(52, "#155e75")}${ola(60, "#164e63")}`;
    },

    volcan: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#1c0707"], [0.6, "#7c2d12"], [1, "#f97316"]]);
        return `<defs>${g.defs}</defs>${g.relleno}
            <path d="M60 64 L88 30 L96 30 L122 64 Z" fill="#2a0e0a"/>
            <path d="M88 30 L92 36 L96 30 Z" fill="#fb923c"/>
            <path d="M92 36 L90 50 L94 64 L96 50 Z" fill="#fb923c" opacity=".9"/>
            <path d="M60 64 Q100 56 140 64 V80 H60 Z" fill="#ea580c"/>
            <rect x="76" y="18" width="2" height="2" fill="#fdba74"/><rect x="108" y="24" width="2" height="2" fill="#fdba74"/><rect x="98" y="14" width="1.6" height="1.6" fill="#fed7aa"/>`;
    },

    nieve: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#1e3a5f"], [0.55, "#7dd3fc"], [1, "#e0f2fe"]]);
        return `<defs>${g.defs}</defs>${g.relleno}
            <path d="M60 62 L84 28 L108 62 Z" fill="#475569"/><path d="M84 28 L91 39 L84 36 L78 40 Z" fill="#f8fafc"/>
            <path d="M92 62 L118 34 L142 62 Z" fill="#64748b"/><path d="M118 34 L125 43 L118 41 L112 44 Z" fill="#f8fafc"/>
            <rect x="60" y="58" width="80" height="22" fill="#f1f5f9"/>
            ${estrellas("#ffffff", 5)}`;
    },

    castillo: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#2b2740"], [1, "#46425f"]]);
        const ladrillos = [];
        for (let fila = 0; fila < 8; fila++) {
            const corrido = fila % 2 ? 6 : 0;
            ladrillos.push(`<rect x="60" y="${fila * 8 + 7}" width="80" height="1" fill="#1d1a2e"/>`);
            for (let x = corrido; x < 80; x += 12) ladrillos.push(`<rect x="${60 + x}" y="${fila * 8}" width="1" height="8" fill="#1d1a2e"/>`);
        }
        return `<defs>${g.defs}<radialGradient id="${p.id}-rf2"><stop offset="0" stop-color="#fb923c" stop-opacity=".7"/><stop offset="1" stop-color="#fb923c" stop-opacity="0"/></radialGradient></defs>
            ${g.relleno}${ladrillos.join("")}
            <circle cx="80" cy="30" r="16" fill="url(#${p.id}-rf2)"/><circle cx="120" cy="30" r="16" fill="url(#${p.id}-rf2)"/>
            <rect x="79" y="32" width="2" height="6" fill="#4a2a12"/><path d="M80 24 Q77 30 80 32 Q83 30 80 24 Z" fill="#fdba74"/>
            <rect x="119" y="32" width="2" height="6" fill="#4a2a12"/><path d="M120 24 Q117 30 120 32 Q123 30 120 24 Z" fill="#fdba74"/>`;
    },

    cristal: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#1a1038"], [1, "#2e1a5e"]]);
        const cristal = (x, y, ancho, alto, color, claro) => `<path d="M${x} ${y} L${x + ancho / 2} ${y - alto} L${x + ancho} ${y} Z" fill="${color}"/><path d="M${x + ancho / 2} ${y - alto} L${x + ancho} ${y} L${x + ancho / 2} ${y} Z" fill="${claro}" opacity=".55"/>`;
        return `<defs>${g.defs}</defs>${g.relleno}
            ${cristal(66, 64, 12, 30, "#22d3ee", "#a5f3fc")}${cristal(78, 64, 10, 20, "#a78bfa", "#ddd6fe")}
            ${cristal(112, 64, 14, 34, "#a78bfa", "#ddd6fe")}${cristal(126, 64, 10, 22, "#22d3ee", "#a5f3fc")}
            <rect x="60" y="62" width="80" height="18" fill="#150b2e"/>
            ${estrellas("#c4b5fd", 4)}`;
    },

    galaxia: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#05020f"], [1, "#12082e"]]);
        return `<defs>${g.defs}<radialGradient id="${p.id}-rf2"><stop offset="0" stop-color="#e879f9" stop-opacity=".65"/><stop offset="1" stop-color="#e879f9" stop-opacity="0"/></radialGradient>
            <radialGradient id="${p.id}-rf3"><stop offset="0" stop-color="#22d3ee" stop-opacity=".5"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient></defs>
            ${g.relleno}
            <ellipse cx="86" cy="24" rx="26" ry="14" fill="url(#${p.id}-rf2)"/><ellipse cx="118" cy="46" rx="26" ry="16" fill="url(#${p.id}-rf3)"/>
            ${estrellas("#ffffff")}`;
    },

    dorado: (d, p) => {
        const g = vertical(`${p.id}-rf`, [[0, "#78350f"], [0.5, "#b45309"], [1, "#451a03"]]);
        const rayos = [];
        for (let i = 0; i < 8; i++) rayos.push(`<path d="M100 38 L${100 + 70 * Math.cos((i * Math.PI) / 4 - 0.12)} ${38 + 70 * Math.sin((i * Math.PI) / 4 - 0.12)} L${100 + 70 * Math.cos((i * Math.PI) / 4 + 0.12)} ${38 + 70 * Math.sin((i * Math.PI) / 4 + 0.12)} Z" fill="#fde68a" opacity=".22"/>`);
        return `<defs>${g.defs}<radialGradient id="${p.id}-rf2"><stop offset="0" stop-color="#fff3b0" stop-opacity=".9"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient></defs>
            ${g.relleno}${rayos.join("")}<circle cx="100" cy="38" r="26" fill="url(#${p.id}-rf2)"/>`;
    },

    liso: () => `<rect x="60" width="80" height="80" fill="#1a1530"/>`,
};

// El fondo del retrato: devuelve el texto SVG. Un id desconocido da el de siempre.
// «ayudas» trae oscurecer (de dibujo-base.js): se pasa desde dibujo.js para no importar dos veces.
export function fondoDeRetrato(id, d, p, ayudas) {
    return (DIBUJOS[fondoValido(id)] || DIBUJOS.clase)(d, p, ayudas);
}
