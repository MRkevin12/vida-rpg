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

const VERSION = "vida-rpg-v169";
const CACHE_VOCES = "locutor-vida-rpg";   // (v128) las voces grabadas de la carrera: tampoco se borran al actualizar
const CACHE_MUSICA = "musica-vida-rpg";   // no empieza con "vida-rpg-v": al actualizar no se borra

const ARCHIVOS = [
    "./",
    "./index.html",
    "./estilos.css",
    "./estilos-pixel.css",
    "./manifest.json",
    "./js/app.js",   // (v134) junta los app-*.js de abajo
    "./js/app-running.js",
    "./js/app-gym.js",
    "./js/app-pin.js",
    "./js/app-torre.js",
    "./js/app-historias.js",
    "./js/app-efectos.js",
    "./js/app-dialogos.js",
    "./js/app-gestos.js",
    "./js/app-maestro.js",
    "./js/app-diario.js",
    "./js/app-version.js",
    "./js/app-botones.js",
    "./js/app-formularios.js",
    "./js/app-finanzas.js",   // (v135) finanzas
    "./js/finanzas.js",
    "./js/memento.js",   // (v142) memento mori
    "./js/hallazgos.js",   // (v148) cofres y fogatas del camino
    "./js/vistas-memento.js",
    "./js/app-memento.js",
    "./js/vistas-finanzas.js",
    "./js/acciones.js",
    "./js/arcade.js",
    "./js/avisos.js",
    "./js/avatar.js",
    "./js/campana.js",
    "./js/datos.js",
    "./js/desafios.js",
    "./js/retos.js",
    "./js/cinematicas.js",
    "./js/cine.js",
    "./js/cinematicas-reino.js",
    "./js/voces.js",
    "./js/voces-datos.js",
    "./js/voces-valle-2.js",
    "./js/vistas-voces.js",
    "./js/gym.js",
    "./js/ataques.js",
    "./js/fragua.js",
    "./js/vistas-gym.js",
    "./js/running.js",
    "./js/ruta.js",
    "./js/encuentros.js",
    "./js/frases.js",
    "./js/locutor.js",
    "./js/dibujo-carrera.js",
    "./js/dibujo-carrera-piezas.js",
    "./js/dibujo-pista.js",
    "./js/vistas-running.js",
    "./js/vistas-pelea-mapa.js",   // (v146) la pelea sobre el mapa de la carrera
    "./js/diario.js",
    "./js/dibujo.js",
    "./js/dibujo-gym.js",
    "./js/gym-aurelio.js",
    "./js/dibujo-ejercicios.js",
    "./js/dibujo-base.js",
    "./js/dibujo-cuerpo.js",
    "./js/dibujo-escenas.js",
    "./js/dibujo-mascota.js",
    "./js/dibujo-objetos.js",
    "./js/dibujo-ropa.js",
    "./js/fechas.js",
    "./js/juego.js",
    "./js/eventos.js",
    "./js/rituales.js",
    "./js/cofre.js",
    "./js/mapa.js",
    "./js/mascota.js",
    "./js/maestro.js",
    "./js/memorias.js",
    "./js/pergamino.js",
    "./js/pergaminos.js",
    "./js/libro-casio.js",
    "./js/libros.js",
    "./js/libro-orrin.js",
    "./js/mazmorras.js",
    "./js/saga.js",
    "./js/libro.js",
    "./js/minijuegos.js",
    "./js/novedades.js",
    "./js/pacto.js",
    "./js/nube.js",
    "./js/pinturas.js",
    "./js/plantillas.js",
    "./js/resumen.js",
    "./js/temporadas.js",
    "./js/secretos.js",
    "./js/vistas-temporada.js",
    "./js/seguridad.js",
    "./js/sonido.js",
    "./js/musica.js",
    "./js/equipo.js",
    "./js/torre.js",
    "./js/bestiario.js",
    "./js/leyendas.js",
    "./js/dibujo-monstruos.js",
    "./js/pixel.js",
    "./js/sprites.js",
    "./js/habilidades.js",
    "./js/cronica.js",
    "./js/dibujo-mapa.js",
    "./js/vida.js",
    "./js/vistas.js",   // (v133) reúne los vistas-*.js de abajo
    "./js/vistas-comun.js",
    "./js/vistas-hoy.js",
    "./js/vistas-diario.js",
    "./js/vistas-progreso.js",
    "./js/vistas-aventuras.js",
    "./js/vistas-mapa.js",
    "./js/vistas-historia.js",
    "./js/vistas-arcade.js",
    "./js/vistas-torre.js",
    "./js/vistas-enfoque.js",
    "./js/vistas-ajustes.js",
    "./js/vistas-inicio.js",
    "./js/vistas-heroe.js",
    "./js/vistas-tienda.js",
    "./js/iconos.js",
    "./js/retratos.js",
    "./js/efectos.js",
    "./js/pixel-pintura.js",
    "./js/insignias.js",
    "./js/dibujo-insignias.js",
    "./fuentes/orbitron-700.woff2",
    "./fuentes/orbitron-800.woff2",
    "./fuentes/dotgothic16.woff2",
    "./iconos/apple-touch-icon.png",
    "./iconos/icono-192.png",
    "./iconos/icono-512.png",
    "./iconos/icono-maskable-512.png",
    // Pinturas de los fondos y escenarios (dominio público)
    "./fondos/aldea.jpg",
    "./fondos/camino.jpg",
    "./fondos/fortaleza.jpg",
    "./fondos/cumbre.jpg",
    "./fondos/bosque.jpg",
    "./fondos/castillo.jpg",
    "./fondos/galaxia.jpg",
    "./fondos/salon.jpg",
    "./fondos/escena-fuerza.jpg",
    "./fondos/escena-intelecto.jpg",
    "./fondos/escena-carisma.jpg",
    "./fondos/escena-riqueza.jpg",
    "./fondos/torre.jpg",
    "./fondos/mar.jpg",
    "./fondos/aurora.jpg",
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

// Activación: borrar copias de versiones viejas (solo las "vida-rpg-v…":
// la caché "avisos-datos" es de las notificaciones y no se toca).
self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nombres) => Promise.all(
                nombres.filter((nombre) => nombre.startsWith("vida-rpg-v") && nombre !== VERSION)
                    .map((nombre) => caches.delete(nombre))
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

    // La música de fondo: archivos grandes que no cambian. Se bajan la primera vez que suenan
    // y se guardan en una caché aparte (CACHE_MUSICA), que no se borra al actualizar la app.
    if (direccion.pathname.includes("/musica/")) {
        evento.respondWith(caches.open(CACHE_MUSICA).then(async (cache) => {
            const guardada = await cache.match(peticion, { ignoreSearch: true });
            if (guardada) return guardada;
            const respuesta = await fetch(peticion);
            if (respuesta.ok) await cache.put(peticion, respuesta.clone());
            return respuesta;
        }));
        return;
    }

    // (v128) Las voces grabadas: audios cortos que no cambian. Se guardan la primera vez que se piden (o al «Descargar la voz»).
    if (direccion.pathname.includes("/locutor/")) {
        evento.respondWith(caches.open(CACHE_VOCES).then(async (cache) => {
            const guardada = await cache.match(peticion, { ignoreSearch: true });
            if (guardada) return guardada;
            const respuesta = await fetch(peticion);
            if (respuesta.ok) await cache.put(peticion, respuesta.clone());
            return respuesta;
        }));
        return;
    }

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


// ===== Notificaciones =====
// El servidor de avisos (servidor/worker.js) solo dice de qué tipo es el aviso.
// El texto lo preparó la app en la caché "avisos-datos" (ver js/avisos.js),
// así tus misiones nunca salen del teléfono.

self.addEventListener("push", (evento) => {
    let datos = {};
    try {
        datos = evento.data ? evento.data.json() : {};
    } catch { /* aviso sin datos: se muestra el texto general */ }
    // El iPhone exige mostrar SIEMPRE una notificación por cada aviso que llega: si alguna
    // vez no se muestra nada, al tercer aviso "mudo" el iPhone corta las notificaciones.
    // Por eso, si algo falla al armar el texto, igual se muestra un aviso general.
    evento.waitUntil(
        armarAviso(datos.tipo, datos.id)
            .catch(() => ({ titulo: "⚔️ Vida RPG", cuerpo: "Tus misiones de hoy te esperan.", etiqueta: `aviso-${Date.now()}` }))
            .then((aviso) => mostrar(aviso, datos.tipo, datos.id))
            .catch(() => self.registration.showNotification("⚔️ Vida RPG", { body: "Tus misiones de hoy te esperan." }))
    );
});

// Muestra la notificación. Cada aviso lleva una etiqueta NUEVA: si llevara la misma que uno que
// sigue en el centro de notificaciones, el iPhone lo reemplazaría en silencio (sin sonar).
// Antes se cierran los viejos del mismo tipo, para que no se amontonen.
async function mostrar({ titulo, cuerpo, etiqueta }, tipo, id) {
    try {
        for (const vieja of await self.registration.getNotifications()) {
            if (vieja.data?.tipo === (tipo || "recordatorio") && (tipo !== "mision" || vieja.data?.id === id)) vieja.close();
        }
    } catch { /* si no se puede, se quedan: no pasa nada */ }
    await self.registration.showNotification(titulo, {
        body: cuerpo,
        icon: "./iconos/icono-192.png",
        badge: "./iconos/icono-192.png",
        tag: etiqueta,
        renotify: true,     // aunque la etiqueta se repitiera, que vuelva a sonar
        silent: false,      // con sonido (el del iPhone: la web no puede elegir otro)
        data: { tipo: tipo || "recordatorio", id: id ?? null },
    });
    // Si la app está abierta, que suene su toque propio («el cuerno»: ver js/sonido.js).
    // (Si esto falla no importa: el aviso ya se mostró, y no hay que mostrarlo dos veces.)
    try {
        for (const ventana of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) {
            ventana.postMessage({ tipo: "aviso-recibido" });
        }
    } catch { /* sin ventanas abiertas */ }
}

// El texto de cada aviso: { titulo, cuerpo, etiqueta }.
async function armarAviso(tipo, id) {
    const ahora = new Date();
    const hoy = fechaDeHoy(ahora);
    const minuto = `${String(ahora.getHours()).padStart(2, "0")}${String(ahora.getMinutes()).padStart(2, "0")}`;
    let titulo = "⚔️ Vida RPG";
    let cuerpo = "Tus misiones de hoy te esperan.";
    if (tipo === "mision") {
        // El aviso propio de una misión: su texto está en el resumen del día.
        const resumen = await leerResumen();
        const texto = resumen && resumen.dias[fechaDeHoy(ahora)]?.porMision?.[id];
        if (texto) {
            titulo = texto.titulo;
            cuerpo = texto.cuerpo;
        } else if (resumen?.nombres?.[id]) {
            // La marcaste sin internet y el servidor no se enteró: igual hay que mostrar algo.
            titulo = `✅ ${resumen.nombres[id]}`;
            cuerpo = "Ya la hiciste hoy. ¡Bien hecho!";
        }
        return { titulo, cuerpo, etiqueta: `mision-${id}-${hoy}-${minuto}` };
    }

    if (tipo === "prueba") {
        titulo = "🔔 ¡Notificaciones activadas!";
        cuerpo = "Así te avisará Vida RPG a las horas que elegiste.";
    } else if (tipo === "descanso") {
        titulo = "🏋️ ¡Descanso terminado!";
        cuerpo = "Toca tu siguiente serie. Aurelio te espera.";
    } else if (tipo === "enfoque") {
        titulo = "⏱️ ¡Sesión de enfoque terminada!";
        cuerpo = "Buen trabajo. Abre la app para recibir tu premio.";
    } else {
        // Recordatorio: el texto de hoy, del resumen que dejó la app.
        const resumen = await leerResumen();
        const dia = resumen && resumen.dias[fechaDeHoy(ahora)];
        if (dia) {
            titulo = dia.titulo;
            cuerpo = ahora.getHours() >= 19 ? dia.cuerpoNoche : dia.cuerpo;
            // El numerito sobre el ícono: lo que te falta hoy.
            if (self.navigator.setAppBadge) {
                await (dia.insignia ? self.navigator.setAppBadge(dia.insignia) : self.navigator.clearAppBadge()).catch(() => {});
            }
        }
    }
    return { titulo, cuerpo, etiqueta: `${tipo || "recordatorio"}-${hoy}-${minuto}` };
}

// El resumen que la app deja en la caché (ver js/avisos.js), o null si no hay.
// El resumen que dejó la app (o null si no hay, o si está dañado).
async function leerResumen() {
    try {
        const guardado = await caches.match("./avisos-resumen.json");
        return guardado ? await guardado.json() : null;
    } catch {
        return null;
    }
}

// "AAAA-MM-DD" en hora local (como js/fechas.js).
function fechaDeHoy(fecha) {
    const dos = (n) => String(n).padStart(2, "0");
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// Tocar la notificación abre la app (o la trae al frente si ya estaba abierta).
self.addEventListener("notificationclick", (evento) => {
    evento.notification.close();
    evento.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) =>
            ventanas.length ? ventanas[0].focus() : self.clients.openWindow("./"))
    );
});
