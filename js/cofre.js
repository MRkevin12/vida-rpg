// cofre.js — El cofre del día.
//
// Con lo primero que cumplas cada día (una misión, una tarea o una sesión de enfoque) se
// desbloquea un cofre. Lo abres tocándolo y trae un premio al azar: gemas (desde la v31; antes
// monedas), XP, una poción, fichas o, muy rara vez, una pieza de equipo. Se guarda en
// estado.cofres["2026-10-13"].

import { ATRIBUTOS } from "./juego.js";
import { OBJETOS } from "./avatar.js";

// Qué puede salir y qué tan seguido (de cada 100 cofres).
export const PREMIOS_COFRE = [
    { tipo: "gemas",   peso: 45 },
    { tipo: "xp",      peso: 25 },
    { tipo: "fichas",  peso: 15 },
    { tipo: "pocion",  peso: 12 },
    { tipo: "objeto",  peso: 3 },
];

export const CURA_POCION = 25;
export const FICHAS = 2;

// ¿Hiciste algo hoy? (el cofre se desbloquea con lo primero que cumplas)
export function huboActividad(estado, fecha) {
    return estado.completadas.some((c) => c.fecha === fecha) ||
        estado.tareas.some((t) => t.hechaEn === fecha) ||
        estado.enfoque.sesiones.some((s) => s.fecha === fecha);
}

export function cofreDisponible(estado, fecha) {
    return !estado.cofres?.[fecha] && huboActividad(estado, fecha);
}

// Sortea el premio. "azar" es una función que da números entre 0 y 1 (en las pruebas se
// usa una fija, para que el resultado se pueda comprobar).
export function sortearPremio(estado, azar = Math.random) {
    let tirada = azar() * 100;
    let tipo = PREMIOS_COFRE[0].tipo;
    for (const opcion of PREMIOS_COFRE) {
        if (tirada < opcion.peso) {
            tipo = opcion.tipo;
            break;
        }
        tirada -= opcion.peso;
    }

    if (tipo === "gemas") {
        const cantidad = 15 + Math.floor(azar() * 26);   // de 15 a 40
        return { tipo, cantidad, icono: "💎", texto: `${cantidad} gemas` };
    }
    if (tipo === "xp") {
        const cantidad = 20 + Math.floor(azar() * 31);   // de 20 a 50
        const atributo = Object.keys(ATRIBUTOS)[Math.floor(azar() * 4)];
        const a = ATRIBUTOS[atributo];
        return { tipo, cantidad, atributo, icono: a.icono, texto: `${cantidad} XP de ${a.nombre}` };
    }
    if (tipo === "fichas") return { tipo, cantidad: FICHAS, icono: "🎟️", texto: `${FICHAS} fichas para el arcade` };
    if (tipo === "pocion") return { tipo, cantidad: CURA_POCION, icono: "🧪", texto: `Una poción: +${CURA_POCION} de vida` };

    // Equipo: uno raro o épico que todavía no tengas. Si ya los tienes todos, 100 gemas.
    const posibles = Object.entries(OBJETOS)
        .filter(([id, o]) => !o.logro && (o.rareza === "raro" || o.rareza === "epico") && !estado.avatar.comprados.includes(id));
    if (!posibles.length) return { tipo: "gemas", cantidad: 100, icono: "💎", texto: "100 gemas (¡ya tienes todo el equipo!)" };
    const [id, objeto] = posibles[Math.floor(azar() * posibles.length)];
    return { tipo, objeto: id, icono: objeto.icono, texto: `${objeto.nombre} (${objeto.rareza === "epico" ? "épico" : "raro"})` };
}
