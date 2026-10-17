// vistas-comun.js — Piezas que usan varias pantallas: esc() (escapar texto), barras, fichas, botones, encabezados.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as vida from "./vida.js";
import * as mapa from "./mapa.js";
import { icono } from "./iconos.js";

const { ATRIBUTOS, plural } = juego;

// ===== Ayudantes =====

// "Escapa" el texto escrito por el usuario para que no se interprete como HTML.
// Ej: si una misión se llama "<b>gym</b>", se muestra tal cual y no en negrita.
export function esc(texto) {
    const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto).replace(/[&<>"']/g, (letra) => reemplazos[letra]);
}


// Íconos dibujados con SVG (líneas simples).
export const ICONOS = {
    // (v96) En pixel art, como el resto de los íconos (iconos.js).
    check: icono("check"),
    cerrar: icono("cerrar"),
    editar: icono("lapiz"),
};


export function barra(porcentaje, clase = "") {
    return `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;
}


export function vacio(texto) {
    return `<p class="vacio">${texto}</p>`;
}


// Las secciones de una pantalla larga, como pestañas pequeñas arriba (solo se ve una a la vez).
// opciones = [[clave, texto], …]. Se queda pegado bajo la cabecera al bajar.
export function selectorSecciones(pantalla, opciones, actual) {
    return `
        <div class="selector selector-secciones" role="group" aria-label="Secciones">
            ${opciones.map(([clave, texto]) => `<button type="button" data-accion="subvista" data-pantalla="${pantalla}"
                data-vista="${clave}" aria-pressed="${clave === actual}">${texto}</button>`).join("")}
        </div>`;
}


// El título de una pantalla sin pestaña propia, con el botón para volver a la que la abrió.
export function encabezado(titulo, padre, nombrePadre) {
    return `
        <div class="titulo-seccion encabezado">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="${padre}">‹ ${nombrePadre}</button>
        </div>`;
}


export function cabeceraSeccion(titulo, dialogo, textoBoton) {
    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="${dialogo}">${textoBoton}</button>
        </div>`;
}


// info = { icono, nombre, color }: uno de los 4, o uno tuyo (ver juego.infoAtributo).
export function chipAtributo(clave, info = ATRIBUTOS[clave]) {
    return `<span class="chip-atributo" style="--color-atributo: ${info.color}">${esc(info.icono)} ${esc(info.nombre)}</span>`;
}


export function botonEditar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.editar}</button>`;
}


export function botonCerrar(accion, id, etiqueta) {
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
export function ficha(etiqueta, valor, nota) {
    return `<div class="ficha-dato"><span class="ficha-etiqueta">${etiqueta}</span><span class="ficha-valor">${valor}</span>${nota}</div>`;
}


// Cambio frente al periodo anterior, con flecha y texto (no solo color).
export function textoCambio(valor, unidad, periodo) {
    if (valor === null) return `<span class="ficha-nota">Aún no hay un periodo anterior completo para comparar</span>`;
    if (valor === 0) return `<span class="ficha-nota">Igual que ${periodo}</span>`;
    const sube = valor > 0;
    return `<span class="ficha-nota">${sube ? "▲" : "▼"} ${Math.abs(valor)} ${unidad} ${sube ? "más" : "menos"} que ${periodo}</span>`;
}



// (v51) Agrupa misiones o tareas por atributo, con un título de color para cada uno (los base primero y luego los tuyos).
// `hecha(x)` dice si ya está hecha, para mostrar «2/3» en el título.
export function agruparPorAtributo(estado, elementos, tarjeta, hecha) {
    const grupos = new Map();
    for (const e of elementos) {
        const clave = e.atributoPropio ? juego.clavePropio(e.atributoPropio) : e.atributo;
        if (!grupos.has(clave)) grupos.set(clave, { info: juego.infoAtributo(estado, e.atributo, e.atributoPropio), lista: [] });
        grupos.get(clave).lista.push(e);
    }
    const orden = [...Object.keys(ATRIBUTOS), ...estado.atributosPropios.map((p) => juego.clavePropio(p.id))];
    return [...grupos.entries()].sort((x, y) => orden.indexOf(x[0]) - orden.indexOf(y[0])).map(([, g]) => `
        <h3 class="subtitulo subtitulo-atributo" style="--color-attr: ${g.info.color}">
            <span>${esc(g.info.icono)} ${esc(g.info.nombre)}</span><small>${g.lista.filter(hecha).length}/${g.lista.length}</small></h3>
        <ul class="lista lista-atributo" style="--color-attr: ${g.info.color}">${g.lista.map(tarjeta).join("")}</ul>`).join("");
}


// Texto del ánimo del avatar, con los números del momento.
export function textoAnimo(a, ctx) {
    const animo = avatar.ANIMOS[a.animo];
    if (a.animo === "llamas") return `${animo.icono} ¡En llamas! Racha de ${ctx.info.racha.actual} días.`;
    if (a.animo === "dormido") return `${animo.icono} Zzz… ${a.diasSinMision} días sin misiones. Completa una para despertarlo.`;
    if (a.animo === "caido") return `${animo.icono} Cayó en combate. Llega a ${ctx.vida.levantarse} ❤️ para levantarlo.`;
    return `${animo.icono} ${animo.texto}`;
}


// La barra de vida del héroe (la usan la tarjeta de Hoy y la pantalla Personaje).
// Va con <span> (no <div>) porque puede ir dentro de un botón.
export function barraDeVida(v) {
    const e = vida.ESTADOS[v.nivel];
    return `
        <span class="vida-linea">
            <b class="vida-numero">❤️ ${v.puntos} / ${v.maxima}</b>
            <span class="vida-estado salud-${v.nivel}">${e.icono} ${e.nombre}${v.enForma ? " · +10 %" : ""}</span>
        </span>
        <span class="barra barra-salud salud-${v.nivel}"><span class="barra-relleno" style="width: ${v.porcentaje}%"></span></span>`;
}


// La barra de armadura (v24): cuánto te protege cuando fallas una misión.
// La parte gris es tu máximo (lo que dan tu ropa y tus objetos de protección) y la azul, lo que
// te queda ahora. La barra entera son 100 puntos.
export function barraDeArmadura(a) {
    const cambio = Math.round(Math.abs(1 - a.factor) * 100);
    const efecto = !cambio ? "si fallas, el daño normal"
        : a.factor < 1 ? `si fallas, ${cambio} % menos daño` : `si fallas, ${cambio} % más daño`;
    return `
        <span class="vida-linea">
            <b class="armadura-numero">🛡️ ${a.puntos} / ${a.maxima}</b>
            <span class="armadura-efecto ${a.factor > 1 ? "peor" : "mejor"}">${efecto}</span>
        </span>
        <span class="barra barra-armadura">
            <span class="barra-capacidad" style="width: ${a.maxima}%"></span>
            <span class="barra-relleno" style="width: ${a.puntos}%"></span>
        </span>`;
}


// (v52) Si el jefe vive en una región a la que tu héroe aún no llega: dónde está, cuánto falta y el daño guardado.
export function notaJefeEsperando(c) {
    if (!c.esperando) return "";
    const faltan = Math.max(0, c.region * mapa.PASOS_POR_LUGAR * mapa.LUGARES_POR_REGION - c.pasosHeroe);
    return `<span class="mini jefe-esperando">🔒 Te espera en ${esc(mapa.nombreRegion(c.region))}: te faltan ${plural(faltan, "paso", "pasos")} en el mapa.
                ${c.guardado ? `Daño guardado: ⚔️ ${c.guardado}, lo recibe al llegar.` : ""}</span>`;
}

    // barras que no son las destacadas
export const NOMBRE_DIA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];


// <details> es una sección que se abre y se cierra sola (sin JavaScript).
export function plegable(titulo, contenido, cantidad) {
    if (!cantidad) return "";
    return `<details class="plegable"><summary>${titulo}</summary>${contenido}</details>`;
}



// ===== El reto del día (v40) =====
// Un objetivo distinto cada día (ver retos.js). Se crea al abrir la app; si todavía no existe, no se muestra.
export function textoPremioReto(premio) {
    return `+${premio.gemas} 💎 · +${premio.xp} XP`;
}
