// plataformas.js — Las reglas de «La Senda del Reino» (v185), el juego de plataformas del arcade.
//
// Aquí solo hay reglas y datos (nada se dibuja ni se guarda):
//   - las medidas y la física (cuánto salta tu héroe, qué tan rápido corre…),
//   - qué es cada letra de los niveles (los niveles están en plataformas-niveles.js),
//   - cómo choca un cuerpo contra la cuadrícula del nivel (moverCuerpo),
//   - el progreso guardado (niveles abiertos, mejores puntos, reliquias),
//   - y una revisión de que cada nivel se puede terminar (alcanzable).
//
// El motor del juego (plataformas-motor.js) usa todo esto en cada cuadro; el dibujo está en dibujo-plataformas.js.

import { NIVELES_DATOS } from "./plataformas-niveles.js";

// ===== Medidas =====
// Todo se mide en «puntos» de pixel art: una celda del nivel mide 16 × 16 puntos.
export const CELDA = 16;
export const VISTA_FILAS = 15;          // la cámara siempre muestra 15 filas de alto (240 puntos)
export const PASO = 1 / 120;            // la física avanza en pasos fijos de 1/120 s (así salta igual en cualquier teléfono)

// La física del héroe. Velocidades en puntos por segundo; aceleraciones, en puntos por segundo al cuadrado.
export const FISICA = {
    velocidadMax: 115,       // corriendo a tope: unas 7 celdas por segundo
    aceleracion: 640,        // qué tan rápido arranca en el suelo
    aceleracionAire: 430,    // en el aire se controla un poco menos
    giro: 1300,              // frenar para darse vuelta
    friccion: 780,           // al soltar el botón, se detiene rápido
    friccionAire: 160,
    hielo: { aceleracion: 170, giro: 260, friccion: 60 },   // sobre hielo se patina
    salto: 330,              // la velocidad hacia arriba al saltar
    saltoCorriendo: 0.12,    // corriendo salta un poco más (330 + 12 % de la velocidad)
    gravedad: 1500,          // la gravedad normal (al caer o al soltar el botón de salto)
    gravedadSalto: 780,      // mientras subes con el botón apretado, la gravedad pesa menos: el salto es más alto
    caidaMax: 420,           // la velocidad máxima al caer
    coyote: 0.1,             // «tiempo de coyote»: puedes saltar hasta 0,1 s después de salir del borde
    buffer: 0.12,            // si aprietas saltar un poco antes de tocar el suelo, el salto igual sale
    rebote: 260,             // el rebote al pisar a un enemigo
    reboteAlto: 360,         // …y si mantienes saltar, rebotas más alto
};

// El héroe mide 10 × 24 puntos (su caja de choques; el dibujo es un poco más grande).
export const HEROE = { ancho: 10, alto: 24 };

// ===== Las letras de los niveles =====
// Cada nivel es una cuadrícula de texto: cada letra es una celda.
export const LETRAS = {
    ".": "vacío",
    "#": "suelo",
    "=": "piedra",
    "B": "ladrillo (se rompe con armadura)",
    "?": "bloque rúnico con una moneda",
    "!": "bloque rúnico con un poder (poción de vigor o brasa rúnica)",
    "*": "bloque rúnico con la Bendición de la Llama",
    "$": "bloque rúnico con muchas monedas",
    "+": "bloque escondido con una vida (no se ve hasta que lo golpeas desde abajo)",
    "u": "bloque ya usado",
    "I": "hielo (resbala)",
    "-": "tabla: se pisa desde arriba y se atraviesa desde abajo",
    "^": "pinchos",
    "~": "lava",
    "%": "pared falsa (se ve como pared, pero se atraviesa)",
    "_": "cuarto escondido (desde afuera se ve como pared; se descubre al cruzar su pared falsa)",
    "T": "antorcha (adorno)",
    "o": "moneda",
    "S": "inicio", "F": "meta (el Arco de la Llama)", "C": "punto de control", "R": "reliquia", "K": "cofre",
    "M": "plataforma que va y viene de lado (hasta la marca >)", ">": "fin del camino de una plataforma",
    "N": "plataforma que sube y baja (hasta la marca :)", ":": "fin del camino de una plataforma",
    "D": "plataforma que se derrumba al pisarla",
    "G": "cadena de fuego (gira alrededor de este bloque)",
    "e": "Esqueleto", "p": "Escorpión de raíz", "q": "Can del umbral", "s": "Sabueso de ceniza",
    "k": "Cangrejo acorazado", "v": "Murciélago de cripta", "w": "Arpía de los vientos", "j": "Cieno abisal",
    "t": "Gárgola", "y": "Cristal gélido", "z": "Raíz estranguladora (sale de una urna)", "l": "Ascua errante",
    "r": "Araña tejedora", "x": "Mazo de piedra", "b": "el jefe del mundo",
};

// Celdas sólidas: no se atraviesan. "+" (escondido) solo es sólido al golpearlo desde abajo.
const SOLIDAS = new Set(["#", "=", "B", "?", "!", "*", "$", "u", "I", "U", "G"]);
export const esSolida = (letra) => SOLIDAS.has(letra);
export const esTabla = (letra) => letra === "-";
export const esPeligro = (letra) => letra === "^" || letra === "~";

// Los enemigos: cómo se portan, cuál criatura de la Torre es (su dibujo) y su caja de choques.
//   pisable: si se vence saltándole encima · fuego: cuántas bolas de fuego aguanta (0 = no le hacen nada)
export const ENEMIGOS = {
    e: { id: "esqueleto",  nombre: "Esqueleto",             conducta: "caminante", velocidad: 28, pisable: true, fuego: 1, ancho: 12, alto: 18, dibujo: 22 },
    p: { id: "escorpion",  nombre: "Escorpión de raíz",     conducta: "caminante", velocidad: 32, pisable: true, fuego: 1, ancho: 16, alto: 12, dibujo: 22, cuidadoso: true },
    q: { id: "can",        nombre: "Can del umbral",        conducta: "caminante", velocidad: 52, pisable: true, fuego: 1, ancho: 16, alto: 13, dibujo: 22 },
    s: { id: "sabueso",    nombre: "Sabueso de ceniza",     conducta: "caminante", velocidad: 60, pisable: true, fuego: 2, ancho: 16, alto: 14, dibujo: 24, cuidadoso: true },
    k: { id: "cangrejo",   nombre: "Cangrejo acorazado",    conducta: "caparazon", velocidad: 24, pisable: true, fuego: 1, ancho: 16, alto: 13, dibujo: 22 },
    v: { id: "murcielago", nombre: "Murciélago de cripta",  conducta: "volador",   velocidad: 34, pisable: true, fuego: 1, ancho: 14, alto: 10, dibujo: 22 },
    w: { id: "arpia",      nombre: "Arpía de los vientos",  conducta: "picado",    velocidad: 40, pisable: true, fuego: 1, ancho: 14, alto: 16, dibujo: 24 },
    j: { id: "cieno",      nombre: "Cieno abisal",          conducta: "saltador",  velocidad: 60, pisable: true, fuego: 1, ancho: 14, alto: 11, dibujo: 22 },
    t: { id: "gargola",    nombre: "Gárgola",               conducta: "torreta",   velocidad: 0,  pisable: true, fuego: 2, ancho: 16, alto: 18, dibujo: 24, disparo: "bola" },
    y: { id: "cristal",    nombre: "Cristal gélido",        conducta: "torreta",   velocidad: 0,  pisable: true, fuego: 1, ancho: 14, alto: 18, dibujo: 24, disparo: "esquirla" },
    z: { id: "raiz",       nombre: "Raíz estranguladora",   conducta: "trampa",    velocidad: 0,  pisable: false, fuego: 2, ancho: 12, alto: 20, dibujo: 22 },
    l: { id: "ascua",      nombre: "Ascua errante",         conducta: "ascua",     velocidad: 0,  pisable: false, fuego: 0, ancho: 10, alto: 10, dibujo: 16 },
    r: { id: "arana",      nombre: "Araña tejedora",        conducta: "arana",     velocidad: 70, pisable: true, fuego: 1, ancho: 14, alto: 12, dibujo: 20 },
    x: { id: "mazo",       nombre: "Mazo de piedra",        conducta: "mazo",      velocidad: 0,  pisable: false, fuego: 0, ancho: 30, alto: 30, dibujo: 32 },
};

// Los jefes: uno al final de cada mundo. golpes = cuántos pisotones aguanta.
export const JEFES = {
    caballero: { id: "caballero", nombre: "Caballero sin Nombre", golpes: 3, ancho: 22, alto: 36, dibujo: 48, fuego: 0.25 },
    golem:     { id: "golem",     nombre: "Gólem de hierro",      golpes: 4, ancho: 30, alto: 40, dibujo: 52, fuego: 0.2 },
    dragon:    { id: "dragon",    nombre: "Dragón de la tormenta", golpes: 4, ancho: 40, alto: 28, dibujo: 56, fuego: 0.25 },
    demonio:   { id: "demonio",   nombre: "Señor de la Fragua",   golpes: 5, ancho: 32, alto: 42, dibujo: 56, fuego: 0.15 },
};

// Los poderes que salen de los bloques rúnicos.
export const PODERES = {
    pocion:    { nombre: "Poción de vigor",        texto: "Te pone la armadura: aguantas un golpe y rompes ladrillos." },
    brasa:     { nombre: "Brasa rúnica",           texto: "Lanzas bolas de fuego (botón 🔥). Si te golpean, vuelves a la armadura." },
    bendicion: { nombre: "Bendición de la Llama",  texto: "Unos segundos invencible: lo que tocas, cae." },
    vida:      { nombre: "Amuleto de vida",        texto: "Una vida más." },
};

export const BENDICION_SEGUNDOS = 9;

// ===== Puntos =====
export const PUNTOS = {
    moneda: 10, pisoton: 100, fuego: 100, concha: 200, ladrillo: 20, poder: 500, reliquia: 1000, cofre: 50,
    meta: 1000, porSegundo: 10,   // al llegar a la meta: 1000 + 10 por cada segundo que te sobró
    jefe: 5000,
};
export const MONEDAS_POR_VIDA = 100;   // cada 100 monedas, una vida más
export const VIDAS = 3;

// ===== Los mundos =====
// musica: la pista de musica.js que suena en sus niveles (en los jefes suena «batalla»).
export const MUNDOS = [
    { numero: 1, id: "alba",      nombre: "Campos del Alba",        musica: "alba",
      texto: "Colinas al amanecer y las ruinas del viejo reino. Los muertos de la última guerra todavía patrullan." },
    { numero: 2, id: "minas",     nombre: "Minas de Cristal",       musica: "misterio",
      texto: "Galerías bajo la montaña donde los cristales brillan solos. Abajo, algo enorme golpea el hierro." },
    { numero: 3, id: "cumbres",   nombre: "Cumbres de la Tormenta", musica: "epica",
      texto: "Hielo, viento y precipicios. Sobre las nubes, el dragón vigila el último paso." },
    { numero: 4, id: "fortaleza", nombre: "Fortaleza de la Llama",  musica: "abismo",
      texto: "La fortaleza que custodiaba la Llama, tomada por el fuego del abismo. Aquí termina la senda." },
];

// Todos los niveles, en orden. Cada uno: { id: "1-2", mundo, numero, nombre, tiempo, jefe?, arena?, filas }.
export const NIVELES = NIVELES_DATOS;
export const POR_ID = Object.fromEntries(NIVELES.map((n) => [n.id, n]));
export const RELIQUIAS_POR_NIVEL = 3;
export const nivelesDelMundo = (numero) => NIVELES.filter((n) => n.mundo === numero);
export const mundoDe = (nivel) => MUNDOS[nivel.mundo - 1];


// ===== Leer un nivel =====
// Convierte la cuadrícula de texto en datos: las celdas (solo el terreno) y las cosas que se mueven o se recogen.
export function prepararNivel(def) {
    const filas = def.filas;
    const alto = filas.length;
    const ancho = filas[0].length;
    const celdas = [];
    const n = {
        id: def.id, mundo: def.mundo, ancho, alto, celdas, inicio: null, meta: null,
        controles: [], reliquias: [], cofres: [], enemigos: [], plataformas: [], derrumbes: [], cadenas: [], jefe: null,
        escondites: [], escondite: {},   // los cuartos escondidos: [["c,f", …]] y, para cada celda, de qué escondite es
    };
    filas.forEach((fila, f) => {
        if (fila.length !== ancho) throw new Error(`El nivel ${def.id} tiene la fila ${f} de otro largo (${fila.length} en vez de ${ancho}).`);
        [...fila].forEach((letra, c) => {
            let queda = letra;   // lo que queda en la cuadrícula (el terreno)
            if (letra === "S") { n.inicio = { c, f }; queda = "."; }
            else if (letra === "F") { n.meta = { c, f }; queda = "."; }
            else if (letra === "C") { n.controles.push({ c, f }); queda = "."; }
            else if (letra === "R") { n.reliquias.push({ c, f, i: n.reliquias.length }); queda = "."; }
            else if (letra === "K") { n.cofres.push({ c, f }); queda = "."; }
            else if (letra === "M" || letra === "N") { n.plataformas.push({ tipo: letra === "M" ? "lado" : "alto", c, f }); queda = "."; }
            else if (letra === "D") {
                const anterior = n.derrumbes[n.derrumbes.length - 1];
                if (anterior && anterior.f === f && anterior.c + anterior.ancho === c) anterior.ancho += 1;   // varias D seguidas: una sola plataforma
                else n.derrumbes.push({ c, f, ancho: 1 });
                queda = ".";
            }
            else if (letra === ">" || letra === ":" || letra === " ") queda = ".";
            else if (letra === "G") n.cadenas.push({ c, f });
            else if (letra === "z") { n.enemigos.push({ letra, c, f }); queda = "U"; }   // la raíz vive en una urna
            else if (letra === "b") { n.jefe = { c, f }; queda = "."; }
            else if (ENEMIGOS[letra]) { n.enemigos.push({ letra, c, f }); queda = "."; }
            else if (!LETRAS[letra]) throw new Error(`Letra desconocida «${letra}» en el nivel ${def.id} (columna ${c}, fila ${f}).`);
            celdas.push(queda);
        });
    });
    // Los escondites: desde cada «_», todas las celdas del cuarto (también las que tienen monedas, reliquias o cofres)
    // y las paredes falsas «%» que lo tocan. Hasta que el héroe entra, todo eso se dibuja como pared.
    const adentro = (c, f) => "_oRK".includes(filas[f]?.[c] ?? "#");
    for (let f = 0; f < alto; f++) {
        for (let c = 0; c < ancho; c++) {
            if (filas[f][c] !== "_" || `${c},${f}` in n.escondite) continue;
            const numero = n.escondites.length;
            const celdasDelCuarto = [];
            const pendientes = [[c, f]];
            const marcar = (x, y) => { n.escondite[`${x},${y}`] = numero; celdasDelCuarto.push(`${x},${y}`); };
            marcar(c, f);
            while (pendientes.length) {
                const [x, y] = pendientes.pop();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const [x2, y2] = [x + dx, y + dy];
                    if (`${x2},${y2}` in n.escondite) continue;
                    if (adentro(x2, y2)) { marcar(x2, y2); pendientes.push([x2, y2]); }
                    else if (filas[y2]?.[x2] === "%") marcar(x2, y2);
                }
            }
            n.escondites.push(celdasDelCuarto);
        }
    }
    // Dónde termina el camino de cada plataforma móvil: la marca > a su derecha, o : en su columna.
    for (const p of n.plataformas) {
        if (p.tipo === "lado") {
            const hasta = filas[p.f].indexOf(">", p.c);
            p.hasta = hasta >= 0 ? hasta : p.c;
        } else {
            let hasta = p.f;
            for (let f = 0; f < alto; f++) if (filas[f][p.c] === ":") hasta = f;
            p.hasta = hasta;
        }
    }
    return n;
}

// La letra de una celda. Fuera del nivel: a los lados hay muro; arriba, aire; abajo, el vacío.
export function celda(nivel, c, f) {
    if (c < 0 || c >= nivel.ancho) return "#";
    if (f < 0 || f >= nivel.alto) return ".";
    return nivel.celdas[f * nivel.ancho + c];
}

export function ponerCelda(nivel, c, f, letra) {
    if (c < 0 || c >= nivel.ancho || f < 0 || f >= nivel.alto) return;
    nivel.celdas[f * nivel.ancho + c] = letra;
}


// ===== Los choques contra la cuadrícula =====
// cuerpo = { x, y, ancho, alto, vx, vy } (x, y = la esquina de arriba a la izquierda, en puntos).
// Se mueve primero de lado y después de arriba abajo, en pasitos de 6 puntos como máximo (así nunca atraviesa
// una pared aunque vaya muy rápido). Devuelve lo que pasó:
//   { arriba: [{ c, f }] celdas que golpeó con la cabeza, pared: -1 | 0 | 1, suelo: la letra que pisa o null }
// opciones.tablas = false: atraviesa las tablas (los enemigos que vuelan, por ejemplo).
export function moverCuerpo(cuerpo, nivel, dt, opciones = {}) {
    const res = { arriba: [], pared: 0, suelo: null };
    const dx = cuerpo.vx * dt;
    const dy = cuerpo.vy * dt;
    const pasos = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
    let chocoEnY = false;
    for (let i = 0; i < pasos; i++) {
        if (!res.pared) moverEnX(cuerpo, nivel, dx / pasos, res);    // si ya chocó contra una pared, deja de moverse de lado
        if (!chocoEnY) chocoEnY = moverEnY(cuerpo, nivel, dy / pasos, res, opciones);
    }
    res.suelo = res.suelo || sueloBajo(cuerpo, nivel, opciones);
    return res;
}

// Las celdas (columnas o filas) que ocupa un tramo [desde, hasta) en puntos.
const primera = (p) => Math.floor(p / CELDA);
const ultima = (p) => Math.floor((p - 0.001) / CELDA);

function moverEnX(c, nivel, d, res) {
    if (!d) return;
    c.x += d;
    const f0 = primera(c.y);
    const f1 = ultima(c.y + c.alto);
    const col = d > 0 ? ultima(c.x + c.ancho) : primera(c.x);
    for (let f = f0; f <= f1; f++) {
        if (!esSolida(celda(nivel, col, f))) continue;
        if (d > 0) c.x = col * CELDA - c.ancho;
        else c.x = (col + 1) * CELDA;
        c.vx = 0;
        res.pared = d > 0 ? 1 : -1;
        return;
    }
}

// Devuelve true si chocó (contra el suelo o el techo).
function moverEnY(c, nivel, d, res, opciones) {
    if (!d) return false;
    const abajoAntes = c.y + c.alto;
    c.y += d;
    const c0 = primera(c.x);
    const c1 = ultima(c.x + c.ancho);
    if (d > 0) {
        const fila = ultima(c.y + c.alto);
        for (let col = c0; col <= c1; col++) {
            const letra = celda(nivel, col, fila);
            const tabla = esTabla(letra) && opciones.tablas !== false && abajoAntes <= fila * CELDA + 0.01;
            if (esSolida(letra) || tabla) {
                c.y = fila * CELDA - c.alto;
                c.vy = 0;
                res.suelo = letra;
                return true;
            }
        }
        return false;
    } else {
        const fila = primera(c.y);
        let choco = false;
        for (let col = c0; col <= c1; col++) {
            const letra = celda(nivel, col, fila);
            // El bloque escondido solo es sólido si lo golpeas desde abajo (y solo lo puede descubrir el héroe).
            if (esSolida(letra) || (letra === "+" && opciones.esconditos)) {
                choco = true;
                res.arriba.push({ c: col, f: fila });
            }
        }
        if (choco) {
            c.y = (fila + 1) * CELDA;
            c.vy = 0;
        }
        return choco;
    }
}

// ¿Qué hay justo debajo de los pies? (la letra, o null si es aire)
export function sueloBajo(c, nivel, opciones = {}) {
    const fila = primera(c.y + c.alto + 0.5);
    if (Math.abs(c.y + c.alto - fila * CELDA) > 0.6) return null;
    for (let col = primera(c.x); col <= ultima(c.x + c.ancho); col++) {
        const letra = celda(nivel, col, fila);
        if (esSolida(letra) || (esTabla(letra) && opciones.tablas !== false)) return letra;
    }
    return null;
}

// ¿Toca el cuerpo alguna celda con esa condición? Devuelve las celdas que toca.
export function celdasQueToca(c, nivel, condicion) {
    const lista = [];
    for (let f = primera(c.y); f <= ultima(c.y + c.alto); f++) {
        for (let col = primera(c.x); col <= ultima(c.x + c.ancho); col++) {
            const letra = celda(nivel, col, f);
            if (condicion(letra)) lista.push({ c: col, f, letra });
        }
    }
    return lista;
}

// ¿Se tocan dos cajas? { x, y, ancho, alto }
export function seTocan(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
}


// ===== El progreso guardado =====
// estado.arcade.plataformas = { niveles: { "1-1": { mejor, reliquias: [0, 2], tiempo, ganadoEn, veces } } }
//   mejor = los mejores puntos al terminar ese nivel · reliquias = cuáles encontraste (0, 1 y 2)
//   tiempo = lo más rápido que lo terminaste (segundos) · ganadoEn = la primera vez que lo terminaste
// Qué niveles están abiertos NO se guarda: se calcula (el primero siempre; los demás, si terminaste el anterior).
export function progresoInicial() {
    return { niveles: {} };
}

export function nivelGanado(progreso, id) {
    return Boolean(progreso?.niveles?.[id]?.ganadoEn);
}

export function nivelAbierto(progreso, id) {
    const i = NIVELES.findIndex((n) => n.id === id);
    if (i < 0) return false;
    const def = NIVELES[i];
    if (def.requiere?.reliquias && totalReliquias(progreso) < def.requiere.reliquias) return false;
    return i === 0 || nivelGanado(progreso, NIVELES[i - 1].id) || nivelGanado(progreso, id);
}

export function mundoAbierto(progreso, numero) {
    const primero = nivelesDelMundo(numero)[0];
    return Boolean(primero) && nivelAbierto(progreso, primero.id);
}

export function reliquiasDe(progreso, id) {
    return progreso?.niveles?.[id]?.reliquias || [];
}

export function totalReliquias(progreso) {
    return Object.values(progreso?.niveles || {}).reduce((suma, n) => suma + (n.reliquias || []).length, 0);
}

export const RELIQUIAS_TOTALES = NIVELES.filter((n) => !n.jefe).length * RELIQUIAS_POR_NIVEL;

// El siguiente nivel en el orden (o null si era el último).
export function siguienteNivel(id) {
    const i = NIVELES.findIndex((n) => n.id === id);
    return i >= 0 && i + 1 < NIVELES.length ? NIVELES[i + 1].id : null;
}

// Anota un nivel terminado. resultado = { gano, puntos, reliquias: [índices], tiempo (segundos usados) }.
// Si no llegaste a la meta, no se anota nada (las reliquias solo cuentan si terminas el nivel).
// Devuelve qué cambió: { primeraVez, nuevas (reliquias nuevas), mejor (si mejoraste tus puntos), abre (el nivel que se abrió) }.
export function registrarNivel(progreso, id, resultado, fecha) {
    if (!resultado.gano || !POR_ID[id]) return { primeraVez: false, nuevas: [], mejor: false, abre: null };
    const antes = progreso.niveles[id] || { mejor: 0, reliquias: [], tiempo: null, ganadoEn: null, veces: 0 };
    const abiertosAntes = NIVELES.filter((n) => nivelAbierto(progreso, n.id)).map((n) => n.id);
    const validas = [...new Set(resultado.reliquias || [])].filter((i) => Number.isInteger(i) && i >= 0 && i < RELIQUIAS_POR_NIVEL);
    const nuevas = validas.filter((i) => !antes.reliquias.includes(i));
    const puntos = Math.max(0, Math.floor(resultado.puntos || 0));
    const tiempo = Math.max(0, Math.round(resultado.tiempo || 0));
    progreso.niveles[id] = {
        mejor: Math.max(antes.mejor, puntos),
        reliquias: [...antes.reliquias, ...nuevas].sort((a, b) => a - b),
        tiempo: antes.tiempo === null ? tiempo : Math.min(antes.tiempo, tiempo),
        ganadoEn: antes.ganadoEn || fecha,
        veces: (antes.veces || 0) + 1,
    };
    const abre = NIVELES.map((n) => n.id).find((otro) => !abiertosAntes.includes(otro) && nivelAbierto(progreso, otro)) || null;
    return { primeraVez: !antes.ganadoEn, nuevas, mejor: puntos > antes.mejor, abre };
}


// ===== ¿Se puede terminar el nivel? =====
// Una revisión aproximada (y un poco desconfiada) para las pruebas: busca, desde el inicio, todas las celdas donde
// el héroe puede pararse, con saltos que el héroe de verdad puede hacer (con margen). Si la meta queda fuera,
// el nivel está mal hecho. No cuenta a los enemigos (se pueden pisar o esquivar) ni los poderes.
//
// «Pararse en (c, f)» = los pies en la celda f: (c, f) y (c, f − 1) libres, y algo que pisar en (c, f + 1).
// Saltos (dc = celdas de lado, sube = filas hacia arriba): sube 4 → hasta 3 de lado; sube 2–3 → hasta 4; sube 0–1 → hasta 5;
// bajando d filas → hasta 5 + d/2 (máx. 8). El héroe real llega más lejos (≈ 4,4 filas y 5,4 celdas).
export function alcanzable(nivel) {
    const libre = (c, f) => {
        if (c < 0 || c >= nivel.ancho) return false;
        if (f < 0) return true;
        if (f >= nivel.alto) return false;
        const letra = celda(nivel, c, f);
        return !esSolida(letra) && !esPeligro(letra);
    };
    // Lo que se puede pisar, además del terreno: las plataformas móviles (todo su camino) y las que se derrumban.
    const apoyos = new Set();
    for (const p of nivel.plataformas) {
        if (p.tipo === "lado") {
            for (let c = Math.min(p.c, p.hasta); c <= Math.max(p.c, p.hasta) + 2; c++) apoyos.add(`${c},${p.f}`);
        } else {
            for (let f = Math.min(p.f, p.hasta); f <= Math.max(p.f, p.hasta); f++) for (let c = p.c; c < p.c + 3; c++) apoyos.add(`${c},${f}`);
        }
    }
    for (const d of nivel.derrumbes) for (let c = d.c; c < d.c + d.ancho; c++) apoyos.add(`${c},${d.f}`);
    const pisable = (c, f) => {
        if (!libre(c, f) || !libre(c, f - 1) || f + 1 >= nivel.alto) return false;
        const abajo = celda(nivel, c, f + 1);
        return esSolida(abajo) || esTabla(abajo) || apoyos.has(`${c},${f + 1}`);
    };
    const rectanguloLibre = (cA, cB, fA, fB) => {
        for (let c = Math.min(cA, cB); c <= Math.max(cA, cB); c++) {
            for (let f = Math.min(fA, fB); f <= Math.max(fA, fB); f++) if (!libre(c, f)) return false;
        }
        return true;
    };
    const puedeSaltar = (c, f, c2, f2) => {
        const dc = Math.abs(c2 - c);
        const sube = f - f2;   // > 0 = hacia arriba
        if (sube > 4) return false;
        const maxLado = sube >= 4 ? 3 : sube >= 2 ? 4 : sube >= 0 ? 5 : Math.min(8, 5 + Math.floor(-sube / 2));
        if (dc > maxLado) return false;
        if (dc <= 1 && sube <= 0) {
            // Bajar de un borde: basta con que el camino esté libre.
            return rectanguloLibre(c, c2, f - 1, f) && rectanguloLibre(c2, c2, f - 1, f2);
        }
        // ¿Cuánto sube el arco? Lo que haga falta para llegar, y para saltos largos, un poco más.
        let arco = Math.max(sube > 0 ? sube + 1 : 0, dc <= 3 ? 2 : 3);
        if (sube < 0) arco = Math.max(sube > 0 ? sube + 1 : 0, arco - Math.floor(-sube / 2));
        const pies = f - arco;   // la fila de los pies en lo más alto del salto
        return rectanguloLibre(c, c, pies - 1, f) && rectanguloLibre(c, c2, pies - 1, pies) && rectanguloLibre(c2, c2, pies - 1, f2);
    };

    const visto = new Set();
    const cola = [];
    if (nivel.inicio && pisable(nivel.inicio.c, nivel.inicio.f)) {
        visto.add(`${nivel.inicio.c},${nivel.inicio.f}`);
        cola.push(nivel.inicio);
    }
    while (cola.length) {
        const { c, f } = cola.shift();
        for (let c2 = c - 8; c2 <= c + 8; c2++) {
            for (let f2 = f - 4; f2 <= nivel.alto - 2; f2++) {
                const clave = `${c2},${f2}`;
                if (visto.has(clave) || !pisable(c2, f2)) continue;
                const caminando = f2 === f && Math.abs(c2 - c) === 1;
                if (!caminando && !puedeSaltar(c, f, c2, f2)) continue;
                visto.add(clave);
                cola.push({ c: c2, f: f2 });
            }
        }
    }
    const llega = (c, f, alcance) => {
        for (let dc = -1; dc <= 1; dc++) {
            for (let df = 0; df <= alcance; df++) {
                if (!visto.has(`${c + dc},${f + df}`)) continue;
                // la columna entre los pies y la cosa tiene que estar libre (para alcanzarla de un salto)
                if (rectanguloLibre(c, c, f, f + df)) return true;
            }
        }
        return false;
    };
    return {
        celdas: visto.size,
        visitadas: visto,   // las celdas "c,f" donde el héroe puede pararse (sirve para ver dónde se corta un nivel)
        meta: Boolean(nivel.meta) && llega(nivel.meta.c, nivel.meta.f, 1),
        reliquias: nivel.reliquias.map((r) => llega(r.c, r.f, 4)),
        controles: nivel.controles.map((k) => llega(k.c, k.f, 1)),
    };
}
