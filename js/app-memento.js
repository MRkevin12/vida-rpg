// app-memento.js — Los botones y el formulario del calendario de Memento Mori (v142).
//
// Parte de app.js. Usa del director lo que todos necesitan: la partida (estado), ejecutar() y el aviso.
// Las reglas están en memento.js y las acciones en acciones.js (al final).

import * as acciones from "./acciones.js";
import { estado, ejecutar } from "./app.js";
import { avisar } from "./app-efectos.js";

export const ACCIONES_MEMENTO = {
    "memento-quitar": () => {
        if (!confirm("¿Quitar tu calendario? Se borra tu fecha de nacimiento de este teléfono.")) return;
        ejecutar(() => acciones.quitarMemento(estado), { mantenerScroll: true });
    },
};

export const FORMULARIOS_MEMENTO = {
    "memento-datos"(valores) {
        const hecho = ejecutar(() => acciones.configurarMemento(estado, valores), { mantenerScroll: true });
        if (hecho) avisar("⏳ Calendario guardado");
        return Boolean(hecho);
    },
};
