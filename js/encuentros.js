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
import { MARGEN_FOGATA } from "./hallazgos.js";   // (v148) la fogata da más margen

// ===== Las zonas del mapa de la carrera (cambian cada «km por zona»: lo eliges tú, por defecto KM_POR_ZONA) =====
// suelo: los dos colores del césped en cuadritos; criaturas: de qué zona del bestiario salen.
export const KM_POR_ZONA = 2;          // lo normal; se cambia en Running › Progreso › Tus metas (de KM_POR_ZONA_MIN a KM_POR_ZONA_MAX)
export const KM_POR_ZONA_MIN = 1;
export const KM_POR_ZONA_MAX = 10;
export const ZONAS = [
    { id: "pradera",  nombre: "Pradera",          suelo: ["#2a6a38", "#2e7040"], detalle: "#3f9a4a", criaturas: "cripta" },
    { id: "bosque",   nombre: "Bosque de raíces", suelo: ["#1f5230", "#235836"], detalle: "#2f7a3a", criaturas: "raices" },
    { id: "pantano",  nombre: "Pantano anegado",  suelo: ["#33503a", "#385640"], detalle: "#4a7a5a", criaturas: "cisterna" },
    { id: "desierto", nombre: "Desierto de brasas", suelo: ["#b8955a", "#c09d62"], detalle: "#d8b878", criaturas: "fragua" },
    { id: "nieve",    nombre: "Cumbres nevadas",  suelo: ["#c8d4e4", "#d2dcea"], detalle: "#eef3fa", criaturas: "cima" },
    { id: "volcan",   nombre: "Tierras del Abismo", suelo: ["#3a2a30", "#412f36"], detalle: "#6a3a3a", criaturas: "abismo" },
];
export const zonaDelKm = (km, porZona = KM_POR_ZONA) => ZONAS[Math.floor((Math.max(1, km) - 1) / porZona) % ZONAS.length];

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

export function criaturaDelKm(inicio, km, porZona = KM_POR_ZONA) {
    const zona = zonaDelKm(km, porZona);
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
// (v148) fogata: true si descansaste junto a una fogata en este km (un 2 % más de margen, ver hallazgos.js).
export function resolver(encuentro, datos, objetivo, mascota = false, { fogata = false } = {}) {
    const extra = (mascota ? MARGEN_MASCOTA : 0) + (fogata ? MARGEN_FOGATA : 0);
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

// ===== (v139) La batalla mientras corres: los poderes de tu héroe =====
// El km se parte en 10 tramos de 100 m. Cada tramo que corres a tu ritmo es un poder que tu héroe le lanza a la criatura:
//   ⚔️ Tajo:      100 m a tu ritmo objetivo (con un 5 % de margen: en tramos tan cortos el GPS no es perfecto).
//   ⚡ Rayo:      100 m un 8 % más rápido que tu objetivo. Pega más fuerte.
//   🔥 Llamarada: cada 3 tramos SEGUIDOS a tu ritmo, se suma al golpe.
// Si un tramo te sale lento, la criatura te ataca a ti (🐢); si pausas, aprovecha (⏸).
// Al cumplir el km llega el golpe final, y ahí manda la regla de siempre (resolver): si la venciste, cae; si no, escapa.
// Por eso su vida nunca baja de VIDA_MIN antes del final: el último golpe siempre es el del kilómetro completo.
export const TRAMO = 100;            // metros
export const MARGEN_TRAMO = 0.05;
export const RAYO = 0.92;            // un tramo un 8 % más rápido que tu objetivo
export const COMBO = 3;              // tramos seguidos para la llamarada
export const VIDA = 100;             // la vida de la criatura y la de tu héroe en cada pelea
export const VIDA_MIN = 5;

// efecto: el dibujo del golpe en la batalla (las clases ff-tajo, ff-rayo y ff-fuego de la Torre).
export const PODERES = {
    tajo:      { icono: "⚔️", nombre: "Tajo",      dano: 8,  efecto: "tajo",  texto: "100 m a tu ritmo" },
    rayo:      { icono: "⚡", nombre: "Rayo",      dano: 14, efecto: "rayo",  texto: "100 m un 8 % más rápido" },
    llamarada: { icono: "🔥", nombre: "Llamarada", dano: 12, efecto: "fuego", texto: `${COMBO} tramos seguidos a tu ritmo` },
};

// Lo que te hace la criatura cuando no cumples (solo baja la vida de tu héroe en esta pelea: no quita premios).
export const ATAQUES_CRIATURA = {
    lento: { icono: "🐢", nombre: "Se te adelanta", herida: 15 },
    pausa: { icono: "⏸", nombre: "Aprovecha tu pausa", herida: 20 },
};

// El golpe final de cada tipo de criatura: su nombre dice qué objetivo cumpliste.
export const GOLPE_FINAL = {
    normal:    { icono: "💥", nombre: "Golpe final" },
    rapida:    { icono: "⚡", nombre: "Relámpago final" },   // aceleraste los últimos 200 m
    pesada:    { icono: "🔨", nombre: "Rompecorazas" },      // ritmo parejo
    fantasma:  { icono: "✨", nombre: "Luz sagrada" },       // sin pausas
    emboscada: { icono: "🌀", nombre: "Contraataque" },
    jefe:      { icono: "👑", nombre: "Golpe de Voluntad" },
};
export const golpeFinalDe = (e) => GOLPE_FINAL[e.jefe ? "jefe" : e.emboscada ? "emboscada" : e.clase] || GOLPE_FINAL.normal;

// El poder de un tramo. segundos: lo que tardaste en esos 100 m. racha: cuántos tramos seguidos llevabas a tu ritmo.
// Devuelve { tipo: "tajo" | "rayo" | "lento", dano, herida, combo, racha } o null si el tiempo no sirve (0 o negativo).
export function poderDelTramo(encuentro, segundos, objetivo, racha = 0, mascota = false) {
    if (!(segundos > 0)) return null;
    const extra = mascota ? MARGEN_MASCOTA : 0;
    const meta = (encuentro.emboscada ? objetivo * EMBOSCADA_RITMO : objetivo) * (TRAMO / 1000);   // los segundos que pide un tramo
    if (segundos > meta * (1 + MARGEN_TRAMO + extra)) return { tipo: "lento", dano: 0, herida: ATAQUES_CRIATURA.lento.herida, combo: false, racha: 0 };
    const tipo = segundos <= meta * (RAYO + extra) ? "rayo" : "tajo";
    const nueva = racha + 1;
    const combo = nueva % COMBO === 0;
    return { tipo, dano: PODERES[tipo].dano + (combo ? PODERES.llamarada.dano : 0), herida: 0, combo, racha: nueva };
}

// La vida de la criatura y la de tu héroe (de 0 a VIDA) según los golpes de la pelea.
// resultado: el de la pelea si ya se decidió ("vencida" la deja en 0).
// (v148) Tu vida se cuenta golpe por golpe, en orden: así una fogata (cura) no te deja con más de VIDA.
export function vidasDeLaBatalla(golpes = [], resultado = null) {
    const dano = golpes.reduce((suma, g) => suma + (g.dano || 0), 0);
    let heroe = VIDA;
    for (const g of golpes) heroe = Math.min(VIDA, Math.max(VIDA_MIN, heroe - (g.herida || 0) + (g.cura || 0)));
    return {
        criatura: resultado === "vencida" ? 0 : Math.max(VIDA_MIN, VIDA - dano),
        heroe,
    };
}

// ¿Vas peligrosamente rápido? (más de un 25 % por encima de tu objetivo y por debajo de 3:00 /km). Solo es un aviso.
export const demasiadoRapido = (proyeccion, objetivo) => Number.isFinite(proyeccion) && proyeccion < objetivo * 0.75 && proyeccion < 180;

// (v140) El consejo de un vistazo mientras corres: tu ritmo de AHORA (s/km) contra lo que pide la pelea.
// Devuelve { clave: "rapido" | "bien" | "casi" | "lento" | "espera", icono, texto }. Sin ritmo todavía (o en pausa): "espera".
export function consejoDeRitmo(segundosPorKm, objetivo, emboscada = false) {
    if (!Number.isFinite(segundosPorKm) || segundosPorKm <= 0 || !objetivo) return { clave: "espera", icono: "⏳", texto: "Empieza a correr" };
    const meta = emboscada ? objetivo * EMBOSCADA_RITMO : objetivo;
    if (demasiadoRapido(segundosPorKm, objetivo) || segundosPorKm < meta * 0.88) return { clave: "rapido", icono: "🔵", texto: "Muy rápido: afloja un poco" };
    if (segundosPorKm <= meta * 1.0) return { clave: "bien", icono: "🟢", texto: "Buen ritmo: sigue así" };
    if (segundosPorKm <= meta * 1.05) return { clave: "casi", icono: "🟡", texto: "Casi: acelera un poco" };
    return { clave: "lento", icono: "🔴", texto: "Lento: ¡acelera!" };
}

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
