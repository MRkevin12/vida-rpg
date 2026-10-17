// app-version.js — El service worker (la app sin internet), las actualizaciones y las novedades de cada versión.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as vistas from "./vistas.js";
import { VERSION_APP, NOVEDADES, novedadesPorVer } from "./novedades.js";
import { $ } from "./app.js";
import { sonar } from "./app-efectos.js";

export let registroSW = null;   // para poder pedirle al teléfono que busque actualizaciones

export function registrarServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    // ¿Ya había un service worker manejando la app? (si no, es la primera instalación)
    const yaInstalada = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker.register("./sw.js")
        .then((registro) => { registroSW = registro; })
        .catch(() => {
            // Si falla (ej: abriendo el archivo directo), la app igual funciona con internet.
        });

    // Si llega un aviso con la app abierta, suena el cuerno (el toque propio de Vida RPG).
    navigator.serviceWorker.addEventListener("message", (evento) => {
        if (evento.data?.tipo === "aviso-recibido" && document.visibilityState === "visible") sonar("aviso");
    });

    // Cuando un service worker NUEVO toma el control, la página sigue con el código
    // viejo en memoria: avisamos para recargar (no recargamos solos, por si estás
    // en medio de algo, como un minijuego).
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (yaInstalada) $("#actualizacion").hidden = false;
    });
}

// El iPhone casi nunca recarga las apps de la pantalla de inicio (las "despierta"),
// así que cada vez que vuelves a la app le pedimos que revise si hay versión nueva.
export function buscarActualizacion() {
    if (registroSW && navigator.onLine) registroSW.update().catch(() => {});
}

// Muestra en Ajustes qué versión está guardada en el teléfono (el nombre de la caché).
export function mostrarVersion() {
    if (!("caches" in window)) return;
    caches.keys().then((nombres) => {
        const version = nombres.find((n) => n.startsWith("vida-rpg-"));
        $("#ajustes-version").textContent = version
            ? `Versión instalada: ${version.replace("vida-rpg-", "")}`
            : "Versión: sin guardar todavía (abre la app con internet)";
    }).catch(() => {});
}


// ===== Novedades =====
// Después de actualizar la app, una ventana con lo nuevo (una sola vez por versión).

const CLAVE_NOVEDADES = "vida-rpg-novedades";   // la última versión cuyas novedades viste

export function marcarNovedadesVistas() {
    try { localStorage.setItem(CLAVE_NOVEDADES, String(VERSION_APP)); } catch { /* sin espacio: no importa */ }
}

export function mostrarNovedades() {
    let vista = 0;
    try { vista = Number(localStorage.getItem(CLAVE_NOVEDADES)) || 0; } catch { /* nada */ }
    const lista = novedadesPorVer(vista);
    marcarNovedadesVistas();
    if (!lista.length) return;
    // Si nunca habías visto esta ventana, solo lo de esta versión (no toda la historia).
    $("#novedades-contenido").innerHTML = vistas.contenidoNovedades(vista ? lista : lista.slice(0, 1), `🆕 Novedades de la v${VERSION_APP}`);
    $("#dialogo-novedades").showModal();
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_VERSION = {
    // Novedades y bienvenida.
    "ver-novedades": () => {
        $("#dialogo-ajustes").close();
        $("#novedades-contenido").innerHTML = vistas.contenidoNovedades(NOVEDADES);
        $("#dialogo-novedades").showModal();
    },
};
