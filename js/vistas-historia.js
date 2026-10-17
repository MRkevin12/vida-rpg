// vistas-historia.js — Historia: la Saga, el Tratado (pacto), las memorias, los pergaminos, las novelas y la Biblioteca.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import * as torre from "./torre.js";
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
import * as mapa from "./mapa.js";
import * as cronica from "./cronica.js";
import * as mascota from "./mascota.js";
import { pixelarEnVivo, ilustracion } from "./retratos.js";
import { icono } from "./iconos.js";
import * as voces from "./voces.js";
import { fechaLegible, fechaCorta } from "./fechas.js";
import { barra, esc, ficha, encabezado } from "./vistas-comun.js";

const { plural } = juego;

// ===== El Tratado de la Voluntad (tu pacto) =====

// En Hoy: si no lo has firmado, una invitación; si sí, el día de tu pacto y una cita
// (o una advertencia si ayer fallaste: el artículo III dice «nunca fallar dos días seguidos»).
// ===== La Saga de la Llama (v35) =====
// Tu objetivo de ahora, en Hoy: el acto de la saga que toca y cuánto te falta. Al tocarlo, abre
// Héroe › Historia, donde está la saga completa.
export function sagaDe(estado, ctx) {
    return ctx.saga || saga.estadoDeSaga(saga.datosDeSaga(estado, campana.estadoCampanas(estado)));
}


const nombresDeSaga = (estado) => ({ heroe: estado.personaje.nombre, dragon: mascota.nombreDe(estado, mascota.INICIAL) });


export function lineaDeSaga(estado, ctx, s) {
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



export function lineaDelPacto(estado, ctx) {
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


// (v90) Aurelio te avisa si hoy hay alguien con quien hablar en el valle. Toca la línea para ir a las Voces.
export function lineaDeVoces(estado, ctx) {
    const pista = voces.pistaDeHoy(estado, ctx.hoy);
    if (!pista) return "";
    const frase = pista.enCurso
        ? `${pista.nombre} te espera: dejaste una conversación a medias en ${pista.lugar}.`
        : `Hoy ${pista.nombre} está en ${pista.lugar}. Hay una conversación esperándote.`;
    return `
        <button type="button" class="pacto-linea" data-accion="ir" data-pantalla="voces">
            <span class="pacto-linea-icono" aria-hidden="true">🗣️</span>
            <span><b>Las Voces del Valle</b>
                <span class="mini pacto-cita">🧙 Aurelio: «${esc(frase)}»</span></span>
        </button>`;
}


// El sello de lacre rojo, con la inicial de tu nombre.
function selloDeLacre(nombre) {
    const inicial = esc((Array.from(nombre.trim())[0] || "V").toUpperCase());
    return pixelarEnVivo(`
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
        </svg>`, 2.5);
}


// La firma guardada (un trazo SVG). Solo se dibuja si es un trazo válido.
function dibujoDeFirma(trazo) {
    if (!pacto.firmaValida(trazo)) return "";
    // (v96) En pixel art: 150 puntos de ancho; el trazo, más grueso para que no se corte al pixelar.
    return pixelarEnVivo(`<svg class="firma-dibujo" viewBox="0 0 ${pacto.ANCHO_FIRMA} ${pacto.ALTO_FIRMA}" role="img" aria-label="Tu firma">
                <path d="${trazo}" fill="none" stroke="#7a1414" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`, pacto.ANCHO_FIRMA / 150);
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


// Una fila que lleva a otra pantalla (con su icono, su nombre y una línea de detalle).
function filaEnlace(icono, titulo, detalle, destino) {
    return `<button type="button" class="fila-enlace" ${destino}>
                <span class="fila-enlace-icono" aria-hidden="true">${icono}</span>
                <span><b>${titulo}</b><small>${detalle}</small></span>
                <span class="fila-enlace-flecha" aria-hidden="true">›</span>
            </button>`;
}


// (v108) La letra capitular: la primera letra del primer párrafo, grande y en un marco, como en los libros antiguos.
function conCapitular(html) {
    return html.replace(/^<p>([«"¡¿]?)([A-Za-zÁÉÍÓÚÑáéíóúñ])/, (_, signo, letra) => `<p class="con-capitular">${signo}<span class="capitular" aria-hidden="true">${letra}</span><span class="solo-lectores">${letra}</span>`);
}


// (v108) La ilustración de un libro largo: Casio en la cima de la tormenta, Orrin en el fondo del abismo.
function ilustracionDeLibro(id, ctx, capitulo) {
    const fondo = id === "orrin" ? "abismo" : "cima";
    return ilustracion(fondo, { actores: capitulo < 0 || capitulo % 2 === 0 ? [] : [{ d: ctx.avatar, x: 66 }] });
}


function bibliotecaLeidos(estado) {
    return pergaminos.IDS.filter((id) => estado.pergaminos.leidos[id]).length;
}


// «Historia»: todo lo que cuenta tu camino, junto (antes estaba repartido entre Hoy, Personaje y Ajustes).
export function seccionHistoria(estado, ctx) {
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
    // (v108) Cada historia con su miniatura: el lugar donde pasa y quién la protagoniza.
    const yo = [{ d: ctx.avatar, x: 62 }];
    const miniaturas = {
        pergamino: ilustracion("pintura:torre", { clase: "miniatura" }),
        orrin: ilustracion("abismo", { clase: "miniatura" }),
        memorias: ilustracion("pintura:salon", { clase: "miniatura", actores: [{ d: maestro.describirMaestro(), x: 50 }] }),
        casio: ilustracion("cima", { clase: "miniatura" }),
        cronica: ilustracion("pintura:aldea", { clase: "miniatura", actores: yo }),
        torre: ilustracion("cripta", { clase: "miniatura", actores: yo }),
        mazmorra: ilustracion("cisterna", { clase: "miniatura" }),
        voces: ilustracion("pintura:aldea", { clase: "miniatura" }),
        libro: ilustracion("pintura:camino", { clase: "miniatura", actores: yo }),
    };
    const historias = saga.HISTORIAS.map((h) =>
        filaEnlace(miniaturas[h.id] || h.icono, esc(h.titulo), `<i>${h.cuando}.</i> ${esc(h.texto)} · ${detalle[h.id]}`, abrirHistoriaDeSaga(h.abrir))).join("");
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
            ${ilustracion("pintura:salon", { actores: [{ d: maestro.describirMaestro(), x: 50 }] })}
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
            ${conCapitular(parrafos(c.parrafos))}
        </section>`).join(adorno);
    // (v108) La ilustración del pergamino: el lugar de su escena con tu héroe; en el del huevo, también Aurelio.
    const conAurelio = ["huevo", "juramento"].includes(p.id);
    const dibujo = p.escena?.fondo ? ilustracion(p.escena.fondo, {
        actores: conAurelio ? [{ d: maestro.describirMaestro(), x: 30 }, { d: ctx.avatar, x: 72 }] : [{ d: ctx.avatar, x: 64 }],
        titulo: esc(p.titulo),
    }) : "";
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
                ${dibujo}
                <div class="rollo-prologo">${conCapitular(parrafos(p.prologo))}</div>
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
                    ${ilustracionDeLibro(id, ctx, i)}
                    <section class="rollo-capitulo novela-texto">${conCapitular(parrafos(c.parrafos))}</section>
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
                ${ilustracionDeLibro(id, ctx, -1)}
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
