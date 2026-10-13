// eventos.js — Los eventos del día: algo distinto que pasa en el mundo de tu héroe.
//
// Más o menos la mitad de los días hay un evento (Mercader ambulante, Luna de sangre…).
// El evento de cada fecha sale de la fecha misma: siempre es el mismo para ese día, en
// cualquier teléfono, y no hace falta guardarlo. Se pueden apagar en Ajustes
// (estado.ajustes.eventos = false).
//
// Sus efectos se aplican en el momento de cada acción (y se guardan en el registro de esa
// acción), así nunca cambian el pasado.

import { ATRIBUTOS } from "./juego.js";
import { desdeTexto } from "./fechas.js";

export const EVENTOS = {
    mercader:  { icono: "🧳", nombre: "Mercader ambulante", texto: "Las recompensas y el equipo de la tienda cuestan 30 % menos hoy." },
    bendicion: { icono: "✨", nombre: "Bendición", texto: (a) => `Hoy todo lo de ${a.icono} ${a.nombre} da +50 % de XP.` },
    fortuna:   { icono: "🪙", nombre: "Día de fortuna", texto: "Cada misión, tarea o sesión de enfoque da +50 % de monedas." },
    termas:    { icono: "♨️", nombre: "Aguas termales", texto: "Hoy cada misión cumplida cura el doble." },
    luna:      { icono: "🌕", nombre: "Luna de sangre", texto: "Las misiones difíciles dan el doble de XP hoy." },
    eco:       { icono: "🗼", nombre: "Eco de la Torre", texto: "La Torre del héroe paga el doble hoy." },
    sabio:     { icono: "📜", nombre: "Visita del sabio", texto: "Escribir el diario da el triple de XP hoy." },
};

// De cada 100 días, en cuántos NO pasa nada.
const SIN_EVENTO = 45;

// Mezcla los bits de un número: así días seguidos dan resultados que no se parecen.
export function mezclar(numero) {
    let x = Math.imul(numero, 2654435761) >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 2246822519) >>> 0;
    x ^= x >>> 13;
    return x >>> 0;
}

// Días desde el 1 de enero de 1970 (un número distinto para cada fecha).
export function numeroDelDia(fecha) {
    return Math.round(desdeTexto(fecha).getTime() / 86400000);
}

// El evento de una fecha, o null si ese día no pasa nada (o si los apagaste).
// Devuelve { clave, atributo, icono, nombre, texto }.
export function eventoDelDia(fecha, estado = null) {
    if (estado && estado.ajustes?.eventos === false) return null;
    const numero = mezclar(numeroDelDia(fecha));
    if (numero % 100 < SIN_EVENTO) return null;
    const claves = Object.keys(EVENTOS);
    const clave = claves[Math.floor(numero / 100) % claves.length];
    const evento = EVENTOS[clave];
    const atributo = clave === "bendicion" ? Object.keys(ATRIBUTOS)[Math.floor(numero / 10000) % 4] : null;
    return {
        clave,
        atributo,
        icono: evento.icono,
        nombre: atributo ? `${evento.nombre} de ${ATRIBUTOS[atributo].nombre}` : evento.nombre,
        texto: typeof evento.texto === "function" ? evento.texto(ATRIBUTOS[atributo]) : evento.texto,
    };
}


// ===== Los efectos =====

// Por cuánto se multiplican la XP y las monedas de algo cumplido (misión, tarea o enfoque).
export function factorPremio(evento, { dificultad, atributo }) {
    const factor = { xp: 1, monedas: 1 };
    if (evento?.clave === "bendicion" && atributo === evento.atributo) factor.xp = 1.5;
    if (evento?.clave === "luna" && dificultad === "dificil") factor.xp = 2;
    if (evento?.clave === "fortuna") factor.monedas = 1.5;
    return factor;
}

// El precio en la tienda (recompensas, equipo y pociones) con el descuento del mercader.
export function precioConEvento(precio, evento) {
    return evento?.clave === "mercader" ? Math.max(1, Math.round(precio * 0.7)) : precio;
}

export const factorCura = (evento) => (evento?.clave === "termas" ? 2 : 1);
export const factorTorre = (evento) => (evento?.clave === "eco" ? 2 : 1);
export const factorDiario = (evento) => (evento?.clave === "sabio" ? 3 : 1);
