// vistas-diario.js — El diario: la pregunta del día, el calendario de ánimo, el libro, las cartas y la revisión de la semana.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as diario from "./diario.js";
import * as libro from "./libro.js";
import * as saga from "./saga.js";
import { resumenSemana } from "./resumen.js";
import * as resumen from "./resumen.js";
import * as gymReglas from "./gym.js";
import { fechaLegible, fechaCorta, DIAS_LETRAS, diasEntre, sumarDias, MESES } from "./fechas.js";
import { esc, ficha, NOMBRE_DIA, vacio, ICONOS, textoCambio } from "./vistas-comun.js";

const { ATRIBUTOS, ANIMOS_DIARIO, plural } = juego;

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

const coma = (numero) => String(numero).replace(".", ",");
   // 4.2 → "4,2"

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
        ${seccionQueTeHaceBien(estado)}
        ${seccionCartas(estado, ctx)}

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
// (v106) Qué te hace bien: tu ánimo los días con cada etiqueta, frente a los demás.
function seccionQueTeHaceBien(estado) {
    const lista = diario.queTeHaceBien(estado);
    const titulo = '<h2 class="titulo-juego">🌱 Qué te hace bien</h2>';
    if (!lista.length) {
        return `<section class="panel">${titulo}<p class="nota">Marca en tu diario <b>qué hiciste</b> cada día (ejercicio, estudio, familia…)
            y cómo te fue. Con 3 días de una misma etiqueta, aquí verás cuáles te suben el ánimo.</p></section>`;
    }
    const filas = lista.map((x) => {
        const e = diario.ETIQUETAS[x.clave];
        const signo = x.diferencia > 0 ? "sube" : x.diferencia < 0 ? "baja" : "igual";
        const ancho = Math.min(100, Math.abs(x.diferencia) * 40);
        return `<li class="bien-fila ${signo}">
                    <span>${e.icono} <b>${e.nombre}</b> <small class="texto-suave">${plural(x.dias, "día", "días")}</small></span>
                    <span class="bien-barra"><i style="width: ${ancho}%"></i></span>
                    <small>${x.diferencia > 0 ? "+" : ""}${coma(x.diferencia)}</small>
                </li>`;
    }).join("");
    const mejor = lista[0];
    return `<section class="panel">${titulo}
        ${mejor.diferencia > 0 ? `<p class="nota">Los días de <b>${diario.ETIQUETAS[mejor.clave].nombre.toLowerCase()}</b> te sientes mejor que el resto. Vale la pena repetirlo.</p>` : ""}
        <ul class="bien-lista">${filas}</ul>
        <p class="mini texto-suave">La cifra es cuánto cambia tu ánimo (de 1 a 5) esos días, frente a los demás.</p>
    </section>`;
}


// (v106) Cartas a tu yo futuro: escribirlas, las selladas y las que ya se pueden leer.
function seccionCartas(estado, ctx) {
    const cartas = [...(estado.cartas || [])].sort((a, b) => a.abrir.localeCompare(b.abrir));
    const fila = (c) => {
        if (c.abiertaEn) return `<li class="carta abierta"><p class="mini texto-suave">✉️ Escrita el ${fechaLegible(c.escrita)}</p><p class="carta-texto">${esc(c.texto)}</p></li>`;
        if (c.abrir <= ctx.hoy) return `<li class="carta lista"><span>✉️ <b>Carta del ${fechaLegible(c.escrita)}</b><small>¡Ya se puede abrir!</small></span>
                <button type="button" class="boton boton-chico boton-oro" data-accion="abrir-carta" data-id="${c.id}">Abrir</button></li>`;
        return `<li class="carta sellada"><span>🔒 <b>Sellada</b><small>Se abre el ${fechaLegible(c.abrir)} · faltan ${plural(diasEntre(ctx.hoy, c.abrir), "día", "días")}</small></span></li>`;
    };
    return `
        <section class="panel">
            <h2 class="titulo-juego">✉️ Cartas a tu yo futuro</h2>
            <p class="nota">Escríbete una carta: qué esperas, qué te preocupa, qué quieres recordar. Queda <b>sellada</b> hasta el día que elijas.</p>
            <form data-form="carta" class="formulario">
                <textarea name="texto" rows="3" maxlength="${diario.LARGO_CARTA}" required placeholder="Querido yo del futuro…"></textarea>
                <div class="form-linea">
                    <select name="dias" aria-label="Cuándo se abre">${diario.PLAZOS_CARTA.map((d) => `<option value="${d}">Abrir en ${d === 365 ? "1 año" : d >= 30 ? `${Math.round(d / 30)} ${d >= 60 ? "meses" : "mes"}` : `${d} días`}</option>`).join("")}</select>
                    <button type="submit" class="boton boton-chico boton-oro">Sellar</button>
                </div>
            </form>
            ${cartas.length ? `<ul class="lista cartas">${cartas.map(fila).join("")}</ul>` : ""}
        </section>`;
}


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
export function tarjetaSemana(estado, ctx) {
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
            (pista.motivo ? `. Motivo más repetido: ${pista.motivo.icono} ${esc(pista.motivo.nombre)}` : "") +
            (pista.horaTipica !== null ? `. Cuando la cumples, suele ser hacia las ${pista.horaTipica} h` : "") + `.</p>` +
            // (v149) Un cambio concreto, con un botón para aplicarlo. El texto sale de resumen.sugerirCambio (sin datos del usuario).
            (pista.sugerencia ? `
        <div class="sugerencia">
            <p class="nota">🛠️ ${pista.sugerencia.texto}</p>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="aplicar-sugerencia" data-id="${pista.misionId}" data-lunes="${lunes}">${pista.sugerencia.boton}</button>
        </div>` : "") : ""}
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
export function tarjetaFoco(estado, ctx) {
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
