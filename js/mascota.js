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
        potencia: potenciaDe(m.etapa.clave, { alimentada, triste: m.triste }),
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
