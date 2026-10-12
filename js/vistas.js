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
import { dibujarAvatar, dibujarMascota, dibujarObjeto, dibujarEscenario } from "./dibujo.js";
import { calcularResumen, resumenSemana } from "./resumen.js";
import { fechaLegible, fechaCorta, MESES_CORTOS, DIAS_LETRAS, DIAS_CORTOS, desdeTexto, diaDeSemana,
         diasEntre, lunesDe, relojTexto } from "./fechas.js";

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

function chipAtributo(clave) {
    const a = ATRIBUTOS[clave];
    return `<span class="chip-atributo" style="--color-atributo: ${a.color}">${a.icono} ${a.nombre}</span>`;
}

function botonEditar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.editar}</button>`;
}

function botonCerrar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.cerrar}</button>`;
}

// Píldoras para elegir un atributo dentro de un formulario (como las de las ventanas).
function pildorasAtributo(elegido) {
    return Object.entries(ATRIBUTOS).map(([clave, a]) => `
        <label class="pildora" style="--color-dificultad: ${a.color}">
            <input type="radio" name="atributo" value="${clave}" ${clave === elegido ? "checked" : ""}>
            <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
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
        lista = `<ul class="lista">${delDia.map(tarjeta).join("")}</ul>`;
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
        ${tarjetaHeroe(ctx)}

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

        <button type="button" class="boton boton-principal boton-ancho" data-accion="abrir" data-dialogo="mision">
            + Nueva misión diaria
        </button>

        ${plegable(`Otros días (${otrosDias.length})`,
            `<ul class="lista">${otrosDias.map((m) => filaMision(m, "editar")).join("")}</ul>`, otrosDias.length)}
        ${plegable(`Archivadas (${archivadas.length})`,
            `<ul class="lista">${archivadas.map((m) => filaMision(m, "restaurar")).join("")}</ul>`, archivadas.length)}

        ${esAyer ? "" : seccionTareas(estado, ctx)}
        ${tarjetaDesafio(estado, ctx)}
        ${seccionDiario(estado, fecha, esAyer)}
        ${jefesEnCombate(estado, ctx)}`;
}

// Cada cuánto toca: "3 veces por semana", "L · X · V" o "Todos los días".
function textoFrecuencia(mision) {
    if (mision.veces) return `${plural(mision.veces, "vez", "veces")} por semana`;
    return mision.dias ? mision.dias.map((d) => DIAS_LETRAS[d]).join(" · ") : "Todos los días";
}

// conFrecuencia: en la lista de hoy no hace falta repetir "Todos los días".
function detalleMision(mision, conFrecuencia = Boolean(mision.dias)) {
    const d = DIFICULTADES[mision.dificultad];
    const a = ATRIBUTOS[mision.atributo];
    return `${a.icono} ${a.nombre} · ${d.nombre} · +${d.xp} XP${conFrecuencia ? ` · ${textoFrecuencia(mision)}` : ""}`;
}

function tarjetaMision(mision, estado, fecha, hecha, recienHecha) {
    const clases = ["mision", `dificultad-${mision.dificultad}`, hecha ? "hecha" : "", recienHecha ? "recien-hecha" : ""];
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

    return `
        <li class="${clases.join(" ")}" data-id="${mision.id}">
            ${boton}
            <div class="mision-info">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(mision)}</span>
                ${extra}
            </div>
            ${botonEditar("editar-mision", mision.id, `Editar ${mision.nombre}`)}
        </li>`;
}

// Misión que no se puede marcar ahora (toca otro día, o está archivada).
function filaMision(mision, accion) {
    const boton = accion === "restaurar"
        ? `<button type="button" class="boton boton-chico" data-accion="restaurar-mision" data-id="${mision.id}">Restaurar</button>`
        : botonEditar("editar-mision", mision.id, `Editar ${mision.nombre}`);
    const meta = mision.meta ? ` · Meta: ${mision.meta.cantidad} ${esc(mision.meta.unidad)}` : "";
    return `
        <li class="mision apagada dificultad-${mision.dificultad}">
            <div class="mision-info">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(mision, true)}${meta}</span>
            </div>
            ${boton}
        </li>`;
}


// ===== Hoy: tareas sueltas =====

function seccionTareas(estado, ctx) {
    const porFecha = (a, b) => a.fecha.localeCompare(b.fecha);
    const pendientes = estado.tareas.filter((t) => !t.hechaEn);
    // En la lista principal: las que vencen hoy o ya vencieron, y las que hiciste hoy.
    const paraHoy = [
        ...pendientes.filter((t) => t.fecha <= ctx.hoy).sort(porFecha),
        ...estado.tareas.filter((t) => t.hechaEn === ctx.hoy),
    ];
    const proximas = pendientes.filter((t) => t.fecha > ctx.hoy).sort(porFecha);
    const anteriores = estado.tareas.filter((t) => t.hechaEn && t.hechaEn < ctx.hoy)
        .sort((a, b) => b.hechaEn.localeCompare(a.hechaEn)).slice(0, 15);   // las 15 más recientes
    const lista = (tareas) => `<ul class="lista">${tareas.map((t) => tarjetaTarea(t, ctx)).join("")}</ul>`;

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

function tarjetaTarea(tarea, ctx) {
    const hecha = Boolean(tarea.hechaEn);
    const d = DIFICULTADES[tarea.dificultad];
    const a = ATRIBUTOS[tarea.atributo];
    const clases = ["mision", "tarea", `dificultad-${tarea.dificultad}`, hecha ? "hecha" : "", ctx.recienTarea === tarea.id ? "recien-hecha" : ""];
    return `
        <li class="${clases.join(" ")}" data-tarea="${tarea.id}">
            <button type="button" class="boton-check" data-accion="alternar-tarea" data-id="${tarea.id}"
                    aria-pressed="${hecha}" aria-label="Marcar ${esc(tarea.nombre)}">${ICONOS.check}</button>
            <div class="mision-info">
                <span class="mision-nombre">${esc(tarea.nombre)}</span>
                <span class="mision-detalle">${a.icono} ${a.nombre} · ${d.nombre} · +${d.xp} XP · ${cuandoVence(tarea, ctx.hoy)}</span>
            </div>
            ${botonEditar("editar-tarea", tarea.id, `Editar ${tarea.nombre}`)}
        </li>`;
}

// "Vence hoy", "Vence mañana", "Vence el vie 16 oct", "Atrasada"…
function cuandoVence(tarea, hoy) {
    if (tarea.hechaEn) return tarea.hechaEn === hoy ? "Hecha hoy" : `Hecha el ${fechaCorta(tarea.hechaEn)}`;
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

function seccionDiario(estado, fecha, esAyer) {
    const entrada = estado.diario[fecha];
    const animos = Object.entries(ANIMOS_DIARIO).map(([clave, a]) => `
        <label class="pildora">
            <input type="radio" name="animo" value="${clave}" ${entrada?.animo === clave ? "checked" : ""}>
            <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
        </label>`).join("");
    return `
        <section class="panel diario">
            <h2 class="titulo-juego">📓 Diario</h2>
            <p class="nota">¿Cómo te fue ${esAyer ? "ayer" : "hoy"}? Una frase basta. Lo verás al tocar el día en el calendario.</p>
            <form data-form="diario" class="formulario">
                <input type="hidden" name="fecha" value="${fecha}">
                <fieldset class="opciones" aria-label="Cómo te fue">${animos}</fieldset>
                <div class="form-linea">
                    <input type="text" name="texto" maxlength="140" autocomplete="off" value="${esc(entrada?.texto || "")}"
                           placeholder="Ej: Terminé el problem set 3" aria-label="Tu frase del día">
                    <button type="submit" class="boton boton-chico">${entrada ? "Actualizar" : "Guardar"}</button>
                </div>
            </form>
        </section>`;
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
    return `${animo.icono} ${animo.texto}`;
}

// Tarjeta del héroe arriba de "Hoy". Salta cuando completas una misión.
function tarjetaHeroe(ctx) {
    const a = ctx.avatar;
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS, a.etapa);
    return `
        <button type="button" class="heroe ${ctx.recienHecha ? "atacar" : ""}" data-accion="ir" data-pantalla="personaje">
            <span class="heroe-avatar">${dibujarAvatar(a)}</span>
            <span class="heroe-info">
                <span class="etiqueta">${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</span>
                <span class="heroe-animo">${textoAnimo(a, ctx)}</span>
                <span class="mini texto-suave">${siguiente
                    ? `Evoluciona a ${siguiente.nombre} en el nivel ${siguiente.desde}`
                    : "¡Etapa máxima alcanzada!"}</span>
                <span class="mini heroe-ver">Ver personaje ›</span>
            </span>
        </button>`;
}

function avisoRespaldo() {
    return `
        <div class="aviso-respaldo">
            <span>💾 Tus datos viven solo en este teléfono. Haz una copia de seguridad.</span>
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
            </div>
            <p class="cal-detalle" id="cal-detalle">${detalleDia(estado, ctx.diaSeleccionado, racha)}</p>
        </section>

        <section class="panel">
            <h2 class="titulo-juego">Atributos</h2>
            <div class="atributos">${Object.keys(ATRIBUTOS).map((clave) => tarjetaAtributo(estado, clave)).join("")}</div>
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
    const protegido = racha.protegidos.has(fecha) ? " · 🛡️ protegido por un escudo" : "";
    const tareas = estado.tareas.filter((t) => t.hechaEn === fecha).map((t) => esc(t.nombre));
    const minutos = estado.enfoque.sesiones.filter((s) => s.fecha === fecha).reduce((suma, s) => suma + s.minutos, 0);
    const diario = estado.diario[fecha];

    let texto = `<strong>${fechaLegible(fecha)}</strong>: ${cumplidas} de ${total}${protegido}`;
    if (nombres.length) texto += `<br><span class="texto-suave">${nombres.join(" · ")}</span>`;
    if (tareas.length) texto += `<br><span class="texto-suave">📌 ${tareas.join(" · ")}</span>`;
    if (minutos) texto += `<br><span class="texto-suave">⏱️ ${minutos} min de enfoque</span>`;
    if (diario) {
        const icono = diario.animo ? ANIMOS_DIARIO[diario.animo].icono : "📓";
        texto += `<br>${icono} ${diario.texto ? `«${esc(diario.texto)}»` : ""}`;
    }
    return texto;
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
        ${enCurso.length ? enCurso.map(tarjetaPrincipal).join("") : vacio("Sin misiones principales en curso. Ej: «Aprender inglés B1» o «Terminar CS50».")}
        ${plegable(`Completadas (${terminadas.length})`, terminadas.map(tarjetaPrincipal).join(""), terminadas.length)}
        ${plegable(`Archivadas (${archivadas.length})`, `<ul class="lista">${filasArchivadas}</ul>`, archivadas.length)}`;
}

// <details> es una sección que se abre y se cierra sola (sin JavaScript).
function plegable(titulo, contenido, cantidad) {
    if (!cantidad) return "";
    return `<details class="plegable"><summary>${titulo}</summary>${contenido}</details>`;
}

function tarjetaPrincipal(p) {
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
                    ${chipAtributo(p.atributo)}
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
    const fichas = arcade.fichasDisponibles(estado);
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
                        ${fichas ? "" : "disabled"}>Jugar · 🎟️ 1 ficha</button>
            </article>`;
    }).join("");

    return `
        <section class="panel arcade-cabecera">
            <div class="arcade-heroe">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
            <div>
                <h2 class="titulo-juego">Arcade del héroe</h2>
                <p class="fichas">🎟️ ${plural(fichas, "ficha", "fichas")}</p>
                <p class="nota">Ganas <b>1 ficha</b> por cada misión diaria completada. Cada partida da monedas y XP
                   según tus puntos (máx. ${arcade.MAX_MONEDAS} 🪙 y ${arcade.MAX_XP} XP).</p>
            </div>
        </section>
        ${fichas ? "" : vacio("Sin fichas por ahora. Completa una misión diaria y vuelve a jugar.")}
        ${tarjetas}`;
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
        const a = ATRIBUTOS[activo.atributo];
        principal = `
            <section class="panel enfoque-activo" style="--color-atributo: ${a.color}">
                <p class="etiqueta">Enfocado en ${a.icono} ${a.nombre}</p>
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
                    <fieldset class="opciones opciones-4"><legend>¿En qué te vas a enfocar?</legend>${pildorasAtributo("intelecto")}</fieldset>
                    <button type="submit" class="boton boton-principal">Empezar</button>
                </form>
            </section>`;
    }

    const historial = recientes.map((s) => {
        const a = ATRIBUTOS[s.atributo];
        return `<li><span>${a.icono} ${s.minutos} min de ${a.nombre}</span><span class="texto-suave">${fechaCorta(s.fecha)} · +${s.xp} XP</span></li>`;
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

    return `
        <p class="nota">✅ Activadas en este teléfono. Tus recordatorios:</p>
        ${filas ? `<ul class="horarios">${filas}</ul>` : vacio("Sin recordatorios. Agrega uno abajo.")}
        <form data-form="horario" class="horario-nuevo">
            <div class="form-linea">
                <input type="time" name="hora" value="20:00" required aria-label="Hora del recordatorio">
                <button type="submit" class="boton boton-chico">+ Agregar</button>
            </div>
            <fieldset class="opciones opciones-7" aria-label="Días del recordatorio">${dias}</fieldset>
        </form>
        <label class="interruptor">
            <span><b>⏱️ Fin del enfoque</b><br><span class="nota">Avisar cuando termine una sesión.</span></span>
            <input type="checkbox" data-accion="aviso-enfoque" ${estado.avisos.enfoque ? "checked" : ""}>
        </label>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="probar-avisos">Enviar prueba</button>
            <button type="button" class="boton boton-secundario" data-accion="desactivar-avisos">Desactivar</button>
        </div>`;
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


// Equipamiento que se compra con monedas (además de las recompensas reales).
function tiendaDelAvatar(estado) {
    const monedas = estado.personaje.monedas;
    const enVenta = Object.entries(avatar.OBJETOS)
        .filter(([, o]) => !o.logro)
        .sort(([, a], [, b]) => a.precio - b.precio);

    const lista = enVenta.map(([id, o]) => {
        const tuyo = estado.avatar.comprados.includes(id);
        const puede = monedas >= o.precio;
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
    const recompensas = [...estado.recompensas].sort((a, b) => a.costo - b.costo);
    const canjes = estado.canjes.slice(-15).reverse(); // los 15 más recientes

    const lista = recompensas.map((r) => {
        const puede = monedas >= r.costo;
        return `
            <li class="recompensa ${puede ? "alcanzable" : ""}">
                <div class="recompensa-info">
                    <h3>${esc(r.nombre)}</h3>
                    <span class="mini ${puede ? "oro" : "texto-suave"}">🪙 ${r.costo}${puede ? "" : ` · te faltan ${r.costo - monedas}`}</span>
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

        ${cabeceraSeccion("Recompensas", "recompensa", "+ Nueva")}
        <p class="nota">Premios reales que tú defines. Cánjealos cuando tengas monedas suficientes.</p>
        ${recompensas.length ? `<ul class="lista">${lista}</ul>` : vacio("Crea tu primera recompensa. Ej: «Ver un capítulo de mi serie» por 50 monedas.")}

        ${tiendaDelAvatar(estado)}
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
