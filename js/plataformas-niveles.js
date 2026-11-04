// plataformas-niveles.js — Los niveles de «La Senda del Reino» (v185). Solo datos.
//
// Cada nivel es una cuadrícula de 15 filas (fila 0 = arriba, fila 14 = abajo). Las letras están en plataformas.js › LETRAS.
// Para no escribir cada fila a mano (¡son casi 200 letras!), cada nivel se arma como una receta con nivel({...}):
//   1. se llena el suelo (filas 13 y 14) con «suelo» (por defecto "#"; "." = sin suelo, todo vacío),
//   2. se abren los huecos (pozos o lava): [columna, cuántas celdas, con qué se llenan ("." o "~")],
//   3. se ponen las piezas (escaleras, columnas, bloques…),
//   4. y al final lo de cada fila: filas: { 9: { 12: "?" } } = en la fila 9, columna 12, un bloque rúnico.
// Así se lee dónde está cada cosa. Los pies del héroe, parado en el suelo, quedan en la fila 12.
//
// Las pruebas revisan que todos los niveles midan bien, tengan inicio y meta, y que la meta y las reliquias se
// puedan alcanzar con los saltos del héroe (plataformas.js › alcanzable). Si cambias un nivel, corre las pruebas.

const ALTO = 15;
const SUELO = 13;   // la primera fila del suelo

function nivel(datos) {
    const { id, ancho } = datos;
    const g = Array.from({ length: ALTO }, () => Array(ancho).fill("."));
    const poner = (c, f, texto) => {
        [...texto].forEach((letra, i) => {
            if (f < 0 || f >= ALTO || c + i < 0 || c + i >= ancho) {
                throw new Error(`Nivel ${id}: «${texto}» se sale del nivel (columna ${c}, fila ${f}).`);
            }
            g[f][c + i] = letra;
        });
    };
    const suelo = datos.suelo ?? "#";
    for (let f = SUELO; f < ALTO; f++) g[f].fill(suelo);
    for (const [c, largo, relleno = "."] of datos.huecos || []) {
        for (let f = SUELO; f < ALTO; f++) poner(c, f, relleno.repeat(largo));
    }
    for (const pieza of datos.piezas || []) pieza(poner);
    for (const [f, cosas] of Object.entries(datos.filas || {})) {
        for (const [c, texto] of Object.entries(cosas)) poner(Number(c), Number(f), texto);
    }
    const { piezas, huecos, filas, suelo: _, ...resto } = datos;
    return { ...resto, filas: g.map((fila) => fila.join("")) };
}

// ===== Piezas =====
// Una escalera de «alto» escalones que sube hacia la derecha (o baja, con baja = true), apoyada en el suelo.
const escalera = (c, alto, baja = false, letra = "=") => (poner) => {
    for (let i = 0; i < alto; i++) {
        const h = baja ? alto - i : i + 1;
        for (let k = 0; k < h; k++) poner(c + i, SUELO - 1 - k, letra);
    }
};
// Un rectángulo de una letra: desde (c, f), «ancho» celdas de ancho y «alto» de alto.
const bloque = (c, f, ancho, alto, letra = "=") => (poner) => {
    for (let k = 0; k < alto; k++) poner(c, f + k, letra.repeat(ancho));
};
// Una columna que sale del fondo (fila 14) y llega hasta la fila «arriba» (para pilares en medio de un pozo o de la lava).
const columna = (c, arriba, ancho = 2, letra = "=") => bloque(c, arriba, ancho, ALTO - arriba, letra);
// Un techo de roca (o de castillo) de «alto» filas, desde la columna c, «ancho» celdas.
const techo = (c, ancho, alto = 2, letra = "#") => bloque(c, 0, ancho, alto, letra);
// Un hueco en el techo bajo, para que un mazo tenga de dónde caer.
const nicho = (c, desde, hasta) => bloque(c, desde, 2, hasta - desde + 1, ".");
// Un escondite: un cuarto de «_» (desde afuera se ve como pared) y su pared falsa «%» en la columna «puerta»
// (las dos filas de abajo). Al cruzar la pared falsa, el cuarto se descubre.
const escondite = (c, f, ancho, alto, puerta) => (poner) => {
    for (let k = 0; k < alto; k++) poner(c, f + k, "_".repeat(ancho));
    for (const k of [alto - 2, alto - 1]) poner(puerta, f + k, "%");
};


// ===================== Mundo 1: Campos del Alba =====================
// Esqueletos, cangrejos, cienos, raíces y murciélagos. Aprendes a saltar, a romper bloques y a buscar secretos.

const N1_1 = nivel({
    id: "1-1", mundo: 1, numero: 1, nombre: "El camino del alba", tiempo: 300, ancho: 180,
    huecos: [[38, 3], [70, 3], [108, 3], [113, 3], [118, 3]],
    piezas: [
        bloque(30, 11, 2, 2), bloque(34, 10, 2, 3),                     // dos pilares para aprender a saltar
        escalera(58, 4), bloque(62, 9, 2, 4), escalera(64, 4, true),    // una pirámide de piedra
        bloque(61, 6, 3, 1),                                            // una repisa sobre la pirámide
        bloque(111, 11, 2, 2), bloque(116, 10, 2, 3),                   // islas entre los pozos
        bloque(124, 10, 10, 3, "#"),                                    // una colina…
        escondite(130, 11, 3, 2, 133),                                  // …con una cueva escondida tras una pared falsa
        escalera(154, 4), bloque(158, 9, 4, 4),                         // la escalera final
        bloque(163, 5, 2, 1),                                           // la repisa alta
    ],
    filas: {
        2: { 165: "R" },
        3: { 62: "R" },
        5: { 19: "?" },
        6: { 97: "oooo", 126: "?$?" },
        7: { 97: "----" },
        8: { 17: "ooooo", 116: "oo" },
        9: { 12: "?", 17: "B!B?B", 46: "B?B", 52: "?", 80: "?", 103: "+", 111: "oo", 128: "e", 144: "*" },
        10: { 38: "ooo", 70: "ooo", 92: "----" },
        11: { 41: "oooo", 130: "o", 132: "o", 166: "ooooo" },
        12: { 3: "S", 26: "e", 32: "e", 50: "e", 53: "e", 78: "k", 84: "e", 86: "T", 88: "C", 90: "T", 99: "j",
              131: "R", 140: "z", 147: "e", 149: "e", 151: "k", 172: "F" },
    },
});

const N1_2 = nivel({
    id: "1-2", mundo: 1, numero: 2, nombre: "Ruinas del viejo puente", tiempo: 300, ancho: 186,
    huecos: [[24, 15], [57, 21], [91, 13], [164, 3]],
    piezas: [
        bloque(47, 5, 3, 1),                                           // una repisa alta (reliquia)
        columna(93, 11), columna(97, 9), columna(101, 10),             // pilares del puente caído
        bloque(116, 6, 12, 7),                                         // la muralla en ruinas…
        escondite(117, 11, 3, 2, 116),                                 // …con un cuarto escondido
        escalera(156, 4), bloque(160, 9, 3, 4),
    ],
    filas: {
        3: { 48: "R" },
        4: { 98: "R", 118: "oooo" },
        5: { 122: "e" },
        6: { 31: "v", 96: "v", 112: ":" },   // «:» = hasta dónde sube la plataforma N de la fila 12
        7: { 62: "oooooooo" },
        8: { 29: "ooo" },
        9: { 8: "?", 19: "B!B", 44: "?B?", 132: "?B?B", 146: "+" },
        10: { 24: "----..---..----", 58: "M", 72: ">" },
        11: { 10: "ooo", 150: "ooo" },
        12: { 2: "S", 18: "e", 52: "t", 80: "T", 82: "C", 84: "T", 88: "k", 106: "e", 109: "e", 112: "N",
              118: "R", 136: "j", 140: "t", 150: "e", 153: "e", 178: "F" },
    },
});

const N1_3 = nivel({
    id: "1-3", mundo: 1, numero: 3, nombre: "Bosque de los susurros", tiempo: 300, ancho: 188,
    huecos: [[54, 4], [62, 4], [163, 4]],
    piezas: [
        bloque(100, 3, 6, 10, "#"),                                    // el tronco hueco (se pasa por arriba)…
        escondite(101, 9, 4, 4, 105),                                  // …y adentro, un escondite
        escalera(152, 3), bloque(155, 10, 8, 3, "#"),
    ],
    filas: {
        1: { 101: "oooo" },
        2: { 45: "R", 103: "e" },
        4: { 42: "-----", 158: "R" },
        6: { 123: "v", 157: "---" },
        7: { 36: "-----", 115: "v", 97: "---" },
        8: { 39: "r" },
        9: { 7: "?", 55: "oo", 63: "oo", 70: "B!B", 112: "?B$B?", 128: "*", 133: "o", 139: "o", 145: "o" },
        10: { 30: "-----", 96: "---" },
        11: { 16: "ooooo", 103: "oo" },
        12: { 2: "S", 14: "z", 18: "e", 22: "z", 44: "k", 76: "e", 79: "e", 84: "j", 90: "T", 92: "C", 94: "T", 102: "R",
              120: "k", 126: "e", 134: "z", 140: "z", 146: "z", 172: "e", 180: "F" },
    },
});

const N1_J = nivel({
    id: "1-J", mundo: 1, numero: 4, nombre: "El Caballero sin Nombre", tiempo: 240, ancho: 58,
    jefe: "caballero", arena: [30, 57],   // arena = [la columna de la puerta, la última columna]
    // En las arenas, las repisas son tablas: se atraviesan desde abajo y así nunca tapan la cabeza del jefe.
    piezas: [bloque(10, 9, 3, 1, "B")],
    filas: {
        8: { 11: "o" },
        9: { 11: "!", 36: "---", 50: "---" },
        11: { 4: "ooo", 16: "ooo" },
        12: { 3: "S", 22: "T", 24: "C", 28: "T", 49: "b", 55: "F" },
    },
});


// ===================== Mundo 2: Minas de Cristal =====================
// Bajo techo y a oscuras: escorpiones, arañas que bajan del techo, mazos de piedra, plataformas que se derrumban.

const N2_1 = nivel({
    id: "2-1", mundo: 2, numero: 1, nombre: "La boca de la mina", tiempo: 300, ancho: 186,
    huecos: [[50, 4], [82, 14]],
    piezas: [
        techo(8, 168),
        bloque(24, 2, 10, 6, "#"),                                     // un techo bajo
        bloque(100, 2, 2, 7, "#"), bloque(106, 2, 2, 8, "#"),          // estalactitas grandes
        bloque(110, 10, 4, 3),                                         // un bloque con una reliquia encima
        bloque(140, 7, 10, 6, "#"),                                    // una pared alta…
        escondite(145, 10, 4, 3, 149),                                 // …con un hueco escondido
        bloque(168, 10, 2, 3),
    ],
    filas: {
        3: { 171: "R" },
        5: { 112: "R", 143: "oooo" },
        7: { 85: "ooooo" },
        6: { 56: "v", 126: "v", 170: "---" },
        9: { 14: "?B?", 60: "B!B", 118: "$", 124: "*" },
        10: { 83: "M", 91: ">", 136: "---" },
        11: { 25: "oooooooo" },
        12: { 2: "S", 6: "T", 12: "T", 20: "p", 66: "k", 70: "p", 74: "T", 76: "C", 104: "j", 128: "p", 131: "k",
              146: "R", 166: "p", 180: "F" },
        2: { 38: "x", 44: "x", 88: "r", 156: "x", 162: "x" },
    },
});

const N2_2 = nivel({
    id: "2-2", mundo: 2, numero: 2, nombre: "Galerías de cristal", tiempo: 300, ancho: 184,
    huecos: [[22, 22], [102, 4]],
    piezas: [
        techo(0, 184),
        escalera(77, 2), bloque(80, 8, 18, 1),                         // una galería de dos pisos
        bloque(154, 6, 10, 7, "#"),                                    // la repisa del final…
        escondite(155, 11, 3, 2, 154),                                 // …con un hueco escondido
    ],
    filas: {
        2: { 60: "x", 64: "x", 68: "x", 108: "r", 160: "x" },
        4: { 95: "R", 88: "v", 163: "R" },
        5: { 33: "v", 150: ":" },
        6: { 83: "oooooo" },
        9: { 9: "?!?", 30: "DD", 112: "$", 116: "+" },
        10: { 24: "DDD", 35: "DDD", 40: "DD", 123: "-------", 134: "DD", 138: "DD" },
        11: { 59: "oooooooooo" },
        12: { 2: "S", 5: "T", 50: "p", 56: "p", 72: "T", 74: "C", 76: "T", 86: "j", 92: "k", 124: "^^^^^", 134: "^^^^^^",
              150: "N", 156: "R", 145: "p", 170: "p", 176: "F" },
    },
});

const N2_3 = nivel({
    id: "2-3", mundo: 2, numero: 3, nombre: "El pozo sin fondo", tiempo: 320, ancho: 186,
    huecos: [[8, 20], [46, 28], [106, 20]],
    piezas: [
        techo(0, 186),
        columna(11, 10), columna(16, 8), columna(21, 9), columna(25, 11),
        bloque(80, 2, 24, 7, "#"), nicho(86, 2, 8), nicho(96, 2, 8),   // un pasillo bajo con dos mazos en el techo
        escalera(152, 4), bloque(156, 9, 3, 4),
    ],
    filas: {
        2: { 63: "r", 86: "x", 96: "x" },
        3: { 60: "R", 166: "R" },
        4: { 58: "ooooo" },
        5: { 14: "v", 23: "v", 114: "R", 164: "---" },
        6: { 59: ":", 116: "v", 138: "v", 160: "---" },
        7: { 65: "M", 69: ">" },
        9: { 36: "?!?", 130: "*", 144: "$" },
        10: { 47: "M", 53: ">", 108: "DD", 113: "DD", 118: "DD", 122: "DD" },
        11: { 59: "N" },
        12: { 2: "S", 34: "p", 42: "k", 76: "T", 78: "C", 90: "j", 99: "p", 134: "p", 137: "k", 140: "p", 180: "F" },
    },
});

const N2_J = nivel({
    id: "2-J", mundo: 2, numero: 4, nombre: "El Gólem de hierro", tiempo: 240, ancho: 58,
    jefe: "golem", arena: [30, 57],
    piezas: [techo(0, 58)],
    filas: {
        9: { 12: "B!B", 35: "---", 50: "---" },
        11: { 4: "ooo", 17: "ooo" },
        12: { 3: "S", 8: "T", 22: "T", 24: "C", 28: "T", 47: "b", 55: "F" },
    },
});


// ===================== Mundo 3: Cumbres de la Tormenta =====================
// Hielo que resbala, arpías que se lanzan en picado, cristales que disparan esquirlas y canes rápidos.

const N3_1 = nivel({
    id: "3-1", mundo: 3, numero: 1, nombre: "Sendero helado", tiempo: 300, ancho: 188,
    huecos: [[41, 4], [86, 16], [128, 14]],
    piezas: [
        bloque(22, 13, 17, 2, "I"),                                    // el primer tramo de hielo
        escalera(62, 3), bloque(65, 10, 6, 3, "#"), escalera(71, 3, true), bloque(66, 6, 3, 1, "I"),
        bloque(104, 13, 18, 2, "I"),
        columna(131, 10), columna(135, 8), columna(139, 9),
        bloque(166, 9, 6, 4, "#"), escondite(167, 11, 4, 2, 166),
    ],
    filas: {
        2: { 138: "w" },
        3: { 67: "R", 136: "R" },
        4: { 72: "w", 94: "w" },
        7: { 89: "oooooo" },
        9: { 8: "?", 50: "B!B", 107: "*", 112: "$", 150: "+" },
        10: { 87: "M", 96: ">" },
        11: { 24: "oooo" },
        12: { 2: "S", 16: "q", 30: "q", 56: "y", 80: "T", 82: "C", 110: "q", 116: "q", 120: "y", 158: "y", 162: "q",
              169: "R", 182: "F" },
    },
});

const N3_2 = nivel({
    id: "3-2", mundo: 3, numero: 2, nombre: "Puentes del viento", tiempo: 320, ancho: 192, suelo: ".",
    piezas: [
        bloque(0, 13, 12, 2, "#"),                                     // cada isla de piedra en el cielo
        bloque(23, 11, 6, 4, "#"),
        bloque(41, 10, 8, 5, "#"),
        bloque(63, 11, 10, 4, "#"),
        bloque(80, 6, 8, 2, "#"),
        bloque(100, 12, 12, 3, "#"),
        bloque(121, 12, 2, 1, "#"),
        bloque(130, 11, 6, 4, "#"),
        bloque(151, 13, 41, 2, "#"),
        bloque(172, 10, 2, 3), bloque(174, 7, 2, 6, "#"),
    ],
    filas: {
        3: { 86: "R", 118: "w", 124: "w", 175: "R" },
        4: { 82: "oooo" },
        5: { 55: "w", 75: ":", 84: "q" },
        6: { 43: "B!B" },
        8: { 104: "$" },
        9: { 47: "y", 89: "----", 114: "---", 120: "---", 126: "---", 156: "*" },
        10: { 26: "q", 32: "DD", 37: "DD", 50: "M", 58: ">", 63: "T", 66: "C", 95: "DDD", 134: "y", 137: "M", 146: ">" },
        11: { 12: "---------", 105: "k", 108: "q", 121: "R" },
        12: { 2: "S", 75: "N", 162: "q", 166: "k", 170: "q", 186: "F" },
    },
});

const N3_3 = nivel({
    id: "3-3", mundo: 3, numero: 3, nombre: "La cumbre partida", tiempo: 320, ancho: 196,
    huecos: [[31, 4], [61, 6], [112, 26]],
    piezas: [
        bloque(8, 13, 20, 2, "I"),
        escalera(52, 5, false, "I"), bloque(57, 8, 4, 5, "I"), bloque(67, 9, 4, 4, "#"),
        bloque(140, 13, 22, 2, "I"),
        escalera(170, 4, false, "I"), bloque(174, 9, 6, 4, "#"), escondite(176, 11, 3, 2, 179),
    ],
    filas: {
        2: { 100: "R", 122: "w", 126: "R" },
        3: { 64: "w", 134: "w" },
        5: { 98: "---", 125: ":" },
        8: { 63: "DD", 131: "DD" },
        9: { 36: "B!B", 84: "----", 92: "----", 142: "*" },
        10: { 113: "M", 119: ">" },
        11: { 125: "N" },
        12: { 2: "S", 16: "^^", 20: "q", 24: "^^", 44: "y", 48: "q", 74: "T", 76: "C", 86: "y", 90: "q", 96: "y", 100: "k",
              146: "^^^", 150: "q", 154: "^^^", 158: "q", 160: "k", 177: "R", 190: "F" },
    },
});

const N3_J = nivel({
    id: "3-J", mundo: 3, numero: 4, nombre: "El Dragón de la tormenta", tiempo: 240, ancho: 58,
    jefe: "dragon", arena: [30, 57],
    piezas: [bloque(9, 9, 3, 1, "B")],
    filas: {
        8: { 10: "o" },
        9: { 10: "!", 36: "----", 49: "----" },
        11: { 4: "ooo", 16: "ooo" },
        12: { 3: "S", 22: "T", 24: "C", 28: "T", 47: "b", 55: "F" },
    },
});


// ===================== Mundo 4: Fortaleza de la Llama =====================
// Lava, ascuas que saltan, cadenas de fuego, mazos, sabuesos de ceniza y gárgolas.

const N4_1 = nivel({
    id: "4-1", mundo: 4, numero: 1, nombre: "Las murallas", tiempo: 300, ancho: 188,
    huecos: [[27, 4, "~"], [35, 3, "~"], [84, 20, "~"]],
    piezas: [
        escalera(39, 3), bloque(42, 8, 16, 5),                         // la muralla…
        escondite(53, 11, 4, 2, 57),                                   // …con un cuarto escondido (se entra por la derecha)
        columna(87, 10), columna(92, 9), columna(97, 10), columna(101, 11),   // pilares en la lava
        techo(106, 24, 3, "="),
        escalera(164, 4), bloque(168, 9, 4, 4), bloque(172, 5, 2, 1),
    ],
    filas: {
        2: { 173: "R" },
        3: { 110: "x", 116: "x", 122: "x" },
        4: { 93: "R" },
        7: { 43: "=", 46: "=", 48: "t", 50: "=", 53: "=", 55: "e", 114: "v" },   // las almenas de la muralla
        9: { 9: "?B?", 64: "G", 70: "!", 133: "*", 158: "G" },
        11: { 59: "ooo", 107: "oooooooooo" },
        12: { 2: "S", 4: "T", 10: "T", 16: "e", 22: "s", 55: "R", 68: "e", 74: "s", 76: "T", 78: "C", 80: "T", 127: "t",
              138: "s", 141: "e", 145: "s", 182: "F" },
        13: { 28: "l", 90: "l", 95: "l", 99: "l" },
    },
});

const N4_2 = nivel({
    id: "4-2", mundo: 4, numero: 2, nombre: "Ríos de lava", tiempo: 320, ancho: 198,
    huecos: [[12, 26, "~"], [57, 3, "~"], [64, 3, "~"], [71, 3, "~"], [90, 26, "~"], [152, 24, "~"]],
    piezas: [
        techo(88, 30, 3, "="),
        bloque(181, 9, 2, 1), bloque(185, 5, 2, 1),
    ],
    filas: {
        3: { 98: "x", 186: "R" },
        5: { 112: "R", 160: "R" },
        6: { 105: "v" },
        8: { 28: "DD", 68: "G" },
        9: { 46: "B!B", 61: "G", 97: "----", 130: "$", 138: "+" },
        10: { 13: "M", 22: ">", 32: "M", 35: ">", 110: "------", 154: "DD", 159: "DD", 164: "DD", 169: "DD" },
        11: { 90: "-----", 103: "-----" },
        12: { 2: "S", 6: "T", 44: "s", 53: "t", 82: "T", 84: "C", 86: "T", 126: "s", 129: "e", 132: "s", 146: "t", 178: "G", 192: "F" },
        13: { 18: "l", 26: "l", 34: "l", 58: "l", 65: "l", 72: "l", 95: "l", 101: "l", 109: "l", 157: "l", 162: "l", 167: "l", 172: "l" },
    },
});

const N4_3 = nivel({
    id: "4-3", mundo: 4, numero: 3, nombre: "El corazón de la fortaleza", tiempo: 340, ancho: 208,
    huecos: [[27, 16, "~"], [80, 24, "~"], [152, 18, "~"]],
    piezas: [
        techo(0, 208, 2, "="),
        columna(30, 10), columna(35, 9), columna(40, 10),
        bloque(44, 2, 26, 5), nicho(50, 2, 6), nicho(58, 2, 6), nicho(64, 2, 6),   // el pasillo de los mazos
        bloque(138, 5, 10, 8), escondite(139, 11, 4, 2, 138),
        escalera(190, 4), bloque(194, 9, 4, 4), bloque(199, 5, 2, 1),
    ],
    filas: {
        2: { 50: "x", 58: "x", 64: "x" },
        3: { 200: "R" },
        4: { 35: "G", 98: "R", 142: "e" },
        5: { 90: "v", 133: ":" },
        6: { 161: "G" },
        8: { 96: "M", 99: ">", 121: "G" },
        9: { 12: "G", 20: "?B?", 56: "!", 112: "*", 180: "$" },
        10: { 81: "M", 90: ">", 154: "DD", 159: "DD", 164: "DD" },
        11: { 140: "oo" },
        12: { 2: "S", 18: "e", 54: "s", 61: "e", 72: "T", 74: "C", 76: "T", 110: "t", 115: "s", 119: "s", 124: "t", 133: "N",
              141: "R", 176: "s", 179: "e", 182: "s", 186: "k", 204: "F" },
        13: { 33: "l", 38: "l", 86: "l", 94: "l", 100: "l", 157: "l", 162: "l", 167: "l" },
    },
});

const N4_J = nivel({
    id: "4-J", mundo: 4, numero: 4, nombre: "El Señor de la Fragua", tiempo: 260, ancho: 60,
    jefe: "demonio", arena: [30, 59],
    huecos: [[37, 3, "~"], [49, 3, "~"]],
    piezas: [techo(0, 60, 2, "=")],
    filas: {
        9: { 11: "B!B", 42: "---", 52: "---" },
        11: { 4: "ooo", 17: "ooo" },
        12: { 3: "S", 8: "T", 22: "T", 24: "C", 28: "T", 55: "b", 57: "F" },
        13: { 38: "l", 50: "l" },
    },
});

// Todos, en el orden en que se juegan.
export const NIVELES_DATOS = [N1_1, N1_2, N1_3, N1_J, N2_1, N2_2, N2_3, N2_J, N3_1, N3_2, N3_3, N3_J, N4_1, N4_2, N4_3, N4_J];
