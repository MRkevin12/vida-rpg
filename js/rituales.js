// rituales.js — Los rituales del día y el desafío relámpago.
//
//   🌅 Ritual de la mañana: eliges tu MISIÓN CLAVE del día. Si la cumples, vale el doble
//      (XP, monedas y daño al jefe). Se guarda en estado.claves["2026-10-13"] = id.
//   🌙 Ritual de la noche: repasas tus misiones una por una (la hice / no la hice), escribes
//      el diario y lees el capítulo de hoy. Cerrar el día da un pequeño premio una vez.
//   ⚡ Desafío relámpago: algunos días aparece un reto con reloj («3 misiones en 2 horas»).
//
// Como siempre, aquí solo hay reglas y cálculos: nada se dibuja ni se guarda.

import * as juego from "./juego.js";
import { mezclar, numeroDelDia } from "./eventos.js";

// ===== Misión clave =====

export const FACTOR_CLAVE = 2;   // la misión clave vale el doble

export function claveDelDia(estado, fecha) {
    const id = estado.claves?.[fecha];
    return id ? estado.misiones.find((m) => m.id === id) || null : null;
}

// Las misiones que tocan ese día y todavía no hiciste ni marcaste como falladas.
export function pendientesDelDia(estado, fecha) {
    const hechas = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));
    return juego.misionesDelDia(estado.misiones, fecha).filter((m) => !hechas.has(m.id) && !juego.fallaDe(estado, m.id, fecha));
}


// ===== Ritual de la noche =====

export const PREMIO_CIERRE = { xp: 10, monedas: 5, atributo: "carisma" };

export function diaCerrado(estado, fecha) {
    return (estado.noches || []).includes(fecha);
}


// ===== Desafío relámpago =====

export const RELAMPAGO = {
    meta: 3,                 // misiones a completar…
    minutos: 120,            // …en este tiempo
    premio: { xp: 40, monedas: 40 },
    desde: 8, hasta: 18,     // solo se ofrece entre las 8 y las 18 (para que alcance el tiempo)
    probabilidad: 35,        // de cada 100 días, en cuántos aparece
};

// Lo que llevas hecho hoy (misiones, metas semanales y tareas).
export function hechasHoy(estado, fecha) {
    return estado.completadas.filter((c) => c.fecha === fecha).length +
        estado.tareas.filter((t) => t.hechaEn === fecha).length;
}

// ¿Hoy toca ofrecer un desafío relámpago? (depende de la fecha, la hora y lo que te falta)
export function relampagoDisponible(estado, fecha, hora) {
    if (estado.relampagos?.[fecha]) return false;   // ya se ofreció hoy (aceptado o no)
    if (hora < RELAMPAGO.desde || hora >= RELAMPAGO.hasta) return false;
    if (mezclar(numeroDelDia(fecha) + 7919) % 100 >= RELAMPAGO.probabilidad) return false;
    return pendientesDelDia(estado, fecha).length >= 2;
}

// Cómo va el desafío de hoy: null si no hay; si no, { estado, progreso, meta, restante (ms) }.
//   "ofrecido" (sin aceptar) · "activo" · "cumplido" · "vencido" · "rechazado"
export function estadoRelampago(estado, fecha, ahora, hora) {
    const r = estado.relampagos?.[fecha];
    if (!r) {
        return relampagoDisponible(estado, fecha, hora)
            ? { estado: "ofrecido", progreso: 0, meta: metaRelampago(estado, fecha), restante: RELAMPAGO.minutos * 60000 }
            : null;
    }
    if (r.rechazado) return { estado: "rechazado" };
    const progreso = Math.min(r.meta, Math.max(0, hechasHoy(estado, fecha) - r.base));
    const restante = r.inicio + r.minutos * 60000 - ahora;
    let situacion = "activo";
    if (r.cobradoEn) situacion = "cumplido";
    else if (restante <= 0) situacion = "vencido";
    return { estado: situacion, progreso, meta: r.meta, restante: Math.max(0, restante) };
}

// La meta: 3 misiones, o menos si te quedan menos por hacer.
export function metaRelampago(estado, fecha) {
    return Math.min(RELAMPAGO.meta, pendientesDelDia(estado, fecha).length);
}
