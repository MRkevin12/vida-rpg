// retos.js — El reto del día del arcade (v40).
//
// Cada día toca un reto distinto, por ejemplo «Llega a 300 puntos en la Carrera» o «Supera
// 4 pisos de la Torre». Si lo cumples, ganas un premio extra de gemas, una sola vez ese día.
// Los retos se miden contra TU récord, para que no sean ni imposibles ni regalados.
//
// Se guarda qué reto tocó cada día y cuánto llevas:
// estado.arcade.retos = { "2026-10-14": { tipo, meta, mejor, cobradoEn } }
//   mejor = tu mejor puntaje (o pisos) de ese día en ese juego; en «partidas», cuántas jugaste.
// La meta se fija al crear el reto: si hoy superas tu récord, el reto de hoy no se mueve.

import { sumarDias } from "./fechas.js";
import { semilla } from "./desafios.js";
import { mazmorraAbierta } from "./torre.js";

// El premio extra por cumplir el reto (una vez al día; menos que el cofre semanal).
export const PREMIO_RETO = { gemas: 6, xp: 4 };

// Cuántos días se guardan (los viejos se borran).
const DIAS_GUARDADOS = 30;

// Cada reto: su ícono, su texto, el atributo que sube (null = ninguno), la meta y qué cuenta.
//   base  = la meta si todavía no tienes récord
//   pasos = de cuánto en cuánto se redondea la meta (10 en 10, de 1 en 1…)
//   factores = qué parte de tu récord se pide (se elige uno por día, según la fecha)
export const RETOS = {
    carrera: {
        icono: "🏃", atributo: "fuerza", base: 100, pasos: 10, factores: [0.7, 0.8, 0.9],
        texto: (n) => `Llega a ${n} puntos en la Carrera del héroe`,
        unidad: "pts",
    },
    lluvia: {
        icono: "🪙", atributo: "riqueza", base: 10, pasos: 1, factores: [0.7, 0.8, 0.9],
        texto: (n) => `Llega a ${n} puntos en la Lluvia de monedas`,
        unidad: "pts",
    },
    golpe: {
        icono: "🎯", atributo: "intelecto", base: 60, pasos: 10, factores: [0.7, 0.8, 0.9],
        texto: (n) => `Llega a ${n} puntos en el Golpe preciso`,
        unidad: "pts",
    },
    torre: {
        icono: "🗼", atributo: "carisma", base: 2, pasos: 1, factores: [0.5, 0.6, 0.7], tope: 30,
        texto: (n) => `Supera ${n} pisos de la Torre en una subida`,
        unidad: "pisos",
    },
    mazmorra: {
        icono: "⛓️", atributo: "fuerza", base: 2, pasos: 1, factores: [0.5, 0.6, 0.7], tope: 30,
        texto: (n) => `Supera ${n} sótanos de la Mazmorra en un descenso`,
        unidad: "sótanos",
        disponible: (estado) => mazmorraAbierta(estado.arcade),
    },
    partidas: {
        icono: "🎟️", atributo: null, base: 2, pasos: 1, factores: [1],
        texto: (n) => `Juega ${n} partidas en el arcade`,
        unidad: "partidas",
    },
};

// Cuál es tu récord para un reto (los puntos de un minijuego o los pisos de la Torre/Mazmorra).
function recordDe(estado, tipo) {
    return estado.arcade.records[tipo] || 0;
}

// La meta de un reto para esta partida: una parte de tu récord, redondeada y nunca menos que la base.
export function metaDelReto(estado, tipo, fecha) {
    const reto = RETOS[tipo];
    const record = recordDe(estado, tipo);
    const factor = reto.factores[semilla(`${fecha}${tipo}`) % reto.factores.length];
    const meta = Math.max(reto.base, Math.round((record * factor) / reto.pasos) * reto.pasos);
    return reto.tope ? Math.min(reto.tope, meta) : meta;
}

// Elige el reto de ese día: al azar (según la fecha), sin repetir el de ayer.
export function elegirReto(estado, fecha) {
    const ayer = estado.arcade.retos[sumarDias(fecha, -1)];
    const opciones = Object.keys(RETOS)
        .filter((tipo) => tipo !== ayer?.tipo && (!RETOS[tipo].disponible || RETOS[tipo].disponible(estado)));
    const tipo = opciones[semilla(fecha) % opciones.length];
    return { tipo, meta: metaDelReto(estado, tipo, fecha), mejor: 0, cobradoEn: null };
}

// Crea el reto de ese día si todavía no existe y borra los muy viejos. Devuelve el reto.
export function asegurarReto(estado, fecha) {
    const retos = estado.arcade.retos;
    for (const dia of Object.keys(retos)) {
        if (dia < sumarDias(fecha, -DIAS_GUARDADOS)) delete retos[dia];
    }
    if (!retos[fecha]) retos[fecha] = elegirReto(estado, fecha);
    return retos[fecha];
}

// Anota una partida terminada: "juego" es "carrera", "lluvia", "golpe", "torre" o "mazmorra"
// y "valor" sus puntos (o los pisos superados). Devuelve el premio si con esto se cumplió el reto
// (y lo cobra), o null.
export function registrarPartida(estado, fecha, juego, valor) {
    const reto = asegurarReto(estado, fecha);
    if (reto.cobradoEn) return null;
    if (reto.tipo === juego) reto.mejor = Math.max(reto.mejor, valor);
    else if (reto.tipo === "partidas") reto.mejor += 1;
    if (reto.mejor < reto.meta) return null;
    reto.cobradoEn = fecha;
    return { ...PREMIO_RETO, atributo: RETOS[reto.tipo].atributo, tipo: reto.tipo };
}

// Cuánto llevas, de 0 a 100 (para la barra).
export function porcentajeDelReto(reto) {
    return Math.min(100, Math.round((reto.mejor / reto.meta) * 100));
}
