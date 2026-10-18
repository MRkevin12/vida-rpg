// finanzas.js — Las cuentas de tu plata, en pesos colombianos (v135; v136 menú y Aurelio; v137 puntos de miles;
// v138 medios de pago, transferencias, editar, fijos, límites, ahorro automático, ingresos esperados y meses en plan).
//
// Solo reglas y cálculos: no toca la pantalla ni guarda nada (eso es acciones.js y vistas-finanzas.js).
//
// El plan es el 50/30/20: el dinero que ENTRA en el mes se reparte en tres sobres:
// necesidades (50 %), gustos (30 %) y ahorro y deudas (20 %).
// Solo cuentan los ingresos de las fuentes que SÍ puedes tocar (trabajo). La inversión y el CDT
// se anotan aparte, con su valor actual, y no entran al plan.

import { hoy, MESES, diasEntre, sumarDias, esFechaValida } from "./fechas.js";

// Los tres sobres del 50/30/20.
export const SOBRES = {
    necesidad: { nombre: "Necesidades", porcentaje: 50, icono: "🛒", texto: "arriendo, mercado, servicios, transporte" },
    gusto: { nombre: "Gustos", porcentaje: 30, icono: "🎁", texto: "salidas, compras, suscripciones" },
    ahorro: { nombre: "Ahorro y deudas", porcentaje: 20, icono: "🌱", texto: "metas de ahorro y pagos a deudas" },
};

// Qué tipo de fuente es. Solo el trabajo se toca: lo demás se anota con su valor y no entra al plan.
export const TIPOS_FUENTE = {
    trabajo: { nombre: "Trabajo (el ingreso que sí usas)", icono: "🪙", tocable: true },
    inversion: { nombre: "Inversión (no se toca)", icono: "📈", tocable: false },
    cdt: { nombre: "CDT (no se toca)", icono: "🔒", tocable: false },
};

// (v138) Por dónde se mueve la plata. «sin medio» son los movimientos anotados antes de existir este campo.
export const MEDIOS = {
    efectivo: { nombre: "Efectivo", icono: "🪙" },
    nequi: { nombre: "Nequi", icono: "📱" },
    daviplata: { nombre: "Daviplata", icono: "📱" },
    banco: { nombre: "Banco", icono: "🗂" },
    otro: { nombre: "Otro", icono: "💡" },
};

// Tus finanzas suman al atributo Riqueza (💰). Cada registro da un poco de XP, con tope al día,
// para que no se gane XP por anotar lo mismo varias veces.
export const XP_POR_REGISTRO = 5;
export const REGISTROS_CON_XP_AL_DIA = 3;
export const XP_META_CUMPLIDA = 150;
export const XP_MES_EN_PLAN = 100;   // (v138) al cerrar un mes dentro del plan (una sola vez por mes)

export const MONTO_MAXIMO = 1e12;   // un billón de pesos: más que cualquier cuenta personal
export const GASTO_HORMIGA = 20000; // un gasto de este monto o menos (que no sea ahorro) es «hormiga»

// Palabras que se sugieren al escribir en qué gastaste (además de las que ya usaste).
export const CONCEPTOS_COMUNES = ["Mercado", "Arriendo", "Servicios", "Transporte", "Comida", "Salida", "Celular", "Gym", "Ropa", "Salud"];

// Formato de pesos: $1.500.000 (sin centavos, como se usa en Colombia).
const formatoPesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
export function pesos(cantidad) {
    const valor = Math.round(cantidad);
    return `${valor < 0 ? "-" : ""}$${formatoPesos.format(Math.abs(valor))}`;
}

// Mientras escribes, los puntos de miles se ponen solos: "1500000" → "1.500.000". Solo deja los dígitos (sin ceros al frente).
export function agruparPesos(texto) {
    const digitos = String(texto ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Lo que escribes en un formulario ("1.500.000", "$ 80000") → número de pesos. Si no es un monto válido, devuelve null.
export function dineroDeTexto(texto) {
    const digitos = String(texto ?? "").replace(/\D/g, "");
    if (!digitos) return null;
    const cantidad = Number(digitos);
    return cantidad >= 1 && cantidad <= MONTO_MAXIMO ? cantidad : null;
}

// Un concepto para comparar: sin mayúsculas, sin espacios de más («Mercado » = «mercado»).
export function normalizarConcepto(texto) {
    return String(texto ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

// ===== Meses =====

// "2026-10" → "octubre 2026"
export function nombreDelMes(mes) {
    const [anio, numero] = mes.split("-");
    return `${MESES[Number(numero) - 1]} ${anio}`;
}

// "2026-10-18" → "2026-10"
export const mesDe = (fecha) => fecha.slice(0, 7);

// Cuántos días tiene un mes ("2026-02" → 28). El día 0 del mes siguiente es el último de este.
export function diasDelMes(mes) {
    const [anio, numero] = mes.split("-").map(Number);
    return new Date(anio, numero, 0).getDate();
}

// El mes de antes y el de después: "2026-01" ↔ "2025-12".
export function mesAnterior(mes) {
    const [anio, numero] = mes.split("-").map(Number);
    return numero === 1 ? `${anio - 1}-12` : `${anio}-${String(numero - 1).padStart(2, "0")}`;
}
export function mesSiguiente(mes) {
    const [anio, numero] = mes.split("-").map(Number);
    return numero === 12 ? `${anio + 1}-01` : `${anio}-${String(numero + 1).padStart(2, "0")}`;
}

// Los movimientos de un mes (los que tienen una fecha de ese mes).
export function delMes(lista, mes) {
    return lista.filter((movimiento) => mesDe(movimiento.fecha) === mes);
}

const sumar = (lista) => lista.reduce((total, elemento) => total + elemento.monto, 0);

// ===== Fuentes =====

// Solo las fuentes que tocas (trabajo).
export function fuentesTocables(estado) {
    return estado.finanzas.fuentes.filter((fuente) => TIPOS_FUENTE[fuente.tipo]?.tocable);
}

// Lo que tienes en inversiones y CDT (no se toca: no entra al plan).
export function patrimonioIntocable(estado) {
    return estado.finanzas.fuentes
        .filter((fuente) => !TIPOS_FUENTE[fuente.tipo]?.tocable)
        .reduce((total, fuente) => total + (fuente.valor || 0), 0);
}

// Los ingresos que cuentan: de fuentes que tocas.
function ingresosQueCuentan(estado, lista = estado.finanzas.ingresos) {
    const tocables = new Set(fuentesTocables(estado).map((fuente) => fuente.id));
    return lista.filter((ingreso) => tocables.has(ingreso.fuente));
}

// (v136) Con ingresos por día: cuántos días te pagaron en el mes y cuánto en promedio por cada uno.
export function ingresosPorDia(estado, mes) {
    const lista = ingresosQueCuentan(estado, delMes(estado.finanzas.ingresos, mes));
    const dias = new Set(lista.map((ingreso) => ingreso.fecha)).size;
    const total = sumar(lista);
    return { dias, total, promedio: dias ? Math.round(total / dias) : 0 };
}

// ===== El mes y el plan 50/30/20 =====

// Cuánto entró en el mes (solo de fuentes que tocas), cuánto gastaste y cuánto te queda, por sobre.
export function resumenDelMes(estado, mes) {
    const ingresos = sumar(ingresosQueCuentan(estado, delMes(estado.finanzas.ingresos, mes)));
    const gastos = delMes(estado.finanzas.gastos, mes);
    const porSobre = {};
    for (const clave of Object.keys(SOBRES)) porSobre[clave] = sumar(gastos.filter((gasto) => gasto.categoria === clave));
    const gastado = sumar(gastos);
    return { ingresos, gastado, sobrante: ingresos - gastado, porSobre };
}

// El plan 50/30/20 del mes: cuánto le toca a cada sobre y cuánto llevas.
export function planDelMes(estado, mes) {
    const resumen = resumenDelMes(estado, mes);
    return Object.entries(SOBRES).map(([clave, sobre]) => {
        const limite = Math.round((resumen.ingresos * sobre.porcentaje) / 100);
        const gastado = resumen.porSobre[clave];
        const restante = limite - gastado;
        return { clave, ...sobre, limite, gastado, restante, pasado: restante < 0 };
    });
}

// (v136) Cómo se reparte un monto con el 50/30/20 (por ejemplo, el ingreso que acaba de entrar).
export function repartoDe(monto) {
    const necesidad = Math.round(monto * 0.5);
    const gusto = Math.round(monto * 0.3);
    return { necesidad, gusto, ahorro: monto - necesidad - gusto };
}

// (v136) El ritmo del mes: en qué día vas, cuántos quedan, hacia dónde va tu gasto y cuánto puedes gastar al día
// en necesidades y gustos SIN tocar tu 20 % de ahorro.
export function ritmoDelMes(estado, mes, fecha = hoy()) {
    const resumen = resumenDelMes(estado, mes);
    const plan = Object.fromEntries(planDelMes(estado, mes).map((sobre) => [sobre.clave, sobre]));
    const dias = diasDelMes(mes);
    const actual = mesDe(fecha) === mes;
    const dia = actual ? Number(fecha.slice(8, 10)) : dias;
    const restantes = actual ? dias - dia + 1 : 0;   // contando hoy
    const proyeccion = actual ? Math.round((resumen.gastado / dia) * dias) : resumen.gastado;
    const libre = Math.max(0, plan.necesidad.restante) + Math.max(0, plan.gusto.restante);
    const porDia = restantes > 0 ? Math.floor(libre / restantes) : 0;
    return { ...resumen, dias, dia, restantes, proyeccion, libre, porDia, actual };
}

// Porcentaje de una parte sobre un total, entre 0 y 100 (para las barras).
export function porcentaje(parte, total) {
    return total > 0 ? Math.min(100, Math.round((parte * 100) / total)) : 0;
}

// (v136) En qué se te va la plata: los conceptos que más suman en el mes (sin contar el ahorro).
export function mayoresGastos(estado, mes, cuantos = 5) {
    const grupos = new Map();
    for (const gasto of delMes(estado.finanzas.gastos, mes)) {
        if (gasto.categoria === "ahorro") continue;
        const clave = normalizarConcepto(gasto.concepto);
        const grupo = grupos.get(clave) || { concepto: gasto.concepto.trim(), monto: 0, veces: 0 };
        grupo.monto += gasto.monto;
        grupo.veces += 1;
        grupos.set(clave, grupo);
    }
    return [...grupos.values()].sort((a, b) => b.monto - a.monto).slice(0, cuantos);
}

// (v136) Los gastos «hormiga» del mes: pequeños, pero muchos.
export function gastosHormiga(estado, mes) {
    const lista = delMes(estado.finanzas.gastos, mes).filter((gasto) => gasto.categoria !== "ahorro" && gasto.monto <= GASTO_HORMIGA);
    return { veces: lista.length, monto: sumar(lista) };
}

// (v136) ¿Gastas más o menos que el mes pasado, hasta el mismo día? (cambio en %, o null si no hay con qué comparar)
export function comparacionConMesPasado(estado, fecha = hoy()) {
    const dia = fecha.slice(8, 10);
    const mes = mesDe(fecha);
    const anterior = mesAnterior(mes);
    const ahora = sumar(delMes(estado.finanzas.gastos, mes).filter((gasto) => gasto.fecha.slice(8, 10) <= dia));
    const antes = sumar(delMes(estado.finanzas.gastos, anterior).filter((gasto) => gasto.fecha.slice(8, 10) <= dia));
    return { ahora, antes, cambio: antes > 0 ? Math.round(((ahora - antes) * 100) / antes) : null };
}

// Los conceptos que se sugieren al anotar un gasto: los tuyos (los más recientes primero) y los comunes.
export function conceptosSugeridos(estado) {
    const tuyos = [...estado.finanzas.gastos].reverse().map((gasto) => gasto.concepto.trim());
    const vistos = new Set();
    return [...tuyos, ...CONCEPTOS_COMUNES].filter((concepto) => {
        const clave = normalizarConcepto(concepto);
        if (!concepto || vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
    }).slice(0, 20);
}

// ===== (v138) Medios de pago =====

// Cuánto hay en cada medio: lo que entró, menos lo que salió, más o menos las transferencias.
// Las transferencias entre medios no cambian el total de tu plata.
export function saldosPorMedio(estado) {
    const mapa = new Map();
    const sumarA = (medio, monto) => {
        const clave = medio || "sin";
        mapa.set(clave, (mapa.get(clave) || 0) + monto);
    };
    for (const ingreso of ingresosQueCuentan(estado, estado.finanzas.ingresos)) sumarA(ingreso.medio, ingreso.monto);
    for (const gasto of estado.finanzas.gastos) sumarA(gasto.medio, -gasto.monto);
    for (const movimiento of estado.finanzas.transferencias) {
        sumarA(movimiento.desde, -movimiento.monto);
        sumarA(movimiento.hacia, movimiento.monto);
    }
    return [...mapa.entries()]
        .map(([medio, saldo]) => ({
            medio,
            nombre: MEDIOS[medio]?.nombre || "Sin medio",
            icono: MEDIOS[medio]?.icono || "•",
            saldo,
        }))
        .sort((a, b) => b.saldo - a.saldo);
}

// ===== (v138) Gastos fijos del mes =====

// Cada gasto fijo (arriendo, servicios…) con su estado este mes: pagado (el gasto) o pendiente.
export function fijosDelMes(estado, mes) {
    const pagados = new Map();
    for (const gasto of delMes(estado.finanzas.gastos, mes)) {
        if (gasto.fijo !== undefined && gasto.fijo !== null) pagados.set(String(gasto.fijo), gasto);
    }
    return estado.finanzas.fijos.map((fijo) => ({ ...fijo, pagado: pagados.get(String(fijo.id)) || null }));
}

// ¿Este fijo está vencido? Solo si tiene día y ya pasó sin anotarlo.
export function fijoVencido(fijo, fecha = hoy()) {
    return Boolean(fijo.dia && !fijo.pagado && Number(fecha.slice(8, 10)) > fijo.dia);
}

// ===== (v138) Límites por concepto =====

// Cuánto llevas este mes de cada límite (los gastos con ese mismo concepto, sin contar el ahorro).
export function limitesDelMes(estado, mes) {
    const gastos = delMes(estado.finanzas.gastos, mes).filter((gasto) => gasto.categoria !== "ahorro");
    return estado.finanzas.limites.map((limite) => {
        const gastado = sumar(gastos.filter((gasto) => normalizarConcepto(gasto.concepto) === limite.clave));
        return { ...limite, gastado, restante: limite.tope - gastado, porcentaje: porcentaje(gastado, limite.tope), pasado: gastado > limite.tope };
    });
}

// ===== (v138) Ingresos esperados =====

// Los pagos que esperas y todavía no llegaron, del más cercano al más lejano.
export function esperadosPendientes(estado) {
    return estado.finanzas.esperados
        .filter((esperado) => !esperado.cobradoEn)
        .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

// ===== (v138) Ahorro automático =====

// Lo que se aparta en la meta al entrar cada ingreso (el porcentaje que elegiste, 20 % por defecto).
export function apartadoDe(estado, monto) {
    const config = estado.finanzas.apartado;
    if (!config?.metaId) return 0;
    return Math.round((monto * config.porcentaje) / 100);
}

// ===== Metas y deudas =====

// Cuánto llevas ahorrado en una meta: la suma de los gastos que van a esa meta.
export function ahorradoEnMeta(estado, meta) {
    return sumar(estado.finanzas.gastos.filter((gasto) => gasto.destino === `meta:${meta.id}`));
}

// Cuánto te falta de una deuda: lo que debías al empezar menos lo que has pagado.
export function saldoDeDeuda(estado, deuda) {
    const pagado = sumar(estado.finanzas.gastos.filter((gasto) => gasto.destino === `deuda:${deuda.id}`));
    return Math.max(0, deuda.saldoInicial - pagado);
}

// (v136) Cuánto ahorras al mes, en promedio, mirando los últimos 90 días (o null si no ahorraste nada).
export function ahorroMensualPromedio(estado, fecha = hoy()) {
    const desde = sumarDias(fecha, -89);
    const total = sumar(estado.finanzas.gastos.filter((gasto) => gasto.categoria === "ahorro" && gasto.fecha >= desde && gasto.fecha <= fecha));
    return total > 0 ? Math.round(total / 3) : null;
}

// (v136) En cuántos meses cumples una meta a tu ritmo de ahorro (null si no hay ritmo o ya está cumplida).
export function mesesParaMeta(estado, meta, fecha = hoy()) {
    const falta = meta.objetivo - ahorradoEnMeta(estado, meta);
    const ritmo = ahorroMensualPromedio(estado, fecha);
    return falta > 0 && ritmo ? Math.ceil(falta / ritmo) : null;
}

// (v136) En cuántos meses terminas de pagar una deuda con su cuota (null si no tiene cuota o ya está pagada).
export function mesesParaDeuda(estado, deuda) {
    const falta = saldoDeDeuda(estado, deuda);
    return falta > 0 && deuda.cuota ? Math.ceil(falta / deuda.cuota) : null;
}

// ===== (v138) Meses en plan =====

// Un mes está «en plan» si entró dinero, ningún sobre se pasó, ahorraste el 20 % y ningún límite se pasó.
export function mesEnPlan(estado, mes) {
    if (!resumenDelMes(estado, mes).ingresos) return false;
    if (planDelMes(estado, mes).some((sobre) => sobre.pasado)) return false;
    if (planDelMes(estado, mes).find((sobre) => sobre.clave === "ahorro").restante > 0) return false;
    return !limitesDelMes(estado, mes).some((limite) => limite.pasado);
}

// Los meses ya cerrados (antes del mes de hoy) que estuvieron en plan y todavía no dieron su premio.
export function mesesPorPremiar(estado, fecha = hoy()) {
    const todos = [...estado.finanzas.ingresos, ...estado.finanzas.gastos].map((movimiento) => mesDe(movimiento.fecha));
    if (!todos.length) return [];
    const primero = todos.reduce((a, b) => (a < b ? a : b));
    const actual = mesDe(fecha);
    const cerrados = [];
    for (let mes = primero; mes < actual && cerrados.length < 48; mes = mesSiguiente(mes)) {
        if (!estado.finanzas.premiosMes[mes] && mesEnPlan(estado, mes)) cerrados.push(mes);
    }
    return cerrados;
}

// Los últimos meses, para la gráfica: cuánto entró, cuánto gastaste y cuánto apartaste.
export function ultimosMeses(estado, fecha = hoy(), cuantos = 6) {
    const meses = [];
    let mes = mesDe(fecha);
    for (let i = 0; i < cuantos; i++) {
        meses.unshift(mes);
        mes = mesAnterior(mes);
    }
    return meses.map((m) => {
        const r = resumenDelMes(estado, m);
        return { mes: m, ingresos: r.ingresos, gastado: r.gastado, ahorro: r.porSobre.ahorro };
    });
}

// ===== Aurelio =====

// Los consejos de Aurelio que no dependen de tus números: uno por día.
export const CONSEJOS_DEL_DIA = [
    "Págate primero: aparta tu 20 % el mismo día que entra el dinero, antes de gastar.",
    "Con ingresos por día, vive con el promedio del mes, no con tu mejor día.",
    "Anota cada gasto el mismo día. A los tres días ya no te acuerdas de la mitad.",
    "El CDT y la inversión son para crecer: no los cuentes como plata para gastar.",
    "Los gastos hormiga (el tinto, el domicilio) pesan más de lo que parece. Súmalos al final de la semana.",
    "Antes de una compra grande, espera 48 horas. Si todavía la quieres, cómprala sin culpa.",
    "Una meta con nombre y monto se cumple más que un «ahorrar algo».",
    "Con varias deudas, paga la cuota mínima de todas y el resto a la más cara.",
    "No necesitas ser perfecto: un mes con el 20 % a medias ya es un avance.",
    "Un mes bueno de trabajo no es un mes para gastar más: es un mes para adelantar tu ahorro.",
];

// Lo que Aurelio ve en tus números, del más urgente al menos urgente.
// Cada nota: { tipo: "alerta" | "bien" | "idea", texto }. La primera es la que dice en voz alta.
export function analisisDeAurelio(estado, fecha = hoy()) {
    const f = estado.finanzas;
    if (!fuentesTocables(estado).length) {
        return [{ tipo: "idea", texto: "Anota tu fuente de ingreso para que pueda armar tu plan." }];
    }
    const mes = mesDe(fecha);
    const ritmo = ritmoDelMes(estado, mes, fecha);
    const plan = Object.fromEntries(planDelMes(estado, mes).map((sobre) => [sobre.clave, sobre]));
    const notas = [];
    const nota = (prioridad, tipo, texto) => notas.push({ prioridad, tipo, texto });

    if (!ritmo.ingresos) nota(2, "idea", "Todavía no entra dinero este mes. Anótalo cuando llegue: sin números no hay plan.");
    if (ritmo.ingresos && plan.necesidad.pasado) {
        nota(10, "alerta", `Tus necesidades ya pasaron el 50 % (${pesos(plan.necesidad.gastado)}). Mira qué gasto fijo puedes bajar.`);
    }
    if (ritmo.ingresos && plan.gusto.pasado) {
        nota(11, "alerta", `Tus gustos ya se comieron el 30 % (te pasaste ${pesos(-plan.gusto.restante)}). Un gusto menos esta semana y vuelves al plan.`);
    }
    // A este ritmo, ¿alcanza? (desde el día 5, para que unos pocos gastos no asusten)
    if (ritmo.ingresos && ritmo.dia >= 5 && ritmo.proyeccion > ritmo.ingresos) {
        nota(20, "alerta", `A este ritmo terminas el mes gastando ${pesos(ritmo.proyeccion)}, ${pesos(ritmo.proyeccion - ritmo.ingresos)} más de lo que entró.`);
    }
    // (v138) Saldos negativos en un medio: casi siempre falta anotar un ingreso o una transferencia.
    for (const saldo of saldosPorMedio(estado)) {
        if (saldo.medio !== "sin" && saldo.saldo < 0) {
            nota(12, "alerta", `En ${saldo.nombre} te quedó saldo negativo (${pesos(saldo.saldo)}). Revisa si falta anotar un ingreso o una transferencia.`);
        }
    }
    // (v138) Gastos fijos: los vencidos primero, después los que faltan.
    const pendientesFijos = fijosDelMes(estado, mes).filter((fijo) => !fijo.pagado);
    for (const fijo of pendientesFijos.filter((x) => fijoVencido(x, fecha))) {
        nota(13, "alerta", `Tu «${fijo.nombre}» (${pesos(fijo.monto)}) venció el día ${fijo.dia} y todavía no lo anotas.`);
    }
    const faltanFijos = pendientesFijos.filter((fijo) => !fijoVencido(fijo, fecha));
    if (faltanFijos.length) {
        const total = faltanFijos.reduce((suma, fijo) => suma + fijo.monto, 0);
        nota(30, "idea", `Te faltan ${faltanFijos.length} gasto${faltanFijos.length === 1 ? "" : "s"} fijo${faltanFijos.length === 1 ? "" : "s"} este mes por ${pesos(total)}. Anótalos cuando los pagues.`);
    }
    // (v138) Límites por concepto.
    for (const limite of limitesDelMes(estado, mes)) {
        if (limite.pasado) nota(14, "alerta", `Te pasaste del límite de «${limite.concepto}» en ${pesos(limite.gastado - limite.tope)}.`);
        else if (limite.porcentaje >= 80) nota(33, "idea", `Llevas el ${limite.porcentaje} % del límite de «${limite.concepto}»: quedan ${pesos(limite.restante)}.`);
    }
    // (v138) Ingresos esperados que ya debieron llegar.
    for (const esperado of esperadosPendientes(estado).filter((x) => x.fecha < fecha)) {
        const nombre = esperado.nota || fuentePorId(estado, esperado.fuente)?.nombre || "un pago";
        nota(15, "idea", `Debió llegar ${pesos(esperado.monto)} de «${nombre}» el ${fechaTexto(esperado.fecha)}. ¿Ya te pagaron? Márcalo como cobrado.`);
    }
    // El CDT o la inversión que vence pronto.
    for (const fuente of f.fuentes) {
        if (!fuente.vence) continue;
        const faltan = diasEntre(fecha, fuente.vence);
        if (faltan >= 0 && faltan <= 30) {
            nota(25, "idea", `«${fuente.nombre}» vence en ${faltan === 0 ? "hoy mismo" : `${faltan} día${faltan === 1 ? "" : "s"}`}. Decide antes si lo renuevas o lo pasas a una meta.`);
        }
    }
    if (ritmo.ingresos && plan.ahorro.restante > 0 && ritmo.dia >= 15) {
        nota(30, "alerta", `Llevas ${pesos(plan.ahorro.gastado)} de ${pesos(plan.ahorro.limite)} para ahorro y deudas. Aún estás a tiempo: aparta lo que falta el día que te paguen.`);
    }
    // (v138) Ahorro automático: si todavía no lo activas, es lo que más ayuda.
    if (ritmo.ingresos && !f.apartado?.metaId && f.metas.length) {
        nota(31, "idea", "Activa el ahorro automático: al entrar cada pago, la app aparta tu 20 % en una meta. Así no depende de que te acuerdes.");
    }
    const hormiga = gastosHormiga(estado, mes);
    if (hormiga.veces >= 6 && ritmo.ingresos && hormiga.monto >= ritmo.ingresos * 0.05) {
        nota(35, "idea", `Llevas ${hormiga.veces} gastos pequeños este mes que suman ${pesos(hormiga.monto)}. Eso ya es una meta de ahorro.`);
    }
    const comparacion = comparacionConMesPasado(estado, fecha);
    if (comparacion.cambio !== null && comparacion.cambio >= 20) {
        nota(40, "alerta", `Vas gastando ${comparacion.cambio} % más que el mes pasado a esta misma altura.`);
    } else if (comparacion.cambio !== null && comparacion.cambio <= -15) {
        nota(40, "bien", `Vas gastando ${-comparacion.cambio} % menos que el mes pasado a esta altura. ¡Buen control!`);
    }
    // (v138) Mes en plan: lo que tienes que hacer para ganar el premio del mes.
    if (ritmo.ingresos && mesEnPlan(estado, mes)) {
        nota(41, "bien", `Este mes vas en plan. Si lo cierras así, ganas ${XP_MES_EN_PLAN} XP de Riqueza.`);
    }
    const [mayor] = mayoresGastos(estado, mes, 1);
    if (mayor && ritmo.gastado && mayor.monto >= ritmo.gastado * 0.25 && mayor.veces > 1) {
        nota(45, "idea", `Tu mayor gasto del mes es «${mayor.concepto}»: ${pesos(mayor.monto)} en ${mayor.veces} veces (${porcentaje(mayor.monto, ritmo.gastado)} % de lo gastado).`);
    }
    // Deudas: la que más tarda en pagarse, o la que no tiene cuota.
    const pendientes = f.deudas.filter((deuda) => saldoDeDeuda(estado, deuda) > 0);
    const sinCuota = pendientes.find((deuda) => !deuda.cuota);
    if (sinCuota) nota(50, "idea", `Ponle una cuota a «${sinCuota.nombre}» para saber cuándo terminas de pagarla.`);
    else if (pendientes.length) {
        const larga = pendientes.map((deuda) => ({ deuda, meses: mesesParaDeuda(estado, deuda) })).sort((a, b) => b.meses - a.meses)[0];
        nota(50, "idea", `Con la cuota de ${pesos(larga.deuda.cuota)}, «${larga.deuda.nombre}» queda pagada en ${larga.meses} mes${larga.meses === 1 ? "" : "es"}.`);
    }
    // ¿Tienes fondo de emergencia? Lo ideal: 3 meses de necesidades.
    const necesidades = Math.max(resumenDelMes(estado, mes).porSobre.necesidad, resumenDelMes(estado, mesAnterior(mes)).porSobre.necesidad);
    if (necesidades && !f.metas.some((meta) => /emergencia/i.test(meta.nombre))) {
        nota(55, "idea", `Un fondo de emergencia de 3 meses de necesidades serían unos ${pesos(necesidades * 3)}. Créalo como meta.`);
    }
    // La meta más cercana a cumplirse, a tu ritmo de ahorro.
    const conRitmo = f.metas.map((meta) => ({ meta, meses: mesesParaMeta(estado, meta, fecha) })).filter((x) => x.meses).sort((a, b) => a.meses - b.meses)[0];
    if (conRitmo) {
        nota(60, "bien", `A tu ritmo de ahorro, «${conRitmo.meta.nombre}» se cumple en unos ${conRitmo.meses} mes${conRitmo.meses === 1 ? "" : "es"}.`);
    }
    if (ritmo.ingresos && plan.ahorro.restante <= 0) nota(65, "bien", "¡Ahorro del mes cumplido! Tu yo del futuro te lo agradece.");
    if (ritmo.ingresos && ritmo.actual && ritmo.restantes) {
        nota(70, "idea", `Para no tocar tu ahorro, puedes gastar hasta ${pesos(ritmo.porDia)} al día lo que queda del mes.`);
    }
    const pagos = ingresosPorDia(estado, mes);
    if (pagos.dias >= 2) nota(80, "idea", `Este mes te pagaron ${pagos.dias} días, en promedio ${pesos(pagos.promedio)} cada uno.`);

    nota(99, "idea", CONSEJOS_DEL_DIA[diasEntre("2000-01-01", fecha) % CONSEJOS_DEL_DIA.length]);
    return notas.sort((a, b) => a.prioridad - b.prioridad).map(({ tipo, texto }) => ({ tipo, texto }));
}

// Lo que te dice Aurelio en voz alta: lo más urgente de su análisis.
export function consejoDeAurelio(estado, fecha = hoy()) {
    return analisisDeAurelio(estado, fecha)[0].texto;
}

// (Ayudantes privados del análisis)
function fuentePorId(estado, id) {
    return estado.finanzas.fuentes.find((fuente) => String(fuente.id) === String(id)) || null;
}

// "2026-10-18" → "18 oct"
function fechaTexto(fecha) {
    const [, mes, dia] = fecha.split("-");
    return `${Number(dia)} ${MESES[Number(mes) - 1].slice(0, 3)}`;
}

// Validación pequeña que usan las acciones (se exporta para no repetirla).
export function esFechaDeFinanzas(texto) {
    return esFechaValida(String(texto || ""));
}
