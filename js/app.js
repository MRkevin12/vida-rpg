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
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as pacto from "./pacto.js";
import * as libro from "./libro.js";
import * as maestro from "./maestro.js";
import * as memorias from "./memorias.js";
import * as rituales from "./rituales.js";
import * as mascota from "./mascota.js";
import * as mapa from "./mapa.js";
import { eventoDelDia } from "./eventos.js";
import { PINTURAS, fuentePintura } from "./pinturas.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "./plantillas.js";
import * as minijuegos from "./minijuegos.js";
import * as sonido from "./sonido.js";
import * as musica from "./musica.js";
import * as equipo from "./equipo.js";
import * as avisos from "./avisos.js";
import * as nube from "./nube.js";
import { VERSION_APP, NOVEDADES, novedadesPorVer } from "./novedades.js";
import { calcularResumen, semanaPorMostrar } from "./resumen.js";
import { dibujarAvatar } from "./dibujo.js";
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
let renovandoPacto = false;      // en «Tu pacto»: true mientras vuelves a firmarlo
let paginaLibro = "portada";     // en «Tu libro»: "portada", "indice" o el número de un capítulo
let problemaAvisos = null;       // si las notificaciones se cortaron: "bloqueadas" o "desconectadas"
let regionMapa = null;           // en el mapa: la región que miras (null = donde vas)
let maestroVista = { modo: "inicio", respuesta: "" };   // la conversación con el Maestro
let memoriasDesde = null;   // cuántas memorias de Aurelio habías leído al abrirlas (las demás se marcan «Nuevo»)
let ritual = null;               // el ritual de la noche en curso: { paso, cola, indice, motivo }
let golpe = null;                // el golpe con timing en curso
let alCerrarRobo = null;         // qué hacer cuando se cierre la escena del robo de vida
// Las secciones elegidas en las pantallas largas (el selector de arriba): solo se ve una a la vez.
const subvista = { progreso: "numeros", tienda: "recompensas", personaje: "equipo" };
let campanaVista = null;         // en Aventuras: qué campaña de jefes se ve (null = la del jefe más cerca de caer)
let roboDesde = 0;               // cuándo se abrió (para no cerrarla con el mismo toque)

// Las pantallas sin pestaña propia iluminan la pestaña de la que dependen.
const PESTANA_DE = { mapa: "aventuras", arcade: "aventuras", enfoque: "hoy", diario: "hoy", libro: "hoy", pacto: "personaje", memorias: "personaje" };

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
    enfoque: vistas.pantallaEnfoque,
    diario: vistas.pantallaDiario,
    pacto: vistas.pantallaPacto,
    libro: vistas.pantallaLibro,
    mapa: vistas.pantallaMapa,
    memorias: vistas.pantallaMemorias,
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
    datos.pedirAlmacenamientoPersistente();
    registrarServiceWorker();
    rellenarOpciones();
    conectarEventos();
    setInterval(tictac, 1000);   // reloj del modo enfoque

    if (!estado.personaje) {
        $("#crear-personaje").hidden = false;
    } else if (seguridad.hayPin()) {
        pedirPinParaEntrar(entrarAlJuego);   // primero el PIN (o Face ID), después el juego
        entrarConFaceId(entrarAlJuego, { silencioso: true });
    } else {
        entrarAlJuego();
    }
    ocultarCarga();
}

// La pantalla de carga (está en index.html) se va con una transición. Se queda al menos
// CARGA_MINIMA milisegundos desde que se abrió la app: si se fuera de golpe, se vería un parpadeo.
const CARGA_MINIMA = 1100;

function ocultarCarga() {
    const carga = $("#carga");
    if (!carga) return;
    setTimeout(() => {
        carga.classList.add("saliendo");
        setTimeout(() => carga.remove(), 600);   // lo que dura la transición (ver .carga.saliendo)
    }, Math.max(0, CARGA_MINIMA - performance.now()));
}

function entrarAlJuego({ nuevo = false } = {}) {
    $("#crear-personaje").hidden = true;
    $("#juego").hidden = false;
    refrescar();
    revisarAlAbrir();
    if (nuevo) {
        // La primera vez: la guía de bienvenida y, al terminarla, ofrecer el PIN.
        marcarNovedadesVistas();
        abrirBienvenida(ofrecerPin);
    } else {
        ofrecerPin();
        mostrarNovedades();
    }
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
function tictac() {
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
    $("#mj-premio").textContent = `+${resultado.premio.gemas} 💎 · +${resultado.premio.xp} XP de ${atributo.icono} ${atributo.nombre}`;
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
let menuTorre = "principal";    // qué comandos se ven: "principal" o "magia" (la lista de hechizos)
let ultimoComando = "atacar";   // el último comando que usaste: ahí queda la manito
let ultimoHechizo = "fuego";    // y el último hechizo, dentro de «Magia»
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
        ultimo: menuTorre === "magia" ? ultimoHechizo : ultimoComando,
        bestiario: estado.arcade.bestiario,
        resultado: resultadoTorre,
        fichas: arcade.fichasDisponibles(estado),
    });
}

// lugar: "torre" o "mazmorra".
async function abrirTorre(lugar = "torre") {
    // Si no hay partida, empezar una (gasta 1 ficha). Si hay, se sigue esa.
    lugarAbierto = lugar;
    resultadoTorre = null;
    relatoEnCurso = null;
    menuTorre = "principal";
    const resultado = ejecutar(() => acciones.empezarTorre(estado, undefined, lugar));
    if (!resultado) return;
    await prepararSprites();
    $("#torre").hidden = false;
    // La primera vez, antes de pelear, se cuenta cómo empieza la historia.
    if (resultado.relato) await mostrarRelato(resultado.relato);
    else pintarTorre();
    ponerMusica();   // en la Torre suena la música de batalla; en la Mazmorra, la de misterio
}

// El bestiario y la historia se muestran en la misma capa que la Torre (se cierran con la misma ✕).
async function abrirBestiario() {
    const imagenes = await sprites.spritesDeCriaturas(avatarActual());
    $("#torre-caja").innerHTML = vistas.pantallaBestiario({
        bestiario: estado.arcade.bestiario, sprites: imagenes, mazmorra: torre.mazmorraAbierta(estado.arcade),
    });
    $("#torre").hidden = false;
    $("#torre-caja").scrollTop = 0;
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
}

function cerrarTorre() {
    $("#torre").hidden = true;   // la partida queda guardada: se sigue después
    resultadoTorre = null;
    relatoEnCurso = null;
    dibujarPantalla();
    ponerMusica();
}

// En el Arcade, la portada de la Mazmorra es su sala más honda, en pixel art (llega un instante después).
function pintarPortadas() {
    for (const imagen of document.querySelectorAll("img[data-sala]")) {
        sprites.spriteDeSala(imagen.dataset.sala).then((direccion) => { if (direccion) imagen.src = direccion; });
    }
}

// Sonidos de un turno, al compás de las animaciones (tu acción, la de tu mascota y la de la criatura).
function sonarTurno(eventos) {
    const heroe = eventos.find((e) => e.quien === "heroe");
    const mascota = eventos.find((e) => e.quien === "mascota");
    const enemigo = eventos.find((e) => e.quien === "enemigo" && e.tipo !== "derrotado");
    const cayo = eventos.some((e) => e.tipo === "derrotado");
    const veneno = eventos.find((e) => e.quien === "veneno");
    if (heroe?.tipo === "hechizo") sonar(heroe.elemento);   // "fuego", "hielo" o "rayo"
    if (heroe?.dano) setTimeout(() => sonar(heroe.critico ? "critico" : "impacto"), 300);
    if (heroe?.cura) sonar("moneda");
    if (mascota) setTimeout(() => sonar(mascota.elemento || (mascota.dano ? "impacto" : mascota.tipo === "renacer" ? "nivel" : "moneda")), 450);
    if (cayo) setTimeout(() => sonar("victoria"), enemigo?.reflejo ? 1250 : 750);
    else if (enemigo?.dano) setTimeout(() => sonar(estado.arcade[lugarAbierto]?.fase === "fin" ? "fallo" : "impacto"), 900);
    else if (enemigo?.especial === "coraza") setTimeout(() => sonar("coraza"), 700);
    if (veneno) setTimeout(() => sonar("veneno"), 1250);
    if (eventos.some((e) => e.quien === "furia")) setTimeout(() => sonar("robo"), 450);
    if (eventos.some((e) => e.tipo === "renacer" || e.habilidad === "gracia")) setTimeout(() => sonar("nivel"), 1350);
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
    $("#robo-caja").innerHTML = vistas.pantallaRobo(robo, dibujarAvatar(avatarActual(), { batalla: true, sinEfectos: true }));
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
function sonar(nombre) {
    if (estado.ajustes.sonido) sonido.sonar(nombre);
}

// ===== Música de fondo =====
// Suena la pista elegida en Ajustes; en la Torre, la de batalla. Se llama en cada toque
// (el navegador solo deja empezar a sonar después de uno) y al cambiar algo en Ajustes.
function ponerMusica() {
    const a = estado.ajustes;
    if (!a.musica || document.visibilityState !== "visible") {
        musica.detener();
        return;
    }
    const volumen = Number.isFinite(a.volumen) ? a.volumen : 0.6;
    // En la Torre suena la de batalla; en la Mazmorra, la de misterio (el Rey de la montaña).
    const pista = $("#torre").hidden ? a.pista : lugarAbierto === "mazmorra" ? "misterio" : "batalla";
    musica.reproducir(musica.PISTAS[pista] ? pista : "epica", volumen);
}


// ===== Ejecutar una acción =====
// Todas las acciones pasan por aquí: así guardar, redibujar y celebrar
// se hace siempre igual, sin repetir código.
function ejecutar(accion, efectos = {}) {
    const antes = acciones.foto(estado);
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
    $("#cab-avatar").innerHTML = dibujarAvatar(avatarActual(), { mini: true });
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
        paginaLibro,
        problemaAvisos,
        regionMapa,
        subvista,                                           // la sección elegida en Progreso, Tienda y Héroe
        campanaVista,
        maestro: maestro.contexto(estado, fecha, ahora, info),   // lo que el Maestro sabe de tu día
        memoriasDesde,
        evento: eventoDelDia(fecha, estado),
        ...efectos,   // ej: { recienHecha: 3 } para animar la misión 3
    };
}

function dibujarPantalla(efectos = {}) {
    const contenedor = $(`#pantalla-${pantallaActual}`);
    contenedor.innerHTML = DIBUJAR[pantallaActual](estado, contextoActual(efectos));

    if (pantallaActual === "pacto") prepararLienzoFirma();   // el recuadro para firmar con el dedo
    if (pantallaActual === "mapa") pintarMapa();              // la imagen del mapa (pixel art) llega un instante después
    if (pantallaActual === "arcade") pintarPortadas();        // la portada de la Mazmorra (pixel art)
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

function cambiarPantalla(nombre) {
    // Los logros ahora viven dentro de Progreso.
    if (nombre === "logros") {
        subvista.progreso = "logros";
        nombre = "progreso";
    }
    diaVisto = "hoy";   // al cambiar de pantalla siempre se vuelve a "hoy"
    if (nombre !== "memorias") memoriasDesde = null;
    renovandoPacto = false;
    if (nombre === "libro") paginaLibro = "portada";   // el libro siempre se abre por la portada
    if (nombre === "mapa") regionMapa = null;           // el mapa se abre donde vas
    mostrarSeccion(nombre);
    dibujarPantalla();
    window.scrollTo(0, 0);
    if (nombre === "mapa") $("#mapa-heroe")?.scrollIntoView({ block: "center" });
}


// ===== Animaciones y celebraciones =====

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
    if (celebracion.avatar) {
        $("#cel-icono").innerHTML = `<div class="cel-avatar celebrando">${dibujarAvatar(avatarActual())}</div>`;
    } else if (celebracion.imagen) {
        $("#cel-icono").innerHTML = `<figure class="retrato derrotado cel-jefe"><img src="${celebracion.imagen}" alt=""></figure>`;
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
    reproducirAnimacion($(".celebracion-caja"), "entrar");
    // Con las palabras del Maestro se queda un poco más, para que alcance a leerse.
    temporizadorCelebracion = setTimeout(siguienteCelebracion, celebracion.maestro ? 4600 : 3200);
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
        <p><strong>Aurelio en todo el juego:</strong> te da una pista antes de cada guardián de la Torre y de la Mazmorra y te habla
           cuando caes; comenta cuando subes de nivel o vences a un jefe, responde a tu diario y te despide al cerrar el día.
           Sus <strong>memorias</strong> (Héroe › Historia) cuentan quién fue antes de ser tu maestro: ${memorias.MEMORIAS.length}
           capítulos que se abren en orden con tu mejor racha, tus jefes vencidos, tu nivel y tus récords de la Torre y la Mazmorra.</p>
        <p><strong>Monedas y gemas:</strong> las monedas 🪙 son para tus premios reales y solo salen de lo que haces en la vida
           real (misiones, tareas, enfoque, misiones principales, tu diario, cerrar el día y tus logros). Las gemas 💎 son la moneda
           del juego: se ganan en el arcade (minijuegos, Torre y Mazmorra) y con los premios extra (jefes, cofre del día, desafíos y
           mapa), y se gastan en el bazar del arcade y en las mascotas. Así, lo que ganas jugando no se convierte en premios reales.</p>
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
           señores de una campaña) y la Torre. La <strong>Crónica del reino</strong> cuenta la historia y se escribe sola.</p>
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
        <p><strong>Historia:</strong> la Torre y la Mazmorra cuentan una historia que sigue a la Crónica del reino. Se lee en la batalla
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
    "cerrar-semana": () => {
        ejecutar(() => acciones.cerrarResumenSemanal(estado));
        window.scrollTo(0, 0);
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
    subvista: (boton) => {
        const { pantalla, vista } = boton.dataset;
        subvista[pantalla] = vista;
        if (pantallaActual !== pantalla) {
            cambiarPantalla(pantalla);
            return;
        }
        dibujarPantalla({ mantenerScroll: true });
        // Que el selector quede a la vista (si bajaste mucho, la sección nueva empieza arriba).
        const selector = $(`#pantalla-${pantalla} .selector-secciones`);
        if (selector && selector.getBoundingClientRect().top < 0) selector.scrollIntoView({ block: "start" });
    },
    // En Aventuras: ver otra campaña de jefes.
    "ver-campana": (boton) => {
        campanaVista = boton.dataset.categoria;
        dibujarPantalla({ mantenerScroll: true });
    },

    // Torre del héroe y Mazmorra del Abismo (data-lugar dice cuál).
    "torre-abrir": (boton) => abrirTorre(boton.dataset.lugar === "mazmorra" ? "mazmorra" : "torre"),
    "bestiario-abrir": () => abrirBestiario(),
    "historia-abrir": (boton) => {
        lugarAbierto = boton.dataset.lugar === "mazmorra" ? "mazmorra" : "torre";
        abrirHistoria(lugarAbierto);
        ponerMusica();
    },
    "torre-salir": () => cerrarTorre(),
    // «Continuar» en una página de la historia: la siguiente, o volver a la batalla.
    "torre-relato": () => {
        if (!relatoEnCurso) return;
        relatoEnCurso.pagina += 1;
        if (relatoEnCurso.pagina >= relatoEnCurso.relato.paginas.length) relatoEnCurso = null;
        sonar("cursor");
        pintarTorre();
        $("#torre-caja").scrollTop = 0;
    },
    // «Magia» abre la lista de hechizos; «Volver» regresa a los comandos.
    "torre-menu": (boton) => {
        menuTorre = boton.dataset.menu === "magia" ? "magia" : "principal";
        sonar("cursor");
        pintarTorre();
    },
    "torre-accion": (boton) => {
        const { torre: comando, elemento = null } = boton.dataset;   // elemento: solo en los hechizos
        const resultado = ejecutar(() => acciones.accionTorre(estado, comando, elemento, lugarAbierto));
        if (!resultado) return;
        ultimoComando = comando;
        if (elemento) ultimoHechizo = elemento;
        menuTorre = "principal";
        pintarTorre(resultado.eventos);
        sonarTurno(resultado.eventos);
    },
    "torre-mejora": async (boton) => {
        const resultado = ejecutar(() => acciones.mejoraTorre(estado, boton.dataset.mejora, lugarAbierto));
        if (!resultado) return;
        sonar("completar");
        await prepararSprites();   // la criatura del piso nuevo (y su sala, si cambia la zona)
        // Si acabas de vencer a un guardián por primera vez, la historia sigue.
        if (resultado.relato) await mostrarRelato(resultado.relato);
        else pintarTorre();
    },
    "torre-rendirse": () => {
        const texto = lugarAbierto === "mazmorra"
            ? "¿Huir de la Mazmorra? Cobras lo que ganaste hasta ahora y el descenso termina."
            : "¿Huir de la Torre? Cobras lo que ganaste hasta ahora y la subida termina.";
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
        if (objeto && confirm(`¿Comprar «${objeto.nombre}» por ${objeto.precio} monedas?`)) {
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
    "acariciar-dragon": () => {
        const frase = mascota.fraseAlAcariciar(estado, avatarActual().mascota, hoy());
        $("#mascota-frase").textContent = frase;
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, "acariciado");
        sonar("ronroneo");
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
    diario(valores) {
        const resultado = ejecutar(() => acciones.escribirDiario(estado, valores));
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
        if (evento.target.name === "animo" && evento.target.form?.dataset.form === "diario") evento.target.form.requestSubmit();
    });

    // Interruptor de sonido (Ajustes): al encenderlo suena una muestra.
    $("#ajustes-golpe").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "golpe", evento.target.checked)));
    $("#ajustes-eventos").addEventListener("change", (evento) => ejecutar(() => acciones.cambiarAjuste(estado, "eventos", evento.target.checked)));
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
