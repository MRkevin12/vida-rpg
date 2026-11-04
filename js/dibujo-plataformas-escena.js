// dibujo-plataformas-escena.js — El escenario de «La Senda del Reino» (v187): los colores de cada mundo, los fondos
// con paralaje, las partículas del ambiente y la luz de la pantalla (viñeta y tono de cada mundo).
//
//   const fondos = crearFondos(mundo, 240);                 // una vez por nivel: pinta las capas del fondo
//   pintarFondos(g, fondos, camX, ancho, alto, reloj);      // cada cuadro: copia las capas (las lejanas, más lento)
//   pintarBrillosDeFondo(g, fondos, camX, ancho, alto, reloj); // lo que brilla en el fondo (cristales, faroles, lava)
//   pintarAmbiente(g, mundo, camX, ancho, alto, reloj);     // cada cuadro: luciérnagas, polvo de cristal, nieve, ascuas
//   const luz = crearLuzDePantalla(mundo, ancho, alto);     // una vez (o si cambia el tamaño): viñeta y tono del mundo
//
// Paralaje: cada capa se mueve más lento que el terreno (factor 0,03 = casi quieta, como el cielo; 0,56 = cerca).
// Así el ojo entiende que lo lento está lejos: da profundidad sin 3D. Entre capa y capa hay «bruma» (un velo del
// color del aire): lo lejano se ve más claro y apagado, como en la vida real.
//
// Para que vaya rápido en el iPhone: todo lo que no se mueve se pinta UNA vez en lienzos escondidos de 512 puntos de
// ancho que se repiten. Las partículas del ambiente no se guardan en ningún lado: su lugar sale de una cuenta con el
// reloj (siempre la misma para el mismo momento), así no cuestan memoria y nunca «se acaban».

export const ANCHO_FONDO = 512;   // cada capa del fondo se repite cada 512 puntos

// ===== Colores de cada mundo (oscuros y sobrios, como el resto de la app) =====
// niebla = el color del aire de ese mundo (rojo, verde, azul), para la bruma entre las capas.
export const PALETAS = {
    1: {   // Campos del Alba: amanecer violeta y rosa, pasto oscuro, piedra de ruinas
        cielo: ["#120d22", "#2a1a38", "#5a2f46", "#a3584c", "#d18a5c"],
        lejos: "#2b2140", medio: "#1d1f30", cerca: "#13151f", niebla: [190, 112, 112],
        tierra: ["#3a2a21", "#2b1f19", "#4b382b"], borde: ["#7da047", "#557a33", "#33502a"],
        piedra: ["#8a8498", "#666178", "#47435a", "#2b2938"], ladrillo: ["#80503c", "#633d2e", "#2b1a14"],
        tabla: ["#86603c", "#634428", "#3c2a19"], musgo: ["#6f9a45", "#4a6b2f"], oscuridad: 0,
    },
    2: {   // Minas de Cristal: roca azul oscura, cristales que brillan
        cielo: ["#05050c", "#090a16", "#0d0f20", "#11142a", "#161a33"],
        lejos: "#10122a", medio: "#161936", cerca: "#0a0b18", niebla: [34, 52, 104],
        tierra: ["#272c40", "#1c2030", "#343b55"], borde: ["#5d6a94", "#414b6c", "#2f3650"],
        piedra: ["#6b7290", "#4f5672", "#383e56", "#23273a"], ladrillo: ["#4d5470", "#3a4058", "#191c2a"],
        tabla: ["#6e5038", "#513a28", "#30221a"], cristal: ["#7df3f8", "#38bdd8", "#a78bfa", "#6d4fd0"],
        oscuridad: 0.62,
    },
    3: {   // Cumbres de la Tormenta: noche, nieve y hielo
        cielo: ["#060a18", "#0b1430", "#14224a", "#22366a", "#33508a"],
        lejos: "#2c3a5e", medio: "#1e2742", cerca: "#121a2c", niebla: [120, 150, 200],
        tierra: ["#363d56", "#292f45", "#474f6c"], borde: ["#f4f7fc", "#d2dcea", "#9eaecb"],
        piedra: ["#8f9ab4", "#6c7792", "#4b5470", "#2e3448"], ladrillo: ["#9fd3ec", "#6aa9cf", "#2f5a7a"],
        tabla: ["#a9c2dc", "#7f97b4", "#4b5d78"], hielo: ["#dff6ff", "#a6dcf2", "#5fa7cf", "#356f96"],
        oscuridad: 0.22,
    },
    4: {   // Fortaleza de la Llama: piedra negra, ladrillo rojo oscuro y lava
        cielo: ["#080304", "#140606", "#220909", "#360d0a", "#561a0e"],
        lejos: "#240b0b", medio: "#170707", cerca: "#0d0404", niebla: [150, 44, 22],
        tierra: ["#3b2a2b", "#2c1f21", "#4b3638"], borde: ["#7a5752", "#553a38", "#3e2a2a"],
        piedra: ["#76656a", "#5a4b50", "#3f3438", "#261e22"], ladrillo: ["#7a3a2c", "#5c2a20", "#241010"],
        tabla: ["#5d5658", "#433d40", "#272325"], lava: ["#fde047", "#fb923c", "#ea580c", "#9a3412", "#5a1a0a"],
        oscuridad: 0.4,
    },
};


// ===== Herramientas de dibujo =====

// Un número entre 0 y 1 que siempre sale igual para los mismos números (para que nada «baile» entre cuadros).
export function ruido(a, b, c = 0) {
    let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function lienzo(ancho, alto) {
    const l = document.createElement("canvas");
    l.width = Math.max(1, Math.round(ancho));
    l.height = Math.max(1, Math.round(alto));
    return l;
}

// Un punto (o un rectángulo) de color.
export function px(g, x, y, ancho, alto, color) {
    g.fillStyle = color;
    g.fillRect(x, y, ancho, alto);
}

// Un círculo lleno hecho de filas de puntos: bordes nítidos, como en pixel art (arc() los suaviza).
export function circulo(g, cx, cy, r, color) {
    g.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
        const w = Math.round(Math.sqrt(r * r - dy * dy));
        g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1);
    }
}

// Una línea gruesa de punto en punto (para ramas, rayos y vetas).
function linea(g, x0, y0, x1, y1, grosor, color) {
    const pasos = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    g.fillStyle = color;
    for (let i = 0; i <= pasos; i++) {
        const t = i / pasos;
        g.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), grosor, grosor);
    }
}

const envolver = (valor, largo) => ((valor % largo) + largo) % largo;
const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Un halo de luz (un círculo que se desvanece), guardado para no hacerlo en cada cuadro.
const halos = new Map();
export function halo(color, radio) {
    const clave = `${color}-${radio}`;
    if (!halos.has(clave)) {
        const l = lienzo(radio * 2, radio * 2);
        const g = l.getContext("2d");
        const d = g.createRadialGradient(radio, radio, 0, radio, radio, radio);
        d.addColorStop(0, rgba(color, 0.55));
        d.addColorStop(0.35, rgba(color, 0.22));
        d.addColorStop(1, rgba(color, 0));
        g.fillStyle = d;
        g.fillRect(0, 0, radio * 2, radio * 2);
        halos.set(clave, l);
    }
    return halos.get(clave);
}

// Pega un halo con «luz que suma» (lighter): lo de abajo se aclara, como si lo iluminara.
export function brillar(g, color, radio, x, y, fuerza = 1) {
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = Math.max(0, Math.min(1, fuerza));
    g.drawImage(halo(color, radio), Math.round(x - radio), Math.round(y - radio));
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
}


// ===== Piezas de los fondos =====

// Una suma de ondas que «cierra» cada 512 puntos (así la capa se repite sin que se note la unión).
function ondas(x, semilla, alturas) {
    let y = 0;
    for (const [veces, alto, fase] of alturas) y += Math.sin(((x / ANCHO_FONDO) * veces + fase + semilla) * Math.PI * 2) * alto;
    return y;
}

// Una capa nueva: un lienzo de 512 de ancho y su pincel.
function capa(alto) {
    const l = lienzo(ANCHO_FONDO, alto);
    return [l, l.getContext("2d")];
}

// Una silueta (montañas, colinas): de la línea y(x) hasta abajo.
function perfil(g, color, base, yDe) {
    g.fillStyle = color;
    for (let x = 0; x < ANCHO_FONDO; x++) {
        const y = Math.round(yDe(x));
        g.fillRect(x, y, 1, base - y);
    }
}

// El borde de arriba de una silueta: más claro donde mira a la luz (a la derecha) y más oscuro del otro lado.
function bordeDeLuz(g, yDe, luz, sombra) {
    for (let x = 0; x < ANCHO_FONDO; x++) {
        const y = Math.round(yDe(x));
        px(g, x, y, 1, 1, Math.round(yDe(x + 1)) >= y ? luz : sombra);
    }
}

// La bruma: un velo del color del aire que se espesa hacia abajo.
function bruma(g, desde, alto, color, alfa) {
    const d = g.createLinearGradient(0, desde, 0, desde + alto);
    d.addColorStop(0, rgba(color, 0));
    d.addColorStop(1, rgba(color, alfa));
    g.fillStyle = d;
    g.fillRect(0, desde, ANCHO_FONDO, alto);
}

function estrellas(g, cuantas, hasta, semilla) {
    for (let i = 0; i < cuantas; i++) {
        const x = Math.floor(ruido(i, 1, semilla) * ANCHO_FONDO);
        const y = Math.floor(ruido(i, 2, semilla) * hasta);
        const r = ruido(i, 3, semilla);
        px(g, x, y, 1, 1, r < 0.15 ? "#ffffff" : r < 0.5 ? "rgba(220,225,255,.6)" : "rgba(200,205,255,.3)");
        if (r < 0.06) {   // las más brillantes tienen una crucecita
            px(g, x - 1, y, 3, 1, "rgba(220,225,255,.45)");
            px(g, x, y - 1, 1, 3, "rgba(220,225,255,.45)");
        }
    }
}

// Una nube de pixel art: arriba la luz, en medio su color y abajo, plana, la sombra.
function nube(g, x, y, escala, [luz, medio, sombra]) {
    const bolas = [[0, 0, 7], [9, -4, 9], [20, -2, 8], [29, 1, 6], [-8, 2, 5]];
    const fondo = Math.round(y + 6 * escala);
    g.save();
    g.beginPath();
    g.rect(x - 20 * escala, y - 20 * escala, 60 * escala, fondo - (y - 20 * escala));
    g.clip();
    for (const [color, baja] of [[luz, 0], [medio, 2], [sombra, 6]]) {
        for (const [bx, by, r] of bolas) circulo(g, x + bx * escala, y + by * escala + baja, Math.round(r * escala), color);
    }
    g.restore();
}

// Estalactitas que cuelgan del techo (o estalagmitas que suben del suelo, con hacia = -1).
function puntas(g, color, cuantas, largo, base, semilla, hacia = 1) {
    for (let i = 0; i < cuantas; i++) {
        const cx = Math.floor(ruido(i, 11, semilla) * ANCHO_FONDO);
        const l = 10 + Math.floor(ruido(i, 12, semilla) * largo);
        const ancho = 3 + Math.floor(ruido(i, 13, semilla) * 5);
        for (let k = 0; k < l; k++) {
            const w = Math.max(1, Math.round((1 - k / l) * ancho));
            px(g, cx - Math.floor(w / 2), hacia > 0 ? base + k : base - k - 1, w, 1, color);
        }
    }
}

// Un pino (los pisos de ramas se ensanchan hacia abajo). nieve = el color de la nieve en sus ramas (o nada).
function pino(g, cx, pie, alto, color, nieve) {
    for (let k = 0; k < alto; k++) {
        const w = Math.max(1, Math.round(((k % 6) + 2) * (k / alto) * 1.3));
        px(g, cx - Math.floor(w / 2), pie - alto + k, w, 1, color);
        if (nieve && k % 6 === 0 && k > 0) px(g, cx - Math.floor(w / 2), pie - alto + k, Math.max(1, w - 1), 1, nieve);
    }
    px(g, cx, pie - 1, 1, 2, color);   // el tronco
}

// Un árbol seco de ramas torcidas.
function arbolSeco(g, x, pie, alto, color, semilla) {
    linea(g, x, pie, x + 1, pie - alto, 2, color);
    for (let i = 0; i < 4; i++) {
        const y = pie - alto * (0.45 + i * 0.14);
        const lado = i % 2 ? 1 : -1;
        const largo = 6 + ruido(i, 3, semilla) * 8;
        linea(g, x + 1, y, x + 1 + lado * largo, y - largo * 0.7, 1, color);
    }
}

// El castillo en ruinas del viejo reino, sobre un pico.
function castilloEnRuinas(g, cx, cy, base, color) {
    px(g, cx - 24, cy, 48, base - cy, color);          // la loma que lo sostiene
    px(g, cx - 18, cy - 10, 36, 12, color);            // la muralla
    for (let k = 0; k < 5; k++) px(g, cx - 18 + k * 8, cy - 13, 4, 3, color);
    px(g, cx - 23, cy - 30, 9, 32, color);             // la torre entera
    for (const dx of [-24, -20, -16]) px(g, cx + dx, cy - 33, 3, 3, color);
    px(g, cx + 11, cy - 22, 8, 24, color);             // la torre rota
    px(g, cx + 11, cy - 26, 3, 4, color);
    px(g, cx + 16, cy - 24, 3, 2, color);
    px(g, cx - 20, cy - 24, 2, 4, "#1a1328");          // las troneras
    px(g, cx + 14, cy - 16, 2, 3, "#1a1328");
}

// Un cristal grande del fondo de la mina: tres puntas, la cara izquierda clara y la derecha oscura.
function cristalGrande(g, x, pie, alto, [claro, medio, , oscuro]) {
    for (const [dx, h, inclina] of [[0, alto, 0], [-5, alto * 0.62, -4], [5, alto * 0.7, 3]]) {
        for (let k = 0; k < h; k++) {
            const w = Math.max(1, Math.round((1 - k / h) * 5));
            const cx = Math.round(x + dx + (inclina * k) / h);
            px(g, cx - w, pie - k, w, 1, claro);
            px(g, cx, pie - k, w, 1, k % 4 ? medio : oscuro);
        }
    }
}


// ===== Los fondos de cada mundo =====
// Cada uno devuelve sus capas, de la más lejana a la más cercana:
//   { lienzo, factor, deriva?, brillo?, alfa?, efecto? }
//   factor = qué tanto sigue a la cámara · deriva = puntos por segundo que la mueve el viento
//   brillo = un lienzo con lo que brilla (se pinta encima de la oscuridad, con luz que suma)
//   efecto = algo animado que va en ese lugar ("relampago" o "resplandor")

function fondoAlba(alto, pal) {
    const base = alto;
    // 1. El cielo: estrellas que se apagan, el sol del alba (halos en anillos, así se ve pixelado) y nubes finas.
    const [cielo, gc] = capa(alto);
    estrellas(gc, 22, alto * 0.28, 1);
    for (const [r, a] of [[72, 0.05], [54, 0.07], [40, 0.1], [28, 0.14]]) {
        gc.globalAlpha = a;
        circulo(gc, 128, base - 92, r, "#ffc58f");
    }
    gc.globalAlpha = 1;
    circulo(gc, 128, base - 92, 17, "#ffd9a6");
    circulo(gc, 128, base - 92, 13, "#ffeccc");
    for (const [x, y, w] of [[48, base - 100, 70], [94, base - 84, 112], [164, base - 108, 52], [260, 52, 88], [350, 74, 60], [430, 40, 64]]) {
        px(gc, x, y, w, 2, "rgba(255, 190, 160, 0.5)");
        px(gc, x + 8, y + 2, w - 16, 1, "rgba(120, 60, 90, 0.45)");
    }
    // 2. Nubes gordas que el viento lleva despacio.
    const [nubes, gn] = capa(alto);
    for (let i = 0; i < 5; i++) {
        nube(gn, 24 + i * 96 + ruido(i, 5) * 20, 36 + ruido(i, 6) * 44, 0.7 + ruido(i, 7) * 0.5, ["#e7a48c", "#9b5a6e", "#5b3654"]);
    }
    // 3. Montañas lejanas, con el castillo en ruinas del viejo reino en un pico.
    const [lejos, gl] = capa(alto);
    const yl = (x) => base - 100 + ondas(x, 0.1, [[1, 18, 0], [3, 9, 0.4], [7, 3, 0.1]]);
    perfil(gl, pal.lejos, base, yl);
    bordeDeLuz(gl, yl, "#5a3f68", "#2e2443");
    let pico = 380;
    for (let x = 330; x < 470; x++) if (yl(x) < yl(pico)) pico = x;
    castilloEnRuinas(gl, pico, Math.round(yl(pico)) + 2, base, pal.lejos);
    bruma(gl, base - 78, 78, pal.niebla, 0.42);
    // 4. Colinas con pinos oscuros.
    const [medio, gm] = capa(alto);
    const ym = (x) => base - 62 + ondas(x, 0.6, [[2, 12, 0], [5, 6, 0.2], [11, 2, 0.7]]);
    perfil(gm, pal.medio, base, ym);
    bordeDeLuz(gm, ym, "#33304a", "#1a1b2b");
    for (let i = 0; i < 24; i++) {
        const cx = Math.floor(ruido(i, 51) * ANCHO_FONDO);
        pino(gm, cx, Math.round(ym(cx)) + 8, 18 + Math.floor(ruido(i, 52) * 16), pal.medio);
    }
    bruma(gm, base - 44, 44, pal.niebla, 0.26);
    // 5. Lo de cerca: arcos rotos, columnas caídas, un árbol seco y lápidas de la última guerra.
    const [cerca, gk] = capa(alto);
    const yc = (x) => base - 26 + ondas(x, 0.3, [[3, 6, 0], [8, 2, 0.5]]);
    perfil(gk, pal.cerca, base, yc);
    for (let i = 0; i < 4; i++) {
        const cx = 40 + i * 128 + Math.floor(ruido(i, 61) * 50);
        const pie = base - 24;
        px(gk, cx, pie - 40, 6, 40, pal.cerca);
        px(gk, cx + 26, pie - 30, 6, 30, pal.cerca);
        for (let k = 0; k < 20; k++) px(gk, cx + 3 + k, pie - 40 - Math.round(Math.sin((k / 26) * Math.PI) * 8), 1, 4, pal.cerca);
        px(gk, cx + 40, pie - 9, 3, 9, pal.cerca);   // una lápida
        px(gk, cx + 38, pie - 7, 7, 2, pal.cerca);
    }
    arbolSeco(gk, 300, base - 22, 40, pal.cerca, 3);
    arbolSeco(gk, 470, base - 24, 30, pal.cerca, 7);
    bordeDeLuz(gk, yc, "#2a2436", pal.cerca);
    return [
        { lienzo: cielo, factor: 0.03 },
        { lienzo: nubes, factor: 0.07, deriva: 2.5 },
        { lienzo: lejos, factor: 0.14 },
        { lienzo: medio, factor: 0.3 },
        { lienzo: cerca, factor: 0.56 },
    ];
}

function fondoMinas(alto, pal) {
    const base = alto;
    // 1. La pared del fondo de la cueva: manchas de roca y vetas de cristal apagadas.
    const [pared, gp] = capa(alto);
    px(gp, 0, 0, ANCHO_FONDO, alto, pal.lejos);
    for (let i = 0; i < 110; i++) {
        circulo(gp, ruido(i, 1, 5) * ANCHO_FONDO, ruido(i, 2, 5) * alto, 2 + Math.floor(ruido(i, 3, 5) * 5), ruido(i, 4, 5) < 0.5 ? "#0b0d20" : "#15183a");
    }
    for (let i = 0; i < 9; i++) {   // vetas: un camino que serpentea
        let x = ruido(i, 21) * ANCHO_FONDO;
        let y = 30 + ruido(i, 22) * (alto - 60);
        for (let k = 0; k < 26; k++) {
            x += 2;
            y += Math.round((ruido(i, k, 23) - 0.5) * 3);
            px(gp, x, y, 2, 1, k % 7 === 3 ? "#3b5e8a" : "#1c2b52");
        }
    }
    puntas(gp, "#0a0b1d", 34, 36, 0, 1);
    puntas(gp, "#0a0b1d", 20, 22, base, 2, -1);
    // 2. Los soportes de madera de la mina, con sus faroles (el farol brilla: va también en «brillo»).
    const [soportes, gs] = capa(alto);
    const [brilloSoportes, gbs] = capa(alto);
    const ys = (x) => base - 40 + ondas(x, 0.4, [[2, 8, 0], [6, 4, 0.3]]);
    perfil(gs, pal.medio, base, ys);
    for (let k = 0; k < 4; k++) {
        const x = 24 + k * 128 + Math.floor(ruido(k, 41) * 24);
        const arriba = 64 + Math.floor(ruido(k, 42) * 20);
        px(gs, x, arriba, 4, base - arriba, "#1d1820");
        px(gs, x + 40, arriba, 4, base - arriba, "#1d1820");
        px(gs, x - 4, arriba - 4, 52, 5, "#241d22");
        linea(gs, x + 4, arriba + 12, x + 12, arriba + 1, 2, "#1d1820");
        linea(gs, x + 40, arriba + 12, x + 32, arriba + 1, 2, "#1d1820");
        px(gs, x + 22, arriba + 1, 1, 9, "#2a2228");    // la cuerda del farol
        px(gs, x + 20, arriba + 10, 5, 6, "#3a2a1a");
        px(gs, x + 21, arriba + 12, 3, 3, "#f5b453");
        px(gbs, x + 21, arriba + 12, 3, 3, "#f5b453");
        gbs.drawImage(halo([245, 170, 80], 26), x + 22 - 26, arriba + 13 - 26);
    }
    puntas(gs, pal.medio, 14, 50, 0, 3);
    bruma(gs, base - 56, 56, pal.niebla, 0.3);
    // 3. Cristales grandes que brillan solos.
    const [cristales, gk] = capa(alto);
    const [brilloCristales, gbk] = capa(alto);
    const yk = (x) => base - 20 + ondas(x, 0.8, [[3, 5, 0], [9, 2, 0.4]]);
    perfil(gk, "#0e1026", base, yk);
    for (let i = 0; i < 9; i++) {
        const x = 20 + i * 56 + Math.floor(ruido(i, 31) * 24);
        const pie = Math.round(yk(x)) + 2;
        const violeta = ruido(i, 33) < 0.4;
        const colores = violeta ? [pal.cristal[2], pal.cristal[3], null, "#3b2a86"] : [pal.cristal[0], pal.cristal[1], null, "#1d6f8a"];
        const alto2 = 12 + Math.floor(ruido(i, 32) * 16);
        cristalGrande(gk, x, pie, alto2, colores);
        cristalGrande(gbk, x, pie, alto2, colores);
        gbk.drawImage(halo(violeta ? [167, 139, 250] : [56, 189, 216], 30), x - 30, pie - alto2 / 2 - 30);
    }
    puntas(gk, pal.cerca, 10, 44, 0, 4);
    return [
        { lienzo: pared, factor: 0.06 },
        { lienzo: soportes, factor: 0.2, brillo: brilloSoportes },
        { lienzo: cristales, factor: 0.42, brillo: brilloCristales },
    ];
}

function fondoCumbres(alto, pal) {
    const base = alto;
    // 1. El cielo de la noche: muchas estrellas y la luna (con sus manchas y su halo).
    const [cielo, gc] = capa(alto);
    estrellas(gc, 80, alto * 0.62, 3);
    for (const [r, a] of [[40, 0.04], [28, 0.07], [20, 0.1]]) {
        gc.globalAlpha = a;
        circulo(gc, 128, 52, r, "#c8d8ff");
    }
    gc.globalAlpha = 1;
    circulo(gc, 128, 52, 12, "#d6e0f2");
    circulo(gc, 131, 49, 10, "#eef3fc");
    for (const [dx, dy, r] of [[-4, 3, 3], [3, -4, 2], [5, 5, 2], [-6, -3, 1]]) circulo(gc, 128 + dx, 52 + dy, r, "#c4cfe4");
    // 2. La aurora: cortinas de luz verde y violeta (se mueve y late; ver pintarFondos › alfa).
    const [aurora, ga] = capa(alto);
    for (let x = 0; x < ANCHO_FONDO; x++) {
        const y = 26 + ondas(x, 0.2, [[2, 12, 0], [5, 5, 0.3], [13, 2, 0.1]]);
        const largo = 26 + ondas(x, 0.5, [[3, 10, 0], [7, 4, 0.2]]);
        const fuerza = 0.5 + 0.5 * Math.sin((x / ANCHO_FONDO) * Math.PI * 8);
        const d = ga.createLinearGradient(0, y, 0, y + largo);
        d.addColorStop(0, "rgba(167, 139, 250, 0)");
        d.addColorStop(0.5, `rgba(129, 140, 248, ${0.08 * fuerza + 0.03})`);
        d.addColorStop(1, `rgba(94, 234, 212, ${0.16 * fuerza + 0.05})`);
        ga.fillStyle = d;
        ga.fillRect(x, y, 1, largo);
    }
    // 3. Picos lejanos: nieve en lo alto, más clara del lado de la luna.
    const [lejos, gl] = capa(alto);
    const yl = (x) => base - 120 + ondas(x, 0.15, [[2, 22, 0], [5, 11, 0.3], [11, 5, 0.6], [23, 2, 0.2]]);
    perfil(gl, pal.lejos, base, yl);
    for (let x = 0; x < ANCHO_FONDO; x++) {
        // La nieve cubre solo lo alto y sigue la forma del pico; el lado que mira a la luna (a la izquierda) es más claro.
        const y = Math.round(yl(x));
        const nieve = Math.min(16, Math.max(0, Math.round((base - 100 - y) * 0.4 + ruido(x, 4) * 3)));
        if (nieve > 0) px(gl, x, y, 1, nieve, yl(x + 3) < yl(x - 3) ? "#a9b8d4" : "#68789c");
    }
    bruma(gl, base - 96, 96, pal.niebla, 0.3);
    // 4. Montañas medias, más oscuras, con nieve en las crestas.
    const [medio, gm] = capa(alto);
    const ym = (x) => base - 70 + ondas(x, 0.6, [[2, 14, 0], [5, 7, 0.2], [13, 2, 0.7]]);
    perfil(gm, pal.medio, base, ym);
    for (let x = 0; x < ANCHO_FONDO; x++) {
        const y = Math.round(ym(x));
        const nieve = Math.max(0, Math.round((base - 72 - y) * 0.35 + 1 + ruido(x, 5) * 2));
        if (nieve > 0) px(gm, x, y, 1, Math.min(nieve, 7), ym(x + 3) < ym(x - 3) ? "#8f9dbb" : "#4f5d80");
    }
    bruma(gm, base - 50, 50, pal.niebla, 0.24);
    // 5. Jirones de nubes bajas que el viento arrastra.
    const [nubes, gn] = capa(alto);
    for (let i = 0; i < 6; i++) {
        nube(gn, 20 + i * 82 + ruido(i, 8) * 20, base - 70 + ruido(i, 9) * 26, 0.6 + ruido(i, 10) * 0.4, ["#8a9cc4", "#5b6b92", "#3a4668"]);
    }
    // 6. Pinos nevados cerca.
    const [cerca, gk] = capa(alto);
    const yc = (x) => base - 26 + ondas(x, 0.3, [[3, 6, 0], [8, 2, 0.5]]);
    perfil(gk, pal.cerca, base, yc);
    for (let i = 0; i < 18; i++) {
        const cx = Math.floor(ruido(i, 71) * ANCHO_FONDO);
        pino(gk, cx, Math.round(yc(cx)) + 4, 16 + Math.floor(ruido(i, 72) * 14), pal.cerca, "#3c4a6c");
    }
    bordeDeLuz(gk, yc, "#4a5878", "#26304a");
    return [
        { lienzo: cielo, factor: 0.02 },
        { lienzo: aurora, factor: 0.03, deriva: 1.5, alfa: (reloj) => 0.75 + 0.25 * Math.sin(reloj * 0.6) },
        { efecto: "relampago" },
        { lienzo: lejos, factor: 0.08 },
        { lienzo: medio, factor: 0.2 },
        { lienzo: nubes, factor: 0.28, deriva: 7, alfa: () => 0.38 },
        { lienzo: cerca, factor: 0.48 },
    ];
}

function fondoFortaleza(alto, pal) {
    const base = alto;
    // 1. El cielo de humo, con un sol rojo y apagado.
    const [cielo, gc] = capa(alto);
    for (const [r, a] of [[34, 0.04], [24, 0.07], [17, 0.1]]) {
        gc.globalAlpha = a;
        circulo(gc, 130, 64, r, "#c2410c");
    }
    gc.globalAlpha = 1;
    circulo(gc, 130, 64, 11, "#6a2010");
    circulo(gc, 132, 62, 8, "#86301a");
    for (let i = 0; i < 7; i++) nube(gc, 20 + i * 70 + ruido(i, 3) * 20, 30 + ruido(i, 4) * 60, 0.9 + ruido(i, 5) * 0.6, ["#3a1512", "#2a0e0c", "#1c0908"]);
    // 2. Las montañas y el volcán, con su cráter encendido y ríos de lava (lo encendido va también en «brillo»).
    const [volcan, gv] = capa(alto);
    const [brilloVolcan, gbv] = capa(alto);
    const yv = (x) => Math.min(base - 84 + ondas(x, 0.2, [[2, 14, 0], [6, 6, 0.4]]), base - 150 + Math.max(10, Math.abs(x - 300)) * 0.95);
    perfil(gv, "#2e0f0c", base, yv);
    bordeDeLuz(gv, yv, "#6a2416", "#3a1310");   // el borde del monte, encendido por el resplandor
    for (const g of [gv, gbv]) {
        for (const lado of [-1, 1]) {   // los ríos de lava bajan por las laderas, serpenteando y apagándose
            let x = 300 + lado * 6;
            let y = base - 140;
            while (y < base - 96) {
                g.globalAlpha = Math.max(0.25, 1 - (y - (base - 140)) / 50);
                px(g, Math.round(x + Math.sin(y * 0.35) * 2), Math.round(y), 1, 2, y < base - 120 ? "#fb923c" : "#c2410c");
                x += lado * (0.6 + ruido(Math.round(y), 2) * 0.5);
                y += 1.2;
            }
            g.globalAlpha = 1;
        }
        px(g, 290, base - 142, 22, 3, "#fdba74");   // el cráter
        px(g, 294, base - 141, 14, 2, "#fef3c7");
    }
    gbv.drawImage(halo([234, 88, 12], 46), 300 - 46, base - 140 - 46);
    for (let i = 0; i < 8; i++) circulo(gv, 300 + Math.sin(i * 1.3) * 6 + i * 3, base - 150 - i * 9, 4 + i * 1.2, i % 2 ? "#2a0f0d" : "#220b0a");   // el humo
    bruma(gv, base - 80, 80, pal.niebla, 0.3);
    // 3. Las torres de la fortaleza, con ventanas encendidas y estandartes rotos.
    const [torres, gt] = capa(alto);
    const [brilloTorres, gbt] = capa(alto);
    for (let i = 0; i < 6; i++) {
        const cx = 20 + i * 85 + Math.floor(ruido(i, 81) * 30);
        const ancho = 22 + Math.floor(ruido(i, 82) * 14);
        const alto2 = 80 + Math.floor(ruido(i, 83) * 60);
        px(gt, cx, base - alto2, ancho, alto2, pal.medio);
        for (let k = 0; k < ancho; k += 6) px(gt, cx + k, base - alto2 - 5, 4, 5, pal.medio);
        for (let k = 0; k < 3; k++) {
            if (ruido(i, 84 + k) < 0.6) {
                const wx = cx + 6 + Math.floor(ruido(i, 90 + k) * (ancho - 12));
                const wy = base - alto2 + 16 + k * 22;
                px(gt, wx, wy, 3, 5, "#b45309");
                px(gbt, wx, wy, 3, 5, "#d97706");
                gbt.drawImage(halo([217, 119, 6], 12), wx + 1 - 12, wy + 2 - 12);
            }
        }
        if (ruido(i, 88) < 0.7) {   // un estandarte que cuelga, roto abajo
            const bx = cx + Math.floor(ancho / 2) - 4;
            const by = base - alto2 + 6;
            px(gt, bx, by, 8, 22, "#3f0d0d");
            px(gt, bx, by, 8, 1, "#5c1414");
            px(gt, bx + 2, by + 22, 2, 3, "#3f0d0d");
            px(gt, bx + 6, by + 22, 2, 2, "#3f0d0d");
        }
    }
    bruma(gt, base - 60, 60, pal.niebla, 0.22);
    // 4. Cadenas que cuelgan y un muro cercano con troneras.
    const [cadenas, gk] = capa(alto);
    for (let i = 0; i < 7; i++) {
        const cx = Math.floor(ruido(i, 101) * ANCHO_FONDO);
        const largo = 40 + Math.floor(ruido(i, 102) * 90);
        for (let k = 0; k < largo; k += 4) {
            px(gk, cx, k, 2, 3, "#1f0d0b");
            px(gk, cx + (k % 8 ? 1 : -1), k + 2, 2, 2, "#2a1210");
        }
    }
    const yk = (x) => base - 30 + ondas(x, 0.7, [[4, 3, 0]]);
    perfil(gk, pal.cerca, base, yk);
    for (let x = 0; x < ANCHO_FONDO; x += 10) px(gk, x, Math.round(yk(x)) - 4, 6, 4, pal.cerca);
    return [
        { lienzo: cielo, factor: 0.03 },
        { lienzo: volcan, factor: 0.08, brillo: brilloVolcan },
        { lienzo: torres, factor: 0.22, brillo: brilloTorres },
        { lienzo: cadenas, factor: 0.46 },
        { efecto: "resplandor" },
    ];
}

const FONDOS = { 1: fondoAlba, 2: fondoMinas, 3: fondoCumbres, 4: fondoFortaleza };

export function crearFondos(mundo, alto) {
    const pal = PALETAS[mundo];
    const cielo = lienzo(1, alto);   // el cielo: un degradado de 1 punto de ancho que se estira
    const gc = cielo.getContext("2d");
    const degradado = gc.createLinearGradient(0, 0, 0, alto);
    pal.cielo.forEach((color, i) => degradado.addColorStop(i / (pal.cielo.length - 1), color));
    gc.fillStyle = degradado;
    gc.fillRect(0, 0, 1, alto);
    return { mundo, cielo, capas: FONDOS[mundo](alto, pal) };
}

// Dónde empieza a pintarse una capa (se repite cada 512 puntos).
function inicioDeCapa(capa, camX, reloj) {
    const corrido = camX * capa.factor + (capa.deriva || 0) * reloj;
    return -envolver(corrido, ANCHO_FONDO);
}

export function pintarFondos(g, fondos, camX, ancho, alto, reloj) {
    g.drawImage(fondos.cielo, 0, 0, ancho, alto);
    for (const capa of fondos.capas) {
        if (capa.efecto === "relampago") { pintarRelampago(g, ancho, alto, reloj); continue; }
        if (capa.efecto === "resplandor") { pintarResplandor(g, ancho, alto, reloj); continue; }
        if (capa.alfa) g.globalAlpha = capa.alfa(reloj);
        for (let x = inicioDeCapa(capa, camX, reloj); x < ancho; x += ANCHO_FONDO) g.drawImage(capa.lienzo, Math.round(x), alto - capa.lienzo.height);
        g.globalAlpha = 1;
    }
}

// Lo que brilla en el fondo (faroles, cristales, ventanas, el volcán): se pinta DESPUÉS de la oscuridad de las cuevas,
// con luz que suma, así se ve brillar en lo oscuro.
export function pintarBrillosDeFondo(g, fondos, camX, ancho, alto, reloj) {
    g.globalCompositeOperation = "lighter";
    for (const capa of fondos.capas) {
        if (!capa.brillo) continue;
        g.globalAlpha = 0.55 + 0.1 * Math.sin(reloj * 2.2 + capa.factor * 20);   // laten un poco, como fuego o cristal vivo
        for (let x = inicioDeCapa(capa, camX, reloj); x < ancho; x += ANCHO_FONDO) g.drawImage(capa.brillo, Math.round(x), alto - capa.brillo.height);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
}

// (Cumbres) Cada tanto cae un rayo lejos: el cielo destella dos veces y se ve el zigzag.
// Va entre el cielo y las montañas: las montañas quedan recortadas contra la luz.
function pintarRelampago(g, ancho, alto, reloj) {
    const CADA = 8.5;
    if (reloj < 3) return;
    const numero = Math.floor((reloj - 3) / CADA);
    const t = (reloj - 3) % CADA;
    const fuerte = t < 0.07 ? 1 : t > 0.16 && t < 0.24 ? 0.6 : 0;
    if (!fuerte) return;
    g.globalAlpha = 0.32 * fuerte;
    px(g, 0, 0, ancho, alto, "#c7d2fe");
    g.globalAlpha = 1;
    let x = 20 + ruido(numero, 9) * (ancho - 40);
    let y = 0;
    while (y < alto * 0.55) {
        const nx = x + (ruido(numero, y, 3) - 0.5) * 14;
        const ny = y + 8 + ruido(numero, y, 4) * 6;
        linea(g, x, y, nx, ny, 1, fuerte > 0.8 ? "#ffffff" : "#c7d2fe");
        x = nx;
        y = ny;
    }
}

// (Fortaleza) El resplandor de la lava, abajo, que respira despacio.
function pintarResplandor(g, ancho, alto, reloj) {
    const d = g.createLinearGradient(0, alto - 90, 0, alto);
    const a = 0.2 + 0.07 * Math.sin(reloj * 1.7);
    d.addColorStop(0, "rgba(234, 88, 12, 0)");
    d.addColorStop(1, `rgba(234, 88, 12, ${a})`);
    g.fillStyle = d;
    g.fillRect(0, alto - 90, ancho, 90);
}


// ===== Las partículas del ambiente (delante de todo, en la pantalla) =====
// Su lugar sale de una cuenta con el reloj: no hay lista que guardar ni que mover.
export function pintarAmbiente(g, mundo, camX, ancho, alto, reloj) {
    const W = ancho + 32;
    const x = (i, velocidad, lejania) => envolver(ruido(i, 1, mundo) * 997 + reloj * velocidad - camX * lejania, W) - 16;
    if (mundo === 1) {
        // Luciérnagas: flotan cerca del suelo y se encienden y apagan despacio.
        for (let i = 0; i < 14; i++) {
            const brillo = Math.sin(reloj * (1.4 + ruido(i, 5) * 1.6) + i * 2.1);
            if (brillo <= 0) continue;
            const fx = x(i, (3 + ruido(i, 2) * 5) * (i % 2 ? 1 : -1), 0.8);
            const fy = alto * 0.45 + ruido(i, 3) * alto * 0.42 + Math.sin(reloj * (0.7 + ruido(i, 4)) + i) * 7;
            g.globalAlpha = brillo * 0.4;
            px(g, fx - 1, fy, 3, 1, "#bef264");
            px(g, fx, fy - 1, 1, 3, "#bef264");
            g.globalAlpha = 0.5 + brillo * 0.5;
            px(g, fx, fy, 1, 1, "#f7fee7");
        }
        // Polvo dorado que flota en la luz del alba.
        for (let i = 20; i < 32; i++) {
            const fx = x(i, 5 + ruido(i, 2) * 4, 0.4);
            const fy = envolver(ruido(i, 3) * alto - reloj * (2 + ruido(i, 4) * 3), alto);
            g.globalAlpha = 0.25 + 0.2 * Math.sin(reloj * 2 + i);
            px(g, fx, fy, 1, 1, "#fde7c0");
        }
        // Unos pájaros lejanos que cruzan el cielo cada tanto.
        const vuelo = (reloj % 26) / 26;
        if (vuelo < 0.6) {
            for (let i = 0; i < 3; i++) {
                const bx = -20 + (vuelo / 0.6) * (ancho + 40) + i * 9;
                const by = 40 + i * 5 + Math.sin(reloj * 2 + i) * 2;
                const ala = Math.floor(reloj * 8 + i) % 2;
                g.globalAlpha = 0.7;
                px(g, bx, by, 1, 1, "#2a1a30");
                px(g, bx - 2, by - ala, 2, 1, "#2a1a30");
                px(g, bx + 1, by - ala, 2, 1, "#2a1a30");
            }
        }
    } else if (mundo === 2) {
        // Polvo de cristal: motas de luz que suben despacio.
        for (let i = 0; i < 22; i++) {
            const fx = x(i, Math.sin(reloj * 0.5 + i) * 3, 0.6) + Math.sin(reloj * 0.8 + i) * 4;
            const fy = envolver(ruido(i, 3) * alto - reloj * (4 + ruido(i, 4) * 6), alto);
            const brillo = 0.5 + 0.5 * Math.sin(reloj * 3 + i * 1.7);
            g.globalAlpha = 0.25 + brillo * 0.55;
            px(g, fx, fy, 1, 1, i % 3 ? "#7df3f8" : "#c4b5fd");
            if (brillo > 0.85) {
                g.globalAlpha = 0.25;
                px(g, fx - 1, fy, 3, 1, "#e0fbff");
                px(g, fx, fy - 1, 1, 3, "#e0fbff");
            }
        }
        // Gotas que caen del techo.
        for (let i = 0; i < 4; i++) {
            const ciclo = (reloj * 0.6 + ruido(i, 7)) % 1;
            if (ciclo > 0.55) continue;
            const fx = x(i + 40, 0, 1);
            g.globalAlpha = 0.6;
            px(g, fx, 6 + (ciclo / 0.55) ** 2 * (alto - 20), 1, 2, "#93c5fd");
        }
    } else if (mundo === 3) {
        // Nieve en dos profundidades: los copos cercanos son más grandes y caen más rápido. El viento los inclina.
        const viento = 10 + 6 * Math.sin(reloj * 0.4);
        for (let i = 0; i < 44; i++) {
            const cerca = i < 14;
            const caida = cerca ? 30 + ruido(i, 4) * 14 : 14 + ruido(i, 4) * 10;
            const fy = envolver(ruido(i, 3) * alto + reloj * caida, alto + 8) - 4;
            const fx = x(i, -viento * (cerca ? 1.4 : 0.8), cerca ? 1.1 : 0.5) + Math.sin(reloj * 1.3 + i) * 3;
            g.globalAlpha = cerca ? 0.85 : 0.5;
            px(g, fx, fy, cerca ? 2 : 1, cerca ? 2 : 1, "#f1f5ff");
        }
    } else if (mundo === 4) {
        // Ascuas que suben de la lava, titilando, y ceniza gris que baja.
        for (let i = 0; i < 26; i++) {
            const sube = 16 + ruido(i, 4) * 26;
            const fy = alto - envolver(ruido(i, 3) * alto + reloj * sube, alto + 10);
            const fx = x(i, Math.sin(reloj + i) * 6, 0.7) + Math.sin(reloj * 2.3 + i) * 3;
            const vida = fy / alto;   // cuanto más alto, más se apaga
            g.globalAlpha = Math.max(0, vida) * (0.6 + 0.4 * Math.sin(reloj * 9 + i));
            px(g, fx, fy, 1, 1, i % 3 ? "#fb923c" : "#fde047");
        }
        for (let i = 30; i < 40; i++) {
            const fy = envolver(ruido(i, 3) * alto + reloj * 9, alto);
            const fx = x(i, -4, 0.5) + Math.sin(reloj * 0.9 + i) * 5;
            g.globalAlpha = 0.35;
            px(g, fx, fy, 1, 1, "#8b7d7b");
        }
    }
    g.globalAlpha = 1;
}


// ===== La luz de la pantalla: la viñeta (las esquinas más oscuras) y el tono de cada mundo =====
// Se pinta una vez del tamaño de la vista y en cada cuadro se pega encima de todo (un solo drawImage).
export function crearLuzDePantalla(mundo, ancho, alto) {
    const l = lienzo(ancho, alto);
    const g = l.getContext("2d");
    if (mundo === 1) {
        // La luz tibia del alba entra desde arriba a la derecha, con unos rayos suaves.
        const d = g.createLinearGradient(ancho, 0, ancho * 0.3, alto);
        d.addColorStop(0, "rgba(255, 178, 122, 0.16)");
        d.addColorStop(0.6, "rgba(255, 178, 122, 0.02)");
        d.addColorStop(1, "rgba(255, 178, 122, 0)");
        g.fillStyle = d;
        g.fillRect(0, 0, ancho, alto);
        g.fillStyle = "rgba(255, 222, 180, 0.035)";
        for (let k = 0; k < 4; k++) {
            const x0 = ancho * (0.55 + k * 0.16);
            g.beginPath();
            g.moveTo(x0, 0);
            g.lineTo(x0 + 10 + k * 4, 0);
            g.lineTo(x0 - alto * 0.55 + 22, alto);
            g.lineTo(x0 - alto * 0.55, alto);
            g.closePath();
            g.fill();
        }
    } else if (mundo === 3) {
        const d = g.createLinearGradient(0, 0, 0, alto);
        d.addColorStop(0, "rgba(120, 150, 220, 0.1)");
        d.addColorStop(1, "rgba(120, 150, 220, 0)");
        g.fillStyle = d;
        g.fillRect(0, 0, ancho, alto);
    } else if (mundo === 4) {
        const d = g.createLinearGradient(0, alto, 0, 0);
        d.addColorStop(0, "rgba(234, 88, 12, 0.12)");
        d.addColorStop(0.5, "rgba(234, 88, 12, 0)");
        g.fillStyle = d;
        g.fillRect(0, 0, ancho, alto);
    }
    const fuerza = mundo === 2 ? 0.6 : mundo === 4 ? 0.5 : 0.42;
    const r = Math.hypot(ancho, alto) / 2;
    const v = g.createRadialGradient(ancho / 2, alto * 0.48, r * 0.42, ancho / 2, alto * 0.48, r * 1.05);
    v.addColorStop(0, "rgba(0, 0, 0, 0)");
    v.addColorStop(1, `rgba(0, 0, 0, ${fuerza})`);
    g.fillStyle = v;
    g.fillRect(0, 0, ancho, alto);
    return l;
}

// El «sello» de luz para la oscuridad de las cuevas: un círculo que se desvanece, hecho una sola vez.
// (Antes se hacía un degradado nuevo por cada antorcha en cada cuadro; pegar este dibujo es mucho más rápido.)
let sello = null;
export function selloDeLuz() {
    if (!sello) {
        sello = lienzo(64, 64);
        const g = sello.getContext("2d");
        const d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        d.addColorStop(0, "rgba(0,0,0,1)");
        d.addColorStop(0.6, "rgba(0,0,0,0.55)");
        d.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = d;
        g.fillRect(0, 0, 64, 64);
    }
    return sello;
}
