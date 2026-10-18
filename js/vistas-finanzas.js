// vistas-finanzas.js — La pantalla Finanzas (v135) y su tarjeta en Hoy: tu plata en pesos, el plan 50/30/20 y Aurelio.
//
// Parte de la app que solo DIBUJA: recibe la partida y devuelve HTML. Los formularios y botones
// tienen data-form / data-accion; sus acciones están en app-finanzas.js.

import * as finanzas from "./finanzas.js";
import { describirMaestro } from "./maestro.js";
import { retratoPixel } from "./retratos.js";
import { esc, barra, vacio, encabezado } from "./vistas-comun.js";
import { fechaCorta } from "./fechas.js";

// La tarjeta de Finanzas en Hoy (debajo de la de Running).
export function tarjetaFinanzasHoy(estado, ctx) {
    const f = estado.finanzas;
    const sinNada = !f.ingresos.length && !f.gastos.length;
    const resumen = finanzas.resumenDelMes(estado, finanzas.mesDe(ctx.hoy));
    const texto = sinNada
        ? "Anota tu plata y arma tu plan 50/30/20."
        : resumen.sobrante >= 0 ? `Te quedan ${finanzas.pesos(resumen.sobrante)} este mes.`
            : `Te pasaste ${finanzas.pesos(-resumen.sobrante)} este mes.`;
    return `
        <div class="gym-hoy">
            <span class="gym-hoy-icono" aria-hidden="true">💰</span>
            <span class="gym-hoy-texto"><b>Finanzas</b><small>${esc(texto)}</small></span>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="finanzas">Abrir</button>
        </div>`;
}

// Aurelio habla como en el gimnasio: retrato y globo de texto.
function burbujaDeAurelio(texto) {
    return `<div class="gym-aurelio" role="status">
                <span class="gym-aurelio-retrato" aria-hidden="true">${retratoPixel(describirMaestro())}</span>
                <p><b>Aurelio</b>${esc(texto)}</p>
            </div>`;
}

// Pantalla completa de Finanzas.
export function pantallaFinanzas(estado, ctx) {
    const mes = finanzas.mesDe(ctx.hoy);
    return `
        ${encabezado("💰 Finanzas", "hoy", "Hoy")}
        ${burbujaDeAurelio(finanzas.consejoDeAurelio(estado, ctx.hoy))}
        ${seccionDelMes(estado, mes)}
        ${seccionPlan(estado, mes)}
        ${seccionAnotar(estado, ctx.hoy)}
        ${seccionMovimientos(estado, mes)}
        ${seccionFuentes(estado)}
        ${seccionMetas(estado)}
        ${seccionDeudas(estado)}
        <p class="mini texto-suave">Todo en pesos colombianos. La inversión y el CDT no entran al plan 50/30/20: se anotan con lo que tienes ahí.</p>`;
}

// Lo que entró, lo que gastaste y lo que te queda este mes.
function seccionDelMes(estado, mes) {
    const r = finanzas.resumenDelMes(estado, mes);
    const quedo = r.sobrante >= 0;
    return `
        <section class="panel">
            <h2 class="titulo-juego">📅 ${esc(finanzas.nombreDelMes(mes))}</h2>
            <div class="fin-cifras">
                <div><small>Entró</small><b>${finanzas.pesos(r.ingresos)}</b></div>
                <div><small>Gastaste</small><b>${finanzas.pesos(r.gastado)}</b></div>
                <div><small>${quedo ? "Te queda" : "Te pasaste"}</small><b class="${quedo ? "" : "fin-malo"}">${finanzas.pesos(Math.abs(r.sobrante))}</b></div>
            </div>
            ${r.ingresos ? "" : `<p class="nota">Todavía no anotas ingresos este mes.</p>`}
            <p class="mini texto-suave">Patrimonio que no tocas (inversión y CDT): <b>${finanzas.pesos(finanzas.patrimonioIntocable(estado))}</b></p>
        </section>`;
}

// El plan 50/30/20: cuánto le toca a cada sobre y cuánto llevas.
function seccionPlan(estado, mes) {
    const plan = finanzas.planDelMes(estado, mes);
    const hayIngresos = finanzas.resumenDelMes(estado, mes).ingresos > 0;
    return `
        <section class="panel">
            <h2 class="titulo-juego">🎯 Tu plan 50/30/20</h2>
            <p class="mini texto-suave">De lo que entra: 50 % necesidades, 30 % gustos y 20 % ahorro y deudas.</p>
            ${plan.map((sobre) => `
                <div class="fin-sobre${sobre.pasado ? " fin-pasado" : ""}">
                    <div class="fin-sobre-cab">
                        <span>${sobre.icono} <b>${esc(sobre.nombre)}</b> <small>${sobre.porcentaje} %</small></span>
                        <small>${finanzas.pesos(sobre.gastado)} de ${finanzas.pesos(sobre.limite)}</small>
                    </div>
                    ${barra(finanzas.porcentaje(sobre.gastado, sobre.limite), sobre.pasado ? "fin-barra-mala" : "")}
                    <small class="texto-suave">${sobre.pasado
                        ? `Te pasaste ${finanzas.pesos(-sobre.restante)}`
                        : `Te quedan ${finanzas.pesos(sobre.restante)} · ${esc(sobre.texto)}`}</small>
                </div>`).join("")}
            ${hayIngresos ? "" : vacio("Cuando anotes un ingreso verás cuánto le toca a cada sobre.")}
        </section>`;
}

// Los formularios para anotar un ingreso y un gasto.
function seccionAnotar(estado, fecha) {
    const f = estado.finanzas;
    const tocables = finanzas.fuentesTocables(estado);
    const opcionesFuentes = tocables.map((fuente) => `<option value="${esc(fuente.id)}">${esc(fuente.nombre)}</option>`).join("");
    const opcionesSobres = Object.entries(finanzas.SOBRES)
        .map(([clave, sobre]) => `<option value="${clave}">${sobre.icono} ${esc(sobre.nombre)}</option>`).join("");
    const destinos = [
        ...f.metas.map((meta) => `<option value="meta:${esc(meta.id)}">🎯 Meta: ${esc(meta.nombre)}</option>`),
        ...f.deudas.map((deuda) => `<option value="deuda:${esc(deuda.id)}">⚠ Pago de: ${esc(deuda.nombre)}</option>`),
    ].join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">➕ Anotar</h2>
            ${tocables.length ? `
            <form data-form="finanzas-ingreso" class="formulario">
                <p class="mini"><b>Entró dinero</b></p>
                <label class="formulario-grupo"><span>¿Cuánto entró? (pesos)</span>
                    <input name="monto" inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿De dónde?</span>
                    <select name="fuente" required>${opcionesFuentes}</select></label>
                <label class="formulario-grupo"><span>Fecha</span>
                    <input type="date" name="fecha" value="${fecha}" max="${fecha}"></label>
                <label class="formulario-grupo"><span>Nota (opcional)</span>
                    <input name="nota" maxlength="60" placeholder="Ej: turno del sábado"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Anotar ingreso</button>
            </form>` : `<p class="nota">Primero agrega tu fuente de ingreso (abajo) para anotar lo que entra.</p>`}
            <form data-form="finanzas-gasto" class="formulario">
                <p class="mini"><b>Gasté dinero</b></p>
                <label class="formulario-grupo"><span>¿Cuánto? (pesos)</span>
                    <input name="monto" inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿En qué?</span>
                    <input name="concepto" maxlength="60" required placeholder="Ej: mercado"></label>
                <label class="formulario-grupo"><span>¿A qué sobre?</span>
                    <select name="categoria">${opcionesSobres}</select></label>
                <label class="formulario-grupo"><span>¿Va a una meta o a una deuda? (opcional)</span>
                    <select name="destino"><option value="">No, es un gasto</option>${destinos}</select></label>
                <label class="formulario-grupo"><span>Fecha</span>
                    <input type="date" name="fecha" value="${fecha}" max="${fecha}"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Anotar gasto</button>
            </form>
            <p class="mini texto-suave">Un abono a una meta o a una deuda cuenta en «Ahorro y deudas».</p>
        </section>`;
}

// Lo último que anotaste este mes, con botón para borrar (por si te equivocaste).
function seccionMovimientos(estado, mes) {
    const f = estado.finanzas;
    const fuentePor = new Map(f.fuentes.map((fuente) => [fuente.id, fuente.nombre]));
    const ingresos = finanzas.delMes(f.ingresos, mes).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 8);
    const gastos = finanzas.delMes(f.gastos, mes).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 8);
    const fila = (lista, texto, quien, id) => `
        <li class="fin-fila">
            <span>${texto}</span>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-borrar" data-lista="${quien}" data-id="${esc(id)}" aria-label="Borrar">🗑</button>
        </li>`;
    return `
        <section class="panel">
            <h2 class="titulo-juego">📝 Lo de este mes</h2>
            <h3 class="mini"><b>Ingresos</b></h3>
            ${ingresos.length ? `<ul class="lista">${ingresos.map((i) => fila("ingresos",
                `${finanzas.pesos(i.monto)} · ${esc(fuentePor.get(i.fuente) || "sin fuente")} · ${fechaCorta(i.fecha)}${i.nota ? ` · <small>${esc(i.nota)}</small>` : ""}`,
                "ingresos", i.id)).join("")}</ul>` : vacio("Aún no hay ingresos este mes.")}
            <h3 class="mini"><b>Gastos</b></h3>
            ${gastos.length ? `<ul class="lista">${gastos.map((g) => fila("gastos",
                `${finanzas.pesos(g.monto)} · ${esc(g.concepto)} · ${fechaCorta(g.fecha)}`, "gastos", g.id)).join("")}</ul>` : vacio("Aún no hay gastos este mes.")}
        </section>`;
}

// Tus fuentes: el trabajo (de donde entra) y lo que no tocas (inversión, CDT).
function seccionFuentes(estado) {
    const fuentes = estado.finanzas.fuentes;
    const filas = fuentes.map((fuente) => {
        const tipo = finanzas.TIPOS_FUENTE[fuente.tipo];
        const dato = tipo.tocable
            ? `<small class="texto-suave">Entra cuando te pagan (anótalo como ingreso)</small>`
            : `<form data-form="finanzas-valor" class="form-linea">
                    <input type="hidden" name="id" value="${esc(fuente.id)}">
                    <input name="valor" inputmode="numeric" placeholder="Ahora: ${finanzas.pesos(fuente.valor)}" aria-label="Cuánto tienes ahí (pesos)" autocomplete="off">
                    <button type="submit" class="boton boton-chico">Cambiar</button>
                </form>`;
        const vence = fuente.vence ? ` · vence ${fechaCorta(fuente.vence)}` : "";
        return `
            <li class="fin-fila fin-fuente">
                <span class="fin-fuente-texto"><b>${tipo.icono} ${esc(fuente.nombre)}</b> <small>${esc(tipo.nombre)}${vence}</small>${dato}</span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-borrar" data-lista="fuentes" data-id="${esc(fuente.id)}" aria-label="Borrar fuente">🗑</button>
            </li>`;
    }).join("");
    const opciones = Object.entries(finanzas.TIPOS_FUENTE)
        .map(([clave, tipo]) => `<option value="${clave}">${tipo.icono} ${esc(tipo.nombre)}</option>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏦 Tus fuentes</h2>
            <p class="mini texto-suave">Lo que no tocas (inversión, CDT) se anota con su valor actual: no entra al plan.</p>
            ${fuentes.length ? `<ul class="lista">${filas}</ul>` : vacio("Agrega tu trabajo, tu inversión y tu CDT.")}
            <form data-form="finanzas-fuente" class="formulario">
                <label class="formulario-grupo"><span>Nombre</span>
                    <input name="nombre" maxlength="40" required placeholder="Ej: trabajo del fin de semana"></label>
                <label class="formulario-grupo"><span>Tipo</span>
                    <select name="tipo">${opciones}</select></label>
                <label class="formulario-grupo"><span>¿Cuánto tienes ahí? (solo inversión o CDT, en pesos)</span>
                    <input name="valor" inputmode="numeric" placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿Cuándo vence? (solo CDT, opcional)</span>
                    <input type="date" name="vence"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar fuente</button>
            </form>
        </section>`;
}

// Metas de ahorro: cuánto llevas y cuánto te falta. Un abono se anota como gasto con destino «Meta».
function seccionMetas(estado) {
    const metas = estado.finanzas.metas;
    const filas = metas.map((meta) => {
        const ahorrado = finanzas.ahorradoEnMeta(estado, meta);
        const listo = ahorrado >= meta.objetivo;
        return `
            <li class="fin-fila fin-meta">
                <span class="fin-meta-texto">
                    <b>🎯 ${esc(meta.nombre)}</b> <small>${finanzas.pesos(ahorrado)} de ${finanzas.pesos(meta.objetivo)}${listo ? " · ¡cumplida!" : ""}</small>
                    ${barra(finanzas.porcentaje(ahorrado, meta.objetivo))}
                </span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-borrar" data-lista="metas" data-id="${esc(meta.id)}" aria-label="Borrar meta">🗑</button>
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🌱 Metas de ahorro</h2>
            ${metas.length ? `<ul class="lista">${filas}</ul>` : vacio("Pon una meta: un fondo de emergencia, una compra…")}
            <form data-form="finanzas-meta" class="formulario">
                <label class="formulario-grupo"><span>¿Para qué?</span>
                    <input name="nombre" maxlength="40" required placeholder="Ej: fondo de emergencia"></label>
                <label class="formulario-grupo"><span>¿Cuánto quieres juntar? (pesos)</span>
                    <input name="objetivo" inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Crear meta</button>
            </form>
            <p class="mini texto-suave">Para abonar, anota un gasto y elige «Va a una meta».</p>
        </section>`;
}

// Deudas: cuánto te falta y cuánto has pagado.
function seccionDeudas(estado) {
    const deudas = estado.finanzas.deudas;
    const filas = deudas.map((deuda) => {
        const falta = finanzas.saldoDeDeuda(estado, deuda);
        const pagado = deuda.saldoInicial - falta;
        return `
            <li class="fin-fila fin-meta">
                <span class="fin-meta-texto">
                    <b>⚠ ${esc(deuda.nombre)}</b> <small>te faltan ${finanzas.pesos(falta)}${deuda.cuota ? ` · cuota ${finanzas.pesos(deuda.cuota)}` : ""}${falta === 0 ? " · ¡pagada!" : ""}</small>
                    ${barra(finanzas.porcentaje(pagado, deuda.saldoInicial))}
                </span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="finanzas-borrar" data-lista="deudas" data-id="${esc(deuda.id)}" aria-label="Borrar deuda">🗑</button>
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">⚠ Deudas</h2>
            ${deudas.length ? `<ul class="lista">${filas}</ul>` : vacio("Si debes algo, anótalo aquí para ver cuánto falta.")}
            <form data-form="finanzas-deuda" class="formulario">
                <label class="formulario-grupo"><span>¿Qué deuda es?</span>
                    <input name="nombre" maxlength="40" required placeholder="Ej: tarjeta de crédito"></label>
                <label class="formulario-grupo"><span>¿Cuánto debes hoy? (pesos)</span>
                    <input name="saldo" inputmode="numeric" required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>Cuota mensual (opcional, pesos)</span>
                    <input name="cuota" inputmode="numeric" placeholder="$ 0" autocomplete="off"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar deuda</button>
            </form>
            <p class="mini texto-suave">Cada abono se anota como gasto con destino «Pago de» la deuda.</p>
        </section>`;
}
