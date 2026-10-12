// dibujo.js — Dibuja el avatar con SVG.
//
// SVG es un formato de dibujo con formas (círculos, rectángulos, caminos)
// que el navegador pinta. Aquí armamos el avatar como un texto SVG,
// capa por capa, de atrás hacia adelante (lo último queda encima).
//
// El lienzo mide 200 × 200. El personaje está centrado en x = 100:
//   cabeza ≈ y 34–102, cuerpo ≈ y 100–150, piernas ≈ y 145–175, suelo y = 182.
//
// Las clases CSS (pj, aura, llama, chispa, zzz, mascota…) son las que animan.

const PIEL = "#f1c08f";
const PIEL_BORDE = "#c98b5a";
const PELO = "#3b2417";
const OJOS = "#1e1b2e";
const BOCA = "#7c2d12";
const ORO = "#fbbf24";
const ORO_OSCURO = "#b45309";

let contador = 0; // cada dibujo usa ids distintos para sus degradados


// d = resultado de describirAvatar() (ver avatar.js)
// mini = true: solo la cabeza, para la cabecera de la app
// batalla = true: sin fondo ni mascota, para pelear contra un jefe
export function dibujarAvatar(d, { mini = false, batalla = false } = {}) {
    const id = `av${++contador}`;
    const etapa = d.etapa.clave;

    const capas = [
        batalla ? "" : fondo(d, id),
        etapa === "leyenda" ? aura(id) : "",
        d.animo === "llamas" ? llamas(id) : "",
        mini ? "" : '<ellipse cx="100" cy="182" rx="38" ry="7" fill="#000" opacity=".35"/>',
        '<g class="pj">',
        espalda(d),
        piernas(d),
        torso(d),
        brazos(d),
        cabeza(d),
        sombrero(d.equipado.cabeza),
        "</g>",
        adornosDeAnimo(d),
        mini || batalla ? "" : mascota(d.mascota),
    ];

    const vista = mini ? "52 4 96 96" : batalla ? "28 0 144 192" : "0 0 200 200";
    const descripcion = `${d.clase.nombre} ${d.etapa.nombre}`;
    return `<svg class="avatar-svg animo-${d.animo}" viewBox="${vista}" role="img" aria-label="Avatar: ${descripcion}"
                 xmlns="http://www.w3.org/2000/svg">${capas.join("")}</svg>`;
}

// Colores de la ropa: el novato va de beige; después, del color de su clase.
function ropa(d) {
    if (d.etapa.clave === "novato") return { tela: "#c8a97e", sombra: "#8f6f48" };
    return { tela: d.clase.color, sombra: d.clase.oscuro };
}

function conAdornosDeOro(d) {
    return d.etapa.clave === "heroe" || d.etapa.clave === "leyenda";
}

// Estrellita de 4 puntas (para brillos).
function estrella(x, y, r, clase = "chispa") {
    return `<path class="${clase}" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${ORO}"/>`;
}


// ===== Fondo =====

function fondo(d, id) {
    const tipo = d.equipado.fondo;

    if (tipo === "bosque") {
        const pino = (x, alto, color) =>
            `<path d="M${x} ${190 - alto} L${x + alto * 0.35} ${190 - alto * 0.45} L${x + alto * 0.2} ${190 - alto * 0.45}
                      L${x + alto * 0.45} 190 L${x - alto * 0.45} 190 L${x - alto * 0.2} ${190 - alto * 0.45}
                      L${x - alto * 0.35} ${190 - alto * 0.45} Z" fill="${color}"/>`;
        return `<defs><linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#14532d"/><stop offset="1" stop-color="#06140d"/></linearGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                <circle cx="158" cy="38" r="12" fill="#fef9c3" opacity=".85"/>
                ${pino(24, 120, "#0b3b23")}${pino(52, 80, "#0f4a2c")}${pino(176, 130, "#0b3b23")}${pino(150, 85, "#0f4a2c")}
                <rect y="186" width="200" height="14" fill="#052e16"/>`;
    }

    if (tipo === "castillo") {
        return `<defs><linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#4c1d95"/><stop offset="1" stop-color="#120d24"/></linearGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                <g fill="#1e1b4b">
                    <rect x="14" y="70" width="34" height="120"/><rect x="152" y="70" width="34" height="120"/>
                    <rect x="40" y="108" width="120" height="82"/>
                    <path d="M14 70 v-10 h7 v6 h7 v-6 h6 v6 h7 v-6 h7 v10 Z M152 70 v-10 h7 v6 h7 v-6 h6 v6 h7 v-6 h7 v10 Z"/>
                    <path d="M10 62 L31 34 L52 62 Z M148 62 L169 34 L190 62 Z" fill="#312e81"/>
                </g>
                <g fill="${ORO}" opacity=".8">
                    <rect x="26" y="90" width="8" height="12" rx="4"/><rect x="164" y="90" width="8" height="12" rx="4"/>
                </g>`;
    }

    if (tipo === "galaxia") {
        const puntos = [[20, 30], [60, 18], [96, 10], [140, 28], [178, 14], [186, 70], [14, 96], [170, 120], [30, 150], [184, 170]];
        const estrellas = puntos.map(([x, y], i) =>
            `<circle class="${i % 3 === 0 ? "chispa" : ""}" cx="${x}" cy="${y}" r="${i % 2 ? 1.2 : 1.8}" fill="#fff"/>`).join("");
        return `<defs><radialGradient id="${id}-f" cx="50%" cy="40%" r="75%">
                    <stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#05030f"/></radialGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                ${estrellas}
                <circle cx="40" cy="48" r="14" fill="#a78bfa"/>
                <ellipse cx="40" cy="48" rx="24" ry="6" fill="none" stroke="#fde68a" stroke-width="2" transform="rotate(-20 40 48)"/>`;
    }

    if (tipo === "salon") {
        const rayos = Array.from({ length: 10 }, (_, i) =>
            `<path d="M100 96 L${100 + 160 * Math.cos(i * 0.628)} ${96 + 160 * Math.sin(i * 0.628)}
                      L${100 + 160 * Math.cos(i * 0.628 + 0.3)} ${96 + 160 * Math.sin(i * 0.628 + 0.3)} Z" fill="${ORO}" opacity=".12"/>`).join("");
        return `<defs><radialGradient id="${id}-f" cx="50%" cy="45%" r="70%">
                    <stop offset="0" stop-color="#78350f"/><stop offset="1" stop-color="#120d24"/></radialGradient></defs>
                <rect width="200" height="200" fill="url(#${id}-f)"/>
                ${rayos}
                <g fill="#fde68a" opacity=".35"><rect x="14" y="60" width="12" height="130"/><rect x="174" y="60" width="12" height="130"/></g>`;
    }

    // Fondo normal: un brillo del color de tu clase.
    return `<defs><radialGradient id="${id}-f" cx="50%" cy="42%" r="70%">
                <stop offset="0" stop-color="${d.clase.color}" stop-opacity=".45"/>
                <stop offset="1" stop-color="#120d24"/></radialGradient></defs>
            <rect width="200" height="200" fill="url(#${id}-f)"/>`;
}


// ===== Efectos detrás del personaje =====

// Leyenda (nivel 50+): aura dorada que palpita.
function aura(id) {
    return `<defs><radialGradient id="${id}-a">
                <stop offset="0" stop-color="#fde68a" stop-opacity=".8"/>
                <stop offset=".55" stop-color="${ORO}" stop-opacity=".25"/>
                <stop offset="1" stop-color="${ORO}" stop-opacity="0"/></radialGradient></defs>
            <circle class="aura" cx="100" cy="108" r="80" fill="url(#${id}-a)"/>
            ${estrella(40, 60, 6)}${estrella(160, 76, 5)}${estrella(56, 150, 4)}${estrella(150, 140, 5)}`;
}

// Racha de 7+ días: llamas a los lados.
function llamas(id) {
    // Forma de gota invertida: ancha abajo y con punta arriba.
    const llama = (x, alto, ancho) =>
        `<path class="llama" d="M${x - ancho} 184
                C${x - ancho - 2} ${184 - alto * 0.45} ${x - ancho * 0.2} ${184 - alto * 0.6} ${x} ${184 - alto}
                C${x + ancho * 0.2} ${184 - alto * 0.6} ${x + ancho + 2} ${184 - alto * 0.45} ${x + ancho} 184 Z"
                fill="url(#${id}-l)" opacity=".85"/>`;
    return `<defs><linearGradient id="${id}-l" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#ea580c"/><stop offset=".55" stop-color="#f59e0b"/>
                <stop offset="1" stop-color="#fde68a" stop-opacity=".3"/></linearGradient></defs>
            ${llama(50, 62, 9)}${llama(64, 40, 7)}${llama(150, 62, 9)}${llama(136, 40, 7)}`;
}


// ===== Personaje =====

// Capa (héroe o comprada) o alas (logro). Va detrás del cuerpo.
function espalda(d) {
    const objeto = d.equipado.espalda;
    if (objeto === "alas") {
        const ala = `<path d="M86 112 C60 84 28 90 32 122 C42 116 48 124 48 132 C56 124 64 130 66 140
                              C72 130 80 130 86 126 Z" fill="#e0f2fe" fill-opacity=".9" stroke="#7dd3fc" stroke-width="1.5"/>`;
        return `<g class="alas">${ala}<g transform="translate(200 0) scale(-1 1)">${ala}</g></g>`;
    }
    let color = null;
    if (objeto === "capa") color = "#b91c1c";
    else if (conAdornosDeOro(d)) color = d.clase.oscuro;   // capa de héroe
    if (!color) return "";
    return `<path d="M80 104 Q100 98 120 104 L138 172 Q100 182 62 172 Z" fill="${color}"
                  stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-linejoin="round"/>
            ${conAdornosDeOro(d) ? `<path d="M62 172 Q100 182 138 172" fill="none" stroke="${ORO}" stroke-width="2.5"/>` : ""}`;
}

function piernas(d) {
    const novato = d.etapa.clave === "novato";
    const zapatos = novato
        ? `<ellipse cx="91" cy="173" rx="8" ry="4.5" fill="#8b5e3c"/><ellipse cx="109" cy="173" rx="8" ry="4.5" fill="#8b5e3c"/>`
        : `<rect x="83" y="158" width="15" height="17" rx="5" fill="#3b2416"/><rect x="102" y="158" width="15" height="17" rx="5" fill="#3b2416"/>
           <rect x="83" y="158" width="15" height="4" rx="2" fill="${conAdornosDeOro(d) ? ORO : "#5b3a22"}"/>
           <rect x="102" y="158" width="15" height="4" rx="2" fill="${conAdornosDeOro(d) ? ORO : "#5b3a22"}"/>`;
    return `<rect x="86" y="142" width="11" height="30" rx="4" fill="#3f3a5a"/>
            <rect x="103" y="142" width="11" height="30" rx="4" fill="#3f3a5a"/>
            ${zapatos}`;
}

function torso(d) {
    const { tela, sombra } = ropa(d);
    const oro = conAdornosDeOro(d);
    const r = d.rasgos;
    let adornos = "";

    // Riqueza: cadena de oro con medalla.
    if (r.riqueza >= 1) {
        adornos += `<path d="M89 103 Q100 124 111 103" fill="none" stroke="${ORO}" stroke-width="2.2"/>
                    <circle cx="100" cy="117" r="4" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width="1"/>`;
    }
    // Carisma: corbatín; y con más carisma, un broche de rosa.
    if (r.carisma >= 1) {
        adornos += `<path d="M100 104 L91 99 L91 109 Z M100 104 L109 99 L109 109 Z" fill="#e11d48" stroke="#9f1239" stroke-width="1"/>
                    <circle cx="100" cy="104" r="2.5" fill="#9f1239"/>`;
    }
    if (r.carisma >= 2) {
        adornos += `<circle cx="113" cy="118" r="4.5" fill="#f43f5e" stroke="#be123c" stroke-width="1"/>
                    <path d="M111 121 q-4 4 -6 2" stroke="#16a34a" stroke-width="2" fill="none"/>`;
    }
    // Desde aventurero: bolsita en el cinturón.
    if (d.etapa.clave !== "novato") {
        adornos += `<rect x="112" y="135" width="9" height="9" rx="2" fill="#6b4a2b" stroke="#3b2416" stroke-width="1"/>`;
    }

    return `<rect x="94" y="94" width="12" height="12" fill="${PIEL}"/>
            <path d="M80 104 Q100 99 120 104 L126 150 Q100 157 74 150 Z" fill="${tela}" stroke="${sombra}"
                  stroke-width="2" stroke-linejoin="round"/>
            <path d="M93 102 L100 111 L107 102" fill="none" stroke="${sombra}" stroke-width="2"/>
            <rect x="76" y="128" width="48" height="7" rx="2" fill="${oro ? "#4a2c12" : "#6b4a2b"}"/>
            <rect x="96" y="126.5" width="8" height="10" rx="1.5" fill="${oro ? ORO : "#a8865a"}"/>
            ${oro ? `<path d="M74 150 Q100 157 126 150" fill="none" stroke="${ORO}" stroke-width="3"/>` : ""}
            ${adornos}`;
}

function brazos(d) {
    const { tela, sombra } = ropa(d);
    const grosor = d.rasgos.fuerza >= 1 ? 14 : 11;   // Fuerza: brazos más fuertes
    const brazo = (x1, x2) =>
        `<line x1="${x1}" y1="108" x2="${x2}" y2="134" stroke="${sombra}" stroke-width="${grosor + 3}" stroke-linecap="round"/>
         <line x1="${x1}" y1="108" x2="${x2}" y2="134" stroke="${tela}" stroke-width="${grosor}" stroke-linecap="round"/>`;
    const mano = (x) => `<circle cx="${x}" cy="137" r="6" fill="${PIEL}" stroke="${PIEL_BORDE}" stroke-width="1"/>`;

    // Intelecto alto: libro de hechizos en la mano izquierda.
    const libro = d.rasgos.intelecto >= 2
        ? `<g transform="rotate(-12 64 136)">
               <rect x="55" y="125" width="16" height="20" rx="2" fill="#5b21b6" stroke="#2e1065" stroke-width="1.5"/>
               <rect x="57.5" y="127.5" width="11" height="15" rx="1" fill="#ede9fe"/>
               <path d="M60 131h6M60 134h6M60 137h4" stroke="#8b5cf6" stroke-width="1"/>
           </g>`
        : "";

    // Fuerza muy alta: hombreras de armadura.
    const hombreras = d.rasgos.fuerza >= 2
        ? `<g fill="#cbd5e1" stroke="#64748b" stroke-width="1.5">
               <ellipse cx="79" cy="106" rx="11" ry="7"/><ellipse cx="121" cy="106" rx="11" ry="7"/></g>
           <g fill="#64748b"><circle cx="75" cy="105" r="1.3"/><circle cx="83" cy="105" r="1.3"/>
               <circle cx="117" cy="105" r="1.3"/><circle cx="125" cy="105" r="1.3"/></g>`
        : "";

    return `${brazo(82, 70)}${libro}${mano(69)}
            ${brazo(118, 130)}${objetoEnMano(d.equipado.mano)}${mano(131)}
            ${hombreras}`;
}

// Lo que sostiene en la mano derecha (centro de la mano: 131, 137).
function objetoEnMano(id) {
    switch (id) {
        case "espada-madera":
            return `<path d="M128 96 L131 88 L134 96 Z" fill="#c08a4a" stroke="#7c4a1d" stroke-width="1"/>
                    <rect x="128" y="95" width="6" height="38" rx="1.5" fill="#c08a4a" stroke="#7c4a1d" stroke-width="1"/>
                    <rect x="122" y="131" width="18" height="5" rx="2" fill="#7c4a1d"/>
                    <rect x="129" y="136" width="4" height="12" fill="#5b3716"/>
                    <circle cx="131" cy="150" r="3" fill="#7c4a1d"/>`;
        case "espada-jefe":
            return `<path class="orbe" d="M131 70 L139 82 L139 132 L123 132 L123 82 Z" fill="#f43f5e" opacity=".35"/>
                    <path d="M131 74 L137 84 L137 131 L125 131 L125 84 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.2"/>
                    <path d="M131 80 L131 128" stroke="#94a3b8" stroke-width="1.5"/>
                    <rect x="117" y="130" width="28" height="6" rx="3" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width="1"/>
                    <circle cx="131" cy="133" r="3" fill="#e11d48"/>
                    <rect x="129" y="136" width="4" height="12" fill="#7f1d1d"/>
                    <circle cx="131" cy="150" r="3.5" fill="${ORO}"/>`;
        case "baston":
            return `<line x1="133" y1="84" x2="133" y2="176" stroke="#7c4a1d" stroke-width="5" stroke-linecap="round"/>
                    <path d="M127 86 Q133 80 139 86" fill="none" stroke="#7c4a1d" stroke-width="3"/>
                    <circle class="orbe" cx="133" cy="76" r="11" fill="#22d3ee" opacity=".35"/>
                    <circle cx="133" cy="76" r="6.5" fill="#67e8f9" stroke="#0e7490" stroke-width="1.5"/>`;
        case "laud":
            return `<line x1="135" y1="136" x2="157" y2="100" stroke="#7c4a1d" stroke-width="5" stroke-linecap="round"/>
                    <rect x="152" y="89" width="9" height="12" rx="2" fill="#5b3716" transform="rotate(32 156 95)"/>
                    <ellipse cx="137" cy="147" rx="12" ry="15" fill="#d97706" stroke="#92400e" stroke-width="1.5"
                             transform="rotate(-28 137 147)"/>
                    <circle cx="138" cy="145" r="3.5" fill="#451a03"/>
                    <line x1="140" y1="151" x2="155" y2="101" stroke="#fde68a" stroke-width=".7"/>`;
        default:
            return "";
    }
}

function cabeza(d) {
    const r = d.rasgos;
    const animo = d.animo;
    const contento = animo === "feliz" || animo === "llamas";

    // Ojos según el ánimo.
    const ojo = (x) => {
        if (animo === "dormido") {
            return `<path d="M${x - 5} 72 Q${x} 77 ${x + 5} 72" fill="none" stroke="${OJOS}" stroke-width="2.5" stroke-linecap="round"/>`;
        }
        if (animo === "cansado") {
            return `<path d="M${x - 5} 71 h10" stroke="${OJOS}" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M${x - 4} 72 Q${x} 77 ${x + 4} 72 Z" fill="${OJOS}"/>`;
        }
        return `<ellipse cx="${x}" cy="72" rx="4" ry="5" fill="${OJOS}"/>
                <circle cx="${x + 1.5}" cy="70" r="1.5" fill="#fff"/>`;
    };

    // Boca según el ánimo (y más grande con carisma).
    let boca;
    if (animo === "dormido") {
        boca = `<circle cx="100" cy="89" r="2.5" fill="${BOCA}"/>`;
    } else if (animo === "cansado") {
        boca = `<path d="M96 89 h8" stroke="${BOCA}" stroke-width="2" stroke-linecap="round"/>`;
    } else if (contento) {
        boca = r.carisma >= 1
            ? `<path d="M89 84 Q100 99 111 84 Z" fill="${BOCA}"/><rect x="92" y="84.5" width="16" height="3" rx="1" fill="#fff"/>
               <ellipse cx="100" cy="92" rx="4" ry="2" fill="#fb7185"/>`
            : `<path d="M92 85 Q100 96 108 85 Z" fill="${BOCA}"/><ellipse cx="100" cy="90.5" rx="3" ry="1.6" fill="#fb7185"/>`;
    } else {
        boca = r.carisma >= 1
            ? `<path d="M90 85 Q100 94 110 85" fill="none" stroke="${BOCA}" stroke-width="2.4" stroke-linecap="round"/>`
            : `<path d="M94 86 Q100 91 106 86" fill="none" stroke="${BOCA}" stroke-width="2.2" stroke-linecap="round"/>`;
    }

    const cejas = animo === "llamas"   // decidido
        ? `<path d="M81 62 L94 65 M119 62 L106 65" stroke="${PELO}" stroke-width="3" stroke-linecap="round"/>`
        : "";
    const rubor = contento || r.carisma >= 1
        ? `<ellipse cx="79" cy="83" rx="5" ry="3" fill="#fb7185" opacity=".45"/>
           <ellipse cx="121" cy="83" rx="5" ry="3" fill="#fb7185" opacity=".45"/>`
        : "";
    const lentes = r.intelecto >= 1   // Intelecto: lentes de sabio
        ? `<g fill="rgba(255,255,255,.18)" stroke="#1e293b" stroke-width="2">
               <circle cx="88" cy="72" r="8"/><circle cx="112" cy="72" r="8"/></g>
           <path d="M96 72 h8 M80 70 L68 67 M120 70 L132 67" stroke="#1e293b" stroke-width="2"/>`
        : "";
    const aretes = r.riqueza >= 2     // Riqueza alta: aretes de oro
        ? `<circle cx="66" cy="80" r="2.6" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".8"/>
           <circle cx="134" cy="80" r="2.6" fill="${ORO}" stroke="${ORO_OSCURO}" stroke-width=".8"/>`
        : "";

    return `<circle cx="67" cy="73" r="6" fill="${PIEL}" stroke="${PIEL_BORDE}" stroke-width="1"/>
            <circle cx="133" cy="73" r="6" fill="${PIEL}" stroke="${PIEL_BORDE}" stroke-width="1"/>
            ${aretes}
            <circle cx="100" cy="68" r="34" fill="${PIEL}" stroke="${PIEL_BORDE}" stroke-width="1.5"/>
            <path d="M66 70 C62 40 82 30 100 30 C120 30 140 40 134 70 C130 58 124 50 116 48
                     C110 56 98 58 88 52 C80 56 72 62 66 70 Z" fill="${PELO}"/>
            ${cejas}${ojo(88)}${ojo(112)}${lentes}${rubor}${boca}`;
}

// Lo que lleva en la cabeza.
function sombrero(id) {
    switch (id) {
        case "gorra":
            return `<path d="M67 60 Q68 30 100 30 Q132 30 133 60 Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="2"/>
                    <path d="M98 58 Q128 53 150 63 Q128 68 98 62 Z" fill="#1e40af" stroke="#1e3a8a" stroke-width="1.5"/>
                    <circle cx="100" cy="31" r="3" fill="#1e3a8a"/>
                    <circle cx="100" cy="46" r="5" fill="#fff"/><circle cx="100" cy="46" r="2.5" fill="#2563eb"/>`;
        case "sombrero-mago":
            return `<path d="M70 48 L102 2 Q110 22 130 48 Z" fill="#6d28d9" stroke="#4c1d95" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M74 44 Q100 51 126 44" fill="none" stroke="${ORO}" stroke-width="3"/>
                    <ellipse cx="100" cy="48" rx="42" ry="8" fill="#5b21b6" stroke="#4c1d95" stroke-width="2"/>
                    ${estrella(94, 30, 4, "")}${estrella(107, 16, 3, "")}${estrella(113, 36, 3, "")}`;
        case "casco":
            return `<path d="M64 62 Q64 26 100 26 Q136 26 136 62 Q118 54 100 54 Q82 54 64 62 Z" fill="#cbd5e1"
                          stroke="#64748b" stroke-width="2"/>
                    <path d="M100 28 L100 54" stroke="#94a3b8" stroke-width="3"/>
                    <path d="M100 26 Q92 6 114 6 Q104 14 106 26 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
                    <g fill="#64748b"><circle cx="74" cy="54" r="1.5"/><circle cx="126" cy="54" r="1.5"/></g>`;
        case "corona":
            return `<path d="M74 42 L78 18 L90 32 L100 12 L110 32 L122 18 L126 42 Z" fill="${ORO}" stroke="${ORO_OSCURO}"
                          stroke-width="2" stroke-linejoin="round"/>
                    <circle cx="100" cy="32" r="3.5" fill="#e11d48"/>
                    <circle cx="86" cy="36" r="2.5" fill="#3b82f6"/><circle cx="114" cy="36" r="2.5" fill="#10b981"/>
                    ${estrella(122, 16, 4)}`;
        default:
            return "";
    }
}

// Brillos si está feliz, Zzz si está dormido.
function adornosDeAnimo(d) {
    if (d.animo === "dormido") {
        return `<g class="zzz" fill="#a5b4fc" font-family="Orbitron, sans-serif" font-weight="800">
                    <text x="128" y="46" font-size="12">z</text>
                    <text x="139" y="33" font-size="16">Z</text>
                    <text x="152" y="18" font-size="20">Z</text></g>`;
    }
    if (d.animo === "feliz" || d.animo === "llamas") {
        return `${estrella(50, 42, 5)}${estrella(152, 50, 4)}${estrella(142, 22, 3)}`;
    }
    return "";
}


// ===== Mascota =====
// Se dibuja alrededor del punto (0, 0) y luego se mueve a su lugar con translate.

function mascota(m) {
    return `<g transform="translate(168 166)">${cuerpoMascota(m)}</g>`;
}

// La mascota sola, en grande (para la pantalla Personaje).
export function dibujarMascota(m) {
    return `<svg class="avatar-svg" viewBox="-34 -30 68 52" role="img" aria-label="Mascota: ${m.etapa.nombre}"
                 xmlns="http://www.w3.org/2000/svg">${cuerpoMascota(m)}</svg>`;
}

function cuerpoMascota(m) {
    const triste = m.triste;
    // Triste: ojitos cerrados hacia abajo (∩), como a punto de llorar.
    const ojos = (x, y, r) => triste
        ? `<path d="M${-x - r} ${y + 1} Q${-x} ${y - r} ${-x + r} ${y + 1} M${x - r} ${y + 1} Q${x} ${y - r} ${x + r} ${y + 1}"
                 fill="none" stroke="${OJOS}" stroke-width="1.6" stroke-linecap="round"/>`
        : `<circle cx="${-x}" cy="${y}" r="${r}" fill="${OJOS}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${OJOS}"/>
           <circle cx="${-x + 0.8}" cy="${y - 0.8}" r="${r * 0.35}" fill="#fff"/><circle cx="${x + 0.8}" cy="${y - 0.8}" r="${r * 0.35}" fill="#fff"/>`;
    const boca = (y) => triste
        ? `<path d="M-3 ${y + 2} Q0 ${y - 1} 3 ${y + 2}" fill="none" stroke="${OJOS}" stroke-width="1.5" stroke-linecap="round"/>
           <path d="M-7 ${y - 4} q-2 4 0 5.5 q2 -1.5 0 -5.5z" fill="#93c5fd"/>`
        : `<path d="M-3 ${y} Q0 ${y + 3} 3 ${y}" fill="none" stroke="${OJOS}" stroke-width="1.5" stroke-linecap="round"/>`;

    let cuerpo;
    if (m.etapa.clave === "huevo") {
        cuerpo = `<ellipse cx="0" cy="17" rx="11" ry="3" fill="#000" opacity=".3"/>
                  <g class="huevo">
                      <ellipse cx="0" cy="2" rx="11" ry="14" fill="#fef3c7" stroke="#d6b36a" stroke-width="1.5"/>
                      <circle cx="-4" cy="-3" r="3" fill="#67e8f9"/><circle cx="5" cy="4" r="2.5" fill="#c4b5fd"/>
                      <circle cx="-2" cy="9" r="2" fill="#67e8f9"/>
                  </g>`;
    } else if (m.etapa.clave === "cria") {
        const ala = `<path d="M-10 -1 L-19 -8 L-15 4 Z" fill="#a5f3fc" stroke="#0e7490" stroke-width="1"/>`;
        cuerpo = `<ellipse cx="0" cy="15" rx="12" ry="3" fill="#000" opacity=".3"/>
                  <g class="mascota-cuerpo">
                      ${ala}<g transform="scale(-1 1)">${ala}</g>
                      <circle cx="0" cy="2" r="12" fill="#22d3ee" stroke="#0e7490" stroke-width="1.5"/>
                      <ellipse cx="0" cy="7" rx="7" ry="4.5" fill="#cffafe"/>
                      ${ojos(4, -1, 2)}${boca(4)}
                  </g>`;
    } else {
        const ala = `<path d="M-12 -5 L-28 -18 L-25 0 L-16 3 Z" fill="#c4b5fd" stroke="#6d28d9" stroke-width="1.2"/>`;
        cuerpo = `<ellipse cx="0" cy="17" rx="16" ry="3.5" fill="#000" opacity=".3"/>
                  <g class="mascota-cuerpo">
                      <path d="M13 9 Q28 8 25 -5 Q23 6 11 4 Z" fill="#7c3aed"/>
                      ${ala}<g transform="scale(-1 1)">${ala}</g>
                      <ellipse cx="0" cy="2" rx="16" ry="15" fill="#8b5cf6" stroke="#5b21b6" stroke-width="1.5"/>
                      <ellipse cx="0" cy="7" rx="9" ry="7" fill="#ede9fe"/>
                      <path d="M-8 -11 L-11 -21 L-4 -13 Z M8 -11 L11 -21 L4 -13 Z" fill="#fde68a" stroke="#b45309" stroke-width="1"/>
                      ${ojos(5, -2, 2.5)}${boca(4)}
                  </g>`;
    }
    return `<g class="mascota ${triste ? "triste" : ""}">${cuerpo}</g>`;
}



// ===== Jefes =====
// Lienzo de 160 × 160, suelo en y = 148. Cada monstruo tiene su cuerpo y
// todos comparten la misma cara, que cambia según la vida que les queda:
//   furioso (más del 60 %), herido (30–60 %), agotado (menos del 30 %), derrotado (0).

const NEGRO = "#111827";

// tipo: clave de MONSTRUOS (juego.js); estado: furioso | herido | agotado | derrotado
export function dibujarJefe(tipo, estado, { mini = false } = {}) {
    const dibujo = MONSTRUOS_DIBUJO[tipo] || MONSTRUOS_DIBUJO.dragon;
    const extras = estado === "agotado" ? mareo(dibujo.cara) : estado === "derrotado" ? ko(dibujo.cara) : "";
    const vista = mini ? "20 14 120 120" : "0 0 160 160";
    return `<svg class="jefe-svg ${estado}" viewBox="${vista}" role="img" aria-label="Jefe ${estado}"
                 xmlns="http://www.w3.org/2000/svg">
                ${mini ? "" : '<ellipse cx="80" cy="150" rx="46" ry="7" fill="#000" opacity=".35"/>'}
                <g class="monstruo">${dibujo.cuerpo()}${cara(dibujo.cara, estado)}${extras}</g>
            </svg>`;
}

// La cara: ojos, cejas y boca alrededor del punto (x, y).
// "trazo" es el color de los ojos en X o en espiral (el esqueleto los necesita
// claros porque sus cuencas son negras).
function cara({ x, y, ojos = "#fde047", trazo = NEGRO }, estado) {
    const ojoIzq = x - 10;
    const ojoDer = x + 10;
    const oy = y - 4;

    if (estado === "derrotado") {   // ojos en X
        return `<path d="M${ojoIzq - 4} ${oy - 4} l8 8 M${ojoIzq + 4} ${oy - 4} l-8 8
                         M${ojoDer - 4} ${oy - 4} l8 8 M${ojoDer + 4} ${oy - 4} l-8 8"
                      stroke="${trazo}" stroke-width="2.8" stroke-linecap="round"/>
                <path d="M${x - 7} ${y + 11} h14" stroke="${NEGRO}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    if (estado === "agotado") {     // ojos en espiral y lengua afuera
        const espiral = (ex) => `<path d="M${ex} ${oy} m-4 0 a4 4 0 1 1 4 4 a2.6 2.6 0 1 1 -2.6 -2.6"
                                       fill="none" stroke="${trazo}" stroke-width="2" stroke-linecap="round"/>`;
        return `${espiral(ojoIzq)}${espiral(ojoDer)}
                <path d="M${x - 7} ${y + 10} Q${x} ${y + 14} ${x + 7} ${y + 10}" fill="none" stroke="${NEGRO}" stroke-width="2.2"/>
                <ellipse cx="${x + 3}" cy="${y + 15}" rx="3.2" ry="4" fill="#fb7185"/>`;
    }

    const ojo = (ex) => `<ellipse cx="${ex}" cy="${oy}" rx="5.5" ry="5" fill="${ojos}" stroke="${NEGRO}" stroke-width="1.2"/>
                         <rect x="${ex - 1.2}" y="${oy - 4}" width="2.4" height="8" rx="1.2" fill="${NEGRO}"/>`;

    if (estado === "herido") {      // ojos a medio cerrar, sudor y curita
        return `${ojo(ojoIzq)}${ojo(ojoDer)}
                <path d="M${ojoIzq - 6} ${oy - 2} h12 M${ojoDer - 6} ${oy - 2} h12" stroke="${NEGRO}" stroke-width="3" stroke-linecap="round"/>
                <path d="M${x - 8} ${y + 12} q4 -3 8 0 q4 3 8 0" fill="none" stroke="${NEGRO}" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M${x + 19} ${y - 14} q-3 5 0 7 q3 -2 0 -7z" fill="#7dd3fc"/>
                <g transform="rotate(-30 ${x - 16} ${y - 14})">
                    <rect x="${x - 24}" y="${y - 17.5}" width="16" height="7" rx="3" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
                    <path d="M${x - 18} ${y - 14} h4 M${x - 16} ${y - 16} v4" stroke="#d97706" stroke-width="1"/>
                </g>`;
    }

    // Furioso: cejas enojadas y colmillos.
    return `<path d="M${ojoIzq - 7} ${oy - 10} L${ojoIzq + 5} ${oy - 5} M${ojoDer + 7} ${oy - 10} L${ojoDer - 5} ${oy - 5}"
                  stroke="${NEGRO}" stroke-width="3.2" stroke-linecap="round"/>
            ${ojo(ojoIzq)}${ojo(ojoDer)}
            <path d="M${x - 11} ${y + 8} L${x + 11} ${y + 8} L${x + 8} ${y + 16} L${x - 8} ${y + 16} Z" fill="${NEGRO}"/>
            <path d="M${x - 8} ${y + 8} l2.5 5 2.5 -5 Z M${x + 3} ${y + 8} l2.5 5 2.5 -5 Z" fill="#fff"/>`;
}

// Estrellas de mareo girando sobre la cabeza.
function mareo({ x, y }) {
    return `<g class="mareo">${estrella(x - 16, y - 30, 4, "")}${estrella(x, y - 36, 5, "")}${estrella(x + 16, y - 30, 4, "")}</g>`;
}

function ko({ x, y }) {
    return `<text x="${x}" y="${y - 30}" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="800"
                  font-size="16" fill="#fde68a" stroke="${NEGRO}" stroke-width=".8">K.O.</text>`;
}

const MONSTRUOS_DIBUJO = {
    dragon: {
        cara: { x: 80, y: 62 },
        cuerpo: () => `
            <path d="M110 128 Q152 126 148 96 Q140 116 112 116 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
            <path d="M54 76 L14 38 L22 86 L42 84 Z M106 76 L146 38 L138 86 L118 84 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2" stroke-linejoin="round"/>
            <ellipse cx="64" cy="140" rx="11" ry="8" fill="#b91c1c"/><ellipse cx="96" cy="140" rx="11" ry="8" fill="#b91c1c"/>
            <ellipse cx="80" cy="108" rx="35" ry="32" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
            <ellipse cx="80" cy="116" rx="20" ry="21" fill="#fecaca"/>
            <path d="M68 104 h24 M66 114 h28 M68 124 h24" stroke="#fca5a5" stroke-width="2"/>
            <ellipse cx="50" cy="108" rx="7" ry="11" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
            <ellipse cx="110" cy="108" rx="7" ry="11" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
            <path d="M60 44 L54 20 L70 38 Z M100 44 L106 20 L90 38 Z" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
            <circle cx="80" cy="60" r="27" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
            <ellipse cx="80" cy="74" rx="15" ry="9" fill="#ef4444"/>
            <circle cx="75" cy="72" r="1.6" fill="#7f1d1d"/><circle cx="85" cy="72" r="1.6" fill="#7f1d1d"/>`,
    },
    golem: {
        cara: { x: 80, y: 60, ojos: "#67e8f9" },
        cuerpo: () => `
            <rect x="52" y="130" width="22" height="18" rx="5" fill="#57534e"/><rect x="86" y="130" width="22" height="18" rx="5" fill="#57534e"/>
            <rect x="22" y="82" width="24" height="48" rx="11" fill="#78716c" stroke="#44403c" stroke-width="2"/>
            <rect x="114" y="82" width="24" height="48" rx="11" fill="#78716c" stroke="#44403c" stroke-width="2"/>
            <circle cx="34" cy="134" r="13" fill="#57534e" stroke="#44403c" stroke-width="2"/>
            <circle cx="126" cy="134" r="13" fill="#57534e" stroke="#44403c" stroke-width="2"/>
            <rect x="42" y="78" width="76" height="60" rx="15" fill="#78716c" stroke="#44403c" stroke-width="2"/>
            <path d="M58 92 l8 10 -6 8 10 12 M104 90 l-7 12 9 7" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
            <rect x="54" y="36" width="52" height="46" rx="11" fill="#a8a29e" stroke="#44403c" stroke-width="2"/>
            <ellipse cx="66" cy="38" rx="11" ry="5" fill="#4d7c0f"/><ellipse cx="94" cy="80" rx="7" ry="3" fill="#4d7c0f"/>`,
    },
    slime: {
        cara: { x: 80, y: 104 },
        cuerpo: () => `
            <path d="M28 142 Q24 96 52 74 Q80 52 108 74 Q136 96 132 142 Q121 148 110 141 Q100 149 90 141
                     Q80 149 70 141 Q60 149 50 141 Q39 148 28 142 Z" fill="#22c55e" fill-opacity=".92" stroke="#15803d" stroke-width="2.5"/>
            <ellipse cx="58" cy="84" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-30 58 84)"/>
            <circle cx="108" cy="122" r="4" fill="#bbf7d0" opacity=".7"/><circle cx="50" cy="126" r="3" fill="#bbf7d0" opacity=".7"/>
            <path d="M74 60 L70 44 L80 54 L88 40 L90 58 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" stroke-linejoin="round"/>`,
    },
    esqueleto: {
        cara: { x: 80, y: 62, ojos: "#f43f5e", trazo: "#f43f5e" },
        cuerpo: () => `
            <g stroke="#e5e7eb" stroke-width="5" stroke-linecap="round" fill="none">
                <path d="M80 88 V136"/>
                <path d="M62 100 Q80 110 98 100 M64 112 Q80 121 96 112 M66 123 Q80 131 94 123"/>
                <path d="M64 94 L44 120 M96 94 L116 120"/>
                <path d="M72 140 L66 150 M88 140 L94 150"/>
            </g>
            <circle cx="43" cy="123" r="5" fill="#e5e7eb"/><circle cx="117" cy="123" r="5" fill="#e5e7eb"/>
            <ellipse cx="80" cy="138" rx="15" ry="6" fill="#e5e7eb"/>
            <path d="M58 30 Q80 20 102 30 L98 44 L62 44 Z" fill="#4c1d95"/>
            <circle cx="80" cy="60" r="25" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2"/>
            <rect x="67" y="76" width="26" height="12" rx="4" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2"/>
            <path d="M73 77 v10 M80 77 v10 M87 77 v10" stroke="#9ca3af" stroke-width="1.5"/>
            <ellipse cx="70" cy="57" rx="8" ry="9" fill="#1f2937"/><ellipse cx="90" cy="57" rx="8" ry="9" fill="#1f2937"/>
            <path d="M78 66 L80 70 L82 66 Z" fill="#1f2937"/>`,
    },
    kraken: {
        cara: { x: 80, y: 84 },
        cuerpo: () => `
            <g fill="none" stroke="#6d28d9" stroke-width="10" stroke-linecap="round">
                <path d="M56 108 Q40 128 52 142 Q58 150 46 152"/>
                <path d="M68 112 Q62 132 70 146"/>
                <path d="M92 112 Q98 132 90 146"/>
                <path d="M104 108 Q120 128 108 142 Q102 150 114 152"/>
            </g>
            <path d="M42 112 Q38 40 80 32 Q122 40 118 112 Q80 122 42 112 Z" fill="#7c3aed" stroke="#4c1d95" stroke-width="2.5"/>
            <circle cx="64" cy="54" r="6" fill="#a78bfa"/><circle cx="98" cy="50" r="4" fill="#a78bfa"/>
            <circle cx="104" cy="70" r="5" fill="#a78bfa"/><circle cx="56" cy="74" r="3.5" fill="#a78bfa"/>`,
    },
    demonio: {
        cara: { x: 80, y: 62, ojos: "#fbbf24" },
        cuerpo: () => `
            <path d="M52 80 Q20 54 8 78 Q22 78 22 94 Q32 86 36 102 Q44 92 54 100 Z" fill="#4c0519" stroke="#1f0410" stroke-width="1.5"/>
            <path d="M108 80 Q140 54 152 78 Q138 78 138 94 Q128 86 124 102 Q116 92 106 100 Z" fill="#4c0519" stroke="#1f0410" stroke-width="1.5"/>
            <path d="M104 134 Q136 142 138 116" fill="none" stroke="#9f1239" stroke-width="4" stroke-linecap="round"/>
            <path d="M132 118 L140 108 L144 122 Z" fill="#9f1239"/>
            <line x1="122" y1="58" x2="122" y2="148" stroke="#6b7280" stroke-width="3"/>
            <path d="M114 70 V58 M122 66 V52 M130 70 V58 M114 70 H130" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M56 90 Q80 82 104 90 L112 140 Q80 148 48 140 Z" fill="#9f1239" stroke="#4c0519" stroke-width="2"/>
            <path d="M68 140 v8 M92 140 v8" stroke="#4c0519" stroke-width="8" stroke-linecap="round"/>
            <circle cx="117" cy="104" r="6" fill="#be123c"/>
            <path d="M62 46 Q48 30 58 16 Q62 34 72 42 Z M98 46 Q112 30 102 16 Q98 34 88 42 Z" fill="#1f2937"/>
            <circle cx="80" cy="62" r="25" fill="#be123c" stroke="#4c0519" stroke-width="2"/>`,
    },
};
