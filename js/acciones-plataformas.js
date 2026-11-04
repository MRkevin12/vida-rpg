// acciones-plataformas.js — Lo que cambia la partida en «La Senda del Reino» (v185), el juego de plataformas.
//
// Parte de acciones.js (como acciones-gym.js): cada función recibe el «estado» (la partida), lo cambia y lanza
// Error("mensaje en español") si algo no se puede. acciones.js lo reexporta todo.
//
// Cada nivel cuesta 1 ficha (como cualquier minijuego). Al terminar se cobra igual que los demás minijuegos
// (gemas y XP según los puntos, con los mismos topes) y, si llegaste a la meta, se anota el nivel: queda abierto
// el siguiente y se guardan tus reliquias y tu mejor marca (ver plataformas.js › registrarNivel).

import * as P from "./plataformas.js";
import { hoy } from "./fechas.js";
import { empezarPartida, terminarPartida } from "./acciones.js";   // (son funciones: se pueden importar aunque acciones.js importe este archivo)

// El progreso de la Senda (las partidas de antes de la v185 lo reciben al cargar: ver datos.js › completar).
function progresoDe(estado) {
    if (!estado.arcade.plataformas) estado.arcade.plataformas = P.progresoInicial();
    return estado.arcade.plataformas;
}

// Empieza un nivel: revisa que esté abierto y gasta la ficha.
export function empezarSenda(estado, nivelId) {
    if (!P.POR_ID[nivelId]) throw new Error("Ese nivel no existe.");
    if (!P.nivelAbierto(progresoDe(estado), nivelId)) {
        const def = P.POR_ID[nivelId];
        throw new Error(def.requiere?.reliquias
            ? `Ese nivel se abre con ${def.requiere.reliquias} reliquias.`
            : "Ese nivel todavía está cerrado: termina el anterior.");
    }
    empezarPartida(estado, "plataformas");   // gasta la ficha (y revisa que no hayas caído en combate)
}

// Termina un nivel. resultado = el de la partida (plataformas-motor.js): { gano, puntos, reliquias, tiempo, monedas, enemigos }.
export function terminarSenda(estado, nivelId, resultado) {
    const def = P.POR_ID[nivelId];
    if (!def) throw new Error("Ese nivel no existe.");
    const r = terminarPartida(estado, "plataformas", resultado.puntos);
    const progreso = P.registrarNivel(progresoDe(estado), nivelId, resultado, hoy());
    const celebraciones = [...r.celebraciones];
    if (progreso.primeraVez && def.jefe) {
        const mundo = P.mundoDe(def);
        const siguiente = P.MUNDOS[def.mundo];
        celebraciones.push({
            icono: "👑", etiqueta: siguiente ? "¡Mundo superado!" : "¡La Senda del Reino, completa!",
            titulo: mundo.nombre,
            detalle: siguiente ? `Venciste a ${P.JEFES[def.jefe].nombre}. Se abre: ${siguiente.nombre}.` : `Venciste a ${P.JEFES[def.jefe].nombre}. La Llama vuelve a arder.`,
        });
    }
    if (progreso.nuevas.length && P.reliquiasDe(progresoDe(estado), nivelId).length === P.RELIQUIAS_POR_NIVEL) {
        celebraciones.push({ icono: "💎", etiqueta: "Todas las reliquias", titulo: `${def.id} · ${def.nombre}`, detalle: "Encontraste las 3 reliquias de este nivel." });
    }
    return { ...r, nivel: nivelId, progreso, celebraciones };
}
