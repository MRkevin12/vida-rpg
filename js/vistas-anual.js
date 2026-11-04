// vistas-anual.js — La ventana «Tu año» (v181). Parte de vistas.js.
//
// Como todas las vistas: recibe datos y devuelve un texto con HTML; no cambia la partida.
// Los números salen de anual.js.

import { resumenAnual, aniosConDatos } from "./anual.js";
import { MESES, MESES_CORTOS, fechaCorta } from "./fechas.js";
import { ficha } from "./vistas-comun.js";

const miles = (n) => Math.round(n).toLocaleString("es-MX");
const decimal = (n) => String(n).replace(".", ",");
const nota = (texto) => `<span class="ficha-nota">${texto}</span>`;

// Las 12 columnas de «misiones por mes». El mes más fuerte va en violeta (solo color de datos, como en Progreso).
function graficaMeses(r) {
    const maximo = Math.max(1, ...r.porMes);
    const columnas = r.porMes.map((n, i) => `
            <li class="${i === r.mejorMes ? "mejor" : ""}" title="${MESES[i]}: ${n}">
                <i style="height: ${Math.round((n / maximo) * 100)}%"></i>
                <small>${MESES_CORTOS[i][0].toUpperCase()}</small>
            </li>`).join("");
    return `<ol class="anual-meses" aria-label="Misiones completadas por mes">${columnas}</ol>`;
}

export function contenidoAnual(estado, hoy, anio = Number(hoy.slice(0, 4))) {
    const anios = aniosConDatos(estado, hoy);
    if (!anios.includes(anio)) anio = anios[0];
    const r = resumenAnual(estado, anio, hoy);
    const vacioAnio = r.misiones === 0 && r.gym.sesiones === 0 && r.running.carreras === 0;

    // Selector de año (solo si hay más de uno). Cambia el contenido sin cerrar la ventana.
    const selector = anios.length > 1
        ? `<div class="selector" role="group" aria-label="Año">${anios.map((a) =>
            `<button type="button" data-accion="anio-anual" data-anio="${a}" aria-pressed="${a === anio}">${a}</button>`).join("")}</div>`
        : "";

    const racha = r.racha.dias > 0
        ? nota(`${fechaCorta(r.racha.desde)} → ${fechaCorta(r.racha.hasta)}`)
        : nota("Aún sin racha");
    const fichas = [
        ficha("Misiones", miles(r.misiones), nota(`${miles(r.xp)} XP ganados`)),
        ficha("Días perfectos", r.perfectos, nota(`${r.diasActivos} días con actividad`)),
        ficha("Mejor racha", `🔥 ${r.racha.dias}`, racha),
        ficha("Mes más fuerte", r.mejorMes === null ? "—" : MESES[r.mejorMes], nota(r.mejorMes === null ? "Sin datos" : `${r.porMes[r.mejorMes]} misiones`)),
        ficha("Kilos levantados", `${miles(r.gym.volumen)} <small>kg</small>`, nota(`${r.gym.sesiones} sesiones · ${r.gym.records} récords`)),
        ficha("Kilómetros", `${decimal(r.running.km)} <small>km</small>`,
              nota(r.running.carreras ? `${r.running.carreras} carreras · la más larga ${decimal(r.running.masLarga)} km` : "Sin carreras")),
        ficha("Enfoque", `${decimal(Math.round(r.enfoque.minutos / 6) / 10)} <small>h</small>`, nota(`${r.enfoque.sesiones} sesiones`)),
        ficha("Jefes vencidos", r.jefesHastaHoy, nota("En toda tu partida")),
    ].join("");

    return `
        <h2 class="titulo-juego" tabindex="-1" autofocus>🎆 Tu año ${anio}</h2>
        ${selector}
        ${vacioAnio ? `<p class="nota">Este año todavía no hay nada que contar. Vuelve cuando hayas completado algunas misiones.</p>` : `
        <div class="fichas-dato">${fichas}</div>
        <h3 class="subtitulo">Misiones por mes</h3>
        ${graficaMeses(r)}
        <p class="nota">Además: ${r.tareas} tareas hechas y ${r.diario} días con diario.</p>`}
        <div class="botones-dialogo">
            <button type="button" class="boton boton-principal" data-accion="cerrar">Cerrar</button>
        </div>`;
}
