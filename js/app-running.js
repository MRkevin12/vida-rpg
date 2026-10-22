// app-running.js — El running: el GPS, la notificación de la carrera, las voces y sus botones (run-…).
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as datos from "./datos.js";
import * as acciones from "./acciones.js";
import * as vistas from "./vistas.js";
import * as vistasRunning from "./vistas-running.js";   // (v139) la batalla de la pantalla dividida
import * as peleaMapa from "./vistas-pelea-mapa.js";   // (v146) la pelea sobre el mapa
import * as sprites from "./sprites.js";
import * as running from "./running.js";
import * as encuentros from "./encuentros.js";   // (v119) criaturas en tus carreras
import * as frases from "./frases.js";   // (v128) lo que dice la voz de la carrera
import * as locutor from "./locutor.js";   // (v128) las voces grabadas
import { hoy, sumarDias } from "./fechas.js";
import { estado, pantallaActual, subvista, $, avatarActual, ejecutar, dibujarPantalla } from "./app.js";
import { sonar, ponerMusica, avisar } from "./app-efectos.js";
import { registroSW } from "./app-version.js";

// ===== Lo que recuerda la pantalla del running =====
export let runTipo = "suave";           // (v109) el tipo de carrera que vas a empezar en la pestaña Running
export let runPista = false;            // (v131) ¿vas a correr en una pista de atletismo?
let vueltaVista = 0;                    // (v131) la última vuelta avisada en pista
let seguimientoGps = null;              // (v109) el id del seguimiento de posición del GPS mientras corres, o null
export let gpsProblema = null;          // (v109) por qué no hay GPS: "permiso" o "senal", o null
let pantallaDeDespierta = null;         // (v109) el «wake lock»: la pantalla no se apaga mientras corres
export let runTerminando = false;       // (v129) en la carrera en vivo: tocaste «Ya terminé» y se ve el formulario de guardar
let pausoParaTerminar = false;          // y la carrera estaba corriendo: la pausamos nosotros (si te arrepientes, se reanuda)

// (v118) Tu héroe en el mapa de la carrera: el dibujo se pixela una sola vez y se reutiliza cada vez que el mapa se redibuja.
let heroeDeCarrera = null;

export async function ponerHeroeEnMapaVivo() {
    const nuevo = !heroeDeCarrera;
    if (nuevo) heroeDeCarrera = await sprites.spriteDeHeroeEnMapa(avatarActual());
    spritesBatalla.heroeMapa = heroeDeCarrera;   // (v146) con criaturas, tu héroe va en la capa de la pelea
    for (const img of document.querySelectorAll(".run-mapa-heroe")) img.src = heroeDeCarrera;
    if (nuevo) ponerPeleaEnMapa();               // recién llegó la imagen: que se vea ya, sin esperar al próximo segundo
}

// (v120) La notificación de tu carrera: con la app en segundo plano, el centro de notificaciones muestra tu tiempo, km, ritmo y la pelea
// del km, y se va actualizando (misma etiqueta = se reemplaza sin sonar). IMPORTANTE: iOS congela una web cuando se bloquea la pantalla
// o se abre otra app, así que se actualiza mientras la app siga «despierta» (unos segundos o minutos) y se queda con lo último.
// Una notificación que cambia sola con el teléfono bloqueado (como las de Nike o Strava) solo la pueden hacer las apps nativas.
let ultimaNotificacionCarrera = 0;

function textoNotificacionCarrera(en) {
    const ahora = Date.now();
    const tiempo = running.textoTiempo(running.tiempoDeEncurso(en, ahora));
    if (!en.gps) return { titulo: `🏃 ${tiempo}${en.pausadoDesde ? "  ⏸ en pausa" : ""}`, cuerpo: "⏱ Cronómetro en marcha" };
    // Una barrita de 10 cuadritos: ▰▰▰▱▱▱▱▱▱▱
    const barra = (parte) => "▰".repeat(Math.round(Math.min(1, Math.max(0, parte)) * 10)) + "▱".repeat(10 - Math.round(Math.min(1, Math.max(0, parte)) * 10));
    const km = en.distancia / 1000;
    const lineas = [`⚡ ${running.textoRitmo(running.ritmoActual(en, ahora))}${en.objetivo ? `   🎯 ${running.textoSegundos(en.objetivo)} /km` : ""}`];
    const pelea = en.encuentros?.find((e) => !e.resultado);
    if (pelea) {
        const marcas = en.marcas || [];
        const va = encuentros.comoVa(pelea, (running.tiempoDeEncurso(en, ahora) - (marcas.at(-1) || 0)) / 1000, en.distancia - marcas.length * 1000, en.objetivo);
        const estadoPelea = { bien: "✅", justo: "⚖️", lento: "🐢" }[va.vas];
        lineas.push(`${pelea.jefe ? "👑" : "⚔️"} ${encuentros.nombreDe(pelea)}  ${estadoPelea}`);
        lineas.push(`❤️ ${barra(va.vida)}  ·  km ${pelea.km}`);
    }
    return { titulo: `🏃 ${tiempo}   📍 ${running.textoKm(km)}${en.pausadoDesde ? "   ⏸" : ""}`, cuerpo: lineas.join("\n") };
}

let mostrandoNotificacion = false;   // evita que dos llamadas seguidas creen dos notificaciones

export async function mostrarNotificacionCarrera({ sonando = false } = {}) {
    const en = estado.running?.encurso;
    if (!en || !registroSW || !("Notification" in window) || Notification.permission !== "granted") return;
    // Con la app a la vista no hace falta: se cierra la de antes.
    if (document.visibilityState === "visible" && !sonando) return cerrarNotificacionCarrera();
    if (mostrandoNotificacion || (!sonando && Date.now() - ultimaNotificacionCarrera < 30000)) return;
    mostrandoNotificacion = true;
    ultimaNotificacionCarrera = Date.now();
    const { titulo, cuerpo } = textoNotificacionCarrera(en);
    try {
        // UNA sola notificación: antes de mostrar la nueva se cierra cualquiera que siga puesta (el iPhone a veces no reemplaza por la etiqueta).
        await cerrarNotificacionCarrera();
        await registroSW.showNotification(titulo, {
            body: cuerpo, icon: "./iconos/icono-192.png", badge: "./iconos/icono-192.png",
            tag: "carrera", renotify: false, silent: true, data: { tipo: "carrera", id: null },
        });
    } catch (error) { /* sin permiso o sin soporte: la carrera sigue igual */ }
    mostrandoNotificacion = false;
}

async function cerrarNotificacionCarrera() {
    try {
        for (const n of (await registroSW?.getNotifications()) || []) if (n.data?.tipo === "carrera" || n.tag === "carrera") n.close();
    } catch (error) { /* nada que cerrar */ }
}

// (v119) Las imágenes de la pelea del km. (v139) Las de la batalla: tu héroe, la criatura y la sala de su zona.
// (v146) Y las del mapa: tu héroe y la criatura en pequeño (heroeMapa, mapa). Cada una se pixela UNA vez y queda guardada
// aquí; la pelea las usa al dibujarse. Cuando llega una nueva, cambia la firma y la pelea se vuelve a dibujar.
export const spritesBatalla = { heroe: null, criaturas: {}, salas: {}, heroeMapa: null, mapa: {} };
const pidiendo = new Set();   // las que se están pixelando (para no pedir dos veces la misma)

async function cargarSprite(clave, guardar, pedir) {
    if (pidiendo.has(clave)) return;
    pidiendo.add(clave);
    try { guardar(await pedir()); } catch (error) { /* sin imagen: la batalla se ve sin ese dibujo */ }
    pidiendo.delete(clave);
}

export function ponerCriaturasDeCarrera() {
    const en = estado.running.encurso;
    if (!en?.encuentros) return;
    // La criatura del km (y la siguiente, así ya está lista cuando aparezca) y la sala de cada una.
    const peleas = [vistasRunning.escenaDeBatalla(en).pelea, en.encuentros.find((e) => !e.resultado)].filter(Boolean);
    if (!spritesBatalla.heroe) cargarSprite("heroe", (src) => { spritesBatalla.heroe = src; }, () => sprites.spriteDeHeroe(avatarActual()));
    for (const pelea of peleas) {
        const zona = vistasRunning.zonaDeBatalla(pelea);
        if (!spritesBatalla.criaturas[pelea.id]) cargarSprite(`c-${pelea.id}`, (src) => { spritesBatalla.criaturas[pelea.id] = src; }, () => sprites.spriteDeMonstruo(pelea.id, avatarActual()));
        if (!spritesBatalla.salas[zona]) cargarSprite(`s-${zona}`, (src) => { spritesBatalla.salas[zona] = src; }, () => sprites.spriteDeSala(zona));
        // (v146) La criatura en pequeño, para el mapa. Apenas llega, se pone (sin esperar al próximo segundo).
        if (!spritesBatalla.mapa[pelea.id]) {
            cargarSprite(`m-${pelea.id}`, (src) => { spritesBatalla.mapa[pelea.id] = src; ponerPeleaEnMapa(); },
                () => sprites.spriteDeMonstruoEnMapa(pelea.id, peleaMapa.ladoEnMapa(pelea.id, pelea.jefe)));
        }
    }
}

// ===== (v146) La pelea sobre el mapa =====
// Tu héroe, la criatura del km, sus vidas y los poderes van en una capa encima del mapa (vistas-pelea-mapa.js); en el
// golpe final, la escena grande de la Torre la tapa unos segundos. Se llama cada segundo (tictac en app.js) y cada vez que
// se dibuja la pantalla. El contenido de cada capa se escribe solo cuando cambia su firma (así cada animación se ve una
// vez); el resto del tiempo solo se mueven las posiciones (las variables --hx, --hy, --cx, --cy del style de la capa).
let rumboSuave = null;       // hacia dónde corres, sin el temblor del GPS
let rumboDeCarrera = null;   // de qué carrera es ese rumbo (al empezar otra, se olvida)

export function ponerPeleaEnMapa(ahora = Date.now()) {
    const en = estado.running.encurso;
    const capa = document.querySelector("[data-run-pm]");
    if (!en?.encuentros || !capa) return;
    // 1) Lo que hay en cada capa: solo cuando pasa algo.
    const firma = peleaMapa.firmaDeLaCapa(en, ahora, spritesBatalla);
    if (capa.dataset.n !== firma) {
        capa.innerHTML = peleaMapa.htmlCapa(en, ahora, spritesBatalla);
        capa.dataset.n = firma;
    }
    const final = document.querySelector("[data-run-final]");
    const firmaFinal = peleaMapa.firmaDelFinal(en, ahora, spritesBatalla);
    if (final && final.dataset.n !== firmaFinal) {
        final.innerHTML = peleaMapa.htmlFinal(en, ahora, spritesBatalla);
        final.dataset.n = firmaFinal;
    }
    // 2) Dónde va cada uno. El mapa dejó escrito en su dibujo dónde estás y hacia dónde corres (data-aqui, data-rumbo).
    const dibujo = document.querySelector("[data-run-mapa] .run-mapa-svg");
    const aqui = peleaMapa.leerPar(dibujo?.dataset.aqui);
    if (rumboDeCarrera !== en.inicio) { rumboSuave = null; rumboDeCarrera = en.inicio; }
    rumboSuave = peleaMapa.mezclarRumbo(rumboSuave, peleaMapa.leerPar(dibujo?.dataset.rumbo));
    capa.classList.toggle("sin-lugar", !aqui);   // sin GPS todavía: no se ve
    if (!aqui) return;
    const caja = capa.parentElement;             // la caja del mapa (.run-mapa-vivo): cuánto mide en la pantalla
    const visible = peleaMapa.parteVisible(caja.clientWidth, caja.clientHeight, peleaMapa.MARGENES);
    const pelea = vistasRunning.escenaDeBatalla(en, ahora).pelea;
    const criatura = peleaMapa.lugarDeCriatura({
        aqui, rumbo: rumboSuave, visible,
        metros: en.distancia - (en.marcas || []).length * 1000,   // lo que llevas del km: se acerca a medida que avanzas
        lado: pelea ? peleaMapa.ladoEnMapa(pelea.id, pelea.jefe) : 26,
    });
    // (v147) Lo que vuela sale de tu héroe o, si quedó fuera de lo que se ve («Ver todo»), del borde de la vista.
    capa.setAttribute("style", peleaMapa.estiloDeLugar(aqui, criatura, peleaMapa.puntoDeTiro(aqui, criatura, visible)));
    // Las criaturas están dibujadas mirando a la derecha (en la Torre pelean desde la izquierda): si está a tu derecha,
    // se da vuelta para mirarte.
    capa.classList.toggle("mira-izq", criatura.x > aqui.x);
}

// (v117) Mientras corres, una barra pegada arriba de las pestañas muestra el tiempo, los km y el ritmo en TODAS las pantallas
// (menos en Running, que ya lo muestra grande). Tocarla te lleva a la carrera. Una página web no puede seguir mostrándose con
// el teléfono bloqueado o con otra app abierta: eso lo impide iOS. Por eso la pantalla se mantiene encendida mientras corres.
export function actualizarBarraRun() {
    const barra = $("#run-barra");
    if (!barra) return;
    const en = estado.running?.encurso;
    barra.hidden = !en || pantallaActual === "running";
    if (barra.hidden) return;
    const tiempo = running.tiempoDeEncurso(en, Date.now());
    barra.innerHTML = `<b>🏃 ${running.textoTiempo(tiempo)}</b>${en.gps ? `<span>${running.textoKm(en.distancia / 1000)}</span><span>${running.textoRitmo(running.ritmoActual(en, Date.now()))}</span>` : ""}${en.pausadoDesde ? "<span>⏸ en pausa</span>" : ""}`;
}

// El service worker guarda los archivos en el teléfono para que la app funcione sin internet.
// ===== El running: GPS y pantalla encendida (v109) =====
// El GPS del teléfono manda puntos mientras la app esté abierta. Cada punto suma metros a la carrera (ver running.js).
export function iniciarGps() {
    if (!navigator.geolocation || seguimientoGps !== null) return;
    seguimientoGps = navigator.geolocation.watchPosition((posicion) => {
        const { latitude, longitude, accuracy } = posicion.coords;
        const punto = { lat: latitude, lon: longitude, precision: accuracy, t: posicion.timestamp };
        gpsProblema = null;   // llegó una posición: la señal volvió (aunque estés en pausa)
        const avance = acciones.registrarPuntoCarrera(estado, punto);
        if (avance) {
            datos.guardar(estado);
            if (avance.kmNuevo) anunciarKilometro(avance.kmNuevo, avance.segundos, avance.resueltos, avance.nuevo);
            else avisarSiVasLento();
            if (avance.golpes?.length) sonarGolpes(avance.golpes);   // (v140)
            // (v131) En pista: aviso de cada vuelta.
            const en = estado.running.encurso;
            if (en?.pista) {
                const vueltas = running.vueltasDe(en.distancia, en.pista);
                if (vueltas > vueltaVista) { vueltaVista = vueltas; avisar(`🏟️ Vuelta ${vueltas} · ${running.textoKm(en.distancia / 1000)}`); }
            }
        }
    }, (error) => {
        // 1 = no nos dieron permiso (ya no se puede: se deja de escuchar).
        // 2 y 3 = señal perdida o tardía: es pasajero, así que el GPS sigue escuchando y se reanuda solo.
        if (error.code === 1) {
            gpsProblema = "permiso";
            detenerGps();
        } else {
            gpsProblema = "senal";
        }
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
}

// (v140) Cada poder de la batalla suena (y vibra, en los teléfonos que lo permiten; el iPhone no vibra desde una web).
const SONIDO_DE_GOLPE = { tajo: "tajo", rayo: "rayo", lento: "impacto", pausa: "fallo" };

function sonarGolpes(golpes) {
    const g = golpes.at(-1);
    sonar(g.combo ? "fuego" : SONIDO_DE_GOLPE[g.tipo] || "tajo");
    try { navigator.vibrate?.(g.tipo === "lento" ? [60, 40, 60] : 40); } catch (error) { /* sin vibración */ }
}

// (v116) Cada kilómetro: un sonido, un aviso en pantalla y, si está activada la voz, tu tiempo hablado.
function anunciarKilometro(numero, segundos, resueltos = [], nuevo = null) {
    // (v119) La pelea del km que terminó y la criatura que aparece. (v128) Con voz grabada o la del teléfono, y una frase de ánimo.
    const pelea = resueltos.at(-1);
    const fin = !pelea ? "" : pelea.resultado === "vencida" ? `¡Venciste a ${encuentros.nombreDe(pelea)}!` : `${encuentros.nombreDe(pelea)} escapó.`;
    if (pelea) sonar(pelea.resultado === "vencida" ? (pelea.jefe ? "victoria" : "completar") : "fallo");   // (v140) el golpe final
    avisar(`🏃 Km ${numero}: ${running.textoSegundos(segundos)}${fin ? ` · ${fin}` : ""}`);
    if (document.visibilityState === "hidden") mostrarNotificacionCarrera({ sonando: true });   // (v120) también fuera de la app
    hablar(frases.anuncioDeKm(numero, segundos, pelea, nuevo));
}

// (v128) A los 500 m de cada km, si vas lento para vencer a la criatura, un empujón (una sola vez por km).
function avisarSiVasLento() {
    const en = estado.running.encurso;
    const k = en?.kmActual;
    const pelea = en?.encuentros?.find((e) => !e.resultado);
    if (!k || !pelea || k.mitad === null || k.avisoLento) return;
    k.avisoLento = true;
    const marcas = en.marcas || [];
    const va = encuentros.comoVa(pelea, (running.tiempoDeEncurso(en, Date.now()) - (marcas.at(-1) || 0)) / 1000, en.distancia - marcas.length * 1000, en.objetivo);
    if (va.vas === "lento") hablar(frases.anuncioDeLento());
}

// (v128) Dice una lista de piezas (frases.js): con la voz grabada elegida si la hay y tiene todos los audios; si no, con la del teléfono.
// También deja la frase de ánimo a la vista en la tarjeta de la pelea.
export async function hablar(piezas, { forzar = false } = {}) {
    const frase = piezas.find((p) => p.k && p.k.startsWith("f-"));
    if (frase && estado.running.encurso) estado.running.encurso.frase = frase.t;
    if (!forzar && estado.running.avisoKm === false) return;
    const { claves, texto } = frases.resumirPiezas(piezas);
    const voz = estado.running.voz;
    if (locutor.esGrabada(voz) && claves && await locutor.decir(voz, claves)) return;
    decir(texto, { forzar: true });   // la voz del teléfono (o la de reserva si faltó un audio)
}

// (v119) La voz de la carrera (si está encendida en Running › Progreso y el sonido está activado).
function decir(texto, { forzar = false } = {}) {
    if (!forzar && estado.running.avisoKm === false) return;   // (v125) la voz solo depende de su interruptor, no del sonido del juego
    if (!("speechSynthesis" in window)) return;
    try {
        const voz = new SpeechSynthesisUtterance(texto.replace(/\s+/g, " ").trim());
        const elegida = vocesEnEspanol().find((v) => v.voiceURI === estado.running.voz);
        if (elegida) { voz.voice = elegida; voz.lang = elegida.lang; } else voz.lang = "es-ES";
        speechSynthesis.cancel();   // si aún hablaba la anterior, se calla
        speechSynthesis.speak(voz);
    } catch (error) { /* sin voz en este teléfono: queda el sonido */ }
}

// (v124) Las voces en español que tiene el teléfono, con su país: México y Colombia primero.
const PAISES_VOZ = { MX: "México", CO: "Colombia", ES: "España", US: "EE. UU.", AR: "Argentina", CL: "Chile", PE: "Perú", VE: "Venezuela", UY: "Uruguay", CR: "Costa Rica", "419": "Latinoamérica" };

function vocesEnEspanol() {
    if (!("speechSynthesis" in window)) return [];
    const orden = (v) => { const i = ["MX", "CO"].indexOf(v.lang.split(/[-_]/)[1]); return i === -1 ? 9 : i; };
    return speechSynthesis.getVoices().filter((v) => /^es([-_]|$)/i.test(v.lang)).sort((x, y) => orden(x) - orden(y) || x.name.localeCompare(y.name));
}

const nombreDeVoz = (v) => `${v.name} · ${PAISES_VOZ[v.lang.split(/[-_]/)[1]] || v.lang}`;   // v.name ya trae «(Mejorada)», «(Premium)»…

// Llena la lista de voces (se llama al dibujar Running y cuando el teléfono termina de cargarlas).
export function poblarVocesRunning() {
    const lista = document.querySelector("[data-running-voz]");
    if (!lista) return;
    const voces = vocesEnEspanol();
    const grabadas = Object.entries(locutor.VOCES).map(([clave, v]) => `<option value="${locutor.PREFIJO}${clave}">🎙️ ${v.nombre}</option>`).join("");
    lista.innerHTML = `<option value="">Automática (la del teléfono)</option>
        <optgroup label="Voces grabadas en la app (México)">${grabadas}</optgroup>
        ${voces.length ? `<optgroup label="Voces del teléfono">${voces.map((v) => `<option value="${v.voiceURI}">${nombreDeVoz(v)}</option>`).join("")}</optgroup>` : ""}`;
    lista.value = estado.running.voz || "";
    if (lista.value !== (estado.running.voz || "")) lista.value = "";
    const nota = document.querySelector("[data-run-voces-nota]");
    if (!nota) return;
    const paises = new Set(voces.map((v) => v.lang.split(/[-_]/)[1]));
    nota.textContent = !voces.length ? "Tu teléfono no mostró voces en español todavía; prueba otra vez en unos segundos."
        : `Voces disponibles: ${voces.length}.${paises.has("MX") ? "" : " Sin voz mexicana."}${paises.has("CO") ? "" : " Sin voz colombiana."}`
          + (paises.has("MX") && paises.has("CO") ? "" : " Para tener más: Ajustes del iPhone → Accesibilidad → Contenido hablado → Voces → Español, y descarga las de México o Colombia.");
}

if ("speechSynthesis" in window) speechSynthesis.addEventListener?.("voiceschanged", poblarVocesRunning);

// (v127) Diagnóstico: TODAS las voces que el teléfono le da a la app (de cualquier idioma), para saber si el iPhone oculta las que bajaste.
function verTodasLasVoces() {
    const esc = vistas.esc;
    const caja = document.querySelector("[data-run-voces-todas]");
    if (!caja) return;
    if (!("speechSynthesis" in window)) { caja.textContent = "Este navegador no tiene voces (speechSynthesis)."; return; }
    const pintar = () => {
        const todas = speechSynthesis.getVoices();
        const porIdioma = {};
        for (const v of todas) porIdioma[v.lang] = (porIdioma[v.lang] || 0) + 1;
        const resumen = Object.entries(porIdioma).sort((x, y) => y[1] - x[1]).map(([lang, n]) => `${lang}: ${n}`).join(" · ");
        const filas = [...todas].sort((x, y) => x.lang.localeCompare(y.lang) || x.name.localeCompare(y.name))
            .map((v) => `<li>${esc(v.name)} <small>${esc(v.lang)}${v.localService ? " · en el teléfono" : " · en línea"}${v.default ? " · predeterminada" : ""}</small></li>`).join("");
        caja.innerHTML = `<p class="mini"><b>${todas.length} voces</b> en total.${todas.length ? ` Por idioma → ${esc(resumen)}` : " La lista está vacía: el teléfono todavía no las entrega."}</p>
            <p class="mini texto-suave">${esc(navigator.userAgent.replace(/^Mozilla\/5\.0 /, ""))}</p>
            <ul class="run-voces-lista">${filas}</ul>`;
    };
    try { speechSynthesis.getVoices(); } catch (error) { /* sin voces */ }
    pintar();
    for (const espera of [500, 1500, 3000]) setTimeout(pintar, espera);   // llegan tarde
}

// (v128) Baja todos los audios de la voz grabada elegida para usarla sin internet (el service worker los guarda).
let descargandoVoz = false;

async function descargarVozGrabada() {
    const voz = estado.running.voz;
    if (!locutor.esGrabada(voz)) { avisar("🎙️ Elige primero una voz grabada en la lista"); return; }
    if (descargandoVoz) return;
    descargandoVoz = true;
    const nota = document.querySelector("[data-run-voces-nota]");
    try {
        const { total, faltaron } = await locutor.descargar(voz, (hechos, todos) => { if (nota) nota.textContent = `⬇ Descargando la voz… ${hechos} de ${todos}`; });
        avisar(faltaron ? `🎙️ Voz descargada, pero faltaron ${faltaron} audios de ${total}. Con internet, vuelve a intentarlo.` : "🎙️ Voz lista: ya funciona sin internet");
    } catch (error) {
        avisar("🎙️ No se pudo descargar la voz. Revisa tu internet.");
    }
    descargandoVoz = false;
    poblarVocesRunning();
}

// (v126) El iPhone entrega la lista de voces tarde y no siempre avisa cuando bajas una nueva: se vuelve a pedir varias veces.
function buscarVocesNuevas() {
    const antes = vocesEnEspanol().length;
    if ("speechSynthesis" in window) { try { speechSynthesis.getVoices(); } catch (error) { /* sin voces */ } }
    for (const espera of [0, 400, 1200, 3000]) setTimeout(poblarVocesRunning, espera);
    setTimeout(() => {
        const ahora = vocesEnEspanol().length;
        avisar(ahora > antes ? `🗣️ ${ahora - antes} voz nueva${ahora - antes === 1 ? "" : "s"} encontrada${ahora - antes === 1 ? "" : "s"}` : `🗣️ ${ahora} voces en español. Si acabas de bajar una y no sale, cierra la app del todo y ábrela otra vez.`);
    }, 3200);
}

function detenerGps() {
    if (seguimientoGps !== null) navigator.geolocation?.clearWatch(seguimientoGps);
    seguimientoGps = null;
}

// La pantalla no se apaga mientras corres (si el teléfono lo permite). Al volver a la app, se pide de nuevo.
export async function mantenerPantallaDespierta(encendida) {
    try {
        if (encendida && !pantallaDeDespierta) pantallaDeDespierta = await navigator.wakeLock?.request("screen");
        else if (!encendida && pantallaDeDespierta) { await pantallaDeDespierta.release(); pantallaDeDespierta = null; }
    } catch (error) {
        pantallaDeDespierta = null;   // sin permiso o sin soporte: la carrera sigue igual
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && pantallaActual === "running") setTimeout(poblarVocesRunning, 300);   // (v126) volviste de bajar voces
    if (document.visibilityState === "visible" && estado.running?.encurso) mantenerPantallaDespierta(true);
    // (v120) Al salir de la app con una carrera en curso, la notificación aparece al instante.
    if (document.visibilityState === "hidden" && estado.running?.encurso) { ultimaNotificacionCarrera = 0; mostrarNotificacionCarrera(); }
});

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_RUNNING = {
    // El running (v109). Ver running.js, vistas-running.js y el final de acciones.js.
    "run-lugar": (boton) => {   // (v131) calle o pista
        runPista = boton.dataset.lugar === "pista";
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    "run-vista-mapa": () => ejecutar(() => acciones.cambiarVistaMapa(estado, estado.running.vistaMapa === "todo" ? "seguir" : "todo"), { mantenerScroll: true }),
    "run-km-zona": (boton) => ejecutar(() => acciones.cambiarKmPorZona(estado, (estado.running.kmPorZona || 2) + Number(boton.dataset.delta)), { mantenerScroll: true }),
    "run-autopausa": () => ejecutar(() => acciones.cambiarAutopausa(estado, estado.running.autopausa === false), { mantenerScroll: true }),
    "run-tipo": (boton) => {
        runTipo = boton.dataset.tipo;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    "run-empezar": (boton) => {
        const gps = boton.dataset.gps === "1";
        const objetivo = $("#run-objetivo")?.value || "";
        const empezada = ejecutar(() => acciones.empezarCarrera(estado, runTipo, { gps, objetivo, pista: gps && runPista }), { mantenerScroll: true });
        if (!empezada) return;
        runTerminando = false;
        pausoParaTerminar = false;
        vueltaVista = 0;
        const primera = estado.running.encurso?.encuentros?.[0];
        locutor.despertar();   // el audio solo arranca tras un toque
        hablar(frases.anuncioDeInicio(primera));
        gpsProblema = null;
        if (gps) iniciarGps();
        mantenerPantallaDespierta(true);
        ponerMusica();   // (v125) empieza la carrera: se calla la música del juego
    },
    "run-pausa": () => {
        ejecutar(() => acciones.alternarPausaCarrera(estado), { mantenerScroll: true });
        sonar(estado.running.encurso?.pausadoDesde ? "fallo" : "cursor");
    },
    "run-cancelar": () => {
        if (!confirm("¿Cancelar la carrera? Se pierde lo que corriste y no da premio.")) return;
        ejecutar(() => acciones.cancelarCarrera(estado));
        runTerminando = false;
        pausoParaTerminar = false;
        cerrarNotificacionCarrera();
        detenerGps();
        mantenerPantallaDespierta(false);
        ponerMusica();   // (v125) se acabó la carrera: vuelve la música del juego
    },
    "run-meta": (boton) => ejecutar(() => acciones.cambiarMetaKm(estado, estado.running.metaKm + Number(boton.dataset.delta)), { mantenerScroll: true }),
    "run-buscar-voces": () => buscarVocesNuevas(),
    "run-ver-voces": () => verTodasLasVoces(),
    "run-probar-voz": () => { locutor.despertar(); hablar(frases.anuncioDePrueba(), { forzar: true }); },
    "run-descargar-voz": () => descargarVozGrabada(),
    "run-terminar-abrir": () => {   // (v129) «Ya terminé»: se detiene el reloj y aparece el formulario
        if (!estado.running.encurso) return;
        if (!estado.running.encurso.pausadoDesde) {
            ejecutar(() => acciones.alternarPausaCarrera(estado, Date.now(), { contar: false }), { mantenerScroll: true });
            pausoParaTerminar = true;
        }
        runTerminando = true;
        dibujarPantalla();
        window.scrollTo(0, 0);
    },
    "run-terminar-cerrar": () => {   // «Todavía no»: vuelve a correr
        if (pausoParaTerminar && estado.running.encurso?.pausadoDesde) ejecutar(() => acciones.alternarPausaCarrera(estado, Date.now(), { contar: false }), { mantenerScroll: true });
        pausoParaTerminar = false;
        runTerminando = false;
        dibujarPantalla();
    },
    "run-concentracion": () => ejecutar(() => acciones.cambiarConcentracion(estado, estado.running.concentracion === false), { mantenerScroll: true }),
    "run-aviso-km": () => ejecutar(() => acciones.cambiarAvisoKm(estado, estado.running.avisoKm === false), { mantenerScroll: true }),
    "run-borrar": (boton) => {
        if (!confirm("¿Borrar esta carrera? Se le quita el XP y las monedas que dio.")) return;
        ejecutar(() => acciones.borrarCarrera(estado, Number(boton.dataset.indice)), { mantenerScroll: true });
    },
};


// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
export const FORMULARIOS_RUNNING = {
    // El running (v109): anotar una carrera que ya hiciste, o terminar la que llevas en vivo.
    "running-manual"(valores, formulario) {
        const fecha = valores.fecha === "ayer" ? sumarDias(hoy(), -1) : hoy();
        const ok = ejecutar(() => acciones.guardarCarrera(estado, { ...valores, fecha }), { mantenerScroll: true });
        if (ok) { formulario.reset(); sonar("completar"); }
        return ok;
    },
    "running-terminar"(valores) {
        const fin = ejecutar(() => acciones.terminarCarrera(estado, valores));
        if (!fin) return false;
        runTerminando = false;
        pausoParaTerminar = false;
        cerrarNotificacionCarrera();
        detenerGps();
        mantenerPantallaDespierta(false);
        ponerMusica();   // (v125) se acabó la carrera
        hablar(frases.anuncioFinal());
        subvista.running = "correr";
        sonar("completar");
        dibujarPantalla();
        window.scrollTo(0, 0);
        return true;
    },
};
