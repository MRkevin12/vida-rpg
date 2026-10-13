// bestiario.js — Las criaturas de la Torre del héroe (v25).
//
// La Torre tiene 4 ZONAS de 5 pisos. En cada zona hay 4 criaturas y, en el último piso,
// un GUARDIÁN. Después del piso 20 la Torre vuelve a empezar con las mismas criaturas,
// más fuertes y de otro color («ancestrales»).
//
// Cada criatura tiene un PUNTO DÉBIL: uno de los tres hechizos (fuego, hielo o rayo) le
// hace más daño. Algunas además RESISTEN otro, que les hace la mitad. Al principio no lo
// sabes: lo descubres probando, y la app lo apunta en tu bestiario para siempre.
//
// Este archivo solo tiene los datos (reglas puras). Los dibujos están en dibujo-monstruos.js.

export const ELEMENTOS = {
    fuego: { icono: "🔥", nombre: "Fuego" },
    hielo: { icono: "❄️", nombre: "Hielo" },
    rayo:  { icono: "⚡", nombre: "Rayo" },
};

export const DEBIL = 1.5;      // un hechizo de su punto débil hace 50 % más
export const RESISTE = 0.5;    // uno que resiste, la mitad

export const PISOS_POR_ZONA = 5;

export const ZONAS = [
    { id: "cripta",     nombre: "Cripta olvidada",      texto: "Los cimientos de la Torre: tumbas sin nombre y antorchas que nadie enciende." },
    { id: "biblioteca", nombre: "Biblioteca prohibida", texto: "Estantes hasta donde alcanza la vista, con libros que es mejor no abrir." },
    { id: "fragua",     nombre: "Fragua del abismo",    texto: "El calor sube desde abajo. Aquí se forjó algo que nunca debió existir." },
    { id: "cima",       nombre: "Cima de la tormenta",  texto: "Sin techo, sin muros: solo el viento, los rayos y lo que vive entre ellos." },
];

// genero: "m" o "f" (para escribir «el Esqueleto» o «la Araña»).
// golpe / fuerte: cómo se llaman su ataque normal y su ataque fuerte.
// talla: el tamaño de su dibujo en puntos (los guardianes son más grandes). vuela: flota en el aire.
export const CRIATURAS = {
    // --- Cripta olvidada ---
    murcielago: {
        nombre: "Murciélago de cripta", genero: "m", zona: "cripta", debil: "rayo", resiste: null,
        golpe: "Mordisco", fuerte: "Picada", talla: 72, vuela: true,
        texto: "Lleva siglos sin ver la luz. Oye latir tu corazón antes de que entres.",
    },
    esqueleto: {
        nombre: "Esqueleto", genero: "m", zona: "cripta", debil: "fuego", resiste: null,
        golpe: "Tajo oxidado", fuerte: "Estocada", talla: 88,
        texto: "Un soldado que olvidó por qué luchaba, pero no cómo.",
    },
    cieno: {
        nombre: "Cieno abisal", genero: "m", zona: "cripta", debil: "hielo", resiste: null,
        golpe: "Latigazo viscoso", fuerte: "Engullir", talla: 84,
        texto: "Disuelve todo lo que toca. Lo que queda dentro son los que no corrieron.",
    },
    arana: {
        nombre: "Araña tejedora", genero: "f", zona: "cripta", debil: "fuego", resiste: null,
        golpe: "Mordedura", fuerte: "Aguijón venenoso", talla: 92,
        texto: "Su tela cubre pasillos enteros. Siente cada paso que das sobre ella.",
    },
    caballero: {
        nombre: "Caballero sin Nombre", genero: "m", zona: "cripta", guardian: true, debil: "rayo", resiste: "hielo",
        golpe: "Mandoble", fuerte: "Tajo sepulcral", talla: 104,
        texto: "Guardián de la cripta. Bajo la armadura ya no queda nadie: solo el juramento.",
    },

    // --- Biblioteca prohibida ---
    ojo: {
        nombre: "Ojo vigía", genero: "m", zona: "biblioteca", debil: "hielo", resiste: null,
        golpe: "Mirada hiriente", fuerte: "Rayo ocular", talla: 84, vuela: true,
        texto: "No parpadea. Lo pusieron ahí para vigilar los libros, y sigue vigilando.",
    },
    grimorio: {
        nombre: "Grimorio voraz", genero: "m", zona: "biblioteca", debil: "fuego", resiste: null,
        golpe: "Dentellada", fuerte: "Maldición escrita", talla: 84, vuela: true,
        texto: "Un libro que aprendió a leer a sus lectores. Y después, a comérselos.",
    },
    espectro: {
        nombre: "Espectro", genero: "m", zona: "biblioteca", debil: "rayo", resiste: "hielo",
        golpe: "Toque helado", fuerte: "Lamento", talla: 92, vuela: true,
        texto: "Un estudioso que no quiso dejar la lectura a medias.",
    },
    gargola: {
        nombre: "Gárgola", genero: "f", zona: "biblioteca", debil: "rayo", resiste: "fuego",
        golpe: "Zarpazo", fuerte: "Caída en picada", talla: 96,
        texto: "Piedra que despierta cuando alguien toca lo que no debe.",
    },
    liche: {
        nombre: "Archivista", genero: "m", zona: "biblioteca", guardian: true, debil: "fuego", resiste: "hielo",
        golpe: "Rayo sombrío", fuerte: "Palabra prohibida", talla: 104, vuela: true,
        texto: "Guardián de la biblioteca. Cambió su vida por tiempo para leerlo todo.",
    },

    // --- Fragua del abismo ---
    ascua: {
        nombre: "Ascua errante", genero: "f", zona: "fragua", debil: "hielo", resiste: "fuego",
        golpe: "Llamarada", fuerte: "Estallido", talla: 84, vuela: true,
        texto: "Lo que queda de un herrero que no soltó el martillo ni al arder.",
    },
    "cieno-magma": {
        nombre: "Cieno de magma", genero: "m", zona: "fragua", debil: "hielo", resiste: "fuego",
        golpe: "Salpicadura ardiente", fuerte: "Marea de lava", talla: 84,
        texto: "Un cieno que bajó demasiado y aprendió a quemar.",
    },
    golem: {
        nombre: "Gólem de hierro", genero: "m", zona: "fragua", debil: "rayo", resiste: "fuego",
        golpe: "Puñetazo", fuerte: "Martillo doble", talla: 100,
        texto: "Forjado para trabajar sin descanso. Nadie le dijo que el trabajo había terminado.",
    },
    mimico: {
        nombre: "Mímico", genero: "m", zona: "fragua", debil: "fuego", resiste: null,
        golpe: "Mordisco", fuerte: "Lengua látigo", talla: 88,
        texto: "Parece la recompensa. Es el castigo de quien solo sube por el oro.",
    },
    demonio: {
        nombre: "Señor de la Fragua", genero: "m", zona: "fragua", guardian: true, debil: "hielo", resiste: "fuego",
        golpe: "Garra ardiente", fuerte: "Infierno", talla: 108,
        texto: "Guardián de la fragua. Todo lo que arde aquí arde porque él lo quiere.",
    },

    // --- Cima de la tormenta ---
    cristal: {
        nombre: "Cristal gélido", genero: "m", zona: "cima", debil: "fuego", resiste: "hielo",
        golpe: "Esquirla", fuerte: "Ventisca", talla: 92, vuela: true,
        texto: "Hielo que nunca se derritió. Dentro, algo te mira.",
    },
    "ala-trueno": {
        nombre: "Ala de trueno", genero: "f", zona: "cima", debil: "hielo", resiste: "rayo",
        golpe: "Descarga", fuerte: "Trueno", talla: 76, vuela: true,
        texto: "Caza entre las nubes. Cada aleteo suena un segundo después.",
    },
    sierpe: {
        nombre: "Sierpe de las nubes", genero: "f", zona: "cima", debil: "fuego", resiste: null,
        golpe: "Colmillos", fuerte: "Constricción", talla: 96,
        texto: "Se enrosca en las almenas y espera. Tiene toda la paciencia del mundo.",
    },
    centinela: {
        nombre: "Centinela celeste", genero: "m", zona: "cima", debil: "rayo", resiste: null,
        golpe: "Tajo celeste", fuerte: "Sentencia", talla: 100,
        texto: "El último que subió antes que tú. No llegó a bajar.",
    },
    dragon: {
        nombre: "Dragón de la tormenta", genero: "m", zona: "cima", guardian: true, debil: "hielo", resiste: "rayo",
        golpe: "Zarpazo", fuerte: "Aliento de rayos", talla: 116,
        texto: "Guardián de la cima. La tormenta no lo rodea: sale de él.",
    },
};

// En qué orden aparecen (piso 1, 2, 3…). Cada quinto es el guardián de su zona.
export const ORDEN = Object.keys(CRIATURAS);

export function zonaDelPiso(piso) {
    return ZONAS[Math.floor((piso - 1) / PISOS_POR_ZONA) % ZONAS.length];
}

// Cuántas veces ya diste la vuelta a la Torre (0 en los pisos 1 a 20, 1 en los 21 a 40…).
export function vueltaDelPiso(piso) {
    return Math.floor((piso - 1) / ORDEN.length);
}

export function idDelPiso(piso) {
    return ORDEN[(piso - 1) % ORDEN.length];
}

// Cuánto se multiplica el daño de un hechizo contra esa criatura.
export function factorElemento(criatura, elemento) {
    if (criatura.debil === elemento) return DEBIL;
    if (criatura.resiste === elemento) return RESISTE;
    return 1;
}


// ===== Tu bestiario =====
// Lo que sabes de cada criatura se guarda en estado.arcade.bestiario:
//   { esqueleto: { vencidos: 3, elementos: ["fuego"] } }
// "elementos" son los hechizos que ya probaste con ella: de esos ya sabes qué le hacen.

export function fichaDe(bestiario, id) {
    return bestiario?.[id] || null;
}

// Apunta que te cruzaste con esa criatura (si es la primera vez, crea su ficha).
export function anotarEncuentro(bestiario, id) {
    if (!CRIATURAS[id]) return;
    if (!bestiario[id]) bestiario[id] = { vencidos: 0, elementos: [] };
}

export function anotarVictoria(bestiario, id) {
    anotarEncuentro(bestiario, id);
    if (bestiario[id]) bestiario[id].vencidos += 1;
}

export function anotarElemento(bestiario, id, elemento) {
    anotarEncuentro(bestiario, id);
    if (bestiario[id] && ELEMENTOS[elemento] && !bestiario[id].elementos.includes(elemento)) bestiario[id].elementos.push(elemento);
}

// Lo que ya sabes de un hechizo contra una criatura: "debil", "resiste", "normal" o null (aún no lo probaste).
export function loQueSabes(bestiario, id, elemento) {
    const ficha = fichaDe(bestiario, id);
    const criatura = CRIATURAS[id];
    if (!ficha || !criatura || !ficha.elementos.includes(elemento)) return null;
    if (criatura.debil === elemento) return "debil";
    if (criatura.resiste === elemento) return "resiste";
    return "normal";
}

// Para la tarjeta del Arcade: cuántas criaturas conoces y cuántas hay.
export function progresoBestiario(bestiario) {
    return { vistas: ORDEN.filter((id) => bestiario?.[id]).length, total: ORDEN.length };
}
