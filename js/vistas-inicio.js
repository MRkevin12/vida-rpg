// vistas-inicio.js — Lo primero que se ve al abrir: «¿Cómo te sientes hoy?» y la portada de bienvenida.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as maestro from "./maestro.js";
import { rutaPintura } from "./pinturas.js";
import { figuraPixel } from "./retratos.js";
import { icono } from "./iconos.js";
import { esc } from "./vistas-comun.js";
import { textoFrecuencia } from "./vistas-hoy.js";

const { DIFICULTADES, ATRIBUTOS } = juego;

// ===== Bienvenida (al crear el personaje) =====
// b = { paso (1 a 3), misiones: Set, recompensas: Set }

// (v49) La portada de «¿Cómo te sientes hoy?»: pantalla completa con una pintura de fondo, el Maestro Aurelio y tres opciones.
// La frase cambia cada día (se elige por la fecha, no al azar, para que no salte al volver a dibujarla).
export function pantallaAnimo(nombre, hora, dia) {
    const saludo = hora < 6 ? "Aún es de madrugada" : hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
    const cita = maestro.CONSEJOS[dia % maestro.CONSEJOS.length];
    const opciones = [
        ["mal", "😔", "Mal", "Solo lo esencial. Un paso a la vez."],
        ["normal", "🙂", "Normal", "Lo justo para avanzar sin distracciones."],
        ["bien", "😄", "Bien", "Todo el reino a tu disposición."],
    ];
    return `
        <div class="animo-fondo" style="background-image: url('${rutaPintura("camino")}')" aria-hidden="true"></div>
        <div class="animo-caja">
            <p class="animo-marca">VIDA RPG</p>
            <div class="animo-maestro">
                <div class="animo-retrato" aria-hidden="true">${figuraPixel(maestro.describirMaestro())}</div>
                <div class="animo-burbuja">
                    <p class="animo-saludo">${saludo}, ${esc(nombre)}.</p>
                    <p class="animo-cita">«${esc(cita.texto)}»</p>
                    <p class="animo-autor">— ${esc(cita.autor)}, según ${esc(maestro.NOMBRE)}</p>
                </div>
            </div>
            <h2 class="animo-pregunta">¿Cómo te sientes hoy?</h2>
            <div class="animo-opciones">
                ${opciones.map(([clave, icono, titulo, nota]) => `
                    <button type="button" class="animo-opcion animo-${clave}" data-accion="elegir-animo" data-animo="${clave}">
                        <span class="animo-icono" aria-hidden="true">${icono}</span>
                        <span class="animo-texto"><b>${titulo}</b><small>${nota}</small></span>
                    </button>`).join("")}
            </div>
        </div>`;
}


export function pantallaBienvenida(b, nombre, plantillas) {
    const puntos = `<div class="pasos" aria-label="Paso ${b.paso} de 3">${[1, 2, 3].map((n) =>
        `<i class="${n === b.paso ? "actual" : n < b.paso ? "hecho" : ""}"></i>`).join("")}</div>`;
    const pie = (izquierda, derecha) => `<div class="botones-dialogo">${izquierda}${derecha}</div>`;

    if (b.paso === 1) {
        const idea = (icono, titulo, texto) => `<li><span>${icono}</span><div><b>${titulo}</b><small>${texto}</small></div></li>`;
        return `${puntos}
            <p class="etiqueta">Bienvenido, ${esc(nombre)}</p>
            <h2 class="titulo-juego titulo-grande">Así funciona</h2>
            <ul class="bienvenida-lista">
                ${idea("⚔️", "Misiones", "Cada hábito que cumples te da XP y monedas, y sube uno de tus cuatro atributos.")}
                ${idea("🔥", "Racha", "Cumple al menos una misión al día. Cada 7 días seguidos ganas un escudo que te protege si fallas.")}
                ${idea("👹", "Jefes", "Tus misiones golpean a jefes que representan la pereza, el miedo, la codicia…")}
                ${idea("🎁", "Tienda", "Cambia tus monedas por premios reales que tú decides. Así el premio se gana.")}
            </ul>
            ${pie(`<button type="button" class="boton boton-secundario" data-accion="bienvenida-saltar">Saltar</button>`,
                  `<button type="button" class="boton boton-principal" data-accion="bienvenida-paso" data-paso="2">Siguiente</button>`)}`;
    }

    if (b.paso === 2) {
        const grupos = Object.entries(ATRIBUTOS).map(([clave, a]) => `
            <h3 class="subtitulo">${a.icono} ${a.nombre}</h3>
            <div class="opciones-plantilla">${plantillas.misiones.filter((p) => p.atributo === clave).map((p) => {
                const detalle = `${DIFICULTADES[p.dificultad].nombre} · ${textoFrecuencia(p)}${p.cantidad ? ` · ${p.cantidad} ${p.unidad}` : ""}`;
                return `<button type="button" class="opcion-plantilla" data-accion="bienvenida-mision" data-id="${p.id}"
                                aria-pressed="${b.misiones.has(p.id)}"><b>${p.nombre}</b><small>${detalle}</small></button>`;
            }).join("")}</div>`).join("");
        return `${puntos}
            <h2 class="titulo-juego titulo-grande">Tus primeros hábitos</h2>
            <p class="nota">Elige pocos: con <b>2 o 3</b> basta para empezar. Después puedes cambiarlos o agregar los tuyos.</p>
            ${grupos}
            ${pie(`<button type="button" class="boton boton-secundario" data-accion="bienvenida-paso" data-paso="1">Atrás</button>`,
                  `<button type="button" class="boton boton-principal" data-accion="bienvenida-paso" data-paso="3">Siguiente${b.misiones.size ? ` (${b.misiones.size})` : ""}</button>`)}`;
    }

    return `${puntos}
        <h2 class="titulo-juego titulo-grande">¿Con qué te premias?</h2>
        <p class="nota">Estos premios cuestan monedas. La regla de oro: date ese gusto <b>solo</b> si lo canjeas aquí.
           Puedes cambiar los precios en la Tienda.</p>
        <div class="opciones-plantilla">${plantillas.recompensas.map((r) => `
            <button type="button" class="opcion-plantilla" data-accion="bienvenida-recompensa" data-id="${r.id}"
                    aria-pressed="${b.recompensas.has(r.id)}"><b>${r.nombre}</b><small>🪙 ${r.costo}</small></button>`).join("")}</div>
        ${pie(`<button type="button" class="boton boton-secundario" data-accion="bienvenida-paso" data-paso="2">Atrás</button>`,
              `<button type="button" class="boton boton-principal" data-accion="bienvenida-fin">¡Empezar!</button>`)}`;
}
