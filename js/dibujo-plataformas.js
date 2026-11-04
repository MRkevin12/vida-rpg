// dibujo-plataformas.js — Cómo se VE «La Senda del Reino» (v185): pixel art pintado en un <canvas>.
//
// Todo se dibuja con rectángulos de un punto (fillRect), como el pixel art de verdad, en un lienzo chico (240 puntos
// de alto) que la pantalla agranda sin suavizar. Las criaturas y tu héroe son los sprites de la Torre (sprites.js),
// achicados; el terreno, los fondos y los objetos se pintan aquí.
//
//   const pintor = crearPintor(partida, imagenes);   // prepara los fondos y el terreno (una vez por nivel)
//   pintor.dibujar(g);                               // pinta un cuadro (60 veces por segundo)
//
// Para que vaya rápido: el terreno que no se mueve se pinta UNA vez en un lienzo escondido del tamaño del nivel,
// y en cada cuadro solo se copia el pedazo que se ve. Lo animado (monedas, lava, antorchas, bloques) se pinta cada vez.

import * as P from "./plataformas.js";

const { CELDA } = P;

// ===== Colores de cada mundo (oscuros y sobrios, como el resto de la app) =====
const PALETAS = {
    1: {   // Campos del Alba: amanecer violeta y rosa, pasto oscuro, piedra de ruinas
        cielo: ["#120d22", "#2a1a38", "#5a2f46", "#a3584c", "#d18a5c"],
        lejos: "#2b2140", medio: "#1d1f30", cerca: "#13151f",
        tierra: ["#3a2a21", "#2b1f19", "#4b382b"], borde: ["#6d8f3f", "#4a6b2f", "#33502a"],
        piedra: ["#827d92", "#625e74", "#46435a", "#2b2938"], ladrillo: ["#80503c", "#633d2e", "#2b1a14"],
        tabla: ["#86603c", "#634428", "#3c2a19"], oscuridad: 0, estrellas: 18,
    },
    2: {   // Minas de Cristal: roca azul oscura, cristales que brillan
        cielo: ["#05050c", "#090a16", "#0d0f20", "#11142a", "#161a33"],
        lejos: "#10122a", medio: "#161936", cerca: "#0c0d1c",
        tierra: ["#272c40", "#1c2030", "#343b55"], borde: ["#56628a", "#414b6c", "#2f3650"],
        piedra: ["#6b7290", "#4f5672", "#383e56", "#23273a"], ladrillo: ["#4d5470", "#3a4058", "#191c2a"],
        tabla: ["#6e5038", "#513a28", "#30221a"], cristal: ["#7df3f8", "#38bdd8", "#a78bfa", "#6d4fd0"],
        oscuridad: 0.62, estrellas: 0,
    },
    3: {   // Cumbres de la Tormenta: noche, nieve y hielo
        cielo: ["#060a18", "#0b1430", "#14224a", "#22366a", "#33508a"],
        lejos: "#2a3656", medio: "#1e2742", cerca: "#121a2c",
        tierra: ["#363d56", "#292f45", "#474f6c"], borde: ["#f4f7fc", "#d2dcea", "#9eaecb"],
        piedra: ["#8f9ab4", "#6c7792", "#4b5470", "#2e3448"], ladrillo: ["#9fd3ec", "#6aa9cf", "#2f5a7a"],
        tabla: ["#a9c2dc", "#7f97b4", "#4b5d78"], hielo: ["#dff6ff", "#a6dcf2", "#5fa7cf", "#356f96"],
        oscuridad: 0.22, estrellas: 60,
    },
    4: {   // Fortaleza de la Llama: piedra negra, ladrillo rojo oscuro y lava
        cielo: ["#080304", "#140606", "#220909", "#360d0a", "#561a0e"],
        lejos: "#240b0b", medio: "#170707", cerca: "#0d0404",
        tierra: ["#3b2a2b", "#2c1f21", "#4b3638"], borde: ["#6b4b48", "#553a38", "#3e2a2a"],
        piedra: ["#76656a", "#5a4b50", "#3f3438", "#261e22"], ladrillo: ["#7a3a2c", "#5c2a20", "#241010"],
        tabla: ["#5d5658", "#433d40", "#272325"], lava: ["#fde047", "#fb923c", "#ea580c", "#9a3412", "#5a1a0a"],
        oscuridad: 0.4, estrellas: 0,
    },
};

// Un número entre 0 y 1 que siempre sale igual para la misma celda (para que el terreno no «baile»).
function ruido(a, b, c = 0) {
    let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function lienzo(ancho, alto) {
    const l = document.createElement("canvas");
    l.width = Math.max(1, Math.round(ancho));
    l.height = Math.max(1, Math.round(alto));
    return l;
}

// Un punto (o un rectángulo) de color.
function px(g, x, y, ancho, alto, color) {
    g.fillStyle = color;
    g.fillRect(x, y, ancho, alto);
}


// ===== El terreno (una celda de 16 × 16) =====
// lados: qué lados de la celda dan al aire (para pintar el pasto arriba y el borde oscuro a los lados).
function pintarCelda(g, letra, x, y, c, f, mundo, lados) {
    const pal = PALETAS[mundo];
    if (letra === "#") pintarSuelo(g, x, y, c, f, mundo, pal, lados);
    else if (letra === "=" || letra === "%") pintarPiedra(g, x, y, c, f, pal, letra === "%");
    else if (letra === "I") pintarHielo(g, x, y, c, f, pal);
    else if (letra === "-") pintarTabla(g, x, y, pal, mundo);
    else if (letra === "^") pintarPinchos(g, x, y);
    else if (letra === "U") pintarUrna(g, x, y, pal);
    else if (letra === "G") pintarPivote(g, x, y);
}

function pintarSuelo(g, x, y, c, f, mundo, pal, lados) {
    const [base, oscuro, claro] = pal.tierra;
    if (mundo === 4) {
        // La fortaleza: ladrillos de piedra oscura.
        px(g, x, y, 16, 16, pal.tierra[2]);
        for (let fila = 0; fila < 4; fila++) {
            const corrido = (fila + f) % 2 ? 4 : 0;
            for (let k = -1; k < 3; k++) {
                const bx = x + k * 8 + corrido;
                const tono = ruido(c * 3 + k, f * 4 + fila) < 0.3 ? oscuro : base;
                g.save();
                g.beginPath();
                g.rect(x, y, 16, 16);
                g.clip();
                px(g, bx, y + fila * 4, 7, 3, tono);
                px(g, bx, y + fila * 4, 7, 1, claro);
                g.restore();
            }
        }
    } else {
        px(g, x, y, 16, 16, base);
        for (let i = 0; i < 7; i++) {
            const r = ruido(c, f, i);
            const a = ruido(f, c, i + 9);
            px(g, x + Math.floor(r * 15), y + Math.floor(a * 15), 2, 1, i % 3 ? oscuro : claro);
        }
        if (mundo === 2 && ruido(c, f, 40) < 0.18) {   // vetas de cristal
            const cx = x + 3 + Math.floor(ruido(c, f, 41) * 9);
            const cy = y + 5 + Math.floor(ruido(c, f, 42) * 8);
            px(g, cx, cy, 2, 2, pal.cristal[1]);
            px(g, cx, cy, 1, 1, pal.cristal[0]);
        }
    }
    if (lados.izq) px(g, x, y, 1, 16, oscuro);
    if (lados.der) px(g, x + 15, y, 1, 16, oscuro);
    if (lados.abajo) px(g, x, y + 15, 16, 1, oscuro);
    if (lados.arriba) {
        const [luz, medio, sombra] = pal.borde;
        // La capa de arriba: pasto (mundo 1), roca clara (2), nieve (3) o el borde de la muralla (4).
        px(g, x, y, 16, 3, medio);
        px(g, x, y, 16, 1, luz);
        for (let i = 0; i < 16; i++) {
            const largo = Math.floor(ruido(c * 16 + i, f, 7) * (mundo === 3 ? 4 : 3));
            if (largo) px(g, x + i, y + 3, 1, largo, mundo === 3 ? medio : sombra);
        }
        if (mundo === 1) {   // matas de pasto que asoman
            for (let i = 0; i < 3; i++) {
                const bx = x + Math.floor(ruido(c, f, 20 + i) * 15);
                px(g, bx, y - 1, 1, 1, luz);
            }
        }
        if (mundo === 3) px(g, x, y + 3, 16, 1, sombra);
    }
}

function pintarPiedra(g, x, y, c, f, pal, falsa) {
    const [luz, cara, sombra, borde] = pal.piedra;
    px(g, x, y, 16, 16, borde);
    px(g, x + 1, y + 1, 14, 14, cara);
    px(g, x + 1, y + 1, 14, 1, luz);
    px(g, x + 1, y + 1, 1, 14, luz);
    px(g, x + 1, y + 14, 14, 1, sombra);
    px(g, x + 14, y + 1, 1, 14, sombra);
    // Grietas y musgo, distintos en cada bloque.
    const r = ruido(c, f, 3);
    if (r < 0.5) {
        const gx = x + 4 + Math.floor(r * 14);
        px(g, gx, y + 4, 1, 3, sombra);
        px(g, gx + 1, y + 7, 1, 2, sombra);
    }
    if (falsa) {   // la pared falsa tiene una grieta un poco más marcada (una pista)
        px(g, x + 5, y + 3, 1, 4, borde);
        px(g, x + 6, y + 7, 1, 3, borde);
        px(g, x + 7, y + 10, 1, 2, borde);
    }
}

function pintarHielo(g, x, y, c, f, pal) {
    const [brillo, cara, sombra, borde] = pal.hielo || pal.piedra;
    px(g, x, y, 16, 16, borde);
    px(g, x + 1, y + 1, 14, 14, cara);
    px(g, x + 1, y + 1, 14, 2, brillo);
    px(g, x + 1, y + 12, 14, 2, sombra);
    for (let i = 0; i < 4; i++) px(g, x + 3 + i * 2, y + 9 - i * 2, 2, 1, brillo);   // un reflejo en diagonal
    if (ruido(c, f, 5) < 0.4) px(g, x + 10, y + 5, 3, 1, sombra);
}

function pintarTabla(g, x, y, pal, mundo) {
    const [luz, cara, sombra] = pal.tabla;
    px(g, x, y, 16, 5, sombra);
    px(g, x, y, 16, 4, cara);
    px(g, x, y, 16, 1, luz);
    if (mundo === 4) {   // una reja de hierro
        for (let i = 1; i < 16; i += 4) px(g, x + i, y + 1, 1, 3, sombra);
    } else {
        px(g, x + 7, y + 1, 1, 3, sombra);
        px(g, x + 3, y + 5, 2, 3, sombra);   // el soporte
        px(g, x + 11, y + 5, 2, 3, sombra);
    }
}

function pintarPinchos(g, x, y) {
    px(g, x, y + 13, 16, 3, "#2b2d36");
    for (let i = 0; i < 4; i++) {
        const bx = x + i * 4;
        px(g, bx + 1, y + 7, 2, 6, "#7c8596");
        px(g, bx + 1, y + 5, 1, 2, "#c5ccd8");
        px(g, bx + 2, y + 7, 1, 6, "#5a6170");
        px(g, bx + 1, y + 4, 1, 1, "#eef2f7");
    }
}

function pintarUrna(g, x, y, pal) {
    // Una urna de piedra con la boca abierta (de ahí sale la raíz).
    px(g, x + 1, y, 14, 3, "#2a1f1e");
    px(g, x, y + 1, 16, 2, "#5a4440");
    px(g, x + 2, y + 3, 12, 12, "#4a3632");
    px(g, x + 2, y + 3, 2, 12, "#634a44");
    px(g, x + 12, y + 3, 2, 12, "#33241f");
    px(g, x + 3, y + 7, 10, 1, "#2a1f1e");
    px(g, x + 1, y + 15, 14, 1, "#241a18");
}

function pintarPivote(g, x, y) {
    px(g, x, y, 16, 16, "#23252c");
    px(g, x + 1, y + 1, 14, 14, "#4b4f5c");
    px(g, x + 1, y + 1, 14, 1, "#7b8090");
    for (const [a, b] of [[3, 3], [11, 3], [3, 11], [11, 11]]) px(g, x + a, y + b, 2, 2, "#2b2d34");
}

// Las letras que se pintan en CADA cuadro (son animadas o pueden cambiar): no van en el lienzo del terreno.
const ANIMADAS = new Set(["o", "?", "!", "*", "$", "u", "B", "~", "T"]);
const SOLIDAS_PARA_BORDES = (l) => l === "#" || l === "=" || l === "%" || l === "I" || l === "B" || l === "u";

// pareceMuro(c, f) = true si esa celda es parte de un escondite sin descubrir (desde afuera se ve como pared).
function ladosDe(nivel, c, f, letra, pareceMuro = () => false) {
    const otro = (dc, df) => {
        if (pareceMuro(c + dc, f + df)) return true;
        const vecina = P.celda(nivel, c + dc, f + df);
        return letra === "#" ? vecina === "#" || vecina === "%" : SOLIDAS_PARA_BORDES(vecina);
    };
    return { arriba: f > 0 && !otro(0, -1), abajo: !otro(0, 1) && f < nivel.alto - 1, izq: !otro(-1, 0), der: !otro(1, 0) };
}


// ===== Lo que se pinta en cada cuadro =====

function pintarBloqueRunico(g, x, y, letra, reloj, mundo) {
    if (letra === "u") {   // ya usado: bronce apagado
        px(g, x, y, 16, 16, "#1f160e");
        px(g, x + 1, y + 1, 14, 14, "#4a3a28");
        px(g, x + 1, y + 1, 14, 1, "#5f4c34");
        for (const [a, b] of [[2, 2], [12, 2], [2, 12], [12, 12]]) px(g, x + a, y + b, 2, 2, "#2c2117");
        return;
    }
    // Un bloque de bronce con una runa que brilla (más fuerte y más lento cada tanto).
    px(g, x, y, 16, 16, "#2a1a08");
    px(g, x + 1, y + 1, 14, 14, "#8a6424");
    px(g, x + 1, y + 1, 14, 1, "#c08a34");
    px(g, x + 1, y + 1, 1, 14, "#b07c2c");
    px(g, x + 1, y + 14, 14, 1, "#5a3c12");
    px(g, x + 14, y + 1, 1, 14, "#5a3c12");
    for (const [a, b] of [[2, 2], [12, 2], [2, 12], [12, 12]]) px(g, x + a, y + b, 2, 2, "#4a3010");
    const brillo = 0.55 + 0.45 * Math.sin(reloj * 4 + x * 0.05);
    const runa = brillo > 0.8 ? "#fff1b8" : brillo > 0.5 ? "#fcd34d" : "#e2a530";
    // (v186) El símbolo: un destello de cuatro puntas (antes era una runa que parecía una «R» suelta).
    // Así se entiende a la primera que el bloque guarda algo y que hay que golpearlo desde abajo.
    px(g, x + 7, y + 3, 2, 10, runa);       // la punta de arriba a la de abajo
    px(g, x + 3, y + 7, 10, 2, runa);       // y la de izquierda a derecha
    px(g, x + 6, y + 6, 4, 4, runa);        // el centro, más grueso
    px(g, x + 5, y + 5, 1, 1, runa);        // chispas en las diagonales
    px(g, x + 10, y + 5, 1, 1, runa);
    px(g, x + 5, y + 10, 1, 1, runa);
    px(g, x + 10, y + 10, 1, 1, runa);
    px(g, x + 7, y + 7, 2, 2, "#fff8dc");   // el corazón del destello, siempre claro
    if (letra === "*") px(g, x + 3, y + 3, 1, 1, "#ffffff");
}

function pintarLadrillo(g, x, y, mundo) {
    const [cara, sombra, junta] = PALETAS[mundo].ladrillo;
    px(g, x, y, 16, 16, junta);
    for (let fila = 0; fila < 4; fila++) {
        const corrido = fila % 2 ? 4 : 0;
        for (let k = -1; k < 3; k++) {
            const bx = Math.max(x, x + k * 8 + corrido);
            const fin = Math.min(x + 16, x + k * 8 + corrido + 7);
            if (fin <= bx) continue;
            px(g, bx, y + fila * 4, fin - bx, 3, cara);
            px(g, bx, y + fila * 4 + 2, fin - bx, 1, sombra);
        }
    }
}

function pintarMoneda(g, x, y, reloj, semilla = 0) {
    // Gira: se ve de frente, de canto y vuelta.
    const cuadro = Math.floor(reloj * 8 + semilla) % 6;
    const ancho = [8, 6, 4, 2, 4, 6][cuadro];
    const cx = x + 8 - ancho / 2;
    px(g, cx, y + 3, ancho, 10, "#a16207");
    px(g, cx, y + 4, ancho, 8, "#f5b730");
    if (ancho > 2) {
        px(g, cx + 1, y + 4, Math.max(1, ancho - 3), 1, "#fde68a");
        px(g, cx + Math.floor(ancho / 2), y + 6, 1, 4, "#c98a12");
    }
}

function pintarLava(g, x, y, c, reloj, pal, superficie) {
    const [amarillo, naranja, rojo, oscuro] = pal.lava;
    px(g, x, y, 16, 16, rojo);
    px(g, x, y + 10, 16, 6, oscuro);
    if (superficie) {
        for (let i = 0; i < 16; i++) {
            const ola = Math.round(Math.sin((c * 16 + i) * 0.35 + reloj * 3) * 1.5);
            px(g, x + i, y + 2 + ola, 1, 3, naranja);
            px(g, x + i, y + 1 + ola, 1, 1, amarillo);
        }
    } else {
        px(g, x, y, 16, 4, naranja);
    }
    // Burbujas que suben y revientan.
    const t = (reloj * 0.8 + ruido(c, 3)) % 1;
    if (superficie && ruido(c, Math.floor(reloj * 0.8 + ruido(c, 3))) < 0.35) {
        px(g, x + 4 + Math.floor(ruido(c, 9) * 8), y + 8 - Math.floor(t * 6), 2, 2, amarillo);
    }
}

function pintarAntorcha(g, x, y, reloj, mundo) {
    if (mundo === 4) {   // en la muralla: un soporte de hierro
        px(g, x + 6, y + 8, 4, 2, "#3a3438");
        px(g, x + 7, y + 6, 2, 6, "#5a5056");
    } else {             // en el campo y las minas: un poste de madera
        px(g, x + 7, y + 6, 2, 10, "#4a3220");
        px(g, x + 7, y + 6, 1, 10, "#6a4a30");
        px(g, x + 5, y + 5, 6, 2, "#2e2a2a");
    }
    const vaiven = Math.sin(reloj * 14 + x) > 0 ? 1 : 0;
    px(g, x + 6, y + 1 + vaiven, 4, 4, "#ea580c");
    px(g, x + 7, y - 1 + vaiven, 2, 4, "#fb923c");
    px(g, x + 7, y + 2, 2, 2, "#fde68a");
}


// ===== Los fondos (tres capas que se mueven más lento que el terreno: da profundidad) =====
const ANCHO_FONDO = 512;   // cada capa se repite cada 512 puntos

function ondas(x, semilla, alturas) {
    // Una suma de ondas que «cierra» cada 512 puntos (así la capa se repite sin que se note la unión).
    let y = 0;
    for (const [veces, alto, fase] of alturas) y += Math.sin(((x / ANCHO_FONDO) * veces + fase + semilla) * Math.PI * 2) * alto;
    return y;
}

function crearFondos(mundo, alto) {
    const pal = PALETAS[mundo];
    const cielo = lienzo(1, alto);
    const gc = cielo.getContext("2d");
    const degradado = gc.createLinearGradient(0, 0, 0, alto);
    pal.cielo.forEach((color, i) => degradado.addColorStop(i / (pal.cielo.length - 1), color));
    gc.fillStyle = degradado;
    gc.fillRect(0, 0, 1, alto);

    const capas = [0.12, 0.32, 0.58].map(() => lienzo(ANCHO_FONDO, alto));
    const [lejos, medio, cerca] = capas.map((l) => l.getContext("2d"));
    const base = alto;   // las capas se apoyan abajo del todo

    if (pal.estrellas) {   // estrellas fijas en la capa más lejana
        for (let i = 0; i < pal.estrellas; i++) {
            const sx = Math.floor(ruido(i, 1) * ANCHO_FONDO);
            const sy = Math.floor(ruido(i, 2) * alto * (mundo === 3 ? 0.55 : 0.3));
            px(lejos, sx, sy, 1, 1, ruido(i, 3) < 0.2 ? "#ffffff" : "rgba(220,225,255,.55)");
        }
    }
    if (mundo === 3) {   // una aurora tenue
        for (let x = 0; x < ANCHO_FONDO; x++) {
            const y = 30 + ondas(x, 0.2, [[2, 10, 0], [5, 4, 0.3]]);
            lejos.fillStyle = "rgba(94, 234, 212, 0.10)";
            lejos.fillRect(x, y, 1, 18 + ondas(x, 0.5, [[3, 6, 0]]));
            lejos.fillStyle = "rgba(167, 139, 250, 0.07)";
            lejos.fillRect(x, y + 14, 1, 10);
        }
    }
    if (mundo === 1) {   // el sol que sale, detrás de todo
        lejos.fillStyle = "rgba(255, 200, 140, 0.16)";
        lejos.beginPath();
        lejos.arc(330, base - 70, 46, 0, Math.PI * 2);
        lejos.fill();
        lejos.fillStyle = "rgba(255, 214, 160, 0.5)";
        lejos.beginPath();
        lejos.arc(330, base - 70, 18, 0, Math.PI * 2);
        lejos.fill();
    }

    for (let x = 0; x < ANCHO_FONDO; x++) {
        // Capa lejana: montañas (o la pared de la cueva, o torres de la fortaleza).
        const yl = base - 96 + ondas(x, 0.1, [[1, 18, 0], [3, 9, 0.4], [7, 3, 0.1]]);
        px(lejos, x, yl, 1, base - yl, pal.lejos);
        if (mundo === 3 && yl < base - 104) px(lejos, x, yl, 1, 3, "#c9d4e8");
        // Capa media.
        const ym = base - 62 + ondas(x, 0.6, [[2, 12, 0], [5, 6, 0.2], [11, 2, 0.7]]);
        px(medio, x, ym, 1, base - ym, pal.medio);
        if (mundo === 3) px(medio, x, ym, 1, 2, "#8ea0c2");
        // Capa cercana.
        const yc = base - 30 + ondas(x, 0.3, [[3, 8, 0], [8, 3, 0.5]]);
        px(cerca, x, yc, 1, base - yc, pal.cerca);
    }
    if (mundo === 2) {
        // Estalactitas que cuelgan del techo de la cueva (en las tres capas, más grandes cuanto más cerca).
        for (const [g, color, cuantas, largo] of [[lejos, pal.lejos, 26, 50], [medio, pal.medio, 16, 70], [cerca, pal.cerca, 10, 40]]) {
            px(g, 0, 0, ANCHO_FONDO, 10, color);
            for (let i = 0; i < cuantas; i++) {
                const cx = Math.floor(ruido(i, 11, largo) * ANCHO_FONDO);
                const l = 14 + Math.floor(ruido(i, 12, largo) * largo);
                for (let k = 0; k < l; k++) {
                    const w = Math.max(1, Math.round((1 - k / l) * 7));
                    px(g, cx - Math.floor(w / 2), 10 + k, w, 1, color);
                }
            }
        }
        // Cristales que brillan en la capa media.
        for (let i = 0; i < 14; i++) {
            const cx = Math.floor(ruido(i, 31) * ANCHO_FONDO);
            const cy = base - 60 + Math.floor(ruido(i, 32) * 40);
            const color = ruido(i, 33) < 0.5 ? pal.cristal[1] : pal.cristal[3];
            for (let k = 0; k < 7; k++) px(medio, cx - Math.floor(k / 3), cy - k, 1, 1, color);
            px(medio, cx, cy - 7, 1, 2, ruido(i, 34) < 0.5 ? pal.cristal[0] : pal.cristal[2]);
            px(medio, cx + 2, cy - 4, 1, 4, color);
        }
    }
    if (mundo === 1) {
        // Pinos oscuros en la capa media y ruinas (arcos rotos) en la cercana.
        for (let i = 0; i < 22; i++) {
            const cx = Math.floor(ruido(i, 51) * ANCHO_FONDO);
            const pie = base - 54 + ondas(cx, 0.6, [[2, 12, 0], [5, 6, 0.2], [11, 2, 0.7]]);
            const alto2 = 18 + Math.floor(ruido(i, 52) * 16);
            for (let k = 0; k < alto2; k++) {
                const w = Math.max(1, Math.round(((k % 6) + 2) * (k / alto2) * 1.3));
                px(medio, cx - Math.floor(w / 2), pie - alto2 + k, w, 1, pal.medio);
            }
        }
        for (let i = 0; i < 4; i++) {
            const cx = 40 + i * 128 + Math.floor(ruido(i, 61) * 50);
            const pie = base - 26;
            px(cerca, cx, pie - 40, 6, 40, pal.cerca);
            px(cerca, cx + 26, pie - 30, 6, 30, pal.cerca);
            for (let k = 0; k < 20; k++) px(cerca, cx + 3 + k, pie - 40 - Math.round(Math.sin((k / 26) * Math.PI) * 8), 1, 4, pal.cerca);
        }
    }
    if (mundo === 3) {
        // Pinos nevados cerca.
        for (let i = 0; i < 16; i++) {
            const cx = Math.floor(ruido(i, 71) * ANCHO_FONDO);
            const pie = base - 26;
            const alto2 = 16 + Math.floor(ruido(i, 72) * 12);
            for (let k = 0; k < alto2; k++) {
                const w = Math.max(1, Math.round(((k % 5) + 2) * (k / alto2) * 1.4));
                px(cerca, cx - Math.floor(w / 2), pie - alto2 + k, w, 1, pal.cerca);
                if (k % 5 === 0) px(cerca, cx - Math.floor(w / 2), pie - alto2 + k, w, 1, "#3a4766");
            }
        }
    }
    if (mundo === 4) {
        // Torres de la fortaleza con ventanas encendidas (capa media) y cadenas que cuelgan (capa cercana).
        for (let i = 0; i < 6; i++) {
            const cx = 20 + i * 85 + Math.floor(ruido(i, 81) * 30);
            const ancho = 22 + Math.floor(ruido(i, 82) * 14);
            const alto2 = 80 + Math.floor(ruido(i, 83) * 60);
            px(medio, cx, base - alto2, ancho, alto2, pal.medio);
            for (let k = 0; k < ancho; k += 6) px(medio, cx + k, base - alto2 - 5, 4, 5, pal.medio);
            for (let k = 0; k < 3; k++) {
                if (ruido(i, 84 + k) < 0.6) px(medio, cx + 6 + Math.floor(ruido(i, 90 + k) * (ancho - 12)), base - alto2 + 16 + k * 22, 3, 5, "#b45309");
            }
        }
        for (let i = 0; i < 7; i++) {
            const cx = Math.floor(ruido(i, 101) * ANCHO_FONDO);
            const largo = 40 + Math.floor(ruido(i, 102) * 90);
            for (let k = 0; k < largo; k += 4) {
                px(cerca, cx, k, 2, 3, "#1f0d0b");
                px(cerca, cx + (k % 8 ? 1 : -1), k + 2, 2, 2, "#2a1210");
            }
        }
        // El resplandor rojo de la lava, abajo.
        const brillo = lejos.createLinearGradient(0, base - 70, 0, base);
        brillo.addColorStop(0, "rgba(234, 88, 12, 0)");
        brillo.addColorStop(1, "rgba(234, 88, 12, 0.28)");
        lejos.fillStyle = brillo;
        lejos.fillRect(0, base - 70, ANCHO_FONDO, 70);
    }
    return { cielo, capas };
}


// ===== Sprites hechos a mano para lo que no es una criatura =====

function pintarPocion(g, x, y, reloj) {
    px(g, x + 4, y, 4, 2, "#6b4a2e");          // el corcho
    px(g, x + 4, y + 2, 4, 2, "#a8b4c4");      // el cuello de vidrio
    px(g, x + 1, y + 4, 10, 8, "#7f1d1d");
    px(g, x + 2, y + 5, 8, 6, "#dc2626");
    px(g, x + 3, y + 6, 2, 2, "#fca5a5");
    if (Math.sin(reloj * 6) > 0) px(g, x + 7, y + 8, 1, 1, "#fecaca");
}

function pintarBrasa(g, x, y, reloj) {
    // Una brasa rúnica en un pequeño brasero de hierro.
    px(g, x + 2, y + 9, 8, 3, "#3a3438");
    px(g, x + 1, y + 8, 10, 1, "#5a5056");
    const v = Math.sin(reloj * 12) > 0 ? 1 : 0;
    px(g, x + 3, y + 3 + v, 6, 5, "#ea580c");
    px(g, x + 4, y + 1 + v, 4, 5, "#fb923c");
    px(g, x + 5, y + 3, 2, 3, "#fde68a");
}

function pintarEstrella(g, x, y, reloj) {
    // La Bendición de la Llama: una chispa de cuatro puntas, blanca y dorada.
    const c = Math.floor(reloj * 10) % 2 ? "#fde68a" : "#ffffff";
    px(g, x + 5, y, 2, 12, c);
    px(g, x, y + 5, 12, 2, c);
    px(g, x + 3, y + 3, 6, 6, "#fbbf24");
    px(g, x + 4, y + 4, 4, 4, "#fff7d6");
}

function pintarAmuleto(g, x, y) {
    px(g, x + 3, y, 6, 2, "#c08a34");
    px(g, x + 1, y + 2, 10, 8, "#c08a34");
    px(g, x + 2, y + 3, 8, 6, "#9f1239");
    px(g, x + 3, y + 4, 3, 2, "#fb7185");
    px(g, x + 4, y + 10, 4, 2, "#c08a34");
}

function pintarReliquia(g, x, y, reloj) {
    // Una piedra rúnica de ámbar que flota y late.
    const flota = Math.round(Math.sin(reloj * 2.6 + x) * 2);
    const yy = y + flota;
    g.fillStyle = "rgba(251, 191, 36, 0.18)";
    g.fillRect(x - 2, yy - 2, 16, 18);
    px(g, x + 4, yy, 4, 1, "#7c4a03");
    px(g, x + 2, yy + 1, 8, 2, "#b45309");
    px(g, x + 1, yy + 3, 10, 7, "#d97706");
    px(g, x + 2, yy + 10, 8, 2, "#b45309");
    px(g, x + 4, yy + 12, 4, 1, "#7c4a03");
    px(g, x + 2, yy + 3, 3, 3, "#fde68a");
    const runa = Math.sin(reloj * 5) > 0 ? "#fff7d6" : "#fcd34d";
    px(g, x + 6, yy + 4, 1, 5, runa);
    px(g, x + 5, yy + 6, 3, 1, runa);
}

function pintarCofre(g, x, y, abierto) {
    px(g, x, y + 4, 14, 8, "#5a3a22");
    px(g, x, y + 4, 14, 1, "#7a5232");
    px(g, x, y + 11, 14, 1, "#2e1d10");
    px(g, x + 3, y + 4, 1, 8, "#8a8f9c");
    px(g, x + 10, y + 4, 1, 8, "#8a8f9c");
    if (abierto) {
        px(g, x, y, 14, 3, "#3a2414");
        px(g, x + 2, y + 4, 10, 2, "#1a1008");
    } else {
        px(g, x, y, 14, 5, "#6a4428");
        px(g, x, y, 14, 1, "#8a5e36");
        px(g, x + 6, y + 4, 2, 3, "#fbbf24");
    }
}

function pintarControl(g, x, y, activo, reloj) {
    // Un estandarte en un asta: gris y caído hasta que lo tocas; rojo y con su emblema después.
    px(g, x + 3, y + 2, 2, 46, "#5a4632");
    px(g, x + 3, y + 2, 1, 46, "#7a6044");
    px(g, x + 2, y, 4, 3, activo ? "#fbbf24" : "#6b6b78");
    if (activo) {
        const v = Math.round(Math.sin(reloj * 5) * 1);
        px(g, x + 5, y + 4, 9 + v, 13, "#9f1239");
        px(g, x + 5, y + 4, 9 + v, 1, "#e11d48");
        px(g, x + 8, y + 8, 3, 4, "#fbbf24");
        px(g, x + 5, y + 17, 3, 2, "#9f1239");
        px(g, x + 11 + v, y + 17, 3, 2, "#9f1239");
    } else {
        px(g, x + 5, y + 14, 5, 12, "#4b4b56");
        px(g, x + 5, y + 14, 5, 1, "#6b6b78");
    }
}

function pintarArco(g, x, y, abierto, reloj) {
    // El Arco de la Llama: dos pilares y un arco de piedra; adentro, el fuego que te lleva al siguiente nivel.
    const piedra = "#6a6578";
    const sombra = "#3c394a";
    px(g, x - 8, y + 6, 6, 42, sombra);
    px(g, x - 8, y + 6, 4, 42, piedra);
    px(g, x + 18, y + 6, 6, 42, sombra);
    px(g, x + 18, y + 6, 4, 42, piedra);
    for (let k = 0; k < 32; k++) {
        const altura = Math.round(Math.sin((k / 31) * Math.PI) * 8);
        px(g, x - 8 + k, y + 6 - altura, 1, 5, k % 7 ? piedra : sombra);
    }
    px(g, x + 6, y - 6, 4, 4, "#fbbf24");   // la gema de la clave
    if (abierto) {
        for (let k = 0; k < 6; k++) {
            const v = Math.sin(reloj * 8 + k) > 0 ? 1 : 0;
            g.fillStyle = ["rgba(251,146,60,.55)", "rgba(253,224,71,.5)", "rgba(234,88,12,.45)"][k % 3];
            g.fillRect(x - 2 + k * 3, y + 14 - (k % 3) * 3 - v, 3, 34 + (k % 3) * 3 + v);
        }
        px(g, x + 4, y + 26, 8, 22, "rgba(255, 247, 214, 0.55)");
    } else {
        for (let k = 0; k < 4; k++) px(g, x - 2 + k * 6, y + 10, 2, 38, "#2b2a33");   // barrotes: sellado
        px(g, x - 2, y + 24, 22, 2, "#2b2a33");
    }
}

function pintarPlataforma(g, x, y, ancho, mundo, tiembla) {
    const pal = PALETAS[mundo];
    const [luz, cara, sombra] = mundo === 3 ? pal.tabla : pal.piedra;
    const dx = tiembla ? (Math.random() < 0.5 ? -1 : 1) : 0;
    px(g, x + dx, y, ancho, 8, sombra);
    px(g, x + dx, y, ancho, 6, cara);
    px(g, x + dx, y, ancho, 1, luz);
    for (let i = 8; i < ancho; i += 16) px(g, x + dx + i, y + 1, 1, 5, sombra);
    if (tiembla !== undefined) {   // la que se derrumba tiene grietas
        px(g, x + dx + 5, y + 2, 2, 1, "#1a1820");
        px(g, x + dx + ancho - 9, y + 3, 3, 1, "#1a1820");
    }
}

function pintarMazo(g, x, y) {
    // Un bloque de piedra atado con hierro, con púas abajo.
    px(g, x, y, 30, 26, "#2a2733");
    px(g, x + 1, y + 1, 28, 24, "#5f5a6e");
    px(g, x + 1, y + 1, 28, 2, "#8a8598");
    px(g, x + 1, y + 22, 28, 3, "#3e3a4a");
    px(g, x, y + 7, 30, 3, "#4b4f5c");
    px(g, x, y + 17, 30, 3, "#4b4f5c");
    for (const bx of [3, 25]) for (const by of [8, 18]) px(g, x + bx, y + by, 2, 1, "#9aa0ae");
    px(g, x + 9, y + 11, 4, 3, "#1a1820");   // ojos tallados, serios
    px(g, x + 17, y + 11, 4, 3, "#1a1820");
    px(g, x + 10, y + 12, 2, 1, "#b91c1c");
    px(g, x + 18, y + 12, 2, 1, "#b91c1c");
    for (let i = 0; i < 5; i++) {
        px(g, x + 2 + i * 6, y + 26, 4, 2, "#7c8596");
        px(g, x + 3 + i * 6, y + 28, 2, 2, "#c5ccd8");
    }
}

// Letras de 3 × 5 puntos para los números que suben («100», «+1♥»).
const LETRAS_PIXEL = {
    0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"],
    3: ["111", "001", "011", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
    6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"],
    9: ["111", "101", "111", "001", "111"], "+": ["000", "010", "111", "010", "000"], "♥": ["10100", "11110", "11110", "01100", "00100"],
};

function textoPixel(g, texto, x, y, color) {
    const letras = [...texto].map((l) => LETRAS_PIXEL[l]).filter(Boolean);
    const ancho = letras.reduce((s, l) => s + l[0].length + 1, -1);
    let cx = Math.round(x - ancho / 2);
    for (const letra of letras) {
        for (const [f, fila] of letra.entries()) {
            for (const [c, punto] of [...fila].entries()) {
                if (punto !== "1") continue;
                px(g, cx + c + 1, y + f + 1, 1, 1, "#140c22");   // sombra
                px(g, cx + c, y + f, 1, 1, color);
            }
        }
        cx += letra[0].length + 1;
    }
}


// ===== Siluetas: el contorno de color de tu héroe (armadura, fuego, bendición) y el destello blanco de los golpes =====
function silueta(imagen, color) {
    if (!imagen) return null;
    const l = lienzo(imagen.width, imagen.height);
    const g = l.getContext("2d");
    g.drawImage(imagen, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, l.width, l.height);
    return l;
}

// Un borde de 1 punto alrededor del dibujo (para la armadura y el fuego).
function contorno(imagen, color) {
    const s = silueta(imagen, color);
    if (!s) return null;
    const l = lienzo(imagen.width + 2, imagen.height + 2);
    const g = l.getContext("2d");
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(s, dx, dy);
    g.globalCompositeOperation = "destination-out";
    g.drawImage(imagen, 1, 1);
    return l;
}


// ===== El pintor =====
// imagenes = { heroe, enemigos: { esqueleto: Image, … }, jefe } (todas pueden faltar: se pinta un rectángulo).
export function crearPintor(partida, imagenes = {}) {
    const n = partida.nivel;
    const mundo = partida.mundo;
    const pal = PALETAS[mundo];
    const altoVista = partida.vista.alto;
    const fondos = crearFondos(mundo, altoVista);

    // Los escondites: hasta que entras, se ven como la pared que los rodea (y no se ve lo que hay adentro).
    const oculta = (c, f) => {
        const numero = n.escondite[`${c},${f}`];
        return numero !== undefined && !partida.descubiertos.has(numero);
    };
    const disfrazDe = (c, f) => {
        for (const [dc, df] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [0, -2]]) {
            const letra = P.celda(n, c + dc, f + df);
            if ((letra === "#" || letra === "=" || letra === "I") && n.escondite[`${c + dc},${f + df}`] === undefined) return letra === "I" ? "=" : letra;
        }
        return "#";
    };

    // El terreno quieto, pintado una vez.
    const terreno = lienzo(n.ancho * CELDA, n.alto * CELDA);
    const gt = terreno.getContext("2d");
    const pintarEn = (c, f) => {
        if (c < 0 || f < 0 || c >= n.ancho || f >= n.alto) return;
        const x = c * CELDA;
        const y = f * CELDA;
        gt.clearRect(x, y, CELDA, CELDA);
        const letra = P.celda(n, c, f);
        if (n.escondite[`${c},${f}`] !== undefined) {
            pintarCelda(gt, disfrazDe(c, f), x, y, c, f, mundo, { arriba: false, abajo: false, izq: false, der: false });
            if (oculta(c, f)) {
                if (letra === "%") { px(gt, x + 6, y + 4, 1, 4, "rgba(0,0,0,.35)"); px(gt, x + 7, y + 8, 1, 3, "rgba(0,0,0,.35)"); }   // una grieta (la pista)
            } else {
                gt.fillStyle = "rgba(4, 3, 10, 0.62)";   // descubierto: la pared del fondo del cuarto, en sombra
                gt.fillRect(x, y, CELDA, CELDA);
            }
            return;
        }
        if (letra === "." || letra === "+" || ANIMADAS.has(letra)) return;
        pintarCelda(gt, letra, x, y, c, f, mundo, ladosDe(n, c, f, letra, oculta));
    };
    for (let f = 0; f < n.alto; f++) for (let c = 0; c < n.ancho; c++) pintarEn(c, f);

    const heroe = imagenes.heroe || null;
    const brillos = {
        armadura: contorno(heroe, "#cbd5e1"),
        fuego: contorno(heroe, "#fb923c"),
        bendicion: contorno(heroe, "#fde68a"),
        blanco: silueta(heroe, "#ffffff"),
    };
    const jefeImagen = imagenes.jefe || null;
    const jefeBlanco = silueta(jefeImagen, "#ffffff");
    const sombra = lienzo(8, 8);   // la capa de oscuridad (cuevas y fortaleza); se ajusta al tamaño de la vista

    function dibujar(g) {
        const ancho = partida.vista.ancho;
        const alto = partida.vista.alto;
        const reloj = partida.reloj;
        // Cuando el jefe aterriza o algo explota, la pantalla tiembla un poco.
        const temblor = partida.temblor > 0 ? Math.round((Math.random() - 0.5) * 4 * Math.min(1, partida.temblor * 4)) : 0;
        const camX = Math.round(partida.camara.x) + temblor;
        const camY = Math.round(partida.camara.y);
        g.imageSmoothingEnabled = false;

        // 1. El cielo y las capas del fondo.
        g.drawImage(fondos.cielo, 0, 0, ancho, alto);
        [0.12, 0.32, 0.58].forEach((factor, i) => {
            const capa = fondos.capas[i];
            const desde = -(((camX * factor) % ANCHO_FONDO) + ANCHO_FONDO) % ANCHO_FONDO;
            for (let x = desde; x < ancho; x += ANCHO_FONDO) g.drawImage(capa, Math.round(x), alto - capa.height);
        });

        // 2. Lo que cambió en el terreno (una puerta que se cierra…) se vuelve a pintar.
        for (const { c, f } of partida.cambios) {
            for (const [dc, df] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) pintarEn(c + dc, f + df);
        }
        partida.cambios = [];
        g.drawImage(terreno, camX, camY, ancho, alto, 0, 0, ancho, alto);

        // 3. Las celdas animadas que se ven.
        const c0 = Math.max(0, Math.floor(camX / CELDA));
        const c1 = Math.min(n.ancho - 1, Math.floor((camX + ancho) / CELDA));
        const golpe = new Map(partida.golpeados.map((b) => [`${b.c},${b.f}`, b]));
        for (let f = 0; f < n.alto; f++) {
            for (let c = c0; c <= c1; c++) {
                const letra = P.celda(n, c, f);
                if (!ANIMADAS.has(letra) || oculta(c, f)) continue;
                const b = golpe.get(`${c},${f}`);
                const salto = b ? -Math.round(Math.sin((1 - b.t / 0.2) * Math.PI) * 4) : 0;
                const x = c * CELDA - camX;
                const y = f * CELDA - camY + salto;
                if (letra === "o") pintarMoneda(g, x, y, reloj, c * 0.7);
                else if (letra === "B") pintarLadrillo(g, x, y, mundo);
                else if (letra === "~") pintarLava(g, x, y, c, reloj, pal, P.celda(n, c, f - 1) !== "~");
                else if (letra === "T") pintarAntorcha(g, x, y, reloj, mundo);
                else pintarBloqueRunico(g, x, y, letra, reloj, mundo);
            }
        }

        // 4. Las cosas del nivel: plataformas, cofres, estandartes, reliquias y el Arco.
        for (const p of partida.plataformas) pintarPlataforma(g, Math.round(p.x - camX), Math.round(p.y - camY), p.ancho, mundo);
        for (const d of partida.derrumbes) {
            if (d.estado !== "ido") pintarPlataforma(g, Math.round(d.x - camX), Math.round(d.y - camY), d.ancho, mundo, d.estado === "tiembla");
        }
        for (const k of partida.cofres) {
            if (!oculta(Math.floor(k.x / CELDA), Math.floor(k.y / CELDA))) pintarCofre(g, Math.round(k.x - camX), Math.round(k.y - camY), k.abierto);
        }
        for (const k of partida.controles) pintarControl(g, k.c * CELDA - camX + 4, (k.f - 2) * CELDA - camY, k.activo, reloj);
        for (const r of n.reliquias) if (!partida.reliquias.has(r.i) && !oculta(r.c, r.f)) pintarReliquia(g, r.c * CELDA - camX + 2, r.f * CELDA - camY + 1, reloj);
        if (n.meta) pintarArco(g, n.meta.c * CELDA - camX, (n.meta.f - 2) * CELDA - camY, partida.metaAbierta, reloj);

        // 5. Objetos, enemigos, el jefe y los disparos.
        for (const o of partida.objetos) {
            const x = Math.round(o.x - camX);
            const y = Math.round(o.y - camY);
            if (o.saliendo > 0) {   // mientras sale del bloque, solo se ve lo que asoma por encima
                g.save();
                g.beginPath();
                g.rect(x - 2, -10, 16, Math.round(o.base - camY) + 10);
                g.clip();
            }
            if (o.tipo === "pocion") pintarPocion(g, x, y, reloj);
            else if (o.tipo === "brasa") pintarBrasa(g, x, y, reloj);
            else if (o.tipo === "bendicion") pintarEstrella(g, x, y, reloj);
            else pintarAmuleto(g, x, y);
            if (o.saliendo > 0) g.restore();
        }
        for (const e of partida.enemigos) pintarEnemigo(g, e, camX, camY, reloj);
        for (const k of partida.cadenas) {
            for (let i = 1; i <= k.eslabones; i++) {
                const x = Math.round(k.cx + Math.cos(k.angulo) * i * 10 - camX);
                const y = Math.round(k.cy + Math.sin(k.angulo) * i * 10 - camY);
                px(g, x - 3, y - 3, 6, 6, "#ea580c");
                px(g, x - 2, y - 2, 4, 4, "#fb923c");
                px(g, x - 1, y - 1, 2, 2, "#fde68a");
            }
        }
        if (partida.jefe) pintarJefe(g, partida.jefe, camX, camY, reloj);
        for (const p of partida.proyectiles) pintarProyectil(g, p, camX, camY, reloj, alto);
        for (const b of partida.disparos) {
            const x = Math.round(b.x - camX);
            const y = Math.round(b.y - camY);
            const giro = Math.floor(reloj * 16) % 2;
            px(g, x, y + giro, 6, 6 - giro, "#ea580c");
            px(g, x + 1, y + 1, 4, 4, "#fb923c");
            px(g, x + 2, y + 2, 2, 2, "#fde68a");
        }

        // 6. Tu héroe.
        pintarHeroe(g, camX, camY, reloj);

        // 7. Partículas y números que suben.
        for (const p of partida.particulas) pintarParticula(g, p, camX, camY, reloj);
        for (const t of partida.textos) textoPixel(g, t.texto, t.x - camX, Math.round(t.y - camY), t.color);

        // 8. La oscuridad de las cuevas y la fortaleza, con luz alrededor del héroe, antorchas, lava y fuego.
        if (pal.oscuridad) pintarOscuridad(g, camX, camY, ancho, alto, c0, c1);
    }

    function pintarHeroe(g, camX, camY, reloj) {
        const h = partida.heroe;
        if (partida.fase === "fin") return;
        if (h.inmune > 0 && partida.fase === "jugando" && Math.floor(reloj * 14) % 2) return;   // parpadea
        const ancho = heroe ? heroe.width : 22;
        const alto = heroe ? heroe.height : 30;
        // El dibujo es más grande que la caja de choques: se centra y se apoya en los pies.
        const x = Math.round(h.x + h.ancho / 2 - ancho / 2 - camX);
        let y = Math.round(h.y + h.alto - alto + 1 - camY);
        const aplasta = h.aterrizaje > 0 ? 1 : 0;   // al aterrizar se agacha un punto
        const mirando = h.mira;   // tu héroe (de la Torre) mira a la izquierda: a la derecha se da vuelta
        g.save();
        g.translate(x + ancho / 2, 0);
        if (mirando > 0) g.scale(-1, 1);
        g.translate(-ancho / 2, 0);
        const poder = h.bendicion > 0 ? "bendicion" : h.poder;
        const brillo = brillos[poder];
        if (brillo && partida.fase !== "muriendo") {
            if (poder === "bendicion") g.globalAlpha = 0.6 + 0.4 * Math.sin(reloj * 20);
            g.drawImage(brillo, -1, y - 1 + aplasta);
            g.globalAlpha = 1;
        }
        if (heroe) {
            // Al caminar, las piernas se alternan: la mitad izquierda y la derecha de las piernas suben un punto por turno.
            const piernas = Math.round(alto * 0.27);
            const cuerpo = alto - piernas;
            const paso = h.enSuelo && Math.abs(h.vx) > 8 ? Math.floor(h.andar / 7) % 2 : -1;
            const balanceo = paso === 1 ? 1 : 0;
            g.drawImage(heroe, 0, 0, ancho, cuerpo, 0, y + aplasta + balanceo, ancho, cuerpo - aplasta);
            const mitad = Math.floor(ancho / 2);
            const enAire = !h.enSuelo && partida.fase === "jugando";
            const arribaIzq = paso === 0 || enAire ? 1 : 0;
            const arribaDer = paso === 1 ? 1 : 0;
            g.drawImage(heroe, 0, cuerpo, mitad, piernas, 0, y + cuerpo - arribaIzq, mitad, piernas);
            g.drawImage(heroe, mitad, cuerpo, ancho - mitad, piernas, mitad, y + cuerpo - arribaDer, ancho - mitad, piernas);
            if (h.cambio > 0 && Math.floor(reloj * 20) % 2 && brillos.blanco) g.drawImage(brillos.blanco, 0, y);
        } else {
            px(g, 6, y + 4, 10, 26, "#c4b5fd");
        }
        if (h.lanzando > 0) {   // el destello de la mano al lanzar fuego
            px(g, 0, y + 12, 3, 3, "#fde68a");
        }
        g.restore();
    }

    function pintarEnemigo(g, e, camX, camY, reloj) {
        if (!e.activo && !e.vivo) return;
        if (!e.vivo && e.estado === "aplastado" && e.t > 0.45) return;
        if (e.conducta === "mazo") {
            if (e.vivo) pintarMazo(g, Math.round(e.x - camX), Math.round(e.y - camY));
            return;
        }
        const imagen = imagenes.enemigos?.[e.def.id] || null;
        const lado = e.def.dibujo;
        let ancho = lado;
        let alto = lado;
        let x = e.x + e.ancho / 2 - lado / 2;
        let y = e.y + e.alto - lado;   // los pies del dibujo, en los pies de la caja
        let voltear = e.mira < 0;      // las criaturas de la Torre miran a la derecha
        let alReves = false;
        if (e.conducta === "trampa") {
            // La raíz asoma de la urna: solo se ve lo que ya salió.
            if (e.salida <= 0.02) return;
            y = e.y + e.def.alto - lado * e.salida - 2;
            g.save();
            g.beginPath();
            g.rect(Math.round(x - camX) - 2, -40, lado + 4, Math.round(e.y + e.def.alto - camY) + 40);
            g.clip();
        }
        if (e.conducta === "volador") alto = Math.round(lado * (Math.sin(reloj * 14 + e.x) > 0 ? 1 : 0.82));   // aleteo
        if (e.conducta === "caparazon" && e.estado !== "normal") {   // escondido en su caparazón
            alto = Math.round(lado * 0.62);
            y = e.y + e.alto - alto;
            if (e.estado === "rueda") voltear = Math.floor(reloj * 14) % 2 === 0;
        }
        if (e.conducta === "saltador" && e.enSuelo && e.espera < 0.25) { alto = Math.round(lado * 0.8); ancho = Math.round(lado * 1.12); x -= (ancho - lado) / 2; y = e.y + e.alto - alto; }
        if (!e.vivo && e.estado === "aplastado") { alto = Math.round(lado * 0.4); y = e.y + e.alto - alto; }
        if (!e.vivo && e.estado === "cae") alReves = true;
        if (e.conducta === "arana") {
            px(g, Math.round(e.x + e.ancho / 2 - camX), Math.round(e.origen.y - 6 - camY), 1, Math.round(e.y - e.origen.y + 8), "rgba(220,220,235,.55)");
        }
        if (e.conducta === "torreta" && e.t < 0.2 && e.vivo) {   // el destello del disparo
            g.fillStyle = e.def.disparo === "esquirla" ? "rgba(186,230,253,.5)" : "rgba(251,146,60,.5)";
            g.fillRect(Math.round(x - camX) - 2, Math.round(y - camY) - 2, lado + 4, lado + 4);
        }
        if (e.conducta === "ascua" && e.estado === "espera") return;
        const sx = Math.round(x - camX);
        const sy = Math.round(y - camY);
        g.save();
        g.translate(sx + ancho / 2, sy + alto / 2);
        g.scale(voltear ? -1 : 1, alReves ? -1 : 1);
        if (imagen) g.drawImage(imagen, -ancho / 2, -alto / 2, ancho, alto);
        else px(g, -ancho / 2, -alto / 2, ancho, alto, "#7c3aed");
        g.restore();
        if (e.conducta === "trampa") g.restore();
    }

    function pintarJefe(g, j, camX, camY, reloj) {
        if (j.vencido && j.t > 1.6) return;
        const lado = j.def.dibujo;
        const x = Math.round(j.x + j.ancho / 2 - lado / 2 - camX);
        const y = Math.round(j.y + j.alto - lado - camY + (j.especie === "dragon" ? 10 : 2));
        g.save();
        g.translate(x + lado / 2, 0);
        if (j.mira < 0) g.scale(-1, 1);
        g.translate(-lado / 2, 0);
        if (j.vencido) g.globalAlpha = Math.max(0, 1 - j.t / 1.6);
        else if (j.inmune > 0 && Math.floor(reloj * 16) % 2) g.globalAlpha = 0.4;
        if (jefeImagen) g.drawImage(jefeImagen, 0, y, lado, lado);
        else px(g, 0, y, lado, lado, "#9f1239");
        // Antes de embestir (o al herirlo) destella en blanco.
        const destella = (j.estado === "aviso" && Math.floor(reloj * 12) % 2) || (j.inmune > 0.8);
        if (destella && jefeBlanco) { g.globalAlpha = 0.7; g.drawImage(jefeBlanco, 0, y, lado, lado); }
        g.restore();
        if (j.vulnerable && !j.vencido) {
            // Aturdido o cansado: estrellitas que giran sobre su cabeza (¡ahora puedes pisarlo!).
            for (let i = 0; i < 3; i++) {
                const a = reloj * 4 + (i * Math.PI * 2) / 3;
                const sx = Math.round(j.x + j.ancho / 2 + Math.cos(a) * 12 - camX);
                const sy = Math.round(j.y - 6 + Math.sin(a) * 3 - camY);
                px(g, sx - 1, sy, 3, 1, "#fde68a");
                px(g, sx, sy - 1, 1, 3, "#fde68a");
            }
        }
        if (j.vencido) {
            for (let i = 0; i < 2; i++) {
                const ex = Math.round(j.x + Math.random() * j.ancho - camX);
                const ey = Math.round(j.y + Math.random() * j.alto - camY);
                px(g, ex, ey, 3, 3, Math.random() < 0.5 ? "#fde68a" : "#fb923c");
            }
        }
    }

    function pintarProyectil(g, p, camX, camY, reloj, alto) {
        const x = Math.round(p.x - camX);
        const y = Math.round(p.y - camY);
        if (p.tipo === "bola") {
            px(g, x, y, 8, 8, "#9a3412");
            px(g, x + 1, y + 1, 6, 6, "#ea580c");
            px(g, x + 2, y + 2, 4, 4, "#fbbf24");
            px(g, x - Math.sign(p.vx || 1) * 3 + 2, y + 3, 3, 2, "rgba(251,146,60,.6)");
        } else if (p.tipo === "esquirla") {
            px(g, x + 1, y, 4, 6, "#7dd3fc");
            px(g, x, y + 2, 6, 2, "#bae6fd");
            px(g, x + 2, y + 1, 1, 3, "#ffffff");
        } else if (p.tipo === "roca") {
            px(g, x, y + 1, 10, 8, "#3a3644");
            px(g, x + 1, y, 8, 10, "#5f5a6e");
            px(g, x + 2, y + 1, 3, 2, "#8a8598");
        } else if (p.tipo === "onda") {
            for (let i = 0; i < 3; i++) {
                const h = 4 + ((i + Math.floor(reloj * 12)) % 3) * 3;
                px(g, x + i * 4, y + 12 - h, 3, h, i === 1 ? "#c4b5a0" : "#8a7c68");
            }
        } else if (p.tipo === "rayo") {
            if (p.aviso > 0) {   // el aviso: una marca que parpadea en el suelo
                if (Math.floor(reloj * 10) % 2) {
                    px(g, x - 2, y + p.alto - 3, 12, 3, "rgba(253, 224, 71, 0.85)");
                    for (let k = 0; k < p.alto; k += 12) px(g, x + 3, y + k, 2, 4, "rgba(253, 224, 71, 0.25)");
                }
            } else {
                px(g, x, y, 8, p.alto, "rgba(191, 219, 254, 0.55)");
                for (let k = 0; k < p.alto; k += 6) {
                    const zig = Math.floor(ruido(k, Math.floor(reloj * 20)) * 5) - 2;
                    px(g, x + 3 + zig, y + k, 2, 6, "#ffffff");
                }
            }
        } else if (p.tipo === "pilar") {
            if (p.aviso > 0) {
                if (Math.floor(reloj * 10) % 2) px(g, x - 1, y + p.alto - 3, 14, 3, "rgba(251, 146, 60, 0.9)");
            } else {
                for (let k = 0; k < p.alto; k += 4) {
                    const w = 12 - (Math.floor(reloj * 18 + k) % 3);   // las llamas tiemblan
                    px(g, x + (12 - w) / 2, y + p.alto - k - 4, w, 4, k < 16 ? "#fde047" : k < 40 ? "#fb923c" : "#ea580c");
                }
            }
        }
    }

    function pintarParticula(g, p, camX, camY, reloj) {
        const x = Math.round(p.x - camX);
        const y = Math.round(p.y - camY);
        if (p.tipo === "moneda") pintarMoneda(g, x - 4, y - 4, reloj * 3);
        else if (p.tipo === "escombro") {
            const [cara, sombra] = PALETAS[p.mundo || mundo].ladrillo;
            px(g, x, y, 5, 4, sombra);
            px(g, x, y, 4, 3, cara);
        } else if (p.tipo === "hueso") {
            px(g, x, y, 5, 2, "#e7e2d4");
            px(g, x - 1, y - 1, 2, 2, "#e7e2d4");
            px(g, x + 4, y + 1, 2, 2, "#e7e2d4");
        } else if (p.tipo === "polvo") {
            g.fillStyle = `rgba(200, 190, 170, ${Math.max(0, p.vida) * 0.9})`;
            g.fillRect(x - 3, y - 3, 6, 6);
        } else {   // chispa, brillo
            px(g, x, y, 2, 2, p.color || "#fde68a");
        }
    }

    function pintarOscuridad(g, camX, camY, ancho, alto, c0, c1) {
        if (sombra.width !== ancho || sombra.height !== alto) { sombra.width = ancho; sombra.height = alto; }
        const s = sombra.getContext("2d");
        s.globalCompositeOperation = "source-over";
        s.clearRect(0, 0, ancho, alto);
        s.fillStyle = `rgba(4, 3, 10, ${pal.oscuridad})`;
        s.fillRect(0, 0, ancho, alto);
        s.globalCompositeOperation = "destination-out";
        const luz = (x, y, radio, fuerza = 1) => {
            const d = s.createRadialGradient(x, y, 0, x, y, radio);
            d.addColorStop(0, `rgba(0,0,0,${fuerza})`);
            d.addColorStop(0.6, `rgba(0,0,0,${fuerza * 0.55})`);
            d.addColorStop(1, "rgba(0,0,0,0)");
            s.fillStyle = d;
            s.fillRect(x - radio, y - radio, radio * 2, radio * 2);
        };
        const h = partida.heroe;
        const parpadeo = 1 + Math.sin(partida.reloj * 9) * 0.04;
        luz(h.x + h.ancho / 2 - camX, h.y + 8 - camY, (h.poder === "fuego" || h.bendicion > 0 ? 96 : 78) * parpadeo);
        for (let f = 0; f < n.alto; f++) {
            for (let c = c0; c <= c1; c++) {
                const letra = P.celda(n, c, f);
                if (oculta(c, f)) continue;
                if (letra === "T") luz(c * CELDA + 8 - camX, f * CELDA + 2 - camY, 50 * parpadeo);
                else if (letra === "~" && P.celda(n, c, f - 1) !== "~" && c % 2 === 0) luz(c * CELDA + 8 - camX, f * CELDA - camY, 34, 0.8);
                else if (letra === "o" || letra === "?" || letra === "!" || letra === "*" || letra === "$") luz(c * CELDA + 8 - camX, f * CELDA + 8 - camY, 14, 0.5);
            }
        }
        for (const r of n.reliquias) if (!partida.reliquias.has(r.i) && !oculta(r.c, r.f)) luz(r.c * CELDA + 8 - camX, r.f * CELDA + 8 - camY, 26, 0.8);
        for (const b of partida.disparos) luz(b.x + 3 - camX, b.y + 3 - camY, 26, 0.9);
        for (const p of partida.proyectiles) if (p.tipo === "bola" || (p.tipo === "pilar" && !p.aviso)) luz(p.x + p.ancho / 2 - camX, p.y + p.alto / 2 - camY, 28, 0.8);
        for (const k of partida.cadenas) luz(k.cx - camX, k.cy - camY, 64, 0.7);
        for (const e of partida.enemigos) if (e.vivo && e.activo && e.def.id === "ascua") luz(e.x + 5 - camX, e.y + 5 - camY, 30, 0.9);
        if (n.meta) luz(n.meta.c * CELDA + 8 - camX, (n.meta.f - 1) * CELDA - camY, partida.metaAbierta ? 60 : 30);
        for (const k of partida.controles) if (k.activo) luz(k.c * CELDA + 8 - camX, (k.f - 1) * CELDA - camY, 40, 0.8);
        const j = partida.jefe;
        if (j && j.activo) luz(j.x + j.ancho / 2 - camX, j.y + j.alto / 2 - camY, 70, 0.7);
        g.drawImage(sombra, 0, 0);
    }

    return { dibujar };
}

// Una miniatura de un mundo (para las tarjetas del mapa): su cielo, sus montañas y una franja de su suelo. Devuelve un lienzo.
export function miniaturaDeMundo(mundo, ancho = 240, alto = 96) {
    const fondos = crearFondos(mundo, 240);
    const l = lienzo(ancho, alto);
    const g = l.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(fondos.cielo, 0, 0, ancho, alto);
    // Las capas se apoyan abajo, a su tamaño (se ve la parte de abajo de cada una: montañas, árboles, torres).
    fondos.capas.forEach((capa, i) => g.drawImage(capa, -i * 60, alto - capa.height + 18));
    // Una franja de suelo, con su borde (pasto, roca, nieve o muralla).
    for (let c = 0; c < Math.ceil(ancho / CELDA); c++) {
        pintarCelda(g, "#", c * CELDA, alto - 14, c, 1, mundo, { arriba: true, abajo: false, izq: false, der: false });
    }
    if (mundo === 4) {   // y un poco de lava
        const pal = PALETAS[4];
        for (let c = 6; c < 9; c++) pintarLava(g, c * CELDA, alto - 14, c, 0.4, pal, true);
    }
    return l;
}

export { PALETAS };
