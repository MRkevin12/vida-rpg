// app-maestro.js — La bienvenida, el Maestro y el ritual de la noche.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as vistas from "./vistas.js";
import * as maestro from "./maestro.js";
import * as rituales from "./rituales.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "./plantillas.js";
import { hoy } from "./fechas.js";
import { estado, $, ejecutar, contextoActual, ACCIONES } from "./app.js";
import { mostrarRobo, sonar, avisar } from "./app-efectos.js";

let maestroVista = { modo: "inicio", respuesta: "" };   // la conversación con el Maestro

let ritual = null;               // el ritual de la noche en curso: { paso, cola, indice, motivo }


// ===== Bienvenida (la primera vez, o desde Ajustes) =====

let bienvenida = null;   // { paso, misiones: Set, recompensas: Set, alTerminar }

export function abrirBienvenida(alTerminar = () => {}) {
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

export function cerrarMaestro() {
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
export function conectarCartaRitual() {
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

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_MAESTRO = {
    // El Maestro.
    "maestro-abrir": (boton) => abrirMaestro(boton.dataset.modo || "inicio"),
    "maestro-cerrar": () => cerrarMaestro(),
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
};


// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
export const FORMULARIOS_MAESTRO = {
    "ritual-diario"(valores) {
        if (ejecutar(() => acciones.escribirDiario(estado, { ...valores, fecha: hoy() }))) {
            ritual.paso = "final";
            pintarRitual();
        }
        return false;
    },
};
