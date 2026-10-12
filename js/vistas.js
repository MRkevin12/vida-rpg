// vistas.js — Convierte la partida en HTML.
//
// Cada función recibe el estado y devuelve un texto con HTML.
// app.js pone ese texto dentro de la pantalla que corresponde.
// Aquí no se cambia nada de la partida: solo se "dibuja".
//
// Los botones llevan atributos data-accion="..." y data-id="...".
// app.js escucha los toques y, según data-accion, sabe qué hacer.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import { dibujarAvatar, dibujarMascota } from "./dibujo.js";
import { calcularResumen } from "./resumen.js";
import { fechaLegible, fechaCorta, MESES_CORTOS, DIAS_LETRAS, desdeTexto, diaDeSemana } from "./fechas.js";

const { DIFICULTADES, ATRIBUTOS, PREMIOS, ESCUDOS, plural } = juego;


// ===== Ayudantes =====

// "Escapa" el texto escrito por el usuario para que no se interprete como HTML.
// Ej: si una misión se llama "<b>gym</b>", se muestra tal cual y no en negrita.
export function esc(texto) {
    const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto).replace(/[&<>"']/g, (letra) => reemplazos[letra]);
}

// Íconos dibujados con SVG (líneas simples).
export const ICONOS = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    editar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/></svg>',
};

function barra(porcentaje, clase = "") {
    return `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;
}

function vacio(texto) {
    return `<p class="vacio">${texto}</p>`;
}

function cabeceraSeccion(titulo, dialogo, textoBoton) {
    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="${dialogo}">${textoBoton}</button>
        </div>`;
}

function chipAtributo(clave) {
    const a = ATRIBUTOS[clave];
    return `<span class="chip-atributo" style="--color-atributo: ${a.color}">${a.icono} ${a.nombre}</span>`;
}

function botonEditar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.editar}</button>`;
}

function botonCerrar(accion, id, etiqueta) {
    return `<button type="button" class="boton-icono" data-accion="${accion}" data-id="${id}" aria-label="${esc(etiqueta)}">${ICONOS.cerrar}</button>`;
}


// ===== Pantalla: Hoy =====

export function pantallaHoy(estado, ctx) {
    // ctx.fechaVista es hoy o ayer (por si olvidaste marcar algo ayer).
    const fecha = ctx.fechaVista;
    const esAyer = fecha !== ctx.hoy;
    const racha = ctx.info.racha;
    const hechasEseDia = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));

    const delDia = juego.misionesDelDia(estado.misiones, fecha);           // las que tocan ese día
    const otrosDias = estado.misiones.filter((m) => !m.archivadaEn && !delDia.includes(m));
    const archivadas = estado.misiones.filter((m) => m.archivadaEn);
    const hechas = delDia.filter((m) => hechasEseDia.has(m.id)).length;
    const todoListo = delDia.length > 0 && hechas === delDia.length;
    const sinMisiones = estado.misiones.every((m) => m.archivadaEn);

    let lista;
    if (delDia.length) {
        lista = `<ul class="lista">${delDia.map((m) => tarjetaMision(m, hechasEseDia.has(m.id), ctx.recienHecha === m.id)).join("")}</ul>`;
    } else if (sinMisiones) {
        lista = vacio("Aún no tienes misiones diarias.<br>Crea tu primer hábito: ir al gym, leer, estudiar inglés…");
    } else {
        lista = vacio(`${esAyer ? "Ayer fue" : "Hoy es"} día de descanso: no ${esAyer ? "tocaba" : "toca"} ninguna misión.<br>Tu racha no se rompe.`);
    }

    return `
        ${tarjetaHeroe(ctx)}

        <div class="titulo-seccion">
            <div>
                <p class="etiqueta">${fechaLegible(fecha)}</p>
                <h2 class="titulo-juego">Misiones de ${esAyer ? "ayer" : "hoy"}</h2>
            </div>
            <p class="contador ${todoListo ? "completo" : ""}">${hechas}/${delDia.length}</p>
        </div>

        <div class="chips">
            <span class="chip chip-racha">🔥 ${plural(racha.actual, "día", "días")}</span>
            <span class="chip">🛡️ ${racha.escudos}/${ESCUDOS.maximo}</span>
            <button type="button" class="chip chip-arcade" data-accion="ir" data-pantalla="arcade">
                🎮 ${plural(arcade.fichasDisponibles(estado), "ficha", "fichas")}</button>
            ${todoListo ? '<span class="chip chip-oro">✨ Día perfecto</span>' : ""}
        </div>

        <!-- Selector de día: hoy, o ayer por si se te olvidó marcar algo -->
        <div class="selector" role="group" aria-label="Día">
            <button type="button" data-accion="ver-fecha" data-dia="ayer" aria-pressed="${esAyer}">Ayer</button>
            <button type="button" data-accion="ver-fecha" data-dia="hoy" aria-pressed="${!esAyer}">Hoy</button>
        </div>
        ${esAyer ? '<p class="nota">Estás viendo <b>ayer</b>. Marca lo que hiciste y se te olvidó anotar.</p>' : ""}

        ${ctx.recordarRespaldo ? avisoRespaldo() : ""}
        ${lista}

        <button type="button" class="boton boton-principal boton-ancho" data-accion="abrir" data-dialogo="mision">
            + Nueva misión diaria
        </button>

        ${plegable(`Otros días (${otrosDias.length})`,
            `<ul class="lista">${otrosDias.map((m) => filaMision(m, "editar")).join("")}</ul>`, otrosDias.length)}
        ${plegable(`Archivadas (${archivadas.length})`,
            `<ul class="lista">${archivadas.map((m) => filaMision(m, "restaurar")).join("")}</ul>`, archivadas.length)}

        ${jefesEnCombate(estado, ctx)}`;
}

// "L · X · V" (o "Todos los días").
function textoDias(mision) {
    return mision.dias ? mision.dias.map((d) => DIAS_LETRAS[d]).join(" · ") : "Todos los días";
}

function detalleMision(mision) {
    const d = DIFICULTADES[mision.dificultad];
    const a = ATRIBUTOS[mision.atributo];
    return `${a.icono} ${a.nombre} · ${d.nombre} · +${d.xp} XP${mision.dias ? ` · ${textoDias(mision)}` : ""}`;
}

function tarjetaMision(mision, hecha, recienHecha) {
    const clases = ["mision", `dificultad-${mision.dificultad}`, hecha ? "hecha" : "", recienHecha ? "recien-hecha" : ""];
    return `
        <li class="${clases.join(" ")}" data-id="${mision.id}">
            <button type="button" class="boton-check" data-accion="alternar-mision" data-id="${mision.id}"
                    aria-pressed="${hecha}" aria-label="Marcar ${esc(mision.nombre)}">${ICONOS.check}</button>
            <div class="mision-info">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(mision)}</span>
            </div>
            ${botonEditar("editar-mision", mision.id, `Editar ${mision.nombre}`)}
        </li>`;
}

// Misión que no se puede marcar ahora (toca otro día, o está archivada).
function filaMision(mision, accion) {
    const boton = accion === "restaurar"
        ? `<button type="button" class="boton boton-chico" data-accion="restaurar-mision" data-id="${mision.id}">Restaurar</button>`
        : botonEditar("editar-mision", mision.id, `Editar ${mision.nombre}`);
    return `
        <li class="mision apagada dificultad-${mision.dificultad}">
            <div class="mision-info">
                <span class="mision-nombre">${esc(mision.nombre)}</span>
                <span class="mision-detalle">${detalleMision(mision)}${mision.dias ? "" : " · Todos los días"}</span>
            </div>
            ${boton}
        </li>`;
}

// Texto del ánimo del avatar, con los números del momento.
function textoAnimo(a, ctx) {
    const animo = avatar.ANIMOS[a.animo];
    if (a.animo === "llamas") return `${animo.icono} ¡En llamas! Racha de ${ctx.info.racha.actual} días.`;
    if (a.animo === "dormido") return `${animo.icono} Zzz… ${a.diasSinMision} días sin misiones. Completa una para despertarlo.`;
    return `${animo.icono} ${animo.texto}`;
}

// Tarjeta del héroe arriba de "Hoy". Salta cuando completas una misión.
function tarjetaHeroe(ctx) {
    const a = ctx.avatar;
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS, a.etapa);
    return `
        <button type="button" class="heroe ${ctx.recienHecha ? "saltar" : ""}" data-accion="ir" data-pantalla="personaje">
            <span class="heroe-avatar">${dibujarAvatar(a)}</span>
            <span class="heroe-info">
                <span class="etiqueta">${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</span>
                <span class="heroe-animo">${textoAnimo(a, ctx)}</span>
                <span class="mini texto-suave">${siguiente
                    ? `Evoluciona a ${siguiente.nombre} en el nivel ${siguiente.desde}`
                    : "¡Etapa máxima alcanzada!"}</span>
                <span class="mini heroe-ver">Ver personaje ›</span>
            </span>
        </button>`;
}

function avisoRespaldo() {
    return `
        <div class="aviso-respaldo">
            <span>💾 Tus datos viven solo en este teléfono. Haz una copia de seguridad.</span>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="ajustes">Ir a ajustes</button>
        </div>`;
}


// ===== Pantalla: Progreso (racha, calendario y atributos) =====

export function pantallaProgreso(estado, ctx) {
    const { racha, diasPerfectos } = ctx.info;
    const escudos = Array.from({ length: ESCUDOS.maximo }, (_, i) =>
        `<span class="escudo ${i < racha.escudos ? "lleno" : ""}">🛡️</span>`).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Racha</h2>
            <div class="racha-datos">
                <div><span class="racha-numero">🔥 ${racha.actual}</span><span class="etiqueta">Actual</span></div>
                <div><span class="racha-numero">🏅 ${racha.mejor}</span><span class="etiqueta">Mejor</span></div>
                <div><span class="racha-numero escudos">${escudos}</span><span class="etiqueta">Escudos</span></div>
            </div>
            <p class="nota">Un día cuenta si completas al menos 1 misión. Cada ${ESCUDOS.diasParaGanar} días seguidos
               ganas un escudo (máx. ${ESCUDOS.maximo}): si fallas un día, el escudo salva tu racha.</p>
        </section>

        ${seccionResumen(estado, ctx)}

        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">Calendario</h2>
                <span class="texto-suave mini">✨ ${plural(diasPerfectos, "día perfecto", "días perfectos")}</span>
            </div>
            ${mapaDeCalor(estado, ctx)}
            <div class="cal-leyenda">
                <span>Menos</span>
                <i class="celda n0"></i><i class="celda n1"></i><i class="celda n2"></i><i class="celda n3"></i><i class="celda n4"></i>
                <span>Más</span>
                <i class="celda n0 protegido"></i><span>Escudo</span>
            </div>
            <p class="cal-detalle" id="cal-detalle">${detalleDia(estado, ctx.diaSeleccionado, racha)}</p>
        </section>

        <section class="panel">
            <h2 class="titulo-juego">Atributos</h2>
            <div class="atributos">${Object.keys(ATRIBUTOS).map((clave) => tarjetaAtributo(estado, clave)).join("")}</div>
        </section>

        <section class="panel">
            <h2 class="titulo-juego">Estadísticas</h2>
            <dl class="estadisticas">
                <div><dt>Misiones diarias completadas</dt><dd>${ctx.info.totalCompletadas}</dd></div>
                <div><dt>Días perfectos</dt><dd>${diasPerfectos}</dd></div>
                <div><dt>Misiones principales</dt><dd>${ctx.info.principalesCompletadas}</dd></div>
                <div><dt>Jefes derrotados</dt><dd>${ctx.info.jefesDerrotados}</dd></div>
                <div><dt>Recompensas canjeadas</dt><dd>${estado.canjes.length}</dd></div>
                <div><dt>XP total</dt><dd>${estado.personaje.xp}</dd></div>
            </dl>
        </section>`;
}

function mapaDeCalor(estado, ctx) {
    const { dias, semanas } = juego.datosCalendario(estado, ctx.hoy, ctx.info.racha);

    // Etiquetas de los meses: se ponen en la semana donde empieza cada mes.
    const meses = [];
    for (let semana = 0; semana < semanas; semana++) {
        const semanaDias = dias.slice(semana * 7, semana * 7 + 7);
        const inicioDeMes = semanaDias.find((d) => desdeTexto(d.fecha).getDate() === 1);
        const mes = inicioDeMes ? MESES_CORTOS[desdeTexto(inicioDeMes.fecha).getMonth()] : "";
        meses.push(`<span>${mes}</span>`);
    }

    const celdas = dias.map((dia) => {
        if (dia.tipo === "futuro") return '<span class="celda futuro"></span>';
        if (dia.tipo === "antes") return '<span class="celda antes"></span>';
        const clases = ["celda", `n${dia.nivel}`];
        if (dia.protegido) clases.push("protegido");
        if (dia.fecha === ctx.hoy) clases.push("hoy");
        if (dia.fecha === ctx.diaSeleccionado) clases.push("elegido");
        return `<button type="button" class="${clases.join(" ")}" data-accion="ver-dia" data-fecha="${dia.fecha}"
                    aria-label="${fechaLegible(dia.fecha)}: ${dia.hechas} de ${dia.total}"></button>`;
    }).join("");

    return `
        <div class="calendario-scroll" id="calendario-scroll">
            <div class="calendario">
                <span></span>
                <div class="cal-meses">${meses.join("")}</div>
                <div class="cal-dias"><span>L</span><span></span><span>X</span><span></span><span>V</span><span></span><span>D</span></div>
                <div class="cal-grid">${celdas}</div>
            </div>
        </div>`;
}

// Texto que aparece al tocar un día del calendario.
export function detalleDia(estado, fecha, racha) {
    if (!fecha) return "Toca un día del calendario para ver qué hiciste.";

    const hechas = estado.completadas.filter((c) => c.fecha === fecha);
    const total = juego.misionesActivasEn(estado.misiones, fecha);
    const nombres = hechas.map((c) => {
        const mision = estado.misiones.find((m) => m.id === c.misionId);
        return esc(mision ? mision.nombre : "misión borrada");
    });
    const protegido = racha.protegidos.has(fecha) ? " · 🛡️ protegido por un escudo" : "";

    return `<strong>${fechaLegible(fecha)}</strong>: ${hechas.length} de ${total}${protegido}` +
           (nombres.length ? `<br><span class="texto-suave">${nombres.join(" · ")}</span>` : "");
}

function tarjetaAtributo(estado, clave) {
    const a = ATRIBUTOS[clave];
    const n = juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO);
    return `
        <div class="atributo" style="--color-atributo: ${a.color}">
            <div class="atributo-cabecera">
                <span class="atributo-icono">${a.icono}</span>
                <span class="atributo-nombre">${a.nombre}</span>
                <span class="atributo-nivel">Nv ${n.nivel}</span>
            </div>
            ${barra(n.porcentaje, "barra-mini barra-atributo")}
            <span class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP</span>
        </div>`;
}


// ===== Resumen con gráficas (dentro de Progreso) =====
// Reglas que seguimos en las gráficas:
//   - Un solo color para los datos (el violeta de la app, comprobado sobre el fondo oscuro).
//   - Columnas delgadas, con la punta redondeada y la base recta.
//   - Los textos van en color de texto, nunca en el color de la gráfica.
//   - Todo valor se puede leer sin la gráfica: tocando una columna o en "Ver como tabla".

const COLOR_DATO = "#8b5cf6";       // el color de las barras
const COLOR_APAGADO = "#4a4468";    // barras que no son las destacadas
const NOMBRE_DIA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function seccionResumen(estado, ctx) {
    const r = calcularResumen(estado, ctx.hoy, ctx.rangoResumen);
    const periodo = `${r.dias} días`;

    // Cambio frente al periodo anterior, con flecha y texto (no solo color).
    const cambio = (valor, unidad) => {
        if (valor === null) return `<span class="ficha-nota">Aún no hay un periodo anterior completo para comparar</span>`;
        if (valor === 0) return `<span class="ficha-nota">Igual que los ${periodo} anteriores</span>`;
        const sube = valor > 0;
        return `<span class="ficha-nota">${sube ? "▲" : "▼"} ${Math.abs(valor)} ${unidad} ${sube ? "más" : "menos"} que los ${periodo} anteriores</span>`;
    };
    const ficha = (etiqueta, valor, nota) =>
        `<div class="ficha-dato"><span class="ficha-etiqueta">${etiqueta}</span><span class="ficha-valor">${valor}</span>${nota}</div>`;

    const misiones = r.misiones.length
        ? `<ul class="medidores">${r.misiones.map((m) => `
               <li>
                   <div class="medidor-fila"><span>${esc(m.nombre)}</span><span class="texto-suave">${m.hechas} de ${m.total} · ${m.pct} %</span></div>
                   <div class="medidor"><div style="width: ${m.pct}%"></div></div>
               </li>`).join("")}</ul>`
        : vacio("En este periodo no tocaba ninguna misión.");

    // Barras por atributo: la del atributo descuidado va en violeta y las demás en gris.
    const maximo = Math.max(1, ...r.atributos.map((a) => a.hechas));
    const atributos = r.atributos.map((a) => {
        const info = ATRIBUTOS[a.clave];
        const color = a.clave === r.descuidado ? COLOR_DATO : COLOR_APAGADO;
        return `<li>
                    <span class="ba-nombre">${info.icono} ${info.nombre}</span>
                    <span class="ba-pista"><i style="width: ${(a.hechas / maximo) * 100}%; background: ${color}"></i></span>
                    <span class="ba-valor">${a.hechas}</span>
                </li>`;
    }).join("");

    let consejo = "Aún no completas misiones en este periodo.";
    if (r.descuidado) {
        const info = ATRIBUTOS[r.descuidado];
        const hechas = r.atributos.find((a) => a.clave === r.descuidado).hechas;
        consejo = `El más descuidado: <b>${info.icono} ${info.nombre}</b> (${plural(hechas, "misión", "misiones")} en ${periodo}).`;
    } else if (r.atributos.some((a) => a.hechas > 0)) {
        consejo = "Vas parejo en los cuatro atributos.";
    }

    const ultimo = r.porDia.length - 1;   // al abrir, el detalle muestra el día de hoy
    return `
        <section class="panel resumen">
            <h2 class="titulo-juego">Resumen</h2>
            <!-- El periodo va arriba porque aplica a todo lo de abajo -->
            <div class="selector" role="group" aria-label="Periodo">
                <button type="button" data-accion="rango-resumen" data-dias="7" aria-pressed="${r.dias === 7}">Últimos 7 días</button>
                <button type="button" data-accion="rango-resumen" data-dias="30" aria-pressed="${r.dias === 30}">Últimos 30 días</button>
            </div>

            <div class="fichas-dato">
                ${ficha("Cumplimiento", r.cumplimiento.pct === null ? "—" : `${r.cumplimiento.pct} %`, cambio(r.cambio, "puntos"))}
                ${ficha("Días perfectos", `${r.perfectos} <small>de ${r.diasConMisiones}</small>`,
                        `<span class="ficha-nota">Días con todas las misiones hechas</span>`)}
                ${ficha("XP de misiones", r.xp, cambio(r.xpAnterior === null ? null : r.xp - r.xpAnterior, "XP"))}
                ${ficha("Tu mejor día", r.mejorDia ? NOMBRE_DIA[r.mejorDia.dia] : "—",
                        `<span class="ficha-nota">${r.mejorDia ? `${r.mejorDia.pct} % en las últimas 4 semanas` : "Aún no hay datos"}</span>`)}
            </div>

            <h3 class="subtitulo">Cumplimiento por día</h3>
            ${graficaDias(r, ultimo)}
            <p class="cal-detalle" id="resumen-detalle">${textoDiaResumen(r.porDia[ultimo])}</p>
            <details class="plegable">
                <summary>Ver como tabla</summary>
                <table class="tabla-datos">
                    <thead><tr><th>Día</th><th>Hechas</th><th>Tocaban</th><th>%</th></tr></thead>
                    <tbody>${r.porDia.filter((d) => !d.antes).map((d) =>
                        `<tr><td>${fechaCorta(d.fecha)}</td><td>${d.hechas}</td><td>${d.total}</td><td>${d.pct === null ? "descanso" : `${d.pct} %`}</td></tr>`).join("")}</tbody>
                </table>
            </details>

            <h3 class="subtitulo">Por misión</h3>
            ${misiones}

            <h3 class="subtitulo">Misiones completadas por atributo</h3>
            <ul class="barras-atributo">${atributos}</ul>
            <p class="nota">${consejo}</p>
        </section>`;
}

// Texto de un día del resumen (se muestra al tocar su columna).
export function textoDiaResumen(dia) {
    if (dia.antes) return `<strong>${fechaLegible(dia.fecha)}</strong>: todavía no jugabas.`;
    if (dia.pct === null) return `<strong>${fechaLegible(dia.fecha)}</strong>: día de descanso.`;
    return `<strong>${fechaLegible(dia.fecha)}</strong>: ${dia.hechas} de ${plural(dia.total, "misión", "misiones")} (${dia.pct} %)`;
}

// Gráfica de columnas: una por día, de 0 a 100 %.
function graficaDias(r, elegida) {
    const W = 320, H = 150;                        // tamaño del dibujo
    const izq = 34, der = 6, arriba = 10, abajo = 22;
    const anchoPlano = W - izq - der;
    const altoPlano = H - arriba - abajo;
    const base = arriba + altoPlano;               // la línea del 0 %
    const n = r.porDia.length;
    const banda = anchoPlano / n;                  // espacio de cada día
    const ancho = Math.min(24, n > 10 ? banda - 2 : banda - 16);   // columna delgada (máx. 24)
    const y = (p) => arriba + altoPlano * (1 - p / 100);

    const lineas = [0, 50, 100].map((p) => `
        <line x1="${izq}" x2="${W - der}" y1="${y(p)}" y2="${y(p)}"/>
        <text x="${izq - 5}" y="${y(p) + 3}" text-anchor="end">${p} %</text>`).join("");

    const columnas = r.porDia.map((dia, i) => {
        const x = izq + i * banda + (banda - ancho) / 2;
        let marca;
        if (dia.pct === null) {
            // Descanso (o antes de empezar a jugar): un punto gris en la base, sin barra.
            marca = `<circle cx="${x + ancho / 2}" cy="${base - 4}" r="1.6" fill="${COLOR_APAGADO}"/>`;
        } else {
            const alto = Math.max(2, altoPlano * (dia.pct / 100));   // un 0 % se ve como una rayita
            const radio = Math.min(4, ancho / 2, alto);
            const tope = base - alto;
            // Punta redondeada arriba, base recta.
            marca = `<path d="M${x} ${base} V${tope + radio} Q${x} ${tope} ${x + radio} ${tope} H${x + ancho - radio} Q${x + ancho} ${tope} ${x + ancho} ${tope + radio} V${base} Z"
                           fill="${dia.pct === 0 ? COLOR_APAGADO : COLOR_DATO}"/>`;
        }
        // Etiqueta del eje: la letra del día (7 días) o el número cada 5 días (30 días).
        const conEtiqueta = n <= 10 || (n - 1 - i) % 5 === 0;
        const texto = n <= 10 ? DIAS_LETRAS[diaDeSemana(dia.fecha)] : desdeTexto(dia.fecha).getDate();
        const etiqueta = conEtiqueta ? `<text x="${x + ancho / 2}" y="${H - 7}" text-anchor="middle">${texto}</text>` : "";
        // La zona para tocar es toda la franja del día (más grande que la columna).
        return `<g class="columna ${i === elegida ? "elegida" : ""}" data-accion="ver-columna" data-i="${i}" role="button"
                   aria-label="${fechaLegible(dia.fecha)}: ${dia.pct === null ? "descanso" : `${dia.pct} %`}">
                    <rect class="franja" x="${izq + i * banda}" y="${arriba}" width="${banda}" height="${altoPlano + abajo}"/>
                    ${marca}${etiqueta}
                </g>`;
    }).join("");

    return `<svg class="grafica" viewBox="0 0 ${W} ${H}" role="group" aria-label="Cumplimiento por día en los últimos ${n} días"
                 xmlns="http://www.w3.org/2000/svg">${lineas}${columnas}</svg>`;
}


// ===== Pantalla: Aventuras (misiones principales y jefes) =====


export function pantallaAventuras(estado, ctx) {
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
    const campanas = Object.values(campana.estadoCampanas(estado));
    const d = campana.DANO.diaria;

    return `
        <button type="button" class="panel acceso-arcade" data-accion="ir" data-pantalla="arcade">
            <span class="acceso-arcade-icono">🕹️</span>
            <span><b>Arcade del héroe</b>
                <span class="mini texto-suave">3 minijuegos con tu avatar · 🎟️ ${plural(arcade.fichasDisponibles(estado), "ficha", "fichas")}</span></span>
            <span class="heroe-ver">Jugar ›</span>
        </button>

        <div class="titulo-seccion"><h2 class="titulo-juego">Campaña de jefes</h2></div>
        <p class="nota">Cada categoría tiene 5 jefes, cada vez más fuertes. Solo los dañas cumpliendo objetivos
           de <b>su</b> categoría: una misión diaria hace poco daño (−${d.facil} fácil, −${d.normal} normal, −${d.dificil} difícil);
           cada paso de una <b>misión principal</b> hace −${campana.DANO.paso} y completarla entera, −${campana.DANO.principal} extra.</p>
        ${campanas.map((c) => tarjetaCampana(c, ctx)).join("")}

        ${cabeceraSeccion("Misiones principales", "principal", "+ Nueva")}
        <p class="nota">Tus objetivos grandes, divididos en pasos. Son tu arma más fuerte contra los jefes.
           Cada paso: +${PREMIOS.submision.xp} XP. Al terminar todos: +${PREMIOS.principal.xp} XP y ${PREMIOS.principal.monedas} monedas.</p>
        ${enCurso.length ? enCurso.map(tarjetaPrincipal).join("") : vacio("Sin misiones principales en curso. Ej: «Aprender inglés B1» o «Terminar CS50».")}
        ${plegable(`Completadas (${terminadas.length})`, terminadas.map(tarjetaPrincipal).join(""), terminadas.length)}
        ${plegable(`Archivadas (${archivadas.length})`, `<ul class="lista">${filasArchivadas}</ul>`, archivadas.length)}`;
}

// <details> es una sección que se abre y se cierra sola (sin JavaScript).
function plegable(titulo, contenido, cantidad) {
    if (!cantidad) return "";
    return `<details class="plegable"><summary>${titulo}</summary>${contenido}</details>`;
}

function tarjetaPrincipal(p) {
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
                    ${chipAtributo(p.atributo)}
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
function retratoJefe(jefe, estadoVisual, clase = "") {
    return `<figure class="retrato ${estadoVisual} ${clase}">
                <img src="${campana.imagenDe(jefe.id)}" alt="${esc(jefe.nombre)}" loading="lazy" decoding="async">
            </figure>`;
}

// Tarjeta de una campaña: el jefe actual contra tu avatar y la ruta de los 5 jefes.
function tarjetaCampana(c, ctx) {
    const a = juego.ATRIBUTOS[c.categoria];
    const golpeado = (ctx.golpeadas || []).includes(c.categoria);

    // Ruta: vencidos (en gris), el actual (resaltado) y los que vienen (silueta).
    const ruta = c.campana.jefes.map((jefe, i) => {
        const tipo = i < c.derrotados ? "vencido" : i === c.indice ? "actual" : "futuro";
        const titulo = tipo === "futuro" ? "Jefe desconocido" : `${jefe.nombre}: ${jefe.titulo}`;
        return `<li class="${tipo}" title="${esc(titulo)}">
                    <img src="${campana.imagenDe(jefe.id)}" alt="" loading="lazy" decoding="async">
                    ${tipo === "vencido" ? '<span aria-hidden="true">✓</span>' : tipo === "futuro" ? '<span aria-hidden="true">?</span>' : ""}
                </li>`;
    }).join("");

    if (c.completa) {
        return `
            <article class="panel campana completa" style="--color-atributo: ${a.color}">
                <div class="campana-cabecera">${chipAtributo(c.categoria)}<span class="mini texto-suave">${c.campana.nombre}</span></div>
                <p class="campana-victoria">👑 ¡Campaña completada!</p>
                <p class="nota">Derrotaste a los 5 jefes de ${a.nombre}.</p>
                <ol class="ruta-jefes">${ruta}</ol>
            </article>`;
    }

    const jefe = c.jefe;
    const visual = campana.estadoVisual(c.porcentaje);
    const premio = campana.premioJefe(c.indice + 1);
    return `
        <article class="panel campana jefe ${golpeado ? "golpeado" : ""}" style="--color-atributo: ${a.color}">
            <div class="campana-cabecera">
                ${chipAtributo(c.categoria)}
                <span class="mini texto-suave">${c.campana.nombre}</span>
                <span class="campana-numero">Jefe ${c.indice + 1}/5</span>
            </div>

            <!-- Escena de batalla: tu avatar contra el jefe -->
            <div class="escena">
                <div class="escena-heroe">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
                <span class="escena-vs">VS</span>
                <div class="escena-jefe">${retratoJefe(jefe, visual)}</div>
            </div>

            <h3 class="jefe-nombre">${esc(jefe.nombre)} <span>· ${esc(jefe.titulo)}</span></h3>
            <p class="nota">${esc(jefe.texto)}</p>
            ${barra(c.porcentaje, "barra-vida")}
            <p class="mini"><strong>Vida ${c.vida} / ${c.vidaMax}</strong>
               <span class="texto-suave">· ${FRASES_JEFE[visual]}</span></p>
            <p class="mini texto-suave">Recompensa al derrotarlo: +${premio.xp} XP y ${premio.monedas} monedas</p>
            <ol class="ruta-jefes">${ruta}</ol>
        </article>`;
}

// En "Hoy": el jefe actual de cada categoría, para tenerlos siempre a la vista.
function jefesEnCombate(estado, ctx) {
    const filas = Object.values(campana.estadoCampanas(estado)).filter((c) => !c.completa).map((c) => {
        const a = juego.ATRIBUTOS[c.categoria];
        const golpeado = (ctx.golpeadas || []).includes(c.categoria);
        return `
            <li>
                <button type="button" class="combate ${golpeado ? "golpeado" : ""}" data-accion="ir" data-pantalla="aventuras">
                    <span class="combate-jefe">${retratoJefe(c.jefe, campana.estadoVisual(c.porcentaje), "mini")}</span>
                    <span class="combate-info">
                        <b>${esc(c.jefe.nombre)} <span class="texto-suave mini">· ${esc(c.jefe.titulo)}</span></b>
                        ${barra(c.porcentaje, "barra-vida barra-mini")}
                        <span class="mini texto-suave">${a.icono} ${a.nombre} · Vida ${c.vida} / ${c.vidaMax}</span>
                    </span>
                </button>
            </li>`;
    }).join("");
    if (!filas) return "";
    return `<h3 class="subtitulo">⚔️ En combate</h3>
            <p class="nota">Cada misión de una categoría golpea al jefe de esa categoría.</p>
            <ul class="lista">${filas}</ul>`;
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


// ===== Pantalla: Arcade (minijuegos) =====

export function pantallaArcade(estado, ctx) {
    const fichas = arcade.fichasDisponibles(estado);
    const tarjetas = Object.entries(arcade.JUEGOS).map(([clave, j]) => {
        const record = estado.arcade.records[clave] || 0;
        return `
            <article class="panel minijuego-tarjeta">
                <div class="minijuego-cabecera">
                    <span class="minijuego-icono">${j.icono}</span>
                    <div>
                        <h3>${j.nombre}</h3>
                        ${chipAtributo(j.atributo)}
                    </div>
                </div>
                <p class="nota">${j.descripcion}</p>
                <p class="mini">🏅 Récord: <b>${record}</b> pts</p>
                <button type="button" class="boton boton-principal boton-ancho" data-accion="jugar" data-juego="${clave}"
                        ${fichas ? "" : "disabled"}>Jugar · 🎟️ 1 ficha</button>
            </article>`;
    }).join("");

    return `
        <section class="panel arcade-cabecera">
            <div class="arcade-heroe">${dibujarAvatar(ctx.avatar, { batalla: true })}</div>
            <div>
                <h2 class="titulo-juego">Arcade del héroe</h2>
                <p class="fichas">🎟️ ${plural(fichas, "ficha", "fichas")}</p>
                <p class="nota">Ganas <b>1 ficha</b> por cada misión diaria completada. Cada partida da monedas y XP
                   según tus puntos (máx. ${arcade.MAX_MONEDAS} 🪙 y ${arcade.MAX_XP} XP).</p>
            </div>
        </section>
        ${fichas ? "" : vacio("Sin fichas por ahora. Completa una misión diaria y vuelve a jugar.")}
        ${tarjetas}`;
}


// ===== Pantalla: Personaje (avatar, clase, equipamiento y mascota) =====

export function pantallaPersonaje(estado, ctx) {
    const a = ctx.avatar;

    // Las 4 etapas, marcando la actual y las que ya pasaste.
    const etapas = avatar.ETAPAS.map((e) => {
        const clase = e === a.etapa ? "actual" : a.nivel >= e.desde ? "pasada" : "";
        return `<li class="${clase}"><span>${e.nombre}</span><small>Nv ${e.desde}</small></li>`;
    }).join("");

    // Qué cambia cada atributo en el avatar, y qué ya tienes.
    const rasgos = Object.entries(avatar.RASGOS).map(([clave, umbrales]) => {
        const a2 = juego.ATRIBUTOS[clave];
        const items = umbrales.map((u) => {
            const tiene = a.niveles[clave] >= u.nivel;
            return `<li class="${tiene ? "tiene" : ""}">${tiene ? "✓" : "🔒"} ${u.texto}
                        <small>${tiene ? "" : `(nivel ${u.nivel})`}</small></li>`;
        }).join("");
        return `<div class="rasgo" style="--color-atributo: ${a2.color}">
                    <span class="rasgo-titulo">${a2.icono} ${a2.nombre} <b>Nv ${a.niveles[clave]}</b></span>
                    <ul>${items}</ul>
                </div>`;
    }).join("");

    return `
        <section class="panel ficha">
            <div class="ficha-avatar">${dibujarAvatar(a)}</div>
            <h2 class="titulo-juego">${esc(estado.personaje.nombre)}</h2>
            <p class="etiqueta">Nivel ${a.nivel} · ${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</p>
            <p class="heroe-animo">${textoAnimo(a, ctx)}</p>
            <ol class="etapas">${etapas}</ol>
        </section>

        ${seccionApariencia(estado)}

        <section class="panel">
            <h2 class="titulo-juego">Clase: ${a.clase.icono} ${a.clase.nombre}</h2>
            <p class="nota">${a.clase.texto} Clases: ⚔️ Guerrero (Fuerza), 🔮 Mago (Intelecto), 🎶 Bardo (Carisma),
               ⚖️ Mercader (Riqueza) o 🌟 Aventurero completo si equilibras los cuatro.</p>
            <div class="rasgos">${rasgos}</div>
        </section>

        ${seccionEquipamiento(estado, ctx)}
        ${seccionMascota(a.mascota)}
        ${seccionObjetosDeLogro(estado, ctx, "Objetos de logro")}`;
}

// Apariencia: tono de piel, color de pelo, peinado y barba.
// Los colores se eligen con círculos de color; lo demás, con botones de texto.
const TITULOS_APARIENCIA = { piel: "Tono de piel", pelo: "Color de pelo", peinado: "Peinado", barba: "Barba" };

function seccionApariencia(estado) {
    const grupos = Object.entries(avatar.APARIENCIA).map(([campo, opciones]) => {
        const elegida = estado.apariencia[campo];
        const conColor = Boolean(Object.values(opciones)[0].color);
        const botones = Object.entries(opciones).map(([valor, opcion]) => {
            const datos = `data-accion="apariencia" data-campo="${campo}" data-valor="${valor}" aria-pressed="${valor === elegida}"`;
            return conColor
                ? `<button type="button" class="muestra" style="--color-muestra: ${opcion.color}" ${datos} aria-label="${opcion.nombre}"></button>`
                : `<button type="button" ${datos}>${opcion.nombre}</button>`;
        }).join("");
        return `
            <div class="apariencia-grupo">
                <span class="apariencia-titulo">${TITULOS_APARIENCIA[campo]} <small>${opciones[elegida].nombre}</small></span>
                <div class="${conColor ? "muestras" : "selector"}" role="group" aria-label="${TITULOS_APARIENCIA[campo]}">${botones}</div>
            </div>`;
    }).join("");

    return `
        <section class="panel apariencia">
            <h2 class="titulo-juego">Apariencia</h2>
            <p class="nota">Elige cómo se ve tu avatar. Es gratis y lo puedes cambiar cuando quieras.</p>
            ${grupos}
        </section>`;
}

function seccionEquipamiento(estado, ctx) {
    const a = ctx.avatar;
    const disponibles = avatar.objetosDisponibles(estado, ctx.info);

    const espacios = Object.entries(avatar.ESPACIOS).map(([espacio, nombre]) => {
        const id = a.equipado[espacio];
        const objeto = id ? avatar.OBJETOS[id] : null;
        return `<div class="espacio ${objeto ? "lleno" : ""}">
                    <span class="espacio-icono">${objeto ? objeto.icono : "·"}</span>
                    <span class="mini texto-suave">${nombre}</span>
                    <span class="mini">${objeto ? esc(objeto.nombre) : "Vacío"}</span>
                </div>`;
    }).join("");

    const inventario = [...disponibles].map((id) => {
        const objeto = avatar.OBJETOS[id];
        const puesto = a.equipado[objeto.espacio] === id;
        return `<li class="objeto ${puesto ? "puesto" : ""}">
                    <span class="objeto-icono">${objeto.icono}</span>
                    <span class="objeto-info"><b>${objeto.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[objeto.espacio]}${objeto.logro ? " · 🏅 de logro" : ""}</span></span>
                    <button type="button" class="boton boton-chico ${puesto ? "" : "boton-oro"}" data-accion="equipar" data-id="${id}">
                        ${puesto ? "Quitar" : "Equipar"}</button>
                </li>`;
    }).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Equipamiento</h2>
            <div class="espacios">${espacios}</div>
            <h3 class="subtitulo">Tus objetos (${disponibles.size})</h3>
            ${disponibles.size
                ? `<ul class="lista">${inventario}</ul>`
                : vacio("Aún no tienes objetos. Cómpralos en la Tienda con tus monedas o gánalos con logros.")}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="ir" data-pantalla="tienda">Ir a la tienda</button>
        </section>`;
}

function seccionMascota(m) {
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS_MASCOTA, m.etapa);
    const crecimiento = siguiente
        ? `${siguiente.clave === "cria" ? "Eclosiona" : "Crece a adulto"} en ${plural(siguiente.desde - m.total, "misión diaria", "misiones diarias")} más.`
        : "Ya es adulto. ¡Lo cuidaste muy bien!";
    const animo = m.triste
        ? "😢 Está triste: hace días que no completas misiones."
        : "😊 Está contento.";

    return `
        <section class="panel">
            <h2 class="titulo-juego">Mascota</h2>
            <div class="mascota-ficha">
                <div class="mascota-dibujo">${dibujarMascota(m)}</div>
                <div>
                    <p><b>${esc(m.nombre)}</b> · ${m.etapa.nombre}</p>
                    <p class="mini texto-suave">${crecimiento}</p>
                    <p class="mini">${animo}</p>
                </div>
            </div>
            <form class="form-linea" data-form="mascota">
                <input type="text" name="nombre" maxlength="20" required autocomplete="off" placeholder="Nuevo nombre" aria-label="Nombre de la mascota">
                <button type="submit" class="boton boton-chico">Renombrar</button>
            </form>
            <p class="nota">Crece con cada misión diaria que completas: huevo → cría (10) → adulto (50).</p>
        </section>`;
}

// Objetos que no se compran: solo se ganan con logros.
function seccionObjetosDeLogro(estado, ctx, titulo) {
    const lista = Object.entries(avatar.OBJETOS).filter(([, o]) => o.logro).map(([id, o]) => {
        const progreso = Math.min(avatar.progresoObjeto(o, estado, ctx.info), o.logro.meta);
        const ganado = progreso >= o.logro.meta;
        return `<li class="objeto ${ganado ? "puesto" : ""}">
                    <span class="objeto-icono ${ganado ? "" : "bloqueado"}">${o.icono}</span>
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${o.logro.texto}</span>
                        ${ganado ? "" : barra(Math.round((progreso / o.logro.meta) * 100), "barra-mini")}</span>
                    <span class="mini ${ganado ? "oro" : "texto-suave"}">${ganado ? "¡Ganado!" : `${progreso}/${o.logro.meta}`}</span>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏅 ${titulo}</h2>
            <p class="nota">No se pueden comprar: solo se ganan.</p>
            <ul class="lista">${lista}</ul>
        </section>`;
}


// Equipamiento que se compra con monedas (además de las recompensas reales).
function tiendaDelAvatar(estado) {
    const monedas = estado.personaje.monedas;
    const enVenta = Object.entries(avatar.OBJETOS)
        .filter(([, o]) => !o.logro)
        .sort(([, a], [, b]) => a.precio - b.precio);

    const lista = enVenta.map(([id, o]) => {
        const tuyo = estado.avatar.comprados.includes(id);
        const puede = monedas >= o.precio;
        const accion = tuyo
            ? `<span class="mini oro">✓ Tuyo</span>`
            : `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar" data-id="${id}"
                       ${puede ? "" : "disabled"}>Comprar</button>`;
        return `<li class="objeto ${tuyo ? "puesto" : ""}">
                    <span class="objeto-icono">${o.icono}</span>
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[o.espacio]} · 🪙 ${o.precio}</span></span>
                    ${accion}
                </li>`;
    }).join("");

    return `
        <div class="titulo-seccion"><h2 class="titulo-juego">Equipamiento del avatar</h2></div>
        <p class="nota">Las monedas también sirven para tu avatar. Lo que compres se equipa solo;
           puedes cambiarlo en tu Personaje.</p>
        <ul class="lista">${lista}</ul>`;
}


// ===== Pantalla: Tienda =====

export function pantallaTienda(estado, ctx) {
    const monedas = estado.personaje.monedas;
    const recompensas = [...estado.recompensas].sort((a, b) => a.costo - b.costo);
    const canjes = estado.canjes.slice(-15).reverse(); // los 15 más recientes

    const lista = recompensas.map((r) => {
        const puede = monedas >= r.costo;
        return `
            <li class="recompensa ${puede ? "alcanzable" : ""}">
                <div class="recompensa-info">
                    <h3>${esc(r.nombre)}</h3>
                    <span class="mini ${puede ? "oro" : "texto-suave"}">🪙 ${r.costo}${puede ? "" : ` · te faltan ${r.costo - monedas}`}</span>
                </div>
                <button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="canjear" data-id="${r.id}" ${puede ? "" : "disabled"}>Canjear</button>
                ${botonEditar("editar-recompensa", r.id, `Editar ${r.nombre}`)}
            </li>`;
    }).join("");

    const historial = canjes.map((c) =>
        `<li><span>${esc(c.nombre)}</span><span class="texto-suave">${fechaCorta(c.fecha)} · −${c.costo}</span></li>`).join("");

    return `
        <section class="panel saldo">
            <span class="etiqueta">Tus monedas</span>
            <span class="saldo-numero">🪙 ${monedas}</span>
        </section>

        ${cabeceraSeccion("Recompensas", "recompensa", "+ Nueva")}
        <p class="nota">Premios reales que tú defines. Cánjealos cuando tengas monedas suficientes.</p>
        ${recompensas.length ? `<ul class="lista">${lista}</ul>` : vacio("Crea tu primera recompensa. Ej: «Ver un capítulo de mi serie» por 50 monedas.")}

        ${tiendaDelAvatar(estado)}
        ${seccionObjetosDeLogro(estado, ctx, "Objetos que no se venden")}

        ${canjes.length ? `<section class="panel"><h2 class="titulo-juego">Historial</h2><ul class="historial">${historial}</ul></section>` : ""}

        <section class="panel">
            <h2 class="titulo-juego">Cómo ganar monedas</h2>
            <dl class="estadisticas">
                ${Object.values(DIFICULTADES).map((d) => `<div><dt>Misión ${d.nombre.toLowerCase()}</dt><dd>🪙 ${d.monedas}</dd></div>`).join("")}
                <div><dt>Paso de misión principal</dt><dd>🪙 ${PREMIOS.submision.monedas}</dd></div>
                <div><dt>Misión principal completa</dt><dd>🪙 ${PREMIOS.principal.monedas}</dd></div>
                <div><dt>Jefe derrotado (1.º al 5.º)</dt><dd>🪙 ${campana.premioJefe(1).monedas}–${campana.premioJefe(5).monedas}</dd></div>
                <div><dt>Minijuegos</dt><dd>🪙 hasta ${arcade.MAX_MONEDAS}</dd></div>
                <div><dt>Logros</dt><dd>Tú decides</dd></div>
            </dl>
        </section>`;
}
