// acciones-comun.js — Los ayudantes que comparten todos los archivos de acciones (v178).
//
// Dar ids, buscar en listas, validar lo que escribe el usuario y sumar XP/monedas/gemas (ganar).
// Los usan acciones.js y los archivos por área (acciones-gym.js, acciones-running.js, acciones-finanzas.js).

import * as juego from "./juego.js";


// Da un número de id nuevo (1, 2, 3...) para cada cosa que se crea.
export function nuevoId(estado) {
    const id = estado.siguienteId;
    estado.siguienteId += 1;
    return id;
}

// Busca un elemento por id en una lista, o lanza un error si no existe.
export function buscar(lista, id, queEs) {
    const encontrado = lista.find((elemento) => elemento.id === id);
    if (!encontrado) throw new Error(`No encontré ${queEs}.`);
    return encontrado;
}

// Valida un nombre escrito por el usuario.
export function validarNombre(texto, maximo) {
    const nombre = String(texto || "").trim();
    if (nombre.length === 0) throw new Error("Escribe un nombre.");
    if (nombre.length > maximo) throw new Error(`El nombre puede tener máximo ${maximo} letras.`);
    return nombre;
}

// Valida un número entero dentro de un rango.
export function validarEntero(valor, minimo, maximo, queEs) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
        throw new Error(`${queEs} debe ser un número entero entre ${minimo} y ${maximo}.`);
    }
    return numero;
}

export function validarAtributo(atributo) {
    if (!juego.ATRIBUTOS[atributo]) throw new Error("Elige un atributo.");
    return atributo;
}

// El formulario manda uno de los 4 ("fuerza") o uno tuyo ("propio:5").
// Devuelve el atributo base (el que sube y pega a los jefes) y, si es tuyo, su id.
export function elegirAtributo(estado, valor) {
    const id = juego.idDePropio(valor);
    if (id === null) return { atributo: validarAtributo(valor), atributoPropio: null };
    const propio = juego.buscarPropio(estado, id);
    if (!propio) throw new Error("Ese atributo ya no existe.");
    return { atributo: propio.base, atributoPropio: propio.id };
}

export function validarDificultad(dificultad) {
    if (!juego.DIFICULTADES[dificultad]) throw new Error("Elige una dificultad.");
    return dificultad;
}

// Suma (o resta, si los números son negativos) XP, monedas, gemas y XP de un atributo.
// Nada baja de 0. Monedas 🪙 = lo que haces en la vida real (para tus premios reales);
// gemas 💎 = el arcade y los premios extra (para el arcade y las mascotas). Ver arcade.js.
export function ganar(estado, { xp = 0, monedas = 0, gemas = 0, atributo = null }) {
    const personaje = estado.personaje;
    personaje.xp = Math.max(0, personaje.xp + xp);
    personaje.monedas = Math.max(0, personaje.monedas + monedas);
    personaje.gemas = Math.max(0, (personaje.gemas || 0) + gemas);
    if (atributo) {
        estado.atributos[atributo] = Math.max(0, estado.atributos[atributo] + xp);
    }
}

// Un número escrito con coma o con punto, dentro de un rango (pesos, km, minutos…), redondeado a 2 decimales.
export const numeroEntre = (valor, minimo, maximo, que) => {
    const n = Number(String(valor).replace(",", "."));
    if (!Number.isFinite(n) || n < minimo || n > maximo) throw new Error(`${que} debe estar entre ${minimo} y ${maximo}.`);
    return Math.round(n * 100) / 100;
};
