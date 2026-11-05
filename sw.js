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

const VERSION = "vida-rpg-v196";
const CACHE_VOCES = "locutor-vida-rpg";   // (v128) las voces grabadas de la carrera: tampoco se borran al actualizar
const CACHE_MUSICA = "musica-vida-rpg";   // no empieza con "vida-rpg-v": al actualizar no se borra
// (v193) El lector de fotos (Tesseract, ~6 MB): caché aparte que NO se borra al actualizar, para no volver a
// bajar 6 MB en cada versión. Se descarga al instalar, así funciona sin internet. Si cambias algo en ocr/,
// cambia este nombre (ocr-vida-rpg-1 → -2) y borra el viejo abajo, en "activate".
const CACHE_OCR = "ocr-vida-rpg-1";
const ARCHIVOS_OCR = [
    "./ocr/tesseract.esm.min.js",
    "./ocr/worker.min.js",
    "./ocr/tesseract-core-simd-lstm.wasm.js",
    "./ocr/spa.traineddata.gz",
];

const ARCHIVOS = [
    "./",
    "./index.html",
    "./css/01-base.css",
    "./css/02-pantallas.css",
    "./css/03-avatar-batalla.css",
    "./css/04-interfaz-v15.css",
    "./css/05-torre.css",
    "./css/06-vida-diario.css",
    "./css/07-orden-v27.css",
    "./css/08-mazmorra-historias.css",
    "./css/09-cine-voces.css",
    "./css/10-hoy-esencial.css",
    "./css/11-torre-batalla.css",
    "./css/12-gym.css",
    "./css/13-ataques.css",
    "./css/14-gym-foco.css",
    "./css/15-carga-reino.css",
    "./css/16-running.css",
    "./css/17-memento.css",
    "./css/18-finanzas.css",
    "./css/19-temporadas.css",
    "./css/20-senda.css",
    "./css/21-retrato.css",
    "./css/99-pixel.css",
    "./manifest.json",
    "./js/app.js",   // (v134) junta los app-*.js de abajo
    "./js/running/app-running.js",
    "./js/gym/app-gym.js",
    "./js/pantallas/app-pin.js",
    "./js/torre/app-torre.js",
    "./js/arcade/app-plataformas.js",   // (v185) La Senda del Reino
    "./js/historias/app-historias.js",
    "./js/pantallas/app-efectos.js",
    "./js/pantallas/app-dialogos.js",
    "./js/pantallas/app-gestos.js",
    "./js/pantallas/app-maestro.js",
    "./js/pantallas/app-diario.js",
    "./js/pantallas/app-foto.js",
    "./js/pantallas/app-version.js",
    "./js/pantallas/app-botones.js",
    "./js/pantallas/app-formularios.js",
    "./js/finanzas/app-finanzas.js",   // (v135) finanzas
    "./js/finanzas/finanzas.js",
    "./js/memento/memento.js",   // (v142) memento mori
    "./js/running/hallazgos.js",   // (v148) cofres y fogatas del camino
    "./js/memento/vistas-memento.js",
    "./js/memento/app-memento.js",
    "./js/finanzas/vistas-finanzas.js",
    "./js/acciones.js",
    "./js/acciones-comun.js",      // (v178) acciones.js dividido por área
    "./js/acciones-misiones.js",   // (orden) más partes de acciones.js
    "./js/acciones-aventuras.js",
    "./js/torre/acciones-torre.js",
    "./js/gym/acciones-gym.js",
    "./js/running/acciones-running.js",
    "./js/finanzas/acciones-finanzas.js",
    "./js/arcade/acciones-plataformas.js",
    "./js/arcade/arcade.js",
    "./js/avisos.js",
    "./js/avatar.js",
    "./js/campana.js",
    "./js/datos.js",
    "./js/desafios.js",
    "./js/arcade/retos.js",
    "./js/torre/cinematicas.js",
    "./js/torre/cine.js",
    "./js/historias/cinematicas-reino.js",
    "./js/voces/voces.js",
    "./js/voces/voces-datos.js",
    "./js/voces/voces-personas.js",
    "./js/voces/vistas-voces.js",
    "./js/gym/gym.js",
    "./js/torre/ataques.js",
    "./js/gym/fragua.js",
    "./js/gym/vistas-gym.js",
    "./js/gym/vistas-gym-tarjetas.js",   // (orden) tarjetas de progreso del gym
    "./js/gym/vistas-gym-dialogos.js",   // (orden) ventanas del gym
    "./js/running/running.js",
    "./js/running/ruta.js",
    "./js/running/encuentros.js",
    "./js/running/frases.js",
    "./js/running/locutor.js",
    "./js/running/dibujo-carrera.js",
    "./js/running/dibujo-carrera-piezas.js",
    "./js/running/dibujo-pista.js",
    "./js/running/vistas-running.js",
    "./js/running/vistas-pelea-mapa.js",   // (v146) la pelea sobre el mapa de la carrera
    "./js/diario.js",
    "./js/dibujo/dibujo.js",
    "./js/gym/dibujo-gym.js",
    "./js/gym/gym-aurelio.js",
    "./js/gym/dibujo-ejercicios.js",
    "./js/gym/dibujo-ejercicios-piezas.js",       // (orden) piezas del cuerpo, pesas y máquinas
    "./js/gym/dibujo-ejercicios-movimientos.js",  // (orden) los 64 movimientos
    "./js/dibujo/dibujo-base.js",
    "./js/dibujo/dibujo-cuerpo.js",
    "./js/dibujo/dibujo-escenas.js",
    "./js/dibujo/dibujo-mascota.js",
    "./js/dibujo/dibujo-objetos.js",
    "./js/dibujo/dibujo-ropa.js",
    "./js/fechas.js",
    "./js/foto.js",
    "./js/juego.js",
    "./js/eventos.js",
    "./js/rituales.js",
    "./js/cofre.js",
    "./js/mapa.js",
    "./js/mascota.js",
    "./js/maestro.js",
    "./js/historias/memorias.js",
    "./js/historias/pergamino.js",
    "./js/historias/pergaminos.js",
    "./js/historias/libro-casio.js",
    "./js/historias/libros.js",
    "./js/historias/libro-orrin.js",
    "./js/torre/mazmorras.js",
    "./js/historias/saga.js",
    "./js/historias/libro.js",
    "./js/arcade/minijuegos.js",
    "./js/dibujo/dibujo-retrato-fondos.js",   // (v189) fondos del retrato
    "./js/arcade/plataformas.js",          // (v185) La Senda del Reino: reglas, niveles, motor y dibujo
    "./js/arcade/plataformas-niveles.js",
    "./js/arcade/plataformas-motor.js",
    "./js/arcade/dibujo-plataformas.js",
    "./js/arcade/dibujo-plataformas-escena.js",   // (v187) fondos, ambiente y luz de la Senda
    "./js/novedades.js",
    "./js/pacto.js",
    "./js/nube.js",
    "./js/dibujo/pinturas.js",
    "./js/plantillas.js",
    "./js/gym/rutinas-plantillas.js",
    "./js/resumen.js",
    "./js/temporadas.js",
    "./js/secretos.js",
    "./js/pantallas/vistas-temporada.js",
    "./js/anual.js",
    "./js/pantallas/vistas-anual.js",
    "./js/seguridad.js",
    "./js/sonido.js",
    "./js/musica.js",
    "./js/equipo.js",
    "./js/torre/torre.js",
    "./js/torre/torre-reglas.js",   // (orden) las reglas fijas de la Torre
    "./js/torre/bestiario.js",
    "./js/torre/leyendas.js",
    "./js/torre/dibujo-monstruos.js",
    "./js/torre/dibujo-salas.js",   // (orden) las salas, separadas de dibujo-monstruos.js
    "./js/dibujo/pixel.js",
    "./js/dibujo/sprites.js",
    "./js/torre/habilidades.js",
    "./js/historias/cronica.js",
    "./js/dibujo/dibujo-mapa.js",
    "./js/vida.js",
    "./js/pantallas/vistas.js",   // (v133) reúne los vistas-*.js de abajo
    "./js/pantallas/vistas-comun.js",
    "./js/pantallas/vistas-hoy.js",
    "./js/pantallas/vistas-diario.js",
    "./js/pantallas/vistas-progreso.js",
    "./js/pantallas/vistas-aventuras.js",
    "./js/pantallas/vistas-mapa.js",
    "./js/historias/vistas-historia.js",
    "./js/arcade/vistas-arcade.js",
    "./js/arcade/vistas-plataformas.js",
    "./js/torre/vistas-torre.js",
    "./js/pantallas/vistas-enfoque.js",
    "./js/pantallas/vistas-ajustes.js",
    "./js/pantallas/vistas-inicio.js",
    "./js/pantallas/vistas-heroe.js",
    "./js/pantallas/vistas-tienda.js",
    "./js/dibujo/iconos.js",
    "./js/dibujo/retratos.js",
    "./js/efectos.js",
    "./js/dibujo/pixel-pintura.js",
    "./js/insignias.js",
    "./js/dibujo/dibujo-insignias.js",
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
    evento.waitUntil(Promise.all([
        caches.open(VERSION).then((cache) =>
            cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: "reload" })))),
        // (v193) El lector de fotos: solo baja lo que falte. Si falla (poca señal), no impide instalar
        // la app: se vuelve a intentar en la próxima versión o la primera vez que tomes una foto.
        caches.open(CACHE_OCR).then((cache) => Promise.all(ARCHIVOS_OCR.map(async (url) => {
            if (!(await cache.match(url))) await cache.add(new Request(url, { cache: "reload" }));
        }))).catch(() => {}),
    ]));
    self.skipWaiting(); // activarse sin esperar a que se cierre la app
});

// Activación: borrar copias de versiones viejas (solo las "vida-rpg-v…":
// la caché "avisos-datos" es de las notificaciones y no se toca).
self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nombres) => Promise.all(
                nombres.filter((nombre) => (nombre.startsWith("vida-rpg-v") && nombre !== VERSION) ||
                                           (nombre.startsWith("ocr-vida-rpg") && nombre !== CACHE_OCR))
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

    // (v193) El lector de fotos: primero la copia guardada; si no está, se baja y se guarda.
    if (direccion.pathname.includes("/ocr/")) {
        evento.respondWith(caches.open(CACHE_OCR).then(async (cache) => {
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
    // (v191) iOS no siempre respeta los saltos de línea del aviso: se cortan a medias o se ven como bloques raros.
    // Por eso el texto se junta en una sola línea, con « · » entre lo que va en cada renglón, y se acorta si es muy largo.
    const unaLinea = String(cuerpo || "").split("\n").map((l) => l.trim()).filter(Boolean).join(" · ");
    const textoCorto = unaLinea.length > 150 ? `${unaLinea.slice(0, 147).trimEnd()}…` : unaLinea;
    await self.registration.showNotification(titulo, {
        body: textoCorto,
        timestamp: Date.now(),
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
