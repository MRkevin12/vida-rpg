// vistas-finanzas.js — La pantalla Finanzas y su tarjeta en Hoy (v135; menú y diseño nuevo en la v136).
//
// Parte de la app que solo DIBUJA: recibe la partida y devuelve HTML. Los formularios y botones
// tienen data-form / data-accion; sus acciones están en app-finanzas.js.
//
// La pantalla tiene un menú arriba (como el Gimnasio y el Running), con una sección a la vez:
//   Resumen   — cuánto puedes gastar hoy, lo que dice Aurelio, el plan 50/30/20 y en qué se te va la plata
//   Anotar    — un gasto o un ingreso
//   Historial — los movimientos de cada mes, día por día (con ‹ › para ver meses anteriores)
//   Metas     — metas de ahorro y deudas
//   Fuentes   — tu trabajo, tu inversión y tu CDT

import * as finanzas from "./finanzas.js";
import { describirMaestro } from "./maestro.js";
import { retratoPixel } from "./retratos.js";
import { esc, barra, vacio, encabezado, selectorSecciones } from "./vistas-comun.js";
import { fechaCorta, diaDeSemana, diasEntre, DIAS_CORTOS } from "./fechas.js";

export const SECCIONES_FINANZAS = [
    ["resumen", "📊 Resumen"], ["anotar", "➕ Anotar"], ["historial", "📜 Historial"], ["metas", "🎯 Metas"], ["fuentes", "🪙 Fuentes"],
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
const monto = (valor, signo) => `<b class="fin-monto ${signo === "+" ? "fin-entra" : "fin-sale"}">${signo}${finanzas.pesos(valor)}</b>`;

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

// ===== Resumen =====

function seccionResumen(estado, ctx) {
    const mes = finanzas.mesDe(ctx.hoy);
    const ritmo = finanzas.ritmoDelMes(estado, mes, ctx.hoy);
    const plan = finanzas.planDelMes(estado, mes);
    const ultimo = [...estado.finanzas.ingresos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
    const mayores = finanzas.mayoresGastos(estado, mes);
    const comparacion = finanzas.comparacionConMesPasado(estado, ctx.hoy);

    const heroe = ritmo.ingresos ? `
        <section class="panel fin-heroe">
            <small>Hoy puedes gastar</small>
            <b class="fin-heroe-cifra">${finanzas.pesos(ritmo.porDia)}</b>
            <small>sin tocar tu ahorro · ${ritmo.restantes} día${ritmo.restantes === 1 ? "" : "s"} para acabar ${esc(finanzas.nombreDelMes(mes).split(" ")[0])}</small>
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
            <h2 class="titulo-juego">📅 ${esc(finanzas.nombreDelMes(mes))}</h2>
            ${cifras(ritmo)}
            ${ritmo.ingresos ? barraDelPlan(plan, ritmo.ingresos) : ""}
            ${comparacion.cambio !== null ? `<p class="mini texto-suave">Frente al mes pasado (hasta hoy): ${comparacion.cambio > 0 ? "+" : ""}${comparacion.cambio} % de gasto.</p>` : ""}
        </section>
        <section class="panel">
            <h2 class="titulo-juego">🎯 Tu plan 50/30/20</h2>
            <p class="mini texto-suave">De lo que entra: 50 % necesidades, 30 % gustos y 20 % ahorro y deudas.</p>
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
                    <input type="text" name="monto" inputmode="numeric" data-pesos required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿En qué?</span>
                    <input type="text" name="concepto" maxlength="60" required placeholder="Ej: mercado" list="fin-conceptos" autocomplete="off">
                    <datalist id="fin-conceptos">${sugeridos}</datalist></label>
                <fieldset class="fin-chips"><legend>¿De qué sobre sale?</legend>${sobres}</fieldset>
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
    const opciones = tocables.map((fuente) => `<option value="${esc(fuente.id)}">${esc(fuente.nombre)}</option>`).join("");
    return `
        <section class="panel">
            <form data-form="finanzas-ingreso" class="formulario fin-formulario">
                <label class="formulario-grupo fin-grande"><span>¿Cuánto entró?</span>
                    <input type="text" name="monto" inputmode="numeric" data-pesos required placeholder="$ 0" autocomplete="off"></label>
                <label class="formulario-grupo"><span>¿De dónde?</span>
                    <select name="fuente" required>${opciones}</select></label>
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

function seccionHistorial(estado, ctx) {
    const f = estado.finanzas;
    const actual = finanzas.mesDe(ctx.hoy);
    const mes = ctx.subvista?.finanzasMes && ctx.subvista.finanzasMes <= actual ? ctx.subvista.finanzasMes : actual;
    const r = finanzas.resumenDelMes(estado, mes);
    const fuentePor = new Map(f.fuentes.map((fuente) => [fuente.id, fuente.nombre]));
    const movimientos = [
        ...finanzas.delMes(f.ingresos, mes).map((i) => ({ ...i, lista: "ingresos", signo: "+",
            icono: "🪙", texto: fuentePor.get(i.fuente) || "Ingreso", detalle: i.nota })),
        ...finanzas.delMes(f.gastos, mes).map((g) => ({ ...g, lista: "gastos", signo: "−",
            icono: finanzas.SOBRES[g.categoria]?.icono || "🛒", texto: g.concepto,
            detalle: g.destino ? (g.destino.startsWith("meta:") ? "abono a meta" : "pago de deuda") : finanzas.SOBRES[g.categoria]?.nombre })),
    ].sort((a, b) => (a.fecha === b.fecha ? b.id - a.id : a.fecha < b.fecha ? 1 : -1));
    const dias = [...new Set(movimientos.map((m) => m.fecha))];
    const lista = dias.map((dia) => `
        <li class="fin-dia"><small>${DIAS_CORTOS[diaDeSemana(dia)]} ${fechaCorta(dia)}</small></li>
        ${movimientos.filter((m) => m.fecha === dia).map((m) => `
        <li class="fin-fila">
            <span class="fin-fila-icono" aria-hidden="true">${m.icono}</span>
            <span class="fin-fila-texto"><b>${esc(m.texto)}</b>${m.detalle ? `<small>${esc(m.detalle)}</small>` : ""}</span>
            ${monto(m.monto, m.signo)}
            <button type="button" class="boton boton-chico boton-secundario fin-borrar" data-accion="finanzas-borrar" data-lista="${m.lista}" data-id="${esc(m.id)}" aria-label="Borrar">🗑</button>
        </li>`).join("")}`).join("");
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

// ===== Metas y deudas =====

function seccionMetas(estado, ctx) {
    const f = estado.finanzas;
    const ritmoAhorro = finanzas.ahorroMensualPromedio(estado, ctx.hoy);
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
            <h2 class="titulo-juego">🌱 Metas de ahorro</h2>
            <p class="mini texto-suave">${ritmoAhorro ? `Ahorras unos ${finanzas.pesos(ritmoAhorro)} al mes (últimos 3 meses).` : "Para abonar: Anotar → Gasté → elige la meta."}</p>
            ${metas ? `<ul class="fin-lista">${metas}</ul>` : vacio("Pon una meta: un fondo de emergencia, una compra…")}
            <form data-form="finanzas-meta" class="formulario fin-formulario">
                <div class="fin-par">
                    <label class="formulario-grupo"><span>¿Para qué?</span>
                        <input type="text" name="nombre" maxlength="40" required placeholder="Ej: fondo de emergencia"></label>
                    <label class="formulario-grupo"><span>¿Cuánto?</span>
                        <input type="text" name="objetivo" inputmode="numeric" data-pesos required placeholder="$ 0" autocomplete="off"></label>
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
                        <input type="text" name="saldo" inputmode="numeric" data-pesos required placeholder="$ 0" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>Cuota al mes</span>
                        <input type="text" name="cuota" inputmode="numeric" data-pesos placeholder="$ 0 (opcional)" autocomplete="off"></label>
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
                    <input type="text" name="valor" inputmode="numeric" data-pesos placeholder="Nuevo valor" aria-label="Cuánto tienes ahí (pesos)" autocomplete="off">
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
                        <input type="text" name="valor" inputmode="numeric" data-pesos placeholder="$ 0" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>Vence (CDT)</span>
                        <input type="date" name="vence"></label>
                </div>
                <button type="submit" class="boton boton-principal boton-ancho">Agregar fuente</button>
            </form>
        </section>`;
}
