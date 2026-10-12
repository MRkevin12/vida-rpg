// dibujo.js — Dibuja el avatar y la mascota con SVG, en estilo serio.
//
// SVG es un formato de dibujo con formas (círculos, rectángulos, caminos)
// que el navegador pinta. Aquí armamos el avatar como un texto SVG,
// capa por capa, de atrás hacia adelante (lo último queda encima).
//
// El lienzo mide 200 × 200. El personaje es una figura adulta de pie,
// centrada en x = 100:
//   cabeza y 30–54 · hombros y 60 · cintura y 100 · pies y 180.
// Mano izquierda (77, 112) · mano derecha (123, 112).
//
// Las clases CSS (pj, aura, llama, orbe, mascota…) son las que animan.

import { APARIENCIA, APARIENCIA_INICIAL } from "./avatar.js";

const TRAZO = "#14101e";      // contorno oscuro
const ORO = "#d4a72c";
const ORO_OSCURO = "#8a6a12";
const ACERO = "#9ca3af";
const ACERO_OSCURO = "#4b5563";
const CUERO = "#4a3423";

let contador = 0; // cada dibujo usa ids distintos para sus degradados


// d = resultado de describirAvatar() (ver avatar.js)
// mini = true: solo cabeza y hombros, para la cabecera de la app
// batalla = true: sin fondo ni mascota, para pelear contra un jefe
// sinEfectos = true: además sin aura, fuego ni brillo (para los minijuegos)
export function dibujarAvatar(d, { mini = false, batalla = false, sinEfectos = false } = {}) {
    const id = `av${++contador}`;

    // Colores de piel y pelo según la apariencia elegida (d.tono se usa en todo el dibujo).
    const apariencia = { ...APARIENCIA_INICIAL, ...d.apariencia };
    const piel = APARIENCIA.piel[apariencia.piel] || APARIENCIA.piel.media;
    const pelo = APARIENCIA.pelo[apariencia.pelo] || APARIENCIA.pelo.castano;
    d = { ...d, apariencia, tono: { piel: piel.color, sombra: piel.sombra, pelo: pelo.color } };

    const capas = [
        batalla ? "" : fondo(d, id),
        d.etapa.clave === "leyenda" && !sinEfectos ? aura(id) : "",
        d.animo === "llamas" && !sinEfectos ? llamas(id) : "",
        d.animo === "feliz" && !sinEfectos ? resplandor(id) : "",
        mini ? "" : '<ellipse cx="100" cy="182" rx="27" ry="5" fill="#000" opacity=".45"/>',
        '<g class="pj">',
        espalda(d),
        piernas(d),
        torso(d),
        brazos(d),
        cabeza(d),
        "</g>",
        // Cansado o dormido: la escena se oscurece.
        d.animo === "dormido" && !batalla ? noche() : "",
        d.animo === "cansado" && !batalla ? '<rect width="200" height="200" fill="#0b0816" opacity=".3"/>' : "",
        mini || batalla ? "" : mascota(d.mascota),
    ];

    // El encuadre completo recorta un poco los bordes para que la figura se vea más grande.
    const vista = mini ? "78 18 44 44" : batalla ? "37 16 126 168" : "10 14 180 180";
    return `<svg class="avatar-svg animo-${d.animo}" viewBox="${vista}" role="img"
                 aria-label="Avatar: ${d.clase.nombre} ${d.etapa.nombre}" xmlns="http://www.w3.org/2000/svg">${capas.join("")}</svg>`;
}

// Colores de la ropa: el novato viste lino sencillo; después, los colores de su clase.
function ropa(d) {
    if (d.etapa.clave === "novato") return { tela: "#8f7d5e", sombra: "#665840", borde: "#b7a57f" };
    return { tela: d.clase.oscuro, sombra: "#1a1426", borde: d.clase.color };
}

function conOro(d) {
    return d.etapa.clave === "heroe" || d.etapa.clave === "leyenda";
}

// Destello de 4 puntas.
function destello(x, y, r, clase = "chispa") {
    return `<path class="${clase}" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#fde68a"/>`;
}


// ===== Fondo =====

function fondo(d, id) {
    const tipo = d.equipado.fondo;

    if (tipo === "bosque") {
        const pino = (x, alto, color) =>
            `<path d="M${x} ${190 - alto} L${x + alto * 0.3} ${190 - alto * 0.45} L${x + alto * 0.16} ${190 - alto * 0.45}
                      L${x + alto * 0.4} 190 L${x - alto * 0.4} 190 L${x - alto * 0.16} ${190 - alto * 0.45}
                      L${x - alto * 0.3} ${190 - alto * 0.45} Z" fill="${color}"/>`;
        return `<defs><linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#0f2f24"/><stop offset="1" stop-color="#050c09"/></linearGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                <circle cx="158" cy="38" r="11" fill="#e7e5c8" opacity=".7"/>
                ${pino(22, 130, "#08261a")}${pino(50, 85, "#0b3222")}${pino(178, 140, "#08261a")}${pino(152, 90, "#0b3222")}
                <rect y="186" width="200" height="14" fill="#04140d"/>`;
    }

    if (tipo === "castillo") {
        return `<defs><linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#2e1a55"/><stop offset="1" stop-color="#0d0a1c"/></linearGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                <g fill="#15122e">
                    <rect x="12" y="66" width="34" height="124"/><rect x="154" y="66" width="34" height="124"/>
                    <rect x="40" y="110" width="120" height="80"/>
                    <path d="M12 66 v-10 h7 v6 h7 v-6 h6 v6 h7 v-6 h7 v10 Z M154 66 v-10 h7 v6 h7 v-6 h6 v6 h7 v-6 h7 v10 Z"/>
                </g>
                <g fill="${ORO}" opacity=".6"><rect x="25" y="88" width="7" height="12" rx="3.5"/><rect x="168" y="88" width="7" height="12" rx="3.5"/></g>`;
    }

    if (tipo === "galaxia") {
        const puntos = [[20, 30], [60, 18], [96, 10], [140, 28], [178, 14], [186, 70], [14, 96], [170, 120], [30, 150], [184, 170]];
        const estrellas = puntos.map(([x, y], i) =>
            `<circle class="${i % 3 === 0 ? "chispa" : ""}" cx="${x}" cy="${y}" r="${i % 2 ? 1 : 1.5}" fill="#fff"/>`).join("");
        return `<defs><radialGradient id="${id}-f" cx="50%" cy="40%" r="75%">
                    <stop offset="0" stop-color="#241f5e"/><stop offset="1" stop-color="#05030f"/></radialGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                ${estrellas}
                <circle cx="40" cy="48" r="13" fill="#6d5fb0"/>
                <ellipse cx="40" cy="48" rx="22" ry="5" fill="none" stroke="#c9b458" stroke-width="1.6" transform="rotate(-20 40 48)"/>`;
    }

    if (tipo === "salon") {
        const rayos = Array.from({ length: 10 }, (_, i) =>
            `<path d="M100 96 L${100 + 160 * Math.cos(i * 0.628)} ${96 + 160 * Math.sin(i * 0.628)}
                      L${100 + 160 * Math.cos(i * 0.628 + 0.3)} ${96 + 160 * Math.sin(i * 0.628 + 0.3)} Z" fill="${ORO}" opacity=".1"/>`).join("");
        return `<defs><radialGradient id="${id}-f" cx="50%" cy="45%" r="70%">
                    <stop offset="0" stop-color="#5a3a0c"/><stop offset="1" stop-color="#0d0a1c"/></radialGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                ${rayos}
                <g fill="#c9b458" opacity=".28"><rect x="14" y="56" width="11" height="134"/><rect x="175" y="56" width="11" height="134"/></g>`;
    }

    // Fondo normal: una luz tenue del color de tu clase.
    return `<defs><radialGradient id="${id}-f" cx="50%" cy="40%" r="70%">
                <stop offset="0" stop-color="${d.clase.color}" stop-opacity=".3"/>
                <stop offset="1" stop-color="#0d0a1c"/></radialGradient></defs>
            <rect width="200" height="200" fill="url(#${id}-f)"/>`;
}


// ===== Efectos detrás del personaje =====

// Leyenda (nivel 50+): aura dorada que palpita.
function aura(id) {
    return `<defs><radialGradient id="${id}-a">
                <stop offset="0" stop-color="#fde68a" stop-opacity=".7"/>
                <stop offset=".55" stop-color="${ORO}" stop-opacity=".22"/>
                <stop offset="1" stop-color="${ORO}" stop-opacity="0"/></radialGradient></defs>
            <circle class="aura" cx="100" cy="104" r="84" fill="url(#${id}-a)"/>
            ${destello(42, 58, 5)}${destello(160, 74, 4)}${destello(150, 146, 4)}`;
}

// Racha de 7+ días: fuego a los lados.
function llamas(id) {
    const llama = (x, alto, ancho) =>
        `<path class="llama" d="M${x - ancho} 184
                C${x - ancho - 2} ${184 - alto * 0.45} ${x - ancho * 0.2} ${184 - alto * 0.6} ${x} ${184 - alto}
                C${x + ancho * 0.2} ${184 - alto * 0.6} ${x + ancho + 2} ${184 - alto * 0.45} ${x + ancho} 184 Z"
                fill="url(#${id}-l)" opacity=".85"/>`;
    return `<defs><linearGradient id="${id}-l" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#c2410c"/><stop offset=".55" stop-color="#ea8a0b"/>
                <stop offset="1" stop-color="#fde68a" stop-opacity=".25"/></linearGradient></defs>
            ${llama(58, 78, 9)}${llama(70, 48, 7)}${llama(142, 78, 9)}${llama(130, 48, 7)}`;
}

// Buen ánimo: una luz cálida detrás.
function resplandor(id) {
    return `<defs><radialGradient id="${id}-r">
                <stop offset="0" stop-color="#fde68a" stop-opacity=".35"/>
                <stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient></defs>
            <circle cx="100" cy="96" r="70" fill="url(#${id}-r)"/>`;
}

// Dormido: es de noche (luna y penumbra azul).
function noche() {
    return `<rect width="200" height="200" fill="#0a1030" opacity=".5"/>
            <path d="M158 26 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22 z" fill="#dbe3f5" opacity=".85"/>
            ${destello(138, 22, 2.5)}${destello(176, 60, 2)}`;
}


// ===== Personaje =====

// Capa (de héroe o comprada) o alas (de logro). Va detrás del cuerpo.
function espalda(d) {
    const objeto = d.equipado.espalda;
    if (objeto === "alas") {
        const ala = `<path d="M90 66 C70 40 44 40 40 62 C48 60 52 66 52 74 C58 70 62 76 62 84 C68 80 72 84 74 92 C80 86 86 84 90 80 Z"
                           fill="#e5eefb" fill-opacity=".85" stroke="#9fb7d9" stroke-width="1"/>
                     <path d="M88 68 C72 52 54 50 46 60 M88 72 C74 62 62 64 56 72 M88 77 C78 72 70 76 66 82"
                           fill="none" stroke="#9fb7d9" stroke-width=".8"/>`;
        return `<g class="alas">${ala}<g transform="translate(200 0) scale(-1 1)">${ala}</g></g>`;
    }
    let color = null;
    if (objeto === "capa") color = "#7f1d1d";
    else if (conOro(d)) color = d.clase.oscuro;   // capa de héroe
    if (!color) return "";
    return `<path d="M79 60 Q100 55 121 60 L136 170 Q128 176 119 171 Q110 177 100 172 Q90 177 81 171 Q72 176 64 170 Z"
                  fill="${color}" stroke="${TRAZO}" stroke-width="1" stroke-linejoin="round"/>
            <path d="M100 60 L100 172 M88 62 L78 170 M112 62 L122 170" stroke="rgba(0,0,0,.28)" stroke-width="1.2" fill="none"/>
            ${conOro(d) ? `<path d="M64 170 Q72 176 81 171 Q90 177 100 172 Q110 177 119 171 Q128 176 136 170" fill="none" stroke="${ORO}" stroke-width="1.6"/>` : ""}`;
}

function piernas(d) {
    const novato = d.etapa.clave === "novato";
    const pantalon = "#2b2733";
    const botas = novato ? "#4a3423" : "#221a14";
    const pierna = (x1, x2) =>
        `<path d="M${x1} 106 L${x1 + 10} 106 L${x2 + 8.5} 172 L${x2} 172 Z" fill="${pantalon}" stroke="${TRAZO}" stroke-width=".8" stroke-linejoin="round"/>`;
    // Botas: cortas de novato; altas con vuelta desde aventurero.
    const bota = (x, haciaFuera) => {
        const alto = novato ? 162 : 150;
        return `<path d="M${x - 0.6} ${alto} L${x + 9} ${alto} L${x + 9} 174 L${x + 9 + haciaFuera * 5} 180 L${x - 1 + (haciaFuera < 0 ? -5 : 0)} 180 Z"
                      fill="${botas}" stroke="${TRAZO}" stroke-width=".8" stroke-linejoin="round"/>
                ${novato ? "" : `<rect x="${x - 1}" y="${alto - 1}" width="10.6" height="3.2" rx="1" fill="${conOro(d) ? ORO : "#3a2a1e"}" stroke="${TRAZO}" stroke-width=".5"/>`}`;
    };
    return `${pierna(88, 89.5)}${pierna(102, 101.5)}${bota(89.5, -1)}${bota(101.5, 1)}`;
}

function torso(d) {
    const { tela, sombra, borde } = ropa(d);
    const oro = conOro(d);
    const r = d.rasgos;
    const novato = d.etapa.clave === "novato";
    let adornos = "";

    // Desde aventurero: ribete del color de la clase y hebilla.
    if (!novato) {
        adornos += `<path d="M100 60 L100 104" stroke="${borde}" stroke-width="1.4" opacity=".85"/>
                    <path d="M83 106 Q100 112 117 106 L118 112 Q100 118 82 112 Z" fill="${tela}" stroke="${borde}" stroke-width="1"/>`;
    }
    // Héroe: emblema en el pecho.
    if (oro) {
        adornos += `<path d="M100 68 L105 74 L100 81 L95 74 Z" fill="${borde}" stroke="${ORO}" stroke-width="1.2"/>`;
    }
    // Fuerza muy alta: peto de acero.
    if (r.fuerza >= 2) {
        adornos += `<path d="M84 63 Q100 58 116 63 L113 88 Q100 93 87 88 Z" fill="${ACERO}" fill-opacity=".9" stroke="${ACERO_OSCURO}" stroke-width="1"/>
                    <path d="M100 61 L100 91 M88 76 Q100 80 112 76" stroke="${ACERO_OSCURO}" stroke-width=".9" fill="none"/>`;
    }
    // Carisma: pañuelo de gala al cuello; con más carisma, banda cruzada.
    if (r.carisma >= 2) {
        adornos += `<path d="M84 62 L90 60 L116 100 L110 103 Z" fill="#7f1d1d" stroke="${ORO}" stroke-width=".9"/>`;
    }
    if (r.carisma >= 1) {
        adornos += `<path d="M96 57.5 L104 57.5 L102.5 66 L100 69 L97.5 66 Z" fill="#ece7dc" stroke="${TRAZO}" stroke-width=".6"/>`;
    }
    // Riqueza: cadena de oro con medallón; con más riqueza, bolsa de monedas.
    if (r.riqueza >= 1) {
        adornos += `<path d="M90 61 Q100 77 110 61" fill="none" stroke="${ORO}" stroke-width="1.5"/>
                    <circle cx="100" cy="72.5" r="2.6" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".7"/>`;
    }
    if (r.riqueza >= 2) {
        adornos += `<path d="M109 103 Q107 110 110 114 Q114 116 117 113 Q118 108 115 103 Z" fill="#5a4326" stroke="${TRAZO}" stroke-width=".7"/>
                    <path d="M109.5 103.5 L115 103.5" stroke="${ORO}" stroke-width="1.4"/>`;
    }

    return `<path d="M96 52 L104 52 L104.5 60 L95.5 60 Z" fill="${d.tono.sombra}"/>
            <path d="M79 61 Q100 55 121 61 L115 100 Q116 106 117 110 Q100 116 83 110 Q84 106 85 100 Z"
                  fill="${tela}" stroke="${TRAZO}" stroke-width="1" stroke-linejoin="round"/>
            <path d="M100 58 L121 61 L115 100 Q116 106 117 110 Q108 113 100 114 Z" fill="${sombra}" opacity=".35"/>
            <path d="M95.5 60 L100 66 L104.5 60" fill="none" stroke="${TRAZO}" stroke-width=".9"/>
            ${adornos}
            <path d="M84.5 99 Q100 104 115.5 99 L116 104 Q100 109 84 104 Z" fill="${CUERO}" stroke="${TRAZO}" stroke-width=".7"/>
            <rect x="97.4" y="99.6" width="5.2" height="6" rx="1" fill="${oro ? ORO : "#8b7a5a"}" stroke="${TRAZO}" stroke-width=".6"/>`;
}

function brazos(d) {
    const { tela } = ropa(d);
    const fuerte = d.rasgos.fuerza >= 1;
    const grosor = fuerte ? 9.5 : 7.8;
    // Cada brazo: hombro → codo → mano. Primero el contorno oscuro y encima la tela.
    const brazo = (hombro, codo, mano) => {
        const camino = `M${hombro} 63 L${codo} 88 L${mano} 109`;
        return `<path d="${camino}" fill="none" stroke="${TRAZO}" stroke-width="${grosor + 1.6}" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="${camino}" fill="none" stroke="${tela}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round"/>
                ${d.etapa.clave === "novato" && !fuerte ? "" : `<path d="M${codo + (mano - codo) * 0.35} 95.5 L${mano} 107" stroke="${CUERO}" stroke-width="${grosor + 0.4}" stroke-linecap="butt"/>`}`;
    };
    const mano = (x) => `<circle cx="${x}" cy="112" r="4" fill="${d.tono.piel}" stroke="${TRAZO}" stroke-width=".8"/>`;

    // Intelecto alto: libro de hechizos bajo el brazo izquierdo.
    const libro = d.rasgos.intelecto >= 2
        ? `<g transform="rotate(-10 73 108)">
               <rect x="66.5" y="101" width="11" height="15" rx="1.2" fill="#3b1d6e" stroke="${TRAZO}" stroke-width=".8"/>
               <rect x="68" y="102.6" width="1.6" height="11.8" fill="${ORO}"/>
               <path d="M72 106h4M72 109h4" stroke="${ORO}" stroke-width=".7"/>
           </g>`
        : "";

    // Fuerza muy alta: hombreras de acero.
    const hombreras = d.rasgos.fuerza >= 2
        ? `<g fill="${ACERO}" stroke="${ACERO_OSCURO}" stroke-width="1">
               <path d="M72 66 Q73 56 84 57 L86 65 Q79 64 72 66 Z"/><path d="M128 66 Q127 56 116 57 L114 65 Q121 64 128 66 Z"/></g>`
        : conOro(d)
            ? `<g fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".7">
                   <path d="M74 65 Q76 58 84 58.5 L85 63 Q79 63 74 65 Z"/><path d="M126 65 Q124 58 116 58.5 L115 63 Q121 63 126 65 Z"/></g>`
            : "";

    return `${brazo(81, 75.5, 77)}${libro}${mano(77)}
            ${brazo(119, 124.5, 123)}${objetoEnMano(d.equipado.mano)}${mano(123)}
            ${hombreras}`;
}

// Lo que sostiene en la mano derecha (centro de la mano: 123, 112).
function objetoEnMano(id) {
    switch (id) {
        case "espada-madera":   // espada de entrenamiento
            return `<path d="M121.6 64 L123 59 L124.4 64 L124.4 107 L121.6 107 Z" fill="#a67c4a" stroke="#5c3d1c" stroke-width=".8"/>
                    <rect x="117.5" y="106" width="11" height="2.6" rx="1" fill="#5c3d1c"/>
                    <rect x="122" y="108" width="2" height="9" fill="#3b2713"/>
                    <circle cx="123" cy="118.5" r="1.9" fill="#5c3d1c"/>`;
        case "espada-jefe":     // espada larga con brillo rojo
            return `<path class="orbe" d="M123 44 L127.5 52 L127.5 108 L118.5 108 L118.5 52 Z" fill="#dc2626" opacity=".3"/>
                    <path d="M121.2 54 L123 48 L124.8 54 L124.8 107 L121.2 107 Z" fill="#d7dde6" stroke="#6b7280" stroke-width=".8"/>
                    <path d="M123 54 L123 106" stroke="#8b95a5" stroke-width=".8"/>
                    <rect x="115.5" y="105.6" width="15" height="3" rx="1.4" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".6"/>
                    <circle cx="123" cy="107.1" r="1.7" fill="#b91c1c"/>
                    <rect x="122" y="108.6" width="2" height="9" fill="#3b0d0d"/>
                    <circle cx="123" cy="119" r="2.1" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".5"/>`;
        case "baston":          // bastón con un cristal
            return `<path d="M124.6 56 Q123.4 100 124.4 180" fill="none" stroke="#3b2713" stroke-width="3.2" stroke-linecap="round"/>
                    <path d="M121 58 Q124.6 51 128.2 58" fill="none" stroke="#3b2713" stroke-width="2.2"/>
                    <circle class="orbe" cx="124.6" cy="50" r="7.5" fill="#38bdf8" opacity=".3"/>
                    <path d="M124.6 43.5 L128 50 L124.6 56.5 L121.2 50 Z" fill="#7dd3fc" stroke="#0e7490" stroke-width=".8"/>`;
        case "laud":
            return `<path d="M125 112 L138 86" stroke="#3b2713" stroke-width="2.8" stroke-linecap="round"/>
                    <rect x="136" y="80" width="4.4" height="7.5" rx="1" fill="#2a1a0c" transform="rotate(27 138 84)"/>
                    <ellipse cx="124" cy="121" rx="7.5" ry="10" fill="#8a5a1f" stroke="#3b2713" stroke-width="1" transform="rotate(-27 124 121)"/>
                    <circle cx="124.6" cy="120" r="2.3" fill="#2a1a0c"/>
                    <path d="M126.5 124 L137.2 87.5" stroke="#d9c58a" stroke-width=".5"/>`;
        default:
            return "";
    }
}

function cabeza(d) {
    const r = d.rasgos;
    const animo = d.animo;
    const dormido = animo === "dormido";

    // Ojos: pequeños y serios. Cerrados si duerme, entrecerrados si está cansado.
    const ojo = (x) => {
        if (dormido) return `<path d="M${x - 1.8} 41.4 Q${x} 42.4 ${x + 1.8} 41.4" fill="none" stroke="${TRAZO}" stroke-width=".9" stroke-linecap="round"/>`;
        if (animo === "cansado") return `<path d="M${x - 1.8} 41 L${x + 1.8} 41" stroke="${TRAZO}" stroke-width="1.1" stroke-linecap="round"/>`;
        return `<ellipse cx="${x}" cy="41.1" rx="1.6" ry="1.1" fill="#f3efe6"/><circle cx="${x}" cy="41.1" r=".95" fill="${TRAZO}"/>`;
    };
    // Cejas rectas; más marcadas si está "en llamas".
    const cejas = dormido
        ? ""
        : animo === "llamas"
            ? `<path d="M93.3 37.6 L98.4 39.2 M106.7 37.6 L101.6 39.2" stroke="${d.tono.pelo}" stroke-width="1.3" stroke-linecap="round"/>`
            : `<path d="M93.6 38.6 L98.2 38.9 M106.4 38.6 L101.8 38.9" stroke="${d.tono.pelo}" stroke-width="1.1" stroke-linecap="round"/>`;

    // Boca: seria por defecto; media sonrisa si está contento (más con carisma).
    let boca;
    if (dormido || animo === "cansado") {
        boca = `<path d="M97.8 48.4 L102.2 48.4" stroke="#7a4a35" stroke-width=".9" stroke-linecap="round"/>`;
    } else if (animo === "feliz" || animo === "llamas" || r.carisma >= 1) {
        boca = `<path d="M97 47.8 Q100 ${r.carisma >= 1 ? 50.4 : 49.6} 103 47.8" fill="none" stroke="#7a4a35" stroke-width="1" stroke-linecap="round"/>`;
    } else {
        boca = `<path d="M97.5 48.3 Q100 48.9 102.5 48.3" fill="none" stroke="#7a4a35" stroke-width=".9" stroke-linecap="round"/>`;
    }

    // Intelecto: anteojos finos de metal.
    const lentes = r.intelecto >= 1
        ? `<g fill="rgba(255,255,255,.12)" stroke="#c9b458" stroke-width=".7">
               <circle cx="96" cy="41.2" r="2.7"/><circle cx="104" cy="41.2" r="2.7"/></g>
           <path d="M98.7 41.2 h2.6 M93.3 41 L90.8 40.2 M106.7 41 L109.2 40.2" stroke="#c9b458" stroke-width=".7"/>`
        : "";

    // Peinado: corto, rapado, largo (cae detrás de la cara) o calvo.
    const peinado = d.apariencia.peinado;
    const melena = peinado === "largo"
        ? `<path d="M89.8 40 Q88.2 28.4 100 28 Q111.8 28.4 110.2 40 L112 57 Q106.5 59.5 105 53 L95 53 Q93.5 59.5 88 57 Z" fill="${d.tono.pelo}" stroke="${TRAZO}" stroke-width=".6"/>`
        : "";
    const cabello = peinado === "calvo"
        ? ""
        : peinado === "rapado"
            ? `<path d="M90.7 39.4 Q89.8 30 100 29.6 Q110.2 30 109.3 39.4 Q107.6 33.8 100 33.2 Q92.4 33.8 90.7 39.4 Z" fill="${d.tono.pelo}" opacity=".8"/>`
            : `<path d="M90.4 41 Q88.6 29 100 28.4 Q111.4 29 109.6 41 Q108.6 35.6 104.6 34.6 Q99.6 36.4 94.4 35 Q91.4 36.6 90.4 41 Z" fill="${d.tono.pelo}"/>`;

    // Barba: bigote, candado (bigote y mentón) o completa.
    const barbas = {
        bigote: `<path d="M96.4 47.2 Q100 45.4 103.6 47.2 Q100 48.1 96.4 47.2 Z" fill="${d.tono.pelo}"/>`,
        candado: `<path d="M96.2 47 Q100 45.4 103.8 47 L103.2 51.4 Q100 54.6 96.8 51.4 Z" fill="${d.tono.pelo}"/>`,
        completa: `<path d="M90.9 42 Q91.4 50 100 54.5 Q108.6 50 109.1 42 Q107.8 46.6 104 47 Q100 45.6 96 47 Q92.2 46.6 90.9 42 Z" fill="${d.tono.pelo}"/>`,
    };
    const barba = barbas[d.apariencia.barba] || "";

    const rostro = `
        ${melena}
        <path d="M90.6 41 Q90 44 91.2 45.5 M109.4 41 Q110 44 108.8 45.5" stroke="${d.tono.sombra}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M90.8 40 Q90.6 30.6 100 30.5 Q109.4 30.6 109.2 40 Q109.2 48.5 100 54 Q90.8 48.5 90.8 40 Z"
              fill="${d.tono.piel}" stroke="${TRAZO}" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M100 30.5 Q109.4 30.6 109.2 40 Q109.2 48.5 100 54 Z" fill="${d.tono.sombra}" opacity=".28"/>
        ${cabello}${barba}
        ${cejas}${ojo(96)}${ojo(104)}
        <path d="M100 41.6 L99.3 45.3 L100.7 45.6" fill="none" stroke="${d.tono.sombra}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>
        ${boca}${lentes}`;

    // Dormido: la cabeza cae un poco hacia adelante.
    const giro = dormido ? ' transform="rotate(9 100 56)"' : "";
    return `<g${giro}>${rostro}${sombrero(d.equipado.cabeza)}</g>`;
}

// Lo que lleva en la cabeza.
function sombrero(id) {
    switch (id) {
        case "gorra":           // gorro sencillo de aprendiz
            return `<path d="M89.6 39.4 Q88.6 27 100 26.6 Q111.4 27 110.4 39.4 Q100 34.6 89.6 39.4 Z" fill="#33415c" stroke="${TRAZO}" stroke-width=".9"/>
                    <path d="M89.8 38.6 Q100 34 110.2 38.6" fill="none" stroke="#7b8bb0" stroke-width="1.3"/>`;
        case "sombrero-mago":
            return `<path d="M91.2 34 Q97 26 104.5 17 Q107 25 109 34 Z" fill="#33215c" stroke="${TRAZO}" stroke-width=".9" stroke-linejoin="round"/>
                    <path d="M92 31 Q100 34 108.4 31" fill="none" stroke="${ORO}" stroke-width="1.5"/>
                    <ellipse cx="100" cy="34.4" rx="17.5" ry="3.6" fill="#2a1a4d" stroke="${TRAZO}" stroke-width=".9"/>`;
        case "casco":           // yelmo abierto con penacho
            return `<path d="M88.8 42 Q88 26.6 100 26.2 Q112 26.6 111.2 42 L111.2 46.5 L107.2 46.5 L107.2 39.6 Q100 36.8 92.8 39.6 L92.8 46.5 L88.8 46.5 Z"
                          fill="${ACERO}" stroke="${ACERO_OSCURO}" stroke-width="1" stroke-linejoin="round"/>
                    <path d="M100 37 L100 46" stroke="${ACERO_OSCURO}" stroke-width="2"/>
                    <path d="M100 26.4 L100 37" stroke="#d7dde6" stroke-width="1"/>
                    <path d="M100 26.2 Q97 15 107.5 14.5 Q102.6 19.5 103.4 26.6 Z" fill="#991b1b" stroke="${TRAZO}" stroke-width=".7"/>`;
        case "corona":          // corona fina de oro
            return `<path d="M90.4 35.2 L91.4 27.4 L95.2 31.8 L100 24.6 L104.8 31.8 L108.6 27.4 L109.6 35.2 Q100 32.4 90.4 35.2 Z"
                          fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".9" stroke-linejoin="round"/>
                    <circle cx="100" cy="30.4" r="1.6" fill="#b91c1c"/>
                    <circle cx="94.4" cy="32.4" r="1" fill="#1d4ed8"/><circle cx="105.6" cy="32.4" r="1" fill="#047857"/>`;
        default:
            return "";
    }
}


// ===== Mascota: un dragón =====
// Se dibuja alrededor del punto (0, 0) y luego se mueve a su lugar con translate.
// Crece con tus misiones: huevo → cría → adulto. Si la descuidas, se apaga.

function mascota(m) {
    return `<g transform="translate(166 166)">${cuerpoMascota(m)}</g>`;
}

// La mascota sola, en grande (para la pantalla Personaje).
export function dibujarMascota(m) {
    return `<svg class="avatar-svg" viewBox="-34 -30 68 52" role="img" aria-label="Mascota: ${m.etapa.nombre}"
                 xmlns="http://www.w3.org/2000/svg">${cuerpoMascota(m)}</svg>`;
}

function cuerpoMascota(m) {
    const ojo = m.triste ? "#6b7280" : "#f59e0b";
    let cuerpo;

    if (m.etapa.clave === "huevo") {
        // Huevo de dragón: escamas oscuras y grietas que brillan.
        cuerpo = `<ellipse cx="0" cy="17" rx="10" ry="2.6" fill="#000" opacity=".4"/>
                  <g class="huevo">
                      <path d="M0 -13 C8 -13 11 -1 11 5 C11 12 6 16 0 16 C-6 16 -11 12 -11 5 C-11 -1 -8 -13 0 -13 Z"
                            fill="#123c3a" stroke="${TRAZO}" stroke-width="1"/>
                      <path d="M-7 -2 Q-4 1 -1 -2 Q2 1 5 -2 M-9 5 Q-6 8 -3 5 Q0 8 3 5 Q6 8 9 5 M-6 11 Q-3 14 0 11 Q3 14 6 11"
                            fill="none" stroke="#1f6f6a" stroke-width="1"/>
                      <path class="orbe" d="M-2 -9 L1 -4 L-1 0 L3 4" fill="none" stroke="${m.triste ? "#4b5563" : "#5eead4"}" stroke-width="1.1" stroke-linecap="round"/>
                  </g>`;
    } else if (m.etapa.clave === "cria") {
        // Cría: un dragón pequeño, sentado.
        cuerpo = `<ellipse cx="0" cy="16" rx="12" ry="2.8" fill="#000" opacity=".4"/>
                  <g class="mascota-cuerpo">
                      <path d="M-6 8 Q-18 10 -19 2 Q-15 6 -8 4 Z" fill="#0f5f59" stroke="${TRAZO}" stroke-width=".8"/>
                      <path d="M-3 0 L-13 -13 L-9 -1 L-13 3 Z" fill="#17877f" stroke="${TRAZO}" stroke-width=".8" stroke-linejoin="round"/>
                      <path d="M-8 8 Q-10 -1 -2 -2 Q4 -3 5 -8 Q5 -13 10 -14 L17 -11 L13 -8 Q11 -3 9 2 Q10 10 4 14 L-6 14 Q-9 12 -8 8 Z"
                            fill="#0f766e" stroke="${TRAZO}" stroke-width=".9" stroke-linejoin="round"/>
                      <path d="M-4 12 Q0 5 5 3 Q6 9 2 13 Z" fill="#5fb3a9" opacity=".75"/>
                      <path d="M8 -13.5 L7 -18 L10.5 -14.5 Z" fill="#c9b458" stroke="${TRAZO}" stroke-width=".5"/>
                      <circle cx="11.6" cy="-11.2" r="1.1" fill="${ojo}"/>
                      <path d="M-5 14 L-6 16.5 M1 14 L1 16.5 M5 13 L6.5 16" stroke="${TRAZO}" stroke-width="1.4" stroke-linecap="round"/>
                  </g>`;
    } else {
        // Adulto: dragón con las alas abiertas.
        cuerpo = `<ellipse cx="0" cy="17" rx="17" ry="3.2" fill="#000" opacity=".4"/>
                  <g class="mascota-cuerpo">
                      <path d="M-9 8 Q-26 12 -27 0 Q-22 -4 -24 -8 Q-19 2 -10 3 Z" fill="#3b1470" stroke="${TRAZO}" stroke-width=".8"/>
                      <path d="M-4 -2 L-22 -22 L-17 -8 L-24 -6 L-14 2 Z" fill="#5b21b6" stroke="${TRAZO}" stroke-width=".9" stroke-linejoin="round"/>
                      <path d="M2 -3 L6 -27 L10 -12 L17 -18 L11 -1 Z" fill="#6d28d9" stroke="${TRAZO}" stroke-width=".9" stroke-linejoin="round"/>
                      <path d="M-11 9 Q-13 -2 -3 -4 Q5 -5 7 -11 Q8 -18 14 -19 L23 -15 L18 -11 Q15 -5 12 1 Q13 11 5 15 L-8 15 Q-12 13 -11 9 Z"
                            fill="#4c1d95" stroke="${TRAZO}" stroke-width="1" stroke-linejoin="round"/>
                      <path d="M-6 13 Q0 4 7 2 Q8 10 3 14 Z" fill="#a78bfa" opacity=".6"/>
                      <path d="M12 -18.5 L10 -25 L15.5 -19.5 Z M16 -18 L16.5 -23.5 L19.5 -17 Z" fill="#c9b458" stroke="${TRAZO}" stroke-width=".5"/>
                      <circle cx="16" cy="-15.2" r="1.3" fill="${ojo}"/>
                      <path d="M-7 15 L-8 17.6 M0 15 L0 17.6 M6 14 L8 17" stroke="${TRAZO}" stroke-width="1.6" stroke-linecap="round"/>
                  </g>`;
    }
    return `<g class="mascota ${m.triste ? "triste" : ""}">${cuerpo}</g>`;
}
