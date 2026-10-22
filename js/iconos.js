// iconos.js — Los íconos de la app en pixel art (v91).
//
// Antes la app usaba emojis (🔥 ❤️ 🛡️…). Se ven distintos en cada teléfono y le dan un aire
// infantil. Aquí cada ícono está DIBUJADO punto por punto, como en los juegos de rol clásicos.
//
// Cómo se dibuja un ícono: una lista de filas de texto. Cada letra es un punto de un color
// (mira PALETA) y el punto "." es transparente. Ejemplo, un corazón:
//     "..rrr....rrr..",
//     ".rRWrr..rrrrr.",   ← R = rojo claro (el brillo), W = blanco
//     ...
// No hace falta dibujar el borde negro: aTrazos() lo agrega solo alrededor de la figura.
//
// Cómo llegan a la pantalla: la app sigue escribiendo emojis en su HTML (vistas.js no cambia).
// vigilarIconos() mira la página y, cada vez que aparece un emoji de la lista EMOJIS, lo
// cambia por su ícono. Así no hubo que tocar los cientos de lugares donde hay emojis.

// ---------- Colores ----------
// Cada familia tiene 3 o 4 tonos: claro (la luz viene de arriba a la izquierda), medio y sombra.
const PALETA = {
    "#": "#140c22",                                                     // la tinta del contorno
    W: "#ffffff", w: "#d9deeb", s: "#9aa3bd", S: "#646c8a", k: "#3a3f57", // plata / acero
    x: "#221a30",                                                       // casi negro (ojos, huecos)
    Y: "#fff3a6", y: "#ffcb3d", o: "#de8f1b", O: "#9a5212",             // oro
    R: "#ff8f8f", r: "#e8384f", d: "#a11c3a", D: "#5e0f27",             // rojo
    B: "#bdeeff", b: "#4cb3f2", n: "#2a68c4", N: "#1a3778",             // azul
    G: "#c8f590", g: "#5ccc4a", v: "#2a8a3e", V: "#175229",             // verde
    P: "#ead0ff", p: "#b06cf0", q: "#7034c2", Q: "#3f1b78",             // violeta
    T: "#f2c690", t: "#c27e44", m: "#86492b", M: "#4e2a18",             // madera / cuero
    C: "#ccfff6", c: "#3ee0d0", e: "#1a9a9a",                           // turquesa
    A: "#ffc275", a: "#ff8a24", z: "#c24e10",                           // naranja
    F: "#ffe0bd", f: "#eaa97a", h: "#b06c47",                           // piel / pergamino
    K: "#ffb3da", i: "#ef5fa7",                                         // rosa
};

// ---------- Ayudas para dibujar ----------
// Cambia unas letras por otras (el mismo dibujo en otro color).
function recolor(filas, cambios) {
    return filas.map((fila) => [...fila].map((letra) => cambios[letra] || letra).join(""));
}

// El dibujo al revés, como en un espejo.
function espejo(filas) {
    return filas.map((fila) => [...fila.padEnd(14, ".")].reverse().join(""));
}

// Pone el dibujo b encima del dibujo a (los puntos "." de b dejan ver a).
function encima(a, b) {
    const alto = Math.max(a.length, b.length);
    return Array.from({ length: alto }, (_, y) => {
        const fa = (a[y] || "").padEnd(14, "."), fb = (b[y] || "").padEnd(14, ".");
        return [...fa].map((letra, x) => (fb[x] !== "." ? fb[x] : letra)).join("");
    });
}

// Un dibujo hecho con una regla: pintar(x, y) devuelve la letra de cada punto.
// Sirve para lo redondo (monedas, relojes, esferas), que a mano sale chueco.
function pintar(ancho, alto, regla) {
    return Array.from({ length: alto }, (_, y) => Array.from({ length: ancho }, (_, x) => regla(x, y) || ".").join(""));
}

// Distancia desde el centro de un dibujo de 14 × 14 (sirve para círculos).
const distancia = (x, y, cx = 6.5, cy = 6.5) => Math.hypot(x - cx, y - cy);

// ---------- Los dibujos ----------
const CORAZON = [
    "..rrr....rrr..",
    ".rRWrr..rrrrr.",
    "rRRrrrrrrrrrrr",
    "rRrrrrrrrrrrrd",
    "rrrrrrrrrrrrrd",
    "rrrrrrrrrrrrrd",
    ".rrrrrrrrrrrd.",
    "..rrrrrrrrrd..",
    "...rrrrrrrd...",
    "....rrrrrd....",
    ".....rrrd.....",
    "......rd......",
];

const CORAZON_ROTO = encima(CORAZON, [
    "......#.......",
    "......#.......",
    ".......#......",
    "......#.......",
    ".....#........",
    "......#.......",
    ".......#......",
    "......#.......",
    ".....#........",
    "......#.......",
]);

const GEMA = [
    "...bbbbbbbb...",
    "..bBBbCCbBBn..",
    ".bBCBbbbbBbnn.",
    "bBCCbbbbbbbbnn",
    "nnnnnnnnnnnnnN",
    ".bbBbbbbbbbnN.",
    "..bBbbbbbbnN..",
    "...bBbbbbnN...",
    "....bbbbnN....",
    ".....bbnN.....",
    "......nN......",
];

const ROMBO = [
    "......cc......",
    ".....cCCc.....",
    "....cCCccc....",
    "...cCCcccce...",
    "..cCCcWWccce..",
    ".cCCccWWcccee.",
    "cCcccccccccee.",
    ".eccccccccee..",
    "..ecccccccee..",
    "...eccccee....",
    "....eccee.....",
    ".....eee......",
];

// Moneda: aro de oro, cara con brillo y un hueco cuadrado como las monedas antiguas.
const MONEDA = pintar(14, 14, (x, y) => {
    const d = distancia(x, y);
    if (d > 6.7) return null;
    if (d > 5.5) return x + y > 14 ? "O" : "o";
    if (Math.max(Math.abs(x - 6.5), Math.abs(y - 6.5)) <= 2.5 && Math.max(Math.abs(x - 6.5), Math.abs(y - 6.5)) > 1.5) return "o";
    if (Math.max(Math.abs(x - 6.5), Math.abs(y - 6.5)) <= 1.5) return "O";
    return x + y < 9 ? "Y" : x + y > 17 ? "o" : "y";
});

const BOLSA = [
    ".....m...m....",
    "......mmm.....",
    ".....yyyyy....",
    ".....mtttm....",
    "...tTTttttmm..",
    "..tTTttttttmm.",
    ".tTTtttyyttttm",
    ".tTttttyOtttmm",
    ".tTttttyOtttmm",
    ".tTttttyytttmm",
    ".ttttttttttmmm",
    "..ttttttmmmmm.",
    "...mmmmmmmmm..",
];

const ESCUDO = [
    ".wwwwwwwwwwww.",
    "wWbbbbyybbbbns",
    "wbbbbbyybbbbns",
    "wbbbbbyybbbbns",
    "wyyyyyyyyyyyos",
    "wyyyyyyyyyyyos",
    "wbbbbbyobbbbns",
    "wbbbbbyobbbbns",
    ".wbbbbyobbbns.",
    ".wbbbbyobbbns.",
    "..wbbbyobbns..",
    "...wbbyobns...",
    "....wbyons....",
    ".....wsss.....",
];

const ESPADA = [
    ".............w",
    "............ws",
    "...........ws.",
    "..........ws..",
    ".........ws...",
    "........ws....",
    ".......ws.....",
    "...y..ws......",
    "....yws.......",
    "....ty........",
    "...t..y.......",
    "..m...........",
    ".y............",
];

const ESPADAS = encima(espejo(ESPADA), ESPADA);

const DAGA = [
    "..........ww..",
    ".........wWs..",
    "........wWs...",
    ".......wWs....",
    "......wWs.....",
    "...yywWs......",
    "....yys.......",
    "....tyy.......",
    "...tm.y.......",
    "..tm..........",
    ".yy...........",
    ".yy...........",
];

const FUEGO = [
    "......r.......",
    ".....ra.......",
    ".....raa..r...",
    "....raAa..ar..",
    "...raAAa.aar..",
    "...aAAAaaaAa..",
    "..raAYAaaAAa..",
    "..aAYYAaAAAar.",
    ".raAYYYAAYAar.",
    ".aAYYYYYYYAAa.",
    ".aAYYWWYYYYAa.",
    ".aAYYWWWYYYAz.",
    "..aAYYYYYYAzz.",
    "...zaAAAAazz..",
];

const CHISPAS = [
    "....y.........",
    "....y.........",
    "...yYy........",
    "..yYWYy.......",
    "yyYWWWYyy.....",
    "..yYWYy.......",
    "...yYy........",
    "....y.....y...",
    "....y.....y...",
    ".........yYy..",
    ".......yyYWYyy",
    "..y......yYy..",
    ".yWy......y...",
    "..y.......y...",
];

const ESTRELLA = [
    "......yy......",
    "......yy......",
    ".....yYYy.....",
    ".....yYYy.....",
    "yyyyyYWYyyyyyy",
    ".yyYYYYYYyyyo.",
    "..yyYYYYyyyo..",
    "...yyYYyyyo...",
    "...yyyyyyyo...",
    "..yyyyoyyyyo..",
    "..yyyo..oyyo..",
    ".yyo......oyo.",
    ".yo........oo.",
];

const RAYO = [
    "......yyyy",
    ".....yYYy.",
    "....yYYy..",
    "...yYYy...",
    "..yYYyyyyy",
    ".yYYYYYYy.",
    "yyyyyYYy..",
    "....yYy...",
    "...yYy....",
    "...yYy....",
    "..yYy.....",
    "..yy......",
    ".yy.......",
    ".y........",
];

const CALAVERA = [
    "...wwwwwwww...",
    "..wWWWWwwwws..",
    ".wWWwwwwwwwss.",
    ".wWwwwwwwwwws.",
    ".wwxxwwwwxxws.",
    ".wxxxxwwxxxxs.",
    ".wxxxxwwxxxxs.",
    ".wwxxwwwwxxws.",
    "..wwwwxxwwws..",
    "...swwxxwwss..",
    "...wwwwwwwss..",
    "...wxwxwxwxs..",
    "...wwwwwwwss..",
    "....sssssss...",
];

const CHECK = [
    "............gg",
    "...........gGg",
    "..........gGg.",
    ".........gGg..",
    "........gGg...",
    "gg.....gGg....",
    "gGg...gGg.....",
    ".gGg.gGg......",
    "..gGgGg.......",
    "...gGg........",
    "....g.........",
];

const CANDADO = [
    "...ssssss...",
    "..sw....ss..",
    "..sw....ss..",
    "..sw....ss..",
    "..sw....ss..",
    "YYYYYYYYYYyo",
    "Yyyyyyyyyyyo",
    "Yyyyy##yyyyo",
    "Yyyyy##yyyyo",
    "Yyyyyy#yyyyo",
    "Yyyyyy#yyyyo",
    "yyyyyyyyyyyo",
    "oooooooooooo",
];

const ABIERTO = [
    "...ssssss...",
    "..sw....ss..",
    "..sw....ss..",
    "..sw........",
    "..sw........",
    "YYYYYYYYYYyo",
    "Yyyyyyyyyyyo",
    "Yyyyy##yyyyo",
    "Yyyyy##yyyyo",
    "Yyyyyy#yyyyo",
    "Yyyyyy#yyyyo",
    "yyyyyyyyyyyo",
    "oooooooooooo",
];

const LLAVE = [
    "...yyyy.......",
    "..yYYyyy......",
    ".yY#..oyy.....",
    ".yY#...yo.....",
    ".yy#..yyo.....",
    "..yyyyyoo.....",
    "....yo........",
    "....yo........",
    "....yoyy......",
    "....yoo.......",
    "....yoyy......",
    "....yoo.......",
    "....yo........",
    ".....o........",
];

// Diana: anillos rojo y blanco.
const DIANA = pintar(14, 14, (x, y) => {
    const d = distancia(x, y);
    if (d > 6.7) return null;
    const anillo = Math.floor(d / 1.75);
    const sombra = x + y > 15;
    return anillo % 2 === 0 ? (sombra ? "d" : "r") : (sombra ? "s" : "w");
});

const PERGAMINO = [
    ".TTTTTTTTTTTT.",
    "tTttttttttttmm",
    ".mmmmmmmmmmmm.",
    "..FFFFFFFFFf..",
    "..FhhhhhhhFf..",
    "..FFFFFFFFFf..",
    "..FhhhhhFFFf..",
    "..FFFFFFFFFf..",
    "..FhhhhhhhFf..",
    "..FFFFFFFFFf..",
    ".TTTTTTTTTTTT.",
    "tTttttttttttmm",
    ".mmmmmmmmmmmm.",
];

const LIBRO = [
    ".wwwww..wwwww.",
    "wwwwwwSSwwwwws",
    "wsssswSSwssssw",
    "wwwwwwSSwwwwws",
    "wssswwSSwsssws",
    "wwwwwwSSwwwwws",
    "wsssswSSwssssw",
    "wwwwwwSSwwwwws",
    "rrrrrrSSrrrrrr",
    ".dddddddddddd.",
];

const LIBROS = [
    "..rrrrrrrrrrr.",
    "..rRRyRRRRRRrd",
    "..dddddddddwwd",
    ".bbbbbbbbbbbb.",
    ".bBBByBBBBBBbn",
    ".nnnnnnnnnnwwn",
    "gggggggggggg..",
    "gGGGyGGGGGGgv.",
    "vvvvvvvvvvwwv.",
];

const CUADERNO = [
    ".pppppppppppq.",
    "wpPPPPPPPPPPq.",
    ".pPppppppppPq.",
    "wpPpwwwwwwpPq.",
    ".pPpwsssswpPq.",
    "wpPpwwwwwwpPq.",
    ".pPppppppppPq.",
    "wpPppppppppPq.",
    ".pPppppppppPq.",
    "wpPppppppppPq.",
    ".pPppppppppPq.",
    "wpPppppppppPq.",
    ".pqqqqqqqqqqq.",
];

const PLUMA = [
    "...........wW",
    ".........wwWw",
    "........wwWws",
    ".......wwWws.",
    "......wwWws..",
    ".....wwWws...",
    "....wwWws....",
    "...wwWws.....",
    "...wWws......",
    "..sWs........",
    "..ss.........",
    ".x...........",
    "x............",
];

const CHINCHETA = [
    "....rrrr....",
    "...rRRrrr...",
    "...rRrrrd...",
    "....rrrd....",
    "....rrrd....",
    "..rrrrrrrd..",
    ".rRRrrrrrrd.",
    ".rrrrrrrrdd.",
    "..dddddddd..",
    "......s.....",
    ".....s......",
    ".....s......",
    "....s.......",
    "....s.......",
];

const PESA = [
    ".ss........ss.",
    "swsk......swsk",
    "swskk....kswsk",
    "swskwwwwwwswsk",
    "swskk....kswsk",
    "swsk......swsk",
    ".kk........kk.",
];

const BRAZO = [
    "..hhhh........",
    ".hFFFFh.......",
    ".fFFFFFf......",
    ".fFFfFFf......",
    "..ffFFf.......",
    "...fFFf.......",
    "...fFFf..fff..",
    "...fFFf.fFFFf.",
    "...fFFffFFFFFf",
    "..fFFFFFFFFFFf",
    "..fFFFFFFFFFff",
    "..hfffffffffh.",
    "...hhhhhhhhh..",
];

const CEREBRO = [
    "...KKK.KKKK...",
    ".KKiKKiKKiKKK.",
    "KKiKKKiKKKiKKK",
    "KiKKiKKKiKKiKi",
    "KKKiKKiKKKKiKi",
    "KiKKKiKKiKKKKi",
    "KKiKKKiKKKiKKi",
    ".KKiKKKiKKiKi.",
    "..iiKKKKiiii..",
    ".....iiiK.....",
    "......iiK.....",
];

const GLOBO = [
    "..wwwwwwwwww..",
    ".wWWWWWWWWWws.",
    "wWwwwwwwwwwwws",
    "wWwwwwwwwwwwws",
    "wWwxxwxxwxxwws",
    "wWwxxwxxwxxwws",
    "wwwwwwwwwwwwws",
    ".swwwwwwwwwss.",
    "..ssswwsssss..",
    "....sws.......",
    "...ss.........",
];

const REGALO = [
    "...yy....yy...",
    "..yYoy..yoYy..",
    "...yyoyyoyy...",
    "rrrrrryyrrrrrr",
    "rRRRRRyYRRRRrd",
    "rddddoyyoddddd",
    ".rRRRRyYRRRrd.",
    ".rRrrryyrrrrd.",
    ".rRrrryyrrrrd.",
    ".rRrrryyrrrrd.",
    ".rRrrryyrrrrd.",
    ".rrrrryyrrrrd.",
    ".dddddoodddddd",
];

const FICHA = [
    "AAAAAAAAAAAAAa",
    "AaaaaaaaaYaaaz",
    "AazzzzzaaYaaaz",
    ".aaaaaaaaYaaz.",
    ".azzzzaaaYaaz.",
    "AaaaaaaaaYaaaz",
    "AazzzzzaaYaaaz",
    "AaaaaaaaaYaaaz",
    "azzzzzzzzzzzzz",
];

const SOMBRERO = [
    "........qq....",
    ".......qpq....",
    "......qppq....",
    "......qPpq....",
    ".....qPppq....",
    ".....qPypq....",
    "....qPppppq...",
    "....qPpppppq..",
    "...qPPpppppq..",
    "...qyyyyyyyyq.",
    "qqqyYyyyyyyqqq",
    "qPPPPpppppppqQ",
    ".QQQQQQQQQQQQ.",
];

// Reloj: tapa de acero, esfera blanca y dos agujas.
const RELOJ = pintar(14, 14, (x, y) => {
    if (y === 0) return x >= 5 && x <= 8 ? "s" : null;
    if (y === 1) return x >= 6 && x <= 7 ? "S" : null;
    const d = distancia(x, y, 6.5, 7.5);
    if (d > 6.2) return null;
    if (d > 5) return x + y > 15 ? "S" : "s";
    if (x === 6 && y >= 3 && y <= 7) return "x";
    if (y === 7 && x >= 6 && x <= 9) return "x";
    return x + y < 9 ? "W" : "w";
});

const ARENA = [
    "tttttttttt",
    ".wCCCCCCw.",
    ".wyyyyyyw.",
    "..wyyyyw..",
    "...wyyw...",
    "....yy....",
    "....yy....",
    "...wCyw...",
    "..wCCyCw..",
    ".wCCyyyCw.",
    ".wyyyyyyw.",
    "tttttttttt",
];

const TROFEO = [
    "..YYYYYYYYyo..",
    "yyYyyyyyyyyoyy",
    "y.Yyyyyyyyyo.y",
    "y.Yyyyyyyyyo.y",
    ".yYyyyyyyyyoy.",
    "..Yyyyyyyyyo..",
    "...yyyyyyyo...",
    "....yyyyoo....",
    ".....yyoo.....",
    "......yo......",
    "......yo......",
    "....yyyyoo....",
    "...mmmmmmmm...",
    "...MMMMMMMM...",
];

const CORONA = [
    ".y....yy....y.",
    ".yy..yYYy..yy.",
    ".yYy.yYYy.yYy.",
    ".yYyyyYYyyyyy.",
    ".yYyyyyyyyyyo.",
    ".yYyryyyybyyo.",
    ".yYyyyyyyyyyo.",
    ".oooooooooooo.",
];

const MEDALLA = [
    ".rr......bb.",
    ".rRr....bBb.",
    "..rRr..bBb..",
    "...rRrbBb...",
    "....rrbb....",
    "....yyyy....",
    "...yYYyyo...",
    "..yYyyyyyo..",
    "..yYyoyyyo..",
    "..yyyyyyyo..",
    "..yyyyyyoo..",
    "...yyyyoo...",
    "....oooo....",
];

// Esfera de cristal violeta sobre su base de oro.
const ORBE = encima(pintar(14, 14, (x, y) => {
    if (y > 10) return null;
    const d = distancia(x, y, 6.5, 5.5);
    if (d > 6) return null;
    if (distancia(x, y, 4.5, 3.2) < 1.3) return "W";
    if (distancia(x, y, 4.8, 3.6) < 2.4) return "P";
    return x + y > 14 ? "q" : "p";
}), [
    "", "", "", "", "", "", "", "", "", "", "",
    "...yyyyyyyy...",
    "..yYyyyyyyyo..",
    "..oooooooooo..",
]);

const TORRE = [
    ".ws.ws..ws.ws.",
    ".wssssssssssS.",
    ".SSSSSSSSSSSS.",
    "..wssssssssS..",
    "..wsssxxsssS..",
    "..wsssxxsssS..",
    "..wssssssssS..",
    "..wSsssSsssS..",
    "..wssssssssS..",
    "..wsssSsssSS..",
    "..wsssxxsssS..",
    "..wssxxxxssS..",
    "..wssxxxxssS..",
    ".kkkkkkkkkkkk.",
];

// Luna creciente: un círculo al que otro círculo le "muerde" un lado.
const LUNA = pintar(14, 14, (x, y) => {
    const d = distancia(x, y);
    if (d > 6.5 || distancia(x, y, 9.6, 4.6) < 5.4) return null;
    return x + y < 10 ? "Y" : x + y > 15 ? "o" : "y";
});

const MAPA = [
    "TTTTttttTTTTtt",
    "TTTTttttTTTTtt",
    "TggTttttTTTTtt",
    "TgggtttrTrTttt",
    "TTggtrttTTTrtt",
    "TTTrtttTTTTtrt",
    "TTrTtttTTTTtgt",
    "TrTTtttTTTTggt",
    "TrTTggttTTTgtt",
    "TTrTgggtTTxTxt",
    "TTTrTgttTTTxtt",
    "TTTTtrttTTxTxt",
    "mmmmMMMMmmmmMM",
];

const TREBOL = [
    "....gg.gg.....",
    "...gGGgGGg....",
    "...gGgggGg....",
    ".gg.ggggg.gg..",
    "gGGg.ggg.gGGg.",
    "gGgggggggggGg.",
    ".ggggggVggggg.",
    "gGgggggggggGg.",
    "gGGg.ggg.gGGg.",
    ".gg.ggggg.gg..",
    "...gGgggGg....",
    "...gGGgvgg....",
    "....gg.gg.v...",
    "...........vv.",
];

const POCION = [
    "....tTTt....",
    "....mttm....",
    "....swws....",
    "....swws....",
    "...sWwwws...",
    "..sWwwwwws..",
    ".sWrrRrrrrs.",
    ".sRrrrrRrds.",
    "sRrRrrrrrrds",
    "sRrrrrrrrrds",
    "srrrrrrrrdds",
    ".srrrrrrdds.",
    "..sdddddds..",
    "...ssssss...",
];

const VELA = [
    "...y....",
    "..yWy...",
    "..aYa...",
    "...a....",
    "...x....",
    ".wWwws..",
    ".wWwws..",
    ".wWwws..",
    ".wWwws..",
    ".wWwws..",
    ".wWwws..",
    "yyyyyyyo",
    ".oooooo.",
];

const GRAFICA = [
    "..........Gg..",
    "..........Gg..",
    "..........Gg..",
    ".......Gg.Gg..",
    ".......Gg.Gg..",
    "....Gg.Gg.Gg..",
    "....Gg.Gg.Gg..",
    ".Gg.Gg.Gg.Gg..",
    ".Gg.Gg.Gg.Gg..",
    ".Gg.Gg.Gg.Gg..",
    ".Gg.Gg.Gg.Gg..",
    "wwwwwwwwwwwwww",
];

const GOTA = [
    "....r....",
    "....r....",
    "...rrr...",
    "...rRr...",
    "..rRrrr..",
    "..rRrrr..",
    ".rRWrrrd.",
    ".rRrrrrd.",
    "rRrrrrrrd",
    "rRrrrrrrd",
    "rrrrrrrdd",
    ".rrrrrdd.",
    "..ddddd..",
];

const HUELLA = [
    "...tt....tt...",
    "..tTtt..tTtt..",
    "..tttt..tttt..",
    "...tt....tt...",
    "tt..........tt",
    "tTt........tTt",
    ".tt..tttt..tt.",
    "....tTtttt....",
    "...tTtttttt...",
    "..tTtttttttt..",
    "..tttttttttt..",
    "..tttt..tttt..",
    "...tt....tt...",
];

const NUBE = [
    ".....www......",
    "....wWWWw.....",
    "..wwwWwwwww...",
    ".wWWwwwwwwwww.",
    "wWwwwwwwwwwwws",
    "wWwwwwwwwwwwws",
    "wwwwwwwwwwwwss",
    ".ssssssssssss.",
];

const CASTILLO = [
    "w.ws......w.ws",
    "wsss......wsss",
    "wsssw.w.w.wsss",
    "wsssssssssssss",
    "wsxsssssssssxs",
    "wsxsssssssssxs",
    "wsssssxxsssss",
    "wssssxxxxssss",
    "wssssxxxxsssss",
    "wSsssxxxxsssSs",
    "kkkkkkkkkkkkkk",
];

const BRUJULA = pintar(14, 14, (x, y) => {
    const d = distancia(x, y);
    if (d > 6.7) return null;
    if (d > 5.4) return x + y > 14 ? "o" : "y";
    // La aguja: la mitad de arriba roja (el norte) y la de abajo blanca.
    const enAguja = Math.abs(x - 6.5) <= (y < 6.5 ? (y - 1) * 0.35 : (12 - y) * 0.35);
    if (enAguja && y >= 2 && y <= 11) return y < 7 ? "r" : "w";
    return x + y < 9 ? "W" : "w";
});

const ESPIRAL = [
    "....bbbbbb....",
    "..bbBBBBBBbb..",
    ".bBB.....nBbn.",
    ".bB.bbbbn.Bbn.",
    "bB.bBBBBbn.Bn.",
    "bB.bB..nBb.Bn.",
    "bB.bB.bnBb.Bn.",
    "bB.bB.bbn..Bn.",
    "bB..bB....Bbn.",
    ".bB..bbbbBbn..",
    ".bBB.....bn...",
    "..bbBBBBbn....",
    "....nnnnn.....",
];

const ALERTA = [
    "......yy......",
    ".....yYYy.....",
    ".....yYYy.....",
    "....yYyyyo....",
    "....yYxxyo....",
    "...yYyxxyyo...",
    "...yYyxxyyo...",
    "..yYyyxxyyyo..",
    "..yYyyxxyyyo..",
    ".yYyyyyyyyyyo.",
    ".yYyyyxxyyyyo.",
    "yYyyyyxxyyyyyo",
    "oooooooooooooo",
];

const CAMPANA = [
    "......yy......",
    ".....yYYo.....",
    "....yYYyyo....",
    "...yYYyyyyo...",
    "...yYyyyyyo...",
    "...yYyyyyyo...",
    "...yYyyyyyo...",
    "..yYyyyyyyyo..",
    "..yYyyyyyyyo..",
    ".yYyyyyyyyyyo.",
    "yyyyyyyyyyyyyo",
    "oooooooooooooo",
    ".....ooOO.....",
    "......OO......",
];

const SIN_CAMPANA = encima(recolor(CAMPANA, { Y: "s", y: "S", o: "k", O: "k" }), [
    "r.............",
    ".r............",
    "..r...........",
    "...r..........",
    "....r.........",
    ".....r........",
    "......r.......",
    ".......r......",
    "........r.....",
    ".........r....",
    "..........r...",
    "...........r..",
    "............r.",
    ".............r",
]);

const CALENDARIO = [
    "..s......s....",
    "rrsrrrrrrsrrrd",
    "rRRRRRRRRRRRRd",
    "rrrrrrrrrrrrrd",
    "wwwwwwwwwwwwws",
    "wsswsswsswssws",
    "wwwwwwwwwwwwws",
    "wsswsswsswrrws",
    "wwwwwwwwwwwwws",
    "wsswsswsswssws",
    "wwwwwwwwwwwwws",
    "ssssssssssssss",
];

// Sol: círculo de oro con rayos.
const SOL = pintar(14, 14, (x, y) => {
    const d = distancia(x, y);
    if (d < 3.8) return x + y < 11 ? "Y" : x + y > 15 ? "o" : "y";
    const rayo = (x === 6 || x === 7 || y === 6 || y === 7) && d < 6.8 && d > 4.6;
    const diagonal = (Math.abs(x - y) <= 0 || Math.abs(x + y - 13) <= 0) && d < 6.3 && d > 4.8;
    return rayo || diagonal ? "a" : null;
});

const AMANECER = encima(pintar(14, 14, (x, y) => {
    if (y > 9) return null;
    const d = distancia(x, y, 6.5, 9.5);
    if (d < 4.2) return y < 8 ? "Y" : "y";
    if ((x + y) % 3 === 0 && d < 6.6 && d > 5) return "a";
    return null;
}), [
    "", "", "", "", "", "", "", "", "", "",
    "bbbbbbbbbbbbbb",
    "nnBnnnnnBnnnnn",
    "nnnnnnBnnnnnnn",
]);

const EXPLOSION = [
    "......a.......",
    "..a...aa...a..",
    "..aa..aAa.aa..",
    "...aAaAYAaAa..",
    "....aAYYYAa...",
    ".aaaAYWWYYAaaa",
    "..aAYWWWWYAa..",
    "...aAYWWYYAa..",
    "..aaAYYYYAaa..",
    ".aa.aAYYAa.aa.",
    "....aAaaAa....",
    "...aa.aa..a...",
    "..a...a.......",
];

const LISTA = [
    "....ssss....",
    ".tttsWWsttt.",
    "tTwwwwwwwwtm",
    "tTwxxwwwwwtm",
    "tTwwwwwwwwtm",
    "tTwxwsssswtm",
    "tTwwwwwwwwtm",
    "tTwxwsssswtm",
    "tTwwwwwwwwtm",
    "tTwxwssswwtm",
    "tTwwwwwwwwtm",
    "tmmmmmmmmmmm",
];

const BANDERA = [
    "tWxWxWxW......",
    "twWxWxWx......",
    "tWxWxWxW......",
    "twWxWxWx......",
    "tWxWxWxW......",
    "t.............",
    "t.............",
    "t.............",
    "t.............",
    "t.............",
    "m.............",
];

const ESPEJO = pintar(12, 14, (x, y) => {
    const dx = (x - 5.5) / 5.6, dy = (y - 6) / 6.5;
    if (y >= 13) return x >= 4 && x <= 7 ? "o" : null;
    const r = Math.hypot(dx, dy);
    if (r > 1) return null;
    if (r > 0.8) return x + y > 13 ? "o" : "y";
    if (x - y > 2 && x - y < 5) return "W";
    return x + y < 10 ? "B" : "b";
});

const CADENA = [
    "..ssss........",
    ".sw..ss.......",
    ".s....s.......",
    ".s...sssS.....",
    ".ss.sw.sSS....",
    "..ssssSs..S...",
    "....s..sS.S...",
    "....ss.sssss..",
    ".....SSss..sS.",
    ".......s....S.",
    ".......s....S.",
    ".......sS..SS.",
    "........SSSS..",
];

const ROCA = [
    ".....sssss....",
    "...sswwwsssS..",
    "..swwwssssSSS.",
    ".swwsssssSSSSk",
    "swwssssSSSSSSk",
    "swsssssSSSSSkk",
    "sssssSSSSSSSkk",
    ".SSSSSSSSSSkk.",
    "..kkkkkkkkkk..",
];

const BOMBILLA = [
    "....yyyyy...",
    "...yYYYyyo..",
    "..yYWYyyyyo.",
    "..yYYyyyyyo.",
    "..yYyyyyyyo.",
    "..yyyyyyyyo.",
    "...yyyyyyo..",
    "....yyyyo...",
    "....sssss...",
    "....wwwws...",
    "....sssss...",
    ".....SSS....",
];

const NOTA = [
    "......ppp.....",
    "......pPPpp...",
    "......p..PPp..",
    "......p....p..",
    "......p.......",
    "......p.......",
    "......p.......",
    "...pppp.......",
    "..pPPpp.......",
    "..pPppq.......",
    "...qqq........",
];

const NOTAS = [
    "...pppppppp...",
    "...pPPPPPPp...",
    "...p......p...",
    "...p......p...",
    "...p......p...",
    "...p......p...",
    "pppp...pppp...",
    "PPpp..pPPpp...",
    "Ppqq..pPppq...",
    ".qq....qqq....",
];

const BALANZA = [
    "......yy......",
    ".yyyyyYYyyyyy.",
    ".o....yo....o.",
    ".o....yo....o.",
    "o.o...yo...o.o",
    "o.o...yo...o.o",
    "yyyo..yo..yyyo",
    ".oo...yo...oo.",
    "......yo......",
    "......yo......",
    "....yyyyoo....",
    "...oooooooo...",
];

const MARTILLO = [
    "..sssssss.....",
    ".sWwwwwwSk....",
    ".swwwwwwSk....",
    "..kkSttkk.....",
    "....tTm.......",
    "....tTm.......",
    "....tTm.......",
    "....tTm.......",
    "....tTm.......",
    "....tTm.......",
    "....tmm.......",
    "....mmm.......",
];

const PICO = [
    "..sssss.......",
    ".sWwwwwss.....",
    "sw...tt.Sss...",
    "s....tTm..Ss..",
    "s.....tTm..S..",
    "s......tTm..S.",
    "........tTm...",
    ".........tTm..",
    "..........tTm.",
    "...........tm.",
];

const DEMONIO = [
    "w............w",
    "ws..........ws",
    ".wsrrrrrrrrsw.",
    "..rRRrrrrrrd..",
    ".rRrrrrrrrrrd.",
    ".rRyyrrrryyrd.",
    ".rRyxrrrrxyrd.",
    ".rrrrrddrrrrd.",
    ".rrwrwrrwrwrd.",
    ".rrxxxxxxxxrd.",
    "..rrwrrrwrrd..",
    "...rrrrrrdd...",
    ".....dddd.....",
];

const CONFETI = [
    "...........b..",
    "..r.....y.....",
    "......g....p..",
    "..........y...",
    ".......yy.....",
    "......yyyo..r.",
    ".....yYyyo....",
    "....yYyyo..g..",
    "...yYyyo......",
    "..rRyyo...b...",
    ".rRrro........",
    "rRrrd.........",
    "rrdd..........",
];

const COPO = [
    "......BB......",
    "...B..BB..B...",
    "....B.BB.B....",
    ".....BBBB.....",
    ".B....BB....B.",
    "..B...BB...B..",
    "BBBBBBWWBBBBBB",
    "BBBBBBWWBBBBBB",
    "..B...BB...B..",
    ".B....BB....B.",
    ".....BBBB.....",
    "....B.BB.B....",
    "...B..BB..B...",
    "......BB......",
];

const HOJA = [
    "...........gg.",
    "........ggGGg.",
    "......gGGGggv.",
    "....gGGggggvv.",
    "...gGgggggvv..",
    "..gGggggvvv...",
    "..gGgggvvv....",
    ".gGggvvvv.....",
    ".ggvvvvv......",
    ".vvvvv........",
    "v.............",
];

const BROTE = [
    ".gg.....gg....",
    "gGGg...gGGg...",
    "gGggg.gggGg...",
    ".gggvgvgggv...",
    "..vvvvgvvv....",
    "......g.......",
    "......g.......",
    "......v.......",
    "..mmmmmmmmm...",
    ".mtTtttttttm..",
    "..mtttttttm...",
    "...mmmmmmm....",
];

const ARCO = [
    ".......mw.....",
    "......t.w.....",
    ".....t..w.....",
    "....t...w.....",
    "....t...w.....",
    ".s.t....w...r.",
    "Ssstmmmmwmmrrr",
    ".s.t....w...r.",
    "....t...w.....",
    "....t...w.....",
    ".....t..w.....",
    "......t.w.....",
    ".......mw.....",
];

const CLAQUETA = [
    "WWxxWWxxWWxxWW",
    "WxxWWxxWWxxWWx",
    "xxWWxxWWxxWWxx",
    "kkkkkkkkkkkkkk",
    "kSSSSSSSSSSSSk",
    "kSwwwwSwwwwSSk",
    "kSSSSSSSSSSSSk",
    "kSwwwwwwwSSSSk",
    "kSSSSSSSSSSSSk",
    "kkkkkkkkkkkkkk",
];

// Caras (el ánimo del día). Todas comparten la cabeza; cambia la boca y los ojos.
const CABEZA = pintar(14, 14, (x, y) => {
    const d = distancia(x, y);
    if (d > 6.6) return null;
    return x + y < 8 ? "Y" : x + y > 16 ? "o" : "y";
});
const cara = (rasgos) => encima(CABEZA, rasgos);
const CARA_FELIZ = cara([
    "", "", "", "",
    "....x....x....",
    "....x....x....",
    "", "",
    "..x........x..",
    "...x......x...",
    "....xxxxxx....",
]);
const CARA_RIENDO = cara([
    "", "", "", "",
    "...x.x..x.x...",
    "....x....x....",
    "", "",
    "...xxxxxxxx...",
    "...xWWWWWWx...",
    "....xrrrrx....",
    ".....xxxx.....",
]);
const CARA_NORMAL = cara([
    "", "", "", "",
    "....x....x....",
    "....x....x....",
    "", "", "",
    "....xxxxxx....",
]);
const CARA_TRISTE = cara([
    "", "", "",
    "...x......x...",
    "....x....x....",
    "....x....x....",
    "", "", "",
    "....xxxxxx....",
    "...x......x...",
]);
const CARA_AGOTADA = cara([
    "", "", "",
    "...xx....xx...",
    ".....x..x.....",
    "...xx....xx...",
    "", "",
    ".....xxxx.....",
    "....x....x....",
    "....xxxxxx....",
]);
const CARA_ENOJADA = recolor(cara([
    "", "", "",
    "...xx....xx...",
    ".....x..x.....",
    "....x....x....",
    "", "", "",
    "....xxxxxx....",
    "...x......x...",
]), { Y: "R", y: "r", o: "d" });

const DRAGON = [
    ".m.........m..",
    ".mm.......mm..",
    "..vgggggggv...",
    ".vgGGgggggvv..",
    "vgGyxggggxyvv.",
    "vgGggggggggvv.",
    "vgggggggggggvv",
    ".vggGgggggggv.",
    "..vgGWgWgWgv..",
    "...vggggggv...",
    "....vvvvvv....",
];

const CASCO = [
    "......rRr.....",
    ".....rRrd.....",
    "....swwwws....",
    "...sWwwwwwS...",
    "..sWwwwwwwwS..",
    "..sWwwwwwwwS..",
    "..sxxxxxxxxS..",
    "..sWwwwwwwwS..",
    "..sWwxwxwxwS..",
    "..sWwwwwwwwS..",
    "..sWwxwxwxwS..",
    "...swwwwwwS...",
    "....SSSSSS....",
];

// Engranaje: un aro con 8 dientes (cos(8 × ángulo) dice si estamos sobre un diente).
const ENGRANAJE = pintar(14, 14, (x, y) => {
    const d = distancia(x, y), angulo = Math.atan2(y - 6.5, x - 6.5);
    const diente = d <= 6.8 && d > 4.4 && Math.cos(8 * angulo) > 0.25;
    if (!diente && (d > 4.8 || d <= 2)) return null;
    return x + y < 11 ? "w" : x + y > 15 ? "S" : "s";
});

const DISQUETE = [
    "nbbssssssbb.",
    "nbbsSSxssbbn",
    "nbbsSSxssbbn",
    "nbbssssssbbn",
    "nbbbbbbbbbbn",
    "nbwwwwwwwwbn",
    "nbwsssssswbn",
    "nbwwwwwwwwbn",
    "nbwsssssswbn",
    "nbwwwwwwwwbn",
    "nnnnnnnnnnnn",
];

const PORTATIL = [
    "..kkkkkkkkkk..",
    "..kbbbbbbbbk..",
    "..kbBbbbbbbk..",
    "..kbbbbbbbbk..",
    "..kbbbbbbbbk..",
    "..kkkkkkkkkk..",
    ".ssssssssssss.",
    "sWwwwwwwwwwwws",
    "SSSSSSSSSSSSSS",
];

const PALANCA = [
    "......rr......",
    ".....rRrd.....",
    ".....rrrd.....",
    "......dd......",
    "......ss......",
    "......ss......",
    "..kkkkSSkkkk..",
    ".kssssssssssk.",
    "kssbbsssrrsssk",
    "kSSSSSSSSSSSSk",
    ".kkkkkkkkkkkk.",
];

const PALETA_PINTOR = [
    "...TTTTTT.....",
    ".TTTTTTTTTT...",
    "TTrrTTTbbTTT..",
    "TTrrTTTbbTTTT.",
    "TTTTTTTTTTyyT.",
    "TTgg.TTTTTyyTT",
    "TTgg..TTTTTTTt",
    ".TTT..TTTTppTt",
    ".TTTTTTTTTppt.",
    "..ttTTTTTTtt..",
    "....tttttt....",
];

const PALMERA = [
    "...gggg.gggg..",
    ".ggGGggggGGgg.",
    "gGg...tt...gGg",
    "g.....tt.....g",
    "......tm......",
    ".....tm.......",
    ".....tm.......",
    ".....tm.......",
    "......tm......",
    "......tm......",
    "..TTTTTTTTTT..",
    "TTTTTTTTTTTTTT",
];

const TORMENTA = [
    ".....sss......",
    "....sWwws.....",
    "..sswwwwwss...",
    ".swwwwwwwwws..",
    "swwwwwwwwwwws.",
    "SSSSSSSSSSSSS.",
    ".....yy.......",
    "....yy........",
    "...yyyy.......",
    ".....yy.......",
    "....yy........",
    "....y.........",
];

const NIEBLA = [
    ".wwwwwwwww....",
    "",
    "...ssssssssss.",
    "",
    "wwwwwww.wwww..",
    "",
    "..ssssssssss..",
    "",
    ".wwww.wwwwww..",
];

const FUENTE = [
    "......B.......",
    ".....BbB......",
    "....B.b.B.....",
    "...B..b..B....",
    "......b.......",
    "..ssssssssss..",
    ".sBBBBBBBBBBs.",
    ".swwwwwwwwwws.",
    "..ssswwwwsss..",
    "....swwwws....",
    "..ssssssssss..",
];

const CONCHA = [
    ".....AAAA.....",
    "...AAaAAaAA...",
    "..AaAAaAAaAA..",
    ".AaAAAaAAAaAA.",
    ".AaAAAaAAAaAA.",
    "AaAAAAaAAAAaAA",
    "AaAAAAaAAAAaAz",
    "zaaaaaaaaaaaaz",
    "..zzz.zz.zzz..",
];

const CAJA = [
    "..TTTTTTTTTT..",
    ".TTTTTyyTTTTt.",
    "TTTTTTyyTTTTtt",
    "tttttttttttttm",
    "tTTTTTyyTTTTtm",
    "tTttttyytttttm",
    "tTttttyytttttm",
    "tTttttyytttttm",
    "tTttttyytttttm",
    "tttttttttttttm",
    "mmmmmmmmmmmmmm",
];

const CORREDOR = [
    "........ff....",
    ".......fFFf...",
    ".......fFf....",
    ".....bbbb.....",
    "....bBbbbbff..",
    "...ff.bbb.....",
    "......bbb.....",
    ".....nn.nn....",
    "....nn...nn...",
    "...nn.....nnx.",
    ".xx...........",
];

const MONTANA = [
    "......ww......",
    ".....wWww.....",
    "....wwwsws....",
    "...sSwsSSSS...",
    "..sSSSSSSSSk..",
    "..sSSSSSSSSkk.",
    ".sSSSSSSSSSkk.",
    ".sSSSSSSSSkkkk",
    "sSSSSSSSSSkkkk",
    "kkkkkkkkkkkkkk",
];

const PIERNA = [
    "....fff.......",
    "....fFFf......",
    "....fFFf......",
    "....fFFf......",
    "....fFFff.....",
    ".....fFFf.....",
    ".....fFFf.....",
    ".....fFFf.....",
    ".....fFFf.....",
    ".....fFFffff..",
    ".....hhhhhhhh.",
];

const REGLA = [
    "yyyyyyyyyyyyyy",
    "yxyxyxyxyxyxyy",
    "yxyyyxyyyxyyyo",
    "yyyyyyyyyyyyyo",
    "oooooooooooooo",
];

const MARIQUITA = [
    "...x....x...",
    "....x..x....",
    "....xxxx....",
    "..rrrxxrrr..",
    ".rRrrxxrrxr.",
    ".rRxrrxrrrr.",
    ".rrrrrxrxrr.",
    "..rrxrxrrr..",
    "...rrrxrr...",
];

const OJOS = [
    ".www....www.",
    "wwwww..wwwww",
    "wwxxw..wwxxw",
    "wwxxw..wwxxw",
    "wwwww..wwwww",
    ".www....www.",
];

const INVASOR = [
    "..p.....p..",
    "...p...p...",
    "..ppppppp..",
    ".pp.ppp.pp.",
    "ppppppppppp",
    "p.ppppppp.p",
    "p.p.....p.p",
    "...pp.pp...",
];

const ALTAVOZ = [
    ".....S........",
    "....sS..b.....",
    "sssssS...b....",
    "swwwsS.b..b...",
    "swwwsS..b.b...",
    "swwwsS.b..b...",
    "sssssS...b....",
    "....sS..b.....",
    ".....S........",
];

const PUERTA = [
    "..mmmmmm..",
    ".mTTttttm.",
    "mTtmtttmtm",
    "mTtmtttmtm",
    "mTtmtttmtm",
    "mTtmtttmtm",
    "mTtmtttyym",
    "mTtmtttmtm",
    "mTtmtttmtm",
    "mTtmtttmtm",
    "mTtmtttmtm",
    "mmmmmmmmmm",
];

const TROMPETA = [
    "...........y..",
    "..........yy..",
    "yyyyyyyyyyYy..",
    "yoooooyoooYyy.",
    "yyyyyyyyyyYy..",
    "....o.o...yy..",
    "...........y..",
];

const HERRAMIENTAS = [
    "....ssssss....",
    "....s....s....",
    "rrrrrrrrrrrrrr",
    "rRRRRRRRRRRRRd",
    "rRrrrrssrrrrrd",
    "ddddddssdddddd",
    "rRrrrrrrrrrrrd",
    "rRrrrrrrrrrrrd",
    "dddddddddddddd",
];

const COPA = [
    ".ww.....ww.",
    ".w.......w.",
    ".wrrrrrrrw.",
    ".wRrrrrrdw.",
    "..wrrrrdw..",
    "...wwwww...",
    ".....w.....",
    ".....w.....",
    ".....w.....",
    "...wwwww...",
];

const PALOMA = [
    ".......www....",
    "......wWxwa...",
    "ww....wwww....",
    "wWw..wwwws....",
    ".wWwwwwwws....",
    "..wwwwwwwsss..",
    "...swwwwwss...",
    "....sssss.....",
];

const CAMISETA = [
    "..bbb....bbb..",
    ".bBBbb..bbBbb.",
    "bBBbbbbbbbbbbn",
    "bBbbbbbbbbbbbn",
    ".nnbbbbbbbbnn.",
    "...bBbbbbbbn..",
    "...bBbbbbbbn..",
    "...bBbbbbbbn..",
    "...bbbbbbbbn..",
    "...nnnnnnnnn..",
];

const TAMBOR = [
    "...wwwwwwww...",
    ".wwWWWWWWWWww.",
    ".swwwwwwwwwws.",
    ".rrrrrrrrrrrd.",
    ".ryrrryrrryrd.",
    ".rrryrrryrrrd.",
    ".ryrrryrrryrd.",
    ".yyyyyyyyyyyo.",
    "..oooooooooo..",
];

const TEMPLO = [
    "......ww......",
    "....wwwwww....",
    "..wwwwwwwwww..",
    "wwwwwwwwwwwwww",
    ".ssssssssssss.",
    ".wS.wS..wS.wS.",
    ".wS.wS..wS.wS.",
    ".wS.wS..wS.wS.",
    ".wS.wS..wS.wS.",
    ".wS.wS..wS.wS.",
    "ssssssssssssss",
    "SSSSSSSSSSSSSS",
];

const CERRAR = [
    "ss........ss",
    "sWs......sWs",
    ".sWs....sWs.",
    "..sWs..sWs..",
    "...sWssWs...",
    "....sWWs....",
    "....sWWs....",
    "...sWssWs...",
    "..sWs..sWs..",
    ".sWs....sWs.",
    "sWs......sWs",
    "ss........ss",
];

const LAPIZ = [
    "...........iK.",
    "..........sKKi",
    ".........ysKi.",
    "........yyys..",
    ".......yYyo...",
    "......yYyo....",
    ".....yYyo.....",
    "....yYyo......",
    "...yYyo.......",
    "..TYyo........",
    ".TTto.........",
    ".Ttt..........",
    "xt............",
];

const LUPA = [
    "...ssss.......",
    "..sBBBBs......",
    ".sBWBBbbs.....",
    "sBWBbbbbbs....",
    "sBBbbbbbbs....",
    "sBbbbbbbbs....",
    "sbbbbbbbbs....",
    ".sbbbbbbs.....",
    "..sbbbbsS.....",
    "...ssssSmt....",
    "........mtt...",
    ".........mtt..",
    "..........mtt.",
    "...........mm.",
];

const REPRODUCIR = [
    "ww........",
    "wWww......",
    "wWWwww....",
    "wWWWWwww..",
    "wWWWWWWwws",
    "wWWWWWWwss",
    "wWWWWwss..",
    "wWWwss....",
    "wwss......",
    "ss........",
];

const SALTAR = [
    "w.....w.....ss",
    "ww....ww....ss",
    "wWw...wWw...ss",
    "wWWw..wWWw..ss",
    "wWWWw.wWWWw.ss",
    "wWWw..wWWw..ss",
    "wWw...wWw...ss",
    "ww....ww....ss",
    "w.....w.....ss",
];

const VOLVER = [
    "..w...........",
    ".wW...........",
    "wWWwwwwwwww...",
    "wWWWWWWWWWWw..",
    ".wW.......Ww..",
    "..w.......Ww..",
    "..........Ww..",
    "......wwwwWw..",
    "......wWWWWw..",
];

const ARRIBA = [
    "....ww....",
    "...wWWw...",
    "..wWWWWw..",
    ".wWWWWWWw.",
    "wwwWWWWwww",
    "...wWWw...",
    "...wWWw...",
    "...wWWw...",
    "...wWWw...",
    "...wwww...",
];

const ABAJO = [
    "...wwww...",
    "...wWWw...",
    "...wWWw...",
    "...wWWw...",
    "...wWWw...",
    "wwwWWWWwww",
    ".wWWWWWWw.",
    "..wWWWWw..",
    "...wWWw...",
    "....ww....",
];

const AMBOS = [
    "....ww....",
    "...wWWw...",
    "..wWWWWw..",
    ".wwwWWwww.",
    "...wWWw...",
    "...wWWw...",
    ".wwwWWwww.",
    "..wWWWWw..",
    "...wWWw...",
    "....ww....",
];

const MAS = [
    "...gggg...",
    "...gGGv...",
    "...gGGv...",
    "gggGGGGggg",
    "gGGGGGGGGv",
    "gvvGGGGvvv",
    "...gGGv...",
    "...gGGv...",
    "...gvvv...",
];

const PREGUNTA = [
    "..wwwwww..",
    ".wWWWWWWw.",
    "wWWw..wWWs",
    "wWw....wWs",
    "......wWWs",
    ".....wWWs.",
    "....wWWs..",
    "....wWs...",
    "....wWs...",
    "..........",
    "....wWs...",
    "....wss...",
];

const LUNA_NUEVA = [
    "....kkkk....",
    "..kkSSSSkk..",
    ".kSSkkkkkkk.",
    ".kSkkkkkkkx.",
    "kSkkkkkkkkkx",
    "kSkkkkkkkkkx",
    "kkkkkkkkkkkx",
    "kkkkkkkkkkxx",
    ".kkkkkkkkxx.",
    ".kkkkkkkxxx.",
    "..kkkkxxxx..",
    "....xxxx....",
];

const MANOS = [
    "......hh......",
    ".....fFFf.....",
    ".....fFhf.....",
    "....fFFhFf....",
    "....fFFhFf....",
    "...fFFfhfFf...",
    "...fFFfhfFf...",
    "..fFFffhffFf..",
    "..fFfffhfffh..",
    "..fffffhffhh..",
    "...ffffhfhh...",
    "...bbbbbbbb...",
    "...bnnnnnnb...",
];

const CARNE = [
    "..........wW..",
    ".........wWWw.",
    "..dddd..wWWw..",
    ".dRRrrd.wWw...",
    "dRRrrrrdww....",
    "drRrrrrrd.....",
    "drrrrrrrd.....",
    "dddrrrrdd.....",
    ".wwddddd......",
    "wWWw..........",
    "wWw...........",
];

const HACHA = [
    "....ssss......",
    "...sWwwss.....",
    "..sWwwwsS.....",
    "..sWwwsSttt...",
    "...sssSttm....",
    "......tTm.....",
    ".....tTm......",
    "....tTm.......",
    "...tTm........",
    "..tTm.........",
    ".tTm..........",
    "tmm...........",
];

const PINO = [
    "......gg......",
    ".....gGGv.....",
    "....gGgggv....",
    "...gGgggggv...",
    ".....gGgv.....",
    "....gGgggv....",
    "...gGgggggv...",
    "..gGgggggggv..",
    "....gGgggv....",
    "...gGgggggvv..",
    "..gGgggggggvv.",
    ".ggggggggggvvv",
    "......tm......",
    "......tm......",
];

const OLA = [
    "......bbbb....",
    "....bbBBBBb...",
    "...bBWWWWBBb..",
    "..bBW....bBb..",
    ".bBW.....bBb..",
    ".bW....bbBb...",
    "bBW..bbBBb....",
    "bBbbbBBBbbbbb.",
    "nbBBBBBBBBBBbn",
    "nnbbbbbbbbbbnn",
    "NnnnnnnnnnnnnN",
];

const FUGAZ = [
    "..........y...",
    ".........yYy..",
    "......yyyYWYyy",
    ".........yYy..",
    "........B.y...",
    ".......B......",
    "......b.......",
    ".....b........",
    "....n.........",
    "...n..........",
];

const TORO = [
    "w............w",
    "ws..........ws",
    ".ws..tttt..ws.",
    "..wttTTTTttw..",
    "..tTTttttTTt..",
    ".ttTxttttxTtt.",
    "..tTtttttttt..",
    "...tFFFFFFt...",
    "...fFxFFxFf...",
    "....ffffff....",
];

const LADRILLOS = [
    "rRrrrsrRrrrrs",
    "rrrrdsrrrrrds",
    "sssssssssssss",
    "rrsrRrrrrsrRr",
    "rdsrrrrrdsrrd",
    "sssssssssssss",
    "rRrrrsrRrrrrs",
    "rrrrdsrrrrrds",
];

const BUHO = [
    "..t........t..",
    "..tt......tt..",
    "..tTttttttTt..",
    ".tTwwttttwwTt.",
    ".tw.wtttw.wtt.",
    ".twwwtyytwwwt.",
    ".tTtttyyttttm.",
    ".tTtTTTTTTtmm.",
    ".tTTtTTtTTtmm.",
    "..tTTTTTTTmm..",
    "...tmmmmmmm...",
    "....y....y....",
];

const AGUJERO = [
    "....kkkkkk....",
    "..kkxxxxxxkk..",
    ".kxxxxxxxxxxk.",
    "kxxxxxxxxxxxxk",
    ".kxxxxxxxxxxk.",
    "..kkxxxxxxkk..",
    "....kkkkkk....",
];

const CARPETA = [
    "ooooo.........",
    "oYYYYo........",
    "oYyyyyoooooooo",
    "oYyyyyyyyyyyyO",
    "oYyyyyyyyyyyyO",
    "oYyyyyyyyyyyyO",
    "oYyyyyyyyyyyyO",
    "oYyyyyyyyyyyyO",
    "oyyyyyyyyyyyyO",
    "OOOOOOOOOOOOOO",
];

const PERSONA = [
    ".....ff.....",
    "....fFFf....",
    "....fFFf....",
    ".....ff.....",
    "...bbbbbb...",
    "..bBbbbbbn..",
    "..bBbbbbbn..",
    "..fbBbbbnf..",
    "...bBbbbn...",
    "...nn..nn...",
    "...nn..nn...",
    "...nn..nn...",
    "..xxx..xxx..",
];


const SENALA = [
    "..ffff........",
    ".fFFFFfffffff.",
    "fFFFFFFFFFFFFf",
    "fFFFffffffff..",
    "fFFFFFf.......",
    "fFFFFFf.......",
    ".fFFFFh.......",
    "..hhhh........",
];

const CAMARA = [
    "...kkkk.......",
    ".kkkSSkkkkkkk.",
    "kSSSSSSSSSSyk.",
    "kSSSkkkkkSSSk.",
    "kSSkbbbbbkSSk.",
    "kSSkbBbbbkSSk.",
    "kSSkbbbbnkSSk.",
    "kSSSkkkkkSSSk.",
    "kSSSSSSSSSSSk.",
    ".kkkkkkkkkkk..",
];

const MOVIL = [
    "kkkkkkkk",
    "kbbbbbbk",
    "kbBbbbbk",
    "kbbbbbbk",
    "kbbbbbbk",
    "kbbbbbbk",
    "kbbbbbbk",
    "kbbbbbbk",
    "kkkkkkkk",
    "kkkwwkkk",
    "kkkkkkkk",
];

const NUMEROS = [
    "nnnnnnnnnnnnnn",
    "nbbbbbbbbbbbbn",
    "nbWbbWWbbWWbbn",
    "nWWbbbbWbbbWbn",
    "nbWbbbWbbbWWbn",
    "nbWbbWbbbbbWbn",
    "nWWWbWWWbWWbbn",
    "nbbbbbbbbbbbbn",
    "nnnnnnnnnnnnnn",
];

const REPETIR = [
    "...bbbbbbbb.b.",
    "..bBBBBBBBBbBb",
    ".bB........bBb",
    "bB........bBBb",
    "bB............",
    "bB..........Bb",
    "............Bb",
    "bBBb........Bb",
    "bBb........Bb.",
    "bBbBBBBBBBBb..",
    ".b.bbbbbbbb...",
];

const CABALLO = [
    "....mm........",
    "...mtTt.......",
    "..mtTTtt......",
    ".mtTTxTtt.....",
    "mtTTTTTttt....",
    "tTTTTTTtttt...",
    "ttTTTttttttm..",
    ".tttm..tttttm.",
    "..mm...ttttttm",
    ".......tttttmm",
    "........tttmm.",
];

const CARRITO = [
    "ss............",
    ".s............",
    ".swwwwwwwwwww.",
    ".swsswsswsswS.",
    "..swwwwwwwwS..",
    "..swsswsswsS..",
    "...sssssssS...",
    "...s..........",
    "...ssssssssss.",
    "....xx....xx..",
    "....xx....xx..",
];

const CACTUS = [
    ".....gg.......",
    "....gGGv......",
    "....gGgv..gg..",
    "....gGgv.gGgv.",
    ".gg.gGgv.gGgv.",
    "gGgvgGgvgGgv..",
    "gGgvgGgvvvv...",
    "gGgvgGgv......",
    ".vvvgGgv......",
    "....gGgv......",
    "....gGgv......",
    "...TTTTTTT....",
    "...tttttttm...",
];

const MOCHILA = [
    "....tttt....",
    "...t....t...",
    "..rrrrrrrr..",
    ".rRRRRRRRRd.",
    ".rRrrrrrrrd.",
    ".rRryyyyrrd.",
    ".rRrryyrrrd.",
    ".rRrrrrrrrd.",
    ".rRrrrrrrrd.",
    ".rrrrrrrrdd.",
    "..dddddddd..",
];

const DADO = [
    "..wwwwwwwwww..",
    ".wWWWWWWWWWws.",
    "wWxWWWWWWWxWws",
    "wWWWWWWWWWWWws",
    "wWWWWWxWWWWWws",
    "wWWWWWWWWWWWws",
    "wWxWWWWWWWxWws",
    "wwwwwwwwwwwwws",
    ".ssssssssssss.",
];

const CUADRO = [
    "yyyyyyyyyyyyyy",
    "yobbbbbbbbbboy",
    "yobbBbbbbbbboy",
    "yobbbbbbyybboy",
    "yobbbbbbyybboy",
    "yobgbbbbbbbboy",
    "yoggggbbgbbboy",
    "yogggggggggvoy",
    "yoooooooooooOy",
    "yyyyyyyyyyyyyy",
];

const IRA = [
    "..rr....rr..",
    "..rR....Rr..",
    "rrrR....Rrrr",
    "rRR......RRr",
    "............",
    "............",
    "rRR......RRr",
    "rrrR....Rrrr",
    "..rR....Rr..",
    "..rr....rr..",
];

const MASCARA = [
    ".wwwwwwwwwww..",
    "wWWWWWWWWWWWs.",
    "wWW..WWW..WWs.",
    "wWW..WWW..WWs.",
    "wWWWWWWWWWWWs.",
    "wWWWWW.WWWWWs.",
    ".wWW.WWW.WWs..",
    ".wWWW...WWWs..",
    "..wWWWWWWWs...",
    "...wsssss.....",
];

const LUNA_LLENA = [
    "....yyyy....",
    "..yyYYYYyy..",
    ".yYYYYyyyyy.",
    ".yYYoYyyyyo.",
    "yYYyyyyyoyyo",
    "yYyyyyyyyyyo",
    "yyyyoyyyyyyo",
    "yyyyyyyyyyoo",
    ".yyyyyyoyyo.",
    ".yyyyyyyyoo.",
    "..yyyyyooo..",
    "....oooo....",
];

const MEDALLA_PLATA = [
    ".rr......bb.",
    ".rRr....bBb.",
    "..rRr..bBb..",
    "...rRrbBb...",
    "....rrbb....",
    "....wwww....",
    "...wWWwws...",
    "..wWwwwwws..",
    "..wWwswwws..",
    "..wwwwwwws..",
    "..wwwwwwss..",
    "...wwwwss...",
    "....ssss....",
];

const MEDALLA_BRONCE = [
    ".rr......bb.",
    ".rRr....bBb.",
    "..rRr..bBb..",
    "...rRrbBb...",
    "....rrbb....",
    "....tttt....",
    "...tTTttm...",
    "..tTttttttm.",
    "..tTtmtttm..",
    "..ttttttttm.",
    "..ttttttmm..",
    "...ttttmm...",
    "....mmmm....",
];

const CIRCULO_VIOLETA = [
    "..pppppp..",
    ".pPPppppq.",
    "pPPppppppq",
    "pPppppppqq",
    "pppppppppq",
    "pppppppqqq",
    ".ppppqqqq.",
    "..qqqqqq..",
];

const CIRCULO_AMARILLO = [
    "..yyyyyy..",
    ".yYYyyyyo.",
    "yYYyyyyyyo",
    "yYyyyyyyoo",
    "yyyyyyyyyo",
    "yyyyyyyooo",
    ".yyyyoooo.",
    "..oooooo..",
];

const CUADRO_ROJO = [
    "rrrrrrrrrr",
    "rRRRRRRRRd",
    "rRrrrrrrrd",
    "rRrrrrrrrd",
    "rRrrrrrrrd",
    "rRrrrrrrrd",
    "rRrrrrrrrd",
    "rddddddddd",
];

const CUADRITO = [
    "wwwwww",
    "wWWWWs",
    "wWWWWs",
    "wWWWWs",
    "wWWWWs",
    "wsssss",
];

const ALA = [
    "..........ww",
    "........wwWw",
    "......wwWWws",
    "....wwWWWwws",
    "..wwWWWwwss.",
    "wwWWWwwwss..",
    "wWWwwwsss...",
    ".wwwsss.....",
    "..sss.......",
];

const PAISAJE = [
    "BBBBBBBBBBBBBB",
    "BBBBBBwBBBBBBB",
    "BBBBBwsSBBBBBB",
    "BBBBwssSSBBBgg",
    "BBBwsssSSSBggg",
    "gggsssSSSSgggg",
    "ggggggggggggvv",
    "ggbbbbbbbbbbgg",
    "gbbBbbbbbbbbbg",
    "vvvvvvvvvvvvvv",
];

const DESIERTO = [
    "BBBBBBBBByyBBB",
    "BBBBBBBByYYyBB",
    "BBBBBBBBByyBBB",
    "BBBBBBBBBBBBBB",
    "BBBTTBBBBBBBBB",
    "BBTTTTBBBBTTBB",
    "BTTTTTTTBTTTTB",
    "TTTTttTTTTTTTT",
    "TTTttttTTTTttT",
    "tttttttttttttt",
];

const VIAS = [
    ".....s..s.....",
    ".....s..s.....",
    "....mmmmmm....",
    "....s....s....",
    "...mmmmmmmm...",
    "...s......s...",
    "..mmmmmmmmmm..",
    "..s........s..",
    ".mmmmmmmmmmmm.",
    ".s..........s.",
    "mmmmmmmmmmmmmm",
];

const SOL_NUBE = [
    "....a.........",
    ".a..yy..a.....",
    "...yYYy.......",
    "a.yYYYyy..a...",
    "..yYYyy.......",
    ".a.yywwww.....",
    "...wwWWWWw....",
    "..wWWwwwwwww..",
    ".wWwwwwwwwwwws",
    ".wwwwwwwwwwwss",
    "..ssssssssss..",
];

const VIENTO = [
    "......ww......",
    "....wwWWw.....",
    ".......Ww.....",
    "wwwwwwwWw.....",
    "WWWWWWWw......",
    "..............",
    "wwwwwwwwwww...",
    "WWWWWWWWWWWw..",
    "..........Ww..",
    "........wwWw..",
    "........WWw...",
];

const CHALECO = [
    "..aa....aa..",
    ".aAa....aAa.",
    ".aAaa..aaaa.",
    "aAaaaaaaaaaz",
    "aWWWWWWWWWWz",
    "aAaaaaaaaaaz",
    "aAaaaaaaaaaz",
    "aWWWWWWWWWWz",
    "aAaaaaaaaaaz",
    "zzzzzzzzzzzz",
];

const SHORTS = [
    "bbbbbbbbbbbb",
    "bBBBBBBBBBBn",
    "bBbbbbbbbbbn",
    "bBbbbnnbbbbn",
    "bBbbn..nbbbn",
    "bBbbn..nbbbn",
    "bbbbn..nbbbn",
    "nnnn....nnnn",
];

const GORRA = [
    "....bbbbb.....",
    "..bbBBBBBbb...",
    ".bBBBbbbbbbn..",
    ".bBbbbbbbbbbn.",
    "bBbbbbbbbbbbn.",
    "bbbbbbbbbbbnnn",
    "nnnnnnnnnbbbbb",
    ".........nnnnn",
];

const NINJA = [
    "...xxxxxxxx...",
    "..xkkkkkkkkx..",
    ".xkkkkkkkkkkx.",
    ".xkFFFFFFFFkx.",
    ".xkFxFFFFxFkx.",
    ".xkFFFFFFFFkx.",
    ".xkkkkkkkkkkrr",
    ".xkkkkkkkkkkxr",
    "..xkkkkkkkkx..",
    "...xxxxxxxx...",
];

const BIRRETE = [
    "......xx......",
    "....xxkkxx....",
    "..xxkkkkkkxx..",
    "xxkkkkkkkkkkxx",
    "..xxkkkkkkxxy.",
    "....xxkkxx..y.",
    "...xkkkkkkx.y.",
    "...xkkkkkkx.yy",
    "...xxxxxxxx.yy",
];

const BUFANDA = [
    "..rrrrrrrrrr..",
    ".rRRRRRRRRRRd.",
    "rRrrrrrrrrrrrd",
    ".dddrrrrddddd.",
    "....rRrd......",
    "....rRrd......",
    "....rRrd......",
    "....rRrd......",
    "....wwww......",
];

const MALETA = [
    "....tttt....",
    "....t..t....",
    ".mmmmmmmmmm.",
    "mTTTTTTTTTTm",
    "mTtttyytttTm",
    "mTttttttttTm",
    "mTttttttttTm",
    "mTtttyytttTm",
    "mttttttttttm",
    "mmmmmmmmmmmm",
    ".x........x.",
];

const VARITA = [
    "..........y...",
    ".........yWy..",
    "..........y...",
    "........xx....",
    ".......xkx....",
    "......xkx.....",
    ".....xkx......",
    "....xkx.......",
    "...xkx........",
    "..wwx.........",
    ".wWw..........",
    ".ww...........",
];

const LAUD = [
    "............tm",
    "...........tm.",
    "..........tm..",
    ".........tm...",
    "........tm....",
    "...wwwwtm.....",
    "..wWWWwww.....",
    ".wWWWWWWWw....",
    ".wWWxWWWWw....",
    ".wWWWWWWWs....",
    "..wWWWWWs.....",
    "...sssss......",
];

const TRIDENTE = [
    "y....y....y",
    "y....y....y",
    "yy...y...yy",
    ".yy..y..yy.",
    "..yyyyyyy..",
    ".....y.....",
    ".....o.....",
    ".....y.....",
    ".....o.....",
    ".....y.....",
    ".....o.....",
    ".....y.....",
];

const FLOR_LIS = [
    "......yy......",
    ".....yYYy.....",
    "..yy.yYYy.yy..",
    ".yYYyyYYyyYYy.",
    "yYy.yyYYyy.yYy",
    "yy..yYYYYy..yy",
    ".y.yyyyyyyy.y.",
    "..oooooooooo..",
    "....yy..yy....",
    "...yy....yy...",
];

const LEON = [
    "..aazzzzzzaa..",
    ".azzaaaaaazza.",
    "azaaTTTTTTaaza",
    "zaaTTTTTTTTaaz",
    "zaTTxTTTTxTTaz",
    "zaTTTTTTTTTTaz",
    "zaaTTTmmTTTaaz",
    ".zaaTTTTTTaaz.",
    "..zaaTmmTaaz..",
    "...zzaaaazz...",
];

const JABALI = [
    "..mm......mm..",
    ".mmm......mmm.",
    ".mMMmmmmmmMMm.",
    "mMMMMMMMMMMMMm",
    "mMMxMMMMMMxMMm",
    "mMMMMMMMMMMMMm",
    ".mMMMttttMMMm.",
    "..mMtxttxtMm..",
    "..wmttttttmw..",
    "..w.mmmmmm.w..",
];

const LAGARTO = [
    ".....gg.......",
    "....gGGg......",
    "....gggg......",
    "..g.gggg.g....",
    "..gggggggg....",
    ".....ggg......",
    ".....gggg.....",
    "..g.gggggg.g..",
    "..gggggggggg..",
    "......ggg.....",
    ".......gg.....",
    "........gg....",
    ".........g....",
];

const AGUILA = [
    "......ww......",
    ".....wWWy.....",
    "......ww......",
    "m....mttm....m",
    "mm..mttttm..mm",
    "mtmmtttttmmmtm",
    ".mtttttttttmm.",
    "..mmmttttmmm..",
    ".....tttt.....",
    "....yy..yy....",
];

const CUERVO = [
    "..........kk..",
    ".........kxkk.",
    "........kkkkyy",
    "...kkkkkkkk...",
    "..kSkkkkkk....",
    ".kSkkkkkkk....",
    "kkkkkkkkk.....",
    "..kkkkkk......",
    "....y..y......",
];

const POLLITO = [
    ".....yyyy.....",
    "....yYYyyy....",
    "....yYxyyyaa..",
    "....yyyyyy....",
    "...wWwwwwwws..",
    "..wWwwwwwwwws.",
    "..wWwwwwwwwws.",
    "..wwwwwwwwwss.",
    "...wwwwwwwss..",
    "....ssssss....",
];

const PULMONES = [
    "......ss......",
    "......ss......",
    "..iii.ss.iii..",
    ".iKKis..siKKi.",
    "iKKKis..siKKKi",
    "iKKii....iiKKi",
    "iKiii....iiiKi",
    "iiiii....iiiii",
    ".iiii....iiii.",
    "..ii......ii..",
];

const BATERIA = [
    "kkkkkkkkkkkkk.",
    "kGGGGGGGGswwk.",
    "kgggggggggswkk",
    "kgggggggggswkk",
    "kgggggggggswk.",
    "kkkkkkkkkkkkk.",
];

const SOFA = [
    "..pppppppppp..",
    ".pPPPPPPPPPPq.",
    ".pPppppppppPq.",
    "ppPppppppppPqq",
    "pPPPPPPPPPPPPq",
    "pPpppppppppppq",
    "qqqqqqqqqqqqqq",
    ".t..........t.",
];

const BOMBA = [
    "..........a...",
    ".........aY...",
    "........t.a...",
    ".......t......",
    "....kkkkk.....",
    "..kkSSkkkkk...",
    ".kSSkkkkkkkk..",
    ".kSkkkkkkkkx..",
    "kkkkkkkkkkkxx.",
    "kkkkkkkkkkxxx.",
    ".kkkkkkkkxxx..",
    "..kkkkkxxxx...",
    "....xxxx......",
];

const CARTA = [
    "wwwwwwwwww",
    "wrWWWWWWWs",
    "wWWWWWWWWs",
    "wWWWrrWWWs",
    "wWWrrrrWWs",
    "wWWWrrWWWs",
    "wWWWWWWWWs",
    "wWWWWWWWrs",
    "ssssssssss",
];

const FAROL = [
    ".....yy.....",
    "....dddd....",
    "..rrrrrrrr..",
    ".rRRrrrrrrd.",
    "rRRrrrrrrrdd",
    "rRrrrrrrrrdd",
    "rRrrrrrrrrdd",
    ".rRrrrrrrdd.",
    "..rrrrrrdd..",
    "....dddd....",
    ".....yy.....",
];

const PROHIBIDO = [
    "....rrrrrr....",
    "..rrrrrrrrrr..",
    ".rrrr.....rrr.",
    ".rr.rr.....rr.",
    "rr...rr.....rr",
    "rr....rr....rr",
    "rr.....rr...rr",
    "rr......rr..rr",
    "rr.......rr.rr",
    ".rr.......rrr.",
    ".rrr.....rrrr.",
    "..rrrrrrrrrr..",
    "....rrrrrr....",
];

const PAPELERA = [
    "....ssss....",
    "ssssssssssss",
    "swwwwwwwwwws",
    ".sWsWsWsWss.",
    ".sWsWsWsWss.",
    ".sWsWsWsWss.",
    ".sWsWsWsWss.",
    ".sWsWsWsWss.",
    "..ssssssss..",
];

const CARTEL = [
    "TTTTTTTTTTTT",
    "TFFFFFFFFFFt",
    "TFhhhhhhhhFt",
    "TFFFFFFFFFFt",
    "TFhhhhhFFFFt",
    "TFFFFFFFFFFt",
    "tttttttttttt",
    ".....mm.....",
    ".....mm.....",
    ".....mm.....",
];

const MANO = [
    "..f.f.f.......",
    "..fFfFfFf.....",
    "..fFfFfFf.....",
    "..fFfFfFf.ff..",
    "..fFFFFFfFFf..",
    "..fFFFFFFFf...",
    "..fFFFFFFf....",
    "...fFFFFFf....",
    "....hhhhh.....",
];

const JARRA = [
    ".wwWwwWw....",
    "wWWWWWWWw...",
    "oyyyyyyyosss",
    "oYyyyyyyos.s",
    "oYyyyyyyos.s",
    "oYyyyyyyosss",
    "oyyyyyyyo...",
    "ooooooooo...",
];

const ANCLA = [
    "....ss....",
    "...s..s...",
    "....ss....",
    "..ssssss..",
    "....ss....",
    "....ss....",
    "s...ss...s",
    "ss..ss..ss",
    ".ss.ss.ss.",
    "..ssssss..",
    "....ss....",
];

const SIERRA = [
    "rr............",
    "rRr...........",
    "rrrsssssssssss",
    "rRrwwwwwwwwwws",
    "rrrswswswswsws",
];

const OREJA = [
    "..ffff..",
    ".fFFFFf.",
    "fFFhhFFf",
    "fFh..fFf",
    "fFh.fFf.",
    "fFFhFFf.",
    ".fFFFf..",
    "..fFFf..",
    "...fFf..",
    "..fff...",
];

const BANDEJA = [
    ".....bb.......",
    ".....bb.......",
    "...bbbbbb.....",
    "....bbbb......",
    ".....bb.......",
    "ss........ss..",
    "swww....wwws..",
    "swwwwwwwwwws..",
    "ssssssssssss..",
];

const COHETE = [
    "......ww......",
    ".....wWWw.....",
    "....wWWWWs....",
    "....wWbbWs....",
    "....wWbbWs....",
    "....wWWWWs....",
    "...rwWWWWsr...",
    "..rrwWWWWsrr..",
    "..rr.ssss.rr..",
    "......aa......",
    ".....aYYa.....",
    "......aa......",
];

const VOLCAN = [
    ".....a..a.....",
    "......ar......",
    ".....rAAr.....",
    "....kraark....",
    "...kkkaakkk...",
    "..kSkkkkkkkk..",
    ".kSkkkkkkkkkk.",
    "kSkkkkkkkkkkkk",
    "xxxxxxxxxxxxxx",
];

const DIEZ = [
    "nnnnnnnnnnnn",
    "nbbbbbbbbbbn",
    "nbbWbbWWWbbn",
    "nbWWbbWbWbbn",
    "nbbWbbWbWbbn",
    "nbbWbbWbWbbn",
    "nbWWWbWWWbbn",
    "nbbbbbbbbbbn",
    "nnnnnnnnnnnn",
];

const CIEN = [
    "r..rrr.rrr...",
    "rr.r.r.r.r...",
    "r..r.r.r.r...",
    "r..r.r.r.r...",
    "r..rrr.rrr...",
    "rrrrrrrrrrr..",
    ".rrrrrrrrrr..",
];

const TRIGO = [
    "..y....y....y.",
    ".yoy..yoy..yoy",
    ".yoy..yoy..yoy",
    "..yy...yy..yy.",
    "..y.y.y.y.y.y.",
    "...y..y..y.y..",
    "...y..y..yy...",
    "....y.y.y.....",
    ".....yyy......",
    "......y.......",
    "......y.......",
];

const PANTALON = [
    "bbbbbbbbbbbb",
    "bnyynnnnnnnb",
    "bBbbbbbbbbbn",
    "bBbbbbbbbbbn",
    "bBbbbn.bbbbn",
    "bBbbn..nbbbn",
    "bBbbn..nbbbn",
    "bBbbn..nbbbn",
    "bBbbn..nbbbn",
    "bBbbn..nbbbn",
    "bBbbn..nbbbn",
    "nnnn....nnnn",
];

const BOTA = [
    "...tttttt.....",
    "...tTTttm.....",
    "...tTttmm.....",
    "...tTttmm.....",
    "...yyyyyy.....",
    "...tTttmm.....",
    "...tTttmm.....",
    "...tTtttmmm...",
    "..tTtttttttmm.",
    ".tTtttttttttm.",
    ".mmmmmmmmmmmmm",
    "..xxxxxxxxxxx.",
];

// (v141) Los que faltaban en la carrera en vivo: el consejo de ritmo (círculos), la criatura que se te adelanta (tortuga),
// la clase Fantasma y la pausa.
const CIRCULO_VERDE = recolor(CIRCULO_AMARILLO, { Y: "G", y: "g", o: "v" });
const CIRCULO_ROJO = recolor(CIRCULO_AMARILLO, { Y: "R", y: "r", o: "d" });
const CIRCULO_AZUL = recolor(CIRCULO_AMARILLO, { Y: "B", y: "b", o: "n" });

const TORTUGA = [
    "...tttt.......",
    "..tTtmtt......",
    ".tTtmttmt..GG.",
    ".ttmtttmtt.GxG",
    "tmtttmttmtGGGG",
    "mmmmmmmmmmGGg.",
    ".GGg...GGg....",
    ".Gg....Gg.....",
];

const FANTASMA = [
    "...wwwwww...",
    "..wWWWWWWw..",
    ".wWWWWWWWWw.",
    ".wWxxWWxxWs.",
    "wWWxxWWxxWWs",
    "wWWWWWWWWWWs",
    "wWWWWxxWWWWs",
    "wWWWWxxWWWss",
    "wWWWWWWWWsss",
    "wWWsWWWsWWss",
    ".ws..ws..ws.",
];

const PAUSA = [
    "wWWw..wWWw",
    "wWWs..wWWs",
    "wWWs..wWWs",
    "wWWs..wWWs",
    "wWWs..wWWs",
    "wWWs..wWWs",
    "wWWs..wWWs",
    "wWWs..wWWs",
    "wsss..wsss",
];

// ----- (v147) Los que faltaban en botones y títulos: la calle, la pista, el GPS, la tarjeta y la carta -----
// Un camino que se pierde a lo lejos: asfalto gris, bordes oscuros, pasto a los lados y la línea del medio a trazos.
const CAMINO = pintar(14, 13, (x, y) => {
    const medio = 1 + y * 0.46;   // la mitad del ancho del camino en esta fila (más ancho abajo, más cerca)
    const d = Math.abs(x - 6.5);
    if (d > medio + 0.5) return y > 3 && d < medio + 2 ? "v" : null;
    if (d > medio - 0.6) return "k";
    if (d < 0.6 && y % 4 < 2 && y > 0) return "y";
    return "S";
});
// Una pista de atletismo vista desde arriba: la tribuna gris, el tartán rojo y la cancha verde con franjas.
const ESTADIO = pintar(14, 11, (x, y) => {
    const dx = Math.max(0, Math.abs(x - 6.5) - 2.5) / 4.6;   // las rectas (sin curva) y las curvas de las puntas
    const dy = (y - 5) / 5.6;
    const r = Math.hypot(dx, dy);
    if (r > 1) return null;
    if (r > 0.8) return y < 5 ? "s" : "S";
    if (r > 0.56) return y < 4 ? "R" : "r";
    return x % 3 === 0 ? "v" : "g";
});
// Una antena con su luz arriba y las ondas de la señal a los lados (el GPS).
const ANTENA = [
    "......yy......",
    "..b..yYYy..b..",
    ".b....yy....b.",
    ".b....kk....b.",
    "..b...kk...b..",
    ".....kSSk.....",
    ".....kSSk.....",
    "....kS..Sk....",
    "....kSkkSk....",
    "...kS....Sk...",
    "...kSkkkkSk...",
    "..kS......Sk..",
    "..kkkkkkkkkk..",
];
// Una tarjeta del banco: azul, con la franja oscura, el chip dorado y unos números.
const TARJETA = [
    "nnnnnnnnnnnnnn",
    "nbBbbbbbbbbbbn",
    "nxxxxxxxxxxxxn",
    "nxxxxxxxxxxxxn",
    "nbbbbbbbbbbbbn",
    "nbYyobbbbbbbbn",
    "nbyoObbbbbbbbn",
    "nbbbbbbBBbBBbn",
    "nnnnnnnnnnnnnn",
];
// Un sobre cerrado con su sello de lacre (las cartas a tu yo futuro).
const SOBRE = [
    "SSSSSSSSSSSSSS",
    "SsWWWWWWWWWWsS",
    "SWsWWWWWWWWsWS",
    "SWWsWWWWWWsWWS",
    "SWWWsWWWWsWWWS",
    "SWWWWsrrsWWWWS",
    "SWWWWWrrWWWWWS",
    "SWWWWWWWWWWWWS",
    "SwwwwwwwwwwwwS",
    "SSSSSSSSSSSSSS",
];

// ---------- La lista: nombre del ícono → su dibujo ----------
export const ICONOS = {
    corazon: CORAZON,
    "corazon-verde": recolor(CORAZON, { R: "G", r: "g", d: "v" }),
    "corazon-rosa": recolor(CORAZON, { R: "K", r: "i", d: "d" }),
    "corazon-roto": CORAZON_ROTO,
    "corazon-curado": encima(CORAZON, ["", "", "...ww.........", "...wWw........", "....wWw.......", ".....wsw......", "......wWw.....", ".......wWw....", "........ww....", ""]),
    gema: GEMA,
    rombo: ROMBO,
    moneda: MONEDA,
    bolsa: BOLSA,
    escudo: ESCUDO,
    espada: ESPADA,
    espadas: ESPADAS,
    daga: DAGA,
    fuego: FUEGO,
    chispas: CHISPAS,
    estrella: ESTRELLA,
    rayo: RAYO,
    calavera: CALAVERA,
    check: CHECK,
    candado: CANDADO,
    abierto: ABIERTO,
    llave: LLAVE,
    diana: DIANA,
    pergamino: PERGAMINO,
    libro: LIBRO,
    libros: LIBROS,
    cuaderno: CUADERNO,
    pluma: PLUMA,
    chincheta: CHINCHETA,
    pesa: PESA,
    brazo: BRAZO,
    cerebro: CEREBRO,
    globo: GLOBO,
    regalo: REGALO,
    ficha: FICHA,
    sombrero: SOMBRERO,
    reloj: RELOJ,
    arena: ARENA,
    trofeo: TROFEO,
    corona: CORONA,
    medalla: MEDALLA,
    orbe: ORBE,
    torre: TORRE,
    luna: LUNA,
    mapa: MAPA,
    trebol: TREBOL,
    pocion: POCION,
    vela: VELA,
    grafica: GRAFICA,
    gota: GOTA,
    huella: HUELLA,
    nube: NUBE,
    castillo: CASTILLO,
    brujula: BRUJULA,
    espiral: ESPIRAL,
    alerta: ALERTA,
    campana: CAMPANA,
    "sin-campana": SIN_CAMPANA,
    calendario: CALENDARIO,
    sol: SOL,
    amanecer: AMANECER,
    explosion: EXPLOSION,
    lista: LISTA,
    bandera: BANDERA,
    espejo: ESPEJO,
    cadena: CADENA,
    roca: ROCA,
    bombilla: BOMBILLA,
    nota: NOTA,
    notas: NOTAS,
    balanza: BALANZA,
    martillo: MARTILLO,
    pico: PICO,
    demonio: DEMONIO,
    confeti: CONFETI,
    copo: COPO,
    hoja: HOJA,
    brote: BROTE,
    arco: ARCO,
    claqueta: CLAQUETA,
    dragon: DRAGON,
    casco: CASCO,
    engranaje: ENGRANAJE,
    "cara-feliz": CARA_FELIZ,
    "cara-riendo": CARA_RIENDO,
    "cara-normal": CARA_NORMAL,
    "cara-triste": CARA_TRISTE,
    "cara-agotada": CARA_AGOTADA,
    "cara-enojada": CARA_ENOJADA,
    disquete: DISQUETE,
    portatil: PORTATIL,
    palanca: PALANCA,
    paleta: PALETA_PINTOR,
    palmera: PALMERA,
    tormenta: TORMENTA,
    niebla: NIEBLA,
    fuente: FUENTE,
    concha: CONCHA,
    caja: CAJA,
    corredor: CORREDOR,
    montana: MONTANA,
    pierna: PIERNA,
    regla: REGLA,
    mariquita: MARIQUITA,
    ojos: OJOS,
    invasor: INVASOR,
    altavoz: ALTAVOZ,
    puerta: PUERTA,
    trompeta: TROMPETA,
    herramientas: HERRAMIENTAS,
    copa: COPA,
    paloma: PALOMA,
    camiseta: CAMISETA,
    tambor: TAMBOR,
    templo: TEMPLO,
    cerrar: CERRAR,
    lapiz: LAPIZ,
    lupa: LUPA,
    reproducir: REPRODUCIR,
    saltar: SALTAR,
    volver: VOLVER,
    arriba: ARRIBA,
    abajo: ABAJO,
    ambos: AMBOS,
    mas: MAS,
    pregunta: PREGUNTA,
    "luna-nueva": LUNA_NUEVA,
    manos: MANOS,
    carne: CARNE,
    hacha: HACHA,
    pino: PINO,
    ola: OLA,
    fugaz: FUGAZ,
    toro: TORO,
    ladrillos: LADRILLOS,
    buho: BUHO,
    agujero: AGUJERO,
    carpeta: CARPETA,
    persona: PERSONA,
    senala: SENALA,
    camara: CAMARA,
    movil: MOVIL,
    numeros: NUMEROS,
    repetir: REPETIR,
    caballo: CABALLO,
    carrito: CARRITO,
    cactus: CACTUS,
    mochila: MOCHILA,
    dado: DADO,
    cuadro: CUADRO,
    ira: IRA,
    mascara: MASCARA,
    "luna-llena": LUNA_LLENA,
    "medalla-plata": MEDALLA_PLATA,
    "medalla-bronce": MEDALLA_BRONCE,
    "circulo-violeta": CIRCULO_VIOLETA,
    "circulo-amarillo": CIRCULO_AMARILLO,
    "cuadro-rojo": CUADRO_ROJO,
    cuadrito: CUADRITO,
    ala: ALA,
    paisaje: PAISAJE,
    desierto: DESIERTO,
    vias: VIAS,
    "sol-nube": SOL_NUBE,
    viento: VIENTO,
    chaleco: CHALECO,
    shorts: SHORTS,
    gorra: GORRA,
    ninja: NINJA,
    birrete: BIRRETE,
    bufanda: BUFANDA,
    maleta: MALETA,
    varita: VARITA,
    laud: LAUD,
    tridente: TRIDENTE,
    "flor-lis": FLOR_LIS,
    leon: LEON,
    jabali: JABALI,
    lagarto: LAGARTO,
    aguila: AGUILA,
    cuervo: CUERVO,
    pollito: POLLITO,
    pulmones: PULMONES,
    bateria: BATERIA,
    sofa: SOFA,
    bomba: BOMBA,
    carta: CARTA,
    farol: FAROL,
    prohibido: PROHIBIDO,
    papelera: PAPELERA,
    cartel: CARTEL,
    mano: MANO,
    jarra: JARRA,
    ancla: ANCLA,
    sierra: SIERRA,
    oreja: OREJA,
    bandeja: BANDEJA,
    cohete: COHETE,
    volcan: VOLCAN,
    diez: DIEZ,
    cien: CIEN,
    trigo: TRIGO,
    pantalon: PANTALON,
    bota: BOTA,
    "circulo-verde": CIRCULO_VERDE,
    "circulo-rojo": CIRCULO_ROJO,
    "circulo-azul": CIRCULO_AZUL,
    tortuga: TORTUGA,
    fantasma: FANTASMA,
    pausa: PAUSA,
    camino: CAMINO, estadio: ESTADIO, antena: ANTENA, tarjeta: TARJETA, sobre: SOBRE,   // (v147)
};

// Qué emoji se cambia por qué ícono. (El "️" invisible que llevan algunos emojis da igual:
// se acepta con él o sin él.)
export const EMOJIS = {
    "❤️‍🩹": "corazon-curado", "❤": "corazon", "♥": "corazon", "💗": "corazon-rosa", "💚": "corazon-verde",
    "💔": "corazon-roto", "💎": "gema", "💠": "rombo", "🪙": "moneda", "💰": "bolsa", "🛡": "escudo",
    "⚔": "espadas", "🗡": "daga", "🔪": "daga", "🔥": "fuego", "♨": "fuego", "✨": "chispas", "🌟": "chispas",
    "💫": "chispas", "⭐": "estrella", "⚡": "rayo", "☠": "calavera", "💀": "calavera", "✅": "check", "✔": "check",
    "🔒": "candado", "🔐": "candado", "🔓": "abierto", "🔑": "llave", "🎯": "diana", "📜": "pergamino",
    "📖": "libro", "📚": "libros", "📓": "cuaderno", "📝": "cuaderno", "✍": "pluma", "✏": "lapiz", "🪶": "pluma",
    "📌": "chincheta", "📍": "chincheta", "🏋": "pesa", "💪": "brazo", "🦾": "brazo", "🧠": "cerebro",
    "💬": "globo", "🗣": "globo", "🎁": "regalo", "🎟": "ficha", "🧙": "sombrero", "⏱": "reloj", "⏰": "reloj",
    "🕐": "reloj", "🕰": "reloj", "⏳": "arena", "⌛": "arena", "🏆": "trofeo", "👑": "corona", "🏅": "medalla",
    "🎖": "medalla", "🥇": "medalla", "🔮": "orbe", "🗼": "torre", "🌙": "luna", "🗺": "mapa", "🍀": "trebol",
    "🧪": "pocion", "🕯": "vela", "📈": "grafica", "📊": "grafica", "🩸": "gota", "🐾": "huella", "☁": "nube",
    "🏰": "castillo", "🏯": "castillo", "🧭": "brujula", "🌀": "espiral", "⚠": "alerta", "🔔": "campana",
    "🔕": "sin-campana", "📅": "calendario", "🗓": "calendario", "☀": "sol", "🌅": "amanecer", "💥": "explosion",
    "📋": "lista", "🏁": "bandera", "🪞": "espejo", "⛓": "cadena", "🪨": "roca", "🗿": "roca", "💡": "bombilla",
    "🎵": "nota", "🎶": "notas", "⚖": "balanza", "🔨": "martillo", "⚒": "martillo", "🔧": "martillo",
    "⛏": "pico", "👹": "demonio", "🎉": "confeti", "❄": "copo", "🌿": "hoja", "🍂": "hoja", "🌱": "brote",
    "🏹": "arco", "🎬": "claqueta", "🐉": "dragon", "🐲": "dragon", "🙂": "cara-feliz", "😊": "cara-feliz",
    "😃": "cara-riendo", "😄": "cara-riendo", "😀": "cara-riendo", "🤩": "cara-riendo", "😐": "cara-normal",
    "😔": "cara-triste", "😞": "cara-triste", "😢": "cara-triste", "😫": "cara-agotada", "😩": "cara-agotada",
    "😵": "cara-agotada", "😡": "cara-enojada", "😤": "cara-enojada",
    "🪖": "casco", "⛑": "casco", "⚙": "engranaje",
    "💾": "disquete", "💻": "portatil", "🕹": "palanca", "🎮": "palanca", "🎨": "paleta", "🏖": "palmera",
    "🌴": "palmera", "🌩": "tormenta", "⛈": "tormenta", "🌫": "niebla", "⛲": "fuente", "🐚": "concha",
    "📦": "caja", "🏃": "corredor", "🏔": "montana", "⛰": "montana", "🗻": "montana", "🦵": "pierna",
    "🦿": "pierna", "📏": "regla", "🐞": "mariquita", "👀": "ojos", "👁": "ojos", "👾": "invasor",
    "🔊": "altavoz", "🔈": "altavoz", "🚪": "puerta", "🎺": "trompeta", "🧰": "herramientas", "🍷": "copa",
    "🕊": "paloma", "🎽": "camiseta", "🥁": "tambor", "🏛": "templo", "🆕": "chispas",
    "✖": "cerrar", "❌": "cerrar", "🖊": "lapiz",
    "🔍": "lupa", "🔎": "lupa", "▶": "reproducir", "⏭": "saltar", "↩": "volver", "⬆": "arriba",
    "⬇": "abajo", "↕": "ambos", "➕": "mas", "❔": "pregunta", "❓": "pregunta", "🌑": "luna-nueva",
    "🙏": "manos", "🍖": "carne", "🪓": "hacha", "🌲": "pino", "🌳": "pino", "🌊": "ola",
    "🌠": "fugaz", "🐄": "toro", "🐂": "toro", "🧱": "ladrillos", "🦉": "buho", "🕳": "agujero",
    "🗂": "carpeta", "📁": "carpeta", "🧍": "persona", "🧑": "persona", "👆": "arriba", "👉": "senala",
    "📸": "camara", "📷": "camara", "📱": "movil", "🔢": "numeros", "🔁": "repetir", "🔀": "repetir",
    "♻": "repetir", "🐎": "caballo", "🛒": "carrito", "🌵": "cactus", "🎒": "mochila", "🎲": "dado",
    "🖼": "cuadro", "💢": "ira", "🎭": "mascara", "🤕": "cara-triste", "🎼": "notas", "🫥": "cara-normal",
    "🛠": "martillo", "🔗": "cadena", "📑": "lista", "🥱": "cara-agotada", "😴": "cara-agotada", "🤐": "cara-normal",
    "🌕": "luna-llena", "🥈": "medalla-plata", "🥉": "medalla-bronce", "🟣": "circulo-violeta", "🟡": "circulo-amarillo", "🟥": "cuadro-rojo",
    "▫": "cuadrito", "🪽": "ala", "🏞": "paisaje", "🏜": "desierto", "🛤": "vias", "🌤": "sol-nube",
    "💨": "viento", "🦺": "chaleco", "🩳": "shorts", "🧢": "gorra", "🥷": "ninja", "🎓": "birrete",
    "🧣": "bufanda", "🧳": "maleta", "🪄": "varita", "🪕": "laud", "🔱": "tridente", "⚜": "flor-lis",
    "🦁": "leon", "🐗": "jabali", "🦎": "lagarto", "🦅": "aguila", "🐦‍⬛": "cuervo", "🐣": "pollito",
    "🫁": "pulmones", "🔋": "bateria", "🛋": "sofa", "💣": "bomba", "🃏": "carta", "🏮": "farol",
    "🚫": "prohibido", "🗑": "papelera", "🪧": "cartel", "🤚": "mano", "🍺": "jarra", "⚓": "ancla",
    "🪚": "sierra", "👂": "oreja", "📥": "bandeja", "🚀": "cohete", "🌋": "volcan", "🔟": "diez",
    "💯": "cien", "🌾": "trigo", "🌌": "chispas", "🔯": "estrella",
    "👖": "pantalon", "🥾": "bota", "👢": "bota",
    "🟢": "circulo-verde", "🔴": "circulo-rojo", "🔵": "circulo-azul", "🐢": "tortuga", "👻": "fantasma", "⏸": "pausa",   // (v141)
    "🛣": "camino", "🏟": "estadio", "📡": "antena", "💳": "tarjeta", "✉": "sobre", "🔄": "repetir",   // (v147)
};

// ---------- De dibujo a SVG ----------
const LADO = 16;   // todos los íconos miden 16 × 16 puntos (14 de dibujo + 1 de borde a cada lado)

// Convierte las filas en trazos SVG: un <path> por color. Cada tramo horizontal de puntos
// del mismo color se dibuja como un rectángulo ("M x y h ancho v 1 h -ancho z").
export function aTrazos(filas) {
    const alto = filas.length, ancho = Math.max(...filas.map((f) => f.length));
    const dx = Math.floor((LADO - ancho) / 2), dy = Math.floor((LADO - alto) / 2);
    const letra = (x, y) => {
        const c = filas[y - dy]?.[x - dx];
        return c && c !== "." && c !== " " ? c : null;
    };
    const porColor = {};
    for (let y = 0; y < LADO; y++) {
        let x = 0;
        while (x < LADO) {
            // El color del punto: el suyo, o el del contorno si está pegado a la figura.
            const color = (px) => letra(px, y) || ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => letra(px + a, y + b)) ? "#" : null);
            const c = color(x);
            if (!c) { x++; continue; }
            let fin = x + 1;
            while (fin < LADO && color(fin) === c) fin++;
            (porColor[c] ||= []).push(`M${x} ${y}h${fin - x}v1h${x - fin}z`);
            x = fin;
        }
    }
    return Object.entries(porColor).map(([c, d]) => `<path fill="${PALETA[c] || "#f0f"}" d="${d.join("")}"/>`).join("");
}

const hechos = new Map();   // nombre → texto SVG (se arma una sola vez)

// El SVG de un ícono, listo para meter en el HTML.
export function icono(nombre, clase = "pxi") {
    if (!ICONOS[nombre]) return "";
    if (!hechos.has(nombre)) hechos.set(nombre, aTrazos(ICONOS[nombre]));
    return `<svg class="${clase}" data-icono="${nombre}" viewBox="0 0 ${LADO} ${LADO}" shape-rendering="crispEdges" aria-hidden="true">${hechos.get(nombre)}</svg>`;
}

// ---------- Cambiar emojis por íconos en la página ----------
// Una expresión regular que encuentra cualquiera de los emojis de la lista (con o sin "️").
// Los más largos van primero (así "❤️‍🩹" no se confunde con "❤").
const SIN_VARIANTE = (texto) => texto.replace(/️/g, "");
const BUSCAR = new RegExp(
    Object.keys(EMOJIS).map(SIN_VARIANTE).sort((a, b) => b.length - a.length)
        .map((e) => [...e].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\uFE0F?") + "\\uFE0F?")
        .join("|"),
    "gu",
);
// La misma búsqueda sin la "g": solo para preguntar SI hay alguno. (Una expresión con "g" recuerda dónde
// se quedó —lastIndex— y la siguiente búsqueda empezaría desde ahí, saltándose el emoji.)
const HAY_ALGUNO = new RegExp(BUSCAR.source, "u");
const PARA_BUSCAR = Object.fromEntries(Object.entries(EMOJIS).map(([e, n]) => [SIN_VARIANTE(e), n]));

// Dónde NO cambiar: dentro de un <option> o un <textarea> solo cabe texto; dentro de un
// dibujo SVG el emoji es parte del dibujo; y lo marcado con la clase "con-emojis" se respeta.
const NO_TOCAR = new Set(["SCRIPT", "STYLE", "TEXTAREA", "OPTION", "TITLE", "INPUT", "SELECT"]);
function sePuedeCambiar(nodo) {
    for (let el = nodo.parentElement; el; el = el.parentElement) {
        if (NO_TOCAR.has(el.tagName) || el.namespaceURI === "http://www.w3.org/2000/svg" || el.isContentEditable) return false;
        if (el.classList.contains("con-emojis")) return false;
    }
    return true;
}

const plantilla = document.createElement("template");
const nodosHechos = new Map();   // nombre → <svg> listo para copiar (cloneNode es más rápido que leer HTML)
function nodoDeIcono(nombre) {
    if (!nodosHechos.has(nombre)) {
        plantilla.innerHTML = icono(nombre);
        nodosHechos.set(nombre, plantilla.content.firstChild);
    }
    return nodosHechos.get(nombre).cloneNode(true);
}

// Un pedazo de texto: si tiene emojis de la lista, se parte en texto + íconos.
function cambiarTexto(nodo) {
    const texto = nodo.data;
    if (!HAY_ALGUNO.test(texto) || !nodo.parentNode || !sePuedeCambiar(nodo)) return;
    const partes = document.createDocumentFragment();
    let desde = 0;
    for (const hallado of texto.matchAll(BUSCAR)) {
        if (hallado.index > desde) partes.append(texto.slice(desde, hallado.index));
        partes.append(nodoDeIcono(PARA_BUSCAR[SIN_VARIANTE(hallado[0])]));
        desde = hallado.index + hallado[0].length;
    }
    if (desde < texto.length) partes.append(texto.slice(desde));
    nodo.replaceWith(partes);
}

// Revisa todos los textos dentro de un elemento.
export function iconizar(raiz) {
    if (raiz.nodeType === Node.TEXT_NODE) return cambiarTexto(raiz);
    const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    const textos = [];
    while (caminante.nextNode()) textos.push(caminante.currentNode);
    textos.forEach(cambiarTexto);
}

// Se llama una vez al abrir la app: cambia lo que ya hay y vigila lo que vaya apareciendo.
// (MutationObserver avisa cada vez que cambia el HTML, ANTES de que se pinte la pantalla:
// por eso nunca se alcanza a ver el emoji.)
export function vigilarIconos(raiz = document.body) {
    iconizar(raiz);
    new MutationObserver((cambios) => {
        for (const cambio of cambios) {
            if (cambio.type === "characterData") cambiarTexto(cambio.target);
            else cambio.addedNodes.forEach((nodo) => (nodo.nodeType === Node.ELEMENT_NODE || nodo.nodeType === Node.TEXT_NODE) && iconizar(nodo));
        }
    }).observe(raiz, { childList: true, subtree: true, characterData: true });
}
