// dibujo-monstruos.js — Los dibujos de las criaturas de la Torre y de la Mazmorra (v29), y de sus salas.
//
// Cada criatura es un SVG de 100 × 100 (el suelo está en y = 94 y miran hacia la derecha,
// donde está tu héroe). La Torre no los muestra así: pixel.js los convierte en "pixel art"
// de unos 90 puntos de lado. Por eso aquí todo es GRANDE y simple: una forma clara, luz
// por arriba a la izquierda, sombra por abajo a la derecha, y pocos detalles (los que
// midan menos de un punto desaparecen).
//
// Varias criaturas comparten dibujo y cambian solo de colores, como en los juegos
// clásicos: el Cieno de magma es el Cieno abisal en rojo, el Ala de trueno es el
// Murciélago en azul… Esa tabla está al final (FIGURAS).

import { mate, metal, aclarar, oscurecer, capsula, nuevoId } from "./dibujo-base.js";
import { CRIATURAS } from "./bestiario.js";

const LINEA = "#150d26";      // líneas de adentro (el contorno de afuera lo pone pixel.js)
const MARFIL = "#efe6c8";     // dientes, garras y cuernos
const HUESO = "#e2d8bd";

const borde = (grosor = 1.3) => `stroke="${LINEA}" stroke-width="${grosor}" stroke-linejoin="round" stroke-linecap="round"`;

// Un "lienzo" junta los materiales (degradados) que va pidiendo cada dibujo.
// Ej: const acero = L.metal("acero", "#5c6470")  →  se usa en fill="${acero}"
function lienzo() {
    const id = nuevoId("mo");
    const defs = [];
    const registrar = (nombre, texto) => {
        defs.push(texto);
        return `url(#${id}-${nombre})`;
    };
    return {
        mate: (nombre, color, luz = 0.3, sombra = 0.55) => registrar(nombre, mate(`${id}-${nombre}`, color, luz, sombra)),
        metal: (nombre, color) => registrar(nombre, metal(`${id}-${nombre}`, color)),
        // Para cosas redondas: un punto de luz arriba a la izquierda y sombra en el borde.
        bola: (nombre, color, luz = 0.5, sombra = 0.6) => registrar(nombre,
            `<radialGradient id="${id}-${nombre}" cx=".34" cy=".28" r=".85">
                <stop offset="0" stop-color="${aclarar(color, luz)}"/><stop offset=".45" stop-color="${color}"/>
                <stop offset="1" stop-color="${oscurecer(color, sombra)}"/></radialGradient>`),
        // De arriba a abajo (fuego, cristales).
        vertical: (nombre, arriba, abajo) => registrar(nombre,
            `<linearGradient id="${id}-${nombre}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient>`),
        recorte: (nombre, forma) => {
            defs.push(`<clipPath id="${id}-${nombre}">${forma}</clipPath>`);
            return `clip-path="url(#${id}-${nombre})"`;
        },
        armar: (dibujo) => `<defs>${defs.join("")}</defs>${dibujo}`,
    };
}

// Lo mismo del otro lado: dibuja algo y su reflejo (alas, patas, brazos…).
const espejo = (dibujo) => `${dibujo}<g transform="translate(100 0) scale(-1 1)">${dibujo}</g>`;

// Una línea gruesa con su borde oscuro (huesos, patas, tentáculos).
const tubo = (d, color, grosor = 3) =>
    `<path d="${d}" fill="none" stroke="${LINEA}" stroke-width="${grosor + 2}" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="${d}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Un ojo que brilla: el color y un punto blanco en el centro.
const ojoDeLuz = (x, y, r, color, giro = 0) =>
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${color}" transform="rotate(${giro} ${x} ${y})"/>
     <circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#fff"/>`;

// Un ojo de fiera: amarillo con la pupila rasgada.
const ojoDeFiera = (x, y, r, color) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${LINEA}" stroke-width=".9"/>
     <ellipse cx="${x}" cy="${y}" rx="${r * 0.3}" ry="${r * 0.85}" fill="${LINEA}"/>`;

// Una fila de dientes: de x1 a x2, con la punta hacia abajo (alto > 0) o hacia arriba (alto < 0).
function dientes(x1, x2, y, cuantos, alto) {
    const ancho = (x2 - x1) / cuantos;
    let d = "";
    for (let i = 0; i < cuantos; i++) {
        const x = x1 + ancho * i;
        const largo = alto * (i % 2 ? 0.7 : 1);   // uno largo, uno corto
        d += `M${x.toFixed(1)} ${y} l${(ancho / 2).toFixed(1)} ${largo.toFixed(1)} l${(ancho / 2).toFixed(1)} ${(-largo).toFixed(1)} Z `;
    }
    return `<path d="${d}" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".6" stroke-linejoin="round"/>`;
}


// ===== Cripta olvidada =====

// Murciélago: de frente, con las alas abiertas.
function murcielago(c) {
    const L = lienzo();
    const pelo = L.bola("pelo", c.pelo, 0.35, 0.65);
    const membrana = L.mate("ala", c.ala, 0.35, 0.6);
    const ala = `
        <path d="M46 46 L27 18 L3 24 C9 30 10 37 8 45 C15 41 21 44 23 53 C28 47 34 49 36 58 C40 53 44 53 47 57 Z" fill="${membrana}" ${borde()}/>
        <path d="M46 46 L27 18 L3 24 M27 18 L8 45 M27 18 L23 53 M27 18 L36 58" fill="none" stroke="${c.hueso}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M27 18 l-1 -6 l4 4 Z" fill="${MARFIL}" ${borde(0.6)}/>`;
    return L.armar(`
        ${espejo(ala)}
        ${espejo(`<path d="M45 66 l-2 8 m0 0 l-3 3 m3 -3 l0 4 m0 -4 l3 3" fill="none" stroke="${LINEA}" stroke-width="1.6" stroke-linecap="round"/>`)}
        <ellipse cx="50" cy="55" rx="9.5" ry="14" fill="${pelo}" ${borde()}/>
        <path d="M43.6 52 q6.4 5 12.8 0 M44.4 59 q5.6 4.4 11.2 0" fill="none" stroke="${aclarar(c.pelo, 0.35)}" stroke-width="1.1" stroke-linecap="round"/>
        ${espejo(`<path d="M43 34 L37 14 L50 29 Z" fill="${pelo}" ${borde()}/><path d="M43 31 L40 20 L47 29 Z" fill="${c.oreja}"/>`)}
        <ellipse cx="50" cy="37" rx="10.5" ry="9.5" fill="${pelo}" ${borde()}/>
        ${ojoDeLuz(45, 35, 2.6, c.ojo, 18)}${ojoDeLuz(55, 35, 2.6, c.ojo, -18)}
        <path d="M48.2 39 L51.8 39 L50 41.2 Z" fill="${LINEA}"/>
        <path d="M44.4 42 Q50 47 55.6 42 Q50 44.4 44.4 42 Z" fill="#3a0b12" ${borde(0.8)}/>
        <path d="M46.4 43 l1.3 3.8 l1.3 -3.2 Z M51 43.6 l1.3 3.2 l1.3 -3.8 Z" fill="#fff"/>`);
}

// Esqueleto: un soldado de huesos con espada y escudo.
function esqueleto(c) {
    const L = lienzo();
    const hueso = L.mate("hueso", c.hueso, 0.3, 0.5);
    const acero = L.metal("acero", c.acero);
    const madera = L.bola("escudo", c.escudo, 0.3, 0.6);
    const h = (d, grosor = 2.8) => tubo(d, c.hueso, grosor);
    const costillas = [37, 42, 47, 52].map((y) => espejo(h(`M50 ${y} Q41 ${y - 1} 39.6 ${y + 3.4}`, 1.8))).join("");
    return L.armar(`
        <!-- piernas -->
        ${h("M45 64 L43 79 L42 91")}${h("M55 64 L58 79 L59 91")}
        ${h("M42 92 l-6 1.4", 2.6)}${h("M59 92 l7 1.4", 2.6)}
        <!-- el hueco del pecho, la columna y las costillas -->
        <ellipse cx="50" cy="45.6" rx="10.4" ry="10.6" fill="#241a36"/>
        ${h("M50 33 L50 61", 3)}${costillas}
        <!-- trapo en la cintura y cadera -->
        <path d="M41 59 Q50 55 59 59 L57 67 Q50 63.6 43 67 Z" fill="${hueso}" ${borde()}/>
        <path d="M41.6 62 L58.4 62 L60 73 L56.4 70 L54 76 L50 71 L46.6 77 L44.6 71 L40.6 74 Z" fill="${c.trapo}" ${borde(1)}/>
        <!-- hombros -->
        ${h("M38 33 L62 33", 3)}
        <!-- brazo de la espada (levantado) -->
        ${h("M63 33 L72 42 L75 31")}
        <path d="M74 26.4 L78.2 28.4 L87.4 8.4 L87 3.6 L83.2 6.6 Z" fill="${acero}" ${borde(1)}/>
        <path d="M71.4 26.4 L80 30.6" stroke="${LINEA}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M71.4 26.4 L80 30.6" stroke="${c.guarda}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="73.8" cy="33.6" r="1.9" fill="${c.guarda}" ${borde(0.8)}/>
        <!-- brazo del escudo -->
        ${h("M37 33 L31 46 L33 56")}
        <circle cx="29" cy="55" r="12" fill="${madera}" ${borde(1.4)}/>
        <circle cx="29" cy="55" r="8.6" fill="none" stroke="${oscurecer(c.escudo, 0.5)}" stroke-width="1.2"/>
        <path d="M22 47 L26 52 M34 61 L37 64" stroke="${LINEA}" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="29" cy="55" r="3.4" fill="${acero}" ${borde(0.9)}/>
        <!-- calavera -->
        <path d="M39.6 20 C39.6 10 45.6 5.6 51 5.6 C57.4 5.6 62.4 10 62.4 20 C62.4 24 60.4 26 58.4 27 L58.4 31 L43.6 31 L43.6 27 C41.4 26 39.6 24 39.6 20 Z" fill="${hueso}" ${borde()}/>
        <path d="M45 31 L57 31 L56 35.4 Q51 37.6 46 35.4 Z" fill="${hueso}" ${borde(1)}/>
        <ellipse cx="46" cy="19.4" rx="3.2" ry="3.6" fill="${LINEA}"/><ellipse cx="56.4" cy="19.4" rx="3.2" ry="3.6" fill="${LINEA}"/>
        <circle cx="46.4" cy="19.8" r="1.3" fill="${c.ojo}"/><circle cx="56.8" cy="19.8" r="1.3" fill="${c.ojo}"/>
        <path d="M51.2 22.6 l-1.7 3.6 l3.4 0 Z" fill="${LINEA}"/>
        <path d="M45 28.4 L57 28.4 M47.4 27 l0 3.6 M49.8 27 l0 3.6 M52.2 27 l0 3.6 M54.6 27 l0 3.6" stroke="${LINEA}" stroke-width=".8"/>`);
}

// Cieno: una masa viscosa con ojos, boca y los restos de su última comida.
function cieno(c) {
    const L = lienzo();
    const masa = L.bola("masa", c.masa, 0.5, 0.7);
    const brazo = L.mate("brazo", c.masa, 0.35, 0.65);
    const colmillo = (x, y, largo) => `<path d="M${x - 2} ${y} l2 ${largo} l2 ${-largo} Z" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".6" stroke-linejoin="round"/>`;
    return L.armar(`
        <!-- un brazo de cieno que se estira hacia ti -->
        <path d="M70 62 C82 54 92 56 95 42 C100 54 96 70 82 74 Z" fill="${brazo}" ${borde()}/>
        <path d="M9 93 C2 80 9 68 19 60 C26 54 25 40 35 32 C46 23 60 26 66 36 C70 43 68 48 76 54 C89 63 97 77 92 93 Z" fill="${masa}" ${borde()}/>
        <!-- brillo de la superficie y gotas que cuelgan -->
        <path d="M24 60 C28 48 33 40 42 34" fill="none" stroke="${aclarar(c.masa, 0.7)}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="80" cy="66" r="2.2" fill="${aclarar(c.masa, 0.55)}"/>
        <path d="M14 78 q2 9 4 0 M86 80 q1.6 8 3.2 0" fill="${oscurecer(c.masa, 0.25)}" stroke="${LINEA}" stroke-width=".7"/>
        <!-- huesos de su última comida, a medio disolver -->
        <path d="M12 86 L24 90 M20 84 L16 92" stroke="${c.restos}" stroke-width="2" stroke-linecap="round"/>
        <path d="M78 80 C78 76 81 74.6 83.4 74.6 C86 74.6 88.6 76 88.6 80 L87.4 84.6 L79.6 84.6 Z" fill="${c.restos}"/>
        <circle cx="81.4" cy="80" r="1.4" fill="${oscurecer(c.masa, 0.6)}"/><circle cx="85.4" cy="80" r="1.4" fill="${oscurecer(c.masa, 0.6)}"/>
        <!-- muchos ojos, desparejos -->
        ${ojoDeLuz(40, 44, 4.4, c.ojo, 24)}${ojoDeLuz(55, 41, 3.4, c.ojo, -20)}${ojoDeLuz(48, 53, 2.2, c.ojo)}
        <circle cx="31" cy="51" r="1.5" fill="${c.ojo}"/><circle cx="63" cy="50" r="1.3" fill="${c.ojo}"/>
        <!-- la boca: un hueco enorme con colmillos e hilos de baba -->
        <path d="M22 70 Q48 57 77 70 Q73 87 50 89 Q28 87 22 70 Z" fill="${c.boca}" ${borde(1.2)}/>
        <path d="M43 63 L44 88 M59 63.4 L58 88" stroke="${oscurecer(c.masa, 0.2)}" stroke-width="1.2"/>
        ${colmillo(31, 67.4, 6)}${colmillo(38.6, 64.6, 7.4)}${colmillo(50, 63, 8)}${colmillo(62, 64.6, 7.4)}${colmillo(69.6, 67.6, 6)}
        ${colmillo(35, 84.6, -5.6)}${colmillo(46, 87.6, -6)}${colmillo(55, 87.6, -6)}${colmillo(66, 84.4, -5.6)}`);
}

// Araña: de frente, con las patas arqueadas.
function arana(c) {
    const L = lienzo();
    const cuerpo = L.bola("cuerpo", c.cuerpo, 0.5, 0.6);
    const pata = (d) => tubo(d, c.pata, 3.2);
    const brillo = (d) => `<path d="${d}" fill="none" stroke="${aclarar(c.pata, 0.5)}" stroke-width="1" stroke-linecap="round"/>`;
    return L.armar(`
        <!-- patas de atrás -->
        ${espejo(pata("M44 60 L23 19 L7 41") + brillo("M42 58 L23 21"))}
        ${espejo(pata("M42 63 L14 34 L3 72") + brillo("M40 62 L14.6 36"))}
        <!-- abdomen, con su marca -->
        <ellipse cx="50" cy="38" rx="21" ry="19.6" fill="${cuerpo}" ${borde()}/>
        <path d="M45 27 L55 27 L51.6 37.4 L55 48 L45 48 L48.4 37.4 Z" fill="${c.marca}" stroke="${LINEA}" stroke-width=".8" stroke-linejoin="round"/>
        <!-- patas de adelante -->
        ${espejo(pata("M42 66 L20 44 L10 90") + brillo("M40 65 L20.6 46"))}
        ${espejo(pata("M43 69 L30 52 L23 93") + brillo("M42 68 L30.6 54"))}
        <!-- cabeza, ojos y colmillos -->
        <ellipse cx="50" cy="67" rx="12.6" ry="10.4" fill="${cuerpo}" ${borde()}/>
        ${espejo(`<path d="M45.6 74 C42.6 79 44.6 84.6 47.8 86.6 L49 76.6 Z" fill="${c.pata}" ${borde(1)}/><path d="M46.6 83 l1.2 4.4 l1 -4.6 Z" fill="${MARFIL}"/>`)}
        ${espejo(`${ojoDeLuz(45.4, 65.6, 2.5, c.ojo)}<circle cx="41.6" cy="62.4" r="1.4" fill="${c.ojo}"/><circle cx="47.4" cy="60.6" r="1.3" fill="${c.ojo}"/>`)}`);
}

// Caballero: una armadura de pie, con las manos sobre el mandoble. También es el Centinela.
function caballero(c) {
    const L = lienzo();
    const acero = L.metal("acero", c.armadura);
    const oscuro = L.mate("oscuro", oscurecer(c.armadura, 0.35), 0.3, 0.5);
    const oro = L.metal("oro", c.adorno);
    const capa = L.mate("capa", c.capa, 0.25, 0.6);
    const hoja = L.metal("hoja", c.hoja);
    return L.armar(`
        <!-- capa rota -->
        <path d="M30 30 C20 50 17 76 12 94 L24 88 L31 95 L40 88 L50 93 L60 88 L69 95 L76 88 L88 94 C83 76 80 50 70 30 Z" fill="${capa}" ${borde()}/>
        <path d="M24 60 C22 72 20 82 18 90 M76 60 C78 72 80 82 82 90" fill="none" stroke="${oscurecer(c.capa, 0.5)}" stroke-width="1.6" stroke-linecap="round"/>
        <!-- piernas y pies -->
        ${espejo(`<path d="M37.6 64 L48.4 64 L47.4 90 L36.6 90 Z" fill="${acero}" ${borde()}/>
                  <ellipse cx="42.6" cy="73" rx="5.6" ry="4.4" fill="${acero}" ${borde(1)}/>
                  <path d="M35 89 L48.4 89 L48.4 95 L31.6 95 Z" fill="${oscuro}" ${borde()}/>`)}
        <!-- peto y faldón -->
        <path d="M34 58 L66 58 L68 69 L50 73 L32 69 Z" fill="${oscuro}" ${borde()}/>
        <path d="M33 33 L67 33 L62.6 59 Q50 65 37.4 59 Z" fill="${acero}" ${borde()}/>
        <path d="M50 35 L50 62 M38 44 Q50 50 62 44" fill="none" stroke="${LINEA}" stroke-width="1"/>
        <path d="M36 57.6 Q50 63.6 64 57.6" fill="none" stroke="${c.adorno}" stroke-width="2"/>
        <!-- brazos hacia el centro -->
        ${espejo(`<path d="${capsula(29, 39, 5, 33, 53, 4.4)}" fill="${acero}" ${borde()}/>
                  <path d="${capsula(33, 53, 4.4, 46, 54.6, 4)}" fill="${acero}" ${borde()}/>`)}
        <!-- hombreras con púa -->
        ${espejo(`<path d="M19 38 C19 28 26 24 33 25 C38 26 41 30 41 35 C36 38 27 41 19 38 Z" fill="${acero}" ${borde()}/>
                  <path d="M20 36 C26 38 34 36 40 33" fill="none" stroke="${c.adorno}" stroke-width="1.8"/>
                  <path d="M25 26 L21 15 L31 24.6 Z" fill="${oscuro}" ${borde(1)}/>`)}
        <!-- el mandoble, clavado al frente -->
        <path d="M46.4 56 L53.6 56 L52.8 89 L50 95.4 L47.2 89 Z" fill="${hoja}" ${borde(1.1)}/>
        <path d="M50 57 L50 91" stroke="${oscurecer(c.hoja, 0.5)}" stroke-width=".9"/>
        <path d="M39 55.4 L61 55.4" stroke="${LINEA}" stroke-width="5" stroke-linecap="round"/>
        <path d="M39 55.4 L61 55.4" stroke="${c.adorno}" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M48.6 44 L51.4 44 L51.4 54 L48.6 54 Z" fill="${oscuro}" ${borde(0.9)}/>
        <circle cx="50" cy="43" r="2.7" fill="${oro}" ${borde(0.9)}/>
        ${espejo(`<circle cx="46.4" cy="51.6" r="4.3" fill="${oscuro}" ${borde(1.1)}/>`)}
        <!-- yelmo con cuernos y la rendija que brilla -->
        ${espejo(`<path d="M41 14 C35 12.6 31.6 6.6 32.6 0.6 C36.6 5 40 8 44.6 10 Z" fill="${c.cuerno}" ${borde(1)}/>`)}
        <path d="M38.6 22 C38.6 10 44 4.6 50 4.6 C56 4.6 61.4 10 61.4 22 L61.4 30 L55 34.4 L50 31.4 L45 34.4 L38.6 30 Z" fill="${acero}" ${borde()}/>
        <path d="M50 5 L50 16" stroke="${c.adorno}" stroke-width="2"/>
        <path d="M41.6 18 L58.4 18 L57.4 23 L42.6 23 Z" fill="#07050d" ${borde(0.9)}/>
        ${ojoDeLuz(46, 20.6, 2, c.ojo)}${ojoDeLuz(54, 20.6, 2, c.ojo)}
        <path d="M47 26.6 l0 4 M50 26 l0 4.4 M53 26.6 l0 4" stroke="${LINEA}" stroke-width="1"/>`);
}


// ===== Biblioteca prohibida =====

// Ojo vigía: una bola de carne con un solo ojo, cuernos y tentáculos.
function ojo(c) {
    const L = lienzo();
    const carne = L.bola("carne", c.carne, 0.45, 0.65);
    const blanco = L.bola("blanco", "#e9e2d2", 0.6, 0.45);
    const iris = L.bola("iris", c.iris, 0.6, 0.7);
    const abertura = "M28 45 C36 30 64 30 72 45 C64 59 36 59 28 45 Z";
    const recorte = L.recorte("abertura", `<path d="${abertura}"/>`);
    return L.armar(`
        ${tubo("M36 60 C30 70 38 78 31 90", c.carne, 3.4)}${tubo("M45 66 C42 76 50 82 45 95", c.carne, 3.8)}
        ${tubo("M55 66 C60 76 52 84 58 95", c.carne, 3.8)}${tubo("M64 60 C72 70 63 80 70 90", c.carne, 3.4)}
        <path d="M36 24 L29 5 L44 20 Z M50 20 L50 1 L57 20 Z M64 24 L71 5 L57 20 Z" fill="${MARFIL}" ${borde(1)}/>
        <circle cx="50" cy="44" r="25.4" fill="${carne}" ${borde()}/>
        <!-- arrugas de los párpados -->
        <path d="M30 33 C38 23 62 23 70 33 M32 57 C40 66 60 66 68 57" fill="none" stroke="${oscurecer(c.carne, 0.5)}" stroke-width="1.5" stroke-linecap="round"/>
        <!-- el ojo: blanco con venas, iris y pupila rasgada -->
        <path d="${abertura}" fill="${blanco}" ${borde(1.4)}/>
        <g ${recorte}>
            <path d="M29 45 l9 -2 M71 45 l-9 -2 M33 38 l6 3 M67 38 l-6 3 M34 53 l6 -3 M66 53 l-6 -3" stroke="#c2283a" stroke-width="1.1"/>
            <circle cx="51" cy="45" r="11.6" fill="${iris}" stroke="${LINEA}" stroke-width="1.2"/>
            <ellipse cx="51" cy="45" rx="3" ry="9.6" fill="#07050d"/>
            <circle cx="46.4" cy="40.4" r="2.5" fill="#fff"/>
        </g>`);
}

// Grimorio voraz: un libro abierto como una boca, con dientes, lengua y un ojo en la tapa.
function grimorio(c) {
    const L = lienzo();
    const cuero = L.mate("cuero", c.cuero, 0.3, 0.6);
    const hojas = L.mate("hojas", c.hojas, 0.2, 0.4);
    const oro = L.metal("oro", c.adorno);
    const renglones = (y) => `<path d="M17 ${y} L83 ${y} M16.4 ${y + 2.8} L83.6 ${y + 2.8}" stroke="${oscurecer(c.hojas, 0.35)}" stroke-width=".8"/>`;
    const esquinas = (y, alto) => espejo(`<path d="M12.6 ${y} l10 0 l-7.6 ${alto} Z" fill="${oro}" ${borde(0.8)}/>`);
    return L.armar(`
        <!-- hojas sueltas -->
        <path d="M6 24 l9 -3 l3 8 l-9 3 Z M86 62 l8 3 l-3 8 l-8 -3 Z M70 88 l9 -2 l2 7 l-9 2 Z" fill="${c.hojas}" ${borde(0.9)}/>
        <!-- la garganta y la lengua (la cinta para marcar la página) -->
        <path d="M14 57 L78 28 L86 59 Z" fill="${c.boca}"/>
        <path d="M34 58 C50 50 64 57 72 67 C78 75 76 86 68 84 C72 80 70 74 64 70 C56 64 46 62 36 62 Z" fill="${c.lengua}" ${borde(1)}/>
        <!-- mitad de abajo -->
        <path d="M16 58 L84 58 L86 66 L14 66 Z" fill="${hojas}" ${borde(1)}/>${renglones(60.6)}
        <path d="M12 66 L88 66 L84 79 L16 79 Z" fill="${cuero}" ${borde()}/>${esquinas(66, 9)}
        ${dientes(22, 80, 58.4, 8, -8)}
        <!-- mitad de arriba: la misma, girada sobre el lomo -->
        <g transform="rotate(-23 13 57)">
            <path d="M14 48 L86 48 L84 56 L16 56 Z" fill="${hojas}" ${borde(1)}/>${renglones(50.4)}
            <path d="M16 35 L84 35 L88 48 L12 48 Z" fill="${cuero}" ${borde()}/>${esquinas(48, -9)}
            <ellipse cx="50" cy="41.4" rx="10.4" ry="5.2" fill="${oro}" ${borde(1)}/>
            <ellipse cx="50" cy="41.4" rx="6.8" ry="3.5" fill="${c.ojo}"/>
            <ellipse cx="50" cy="41.4" rx="1.5" ry="3.3" fill="#07050d"/>
            ${dientes(22, 80, 55.6, 8, 8)}
        </g>
        <!-- el lomo -->
        <ellipse cx="13" cy="60" rx="5.4" ry="14.6" fill="${cuero}" ${borde()}/>
        <path d="M8.6 53 l8.8 0 M8.6 67 l8.8 0" stroke="${c.adorno}" stroke-width="1.8"/>`);
}

// Espectro: una túnica que flota, con dos luces donde debería haber una cara.
// Con calavera, corona y báculo es el Archivista.
function espectro(c) {
    const L = lienzo();
    const tunica = L.mate("tunica", c.tunica, 0.3, 0.6);
    const manga = L.mate("manga", c.tunica, 0.2, 0.68);
    const dedos = "M12 56 l-7 1 M12 57.4 l-6.6 6 M13.6 58.6 l-3.4 8.6 M15.8 59 l0 8";
    const brazo = `
        <path d="M35 34 C26 36 16 42 8 52 L14 55 L10.6 61 L18.6 59.6 L19.6 66 L27 60 C30 52 34 46 38 44 Z" fill="${manga}" ${borde()}/>
        <path d="${dedos}" fill="none" stroke="${LINEA}" stroke-width="3" stroke-linecap="round"/>
        <path d="${dedos}" fill="none" stroke="${HUESO}" stroke-width="1.4" stroke-linecap="round"/>`;
    const cara = c.calavera
        ? `<path d="M43 24 C43 18 46.4 15.4 50 15.4 C53.6 15.4 57 18 57 24 C57 27 55.6 28.6 54.6 29.2 L54.6 33 L45.4 33 L45.4 29.2 C44.4 28.6 43 27 43 24 Z" fill="${HUESO}" ${borde(0.9)}/>
           <path d="M46 33.6 L54 33.6 L53.4 37.6 Q50 39 46.6 37.6 Z" fill="${HUESO}" ${borde(0.8)}/>
           <circle cx="47" cy="24.4" r="2.3" fill="${LINEA}"/><circle cx="53" cy="24.4" r="2.3" fill="${LINEA}"/>
           <circle cx="47" cy="24.6" r="1.1" fill="${c.ojo}"/><circle cx="53" cy="24.6" r="1.1" fill="${c.ojo}"/>
           <path d="M50 27 l-1.2 2.6 l2.4 0 Z" fill="${LINEA}"/>`
        : `${ojoDeLuz(45, 27, 3, c.ojo, 18)}${ojoDeLuz(55, 27, 3, c.ojo, -18)}`;
    const corona = c.corona
        ? `<path d="M38 15.6 L39 4 L44.4 10.6 L50 0.6 L55.6 10.6 L61 4 L62 15.6 Q50 9.6 38 15.6 Z" fill="${L.metal("corona", c.corona)}" ${borde(1)}/>
           <circle cx="50" cy="9.4" r="1.7" fill="#e23a4e" stroke="${LINEA}" stroke-width=".5"/>
           <path d="M39 41 Q50 49.6 61 41" fill="none" stroke="${c.corona}" stroke-width="2.4"/>`
        : "";
    const baston = c.orbe
        ? `${tubo("M88 21 L88 96", "#5a3a22", 2.6)}
           <path d="M83.4 22 C80.6 16 82.6 9 86 6.6 M92.6 22 C95.4 16 93.4 9 90 6.6" fill="none" stroke="${c.corona}" stroke-width="1.8" stroke-linecap="round"/>
           <circle cx="88" cy="14" r="6.2" fill="${L.bola("orbe", c.orbe, 0.7, 0.5)}" ${borde(1)}/><circle cx="86" cy="12" r="1.6" fill="#fff"/>`
        : "";
    return L.armar(`
        ${espejo(brazo)}
        <path d="M50 5 C39 7 33 17 33 28 C33 40 28 62 16 90 L24 86 L28 94 L35 86 L40 95 L45 87 L50 96 L55 87 L60 95 L65 86 L72 94 L76 86 L84 90 C72 62 67 40 67 28 C67 17 61 7 50 5 Z" fill="${tunica}" ${borde()}/>
        <path d="M44 46 C43 62 38 78 33 88 M56 46 C57 62 62 78 67 88 M50 48 L50 90" fill="none" stroke="${oscurecer(c.tunica, 0.5)}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M44 8 C38 12 35.6 20 35.6 28" fill="none" stroke="${aclarar(c.tunica, 0.45)}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M50 12 C42 12 38.4 19 38.4 27 C38.4 35 43 41.6 50 43.6 C57 41.6 61.6 35 61.6 27 C61.6 19 58 12 50 12 Z" fill="#0a0612" ${borde(1)}/>
        ${cara}${corona}${baston}`);
}

// Gárgola: un demonio alado en cuclillas. En rojo, con grietas de lava y fuego entre
// los cuernos, es el Señor de la Fragua.
function gargola(c) {
    const L = lienzo();
    const piedra = L.mate("piedra", c.piel, 0.32, 0.6);
    const redonda = L.bola("redonda", c.piel, 0.4, 0.6);
    const membrana = L.mate("ala", c.ala, 0.3, 0.6);
    const garras = (x, y) => `<path d="M${x - 4} ${y} l1.4 4 l1.4 -4 M${x - 0.7} ${y} l1.4 4.6 l1.4 -4.6 M${x + 2.6} ${y} l1.4 4 l1.4 -4" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>`;
    const ala = `
        <path d="M40 42 L23 6 L4 17 C10 23 11 31 7 40 C14 37 19 42 19 50 C25 46 31 48 33 55 L41 54 Z" fill="${membrana}" ${borde()}/>
        <path d="M40 42 L23 6 L4 17 M23 6 L7 40 M23 6 L19 50 M23 6 L33 55" fill="none" stroke="${oscurecer(c.ala, 0.55)}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23 6 l-2 -5.4 l5.4 3.4 Z" fill="${MARFIL}" ${borde(0.6)}/>`;
    const pierna = `
        <path d="${capsula(41, 72, 7.6, 27, 65, 6.6)}" fill="${piedra}" ${borde()}/>
        <path d="${capsula(27, 65, 6, 31, 86, 4.8)}" fill="${piedra}" ${borde()}/>
        <path d="M23 85 L40 85 L41 91.6 L21 91.6 Z" fill="${piedra}" ${borde()}/>${garras(29, 91.4)}`;
    const brazo = `
        <path d="${capsula(33, 43, 6.4, 31, 62, 5.2)}" fill="${piedra}" ${borde()}/>
        <path d="${capsula(31, 62, 5, 42, 84, 4.4)}" fill="${piedra}" ${borde()}/>
        <circle cx="42.6" cy="86.6" r="4.6" fill="${redonda}" ${borde()}/>${garras(43, 90)}
        <circle cx="33" cy="43" r="7.6" fill="${redonda}" ${borde()}/>`;
    const grietas = c.grietas
        ? `<path d="M42 44 l3 6 l-3 5 l4 6 M58 46 l-3 5 l3 6 M31 52 l2 6 M69 52 l-2 6 M29 72 l3 6 M71 72 l-3 6" fill="none" stroke="${c.grietas}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M38 46 l4 5 l-2 4 M60 60 l-3 4 l2 3 M29 70 l3 5 M68 50 l2 5" fill="none" stroke="${LINEA}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>`;
    const fuego = c.fuego
        ? `<path d="M40 14 C37 7 43 5 43 -1 C46 3 47 7 50 1 C53 7 54 3 57 -1 C57 5 63 7 60 14 Q50 9 40 14 Z" fill="#ff8a1f"/>
           <path d="M45 13 C44 9 47 8 47.6 4.6 C49 8 51 8 52.4 4.6 C53 8 56 9 55 13 Q50 10.6 45 13 Z" fill="#ffe45a"/>`
        : "";
    return L.armar(`
        ${espejo(ala)}
        ${tubo("M60 88 C76 93 90 86 91 73", c.piel, 3)}<path d="M91 73 l-5.4 -5 l9.4 -2 Z" fill="${piedra}" ${borde(1)}/>
        ${espejo(pierna)}
        <path d="M36 40 C34 52 37 66 42 73 L58 73 C63 66 66 52 64 40 C58 36 42 36 36 40 Z" fill="${piedra}" ${borde()}/>
        <path d="M50 42 L50 70 M39 50 Q44.6 54.6 50 50 Q55.4 54.6 61 50 M42.6 60 L57.4 60 M43.6 66 L56.4 66" fill="none" stroke="${LINEA}" stroke-width=".9"/>
        ${grietas}
        ${espejo(brazo)}
        <!-- cabeza: orejas, cuernos, ceño y colmillos -->
        ${espejo(`<path d="M40 25 L31 17 L40 31 Z" fill="${piedra}" ${borde(1)}/>
                  <path d="M43 15 C37 12.6 34.6 6.6 36.6 0.6 C40 5 44 8 47.6 12 Z" fill="${c.cuerno}" ${borde(1)}/>`)}
        ${fuego}
        <path d="M40 26 C40 16 44 11.6 50 11.6 C56 11.6 60 16 60 26 C60 32.6 56 38.4 50 39.6 C44 38.4 40 32.6 40 26 Z" fill="${redonda}" ${borde()}/>
        <path d="M41 22 L49 26 L51 26 L59 22 L58 19.4 L50 23 L42 19.4 Z" fill="${oscurecer(c.piel, 0.55)}"/>
        ${ojoDeLuz(45.6, 26.8, 2.3, c.ojo, 22)}${ojoDeLuz(54.4, 26.8, 2.3, c.ojo, -22)}
        <path d="M44 32 Q50 35 56 32 L54.6 36 Q50 38 45.4 36 Z" fill="#1a0a12" ${borde(0.7)}/>
        <path d="M45.6 32.8 l1 3.4 l1.2 -3 Z M52.2 33.2 l1.2 3 l1 -3.4 Z" fill="#fff"/>`);
}


// ===== Fragua del abismo =====

// Ascua errante: una calavera envuelta en llamas.
function ascua(c) {
    const L = lienzo();
    const fuera = L.vertical("fuera", aclarar(c.llama, 0.15), oscurecer(c.llama, 0.4));
    const hueso = L.bola("hueso", c.hueso, 0.4, 0.55);
    return L.armar(`
        <path d="M11 40 l4 -4 l4 4 l-4 4 Z M84 28 l3.4 -3.4 l3.4 3.4 l-3.4 3.4 Z M22 16 l3 -3 l3 3 l-3 3 Z M78 8 l2.6 -2.6 l2.6 2.6 l-2.6 2.6 Z M90 60 l2.4 -2.4 l2.4 2.4 l-2.4 2.4 Z" fill="${c.medio}"/>
        <path d="M50 96 C30 96 18 82 18 64 C18 52 24 46 26 36 C30 42 32 46 34 44 C32 30 40 20 46 6 C48 16 54 20 58 28 C60 22 62 18 62 12 C72 24 80 38 78 52 C82 50 84 46 84 42 C88 52 86 66 82 76 C78 88 66 96 50 96 Z" fill="${fuera}" ${borde()}/>
        <path d="M50 93 C34 93 26 81 26 67 C26 57 31 53 33 47 C36 53 39 53 40 49 C40 39 44 31 48 21 C50 29 55 33 57 41 C60 37 61 33 62 29 C68 39 72 49 71 59 C74 59 76 57 77 55 C78 63 76 73 73 79 C69 88 61 93 50 93 Z" fill="${c.medio}"/>
        <path d="M50 90 C38 90 32 80 33 70 C34 62 38 60 40 56 C42 60 44 60 45 56 C46 48 48 42 50 36 C52 42 56 46 57 52 C59 50 60 48 61 46 C65 54 68 62 67 70 C68 80 62 90 50 90 Z" fill="${c.centro}"/>
        <!-- la calavera, con fuego en las cuencas -->
        <path d="M39 64 C39 54 44 50 50 50 C56 50 61 54 61 64 C61 68.4 59.4 70.4 57.6 71.4 L57.6 76 L42.4 76 L42.4 71.4 C40.6 70.4 39 68.4 39 64 Z" fill="${hueso}" ${borde()}/>
        <path d="M43.4 78 L56.6 78 L55.6 83 Q50 85.6 44.4 83 Z" fill="${hueso}" ${borde(1)}/>
        <ellipse cx="45" cy="64" rx="3.3" ry="3.7" fill="${LINEA}"/><ellipse cx="55" cy="64" rx="3.3" ry="3.7" fill="${LINEA}"/>
        <circle cx="45" cy="64.4" r="1.6" fill="${c.centro}"/><circle cx="55" cy="64.4" r="1.6" fill="${c.centro}"/>
        <path d="M50 67.4 l-1.6 3.4 l3.2 0 Z" fill="${LINEA}"/>
        <path d="M43.6 73.4 L56.4 73.4 M46 72 l0 3.6 M48.6 72 l0 3.6 M51.4 72 l0 3.6 M54 72 l0 3.6" stroke="${LINEA}" stroke-width=".8"/>`);
}

// Gólem de hierro: un gigante de placas remachadas con un horno en el pecho.
function golem(c) {
    const L = lienzo();
    const hierro = L.mate("hierro", c.hierro, 0.35, 0.6);
    const placa = L.metal("placa", c.hierro);
    const remache = (x, y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${aclarar(c.hierro, 0.55)}" stroke="${LINEA}" stroke-width=".5"/>`;
    const brazo = `
        <path d="M14 25 L14 13 L21 12 L21 24 Z" fill="${hierro}" ${borde(1)}/>
        <path d="M13 44 L28 43 L26.6 60 L13 60 Z" fill="${hierro}" ${borde()}/>
        <path d="M8 25 L33 22 L36 42 L11 45 Z" fill="${placa}" ${borde()}/>${remache(13, 29)}${remache(31, 26.6)}${remache(15, 41)}${remache(32.6, 38.6)}
        <path d="M5 58 L31 58 L32 87 L4 87 Z" fill="${placa}" ${borde()}/>
        <path d="M4.6 77 L31.6 77 M12 77 l0 10 M19 77 l0 10 M26 77 l0 10" stroke="${LINEA}" stroke-width="1"/>${remache(9, 62.6)}${remache(27, 62.6)}`;
    return L.armar(`
        ${espejo(`<path d="M32 70 L47 70 L47.6 90 L30 90 Z" fill="${hierro}" ${borde()}/><path d="M27 88 L48.6 88 L48.6 95 L25 95 Z" fill="${placa}" ${borde()}/>`)}
        <path d="M24 28 L76 28 L70 71 L30 71 Z" fill="${placa}" ${borde()}/>
        <!-- óxido -->
        <path d="M27 30 l12 0 l-4 9 l-7 2 Z M62 60 l8 -3 l-1.4 12 l-7 0 Z" fill="${c.oxido}"/>
        <path d="M27 64.6 L73 64.6" stroke="${LINEA}" stroke-width="1"/>${remache(31, 67.6)}${remache(40, 67.6)}${remache(60, 67.6)}${remache(69, 67.6)}
        <!-- el horno del pecho -->
        <path d="M39.6 39 L60.4 39 L61.4 60 L38.6 60 Z" fill="#1c0c06" ${borde(1.2)}/>
        <path d="M42.4 42 L57.6 42 L58.2 57.6 L41.8 57.6 Z" fill="${c.fuego}"/>
        <path d="M45 46 L55 46 L55.4 56 L44.6 56 Z" fill="${aclarar(c.fuego, 0.65)}"/>
        <path d="M46.4 40 l0 19 M50 40 l0 19 M53.6 40 l0 19" stroke="#1c0c06" stroke-width="1.6"/>
        <!-- cabeza hundida entre los hombros -->
        <path d="M47 13.4 L53 13.4 L52 7.6 L48 7.6 Z" fill="${hierro}" ${borde(1)}/>
        <path d="M40.6 13 L59.4 13 L61.6 30 L38.4 30 Z" fill="${placa}" ${borde()}/>
        <path d="M42.4 19 L57.6 19 L58 24.6 L42 24.6 Z" fill="#1c0c06"/>
        <path d="M44.4 20.4 l4.4 0 l0 2.8 l-4.4 0 Z M51.2 20.4 l4.4 0 l0 2.8 l-4.4 0 Z" fill="${c.fuego}"/>
        ${espejo(brazo)}`);
}

// Mímico: un cofre que no es un cofre.
function mimico(c) {
    const L = lienzo();
    const madera = L.mate("madera", c.madera, 0.28, 0.55);
    const hierro = L.metal("hierro", c.herraje);
    return L.armar(`
        <!-- la tapa, con ojos -->
        <path d="M14 44 C14 24 30 13.6 50 13.6 C70 13.6 86 24 86 44 Z" fill="${madera}" ${borde()}/>
        <path d="M50 14 L50 40" stroke="${oscurecer(c.madera, 0.5)}" stroke-width="1"/>
        ${espejo(`<path d="M27 19 L22 39 L29.6 39 L34 15.6 Z" fill="${hierro}" ${borde(1)}/>
                  <path d="M31 26 L45 31 L44 36.6 L31.6 34.6 Z" fill="#0a0612"/>${ojoDeLuz(39, 32.2, 2.8, c.ojo, 18)}`)}
        <path d="M13 38.6 L87 38.6 L86 45.4 L14 45.4 Z" fill="${hierro}" ${borde(1)}/>
        <!-- la garganta y los dientes de arriba -->
        <path d="M15 45 L85 45 L82 60 L18 60 Z" fill="${c.boca}" ${borde(1)}/>
        ${dientes(18, 82, 45.4, 9, 8.4)}
        <!-- la caja -->
        <path d="M17 58 L83 58 L81 93 L19 93 Z" fill="${madera}" ${borde()}/>
        <path d="M18 71 L82 71 M18.6 82 L81.4 82" stroke="${oscurecer(c.madera, 0.5)}" stroke-width="1"/>
        ${espejo(`<path d="M24 62 L31 62 L31.6 93 L25 93 Z" fill="${hierro}" ${borde(1)}/>`)}
        <path d="M16 56 L84 56 L83.6 62.4 L16.4 62.4 Z" fill="${hierro}" ${borde(1)}/>
        ${dientes(20, 80, 56.6, 9, -7.4)}
        <!-- la lengua, hasta el suelo -->
        <path d="M42 57 C46 52 58 52 60 58 C63 70 70 80 80 84 C86 86 90 82 88 77 C93 84 90 95 80 95 C66 95 56 80 50 67 C46 63 43 61 42 57 Z" fill="${c.lengua}" ${borde(1)}/>
        <path d="M52 59 C56 72 66 84 80 89.6" fill="none" stroke="${oscurecer(c.lengua, 0.4)}" stroke-width="1"/>
        <!-- monedas: el cebo -->
        <ellipse cx="12" cy="93.6" rx="4.6" ry="2" fill="${c.oro}" stroke="${LINEA}" stroke-width=".7"/>
        <ellipse cx="36" cy="95" rx="4.6" ry="2" fill="${c.oro}" stroke="${LINEA}" stroke-width=".7"/>`);
}


// ===== Cima de la tormenta =====

// Cristal gélido: agujas de hielo alrededor de un corazón que brilla.
function cristal(c) {
    const L = lienzo();
    // Una aguja: se dibuja hacia arriba desde (0, 0) y después se mueve y se gira.
    const aguja = (x, y, largo, ancho, giro) => {
        const punta = largo - ancho * 1.5;
        return `<g transform="translate(${x} ${y}) rotate(${giro})">
            <path d="M${-ancho} 0 L${-ancho} ${-punta} L0 ${-largo} L${ancho} ${-punta} L${ancho} 0 Z" fill="${c.medio}" ${borde(1.1)}/>
            <path d="M${-ancho} 0 L${-ancho} ${-punta} L0 ${-largo} L${-ancho * 0.25} ${-punta} L${-ancho * 0.25} 0 Z" fill="${c.claro}"/>
            <path d="M${ancho * 0.45} 0 L${ancho * 0.45} ${-punta} L0 ${-largo} L${ancho} ${-punta} L${ancho} 0 Z" fill="${c.oscuro}"/>
            <path d="M${-ancho * 0.25} 0 L${-ancho * 0.25} ${-punta} L0 ${-largo}" fill="none" stroke="#fff" stroke-width=".9"/></g>`;
    };
    return L.armar(`
        <path d="M12 44 l3.6 -6 l3.6 6 l-3.6 6 Z M84 34 l3 -5 l3 5 l-3 5 Z M20 16 l2.6 -4.4 l2.6 4.4 l-2.6 4.4 Z M88 64 l2.4 -4 l2.4 4 l-2.4 4 Z" fill="${c.claro}" ${borde(0.7)}/>
        ${aguja(31, 86, 36, 6.4, -52)}${aguja(69, 86, 38, 6.4, 50)}
        ${aguja(39, 86, 54, 8.4, -24)}${aguja(61, 86, 58, 8.6, 22)}
        ${aguja(50, 88, 80, 11.6, 0)}
        <path d="M27 86 L73 86 L66 95 L50 98 L34 95 Z" fill="${c.oscuro}" ${borde()}/>
        <path d="M27 86 L73 86 L66 89 L34 89 Z" fill="${c.medio}"/>
        ${aguja(42, 92, 24, 6, -10)}${aguja(58, 92, 22, 5.6, 12)}
        <!-- lo que mira desde adentro -->
        ${ojoDeLuz(45.6, 40, 2.6, c.ojo, 24)}${ojoDeLuz(54.4, 40, 2.6, c.ojo, -24)}
        <path d="M50 49 L55 57 L50 65 L45 57 Z" fill="#fff" stroke="${c.oscuro}" stroke-width="1.2" stroke-linejoin="round"/>`);
}

// Sierpe: enroscada, con el cuello en alto y la boca abierta.
function sierpe(c) {
    const L = lienzo();
    const escama = L.mate("escama", c.escama, 0.35, 0.6);
    const anillo = L.bola("anillo", c.escama, 0.45, 0.62);
    const cuello = "M40 73 C22 60 25 42 40 38 C52 35 57 28 55 19";
    const trazo = (color, grosor, extra = 'stroke-linecap="round"') => `<path d="${cuello}" fill="none" stroke="${color}" stroke-width="${grosor}" ${extra}/>`;
    return L.armar(`
        ${tubo("M22 84 C10 80 6 70 11 60", c.escama, 4)}
        <!-- los anillos del cuerpo -->
        <ellipse cx="50" cy="85" rx="33" ry="9.6" fill="${anillo}" ${borde()}/>
        <path d="M24 88.4 Q50 96 76 88.4" fill="none" stroke="${c.vientre}" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="48" cy="74.6" rx="25" ry="8.6" fill="${anillo}" ${borde()}/>
        <path d="M29 78 Q48 84.6 67 78" fill="none" stroke="${c.vientre}" stroke-width="2.2" stroke-linecap="round"/>
        <!-- la capucha, con su marca -->
        <ellipse cx="45" cy="31" rx="17" ry="13" fill="${escama}" ${borde()} transform="rotate(-24 45 31)"/>
        <ellipse cx="36.6" cy="31" rx="3" ry="4.6" fill="${c.marca}" transform="rotate(-24 36.6 31)"/>
        <!-- el cuello: borde, escamas, luz y las placas del vientre -->
        ${trazo(LINEA, 17)}${trazo(c.escama, 14.4)}
        ${trazo(aclarar(c.escama, 0.4), 2.6, 'stroke-linecap="round" transform="translate(-4.4 -1)"')}
        ${trazo(c.vientre, 5, 'stroke-linecap="round" transform="translate(4.6 1)"')}
        ${trazo(oscurecer(c.vientre, 0.3), 5, 'stroke-dasharray="1.2 4" transform="translate(4.6 1)"')}
        <!-- la cabeza -->
        <path d="M50 13 L40 3 L48 17 Z M46.6 19 L35 14 L45 23 Z" fill="${c.marca}" ${borde(0.9)}/>
        <path d="M60 22 L85 20.6 L80 30.4 L61 27 Z" fill="#5a0f1c"/>
        <path d="M68 26.6 L90 27.6 L95 24.6 M90 27.6 L95 31" fill="none" stroke="#e23a4e" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M50 24.6 L64 24 L81 30 L79 33.6 L60 32 C54 31 50 29 50 24.6 Z" fill="${escama}" ${borde()}/>
        <path d="M46 16 C48 7 60 4 70 9 L86 17 L85 21.4 L64 22.4 L50 25 C46 23 45 19 46 16 Z" fill="${escama}" ${borde()}/>
        <path d="M79 21 l-0.6 6 l3 -6 Z M72 21.6 l-0.4 4.6 l2.6 -4.8 Z M73 29.4 l1 -3.6 l1.6 4 Z" fill="#fff" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>
        ${ojoDeFiera(62, 13.6, 2.7, c.ojo)}
        <path d="M57 9.6 L67.6 11.6" stroke="${LINEA}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="81.4" cy="16.4" r=".9" fill="${LINEA}"/>`);
}

// Dragón de la tormenta: el último guardián.
function dragon(c) {
    const L = lienzo();
    const escama = L.mate("escama", c.escama, 0.35, 0.62);
    const redonda = L.bola("cuerpo", c.escama, 0.45, 0.62);
    const membrana = L.mate("ala", c.ala, 0.4, 0.6);
    const vientre = L.mate("vientre", c.vientre, 0.25, 0.45);
    const ala = `
        <path d="M43 54 L21 9 L2 25 C10 29 12 38 8 48 C16 44 22 48 22 58 C28 52 34 54 36 62 L45 60 Z" fill="${membrana}" ${borde()}/>
        <path d="M43 54 L21 9 L2 25 M21 9 L8 48 M21 9 L22 58 M21 9 L36 62" fill="none" stroke="${oscurecer(c.escama, 0.35)}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 9 l-2 -6 l5.4 3.6 Z" fill="${MARFIL}" ${borde(0.6)}/>`;
    const cuello = "M50 58 C39 48 38 34 47 26 C51 22.6 56 22 60 22";
    const trazo = (color, grosor, extra = 'stroke-linecap="round"') => `<path d="${cuello}" fill="none" stroke="${color}" stroke-width="${grosor}" ${extra}/>`;
    const garras = (x, y) => `<path d="M${x} ${y} l1.6 -4 l1.6 4 M${x + 5.6} ${y} l1.6 -4 l1.6 4 M${x + 11.2} ${y} l1.6 -4 l1.6 4" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>`;
    return L.armar(`
        ${espejo(ala)}
        <!-- la cola -->
        <path d="M56 80 C72 90 88 86 90 72 L96 70 C97 90 76 99 54 91 Z" fill="${escama}" ${borde()}/>
        <path d="M93 71 L87 61 L99.4 63 Z" fill="${MARFIL}" ${borde(0.9)}/>
        <!-- las patas de atrás -->
        ${espejo(`<ellipse cx="35" cy="80" rx="10" ry="12" fill="${redonda}" ${borde()}/>
                  <path d="M25 89 L42 89 L42 95 L23 95 Z" fill="${escama}" ${borde()}/>${garras(24, 96)}`)}
        <!-- el cuerpo y las placas del pecho -->
        <path d="M36 56 C33 70 38 87 50 91 C62 87 67 70 64 56 C60 48 40 48 36 56 Z" fill="${redonda}" ${borde()}/>
        <path d="M43 58 C42 70 44 82 50 87 C56 82 58 70 57 58 C54 54 46 54 43 58 Z" fill="${vientre}" ${borde(1)}/>
        <path d="M43.4 63 L56.6 63 M43 68.6 L57 68.6 M43.6 74 L56.4 74 M45 79.4 L55 79.4" stroke="${oscurecer(c.vientre, 0.5)}" stroke-width=".9"/>
        <!-- las patas de adelante -->
        ${espejo(`<path d="${capsula(37, 60, 4.8, 32, 76, 3.8)}" fill="${escama}" ${borde()}/>
                  <path d="M28.6 78.6 l1.4 -3.6 l1.4 3.6 M31.4 79.6 l1.2 -3.6 l1.4 3.4 M34.2 78.6 l1.2 -3.4 l1.4 3.4" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>`)}
        <!-- el cuello, con su cresta -->
        <path d="M41 50 L32 49 L39.4 43.6 Z M38.6 41 L30 38 L39 34 Z M42 30 L35.6 22.6 L45.6 25 Z" fill="${c.cresta}" ${borde(0.8)}/>
        ${trazo(LINEA, 15.6)}${trazo(c.escama, 13)}
        ${trazo(aclarar(c.escama, 0.4), 2.4, 'stroke-linecap="round" transform="translate(-3.8 -1.4)"')}
        ${trazo(c.vientre, 4.4, 'stroke-linecap="round" transform="translate(4 1.6)"')}
        ${trazo(oscurecer(c.vientre, 0.3), 4.4, 'stroke-dasharray="1.2 4" transform="translate(4 1.6)"')}
        <!-- la cabeza: cuernos, fauces y el rayo que le sube por la garganta -->
        <path d="M55 15 L41 2 L51 19 Z M60 12.6 L52 0 L64 12 Z" fill="${MARFIL}" ${borde(1)}/>
        <path d="M65 28 L90 25.6 L85 35 L67 32 Z" fill="#3a0f2a"/>
        <path d="M70 29.6 L88 28 L85.6 33 Z" fill="${c.aliento}"/>
        <path d="M56 30.6 L70 29.6 L86 35 L84 38.6 L64 38 C58 37 56 34 56 30.6 Z" fill="${escama}" ${borde()}/>
        <path d="M50 19 C54 10.6 64 8.6 72 12.6 L90 20.6 L90 26 L70 28 L56 31 C50 29 48 23 50 19 Z" fill="${escama}" ${borde()}/>
        <path d="M84 25.8 l-0.6 5 l2.8 -5.2 Z M78 26.6 l-0.4 4.4 l2.6 -4.6 Z M72 27.4 l-0.2 3.6 l2.4 -3.8 Z M76 33.4 l1 -3.6 l1.6 4 Z M70 32.4 l.8 -3 l1.6 3.4 Z" fill="#fff" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>
        ${ojoDeFiera(65, 18, 2.7, c.ojo)}
        <path d="M59 13.6 L70.6 16.4" stroke="${LINEA}" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="85.4" cy="20.6" r=".9" fill="${LINEA}"/>
        <!-- chispas -->
        <path d="M9 68 l5 -7 l-3 0 l5 -8 M91 50 l-4 6 l3 0 l-4 7" fill="none" stroke="${c.aliento}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
}


// ===== Mazmorra del Abismo (v29) =====

// Una línea gruesa que se afina hacia la punta (tentáculos, colas, raíces): el mismo camino
// pintado tres veces, cada vez más delgado y más corto (stroke-dasharray corta el final).
function afinado(d, color, grosor, largo = 120) {
    const tramo = (g, parte) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${(largo * parte).toFixed(1)} 400"/>`;
    const bordeTramo = (g, parte) => `<path d="${d}" fill="none" stroke="${LINEA}" stroke-width="${g + 2}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${(largo * parte).toFixed(1)} 400"/>`;
    return `${bordeTramo(grosor * 0.35, 1)}${bordeTramo(grosor * 0.7, 0.7)}${bordeTramo(grosor, 0.42)}
            ${tramo(grosor * 0.35, 1)}${tramo(grosor * 0.7, 0.7)}${tramo(grosor, 0.42)}`;
}

// Un anillo de dientes que apuntan hacia el centro (bocas redondas: sanguijuela, gusano).
function aroDeDientes(cx, cy, rx, ry, cuantos, largo) {
    let d = "";
    for (let i = 0; i < cuantos; i++) {
        const a = (i / cuantos) * Math.PI * 2;
        const b = a + Math.PI / cuantos;
        const c = a + (Math.PI * 2) / cuantos;
        const punto = (angulo, r) => `${(cx + Math.cos(angulo) * rx * r).toFixed(1)} ${(cy + Math.sin(angulo) * ry * r).toFixed(1)}`;
        d += `M${punto(a, 1)} L${punto(b, 1 - largo)} L${punto(c, 1)} Z `;
    }
    return `<path d="${d}" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>`;
}

// Una pinza que mira a la derecha (cangrejo y escorpión). (x, y) = el centro de la palma.
// Arriba el dedo fijo, abajo el que se mueve, y entre los dos una «V» abierta.
function pinza(L, nombre, x, y, color, escala = 1) {
    const p = (dx, dy) => `${(x + dx * escala).toFixed(1)} ${(y + dy * escala).toFixed(1)}`;
    const caparazon = L.bola(nombre, color, 0.5, 0.6);
    return `<path d="M${p(-10, 0)} C${p(-10, -9)} ${p(-2, -11)} ${p(4, -9)} C${p(10, -8)} ${p(15, -6)} ${p(17, -2)}
                     C${p(13, -3)} ${p(8, -2)} ${p(3, -0.5)} L${p(3, 0.5)} C${p(8, 1.6)} ${p(12, 3)} ${p(15, 5)}
                     C${p(12, 9)} ${p(6, 10)} ${p(2, 9)} C${p(-4, 10)} ${p(-10, 7)} ${p(-10, 0)} Z" fill="${caparazon}" ${borde()}/>`;
}

// --- Cisternas anegadas ---

// Sanguijuela gigante: sale del agua en forma de S, con una boca redonda llena de dientes.
function sanguijuela(c) {
    const L = lienzo();
    const cuerpo = "M16 90 C6 72 20 58 38 64 C56 70 70 62 64 46 C59 33 65 22 76 20";
    const trazo = (color, grosor, extra = 'stroke-linecap="round"') => `<path d="${cuerpo}" fill="none" stroke="${color}" stroke-width="${grosor}" ${extra}/>`;
    return L.armar(`
        <!-- el charco del que sale -->
        <ellipse cx="22" cy="91" rx="21" ry="5" fill="${c.agua}" ${borde(1)}/>
        <path d="M6 91 q8 -3 16 0 q8 3 16 0" fill="none" stroke="${aclarar(c.agua, 0.4)}" stroke-width="1" stroke-linecap="round"/>
        <!-- el cuerpo: borde, color, anillos, raya y luz -->
        ${trazo(LINEA, 22)}${trazo(c.piel, 19)}
        ${trazo(oscurecer(c.piel, 0.45), 19, 'stroke-dasharray="1.3 5.2"')}
        ${trazo(c.raya, 3, 'stroke-linecap="round" stroke-dasharray="7 3" transform="translate(3 1.4)"')}
        ${trazo(aclarar(c.piel, 0.45), 2.6, 'stroke-linecap="round" transform="translate(-4.4 -2.4)"')}
        <!-- la boca: una ventosa con un anillo de dientes -->
        <ellipse cx="80" cy="21" rx="12" ry="13" fill="${L.bola("cabeza", c.piel, 0.45, 0.6)}" ${borde()}/>
        <ellipse cx="83" cy="21" rx="7.6" ry="9" fill="${c.boca}" ${borde(1)}/>
        ${aroDeDientes(83, 21, 7.6, 9, 11, 0.42)}
        <circle cx="83.6" cy="21" r="2.2" fill="#07030a"/>
        <!-- gotas -->
        <path d="M88 36 q1.4 3.4 0 4.6 q-1.4 -1.2 0 -4.6 Z M71 33 q1.2 3 0 4 q-1.2 -1 0 -4 Z" fill="${aclarar(c.agua, 0.5)}"/>`);
}

// Ahogado: un cuerpo hinchado y pálido, con algas en los hombros, que estira un brazo hacia ti.
function ahogado(c) {
    const L = lienzo();
    const piel = L.mate("piel", c.piel, 0.3, 0.55);
    const ropa = L.mate("ropa", c.ropa, 0.25, 0.6);
    const alga = (d) => tubo(d, c.alga, 2);
    return L.armar(`
        <!-- piernas y pies -->
        <path d="${capsula(44, 64, 6, 41, 89, 5)}" fill="${piel}" ${borde()}/>
        <path d="${capsula(56, 64, 6, 59, 89, 5)}" fill="${piel}" ${borde()}/>
        <ellipse cx="39" cy="91.6" rx="7" ry="3" fill="${piel}" ${borde(1)}/><ellipse cx="62" cy="91.6" rx="7" ry="3" fill="${piel}" ${borde(1)}/>
        <!-- pantalón roto -->
        <path d="M36 57 L64 57 L66 75 L60 71 L56 78 L50 72 L45 77 L40 71 L34 75 Z" fill="${ropa}" ${borde()}/>
        <!-- brazo de atrás, colgando -->
        <path d="${capsula(37, 35, 5, 30, 53, 4.4)}" fill="${piel}" ${borde()}/>
        <path d="${capsula(30, 53, 4.4, 31, 69, 4)}" fill="${piel}" ${borde()}/>
        <path d="M27 70 l-1 5 M30 71 l0 5.4 M33 70 l1 5" stroke="${LINEA}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M27 70 l-1 5 M30 71 l0 5.4 M33 70 l1 5" stroke="${c.piel}" stroke-width="1.2" stroke-linecap="round"/>
        <!-- torso: la camisa rota deja ver el pecho -->
        <path d="M35 31 C33 43 34 51 36 60 L64 60 C67 50 67 42 65 31 C57 26 43 26 35 31 Z" fill="${ropa}" ${borde()}/>
        <path d="M44 30 L56 30 L54 44 L58 52 L49 48 L42 54 L45 42 Z" fill="${piel}" ${borde(0.9)}/>
        <path d="M46 37 q4 2 8 0 M46 42 q4 2 8 0" fill="none" stroke="${oscurecer(c.piel, 0.45)}" stroke-width=".9"/>
        <!-- algas que cuelgan -->
        ${alga("M38 30 C34 40 40 46 36 56")}${alga("M62 30 C66 38 61 44 64 52")}${alga("M42 29 C42 36 46 40 44 46")}
        <!-- brazo de adelante, estirado hacia ti -->
        <path d="${capsula(62, 35, 5.4, 75, 44, 4.6)}" fill="${piel}" ${borde()}/>
        <path d="${capsula(75, 44, 4.6, 88, 41, 4)}" fill="${piel}" ${borde()}/>
        <path d="M90 37 l6 -2 M91 40 l7 0 M91 43 l6 2 M88 45 l3 4" stroke="${LINEA}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M90 37 l6 -2 M91 40 l7 0 M91 43 l6 2 M88 45 l3 4" stroke="${c.piel}" stroke-width="1.3" stroke-linecap="round"/>
        <!-- la cabeza ladeada: pelo mojado, ojos sin vida y la boca abierta -->
        <path d="M40 22 C38 12 44 6 51 6 C58 6 63 12 61 22 C60 30 56 34 50 34 C44 34 41 30 40 22 Z" fill="${L.bola("cara", c.piel, 0.35, 0.6)}" ${borde()} transform="rotate(10 50 20)"/>
        <path d="M39 18 C40 8 48 4 54 5 C60 6 63 12 62 18 L60 13 L58 30 L56 14 L52 12 L46 14 L43 30 L42 15 Z" fill="${c.pelo}" ${borde(1)} transform="rotate(10 50 20)"/>
        ${ojoDeLuz(47, 20, 2.4, c.ojo, 14)}${ojoDeLuz(55.6, 21.6, 2.4, c.ojo, -6)}
        <ellipse cx="51" cy="28" rx="3" ry="3.8" fill="#0a1214" ${borde(0.7)} transform="rotate(10 51 28)"/>
        <!-- gotas -->
        <path d="M33 80 q1.4 3.4 0 4.6 q-1.4 -1.2 0 -4.6 Z M68 66 q1.2 3 0 4 q-1.2 -1 0 -4 Z M86 52 q1.2 3 0 4 q-1.2 -1 0 -4 Z" fill="${c.gota}"/>`);
}

// Aguaviva: una campana pálida que flota, con un corazón que brilla y tentáculos largos.
function aguaviva(c) {
    const L = lienzo();
    const campana = L.bola("campana", c.campana, 0.5, 0.55);
    const brazo = L.mate("brazo", c.brazo, 0.3, 0.5);
    const tentaculo = (d) => `<path d="${d}" fill="none" stroke="${LINEA}" stroke-width="3" stroke-linecap="round"/>
                              <path d="${d}" fill="none" stroke="${c.tentaculo}" stroke-width="1.4" stroke-linecap="round"/>`;
    return L.armar(`
        <!-- tentáculos largos -->
        ${tentaculo("M24 46 C20 58 28 66 22 78 C18 86 24 90 22 96")}
        ${tentaculo("M34 48 C32 60 38 68 34 80 C32 88 36 92 34 97")}
        ${tentaculo("M66 48 C68 60 62 68 66 80 C68 88 64 92 66 97")}
        ${tentaculo("M76 46 C80 58 72 66 78 78 C82 86 76 90 78 96")}
        <!-- los brazos del centro, con volados -->
        <path d="M40 46 C38 58 46 62 40 72 C36 80 44 84 42 92 L48 90 C50 82 44 78 48 70 C52 62 46 56 48 46 Z" fill="${brazo}" ${borde(1)}/>
        <path d="M60 46 C62 58 54 62 60 72 C64 80 56 84 58 92 L52 90 C50 82 56 78 52 70 C48 62 54 56 52 46 Z" fill="${brazo}" ${borde(1)}/>
        <!-- la campana, con su borde ondulado -->
        <path d="M14 46 C14 20 32 8 50 8 C68 8 86 20 86 46 C80 51 74 44 68 50 C62 44 56 51 50 46 C44 51 38 44 32 50 C26 44 20 51 14 46 Z" fill="${campana}" ${borde()}/>
        <path d="M24 40 C24 28 30 18 40 13 M76 40 C76 28 70 18 60 13 M50 10 L50 40" fill="none" stroke="${oscurecer(c.campana, 0.3)}" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M22 30 C24 22 30 15 38 12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
        <!-- adentro: lo que se tragó (una calavera a medio deshacer) y el corazón que brilla -->
        <path d="M40 30 C40 23 44 20 49 20 C54 20 58 23 58 30 C58 33 56.6 34.4 55 35 L55 38 L43 38 L43 35 C41.4 34.4 40 33 40 30 Z" fill="${oscurecer(c.campana, 0.25)}" stroke="${oscurecer(c.campana, 0.55)}" stroke-width=".8"/>
        <ellipse cx="45.4" cy="29.6" rx="2.6" ry="3" fill="${oscurecer(c.campana, 0.7)}"/><ellipse cx="52.6" cy="29.6" rx="2.6" ry="3" fill="${oscurecer(c.campana, 0.7)}"/>
        <path d="M45 36 l0 2 M48 36 l0 2 M51 36 l0 2" stroke="${oscurecer(c.campana, 0.55)}" stroke-width=".8"/>
        <path d="M50 40 C54 40 57 43 54 46 L50 49 L46 46 C43 43 46 40 50 40 Z" fill="${c.nucleo}" ${borde(0.9)}/>
        <path d="M48 42 C49 41.4 50.6 41.4 51.4 42.2" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`);
}

// Cangrejo acorazado: un caparazón de escudos remachados, ojos en antenas y dos pinzas.
function cangrejo(c) {
    const L = lienzo();
    const caparazon = L.bola("caparazon", c.caparazon, 0.45, 0.6);
    const placa = L.metal("placa", c.placa);
    const pata = (d) => tubo(d, c.pata, 3.2);
    const remache = (x, y) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${aclarar(c.placa, 0.6)}" stroke="${LINEA}" stroke-width=".5"/>`;
    return L.armar(`
        <!-- las patas -->
        ${espejo(pata("M36 70 L22 74 L16 92") + pata("M40 73 L30 80 L28 94") + pata("M33 66 L16 64 L8 84"))}
        <!-- los brazos y las pinzas, levantadas -->
        ${tubo("M28 62 L18 50 L18 40", c.pata, 4)}
        ${tubo("M72 62 L82 52 L82 42", c.pata, 4.6)}
        <g transform="rotate(-70 18 34)">${pinza(L, "pinza1", 18, 34, c.caparazon, 0.85)}</g>
        <g transform="rotate(-62 84 34)">${pinza(L, "pinza2", 84, 34, c.caparazon, 1.05)}</g>
        <!-- los ojos en sus antenas -->
        ${tubo("M44 50 L41 38", c.pata, 2)}${tubo("M56 50 L59 38", c.pata, 2)}
        ${ojoDeFiera(41, 36, 3, c.ojo)}${ojoDeFiera(59, 36, 3, c.ojo)}
        <!-- el caparazón: escudos viejos remachados -->
        <path d="M20 68 C20 50 34 44 50 44 C66 44 80 50 80 68 C72 78 28 78 20 68 Z" fill="${caparazon}" ${borde()}/>
        <path d="M32 50 L44 47 L46 62 L33 64 Z" fill="${placa}" ${borde(0.9)}/>
        <path d="M56 47 L68 50 L67 64 L54 62 Z" fill="${placa}" ${borde(0.9)}/>
        <path d="M45 60 L55 60 L56 72 L50 75 L44 72 Z" fill="${placa}" ${borde(0.9)}/>
        ${remache(35, 53)}${remache(42, 51)}${remache(58, 51)}${remache(65, 53)}${remache(50, 64)}
        <path d="M24 66 C34 72 66 72 76 66" fill="none" stroke="${oscurecer(c.caparazon, 0.5)}" stroke-width="1.2"/>
        <!-- la boca -->
        <path d="M45 72 l2 4 l3 -3 l3 3 l2 -4" fill="none" stroke="${LINEA}" stroke-width="1.3" stroke-linejoin="round"/>`);
}

// Bestia de la cisterna: una cabeza enorme que sale del agua, con tentáculos alrededor.
function kraken(c) {
    const L = lienzo();
    const piel = L.bola("piel", c.piel, 0.45, 0.62);
    const ventosas = (puntos) => puntos.map(([x, y, r = 1.3]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.ventosa}" stroke="${LINEA}" stroke-width=".4"/>`).join("");
    return L.armar(`
        <!-- tentáculos de atrás -->
        ${afinado("M24 86 C10 74 6 54 14 40 C18 32 26 34 24 42", c.piel, 9, 95)}
        ${afinado("M76 86 C92 72 96 50 86 36 C80 30 72 34 76 42", c.piel, 9, 95)}
        ${ventosas([[12, 66], [11, 58], [13, 50], [89, 64], [90, 56], [88, 48]])}
        <!-- la cabeza: un manto con dos ojos enormes -->
        <path d="M28 86 C24 60 28 30 38 18 C44 10 56 10 62 18 C72 30 76 60 72 86 Z" fill="${piel}" ${borde()}/>
        <path d="M36 28 C38 22 42 18 47 16" fill="none" stroke="${aclarar(c.piel, 0.5)}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M34 74 C40 70 60 70 66 74 M36 64 C42 61 58 61 64 64" fill="none" stroke="${oscurecer(c.piel, 0.45)}" stroke-width="1.2"/>
        <ellipse cx="41" cy="50" rx="7" ry="6" fill="${c.ventosa}" ${borde(1)}/>${ojoDeFiera(41, 50, 4.6, c.ojo)}
        <ellipse cx="60" cy="50" rx="7" ry="6" fill="${c.ventosa}" ${borde(1)}/>${ojoDeFiera(60, 50, 4.6, c.ojo)}
        <path d="M32 42 L47 46 M68 42 L54 46" stroke="${LINEA}" stroke-width="2" stroke-linecap="round"/>
        <!-- el pico, entre los tentáculos de la boca -->
        <path d="M42 62 C46 58 54 58 58 62 L54 70 L50 76 L46 70 Z" fill="#1a0814" ${borde()}/>
        <path d="M43 62 l2.6 4 l2 -3.4 l2 4 l2 -4 l2 3.4 l2.4 -4" fill="none" stroke="${MARFIL}" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M46 70 L50 76 L54 70 L50 72 Z" fill="${MARFIL}" ${borde(0.6)}/>
        ${tubo("M40 64 C36 70 38 76 34 80", c.piel, 2.6)}${tubo("M60 64 C64 70 62 76 66 80", c.piel, 2.6)}
        <!-- tentáculos de adelante: uno se estira hacia ti -->
        ${afinado("M62 82 C76 80 86 72 97 60", c.piel, 8, 50)}
        ${afinado("M40 84 C30 90 20 88 8 82", c.piel, 7, 40)}
        ${ventosas([[72, 80], [80, 75], [87, 70], [30, 89], [22, 88]])}
        <!-- el agua -->
        <path d="M2 88 C14 84 26 90 38 87 C50 84 62 90 74 87 C84 85 92 89 98 87 L98 96 L2 96 Z" fill="${c.agua}" ${borde(1)}/>
        <path d="M8 90 q8 -2.4 16 0 M44 90 q8 -2.4 16 0 M76 91 q7 -2 14 0" fill="none" stroke="${aclarar(c.agua, 0.45)}" stroke-width="1.1" stroke-linecap="round"/>`);
}

// --- Bosque de raíces ---

// Hongo carroñero: un sombrero enorme con manchas que brillan, y una cara en el tallo.
function hongo(c) {
    const L = lienzo();
    const sombrero = L.bola("sombrero", c.sombrero, 0.45, 0.6);
    const tallo = L.mate("tallo", c.tallo, 0.3, 0.55);
    const mancha = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c.brillo}" stroke="${LINEA}" stroke-width=".6"/>`;
    return L.armar(`
        <!-- raíces -->
        ${tubo("M36 90 L24 94", c.tallo, 2.6)}${tubo("M64 90 L78 94", c.tallo, 2.6)}${tubo("M44 92 L40 96", c.tallo, 2)}
        <!-- brazos largos, como raíces, con garras -->
        ${afinado("M38 60 C30 66 24 72 18 84", c.tallo, 5, 34)}
        ${afinado("M62 60 C72 62 80 60 90 66", c.tallo, 5, 34)}
        <!-- el tallo, con la cara en la sombra -->
        <path d="M36 46 C34 62 32 78 30 92 L70 92 C68 78 66 62 64 46 Z" fill="${tallo}" ${borde()}/>
        <path d="M37 50 C42 54 58 54 63 50 L63 60 C58 62 42 62 37 60 Z" fill="${oscurecer(c.tallo, 0.6)}"/>
        <path d="M40 57 L48 60 L47 63 L40 61 Z M60 57 L52 60 L53 63 L60 61 Z" fill="#0a0604"/>
        <path d="M42 58.6 L46.6 60.4 M58 58.6 L53.4 60.4" stroke="${c.ojo}" stroke-width="1.4" stroke-linecap="round"/>
        <!-- la boca: un tajo con colmillos -->
        <path d="M39 68 C44 66 56 66 61 68 C60 76 56 80 50 80 C44 80 40 76 39 68 Z" fill="#1a0a10" ${borde()}/>
        ${dientes(40, 60, 68, 7, 4.4)}
        <path d="M43 79 l2 -4 l2 4 M53 79 l2 -4 l2 4" fill="${MARFIL}" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>
        <path d="M40 84 q2 4 0 8 M60 84 q-2 3 0 6" fill="none" stroke="${oscurecer(c.tallo, 0.35)}" stroke-width="1"/>
        <!-- el sombrero (roto en el borde) y sus láminas -->
        <path d="M14 46 C24 52 76 52 86 46 L82 50 C70 56 30 56 18 50 Z" fill="${oscurecer(c.sombrero, 0.5)}" ${borde(1)}/>
        <path d="M8 44 C8 22 28 6 50 6 C72 6 92 22 92 44 L88 50 L84 45 L78 51 L72 47 L64 52 L56 48 L50 52 L44 48 L36 52 L28 47 L22 51 L16 45 L12 49 Z" fill="${sombrero}" ${borde()}/>
        <path d="M18 30 C22 20 32 13 42 10" fill="none" stroke="${aclarar(c.sombrero, 0.5)}" stroke-width="2.2" stroke-linecap="round"/>
        ${mancha(30, 24, 5, 3.6)}${mancha(52, 16, 4, 3)}${mancha(70, 26, 6, 4)}${mancha(42, 36, 3.6, 2.6)}${mancha(80, 38, 3, 2.2)}${mancha(20, 38, 2.6, 2)}
        <!-- esporas -->
        <circle cx="12" cy="58" r="1.4" fill="${c.brillo}"/><circle cx="88" cy="56" r="1.6" fill="${c.brillo}"/>
        <circle cx="18" cy="70" r="1" fill="${c.brillo}"/><circle cx="90" cy="74" r="1.2" fill="${c.brillo}"/>`);
}

// Escorpión de raíz: de lado, con la cola en alto y las pinzas hacia ti.
function escorpion(c) {
    const L = lienzo();
    const coraza = L.bola("coraza", c.coraza, 0.5, 0.62);
    const pata = (d) => tubo(d, oscurecer(c.coraza, 0.25), 2.6);
    // La cola: bolitas cada vez más chicas a lo largo de una curva.
    const cola = [[26, 72, 7], [17, 63, 6.6], [14, 51, 6.2], [18, 39, 5.8], [27, 30, 5.4], [39, 25, 5]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${coraza}" ${borde(1)}/>`).join("");
    return L.armar(`
        <!-- patas de atrás -->
        ${pata("M34 78 L26 84 L22 94")}${pata("M44 79 L40 86 L38 94")}${pata("M54 79 L54 86 L56 94")}
        <!-- la cola y el aguijón -->
        ${cola}
        <path d="M43 22 C52 18 60 22 60 30 C60 34 57 37 55 38 L52 30 C50 27 47 27 44 28 Z" fill="${coraza}" ${borde()}/>
        <path d="M55 37 C58 40 62 40 64 37 L58 33 Z" fill="${c.aguijon}" ${borde(0.9)}/>
        <circle cx="63" cy="38.6" r="1.3" fill="${c.aguijon}"/>
        <!-- el cuerpo, en placas -->
        <ellipse cx="38" cy="75" rx="13" ry="8" fill="${coraza}" ${borde()}/>
        <ellipse cx="52" cy="74" rx="11" ry="8.6" fill="${coraza}" ${borde()}/>
        <path d="M32 70 l0 10 M44 69 l0 12 M56 68 l0 12" stroke="${oscurecer(c.coraza, 0.5)}" stroke-width="1"/>
        <!-- patas de adelante -->
        ${pata("M60 80 L64 86 L70 94")}${pata("M64 78 L72 84 L80 92")}
        <!-- la cabeza y las pinzas -->
        <ellipse cx="67" cy="71" rx="9" ry="7.6" fill="${coraza}" ${borde()}/>
        ${ojoDeLuz(69, 67, 1.6, c.ojo)}${ojoDeLuz(73.6, 68, 1.4, c.ojo)}
        ${tubo("M70 74 L80 78", c.coraza, 4)}${tubo("M68 66 L78 58", c.coraza, 4)}
        ${pinza(L, "pinza1", 85, 80, c.coraza, 0.8)}
        ${pinza(L, "pinza2", 83, 57, c.coraza, 0.9)}
        <path d="M22 48 C18 44 20 38 24 36" fill="none" stroke="${aclarar(c.coraza, 0.55)}" stroke-width="1.6" stroke-linecap="round"/>`);
}

// Gusano devorador: sale de la tierra y abre una boca de pétalos llena de dientes.
function gusano(c) {
    const L = lienzo();
    const cuerpo = "M40 92 C36 70 40 50 54 40 C62 34 70 32 76 33";
    const trazo = (color, grosor, extra = 'stroke-linecap="round"') => `<path d="${cuerpo}" fill="none" stroke="${color}" stroke-width="${grosor}" ${extra}/>`;
    const petalo = L.mate("petalo", c.piel, 0.35, 0.6);
    return L.armar(`
        <!-- el cuerpo: borde, color, anillos y luz -->
        ${trazo(LINEA, 27)}${trazo(c.piel, 24)}
        ${trazo(c.anillo, 24, 'stroke-dasharray="2 5"')}
        ${trazo(aclarar(c.piel, 0.45), 3, 'stroke-linecap="round" transform="translate(-6 -3)"')}
        <!-- los pétalos de la boca, abiertos -->
        <path d="M74 25 C78 14 88 8 97 9 C94 16 92 22 86 28 Z" fill="${petalo}" ${borde()}/>
        <path d="M74 42 C78 52 88 58 97 56 C94 50 92 44 86 38 Z" fill="${petalo}" ${borde()}/>
        <path d="M70 26 C66 16 70 8 76 4 C78 12 80 18 78 26 Z" fill="${petalo}" ${borde()}/>
        <!-- la garganta -->
        <ellipse cx="82" cy="33" rx="9" ry="11" fill="${c.boca}" ${borde()}/>
        ${aroDeDientes(82, 33, 9, 11, 12, 0.38)}
        ${aroDeDientes(82, 33, 4.6, 5.6, 8, 0.45)}
        <circle cx="82" cy="33" r="1.8" fill="#07030a"/>
        <!-- la tierra removida -->
        <path d="M14 94 C16 84 28 80 40 80 C52 80 62 84 66 94 Z" fill="${c.tierra}" ${borde()}/>
        <path d="M20 88 l4 -2 l3 2 M48 84 l5 -1 l2 3 M56 90 l4 -1" fill="none" stroke="${aclarar(c.tierra, 0.35)}" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="10" cy="92" r="2.6" fill="${c.tierra}" ${borde(0.8)}/><circle cx="72" cy="92" r="2.2" fill="${c.tierra}" ${borde(0.8)}/>`);
}

// Raíz estranguladora: un nudo de raíces con ojos, y látigos con espinas.
function raiz(c) {
    const L = lienzo();
    const corteza = L.mate("corteza", c.corteza, 0.35, 0.6);
    const espinas = (puntos) => puntos.map(([x, y, a]) => `<path d="M${x} ${y} l${(Math.cos(a) * 4).toFixed(1)} ${(Math.sin(a) * 4).toFixed(1)} l${(Math.cos(a + 2) * 2).toFixed(1)} ${(Math.sin(a + 2) * 2).toFixed(1)} Z" fill="${c.espina}" stroke="${LINEA}" stroke-width=".5"/>`).join("");
    return L.armar(`
        <!-- raíces que se clavan en el suelo -->
        ${afinado("M40 76 C30 82 22 86 10 94", c.corteza, 7, 40)}
        ${afinado("M48 80 C46 86 44 90 40 96", c.corteza, 6, 22)}
        ${afinado("M58 78 C66 84 76 88 88 94", c.corteza, 7, 40)}
        <!-- látigos: uno arriba y otro hacia ti -->
        ${afinado("M40 40 C30 28 16 30 12 18 C10 12 16 8 20 12", c.corteza, 6, 70)}
        ${afinado("M62 52 C74 50 82 40 92 42 C97 43 98 50 93 51", c.corteza, 6, 60)}
        ${espinas([[22, 29, -2.2], [14, 22, -2.6], [78, 46, -1.4], [88, 41, -1.2], [30, 33, -2]])}
        <!-- el cuerpo: raíces retorcidas como un tronco, más ancho abajo -->
        <path d="M30 86 C34 74 36 62 34 50 C32 40 34 28 40 20 C44 14 52 12 58 16 C64 20 66 30 64 40 C62 52 64 66 70 86 C60 90 40 90 30 86 Z" fill="${corteza}" ${borde()}/>
        <path d="M38 84 C42 70 38 56 42 44 C44 36 42 28 46 20 M52 86 C50 72 54 58 50 44 C48 34 54 26 54 16 M62 82 C58 70 60 56 58 46" fill="none" stroke="${oscurecer(c.corteza, 0.5)}" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M37 46 C36 36 38 28 42 22" fill="none" stroke="${aclarar(c.corteza, 0.4)}" stroke-width="1.6" stroke-linecap="round"/>
        <!-- musgo -->
        <path d="M30 76 C32 70 38 70 40 74 C38 78 32 80 30 76 Z M56 18 C60 16 64 20 62 24 C58 24 56 22 56 18 Z" fill="${c.musgo}" ${borde(0.6)}/>
        <!-- la cara: dos ojos como brasas y una grieta llena de espinas por boca -->
        <path d="M39 34 L48 37 L47 41 L39 38 Z M53 37 L62 34 L62 38 L54 41 Z" fill="#0a0604"/>
        <path d="M41 36 L46 37.6 L45.6 39.4 L41 38 Z M55 37.6 L60 36 L60 38 L55.4 39.4 Z" fill="${c.ojo}"/>
        <path d="M40 50 L44 46 L48 52 L52 46 L56 52 L60 48 L58 58 L50 62 L42 58 Z" fill="#0a0604" ${borde(0.7)}/>
        <path d="M43 50 l2 4 l1 -4 M49 52 l1.4 4 l1.2 -4 M55 51 l1.4 4 l1 -4" fill="${c.espina}" stroke="${LINEA}" stroke-width=".4"/>`);
}

// Árbol hueco: un árbol muerto enorme con cara, brazos de ramas y un hueco por boca.
function arbol(c) {
    const L = lienzo();
    const corteza = L.mate("corteza", c.corteza, 0.35, 0.6);
    const rama = (d, g) => tubo(d, c.corteza, g);
    return L.armar(`
        <!-- raíces -->
        ${afinado("M36 88 C26 90 16 92 4 95", c.corteza, 7, 36)}
        ${afinado("M64 88 C74 90 86 92 97 95", c.corteza, 7, 36)}
        <!-- ramas de arriba -->
        ${rama("M44 26 L38 12 L32 4", 4)}${rama("M38 12 L44 4", 2.4)}
        ${rama("M56 26 L62 10 L60 2", 4)}${rama("M62 10 L70 6", 2.4)}
        <!-- brazo izquierdo -->
        ${rama("M36 40 L22 30 L10 16", 6)}${rama("M22 30 L10 32", 3)}${rama("M10 16 L4 12 M10 16 L10 8 M10 16 L16 10", 2)}
        <!-- el tronco -->
        <path d="M30 92 C33 74 35 58 34 42 C33 30 39 22 50 22 C61 22 67 30 66 42 C65 58 67 74 70 92 Z" fill="${corteza}" ${borde()}/>
        <path d="M38 30 C38 46 40 66 38 88 M62 34 C61 50 60 70 63 88 M50 76 L50 90" fill="none" stroke="${oscurecer(c.corteza, 0.5)}" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M37 34 C37 28 41 24 46 23" fill="none" stroke="${aclarar(c.corteza, 0.4)}" stroke-width="1.8" stroke-linecap="round"/>
        <!-- el hueco: la boca, con astillas -->
        <path d="M40 56 C42 50 58 50 60 56 C62 64 58 74 50 76 C42 74 38 64 40 56 Z" fill="${c.hueco}" ${borde()}/>
        <path d="M42 56 l3 5 l3 -6 l3 6 l3 -6 l3 5 M43 72 l3 -4 l4 5 l4 -5 l3 4" fill="none" stroke="${aclarar(c.corteza, 0.25)}" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- los ojos: dos nudos huecos con una luz adentro -->
        <ellipse cx="43" cy="40" rx="4.6" ry="4" fill="${c.hueco}" ${borde(0.9)}/><ellipse cx="57" cy="40" rx="4.6" ry="4" fill="${c.hueco}" ${borde(0.9)}/>
        ${ojoDeLuz(43, 40.4, 1.8, c.ojo)}${ojoDeLuz(57, 40.4, 1.8, c.ojo)}
        <path d="M37 34 L48 37 M63 34 L52 37" stroke="${LINEA}" stroke-width="1.6" stroke-linecap="round"/>
        <!-- hongos que brillan en la corteza -->
        <path d="M64 62 C66 58 72 58 72 62 Z M65 68 C66 65 70 65 70 68 Z M30 74 C31 70 36 70 37 74 Z" fill="${c.hongo}" ${borde(0.6)}/>
        <!-- brazo derecho, con garras de ramas hacia ti -->
        ${rama("M64 40 L80 32 L92 34", 6)}${rama("M92 34 L98 30 M92 34 L99 36 M92 34 L96 40", 2)}${rama("M80 32 L84 22", 2.6)}`);
}

// --- Santuario de las Sombras ---

// Acólito: una túnica con capucha, ojos que brillan en la sombra y una daga ondulada.
// Con velo y báculo es la Sacerdotisa velada.
function acolito(c) {
    const L = lienzo();
    const tunica = L.mate("tunica", c.tunica, 0.3, 0.6);
    const acero = L.metal("acero", c.acero || "#9aa0b0");
    const objeto = c.baston
        ? `${tubo("M84 20 L84 95", "#2a1a22", 2.6)}
           <path d="M77 18 C77 10 84 6 90 9 C86 10 83 14 84 20 Z" fill="${L.metal("luna", c.adorno)}" ${borde(0.9)}/>
           <circle cx="84" cy="22" r="4.6" fill="${L.bola("orbe", c.orbe, 0.6, 0.6)}" ${borde(0.9)}/><circle cx="82.6" cy="20.6" r="1.2" fill="#fff"/>`
        : `<path d="M80 50 C84 44 80 38 84 32 C86 28 84 24 86 18 C90 24 90 30 88 36 C86 42 90 46 86 52 Z" fill="${acero}" ${borde(0.9)}/>
           <path d="M76 52 L90 50" stroke="${LINEA}" stroke-width="4" stroke-linecap="round"/><path d="M76 52 L90 50" stroke="${c.adorno}" stroke-width="2.2" stroke-linecap="round"/>`;
    const velo = c.velo
        ? `<path d="M38 22 C38 14 44 9 50 9 C56 9 62 14 62 22 L64 44 C58 40 42 40 36 44 Z" fill="${c.velo}" ${borde(0.9)}/>
           <path d="M42 26 L42 40 M50 24 L50 40 M58 26 L58 40" stroke="${oscurecer(c.velo, 0.3)}" stroke-width=".8"/>
           <path d="M39 18 Q50 12 61 18" fill="none" stroke="${c.adorno}" stroke-width="2.2"/><circle cx="50" cy="14.6" r="1.8" fill="${c.orbe}" stroke="${LINEA}" stroke-width=".5"/>`
        : "";
    return L.armar(`
        <!-- la túnica, hasta el suelo -->
        <path d="M50 12 C40 12 34 20 33 30 C31 48 27 72 18 94 L82 94 C73 72 69 48 67 30 C66 20 60 12 50 12 Z" fill="${tunica}" ${borde()}/>
        <path d="M42 46 C40 62 36 80 32 92 M58 46 C60 62 64 80 68 92" fill="none" stroke="${oscurecer(c.tunica, 0.5)}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M47 44 L47 94 L53 94 L53 44 Z" fill="${c.adorno}" ${borde(0.8)}/>
        <path d="M20 90 L80 90" stroke="${c.adorno}" stroke-width="2"/>
        <!-- el cordón y el sello del pecho -->
        <path d="M36 54 Q50 58 64 54" fill="none" stroke="${c.cordon}" stroke-width="2.2"/>
        ${tubo("M44 56 L42 70", c.cordon, 1.4)}
        <circle cx="50" cy="36" r="4.6" fill="none" stroke="${c.adorno}" stroke-width="1.6"/><path d="M50 32 L54 39 L46 39 Z" fill="none" stroke="${c.adorno}" stroke-width="1.1"/>
        <!-- las mangas: una sostiene el objeto -->
        <path d="M36 30 C30 40 26 52 26 62 L36 64 C36 54 38 44 40 36 Z" fill="${tunica}" ${borde()}/>
        <circle cx="31" cy="65" r="3.4" fill="${c.mano}" ${borde(0.9)}/>
        ${objeto}
        <path d="M64 30 C72 36 78 44 82 50 L76 56 C72 50 66 44 62 40 Z" fill="${tunica}" ${borde()}/>
        <circle cx="83" cy="51" r="3.4" fill="${c.mano}" ${borde(0.9)}/>
        <!-- la capucha y la cara en sombras -->
        <path d="M36 32 C33 16 42 6 50 6 C58 6 67 16 64 32 C60 28 40 28 36 32 Z" fill="${tunica}" ${borde()}/>
        <ellipse cx="51" cy="23" rx="8.6" ry="9.4" fill="#07040b" ${borde(0.9)}/>
        ${ojoDeLuz(47.6, 23, 1.7, c.ojo, 12)}${ojoDeLuz(54.4, 23, 1.7, c.ojo, -12)}
        ${velo}`);
}

// Can del umbral: un perro flaco y erizado, de lado, con los colmillos afuera.
// Gris, con grietas de brasa y fuego en el lomo, es el Sabueso de ceniza.
function can(c) {
    const L = lienzo();
    const pelo = L.mate("pelo", c.pelo, 0.4, 0.6);
    const atras = oscurecer(c.pelo, 0.35);
    const pata = (x, color) => `<path d="${capsula(x, 66, 4.6, x - 2, 80, 3.6)}" fill="${color}" ${borde()}/>
                                <path d="${capsula(x - 2, 80, 3.6, x + 1, 91, 3)}" fill="${color}" ${borde()}/>
                                <ellipse cx="${x + 3}" cy="92.4" rx="4.6" ry="2.2" fill="${color}" ${borde(0.9)}/>`;
    const grietas = c.grietas
        ? `<path d="M34 56 l4 4 l-2 4 M48 52 l3 5 l-3 4 M60 54 l-2 5 l3 3 M80 44 l3 3" fill="none" stroke="${c.grietas}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M38 58 q4 3 8 0 M48 58 q4 3 8 0" fill="none" stroke="${oscurecer(c.pelo, 0.6)}" stroke-width="1"/>`;
    const fuego = c.fuego
        ? `<path d="M28 46 C30 38 34 40 34 34 C38 40 40 36 42 30 C44 36 48 36 48 30 C52 36 56 34 56 38 C60 36 62 40 62 44 Q46 40 28 46 Z" fill="#ff8a1f"/>
           <path d="M34 45 C36 40 38 42 40 37 C42 41 45 40 46 36 C48 41 52 40 52 42 Q44 41 34 45 Z" fill="#ffe45a"/>`
        : `<path d="M26 48 l3 -6 l3 4 l3 -7 l3 5 l4 -7 l3 6 l4 -6 l3 6 l4 -5 l2 6 l4 -4 l2 5" fill="${c.pelo}" ${borde(1)}/>`;
    return L.armar(`
        <!-- patas de atrás (las del otro lado, más oscuras) -->
        ${pata(30, atras)}${pata(64, atras)}
        <!-- la cola -->
        ${afinado("M24 54 C14 50 10 40 4 34", c.pelo, 5, 32)}
        ${fuego}
        <!-- el cuerpo flaco -->
        <path d="M22 56 C22 46 34 44 48 46 C58 47 66 44 74 46 C78 56 74 66 66 68 L34 68 C24 68 22 62 22 56 Z" fill="${pelo}" ${borde()}/>
        <path d="M40 54 l0 9 M45 53 l0 10 M50 53 l0 10 M55 54 l0 9" stroke="${oscurecer(c.pelo, 0.5)}" stroke-width="1"/>
        ${grietas}
        <!-- patas de este lado -->
        ${pata(34, pelo)}${pata(68, pelo)}
        <!-- el cuello y la cabeza -->
        <path d="M64 50 C68 40 74 34 80 34 L84 46 C80 52 72 56 66 58 Z" fill="${pelo}" ${borde()}/>
        <path d="M74 40 L72 26 L80 34 Z M80 36 L82 24 L86 36 Z" fill="${c.pelo}" ${borde(1)}/>
        <path d="M76 34 C82 32 90 36 98 42 L96 46 L82 48 C78 46 76 40 76 34 Z" fill="${pelo}" ${borde()}/>
        <path d="M82 48 L96 47 L92 53 L82 52 Z" fill="${pelo}" ${borde()}/>
        <path d="M84 46.6 l1 3 l1.4 -3 l1.2 3 l1.4 -3 l1.2 3 l1.4 -3 M85 52 l1.2 -3 l1.4 3 l1.2 -3 l1.4 3" fill="#fff" stroke="${LINEA}" stroke-width=".5" stroke-linejoin="round"/>
        <circle cx="97" cy="42.6" r="1.4" fill="${LINEA}"/>
        ${ojoDeLuz(84, 39, 1.9, c.ojo, -10)}`);
}

// --- Corazón del Abismo ---

// Heraldo: una armadura alta con máscara, corona de púas y un manto roto. Cada uno lleva
// lo que representa: el del Cuerpo, una maza; el de la Mente, un libro; el de la Voz, un
// cuerno; el del Tesoro, una balanza.
function heraldo(c) {
    const L = lienzo();
    const armadura = L.metal("armadura", c.armadura);
    const oscuro = L.mate("oscuro", oscurecer(c.armadura, 0.45), 0.3, 0.5);
    const manto = L.mate("manto", c.manto, 0.25, 0.6);
    const brillo = L.bola("brillo", c.brillo, 0.6, 0.5);
    const objetos = {
        maza: `${tubo("M84 52 L88 70", "#3a3238", 2)}${tubo("M88 70 L86 78", "#6a6a72", 1.4)}
               <circle cx="86" cy="84" r="7" fill="${L.metal("bola", "#6a6070")}" ${borde()}/>
               <path d="M86 75 l-1.4 -3 l2.8 0 Z M86 93 l-1.4 3 l2.8 0 Z M77 84 l-3 -1.4 l0 2.8 Z M95 84 l3 -1.4 l0 2.8 Z M80 78 l-2.4 -2 l2 -1 Z M92 90 l2.4 2 l-2 1 Z" fill="${c.brillo}" ${borde(0.5)}/>`,
        libro: `<path d="M74 40 L86 36 L98 40 L98 54 L86 50 L74 54 Z" fill="${L.mate("tapa", "#2a2a5a", 0.3, 0.5)}" ${borde()}/>
                <path d="M76 40 L86 37.4 L86 49 L76 52 Z M86 37.4 L96 40 L96 52 L86 49 Z" fill="#e9e4f8"/>
                <path d="M78 42 l6 -1.6 M78 45 l6 -1.6 M88 41 l6 1.6 M88 44 l6 1.6" stroke="${c.brillo}" stroke-width=".9"/>
                <circle cx="86" cy="32" r="3.4" fill="${brillo}"/>`,
        cuerno: `<path d="M78 44 C84 40 90 38 96 30 C98 36 98 40 97 44 C92 48 86 50 80 50 Z" fill="${L.metal("cuerno", c.brillo)}" ${borde()}/>
                 <path d="M96 30 C99 34 99 40 97 44" fill="none" stroke="${LINEA}" stroke-width="1"/>
                 <path d="M84 44 L85 49 M89 41 L90.6 46.6" stroke="${oscurecer(c.brillo, 0.5)}" stroke-width="1"/>`,
        balanza: `${tubo("M86 34 L86 60", "#3a3238", 1.6)}${tubo("M76 38 L96 38", c.brillo, 1.6)}
                  <path d="M76 38 L72 48 L80 48 Z M96 38 L92 50 L100 50 Z" fill="none" stroke="${c.brillo}" stroke-width=".9"/>
                  <path d="M71 48 Q76 53 81 48 Z" fill="${L.metal("plato1", c.brillo)}" ${borde(0.8)}/>
                  <path d="M91 50 Q96 55 101 50 Z" fill="${L.metal("plato2", c.brillo)}" ${borde(0.8)}/>
                  <ellipse cx="96" cy="49" rx="3" ry="1.4" fill="#f2c230" stroke="${LINEA}" stroke-width=".5"/>`,
    };
    return L.armar(`
        <!-- el manto, roto abajo -->
        <path d="M30 28 C18 46 16 72 10 94 L20 88 L27 95 L36 88 L46 94 L54 88 L64 94 L72 88 L80 95 L90 90 C84 72 82 46 70 28 Z" fill="${manto}" ${borde()}/>
        <!-- la falda larga y el peto -->
        <path d="M36 58 L64 58 C68 72 70 84 72 94 L28 94 C30 84 32 72 36 58 Z" fill="${oscuro}" ${borde()}/>
        <path d="M44 62 L42 92 M56 62 L58 92 M50 60 L50 94" stroke="${LINEA}" stroke-width=".9"/>
        <path d="M34 32 L66 32 L62 60 Q50 66 38 60 Z" fill="${armadura}" ${borde()}/>
        <path d="M50 34 L50 60 M39 44 Q50 50 61 44" fill="none" stroke="${LINEA}" stroke-width="1"/>
        <circle cx="50" cy="45" r="4" fill="${brillo}" ${borde(0.9)}/>
        <!-- brazo de atrás -->
        <path d="${capsula(32, 38, 5, 26, 56, 4.4)}" fill="${armadura}" ${borde()}/>
        <path d="${capsula(26, 56, 4.4, 30, 70, 4)}" fill="${armadura}" ${borde()}/>
        <circle cx="30.6" cy="72" r="3.8" fill="${oscuro}" ${borde(0.9)}/>
        <!-- brazo de adelante, con lo que lleva -->
        <path d="${capsula(68, 38, 5, 76, 50, 4.4)}" fill="${armadura}" ${borde()}/>
        <path d="${capsula(76, 50, 4.4, 84, 50, 4)}" fill="${armadura}" ${borde()}/>
        ${objetos[c.objeto] || ""}
        <circle cx="85" cy="50" r="3.8" fill="${oscuro}" ${borde(0.9)}/>
        <!-- hombreras con púas -->
        ${espejo(`<path d="M20 36 C20 27 27 23 34 24 C39 25 42 29 42 34 C36 37 28 40 20 36 Z" fill="${armadura}" ${borde()}/>
                  <path d="M24 28 L18 18 L30 25 Z M32 25 L30 14 L38 24 Z" fill="${oscuro}" ${borde(0.9)}/>`)}
        <!-- la corona de púas que brilla y la máscara lisa -->
        <path d="M34 16 L38 4 L42 12 L46 0 L50 10 L54 0 L58 12 L62 4 L66 16 Q50 8 34 16 Z" fill="${c.brillo}" ${borde(0.9)}/>
        <path d="M40 18 C40 10 44 7 50 7 C56 7 60 10 60 18 L60 26 C60 32 56 36 50 36 C44 36 40 32 40 26 Z" fill="${armadura}" ${borde()}/>
        <path d="M42 21 L48 23 L48 25 L42 24 Z M58 21 L52 23 L52 25 L58 24 Z" fill="#05030a"/>
        <path d="M43 22.4 L47 23.6 M57 22.4 L53 23.6" stroke="${c.ojo}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M50 27 L50 33" stroke="${LINEA}" stroke-width="1"/>`);
}

// Rey Hueco: un rey enorme sin cara. Su corona flota, en el pecho tiene un hueco con estrellas
// y a su alrededor arden las llamas de las Cuatro Sombras.
function rey(c) {
    const L = lienzo();
    const manto = L.mate("manto", c.manto, 0.3, 0.62);
    const oro = L.metal("oro", c.oro);
    const forro = L.mate("forro", c.forro, 0.2, 0.4);
    const llama = (x, y, color) => `<path d="M${x} ${y - 9} C${x + 5} ${y - 3} ${x + 5} ${y + 3} ${x} ${y + 5} C${x - 5} ${y + 3} ${x - 5} ${y - 3} ${x} ${y - 9} Z" fill="${color}" ${borde(0.8)}/>
                                    <path d="M${x} ${y - 3} C${x + 2} ${y} ${x + 2} ${y + 2.4} ${x} ${y + 3.4} C${x - 2} ${y + 2.4} ${x - 2} ${y} ${x} ${y - 3} Z" fill="#fff"/>`;
    const dedos = (x, y, lado) => `<path d="M${x} ${y} l${2 * lado} 5 M${x + 2 * lado} ${y - 1} l${3 * lado} 4.4 M${x + 3 * lado} ${y - 3} l${3.6 * lado} 3" stroke="${LINEA}" stroke-width="2.6" stroke-linecap="round"/>
                                   <path d="M${x} ${y} l${2 * lado} 5 M${x + 2 * lado} ${y - 1} l${3 * lado} 4.4 M${x + 3 * lado} ${y - 3} l${3.6 * lado} 3" stroke="${HUESO}" stroke-width="1.3" stroke-linecap="round"/>`;
    let estrellas = "";
    for (const [x, y] of [[46, 54], [53, 50], [50, 60], [55, 57], [45, 62], [51, 66]]) estrellas += `<rect x="${x}" y="${y}" width="1.2" height="1.2" fill="#fff"/>`;
    return L.armar(`
        <!-- el manto real, enorme -->
        <path d="M50 20 C34 22 26 34 24 48 C22 64 16 80 8 95 L92 95 C84 80 78 64 76 48 C74 34 66 22 50 20 Z" fill="${manto}" ${borde()}/>
        <path d="M36 50 C34 66 28 82 22 93 M64 50 C66 66 72 82 78 93 M50 74 L50 95" fill="none" stroke="${oscurecer(c.manto, 0.5)}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M14 90 L86 90" stroke="${c.oro}" stroke-width="2"/>
        <!-- el hueco del pecho, con estrellas adentro -->
        <path d="M42 50 C42 44 58 44 58 50 C60 58 58 66 50 70 C42 66 40 58 42 50 Z" fill="${c.vacio}" ${borde()}/>
        ${estrellas}
        <!-- el cuello de piel -->
        <path d="M30 36 C36 30 64 30 70 36 C66 44 58 44 50 42 C42 44 34 44 30 36 Z" fill="${forro}" ${borde()}/>
        <path d="M38 37 l0 2.4 M46 39 l0 2.4 M54 39 l0 2.4 M62 37 l0 2.4" stroke="${LINEA}" stroke-width="1.6" stroke-linecap="round"/>
        <!-- los brazos: mangas anchas y manos de hueso; el cetro hacia ti -->
        <path d="M28 40 C22 50 20 60 20 70 L30 72 C30 62 32 52 34 46 Z" fill="${manto}" ${borde()}/>
        ${dedos(22, 72, -1)}
        <path d="M72 40 C78 48 82 56 84 64 L74 68 C72 60 70 52 66 46 Z" fill="${manto}" ${borde()}/>
        ${tubo("M84 14 L84 92", c.oro, 2.2)}
        <circle cx="84" cy="11" r="5.4" fill="none" stroke="${LINEA}" stroke-width="3.6"/><circle cx="84" cy="11" r="5.4" fill="none" stroke="${c.oro}" stroke-width="2"/>
        ${dedos(78, 66, 1)}
        <!-- la cabeza: una capucha con nada adentro (solo dos luces) -->
        <path d="M38 36 C34 22 40 14 50 14 C60 14 66 22 62 36 C58 32 42 32 38 36 Z" fill="${manto}" ${borde()}/>
        <ellipse cx="50" cy="26" rx="8.4" ry="9" fill="${c.vacio}" ${borde(0.9)}/>
        <circle cx="46.6" cy="25" r="1.1" fill="${c.ojo}"/><circle cx="53.4" cy="25" r="1.1" fill="${c.ojo}"/>
        <!-- la corona, flotando sobre la nada -->
        <path d="M38 8 L40 1 L44 5 L50 0.6 L56 5 L60 1 L62 8 Z" fill="${oro}" ${borde(0.9)}/>
        <path d="M38 8 L62 8 L61 11 L39 11 Z" fill="${oro}" ${borde(0.8)}/>
        <!-- las llamas de las Cuatro Sombras -->
        ${llama(12, 40, c.cuerpo)}${llama(90, 38, c.mente)}${llama(10, 66, c.voz)}${llama(94, 66, c.tesoro)}`);
}

// ===== Puentes de nubes y Corona de la Llama (v38) =====

// Arpía de los vientos: medio mujer, medio ave, con las alas abiertas y gritando.
function arpia(c) {
    const L = lienzo();
    const pluma = L.mate("pluma", c.pluma, 0.35, 0.6);
    const ala = L.mate("ala", c.ala, 0.3, 0.62);
    const piel = L.bola("piel", c.piel, 0.45, 0.55);
    const pecho = L.bola("pecho", c.pluma, 0.5, 0.6);
    const alaIzquierda = `
        <path d="M42 38 C30 26 16 14 3 9 C6 18 4 24 2 30 C8 30 10 34 8 40 C14 39 16 44 14 50 C20 48 24 52 23 58 C29 55 34 56 36 60 L44 48 Z" fill="${ala}" ${borde()}/>
        <path d="M40 40 C30 30 18 20 6 13 M38 44 C28 38 18 32 6 30 M38 48 C30 46 22 44 10 42 M40 52 C34 52 28 52 18 52" fill="none" stroke="${oscurecer(c.ala, 0.5)}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M30 24 C22 18 14 14 6 11" fill="none" stroke="${aclarar(c.ala, 0.4)}" stroke-width="1.2" stroke-linecap="round"/>`;
    const pata = `
        ${tubo("M44 70 L41 82 L42 88", c.pata, 2.6)}
        <path d="M42 88 l-5 5 M42 88 l0 6.4 M42 88 l4.4 5" stroke="${LINEA}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M42 88 l-5 5 M42 88 l0 6.4 M42 88 l4.4 5" stroke="${MARFIL}" stroke-width="1.2" stroke-linecap="round"/>`;
    return L.armar(`
        ${espejo(alaIzquierda)}
        ${espejo(pata)}
        <!-- la cola -->
        <path d="M44 72 L38 86 L46 80 L50 90 L54 80 L62 86 L56 72 Z" fill="${pluma}" ${borde()}/>
        <!-- el cuerpo de plumas -->
        <path d="M38 40 C36 54 38 66 44 74 L56 74 C62 66 64 54 62 40 C56 35 44 35 38 40 Z" fill="${pecho}" ${borde()}/>
        <path d="M42 50 q4 4 8 0 q4 4 8 0 M40 58 q5 4 10 0 q5 4 10 0 M43 66 q3.5 3.4 7 0 q3.5 3.4 7 0" fill="none" stroke="${oscurecer(c.pluma, 0.45)}" stroke-width="1.1"/>
        <!-- el pelo salvaje, detrás de la cara -->
        <path d="M38 22 C30 26 28 34 26 40 C32 36 34 38 36 42 C38 36 40 34 42 32 Z M62 22 C70 26 72 34 74 40 C68 36 66 38 64 42 C62 36 60 34 58 32 Z" fill="${c.pelo}" ${borde(1)}/>
        <path d="M37 24 C37 12 43 8 50 8 C57 8 63 12 63 24 C60 18 40 18 37 24 Z" fill="${c.pelo}" ${borde(1)}/>
        <!-- la cara, con el ceño fruncido y la boca abierta: el grito -->
        <path d="M41 24 C41 17 45 14 50 14 C55 14 59 17 59 24 C59 31 55 36 50 37 C45 36 41 31 41 24 Z" fill="${piel}" ${borde()}/>
        <path d="M42 21 L48 23.6 M58 21 L52 23.6" stroke="${LINEA}" stroke-width="1.4" stroke-linecap="round"/>
        ${ojoDeLuz(45.6, 25, 2, c.ojo, 18)}${ojoDeLuz(54.4, 25, 2, c.ojo, -18)}
        <path d="M45 30 Q50 28.6 55 30 Q54 35.6 50 36.4 Q46 35.6 45 30 Z" fill="#1a0a12" ${borde(0.8)}/>
        <path d="M46.4 30.4 l1 2.4 l1 -2.2 Z M51.6 30.2 l1 2.2 l1 -2.4 Z" fill="#fff"/>
        <!-- mechones al viento -->
        <path d="M40 16 C34 10 28 10 22 12 M60 16 C66 10 72 10 78 12" fill="none" stroke="${c.pelo}" stroke-width="2.4" stroke-linecap="round"/>`);
}

// El Apagador: alto, encapuchado y hecho de humo, con la vara de apagar velas. En el pecho
// le queda una brasa: lo último de la Llama que apagó.
function apagador(c) {
    const L = lienzo();
    const capa = L.mate("capa", c.capa, 0.28, 0.6);
    const humo = L.mate("humo", c.humo, 0.4, 0.5);
    const campana = L.metal("campana", c.campana);
    const dedos = "M18 60 l-5 2 M19 62 l-4 5 M21.6 63.4 l-2 5.6 M24.6 64 l0 5";
    return L.armar(`
        <!-- humo que sube por detrás -->
        <path d="M22 70 C14 60 20 50 14 40 C22 44 26 38 24 30 C32 38 30 48 34 54 Z" fill="${humo}"/>
        <path d="M70 66 C78 56 72 46 80 36 C72 40 70 34 74 26 C64 34 66 46 62 52 Z" fill="${humo}"/>
        <!-- la capa larga, que abajo se deshace en humo -->
        <path d="M50 14 C36 16 30 28 29 42 C28 58 24 76 16 94 C24 90 28 95 34 90 C38 95 44 92 50 96 C56 92 62 95 66 90 C72 95 76 90 84 94 C76 76 72 58 71 42 C70 28 64 16 50 14 Z" fill="${capa}" ${borde()}/>
        <path d="M40 40 C38 58 34 76 28 90 M60 40 C62 58 66 76 72 90 M50 44 L50 92" fill="none" stroke="${oscurecer(c.capa, 0.5)}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M42 18 C36 24 33 32 32 42" fill="none" stroke="${aclarar(c.capa, 0.4)}" stroke-width="1.5" stroke-linecap="round"/>
        <!-- la mano abierta: la que apagó la Llama -->
        <path d="M34 36 C26 44 20 52 18 60 L26 64 C28 56 32 50 38 46 Z" fill="${capa}" ${borde()}/>
        <path d="${dedos}" stroke="${LINEA}" stroke-width="2.8" stroke-linecap="round"/>
        <path d="${dedos}" stroke="${c.mano}" stroke-width="1.3" stroke-linecap="round"/>
        <!-- el apagador de velas: una vara larga con una campana de hierro, que todavía humea -->
        ${tubo("M80 22 L74 94", c.metal, 2.4)}
        <path d="M70 22 C70 12 75 8 80 8 C85 8 90 12 90 22 L92 26 L68 26 Z" fill="${campana}" ${borde()}/>
        <path d="M72 14 C74 11 77 10 80 10" fill="none" stroke="#fff" stroke-width="1"/>
        <path d="M80 26 C78 30 82 32 80 36 C78 38 81 40 80 42" fill="none" stroke="${c.humo}" stroke-width="2" stroke-linecap="round"/>
        <!-- el otro brazo sostiene la vara -->
        <path d="M64 36 C70 42 74 48 76 54 L70 58 C68 52 64 48 60 46 Z" fill="${capa}" ${borde()}/>
        <circle cx="75" cy="56" r="3.6" fill="${c.mano}" ${borde(0.9)}/>
        <!-- la capucha: adentro, oscuridad y dos luces frías -->
        <path d="M36 36 C30 20 38 6 50 6 C62 6 70 20 64 36 C60 30 40 30 36 36 Z" fill="${capa}" ${borde()}/>
        <ellipse cx="50" cy="24" rx="9" ry="10" fill="#05030a" ${borde(0.9)}/>
        ${ojoDeLuz(46.4, 23, 1.6, c.ojo)}${ojoDeLuz(53.6, 23, 1.6, c.ojo)}
        <!-- la brasa del pecho -->
        <circle cx="50" cy="52" r="5" fill="${aclarar(c.brasa, 0.2)}" ${borde(0.8)}/>
        <circle cx="50" cy="52" r="2.2" fill="#fff3c0"/>`);
}

// ===== La tabla: qué figura y qué colores usa cada criatura =====

const FIGURAS = {
    murcielago: [murcielago, { pelo: "#4a3a52", ala: "#6b3f6e", hueso: "#2a1a35", oreja: "#b0607a", ojo: "#ff4a3a" }],
    esqueleto: [esqueleto, { hueso: HUESO, acero: "#8f8a80", escudo: "#6a4a30", guarda: "#a8782c", trapo: "#6a1f2a", ojo: "#ff5a3c" }],
    cieno: [cieno, { masa: "#2c8a72", restos: "#bfe6cf", ojo: "#ffe45a", boca: "#0c2a26" }],
    arana: [arana, { cuerpo: "#3a2c4c", pata: "#2c2238", marca: "#d63a4a", ojo: "#ff4a3a" }],
    caballero: [caballero, { armadura: "#56607a", adorno: "#b08a3a", capa: "#5c1622", hoja: "#aab4c8", cuerno: "#2c2a3a", ojo: "#7fe6ff" }],

    ojo: [ojo, { carne: "#6a2f7a", iris: "#f0a020" }],
    grimorio: [grimorio, { cuero: "#5a1f2a", hojas: "#e9dfc0", adorno: "#c79a3a", boca: "#2a0810", lengua: "#c2283a", ojo: "#ffd23c" }],
    espectro: [espectro, { tunica: "#33406a", ojo: "#7ff3ff" }],
    gargola: [gargola, { piel: "#7b8291", ala: "#5d6373", cuerno: "#4a4f5c", ojo: "#ff6a3c" }],
    liche: [espectro, { tunica: "#472060", ojo: "#a4ff6a", calavera: true, corona: "#d8a838", orbe: "#7dff7a" }],

    ascua: [ascua, { llama: "#e2400f", medio: "#ff9a1f", centro: "#ffe45a", hueso: "#d9c6a0" }],
    "cieno-magma": [cieno, { masa: "#c2410c", restos: "#ffd27a", ojo: "#fff3a0", boca: "#3a0a05" }],
    golem: [golem, { hierro: "#5c6470", oxido: "#8a4a2a", fuego: "#ff9a1f" }],
    mimico: [mimico, { madera: "#7a4a26", herraje: "#8e96a8", boca: "#2a0810", lengua: "#c23a62", ojo: "#ffe45a", oro: "#f2c230" }],
    demonio: [gargola, { piel: "#9a2418", ala: "#4a0f14", cuerno: "#1f1418", ojo: "#ffe36a", grietas: "#ffb040", fuego: true }],

    cristal: [cristal, { claro: "#c8f0ff", medio: "#58b4f0", oscuro: "#1f5cb0", ojo: "#ffffff" }],
    "ala-trueno": [murcielago, { pelo: "#2f4a86", ala: "#3f78c8", hueso: "#16224a", oreja: "#ffe45a", ojo: "#fff27a" }],
    sierpe: [sierpe, { escama: "#1d7a8c", vientre: "#e1d7a8", marca: "#ffd23c", ojo: "#ffd23c" }],
    centinela: [caballero, { armadura: "#cfd7e8", adorno: "#e6bc48", capa: "#27408b", hoja: "#f2f6ff", cuerno: "#e6bc48", ojo: "#ffe680" }],
    dragon: [dragon, { escama: "#2f5390", ala: "#5a7ad0", vientre: "#ddd5b6", cresta: "#8fb0ff", ojo: "#ffe45a", aliento: "#fff7a0" }],
    // Puentes de nubes (v38)
    arpia: [arpia, { pluma: "#6a5a8a", ala: "#4a3a6a", piel: "#d8c8b4", pelo: "#2a1a30", pata: "#c8a040", ojo: "#ffe45a" }],
    nubarron: [cieno, { masa: "#c4ccdc", restos: "#8a98b4", ojo: "#5ac8ff", boca: "#26304c" }],
    esfinge: [gargola, { piel: "#b08a4a", ala: "#8a6a3a", cuerno: "#5a4020", ojo: "#7affd8" }],
    "espiritu-viento": [espectro, { tunica: "#7ab4c8", ojo: "#ffffff" }],
    "coloso-nubes": [golem, { hierro: "#c8c4bc", oxido: "#9ab0d0", fuego: "#7ad8ff" }],
    // Corona de la Llama (v38)
    "vigia-caido": [caballero, { armadura: "#3a3448", adorno: "#c8a040", capa: "#1a1424", hoja: "#d8d0b0", cuerno: "#c8a040", ojo: "#ff5a3a" }],
    "llama-negra": [ascua, { llama: "#3a1a5a", medio: "#6a3a9a", centro: "#c8a8ff", hueso: "#8a80a0" }],
    espejo: [cristal, { claro: "#fff4c8", medio: "#e6c060", oscuro: "#8a6a20", ojo: "#ffffff" }],
    "ojo-corona": [ojo, { carne: "#b08a2a", iris: "#ff4a3a" }],
    apagador: [apagador, { capa: "#1c1828", humo: "#5a5468", metal: "#7a7488", campana: "#3a3644", mano: "#b8b0c8", ojo: "#e8f0ff", brasa: "#ff8a3a" }],

    // --- Mazmorra del Abismo (v29). El Reflejo sombrío no está: su dibujo es tu héroe (ver sprites.js). ---
    sanguijuela: [sanguijuela, { piel: "#4a3a2c", raya: "#c8803a", boca: "#3a0b12", agua: "#1c3640" }],
    ahogado: [ahogado, { piel: "#9ab8b0", ropa: "#3a4a5a", alga: "#3a7a4a", pelo: "#1a2420", ojo: "#d8fff4", gota: "#7ad0e8" }],
    aguaviva: [aguaviva, { campana: "#c8b4ec", brazo: "#a88ad8", tentaculo: "#e8dcff", nucleo: "#ff7ac8" }],
    cangrejo: [cangrejo, { caparazon: "#8a3a26", placa: "#8e96a8", pata: "#6a2a1c", ojo: "#ffd23c" }],
    kraken: [kraken, { piel: "#5c2a64", ventosa: "#e8c4d8", ojo: "#ffd23c", agua: "#123040" }],

    hongo: [hongo, { sombrero: "#6a2848", tallo: "#d8cdb0", brillo: "#a8ff6a", ojo: "#c8ff6a" }],
    escorpion: [escorpion, { coraza: "#2e2a40", aguijon: "#c8ff3a", ojo: "#ff4a3a" }],
    gusano: [gusano, { piel: "#b88c70", anillo: "#8a6050", boca: "#5a0f1c", tierra: "#3e2c1e" }],
    raiz: [raiz, { corteza: "#5a4030", musgo: "#4a6a3a", ojo: "#ffb03a", espina: "#d8c8a0" }],
    arbol: [arbol, { corteza: "#4a3a30", hueco: "#0a0610", ojo: "#8aff6a", hongo: "#c8ff6a" }],

    acolito: [acolito, { tunica: "#2a2038", adorno: "#a8283a", cordon: "#8a6a3a", mano: "#c8b8a8", ojo: "#ff5a3a" }],
    can: [can, { pelo: "#2c2438", ojo: "#ff4a3a" }],
    sacerdotisa: [acolito, { tunica: "#3a1840", adorno: "#d8a838", cordon: "#d8a838", mano: "#d8c8c0", ojo: "#c8a8ff", velo: "#6a4a7a", baston: true, orbe: "#b05aff" }],
    sabueso: [can, { pelo: "#5a5450", ojo: "#ffb030", grietas: "#ff7a1a", fuego: true }],

    "heraldo-cuerpo": [heraldo, { armadura: "#6a4040", manto: "#5a1018", brillo: "#ff5a3a", ojo: "#ffb0a0", objeto: "maza" }],
    "heraldo-mente": [heraldo, { armadura: "#46587a", manto: "#142a5a", brillo: "#6ab4ff", ojo: "#c8e8ff", objeto: "libro" }],
    "heraldo-voz": [heraldo, { armadura: "#7a6a40", manto: "#4a3a10", brillo: "#ffd23c", ojo: "#fff3b0", objeto: "cuerno" }],
    "heraldo-tesoro": [heraldo, { armadura: "#406a50", manto: "#0f3a24", brillo: "#5aff9a", ojo: "#c8ffd8", objeto: "balanza" }],
    "rey-hueco": [rey, { manto: "#3a0f2e", forro: "#e8dcc0", oro: "#d8a838", vacio: "#05030a", ojo: "#dfe6ff",
                         cuerpo: "#ff5a3a", mente: "#5aa8ff", voz: "#ffd23c", tesoro: "#5aff9a" }],
};

// (v64) Las criaturas de las mazmorras nuevas (ver mazmorras.js): los mismos dibujos de siempre, con otros colores.
Object.assign(FIGURAS, {
    // --- Minas de la Codicia: galerías, veta y tesorería ---
    "mi-murcielago": [murcielago, { pelo: "#5a4630", ala: "#7a5a30", hueso: "#2a1c10", oreja: "#c89a5a", ojo: "#ffd23c" }],
    "mi-minero": [esqueleto, { hueso: "#cdbf9a", acero: "#7a6a58", escudo: "#5a4020", guarda: "#c8902c", trapo: "#6a4a1a", ojo: "#ffb03a" }],
    "mi-cieno": [cieno, { masa: "#c8b43a", restos: "#e8dca0", ojo: "#3a2a00", boca: "#3a3208" }],
    "mi-arana": [arana, { cuerpo: "#8a4a28", pata: "#6a3418", marca: "#ffd23c", ojo: "#ffe45a" }],
    "mi-capataz": [caballero, { armadura: "#8a7a5a", adorno: "#d8a838", capa: "#5a3a12", hoja: "#c8c0a8", cuerno: "#3a2a14", ojo: "#ffb03a" }],
    "mi-cristal": [cristal, { claro: "#fff2b8", medio: "#f0c030", oscuro: "#a87810", ojo: "#ffffff" }],
    "mi-golem": [golem, { hierro: "#c8a838", oxido: "#8a6a1a", fuego: "#fff0a0" }],
    "mi-ascua": [ascua, { llama: "#ff8a1f", medio: "#ffd23c", centro: "#fff8c0", hueso: "#c8a860" }],
    "mi-mimico": [mimico, { madera: "#6a4a1e", herraje: "#d8b040", boca: "#2a0810", lengua: "#c23a62", ojo: "#ffe45a", oro: "#ffd23c" }],
    "mi-dragon": [dragon, { escama: "#c89a20", ala: "#e8c050", vientre: "#f2e4b0", cresta: "#fff0a0", ojo: "#ff5a2a", aliento: "#ff9a2a" }],
    "mi-recaudador": [espectro, { tunica: "#8a7a3a", ojo: "#fff0a0" }],
    "mi-gargola": [gargola, { piel: "#b8bcc8", ala: "#8a90a0", cuerno: "#5a6070", ojo: "#ffe45a" }],
    "mi-libro": [grimorio, { cuero: "#3a2a14", hojas: "#f0e4c0", adorno: "#e0b030", boca: "#2a0810", lengua: "#c2283a", ojo: "#ffe45a" }],
    "mi-centinela": [caballero, { armadura: "#e0c050", adorno: "#fff0a0", capa: "#6a4a10", hoja: "#fff4c0", cuerno: "#e8c860", ojo: "#ff6a2a" }],
    "mi-rey": [rey, { manto: "#5a3a08", forro: "#f0e6c0", oro: "#ffd23c", vacio: "#05030a", ojo: "#fff4c0",
                      cuerpo: "#ff5a3a", mente: "#5aa8ff", voz: "#ffd23c", tesoro: "#5aff9a" }],
    // --- Laberinto de los Ecos: pasillos, ecos y silencio ---
    "la-espejo": [cristal, { claro: "#f4f8ff", medio: "#aab8d8", oscuro: "#5a6a90", ojo: "#7affff" }],
    "la-sombra": [espectro, { tunica: "#4a2a6a", ojo: "#d8a8ff" }],
    "la-murcielago": [murcielago, { pelo: "#4a5a7a", ala: "#7a98c8", hueso: "#1a2a4a", oreja: "#c8e0ff", ojo: "#8affff" }],
    "la-arana": [arana, { cuerpo: "#aab8d8", pata: "#7a8ab0", marca: "#ffffff", ojo: "#7affff" }],
    "la-gemelo": [caballero, { armadura: "#d8e0f0", adorno: "#a0b0d0", capa: "#3a4a70", hoja: "#ffffff", cuerno: "#a0b0d0", ojo: "#7affff" }],
    "la-ojo": [ojo, { carne: "#3a5a8a", iris: "#7affff" }],
    "la-hongo": [hongo, { sombrero: "#3a4a8a", tallo: "#d0d8e8", brillo: "#8affff", ojo: "#c8ffff" }],
    "la-aguaviva": [aguaviva, { campana: "#a8e8f8", brazo: "#78c8e8", tentaculo: "#d8f8ff", nucleo: "#ffffff" }],
    "la-acolito": [acolito, { tunica: "#2a3a6a", adorno: "#a8c8ff", cordon: "#8aa8d8", mano: "#d0d8e8", ojo: "#8affff" }],
    "la-coro": [acolito, { tunica: "#e8e8f4", adorno: "#a8b8e0", cordon: "#c8d0e8", mano: "#f0f0ff", ojo: "#a8d8ff", velo: "#c8d0e8", baston: true, orbe: "#a8d0ff" }],
    "la-mudo": [ahogado, { piel: "#c8c8d0", ropa: "#3a3a48", alga: "#5a5a6a", pelo: "#1a1a20", ojo: "#ffffff", gota: "#b8c0d8" }],
    "la-can": [can, { pelo: "#e8e8f0", ojo: "#7affff" }],
    "la-sacerdotisa": [acolito, { tunica: "#d8d8e8", adorno: "#8a8aa8", cordon: "#a8a8c0", mano: "#e8e8f0", ojo: "#9a9aff", velo: "#aaaac8", baston: true, orbe: "#c8c8ff" }],
    "la-gusano": [gusano, { piel: "#6a6a80", anillo: "#4a4a60", boca: "#2a1a3a", tierra: "#1a1a28" }],
    "la-silencio": [heraldo, { armadura: "#d0d0e0", manto: "#14142a", brillo: "#ffffff", ojo: "#e8e8ff", objeto: "libro" }],
});

// El dibujo de una criatura (texto SVG). Si no existe, un cuadro vacío.
export function dibujarMonstruo(id) {
    const [figura, colores] = FIGURAS[id] || [];
    const nombre = CRIATURAS[id]?.nombre || "Criatura";
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${nombre}" xmlns="http://www.w3.org/2000/svg">${figura ? figura(colores) : ""}</svg>`;
}


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
});
Object.assign(SUELOS, {
    galerias: SUELOS.fragua, veta: SUELOS.fragua, tesoreria: SUELOS.corona || SUELOS.fragua,
    pasillos: SUELOS.cripta || SUELOS.abismo, ecos: SUELOS.biblioteca || SUELOS.abismo, silencio: SUELOS.abismo,
});

// Las criaturas que tienen dibujo (las pruebas revisan que sean todas las del bestiario).
export const CON_DIBUJO = Object.keys(FIGURAS);
