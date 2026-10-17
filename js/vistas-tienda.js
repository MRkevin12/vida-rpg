// vistas-tienda.js — La Tienda: recompensas reales, objetos del avatar y mascotas.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as diario from "./diario.js";
import * as rituales from "./rituales.js";
import * as mascota from "./mascota.js";
import { precioConEvento } from "./eventos.js";
import { fechaCorta } from "./fechas.js";
import { esc, botonEditar, cabeceraSeccion, vacio, plegable, selectorSecciones } from "./vistas-comun.js";
import { avisoEvento } from "./vistas-hoy.js";
import { iconoObjeto, textoRareza, poderDe, habilidadDe, retratoMascota, habilidadDeMascota, avisoCaido,
         tarjetaPocion } from "./vistas-heroe.js";

const { DIFICULTADES, PREMIOS } = juego;

// Equipamiento para tu avatar. Se compra con gemas 💎 (desde la v32), como las mascotas.
// (v100) Las casillas del submenú de la tienda, con su ícono.
const ICONO_ESPACIO = { todo: "⚔️", cabeza: "🪖", pecho: "🦺", piernas: "👖", pies: "🥾", mano: "🗡️", espalda: "🧣", fondo: "🏰" };


const ORDEN_RAREZA = ["comun", "raro", "epico", "legendario"];


// filtro = la casilla elegida en el submenú ("todo", "cabeza", "pecho"…).
function tiendaDelAvatar(estado, cerrada, evento, filtro = "todo") {
    const gemas = estado.personaje.gemas || 0;
    const todos = Object.entries(avatar.OBJETOS).filter(([, o]) => !o.logro);
    const elegido = filtro in avatar.ESPACIOS ? filtro : "todo";
    // Dentro de cada casilla: primero lo común, después lo raro, lo épico y lo legendario; y de más barato a más caro.
    const enVenta = todos
        .filter(([, o]) => elegido === "todo" || o.espacio === elegido)
        .sort(([, a], [, b]) => ORDEN_RAREZA.indexOf(a.rareza) - ORDEN_RAREZA.indexOf(b.rareza) || a.precio - b.precio);
    const cuantos = (espacio) => todos.filter(([, o]) => espacio === "todo" || o.espacio === espacio).length;
    const tuyos = (espacio) => todos.filter(([id, o]) => (espacio === "todo" || o.espacio === espacio) && estado.avatar.comprados.includes(id)).length;
    const submenu = `
        <div class="selector selector-rejilla" role="group" aria-label="Qué equipo ver">
            ${["todo", ...Object.keys(avatar.ESPACIOS)].map((espacio) => `
                <button type="button" data-accion="filtro-equipo" data-espacio="${espacio}" aria-pressed="${espacio === elegido}">
                    <span aria-hidden="true">${ICONO_ESPACIO[espacio]}</span> ${espacio === "todo" ? "Todo" : avatar.ESPACIOS[espacio]}
                    <small>${tuyos(espacio)}/${cuantos(espacio)}</small></button>`).join("")}
        </div>`;

    const lista = enVenta.map(([id, o]) => {
        const tuyo = estado.avatar.comprados.includes(id);
        const precio = precioConEvento(o.precio, evento);
        const puede = gemas >= precio && !cerrada;
        const accion = tuyo
            ? `<span class="mini oro">✓ Tuyo</span>`
            : `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar" data-id="${id}"
                       ${puede ? "" : "disabled"}>Comprar</button>`;
        return `<li class="objeto ${tuyo ? "puesto" : ""}">
                    ${iconoObjeto(id)}
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[o.espacio]} · ${textoRareza(o)}${poderDe(o)} · 💎 ${precio < o.precio ? `<s>${o.precio}</s> ${precio}` : o.precio}</span>
                        ${habilidadDe(o)}</span>
                    ${accion}
                </li>`;
    }).join("");

    return `
        <div class="titulo-seccion"><h2 class="titulo-juego">⚔️ Equipamiento</h2><span class="saldo-gemas">💎 ${gemas}</span></div>
        <p class="nota">El equipo se compra con <b>gemas</b>, la moneda del juego (las monedas quedan para tus premios reales).
           Lo que compres se equipa solo;
           puedes cambiarlo en tu Héroe. 🛡️ sube tu armadura (te protege al fallar una misión);
           ⚔️ ataque, 🔮 magia y 🍀 suerte cuentan en la Torre y en los minijuegos.
           Lo <b>épico</b> y lo <b>legendario</b> tiene además una habilidad especial en la Torre.</p>
        ${submenu}
        <ul class="lista">${lista}</ul>`;
}


// Las mascotas se adoptan con gemas 💎 (v31), no con monedas.
function tiendaDeMascotas(estado, cerrada, ctx) {
    const gemas = estado.personaje.gemas || 0;
    const activa = mascota.especieActiva(estado);
    const lista = Object.entries(mascota.MASCOTAS).sort(([, a], [, b]) => (a.precio || 0) - (b.precio || 0)).map(([especie, datos]) => {
        const tuya = mascota.tieneMascota(estado, especie);
        const precio = datos.precio ? precioConEvento(datos.precio, ctx.evento) : 0;
        const puede = gemas >= precio && !cerrada;
        let accion;
        if (especie === activa) accion = `<span class="mini oro">✓ Te acompaña</span>`;
        else if (tuya) accion = `<span class="mini oro">✓ Tuya</span>`;
        else accion = `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar-mascota" data-especie="${especie}"
                               ${puede ? "" : "disabled"}>Adoptar</button>`;
        const costo = datos.precio ? ` · 💎 ${precio < datos.precio ? `<s>${datos.precio}</s> ${precio}` : datos.precio}` : " · tu primera mascota";
        return `<li class="objeto ${tuya ? "puesto" : ""}">
                    ${retratoMascota(especie)}
                    <span class="objeto-info"><b>${tuya ? esc(mascota.nombreDe(estado, especie)) : datos.nombre}</b>
                        <span class="mini texto-suave">${textoRareza(datos)}${costo}</span>
                        <span class="mini texto-suave">${datos.texto}</span>
                        ${habilidadDeMascota(especie)}</span>
                    ${accion}
                </li>`;
    }).join("");
    return `
        <div class="titulo-seccion"><h2 class="titulo-juego">🐾 Mascotas</h2><span class="saldo-gemas">💎 ${gemas}</span></div>
        <p class="nota">Las mascotas se adoptan con <b>gemas</b>, la moneda del arcade: se ganan jugando y con los jefes, el cofre
           del día, los desafíos y el mapa (las monedas quedan para tus premios reales). Eliges cuál te acompaña en
           <button type="button" class="enlace enlace-en-linea" data-accion="subvista" data-pantalla="personaje" data-vista="mascotas">tu Héroe › Mascotas</button>.
           Cada mascota llega como <b>huevo</b> y crece con las misiones diarias que completas desde que la adoptas
           (cría con ${avatar.ETAPAS_MASCOTA[1].desde}, adulta con ${avatar.ETAPAS_MASCOTA[2].desde}). La que te acompaña pelea a tu lado
           en la Torre: la cría al ${mascota.POTENCIA.cria * 100} %, la adulta al 100 % y, si comió ese día, un ${Math.round((mascota.ALIMENTADA - 1) * 100)} % más.
           Si está triste (porque te descuidaste), no pelea.</p>
        <ul class="lista">${lista}</ul>`;
}



// ===== Pantalla: Tienda =====

export function pantallaTienda(estado, ctx) {
    const monedas = estado.personaje.monedas;
    const cerrada = ctx.vida.caido;   // caíste en combate: solo se venden pociones
    const esencial = Boolean(estado.ajustes.esencial);   // modo esencial: solo los premios reales (monedas)
    const vista = esencial ? "recompensas" : ctx.subvista?.tienda || "recompensas";
    const precio = (base) => precioConEvento(base, ctx.evento);   // con el «Mercader ambulante», 30 % menos
    const mostrarPrecio = (base) => (precio(base) < base ? `<s>${base}</s> ${precio(base)}` : `${base}`);
    const recompensas = [...estado.recompensas].sort((a, b) => a.costo - b.costo);
    const canjes = estado.canjes.slice(-15).reverse(); // los 15 más recientes

    const lista = recompensas.map((r) => {
        const alcanza = monedas >= precio(r.costo);
        const puede = alcanza && !cerrada;
        return `
            <li class="recompensa ${puede ? "alcanzable" : ""}">
                <div class="recompensa-info">
                    <h3>${esc(r.nombre)}</h3>
                    <span class="mini ${alcanza ? "oro" : "texto-suave"}">🪙 ${mostrarPrecio(r.costo)}${alcanza ? "" : ` · te faltan ${precio(r.costo) - monedas}`}</span>
                </div>
                <button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="canjear" data-id="${r.id}" ${puede ? "" : "disabled"}>Canjear</button>
                ${botonEditar("editar-recompensa", r.id, `Editar ${r.nombre}`)}
            </li>`;
    }).join("");

    const historial = canjes.map((c) =>
        `<li><span>${esc(c.nombre)}</span><span class="texto-suave">${fechaCorta(c.fecha)} · −${c.costo}</span></li>`).join("");

    // Lo que se ve según la sección elegida.
    const secciones = {
        recompensas: () => `
            ${cabeceraSeccion("🎁 Recompensas", "recompensa", "+ Nueva")}
            <p class="nota">Premios reales que tú defines. Cánjealos cuando tengas monedas suficientes.</p>
            ${recompensas.length ? `<ul class="lista">${lista}</ul>` : vacio("Crea tu primera recompensa. Ej: «Ver un capítulo de mi serie» por 50 monedas.")}
            ${plegable(`Historial de canjes (${canjes.length})`, `<ul class="historial">${historial}</ul>`, canjes.length)}`,
        equipo: () => `
            ${tiendaDelAvatar(estado, cerrada, ctx.evento, ctx.subvista?.tiendaEquipo || "todo")}
            <p class="nota">🏅 Los objetos legendarios de logro no se venden: se ganan. Los ves en
               <button type="button" class="enlace enlace-en-linea" data-accion="subvista" data-pantalla="personaje" data-vista="equipo">tu Héroe › Equipo</button>.</p>`,
        mascotas: () => tiendaDeMascotas(estado, cerrada, ctx),
    };

    if (esencial) {
        return `
        <section class="panel saldo">
            <span class="etiqueta">Tus monedas</span>
            <span class="saldo-numero">🪙 ${monedas}</span>
            <span class="mini texto-suave">Las ganas con cada hábito que cumples.</span>
        </section>
        ${cerrada ? avisoCaido(ctx.vida, "Tienda cerrada") : ""}
        <section class="bloque">${secciones.recompensas()}</section>`;
    }

    return `
        <section class="panel saldo">
            <span class="etiqueta">Tus monedas</span>
            <span class="saldo-numero">🪙 ${monedas}</span>
            <span class="mini texto-suave">💎 ${estado.personaje.gemas || 0} gemas · para el equipo, las mascotas y el arcade</span>
            ${tarjetaPocion(estado, ctx.vida)}
        </section>
        ${cerrada ? avisoCaido(ctx.vida, "Tienda cerrada") : ""}
        ${ctx.evento?.clave === "mercader" ? avisoEvento(ctx) : ""}
        ${selectorSecciones("tienda", [["recompensas", "🎁 Premios"], ["equipo", "⚔️ Equipo"], ["mascotas", "🐾 Mascotas"]], vista)}
        <section class="bloque">${(secciones[vista] || secciones.recompensas)()}</section>
        <details class="plegable">
            <summary>🪙 Cómo ganar monedas</summary>
            <p class="nota">Solo con lo que haces en la vida real. Lo del arcade y los premios extra (jefes, cofres, desafíos y
               mapa) dan gemas 💎, que sirven para el equipo, las mascotas y el arcade.</p>
            <dl class="estadisticas">
                ${Object.values(DIFICULTADES).map((d) => `<div><dt>Misión ${d.nombre.toLowerCase()}</dt><dd>🪙 ${d.monedas}</dd></div>`).join("")}
                <div><dt>Paso de misión principal</dt><dd>🪙 ${PREMIOS.submision.monedas}</dd></div>
                <div><dt>Misión principal completa</dt><dd>🪙 ${PREMIOS.principal.monedas}</dd></div>
                <div><dt>Tarea suelta o sesión de enfoque</dt><dd>Como una misión</dd></div>
                <div><dt>Escribir tu diario</dt><dd>🪙 ${diario.PREMIO_DIARIO.monedas}</dd></div>
                <div><dt>Cerrar el día (ritual)</dt><dd>🪙 ${rituales.PREMIO_CIERRE.monedas}</dd></div>
                <div><dt>Logros</dt><dd>Tú decides</dd></div>
            </dl>
        </details>`;
}
