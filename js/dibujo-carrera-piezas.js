// dibujo-carrera-piezas.js — Las piezas del mapa de la carrera (v144): los colores de cada zona, la luz de cada hora del día y
// los dibujos pequeños (árboles, rocas, casas, torres, cofres, mojones…), todos en pixel art.
//
// Cómo se dibuja una pieza: con un «mapa de píxeles», una lista de filas de texto donde cada letra es un cuadrito de color
// (el punto «.» es transparente). Así se ve el dibujo en el mismo código. La base de la pieza (donde toca el suelo) queda en
// el punto (0, 0) y el dibujo crece hacia arriba (y negativa). El mapa (dibujo-carrera.js) define cada pieza UNA vez en
// <defs> y la pone donde haga falta con <use href="#…" x="…" y="…">: así el SVG pesa mucho menos.
// Aquí no hay azar ni pantalla: solo dibujos que siempre salen iguales.

// Un número con un decimal como mucho, en texto corto («12», «3.5», «-7.2»).
export const n1 = (v) => String(Math.round(v * 10) / 10);

// ===== Cuadritos → SVG =====
// Una lista de cuadros [x, y, ancho, alto, color]. Los cuadros SEGUIDOS del mismo color van en un solo <path> (ocupa
// mucho menos que un <rect> por cuadro). El orden se respeta: lo último queda encima.
export function cuadros(lista, dx = 0, dy = 0) {
    let svg = "";
    let color = null;
    let d = "";
    for (const [x, y, w, h, c] of lista) {
        if (c !== color) {
            if (d) svg += `<path fill="${color}" d="${d}"/>`;
            color = c;
            d = "";
        }
        d += `M${n1(x + dx)} ${n1(y + dy)}h${n1(w)}v${n1(h)}h${n1(-w)}z`;
    }
    if (d) svg += `<path fill="${color}" d="${d}"/>`;
    return svg;
}

// Un «pintor» junta MUCHOS cuadritos por color, sin importar el orden (sirve para el suelo, donde nada se tapa).
// pintor.cuadro(x, y, ancho, alto, color) y al final pintor.svg() → un <path> por color. clases: { color: "clase css" }.
export function nuevoPintor() {
    const capas = new Map();
    return {
        cuadro(x, y, w, h, c) {
            if (!capas.has(c)) capas.set(c, []);
            capas.get(c).push(`M${n1(x)} ${n1(y)}h${n1(w)}v${n1(h)}h${n1(-w)}z`);
        },
        svg(clases = {}) {
            return [...capas].map(([c, partes]) => `<path fill="${c}"${clases[c] ? ` class="${clases[c]}"` : ""} d="${partes.join("")}"/>`).join("");
        },
        vacio: () => capas.size === 0,
    };
}

// Un mapa de píxeles → cuadros. Cada fila se parte en tramos de la misma letra. colores: { letra: "#color" }.
// La fila de abajo toca el suelo (y = -1) y el centro del dibujo queda en x = 0.
function pixeles(filas, colores, desdeFila = 0, hastaFila = filas.length) {
    const ancho = Math.max(...filas.map((f) => f.length));
    const x0 = -Math.floor(ancho / 2);
    const y0 = -filas.length;
    // Los píxeles de un dibujo no se tapan entre sí: se pueden juntar todos los del mismo color en un solo <path>.
    const pintor = nuevoPintor();
    for (let f = desdeFila; f < hastaFila; f++) {
        const fila = filas[f];
        let i = 0;
        while (i < fila.length) {
            const letra = fila[i];
            let j = i;
            while (j < fila.length && fila[j] === letra) j++;
            if (letra !== "." && colores[letra]) pintor.cuadro(x0 + i, y0 + f, j - i, 1, colores[letra]);
            i = j;
        }
    }
    return pintor.svg();
}

// Dónde quedan las ventanas (letra «x») de un dibujo, para encenderlas de noche: [[x, y, ancho, alto]…].
function ventanas(filas) {
    const ancho = Math.max(...filas.map((f) => f.length));
    const lista = [];
    filas.forEach((fila, f) => {
        for (let i = 0; i < fila.length; i++) if (fila[i] === "x") lista.push([-Math.floor(ancho / 2) + i, -filas.length + f, 1, 1]);
    });
    return lista;
}

// ===== La hora del día =====
// amanecer (5–7 h), día (7–17 h), atardecer (17–19 h) y noche. hora: un número de 0 a 24 (13.5 = 13:30). Sin hora → día.
export function momentoDelDia(hora) {
    if (!Number.isFinite(hora)) return "dia";
    const h = ((hora % 24) + 24) % 24;
    if (h >= 5 && h < 7) return "amanecer";
    if (h >= 7 && h < 17) return "dia";
    if (h >= 17 && h < 19) return "atardecer";
    return "noche";
}

// La sombra de cada momento: dx = cuánto se estira hacia un lado por cada punto de alto (el sol sale por el este, a la
// derecha del mapa, así que al amanecer las sombras van a la izquierda; al atardecer, a la derecha). op = qué tan oscura.
export const MOMENTOS = {
    amanecer: { nombre: "Amanecer", sombra: { dx: -0.6, op: 0.32 } },
    dia: { nombre: "Día", sombra: { dx: 0.15, op: 0.28 } },
    atardecer: { nombre: "Atardecer", sombra: { dx: 0.6, op: 0.32 } },
    noche: { nombre: "Noche", sombra: { dx: 0, op: 0.2 } },
};

// La sombra de una pieza de `ancho` puntos y `alto` puntos (una mancha baja y alargada en el suelo).
// x, y: dónde va (si no, en la base de la pieza).
function sombra(ancho, alto, momento, x = 0, y = 0) {
    const { dx, op } = MOMENTOS[momento].sombra;
    const largo = Math.round(dx * alto);
    const x0 = -Math.round(ancho / 2) + Math.min(0, largo);
    const w = ancho + Math.abs(largo);
    const color = `rgba(0,0,0,${op})`;
    return cuadros([[x0 + 1, -1, w - 2, 3, color], [x0, 0, w, 1, color]], x, y);
}

// ===== Los colores de cada zona =====
// suelo: 4 tonos de oscuro a claro (las manchas del suelo); pasto: matas oscuras y claras; colina: sombra, medio, luz, brillo.
export const PALETAS = {
    pradera: { suelo: ["#204a2b", "#245131", "#285836", "#2e603b"], pasto: ["#183e22", "#3a7442"], colina: ["#1b4425", "#2d6338", "#3a7444", "#4a8450"] },
    bosque: { suelo: ["#163922", "#193f27", "#1d452c", "#214c31"], pasto: ["#102d1a", "#2a5c36"], colina: ["#11301d", "#1f4a2c", "#285835", "#336440"] },
    pantano: { suelo: ["#283e33", "#2c4437", "#304a3c", "#355141"], pasto: ["#1e3227", "#4a6a44"], colina: ["#22362a", "#34503c", "#3e5c46", "#4a6a52"] },
    desierto: { suelo: ["#9c7a49", "#a4814e", "#ac8954", "#b4915b"], pasto: ["#86663a", "#c4a46e"], colina: ["#86663a", "#b28f5c", "#c2a06a", "#d2b27c"] },
    nieve: { suelo: ["#a6b3c4", "#afbccd", "#b9c5d5", "#c3cedd"], pasto: ["#8e9db2", "#e4ebf3"], colina: ["#8090a8", "#c4cfdd", "#d8e1ec", "#eef3f9"] },
    volcan: { suelo: ["#261b21", "#2c2027", "#32252c", "#382a31"], pasto: ["#1c1418", "#4a3a40"], colina: ["#1a1216", "#382a30", "#44343a", "#52404a"] },
};

// El agua de cada zona: lago normal, agua turbia del pantano, hielo en las cumbres y lava en el abismo.
export const AGUAS = {
    normal: { orilla: "#1a3f6e", agua: "#2f6fb8", medio: "#3b7dc4", brillo: "#9ccaf2" },
    turbia: { orilla: "#1a2c32", agua: "#2c4a52", medio: "#36585f", brillo: "#7aa4ac" },
    hielo: { orilla: "#6a88aa", agua: "#9cc2e2", medio: "#b2d4ec", brillo: "#f2f9ff" },
    lava: { orilla: "#2a1210", agua: "#8e3016", medio: "#b8441e", brillo: "#ff9a3a" },
};
export const aguaDeZona = (zona) => ({ pantano: "turbia", nieve: "hielo", volcan: "lava" }[zona] || "normal");

// Verdes de los árboles por zona. o: lo más oscuro, d: sombra, m: medio, l: luz, b: brillo.
// En las cumbres, «l» y «b» son la nieve sobre las ramas; en el abismo, «b» es una brasa.
const VERDES = {
    pradera: { o: "#10301a", d: "#1a4425", m: "#245a30", l: "#33723c", b: "#4a8c4c" },
    bosque: { o: "#08200f", d: "#10331c", m: "#184427", l: "#225432", b: "#2e6640" },
    pantano: { o: "#16241c", d: "#203428", m: "#2c4434", l: "#3a5640", b: "#4a684c" },
    desierto: { o: "#5a4424", d: "#28563a", m: "#3a7444", l: "#56925a", b: "#c86a7a" },
    nieve: { o: "#0c241c", d: "#14382c", m: "#1c4838", l: "#dde6f0", b: "#ffffff" },
    volcan: { o: "#0e0a0c", d: "#1c1418", m: "#281d22", l: "#3a2a2e", b: "#ff7a2a" },
};
const TRONCO = { t: "#4a3322", T: "#2e2016" };
const MADERA = { l: "#7a5434", m: "#5a3a22", d: "#3e2716", c: "#a8804e", r: "#6a4a2a", o: "#1e140c", v: "#3f6a3a" };
// Piedra de cada zona. v: musgo (o una veta de lava en el abismo).
const PIEDRAS = {
    gris: { o: "#24222c", d: "#42404c", m: "#5a5866", l: "#787686", b: "#9694a4", v: "#3a5e36" },
    arenisca: { o: "#4a3420", d: "#7a5a38", m: "#936d45", l: "#ad8959", b: "#c7a575", v: "#7a5a38" },
    obsidiana: { o: "#0a070a", d: "#161114", m: "#221b20", l: "#3a3036", b: "#5a4a54", v: "#ff6a2a" },
    nevada: { o: "#283040", d: "#485062", m: "#606a7a", l: "#e2e9f2", b: "#ffffff", v: "#c4d0de" },
};
const piedraDe = (zona) => ({ desierto: "arenisca", volcan: "obsidiana", nieve: "nevada" }[zona] || "gris");

// ===== Los dibujos (mapas de píxeles) =====
// copa: cuántas filas de arriba son la copa (se mece con el viento; el tronco no). Los árboles chicos no se mecen (así hay
// menos cosas moviéndose y el teléfono trabaja menos).
const DIBUJOS = {
    hojaS: { copa: 0, filas: [
        "..mmmm..",
        ".mllmmd.",
        "mlbmmmdd",
        "mlmmdmdd",
        "mmmmmddo",
        ".dmdddo.",
        "...tT...",
        "...tT..."] },
    hojaM: { copa: 10, filas: [
        "....mmmm....",
        "..mmllmmmd..",
        ".mllbmmmmmd.",
        ".mlbllmmdmdd",
        "mllmmmmmmddd",
        "mlmmmdmmmddd",
        "mmmmmmmmdddd",
        ".mmmdmmddddo",
        "..dddmdddoo.",
        "....oddoo...",
        ".....tT.....",
        ".....tT....."] },
    hojaG: { copa: 14, filas: [
        "......mmmm......",
        "....mmllmmmd....",
        "...mllbllmmmmd..",
        "..mllbllmmmdmmd.",
        ".mllllmmmmmmmddd",
        ".mllmmmdmmmmdddd",
        "mlllmmmmmmmdmddd",
        "mllmmmmdmmmmmddd",
        "mmmmmmmmmmmddddd",
        "mmmmdmmmmmdmdddo",
        ".mmmmmmmdmmdddo.",
        ".dmmdmmmmmddddo.",
        "..ddddmddddddo..",
        "....oodddooo....",
        ".......tT.......",
        ".......tT.......",
        ".......tT......."] },
    pinoS: { copa: 0, filas: [
        "...lm...",
        "..lmmd..",
        ".lmmmdd.",
        "..lmmd..",
        ".lmmmdd.",
        "lmmmmddd",
        ".oddddo.",
        "...tT...",
        "...tT..."] },
    pinoM: { copa: 10, filas: [
        "....lm....",
        "...lmmd...",
        "..lmmmdd..",
        "...lmmdd..",
        "..lmmmmdd.",
        ".lmmmmmddd",
        "..lmmmmdd.",
        ".lmmmmmmdd",
        "lmmmmmmddd",
        ".oddddddo.",
        "....tT....",
        "....tT...."] },
    pinoG: { copa: 14, filas: [
        "......lm......",
        ".....lmmd.....",
        "....lmmmdd....",
        "...lmmmmddd...",
        ".....lmmdd....",
        "....lmmmmdd...",
        "...lmmmmmddd..",
        "..lmmmmmmdddd.",
        "....lmmmmmdd..",
        "...lmmmmmmddd.",
        "..lmmmmmmmdddd",
        ".lmmmmmmmmdddd",
        "lmmmmmmmmmdddd",
        ".oodddddddddo.",
        "......tT......",
        "......tT......"] },
    muerto: { copa: 0, filas: [
        "...t....t..",
        "t..t...t...",
        ".t.tt.t...t",
        "..t.tTt..t.",
        "...ttTTtt..",
        ".....tT....",
        ".....tT....",
        "....ttTT...",
        ".....tT....",
        "....ttTT...",
        "...tt..TT.."] },
    palmera: { copa: 4, filas: [
        "...lm.md...",
        ".llmmmmmdd.",
        "lm..mmd..dd",
        "l..m.t.d..d",
        "....tT.....",
        "....tT.....",
        ".....tT....",
        ".....tT....",
        ".....tT....",
        "......tT...",
        "......tT..."] },
    cactusS: { copa: 0, filas: [
        ".lbm.",
        "llmmd",
        "lmmdd",
        "lmmdd",
        ".ooo."] },
    cactusG: { copa: 0, filas: [
        "....lm...",
        "...llmd..",
        "...lmmd..",
        ".l.lmmd..",
        ".lmlmmd.l",
        ".lmlmmdlm",
        "..mlmmdmd",
        "...lmmdd.",
        "...lmmd..",
        "...lmmd..",
        "...lmmd..",
        "..odddo.."] },
    arbusto: { copa: 0, filas: [
        "...mmm...",
        ".mllmmmd.",
        "mlbmmmmdd",
        "mmmmdmddd",
        ".dmmddddo",
        "..ooooo.."] },
    matorral: { copa: 0, filas: [
        ".t...t..t",
        "..t.t..t.",
        "t..ttTt..",
        ".tttTTtt.",
        "...oooo.."] },
    roca: { copa: 0, filas: [
        "...llm...",
        "..lbmmmd.",
        ".lbmmmmdd",
        "lmmmmvmdd",
        "mmmdmmddd",
        ".ooooooo."] },
    tronco: { copa: 0, filas: [
        ".llllvllllcc.",
        "lmmmmmmmmmcrc",
        "mmdmmmmmdmcrc",
        "ddddddddddcc.",
        ".ooooooooooo."] },
    hongos: { copa: 0, filas: [
        ".rr....",
        "rbrr.rr",
        ".w..rbr",
        ".w...w.",
        ".w...w."] },
    juncos: { copa: 0, filas: [
        "...c...",
        ".c.c...",
        ".c.c.c.",
        ".g.g.c.",
        ".g.h.g.",
        "g.gh.g.",
        "g.g.hg.",
        ".gh.g.g",
        ".ghgh.g",
        "..ggh.."] },
    calavera: { copa: 0, filas: [
        "h.......h",
        ".h.www.h.",
        "..wkwkw..",
        "...www...",
        "....w...."] },
    cofre: { copa: 0, filas: [
        ".llllll.",
        "lmmmmmmd",
        "aaagaaaa",
        "mmmgmmmd",
        "mmmmmmmd",
        "oooooooo"] },
    ruina: { copa: 0, filas: [
        "..l..........",
        ".llm.........",
        "lbmmd........",
        ".lmd.........",
        ".lmd.........",
        ".lmd....l....",
        ".lmd...llmd..",
        ".lmd...lbmmd.",
        ".lmd....lmd..",
        ".lmd....lmd..",
        ".lmd....lmd..",
        "lmmdd.lllmdd.",
        "ooooo.ooooooo"] },
    casa: { copa: 0, filas: [
        "...........c..",
        "......rR...c..",
        ".....rrRR..c..",
        "....rrrRRR.c..",
        "...rrrrRRRRc..",
        "..rrrrrRRRRR..",
        ".rrrrrrRRRRRR.",
        "rrrrrrrRRRRRRR",
        ".wwwwwwWWWWWW.",
        ".wxxwwwWWpWWW.",
        ".wxxwwwWWpWWW.",
        ".wwwwwwWWpWWW.",
        ".wwwwwwWWpWWW.",
        ".oooooooooooo."] },
    torre: { copa: 0, filas: [
        "ll..mm..dd",
        "lllmmmmddd",
        "lmmmmmmmdd",
        ".lmmmmmdd.",
        ".lmmmmmdd.",
        ".lmmxmmdd.",
        ".lmmxmmdd.",
        ".lmmmmmdd.",
        ".lmmmmmdd.",
        ".lmmmmmdd.",
        ".lmmmmmdd.",
        ".lmmxmmdd.",
        ".lmmxmmdd.",
        ".lmmmmmdd.",
        ".lmmmmmdd.",
        ".lmmmmmdd.",
        ".lmmppmdd.",
        ".lmmppmdd.",
        "llmmppmddd",
        "oooooooooo"] },
    tienda: { copa: 0, filas: [
        ".....k......",
        ".....lm.....",
        "....llmd....",
        "...llmmdd...",
        "..llmppdd...",
        ".llmmppddd..",
        ".lmmmppdddd.",
        "llmmmppddddd",
        "oooooooooooo"] },
    choza: { copa: 0, filas: [
        ".....rR.....",
        "....rrRR....",
        "...rrrRRR...",
        "..rrrrRRRR..",
        ".rrrrrRRRRR.",
        "rrrrrrRRRRRR",
        ".wwxxwWWWWW.",
        ".wwxxwWWpWW.",
        ".wwwwwWWpWW.",
        "tttttttttttt",
        ".T..T...T.T.",
        ".T..T...T.T.",
        ".o..o...o.o."] },
    fogata: { copa: 0, filas: [
        "...t.T...",
        "..tTtTt..",
        "g.tTtTt.g",
        ".ggg.ggg."] },
    llamaA: { copa: 0, filas: [
        "..y..",
        ".yo.y",
        ".ooo.",
        "orroo",
        ".rrr."] },
    llamaB: { copa: 0, filas: [
        ".y...",
        ".oy..",
        "yooo.",
        "oroor",
        ".rrr."] },
};

// Los colores de cada dibujo según la zona.
const COLORES_LLAMA = { y: "#ffe08a", o: "#ffa03a", r: "#e0502a" };
function coloresDe(tipo, zona) {
    const verdes = VERDES[zona] || VERDES.pradera;
    const piedra = PIEDRAS[zona] || PIEDRAS[piedraDe(zona)];
    switch (tipo) {
        case "hojaS": case "hojaM": case "hojaG": case "pinoS": case "pinoM": case "pinoG": case "arbusto":
            return { ...verdes, ...TRONCO };
        case "muerto":
            return zona === "volcan" ? { t: "#2a2024", T: "#161014" } : { t: "#4a4036", T: "#2e2822" };
        case "palmera": return { l: "#5a9a4a", m: "#3a7a3a", d: "#285a2a", t: "#7a5a2a", T: "#5a4020" };
        case "cactusS": case "cactusG": return VERDES.desierto;
        case "matorral": return { t: "#7a5a34", T: "#5a4024", o: "rgba(0,0,0,.25)" };
        case "roca": case "ruina": return piedra;
        case "torre": return { ...piedra, x: "#141018", p: "#141018" };
        case "tronco": return { ...MADERA, v: zona === "nieve" ? "#e2e9f2" : MADERA.v };
        case "hongos": return { r: "#7a3424", b: "#c8b090", w: "#cfc6b0" };
        case "juncos": return { c: "#4a2e18", g: "#5a7a3a", h: "#3e5a2a" };
        case "calavera": return { h: "#a89880", w: "#d8d0b8", k: "#3a2e22" };
        case "cofre": return { ...MADERA, a: "#7c7c8a", g: "#d4a940" };
        case "casa": return {
            r: zona === "nieve" ? "#e2e9f2" : zona === "desierto" ? "#a4683e" : "#6a3428",
            R: zona === "nieve" ? "#b4c0d0" : zona === "desierto" ? "#7a4a2a" : "#4a2219",
            w: zona === "desierto" ? "#b89c70" : "#7a6a56", W: zona === "desierto" ? "#8e7550" : "#5a4c3e",
            p: "#22160e", x: "#1a1420", c: "#4a4450", o: "#1a1410",
        };
        case "tienda": return { l: "#9a8a66", m: "#7a6a4a", d: "#56492f", p: "#1e1610", k: "#3a2a1a", o: "rgba(0,0,0,.3)" };
        case "choza": return { r: "#6a5a2e", R: "#4a3e1e", w: "#5a4632", W: "#40321f", p: "#1a120c", x: "#1a1420", t: "#4a3420", T: "#2e2014", o: "rgba(0,0,0,.3)" };
        case "fogata": return { t: "#5a3a22", T: "#3a2414", g: "#5e5c68" };
        case "llamaA": case "llamaB": return COLORES_LLAMA;
        default: return {};
    }
}

// Cuánto mide de ancho la sombra de cada dibujo (por defecto, casi lo que mide el dibujo).
const SOMBRA = { hojaS: 6, hojaM: 9, hojaG: 12, pinoS: 6, pinoM: 8, pinoG: 11, palmera: 6, muerto: 6, juncos: 0, hongos: 0, llamaA: 0, llamaB: 0, calavera: 0 };

// El nombre «de verdad» de una pieza: muchas se ven igual en varias zonas (una roca del bosque es igual a una de la pradera),
// y así se definen una sola vez. «roca-bosque» → «roca-gris», «cofre-nieve» → «cofre».
const NORMALES = new Map();
export function normalizar(nombre) {
    if (!NORMALES.has(nombre)) NORMALES.set(nombre, normalizarSinGuardar(nombre));
    return NORMALES.get(nombre);
}
function normalizarSinGuardar(nombre) {
    const [tipo, zona = "pradera"] = nombre.split("-");
    if (/^(hoja|pino)|^arbusto$/.test(tipo)) return `${tipo}-${zona}`;
    if (tipo === "roca" || tipo === "ruina" || tipo === "torre") return `${tipo}-${PIEDRAS[zona] ? zona : piedraDe(zona)}`;
    if (tipo === "muerto") return zona === "volcan" ? "muerto-volcan" : "muerto";
    if (tipo === "tronco") return zona === "nieve" ? "tronco-nieve" : "tronco";
    if (tipo === "casa") return zona === "nieve" || zona === "desierto" ? `casa-${zona}` : "casa";
    return tipo;
}

// La pieza `nombre` («tipo-zona», por ejemplo «pinoG-bosque») a la hora `momento`.
// Devuelve { base, copa, luces }: base y copa son SVG (la copa va aparte para que se mezca); luces son las ventanas.
export function pieza(nombre, momento = "dia") {
    const [tipo, zona = "pradera"] = normalizar(nombre).split("-");
    const dibujo = DIBUJOS[tipo];
    if (!dibujo) return { base: "", copa: null, luces: [] };
    const colores = coloresDe(tipo, zona);
    const filas = dibujo.filas;
    const ancho = Math.max(...filas.map((f) => f.length));
    const anchoSombra = SOMBRA[tipo] ?? Math.max(4, ancho - 2);
    const conSombra = anchoSombra ? sombra(anchoSombra, filas.length, momento) : "";
    return {
        base: conSombra + pixeles(filas, colores, dibujo.copa),
        copa: dibujo.copa ? pixeles(filas, colores, 0, dibujo.copa) : null,
        luces: ventanas(filas),
    };
}

// ===== El mojón de cada kilómetro =====
// Una piedra alta con una placa del color de la pelea de ese km y su número. x, y: donde toca el suelo.
export function mojon(x, y, numero, color, momento) {
    const c = [
        [-6, -3, 12, 3, "#0e0b14"], [-5, -19, 10, 17, "#0e0b14"], [-4, -21, 8, 2, "#0e0b14"],   // contorno oscuro (se lee sobre cualquier suelo)
        [-5, -2, 10, 2, "#3e3c4a"],
        [-4, -18, 8, 16, "#6a6878"], [1, -18, 3, 16, "#52505f"], [-4, -18, 1, 16, "#83819a"],
        [-3, -20, 6, 2, "#7a788a"], [-2, -20, 2, 1, "#9694a6"],
        [-4, -15, 8, 8, "#0e0b14"], [-3, -14, 6, 6, color],                                     // la placa
        [-1, -26, 1, 6, "#2a2030"], [0, -26, 5, 3, color], [0, -23, 5, 1, "#0e0b14"],            // un banderín arriba, del mismo color
    ];
    return `<g class="cr-hito">${sombra(10, 20, momento, x, y)}${cuadros(c, x, y)}`
        + `<text x="${n1(x)}" y="${n1(y - 8.6)}" text-anchor="middle" font-size="${numero > 9 ? 5 : 6.2}" fill="#14101c" font-weight="700">${numero}</text></g>`;
}

// ===== El relieve (colinas, dunas y montañas) =====
// Devuelven listas de cuadros (con coordenadas del lienzo). cx: centro; base: la fila de abajo; r: un azar fijo (0–1).
// Los cuadros de la «capa 0» no se tapan entre sí; los de la «capa 1» (detalles) van encima. Así relieveSvg puede juntar
// todos los del mismo color de cada capa en un solo <path>.
export function relieveSvg(lista) {
    const capas = [nuevoPintor(), nuevoPintor()];
    for (const [x, y, w, h, c, capa = 0] of lista) capas[capa].cuadro(x, y, w, h, c);
    return capas[0].svg() + capas[1].svg();
}

// Una colina: un montículo de filas de 2 puntos, con luz arriba a la izquierda y sombra abajo a la derecha.
export function colina(cx, base, w, h, [osc, med, cla, brillo], r = 0.5) {
    const lista = [];
    const filas = Math.max(3, Math.round(h / 2));
    for (let f = 0; f < filas; f++) {
        const t = (f + 1) / filas;                       // 0 arriba … 1 abajo
        const media = (w / 2) * Math.sqrt(1 - (1 - t) ** 2);
        const y = base - (filas - f) * 2;
        const x0 = Math.round(cx - media);
        const x1 = Math.round(cx + media);
        const ancho = x1 - x0;
        // Tres trozos seguidos, sin taparse: luz, medio y sombra.
        const luz = f < filas - 1 ? Math.max(1, Math.round(ancho * (0.42 - t * 0.12))) : 0;
        const sombra = Math.max(1, Math.round(ancho * (0.26 + t * 0.1)));
        if (luz) lista.push([x0, y, luz, 2, cla]);
        lista.push([x0 + luz, y, Math.max(0, ancho - luz - sombra), 2, med]);
        lista.push([x1 - sombra, y, sombra, 2, osc]);
        if (f === 1) lista.push([x0 + 1, y, Math.max(1, Math.round(ancho * 0.2)), 1, brillo, 1]);
    }
    lista.push([Math.round(cx - w / 2 + 2), base - 1, Math.round(w - 4), 1, osc, 1]);
    // Unas matas sueltas sobre la colina.
    for (let k = 0; k < 3; k++) lista.push([Math.round(cx + (((r * (k + 3) * 7.31) % 1) - 0.5) * w * 0.6), Math.round(base - h * (0.3 + k * 0.18)), 1, 1, osc, 1]);
    return lista;
}

// Una montaña (o una cordillera de dos picos): lado izquierdo con luz, derecho en sombra y nieve en la punta.
// c: [sombra, medio, luz, brillo]; nieve: [sombra de la nieve, nieve] o null.
export function montana(cx, base, w, h, c, nieve, r = 0.5) {
    const lista = [];
    const filas = Math.max(4, Math.round(h / 2));
    const pico = cx + (r - 0.5) * w * 0.3;
    for (let f = 0; f < filas; f++) {
        const t = (f + 1) / filas;
        const salto = ((r * 13.7 * (f + 1)) % 1) < 0.35 ? 1 : 0;   // bordes un poco irregulares
        const x0 = Math.round(pico - (pico - (cx - w / 2)) * t) - salto;
        const x1 = Math.round(pico + (cx + w / 2 - pico) * t) + (1 - salto);
        const cresta = Math.round(pico + t * w * 0.06);
        const y = base - (filas - f) * 2;
        const nevado = nieve && t < 0.34 + r * 0.08;
        lista.push([x0, y, cresta - x0, 2, nevado ? nieve[1] : c[2]]);
        lista.push([cresta, y, x1 - cresta, 2, nevado ? nieve[0] : c[0]]);
        if (!nevado && f % 3 === 1) lista.push([x0 + 1, y, Math.max(1, Math.round((cresta - x0) * 0.3)), 1, c[3], 1]);
        if (!nevado && f % 4 === 2) lista.push([cresta + 1, y + 1, Math.max(1, Math.round((x1 - cresta) * 0.4)), 1, c[1], 1]);
    }
    lista.push([Math.round(cx - w / 2), base - 1, Math.round(w), 1, "rgba(0,0,0,.3)", 1]);
    return lista;
}

// Un volcán: montaña sin punta, con el cráter encendido (la lava va aparte, en la capa de luces).
export function volcan(cx, base, w, h, c, r = 0.5) {
    const lista = montana(cx, base, w, h, c, null, 0.5).filter(([, y]) => y >= base - h + h * 0.22);
    const arriba = Math.min(...lista.map(([, y]) => y));
    const borde = lista.filter(([, y, , , , capa]) => y === arriba && !capa);
    const x0 = Math.min(...borde.map(([x]) => x));
    const x1 = Math.max(...borde.map(([x, , ww]) => x + ww));
    lista.push([x0 + 1, arriba, x1 - x0 - 2, 2, "#1a0c0c", 1]);
    // La lava: el borde del cráter encendido y un hilo que baja en diagonal por la ladera (hacia un lado u otro).
    const lava = [[x0 + 2, arriba + 1, x1 - x0 - 4, 1, "#ff7a2a"]];
    const lado = r < 0.5 ? -1 : 1;
    let lx = lado < 0 ? x0 + 2 : x1 - 3;
    for (let s = 0; s < Math.round(h * 0.22); s++) {
        lava.push([lx, arriba + 2 + s * 2, 1, 2, s < 2 ? "#ff7a2a" : "#c8401a"]);
        lx += lado * (((r * 7.3 * (s + 1)) % 1) < 0.7 ? 1 : 0);
    }
    return { lista, lava };
}

export { PIEDRAS, VERDES };
