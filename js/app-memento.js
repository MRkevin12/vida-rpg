// app-memento.js — Los botones y el formulario del calendario de Memento Mori (v142).
//
// Parte de app.js. Usa del director lo que todos necesitan: la partida (estado), ejecutar() y el aviso.
// Las reglas están en memento.js y las acciones en acciones.js (al final).

import * as acciones from "./acciones.js";
import * as memento from "./memento.js";
import { textoDeSemana, CASILLA, MARGEN } from "./vistas-memento.js";
import { estado, ejecutar } from "./app.js";
import { hoy } from "./fechas.js";
import { avisar } from "./app-efectos.js";

export const ACCIONES_MEMENTO = {
    "memento-quitar": () => {
        if (!confirm("¿Quitar tu calendario? Se borra tu fecha de nacimiento de este teléfono.")) return;
        ejecutar(() => acciones.quitarMemento(estado), { mantenerScroll: true });
    },
    // (v147) Tocaste la rejilla: qué casilla es (por dónde tocaste) y, debajo, sus fechas. Solo muestra: no cambia nada.
    "memento-semana": (svg, evento) => {
        if (!evento || !estado.memento.nacimiento) return;
        const caja = svg.getBoundingClientRect();
        const escala = caja.width / svg.viewBox.baseVal.width;   // px de la pantalla por cada punto del dibujo
        const columna = Math.floor(((evento.clientX - caja.left) / escala - MARGEN) / CASILLA);
        const fila = Math.floor((evento.clientY - caja.top) / escala / CASILLA);
        if (columna < 0 || columna >= memento.SEMANAS_POR_ANIO || fila < 0 || fila >= Number(svg.dataset.filas)) return;
        const indice = fila * memento.SEMANAS_POR_ANIO + columna;
        const c = memento.calcular(estado.memento, hoy());
        const info = document.querySelector("[data-mm-info]");
        if (info) info.textContent = textoDeSemana(estado.memento.nacimiento, indice, c, memento.semanasMarcadas(estado));
        // Un marco blanco sobre la casilla elegida.
        const elegida = svg.querySelector(".mm-elegida");
        elegida?.setAttribute("x", MARGEN + columna * CASILLA - 1);
        elegida?.setAttribute("y", fila * CASILLA - 1);
    },
};

export const FORMULARIOS_MEMENTO = {
    "memento-datos"(valores) {
        const hecho = ejecutar(() => acciones.configurarMemento(estado, valores), { mantenerScroll: true });
        if (hecho) avisar("⏳ Calendario guardado");
        return Boolean(hecho);
    },
};
