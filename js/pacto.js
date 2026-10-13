// pacto.js — El Tratado de la Voluntad: un pacto contigo mismo.
//
// Es un juramento serio, por ti y para ti: te compromete a usar la app cada día.
// Se firma con el dedo y queda sellado con lacre. Después, la app te recuerda cada
// día cuánto llevas cumpliéndolo («días honrados»).
//
// Aquí están el texto del tratado y los cálculos. Nada se dibuja ni se guarda.
// Las citas son de autores clásicos (traducciones libres de obras de dominio público).

import { misionesDelDia, enDescanso } from "./juego.js";
import { sumarDias, diasEntre, desdeTexto } from "./fechas.js";

export const LARGO_RAZON = 300;

// La firma se guarda como un trazo SVG en un recuadro de 600 × 200 ("M10 20 L12 22 …").
// Solo se aceptan esas letras y números: así nadie puede colar otra cosa en la página.
export const ANCHO_FIRMA = 600;
export const ALTO_FIRMA = 200;

export function firmaValida(trazo) {
    const texto = String(trazo || "");
    return /^M[\d. ML]*$/.test(texto) && texto.length <= 20000 && (texto.match(/L/g) || []).length >= 8;
}


// ===== El texto del tratado =====

export const EPIGRAFE = { texto: "El carácter del hombre es su destino.", autor: "Heráclito" };

// tratamiento: «caballero» o «dama» (según el cuerpo de tu avatar).
export function preambulo(nombre, tratamiento) {
    return [
        `Yo, ${nombre}, ${tratamiento} de mi propia vida, en pleno uso de mi razón y por mi sola voluntad, celebro este
         pacto entre las dos únicas partes que importan: quien soy hoy y quien he decidido llegar a ser.`,
        `No lo juro ante un rey, ni ante un maestro, ni ante la mirada de nadie. Lo juro ante el único testigo al que
         jamás podré engañar: yo mismo.`,
        `Sé que la vida no se mide por los días que pasan, sino por lo que hago con ellos. Por eso, desde hoy, cada día
         será una batalla, y este libro, el lugar donde quede escrita.`,
    ];
}

export const ARTICULOS = [
    {
        titulo: "De la constancia",
        texto: `Abriré este libro cada día: en los días de gloria y en los días grises. No esperaré a tener ganas, porque
                las ganas no llegan antes del primer paso: llegan después.`,
        cita: { texto: "Nos hacemos justos practicando la justicia, y valientes practicando la valentía.", autor: "Aristóteles" },
    },
    {
        titulo: "De la verdad",
        texto: `Solo marcaré lo que de verdad hice. Este juego no tiene árbitro: si lo engaño, nadie lo sabrá, y por eso
                mismo la derrota será doble, porque perderé la batalla y también el respeto por mí mismo.`,
        cita: { texto: "Si no es correcto, no lo hagas; si no es verdad, no lo digas.", autor: "Marco Aurelio" },
    },
    {
        titulo: "De la caída",
        texto: `Fallaré, porque soy de carne y hueso. Pero un día perdido no es una guerra perdida. Mi ley será esta:
                nunca fallar dos días seguidos. Si caigo hoy, mañana me levanto, sin drama y sin excusas.`,
        cita: { texto: "Mientras se aplaza, la vida pasa.", autor: "Séneca" },
    },
    {
        titulo: "Del tiempo",
        texto: `Mi tiempo es lo único que de verdad me pertenece. Cada hora que le regalo a la distracción es una hora que
                le robo a la persona que quiero ser.`,
        cita: { texto: "No es que tengamos poco tiempo, sino que perdemos mucho.", autor: "Séneca" },
    },
    {
        titulo: "Del descanso",
        texto: `Descansaré cuando haga falta, porque también en la quietud se afila la espada. Pero mi descanso será una
                pausa con honor, nunca un escondite.`,
    },
    {
        titulo: "De las recompensas",
        texto: `Solo disfrutaré los premios que haya ganado. Un premio robado no sabe a victoria: sabe a deuda.`,
    },
    {
        titulo: "Del juicio",
        texto: `Cada semana miraré mi camino de frente: sin crueldad, porque no soy mi enemigo; y sin excusas, porque
                tampoco soy mi cómplice.`,
        cita: { texto: "¿Hasta cuándo esperarás para exigirte lo mejor de ti?", autor: "Epicteto" },
    },
    {
        titulo: "Del porqué",
        texto: `No hago esto para que alguien me aplauda ni para demostrarle nada a nadie. Lo hago por mí y para mí,
                porque merezco la vida que estoy dispuesto a construir.`,
        conRazon: true,   // aquí va lo que tú escribas: «Y lo hago, sobre todo, por esto…»
    },
];

export const CIERRE = `Firmo con la tinta de mi voluntad, que es la sangre del alma. Que este pacto no se cumpla en el
    papel, sino en mis actos de cada día. Y que el día en que quiera rendirme, vuelva a estas palabras y recuerde quién
    prometí ser.`;

export const CITA_FINAL = { texto: "Llega a ser el que eres.", autor: "Píndaro" };

// Los números romanos de los artículos.
export const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];


// ===== Una cita para cada día (en la pantalla Hoy) =====

export const CITAS = [
    EPIGRAFE,
    ...ARTICULOS.filter((a) => a.cita).map((a) => a.cita),
    CITA_FINAL,
    { texto: "Un viaje de mil li comienza con un solo paso.", autor: "Lao-Tse" },
    { texto: "No pierdas más tiempo discutiendo cómo debe ser un hombre bueno. Sé uno.", autor: "Marco Aurelio" },
    { texto: "Nunca fallar dos días seguidos.", autor: "Artículo III de tu pacto" },
    { texto: "Lo hago por mí y para mí.", autor: "Artículo VIII de tu pacto" },
];

export function citaDelDia(fecha) {
    const dias = Math.round(desdeTexto(fecha).getTime() / 86400000);
    return CITAS[((dias % CITAS.length) + CITAS.length) % CITAS.length];
}


// ===== ¿Estás cumpliendo tu pacto? =====
// Un día está «honrado» si ese día hiciste algo (una misión, una tarea, una sesión de
// enfoque o tu diario) o estabas en modo descanso. Los días sin misiones que tocaran y
// sin nada hecho no cuentan ni a favor ni en contra. Hoy solo suma: todavía no termina.

function huboActividad(estado, fecha) {
    return estado.completadas.some((c) => c.fecha === fecha) ||
        estado.tareas.some((t) => t.hechaEn === fecha) ||
        estado.enfoque.sesiones.some((s) => s.fecha === fecha) ||
        Boolean(estado.diario[fecha]);
}

// true = honrado, false = fallado, null = no cuenta.
export function estadoDelDia(estado, fecha) {
    if (huboActividad(estado, fecha) || enDescanso(estado, fecha)) return true;
    return misionesDelDia(estado.misiones, fecha).length ? false : null;
}

export function cumplimientoDelPacto(estado, hoy) {
    const pacto = estado.pacto;
    if (!pacto) return null;
    let honrados = 0;
    let contados = 0;
    for (let fecha = pacto.primeraVez; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
        const resultado = estadoDelDia(estado, fecha);
        if (fecha === hoy && resultado !== true) continue;   // hoy todavía no termina
        if (resultado === null) continue;
        contados += 1;
        if (resultado) honrados += 1;
    }
    const ayer = sumarDias(hoy, -1);
    return {
        dia: diasEntre(pacto.primeraVez, hoy) + 1,          // «Día N de tu pacto»
        honrados,
        contados,
        porcentaje: contados ? Math.round((honrados / contados) * 100) : null,
        ayerFallado: ayer >= pacto.primeraVez && estadoDelDia(estado, ayer) === false,
        hoyHonrado: estadoDelDia(estado, hoy) === true,
    };
}
