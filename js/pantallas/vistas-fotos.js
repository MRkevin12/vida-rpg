// vistas-fotos.js — Lo que se VE de las fotos de progreso (v197; rehecho como galería de celular en la v199):
// la tarjeta semanal de Hoy, la galería con sus 3 pestañas internas (Fotos · Álbumes · Comparar) y el visor de una foto.
// Solo arma HTML; guardar y leer las fotos lo hace fotos.js, y los botones están en app-foto.js.
//
// Cada álbum lleva el TEMA de su misión (ícono y color de su atributo) y se aplica con la variable CSS --tema.
// Las fotos llegan ya con su dirección temporal (url) porque leerlas de IndexedDB es asíncrono.

import { esc } from "./vistas-comun.js";
import { fechaLegible, fechaCorta, diasEntre } from "../fechas.js";
import { faltaFotoSemanal, PERIODOS, ORDENES } from "../fotos.js";

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// «hoy», «ayer» o «hace 5 días».
function hace(fecha, hoy) {
    const dias = diasEntre(fecha, hoy);
    return dias <= 0 ? "hoy" : dias === 1 ? "ayer" : `hace ${dias} días`;
}

// El título de cada día en la lista de fotos: «Hoy», «Ayer» o «jueves 5 de noviembre».
function etiquetaDia(fecha, hoy) {
    const dias = diasEntre(fecha, hoy);
    return dias === 0 ? "Hoy" : dias === 1 ? "Ayer" : fechaLegible(fecha);
}

// El color llega de una lista fija de la app, pero igual se limpia: solo deja pasar un color como #a1b2c3.
const colorSeguro = (color) => (/^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "#a78bfa");
const estiloTema = (tema) => `style="--tema: ${colorSeguro(tema.color)}"`;

// El orden de las pestañas de la galería.
export const PESTANAS = [
    { id: "fotos", icono: "🖼️", nombre: "Fotos" },
    { id: "albumes", icono: "🗂️", nombre: "Álbumes" },
    { id: "comparar", icono: "↔️", nombre: "Comparar" },
];


// ===== Hoy: la tarjeta de la foto de la semana =====

// La tarjeta de Hoy que pide la foto de progreso de la semana (o nada si ya la tomaste o el recordatorio está apagado).
export function tarjetaFotoSemanal(estado, ctx) {
    if (!faltaFotoSemanal(estado, ctx.hoy)) return "";
    return `
        <section class="panel foto-semanal">
            <p class="etiqueta">Cada semana</p>
            <h2 class="titulo-juego">📷 Foto de progreso</h2>
            <p class="nota">Todavía no tomas la foto de esta semana. Mismo lugar, misma luz y mismo ángulo: así el cambio se nota.</p>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="fotos-semanal">📷 Tomar la foto</button>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-abrir">Ver mis fotos</button>
        </section>`;
}


// ===== La hoja «Mover a…» (la usan la galería y el visor) =====

//   albumes: [{ id, tema }]   excluir: id del álbum donde ya está la foto (no se ofrece)
function hojaMover(albumes, excluir = null) {
    return `
        <div class="galeria-hoja-fondo" data-accion="fotos-mover-cancelar"></div>
        <section class="galeria-hoja" aria-label="Mover a un álbum">
            <h3 class="subtitulo">📁 Mover a…</h3>
            <div class="galeria-hoja-lista">${albumes.filter((a) => a.id !== excluir).map((a) => `
                <button type="button" class="boton boton-secundario galeria-hoja-album" ${estiloTema(a.tema)} data-accion="fotos-mover-a" data-album="${esc(a.id)}">
                    <span aria-hidden="true">${esc(a.tema.icono)}</span> ${esc(a.tema.nombre)}</button>`).join("")}
                <button type="button" class="boton boton-secundario galeria-hoja-album" data-accion="fotos-album-nuevo">➕ Álbum nuevo…</button>
            </div>
            <button type="button" class="boton-texto" data-accion="fotos-mover-cancelar">Cancelar</button>
        </section>`;
}


// ===== La galería =====

// Una miniatura cuadrada. En el modo «seleccionar» lleva un círculo que se llena al marcarla.
function miniatura(f, { activa, marcadas, conAlbum }) {
    const marcada = marcadas.includes(f.clave);
    return `<button type="button" class="galeria-foto ${marcada ? "marcada" : ""}" data-accion="fotos-tocar" data-clave="${esc(f.clave)}"
                    ${activa ? `aria-pressed="${marcada}"` : ""} aria-label="Foto del ${esc(fechaLegible(f.fecha))}, ${esc(f.tema.nombre)}">
                <img src="${f.url}" alt="" loading="lazy">
                ${conAlbum ? `<span class="galeria-foto-album" ${estiloTema(f.tema)} aria-hidden="true">${esc(f.tema.icono)}</span>` : ""}
                ${f.favorita ? `<span class="galeria-foto-estrella" aria-hidden="true">⭐</span>` : ""}
                ${activa ? `<span class="galeria-foto-marca" aria-hidden="true">${marcada ? "✓" : ""}</span>` : ""}
            </button>`;
}

// Las fotos agrupadas por día, en el orden que vengan (ya vienen filtradas y ordenadas).
function porDia(fotos, hoy, opciones) {
    const dias = [];
    for (const f of fotos) {
        if (!dias.length || dias[dias.length - 1].fecha !== f.fecha) dias.push({ fecha: f.fecha, fotos: [] });
        dias[dias.length - 1].fotos.push(f);
    }
    return dias.map((d) => `
        <section class="galeria-dia">
            <h3 class="galeria-dia-titulo">${esc(etiquetaDia(d.fecha, hoy))}</h3>
            <div class="galeria-grilla">${d.fotos.map((f) => miniatura(f, opciones)).join("")}</div>
        </section>`).join("");
}

// La franja con el tema del álbum que estás mirando: su ícono, cuántas fotos y desde cuándo.
function franjaDeAlbum(album, hoy) {
    const datos = album.cuenta
        ? `<span class="album-dato">📸 ${plural(album.cuenta, "foto", "fotos")}</span>
           <span class="album-dato">📅 ${esc(fechaCorta(album.primera))}${album.cuenta > 1 ? ` → ${esc(fechaCorta(album.ultima))}` : ""}</span>
           <span class="album-dato">⏳ ${diasEntre(album.primera, hoy) <= 0 ? "empezaste hoy" : `${plural(diasEntre(album.primera, hoy), "día", "días")} de camino`}</span>`
        : `<span class="album-dato">Álbum vacío</span>`;
    const propio = /^a\d+$/.test(album.id);
    const botones = [
        album.id === "progreso" ? `<button type="button" class="boton boton-principal boton-chico" data-accion="fotos-nueva">➕ Foto de hoy</button>` : "",
        propio && !album.cuenta ? `<button type="button" class="boton boton-secundario boton-chico" data-accion="fotos-album-borrar" data-album="${esc(album.id)}">🗑️ Borrar álbum</button>` : "",
    ].join("");
    return `
        <header class="album-cabecera" ${estiloTema(album.tema)}>
            <span class="album-cabecera-icono" aria-hidden="true">${esc(album.tema.icono)}</span>
            <div class="album-cabecera-texto">
                <p class="etiqueta">Álbum · ${esc(album.tema.etiqueta)}</p>
                <h3 class="titulo-juego">${esc(album.tema.nombre)}</h3>
            </div>
        </header>
        <div class="album-datos" ${estiloTema(album.tema)}>${datos}</div>
        ${botones ? `<div class="album-acciones">${botones}</div>` : ""}`;
}

// La pestaña «Fotos»: filtros arriba y todas las fotos en cuadrícula, día por día.
function pestanaFotos(d) {
    const { albumes, fotos, filtro, seleccion, hoy, total } = d;
    const periodo = PERIODOS.find((p) => p.id === filtro.periodo) || PERIODOS[0];
    const orden = ORDENES.find((o) => o.id === filtro.orden) || ORDENES[0];
    const hayFiltros = filtro.album !== "todas" || filtro.periodo !== "todo" || filtro.favoritas;
    const album = albumes.find((a) => a.id === filtro.album);

    // Los álbumes con fotos (y el que tengas elegido) como chips que se deslizan hacia los lados.
    const chips = [
        `<button type="button" class="chip-foto" data-accion="fotos-filtro-album" data-album="todas" aria-pressed="${filtro.album === "todas"}">Todas <small>${total}</small></button>`,
        ...albumes.filter((a) => a.cuenta || a.id === filtro.album).map((a) => `
            <button type="button" class="chip-foto" ${estiloTema(a.tema)} data-accion="fotos-filtro-album" data-album="${esc(a.id)}"
                    aria-pressed="${filtro.album === a.id}"><span aria-hidden="true">${esc(a.tema.icono)}</span> ${esc(a.tema.nombre)} <small>${a.cuenta}</small></button>`),
    ].join("");

    let cuerpo;
    if (!total && filtro.album === "todas") {
        cuerpo = `<div class="galeria-vacio"><p class="galeria-vacio-icono" aria-hidden="true">📷</p>
            <p>Aún no tienes fotos.</p>
            <p class="nota">Completa una misión con foto, o toca el botón de la cámara para tomar tu primera foto de progreso.</p></div>`;
    } else if (!fotos.length) {
        cuerpo = `<div class="galeria-vacio"><p class="galeria-vacio-icono" aria-hidden="true">🔍</p>
            <p>Ninguna foto con estos filtros.</p>
            ${hayFiltros ? `<button type="button" class="boton boton-secundario" data-accion="fotos-quitar-filtros">✕ Quitar filtros</button>` : ""}</div>`;
    } else {
        cuerpo = porDia(fotos, hoy, { activa: seleccion.activa, marcadas: seleccion.marcadas, conAlbum: filtro.album === "todas" });
    }

    return `
        <div class="galeria-filtros-caja">
            <div class="galeria-chips" role="group" aria-label="Álbum">${chips}</div>
            <div class="galeria-filtros" role="group" aria-label="Filtros">
                <button type="button" class="chip-foto" data-accion="fotos-filtro-periodo">🗓️ ${esc(periodo.nombre)}</button>
                <button type="button" class="chip-foto" data-accion="fotos-filtro-orden">↕ ${esc(orden.nombre)}</button>
                <button type="button" class="chip-foto" data-accion="fotos-filtro-favoritas" aria-pressed="${filtro.favoritas}">⭐ Favoritas</button>
                ${hayFiltros ? `<button type="button" class="chip-foto chip-quitar" data-accion="fotos-quitar-filtros">✕ Quitar</button>` : ""}
            </div>
        </div>
        ${album ? franjaDeAlbum(album, hoy) : ""}
        ${fotos.length ? `<p class="galeria-cuenta">${plural(fotos.length, "foto", "fotos")}${hayFiltros ? " con estos filtros" : ""}</p>` : ""}
        ${cuerpo}`;
}

// La pestaña «Álbumes»: una portada por álbum (con el tema de su misión) y el botón de crear uno propio.
function pestanaAlbumes(d) {
    const tarjetas = d.albumes.map((a) => `
        <button type="button" class="album-tarjeta ${a.cuenta ? "" : "album-vacio-tarjeta"}" ${estiloTema(a.tema)}
                data-accion="fotos-ver-album" data-album="${esc(a.id)}" aria-label="Álbum ${esc(a.tema.nombre)}, ${plural(a.cuenta, "foto", "fotos")}">
            <span class="album-portada">${a.portada
                ? `<img src="${a.portada}" alt="" loading="lazy">`
                : `<span class="album-vacio" aria-hidden="true">${esc(a.tema.icono)}</span>`}</span>
            <span class="album-insignia" aria-hidden="true">${esc(a.tema.icono)}</span>
            <span class="album-info">
                <b>${esc(a.tema.nombre)}</b>
                <small>${a.cuenta ? `${plural(a.cuenta, "foto", "fotos")} · ${hace(a.ultima, d.hoy)}` : "Sin fotos aún"}</small>
            </span>
        </button>`).join("");
    return `
        <p class="nota">Cada misión con foto tiene su álbum, y puedes crear los tuyos. Toca uno para ver sus fotos.</p>
        <div class="albumes-grilla">
            ${tarjetas}
            <button type="button" class="album-tarjeta album-nuevo" data-accion="fotos-album-nuevo">
                <span class="album-vacio" aria-hidden="true">➕</span><span class="album-info"><b>Álbum nuevo</b></span>
            </button>
        </div>
        <button type="button" class="boton boton-secundario boton-ancho" data-accion="fotos-recordatorio">🔔 Recordarme la foto de progreso cada semana: ${d.semanal ? "sí" : "no"}</button>
        <p class="ficha-nota">Las fotos viven solo en este teléfono, reducidas. La copia de seguridad no las incluye: si borras la app, se pierden.</p>`;
}

// Un hueco del comparador: la foto elegida (o «Elegir foto») con su etiqueta.
function huecoComparar(foto, hueco, etiqueta) {
    return `<button type="button" class="comparar-hueco ${foto ? "" : "comparar-hueco-vacio"}" ${foto ? estiloTema(foto.tema) : ""}
                    data-accion="fotos-comparar-hueco" data-hueco="${hueco}" aria-label="${etiqueta}: ${foto ? esc(fechaLegible(foto.fecha)) : "elegir foto"}">
                ${foto ? `<img src="${foto.url}" alt="">` : `<span class="comparar-mas" aria-hidden="true">➕</span>`}
                <span class="comparar-etiqueta">${etiqueta}${foto ? ` · ${esc(fechaCorta(foto.fecha))}` : ""}</span>
            </button>`;
}

// La pestaña «Comparar»: dos fotos lado a lado, y atajos para llenarlas.
function pestanaComparar(d) {
    const { a, b } = d.comparar;
    const album = d.albumes.find((x) => x.id === d.filtro.album);
    const dias = a && b ? Math.abs(diasEntre(a.fecha, b.fecha)) : null;
    return `
        <p class="nota">Pon dos fotos juntas para ver cuánto cambió. Toca un hueco para elegir la foto.</p>
        <div class="comparar-huecos">${huecoComparar(a, "a", "Antes")}${huecoComparar(b, "b", "Después")}</div>
        <p class="nota comparar-dias">${dias === null ? "Elige las dos fotos." : dias === 0 ? "Las dos son del mismo día." : `Entre las dos pasaron ${plural(dias, "día", "días")}.`}</p>
        <div class="comparar-acciones">
            <button type="button" class="boton boton-secundario" data-accion="fotos-comparar-extremos" ${d.fotos.length > 1 ? "" : "disabled"}>⏮️ Primera y última${album ? ` de «${esc(album.tema.nombre)}»` : ""}</button>
            <button type="button" class="boton boton-secundario" data-accion="fotos-comparar-cambiar" ${a && b ? "" : "disabled"}>⇄ Intercambiar</button>
        </div>`;
}

//   pestana: "fotos" | "albumes" | "comparar"      hoy      semanal: ¿recordatorio encendido?      total: cuántas fotos hay en total
//   albumes: [{ id, tema, cuenta, primera, ultima, portada }]      (todos los álbumes)
//   fotos: [{ clave, album, fecha, url, favorita, tema }]          (ya filtradas y ordenadas)
//   filtro: { album, periodo, favoritas, orden }      seleccion: { activa, marcadas: [claves] }      moviendo: ¿hoja «Mover a…» abierta?
//   picker: null | "a" | "b" (eligiendo la foto de un hueco del comparador)      comparar: { a, b } (fotos o null)
export function contenidoGaleria(d) {
    const marcadas = d.seleccion.marcadas.length;
    const titulo = d.picker ? `Elige la foto «${d.picker === "a" ? "Antes" : "Después"}»`
        : d.seleccion.activa ? (marcadas ? plural(marcadas, "elegida", "elegidas") : "Elige fotos")
        : { fotos: "📷 Fotos", albumes: "🗂️ Álbumes", comparar: "↔️ Comparar" }[d.pestana];
    const cuerpo = d.pestana === "albumes" ? pestanaAlbumes(d) : d.pestana === "comparar" ? pestanaComparar(d) : pestanaFotos(d);
    const verFotos = d.pestana === "fotos";
    const barra = verFotos && d.seleccion.activa ? `
        <div class="galeria-barra" role="toolbar" aria-label="Con las fotos elegidas">
            <button type="button" class="boton boton-secundario" data-accion="fotos-comparar-marcadas" ${marcadas === 2 ? "" : "disabled"}>↔️ Comparar</button>
            <button type="button" class="boton boton-secundario" data-accion="fotos-favorita-marcadas" ${marcadas ? "" : "disabled"}>⭐ Favorita</button>
            <button type="button" class="boton boton-secundario" data-accion="fotos-mover-abrir" data-origen="seleccion" ${marcadas ? "" : "disabled"}>📁 Mover</button>
            <button type="button" class="boton boton-secundario" data-accion="fotos-borrar-marcadas" ${marcadas ? "" : "disabled"}>🗑️ ${marcadas || ""}</button>
        </div>` : "";
    return `
        <div class="galeria">
            <header class="galeria-cabecera">
                <h2 class="titulo-juego" tabindex="-1" autofocus>${esc(titulo)}</h2>
                <div class="galeria-cab-botones">
                    ${d.picker ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="fotos-picker-cancelar">Cancelar</button>` : ""}
                    ${verFotos && !d.picker && d.fotos.length ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="fotos-seleccionar">${d.seleccion.activa ? "Cancelar" : "Seleccionar"}</button>` : ""}
                    <button type="button" class="boton-icono" data-accion="cerrar" aria-label="Cerrar la galería">✕</button>
                </div>
            </header>
            <div class="galeria-cuerpo" data-galeria-cuerpo>${cuerpo}</div>
            ${verFotos && !d.seleccion.activa && !d.picker ? `<button type="button" class="galeria-fab" data-accion="fotos-nueva" aria-label="Tomar foto de progreso">📷</button>` : ""}
            ${barra}
            <nav class="galeria-pestanas" aria-label="Secciones de la galería">${PESTANAS.map((p) => `
                <button type="button" class="galeria-pestana" data-accion="fotos-pestana" data-pestana="${p.id}" ${d.pestana === p.id ? 'aria-current="page"' : ""}>
                    <span class="galeria-pestana-icono" aria-hidden="true">${p.icono}</span><span>${p.nombre}</span></button>`).join("")}
            </nav>
            ${d.moviendo ? hojaMover(d.albumes) : ""}
        </div>`;
}


// ===== El visor de una foto =====

//   foto: { clave, album, fecha, url, favorita, tema }   indice y total: «3 de 12»   albumes: para la hoja «Mover a…»
export function contenidoVisor({ foto, indice, total, albumes, moviendo }) {
    return `
        <div class="visor-foto" ${estiloTema(foto.tema)}>
            <header class="visor-cab">
                <button type="button" class="boton-icono" data-accion="cerrar" aria-label="Volver a la galería">‹</button>
                <div class="visor-titulo"><b><span aria-hidden="true">${esc(foto.tema.icono)}</span> ${esc(foto.tema.nombre)}</b><small>${esc(fechaLegible(foto.fecha))}</small></div>
                <button type="button" class="boton-icono" data-accion="fotos-favorita-visor" aria-pressed="${foto.favorita}"
                        aria-label="${foto.favorita ? "Quitar de favoritas" : "Marcar como favorita"}">${foto.favorita ? "⭐" : "☆"}</button>
            </header>
            <div class="visor-lienzo" data-visor-lienzo><img src="${foto.url}" alt="Foto del ${esc(fechaLegible(foto.fecha))}"></div>
            <p class="visor-contador">${indice + 1} de ${total} · desliza para ver más</p>
            <footer class="visor-pie">
                <button type="button" class="boton boton-secundario" data-accion="fotos-visor-mover" data-paso="-1" aria-label="Foto anterior" ${indice <= 0 ? "disabled" : ""}>‹</button>
                <button type="button" class="boton boton-secundario" data-accion="fotos-comparar-visor">↔️ Comparar</button>
                <button type="button" class="boton boton-secundario" data-accion="fotos-mover-abrir" data-origen="visor">📁 Mover</button>
                <button type="button" class="boton boton-secundario" data-accion="fotos-borrar-visor" aria-label="Borrar esta foto">🗑️</button>
                <button type="button" class="boton boton-secundario" data-accion="fotos-visor-mover" data-paso="1" aria-label="Foto siguiente" ${indice >= total - 1 ? "disabled" : ""}>›</button>
            </footer>
            ${moviendo ? hojaMover(albumes, foto.album) : ""}
        </div>`;
}
