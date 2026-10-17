// app-gestos.js — Lo que se hace con el dedo: deslizar una misión, ordenar arrastrando, el golpe con timing, firmar el pacto y hojear el libro.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as vistas from "./vistas.js";
import * as campana from "./campana.js";
import * as pacto from "./pacto.js";
import * as libro from "./libro.js";
import { hoy } from "./fechas.js";
import { estado, ui, $, ejecutar } from "./app.js";
import { sonar } from "./app-efectos.js";
import { irAPaginaDelLibro } from "./app-diario.js";

let golpe = null;                // el golpe con timing en curso


// ===== Gestos: deslizar una misión a la derecha para completarla =====
// Se usan "pointer events" (sirven igual para el dedo y el ratón). Mientras el dedo se
// mueve en horizontal, la tarjeta lo sigue; si pasa del umbral al soltar, se toca su botón.
// Si el dedo se mueve más en vertical, es un scroll normal y no se hace nada.

const UMBRAL_GESTO = 72;      // píxeles que hay que deslizar

export let gestoReciente = false;    // para que soltar el dedo no abra también la ficha

export function conectarGestos() {
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

export function conectarArrastre() {
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


// ===== El golpe con timing =====
// Al completar una misión aparece el jefe de su categoría y una marca que va y viene.
// Si tocas cuando la marca está en la zona dorada, el golpe es crítico (+50 % de daño).

export function iniciarGolpe(id, fecha) {
    if (!estado.ajustes.golpe || !$("#celebracion").hidden || golpe) return;
    const mision = estado.misiones.find((m) => m.id === id);
    const jefe = mision && campana.estadoCampanas(estado)[mision.atributo]?.jefe;
    if (!jefe) return;
    golpe = { id, fecha, mision: mision.nombre, jefe, resultado: null };
    $("#golpe").hidden = false;
    $("#golpe-caja").innerHTML = vistas.pantallaGolpe(golpe);
    golpe.temporizador = setTimeout(cerrarGolpe, 5000);   // si no tocas, se va solo
}

export function golpear() {
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

export function prepararLienzoFirma() {
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

// Deslizar a la izquierda o a la derecha sobre la página para pasar al capítulo siguiente o al anterior.
export function conectarHojear() {
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
        const actual = Number(ui.paginaLibro) || 0;   // portada e índice cuentan como 0
        const siguiente = dx < 0 ? actual + 1 : actual - 1;
        if (siguiente >= 1 && siguiente <= total) irAPaginaDelLibro(siguiente);
        else if (siguiente === 0) irAPaginaDelLibro("portada");
    };
}
