// memento.js — El calendario de Memento Mori (v142): tu vida en semanas.
//
// Una casilla por cada semana de una vida de `esperanza` años (52 casillas por fila, una fila por año de edad).
// Las semanas que ya viviste se pintan llenas, la de ahora parpadea y las que quedan están vacías.
// Es solo para mirar y pensar: no da XP ni cambia nada del juego.
//
// Aquí solo hay reglas (sin pantalla ni guardar). Lo guardado vive en estado.memento = { nacimiento: "AAAA-MM-DD" | null, esperanza }.
// La fecha de nacimiento es un dato personal: NUNCA va en el código (el repo es público), solo en la partida del teléfono.

import { desdeTexto, aTexto, diasEntre, esFechaValida, sumarDias, lunesDe } from "./fechas.js";

export const SEMANAS_POR_ANIO = 52;
export const ESPERANZA_INICIAL = 80;
export const ESPERANZA_MIN = 40;
export const ESPERANZA_MAX = 120;
export const NACIMIENTO_MIN = "1900-01-01";

// Frases para tener presente que el tiempo se acaba. Traducciones libres de textos antiguos (dominio público).
// (v148) etapas: a qué etapas de la vida le habla cada frase (los id de ETAPAS, más abajo). Sin etapas = sirve para todas.
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
    // Para quien empieza: el tiempo parece infinito y no lo es.
    { texto: "Nadie es tan joven que no pueda morir mañana. Lo que quieres ser, empiézalo hoy.", autor: "Séneca", etapas: ["infancia", "juventud"] },
    { texto: "La juventud no es un adelanto de tiempo: es tiempo que ya se está gastando.", autor: "Séneca", etapas: ["juventud"] },
    { texto: "Los hábitos de hoy son el carácter de mañana.", autor: "Aristóteles", etapas: ["juventud", "adultez"] },
    // Para quien construye: la prisa y las obligaciones se comen la vida.
    { texto: "No es que la vida sea corta: es que la llenamos de ocupaciones que no elegimos.", autor: "Séneca", etapas: ["adultez", "madurez"] },
    { texto: "Busca primero lo que de verdad importa; lo demás puede esperar.", autor: "Marco Aurelio", etapas: ["adultez"] },
    { texto: "Ya no discutas cómo debe ser un hombre bueno: sé uno.", autor: "Marco Aurelio", etapas: ["adultez", "madurez"] },
    // Para quien mira atrás: lo que importa es lo que haces con lo que queda.
    { texto: "Lo vivido ya es tuyo: nadie te lo quita. Cuida lo que te queda.", autor: "Séneca", etapas: ["madurez", "vejez"] },
    { texto: "Una vida bien vivida es larga, aunque los años sean pocos.", autor: "Séneca", etapas: ["madurez", "vejez"] },
    { texto: "Envejecer es enseñar con el ejemplo cómo se vive cada día.", autor: "Cicerón", etapas: ["vejez"] },
];

// Las frases que le hablan a una edad: las de su etapa más las generales (sin etapas). Sin edad: todas.
export function frasesParaEdad(edad) {
    if (!Number.isFinite(edad)) return FRASES;
    const etapa = etapaDeEdad(edad).id;
    return FRASES.filter((f) => !f.etapas || f.etapas.includes(etapa));
}

// La frase del día: la misma todo el día, otra mañana. (v148) Con tu edad, solo entre las que le hablan a tu etapa.
export function fraseDelDia(fecha, edad = null) {
    const lista = frasesParaEdad(edad);
    const n = diasEntre("2000-01-01", fecha);
    return lista[((n % lista.length) + lista.length) % lista.length];
}

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

// ===== (v147) Las etapas de la vida =====
// Cada fila (un año de edad) es de una etapa; la rejilla pinta cada etapa de otro color (los colores están en estilos.css:
// van del amanecer —la infancia— al atardecer —la vejez—). hasta: la última edad de la etapa.
export const ETAPAS = [
    { id: "infancia", nombre: "Infancia", desde: 0, hasta: 12 },
    { id: "juventud", nombre: "Juventud", desde: 13, hasta: 24 },
    { id: "adultez", nombre: "Adultez", desde: 25, hasta: 44 },
    { id: "madurez", nombre: "Madurez", desde: 45, hasta: 64 },
    { id: "vejez", nombre: "Vejez", desde: 65, hasta: Infinity },
];
export const etapaDeEdad = (edad) => ETAPAS.find((e) => edad >= e.desde && edad <= e.hasta) || ETAPAS[ETAPAS.length - 1];

// ===== (v147) Cada casilla y su fecha =====
// La casilla de una fecha: el número de semana de tu vida, desde 0 (fila × 52 + columna). Antes de nacer, null.
export function semanaDeFecha(nacimiento, fecha) {
    if (!esFechaValida(fecha) || fecha < nacimiento) return null;
    const edad = edadEn(nacimiento, fecha);
    const semana = Math.min(SEMANAS_POR_ANIO - 1, Math.floor(diasEntre(cumpleanos(nacimiento, edad), fecha) / 7));
    return edad * SEMANAS_POR_ANIO + semana;
}

// Al revés: las fechas de la casilla número `indice` (desde 0). Devuelve { fila (tu edad), columna, numero (desde 1),
// desde, hasta }. Cada fila empieza en tu cumpleaños; la última semana del año dura hasta el día antes del siguiente
// (un año tiene 365 o 366 días, no 52 × 7 = 364).
export function semanaDeIndice(nacimiento, indice) {
    const fila = Math.floor(indice / SEMANAS_POR_ANIO);
    const columna = indice % SEMANAS_POR_ANIO;
    const desde = sumarDias(cumpleanos(nacimiento, fila), columna * 7);
    const hasta = columna === SEMANAS_POR_ANIO - 1 ? sumarDias(cumpleanos(nacimiento, fila + 1), -1) : sumarDias(desde, 6);
    return { fila, columna, numero: indice + 1, desde, hasta };
}

// ===== (v147) Las semanas que marcaste con lo que hiciste =====
// Solo LEE la partida (no cambia nada). (v152) Devuelve { km, gym, misiones }: tres conjuntos de casillas (como semanaDeFecha),
// uno por tipo de esfuerzo, para pintarlos de colores distintos:
//   km: esa semana corriste al menos una vez (estado.running.carreras) o cumpliste la meta de km (running.semanasCobradas);
//   gym: esa semana cumpliste tu meta de días de gym (gym.metaSemanal);
//   misiones: esa semana hiciste misiones los 7 días (como los 7 días seguidos que dan un escudo).
// Las metas van por semanas de lunes a domingo; se marca la casilla del jueves (el medio de esa semana).
export function semanasMarcadas(estado) {
    const km = new Set();
    const gym = new Set();
    const misiones = new Set();
    const nacimiento = estado?.memento?.nacimiento;
    if (!nacimiento) return { km, gym, misiones };
    const marcar = (conjunto, fecha) => {
        const indice = semanaDeFecha(nacimiento, fecha);
        if (indice !== null) conjunto.add(indice);
    };
    const jueves = (lunes) => sumarDias(lunes, 3);
    // Cuántos días distintos hay en cada semana (por su lunes).
    const diasPorSemana = (fechas) => {
        const cuenta = new Map();
        for (const fecha of new Set(fechas.filter(esFechaValida))) {
            const lunes = lunesDe(fecha);
            cuenta.set(lunes, (cuenta.get(lunes) || 0) + 1);
        }
        return cuenta;
    };
    for (const c of estado.running?.carreras || []) marcar(km, c.fecha);
    for (const lunes of estado.running?.semanasCobradas || []) if (esFechaValida(lunes)) marcar(km, jueves(lunes));
    const metaGym = estado.gym?.metaSemanal || 0;
    if (metaGym > 0) {
        for (const [lunes, dias] of diasPorSemana((estado.gym?.sesiones || []).map((s) => s.fecha))) if (dias >= metaGym) marcar(gym, jueves(lunes));
    }
    for (const [lunes, dias] of diasPorSemana((estado.completadas || []).map((c) => c.fecha))) if (dias >= 7) marcar(misiones, jueves(lunes));
    return { km, gym, misiones };
}
