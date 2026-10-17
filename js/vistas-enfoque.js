// vistas-enfoque.js — El modo enfoque (concentración): el reloj con su anillo.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import { pixelarEnVivo } from "./retratos.js";
import { fechaCorta, lunesDe, relojTexto } from "./fechas.js";
import { esc, pildorasAtributo, encabezado } from "./vistas-comun.js";

const { DIFICULTADES, plural } = juego;

// ===== Pantalla: Modo enfoque (pomodoro) =====

const LARGO_ANILLO = 2 * Math.PI * 52;
   // largo del círculo del reloj (radio 52)

export function pantallaEnfoque(estado, ctx) {
    const { activo, sesiones } = estado.enfoque;
    const minutos = (lista) => lista.reduce((suma, s) => suma + s.minutos, 0);
    const deHoy = sesiones.filter((s) => s.fecha === ctx.hoy);
    const deSemana = sesiones.filter((s) => s.fecha >= lunesDe(ctx.hoy));
    const recientes = sesiones.slice(-10).reverse();

    let principal;
    if (activo) {
        // El reloj: app.js actualiza cada segundo el texto [data-reloj] y el anillo [data-anillo].
        const total = activo.minutos * 60 * 1000;
        const restante = Math.max(0, juego.finDelEnfoque(activo) - ctx.ahora);
        const a = juego.infoAtributo(estado, activo.atributo, activo.atributoPropio);
        principal = `
            <section class="panel enfoque-activo" style="--color-atributo: ${a.color}">
                <p class="etiqueta">Enfocado en ${esc(a.icono)} ${esc(a.nombre)}</p>
                <div class="reloj">
                    ${pixelarEnVivo(`<svg viewBox="0 0 120 120" aria-hidden="true">
                        <circle class="reloj-pista" cx="60" cy="60" r="52"/>
                        <circle class="reloj-arco" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"
                                stroke-dasharray="${LARGO_ANILLO}" stroke-dashoffset="${LARGO_ANILLO * (1 - restante / total)}"
                                data-anillo data-total="${total}" data-largo="${LARGO_ANILLO}"/>
                    </svg>`, 2.5)}
                    <span class="reloj-tiempo" data-reloj role="timer">${relojTexto(restante)}</span>
                </div>
                <p class="nota">Puedes bloquear el iPhone o salir de la app: el tiempo sigue contando y al volver
                   recibes tu premio. Lo único que no puede hacer es sonar si la app está cerrada.</p>
                <button type="button" class="boton boton-secundario boton-ancho" data-accion="cancelar-enfoque">Cancelar sesión</button>
            </section>`;
    } else {
        const duraciones = Object.entries(juego.ENFOQUE).map(([mins, dificultad]) => `
            <label class="pildora dificultad-${dificultad}">
                <input type="radio" name="minutos" value="${mins}" ${mins === "25" ? "checked" : ""}>
                <span>${mins} min<small>+${DIFICULTADES[dificultad].xp} XP</small></span>
            </label>`).join("");
        principal = `
            <section class="panel">
                <h2 class="titulo-juego">Nueva sesión</h2>
                <p class="nota">Elige un tiempo, deja el teléfono y concéntrate en una sola cosa.
                   Al terminar ganas lo mismo que una misión (XP, monedas y daño al jefe de ese atributo).
                   Si cancelas a la mitad, no hay premio.</p>
                <form data-form="enfoque" class="formulario">
                    <fieldset class="opciones"><legend>¿Cuánto tiempo?</legend>${duraciones}</fieldset>
                    <fieldset class="opciones opciones-4"><legend>¿En qué te vas a enfocar?</legend>${pildorasAtributo(estado, "intelecto")}</fieldset>
                    <button type="submit" class="boton boton-principal">Empezar</button>
                </form>
            </section>`;
    }

    const historial = recientes.map((s) => {
        const a = juego.infoAtributo(estado, s.atributo, s.atributoPropio);
        return `<li><span>${esc(a.icono)} ${s.minutos} min de ${esc(a.nombre)}</span><span class="texto-suave">${fechaCorta(s.fecha)} · +${s.xp} XP</span></li>`;
    }).join("");

    return `
        ${encabezado("⏱️ Modo enfoque", "hoy", "Hoy")}
        ${principal}
        <section class="panel">
            <h2 class="titulo-juego">Tu concentración</h2>
            <dl class="estadisticas">
                <div><dt>Hoy</dt><dd>${plural(deHoy.length, "sesión", "sesiones")} · ${minutos(deHoy)} min</dd></div>
                <div><dt>Esta semana</dt><dd>${plural(deSemana.length, "sesión", "sesiones")} · ${minutos(deSemana)} min</dd></div>
                <div><dt>En total</dt><dd>${plural(sesiones.length, "sesión", "sesiones")} · ${minutos(sesiones)} min</dd></div>
            </dl>
            ${historial ? `<h3 class="subtitulo">Últimas sesiones</h3><ul class="historial">${historial}</ul>` : ""}
        </section>`;
}
