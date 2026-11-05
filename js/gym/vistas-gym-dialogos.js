// vistas-gym-dialogos.js — Las ventanas y piezas del Gimnasio: calentar, cambiar o saltar un ejercicio, la calculadora
// de discos, corregir una sesión, «¿Continuar el entrenamiento?» y editar tus rutinas (plantillas, elegir ejercicios).
//
// Salió de vistas-gym.js (que las usa y reexporta las públicas). Solo convierte la partida en HTML.

import * as gym from "./gym.js";
import * as plantillas from "./rutinas-plantillas.js";
import { describirMaestro } from "../maestro.js";
import { figuraPixel, escenaEjercicio } from "../dibujo/retratos.js";
import { plural } from "../juego.js";
import { esc } from "../pantallas/vistas-comun.js";
import { fechaCorta } from "../fechas.js";
import { barra, kilos, cabezaDeAurelio } from "./vistas-gym-tarjetas.js";


// ===== (v166) Calentar, cambiar y saltar un ejercicio; la calculadora de discos y corregir una sesión =====

// Los botones de un ejercicio que aún no empiezas: una serie de calentamiento (+ quitarla), cambiarlo y saltarlo.
// conTexto: en la lista llevan nombre; en el modo foco solo el ícono (no hay espacio).
export function botonesDeEjercicio(indice, ej, conTexto) {
    const caliente = (ej.series.filter((x) => x.cal).length);
    const sobra = ej.series.some((x) => x.cal && !x.hecha);
    const boton = (accion, icono, texto, etiqueta, desactivado = false) => `<button type="button" class="boton boton-chico boton-secundario ${conTexto ? "" : "gym-boton-icono"}" data-accion="${accion}" data-ej="${indice}" aria-label="${etiqueta}" ${desactivado ? "disabled" : ""}>${icono}${conTexto ? ` ${texto}` : ""}</button>`;
    return `<span class="gym-ej-botones">
        ${boton("gym-calentar-ej", "🔥", "+ calentamiento", "Agregar una serie de calentamiento", caliente >= gym.MAX_CALENTAMIENTOS)}
        ${sobra ? boton("gym-calentar-quitar", "↩️", "quitar calentamiento", "Quitar una serie de calentamiento") : ""}
        ${boton("gym-cambiar", "🔄", "cambiar", "Cambiar este ejercicio por otro")}
        ${boton("gym-saltar", "⏭️", "saltar", "Saltar este ejercicio")}
    </span>`;
}

// «La máquina está ocupada»: elegir otro ejercicio, solo del mismo músculo.
export function dialogoCambiarEjercicio(estado, indice) {
    const en = estado.gym.encurso;
    const info = gym.ejercicioPorId(en.ejercicios[indice].id);
    const usados = en.ejercicios.map((x) => x.id);
    const orden = [info.musculo];
    const grupos = orden.map((m) => {
        const lista = gym.CATALOGO.filter((x) => x.musculo === m && !usados.includes(x.id));
        if (!lista.length) return "";
        return `<p class="mini texto-suave">${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}${m === info.musculo ? " · el mismo músculo" : ""}</p>
                <div class="gym-extras">${lista.map((x) => `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-cambiar-a" data-ej="${indice}" data-ejercicio="${x.id}">${esc(x.nombre)}</button>`).join("")}</div>`;
    }).join("");
    return `
        <div class="formulario">
            <h2 class="titulo-juego">🔄 Cambiar ejercicio</h2>
            <p class="nota">Cambia <b>${esc(info.nombre)}</b> por otro solo en este entrenamiento. Tus rutinas no se tocan.</p>
            <div class="gym-dialogo-lista">${grupos}</div>
            <div class="botones-dialogo"><button type="button" class="boton boton-secundario" data-accion="gym-cerrar-dialogo">Cancelar</button></div>
        </div>`;
}

// La calculadora de discos: la barra y los discos de cada lado para llegar a ese peso.
const COLOR_DE_DISCO = { 25: "#ef4444", 20: "#3b82f6", 15: "#eab308", 10: "#22c55e", 5: "#e5e7eb", 2.5: "#a78bfa", 1.25: "#94a3b8" };
const ALTO_DE_DISCO = { 25: 74, 20: 66, 15: 58, 10: 48, 5: 38, 2.5: 30, 1.25: 24 };
export function dialogoDiscos(estado, kg) {
    const barra = estado.gym.barra || 20;
    const r = gym.discosPara(kg, barra);
    const discos = r.porLado.flatMap((d) => Array.from({ length: d.n }, () => d.kg));
    const dibujo = `<div class="gym-barra" role="img" aria-label="Discos de cada lado">
            <span class="gym-barra-tubo"></span>
            ${discos.map((d) => `<i class="gym-disco" style="height: ${ALTO_DE_DISCO[d] || 30}px; background: ${COLOR_DE_DISCO[d] || "#94a3b8"}" title="${kilos(d)}"></i>`).join("")}
        </div>`;
    const texto = r.pocoPeso ? `<p class="nota">Ese peso es menos que la barra sola (${kilos(barra)}).</p>`
        : !r.porLado.length ? `<p class="nota">Solo la barra (${kilos(barra)}).</p>`
        : `<p class="gym-discos-lista">Por lado: <b>${r.porLado.map((d) => `${d.n > 1 ? `${d.n} × ` : ""}${kilos(d.kg)}`).join(" + ")}</b></p>`;
    const aviso = r.falta > 0 ? `<p class="nota gym-pista-estancado">Con discos de 1,25 kg o más no se forma justo: quedan ${kilos(r.falta)} sin poner.</p>` : "";
    const barras = gym.BARRAS.map((b) => `<button type="button" class="boton boton-chico ${b === barra ? "boton-principal" : "boton-secundario"}" data-accion="gym-barra" data-barra="${b}" aria-pressed="${b === barra}">${b} kg</button>`).join("");
    const ajuste = (delta) => `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-discos-ajuste" data-delta="${delta}">${delta > 0 ? "+" : "−"} ${String(Math.abs(delta)).replace(".", ",")}</button>`;
    return `
        <div class="formulario">
            <h2 class="titulo-juego">🧮 Calculadora de discos</h2>
            <p class="gym-discos-total"><b>${kilos(kg)}</b> en total</p>
            <div class="gym-vista-botones">${[-10, -2.5, 2.5, 10].map(ajuste).join("")}</div>
            ${dibujo}
            ${texto}${aviso}
            <p class="mini texto-suave">Tu barra pesa:</p>
            <div class="gym-vista-botones">${barras}</div>
            <div class="botones-dialogo"><button type="button" class="boton boton-principal" data-accion="gym-cerrar-dialogo">Listo</button></div>
        </div>`;
}

// Corregir el peso y las repeticiones de una sesión ya guardada.
export function dialogoCorregirSesion(estado, indice) {
    const sesion = estado.gym.sesiones[indice];
    const rutina = gym.rutinaPorId(sesion.rutina);
    const ejercicios = sesion.ejercicios.map((ej, ei) => {
        const info = gym.ejercicioPorId(ej.id);
        const filas = ej.series.map((x, si) => `
            <div class="gym-corregir-fila">
                <span class="gym-n">${si + 1}</span>
                <label><span>kg</span><input type="text" inputmode="decimal" name="k-${ei}-${si}" value="${String(x.kg).replace(".", ",")}" aria-label="Peso de la serie ${si + 1}"></label>
                <label><span>reps</span><input type="number" inputmode="numeric" step="1" min="1" max="${gym.MAX_REPS}" name="r-${ei}-${si}" value="${x.reps}" aria-label="Repeticiones de la serie ${si + 1}"></label>
            </div>`).join("");
        return `<h3 class="gym-corregir-nombre">${esc(info?.nombre || ej.id)}</h3>${filas}`;
    }).join("");
    return `
        <form data-form="gym-corregir" class="formulario">
            <h2 class="titulo-juego">✏️ Corregir sesión</h2>
            <p class="nota">${rutina?.icono || "🏋️"} ${esc(rutina?.nombre || "")} · ${fechaCorta(sesion.fecha)}. Al guardar se recalculan el XP, las monedas y los récords de esta sesión.</p>
            <input type="hidden" name="indice" value="${indice}">
            <div class="gym-dialogo-lista">${ejercicios}</div>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="gym-cerrar-dialogo">Cancelar</button>
                <button type="submit" class="boton boton-principal">Guardar</button>
            </div>
        </form>`;
}

// (v165) El símbolo que Aurelio lleva sobre la cabeza según lo que acaba de pasar (sin símbolo = una serie cualquiera).
const EMOTE_DE_FRASE = { record: "❗", ejercicio: "⭐", ejercicioFinal: "⭐", ultima: "🔥", fin: "⭐", marcado: "⭐", mitad: "🔥", primera: "💪", calentado: "🔥", inicio: "👋" };


// (v165) Aurelio de cuerpo entero en la escena del modo foco, abajo a la izquierda: llega caminando al empezar y reacciona
// a lo que haces (app-gym.js › animarAurelio le pone la animación solo cuando algo nuevo pasa). Mientras descansas lleva el
// símbolo de la última frase y habla con su globo al lado.
export function figuraDeAurelio(ctx, descansando) {
    const emote = descansando && ctx.fraseGym ? EMOTE_DE_FRASE[ctx.fraseGym.tipo] || "" : "";
    // (v165) Dos dibujos: el de pie y el de la victoria (bastón en alto), que solo se ve un momento al ganar algo.
    return `<div class="gym-foco-aurelio" data-aurelio-figura aria-hidden="true"><div class="gym-aurelio-cuerpo">
                <div class="gym-aurelio-de-pie">${figuraPixel(describirMaestro())}</div>
                <div class="gym-aurelio-pose">${figuraPixel(describirMaestro(), { pose: "victoria" })}</div>
            </div>${emote ? `<span class="gym-aurelio-emote" data-aurelio-emote>${emote}</span>` : ""}</div>`;
}

// Lo que dice Aurelio (entre serie y serie, al empezar, al calentar…). ctx.fraseGym = { tipo, texto } o null.
// (v165) El texto lleva data-aurelio-texto: app-gym.js lo escribe letra por letra la primera vez que sale.
export function burbujaDeAurelio(ctx) {
    if (!ctx.fraseGym) return "";
    return `<div class="gym-aurelio" role="status">
                ${cabezaDeAurelio(EMOTE_DE_FRASE[ctx.fraseGym.tipo] || "")}
                <p><b>Aurelio</b><span class="gym-aurelio-texto" data-aurelio-texto>${esc(ctx.fraseGym.texto)}</span></p>
            </div>`;
}

// El resumen del entrenamiento que acabas de terminar (hasta que cambies de pantalla).
export function tarjetaResumen(estado, ctx) {
    const s = ctx.resumenGym;
    const r = gym.rutinaPorId(s.rutina);
    if (!r) return "";
    const series = s.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    const kg = Math.round(gym.volumenDe(s));
    const musculos = [...new Set(s.ejercicios.map((ej) => gym.ejercicioPorId(ej.id)?.musculo).filter(Boolean))];
    return `
        <section class="panel gym-resumen">
            <p class="etiqueta">🏁 ${s.rapido ? "Meta del día cumplida" : "Entrenamiento terminado"}</p>
            <h2 class="titulo-juego">${r.icono} ${esc(r.nombre)}</h2>
            <ul class="gym-chips">
                ${s.rapido ? "" : `<li>⏱️ <b>${s.minutos || 1}</b> min</li><li>🔥 <b>${series}</b> series</li>${kg ? `<li>🏋️ <b>${kg.toLocaleString("es")}</b> kg</li>` : ""}`}
                <li>💪 +<b>${s.xp}</b> XP</li>
                ${s.records.length ? `<li>📈 <b>${s.records.length}</b> ${s.records.length === 1 ? "récord" : "récords"}</li>` : ""}
            </ul>
            ${musculos.length ? `<p class="mini texto-suave">Trabajaste: ${musculos.map((m) => `${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}`).join(" · ")}</p>` : ""}
            ${ctx.fraseGym ? burbujaDeAurelio(ctx) : ""}
            ${notaDeLaSesion(estado, s)}
        </section>`;
}

// (v164) La nota de la sesión: cómo dormiste (un toque) y una línea de molestias o dolor. Alimenta el Diario del gym.
function notaDeLaSesion(estado, resumen) {
    const s = estado.gym.sesiones.find((x) => x.fecha === resumen.fecha && x.rutina === resumen.rutina);
    if (!s) return "";
    const nota = s.nota || {};
    const datos = `data-fecha="${s.fecha}" data-rutina="${esc(s.rutina)}"`;
    const suenos = Object.entries(gym.SUENOS).map(([clave, x]) => `
        <button type="button" class="boton boton-chico ${nota.sueno === clave ? "boton-principal" : "boton-secundario"}" data-accion="gym-nota-sueno" ${datos} data-sueno="${clave}" aria-pressed="${nota.sueno === clave}">${x.icono} ${x.nombre}</button>`).join("");
    return `
        <div class="gym-nota">
            <p class="mini texto-suave">📓 Nota para tu diario (opcional): ¿cómo dormiste anoche?</p>
            <div class="gym-vista-botones">${suenos}</div>
            <form data-form="gym-nota" class="form-linea">
                <input type="hidden" name="fecha" value="${s.fecha}"><input type="hidden" name="rutina" value="${esc(s.rutina)}">
                <input type="text" name="texto" maxlength="${gym.MAX_NOTA}" value="${esc(nota.texto || "")}" placeholder="Molestias o dolor (ej.: me molestó el hombro)" aria-label="Molestias o dolor">
                <button type="submit" class="boton boton-chico">${nota.texto ? "Cambiar" : "Guardar"}</button>
            </form>
        </div>`;
}

// Los ejercicios extra que aún no están en el entrenamiento, agrupados por músculo.
export function ejerciciosExtra(en) {
    const disponibles = gym.CATALOGO.filter((x) => !en.ejercicios.some((y) => y.id === x.id));
    if (!disponibles.length) return "";
    const porMusculo = {};
    for (const x of disponibles) (porMusculo[x.musculo] ||= []).push(x);
    const grupos = Object.entries(porMusculo).map(([m, lista]) => `
        <p class="mini texto-suave">${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}</p>
        <div class="gym-extras">${lista.map((x) => `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-extra" data-ejercicio="${x.id}">+ ${esc(x.nombre)}</button>`).join("")}</div>`).join("");
    return `<details class="plegable"><summary>➕ Ejercicio extra</summary>${grupos}</details>`;
}

// ===== (v164) «¿Continuar el entrenamiento?»: lo que sale al abrir la app con un entrenamiento a medias =====
export function dialogoSeguirGym(estado, hoyTexto) {
    const en = estado.gym.encurso;
    const r = gym.rutinaPorId(en.rutina);
    const total = gym.seriesTotales(en);
    const cuando = en.fecha === hoyTexto ? "de hoy" : `del ${fechaCorta(en.fecha)}`;
    // (v173) Uno abierto desde hace mucho (más de 12 h) se quedó colgado: se ofrece terminarlo (si ya anotaste algo) o descartarlo.
    if (gym.entrenamientoViejo(en)) {
        const hechas = gym.seriesMarcadas(en);
        return `
        <div class="formulario">
            <h2 class="titulo-juego">🏋️ Entrenamiento sin cerrar</h2>
            <p>Tienes abierto el entrenamiento ${cuando}: <b>${r.icono} ${esc(r.nombre)}</b>, con ${hechas} de ${total} series hechas.
               ¿Lo terminas o lo descartas?</p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="gym-descartar">Descartar</button>
                ${hechas > 0 ? '<button type="button" class="boton boton-secundario" data-accion="gym-terminar-viejo">🏁 Terminar</button>' : ""}
                <button type="button" class="boton boton-principal" data-accion="gym-continuar">▶ Continuar</button>
            </div>
        </div>`;
    }
    return `
        <div class="formulario">
            <h2 class="titulo-juego">🏋️ ¿Continuar el entrenamiento?</h2>
            <p>Dejaste a medias el entrenamiento ${cuando}: <b>${r.icono} ${esc(r.nombre)}</b>, con ${gym.seriesMarcadas(en)} de ${total} series hechas.
               Todo lo que anotaste está guardado.</p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="gym-descartar">Descartar</button>
                <button type="button" class="boton boton-principal" data-accion="gym-continuar">▶ Continuar</button>
            </div>
        </div>`;
}

// ===== (v160) Editar tus rutinas: cambiar, agregar, quitar y reordenar ejercicios, y las series de cada uno =====
// (v177) Crear rutinas desde una plantilla: eliges la plantilla y el objetivo (déficit, mantener o aumento), ves qué rutinas
// se crean (con sus ejercicios y series) y las creas con un botón. sel = { plantilla, objetivo, sugerencia (el objetivo que
// va con tu peso objetivo, o null) }
export function dialogoPlantilla(estado, sel) {
    const g = estado.gym;
    const plantilla = plantillas.PLANTILLAS.find((p) => p.id === sel.plantilla);
    const rutinas = plantillas.armarPlantilla(sel.plantilla, sel.objetivo);
    const chip = (atributo, valor, texto, activo) => `<button type="button" class="boton boton-chico ${activo ? "boton-principal" : "boton-secundario"}" data-accion="gym-plantilla-elegir" data-${atributo}="${valor}" aria-pressed="${activo}">${texto}</button>`;
    const botonesPlantilla = plantillas.PLANTILLAS.map((p) => chip("plantilla", p.id, `${p.icono} ${esc(p.nombre)}`, p.id === sel.plantilla)).join("");
    const botonesObjetivo = Object.entries(plantillas.OBJETIVOS).map(([clave, o]) => chip("objetivo", clave, `${o.icono} ${o.nombre}`, clave === sel.objetivo)).join("");
    const objetivo = plantillas.OBJETIVOS[sel.objetivo];
    const filas = rutinas.map((r) => `
        <li class="gym-plantilla-rutina">
            <b>${r.icono} ${esc(r.nombre)}</b> <small class="texto-suave">${plural(r.ejercicios.length, "ejercicio", "ejercicios")} · ${r.ejercicios.reduce((suma, x) => suma + x.series, 0)} series</small>
            <small class="texto-suave gym-plantilla-lista">${r.ejercicios.map((x) => `${esc(gym.ejercicioPorId(x.id).nombre)} (${x.series})`).join(" · ")}</small>
        </li>`).join("");
    const usadas = g.copias?.length || 0;
    const cabe = usadas + rutinas.length <= gym.MAX_COPIAS;
    return `
        <div class="formulario gym-plantilla">
            <h2 class="titulo-juego">📚 Nueva rutina desde una plantilla</h2>
            <p class="nota">Elige un plan y tu objetivo. Se agregan en «Mis copias y plantillas»: tus rutinas de ahora no se tocan y después cambias lo que quieras.</p>
            <p class="mini texto-suave">Plan</p>
            <div class="gym-plantilla-chips" role="group" aria-label="Plan">${botonesPlantilla}</div>
            <p class="nota">${esc(plantilla.texto)} <span class="texto-suave">(${esc(plantilla.dias)})</span></p>
            <p class="mini texto-suave">Objetivo${sel.sugerencia && sel.objetivo === sel.sugerencia ? " · sugerido por tu peso objetivo" : ""}</p>
            <div class="gym-plantilla-chips" role="group" aria-label="Objetivo">${botonesObjetivo}</div>
            <p class="nota">${esc(objetivo.texto)}</p>
            <p class="mini texto-suave">Se crean ${plural(rutinas.length, "rutina", "rutinas")} (entre paréntesis, las series):</p>
            <ul class="gym-plantilla-rutinas">${filas}</ul>
            ${cabe ? "" : `<p class="nota">⚠️ Solo caben ${gym.MAX_COPIAS} copias en total y ya tienes ${usadas}: borra alguna para crear ésta.</p>`}
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="gym-cerrar-dialogo">Cancelar</button>
                <button type="button" class="boton boton-principal" data-accion="gym-plantilla-crear" ${cabe ? "" : "disabled"}>✅ Crear ${plural(rutinas.length, "rutina", "rutinas")}</button>
            </div>
        </div>`;
}

// (v176) Elegir o cambiar un ejercicio de una rutina VIENDO su figura: arriba la animación del que tocaste, debajo los
// músculos (chips) y los ejercicios de ese músculo. Tocar uno lo muestra; «Usar este» lo pone en la rutina.
// sel = { modo: "cambiar" | "agregar", rutina, viejo (id o null), musculo, elegido (id) }
export function dialogoElegirEjercicio(estado, ctx, sel) {
    const rutina = gym.rutinaPorId(sel.rutina);
    const info = gym.ejercicioPorId(sel.elegido);
    const musculo = gym.MUSCULOS[info.musculo];
    const viejo = sel.viejo ? gym.ejercicioPorId(sel.viejo) : null;
    const sinMovimiento = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lista = gym.ejerciciosParaElegir(sel.rutina, sel.musculo, sel.viejo);
    const chips = Object.entries(gym.MUSCULOS).map(([clave, m]) => `
        <button type="button" class="boton boton-chico ${clave === sel.musculo ? "boton-principal" : "boton-secundario"}" data-accion="gym-elegir-musculo" data-musculo="${clave}" aria-pressed="${clave === sel.musculo}">${m.icono} ${m.nombre}</button>`).join("");
    const botones = lista.map((x) => `
        <button type="button" class="boton boton-chico ${x.id === sel.elegido ? "boton-principal" : "boton-secundario"}" data-accion="gym-elegir-ver" data-ejercicio="${x.id}" aria-pressed="${x.id === sel.elegido}">${esc(x.nombre)}${x.id === sel.viejo ? " · actual" : ""}</button>`).join("");
    const esElActual = sel.modo === "cambiar" && sel.elegido === sel.viejo;
    const boton = sel.modo === "agregar" ? "➕ Agregar a la rutina" : esElActual ? "Es el ejercicio actual" : `🔄 Cambiar por este`;
    return `
        <div class="formulario gym-elegir">
            <h2 class="titulo-juego">${sel.modo === "agregar" ? "➕ Agregar ejercicio" : "🔄 Cambiar ejercicio"}</h2>
            <p class="nota">${sel.modo === "agregar"
                ? `Se agrega a <b>${esc(rutina.nombre)}</b>.`
                : `En <b>${esc(rutina.nombre)}</b>: cambias <b>${esc(viejo.nombre)}</b> por otro. Tus entrenamientos anteriores no se tocan.`}</p>
            <div class="gym-elegir-demo" aria-hidden="true">${escenaEjercicio(gym.movimientoDe(info.id), ctx.avatar.apariencia, { animar: !sinMovimiento, fisico: ctx.avatar.fisico || 0, cuadro: 5 })}</div>
            <h3 class="gym-elegir-nombre">${musculo.icono} ${esc(info.nombre)}</h3>
            <p class="mini texto-suave">${info.series} × ${info.min}–${info.max} reps · ${musculo.nombre}</p>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="gym-elegir-usar" ${esElActual ? "disabled" : ""}>${boton}</button>
            <div class="gym-elegir-musculos" role="group" aria-label="Músculo">${chips}</div>
            <div class="gym-extras gym-elegir-lista">${botones || '<p class="nota">Ya tienes en la rutina todos los ejercicios de este músculo.</p>'}</div>
            <div class="botones-dialogo"><button type="button" class="boton boton-secundario" data-accion="gym-cerrar-dialogo">Cancelar</button></div>
        </div>`;
}

// (v162) Cuántas series por músculo dejan tus rutinas en una semana: así ves si alguna parte se queda sin trabajar.
function tarjetaVolumenPlaneado() {
    const series = gym.seriesPlaneadasPorMusculo();
    const filas = Object.entries(gym.MUSCULOS).map(([clave, m]) => {
        const n = series[clave];
        return `
            <li class="gym-musculo">
                <span class="gym-musculo-nombre">${m.icono} ${m.nombre}</span>
                <span class="gym-musculo-nivel">${n} series · ${gym.valoracionDeVolumen(n)}</span>
                ${barra(Math.min(100, (n / 20) * 100), "barra-gym")}
            </li>`;
    }).join("");
    // (v175) Plegada: es de consulta, no de todos los días. En el título se ve de un vistazo si algún músculo queda corto.
    const porReforzar = Object.keys(gym.MUSCULOS).filter((m) => ["nada", "poco"].includes(gym.valoracionDeVolumen(series[m]))).length;
    return `
        <details class="panel plegable">
            <summary>📊 Series por músculo a la semana${porReforzar ? ` <span class="texto-suave">· ⚠️ ${porReforzar} por reforzar</span>` : ""}</summary>
            <p class="nota">Si haces cada rutina una vez a la semana. Entre 10 y 20 series por músculo es un buen punto de partida.</p>
            <ul class="gym-musculos">${filas}</ul>
        </details>`;
}

export function tarjetaEditarRutinas(estado) {
    const g = estado.gym;
    if (g.encurso) return '<p class="vacio">Termina o cancela tu entrenamiento para editar tus rutinas.</p>';
    const tarjetaDe = (r) => {
        const musculos = [...new Set(r.ejercicios.map((x) => gym.MUSCULOS[x.musculo].nombre))].join(" · ");
        const filas = r.ejercicios.map((x, i) => `
            <li class="gym-editar-fila">
                <button type="button" class="gym-editar-nombre" data-accion="gym-rutina-elegir" data-rutina="${r.id}" data-ejercicio="${x.id}" aria-label="Ver o cambiar ${esc(x.nombre)}">
                    <small class="texto-suave">${gym.MUSCULOS[x.musculo].icono} ${gym.MUSCULOS[x.musculo].nombre} · ${x.min}–${x.max} reps</small>
                    <b>${esc(x.nombre)}</b>
                    <span class="gym-editar-ver">👁️ Ver · 🔄 Cambiar</span>
                </button>
                <span class="gym-editar-botones">
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-series" data-rutina="${r.id}" data-ejercicio="${x.id}" data-delta="-1" ${x.series <= 1 ? "disabled" : ""} aria-label="Una serie menos">−</button>
                    <b>${x.series}<small> series</small></b>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-series" data-rutina="${r.id}" data-ejercicio="${x.id}" data-delta="1" ${x.series >= gym.MAX_SERIES ? "disabled" : ""} aria-label="Una serie más">+</button>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-mover" data-rutina="${r.id}" data-ejercicio="${x.id}" data-delta="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">▲</button>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-mover" data-rutina="${r.id}" data-ejercicio="${x.id}" data-delta="1" ${i === r.ejercicios.length - 1 ? "disabled" : ""} aria-label="Bajar">▼</button>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-quitar" data-rutina="${r.id}" data-ejercicio="${x.id}" ${r.ejercicios.length <= 1 ? "disabled" : ""} aria-label="Quitar">✕</button>
                </span>
            </li>`).join("");
        return `
        <details class="panel plegable">
            <summary>${r.icono} <b>${esc(r.nombre)}</b>${r.copia ? "" : g.rutinas?.[r.id] ? " <span class=\"texto-suave\">✏️ editada</span>" : ""}
                <small class="texto-suave gym-rutina-resumen">${plural(r.ejercicios.length, "ejercicio", "ejercicios")} · ${gym.seriesPlaneadas(r)} series · ${musculos}</small></summary>
            <ul class="gym-editar">${filas}</ul>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-chico boton-principal" data-accion="gym-rutina-nuevo" data-rutina="${r.id}" ${r.ejercicios.length >= 12 ? "disabled" : ""}>➕ Agregar ejercicio</button>
                ${r.copia ? "" : g.rutinas?.[r.id] ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-restaurar" data-rutina="${r.id}">↩ Volver a la de fábrica</button>` : ""}
                <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-duplicar" data-rutina="${r.id}" ${(g.copias?.length || 0) >= gym.MAX_COPIAS ? "disabled" : ""}>📋 Duplicar rutina</button>
                ${r.copia ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rutina-borrar-copia" data-rutina="${r.id}">🗑️ Borrar copia</button>` : ""}
            </div>
        </details>`;
    };
    // (v175) Orden de la pestaña: lo que usas (tus rutinas), tus copias aparte y, plegado al final, el volumen por músculo.
    const principales = gym.RUTINA.filter((r) => !r.copia).map(tarjetaDe).join("");
    const copias = gym.RUTINA.filter((r) => r.copia).map(tarjetaDe).join("");
    return `
        <p class="nota gym-rutinas-nota">✏️ Toca una rutina para cambiar sus ejercicios, series u orden. Tu historial y tus récords no se tocan.</p>
        <button type="button" class="boton boton-principal boton-ancho gym-rutinas-plantilla" data-accion="gym-plantilla-abrir">📚 Nueva rutina desde una plantilla</button>
        <details class="plegable gym-rutinas-ayuda">
            <summary>¿Cómo funciona?</summary>
            <p class="nota">En cada ejercicio eliges otro (de su músculo o de cualquiera), agregas más, quitas, reordenas o cambias las series.
               Con «📋 Duplicar rutina» pruebas una variante sin tocar la original: la copia no cambia a cuál le toca entrenar hoy.</p>
        </details>
        <h3 class="gym-rutinas-titulo">Rutinas de la semana</h3>
        ${principales}
        <h3 class="gym-rutinas-titulo">📋 Mis copias y plantillas <small class="texto-suave">${g.copias?.length || 0} de ${gym.MAX_COPIAS}</small></h3>
        ${copias || '<p class="nota">Aún no tienes ninguna. Crea rutinas con una plantilla, o abre una rutina y toca «📋 Duplicar rutina» para probar una variante.</p>'}
        ${tarjetaVolumenPlaneado()}`;
}
