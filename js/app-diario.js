// app-diario.js — El diario, el libro y el pacto: sus funciones y sus botones.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as diario from "./diario.js";
import * as libro from "./libro.js";
import { hoy, fechaLegible } from "./fechas.js";
import { estado, ui, diarioVista, $, ejecutar, dibujarPantalla, contextoDiario, cambiarPantalla } from "./app.js";
import { sonar, avisar } from "./app-efectos.js";
import { prepararLienzoFirma } from "./app-gestos.js";

export function pintarListaDiario() {
    $("#diario-lista").innerHTML = vistas.listaDiario(estado, contextoDiario(hoy()));
}

// Descargar todo el diario como un archivo de texto (en el iPhone: «Guardar en Archivos»).
function descargarDiario() {
    return descargarTexto(`diario-${hoy()}.txt`, diario.diarioComoTexto(estado, estado.personaje.nombre), "Mi diario");
}

// Pasar a una página del libro: "portada", "indice" o el número de un capítulo.
export function irAPaginaDelLibro(pagina) {
    ui.paginaLibro = pagina;
    dibujarPantalla();
    window.scrollTo(0, 0);
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

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_DIARIO = {
    // Tocar un día del calendario: solo cambia el detalle (sin redibujar todo,
    // para no perder la posición del scroll).
    "ver-dia": (boton) => {
        ui.diaSeleccionado = boton.dataset.fecha;
        document.querySelector(".celda.elegido")?.classList.remove("elegido");
        boton.classList.add("elegido");
        const racha = juego.calcularRacha(estado, hoy());
        $("#cal-detalle").innerHTML = vistas.detalleDia(estado, ui.diaSeleccionado, racha);
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
    // (v106) Diario: otra pregunta (solo cambia lo que se ve) y abrir una carta del pasado.
    "diario-otra-pregunta": () => {
        diarioVista.salto = (diarioVista.salto || 0) + 1;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    "abrir-carta": (boton) => {
        if (ejecutar(() => acciones.abrirCarta(estado, boton.dataset.id), { mantenerScroll: true })) sonar("victoria");
    },

    // Tu libro: pasar de página y descargarlo.
    "libro-pagina": (boton) => irAPaginaDelLibro(boton.dataset.pagina),
    "descargar-libro": () => descargarTexto(`cronica-${hoy()}.txt`, libro.libroComoTexto(estado, hoy()), "Mi libro"),

    // Tu pacto.
    "pacto-borrar-firma": () => prepararLienzoFirma(),
    "pacto-renovar": () => {
        if (!confirm("¿Renovar tu juramento? Volverás a firmarlo. Tus días honrados se siguen contando desde el primero.")) return;
        ui.renovandoPacto = true;
        dibujarPantalla();
        $(".firmar-pacto")?.scrollIntoView({ block: "center" });
    },
    "pacto-cancelar": () => {
        ui.renovandoPacto = false;
        dibujarPantalla();
        window.scrollTo(0, 0);
    },

    "ver-pacto": () => {
        $("#dialogo-ajustes").close();
        cambiarPantalla("pacto");
    },
};


// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
export const FORMULARIOS_DIARIO = {
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
    pacto(valores) {
        if (!confirm("¿Sellar tu pacto? Es un juramento contigo mismo: por ti y para ti.")) return false;
        const eraRenovacion = ui.renovandoPacto;
        ui.renovandoPacto = false;
        const resultado = ejecutar(() => acciones.firmarPacto(estado, valores));
        if (!resultado) {
            ui.renovandoPacto = eraRenovacion;   // algo faltó: la firma sigue ahí para intentarlo otra vez
            return false;
        }
        window.scrollTo(0, 0);
        return true;
    },
};
