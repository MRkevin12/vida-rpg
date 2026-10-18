// vistas-hoy.js — La pantalla Hoy: misiones, tareas, el panel del día (cofre, relámpago, maestro, desafío), la tarjeta
// del héroe y los avisos de arriba. También los rituales y el golpe al jefe que se abren desde Hoy.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import * as desafios from "./desafios.js";
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as libro from "./libro.js";
import * as maestro from "./maestro.js";
import * as pergamino from "./pergamino.js";
import * as rituales from "./rituales.js";
import { retratoPixel, figuraPixel, dioramaPixel, pixelarEnVivo } from "./retratos.js";
import { icono } from "./iconos.js";
import { tarjetaGymHoy } from "./vistas-gym.js";
import { tarjetaRunningHoy } from "./vistas-running.js";   // (v110) la tarjeta del running en Hoy
import { tarjetaFinanzasHoy } from "./vistas-finanzas.js";   // (v135) la tarjeta de Finanzas, debajo de la del running
import { fechaLegible, fechaCorta, DIAS_LETRAS, DIAS_CORTOS, diaDeSemana, diasEntre, lunesDe, relojTexto,
         relojLargo, sumarDias, hoy as fechaDeHoy } from "./fechas.js";
import { agruparPorAtributo, vacio, plegable, esc, ICONOS, barra, botonEditar, ficha, cabeceraSeccion,
         textoAnimo, notaJefeEsperando } from "./vistas-comun.js";
import { tarjetaSemana, tarjetaFoco } from "./vistas-diario.js";
import { seccionPrincipales, retratoJefe } from "./vistas-aventuras.js";
import { sagaDe, lineaDeSaga, lineaDelPacto, lineaDeVoces } from "./vistas-historia.js";

const { DIFICULTADES, ATRIBUTOS, ESCUDOS, ANIMOS_DIARIO, plural } = juego;

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
        // Aurelio: tu héroe, tus rivales y «Tu día». Solo fuera del modo esencial; la ÚLTIMA pestaña.
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
            ${esAyer ? "" : panelDelDia(estado, ctx)}
            ${tarjetaHeroe(estado, ctx, { conRivales: false })}
            ${resumenRivales(estado, ctx)}
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
        ${esAyer || esencial ? "" : tarjetaRunningHoy(estado, ctx)}
        ${esAyer || esencial ? "" : tarjetaFinanzasHoy(estado, ctx)}
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
                   pactoSobra ? "" : lineaDelPacto(estado, ctx), lineaDeVoces(estado, ctx), tarjetaDesafio(estado, ctx)]
        .filter(Boolean);
    return `
        <section class="panel panel-dia" aria-label="Tu día">
            ${tarjetaMaestro(ctx)}
            ${filas.map((fila) => `<div class="dia-fila">${fila}</div>`).join("")}
        </section>`;
}


// Cada cuánto toca: "3 veces por semana", "El 5 de cada mes", "L · X · V" o "Todos los días".
export function textoFrecuencia(mision) {
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
    const alarma = tarea.aviso ? ` · ⏰ ${tarea.aviso}` : "";
    if (dias === 0) return `Vence hoy${alarma}`;
    if (dias === 1) return `Vence mañana${alarma}`;
    return `Vence el ${DIAS_CORTOS[diaDeSemana(tarea.fecha)]} ${fechaCorta(tarea.fecha)}${alarma}`;
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
                <!-- (v106) Energía y lo que hiciste: se guardan con un toque (sin escribir nada). -->
                <fieldset class="energia"><legend>⚡ Tu energía</legend>
                    ${diario.ENERGIA.map((nombre, i) => `<label class="energia-paso" title="${nombre}">
                        <input type="radio" name="energia" value="${i + 1}" ${entrada?.energia === i + 1 ? "checked" : ""}>
                        <span>⚡${i + 1}</span></label>`).join("")}
                    <small class="texto-suave">${entrada?.energia ? diario.ENERGIA[entrada.energia - 1] : "Toca para marcarla"}</small>
                </fieldset>
                <fieldset class="etiquetas-diario"><legend>¿Qué hiciste ${esAyer ? "ayer" : "hoy"}?</legend>
                    ${Object.entries(diario.ETIQUETAS).map(([clave, e]) => `<label class="etiqueta-diario">
                        <input type="checkbox" name="etiquetas" value="${clave}" ${entrada?.etiquetas?.includes(clave) ? "checked" : ""}>
                        <span>${e.icono} ${e.nombre}</span></label>`).join("")}
                </fieldset>
                <input type="hidden" name="salto" value="${ctx.saltoPregunta || 0}">
                <!-- Lo escrito va plegado para que Hoy no sea tan largo: se abre al tocarlo. -->
                <details class="diario-escribir" ${ctx.saltoPregunta ? "open" : ""}>
                    <summary>${entrada?.texto
                        ? `✍️ «${esc(entrada.texto.length > 60 ? `${entrada.texto.slice(0, 60)}…` : entrada.texto)}»`
                        : `✍️ ${esc(diario.preguntaConSalto(fecha, ctx.saltoPregunta))}`}</summary>
                    <p class="pregunta-diario"><b>${esc(entrada?.texto && entrada.pregunta && !ctx.saltoPregunta ? entrada.pregunta : diario.preguntaConSalto(fecha, ctx.saltoPregunta))}</b>
                        <button type="button" class="chip" data-accion="diario-otra-pregunta">🎲 Otra pregunta</button></p>
                    <label><span class="solo-lectores">Tu respuesta</span>
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
            ${diario.cartasListas(estado, ctx.hoy).length ? `<button type="button" class="pacto-linea carta-lista" data-accion="ir" data-pantalla="diario">
                <span class="pacto-linea-icono" aria-hidden="true">✉️</span><span><b>Tienes una carta de tu pasado</b>
                <span class="mini">Ya se puede abrir. Está en tu diario.</span></span></button>` : ""}
        </section>`;
}



// ===== El Maestro, el evento del día, el cofre y el relámpago (en Hoy) =====

// Lo que dice el Maestro en medio de otra pantalla (el diario, el ritual): su cara pequeña y la frase.
function palabrasDelMaestro(texto) {
    return `
        <div class="maestro-dice">
            <span class="maestro-dice-retrato" aria-hidden="true">${retratoPixel(maestro.describirMaestro())}</span>
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
            <div class="maestro-retrato" aria-hidden="true">${retratoPixel(maestro.describirMaestro())}</div>
            <div class="maestro-habla">
                <span class="etiqueta">${maestro.NOMBRE}</span>
                <p class="maestro-texto">${esc(maestro.saludo(c))}</p>
                <div class="maestro-botones">${botones.join("")}</div>
            </div>
        </section>`;
}


export function avisoEvento(ctx) {
    const e = ctx.evento;
    if (!e) return "";
    return `<div class="evento-dia"><span class="evento-icono" aria-hidden="true">${e.icono}</span>
                <span><span class="etiqueta">Evento del día</span><b>${e.nombre}</b> · ${e.texto}</span></div>`;
}


// El cofre de madera (se abre con una animación: ver estilos.css).
function dibujoCofre() {
    return pixelarEnVivo(`
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
        </svg>`, 2.5);   // (v96) en pixel art: 48 puntos de ancho
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
        <div class="maestro-dialogo-retrato" aria-hidden="true">${figuraPixel(maestro.describirMaestro())}</div>
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
                <span class="heroe-avatar">${dioramaPixel(a)}</span>
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
