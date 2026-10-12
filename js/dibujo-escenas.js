// dibujo-escenas.js — Fondos y efectos de luz.
//
// Tres tipos de dibujos:
//   1. El fondo del avatar (lienzo de 200 × 200). Cada ETAPA tiene el suyo
//      (aldea → camino → fortaleza → cumbre) y además se pueden comprar otros.
//   2. Efectos detrás del personaje: aura de leyenda, llamas de la racha, noche.
//   3. Los escenarios de batalla de cada campaña (lienzo ancho, de 320 × 180).
//
// El truco para que un paisaje se vea profundo: capas. Lo que está lejos se pinta
// primero, más claro y azulado; lo que está cerca, después y más oscuro.

import { TRAZO, vertical, halo, destello } from "./dibujo-base.js";

// Estrellas repartidas "al azar", pero siempre en el mismo sitio (para que no bailen).
function estrellas(cantidad, ancho, alto, semilla = 3) {
    let n = semilla;
    const azar = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
    let salida = "";
    for (let i = 0; i < cantidad; i++) {
        const [x, y, r] = [azar() * ancho, azar() * alto, 0.35 + azar() * 0.75];
        salida += `<circle ${i % 5 === 0 ? 'class="chispa"' : ""} cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.4 + azar() * 0.6).toFixed(2)}"/>`;
    }
    return salida;
}

// Una fila de montañas: picos unidos por líneas, hasta el borde de abajo.
function montanas(picos, base, color, ancho = 200) {
    const camino = picos.map(([x, y]) => `L${x} ${y}`).join(" ");
    return `<path d="M0 ${base} ${camino} L${ancho} ${base} L${ancho} 200 L0 200 Z" fill="${color}"/>`;
}

function pino(x, base, alto, color) {
    const a = alto;
    return `<path d="M${x} ${base - a} L${x + a * 0.2} ${base - a * 0.62} L${x + a * 0.11} ${base - a * 0.62} L${x + a * 0.29} ${base - a * 0.3} L${x + a * 0.15} ${base - a * 0.3}
                     L${x + a * 0.36} ${base} L${x - a * 0.36} ${base} L${x - a * 0.15} ${base - a * 0.3} L${x - a * 0.29} ${base - a * 0.3}
                     L${x - a * 0.11} ${base - a * 0.62} L${x - a * 0.2} ${base - a * 0.62} Z" fill="${color}"/>`;
}


// ===== 1. Fondos del avatar =====

export function fondo(d, p) {
    const id = p.id;
    const luzClase = `<defs>${halo(`${id}-clase`, d.clase.color, 0.34)}</defs><circle cx="100" cy="100" r="92" fill="url(#${id}-clase)"/>`;

    switch (d.equipado.fondo || `etapa-${p.etapa}`) {
        case "etapa-0":     // Novato: una aldea al amanecer
            return `<defs>${vertical(`${id}-f`, ["#1c1a3f", "#4a3566", "#b0627a", "#f0a86a"])}${halo(`${id}-sol`, "#ffe2a8", 0.9)}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    <circle cx="150" cy="128" r="46" fill="url(#${id}-sol)"/>
                    ${montanas([[30, 112], [62, 124], [96, 104], [140, 126], [176, 110]], 122, "#5a3f6e")}
                    ${montanas([[26, 136], [70, 128], [120, 140], [170, 130]], 138, "#3a2a52")}
                    <!-- casas con techo de paja y una ventana encendida -->
                    <g fill="#241a38"><path d="M14 150 L14 132 L28 120 L42 132 L42 150 Z M150 152 L150 136 L166 123 L182 136 L182 152 Z M46 152 L46 140 L56 132 L66 140 L66 152 Z"/>
                        <rect x="34" y="112" width="4" height="12"/></g>
                    <g fill="#ffc46b"><rect x="24" y="137" width="6" height="7" rx="1"/><rect x="162" y="140" width="6" height="7" rx="1"/><rect x="54" y="143" width="4" height="5" rx="1"/></g>
                    <path d="M36 110 q-3 -6 1 -10 q-2 -5 2 -9" fill="none" stroke="#fff" stroke-width="2" opacity=".14" stroke-linecap="round"/>
                    <path d="M0 150 Q60 142 100 148 Q150 154 200 146 L200 200 L0 200 Z" fill="#1a1428"/>
                    <path d="M0 168 Q100 158 200 170 L200 200 L0 200 Z" fill="#120d1e"/>
                    ${luzClase}`;

        case "etapa-1":     // Aventurero: el camino entre montañas
            return `<defs>${vertical(`${id}-f`, ["#0c1b3a", "#16416b", "#3f8f9a", "#bfe0c8"])}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    <circle cx="46" cy="52" r="13" fill="#f4f0d8" opacity=".85"/><circle cx="50" cy="48" r="12" fill="#16416b" opacity=".55"/>
                    ${montanas([[22, 96], [48, 70], [70, 96], [104, 62], [134, 98], [162, 78], [186, 98]], 104, "#3b7186")}
                    <path d="M104 62 L96 76 L103 73 L108 80 L113 72 Z M48 70 L43 80 L49 78 L53 83 Z" fill="#e8f4f2" opacity=".75"/>
                    ${montanas([[30, 118], [66, 100], [98, 122], [140, 104], [180, 122]], 124, "#24506a")}
                    ${montanas([[40, 140], [90, 130], [150, 142]], 142, "#16344c")}
                    <!-- camino que se pierde a lo lejos -->
                    <path d="M92 200 Q96 170 108 152 Q114 144 110 138 L114 138 Q122 146 118 156 Q114 172 128 200 Z" fill="#c8b48a" opacity=".35"/>
                    ${pino(18, 176, 62, "#0b2030")}${pino(40, 172, 40, "#0e2a3c")}${pino(182, 178, 68, "#0b2030")}${pino(160, 172, 42, "#0e2a3c")}
                    <path d="M0 172 Q100 160 200 174 L200 200 L0 200 Z" fill="#0a1a26"/>
                    ${luzClase}`;

        case "etapa-2":     // Héroe: las murallas de la fortaleza
            return `<defs>${vertical(`${id}-f`, ["#0a0d2c", "#1c2560", "#40489a", "#8a79c0"])}${halo(`${id}-antorcha`, "#ffb347", 0.85)}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    ${estrellas(26, 200, 80, 11)}
                    <!-- torres y muralla con almenas -->
                    <g fill="#1d1c44">
                        <path d="M6 190 L6 70 L2 70 L2 60 L10 60 L10 66 L17 66 L17 60 L25 60 L25 66 L32 66 L32 60 L40 60 L40 70 L36 70 L36 190 Z"/>
                        <path d="M164 190 L164 70 L160 70 L160 60 L168 60 L168 66 L175 66 L175 60 L183 60 L183 66 L190 66 L190 60 L198 60 L198 70 L194 70 L194 190 Z"/>
                        <path d="M36 190 L36 112 L44 112 L44 106 L54 106 L54 112 L66 112 L66 106 L76 106 L76 112 L124 112 L124 106 L134 106 L134 112 L146 112 L146 106 L156 106 L156 112 L164 112 L164 190 Z" fill="#16153a"/>
                    </g>
                    <g fill="#ffc46b" opacity=".85"><rect x="17" y="84" width="6" height="11" rx="3"/><rect x="176" y="84" width="6" height="11" rx="3"/></g>
                    <g stroke="#0d0c26" stroke-width=".6" opacity=".7"><path d="M8 110 h26 M8 130 h26 M8 150 h26 M166 110 h26 M166 130 h26 M166 150 h26 M38 130 h124 M38 150 h124"/></g>
                    <!-- estandartes del color de tu clase -->
                    <g fill="${d.clase.oscuro}" stroke="${TRAZO}" stroke-width=".6">
                        <path d="M14 60 L14 36 M14 37 L30 41 L14 47" /><path d="M186 60 L186 36 M186 37 L170 41 L186 47"/></g>
                    <circle class="orbe" cx="50" cy="126" r="16" fill="url(#${id}-antorcha)"/><circle class="orbe" cx="150" cy="126" r="16" fill="url(#${id}-antorcha)"/>
                    <path d="M0 176 Q100 168 200 176 L200 200 L0 200 Z" fill="#0e0d26"/>
                    ${luzClase}`;

        case "etapa-3":     // Leyenda: la cumbre sobre las nubes
            return `<defs>${vertical(`${id}-f`, ["#12093a", "#3b1f7a", "#b4589a", "#ffd29a"])}${halo(`${id}-sol`, "#fff3c4", 0.95, 0.35)}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    ${estrellas(34, 200, 90, 5)}
                    <circle cx="100" cy="92" r="88" fill="url(#${id}-sol)"/>
                    <!-- rayos de luz -->
                    <g fill="#fff3c4" opacity=".1">${Array.from({ length: 9 }, (_, i) => {
                        const a = -Math.PI / 2 + (i - 4) * 0.34;
                        return `<path d="M100 92 L${(100 + 190 * Math.cos(a - 0.05)).toFixed(1)} ${(92 + 190 * Math.sin(a - 0.05)).toFixed(1)} L${(100 + 190 * Math.cos(a + 0.05)).toFixed(1)} ${(92 + 190 * Math.sin(a + 0.05)).toFixed(1)} Z"/>`;
                    }).join("")}</g>
                    <!-- picos lejanos que asoman entre las nubes -->
                    <path d="M18 150 L34 104 L46 126 L56 112 L70 150 Z M132 150 L150 110 L160 128 L172 98 L188 150 Z" fill="#4a2a7a" opacity=".8"/>
                    <g fill="#f6d9e6" opacity=".5"><ellipse cx="34" cy="150" rx="46" ry="9"/><ellipse cx="166" cy="148" rx="50" ry="10"/><ellipse cx="100" cy="158" rx="70" ry="9"/></g>
                    <g fill="#fff" opacity=".4"><ellipse cx="60" cy="168" rx="66" ry="10"/><ellipse cx="150" cy="172" rx="64" ry="10"/></g>
                    <path d="M40 200 Q60 178 100 176 Q140 178 160 200 Z" fill="#241247"/>
                    ${destello(34, 60, 3.4)}${destello(168, 50, 2.8)}${destello(150, 92, 2.2)}
                    ${luzClase}`;

        case "bosque":
            return `<defs>${vertical(`${id}-f`, ["#06231c", "#0e4435", "#1d6b4c", "#0a2a20"])}${halo(`${id}-luna`, "#e9f5d0", 0.8)}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    <circle cx="152" cy="44" r="34" fill="url(#${id}-luna)"/><circle cx="152" cy="44" r="12" fill="#f2f6d8"/>
                    ${[10, 34, 58, 86, 114, 140, 166, 192].map((x, i) => pino(x, 150, 64 + (i % 3) * 14, "#145040")).join("")}
                    <rect y="132" width="200" height="22" fill="#bfe6cf" opacity=".12"/>
                    ${[22, 70, 128, 178].map((x, i) => pino(x, 170, 96 + (i % 2) * 22, "#0b3328")).join("")}
                    <rect y="156" width="200" height="16" fill="#bfe6cf" opacity=".08"/>
                    ${pino(4, 192, 150, "#051a14")}${pino(196, 192, 160, "#051a14")}
                    <path d="M0 176 Q100 166 200 178 L200 200 L0 200 Z" fill="#04130e"/>
                    <g fill="#d9ff8a">${[[40, 120], [66, 150], [150, 132], [170, 160], [118, 110]].map(([x, y]) => `<circle class="chispa" cx="${x}" cy="${y}" r="1.2"/>`).join("")}</g>`;

        case "castillo":
            return `<defs>${vertical(`${id}-f`, ["#0b0a26", "#2a1b5c", "#5a3a8e", "#c77a9a"])}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    ${estrellas(30, 200, 90, 8)}
                    <circle cx="150" cy="40" r="15" fill="#f6efd8"/><circle cx="156" cy="36" r="13" fill="#2a1b5c" opacity=".9"/>
                    ${montanas([[30, 150], [100, 132], [170, 150]], 152, "#1c1440")}
                    <!-- el castillo: una torre alta a la izquierda y otra más baja a la derecha -->
                    <g fill="#120e30">
                        <path d="M22 160 L22 70 L18 70 L40 36 L62 70 L58 70 L58 160 Z"/>
                        <path d="M4 160 L4 104 L0 104 L0 96 L6 96 L6 100 L12 100 L12 96 L18 96 L18 104 L14 104 L14 160 Z"/>
                        <path d="M58 160 L58 118 L72 118 L72 112 L80 112 L80 118 L86 118 L86 160 Z"/>
                        <path d="M148 160 L148 96 L144 96 L160 70 L176 96 L172 96 L172 160 Z"/>
                        <path d="M172 160 L172 122 L180 122 L180 116 L188 116 L188 122 L200 122 L200 160 Z"/>
                        <path d="M40 36 L40 20 M160 70 L160 56" stroke="#120e30" stroke-width="1.4"/>
                    </g>
                    <g fill="${d.clase.color}"><path d="M40 20 L54 25 L40 30 Z M160 56 L171 60 L160 64 Z"/></g>
                    <g fill="#ffc46b"><rect x="36" y="78" width="8" height="13" rx="4"/><rect x="36" y="108" width="8" height="13" rx="4"/><rect x="7" y="114" width="4" height="8" rx="2"/>
                        <rect x="156" y="104" width="8" height="12" rx="4"/><rect x="68" y="130" width="6" height="10" rx="3"/><rect x="184" y="132" width="6" height="10" rx="3"/></g>
                    <path d="M0 166 Q100 150 200 166 L200 200 L0 200 Z" fill="#0c0920"/>`;

        case "galaxia":
            return `<defs><radialGradient id="${id}-f" cx="38%" cy="34%" r="90%">
                        <stop offset="0" stop-color="#5b2a9a"/><stop offset=".4" stop-color="#231a66"/><stop offset="1" stop-color="#04030f"/></radialGradient>
                        ${halo(`${id}-neb`, "#ff6ac1", 0.45)}${halo(`${id}-neb2`, "#3ad8ff", 0.4)}</defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    <ellipse cx="140" cy="70" rx="80" ry="44" fill="url(#${id}-neb)" transform="rotate(-24 140 70)"/>
                    <ellipse cx="50" cy="140" rx="74" ry="38" fill="url(#${id}-neb2)" transform="rotate(-24 50 140)"/>
                    ${estrellas(70, 200, 200, 21)}
                    <circle cx="40" cy="46" r="14" fill="#7a66c8"/><path d="M28 40 a14 14 0 0 1 22 -6 a16 16 0 0 0 -22 6 Z" fill="#fff" opacity=".3"/>
                    <ellipse cx="40" cy="46" rx="24" ry="5.4" fill="none" stroke="#e9c46a" stroke-width="1.8" transform="rotate(-20 40 46)"/>
                    <path d="M150 24 L176 14" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
                    ${destello(176, 14, 3)}${destello(166, 150, 3.4)}${destello(22, 104, 2.6)}`;

        case "salon":       // Salón de la fama: columnas doradas y rayos de luz
            return `<defs><radialGradient id="${id}-f" cx="50%" cy="38%" r="80%">
                        <stop offset="0" stop-color="#ffd27a"/><stop offset=".35" stop-color="#8a5a16"/><stop offset="1" stop-color="#1a1006"/></radialGradient></defs>
                    <rect width="200" height="200" fill="url(#${id}-f)"/>
                    <g fill="#fff3c4" opacity=".12">${Array.from({ length: 11 }, (_, i) => {
                        const a = -Math.PI / 2 + (i - 5) * 0.3;
                        return `<path d="M100 70 L${(100 + 200 * Math.cos(a - 0.05)).toFixed(1)} ${(70 + 200 * Math.sin(a - 0.05)).toFixed(1)} L${(100 + 200 * Math.cos(a + 0.05)).toFixed(1)} ${(70 + 200 * Math.sin(a + 0.05)).toFixed(1)} Z"/>`;
                    }).join("")}</g>
                    ${[14, 44, 156, 186].map((x, i) => {
                        const cerca = i === 0 || i === 3;
                        const [ancho, arriba] = cerca ? [16, 30] : [11, 54];
                        return `<g opacity="${cerca ? 1 : 0.6}"><rect x="${x - ancho / 2}" y="${arriba}" width="${ancho}" height="${172 - arriba}" fill="#c9983a"/>
                                <rect x="${x - ancho / 2}" y="${arriba}" width="${ancho * 0.3}" height="${172 - arriba}" fill="#ffe2a0" opacity=".6"/>
                                <rect x="${x + ancho * 0.2}" y="${arriba}" width="${ancho * 0.3}" height="${172 - arriba}" fill="#5a3a0c" opacity=".5"/>
                                <rect x="${x - ancho / 2 - 3}" y="${arriba - 5}" width="${ancho + 6}" height="6" fill="#e9c46a"/><rect x="${x - ancho / 2 - 3}" y="170" width="${ancho + 6}" height="6" fill="#e9c46a"/></g>`;
                    }).join("")}
                    <path d="M0 176 L200 176 L200 200 L0 200 Z" fill="#2a1a08"/><path d="M0 176 L200 176" stroke="#e9c46a" stroke-width="1.2" opacity=".7"/>
                    <path d="M60 200 L86 176 L114 176 L140 200 Z" fill="#8f1d2c" opacity=".85"/>
                    ${destello(70, 48, 3)}${destello(132, 36, 2.4)}${destello(150, 110, 2.6)}`;

        default:
            return `<rect width="200" height="200" fill="#0d0a1c"/>${luzClase}`;
    }
}

// ===== 2. Efectos detrás del personaje =====

// Leyenda (nivel 50+): aura dorada que palpita.
export function aura(p) {
    return `<defs>${halo(`${p.id}-aura`, "#ffe08a", 0.75, 0.55)}</defs>
            <circle class="aura" cx="100" cy="104" r="88" fill="url(#${p.id}-aura)"/>
            ${destello(40, 58, 4.6)}${destello(162, 74, 3.6)}${destello(150, 148, 3.6)}${destello(48, 132, 2.8)}`;
}

// Racha de 7+ días: fuego a los lados, con el centro más claro y brasas que suben.
export function llamas(p) {
    const llama = (x, alto, ancho, relleno) =>
        `<path class="llama" d="M${x - ancho} 184 C${x - ancho - 3} ${184 - alto * 0.4} ${x - ancho * 0.5} ${184 - alto * 0.55} ${x - ancho * 0.25} ${184 - alto * 0.8}
                C${x - ancho * 0.1} ${184 - alto * 0.62} ${x + ancho * 0.1} ${184 - alto * 0.9} ${x + ancho * 0.1} ${184 - alto}
                C${x + ancho * 0.5} ${184 - alto * 0.7} ${x + ancho + 3} ${184 - alto * 0.4} ${x + ancho} 184 Z" fill="${relleno}"/>`;
    const fuego = (x, alto) => `${llama(x, alto, 11, `url(#${p.id}-fuego)`)}${llama(x + 1, alto * 0.62, 6.4, `url(#${p.id}-fuego2)`)}`;
    return `<defs>
                <linearGradient id="${p.id}-fuego" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d1340c"/><stop offset=".55" stop-color="#f07a0a"/><stop offset="1" stop-color="#ffd24a" stop-opacity=".2"/></linearGradient>
                <linearGradient id="${p.id}-fuego2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a1a"/><stop offset=".6" stop-color="#ffe27a"/><stop offset="1" stop-color="#fff7d6" stop-opacity=".3"/></linearGradient>
                ${halo(`${p.id}-brasa`, "#ff7a1a", 0.5)}</defs>
            <ellipse cx="100" cy="178" rx="74" ry="26" fill="url(#${p.id}-brasa)"/>
            ${fuego(52, 84)}${fuego(68, 52)}${fuego(148, 84)}${fuego(132, 52)}
            <g fill="#ffd24a">${[[44, 96], [60, 78], [156, 92], [140, 74], [50, 60], [152, 56]].map(([x, y], i) => `<circle class="chispa" cx="${x}" cy="${y}" r="${i % 2 ? 0.9 : 1.3}"/>`).join("")}</g>`;
}

// Buen ánimo: una luz cálida detrás.
export function resplandor(p) {
    return `<defs>${halo(`${p.id}-res`, "#ffe9a8", 0.4)}</defs><circle cx="100" cy="96" r="74" fill="url(#${p.id}-res)"/>`;
}

// Dormido: es de noche (luna y penumbra azul).
export function noche() {
    return `<rect width="200" height="200" fill="#0a1030" opacity=".55"/>
            <path d="M158 26 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22 z" fill="#dbe3f5" opacity=".9"/>
            ${destello(138, 22, 2.5)}${destello(176, 60, 2)}
            <g class="zzz" fill="#dbe3f5" font-family="sans-serif" font-weight="700"><text x="116" y="34" font-size="9">z</text><text x="123" y="26" font-size="7">z</text></g>`;
}


// ===== 3. Escenarios de batalla (uno por campaña) =====

export function escenario(categoria, id) {
    const marco = (contenido) =>
        `<svg class="escena-svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${contenido}
            <rect width="320" height="180" fill="#0b0816" opacity=".28"/></svg>`;

    switch (categoria) {
        case "fuerza":      // Campaña del Cuerpo: un paso de montaña al atardecer rojo
            return marco(`<defs>${vertical(`${id}-f`, ["#1a0a1e", "#5a1a2e", "#b8432e", "#f0a060"])}${halo(`${id}-sol`, "#ffd9a0", 0.9)}</defs>
                <rect width="320" height="180" fill="url(#${id}-f)"/>
                <circle cx="160" cy="118" r="70" fill="url(#${id}-sol)"/>
                <path d="M0 120 L40 72 L70 104 L110 56 L150 112 L196 66 L232 108 L270 74 L320 118 L320 180 L0 180 Z" fill="#6a2434" opacity=".8"/>
                <path d="M0 140 L50 104 L96 136 L150 110 L210 140 L262 112 L320 142 L320 180 L0 180 Z" fill="#3a1424"/>
                ${[14, 44, 280, 306].map((x, i) => `<path d="M${x} ${152 - (i % 2) * 6} l${7 + i} -${44 + i * 5} l${7 + i} ${44 + i * 5} Z" fill="#1a0a14"/>`).join("")}
                <path d="M0 150 Q160 136 320 150 L320 180 L0 180 Z" fill="#1a0a14"/>
                <g fill="#ffb060">${[[60, 60], [250, 50], [130, 30], [200, 84]].map(([x, y]) => `<circle class="chispa" cx="${x}" cy="${y}" r="1.2"/>`).join("")}</g>`);

        case "intelecto":   // Campaña de la Mente: una biblioteca antigua
            return marco(`<defs>${vertical(`${id}-f`, ["#060a20", "#0e1c44", "#12305a"])}${halo(`${id}-luz`, "#8fd8ff", 0.7)}</defs>
                <rect width="320" height="180" fill="url(#${id}-f)"/>
                <!-- ventanal con la luna -->
                <path d="M136 150 L136 60 Q160 24 184 60 L184 150 Z" fill="#17407a"/>
                <circle cx="160" cy="70" r="40" fill="url(#${id}-luz)"/><circle cx="160" cy="64" r="11" fill="#e8f6ff"/>
                <path d="M160 34 L160 150 M136 90 L184 90 M136 120 L184 120" stroke="#081430" stroke-width="2"/>
                <!-- estanterías llenas de libros -->
                ${[0, 34, 68, 224, 258, 292].map((x, k) => {
                    const colores = ["#7a2a3a", "#2a5a7a", "#8a6a2a", "#3a6a4a", "#5a3a7a"];
                    let libros = "";
                    for (let fila = 0; fila < 5; fila++) {
                        for (let i = 0; i < 6; i++) {
                            const alto = 14 + ((i * 7 + fila * 3 + k) % 5) * 1.6;
                            libros += `<rect x="${x + 3 + i * 4.4}" y="${22 + fila * 28 + (22 - alto)}" width="3.6" height="${alto}" fill="${colores[(i + fila + k) % 5]}" opacity=".85"/>`;
                        }
                    }
                    return `<rect x="${x}" y="12" width="30" height="150" fill="#0a1228"/>${libros}
                            ${[0, 1, 2, 3, 4].map((f) => `<rect x="${x}" y="${44 + f * 28}" width="30" height="2.4" fill="#2a1c12"/>`).join("")}`;
                }).join("")}
                <!-- velas que flotan -->
                ${[[110, 60], [208, 52], [122, 104], [198, 110]].map(([x, y]) => `<rect x="${x - 1.2}" y="${y}" width="2.4" height="9" fill="#efe6cf"/><ellipse class="orbe" cx="${x}" cy="${y - 2.4}" rx="2" ry="3.4" fill="#ffd27a"/>`).join("")}
                <path d="M0 156 L320 156 L320 180 L0 180 Z" fill="#070b1c"/>
                <path d="M0 156 L320 156" stroke="#2a3a66" stroke-width="1"/>`);

        case "carisma":     // Campaña de la Voz: un gran salón con telón y candelabros
            return marco(`<defs>${vertical(`${id}-f`, ["#16062a", "#3a1060", "#5a1a70"])}${halo(`${id}-luz`, "#ffd9a0", 0.75)}
                          ${vertical(`${id}-telon`, ["#8a1238", "#5a0a26", "#2a0414"])}</defs>
                <rect width="320" height="180" fill="url(#${id}-f)"/>
                <circle cx="160" cy="70" r="90" fill="url(#${id}-luz)" opacity=".7"/>
                <!-- telones a los lados, con pliegues -->
                <path d="M0 0 L96 0 Q84 60 70 100 Q56 140 40 160 L0 160 Z" fill="url(#${id}-telon)"/>
                <path d="M320 0 L224 0 Q236 60 250 100 Q264 140 280 160 L320 160 Z" fill="url(#${id}-telon)"/>
                <g fill="none" stroke="#1a0210" stroke-width="2" opacity=".5">
                    <path d="M20 0 Q18 80 8 158 M44 0 Q40 80 26 158 M68 0 Q62 70 46 150 M300 0 Q302 80 312 158 M276 0 Q280 80 294 158 M252 0 Q258 70 274 150"/></g>
                <path d="M0 0 L320 0 L320 16 Q280 30 240 16 Q200 30 160 16 Q120 30 80 16 Q40 30 0 16 Z" fill="#a8163f"/>
                <path d="M0 16 Q40 30 80 16 Q120 30 160 16 Q200 30 240 16 Q280 30 320 16" fill="none" stroke="#e9c46a" stroke-width="2"/>
                <!-- candelabro -->
                <path d="M160 16 L160 40 M140 46 Q160 58 180 46" fill="none" stroke="#e9c46a" stroke-width="2"/>
                ${[140, 150, 160, 170, 180].map((x) => `<ellipse class="orbe" cx="${x}" cy="${x === 160 ? 44 : x === 150 || x === 170 ? 46 : 42}" rx="2" ry="3.4" fill="#ffe7a8"/>`).join("")}
                <!-- piso de tablas -->
                <path d="M0 154 L320 154 L320 180 L0 180 Z" fill="#2a1408"/>
                <g stroke="#120804" stroke-width="1" opacity=".6"><path d="M40 154 L20 180 M100 154 L90 180 M160 154 L160 180 M220 154 L230 180 M280 154 L300 180"/></g>
                <path d="M0 154 L320 154" stroke="#e9c46a" stroke-width="1" opacity=".6"/>`);

        case "riqueza":     // Campaña del Tesoro: una bóveda llena de oro
            return marco(`<defs>${vertical(`${id}-f`, ["#0c0a06", "#2a1e0a", "#4a3410"])}${halo(`${id}-oro`, "#ffcf5a", 0.8)}</defs>
                <rect width="320" height="180" fill="url(#${id}-f)"/>
                <!-- arcos de piedra -->
                <g fill="none" stroke="#17120a" stroke-width="16"><path d="M20 180 L20 70 Q90 0 160 70 L160 180 M160 70 Q230 0 300 70 L300 180"/></g>
                <g fill="none" stroke="#3a2c14" stroke-width="2" opacity=".7"><path d="M28 180 L28 72 Q90 12 152 72 M168 72 Q230 12 292 72 L292 180"/></g>
                <circle cx="160" cy="150" r="110" fill="url(#${id}-oro)" opacity=".8"/>
                <!-- montones de monedas -->
                <path d="M0 180 Q30 126 70 150 Q96 120 130 152 L140 180 Z" fill="#c9962a"/><path d="M180 180 Q200 128 240 148 Q274 118 320 160 L320 180 Z" fill="#c9962a"/>
                <path d="M0 180 Q40 140 80 164 Q104 146 130 166 L136 180 Z" fill="#e9c14a"/><path d="M186 180 Q210 146 246 160 Q280 138 320 172 L320 180 Z" fill="#e9c14a"/>
                <g fill="#fff0b0">${[[30, 150], [62, 156], [100, 148], [214, 150], [250, 152], [292, 156], [48, 166], [270, 166]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="1.8" opacity=".8"/>`).join("")}</g>
                ${[[24, 136], [106, 132], [226, 134], [300, 142]].map(([x, y]) => destello(x, y, 3.4)).join("")}
                <!-- antorchas -->
                ${[92, 228].map((x) => `<rect x="${x - 1.4}" y="64" width="2.8" height="14" fill="#3a2c14"/><ellipse class="orbe" cx="${x}" cy="60" rx="4" ry="7" fill="#ff9a2a"/><ellipse cx="${x}" cy="61" rx="2" ry="4" fill="#ffe27a"/>`).join("")}
                <path d="M0 168 Q160 158 320 168 L320 180 L0 180 Z" fill="#17120a" opacity=".55"/>`);

        default:
            return "";
    }
}
