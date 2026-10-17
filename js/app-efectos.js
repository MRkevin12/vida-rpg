// app-efectos.js — El robo de vida, el sonido, la música, las animaciones, las celebraciones, los avisos y «Deshacer».
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as vistas from "./vistas.js";
import * as campana from "./campana.js";
import { PINTURAS, ponerPinturaPixel } from "./pinturas.js";
import * as sonido from "./sonido.js";
import * as musica from "./musica.js";
import { figuraPixel, dioramaPixel, cuerpoGymPixel } from "./retratos.js";
import * as fx from "./efectos.js";
import { dibujarInsignia } from "./dibujo-insignias.js";   // (v101)   // fx = "efectos especiales", como en el cine (v94)
import { prepararPinturas } from "./pixel-pintura.js";   // (v95) las pinturas en pixel art
import { estado, pantallaActual, $, avatarActual, refrescar } from "./app.js";
import { lugarAbierto } from "./app-torre.js";

let alCerrarRobo = null;         // qué hacer cuando se cierre la escena del robo de vida

export let roboDesde = 0;               // cuándo se abrió (para no cerrarla con el mismo toque)


// ===== El robo de vida (v24) =====
// robo = lo que devuelven acciones.fallarMision y revisarVidaAlAbrir (o null: no pasó nada).
// alCerrar = qué hacer después (ej: ofrecer «Deshacer»).
export function mostrarRobo(robo, alCerrar = null) {
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

export function cerrarRobo() {
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
export function voz(criatura, momento) {
    if (estado.ajustes.sonido) sonido.sonarVoz(criatura, momento);
}

// (v125) Mientras corres (o estás en la pantalla de Running) no suena nada del juego: ni efectos ni música de fondo,
// para que escuches tu música. Solo queda la voz de los kilómetros (si la tienes encendida en Running › Progreso).
function enCarrera() {
    return Boolean(estado.running?.encurso) || pantallaActual === "running";
}

export function sonar(nombre) {
    if (enCarrera()) return;
    if (estado.ajustes.sonido) sonido.sonar(nombre);
}

// ===== Música de fondo =====
// Suena la pista elegida en Ajustes; en la Torre, la de batalla. Se llama en cada toque
// (el navegador solo deja empezar a sonar después de uno) y al cambiar algo en Ajustes.
export function ponerMusica() {
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


// ===== Animaciones y celebraciones =====

// (v99) Un fallo conocido de iOS (Safari y Chrome): al cerrar el teclado, a veces la parte visible de la página
// queda "corrida" y lo que va fijo a la pantalla (la cabecera y la barra de pestañas) aparece a media pantalla.
// Remedio: cuando el teclado se cierra (o la parte visible vuelve a medir lo mismo que la ventana), se mueve el
// scroll 1 punto y se regresa: eso obliga a iOS a recolocar todo.
export function arreglarVistaTrasTeclado() {
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
export function pinturasEnPixel() {
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
export function bolsa() {
    const p = estado.personaje;
    return p ? { monedas: p.monedas || 0, gemas: p.gemas || 0, xp: p.xp || 0 } : null;
}

// (v94) Lo que ganaste vuela desde donde tocaste hasta la cabecera, y el número sube contando.
// (Si gastaste, solo baja contando.)
export function recompensar(antes) {
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
export function flotar(selector, texto, negativo = false) {
    const elemento = $(selector);
    if (!elemento) return;
    const etiqueta = document.createElement("span");
    etiqueta.className = negativo ? "flotante negativo" : "flotante";
    etiqueta.textContent = texto;
    elemento.appendChild(etiqueta);
    etiqueta.addEventListener("animationend", () => etiqueta.remove());
}

export function flotarXp(selector, xp) {
    if (xp) flotar(selector, xp > 0 ? `+${xp} XP` : `${xp} XP`, xp < 0);
}

// Pone una clase de animación CSS y la quita al terminar, para poder repetirla.
export function reproducirAnimacion(elemento, clase) {
    elemento.classList.remove(clase);
    elemento.offsetWidth; // truco para "reiniciar" la animación
    elemento.classList.add(clase);
    elemento.addEventListener("animationend", () => elemento.classList.remove(clase), { once: true });
}

// Las celebraciones grandes se muestran una tras otra (en cola).
const cola = [];

let temporizadorCelebracion = null;

export function celebrar(celebracion) {
    if (celebracion.pequena) {
        avisar(`${celebracion.icono} ${celebracion.titulo}`);
        return;
    }
    cola.push(celebracion);
    if ($("#celebracion").hidden) siguienteCelebracion();
}

export function siguienteCelebracion() {
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

export function avisar(texto) {
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


// ===== Deshacer =====
// Después de completar algo aparece abajo «Deshacer» unos segundos, por si te equivocaste.

let temporizadorDeshacer = null;

export let alDeshacer = null;

export function ofrecerDeshacer(texto, accion) {
    alDeshacer = accion;
    $("#deshacer-texto").textContent = texto;
    const caja = $("#deshacer");
    caja.hidden = false;
    reproducirAnimacion(caja, "entrar");
    clearTimeout(temporizadorDeshacer);
    temporizadorDeshacer = setTimeout(ocultarDeshacer, 5000);
}

export function ocultarDeshacer() {
    $("#deshacer").hidden = true;
    alDeshacer = null;
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_EFECTOS = {
    "robo-cerrar": () => cerrarRobo(),
};
