// app-historias.js — Las cinemáticas, el bestiario, las novelas, los pergaminos, la historia y Las Voces del Valle.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as datos from "./datos.js";
import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as campana from "./campana.js";
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
import * as vocesModulo from "./voces.js";
import * as maestro from "./maestro.js";
import * as mapa from "./mapa.js";
import { hoy } from "./fechas.js";
import { estado, pantallaActual, ui, $, avatarActual, ejecutar, dibujarPantalla, cambiarPantalla,
         animarEntrada } from "./app.js";
import { lugarAbierto } from "./app-torre.js";
import { sonar, ponerMusica, avisar } from "./app-efectos.js";
import { cerrarMaestro } from "./app-maestro.js";

// ===== Cinemáticas (v43) =====
// Cuál toca lo anota torre.js en la partida (`partida.cine`); qué se ve, cinematicas.js; cómo se reproduce, cine.js.
// Se borra al tomarla, así que se ve una sola vez. Siempre se puede saltar, y se apagan en Ajustes.
export function descartarCinematica(lugar) {
    acciones.tomarCinematica(estado, lugar, false);
    datos.guardar(estado);
}

export async function reproducirCinematica(lugar = lugarAbierto) {
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
export async function revisarCines(pantalla) {
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
export let capituloNovela = null;

export let libroNovela = "casio";   // (v70) cuál de los libros largos se lee: "casio" o "orrin"

// La escena con que termina cada libro largo.
async function verEscenaDelLibro(id) {
    const nombre = estado.personaje.nombre;
    if (id === "orrin") await reproducirEscena(cinesReino.cinematicaDeOrrin(nombre), { criatura: "rey-hueco" });
    else await reproducirEscena(cinesReino.cinematicaDeCasio(nombre), { criatura: "centinela" });
}

// (v57) La escena con que termina cada pergamino: dos tomas de su historia, la moraleja de Aurelio y el presagio.
export let pergaminoActual = "piedra";   // cuál pergamino se está leyendo

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
export function abrirHistoria(lugar) {
    const enCurso = estado.arcade[lugar] ? torre.pisosSuperados(estado.arcade[lugar]) : 0;
    const alcanzado = Math.max(estado.arcade.records[lugar] || 0, enCurso);
    $("#torre-caja").innerHTML = vistas.pantallaHistoria({
        lugar, capitulos: leyendas.capitulosDeLeyenda(lugar, alcanzado, estado.personaje.nombre),
    });
    $("#torre").hidden = false;
    $("#torre-caja").scrollTop = 0;
    ponerMusica();   // (v58) la historia se lee con la música de lectura
}

// ===== Las Voces del Valle (v44) =====
// La aventura de diálogos de Carisma (ver voces.js y vistas-voces.js). La aldea es una pantalla (Aventuras → Las Voces del
// Valle); cada conversación se juega en una capa a pantalla completa (#voces), como la Torre.
let resultadoVoces = null;   // cómo terminó la conversación que acaba de acabar (para mostrar el final)

let verEpilogo = false;      // si se está leyendo el epílogo de la aldea

// Los dibujos de las personas (pixel art) llegan un instante después del HTML.
export function pintarRetratosVoces(raiz) {
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
export function pintarPortadas() {
    for (const imagen of document.querySelectorAll("img[data-sala]")) {
        sprites.spriteDeSala(imagen.dataset.sala).then((direccion) => { if (direccion) imagen.src = direccion; });
    }
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_HISTORIAS = {
    "bestiario-abrir": () => abrirBestiario(),
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
        ui.memoriasDesde = estado.maestro.leidas || 0;
        if (!$("#maestro").hidden) cerrarMaestro();
        ejecutar(() => acciones.leerMemorias(estado));
        cambiarPantalla("memorias");
    },
};
