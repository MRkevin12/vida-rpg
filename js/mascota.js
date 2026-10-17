// mascota.js — Tus mascotas: cuáles hay, cómo crecen y qué hacen (v26).
//
// Empiezas con un dragón. En la Tienda puedes adoptar otras, de distinta rareza (común,
// rara, épica y legendaria). Solo una te acompaña a la vez: la "activa".
//
// Cada mascota crece con las misiones diarias que completas DESDE QUE LA ADOPTASTE
// (el dragón, desde siempre): huevo → cría (10) → adulta (50).
//
// En la Torre del héroe pelea a tu lado con su habilidad. Su fuerza depende de cómo está:
//   huevo = todavía no pelea · cría = 60 % · adulta = 100 %
//   si comió hoy = 20 % más · si está triste (te descuidaste) = no pelea
//
// También puedes acariciarla (te responde) y alimentarla una vez al día: comer le da
// ánimo y a ti te cura un poco (ver vida.js). Los días que comió se guardan en
// estado.mascota.comidas.
//
// Lo que se guarda (estado.mascota):
//   nombre    = el nombre del dragón (el de siempre)
//   comidas   = los días en que comió tu mascota
//   activa    = la que te acompaña ("dragon", "fenix"…)
//   adoptadas = las demás: { fenix: { nombre: "Fénix", desde: "2026-10-13" } }
//
// Este archivo no importa nada: avatar.js y torre.js lo usan sin crear círculos.

// Los precios de las mascotas y de su comida son en gemas 💎 (desde la v31; antes, monedas).
export const COMIDA = { precio: 15, cura: 3 };

// Las etapas y cuánto pelea cada una en la Torre.
export const POTENCIA = { huevo: 0, cria: 0.6, adulto: 1 };
export const ALIMENTADA = 1.2;    // si comió hoy, pelea 20 % más

// torre = qué hace en la Torre:
//   ataque     → cada "cada" turnos golpea con "fuerza" × tu ataque (de "elemento", si tiene: cuenta el punto débil)
//   mana       → cada "cada" turnos te devuelve un hechizo
//   petrificar → cada "cada" turnos la criatura queda de piedra y pierde su turno
//   fenix      → te cura "cura" × tu vida máxima cada turno y, una vez por subida, te levanta si caes
// Una cría actúa un turno más tarde que una adulta.
export const MASCOTAS = {
    dragon: {
        nombre: "Dragón", rareza: "raro", precio: null, icono: "🐉",
        texto: "Tu compañero desde el primer día. Nació del último huevo de los dragones de la Torre, que el Maestro Aurelio guardó cien años.",
        habilidad: { nombre: "Aliento de fuego", texto: "Cada 3 turnos escupe fuego: 60 % de tu ataque, de fuego (cuenta el punto débil)." },
        torre: { tipo: "ataque", cada: 3, fuerza: 0.6, elemento: "fuego" },
    },
    cuervo: {
        nombre: "Cuervo", rareza: "comun", precio: 180, icono: "🐦‍⬛",
        texto: "Mensajero de los caminos. Ve desde lejos lo que tú todavía no ves.",
        habilidad: { nombre: "Picotazo", texto: "Cada 2 turnos picotea a la criatura: 45 % de tu ataque." },
        torre: { tipo: "ataque", cada: 2, fuerza: 0.45 },
    },
    buho: {
        nombre: "Búho", rareza: "raro", precio: 450, icono: "🦉",
        texto: "Vigila de noche las bibliotecas del reino. Dicen que leyó todos sus libros.",
        habilidad: { nombre: "Sabiduría", texto: "Cada 3 turnos te devuelve un hechizo." },
        torre: { tipo: "mana", cada: 3 },
    },
    basilisco: {
        nombre: "Basilisco", rareza: "epico", precio: 950, icono: "🦎",
        texto: "Rey de las serpientes, con corona de escamas. Su mirada detiene a cualquiera.",
        habilidad: { nombre: "Mirada pétrea", texto: "Cada 4 turnos convierte en piedra a la criatura: pierde su turno." },
        torre: { tipo: "petrificar", cada: 4 },
    },
    grifo: {
        nombre: "Grifo", rareza: "epico", precio: 1100, icono: "🦅",
        texto: "Mitad águila, mitad león. Guarda lo que vale y no le teme a nada que vuele.",
        habilidad: { nombre: "Garras", texto: "Cada 2 turnos ataca: 70 % de tu ataque (30 % más contra los guardianes)." },
        torre: { tipo: "ataque", cada: 2, fuerza: 0.7, guardianes: 1.3 },
    },
    fenix: {
        nombre: "Fénix", rareza: "legendario", precio: 2000, icono: "🔥",
        texto: "Muere en llamas y renace de sus cenizas. Enseña que caer no es el final.",
        habilidad: { nombre: "Renacer", texto: "Te cura 4 % de tu vida cada turno y, una vez por subida, si caes, te levanta con la mitad de tu vida." },
        torre: { tipo: "fenix", cura: 0.04, renacer: 0.5 },
    },
    escarcha: {
        nombre: "Dragón de escarcha", rareza: "legendario", precio: 2400, icono: "❄️",
        texto: "Nació en la cima de la tormenta, donde el hielo nunca se derrite.",
        habilidad: { nombre: "Aliento helado", texto: "Cada 2 turnos sopla hielo: 110 % de tu ataque, de hielo (cuenta el punto débil)." },
        torre: { tipo: "ataque", cada: 2, fuerza: 1.1, elemento: "hielo" },
    },
};

export const INICIAL = "dragon";


// ===== Cuáles tienes y cuál te acompaña =====

export function mascotasTuyas(estado) {
    return [INICIAL, ...Object.keys(estado.mascota?.adoptadas || {}).filter((especie) => MASCOTAS[especie] && especie !== INICIAL)];
}

export function tieneMascota(estado, especie) {
    return mascotasTuyas(estado).includes(especie);
}

// La que te acompaña (si la guardada no es tuya, el dragón).
export function especieActiva(estado) {
    const activa = estado.mascota?.activa;
    return activa && tieneMascota(estado, activa) ? activa : INICIAL;
}

export function nombreDe(estado, especie) {
    if (especie === INICIAL) return estado.mascota?.nombre || MASCOTAS[INICIAL].nombre;
    return estado.mascota?.adoptadas?.[especie]?.nombre || MASCOTAS[especie]?.nombre || "Mascota";
}

// Las misiones diarias que completaste desde que la adoptaste (el dragón: todas).
export function totalDe(estado, especie) {
    const desde = especie === INICIAL ? null : estado.mascota?.adoptadas?.[especie]?.desde;
    return desde ? estado.completadas.filter((c) => c.fecha >= desde).length : estado.completadas.length;
}

export function comioHoy(estado, fecha) {
    return (estado.mascota.comidas || []).includes(fecha);
}

// Cuánto pelea en la Torre: 0 (no pelea) a 1,2 (adulta y bien alimentada).
export function potenciaDe(etapa, { alimentada = false, triste = false } = {}) {
    if (triste) return 0;
    return Math.round((POTENCIA[etapa] ?? 0) * (alimentada ? ALIMENTADA : 1) * 100) / 100;
}

// Lo que la Torre necesita saber de tu mascota. m = la mascota de describirAvatar() (especie, nombre, etapa, triste).
export function mascotaDeBatalla(estado, m, fecha) {
    const alimentada = comioHoy(estado, fecha);
    return {
        especie: MASCOTAS[m.especie] ? m.especie : INICIAL,
        nombre: m.nombre,
        etapa: m.etapa.clave,
        alimentada,
        triste: m.triste,
        // (v103) El vínculo le suma hasta 16 % (si ya pelea).
        potencia: Math.round(potenciaDe(m.etapa.clave, { alimentada, triste: m.triste })
            * (1 + nivelDeVinculo(estado.mascota?.vinculo?.[m.especie] || 0).bono) * 100) / 100,
        vinculo: nivelDeVinculo(estado.mascota?.vinculo?.[m.especie] || 0).nombre,
    };
}

// Texto corto de cómo pelea ahora. Ej: "pelea al 100 %" o "todavía es un huevo: no pelea".
export function textoPotencia(b) {
    if (b.triste) return "está triste: hoy no pelea";
    if (b.etapa === "huevo") return "todavía es un huevo: no pelea";
    return `pelea al ${Math.round(b.potencia * 100)} %${b.alimentada ? " (comió hoy)" : ""}`;
}


// ===== Lo que dice al acariciarla =====
// Frases según cómo está. {n} es su nombre. Cada especie tiene las suyas para cría y adulta.
const FRASES = {
    huevo: [
        "El huevo se mueve un poco bajo tu mano.",
        "Sientes calor dentro del cascarón: algo crece ahí.",
        "Un golpecito desde adentro. Te escuchó.",
    ],
    triste: [
        "{n} apenas levanta la cabeza. Te extrañaba.",
        "{n} te mira sin fuerzas. Cumple una misión y verás cómo cambia.",
    ],
    hambre: [
        "Le suenan las tripas: tiene hambre.",
        "Mira tu bolsa de monedas con ojos grandes: tiene hambre.",
    ],
};

const FRASES_ESPECIE = {
    dragon: {
        cria: ["{n} cierra los ojos y ronronea como una brasa.", "{n} te muerde el dedo, sin fuerza: quiere jugar.",
               "{n} suelta una chispa de alegría.", "{n} se acurruca en tu mano y deja de temblar."],
        adulto: ["{n} inclina la cabeza ante ti: te reconoce.", "{n} te mira con calma. Confía en ti.",
                 "{n} despliega las alas y deja escapar un rugido grave.", "{n} apoya el hocico en tu hombro, como diciendo «sigue»."],
    },
    cuervo: {
        cria: ["{n} grazna bajito y se esponja.", "{n} tironea de un hilo de tu manga."],
        adulto: ["{n} se posa en tu hombro y mira el camino.", "{n} deja a tus pies una moneda brillante.",
                 "{n} grazna dos veces: dice que el camino está libre."],
    },
    buho: {
        cria: ["{n} parpadea despacio, un ojo y luego el otro.", "{n} gira la cabeza para mirarte de cabeza."],
        adulto: ["{n} ulula grave, como quien da un consejo.", "{n} te mira sin parpadear. Sabe más de lo que dice.",
                 "{n} esponja las plumas y se queda en silencio, atento."],
    },
    basilisco: {
        cria: ["{n} saca la lengua y te prueba el dedo.", "{n} se enrosca en tu muñeca, tibio."],
        adulto: ["{n} levanta la corona de escamas: te saluda.", "{n} desvía la mirada para no petrificarte. Te cuida.",
                 "{n} se tiende al sol a tu lado, inmóvil como una estatua."],
    },
    grifo: {
        cria: ["{n} intenta rugir y le sale un graznido.", "{n} te picotea la mano y luego la lame."],
        adulto: ["{n} agacha el lomo: te invita a montar.", "{n} extiende las alas y te cubre del viento.",
                 "{n} afila las garras en una roca, listo para el camino."],
    },
    fenix: {
        cria: ["{n} suelta una chispa que no quema.", "{n} se acurruca y su plumón brilla como una brasa."],
        adulto: ["{n} canta y el aire se vuelve tibio.", "{n} posa una pluma de fuego en tu mano. No quema.",
                 "{n} te mira con calma: ya ha caído muchas veces, y siempre volvió."],
    },
    escarcha: {
        cria: ["{n} estornuda y te deja escarcha en la nariz.", "{n} se enrosca en tu mano y la enfría un poco."],
        adulto: ["{n} exhala y el aire se llena de cristales.", "{n} inclina la cabeza, fría y tranquila: te reconoce.",
                 "{n} despliega las alas y cae una nevada suave."],
    },
};

// Lo que responde al acariciarla. "mascota" viene de describirAvatar() (especie, etapa, triste, nombre).
export function fraseAlAcariciar(estado, mascota, fecha, azar = Math.random) {
    const elegir = (lista) => lista[Math.floor(azar() * lista.length)].replace("{n}", mascota.nombre);
    if (mascota.triste) return elegir(FRASES.triste);
    const etapa = mascota.etapa.clave;
    if (etapa === "huevo") return elegir(FRASES.huevo);
    const propias = FRASES_ESPECIE[mascota.especie] || FRASES_ESPECIE[INICIAL];
    const frase = elegir(propias[etapa] || propias.adulto);
    // Si ya salió del huevo y hoy no comió, a veces lo dice.
    if (!comioHoy(estado, fecha) && azar() < 0.4) return `${frase} ${elegir(FRASES.hambre)}`;
    return frase;
}


// ===== (v103) El vínculo: cuidarla cada día =====
// Cada mascota tiene su vínculo contigo (puntos). Sube con los CUIDADOS de cada día (cada uno una vez al día)
// y con las exploraciones. Con más vínculo aprende trucos y pelea un poco más fuerte en la Torre.
//
// Lo que se guarda (estado.mascota):
//   vinculo       = { dragon: 37, fenix: 5 }                       los puntos de cada una
//   cuidados      = { fecha: "AAAA-MM-DD", hechos: { dragon: ["jugar", "cepillar"] } }   solo los de HOY
//   exploraciones = { "AAAA-MM-DD": { especie, tipo, cantidad, texto } }                  una por día

export const CUIDADOS = {
    acariciar: { nombre: "Acariciar", icono: "🤚", puntos: 2, huevo: true,  texto: "Una caricia. Siempre funciona." },
    jugar:     { nombre: "Jugar",     icono: "🎲", puntos: 3, huevo: false, texto: "Le lanzas algo y lo trae de vuelta." },
    cepillar:  { nombre: "Cepillar",  icono: "🪶", puntos: 2, huevo: true,  texto: "Le limpias las escamas (o las plumas, o el cascarón)." },
    entrenar:  { nombre: "Entrenar",  icono: "⚔️", puntos: 3, huevo: false, texto: "Practican juntos un ataque." },
};

// Los niveles del vínculo. bono = cuánto más pelea en la Torre.
export const VINCULO = [
    { nombre: "Desconocido", desde: 0,   bono: 0 },
    { nombre: "Conocido",    desde: 12,  bono: 0.04 },
    { nombre: "Compañero",   desde: 35,  bono: 0.08 },
    { nombre: "Amigo fiel",  desde: 75,  bono: 0.12 },
    { nombre: "Alma gemela", desde: 140, bono: 0.16 },
];

// Los trucos: se aprenden con el vínculo (nivel = el índice en VINCULO). animacion = clase CSS del dibujo.
export const TRUCOS = [
    { id: "sentarse", nombre: "Sentarse",       icono: "🐾", nivel: 1, animacion: "truco-sentarse", frase: "{n} se sienta, muy derecho, y te mira esperando." },
    { id: "saludar",  nombre: "Saludar",        icono: "🤚", nivel: 2, animacion: "truco-saludar",  frase: "{n} levanta una garra y la mueve. ¡Te está saludando!" },
    { id: "rugir",    nombre: "Rugido",         icono: "💥", nivel: 3, animacion: "truco-rugir",    frase: "{n} suelta un rugido que hace temblar la ventana." },
    { id: "vuelta",   nombre: "Vuelta en el aire", icono: "🌀", nivel: 4, animacion: "truco-vuelta", frase: "{n} da una vuelta completa en el aire y aterriza con estilo." },
];

export const VINCULO_EXPLORAR = 2;   // puntos de vínculo por explorar

export const vinculoDe = (estado, especie) => estado.mascota?.vinculo?.[especie] || 0;

// El nivel del vínculo: { indice, nombre, bono, puntos, siguiente (o null), porcentaje hasta el siguiente }.
export function nivelDeVinculo(puntos) {
    let indice = 0;
    VINCULO.forEach((v, i) => { if (puntos >= v.desde) indice = i; });
    const actual = VINCULO[indice], siguiente = VINCULO[indice + 1] || null;
    const porcentaje = siguiente ? Math.round((100 * (puntos - actual.desde)) / (siguiente.desde - actual.desde)) : 100;
    return { indice, ...actual, puntos, siguiente, porcentaje };
}

// Los cuidados que ya le diste HOY a esa mascota.
export function cuidadosDeHoy(estado, especie, fecha) {
    const c = estado.mascota?.cuidados;
    return c?.fecha === fecha ? c.hechos?.[especie] || [] : [];
}

export const trucosDe = (puntos) => TRUCOS.filter((t) => nivelDeVinculo(puntos).indice >= t.nivel);

// ===== Explorar =====
// Una vez al día la mandas a explorar y vuelve con algo. Los premios son pequeños: es un regalo, no un trabajo.
const HALLAZGOS = [
    { tipo: "gemas",  min: 3, max: 9, peso: 45, texto: "{n} vuelve con {c} gemas brillando en el hocico." },
    { tipo: "fichas", min: 1, max: 1, peso: 20, texto: "{n} encontró una ficha del arcade entre unas raíces." },
    { tipo: "vida",   min: 4, max: 8, peso: 20, texto: "{n} te trae unas hierbas que curan: +{c} de vida." },
    { tipo: "nada",   min: 0, max: 0, peso: 15, texto: "{n} vuelve cansado y sin nada… pero muy contento de verte." },
];
const LUGARES = ["el bosque", "las ruinas del valle", "la orilla del río", "las colinas", "una cueva cercana", "el viejo camino real"];

export function explorar(nombre, azar = Math.random) {
    const total = HALLAZGOS.reduce((s, h) => s + h.peso, 0);
    let r = azar() * total, hallazgo = HALLAZGOS[0];
    for (const h of HALLAZGOS) { if ((r -= h.peso) < 0) { hallazgo = h; break; } }
    const cantidad = hallazgo.min + Math.floor(azar() * (hallazgo.max - hallazgo.min + 1));
    const lugar = LUGARES[Math.floor(azar() * LUGARES.length)];
    return { tipo: hallazgo.tipo, cantidad, lugar,
             texto: `Exploró ${lugar}. ${hallazgo.texto.replace("{n}", nombre).replace("{c}", cantidad)}` };
}

// La vida que te curan las hierbas que trajo hoy (vida.js la suma, como la comida).
export function curaDeExploracion(estado, fecha) {
    const e = estado.mascota?.exploraciones?.[fecha];
    return e?.tipo === "vida" ? e.cantidad : 0;
}
