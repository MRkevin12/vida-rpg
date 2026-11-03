// acciones-finanzas.js — Lo que cambia la partida en Finanzas (v135): ingresos, gastos, metas y cuentas.
//
// Parte de acciones.js (se dividió por área en la v178). Como allá: cada función recibe el «estado» (la partida),
// lo cambia y lanza Error("mensaje en español") si algo no se puede. acciones.js lo reexporta todo, así que en la app
// se sigue llamando acciones.lo-que-sea.

import * as finanzas from "./finanzas.js";   // (v135) las cuentas de tu plata
import { hoy, sumarDias, esFechaValida } from "./fechas.js";
import { nuevoId, ganar } from "./acciones-comun.js";

// ===== Finanzas (v135; v138): tu plata en pesos colombianos. Las reglas y los consejos están en finanzas.js =====

// Busca un elemento de una lista por su id (los ids pueden llegar como texto desde un formulario o un botón).
function buscarFinanza(lista, id, mensaje) {
    const elemento = lista.find((x) => String(x.id) === String(id));
    if (!elemento) throw new Error(mensaje);
    return elemento;
}

// Una fecha de un formulario: hoy o un día pasado (hasta 2 años atrás). No se puede anotar un día que todavía no llega.
function fechaDeFinanzas(texto) {
    const fecha = texto ? String(texto) : hoy();
    if (!esFechaValida(fecha)) throw new Error("Esa fecha no es válida.");
    if (fecha > hoy()) throw new Error("No puedes anotar un día que todavía no llega.");
    if (fecha < sumarDias(hoy(), -730)) throw new Error("Esa fecha es muy antigua para anotarla aquí.");
    return fecha;
}

// Un medio de pago (efectivo, Nequi…). Vacío = sin medio (no es obligatorio).
function medioValido(medio) {
    if (!medio) return null;
    if (!finanzas.MEDIOS[medio]) throw new Error("Ese medio de pago no existe.");
    return medio;
}

// Un texto corto y obligatorio (nombres, conceptos).
function textoFinanzas(texto, maximo, que) {
    const limpio = String(texto || "").trim();
    if (!limpio) throw new Error(`Escribe ${que}.`);
    if (limpio.length > maximo) throw new Error(`Eso es muy largo (máximo ${maximo} letras).`);
    return limpio;
}

// Da XP de Riqueza por anotar, con tope de registros al día (ver finanzas.js).
function darXpPorRegistro(estado) {
    const xp = estado.finanzas.xpHoy;
    if (xp.fecha !== hoy()) { xp.fecha = hoy(); xp.n = 0; }
    if (xp.n >= finanzas.REGISTROS_CON_XP_AL_DIA) return 0;
    xp.n += 1;
    ganar(estado, { xp: finanzas.XP_POR_REGISTRO, atributo: "riqueza" });
    return finanzas.XP_POR_REGISTRO;
}

// (v138) Al revisar un movimiento, los meses ya cerrados que quedaron en plan dan su premio (una sola vez).
// Devuelve los meses que se premiaron, para avisarlo.
function cierreDeMes(estado) {
    const meses = finanzas.mesesPorPremiar(estado, hoy());
    for (const mes of meses) {
        estado.finanzas.premiosMes[mes] = true;
        ganar(estado, { xp: finanzas.XP_MES_EN_PLAN, atributo: "riqueza" });
    }
    return meses;
}

// Una fuente: el trabajo (de donde entra dinero) o una inversión/CDT (con el valor que tienes ahí).
export function agregarFuenteFinanzas(estado, { nombre, tipo, valor = "", vence = "" }) {
    const texto = textoFinanzas(nombre, 40, "el nombre de la fuente");
    if (!finanzas.TIPOS_FUENTE[tipo]) throw new Error("Elige qué tipo de fuente es.");
    const tocable = finanzas.TIPOS_FUENTE[tipo].tocable;
    let monto = 0;
    if (!tocable) {
        monto = finanzas.dineroDeTexto(valor);
        if (monto === null) throw new Error("Escribe cuánto tienes ahí (en pesos).");
    }
    // El vencimiento de un CDT puede ser una fecha futura: solo se revisa que sea una fecha de verdad.
    if (vence && !esFechaValida(String(vence))) throw new Error("La fecha de vencimiento no es válida.");
    const fechaVence = vence ? String(vence) : null;
    estado.finanzas.fuentes.push({ id: nuevoId(estado), nombre: texto, tipo, valor: monto, vence: fechaVence });
}

// Cambia lo que tienes en una inversión o CDT (el trabajo no guarda valor: lo que entra se anota como ingreso).
export function cambiarValorFuenteFinanzas(estado, id, valor) {
    const fuente = buscarFinanza(estado.finanzas.fuentes, id, "Esa fuente ya no existe.");
    if (finanzas.TIPOS_FUENTE[fuente.tipo].tocable) throw new Error("El trabajo no guarda un valor: lo que entra se anota como ingreso.");
    const monto = finanzas.dineroDeTexto(valor);
    if (monto === null) throw new Error("Escribe cuánto tienes ahí (en pesos).");
    fuente.valor = monto;
}

// (v138) Si configuraste el ahorro automático, al entrar un ingreso se aparta ese porcentaje en la meta.
// Es un gasto «Ahorro y deudas» con origen = el ingreso (por eso se borra junto con él).
function apartarIngresoFinanzas(estado, ingreso) {
    const monto = finanzas.apartadoDe(estado, ingreso.monto);
    const meta = monto > 0 ? estado.finanzas.metas.find((m) => String(m.id) === String(estado.finanzas.apartado.metaId)) : null;
    if (!meta) return null;
    estado.finanzas.gastos.push({
        id: nuevoId(estado), fecha: ingreso.fecha, monto, concepto: "Apartado automático", categoria: "ahorro",
        destino: `meta:${meta.id}`, medio: ingreso.medio, fijo: null, origen: ingreso.id,
    });
    return { monto, meta: meta.nombre, premio: premiarMetaFinanzas(estado, meta) };
}

// Un ingreso: dinero que entró de una fuente que sí tocas.
export function registrarIngresoFinanzas(estado, { monto, fecha = "", fuente = "", nota = "", medio = "" }) {
    const cantidad = finanzas.dineroDeTexto(monto);
    if (cantidad === null) throw new Error("Escribe cuánto entró (en pesos).");
    const origen = buscarFinanza(estado.finanzas.fuentes, fuente, "Elige de dónde entró el dinero.");
    if (!finanzas.TIPOS_FUENTE[origen.tipo].tocable) throw new Error("Esa fuente no se toca: su plata no entra al plan.");
    const ingreso = {
        id: nuevoId(estado), fecha: fechaDeFinanzas(fecha), monto: cantidad, fuente: origen.id,
        nota: String(nota || "").trim().slice(0, 60), medio: medioValido(medio),
    };
    estado.finanzas.ingresos.push(ingreso);
    const apartado = apartarIngresoFinanzas(estado, ingreso);
    return { xp: darXpPorRegistro(estado), apartado, meses: cierreDeMes(estado) };
}

// Un gasto. Si va a una meta o a una deuda, cuenta en «Ahorro y deudas» (el 20 %).
export function registrarGastoFinanzas(estado, { monto, fecha = "", concepto, categoria = "necesidad", destino = "", medio = "" }) {
    const cantidad = finanzas.dineroDeTexto(monto);
    if (cantidad === null) throw new Error("Escribe cuánto gastaste (en pesos).");
    const texto = String(concepto || "").trim();
    if (!texto) throw new Error("Escribe en qué lo gastaste.");
    if (!finanzas.SOBRES[categoria]) throw new Error("Elige a qué sobre va el gasto.");

    let meta = null;
    let deuda = null;
    const [tipo, id] = String(destino || "").split(":");
    if (tipo === "meta") meta = buscarFinanza(estado.finanzas.metas, id, "Esa meta ya no existe.");
    else if (tipo === "deuda") {
        deuda = buscarFinanza(estado.finanzas.deudas, id, "Esa deuda ya no existe.");
        if (finanzas.saldoDeDeuda(estado, deuda) <= 0) throw new Error("Esa deuda ya está pagada.");
    } else if (destino) throw new Error("Ese destino no existe.");

    estado.finanzas.gastos.push({
        id: nuevoId(estado), fecha: fechaDeFinanzas(fecha), monto: cantidad, concepto: texto.slice(0, 60),
        categoria: meta || deuda ? "ahorro" : categoria,
        destino: meta ? `meta:${meta.id}` : deuda ? `deuda:${deuda.id}` : null,
        medio: medioValido(medio), fijo: null,
    });
    const premio = meta ? premiarMetaFinanzas(estado, meta) : null;
    return { xp: darXpPorRegistro(estado), meta: premio, meses: cierreDeMes(estado) };
}

// (v138) Cambia un ingreso o un gasto ya anotado (monto, fecha, concepto, sobre, meta/deuda, fuente, medio).
export function editarMovimientoFinanzas(estado, lista, id, valores) {
    const f = estado.finanzas;
    if (lista === "ingresos") {
        const ingreso = buscarFinanza(f.ingresos, id, "Ese ingreso ya no existe.");
        const cantidad = finanzas.dineroDeTexto(valores.monto);
        if (cantidad === null) throw new Error("Escribe cuánto entró (en pesos).");
        const origen = buscarFinanza(f.fuentes, valores.fuente, "Elige de dónde entró el dinero.");
        if (!finanzas.TIPOS_FUENTE[origen.tipo].tocable) throw new Error("Esa fuente no se toca: su plata no entra al plan.");
        Object.assign(ingreso, {
            monto: cantidad, fecha: fechaDeFinanzas(valores.fecha), fuente: origen.id,
            nota: String(valores.nota || "").trim().slice(0, 60), medio: medioValido(valores.medio),
        });
    } else if (lista === "gastos") {
        const gasto = buscarFinanza(f.gastos, id, "Ese gasto ya no existe.");
        const cantidad = finanzas.dineroDeTexto(valores.monto);
        if (cantidad === null) throw new Error("Escribe cuánto gastaste (en pesos).");
        const concepto = textoFinanzas(valores.concepto, 60, "en qué lo gastaste");
        let destino = null;
        const [tipo, destinoId] = String(valores.destino || "").split(":");
        if (tipo === "meta") destino = `meta:${buscarFinanza(f.metas, destinoId, "Esa meta ya no existe.").id}`;
        else if (tipo === "deuda") destino = `deuda:${buscarFinanza(f.deudas, destinoId, "Esa deuda ya no existe.").id}`;
        else if (valores.destino) throw new Error("Ese destino no existe.");
        if (!destino && !finanzas.SOBRES[valores.categoria]) throw new Error("Elige a qué sobre va el gasto.");
        Object.assign(gasto, {
            monto: cantidad, fecha: fechaDeFinanzas(valores.fecha), concepto: concepto.slice(0, 60),
            destino, categoria: destino ? "ahorro" : valores.categoria, medio: medioValido(valores.medio),
        });
    } else {
        throw new Error("No sé qué quieres editar.");
    }
    return { meses: cierreDeMes(estado) };
}

// Cuando una meta llega a su monto, se premia una sola vez.
function premiarMetaFinanzas(estado, meta) {
    if (meta.premiada || finanzas.ahorradoEnMeta(estado, meta) < meta.objetivo) return null;
    meta.premiada = true;
    ganar(estado, { xp: finanzas.XP_META_CUMPLIDA, atributo: "riqueza" });
    return meta.nombre;
}

// Una meta de ahorro: cuánto quieres juntar (el avance sale de los gastos que vayas a ella).
export function agregarMetaFinanzas(estado, { nombre, objetivo }) {
    const texto = textoFinanzas(nombre, 40, "el nombre de la meta");
    const monto = finanzas.dineroDeTexto(objetivo);
    if (monto === null) throw new Error("Escribe cuánto quieres juntar (en pesos).");
    estado.finanzas.metas.push({ id: nuevoId(estado), nombre: texto, objetivo: monto, premiada: false });
}

// Una deuda: cuánto debes al empezar (lo que pagues después se resta solo).
export function agregarDeudaFinanzas(estado, { nombre, saldo, cuota = "" }) {
    const texto = textoFinanzas(nombre, 40, "el nombre de la deuda");
    const monto = finanzas.dineroDeTexto(saldo);
    if (monto === null) throw new Error("Escribe cuánto debes (en pesos).");
    const cuotaMensual = cuota ? finanzas.dineroDeTexto(cuota) : null;
    if (cuota && cuotaMensual === null) throw new Error("La cuota no es válida (en pesos).");
    estado.finanzas.deudas.push({ id: nuevoId(estado), nombre: texto, saldoInicial: monto, cuota: cuotaMensual });
}

// (v138) Pasar plata de un medio a otro (Bancolombia → Nequi). No cuenta como gasto ni como ingreso.
export function registrarTransferenciaFinanzas(estado, { monto, fecha = "", desde, hacia }) {
    const cantidad = finanzas.dineroDeTexto(monto);
    if (cantidad === null) throw new Error("Escribe cuánto pasaste (en pesos).");
    const origen = medioValido(desde);
    const destino = medioValido(hacia);
    if (!origen || !destino) throw new Error("Elige de dónde a dónde pasaste la plata.");
    if (origen === destino) throw new Error("Elige dos medios distintos.");
    estado.finanzas.transferencias.push({ id: nuevoId(estado), fecha: fechaDeFinanzas(fecha), monto: cantidad, desde: origen, hacia: destino });
}

// (v138) Un gasto fijo (arriendo, servicios, celular…): se define una vez y cada mes se anota con un toque.
export function agregarFijoFinanzas(estado, { nombre, monto, categoria = "necesidad", dia = "", medio = "" }) {
    const texto = textoFinanzas(nombre, 40, "el nombre del gasto fijo");
    const cantidad = finanzas.dineroDeTexto(monto);
    if (cantidad === null) throw new Error("Escribe cuánto cuesta cada mes (en pesos).");
    if (!finanzas.SOBRES[categoria]) throw new Error("Elige a qué sobre va.");
    let diaDelMes = null;
    if (dia) {
        diaDelMes = Number(dia);
        if (!Number.isInteger(diaDelMes) || diaDelMes < 1 || diaDelMes > 31) throw new Error("El día debe estar entre 1 y 31.");
    }
    estado.finanzas.fijos.push({ id: nuevoId(estado), nombre: texto, monto: cantidad, categoria, dia: diaDelMes, medio: medioValido(medio) });
}

// (v138) Anota el gasto fijo de este mes (solo una vez por mes). Puedes cambiar el monto si cambió.
export function pagarFijoFinanzas(estado, id, { fecha = "", monto = "", medio = "" }) {
    const fijo = buscarFinanza(estado.finanzas.fijos, id, "Ese gasto fijo ya no existe.");
    const dia = fechaDeFinanzas(fecha);
    const mes = dia.slice(0, 7);
    if (estado.finanzas.gastos.some((g) => String(g.fijo) === String(fijo.id) && g.fecha.slice(0, 7) === mes)) {
        throw new Error(`«${fijo.nombre}» ya lo anotaste este mes.`);
    }
    const cantidad = monto ? finanzas.dineroDeTexto(monto) : fijo.monto;
    if (cantidad === null) throw new Error("Escribe cuánto pagaste (en pesos).");
    estado.finanzas.gastos.push({
        id: nuevoId(estado), fecha: dia, monto: cantidad, concepto: fijo.nombre, categoria: fijo.categoria,
        destino: null, medio: medioValido(medio) ?? fijo.medio ?? null, fijo: fijo.id,
    });
    return { xp: darXpPorRegistro(estado), meses: cierreDeMes(estado) };
}

// (v138) Un límite mensual para un concepto («Comida: $400.000»). Se compara con los gastos que tengan ese mismo concepto.
export function agregarLimiteFinanzas(estado, { concepto, tope }) {
    const texto = textoFinanzas(concepto, 40, "el concepto (por ejemplo, Comida)");
    const clave = finanzas.normalizarConcepto(texto);
    const cantidad = finanzas.dineroDeTexto(tope);
    if (cantidad === null) throw new Error("Escribe el tope mensual (en pesos).");
    if (estado.finanzas.limites.some((limite) => limite.clave === clave)) throw new Error(`Ya tienes un límite para «${texto}».`);
    estado.finanzas.limites.push({ id: nuevoId(estado), concepto: texto, clave, tope: cantidad });
}

// (v138) Un pago que esperas (la quincena, un turno): así ves cuánto va a entrar antes de que llegue.
export function agregarEsperadoFinanzas(estado, { fecha = "", monto, fuente, nota = "", medio = "" }) {
    const origen = buscarFinanza(estado.finanzas.fuentes, fuente, "Elige de dónde va a llegar.");
    if (!finanzas.TIPOS_FUENTE[origen.tipo].tocable) throw new Error("Esa fuente no se toca: no la puedes esperar en el plan.");
    const cantidad = finanzas.dineroDeTexto(monto);
    if (cantidad === null) throw new Error("Escribe cuánto va a llegar (en pesos).");
    if (!esFechaValida(String(fecha || ""))) throw new Error("Escribe cuándo debe llegar.");
    estado.finanzas.esperados.push({
        id: nuevoId(estado), fecha: String(fecha), monto: cantidad, fuente: origen.id,
        nota: String(nota || "").trim().slice(0, 60), medio: medioValido(medio), cobradoEn: null,
    });
}

// (v138) Ya llegó: se anota como ingreso de hoy (con su apartado automático si lo tienes) y deja de estar pendiente.
export function cobrarEsperadoFinanzas(estado, id, { medio = "" } = {}) {
    const esperado = buscarFinanza(estado.finanzas.esperados, id, "Ese pago ya no está en la lista.");
    if (esperado.cobradoEn) throw new Error("Ese pago ya lo marcaste como cobrado.");
    const resultado = registrarIngresoFinanzas(estado, {
        monto: String(esperado.monto), fecha: hoy(), fuente: esperado.fuente,
        nota: esperado.nota, medio: medio || esperado.medio || "",
    });
    esperado.cobradoEn = hoy();
    return resultado;
}

// (v138) El ahorro automático: qué meta recibe el porcentaje de cada ingreso (vacío = apagado).
export function configurarApartadoFinanzas(estado, { metaId = "", porcentaje = "20" }) {
    const p = Math.round(Number(String(porcentaje || "20").replace(",", ".")));
    if (!Number.isFinite(p) || p < 1 || p > 50) throw new Error("El porcentaje debe estar entre 1 y 50.");
    const id = String(metaId ?? "").trim();
    const meta = id ? buscarFinanza(estado.finanzas.metas, id, "Esa meta ya no existe.") : null;
    estado.finanzas.apartado = { metaId: meta ? meta.id : null, porcentaje: p };
}

// Borra un registro. Una fuente, meta o deuda con movimientos no se borra: así no pierdes tu historia.
// Al borrar un ingreso se borra también el apartado automático que hizo.
export function borrarRegistroFinanzas(estado, lista, id) {
    const f = estado.finanzas;
    const listas = ["fuentes", "ingresos", "gastos", "metas", "deudas", "transferencias", "fijos", "limites", "esperados"];
    if (!listas.includes(lista)) throw new Error("No sé qué quieres borrar.");
    const tieneMovimientos = {
        fuentes: () => f.ingresos.some((i) => String(i.fuente) === String(id)) || f.esperados.some((e) => !e.cobradoEn && String(e.fuente) === String(id)),
        metas: () => f.gastos.some((g) => g.destino === `meta:${id}`),
        deudas: () => f.gastos.some((g) => g.destino === `deuda:${id}`),
    };
    if (tieneMovimientos[lista]?.()) {
        throw new Error(lista === "fuentes" ? "Esa fuente tiene ingresos o pagos anotados: no se puede borrar."
            : lista === "metas" ? "Esa meta ya tiene abonos anotados: no se puede borrar."
                : "Ya tiene pagos anotados: no se puede borrar.");
    }
    const antes = f[lista].length;
    f[lista] = f[lista].filter((x) => String(x.id) !== String(id));
    if (f[lista].length === antes) throw new Error("Ese registro ya no existe.");
    if (lista === "ingresos") f.gastos = f.gastos.filter((g) => String(g.origen) !== String(id));
    if (lista === "metas" && String(f.apartado.metaId) === String(id)) f.apartado = { ...f.apartado, metaId: null };
}
