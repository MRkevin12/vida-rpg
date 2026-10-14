// desafios.js — El desafío de la semana.
//
// Cada semana (de lunes a domingo) toca un desafío al azar, por ejemplo
// «Completa 3 misiones difíciles». Si lo cumples, abres un cofre con monedas y XP.
//
// Igual que la racha y los jefes, el progreso se CALCULA a partir del historial.
// Solo se guarda qué desafío tocó cada semana y si ya cobraste el cofre:
// estado.desafios = [{ semana: "2026-10-12" (su lunes), tipo, meta, cobradoEn }]

import { estaActiva, sePuedeMarcar, misionesDelDia, hechasPorFecha, esDiaPerfecto, plural } from "./juego.js";
import { sumarDias, diasEntre } from "./fechas.js";

// Lo que trae el cofre (en gemas 💎 desde la v31; antes, monedas).
export const COFRE = { xp: 100, gemas: 50 };


// ===== Ayudantes =====

// ¿La fecha está entre "desde" y "hasta" (incluidas)? Una fecha vacía no cuenta.
const entre = (fecha, desde, hasta) => Boolean(fecha) && fecha >= desde && fecha <= hasta;

const completadasEntre = (e, desde, hasta) => e.completadas.filter((c) => entre(c.fecha, desde, hasta));

// Los 7 días de la semana que empieza en "lunes".
const diasDeLaSemana = (lunes) => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

// Cuántas veces PODRÍAS completar misiones esa semana (de las que pasan el filtro).
// Una misión de días fijos cuenta cada día que se puede marcar; una semanal, sus "veces".
function huecos(e, lunes, filtro = () => true) {
    const dias = diasDeLaSemana(lunes);
    let total = 0;
    for (const m of e.misiones.filter(filtro)) {
        if (m.veces) total += dias.some((d) => estaActiva(m, d)) ? m.veces : 0;
        else total += dias.filter((d) => sePuedeMarcar(m, d)).length;
    }
    return total;
}

// Cuántos días de esa semana tienen alguna misión que se pueda marcar.
const diasPosibles = (e, lunes) => diasDeLaSemana(lunes).filter((d) => e.misiones.some((m) => sePuedeMarcar(m, d))).length;


// ===== Los desafíos =====
// Cada uno tiene: su ícono, su texto, su meta, si tiene sentido para tu partida
// (disponible: no te va a tocar «3 misiones difíciles» si no tienes ninguna difícil)
// y cómo se mide el progreso entre dos fechas.

export const DESAFIOS = {
    dificiles: {
        icono: "💀",
        texto: (n) => `Completa ${plural(n, "misión difícil", "misiones difíciles")}`,
        meta: () => 3,
        disponible: (e, lunes) => huecos(e, lunes, (m) => m.dificultad === "dificil") >= 3,
        progreso: (e, desde, hasta) => completadasEntre(e, desde, hasta).filter((c) => c.dificultad === "dificil").length,
    },
    total: {
        icono: "⚔️",
        texto: (n) => `Completa ${plural(n, "misión diaria", "misiones diarias")}`,
        // El 80 % de las que podrías hacer esa semana (máximo 40).
        meta: (e, lunes) => Math.min(40, Math.round(huecos(e, lunes) * 0.8)),
        disponible: (e, lunes) => huecos(e, lunes) >= 4,
        progreso: (e, desde, hasta) => completadasEntre(e, desde, hasta).length,
    },
    perfectos: {
        icono: "✨",
        texto: (n) => `Logra ${plural(n, "día perfecto", "días perfectos")}`,
        meta: () => 3,
        disponible: (e, lunes) => diasDeLaSemana(lunes).filter((d) => misionesDelDia(e.misiones, d).length > 0).length >= 3,
        progreso: (e, desde, hasta) => {
            const hechas = hechasPorFecha(e.completadas);
            return diasDeLaSemana(desde).filter((d) => d <= hasta && esDiaPerfecto(e.misiones, d, hechas)).length;
        },
    },
    constancia: {
        icono: "🔥",
        texto: (n) => `Completa al menos una misión ${n} días distintos`,
        meta: () => 5,
        disponible: (e, lunes) => diasPosibles(e, lunes) >= 6,
        progreso: (e, desde, hasta) => new Set(completadasEntre(e, desde, hasta).map((c) => c.fecha)).size,
    },
    atributos: {
        icono: "🌟",
        texto: (n) => (n === 4 ? "Completa misiones de los 4 atributos" : `Completa misiones de ${n} atributos distintos`),
        meta: () => 4,
        disponible: (e) => new Set(e.misiones.filter((m) => !m.archivadaEn).map((m) => m.atributo)).size === 4,
        progreso: (e, desde, hasta) => new Set(completadasEntre(e, desde, hasta).map((c) => c.atributo)).size,
    },
    enfoque: {
        icono: "⏱️",
        texto: (n) => `Haz ${plural(n, "sesión", "sesiones")} de enfoque`,
        meta: () => 4,
        disponible: () => true,
        progreso: (e, desde, hasta) => e.enfoque.sesiones.filter((s) => entre(s.fecha, desde, hasta)).length,
    },
    pasos: {
        icono: "🗺️",
        texto: (n) => `Avanza ${plural(n, "paso", "pasos")} de tus misiones principales`,
        meta: () => 2,
        disponible: (e) => e.principales.filter((p) => !p.archivada).flatMap((p) => p.submisiones).filter((s) => !s.hecha).length >= 2,
        progreso: (e, desde, hasta) => e.principales.flatMap((p) => p.submisiones).filter((s) => s.hecha && entre(s.hechaEn, desde, hasta)).length,
    },
    diario: {
        icono: "📓",
        texto: (n) => `Escribe en tu diario ${n} días`,
        meta: () => 5,
        disponible: () => true,
        progreso: (e, desde, hasta) => Object.keys(e.diario).filter((fecha) => entre(fecha, desde, hasta)).length,
    },
    tareas: {
        icono: "📌",
        texto: (n) => `Completa ${plural(n, "tarea suelta", "tareas sueltas")}`,
        meta: () => 3,
        disponible: (e) => e.tareas.filter((t) => !t.hechaEn).length >= 3,
        progreso: (e, desde, hasta) => e.tareas.filter((t) => entre(t.hechaEn, desde, hasta)).length,
    },
};


// ===== Elegir y medir =====

// Convierte un texto en un número (siempre el mismo para el mismo texto).
export function semilla(texto) {
    let n = 0;
    for (const letra of texto) n = (n * 31 + letra.charCodeAt(0)) % 1000003;
    return n;
}

// Elige el desafío de la semana que empieza en "lunes". Usa la fecha como semilla:
// es al azar, pero no repite el de la semana pasada.
// "desde" = el día en que se crea. Si abres la app por primera vez un jueves, quedan
// 4 de los 7 días, así que la meta se reduce en proporción (mínimo 1).
export function elegirDesafio(estado, lunes, desde = lunes) {
    const anterior = estado.desafios.find((d) => d.semana === sumarDias(lunes, -7));
    const opciones = Object.keys(DESAFIOS)
        .filter((tipo) => tipo !== anterior?.tipo && DESAFIOS[tipo].disponible(estado, lunes));
    const tipo = opciones[semilla(lunes) % opciones.length];   // "enfoque" y "diario" siempre están
    const quedan = 7 - diasEntre(lunes, desde);
    const meta = Math.max(1, Math.round((DESAFIOS[tipo].meta(estado, lunes) * quedan) / 7));
    return { semana: lunes, tipo, meta, cobradoEn: null };
}

// Cuánto llevas de un desafío (contando de su lunes a su domingo).
export function progresoDesafio(estado, desafio) {
    return DESAFIOS[desafio.tipo].progreso(estado, desafio.semana, sumarDias(desafio.semana, 6));
}

export function textoDesafio(desafio) {
    return DESAFIOS[desafio.tipo].texto(desafio.meta);
}
