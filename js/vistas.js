// vistas.js — Convierte la partida en HTML.
//
// Cada función recibe el estado y devuelve un texto con HTML.
// app.js pone ese texto dentro de la pantalla que corresponde.
// Aquí no se cambia nada de la partida: solo se "dibuja".
//
// Los botones llevan atributos data-accion="..." y data-id="...".
// app.js escucha los toques y, según data-accion, sabe qué hacer.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as desafios from "./desafios.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as leyendas from "./leyendas.js";
import * as habilidades from "./habilidades.js";
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as pacto from "./pacto.js";
import * as libro from "./libro.js";
import * as maestro from "./maestro.js";
import * as memorias from "./memorias.js";
import * as pergamino from "./pergamino.js";
import * as pergaminos from "./pergaminos.js";
import * as libros from "./libros.js";
import * as libroCasio from "./libro-casio.js";
import * as saga from "./saga.js";
import * as rituales from "./rituales.js";
import * as mapa from "./mapa.js";
import * as cronica from "./cronica.js";
import * as mascota from "./mascota.js";
import * as equipo from "./equipo.js";
import { precioConEvento } from "./eventos.js";
import { rutaPintura } from "./pinturas.js";
import { dibujarAvatar, dibujarMascota, dibujarObjeto, dibujarEscenario } from "./dibujo.js";
import { calcularResumen, resumenSemana } from "./resumen.js";
import * as resumen from "./resumen.js";
import * as retos from "./retos.js";
import * as voces from "./voces.js";
import { tarjetaGymHoy } from "./vistas-gym.js";
import * as ataques from "./ataques.js";
import * as gymReglas from "./gym.js";
import { fechaLegible, fechaCorta, MESES_CORTOS, DIAS_LETRAS, DIAS_CORTOS, desdeTexto, diaDeSemana,
         diasEntre, lunesDe, relojTexto, relojLargo, sumarDias, MESES, hoy as fechaDeHoy } from "./fechas.js";

const { DIFICULTADES, ATRIBUTOS, PREMIOS, ESCUDOS, ANIMOS_DIARIO, plural } = juego;


// ===== Ayudantes =====

// "Escapa" el texto escrito por el usuario para que no se interprete como HTML.
// Ej: si una misión se llama "<b>gym</b>", se muestra tal cual y no en negrita.
export function esc(texto) {
    const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto).replace(/[&<>"']/g, (letra) => reemplazos[letra]);
}

// Íconos dibujados con SVG (líneas simples).
export const ICONOS = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    editar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/></svg>',
};

function barra(porcentaje, clase = "") {
    return `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;
}

function vacio(texto) {
    return `<p class="vacio">${texto}</p>`;
}

// Las secciones de una pantalla larga, como pestañas pequeñas arriba (solo se ve una a la vez).
// opciones = [[clave, texto], …]. Se queda pegado bajo la cabecera al bajar.
function selectorSecciones(pantalla, opciones, actual) {
    return `
        <div class="selector selector-secciones" role="group" aria-label="Secciones">
            ${opciones.map(([clave, texto]) => `<button type="button" data-accion="subvista" data-pantalla="${pantalla}"
                data-vista="${clave}" aria-pressed="${clave === actual}">${texto}</button>`).join("")}
        </div>`;
}

// El título de una pantalla sin pestaña propia, con el botón para volver a la que la abrió.
function encabezado(titulo, padre, nombrePadre) {
    return `
        <div class="titulo-seccion encabezado">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="${padre}">‹ ${nombrePadre}</button>
        </div>`;
}

function cabeceraSeccion(titulo, dialogo, textoBoton) {
    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="${dialogo}">${textoBoton}</button>
        </div>`;
}

// info = { icono, nombre, color }: uno de los 4, o uno tuyo (ver juego.infoAtributo).
function chipAtributo(clave, info = ATRIBUTOS[clave]) {
    return `<span class="chip-atributo" style="--color-atributo: ${info.color}">${esc(info.icono)} ${esc(info.nombre)}</span>`;
}

function botonEditar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.editar}</button>`;
}

function botonCerrar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.cerrar}</button>`;
}

// Píldoras para elegir un atributo en un formulario: los 4 y después los tuyos
// (su valor es "propio:5"). Las usan todas las ventanas que piden un atributo.
export function pildorasAtributo(estado, elegido) {
    const opciones = [
        ...Object.entries(ATRIBUTOS).map(([clave, a]) => ({ valor: clave, ...a })),
        ...estado.atributosPropios.map((p) => ({ valor: juego.clavePropio(p.id), icono: p.icono, nombre: p.nombre, color: p.color })),
    ];
    return opciones.map((o) => `
        <label class="pildora" style="--color-dificultad: ${o.color}">
            <input type="radio" name="atributo" value="${o.valor}" ${o.valor === elegido ? "checked" : ""}>
            <span><b class="pildora-icono">${esc(o.icono)}</b><small>${esc(o.nombre)}</small></span>
        </label>`).join("");
}

// Ficha con un número grande (las usan el resumen y la tarjeta «Tu semana»).
function ficha(etiqueta, valor, nota) {
    return `<div class="ficha-dato"><span class="ficha-etiqueta">${etiqueta}</span><span class="ficha-valor">${valor}</span>${nota}</div>`;
}

// Cambio frente al periodo anterior, con flecha y texto (no solo color).
function textoCambio(valor, unidad, periodo) {
    if (valor === null) return `<span class="ficha-nota">Aún no hay un periodo anterior completo para comparar</span>`;
    if (valor === 0) return `<span class="ficha-nota">Igual que ${periodo}</span>`;
    const sube = valor > 0;
    return `<span class="ficha-nota">${sube ? "▲" : "▼"} ${Math.abs(valor)} ${unidad} ${sube ? "más" : "menos"} que ${periodo}</span>`;
}


// (v51) Agrupa misiones o tareas por atributo, con un título de color para cada uno (los base primero y luego los tuyos).
// `hecha(x)` dice si ya está hecha, para mostrar «2/3» en el título.
function agruparPorAtributo(estado, elementos, tarjeta, hecha) {
    const grupos = new Map();
    for (const e of elementos) {
        const clave = e.atributoPropio ? juego.clavePropio(e.atributoPropio) : e.atributo;
        if (!grupos.has(clave)) grupos.set(clave, { info: juego.infoAtributo(estado, e.atributo, e.atributoPropio), lista: [] });
        grupos.get(clave).lista.push(e);
    }
    const orden = [...Object.keys(ATRIBUTOS), ...estado.atributosPropios.map((p) => juego.clavePropio(p.id))];
    return [...grupos.entries()].sort((x, y) => orden.indexOf(x[0]) - orden.indexOf(y[0])).map(([, g]) => `
        <h3 class="subtitulo subtitulo-atributo" style="--color-attr: ${g.info.color}">
            <span>${esc(g.info.icono)} ${esc(g.info.nombre)}</span><small>${g.lista.filter(hecha).length}/${g.lista.length}</small></h3>
        <ul class="lista lista-atributo" style="--color-attr: ${g.info.color}">${g.lista.map(tarjeta).join("")}</ul>`).join("");
}

// ===== Pantalla: Hoy =====

export function pantallaHoy(estado, ctx) {
    // ctx.fechaVista es hoy o ayer (por si olvidaste marcar algo ayer).
    const fecha = ctx.fechaVista;
    const esAyer = fecha !== ctx.hoy;
    const hechasEseDia = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));

    const delDia = juego.misionesDelDia(estado.misiones, fecha);           // las que tocan ese día
    const semanales = juego.semanalesDelDia(estado.misiones, fecha);       // las de «N veces por semana»
    const otrosDias = estado.misiones.filter((m) => !m.archivadaEn && !delDia.includes(m) && !semanales.includes(m));
    const archivadas = estado.misiones.filter((m) => m.archivadaEn);
    const hechas = delDia.filter((m) => hechasEseDia.has(m.id)).length;
    const todoListo = delDia.length > 0 && hechas === delDia.length;
    const sinMisiones = estado.misiones.every((m) => m.archivadaEn);
    const tarjeta = (m) => tarjetaMision(m, estado, fecha, hechasEseDia.has(m.id), ctx.recienHecha === m.id);
    const agruparPor = ctx.agruparHoy || "atributo";

    let lista = "";
    if (delDia.length) {
        // (v51) Por defecto se agrupan por atributo (💪 Fuerza, 🧠 Intelecto…); también se pueden agrupar por momento del día.
        if (agruparPor === "momento") {
            const grupos = juego.agruparPorMomento(delDia);
            lista = grupos.length > 1 || grupos[0].clave
                ? grupos.map((g) => `<h3 class="subtitulo subtitulo-momento">${g.icono} ${g.nombre}</h3>
                                     <ul class="lista">${g.misiones.map(tarjeta).join("")}</ul>`).join("")
                : `<ul class="lista">${delDia.map(tarjeta).join("")}</ul>`;
        } else {
            lista = agruparPorAtributo(estado, delDia, tarjeta, (m) => hechasEseDia.has(m.id));
        }
    } else if (sinMisiones) {
        lista = vacio("Aún no tienes misiones diarias.<br>Crea tu primer hábito: ir al gym, leer, estudiar inglés…");
    } else if (!semanales.length) {
        lista = vacio(`${esAyer ? "Ayer fue" : "Hoy es"} día de descanso: no ${esAyer ? "tocaba" : "toca"} ninguna misión.<br>Tu racha no se rompe.`);
    }

    const activo = estado.enfoque.activo;
    const botonEnfoque = activo
        ? `⏱️ <span data-reloj>${relojTexto(juego.finDelEnfoque(activo) - ctx.ahora)}</span>`
        : "⏱️ Enfoque";

    // Modo esencial (v46, rehecho en la v48): solo tus misiones, en TRES grupos bien separados y de colores distintos para no
    // confundirlas: ⚔️ misiones diarias (hábitos que se repiten), 📌 tareas (de una sola vez) y 🎯 misiones importantes
    // (objetivos grandes con pasos). Se quitan tu héroe, «Tu día», los avisos, la semana y el diario. El aviso de la copia
    // de seguridad se queda.
    const esencial = Boolean(estado.ajustes.esencial);
    const tareasDeHoy = estado.tareas.filter((t) => !t.hechaEn && (!t.fecha || t.fecha <= ctx.hoy)).length;
    const importantes = estado.principales.filter((p) => !p.archivada && !p.completadaEn);
    // (v51) Hoy se divide en secciones y solo se ve una a la vez, para no saturar la pantalla (igual en todos los estados):
    // ⚔️ misiones diarias · 🗓️ metas de la semana · 📌 tareas · 🎯 misiones importantes · 📓 diario (solo fuera del modo esencial).
    const metasPendientes = semanales.filter((m) => juego.vecesEnSemana(estado.completadas, m.id, fecha) < m.veces).length;
    const secciones = [
        ["misiones", "⚔️", `${hechas}/${delDia.length}`, "Misiones", "diarias"],
        ["importantes", "🎯", importantes.length, "Principales", "importantes"],   // (v55) justo después de las misiones
        ["metas", "🗓️", `${semanales.length - metasPendientes}/${semanales.length}`, "Metas", "metas"],
        ["tareas", "📌", tareasDeHoy, "Tareas", "tareas"],
        ...(esencial ? [] : [["diario", "📓", estado.diario[ctx.hoy] ? "✓" : "·", "Diario", "diario"]]),
        // (v52) Aurelio: tu héroe, tus rivales y «Tu día». Solo fuera del modo esencial; desde la v54, la última pestaña.
        ...(esencial ? [] : [["aurelio", "🧙", ctx.maestro?.memorias?.sinLeer ? "•" : "", "Aurelio", "aurelio"]]),
    ];
    const vistaPedida = ctx.subvista?.hoy || "misiones";
    const vista = esAyer || !secciones.some((x) => x[0] === vistaPedida) ? "misiones" : vistaPedida;
    const pestanasHoy = esAyer ? "" : `
        <nav class="hoy-tabs" aria-label="Secciones de Hoy">
            ${secciones.map(([clave, icono, numero, nombre, color]) => `
                <button type="button" class="hoy-tab hoy-tab-${color}" data-accion="subvista" data-pantalla="hoy" data-vista="${clave}"
                        aria-pressed="${clave === vista}"><b>${icono}${numero === "" ? "" : ` ${numero}`}</b><small>${nombre}</small></button>`).join("")}
        </nav>`;
    // (v50) Botón grande arriba de Hoy: muestra cómo te sientes y abre la portada para cambiarlo.
    const animo = { mal: ["😔", "Mal", "solo lo esencial"], normal: ["🙂", "Normal", "sin Aventuras"], bien: ["😄", "Bien", "todo el menú"] }
        [estado.ajustes.animo] || ["🙂", "Normal", "sin Aventuras"];
    const botonAnimo = `<button type="button" class="boton-animo animo-${estado.ajustes.animo || "bien"}" data-accion="alternar-esencial">
            <span class="boton-animo-icono" aria-hidden="true">${animo[0]}</span>
            <span class="boton-animo-texto"><b>Hoy me siento: ${animo[1]}</b><small>Menú: ${animo[2]}</small></span>
            <span class="boton-animo-cambiar">Cambiar ›</span></button>`;

    // Contenido de la sección elegida.
    const herramientas = `
            <div class="hoy-herramientas">
                <div class="selector" role="group" aria-label="Día">
                    <button type="button" data-accion="ver-fecha" data-dia="ayer" aria-pressed="${esAyer}">Ayer</button>
                    <button type="button" data-accion="ver-fecha" data-dia="hoy" aria-pressed="${!esAyer}">Hoy</button>
                </div>
                ${esencial && !activo ? "" : `<button type="button" class="chip chip-enfoque ${activo ? "activo" : ""}" data-accion="ir" data-pantalla="enfoque">${botonEnfoque}</button>`}
            </div>
            <div class="selector selector-chico" role="group" aria-label="Agrupar por">
                <button type="button" data-accion="agrupar-hoy" data-grupo="atributo" aria-pressed="${agruparPor === "atributo"}">Por atributo</button>
                <button type="button" data-accion="agrupar-hoy" data-grupo="momento" aria-pressed="${agruparPor === "momento"}">Por momento</button>
            </div>`;
    const seccionMisiones = `
        <section class="bloque esencial-grupo esencial-diarias" aria-label="Misiones diarias">
            <div class="titulo-seccion">
                <div>
                    <p class="etiqueta">${fechaLegible(fecha)}</p>
                    <h2 class="titulo-juego">⚔️ Misiones diarias${esAyer ? " de ayer" : ""}</h2>
                </div>
                <p class="contador ${todoListo ? "completo" : ""}">${todoListo ? "✨" : ""}${hechas}/${delDia.length}</p>
            </div>
            ${todoListo ? '<p class="nota oro">✨ ¡Día perfecto! Todas las misiones hechas.</p>' : ""}
            ${herramientas}
            ${esAyer ? '<p class="nota">Estás viendo <b>ayer</b>. Marca lo que hiciste y se te olvidó anotar.</p>' : ""}
            ${lista}
            <div class="botones-dialogo botones-hoy">
                <button type="button" class="boton boton-principal" data-accion="abrir" data-dialogo="mision">+ Nueva misión</button>
                <button type="button" class="boton boton-secundario" data-accion="abrir" data-dialogo="ordenar"
                        ${estado.misiones.filter((m) => !m.archivadaEn).length > 1 ? "" : "disabled"}>↕ Ordenar</button>
            </div>
            <p class="nota nota-gesto">Desliza una misión a la derecha para completarla. Toca su nombre para ver su ficha.</p>
            ${plegable(`Otros días (${otrosDias.length})`,
                `<ul class="lista">${otrosDias.map((m) => filaMision(estado, m, "editar")).join("")}</ul>`, otrosDias.length)}
            ${plegable(`Archivadas (${archivadas.length})`,
                `<ul class="lista">${archivadas.map((m) => filaMision(estado, m, "restaurar")).join("")}</ul>`, archivadas.length)}
        </section>`;
    const seccionMetas = `
        <section class="bloque esencial-grupo esencial-metas" aria-label="Metas de la semana">
            <div class="titulo-seccion"><h2 class="titulo-juego">🗓️ Metas de la semana</h2></div>
            <p class="nota">Misiones de «N veces por semana»: las marcas cualquier día hasta cumplir las veces de la semana.</p>
            ${semanales.length ? `<ul class="lista">${semanales.map(tarjeta).join("")}</ul>`
                : vacio("Aún no tienes metas semanales.<br>Crea una misión y elige «veces por semana» (ej: gimnasio 3 veces).")}
            <div class="botones-dialogo botones-hoy">
                <button type="button" class="boton boton-principal" data-accion="abrir" data-dialogo="mision">+ Nueva meta</button>
            </div>
        </section>`;
    const contenido = {
        // Primero tu personaje y tus rivales; después Aurelio con «Tu día», tu semana y el foco.
        aurelio: esencial ? "" : `
            ${tarjetaHeroe(estado, ctx, { conRivales: false })}
            ${resumenRivales(estado, ctx)}
            ${esAyer ? "" : panelDelDia(estado, ctx)}
            ${esAyer ? "" : tarjetaSemana(estado, ctx)}
            ${esAyer ? "" : tarjetaFoco(estado, ctx)}`,
        misiones: seccionMisiones,
        metas: seccionMetas,
        tareas: `<section class="bloque esencial-grupo esencial-tareas" aria-label="Tareas">${seccionTareas(estado, ctx)}</section>`,
        importantes: seccionPrincipales(estado, true),
        diario: esencial ? "" : seccionDiario(estado, ctx, fecha, esAyer),
    }[vista];

    // Arriba el ánimo, los avisos y las pestañas; debajo, solo la sección elegida.
    // (v52) El héroe, los rivales, «Tu día», tu semana y el foco ahora viven en la pestaña Aurelio.
    return `
        ${botonAnimo}
        ${ctx.recordarRespaldo ? avisoRespaldo() : ""}
        ${esencial ? "" : `${avisoNotificaciones(ctx)}
        ${avisoDescanso(estado, ctx)}`}
        ${esAyer ? "" : tarjetaGymHoy(estado, ctx)}
        ${esAyer || vista === "importantes" ? "" : destacadasDeHoy(estado)}
        ${pestanasHoy}
        ${contenido}`;
}

// «Tu día»: en un solo panel, el Maestro y todo lo que trae el día (antes eran 6 tarjetas sueltas):
// el evento, el cofre, el desafío relámpago, tu pacto y el desafío de la semana.
function panelDelDia(estado, ctx) {
    const s = sagaDe(estado, ctx);
    // Si tu objetivo de la saga es firmar el pacto, la invitación al pacto sobra (la fila de la saga ya lo dice).
    const pactoSobra = !estado.pacto && s.actos[s.indice]?.id === "juramento";
    const filas = [lineaDeSaga(estado, ctx, s), avisoEvento(ctx), tarjetaCofre(estado, ctx), tarjetaRelampago(ctx),
                   pactoSobra ? "" : lineaDelPacto(estado, ctx), tarjetaDesafio(estado, ctx)]
        .filter(Boolean);
    return `
        <section class="panel panel-dia" aria-label="Tu día">
            ${tarjetaMaestro(ctx)}
            ${filas.map((fila) => `<div class="dia-fila">${fila}</div>`).join("")}
        </section>`;
}

// Cada cuánto toca: "3 veces por semana", "El 5 de cada mes", "L · X · V" o "Todos los días".
function textoFrecuencia(mision) {
    if (mision.veces) return `${plural(mision.veces, "vez", "veces")} por semana`;
    if (mision.diasMes) return textoDiasMes(mision.diasMes);
    return mision.dias ? mision.dias.map((d) => DIAS_LETRAS[d]).join(" · ") : "Todos los días";
}

// "El 5 de cada mes", "Los días 1 y 15 de cada mes", "El último día de cada mes"…
// (el 31 es «el último»: si el mes es más corto, igual toca su último día).
export function textoDiasMes(diasMes) {
    const nombres = diasMes.map((d) => (d === 31 ? "último día" : String(d)));
    if (diasMes.length === 1) return diasMes[0] === 31 ? "El último día de cada mes" : `El ${diasMes[0]} de cada mes`;
    const lista = `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
    return `Los días ${lista} de cada mes`;
}

// conFrecuencia: en la lista de hoy no hace falta repetir "Todos los días".
// conMomento: en Hoy ya están agrupadas por momento del día; en la ficha y en «Otros días» sí se muestra.
function detalleMision(estado, mision, conFrecuencia = Boolean(mision.dias || mision.diasMes), conMomento = false) {
    const d = DIFICULTADES[mision.dificultad];
    const a = juego.infoAtributo(estado, mision.atributo, mision.atributoPropio);
    const aviso = mision.aviso ? ` · ⏰ ${mision.aviso}` : "";
    const momento = mision.momento && conMomento ? ` · ${juego.MOMENTOS[mision.momento].icono}` : "";
    return `${esc(a.icono)} ${esc(a.nombre)} · ${d.nombre} · +${d.xp} XP${conFrecuencia ? ` · ${textoFrecuencia(mision)}` : ""}${momento}${aviso}`;
}

function tarjetaMision(mision, estado, fecha, hecha, recienHecha) {
    const falla = hecha ? null : juego.fallaDe(estado, mision.id, fecha);
    const esClave = estado.claves[fecha] === mision.id;
    const clases = ["mision", `dificultad-${mision.dificultad}`, hecha ? "hecha" : "", falla ? "fallada" : "", esClave ? "clave" : "",
                    recienHecha ? "recien-hecha" : ""];
    let boton = `<button type="button" class="boton-check" data-accion="alternar-mision" data-id="${mision.id}"
                         aria-pressed="${hecha}" aria-label="Marcar ${esc(mision.nombre)}">${ICONOS.check}</button>`;
    let extra = "";

    // Con cantidad (ej: 5 de 8 vasos): el botón redondo suma 1 y, si ya está hecha, resta 1.
    if (mision.meta) {
        const lleva = juego.cantidadDe(estado, mision, fecha);
        const meta = mision.meta.cantidad;
        boton = `<button type="button" class="boton-check" data-accion="sumar-cantidad" data-id="${mision.id}" data-paso="${hecha ? -1 : 1}"
                         aria-pressed="${hecha}" aria-label="${hecha ? "Quitar 1 a" : "Sumar 1 a"} ${esc(mision.nombre)}">${hecha ? ICONOS.check : "<b>+1</b>"}</button>`;
        extra += `
            <span class="cantidad">
                ${lleva > 0 && !hecha ? `<button type="button" class="cantidad-menos" data-accion="sumar-cantidad" data-id="${mision.id}" data-paso="-1" aria-label="Quitar 1">−</button>` : ""}
                <button type="button" class="cantidad-valor" data-accion="escribir-cantidad" data-id="${mision.id}"
                        aria-label="Escribir cuánto llevas">${lleva} / ${meta} ${esc(mision.meta.unidad)}</button>
                ${barra(Math.round((lleva / meta) * 100), "barra-mini")}
            </span>`;
    }
    // Semanal: cuántas veces llevas esta semana.
    if (mision.veces) {
        const veces = juego.vecesEnSemana(estado.completadas, mision.id, fecha);
        const cumplida = veces >= mision.veces;
        extra += `<span class="semana-progreso ${cumplida ? "cumplida" : ""}">
                      ${veces} de ${mision.veces} esta semana${cumplida ? " · ✓ ¡Meta cumplida!" : ""}</span>`;
    }

    if (esClave) extra += '<span class="clave-insignia">🔑 Misión clave · vale el doble</span>';
    // «Fallé»: si ya la marcaste como fallada, el botón redondo la desmarca y se ve el motivo.
    // Si no, junto al lápiz aparece ✗ (solo en las que tocaban: las semanales tienen toda la semana).
    let fallar = "";
    if (falla) {
        const motivo = juego.MOTIVOS_FALLA[falla.motivo] || juego.MOTIVOS_FALLA.otro;
        boton = `<button type="button" class="boton-check boton-fallada" data-accion="quitar-falla" data-id="${mision.id}"
                         aria-pressed="true" aria-label="Quitar «fallé» de ${esc(mision.nombre)}">✗</button>`;
        extra += `<span class="falla-motivo">✗ Fallada · ${motivo.icono} ${motivo.nombre}</span>`;
    } else if (!hecha && !mision.veces) {
        fallar = `<button type="button" class="boton-icono boton-fallar" data-accion="fallar-mision" data-id="${mision.id}"
                          aria-label="Fallé: ${esc(mision.nombre)}">✗</button>`;
    }

    return `
        <li class="${clases.join(" ")}" data-id="${mision.id}">
            ${boton}
            <div class="mision-info" data-accion="ver-ficha" data-id="${mision.id}" role="button" aria-label="Ficha de ${esc(mision.nombre)}">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(estado, mision)}</span>
                ${extra}
            </div>
            ${fallar}
            ${botonEditar("editar-mision", mision.id, `Editar ${mision.nombre}`)}
        </li>`;
}

// Misión que no se puede marcar ahora (toca otro día, o está archivada).
function filaMision(estado, mision, accion) {
    const boton = accion === "restaurar"
        ? `<button type="button" class="boton boton-chico" data-accion="restaurar-mision" data-id="${mision.id}">Restaurar</button>`
        : botonEditar("editar-mision", mision.id, `Editar ${mision.nombre}`);
    const meta = mision.meta ? ` · Meta: ${mision.meta.cantidad} ${esc(mision.meta.unidad)}` : "";
    // Las mensuales dicen cuándo toca la próxima vez (en «Otros días»).
    const proxima = mision.diasMes && !mision.archivadaEn ? juego.proximaVez(mision, sumarDias(fechaDeHoy(), 1)) : null;
    const cuando = proxima ? ` · 📅 próxima: ${DIAS_CORTOS[diaDeSemana(proxima)]} ${fechaCorta(proxima)}` : "";
    return `
        <li class="mision apagada dificultad-${mision.dificultad}">
            <div class="mision-info" data-accion="ver-ficha" data-id="${mision.id}" role="button" aria-label="Ficha de ${esc(mision.nombre)}">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(estado, mision, true, true)}${meta}${cuando}</span>
            </div>
            ${boton}
        </li>`;
}


// ===== Ficha de un hábito =====

export function fichaMision(estado, mision, hoy) {
    const s = juego.estadisticasMision(estado, mision, hoy);
    const enUnidad = (n) => plural(n, s.unidad, { día: "días", semana: "semanas", vez: "veces" }[s.unidad]);
    const celdas = s.dias.map((d) => `<i class="celda-ficha ${d.tipo}" title="${fechaCorta(d.fecha)}"></i>`).join("");
    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">${esc(mision.nombre)}</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="cerrar">Cerrar</button>
        </div>
        <p class="mision-detalle">${detalleMision(estado, mision, true, true)}${mision.archivadaEn ? " · Archivada" : ""}</p>
        <div class="fichas-dato">
            ${ficha("Racha", `🔥 ${enUnidad(s.racha)}`, `<span class="ficha-nota">${s.unidad === "día" ? "Días que tocaba, seguidos" : "Semanas cumplidas, seguidas"}</span>`)}
            ${ficha("Mejor racha", `🏅 ${enUnidad(s.mejor)}`, `<span class="ficha-nota">Tu récord con este hábito</span>`)}
            ${ficha("Último mes", s.porcentaje === null ? "—" : `${s.porcentaje} %`,
                    `<span class="ficha-nota">${s.unidad === "día" ? "De los días que tocaba" : "De las semanas"}</span>`)}
            ${ficha("En total", `${s.total} <small>${s.total === 1 ? "vez" : "veces"}</small>`, `<span class="ficha-nota">+${s.xp} XP ganada</span>`)}
        </div>
        ${s.fallas ? `<p class="nota ficha-fallas">✗ La marcaste como fallada ${plural(s.fallas, "vez", "veces")}${s.motivoFrecuente
            ? ` · lo que más se repite: ${juego.MOTIVOS_FALLA[s.motivoFrecuente].icono} ${juego.MOTIVOS_FALLA[s.motivoFrecuente].nombre}` : ""}.</p>` : ""}
        <h3 class="subtitulo">Últimas 12 semanas</h3>
        <div class="ficha-calendario" role="img" aria-label="Calendario de las últimas 12 semanas">${celdas}</div>
        <div class="cal-leyenda">
            <i class="celda-ficha hecha"></i><span>Hecha</span>
            <i class="celda-ficha fallo"></i><span>No la hiciste</span>
            <i class="celda-ficha libre"></i><span>No tocaba</span>
        </div>
        <button type="button" class="boton boton-secundario boton-ancho" data-accion="editar-mision" data-id="${mision.id}">✏️ Editar misión</button>`;
}

// Lista para ordenar arrastrando (☰). Muestra todas las misiones no archivadas.
export function listaOrdenar(estado) {
    return estado.misiones.filter((m) => !m.archivadaEn).map((m) => `
        <li class="mision fila-ordenar dificultad-${m.dificultad}" data-id="${m.id}">
            <span class="mango" data-mango aria-label="Arrastrar para mover">☰</span>
            <div class="mision-info">
                <span class="mision-nombre">${esc(m.nombre)}</span>
                <span class="mision-detalle">${m.momento ? `${juego.MOMENTOS[m.momento].icono} ${juego.MOMENTOS[m.momento].nombre} · ` : ""}${textoFrecuencia(m)}</span>
            </div>
        </li>`).join("");
}


// ===== Hoy: tareas sueltas =====

function seccionTareas(estado, ctx) {
    // Las que no tienen fecha van después de las que sí.
    const porFecha = (a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999");
    const pendientes = estado.tareas.filter((t) => !t.hechaEn);
    // En la lista principal: las que vencen hoy o ya vencieron, las sin fecha y las que hiciste hoy.
    const paraHoy = [
        ...pendientes.filter((t) => !t.fecha || t.fecha <= ctx.hoy).sort(porFecha),
        ...estado.tareas.filter((t) => t.hechaEn === ctx.hoy),
    ];
    const proximas = pendientes.filter((t) => t.fecha && t.fecha > ctx.hoy).sort(porFecha);
    const anteriores = estado.tareas.filter((t) => t.hechaEn && t.hechaEn < ctx.hoy)
        .sort((a, b) => b.hechaEn.localeCompare(a.hechaEn)).slice(0, 15);   // las 15 más recientes
    const lista = (tareas) => `<ul class="lista">${tareas.map((t) => tarjetaTarea(estado, t, ctx)).join("")}</ul>`;
    const listaAtributos = (tareas) => agruparPorAtributo(estado, tareas, (t) => tarjetaTarea(estado, t, ctx), (t) => Boolean(t.hechaEn));

    return `
        ${cabeceraSeccion("📌 Tareas", "tarea", "+ Nueva")}
        ${paraHoy.length
            ? listaAtributos(paraHoy)
            : vacio(proximas.length
                ? "Nada pendiente para hoy."
                : "Pendientes de una sola vez, con fecha: pagar un recibo, entregar un trabajo…<br>Aparecen aquí el día que vencen.")}
        ${plegable(`Próximas (${proximas.length})`, lista(proximas), proximas.length)}
        ${plegable(`Hechas antes (${anteriores.length})`, lista(anteriores), anteriores.length)}`;
}

function tarjetaTarea(estado, tarea, ctx) {
    const hecha = Boolean(tarea.hechaEn);
    const d = DIFICULTADES[tarea.dificultad];
    const a = juego.infoAtributo(estado, tarea.atributo, tarea.atributoPropio);
    const clases = ["mision", "tarea", `dificultad-${tarea.dificultad}`, hecha ? "hecha" : "", ctx.recienTarea === tarea.id ? "recien-hecha" : ""];
    return `
        <li class="${clases.join(" ")}" data-tarea="${tarea.id}">
            <button type="button" class="boton-check" data-accion="alternar-tarea" data-id="${tarea.id}"
                    aria-pressed="${hecha}" aria-label="Marcar ${esc(tarea.nombre)}">${ICONOS.check}</button>
            <div class="mision-info">
                <span class="mision-nombre">${esc(tarea.nombre)}</span>
                <span class="mision-detalle">${esc(a.icono)} ${esc(a.nombre)} · ${d.nombre} · +${d.xp} XP · ${cuandoVence(tarea, ctx.hoy)}</span>
            </div>
            ${botonEditar("editar-tarea", tarea.id, `Editar ${tarea.nombre}`)}
        </li>`;
}

// "Vence hoy", "Vence mañana", "Vence el vie 16 oct", "Atrasada"…
function cuandoVence(tarea, hoy) {
    if (tarea.hechaEn) return tarea.hechaEn === hoy ? "Hecha hoy" : `Hecha el ${fechaCorta(tarea.hechaEn)}`;
    if (!tarea.fecha) return "Sin fecha";
    const dias = diasEntre(hoy, tarea.fecha);
    if (dias < 0) return `<span class="atrasada">Atrasada: vencía el ${fechaCorta(tarea.fecha)}</span>`;
    if (dias === 0) return "Vence hoy";
    if (dias === 1) return "Vence mañana";
    return `Vence el ${DIAS_CORTOS[diaDeSemana(tarea.fecha)]} ${fechaCorta(tarea.fecha)}`;
}


// ===== Hoy: desafío de la semana, diario y «Tu semana» =====

function tarjetaDesafio(estado, ctx) {
    const desafio = estado.desafios.find((d) => d.semana === lunesDe(ctx.hoy));
    if (!desafio || !desafios.DESAFIOS[desafio.tipo]) return "";
    const progreso = Math.min(desafios.progresoDesafio(estado, desafio), desafio.meta);
    const quedan = 6 - diaDeSemana(ctx.hoy);   // días que faltan después de hoy
    const cofre = desafios.COFRE;
    const pie = desafio.cobradoEn
        ? "¡Cofre abierto! Vuelve el lunes por otro desafío."
        : `Cofre: +${cofre.gemas} 💎 y +${cofre.xp} XP · ${quedan === 0 ? "termina hoy" : `quedan ${plural(quedan, "día", "días")}`}`;
    return `
        <section class="panel desafio ${desafio.cobradoEn ? "cumplido" : ""}">
            <span class="desafio-icono" aria-hidden="true">${desafio.cobradoEn ? "🎁" : desafios.DESAFIOS[desafio.tipo].icono}</span>
            <div class="desafio-info">
                <span class="etiqueta">Desafío de la semana</span>
                <b>${desafios.textoDesafio(desafio)}</b>
                ${barra(Math.round((progreso / desafio.meta) * 100), "barra-mini")}
                <span class="mini texto-suave">${progreso} / ${desafio.meta} · ${pie}</span>
            </div>
        </section>`;
}

// El diario en Hoy: cómo te fue (tocar una carita guarda al instante), la pregunta del día
// y algo que agradeces. Arriba, la racha y el botón para ver todo el diario.
function seccionDiario(estado, ctx, fecha, esAyer) {
    const entrada = estado.diario[fecha];
    const racha = diario.rachaDiario(estado, ctx.hoy);
    const p = diario.PREMIO_DIARIO;
    const animos = Object.entries(ANIMOS_DIARIO).map(([clave, a]) => `
        <label class="pildora" style="--color-dificultad: ${a.color}">
            <input type="radio" name="animo" value="${clave}" ${entrada?.animo === clave ? "checked" : ""}>
            <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
        </label>`).join("");
    const nota = entrada?.premio
        ? `✓ Escrito${esAyer ? "" : " hoy"}. Puedes cambiarlo cuando quieras.`
        : `Escribirlo da +${p.xp} XP de ${ATRIBUTOS[p.atributo].icono} ${ATRIBUTOS[p.atributo].nombre}, ${p.monedas} 🪙 y cura ${vida.VIDA.diario} ❤️.`;
    return `
        <section class="panel diario">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">📓 Diario</h2>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="diario">📖 Ver todo</button>
            </div>
            <p class="nota">${racha ? `✍️ Racha de ${plural(racha, "día", "días")} escribiendo. ` : ""}${nota}</p>
            <form data-form="diario" class="formulario">
                <input type="hidden" name="fecha" value="${fecha}">
                <fieldset class="opciones opciones-5"><legend>¿Cómo te fue ${esAyer ? "ayer" : "hoy"}?</legend>${animos}</fieldset>
                <!-- Lo escrito va plegado para que Hoy no sea tan largo: se abre al tocarlo. -->
                <details class="diario-escribir">
                    <summary>${entrada?.texto
                        ? `✍️ «${esc(entrada.texto.length > 60 ? `${entrada.texto.slice(0, 60)}…` : entrada.texto)}»`
                        : `✍️ ${esc(diario.preguntaDelDia(fecha))}`}</summary>
                    <label>${esc(diario.preguntaDelDia(fecha))}
                        <textarea name="texto" rows="3" maxlength="${diario.LARGO.texto}"
                                  placeholder="Escribe lo que quieras. Una frase basta.">${esc(entrada?.texto || "")}</textarea>
                    </label>
                    <label>🙏 Hoy agradezco…
                        <input type="text" name="gratitud" maxlength="${diario.LARGO.gratitud}" autocomplete="off"
                               value="${esc(entrada?.gratitud || "")}" placeholder="Ej: el café con mi mamá">
                    </label>
                    <button type="submit" class="boton boton-principal boton-ancho">${entrada ? "Actualizar" : "Guardar en mi diario"}</button>
                </details>
            </form>
            ${entrada?.animo ? palabrasDelMaestro(maestro.respuestaAlDiario(entrada.animo, fecha)) : ""}
        </section>`;
}


// ===== El Maestro, el evento del día, el cofre y el relámpago (en Hoy) =====

// Lo que dice el Maestro en medio de otra pantalla (el diario, el ritual): su cara pequeña y la frase.
function palabrasDelMaestro(texto) {
    return `
        <div class="maestro-dice">
            <span class="maestro-dice-retrato" aria-hidden="true">${dibujarAvatar(maestro.describirMaestro(), { mini: true })}</span>
            <p><b>${maestro.NOMBRE}</b>${esc(texto)}</p>
        </div>`;
}

// La tarjeta del Maestro: lo que te dice ahora y los botones para hablar, elegir tu misión clave o cerrar el día.
function tarjetaMaestro(ctx) {
    const c = ctx.maestro;
    const botones = ['<button type="button" class="boton boton-chico" data-accion="maestro-abrir">💬 Hablar</button>'];
    if (c.pendientes.length && !c.claveHecha) {
        botones.push(`<button type="button" class="boton boton-chico boton-secundario" data-accion="maestro-abrir" data-modo="clave">🔑 ${c.clave ? "Cambiar clave" : "Misión clave"}</button>`);
    }
    if (!c.cerrado && (c.hora >= 17 || (c.tocan && !c.pendientes.length))) {
        botones.push('<button type="button" class="boton boton-chico boton-secundario" data-accion="ritual-abrir">🌙 Cerrar el día</button>');
    }
    // Si te contó algo nuevo de su pasado (ver memorias.js).
    if (c.memorias.sinLeer) {
        botones.push(`<button type="button" class="boton boton-chico boton-secundario" data-accion="memorias-abrir">📜 Escuchar${c.memorias.sinLeer > 1 ? ` (${c.memorias.sinLeer})` : ""}</button>`);
    }
    return `
        <section class="maestro-tarjeta">
            <div class="maestro-retrato" aria-hidden="true">${dibujarAvatar(maestro.describirMaestro(), { mini: true })}</div>
            <div class="maestro-habla">
                <span class="etiqueta">${maestro.NOMBRE}</span>
                <p class="maestro-texto">${esc(maestro.saludo(c))}</p>
                <div class="maestro-botones">${botones.join("")}</div>
            </div>
        </section>`;
}

function avisoEvento(ctx) {
    const e = ctx.evento;
    if (!e) return "";
    return `<div class="evento-dia"><span class="evento-icono" aria-hidden="true">${e.icono}</span>
                <span><span class="etiqueta">Evento del día</span><b>${e.nombre}</b> · ${e.texto}</span></div>`;
}

// El cofre de madera (se abre con una animación: ver estilos.css).
function dibujoCofre() {
    return `
        <svg class="cofre-svg" viewBox="0 0 120 100" aria-hidden="true">
            <defs>
                <linearGradient id="cofre-madera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2b"/><stop offset="1" stop-color="#4a2c14"/></linearGradient>
                <linearGradient id="cofre-hierro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b6470"/><stop offset=".5" stop-color="#b8c0ca"/><stop offset="1" stop-color="#4b5563"/></linearGradient>
                <radialGradient id="cofre-luz" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fde68a" stop-opacity=".95"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
            </defs>
            <ellipse class="cofre-brillo" cx="60" cy="48" rx="52" ry="34" fill="url(#cofre-luz)"/>
            <rect x="14" y="50" width="92" height="40" rx="3" fill="url(#cofre-madera)" stroke="#2a180b" stroke-width="2"/>
            <path d="M14 62 H106 M14 76 H106" stroke="#2a180b" stroke-width="1" opacity=".5"/>
            <rect x="54" y="50" width="12" height="40" fill="url(#cofre-hierro)"/>
            <g class="cofre-tapa">
                <path d="M14 50 L14 40 Q60 12 106 40 L106 50 Z" fill="url(#cofre-madera)" stroke="#2a180b" stroke-width="2"/>
                <path d="M54 50 L54 24 Q60 23 66 24 L66 50 Z" fill="url(#cofre-hierro)"/>
            </g>
            <rect x="51" y="54" width="18" height="14" rx="2" fill="#d4a017" stroke="#5c4300" stroke-width="1.5"/>
            <circle cx="60" cy="60" r="2.2" fill="#5c4300"/>
        </svg>`;
}

function tarjetaCofre(estado, ctx) {
    const abierto = estado.cofres[ctx.hoy];
    if (abierto) {
        return `<div class="cofre-linea"><span aria-hidden="true">🎁</span><span>Cofre de hoy: <b>${esc(abierto.texto)}</b>. Mañana habrá otro.</span></div>`;
    }
    if (!ctx.maestro.cofre) {
        return '<div class="cofre-linea cofre-cerrado"><span aria-hidden="true">🔒</span><span>Cumple tu primera misión de hoy y se abrirá tu <b>cofre del día</b>.</span></div>';
    }
    return `
        <button type="button" class="cofre-tarjeta" data-accion="abrir-cofre">
            ${dibujoCofre()}
            <span><b>🎁 Tu cofre del día está listo</b>
                <span class="mini">Tócalo para abrirlo: gemas, XP, una poción, fichas… o algo mejor.</span></span>
        </button>`;
}

function tarjetaRelampago(ctx) {
    const r = ctx.maestro.relampago;
    if (!r || r.estado === "rechazado") return "";
    const p = rituales.RELAMPAGO.premio;
    if (r.estado === "ofrecido") {
        return `
            <section class="relampago">
                <p><b>⚡ Desafío relámpago</b><br>Completa ${juego.plural(r.meta, "misión", "misiones")} en las próximas
                   ${rituales.RELAMPAGO.minutos / 60} horas. Premio: +${p.xp} XP y +${p.gemas} 💎.</p>
                <div class="botones-dialogo">
                    <button type="button" class="boton boton-secundario" data-accion="rechazar-relampago">Ahora no</button>
                    <button type="button" class="boton boton-principal" data-accion="aceptar-relampago">⚡ Acepto</button>
                </div>
            </section>`;
    }
    if (r.estado === "activo") {
        return `
            <section class="relampago activo">
                <p><b>⚡ Desafío relámpago:</b> ${r.progreso} de ${r.meta} ·
                   quedan <span class="relampago-reloj" data-relampago-fin="${ctx.ahora + r.restante}">${relojLargo(r.restante)}</span></p>
                ${barra(Math.round((r.progreso / r.meta) * 100), "barra-mini")}
            </section>`;
    }
    if (r.estado === "cumplido") return '<div class="cofre-linea"><span aria-hidden="true">⚡</span><span><b>¡Desafío relámpago cumplido!</b></span></div>';
    return `<div class="cofre-linea cofre-cerrado"><span aria-hidden="true">⌛</span><span>Se acabó el tiempo del desafío relámpago (${r.progreso} de ${r.meta}). Otro día será.</span></div>`;
}


// ===== El Maestro: la ventana para conversar =====
// m = { modo: "inicio" | "respuesta" | "clave", respuesta }

export function dialogoMaestro(ctx, m) {
    const c = ctx.maestro;
    const opcion = (accion, texto, extra = "") => `<button type="button" class="boton boton-secundario maestro-opcion" data-accion="${accion}" ${extra}>${texto}</button>`;
    const puedeClave = c.pendientes.length && !c.claveHecha;
    let texto;
    let opciones = "";
    if (m.modo === "clave") {
        texto = puedeClave
            ? "¿Cuál será tu misión clave hoy? Vale el doble: XP, monedas y daño al jefe. Elige la que más te acerque a quien quieres ser."
            : "Hoy ya no queda misión que elegir como clave.";
        opciones = c.pendientes.map((mision) => opcion("maestro-clave",
            `${c.clave?.id === mision.id ? "🔑 " : ""}${esc(mision.nombre)}`, `data-id="${mision.id}"`)).join("");
        opciones += opcion("maestro-modo", "‹ Volver", 'data-modo="inicio"');
    } else if (m.modo === "respuesta") {
        texto = m.respuesta;
        if (m.opcion === "historia" && c.memorias.abiertas) opciones += opcion("memorias-abrir", "📜 Leer sus memorias");
        // Si no tienes ganas o estás abrumado, te ofrece leer «La primera piedra».
        if (m.opcion === "sinGanas" || m.opcion === "abrumado") opciones += opcion("pergamino-abrir", `📜 Leer «${pergamino.TITULO}»`);
        if (puedeClave) opciones += opcion("maestro-modo", "🔑 Elegir mi misión clave", 'data-modo="clave"');
        opciones += opcion("maestro-modo", "‹ Seguir hablando", 'data-modo="inicio"');
        opciones += opcion("maestro-cerrar", "Gracias, maestro");
    } else {
        texto = maestro.saludo(c);
        if (c.memorias.sinLeer) opciones += opcion("memorias-abrir", "📜 Escuchar su historia");
        opciones += maestro.OPCIONES.map((o) => opcion("maestro-opcion", o.texto, `data-opcion="${o.id}"`)).join("");
        if (puedeClave) opciones += opcion("maestro-modo", "🔑 Elegir mi misión clave", 'data-modo="clave"');
        if (!c.cerrado) opciones += opcion("ritual-abrir", "🌙 Cerrar el día");
    }
    return `
        <div class="maestro-dialogo-retrato" aria-hidden="true">${dibujarAvatar(maestro.describirMaestro(), { batalla: true })}</div>
        <p class="etiqueta">${maestro.NOMBRE}</p>
        <p class="maestro-burbuja">${esc(texto)}</p>
        <div class="maestro-opciones">${opciones}</div>
        <button type="button" class="boton-texto maestro-cerrar" data-accion="maestro-cerrar">Cerrar</button>`;
}


// ===== El ritual de la noche =====
// r = { paso: "misiones" | "diario" | "final", cola: [ids], indice, motivo (true mientras eliges el motivo) }

export function pantallaRitual(estado, ctx, r) {
    const cabecera = (numero, titulo) => `
        <div class="ritual-cabecera">
            <span class="etiqueta">🌙 Ritual de la noche · Paso ${numero} de 3</span>
            <button type="button" class="boton-icono" data-accion="ritual-cerrar" aria-label="Salir del ritual">${ICONOS.cerrar}</button>
        </div>
        <h2 class="titulo-juego">${titulo}</h2>`;

    if (r.paso === "misiones") {
        const mision = estado.misiones.find((m) => m.id === r.cola[r.indice]);
        if (!mision) {
            return `${cabecera(1, "Repasa tu día")}
                <p class="nota">No te queda ninguna misión pendiente hoy. ✓</p>
                <button type="button" class="boton boton-principal boton-ancho" data-accion="ritual-seguir">Seguir ›</button>`;
        }
        const a = juego.infoAtributo(estado, mision.atributo, mision.atributoPropio);
        const botones = r.motivo
            ? `<p class="nota">¿Qué pasó?</p>
               <div class="ritual-motivos">${Object.entries(juego.MOTIVOS_FALLA).map(([clave, mo]) => `
                   <button type="button" class="boton boton-secundario" data-accion="ritual-motivo" data-motivo="${clave}">${mo.icono} ${mo.nombre}</button>`).join("")}</div>
               <button type="button" class="boton-texto" data-accion="ritual-volver">‹ Volver</button>`
            : `<div class="ritual-botones">
                   <button type="button" class="boton boton-peligro" data-accion="ritual-no">✗ No la hice</button>
                   <button type="button" class="boton boton-principal" data-accion="ritual-si">✓ La hice</button>
               </div>
               <p class="nota ritual-nota">También puedes deslizar la carta: → la hiciste, ← no.</p>`;
        return `${cabecera(1, "Repasa tu día")}
            <p class="ritual-contador">${r.indice + 1} de ${r.cola.length}</p>
            <article class="ritual-carta dificultad-${mision.dificultad}" data-id="${mision.id}">
                <span class="mini texto-suave">${esc(a.icono)} ${esc(a.nombre)} · ${DIFICULTADES[mision.dificultad].nombre}</span>
                <h3>${esc(mision.nombre)}</h3>
                ${estado.claves[ctx.hoy] === mision.id ? '<span class="clave-insignia">🔑 Tu misión clave</span>' : ""}
            </article>
            ${botones}`;
    }

    if (r.paso === "diario") {
        const entrada = estado.diario[ctx.hoy];
        const animos = Object.entries(ANIMOS_DIARIO).map(([clave, a]) => `
            <label class="pildora" style="--color-dificultad: ${a.color}">
                <input type="radio" name="animo" value="${clave}" ${entrada?.animo === clave ? "checked" : ""}>
                <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
            </label>`).join("");
        return `${cabecera(2, "Tu diario")}
            <form data-form="ritual-diario" class="formulario">
                <fieldset class="opciones opciones-5"><legend>¿Cómo te fue hoy?</legend>${animos}</fieldset>
                <label>${esc(diario.preguntaDelDia(ctx.hoy))}
                    <textarea name="texto" rows="3" maxlength="${diario.LARGO.texto}" placeholder="Escribe lo que quieras. Una frase basta.">${esc(entrada?.texto || "")}</textarea>
                </label>
                <label>🙏 Hoy agradezco…
                    <input type="text" name="gratitud" maxlength="${diario.LARGO.gratitud}" autocomplete="off" value="${esc(entrada?.gratitud || "")}">
                </label>
                <button type="submit" class="boton boton-principal boton-ancho">Guardar y seguir ›</button>
                <button type="button" class="boton-texto" data-accion="ritual-seguir">Saltar</button>
            </form>`;
    }

    // Paso 3: el resumen y el capítulo de hoy.
    const hechas = estado.completadas.filter((c) => c.fecha === ctx.hoy).length;
    const falladas = estado.fallas.filter((f) => f.fecha === ctx.hoy).length;
    const capitulo = libro.capitulosDelLibro(estado, ctx.hoy).find((c) => c.fecha === ctx.hoy);
    const lectura = capitulo
        ? `<article class="pergamino ritual-capitulo">
               <p class="pergamino-sobre">Capítulo ${libro.aRomano(capitulo.numero)}</p>
               <h3 class="capitulo-titulo">${esc(capitulo.titulo)}</h3>
               <div class="capitulo-texto">${capitulo.parrafos.slice(0, 3).map((p) => (p.tipo === "cita"
                   ? `<blockquote class="capitulo-cita">${esc(p.texto)}</blockquote>` : `<p>${esc(p.texto)}</p>`)).join("")}</div>
           </article>
           <button type="button" class="boton-texto" data-accion="ir" data-pantalla="libro">Leer el capítulo completo ›</button>`
        : '<p class="nota">Hoy no escribiste en tu diario, así que tu libro no tendrá capítulo de hoy.</p>';
    const despedida = maestro.palabrasDeLaNoche({ hechas, falladas, pendientes: ctx.maestro.pendientes.length });
    return `${cabecera(3, "Tu día, en tu libro")}
        <p class="ritual-resumen">✓ ${juego.plural(hechas, "cumplida", "cumplidas")} · ✗ ${juego.plural(falladas, "fallada", "falladas")} ·
           ❤️ ${ctx.vida.puntos}/${ctx.vida.maxima} · 🔥 ${juego.plural(ctx.info.racha.actual, "día", "días")}</p>
        ${lectura}
        ${palabrasDelMaestro(despedida)}
        <button type="button" class="boton boton-sangre boton-ancho" data-accion="ritual-terminar">🌙 Cerrar el día</button>`;
}


// ===== El golpe con timing =====
// g = { mision, jefe, resultado: null | "critico" | "normal" }

export function pantallaGolpe(g) {
    const resultado = g.resultado === "critico"
        ? '<p class="golpe-resultado critico">¡GOLPE CRÍTICO! +50 % de daño</p>'
        : g.resultado === "normal" ? '<p class="golpe-resultado">Golpe normal</p>' : "";
    return `
        <p class="etiqueta">${esc(g.mision)}</p>
        <figure class="retrato golpe-retrato ${g.resultado === "critico" ? "impacto" : ""}">
            <img src="${campana.imagenDe(g.jefe.id)}" alt="${esc(g.jefe.nombre)}">
        </figure>
        <h2 class="titulo-juego">${esc(g.jefe.nombre)}</h2>
        <div class="golpe-barra ${g.resultado ? "detenida" : ""}"><span class="golpe-zona"></span><span class="golpe-marca"></span></div>
        ${resultado || '<p class="nota">Toca la pantalla cuando la marca esté en la zona dorada: golpe crítico.</p>'}`;
}


// ===== El mapa del reino (v26) =====
// La imagen del mapa (pixel art) la pone app.js después de dibujar la pantalla, porque hacerla
// tarda un instante: aquí solo va su lugar (#mapa-imagen), con tu héroe y tu mascota encima.

// Dónde va algo del lienzo del mapa, en % (para ponerlo encima de la imagen).
const enElMapa = (p) => `left: ${((p.x / mapa.LIENZO.ancho) * 100).toFixed(2)}%; top: ${((p.y / mapa.LIENZO.alto) * 100).toFixed(2)}%`;

// La franja con las 6 regiones de la vuelta en que vas.
function franjaDelReino(estado, campanas, region) {
    return `<nav class="reino-franja" aria-label="Regiones del reino">${mapa.resumenDelReino(estado, campanas).map((r) => `
        <button type="button" class="reino-region ${r.liberada && r.pisada ? "libre" : ""} ${r.actual ? "actual" : ""} ${r.region === region ? "vista" : ""}"
                data-accion="mapa-region" data-region="${r.region}" ${r.pisada ? "" : "disabled"}
                aria-label="${r.nombre}${r.pisada ? `: ${r.senoresCaidos} de 4` : " (todavía no llegas)"}">
            <span aria-hidden="true">${r.pisada ? r.icono : "🔒"}</span>
            <small>${cronica.ROMANOS[r.region] || r.region + 1}</small>
            ${r.pisada ? `<i>${r.liberada ? "✓" : `${r.senoresCaidos}/4`}</i>` : ""}
        </button>`).join("")}</nav>`;
}

// La ficha de uno de los señores de la región (o de un memorial de la Ciudadela).
function fichaSenor(s, region, campanas, porReclamar, alcanzado) {
    const c = campanas[s.categoria];
    const a = juego.ATRIBUTOS[s.categoria];
    const llegaste = s.n <= alcanzado;
    const reclamable = porReclamar.find((l) => l.id === s.id);
    const boton = reclamable
        ? `<button type="button" class="boton boton-chico boton-oro" data-accion="reclamar-lugar" data-id="${s.id}">Botín</button>` : "";
    if (s.tipo === "memorial") {
        const llevas = Math.min(5, c.derrotados - (s.numero - 5));
        return `<li class="senor ${s.liberada ? "libre" : ""}" id="senor-${s.id}">
                    <span class="senor-memorial" aria-hidden="true">${s.liberada ? "🔥" : "🗿"}</span>
                    <span class="objeto-info"><b>${s.nombre}</b>
                        <span class="mini texto-suave">Lugar ${s.n} · ${a.icono} ${a.nombre}</span>
                        <span class="mini">${s.liberada ? "Encendido: vencidos los 5 señores de su campaña." : `Se enciende al vencer a los 5 señores de la ${c.campana.nombre}: llevas ${llevas} de 5.`}</span>
                        ${s.liberada ? "" : barra(Math.round((llevas / 5) * 100), "barra-mini")}</span>
                    ${boton}
                </li>`;
    }
    const jefe = s.jefe;
    let estadoTexto;
    if (s.liberada) {
        estadoTexto = `<span class="mini oro">✓ Derrotado · guarida liberada${llegaste ? "" : ` (llegas en el lugar ${s.n})`}</span>`;
    } else if (s.actual) {
        estadoTexto = `<span class="mini">⚔️ Es tu rival ahora en Aventuras. Debilítalo con misiones de ${a.icono} ${a.nombre}:
                           ${c.vida} de ${c.vidaMax} ❤️</span>${barra(c.porcentaje, "barra-mini barra-jefe")}${notaJefeEsperando(c)}`;
    } else {
        const antes = c.jefe;
        estadoTexto = `<span class="mini texto-suave">Espera en su guarida. Antes tienes que vencer a ${esc(antes.nombre)} (${esc(antes.titulo.toLowerCase())}).</span>`;
    }
    return `<li class="senor ${s.liberada ? "libre" : s.actual ? "actual" : "lejano"}" id="senor-${s.id}">
                <figure class="retrato mini senor-retrato ${s.liberada ? "derrotado" : ""}"><img src="${campana.imagenDe(jefe.id)}" alt="${esc(jefe.nombre)}"></figure>
                <span class="objeto-info"><b>${esc(jefe.nombre)}</b>
                    <span class="mini texto-suave">${esc(jefe.titulo)} · lugar ${s.n} · ${a.icono} ${a.nombre}</span>
                    ${estadoTexto}</span>
                ${boton}
            </li>`;
}

// La Crónica del reino: un capítulo por región, que se va escribiendo con lo que haces.
function seccionCronica(estado, campanas, region) {
    const capitulos = cronica.capitulosDeLaCronica(estado, campanas, {
        heroe: estado.personaje.nombre,
        dragon: mascota.nombreDe(estado, mascota.INICIAL),
    });
    const abiertoPorDefecto = `r${region + 1}`;
    const html = capitulos.map((c) => {
        if (!c.abierto) {
            return `<div class="capitulo bloqueado"><span class="capitulo-numero">Capítulo ${c.numero}</span>
                        <b>${esc(c.titulo)}</b><small>🔒 ${esc(c.bloqueado)}</small></div>`;
        }
        const parrafos = c.parrafos.map((p) => `<p class="parrafo-${p.tipo}">${p.tipo === "caida" ? "⚔️ " : ""}${esc(p.texto)}</p>`).join("");
        return `<details class="capitulo" ${c.id === abiertoPorDefecto ? "open" : ""}>
                    <summary><span class="capitulo-numero">${c.id === "prologo" ? "Prólogo" : `Capítulo ${c.numero}`}</span> <b>${esc(c.titulo)}</b></summary>
                    ${parrafos}
                    ${/^r\d+$/.test(c.id) ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="cine-region" data-region="${Number(c.id.slice(1)) - 1}">▶ Ver escena</button>` : ""}
                </details>`;
    }).join("");
    return `
        <section class="cronica">
            <h2 class="cronica-titulo">Crónica del reino</h2>
            <p class="cronica-sub">Se escribe sola: cada región que alcanzas y cada señor que cae agregan una página.</p>
            ${html}
        </section>`;
}

export function pantallaMapa(estado, ctx) {
    const pos = mapa.posicion(estado);
    const region = Math.min(ctx.regionMapa ?? pos.region, pos.region);
    const campanas = campana.estadoCampanas(estado);
    const dibujo = mapa.datosParaDibujar(estado, region, campanas);
    const senores = mapa.senoresDeRegion(region, campanas);
    const caidos = senores.filter((s) => s.liberada).length;
    const tramo = mapa.tramoDe(region);
    const datos = mapa.REGIONES[tramo];
    const puntos = mapa.puntosDelCamino();
    const porReclamar = mapa.lugaresPorReclamar(estado, campanas);

    // Encima del mapa: tu héroe y tu mascota (en la región donde vas) y un botón en cada guarida.
    const aqui = region === pos.region ? puntos[pos.enRegion] : null;
    const encima = `
        ${aqui ? `<img class="mapa-heroe" id="mapa-heroe" alt="${esc(estado.personaje.nombre)}" style="${enElMapa(aqui)}">
                  <img class="mapa-mascota" id="mapa-mascota" alt="" style="${enElMapa({ x: aqui.x + 13, y: aqui.y + 2 })}">` : ""}
        ${senores.map((s) => `<button type="button" class="mapa-guarida ${s.liberada ? "libre" : ""}" data-accion="mapa-senor" data-id="senor-${s.id}"
                                      style="${enElMapa(puntos[s.n])}" aria-label="${esc(s.nombre)}: ${s.liberada ? "liberada" : "en pie"}">
                                  ${s.liberada && s.jefe ? `<img class="mapa-trofeo" src="${campana.imagenDe(s.jefe.id)}" alt="" loading="lazy" decoding="async">` : ""}</button>`).join("")}
        ${tramo === 0 ? `<button type="button" class="mapa-guarida" data-accion="ir" data-pantalla="arcade"
                                 style="${enElMapa({ x: mapa.TORRE_VALLE.x, y: mapa.TORRE_VALLE.y - 30 })}" aria-label="La Torre de los Vigías: súbela en el Arcade"></button>` : ""}`;

    const listaReclamar = porReclamar.length ? `
        <section class="panel mapa-premios">
            <div class="titulo-seccion">
                <h3 class="subtitulo">🎁 ${juego.plural(porReclamar.length, "lugar con botín", "lugares con botín")}</h3>
                ${porReclamar.length > 1 ? '<button type="button" class="boton boton-chico boton-oro" data-accion="reclamar-todo">Reclamar todo</button>' : ""}
            </div>
            <ul class="lista">${porReclamar.slice(0, 3).map((l) => {
                const lugar = mapa.LUGARES[l.tipo];
                const premio = [lugar.premio.gemas ? `+${lugar.premio.gemas} 💎` : "", lugar.premio.xp ? `+${lugar.premio.xp} XP` : ""].filter(Boolean).join(" · ");
                const nombre = l.nombre ? `${lugar.nombre}: ${esc(l.nombre)}`
                    : l.tipo === "fortaleza" ? (mapa.tramoDe(l.region) === mapa.CIUDADELA ? "Brasero de los Vigías: arden los cuatro" : "Fortaleza: región liberada")
                    : `${lugar.nombre} · lugar ${l.n}`;
                return `<li class="objeto"><span class="pocion-icono" aria-hidden="true">${lugar.icono}</span>
                    <span class="objeto-info"><b>${nombre}</b><span class="mini texto-suave">${mapa.nombreRegion(l.region)} · ${premio}</span></span>
                    <button type="button" class="boton boton-chico boton-oro" data-accion="reclamar-lugar" data-id="${l.id}">Reclamar</button></li>`;
            }).join("")}</ul>
            ${porReclamar.length > 3 ? `<p class="nota">…y ${juego.plural(porReclamar.length - 3, "lugar más", "lugares más")}.</p>` : ""}
        </section>` : "";

    const progreso = region === pos.region
        ? `${campana.factorDeViaje(estado) > 1 ? `🐎 Viajas ×${String(Math.round(campana.factorDeViaje(estado) * 10) / 10).replace(".", ",")} más rápido por tus jefes vencidos. ` : ""}Lugar ${pos.enRegion} de ${mapa.LUGARES_POR_REGION} · te ${pos.hastaSiguiente === 1 ? "falta 1 paso" : `faltan ${pos.hastaSiguiente} pasos`} para el siguiente.`
        : "Región recorrida.";
    const ciudadela = tramo === mapa.CIUDADELA;
    const finalDeRegion = ciudadela
        ? (caidos === 4 ? "El brasero de los Vigías arde: su fuego es el que falta en la Torre, de vuelta en el Valle del Comienzo."
                        : "Cuando ardan los cuatro, su fuego se juntará en el brasero de los Vigías.")
        : (caidos === 4 ? "Las puertas de la fortaleza están abiertas." : "Las puertas de la fortaleza se abren cuando caigan los cuatro.");
    const notaTorre = tramo === 0
        ? `<p class="nota">🗼 Al principio del camino, junto a la casa de Aurelio, se alza la Torre de los Vigías. Se sube desde el
           <button type="button" class="enlace enlace-en-linea" data-accion="ir" data-pantalla="arcade">Arcade</button>; sus ventanas se encienden con los pisos que subes.</p>`
        : "";

    return `
        ${encabezado("🗺️ El reino", "aventuras", "Aventuras")}
        ${franjaDelReino(estado, campanas, region)}
        <section class="panel mapa-cabecera">
            <div class="mapa-navegar">
                <button type="button" class="boton-icono" data-accion="mapa-region" data-region="${region - 1}" ${region > 0 ? "" : "disabled"} aria-label="Región anterior">‹</button>
                <div><p class="etiqueta">Capítulo ${cronica.ROMANOS[region] || region + 1}</p><h3 class="mapa-region">${mapa.nombreRegion(region)}</h3>
                     <p class="mapa-lema">${datos.lema}</p></div>
                <button type="button" class="boton-icono" data-accion="mapa-region" data-region="${region + 1}" ${region < pos.region ? "" : "disabled"} aria-label="Región siguiente">›</button>
            </div>
            <p class="nota">${progreso} ${ciudadela ? "Memoriales encendidos" : "Señores vencidos"}: <b>${caidos} de 4</b>.
               ${finalDeRegion}</p>
            ${notaTorre}
            <button type="button" class="boton boton-chico boton-secundario" data-accion="cine-region" data-region="${region}">🎬 Ver la escena de esta región</button>
        </section>
        ${listaReclamar}
        <div class="mapa-pixel" data-region="${region}">
            <img class="mapa-imagen" id="mapa-imagen" alt="Mapa de ${mapa.nombreRegion(region)}">
            ${encima}
        </div>
        <section class="panel">
            <h3 class="subtitulo">${tramo === mapa.CIUDADELA ? "🗿 Los memoriales" : "⚔️ Los señores de la región"}</h3>
            <p class="nota">${tramo === mapa.CIUDADELA
                ? "Cada memorial se enciende cuando caen los cinco señores de su campaña. Su fuego es el único que vuelve a encender la Llama de la Torre."
                : "Son tus jefes de Aventuras: caen con las misiones de su atributo. Al caer, su guarida queda libre y tiene botín."}</p>
            <ul class="lista">${senores.map((s) => fichaSenor(s, region, campanas, porReclamar, dibujo.alcanzado)).join("")}</ul>
        </section>
        ${seccionCronica(estado, campanas, region)}
        <p class="nota">Cada misión, tarea o sesión de enfoque es un paso; cada ${mapa.PASOS_POR_LUGAR} pasos llegas a un lugar:
           💰 tesoros, 🕯️ santuarios (XP para tu atributo más descuidado), ⚔️ guaridas de los señores y, al final, ${ciudadela ? "el brasero de los Vigías" : "la fortaleza"}.</p>`;
}


// ===== El Tratado de la Voluntad (tu pacto) =====

// En Hoy: si no lo has firmado, una invitación; si sí, el día de tu pacto y una cita
// (o una advertencia si ayer fallaste: el artículo III dice «nunca fallar dos días seguidos»).
// ===== La Saga de la Llama (v35) =====
// Tu objetivo de ahora, en Hoy: el acto de la saga que toca y cuánto te falta. Al tocarlo, abre
// Héroe › Historia, donde está la saga completa.
function sagaDe(estado, ctx) {
    return ctx.saga || saga.estadoDeSaga(saga.datosDeSaga(estado, campana.estadoCampanas(estado)));
}

const nombresDeSaga = (estado) => ({ heroe: estado.personaje.nombre, dragon: mascota.nombreDe(estado, mascota.INICIAL) });

function lineaDeSaga(estado, ctx, s) {
    const acto = s.actos[s.indice];
    const titulo = acto ? `Saga · Acto ${acto.numero}: ${acto.titulo}` : `Saga · ${saga.VIGIA.titulo}`;
    const detalle = acto
        ? `${barra((s.avance / s.meta) * 100, "barra-mini")}<span class="mini texto-suave">${s.avance} / ${s.meta}</span>`
        : `<span class="mini texto-suave">Racha de ${plural(ctx.info?.racha?.actual || 0, "día", "días")}</span>`;
    return `
        <button type="button" class="pacto-linea saga-linea" data-accion="subvista" data-pantalla="personaje" data-vista="historia">
            <span class="pacto-linea-icono" aria-hidden="true">🧭</span>
            <span><b>${esc(titulo)}</b>
                <span class="mini">🎯 ${esc(s.objetivo)}</span>
                ${detalle}</span>
        </button>`;
}

// Cómo se abre cada historia (los atributos del botón).
function abrirHistoriaDeSaga(abrir) {
    if (abrir.libro) return `data-accion="${abrir.accion}" data-libro="${abrir.libro}"`;
    if (abrir.accion === "ir") return `data-accion="ir" data-pantalla="${abrir.pantalla}"`;
    if (abrir.accion === "historia-abrir") return `data-accion="historia-abrir" data-lugar="${abrir.lugar}"`;
    return `data-accion="${abrir.accion}"`;
}

// El panel grande de la saga (Héroe › Historia): el objetivo final, el acto de ahora y los siete actos.
function panelSaga(estado, ctx, s) {
    const nombres = nombresDeSaga(estado);
    const acto = s.actos[s.indice];
    let actual;
    if (acto) {
        const historia = saga.HISTORIAS.find((h) => h.id === acto.lee);
        const leer = acto.lee === "pacto"
            ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="pacto">📜 Firmar tu pacto</button>`
            : `<button type="button" class="boton boton-chico boton-secundario" ${abrirHistoriaDeSaga(historia.abrir)}>${historia.icono} Leer: ${esc(historia.titulo)}</button>`;
        actual = `
            <div class="saga-acto">
                <span class="saga-numero">Acto ${acto.numero} de ${s.actos.length}</span>
                <h3>${esc(acto.titulo)}</h3>
                <p class="saga-relato">${esc(saga.conNombres(acto.relato, nombres))}</p>
                <p class="saga-objetivo">🎯 ${esc(acto.objetivo)}</p>
                ${barra((s.avance / s.meta) * 100)}
                <div class="saga-pie"><span class="mini texto-suave">${s.avance} de ${s.meta}</span>${leer}</div>
            </div>`;
    } else {
        actual = `
            <div class="saga-acto saga-vigia">
                <span class="saga-numero">Saga completa</span>
                <h3>🕯️ ${esc(saga.VIGIA.titulo)}</h3>
                <p class="saga-relato">${esc(saga.conNombres(saga.VIGIA.relato, nombres))}</p>
                <p class="saga-objetivo">🎯 ${esc(saga.VIGIA.objetivo)}</p>
            </div>`;
    }
    const actos = s.actos.map((a) => `
        <li class="${a.hecho ? "hecho" : a.actual ? "actual" : "futuro"}">
            <span class="saga-marca" aria-hidden="true">${a.hecho ? "✓" : a.actual ? "▶" : a.numero}</span>
            <span><b>${esc(a.titulo)}</b><small>${a.hecho ? "Cumplido" : !a.actual && a.listo ? "✓ Ya lo lograste: cuenta cuando llegues a este acto." : esc(a.objetivo)}</small></span>
        </li>`).join("");
    return `
        <section class="panel saga">
            <p class="etiqueta">🧭 ${saga.TITULO}</p>
            <p class="saga-final">${esc(saga.OBJETIVO)}</p>
            ${actual}
            <ol class="saga-actos">${actos}</ol>
        </section>`;
}


function lineaDelPacto(estado, ctx) {
    if (!estado.pacto) {
        return `
            <button type="button" class="pacto-linea pacto-invitacion" data-accion="ir" data-pantalla="pacto">
                <span class="pacto-linea-icono" aria-hidden="true">📜</span>
                <span><b>Sella tu pacto</b>
                    <span class="mini">Un juramento contigo mismo, por ti y para ti. Fírmalo con tu dedo.</span></span>
            </button>`;
    }
    const c = pacto.cumplimientoDelPacto(estado, ctx.hoy);
    const cita = pacto.citaDelDia(ctx.hoy);
    const texto = c.ayerFallado && !c.hoyHonrado
        ? "<b>Artículo III:</b> ayer fallaste. Hoy no puede ser el segundo día."
        : `«${cita.texto}» <span class="pacto-autor">— ${cita.autor}</span>`;
    return `
        <button type="button" class="pacto-linea ${c.ayerFallado && !c.hoyHonrado ? "alerta" : ""}" data-accion="ir" data-pantalla="pacto">
            <span class="pacto-linea-icono" aria-hidden="true">📜</span>
            <span><b>Día ${c.dia} de tu pacto</b>${c.porcentaje === null ? "" : ` · ${c.porcentaje} % honrado`}
                <span class="mini pacto-cita">${texto}</span></span>
        </button>`;
}

// El sello de lacre rojo, con la inicial de tu nombre.
function selloDeLacre(nombre) {
    const inicial = esc((Array.from(nombre.trim())[0] || "V").toUpperCase());
    return `
        <svg class="sello-lacre" viewBox="0 0 120 120" role="img" aria-label="Sello de lacre">
            <defs><radialGradient id="lacre" cx="38%" cy="32%" r="72%">
                <stop offset="0" stop-color="#c8323a"/><stop offset=".6" stop-color="#8f1218"/><stop offset="1" stop-color="#560a0e"/>
            </radialGradient></defs>
            <path d="M60 6 C72 4 80 12 90 14 C102 17 112 26 113 40 C115 50 110 58 114 68 C118 82 108 95 96 102 C86 108 78 116 62 114
                     C48 117 38 110 28 104 C14 98 6 86 7 72 C6 62 2 52 8 42 C12 28 22 18 36 12 C44 8 50 7 60 6 Z" fill="url(#lacre)"/>
            <circle cx="60" cy="60" r="36" fill="none" stroke="#560a0e" stroke-width="3" opacity=".7"/>
            <circle cx="60" cy="60" r="31" fill="none" stroke="#e8696f" stroke-width="1" opacity=".45"/>
            <text x="60" y="74" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="700" fill="#45060a"
                  opacity=".85">${inicial}</text>
            <ellipse cx="42" cy="34" rx="15" ry="7" fill="#fff" opacity=".16" transform="rotate(-32 42 34)"/>
        </svg>`;
}

// La firma guardada (un trazo SVG). Solo se dibuja si es un trazo válido.
function dibujoDeFirma(trazo) {
    if (!pacto.firmaValida(trazo)) return "";
    return `<svg class="firma-dibujo" viewBox="0 0 ${pacto.ANCHO_FIRMA} ${pacto.ALTO_FIRMA}" role="img" aria-label="Tu firma">
                <path d="${trazo}" fill="none" stroke="#7a1414" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// La pantalla del pacto: el pergamino con el tratado completo. Si todavía no lo firmaste
// (o lo estás renovando), abajo va el formulario para jurarlo y firmarlo con el dedo.
export function pantallaPacto(estado, ctx) {
    const p = estado.pacto;
    const firmando = !p || ctx.renovandoPacto;
    const nombre = p && !ctx.renovandoPacto ? p.nombre : estado.personaje.nombre;
    const tratamiento = estado.apariencia.cuerpo === "femenino" ? "dama" : "caballero";
    const citaHtml = (c) => `<p class="cita-pacto">«${c.texto}» <span>— ${c.autor}</span></p>`;

    const articulos = pacto.ARTICULOS.map((a, i) => `
        <section class="articulo">
            <h3><span>Artículo ${pacto.ROMANOS[i]}</span> ${a.titulo}</h3>
            <p>${a.texto}</p>
            ${a.conRazon && p?.razon && !ctx.renovandoPacto ? `<p>Y lo hago, sobre todo, por esto: <em class="razon">«${esc(p.razon)}»</em></p>` : ""}
            ${a.cita ? citaHtml(a.cita) : ""}
        </section>`).join("");

    const firma = firmando
        ? `<form data-form="pacto" class="firmar-pacto">
               <label>Mi nombre
                   <input type="text" name="nombre" maxlength="40" required autocomplete="off" value="${esc(nombre)}"></label>
               <label>Mi porqué <span class="opcional">(lo que de verdad me mueve)</span>
                   <textarea name="razon" rows="3" maxlength="${pacto.LARGO_RAZON}"
                             placeholder="Ej: Quiero mirarme al espejo y saber que cumplí mi palabra.">${esc(p?.razon || "")}</textarea></label>
               <p class="firmar-instruccion">Firma con tu dedo:</p>
               <canvas id="pacto-lienzo" class="lienzo-firma" aria-label="Recuadro para firmar"></canvas>
               <input type="hidden" name="firma" id="pacto-firma">
               <button type="button" class="boton-texto" data-accion="pacto-borrar-firma">Borrar la firma</button>
               <label class="jurar"><input type="checkbox" name="juro" required>
                   <span>Juro por mi honor cumplir este pacto, por mí y para mí.</span></label>
               <button type="submit" class="boton boton-sangre boton-ancho">🩸 Sellar con mi sangre</button>
               ${ctx.renovandoPacto ? '<button type="button" class="boton-texto" data-accion="pacto-cancelar">Cancelar</button>' : ""}
           </form>`
        : `<div class="pacto-firmado">
               <div class="firma-y-sello">
                   <div class="firma-bloque">
                       ${dibujoDeFirma(p.firma)}
                       <p class="linea-firma">${esc(p.nombre)}</p>
                   </div>
                   ${selloDeLacre(p.nombre)}
               </div>
               <p class="fecha-pacto">Sellado el ${fechaLegible(p.firmadoEn)}${p.renovaciones
                   ? ` · renovado ${plural(p.renovaciones, "vez", "veces")} · desde el ${fechaCorta(p.primeraVez)}` : ""}</p>
           </div>`;

    // Cómo vas cumpliendo (solo si ya lo firmaste).
    let cumplimiento = "";
    if (p && !ctx.renovandoPacto) {
        const c = pacto.cumplimientoDelPacto(estado, ctx.hoy);
        cumplimiento = `
            <section class="panel">
                <div class="fichas-dato">
                    ${ficha("Tu pacto", `📜 Día ${c.dia}`, `<span class="ficha-nota">Desde el ${fechaCorta(p.primeraVez)}</span>`)}
                    ${ficha("Días honrados", c.porcentaje === null ? "—" : `${c.porcentaje} %`,
                            `<span class="ficha-nota">${c.honrados} de ${plural(c.contados, "día", "días")} con algo cumplido (o de descanso)</span>`)}
                </div>
                ${c.ayerFallado && !c.hoyHonrado ? '<p class="nota alerta-pacto">⚠️ Ayer fallaste. Recuerda el artículo III: hoy no puede ser el segundo día.</p>' : ""}
                <button type="button" class="boton boton-secundario boton-ancho" data-accion="pacto-renovar">Renovar mi juramento</button>
            </section>`;
    }

    return `
        ${encabezado("📜 Tu pacto", "personaje", "Héroe")}
        ${cumplimiento}
        <article class="pergamino">
            <header class="pergamino-cabecera">
                <p class="pergamino-sobre">Pacto de sangre</p>
                <h2>Tratado de la Voluntad</h2>
                <p class="pergamino-entre">entre ${esc(nombre)} y quien ha decidido llegar a ser</p>
            </header>
            <p class="epigrafe">«${pacto.EPIGRAFE.texto}»<br><span>— ${pacto.EPIGRAFE.autor}</span></p>
            <section class="preambulo">${pacto.preambulo(esc(nombre), tratamiento).map((parrafo) => `<p>${parrafo}</p>`).join("")}</section>
            ${articulos}
            <p class="cierre">${pacto.CIERRE}</p>
            <p class="cita-final">«${pacto.CITA_FINAL.texto}»<br><span>— ${pacto.CITA_FINAL.autor}</span></p>
            ${firma}
        </article>`;
}


// ===== Pantalla: Tu libro =====
// ctx.paginaLibro: "portada", "indice" o el número de un capítulo.

export function pantallaLibro(estado, ctx) {
    const capitulos = libro.capitulosDelLibro(estado, ctx.hoy);
    const nombre = estado.pacto?.nombre || estado.personaje.nombre;
    const total = capitulos.length;
    const numero = Number(ctx.paginaLibro);
    const capitulo = capitulos[numero - 1];
    const ir = (pagina, texto, clase = "boton boton-secundario") =>
        `<button type="button" class="${clase}" data-accion="libro-pagina" data-pagina="${pagina}">${texto}</button>`;

    let pagina;
    let navegacion = "";
    if (!total) {
        pagina = `
            <div class="portada">
                <p class="pergamino-sobre">Libro primero</p>
                <h2>La crónica de ${esc(nombre)}</h2>
                <p class="portada-datos">Este libro todavía está en blanco. Cada día que escribas en tu diario será
                   un capítulo, y aquí se irá contando tu historia.</p>
            </div>`;
    } else if (capitulo) {
        pagina = `
            <header class="pergamino-cabecera">
                <p class="pergamino-sobre">Capítulo ${libro.aRomano(capitulo.numero)}</p>
                <h2 class="capitulo-titulo">${esc(capitulo.titulo)}</h2>
                <p class="pergamino-entre">${fechaLegible(capitulo.fecha)}</p>
            </header>
            <div class="capitulo-texto">
                ${capitulo.parrafos.map((p) => (p.tipo === "cita"
                    ? `<blockquote class="capitulo-cita">${esc(p.texto)}</blockquote>`
                    : `<p>${esc(p.texto)}</p>`)).join("")}
            </div>
            <p class="numero-pagina">— ${capitulo.numero} de ${total} —</p>`;
        navegacion = `
            <div class="libro-navegar">
                ${capitulo.numero > 1 ? ir(capitulo.numero - 1, "‹ Anterior") : ir("portada", "‹ Portada")}
                ${ir("indice", "Índice")}
                ${capitulo.numero < total ? ir(capitulo.numero + 1, "Siguiente ›") : '<span class="libro-fin">Continuará…</span>'}
            </div>`;
    } else if (ctx.paginaLibro === "indice") {
        const porMes = new Map();
        for (const c of capitulos) {
            const mes = `${MESES[Number(c.fecha.slice(5, 7)) - 1]} de ${c.fecha.slice(0, 4)}`;
            if (!porMes.has(mes)) porMes.set(mes, []);
            porMes.get(mes).push(c);
        }
        pagina = `
            <header class="pergamino-cabecera"><p class="pergamino-sobre">La crónica de ${esc(nombre)}</p><h2>Índice</h2></header>
            ${[...porMes].map(([mes, lista]) => `
                <h3 class="indice-mes">${mes}</h3>
                <ol class="indice">${lista.map((c) => `
                    <li><button type="button" data-accion="libro-pagina" data-pagina="${c.numero}">
                        <span class="indice-numero">${libro.aRomano(c.numero)}</span>
                        <span class="indice-titulo">${esc(c.titulo)}</span>
                        <span class="indice-fecha">${fechaCorta(c.fecha)}</span>
                    </button></li>`).join("")}</ol>`).join("")}`;
        navegacion = `<div class="libro-navegar">${ir("portada", "‹ Portada")}${ir(1, "Empezar a leer ›")}</div>`;
    } else {
        pagina = `
            <div class="portada">
                <p class="pergamino-sobre">Libro primero</p>
                <h2>La crónica de ${esc(nombre)}</h2>
                <p class="pergamino-entre">El capítulo más nuevo de la ${saga.TITULO}: el que escribes tú, día a día.</p>
                <p class="epigrafe">«${libro.EPIGRAFE.texto}»<br><span>— ${libro.EPIGRAFE.autor}</span></p>
                <p class="portada-datos">${plural(total, "capítulo", "capítulos")} · comenzada el ${fechaLegible(capitulos[0].fecha)}</p>
                <div class="portada-botones">
                    ${ir(1, "Empezar a leer", "boton boton-sangre boton-ancho")}
                    ${total > 1 ? ir(total, "Ir al último capítulo", "boton boton-secundario boton-ancho") : ""}
                    ${ir("indice", "Índice", "boton-texto")}
                    <button type="button" class="boton-texto" data-accion="descargar-libro">⬇️ Descargar el libro</button>
                </div>
            </div>`;
    }

    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">📚 Tu libro</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="diario">‹ Diario</button>
        </div>
        <article class="pergamino libro-pagina">${pagina}</article>
        ${navegacion}`;
}


// ===== Pantalla: Tu diario =====
// ctx: mesDiario ("2026-10"), diaDiario (el día tocado), busquedaDiario, filtroDiario (un ánimo o null), limiteDiario.

const coma = (numero) => String(numero).replace(".", ",");   // 4.2 → "4,2"

export function pantallaDiario(estado, ctx) {
    const total = Object.keys(estado.diario).length;
    const racha = diario.rachaDiario(estado, ctx.hoy);
    const delMes = Object.entries(estado.diario).filter(([fecha]) => fecha.startsWith(ctx.mesDiario)).map(([, e]) => e);
    const promedio = diario.promedioAnimo(delMes);
    const animoMes = promedio === null ? null : ANIMOS_DIARIO[diario.animoDe(promedio)];
    const filtros = [[null, "Todas"], ...Object.entries(ANIMOS_DIARIO).map(([clave, a]) => [clave, a.icono])].map(([clave, texto]) => `
        <button type="button" class="chip ${ctx.filtroDiario === clave ? "chip-activo" : ""}" data-accion="diario-filtro"
                data-animo="${clave || ""}" aria-pressed="${ctx.filtroDiario === clave}"
                aria-label="${clave ? ANIMOS_DIARIO[clave].nombre : "Todas"}">${texto}</button>`).join("");

    return `
        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">📓 Tu diario</h2>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="hoy">‹ Hoy</button>
            </div>
            <div class="fichas-dato">
                ${ficha("Racha", `✍️ ${racha}`, `<span class="ficha-nota">${racha === 1 ? "Día seguido" : "Días seguidos"} escribiendo</span>`)}
                ${ficha("Entradas", total, `<span class="ficha-nota">En total</span>`)}
                ${ficha(`Ánimo de ${MESES[Number(ctx.mesDiario.slice(5)) - 1]}`, animoMes ? animoMes.icono : "—",
                        `<span class="ficha-nota">${animoMes ? `${animoMes.nombre} · ${coma(promedio)} de 5` : "Sin ánimos ese mes"}</span>`)}
            </div>
        </section>

        <button type="button" class="pacto-linea boton-libro" data-accion="ir" data-pantalla="libro" ${total ? "" : "disabled"}>
            <span class="pacto-linea-icono" aria-hidden="true">📚</span>
            <span><b>Leer mi historia como un libro</b>
                <span class="mini">Cada día que escribes es un capítulo de «La crónica de ${esc(estado.pacto?.nombre || estado.personaje.nombre)}».</span></span>
        </button>
        ${calendarioDeAnimo(estado, ctx)}
        ${seccionLoQueDice(estado)}
        ${seccionRecuerdos(estado, ctx)}

        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">Todas tus entradas</h2>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="descargar-diario" ${total ? "" : "disabled"}>⬇️ Descargar</button>
            </div>
            <input type="search" id="diario-buscar" class="diario-buscar" placeholder="🔍 Buscar en tu diario…"
                   value="${esc(ctx.busquedaDiario)}" autocomplete="off" aria-label="Buscar en tu diario">
            <div class="chips filtros-animo" role="group" aria-label="Filtrar por ánimo">${filtros}</div>
            <div id="diario-lista">${listaDiario(estado, ctx)}</div>
        </section>`;
}

// El mes con un cuadrito por día, del color de tu ánimo. Tocar un día muestra su entrada.
function calendarioDeAnimo(estado, ctx) {
    const mes = ctx.mesDiario;
    const [anio, numero] = mes.split("-").map(Number);
    const mesVecino = (salto) => {
        const total = anio * 12 + (numero - 1) + salto;
        return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
    };
    const anterior = mesVecino(-1);
    const siguiente = mesVecino(1);
    const celdas = diario.mesDeAnimo(estado, mes, ctx.hoy).map((c) => {
        if (!c) return '<span class="dia-animo hueco"></span>';
        const a = c.animo ? ANIMOS_DIARIO[c.animo] : null;
        const numeroDia = Number(c.fecha.slice(8));
        if (c.futuro) return `<span class="dia-animo futuro">${numeroDia}</span>`;
        const clases = ["dia-animo", c.escrito ? "escrito" : "", a ? "con-animo" : "",
                        c.fecha === ctx.hoy ? "hoy" : "", c.fecha === ctx.diaDiario ? "elegido" : ""];
        return `<button type="button" class="${clases.join(" ")}" ${a ? `style="--color-animo: ${a.color}"` : ""}
                        data-accion="diario-dia" data-fecha="${c.fecha}"
                        aria-label="${fechaLegible(c.fecha)}${a ? `: ${a.nombre}` : c.escrito ? ": escrito" : ""}">${numeroDia}</button>`;
    }).join("");
    const leyenda = Object.values(ANIMOS_DIARIO).map((a) => `<i class="celda" style="background: ${a.color}"></i><span>${a.icono}</span>`).join("");

    return `
        <section class="panel">
            <div class="titulo-seccion mes-navegar">
                <button type="button" class="boton-icono" data-accion="diario-mes" data-mes="${anterior}" aria-label="Mes anterior">‹</button>
                <h2 class="titulo-juego">${MESES[numero - 1]} ${anio}</h2>
                <button type="button" class="boton-icono" data-accion="diario-mes" data-mes="${siguiente}" aria-label="Mes siguiente"
                        ${siguiente > ctx.hoy.slice(0, 7) ? "disabled" : ""}>›</button>
            </div>
            <div class="mes-animo">
                ${DIAS_LETRAS.map((letra) => `<span class="mes-letra">${letra}</span>`).join("")}
                ${celdas}
            </div>
            <div class="cal-leyenda">${leyenda}</div>
            <div id="diario-detalle">${detalleEntrada(estado, ctx.diaDiario)}</div>
        </section>`;
}

// La entrada del día tocado en el calendario (app.js la cambia sin redibujar todo).
export function detalleEntrada(estado, fecha) {
    if (!fecha) return '<p class="nota">Toca un día para leer lo que escribiste.</p>';
    const entrada = estado.diario[fecha];
    if (!entrada) return `<p class="nota"><b>${fechaLegible(fecha)}</b>: no escribiste ese día.</p>`;
    return tarjetaEntrada(fecha, entrada);
}

function tarjetaEntrada(fecha, e) {
    const a = e.animo ? ANIMOS_DIARIO[e.animo] : null;
    return `
        <article class="entrada" ${a ? `style="--color-animo: ${a.color}"` : ""}>
            <header class="entrada-cabecera">
                <span class="entrada-animo" aria-hidden="true">${a ? a.icono : "📓"}</span>
                <b>${fechaLegible(fecha)}</b>
                ${a ? `<span class="mini texto-suave">${a.nombre}</span>` : ""}
            </header>
            ${e.texto ? `${e.pregunta ? `<p class="entrada-pregunta">${esc(e.pregunta)}</p>` : ""}<p class="entrada-texto">${esc(e.texto)}</p>` : ""}
            ${e.gratitud ? `<p class="entrada-gratitud">🙏 ${esc(e.gratitud)}</p>` : ""}
        </article>`;
}

// Lo que tu diario dice de ti: tu ánimo y tus misiones, y tu mejor día de la semana.
function seccionLoQueDice(estado) {
    const d = diario.loQueDiceTuDiario(estado);
    const titulo = '<h2 class="titulo-juego">🔎 Lo que dice tu diario</h2>';
    if (!d.suficiente) {
        return `<section class="panel">${titulo}
            <p class="nota">Marca cómo te fue ${plural(d.faltan, "día más", "días más")} y aquí verás cómo se relaciona
               tu ánimo con tus misiones.</p></section>`;
    }
    const lineas = [];
    const { cumpliendo: c, sinCumplir: s } = d;
    if (c.promedio !== null && s.promedio !== null) {
        const ca = ANIMOS_DIARIO[diario.animoDe(c.promedio)];
        const sa = ANIMOS_DIARIO[diario.animoDe(s.promedio)];
        const diferencia = c.promedio - s.promedio;
        if (Math.abs(diferencia) < 0.3) {
            lineas.push(`Tu ánimo es parecido los días que cumples todas tus misiones (${ca.icono} ${coma(c.promedio)})
                         y los que no (${sa.icono} ${coma(s.promedio)}).`);
        } else if (diferencia > 0) {
            lineas.push(`Los días que cumples todas tus misiones te sientes mejor: ${ca.icono} <b>${coma(c.promedio)}</b> de 5,
                         contra ${sa.icono} ${coma(s.promedio)} los demás días.`);
        } else {
            lineas.push(`Los días que cumples todo te sientes peor (${ca.icono} ${coma(c.promedio)} contra ${sa.icono} ${coma(s.promedio)}).
                         ¿Te estás exigiendo demasiado?`);
        }
    } else {
        lineas.push("Todavía faltan días con y sin todas tus misiones hechas para comparar tu ánimo.");
    }
    if (d.mejorDia) {
        const a = ANIMOS_DIARIO[diario.animoDe(d.mejorDia.promedio)];
        lineas.push(`Tu mejor día de la semana es el <b>${NOMBRE_DIA[d.mejorDia.dia]}</b> (${a.icono} ${coma(d.mejorDia.promedio)} de 5).`);
    }
    return `<section class="panel">${titulo}
        <ul class="semana-lista">${lineas.map((l) => `<li>${l}</li>`).join("")}</ul>
        <p class="mini texto-suave">Según ${plural(d.total, "día", "días")} en que marcaste tu ánimo.</p></section>`;
}

// Recuerdos: lo que escribiste hace una semana, un mes y un año.
function seccionRecuerdos(estado, ctx) {
    const lista = diario.recuerdos(estado, ctx.hoy);
    if (!lista.length) return "";
    return `<section class="panel"><h2 class="titulo-juego">🕰️ Recuerdos</h2>
        ${lista.map((r) => `<p class="etiqueta recuerdo-titulo">${r.titulo}</p>${tarjetaEntrada(r.fecha, r.entrada)}`).join("")}</section>`;
}

// La lista de entradas (con la búsqueda y el filtro). app.js la cambia sola mientras escribes en el buscador.
export function listaDiario(estado, ctx) {
    const entradas = diario.buscarEntradas(estado, { texto: ctx.busquedaDiario, animo: ctx.filtroDiario });
    if (!entradas.length) {
        return vacio(Object.keys(estado.diario).length
            ? "No hay entradas con esa búsqueda."
            : "Todavía no has escrito nada. Empieza hoy: el diario está al final de la pantalla Hoy.");
    }
    const faltan = entradas.length - ctx.limiteDiario;
    return entradas.slice(0, ctx.limiteDiario).map((e) => tarjetaEntrada(e.fecha, e)).join("") +
        (faltan > 0 ? `<button type="button" class="boton boton-secundario boton-ancho" data-accion="diario-mas">Ver más (${faltan})</button>` : "");
}

// La tarjeta «Tu semana»: aparece al empezar una semana nueva con el resumen de la anterior.
function tarjetaSemana(estado, ctx) {
    if (!ctx.semanaPendiente) return "";
    const s = resumenSemana(estado, ctx.semanaPendiente);
    const lineas = [];

    if (s.desafio) {
        lineas.push(s.desafio.cobrado
            ? `🎁 Desafío cumplido: ${esc(s.desafio.texto)}.`
            : `🎯 Desafío: ${esc(s.desafio.texto)} (llegaste a ${Math.min(s.desafio.progreso, s.desafio.meta)} de ${s.desafio.meta}).`);
    }
    if (s.semanales.length) {
        lineas.push(`🗓️ Metas semanales: ${s.semanales.map((m) =>
            `${esc(m.nombre)} ${m.hechas}/${m.meta}${m.cumplida ? " ✓" : ""}`).join(" · ")}`);
    }
    if (s.tareas) lineas.push(`📌 ${plural(s.tareas, "tarea hecha", "tareas hechas")}.`);
    if (s.enfoque.sesiones) {
        lineas.push(`⏱️ ${plural(s.enfoque.sesiones, "sesión", "sesiones")} de enfoque (${s.enfoque.minutos} min).`);
    }
    // (v66) El gimnasio de esa semana.
    const diasGym = gymReglas.diasDeLaSemana(estado.gym.sesiones, s.lunes);
    if (diasGym) lineas.push(`🏋️ Gimnasio: ${plural(diasGym, "día", "días")} de ${estado.gym.metaSemanal}${diasGym >= estado.gym.metaSemanal ? " ✓" : ""}.`);
    const animos = Object.entries(s.animos).filter(([, n]) => n > 0);
    if (animos.length) {
        lineas.push(`📓 Tu ánimo: ${animos.map(([clave, n]) => `${ANIMOS_DIARIO[clave].icono} ${n}`).join(" · ")}`);
    }
    if (s.descuidado) {
        const a = ATRIBUTOS[s.descuidado];
        lineas.push(`⚠️ El atributo más descuidado: ${a.icono} ${a.nombre}.`);
    }

    return `
        <section class="panel semana">
            <div class="titulo-seccion">
                <div>
                    <p class="etiqueta">Del ${fechaCorta(s.lunes)} al ${fechaCorta(s.domingo)}</p>
                    <h2 class="titulo-juego">📊 Tu semana pasada</h2>
                </div>
                <button type="button" class="boton-icono" data-accion="cerrar-semana" aria-label="Cerrar el resumen">${ICONOS.cerrar}</button>
            </div>
            <div class="fichas-dato">
                ${ficha("Cumplimiento", s.cumplimiento.pct === null ? "—" : `${s.cumplimiento.pct} %`,
                        textoCambio(s.cambio, "puntos", "la semana anterior"))}
                ${ficha("Misiones hechas", s.completadas, `<span class="ficha-nota">+${s.xp} XP</span>`)}
                ${ficha("Días perfectos", `${s.perfectos} <small>de ${s.diasConMisiones}</small>`,
                        `<span class="ficha-nota">Con todas las misiones hechas</span>`)}
                ${ficha("Tu mejor día", s.mejorDia ? NOMBRE_DIA[s.mejorDia.dia] : "—",
                        `<span class="ficha-nota">${s.mejorDia ? `${s.mejorDia.pct} % cumplido` : "Sin misiones hechas"}</span>`)}
            </div>
            ${lineas.length ? `<ul class="semana-lista">${lineas.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="revisar-semana">📝 Hacer mi revisión de la semana</button>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="cerrar-semana">¡A por esta semana!</button>
        </section>`;
}

// El contenido de la ventana «Revisión semanal»: dos preguntas y la elección de hasta 3 misiones de foco.
export function contenidoRevision(estado, lunes, hoy) {
    const pista = resumen.pistaDeFallas(estado, lunes);
    const misiones = resumen.misionesParaFoco(estado, hoy);
    const previa = estado.revisiones[lunes];   // si ya la hiciste, se puede corregir
    const marcadas = new Set(previa ? previa.foco : []);
    return `
        <h2 class="titulo-juego" tabindex="-1" autofocus>📝 Revisión semanal</h2>
        <p class="nota">Del ${fechaCorta(lunes)} al ${fechaCorta(sumarDias(lunes, 6))}. Tómate un minuto: lo que escribas te ayuda a decidir la semana que empieza.</p>
        <input type="hidden" name="lunes" value="${lunes}">
        <label>¿Qué salió bien?
            <textarea name="bien" rows="2" maxlength="500" placeholder="Ej: fui al gym 4 veces">${esc(previa?.bien || "")}</textarea>
        </label>
        ${pista ? `<p class="nota">💡 ${plural(pista.total, "misión fallada", "misiones falladas")} esa semana` +
            (pista.mision ? `; la que más: «${esc(pista.mision)}» (${pista.veces})` : "") +
            (pista.motivo ? `. Motivo más repetido: ${pista.motivo.icono} ${esc(pista.motivo.nombre)}` : "") + `.</p>` : ""}
        <label>¿Qué quieres mejorar?
            <textarea name="mejorar" rows="2" maxlength="500" placeholder="Ej: dormirme antes de las 11">${esc(previa?.mejorar || "")}</textarea>
        </label>
        ${misiones.length ? `
        <fieldset class="opciones opciones-1">
            <legend>Misiones de foco para esta semana <span class="texto-suave">(elige hasta ${resumen.MAX_FOCO})</span></legend>
            ${misiones.map((m) => `
                <label class="pildora"><input type="checkbox" name="foco" value="${m.id}" ${marcadas.has(m.id) ? "checked" : ""}>
                    <span>${esc(m.nombre)}</span></label>`).join("")}
        </fieldset>` : `<p class="nota">Aún no tienes misiones para elegir como foco.</p>`}
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="cerrar">Cancelar</button>
            <button type="submit" class="boton boton-principal">Guardar revisión</button>
        </div>`;
}

// «⭐ Foco de la semana»: las misiones que elegiste en tu revisión, con una marca si hoy ya las hiciste.
function tarjetaFoco(estado, ctx) {
    const foco = resumen.focoDeLaSemana(estado, ctx.hoy);
    if (!foco.length) return "";
    const hechasHoy = new Set(estado.completadas.filter((c) => c.fecha === ctx.hoy).map((c) => c.misionId));
    return `
        <section class="panel foco" aria-label="Foco de la semana">
            <p class="etiqueta">⭐ Foco de la semana</p>
            <ul class="semana-lista">${foco.map((m) =>
                `<li>${hechasHoy.has(m.id) ? "✅" : "▫️"} ${esc(m.nombre)}</li>`).join("")}</ul>
        </section>`;
}

// Texto del ánimo del avatar, con los números del momento.
function textoAnimo(a, ctx) {
    const animo = avatar.ANIMOS[a.animo];
    if (a.animo === "llamas") return `${animo.icono} ¡En llamas! Racha de ${ctx.info.racha.actual} días.`;
    if (a.animo === "dormido") return `${animo.icono} Zzz… ${a.diasSinMision} días sin misiones. Completa una para despertarlo.`;
    if (a.animo === "caido") return `${animo.icono} Cayó en combate. Llega a ${ctx.vida.levantarse} ❤️ para levantarlo.`;
    return `${animo.icono} ${animo.texto}`;
}

// La barra de vida del héroe (la usan la tarjeta de Hoy y la pantalla Personaje).
// Va con <span> (no <div>) porque puede ir dentro de un botón.
function barraDeVida(v) {
    const e = vida.ESTADOS[v.nivel];
    return `
        <span class="vida-linea">
            <b class="vida-numero">❤️ ${v.puntos} / ${v.maxima}</b>
            <span class="vida-estado salud-${v.nivel}">${e.icono} ${e.nombre}${v.enForma ? " · +10 %" : ""}</span>
        </span>
        <span class="barra barra-salud salud-${v.nivel}"><span class="barra-relleno" style="width: ${v.porcentaje}%"></span></span>`;
}

// La barra de armadura (v24): cuánto te protege cuando fallas una misión.
// La parte gris es tu máximo (lo que dan tu ropa y tus objetos de protección) y la azul, lo que
// te queda ahora. La barra entera son 100 puntos.
function barraDeArmadura(a) {
    const cambio = Math.round(Math.abs(1 - a.factor) * 100);
    const efecto = !cambio ? "si fallas, el daño normal"
        : a.factor < 1 ? `si fallas, ${cambio} % menos daño` : `si fallas, ${cambio} % más daño`;
    return `
        <span class="vida-linea">
            <b class="armadura-numero">🛡️ ${a.puntos} / ${a.maxima}</b>
            <span class="armadura-efecto ${a.factor > 1 ? "peor" : "mejor"}">${efecto}</span>
        </span>
        <span class="barra barra-armadura">
            <span class="barra-capacidad" style="width: ${a.maxima}%"></span>
            <span class="barra-relleno" style="width: ${a.puntos}%"></span>
        </span>`;
}

// Debajo de la barra: qué te pasará hoy (o por qué estás así).
function notaDeVida(estado, ctx) {
    const v = ctx.vida;
    if (juego.enDescanso(estado, ctx.hoy)) return "🏖️ Modo descanso: hoy no pierdes vida.";
    if (v.caido) return `Tienda y arcade cerrados hasta llegar a ${v.levantarse} ❤️. Cada misión te cura.`;
    const pendiente = v.pendienteHoy;
    const ayer = v.registro.find((r) => r.fecha === sumarDias(ctx.hoy, -1));
    const partes = [];
    if (pendiente) partes.push(`Si no terminas hoy: <b class="vida-menos">−${pendiente} ❤️</b>`);
    else if (juego.misionesDelDia(estado.misiones, ctx.hoy).length) partes.push("Hoy ya no pierdes vida. ✓");
    if (ayer?.dano) partes.push(`Ayer: −${ayer.dano} ❤️ (¿lo hiciste? márcalo en «Ayer»)`);
    return partes.join(" · ");
}

// Tu héroe arriba de "Hoy" (en pequeño: la vida y la armadura ya están en la cabecera y en la
// pestaña Héroe). Salta cuando completas una misión. Debajo, tus 4 rivales: el jefe de cada campaña
// con su vida (antes era la lista «En combate», al final de la pantalla).
function tarjetaHeroe(estado, ctx, { conRivales = true } = {}) {
    const a = ctx.avatar;
    const racha = ctx.info.racha;
    const nota = notaDeVida(estado, ctx);
    return `
        <section class="panel heroe-hoy">
            <button type="button" class="heroe ${ctx.recienHecha ? "atacar" : ""}" data-accion="ir" data-pantalla="personaje">
                <span class="heroe-avatar">${dibujarAvatar(a)}</span>
                <span class="heroe-info">
                    <span class="etiqueta">${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</span>
                    <span class="heroe-animo">${textoAnimo(a, ctx)}</span>
                    <span class="chips chips-heroe">
                        <span class="chip chip-racha">🔥 ${plural(racha.actual, "día", "días")}</span>
                        <span class="chip">🛡️ ${racha.escudos}/${ESCUDOS.maximo}</span>
                        ${ctx.vida.enForma ? '<span class="chip chip-oro">✨ En forma</span>' : ""}
                    </span>
                    ${nota ? `<span class="mini texto-suave">${nota}</span>` : ""}
                </span>
            </button>
            ${conRivales ? rivalesDeHoy(estado, ctx) : ""}
        </section>`;
}

// (v52) Si el jefe vive en una región a la que tu héroe aún no llega: dónde está, cuánto falta y el daño guardado.
function notaJefeEsperando(c) {
    if (!c.esperando) return "";
    const faltan = Math.max(0, c.region * mapa.PASOS_POR_LUGAR * mapa.LUGARES_POR_REGION - c.pasosHeroe);
    return `<span class="mini jefe-esperando">🔒 Te espera en ${esc(mapa.nombreRegion(c.region))}: te faltan ${plural(faltan, "paso", "pasos")} en el mapa.
                ${c.guardado ? `Daño guardado: ⚔️ ${c.guardado}, lo recibe al llegar.` : ""}</span>`;
}

// (v52) El resumen de tus rivales en la pestaña Aurelio de Hoy: cada jefe con su nombre, su vida y si te espera más adelante.
function resumenRivales(estado, ctx) {
    const campanas = Object.values(campana.estadoCampanas(estado));
    return `
        <section class="panel rivales-resumen" aria-label="Tus rivales">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">⚔️ Tus rivales</h2>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="aventuras">Ver campaña ›</button>
            </div>
            <ul class="lista rivales-lista">
                ${campanas.map((c) => {
                    const a = juego.ATRIBUTOS[c.categoria];
                    const dano = (ctx.golpes || {})[c.categoria] || 0;
                    return `
                        <li class="rival-fila ${dano ? "golpeado" : ""}" style="--color-attr: ${a.color}">
                            <span class="rival-retrato">${retratoJefe(c.jefe, campana.estadoVisual(c.porcentaje), "mini", dano)}</span>
                            <span class="rival-datos">
                                <b>${esc(c.jefe.nombre)}</b>
                                <span class="mini texto-suave">${a.icono} ${a.nombre} · Jefe ${c.indice + 1}/5${c.ronda > 1 ? ` · Ronda ${c.ronda}` : ""}</span>
                                ${barra(c.porcentaje, "barra-vida barra-mini")}
                                <span class="mini">${c.vida} / ${c.vidaMax} ❤️</span>
                                ${notaJefeEsperando(c)}
                            </span>
                        </li>`;
                }).join("")}
            </ul>
        </section>`;
}

// Los 4 jefes que peleas ahora, en una fila. Si acabas de golpear a uno, se nota.
function rivalesDeHoy(estado, ctx) {
    const campanas = Object.values(campana.estadoCampanas(estado));
    if (!campanas.length) return "";
    return `
        <button type="button" class="rivales" data-accion="ir" data-pantalla="aventuras" aria-label="Tus rivales: ver la campaña de jefes">
            <span class="rivales-titulo">⚔️ Rivales</span>
            ${campanas.map((c) => {
                const dano = (ctx.golpes || {})[c.categoria] || 0;
                const a = juego.ATRIBUTOS[c.categoria];
                return `<span class="rival ${dano ? "golpeado" : ""}" title="${esc(c.jefe.nombre)} · ${a.nombre}">
                            <span class="rival-retrato">${retratoJefe(c.jefe, campana.estadoVisual(c.porcentaje), "mini", dano)}</span>
                            ${barra(c.porcentaje, "barra-vida barra-mini")}
                            <span class="rival-icono" aria-hidden="true">${c.esperando ? "🔒" : a.icono}</span>
                        </span>`;
            }).join("")}
        </button>`;
}

// Si las notificaciones se cortaron en este iPhone, un aviso para reactivarlas.
function avisoNotificaciones(ctx) {
    if (ctx.problemaAvisos === "bloqueadas") {
        return `<div class="aviso-respaldo aviso-alerta"><span>🔕 El iPhone bloqueó las notificaciones de Vida RPG.
                    Actívalas en Ajustes del iPhone → Notificaciones → Vida RPG.</span></div>`;
    }
    if (ctx.problemaAvisos === "desconectadas") {
        return `<div class="aviso-respaldo aviso-alerta"><span>🔕 Tus notificaciones dejaron de funcionar en este iPhone.</span>
                    <button type="button" class="boton boton-chico" data-accion="reactivar-avisos">Reactivar</button></div>`;
    }
    return "";
}

// En modo descanso, un aviso arriba de las misiones (con el botón para terminarlo).
function avisoDescanso(estado, ctx) {
    const descanso = juego.descansoDe(estado, ctx.hoy);
    if (!descanso) return "";
    const hasta = descanso.hasta === ctx.hoy ? "hoy" : `el ${DIAS_CORTOS[diaDeSemana(descanso.hasta)]} ${fechaCorta(descanso.hasta)}`;
    return `
        <div class="aviso-respaldo aviso-descanso">
            <span>🏖️ <b>Modo descanso</b> hasta ${hasta}. No pierdes vida ni racha, y no llegan recordatorios. Si quieres, igual puedes marcar misiones.</span>
            ${descanso.hasta === ctx.hoy ? "" : '<button type="button" class="boton boton-chico" data-accion="terminar-descanso">Terminar</button>'}
        </div>`;
}

// Ajustes → Modo descanso.
export function seccionDescanso(estado, hoy) {
    const descanso = juego.descansoDe(estado, hoy);
    if (descanso) {
        return `
            <p class="nota">Estás descansando hasta el <b>${fechaLegible(descanso.hasta)}</b>. Esos días no pierdes vida
               ni se rompe tu racha, y no llegan recordatorios.</p>
            ${descanso.hasta === hoy
                ? '<p class="nota">Termina hoy: desde mañana todo vuelve a contar.</p>'
                : '<button type="button" class="boton boton-secundario" data-accion="terminar-descanso">Terminar el descanso</button>'}`;
    }
    const maximo = sumarDias(hoy, vida.VIDA.descansoMaximo - 1);
    return `
        <p class="nota">Para vacaciones o días enfermo: hasta ${vida.VIDA.descansoMaximo} días sin perder vida ni racha,
           y sin recordatorios. Empieza hoy.</p>
        <form data-form="descanso" class="form-linea">
            <label class="campo-fecha"><span class="mini texto-suave">Hasta el día (incluido)</span>
                <input type="date" name="hasta" value="${sumarDias(hoy, 2)}" min="${hoy}" max="${maximo}" required></label>
            <button type="submit" class="boton boton-chico">Descansar</button>
        </form>`;
}

function avisoRespaldo() {
    return `
        <div class="aviso-respaldo">
            <span>💾 Tus datos viven solo en este teléfono. Activa la copia en la nube o exporta una copia.</span>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="ajustes">Ir a ajustes</button>
        </div>`;
}


// ===== Pantalla: Progreso (racha, calendario y atributos) =====

export function pantallaProgreso(estado, ctx) {
    const vista = ctx.subvista?.progreso || "numeros";
    const selector = selectorSecciones("progreso", [["numeros", "📊 Tu progreso"], ["logros", "🏆 Logros"]], vista);
    if (vista === "logros") return `${selector}${pantallaLogros(estado, ctx)}`;

    const { racha, diasPerfectos } = ctx.info;
    const escudos = Array.from({ length: ESCUDOS.maximo }, (_, i) =>
        `<span class="escudo ${i < racha.escudos ? "lleno" : ""}">🛡️</span>`).join("");
    const numero = (valor, texto) => `<div><b>${valor}</b><span>${texto}</span></div>`;

    return `
        ${selector}
        <section class="panel">
            <h2 class="titulo-juego">🔥 Racha</h2>
            <div class="racha-datos">
                <div><span class="racha-numero">🔥 ${racha.actual}</span><span class="etiqueta">Actual</span></div>
                <div><span class="racha-numero">🏅 ${racha.mejor}</span><span class="etiqueta">Mejor</span></div>
                <div><span class="racha-numero escudos">${escudos}</span><span class="etiqueta">Escudos</span></div>
            </div>
            <p class="nota">Un día cuenta si completas al menos 1 misión. Cada ${ESCUDOS.diasParaGanar} días seguidos
               ganas un escudo (máx. ${ESCUDOS.maximo}): si fallas un día, el escudo salva tu racha.</p>
            <!-- Los totales de siempre (antes eran otro panel, «Estadísticas») -->
            <div class="numeros">
                ${numero(ctx.info.totalCompletadas, "misiones")}
                ${numero(diasPerfectos, "días perfectos")}
                ${numero(ctx.info.principalesCompletadas, "principales")}
                ${numero(ctx.info.jefesDerrotados, "jefes vencidos")}
                ${numero(estado.canjes.length, "premios canjeados")}
                ${numero(estado.personaje.xp, "XP total")}
            </div>
        </section>

        ${seccionResumen(estado, ctx)}

        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">🗓️ Calendario</h2>
                <span class="texto-suave mini">✨ ${plural(diasPerfectos, "día perfecto", "días perfectos")}</span>
            </div>
            ${mapaDeCalor(estado, ctx)}
            <div class="cal-leyenda">
                <span>Menos</span>
                <i class="celda n0"></i><i class="celda n1"></i><i class="celda n2"></i><i class="celda n3"></i><i class="celda n4"></i>
                <span>Más</span>
                <i class="celda n0 protegido"></i><span>Escudo</span>
                ${estado.descansos.length ? '<i class="celda n0 descanso"></i><span>Descanso</span>' : ""}
            </div>
            <p class="cal-detalle" id="cal-detalle">${detalleDia(estado, ctx.diaSeleccionado, racha)}</p>
        </section>

        <section class="panel">
            <h2 class="titulo-juego">💪 Atributos</h2>
            <p class="nota">Tu clase es tu atributo más alto: ahora eres <b>${ctx.avatar.clase.icono} ${ctx.avatar.clase.nombre}</b>.
               Cada atributo cambia algo de tu avatar en los niveles 3 y 6.</p>
            <div class="atributos">${Object.keys(ATRIBUTOS).map((clave) => tarjetaAtributo(estado, clave)).join("")}</div>
            ${seccionAtributosPropios(estado)}
        </section>`;
}

function mapaDeCalor(estado, ctx) {
    const { dias, semanas } = juego.datosCalendario(estado, ctx.hoy, ctx.info.racha);

    // Etiquetas de los meses: se ponen en la semana donde empieza cada mes.
    const meses = [];
    for (let semana = 0; semana < semanas; semana++) {
        const semanaDias = dias.slice(semana * 7, semana * 7 + 7);
        const inicioDeMes = semanaDias.find((d) => desdeTexto(d.fecha).getDate() === 1);
        const mes = inicioDeMes ? MESES_CORTOS[desdeTexto(inicioDeMes.fecha).getMonth()] : "";
        meses.push(`<span>${mes}</span>`);
    }

    const celdas = dias.map((dia) => {
        if (dia.tipo === "futuro") return '<span class="celda futuro"></span>';
        if (dia.tipo === "antes") return '<span class="celda antes"></span>';
        const clases = ["celda", `n${dia.nivel}`];
        if (dia.protegido) clases.push("protegido");
        if (dia.descanso) clases.push("descanso");
        if (dia.fecha === ctx.hoy) clases.push("hoy");
        if (dia.fecha === ctx.diaSeleccionado) clases.push("elegido");
        return `<button type="button" class="${clases.join(" ")}" data-accion="ver-dia" data-fecha="${dia.fecha}"
                    aria-label="${fechaLegible(dia.fecha)}: ${dia.hechas} de ${dia.total}"></button>`;
    }).join("");

    return `
        <div class="calendario-scroll" id="calendario-scroll">
            <div class="calendario">
                <span></span>
                <div class="cal-meses">${meses.join("")}</div>
                <div class="cal-dias"><span>L</span><span></span><span>X</span><span></span><span>V</span><span></span><span>D</span></div>
                <div class="cal-grid">${celdas}</div>
            </div>
        </div>`;
}

// Texto que aparece al tocar un día del calendario.
export function detalleDia(estado, fecha, racha) {
    if (!fecha) return "Toca un día del calendario para ver qué hiciste.";

    const hechas = estado.completadas.filter((c) => c.fecha === fecha);
    // "X de Y" cuenta solo las que tocaban ese día (las semanales se nombran, pero no suman a Y).
    const hechasDia = new Map([[fecha, new Set(hechas.map((c) => c.misionId))]]);
    const { hechas: cumplidas, total } = juego.cumplimientoDelDia(estado.misiones, fecha, hechasDia);
    const nombres = hechas.map((c) => {
        const mision = estado.misiones.find((m) => m.id === c.misionId);
        return esc(mision ? mision.nombre : "misión borrada");
    });
    let protegido = racha.protegidos.has(fecha) ? " · 🛡️ protegido por un escudo" : "";
    if (juego.enDescanso(estado, fecha)) protegido += " · 🏖️ descanso";
    const tareas = estado.tareas.filter((t) => t.hechaEn === fecha).map((t) => esc(t.nombre));
    const minutos = estado.enfoque.sesiones.filter((s) => s.fecha === fecha).reduce((suma, s) => suma + s.minutos, 0);
    const entrada = estado.diario[fecha];

    let texto = `<strong>${fechaLegible(fecha)}</strong>: ${cumplidas} de ${total}${protegido}`;
    if (nombres.length) texto += `<br><span class="texto-suave">${nombres.join(" · ")}</span>`;
    if (tareas.length) texto += `<br><span class="texto-suave">📌 ${tareas.join(" · ")}</span>`;
    if (minutos) texto += `<br><span class="texto-suave">⏱️ ${minutos} min de enfoque</span>`;
    if (entrada) {
        const icono = entrada.animo ? ANIMOS_DIARIO[entrada.animo].icono : "📓";
        texto += `<br>${icono} ${entrada.texto ? `«${esc(entrada.texto)}»` : ""}`;
        if (entrada.gratitud) texto += `<br>🙏 ${esc(entrada.gratitud)}`;
    }
    return texto;
}

// Tus atributos: para lo específico. Cada uno tiene su nivel y le suma a uno de los 4.
// Tocar uno abre la ventana para editarlo.
function seccionAtributosPropios(estado) {
    const propios = estado.atributosPropios;
    const tarjetas = propios.map((p) => {
        const n = juego.nivelDePropio(estado, p.id);
        const base = ATRIBUTOS[p.base];
        const usos = estado.misiones.filter((m) => m.atributoPropio === p.id && !m.archivadaEn).length;
        return `
            <div class="atributo atributo-propio" style="--color-atributo: ${p.color}" data-accion="editar-atributo" data-id="${p.id}"
                 role="button" aria-label="Editar ${esc(p.nombre)}">
                <div class="atributo-cabecera">
                    <span class="atributo-icono">${esc(p.icono)}</span>
                    <span class="atributo-nombre">${esc(p.nombre)}</span>
                    <span class="atributo-nivel">Nv ${n.nivel}</span>
                </div>
                ${barra(n.porcentaje, "barra-mini barra-atributo")}
                <span class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP</span>
                <span class="mini texto-suave">Suma a ${base.icono} ${base.nombre} · ${plural(usos, "misión", "misiones")}</span>
            </div>`;
    }).join("");
    const lleno = propios.length >= juego.MAX_ATRIBUTOS_PROPIOS;
    return `
        <div class="titulo-seccion titulo-propios">
            <h3 class="subtitulo">✨ Tus atributos</h3>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="atributo" ${lleno ? "disabled" : ""}>+ Nuevo</button>
        </div>
        ${propios.length
            ? `<div class="atributos">${tarjetas}</div>`
            : vacio("Crea atributos para lo específico: Programación, Inglés, Salud, tu emprendimiento…<br>Cada uno tiene su propio nivel y también sube uno de los 4.")}`;
}

function tarjetaAtributo(estado, clave) {
    const a = ATRIBUTOS[clave];
    const n = juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO);
    // Lo que cambia en tu avatar en los niveles 3 y 6.
    const rasgos = avatar.RASGOS[clave].map((u) => {
        const tiene = n.nivel >= u.nivel;
        return `<li class="${tiene ? "tiene" : ""}">${tiene ? "✓" : "🔒"} ${u.texto}${tiene ? "" : ` <small>Nv ${u.nivel}</small>`}</li>`;
    }).join("");
    return `
        <div class="atributo" style="--color-atributo: ${a.color}">
            <div class="atributo-cabecera">
                <span class="atributo-icono">${a.icono}</span>
                <span class="atributo-nombre">${a.nombre}</span>
                <span class="atributo-nivel">Nv ${n.nivel}</span>
            </div>
            ${barra(n.porcentaje, "barra-mini barra-atributo")}
            <span class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP</span>
            <ul class="atributo-rasgos">${rasgos}</ul>
        </div>`;
}


// ===== Resumen con gráficas (dentro de Progreso) =====
// Reglas que seguimos en las gráficas:
//   - Un solo color para los datos (el violeta de la app, comprobado sobre el fondo oscuro).
//   - Columnas delgadas, con la punta redondeada y la base recta.
//   - Los textos van en color de texto, nunca en el color de la gráfica.
//   - Todo valor se puede leer sin la gráfica: tocando una columna o en "Ver como tabla".

const COLOR_DATO = "#8b5cf6";       // el color de las barras
const COLOR_APAGADO = "#4a4468";    // barras que no son las destacadas
const NOMBRE_DIA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function seccionResumen(estado, ctx) {
    const r = calcularResumen(estado, ctx.hoy, ctx.rangoResumen);
    const periodo = `${r.dias} días`;
    const cambio = (valor, unidad) => textoCambio(valor, unidad, `los ${periodo} anteriores`);

    const misiones = r.misiones.length
        ? `<ul class="medidores">${r.misiones.map((m) => `
               <li>
                   <div class="medidor-fila"><span>${esc(m.nombre)}</span><span class="texto-suave">${m.hechas} de ${m.total} · ${m.pct} %</span></div>
                   <div class="medidor"><div style="width: ${m.pct}%"></div></div>
               </li>`).join("")}</ul>`
        : vacio("En este periodo no tocaba ninguna misión.");

    // Barras por atributo: la del atributo descuidado va en violeta y las demás en gris.
    const maximo = Math.max(1, ...r.atributos.map((a) => a.hechas));
    const atributos = r.atributos.map((a) => {
        const info = ATRIBUTOS[a.clave];
        const color = a.clave === r.descuidado ? COLOR_DATO : COLOR_APAGADO;
        return `<li>
                    <span class="ba-nombre">${info.icono} ${info.nombre}</span>
                    <span class="ba-pista"><i style="width: ${(a.hechas / maximo) * 100}%; background: ${color}"></i></span>
                    <span class="ba-valor">${a.hechas}</span>
                </li>`;
    }).join("");

    let consejo = "Aún no completas misiones en este periodo.";
    if (r.descuidado) {
        const info = ATRIBUTOS[r.descuidado];
        const hechas = r.atributos.find((a) => a.clave === r.descuidado).hechas;
        consejo = `El más descuidado: <b>${info.icono} ${info.nombre}</b> (${plural(hechas, "misión", "misiones")} en ${periodo}).`;
    } else if (r.atributos.some((a) => a.hechas > 0)) {
        consejo = "Vas parejo en los cuatro atributos.";
    }

    const ultimo = r.porDia.length - 1;   // al abrir, el detalle muestra el día de hoy
    return `
        <section class="panel resumen">
            <h2 class="titulo-juego">Resumen</h2>
            <!-- El periodo va arriba porque aplica a todo lo de abajo -->
            <div class="selector" role="group" aria-label="Periodo">
                <button type="button" data-accion="rango-resumen" data-dias="7" aria-pressed="${r.dias === 7}">Últimos 7 días</button>
                <button type="button" data-accion="rango-resumen" data-dias="30" aria-pressed="${r.dias === 30}">Últimos 30 días</button>
            </div>

            <div class="fichas-dato">
                ${ficha("Cumplimiento", r.cumplimiento.pct === null ? "—" : `${r.cumplimiento.pct} %`, cambio(r.cambio, "puntos"))}
                ${ficha("Días perfectos", `${r.perfectos} <small>de ${r.diasConMisiones}</small>`,
                        `<span class="ficha-nota">Días con todas las misiones hechas</span>`)}
                ${ficha("XP de misiones", r.xp, cambio(r.xpAnterior === null ? null : r.xp - r.xpAnterior, "XP"))}
                ${ficha("Tu mejor día", r.mejorDia ? NOMBRE_DIA[r.mejorDia.dia] : "—",
                        `<span class="ficha-nota">${r.mejorDia ? `${r.mejorDia.pct} % en las últimas 4 semanas` : "Aún no hay datos"}</span>`)}
            </div>

            <h3 class="subtitulo">Cumplimiento por día</h3>
            ${graficaDias(r, ultimo)}
            <p class="cal-detalle" id="resumen-detalle">${textoDiaResumen(r.porDia[ultimo])}</p>
            <details class="plegable">
                <summary>Ver como tabla</summary>
                <table class="tabla-datos">
                    <thead><tr><th>Día</th><th>Hechas</th><th>Tocaban</th><th>%</th></tr></thead>
                    <tbody>${r.porDia.filter((d) => !d.antes).map((d) =>
                        `<tr><td>${fechaCorta(d.fecha)}</td><td>${d.hechas}</td><td>${d.total}</td><td>${d.pct === null ? "descanso" : `${d.pct} %`}</td></tr>`).join("")}</tbody>
                </table>
            </details>

            <h3 class="subtitulo">Por misión</h3>
            ${misiones}

            <h3 class="subtitulo">Misiones completadas por atributo</h3>
            <ul class="barras-atributo">${atributos}</ul>
            <p class="nota">${consejo}</p>
        </section>`;
}

// Texto de un día del resumen (se muestra al tocar su columna).
export function textoDiaResumen(dia) {
    if (dia.antes) return `<strong>${fechaLegible(dia.fecha)}</strong>: todavía no jugabas.`;
    if (dia.pct === null) return `<strong>${fechaLegible(dia.fecha)}</strong>: día de descanso.`;
    return `<strong>${fechaLegible(dia.fecha)}</strong>: ${dia.hechas} de ${plural(dia.total, "misión", "misiones")} (${dia.pct} %)`;
}

// Gráfica de columnas: una por día, de 0 a 100 %.
function graficaDias(r, elegida) {
    const W = 320, H = 150;                        // tamaño del dibujo
    const izq = 34, der = 6, arriba = 10, abajo = 22;
    const anchoPlano = W - izq - der;
    const altoPlano = H - arriba - abajo;
    const base = arriba + altoPlano;               // la línea del 0 %
    const n = r.porDia.length;
    const banda = anchoPlano / n;                  // espacio de cada día
    const ancho = Math.min(24, n > 10 ? banda - 2 : banda - 16);   // columna delgada (máx. 24)
    const y = (p) => arriba + altoPlano * (1 - p / 100);

    const lineas = [0, 50, 100].map((p) => `
        <line x1="${izq}" x2="${W - der}" y1="${y(p)}" y2="${y(p)}"/>
        <text x="${izq - 5}" y="${y(p) + 3}" text-anchor="end">${p} %</text>`).join("");

    const columnas = r.porDia.map((dia, i) => {
        const x = izq + i * banda + (banda - ancho) / 2;
        let marca;
        if (dia.pct === null) {
            // Descanso (o antes de empezar a jugar): un punto gris en la base, sin barra.
            marca = `<circle cx="${x + ancho / 2}" cy="${base - 4}" r="1.6" fill="${COLOR_APAGADO}"/>`;
        } else {
            const alto = Math.max(2, altoPlano * (dia.pct / 100));   // un 0 % se ve como una rayita
            const radio = Math.min(4, ancho / 2, alto);
            const tope = base - alto;
            // Punta redondeada arriba, base recta.
            marca = `<path d="M${x} ${base} V${tope + radio} Q${x} ${tope} ${x + radio} ${tope} H${x + ancho - radio} Q${x + ancho} ${tope} ${x + ancho} ${tope + radio} V${base} Z"
                           fill="${dia.pct === 0 ? COLOR_APAGADO : COLOR_DATO}"/>`;
        }
        // Etiqueta del eje: la letra del día (7 días) o el número cada 5 días (30 días).
        const conEtiqueta = n <= 10 || (n - 1 - i) % 5 === 0;
        const texto = n <= 10 ? DIAS_LETRAS[diaDeSemana(dia.fecha)] : desdeTexto(dia.fecha).getDate();
        const etiqueta = conEtiqueta ? `<text x="${x + ancho / 2}" y="${H - 7}" text-anchor="middle">${texto}</text>` : "";
        // La zona para tocar es toda la franja del día (más grande que la columna).
        return `<g class="columna ${i === elegida ? "elegida" : ""}" data-accion="ver-columna" data-i="${i}" role="button"
                   aria-label="${fechaLegible(dia.fecha)}: ${dia.pct === null ? "descanso" : `${dia.pct} %`}">
                    <rect class="franja" x="${izq + i * banda}" y="${arriba}" width="${banda}" height="${altoPlano + abajo}"/>
                    ${marca}${etiqueta}
                </g>`;
    }).join("");

    return `<svg class="grafica" viewBox="0 0 ${W} ${H}" role="group" aria-label="Cumplimiento por día en los últimos ${n} días"
                 xmlns="http://www.w3.org/2000/svg">${lineas}${columnas}</svg>`;
}


// ===== Pantalla: Aventuras (misiones principales y jefes) =====


// Tus misiones principales (objetivos grandes con pasos). Está en Aventuras y, en el modo esencial, también en Hoy.
function seccionPrincipales(estado, esencial = false) {
    const principales = estado.principales.filter((p) => !p.archivada);
    const enCurso = principales.filter((p) => !p.completadaEn);
    const terminadas = principales.filter((p) => p.completadaEn);
    const archivadas = estado.principales.filter((p) => p.archivada);
    const filasArchivadas = archivadas.map((p) => `
        <li class="mision apagada">
            <div class="mision-info">
                <span class="mision-nombre">${esc(p.nombre)}</span>
                <span class="mision-detalle">${p.submisiones.filter((s) => s.hecha).length} de ${p.submisiones.length} pasos</span>
            </div>
            <button type="button" class="boton boton-chico" data-accion="restaurar-principal" data-id="${p.id}">Restaurar</button>
        </li>`).join("");
    return `
        <section class="bloque ${esencial ? "esencial-grupo esencial-importantes" : ""}" ${esencial ? 'id="esencial-importantes"' : ""} aria-label="Misiones principales">
            ${cabeceraSeccion(esencial ? "🎯 Misiones importantes" : "🎯 Misiones principales", "principal", "+ Nueva")}
            <p class="nota">${esencial ? "Tus objetivos grandes, divididos en pasos." : "Tus objetivos grandes, divididos en pasos: tu arma más fuerte contra los jefes."}
               Cada paso: +${PREMIOS.submision.xp} XP. Al terminar todos: +${PREMIOS.principal.xp} XP y ${PREMIOS.principal.monedas} monedas.</p>
            ${enCurso.length ? enCurso.map((p) => tarjetaPrincipal(estado, p)).join("") : vacio("Sin misiones principales en curso. Ej: «Aprender inglés B1» o «Terminar CS50».")}
            ${plegable(`Completadas (${terminadas.length})`, terminadas.map((p) => tarjetaPrincipal(estado, p)).join(""), terminadas.length)}
            ${plegable(`Archivadas (${archivadas.length})`, `<ul class="lista">${filasArchivadas}</ul>`, archivadas.length)}
        </section>`;
}

export function pantallaAventuras(estado, ctx) {
    const estadoDeCampanas = campana.estadoCampanas(estado);
    const campanas = Object.values(estadoDeCampanas);
    const d = campana.DANO.diaria;

    // Qué campaña se ve: la que elegiste, la que acabas de golpear o la del jefe más cerca de caer.
    const golpeada = campanas.find((c) => (ctx.golpes || {})[c.categoria]);
    const vista = golpeada || estadoDeCampanas[ctx.campanaVista] || [...campanas].sort((a, b) => a.porcentaje - b.porcentaje)[0];
    const pestanasCampana = campanas.map((c) => {
        const a = juego.ATRIBUTOS[c.categoria];
        return `<button type="button" data-accion="ver-campana" data-categoria="${c.categoria}" aria-pressed="${c === vista}"
                        style="--color-atributo: ${a.color}">
                    <span class="campana-pestana-icono">${a.icono}</span>
                    <small>${c.indice + 1}/5</small>
                    ${barra(c.porcentaje, "barra-vida barra-mini")}
                </button>`;
    }).join("");

    const posicionMapa = mapa.posicion(estado);
    const premiosMapa = mapa.lugaresPorReclamar(estado, estadoDeCampanas).length;
    const caidosRegion = mapa.senoresDeRegion(posicionMapa.region, estadoDeCampanas).filter((s) => s.liberada).length;
    const fichas = arcade.fichasDisponibles(estado);
    return `
        <div class="accesos">
            <button type="button" class="acceso acceso-reino" data-accion="ir" data-pantalla="mapa">
                <span class="acceso-icono" aria-hidden="true">🗺️</span>
                <b>El reino</b>
                <small>${mapa.nombreRegion(posicionMapa.region)}</small>
                <small>⚔️ ${caidosRegion} de 4 señores${premiosMapa ? ` · 🎁 ${premiosMapa}` : ""}</small>
            </button>
            <button type="button" class="acceso acceso-arcade" data-accion="ir" data-pantalla="arcade">
                <span class="acceso-icono" aria-hidden="true">🕹️</span>
                <b>Arcade</b>
                <small>La Torre y 3 minijuegos</small>
                <small>🎟️ ${plural(fichas, "ficha", "fichas")}</small>
            </button>
            <button type="button" class="acceso acceso-voces" data-accion="ir" data-pantalla="voces">
                <span class="acceso-icono" aria-hidden="true">🗣️</span>
                <b>Las Voces del Valle</b>
                <small>Aventura de diálogos · cambia cada día</small>
                <small>${voces.progreso(estado).hechas} de ${voces.progreso(estado).total} voces recuperadas</small>
            </button>
        </div>

        <section class="bloque" aria-label="Campaña de jefes">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">⚔️ Campaña de jefes</h2>
                <span class="mini texto-suave">${plural(ctx.info.jefesDerrotados, "jefe vencido", "jefes vencidos")}</span>
            </div>
            <div class="selector selector-campanas" role="group" aria-label="Campañas">${pestanasCampana}</div>
            ${tarjetaCampana(vista, ctx)}
            <details class="plegable">
                <summary>¿Cómo se pelea contra los jefes?</summary>
                <p class="nota">Cada categoría tiene 5 jefes, cada vez más fuertes. Solo los dañas cumpliendo objetivos
                   de <b>su</b> categoría: una misión diaria, tarea o sesión de enfoque hace poco daño (−${d.facil} fácil, −${d.normal} normal, −${d.dificil} difícil);
                   cada paso de una <b>misión principal</b> hace −${campana.DANO.paso} y completarla entera, −${campana.DANO.principal} extra.
                   Al vencer a los 5 empieza la <b>Partida+</b>: vuelven con más vida y mejores premios.</p>
                <p class="nota">🩸 <b>Ellos también pegan:</b> cuando fallas una misión, el jefe de su categoría te golpea y
                   se cura con la vida que te roba. Tu armadura (🛡️ ${ctx.vida.armadura.puntos} / ${ctx.vida.armadura.maxima}) decide cuánto.</p>
                <p class="nota">🗺️ Cada jefe vive en una guarida del <b>reino</b>: cuando cae, su guarida queda libre y tiene botín.</p>
            </details>
        </section>

        ${seccionPrincipales(estado)}`;
}

// <details> es una sección que se abre y se cierra sola (sin JavaScript).
function plegable(titulo, contenido, cantidad) {
    if (!cantidad) return "";
    return `<details class="plegable"><summary>${titulo}</summary>${contenido}</details>`;
}

function tarjetaPrincipal(estado, p) {
    const hechas = p.submisiones.filter((s) => s.hecha).length;
    const total = p.submisiones.length;
    const pasos = p.submisiones.map((s) => `
        <li class="submision ${s.hecha ? "hecha" : ""}">
            <button type="button" class="check-chico" data-accion="alternar-submision" data-id="${p.id}" data-sub="${s.id}"
                    aria-pressed="${s.hecha}" aria-label="Marcar ${esc(s.nombre)}">${ICONOS.check}</button>
            <span class="submision-nombre">${esc(s.nombre)}</span>
            ${!s.hecha && !p.completadaEn
                ? `<button type="button" class="boton-icono chico" data-accion="borrar-submision" data-id="${p.id}" data-sub="${s.id}"
                           aria-label="Borrar ${esc(s.nombre)}">${ICONOS.cerrar}</button>`
                : ""}
        </li>`).join("");

    const pie = p.completadaEn
        ? `<p class="sello sello-oro">✔ Completada el ${fechaCorta(p.completadaEn)}</p>`
        : `<form class="form-linea" data-form="submision" data-id="${p.id}">
               <input type="text" name="nombre" maxlength="80" required autocomplete="off" placeholder="Añadir paso…" aria-label="Nuevo paso">
               <button type="submit" class="boton boton-chico">Añadir</button>
           </form>`;

    return `
        <article class="panel tarjeta ${p.completadaEn ? "completada" : ""}" data-id="${p.id}">
            <div class="tarjeta-cabecera">
                <div class="tarjeta-titulo">
                    ${chipAtributo(p.atributo, juego.infoAtributo(estado, p.atributo, p.atributoPropio))}
                    <h3>${esc(p.nombre)}</h3>
                </div>
                ${botonCerrar("archivar-principal", p.id, `Archivar ${p.nombre}`)}
            </div>
            ${barra(Math.round((hechas / total) * 100))}
            <p class="mini texto-suave">${hechas} de ${total} pasos</p>
            <ul class="submisiones">${pasos}</ul>
            ${pie}
        </article>`;
}

// (v55) Tus misiones principales, siempre a la vista arriba de Hoy: las 3 más avanzadas, con su barra y el siguiente paso
// (se marca desde aquí). Tocar el título abre la pestaña Importantes.
function destacadasDeHoy(estado) {
    const enCurso = estado.principales.filter((p) => !p.archivada && !p.completadaEn);
    if (!enCurso.length) return "";
    const avance = (p) => (p.submisiones.length ? p.submisiones.filter((s) => s.hecha).length / p.submisiones.length : 0);
    const tarjetas = [...enCurso].sort((a, b) => avance(b) - avance(a)).slice(0, 3).map((p) => {
        const hechas = p.submisiones.filter((s) => s.hecha).length;
        const siguiente = p.submisiones.find((s) => !s.hecha);
        const a = juego.infoAtributo(estado, p.atributo, p.atributoPropio);
        return `
            <li class="destacada" style="--color-attr: ${a.color}">
                <button type="button" class="destacada-titulo" data-accion="subvista" data-pantalla="hoy" data-vista="importantes">
                    <span>🎯 ${esc(p.nombre)}</span><small>${esc(a.icono)} ${hechas}/${p.submisiones.length}</small>
                </button>
                ${barra(Math.round(avance(p) * 100), "barra-mini")}
                ${siguiente
                    ? `<div class="destacada-paso">
                           <button type="button" class="check-chico" data-accion="alternar-submision" data-id="${p.id}" data-sub="${siguiente.id}"
                                   aria-pressed="false" aria-label="Marcar ${esc(siguiente.nombre)}">${ICONOS.check}</button>
                           <span>Siguiente: <b>${esc(siguiente.nombre)}</b></span>
                       </div>`
                    : '<p class="mini texto-suave">Añade un paso para avanzar.</p>'}
            </li>`;
    }).join("");
    return `
        <section class="panel destacadas" aria-label="Tus misiones principales">
            <h2 class="titulo-juego">🎯 Misiones principales</h2>
            <ul class="lista">${tarjetas}</ul>
        </section>`;
}

const FRASES_JEFE = {
    furioso: "Intacto y furioso",
    herido: "Herido",
    agotado: "A punto de caer",
};

// Retrato del jefe (una pintura clásica) con el efecto según su vida.
// dano = cuánto le acabas de quitar (si le pegaste con la última acción): muestra el golpe.
function retratoJefe(jefe, estadoVisual, clase = "", dano = 0) {
    return `<figure class="retrato ${estadoVisual} ${clase}">
                <img src="${campana.imagenDe(jefe.id)}" alt="${esc(jefe.nombre)}" loading="lazy" decoding="async">
                ${dano ? '<span class="impacto"></span>' : ""}
            </figure>
            ${dano ? `<span class="dano" aria-hidden="true">−${dano}</span>` : ""}`;
}

// Miniatura de un objeto, con el marco del color de su rareza.
function iconoObjeto(id, extra = "") {
    return `<span class="objeto-icono rareza-${avatar.OBJETOS[id].rareza} ${extra}">${dibujarObjeto(id)}</span>`;
}

function textoRareza(objeto) {
    const rareza = avatar.RAREZAS[objeto.rareza];
    return `<span class="rareza-texto" style="color: ${rareza.color}">${rareza.nombre}</span>`;
}

// Lo que da un objeto, para ponerlo al final de su línea. Ej: " · 🛡️ +12 · 🍀 +4" (o nada).
function poderDe(objeto) {
    const texto = equipo.textoPoder(objeto.poder);
    return texto ? ` · <span class="poder-objeto">${texto}</span>` : "";
}

// La habilidad de la Torre de un objeto épico o legendario (v26), en su propia línea (o nada).
function habilidadDe(objeto) {
    const h = habilidades.HABILIDADES[objeto.habilidad];
    return h ? `<span class="habilidad-objeto">${h.icono} <b>${h.nombre}</b> · ${h.texto} <i>(en la Torre)</i></span>` : "";
}

// Tarjeta de una campaña: el jefe actual contra tu avatar y la ruta de los 5 jefes.
function tarjetaCampana(c, ctx) {
    const a = juego.ATRIBUTOS[c.categoria];
    const dano = (ctx.golpes || {})[c.categoria] || 0;   // daño del golpe que acabas de dar
    const golpeado = dano > 0;

    // Ruta: vencidos (en gris), el actual (resaltado) y los que vienen (silueta).
    // En Partida+ ya los conoces a todos: los que vienen se ven, solo que apagados.
    const ruta = c.campana.jefes.map((jefe, i) => {
        const tipo = i < c.indice ? "vencido" : i === c.indice ? "actual" : c.ronda > 1 ? "futuro visto" : "futuro";
        const titulo = tipo === "futuro" ? "Jefe desconocido" : `${jefe.nombre}: ${jefe.titulo}`;
        return `<li class="${tipo}" title="${esc(titulo)}">
                    <img src="${campana.imagenDe(jefe.id)}" alt="" loading="lazy" decoding="async">
                    ${tipo === "vencido" ? '<span aria-hidden="true">✓</span>' : tipo === "futuro" ? '<span aria-hidden="true">?</span>' : ""}
                </li>`;
    }).join("");

    const jefe = c.jefe;
    const visual = campana.estadoVisual(c.porcentaje);
    const premio = campana.premioJefe(c.derrotados + 1);
    return `
        <article class="panel campana jefe ${golpeado ? "golpeado" : ""}" style="--color-atributo: ${a.color}">
            <div class="campana-cabecera">
                ${chipAtributo(c.categoria)}
                <span class="mini texto-suave">${c.campana.nombre}</span>
                <span class="campana-numero">Jefe ${c.indice + 1}/5</span>
            </div>
            ${c.ronda > 1 ? `<p class="ronda">👑 Partida+ · Ronda ${c.ronda}
                <span>Vida y premios ×${String(1 + campana.MEJORA_POR_RONDA * (c.ronda - 1)).replace(".", ",")}</span></p>` : ""}

            <!-- Escena de batalla: tu avatar contra el jefe -->
            <div class="escena">
                <div class="escena-fondo">${dibujarEscenario(c.categoria)}</div>
                <div class="escena-heroe ${golpeado ? "atacar" : ""}">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
                <span class="escena-vs">VS</span>
                <div class="escena-jefe">${retratoJefe(jefe, visual, "", dano)}</div>
            </div>

            <h3 class="jefe-nombre">${esc(jefe.nombre)} <span>· ${esc(jefe.titulo)}</span></h3>
            <p class="nota">${esc(jefe.texto)}</p>
            ${barra(c.porcentaje, "barra-vida")}
            <p class="mini"><strong>Vida ${c.vida} / ${c.vidaMax}</strong>
               <span class="texto-suave">· ${FRASES_JEFE[visual]}</span></p>
            ${c.esperando ? `<p>${notaJefeEsperando(c)}</p>` : ""}
            <p class="mini texto-suave">Recompensa al derrotarlo: +${premio.xp} XP y ${premio.gemas} 💎</p>
            ${c.curado ? `<p class="mini robado">🩸 Los jefes de esta campaña se han curado ${c.curado} con la vida que te robaron.</p>` : ""}
            <ol class="ruta-jefes">${ruta}</ol>
        </article>`;
}

// ===== Pantalla: Logros =====

export function pantallaLogros(estado, ctx) {
    const porConseguir = estado.logros.filter((l) => !l.desbloqueadoEn);
    const conseguidos = estado.logros.filter((l) => l.desbloqueadoEn);
    const lista = (logros) => `<ul class="lista">${logros.map((l) => tarjetaLogro(l, estado, ctx)).join("")}</ul>`;

    return `
        ${cabeceraSeccion("Logros", "logro", "+ Nuevo")}
        <p class="nota">Logros personales que marcas tú (ej: «Conseguir mi primer cliente») o con condición
           automática (ej: «30 días de gym» = completar la misión «Ir al gym» 30 veces).</p>

        <h3 class="subtitulo">🎯 Por conseguir (${porConseguir.length})</h3>
        ${porConseguir.length ? lista(porConseguir) : vacio("No tienes logros pendientes. ¡Crea tu próxima meta!")}

        <h3 class="subtitulo">🏆 Salón de la fama (${conseguidos.length})</h3>
        ${conseguidos.length ? lista(conseguidos) : vacio("Aquí aparecerán los logros que consigas.")}`;
}

function tarjetaLogro(logro, estado, ctx) {
    const manual = logro.tipo === "manual";
    let pie;
    if (logro.desbloqueadoEn) {
        // En los personales la fecha es cuando lo anotaste, no cuando lo lograste.
        const verbo = manual ? "Registrado" : "Conseguido";
        pie = `<p class="mini oro">${verbo} el ${fechaCorta(logro.desbloqueadoEn)}</p>`;
    } else if (manual) {
        pie = `<button type="button" class="boton boton-chico boton-oro" data-accion="lograr" data-id="${logro.id}">¡Lo logré!</button>`;
    } else {
        const progreso = Math.min(juego.progresoLogro(logro, estado, ctx.info), logro.objetivo);
        pie = `${barra(Math.round((progreso / logro.objetivo) * 100), "barra-mini")}
               <p class="mini texto-suave">${progreso} / ${logro.objetivo}</p>`;
    }

    // Los logros personales muestran su descripción; los automáticos, su condición.
    const condicion = manual ? "" : `<p class="mini">${esc(juego.describirLogro(logro, estado))}</p>`;
    const descripcion = logro.descripcion ? `<p class="logro-descripcion">${esc(logro.descripcion)}</p>` : "";
    const icono = logro.desbloqueadoEn ? (logro.icono || "🏆") : (manual && logro.icono ? logro.icono : "🔒");

    return `
        <li class="logro ${logro.desbloqueadoEn ? "desbloqueado" : ""}">
            <span class="logro-icono" aria-hidden="true">${esc(icono)}</span>
            <div class="logro-info">
                <h3>${esc(logro.nombre)}</h3>
                ${condicion}
                ${descripcion}
                ${pie}
            </div>
            ${logro.recompensa ? `<span class="logro-premio">🪙 ${logro.recompensa}</span>` : ""}
            ${botonEditar("editar-logro", logro.id, `Editar ${logro.nombre}`)}
        </li>`;
}


// ===== El robo de vida (v24) =====
// Aparece cuando fallas una misión (o al abrir la app, si fallaste mientras no estabas): el jefe
// embiste, tu héroe recibe el golpe y la vida sube hasta el jefe, que se cura.
// r = { titulo, golpes: [{ jefe, dano, curo, jefeVida: { antes, despues, maxima } }], total,
//       base, conArmadura, armadura: { puntos, maxima, factor } }
// avatarSvg = el dibujo de tu héroe (dibujarAvatar con { batalla: true }).
export function pantallaRobo(r, avatarSvg) {
    const jefes = r.golpes.slice(0, 4);
    const uno = jefes.length === 1 ? jefes[0] : null;

    const retratos = jefes.map((g) => {
        const despues = (g.jefeVida.despues / g.jefeVida.maxima) * 100;
        const antes = g.jefeVida.antes === null ? despues : (g.jefeVida.antes / g.jefeVida.maxima) * 100;
        return `
            <div class="robo-jefe">
                <figure class="retrato furioso"><img src="${campana.imagenDe(g.jefe.id)}" alt="${esc(g.jefe.nombre)}"></figure>
                ${(g.curo ?? g.dano) ? `<span class="robo-numero robo-mas" aria-hidden="true">+${g.curo ?? g.dano}</span>` : ""}
                <div class="barra barra-vida barra-mini"><div class="barra-relleno robo-vida" style="--antes: ${antes}%; --despues: ${despues}%"></div></div>
                <b class="mini">${esc(g.jefe.nombre)}</b>
            </div>`;
    }).join("");

    // Las gotas de vida que suben del héroe al jefe (cada una un poco distinta).
    const gotas = r.total ? Array.from({ length: 8 }, (_, i) =>
        `<span class="robo-gota" style="--x0: ${(i % 4) * 9 - 14}px; --x1: ${((i * 5) % 7) * 8 - 24}px; animation-delay: ${(0.75 + i * 0.1).toFixed(2)}s"></span>`).join("") : "";

    // El título y lo que pasó con tu armadura.
    let titulo;
    if (!r.total) titulo = `${uno ? esc(uno.jefe.nombre) : "Tus jefes"} te ${uno ? "golpeó" : "golpearon"}, pero ya no te queda vida que robar`;
    else if (uno) titulo = `${esc(uno.jefe.nombre)} te robó ${r.total} de vida`;
    else titulo = `Tus jefes te robaron ${r.total} de vida`;

    const parado = r.base - r.conArmadura;   // positivo: lo que paró tu armadura; negativo: lo que dolió de más
    const frases = [];
    if (parado > 0) frases.push(`🛡️ Tu armadura paró ${parado} de ${r.base}.`);
    else if (parado < 0) frases.push(`🛡️ Tu armadura está gastada: dolió ${-parado} más de lo normal.`);
    if (uno && uno.curo > 0) frases.push(`${esc(uno.jefe.titulo)} se hace más fuerte: recuperó ${uno.curo} de vida.`);
    else if (uno && uno.jefeVida.antes !== null && r.total) frases.push(`${esc(uno.jefe.nombre)} ya tenía la vida llena: no se curó.`);
    else if (r.total) frases.push("Se curaron con lo que te quitaron.");

    return `
        <p class="etiqueta">${esc(r.titulo)}</p>
        <div class="robo-escena">
            <div class="robo-jefes robo-de-${jefes.length}">${retratos}</div>
            <div class="robo-rio" aria-hidden="true">${gotas}</div>
            <div class="robo-heroe">
                <div class="robo-avatar">${avatarSvg}</div>
                <span class="robo-tajo" aria-hidden="true"></span>
                ${r.total ? `<span class="robo-numero robo-menos" aria-hidden="true">−${r.total} ❤️</span>` : ""}
            </div>
        </div>
        <h3 class="titulo-juego robo-titulo">${titulo}</h3>
        <p class="nota">${frases.join(" ")}</p>
        <div class="robo-armadura">${barraDeArmadura(r.armadura)}</div>
        <p class="mini texto-suave">Cumple misiones para curarte, reparar tu armadura y devolverle el golpe.</p>
        <button type="button" class="boton boton-secundario boton-ancho" data-accion="robo-cerrar">Seguir</button>`;
}


// ===== Pantalla: Arcade (minijuegos) =====

export function pantallaArcade(estado, ctx) {
    const caido = ctx.vida.caido;
    const fichas = arcade.fichasDisponibles(estado);
    const puedeJugar = fichas > 0 && !caido;   // si caíste en combate, el arcade se cierra
    // Lo que aporta tu equipo (con la armadura que tienes ahora).
    const poder = { ...equipo.poderDelEquipo(estado), armadura: ctx.vida.armadura.puntos };
    const ventajas = arcade.ventajasDelEquipo(poder);
    const heroeTorre = torre.heroeDeLaTorre({ fuerza: 1, intelecto: 1, carisma: 1, riqueza: 1 }, poder);
    // v38: las técnicas que ya aprendiste (según el nivel de tus atributos reales).
    const nivelDe = (clave) => juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO).nivel;
    const tecnicasTorre = Object.entries(torre.TECNICAS).map(([clave, t]) => {
        const sabe = nivelDe(t.atributo) >= torre.NIVEL_TECNICA;
        return sabe ? `${t.icono} <b>${t.nombre}</b>` : `<span class="texto-suave">🔒 ${t.nombre} (${ATRIBUTOS[t.atributo].nombre} ${torre.NIVEL_TECNICA})</span>`;
    });
    const habilidadesTorre = equipo.habilidadesDelEquipo(estado);
    const petTorre = mascota.mascotaDeBatalla(estado, ctx.avatar.mascota, ctx.hoy);
    const tarjetas = Object.entries(arcade.JUEGOS).map(([clave, j]) => {
        const record = estado.arcade.records[clave] || 0;
        const ventaja = arcade.textoVentajas(clave, ventajas);
        return `
            <article class="panel minijuego-tarjeta">
                <div class="minijuego-cabecera">
                    <span class="minijuego-icono">${j.icono}</span>
                    <div>
                        <h3>${j.nombre}</h3>
                        ${chipAtributo(j.atributo)}
                    </div>
                </div>
                <p class="nota">${j.descripcion}</p>
                <p class="mini equipo-ventaja">${ventaja ? `🧰 Tu equipo: ${ventaja}` : "🧰 Tu equipo todavía no da ventaja aquí."}</p>
                <p class="mini">🏅 Récord: <b>${record}</b> pts</p>
                <button type="button" class="boton boton-principal boton-ancho" data-accion="jugar" data-juego="${clave}"
                        ${puedeJugar ? "" : "disabled"}>Jugar · 🎟️ 1 ficha</button>
            </article>`;
    }).join("");

    // La Torre: el minijuego grande, arriba de todo.
    const partida = estado.arcade.torre;
    const recordTorre = estado.arcade.records.torre || 0;
    const conocidas = bestiario.progresoBestiario(estado.arcade.bestiario);
    const tarjetaTorre = `
        <article class="panel torre-tarjeta">
            <div class="torre-portada" style="background-image: url(${rutaPintura("torre")})">
                <span class="torre-portada-titulo">🗼 Torre del héroe</span>
            </div>
            <p class="nota">Batallas por turnos como en los juegos de rol clásicos: ${bestiario.ZONAS.length} zonas, ${conocidas.total} criaturas y un
               guardián cada ${torre.CADA_GUARDIAN} pisos. <b>Tu poder sale de los niveles de tus atributos reales.</b></p>
            ${notaDeGym(estado)}
            <details class="plegable plegable-reglas">
                <summary>📖 Cómo se juega y qué llevas</summary>
            <p class="nota">Combina hechizos distintos en turnos seguidos: ♨️ Vapor (fuego + hielo), 🌩️ Conducción (hielo + rayo) y 💥 Explosión (fuego + rayo).</p>
            <p class="nota">Antes de cada turno ves qué planea tu rival: ataca, usa magia, defiéndete o toma una poción. Cada criatura
               tiene un punto débil (🔥 fuego, ❄️ hielo o ⚡ rayo): descúbrelo y queda en tu bestiario. Desde que la Torre despertó, sus
               criaturas levantan barreras, cargan golpes y devuelven hechizos. El orden de cada turno es: tú, tu mascota, la criatura y el
               fin del turno (veneno, regeneración).</p>
            <p class="mini equipo-ventaja">🎯 Técnicas (una por atributo, desde su nivel ${torre.NIVEL_TECNICA}; una vez por piso): ${tecnicasTorre.join(" · ")}.</p>
            <p class="mini">✨ Voluntad: se llena peleando y aguantando golpes, y tu racha la empieza con algo. Llena, suelta un golpe
               ${String(torre.VOLUNTAD.multiplica).replace(".", ",")} veces más fuerte que rompe barreras y cargas.</p>
            <p class="mini">❤️ Subes con tu vida real: empiezas con el
               ${Math.round(vida.proporcionTorre(ctx.vida) * 100)} % de tu vida.</p>
            <p class="mini equipo-ventaja">🧰 Tu equipo: ${[
                poder.ataque ? `⚔️ +${poder.ataque} de ataque` : "",
                poder.magia ? `🔮 +${Math.round(poder.magia * 1.5)} a los hechizos` : "",
                poder.suerte ? `🍀 +${poder.suerte} % de crítico` : "",
                `🛡️ tu armadura para el ${Math.round(heroeTorre.proteccion * 100)} % de cada golpe`,
            ].filter(Boolean).join(" · ")}.</p>
            ${habilidadesTorre.length
                ? `<p class="mini equipo-ventaja">✨ Habilidades: ${habilidadesTorre.map((c) => `${habilidades.HABILIDADES[c].icono} <b>${habilidades.HABILIDADES[c].nombre}</b>`).join(" · ")}</p>`
                : `<p class="mini texto-suave">✨ El equipo épico y legendario da habilidades especiales en la Torre.</p>`}
            <p class="mini equipo-ventaja">${mascota.MASCOTAS[petTorre.especie].icono} ${esc(petTorre.nombre)} te acompaña:
               «${mascota.MASCOTAS[petTorre.especie].habilidad.nombre}» · ${mascota.textoPotencia(petTorre)}.</p>
            </details>
            <p class="mini">🏅 Récord: ${recordTorre ? `${plural(recordTorre, "piso superado", "pisos superados")}` : "todavía ninguno"}
               · Premio: ${torre.PREMIO.gemasPorPiso} 💎 y ${String(torre.PREMIO.xpPorPiso).replace(".", ",")} XP de Carisma por piso
               (máx. ${torre.PREMIO.maxGemas} 💎 y ${torre.PREMIO.maxXp} XP)</p>
            ${selectorDeModo(estado, "torre", partida, ctx.hoy)}
            ${selectorDeMarcas("torre", partida, ctx.hoy)}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="torre-abrir" data-lugar="torre" ${!caido && (partida || fichas) ? "" : "disabled"}>
                ${partida ? `Continuar · piso ${partida.piso}` : "Subir a la torre · 🎟️ 1 ficha"}</button>
            <div class="torre-botones">
                <button type="button" class="boton boton-secundario" data-accion="historia-abrir" data-lugar="torre">📜 Historia</button>
                <button type="button" class="boton boton-secundario" data-accion="bestiario-abrir">📖 Bestiario · ${conocidas.vistas}/${conocidas.total}</button>
            </div>
        </article>`;

    return `
        ${encabezado("🕹️ Arcade", "aventuras", "Aventuras")}
        ${caido ? avisoCaido(ctx.vida, "El arcade está cerrado") : ""}
        ${tarjetaReto(estado, ctx)}
        ${tarjetaTorre}
        ${["mazmorra", "minas", "laberinto", "fragua"].map((lugar) => tarjetaMazmorra(estado, caido, fichas, ctx.hoy, lugar)).join("")}
        ${panelBazar(estado, caido)}
        <section class="panel arcade-cabecera">
            <div class="arcade-heroe">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
            <div>
                <h2 class="titulo-juego">Arcade del héroe</h2>
                <p class="fichas">🎟️ ${plural(fichas, "ficha", "fichas")}</p>
                <p class="nota">Ganas <b>1 ficha</b> por cada misión diaria completada. Cada partida da gemas 💎 y XP
                   según tus puntos (máx. ${arcade.MAX_GEMAS} 💎 y ${arcade.MAX_XP} XP).</p>
            </div>
        </section>
        ${fichas || caido ? "" : vacio("Sin fichas por ahora. Completa una misión diaria y vuelve a jugar.")}
        ${tarjetas}`;
}


// ===== El reto del día (v40) =====
// Un objetivo distinto cada día (ver retos.js). Se crea al abrir la app; si todavía no existe, no se muestra.
export function textoPremioReto(premio) {
    return `+${premio.gemas} 💎 · +${premio.xp} XP`;
}

function tarjetaReto(estado, ctx) {
    const reto = estado.arcade.retos[ctx.hoy];
    if (!reto) return "";
    const datos = retos.RETOS[reto.tipo];
    const hecho = Boolean(reto.cobradoEn);
    return `
        <section class="panel reto-dia ${hecho ? "cumplido" : ""}" aria-label="Reto del día">
            <p class="etiqueta">🎯 Reto del día</p>
            <h3 class="reto-texto">${datos.icono} ${datos.texto(reto.meta)}</h3>
            ${barra(retos.porcentajeDelReto(reto), hecho ? "barra-oro" : "")}
            <p class="mini">${hecho
                ? `✅ ¡Cumplido hoy! Ganaste ${textoPremioReto(retos.PREMIO_RETO)}.`
                : `Llevas <b>${Math.min(reto.mejor, reto.meta)}</b> de ${reto.meta} ${datos.unidad} · Premio: ${textoPremioReto(retos.PREMIO_RETO)} (una vez al día).`}</p>
        </section>`;
}


// ===== Las gemas y el bazar del arcade (v31) =====
// Las gemas 💎 se ganan jugando y con los premios extra; se gastan aquí y en las mascotas.
// Las monedas 🪙 quedan para tus premios reales.
function panelBazar(estado, caido) {
    const gemas = estado.personaje.gemas || 0;
    const llevas = estado.arcade.bazar || [];
    const filas = Object.entries(torre.PROVISIONES).map(([clave, p]) => {
        const la = llevas.includes(clave);
        const puede = !la && !caido && gemas >= p.precio;
        const accion = la
            ? '<span class="mini oro">✓ La llevas</span>'
            : `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar-provision" data-clave="${clave}"
                       ${puede ? "" : "disabled"}>💎 ${p.precio}</button>`;
        return `<li class="provision ${la ? "llevada" : ""}">
                    <span class="provision-icono" aria-hidden="true">${p.icono}</span>
                    <span><b>${p.nombre}</b><small>${p.texto}</small></span>
                    ${accion}
                </li>`;
    }).join("");
    const premioJefe = [campana.premioJefe(1).gemas, campana.premioJefe(5).gemas];
    return `
        <section class="panel bazar">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">💎 Bazar</h2>
                <span class="saldo-gemas">💎 ${gemas}</span>
            </div>
            <p class="nota">Provisiones para tu próxima subida a la Torre o bajada a la Mazmorra: se usan al empezar.
               Se pagan con <b>gemas</b>, la moneda del juego (con ellas también compras equipo y adoptas mascotas).</p>
            <ul class="provisiones">${filas}</ul>
            <details class="plegable">
                <summary>💎 Cómo ganar gemas</summary>
                <dl class="estadisticas">
                    <div><dt>Minijuegos</dt><dd>💎 hasta ${arcade.MAX_GEMAS}</dd></div>
                    <div><dt>Torre del héroe</dt><dd>💎 ${torre.PREMIO.gemasPorPiso} por piso (máx. ${torre.PREMIO.maxGemas})</dd></div>
                    ${["mazmorra", "minas", "laberinto", "fragua"].map((l) => `<div><dt>${bestiario.LUGARES[l].nombre}</dt><dd>💎 ${torre.REGLAS[l].premio.gemasPorPiso} por ${bestiario.LUGARES[l].piso.toLowerCase()} (máx. ${torre.REGLAS[l].premio.maxGemas})</dd></div>`).join("")}
                    <div><dt>Jefe derrotado (1.º al 5.º)</dt><dd>💎 ${premioJefe[0]}–${premioJefe[1]}</dd></div>
                    <div><dt>Cofre del día</dt><dd>💎 15–40 (a veces)</dd></div>
                    <div><dt>Desafío de la semana</dt><dd>💎 ${desafios.COFRE.gemas}</dd></div>
                    <div><dt>Desafío relámpago</dt><dd>💎 ${rituales.RELAMPAGO.premio.gemas}</dd></div>
                    <div><dt>Tesoros y guaridas del mapa</dt><dd>💎 20–100</dd></div>
                </dl>
            </details>
        </section>`;
}

// La Mazmorra del Abismo (v29): cerrada (con lo que falta para abrirla) o abierta.
// Las marcas de partida (v41): 3 al día, o la que llevas si ya hay una partida en curso.
// Los botones de radio se llaman "marca-torre" / "marca-mazmorra"; app.js lee el que esté marcado.
const textoPremioMarca = (m) => `premio ×${String(m.premio).replace(".", ",")}`;

// (v65) Los modos de juego: Normal, Asalto de guardianes y Reto diario. Con una partida en curso, solo se dice cuál es.
// Los botones de radio se llaman "modo-torre" / "modo-minas"…; app.js lee el que esté marcado.
// (v66) Lo que tu entrenamiento real le da al héroe en el combate, o cómo conseguirlo.
function notaDeGym(estado) {
    const nivel = gymReglas.nivelDeGym(estado.gym.sesiones).nivel;
    const bono = Math.round(gymReglas.bonoDeGym(nivel) * 100);
    return bono
        ? `<p class="mini equipo-ventaja">🏋️ Tu nivel de gym (${nivel}) te da <b>+${bono} % de vida y de ataque</b>.</p>`
        : '<p class="mini texto-suave">🏋️ Entrena en el gimnasio y tu héroe ganará vida y ataque aquí.</p>';
}

function selectorDeModo(estado, lugar, partida, fecha) {
    const M = torre.MODOS;
    if (partida) {
        const m = M[torre.modoDe(partida)];
        return `<p class="mini equipo-ventaja">${m.icono} Modo: <b>${m.nombre}</b></p>`;
    }
    const recordAsalto = estado.arcade.records[`asalto-${lugar}`] || 0;
    const sitio = bestiario.LUGARES[lugar];
    const faltaAsalto = (estado.arcade.records[lugar] || 0) < M.asalto.pisoMinimo;
    const d = estado.arcade.diaria;
    const hoyD = d.fecha === fecha ? d : { mejor: 0, cobrado: false };
    const marca = torre.MARCAS[torre.marcaDeLaDiaria(fecha, lugar)];
    return `
        <fieldset class="opciones opciones-1 modos">
            <legend>Modo de juego</legend>
            <label class="pildora"><input type="radio" name="modo-${lugar}" value="normal" checked><span><b>${M.normal.icono} ${M.normal.nombre}</b><small>${M.normal.texto}</small></span></label>
            <label class="pildora ${faltaAsalto ? "apagada" : ""}"><input type="radio" name="modo-${lugar}" value="asalto" ${faltaAsalto ? "disabled" : ""}><span><b>${M.asalto.icono} ${M.asalto.nombre}</b>
                <small>${faltaAsalto ? `🔒 Supera el piso ${M.asalto.pisoMinimo} de ${sitio.nombre}.` : `${M.asalto.texto}${recordAsalto ? ` Tu récord: ${plural(recordAsalto, "guardián", "guardianes")}.` : ""}`}</small></span></label>
            <label class="pildora"><input type="radio" name="modo-${lugar}" value="diaria"><span><b>${M.diaria.icono} ${M.diaria.nombre}</b>
                <small>${M.diaria.texto} Hoy: ${marca.icono} ${marca.nombre}. ${hoyD.cobrado ? "✅ Premio de hoy cobrado." : `Mejor de hoy: ${hoyD.mejor} de ${M.diaria.meta} (+${M.diaria.bonus.gemas} 💎).`}</small></span></label>
        </fieldset>`;
}

function selectorDeMarcas(lugar, partida, fecha) {
    if (partida) {
        const m = torre.MARCAS[partida.marca];
        return `<p class="mini equipo-ventaja">${m ? `✦ Marca: ${m.icono} <b>${m.nombre}</b> (${m.texto} · ${textoPremioMarca(m)})` : "✦ Sin marca"}</p>`;
    }
    return `
        <fieldset class="opciones opciones-1 marcas">
            <legend>Marca de esta partida <span class="texto-suave">(opcional: más riesgo, más premio)</span></legend>
            <label class="pildora"><input type="radio" name="marca-${lugar}" value="" checked><span><b>Sin marca</b><small>Como siempre</small></span></label>
            ${torre.marcasDelDia(fecha, lugar).map((clave) => {
                const m = torre.MARCAS[clave];
                return `<label class="pildora"><input type="radio" name="marca-${lugar}" value="${clave}"><span><b>${m.icono} ${m.nombre}</b><small>${m.texto} · ${textoPremioMarca(m)}</small></span></label>`;
            }).join("")}
        </fieldset>`;
}

// (v64) Una tarjeta por mazmorra: la del Abismo (v29) y, a partir de ella, las Minas de la Codicia y el Laberinto de los Ecos.
// Cerrada dice qué falta para abrirla; abierta, lo que hay dentro, tu récord y el botón para entrar.
function tarjetaMazmorra(estado, caido, fichas, fecha, lugar = "mazmorra") {
    const sitio = bestiario.LUGARES[lugar];
    const abre = lugar === "mazmorra" ? { lugar: "torre", piso: torre.ABRIR_MAZMORRA } : sitio.abre;
    const previo = bestiario.LUGARES[abre.lugar];
    if (!torre.lugarAbierto(torre.arcadeConGym(estado), lugar)) {
        const record = estado.arcade.records[abre.lugar] || 0;
        return `
            <article class="panel mazmorra-cerrada">
                <span class="mazmorra-candado" aria-hidden="true">🔒</span>
                <div>
                    <h3>${sitio.icono} ${sitio.nombre}</h3>
                    <p class="nota">${lugar === "mazmorra"
                        ? `Algo duerme bajo la Torre. Se abre cuando superes el piso ${torre.ABRIR_MAZMORRA} de la Torre del héroe (vence al Dragón de la tormenta).`
                        : esc(sitio.abre.texto)}</p>
                    ${barra(Math.min(100, (record / abre.piso) * 100))}
                    <p class="mini">Tu récord en ${previo.id === "torre" ? "la Torre" : previo.nombre}: ${record} de ${abre.piso} ${previo.pisos}.</p>
                </div>
            </article>`;
    }
    const partida = estado.arcade[lugar];
    const record = estado.arcade.records[lugar] || 0;
    const conocidas = bestiario.progresoBestiario(estado.arcade.bestiario, lugar);
    const reglas = torre.REGLAS[lugar];
    const atributo = ATRIBUTOS[reglas.atributo];
    const e = torre.ESPECIALES;
    const descripcion = lugar === "mazmorra"
        ? `Bajo la Torre, ${bestiario.ZONAS_MAZMORRA.length} zonas y ${conocidas.total} criaturas nuevas. <b>Más difícil:</b> pegan
           más fuerte y cada una tiene un ataque especial: ${e.veneno.icono} veneno (una poción lo cura), ${e.drenar.icono} beber tu vida,
           ${e.sellar.icono} sellar tu magia o ${e.coraza.icono} coraza (tu próximo golpe le hace la mitad). Los guardianes se enfurecen a
           media vida y entre sótano y sótano no hay descanso.`
        : esc(sitio.resumen);
    const pisos = sitio.piso.toLowerCase();
    return `
        <article class="panel torre-tarjeta mazmorra-tarjeta mazmorra-${lugar}">
            <div class="torre-portada mazmorra-portada">
                <img class="mazmorra-portada-sala" data-sala="${sitio.portada || "abismo"}" alt="" draggable="false">
                <span class="torre-portada-titulo">${sitio.icono} ${sitio.nombre}</span>
            </div>
            <p class="nota">${descripcion}</p>
            <p class="mini">🏅 Récord: ${record ? plural(record, `${pisos} superado`, `${sitio.pisos} superados`) : "todavía ninguno"}
               · ${sitio.zonas.length} zonas · ${conocidas.total} criaturas
               · Premio: ${reglas.premio.gemasPorPiso} 💎 y ${reglas.premio.xpPorPiso} XP de ${atributo.icono} ${atributo.nombre} por ${pisos}
               (máx. ${reglas.premio.maxGemas} 💎 y ${reglas.premio.maxXp} XP)</p>
            ${selectorDeModo(estado, lugar, partida, fecha)}
            ${selectorDeMarcas(lugar, partida, fecha)}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="torre-abrir" data-lugar="${lugar}" ${!caido && (partida || fichas) ? "" : "disabled"}>
                ${partida ? `Continuar · ${pisos} ${partida.piso}` : `${sitio.boton || "Bajar a la mazmorra"} · 🎟️ 1 ficha`}</button>
            <div class="torre-botones">
                <button type="button" class="boton boton-secundario" data-accion="historia-abrir" data-lugar="${lugar}">📜 Historia</button>
                <button type="button" class="boton boton-secundario" data-accion="bestiario-abrir">📖 Bestiario · ${conocidas.vistas}/${conocidas.total}</button>
            </div>
        </article>`;
}


// ===== La Torre del héroe (pantalla completa) =====
// (También la Mazmorra del Abismo: es la misma pantalla. partida.lugar dice cuál es.)
// Se ve como un juego de rol clásico: la criatura a la izquierda, tu héroe a la derecha y,
// abajo, ventanas azules con los comandos y el estado de cada uno.
// t = { partida, nombre (el de tu héroe), sprites: { heroe, enemigo, sala } (imágenes en pixel art),
//       eventos (lo que acaba de pasar), menu ("principal" | "magia"), ultimo (el último comando
//       que usaste: ahí queda la manito), bestiario (lo que sabes de las criaturas),
//       resultado (al cobrar), fichas }
//
// Todo lo que pasa en un turno llega junto (tu acción y la respuesta de la criatura). Para que
// se vea en orden, cada animación empieza un poco después que la anterior (animation-delay).
const TURNO_MASCOTA = 400;   // milisegundos: cuándo actúa tu mascota
const TURNO_ENEMIGO = 650;   // y cuándo responde la criatura

// Un número que salta sobre quien recibe el golpe o la cura.
const numeroFF = (texto, clase, cuando) =>
    `<span class="ff-numero ${clase}" style="animation-delay: ${cuando}ms" aria-hidden="true">${texto}</span>`;

// La barra superior de la Torre (o la Mazmorra): el título y la ✕ para salir.
const barraTorre = (titulo, detalle = "") => `
    <div class="minijuego-barra">
        <span class="titulo-juego">${titulo}${detalle ? ` <small class="ff-zona">${detalle}</small>` : ""}</span>
        <button type="button" class="boton-icono" data-accion="torre-salir" aria-label="Salir de la torre">${ICONOS.cerrar}</button>
    </div>`;

// Una imagen en pixel art. talla = cuántos puntos mide de ancho (el CSS la agranda).
const spriteFF = (direccion, nombre, talla, tinte = "") => `
    <span class="ff-figura"${tinte ? ` style="filter: ${tinte}"` : ""}><span class="ff-paso">
        <img class="ff-sprite" src="${direccion || ""}" alt="${esc(nombre)}" style="--talla: ${talla}" draggable="false">
    </span></span>`;

// El fondo de la escena: la sala de esa zona.
const salaFF = (direccion) => (direccion ? `<img class="ff-sala" src="${direccion}" alt="" draggable="false">` : "");

// Las criaturas «ancestrales» (después del piso 20) son las mismas, de otro color.
const tinteDeVuelta = (vuelta) => (vuelta ? `hue-rotate(${(vuelta * 140) % 360}deg) saturate(1.2)` : "");

// (v58) Los ataques especiales, bien a la vista: el nombre grande y lo que hace. Una criatura los usa cuando prepara «su ataque especial»
// (en la Mazmorra) o un truco (barrera, carga, espejo en la Torre). `descarga` es el golpe que cargó el turno anterior.
const ICONO_DESCARGA = "💢";
function textoDelEspecial(suyo, h) {
    const tipo = suyo.tipo === "descarga" ? "descarga" : suyo.especial;
    const esquivado = suyo.esquivado ? " Pero lo esquivaste." : "";
    const texto = {
        veneno: `Te envenena: pierdes ${Math.round(torre.ESPECIALES.veneno.porTurno * 100)} % de vida cada turno, ${torre.ESPECIALES.veneno.turnos} turnos. Una poción lo cura.`,
        drenar: `Se cura lo mismo que te quita${suyo.cura ? ` (+${suyo.cura})` : ""}.`,
        sellar: `Sella tu magia${suyo.sello ? `: −${suyo.sello} PM` : ""}.`,
        coraza: "Se cubre: tu próximo golpe le hará la mitad. «Quebrar» la rompe.",
        barrera: `Levanta una barrera${suyo.barrera ? ` de ${suyo.barrera}` : ""} que absorbe tus golpes. «Quebrar» y la Voluntad la rompen.`,
        carga: "¡Está cargando un golpe enorme! Defiéndete el próximo turno o usa «Intimidar».",
        reflejo: "Se cubre con un espejo: tu próximo hechizo le rebota. Usa un golpe normal.",
        descarga: "¡Suelta el golpe que cargaba! Defenderte lo reduce.",
    }[tipo];
    return { tipo, icono: tipo === "descarga" ? ICONO_DESCARGA : torre.ESPECIALES[tipo].icono, texto: `${texto || ""}${esquivado}` };
}

// (v58) La secuencia del turno, bien clara: 1 Tú → 2 tu mascota → 3 la criatura → 4 el fin del turno.
// Después de actuar muestra lo que pasó en ese orden (cada paso se enciende cuando le toca); antes de actuar, lo que va a pasar.
// Devuelve una lista de pasos [{ icono, quien, texto, clase, cuando }].
function pasosDelTurno(t, ctxTurno) {
    const { eventos, tuyo, mio, suyo, veneno, regenera, cayo, elemento, pet, criatura, especial, esquivaste, enfurecido, cambioDeForma } = ctxTurno;
    const p = t.partida;
    const m = p.enemigo;
    const h = p.heroe;
    const pasos = [];
    if (eventos.length) {
        // --- Lo que acaba de pasar ---
        if (tuyo) {
            const que = elemento ? `${elemento.icono} ${elemento.nombre}`
                : tuyo.tipo === "tecnica" ? `${torre.TECNICAS[tuyo.tecnica].icono} ${tuyo.nombre}`
                : tuyo.tipo === "voluntad" ? "✨ Golpe de Voluntad"
                : { atacar: "⚔️ Ataque", defender: "🛡️ Defensa", pocion: "🧪 Poción" }[tuyo.tipo] || "Tu turno";
            const resultado = tuyo.dano ? ` · ${tuyo.critico ? "¡crítico! " : ""}${tuyo.dano}` : tuyo.cura ? ` · +${tuyo.cura} ❤️` : "";
            const notadas = (tuyo.activas || []).map(infoDeHabilidad).filter(Boolean).map((i) => i.icono).join("");
            pasos.push({ icono: "🧑", quien: "Tú", texto: `${que}${resultado}${notadas ? ` ${notadas}` : ""}`, clase: "tuyo", cuando: 0 });
        }
        if (mio) pasos.push({ icono: "🐾", quien: pet?.nombre || "Tu mascota", texto: `${mio.nombre}${mio.dano ? ` · ${mio.dano}` : mio.cura ? ` · +${mio.cura} ❤️` : ""}`, clase: "mascota", cuando: TURNO_MASCOTA });
        if (cayo) {
            pasos.push({ icono: "💀", quien: criatura.nombre || m.nombre, texto: "Cae derrotada", clase: "cae", cuando: TURNO_ENEMIGO });
        } else if (suyo) {
            const sp = especial ? textoDelEspecial(suyo, h) : null;
            const texto = ["intimidada", "aturdida", "petrificada"].includes(suyo.tipo) ? "Pierde su turno"
                : sp ? `${sp.icono} «${suyo.nombre}»${suyo.dano ? ` · −${suyo.dano} ❤️` : ""}`
                : suyo.tipo === "curar" ? `💚 ${suyo.nombre} · +${suyo.cura}`
                : suyo.tipo === "furia" ? "😡 Se enfurece"
                : `«${suyo.nombre}»${esquivaste ? " · ¡esquivado!" : suyo.dano ? ` · −${suyo.dano} ❤️` : ""}`;
            pasos.push({ icono: "👹", quien: criatura.nombre || m.nombre, texto, clase: sp ? "especial" : "criatura", cuando: TURNO_ENEMIGO });
        }
        const fin = [];
        if (enfurecido) fin.push("😡 ¡Furia!");
        if (cambioDeForma) fin.push("🔁 Cambia de forma");
        if (regenera) fin.push(`🌿 Se regenera +${regenera.cura}`);
        if (veneno) fin.push(`☠️ Veneno −${veneno.dano}`);
        if (fin.length) pasos.push({ icono: "⏳", quien: "Fin del turno", texto: fin.join(" · "), clase: "fin", cuando: TURNO_ENEMIGO + 450 });
        return pasos;
    }
    // --- Lo que va a pasar ---
    pasos.push({ icono: "🧑", quien: "Tú", texto: "Elige un comando", clase: "tuyo", cuando: 0, ahora: true });
    if (pet && pet.potencia > 0) pasos.push({ icono: "🐾", quien: pet.nombre, texto: "Actúa si le toca", clase: "mascota", cuando: 0 });
    const intencion = torre.textoIntencion(m, h);
    const esEspecial = m.intencion === "especial" || m.intencion === "descarga";
    pasos.push({ icono: "👹", quien: criatura.nombre || m.nombre, texto: `${intencion.icono} ${intencion.texto}`, clase: esEspecial ? "especial" : "criatura", cuando: 0 });
    return pasos;
}

// ===== (v60) La batalla, más clara =====

// Una barra de vida pequeña encima de un personaje. Si el golpe acaba de pasar, un «fantasma» claro muestra lo que
// perdió y se encoge hasta la vida de ahora (cuando: en qué momento del turno pasa).
function vidaEncima(actual, maximo, antes, cuando, clase = "") {
    const pct = (n) => Math.max(0, Math.min(100, Math.round((n / Math.max(1, maximo)) * 100)));
    const cambio = antes !== actual;
    return `<span class="ff-hp ${clase} ${actual / maximo < 0.3 ? "grave" : ""}" aria-hidden="true">
                ${cambio ? `<i class="ff-hp-fantasma" style="--antes: ${pct(antes)}%; --ahora: ${pct(actual)}%; animation-delay: ${cuando}ms"></i>` : ""}
                <i class="ff-hp-relleno" style="width: ${pct(actual)}%"></i>
                <b>${Math.max(0, actual)}/${maximo}</b>
            </span>`;
}

// Los estados que hay que ver de un vistazo, como iconos junto a la barra.
function iconosDeEstado(m) {
    const e = torre.ESPECIALES;
    return [
        m.elite ? "⭐" : "",
        m.coraza ? e.coraza.icono : "",
        m.barrera > 0 ? `${e.barrera.icono}${m.barrera}` : "",
        m.espejo ? e.reflejo.icono : "",
        m.cargando ? e.carga.icono : "",
        m.enfurecido ? "😡" : "",
        m.petrificada ? "🪨" : "",
    ].filter(Boolean).join(" ");
}

function iconosDelHeroe(h) {
    return [
        h.veneno > 0 ? `${torre.ESPECIALES.veneno.icono}${h.veneno}` : "",
        (h.voluntad || 0) >= torre.VOLUNTAD.max ? "✨" : "",
    ].filter(Boolean).join(" ");
}

// El orden del turno, arriba de la escena, con la cara de cada uno (como en los RPG): quién actúa ahora y quién después.
// Antes de actuar: tú «Ahora», los demás «Luego». Después de actuar: cada cara se enciende en su momento y queda marcada ✓.
function ordenDelTurno(t, jugado) {
    const p = t.partida;
    const pet = p.mascota;
    const caras = [
        { img: t.sprites.heroe, nombre: t.nombre, clase: "tuyo", cuando: 0 },
        ...(pet && pet.potencia > 0 && t.sprites.mascota ? [{ img: t.sprites.mascota, nombre: pet.nombre, clase: "mascota", cuando: TURNO_MASCOTA }] : []),
        { img: t.sprites.enemigo, nombre: p.enemigo.nombre, clase: "criatura", cuando: TURNO_ENEMIGO },
    ];
    return `
        <ol class="ff-orden ${jugado ? "jugado" : "plan"}" aria-label="Orden del turno">
            ${caras.map((c, i) => `
                <li class="ff-orden-cara ff-orden-${c.clase} ${!jugado && i === 0 ? "ahora" : ""}" style="animation-delay: ${c.cuando}ms" title="${esc(c.nombre)}">
                    <span class="ff-orden-marco">${c.img ? `<img src="${c.img}" alt="" draggable="false">` : ""}</span>
                    <small>${jugado ? "✓" : i === 0 ? "Ahora" : "Luego"}</small>
                </li>`).join("")}
        </ol>`;
}

// Lo que va a hacer la criatura en su turno, en un globo sobre la escena (lo más importante para decidir).
function globoDeIntencion(p) {
    const m = p.enemigo;
    if (p.fase !== "batalla" || m.vida <= 0) return "";
    const i = m.petrificada ? { icono: "🪨", texto: "De piedra: pierde su turno" } : torre.textoIntencion(m, p.heroe);
    const peligro = ["especial", "descarga", "fuerte"].includes(m.intencion) ? "peligro" : m.intencion === "golpe" ? "" : "aviso";
    return `<p class="ff-globo ${peligro}" role="status"><span aria-hidden="true">⚠️</span> ${i.icono} ${esc(i.texto)}</p>`;
}

// Una tarjeta del botín: icono grande, nombre, efecto y qué clase de mejora es (ofensiva, defensiva, mágica o táctica).
function tarjetaMejora(clave, i) {
    const mejora = torre.MEJORAS[clave];
    const tipo = torre.TIPOS_DE_MEJORA[mejora.tipo] || torre.TIPOS_DE_MEJORA.tactica;
    return `
        <button type="button" class="ff-carta tipo-${mejora.tipo || "tactica"} ${mejora.don ? "don" : ""}" data-accion="torre-mejora" data-mejora="${clave}"
                style="animation-delay: ${i * 90}ms">
            ${mejora.don ? '<span class="ff-carta-cinta">✦ Don raro</span>' : ""}
            <span class="ff-carta-icono" aria-hidden="true">${mejora.icono}</span>
            <b class="ff-carta-nombre">${mejora.nombre}</b>
            <span class="ff-carta-texto">${mejora.texto}</span>
            <span class="ff-carta-tipo">${tipo.icono} ${tipo.nombre}</span>
        </button>`;
}

function tarjetaRuta(clave, i) {
    const r = torre.RUTAS[clave];
    return `
        <button type="button" class="ff-carta ff-ruta ruta-${clave}" data-accion="torre-ruta" data-ruta="${clave}" style="animation-delay: ${i * 120}ms">
            <span class="ff-carta-icono" aria-hidden="true">${r.icono}</span>
            <b class="ff-carta-nombre">${r.nombre}</b>
            <span class="ff-carta-texto">${r.texto}</span>
            <span class="ff-carta-tipo">${r.riesgo}</span>
        </button>`;
}

// (v63) Una habilidad del equipo o un don: su icono, nombre y texto (para mostrarla en pantalla).
const infoDeHabilidad = (clave) => habilidades.HABILIDADES[clave] || torre.MEJORAS[clave] || null;

// Las habilidades que se notaron en un golpe, como etiquetas que aparecen una tras otra (desde `cuando` milisegundos).
function etiquetasDeHabilidad(claves = [], cuando = 0) {
    return claves.map(infoDeHabilidad).filter(Boolean).map((i, n) =>
        `<span class="ff-hab" style="animation-delay: ${cuando + n * 280}ms">${i.icono} ${esc(i.nombre)}</span>`).join("");
}

// El panel plegable con todo lo que sabes hacer: tus habilidades del equipo, tus dones y tus técnicas.
function panelDeHabilidades(h) {
    const pasivas = [...(h.habilidades || []), ...(h.dones || [])].map(infoDeHabilidad).filter(Boolean);
    const tecnicas = (h.tecnicas || []).map((c) => torre.TECNICAS[c]).filter(Boolean);
    const cuantas = pasivas.length + tecnicas.length;
    if (!cuantas) return "";
    const fila = (i, extra = "") => `<li class="ff-hab-fila"><span class="ff-hab-icono" aria-hidden="true">${i.icono}</span>
        <span><b>${esc(i.nombre)}</b>${extra}<small>${esc(i.texto)}</small></span></li>`;
    return `
        <details class="ff-ventana ff-habilidades">
            <summary>🎖️ Habilidades y técnicas <small>(${cuantas})</small></summary>
            <ul>
                ${pasivas.map((i) => fila(i, i.don ? " <em>don</em>" : " <em>pasiva</em>")).join("")}
                ${tecnicas.map((i) => fila(i, " <em>técnica</em>")).join("")}
            </ul>
        </details>`;
}

export function pantallaTorre(t) {
    if (t.resultado) return finalTorre(t);
    const p = t.partida;
    const h = p.heroe;
    const m = p.enemigo;
    const sitio = bestiario.lugarDe(p.lugar);   // la Torre o la Mazmorra
    const criatura = bestiario.CRIATURAS[m.id] || {};
    const zona = bestiario.zonaDelPiso(p.piso, p.lugar);
    const eventos = t.eventos || [];

    // Lo que acaba de pasar, para las animaciones. El orden: tu acción (enseguida), la de tu
    // mascota (a los 0,4 s) y la respuesta de la criatura (a los 0,65 s).
    const tuyo = eventos.find((e) => e.quien === "heroe");
    const suyo = eventos.find((e) => e.quien === "enemigo" && e.tipo !== "derrotado");
    const cambioDeForma = eventos.find((e) => e.quien === "fase");      // el último guardián cambió de forma (v38)
    const regenera = eventos.find((e) => e.quien === "regenera");       // y lo que se regeneró al final del turno
    const veneno = eventos.find((e) => e.quien === "veneno");          // lo que te quitó el veneno al final del turno
    const enfurecido = eventos.some((e) => e.quien === "furia");       // un guardián de la Mazmorra se enfureció
    const pega = suyo && torre.GOLPES.includes(suyo.tipo) && suyo.especial !== "coraza";
    const mio = eventos.find((e) => e.quien === "mascota" && e.tipo !== "renacer");   // lo que hizo tu mascota
    const renacer = eventos.find((e) => e.tipo === "renacer");
    const gracia = eventos.find((e) => e.habilidad === "gracia");
    const cayo = eventos.some((e) => e.tipo === "derrotado");
    const tePego = suyo?.dano ? suyo : null;
    const esquivaste = suyo?.esquivado;
    const elemento = tuyo?.tipo === "hechizo" ? bestiario.ELEMENTOS[tuyo.elemento] : null;
    const pet = p.mascota;
    // (v58) Los ataques especiales de la criatura: se ven como un banner grande y con su efecto propio.
    const especial = suyo && !esquivaste && (suyo.especial || suyo.tipo === "descarga") ? (suyo.tipo === "descarga" ? "descarga" : suyo.especial) : null;
    const especialInfo = suyo && (suyo.especial || suyo.tipo === "descarga") ? textoDelEspecial(suyo, h) : null;
    const bannerEspecial = especialInfo?.texto ? `
        <div class="ff-especial ff-especial-${especialInfo.tipo}" style="animation-delay: ${TURNO_ENEMIGO}ms" aria-hidden="true">
            <span class="ff-especial-icono">${especialInfo.icono}</span>
            <span class="ff-especial-texto"><b>«${esc(suyo.nombre)}»</b><small>${esc(especialInfo.texto)}</small></span>
        </div>` : "";
    const fxEnemigo = ["carga", "barrera", "coraza", "reflejo", "descarga"].includes(especial)
        ? `<span class="ff-sp ff-sp-${especial}" style="animation-delay: ${TURNO_ENEMIGO + 150}ms" aria-hidden="true"></span>` : "";
    const fxHeroe = ["veneno", "sellar", "drenar"].includes(especial)
        ? `<span class="ff-sp ff-sp-${especial}" style="animation-delay: ${TURNO_ENEMIGO + 250}ms" aria-hidden="true"></span>` : "";
    // (v67) El ataque de la criatura se VE: garras, tajo, mordida, escupitajo, fuego, rayo… (ver ataques.js). Los especiales que
    // ya traen su propio efecto (veneno, sellar, drenar) no lo repiten.
    const golpeFuerte = suyo && ["fuerte", "descarga", "especial"].includes(suyo.tipo);
    const fxAtaque = pega && !fxHeroe
        ? ataques.htmlDelAtaque(ataques.estiloDe(m.id), criatura, { fuerte: golpeFuerte, falla: Boolean(esquivaste) }) : "";
    const secuencia = eventos.length ? (() => {
        const pasos = pasosDelTurno(t, { eventos, tuyo, mio, suyo, veneno, regenera, cayo, elemento, pet, criatura, especial: Boolean(especialInfo),
                                         esquivaste, enfurecido, cambioDeForma });
        return `
        <ol class="ff-turnos ${eventos.length ? "jugado" : "plan"}" aria-label="${eventos.length ? "Lo que pasó en el turno, en orden" : "Lo que va a pasar este turno, en orden"}">
            ${pasos.map((paso, i) => `
                <li class="ff-turno ff-turno-${paso.clase} ${paso.ahora ? "ahora" : ""}" style="animation-delay: ${paso.cuando}ms">
                    <span class="ff-turno-numero" aria-hidden="true">${i + 1}</span>
                    <span class="ff-turno-icono" aria-hidden="true">${paso.icono}</span>
                    <span class="ff-turno-texto"><b>${esc(paso.quien)}</b><small>${esc(paso.texto)}</small></span>
                </li>`).join("")}
        </ol>`;
    })() : "";

    // (v60) La vida de antes del turno, para que la barra muestre lo que se perdió (lo que te curaste se resta).
    const antesEnemigo = Math.min(m.vidaMax, Math.max(0, m.vida) + (tuyo?.dano || 0) + (mio?.dano || 0) - (tuyo?.absorbido || 0)
        - (regenera?.cura || 0) - (suyo?.cura || 0));
    const antesHeroe = Math.min(h.vidaMax, Math.max(0, h.vida) + (tePego?.dano || 0) + (veneno?.dano || 0) + (tuyo?.reflejado || 0)
        - (tuyo?.cura || 0) - (mio?.tipo === "cura" ? mio.cura : 0) - ((gracia || renacer)?.cura || 0));
    // El tajo: un arco grande (dorado si es crítico; enorme si es el Golpe de Voluntad).
    const golpeFisico = tuyo?.dano && (tuyo.tipo === "atacar" || tuyo.tipo === "tecnica" || tuyo.tipo === "voluntad");
    const arco = golpeFisico ? `<span class="ff-arco ${tuyo.tipo === "voluntad" ? "voluntad" : tuyo.critico ? "critico" : ""}" aria-hidden="true"></span>` : "";
    const avisoCritico = tuyo?.critico ? '<span class="ff-aviso ff-critico" aria-hidden="true">¡CRÍTICO!</span>' : "";
    const victoria = cayo ? `<p class="ff-victoria" aria-hidden="true">¡Victoria!</p>` : "";

    // El cartel de arriba dice el nombre de lo que se usa: lo tuyo, lo de tu mascota y lo de la criatura.
    const cartel = (texto, cuando) => `<p class="ff-ventana ff-anuncio" style="animation-delay: ${cuando}ms">${esc(texto)}</p>`;
    const tuCartel = elemento ? `${elemento.icono} ${elemento.nombre}`
        : tuyo?.tipo === "tecnica" ? `${torre.TECNICAS[tuyo.tecnica].icono} ${tuyo.nombre}`
        : tuyo?.tipo === "voluntad" ? "✨ Golpe de Voluntad"
        : { defender: "Defensa", pocion: "Poción" }[tuyo?.tipo];
    const carteles = `${tuCartel ? cartel(tuCartel, 0) : ""}${mio ? cartel(mio.nombre, TURNO_MASCOTA) : ""}` +
                     `${suyo?.nombre && !especialInfo ? cartel(suyo.nombre, TURNO_ENEMIGO) : ""}`;

    // --- La criatura ---
    const clasesEnemigo = [
        criatura.vuela ? "vuela" : "",
        tuyo?.dano ? "golpeado" : "",
        mio?.dano ? "golpeado-mascota" : "",
        pega ? "ataca" : "",
        suyo?.tipo === "furia" || suyo?.especial === "carga" || cambioDeForma ? "furia" : "",
        ["coraza", "barrera", "reflejo"].includes(suyo?.especial) ? "coraza" : "",
        mio?.tipo === "petrificar" ? "piedra" : "",
        cayo ? (suyo?.reflejo ? "cae tarde" : "cae") : m.vida <= 0 ? "vencido" : "",
    ].join(" ");
    // (v63) Cada técnica tiene su propio efecto (Analizar e Intimidar también, aunque no hagan daño).
    const claseDeEfecto = tuyo?.tipo === "hechizo" ? tuyo.elemento : tuyo?.tipo === "voluntad" ? "voluntad" : tuyo?.tipo === "tecnica" ? tuyo.tecnica : "tajo";
    const efecto = !tuyo || !(tuyo.dano || tuyo.tipo === "tecnica") ? ""
        : `<span class="ff-efecto ff-${claseDeEfecto}" aria-hidden="true"></span>`;
    const efectoMascota = !mio?.dano ? "" : `<span class="ff-efecto ff-${mio.elemento || "garra"} ff-de-mascota" aria-hidden="true"></span>`;
    const enemigo = `
        <div class="ff-bando ff-enemigo ${clasesEnemigo} ${m.elite ? "elite" : ""}">
            <span class="ff-sombra"></span>
            ${spriteFF(t.sprites.enemigo, m.nombre, criatura.talla || 96, tinteDeVuelta(m.vuelta))}
            ${efecto}${arco}${efectoMascota}${fxEnemigo}${avisoCritico}
            ${tuyo?.dano ? numeroFF(tuyo.dano, tuyo.critico ? "critico" : "", 300) : ""}
            ${mio?.dano ? numeroFF(mio.dano, "de-mascota", TURNO_MASCOTA + 120) : ""}
            ${suyo?.reflejo ? numeroFF(suyo.reflejo, "de-mascota", TURNO_ENEMIGO + 350) : ""}
            ${tuyo?.reaccion ? `<span class="ff-aviso ff-reaccion" aria-hidden="true">${torre.REACCIONES[tuyo.reaccion].icono} ${torre.REACCIONES[tuyo.reaccion].nombre}</span>` : ""}
            ${tuyo?.efecto === "debil" ? '<span class="ff-aviso" aria-hidden="true">¡Punto débil!</span>' : ""}
            ${tuyo?.efecto === "resiste" ? '<span class="ff-aviso ff-resiste" aria-hidden="true">Resiste</span>' : ""}
            ${tuyo?.coraza && !tuyo?.efecto ? '<span class="ff-aviso ff-resiste" aria-hidden="true">Coraza</span>' : ""}
            ${tuyo?.absorbido && !tuyo?.efecto && !tuyo?.coraza ? '<span class="ff-aviso ff-resiste" aria-hidden="true">Barrera</span>' : ""}
            ${tuyo?.rompio ? '<span class="ff-aviso" aria-hidden="true">¡Roto!</span>' : ""}
            ${enfurecido ? '<span class="ff-aviso ff-furia" aria-hidden="true">¡Furia!</span>' : ""}
            ${cambioDeForma ? '<span class="ff-aviso ff-furia" aria-hidden="true">¡Cambia de forma!</span>' : ""}
            ${regenera ? numeroFF(`+${regenera.cura}`, "cura", TURNO_ENEMIGO + 550) : ""}
            ${suyo?.cura ? numeroFF(suyo.cura, "cura", TURNO_ENEMIGO + (suyo.especial === "drenar" ? 450 : 150)) : ""}
        </div>`;

    // --- Tu mascota (si te acompaña) ---
    const clasesMascota = [
        mio && (mio.tipo === "ataque" || mio.tipo === "petrificar") ? "ataca" : "",
        mio && (mio.tipo === "mana" || mio.tipo === "cura") ? "brilla" : "",
        renacer ? "renace" : "",
        pet && pet.potencia <= 0 ? "quieta" : "",
    ].join(" ");
    const mascotaHtml = pet && t.sprites.mascota ? `
        <div class="ff-bando ff-mascota ${clasesMascota}">
            <span class="ff-sombra"></span>
            ${spriteFF(t.sprites.mascota, pet.nombre, 44)}
        </div>` : "";

    // --- Tu héroe ---
    const clasesHeroe = [
        { atacar: "ataca", hechizo: "lanza", defender: "defiende", pocion: "bebe", voluntad: "ataca voluntad" }[tuyo?.tipo]
            || (tuyo?.tipo === "tecnica" ? (tuyo.dano ? "ataca" : "lanza") : ""),
        tePego ? "herido" : "",
        h.veneno > 0 ? "envenenado" : "",
        esquivaste ? "esquiva" : "",
        gracia || renacer ? "salvado" : "",
        p.fase === "fin" ? "ko" : "",
        p.fase === "mejora" ? "victoria" : "",
        eventos.length ? "tras-golpe" : "",
    ].join(" ");
    const curaDeMascota = mio?.tipo === "cura" ? mio.cura : 0;
    const heroe = `
        <div class="ff-bando ff-heroe ${clasesHeroe}">
            <span class="ff-encima">${vidaEncima(h.vida, h.vidaMax, antesHeroe, TURNO_ENEMIGO + 250, "de-heroe")}<span class="ff-estados">${iconosDelHeroe(h)}</span></span>
            <span class="ff-sombra"></span>
            ${spriteFF(t.sprites.heroe, t.nombre, 54)}
            ${tuyo?.tipo === "defender" ? '<span class="ff-escudo" aria-hidden="true"></span>' : ""}${fxHeroe}
            <span class="ff-habs" aria-hidden="true">${etiquetasDeHabilidad(tuyo?.activas, 80)}${etiquetasDeHabilidad(suyo?.activas, TURNO_ENEMIGO + 300)}</span>
            ${tuyo?.cura ? numeroFF(tuyo.cura, "cura", 150) : ""}
            ${tuyo?.reflejado ? numeroFF(`${tuyo.reflejado} 🪞`, "", 300) : ""}
            ${tuyo?.mana ? numeroFF("+1 PM", "pm", 150) : ""}
            ${curaDeMascota ? numeroFF(curaDeMascota, "cura", TURNO_MASCOTA + 100) : ""}
            ${mio?.tipo === "mana" ? numeroFF("+1 PM", "pm", TURNO_MASCOTA + 100) : ""}
            ${tePego ? numeroFF(tePego.dano, "", TURNO_ENEMIGO + 250) : ""}
            ${suyo?.sello ? numeroFF(`−${suyo.sello} PM`, "pm", TURNO_ENEMIGO + 500) : ""}
            ${veneno ? numeroFF(`${veneno.dano} ☠️`, "veneno", TURNO_ENEMIGO + 700) : ""}
            ${esquivaste ? numeroFF("¡Esquivas!", "pm", TURNO_ENEMIGO + 250) : ""}
            ${gracia || renacer ? numeroFF(`+${(gracia || renacer).cura}`, "cura", TURNO_ENEMIGO + 700) : ""}
        </div>`;

    const escena = `
        <div class="ff-escena ${tuyo?.elemento === "rayo" ? "relampago" : ""} ${especial === "descarga" || (golpeFuerte && pega && !esquivaste && ["golpe", "mordida"].includes(ataques.estiloDe(m.id))) ? "ff-sacude" : ""} ${tuyo?.tipo === "voluntad" ? "ff-destella" : ""}">
            ${salaFF(t.sprites.sala)}${carteles}${enemigo}${heroe}${mascotaHtml}${fxAtaque}${bannerEspecial}
            <div class="ff-hud ff-hud-enemigo">
                <b>${m.guardian ? "👑 " : ""}${esc(m.nombre)}</b>
                ${vidaEncima(m.vida, m.vidaMax, antesEnemigo, 300, "de-enemigo")}
                <span class="ff-estados">${iconosDeEstado(m)}</span>
            </div>
            ${p.fase === "batalla" || eventos.length ? ordenDelTurno(t, eventos.length > 0) : ""}
            ${globoDeIntencion(p)}
            ${victoria}
        </div>
        ${secuencia}`;

    // --- Abajo: los comandos (o el botín, o el final) y las fichas ---
    // Si aparecen justo después de un golpe, esperan un instante para que se vea el golpe final.
    const espera = eventos.length ? "tras-golpe" : "";
    let abajo;
    if (p.fase === "mejora") {
        abajo = `
            <div class="ff-ventana ff-botin ${espera ? "tras-victoria" : ""}">
                <p class="ff-titulo">¡Victoria! <small>${sitio.piso} ${p.piso} superado${m.elite ? " · ⭐ era de élite" : ""}</small></p>
                <p class="ff-renglon">Elige tu botín:</p>
                <div class="ff-cartas">${p.opciones.map(tarjetaMejora).join("")}</div>
            </div>`;
    } else if (p.fase === "ruta") {
        // v60: el camino se bifurca. Dos tarjetas: más riesgo y mejor botín, o un respiro.
        abajo = `
            <div class="ff-ventana ff-botin ${espera}">
                <p class="ff-titulo">🔀 El camino se bifurca <small>antes del ${sitio.piso.toLowerCase()} ${p.piso}</small></p>
                <p class="ff-renglon">Elige por dónde sigues: cambia lo que te espera.</p>
                <div class="ff-cartas ff-cartas-dos">${Object.keys(torre.RUTAS).map(tarjetaRuta).join("")}</div>
            </div>
            <button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Huir y cobrar lo ganado</button>`;
    } else if (p.fase === "sala") {
        // v42: una sala entre pisos. Cada opción dice lo que cuesta y lo que da; la que no puedes hacer se apaga.
        const sala = torre.SALAS[p.sala.tipo];
        abajo = `
            <div class="ff-ventana ff-botin ${espera}">
                <p class="ff-titulo">${sala.icono} ${sala.nombre} <small>antes del ${sitio.piso.toLowerCase()} ${p.piso}</small></p>
                <p class="ff-renglon">${esc(sala.texto)}</p>
                ${Object.entries(sala.opciones).map(([clave, o]) => {
                    const motivo = torre.motivoSala(p, clave);
                    return `<button type="button" class="ff-comando" data-accion="torre-sala" data-opcion="${clave}" ${motivo ? `disabled title="${esc(motivo)}"` : ""}>
                                <span class="ff-cursor" aria-hidden="true"></span>
                                <span class="ff-comando-nombre">${o.nombre}</span><small>${motivo ? esc(motivo) : o.texto}</small></button>`;
                }).join("")}
            </div>
            <button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Huir y cobrar lo ganado</button>`;
    } else if (p.fase === "fin") {
        const pisos = torre.pisosSuperados(p);
        const premio = torre.premio(pisos, p.lugar, p.marca, torre.modoDe(p));
        const atributo = ATRIBUTOS[torre.REGLAS[sitio.id].atributo];
        const piso = sitio.piso.toLowerCase();
        abajo = `
            <div class="ff-ventana ff-botin ${espera}">
                <p class="ff-titulo">${sitio.verboFin || (sitio.id === "mazmorra" ? "Fin del descenso" : "Fin de la subida")} <small>Caíste en el ${piso} ${p.piso}</small></p>
                <p class="ff-renglon">Superaste <b>${torre.modoDe(p) === "asalto" ? plural(Math.round(pisos / torre.CADA_GUARDIAN), "guardián", "guardianes") : plural(pisos, piso, sitio.pisos)}</b>.</p>
                <p class="ff-renglon ff-oro">+${premio.gemas} 💎 · +${premio.xp} XP de ${atributo.icono} ${atributo.nombre}</p>
                <button type="button" class="ff-comando elegido" data-accion="torre-cobrar">
                    <span class="ff-cursor" aria-hidden="true"></span><span class="ff-comando-nombre">Cobrar premio</span></button>
            </div>`;
    } else {
        abajo = `
            <div class="ff-tablero">
                ${comandosTorre(t)}
                <div class="ff-fichas">${fichaEnemigo(t)}${fichaHeroe(h, t.nombre, p.mascota)}</div>
            </div>
            ${panelDeHabilidades(h)}
            <button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Huir y cobrar lo ganado</button>`;
    }

    // El Maestro Aurelio: una pista antes de pelear con un guardián, y unas palabras si caes.
    const consejo = p.fase === "fin" ? maestro.consueloAlCaer(torre.pisosSuperados(p))
        : p.fase === "batalla" && m.guardian && !eventos.length && m.vida === m.vidaMax ? maestro.consejoDeGuardian(m.id) : null;
    const aurelio = consejo ? `
        <div class="ff-ventana ff-maestro ${espera}">
            ${t.sprites.maestro ? `<img class="ff-maestro-retrato" src="${t.sprites.maestro}" alt="" draggable="false">` : ""}
            <p><b>Aurelio</b>${esc(consejo)}</p>
        </div>` : "";

    return `
        ${barraTorre(`${sitio.icono} ${sitio.piso} ${p.piso}`, `${torre.modoDe(p) !== "normal" ? `${torre.MODOS[torre.modoDe(p)].icono} ` : ""}${p.marca ? `${torre.MARCAS[p.marca].icono} ` : ""}${zona.nombre}${m.guardian ? " 👑" : ""}`)}
        ${escena}
        <p class="ff-ventana ff-mensaje" role="status">${esc(p.registro)}</p>
        ${aurelio}
        ${abajo}`;
}

// La ventana de comandos. El menú principal, la lista de hechizos si tocaste «Magia» o la de
// técnicas si tocaste «Técnicas» (v38). Con la Voluntad llena aparece su comando, en dorado.
function comandosTorre(t) {
    const h = t.partida.heroe;
    const m = t.partida.enemigo;
    // La manito señala el último comando que usaste.
    const fila = (clave, nombre, detalle, atributos, clase = "") => `
        <button type="button" class="ff-comando ${clave === t.ultimo ? "elegido" : ""} ${clase}" ${atributos}>
            <span class="ff-cursor" aria-hidden="true"></span><span class="ff-comando-nombre">${nombre}</span><small>${detalle}</small></button>`;

    if (t.menu === "magia") {
        const hechizos = Object.entries(bestiario.ELEMENTOS).map(([clave, e]) => {
            // Si ya probaste ese hechizo con esta criatura, tu bestiario recuerda qué le hace
            // (y con el «Ojo del dragón» lo sabes de una vez).
            const sabes = loQueSabesEnLaTorre(t, clave);
            const detalle = { debil: "¡punto débil!", resiste: "lo resiste", normal: "daño normal" }[sabes] || "sin probar";
            const reaccion = torre.reaccionPosible(t.partida, clave);
            return fila(clave, `${e.icono} ${e.nombre}`, reaccion ? `${torre.REACCIONES[reaccion].icono} ¡reacción: ${torre.REACCIONES[reaccion].nombre}!` : detalle,
                        `data-accion="torre-accion" data-torre="hechizo" data-elemento="${clave}"`, `ff-hechizo ${sabes ? `ff-${sabes}` : ""}`);
        }).join("");
        return `
            <div class="ff-ventana ff-comandos">
                <p class="ff-titulo">Magia <small>PM ${h.mana}/${h.manaMax} · daño ~${h.hechizo}</small></p>
                ${hechizos}
                ${fila("volver", "↩ Volver", "", 'data-accion="torre-menu" data-menu="principal"')}
            </div>`;
    }
    if (t.menu === "tecnicas") {
        const tecnicas = Object.entries(torre.TECNICAS).map(([clave, tecnica]) => {
            const motivo = torre.motivoTecnica(h, clave);
            const sabe = (h.tecnicas || []).includes(clave);
            const detalle = !sabe ? `🔒 ${ATRIBUTOS[tecnica.atributo].nombre} ${torre.NIVEL_TECNICA}` : motivo ? "usada en este piso" : tecnica.texto;
            return fila(clave, `${tecnica.icono} ${tecnica.nombre}`, esc(detalle),
                        `data-accion="torre-accion" data-torre="tecnica" data-tecnica="${clave}" ${motivo ? "disabled" : ""}`, "ff-hechizo ff-tecnica");
        }).join("");
        return `
            <div class="ff-ventana ff-comandos">
                <p class="ff-titulo">Técnicas <small>una vez por piso</small></p>
                ${tecnicas}
                ${fila("volver", "↩ Volver", "", 'data-accion="torre-menu" data-menu="principal"')}
            </div>`;
    }
    const a = torre.ACCIONES;
    const listas = Object.keys(torre.TECNICAS).filter((clave) => !torre.motivoTecnica(h, clave)).length;
    const voluntadLlena = (h.voluntad || 0) >= torre.VOLUNTAD.max;
    return `
        <div class="ff-ventana ff-comandos">
            ${voluntadLlena ? fila("voluntad", `${a.voluntad.icono} ${a.voluntad.nombre}`, `×${String(torre.VOLUNTAD.multiplica).replace(".", ",")}`,
                                   'data-accion="torre-accion" data-torre="voluntad"', "ff-voluntad") : ""}
            ${fila("atacar", a.atacar.nombre, `${Math.round(h.ataque * 0.85)}–${Math.round(h.ataque * 1.15)}`, 'data-accion="torre-accion" data-torre="atacar"')}
            ${fila("hechizo", a.hechizo.nombre, `PM ${h.mana}/${h.manaMax}`, `data-accion="torre-menu" data-menu="magia" ${h.mana ? "" : "disabled"}`)}
            ${fila("tecnica", a.tecnica.nombre, (h.tecnicas || []).length ? `${listas} lista${listas === 1 ? "" : "s"}` : `🔒 nivel ${torre.NIVEL_TECNICA}`,
                   `data-accion="torre-menu" data-menu="tecnicas" ${(h.tecnicas || []).length ? "" : "disabled"}`)}
            ${fila("defender", a.defender.nombre, `−${Math.round(h.defensa * 100)} % · +${h.curaDefensa}`, 'data-accion="torre-accion" data-torre="defender"')}
            ${fila("pocion", a.pocion.nombre, `×${h.pociones}`, `data-accion="torre-accion" data-torre="pocion" ${h.pociones ? "" : "disabled"}`)}
        </div>`;
}

// Lo que sabes de un hechizo contra la criatura de ahora: lo de tu bestiario o, con el
// «Ojo del dragón» (la Corona del Dragón), la verdad desde el primer turno.
// (v38: si la analizaste, también; y si cambió de forma, solo vale lo de ahora.)
function loQueSabesEnLaTorre(t, elemento) {
    const m = t.partida.enemigo;
    const forma = torre.formaActual(m);
    if (bestiario.CRIATURAS[m.id] && (m.analizado || habilidades.tiene(t.partida.heroe, "ojo-dragon"))) {
        return forma.debil === elemento ? "debil" : forma.resiste === elemento ? "resiste" : "normal";
    }
    if (m.cambio) return null;
    return bestiario.loQueSabes(t.bestiario, m.id, elemento);
}

// La ficha de la criatura: nombre, vida, qué planea, cómo está (coraza, furia) y lo que ya sabes de ella.
function fichaEnemigo(t) {
    const m = t.partida.enemigo;
    const intencion = torre.textoIntencion(m, t.partida.heroe);
    const iconos = (que) => Object.keys(bestiario.ELEMENTOS)
        .filter((e) => loQueSabesEnLaTorre(t, e) === que)
        .map((e) => bestiario.ELEMENTOS[e].icono).join("");
    const [debil, resiste] = [iconos("debil"), iconos("resiste")];
    const sabes = [debil ? `Débil: ${debil}` : "", resiste ? `Resiste: ${resiste}` : ""].filter(Boolean).join(" · ");
    return `
        <div class="ff-ventana ff-ficha">
            <b class="ff-nombre">${m.guardian ? "👑 " : ""}${esc(m.nombre)}</b>
            <div class="ff-vida"><i style="width: ${(m.vida / m.vidaMax) * 100}%"></i></div>
            <span class="ff-cifras">${m.vida}/${m.vidaMax}</span>
            <span class="ff-intencion">${m.petrificada ? "🪨 De piedra: pierde su turno" : `${intencion.icono} ${esc(intencion.texto)}`}</span>
            ${estadoDeLaCriatura(m)}
            ${sabes ? `<span class="ff-sabes">${sabes}</span>` : ""}
        </div>`;
}

// Cómo está la criatura: coraza, furia y (v38) barrera, espejo, golpe cargado, regeneración y forma.
function estadoDeLaCriatura(m) {
    const e = torre.ESPECIALES;
    const criatura = bestiario.CRIATURAS[m.id] || {};
    const partes = [
        m.coraza ? `${e.coraza.icono} Coraza: ½ de daño` : "",
        m.barrera > 0 ? `${e.barrera.icono} Barrera: ${m.barrera}` : "",
        m.espejo ? `${e.reflejo.icono} Espejo: devuelve tus hechizos` : "",
        m.cargando ? `${e.carga.icono} Cargando un golpe` : "",
        criatura.regenera ? `♻️ Se regenera ${Math.round(criatura.regenera * 100)} %` : "",
        m.cambio ? `🌑 ${criatura.fase?.nombre || "Cambió de forma"}` : "",
        m.enfurecido ? "😡 Enfurecido" : "",
    ].filter(Boolean);
    return partes.length ? `<span class="ff-sabes">${partes.join(" · ")}</span>` : "";
}

// La ficha de tu héroe: vida (VIT), hechizos que quedan (PM), Voluntad (v38), pociones,
// armadura, tus habilidades (los iconos) y tu mascota.
function fichaHeroe(h, nombre, pet) {
    const parte = h.vida / h.vidaMax;
    const estado = h.vida <= 0 ? "ko" : parte < 0.3 ? "grave" : "";
    return `
        <div class="ff-ventana ff-ficha ff-ficha-heroe ${estado}">
            <b class="ff-nombre">${esc(nombre)}</b>
            <div class="ff-vida"><i style="width: ${parte * 100}%"></i></div>
            <dl class="ff-datos">
                <dt>VIT</dt><dd>${h.vida}<small>/${h.vidaMax}</small></dd>
                <dt>PM</dt><dd>${h.mana}<small>/${h.manaMax}</small></dd>
            </dl>
            <div class="ff-voluntad-barra ${(h.voluntad || 0) >= torre.VOLUNTAD.max ? "llena" : ""}" role="img"
                 aria-label="Voluntad ${h.voluntad || 0} de ${torre.VOLUNTAD.max}"><i style="width: ${Math.min(100, ((h.voluntad || 0) / torre.VOLUNTAD.max) * 100)}%"></i></div>
            <span class="ff-sabes">🧪 ×${h.pociones}${h.proteccion ? ` · 🛡️ −${Math.round(h.proteccion * 100)} %` : ""}${
                (h.habilidades || []).length ? ` · ${h.habilidades.map((c) => habilidades.HABILIDADES[c].icono).join("")}` : ""}</span>
            ${h.veneno > 0 ? `<span class="ff-sabes ff-envenenado">${torre.ESPECIALES.veneno.icono} Veneno: ${plural(h.veneno, "turno", "turnos")} (una poción lo cura)</span>` : ""}
            ${pet ? `<span class="ff-sabes">${mascota.MASCOTAS[pet.especie].icono} ${esc(pet.nombre)} ${pet.potencia > 0 ? "" : "· no pelea"}</span>` : ""}
        </div>`;
}

function finalTorre(t) {
    const r = t.resultado;
    const sitio = bestiario.lugarDe(r.lugar);
    const atributo = ATRIBUTOS[r.atributo] || ATRIBUTOS[torre.ATRIBUTO];
    const piso = sitio.piso.toLowerCase();
    return `
        ${barraTorre(`${sitio.icono} ${sitio.nombre}`)}
        <div class="ff-escena ff-escena-final">
            ${salaFF(t.sprites.sala)}
            <div class="ff-bando ff-heroe ${r.pisos ? "victoria" : ""}">
                <span class="ff-sombra"></span>${spriteFF(t.sprites.heroe, t.nombre, 54)}
            </div>
        </div>
        <div class="ff-ventana ff-botin">
            <p class="ff-titulo">Premio cobrado</p>
            <p class="ff-puntos">${r.modo === "asalto" ? plural(Math.round(r.pisos / torre.CADA_GUARDIAN), "guardián vencido", "guardianes vencidos") : plural(r.pisos, piso, sitio.pisos)}</p>
            <p class="ff-renglon">${r.nuevoRecord ? "🏅 ¡Nuevo récord!" : `🏅 Récord: ${r.modo === "asalto" ? plural(r.record, "guardián", "guardianes") : plural(r.record, piso, sitio.pisos)}`}</p>
            <p class="ff-renglon ff-oro">+${r.premio.gemas} 💎 · +${r.premio.xp} XP de ${atributo.icono} ${atributo.nombre}</p>
            ${r.modo && r.modo !== "normal" ? `<p class="ff-renglon">${torre.MODOS[r.modo].icono} Modo: ${torre.MODOS[r.modo].nombre}</p>` : ""}
            ${r.bonus ? `<p class="ff-renglon ff-oro">📅 ¡Reto diario cumplido! +${r.bonus.gemas} 💎 · +${r.bonus.xp} XP extra</p>` : ""}
            ${r.marca ? `<p class="ff-renglon">✦ Marca: ${torre.MARCAS[r.marca].icono} ${torre.MARCAS[r.marca].nombre} · ${textoPremioMarca(torre.MARCAS[r.marca])}</p>` : ""}
            ${r.reto ? `<p class="ff-renglon ff-oro">🎯 ¡Reto del día cumplido! ${textoPremioReto(r.reto)}</p>` : ""}
            <button type="button" class="ff-comando elegido" data-accion="torre-abrir" data-lugar="${sitio.id}" ${t.fichas ? "" : "disabled"}>
                <span class="ff-cursor" aria-hidden="true"></span>
                <span class="ff-comando-nombre">${t.fichas ? (sitio.otraVez || (sitio.id === "mazmorra" ? "Bajar otra vez" : "Subir otra vez")) : "Sin fichas"}</span><small>${t.fichas ? `🎟️ ${t.fichas}` : ""}</small></button>
            <button type="button" class="ff-comando" data-accion="torre-salir">
                <span class="ff-cursor" aria-hidden="true"></span><span class="ff-comando-nombre">Salir</span></button>
        </div>`;
}


// ===== Una página de la historia (v29) =====
// Se muestra en la misma capa que la batalla, la primera vez que llegas a una parte nueva.
// r = { pagina: { etiqueta, titulo, parrafos, aviso }, sala (imagen de fondo), numero, total }
export function pantallaRelato(r) {
    const { pagina } = r;
    const ultima = r.numero >= r.total;
    return `
        ${barraTorre("📜 Historia", `${r.numero} de ${r.total}`)}
        <div class="ff-escena ff-escena-relato">
            ${salaFF(r.sala)}
            <p class="ff-relato-titulo"><small>${esc(pagina.etiqueta)}</small>${esc(pagina.titulo)}</p>
        </div>
        <div class="ff-ventana ff-relato">
            ${pagina.parrafos.map((texto) => `<p>${esc(texto)}</p>`).join("")}
            ${pagina.aviso ? `<p class="ff-oro">${esc(pagina.aviso)}</p>` : ""}
            <button type="button" class="ff-comando elegido" data-accion="torre-relato">
                <span class="ff-cursor" aria-hidden="true"></span>
                <span class="ff-comando-nombre">${ultima ? "¡A pelear!" : "Continuar"}</span><small>${ultima ? "" : "▸"}</small></button>
        </div>`;
}

// ===== La historia completa de un lugar, para releer (v29) =====
// h = { lugar ("torre" | "mazmorra"), capitulos (leyendas.capitulosDeLeyenda) }
export function pantallaHistoria(h) {
    const sitio = bestiario.lugarDe(h.lugar);
    const leyenda = leyendas.LEYENDAS[sitio.id];
    const ultimoAbierto = [...h.capitulos].reverse().find((c) => c.abierto && c.parrafos.length)?.id;
    const capitulos = h.capitulos.map((c) => {
        if (!c.abierto) {
            return `<article class="ff-ventana ff-capitulo cerrado">
                        <p class="ff-titulo">${esc(c.numero)} · ${esc(c.titulo)} <small>🔒</small></p>
                        <p class="ff-renglon"><small>${esc(c.bloqueado)}</small></p>
                    </article>`;
        }
        // (v56) Cada capítulo se abre y se cierra; el último que puedes leer viene abierto, con su botón para verlo animado.
        return `<details class="ff-ventana ff-capitulo" ${c.id === ultimoAbierto ? "open" : ""}>
                    <summary class="ff-titulo">${esc(c.numero)} · ${esc(c.titulo)}</summary>
                    ${c.parrafos.map((texto) => `<p>${esc(texto)}</p>`).join("")}
                    ${c.pendiente ? `<p class="ff-renglon"><small>⏳ ${esc(c.pendiente)}</small></p>` : ""}
                    ${c.aviso ? `<p class="ff-oro">${esc(c.aviso)}</p>` : ""}
                    <button type="button" class="boton boton-chico ff-ver-escena" data-accion="cine-capitulo" data-lugar="${esc(h.lugar)}" data-id="${esc(c.id)}">▶ Ver escena</button>
                </details>`;
    }).join("");
    return `
        ${barraTorre(`📜 ${esc(leyenda.titulo)}`, sitio.nombre)}
        <div class="ff-historia">${capitulos}</div>`;
}


// ===== El bestiario: las criaturas de la Torre (y de la Mazmorra) que ya conoces =====
// b = { bestiario (estado.arcade.bestiario), sprites: { id: imagen }, mazmorra (true si ya se abrió) }
export function pantallaBestiario(b) {
    // (v64) b.abiertos = los lugares que ya se abrieron (si no se dice, la Torre y, con `mazmorra`, la Mazmorra).
    const abiertos = b.abiertos || ["torre", ...(b.mazmorra ? ["mazmorra"] : [])];
    const progreso = abiertos.map((lugar) => bestiario.progresoBestiario(b.bestiario, lugar));
    const vistas = progreso.reduce((suma, x) => suma + x.vistas, 0);
    const total = progreso.reduce((suma, x) => suma + x.total, 0);
    const seccion = (lugar) => {
        const sitio = bestiario.LUGARES[lugar];
        const zonas = sitio.zonas.map((zona, i) => {
            const criaturas = sitio.orden.filter((id) => bestiario.CRIATURAS[id].zona === zona.id).map((id) => {
                const c = bestiario.CRIATURAS[id];
                const piso = sitio.orden.indexOf(id) + 1;
                const ficha = bestiario.fichaDe(b.bestiario, id);
                const imagen = `<img class="ff-sprite" src="${b.sprites[id] || ""}" alt="" style="--talla: ${c.talla}" draggable="false">`;
                const guardian = c.guardian ? ` · ${c.genero === "f" ? "Guardiana" : "Guardián"}` : "";
                if (!ficha) {
                    // Todavía no te la cruzaste: solo su sombra.
                    return `<article class="ff-ventana ff-criatura desconocida">
                                <div class="ff-retrato">${imagen}</div>
                                <div><b class="ff-nombre">???</b><small>${sitio.piso} ${piso}${guardian}</small></div>
                            </article>`;
                }
                const elementos = Object.entries(bestiario.ELEMENTOS).map(([clave, e]) => {
                    const sabes = bestiario.loQueSabes(b.bestiario, id, clave);
                    const texto = { debil: "débil", resiste: "resiste", normal: "normal" }[sabes] || "?";
                    return `<span class="ff-elemento ${sabes ? `ff-${sabes}` : ""}">${e.icono} ${texto}</span>`;
                }).join("");
                const especial = c.especial ? torre.ESPECIALES[c.especial.tipo] : null;
                return `<article class="ff-ventana ff-criatura">
                            <div class="ff-retrato">${imagen}</div>
                            <div>
                                <b class="ff-nombre">${c.guardian ? "👑 " : ""}${c.nombre}</b>
                                <small>${sitio.piso} ${piso} · ${ficha.vencidos ? `vencid${c.genero === "f" ? "a" : "o"} ×${ficha.vencidos}` : "sin vencer"}</small>
                                <p>${c.texto}</p>
                                ${especial ? `<p class="ff-especial">${especial.icono} «${c.especial.nombre}» · ${especial.nombre.toLowerCase()}</p>` : ""}
                                ${c.regenera ? `<p class="ff-especial">♻️ Se regenera un ${Math.round(c.regenera * 100)} % por turno</p>` : ""}
                                ${c.fase ? `<p class="ff-especial">🌑 A media vida cambia de forma («${c.fase.nombre}»): su punto débil cambia</p>` : ""}
                                <div class="ff-elementos">${elementos}</div>
                            </div>
                        </article>`;
            }).join("");
            const desde = i * bestiario.PISOS_POR_ZONA + 1;
            const plurales = sitio.pisos;
            return `<h3 class="ff-zona-titulo">${zona.nombre} <small>${plurales} ${desde}–${desde + bestiario.PISOS_POR_ZONA - 1}</small></h3>
                    <p class="ff-zona-texto">${zona.texto}</p>${criaturas}`;
        }).join("");
        return `<h2 class="ff-lugar-titulo">${sitio.icono} ${sitio.nombre}</h2>${zonas}`;
    };

    return `
        ${barraTorre("📖 Bestiario", `${vistas} de ${total}`)}
        <p class="ff-ventana ff-mensaje">Aquí queda lo que aprendes en la Torre y en la Mazmorra. Lanza hechizos (o usa «Analizar»)
           para descubrir el punto débil de cada criatura: la próxima vez ya lo sabrás.</p>
        <div class="ff-bestiario">
            ${Object.keys(bestiario.LUGARES).map((lugar) => abiertos.includes(lugar) ? seccion(lugar)
                : `<h2 class="ff-lugar-titulo">🔒 ${bestiario.LUGARES[lugar].nombre}</h2>
                   <p class="ff-zona-texto">${lugar === "mazmorra" ? `Se abre al superar el piso ${torre.ABRIR_MAZMORRA} de la Torre.` : esc(bestiario.LUGARES[lugar].abre.texto)} Sus criaturas aparecerán aquí.</p>`).join("")}
        </div>`;
}


// ===== Pantalla: Modo enfoque (pomodoro) =====

const LARGO_ANILLO = 2 * Math.PI * 52;   // largo del círculo del reloj (radio 52)

export function pantallaEnfoque(estado, ctx) {
    const { activo, sesiones } = estado.enfoque;
    const minutos = (lista) => lista.reduce((suma, s) => suma + s.minutos, 0);
    const deHoy = sesiones.filter((s) => s.fecha === ctx.hoy);
    const deSemana = sesiones.filter((s) => s.fecha >= lunesDe(ctx.hoy));
    const recientes = sesiones.slice(-10).reverse();

    let principal;
    if (activo) {
        // El reloj: app.js actualiza cada segundo el texto [data-reloj] y el anillo [data-anillo].
        const total = activo.minutos * 60 * 1000;
        const restante = Math.max(0, juego.finDelEnfoque(activo) - ctx.ahora);
        const a = juego.infoAtributo(estado, activo.atributo, activo.atributoPropio);
        principal = `
            <section class="panel enfoque-activo" style="--color-atributo: ${a.color}">
                <p class="etiqueta">Enfocado en ${esc(a.icono)} ${esc(a.nombre)}</p>
                <div class="reloj">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                        <circle class="reloj-pista" cx="60" cy="60" r="52"/>
                        <circle class="reloj-arco" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"
                                stroke-dasharray="${LARGO_ANILLO}" stroke-dashoffset="${LARGO_ANILLO * (1 - restante / total)}"
                                data-anillo data-total="${total}" data-largo="${LARGO_ANILLO}"/>
                    </svg>
                    <span class="reloj-tiempo" data-reloj role="timer">${relojTexto(restante)}</span>
                </div>
                <p class="nota">Puedes bloquear el iPhone o salir de la app: el tiempo sigue contando y al volver
                   recibes tu premio. Lo único que no puede hacer es sonar si la app está cerrada.</p>
                <button type="button" class="boton boton-secundario boton-ancho" data-accion="cancelar-enfoque">Cancelar sesión</button>
            </section>`;
    } else {
        const duraciones = Object.entries(juego.ENFOQUE).map(([mins, dificultad]) => `
            <label class="pildora dificultad-${dificultad}">
                <input type="radio" name="minutos" value="${mins}" ${mins === "25" ? "checked" : ""}>
                <span>${mins} min<small>+${DIFICULTADES[dificultad].xp} XP</small></span>
            </label>`).join("");
        principal = `
            <section class="panel">
                <h2 class="titulo-juego">Nueva sesión</h2>
                <p class="nota">Elige un tiempo, deja el teléfono y concéntrate en una sola cosa.
                   Al terminar ganas lo mismo que una misión (XP, monedas y daño al jefe de ese atributo).
                   Si cancelas a la mitad, no hay premio.</p>
                <form data-form="enfoque" class="formulario">
                    <fieldset class="opciones"><legend>¿Cuánto tiempo?</legend>${duraciones}</fieldset>
                    <fieldset class="opciones opciones-4"><legend>¿En qué te vas a enfocar?</legend>${pildorasAtributo(estado, "intelecto")}</fieldset>
                    <button type="submit" class="boton boton-principal">Empezar</button>
                </form>
            </section>`;
    }

    const historial = recientes.map((s) => {
        const a = juego.infoAtributo(estado, s.atributo, s.atributoPropio);
        return `<li><span>${esc(a.icono)} ${s.minutos} min de ${esc(a.nombre)}</span><span class="texto-suave">${fechaCorta(s.fecha)} · +${s.xp} XP</span></li>`;
    }).join("");

    return `
        ${encabezado("⏱️ Modo enfoque", "hoy", "Hoy")}
        ${principal}
        <section class="panel">
            <h2 class="titulo-juego">Tu concentración</h2>
            <dl class="estadisticas">
                <div><dt>Hoy</dt><dd>${plural(deHoy.length, "sesión", "sesiones")} · ${minutos(deHoy)} min</dd></div>
                <div><dt>Esta semana</dt><dd>${plural(deSemana.length, "sesión", "sesiones")} · ${minutos(deSemana)} min</dd></div>
                <div><dt>En total</dt><dd>${plural(sesiones.length, "sesión", "sesiones")} · ${minutos(sesiones)} min</dd></div>
            </dl>
            ${historial ? `<h3 class="subtitulo">Últimas sesiones</h3><ul class="historial">${historial}</ul>` : ""}
        </section>`;
}


// ===== Ajustes: notificaciones =====
// info = { compatible, instalar (falta instalarla en la pantalla de inicio), permiso, activadas }

export function seccionAvisos(estado, info) {
    if (!info.compatible || info.instalar) {
        return `<p class="nota">Solo funcionan con la app <b>instalada en la pantalla de inicio</b> (iPhone con iOS 16.4 o más).
                   En Chrome: botón Compartir → «Agregar a la pantalla de inicio». Después ábrela desde el ícono y vuelve aquí.</p>`;
    }
    if (info.permiso === "denied") {
        return `<p class="nota">Bloqueaste las notificaciones de Vida RPG. Para volver a permitirlas:
                   Ajustes del iPhone → Notificaciones → Vida RPG.</p>`;
    }
    if (!info.activadas) {
        return `
            <p class="nota">Recordatorios a las horas que elijas, con lo que te falta del día,
               y un aviso cuando termine tu sesión de enfoque.</p>
            <form data-form="activar-avisos" class="form-linea">
                <input type="text" name="codigo" required autocomplete="off" autocapitalize="characters" spellcheck="false"
                       placeholder="Código de activación" aria-label="Código de activación">
                <button type="submit" class="boton boton-chico">Activar</button>
            </form>`;
    }

    const textoDias = (dias) => (dias ? dias.map((d) => DIAS_CORTOS[d]).join(", ") : "Todos los días");
    const filas = estado.avisos.horarios.map((h) => `
        <li>
            <span><b>${h.hora}</b> <span class="texto-suave">· ${textoDias(h.dias)}</span></span>
            <button type="button" class="boton-icono chico" data-accion="quitar-horario" data-id="${h.id}"
                    aria-label="Quitar el recordatorio de las ${h.hora}">${ICONOS.cerrar}</button>
        </li>`).join("");
    const dias = DIAS_LETRAS.map((letra, dia) => `
        <label class="pildora" title="${DIAS_CORTOS[dia]}">
            <input type="checkbox" name="dias" value="${dia}" checked><span>${letra}</span>
        </label>`).join("");

    // Las misiones con su propia hora de aviso (se cambian al editar cada misión).
    const conAviso = estado.misiones.filter((m) => m.aviso && !m.archivadaEn)
        .sort((a, b) => a.aviso.localeCompare(b.aviso))
        .map((m) => `<b>${m.aviso}</b> ${esc(m.nombre)}`);
    const avisosMision = conAviso.length
        ? `<p class="nota">⏰ Avisos de misión: ${conAviso.join(" · ")}. Llegan solo si no la has hecho;
               se cambian al editar cada misión.</p>`
        : `<p class="nota">⏰ También puedes ponerle una hora de aviso a cada misión (al crearla o editarla):
               te avisa solo de esa misión y solo si no la has hecho.</p>`;

    return `
        <p class="nota">✅ Activadas en este teléfono. Recordatorios generales (con todo lo que te falta):</p>
        ${filas ? `<ul class="horarios">${filas}</ul>` : vacio("Sin recordatorios. Agrega uno abajo.")}
        <form data-form="horario" class="horario-nuevo">
            <div class="form-linea">
                <input type="time" name="hora" value="20:00" required aria-label="Hora del recordatorio">
                <button type="submit" class="boton boton-chico">+ Agregar</button>
            </div>
            <fieldset class="opciones opciones-7" aria-label="Días del recordatorio">${dias}</fieldset>
        </form>
        ${avisosMision}
        <label class="interruptor">
            <span><b>⏱️ Fin del enfoque</b><br><span class="nota">Avisar cuando termine una sesión.</span></span>
            <input type="checkbox" data-accion="aviso-enfoque" ${estado.avisos.enfoque ? "checked" : ""}>
        </label>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="probar-avisos">Enviar prueba</button>
            <button type="button" class="boton boton-secundario" data-accion="desactivar-avisos">Desactivar</button>
        </div>
        ${guiaDeAvisos()}`;
}

// Lo que se revisa en el iPhone para que los avisos lleguen siempre y suenen.
function guiaDeAvisos() {
    return `
        <details class="plegable guia-avisos">
            <summary>📋 Para que lleguen siempre y suenen</summary>
            <ol>
                <li><b>Ajustes del iPhone → Notificaciones → Vida RPG:</b> «Permitir notificaciones» y <b>Sonidos</b> activados,
                    y los tres lugares (pantalla bloqueada, centro de notificaciones y avisos). Si usas el «Resumen programado»,
                    deja Vida RPG fuera de él (con entrega <b>inmediata</b>): si no, los junta y llegan tarde.</li>
                <li><b>Modos de concentración</b> (No molestar, Dormir, Trabajo…): en Ajustes → Concentración, agrega Vida RPG a las
                    apps permitidas de cada modo. Si no, llegan sin sonar.</li>
                <li><b>El silencio del iPhone:</b> con el interruptor lateral (o el botón de acción) en silencio no suena nada.
                    Sube el volumen de «Tono y alertas» en Ajustes → Sonidos y vibraciones.</li>
                <li><b>Abre la app de vez en cuando:</b> al abrirla revisa que los avisos sigan conectados y, si hace falta,
                    los repara sola o te avisa arriba en «Hoy».</li>
            </ol>
            <p class="nota"><b>🎺 Sobre el sonido:</b> el iPhone no deja que una app web elija un sonido propio para sus
               notificaciones (solo las apps de la App Store pueden): suenan con el tono de alertas del iPhone. Si quieres uno
               que reconozcas, en iOS 17.2 o más puedes cambiar el tono de alertas predeterminado en Ajustes → Sonidos y
               vibraciones (ojo: cambia también el de otras apps que usen el predeterminado). Con la app abierta, los avisos
               suenan con su propio toque: el cuerno de Vida RPG.</p>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="probar-cuerno">🎺 Escuchar el cuerno</button>
        </details>`;
}


// ===== Ajustes: copia en la nube =====
// info = { configurada, ultima (fecha de la última copia), codigoGuardado (ya está el código de las notificaciones) }

export function seccionNube(info) {
    if (!info.configurada) {
        return `
            <p class="nota">Guarda una copia de tu partida en la nube, <b>sola, una vez al día</b>. Se cifra en el teléfono
               con una contraseña tuya: en la nube nadie puede leerla. Si cambias de teléfono, la recuperas con esa contraseña.</p>
            <form data-form="nube-activar" class="formulario-grupo">
                ${info.codigoGuardado ? "" : `<input type="text" name="codigo" required autocomplete="off" autocapitalize="characters"
                    spellcheck="false" placeholder="Código de activación" aria-label="Código de activación">`}
                <input type="password" name="contrasena" required minlength="8" autocomplete="new-password"
                       placeholder="Contraseña (mínimo 8 letras)" aria-label="Contraseña de la copia">
                <input type="password" name="repetir" required minlength="8" autocomplete="new-password"
                       placeholder="Repite la contraseña" aria-label="Repite la contraseña">
                <p class="nota">⚠️ Anótala en un lugar seguro: si la olvidas, nadie puede abrir la copia (ni siquiera el servidor).</p>
                <button type="submit" class="boton boton-principal">Activar copia en la nube</button>
            </form>`;
    }
    return `
        <p class="nota">✅ Activada. ${info.ultima ? `Última copia: <b>${fechaLegible(info.ultima)}</b>.` : "Todavía sin copias."}
           Se hace sola una vez al día, al abrir la app con internet.</p>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="nube-subir">Respaldar ahora</button>
            <button type="button" class="boton boton-secundario" data-accion="abrir" data-dialogo="nube">Recuperar</button>
        </div>
        <button type="button" class="enlace" data-accion="nube-desactivar">Desactivar en este teléfono</button>`;
}


// ===== Novedades =====

export function contenidoNovedades(lista, titulo = "🆕 Novedades") {
    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="cerrar">Cerrar</button>
        </div>
        ${lista.map((n) => `
            <section class="novedad">
                <p class="etiqueta">Versión ${n.version}</p>
                <h3>${n.titulo}</h3>
                <ul>${n.cambios.map((c) => `<li>${c}</li>`).join("")}</ul>
            </section>`).join("")}`;
}


// ===== Bienvenida (al crear el personaje) =====
// b = { paso (1 a 3), misiones: Set, recompensas: Set }

// (v49) La portada de «¿Cómo te sientes hoy?»: pantalla completa con una pintura de fondo, el Maestro Aurelio y tres opciones.
// La frase cambia cada día (se elige por la fecha, no al azar, para que no salte al volver a dibujarla).
export function pantallaAnimo(nombre, hora, dia) {
    const saludo = hora < 6 ? "Aún es de madrugada" : hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
    const cita = maestro.CONSEJOS[dia % maestro.CONSEJOS.length];
    const opciones = [
        ["mal", "😔", "Mal", "Solo lo esencial. Un paso a la vez."],
        ["normal", "🙂", "Normal", "Lo justo para avanzar sin distracciones."],
        ["bien", "😄", "Bien", "Todo el reino a tu disposición."],
    ];
    return `
        <div class="animo-fondo" style="background-image: url('${rutaPintura("camino")}')" aria-hidden="true"></div>
        <div class="animo-caja">
            <p class="animo-marca">VIDA RPG</p>
            <div class="animo-maestro">
                <div class="animo-retrato" aria-hidden="true">${dibujarAvatar(maestro.describirMaestro(), { batalla: true })}</div>
                <div class="animo-burbuja">
                    <p class="animo-saludo">${saludo}, ${esc(nombre)}.</p>
                    <p class="animo-cita">«${esc(cita.texto)}»</p>
                    <p class="animo-autor">— ${esc(cita.autor)}, según ${esc(maestro.NOMBRE)}</p>
                </div>
            </div>
            <h2 class="animo-pregunta">¿Cómo te sientes hoy?</h2>
            <div class="animo-opciones">
                ${opciones.map(([clave, icono, titulo, nota]) => `
                    <button type="button" class="animo-opcion animo-${clave}" data-accion="elegir-animo" data-animo="${clave}">
                        <span class="animo-icono" aria-hidden="true">${icono}</span>
                        <span class="animo-texto"><b>${titulo}</b><small>${nota}</small></span>
                    </button>`).join("")}
            </div>
        </div>`;
}

export function pantallaBienvenida(b, nombre, plantillas) {
    const puntos = `<div class="pasos" aria-label="Paso ${b.paso} de 3">${[1, 2, 3].map((n) =>
        `<i class="${n === b.paso ? "actual" : n < b.paso ? "hecho" : ""}"></i>`).join("")}</div>`;
    const pie = (izquierda, derecha) => `<div class="botones-dialogo">${izquierda}${derecha}</div>`;

    if (b.paso === 1) {
        const idea = (icono, titulo, texto) => `<li><span>${icono}</span><div><b>${titulo}</b><small>${texto}</small></div></li>`;
        return `${puntos}
            <p class="etiqueta">Bienvenido, ${esc(nombre)}</p>
            <h2 class="titulo-juego titulo-grande">Así funciona</h2>
            <ul class="bienvenida-lista">
                ${idea("⚔️", "Misiones", "Cada hábito que cumples te da XP y monedas, y sube uno de tus cuatro atributos.")}
                ${idea("🔥", "Racha", "Cumple al menos una misión al día. Cada 7 días seguidos ganas un escudo que te protege si fallas.")}
                ${idea("👹", "Jefes", "Tus misiones golpean a jefes que representan la pereza, el miedo, la codicia…")}
                ${idea("🎁", "Tienda", "Cambia tus monedas por premios reales que tú decides. Así el premio se gana.")}
            </ul>
            ${pie(`<button type="button" class="boton boton-secundario" data-accion="bienvenida-saltar">Saltar</button>`,
                  `<button type="button" class="boton boton-principal" data-accion="bienvenida-paso" data-paso="2">Siguiente</button>`)}`;
    }

    if (b.paso === 2) {
        const grupos = Object.entries(ATRIBUTOS).map(([clave, a]) => `
            <h3 class="subtitulo">${a.icono} ${a.nombre}</h3>
            <div class="opciones-plantilla">${plantillas.misiones.filter((p) => p.atributo === clave).map((p) => {
                const detalle = `${DIFICULTADES[p.dificultad].nombre} · ${textoFrecuencia(p)}${p.cantidad ? ` · ${p.cantidad} ${p.unidad}` : ""}`;
                return `<button type="button" class="opcion-plantilla" data-accion="bienvenida-mision" data-id="${p.id}"
                                aria-pressed="${b.misiones.has(p.id)}"><b>${p.nombre}</b><small>${detalle}</small></button>`;
            }).join("")}</div>`).join("");
        return `${puntos}
            <h2 class="titulo-juego titulo-grande">Tus primeros hábitos</h2>
            <p class="nota">Elige pocos: con <b>2 o 3</b> basta para empezar. Después puedes cambiarlos o agregar los tuyos.</p>
            ${grupos}
            ${pie(`<button type="button" class="boton boton-secundario" data-accion="bienvenida-paso" data-paso="1">Atrás</button>`,
                  `<button type="button" class="boton boton-principal" data-accion="bienvenida-paso" data-paso="3">Siguiente${b.misiones.size ? ` (${b.misiones.size})` : ""}</button>`)}`;
    }

    return `${puntos}
        <h2 class="titulo-juego titulo-grande">¿Con qué te premias?</h2>
        <p class="nota">Estos premios cuestan monedas. La regla de oro: date ese gusto <b>solo</b> si lo canjeas aquí.
           Puedes cambiar los precios en la Tienda.</p>
        <div class="opciones-plantilla">${plantillas.recompensas.map((r) => `
            <button type="button" class="opcion-plantilla" data-accion="bienvenida-recompensa" data-id="${r.id}"
                    aria-pressed="${b.recompensas.has(r.id)}"><b>${r.nombre}</b><small>🪙 ${r.costo}</small></button>`).join("")}</div>
        ${pie(`<button type="button" class="boton boton-secundario" data-accion="bienvenida-paso" data-paso="2">Atrás</button>`,
              `<button type="button" class="boton boton-principal" data-accion="bienvenida-fin">¡Empezar!</button>`)}`;
}


// ===== Pantalla: Personaje (avatar, clase, equipamiento y mascota) =====

// (v66) Un botón en la ficha del héroe: su nivel de gym y el acceso al gimnasio.
function botonDeGym(estado) {
    const n = gymReglas.nivelDeGym(estado.gym.sesiones);
    const rango = gymReglas.rangoDe(n.nivel);
    const sesiones = estado.gym.sesiones.length;
    return `
        <button type="button" class="ficha-gym" data-accion="ir" data-pantalla="gym">
            <span class="ficha-gym-icono" aria-hidden="true">🏋️</span>
            <span class="ficha-gym-texto"><b>Gimnasio · nivel ${n.nivel} · ${rango.icono} ${rango.nombre}</b>
                <small>${sesiones ? `${plural(sesiones, "sesión", "sesiones")} · +${Math.round(gymReglas.bonoDeGym(n.nivel) * 100)} % de vida y ataque en la Torre` : "Entrena de verdad y tu héroe se hará más fuerte."}</small></span>
            <span aria-hidden="true">›</span>
        </button>`;
}

export function pantallaPersonaje(estado, ctx) {
    const a = ctx.avatar;
    const vista = ctx.subvista?.personaje || "equipo";

    // Las 4 etapas, marcando la actual y las que ya pasaste.
    const etapas = avatar.ETAPAS.map((e) => {
        const clase = e === a.etapa ? "actual" : a.nivel >= e.desde ? "pasada" : "";
        return `<li class="${clase}"><span>${e.nombre}</span><small>Nv ${e.desde}</small></li>`;
    }).join("");

    // Las secciones (solo se ve una a la vez). Los niveles de tus atributos y sus rasgos están en Progreso.
    const secciones = {
        equipo: () => `${seccionEquipamiento(estado, ctx)}${seccionObjetosDeLogro(estado, ctx, "Objetos por ganar")}`,
        mascotas: () => seccionMascota(estado, a.mascota, ctx),
        apariencia: () => seccionApariencia(estado, ctx),
        historia: () => seccionHistoria(estado, ctx),
    };

    return `
        <section class="panel ficha">
            <div class="ficha-avatar">${dibujarAvatar(a)}</div>
            <h2 class="titulo-juego">${esc(estado.personaje.nombre)}</h2>
            <p class="etiqueta">Nivel ${a.nivel} · ${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</p>
            <p class="heroe-animo">${textoAnimo(a, ctx)}</p>
            <div class="ficha-vida">${barraDeVida(ctx.vida)}${barraDeArmadura(ctx.vida.armadura)}</div>
            <p class="mini texto-suave">${vida.ESTADOS[ctx.vida.nivel].texto} 🛡️ La armadura cuenta cuando fallas una misión:
               se gasta al fallar y se repara cumpliendo.</p>
            <ol class="etapas">${etapas}</ol>
            ${botonDeGym(estado)}
        </section>
        ${selectorSecciones("personaje", [["equipo", "🛡️ Equipo"], ["mascotas", "🐾 Mascotas"], ["apariencia", "🎨 Aspecto"], ["historia", "📜 Historia"]], vista)}
        ${(secciones[vista] || secciones.equipo)()}`;
}

// Una fila que lleva a otra pantalla (con su icono, su nombre y una línea de detalle).
function filaEnlace(icono, titulo, detalle, destino) {
    return `<button type="button" class="fila-enlace" ${destino}>
                <span class="fila-enlace-icono" aria-hidden="true">${icono}</span>
                <span><b>${titulo}</b><small>${detalle}</small></span>
                <span class="fila-enlace-flecha" aria-hidden="true">›</span>
            </button>`;
}

function bibliotecaLeidos(estado) {
    return pergaminos.IDS.filter((id) => estado.pergaminos.leidos[id]).length;
}

// «Historia»: todo lo que cuenta tu camino, junto (antes estaba repartido entre Hoy, Personaje y Ajustes).
function seccionHistoria(estado, ctx) {
    const c = estado.pacto ? pacto.cumplimientoDelPacto(estado, ctx.hoy) : null;
    const escritos = Object.values(estado.diario).filter((e) => e.texto || e.animo).length;
    const rachaDiario = diario.rachaDiario(estado, ctx.hoy);
    const pos = mapa.posicion(estado);
    const conseguidos = estado.logros.filter((l) => l.desbloqueadoEn).length;
    const s = sagaDe(estado, ctx);
    const m = ctx.maestro?.memorias;
    const records = estado.arcade.records;
    // Lo que se ve debajo del título de cada historia: cuándo pasa y cuánto llevas.
    const detalle = {
        pergamino: `${pergamino.minutosDeLectura()} min de lectura`,
        casio: `${Math.min(estado.libros.casio.leidos, libroCasio.CAPITULOS.length)} de ${libroCasio.CAPITULOS.length} capítulos · ${libroCasio.minutosDeLectura()} min${estado.libros.casio.fin ? " · ✅ terminado" : ""}`,
        orrin: libros.recordDe(estado, "orrin") < libros.libroPorId("orrin").PUERTA.libre
            ? `🔒 ${libros.libroPorId("orrin").PUERTA.textoLibre}`
            : `${Math.min(estado.libros.orrin.leidos, libros.libroPorId("orrin").CAPITULOS.length)} de ${libros.libroPorId("orrin").CAPITULOS.length} capítulos · ${libros.libroPorId("orrin").minutosDeLectura()} min${estado.libros.orrin.fin ? " · ✅ terminado" : ""}`,
        memorias: m ? `${m.abiertas} de ${m.total} capítulos${m.sinLeer ? ` · ${plural(m.sinLeer, "nuevo", "nuevos")}` : ""}` : "",
        cronica: `Capítulo ${cronica.ROMANOS[pos.region] || pos.region + 1} · ${mapa.nombreRegion(pos.region)}`,
        torre: `Tu récord: ${records.torre || 0} de ${torre.ABRIR_MAZMORRA} pisos`,
        mazmorra: torre.mazmorraAbierta(estado.arcade) ? `Tu récord: ${records.mazmorra || 0} de 20 sótanos` : "🔒 Se abre al llegar a la cima de la Torre",
        voces: `${voces.progreso(estado).hechas} de ${voces.progreso(estado).total} voces recuperadas${estado.voces.epilogo ? " · ✅ La aldea habló" : ""}`,
        libro: `${plural(escritos, "día escrito", "días escritos")} en tu diario`,
    };
    const historias = saga.HISTORIAS.map((h) =>
        filaEnlace(h.icono, esc(h.titulo), `<i>${h.cuando}.</i> ${esc(h.texto)} · ${detalle[h.id]}`, abrirHistoriaDeSaga(h.abrir))).join("");
    return `
        ${panelSaga(estado, ctx, s)}
        <section class="panel">
            <h2 class="titulo-juego">📚 Las historias, en orden</h2>
            <p class="nota">Todas cuentan la misma historia en distintos tiempos: de la primera piedra a tus días de hoy.</p>
            <div class="filas-enlace">${historias}</div>
        </section>
        <section class="panel">
            <h2 class="titulo-juego">📚 La Biblioteca prohibida</h2>
            <p class="nota">Más pergaminos con lore del mundo y moralejas, que se abren en orden mientras avanzas.</p>
            <div class="filas-enlace">
                ${filaEnlace("📚", "Los pergaminos", `${bibliotecaLeidos(estado)} de ${pergaminos.IDS.length} leídos`, 'data-accion="biblioteca-abrir"')}
            </div>
        </section>
        <section class="panel">
            <h2 class="titulo-juego">✍️ Lo tuyo</h2>
            <p class="nota">Lo que has jurado, lo que has escrito y lo que has conseguido.</p>
            <div class="filas-enlace">
                ${filaEnlace("📜", "Tu pacto", c ? `El juramento de los Vigías · día ${c.dia}${c.porcentaje === null ? "" : ` · ${c.porcentaje} % honrado`}`
                                                 : "El juramento de los Vigías: todavía sin firmar",
                             'data-accion="ir" data-pantalla="pacto"')}
                ${filaEnlace("📓", "Tu diario", `${plural(escritos, "día escrito", "días escritos")}${rachaDiario ? ` · racha de ${rachaDiario}` : ""}`,
                             'data-accion="ir" data-pantalla="diario"')}
                ${filaEnlace("🏆", "Logros", `${conseguidos} de ${plural(estado.logros.length, "logro", "logros")} conseguidos`,
                             'data-accion="subvista" data-pantalla="progreso" data-vista="logros"')}
            </div>
        </section>`;
}

// ===== Pantalla: Memorias de Aurelio (v30) =====
// La historia de tu maestro, en un pergamino como la Crónica. Los capítulos se abren al avanzar
// (ver memorias.js); los que no, se ven como «???» y el siguiente dice qué falta.
// ctx.memoriasDesde = cuántos habías leído antes de abrir (los de después se marcan «Nuevo»).
export function pantallaMemorias(estado, ctx) {
    const datos = memorias.datosDeMemorias(estado, ctx.info);
    const desde = ctx.memoriasDesde ?? ctx.maestro.memorias.leidas;
    const capitulos = memorias.capitulosDeMemorias(datos, desde, {
        heroe: estado.personaje.nombre,
        dragon: mascota.nombreDe(estado, mascota.INICIAL),
    });
    const abiertos = capitulos.filter((c) => c.abierto);
    // Se abre el primero nuevo; si no hay, el último que te contó.
    const elegido = (capitulos.find((c) => c.nueva) || abiertos[abiertos.length - 1])?.id;
    const html = capitulos.map((c) => {
        if (!c.abierto) {
            return `<div class="capitulo bloqueado"><span class="capitulo-numero">Capítulo ${c.numero}</span>
                        <b>???</b>${c.pista ? `<small>🔒 ${esc(c.pista)}</small>` : ""}</div>`;
        }
        return `<details class="capitulo" ${c.id === elegido ? "open" : ""}>
                    <summary><span class="capitulo-numero">Capítulo ${c.numero}</span> <b>${esc(c.titulo)}</b>
                        ${c.nueva ? '<span class="memoria-nueva">Nuevo</span>' : ""}</summary>
                    ${c.parrafos.map((texto) => `<p>${esc(texto)}</p>`).join("")}
                    <blockquote class="memoria-leccion">«${esc(c.leccion)}»</blockquote>
                </details>`;
    }).join("");
    const todo = abiertos.length === capitulos.length;
    return `
        ${encabezado("🧙 Memorias", "personaje", "Héroe")}
        <section class="cronica memorias">
            <div class="memorias-retrato" aria-hidden="true">${dibujarAvatar(maestro.describirMaestro(), { batalla: true })}</div>
            <h2 class="cronica-titulo">Memorias de Aurelio</h2>
            <p class="cronica-sub">${todo
                ? "Ya te lo contó todo. Lo demás lo estás escribiendo tú."
                : "Lo que tu maestro no le cuenta a cualquiera. Te lo irá contando a medida que avances."}</p>
            ${html}
        </section>`;
}


// ===== Pantallas: los pergaminos de la Biblioteca prohibida (v33, v57) =====
// Una historia motivacional larga, como un pergamino que se desenrolla (el texto está en pergamino.js y pergaminos.js).
// ctx.pergaminoId = cuál se lee (por defecto, el primero: «La primera piedra»).
export function pantallaPergamino(estado, ctx = {}) {
    const nombre = estado.personaje.nombre;
    const biblioteca = pergaminos.estadoDeBiblioteca(nombre, pergaminos.datosDePartida(estado));
    const p = biblioteca.pergaminos.find((x) => x.id === (ctx.pergaminoId || "piedra")) || biblioteca.pergaminos[0];
    const volver = `<button type="button" class="boton boton-secundario boton-ancho" data-accion="biblioteca-abrir">‹ Volver a la Biblioteca</button>`;
    if (!p.abierto) {
        return `
            ${encabezado("📜 Pergamino", "personaje", "Héroe")}
            <section class="panel"><h2 class="titulo-juego">🔒 ${esc(p.titulo)}</h2><p class="nota">${esc(p.falta)}</p></section>
            ${volver}`;
    }
    const parrafos = (lista) => lista.map((texto) => `<p>${esc(texto)}</p>`).join("");
    const adorno = '<p class="rollo-adorno" aria-hidden="true">❦</p>';
    const capitulos = p.capitulos.map((c, i) => `
        <section class="rollo-capitulo">
            <p class="rollo-numero">${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][i]}</p>
            <h3 class="rollo-titulo-capitulo">${esc(c.titulo)}</h3>
            ${parrafos(c.parrafos)}
        </section>`).join(adorno);
    return `
        ${encabezado(`📜 Pergamino ${p.numero}`, "personaje", "Héroe")}
        <article class="rollo">
            <div class="rollo-vara" aria-hidden="true"></div>
            <div class="rollo-papel">
                <header class="rollo-cabecera">
                    <p class="rollo-sobre">Pergamino ${p.numero} de ${biblioteca.total} · ${p.minutos} min de lectura</p>
                    <h2>${esc(p.titulo)}</h2>
                    <p class="rollo-subtitulo">${esc(p.subtitulo)}</p>
                </header>
                <div class="rollo-prologo">${parrafos(p.prologo)}</div>
                ${adorno}
                ${capitulos}
                <section class="rollo-ensenanzas">
                    <h3>${p.id === "piedra" ? "Las enseñanzas de la primera piedra" : "Lo que enseña este pergamino"}</h3>
                    <ol>${p.ensenanzas.map((texto) => `<li>${esc(texto)}</li>`).join("")}</ol>
                </section>
                <blockquote class="rollo-moraleja"><span>Moraleja</span>«${esc(p.moraleja)}»</blockquote>
                ${p.cierre?.length ? `${adorno}<div class="rollo-dedicatoria">${parrafos(p.cierre)}</div>` : ""}
                ${p.firma ? `<p class="rollo-firma">— ${esc(p.firma)}</p>` : ""}
            </div>
            <div class="rollo-vara" aria-hidden="true"></div>
        </article>
        ${p.leido
            ? `<p class="nota">✅ Lo leíste el ${fechaCorta(estado.pergaminos.leidos[p.id])}. <i>${esc(p.presagio)}</i></p>
               <button type="button" class="boton boton-secundario boton-ancho" data-accion="pergamino-escena" data-id="${esc(p.id)}">🎬 Ver la escena otra vez</button>`
            : `<button type="button" class="boton boton-principal boton-ancho" data-accion="pergamino-terminar" data-id="${esc(p.id)}">✅ Terminé de leerlo (+${pergaminos.PREMIO_LECTURA.xp} XP · +${pergaminos.PREMIO_LECTURA.gemas} 💎)</button>`}
        ${volver}`;
}

// ===== Los libros largos de Historia (v62, v70): «El Centinela» y «La linterna de Orrin» =====
// ctx.libroNovela = "casio" u "orrin"; ctx.capituloNovela = null (la portada, con el prólogo y el índice) o el número del capítulo que se lee (desde 0).
export function pantallaNovela(estado, ctx = {}) {
    const id = libros.libroPorId(ctx.libroNovela) ? ctx.libroNovela : "casio";
    const modulo = libros.libroPorId(id);
    const libro = libros.libroDeEstado(estado, id);
    const marca = estado.libros[id];
    const total = libro.capitulos.length;
    const parrafos = (lista) => lista.map((texto) => `<p>${esc(texto)}</p>`).join("");
    const adorno = '<p class="rollo-adorno" aria-hidden="true">❦</p>';
    const i = ctx.capituloNovela;

    // --- Un capítulo ---
    if (Number.isInteger(i) && libro.capitulos[i]?.abierto) {
        const c = libro.capitulos[i];
        const ultimo = i === total - 1;
        const siguiente = libro.capitulos[i + 1];
        const terminado = Boolean(marca.fin);
        return `
            ${encabezado(`📖 ${esc(modulo.TITULO)}`, "personaje", "Héroe")}
            <article class="rollo novela">
                <div class="rollo-vara" aria-hidden="true"></div>
                <div class="rollo-papel">
                    <header class="rollo-cabecera">
                        <p class="rollo-sobre">${esc(c.libro.titulo)} · ${esc(c.libro.nombre)}</p>
                        <p class="rollo-numero">Capítulo ${c.numero} de ${total}</p>
                        <h2>${esc(c.titulo)}</h2>
                    </header>
                    <section class="rollo-capitulo novela-texto">${parrafos(c.parrafos)}</section>
                    <blockquote class="rollo-moraleja"><span>${esc(modulo.ETIQUETA_MORALEJA)}</span>«${esc(c.moraleja)}»</blockquote>
                    ${ultimo ? `
                        ${adorno}
                        <section class="rollo-capitulo novela-epilogo"><h3 class="rollo-titulo-capitulo">Epílogo</h3>${parrafos(libro.epilogo)}</section>
                        <section class="rollo-ensenanzas"><h3>Lo que enseña este libro</h3>
                            <ol>${libro.ensenanzas.map((texto) => `<li>${esc(texto)}</li>`).join("")}</ol></section>
                        <p class="rollo-firma">— ${esc(libro.firma)}</p>` : ""}
                </div>
                <div class="rollo-vara" aria-hidden="true"></div>
            </article>
            ${ultimo
                ? (terminado
                    ? `<p class="nota">✅ Terminaste este libro el ${fechaCorta(marca.fin)}.</p>
                       <button type="button" class="boton boton-secundario boton-ancho" data-accion="novela-escena">🎬 Ver la escena otra vez</button>`
                    : `<button type="button" class="boton boton-principal boton-ancho" data-accion="novela-terminar">📖 Terminé el libro (+${modulo.PREMIO.xp} XP · +${modulo.PREMIO.gemas} 💎)</button>`)
                : ""}
            <nav class="novela-nav" aria-label="Capítulos">
                <button type="button" class="boton boton-secundario" data-accion="novela-capitulo" data-i="${i - 1}" ${i > 0 ? "" : "disabled"}>‹ Anterior</button>
                <button type="button" class="boton boton-secundario" data-accion="novela-indice">☰ Índice</button>
                <button type="button" class="boton boton-principal" data-accion="novela-capitulo" data-i="${i + 1}" ${siguiente?.abierto ? "" : "disabled"}>${siguiente ? (siguiente.abierto ? "Siguiente ›" : "🔒 Cerrado") : "Fin"}</button>
            </nav>`;
    }

    // --- La portada: el prólogo y el índice ---
    const leidos = Math.min(marca.leidos, total);
    const abiertos = libro.capitulos.filter((c) => c.abierto).length;
    const indice = libro.capitulos.map((c, n) => `
        ${c.empiezaLibro ? `<h3 class="novela-libro">${esc(c.empiezaLibro.titulo)} · ${esc(c.empiezaLibro.nombre)}</h3>` : ""}
        <button type="button" class="fila-enlace novela-fila ${n < leidos ? "leido" : ""} ${c.abierto ? "" : "cerrado"} ${n === marca.marca && leidos ? "aqui" : ""}"
                ${c.abierto ? `data-accion="novela-capitulo" data-i="${n}"` : "disabled"}>
            <span class="fila-enlace-icono" aria-hidden="true">${c.abierto ? (n < leidos ? "✅" : "📖") : "🔒"}</span>
            <span><b>${c.numero} · ${esc(c.titulo)}</b>${c.abierto ? "" : `<small>${esc(c.bloqueado)}</small>`}</span>
            <span class="fila-enlace-flecha" aria-hidden="true">›</span>
        </button>`).join("");
    return `
        ${encabezado(`📖 ${esc(modulo.TITULO)}`, "personaje", "Héroe")}
        <article class="rollo novela">
            <div class="rollo-vara" aria-hidden="true"></div>
            <div class="rollo-papel">
                <header class="rollo-cabecera">
                    <p class="rollo-sobre">Por ${esc(libro.autor)} · ${libro.capitulos.length} capítulos · ${libro.minutos} min de lectura</p>
                    <h2>${esc(libro.titulo)}</h2>
                    <p class="rollo-subtitulo">${esc(libro.subtitulo)}</p>
                </header>
                ${libro.prologo.length ? `<section class="rollo-prologo"><h3 class="rollo-titulo-capitulo">Prólogo</h3>${parrafos(libro.prologo)}</section>` : ""}
            </div>
            <div class="rollo-vara" aria-hidden="true"></div>
        </article>
        <section class="panel">
            <p class="mini">Llevas <b>${leidos} de ${total}</b> capítulos${abiertos && abiertos < total ? ` (hay ${total - abiertos} cerrados todavía)` : ""}.</p>
            ${barra(Math.round((leidos / total) * 100), "barra-mini")}
            ${abiertos ? `<button type="button" class="boton boton-principal boton-ancho" data-accion="novela-capitulo" data-i="${leidos ? Math.min(marca.marca, abiertos - 1) : 0}">
                ${leidos ? `Continuar: capítulo ${libro.capitulos[Math.min(marca.marca, abiertos - 1)].numero}` : "Empezar a leer"}</button>`
                : `<p class="nota">🔒 ${esc(modulo.PUERTA.textoLibre)}</p>`}
        </section>
        <section class="panel novela-indice">
            <h2 class="titulo-juego">Índice</h2>
            ${indice}
        </section>`;
}

// La Biblioteca prohibida: todos los pergaminos en orden (los que aún no se abren dicen qué falta) y las sagas que se insinúan.
export function pantallaBiblioteca(estado) {
    const b = pergaminos.estadoDeBiblioteca(estado.personaje.nombre, pergaminos.datosDePartida(estado));
    const filas = b.pergaminos.map((p) => {
        const estadoTexto = p.leido ? "✅ Leído" : p.abierto ? "📖 Listo para leer" : `🔒 ${esc(p.falta)}`;
        const destino = p.abierto ? `data-accion="pergamino-abrir" data-id="${esc(p.id)}"` : "disabled";
        return `<button type="button" class="fila-enlace pergamino-fila ${p.leido ? "leido" : ""} ${p.abierto ? "" : "cerrado"} ${p.id === b.siguiente ? "siguiente" : ""}" ${destino}>
                    <span class="fila-enlace-icono" aria-hidden="true">${p.abierto ? "📜" : "🔒"}</span>
                    <span><b>${p.numero} · ${p.abierto ? esc(p.titulo) : "???"}</b><small>${estadoTexto}${p.abierto ? ` · ${p.minutos} min` : ""}</small></span>
                    <span class="fila-enlace-flecha" aria-hidden="true">›</span>
                </button>`;
    }).join("");
    const sagas = pergaminos.sagasFuturas(estado.pergaminos.leidos).map((s) => `
        <li class="saga-futura ${s.insinuada ? "insinuada" : ""}">
            <span class="saga-futura-icono" aria-hidden="true">${s.insinuada ? s.icono : "❔"}</span>
            <span><b>${s.insinuada ? esc(s.titulo) : "Una historia todavía sin nombre"}</b>
                <small>${s.insinuada ? esc(s.texto) : `Se insinúa en ${s.requiere.length} pergaminos: llevas ${s.pistas} de ${s.requiere.length}.`}</small></span>
        </li>`).join("");
    return `
        ${encabezado("📚 Biblioteca", "personaje", "Héroe")}
        <section class="panel">
            <h2 class="titulo-juego">📚 La Biblioteca prohibida</h2>
            <p class="nota">Pergaminos que escribieron los Vigías y los vecinos del valle. Se abren en orden, al avanzar en el juego. Cada uno cuenta un trozo más del mundo y deja una moraleja para los días difíciles.</p>
            <p class="mini">Llevas <b>${b.leidos} de ${b.total}</b> pergaminos leídos.</p>
            ${barra(Math.round((b.leidos / b.total) * 100), "barra-mini")}
            <div class="filas-enlace">${filas}</div>
        </section>
        <section class="panel">
            <h2 class="titulo-juego">🌫️ Lo que queda abierto</h2>
            <p class="nota">Cada pergamino deja una pregunta sin responder. Son las historias que vendrán cuando termines la Saga de la Llama: hoy solo se insinúan, y se irán revelando a medida que leas.</p>
            <ul class="lista sagas-futuras">${sagas}</ul>
        </section>`;
}


// Apariencia: cuerpo, piel, rostro, ojos, pelo, peinado, barba y color del traje.
// Los colores se eligen con círculos de color; lo demás, con botones de texto.
const TITULOS_APARIENCIA = {
    cuerpo: "Cuerpo", piel: "Tono de piel", rostro: "Rostro", ojos: "Color de ojos",
    pelo: "Color de pelo", peinado: "Peinado", barba: "Barba", traje: "Color del traje",
};

function seccionApariencia(estado, ctx) {
    const grupos = Object.entries(avatar.APARIENCIA).map(([campo, opciones]) => {
        const elegida = estado.apariencia[campo];
        const conColor = Object.values(opciones).some((opcion) => opcion.color);
        const botones = Object.entries(opciones).map(([valor, opcion]) => {
            const datos = `data-accion="apariencia" data-campo="${campo}" data-valor="${valor}" aria-pressed="${valor === elegida}"`;
            if (!conColor) return `<button type="button" ${datos}>${opcion.nombre}</button>`;
            // Una opción sin color propio (el traje "de tu clase") usa el color de la clase.
            return opcion.color
                ? `<button type="button" class="muestra" style="--color-muestra: ${opcion.color}" ${datos} aria-label="${opcion.nombre}"></button>`
                : `<button type="button" class="muestra auto" style="--color-muestra: ${ctx.avatar.clase.oscuro}" ${datos} aria-label="${opcion.nombre}">A</button>`;
        }).join("");
        const muchas = Object.keys(opciones).length > 4;
        return `
            <div class="apariencia-grupo">
                <span class="apariencia-titulo">${TITULOS_APARIENCIA[campo]} <small>${opciones[elegida].nombre}</small></span>
                <div class="${conColor ? "muestras" : `selector ${muchas ? "selector-rejilla" : ""}`}" role="group" aria-label="${TITULOS_APARIENCIA[campo]}">${botones}</div>
            </div>`;
    }).join("");

    return `
        <section class="panel apariencia">
            <h2 class="titulo-juego">Apariencia</h2>
            <p class="nota">Elige cómo se ve tu avatar. Es gratis y lo puedes cambiar cuando quieras.</p>
            <!-- vista previa: se queda a la vista mientras eliges -->
            <div class="apariencia-previa">${dibujarAvatar(ctx.avatar, { batalla: true, sinEfectos: true })}</div>
            ${grupos}
        </section>`;
}

function seccionEquipamiento(estado, ctx) {
    const a = ctx.avatar;
    const disponibles = avatar.objetosDisponibles(estado, ctx.info);
    const poder = equipo.poderDelEquipo(estado);
    const ropa = a.etapa.armadura || 0;

    const espacios = Object.entries(avatar.ESPACIOS).map(([espacio, nombre]) => {
        const id = a.equipado[espacio];
        const objeto = id ? avatar.OBJETOS[id] : null;
        return `<div class="espacio ${objeto ? `lleno rareza-${objeto.rareza}` : ""}">
                    <span class="espacio-icono">${objeto ? dibujarObjeto(id) : "—"}</span>
                    <span class="mini texto-suave">${nombre}</span>
                    <span class="mini">${objeto ? esc(objeto.nombre) : "Vacío"}</span>
                </div>`;
    }).join("");

    const inventario = [...disponibles].map((id) => {
        const objeto = avatar.OBJETOS[id];
        const puesto = a.equipado[objeto.espacio] === id;
        return `<li class="objeto ${puesto ? "puesto" : ""}">
                    ${iconoObjeto(id)}
                    <span class="objeto-info"><b>${objeto.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[objeto.espacio]} · ${textoRareza(objeto)}${poderDe(objeto)}</span>
                        ${habilidadDe(objeto)}</span>
                    <button type="button" class="boton boton-chico ${puesto ? "" : "boton-oro"}" data-accion="equipar" data-id="${id}">
                        ${puesto ? "Quitar" : "Equipar"}</button>
                </li>`;
    }).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Equipamiento</h2>
            <div class="espacios">${espacios}</div>
            <div class="poder-equipo">
                <span><b>🛡️ ${ctx.vida.armadura.maxima}</b><small>Armadura máx.<br>${ropa} ropa + ${poder.armadura} objetos</small></span>
                <span><b>⚔️ +${poder.ataque}</b><small>Ataque</small></span>
                <span><b>🔮 +${poder.magia}</b><small>Magia</small></span>
                <span><b>🍀 +${poder.suerte}</b><small>Suerte</small></span>
            </div>
            <p class="nota">Lo que llevas puesto cuenta: la <b>armadura</b> te protege cuando fallas una misión, y el
               <b>ataque</b>, la <b>magia</b> y la <b>suerte</b> te hacen más fuerte en la Torre y en los minijuegos.</p>
            <h3 class="subtitulo">Tus objetos (${disponibles.size})</h3>
            ${disponibles.size
                ? `<ul class="lista">${inventario}</ul>`
                : vacio("Aún no tienes objetos. Cómpralos en la Tienda con gemas 💎 o gánalos con logros.")}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="subvista" data-pantalla="tienda" data-vista="equipo">⚔️ Ver el equipo de la tienda</button>
        </section>`;
}

function seccionMascota(estado, m, ctx) {
    const comio = mascota.comioHoy(estado, ctx.hoy);
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS_MASCOTA, m.etapa);
    const crecimiento = siguiente
        ? `${siguiente.clave === "cria" ? "Eclosiona" : "Crece a adulto"} en ${plural(siguiente.desde - m.total, "misión diaria", "misiones diarias")} más.`
        : "Ya es adulto. ¡Lo cuidaste muy bien!";
    const animo = m.triste
        ? "😢 Está triste: hace días que no completas misiones."
        : "😊 Está contento.";
    const enLaTorre = mascota.textoPotencia(mascota.mascotaDeBatalla(estado, m, ctx.hoy));
    // Las demás mascotas que tienes, para elegir cuál te acompaña.
    const otras = mascota.mascotasTuyas(estado).filter((especie) => especie !== m.especie).map((especie) => {
        const etapa = avatar.etapaSegun(avatar.ETAPAS_MASCOTA, mascota.totalDe(estado, especie));
        return `<li class="objeto">
                    ${retratoMascota(especie)}
                    <span class="objeto-info"><b>${esc(mascota.nombreDe(estado, especie))}</b>
                        <span class="mini texto-suave">${mascota.MASCOTAS[especie].nombre} · ${etapa.nombre} · ${textoRareza(mascota.MASCOTAS[especie])}</span></span>
                    <button type="button" class="boton boton-chico" data-accion="elegir-mascota" data-especie="${especie}">Llevar</button>
                </li>`;
    }).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Mascota</h2>
            <div class="mascota-ficha">
                <div class="mascota-dibujo">${dibujarMascota(m)}</div>
                <div>
                    <p><b>${esc(m.nombre)}</b> · ${mascota.MASCOTAS[m.especie].nombre} · ${m.etapa.nombre}</p>
                    <p class="mini texto-suave">${crecimiento}</p>
                    <p class="mini">${animo}</p>
                </div>
            </div>
            <p class="mini">${habilidadDeMascota(m.especie)}</p>
            <p class="mini texto-suave">🗼 En la Torre ${enLaTorre}.</p>
            <div class="mascota-acciones">
                <button type="button" class="boton boton-secundario" data-accion="acariciar-dragon">🤚 Acariciar</button>
                <button type="button" class="boton ${comio ? "boton-secundario" : "boton-oro"}" data-accion="alimentar-dragon" ${comio ? "disabled" : ""}>
                    🍖 ${comio ? "Ya comió hoy" : `Alimentar · 💎 ${mascota.COMIDA.precio}`}</button>
            </div>
            <p class="mini mascota-frase" id="mascota-frase">${comio
                ? `${esc(m.nombre)} comió hoy y está de buen ánimo.`
                : `Acarícialo, o dale de comer una vez al día (+${mascota.COMIDA.cura} ❤️ para ti).`}</p>
            <form class="form-linea" data-form="mascota">
                <input type="text" name="nombre" maxlength="20" required autocomplete="off" placeholder="Nuevo nombre" aria-label="Nombre de la mascota">
                <button type="submit" class="boton boton-chico">Renombrar</button>
            </form>
            <p class="nota">Crece con cada misión diaria que completas desde que la tienes: huevo → cría (10) → adulto (50).</p>
            ${otras ? `<h3 class="subtitulo">Tus otras mascotas</h3><ul class="lista">${otras}</ul>` : ""}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="subvista" data-pantalla="tienda" data-vista="mascotas">🐾 Adoptar en la tienda</button>
        </section>`;
}

// Objetos que no se compran: solo se ganan con logros.
// Los objetos que no se compran: solo se ganan con logros. Aquí van los que TODAVÍA no ganaste,
// con lo que llevas; los ganados ya están arriba, en «Tus objetos».
function seccionObjetosDeLogro(estado, ctx, titulo) {
    const deLogro = Object.entries(avatar.OBJETOS).filter(([, o]) => o.logro);
    const pendientes = deLogro.filter(([, o]) => avatar.progresoObjeto(o, estado, ctx.info) < o.logro.meta);
    const lista = pendientes.map(([id, o]) => {
        const progreso = avatar.progresoObjeto(o, estado, ctx.info);
        return `<li class="objeto">
                    ${iconoObjeto(id, "bloqueado")}
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${textoRareza(o)}${poderDe(o)} · ${o.logro.texto}</span>
                        ${habilidadDe(o)}
                        ${barra(Math.round((progreso / o.logro.meta) * 100), "barra-mini")}</span>
                    <span class="mini texto-suave">${progreso}/${o.logro.meta}</span>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏅 ${titulo}</h2>
            <p class="nota">No se pueden comprar: solo se ganan. Llevas ${deLogro.length - pendientes.length} de ${deLogro.length}.</p>
            ${pendientes.length ? `<ul class="lista">${lista}</ul>` : vacio("¡Los ganaste todos! Están en «Tus objetos».")}
        </section>`;
}


// Aviso de que caíste en combate (en la Tienda y en el Arcade).
function avisoCaido(v, titulo) {
    return `
        <div class="aviso-caido">
            <b>☠️ ${titulo}</b>
            <span>Caíste en combate. Se abre cuando llegues a <b>${v.levantarse} ❤️</b> (tienes ${v.puntos}).
                  Cada misión cumplida te cura; las pociones sí se venden.</span>
        </div>`;
}

// La poción de vida: +25 ❤️, una al día. Se vende aunque hayas caído.
function tarjetaPocion(estado, v) {
    const p = vida.POCION;
    let boton;
    if (v.pocionesHoy >= p.porDia) boton = '<span class="mini texto-suave">Mañana otra</span>';
    else if (v.puntos >= v.maxima) boton = '<span class="mini texto-suave">Vida llena</span>';
    else {
        const puede = estado.personaje.monedas >= p.precio;
        boton = `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="pocion" ${puede ? "" : "disabled"}>Tomar</button>`;
    }
    return `
        <ul class="lista">
            <li class="objeto pocion">
                <span class="pocion-icono" aria-hidden="true">🧪</span>
                <span class="objeto-info"><b>Poción de vida</b>
                    <span class="mini texto-suave">+${p.cura} ❤️ · 🪙 ${p.precio} · una al día · tienes ${v.puntos}/${v.maxima}</span></span>
                ${boton}
            </li>
        </ul>`;
}

// Equipamiento para tu avatar. Se compra con gemas 💎 (desde la v32), como las mascotas.
function tiendaDelAvatar(estado, cerrada, evento) {
    const gemas = estado.personaje.gemas || 0;
    const enVenta = Object.entries(avatar.OBJETOS)
        .filter(([, o]) => !o.logro)
        .sort(([, a], [, b]) => a.precio - b.precio);

    const lista = enVenta.map(([id, o]) => {
        const tuyo = estado.avatar.comprados.includes(id);
        const precio = precioConEvento(o.precio, evento);
        const puede = gemas >= precio && !cerrada;
        const accion = tuyo
            ? `<span class="mini oro">✓ Tuyo</span>`
            : `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar" data-id="${id}"
                       ${puede ? "" : "disabled"}>Comprar</button>`;
        return `<li class="objeto ${tuyo ? "puesto" : ""}">
                    ${iconoObjeto(id)}
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[o.espacio]} · ${textoRareza(o)}${poderDe(o)} · 💎 ${precio < o.precio ? `<s>${o.precio}</s> ${precio}` : o.precio}</span>
                        ${habilidadDe(o)}</span>
                    ${accion}
                </li>`;
    }).join("");

    return `
        <div class="titulo-seccion"><h2 class="titulo-juego">⚔️ Equipamiento</h2><span class="saldo-gemas">💎 ${gemas}</span></div>
        <p class="nota">El equipo se compra con <b>gemas</b>, la moneda del juego (las monedas quedan para tus premios reales).
           Lo que compres se equipa solo;
           puedes cambiarlo en tu Héroe. 🛡️ sube tu armadura (te protege al fallar una misión);
           ⚔️ ataque, 🔮 magia y 🍀 suerte cuentan en la Torre y en los minijuegos.
           Lo <b>épico</b> y lo <b>legendario</b> tiene además una habilidad especial en la Torre.</p>
        <ul class="lista">${lista}</ul>`;
}


// La mascota dibujada en su marco de rareza (adulta, para ver cómo será).
function retratoMascota(especie, extra = "") {
    const datos = mascota.MASCOTAS[especie];
    const m = { especie, nombre: datos.nombre, etapa: { clave: "adulto", nombre: "Adulta" }, total: 0, triste: false };
    return `<span class="objeto-icono retrato-mascota rareza-${datos.rareza} ${extra}">${dibujarMascota(m)}</span>`;
}

// Una línea con lo que hace una mascota en la Torre.
function habilidadDeMascota(especie) {
    const h = mascota.MASCOTAS[especie].habilidad;
    return `<span class="habilidad-objeto">🐾 <b>${h.nombre}</b> · ${h.texto} <i>(en la Torre)</i></span>`;
}

// Las mascotas se adoptan con gemas 💎 (v31), no con monedas.
function tiendaDeMascotas(estado, cerrada, ctx) {
    const gemas = estado.personaje.gemas || 0;
    const activa = mascota.especieActiva(estado);
    const lista = Object.entries(mascota.MASCOTAS).sort(([, a], [, b]) => (a.precio || 0) - (b.precio || 0)).map(([especie, datos]) => {
        const tuya = mascota.tieneMascota(estado, especie);
        const precio = datos.precio ? precioConEvento(datos.precio, ctx.evento) : 0;
        const puede = gemas >= precio && !cerrada;
        let accion;
        if (especie === activa) accion = `<span class="mini oro">✓ Te acompaña</span>`;
        else if (tuya) accion = `<span class="mini oro">✓ Tuya</span>`;
        else accion = `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar-mascota" data-especie="${especie}"
                               ${puede ? "" : "disabled"}>Adoptar</button>`;
        const costo = datos.precio ? ` · 💎 ${precio < datos.precio ? `<s>${datos.precio}</s> ${precio}` : datos.precio}` : " · tu primera mascota";
        return `<li class="objeto ${tuya ? "puesto" : ""}">
                    ${retratoMascota(especie)}
                    <span class="objeto-info"><b>${tuya ? esc(mascota.nombreDe(estado, especie)) : datos.nombre}</b>
                        <span class="mini texto-suave">${textoRareza(datos)}${costo}</span>
                        <span class="mini texto-suave">${datos.texto}</span>
                        ${habilidadDeMascota(especie)}</span>
                    ${accion}
                </li>`;
    }).join("");
    return `
        <div class="titulo-seccion"><h2 class="titulo-juego">🐾 Mascotas</h2><span class="saldo-gemas">💎 ${gemas}</span></div>
        <p class="nota">Las mascotas se adoptan con <b>gemas</b>, la moneda del arcade: se ganan jugando y con los jefes, el cofre
           del día, los desafíos y el mapa (las monedas quedan para tus premios reales). Eliges cuál te acompaña en
           <button type="button" class="enlace enlace-en-linea" data-accion="subvista" data-pantalla="personaje" data-vista="mascotas">tu Héroe › Mascotas</button>.
           Cada mascota llega como <b>huevo</b> y crece con las misiones diarias que completas desde que la adoptas
           (cría con ${avatar.ETAPAS_MASCOTA[1].desde}, adulta con ${avatar.ETAPAS_MASCOTA[2].desde}). La que te acompaña pelea a tu lado
           en la Torre: la cría al ${mascota.POTENCIA.cria * 100} %, la adulta al 100 % y, si comió ese día, un ${Math.round((mascota.ALIMENTADA - 1) * 100)} % más.
           Si está triste (porque te descuidaste), no pelea.</p>
        <ul class="lista">${lista}</ul>`;
}


// ===== Pantalla: Tienda =====

export function pantallaTienda(estado, ctx) {
    const monedas = estado.personaje.monedas;
    const cerrada = ctx.vida.caido;   // caíste en combate: solo se venden pociones
    const esencial = Boolean(estado.ajustes.esencial);   // modo esencial: solo los premios reales (monedas)
    const vista = esencial ? "recompensas" : ctx.subvista?.tienda || "recompensas";
    const precio = (base) => precioConEvento(base, ctx.evento);   // con el «Mercader ambulante», 30 % menos
    const mostrarPrecio = (base) => (precio(base) < base ? `<s>${base}</s> ${precio(base)}` : `${base}`);
    const recompensas = [...estado.recompensas].sort((a, b) => a.costo - b.costo);
    const canjes = estado.canjes.slice(-15).reverse(); // los 15 más recientes

    const lista = recompensas.map((r) => {
        const alcanza = monedas >= precio(r.costo);
        const puede = alcanza && !cerrada;
        return `
            <li class="recompensa ${puede ? "alcanzable" : ""}">
                <div class="recompensa-info">
                    <h3>${esc(r.nombre)}</h3>
                    <span class="mini ${alcanza ? "oro" : "texto-suave"}">🪙 ${mostrarPrecio(r.costo)}${alcanza ? "" : ` · te faltan ${precio(r.costo) - monedas}`}</span>
                </div>
                <button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="canjear" data-id="${r.id}" ${puede ? "" : "disabled"}>Canjear</button>
                ${botonEditar("editar-recompensa", r.id, `Editar ${r.nombre}`)}
            </li>`;
    }).join("");

    const historial = canjes.map((c) =>
        `<li><span>${esc(c.nombre)}</span><span class="texto-suave">${fechaCorta(c.fecha)} · −${c.costo}</span></li>`).join("");

    // Lo que se ve según la sección elegida.
    const secciones = {
        recompensas: () => `
            ${cabeceraSeccion("🎁 Recompensas", "recompensa", "+ Nueva")}
            <p class="nota">Premios reales que tú defines. Cánjealos cuando tengas monedas suficientes.</p>
            ${recompensas.length ? `<ul class="lista">${lista}</ul>` : vacio("Crea tu primera recompensa. Ej: «Ver un capítulo de mi serie» por 50 monedas.")}
            ${plegable(`Historial de canjes (${canjes.length})`, `<ul class="historial">${historial}</ul>`, canjes.length)}`,
        equipo: () => `
            ${tiendaDelAvatar(estado, cerrada, ctx.evento)}
            <p class="nota">🏅 Los objetos legendarios de logro no se venden: se ganan. Los ves en
               <button type="button" class="enlace enlace-en-linea" data-accion="subvista" data-pantalla="personaje" data-vista="equipo">tu Héroe › Equipo</button>.</p>`,
        mascotas: () => tiendaDeMascotas(estado, cerrada, ctx),
    };

    if (esencial) {
        return `
        <section class="panel saldo">
            <span class="etiqueta">Tus monedas</span>
            <span class="saldo-numero">🪙 ${monedas}</span>
            <span class="mini texto-suave">Las ganas con cada hábito que cumples.</span>
        </section>
        ${cerrada ? avisoCaido(ctx.vida, "Tienda cerrada") : ""}
        <section class="bloque">${secciones.recompensas()}</section>`;
    }

    return `
        <section class="panel saldo">
            <span class="etiqueta">Tus monedas</span>
            <span class="saldo-numero">🪙 ${monedas}</span>
            <span class="mini texto-suave">💎 ${estado.personaje.gemas || 0} gemas · para el equipo, las mascotas y el arcade</span>
            ${tarjetaPocion(estado, ctx.vida)}
        </section>
        ${cerrada ? avisoCaido(ctx.vida, "Tienda cerrada") : ""}
        ${ctx.evento?.clave === "mercader" ? avisoEvento(ctx) : ""}
        ${selectorSecciones("tienda", [["recompensas", "🎁 Premios"], ["equipo", "⚔️ Equipo"], ["mascotas", "🐾 Mascotas"]], vista)}
        <section class="bloque">${(secciones[vista] || secciones.recompensas)()}</section>
        <details class="plegable">
            <summary>🪙 Cómo ganar monedas</summary>
            <p class="nota">Solo con lo que haces en la vida real. Lo del arcade y los premios extra (jefes, cofres, desafíos y
               mapa) dan gemas 💎, que sirven para el equipo, las mascotas y el arcade.</p>
            <dl class="estadisticas">
                ${Object.values(DIFICULTADES).map((d) => `<div><dt>Misión ${d.nombre.toLowerCase()}</dt><dd>🪙 ${d.monedas}</dd></div>`).join("")}
                <div><dt>Paso de misión principal</dt><dd>🪙 ${PREMIOS.submision.monedas}</dd></div>
                <div><dt>Misión principal completa</dt><dd>🪙 ${PREMIOS.principal.monedas}</dd></div>
                <div><dt>Tarea suelta o sesión de enfoque</dt><dd>Como una misión</dd></div>
                <div><dt>Escribir tu diario</dt><dd>🪙 ${diario.PREMIO_DIARIO.monedas}</dd></div>
                <div><dt>Cerrar el día (ritual)</dt><dd>🪙 ${rituales.PREMIO_CIERRE.monedas}</dd></div>
                <div><dt>Logros</dt><dd>Tú decides</dd></div>
            </dl>
        </details>`;
}
