// vistas-finanzas.js — La pantalla Finanzas y su tarjeta en Hoy (v135; menú y diseño en la v136; cuentas en la v138).
//
// Parte de la app que solo DIBUJA: recibe la partida y devuelve HTML. Los formularios y botones
// tienen data-form / data-accion; sus acciones están en app-finanzas.js.
//
// La pantalla tiene un menú arriba (como el Gimnasio y el Running), con una sección a la vez:
//   Resumen   — cuánto puedes gastar hoy, lo que dice Aurelio, el plan 50/30/20, los últimos 6 meses y en qué se te va la plata
//   Anotar    — un gasto o un ingreso, con el medio de pago
//   Historial — los movimientos de cada mes, día por día (‹ › para ver meses anteriores) y ✏ para corregir uno
//   Cuentas   — cuánto hay en cada medio, pasar plata entre medios, gastos fijos, próximos ingresos y límites
//   Metas     — ahorro automático, metas de ahorro y deudas
//   Fuentes   — tu trabajo, tu inversión y tu CDT

import * as finanzas from "./finanzas.js";
import { describirMaestro } from "./maestro.js";
import { retratoPixel } from "./retratos.js";
import { esc, barra, vacio, encabezado, selectorSecciones } from "./vistas-comun.js";
import { fechaCorta, diaDeSemana, diasEntre, DIAS_CORTOS, hoy as hoyDeHoy } from "./fechas.js";

export const SECCIONES_FINANZAS = [
    ["resumen", "📊 Resumen"], ["anotar", "➕ Anotar"], ["historial", "📜 Historial"],
    ["cuentas", "🗂 Cuentas"], ["metas", "🎯 Metas"], ["fuentes", "🪙 Fuentes"],
];

const ICONO_NOTA = { alerta: "⚠", bien: "✨", idea: "💡" };

// La tarjeta de Finanzas en Hoy (debajo de la de Running).
export function tarjetaFinanzasHoy(estado, ctx) {
    const f = estado.finanzas;
    const ritmo = finanzas.ritmoDelMes(estado, finanzas.mesDe(ctx.hoy), ctx.hoy);
    let texto = "Anota tu plata y arma tu plan 50/30/20.";
    if (ritmo.ingresos) texto = `Hoy puedes gastar ${finanzas.pesos(ritmo.porDia)} · te quedan ${finanzas.pesos(Math.max(0, ritmo.sobrante))}`;
    else if (f.ingresos.length || f.gastos.length) texto = "Todavía no anotas ingresos este mes.";
    return `
        <div class="gym-hoy">
            <span class="gym-hoy-icono" aria-hidden="true">💰</span>
            <span class="gym-hoy-texto"><b>Finanzas</b><small>${esc(texto)}</small></span>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="finanzas">Abrir</button>
        </div>`;
}

// Pantalla completa de Finanzas: el menú y la sección elegida.
export function pantallaFinanzas(estado, ctx) {
    const pedida = ctx.subvista?.finanzas;
    const seccion = SECCIONES_FINANZAS.some(([clave]) => clave === pedida) ? pedida : "resumen";
    const contenido = {
        resumen: () => seccionResumen(estado, ctx),
        anotar: () => seccionAnotar(estado, ctx),
        historial: () => seccionHistorial(estado, ctx),
        cuentas: () => seccionCuentas(estado, ctx),
        metas: () => seccionMetas(estado, ctx),
        fuentes: () => seccionFuentes(estado, ctx),
    }[seccion];
    return `
        ${encabezado("💰 Finanzas", "hoy", "Hoy")}
        ${selectorSecciones("finanzas", SECCIONES_FINANZAS, seccion)}
        ${contenido()}`;
}

// ===== Piezas =====

// Un monto con color: verde si entra, rojo si sale.
const monto = (valor, signo) => `<b class="fin-monto ${signo === "+" ? "fin-entra" : signo === "↔" ? "fin-neutro" : "fin-sale"}">${signo}${finanzas.pesos(valor)}</b>`;

// Las opciones de medio de pago para un <select>.
function opcionesMedios(seleccion = "", textoVacio = "Sin anotar") {
    return `<option value="" ${!seleccion ? "selected" : ""}>${esc(textoVacio)}</option>` + Object.entries(finanzas.MEDIOS)
        .map(([clave, medio]) => `<option value="${clave}" ${seleccion === clave ? "selected" : ""}>${medio.icono} ${esc(medio.nombre)}</option>`).join("");
}

// Las opciones de sobre (necesidades, gustos, ahorro) para un <select>.
function opcionesSobres(seleccion = "necesidad") {
    return Object.entries(finanzas.SOBRES)
        .map(([clave, sobre]) => `<option value="${clave}" ${seleccion === clave ? "selected" : ""}>${sobre.icono} ${esc(sobre.nombre)}</option>`).join("");
}

// Las opciones de fuente de ingreso (solo las que tocas).
function opcionesFuentes(estado, seleccion = "") {
    return finanzas.fuentesTocables(estado)
        .map((fuente) => `<option value="${esc(fuente.id)}" ${String(seleccion) === String(fuente.id) ? "selected" : ""}>${esc(fuente.nombre)}</option>`).join("");
}

// Aurelio habla: lo más urgente en su globo y, debajo, lo demás que ve en tus números.
function aurelio(notas, cuantasMas = 2) {
    const [principal, ...resto] = notas;
    const mas = resto.slice(0, cuantasMas);
    return `
        <div class="gym-aurelio fin-aurelio fin-${principal.tipo}" role="status">
            <span class="gym-aurelio-retrato" aria-hidden="true">${retratoPixel(describirMaestro())}</span>
            <p><b>Aurelio</b>${esc(principal.texto)}</p>
        </div>
        ${mas.length ? `<ul class="fin-notas">${mas.map((nota) => `
            <li class="fin-${nota.tipo}"><span aria-hidden="true">${ICONO_NOTA[nota.tipo]}</span><span>${esc(nota.texto)}</span></li>`).join("")}
        </ul>` : ""}`;
}

// Las tres cifras del mes: entró, gastaste, te queda.
function cifras(r) {
    const quedo = r.sobrante >= 0;
    return `
        <div class="fin-cifras">
            <div><small>Entró</small><b class="fin-entra">${finanzas.pesos(r.ingresos)}</b></div>
            <div><small>Gastaste</small><b class="fin-sale">${finanzas.pesos(r.gastado)}</b></div>
            <div><small>${quedo ? "Te queda" : "Te pasaste"}</small><b class="${quedo ? "" : "fin-sale"}">${finanzas.pesos(Math.abs(r.sobrante))}</b></div>
        </div>`;
}

// Una barra con las tres partes del 50/30/20 (lo que llevas gastado en cada sobre, sobre lo que entró).
function barraDelPlan(plan, ingresos) {
    const partes = plan.map((sobre) => `<span class="fin-tramo fin-tramo-${sobre.clave}" style="width: ${finanzas.porcentaje(sobre.gastado, ingresos)}%"></span>`).join("");
    return `<div class="fin-barra-plan" aria-hidden="true">${partes}</div>
            <div class="fin-leyenda">${plan.map((sobre) => `<span><i class="fin-punto fin-tramo-${sobre.clave}"></i>${esc(sobre.nombre)}</span>`).join("")}</div>`;
}

// ===== (v147) La dona del plan 50/30/20 =====
// Las partes de la dona: lo que llevas gastado en cada sobre, sobre lo que entró en el mes, y lo que queda sin gastar.
// Si gastaste más de lo que entró, la dona entera es lo gastado (y no queda nada libre). Solo calcula: no cambia nada.
// plan = finanzas.planDelMes(…), ingresos = lo que entró. Devuelve [{ clave, nombre, valor, porcentaje, plan }…].
export function partesDeLaDona(plan, ingresos) {
    const gastado = plan.reduce((suma, sobre) => suma + Math.max(0, sobre.gastado), 0);
    const total = Math.max(ingresos, gastado);
    if (total <= 0) return [];
    const partes = plan.map((sobre) => ({ clave: sobre.clave, nombre: sobre.nombre, valor: Math.max(0, sobre.gastado), plan: sobre.porcentaje }));
    partes.push({ clave: "libre", nombre: "Sin gastar", valor: total - gastado, plan: null });
    return partes.map((parte) => ({ ...parte, porcentaje: (parte.valor / total) * 100 }));
}

// La dona en pixel art: una rejilla de 36 × 36 cuadritos. Cada cuadrito del anillo grueso toma el color de la parte en la
// que cae su ángulo (empezando arriba, en el sentido del reloj); afuera, un anillo fino con el plan (50 / 30 / 20) para
// comparar. Los cuadritos seguidos del mismo color se juntan en una sola tira (así el dibujo pesa poco).
const COLORES_DONA = { necesidad: "#22d3ee", gusto: "#c084fc", ahorro: "#34d399", libre: "#2b2748" };
const COLORES_PLAN = { necesidad: "#0f6f80", gusto: "#6c3d96", ahorro: "#17775a" };
export function donaDelPlan(partes) {
    const N = 36;
    const centro = N / 2;
    // El ángulo donde termina cada parte (de 0 a 1 vuelta).
    const tramos = (lista) => {
        let suma = 0;
        return lista.map(([clave, parte]) => { suma += parte; return [clave, suma]; });
    };
    const reales = tramos(partes.map((p) => [p.clave, p.porcentaje / 100]));
    const delPlan = tramos(partes.filter((p) => p.plan).map((p) => [p.clave, p.plan / 100]));
    const colorEn = (lista, vuelta, colores) => colores[(lista.find(([, hasta]) => vuelta < hasta - 1e-9) || lista[lista.length - 1])[0]];
    const filas = [];
    for (let y = 0; y < N; y++) {
        let tira = null;
        for (let x = 0; x <= N; x++) {
            let color = null;
            if (x < N) {
                const [dx, dy] = [x + 0.5 - centro, y + 0.5 - centro];
                const r = Math.hypot(dx, dy);
                const vuelta = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;   // 0 arriba, 0,25 a la derecha…
                if (r >= 9.2 && r <= 14.6) color = colorEn(reales, vuelta, COLORES_DONA);
                else if (r >= 15.8 && r <= 17.4 && delPlan.length) color = colorEn(delPlan, vuelta, COLORES_PLAN);
            }
            if (tira && tira.color === color) { tira.ancho++; continue; }
            if (tira?.color) filas.push(tira);
            tira = color ? { x, y, ancho: 1, color } : null;
        }
    }
    const porColor = new Map();
    for (const t of filas) porColor.set(t.color, (porColor.get(t.color) || "") + `M${t.x} ${t.y}h${t.ancho}v1h${-t.ancho}z`);
    const gastado = Math.round(100 - (partes.find((p) => p.clave === "libre")?.porcentaje || 0));
    return `<svg class="fin-dona" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="Llevas gastado el ${gastado} % de lo que entró este mes">
        ${[...porColor].map(([color, d]) => `<path fill="${color}" d="${d}"/>`).join("")}
        <text x="${centro}" y="${centro + 0.6}" text-anchor="middle" class="fin-dona-cifra">${gastado} %</text>
        <text x="${centro}" y="${centro + 5}" text-anchor="middle" class="fin-dona-texto">gastado</text></svg>`;
}

function bloqueDona(plan, ingresos) {
    const partes = partesDeLaDona(plan, ingresos);
    if (!partes.length) return "";
    return `
        <div class="fin-dona-caja">
            ${donaDelPlan(partes)}
            <ul class="fin-dona-leyenda">${partes.map((p) => `
                <li><i class="fin-punto fin-dona-${p.clave}"></i><span>${esc(p.nombre)}</span><b>${Math.round(p.porcentaje)} %</b>${p.plan ? `<small>plan ${p.plan} %</small>` : ""}</li>`).join("")}
            </ul>
        </div>
        <p class="mini texto-suave">El anillo grueso: lo que llevas gastado de lo que entró. El fino de afuera: el plan.</p>`;
}

// ===== Resumen =====

function seccionResumen(estado, ctx) {
    const mes = finanzas.mesDe(ctx.hoy);
    const ritmo = finanzas.ritmoDelMes(estado, mes, ctx.hoy);
    const plan = finanzas.planDelMes(estado, mes);
    const ultimo = [...estado.finanzas.ingresos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
    const mayores = finanzas.mayoresGastos(estado, mes);
    const enPlan = ritmo.ingresos && finanzas.mesEnPlan(estado, mes);
    const esperados = finanzas.esperadosPendientes(estado).filter((e) => e.fecha.slice(0, 7) === mes);
    const porLlegar = esperados.reduce((total, e) => total + e.monto, 0);
    const comparacion = finanzas.comparacionConMesPasado(estado, ctx.hoy);

    const heroe = ritmo.ingresos ? `
        <section class="panel fin-heroe">
            <small>Hoy puedes gastar</small>
            <b class="fin-heroe-cifra">${finanzas.pesos(ritmo.porDia)}</b>
            <small>sin tocar tu ahorro · ${ritmo.restantes} día${ritmo.restantes === 1 ? "" : "s"} para acabar ${esc(finanzas.nombreDelMes(mes).split(" ")[0])}</small>
            ${porLlegar ? `<small>Todavía esperas ${finanzas.pesos(porLlegar)} este mes (ver Cuentas).</small>` : ""}
        </section>` : `
        <section class="panel fin-heroe">
            <small>${esc(finanzas.nombreDelMes(mes))}</small>
            <b class="fin-heroe-cifra">${finanzas.pesos(0)}</b>
            <small>Anota lo que entra y te digo cuánto puedes gastar al día.</small>
            <button type="button" class="boton boton-principal boton-chico" data-accion="subvista" data-pantalla="finanzas" data-vista="anotar">➕ Anotar</button>
        </section>`;

    return `
        ${heroe}
        ${aurelio(finanzas.analisisDeAurelio(estado, ctx.hoy))}
        <section class="panel">
            <h2 class="titulo-juego">📅 ${esc(finanzas.nombreDelMes(mes))} ${enPlan ? `<span class="fin-badge">✨ En plan</span>` : ""}</h2>
            ${cifras(ritmo)}
            ${ritmo.ingresos ? barraDelPlan(plan, ritmo.ingresos) : ""}
            ${comparacion.cambio !== null ? `<p class="mini texto-suave">Frente al mes pasado (hasta hoy): ${comparacion.cambio > 0 ? "+" : ""}${comparacion.cambio} % de gasto.</p>` : ""}
        </section>
        <section class="panel">
            <h2 class="titulo-juego">🎯 Tu plan 50/30/20</h2>
            <p class="mini texto-suave">De lo que entra: 50 % necesidades, 30 % gustos y 20 % ahorro y deudas.</p>
            ${ritmo.ingresos ? bloqueDona(plan, ritmo.ingresos) : ""}
            ${plan.map((sobre) => `
                <div class="fin-sobre${sobre.pasado ? " fin-pasado" : ""}">
                    <div class="fin-sobre-cab">
                        <span>${sobre.icono} <b>${esc(sobre.nombre)}</b> <small>${sobre.porcentaje} %</small></span>
                        <small>${finanzas.pesos(sobre.gastado)} de ${finanzas.pesos(sobre.limite)}</small>
                    </div>
                    ${barra(finanzas.porcentaje(sobre.gastado, sobre.limite), `fin-barra-${sobre.clave}${sobre.pasado ? " fin-barra-mala" : ""}`)}
                    <small class="texto-suave">${sobre.pasado
                        ? `Te pasaste ${finanzas.pesos(-sobre.restante)}`
                        : `Te quedan ${finanzas.pesos(sobre.restante)} · ${esc(sobre.texto)}`}</small>
                </div>`).join("")}
            ${ritmo.ingresos ? "" : vacio("Cuando anotes un ingreso verás cuánto le toca a cada sobre.")}
        </section>
        ${seccionUltimosMeses(estado, ctx.hoy)}
        ${ultimo ? seccionReparto(ultimo) : ""}
        ${mayores.length ? `
        <section class="panel">
            <h2 class="titulo-juego">🔥 En qué se te va</h2>
            <ul class="fin-lista">${mayores.map((g) => `
                <li class="fin-mayor">
                    <span class="fin-mayor-texto"><b>${esc(g.concepto)}</b> <small>${g.veces} ${g.veces === 1 ? "vez" : "veces"}</small></span>
                    ${monto(g.monto, "−")}
                    ${barra(finanzas.porcentaje(g.monto, mayores[0].monto), "fin-barra-gusto")}
                </li>`).join("")}
            </ul>
        </section>` : ""}
        <p class="mini texto-suave">Patrimonio que no tocas (inversión y CDT): <b>${finanzas.pesos(finanzas.patrimonioIntocable(estado))}</b></p>`;
}

// (v138) Una gráfica simple de los últimos 6 meses: lo que entró contra lo que gastaste.
function seccionUltimosMeses(estado, fecha) {
    const datos = finanzas.ultimosMeses(estado, fecha, 6);
    if (!datos.some((d) => d.ingresos || d.gastado)) return "";
    const maximo = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.gastado]));
    return `
        <section class="panel">
            <h2 class="titulo-juego">📈 Últimos 6 meses</h2>
            <div class="fin-meses" role="img" aria-label="Lo que entró y lo que gastaste en los últimos 6 meses">
                ${datos.map((d) => `
                    <div class="fin-mes-col" title="${esc(finanzas.nombreDelMes(d.mes))}: entró ${finanzas.pesos(d.ingresos)}, gastaste ${finanzas.pesos(d.gastado)}">
                        <div class="fin-mes-barras">
                            <span class="fin-mes-ing" style="height: ${finanzas.porcentaje(d.ingresos, maximo)}%"></span>
                            <span class="fin-mes-gas" style="height: ${finanzas.porcentaje(d.gastado, maximo)}%"></span>
                        </div>
                        <small>${esc(finanzas.nombreDelMes(d.mes).slice(0, 3))}</small>
                    </div>`).join("")}
            </div>
            <p class="mini texto-suave"><i class="fin-punto fin-mes-ing"></i>Entró · <i class="fin-punto fin-mes-gas"></i>Gastaste</p>
        </section>`;
}

// Cómo repartir el último ingreso con el 50/30/20.
function seccionReparto(ingreso) {
    const r = finanzas.repartoDe(ingreso.monto);
    return `
        <section class="panel">
            <h2 class="titulo-juego">🪙 Último ingreso: ${finanzas.pesos(ingreso.monto)}</h2>
            <p class="mini texto-suave">${fechaCorta(ingreso.fecha)} · así se reparte:</p>
            <div class="fin-reparto">
                <div class="fin-tramo-necesidad"><small>🛒 Necesidades</small><b>${finanzas.pesos(r.necesidad)}</b></div>
                <div class="fin-tramo-gusto"><small>🎁 Gustos</small><b>${finanzas.pesos(r.gusto)}</b></div>
                <div class="fin-tramo-ahorro"><small>🌱 Ahorro</small><b>${finanzas.pesos(r.ahorro)}</b></div>
            </div>
        </section>`;
}

// ===== Anotar =====

function seccionAnotar(estado, ctx) {
    const modo = ctx.subvista?.finanzasModo === "ingreso" ? "ingreso" : "gasto";
    return `
        <div class="selector fin-modo" role="group" aria-label="Qué anotar">
            <button type="button" data-accion="finanzas-modo" data-modo="gasto" aria-pressed="${modo === "gasto"}">🛒 Gasté</button>
            <button type="button" data-accion="finanzas-modo" data-modo="ingreso" aria-pressed="${modo === "ingreso"}">🪙 Entró dinero</button>
        </div>
        ${modo === "gasto" ? formularioGasto(estado, ctx.hoy) : formularioIngreso(estado, ctx.hoy)}`;
}

function formularioGasto(estado, fecha) {
    const f = estado.finanzas;
    const sobres = Object.entries(finanzas.SOBRES).map(([clave, sobre], i) => `
        <label class="fin-chip"><input type="radio" name="categoria" value="${clave}" ${i === 0 ? "checked" : ""}>
            <span>${sobre.icono} ${esc(sobre.nombre)}</span></label>`).join("");
    const destinos = [
        ...f.metas.map((meta) => `<option value="meta:${esc(meta.id)}">🎯 Meta: ${esc(meta.nombre)}</option>`),
        ...f.deudas.filter((deuda) => finanzas.saldoDeDeuda(estado, deuda) > 0)
            .map((deuda) => `<option value="deuda:${esc(deuda.id)}">⚠ Pago de: ${esc(deuda.nombre)}</option>`),
    ].join("");
    const sugeridos = finanzas.conceptosSugeridos(estado).map((c) => `<option value="${esc(c)}"></option>`).join("");
    return `
        <section class="panel">
            <form data-form="finanzas-gasto" class="formulario fin-formulario">
                <label class="formulario-grupo fin-grande"><span>¿Cuánto gastaste?</span>
                    <input type="text" name="monto" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿En qué?</span>
                    <input type="text" name="concepto" maxlength="60" required placeholder="Ej: mercado" list="fin-conceptos" autocomplete="off">
                    <datalist id="fin-conceptos">${sugeridos}</datalist></label>
                <fieldset class="fin-chips"><legend>¿De qué sobre sale?</legend>${sobres}</fieldset>
                <label class="formulario-grupo"><span>¿Con qué pagaste?</span>
                    <select name="medio">${opcionesMedios("", "No lo anoto")}</select></label>
                ${destinos ? `<label class="formulario-grupo"><span>¿Es un abono a una meta o una deuda?</span>
                    <select name="destino"><option value="">No, es un gasto</option>${destinos}</select></label>` : ""}
                <label class="formulario-grupo"><span>Fecha</span>
                    <input type="date" name="fecha" value="${fecha}" max="${fecha}"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Anotar gasto</button>
            </form>
            <p class="mini texto-suave">Un abono a una meta o a una deuda cuenta en «Ahorro y deudas».</p>
        </section>`;
}

function formularioIngreso(estado, fecha) {
    const tocables = finanzas.fuentesTocables(estado);
    if (!tocables.length) {
        return `
        <section class="panel">
            ${vacio("Primero agrega tu trabajo como fuente de ingreso.")}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="subvista" data-pantalla="finanzas" data-vista="fuentes">🪙 Ir a Fuentes</button>
        </section>`;
    }
    return `
        <section class="panel">
            <form data-form="finanzas-ingreso" class="formulario fin-formulario">
                <label class="formulario-grupo fin-grande"><span>¿Cuánto entró?</span>
                    <input type="text" name="monto" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿De dónde?</span>
                    <select name="fuente" required>${opcionesFuentes(estado)}</select></label>
                <label class="formulario-grupo"><span>¿Dónde entró?</span>
                    <select name="medio">${opcionesMedios("", "No lo anoto")}</select></label>
                <label class="formulario-grupo"><span>Fecha</span>
                    <input type="date" name="fecha" value="${fecha}" max="${fecha}"></label>
                <label class="formulario-grupo"><span>Nota (opcional)</span>
                    <input type="text" name="nota" maxlength="60" placeholder="Ej: turno del sábado"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Anotar ingreso</button>
            </form>
            <p class="mini texto-suave">Al anotarlo, Aurelio te dice cómo repartirlo con el 50/30/20.</p>
        </section>`;
}

// ===== Historial =====

// Los movimientos de un mes, unidos y ordenados (los más nuevos primero).
function movimientosDelMes(estado, mes) {
    const f = estado.finanzas;
    const fuentePor = new Map(f.fuentes.map((fuente) => [String(fuente.id), fuente.nombre]));
    const ingresos = finanzas.delMes(f.ingresos, mes).map((i) => ({
        ...i, lista: "ingresos", signo: "+", icono: "🪙",
        texto: fuentePor.get(String(i.fuente)) || "Ingreso", detalle: i.nota,
    }));
    const gastos = finanzas.delMes(f.gastos, mes).map((g) => {
        const esApartado = g.origen !== undefined;
        const esFijo = g.fijo !== undefined && g.fijo !== null;
        return {
            ...g, lista: "gastos", signo: "−",
            icono: esApartado ? "🌱" : esFijo ? "🔁" : (finanzas.SOBRES[g.categoria]?.icono || "🛒"),
            texto: g.concepto,
            detalle: esApartado ? "apartado automático" : esFijo ? "gasto fijo"
                : g.destino ? (g.destino.startsWith("meta:") ? "abono a meta" : "pago de deuda") : finanzas.SOBRES[g.categoria]?.nombre,
        };
    });
    const transferencias = finanzas.delMes(f.transferencias, mes).map((t) => ({
        ...t, lista: "transferencias", signo: "↔", icono: "🗂",
        texto: `${finanzas.MEDIOS[t.desde]?.nombre || "Medio"} → ${finanzas.MEDIOS[t.hacia]?.nombre || "medio"}`,
        detalle: "pasé plata (no cuenta como gasto)",
    }));
    return [...ingresos, ...gastos, ...transferencias].sort((a, b) => (a.fecha === b.fecha ? b.id - a.id : a.fecha < b.fecha ? 1 : -1));
}

function seccionHistorial(estado, ctx) {
    const actual = finanzas.mesDe(ctx.hoy);
    const mes = ctx.subvista?.finanzasMes && ctx.subvista.finanzasMes <= actual ? ctx.subvista.finanzasMes : actual;
    const r = finanzas.resumenDelMes(estado, mes);
    const movimientos = movimientosDelMes(estado, mes);
    const editando = ctx.subvista?.finanzasEditar || null;
    const dias = [...new Set(movimientos.map((m) => m.fecha))];
    const lista = dias.map((dia) => `
        <li class="fin-dia"><small>${DIAS_CORTOS[diaDeSemana(dia)]} ${fechaCorta(dia)}</small></li>
        ${movimientos.filter((m) => m.fecha === dia).map((m) => {
            if (editando === `${m.lista}:${m.id}`) return `<li class="fin-editando">${formularioEditar(estado, m)}</li>`;
            const medio = m.medio ? `${finanzas.MEDIOS[m.medio]?.icono || ""} ${finanzas.MEDIOS[m.medio]?.nombre || ""}`.trim() : "";
            return `
        <li class="fin-fila">
            <span class="fin-fila-icono" aria-hidden="true">${m.icono}</span>
            <span class="fin-fila-texto"><b>${esc(m.texto)}</b><small>${esc([m.detalle, medio].filter(Boolean).join(" · "))}</small></span>
            ${monto(m.monto, m.signo)}
            ${m.lista === "transferencias" ? "" : `<button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-editar-abrir" data-lista="${m.lista}" data-id="${esc(m.id)}" aria-label="Corregir">✏</button>`}
            <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="${m.lista}" data-id="${esc(m.id)}" aria-label="Borrar">🗑</button>
        </li>`;
        }).join("")}`).join("");
    return `
        <section class="panel">
            <div class="fin-mes">
                <button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-mes" data-delta="-1" aria-label="Mes anterior">‹</button>
                <h2 class="titulo-juego">${esc(finanzas.nombreDelMes(mes))}</h2>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-mes" data-delta="1" aria-label="Mes siguiente" ${mes >= actual ? "disabled" : ""}>›</button>
            </div>
            ${cifras(r)}
            ${movimientos.length ? `<ul class="fin-lista">${lista}</ul>` : vacio("No hay movimientos este mes.")}
        </section>`;
}

// (v138) El formulario para corregir un movimiento, en su lugar dentro de la lista.
function formularioEditar(estado, m) {
    const cancelar = `<button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-editar-cerrar">Cancelar</button>`;
    const cabecera = `<input type="hidden" name="lista" value="${m.lista}"><input type="hidden" name="id" value="${esc(m.id)}">`;
    const montoActual = finanzas.agruparPesos(String(m.monto));
    if (m.lista === "ingresos") {
        return `
            <form data-form="finanzas-editar" class="formulario fin-formulario fin-editar">
                <p class="mini"><b>Corregir ingreso</b></p>${cabecera}
                <div class="fin-par">
                    <label class="formulario-grupo"><span>Cuánto (pesos)</span>
                        <input type="text" name="monto" data-pesos inputmode="numeric" required value="${montoActual}"></label>
                    <label class="formulario-grupo"><span>Fecha</span>
                        <input type="date" name="fecha" required value="${m.fecha}" max="${hoyDeHoy()}"></label>
                </div>
                <label class="formulario-grupo"><span>De dónde</span>
                    <select name="fuente" required>${opcionesFuentes(estado, m.fuente)}</select></label>
                <label class="formulario-grupo"><span>Dónde entró</span>
                    <select name="medio">${opcionesMedios(m.medio || "", "No lo anoto")}</select></label>
                <label class="formulario-grupo"><span>Nota</span>
                    <input type="text" name="nota" maxlength="60" value="${esc(m.nota || "")}"></label>
                <div class="fin-par">
                    <button type="submit" class="boton boton-principal">Guardar</button>${cancelar}
                </div>
            </form>`;
    }
    const opcionesDestino = [
        ...estado.finanzas.metas.map((meta) => `<option value="meta:${esc(meta.id)}" ${m.destino === `meta:${meta.id}` ? "selected" : ""}>🎯 Meta: ${esc(meta.nombre)}</option>`),
        ...estado.finanzas.deudas.map((deuda) => `<option value="deuda:${esc(deuda.id)}" ${m.destino === `deuda:${deuda.id}` ? "selected" : ""}>⚠ Pago de: ${esc(deuda.nombre)}</option>`),
    ].join("");
    return `
        <form data-form="finanzas-editar" class="formulario fin-formulario fin-editar">
            <p class="mini"><b>Corregir gasto</b></p>${cabecera}
            <div class="fin-par">
                <label class="formulario-grupo"><span>Cuánto (pesos)</span>
                    <input type="text" name="monto" data-pesos inputmode="numeric" required value="${montoActual}"></label>
                <label class="formulario-grupo"><span>Fecha</span>
                    <input type="date" name="fecha" required value="${m.fecha}" max="${hoyDeHoy()}"></label>
            </div>
            <label class="formulario-grupo"><span>¿En qué?</span>
                <input type="text" name="concepto" maxlength="60" required value="${esc(m.concepto)}"></label>
            <label class="formulario-grupo"><span>¿De qué sobre?</span>
                <select name="categoria">${opcionesSobres(m.categoria)}</select></label>
            <label class="formulario-grupo"><span>¿Va a una meta o a una deuda?</span>
                <select name="destino"><option value="">No</option>${opcionesDestino}</select></label>
            <label class="formulario-grupo"><span>¿Con qué pagaste?</span>
                <select name="medio">${opcionesMedios(m.medio || "", "No lo anoto")}</select></label>
            <div class="fin-par">
                <button type="submit" class="boton boton-principal">Guardar</button>${cancelar}
            </div>
        </form>`;
}

// ===== Cuentas =====

function seccionCuentas(estado, ctx) {
    return `
        ${seccionMedios(estado, ctx)}
        ${seccionFijos(estado, ctx)}
        ${seccionEsperados(estado, ctx)}
        ${seccionLimites(estado, ctx)}`;
}

// Cuánto hay en cada medio y cómo pasar plata de uno a otro.
function seccionMedios(estado, ctx) {
    const saldos = finanzas.saldosPorMedio(estado);
    const total = saldos.reduce((suma, s) => suma + s.saldo, 0);
    const transferencias = [...estado.finanzas.transferencias].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 5);
    const opciones = Object.entries(finanzas.MEDIOS).map(([clave, medio]) => `<option value="${clave}">${medio.icono} ${esc(medio.nombre)}</option>`).join("");
    const opcionesHacia = Object.entries(finanzas.MEDIOS).map(([clave, medio], i) => `<option value="${clave}" ${i === 1 ? "selected" : ""}>${medio.icono} ${esc(medio.nombre)}</option>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">💳 Tus medios</h2>
            ${saldos.length ? `<ul class="fin-medios">${saldos.map((s) => `
                <li class="fin-medio${s.saldo < 0 ? " fin-medio-malo" : ""}">
                    <span>${s.icono} <b>${esc(s.nombre)}</b></span>
                    <b class="${s.saldo < 0 ? "fin-sale" : "fin-entra"}">${finanzas.pesos(s.saldo)}</b>
                </li>`).join("")}</ul>
                <p class="mini texto-suave">En total: <b>${finanzas.pesos(total)}</b> (sin contar lo que tienes en inversión y CDT).</p>`
                : vacio("Cuando anotes un ingreso o un gasto con su medio, verás cuánto hay en cada uno.")}
            <form data-form="finanzas-transferencia" class="formulario fin-formulario">
                <p class="mini"><b>Pasé plata de un medio a otro</b></p>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>De</span>
                        <select name="desde" required>${opciones}</select></label>
                    <label class="formulario-grupo"><span>A</span>
                        <select name="hacia" required>${opcionesHacia}</select></label>
                </div>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿Cuánto? (pesos)</span>
                        <input type="text" name="monto" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>Fecha</span>
                        <input type="date" name="fecha" value="${ctx.hoy}" max="${ctx.hoy}"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Anotar transferencia</button>
            </form>
            ${transferencias.length ? `<p class="mini"><b>Últimas transferencias</b></p><ul class="fin-lista">${transferencias.map((t) => `
                <li class="fin-fila">
                    <span class="fin-fila-icono" aria-hidden="true">🗂</span>
                    <span class="fin-fila-texto"><b>${esc(finanzas.MEDIOS[t.desde]?.nombre || "")} → ${esc(finanzas.MEDIOS[t.hacia]?.nombre || "")}</b><small>${fechaCorta(t.fecha)}</small></span>
                    ${monto(t.monto, "↔")}
                    <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="transferencias" data-id="${esc(t.id)}" aria-label="Borrar transferencia">🗑</button>
                </li>`).join("")}</ul>` : ""}
        </section>`;
}

// Gastos fijos: lo que se repite cada mes, con un toque para anotarlo.
function seccionFijos(estado, ctx) {
    const mes = finanzas.mesDe(ctx.hoy);
    const fijos = finanzas.fijosDelMes(estado, mes);
    const pendientes = fijos.filter((fijo) => !fijo.pagado);
    const filas = fijos.map((fijo) => {
        const vencido = finanzas.fijoVencido(fijo, ctx.hoy);
        const estadoFijo = fijo.pagado
            ? `<small class="fin-ok">✔ Anotado el ${fechaCorta(fijo.pagado.fecha)}</small>`
            : `<small class="${vencido ? "fin-sale" : "texto-suave"}">${vencido ? `Venció el día ${fijo.dia}` : fijo.dia ? `Vence el día ${fijo.dia}` : "Sin día fijo"}</small>`;
        return `
            <li class="fin-tarjeta${fijo.pagado ? " fin-lista-cumplida" : ""}">
                <div class="fin-tarjeta-cab">
                    <b>🔁 ${esc(fijo.nombre)}</b>
                    <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="fijos" data-id="${esc(fijo.id)}" aria-label="Borrar gasto fijo">🗑</button>
                </div>
                <small>${finanzas.pesos(fijo.monto)} · ${esc(finanzas.SOBRES[fijo.categoria]?.nombre || "")}${fijo.medio ? ` · ${esc(finanzas.MEDIOS[fijo.medio]?.nombre || "")}` : ""}</small>
                ${estadoFijo}
                ${fijo.pagado ? "" : `<button type="button" class="boton boton-principal boton-chico" data-accion="finanzas-fijo-pagar" data-id="${esc(fijo.id)}">Anotar pago de hoy</button>`}
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🔁 Gastos fijos</h2>
            <p class="mini texto-suave">${pendientes.length
                ? `Te faltan ${pendientes.length} este mes por ${finanzas.pesos(pendientes.reduce((s, f) => s + f.monto, 0))}.`
                : fijos.length ? "¡Todos los fijos de este mes están anotados!" : "Arriendo, servicios, celular: lo que se repite cada mes."}</p>
            ${fijos.length ? `<ul class="fin-lista">${filas}</ul>` : ""}
            <form data-form="finanzas-fijo" class="formulario fin-formulario">
                <p class="mini"><b>Agregar un gasto fijo</b></p>
                <label class="formulario-grupo"><span>¿Qué es?</span>
                    <input type="text" name="nombre" maxlength="40" required placeholder="Ej: arriendo"></label>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿Cuánto al mes?</span>
                        <input type="text" name="monto" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>¿Qué día se paga?</span>
                        <input type="text" name="dia" inputmode="numeric" maxlength="2" placeholder="Ej: 5 (opcional)" autocomplete="off"></label>
                </div>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿De qué sobre?</span>
                        <select name="categoria">${opcionesSobres("necesidad")}</select></label>
                    <label class="formulario-grupo"><span>¿Con qué pagas?</span>
                        <select name="medio">${opcionesMedios("", "Sin medio")}</select></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar gasto fijo</button>
            </form>
        </section>`;
}

// Pagos que esperas (la quincena, un turno): cuánto va a entrar antes de que llegue.
function seccionEsperados(estado, ctx) {
    const pendientes = finanzas.esperadosPendientes(estado);
    const nombreDeFuente = (id) => finanzas.fuentesTocables(estado).find((x) => String(x.id) === String(id))?.nombre;
    const filas = pendientes.map((e) => {
        const nombre = e.nota || nombreDeFuente(e.fuente) || "pago";
        const atrasado = e.fecha < ctx.hoy;
        return `
            <li class="fin-tarjeta${atrasado ? " fin-atrasado" : ""}">
                <div class="fin-tarjeta-cab">
                    <b>⏳ ${esc(nombre)}</b>
                    <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="esperados" data-id="${esc(e.id)}" aria-label="Borrar pago esperado">🗑</button>
                </div>
                <small>${finanzas.pesos(e.monto)} · ${atrasado ? "debió llegar" : "llega"} el ${fechaCorta(e.fecha)}</small>
                <button type="button" class="boton boton-principal boton-chico" data-accion="finanzas-cobrar" data-id="${esc(e.id)}">✔ Ya llegó</button>
            </li>`;
    }).join("");
    const tocables = finanzas.fuentesTocables(estado);
    return `
        <section class="panel">
            <h2 class="titulo-juego">⏳ Próximos ingresos</h2>
            <p class="mini texto-suave">${pendientes.length
                ? `Por llegar: ${finanzas.pesos(pendientes.reduce((s, e) => s + e.monto, 0))}. Cuando llegue, toca «Ya llegó» y queda anotado.`
                : "Anota lo que esperas (la quincena, un turno) para ver cuánto va a entrar."}</p>
            ${pendientes.length ? `<ul class="fin-lista">${filas}</ul>` : ""}
            ${tocables.length ? `<form data-form="finanzas-esperado" class="formulario fin-formulario">
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿De dónde?</span>
                        <select name="fuente" required>${opcionesFuentes(estado)}</select></label>
                    <label class="formulario-grupo"><span>¿Cuánto?</span>
                        <input type="text" name="monto" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                </div>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿Cuándo llega?</span>
                        <input type="date" name="fecha" required></label>
                    <label class="formulario-grupo"><span>Nota (opcional)</span>
                        <input type="text" name="nota" maxlength="60" placeholder="Ej: quincena"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar pago esperado</button>
            </form>` : vacio("Primero agrega tu trabajo como fuente de ingreso (en Fuentes).")}
        </section>`;
}

// Límites por concepto: «Comida: máximo $400.000 al mes».
function seccionLimites(estado, ctx) {
    const mes = finanzas.mesDe(ctx.hoy);
    const limites = finanzas.limitesDelMes(estado, mes);
    const sugeridos = finanzas.conceptosSugeridos(estado).map((c) => `<option value="${esc(c)}"></option>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🔥 Límites por concepto</h2>
            <p class="mini texto-suave">Un tope para un gasto que se te va de las manos (por ejemplo, la comida). Te avisa al 80 % y cuando te pasas.</p>
            ${limites.length ? `<ul class="fin-lista">${limites.map((l) => `
                <li class="fin-tarjeta${l.pasado ? " fin-atrasado" : ""}">
                    <div class="fin-tarjeta-cab">
                        <b>${esc(l.concepto)}</b>
                        <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="limites" data-id="${esc(l.id)}" aria-label="Borrar límite">🗑</button>
                    </div>
                    ${barra(l.porcentaje, l.pasado ? "fin-barra-mala" : "fin-barra-gusto")}
                    <small>${finanzas.pesos(l.gastado)} de ${finanzas.pesos(l.tope)} · ${l.pasado ? `te pasaste ${finanzas.pesos(-l.restante)}` : `quedan ${finanzas.pesos(l.restante)}`}</small>
                </li>`).join("")}</ul>` : vacio("Todavía no tienes límites.")}
            <form data-form="finanzas-limite" class="formulario fin-formulario">
                <div class="fin-par">
                    <label class="formulario-grupo"><span>Concepto</span>
                        <input type="text" name="concepto" maxlength="40" required placeholder="Ej: comida" list="fin-conceptos-limite" autocomplete="off">
                        <datalist id="fin-conceptos-limite">${sugeridos}</datalist></label>
                    <label class="formulario-grupo"><span>Máximo al mes</span>
                        <input type="text" name="tope" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Poner límite</button>
            </form>
        </section>`;
}

// ===== Metas y deudas =====

function seccionMetas(estado, ctx) {
    const f = estado.finanzas;
    const ritmoAhorro = finanzas.ahorroMensualPromedio(estado, ctx.hoy);
    const apartado = f.apartado || { metaId: null, porcentaje: 20 };
    const metaApartado = f.metas.find((m) => String(m.id) === String(apartado.metaId));
    const metas = f.metas.map((meta) => {
        const ahorrado = finanzas.ahorradoEnMeta(estado, meta);
        const listo = ahorrado >= meta.objetivo;
        const meses = finanzas.mesesParaMeta(estado, meta, ctx.hoy);
        return `
            <li class="fin-tarjeta${listo ? " fin-lista-cumplida" : ""}">
                <div class="fin-tarjeta-cab">
                    <b>🎯 ${esc(meta.nombre)}</b>
                    <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="metas" data-id="${esc(meta.id)}" aria-label="Borrar meta">🗑</button>
                </div>
                ${barra(finanzas.porcentaje(ahorrado, meta.objetivo), "fin-barra-ahorro")}
                <small>${finanzas.pesos(ahorrado)} de ${finanzas.pesos(meta.objetivo)} · ${finanzas.porcentaje(ahorrado, meta.objetivo)} %</small>
                <small class="texto-suave">${listo ? "✨ ¡Cumplida!" : `Te faltan ${finanzas.pesos(meta.objetivo - ahorrado)}${meses ? ` · a tu ritmo, unos ${meses} mes${meses === 1 ? "" : "es"}` : ""}`}</small>
                ${String(apartado.metaId) === String(meta.id) ? `<small class="fin-ok">🌱 Recibe el ahorro automático</small>` : ""}
            </li>`;
    }).join("");
    const deudas = f.deudas.map((deuda) => {
        const falta = finanzas.saldoDeDeuda(estado, deuda);
        const meses = finanzas.mesesParaDeuda(estado, deuda);
        return `
            <li class="fin-tarjeta${falta === 0 ? " fin-lista-cumplida" : ""}">
                <div class="fin-tarjeta-cab">
                    <b>⚠ ${esc(deuda.nombre)}</b>
                    <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="deudas" data-id="${esc(deuda.id)}" aria-label="Borrar deuda">🗑</button>
                </div>
                ${barra(finanzas.porcentaje(deuda.saldoInicial - falta, deuda.saldoInicial), "fin-barra-ahorro")}
                <small>${falta === 0 ? "✨ ¡Pagada!" : `Te faltan ${finanzas.pesos(falta)} de ${finanzas.pesos(deuda.saldoInicial)}`}</small>
                <small class="texto-suave">${deuda.cuota ? `Cuota ${finanzas.pesos(deuda.cuota)}${meses ? ` · terminas en ${meses} mes${meses === 1 ? "" : "es"}` : ""}` : "Sin cuota: ponle una para saber cuándo terminas."}</small>
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🌱 Ahorro automático</h2>
            <p class="mini texto-suave">${metaApartado
                ? `Al entrar cada pago, se aparta el ${apartado.porcentaje} % en «${esc(metaApartado.nombre)}». Se anota solo, como gasto de «Ahorro y deudas».`
                : "Activa el ahorro automático: al entrar cada pago se aparta un porcentaje en una meta, sin que tengas que acordarte."}</p>
            <form data-form="finanzas-apartado" class="formulario fin-formulario">
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿A qué meta?</span>
                        <select name="metaId">
                            <option value="">Apagado</option>
                            ${f.metas.map((m) => `<option value="${esc(m.id)}" ${String(apartado.metaId) === String(m.id) ? "selected" : ""}>🎯 ${esc(m.nombre)}</option>`).join("")}
                        </select></label>
                    <label class="formulario-grupo"><span>¿Cuánto % aparta?</span>
                        <input type="text" name="porcentaje" inputmode="numeric" maxlength="2" value="${apartado.porcentaje}" autocomplete="off"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Guardar ahorro automático</button>
            </form>
        </section>
        <section class="panel">
            <h2 class="titulo-juego">🎯 Metas de ahorro</h2>
            <p class="mini texto-suave">${ritmoAhorro ? `Ahorras unos ${finanzas.pesos(ritmoAhorro)} al mes (últimos 3 meses).` : "Para abonar: Anotar → Gasté → elige la meta."}</p>
            ${metas ? `<ul class="fin-lista">${metas}</ul>` : vacio("Pon una meta: un fondo de emergencia, una compra…")}
            <form data-form="finanzas-meta" class="formulario fin-formulario">
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿Para qué?</span>
                        <input type="text" name="nombre" maxlength="40" required placeholder="Ej: fondo de emergencia"></label>
                    <label class="formulario-grupo"><span>¿Cuánto?</span>
                        <input type="text" name="objetivo" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Crear meta</button>
            </form>
        </section>
        <section class="panel">
            <h2 class="titulo-juego">⚠ Deudas</h2>
            ${deudas ? `<ul class="fin-lista">${deudas}</ul>` : vacio("Si debes algo, anótalo aquí para ver cuánto falta.")}
            <form data-form="finanzas-deuda" class="formulario fin-formulario">
                <label class="formulario-grupo"><span>¿Qué deuda es?</span>
                    <input type="text" name="nombre" maxlength="40" required placeholder="Ej: tarjeta de crédito"></label>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿Cuánto debes hoy?</span>
                        <input type="text" name="saldo" data-pesos inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>Cuota al mes</span>
                        <input type="text" name="cuota" data-pesos inputmode="numeric" placeholder="$ 0 (opcional)" autocomplete="off"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar deuda</button>
            </form>
            <p class="mini texto-suave">Para pagar: Anotar → Gasté → elige «Pago de» la deuda.</p>
        </section>`;
}

// ===== Fuentes =====

function seccionFuentes(estado, ctx) {
    const fuentes = estado.finanzas.fuentes;
    const pagos = finanzas.ingresosPorDia(estado, finanzas.mesDe(ctx.hoy));
    const tarjeta = (fuente) => {
        const tipo = finanzas.TIPOS_FUENTE[fuente.tipo];
        let detalle;
        if (tipo.tocable) {
            detalle = `<small class="texto-suave">${pagos.dias ? `Este mes: ${pagos.dias} día${pagos.dias === 1 ? "" : "s"} con pago, promedio ${finanzas.pesos(pagos.promedio)}` : "Lo que entra se anota en Anotar → Entró dinero."}</small>`;
        } else {
            const faltan = fuente.vence ? diasEntre(ctx.hoy, fuente.vence) : null;
            detalle = `
                <b class="fin-valor">${finanzas.pesos(fuente.valor)}</b>
                ${fuente.vence ? `<small class="texto-suave">Vence ${fechaCorta(fuente.vence)}${faltan !== null && faltan >= 0 ? ` · faltan ${faltan} día${faltan === 1 ? "" : "s"}` : " · ya venció"}</small>` : ""}
                <form data-form="finanzas-valor" class="form-linea">
                    <input type="hidden" name="id" value="${esc(fuente.id)}">
                    <input type="text" name="valor" data-pesos inputmode="numeric" placeholder="Nuevo valor" aria-label="Cuánto tienes ahí (pesos)" autocomplete="off">
                    <button type="submit" class="boton boton-chico">Cambiar</button>
                </form>`;
        }
        return `
            <li class="fin-tarjeta">
                <div class="fin-tarjeta-cab">
                    <b>${tipo.icono} ${esc(fuente.nombre)}</b>
                    <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="fuentes" data-id="${esc(fuente.id)}" aria-label="Borrar fuente">🗑</button>
                </div>
                <small class="texto-suave">${esc(tipo.nombre)}</small>
                ${detalle}
            </li>`;
    };
    const tocables = fuentes.filter((fuente) => finanzas.TIPOS_FUENTE[fuente.tipo].tocable);
    const guardadas = fuentes.filter((fuente) => !finanzas.TIPOS_FUENTE[fuente.tipo].tocable);
    const opciones = Object.entries(finanzas.TIPOS_FUENTE)
        .map(([clave, tipo]) => `<option value="${clave}">${tipo.icono} ${esc(tipo.nombre)}</option>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🪙 Lo que entra</h2>
            ${tocables.length ? `<ul class="fin-lista">${tocables.map(tarjeta).join("")}</ul>` : vacio("Agrega tu trabajo para anotar lo que te pagan.")}
        </section>
        <section class="panel">
            <h2 class="titulo-juego">🔒 Lo que no tocas</h2>
            <p class="fin-patrimonio"><small>Patrimonio guardado</small><b>${finanzas.pesos(finanzas.patrimonioIntocable(estado))}</b></p>
            ${guardadas.length ? `<ul class="fin-lista">${guardadas.map(tarjeta).join("")}</ul>` : vacio("Agrega tu inversión y tu CDT con lo que tienes ahí.")}
            <p class="mini texto-suave">No entran al plan 50/30/20: son para crecer.</p>
        </section>
        <section class="panel">
            <h2 class="titulo-juego">➕ Agregar fuente</h2>
            <form data-form="finanzas-fuente" class="formulario fin-formulario">
                <label class="formulario-grupo"><span>Nombre</span>
                    <input type="text" name="nombre" maxlength="40" required placeholder="Ej: trabajo del fin de semana"></label>
                <label class="formulario-grupo"><span>Tipo</span>
                    <select name="tipo">${opciones}</select></label>
                <div class="fin-par">
                    <label class="formulario-grupo"><span>Valor (inversión/CDT)</span>
                        <input type="text" name="valor" data-pesos inputmode="numeric" placeholder="$ 0" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>Vence (CDT)</span>
                        <input type="date" name="vence"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar fuente</button>
            </form>
        </section>`;
}
