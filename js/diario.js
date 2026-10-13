// diario.js — Las reglas del diario.
//
// Cada día puedes escribir una entrada: cómo te fue (5 ánimos), una respuesta a la
// pregunta del día, y algo que agradeces. Se guarda en estado.diario["2026-10-12"].
// Escribirlo da un pequeño premio y cura un poco de vida (ver vida.js).
//
// Aquí solo hay datos y cálculos (la racha del diario, el calendario de ánimo, lo que
// tu diario dice de ti, los recuerdos y la búsqueda). Nada se dibuja ni se guarda.

import { ANIMOS_DIARIO, misionesDelDia, hechasPorFecha, plural } from "./juego.js";
import { sumarDias, diaDeSemana, desdeTexto } from "./fechas.js";

// Premio por escribir el diario (una vez por día).
export const PREMIO_DIARIO = { xp: 5, monedas: 2, atributo: "carisma" };

// Largo máximo de cada parte.
export const LARGO = { texto: 500, gratitud: 120 };

// Las preguntas del día: una distinta cada día, siempre la misma para esa fecha.
export const PREGUNTAS = [
    "¿Qué fue lo mejor de hoy?",
    "¿Qué aprendiste hoy?",
    "¿Qué te costó más y cómo lo enfrentaste?",
    "¿Qué harías distinto mañana?",
    "¿A quién ayudaste hoy, o quién te ayudó?",
    "¿Qué te hizo sonreír?",
    "¿De qué te sientes orgulloso hoy?",
    "¿Qué te preocupa y qué puedes hacer al respecto?",
    "¿Qué avance hiciste en tus metas grandes?",
    "¿Cómo cuidaste tu cuerpo hoy?",
    "¿Qué te distrajo y cómo lo evitarías?",
    "¿Qué quieres recordar de este día?",
    "¿Qué hiciste hoy que tu yo del futuro va a agradecer?",
    "Si hoy fuera un capítulo de tu historia, ¿cómo se llamaría?",
];

// Los días desde el 1 de enero de 1970 sirven de número para elegir la pregunta.
export function preguntaDelDia(fecha) {
    const dias = Math.round(desdeTexto(fecha).getTime() / 86400000);
    return PREGUNTAS[((dias % PREGUNTAS.length) + PREGUNTAS.length) % PREGUNTAS.length];
}

// ¿La entrada tiene algo escrito o un ánimo? (una vacía se borra)
export function tieneContenido({ animo, texto, gratitud }) {
    return Boolean(animo || texto || gratitud);
}

// Racha del diario: días seguidos escribiendo. Hoy sin escribir todavía no la rompe.
export function rachaDiario(estado, hoy) {
    let fecha = estado.diario[hoy] ? hoy : sumarDias(hoy, -1);
    let racha = 0;
    while (estado.diario[fecha]) {
        racha += 1;
        fecha = sumarDias(fecha, -1);
    }
    return racha;
}

// El ánimo promedio de una lista de entradas (5 = genial … 1 = terrible), o null si no hay.
export function promedioAnimo(entradas) {
    const valores = entradas.filter((e) => e.animo && ANIMOS_DIARIO[e.animo]).map((e) => ANIMOS_DIARIO[e.animo].valor);
    if (!valores.length) return null;
    return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

// El ánimo más cercano a un promedio (para mostrarlo con su carita).
export function animoDe(promedio) {
    if (promedio === null) return null;
    return Object.keys(ANIMOS_DIARIO).reduce((mejor, clave) =>
        Math.abs(ANIMOS_DIARIO[clave].valor - promedio) < Math.abs(ANIMOS_DIARIO[mejor].valor - promedio) ? clave : mejor);
}

// El calendario de ánimo de un mes ("2026-10"): las semanas de lunes a domingo.
// Cada celda: { fecha, animo, escrito, futuro } o null (los huecos antes del día 1).
export function mesDeAnimo(estado, mes, hoy) {
    const primero = `${mes}-01`;
    const celdas = Array.from({ length: diaDeSemana(primero) }, () => null);
    for (let fecha = primero; fecha.startsWith(mes); fecha = sumarDias(fecha, 1)) {
        const entrada = estado.diario[fecha];
        celdas.push({ fecha, animo: entrada?.animo || null, escrito: Boolean(entrada), futuro: fecha > hoy });
    }
    return celdas;
}

// Lo que tu diario dice de ti. Necesita al menos 7 días con ánimo para decir algo.
//   - Tu ánimo los días que cumpliste todas tus misiones, frente a los demás.
//   - El día de la semana en que mejor te sientes.
export const MINIMO_PARA_ANALIZAR = 7;

export function loQueDiceTuDiario(estado) {
    const conAnimo = Object.entries(estado.diario).filter(([, e]) => e.animo && ANIMOS_DIARIO[e.animo]);
    if (conAnimo.length < MINIMO_PARA_ANALIZAR) return { suficiente: false, faltan: MINIMO_PARA_ANALIZAR - conAnimo.length };

    const hechas = hechasPorFecha(estado.completadas);
    const cumplidos = [];
    const otros = [];
    const porDiaSemana = Array.from({ length: 7 }, () => []);
    for (const [fecha, entrada] of conAnimo) {
        const tocaban = misionesDelDia(estado.misiones, fecha);
        const hizo = hechas.get(fecha) || new Set();
        if (tocaban.length) (tocaban.every((m) => hizo.has(m.id)) ? cumplidos : otros).push(entrada);
        porDiaSemana[diaDeSemana(fecha)].push(entrada);
    }

    // El mejor día de la semana: solo entre los que tienen 2 entradas o más.
    let mejorDia = null;
    porDiaSemana.forEach((entradas, dia) => {
        const promedio = entradas.length >= 2 ? promedioAnimo(entradas) : null;
        if (promedio !== null && (!mejorDia || promedio > mejorDia.promedio)) mejorDia = { dia, promedio };
    });

    return {
        suficiente: true,
        total: conAnimo.length,
        cumpliendo: { promedio: promedioAnimo(cumplidos), dias: cumplidos.length },
        sinCumplir: { promedio: promedioAnimo(otros), dias: otros.length },
        mejorDia,
    };
}

// Recuerdos: lo que escribiste hace una semana, un mes y un año (si escribiste ese día).
export function recuerdos(estado, hoy) {
    const hace = [
        { titulo: "Hace una semana", fecha: sumarDias(hoy, -7) },
        { titulo: "Hace un mes", fecha: mismoDiaAntes(hoy, 1) },
        { titulo: "Hace un año", fecha: mismoDiaAntes(hoy, 12) },
    ];
    return hace.filter((r) => estado.diario[r.fecha]).map((r) => ({ ...r, entrada: estado.diario[r.fecha] }));
}

// El mismo día, N meses antes (si ese mes es más corto, el último día del mes).
function mismoDiaAntes(fecha, meses) {
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const total = anio * 12 + (mes - 1) - meses;
    const nuevoAnio = Math.floor(total / 12);
    const nuevoMes = (total % 12) + 1;
    const ultimo = new Date(nuevoAnio, nuevoMes, 0).getDate();
    return `${nuevoAnio}-${String(nuevoMes).padStart(2, "0")}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`;
}

// Las entradas, de la más nueva a la más vieja, filtradas por texto y por ánimo.
// La búsqueda no distingue mayúsculas ni tildes («cancion» encuentra «canción»).
export function buscarEntradas(estado, { texto = "", animo = null } = {}) {
    const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const buscado = normal(texto.trim());
    return Object.entries(estado.diario)
        .filter(([, e]) => !animo || e.animo === animo)
        .filter(([, e]) => !buscado || normal(`${e.texto} ${e.gratitud}`).includes(buscado))
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([fecha, entrada]) => ({ fecha, ...entrada }));
}

// Todo el diario como texto (para descargarlo y guardarlo donde quieras).
export function diarioComoTexto(estado, nombre) {
    const lineas = [`Diario de ${nombre} — Vida RPG`, ""];
    for (const e of buscarEntradas(estado)) {
        const animo = e.animo && ANIMOS_DIARIO[e.animo] ? `${ANIMOS_DIARIO[e.animo].icono} ${ANIMOS_DIARIO[e.animo].nombre}` : "";
        lineas.push(`=== ${e.fecha} ${animo}`.trim());
        if (e.texto) lineas.push(e.pregunta ? `${e.pregunta}\n${e.texto}` : e.texto);
        if (e.gratitud) lineas.push(`Agradezco: ${e.gratitud}`);
        lineas.push("");
    }
    lineas.push(plural(Object.keys(estado.diario).length, "entrada", "entradas"));
    return lineas.join("\n");
}
