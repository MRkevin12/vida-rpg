// memento.js — El calendario de Memento Mori (v142): tu vida en semanas.
//
// Una casilla por cada semana de una vida de `esperanza` años (52 casillas por fila, una fila por año de edad).
// Las semanas que ya viviste se pintan llenas, la de ahora parpadea y las que quedan están vacías.
// Es solo para mirar y pensar: no da XP ni cambia nada del juego.
//
// Aquí solo hay reglas (sin pantalla ni guardar). Lo guardado vive en estado.memento = { nacimiento: "AAAA-MM-DD" | null, esperanza }.
// La fecha de nacimiento es un dato personal: NUNCA va en el código (el repo es público), solo en la partida del teléfono.

import { desdeTexto, aTexto, diasEntre, esFechaValida } from "./fechas.js";

export const SEMANAS_POR_ANIO = 52;
export const ESPERANZA_INICIAL = 80;
export const ESPERANZA_MIN = 40;
export const ESPERANZA_MAX = 120;
export const NACIMIENTO_MIN = "1900-01-01";

// Frases para tener presente que el tiempo se acaba. Traducciones libres de textos antiguos (dominio público).
export const FRASES = [
    { texto: "No es que tengamos poco tiempo: es que perdemos mucho.", autor: "Séneca" },
    { texto: "Podrías dejar la vida ahora mismo. Que eso decida lo que haces, dices y piensas.", autor: "Marco Aurelio" },
    { texto: "No actúes como si fueras a vivir diez mil años. Mientras vives, mientras puedes, sé bueno.", autor: "Marco Aurelio" },
    { texto: "Mientras aplazamos la vida, la vida pasa.", autor: "Séneca" },
    { texto: "Aprovecha el día y confía lo menos posible en el mañana.", autor: "Horacio" },
    { texto: "Cada día es una vida pequeña: empieza y termina.", autor: "Séneca" },
    { texto: "Lo que haces hoy es lo único que de verdad tienes.", autor: "Marco Aurelio" },
    { texto: "Ordena tus días como si cada uno fuera el último y también el primero.", autor: "Séneca" },
    { texto: "Recuerda que vas a morir. Y por eso, hoy, empieza.", autor: "Memento mori" },
];

// La frase del día: la misma todo el día, otra mañana.
export const fraseDelDia = (fecha) => FRASES[((diasEntre("2000-01-01", fecha) % FRASES.length) + FRASES.length) % FRASES.length];

// Tu cumpleaños número n ("AAAA-MM-DD"). Si naciste un 29 de febrero, en los años sin 29 cae el 1 de marzo.
export function cumpleanos(nacimiento, n) {
    const d = desdeTexto(nacimiento);
    return aTexto(new Date(d.getFullYear() + n, d.getMonth(), d.getDate()));
}

// Años cumplidos en una fecha.
export function edadEn(nacimiento, fecha) {
    let edad = desdeTexto(fecha).getFullYear() - desdeTexto(nacimiento).getFullYear();
    while (edad > 0 && cumpleanos(nacimiento, edad) > fecha) edad -= 1;
    return Math.max(0, edad);
}

// ¿Datos válidos? Devuelve { nacimiento, esperanza } limpios o lanza un error en español.
export function leerDatos({ nacimiento, esperanza }, fecha) {
    const nac = String(nacimiento ?? "").trim();
    if (!esFechaValida(nac)) throw new Error("Escribe tu fecha de nacimiento completa.");
    if (nac < NACIMIENTO_MIN) throw new Error("Esa fecha de nacimiento es muy antigua.");
    if (nac > fecha) throw new Error("Tu fecha de nacimiento no puede ser en el futuro.");
    const anios = Math.round(Number(String(esperanza ?? ESPERANZA_INICIAL).replace(",", ".")));
    if (!Number.isFinite(anios) || anios < ESPERANZA_MIN || anios > ESPERANZA_MAX) {
        throw new Error(`Los años de vida deben estar entre ${ESPERANZA_MIN} y ${ESPERANZA_MAX}.`);
    }
    if (anios <= edadEn(nac, fecha)) throw new Error("Esos años deben ser más que tu edad de hoy.");
    return { nacimiento: nac, esperanza: anios };
}

// Todo lo que muestra la pantalla, en una fecha. m = estado.memento. Sin fecha de nacimiento devuelve null.
// vividas = semanas ya completadas; la semana de ahora es la número vividas + 1.
export function calcular(m, fecha) {
    if (!m?.nacimiento) return null;
    const edad = edadEn(m.nacimiento, fecha);
    const semana = Math.min(SEMANAS_POR_ANIO - 1, Math.floor(diasEntre(cumpleanos(m.nacimiento, edad), fecha) / 7));
    const esperanza = m.esperanza || ESPERANZA_INICIAL;
    const total = esperanza * SEMANAS_POR_ANIO;
    const vividas = edad * SEMANAS_POR_ANIO + semana;
    const superada = edad >= esperanza;   // ya viviste más de lo que esperabas: la rejilla se alarga un año más
    const filas = superada ? edad + 1 : esperanza;
    const totalVisto = filas * SEMANAS_POR_ANIO;
    const diasRestantes = Math.max(0, diasEntre(fecha, cumpleanos(m.nacimiento, esperanza)));
    return {
        edad, semana, esperanza, filas, total, vividas, superada,
        actual: vividas + 1,
        restantes: Math.max(0, totalVisto - vividas - 1),
        porcentaje: Math.min(100, ((vividas + 1) / total) * 100),
        diasVividos: diasEntre(m.nacimiento, fecha),
        diasRestantes,
        aniosRestantes: Math.max(0, esperanza - edad - (semana / SEMANAS_POR_ANIO)),
    };
}

// Cuántas casillas de una fila (un año de edad) están vividas, cuál es la de ahora y cuántas faltan.
// Devuelve { vividas, ahora (0 o 1), futuras }; las tres suman SEMANAS_POR_ANIO.
export function casillasDeFila(fila, edad, semana) {
    if (fila < edad) return { vividas: SEMANAS_POR_ANIO, ahora: 0, futuras: 0 };
    if (fila > edad) return { vividas: 0, ahora: 0, futuras: SEMANAS_POR_ANIO };
    return { vividas: semana, ahora: 1, futuras: SEMANAS_POR_ANIO - semana - 1 };
}
