// vistas-memento.js — La pantalla del calendario de Memento Mori y su tarjeta en Hoy (v142).
//
// Solo DIBUJA: recibe la partida y devuelve HTML. Las reglas están en memento.js y los botones en app-memento.js.
// La rejilla es un solo dibujo SVG (no 4000 elementos): cada fila usa dos «patrones» de casillas repetidas,
// uno para las semanas vividas y otro para las que quedan, y la semana de ahora es un cuadrito aparte que parpadea.
// (v147) Cada etapa de la vida tiene su color, las semanas en que corriste o cumpliste una meta van marcadas, y al
// tocar una casilla se ven sus fechas.

import * as memento from "./memento.js";
import { esc, encabezado, barra } from "./vistas-comun.js";
import { MESES_CORTOS } from "./fechas.js";

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
export const CASILLA = 6;        // lo que mide cada casilla en el dibujo (5 de color + 1 de separación)
export const MARGEN = 28;        // a la izquierda: los números de edad

// (v147) Cada etapa de la vida tiene su color (estilos.css: .e-infancia, .e-juventud…): sus semanas vividas, fuertes, y las
// que quedan, apagadas. Por eso hay dos patrones por etapa (10 en total: siguen siendo pocos elementos).
// marcas = { carrera, meta } (memento.semanasMarcadas): las semanas vividas en que corriste o cumpliste una meta se pintan
// encima, todas en DOS <path> (uno por color). Tocar una casilla (data-accion) muestra sus fechas (app-memento.js).
export function rejillaMemento(c, marcas = { carrera: new Set(), meta: new Set() }) {
    const S = memento.SEMANAS_POR_ANIO;
    const ancho = MARGEN + S * CASILLA;
    const alto = c.filas * CASILLA + 2;
    const filas = [];
    for (let fila = 0; fila < c.filas; fila++) {
        const y = fila * CASILLA;
        const etapa = memento.etapaDeEdad(fila).id;
        const { vividas, ahora } = memento.casillasDeFila(fila, c.edad, c.semana);
        const futurasDesde = vividas + ahora;
        if (vividas) filas.push(`<rect x="${MARGEN}" y="${y}" width="${vividas * CASILLA}" height="${CASILLA}" fill="url(#mm-vive-${etapa})"/>`);
        if (ahora) filas.push(`<rect class="mm-ahora" x="${MARGEN + vividas * CASILLA}" y="${y}" width="${CASILLA - 1}" height="${CASILLA - 1}"/>`);
        if (futurasDesde < S) {
            filas.push(`<rect x="${MARGEN + futurasDesde * CASILLA}" y="${y}" width="${(S - futurasDesde) * CASILLA}" height="${CASILLA}" fill="url(#mm-queda-${etapa})"/>`);
        }
        if (fila % 10 === 0) filas.push(`<text class="mm-edad" x="${MARGEN - 4}" y="${y + CASILLA - 0.5}" text-anchor="end">${fila}</text>`);
    }
    // Las marcas: un cuadrito por semana (meta: la casilla entera; carrera: entera, o al centro si esa semana también hubo meta).
    const cuadrito = (indice, adentro = 0) => {
        const lado = CASILLA - 1 - 2 * adentro;
        return `M${MARGEN + (indice % S) * CASILLA + adentro} ${Math.floor(indice / S) * CASILLA + adentro}h${lado}v${lado}h${-lado}z`;
    };
    const vivida = (indice) => indice < c.vividas && indice < c.filas * S;
    const dMeta = [...marcas.meta].filter(vivida).map((i) => cuadrito(i)).join("");
    const dCarrera = [...marcas.carrera].filter(vivida).map((i) => cuadrito(i, marcas.meta.has(i) ? 1 : 0)).join("");
    const patron = (id, clase, etapa) => `<pattern id="${id}-${etapa}" x="${MARGEN}" y="0" width="${CASILLA}" height="${CASILLA}" patternUnits="userSpaceOnUse"><rect class="${clase} e-${etapa}" width="${CASILLA - 1}" height="${CASILLA - 1}"/></pattern>`;
    return `
        <svg class="mm-rejilla" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" role="img" data-accion="memento-semana" data-filas="${c.filas}"
             aria-label="Tu vida en semanas: ${miles(c.vividas)} vividas y ${miles(c.restantes)} por vivir. Toca una casilla para ver sus fechas.">
            <defs>${memento.ETAPAS.map((e) => patron("mm-vive", "mm-vivida", e.id) + patron("mm-queda", "mm-queda", e.id)).join("")}</defs>
            ${filas.join("")}
            ${dMeta ? `<path class="mm-meta" d="${dMeta}"/>` : ""}${dCarrera ? `<path class="mm-carrera" d="${dCarrera}"/>` : ""}
            <rect class="mm-elegida" x="-20" y="-20" width="${CASILLA + 1}" height="${CASILLA + 1}"/>
        </svg>`;
}

// (v147) La casilla que tocaste: «Semana 1.592 · del 2 al 8 de oct de 2026 · corriste». c = memento.calcular(…).
const fechaLarga = (texto, conMes = true, conAnio = true) => {
    const [anio, mes, dia] = texto.split("-").map(Number);
    return `${dia}${conMes ? ` de ${MESES_CORTOS[mes - 1]}` : ""}${conAnio ? ` de ${anio}` : ""}`;
};
export function textoDeSemana(nacimiento, indice, c, marcas = { carrera: new Set(), meta: new Set() }) {
    const s = memento.semanaDeIndice(nacimiento, indice);
    const mismoAnio = s.desde.slice(0, 4) === s.hasta.slice(0, 4);
    const mismoMes = mismoAnio && s.desde.slice(5, 7) === s.hasta.slice(5, 7);
    const rango = `del ${fechaLarga(s.desde, !mismoMes, !mismoAnio)} al ${fechaLarga(s.hasta)}`;
    const que = indice === c.vividas ? "esta semana"
        : indice > c.vividas ? "por vivir"
        : [marcas.meta.has(indice) ? "meta cumplida" : "", marcas.carrera.has(indice) ? "corriste" : ""].filter(Boolean).join(" y ");
    return `Semana ${miles(s.numero)} · ${s.fila} años · ${rango}${que ? ` · ${que}` : ""}`;
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
    const frase = memento.fraseDelDia(ctx.hoy, c.edad);   // (v148) la frase le habla a tu etapa de la vida
    const marcas = memento.semanasMarcadas(estado);   // (v147) solo lee: las semanas en que corriste o cumpliste una meta
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
            ${rejillaMemento(c, marcas)}
            <p class="mm-info" data-mm-info aria-live="polite">Toca una casilla para ver qué semana es.</p>
            <ul class="mm-leyenda mm-etapas" aria-label="Las etapas de la vida">
                ${memento.ETAPAS.map((e) => `<li><i class="mm-muestra e-${e.id}"></i> ${e.nombre} <small>${e.hasta === Infinity ? `${e.desde}+` : `${e.desde}–${e.hasta}`}</small></li>`).join("")}
            </ul>
            <ul class="mm-leyenda" aria-label="Leyenda">
                <li><i class="mm-muestra ahora"></i> Esta semana</li>
                <li><i class="mm-muestra carrera"></i> Corriste</li>
                <li><i class="mm-muestra meta"></i> Meta cumplida</li>
                <li><i class="mm-muestra queda"></i> Por vivir</li>
            </ul>
            <p class="mini texto-suave">Cada fila es un año de tu vida (empieza en tu cumpleaños); cada casilla, una semana. Meta cumplida: tus km de running, tus días de gym o misiones los 7 días.${c.superada ? " Ya pasaste los años que contabas: ¡cada semana de más es un regalo!" : ""}</p>
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

