// app-plataformas.js — «La Senda del Reino» (v185) en la pantalla: el mapa de los mundos, el ciclo de cuadros,
// los botones táctiles (con multitoque), el teclado, la pausa y el resultado.
//
// Parte de app.js (como app-torre.js). Las reglas están en plataformas.js, el motor en plataformas-motor.js,
// el dibujo en dibujo-plataformas.js y el HTML en vistas-plataformas.js. Aquí solo se conecta todo.
//
// El ciclo: el motor avanza en pasos fijos de 1/120 s (P.PASO). Si el teléfono pinta a 60 cuadros por segundo,
// en cada cuadro se dan 2 pasos; si se traba un momento, se dan más (hasta 12), así el juego no se pone lento.

import * as P from "./plataformas.js";
import * as motor from "./plataformas-motor.js";
import * as vistasSenda from "./vistas-plataformas.js";
import { crearPintor, miniaturaDeMundo } from "./dibujo-plataformas.js";
import * as acciones from "./acciones.js";
import * as arcade from "./arcade.js";
import * as sprites from "./sprites.js";
import { calcularVida } from "./vida.js";
import { hoy } from "./fechas.js";
import { estado, $, avatarActual, ejecutar, dibujarPantalla } from "./app.js";
import { sonar, ponerMusica } from "./app-efectos.js";

let elegido = null;        // el nivel que estás mirando en el mapa
let juego = null;          // la partida en curso: { nivelId, partida, pintor, terminado }
let pausado = false;
let anterior = 0;          // el momento del cuadro anterior (para medir el tiempo)
let acumulado = 0;         // el tiempo que falta simular
let cuadroPedido = 0;
let ultimoHud = "";
let jefeSonando = false;   // para cambiar la música cuando empieza la pelea
let conectado = false;

// Qué botones están apretados: los toques (cada dedo con su pointerId) y el teclado se juntan aquí.
const entrada = { izquierda: false, derecha: false, saltar: false, fuego: false };
const toques = new Map();        // pointerId → el botón bajo ese dedo
const teclas = new Set();        // los botones que el teclado mantiene apretados

export const sendaAbierta = () => !$("#senda").hidden;

// La música que toca (ver app-efectos.js › ponerMusica): en el mapa, «Épica»; en un nivel, la de su mundo; con el jefe, «Batalla».
export function musicaDeLaSenda() {
    if (!sendaAbierta()) return null;
    if (!juego || juego.terminado) return "epica";
    const j = juego.partida.jefe;
    if (j && j.activo && !j.vencido) return "batalla";
    return P.mundoDe(juego.partida.def).musica;
}

// Para las pruebas en el navegador (y para mirar desde la consola): la partida que se está jugando.
export const partidaDeLaSenda = () => juego?.partida || null;


// ===== El mapa de los mundos =====

export function abrirSenda() {
    conectar();
    $("#senda").hidden = false;
    mostrarMapa();
    ponerMusica();
}

function cerrarSenda() {
    if (juego && !juego.terminado) {
        rendirse();
        return;
    }
    detenerJuego();
    $("#senda").hidden = true;
    dibujarPantalla();
    ponerMusica();
}

function mostrarMapa() {
    detenerJuego();
    $("#senda").classList.remove("jugando");
    $("#senda-juego").hidden = true;
    $("#senda-mapa").hidden = false;
    $("#senda-pausa").hidden = true;
    $("#senda-titulo").textContent = "🏰 La Senda del Reino";
    pintarMapaSenda();
    ponerMusica();
}

function pintarMapaSenda() {
    const caja = $("#senda-mapa");
    const scroll = caja.scrollTop;
    caja.innerHTML = vistasSenda.mapaDeLaSenda(estado, {
        elegido, fichas: arcade.fichasDisponibles(estado), caido: calcularVida(estado, hoy()).caido,
    });
    caja.scrollTop = scroll;
    pintarPortadasSenda(caja);
}

// Las portadas de los mundos (un pedazo de su fondo, en pixel art): se hacen una vez y se guardan.
const portadas = {};
export function pintarPortadasSenda(raiz = document) {
    for (const img of raiz.querySelectorAll("img[data-senda-portada]")) {
        const mundo = Number(img.dataset.sendaPortada);
        try {
            portadas[mundo] ||= miniaturaDeMundo(mundo).toDataURL("image/png");
            img.src = portadas[mundo];
        } catch { /* sin lienzo (no debería pasar): queda sin portada */ }
    }
}


// ===== Jugar un nivel =====

function cargarImagen(direccion) {
    return new Promise((listo) => {
        if (!direccion) { listo(null); return; }
        const imagen = new Image();
        imagen.onload = () => listo(imagen);
        imagen.onerror = () => listo(null);
        imagen.src = direccion;
    });
}

// Los dibujos que usa el nivel: tu héroe, las criaturas que aparecen y el jefe (los mismos de la Torre, achicados).
async function cargarImagenes(partida) {
    const ids = [...new Set(partida.enemigos.map((e) => e.def).filter((d) => d.conducta !== "mazo").map((d) => JSON.stringify([d.id, d.dibujo])))]
        .map((texto) => JSON.parse(texto));
    const jefe = partida.jefe ? partida.jefe.def : null;
    const [heroe, jefeUrl, ...enemigos] = await Promise.all([
        sprites.spriteDeHeroeEnSenda(avatarActual()),
        jefe ? sprites.spriteDeMonstruoEnMapa(jefe.id, jefe.dibujo) : null,
        ...ids.map(([id, lado]) => sprites.spriteDeMonstruoEnMapa(id, lado)),
    ]);
    const imagenes = await Promise.all([heroe, jefeUrl, ...enemigos].map(cargarImagen));
    return {
        heroe: imagenes[0],
        jefe: imagenes[1],
        enemigos: Object.fromEntries(ids.map(([id], i) => [id, imagenes[i + 2]])),
    };
}

async function jugarNivel(nivelId) {
    if (juego && !juego.terminado) return;
    if (!ejecutar(() => acciones.empezarSenda(estado, nivelId))) return;   // gasta la ficha (o dice por qué no)
    detenerJuego();
    elegido = nivelId;
    const def = P.POR_ID[nivelId];
    $("#senda").classList.add("jugando");   // (en horizontal, el lienzo pasa a pantalla completa)
    $("#senda-mapa").hidden = true;
    $("#senda-juego").hidden = false;
    $("#senda-pausa").hidden = false;
    $("#senda-titulo").textContent = `🏰 ${def.id} · ${def.nombre}`;
    const capa = $("#senda-capa");
    capa.innerHTML = '<p class="senda-cargando">Cargando…</p>';
    capa.hidden = false;
    $("#senda-hud").innerHTML = "";
    ultimoHud = "";

    const ventajas = arcade.ventajasDelEquipo(acciones.equipoDeBatalla(estado));
    const partida = motor.crearPartida(nivelId, { ventajas });
    juego = { nivelId, partida, pintor: null, terminado: false };
    const actual = juego;
    ajustarLienzo();
    const imagenes = await cargarImagenes(partida);
    if (juego !== actual) return;   // saliste mientras cargaba
    juego.pintor = crearPintor(partida, imagenes);
    capa.hidden = true;
    pausado = false;
    jefeSonando = false;
    soltarTodo();
    mostrarAviso(`Mundo ${def.mundo} · ${def.nombre}`);
    anterior = performance.now();
    acumulado = 0;
    cuadroPedido = requestAnimationFrame(cuadro);
    ponerMusica();
}

// El lienzo mide siempre 240 puntos de alto (15 celdas); el ancho sale de la forma de la pantalla.
function ajustarLienzo() {
    if (!juego) return;
    const caja = $("#senda-pantalla");
    const lienzo = $("#senda-lienzo");
    const w = caja.clientWidth;
    const h = caja.clientHeight;
    if (!w || !h) return;
    const alto = P.VISTA_FILAS * P.CELDA;
    const ancho = Math.max(176, Math.min(640, Math.round((alto * w) / h)));
    if (lienzo.width !== ancho || lienzo.height !== alto) {
        lienzo.width = ancho;
        lienzo.height = alto;
    }
    juego.partida.vista.ancho = ancho;
}

function cuadro(ahora) {
    if (!juego || juego.terminado) return;
    const partida = juego.partida;
    const dt = Math.min(0.1, Math.max(0, (ahora - anterior) / 1000));
    anterior = ahora;
    if (!pausado) {
        acumulado += dt;
        let pasos = 0;
        while (acumulado >= P.PASO && pasos < 12) {
            motor.paso(partida, entrada, P.PASO);
            acumulado -= P.PASO;
            pasos += 1;
            if (partida.terminado) break;
        }
        if (pasos >= 12) acumulado = 0;
    }
    const g = $("#senda-lienzo").getContext("2d");
    juego.pintor.dibujar(g);

    // Los sonidos de este cuadro (sin repetir: diez monedas juntas suenan como una).
    for (const nombre of new Set(motor.sacarSonidos(partida))) sonar(nombre);
    const avisos = motor.sacarAvisos(partida);
    if (avisos.length) mostrarAviso(avisos[avisos.length - 1].texto);
    const hud = vistasSenda.marcadorDeLaSenda(motor.marcador(partida));
    if (hud !== ultimoHud) {
        $("#senda-hud").innerHTML = hud;
        ultimoHud = hud;
    }
    const fuego = $('[data-senda="fuego"]');
    if (fuego.hidden === motor.tieneFuego(partida)) fuego.hidden = !motor.tieneFuego(partida);
    const peleando = Boolean(partida.jefe?.activo && !partida.jefe.vencido);
    if (peleando !== jefeSonando) { jefeSonando = peleando; ponerMusica(); }

    if (partida.terminado) {
        juego.terminado = true;
        setTimeout(() => terminarNivel(false), 350);
        return;
    }
    cuadroPedido = requestAnimationFrame(cuadro);
}

let avisoHasta = 0;
function mostrarAviso(texto) {
    const aviso = $("#senda-aviso");
    aviso.textContent = texto;
    aviso.hidden = false;
    aviso.classList.remove("entra");
    void aviso.offsetWidth;   // reinicia la animación
    aviso.classList.add("entra");
    avisoHasta = Date.now() + 1800;
    setTimeout(() => { if (Date.now() >= avisoHasta) aviso.hidden = true; }, 1850);
}

// Termina el nivel y cobra (también si saliste a la mitad: cuentan los puntos que llevabas).
function terminarNivel(salio) {
    if (!juego || juego.cobrado) return;
    const { partida, nivelId } = juego;
    juego.terminado = true;
    juego.cobrado = true;
    cancelAnimationFrame(cuadroPedido);
    soltarTodo();
    const resultado = partida.resultado || {
        gano: false, puntos: Math.floor(partida.puntos), reliquias: [...partida.reliquias], tiempo: Math.round(partida.usado),
        monedas: partida.monedas, enemigos: partida.enemigosVencidos,
    };
    const r = ejecutar(() => acciones.terminarSenda(estado, nivelId, resultado));
    $("#senda-pausa").hidden = true;
    if (!r) { mostrarMapa(); return; }
    const siguiente = P.siguienteNivel(nivelId);
    if (resultado.gano && siguiente && P.nivelAbierto(estado.arcade.plataformas, siguiente)) elegido = siguiente;
    const capa = $("#senda-capa");
    capa.innerHTML = vistasSenda.finalDeLaSenda(r, resultado, nivelId, arcade.fichasDisponibles(estado), salio);
    capa.hidden = false;
    if (r.nuevoRecord) sonar("logro");
    ponerMusica();
}

function rendirse() {
    if (!juego || juego.terminado) return;
    const antes = pausado;
    pausado = true;
    if (!confirm("¿Salir del nivel? Cuentan los puntos que llevas (las reliquias solo cuentan si llegas a la meta).")) {
        pausado = antes;
        anterior = performance.now();
        return;
    }
    terminarNivel(true);
}

function pausar() {
    if (!juego || juego.terminado || pausado) return;
    pausado = true;
    soltarTodo();
    const capa = $("#senda-capa");
    capa.innerHTML = vistasSenda.pausaDeLaSenda(juego.nivelId);
    capa.hidden = false;
}

function seguir() {
    if (!juego || juego.terminado) return;
    pausado = false;
    anterior = performance.now();
    $("#senda-capa").hidden = true;
}

function detenerJuego() {
    cancelAnimationFrame(cuadroPedido);
    juego = null;
    pausado = false;
    soltarTodo();
    $("#senda-capa").hidden = true;
    $("#senda-aviso").hidden = true;
}


// ===== Los controles =====

function soltarTodo() {
    toques.clear();
    teclas.clear();
    actualizarEntrada();
}

function actualizarEntrada() {
    const apretados = new Set([...toques.values(), ...teclas]);
    for (const nombre of Object.keys(entrada)) entrada[nombre] = apretados.has(nombre);
    for (const boton of document.querySelectorAll("[data-senda]")) boton.classList.toggle("apretado", apretados.has(boton.dataset.senda));
}

// El botón que está debajo de un dedo (o null). Así puedes deslizar el dedo de ◀ a ▶ sin levantarlo.
function botonBajo(evento) {
    const elemento = document.elementFromPoint(evento.clientX, evento.clientY);
    const boton = elemento?.closest("[data-senda]");
    return boton && !boton.hidden ? boton.dataset.senda : null;
}

const TECLAS = {
    ArrowLeft: "izquierda", a: "izquierda", A: "izquierda",
    ArrowRight: "derecha", d: "derecha", D: "derecha",
    ArrowUp: "saltar", " ": "saltar", w: "saltar", W: "saltar", z: "saltar", Z: "saltar", k: "saltar", K: "saltar",
    x: "fuego", X: "fuego", j: "fuego", J: "fuego", Shift: "fuego",
};

function conectar() {
    if (conectado) return;
    conectado = true;
    const controles = $("#senda-controles");
    // Multitoque: cada dedo tiene su pointerId; se anota qué botón aprieta cada uno.
    controles.addEventListener("pointerdown", (evento) => {
        if (!juego || juego.terminado || pausado) return;
        evento.preventDefault();
        // El dedo queda «atrapado» por su botón: así, aunque se deslice, seguimos recibiendo sus movimientos.
        const elemento = evento.target.closest?.(".senda-boton") || controles;
        try { elemento.setPointerCapture(evento.pointerId); } catch { /* algunos navegadores viejos */ }
        toques.set(evento.pointerId, botonBajo(evento));
        actualizarEntrada();
    });
    controles.addEventListener("pointermove", (evento) => {
        if (!toques.has(evento.pointerId)) return;
        evento.preventDefault();
        const boton = botonBajo(evento);
        if (boton !== toques.get(evento.pointerId)) {
            toques.set(evento.pointerId, boton);
            actualizarEntrada();
        }
    });
    const soltar = (evento) => {
        if (!toques.delete(evento.pointerId)) return;
        actualizarEntrada();
    };
    for (const tipo of ["pointerup", "pointercancel", "lostpointercapture"]) controles.addEventListener(tipo, soltar);
    controles.addEventListener("contextmenu", (evento) => evento.preventDefault());   // mantener apretado no abre el menú

    // El teclado (en la compu).
    document.addEventListener("keydown", (evento) => {
        if (!juego || juego.terminado || !sendaAbierta()) return;
        if (evento.key === "Escape" || evento.key === "p" || evento.key === "P") {
            evento.preventDefault();
            if (pausado) seguir(); else pausar();
            return;
        }
        const nombre = TECLAS[evento.key];
        if (!nombre || pausado) return;
        evento.preventDefault();
        teclas.add(nombre);
        actualizarEntrada();
    });
    document.addEventListener("keyup", (evento) => {
        const nombre = TECLAS[evento.key];
        if (!nombre) return;
        teclas.delete(nombre);
        actualizarEntrada();
    });
    // Si sales de la app (o bloqueas el teléfono), el juego se pausa.
    document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });
    window.addEventListener("blur", () => { teclas.clear(); actualizarEntrada(); });
    window.addEventListener("resize", ajustarLienzo);
    window.addEventListener("orientationchange", () => setTimeout(ajustarLienzo, 250));

    $("#senda-salir").addEventListener("click", cerrarSenda);
    $("#senda-pausa").addEventListener("click", () => (pausado ? seguir() : pausar()));
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_SENDA = {
    "senda-abrir": () => abrirSenda(),
    "senda-elegir": (boton) => {
        elegido = boton.dataset.nivel;
        sonar("cursor");
        pintarMapaSenda();
    },
    "senda-jugar": (boton) => jugarNivel(boton.dataset.nivel),
    "senda-mapa": () => mostrarMapa(),
    "senda-seguir": () => seguir(),
    "senda-rendirse": () => rendirse(),
};
