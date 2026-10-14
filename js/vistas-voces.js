// vistas-voces.js — Las pantallas de «Las Voces del Valle» (v44): la aldea del día y la conversación.
//
// Como vistas.js, solo convierte la partida en HTML (texto). Los dibujos de las personas llegan un instante después:
// el HTML lleva <img data-persona="maren"> (cuerpo entero) o <img data-busto="maren"> (la cara) y app.js los rellena
// (ver pintarRetratosVoces). Todo el texto del usuario (su nombre) pasa por esc().

import * as voces from "./voces.js";
import { plural } from "./juego.js";
import { fichasDisponibles } from "./arcade.js";
import { esc } from "./vistas.js";
import { rutaPintura } from "./pinturas.js";
import { fechaCorta } from "./fechas.js";

// El texto de una conversación: escapa, pone en cursiva los gestos (_así_) y escribe el nombre de tu héroe en {n}.
export function formato(texto, nombre) {
    return esc(texto)
        .replace(/_(.+?)_/g, '<em class="voces-gesto">$1</em>')
        .replaceAll("{n}", esc(nombre));
}

const barra = (porcentaje, clase = "") => `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;

// ===== La aldea =====
// ctx = { hoy, vida (para saber si caíste en combate) }
export function pantallaVoces(estado, ctx) {
    const v = estado.voces;
    const caido = ctx.vida.caido;
    const nivel = voces.nivelDeCarisma(estado);
    const valor = voces.valorDe(estado, ctx.hoy);
    const prog = voces.progreso(estado);
    const fichas = fichasDisponibles(estado);
    const agenda = voces.agendaDelDia(estado, ctx.hoy);

    const tecnicas = Object.entries(voces.TECNICAS).map(([clave, t]) => nivel >= t.nivel
        ? `<li class="voces-tecnica sabida" title="${esc(t.texto)}"><span aria-hidden="true">${t.icono}</span> ${t.nombre}</li>`
        : `<li class="voces-tecnica"><span aria-hidden="true">🔒</span> ${t.nombre} <small>Carisma ${t.nivel}</small></li>`).join("");
    const pips = Array.from({ length: voces.MAX_VALOR }, (_, i) => `<i class="voces-pip ${i < valor ? "lleno" : ""}"></i>`).join("");

    const enCurso = v.escena ? voces.ESCENAS[v.escena.id] : null;
    const tarjetaEnCurso = enCurso ? `
        <section class="panel voces-encurso">
            <p class="etiqueta">💬 Conversación a medias</p>
            <h3>${esc(voces.PERSONAS[enCurso.persona].nombre)} · «${esc(enCurso.titulo)}»</h3>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="voces-hablar" data-escena="${v.escena.id}"
                    ${caido ? "disabled" : ""}>Seguir hablando</button>
        </section>` : "";

    // Solo se muestran los lugares donde hay alguien hoy.
    const conGente = agenda.filter((sitio) => sitio.personas.length);
    const lugares = conGente.map((sitio) => `
        <section class="panel voces-lugar" style="--pintura: url(${rutaPintura(sitio.lugar.fondo)})">
            <h3 class="voces-lugar-nombre">${sitio.lugar.icono} ${esc(sitio.lugar.nombre)}</h3>
            ${sitio.personas.map((p) => tarjetaPersona(estado, p, { caido, fichas })).join("")}
        </section>`).join("") + (conGente.length < agenda.length
        ? `<p class="nota voces-vacio">El resto de la aldea está en calma hoy: ${plural(agenda.length - conGente.length, "lugar sin nadie", "lugares sin nadie")}.</p>` : "");

    const hechas = Object.entries(v.hechas).sort((a, b) => b[1].fecha.localeCompare(a[1].fecha));
    const vividas = hechas.length ? `
        <section class="bloque" aria-label="Conversaciones vividas">
            <h2 class="titulo-juego">📖 Lo que ya se dijo</h2>
            <ul class="lista voces-vividas">${hechas.map(([id, h]) => filaVivida(estado, id, h, { hoy: ctx.hoy, caido, fichas })).join("")}</ul>
        </section>` : "";
    const epilogo = v.epilogo ? `
        <section class="panel voces-epilogo-tarjeta">
            <p class="etiqueta">🗣️ La aldea ya habló</p>
            <p class="nota">Recuperaste todas las voces del valle (${esc(fechaCorta(v.epilogo))}).</p>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="voces-epilogo">📜 Leer el epílogo</button>
        </section>` : "";

    return `
        <div class="titulo-seccion encabezado">
            <h2 class="titulo-juego">🗣️ Las Voces del Valle</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="aventuras">‹ Aventuras</button>
        </div>
        ${caido ? `<p class="nota oro">Caíste en combate: la aldea se abre cuando te recuperes.</p>` : ""}
        <section class="panel voces-intro">
            <p class="nota">Al pie de la Torre hay una aldea a la que la Sombra de la Voz le quitó la voz: nadie dice lo que de verdad
               siente. No se vence con una espada, sino ayudando a cada persona a decir lo que calla. Cada día, algunas están en su
               lugar. Hablar con alguien de verdad cuesta <b>🎟️ 1 ficha</b> y paga gemas 💎 y XP de Carisma.</p>
            <p class="mini">🗣️ Voces recuperadas: <b>${prog.hechas}</b> de ${prog.total} (${prog.bien} con su mejor final)</p>
            ${barra(Math.round((prog.hechas / prog.total) * 100))}
            <p class="mini">🎟️ ${plural(fichas, "ficha", "fichas")}</p>
        </section>
        <section class="panel voces-poder">
            <div class="titulo-seccion"><h3>Tu Carisma</h3><span class="mini texto-suave">Nivel ${nivel}</span></div>
            <ul class="voces-tecnicas">${tecnicas}</ul>
            <p class="mini">Las técnicas se desbloquean con el nivel de tu atributo Carisma (lo que cumples en la vida real).</p>
            <div class="voces-valor">
                <span><b>Valor</b> <span class="voces-pips" aria-label="Valor ${valor} de ${voces.MAX_VALOR}">${pips}</span></span>
                <small>Misiones o tareas de Carisma de los últimos 7 días. Abren las respuestas más valientes.</small>
            </div>
        </section>
        ${epilogo}
        ${tarjetaEnCurso}
        ${lugares}
        ${vividas}`;
}

function tarjetaPersona(estado, p, { caido, fichas }) {
    const escena = p.escenaId ? voces.ESCENAS[p.escenaId] : null;
    // Lo que dice el botón: seguir, hablar (con su costo), o por qué no se puede.
    let accion;
    if (!escena) {
        accion = `<p class="mini texto-suave">Por ahora no tiene nada más que decirte. Pronto habrá más voces.</p>`;
    } else if (p.motivo) {
        accion = `<p class="mini texto-suave">${esc(p.motivo)}</p>`;
    } else {
        const sinFichas = !p.enCurso && fichas < 1;
        accion = `<button type="button" class="boton boton-principal boton-ancho" data-accion="voces-hablar" data-escena="${p.escenaId}"
                         ${caido || sinFichas ? "disabled" : ""}>${p.enCurso ? "Seguir hablando" : `Hablar · 🎟️ 1 ficha`}</button>
                  ${sinFichas && !caido ? `<p class="mini texto-suave">Sin fichas: completa una misión diaria.</p>` : ""}`;
    }
    return `
        <article class="voces-persona">
            <img class="voces-busto" data-busto="${p.id}" alt="" draggable="false">
            <div class="voces-persona-datos">
                <b>${esc(p.persona.nombre)}</b> <span class="mini texto-suave">${esc(p.persona.oficio)}</span>
                <p class="nota">${esc(p.persona.saludo)}</p>
                ${escena ? `<p class="mini">💬 «${esc(escena.titulo)}»</p>` : ""}
                ${accion}
            </div>
        </article>`;
}

function filaVivida(estado, id, hecha, { hoy, caido, fichas }) {
    const escena = voces.ESCENAS[id];
    const persona = voces.PERSONAS[escena.persona];
    const final = voces.FINALES[hecha.fin];
    // Una conversación que quedó «a medias» se puede volver a intentar para mejorarla (si la persona está hoy y no hablaste con ella).
    const puedeMejorar = hecha.fin !== "bien" && !voces.motivoBloqueo(estado, id, hoy) && !caido && fichas > 0;
    const tareas = estado.voces.tareas[id];
    return `
        <li class="voces-vivida">
            <span class="voces-final-icono" aria-hidden="true">${final.icono}</span>
            <span><b>${esc(persona.nombre)} · «${esc(escena.titulo)}»</b><br>
                  <small>${esc(final.titulo)}${tareas ? " · 📌 tarea creada" : ""}</small></span>
            ${puedeMejorar ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="voces-hablar" data-escena="${id}">Volver a hablar · 🎟️ 1</button>` : ""}
        </li>`;
}

// ===== La conversación (pantalla completa, como la Torre) =====
// e = { estado, nombre (el de tu héroe), hoy, resultado (si acaba de terminar: lo que devolvió elegirEnEscena) }
export function pantallaEscena(e) {
    if (e.epilogo) return pantallaEpilogo(e);
    if (e.resultado) return pantallaFinal(e);
    const en = e.estado.voces.escena;
    const escena = voces.ESCENAS[en.id];
    const persona = voces.PERSONAS[escena.persona];
    const sitio = voces.LUGARES[persona.lugar];
    const nodo = voces.nodoActual(en);
    const opciones = voces.opcionesDe(e.estado, en, e.hoy);

    // El que habla ahora: su retrato y su nombre (el narrador no lleva nombre; se ve a la persona de la escena).
    const habla = nodo.quien && voces.personaDe(nodo.quien) ? nodo.quien : null;
    const quienSale = habla || escena.persona;
    const nombreQuien = habla ? voces.personaDe(habla).nombre : "";

    // Lo anterior, atenuado (todo menos el nodo actual, que es el último del historial excepto tus frases).
    const previo = en.historial.slice(0, -1).slice(-4);
    const historial = previo.map((h) => h.quien === "yo"
        ? `<p class="voces-yo">${formato(h.texto, e.nombre)}</p>`
        : `<p class="voces-antes">${h.quien !== "narrador" && voces.personaDe(h.quien) ? `<b>${esc(voces.personaDe(h.quien).nombre)}:</b> ` : ""}${formato(h.texto, e.nombre)}</p>`).join("");

    const reaccion = en.reaccion > 0 ? `<span class="voces-reaccion sube">💗 Confía un poco más</span>`
        : en.reaccion < 0 ? `<span class="voces-reaccion baja">💔 Se cierra un poco</span>` : "";

    return `
        <div class="voces-escena" style="--pintura: url(${rutaPintura(sitio.fondo)})">
            <div class="voces-barra">
                <span class="voces-donde">${sitio.icono} ${esc(sitio.nombre)} · <b>${esc(escena.titulo)}</b></span>
                <button type="button" class="boton-icono" data-accion="voces-salir" aria-label="Dejarlo aquí y volver a la aldea">✕</button>
            </div>
            <div class="voces-retrato-caja">
                <img class="voces-retrato" data-persona="${quienSale}" alt="${esc(nombreQuien || persona.nombre)}" draggable="false">
                ${reaccion}
            </div>
            <div class="voces-dialogo">
                ${historial}
                <div class="voces-ahora ${habla ? "habla" : "narra"}">
                    ${nombreQuien ? `<p class="voces-nombre">${esc(nombreQuien)}</p>` : ""}
                    <p class="voces-texto">${formato(nodo.texto, e.nombre)}</p>
                </div>
            </div>
            <div class="voces-opciones">
                ${opciones.map((o) => botonOpcion(o)).join("")}
            </div>
            <button type="button" class="enlace voces-abandonar" data-accion="voces-abandonar">Dar por perdida esta conversación</button>
        </div>`;
}

function botonOpcion(o) {
    const tecnica = o.tecnica ? voces.TECNICAS[o.tecnica] : null;
    const etiqueta = tecnica ? `<span class="voces-etiqueta">${tecnica.icono} ${tecnica.nombre}</span>`
        : o.valor ? `<span class="voces-etiqueta">💪 Valor ${o.valor}</span>` : "";
    return `<button type="button" class="voces-opcion ${o.bloqueada ? "bloqueada" : ""}" data-accion="voces-elegir" data-indice="${o.indice}"
                    ${o.bloqueada ? `disabled aria-label="Bloqueada: ${esc(o.bloqueada)}"` : ""}>
                ${etiqueta}<span class="voces-opcion-texto">${o.bloqueada ? `🔒 ` : ""}${esc(o.texto)}</span>
                ${o.bloqueada ? `<small class="voces-bloqueo">${esc(o.bloqueada)}</small>` : ""}
            </button>`;
}

// El final: cómo salió, lo que ganaste y la lección (con la tarea real).
function pantallaFinal(e) {
    const r = e.resultado;
    const persona = voces.PERSONAS[r.persona];
    const sitio = voces.LUGARES[persona.lugar];
    const final = voces.FINALES[r.fin];
    const yaTarea = e.estado.voces.tareas[r.id];
    const premio = r.premio.gemas || r.premio.xp
        ? `+${r.premio.gemas} 💎 · +${r.premio.xp} XP de 🎶 Carisma` : "Esta vez no hubo premio.";
    return `
        <div class="voces-escena voces-final" style="--pintura: url(${rutaPintura(sitio.fondo)})">
            <div class="voces-barra">
                <span class="voces-donde">${sitio.icono} <b>${esc(r.titulo)}</b></span>
            </div>
            <div class="voces-retrato-caja">
                <img class="voces-retrato" data-persona="${r.persona}" alt="${esc(persona.nombre)}" draggable="false">
            </div>
            <div class="voces-dialogo">
                <p class="voces-final-titulo">${final.icono} ${esc(final.titulo)}</p>
                <p class="voces-texto">${formato(r.texto, e.nombre)}</p>
                ${r.leccion ? `<p class="voces-leccion"><b>🧙 Aurelio anota:</b> ${esc(r.leccion)}</p>` : ""}
                <p class="voces-premio">${premio}${r.mejoro ? " (por mejorarla)" : ""}</p>
                ${r.fin === "mal" ? `<p class="mini">Mañana ${esc(persona.nombre)} puede darte otra oportunidad.</p>` : ""}
            </div>
            <div class="voces-opciones">
                ${r.tarea && !yaTarea ? `<button type="button" class="voces-opcion" data-accion="voces-tarea" data-escena="${r.id}" data-tarea="${esc(r.tarea)}">
                    <span class="voces-etiqueta">📌 Llévalo a la vida real</span>
                    <span class="voces-opcion-texto">Crear la tarea: «${esc(r.tarea)}»</span></button>` : ""}
                ${r.tarea && yaTarea ? `<p class="mini texto-suave">📌 Ya creaste la tarea de esta lección.</p>` : ""}
                ${r.epilogo
        ? `<button type="button" class="voces-opcion" data-accion="voces-epilogo">
                    <span class="voces-etiqueta">🗣️ ¡Era la última voz!</span>
                    <span class="voces-opcion-texto">Continuar: la aldea habla</span></button>`
        : `<button type="button" class="voces-opcion voces-volver" data-accion="voces-cerrar">
                    <span class="voces-opcion-texto">Volver a la aldea</span></button>`}
            </div>
        </div>`;
}

// El epílogo de la aldea: se cuenta al recuperar la última voz y se puede releer desde la aldea.
function pantallaEpilogo(e) {
    const ep = voces.EPILOGO;
    return `
        <div class="voces-escena voces-final" style="--pintura: url(${rutaPintura("aldea")})">
            <div class="voces-barra">
                <span class="voces-donde">⛲ <b>${esc(ep.titulo)}</b></span>
                <button type="button" class="boton-icono" data-accion="voces-cerrar" aria-label="Volver a la aldea">✕</button>
            </div>
            <div class="voces-dialogo voces-epilogo">
                <p class="voces-final-titulo">🗣️ ${esc(ep.titulo)}</p>
                ${ep.paginas.map((p) => `<p class="voces-texto">${formato(p, e.nombre)}</p>`).join("")}
                <p class="voces-premio">+${ep.premio.gemas} 💎 · +${ep.premio.xp} XP de 🎶 Carisma (al recuperar la última voz)</p>
            </div>
            <div class="voces-opciones">
                <button type="button" class="voces-opcion voces-volver" data-accion="voces-cerrar">
                    <span class="voces-opcion-texto">Volver a la aldea</span></button>
            </div>
        </div>`;
}
