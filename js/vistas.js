// vistas.js — Convierte la partida en HTML.
//
// Cada función recibe el estado y devuelve un texto con HTML.
// app.js pone ese texto dentro de la pantalla que corresponde.
// Aquí no se cambia nada de la partida: solo se "dibuja".
//
// Los botones llevan atributos data-accion="..." y data-id="...".
// app.js escucha los toques y, según data-accion, sabe qué hacer.

import * as juego from "./juego.js";
import { fechaLegible, fechaCorta, MESES_CORTOS, desdeTexto } from "./fechas.js";

const { DIFICULTADES, ATRIBUTOS, PREMIOS, ESCUDOS, plural } = juego;


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

function botonCerrar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.cerrar}</button>`;
}


// ===== Pantalla: Hoy =====

export function pantallaHoy(estado, ctx) {
    const fecha = ctx.hoy;
    const racha = ctx.info.racha;
    const hechasHoy = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));
    const activas = estado.misiones.filter((m) => !m.archivadaEn);
    const hechas = activas.filter((m) => hechasHoy.has(m.id)).length;
    const todoListo = activas.length > 0 && hechas === activas.length;

    const lista = activas.length
        ? `<ul class="lista">${activas.map((m) => tarjetaMision(m, hechasHoy.has(m.id), ctx.recienHecha === m.id)).join("")}</ul>`
        : vacio("Aún no tienes misiones diarias.<br>Crea tu primer hábito: ir al gym, leer, estudiar inglés…");

    return `
        <div class="titulo-seccion">
            <div>
                <p class="etiqueta">${fechaLegible(fecha)}</p>
                <h2 class="titulo-juego">Misiones de hoy</h2>
            </div>
            <p class="contador ${todoListo ? "completo" : ""}">${hechas}/${activas.length}</p>
        </div>

        <div class="chips">
            <span class="chip chip-racha">🔥 ${plural(racha.actual, "día", "días")}</span>
            <span class="chip">🛡️ ${racha.escudos}/${ESCUDOS.maximo}</span>
            ${todoListo ? '<span class="chip chip-oro">✨ Día perfecto</span>' : ""}
        </div>

        ${ctx.recordarRespaldo ? avisoRespaldo() : ""}
        ${lista}

        <button type="button" class="boton boton-principal boton-ancho" data-accion="abrir" data-dialogo="mision">
            + Nueva misión diaria
        </button>`;
}

function tarjetaMision(mision, hecha, recienHecha) {
    const d = DIFICULTADES[mision.dificultad];
    const a = ATRIBUTOS[mision.atributo];
    const clases = ["mision", `dificultad-${mision.dificultad}`, hecha ? "hecha" : "", recienHecha ? "recien-hecha" : ""];
    return `
        <li class="${clases.join(" ")}" data-id="${mision.id}">
            <button type="button" class="boton-check" data-accion="alternar-mision" data-id="${mision.id}"
                    aria-pressed="${hecha}" aria-label="Marcar ${esc(mision.nombre)}">${ICONOS.check}</button>
            <div class="mision-info">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${a.icono} ${a.nombre} · ${d.nombre} · +${d.xp} XP</span>
            </div>
            ${botonCerrar("archivar-mision", mision.id, `Archivar ${mision.nombre}`)}
        </li>`;
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
    const total = juego.misionesActivasEn(estado.misiones, fecha);
    const nombres = hechas.map((c) => {
        const mision = estado.misiones.find((m) => m.id === c.misionId);
        return esc(mision ? mision.nombre : "misión borrada");
    });
    const protegido = racha.protegidos.has(fecha) ? " · 🛡️ protegido por un escudo" : "";

    return `<strong>${fechaLegible(fecha)}</strong>: ${hechas.length} de ${total}${protegido}` +
           (nombres.length ? `<br><span class="texto-suave">${nombres.join(" · ")}</span>` : "");
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


// ===== Pantalla: Aventuras (misiones principales y jefes) =====

const RETRATOS_JEFE = ["🐉", "👹", "🦂", "🐙", "👾", "🦖", "🧟", "🐺"];

export function pantallaAventuras(estado, ctx) {
    const principales = estado.principales.filter((p) => !p.archivada);
    const enCurso = principales.filter((p) => !p.completadaEn);
    const terminadas = principales.filter((p) => p.completadaEn);

    const jefes = estado.jefes.filter((j) => !j.archivado);
    const vivos = jefes.filter((j) => !j.derrotadoEn);
    const derrotados = jefes.filter((j) => j.derrotadoEn);

    return `
        ${cabeceraSeccion("Misiones principales", "principal", "+ Nueva")}
        <p class="nota">Objetivos grandes divididos en pasos. Cada paso: +${PREMIOS.submision.xp} XP.
           Al terminar todos: +${PREMIOS.principal.xp} XP y ${PREMIOS.principal.monedas} monedas.</p>
        ${enCurso.length ? enCurso.map(tarjetaPrincipal).join("") : vacio("Sin misiones principales en curso. Ej: «Aprender inglés B1» o «Terminar CS50».")}
        ${plegable(`Completadas (${terminadas.length})`, terminadas.map(tarjetaPrincipal).join(""), terminadas.length)}

        ${cabeceraSeccion("Jefes", "jefe", "+ Nuevo")}
        <p class="nota">Metas difíciles con barra de vida. Cada avance le quita vida (+${PREMIOS.golpe.xp} XP).
           Derrotarlo: +${PREMIOS.jefe.xp} XP y ${PREMIOS.jefe.monedas} monedas.</p>
        ${vivos.length ? vivos.map((j) => tarjetaJefe(j, ctx)).join("") : vacio("No hay jefes a la vista. Ej: «Leer 12 libros» con 12 de vida.")}
        ${plegable(`Derrotados (${derrotados.length})`, derrotados.map((j) => tarjetaJefe(j, ctx)).join(""), derrotados.length)}`;
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

function tarjetaJefe(jefe, ctx) {
    const vida = juego.vidaRestante(jefe);
    const porcentaje = Math.round((vida / jefe.vidaMax) * 1000) / 10;
    const retrato = RETRATOS_JEFE[jefe.id % RETRATOS_JEFE.length];

    const controles = jefe.derrotadoEn
        ? `<p class="sello">☠️ Derrotado el ${fechaCorta(jefe.derrotadoEn)}</p>`
        : `<form class="form-linea" data-form="atacar" data-id="${jefe.id}">
               <input type="number" name="dano" min="1" step="1" value="1" inputmode="numeric" required aria-label="Daño del golpe">
               <button type="submit" class="boton boton-peligro">⚔️ Atacar</button>
           </form>
           ${jefe.golpes.length ? `<button type="button" class="enlace" data-accion="deshacer-golpe" data-id="${jefe.id}">Deshacer último golpe</button>` : ""}`;

    return `
        <article class="panel tarjeta jefe ${jefe.derrotadoEn ? "derrotado" : ""} ${ctx.golpeado === jefe.id ? "golpeado" : ""}" data-id="${jefe.id}">
            <div class="tarjeta-cabecera">
                <span class="jefe-retrato" aria-hidden="true">${retrato}</span>
                <div class="tarjeta-titulo">
                    ${chipAtributo(jefe.atributo)}
                    <h3>${esc(jefe.nombre)}</h3>
                </div>
                ${botonCerrar("archivar-jefe", jefe.id, `Archivar ${jefe.nombre}`)}
            </div>
            ${barra(porcentaje, "barra-vida")}
            <p class="mini"><strong>HP ${vida} / ${jefe.vidaMax}</strong>
               <span class="texto-suave">· ${plural(jefe.golpes.length, "golpe", "golpes")}</span></p>
            ${controles}
        </article>`;
}


// ===== Pantalla: Logros =====

export function pantallaLogros(estado, ctx) {
    const desbloqueados = estado.logros.filter((l) => l.desbloqueadoEn).length;
    // Primero los bloqueados (los que estás persiguiendo), luego los ganados.
    const ordenados = [...estado.logros].sort((a, b) => Boolean(a.desbloqueadoEn) - Boolean(b.desbloqueadoEn));

    return `
        ${cabeceraSeccion("Logros", "logro", "+ Nuevo")}
        <p class="nota">Tú decides la condición. Ej: «30 días de gym» = completar la misión «Ir al gym» 30 veces.
           ${estado.logros.length ? `<strong>${desbloqueados} de ${estado.logros.length} desbloqueados.</strong>` : ""}</p>
        ${ordenados.length
            ? `<ul class="lista">${ordenados.map((l) => tarjetaLogro(l, estado, ctx)).join("")}</ul>`
            : vacio("Todavía no has creado logros. Crea el primero y ponle una recompensa en monedas.")}`;
}

function tarjetaLogro(logro, estado, ctx) {
    const progreso = Math.min(juego.progresoLogro(logro, estado, ctx.info), logro.objetivo);
    const estadoLogro = logro.desbloqueadoEn
        ? `<p class="mini oro">Desbloqueado el ${fechaCorta(logro.desbloqueadoEn)}</p>`
        : `${barra(Math.round((progreso / logro.objetivo) * 100), "barra-mini")}
           <p class="mini texto-suave">${progreso} / ${logro.objetivo}</p>`;

    return `
        <li class="logro ${logro.desbloqueadoEn ? "desbloqueado" : ""}">
            <span class="logro-icono" aria-hidden="true">${logro.desbloqueadoEn ? "🏆" : "🔒"}</span>
            <div class="logro-info">
                <h3>${esc(logro.nombre)}</h3>
                <p class="mini">${esc(juego.describirLogro(logro, estado))}</p>
                ${estadoLogro}
            </div>
            <span class="logro-premio">🪙 ${logro.recompensa}</span>
            ${botonCerrar("borrar-logro", logro.id, `Borrar ${logro.nombre}`)}
        </li>`;
}


// ===== Pantalla: Tienda =====

export function pantallaTienda(estado) {
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
                ${botonCerrar("borrar-recompensa", r.id, `Borrar ${r.nombre}`)}
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

        ${canjes.length ? `<section class="panel"><h2 class="titulo-juego">Historial</h2><ul class="historial">${historial}</ul></section>` : ""}

        <section class="panel">
            <h2 class="titulo-juego">Cómo ganar monedas</h2>
            <dl class="estadisticas">
                ${Object.values(DIFICULTADES).map((d) => `<div><dt>Misión ${d.nombre.toLowerCase()}</dt><dd>🪙 ${d.monedas}</dd></div>`).join("")}
                <div><dt>Paso de misión principal</dt><dd>🪙 ${PREMIOS.submision.monedas}</dd></div>
                <div><dt>Misión principal completa</dt><dd>🪙 ${PREMIOS.principal.monedas}</dd></div>
                <div><dt>Golpe a un jefe</dt><dd>🪙 ${PREMIOS.golpe.monedas}</dd></div>
                <div><dt>Jefe derrotado</dt><dd>🪙 ${PREMIOS.jefe.monedas}</dd></div>
                <div><dt>Logros</dt><dd>Tú decides</dd></div>
            </dl>
        </section>`;
}
