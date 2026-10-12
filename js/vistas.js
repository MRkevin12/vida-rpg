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
import { dibujarAvatar, dibujarMascota, dibujarJefe } from "./dibujo.js";
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
        ${tarjetaHeroe(ctx)}

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
        </button>

        ${jefesEnCombate(estado)}`;
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
        <button type="button" class="heroe ${ctx.recienHecha ? "saltar" : ""}" data-accion="ir" data-pantalla="personaje">
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

// Datos para dibujar un jefe: vida, porcentaje, aspecto y estado (furioso, herido…).
function datosJefe(jefe) {
    const vida = juego.vidaRestante(jefe);
    const porcentaje = Math.round((vida / jefe.vidaMax) * 1000) / 10;
    const tipo = juego.monstruoDe(jefe);
    return { vida, porcentaje, tipo, monstruo: juego.MONSTRUOS[tipo], estado: juego.estadoDelJefe(porcentaje) };
}

const FRASES_JEFE = {
    furioso: "¡Está furioso!",
    herido: "Está herido…",
    agotado: "¡Está a punto de caer!",
    derrotado: "Derrotado",
};

function tarjetaJefe(jefe, ctx) {
    const { vida, porcentaje, tipo, monstruo, estado } = datosJefe(jefe);

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
                <div class="tarjeta-titulo">
                    ${chipAtributo(jefe.atributo)}
                    <h3>${esc(jefe.nombre)}</h3>
                </div>
                ${botonCerrar("archivar-jefe", jefe.id, `Archivar ${jefe.nombre}`)}
            </div>

            <!-- Escena de batalla: tu avatar contra el jefe -->
            <div class="escena">
                <div class="escena-heroe">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
                <span class="escena-vs">VS</span>
                <div class="escena-jefe">${dibujarJefe(tipo, estado)}</div>
                <span class="escena-nombre">${monstruo.icono} ${monstruo.nombre} · ${FRASES_JEFE[estado]}</span>
            </div>

            ${barra(porcentaje, "barra-vida")}
            <p class="mini"><strong>HP ${vida} / ${jefe.vidaMax}</strong>
               <span class="texto-suave">· ${plural(jefe.golpes.length, "golpe", "golpes")}</span></p>
            ${controles}
        </article>`;
}

// En "Hoy": los jefes que estás enfrentando, para tenerlos siempre a la vista.
function jefesEnCombate(estado) {
    const vivos = estado.jefes.filter((j) => !j.archivado && !j.derrotadoEn);
    if (!vivos.length) return "";
    const filas = vivos.map((jefe) => {
        const { vida, porcentaje, tipo, estado: animo } = datosJefe(jefe);
        return `
            <li>
                <button type="button" class="combate" data-accion="ir" data-pantalla="aventuras">
                    <span class="combate-jefe">${dibujarJefe(tipo, animo, { mini: true })}</span>
                    <span class="combate-info">
                        <b>${esc(jefe.nombre)}</b>
                        ${barra(porcentaje, "barra-vida barra-mini")}
                        <span class="mini texto-suave">HP ${vida} / ${jefe.vidaMax}</span>
                    </span>
                    <span class="combate-ir" aria-hidden="true">⚔️</span>
                </button>
            </li>`;
    }).join("");
    return `<h3 class="subtitulo">⚔️ En combate</h3><ul class="lista">${filas}</ul>`;
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
            ${botonCerrar("borrar-logro", logro.id, `Borrar ${logro.nombre}`)}
        </li>`;
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

function seccionEquipamiento(estado, ctx) {
    const a = ctx.avatar;
    const disponibles = avatar.objetosDisponibles(estado, ctx.info);

    const espacios = Object.entries(avatar.ESPACIOS).map(([espacio, nombre]) => {
        const id = a.equipado[espacio];
        const objeto = id ? avatar.OBJETOS[id] : null;
        return `<div class="espacio ${objeto ? "lleno" : ""}">
                    <span class="espacio-icono">${objeto ? objeto.icono : "·"}</span>
                    <span class="mini texto-suave">${nombre}</span>
                    <span class="mini">${objeto ? esc(objeto.nombre) : "Vacío"}</span>
                </div>`;
    }).join("");

    const inventario = [...disponibles].map((id) => {
        const objeto = avatar.OBJETOS[id];
        const puesto = a.equipado[objeto.espacio] === id;
        return `<li class="objeto ${puesto ? "puesto" : ""}">
                    <span class="objeto-icono">${objeto.icono}</span>
                    <span class="objeto-info"><b>${objeto.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[objeto.espacio]}${objeto.logro ? " · 🏅 de logro" : ""}</span></span>
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
                    <span class="objeto-icono ${ganado ? "" : "bloqueado"}">${o.icono}</span>
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${o.logro.texto}</span>
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
                    <span class="objeto-icono">${o.icono}</span>
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[o.espacio]} · 🪙 ${o.precio}</span></span>
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

        ${tiendaDelAvatar(estado)}
        ${seccionObjetosDeLogro(estado, ctx, "Objetos que no se venden")}

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
