// app-finanzas.js — Los botones y formularios de Finanzas (v135; v138: medios, editar, fijos, límites, esperados, ahorro automático).
//
// Parte de app.js (se dividió por tema en la v134). Usa del director lo que todos necesitan:
// la partida (estado), subvista (la sección elegida), ejecutar() y dibujarPantalla().
// Las reglas están en finanzas.js y las acciones en acciones.js.

import * as acciones from "./acciones.js";
import * as finanzas from "./finanzas.js";
import { hoy } from "./fechas.js";
import { estado, subvista, ejecutar, dibujarPantalla } from "./app.js";
import { avisar, sonar } from "./app-efectos.js";

// (v137) Los campos de dinero (data-pesos) muestran los puntos de miles mientras escribes: 1500000 → 1.500.000.
// El cursor se queda donde estaba, contando solo los dígitos que ya escribiste.
export function conectarPesos() {
    document.addEventListener("input", (evento) => {
        const campo = evento.target;
        if (!campo.matches?.("[data-pesos]")) return;
        const digitosAntes = campo.value.slice(0, campo.selectionStart).replace(/\D/g, "").length;
        const nuevo = finanzas.agruparPesos(campo.value);
        if (nuevo === campo.value) return;
        campo.value = nuevo;
        let posicion = 0;
        let contados = 0;
        while (posicion < nuevo.length && contados < digitosAntes) {
            if (/\d/.test(nuevo[posicion])) contados += 1;
            posicion += 1;
        }
        campo.setSelectionRange(posicion, posicion);
    });
}

// Lo que pasó al anotar algo, en avisos cortos: el apartado, las metas cumplidas y los meses que quedaron en plan.
function avisarResultado(r) {
    if (!r) return;
    if (r.apartado) avisar(`🌱 Apartado automático: ${finanzas.pesos(r.apartado.monto)} para «${r.apartado.meta}»`);
    if (r.apartado?.premio || r.meta) {
        avisar(`🎯 ¡Meta cumplida: ${r.apartado?.premio || r.meta}! +${finanzas.XP_META_CUMPLIDA} XP de Riqueza`);
    }
    for (const mes of r.meses || []) {
        avisar(`✨ ${finanzas.nombreDelMes(mes)} cerró en plan: +${finanzas.XP_MES_EN_PLAN} XP de Riqueza`);
    }
    sonar("completar");
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_FINANZAS = {
    // Borrar un registro. Las fuentes, metas y deudas con movimientos no se borran.
    "finanzas-borrar": (boton) => {
        const lista = boton.dataset.lista;
        const pregunta = lista === "ingresos"
            ? "¿Borrar este ingreso? Si tiene un apartado automático, también se borra."
            : lista === "gastos" || lista === "transferencias" ? "¿Borrar este registro?"
                : "¿Borrar? (solo si no tiene movimientos)";
        if (!confirm(pregunta)) return;
        ejecutar(() => acciones.borrarRegistroFinanzas(estado, lista, boton.dataset.id), { mantenerScroll: true });
    },
    // En el Historial: el mes anterior o el siguiente (nunca uno que todavía no llega).
    "finanzas-mes": (boton) => {
        const actual = finanzas.mesDe(hoy());
        const visto = subvista.finanzasMes || actual;
        const nuevo = Number(boton.dataset.delta) < 0 ? finanzas.mesAnterior(visto) : finanzas.mesSiguiente(visto);
        subvista.finanzasMes = nuevo >= actual ? null : nuevo;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    // En Anotar: ¿un gasto o un ingreso?
    "finanzas-modo": (boton) => {
        subvista.finanzasModo = boton.dataset.modo === "ingreso" ? "ingreso" : "gasto";
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    // (v138) Abre o cierra la corrección de un movimiento del Historial.
    "finanzas-editar-abrir": (boton) => {
        subvista.finanzasEditar = `${boton.dataset.lista}:${boton.dataset.id}`;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    "finanzas-editar-cerrar": () => {
        subvista.finanzasEditar = null;
        dibujarPantalla({ mantenerScroll: true });
    },
    // (v138) Anota el pago de hoy de un gasto fijo.
    "finanzas-fijo-pagar": (boton) => {
        const resultado = ejecutar(() => acciones.pagarFijoFinanzas(estado, boton.dataset.id, { fecha: hoy() }), { mantenerScroll: true });
        if (resultado) avisarResultado(resultado);
    },
    // (v138) Un pago esperado ya llegó: queda anotado como ingreso de hoy.
    "finanzas-cobrar": (boton) => {
        const resultado = ejecutar(() => acciones.cobrarEsperadoFinanzas(estado, boton.dataset.id), { mantenerScroll: true });
        if (resultado) avisarResultado(resultado);
    },
};

// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
// Cada uno devuelve true si salió bien: así el formulario sabe si debe limpiarse.
export const FORMULARIOS_FINANZAS = {
    "finanzas-ingreso"(valores, formulario) {
        const resultado = ejecutar(() => acciones.registrarIngresoFinanzas(estado, valores), { mantenerScroll: true });
        if (resultado) {
            // Aurelio te dice al instante cómo repartir lo que entró.
            const r = finanzas.repartoDe(finanzas.dineroDeTexto(valores.monto));
            avisar(`🪙 Reparte así: ${finanzas.pesos(r.necesidad)} necesidades · ${finanzas.pesos(r.gusto)} gustos · ${finanzas.pesos(r.ahorro)} ahorro`);
            avisarResultado(resultado);
            formulario.reset();
        }
        return Boolean(resultado);
    },
    "finanzas-gasto"(valores, formulario) {
        const resultado = ejecutar(() => acciones.registrarGastoFinanzas(estado, valores), { mantenerScroll: true });
        if (resultado) {
            avisarResultado(resultado);
            formulario.reset();
        }
        return Boolean(resultado);
    },
    // (v138) Corregir un ingreso o un gasto ya anotado.
    "finanzas-editar"(valores) {
        const resultado = ejecutar(() => acciones.editarMovimientoFinanzas(estado, valores.lista, valores.id, valores), { mantenerScroll: true });
        if (resultado) {
            // Se cierra el formulario y se vuelve a dibujar; si hubo error, se queda abierto para que no pierdas lo escrito.
            subvista.finanzasEditar = null;
            dibujarPantalla({ mantenerScroll: true });
            avisarResultado(resultado);
        }
        return Boolean(resultado);
    },
    // (v138) Pasar plata de un medio a otro.
    "finanzas-transferencia"(valores, formulario) {
        const hecho = ejecutar(() => acciones.registrarTransferenciaFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    // (v138) Un gasto fijo que se repite cada mes.
    "finanzas-fijo"(valores, formulario) {
        const hecho = ejecutar(() => acciones.agregarFijoFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    // (v138) Un límite mensual para un concepto.
    "finanzas-limite"(valores, formulario) {
        const hecho = ejecutar(() => acciones.agregarLimiteFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    // (v138) Un pago que esperas (quincena, turno).
    "finanzas-esperado"(valores, formulario) {
        const hecho = ejecutar(() => acciones.agregarEsperadoFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) formulario.reset();
        return Boolean(hecho);
    },
    // (v138) El ahorro automático: a qué meta va cada ingreso y qué porcentaje.
    "finanzas-apartado"(valores) {
        const hecho = ejecutar(() => acciones.configurarApartadoFinanzas(estado, valores), { mantenerScroll: true });
        if (hecho) avisar(valores.metaId ? "🌱 Ahorro automático activado" : "Ahorro automático apagado");
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
