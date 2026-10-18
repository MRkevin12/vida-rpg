// finanzas.js — Las cuentas de tu plata, en pesos colombianos (v135).
//
// Solo reglas y cálculos: no toca la pantalla ni guarda nada (eso es acciones.js y vistas-finanzas.js).
//
// El plan es el 50/30/20: el dinero que ENTRA en el mes se reparte en tres sobres:
// necesidades (50 %), gustos (30 %) y ahorro y deudas (20 %).
// Solo cuentan los ingresos de las fuentes que SÍ puedes tocar (trabajo). La inversión y el CDT
// se anotan aparte, con su valor actual, y no entran al plan.

import { hoy, MESES, diasEntre } from "./fechas.js";

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

// Tus finanzas suman al atributo Riqueza (💰). Cada registro da un poco de XP, con tope al día,
// para que no se gane XP por anotar lo mismo varias veces.
export const XP_POR_REGISTRO = 5;
export const REGISTROS_CON_XP_AL_DIA = 3;
export const XP_META_CUMPLIDA = 150;

export const MONTO_MAXIMO = 1e12;   // un billón de pesos: más que cualquier cuenta personal

// Formato de pesos: $1.500.000 (sin centavos, como se usa en Colombia).
const formatoPesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
export function pesos(cantidad) {
    const valor = Math.round(cantidad);
    return `${valor < 0 ? "-" : ""}$${formatoPesos.format(Math.abs(valor))}`;
}

// Lo que escribes en un formulario ("1.500.000", "$ 80000") → número de pesos. Si no es un monto válido, devuelve null.
export function dineroDeTexto(texto) {
    const digitos = String(texto ?? "").replace(/\D/g, "");
    if (!digitos) return null;
    const cantidad = Number(digitos);
    return cantidad >= 1 && cantidad <= MONTO_MAXIMO ? cantidad : null;
}

// "2026-10" → "octubre 2026"
export function nombreDelMes(mes) {
    const [anio, numero] = mes.split("-");
    return `${MESES[Number(numero) - 1]} ${anio}`;
}

// "2026-10-18" → "2026-10"
export const mesDe = (fecha) => fecha.slice(0, 7);

// Los movimientos de un mes (los que tienen una fecha de ese mes).
export function delMes(lista, mes) {
    return lista.filter((movimiento) => mesDe(movimiento.fecha) === mes);
}

const sumar = (lista) => lista.reduce((total, elemento) => total + elemento.monto, 0);

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

// Cuánto entró en el mes (solo de fuentes que tocas), cuánto gastaste y cuánto te queda, por sobre.
export function resumenDelMes(estado, mes) {
    const tocables = new Set(fuentesTocables(estado).map((fuente) => fuente.id));
    const ingresos = sumar(delMes(estado.finanzas.ingresos, mes).filter((ingreso) => tocables.has(ingreso.fuente)));
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

// Porcentaje de una parte sobre un total, entre 0 y 100 (para las barras).
export function porcentaje(parte, total) {
    return total > 0 ? Math.min(100, Math.round((parte * 100) / total)) : 0;
}

// Cuánto llevas ahorrado en una meta: la suma de los gastos que van a esa meta.
export function ahorradoEnMeta(estado, meta) {
    return sumar(estado.finanzas.gastos.filter((gasto) => gasto.destino === `meta:${meta.id}`));
}

// Cuánto te falta de una deuda: lo que debías al empezar menos lo que has pagado.
export function saldoDeDeuda(estado, deuda) {
    const pagado = sumar(estado.finanzas.gastos.filter((gasto) => gasto.destino === `deuda:${deuda.id}`));
    return Math.max(0, deuda.saldoInicial - pagado);
}

// Los consejos de Aurelio que no dependen de tus números: uno por día.
export const CONSEJOS_DEL_DIA = [
    "Págate primero: aparta tu 20 % el mismo día que entra el dinero, antes de gastar.",
    "Con ingresos por día, vive con el promedio del mes, no con tu mejor día.",
    "Anota cada gasto el mismo día. A los tres días ya no te acuerdas de la mitad.",
    "El CDT y la inversión son para crecer: no los cuentes como plata para gastar.",
    "Los gastos hormiga (el tinto, la domicilio) pesan más de lo que parece. Súmalos al final de la semana.",
    "Antes de una compra grande, espera 48 horas. Si todavía la quieres, cómprala sin culpa.",
    "Una meta con nombre y monto se cumple más que un «ahorrar algo».",
    "Con varias deudas, paga la cuota mínima de todas y el resto a la más cara.",
    "No necesitas ser perfecto: un mes con el 20 % a medias ya es un avance.",
];

// Lo que te dice Aurelio: primero lo que pasa con TUS números este mes; si todo va bien, un consejo del día.
export function consejoDeAurelio(estado, fecha = hoy()) {
    if (!fuentesTocables(estado).length) return "Anota tu fuente de ingreso para que pueda armar tu plan.";
    const mes = mesDe(fecha);
    const resumen = resumenDelMes(estado, mes);
    if (!resumen.ingresos) return "Todavía no entra dinero este mes. Anótalo cuando llegue: sin números no hay plan.";
    const plan = Object.fromEntries(planDelMes(estado, mes).map((sobre) => [sobre.clave, sobre]));
    if (plan.necesidad.pasado) return `Tus necesidades ya pasaron el 50 % (${pesos(plan.necesidad.gastado)}). Mira qué gasto fijo puedes bajar.`;
    if (plan.gusto.pasado) return "Tus gustos ya se comieron el 30 %. Un gusto menos esta semana y vuelves al plan.";
    if (plan.ahorro.restante > 0 && fecha.slice(8) >= "15") {
        return `Llevas ${pesos(plan.ahorro.gastado)} de ${pesos(plan.ahorro.limite)} para ahorro y deudas. Aún estás a tiempo: aparta lo que falta el día que te paguen.`;
    }
    if (plan.ahorro.restante <= 0) return "¡Ahorro del mes cumplido! Tu yo del futuro te lo agradece.";
    const indice = diasEntre("2000-01-01", fecha) % CONSEJOS_DEL_DIA.length;
    return CONSEJOS_DEL_DIA[indice];
}
