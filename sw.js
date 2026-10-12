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
// IMPORTANTE: cada vez que publiques cambios, sube VERSION (v10 → v11…).
// Así el teléfono detecta la versión nueva y la app muestra el aviso «Actualizar».
// Si agregas o renombras archivos, súmalos también a ARCHIVOS.
//
// GitHub Pages le dice al navegador que guarde los archivos 10 minutos
// (Cache-Control: max-age=600). Para no copiar archivos viejos, aquí siempre
// los pedimos frescos con cache: "reload" / "no-cache".

const VERSION = "vida-rpg-v11";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./estilos.css",
    "./manifest.json",
    "./js/app.js",
    "./js/acciones.js",
    "./js/arcade.js",
    "./js/avatar.js",
    "./js/campana.js",
    "./js/datos.js",
    "./js/desafios.js",
    "./js/dibujo.js",
    "./js/dibujo-base.js",
    "./js/dibujo-cuerpo.js",
    "./js/dibujo-escenas.js",
    "./js/dibujo-mascota.js",
    "./js/dibujo-objetos.js",
    "./js/dibujo-ropa.js",
    "./js/fechas.js",
    "./js/juego.js",
    "./js/minijuegos.js",
    "./js/resumen.js",
    "./js/seguridad.js",
    "./js/sonido.js",
    "./js/vistas.js",
    "./fuentes/orbitron-700.woff2",
    "./fuentes/orbitron-800.woff2",
    "./iconos/apple-touch-icon.png",
    "./iconos/icono-192.png",
    "./iconos/icono-512.png",
    "./iconos/icono-maskable-512.png",
    // Pinturas de los jefes (dominio público)
    "./jefes/cerbero.jpg",
    "./jefes/ciclope.jpg",
    "./jefes/circe.jpg",
    "./jefes/coloso.jpg",
    "./jefes/dragon_rojo.jpg",
    "./jefes/fafner.jpg",
    "./jefes/gerion.jpg",
    "./jefes/hidra.jpg",
    "./jefes/leviatan.jpg",
    "./jefes/lobo.jpg",
    "./jefes/mammon.jpg",
    "./jefes/medusa.jpg",
    "./jefes/mefistofeles.jpg",
    "./jefes/minotauro.jpg",
    "./jefes/narciso.jpg",
    "./jefes/pesadilla.jpg",
    "./jefes/pluton.jpg",
    "./jefes/recaudadores.jpg",
    "./jefes/satanas.jpg",
    "./jefes/sirenas.jpg",
];

// Instalación: guardar todos los archivos.
self.addEventListener("install", (evento) => {
    // cache: "reload" = ir siempre a internet, sin usar la caché del navegador.
    evento.waitUntil(
        caches.open(VERSION).then((cache) =>
            cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: "reload" }))))
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
    const direccion = new URL(peticion.url);
    if (peticion.method !== "GET" || direccion.origin !== self.location.origin) return;
    // La página de pruebas no es parte de la app: siempre se pide a internet, sin guardarla.
    if (direccion.pathname.includes("/pruebas/")) return;

    // Descargar la versión nueva (si hay internet) y guardarla para la próxima vez.
    // cache: "no-cache" = preguntarle a GitHub si cambió, aunque el navegador tenga una copia.
    const desdeInternet = fetch(peticion.url, { cache: "no-cache" }).then(async (respuesta) => {
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
