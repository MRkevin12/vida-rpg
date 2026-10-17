// vistas-aventuras.js — La pestaña Aventuras: misiones principales, la campaña de jefes, los logros y el robo.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as mapa from "./mapa.js";
import { dibujarEscenario } from "./dibujo.js";
import { figuraPixel, pixelarEnVivo } from "./retratos.js";
import { icono } from "./iconos.js";
import * as voces from "./voces.js";
import { fechaCorta } from "./fechas.js";
import { esc, cabeceraSeccion, vacio, plegable, barra, ICONOS, chipAtributo, botonCerrar, notaJefeEsperando,
         botonEditar, barraDeArmadura } from "./vistas-comun.js";

const { PREMIOS, plural } = juego;

// ===== Pantalla: Aventuras (misiones principales y jefes) =====


// Tus misiones principales (objetivos grandes con pasos). Está en Aventuras y, en el modo esencial, también en Hoy.
export function seccionPrincipales(estado, esencial = false) {
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
export function retratoJefe(jefe, estadoVisual, clase = "", dano = 0) {
    return `<figure class="retrato ${estadoVisual} ${clase}">
                <img src="${campana.imagenDe(jefe.id)}" alt="${esc(jefe.nombre)}" loading="lazy" decoding="async">
                ${dano ? '<span class="impacto"></span>' : ""}
            </figure>
            ${dano ? `<span class="dano" aria-hidden="true">−${dano}</span>` : ""}`;
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
                <div class="escena-fondo">${pixelarEnVivo(dibujarEscenario(c.categoria), 320 / 192)}</div>
                <div class="escena-heroe ${golpeado ? "atacar" : ""}">${figuraPixel(ctx.avatar, { alt: "Tu héroe", efectos: true })}</div>
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
