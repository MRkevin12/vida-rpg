// acciones-comun.js — Los ayudantes que comparten todos los archivos de acciones (v178).
//
// Dar ids, buscar en listas, validar lo que escribe el usuario y sumar XP/monedas/gemas (ganar).
// Los usan acciones.js y los archivos por área (acciones-gym.js, acciones-running.js, acciones-finanzas.js).

import * as juego from "./juego.js";
import * as vida from "./vida.js";
import * as equipo from "./equipo.js";
import * as retos from "./retos.js";
import { hoy } from "./fechas.js";


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


// ===== (orden) Ayudantes que usan varios archivos de acciones =====

// Los días de la semana vienen del formulario como lista de números (0 = lunes … 6 = domingo).
// Si están los 7, guardamos null, que significa "todos los días".
export function validarDias(dias) {
    if (dias === undefined || dias === null) return null;
    const lista = [...new Set(dias.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (lista.length === 0) throw new Error("Elige al menos un día de la semana.");
    return lista.length === 7 ? null : lista;
}

// Hora del aviso de una misión (opcional): "18:00", o vacío = sin aviso.
export function validarAviso(hora) {
    const texto = String(hora || "").trim();
    if (!texto) return null;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) throw new Error("Elige una hora válida para el aviso.");
    return texto;
}

// Si caíste en combate, la tienda y el arcade se cierran hasta que te levantes.
export function revisarQueNoEstesCaido(estado, que) {
    const v = vida.calcularVida(estado, hoy());
    if (v.caido) {
        throw new Error(`Caíste en combate: ${que} se abre cuando llegues a ${v.levantarse} ❤️ (tienes ${v.puntos}). ` +
                        "Cumple misiones para curarte (o toma una poción).");
    }
}

// Apunta cuánta armadura máxima tienes hoy, si cambió (te pusiste o quitaste algo, o cambiaste
// de etapa). Así vida.js sabe cuál tenías cada día, y lo que te pongas hoy no cambia el pasado.
// El primer apunte (fecha "") es «la de siempre»: vale para todos los días anteriores.
export function anotarArmadura(estado) {
    if (!estado.personaje) return;
    const maxima = equipo.armaduraMaxima(estado);
    const cambios = estado.armadura.cambios;
    const ultimo = cambios[cambios.length - 1];
    if (!ultimo) cambios.push({ fecha: "", maxima });
    else if (ultimo.maxima === maxima) return;
    else if (ultimo.fecha === hoy()) ultimo.maxima = maxima;
    else cambios.push({ fecha: hoy(), maxima });
}

// Crea el reto de hoy si todavía no existe (se llama al abrir la app y al terminar cada partida).
export function asegurarRetoDelDia(estado) {
    retos.asegurarReto(estado, hoy());
}

// Anota la partida que acabas de terminar y, si con ella se cumple el reto de hoy, cobra el premio.
// Devuelve { gemas, xp, tipo } si se cumplió ahora mismo, o null.
export function cobrarReto(estado, juego, valor) {
    const premio = retos.registrarPartida(estado, hoy(), juego, valor);
    if (premio) ganar(estado, premio);
    return premio;
}

// El nivel de cada atributo (fuerza, mente…) en este momento: lo usan la foto de antes/después y la Torre.
export function nivelesDeAtributos(estado) {
    const niveles = {};
    for (const clave of Object.keys(juego.ATRIBUTOS)) {
        niveles[clave] = juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO).nivel;
    }
    return niveles;
}
