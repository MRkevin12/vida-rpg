// encuentros.js — Criaturas en tu carrera (v119): cada kilómetro corrido con GPS trae una criatura que se vence con el ritmo.
//
// Cómo funciona:
//   - Al empezar y al cumplir cada km aparece la criatura del kilómetro que empieza. La pelea dura ese kilómetro.
//   - Al cumplirlo, se decide con lo que midió el GPS (nada se puede cambiar a mano): si tu ritmo de ese km llegó a tu
//     RITMO OBJETIVO (y a la condición de su tipo), la vences; si no, escapa. Si vas lento no pierdes nada: solo no hay botín extra.
//   - Cada 5 km, un jefe. A veces, una emboscada (pide un ritmo de tempo).
//   - El botín de los monstruos es un EXTRA: el premio por kilómetro de la Ruta del Corredor (ruta.js) no cambia.
//   - El terreno del mapa cambia cada 3 km (ZONAS) y con él las criaturas.
// Aquí solo hay reglas (sin pantalla ni guardar). Lo que se guarda vive en la carrera en curso (ver acciones.js).

import * as bestiario from "./bestiario.js";

// ===== Las zonas del mapa de la carrera (cambian cada KM_POR_ZONA kilómetros) =====
// suelo: los dos colores del césped en cuadritos; criaturas: de qué zona del bestiario salen.
export const KM_POR_ZONA = 3;
export const ZONAS = [
    { id: "pradera",  nombre: "Pradera",          suelo: ["#2a6a38", "#2e7040"], detalle: "#3f9a4a", criaturas: "cripta" },
    { id: "bosque",   nombre: "Bosque de raíces", suelo: ["#1f5230", "#235836"], detalle: "#2f7a3a", criaturas: "raices" },
    { id: "pantano",  nombre: "Pantano anegado",  suelo: ["#33503a", "#385640"], detalle: "#4a7a5a", criaturas: "cisterna" },
    { id: "desierto", nombre: "Desierto de brasas", suelo: ["#b8955a", "#c09d62"], detalle: "#d8b878", criaturas: "fragua" },
    { id: "nieve",    nombre: "Cumbres nevadas",  suelo: ["#c8d4e4", "#d2dcea"], detalle: "#eef3fa", criaturas: "cima" },
    { id: "volcan",   nombre: "Tierras del Abismo", suelo: ["#3a2a30", "#412f36"], detalle: "#6a3a3a", criaturas: "abismo" },
];
export const zonaDelKm = (km) => ZONAS[Math.floor((Math.max(1, km) - 1) / KM_POR_ZONA) % ZONAS.length];

// ===== Los tipos de criatura =====
// Cada tipo pide algo distinto además del ritmo. margen: cuánto más lento que tu objetivo se acepta (0,05 = 5 %).
export const CLASES = {
    normal:   { icono: "⚔️", nombre: "Criatura",  pista: "Mantén tu ritmo objetivo todo el kilómetro.", margen: 0.03 },
    rapida:   { icono: "⚡", nombre: "Veloz",     pista: "Acelera los últimos 200 m: más rápido que tu objetivo.", margen: 0.06 },
    pesada:   { icono: "🛡️", nombre: "Acorazada", pista: "Ritmo parejo: la segunda mitad del km igual que la primera.", margen: 0.06 },
    fantasma: { icono: "👻", nombre: "Fantasma",  pista: "No te detengas: si pausas, se esfuma.", margen: 0.06 },
};
export const JEFE_CADA = 5;          // km
export const PROB_EMBOSCADA = 0.18;  // de cada 100 km normales, unos 18 son emboscadas
export const EMBOSCADA_RITMO = 0.95; // la emboscada pide ir un 5 % más rápido que tu objetivo (ritmo de tempo)
export const PAREJO = 0.08;          // «parejo» = las dos mitades del km no se separan más de un 8 %
export const MARGEN_MASCOTA = 0.02;  // tu dragón te cubre: un 2 % más de margen

// El botín EXTRA de cada criatura vencida (las que escapan no quitan nada).
export const BOTIN = {
    normal:    { gemas: 2 },
    emboscada: { gemas: 5 },
    jefe:      { gemas: 10, xp: 15 },
};

// ===== Ritmo objetivo =====
// "6:00" o "6" -> 360 segundos por km. Vacío o inválido -> null (usa tu promedio).
export function leerObjetivo(texto) {
    const limpio = String(texto ?? "").trim().replace(",", ":").replace(".", ":");
    if (!limpio) return null;
    const m = limpio.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!m) return null;
    const segundos = Number(m[1]) * 60 + Number(m[2] || 0);
    return segundos >= 150 && segundos <= 1200 ? segundos : null;   // entre 2:30 y 20:00 /km
}

// Tu promedio: el ritmo de tus últimas 10 carreras de 1 km o más (sin caminatas). Sin carreras: 7:00 /km.
export const OBJETIVO_INICIAL = 420;
export function objetivoPromedio(carreras) {
    const utiles = carreras.filter((c) => c.tipo !== "caminata" && c.km >= 1).slice(-10);
    if (!utiles.length) return OBJETIVO_INICIAL;
    const km = utiles.reduce((s, c) => s + c.km, 0);
    const minutos = utiles.reduce((s, c) => s + c.minutos, 0);
    return Math.round(Math.min(1200, Math.max(150, (minutos / km) * 60)));
}

// ===== Qué criatura aparece =====
// Siempre la misma para la misma carrera y el mismo km (depende de la hora de inicio), así no cambia al recargar.
const azar = (semilla, km, extra = 0) => {
    const x = Math.sin(semilla * 0.001 + km * 12.9898 + extra * 78.233) * 43758.5453;
    return x - Math.floor(x);
};

export function criaturaDelKm(inicio, km) {
    const zona = zonaDelKm(km);
    const deLaZona = Object.entries(bestiario.CRIATURAS).filter(([, c]) => c.zona === zona.criaturas && !c.espejo);
    const jefe = km % JEFE_CADA === 0;
    const candidatas = deLaZona.filter(([, c]) => Boolean(c.guardian) === jefe);
    const lista = candidatas.length ? candidatas : deLaZona;
    const [id] = lista[Math.floor(azar(inicio, km) * lista.length)];
    const clases = ["normal", "rapida", "pesada", "fantasma"];
    const clase = jefe ? "normal" : clases[Math.floor(azar(inicio, km, 1) * clases.length)];
    const emboscada = !jefe && azar(inicio, km, 2) < PROB_EMBOSCADA;
    return { km, id, clase, jefe, emboscada, zona: zona.id, resultado: null };
}

export const nombreDe = (encuentro) => bestiario.CRIATURAS[encuentro.id]?.nombre || "Criatura";

// Lo que pide esta criatura, en una línea.
export function pistaDe(encuentro) {
    if (encuentro.jefe) return "Jefe: termina este km a tu ritmo objetivo, sin pausas.";
    if (encuentro.emboscada) return "¡Emboscada! Corre este km a ritmo de tempo (un 5 % más rápido que tu objetivo).";
    return CLASES[encuentro.clase].pista;
}

// ===== ¿La venciste? =====
// datos del km: { segundos (lo que tardaste), mitad (s hasta los 500 m), ultimos200 (s de los últimos 200 m), pausas (cuántas) }.
// objetivo: segundos por km. mascota: true si te acompaña un dragón (más margen).
export function resolver(encuentro, datos, objetivo, mascota = false) {
    const extra = mascota ? MARGEN_MASCOTA : 0;
    const limite = (margen) => objetivo * (1 + margen + extra);
    const { segundos, mitad, ultimos200, pausas } = datos;
    if (encuentro.jefe) return segundos <= limite(0) && !pausas;
    if (encuentro.emboscada) return segundos <= objetivo * (EMBOSCADA_RITMO + extra) && !pausas;
    const clase = CLASES[encuentro.clase];
    if (segundos > limite(clase.margen)) return false;
    if (encuentro.clase === "rapida") return Number.isFinite(ultimos200) && ultimos200 / 0.2 <= objetivo * (1 + extra);
    if (encuentro.clase === "pesada") {
        if (!Number.isFinite(mitad)) return false;
        const primera = mitad;
        const segunda = segundos - mitad;
        return Math.abs(segunda - primera) / primera <= PAREJO + extra;
    }
    if (encuentro.clase === "fantasma") return !pausas;
    return true;
}

// El botín extra de una criatura vencida.
export const botinDe = (encuentro) => (encuentro.jefe ? BOTIN.jefe : encuentro.emboscada ? BOTIN.emboscada : BOTIN.normal);

// ===== En vivo: cómo va la pelea =====
// segundosEnKm y metrosEnKm: lo que llevas del km actual. Devuelve { proyeccion (s/km), vas: "bien" | "justo" | "lento", vida (0…1) }.
// La vida de la criatura baja a medida que avanzas en el km; si vas lento, la proyección lo avisa.
export function comoVa(encuentro, segundosEnKm, metrosEnKm, objetivo) {
    const vida = Math.max(0, 1 - metrosEnKm / 1000);
    if (metrosEnKm < 30) return { proyeccion: null, vas: "justo", vida };
    const proyeccion = Math.round((segundosEnKm / metrosEnKm) * 1000);
    const meta = encuentro.emboscada ? objetivo * EMBOSCADA_RITMO : objetivo;
    const vas = proyeccion <= meta * 0.99 ? "bien" : proyeccion <= meta * 1.03 ? "justo" : "lento";
    return { proyeccion, vas, vida };
}

// ¿Vas peligrosamente rápido? (más de un 25 % por encima de tu objetivo y por debajo de 3:00 /km). Solo es un aviso.
export const demasiadoRapido = (proyeccion, objetivo) => Number.isFinite(proyeccion) && proyeccion < objetivo * 0.75 && proyeccion < 180;

// ===== El resumen al terminar =====
// encuentros: los de la carrera. Devuelve { vencidas, total, gemas, xp, jefes, escaparon: [nombres] }.
export function resumen(encuentros) {
    const terminados = (encuentros || []).filter((e) => e.resultado);
    let gemas = 0;
    let xp = 0;
    for (const e of terminados.filter((x) => x.resultado === "vencida")) {
        const b = botinDe(e);
        gemas += b.gemas || 0;
        xp += b.xp || 0;
    }
    return {
        vencidas: terminados.filter((e) => e.resultado === "vencida").length,
        total: terminados.length,
        jefes: terminados.filter((e) => e.jefe && e.resultado === "vencida").length,
        gemas,
        xp,
        escaparon: terminados.filter((e) => e.resultado === "escapo").map(nombreDe),
    };
}
