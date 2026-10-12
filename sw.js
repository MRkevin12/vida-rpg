// sw.js — Service worker: hace que la app funcione SIN INTERNET.
//
// Un service worker es un pequeño programa que el navegador ejecuta
// "por detrás" de la página. La primera vez que abres la app (con internet)
// guarda una copia de todos los archivos en el teléfono. Después, cada vez
// que la app pide un archivo, se lo damos desde esa copia.
//
// Estrategia "stale-while-revalidate":
//   1. Responder AL INSTANTE con la copia guardada (funciona en modo avión).
//   2. Si hay internet, descargar la versión nueva por detrás para la próxima vez.
//
// Si agregas o renombras archivos, súmalos a ARCHIVOS y cambia VERSION.

const VERSION = "vida-rpg-v5";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./estilos.css",
    "./manifest.json",
    "./js/app.js",
    "./js/acciones.js",
    "./js/arcade.js",
    "./js/avatar.js",
    "./js/datos.js",
    "./js/dibujo.js",
    "./js/fechas.js",
    "./js/juego.js",
    "./js/minijuegos.js",
    "./js/seguridad.js",
    "./js/vistas.js",
    "./fuentes/orbitron-700.woff2",
    "./fuentes/orbitron-800.woff2",
    "./iconos/apple-touch-icon.png",
    "./iconos/icono-192.png",
    "./iconos/icono-512.png",
    "./iconos/icono-maskable-512.png",
];

// Instalación: guardar todos los archivos.
self.addEventListener("install", (evento) => {
    evento.waitUntil(
        caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS))
    );
    self.skipWaiting(); // activarse sin esperar a que se cierre la app
});

// Activación: borrar copias de versiones viejas.
self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nombres) => Promise.all(
                nombres.filter((nombre) => nombre !== VERSION).map((nombre) => caches.delete(nombre))
            ))
            .then(() => self.clients.claim())
    );
});

// Cada vez que la app pide un archivo.
self.addEventListener("fetch", (evento) => {
    const peticion = evento.request;
    // Solo archivos normales (GET) de nuestro propio sitio.
    if (peticion.method !== "GET" || new URL(peticion.url).origin !== self.location.origin) return;

    // Descargar la versión nueva (si hay internet) y guardarla para la próxima vez.
    const desdeInternet = fetch(peticion).then(async (respuesta) => {
        if (respuesta.ok) {
            const cache = await caches.open(VERSION);
            await cache.put(peticion, respuesta.clone());
        }
        return respuesta;
    });
    evento.waitUntil(desdeInternet.catch(() => {})); // sin internet: no pasa nada

    // Responder con la copia guardada; si no existe, esperar a internet.
    evento.respondWith(
        caches.match(peticion, { ignoreSearch: true }).then((guardada) => guardada || desdeInternet)
    );
});
