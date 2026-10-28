// gym.js — El Gimnasio (v66): tu rutina real de gym convertida en fuerza para el héroe.
//
// Solo reglas puras: no toca la pantalla ni guarda nada (eso lo hacen acciones.js y vistas.js).
//
// La idea: cada serie que haces de verdad en el gym le da XP de 💪 Fuerza a tu personaje, sube el nivel de
// ese músculo, y el nivel de gym le da más vida y más ataque en la Torre y en las mazmorras. Además tu avatar
// se ve más ancho de hombros y brazos. Los récords personales y los hitos te empujan a mejorar (sobrecarga progresiva).
//
// Lo guardado (estado.gym) es poco: { sesiones, encurso, hitos, metaSemanal, descanso }. Los niveles, los
// récords y las rachas se CALCULAN desde las sesiones, así que nunca se desordenan (igual que el nivel del personaje).

import { calcularNivel } from "./juego.js";
import { sumarDias, lunesDe, diasEntre } from "./fechas.js";

// ===== Constantes de balance =====
export const XP_POR_SERIE = 4;          // cada serie hecha
export const XP_SESION_COMPLETA = 20;   // si hiciste al menos el 80 % de las series de la rutina
export const XP_RECORD = 15;            // por cada récord personal nuevo (máximo 3 por sesión)
export const MAX_RECORDS_PREMIADOS = 3;
export const XP_RAPIDO = 60;            // marcar «hoy entrené» sin anotar series (la meta que se marca)
export const XP_CALENTAMIENTO = 10;     // por marcar el calentamiento (si terminas el entrenamiento)
export const MONEDAS_SESION = 25;       // monedas 🪙 por sesión terminada (si hiciste al menos la mitad)
export const BASE_GYM = 100;            // pasar del nivel N al N+1 de gym cuesta 100 × N XP de gym
export const BASE_MUSCULO = 50;         // y 50 × N para cada músculo
export const MAX_BONO = 0.25;           // el bono de la Torre sube 1 % por nivel de gym hasta +25 %
export const MAX_SERIES = 8;
export const MAX_KG = 500;
export const MAX_REPS = 100;
export const DESCANSOS = [60, 90, 120, 180];   // segundos de descanso entre series que puedes elegir

// ===== Los músculos (para los niveles por zona del cuerpo) =====
export const MUSCULOS = {
    pecho:        { icono: "🛡️", nombre: "Pecho" },
    triceps:      { icono: "🔨", nombre: "Tríceps" },
    hombros:      { icono: "🏔️", nombre: "Hombros" },
    espalda:      { icono: "🦾", nombre: "Espalda" },
    biceps:       { icono: "💪", nombre: "Bíceps" },
    cuadriceps:   { icono: "🦵", nombre: "Cuádriceps" },
    isquios:      { icono: "🦿", nombre: "Isquiosurales" },
    pantorrillas: { icono: "🐄", nombre: "Pantorrillas" },
    gluteos:      { icono: "🧱", nombre: "Glúteos" },
    core:         { icono: "🎯", nombre: "Abdomen" },
};

// ===== Tu rutina =====
// Cada entrenamiento es un día de gym. min–max son las repeticiones objetivo de cada serie.
const e = (id, nombre, musculo, series, min, max) => ({ id, nombre, musculo, series, min, max });

export const RUTINA = [
    { id: "pecho-triceps", icono: "🏋️", nombre: "Pecho + Tríceps", ejercicios: [
        e("press-banca", "Press de banca plano", "pecho", 4, 6, 10),
        e("press-inclinado", "Press inclinado en máquina", "pecho", 3, 8, 12),
        e("pec-deck", "Aperturas en máquina (pec deck)", "pecho", 3, 10, 15),
        e("press-frances", "Press francés", "triceps", 3, 8, 12),
        e("triceps-polea", "Extensión de tríceps en polea con barra", "triceps", 3, 10, 12),
        e("triceps-cuerda", "Extensión de tríceps por encima de la cabeza con cuerda", "triceps", 3, 10, 15),
    ] },
    { id: "hombros", icono: "🏔️", nombre: "Hombros", ejercicios: [
        e("press-hombros", "Press de hombros en máquina", "hombros", 4, 8, 12),
        e("elevaciones-laterales", "Elevaciones laterales en máquina", "hombros", 3, 10, 15),
        e("pajaros", "Pájaros / reverse pec deck", "hombros", 3, 10, 15),
    ] },
    { id: "isquios", icono: "🦿", nombre: "Isquiosurales", ejercicios: [
        e("peso-muerto-rumano", "Peso muerto rumano", "isquios", 4, 8, 10),
        e("curl-femoral-sentado", "Curl femoral sentado", "isquios", 3, 10, 15),
        e("curl-femoral-tumbado", "Curl femoral tumbado", "isquios", 3, 10, 15),
    ] },
    { id: "espalda", icono: "🦾", nombre: "Espalda", ejercicios: [
        e("jalon-pecho", "Jalón al pecho en polea", "espalda", 4, 8, 12),
        e("remo-sentado", "Remo sentado en máquina/polea", "espalda", 3, 8, 12),
        e("remo-unilateral", "Remo unilateral en máquina", "espalda", 3, 10, 12),
    ] },
    { id: "biceps", icono: "💪", nombre: "Bíceps", ejercicios: [
        e("curl-barra", "Curl de bíceps con barra", "biceps", 3, 8, 12),
        e("curl-inclinado", "Curl inclinado con mancuernas", "biceps", 3, 10, 12),
        e("curl-martillo", "Curl martillo", "biceps", 3, 10, 15),
    ] },
    { id: "cuadriceps", icono: "🦵", nombre: "Cuádriceps / frontal", ejercicios: [
        e("prensa-piernas", "Prensa de piernas", "cuadriceps", 4, 8, 12),
        e("extension-cuadriceps", "Extensión de cuádriceps en máquina", "cuadriceps", 3, 10, 15),
        e("hack-squat", "Sentadilla en máquina / Hack squat", "cuadriceps", 3, 8, 12),
    ] },
    { id: "pantorrillas", icono: "🐄", nombre: "Pantorrilla", ejercicios: [
        e("talones-de-pie", "Elevación de talones de pie", "pantorrillas", 4, 10, 15),
        e("talones-sentado", "Elevación de talones sentado", "pantorrillas", 3, 12, 20),
        e("talones-prensa", "Elevación de talones en prensa", "pantorrillas", 3, 12, 20),
    ] },
];

// (v160) Las rutinas de fábrica: «Restaurar» vuelve a ellas y tus cambios (estado.gym.rutinas) se aplican encima.
const RUTINAS_DE_FABRICA = RUTINA.map((r) => ({ id: r.id, ejercicios: r.ejercicios }));

// (v76) Qué movimiento hace cada ejercicio: de ahí salen su animación (dibujo-ejercicios.js) y su consejo de técnica (gym-aurelio.js).
export const MOVIMIENTO_DE = {
    "press-banca": "press_horizontal", "press-inclinado": "press_horizontal", "pec-deck": "press_horizontal",
    "press-frances": "triceps", "triceps-polea": "triceps", "triceps-cuerda": "triceps",
    "press-hombros": "press_vertical", "elevaciones-laterales": "elevacion_lateral", "pajaros": "elevacion_lateral",
    "peso-muerto-rumano": "bisagra", "curl-femoral-sentado": "curl_femoral", "curl-femoral-tumbado": "curl_femoral",
    "jalon-pecho": "jalon", "remo-sentado": "remo", "remo-unilateral": "remo",
    "curl-barra": "curl", "curl-inclinado": "curl", "curl-martillo": "curl",
    "prensa-piernas": "sentadilla", "extension-cuadriceps": "sentadilla", "hack-squat": "sentadilla",
    "talones-de-pie": "talones", "talones-sentado": "talones", "talones-prensa": "talones",
    // los extras
    "dominadas": "jalon", "remo-barra": "remo", "jalon-cerrado": "jalon", "peso-muerto": "bisagra",
    "press-mancuernas": "press_horizontal", "aperturas-mancuernas": "press_horizontal", "fondos": "press_horizontal",
    "press-militar": "press_vertical", "face-pull": "remo", "encogimientos": "encogimiento", "fondos-banco": "triceps",
    "curl-concentrado": "curl", "sentadilla": "sentadilla", "zancadas": "sentadilla", "hip-thrust": "abdominales",
    "abdominales": "abdominales", "elevacion-piernas": "abdominales", "rueda-abdominal": "abdominales",
    // (v160) más ejercicios
    "press-inclinado-mancuernas": "press_horizontal", "cruce-poleas": "press_horizontal", "press-declinado": "press_horizontal", "flexiones": "press_horizontal",
    "patada-triceps": "triceps", "press-cerrado": "triceps", "extension-mancuerna": "triceps", "triceps-banco-pesas": "triceps",
    "arnold-press": "press_vertical", "elevaciones-frontales": "elevacion_lateral", "laterales-mancuernas": "elevacion_lateral", "pajaros-mancuernas": "elevacion_lateral",
    "remo-mancuerna": "remo", "remo-t": "remo", "jalon-neutro": "jalon", "pullover-polea": "jalon", "hiperextensiones": "bisagra",
    "curl-mancuernas": "curl", "curl-predicador": "curl", "curl-polea": "curl", "curl-21": "curl",
    "sentadilla-bulgara": "sentadilla", "sentadilla-goblet": "sentadilla", "sentadilla-frontal": "sentadilla", "sentadilla-hack-libre": "sentadilla",
    "buenos-dias": "bisagra", "peso-muerto-rigido": "bisagra", "curl-nordico": "curl_femoral", "curl-femoral-de-pie": "curl_femoral",
    "talones-mancuerna": "talones", "talones-burro": "talones", "talones-unilateral": "talones",
    "puente-gluteos": "abdominales", "patada-gluteo": "bisagra", "abduccion-maquina": "sentadilla", "sentadilla-sumo": "sentadilla", "peso-muerto-sumo": "bisagra",
    "plancha": "abdominales", "crunch-polea": "abdominales", "giro-ruso": "abdominales", "elevacion-rodillas": "abdominales",
};
export const movimientoDe = (ejercicioId) => MOVIMIENTO_DE[ejercicioId] || "curl";

export const rutinaPorId = (id) => RUTINA.find((r) => r.id === id) || null;
// Ejercicios extra que puedes sumar a cualquier entrenamiento (cuentan igual: XP, récords y gráficas).
export const EXTRAS = [
    e("dominadas", "Dominadas", "espalda", 3, 5, 12),
    e("remo-barra", "Remo con barra", "espalda", 3, 6, 10),
    e("jalon-cerrado", "Jalón con agarre cerrado", "espalda", 3, 8, 12),
    e("peso-muerto", "Peso muerto convencional", "isquios", 3, 4, 8),
    e("press-mancuernas", "Press de banca con mancuernas", "pecho", 3, 8, 12),
    e("aperturas-mancuernas", "Aperturas con mancuernas", "pecho", 3, 10, 15),
    e("fondos", "Fondos en paralelas", "pecho", 3, 6, 12),
    e("press-militar", "Press militar con mancuernas", "hombros", 3, 8, 12),
    e("face-pull", "Face pull en polea", "hombros", 3, 12, 15),
    e("encogimientos", "Encogimientos de hombros", "hombros", 3, 10, 15),
    e("fondos-banco", "Fondos en banco", "triceps", 3, 8, 15),
    e("curl-concentrado", "Curl concentrado", "biceps", 3, 10, 15),
    e("sentadilla", "Sentadilla libre", "cuadriceps", 4, 6, 10),
    e("zancadas", "Zancadas con mancuernas", "cuadriceps", 3, 10, 12),
    e("hip-thrust", "Hip thrust", "gluteos", 4, 8, 12),
    e("abdominales", "Abdominales (crunch)", "core", 3, 12, 20),
    e("elevacion-piernas", "Elevación de piernas", "core", 3, 10, 15),
    e("rueda-abdominal", "Rueda abdominal", "core", 3, 8, 12),
    // (v160) más ejercicios, por músculo
    e("press-inclinado-mancuernas", "Press inclinado con mancuernas", "pecho", 3, 8, 12),
    e("cruce-poleas", "Cruce de poleas", "pecho", 3, 10, 15),
    e("press-declinado", "Press declinado", "pecho", 3, 8, 12),
    e("flexiones", "Flexiones", "pecho", 3, 10, 25),
    e("patada-triceps", "Patada de tríceps con mancuerna", "triceps", 3, 10, 15),
    e("press-cerrado", "Press de banca agarre cerrado", "triceps", 3, 6, 10),
    e("extension-mancuerna", "Extensión de tríceps con mancuerna", "triceps", 3, 10, 12),
    e("triceps-banco-pesas", "Fondos entre bancos con peso", "triceps", 3, 8, 12),
    e("arnold-press", "Press Arnold", "hombros", 3, 8, 12),
    e("elevaciones-frontales", "Elevaciones frontales", "hombros", 3, 10, 15),
    e("laterales-mancuernas", "Elevaciones laterales con mancuernas", "hombros", 3, 10, 15),
    e("pajaros-mancuernas", "Pájaros con mancuernas", "hombros", 3, 12, 15),
    e("remo-mancuerna", "Remo con mancuerna a una mano", "espalda", 3, 8, 12),
    e("remo-t", "Remo en barra T", "espalda", 3, 8, 12),
    e("jalon-neutro", "Jalón con agarre neutro", "espalda", 3, 8, 12),
    e("pullover-polea", "Pullover en polea", "espalda", 3, 10, 15),
    e("hiperextensiones", "Hiperextensiones (lumbar)", "espalda", 3, 10, 15),
    e("curl-mancuernas", "Curl alterno con mancuernas", "biceps", 3, 8, 12),
    e("curl-predicador", "Curl predicador (banco Scott)", "biceps", 3, 8, 12),
    e("curl-polea", "Curl en polea baja", "biceps", 3, 10, 15),
    e("curl-21", "Curl de bíceps en «21»", "biceps", 2, 15, 21),
    e("sentadilla-bulgara", "Sentadilla búlgara", "cuadriceps", 3, 8, 12),
    e("sentadilla-goblet", "Sentadilla goblet", "cuadriceps", 3, 10, 15),
    e("sentadilla-frontal", "Sentadilla frontal", "cuadriceps", 3, 6, 10),
    e("sentadilla-hack-libre", "Hack squat con barra", "cuadriceps", 3, 8, 12),
    e("buenos-dias", "Buenos días con barra", "isquios", 3, 8, 12),
    e("peso-muerto-rigido", "Peso muerto con piernas rígidas", "isquios", 3, 8, 12),
    e("curl-nordico", "Curl nórdico", "isquios", 3, 4, 8),
    e("curl-femoral-de-pie", "Curl femoral de pie", "isquios", 3, 10, 15),
    e("talones-mancuerna", "Talones con mancuerna a una pierna", "pantorrillas", 3, 12, 20),
    e("talones-burro", "Talones tipo burro", "pantorrillas", 3, 12, 20),
    e("talones-unilateral", "Talones unilaterales sin peso", "pantorrillas", 3, 15, 25),
    e("puente-gluteos", "Puente de glúteos", "gluteos", 3, 10, 15),
    e("patada-gluteo", "Patada de glúteo en polea", "gluteos", 3, 10, 15),
    e("abduccion-maquina", "Abducción de cadera en máquina", "gluteos", 3, 12, 20),
    e("sentadilla-sumo", "Sentadilla sumo", "gluteos", 3, 8, 12),
    e("peso-muerto-sumo", "Peso muerto sumo", "gluteos", 3, 5, 8),
    e("plancha", "Plancha (segundos)", "core", 3, 20, 60),
    e("crunch-polea", "Crunch en polea alta", "core", 3, 10, 15),
    e("giro-ruso", "Giro ruso", "core", 3, 12, 20),
    e("elevacion-rodillas", "Elevación de rodillas colgado", "core", 3, 8, 15),
];

// (v160) Todos los ejercicios que existen: los de fábrica y los extra. De aquí eliges cuando editas tus rutinas.
export const CATALOGO = [...RUTINA.flatMap((r) => r.ejercicios), ...EXTRAS];
export const ejercicioPorId = (id) => CATALOGO.find((x) => x.id === id) || null;

// (v160) Pone tus rutinas editadas (estado.gym.rutinas = { rutinaId: [{ id, series }] }) en RUTINA; las que no editaste vuelven a las de fábrica.
export function aplicarRutinas(personales) {
    for (const r of RUTINA) {
        const lista = personales?.[r.id];
        const ejercicios = Array.isArray(lista) ? lista.map(({ id, series }) => {
            const base = ejercicioPorId(id);
            return base ? { ...base, series: Math.max(1, Math.min(MAX_SERIES, Number(series) || base.series)) } : null;
        }).filter(Boolean) : [];
        r.ejercicios = ejercicios.length ? ejercicios : RUTINAS_DE_FABRICA.find((f) => f.id === r.id).ejercicios;
    }
}
export const seriesPlaneadas = (rutina) => rutina.ejercicios.reduce((suma, x) => suma + x.series, 0);

// ===== Rangos =====
export const RANGOS = [
    { desde: 1,  nombre: "Novato",     icono: "🌱" },
    { desde: 3,  nombre: "Aprendiz",   icono: "🥉" },
    { desde: 6,  nombre: "Atleta",     icono: "🥈" },
    { desde: 10, nombre: "Guerrero",   icono: "🥇" },
    { desde: 15, nombre: "Gladiador",  icono: "⚔️" },
    { desde: 20, nombre: "Titán",      icono: "🗿" },
    { desde: 30, nombre: "Leyenda",    icono: "👑" },
];
export const rangoDe = (nivel) => [...RANGOS].reverse().find((r) => nivel >= r.desde) || RANGOS[0];

// ===== Lo guardado =====
export function gymInicial() {
    return {
        sesiones: [],        // [{ fecha, rutina, ejercicios: [{ id, series: [{ kg, reps }] }], xp, monedas, gemas, completa, records: [{ id, puntaje }] }]
        encurso: null,       // el entrenamiento que estás haciendo ahora (ver crearEntrenamiento)
        hitos: [],           // ids de los hitos ya cobrados
        metaSemanal: 4,      // cuántos días a la semana quieres entrenar (1–7)
        descanso: 90,        // segundos de descanso entre series
        peso: [],            // tu peso corporal: [{ fecha, kg }] (uno por día)
        altura: null,        // tu altura en centímetros (para el IMC)
        metaPeso: null,      // (v82) tu peso objetivo en kilos, o null
        medidas: [],         // (v82) [{ fecha, pecho, brazo, cintura, muslo }] en centímetros (una por día; los que no anotes quedan vacíos)
        mision: null,        // la misión diaria que se marca sola al terminar un entrenamiento (id), o null
        retosCobrados: [],   // (v79) los lunes de las semanas cuyo reto ya cobraste
        rutinas: {},         // (v160) tus rutinas editadas: { rutinaId: [{ id, series }] }; las que no están usan las de fábrica
        foco: true,          // (v78) el entrenamiento se ve en «modo foco»: una serie a la vez, con letras grandes
    };
}

// ===== Cálculos de fuerza =====

// Peso máximo estimado para 1 repetición (fórmula de Epley). Sin peso (peso corporal) cuenta solo las repeticiones.
export const unaRepeticion = (kg, reps) => (kg > 0 ? Math.round(kg * (1 + reps / 30) * 10) / 10 : 0);
// Con qué se compara un récord: el 1RM estimado si hay peso; si no, las repeticiones.
export const puntajeDe = (kg, reps) => (kg > 0 ? unaRepeticion(kg, reps) : reps);

const seriesHechas = (sesion) => sesion.ejercicios.reduce((suma, x) => suma + x.series.length, 0);

// El mejor puntaje de cada ejercicio en todas las sesiones dadas: { id: { puntaje, kg, reps, fecha } }.
export function mejoresDe(sesiones) {
    const mejores = {};
    for (const s of sesiones) {
        for (const ej of s.ejercicios) {
            for (const serie of ej.series) {
                const puntaje = puntajeDe(serie.kg, serie.reps);
                if (puntaje > 0 && puntaje > (mejores[ej.id]?.puntaje || 0)) {
                    mejores[ej.id] = { puntaje, kg: serie.kg, reps: serie.reps, fecha: s.fecha };
                }
            }
        }
    }
    return mejores;
}

// Cómo ha ido un ejercicio: el mejor puntaje de cada sesión, en orden de fechas (para dibujar la gráfica).
export function historialDe(sesiones, ejercicioId) {
    const puntos = [];
    for (const s of sesiones) {
        const ej = s.ejercicios.find((x) => x.id === ejercicioId);
        if (!ej) continue;
        const mejor = Math.max(0, ...ej.series.map((x) => puntajeDe(x.kg, x.reps)));
        if (mejor > 0) puntos.push({ fecha: s.fecha, puntaje: mejor });
    }
    return puntos;
}

// Volumen de una sesión: kilos × repeticiones de todas sus series.
export const volumenDe = (sesion) =>
    sesion.ejercicios.reduce((suma, ej) => suma + ej.series.reduce((s, x) => s + x.kg * x.reps, 0), 0);

// La última vez que hiciste este ejercicio (sus series), o null.
export function ultimaVez(sesiones, ejercicioId) {
    for (let i = sesiones.length - 1; i >= 0; i--) {
        const ej = sesiones[i].ejercicios.find((x) => x.id === ejercicioId);
        if (ej && ej.series.length) return { fecha: sesiones[i].fecha, series: ej.series };
    }
    return null;
}

// Una pista para superarte (doble progresión): si en todas las series llegaste al tope de repeticiones, sube el peso;
// si no, intenta una repetición más en cada serie.
export function sugerencia(ejercicio, anterior) {
    if (!anterior) return { tipo: "nuevo", texto: "Primera vez: empieza ligero y anota cuánto levantaste." };
    const pesoMax = Math.max(...anterior.series.map((s) => s.kg));
    const todasAlTope = anterior.series.length >= ejercicio.series && anterior.series.every((s) => s.reps >= ejercicio.max);
    if (todasAlTope && pesoMax > 0) {
        return { tipo: "peso", texto: `Llegaste al tope (${ejercicio.max} reps). Sube un poco el peso (+2,5 kg) y vuelve a ${ejercicio.min}.`,
                 kg: pesoMax + 2.5 };
    }
    return { tipo: "reps", texto: `Intenta una repetición más que la última vez (la meta es llegar a ${ejercicio.max}).` };
}

// ===== Un entrenamiento en curso =====
// ultimas = las sesiones ya guardadas (para llenar de antemano el peso y las repeticiones de la última vez).
export function crearEntrenamiento(rutinaId, fecha, sesiones, ahora = Date.now()) {
    const rutina = rutinaPorId(rutinaId);
    if (!rutina) throw new Error("Esa rutina no existe.");
    return {
        rutina: rutinaId,
        fecha,
        inicio: ahora,
        calentado: false,   // (v76) ¿marcaste el calentamiento?
        ejercicios: rutina.ejercicios.map((ej) => ejercicioDelEntrenamiento(ej, sesiones)),
    };
}

// Un ejercicio listo para anotar: sus series llenas con lo de la última vez (o con el mínimo de repeticiones).
export function ejercicioDelEntrenamiento(ej, sesiones) {
    const antes = ultimaVez(sesiones, ej.id);
    const kg = antes ? Math.max(...antes.series.map((s) => s.kg)) : 0;
    return {
        id: ej.id,
        series: Array.from({ length: ej.series }, (_, i) => ({
            kg: antes?.series[i]?.kg ?? kg,
            reps: antes?.series[i]?.reps ?? ej.min,
            hecha: false,
        })),
    };
}

// Los kilos que llevas movidos en este entrenamiento (solo las series ya marcadas).
export const volumenMarcado = (entrenamiento) =>
    Math.round(entrenamiento.ejercicios.reduce((suma, ej) => suma + ej.series.filter((s) => s.hecha).reduce((t, s) => t + s.kg * s.reps, 0), 0));

// La serie que toca ahora: la primera sin marcar. { ejercicio, serie } o null si ya está todo hecho.
export function serieActual(entrenamiento) {
    for (let ei = 0; ei < entrenamiento.ejercicios.length; ei++) {
        const si = entrenamiento.ejercicios[ei].series.findIndex((s) => !s.hecha);
        if (si !== -1) return { ejercicio: ei, serie: si };
    }
    return null;
}

export const seriesMarcadas = (entrenamiento) =>
    entrenamiento.ejercicios.reduce((suma, ej) => suma + ej.series.filter((s) => s.hecha).length, 0);

// Convierte el entrenamiento en una sesión guardada, con su premio y sus récords nuevos.
export function cerrarEntrenamiento(entrenamiento, sesiones, ahora = Date.now()) {
    const rutina = rutinaPorId(entrenamiento.rutina);
    const ejercicios = entrenamiento.ejercicios
        .map((ej) => ({ id: ej.id, series: ej.series.filter((s) => s.hecha).map((s) => ({ kg: s.kg, reps: s.reps })) }))
        .filter((ej) => ej.series.length);
    const hechas = ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    if (!hechas) throw new Error("Marca al menos una serie hecha antes de terminar.");
    const planeadas = seriesPlaneadas(rutina);
    const completa = hechas >= Math.ceil(planeadas * 0.8);
    // Récords: mejor que TODO lo anterior (en esta misma sesión cuenta una vez por ejercicio).
    const antes = mejoresDe(sesiones);
    const nuevos = mejoresDe([{ ejercicios, fecha: entrenamiento.fecha }]);
    const records = [];
    for (const [id, m] of Object.entries(nuevos)) {
        // El primer registro de un ejercicio no es un récord: no hay con qué compararlo.
        if (antes[id] && m.puntaje > antes[id].puntaje) records.push({ id, puntaje: m.puntaje });
    }
    const calentado = Boolean(entrenamiento.calentado);
    const xp = hechas * XP_POR_SERIE + (completa ? XP_SESION_COMPLETA : 0) + Math.min(records.length, MAX_RECORDS_PREMIADOS) * XP_RECORD + (calentado ? XP_CALENTAMIENTO : 0);
    const minutos = Math.max(1, Math.min(240, Math.round((ahora - (entrenamiento.inicio || ahora)) / 60000)));
    const monedas = hechas * 2 >= planeadas ? MONEDAS_SESION : 0;
    return { fecha: entrenamiento.fecha, rutina: entrenamiento.rutina, ejercicios, xp, monedas, gemas: 0, completa, records, calentado, minutos };
}

// Una sesión «marcada»: dices que hoy entrenaste esa rutina, sin anotar series. Da menos XP que una anotada con detalle.
export function sesionRapida(rutinaId, fecha) {
    if (!rutinaPorId(rutinaId)) throw new Error("Esa rutina no existe.");
    return { fecha, rutina: rutinaId, ejercicios: [], rapido: true, xp: XP_RAPIDO, monedas: MONEDAS_SESION, gemas: 0, completa: true, records: [] };
}

// ===== Niveles =====
export const xpDeGym = (sesiones) => sesiones.reduce((suma, s) => suma + s.xp, 0);
export const nivelDeGym = (sesiones) => calcularNivel(xpDeGym(sesiones), BASE_GYM);

// XP de cada músculo: XP_POR_SERIE por cada serie hecha de un ejercicio de ese músculo.
export function xpPorMusculo(sesiones) {
    const xp = Object.fromEntries(Object.keys(MUSCULOS).map((m) => [m, 0]));
    for (const s of sesiones) {
        for (const ej of s.ejercicios) {
            const musculo = ejercicioPorId(ej.id)?.musculo;
            if (musculo) xp[musculo] += ej.series.length * XP_POR_SERIE;
        }
        // Una sesión que solo se marcó («hoy entrené») reparte la mitad por los ejercicios de su rutina.
        if (s.rapido) {
            for (const ej of rutinaPorId(s.rutina)?.ejercicios || []) xp[ej.musculo] += Math.round((ej.series * XP_POR_SERIE) / 2);
        }
    }
    return xp;
}
export const nivelesDeMusculos = (sesiones) =>
    Object.fromEntries(Object.entries(xpPorMusculo(sesiones)).map(([m, xp]) => [m, calcularNivel(xp, BASE_MUSCULO)]));

// Lo que el nivel de gym le da al héroe en la Torre y las mazmorras: más vida y más ataque (fracción: 0,05 = +5 %).
export const bonoDeGym = (nivel) => Math.min(MAX_BONO, Math.max(0, nivel - 1) * 0.01);

// El BOMBEO (v80): el día que entrenas, tu héroe está «inflado» y es un 10 % más fuerte (vida y ataque) en la Torre y las mazmorras.
export const BOMBEO = 0.10;
export const bombeoDeHoy = (sesiones, hoyTexto) => sesiones.some((s) => s.fecha === hoyTexto);

// Qué tan fornido se ve el avatar: 0 a 5 (con los niveles de gym 1, 3, 6, 10, 15 y 22). Ensancha hombros, brazos y muslos
// y, en la pestaña del gimnasio (con el avatar sin ropa), marca pecho, abdomen y brazos.
export const NIVELES_DE_FISICO = [1, 3, 6, 10, 15, 22];
export const NOMBRES_DE_FISICO = ["Principiante", "En forma", "Atlético", "Definido", "Fornido", "Titán"];
export const fisicoDe = (nivel) => NIVELES_DE_FISICO.filter((n) => nivel >= n).length - 1;

// ===== Altura, peso e IMC =====
// IMC = peso (kg) / altura (m)². No distingue músculo de grasa: con mucho músculo puede salir alto.
export const imc = (kg, cm) => (kg > 0 && cm > 0 ? Math.round((kg / (cm / 100) ** 2) * 10) / 10 : null);
export const CATEGORIAS_IMC = [
    { hasta: 18.5, nombre: "Bajo peso",   color: "#38bdf8" },
    { hasta: 25,   nombre: "Peso normal", color: "#34d399" },
    { hasta: 30,   nombre: "Sobrepeso",   color: "#fbbf24" },
    { hasta: Infinity, nombre: "Obesidad", color: "#fb7185" },
];
export const categoriaDeImc = (valor) => CATEGORIAS_IMC.find((c) => valor < c.hasta) || CATEGORIAS_IMC[CATEGORIAS_IMC.length - 1];
// El rango de peso con IMC normal (18,5 a 24,9) para esa altura.
export function pesoSaludable(cm) {
    const m2 = (cm / 100) ** 2;
    return [Math.round(18.5 * m2 * 10) / 10, Math.round(24.9 * m2 * 10) / 10];
}
// Qué tan ancho se dibuja el cuerpo del avatar en el gimnasio: -1 (muy delgado) … 0 (IMC 22) … 1 (IMC 30) y un poco más.
export const corpulenciaDe = (valorImc) => (valorImc === null ? 0 : Math.max(-1, Math.min(1.1, (valorImc - 22) / 8)));
// Tu IMC de ahora (con tu último peso y tu altura), o null si falta algo.
export const imcActual = (gymEstado) => imc(gymEstado.peso[gymEstado.peso.length - 1]?.kg || 0, gymEstado.altura || 0);

// ===== Semanas y rachas =====

// Cuántos días distintos entrenaste en la semana que empieza en `lunes`.
export function diasDeLaSemana(sesiones, lunes) {
    const fin = sumarDias(lunes, 6);
    return new Set(sesiones.filter((s) => s.fecha >= lunes && s.fecha <= fin).map((s) => s.fecha)).size;
}

// (v148) El mapa del cuerpo: cuántas series hizo cada músculo en la semana que empieza en `lunes`.
// Las series anotadas cuentan una por una; una sesión solo marcada («hoy entrené») cuenta las series que planea su rutina.
// Devuelve { pecho: 6, espalda: 0, … } con TODOS los músculos (los que no trabajaste quedan en 0).
export function seriesPorMusculoDeLaSemana(sesiones, lunes) {
    const series = Object.fromEntries(Object.keys(MUSCULOS).map((m) => [m, 0]));
    const fin = sumarDias(lunes, 6);
    for (const s of sesiones.filter((x) => x.fecha >= lunes && x.fecha <= fin)) {
        for (const ej of s.ejercicios) {
            const musculo = ejercicioPorId(ej.id)?.musculo;
            if (musculo) series[musculo] += ej.series.length;
        }
        if (s.rapido) for (const ej of rutinaPorId(s.rutina)?.ejercicios || []) series[ej.musculo] += ej.series;
    }
    return series;
}

// Qué tan trabajado quedó un músculo en la semana: 0 = nada, 1 = poco (1–5 series), 2 = bien (6–11), 3 = mucho (12 o más).
// Unas 10 series por músculo a la semana es lo que suele recomendarse para crecer.
export const nivelDeSeries = (n) => (n <= 0 ? 0 : n < 6 ? 1 : n < 12 ? 2 : 3);

// (v162) El volumen PLANEADO por músculo si haces cada rutina una vez a la semana. Usa las rutinas tal como las tienes
// (también las editadas). Cuenta las series que planeas, no las que ya hiciste.
export function seriesPlaneadasPorMusculo() {
    const series = Object.fromEntries(Object.keys(MUSCULOS).map((m) => [m, 0]));
    for (const r of RUTINA) for (const ej of r.ejercicios) series[ej.musculo] += ej.series;
    return series;
}

// Cómo va el volumen planeado de un músculo: menos de 10 series es poco, de 10 a 20 es lo que suele recomendarse, más de 20 es mucho.
export const valoracionDeVolumen = (n) => (n <= 0 ? "nada" : n < 10 ? "poco" : n <= 20 ? "bien" : "mucho");

// Semanas seguidas cumpliendo tu meta. La semana en curso suma si ya la cumpliste, pero no rompe la racha si aún no.
export function rachaSemanal(sesiones, meta, hoyTexto) {
    const lunesHoy = lunesDe(hoyTexto);
    let racha = diasDeLaSemana(sesiones, lunesHoy) >= meta ? 1 : 0;
    let lunes = sumarDias(lunesHoy, -7);
    while (diasDeLaSemana(sesiones, lunes) >= meta) {
        racha += 1;
        lunes = sumarDias(lunes, -7);
    }
    return racha;
}

// La mejor racha de semanas seguidas cumpliendo tu meta, en toda tu historia (las recompensas de constancia se ganan con ella).
export function mejorRachaSemanal(sesiones, meta, hoyTexto) {
    if (!sesiones.length) return 0;
    const primera = sesiones.reduce((m, s) => (s.fecha < m ? s.fecha : m), sesiones[0].fecha);
    let mejor = 0;
    let actual = 0;
    for (let lunes = lunesDe(primera); lunes <= lunesDe(hoyTexto); lunes = sumarDias(lunes, 7)) {
        actual = diasDeLaSemana(sesiones, lunes) >= meta ? actual + 1 : 0;
        if (actual > mejor) mejor = actual;
    }
    return mejor;
}

// Qué entrenamiento toca ahora: el siguiente al último que hiciste (y si no hay ninguno, el primero).
export function siguienteRutina(sesiones) {
    const ultima = sesiones[sesiones.length - 1];
    if (!ultima) return RUTINA[0];
    const i = RUTINA.findIndex((r) => r.id === ultima.rutina);
    return RUTINA[(i + 1) % RUTINA.length];
}

// Cuántos días pasaron desde la última vez que hiciste esa rutina (null si nunca).
export function diasDesde(sesiones, rutinaId, hoyTexto) {
    for (let i = sesiones.length - 1; i >= 0; i--) {
        if (sesiones[i].rutina === rutinaId) return diasEntre(sesiones[i].fecha, hoyTexto);
    }
    return null;
}

// ===== Totales y hitos =====
export function totales(sesiones) {
    return {
        sesiones: sesiones.length,
        series: sesiones.reduce((suma, s) => suma + seriesHechas(s), 0),
        volumen: Math.round(sesiones.reduce((suma, s) => suma + volumenDe(s), 0)),
        records: sesiones.reduce((suma, s) => suma + s.records.length, 0),
    };
}

// Los hitos de gym: cada uno se cobra una sola vez. `quiere` recibe { total, nivel, racha }.
export const HITOS = [
    { id: "primera",    icono: "🎽", titulo: "Primera sesión",       texto: "Termina tu primer entrenamiento.",       gemas: 10,  quiere: (x) => x.total.sesiones >= 1 },
    { id: "diez",       icono: "🔟", titulo: "Diez sesiones",        texto: "Entrena 10 veces.",                       gemas: 20,  quiere: (x) => x.total.sesiones >= 10 },
    { id: "cincuenta",  icono: "🏅", titulo: "Cincuenta sesiones",   texto: "Entrena 50 veces.",                       gemas: 60,  quiere: (x) => x.total.sesiones >= 50 },
    { id: "cien",       icono: "💯", titulo: "Cien sesiones",        texto: "Entrena 100 veces.",                      gemas: 120, quiere: (x) => x.total.sesiones >= 100 },
    { id: "primer-record", icono: "📈", titulo: "Primer récord",     texto: "Supera tu mejor marca en un ejercicio.",  gemas: 15,  quiere: (x) => x.total.records >= 1 },
    { id: "diez-records",  icono: "🚀", titulo: "Diez récords",      texto: "Rompe 10 marcas personales.",             gemas: 50,  quiere: (x) => x.total.records >= 10 },
    { id: "racha-4",    icono: "🔥", titulo: "Un mes entero",        texto: "Cumple tu meta 4 semanas seguidas.",      gemas: 40,  quiere: (x) => x.racha >= 4 },
    { id: "racha-12",   icono: "🌋", titulo: "Tres meses",           texto: "Cumple tu meta 12 semanas seguidas.",     gemas: 120, quiere: (x) => x.racha >= 12 },
    { id: "volumen-10k",  icono: "🪨", titulo: "10 toneladas",       texto: "Mueve 10 000 kg en total.",               gemas: 25,  quiere: (x) => x.total.volumen >= 10000 },
    { id: "volumen-100k", icono: "🏔️", titulo: "100 toneladas",      texto: "Mueve 100 000 kg en total.",              gemas: 80,  quiere: (x) => x.total.volumen >= 100000 },
    { id: "veinticinco", icono: "🎖️", titulo: "Veinticinco sesiones", texto: "Entrena 25 veces.",                     gemas: 35,  quiere: (x) => x.total.sesiones >= 25 },
    { id: "racha-8",    icono: "⛓️", titulo: "Constancia de acero",  texto: "Cumple tu meta 8 semanas seguidas.",      gemas: 70,  quiere: (x) => x.racha >= 8 },
    { id: "veinticinco-records", icono: "🌟", titulo: "Veinticinco récords", texto: "Rompe 25 marcas personales.",       gemas: 90,  quiere: (x) => x.total.records >= 25 },
    { id: "volumen-250k", icono: "🗻", titulo: "250 toneladas",      texto: "Mueve 250 000 kg en total.",              gemas: 120, quiere: (x) => x.total.volumen >= 250000 },
    { id: "nivel-15",   icono: "⚔️", titulo: "Gladiador",            texto: "Llega al nivel 15 de gym.",               gemas: 90,  quiere: (x) => x.nivel >= 15 },
    { id: "nivel-10",   icono: "🥇", titulo: "Guerrero del hierro",  texto: "Llega al nivel 10 de gym.",               gemas: 50,  quiere: (x) => x.nivel >= 10 },
    { id: "nivel-20",   icono: "🗿", titulo: "Titán",                texto: "Llega al nivel 20 de gym.",               gemas: 150, quiere: (x) => x.nivel >= 20 },
];

// Los hitos que ya se cumplen y aún no se han cobrado.
export function hitosNuevos(gym, hoyTexto) {
    const x = {
        total: totales(gym.sesiones),
        nivel: nivelDeGym(gym.sesiones).nivel,
        racha: rachaSemanal(gym.sesiones, gym.metaSemanal, hoyTexto),
    };
    return HITOS.filter((h) => !gym.hitos.includes(h.id) && h.quiere(x));
}


// ===== Medidas del cuerpo y peso objetivo (v82) =====
export const MEDIDAS = {
    pecho:   { icono: "🫁", nombre: "Pecho" },
    brazo:   { icono: "💪", nombre: "Brazo" },
    cintura: { icono: "📏", nombre: "Cintura" },
    muslo:   { icono: "🦵", nombre: "Muslo" },
};
// Cuánto has avanzado hacia tu peso objetivo: { falta (kg, con signo), porcentaje (0–100) } o null si falta algún dato.
export function avanceDePeso(pesos, metaPeso) {
    if (!metaPeso || !pesos.length) return null;
    const inicio = pesos[0].kg;
    const actual = pesos[pesos.length - 1].kg;
    const total = metaPeso - inicio;
    const hecho = actual - inicio;
    const porcentaje = total === 0 ? 100 : Math.max(0, Math.min(100, Math.round((hecho / total) * 100)));
    return { inicio, actual, falta: Math.round((metaPeso - actual) * 10) / 10, porcentaje, llego: Math.abs(metaPeso - actual) < 0.3 || (total < 0 ? actual <= metaPeso : actual >= metaPeso) };
}
// El valor más reciente de una medida y el primero (para ver el cambio): { primero, ultimo } o null.
export function cambioDeMedida(medidas, clave) {
    const con = medidas.filter((m) => Number.isFinite(m[clave]));
    return con.length ? { primero: con[0][clave], ultimo: con[con.length - 1][clave], cuantas: con.length } : null;
}

// ===== Tu evolución (v79): cómo se veía tu cuerpo cada vez que subió tu físico =====
// Devuelve una lista de fotos en orden: la primera sesión y cada vez que el físico subió de escalón.
// [{ fecha, nivel, fisico, kg (tu peso de entonces o null), corpulencia }]
export function evolucion(sesiones, pesos, altura) {
    if (!sesiones.length) return [];
    const ordenadas = [...sesiones].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    const pesoEn = (fecha) => {
        const antes = pesos.filter((p) => p.fecha <= fecha);
        return antes.length ? antes[antes.length - 1].kg : null;
    };
    const foto = (fecha, nivel) => {
        const kg = pesoEn(fecha);
        return { fecha, nivel, fisico: fisicoDe(nivel), kg, corpulencia: corpulenciaDe(kg && altura ? imc(kg, altura) : null) };
    };
    const fotos = [foto(ordenadas[0].fecha, 1)];
    let xp = 0;
    for (const s of ordenadas) {
        xp += s.xp;
        const nivel = calcularNivel(xp, BASE_GYM).nivel;
        if (fisicoDe(nivel) > fotos[fotos.length - 1].fisico) fotos.push(foto(s.fecha, nivel));
    }
    return fotos;
}

// ===== El reto de la semana (v79): Aurelio te propone uno cada lunes; al cumplirlo cobras un premio una vez =====
export const PREMIO_RETO = { gemas: 25, xp: 30 };
const sesionesDeLaSemana = (sesiones, lunes) => sesiones.filter((s) => s.fecha >= lunes && s.fecha <= sumarDias(lunes, 6));
export const RETOS = [
    { id: "meta", icono: "🎯", texto: (g) => `Cumple tu meta: ${g.metaSemanal} ${g.metaSemanal === 1 ? "día" : "días"} de gym esta semana`,
      medir: (g, lunes) => ({ hecho: diasDeLaSemana(g.sesiones, lunes), meta: g.metaSemanal }) },
    { id: "records", icono: "📈", texto: () => "Rompe 2 récords personales esta semana",
      medir: (g, lunes) => ({ hecho: sesionesDeLaSemana(g.sesiones, lunes).reduce((t, s) => t + s.records.length, 0), meta: 2 }) },
    { id: "volumen", icono: "🏋️", texto: () => "Mueve 6 000 kg esta semana (anotando tus series)",
      medir: (g, lunes) => ({ hecho: Math.round(sesionesDeLaSemana(g.sesiones, lunes).reduce((t, s) => t + volumenDe(s), 0)), meta: 6000 }) },
    { id: "musculos", icono: "💪", texto: () => "Trabaja 4 músculos distintos esta semana",
      medir: (g, lunes) => {
          const musculos = new Set();
          for (const s of sesionesDeLaSemana(g.sesiones, lunes)) {
              for (const ej of s.ejercicios) { const m = ejercicioPorId(ej.id)?.musculo; if (m) musculos.add(m); }
              if (s.rapido) for (const ej of rutinaPorId(s.rutina)?.ejercicios || []) musculos.add(ej.musculo);
          }
          return { hecho: musculos.size, meta: 4 };
      } },
];
// El reto de esa semana (sale del lunes, así es el mismo todo el tiempo y no hace falta guardarlo).
export function retoDeLaSemana(lunes) {
    const n = [...lunes].reduce((suma, c) => suma + c.charCodeAt(0), 0);
    return RETOS[n % RETOS.length];
}
export function progresoDelReto(g, lunes) {
    const reto = retoDeLaSemana(lunes);
    const { hecho, meta } = reto.medir(g, lunes);
    return { reto, hecho: Math.min(hecho, meta), meta, cumplido: hecho >= meta, cobrado: g.retosCobrados.includes(lunes) };
}
