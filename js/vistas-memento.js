// vistas-memento.js — La pantalla del calendario de Memento Mori y su tarjeta en Hoy (v142).
//
// Solo DIBUJA: recibe la partida y devuelve HTML. Las reglas están en memento.js y los botones en app-memento.js.
// La rejilla es un solo dibujo SVG (no 4000 elementos): cada fila usa dos «patrones» de casillas repetidas,
// uno para las semanas vividas y otro para las que quedan, y la semana de ahora es un cuadrito aparte que parpadea.

import * as memento from "./memento.js";
import { esc, encabezado, barra } from "./vistas-comun.js";

const miles = (n) => Math.round(n).toLocaleString("es-CO");
const decimal = (n) => n.toFixed(1).replace(".", ",");

// La tarjeta de Hoy (debajo de la de Finanzas).
export function tarjetaMementoHoy(estado, ctx) {
    const c = memento.calcular(estado.memento, ctx.hoy);
    const texto = c
        ? `Semana ${miles(c.actual)} de ${miles(c.total)} · ${decimal(c.porcentaje)} % de tu vida`
        : "Mira tu vida en semanas: una casilla por cada semana.";
    return `
        <div class="gym-hoy">
            <span class="gym-hoy-icono" aria-hidden="true">⏳</span>
            <span class="gym-hoy-texto"><b>Memento mori</b><small>${esc(texto)}</small></span>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="memento">Abrir</button>
        </div>`;
}

// ===== La rejilla =====
const CASILLA = 6;        // lo que mide cada casilla en el dibujo (5 de color + 1 de separación)
const MARGEN = 28;        // a la izquierda: los números de edad

export function rejillaMemento(c) {
    const ancho = MARGEN + memento.SEMANAS_POR_ANIO * CASILLA;
    const alto = c.filas * CASILLA + 2;
    const filas = [];
    for (let fila = 0; fila < c.filas; fila++) {
        const y = fila * CASILLA;
        const { vividas, ahora } = memento.casillasDeFila(fila, c.edad, c.semana);
        const futurasDesde = vividas + ahora;
        if (vividas) filas.push(`<rect x="${MARGEN}" y="${y}" width="${vividas * CASILLA}" height="${CASILLA}" fill="url(#mm-vive)"/>`);
        if (ahora) filas.push(`<rect class="mm-ahora" x="${MARGEN + vividas * CASILLA}" y="${y}" width="${CASILLA - 1}" height="${CASILLA - 1}"/>`);
        if (futurasDesde < memento.SEMANAS_POR_ANIO) {
            filas.push(`<rect x="${MARGEN + futurasDesde * CASILLA}" y="${y}" width="${(memento.SEMANAS_POR_ANIO - futurasDesde) * CASILLA}" height="${CASILLA}" fill="url(#mm-queda)"/>`);
        }
        if (fila % 10 === 0) filas.push(`<text class="mm-edad" x="${MARGEN - 4}" y="${y + CASILLA - 0.5}" text-anchor="end">${fila}</text>`);
    }
    return `
        <svg class="mm-rejilla" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" role="img"
             aria-label="Tu vida en semanas: ${miles(c.vividas)} vividas y ${miles(c.restantes)} por vivir">
            <defs>
                <pattern id="mm-vive" x="${MARGEN}" y="0" width="${CASILLA}" height="${CASILLA}" patternUnits="userSpaceOnUse"><rect class="mm-vivida" width="${CASILLA - 1}" height="${CASILLA - 1}"/></pattern>
                <pattern id="mm-queda" x="${MARGEN}" y="0" width="${CASILLA}" height="${CASILLA}" patternUnits="userSpaceOnUse"><rect class="mm-queda" width="${CASILLA - 1}" height="${CASILLA - 1}"/></pattern>
            </defs>
            ${filas.join("")}
        </svg>`;
}

// ===== La pantalla =====
export function pantallaMemento(estado, ctx) {
    const c = memento.calcular(estado.memento, ctx.hoy);
    return `
        ${encabezado("⏳ Memento mori", "hoy", "Hoy")}
        ${c ? vistaCalendario(estado, ctx, c) : vistaInicio(estado, ctx)}`;
}

// El formulario de los dos datos (se usa la primera vez y para cambiarlos).
function formularioDatos(estado, ctx, boton) {
    const m = estado.memento;
    return `
        <form data-form="memento-datos" class="formulario">
            <label class="formulario-grupo"><span>🎂 Tu fecha de nacimiento</span>
                <input type="date" name="nacimiento" required value="${esc(m.nacimiento || "")}" min="${memento.NACIMIENTO_MIN}" max="${ctx.hoy}"></label>
            <label class="formulario-grupo"><span>🕰️ ¿Hasta qué edad cuentas vivir? (años)</span>
                <input type="text" name="esperanza" inputmode="numeric" required value="${m.esperanza}" autocomplete="off"></label>
            <p class="mini texto-suave">${memento.ESPERANZA_INICIAL} es un promedio, no una promesa: ponle el número que quieras (de ${memento.ESPERANZA_MIN} a ${memento.ESPERANZA_MAX}).
               Tu fecha se guarda solo en este teléfono (y en tu copia de seguridad).</p>
            <button type="submit" class="boton boton-principal boton-ancho">${boton}</button>
        </form>`;
}

function vistaInicio(estado, ctx) {
    return `
        <section class="panel mm-intro">
            <p class="etiqueta">Memento mori · «recuerda que vas a morir»</p>
            <p>Una vida de ${memento.ESPERANZA_INICIAL} años tiene unas <b>4.160 semanas</b>. Aquí cada semana es una casilla: las que ya viviste, la de hoy y las que quedan.</p>
            <p class="nota">No es para asustarte: es para que cada semana cuente.</p>
            ${formularioDatos(estado, ctx, "⏳ Ver mi calendario")}
        </section>`;
}

function vistaCalendario(estado, ctx, c) {
    const frase = memento.fraseDelDia(ctx.hoy);
    const dato = (icono, titulo, valor, pista = "") => `
        <div class="mm-dato"><small>${icono} ${titulo}</small><b>${valor}</b>${pista ? `<em>${pista}</em>` : ""}</div>`;
    return `
        <section class="panel mm-frase">
            <p>«${esc(frase.texto)}»</p>
            <small>— ${esc(frase.autor)}</small>
        </section>

        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">Tu vida en semanas</h2>
                <p class="contador">${decimal(c.porcentaje)} %</p>
            </div>
            ${barra(c.porcentaje, "barra-gym")}
            ${rejillaMemento(c)}
            <ul class="mm-leyenda" aria-label="Leyenda">
                <li><i class="mm-muestra vivida"></i> Vivida</li>
                <li><i class="mm-muestra ahora"></i> Esta semana</li>
                <li><i class="mm-muestra queda"></i> Por vivir</li>
            </ul>
            <p class="mini texto-suave">Cada fila es un año de tu vida (empieza en tu cumpleaños); cada casilla, una semana.${c.superada ? " Ya pasaste los años que contabas: ¡cada semana de más es un regalo!" : ""}</p>
        </section>

        <section class="mm-datos">
            ${dato("🎂", "Tu edad", `${c.edad} años`, `semana ${c.semana + 1} de ese año`)}
            ${dato("🟨", "Semanas vividas", miles(c.vividas), `${miles(c.diasVividos)} días`)}
            ${dato("⬜", "Semanas por vivir", miles(c.restantes), c.superada ? "" : `${miles(c.diasRestantes)} días`)}
            ${dato("🌤️", "Fines de semana", miles(c.restantes), "los que te quedan")}
        </section>

        <details class="plegable">
            <summary>⚙️ Cambiar mis datos</summary>
            ${formularioDatos(estado, ctx, "Guardar")}
            <button type="button" class="boton boton-chico boton-secundario" data-accion="memento-quitar">🗑 Quitar mi calendario</button>
        </details>`;
}

