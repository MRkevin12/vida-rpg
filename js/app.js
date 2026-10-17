// app.js — El "director" de la app.
//
// 1. Carga la partida y muestra la pantalla correcta.
// 2. Escucha los toques en botones y los envíos de formularios.
// 3. Llama a la acción que corresponde (acciones.js), guarda (datos.js)
//    y vuelve a dibujar (vistas.js).
// 4. Muestra las animaciones y celebraciones.

import * as datos from "./datos.js";
import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as seguridad from "./seguridad.js";
import * as avatar from "./avatar.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as desafios from "./desafios.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as leyendas from "./leyendas.js";
import * as sprites from "./sprites.js";
import * as cinematicas from "./cinematicas.js";
import * as cine from "./cine.js";
import * as cinesReino from "./cinematicas-reino.js";
import * as pergaminos from "./pergaminos.js";
import * as libros from "./libros.js";
import * as vistasVoces from "./vistas-voces.js";
import * as vistasGym from "./vistas-gym.js";
import * as vistasRunning from "./vistas-running.js";   // (v109) la pestaña Running
import * as running from "./running.js";
import * as ruta from "./ruta.js";
import * as encuentros from "./encuentros.js";   // (v119) criaturas en tus carreras
import * as frases from "./frases.js";           // (v128) lo que dice la voz de la carrera
import * as locutor from "./locutor.js";         // (v128) las voces grabadas
import * as vocesModulo from "./voces.js";
import * as vida from "./vida.js";
import * as gym from "./gym.js";
import * as diario from "./diario.js";
import * as pacto from "./pacto.js";
import * as libro from "./libro.js";
import * as maestro from "./maestro.js";
import * as memorias from "./memorias.js";
import * as saga from "./saga.js";
import * as rituales from "./rituales.js";
import * as mascota from "./mascota.js";
import * as mapa from "./mapa.js";
import { eventoDelDia } from "./eventos.js";
import { PINTURAS, fuentePintura, ponerPinturaPixel } from "./pinturas.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "./plantillas.js";
import * as minijuegos from "./minijuegos.js";
import * as sonido from "./sonido.js";
import * as musica from "./musica.js";
import * as equipo from "./equipo.js";
import * as avisos from "./avisos.js";
import * as nube from "./nube.js";
import { VERSION_APP, NOVEDADES, novedadesPorVer } from "./novedades.js";
import { calcularResumen, semanaPorMostrar } from "./resumen.js";
import { dibujarAvatar, dibujarAvatarGym } from "./dibujo.js";
import { vigilarIconos } from "./iconos.js";
import { retratoPixel, figuraPixel, dioramaPixel, cuerpoGymPixel } from "./retratos.js";
import * as fx from "./efectos.js";
import { dibujarInsignia } from "./dibujo-insignias.js";   // (v101)   // fx = "efectos especiales", como en el cine (v94)
import { prepararPinturas } from "./pixel-pintura.js";   // (v95) las pinturas en pixel art
import { hoy, fechaLegible, diasEntre, sumarDias, relojTexto, relojLargo, DIAS_LETRAS, DIAS_CORTOS } from "./fechas.js";


// ===== Estado de la app =====
let estado = datos.cargar();     // la partida completa
let pantallaActual = "hoy";      // qué pestaña se está viendo
let diaSeleccionado = null;      // día tocado en el calendario
let diaVisto = "hoy";            // en la pantalla Hoy: "hoy" o "ayer" (por si olvidaste marcar algo)
let rangoResumen = 7;            // en Progreso: el resumen muestra los últimos 7 o 30 días
// Pantalla «Tu diario»: el mes que se ve (null = el actual), el día tocado, la búsqueda,
// el filtro de ánimo y cuántas entradas se muestran.
const diarioVista = { mes: null, dia: null, busqueda: "", filtro: null, limite: 30 };
let fraseGym = null;               // (v76) lo último que te dijo Aurelio en el gimnasio: { tipo, texto } o null
let resumenGym = null;             // (v76) el entrenamiento que acabas de terminar (para mostrar su resumen)
let gymVista = null;               // (v75) la vista previa del cuerpo en el gimnasio: { fisico, corp } o null
let descansoGym = null;          // (v66) el descanso entre series del gym: { fin, total } (milisegundos), o null
let runTipo = "suave";           // (v109) el tipo de carrera que vas a empezar en la pestaña Running
let seguimientoGps = null;       // (v109) el id del seguimiento de posición del GPS mientras corres, o null
let gpsProblema = null;          // (v109) por qué no hay GPS: "permiso" o "senal", o null
let pantallaDeDespierta = null;  // (v109) el «wake lock»: la pantalla no se apaga mientras corres
let renovandoPacto = false;      // en «Tu pacto»: true mientras vuelves a firmarlo
let paginaLibro = "portada";     // en «Tu libro»: "portada", "indice" o el número de un capítulo
let problemaAvisos = null;       // si las notificaciones se cortaron: "bloqueadas" o "desconectadas"
let runTerminando = false;       // (v129) en la carrera en vivo: tocaste «Ya terminé» y se ve el formulario de guardar
let pausoParaTerminar = false;   // y la carrera estaba corriendo: la pausamos nosotros (si te arrepientes, se reanuda)
let regionMapa = null;           // en el mapa: la región que miras (null = donde vas)
let maestroVista = { modo: "inicio", respuesta: "" };   // la conversación con el Maestro
let memoriasDesde = null;   // cuántas memorias de Aurelio habías leído al abrirlas (las demás se marcan «Nuevo»)
let ritual = null;               // el ritual de la noche en curso: { paso, cola, indice, motivo }
let golpe = null;                // el golpe con timing en curso
let alCerrarRobo = null;         // qué hacer cuando se cierre la escena del robo de vida
// Las secciones elegidas en las pantallas largas (el selector de arriba): solo se ve una a la vez.
const subvista = { progreso: "numeros", tienda: "recompensas", personaje: "equipo", gym: "entrenar", running: "correr" };
let agruparHoy = "atributo";   // (v51) en Hoy, las misiones se agrupan por "atributo" o por "momento"
let campanaVista = null;         // en Aventuras: qué campaña de jefes se ve (null = la del jefe más cerca de caer)
let roboDesde = 0;               // cuándo se abrió (para no cerrarla con el mismo toque)

// Modo esencial (v46): las únicas pantallas que quedan a la mano. Si lo enciendes estando en otra, vuelves a Hoy.
const PANTALLAS_ESENCIALES = new Set(["hoy", "tienda", "enfoque", "gym"]);

// Las pantallas sin pestaña propia iluminan la pestaña de la que dependen.
const PESTANA_DE = { mapa: "aventuras", arcade: "aventuras", voces: "aventuras", enfoque: "hoy", gym: "hoy", running: "hoy", diario: "hoy", libro: "hoy", pacto: "personaje", memorias: "personaje", pergamino: "personaje", biblioteca: "personaje", novela: "personaje" };

// Atajo: $("#algo") es lo mismo que document.querySelector("#algo")
const $ = (selector) => document.querySelector(selector);

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
    libro: vistas.pantallaLibro,
    mapa: vistas.pantallaMapa,
    memorias: vistas.pantallaMemorias,
    pergamino: vistas.pantallaPergamino,
    biblioteca: vistas.pantallaBiblioteca,
    novela: vistas.pantallaNovela,
};

// Lo que el dibujo del avatar necesita saber en este momento.
function avatarActual() {
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
const CARGA_DURACION = 4000;
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

function entrarAlJuego({ nuevo = false } = {}) {
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

function preguntarAnimo(despues = null) {
    despuesDeAnimo = despues;
    const ahora = new Date();
    const dia = Math.floor(ahora.getTime() / 86400000);
    $("#dialogo-animo").innerHTML = vistas.pantallaAnimo(estado.personaje.nombre, ahora.getHours(), dia);
    $("#dialogo-animo").showModal();
}

function elegirAnimo(animo) {
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
        if (problema === problemaAvisos) return;
        problemaAvisos = problema;
        if (estado.personaje && !$("#juego").hidden) dibujarPantalla();
    }).catch(() => {});
    // La copia del día en la nube (si está activada). Sin internet, se intenta la próxima vez.
    nube.copiaDiaria(estado).then((hecha) => { if (hecha) avisar("☁️ Copia del día guardada en la nube"); });
}

// Reloj del modo enfoque: cada segundo cambia solo el texto del tiempo y el anillo
// (sin redibujar la pantalla). Al llegar a 0, entrega el premio.
// (v118) Tu héroe en el mapa de la carrera: el dibujo se pixela una sola vez y se reutiliza cada vez que el mapa se redibuja.
let heroeDeCarrera = null;
async function ponerHeroeEnMapaVivo() {
    if (!heroeDeCarrera) heroeDeCarrera = await sprites.spriteDeHeroeEnMapa(avatarActual());
    for (const img of document.querySelectorAll(".run-mapa-heroe")) img.src = heroeDeCarrera;
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
    const lineas = [`⚡ ${running.textoRitmo(running.ritmoEnVivo(en, ahora))}${en.objetivo ? `   🎯 ${running.textoSegundos(en.objetivo)} /km` : ""}`];
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
async function mostrarNotificacionCarrera({ sonando = false } = {}) {
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

// (v119) La imagen de la criatura del km: en la tarjeta de la pelea y en el mapa. Se pixela una vez por criatura.
const criaturasDeCarrera = {};
async function ponerCriaturasDeCarrera() {
    const pelea = estado.running.encurso?.encuentros?.find((e) => !e.resultado);
    if (!pelea) return;
    if (!criaturasDeCarrera[pelea.id]) criaturasDeCarrera[pelea.id] = await sprites.spriteDeMonstruo(pelea.id, avatarActual());
    const src = criaturasDeCarrera[pelea.id];
    const tarjeta = document.querySelector("[data-run-criatura]");
    if (tarjeta && tarjeta.dataset.runCriatura !== pelea.id) { tarjeta.src = src; tarjeta.dataset.runCriatura = pelea.id; }
    for (const img of document.querySelectorAll(".run-mapa-criatura")) if (img.src !== src) img.src = src;
}

// (v117) Mientras corres, una barra pegada arriba de las pestañas muestra el tiempo, los km y el ritmo en TODAS las pantallas
// (menos en Running, que ya lo muestra grande). Tocarla te lleva a la carrera. Una página web no puede seguir mostrándose con
// el teléfono bloqueado o con otra app abierta: eso lo impide iOS. Por eso la pantalla se mantiene encendida mientras corres.
function actualizarBarraRun() {
    const barra = $("#run-barra");
    if (!barra) return;
    const en = estado.running?.encurso;
    barra.hidden = !en || pantallaActual === "running";
    if (barra.hidden) return;
    const tiempo = running.tiempoDeEncurso(en, Date.now());
    barra.innerHTML = `<b>🏃 ${running.textoTiempo(tiempo)}</b>${en.gps ? `<span>${running.textoKm(en.distancia / 1000)}</span><span>${running.textoRitmo(running.ritmoEnVivo(en, Date.now()))}</span>` : ""}${en.pausadoDesde ? "<span>⏸ en pausa</span>" : ""}`;
}

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
        if (ritmo) ritmo.textContent = running.textoRitmo(running.ritmoEnVivo(en, ahora));
        const aviso = document.querySelector("[data-run-gps]");
        if (aviso) aviso.textContent = vistasRunning.textoGps(en, gpsProblema);
        // (v118) El mapa de la carrera y el avance de la ruta: se vuelven a dibujar solo cuando llega un punto nuevo del GPS.
        const caja = document.querySelector("[data-run-mapa]");
        const firma = `${(en.traza || []).length}:${(en.puntosKm || []).length}`;
        if (caja && caja.dataset.n !== firma) {
            caja.innerHTML = vistasRunning.htmlMapaVivo(en.traza, en.puntosKm, vistasRunning.opcionesDelMapa(en));
            caja.dataset.n = firma;
            ponerHeroeEnMapaVivo();
            const textoRuta = document.querySelector("[data-run-ruta]");
            if (textoRuta) textoRuta.textContent = vistasRunning.textoRutaEnVivo(estado, en);
        }
        // (v119) La pelea del km: el texto cada segundo; la imagen de la criatura solo cuando cambia.
        const pelea = document.querySelector("[data-run-encuentro]");
        if (pelea) pelea.innerHTML = vistasRunning.htmlEncuentro(en, ahora);
        ponerCriaturasDeCarrera();
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
            descansoGym = null;
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

// El service worker guarda los archivos en el teléfono para que la app funcione sin internet.
// ===== El running: GPS y pantalla encendida (v109) =====
// El GPS del teléfono manda puntos mientras la app esté abierta. Cada punto suma metros a la carrera (ver running.js).
function iniciarGps() {
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
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
}

// (v116) Cada kilómetro: un sonido, un aviso en pantalla y, si está activada la voz, tu tiempo hablado.
function anunciarKilometro(numero, segundos, resueltos = [], nuevo = null) {
    // (v119) La pelea del km que terminó y la criatura que aparece. (v128) Con voz grabada o la del teléfono, y una frase de ánimo.
    const pelea = resueltos.at(-1);
    const fin = !pelea ? "" : pelea.resultado === "vencida" ? `¡Venciste a ${encuentros.nombreDe(pelea)}!` : `${encuentros.nombreDe(pelea)} escapó.`;
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
async function hablar(piezas, { forzar = false } = {}) {
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
function poblarVocesRunning() {
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
async function mantenerPantallaDespierta(encendida) {
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

let registroSW = null;   // para poder pedirle al teléfono que busque actualizaciones

function registrarServiceWorker() {
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
function buscarActualizacion() {
    if (registroSW && navigator.onLine) registroSW.update().catch(() => {});
}

// Muestra en Ajustes qué versión está guardada en el teléfono (el nombre de la caché).
function mostrarVersion() {
    if (!("caches" in window)) return;
    caches.keys().then((nombres) => {
        const version = nombres.find((n) => n.startsWith("vida-rpg-"));
        $("#ajustes-version").textContent = version
            ? `Versión instalada: ${version.replace("vida-rpg-", "")}`
            : "Versión: sin guardar todavía (abre la app con internet)";
    }).catch(() => {});
}


// ===== Bloqueo con PIN =====
// La misma pantalla de teclado sirve para tres cosas: entrar, crear un PIN
// y confirmar que eres tú antes de cambiarlo. "alCompletar" dice qué hacer
// cuando se escriben los 4 números; si devuelve false, los puntos tiemblan.

const GRACIA_MS = 60 * 1000;   // si vuelves a la app antes de 1 minuto, no pide PIN
let pinEscrito = "";
let alCompletarPin = null;
let ocultaDesde = null;        // cuándo se fue la app a segundo plano
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

function cerrarTeclado() {
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

async function teclaPulsada(tecla) {
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
function pedirPinParaEntrar(alEntrar) {
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
async function entrarConFaceId(alEntrar, { silencioso = false } = {}) {
    if (!seguridad.hayFaceId() || $("#bloqueo").hidden) return;
    try {
        if (await seguridad.comprobarFaceId()) desbloquear(alEntrar);
        else if (!silencioso) ponerMensaje("No se pudo comprobar. Usa tu PIN.", true);
    } catch {
        if (!silencioso) ponerMensaje("Face ID no respondió. Usa tu PIN.", true);
    }
}

// Crear un PIN nuevo: escribirlo y repetirlo.
function crearPin({ conAhoraNo = false, mensaje = "Elige 4 números", error = false } = {}) {
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


// ===== El mapa del reino =====
// La pantalla se dibuja sin la imagen del mapa: hacerla (pixel art) tarda un instante, así que
// se pone aquí después. pixel.js la guarda: si no cambió nada, la segunda vez sale al instante.
async function pintarMapa() {
    const caja = $(".mapa-pixel");
    if (!caja) return;
    const region = Number(caja.dataset.region);
    const datos = mapa.datosParaDibujar(estado, region, campana.estadoCampanas(estado));
    const a = avatarActual();
    const [imagen, heroe, compania] = await Promise.all([
        sprites.spriteDeMapa(datos),
        $("#mapa-heroe") ? sprites.spriteDeHeroeEnMapa(a) : null,
        $("#mapa-mascota") ? sprites.spriteDeMascotaEnMapa(a.mascota) : null,
    ]);
    // Si mientras tanto cambiaste de región o de pantalla, esta imagen ya no va.
    if ($(".mapa-pixel") !== caja) return;
    if (imagen) $("#mapa-imagen").src = imagen;
    if (heroe) $("#mapa-heroe").src = heroe;
    if (compania) $("#mapa-mascota").src = compania;
    caja.classList.add("listo");
}


// ===== Minijuegos =====

let partida = null;        // el minijuego que se está jugando (para poder detenerlo)
let juegoActual = null;    // qué minijuego es ("carrera", "lluvia" o "golpe")

async function jugarMinijuego(tipo) {
    // Gastar la ficha (si no hay, ejecutar() muestra el mensaje y devuelve null).
    if (!ejecutar(() => acciones.empezarPartida(estado, tipo))) return;

    const minijuego = arcade.JUEGOS[tipo];
    juegoActual = tipo;
    $("#mj-titulo").textContent = `${minijuego.icono} ${minijuego.nombre}`;
    $("#mj-final").hidden = true;
    $("#mj-marcador").textContent = "Cargando…";
    $("#minijuego").hidden = false;   // primero se muestra, para que el lienzo tenga tamaño

    partida = await minijuegos.jugar(tipo, {
        lienzo: $("#mj-lienzo"),
        avatarSvg: dibujarAvatar(avatarActual(), { batalla: true, sinEfectos: true }),
        pixel: tipo === "golpe" ? await escenaDeGolpe() : null,
        marcador: $("#mj-marcador"),
        ayuda: $("#mj-ayuda"),
        alTerminar: (puntos) => terminarMinijuego(tipo, puntos),
        sonar,
        ventajas: arcade.ventajasDelEquipo(acciones.equipoDeBatalla(estado)),   // lo que te da tu equipo
    });
}

// "Golpe preciso" se ve como una batalla de la Torre: tu héroe contra una criatura de las
// que ya conoces (si todavía no subiste nunca, una de la primera zona), en su sala.
async function escenaDeGolpe() {
    const conocidas = bestiario.ORDEN.filter((id) => estado.arcade.bestiario[id]);
    const posibles = conocidas.length ? conocidas : bestiario.ORDEN.slice(0, bestiario.PISOS_POR_ZONA - 1);
    const id = posibles[Math.floor(Math.random() * posibles.length)];
    const criatura = bestiario.CRIATURAS[id];
    const [heroe, rival, sala] = await Promise.all([
        sprites.spriteDeHeroe(avatarActual()),
        sprites.spriteDeMonstruo(id),
        sprites.spriteDeSala(criatura.zona),
    ]);
    return { heroe, rival, sala, nombre: criatura.nombre };
}

function terminarMinijuego(tipo, puntos) {
    partida = null;
    const resultado = ejecutar(() => acciones.terminarPartida(estado, tipo, puntos));
    if (!resultado) return;

    const atributo = juego.ATRIBUTOS[arcade.JUEGOS[tipo].atributo];
    $("#mj-puntos").textContent = `${resultado.puntos} ${resultado.puntos === 1 ? "punto" : "puntos"}`;
    $("#mj-record").textContent = resultado.nuevoRecord ? "🏅 ¡Nuevo récord!" : `🏅 Récord: ${resultado.record}`;
    $("#mj-premio").textContent = `+${resultado.premio.gemas} 💎 · +${resultado.premio.xp} XP de ${atributo.icono} ${atributo.nombre}` +
        (resultado.reto ? ` · 🎯 ¡Reto del día! ${vistas.textoPremioReto(resultado.reto)}` : "");
    const fichas = arcade.fichasDisponibles(estado);
    $("#mj-otra").disabled = fichas < 1;
    $("#mj-otra").textContent = fichas ? `Otra vez · 🎟️ ${fichas}` : "Sin fichas";
    $("#mj-final").hidden = false;
    if (resultado.nuevoRecord) sonar("logro");
}

// ===== Torre del héroe y Mazmorra del Abismo =====
// Son por turnos, así que no usan lienzo: se vuelven a dibujar después de cada acción.
// Las dos usan la misma capa (#torre); lugarAbierto dice cuál se está jugando.

let lugarAbierto = "torre";     // "torre" o "mazmorra"
let resultadoTorre = null;      // lo que se cobró al terminar (para mostrar el resumen)
let menuTorre = "principal";    // qué comandos se ven: "principal", "magia" (los hechizos) o "tecnicas" (v38)
let ultimoComando = "atacar";   // el último comando que usaste: ahí queda la manito
let ultimoHechizo = "fuego";    // y el último hechizo, dentro de «Magia»
let ultimaTecnica = "quebrar";  // y la última técnica, dentro de «Técnicas»
// La historia que se está contando (ver leyendas.js): { relato, pagina, salas } o null.
let relatoEnCurso = null;
// Las imágenes en pixel art de la batalla (ver sprites.js). Hacerlas tarda un instante,
// así que se preparan ANTES de dibujar (con await) y se guardan aquí.
const spritesTorre = { heroe: null, enemigo: null, sala: null, mascota: null, maestro: null };

async function prepararSprites() {
    const partida = estado.arcade[lugarAbierto];
    spritesTorre.heroe = await sprites.spriteDeHeroe(avatarActual());
    spritesTorre.maestro = await sprites.spriteDeMaestro(maestro.describirMaestro());   // su cara, para sus consejos
    if (!partida) return;   // al cobrar ya no hay partida: quedan la sala y la criatura de antes
    [spritesTorre.enemigo, spritesTorre.sala, spritesTorre.mascota] = await Promise.all([
        sprites.spriteDeMonstruo(partida.enemigo.id, avatarActual()),   // (el Reflejo sombrío es tu héroe)
        sprites.spriteDeSala(bestiario.zonaDelPiso(partida.piso, partida.lugar).id),
        partida.mascota ? sprites.spriteDeMascota(partida.mascota) : null,
    ]);
}

// Empieza a contar una historia (relato = { paginas }), con la sala de fondo de cada página.
async function mostrarRelato(relato) {
    const salas = await Promise.all(relato.paginas.map((p) => sprites.spriteDeSala(p.sala)));
    relatoEnCurso = { relato, pagina: 0, salas };
    pintarTorre();
    $("#torre-caja").scrollTop = 0;
}

function pintarTorre(eventos = []) {
    if (relatoEnCurso) {
        const { relato, pagina, salas } = relatoEnCurso;
        $("#torre-caja").innerHTML = vistas.pantallaRelato({
            pagina: relato.paginas[pagina], sala: salas[pagina], numero: pagina + 1, total: relato.paginas.length,
        });
        return;
    }
    $("#torre-caja").innerHTML = vistas.pantallaTorre({
        partida: estado.arcade[lugarAbierto],
        nombre: estado.personaje.nombre,
        sprites: spritesTorre,
        eventos,
        menu: menuTorre,
        ultimo: menuTorre === "magia" ? ultimoHechizo : menuTorre === "tecnicas" ? ultimaTecnica : ultimoComando,
        bestiario: estado.arcade.bestiario,
        resultado: resultadoTorre,
        fichas: arcade.fichasDisponibles(estado),
    });
}

// lugar: "torre" o "mazmorra".
// marca (v41): la que elegiste en la tarjeta del Arcade ("" o null = sin marca). Solo cuenta en una partida nueva.
async function abrirTorre(lugar = "torre", marca = null, modo = "normal") {
    // Si no hay partida, empezar una (gasta 1 ficha). Si hay, se sigue esa.
    lugarAbierto = lugar;
    resultadoTorre = null;
    relatoEnCurso = null;
    menuTorre = "principal";
    const resultado = ejecutar(() => acciones.empezarTorre(estado, undefined, lugar, marca || null, modo));
    if (!resultado) return;
    await prepararSprites();
    $("#torre").hidden = false;
    // La primera vez, antes de pelear, se cuenta cómo empieza la historia.
    if (resultado.relato) await mostrarRelato(resultado.relato);
    else pintarTorre();
    ponerMusica();   // en la Torre suena la música de batalla; en la Mazmorra, «Abismo»
    if (!resultado.relato) vozDeLlegada();   // (v58) la criatura que te espera
    // Si quedó una cinemática sin ver (saliste justo antes), se ve ahora; si empieza el relato, ese ya cuenta la historia.
    if (resultado.relato) descartarCinematica(lugar);
    else await reproducirCinematica(lugar);
}

// ===== Cinemáticas (v43) =====
// Cuál toca lo anota torre.js en la partida (`partida.cine`); qué se ve, cinematicas.js; cómo se reproduce, cine.js.
// Se borra al tomarla, así que se ve una sola vez. Siempre se puede saltar, y se apagan en Ajustes.
function descartarCinematica(lugar) {
    acciones.tomarCinematica(estado, lugar, false);
    datos.guardar(estado);
}

async function reproducirCinematica(lugar = lugarAbierto) {
    if ($("#torre").hidden) return;   // saliste de la Torre: se verá al volver
    const toca = acciones.tomarCinematica(estado, lugar);
    datos.guardar(estado);
    if (!toca) return;
    const partida = estado.arcade[lugar];
    const cinematica = cinematicas.cinematicaDe(toca.tipo, partida, estado.personaje.nombre);
    if (!cinematica) return;
    const zonas = cinematicas.fondosDe(cinematica);
    const [heroe, criatura, ...salas] = await Promise.all([
        sprites.spriteDeHeroe(avatarActual()),
        sprites.spriteDeMonstruo(partida.enemigo.id, avatarActual()),
        ...zonas.map((zona) => sprites.spriteDeSala(zona)),
    ]);
    const imagenes = {
        heroe, criatura, tallaCriatura: bestiario.CRIATURAS[partida.enemigo.id]?.talla || 96,
        salas: Object.fromEntries(zonas.map((zona, i) => [zona, salas[i]])),
    };
    await cine.reproducir(cinematica, imagenes, { sonar });
}

// ===== Más cinemáticas (v56): el reino, el arcade, Las Voces del Valle y la historia =====
// Los datos están en cinematicas-reino.js. Cada una sale una sola vez (estado.mapa.cines) y se puede volver a ver con un botón.

// Prepara las imágenes que necesita una cinemática (tu héroe, Aurelio, las personas de la aldea, los jefes, las salas…) y la reproduce.
async function reproducirEscena(cinematica, { criatura = null } = {}) {
    if (!cinematica || !$("#cine").hidden) return;
    const quienes = cinesReino.actoresDe(cinematica);
    const jefes = new Map(Object.values(campana.CAMPANAS).flatMap((c) => c.jefes.map((j) => [j.id, j])));
    const salas = cinesReino.salasDe(cinematica);
    const imagenes = { salas: {}, actores: {}, retratos: {}, tallaCriatura: 96 };
    const tareas = [];
    for (const quien of quienes) {
        if (quien === "heroe") tareas.push(sprites.spriteDeHeroe(avatarActual()).then((d) => { imagenes.heroe = d; }));
        else if (quien === "maestro") tareas.push(sprites.spriteDeMaestroCuerpo(maestro.describirMaestro()).then((d) => { imagenes.actores.maestro = d; }));
        else if (quien === "criatura" && criatura) {
            imagenes.tallaCriatura = bestiario.CRIATURAS[criatura]?.talla || 96;
            tareas.push(sprites.spriteDeMonstruo(criatura, avatarActual()).then((d) => { imagenes.criatura = d; }));
        } else if (jefes.has(quien)) imagenes.retratos[quien] = campana.imagenDe(quien);
        else if (vocesModulo.personaDe(quien)) tareas.push(sprites.spriteDePersona(quien).then((d) => { imagenes.actores[quien] = d; }));
    }
    for (const sala of salas) tareas.push(sprites.spriteDeSala(sala).then((d) => { imagenes.salas[sala] = d; }));
    await Promise.all(tareas);
    await cine.reproducir(cinematica, imagenes, { sonar });
}

// Las cinemáticas que tocan al abrir una pantalla: el mapa (región nueva, guaridas liberadas, fortalezas abiertas),
// el arcade y la aldea. Como máximo 3 por visita, para no abrumar; las demás esperan a la próxima.
async function revisarCines(pantalla) {
    if (!estado.personaje || !$("#cine").hidden || pantallaActual !== pantalla) return;
    const nombre = estado.personaje.nombre;
    const pendientes = [];
    const nuevo = (clave) => !estado.mapa.cines.includes(clave);
    if (pantalla === "arcade" && nuevo(cinesReino.CLAVE_ARCADE)) pendientes.push({ clave: cinesReino.CLAVE_ARCADE, cine: cinesReino.cinematicaDeArcade(nombre) });
    if (pantalla === "voces" && nuevo(cinesReino.CLAVE_VOCES)) pendientes.push({ clave: cinesReino.CLAVE_VOCES, cine: cinesReino.cinematicaDeVoces(nombre) });
    if (pantalla === "mapa") {
        const pos = mapa.posicion(estado);
        const campanas = campana.estadoCampanas(estado);
        // (v89) En orden de historia: de la primera región a la tuya; en cada una, primero llegas, luego caen los señores y al
        // final se abre la fortaleza. Así, al pasar una fortaleza, su escena sale antes que la de la región siguiente.
        for (let region = 0; region <= pos.region; region++) {
            if (region === pos.region && nuevo(cinesReino.claveDeRegion(region))) {
                pendientes.push({ clave: cinesReino.claveDeRegion(region), cine: cinesReino.cinematicaDeRegion(region, nombre) });
            }
            for (const s of mapa.senoresDeRegion(region, campanas)) {
                const clave = cinesReino.claveDeSenor(s.id);
                if (s.tipo === "guarida" && s.liberada && (region < pos.region || s.n <= pos.enRegion) && nuevo(clave)) {
                    pendientes.push({ clave, cine: cinesReino.cinematicaDeSenor(s, region, juego.ATRIBUTOS[s.categoria], nombre) });
                }
            }
            const clave = cinesReino.claveDeFortaleza(region);
            if (region < pos.region && mapa.regionLiberada(region, campanas) && nuevo(clave)) {
                pendientes.push({ clave, cine: cinesReino.cinematicaDeFortaleza(region, nombre) });
            }
        }
    }
    for (const { clave, cine: escena } of pendientes.slice(0, 3)) {
        const toca = acciones.verCinematica(estado, clave);
        datos.guardar(estado);
        if (toca) await reproducirEscena(escena);
    }
    // Con las cinemáticas apagadas (Ajustes) no se reproduce ninguna: todas se anotan como vistas.
    if (estado.ajustes.cinematicas === false) {
        for (const { clave } of pendientes) acciones.verCinematica(estado, clave);
        datos.guardar(estado);
    }
}

// Cuando una persona de la aldea recupera su voz (y cuando toda la aldea habla): una escena corta.
async function cinematicaDeLaAldea(resultado) {
    if (!resultado?.terminada) return;
    if (resultado.fin === "bien") {
        const persona = vocesModulo.personaDe(resultado.persona);
        const clave = cinesReino.claveDeVoz(resultado.id);
        if (persona && acciones.verCinematica(estado, clave)) {
            datos.guardar(estado);
            const lugar = vocesModulo.LUGARES?.[persona.lugar];
            await reproducirEscena(cinesReino.cinematicaDeVoz(
                { id: resultado.persona, nombre: persona.nombre, voz: persona.voz, fondo: lugar?.fondo }, estado.personaje.nombre));
        }
    }
    if (resultado.epilogo && acciones.verCinematica(estado, cinesReino.CLAVE_EPILOGO)) {
        datos.guardar(estado);
        await reproducirEscena(cinesReino.cinematicaDelEpilogo(estado.personaje.nombre));
    }
}

// El bestiario y la historia se muestran en la misma capa que la Torre (se cierran con la misma ✕).
async function abrirBestiario() {
    const imagenes = await sprites.spritesDeCriaturas(avatarActual());
    $("#torre-caja").innerHTML = vistas.pantallaBestiario({
        bestiario: estado.arcade.bestiario, sprites: imagenes, mazmorra: torre.mazmorraAbierta(estado.arcade),
        abiertos: Object.keys(bestiario.LUGARES).filter((lugar) => torre.lugarAbierto(torre.arcadeConGym(estado), lugar)),
    });
    $("#torre").hidden = false;
    $("#torre-caja").scrollTop = 0;
}

// (v62) «El Centinela», el libro largo de Casio: qué capítulo se lee (null = la portada con el índice).
let capituloNovela = null;
let libroNovela = "casio";   // (v70) cuál de los libros largos se lee: "casio" o "orrin"

// La escena con que termina cada libro largo.
async function verEscenaDelLibro(id) {
    const nombre = estado.personaje.nombre;
    if (id === "orrin") await reproducirEscena(cinesReino.cinematicaDeOrrin(nombre), { criatura: "rey-hueco" });
    else await reproducirEscena(cinesReino.cinematicaDeCasio(nombre), { criatura: "centinela" });
}

// (v57) La escena con que termina cada pergamino: dos tomas de su historia, la moraleja de Aurelio y el presagio.
let pergaminoActual = "piedra";   // cuál pergamino se está leyendo

async function verEscenaDePergamino(id) {
    const p = pergaminos.pergaminoDe(id, estado.personaje.nombre);
    if (!p) return;
    await reproducirEscena(cinesReino.cinematicaDePergamino(p, estado.personaje.nombre));
}

// (v56) «▶ Ver escena» de un capítulo de la historia: se cuenta con tomas animadas (Aurelio, el guardián, las salas).
async function verEscenaDeCapitulo(lugar, id) {
    const enCurso = estado.arcade[lugar] ? torre.pisosSuperados(estado.arcade[lugar]) : 0;
    const alcanzado = Math.max(estado.arcade.records[lugar] || 0, enCurso);
    const capitulo = leyendas.capitulosDeLeyenda(lugar, alcanzado, estado.personaje.nombre).find((c) => c.id === id);
    if (!capitulo || !capitulo.abierto) return;
    const sitio = bestiario.lugarDe(lugar);
    const esZona = sitio.zonas.some((z) => z.id === id);
    const fondo = esZona ? id : sitio.zonas[0].id;
    const guardian = esZona ? cinesReino.guardianDeZona(lugar, id) : null;
    await reproducirEscena(
        cinesReino.cinematicaDeCapitulo(capitulo, { lugar, fondo, tieneGuardian: Boolean(guardian) }, estado.personaje.nombre),
        { criatura: guardian });
}

// Lo que ya se puede leer depende de hasta dónde llegaste: tu récord o la partida de ahora.
function abrirHistoria(lugar) {
    const enCurso = estado.arcade[lugar] ? torre.pisosSuperados(estado.arcade[lugar]) : 0;
    const alcanzado = Math.max(estado.arcade.records[lugar] || 0, enCurso);
    $("#torre-caja").innerHTML = vistas.pantallaHistoria({
        lugar, capitulos: leyendas.capitulosDeLeyenda(lugar, alcanzado, estado.personaje.nombre),
    });
    $("#torre").hidden = false;
    $("#torre-caja").scrollTop = 0;
    ponerMusica();   // (v58) la historia se lee con la música de lectura
}

function cerrarTorre() {
    $("#torre").hidden = true;   // la partida queda guardada: se sigue después
    resultadoTorre = null;
    relatoEnCurso = null;
    dibujarPantalla();
    ponerMusica();
}

// ===== Las Voces del Valle (v44) =====
// La aventura de diálogos de Carisma (ver voces.js y vistas-voces.js). La aldea es una pantalla (Aventuras → Las Voces del
// Valle); cada conversación se juega en una capa a pantalla completa (#voces), como la Torre.
let resultadoVoces = null;   // cómo terminó la conversación que acaba de acabar (para mostrar el final)
let verEpilogo = false;      // si se está leyendo el epílogo de la aldea

// Los dibujos de las personas (pixel art) llegan un instante después del HTML.
function pintarRetratosVoces(raiz) {
    for (const imagen of raiz.querySelectorAll("img[data-persona]")) {
        sprites.spriteDePersona(imagen.dataset.persona).then((direccion) => { if (direccion) imagen.src = direccion; });
    }
    for (const imagen of raiz.querySelectorAll("img[data-busto]")) {
        sprites.spriteDeBusto(imagen.dataset.busto).then((direccion) => { if (direccion) imagen.src = direccion; });
    }
}

function pintarEscenaVoces() {
    const caja = $("#voces-caja");
    caja.innerHTML = vistasVoces.pantallaEscena({ estado, nombre: estado.personaje.nombre, hoy: hoy(), resultado: resultadoVoces, epilogo: verEpilogo });
    pintarRetratosVoces(caja);
    caja.scrollTop = 0;
}

// Empieza una conversación (gasta una ficha) o sigue la que dejaste a medias.
function abrirVoces(escenaId) {
    resultadoVoces = null;
    verEpilogo = false;
    if (!ejecutar(() => acciones.empezarEscena(estado, escenaId))) return;
    $("#voces").hidden = false;
    pintarEscenaVoces();
}

// Cerrar la capa no pierde nada: una conversación a medias queda guardada en la partida.
function cerrarVoces() {
    $("#voces").hidden = true;
    resultadoVoces = null;
    verEpilogo = false;
    dibujarPantalla();
}

// En el Arcade, la portada de la Mazmorra es su sala más honda, en pixel art (llega un instante después).
function pintarPortadas() {
    for (const imagen of document.querySelectorAll("img[data-sala]")) {
        sprites.spriteDeSala(imagen.dataset.sala).then((direccion) => { if (direccion) imagen.src = direccion; });
    }
}

// Sonidos de un turno, al compás de las animaciones (tu acción, la de tu mascota y la de la criatura).
// (v58) Cada quien suena a su tiempo, igual que las animaciones y la secuencia de turnos de la pantalla:
//   0 s tu acción · 0,4 s tu mascota · 0,65 s la criatura (su voz y su ataque, con su sonido propio si es especial) · 1 s el fin del turno.
// Cada criatura tiene su voz (sonido.sonarVoz, que respeta el ajuste de sonido): aparece, ataca, se queja cuando le pegas y cae.
const SONIDO_DE_MASCOTA = { dragon: "rugidito", cuervo: "graznido", buho: "ulular", basilisco: "siseo", grifo: "chillido", fenix: "fenix", escarcha: "hielo" };
const SONIDO_DE_ESPECIAL = { veneno: "veneno", drenar: "drenar", sellar: "sellar", coraza: "coraza", barrera: "barrera", carga: "carga", reflejo: "reflejo" };

function sonarTurno(eventos) {
    const partida = estado.arcade[lugarAbierto];
    const criatura = partida?.enemigo?.id;
    const heroe = eventos.find((e) => e.quien === "heroe");
    const mascota = eventos.find((e) => e.quien === "mascota");
    const enemigo = eventos.find((e) => e.quien === "enemigo" && e.tipo !== "derrotado");
    const cayo = eventos.some((e) => e.tipo === "derrotado");
    const veneno = eventos.find((e) => e.quien === "veneno");
    const tarde = (ms, hacer) => setTimeout(hacer, ms);

    // (v63) Una habilidad o un don que se nota: un destello de sonido (en tu acción y, si es de la criatura, en su turno).
    if (heroe?.activas?.length) tarde(120, () => sonar("habilidad"));
    if (enemigo?.activas?.length) tarde(950, () => sonar("habilidad"));

    // 1. Tú
    if (heroe?.tipo === "hechizo") sonar(heroe.elemento);   // "fuego", "hielo" o "rayo"
    if (heroe?.tipo === "atacar" || (heroe?.tipo === "tecnica" && heroe.dano)) sonar("tajo");
    if (heroe?.tipo === "defender") sonar("coraza");
    if (heroe?.tipo === "pocion") sonar("pocion");
    if (heroe?.tipo === "voluntad") sonar("nivel");          // el Golpe de Voluntad
    if (heroe?.tipo === "tecnica" && !heroe.dano) sonar("cursor");   // Analizar o Intimidar
    if (heroe?.reflejado) tarde(250, () => sonar("coraza"));    // su espejo te devolvió el hechizo
    if (heroe?.dano) tarde(300, () => sonar(heroe.critico ? "critico" : "impacto"));
    if (heroe?.cura && heroe.tipo !== "pocion") sonar("moneda");
    // La criatura se queja si le pegaste (y no cayó).
    if (criatura && !cayo && (heroe?.dano || mascota?.dano)) tarde(heroe?.dano ? 350 : 650, () => voz(criatura, "herido"));

    // 2. Tu mascota
    if (mascota) {
        const suena = SONIDO_DE_MASCOTA[partida?.mascota?.especie];
        if (mascota.tipo === "renacer") tarde(450, () => sonar("nivel"));
        else {
            if (suena) tarde(400, () => sonar(suena));
            if (mascota.dano || mascota.elemento) tarde(520, () => sonar(mascota.elemento || "impacto"));
            else if (!suena) tarde(450, () => sonar("moneda"));
        }
    }

    // 3. La criatura
    if (cayo) {
        if (criatura) tarde(enemigo?.reflejo ? 1100 : 700, () => voz(criatura, "cae"));
        tarde(enemigo?.reflejo ? 1250 : 850, () => sonar("victoria"));
    } else if (enemigo) {
        const especial = enemigo.tipo === "descarga" ? "descarga" : enemigo.especial;
        if (criatura && (torre.GOLPES.includes(enemigo.tipo) || enemigo.tipo === "especial")) tarde(650, () => voz(criatura, "ataque"));
        if (especial && SONIDO_DE_ESPECIAL[especial] || especial === "descarga") {
            tarde(especial === "descarga" ? 700 : 760, () => sonar(especial === "descarga" ? "descarga" : SONIDO_DE_ESPECIAL[especial]));
        }
        if (enemigo.dano) tarde(900, () => sonar(partida?.fase === "fin" ? "fallo" : "impacto"));
        if (enemigo.especial === "coraza" || enemigo.especial === "barrera" || enemigo.especial === "reflejo") tarde(1000, () => sonar("coraza"));
    }

    // 4. El fin del turno
    if (eventos.some((e) => e.quien === "fase")) tarde(500, () => sonar("robo"));
    if (veneno) tarde(1250, () => sonar("veneno"));
    if (eventos.some((e) => e.quien === "furia")) tarde(450, () => { sonar("robo"); if (criatura) voz(criatura, "ataque"); });
    if (eventos.some((e) => e.tipo === "renacer" || e.habilidad === "gracia")) tarde(1350, () => sonar("nivel"));
}

// Cuando llega una criatura nueva (el piso siguiente, o al abrir la Torre), se oye su voz.
function vozDeLlegada() {
    const id = estado.arcade[lugarAbierto]?.enemigo?.id;
    if (id) setTimeout(() => voz(id, "aparece"), 450);
}


function cerrarMinijuego() {
    if (partida) {
        // A mitad de partida: se termina y cuentan los puntos que llevabas.
        if (!confirm("¿Terminar la partida ahora? Cuentan los puntos que llevas.")) return;
        partida.detener();
        return;
    }
    $("#minijuego").hidden = true;
    dibujarPantalla();
}


// ===== El robo de vida (v24) =====
// robo = lo que devuelven acciones.fallarMision y revisarVidaAlAbrir (o null: no pasó nada).
// alCerrar = qué hacer después (ej: ofrecer «Deshacer»).
function mostrarRobo(robo, alCerrar = null) {
    if (!robo || !robo.golpes.length) {
        sonar("fallo");
        alCerrar?.();
        return;
    }
    alCerrarRobo = alCerrar;
    roboDesde = Date.now();
    $("#robo-caja").innerHTML = vistas.pantallaRobo(robo, figuraPixel(avatarActual(), { alt: "Tu héroe" }));
    $("#robo").hidden = false;
    $("#robo").scrollTop = 0;
    sonar("robo");
}

function cerrarRobo() {
    if ($("#robo").hidden) return;
    $("#robo").hidden = true;
    $("#robo-caja").innerHTML = "";
    const despues = alCerrarRobo;
    alCerrarRobo = null;
    despues?.();
}


// ===== Sonido =====
// Suena solo si el sonido está encendido en Ajustes.
// (v58) La voz de una criatura (aparece, ataca, herido, cae), si el sonido está encendido.
function voz(criatura, momento) {
    if (estado.ajustes.sonido) sonido.sonarVoz(criatura, momento);
}

// (v125) Mientras corres (o estás en la pantalla de Running) no suena nada del juego: ni efectos ni música de fondo,
// para que escuches tu música. Solo queda la voz de los kilómetros (si la tienes encendida en Running › Progreso).
function enCarrera() {
    return Boolean(estado.running?.encurso) || pantallaActual === "running";
}

function sonar(nombre) {
    if (enCarrera()) return;
    if (estado.ajustes.sonido) sonido.sonar(nombre);
}

// ===== Música de fondo =====
// Suena la pista elegida en Ajustes; en la Torre, la de batalla. Se llama en cada toque
// (el navegador solo deja empezar a sonar después de uno) y al cambiar algo en Ajustes.
function ponerMusica() {
    const a = estado.ajustes;
    if (!a.musica || document.visibilityState !== "visible" || enCarrera()) {   // (v125) en la carrera, la música es la tuya
        musica.detener();
        return;
    }
    const volumen = Number.isFinite(a.volumen) ? a.volumen : 0.6;
    // En la Torre suena la de batalla; en la Mazmorra, «Abismo». (v58) Al leer, en el diario y en el mapa, una pieza a propósito.
    const leyendoHistoria = !$("#torre").hidden && Boolean($("#torre-caja .ff-historia"));
    const pista = musica.pistaDeEscena({
        pantalla: leyendoHistoria ? "historia" : pantallaActual,
        torre: $("#torre").hidden || leyendoHistoria ? null : lugarAbierto,
        elegida: a.pista, auto: a.musicaAuto !== false,
    });
    musica.reproducir(musica.PISTAS[pista] ? pista : "epica", volumen);
    // (v59) Con la música por escena, las demás pistas se bajan en segundo plano a los pocos segundos.
    if (a.musicaAuto !== false) setTimeout(() => musica.precargar(["lectura", "alba", "nocturno", "abismo"]), 6000);
}


// ===== Ejecutar una acción =====
// Todas las acciones pasan por aquí: así guardar, redibujar y celebrar
// se hace siempre igual, sin repetir código.
function ejecutar(accion, efectos = {}) {
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

function refrescar(efectos = {}) {
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
function contextoActual(efectos = {}) {
    const fecha = hoy();
    const info = juego.resumen(estado, fecha);
    const ahora = Date.now();
    return {
        hoy: fecha,
        info,
        avatar: avatar.describirAvatar(estado, fecha, info),
        vida: vida.calcularVida(estado, fecha),
        diaSeleccionado,
        fechaVista: fechaVista(),
        rangoResumen,
        recordarRespaldo: necesitaRespaldo(fecha),
        semanaPendiente: semanaPorMostrar(estado, fecha),   // lunes de la semana pasada, o null
        ahora,                                              // para los relojes (enfoque y relámpago)
        ...contextoDiario(fecha),
        renovandoPacto,
        descanso: descansoGym,
        gymVista,
        tipo: runTipo,                                      // (v109) el tipo de carrera elegido
        gpsProblema,
        terminando: runTerminando,
        fraseGym,
        resumenGym,
        paginaLibro,
        problemaAvisos,
        regionMapa,
        subvista,                                           // la sección elegida en Progreso, Tienda y Héroe
        agruparHoy,
        pergaminoId: pergaminoActual,
        capituloNovela,
        libroNovela,
        campanaVista,
        maestro: maestro.contexto(estado, fecha, ahora, info),   // lo que el Maestro sabe de tu día
        memoriasDesde,
        saga: saga.estadoDeSaga(saga.datosDeSaga(estado, campana.estadoCampanas(estado))),   // tu objetivo en la saga
        evento: eventoDelDia(fecha, estado),
        ...efectos,   // ej: { recienHecha: 3 } para animar la misión 3
    };
}

function dibujarPantalla(efectos = {}) {
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
function contextoDiario(fecha) {
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
function fechaVista() {
    return diaVisto === "ayer" ? sumarDias(hoy(), -1) : hoy();
}

// Enciende o apaga el modo esencial (el botón de Hoy y el interruptor de Ajustes). Si queda encendido y estabas en una
// pantalla que ya no está a la mano (Aventuras, Héroe…), te lleva a Hoy.
function cambiarModoEsencial(encendido) {
    if (!ejecutar(() => acciones.elegirAnimo(estado, encendido ? "mal" : "bien"))) return;
    if (encendido && !PANTALLAS_ESENCIALES.has(pantallaActual)) cambiarPantalla("hoy");
}

function cambiarPantalla(nombre) {
    // Los logros ahora viven dentro de Progreso.
    if (nombre === "logros") {
        subvista.progreso = "logros";
        nombre = "progreso";
    }
    diaVisto = "hoy";   // al cambiar de pantalla siempre se vuelve a "hoy"
    resumenGym = null;
    if (!estado.gym.encurso) fraseGym = null;
    if (nombre !== "memorias") memoriasDesde = null;
    renovandoPacto = false;
    if (nombre === "libro") paginaLibro = "portada";   // el libro siempre se abre por la portada
    if (nombre === "mapa") regionMapa = null;           // el mapa se abre donde vas
    mostrarSeccion(nombre);
    dibujarPantalla();
    window.scrollTo(0, 0);
    if (nombre === "mapa") $("#mapa-heroe")?.scrollIntoView({ block: "center" });
    animarEntrada(nombre);
    ponerMusica();   // (v58) cada escena tiene su música
    if (["mapa", "arcade", "voces"].includes(nombre)) setTimeout(() => revisarCines(nombre), 600);
}

// (v56) Al cambiar de pantalla, la nueva entra con una animación suave (solo entonces: al marcar una misión no se repite).
function animarEntrada(nombre) {
    const pantalla = $(`#pantalla-${nombre}`);
    if (!pantalla) return;
    pantalla.classList.remove("entra");
    void pantalla.offsetWidth;   // reinicia la animación si ya la tenía
    pantalla.classList.add("entra");
    pantalla.addEventListener("animationend", (evento) => {
        if (evento.target === pantalla) pantalla.classList.remove("entra");
    }, { once: true });
}


// ===== Animaciones y celebraciones =====

// (v99) Un fallo conocido de iOS (Safari y Chrome): al cerrar el teclado, a veces la parte visible de la página
// queda "corrida" y lo que va fijo a la pantalla (la cabecera y la barra de pestañas) aparece a media pantalla.
// Remedio: cuando el teclado se cierra (o la parte visible vuelve a medir lo mismo que la ventana), se mueve el
// scroll 1 punto y se regresa: eso obliga a iOS a recolocar todo.
function arreglarVistaTrasTeclado() {
    const reacomodar = () => setTimeout(() => {
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
    }, 80);
    document.addEventListener("focusout", (evento) => {
        if (evento.target.matches?.("input, textarea, select")) reacomodar();
    });
    const vista = window.visualViewport;
    if (vista) vista.addEventListener("resize", () => {
        if (vista.height >= window.innerHeight - 2 && (vista.offsetTop || vista.pageTop !== window.scrollY)) reacomodar();
    });
}

// (v95) Todas las pinturas (los 20 jefes y los fondos) pasan a pixel art, en segundo plano y una por una.
// La primera vez tarda unos segundos; después salen del caché al instante. Los retratos de jefe que ya están
// en pantalla se cambian solos; para los fondos se redibuja la pantalla una vez, al final.
function pinturasEnPixel() {
    const jefes = Object.keys(campana.CREDITOS).map((id) => ({
        clave: `jefe-${id}`, direccion: `jefes/${id}.jpg`, ancho: 96, alto: 120,
        listo: (url) => {
            campana.ponerImagenPixel(id, url);
            for (const img of document.querySelectorAll(`img[src="jefes/${id}.jpg"]`)) img.src = url;
        },
    }));
    // Los fondos cuadrados a 128 × 128, los escenarios de batalla (16:9) a 192 × 108 y la Torre (3:4) a 120 × 160.
    const medidas = (id) => (id.startsWith("escena-") ? [192, 108] : id === "torre" ? [120, 160] : [128, 128]);
    const fondos = Object.keys(PINTURAS).map((id) => ({
        clave: `fondo-${id}`, direccion: `fondos/${id}.jpg`, ancho: medidas(id)[0], alto: medidas(id)[1],
        listo: (url) => ponerPinturaPixel(id, url),
    }));
    // Al terminar se redibuja la pantalla una vez. Si en ese momento estás escribiendo en un campo, se espera
    // (redibujar lo vaciaría): se vuelve a mirar cada 2 segundos.
    const redibujar = () => {
        if (!estado?.personaje) return;
        const escribiendo = document.activeElement?.matches?.("input, textarea, select");
        if (escribiendo) return void setTimeout(redibujar, 2000);
        refrescar();
    };
    prepararPinturas([...jefes, ...fondos]).then(redibujar);
}

// (v94) Cuántas monedas, gemas y XP tienes ahora (para comparar antes y después de una acción).
function bolsa() {
    const p = estado.personaje;
    return p ? { monedas: p.monedas || 0, gemas: p.gemas || 0, xp: p.xp || 0 } : null;
}

// (v94) Lo que ganaste vuela desde donde tocaste hasta la cabecera, y el número sube contando.
// (Si gastaste, solo baja contando.)
function recompensar(antes) {
    const ahora = bolsa();
    if (!antes || !ahora) return;
    const monedas = ahora.monedas - antes.monedas;
    const gemas = ahora.gemas - antes.gemas;
    const xp = ahora.xp - antes.xp;
    if (monedas > 0) fx.volar("moneda", fx.cuantosPara(monedas, 5), $("#cab-monedas").parentElement);
    if (gemas > 0) fx.volar("gema", fx.cuantosPara(gemas, 10), $("#cab-gemas").parentElement);
    if (xp > 0) fx.volar("chispas", fx.cuantosPara(xp, 15, 5), $("#cab-barra"), { clase: "chispa-xp" });
    // Mientras vuelan, el número espera; después cuenta hasta el nuevo.
    fx.contar($("#cab-monedas"), antes.monedas, ahora.monedas, { espera: monedas > 0 ? 500 : 0 });
    fx.contar($("#cab-gemas"), antes.gemas, ahora.gemas, { espera: gemas > 0 ? 500 : 0 });
}

// Texto que sube y se desvanece sobre un elemento (ej: "+25 XP").
function flotar(selector, texto, negativo = false) {
    const elemento = $(selector);
    if (!elemento) return;
    const etiqueta = document.createElement("span");
    etiqueta.className = negativo ? "flotante negativo" : "flotante";
    etiqueta.textContent = texto;
    elemento.appendChild(etiqueta);
    etiqueta.addEventListener("animationend", () => etiqueta.remove());
}

function flotarXp(selector, xp) {
    if (xp) flotar(selector, xp > 0 ? `+${xp} XP` : `${xp} XP`, xp < 0);
}

// Pone una clase de animación CSS y la quita al terminar, para poder repetirla.
function reproducirAnimacion(elemento, clase) {
    elemento.classList.remove(clase);
    elemento.offsetWidth; // truco para "reiniciar" la animación
    elemento.classList.add(clase);
    elemento.addEventListener("animationend", () => elemento.classList.remove(clase), { once: true });
}

// Las celebraciones grandes se muestran una tras otra (en cola).
const cola = [];
let temporizadorCelebracion = null;

function celebrar(celebracion) {
    if (celebracion.pequena) {
        avisar(`${celebracion.icono} ${celebracion.titulo}`);
        return;
    }
    cola.push(celebracion);
    if ($("#celebracion").hidden) siguienteCelebracion();
}

function siguienteCelebracion() {
    clearTimeout(temporizadorCelebracion);
    const capa = $("#celebracion");
    const celebracion = cola.shift();
    if (!celebracion) {
        capa.hidden = true;
        return;
    }
    // Cada celebración suena distinto: subir de nivel, derrotar a un jefe o lo demás.
    if (celebracion.tipo === "nivel") sonar("nivel");
    else if (celebracion.imagen) sonar("victoria");
    else sonar("logro");
    // Al subir de nivel o evolucionar, se muestra el avatar celebrando;
    // al derrotar a un jefe, su retrato.
    if (celebracion.cuerpo) {
        // (v82) Tu cuerpo de antes y el de ahora, uno junto al otro.
        const cuerpo = (c) => cuerpoGymPixel({ ...avatarActual(), fisico: c.fisico, corpulencia: c.corpulencia });
        $("#cel-icono").innerHTML = `<div class="cel-cuerpos"><figure>${cuerpo(celebracion.cuerpo.antes)}<figcaption>Antes</figcaption></figure>
            <span aria-hidden="true">➜</span><figure>${cuerpo(celebracion.cuerpo.despues)}<figcaption>Ahora</figcaption></figure></div>`;
    } else if (celebracion.avatar) {
        $("#cel-icono").innerHTML = `<div class="cel-avatar celebrando">${dioramaPixel(avatarActual())}</div>`;
    } else if (celebracion.imagen) {
        $("#cel-icono").innerHTML = `<figure class="retrato derrotado cel-jefe"><img src="${celebracion.imagen}" alt=""></figure>`;
    } else if (celebracion.insignia) {   // (v101) la insignia nueva, grande
        $("#cel-icono").innerHTML = `<div class="cel-insignia">${dibujarInsignia(celebracion.insignia)}</div>`;
    } else {
        $("#cel-icono").textContent = celebracion.icono;
    }
    $("#cel-etiqueta").textContent = celebracion.etiqueta;
    $("#cel-titulo").textContent = celebracion.titulo;
    $("#cel-detalle").textContent = celebracion.detalle || "";
    // Lo que dice el Maestro Aurelio (al subir de nivel, vencer a un jefe o contarte su historia).
    $("#cel-maestro").textContent = celebracion.maestro ? `🧙 «${celebracion.maestro}»` : "";
    $("#cel-maestro").hidden = !celebracion.maestro;
    capa.hidden = false;
    // (v94) Subir de nivel y vencer a un jefe son épicos: rayos de luz, un destello y confeti.
    const epica = celebracion.tipo === "nivel" || Boolean(celebracion.imagen) || Boolean(celebracion.insignia);
    capa.classList.remove("epica");
    if (epica) {
        void capa.offsetWidth;   // reinicia el destello si ya estaba
        capa.classList.add("epica");
        fx.confeti(capa);
    }
    reproducirAnimacion($(".celebracion-caja"), "entrar");
    // Con las palabras del Maestro se queda un poco más, para que alcance a leerse.
    temporizadorCelebracion = setTimeout(siguienteCelebracion, celebracion.cuerpo ? 6500 : celebracion.maestro ? 4600 : 3200);
}

// Aviso pequeño abajo de la pantalla.
// Si llegan varios avisos juntos, se muestran en fila (uno tras otro) para no pisarse.
const colaAvisos = [];
let avisoVisible = false;

function avisar(texto) {
    colaAvisos.push(texto);
    if (!avisoVisible) siguienteAviso();
}

function siguienteAviso() {
    const aviso = $("#aviso");
    const texto = colaAvisos.shift();
    if (texto === undefined) {
        aviso.hidden = true;
        avisoVisible = false;
        return;
    }
    avisoVisible = true;
    // Si hay una ventana abierta, el aviso se mete dentro para que se vea encima.
    (document.querySelector("dialog[open]") || document.body).appendChild(aviso);
    aviso.textContent = texto;
    aviso.hidden = false;
    reproducirAnimacion(aviso, "entrar");
    // Si hay más esperando, cada uno dura menos.
    setTimeout(siguienteAviso, colaAvisos.length ? 1500 : 2600);
}


// ===== Ventanas (diálogos) =====

// Crea las "píldoras" de dificultad y atributo a partir de juego.js
// (así, si cambias la XP allá, aquí se actualiza solo).
function rellenarOpciones() {
    for (const grupo of document.querySelectorAll('[data-opciones="dificultad"]')) {
        grupo.insertAdjacentHTML("beforeend", Object.entries(juego.DIFICULTADES).map(([clave, d]) => `
            <label class="pildora dificultad-${clave}">
                <input type="radio" name="dificultad" value="${clave}" ${clave === "normal" ? "checked" : ""}>
                <span>${d.nombre}<small>+${d.xp} XP</small></span>
            </label>`).join(""));
    }
    pintarPildorasAtributo();
    $('[data-opciones="motivo"]').insertAdjacentHTML("beforeend", Object.entries(juego.MOTIVOS_FALLA).map(([clave, m], i) => `
        <label class="pildora">
            <input type="radio" name="motivo" value="${clave}" ${i === 0 ? "checked" : ""}>
            <span><b class="pildora-icono">${m.icono}</b><small>${m.nombre}</small></span>
        </label>`).join(""));
    // Ventana de atributo propio: a cuál de los 4 le suma, y su color.
    $('[data-opciones="base"]').insertAdjacentHTML("beforeend", Object.entries(juego.ATRIBUTOS).map(([clave, a], i) => `
        <label class="pildora" style="--color-dificultad: ${a.color}">
            <input type="radio" name="base" value="${clave}" ${i === 0 ? "checked" : ""}>
            <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
        </label>`).join(""));
    $('[data-opciones="color"]').insertAdjacentHTML("beforeend", `
        <label class="pildora pildora-color"><input type="radio" name="color" value="" checked>
            <span title="El de su atributo base">Auto</span></label>` + juego.COLORES_PROPIOS.map((color) => `
        <label class="pildora pildora-color"><input type="radio" name="color" value="${color}">
            <span style="--muestra: ${color}" aria-label="Color ${color}"></span></label>`).join(""));
    for (const grupo of document.querySelectorAll('[data-opciones="dias"]')) {
        grupo.insertAdjacentHTML("beforeend", DIAS_LETRAS.map((letra, dia) => `
            <label class="pildora" title="${DIAS_CORTOS[dia]}">
                <input type="checkbox" name="dias" value="${dia}" checked>
                <span>${letra}</span>
            </label>`).join(""));
    }
    $("#mision-plantilla").innerHTML = '<option value="">— Escribir la mía —</option>' +
        Object.entries(juego.ATRIBUTOS).map(([clave, a]) => `<optgroup label="${a.icono} ${a.nombre}">${
            PLANTILLAS_MISIONES.filter((p) => p.atributo === clave).map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("")}</optgroup>`).join("");

    $("#logro-tipo").innerHTML = Object.entries(juego.TIPOS_LOGRO)
        .map(([clave, t]) => `<option value="${clave}">${t.texto}</option>`).join("");

    // Créditos de las obras de arte: los jefes, los fondos y los escenarios (todas de dominio público).
    const credito = (enlace, c) => `<p><a href="${enlace}" target="_blank" rel="noopener">${c.obra}</a> — ${c.artista}, ${c.anio}.</p>`;
    $("#creditos").innerHTML = `<h4>Jefes</h4>${Object.entries(campana.CREDITOS).map(([id, c]) => credito(campana.fuenteDe(id), c)).join("")}
        <h4>Fondos y escenarios</h4>${Object.entries(PINTURAS).map(([id, c]) => credito(fuentePintura(id), c)).join("")}
        <h4>Voces de la carrera</h4>${Object.values(locutor.VOCES).map((v) => `<p>${v.nombre.replace(" (grabada)", "")}: ${v.licencia}. Sintetizada con Piper (MIT).</p>`).join("")}
        <h4>Música</h4>${Object.values(musica.PISTAS).map((m) => `<p><a href="${m.fuente}" target="_blank" rel="noopener">${m.obra}</a> —
            ${m.autor}; interpreta ${m.interpretes} (${m.licencia}).</p>`).join("")}`;

    // Las pistas de música (Ajustes).
    $("#ajustes-pistas").insertAdjacentHTML("beforeend", Object.entries(musica.PISTAS).map(([clave, m]) => `
        <label class="pildora"><input type="radio" name="pista" value="${clave}">
            <span>${m.icono} ${m.nombre}<small>${m.autor.split(" ").pop()}</small></span></label>`).join(""));

    const d = juego.DIFICULTADES;
    const p = juego.PREMIOS;
    $("#reglas").innerHTML = `
        <p><strong>Misiones diarias:</strong> Fácil +${d.facil.xp} XP · Normal +${d.normal.xp} XP · Difícil +${d.dificil.xp} XP. También dan monedas y suben su atributo.</p>
        <p><strong>Veces por semana:</strong> una misión «3 veces por semana» se puede marcar cualquier día hasta cumplir la meta. No rompe la racha ni cuenta para los días perfectos.</p>
        <p><strong>Cada mes:</strong> una misión mensual toca los días del mes que elijas (el 31 = el último día, aunque el mes sea más corto).
           Ese día cuenta como cualquier misión: racha, vida y jefes. En «Otros días» ves cuándo toca la próxima vez.</p>
        <p><strong>Misiones con cantidad:</strong> tienen un botón +1 y se completan solas al llegar a la meta (ej: 8 vasos de agua).</p>
        <p><strong>Tareas sueltas:</strong> pendientes de una sola vez, con fecha. Aparecen en Hoy el día que vencen y dan XP como una misión de su dificultad.</p>
        <p><strong>Modo enfoque:</strong> ${Object.entries(juego.ENFOQUE).map(([m, dif]) => `${m} min = misión ${d[dif].nombre.toLowerCase()}`).join(", ")}. Si cancelas, no hay premio.</p>
        <p><strong>Tu pacto:</strong> el Tratado de la Voluntad es un juramento contigo mismo que firmas con el dedo. Un día
           queda «honrado» si hiciste algo (una misión, una tarea, una sesión de enfoque o tu diario) o estabas de descanso;
           los días sin misiones no cuentan. Su ley: nunca fallar dos días seguidos.</p>
        <p><strong>El Maestro y los rituales:</strong> el Maestro Aurelio te habla según cómo vas. En la mañana eliges tu
           <em>misión clave</em>: si la cumples vale el doble (XP, monedas y daño al jefe). En la noche, el ritual te hace repasar
           lo que falta (la hice / no la hice), escribir el diario y leer tu capítulo; cerrar el día da +${rituales.PREMIO_CIERRE.xp} XP
           y ${rituales.PREMIO_CIERRE.monedas} monedas.</p>
        <p><strong>La Saga de la Llama:</strong> todas las historias del juego son una sola (Héroe › Historia las ordena: la primera
           piedra, las memorias de Aurelio, la Crónica del reino, la Torre, la Mazmorra y tu libro). Su objetivo: convertirte en Vigía.
           Son ${saga.ACTOS.length} actos que se cumplen en orden (${saga.ACTOS.map((a) => a.titulo).join(", ")}); el que toca es tu
           objetivo de ahora y se ve en Hoy, en «Tu día».</p>
        <p><strong>Aurelio en todo el juego:</strong> te da una pista antes de cada guardián de la Torre y de la Mazmorra y te habla
           cuando caes; comenta cuando subes de nivel o vences a un jefe, responde a tu diario y te despide al cerrar el día.
           Sus <strong>memorias</strong> (Héroe › Historia) cuentan quién fue antes de ser tu maestro: ${memorias.MEMORIAS.length}
           capítulos que se abren en orden con tu mejor racha, tus jefes vencidos, tu nivel y tus récords de la Torre y la Mazmorra.</p>
        <p><strong>Monedas y gemas:</strong> las monedas 🪙 son para tus premios reales y solo salen de lo que haces en la vida
           real (misiones, tareas, enfoque, misiones principales, tu diario, cerrar el día y tus logros). Las gemas 💎 son la moneda
           del juego: se ganan en el arcade (minijuegos, Torre y Mazmorra) y con los premios extra (jefes, cofre del día, desafíos y
           mapa), y se gastan en el equipo de tu avatar, las mascotas y el bazar del arcade. Así, lo que ganas jugando no se
           convierte en premios reales.</p>
        <p><strong>Cofre del día:</strong> con lo primero que cumplas se desbloquea un cofre con un premio al azar (gemas, XP,
           fichas, una poción o, rara vez, equipo).</p>
        <p><strong>Eventos del día:</strong> más o menos la mitad de los días pasa algo (Mercader ambulante, Luna de sangre,
           Aguas termales…). Se pueden apagar en Ajustes.</p>
        <p><strong>Desafío relámpago:</strong> algunos días aparece un reto con reloj: ${rituales.RELAMPAGO.meta} misiones en
           ${rituales.RELAMPAGO.minutos / 60} horas por +${rituales.RELAMPAGO.premio.xp} XP y ${rituales.RELAMPAGO.premio.gemas} gemas.</p>
        <p><strong>Golpe con timing:</strong> al completar una misión, toca cuando la marca esté en la zona dorada: golpe crítico
           (+50 % de daño al jefe). Se puede apagar en Ajustes.</p>
        <p><strong>El reino (el mapa):</strong> cada cosa cumplida es un paso; cada ${mapa.PASOS_POR_LUGAR} pasos llegas a un lugar.
           Cada región tiene tesoros, santuarios y las guaridas de cuatro señores: tus jefes de Aventuras (en la región 1, los
           primeros de cada campaña; en la 2, los segundos…). Cuando vences a un señor, su guarida queda libre y tiene botín
           (+${mapa.LUGARES.guarida.premio.gemas} gemas y ${mapa.LUGARES.guarida.premio.xp} XP de su atributo). La fortaleza del final se abre cuando caen
           los cuatro. La sexta región, la Ciudadela del Carácter, tiene cuatro memoriales (se encienden al vencer a los cinco
           señores de una campaña) y el brasero de los Vigías, donde se junta su fuego. La Torre está en el Valle del Comienzo, al
           principio del camino (se sube en el Arcade). La <strong>Crónica del reino</strong> cuenta la historia y se escribe sola.</p>
        <p><strong>Mascotas:</strong> empiezas con un dragón; en la Tienda puedes adoptar otras con gemas (común, rara, épica y legendaria).
           Cada una llega como huevo y crece con las misiones diarias que completas desde que la tienes. La que te acompaña
           pelea a tu lado en la Torre con su habilidad (la cría al ${mascota.POTENCIA.cria * 100} %, la adulta al 100 %, y un
           ${Math.round((mascota.ALIMENTADA - 1) * 100)} % más si comió ese día; triste, no pelea). Acarícialas, y aliméntalas una vez al día
           (${mascota.COMIDA.precio} gemas): te curan ${mascota.COMIDA.cura} de vida.</p>
        <p><strong>Fallé:</strong> el botón ✗ de una misión marca que no la hiciste y por qué. La vida se pierde en ese
           momento (no dos veces) y el recordatorio de esa misión ya no llega. Se puede deshacer, y si al final la haces, la falla
           se borra sola. En la ficha de cada hábito ves cuántas veces fallaste y tu motivo más común.</p>
        <p><strong>Tu libro:</strong> cada día que escribes en el diario se vuelve un capítulo de «La crónica de» tu nombre, contado
           con lo que pasó ese día: misiones, tareas, jefes derrotados, logros, lo que fallaste y tus propias palabras.</p>
        <p><strong>Diario:</strong> cada día puedes marcar cómo te fue (5 ánimos), responder la pregunta del día y anotar algo
           que agradeces. Escribirlo da +${diario.PREMIO_DIARIO.xp} XP de Carisma y ${diario.PREMIO_DIARIO.monedas} monedas (una vez al día)
           y cura ${vida.VIDA.diario} de vida. En «Tu diario» ves el calendario de ánimo, lo que tu diario dice de ti, tus recuerdos,
           el buscador y puedes descargarlo.</p>
        <p><strong>Desafío de la semana:</strong> cada lunes toca uno al azar. Si lo cumples antes del domingo, abres un cofre: +${desafios.COFRE.xp} XP y ${desafios.COFRE.gemas} gemas.</p>
        <p><strong>Vida:</strong> tienes ${vida.VIDA.base} + ${vida.VIDA.porNivel} por nivel. Al terminar cada día pierdes
           ${vida.DANO.facil}/${vida.DANO.normal}/${vida.DANO.dificil} (fácil/normal/difícil) por cada misión que tocaba y no hiciste,
           ${vida.VIDA.tareaVencida} por cada tarea que vence y, el domingo, por cada vez que te faltó en las metas semanales
           (máximo ${vida.VIDA.danoMaximoDia} por día). Recuperas ${vida.CURA.facil}/${vida.CURA.normal}/${vida.CURA.dificil} por cada misión o tarea,
           ${vida.VIDA.paso} por paso de misión principal, ${vida.VIDA.enfoque} por sesión de enfoque y ${vida.VIDA.diaPerfecto} extra en un día perfecto.
           Con ${vida.VIDA.forma * 100} % o más estás <em>en plena forma</em>: +${vida.VIDA.bonoForma * 100} % de XP y monedas.
           Si llegas a 0 caes en combate: la tienda y el arcade se cierran hasta que recuperes la mitad.
           Poción: +${vida.POCION.cura} por ${vida.POCION.precio} monedas, una al día. En la Torre subes con tu vida real.</p>
        <p><strong>Los jefes también pegan (robo de vida):</strong> cada misión que fallas es un golpe del jefe de su categoría.
           Te quita vida y se la queda: se cura con ella (hasta su vida llena; nunca revive a un jefe vencido). Lo ves en una
           escena al marcar «Fallé» y al abrir la app si fallaste mientras no estabas.</p>
        <p><strong>Armadura:</strong> sale de tus objetos de protección: la ropa de tu etapa
           (${avatar.ETAPAS.map((e) => `${e.nombre} ${e.armadura}`).join(", ")}) más lo que lleves en la cabeza y en la espalda, hasta
           ${equipo.ARMADURA.tope}. Solo cuenta cuando fallas una misión: con ${equipo.ARMADURA.normal} recibes el daño normal; con 0,
           un 50 % más; con ${equipo.ARMADURA.normal * 2} o más, la mitad. Cada misión fallada la gasta
           (${equipo.ARMADURA.desgaste.facil}/${equipo.ARMADURA.desgaste.normal}/${equipo.ARMADURA.desgaste.dificil}) y cada misión o tarea cumplida la repara
           (${equipo.ARMADURA.reparacion.facil}/${equipo.ARMADURA.reparacion.normal}/${equipo.ARMADURA.reparacion.dificil}, +${equipo.ARMADURA.diaPerfecto} en un día perfecto).
           Las tareas vencidas pegan igual: la armadura no las cubre.</p>
        <p><strong>Tu equipo cuenta:</strong> cada objeto dice lo que da. 🛡️ Armadura: además de protegerte al fallar, en la Torre
           para parte de cada golpe (hasta 40 %), en la Carrera te da escudos (1 por cada 25) y en la Lluvia de monedas, vidas
           (1 por cada 30). ⚔️ Ataque: más daño en la Torre y en Golpe preciso. 🔮 Magia: hechizos más fuertes y zonas de acierto
           más anchas. 🍀 Suerte: más golpes críticos y monedas que valen más en los minijuegos.
           Lo <strong>épico y legendario</strong> tiene además una habilidad especial en la Torre (esquivar, golpear dos veces,
           resistir un golpe mortal, ver el punto débil…): cada objeto dice la suya.</p>
        <p><strong>Modo descanso:</strong> hasta ${vida.VIDA.descansoMaximo} días (vacaciones, enfermedad) sin perder vida ni racha, y sin recordatorios.</p>
        <p><strong>Tus atributos:</strong> en Progreso puedes crear hasta ${juego.MAX_ATRIBUTOS_PROPIOS} atributos para cosas
           específicas (Programación, Inglés…). Cada uno tiene su nivel y le suma a uno de los 4, así que también cuenta para
           tu clase, tu avatar, los jefes y la Torre.</p>
        <p><strong>Niveles:</strong> pasar del nivel N al N+1 cuesta ${juego.BASE_PERSONAJE}×N XP. Cada atributo sube con ${juego.BASE_ATRIBUTO}×N XP.</p>
        <p><strong>Rachas:</strong> un día cuenta si completas al menos 1 misión. Cada ${juego.ESCUDOS.diasParaGanar} días seguidos ganas un escudo (máx. ${juego.ESCUDOS.maximo}) que salva tu racha si fallas un día.</p>
        <p><strong>Bonus de regreso:</strong> si vuelves tras ${juego.REGRESO.diasMinimos} días o más, ganas ${juego.REGRESO.xpPorDia} XP por día ausente (máx. ${juego.REGRESO.xpMaximo}).</p>
        <p><strong>Misiones principales:</strong> +${p.submision.xp} XP por paso y +${p.principal.xp} XP al terminar.</p>
        <p><strong>Jefes:</strong> 5 por categoría, cada vez más fuertes. Los dañas cumpliendo objetivos de su categoría:
           misión diaria −${campana.DANO.diaria.facil}/−${campana.DANO.diaria.normal}/−${campana.DANO.diaria.dificil} (fácil/normal/difícil),
           paso de misión principal −${campana.DANO.paso}, misión principal completa −${campana.DANO.principal} extra.
           Las tareas y las sesiones de enfoque pegan como una misión diaria de su dificultad.
           Derrotar al jefe N da ${campana.premioJefe(1).xp}×N XP y ${campana.premioJefe(1).gemas}×N gemas.
           <strong>Partida+:</strong> al vencer a los 5, la campaña vuelve a empezar; cada ronda suma
           ${campana.MEJORA_POR_RONDA * 100} % a la vida de los jefes y a sus premios.</p>
        <p><strong>Días perfectos:</strong> completar todas tus misiones diarias del día.</p>
        <p><strong>Avatar:</strong> evoluciona en los niveles ${avatar.ETAPAS.slice(1).map((e) => `${e.desde} (${e.nombre})`).join(", ")}.
           Tu clase es tu atributo más alto. Cada atributo cambia algo visible en los niveles 3 y 6.
           Su ánimo depende de tu racha: tras 3 días sin misiones se duerme.</p>
        <p><strong>Crecimiento de la mascota:</strong> eclosiona con 10 misiones diarias completadas (desde que la tienes) y es adulta con 50.</p>
        <p><strong>Minijuegos:</strong> empiezas con ${arcade.FICHAS_DE_REGALO} fichas y ganas 1 por cada misión diaria completada.
           Cada partida da hasta ${arcade.MAX_GEMAS} gemas y ${arcade.MAX_XP} XP según tus puntos.
           <strong>Bazar:</strong> con gemas compras provisiones (una de cada una) que se usan al empezar tu próxima subida a la
           Torre o bajada a la Mazmorra: ${Object.values(torre.PROVISIONES).map((p) => `${p.nombre} (${p.texto.toLowerCase()})`).join(", ")}.</p>
        <p><strong>Torre del héroe:</strong> batallas por turnos piso a piso (1 ficha por subida; puedes salir y seguir después).
           Tu vida y tu ataque salen de Fuerza, los hechizos de Intelecto, la defensa de Carisma y las pociones y los críticos de Riqueza.
           Tiene ${bestiario.ZONAS.length} zonas de ${torre.CADA_GUARDIAN} pisos (${bestiario.ZONAS.map((z) => z.nombre).join(", ")}), con
           ${bestiario.ORDEN.length} criaturas propias y un guardián al final de cada zona; después del piso ${bestiario.ORDEN.length} vuelven, más fuertes.
           <strong>Desde que la Torre despertó (v38)</strong>, muchas criaturas tienen un truco: 💠 barrera (absorbe tus golpes hasta
           romperse), 🌀 carga (al turno siguiente suelta un golpe de ${String(torre.ESPECIALES.carga.golpe).replace(".", ",")} veces su ataque:
           defiéndete) o 🪞 espejo (tu próximo hechizo rebota y te quita la mitad). Algunas se regeneran, y el Apagador del piso 30
           cambia de punto débil a media vida.
           <strong>Técnicas:</strong> una por atributo, desde su nivel ${torre.NIVEL_TECNICA}, una vez por piso:
           ${Object.values(torre.TECNICAS).map((t) => `${t.icono} ${t.nombre} (${juego.ATRIBUTOS[t.atributo].nombre}: ${t.texto.toLowerCase()})`).join(", ")}.
           <strong>Voluntad:</strong> se llena al golpear, al defenderte y, sobre todo, al aguantar golpes; tu racha te da
           ${torre.VOLUNTAD.porDia} por día al empezar (máx. ${torre.VOLUNTAD.inicialMax}). Llena, el Golpe de Voluntad pega
           ${String(torre.VOLUNTAD.multiplica).replace(".", ",")} veces tu mejor ataque y rompe barreras, corazas, espejos y cargas.
           <strong>Magia:</strong> los hechizos son de fuego, hielo o rayo. Cada criatura tiene un punto débil (ese hechizo le hace
           ${Math.round((bestiario.DEBIL - 1) * 100)} % más) y algunas resisten otro (les hace la mitad). Lo que descubres queda en tu
           <strong>bestiario</strong> (botón en el Arcade): la próxima vez el menú de magia ya te lo dice.
           Premio: ${torre.PREMIO.gemasPorPiso} gemas y ${String(torre.PREMIO.xpPorPiso).replace(".", ",")} XP de Carisma
           por piso superado (máx. ${torre.PREMIO.maxGemas} y ${torre.PREMIO.maxXp}).</p>
        <p><strong>Mazmorra del Abismo:</strong> se abre al superar el piso ${torre.ABRIR_MAZMORRA} de la Torre y se juega igual, pero bajando
           (${bestiario.ZONAS_MAZMORRA.map((z) => z.nombre).join(", ")}). Es más difícil: sus ${bestiario.ORDEN_MAZMORRA.length} criaturas pegan
           más fuerte y cada una tiene un ataque especial: ☠️ veneno (${Math.round(torre.ESPECIALES.veneno.porTurno * 100)} % de tu vida por turno
           durante ${torre.ESPECIALES.veneno.turnos} turnos; una poción lo cura), 🩸 drenar (se cura lo que te quita), 🔒 sello (te quita
           ${torre.ESPECIALES.sellar.pm} hechizos) o 🐚 coraza (tu próximo golpe le hace la mitad). Sus guardianes se enfurecen al quedar con
           media vida y al bajar de sótano no recuperas vida. Premio: ${torre.REGLAS.mazmorra.premio.gemasPorPiso} gemas y
           ${torre.REGLAS.mazmorra.premio.xpPorPiso} XP de Fuerza por sótano (máx. ${torre.REGLAS.mazmorra.premio.maxGemas} y
           ${torre.REGLAS.mazmorra.premio.maxXp}).</p>
        <p><strong>Más mazmorras (v64):</strong> las <b>Minas de la Codicia</b> ⛏️ (15 niveles; se abren al bajar 10 sótanos de la Mazmorra; dan XP de
           Riqueza) y el <b>Laberinto de los Ecos</b> 🌀 (15 cámaras; se abre al bajar 10 niveles de las Minas; da XP de Intelecto). Tienen criaturas,
           historia y premios propios, y se juegan con las mismas reglas.</p>
        <p><strong>Historia:</strong> la Torre y las mazmorras cuentan una historia que sigue a la Crónica del reino. Se lee en la batalla
           la primera vez que llegas a cada zona y se puede releer con «📜 Historia» en el Arcade.</p>`;
}

// Preparativos al abrir cada ventana. Si reciben un elemento (una misión, un logro…),
// la ventana se abre en modo EDICIÓN con sus datos; si no, en modo CREAR.
const PREPARAR = {
    mision(mision) {
        const formulario = $("#dialogo-mision form");
        modoEdicion(formulario, mision, { crear: ["Nueva misión", "Crear misión"], editar: ["Editar misión", "Guardar cambios"] });
        // La lista de plantillas y «Una sola vez» solo sirven al crear.
        ocultarCampo($("#campo-plantilla"), Boolean(mision));
        ocultarCampo($("#opcion-unica"), Boolean(mision));
        // Días: al crear, todos marcados; al editar, los de la misión.
        for (const casilla of formulario.querySelectorAll('input[name="dias"]')) {
            casilla.checked = !mision || !mision.dias || mision.dias.includes(Number(casilla.value));
        }
        // Días del mes: al crear, ninguno (tú eliges); al editar, los de la misión.
        marcarDiasMes(formulario, mision?.diasMes || []);
        if (mision) {
            formulario.elements.nombre.value = mision.nombre;
            formulario.elements.dificultad.value = mision.dificultad;
            formulario.elements.atributo.value = valorAtributo(mision);
            formulario.elements.frecuencia.value = mision.veces ? "semana" : mision.diasMes ? "mes" : "dias";
            if (mision.veces) formulario.elements.veces.value = mision.veces;
            formulario.elements.cantidad.value = mision.meta ? mision.meta.cantidad : "";
            formulario.elements.unidad.value = mision.meta ? mision.meta.unidad : "";
            formulario.elements.aviso.value = mision.aviso || "";
            formulario.elements.momento.value = mision.momento || "";
        }
        mostrarCamposFrecuencia();
    },
    tarea(tarea) {
        const formulario = $("#dialogo-tarea form");
        modoEdicion(formulario, tarea, { crear: ["Nueva tarea", "Crear tarea"], editar: ["Editar tarea", "Guardar cambios"] });
        formulario.elements.fecha.value = tarea ? tarea.fecha : hoy();   // por defecto, para hoy
        if (tarea) {
            formulario.elements.nombre.value = tarea.nombre;
            formulario.elements.aviso.value = tarea.aviso || "";
            formulario.elements.dificultad.value = tarea.dificultad;
            formulario.elements.atributo.value = valorAtributo(tarea);
        }
    },
    recompensa(recompensa) {
        const formulario = $("#dialogo-recompensa form");
        modoEdicion(formulario, recompensa, { crear: ["Nueva recompensa", "Agregar a la tienda"], editar: ["Editar recompensa", "Guardar cambios"] });
        if (recompensa) {
            formulario.elements.nombre.value = recompensa.nombre;
            formulario.elements.costo.value = recompensa.costo;
        }
    },
    logro(logro) {
        const formulario = $("#dialogo-logro form");
        modoEdicion(formulario, logro, { crear: ["Nuevo logro", "Crear logro"], editar: ["Editar logro", "Guardar cambios"] });

        const activas = estado.misiones.filter((m) => !m.archivadaEn);
        $("#logro-mision").innerHTML = activas.length
            ? activas.map((m) => `<option value="${m.id}">${vistas.esc(m.nombre)}</option>`).join("")
            : '<option value="">(primero crea una misión diaria)</option>';

        const tipo = $("#logro-tipo");
        tipo.disabled = false;
        $("#campo-recompensa").hidden = false;
        formulario.elements.recompensa.disabled = false;
        if (logro) {
            formulario.elements.nombre.value = logro.nombre;
            formulario.elements.icono.value = logro.icono || "";
            formulario.elements.descripcion.value = logro.descripcion || "";
            formulario.elements.objetivo.value = logro.objetivo;
            formulario.elements.recompensa.value = logro.recompensa;
            tipo.value = logro.tipo;
        }
        mostrarCamposLogro();
        if (logro) {
            // Al editar no se cambia la condición; y si ya lo conseguiste, tampoco la meta ni el premio.
            tipo.disabled = true;
            for (const selector of ["#campo-mision", "#campo-atributo"]) ocultarCampo($(selector), true);
            if (logro.desbloqueadoEn) {
                ocultarCampo($("#campo-objetivo"), true);
                ocultarCampo($("#campo-recompensa"), true);
            }
        }
    },
    atributo(propio) {
        const formulario = $("#dialogo-atributo form");
        modoEdicion(formulario, propio, { crear: ["Nuevo atributo", "Crear atributo"], editar: ["Editar atributo", "Guardar cambios"] });
        // La base no se cambia al editar (la XP que ya diste no se puede mover): se muestra como texto.
        ocultarCampo($("#campo-base"), Boolean(propio));
        $("#atributo-base-texto").hidden = !propio;
        if (propio) {
            const base = juego.ATRIBUTOS[propio.base];
            formulario.elements.nombre.value = propio.nombre;
            formulario.elements.icono.value = propio.icono;
            formulario.elements.color.value = propio.color;
            $("#atributo-base-texto").textContent = `Su XP también sube ${base.icono} ${base.nombre}.`;
        }
    },
    ajustes() {
        mostrarVersion();
        pintarAvisos();
        $("#ajustes-nombre").value = estado.personaje.nombre;
        $("#ajustes-sonido").checked = estado.ajustes.sonido;
        $("#ajustes-golpe").checked = estado.ajustes.golpe;
        $("#ajustes-eventos").checked = estado.ajustes.eventos;
        $("#ajustes-cinematicas").checked = estado.ajustes.cinematicas !== false;
        $("#ajustes-esencial").checked = Boolean(estado.ajustes.esencial);
        $("#ajustes-esencial-al-abrir").checked = Boolean(estado.ajustes.esencialAlAbrir);
        $("#ajustes-preguntar-animo").checked = Boolean(estado.ajustes.preguntarAnimo);
        $("#ajustes-musica-auto").checked = estado.ajustes.musicaAuto !== false;
        // Qué toca en esta escena (así se ve que la música sigue a dónde estás).
        const ahora = musica.pistaDeEscena({ pantalla: pantallaActual, torre: null, elegida: estado.ajustes.pista, auto: estado.ajustes.musicaAuto !== false });
        const pistaAhora = musica.PISTAS[ahora];
        $("#ajustes-sonando").textContent = estado.ajustes.musica && pistaAhora
            ? `🎵 En esta pantalla suena: ${pistaAhora.icono} ${pistaAhora.nombre} (${pistaAhora.obra}).` : "";
        $("#ajustes-musica").checked = estado.ajustes.musica;
        $("#ajustes-volumen").value = Math.round((Number.isFinite(estado.ajustes.volumen) ? estado.ajustes.volumen : 0.6) * 100);
        for (const radio of document.querySelectorAll('input[name="pista"]')) radio.checked = radio.value === estado.ajustes.pista;
        $("#ajustes-ultimo-respaldo").textContent = estado.ultimoRespaldo
            ? `Última copia: ${fechaLegible(estado.ultimoRespaldo)}.`
            : "Todavía no has hecho ninguna copia.";

        const hayPin = seguridad.hayPin();
        $("#ajustes-pin-estado").textContent = hayPin
            ? "Activado: la app pide tu PIN al abrirla y si vuelves después de 1 minuto."
            : "Desactivado: cualquiera con tu iPhone desbloqueado puede abrir la app.";
        $("#ajustes-pin-botones").innerHTML = hayPin
            ? `<button type="button" class="boton boton-secundario" data-accion="cambiar-pin">Cambiar PIN</button>
               <button type="button" class="boton boton-secundario" data-accion="quitar-pin">Quitar PIN</button>`
            : `<button type="button" class="boton boton-principal" data-accion="activar-pin">Activar PIN</button>`;
        if (hayPin) pintarFaceId();
        pintarNube();
        pintarDescanso();
    },
    // «Fallé»: la ventana que pregunta qué pasó.
    falla(mision) {
        const formulario = $("#dialogo-falla form");
        const fecha = fechaVista();
        formulario.elements.id.value = mision.id;
        formulario.elements.fecha.value = fecha;
        const descanso = juego.enDescanso(estado, fecha);
        $("#falla-texto").textContent = `«${mision.nombre}» quedará como fallada ${fecha === hoy() ? "hoy" : "ayer"}.` +
            (descanso ? " Estás de descanso: no pierdes vida." : ` Pierdes ${vida.DANO[mision.dificultad]} ❤️ ahora, no al terminar el día.`);
        $("#falla-pacto").textContent = estado.pacto
            ? "Reconocerlo también es cumplir tu pacto: «Solo marcaré lo que de verdad hice.» — Artículo II"
            : "Reconocerlo con honestidad también es avanzar.";
    },
    ficha(mision) {
        $("#ficha-contenido").innerHTML = vistas.fichaMision(estado, mision, hoy());
    },
    // Revisión semanal: recibe el lunes de la semana que se revisa.
    revision(lunes) {
        $("#revision-contenido").innerHTML = vistas.contenidoRevision(estado, lunes, hoy());
    },
    ordenar() {
        $("#ordenar-lista").innerHTML = vistas.listaOrdenar(estado);
    },
    nube() {
        // El código solo se pide si este teléfono todavía no lo tiene.
        const pedirCodigo = !nube.hayCodigo();
        ocultarCampo($("#nube-campo-codigo"), !pedirCodigo);
        $("#nube-campo-codigo input").required = pedirCodigo;
    },
};

// Face ID en Ajustes (solo si el teléfono lo tiene y hay PIN: el PIN es el plan B).
async function pintarFaceId() {
    if (!(await seguridad.faceIdDisponible())) return;
    $("#ajustes-pin-botones").insertAdjacentHTML("beforeend", seguridad.hayFaceId()
        ? `<button type="button" class="boton boton-secundario" data-accion="quitar-faceid">Quitar Face ID</button>`
        : `<button type="button" class="boton boton-principal" data-accion="activar-faceid">🙂 Activar Face ID</button>`);
}

function pintarDescanso() {
    $("#ajustes-descanso").innerHTML = vistas.seccionDescanso(estado, hoy());
}

function pintarNube() {
    $("#ajustes-nube").innerHTML = vistas.seccionNube({
        configurada: nube.configurada(),
        ultima: nube.ultimaCopia(),
        codigoGuardado: nube.hayCodigo(),
    });
}

// Pone un formulario en modo "crear" o "editar": título, texto del botón,
// los botones que solo sirven al editar y el id oculto del elemento.
function modoEdicion(formulario, elemento, textos) {
    const [titulo, boton] = elemento ? textos.editar : textos.crear;
    formulario.querySelector("[data-titulo]").textContent = titulo;
    formulario.querySelector("[data-enviar]").textContent = boton;
    formulario.querySelector("[data-solo-editar]").hidden = !elemento;
    formulario.elements.id.value = elemento ? elemento.id : "";
}

// Oculta (o muestra) un campo y desactiva sus controles para que el formulario no los pida.
function ocultarCampo(campo, oculto) {
    campo.hidden = oculto;
    for (const control of campo.querySelectorAll("input, select")) control.disabled = oculto;
}

// El id del elemento que se está editando en la ventana de un botón.
function idEnEdicion(boton) {
    return Number(boton.closest("form").elements.id.value);
}

// Las píldoras de atributo (los 4 + los tuyos). Se arman al abrir cada ventana,
// así siempre aparecen los atributos que hayas creado.
function pintarPildorasAtributo(raiz = document) {
    for (const grupo of raiz.querySelectorAll('[data-opciones="atributo"]')) {
        const leyenda = grupo.querySelector("legend").outerHTML;
        grupo.innerHTML = leyenda + vistas.pildorasAtributo(estado, "fuerza");
    }
}

// El valor de la píldora de algo que ya existe: "fuerza" o, si tiene uno tuyo, "propio:5".
function valorAtributo(elemento) {
    return elemento.atributoPropio ? juego.clavePropio(elemento.atributoPropio) : elemento.atributo;
}

function abrirDialogo(nombre, elemento = null) {
    const dialogo = $(`#dialogo-${nombre}`);
    pintarPildorasAtributo(dialogo);
    for (const formulario of dialogo.querySelectorAll("form")) formulario.reset();
    PREPARAR[nombre]?.(elemento);
    dialogo.showModal();
}

// En la misión: mostrar los días de la semana, o cuántas veces por semana.
// En la misión: mostrar los días de la semana, las veces por semana o la fecha (si es de una sola vez).
function mostrarCamposFrecuencia() {
    const frecuencia = $("#dialogo-mision form").elements.frecuencia.value;
    ocultarCampo($("#campo-dias"), frecuencia !== "dias");
    ocultarCampo($("#campo-veces"), frecuencia !== "semana");
    ocultarCampo($("#campo-mes"), frecuencia !== "mes");
    ocultarCampo($("#campo-unica"), frecuencia !== "unica");
    ocultarCampo($("#campos-repetir"), frecuencia === "unica");
}

// Marca en el formulario de misión los días del mes de la lista (y desmarca los demás).
function marcarDiasMes(formulario, diasMes) {
    for (const casilla of formulario.querySelectorAll('input[name="diasMes"]')) {
        casilla.checked = diasMes.includes(Number(casilla.value));
    }
}

// Elegir un hábito de la lista rellena el formulario de misión.
function usarPlantilla() {
    const plantilla = PLANTILLAS_MISIONES.find((p) => p.id === $("#mision-plantilla").value);
    if (!plantilla) return;
    const f = $("#dialogo-mision form").elements;
    f.nombre.value = plantilla.nombre;
    f.dificultad.value = plantilla.dificultad;
    f.atributo.value = plantilla.atributo;
    f.frecuencia.value = plantilla.frecuencia || "dias";
    if (plantilla.veces) f.veces.value = plantilla.veces;
    for (const casilla of $("#dialogo-mision form").querySelectorAll('input[name="dias"]')) {
        casilla.checked = !plantilla.dias || plantilla.dias.includes(Number(casilla.value));
    }
    if (plantilla.diasMes) marcarDiasMes($("#dialogo-mision form"), plantilla.diasMes);
    f.cantidad.value = plantilla.cantidad || "";
    f.unidad.value = plantilla.unidad || "";
    f.momento.value = plantilla.momento || "";
    mostrarCamposFrecuencia();
}

// En el logro, mostrar solo los campos que usa el tipo de condición elegido.
function mostrarCamposLogro() {
    const campo = juego.TIPOS_LOGRO[$("#logro-tipo").value].campo;
    ocultarCampo($("#campo-mision"), campo !== "mision");
    ocultarCampo($("#campo-atributo"), campo !== "atributo");
    ocultarCampo($("#campo-objetivo"), campo === "manual");   // un logro personal no tiene meta numérica
}


// ===== Notificaciones =====

// Dibuja la sección de notificaciones de Ajustes. Depende del teléfono
// (si la app está instalada, si diste permiso…), por eso se arma aparte.
async function pintarAvisos() {
    const info = {
        compatible: avisos.compatible(),
        instalar: avisos.esIphone() && !avisos.instalada(),
        permiso: "Notification" in window ? Notification.permission : "default",
        activadas: await avisos.activadas(registroSW),
    };
    $("#ajustes-avisos").innerHTML = vistas.seccionAvisos(estado, info);
}

// Después de cambiar los horarios: mandarlos al servidor de avisos.
function sincronizarAvisos() {
    avisos.sincronizar(registroSW, estado).catch((error) => avisar(`⚠️ ${error.message}`));
}

function probarAvisos() {
    return avisos.probar().then((respuesta) => avisar(respuesta.ok
        ? "🔔 Aviso de prueba enviado"
        : `⚠️ El servicio de avisos respondió ${respuesta.estado}`));
}


// ===== Deshacer =====
// Después de completar algo aparece abajo «Deshacer» unos segundos, por si te equivocaste.

let temporizadorDeshacer = null;
let alDeshacer = null;

function ofrecerDeshacer(texto, accion) {
    alDeshacer = accion;
    $("#deshacer-texto").textContent = texto;
    const caja = $("#deshacer");
    caja.hidden = false;
    reproducirAnimacion(caja, "entrar");
    clearTimeout(temporizadorDeshacer);
    temporizadorDeshacer = setTimeout(ocultarDeshacer, 5000);
}

function ocultarDeshacer() {
    $("#deshacer").hidden = true;
    alDeshacer = null;
}


// ===== Gestos: deslizar una misión a la derecha para completarla =====
// Se usan "pointer events" (sirven igual para el dedo y el ratón). Mientras el dedo se
// mueve en horizontal, la tarjeta lo sigue; si pasa del umbral al soltar, se toca su botón.
// Si el dedo se mueve más en vertical, es un scroll normal y no se hace nada.

const UMBRAL_GESTO = 72;      // píxeles que hay que deslizar
let gestoReciente = false;    // para que soltar el dedo no abra también la ficha

function conectarGestos() {
    let gesto = null;
    document.addEventListener("pointerdown", (evento) => {
        const tarjeta = evento.target.closest(".lista .mision:not(.apagada):not(.fila-ordenar)");
        if (!tarjeta || !tarjeta.querySelector(":scope > .boton-check")) return;
        if (evento.target.closest("button, input")) return;
        gesto = { tarjeta, x: evento.clientX, y: evento.clientY, dx: 0, activo: false, puntero: evento.pointerId };
    });
    document.addEventListener("pointermove", (evento) => {
        if (!gesto || evento.pointerId !== gesto.puntero) return;
        const dx = evento.clientX - gesto.x;
        const dy = evento.clientY - gesto.y;
        if (!gesto.activo) {
            if (Math.abs(dy) > 10) { gesto = null; return; }   // es un scroll
            if (dx < 12) return;
            gesto.activo = true;
            gesto.tarjeta.classList.add("deslizando");
        }
        gesto.dx = Math.max(0, Math.min(120, dx));
        gesto.tarjeta.style.transform = `translateX(${gesto.dx}px)`;
        gesto.tarjeta.classList.toggle("gesto-listo", gesto.dx > UMBRAL_GESTO);
    });
    const soltar = (cancelado) => {
        if (!gesto) return;
        const { tarjeta, dx, activo } = gesto;
        gesto = null;
        if (!activo) return;
        tarjeta.classList.remove("deslizando", "gesto-listo");
        tarjeta.style.transform = "";
        gestoReciente = true;
        setTimeout(() => { gestoReciente = false; }, 80);
        if (!cancelado && dx > UMBRAL_GESTO) tarjeta.querySelector(":scope > .boton-check").click();
    };
    document.addEventListener("pointerup", () => soltar(false));
    document.addEventListener("pointercancel", () => soltar(true));
}


// ===== Ordenar arrastrando ☰ =====
// Mientras arrastras, la fila sigue al dedo; al pasar la mitad de la vecina, cambian de lugar.

function conectarArrastre() {
    const lista = $("#ordenar-lista");
    let arrastre = null;
    lista.addEventListener("pointerdown", (evento) => {
        const mango = evento.target.closest("[data-mango]");
        if (!mango) return;
        evento.preventDefault();
        mango.setPointerCapture(evento.pointerId);
        arrastre = { fila: mango.closest("li"), y: evento.clientY };
        arrastre.fila.classList.add("arrastrando");
    });
    lista.addEventListener("pointermove", (evento) => {
        if (!arrastre) return;
        const { fila } = arrastre;
        let dy = evento.clientY - arrastre.y;
        const siguiente = fila.nextElementSibling;
        const anterior = fila.previousElementSibling;
        if (siguiente && dy > siguiente.offsetHeight / 2) {
            siguiente.after(fila);
            arrastre.y += siguiente.offsetHeight + 10;
        } else if (anterior && dy < -anterior.offsetHeight / 2) {
            anterior.before(fila);
            arrastre.y -= anterior.offsetHeight + 10;
        }
        dy = evento.clientY - arrastre.y;
        fila.style.transform = `translateY(${dy}px)`;
    });
    const soltar = () => {
        if (!arrastre) return;
        arrastre.fila.classList.remove("arrastrando");
        arrastre.fila.style.transform = "";
        arrastre = null;
        const ids = [...lista.children].map((fila) => Number(fila.dataset.id));
        ejecutar(() => acciones.ordenarMisiones(estado, ids));
    };
    lista.addEventListener("pointerup", soltar);
    lista.addEventListener("pointercancel", soltar);
}


// ===== Novedades =====
// Después de actualizar la app, una ventana con lo nuevo (una sola vez por versión).

const CLAVE_NOVEDADES = "vida-rpg-novedades";   // la última versión cuyas novedades viste

function marcarNovedadesVistas() {
    try { localStorage.setItem(CLAVE_NOVEDADES, String(VERSION_APP)); } catch { /* sin espacio: no importa */ }
}

function mostrarNovedades() {
    let vista = 0;
    try { vista = Number(localStorage.getItem(CLAVE_NOVEDADES)) || 0; } catch { /* nada */ }
    const lista = novedadesPorVer(vista);
    marcarNovedadesVistas();
    if (!lista.length) return;
    // Si nunca habías visto esta ventana, solo lo de esta versión (no toda la historia).
    $("#novedades-contenido").innerHTML = vistas.contenidoNovedades(vista ? lista : lista.slice(0, 1), `🆕 Novedades de la v${VERSION_APP}`);
    $("#dialogo-novedades").showModal();
}


// ===== Bienvenida (la primera vez, o desde Ajustes) =====

let bienvenida = null;   // { paso, misiones: Set, recompensas: Set, alTerminar }

function abrirBienvenida(alTerminar = () => {}) {
    bienvenida = { paso: 1, misiones: new Set(), recompensas: new Set(), alTerminar };
    $("#bienvenida").hidden = false;
    pintarBienvenida();
}

function pintarBienvenida({ mantenerScroll = false } = {}) {
    const caja = $("#bienvenida-caja");
    const y = caja.scrollTop;
    caja.innerHTML = vistas.pantallaBienvenida(bienvenida, estado.personaje.nombre,
                                               { misiones: PLANTILLAS_MISIONES, recompensas: PLANTILLAS_RECOMPENSAS });
    caja.scrollTop = mantenerScroll ? y : 0;
}

function cerrarBienvenida() {
    const alTerminar = bienvenida?.alTerminar;
    bienvenida = null;
    $("#bienvenida").hidden = true;
    alTerminar?.();
}


// ===== Copia de seguridad =====

// ===== El Maestro =====

function abrirMaestro(modo = "inicio") {
    maestroVista = { modo, respuesta: "" };
    $("#maestro").hidden = false;
    pintarMaestro();
}

function pintarMaestro() {
    $("#maestro-caja").innerHTML = vistas.dialogoMaestro(contextoActual(), maestroVista);
}

function cerrarMaestro() {
    $("#maestro").hidden = true;
}


// ===== El ritual de la noche =====
// Tres pasos: repasar las misiones que faltan (una carta por misión), el diario y el capítulo de hoy.

function abrirRitual() {
    ritual = { paso: "misiones", cola: rituales.pendientesDelDia(estado, hoy()).map((m) => m.id), indice: 0, motivo: false };
    $("#ritual").hidden = false;
    pintarRitual();
}

function pintarRitual() {
    if (!ritual) return;
    if (ritual.paso === "misiones" && ritual.indice >= ritual.cola.length && ritual.cola.length) ritual.paso = "diario";
    $("#ritual-caja").innerHTML = vistas.pantallaRitual(estado, contextoActual(), ritual);
    $("#ritual").scrollTop = 0;
}

function cerrarRitual() {
    ritual = null;
    $("#ritual").hidden = true;
}

// La carta de la misión actual: hecha (true) o fallada con su motivo (false).
function ritualMision(hecha, motivo) {
    const id = ritual.cola[ritual.indice];
    const resultado = hecha
        ? ejecutar(() => acciones.completarMision(estado, id, hoy()))
        : ejecutar(() => acciones.fallarMision(estado, id, hoy(), motivo));
    if (!resultado) return;
    if (hecha) sonar("completar");
    else mostrarRobo(resultado.robo);
    ritual.motivo = false;
    ritual.indice += 1;
    pintarRitual();
}

// Deslizar la carta: a la derecha = la hice; a la izquierda = no la hice (pregunta el motivo).
function conectarCartaRitual() {
    let inicio = null;
    $("#ritual").addEventListener("pointerdown", (evento) => {
        const carta = evento.target.closest(".ritual-carta");
        if (carta && ritual && !ritual.motivo) inicio = { x: evento.clientX, carta };
    });
    $("#ritual").addEventListener("pointermove", (evento) => {
        if (!inicio) return;
        const dx = evento.clientX - inicio.x;
        inicio.carta.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
        inicio.carta.classList.toggle("hacia-si", dx > 70);
        inicio.carta.classList.toggle("hacia-no", dx < -70);
    });
    const soltar = (evento) => {
        if (!inicio) return;
        const dx = evento.clientX - inicio.x;
        inicio.carta.style.transform = "";
        inicio = null;
        if (dx > 70) ritualMision(true);
        else if (dx < -70) ACCIONES["ritual-no"]();
    };
    $("#ritual").addEventListener("pointerup", soltar);
    $("#ritual").addEventListener("pointercancel", () => { if (inicio) inicio.carta.style.transform = ""; inicio = null; });
}


// ===== El golpe con timing =====
// Al completar una misión aparece el jefe de su categoría y una marca que va y viene.
// Si tocas cuando la marca está en la zona dorada, el golpe es crítico (+50 % de daño).

function iniciarGolpe(id, fecha) {
    if (!estado.ajustes.golpe || !$("#celebracion").hidden || golpe) return;
    const mision = estado.misiones.find((m) => m.id === id);
    const jefe = mision && campana.estadoCampanas(estado)[mision.atributo]?.jefe;
    if (!jefe) return;
    golpe = { id, fecha, mision: mision.nombre, jefe, resultado: null };
    $("#golpe").hidden = false;
    $("#golpe-caja").innerHTML = vistas.pantallaGolpe(golpe);
    golpe.temporizador = setTimeout(cerrarGolpe, 5000);   // si no tocas, se va solo
}

function golpear() {
    if (!golpe) return;
    if (golpe.resultado) {
        cerrarGolpe();
        return;
    }
    // ¿La marca está dentro de la zona dorada?
    const marca = $(".golpe-marca").getBoundingClientRect();
    const zona = $(".golpe-zona").getBoundingClientRect();
    const centro = marca.left + marca.width / 2;
    const critico = centro >= zona.left && centro <= zona.right;
    if (critico) ejecutar(() => acciones.golpeCritico(estado, golpe.id, golpe.fecha));
    sonar(critico ? "critico" : "impacto");
    golpe.resultado = critico ? "critico" : "normal";
    $("#golpe-caja").innerHTML = vistas.pantallaGolpe(golpe);
    clearTimeout(golpe.temporizador);
    golpe.temporizador = setTimeout(cerrarGolpe, 1300);
}

function cerrarGolpe() {
    if (golpe) clearTimeout(golpe.temporizador);
    golpe = null;
    $("#golpe").hidden = true;
}


// ===== Firmar el pacto con el dedo =====
// Se dibuja en un <canvas>. El trazo se guarda como un "camino" SVG ("M10 20 L12 22 …")
// en un recuadro de 600 × 200, así la firma se ve igual en cualquier pantalla.
let trazoFirma = "";

function prepararLienzoFirma() {
    const lienzo = $("#pacto-lienzo");
    if (!lienzo) return;
    trazoFirma = "";
    const caja = lienzo.getBoundingClientRect();
    const densidad = window.devicePixelRatio || 1;
    lienzo.width = Math.round(caja.width * densidad);
    lienzo.height = Math.round(caja.height * densidad);
    const pincel = lienzo.getContext("2d");
    pincel.scale(lienzo.width / pacto.ANCHO_FIRMA, lienzo.height / pacto.ALTO_FIRMA);
    pincel.lineWidth = 4;
    pincel.lineCap = "round";
    pincel.lineJoin = "round";
    pincel.strokeStyle = "#7a1414";   // tinta roja, como de sangre

    // Dónde está el dedo, en coordenadas del recuadro (sin salirse de él).
    const punto = (evento) => {
        const c = lienzo.getBoundingClientRect();
        const x = Math.min(pacto.ANCHO_FIRMA, Math.max(0, ((evento.clientX - c.left) / c.width) * pacto.ANCHO_FIRMA));
        const y = Math.min(pacto.ALTO_FIRMA, Math.max(0, ((evento.clientY - c.top) / c.height) * pacto.ALTO_FIRMA));
        return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    };
    const linea = (desde, hasta) => {
        pincel.beginPath();
        pincel.moveTo(...desde);
        pincel.lineTo(...hasta);
        pincel.stroke();
    };
    let anterior = null;
    lienzo.onpointerdown = (evento) => {
        lienzo.setPointerCapture(evento.pointerId);
        anterior = punto(evento);
        trazoFirma += `M${anterior[0]} ${anterior[1]} L${anterior[0]} ${anterior[1]} `;
        linea(anterior, anterior);
        $("#pacto-firma").value = trazoFirma.trim();
    };
    lienzo.onpointermove = (evento) => {
        if (!anterior) return;
        const nuevo = punto(evento);
        if (Math.hypot(nuevo[0] - anterior[0], nuevo[1] - anterior[1]) < 2) return;   // ignora temblores mínimos
        linea(anterior, nuevo);
        trazoFirma += `L${nuevo[0]} ${nuevo[1]} `;
        anterior = nuevo;
        $("#pacto-firma").value = trazoFirma.trim();
    };
    lienzo.onpointerup = lienzo.onpointercancel = () => { anterior = null; };
}

function pintarListaDiario() {
    $("#diario-lista").innerHTML = vistas.listaDiario(estado, contextoDiario(hoy()));
}

// Descargar todo el diario como un archivo de texto (en el iPhone: «Guardar en Archivos»).
function descargarDiario() {
    return descargarTexto(`diario-${hoy()}.txt`, diario.diarioComoTexto(estado, estado.personaje.nombre), "Mi diario");
}

// Pasar a una página del libro: "portada", "indice" o el número de un capítulo.
function irAPaginaDelLibro(pagina) {
    paginaLibro = pagina;
    dibujarPantalla();
    window.scrollTo(0, 0);
}

// Deslizar a la izquierda o a la derecha sobre la página para pasar al capítulo siguiente o al anterior.
function conectarHojear() {
    const hoja = $(".libro-pagina");
    if (!hoja) return;
    let inicio = null;
    hoja.onpointerdown = (evento) => { inicio = { x: evento.clientX, y: evento.clientY }; };
    hoja.onpointerup = (evento) => {
        if (!inicio) return;
        const dx = evento.clientX - inicio.x;
        const dy = evento.clientY - inicio.y;
        inicio = null;
        if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;   // fue un toque o un scroll
        const total = libro.capitulosDelLibro(estado, hoy()).length;
        const actual = Number(paginaLibro) || 0;   // portada e índice cuentan como 0
        const siguiente = dx < 0 ? actual + 1 : actual - 1;
        if (siguiente >= 1 && siguiente <= total) irAPaginaDelLibro(siguiente);
        else if (siguiente === 0) irAPaginaDelLibro("portada");
    };
}

// Guardar un texto como archivo: en el iPhone abre «Compartir» (→ Guardar en Archivos); en la compu lo descarga.
async function descargarTexto(nombre, texto, titulo) {
    const archivo = new File([texto], nombre, { type: "text/plain" });
    try {
        if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
            await navigator.share({ files: [archivo], title: titulo });
        } else {
            const enlace = document.createElement("a");
            enlace.href = URL.createObjectURL(archivo);
            enlace.download = nombre;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
        }
    } catch (error) {
        if (error.name !== "AbortError") alert("No se pudo descargar el archivo.");
    }
}

async function exportar() {
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
function cargarPartida(nuevo, mensaje) {
    const veniaDelInicio = $("#juego").hidden;
    estado = nuevo;
    datos.guardar(estado);
    $("#dialogo-ajustes").close();
    avisar(mensaje);
    if (veniaDelInicio) entrarAlJuego();
    else refrescar();
}

function borrarTodo() {
    if (!confirm("¿Seguro? Se borrará TODO tu progreso de este teléfono.")) return;
    if (!confirm("Última oportunidad: esto no se puede deshacer. ¿Borrar todo?")) return;
    $("#dialogo-ajustes").close();
    reiniciarPartida();
}

// Borra la partida y el PIN, y vuelve a la pantalla de crear personaje.
function reiniciarPartida() {
    datos.borrarTodo();
    seguridad.quitar();
    estado = datos.estadoInicial();
    diaSeleccionado = null;
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

const ACCIONES = {
    ir: (boton) => cambiarPantalla(boton.dataset.pantalla),
    abrir: (boton) => abrirDialogo(boton.dataset.dialogo),
    cerrar: (boton) => boton.closest("dialog").close(),

    "alternar-mision": (boton) => {
        const id = Number(boton.dataset.id);
        const fecha = fechaVista();   // hoy, o ayer si estás corrigiendo el día anterior
        const estabaHecha = boton.getAttribute("aria-pressed") === "true";
        const resultado = estabaHecha
            ? ejecutar(() => acciones.desmarcarMision(estado, id, fecha))
            : ejecutar(() => acciones.completarMision(estado, id, fecha), { recienHecha: id });
        if (!resultado) return;
        sonar(estabaHecha ? "desmarcar" : "completar");
        flotarXp(`.mision[data-id="${id}"]`, resultado.xp);
        if (!estabaHecha) {
            const mision = estado.misiones.find((m) => m.id === id);
            ofrecerDeshacer(`✔ ${mision.nombre} · +${resultado.xp} XP${resultado.clave ? " 🔑" : ""}${resultado.forma ? " ✨" : ""}`,
                            () => ejecutar(() => acciones.desmarcarMision(estado, id, fecha)));
            setTimeout(() => iniciarGolpe(id, fecha), 350);   // el golpe con timing contra el jefe
        }
    },
    "ver-fecha": (boton) => {
        diaVisto = boton.dataset.dia;
        dibujarPantalla();
    },
    "editar-mision": (boton) => {
        boton.closest("dialog")?.close();   // si viene de la ficha, la ficha se cierra
        abrirDialogo("mision", estado.misiones.find((m) => m.id === Number(boton.dataset.id)));
    },
    // Tocar una misión abre su ficha (salvo justo después de deslizarla).
    "ver-ficha": (elemento) => {
        if (gestoReciente) return;
        const mision = estado.misiones.find((m) => m.id === Number(elemento.dataset.id));
        if (mision) abrirDialogo("ficha", mision);
    },
    // Estos tres botones están dentro de la ventana de editar misión.
    "mover-mision": (boton) => {
        ejecutar(() => acciones.moverMision(estado, idEnEdicion(boton), Number(boton.dataset.direccion)));
    },
    "archivar-mision": (boton) => {
        if (confirm("¿Archivar esta misión? Dejará de aparecer, pero su historial se guarda y la puedes restaurar.")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            if (ejecutar(() => acciones.archivarMision(estado, id))) {
                ofrecerDeshacer("📦 Misión archivada", () => ejecutar(() => acciones.restaurarMision(estado, id)));
            }
        }
    },
    "restaurar-mision": (boton) => ejecutar(() => acciones.restaurarMision(estado, Number(boton.dataset.id))),
    "restaurar-principal": (boton) => ejecutar(() => acciones.restaurarPrincipal(estado, Number(boton.dataset.id))),

    // Misiones con cantidad: +1 / −1 (data-paso) o escribir el número.
    "sumar-cantidad": (boton) => {
        const id = Number(boton.dataset.id);
        const mision = estado.misiones.find((m) => m.id === id);
        const fecha = fechaVista();
        const nueva = juego.cantidadDe(estado, mision, fecha) + Number(boton.dataset.paso);
        cambiarCantidad(mision, fecha, nueva);
    },
    "escribir-cantidad": (boton) => {
        const id = Number(boton.dataset.id);
        const mision = estado.misiones.find((m) => m.id === id);
        const fecha = fechaVista();
        const texto = prompt(`¿Cuánto llevas? (meta: ${mision.meta.cantidad} ${mision.meta.unidad})`, juego.cantidadDe(estado, mision, fecha));
        if (texto === null || texto.trim() === "") return;   // canceló
        cambiarCantidad(mision, fecha, Number(texto.trim()));
    },

    // Tareas sueltas.
    "alternar-tarea": (boton) => {
        const id = Number(boton.dataset.id);
        const estabaHecha = boton.getAttribute("aria-pressed") === "true";
        const resultado = ejecutar(() => acciones.alternarTarea(estado, id), estabaHecha ? {} : { recienTarea: id });
        if (!resultado) return;
        sonar(estabaHecha ? "desmarcar" : "completar");
        flotarXp(`.tarea[data-tarea="${id}"]`, resultado.xp);
        if (!estabaHecha) {
            const tarea = estado.tareas.find((x) => x.id === id);
            ofrecerDeshacer(`✔ ${tarea.nombre} · +${resultado.xp} XP`, () => ejecutar(() => acciones.alternarTarea(estado, id)));
        }
    },
    "editar-tarea": (boton) => {
        abrirDialogo("tarea", estado.tareas.find((t) => t.id === Number(boton.dataset.id)));
    },
    "borrar-tarea": (boton) => {
        if (confirm("¿Borrar esta tarea?")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarTarea(estado, id));
        }
    },

    "cancelar-enfoque": () => {
        if (confirm("¿Cancelar la sesión? Si la cortas ahora, no recibes premio.")) {
            if (ejecutar(() => acciones.cancelarEnfoque(estado))) avisos.avisarEnfoque(null);
        }
    },

    // Notificaciones (en Ajustes).
    "quitar-horario": (boton) => {
        if (ejecutar(() => acciones.quitarHorario(estado, Number(boton.dataset.id)))) {
            sincronizarAvisos();
            pintarAvisos();
        }
    },
    "aviso-enfoque": (casilla) => {
        if (ejecutar(() => acciones.cambiarAvisoEnfoque(estado, casilla.checked))) sincronizarAvisos();
    },
    "probar-avisos": () => probarAvisos().catch((error) => alert(error.message)),
    "probar-cuerno": () => sonar("aviso"),
    "reactivar-avisos": () => {
        if (!registroSW) {
            alert("La app todavía se está preparando. Intenta otra vez en unos segundos.");
            return;
        }
        avisos.reactivar(registroSW, estado)
            .then(() => {
                problemaAvisos = null;
                dibujarPantalla();
                avisar("🔔 Notificaciones reactivadas");
                return probarAvisos();
            })
            .catch((error) => alert(error.message));
    },
    "desactivar-avisos": () => {
        if (!confirm("¿Desactivar las notificaciones en este teléfono? Tus horarios quedan guardados.")) return;
        avisos.desactivar(registroSW)
            .then(pintarAvisos)
            .then(() => avisar("🔕 Notificaciones desactivadas"));
    },
    // (v49) El botón de Hoy ahora abre la pregunta «¿Cómo te sientes hoy?» para cambiar el menú cuando quieras.
    "alternar-esencial": () => preguntarAnimo(),
    "elegir-animo": (boton) => elegirAnimo(boton.dataset.animo),
    // (v52) «Por atributo» / «Por momento» en Hoy. (Antes usaban la acción «subvista», que intentaba abrir una pantalla «hoy-agrupar».)
    "agrupar-hoy": (boton) => {
        agruparHoy = boton.dataset.grupo;
        dibujarPantalla({ mantenerScroll: true });
    },
    "cerrar-semana": () => {
        ejecutar(() => acciones.cerrarResumenSemanal(estado));
        window.scrollTo(0, 0);
    },
    "revisar-semana": () => {
        const lunes = semanaPorMostrar(estado, hoy());
        if (lunes) abrirDialogo("revision", lunes);
    },

    "alternar-submision": (boton) => {
        const id = Number(boton.dataset.id);
        const sub = Number(boton.dataset.sub);
        const resultado = ejecutar(() => acciones.alternarSubmision(estado, id, sub));
        if (!resultado) return;
        sonar(resultado.xp > 0 ? "completar" : "desmarcar");
        flotarXp(`.tarjeta[data-id="${id}"]`, resultado.xp);
        if (resultado.xp > 0) {
            ofrecerDeshacer(`✔ Paso completado · +${resultado.xp} XP`, () => ejecutar(() => acciones.alternarSubmision(estado, id, sub)));
        }
    },
    "borrar-submision": (boton) => {
        ejecutar(() => acciones.borrarSubmision(estado, Number(boton.dataset.id), Number(boton.dataset.sub)));
    },
    "archivar-principal": (boton) => {
        if (confirm("¿Archivar esta misión principal?")) {
            ejecutar(() => acciones.archivarPrincipal(estado, Number(boton.dataset.id)));
        }
    },

    "editar-logro": (boton) => {
        abrirDialogo("logro", estado.logros.find((l) => l.id === Number(boton.dataset.id)));
    },
    "borrar-logro": (boton) => {
        if (confirm("¿Borrar este logro?")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarLogro(estado, id));
        }
    },
    lograr: (boton) => {
        if (confirm("¿Conseguiste este logro? ¡Felicidades!")) {
            ejecutar(() => acciones.lograrManual(estado, Number(boton.dataset.id)));
        }
    },

    jugar: (boton) => jugarMinijuego(boton.dataset.juego),

    // Elegir una sección de una pantalla larga (ej: Tienda › Mascotas). Si es de otra pantalla, se va a ella.
    // (v101) Llevar puesta una insignia (o quitarla).
    "poner-insignia": (boton) => {
        if (ejecutar(() => acciones.ponerInsignia(estado, boton.dataset.id))) sonar("cursor");
    },
    // (v100) En la Tienda › Equipo: ver solo una casilla (cabeza, pecho, piernas…) o todo.
    "filtro-equipo": (boton) => {
        subvista.tiendaEquipo = boton.dataset.espacio;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    subvista: (boton) => {
        const { pantalla, vista } = boton.dataset;
        subvista[pantalla] = vista;
        if (pantallaActual !== pantalla) {
            cambiarPantalla(pantalla);
            return;
        }
        dibujarPantalla({ mantenerScroll: true });
        // Si bajaste mucho (el menú va pegado bajo la cabecera), la sección nueva empieza desde arriba.
        const selector = $(`#pantalla-${pantalla} .selector-secciones`);
        if (selector && selector.getBoundingClientRect().top <= parseFloat(getComputedStyle(selector).top) + 1) window.scrollTo(0, 0);
    },
    // En Aventuras: ver otra campaña de jefes.
    "ver-campana": (boton) => {
        campanaVista = boton.dataset.categoria;
        dibujarPantalla({ mantenerScroll: true });
    },

    // Torre del héroe y Mazmorra del Abismo (data-lugar dice cuál).
    "torre-abrir": (boton) => {
        const lugar = bestiario.LUGARES[boton.dataset.lugar] ? boton.dataset.lugar : "torre";
        // La marca de la tarjeta del Arcade (en «Subir otra vez» no hay tarjeta: sin marca).
        const marcada = boton.closest("article")?.querySelector(`input[name="marca-${lugar}"]:checked`);
        const modo = boton.closest("article")?.querySelector(`input[name="modo-${lugar}"]:checked`)?.value || "normal";   // (v65)
        return abrirTorre(lugar, marcada?.value || null, modo);
    },
    "bestiario-abrir": () => abrirBestiario(),
    "historia-abrir": (boton) => {
        lugarAbierto = bestiario.LUGARES[boton.dataset.lugar] ? boton.dataset.lugar : "torre";
        abrirHistoria(lugarAbierto);
        ponerMusica();
    },
    "torre-salir": () => cerrarTorre(),
    // Las Voces del Valle (v44)
    "voces-hablar": (boton) => abrirVoces(boton.dataset.escena),
    // (v56) Volver a ver una escena: la de una región del mapa o la de un capítulo de la historia de la Torre.
    "reiniciar-cines": () => {
        ejecutar(() => acciones.reiniciarCinematicas(estado));
        avisar("🎬 Las escenas volverán a verse al abrir el mapa, el arcade y la aldea");
    },
    "cine-region": (boton) => reproducirEscena(cinesReino.cinematicaDeRegion(Number(boton.dataset.region), estado.personaje.nombre)),
    "cine-capitulo": (boton) => verEscenaDeCapitulo(boton.dataset.lugar, boton.dataset.id),
    "voces-elegir": (boton) => {
        const resultado = ejecutar(() => acciones.elegirEnEscena(estado, Number(boton.dataset.indice)));
        if (!resultado) return;
        sonar("cursor");
        if (resultado.terminada) {
            resultadoVoces = resultado;
            sonar(resultado.fin === "bien" ? "logro" : resultado.fin === "mal" ? "fallo" : "completar");
        }
        pintarEscenaVoces();
        if (resultado.terminada) setTimeout(() => cinematicaDeLaAldea(resultado), 700);
    },
    "voces-epilogo": () => {   // el epílogo de la aldea (al recuperar la última voz, o para releerlo)
        verEpilogo = true;
        resultadoVoces = null;
        $("#voces").hidden = false;
        pintarEscenaVoces();
    },
    "voces-salir": () => cerrarVoces(),      // la conversación queda guardada: se sigue después
    "voces-cerrar": () => cerrarVoces(),
    "voces-abandonar": () => {
        if (!confirm("¿Dar por perdida esta conversación? La ficha ya se gastó y hoy no volverás a hablar con esta persona.")) return;
        if (ejecutar(() => acciones.abandonarEscena(estado))) cerrarVoces();
    },
    "voces-tarea": (boton) => {
        if (!ejecutar(() => acciones.crearTareaDeEscena(estado, boton.dataset.escena, boton.dataset.tarea))) return;
        avisar("📌 Tarea creada para hoy");
        pintarEscenaVoces();
    },
    // «Continuar» en una página de la historia: la siguiente, o volver a la batalla.
    "torre-relato": () => {
        if (!relatoEnCurso) return;
        relatoEnCurso.pagina += 1;
        if (relatoEnCurso.pagina >= relatoEnCurso.relato.paginas.length) relatoEnCurso = null;
        sonar("cursor");
        pintarTorre();
        $("#torre-caja").scrollTop = 0;
    },
    // «Magia» abre la lista de hechizos, «Técnicas» la de técnicas; «Volver» regresa a los comandos.
    "torre-menu": (boton) => {
        menuTorre = ["magia", "tecnicas"].includes(boton.dataset.menu) ? boton.dataset.menu : "principal";
        sonar("cursor");
        pintarTorre();
    },
    "torre-accion": (boton) => {
        // elemento: solo en los hechizos; tecnica: solo en las técnicas (v38).
        const { torre: comando, elemento = null, tecnica = null } = boton.dataset;
        const resultado = ejecutar(() => acciones.accionTorre(estado, comando, elemento || tecnica, lugarAbierto));
        if (!resultado) return;
        ultimoComando = comando;
        if (elemento) ultimoHechizo = elemento;
        if (tecnica) ultimaTecnica = tecnica;
        menuTorre = "principal";
        pintarTorre(resultado.eventos);
        sonarTurno(resultado.eventos);
        // Cayó un guardián: después de verlo deshacerse, su cinemática.
        if (resultado.eventos.some((e) => e.tipo === "derrotado") && estado.arcade[lugarAbierto]?.cine) {
            setTimeout(() => reproducirCinematica(lugarAbierto), 1700);
        }
    },
    "torre-mejora": async (boton) => {
        const resultado = ejecutar(() => acciones.mejoraTorre(estado, boton.dataset.mejora, lugarAbierto));
        if (!resultado) return;
        sonar("completar");
        await prepararSprites();   // la criatura del piso nuevo (y su sala, si cambia la zona)
        // Si acabas de vencer a un guardián por primera vez, la historia sigue.
        if (resultado.relato) {
            await mostrarRelato(resultado.relato);   // la historia ya cuenta la llegada a la zona nueva
            descartarCinematica(lugarAbierto);
        } else {
            pintarTorre();
            vozDeLlegada();   // (v58) la criatura del piso nuevo
            await reproducirCinematica(lugarAbierto);   // llegaste a una zona nueva o al piso de un guardián
        }
    },
    // El camino se bifurca (v60): desafío (élite, mejor botín) o sendero tranquilo (te curas, criatura cansada).
    "torre-ruta": (boton) => {
        const resultado = ejecutar(() => acciones.rutaTorre(estado, boton.dataset.ruta, lugarAbierto));
        if (!resultado) return;
        sonar(boton.dataset.ruta === "desafio" ? "retumbo" : "pocion");
        pintarTorre();
        vozDeLlegada();
    },
    // Una sala entre pisos (v42): la opción elegida cambia a tu héroe y sigue la batalla.
    "torre-sala": (boton) => {
        const resultado = ejecutar(() => acciones.salaTorre(estado, boton.dataset.opcion, lugarAbierto));
        if (!resultado) return;
        sonar(boton.dataset.opcion === "seguir" ? "cursor" : "completar");
        pintarTorre();
    },
    "torre-rendirse": () => {
        const sitio = bestiario.LUGARES[lugarAbierto];
        const texto = lugarAbierto === "torre"
            ? "¿Huir de la Torre? Cobras lo que ganaste hasta ahora y la subida termina."
            : `¿Huir de ${lugarAbierto === "mazmorra" ? "la Mazmorra" : `las ${sitio.nombre.split(" ")[0]}`.replace("las Laberinto", "el Laberinto")}? Cobras lo que ganaste hasta ahora y ${sitio.verboBajar || "el descenso"} termina.`;
        if (!confirm(texto)) return;
        ACCIONES["torre-cobrar"]();
    },
    "torre-cobrar": () => {
        const resultado = ejecutar(() => acciones.terminarTorre(estado, lugarAbierto));
        if (!resultado) return;
        resultadoTorre = resultado;
        sonar(resultado.nuevoRecord ? "logro" : "moneda");
        pintarTorre();
    },

    comprar: (boton) => {
        const objeto = avatar.OBJETOS[boton.dataset.id];
        if (objeto && confirm(`¿Comprar «${objeto.nombre}» por ${objeto.precio} gemas 💎?`)) {
            if (ejecutar(() => acciones.comprarObjeto(estado, boton.dataset.id))) sonar("moneda");
        }
    },
    equipar: (boton) => ejecutar(() => acciones.equiparObjeto(estado, boton.dataset.id)),
    // Mascotas (v26): adoptar una en la Tienda o elegir cuál te acompaña.
    "comprar-mascota": (boton) => {
        const datos = mascota.MASCOTAS[boton.dataset.especie];
        if (datos && confirm(`¿Adoptar «${datos.nombre}» por ${datos.precio} gemas 💎? Llega como huevo.`)) {
            if (ejecutar(() => acciones.comprarMascota(estado, boton.dataset.especie))) sonar("cofre");
        }
    },
    "elegir-mascota": (boton) => {
        if (ejecutar(() => acciones.elegirMascota(estado, boton.dataset.especie))) {
            avisar(`🐾 Ahora te acompaña ${mascota.nombreDe(estado, boton.dataset.especie)}`);
        }
    },
    apariencia: (boton) => ejecutar(() => acciones.cambiarApariencia(estado, boton.dataset.campo, boton.dataset.valor)),

    pocion: () => {
        if (!confirm(`¿Tomar una poción de vida por ${vida.POCION.precio} monedas? (+${vida.POCION.cura} ❤️)`)) return;
        if (ejecutar(() => acciones.tomarPocion(estado))) {
            sonar("moneda");
            ofrecerDeshacer(`🧪 Poción · −${vida.POCION.precio} 🪙`, () => ejecutar(() => acciones.deshacerPocion(estado)));
        }
    },
    "terminar-descanso": () => {
        if (!confirm("¿Terminar el descanso? Hoy todavía cuenta como descanso; desde mañana todo vuelve a contar.")) return;
        if (ejecutar(() => acciones.terminarDescanso(estado))) {
            avisar("🏖️ El descanso termina hoy");
            if ($("#dialogo-ajustes").open) pintarDescanso();
        }
    },

    canjear: (boton) => {
        const recompensa = estado.recompensas.find((r) => r.id === Number(boton.dataset.id));
        if (recompensa && confirm(`¿Canjear «${recompensa.nombre}» por ${recompensa.costo} monedas?`)) {
            if (ejecutar(() => acciones.canjear(estado, recompensa.id))) {
                sonar("moneda");
                ofrecerDeshacer(`🎁 ${recompensa.nombre} · −${recompensa.costo} 🪙`, () => ejecutar(() => acciones.deshacerCanje(estado)));
            }
        }
    },
    "editar-atributo": (elemento) => {
        abrirDialogo("atributo", estado.atributosPropios.find((a) => a.id === Number(elemento.dataset.id)));
    },
    "borrar-atributo": (boton) => {
        if (confirm("¿Borrar este atributo? Lo que lo usaba vuelve a su atributo base. La XP que ya ganaste no se pierde.")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarAtributoPropio(estado, id));
        }
    },
    "editar-recompensa": (boton) => {
        abrirDialogo("recompensa", estado.recompensas.find((r) => r.id === Number(boton.dataset.id)));
    },
    "borrar-recompensa": (boton) => {
        if (confirm("¿Quitar esta recompensa de la tienda?")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarRecompensa(estado, id));
        }
    },

    // Tocar un día del calendario: solo cambia el detalle (sin redibujar todo,
    // para no perder la posición del scroll).
    "ver-dia": (boton) => {
        diaSeleccionado = boton.dataset.fecha;
        document.querySelector(".celda.elegido")?.classList.remove("elegido");
        boton.classList.add("elegido");
        const racha = juego.calcularRacha(estado, hoy());
        $("#cal-detalle").innerHTML = vistas.detalleDia(estado, diaSeleccionado, racha);
    },

    // Tu diario: cambiar de mes, tocar un día, filtrar por ánimo, ver más y descargar.
    "diario-mes": (boton) => {
        diarioVista.mes = boton.dataset.mes;
        diarioVista.dia = null;
        dibujarPantalla();
    },
    "diario-dia": (boton) => {
        diarioVista.dia = boton.dataset.fecha;
        document.querySelector(".dia-animo.elegido")?.classList.remove("elegido");
        boton.classList.add("elegido");
        $("#diario-detalle").innerHTML = vistas.detalleEntrada(estado, diarioVista.dia);
    },
    "diario-filtro": (boton) => {
        diarioVista.filtro = boton.dataset.animo || null;
        diarioVista.limite = 30;
        dibujarPantalla();
    },
    "diario-mas": () => {
        diarioVista.limite += 30;
        pintarListaDiario();
    },
    "descargar-diario": () => descargarDiario(),

    // «Fallé» y deshacerlo.
    "fallar-mision": (boton) => {
        const mision = estado.misiones.find((m) => m.id === Number(boton.dataset.id));
        if (mision) abrirDialogo("falla", mision);
    },
    "quitar-falla": (boton) => {
        if (ejecutar(() => acciones.quitarFalla(estado, Number(boton.dataset.id), fechaVista()))) avisar("↺ Ya no está marcada como fallada");
    },

    // El Maestro.
    "maestro-abrir": (boton) => abrirMaestro(boton.dataset.modo || "inicio"),
    // «La primera piedra»: el pergamino motivacional (desde Héroe › Historia o desde la conversación con Aurelio).
    "pergamino-abrir": (boton) => {
        if (!$("#maestro").hidden) cerrarMaestro();
        pergaminoActual = boton?.dataset?.id || "piedra";
        cambiarPantalla("pergamino");
    },
    // (v62) El libro largo de Historia: la portada, un capítulo, el índice y el final.
    "novela-abrir": (boton) => {
        libroNovela = libros.libroPorId(boton?.dataset?.libro) ? boton.dataset.libro : "casio";
        capituloNovela = null;
        cambiarPantalla("novela");
    },
    "novela-capitulo": (boton) => {
        const n = Number(boton.dataset.i);
        if (!ejecutar(() => acciones.marcarLibro(estado, libroNovela, n))) return;
        capituloNovela = n;
        dibujarPantalla();
        window.scrollTo(0, 0);
        animarEntrada("novela");
    },
    "novela-indice": () => {
        capituloNovela = null;
        dibujarPantalla();
        window.scrollTo(0, 0);
    },
    "novela-terminar": async () => {
        const resultado = ejecutar(() => acciones.terminarLibro(estado, libroNovela));
        if (!resultado) return;
        sonar("logro");
        dibujarPantalla();
        window.scrollTo(0, document.body.scrollHeight);
        if (resultado.primera) await verEscenaDelLibro(libroNovela);
    },
    "novela-escena": () => verEscenaDelLibro(libroNovela),
    // (v57) La Biblioteca prohibida: todos los pergaminos en orden.
    "biblioteca-abrir": () => cambiarPantalla("biblioteca"),
    // Terminar de leer: premio (una sola vez) y la cinemática del pergamino.
    "pergamino-terminar": async (boton) => {
        const resultado = ejecutar(() => acciones.terminarPergamino(estado, boton.dataset.id));
        if (!resultado) return;
        sonar("logro");
        dibujarPantalla();
        window.scrollTo(0, document.body.scrollHeight);
        await verEscenaDePergamino(boton.dataset.id);
    },
    "pergamino-escena": (boton) => verEscenaDePergamino(boton.dataset.id),
    // Sus memorias: al abrirlas quedan leídas (las que eran nuevas se marcan «Nuevo» esta vez).
    "memorias-abrir": () => {
        memoriasDesde = estado.maestro.leidas || 0;
        if (!$("#maestro").hidden) cerrarMaestro();
        ejecutar(() => acciones.leerMemorias(estado));
        cambiarPantalla("memorias");
    },
    "maestro-cerrar": () => cerrarMaestro(),
    "robo-cerrar": () => cerrarRobo(),
    "maestro-modo": (boton) => {
        maestroVista = { modo: boton.dataset.modo, respuesta: "" };
        pintarMaestro();
    },
    "maestro-opcion": (boton) => {
        const c = maestro.contexto(estado, hoy());
        const opcion = boton.dataset.opcion;
        maestroVista = { modo: "respuesta", respuesta: maestro.responder(estado, c, opcion), opcion };
        pintarMaestro();
    },
    "maestro-clave": (boton) => {
        const id = Number(boton.dataset.id);
        if (!ejecutar(() => acciones.elegirClave(estado, id))) return;
        sonar("logro");
        const mision = estado.misiones.find((m) => m.id === id);
        maestroVista = { modo: "respuesta", respuesta: `Que así sea: «${mision.nombre}» es tu misión clave de hoy. Vale el doble. No la sueltes.` };
        pintarMaestro();
    },

    // El ritual de la noche.
    "ritual-abrir": () => {
        cerrarMaestro();
        abrirRitual();
    },
    "ritual-cerrar": () => cerrarRitual(),
    "ritual-si": () => ritualMision(true),
    "ritual-no": () => {
        ritual.motivo = true;
        pintarRitual();
    },
    "ritual-volver": () => {
        ritual.motivo = false;
        pintarRitual();
    },
    "ritual-motivo": (boton) => ritualMision(false, boton.dataset.motivo),
    "ritual-seguir": () => {
        ritual.paso = ritual.paso === "misiones" ? "diario" : "final";
        pintarRitual();
    },
    "ritual-terminar": () => {
        const resultado = ejecutar(() => acciones.cerrarDia(estado));
        cerrarRitual();
        if (resultado && !resultado.premio) avisar("🌙 Buenas noches. El día ya estaba cerrado.");
    },

    // El cofre, el desafío relámpago y tu mascota.
    "abrir-cofre": (boton) => {
        if (boton.classList.contains("abriendo")) return;
        boton.classList.add("abriendo");   // tiembla y se abre (estilos.css)
        sonar("cofre");
        setTimeout(() => {
            const resultado = ejecutar(() => acciones.abrirCofre(estado));
            if (!resultado) return;
            const p = resultado.premio;
            celebrar({ icono: p.icono, etiqueta: "🎁 Cofre del día", titulo: p.texto,
                       detalle: p.tipo === "pocion" ? "Ya te curó." : p.tipo === "objeto" ? "Póntelo en tu Héroe › Equipo." : "¡Mañana habrá otro!" });
        }, 900);
    },
    "aceptar-relampago": () => {
        if (ejecutar(() => acciones.aceptarRelampago(estado))) {
            sonar("relampago");
            avisar(`⚡ ¡Que empiece! Tienes ${rituales.RELAMPAGO.minutos / 60} horas`);
        }
    },
    "rechazar-relampago": () => ejecutar(() => acciones.rechazarRelampago(estado)),
    // (v106) Diario: otra pregunta (solo cambia lo que se ve) y abrir una carta del pasado.
    "diario-otra-pregunta": () => {
        diarioVista.salto = (diarioVista.salto || 0) + 1;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    "abrir-carta": (boton) => {
        if (ejecutar(() => acciones.abrirCarta(estado, boton.dataset.id), { mantenerScroll: true })) sonar("victoria");
    },
    "acariciar-dragon": () => {
        const frase = mascota.fraseAlAcariciar(estado, avatarActual().mascota, hoy());
        $("#mascota-frase").textContent = frase;
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, "acariciado");
        sonar("ronroneo");
    },
    // (v103) Los cuidados de cada día: acariciar, jugar, cepillar y entrenar. Suben el vínculo.
    "cuidar-mascota": (boton) => {
        const tipo = boton.dataset.tipo;
        const resultado = ejecutar(() => acciones.cuidarMascota(estado, tipo), { mantenerScroll: true });
        if (!resultado) return;
        const cuidado = mascota.CUIDADOS[tipo];
        const frase = tipo === "acariciar" ? mascota.fraseAlAcariciar(estado, avatarActual().mascota, hoy())
            : `${resultado.nombre}: ${cuidado.texto}`;
        $("#mascota-frase").textContent = resultado.repetido ? frase : `${frase} (+${resultado.puntos} de vínculo)`;
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, { acariciar: "acariciado", jugar: "juega", cepillar: "cepillado", entrenar: "entrena" }[tipo]);
        sonar(tipo === "acariciar" ? "ronroneo" : "cursor");
    },
    "explorar-mascota": () => {
        const resultado = ejecutar(() => acciones.explorarConMascota(estado), { mantenerScroll: true });
        if (!resultado) return;
        $("#mascota-frase").textContent = resultado.hallazgo.texto;
        sonar(resultado.hallazgo.tipo === "nada" ? "cursor" : "cofre");
    },
    // (v103) Un truco: solo se ve (no cambia nada de la partida).
    "truco-mascota": (boton) => {
        const truco = mascota.TRUCOS.find((t) => t.id === boton.dataset.truco);
        if (!truco) return;
        $("#mascota-frase").textContent = truco.frase.replace("{n}", avatarActual().mascota.nombre);
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, truco.animacion);
        sonar(truco.id === "rugir" ? "retumbo" : "cursor");
    },
    "alimentar-dragon": () => {
        if (ejecutar(() => acciones.alimentarDragon(estado))) sonar("moneda");
    },
    // El bazar del arcade: una provisión para la próxima partida de la Torre o la Mazmorra.
    "comprar-provision": (boton) => {
        const p = torre.PROVISIONES[boton.dataset.clave];
        if (p && confirm(`¿Comprar «${p.nombre}» (${p.texto.toLowerCase()}) por ${p.precio} gemas 💎? Se usa al empezar tu próxima partida.`)) {
            if (ejecutar(() => acciones.comprarProvision(estado, boton.dataset.clave), { mantenerScroll: true })) sonar("moneda");
        }
    },

    // El mapa del reino.
    "reclamar-lugar": (boton) => ejecutar(() => acciones.reclamarLugar(estado, boton.dataset.id)),
    "reclamar-todo": () => ejecutar(() => acciones.reclamarTodo(estado)),
    "mapa-region": (boton) => {
        regionMapa = Number(boton.dataset.region);
        dibujarPantalla();
    },
    // Tocar una guarida en el mapa: se ve la ficha de su señor (y brilla un momento).
    "mapa-senor": (boton) => {
        const ficha = document.getElementById(boton.dataset.id);
        if (!ficha) return;
        ficha.scrollIntoView({ behavior: "smooth", block: "start" });
        reproducirAnimacion(ficha, "resaltado");
    },

    // Tu libro: pasar de página y descargarlo.
    "libro-pagina": (boton) => irAPaginaDelLibro(boton.dataset.pagina),
    "descargar-libro": () => descargarTexto(`cronica-${hoy()}.txt`, libro.libroComoTexto(estado, hoy()), "Mi libro"),

    // Tu pacto.
    "pacto-borrar-firma": () => prepararLienzoFirma(),
    "pacto-renovar": () => {
        if (!confirm("¿Renovar tu juramento? Volverás a firmarlo. Tus días honrados se siguen contando desde el primero.")) return;
        renovandoPacto = true;
        dibujarPantalla();
        $(".firmar-pacto")?.scrollIntoView({ block: "center" });
    },
    "pacto-cancelar": () => {
        renovandoPacto = false;
        dibujarPantalla();
        window.scrollTo(0, 0);
    },
    // El gimnasio (v66). Ver gym.js, vistas-gym.js y el final de acciones.js.
    "gym-empezar": (boton) => {
        const fecha = boton.dataset.ayer ? sumarDias(hoy(), -1) : hoy();
        const empezo = ejecutar(() => acciones.empezarGym(estado, boton.dataset.rutina, fecha));
        if (!empezo) return;
        descansoGym = null;
        resumenGym = null;
        subvista.gym = "entrenar";
        if (empezo.frase) { fraseGym = empezo.frase; sonar("campana"); dibujarPantalla(); }
        window.scrollTo(0, 0);
    },
    // (v75) La vista previa del cuerpo: elegir un nivel de físico o un peso, o volver al cuerpo real.
    "gym-vista": (boton) => {
        const d = boton.dataset;
        if (d.quitar) gymVista = null;
        else {
            const real = { fisico: gym.fisicoDe(gym.nivelDeGym(estado.gym.sesiones).nivel), corp: gym.corpulenciaDe(gym.imcActual(estado.gym)) };
            gymVista = { ...real, ...(gymVista || {}) };
            if (d.fisico !== undefined) gymVista.fisico = Number(d.fisico);
            if (d.corp !== undefined) gymVista.corp = Number(d.corp);
        }
        dibujarPantalla({ mantenerScroll: true });
    },
    // La meta que se marca: «hoy entrené» sin anotar series.
    "gym-rapido": (boton) => {
        const fecha = boton.dataset.ayer ? sumarDias(hoy(), -1) : hoy();
        const rutina = boton.dataset.rutina === "toca" ? gym.siguienteRutina(estado.gym.sesiones).id : boton.dataset.rutina;
        const marcado = ejecutar(() => acciones.marcarGymRapido(estado, rutina, fecha), { mantenerScroll: true });
        if (marcado) {
            sonar("completar");
            resumenGym = marcado.sesion;
            subvista.gym = "entrenar";
            fraseGym = { tipo: "marcado", texto: marcado.celebraciones[0]?.maestro || "" };
            dibujarPantalla({ mantenerScroll: true });
        }
    },
    "gym-serie": (boton) => {
        const resultado = ejecutar(() => {
            const r = acciones.marcarSerieGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie));
            // Al terminar una serie empieza el descanso; al desmarcarla, se quita.
            descansoGym = r.hecha ? { fin: Date.now() + estado.gym.descanso * 1000, total: estado.gym.descanso * 1000 } : null;
            if (r.frase) fraseGym = r.frase;
            return r;
        }, { mantenerScroll: true });
        if (resultado) {
            sonar(resultado.hecha ? "pesa" : "desmarcar");
            if (resultado.hecha) navigator.vibrate?.(30);
            if (resultado.frase?.tipo === "record") setTimeout(() => sonar("critico"), 250);
        }
    },
    "gym-extra": (boton) => ejecutar(() => acciones.agregarEjercicioGym(estado, boton.dataset.ejercicio), { mantenerScroll: true }),
    // (v78) El modo foco: los botones + y − de peso y repeticiones, y pasar de la lista al modo foco.
    "gym-ajuste": (boton) => ejecutar(() => acciones.ajustarSerieGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie), boton.dataset.campo, Number(boton.dataset.delta)), { mantenerScroll: true }),
    // (v80) Cada toque es una repetición: suena un tic y, al llegar al máximo del rango, un destello.
    "gym-contar": (boton) => {
        const r = ejecutar(() => acciones.contarRepeticionGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie)), { mantenerScroll: true });
        if (!r) return;
        sonar(r.reps >= r.meta ? "habilidad" : "cursor");
        navigator.vibrate?.(15);
    },
    "gym-foco": (boton) => ejecutar(() => acciones.cambiarAjusteGym(estado, "foco", boton.dataset.valor === "1"), { mantenerScroll: true }),
    "gym-calentar": () => {
        const r = ejecutar(() => acciones.calentarGym(estado), { mantenerScroll: true });
        if (r?.frase) { fraseGym = r.frase; sonar("completar"); dibujarPantalla({ mantenerScroll: true }); }
    },
    "gym-serie-mas": (boton) => ejecutar(() => acciones.cambiarSeriesGym(estado, Number(boton.dataset.ej), 1), { mantenerScroll: true }),
    "gym-serie-menos": (boton) => ejecutar(() => acciones.cambiarSeriesGym(estado, Number(boton.dataset.ej), -1), { mantenerScroll: true }),
    // (v81) Acortar o alargar el descanso que corre, de 15 en 15 segundos.
    "gym-descanso-mas": (boton) => {
        if (!descansoGym) return;
        const cambio = Number(boton.dataset.segundos) * 1000;
        descansoGym = { fin: Math.max(Date.now() + 5000, descansoGym.fin + cambio), total: Math.max(15000, descansoGym.total + cambio) };
        dibujarPantalla({ mantenerScroll: true });
    },
    "gym-saltar-descanso": () => { descansoGym = null; dibujarPantalla({ mantenerScroll: true }); },
    "gym-terminar": () => {
        const hechas = gym.seriesMarcadas(estado.gym.encurso);
        const planeadas = gym.seriesPlaneadas(gym.rutinaPorId(estado.gym.encurso.rutina));
        if (hechas * 2 < planeadas && !confirm(`Solo marcaste ${hechas} de ${planeadas} series. ¿Terminar así?`)) return;
        const fin = ejecutar(() => acciones.terminarGym(estado));
        if (fin) {
            descansoGym = null;
            resumenGym = fin.sesion;
            subvista.gym = "entrenar";
            fraseGym = { tipo: "fin", texto: fin.celebraciones[0]?.maestro || "" };
            sonar("completar");
            dibujarPantalla();
            window.scrollTo(0, 0);
        }
    },
    "gym-cancelar": () => {
        if (!confirm("¿Cancelar el entrenamiento? Se pierde lo que anotaste y no da premio.")) return;
        descansoGym = null;
        fraseGym = null;
        ejecutar(() => acciones.cancelarGym(estado));
    },
    "gym-borrar": (boton) => {
        if (!confirm("¿Borrar esta sesión? Se le quita el XP y las monedas que dio.")) return;
        ejecutar(() => acciones.borrarSesionGym(estado, Number(boton.dataset.indice)), { mantenerScroll: true });
    },
    "gym-meta": (boton) => ejecutar(() => acciones.cambiarAjusteGym(estado, "meta", estado.gym.metaSemanal + Number(boton.dataset.delta)), { mantenerScroll: true }),
    "gym-descanso": (boton) => ejecutar(() => acciones.cambiarAjusteGym(estado, "descanso", boton.dataset.segundos), { mantenerScroll: true }),

    // El running (v109). Ver running.js, vistas-running.js y el final de acciones.js.
    "run-tipo": (boton) => {
        runTipo = boton.dataset.tipo;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    "run-empezar": (boton) => {
        const gps = boton.dataset.gps === "1";
        const objetivo = $("#run-objetivo")?.value || "";
        const empezada = ejecutar(() => acciones.empezarCarrera(estado, runTipo, { gps, objetivo }), { mantenerScroll: true });
        if (!empezada) return;
        runTerminando = false;
        pausoParaTerminar = false;
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
        sonar("cursor");
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

    "ver-pacto": () => {
        $("#dialogo-ajustes").close();
        cambiarPantalla("pacto");
    },

    // Resumen: cambiar entre 7 y 30 días.
    "rango-resumen": (boton) => {
        rangoResumen = Number(boton.dataset.dias);
        dibujarPantalla();
    },
    // Tocar una columna de la gráfica: muestra los números de ese día.
    "ver-columna": (columna) => {
        const dia = calcularResumen(estado, hoy(), rangoResumen).porDia[Number(columna.dataset.i)];
        document.querySelector(".columna.elegida")?.classList.remove("elegida");
        columna.classList.add("elegida");
        $("#resumen-detalle").innerHTML = vistas.textoDiaResumen(dia);
    },

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

    // Copia en la nube.
    "nube-subir": () => {
        avisar("☁️ Cifrando y subiendo…");
        nube.subir(estado).then(() => { pintarNube(); avisar("☁️ Copia guardada en la nube"); }).catch((error) => alert(error.message));
    },
    "nube-desactivar": () => {
        if (!confirm("¿Desactivar la copia en la nube en este teléfono? La última copia queda guardada en la nube.")) return;
        nube.desactivar();
        pintarNube();
    },

    // Novedades y bienvenida.
    "ver-novedades": () => {
        $("#dialogo-ajustes").close();
        $("#novedades-contenido").innerHTML = vistas.contenidoNovedades(NOVEDADES);
        $("#dialogo-novedades").showModal();
    },
    "bienvenida-abrir": () => {
        $("#dialogo-ajustes").close();
        abrirBienvenida();
    },
    "bienvenida-paso": (boton) => {
        bienvenida.paso = Number(boton.dataset.paso);
        pintarBienvenida();
    },
    "bienvenida-mision": (boton) => {
        const elegidas = bienvenida.misiones;
        elegidas.has(boton.dataset.id) ? elegidas.delete(boton.dataset.id) : elegidas.add(boton.dataset.id);
        pintarBienvenida({ mantenerScroll: true });
    },
    "bienvenida-recompensa": (boton) => {
        const elegidas = bienvenida.recompensas;
        elegidas.has(boton.dataset.id) ? elegidas.delete(boton.dataset.id) : elegidas.add(boton.dataset.id);
        pintarBienvenida({ mantenerScroll: true });
    },
    "bienvenida-saltar": () => cerrarBienvenida(),
    "bienvenida-fin": () => {
        const { misiones, recompensas } = bienvenida;
        ejecutar(() => acciones.aplicarBienvenida(estado, { misiones: [...misiones], recompensas: [...recompensas] }));
        cerrarBienvenida();
        avisar("⚔️ ¡Que empiece la aventura!");
    },

    exportar: () => exportar(),
    importar: () => $("#archivo-respaldo").click(),
    "borrar-todo": () => borrarTodo(),
};


// Cambia cuánto llevas de una misión con cantidad. Si así llega a la meta,
// se completa (con su animación); si baja de la meta, se desmarca.
function cambiarCantidad(mision, fecha, nueva) {
    const antes = juego.cantidadDe(estado, mision, fecha);
    const completa = nueva >= mision.meta.cantidad && antes < mision.meta.cantidad;
    const resultado = ejecutar(() => acciones.fijarCantidad(estado, mision.id, fecha, nueva),
                               completa ? { recienHecha: mision.id } : {});
    if (!resultado) return;
    sonar(resultado.xp > 0 ? "completar" : resultado.xp < 0 ? "desmarcar" : "salto");
    flotarXp(`.mision[data-id="${mision.id}"]`, resultado.xp);
    if (resultado.xp > 0) {
        ofrecerDeshacer(`✔ ${mision.nombre} · +${resultado.xp} XP`, () => ejecutar(() => acciones.fijarCantidad(estado, mision.id, fecha, antes)));
    }
}


// ===== Formularios =====
// Cada formulario tiene data-form="...". Recibimos sus valores como objeto:
// { nombre: "Ir al gym", dificultad: "dificil", ... }

const FORMULARIOS = {
    personaje(valores) {
        try {
            acciones.crearPersonaje(estado, valores.nombre);
        } catch (error) {
            alert(error.message);
            return false;
        }
        datos.guardar(estado);
        entrarAlJuego({ nuevo: true });
        return true;
    },
    // Si el formulario trae un id, se está editando; si no, creando.
    mision(valores) {
        if (valores.id) return ejecutar(() => acciones.editarMision(estado, valores));
        // «Una sola vez» se guarda como tarea (da su premio una vez y aparece en 📌 Tareas).
        if (valores.frecuencia === "unica") {
            const resultado = ejecutar(() => acciones.crearTarea(estado, valores));
            if (resultado) avisar("📌 Guardada en Tareas");
            return resultado;
        }
        return ejecutar(() => acciones.crearMision(estado, valores));
    },
    tarea: (valores) => ejecutar(() => (valores.id ? acciones.editarTarea(estado, valores) : acciones.crearTarea(estado, valores))),
    principal: (valores) => ejecutar(() => acciones.crearPrincipal(estado, valores)),
    "gym-altura"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarAlturaGym(estado, valores.cm), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
    "gym-medidas"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarMedidasGym(estado, valores), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
    "gym-meta-peso"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarMetaPesoGym(estado, valores.kg), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
    "gym-peso"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarPesoGym(estado, valores.kg), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
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
    enfoque(valores) {
        const resultado = ejecutar(() => acciones.empezarEnfoque(estado, valores));
        if (resultado) {
            sonar("completar");
            avisos.avisarEnfoque(juego.finDelEnfoque(estado.enfoque.activo));   // para el aviso al terminar
        }
        return resultado;
    },
    // Activar notificaciones: pide permiso al iPhone y registra este teléfono en el servidor.
    "activar-avisos"(valores) {
        if (!registroSW) {
            alert("La app todavía se está preparando. Intenta otra vez en unos segundos.");
            return false;
        }
        avisos.activar(registroSW, valores.codigo, estado)
            .then(async () => {
                // Para empezar, un recordatorio todos los días a las 8 p. m. (lo puedes cambiar).
                if (!estado.avisos.horarios.length) {
                    ejecutar(() => acciones.agregarHorario(estado, { hora: "20:00" }));
                    await avisos.sincronizar(registroSW, estado);
                }
                await pintarAvisos();
                await probarAvisos();
            })
            .catch((error) => alert(error.message));
        return false;   // no cerrar Ajustes
    },
    horario(valores) {
        if (ejecutar(() => acciones.agregarHorario(estado, valores))) {
            sincronizarAvisos();
            pintarAvisos();
        }
        return false;   // no cerrar Ajustes
    },
    "ritual-diario"(valores) {
        if (ejecutar(() => acciones.escribirDiario(estado, { ...valores, fecha: hoy() }))) {
            ritual.paso = "final";
            pintarRitual();
        }
        return false;
    },
    falla(valores) {
        const id = Number(valores.id);
        const resultado = ejecutar(() => acciones.fallarMision(estado, id, valores.fecha, valores.motivo));
        if (resultado) {
            const mision = estado.misiones.find((m) => m.id === id);
            // Primero la escena del robo; al cerrarla, la opción de deshacer.
            mostrarRobo(resultado.robo, () => ofrecerDeshacer(`✗ ${mision.nombre}${resultado.dano ? ` · −${resultado.dano} ❤️` : ""}`,
                                                              () => ejecutar(() => acciones.quitarFalla(estado, id, valores.fecha))));
        }
        return resultado;
    },
    revision(valores) {
        const resultado = ejecutar(() => acciones.guardarRevision(estado, valores));
        if (resultado) avisar("📝 Revisión guardada. ¡A por esta semana!");
        return resultado;
    },
    // (v106) Una carta a tu yo futuro.
    carta(valores, formulario) {
        const resultado = ejecutar(() => acciones.escribirCarta(estado, valores), { mantenerScroll: true });
        if (resultado) {
            avisar(`✉️ Carta sellada: se abre el ${fechaLegible(resultado.abrir)}`);
            sonar("logro");
            formulario.reset();
        }
        return resultado;
    },
    diario(valores) {
        const resultado = ejecutar(() => acciones.escribirDiario(estado, valores), { mantenerScroll: true });
        if (resultado) diarioVista.salto = 0;
        if (resultado?.borrada) avisar("📓 Entrada borrada");
        else if (resultado) avisar(resultado.xp ? `📓 Guardado en tu diario · +${resultado.xp} XP` : "📓 Diario actualizado");
        return resultado;
    },
    logro: (valores) => ejecutar(() => (valores.id ? acciones.editarLogro(estado, valores) : acciones.crearLogro(estado, valores))),
    recompensa: (valores) => ejecutar(() => (valores.id ? acciones.editarRecompensa(estado, valores) : acciones.crearRecompensa(estado, valores))),
    atributo(valores) {
        const resultado = ejecutar(() => (valores.id ? acciones.editarAtributoPropio(estado, valores) : acciones.crearAtributoPropio(estado, valores)));
        if (resultado && !valores.id) avisar(`${valores.icono || "⭐"} Atributo creado: ya lo puedes elegir en tus misiones`);
        return resultado;
    },
    mascota(valores) {
        const resultado = ejecutar(() => acciones.nombrarMascota(estado, valores.nombre));
        if (resultado) avisar(`🐾 Tu mascota ahora se llama ${mascota.nombreDe(estado, mascota.especieActiva(estado))}`);
        return resultado;
    },
    // Activar la copia en la nube: cifra y sube la primera copia.
    "nube-activar"(valores, formulario) {
        if (valores.contrasena !== valores.repetir) {
            alert("Las dos contraseñas no coinciden.");
            return false;
        }
        const boton = formulario.querySelector('[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Cifrando y subiendo…";
        nube.activar(estado, valores.contrasena, valores.codigo)
            .then(() => { pintarNube(); avisar("☁️ Copia en la nube activada"); })
            .catch((error) => {
                alert(error.message);
                boton.disabled = false;
                boton.textContent = "Activar copia en la nube";
            });
        return false;   // no cerrar Ajustes
    },
    // Recuperar la copia de la nube (reemplaza la partida de este teléfono).
    "nube-recuperar"(valores, formulario) {
        const boton = formulario.querySelector('[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Descifrando…";
        nube.recuperar(valores.codigo, valores.contrasena)
            .then(({ texto, fecha }) => {
                const nuevo = datos.desdeRespaldo(texto);
                const pregunta = `¿Reemplazar la partida de este teléfono por la copia del ${fechaLegible(fecha)} («${nuevo.personaje.nombre}»)?`;
                if (estado.personaje && !confirm(pregunta)) return;
                $("#dialogo-nube").close();
                cargarPartida(nuevo, `☁️ Copia del ${fechaLegible(fecha)} recuperada`);
            })
            .catch((error) => alert(error.message))
            .finally(() => {
                boton.disabled = false;
                boton.textContent = "Recuperar";
            });
        return false;
    },
    pacto(valores) {
        if (!confirm("¿Sellar tu pacto? Es un juramento contigo mismo: por ti y para ti.")) return false;
        const eraRenovacion = renovandoPacto;
        renovandoPacto = false;
        const resultado = ejecutar(() => acciones.firmarPacto(estado, valores));
        if (!resultado) {
            renovandoPacto = eraRenovacion;   // algo faltó: la firma sigue ahí para intentarlo otra vez
            return false;
        }
        window.scrollTo(0, 0);
        return true;
    },
    descanso(valores) {
        if (ejecutar(() => acciones.empezarDescanso(estado, valores.hasta))) {
            avisar("🏖️ Modo descanso activado");
            pintarDescanso();
        }
        return false;   // no cerrar Ajustes
    },
    renombrar(valores) {
        const resultado = ejecutar(() => acciones.renombrar(estado, valores.nombre));
        if (resultado) avisar("✏️ Nombre actualizado");
        return false; // no cerrar la ventana de ajustes
    },
    submision: (valores, formulario) =>
        ejecutar(() => acciones.agregarSubmision(estado, Number(formulario.dataset.id), valores.nombre)),
};


// ===== Conectar eventos =====

function conectarEventos() {
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
    diaVisto = "hoy";   // por si cambió el día mientras la app estaba cerrada
    refrescar();
    revisarAlAbrir();
}


// ¡A jugar!
iniciar();
