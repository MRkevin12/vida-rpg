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
import * as minijuegos from "./minijuegos.js";
import * as sonido from "./sonido.js";
import { calcularResumen } from "./resumen.js";
import { dibujarAvatar } from "./dibujo.js";
import { hoy, fechaLegible, diasEntre, sumarDias, DIAS_LETRAS, DIAS_CORTOS } from "./fechas.js";


// ===== Estado de la app =====
let estado = datos.cargar();     // la partida completa
let pantallaActual = "hoy";      // qué pestaña se está viendo
let diaSeleccionado = null;      // día tocado en el calendario
let diaVisto = "hoy";            // en la pantalla Hoy: "hoy" o "ayer" (por si olvidaste marcar algo)
let rangoResumen = 7;            // en Progreso: el resumen muestra los últimos 7 o 30 días

// Atajo: $("#algo") es lo mismo que document.querySelector("#algo")
const $ = (selector) => document.querySelector(selector);

// Qué función dibuja cada pantalla.
const DIBUJAR = {
    hoy: vistas.pantallaHoy,
    progreso: vistas.pantallaProgreso,
    aventuras: vistas.pantallaAventuras,
    logros: vistas.pantallaLogros,
    tienda: vistas.pantallaTienda,
    personaje: vistas.pantallaPersonaje,
    arcade: vistas.pantallaArcade,
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

    if (!estado.personaje) {
        $("#crear-personaje").hidden = false;
    } else if (seguridad.hayPin()) {
        pedirPinParaEntrar(entrarAlJuego);   // primero el PIN, después el juego
    } else {
        entrarAlJuego();
    }
}

function entrarAlJuego() {
    $("#crear-personaje").hidden = true;
    $("#juego").hidden = false;
    refrescar();
    revisarAlAbrir();
    // Si nunca has creado un PIN (ni dijiste "Ahora no"), te lo ofrecemos.
    if (seguridad.debePreguntar()) {
        crearPin({ conAhoraNo: true, mensaje: "Protege tu app: elige 4 números" });
    }
}

// Al abrir (o volver a) la app: bonus de regreso y aviso de escudos usados.
function revisarAlAbrir() {
    ejecutar(() => {
        const celebraciones = [
            ...(acciones.registrarVisita(estado)?.celebraciones || []),
            ...(acciones.revisarEscudosUsados(estado)?.celebraciones || []),
        ];
        return { celebraciones };
    });
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
            intentosFallidos = 0;
            cerrarTeclado();
            $("#juego").hidden = false;
            alEntrar();
        },
    });
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
        // En "Golpe preciso" te enfrentas al retrato de uno de tus jefes actuales.
        retratos: Object.values(campana.estadoCampanas(estado))
            .map((c) => campana.imagenDe((c.jefe || c.campana.jefes[c.campana.jefes.length - 1]).id)),
        marcador: $("#mj-marcador"),
        ayuda: $("#mj-ayuda"),
        alTerminar: (puntos) => terminarMinijuego(tipo, puntos),
        sonar,
    });
}

function terminarMinijuego(tipo, puntos) {
    partida = null;
    const resultado = ejecutar(() => acciones.terminarPartida(estado, tipo, puntos));
    if (!resultado) return;

    const atributo = juego.ATRIBUTOS[arcade.JUEGOS[tipo].atributo];
    $("#mj-puntos").textContent = `${resultado.puntos} ${resultado.puntos === 1 ? "punto" : "puntos"}`;
    $("#mj-record").textContent = resultado.nuevoRecord ? "🏅 ¡Nuevo récord!" : `🏅 Récord: ${resultado.record}`;
    $("#mj-premio").textContent = `+${resultado.premio.monedas} 🪙 · +${resultado.premio.xp} XP de ${atributo.icono} ${atributo.nombre}`;
    const fichas = arcade.fichasDisponibles(estado);
    $("#mj-otra").disabled = fichas < 1;
    $("#mj-otra").textContent = fichas ? `Otra vez · 🎟️ ${fichas}` : "Sin fichas";
    $("#mj-final").hidden = false;
    if (resultado.nuevoRecord) sonar("logro");
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


// ===== Sonido =====
// Suena solo si el sonido está encendido en Ajustes.
function sonar(nombre) {
    if (estado.ajustes.sonido) sonido.sonar(nombre);
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

    // ¿A qué jefes les pegaste con esta acción? (para que su tarjeta tiemble)
    const danoAhora = campana.danoPorCategoria(estado);
    const golpeadas = Object.keys(danoAhora).filter((categoria) => danoAhora[categoria] > antes.dano[categoria]);

    const subioNivel = celebraciones.some((c) => c.tipo === "nivel");
    refrescar({ ...efectos, subioNivel, golpeadas });
    celebraciones.forEach(celebrar);
    return resultado;
}


// ===== Dibujar =====

function refrescar(efectos = {}) {
    actualizarCabecera(efectos.subioNivel);
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

    const numeroNivel = $("#cab-nivel");
    if (numeroNivel.textContent !== String(nivel.nivel)) {
        const yaTeniaNumero = numeroNivel.textContent !== "";
        numeroNivel.textContent = nivel.nivel;
        if (yaTeniaNumero) reproducirAnimacion(numeroNivel, "pulso");
    }

    moverBarra($("#cab-barra"), nivel.porcentaje, subioNivel);
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

function dibujarPantalla(efectos = {}) {
    const fecha = hoy();
    const info = juego.resumen(estado, fecha);
    const contexto = {
        hoy: fecha,
        info,
        avatar: avatar.describirAvatar(estado, fecha, info),
        diaSeleccionado,
        fechaVista: fechaVista(),
        rangoResumen,
        recordarRespaldo: necesitaRespaldo(fecha),
        ...efectos,   // ej: { recienHecha: 3 } para animar la misión 3
    };

    const contenedor = $(`#pantalla-${pantallaActual}`);
    contenedor.innerHTML = DIBUJAR[pantallaActual](estado, contexto);

    if (pantallaActual === "progreso" && !efectos.mantenerScroll) {
        // El calendario empieza mostrando las semanas más recientes (a la derecha).
        const scroll = $("#calendario-scroll");
        scroll.scrollLeft = scroll.scrollWidth;
    }
}

// Recordar la copia de seguridad: después de 7 días de juego, si nunca
// la hiciste o pasó más de un mes desde la última.
function necesitaRespaldo(fecha) {
    if (diasEntre(estado.personaje.creadoEn, fecha) < 7) return false;
    return !estado.ultimoRespaldo || diasEntre(estado.ultimoRespaldo, fecha) > 30;
}

// Muestra la sección elegida y marca su pestaña (sin dibujar el contenido).
function mostrarSeccion(nombre) {
    pantallaActual = nombre;
    for (const seccion of document.querySelectorAll(".pantalla")) {
        seccion.hidden = seccion.id !== `pantalla-${nombre}`;
    }
    for (const pestana of document.querySelectorAll(".pestana")) {
        if (pestana.dataset.pantalla === nombre) pestana.setAttribute("aria-current", "page");
        else pestana.removeAttribute("aria-current");
    }
}

// La fecha que muestra la pantalla Hoy (hoy, o ayer si lo elegiste).
function fechaVista() {
    return diaVisto === "ayer" ? sumarDias(hoy(), -1) : hoy();
}

function cambiarPantalla(nombre) {
    diaVisto = "hoy";   // al cambiar de pantalla siempre se vuelve a "hoy"
    mostrarSeccion(nombre);
    dibujarPantalla();
    window.scrollTo(0, 0);
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
    capa.hidden = false;
    reproducirAnimacion($(".celebracion-caja"), "entrar");
    temporizadorCelebracion = setTimeout(siguienteCelebracion, 3200);
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
    for (const grupo of document.querySelectorAll('[data-opciones="atributo"]')) {
        grupo.insertAdjacentHTML("beforeend", Object.entries(juego.ATRIBUTOS).map(([clave, a], i) => `
            <label class="pildora" style="--color-dificultad: ${a.color}">
                <input type="radio" name="atributo" value="${clave}" ${i === 0 ? "checked" : ""}>
                <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
            </label>`).join(""));
    }
    for (const grupo of document.querySelectorAll('[data-opciones="dias"]')) {
        grupo.insertAdjacentHTML("beforeend", DIAS_LETRAS.map((letra, dia) => `
            <label class="pildora" title="${DIAS_CORTOS[dia]}">
                <input type="checkbox" name="dias" value="${dia}" checked>
                <span>${letra}</span>
            </label>`).join(""));
    }
    $("#logro-tipo").innerHTML = Object.entries(juego.TIPOS_LOGRO)
        .map(([clave, t]) => `<option value="${clave}">${t.texto}</option>`).join("");

    // Créditos de las obras de arte de los jefes (todas de dominio público).
    $("#creditos").innerHTML = Object.entries(campana.CREDITOS).map(([id, c]) =>
        `<p><a href="${campana.fuenteDe(id)}" target="_blank" rel="noopener">${c.obra}</a> — ${c.artista}, ${c.anio}.</p>`).join("");

    const d = juego.DIFICULTADES;
    const p = juego.PREMIOS;
    $("#reglas").innerHTML = `
        <p><strong>Misiones diarias:</strong> Fácil +${d.facil.xp} XP · Normal +${d.normal.xp} XP · Difícil +${d.dificil.xp} XP. También dan monedas y suben su atributo.</p>
        <p><strong>Niveles:</strong> pasar del nivel N al N+1 cuesta ${juego.BASE_PERSONAJE}×N XP. Cada atributo sube con ${juego.BASE_ATRIBUTO}×N XP.</p>
        <p><strong>Rachas:</strong> un día cuenta si completas al menos 1 misión. Cada ${juego.ESCUDOS.diasParaGanar} días seguidos ganas un escudo (máx. ${juego.ESCUDOS.maximo}) que salva tu racha si fallas un día.</p>
        <p><strong>Bonus de regreso:</strong> si vuelves tras ${juego.REGRESO.diasMinimos} días o más, ganas ${juego.REGRESO.xpPorDia} XP por día ausente (máx. ${juego.REGRESO.xpMaximo}).</p>
        <p><strong>Misiones principales:</strong> +${p.submision.xp} XP por paso y +${p.principal.xp} XP al terminar.</p>
        <p><strong>Jefes:</strong> 5 por categoría, cada vez más fuertes. Los dañas cumpliendo objetivos de su categoría:
           misión diaria −${campana.DANO.diaria.facil}/−${campana.DANO.diaria.normal}/−${campana.DANO.diaria.dificil} (fácil/normal/difícil),
           paso de misión principal −${campana.DANO.paso}, misión principal completa −${campana.DANO.principal} extra.
           Derrotar al jefe N da ${campana.premioJefe(1).xp}×N XP y ${campana.premioJefe(1).monedas}×N monedas.</p>
        <p><strong>Días perfectos:</strong> completar todas tus misiones diarias del día.</p>
        <p><strong>Avatar:</strong> evoluciona en los niveles ${avatar.ETAPAS.slice(1).map((e) => `${e.desde} (${e.nombre})`).join(", ")}.
           Tu clase es tu atributo más alto. Cada atributo cambia algo visible en los niveles 3 y 6.
           Su ánimo depende de tu racha: tras 3 días sin misiones se duerme.</p>
        <p><strong>Mascota:</strong> eclosiona con 10 misiones diarias completadas y es adulta con 50.</p>
        <p><strong>Minijuegos:</strong> empiezas con ${arcade.FICHAS_DE_REGALO} fichas y ganas 1 por cada misión diaria completada.
           Cada partida da hasta ${arcade.MAX_MONEDAS} monedas y ${arcade.MAX_XP} XP según tus puntos.</p>`;
}

// Preparativos al abrir cada ventana. Si reciben un elemento (una misión, un logro…),
// la ventana se abre en modo EDICIÓN con sus datos; si no, en modo CREAR.
const PREPARAR = {
    mision(mision) {
        const formulario = $("#dialogo-mision form");
        modoEdicion(formulario, mision, { crear: ["Nueva misión diaria", "Crear misión"], editar: ["Editar misión", "Guardar cambios"] });
        // Días: al crear, todos marcados; al editar, los de la misión.
        for (const casilla of formulario.querySelectorAll('input[name="dias"]')) {
            casilla.checked = !mision || !mision.dias || mision.dias.includes(Number(casilla.value));
        }
        if (mision) {
            formulario.elements.nombre.value = mision.nombre;
            formulario.elements.dificultad.value = mision.dificultad;
            formulario.elements.atributo.value = mision.atributo;
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
    ajustes() {
        mostrarVersion();
        $("#ajustes-nombre").value = estado.personaje.nombre;
        $("#ajustes-sonido").checked = estado.ajustes.sonido;
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
    },
};

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

function abrirDialogo(nombre, elemento = null) {
    const dialogo = $(`#dialogo-${nombre}`);
    for (const formulario of dialogo.querySelectorAll("form")) formulario.reset();
    PREPARAR[nombre]?.(elemento);
    dialogo.showModal();
}

// En el logro, mostrar solo los campos que usa el tipo de condición elegido.
function mostrarCamposLogro() {
    const campo = juego.TIPOS_LOGRO[$("#logro-tipo").value].campo;
    ocultarCampo($("#campo-mision"), campo !== "mision");
    ocultarCampo($("#campo-atributo"), campo !== "atributo");
    ocultarCampo($("#campo-objetivo"), campo === "manual");   // un logro personal no tiene meta numérica
}


// ===== Copia de seguridad =====

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
        const veniaDelInicio = $("#juego").hidden;
        estado = nuevo;
        datos.guardar(estado);
        $("#dialogo-ajustes").close();
        avisar(`📥 Bienvenido, ${estado.personaje.nombre}`);
        if (veniaDelInicio) entrarAlJuego();
        else refrescar();
    } catch (error) {
        alert(error.message);
    }
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
    },
    "ver-fecha": (boton) => {
        diaVisto = boton.dataset.dia;
        dibujarPantalla();
    },
    "editar-mision": (boton) => {
        abrirDialogo("mision", estado.misiones.find((m) => m.id === Number(boton.dataset.id)));
    },
    // Estos tres botones están dentro de la ventana de editar misión.
    "mover-mision": (boton) => {
        ejecutar(() => acciones.moverMision(estado, idEnEdicion(boton), Number(boton.dataset.direccion)));
    },
    "archivar-mision": (boton) => {
        if (confirm("¿Archivar esta misión? Dejará de aparecer, pero su historial se guarda y la puedes restaurar.")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.archivarMision(estado, id));
        }
    },
    "restaurar-mision": (boton) => ejecutar(() => acciones.restaurarMision(estado, Number(boton.dataset.id))),
    "restaurar-principal": (boton) => ejecutar(() => acciones.restaurarPrincipal(estado, Number(boton.dataset.id))),

    "alternar-submision": (boton) => {
        const id = Number(boton.dataset.id);
        const resultado = ejecutar(() => acciones.alternarSubmision(estado, id, Number(boton.dataset.sub)));
        if (!resultado) return;
        sonar(resultado.xp > 0 ? "completar" : "desmarcar");
        flotarXp(`.tarjeta[data-id="${id}"]`, resultado.xp);
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

    comprar: (boton) => {
        const objeto = avatar.OBJETOS[boton.dataset.id];
        if (objeto && confirm(`¿Comprar «${objeto.nombre}» por ${objeto.precio} monedas?`)) {
            if (ejecutar(() => acciones.comprarObjeto(estado, boton.dataset.id))) sonar("moneda");
        }
    },
    equipar: (boton) => ejecutar(() => acciones.equiparObjeto(estado, boton.dataset.id)),
    apariencia: (boton) => ejecutar(() => acciones.cambiarApariencia(estado, boton.dataset.campo, boton.dataset.valor)),

    canjear: (boton) => {
        const recompensa = estado.recompensas.find((r) => r.id === Number(boton.dataset.id));
        if (recompensa && confirm(`¿Canjear «${recompensa.nombre}» por ${recompensa.costo} monedas?`)) {
            if (ejecutar(() => acciones.canjear(estado, recompensa.id))) sonar("moneda");
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

    exportar: () => exportar(),
    importar: () => $("#archivo-respaldo").click(),
    "borrar-todo": () => borrarTodo(),
};


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
        entrarAlJuego();
        return true;
    },
    // Si el formulario trae un id, se está editando; si no, creando.
    mision: (valores) => ejecutar(() => (valores.id ? acciones.editarMision(estado, valores) : acciones.crearMision(estado, valores))),
    principal: (valores) => ejecutar(() => acciones.crearPrincipal(estado, valores)),
    logro: (valores) => ejecutar(() => (valores.id ? acciones.editarLogro(estado, valores) : acciones.crearLogro(estado, valores))),
    recompensa: (valores) => ejecutar(() => (valores.id ? acciones.editarRecompensa(estado, valores) : acciones.crearRecompensa(estado, valores))),
    mascota(valores) {
        const resultado = ejecutar(() => acciones.nombrarMascota(estado, valores.nombre));
        if (resultado) avisar(`🐾 Tu mascota ahora se llama ${estado.mascota.nombre}`);
        return resultado;
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
        // Las casillas de los días de la semana comparten nombre: las leemos todas.
        if (formulario.querySelector('input[name="dias"]')) valores.dias = datosFormulario.getAll("dias");
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

    // Interruptor de sonido (Ajustes): al encenderlo suena una muestra.
    $("#ajustes-sonido").addEventListener("change", (evento) => {
        ejecutar(() => acciones.cambiarAjuste(estado, "sonido", evento.target.checked));
        sonar("completar");
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
            return; // si no, el teclado ya está esperando tu PIN
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
