// app-pin.js — El bloqueo con PIN y Face ID.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as seguridad from "./seguridad.js";
import { estado, $, reiniciarPartida } from "./app.js";
import { reproducirAnimacion, avisar } from "./app-efectos.js";
import { PREPARAR } from "./app-dialogos.js";

// ===== Bloqueo con PIN =====
// La misma pantalla de teclado sirve para tres cosas: entrar, crear un PIN
// y confirmar que eres tú antes de cambiarlo. "alCompletar" dice qué hacer
// cuando se escriben los 4 números; si devuelve false, los puntos tiemblan.

export const GRACIA_MS = 60 * 1000;   // si vuelves a la app antes de 1 minuto, no pide PIN

let pinEscrito = "";

let alCompletarPin = null;

let intentosFallidos = 0;

let esperarHasta = 0;          // tras 5 errores hay que esperar 30 segundos

function mostrarTeclado({ titulo = "Vida RPG", mensaje, error = false, alCompletar, secundario }) {
    // Las ventanas abiertas quedarían encima del bloqueo: las cerramos.
    for (const dialogo of document.querySelectorAll("dialog[open]")) dialogo.close();
    $("#bloqueo-faceid").hidden = true;   // solo se muestra al entrar (ver pedirPinParaEntrar)
    $("#bloqueo-titulo").textContent = titulo;
    ponerMensaje(mensaje, error);
    pinEscrito = "";
    pintarPuntos();
    alCompletarPin = alCompletar;
    const boton = $("#bloqueo-secundario");
    boton.textContent = secundario.texto;
    boton.onclick = secundario.accion;
    $("#bloqueo").hidden = false;
}

export function cerrarTeclado() {
    $("#bloqueo").hidden = true;
    alCompletarPin = null;
    pinEscrito = "";
}

function ponerMensaje(texto, error = false) {
    const mensaje = $("#bloqueo-mensaje");
    mensaje.textContent = texto;
    mensaje.classList.toggle("error", error);
}

function pintarPuntos() {
    document.querySelectorAll("#bloqueo-puntos span").forEach((punto, i) => {
        punto.classList.toggle("lleno", i < pinEscrito.length);
    });
}

export async function teclaPulsada(tecla) {
    if (!alCompletarPin) return;
    if (tecla === "borrar") {
        pinEscrito = pinEscrito.slice(0, -1);
        pintarPuntos();
        return;
    }
    if (pinEscrito.length >= seguridad.LARGO_PIN) return;
    pinEscrito += tecla;
    pintarPuntos();

    if (pinEscrito.length === seguridad.LARGO_PIN) {
        const resultado = await alCompletarPin(pinEscrito);
        if (resultado === false) {
            reproducirAnimacion($("#bloqueo-puntos"), "error");
            setTimeout(() => { pinEscrito = ""; pintarPuntos(); }, 350);
        }
    }
}

// Pide el PIN y, si es correcto, ejecuta "alEntrar".
export function pedirPinParaEntrar(alEntrar) {
    $("#juego").hidden = true; // que no se vea nada detrás
    mostrarTeclado({
        mensaje: "Ingresa tu PIN",
        secundario: { texto: "Olvidé mi PIN", accion: olvidePin },
        alCompletar: async (pin) => {
            if (Date.now() < esperarHasta) {
                ponerMensaje(`Demasiados intentos. Espera ${Math.ceil((esperarHasta - Date.now()) / 1000)} s.`, true);
                return false;
            }
            if (!(await seguridad.pinCorrecto(pin))) {
                intentosFallidos += 1;
                if (intentosFallidos >= 5) {
                    intentosFallidos = 0;
                    esperarHasta = Date.now() + 30 * 1000;
                    ponerMensaje("Demasiados intentos. Espera 30 segundos.", true);
                } else {
                    ponerMensaje("PIN incorrecto", true);
                }
                return false;
            }
            desbloquear(alEntrar);
        },
    });
    if (seguridad.hayFaceId()) {
        const boton = $("#bloqueo-faceid");
        boton.hidden = false;
        boton.onclick = () => entrarConFaceId(alEntrar);
    }
}

function desbloquear(alEntrar) {
    intentosFallidos = 0;
    cerrarTeclado();
    $("#juego").hidden = false;
    alEntrar();
}

// Face ID: si el iPhone reconoce tu cara, entras sin escribir el PIN.
// "silencioso": al abrir la app se intenta solo; si el iPhone no deja (pide un toque), no se muestra error.
export async function entrarConFaceId(alEntrar, { silencioso = false } = {}) {
    if (!seguridad.hayFaceId() || $("#bloqueo").hidden) return;
    try {
        if (await seguridad.comprobarFaceId()) desbloquear(alEntrar);
        else if (!silencioso) ponerMensaje("No se pudo comprobar. Usa tu PIN.", true);
    } catch {
        if (!silencioso) ponerMensaje("Face ID no respondió. Usa tu PIN.", true);
    }
}

// Crear un PIN nuevo: escribirlo y repetirlo.
export function crearPin({ conAhoraNo = false, mensaje = "Elige 4 números", error = false } = {}) {
    const cancelar = conAhoraNo
        ? { texto: "Ahora no", accion: () => { seguridad.omitir(); cerrarTeclado(); } }
        : { texto: "Cancelar", accion: cerrarTeclado };

    mostrarTeclado({
        titulo: "Crea tu PIN",
        mensaje,
        error,
        secundario: cancelar,
        alCompletar: (primero) => {
            mostrarTeclado({
                titulo: "Crea tu PIN",
                mensaje: "Repítelo para confirmar",
                secundario: cancelar,
                alCompletar: async (segundo) => {
                    if (segundo !== primero) {
                        crearPin({ conAhoraNo, mensaje: "No coincidían. Elige 4 números otra vez.", error: true });
                        return;
                    }
                    await seguridad.guardarPin(primero);
                    cerrarTeclado();
                    avisar("🔒 PIN activado: solo tú puedes abrir la app");
                },
            });
        },
    });
}

// Antes de cambiar o quitar el PIN, comprobar que eres tú.
function confirmarPinYLuego(accion) {
    mostrarTeclado({
        titulo: "Confirma que eres tú",
        mensaje: "Ingresa tu PIN actual",
        secundario: { texto: "Cancelar", accion: cerrarTeclado },
        alCompletar: async (pin) => {
            if (!(await seguridad.pinCorrecto(pin))) {
                ponerMensaje("PIN incorrecto", true);
                return false;
            }
            cerrarTeclado();
            accion();
        },
    });
}

function olvidePin() {
    const mensaje = "Si olvidaste tu PIN, la única forma de entrar es BORRAR los datos de la app en este teléfono. " +
                    "Después podrás importar tu última copia de seguridad. ¿Borrar?";
    if (!confirm(mensaje)) return;
    if (!confirm("Se borrará tu progreso de este teléfono. ¿Seguro?")) return;
    reiniciarPartida();
    cerrarTeclado();
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_PIN = {
    "activar-pin": () => crearPin(),
    "cambiar-pin": () => confirmarPinYLuego(() => crearPin()),
    "quitar-pin": () => confirmarPinYLuego(() => {
        seguridad.omitir(); // sin PIN, y sin volver a preguntar
        avisar("🔓 PIN desactivado");
    }),

    // Face ID (en Ajustes).
    "activar-faceid": async () => {
        try {
            await seguridad.activarFaceId(estado.personaje.nombre);
            avisar("🙂 Face ID activado");
        } catch {
            alert("No se pudo activar Face ID. Revisa que esté configurado en tu iPhone e inténtalo otra vez.");
        }
        PREPARAR.ajustes();
    },
    "quitar-faceid": () => {
        seguridad.quitarFaceId();
        avisar("Face ID desactivado");
        PREPARAR.ajustes();
    },
};
