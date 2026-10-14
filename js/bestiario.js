// bestiario.js — Las criaturas de la Torre del héroe (v25) y de la Mazmorra del Abismo (v29).
//
// Hay dos LUGARES para pelear: la Torre (se sube) y, debajo de ella, la Mazmorra (se baja;
// se abre al superar el piso 20 de la Torre). Cada uno tiene 4 ZONAS de 5 pisos. En cada
// zona hay 4 criaturas y, en el último piso, un GUARDIÁN. Después del piso 20 se vuelve a
// empezar con las mismas criaturas, más fuertes y de otro color («ancestrales» en la Torre,
// «abisales» en la Mazmorra).
//
// Las criaturas de la Mazmorra tienen además un ATAQUE ESPECIAL (veneno, beber tu vida,
// sellar tu magia o cubrirse con una coraza): ver ESPECIALES en torre.js.
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

// articulo: para escribir «Entras a la Cripta olvidada» o «Entras al Bosque de raíces».
// Las zonas de la Torre (de abajo hacia arriba):
export const ZONAS = [
    { id: "cripta",     nombre: "Cripta olvidada",      articulo: "la", texto: "Los cimientos de la Torre: tumbas sin nombre y antorchas que nadie enciende." },
    { id: "biblioteca", nombre: "Biblioteca prohibida", articulo: "la", texto: "Estantes hasta donde alcanza la vista, con libros que es mejor no abrir." },
    { id: "fragua",     nombre: "Fragua del abismo",    articulo: "la", texto: "El calor sube desde abajo. Aquí se forjó algo que nunca debió existir." },
    { id: "cima",       nombre: "Cima de la tormenta",  articulo: "la", texto: "Sin techo, sin muros: solo el viento, los rayos y lo que vive entre ellos." },
];

// Las zonas de la Mazmorra del Abismo (de arriba hacia abajo).
export const ZONAS_MAZMORRA = [
    { id: "cisterna",  nombre: "Cisternas anegadas",       articulo: "las", texto: "Los cimientos de la Torre, bajo el agua negra. Lo que cae aquí no vuelve a flotar." },
    { id: "raices",    nombre: "Bosque de raíces",         articulo: "el",  texto: "Un bosque al revés: raíces que cuelgan del techo y hongos que brillan. Todo crece; nada florece." },
    { id: "santuario", nombre: "Santuario de las Sombras", articulo: "el",  texto: "Velas negras y cánticos en voz baja. Aquí se adora lo que el resto del reino combate." },
    { id: "abismo",    nombre: "Corazón del Abismo",       articulo: "el",  texto: "El fondo. No hay muros, solo oscuridad que late. Aquí nacen las Sombras." },
];

// «a la Cripta olvidada», «al Bosque de raíces», «de las Cisternas anegadas», «del Corazón del Abismo».
export const aLaZona = (zona) => `${{ el: "al", los: "a los" }[zona.articulo] || `a ${zona.articulo}`} ${zona.nombre}`;
export const deLaZona = (zona) => `${{ el: "del", los: "de los" }[zona.articulo] || `de ${zona.articulo}`} ${zona.nombre}`;

// genero: "m" o "f" (para escribir «el Esqueleto» o «la Araña»).
// golpe / fuerte: cómo se llaman su ataque normal y su ataque fuerte.
// talla: el tamaño de su dibujo en puntos (los guardianes son más grandes). vuela: flota en el aire.
// especial (solo en la Mazmorra): { tipo ("veneno" | "drenar" | "sellar" | "coraza"), nombre }.
// espejo (solo el Reflejo sombrío): su dibujo es TU héroe, en sombras.
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

    // ===== Mazmorra del Abismo (v29) =====

    // --- Cisternas anegadas ---
    sanguijuela: {
        nombre: "Sanguijuela gigante", genero: "f", zona: "cisterna", debil: "fuego", resiste: "hielo",
        golpe: "Ventosa", fuerte: "Latigazo", especial: { tipo: "drenar", nombre: "Beber sangre" }, talla: 84,
        texto: "Lleva siglos alimentándose de lo que cae al agua. Hoy, lo que cayó eres tú.",
    },
    ahogado: {
        nombre: "Ahogado", genero: "m", zona: "cisterna", debil: "rayo", resiste: "hielo",
        golpe: "Manotazo", fuerte: "Abrazo del fondo", especial: { tipo: "sellar", nombre: "Agua negra" }, talla: 92,
        texto: "Bajó a buscar algo que había perdido. Todavía lo busca.",
    },
    aguaviva: {
        nombre: "Aguaviva pálida", genero: "f", zona: "cisterna", debil: "hielo", resiste: "rayo",
        golpe: "Roce urticante", fuerte: "Descarga", especial: { tipo: "veneno", nombre: "Filamentos" }, talla: 84, vuela: true,
        texto: "Flota sin prisa y sin rumbo. No caza: espera a que te enredes.",
    },
    cangrejo: {
        nombre: "Cangrejo acorazado", genero: "m", zona: "cisterna", debil: "rayo", resiste: "fuego",
        golpe: "Tenaza", fuerte: "Tijeretazo", especial: { tipo: "coraza", nombre: "Caparazón" }, talla: 96,
        texto: "Su caparazón está hecho con los escudos de los que no volvieron.",
    },
    kraken: {
        nombre: "Bestia de la cisterna", genero: "f", zona: "cisterna", guardian: true, debil: "rayo", resiste: "hielo",
        golpe: "Tentáculo", fuerte: "Remolino", especial: { tipo: "drenar", nombre: "Abrazo abisal" }, talla: 112,
        texto: "Guardiana de las cisternas. Nadie le vio nunca el cuerpo entero: no cabe en una sola mirada.",
    },

    // --- Bosque de raíces ---
    hongo: {
        nombre: "Hongo carroñero", genero: "m", zona: "raices", debil: "fuego", resiste: "rayo",
        golpe: "Embestida", fuerte: "Estallido de esporas", especial: { tipo: "sellar", nombre: "Esporas del sueño" }, talla: 88,
        texto: "Crece sobre lo que se dejó pudrir. Hay muchos: aquí abajo se dejó pudrir mucho.",
    },
    escorpion: {
        nombre: "Escorpión de raíz", genero: "m", zona: "raices", debil: "hielo", resiste: "fuego",
        golpe: "Pinza", fuerte: "Doble pinza", especial: { tipo: "veneno", nombre: "Aguijón negro" }, talla: 96,
        texto: "Duerme enterrado entre las raíces. Lo despierta el peso de quien duda dónde pisar.",
    },
    gusano: {
        nombre: "Gusano devorador", genero: "m", zona: "raices", debil: "hielo", resiste: "rayo",
        golpe: "Mordida", fuerte: "Embestida ciega", especial: { tipo: "drenar", nombre: "Devorar" }, talla: 96,
        texto: "Es todo boca. Cava túneles comiéndose la tierra y lo que haya en ella.",
    },
    raiz: {
        nombre: "Raíz estranguladora", genero: "f", zona: "raices", debil: "fuego", resiste: "hielo",
        golpe: "Latigazo", fuerte: "Estrangular", especial: { tipo: "coraza", nombre: "Corteza" }, talla: 92,
        texto: "Las raíces de la Torre se cansaron de sostenerla y aprendieron a apretar.",
    },
    arbol: {
        nombre: "Árbol hueco", genero: "m", zona: "raices", guardian: true, debil: "fuego", resiste: "rayo",
        golpe: "Rama", fuerte: "Derrumbe", especial: { tipo: "veneno", nombre: "Savia negra" }, talla: 116,
        texto: "Guardián del bosque. Por fuera, el árbol más grande que verás. Por dentro, nada.",
    },

    // --- Santuario de las Sombras ---
    acolito: {
        nombre: "Acólito de las Sombras", genero: "m", zona: "santuario", debil: "rayo", resiste: "fuego",
        golpe: "Daga ritual", fuerte: "Rezo oscuro", especial: { tipo: "sellar", nombre: "Silencio" }, talla: 92,
        texto: "Bajó a pelear y se quedó a escuchar. Ahora repite lo que le susurran.",
    },
    can: {
        nombre: "Can del umbral", genero: "m", zona: "santuario", debil: "fuego", resiste: "hielo",
        golpe: "Dentellada", fuerte: "Desgarro", especial: { tipo: "drenar", nombre: "Hambre" }, talla: 96,
        texto: "Huele la duda. Por eso te encontró tan rápido.",
    },
    sacerdotisa: {
        nombre: "Sacerdotisa velada", genero: "f", zona: "santuario", debil: "rayo", resiste: "hielo",
        golpe: "Toque sombrío", fuerte: "Letanía", especial: { tipo: "coraza", nombre: "Velo de sombra" }, talla: 96,
        texto: "Dirige los cantos. Dice que el descanso eterno es solo un descanso que nadie interrumpió.",
    },
    sabueso: {
        nombre: "Sabueso de ceniza", genero: "m", zona: "santuario", debil: "hielo", resiste: "fuego",
        golpe: "Mordisco ardiente", fuerte: "Embestida", especial: { tipo: "veneno", nombre: "Colmillos de ceniza" }, talla: 96,
        texto: "Quemaron el santuario para echarlo. Volvió hecho de las cenizas.",
    },
    reflejo: {
        nombre: "Reflejo sombrío", genero: "m", zona: "santuario", guardian: true, debil: "hielo", resiste: "fuego",
        golpe: "Tu mismo golpe", fuerte: "Tu mejor golpe", especial: { tipo: "sellar", nombre: "Tus excusas" }, talla: 80, espejo: true,
        texto: "Guardián del santuario. Tiene tu cara, tus armas y todas tus excusas.",
    },

    // --- Corazón del Abismo ---
    "heraldo-cuerpo": {
        nombre: "Heraldo del Cuerpo", genero: "m", zona: "abismo", debil: "hielo", resiste: "fuego",
        golpe: "Puño de plomo", fuerte: "Peso muerto", especial: { tipo: "veneno", nombre: "Cansancio" }, talla: 100,
        texto: "Habla con la voz de tu cansancio. Cada «hoy no» le dio fuerzas.",
    },
    "heraldo-mente": {
        nombre: "Heraldo de la Mente", genero: "m", zona: "abismo", debil: "fuego", resiste: "hielo",
        golpe: "Punzada", fuerte: "Mil preguntas", especial: { tipo: "sellar", nombre: "Duda" }, talla: 100,
        texto: "Nunca miente: solo pregunta. «¿Y si no sirve? ¿Y si mejor mañana?»",
    },
    "heraldo-voz": {
        nombre: "Heraldo de la Voz", genero: "m", zona: "abismo", debil: "hielo", resiste: "rayo",
        golpe: "Grito", fuerte: "Eco cruel", especial: { tipo: "coraza", nombre: "Orgullo" }, talla: 100,
        texto: "Te enseñó a callar para no equivocarte, y a hablar solo para tener razón.",
    },
    "heraldo-tesoro": {
        nombre: "Heraldo del Tesoro", genero: "m", zona: "abismo", debil: "rayo", resiste: "fuego",
        golpe: "Moneda afilada", fuerte: "Avaricia", especial: { tipo: "drenar", nombre: "Codicia" }, talla: 100,
        texto: "Todo lo que toca vale menos después. También tu tiempo.",
    },
    "rey-hueco": {
        nombre: "Rey Hueco", genero: "m", zona: "abismo", guardian: true, debil: "fuego", resiste: "hielo",
        golpe: "Cetro", fuerte: "Vacío", especial: { tipo: "drenar", nombre: "Vaciar" }, talla: 120,
        texto: "Guardián del abismo y padre de las Sombras. Su corona no pesa nada: está tan vacía como él.",
    },
};

// Los dos lugares. piso: cómo se llama cada nivel. vuelta: cómo se llaman las criaturas que
// vuelven después del piso 20.
export const LUGARES = {
    torre:    { id: "torre",    nombre: "Torre del héroe",     icono: "🗼", piso: "Piso",   vuelta: "ancestral", zonas: ZONAS },
    mazmorra: { id: "mazmorra", nombre: "Mazmorra del Abismo", icono: "⛓️", piso: "Sótano", vuelta: "abisal",    zonas: ZONAS_MAZMORRA },
};

// lugar = "torre" o "mazmorra". Si no se dice (o no existe), la Torre.
export const lugarDe = (lugar) => LUGARES[lugar] || LUGARES.torre;

// En qué orden aparecen (piso 1, 2, 3…). Cada quinto es el guardián de su zona.
// ORDEN es el de la Torre (el de siempre); ORDEN_MAZMORRA, el de la Mazmorra.
const enZonas = (zonas) => Object.keys(CRIATURAS).filter((id) => zonas.some((z) => z.id === CRIATURAS[id].zona));
export const ORDEN = enZonas(ZONAS);
export const ORDEN_MAZMORRA = enZonas(ZONAS_MAZMORRA);
LUGARES.torre.orden = ORDEN;
LUGARES.mazmorra.orden = ORDEN_MAZMORRA;

// ¿En qué lugar vive esta criatura? ("torre" o "mazmorra")
export function lugarDeCriatura(id) {
    return ORDEN_MAZMORRA.includes(id) ? "mazmorra" : "torre";
}

export function zonaDelPiso(piso, lugar = "torre") {
    const zonas = lugarDe(lugar).zonas;
    return zonas[Math.floor((piso - 1) / PISOS_POR_ZONA) % zonas.length];
}

// Cuántas veces ya diste la vuelta (0 en los pisos 1 a 20, 1 en los 21 a 40…).
export function vueltaDelPiso(piso, lugar = "torre") {
    return Math.floor((piso - 1) / lugarDe(lugar).orden.length);
}

export function idDelPiso(piso, lugar = "torre") {
    const orden = lugarDe(lugar).orden;
    return orden[(piso - 1) % orden.length];
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

// Para la tarjeta del Arcade: cuántas criaturas de ese lugar conoces y cuántas hay.
export function progresoBestiario(bestiario, lugar = "torre") {
    const orden = lugarDe(lugar).orden;
    return { vistas: orden.filter((id) => bestiario?.[id]).length, total: orden.length };
}
