// rutinas-plantillas.js — Plantillas de rutinas del gimnasio (v177).
//
// Una plantilla es un plan listo (por ejemplo «Empuje / Tirón / Piernas» = 3 rutinas) con sus ejercicios y series.
// El OBJETIVO cambia las series y qué ejercicios lleva (las repeticiones de cada ejercicio son fijas, ver gym.js):
//   🔥 Déficit  — bajar grasa conservando músculo: menos series y casi solo ejercicios compuestos.
//   ⚖️ Mantener — mantener lo que ganaste: volumen medio.
//   💪 Aumento  — ganar músculo: más series y también ejercicios de aislamiento.
// Cada ejercicio es [id, series en déficit, series al mantener, series en aumento]; 0 = ese objetivo no lo lleva.
// Aquí solo hay datos y una función pura (no toca la partida): acciones.crearRutinasDePlantilla las guarda.

import * as gym from "./gym.js";

export const OBJETIVOS = {
    deficit:  { icono: "🔥", nombre: "Déficit",  texto: "Bajar grasa conservando músculo: menos series y ejercicios compuestos. Mantén el peso en la barra y descansa bien." },
    mantener: { icono: "⚖️", nombre: "Mantener", texto: "Mantener lo que ganaste: volumen medio, un poco de todo." },
    aumento:  { icono: "💪", nombre: "Aumento",  texto: "Ganar músculo: más series y también ejercicios de aislamiento. Funciona mejor comiendo algo más de lo que gastas y durmiendo bien." },
};
const POSICION = { deficit: 1, mantener: 2, aumento: 3 };

export const PLANTILLAS = [
    {
        id: "cuerpo-completo", icono: "🧍", nombre: "Cuerpo completo", dias: "3 días a la semana",
        texto: "Una sola rutina que trabaja todo el cuerpo. Se repite 3 veces a la semana con un día de descanso entre una y otra.",
        rutinas: [
            { nombre: "Cuerpo completo", icono: "🧍", ejercicios: [
                ["sentadilla", 3, 3, 4], ["press-banca", 3, 3, 4], ["jalon-pecho", 3, 3, 4], ["peso-muerto-rumano", 2, 3, 3],
                ["press-hombros", 2, 2, 3], ["curl-barra", 0, 2, 2], ["press-frances", 0, 2, 2], ["plancha", 2, 2, 2],
            ] },
        ],
    },
    {
        id: "empuje-tiron-piernas", icono: "🔀", nombre: "Empuje / Tirón / Piernas", dias: "3 a 6 días a la semana",
        texto: "Tres rutinas: empuje (pecho, hombros y tríceps), tirón (espalda y bíceps) y piernas. Las haces en ese orden y vuelves a empezar.",
        rutinas: [
            { nombre: "Empuje", icono: "🛡️", ejercicios: [
                ["press-banca", 3, 4, 4], ["press-inclinado", 3, 3, 3], ["press-hombros", 3, 3, 4], ["elevaciones-laterales", 0, 3, 4],
                ["pec-deck", 0, 0, 3], ["triceps-polea", 2, 3, 3], ["press-frances", 0, 0, 3],
            ] },
            { nombre: "Tirón", icono: "🦾", ejercicios: [
                ["jalon-pecho", 3, 4, 4], ["remo-sentado", 3, 3, 4], ["remo-unilateral", 0, 3, 3], ["face-pull", 2, 0, 0],
                ["pajaros", 0, 3, 3], ["curl-barra", 2, 3, 3], ["curl-martillo", 0, 0, 3],
            ] },
            { nombre: "Piernas", icono: "🦵", ejercicios: [
                ["sentadilla", 3, 3, 4], ["prensa-piernas", 0, 3, 4], ["peso-muerto-rumano", 3, 3, 4], ["curl-femoral-sentado", 0, 3, 3],
                ["hip-thrust", 2, 3, 3], ["extension-cuadriceps", 0, 0, 3], ["talones-de-pie", 2, 3, 4],
            ] },
        ],
    },
    {
        id: "torso-piernas", icono: "↕️", nombre: "Torso / Piernas", dias: "4 días a la semana",
        texto: "Dos rutinas: torso (pecho, espalda, hombros y brazos) y piernas. Las alternas: torso, piernas, descanso, torso, piernas…",
        rutinas: [
            { nombre: "Torso", icono: "🏋️", ejercicios: [
                ["press-banca", 3, 3, 4], ["jalon-pecho", 3, 3, 4], ["press-hombros", 3, 3, 3], ["remo-sentado", 3, 3, 4],
                ["press-inclinado", 0, 0, 3], ["curl-barra", 0, 2, 3], ["triceps-polea", 0, 2, 3],
            ] },
            { nombre: "Piernas", icono: "🦵", ejercicios: [
                ["sentadilla", 3, 3, 4], ["peso-muerto-rumano", 3, 3, 4], ["prensa-piernas", 0, 3, 3], ["curl-femoral-sentado", 0, 3, 3],
                ["hip-thrust", 2, 2, 3], ["talones-de-pie", 2, 3, 4], ["plancha", 2, 2, 2],
            ] },
        ],
    },
];

// Las rutinas de una plantilla para un objetivo: [{ nombre, icono, ejercicios: [{ id, series }] }].
export function armarPlantilla(plantillaId, objetivo) {
    const plantilla = PLANTILLAS.find((p) => p.id === plantillaId);
    if (!plantilla) throw new Error("Esa plantilla no existe.");
    if (!OBJETIVOS[objetivo]) throw new Error("Ese objetivo no existe.");
    return plantilla.rutinas.map((r) => ({
        nombre: `${r.nombre} · ${OBJETIVOS[objetivo].nombre}`,
        icono: r.icono,
        ejercicios: r.ejercicios
            .filter((x) => x[POSICION[objetivo]] > 0 && gym.ejercicioPorId(x[0]))
            .map((x) => ({ id: x[0], series: Math.min(gym.MAX_SERIES, x[POSICION[objetivo]]) })),
    }));
}

// El objetivo que va con tu peso objetivo: si quieres bajar, déficit; si quieres subir, aumento; si no, mantener. (null si no hay datos)
export function objetivoSugerido(g) {
    const ultimo = g.peso?.[g.peso.length - 1]?.kg;
    if (!g.metaPeso || !ultimo) return null;
    return g.metaPeso < ultimo - 0.5 ? "deficit" : g.metaPeso > ultimo + 0.5 ? "aumento" : "mantener";
}
