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
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as pacto from "./pacto.js";
import * as libro from "./libro.js";
import { rutaPintura } from "./pinturas.js";
import { dibujarAvatar, dibujarMascota, dibujarObjeto, dibujarEscenario } from "./dibujo.js";
import { calcularResumen, resumenSemana } from "./resumen.js";
import { fechaLegible, fechaCorta, MESES_CORTOS, DIAS_LETRAS, DIAS_CORTOS, desdeTexto, diaDeSemana,
         diasEntre, lunesDe, relojTexto, sumarDias, MESES } from "./fechas.js";

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


// ===== Pantalla: Hoy =====

export function pantallaHoy(estado, ctx) {
    // ctx.fechaVista es hoy o ayer (por si olvidaste marcar algo ayer).
    const fecha = ctx.fechaVista;
    const esAyer = fecha !== ctx.hoy;
    const racha = ctx.info.racha;
    const hechasEseDia = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));

    const delDia = juego.misionesDelDia(estado.misiones, fecha);           // las que tocan ese día
    const semanales = juego.semanalesDelDia(estado.misiones, fecha);       // las de «N veces por semana»
    const otrosDias = estado.misiones.filter((m) => !m.archivadaEn && !delDia.includes(m) && !semanales.includes(m));
    const archivadas = estado.misiones.filter((m) => m.archivadaEn);
    const hechas = delDia.filter((m) => hechasEseDia.has(m.id)).length;
    const todoListo = delDia.length > 0 && hechas === delDia.length;
    const sinMisiones = estado.misiones.every((m) => m.archivadaEn);
    const tarjeta = (m) => tarjetaMision(m, estado, fecha, hechasEseDia.has(m.id), ctx.recienHecha === m.id);

    let lista = "";
    if (delDia.length) {
        // Si usas momentos del día (mañana, tarde, noche), la lista se divide en grupos.
        const grupos = juego.agruparPorMomento(delDia);
        lista = grupos.length > 1 || grupos[0].clave
            ? grupos.map((g) => `<h3 class="subtitulo subtitulo-momento">${g.icono} ${g.nombre}</h3>
                                 <ul class="lista">${g.misiones.map(tarjeta).join("")}</ul>`).join("")
            : `<ul class="lista">${delDia.map(tarjeta).join("")}</ul>`;
    } else if (sinMisiones) {
        lista = vacio("Aún no tienes misiones diarias.<br>Crea tu primer hábito: ir al gym, leer, estudiar inglés…");
    } else if (!semanales.length) {
        lista = vacio(`${esAyer ? "Ayer fue" : "Hoy es"} día de descanso: no ${esAyer ? "tocaba" : "toca"} ninguna misión.<br>Tu racha no se rompe.`);
    }

    // Metas semanales: se pueden marcar cualquier día hasta cumplir las veces de la semana.
    const metasSemana = semanales.length ? `
        <h3 class="subtitulo">🗓️ Metas de la semana</h3>
        <ul class="lista">${semanales.map(tarjeta).join("")}</ul>` : "";

    const activo = estado.enfoque.activo;
    const chipEnfoque = activo
        ? `⏱️ <span data-reloj>${relojTexto(juego.finDelEnfoque(activo) - ctx.ahora)}</span>`
        : "⏱️ Enfoque";

    return `
        ${esAyer ? "" : tarjetaSemana(estado, ctx)}
        ${tarjetaHeroe(estado, ctx)}
        ${esAyer ? "" : lineaDelPacto(estado, ctx)}
        ${avisoDescanso(estado, ctx)}

        <div class="titulo-seccion">
            <div>
                <p class="etiqueta">${fechaLegible(fecha)}</p>
                <h2 class="titulo-juego">Misiones de ${esAyer ? "ayer" : "hoy"}</h2>
            </div>
            <p class="contador ${todoListo ? "completo" : ""}">${hechas}/${delDia.length}</p>
        </div>

        <div class="chips">
            <span class="chip chip-racha">🔥 ${plural(racha.actual, "día", "días")}</span>
            <span class="chip">🛡️ ${racha.escudos}/${ESCUDOS.maximo}</span>
            <button type="button" class="chip chip-arcade" data-accion="ir" data-pantalla="arcade">
                🎮 ${plural(arcade.fichasDisponibles(estado), "ficha", "fichas")}</button>
            <button type="button" class="chip chip-enfoque ${activo ? "activo" : ""}" data-accion="ir" data-pantalla="enfoque">${chipEnfoque}</button>
            ${todoListo ? '<span class="chip chip-oro">✨ Día perfecto</span>' : ""}
        </div>

        <!-- Selector de día: hoy, o ayer por si se te olvidó marcar algo -->
        <div class="selector" role="group" aria-label="Día">
            <button type="button" data-accion="ver-fecha" data-dia="ayer" aria-pressed="${esAyer}">Ayer</button>
            <button type="button" data-accion="ver-fecha" data-dia="hoy" aria-pressed="${!esAyer}">Hoy</button>
        </div>
        ${esAyer ? '<p class="nota">Estás viendo <b>ayer</b>. Marca lo que hiciste y se te olvidó anotar.</p>' : ""}

        ${ctx.recordarRespaldo ? avisoRespaldo() : ""}
        ${lista}
        ${metasSemana}

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

        ${esAyer ? "" : seccionTareas(estado, ctx)}
        ${tarjetaDesafio(estado, ctx)}
        ${seccionDiario(estado, ctx, fecha, esAyer)}
        ${jefesEnCombate(estado, ctx)}`;
}

// Cada cuánto toca: "3 veces por semana", "L · X · V" o "Todos los días".
function textoFrecuencia(mision) {
    if (mision.veces) return `${plural(mision.veces, "vez", "veces")} por semana`;
    return mision.dias ? mision.dias.map((d) => DIAS_LETRAS[d]).join(" · ") : "Todos los días";
}

// conFrecuencia: en la lista de hoy no hace falta repetir "Todos los días".
// conMomento: en Hoy ya están agrupadas por momento del día; en la ficha y en «Otros días» sí se muestra.
function detalleMision(estado, mision, conFrecuencia = Boolean(mision.dias), conMomento = false) {
    const d = DIFICULTADES[mision.dificultad];
    const a = juego.infoAtributo(estado, mision.atributo, mision.atributoPropio);
    const aviso = mision.aviso ? ` · ⏰ ${mision.aviso}` : "";
    const momento = mision.momento && conMomento ? ` · ${juego.MOMENTOS[mision.momento].icono}` : "";
    return `${esc(a.icono)} ${esc(a.nombre)} · ${d.nombre} · +${d.xp} XP${conFrecuencia ? ` · ${textoFrecuencia(mision)}` : ""}${momento}${aviso}`;
}

function tarjetaMision(mision, estado, fecha, hecha, recienHecha) {
    const falla = hecha ? null : juego.fallaDe(estado, mision.id, fecha);
    const clases = ["mision", `dificultad-${mision.dificultad}`, hecha ? "hecha" : "", falla ? "fallada" : "", recienHecha ? "recien-hecha" : ""];
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
    return `
        <li class="mision apagada dificultad-${mision.dificultad}">
            <div class="mision-info" data-accion="ver-ficha" data-id="${mision.id}" role="button" aria-label="Ficha de ${esc(mision.nombre)}">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(estado, mision, true, true)}${meta}</span>
            </div>
            ${boton}
        </li>`;
}


// ===== Ficha de un hábito =====

export function fichaMision(estado, mision, hoy) {
    const s = juego.estadisticasMision(estado, mision, hoy);
    const enUnidad = (n) => plural(n, s.unidad, s.unidad === "día" ? "días" : "semanas");
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

    return `
        ${cabeceraSeccion("📌 Tareas", "tarea", "+ Nueva")}
        ${paraHoy.length
            ? lista(paraHoy)
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
        : `Cofre: +${cofre.monedas} 🪙 y +${cofre.xp} XP · ${quedan === 0 ? "termina hoy" : `quedan ${plural(quedan, "día", "días")}`}`;
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
                <label>${esc(diario.preguntaDelDia(fecha))}
                    <textarea name="texto" rows="3" maxlength="${diario.LARGO.texto}"
                              placeholder="Escribe lo que quieras. Una frase basta.">${esc(entrada?.texto || "")}</textarea>
                </label>
                <label>🙏 Hoy agradezco…
                    <input type="text" name="gratitud" maxlength="${diario.LARGO.gratitud}" autocomplete="off"
                           value="${esc(entrada?.gratitud || "")}" placeholder="Ej: el café con mi mamá">
                </label>
                <button type="submit" class="boton boton-principal">${entrada ? "Actualizar" : "Guardar en mi diario"}</button>
            </form>
        </section>`;
}


// ===== El Tratado de la Voluntad (tu pacto) =====

// En Hoy: si no lo has firmado, una invitación; si sí, el día de tu pacto y una cita
// (o una advertencia si ayer fallaste: el artículo III dice «nunca fallar dos días seguidos»).
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
        <div class="titulo-seccion">
            <h2 class="titulo-juego">📜 Tu pacto</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="hoy">‹ Hoy</button>
        </div>
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
            <button type="button" class="boton boton-principal boton-ancho" data-accion="cerrar-semana">¡A por esta semana!</button>
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

// Debajo de la barra: qué te pasará hoy (o por qué estás así).
function notaDeVida(estado, ctx) {
    const v = ctx.vida;
    if (juego.enDescanso(estado, ctx.hoy)) return "🏖️ Modo descanso: hoy no pierdes vida.";
    if (v.caido) return `Tienda y arcade cerrados hasta llegar a ${v.levantarse} ❤️. Cada misión te cura.`;
    const pendiente = vida.danoDelDia(estado, ctx.hoy).dano;
    const ayer = v.registro.find((r) => r.fecha === sumarDias(ctx.hoy, -1));
    const partes = [];
    if (pendiente) partes.push(`Si no terminas hoy: <b class="vida-menos">−${pendiente} ❤️</b>`);
    else if (juego.misionesDelDia(estado.misiones, ctx.hoy).length) partes.push("Hoy ya no pierdes vida. ✓");
    if (ayer?.dano) partes.push(`Ayer: −${ayer.dano} ❤️ (¿lo hiciste? márcalo en «Ayer»)`);
    return partes.join(" · ");
}

// Tarjeta del héroe arriba de "Hoy". Salta cuando completas una misión.
function tarjetaHeroe(estado, ctx) {
    const a = ctx.avatar;
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS, a.etapa);
    return `
        <button type="button" class="heroe ${ctx.recienHecha ? "atacar" : ""}" data-accion="ir" data-pantalla="personaje">
            <span class="heroe-avatar">${dibujarAvatar(a)}</span>
            <span class="heroe-info">
                <span class="etiqueta">${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</span>
                <span class="heroe-animo">${textoAnimo(a, ctx)}</span>
                <span class="heroe-vida">${barraDeVida(ctx.vida)}</span>
                <span class="mini texto-suave">${notaDeVida(estado, ctx)}</span>
                <span class="mini texto-suave">${siguiente
                    ? `Evoluciona a ${siguiente.nombre} en el nivel ${siguiente.desde}`
                    : "¡Etapa máxima alcanzada!"}</span>
                <span class="mini heroe-ver">Ver personaje ›</span>
            </span>
        </button>`;
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
    const { racha, diasPerfectos } = ctx.info;
    const escudos = Array.from({ length: ESCUDOS.maximo }, (_, i) =>
        `<span class="escudo ${i < racha.escudos ? "lleno" : ""}">🛡️</span>`).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Racha</h2>
            <div class="racha-datos">
                <div><span class="racha-numero">🔥 ${racha.actual}</span><span class="etiqueta">Actual</span></div>
                <div><span class="racha-numero">🏅 ${racha.mejor}</span><span class="etiqueta">Mejor</span></div>
                <div><span class="racha-numero escudos">${escudos}</span><span class="etiqueta">Escudos</span></div>
            </div>
            <p class="nota">Un día cuenta si completas al menos 1 misión. Cada ${ESCUDOS.diasParaGanar} días seguidos
               ganas un escudo (máx. ${ESCUDOS.maximo}): si fallas un día, el escudo salva tu racha.</p>
        </section>

        ${seccionResumen(estado, ctx)}

        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">Calendario</h2>
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
            <h2 class="titulo-juego">Atributos</h2>
            <div class="atributos">${Object.keys(ATRIBUTOS).map((clave) => tarjetaAtributo(estado, clave)).join("")}</div>
            ${seccionAtributosPropios(estado)}
        </section>

        <section class="panel">
            <h2 class="titulo-juego">Estadísticas</h2>
            <dl class="estadisticas">
                <div><dt>Misiones diarias completadas</dt><dd>${ctx.info.totalCompletadas}</dd></div>
                <div><dt>Días perfectos</dt><dd>${diasPerfectos}</dd></div>
                <div><dt>Misiones principales</dt><dd>${ctx.info.principalesCompletadas}</dd></div>
                <div><dt>Jefes derrotados</dt><dd>${ctx.info.jefesDerrotados}</dd></div>
                <div><dt>Recompensas canjeadas</dt><dd>${estado.canjes.length}</dd></div>
                <div><dt>XP total</dt><dd>${estado.personaje.xp}</dd></div>
            </dl>
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
    return `
        <div class="atributo" style="--color-atributo: ${a.color}">
            <div class="atributo-cabecera">
                <span class="atributo-icono">${a.icono}</span>
                <span class="atributo-nombre">${a.nombre}</span>
                <span class="atributo-nivel">Nv ${n.nivel}</span>
            </div>
            ${barra(n.porcentaje, "barra-mini barra-atributo")}
            <span class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP</span>
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


export function pantallaAventuras(estado, ctx) {
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
    const campanas = Object.values(campana.estadoCampanas(estado));
    const d = campana.DANO.diaria;

    return `
        <button type="button" class="panel acceso-arcade" data-accion="ir" data-pantalla="arcade">
            <span class="acceso-arcade-icono">🕹️</span>
            <span><b>Arcade del héroe</b>
                <span class="mini texto-suave">3 minijuegos con tu avatar · 🎟️ ${plural(arcade.fichasDisponibles(estado), "ficha", "fichas")}</span></span>
            <span class="heroe-ver">Jugar ›</span>
        </button>
        <button type="button" class="panel acceso-arcade acceso-enfoque" data-accion="ir" data-pantalla="enfoque">
            <span class="acceso-arcade-icono">⏱️</span>
            <span><b>Modo enfoque</b>
                <span class="mini texto-suave">Concéntrate 15, 25 o 50 minutos y gana XP</span></span>
            <span class="heroe-ver">Abrir ›</span>
        </button>

        <div class="titulo-seccion"><h2 class="titulo-juego">Campaña de jefes</h2></div>
        <p class="nota">Cada categoría tiene 5 jefes, cada vez más fuertes. Solo los dañas cumpliendo objetivos
           de <b>su</b> categoría: una misión diaria, tarea o sesión de enfoque hace poco daño (−${d.facil} fácil, −${d.normal} normal, −${d.dificil} difícil);
           cada paso de una <b>misión principal</b> hace −${campana.DANO.paso} y completarla entera, −${campana.DANO.principal} extra.
           Al vencer a los 5 empieza la <b>Partida+</b>: vuelven con más vida y mejores premios.</p>
        ${campanas.map((c) => tarjetaCampana(c, ctx)).join("")}

        ${cabeceraSeccion("Misiones principales", "principal", "+ Nueva")}
        <p class="nota">Tus objetivos grandes, divididos en pasos. Son tu arma más fuerte contra los jefes.
           Cada paso: +${PREMIOS.submision.xp} XP. Al terminar todos: +${PREMIOS.principal.xp} XP y ${PREMIOS.principal.monedas} monedas.</p>
        ${enCurso.length ? enCurso.map((p) => tarjetaPrincipal(estado, p)).join("") : vacio("Sin misiones principales en curso. Ej: «Aprender inglés B1» o «Terminar CS50».")}
        ${plegable(`Completadas (${terminadas.length})`, terminadas.map((p) => tarjetaPrincipal(estado, p)).join(""), terminadas.length)}
        ${plegable(`Archivadas (${archivadas.length})`, `<ul class="lista">${filasArchivadas}</ul>`, archivadas.length)}`;
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
            <p class="mini texto-suave">Recompensa al derrotarlo: +${premio.xp} XP y ${premio.monedas} monedas</p>
            <ol class="ruta-jefes">${ruta}</ol>
        </article>`;
}

// En "Hoy": el jefe actual de cada categoría, para tenerlos siempre a la vista.
function jefesEnCombate(estado, ctx) {
    const filas = Object.values(campana.estadoCampanas(estado)).map((c) => {
        const a = juego.ATRIBUTOS[c.categoria];
        const dano = (ctx.golpes || {})[c.categoria] || 0;
        const ronda = c.ronda > 1 ? ` · Ronda ${c.ronda}` : "";
        return `
            <li>
                <button type="button" class="combate ${dano ? "golpeado" : ""}" data-accion="ir" data-pantalla="aventuras">
                    <span class="combate-jefe">${retratoJefe(c.jefe, campana.estadoVisual(c.porcentaje), "mini", dano)}</span>
                    <span class="combate-info">
                        <b>${esc(c.jefe.nombre)} <span class="texto-suave mini">· ${esc(c.jefe.titulo)}</span></b>
                        ${barra(c.porcentaje, "barra-vida barra-mini")}
                        <span class="mini texto-suave">${a.icono} ${a.nombre}${ronda} · Vida ${c.vida} / ${c.vidaMax}</span>
                    </span>
                </button>
            </li>`;
    }).join("");
    if (!filas) return "";
    return `<h3 class="subtitulo">⚔️ En combate</h3>
            <p class="nota">Cada misión de una categoría golpea al jefe de esa categoría.</p>
            <ul class="lista">${filas}</ul>`;
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


// ===== Pantalla: Arcade (minijuegos) =====

export function pantallaArcade(estado, ctx) {
    const caido = ctx.vida.caido;
    const fichas = arcade.fichasDisponibles(estado);
    const puedeJugar = fichas > 0 && !caido;   // si caíste en combate, el arcade se cierra
    const tarjetas = Object.entries(arcade.JUEGOS).map(([clave, j]) => {
        const record = estado.arcade.records[clave] || 0;
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
                <p class="mini">🏅 Récord: <b>${record}</b> pts</p>
                <button type="button" class="boton boton-principal boton-ancho" data-accion="jugar" data-juego="${clave}"
                        ${puedeJugar ? "" : "disabled"}>Jugar · 🎟️ 1 ficha</button>
            </article>`;
    }).join("");

    // La Torre: el minijuego grande, arriba de todo.
    const partida = estado.arcade.torre;
    const recordTorre = estado.arcade.records.torre || 0;
    const tarjetaTorre = `
        <article class="panel torre-tarjeta">
            <div class="torre-portada" style="background-image: url(${rutaPintura("torre")})">
                <span class="torre-portada-titulo">🗼 Torre del héroe</span>
            </div>
            <p class="nota">Sube piso a piso peleando por turnos contra los monstruos de tus campañas. Antes de cada
               turno ves qué planea el monstruo: ataca, lanza un hechizo, defiéndete o toma una poción. Al ganar eliges
               una mejora. <b>Tu poder sale de los niveles de tus atributos reales.</b></p>
            <p class="mini">❤️ Subes con tu vida real: empiezas con el
               ${Math.round(vida.proporcionTorre(ctx.vida) * 100)} % de tu vida.</p>
            <p class="mini">🏅 Récord: ${recordTorre ? `${plural(recordTorre, "piso superado", "pisos superados")}` : "todavía ninguno"}
               · Premio: ${torre.PREMIO.monedasPorPiso} 🪙 y ${torre.PREMIO.xpPorPiso} XP de Carisma por piso
               (máx. ${torre.PREMIO.maxMonedas} 🪙 y ${torre.PREMIO.maxXp} XP)</p>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="torre-abrir" ${!caido && (partida || fichas) ? "" : "disabled"}>
                ${partida ? `Continuar · piso ${partida.piso}` : "Subir a la torre · 🎟️ 1 ficha"}</button>
        </article>`;

    return `
        ${caido ? avisoCaido(ctx.vida, "El arcade está cerrado") : ""}
        ${tarjetaTorre}
        <section class="panel arcade-cabecera">
            <div class="arcade-heroe">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
            <div>
                <h2 class="titulo-juego">Arcade del héroe</h2>
                <p class="fichas">🎟️ ${plural(fichas, "ficha", "fichas")}</p>
                <p class="nota">Ganas <b>1 ficha</b> por cada misión diaria completada. Cada partida da monedas y XP
                   según tus puntos (máx. ${arcade.MAX_MONEDAS} 🪙 y ${arcade.MAX_XP} XP).</p>
            </div>
        </section>
        ${fichas || caido ? "" : vacio("Sin fichas por ahora. Completa una misión diaria y vuelve a jugar.")}
        ${tarjetas}`;
}


// ===== La Torre del héroe (pantalla completa) =====
// t = { partida, avatar (SVG del héroe), eventos (lo que acaba de pasar), resultado (al cobrar), record, fichas }

export function pantallaTorre(t) {
    if (t.resultado) return finalTorre(t);
    const p = t.partida;
    const h = p.heroe;
    const m = p.enemigo;
    const eventos = t.eventos || [];
    const del = (quien, tipo) => eventos.find((e) => e.quien === quien && (!tipo || e.tipo === tipo));

    // Lo que acaba de pasar, para las animaciones.
    const golpeHeroe = eventos.find((e) => e.quien === "heroe" && e.dano);
    const golpeEnemigo = eventos.find((e) => e.quien === "enemigo" && e.dano);
    const curaHeroe = eventos.find((e) => e.quien === "heroe" && e.cura);
    const curaEnemigo = del("enemigo", "curar");
    const numero = (texto, clase, retraso = 0) =>
        `<span class="dano ${clase}" style="animation-delay: ${retraso}ms" aria-hidden="true">${texto}</span>`;

    const visual = campana.estadoVisual((m.vida / m.vidaMax) * 100);
    const intencion = torre.textoIntencion(m);
    const vida = (actual, maximo, clase) => `
        <div class="barra barra-vida barra-mini ${clase}"><div class="barra-relleno" style="width: ${(actual / maximo) * 100}%"></div></div>
        <span class="mini"><b>${actual}</b> / ${maximo}</span>`;

    const escena = `
        <div class="torre-escena" style="background-image: url(${rutaPintura("torre")})">
            <div class="torre-lado torre-heroe ${golpeHeroe ? "atacar" : ""} ${golpeEnemigo ? "herido" : ""} ${del("heroe", "defender") ? "defiende" : ""}">
                <div class="torre-avatar">${t.avatar}</div>
                ${golpeEnemigo ? numero(`−${golpeEnemigo.dano}`, "", 520) : ""}
                ${curaHeroe ? numero(`+${curaHeroe.cura}`, "cura") : ""}
                ${del("heroe", "hechizo") ? '<span class="torre-rayo" aria-hidden="true"></span>' : ""}
                ${vida(h.vida, h.vidaMax, "barra-heroe")}
            </div>
            <div class="torre-lado torre-enemigo ${golpeHeroe ? "golpeado" : ""} ${del("enemigo", "furia") ? "furia" : ""}">
                ${p.fase === "batalla" ? `<p class="torre-intencion">${intencion.icono} ${intencion.texto}</p>` : ""}
                <figure class="retrato ${p.fase === "batalla" ? visual : "derrotado"}">
                    <img src="${campana.imagenDe(m.id)}" alt="${esc(m.nombre)}">
                    ${golpeHeroe ? '<span class="impacto"></span>' : ""}
                </figure>
                ${golpeHeroe ? numero(`−${golpeHeroe.dano}${golpeHeroe.critico ? "!" : ""}`, golpeHeroe.critico ? "critico" : "", 280) : ""}
                ${curaEnemigo ? numero(`+${curaEnemigo.cura}`, "cura", 520) : ""}
                <b class="torre-nombre">${m.guardian ? "👑 " : ""}${esc(m.nombre)}</b>
                <span class="mini texto-suave">${esc(m.titulo)}</span>
                ${vida(m.vida, m.vidaMax, "")}
            </div>
        </div>`;

    const botones = `
        <div class="torre-acciones">
            <button type="button" class="boton boton-secundario" data-accion="torre-accion" data-torre="atacar">
                ⚔️ Atacar<small>${Math.round(h.ataque * 0.85)}–${Math.round(h.ataque * 1.15)} de daño</small></button>
            <button type="button" class="boton boton-secundario" data-accion="torre-accion" data-torre="hechizo" ${h.mana ? "" : "disabled"}>
                🔮 Hechizo<small>~${h.hechizo} · quedan ${h.mana}/${h.manaMax}</small></button>
            <button type="button" class="boton boton-secundario" data-accion="torre-accion" data-torre="defender">
                🛡️ Defender<small>bloquea ${Math.round(h.defensa * 100)} % · +${h.curaDefensa} vida</small></button>
            <button type="button" class="boton boton-secundario" data-accion="torre-accion" data-torre="pocion" ${h.pociones ? "" : "disabled"}>
                🧪 Poción<small>+35 % de vida · quedan ${h.pociones}</small></button>
        </div>`;

    // Ventanas encima de la batalla: elegir mejora, o la caída.
    // Si aparecen justo después de un golpe, esperan un instante para que se vea el golpe final.
    const espera = eventos.length ? "tras-golpe" : "";
    let encima = "";
    if (p.fase === "mejora") {
        encima = `
            <div class="torre-ventana ${espera}">
                <p class="etiqueta">¡Piso ${p.piso} superado!</p>
                <h3 class="titulo-juego">Elige una mejora</h3>
                <div class="torre-mejoras">${p.opciones.map((clave) => {
                    const mejora = torre.MEJORAS[clave];
                    return `<button type="button" class="torre-mejora" data-accion="torre-mejora" data-mejora="${clave}">
                                <span class="torre-mejora-icono">${mejora.icono}</span><b>${mejora.nombre}</b><small>${mejora.texto}</small></button>`;
                }).join("")}</div>
            </div>`;
    } else if (p.fase === "fin") {
        const pisos = torre.pisosSuperados(p);
        const premio = torre.premio(pisos);
        encima = `
            <div class="torre-ventana ${espera}">
                <p class="etiqueta">Fin de la subida</p>
                <h3 class="titulo-juego">Caíste en el piso ${p.piso}</h3>
                <p>Superaste <b>${plural(pisos, "piso", "pisos")}</b>.</p>
                <p class="minijuego-premio">+${premio.monedas} 🪙 · +${premio.xp} XP de 💬 Carisma</p>
                <button type="button" class="boton boton-principal boton-ancho" data-accion="torre-cobrar">Cobrar premio</button>
            </div>`;
    }

    return `
        <div class="minijuego-barra">
            <span class="titulo-juego">🗼 Piso ${p.piso}${torre.esGuardian(p.piso) ? " · Guardián" : ""}</span>
            <button type="button" class="boton-icono" data-accion="torre-salir" aria-label="Salir de la torre">${ICONOS.cerrar}</button>
        </div>
        ${escena}
        <p class="torre-registro" role="status">${esc(p.registro)}</p>
        ${p.fase === "batalla" ? botones : ""}
        ${p.fase === "batalla" ? `<button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Rendirse y cobrar lo ganado</button>` : ""}
        ${encima}`;
}

function finalTorre(t) {
    const r = t.resultado;
    return `
        <div class="minijuego-barra">
            <span class="titulo-juego">🗼 Torre del héroe</span>
            <button type="button" class="boton-icono" data-accion="torre-salir" aria-label="Salir de la torre">${ICONOS.cerrar}</button>
        </div>
        <div class="torre-escena torre-escena-final" style="background-image: url(${rutaPintura("torre")})">
            <div class="torre-avatar">${t.avatar}</div>
        </div>
        <div class="torre-ventana torre-ventana-fija">
            <p class="etiqueta">Premio cobrado</p>
            <p class="minijuego-puntos">${plural(r.pisos, "piso", "pisos")}</p>
            <p>${r.nuevoRecord ? "🏅 ¡Nuevo récord!" : `🏅 Récord: ${plural(r.record, "piso", "pisos")}`}</p>
            <p class="minijuego-premio">+${r.premio.monedas} 🪙 · +${r.premio.xp} XP de 💬 Carisma</p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="torre-salir">Salir</button>
                <button type="button" class="boton boton-principal" data-accion="torre-abrir" ${t.fichas ? "" : "disabled"}>
                    ${t.fichas ? `Otra vez · 🎟️ ${t.fichas}` : "Sin fichas"}</button>
            </div>
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
                <h2 class="titulo-juego">⏱️ Modo enfoque</h2>
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
        </div>`;
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

export function pantallaPersonaje(estado, ctx) {
    const a = ctx.avatar;

    // Las 4 etapas, marcando la actual y las que ya pasaste.
    const etapas = avatar.ETAPAS.map((e) => {
        const clase = e === a.etapa ? "actual" : a.nivel >= e.desde ? "pasada" : "";
        return `<li class="${clase}"><span>${e.nombre}</span><small>Nv ${e.desde}</small></li>`;
    }).join("");

    // Qué cambia cada atributo en el avatar, y qué ya tienes.
    const rasgos = Object.entries(avatar.RASGOS).map(([clave, umbrales]) => {
        const a2 = juego.ATRIBUTOS[clave];
        const items = umbrales.map((u) => {
            const tiene = a.niveles[clave] >= u.nivel;
            return `<li class="${tiene ? "tiene" : ""}">${tiene ? "✓" : "🔒"} ${u.texto}
                        <small>${tiene ? "" : `(nivel ${u.nivel})`}</small></li>`;
        }).join("");
        return `<div class="rasgo" style="--color-atributo: ${a2.color}">
                    <span class="rasgo-titulo">${a2.icono} ${a2.nombre} <b>Nv ${a.niveles[clave]}</b></span>
                    <ul>${items}</ul>
                </div>`;
    }).join("");

    return `
        <section class="panel ficha">
            <div class="ficha-avatar">${dibujarAvatar(a)}</div>
            <h2 class="titulo-juego">${esc(estado.personaje.nombre)}</h2>
            <p class="etiqueta">Nivel ${a.nivel} · ${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</p>
            <p class="heroe-animo">${textoAnimo(a, ctx)}</p>
            <div class="ficha-vida">${barraDeVida(ctx.vida)}</div>
            <button type="button" class="boton boton-secundario" data-accion="ir" data-pantalla="pacto">📜 ${estado.pacto ? "Mi pacto" : "Sellar mi pacto"}</button>
            <p class="mini texto-suave">${vida.ESTADOS[ctx.vida.nivel].texto}</p>
            <ol class="etapas">${etapas}</ol>
        </section>

        ${seccionApariencia(estado, ctx)}

        <section class="panel">
            <h2 class="titulo-juego">Clase: ${a.clase.icono} ${a.clase.nombre}</h2>
            <p class="nota">${a.clase.texto} Clases: ⚔️ Guerrero (Fuerza), 🔮 Mago (Intelecto), 🎶 Bardo (Carisma),
               ⚖️ Mercader (Riqueza) o 🌟 Aventurero completo si equilibras los cuatro.</p>
            <div class="rasgos">${rasgos}</div>
        </section>

        ${seccionEquipamiento(estado, ctx)}
        ${seccionMascota(a.mascota)}
        ${seccionObjetosDeLogro(estado, ctx, "Objetos de logro")}`;
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
                        <span class="mini texto-suave">${avatar.ESPACIOS[objeto.espacio]} · ${textoRareza(objeto)}</span></span>
                    <button type="button" class="boton boton-chico ${puesto ? "" : "boton-oro"}" data-accion="equipar" data-id="${id}">
                        ${puesto ? "Quitar" : "Equipar"}</button>
                </li>`;
    }).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Equipamiento</h2>
            <div class="espacios">${espacios}</div>
            <h3 class="subtitulo">Tus objetos (${disponibles.size})</h3>
            ${disponibles.size
                ? `<ul class="lista">${inventario}</ul>`
                : vacio("Aún no tienes objetos. Cómpralos en la Tienda con tus monedas o gánalos con logros.")}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="ir" data-pantalla="tienda">Ir a la tienda</button>
        </section>`;
}

function seccionMascota(m) {
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS_MASCOTA, m.etapa);
    const crecimiento = siguiente
        ? `${siguiente.clave === "cria" ? "Eclosiona" : "Crece a adulto"} en ${plural(siguiente.desde - m.total, "misión diaria", "misiones diarias")} más.`
        : "Ya es adulto. ¡Lo cuidaste muy bien!";
    const animo = m.triste
        ? "😢 Está triste: hace días que no completas misiones."
        : "😊 Está contento.";

    return `
        <section class="panel">
            <h2 class="titulo-juego">Mascota</h2>
            <div class="mascota-ficha">
                <div class="mascota-dibujo">${dibujarMascota(m)}</div>
                <div>
                    <p><b>${esc(m.nombre)}</b> · ${m.etapa.nombre}</p>
                    <p class="mini texto-suave">${crecimiento}</p>
                    <p class="mini">${animo}</p>
                </div>
            </div>
            <form class="form-linea" data-form="mascota">
                <input type="text" name="nombre" maxlength="20" required autocomplete="off" placeholder="Nuevo nombre" aria-label="Nombre de la mascota">
                <button type="submit" class="boton boton-chico">Renombrar</button>
            </form>
            <p class="nota">Crece con cada misión diaria que completas: huevo → cría (10) → adulto (50).</p>
        </section>`;
}

// Objetos que no se compran: solo se ganan con logros.
function seccionObjetosDeLogro(estado, ctx, titulo) {
    const lista = Object.entries(avatar.OBJETOS).filter(([, o]) => o.logro).map(([id, o]) => {
        const progreso = Math.min(avatar.progresoObjeto(o, estado, ctx.info), o.logro.meta);
        const ganado = progreso >= o.logro.meta;
        return `<li class="objeto ${ganado ? "puesto" : ""}">
                    ${iconoObjeto(id, ganado ? "" : "bloqueado")}
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${textoRareza(o)} · ${o.logro.texto}</span>
                        ${ganado ? "" : barra(Math.round((progreso / o.logro.meta) * 100), "barra-mini")}</span>
                    <span class="mini ${ganado ? "oro" : "texto-suave"}">${ganado ? "¡Ganado!" : `${progreso}/${o.logro.meta}`}</span>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏅 ${titulo}</h2>
            <p class="nota">No se pueden comprar: solo se ganan.</p>
            <ul class="lista">${lista}</ul>
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

// Equipamiento que se compra con monedas (además de las recompensas reales).
function tiendaDelAvatar(estado, cerrada) {
    const monedas = estado.personaje.monedas;
    const enVenta = Object.entries(avatar.OBJETOS)
        .filter(([, o]) => !o.logro)
        .sort(([, a], [, b]) => a.precio - b.precio);

    const lista = enVenta.map(([id, o]) => {
        const tuyo = estado.avatar.comprados.includes(id);
        const puede = monedas >= o.precio && !cerrada;
        const accion = tuyo
            ? `<span class="mini oro">✓ Tuyo</span>`
            : `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar" data-id="${id}"
                       ${puede ? "" : "disabled"}>Comprar</button>`;
        return `<li class="objeto ${tuyo ? "puesto" : ""}">
                    ${iconoObjeto(id)}
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[o.espacio]} · ${textoRareza(o)} · 🪙 ${o.precio}</span></span>
                    ${accion}
                </li>`;
    }).join("");

    return `
        <div class="titulo-seccion"><h2 class="titulo-juego">Equipamiento del avatar</h2></div>
        <p class="nota">Las monedas también sirven para tu avatar. Lo que compres se equipa solo;
           puedes cambiarlo en tu Personaje.</p>
        <ul class="lista">${lista}</ul>`;
}


// ===== Pantalla: Tienda =====

export function pantallaTienda(estado, ctx) {
    const monedas = estado.personaje.monedas;
    const cerrada = ctx.vida.caido;   // caíste en combate: solo se venden pociones
    const recompensas = [...estado.recompensas].sort((a, b) => a.costo - b.costo);
    const canjes = estado.canjes.slice(-15).reverse(); // los 15 más recientes

    const lista = recompensas.map((r) => {
        const alcanza = monedas >= r.costo;
        const puede = alcanza && !cerrada;
        return `
            <li class="recompensa ${puede ? "alcanzable" : ""}">
                <div class="recompensa-info">
                    <h3>${esc(r.nombre)}</h3>
                    <span class="mini ${alcanza ? "oro" : "texto-suave"}">🪙 ${r.costo}${alcanza ? "" : ` · te faltan ${r.costo - monedas}`}</span>
                </div>
                <button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="canjear" data-id="${r.id}" ${puede ? "" : "disabled"}>Canjear</button>
                ${botonEditar("editar-recompensa", r.id, `Editar ${r.nombre}`)}
            </li>`;
    }).join("");

    const historial = canjes.map((c) =>
        `<li><span>${esc(c.nombre)}</span><span class="texto-suave">${fechaCorta(c.fecha)} · −${c.costo}</span></li>`).join("");

    return `
        <section class="panel saldo">
            <span class="etiqueta">Tus monedas</span>
            <span class="saldo-numero">🪙 ${monedas}</span>
        </section>
        ${cerrada ? avisoCaido(ctx.vida, "Tienda cerrada") : ""}

        <div class="titulo-seccion"><h2 class="titulo-juego">❤️ Vida</h2></div>
        ${tarjetaPocion(estado, ctx.vida)}

        ${cabeceraSeccion("Recompensas", "recompensa", "+ Nueva")}
        <p class="nota">Premios reales que tú defines. Cánjealos cuando tengas monedas suficientes.</p>
        ${recompensas.length ? `<ul class="lista">${lista}</ul>` : vacio("Crea tu primera recompensa. Ej: «Ver un capítulo de mi serie» por 50 monedas.")}

        ${tiendaDelAvatar(estado, cerrada)}
        ${seccionObjetosDeLogro(estado, ctx, "Objetos que no se venden")}

        ${canjes.length ? `<section class="panel"><h2 class="titulo-juego">Historial</h2><ul class="historial">${historial}</ul></section>` : ""}

        <section class="panel">
            <h2 class="titulo-juego">Cómo ganar monedas</h2>
            <dl class="estadisticas">
                ${Object.values(DIFICULTADES).map((d) => `<div><dt>Misión ${d.nombre.toLowerCase()}</dt><dd>🪙 ${d.monedas}</dd></div>`).join("")}
                <div><dt>Paso de misión principal</dt><dd>🪙 ${PREMIOS.submision.monedas}</dd></div>
                <div><dt>Misión principal completa</dt><dd>🪙 ${PREMIOS.principal.monedas}</dd></div>
                <div><dt>Tarea suelta o sesión de enfoque</dt><dd>Como una misión</dd></div>
                <div><dt>Jefe derrotado (1.º al 5.º)</dt><dd>🪙 ${campana.premioJefe(1).monedas}–${campana.premioJefe(5).monedas}</dd></div>
                <div><dt>Jefes en Partida+</dt><dd>🪙 Más cada ronda</dd></div>
                <div><dt>Cofre del desafío semanal</dt><dd>🪙 ${desafios.COFRE.monedas}</dd></div>
                <div><dt>Minijuegos</dt><dd>🪙 hasta ${arcade.MAX_MONEDAS}</dd></div>
                <div><dt>Logros</dt><dd>Tú decides</dd></div>
            </dl>
        </section>`;
}
