// dibujo-ropa.js — La ropa y la armadura del avatar.
//
// La ropa cambia con la ETAPA (p.etapa: 0 novato, 1 aventurero, 2 héroe, 3 leyenda):
//   novato     → túnica de lino, cuerda de cinturón y zapatos
//   aventurero → jubón del color de su clase, cuero y botas altas
//   héroe      → armadura de acero con ribetes de oro, bufanda y faldón
//   leyenda    → la misma armadura, más oscura y con más oro, y una gema que brilla
// Los ATRIBUTOS agregan detalles (hombreras, lentes, cadena de oro…).

import { TRAZO, capsula } from "./dibujo-base.js";
import { formaTorso, silueta, tramos, mano, puno } from "./dibujo-cuerpo.js";

// Punto entre a y b (t = 0 → a, t = 1 → b).
const entre = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const borde = (grosor = 0.8) => `stroke="${TRAZO}" stroke-width="${grosor}" stroke-linejoin="round"`;


// ===== Piernas, botas y grebas =====

export function piernas(d, e, p) {
    const lados = [e.piernaIzq, e.piernaDer];
    const radios = [e.muslo, e.rodilla, e.tobillo];
    const pantalon = lados.flatMap((l) => tramos(l.cadera, l.rodilla, l.tobillo, ...radios));

    // Arrugas de la tela en la rodilla y sombra entre las piernas.
    const arrugas = lados.map((l) => {
        const [x, y] = l.rodilla;
        return `<path d="M${x - 3.6} ${y - 2} Q${x} ${y - 0.4} ${x + 3.6} ${y - 2.2} M${x - 3} ${y + 2.4} Q${x} ${y + 3.6} ${x + 3} ${y + 2.2}"
                      fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".45"/>`;
    }).join("");

    return `${silueta(pantalon, p.m("pantalon"), 0.85, p.m("tejido"))}
            <path d="M100 112 L${e.piernaIzq.rodilla[0] + 5} 143 L${e.piernaDer.rodilla[0] - 5} 143 Z" fill="${TRAZO}" opacity=".3"/>
            ${arrugas}
            ${lados.map((l) => bota(l, e, p)).join("")}`;
}

function bota(pierna, e, p) {
    const s = pierna.punta;                    // -1: la punta mira a la izquierda; 1: a la derecha
    const [ax] = pierna.tobillo;
    const armadura = p.etapa >= 2;
    const alto = [0.72, 0.28, 0.14, 0.14][p.etapa];        // dónde empieza la bota (0 = rodilla, 1 = tobillo)
    const arriba = entre(pierna.rodilla, pierna.tobillo, alto);
    const radioArriba = e.rodilla - (e.rodilla - e.tobillo) * alto + 0.8;
    const material = armadura ? p.m("acero") : p.m("bota");

    const cana = capsula(...arriba, radioArriba, ...pierna.tobillo, e.tobillo + 0.7);
    const pie = `M${ax - 4.5 * s} 169 L${ax - 4.9 * s} 178.5 Q${ax - 5 * s} 181.4 ${ax - 2.5 * s} 181.4 L${ax + 9.6 * s} 181.4
                 Q${ax + 12.8 * s} 181 ${ax + 11.6 * s} 178 Q${ax + 9.2 * s} 175.3 ${ax + 5 * s} 173.5 L${ax + 4.5 * s} 169 Z`;

    let detalles = `<path d="M${ax - 4.6 * s} 180.8 L${ax + 11.6 * s} 180.8" stroke="#0b0710" stroke-width="1.3" stroke-linecap="round"/>`;
    if (armadura) {
        // Greba (canilla) con ribete de oro, rodillera y láminas en el pie.
        const [rx, ry] = pierna.rodilla;
        detalles += `<path d="M${arriba[0] - radioArriba} ${arriba[1] + 0.4} Q${arriba[0]} ${arriba[1] + 3} ${arriba[0] + radioArriba} ${arriba[1] + 0.4}" fill="none" stroke="${p.m("oro")}" stroke-width="1.5"/>
                     <path d="M${arriba[0] - 1.2} ${arriba[1] + 4} L${ax - 0.9} 168" stroke="#fff" stroke-width=".9" opacity=".35" stroke-linecap="round"/>
                     <path d="M${ax + 3 * s} 175.2 Q${ax + 5.4 * s} 178 ${ax + 4.6 * s} 180.4 M${ax + 6.6 * s} 176.6 Q${ax + 8.6 * s} 178.6 ${ax + 8 * s} 180.4" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".6"/>
                     <path d="M${rx - 5.6} ${ry - 3.4} Q${rx} ${ry - 7.8} ${rx + 5.6} ${ry - 3.4} Q${rx + 6.2} ${ry + 2.6} ${rx} ${ry + 5.4} Q${rx - 6.2} ${ry + 2.6} ${rx - 5.6} ${ry - 3.4} Z"
                           fill="${p.etapa === 3 ? p.m("oro") : p.m("acero")}" ${borde(0.75)}/>
                     <path d="M${rx - 3.6} ${ry - 2.6} Q${rx} ${ry - 5.2} ${rx + 2.2} ${ry - 3.6}" fill="none" stroke="#fff" stroke-width=".8" opacity=".5" stroke-linecap="round"/>
                     <circle cx="${rx}" cy="${ry + 0.4}" r="1.1" fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".4"/>`;
    } else if (p.etapa === 1) {
        // Bota alta de cuero: vuelta en la parte de arriba y una correa con hebilla.
        const [bx, by] = arriba;
        const ra = radioArriba + 0.9;
        detalles += `<path d="M${bx - ra} ${by - 2.4} Q${bx} ${by - 0.2} ${bx + ra} ${by - 2.4} L${bx + ra - 0.5} ${by + 3.6} Q${bx} ${by + 6} ${bx - ra + 0.5} ${by + 3.6} Z" fill="${p.m("cuero")}" ${borde(0.7)}/>
                     <path d="M${bx - ra + 0.8} ${by + 2.4} Q${bx} ${by + 4.6} ${bx + ra - 0.8} ${by + 2.4}" fill="none" stroke="${p.cueroClaro}" stroke-width=".7"/>
                     <path d="M${ax - 4.6} 166.4 Q${ax} 168.4 ${ax + 4.6} 166.4" fill="none" stroke="${p.cueroClaro}" stroke-width="1.5"/>
                     <rect x="${ax - 1.3}" y="165.9" width="2.6" height="2.4" rx=".5" fill="${p.m("acero")}" stroke="${TRAZO}" stroke-width=".4"/>`;
    } else {
        detalles += `<path d="M${ax - 4.2} 167.6 Q${ax} 169.6 ${ax + 4.2} 167.6" fill="none" stroke="${p.cueroClaro}" stroke-width="1"/>`;
    }
    return `${silueta([cana, pie], material, 0.8, armadura ? "" : p.m("grano"))}${detalles}`;
}


// ===== Torso =====

// Emblema de la clase (va en el faldón o en la hebilla). Se dibuja alrededor de (x, y).
function emblema(clave, x, y, color) {
    const trazo = `stroke="${color}" stroke-width=".9" stroke-linecap="round" fill="none"`;
    switch (clave) {
        case "fuerza":     // espada
            return `<path d="M${x} ${y - 3.4} L${x} ${y + 3.2} M${x - 1.8} ${y + 1.2} L${x + 1.8} ${y + 1.2}" ${trazo}/>`;
        case "intelecto":  // estrella de 4 puntas
            return `<path d="M${x} ${y - 3.2} Q${x} ${y} ${x + 3.2} ${y} Q${x} ${y} ${x} ${y + 3.2} Q${x} ${y} ${x - 3.2} ${y} Q${x} ${y} ${x} ${y - 3.2} Z" fill="${color}"/>`;
        case "carisma":    // nota musical
            return `<path d="M${x + 1.2} ${y + 1.8} L${x + 1.2} ${y - 3} L${x + 3} ${y - 2}" ${trazo}/><ellipse cx="${x}" cy="${y + 2}" rx="1.4" ry="1.1" fill="${color}"/>`;
        case "riqueza":    // moneda
            return `<circle cx="${x}" cy="${y}" r="2.7" ${trazo}/><circle cx="${x}" cy="${y}" r=".9" fill="${color}"/>`;
        case "completo":   // sol
            return `<circle cx="${x}" cy="${y}" r="1.4" fill="${color}"/>
                    <path d="M${x} ${y - 3.4} L${x} ${y - 2.4} M${x} ${y + 2.4} L${x} ${y + 3.4} M${x - 3.4} ${y} L${x - 2.4} ${y} M${x + 2.4} ${y} L${x + 3.4} ${y}
                             M${x - 2.4} ${y - 2.4} L${x - 1.7} ${y - 1.7} M${x + 1.7} ${y + 1.7} L${x + 2.4} ${y + 2.4} M${x + 2.4} ${y - 2.4} L${x + 1.7} ${y - 1.7} M${x - 1.7} ${y + 1.7} L${x - 2.4} ${y + 2.4}" ${trazo}/>`;
        default:           // aprendiz: una hoja
            return `<path d="M${x} ${y + 3} Q${x - 3} ${y} ${x} ${y - 3.2} Q${x + 3} ${y} ${x} ${y + 3} Z" fill="${color}" opacity=".85"/>`;
    }
}

export function torso(d, e, p) {
    const { H, cintura: C, cadera: K } = e;
    const r = d.rasgos;
    const cuerpo = formaTorso(e);
    let capas = "";

    if (p.etapa === 0) {
        // --- Novato: túnica de lino ---
        const faldon = `M${100 - C - 0.4} 98 L${100 + C + 0.4} 98 L${100 + K + 3} 119 Q${100 + K * 0.5} 122.6 100 120.6 Q${100 - K * 0.5} 122.6 ${100 - K - 3} 119 Z`;
        capas += `${silueta([faldon, cuerpo], p.m("tela"), 0.85, p.m("tejido"))}
                  <path d="M100 62 L${100 + H} 67 L${100 + C + 2.4} 84 Q${100 + C - 0.4} 93 ${100 + C} 100 L${100 + K + 3} 119 Q${100 + K * 0.6} 122 104 121 Q107 100 100 62 Z" fill="${TRAZO}" opacity=".16"/>
                  <!-- cuello en V con cordón -->
                  <path d="M96 59.6 L100 72 L104 59.6 Z" fill="${p.m("piel")}"/>
                  <path d="M96 59.6 L100 72 L104 59.6" fill="none" stroke="${TRAZO}" stroke-width=".75" stroke-linejoin="round"/>
                  <path d="M97.3 63.4 L102.2 66 M102.7 63.4 L97.8 66 M98.6 67.4 L101.4 69.2 M101.4 67.4 L98.6 69.2" stroke="${p.cueroClaro}" stroke-width=".6" stroke-linecap="round"/>
                  <!-- costura del borde y un remiendo -->
                  <path d="M${100 - K - 2} 116.6 Q100 119.6 ${100 + K + 2} 116.6" fill="none" stroke="${TRAZO}" stroke-width=".5" stroke-dasharray="1.4 1.2" opacity=".5"/>
                  <path d="M${100 - C + 1.4} 85 l4.6 -.6 l.5 4.4 l-4.6 .6 Z" fill="${p.borde}" opacity=".55" stroke="${TRAZO}" stroke-width=".4" stroke-dasharray="1 .8"/>
                  <!-- cuerda de cinturón, con nudo -->
                  <path d="M${100 - C - 0.6} 98.4 Q100 102.4 ${100 + C + 0.6} 98.4 L${100 + C + 1} 101.6 Q100 105.8 ${100 - C - 1} 101.6 Z" fill="${p.cueroClaro}" ${borde(0.7)}/>
                  <path d="M${100 - C + 2} 100.6 l1.6 2 M${100 - C + 6} 101.6 l1.6 2 M99 102.4 l1.6 2 M${100 + C - 7} 101.8 l1.6 1.8 M${100 + C - 3} 100.8 l1.4 1.8" stroke="${TRAZO}" stroke-width=".45" opacity=".55"/>
                  <path d="M${100 + C - 4} 102.6 q-1.6 5 -.4 9.4 M${100 + C - 2.6} 102.4 q1 4.6 2.4 8" fill="none" stroke="${p.cueroClaro}" stroke-width="1.3" stroke-linecap="round"/>`;
    } else if (p.etapa === 1) {
        // --- Aventurero: jubón del color de su clase, con cuero ---
        const faldon = `M${100 - C - 0.6} 98 L${100 + C + 0.6} 98 L${100 + K + 3.4} 119.5 Q${100 + K * 0.6} 122.6 101.6 120.4 L100 107 L98.4 120.4 Q${100 - K * 0.6} 122.6 ${100 - K - 3.4} 119.5 Z`;
        capas += `${silueta([faldon, cuerpo], p.m("tela"), 0.85, p.m("tejido"))}
                  <path d="M100 61 L${100 + H} 67 L${100 + C + 2.4} 84 Q${100 + C - 0.4} 93 ${100 + C} 100 L${100 + K + 3.4} 119.5 Q${100 + K * 0.6} 122 104 120.6 Q107 100 100 61 Z" fill="${TRAZO}" opacity=".2"/>
                  <!-- ribetes del color de la clase -->
                  <path d="M100 63 L100 99" stroke="${p.borde}" stroke-width="1.5"/>
                  <path d="M100 66.4 h2.2 M100 72.4 h2.2 M100 78.4 h2.2 M100 84.4 h2.2 M100 90.4 h2.2" stroke="${p.m("oro")}" stroke-width="1.3" stroke-linecap="round"/>
                  <path d="M${100 - K - 2.6} 117.4 Q${100 - K * 0.6} 120.6 98.8 118.6 M${100 + K + 2.6} 117.4 Q${100 + K * 0.6} 120.6 101.2 118.6" fill="none" stroke="${p.borde}" stroke-width="1.2"/>
                  <!-- cuello alto -->
                  <path d="M94.6 59.8 Q100 64.6 105.4 59.8 L105.8 63.6 Q100 68.6 94.2 63.6 Z" fill="${p.m("tela")}" ${borde(0.7)}/>
                  <path d="M94.4 62.6 Q100 67.6 105.6 62.6" fill="none" stroke="${p.borde}" stroke-width=".9"/>
                  <!-- bandolera de cuero cruzada -->
                  <path d="M${100 - H + 4} 62.6 L${100 - H + 8} 61.6 L${100 + C + 0.6} 96 L${100 + C - 3} 98.4 Z" fill="${p.m("cuero")}" ${borde(0.7)}/>
                  <path d="M${100 - H + 6.6} 63.4 L${100 + C - 0.8} 96.4" stroke="${p.cueroClaro}" stroke-width=".5" stroke-dasharray="1.2 1.1"/>
                  <rect x="98.2" y="77" width="4.4" height="3.6" rx=".7" fill="${p.m("acero")}" ${borde(0.5)} transform="rotate(38 100.4 78.8)"/>
                  ${cinturon(e, p, "acero")}
                  <!-- bolsa en el cinturón -->
                  <path d="M${100 - C + 0.6} 103.6 h6.4 v5 q-3.2 2.6 -6.4 0 Z" fill="${p.m("cuero")}" ${borde(0.6)}/>
                  <path d="M${100 - C + 0.6} 105.6 h6.4" stroke="${p.cueroClaro}" stroke-width=".7"/>
                  <circle cx="${100 - C + 3.8}" cy="106.4" r=".7" fill="${p.m("oro")}"/>`;
    } else {
        // --- Héroe y leyenda: armadura ---
        const leyenda = p.etapa === 3;
        const faldon = `M${100 - K - 1} 104 L${100 + K + 1} 104 L${100 + K + 3.6} 121 Q${100 + K * 0.6} 124.4 100 122.4 Q${100 - K * 0.6} 124.4 ${100 - K - 3.6} 121 Z`;
        const peto = `M${100 - H + 3.4} 66 Q100 59.4 ${100 + H - 3.4} 66 L${100 + C + 2.6} 84 Q${100 + C + 0.4} 92 ${100 + C + 0.6} 98.6
                      Q100 103 ${100 - C - 0.6} 98.6 Q${100 - C - 0.4} 92 ${100 - C - 2.6} 84 Z`;
        const escarcela = (s) => `M${100 + s * (K + 1.4)} 103.4 L${100 + s * 4} 103.4 L${100 + s * 4.6} 116.6 Q${100 + s * K * 0.62} 120.4 ${100 + s * (K + 2.6)} 115.4 Z`;
        capas += `${silueta([faldon], p.m("tela"), 0.85, p.m("tejido"))}
                  <path d="M${100 - K - 3} 119 Q${100 - K * 0.6} 122.6 100 120.6 Q${100 + K * 0.6} 122.6 ${100 + K + 3} 119" fill="none" stroke="${p.m("oro")}" stroke-width="1.1"/>
                  ${silueta([cuerpo], p.m("tela"), 0.85, p.m("tejido"))}
                  <!-- peto: placa del pecho con ribete de oro -->
                  <path d="${peto}" fill="${p.m("acero")}" ${borde(0.85)}/>
                  <path d="M100 62.6 L${100 + H - 3.4} 66 L${100 + C + 2.6} 84 Q${100 + C + 0.4} 92 ${100 + C + 0.6} 98.6 Q106 101.4 101.4 101.6 Q104.6 82 100 62.6 Z" fill="${TRAZO}" opacity=".22"/>
                  <path d="M${100 - H + 5.4} 67 Q100 60.8 ${100 + H - 5.4} 67" fill="none" stroke="${p.m("oro")}" stroke-width="1.5"/>
                  <path d="M${100 - C - 0.2} 97.6 Q100 101.8 ${100 + C + 0.2} 97.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.4"/>
                  <!-- relieve del pecho y láminas del abdomen -->
                  <path d="M100 63.4 L100 84" stroke="#fff" stroke-width=".8" opacity=".45"/>
                  <path d="M${100 - C - 1} 80 Q${100 - 7} 85.6 100 84 Q${100 + 7} 85.6 ${100 + C + 1} 80" fill="none" stroke="${TRAZO}" stroke-width=".7" opacity=".7"/>
                  <path d="M${100 - C - 0.6} 87.6 Q100 91.6 ${100 + C + 0.6} 87.6 M${100 - C - 0.4} 92.8 Q100 96.8 ${100 + C + 0.4} 92.8" fill="none" stroke="${TRAZO}" stroke-width=".6" opacity=".6"/>
                  <path d="M${100 - H + 6.4} 69.6 Q${100 - 9} 67 ${100 - 4.4} 70.6" fill="none" stroke="#fff" stroke-width="1" opacity=".5" stroke-linecap="round"/>
                  ${leyenda ? `<path d="M${100 - 8.4} 72 Q${100 - 5} 76.6 ${100 - 8} 80 M${100 + 8.4} 72 Q${100 + 5} 76.6 ${100 + 8} 80 M${100 - 5} 88.6 Q100 86.6 ${100 + 5} 88.6" fill="none" stroke="${p.m("oro")}" stroke-width=".8" stroke-linecap="round"/>` : ""}
                  <!-- escarcelas: placas que protegen la cadera -->
                  <path d="${escarcela(-1)}" fill="${p.m("acero")}" ${borde(0.8)}/><path d="${escarcela(1)}" fill="${p.m("acero")}" ${borde(0.8)}/>
                  <path d="M${100 - K - 2.2} 114.6 Q${100 - K * 0.62} 119 ${100 - 4.6} 115.6 M${100 + K + 2.2} 114.6 Q${100 + K * 0.62} 119 ${100 + 4.6} 115.6" fill="none" stroke="${p.m("oro")}" stroke-width="1.1"/>
                  <!-- faldón central con el emblema de la clase -->
                  <path d="M95.8 103.4 L104.2 103.4 L104.6 119.4 L100 123.4 L95.4 119.4 Z" fill="${p.m("tela")}" ${borde(0.75)}/>
                  <path d="M96.9 104 L96.6 118.9 L100 121.8 L103.4 118.9 L103.1 104" fill="none" stroke="${p.m("oro")}" stroke-width=".7"/>
                  ${emblema(d.clave, 100, 112.4, p.oroClaro)}
                  ${cinturon(e, p, "oro")}
                  <!-- gema del pecho (en la leyenda, brilla) -->
                  ${leyenda ? `<circle class="orbe" cx="100" cy="75.4" r="6.4" fill="${p.m("gema-luz")}"/>` : ""}
                  <path d="M100 71.4 L103 75.4 L100 79.6 L97 75.4 Z" fill="${p.m("gema")}" stroke="${p.m("oro")}" stroke-width=".9" stroke-linejoin="round"/>
                  <path d="M98.4 75 L100 72.8" stroke="#fff" stroke-width=".6" opacity=".8" stroke-linecap="round"/>`;
    }

    // --- Detalles que dan los atributos ---
    // Carisma: pañuelo blanco al cuello y, con más carisma, un broche de rosa.
    if (r.carisma >= 1 && p.etapa < 2) {
        capas += `<path d="M97 62.6 L95 69.6 L99.4 68 L100 64 Z M103 62.6 L105 69.6 L100.6 68 L100 64 Z" fill="#e2dccd" ${borde(0.55)}/>
                  <path d="M96 60.6 Q100 59.4 104 60.6 L103.4 64.4 Q100 65.8 96.6 64.4 Z" fill="#f4efe3" ${borde(0.6)}/>
                  <circle cx="100" cy="62.6" r="1.1" fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".35"/>`;
    }
    if (r.carisma >= 2) {
        const [x, y] = [100 - H + 7.6, 73.4];
        capas += `<path d="M${x - 2.2} ${y + 1.4} Q${x - 4.6} ${y + 2.4} ${x - 4.4} ${y + 4.6} Q${x - 2.2} ${y + 4.2} ${x - 1.2} ${y + 2.4} Z" fill="#2f7d4f" stroke="${TRAZO}" stroke-width=".4"/>
                  <circle cx="${x}" cy="${y}" r="2.7" fill="#c2183f" stroke="${TRAZO}" stroke-width=".6"/>
                  <path d="M${x - 1.4} ${y + 0.2} Q${x} ${y - 2} ${x + 1.5} ${y - 0.2} Q${x + 0.4} ${y + 1.6} ${x - 0.6} ${y + 0.4}" fill="none" stroke="#ff8fa3" stroke-width=".6" stroke-linecap="round"/>`;
    }
    // Riqueza: cadena de oro con medallón y, con más riqueza, bolsa de monedas.
    if (r.riqueza >= 1) {
        capas += `<path d="M93.6 62.4 Q100 79.4 106.4 62.4" fill="none" stroke="${p.oroOscuro}" stroke-width="1.5"/>
                  <path d="M93.6 62.4 Q100 79.4 106.4 62.4" fill="none" stroke="${p.oroClaro}" stroke-width=".8" stroke-dasharray="1.1 .8"/>
                  <circle cx="100" cy="${p.etapa >= 2 ? 83.6 : 74.6}" r="2.9" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".7"/>
                  <circle cx="100" cy="${p.etapa >= 2 ? 83.6 : 74.6}" r="1" fill="${p.m("gema")}"/>`;
    }
    if (r.riqueza >= 2) {
        const x = 100 + C - 5.4;
        capas += `<path d="M${x} 103.6 Q${x - 2.4} 110 ${x + 0.6} 113.4 Q${x + 4} 115.2 ${x + 6.6} 112.6 Q${x + 8} 108 ${x + 5.6} 103.6 Z" fill="${p.m("cuero")}" ${borde(0.65)}/>
                  <path d="M${x + 0.2} 104.4 L${x + 5.6} 104.4" stroke="${p.m("oro")}" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="${x + 3.2}" cy="109.4" r="1.2" fill="${p.m("oro")}" stroke="${p.oroOscuro}" stroke-width=".4"/>`;
    }
    return capas;
}

function cinturon(e, p, metal) {
    const C = e.cintura;
    return `<path d="M${100 - C - 0.8} 98.2 Q100 102.6 ${100 + C + 0.8} 98.2 L${100 + C + 1.2} 102.8 Q100 107.4 ${100 - C - 1.2} 102.8 Z" fill="${p.m("cuero")}" ${borde(0.75)}/>
            <path d="M${100 - C} 99.6 Q100 103.8 ${100 + C} 99.6" fill="none" stroke="${p.cueroClaro}" stroke-width=".5" opacity=".8"/>
            <rect x="96.6" y="99.6" width="6.8" height="6.4" rx="1.3" fill="${p.m(metal)}" ${borde(0.65)}/>
            <rect x="98.4" y="101.3" width="3.2" height="3" rx=".6" fill="${metal === "oro" ? p.m("gema") : TRAZO}" opacity="${metal === "oro" ? 1 : 0.55}"/>`;
}

// Bufanda del héroe: tela del color de la clase alrededor del cuello, con una punta que cae.
export function bufanda(d, e, p) {
    if (p.etapa < 2) return "";
    // Carisma nivel 3+: un broche de oro cierra la bufanda.
    const broche = d.rasgos.carisma >= 1
        ? `<circle cx="${100 - 4.4}" cy="67.4" r="1.9" fill="${p.m("oro")}" stroke="${TRAZO}" stroke-width=".45"/><circle cx="${100 - 4.4}" cy="67.4" r=".7" fill="#fff" opacity=".8"/>`
        : "";
    return `<path d="M${100 - 6.6} 66.4 Q${100 - 9.4} 76 ${100 - 7} 85.4 L${100 - 2.6} 84.4 Q${100 - 4.6} 76 ${100 - 2.4} 68 Z" fill="${p.m("bufanda")}" ${borde(0.75)}/>
            <path d="M${100 - 6} 71 Q${100 - 7} 77 ${100 - 5.6} 83" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".5"/>
            <path d="M92.4 60.4 Q100 67 107.6 60.4 Q109.6 64 107.2 66.8 Q100 72 92.8 66.8 Q90.4 64 92.4 60.4 Z" fill="${p.m("bufanda")}" ${borde(0.8)}/>
            <path d="M93.6 64.4 Q100 69.6 106.4 64.4" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".45"/>
            <path d="M93.4 62 Q96.4 65.2 99.4 65.8" fill="none" stroke="#fff" stroke-width=".8" opacity=".3" stroke-linecap="round"/>${broche}`;
}


// ===== Brazos =====

// lado: "izq" o "der". Devuelve dos capas:
//   atras  → el brazo (se pinta ANTES que el torso, así el hombro sale de detrás del cuerpo)
//   frente → lo que lleva en la mano (arma o libro) y la mano (se pinta DESPUÉS del torso)
export function brazo(lado, d, e, p, enMano = "", sostiene = false) {
    const b = e[lado];
    const s = lado === "izq" ? -1 : 1;
    const [r1, r2, r3] = [e.brazo, e.brazo - 0.7, e.brazo - 1.6];
    const [arriba, abajo] = tramos(b.hombro, b.codo, b.muneca, r1, r2, r3);
    const sombraCodo = `<path d="M${b.codo[0] - r2 + 0.6} ${b.codo[1] - 0.6} Q${b.codo[0]} ${b.codo[1] + 1.6} ${b.codo[0] + r2 - 0.6} ${b.codo[1] - 0.8}" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".45"/>`;
    let capas;
    let guante = p.m("piel");

    if (p.etapa === 0) {
        // Manga corta: se ve la piel del antebrazo, con una venda en la muñeca.
        const manga = capsula(...b.hombro, r1 + 0.6, ...entre(b.hombro, b.codo, 0.56), r1 + 0.3);
        const venda = capsula(...entre(b.codo, b.muneca, 0.7), r3 + 0.7, ...entre(b.codo, b.muneca, 0.97), r3 + 0.5);
        capas = `${silueta([arriba, abajo], p.m("piel"))}
                 <path d="${manga}" fill="${p.m("tela")}" ${borde()}/>
                 <path d="${venda}" fill="${p.m("lino")}" ${borde(0.6)}/>`;
    } else if (p.etapa === 1) {
        // Manga larga y brazal de cuero con correas.
        const brazal = capsula(...entre(b.codo, b.muneca, 0.3), r2 + 0.5, ...entre(b.codo, b.muneca, 0.97), r3 + 0.9);
        const [cx, cy] = entre(b.codo, b.muneca, 0.5);
        const [dx, dy] = entre(b.codo, b.muneca, 0.78);
        capas = `${silueta([arriba, abajo], p.m("tela"), 0.85, p.m("tejido"))}${sombraCodo}
                 <path d="${brazal}" fill="${p.m("cuero")}" ${borde()}/>
                 <path d="M${cx - r2} ${cy} L${cx + r2} ${cy} M${dx - r3 - 0.6} ${dy} L${dx + r3 + 0.6} ${dy}" stroke="${p.cueroClaro}" stroke-width="1.1"/>
                 <circle cx="${cx}" cy="${cy}" r=".6" fill="${p.m("acero")}"/><circle cx="${dx}" cy="${dy}" r=".6" fill="${p.m("acero")}"/>`;
    } else {
        // Armadura: manga de tela, codera y guantelete de acero.
        const guantelete = capsula(...entre(b.codo, b.muneca, 0.16), r2 + 0.9, ...b.muneca, r3 + 1.1);
        const [cx, cy] = entre(b.codo, b.muneca, 0.16);
        capas = `${silueta([arriba, abajo], p.m("tela"), 0.85, p.m("tejido"))}
                 <path d="${guantelete}" fill="${p.m("acero")}" ${borde()}/>
                 <path d="M${cx - r2 - 0.6} ${cy + 1.6} Q${cx} ${cy + 3.8} ${cx + r2 + 0.6} ${cy + 1.6}" fill="none" stroke="${p.m("oro")}" stroke-width="1.3"/>
                 <path d="M${b.muneca[0] - r3 - 0.8} ${b.muneca[1] - 2.4} Q${b.muneca[0]} ${b.muneca[1] - 0.4} ${b.muneca[0] + r3 + 0.8} ${b.muneca[1] - 2.4}" fill="none" stroke="${TRAZO}" stroke-width=".5" opacity=".6"/>
                 <circle cx="${b.codo[0]}" cy="${b.codo[1]}" r="${r2 + 1.1}" fill="${p.m("acero")}" ${borde(0.75)}/>
                 <circle cx="${b.codo[0]}" cy="${b.codo[1]}" r="${r2 - 1.1}" fill="none" stroke="${p.m("oro")}" stroke-width=".8"/>
                 <path d="M${b.codo[0] - 2.4} ${b.codo[1] - 2.6} Q${b.codo[0]} ${b.codo[1] - 4} ${b.codo[0] + 1.4} ${b.codo[1] - 3.2}" fill="none" stroke="#fff" stroke-width=".8" opacity=".5" stroke-linecap="round"/>`;
        guante = p.m("acero");
    }
    const laMano = sostiene ? puno(b.mano, p, guante) : mano(b.mano, p, s, guante);
    return { atras: capas, frente: `${enMano}${laMano}` };
}

// Hombreras. De cuero en el aventurero; de acero si tienes Fuerza 6+ o desde héroe.
export function hombreras(d, e, p) {
    const acero = d.rasgos.fuerza >= 2 || p.etapa >= 2;
    if (!acero && p.etapa < 1) return "";

    // Una hombrera: una placa curva sobre el hombro y una lámina más pequeña debajo.
    const hombrera = (s, material, ribete) => {
        const x = 100 + s * (e.H - 0.4);
        const grande = p.etapa >= 2 ? 1.12 : acero ? 1 : 0.86;
        const f = (dx) => x + s * dx * grande;
        return `<path d="M${f(-7.4)} 73.6 Q${f(1)} 70.2 ${f(8.8)} 76.4 Q${f(4)} 79.6 ${f(-6.6)} 78 Z" fill="${material}" ${borde(0.75)}/>
                <path d="M${f(-8.6)} 71.4 Q${f(-9.8)} 60.6 ${f(-0.4)} 58.4 Q${f(8.4)} 58.6 ${f(9.8)} 68.4 Q${f(10)} 72.4 ${f(8.6)} 73.4 Q${f(0.6)} 68.4 ${f(-8.6)} 71.4 Z" fill="${material}" ${borde(0.8)}/>
                <path d="M${f(-8.2)} 70.6 Q${f(0.6)} 67 ${f(8.8)} 72.4" fill="none" stroke="${ribete}" stroke-width="1.4"/>
                <path d="M${f(-5.4)} 63.6 Q${f(-1.6)} 60.4 ${f(2.6)} 60.8" fill="none" stroke="#fff" stroke-width="1" opacity="${acero ? 0.5 : 0.22}" stroke-linecap="round"/>
                ${p.etapa === 3 ? `<path d="M${f(-3)} 59.4 L${f(1.6)} 52.4 L${f(3.6)} 59.6 Z" fill="${p.m("oro")}" ${borde(0.6)}/>` : ""}
                ${d.rasgos.fuerza >= 2 ? `<circle cx="${f(0.6)}" cy="64.6" r="1.3" fill="${ribete}" stroke="${TRAZO}" stroke-width=".4"/>` : ""}`;
    };

    if (acero) return hombrera(-1, p.m("acero"), p.m("oro")) + hombrera(1, p.m("acero"), p.m("oro"));
    return hombrera(-1, p.m("cuero"), p.borde);   // aventurero: una sola, de cuero
}
