// app.js — El "director" de la app.
//
// 1. Carga la partida y muestra la pantalla correcta.
// 2. Escucha los toques en botones y los envíos de formularios.
// 3. Llama a la acción que corresponde (acciones.js), guarda (datos.js)
//    y vuelve a dibujar (vistas.js).
// 4. Muestra las animaciones y celebraciones.
//
// (v134) Este archivo tenía más de 4100 líneas; se dividió por tema. Aquí queda lo que usan todos:
// la partida (estado), ui (lo que se ve), ejecutar(), dibujarPantalla(), cambiarPantalla(), el arranque
// y los «escuchadores» de toques. Cada tema tiene su archivo, con sus funciones y sus botones:
//
//   app-running.js       — el GPS y la carrera
//   app-gym.js           — los botones del gimnasio
//   app-pin.js           — el PIN y Face ID
//   app-torre.js         — mapa, minijuegos, Torre y Mazmorra
//   app-historias.js     — cinemáticas, novelas, pergaminos, Voces del Valle
//   app-efectos.js       — robo, sonido, música, celebraciones, «Deshacer»
//   app-dialogos.js      — las ventanas y sus formularios
//   app-gestos.js        — deslizar, arrastrar, golpe, firma, hojear
//   app-maestro.js       — bienvenida, Maestro y ritual de la noche
//   app-diario.js        — el diario, el libro y el pacto
//   app-version.js       — service worker, actualizaciones y novedades
//   app-botones.js       — los demás botones (data-accion)
//   app-formularios.js   — los demás formularios (data-form)
//
// Cada archivo exporta sus botones como ACCIONES_<TEMA> y aquí se juntan en ACCIONES.
// Botón nuevo: ponlo en el archivo de su tema (o en app-botones.js). Archivo nuevo: súmalo a ARCHIVOS de sw.js.

import * as datos from "./datos.js";
import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as seguridad from "./seguridad.js";
import * as avatar from "./avatar.js";
import * as campana from "./campana.js";
import * as vistasVoces from "./vistas-voces.js";
import * as vistasGym from "./vistas-gym.js";
import * as vistasRunning from "./vistas-running.js";   // (v109) la pestaña Running
import * as vistasFinanzas from "./vistas-finanzas.js";   // (v135) la pantalla Finanzas
import * as vistasMemento from "./vistas-memento.js";   // (v142) el calendario de Memento Mori
import * as running from "./running.js";
import * as frases from "./frases.js";   // (v128) lo que dice la voz de la carrera
import * as locutor from "./locutor.js";   // (v128) las voces grabadas
import * as vida from "./vida.js";
import * as maestro from "./maestro.js";
import * as saga from "./saga.js";
import { eventoDelDia } from "./eventos.js";
import * as sonido from "./sonido.js";
import * as musica from "./musica.js";
import * as avisos from "./avisos.js";
import * as nube from "./nube.js";
import { semanaPorMostrar } from "./resumen.js";
import { vigilarIconos } from "./iconos.js";
import { retratoPixel } from "./retratos.js";
import * as fx from "./efectos.js";
import { hoy, diasEntre, sumarDias, relojTexto, relojLargo } from "./fechas.js";
import { runTipo, runPista, gpsProblema, runTerminando, ponerHeroeEnMapaVivo, mostrarNotificacionCarrera,
         ponerCriaturasDeCarrera, spritesBatalla, actualizarBarraRun, iniciarGps, hablar, poblarVocesRunning,
         mantenerPantallaDespierta, ACCIONES_RUNNING, FORMULARIOS_RUNNING } from "./app-running.js";
import { gymVista, ACCIONES_GYM, FORMULARIOS_GYM } from "./app-gym.js";
import { ACCIONES_MEMENTO, FORMULARIOS_MEMENTO } from "./app-memento.js";   // (v142)
import { ACCIONES_FINANZAS, FORMULARIOS_FINANZAS, conectarPesos } from "./app-finanzas.js";   // (v135, v137)
import { GRACIA_MS, cerrarTeclado, teclaPulsada, pedirPinParaEntrar, entrarConFaceId, crearPin, ACCIONES_PIN } from "./app-pin.js";
import { pintarMapa, juegoActual, jugarMinijuego, cerrarMinijuego, ACCIONES_TORRE } from "./app-torre.js";
import { revisarCines, capituloNovela, libroNovela, pergaminoActual, pintarRetratosVoces, pintarPortadas,
         ACCIONES_HISTORIAS } from "./app-historias.js";
import { roboDesde, mostrarRobo, cerrarRobo, sonar, ponerMusica, arreglarVistaTrasTeclado, pinturasEnPixel,
         bolsa, recompensar, flotar, reproducirAnimacion, celebrar, siguienteCelebracion, avisar, alDeshacer,
         ocultarDeshacer, ACCIONES_EFECTOS } from "./app-efectos.js";
import { rellenarOpciones, PREPARAR, mostrarCamposFrecuencia, usarPlantilla, mostrarCamposLogro } from "./app-dialogos.js";
import { conectarGestos, conectarArrastre, golpear, prepararLienzoFirma, conectarHojear } from "./app-gestos.js";
import { abrirBienvenida, conectarCartaRitual, ACCIONES_MAESTRO, FORMULARIOS_MAESTRO } from "./app-maestro.js";
import { pintarListaDiario, ACCIONES_DIARIO, FORMULARIOS_DIARIO } from "./app-diario.js";
import { registroSW, registrarServiceWorker, buscarActualizacion, marcarNovedadesVistas, mostrarNovedades,
         ACCIONES_VERSION } from "./app-version.js";
import { ACCIONES_GENERALES } from "./app-botones.js";
import { FORMULARIOS_GENERALES } from "./app-formularios.js";

// ===== Estado de la app =====
export let estado = datos.cargar();     // la partida completa
export let pantallaActual = "hoy";      // qué pestaña se está viendo
// (Las variables de cada tema viven en su archivo: el GPS en app-running.js, la Torre en app-torre.js…)

// (v134) Lo que se está viendo y que cambian VARIOS archivos (Hoy, el gym, el pacto…). Va dentro de un objeto porque
// un archivo no puede reasignar una variable «let» de otro, pero sí cambiar las propiedades de un objeto: ui.diaVisto = "hoy".
export const ui = {
    diaSeleccionado: null,         // día tocado en el calendario
    diaVisto: "hoy",               // en la pantalla Hoy: "hoy" o "ayer" (por si olvidaste marcar algo)
    rangoResumen: 7,               // en Progreso: el resumen muestra los últimos 7 o 30 días
    fraseGym: null,                // (v76) lo último que te dijo Aurelio en el gimnasio: { tipo, texto } o null
    resumenGym: null,              // (v76) el entrenamiento que acabas de terminar (para mostrar su resumen)
    descansoGym: null,             // (v66) el descanso entre series del gym: { fin, total } (milisegundos), o null
    renovandoPacto: false,         // en «Tu pacto»: true mientras vuelves a firmarlo
    paginaLibro: "portada",        // en «Tu libro»: "portada", "indice" o el número de un capítulo
    problemaAvisos: null,          // si las notificaciones se cortaron: "bloqueadas" o "desconectadas"
    regionMapa: null,              // en el mapa: la región que miras (null = donde vas)
    memoriasDesde: null,           // cuántas memorias de Aurelio habías leído al abrirlas (las demás se marcan «Nuevo»)
    agruparHoy: "atributo",        // (v51) en Hoy, las misiones se agrupan por "atributo" o por "momento"
    campanaVista: null,            // en Aventuras: qué campaña de jefes se ve (null = la del jefe más cerca de caer)
};

// Pantalla «Tu diario»: el mes que se ve (null = el actual), el día tocado, la búsqueda,
// el filtro de ánimo y cuántas entradas se muestran.
export const diarioVista = { mes: null, dia: null, busqueda: "", filtro: null, limite: 30 };
let estadoDePausaVisto = "";     // (v131) para redibujar la carrera cuando entra o sale la pausa automática

// Las secciones elegidas en las pantallas largas (el selector de arriba): solo se ve una a la vez.
export const subvista = { progreso: "numeros", tienda: "recompensas", personaje: "equipo", gym: "entrenar", running: "correr", finanzas: "resumen" };

// Modo esencial (v46): las únicas pantallas que quedan a la mano. Si lo enciendes estando en otra, vuelves a Hoy.
const PANTALLAS_ESENCIALES = new Set(["hoy", "tienda", "enfoque", "gym"]);

// Las pantallas sin pestaña propia iluminan la pestaña de la que dependen.
const PESTANA_DE = { mapa: "aventuras", arcade: "aventuras", voces: "aventuras", enfoque: "hoy", gym: "hoy", running: "hoy", finanzas: "hoy", memento: "hoy", diario: "hoy", libro: "hoy", pacto: "personaje", memorias: "personaje", pergamino: "personaje", biblioteca: "personaje", novela: "personaje" };

// Atajo: $("#algo") es lo mismo que document.querySelector("#algo")
export const $ = (selector) => document.querySelector(selector);

// Qué función dibuja cada pantalla.
const DIBUJAR = {
    hoy: vistas.pantallaHoy,
    progreso: vistas.pantallaProgreso,
    aventuras: vistas.pantallaAventuras,
    tienda: vistas.pantallaTienda,
    personaje: vistas.pantallaPersonaje,
    arcade: vistas.pantallaArcade,
    voces: vistasVoces.pantallaVoces,
    enfoque: vistas.pantallaEnfoque,
    diario: vistas.pantallaDiario,
    pacto: vistas.pantallaPacto,
    gym: vistasGym.pantallaGym,
    running: vistasRunning.pantallaRunning,
    finanzas: vistasFinanzas.pantallaFinanzas,   // (v135)
    memento: vistasMemento.pantallaMemento,      // (v142)
    libro: vistas.pantallaLibro,
    mapa: vistas.pantallaMapa,
    memorias: vistas.pantallaMemorias,
    pergamino: vistas.pantallaPergamino,
    biblioteca: vistas.pantallaBiblioteca,
    novela: vistas.pantallaNovela,
};

// Lo que el dibujo del avatar necesita saber en este momento.
export function avatarActual() {
    const fecha = hoy();
    return avatar.describirAvatar(estado, fecha, juego.resumen(estado, fecha));
}


// ===== Arranque =====
// iniciar() se llama al FINAL de este archivo, cuando ya existen todas
// las variables (const/let) que usa. Los scripts "module" se ejecutan
// cuando el HTML ya está cargado.

function iniciar() {
    vigilarIconos();             // (v91) los emojis de la página se vuelven íconos en pixel art
    fx.recordarToques();    // (v94) de donde tocas salen las monedas que ganas
    arreglarVistaTrasTeclado();  // (v99) iOS: la cabecera y las pestañas vuelven a su lugar al cerrar el teclado
    pinturasEnPixel();           // (v95) los jefes y los fondos en pixel art, en segundo plano
    datos.pedirAlmacenamientoPersistente();
    registrarServiceWorker();
    rellenarOpciones();
    conectarEventos();
    setInterval(tictac, 1000);   // reloj del modo enfoque
    if (estado.running.encurso?.gps) { iniciarGps(); mantenerPantallaDespierta(true); }   // (v109) la carrera sigue donde iba

    if (!estado.personaje) {
        correrCarga(() => { $("#crear-personaje").hidden = false; });
    } else if (seguridad.hayPin()) {
        // (v85) Primero la clave (la carga no se ve todavía: index.html la deja en espera); al acertarla, o con Face ID,
        // corre la carga de 4 segundos y después entras al juego.
        const entrarConCarga = () => correrCarga(entrarAlJuego, { completa: true });
        pedirPinParaEntrar(entrarConCarga);
        entrarConFaceId(entrarConCarga, { silencioso: true });
    } else {
        correrCarga(entrarAlJuego);
    }
}

// La pantalla de carga (está en index.html) dura CARGA_DURACION milisegundos, con su escena animada (ver .carga en
// estilos.css, que dura lo mismo). `alTerminar` se llama cuando empieza a desvanecerse, para que lo de abajo ya esté listo.
// Sin PIN, la cuenta empieza al abrir la app; con PIN, empieza después de la clave (completa: true).
const CARGA_DURACION = 5000;
const CARGA_SALIDA = 550;   // lo que dura el desvanecido (ver .carga.saliendo)
let cargaEnMarcha = false;

function correrCarga(alTerminar, { completa = false } = {}) {
    const carga = $("#carga");
    if (!carga) { alTerminar(); return; }
    if (cargaEnMarcha) return;   // (Face ID y PIN a la vez: solo cuenta el primero)
    cargaEnMarcha = true;
    if (carga.classList.contains("espera")) {
        carga.classList.remove("espera");   // vuelve a verse y su animación empieza de cero
        window.reiniciarCarga?.();
    }
    const falta = completa ? CARGA_DURACION : Math.max(0, CARGA_DURACION - performance.now());
    setTimeout(() => {
        carga.classList.add("saliendo");
        alTerminar();
        setTimeout(() => { carga.remove(); cargaEnMarcha = false; }, CARGA_SALIDA + 50);
    }, Math.max(0, falta - CARGA_SALIDA));
}

export function entrarAlJuego({ nuevo = false } = {}) {
    $("#crear-personaje").hidden = true;
    $("#juego").hidden = false;
    // (v47) Cada vez que abres la app arranca en modo esencial (si no lo quieres, se apaga en Ajustes).
    // (v49) Si está activada la pregunta «¿Cómo te sientes hoy?», ella decide el menú; si no, vale lo de la v47.
    const preguntar = estado.ajustes.preguntarAnimo && !nuevo;
    if (!preguntar && estado.ajustes.esencialAlAbrir) estado.ajustes.esencial = true;
    refrescar();
    revisarAlAbrir();
    if (nuevo) {
        // La primera vez: la guía de bienvenida y, al terminarla, ofrecer el PIN.
        marcarNovedadesVistas();
        abrirBienvenida(ofrecerPin);
    } else if (preguntar) {
        // Primero la pregunta; después, el PIN y las novedades.
        preguntarAnimo(() => { ofrecerPin(); mostrarNovedades(); });
    } else {
        ofrecerPin();
        mostrarNovedades();
    }
}

// (v49) La ventana «¿Cómo te sientes hoy?». `despues` se llama al elegir (al abrir la app); desde Hoy no hace falta.
let despuesDeAnimo = null;

export function preguntarAnimo(despues = null) {
    despuesDeAnimo = despues;
    const ahora = new Date();
    const dia = Math.floor(ahora.getTime() / 86400000);
    $("#dialogo-animo").innerHTML = vistas.pantallaAnimo(estado.personaje.nombre, ahora.getHours(), dia);
    $("#dialogo-animo").showModal();
}

export function elegirAnimo(animo) {
    if (!ejecutar(() => acciones.elegirAnimo(estado, animo))) return;
    $("#dialogo-animo").close();
    // Si el menú nuevo no incluye la pantalla en la que estabas, vuelves a Hoy.
    const ocultas = animo === "mal" ? !PANTALLAS_ESENCIALES.has(pantallaActual)
        : animo === "normal" ? pantallaActual === "aventuras" : false;
    if (ocultas) cambiarPantalla("hoy");
    const despues = despuesDeAnimo;
    despuesDeAnimo = null;
    despues?.();
}

// Si nunca has creado un PIN (ni dijiste "Ahora no"), te lo ofrecemos.
function ofrecerPin() {
    if (seguridad.debePreguntar()) crearPin({ conAhoraNo: true, mensaje: "Protege tu app: elige 4 números" });
}

// Al abrir (o volver a) la app: bonus de regreso, vida perdida, aviso de escudos usados,
// premio de la sesión de enfoque (si terminó mientras no estabas) y desafío de la semana.
function revisarAlAbrir() {
    let robo = null;
    ejecutar(() => {
        // Si un jefe te robó vida mientras no estabas, lo cuenta la escena del robo
        // (y ya no hace falta el cartelito de «Perdiste N de vida»).
        const perdida = acciones.revisarVidaAlAbrir(estado);
        robo = perdida?.robo || null;
        const celebraciones = [
            ...(acciones.registrarVisita(estado)?.celebraciones || []),
            ...(perdida?.celebraciones || []).filter((c) => !(robo && c.pequena)),
            ...(acciones.revisarEscudosUsados(estado)?.celebraciones || []),
            ...(acciones.revisarEnfoque(estado)?.celebraciones || []),
            ...(acciones.asegurarDesafio(estado)?.celebraciones || []),
        ];
        acciones.asegurarRetoDelDia(estado);
        return { celebraciones };
    });
    if (robo) mostrarRobo(robo);
    // ¿Siguen conectadas las notificaciones? Si no, aparece un aviso en Hoy para reactivarlas.
    avisos.problema().then((problema) => {
        if (problema === ui.problemaAvisos) return;
        ui.problemaAvisos = problema;
        if (estado.personaje && !$("#juego").hidden) dibujarPantalla();
    }).catch(() => {});
    // La copia del día en la nube (si está activada). Sin internet, se intenta la próxima vez.
    nube.copiaDiaria(estado).then((hecha) => { if (hecha) avisar("☁️ Copia del día guardada en la nube"); });
}

// El reloj de la app: corre cada segundo y cambia solo los textos que avanzan (la carrera, el gym, el modo enfoque)
// sin redibujar la pantalla. Al terminar el modo enfoque, entrega el premio.
function tictac() {
    actualizarBarraRun();
    if (estado.running?.encurso) mostrarNotificacionCarrera();   // (v120) con la app en segundo plano, actualiza la notificación
    // (v109) El running en vivo: el cronómetro, la distancia y el ritmo se actualizan solos (sin redibujar).
    if (estado.running.encurso && pantallaActual === "running") {
        const en = estado.running.encurso;
        const ahora = Date.now();
        const tiempo = document.querySelector("[data-run-tiempo]");
        if (tiempo) tiempo.textContent = running.textoTiempo(running.tiempoDeEncurso(en, ahora));
        const km = document.querySelector("[data-run-km]");
        if (km) km.textContent = running.textoKm(en.distancia / 1000);
        const ritmo = document.querySelector("[data-run-ritmo]");
        if (ritmo) ritmo.textContent = running.textoRitmo(running.ritmoActual(en, ahora));
        const aviso = document.querySelector("[data-run-gps]");
        if (aviso) aviso.textContent = vistasRunning.textoGps(en, gpsProblema);
        // (v141) El GPS en corto del HUD (modo concentración): sus rayitas solo se redibujan cuando cambian.
        const gpsCorto = document.querySelector("[data-run-gps-corto]");
        const g = vistasRunning.gpsCorto(en, gpsProblema);
        if (gpsCorto && gpsCorto.dataset.n !== vistasRunning.firmaGps(g)) {
            gpsCorto.className = `run-gps-corto ${g.clave}`;
            gpsCorto.innerHTML = vistasRunning.htmlGpsCorto(g);
            gpsCorto.dataset.n = vistasRunning.firmaGps(g);
        }
        // (v141) La barra del km en curso: cada 10 m, con cada poder y con cada criatura nueva.
        const barraKm = document.querySelector("[data-run-kmbar]");
        if (barraKm && barraKm.dataset.n !== vistasRunning.firmaDelKm(en)) {
            barraKm.innerHTML = vistasRunning.htmlKmEnCurso(en);
            barraKm.dataset.n = vistasRunning.firmaDelKm(en);
        }
        // (v118) El mapa de la carrera y el avance de la ruta: se vuelven a dibujar solo cuando llega un punto nuevo del GPS.
        const caja = document.querySelector("[data-run-mapa]");
        const firma = `${(en.traza || []).length}:${(en.puntosKm || []).length}:${estado.running.vistaMapa}:${en.pista ? Math.round(en.distancia) : ""}`;
        if (caja && caja.dataset.n !== firma) {
            caja.innerHTML = vistasRunning.htmlMapaVivo(en.traza, en.puntosKm, vistasRunning.opcionesDelMapa(en, estado.running));
            caja.dataset.n = firma;
            ponerHeroeEnMapaVivo();
            const textoRuta = document.querySelector("[data-run-ruta]");
            if (textoRuta) textoRuta.textContent = vistasRunning.textoRutaEnVivo(estado, en);
        }
        // (v131) Entró o salió la pausa automática (o una pausa): se redibuja la carrera para que los botones digan lo correcto.
        const pausa = `${Boolean(en.pausadoDesde)}:${Boolean(en.autopausa)}`;
        if (estadoDePausaVisto && pausa !== estadoDePausaVisto && !runTerminando) { estadoDePausaVisto = pausa; dibujarPantalla({ mantenerScroll: true }); return; }
        estadoDePausaVisto = pausa;
        // (v119) La pelea del km: el texto cada segundo; la imagen de la criatura solo cuando cambia.
        const pelea = document.querySelector("[data-run-encuentro]");
        if (pelea) pelea.innerHTML = vistasRunning.htmlEncuentro(en, ahora);
        ponerCriaturasDeCarrera();
        // (v140) El consejo de ritmo grande: cambia de color según vas.
        const consejo = document.querySelector("[data-run-consejo]");
        if (consejo) {
            const c = vistasRunning.consejoEnVivo(en, ahora);
            consejo.className = `run-consejo ${c.clave}`;
            // (v141) Se compara con data-n: el emoji del texto se cambia por su ícono de píxel, así que textContent ya no es igual.
            if (consejo.dataset.n !== vistasRunning.textoConsejo(c)) {
                consejo.textContent = vistasRunning.textoConsejo(c);
                consejo.dataset.n = vistasRunning.textoConsejo(c);
            }
        }
        // (v139) La batalla de la pantalla dividida: solo se vuelve a dibujar cuando pasa algo (un poder, un ataque, el golpe
        // final, una criatura nueva o llega una imagen). Si se dibujara cada segundo, las animaciones empezarían de nuevo.
        const batalla = document.querySelector("[data-run-batalla]");
        const firmaBatalla = vistasRunning.firmaDeBatalla(en, ahora, spritesBatalla);
        if (batalla && batalla.dataset.n !== firmaBatalla) {
            batalla.innerHTML = vistasRunning.htmlBatalla(en, ahora, spritesBatalla);
            batalla.dataset.n = firmaBatalla;
        }
        // (v116) Los parciales de la carrera: solo se reescriben cuando cambian.
        const parciales = document.querySelector("[data-run-parciales]");
        const marcasAhora = (en.marcas || []).length;
        if (parciales && parciales.dataset.n !== String(marcasAhora)) {
            parciales.innerHTML = vistasRunning.htmlParciales(running.parcialesDe(en.marcas));
            parciales.dataset.n = String(marcasAhora);
        }
    }
    // (v76) El tiempo que llevas entrenando.
    for (const reloj of document.querySelectorAll("[data-gym-inicio]")) {
        const t = Math.max(0, Math.floor((Date.now() - Number(reloj.dataset.gymInicio)) / 1000));
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        reloj.textContent = `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(t % 60).padStart(2, "0")}`;
    }
    // (v78) El anillo del descanso del modo foco se va vaciando.
    const anilloGym = document.querySelector("[data-gym-anillo]");
    if (anilloGym) {
        const parte = Math.max(0, Math.min(1, (Number(anilloGym.dataset.fin) - Date.now()) / Number(anilloGym.dataset.total)));
        anilloGym.setAttribute("stroke-dashoffset", String(Number(anilloGym.dataset.largo) * (1 - parte)));
    }
    // El descanso entre series del gym: cuenta atrás y, al llegar a 0, suena y vibra.
    const reloj = document.querySelector("[data-descanso-fin]");
    if (reloj) {
        const restante = Number(reloj.dataset.descansoFin) - Date.now();
        if (restante <= 0) {
            ui.descansoGym = null;
            sonar("descanso");
            navigator.vibrate?.([200, 100, 200]);
            dibujarPantalla({ mantenerScroll: true });
        } else {
            reloj.textContent = relojTexto(restante);
        }
    }
    // El reloj del desafío relámpago (si está en pantalla). Al llegar a 0 se redibuja Hoy.
    for (const reloj of document.querySelectorAll("[data-relampago-fin]")) {
        const restante = Number(reloj.dataset.relampagoFin) - Date.now();
        reloj.textContent = relojLargo(restante);
        if (restante <= 0 && !$("#juego").hidden) {
            reloj.removeAttribute("data-relampago-fin");
            dibujarPantalla();
        }
    }
    const activo = estado.personaje && estado.enfoque.activo;
    // Con el PIN puesto o en medio de un minijuego, espera: el premio llega después.
    if (!activo || $("#juego").hidden || !$("#minijuego").hidden) return;

    const restante = juego.finDelEnfoque(activo) - Date.now();
    if (restante <= 0) {
        ejecutar(() => acciones.revisarEnfoque(estado));
        return;
    }
    for (const reloj of document.querySelectorAll("[data-reloj]")) reloj.textContent = relojTexto(restante);
    const anillo = document.querySelector("[data-anillo]");
    if (anillo) {
        const largo = Number(anillo.dataset.largo);
        anillo.setAttribute("stroke-dashoffset", largo * (1 - restante / Number(anillo.dataset.total)));
    }
}
let ocultaDesde = null;        // cuándo se fue la app a segundo plano


// ===== Ejecutar una acción =====
// Todas las acciones pasan por aquí: así guardar, redibujar y celebrar
// se hace siempre igual, sin repetir código.
export function ejecutar(accion, efectos = {}) {
    const antes = acciones.foto(estado);
    const bolsaAntes = bolsa();   // (v94) para hacer volar lo que ganes
    let resultado;
    try {
        resultado = accion() || {};
    } catch (error) {
        alert(error.message);   // ej: "Ya completaste esta misión hoy."
        return null;
    }

    const celebraciones = [
        ...(resultado.celebraciones || []),
        ...acciones.revisarCambios(estado, antes),
    ];
    datos.guardar(estado);
    avisos.guardarResumen(estado);   // el texto de las notificaciones, siempre al día
    // Si cambió algo que el servidor de avisos necesita (ej: marcaste una misión con aviso),
    // se lo contamos. Sin internet falla en silencio y se reintenta en el próximo cambio.
    avisos.sincronizar(registroSW, estado, { siCambio: true }).catch(() => {});

    // ¿A qué jefes les pegaste con esta acción, y cuánto? (para mostrar el golpe)
    const danoAhora = campana.danoPorCategoria(estado);
    const golpes = {};
    for (const categoria of Object.keys(danoAhora)) {
        const golpe = danoAhora[categoria] - antes.dano[categoria];
        if (golpe > 0) golpes[categoria] = golpe;
    }
    if (Object.keys(golpes).length) setTimeout(() => sonar("impacto"), 330);   // suena cuando cae el tajo

    const subioNivel = celebraciones.some((c) => c.tipo === "nivel");
    refrescar({ ...efectos, subioNivel, golpes });
    recompensar(bolsaAntes);
    celebraciones.forEach(celebrar);

    // ¿Cambió tu vida? (ej: +4 ❤️ al completar una misión)
    const cambioVida = vida.calcularVida(estado, hoy()).puntos - antes.vida.puntos;
    if (cambioVida) flotar(".cab-datos", `${cambioVida > 0 ? "+" : ""}${cambioVida} ❤️`, cambioVida < 0);
    return resultado;
}


// ===== Dibujar =====

export function refrescar(efectos = {}) {
    actualizarCabecera(efectos.subioNivel);
    // El CSS necesita saber cuánto mide la cabecera (para pegar cosas justo debajo).
    document.documentElement.style.setProperty("--alto-cabecera", `${$(".cabecera").offsetHeight}px`);
    dibujarPantalla(efectos);
}

function actualizarCabecera(subioNivel) {
    const personaje = estado.personaje;
    const nivel = juego.calcularNivel(personaje.xp);

    // Array.from separa bien los emojis (si el nombre empieza con uno).
    $("#cab-avatar").innerHTML = retratoPixel(avatarActual(), { alt: "Tu héroe" });
    $("#cab-nombre").textContent = personaje.nombre;
    $("#cab-xp").textContent = `${nivel.xpEnNivel} / ${nivel.xpNecesaria} XP`;
    $("#cab-monedas").textContent = personaje.monedas;
    $("#cab-gemas").textContent = personaje.gemas || 0;

    const numeroNivel = $("#cab-nivel");
    if (numeroNivel.textContent !== String(nivel.nivel)) {
        const yaTeniaNumero = numeroNivel.textContent !== "";
        numeroNivel.textContent = nivel.nivel;
        if (yaTeniaNumero) reproducirAnimacion(numeroNivel, "pulso");
    }

    moverBarra($("#cab-barra"), nivel.porcentaje, subioNivel);

    // La vida: barra con el color de su estado (en forma, bien, herido o caído).
    const v = vida.calcularVida(estado, hoy());
    $("#cab-vida").textContent = `${v.caido ? "☠️" : "❤️"} ${v.puntos}/${v.maxima}`;
    // La barra de armadura: en gris tu máximo, en azul lo que te queda (la barra entera son 100).
    $("#cab-armadura-maxima").style.width = `${v.armadura.maxima}%`;
    $("#cab-armadura-relleno").style.width = `${v.armadura.puntos}%`;
    $("#cab-armadura").title = `Armadura ${v.armadura.puntos} de ${v.armadura.maxima}`;
    $("#cab-salud").className = `barra barra-salud salud-${v.nivel}`;
    $("#cab-salud-relleno").style.width = `${v.porcentaje}%`;
}

// Mueve la barra de XP. Al subir de nivel, primero la llena y luego la vacía.
function moverBarra(barra, porcentaje, subioNivel) {
    if (!subioNivel) {
        barra.style.width = `${porcentaje}%`;
        return;
    }
    barra.style.width = "100%";
    setTimeout(() => {
        barra.style.transition = "none";   // vaciar sin animación
        barra.style.width = "0%";
        barra.offsetWidth;                 // obliga al navegador a aplicar el cambio ya
        barra.style.transition = "";       // vuelve la animación del CSS
        barra.style.width = `${porcentaje}%`;
    }, 700);
}

// Lo que las vistas necesitan saber en este momento.
export function contextoActual(efectos = {}) {
    const fecha = hoy();
    const info = juego.resumen(estado, fecha);
    const ahora = Date.now();
    return {
        hoy: fecha,
        info,
        avatar: avatar.describirAvatar(estado, fecha, info),
        vida: vida.calcularVida(estado, fecha),
        diaSeleccionado: ui.diaSeleccionado,
        fechaVista: fechaVista(),
        rangoResumen: ui.rangoResumen,
        recordarRespaldo: necesitaRespaldo(fecha),
        semanaPendiente: semanaPorMostrar(estado, fecha),   // lunes de la semana pasada, o null
        ahora,                                              // para los relojes (enfoque y relámpago)
        ...contextoDiario(fecha),
        renovandoPacto: ui.renovandoPacto,
        descanso: ui.descansoGym,
        gymVista,
        tipo: runTipo,
        pista: runPista,                                    // (v131)                                      // (v109) el tipo de carrera elegido
        gpsProblema,
        terminando: runTerminando,
        spritesBatalla,                                     // (v139) las imágenes de la batalla mientras corres
        fraseGym: ui.fraseGym,
        resumenGym: ui.resumenGym,
        paginaLibro: ui.paginaLibro,
        problemaAvisos: ui.problemaAvisos,
        regionMapa: ui.regionMapa,
        subvista,                                           // la sección elegida en Progreso, Tienda y Héroe
        agruparHoy: ui.agruparHoy,
        pergaminoId: pergaminoActual,
        capituloNovela,
        libroNovela,
        campanaVista: ui.campanaVista,
        maestro: maestro.contexto(estado, fecha, ahora, info),   // lo que el Maestro sabe de tu día
        memoriasDesde: ui.memoriasDesde,
        saga: saga.estadoDeSaga(saga.datosDeSaga(estado, campana.estadoCampanas(estado))),   // tu objetivo en la saga
        evento: eventoDelDia(fecha, estado),
        ...efectos,   // ej: { recienHecha: 3 } para animar la misión 3
    };
}

export function dibujarPantalla(efectos = {}) {
    document.body.classList.toggle("modo-esencial", Boolean(estado.ajustes.esencial));   // (v46) esconde pestañas y secciones
    document.body.classList.toggle("modo-normal", estado.ajustes.animo === "normal");    // (v49) menú sencillo
    // (v120) Modo concentración: mientras corres, la pantalla de Running se queda solo con lo importante.
    document.body.classList.toggle("run-concentracion", pantallaActual === "running" && Boolean(estado.running.encurso) && estado.running.concentracion !== false);
    document.body.classList.toggle("run-terminando", runTerminando && Boolean(estado.running.encurso));   // (v129)
    const contenedor = $(`#pantalla-${pantallaActual}`);
    contenedor.innerHTML = DIBUJAR[pantallaActual](estado, contextoActual(efectos));

    if (pantallaActual === "pacto") prepararLienzoFirma();   // el recuadro para firmar con el dedo
    if (pantallaActual === "running") { poblarVocesRunning(); setTimeout(poblarVocesRunning, 800); }   // (v124, v126)
    if (pantallaActual === "running" && $("[data-run-mapa]")) { ponerHeroeEnMapaVivo(); ponerCriaturasDeCarrera(); }   // (v118–v119) héroe y criatura sobre el mapa
    if (pantallaActual === "mapa") pintarMapa();   // la imagen del mapa (pixel art) llega un instante después
    actualizarBarraRun();
    if (pantallaActual === "arcade") pintarPortadas();        // la portada de la Mazmorra (pixel art)
    if (pantallaActual === "voces") pintarRetratosVoces($("#pantalla-voces"));   // las caras de la aldea (pixel art)
    if (pantallaActual === "libro") conectarHojear();         // pasar las páginas deslizando

    if (pantallaActual === "progreso" && !efectos.mantenerScroll) {
        // El calendario empieza mostrando las semanas más recientes (a la derecha).
        const scroll = $("#calendario-scroll");
        if (scroll) scroll.scrollLeft = scroll.scrollWidth;
    }
}

// Lo que la pantalla «Tu diario» necesita saber.
export function contextoDiario(fecha) {
    return {
        mesDiario: diarioVista.mes || fecha.slice(0, 7),
        diaDiario: diarioVista.dia,
        busquedaDiario: diarioVista.busqueda,
        saltoPregunta: diarioVista.salto || 0,   // (v106) «otra pregunta»
        filtroDiario: diarioVista.filtro,
        limiteDiario: diarioVista.limite,
    };
}

// Recordar la copia de seguridad: después de 7 días de juego, si nunca
// la hiciste o pasó más de un mes desde la última.
function necesitaRespaldo(fecha) {
    if (nube.configurada()) return false;   // la copia en la nube se hace sola cada día
    if (diasEntre(estado.personaje.creadoEn, fecha) < 7) return false;
    return !estado.ultimoRespaldo || diasEntre(estado.ultimoRespaldo, fecha) > 30;
}

// Muestra la sección elegida y marca su pestaña (sin dibujar el contenido).
function mostrarSeccion(nombre) {
    pantallaActual = nombre;
    for (const seccion of document.querySelectorAll(".pantalla")) {
        seccion.hidden = seccion.id !== `pantalla-${nombre}`;
    }
    const deLaPestana = PESTANA_DE[nombre] || nombre;
    for (const pestana of document.querySelectorAll(".pestana")) {
        if (pestana.dataset.pantalla === deLaPestana) pestana.setAttribute("aria-current", "page");
        else pestana.removeAttribute("aria-current");
    }
}

// La fecha que muestra la pantalla Hoy (hoy, o ayer si lo elegiste).
export function fechaVista() {
    return ui.diaVisto === "ayer" ? sumarDias(hoy(), -1) : hoy();
}

// Enciende o apaga el modo esencial (el botón de Hoy y el interruptor de Ajustes). Si queda encendido y estabas en una
// pantalla que ya no está a la mano (Aventuras, Héroe…), te lleva a Hoy.
function cambiarModoEsencial(encendido) {
    if (!ejecutar(() => acciones.elegirAnimo(estado, encendido ? "mal" : "bien"))) return;
    if (encendido && !PANTALLAS_ESENCIALES.has(pantallaActual)) cambiarPantalla("hoy");
}

export function cambiarPantalla(nombre) {
    // Los logros ahora viven dentro de Progreso.
    if (nombre === "logros") {
        subvista.progreso = "logros";
        nombre = "progreso";
    }
    ui.diaVisto = "hoy";   // al cambiar de pantalla siempre se vuelve a "hoy"
    ui.resumenGym = null;
    if (!estado.gym.encurso) ui.fraseGym = null;
    if (nombre !== "memorias") ui.memoriasDesde = null;
    ui.renovandoPacto = false;
    if (nombre === "libro") ui.paginaLibro = "portada";   // el libro siempre se abre por la portada
    if (nombre === "mapa") ui.regionMapa = null;           // el mapa se abre donde vas
    mostrarSeccion(nombre);
    dibujarPantalla();
    window.scrollTo(0, 0);
    if (nombre === "mapa") $("#mapa-heroe")?.scrollIntoView({ block: "center" });
    animarEntrada(nombre);
    ponerMusica();   // (v58) cada escena tiene su música
    if (["mapa", "arcade", "voces"].includes(nombre)) setTimeout(() => revisarCines(nombre), 600);
}

// (v56) Al cambiar de pantalla, la nueva entra con una animación suave (solo entonces: al marcar una misión no se repite).
export function animarEntrada(nombre) {
    const pantalla = $(`#pantalla-${nombre}`);
    if (!pantalla) return;
    // Si ya la tenía (cambiaste de pantalla muy rápido), se quita y se vuelve a poner para que empiece de cero.
    // (v134) Leer offsetWidth obliga al navegador a medir TODA la pantalla en ese instante (en Héroe eran ~0,15 s);
    // por eso solo se hace cuando de verdad hay que reiniciar la animación.
    if (pantalla.classList.contains("entra")) {
        pantalla.classList.remove("entra");
        void pantalla.offsetWidth;
    }
    pantalla.classList.add("entra");
    pantalla.addEventListener("animationend", (evento) => {
        if (evento.target === pantalla) pantalla.classList.remove("entra");
    }, { once: true });
}

export async function exportar() {
    const nombre = `vida-rpg-${hoy()}.json`;
    const archivo = new File([datos.textoRespaldo(estado)], nombre, { type: "application/json" });

    try {
        if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
            // En el iPhone abre el menú de compartir: elige «Guardar en Archivos».
            await navigator.share({ files: [archivo], title: "Copia de Vida RPG" });
        } else {
            // En la compu: descarga el archivo.
            const enlace = document.createElement("a");
            enlace.href = URL.createObjectURL(archivo);
            enlace.download = nombre;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
        }
    } catch (error) {
        if (error.name === "AbortError") return; // cerraste el menú sin guardar
        alert("No se pudo exportar la copia.");
        return;
    }
    estado.ultimoRespaldo = hoy();
    datos.guardar(estado);
    PREPARAR.ajustes();
    dibujarPantalla();
    avisar("💾 Copia de seguridad lista");
}

// Se puede importar desde Ajustes o desde la pantalla de inicio (sin personaje todavía).
async function importar(archivo) {
    try {
        const nuevo = datos.desdeRespaldo(await archivo.text());
        if (estado.personaje) {
            const seguro = confirm(`¿Reemplazar tu partida actual por la copia de «${nuevo.personaje.nombre}»? Lo que tienes ahora se perderá.`);
            if (!seguro) return;
        }
        cargarPartida(nuevo, `📥 Bienvenido, ${nuevo.personaje.nombre}`);
    } catch (error) {
        alert(error.message);
    }
}

// Reemplaza la partida de este teléfono por otra (de un archivo o de la nube).
export function cargarPartida(nuevo, mensaje) {
    const veniaDelInicio = $("#juego").hidden;
    estado = nuevo;
    datos.guardar(estado);
    $("#dialogo-ajustes").close();
    avisar(mensaje);
    if (veniaDelInicio) entrarAlJuego();
    else refrescar();
}

export function borrarTodo() {
    if (!confirm("¿Seguro? Se borrará TODO tu progreso de este teléfono.")) return;
    if (!confirm("Última oportunidad: esto no se puede deshacer. ¿Borrar todo?")) return;
    $("#dialogo-ajustes").close();
    reiniciarPartida();
}

// Borra la partida y el PIN, y vuelve a la pantalla de crear personaje.
export function reiniciarPartida() {
    datos.borrarTodo();
    seguridad.quitar();
    estado = datos.estadoInicial();
    ui.diaSeleccionado = null;
    $("#juego").hidden = true;
    $("#cab-nivel").textContent = "";
    mostrarSeccion("hoy");
    $("#crear-personaje form").reset();
    $("#crear-personaje").hidden = false;
}


// ===== Toques en botones =====
// En vez de poner un "listener" en cada botón, escuchamos TODOS los toques
// en el documento y miramos el data-accion del botón tocado.
// Así funciona también con los botones que se dibujan después.

export const ACCIONES = {
    ...ACCIONES_RUNNING,
    ...ACCIONES_FINANZAS,   // (v135)
    ...ACCIONES_MEMENTO,    // (v142)
    ...ACCIONES_GYM,
    ...ACCIONES_PIN,
    ...ACCIONES_TORRE,
    ...ACCIONES_HISTORIAS,
    ...ACCIONES_EFECTOS,
    ...ACCIONES_MAESTRO,
    ...ACCIONES_DIARIO,
    ...ACCIONES_VERSION,
    ...ACCIONES_GENERALES,
};


// ===== Formularios =====
// Cada formulario tiene data-form="...". Recibimos sus valores como objeto:
// { nombre: "Ir al gym", dificultad: "dificil", ... }

const FORMULARIOS = {
    ...FORMULARIOS_RUNNING,
    ...FORMULARIOS_FINANZAS,   // (v135)
    ...FORMULARIOS_MEMENTO,    // (v142)
    ...FORMULARIOS_GYM,
    ...FORMULARIOS_MAESTRO,
    ...FORMULARIOS_DIARIO,
    ...FORMULARIOS_GENERALES,
};


// ===== Conectar eventos =====

function conectarEventos() {
    conectarPesos();   // (v137) los montos de Finanzas muestran los puntos de miles mientras escribes
    document.addEventListener("click", (evento) => {
        if (estado.ajustes.sonido) sonido.despertar();   // el audio solo arranca tras un toque
        if (estado.ajustes.musica) ponerMusica();
        const boton = evento.target.closest("[data-accion]");
        if (boton && !boton.disabled) ACCIONES[boton.dataset.accion]?.(boton);
    });

    document.addEventListener("submit", (evento) => {
        const formulario = evento.target;
        const tipo = formulario.dataset.form;
        if (!tipo) return;
        evento.preventDefault(); // no recargar la página
        const datosFormulario = new FormData(formulario);
        const valores = Object.fromEntries(datosFormulario);
        // Las casillas de los días de la semana (y las del mes) comparten nombre: las leemos todas.
        if (formulario.querySelector('input[name="dias"]')) valores.dias = datosFormulario.getAll("dias");
        if (formulario.querySelector('input[name="diasMes"]')) valores.diasMes = datosFormulario.getAll("diasMes");
        if (formulario.querySelector('input[name="etiquetas"]')) valores.etiquetas = datosFormulario.getAll("etiquetas");   // (v106)
        valores.foco = datosFormulario.getAll("foco");   // revisión semanal: las misiones de foco marcadas
        const salioBien = FORMULARIOS[tipo](valores, formulario);
        const dialogo = formulario.closest("dialog");
        if (salioBien && dialogo && tipo !== "renombrar") dialogo.close();
    });

    // Cerrar una ventana tocando fuera de ella (en el fondo oscuro).
    for (const dialogo of document.querySelectorAll("dialog")) {
        dialogo.addEventListener("click", (evento) => {
            if (evento.target === dialogo) dialogo.close();
        });
    }

    $("#logro-tipo").addEventListener("change", mostrarCamposLogro);
    $("#campo-frecuencia").addEventListener("change", mostrarCamposFrecuencia);
    $("#mision-plantilla").addEventListener("change", usarPlantilla);
    $("#deshacer-boton").addEventListener("click", () => {
        const accion = alDeshacer;
        ocultarDeshacer();
        if (accion) {
            accion();
            sonar("desmarcar");
        }
    });
    conectarGestos();
    conectarArrastre();

    // Buscador de «Tu diario».
    document.addEventListener("input", (evento) => {
        if (evento.target.id !== "diario-buscar") return;
        diarioVista.busqueda = evento.target.value;
        diarioVista.limite = 30;
        pintarListaDiario();
    });

    // Diario: tocar una carita guarda al instante (junto con la frase que hayas escrito).
    document.addEventListener("change", (evento) => {
        // Gimnasio: el peso y las repeticiones se guardan al cambiarlos, sin redibujar (así no se cierra el teclado).
        if (evento.target.matches?.("[data-gym-mision]")) {
            ejecutar(() => acciones.cambiarAjusteGym(estado, "mision", evento.target.value), { mantenerScroll: true });
            return;
        }
        // (v109) La misión que se marca sola al guardar una carrera.
        if (evento.target.matches?.("[data-running-voz]")) {   // (v124) la voz de la carrera
            ejecutar(() => acciones.cambiarVozRunning(estado, evento.target.value), { mantenerScroll: true });
            locutor.despertar();
            hablar(frases.anuncioDePrueba(), { forzar: true });
            return;
        }
        if (evento.target.matches?.("[data-running-mision]")) {
            ejecutar(() => acciones.cambiarMisionRunning(estado, evento.target.value), { mantenerScroll: true });
            return;
        }
        const campo = evento.target.dataset?.gym;
        if (campo) {
            try {
                acciones.anotarSerieGym(estado, Number(evento.target.dataset.ej), Number(evento.target.dataset.serie), campo, evento.target.value);
                datos.guardar(estado);
            } catch (error) {
                alert(error.message);
                dibujarPantalla({ mantenerScroll: true });   // vuelve a poner el valor que sí valía
            }
            return;
        }
        // (v106) El ánimo, la energía y las etiquetas del diario se guardan con un toque.
        if (["animo", "energia", "etiquetas"].includes(evento.target.name) && evento.target.form?.dataset.form === "diario") evento.target.form.requestSubmit();
    });

    // Interruptor de sonido (Ajustes): al encenderlo suena una muestra.
    $("#ajustes-golpe").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "golpe", evento.target.checked)));
    $("#ajustes-eventos").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "eventos", evento.target.checked)));
    $("#ajustes-esencial").addEventListener("change", (evento) => cambiarModoEsencial(evento.target.checked));
    $("#ajustes-musica-auto").addEventListener("change", (evento) => {
        ejecutar(() => acciones.cambiarAjuste(estado, "musicaAuto", evento.target.checked));
        ponerMusica();
    });
    $("#ajustes-preguntar-animo").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "preguntarAnimo", evento.target.checked)));
    $("#dialogo-animo").addEventListener("cancel", (evento) => { if (despuesDeAnimo) evento.preventDefault(); });   // al abrir la app hay que elegir una opción
    $("#ajustes-esencial-al-abrir").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "esencialAlAbrir", evento.target.checked)));
    $("#ajustes-cinematicas").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "cinematicas", evento.target.checked)));
    // Tocar el fondo del golpe con timing = golpear.
    $("#golpe").addEventListener("pointerdown", () => golpear());
    // Tocar fuera de la escena del robo la cierra (pero no con el mismo toque que la abrió).
    $("#robo").addEventListener("click", (evento) => {
        if (evento.target === evento.currentTarget && Date.now() - roboDesde > 900) cerrarRobo();
    });
    // Deslizar la carta del ritual: → la hiciste, ← no.
    conectarCartaRitual();

    $("#ajustes-sonido").addEventListener("change", (evento) => {
        ejecutar(() => acciones.cambiarAjuste(estado, "sonido", evento.target.checked));
        sonar("completar");
    });

    // Música: encender/apagar, elegir pista y volumen (el volumen cambia mientras arrastras;
    // se guarda al soltar).
    $("#ajustes-musica").addEventListener("change", (evento) => {
        ejecutar(() => acciones.cambiarAjuste(estado, "musica", evento.target.checked));
        ponerMusica();
    });
    $("#ajustes-pistas").addEventListener("change", (evento) => {
        if (evento.target.name !== "pista") return;
        ejecutar(() => acciones.elegirMusica(estado, evento.target.value));
        $("#ajustes-musica").checked = true;
        ponerMusica();
    });
    $("#ajustes-volumen").addEventListener("input", (evento) => musica.ajustarVolumen(Number(evento.target.value) / 100));
    $("#ajustes-volumen").addEventListener("change", (evento) => {
        ejecutar(() => acciones.cambiarVolumen(estado, Number(evento.target.value) / 100));
        ponerMusica();
    });

    $("#archivo-respaldo").addEventListener("change", (evento) => {
        const archivo = evento.target.files[0];
        evento.target.value = ""; // permite elegir el mismo archivo otra vez
        if (archivo) importar(archivo);
    });

    $("#celebracion").addEventListener("click", siguienteCelebracion);

    // Botones de la ventana del minijuego.
    $("#mj-salir").addEventListener("click", cerrarMinijuego);
    $("#mj-cerrar").addEventListener("click", cerrarMinijuego);
    $("#mj-otra").addEventListener("click", () => jugarMinijuego(juegoActual));

    // Teclado del PIN: con el dedo...
    $("#teclado").addEventListener("click", (evento) => {
        const tecla = evento.target.closest("[data-tecla]");
        if (tecla) teclaPulsada(tecla.dataset.tecla);
    });
    // ...o con el teclado físico (útil al probar en la compu).
    document.addEventListener("keydown", (evento) => {
        if ($("#bloqueo").hidden) return;
        if (/^[0-9]$/.test(evento.key)) teclaPulsada(evento.key);
        if (evento.key === "Backspace") teclaPulsada("borrar");
    });

    // Cuando la app se va a segundo plano (cambias de app o bloqueas el iPhone)
    // y cuando vuelve.
    // Aviso de versión nueva: recargar la página carga el código nuevo.
    $("#actualizar-ahora").addEventListener("click", () => window.location.reload());

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") buscarActualizacion();
        // La música se pausa al salir y al volver sigue donde iba (si el navegador no deja, con el próximo toque).
        if (document.visibilityState === "hidden") musica.pausar();
        else ponerMusica();
        if (!estado.personaje) return;

        if (document.visibilityState === "hidden") {
            // Con PIN, tapamos todo al salir: así ni la vista previa del
            // selector de apps del iPhone muestra tus datos.
            if (seguridad.hayPin() && $("#bloqueo").hidden) {
                ocultaDesde = Date.now();
                pedirPinParaEntrar(alVolver);
            }
            return;
        }

        // Volviste. Si fue hace menos de 1 minuto, entras sin PIN.
        if (ocultaDesde !== null) {
            const fuera = Date.now() - ocultaDesde;
            ocultaDesde = null;
            if (fuera < GRACIA_MS) {
                cerrarTeclado();
                $("#juego").hidden = false;
                alVolver();
            }
            entrarConFaceId(alVolver, { silencioso: true });
            return; // si no, el teclado ya está esperando tu PIN (o Face ID)
        }
        if (!$("#juego").hidden) alVolver();
    });
}

// Al volver a la app: redibujar (por si cambió el día) y revisar el bonus de regreso.
function alVolver() {
    ui.diaVisto = "hoy";   // por si cambió el día mientras la app estaba cerrada
    refrescar();
    revisarAlAbrir();
}


// ¡A jugar!
iniciar();
