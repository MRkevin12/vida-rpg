// app-finanzas.js — Los botones y formularios de Finanzas (v135; menú en la v136): anotar ingresos y gastos,
// fuentes, metas y deudas, cambiar de mes en el Historial y elegir qué anotar.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director lo que todos necesitan:
// la partida (estado), subvista (la sección elegida), ejecutar() y dibujarPantalla().
// Las reglas están en finanzas.js y las acciones en acciones.js.

import * as acciones from "./acciones.js";
import * as finanzas from "./finanzas.js";
import { hoy } from "./fechas.js";
import { estado, subvista, ejecutar, dibujarPantalla } from "./app.js";
import { avisar, sonar } from "./app-efectos.js";

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_FINANZAS = {
    // Borrar un ingreso, gasto, fuente, meta o deuda. Las fuentes, metas y deudas con movimientos no se borran.
    "finanzas-borrar": (boton) => {
        const lista = boton.dataset.lista;
        const pregunta = lista === "ingresos" || lista === "gastos" ? "¿Borrar este registro?" : "¿Borrar? (solo si no tiene movimientos)";
        if (!confirm(pregunta)) return;
        ejecutar(() => acciones.borrarRegistroFinanzas(estado, lista, boton.dataset.id), { mantenerScroll: true });
    },
    // (v136) En el Historial: el mes anterior o el siguiente (nunca uno que todavía no llega).
    "finanzas-mes": (boton) => {
        const actual = finanzas.mesDe(hoy());
        const visto = subvista.finanzasMes || actual;
        const nuevo = Number(boton.dataset.delta) < 0 ? finanzas.mesAnterior(visto) : finanzas.mesSiguiente(visto);
        subvista.finanzasMes = nuevo >= actual ? null : nuevo;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    // (v136) En Anotar: ¿un gasto o un ingreso?
    "finanzas-modo": (boton) => {
        subvista.finanzasModo = boton.dataset.modo === "ingreso" ? "ingreso" : "gasto";
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
};

// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
// Cada uno devuelve true si salió bien: así el formulario sabe si debe limpiarse.
export const FORMULARIOS_FINANZAS = {
    "finanzas-ingreso"(valores, formulario) {
        const hecho = ejecutar(() => acciones.registrarIngresoFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) {
            // (v136) Aurelio te dice al instante cómo repartir lo que entró.
            const r = finanzas.repartoDe(finanzas.dineroDeTexto(valores.monto));
            avisar(`🪙 Reparte así: ${finanzas.pesos(r.necesidad)} necesidades · ${finanzas.pesos(r.gusto)} gustos · ${finanzas.pesos(r.ahorro)} ahorro`);
            sonar("completar");
            formulario.reset();
        }
        return Boolean(hecho);
    },
    "finanzas-gasto"(valores, formulario) {
        const hecho = ejecutar(() => acciones.registrarGastoFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) {
            if (hecho.meta) {
                avisar(`🎯 ¡Meta cumplida: ${hecho.meta}! +${finanzas.XP_META_CUMPLIDA} XP de Riqueza`);
                sonar("completar");
            }
            formulario.reset();
        }
        return Boolean(hecho);
    },
    "finanzas-fuente"(valores, formulario) {
        const hecho = ejecutar(() => acciones.agregarFuenteFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    "finanzas-valor"(valores, formulario) {
        const hecho = ejecutar(() => acciones.cambiarValorFuenteFinanzas(estado, valores.id, valores.valor), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    "finanzas-meta"(valores, formulario) {
        const hecho = ejecutar(() => acciones.agregarMetaFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    "finanzas-deuda"(valores, formulario) {
        const hecho = ejecutar(() => acciones.agregarDeudaFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
};
