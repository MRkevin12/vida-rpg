// vistas-progreso.js — La pestaña Progreso: mapa de calor, atributos, resumen de 7/30 días con su gráfica.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import { icono } from "./iconos.js";
import { calcularResumen } from "./resumen.js";
import { fechaLegible, fechaCorta, MESES_CORTOS, DIAS_LETRAS, desdeTexto, diaDeSemana } from "./fechas.js";
import { selectorSecciones, esc, barra, vacio, textoCambio, ficha, NOMBRE_DIA } from "./vistas-comun.js";
import { pantallaLogros } from "./vistas-aventuras.js";

const { ATRIBUTOS, ESCUDOS, ANIMOS_DIARIO, plural } = juego;

// ===== Pantalla: Progreso (racha, calendario y atributos) =====

export function pantallaProgreso(estado, ctx) {
    const vista = ctx.subvista?.progreso || "numeros";
    const selector = selectorSecciones("progreso", [["numeros", "📊 Tu progreso"], ["logros", "🏆 Logros"]], vista);
    if (vista === "logros") return `${selector}${pantallaLogros(estado, ctx)}`;

    const { racha, diasPerfectos } = ctx.info;
    const escudos = Array.from({ length: ESCUDOS.maximo }, (_, i) =>
        `<span class="escudo ${i < racha.escudos ? "lleno" : ""}">🛡️</span>`).join("");
    const numero = (valor, texto) => `<div><b>${valor}</b><span>${texto}</span></div>`;

    return `
        ${selector}
        <section class="panel">
            <h2 class="titulo-juego">🔥 Racha</h2>
            <div class="racha-datos">
                <div><span class="racha-numero">🔥 ${racha.actual}</span><span class="etiqueta">Actual</span></div>
                <div><span class="racha-numero">🏅 ${racha.mejor}</span><span class="etiqueta">Mejor</span></div>
                <div><span class="racha-numero escudos">${escudos}</span><span class="etiqueta">Escudos</span></div>
            </div>
            <p class="nota">Un día cuenta si completas al menos 1 misión. Cada ${ESCUDOS.diasParaGanar} días seguidos
               ganas un escudo (máx. ${ESCUDOS.maximo}): si fallas un día, el escudo salva tu racha.</p>
            <!-- Los totales de siempre (antes eran otro panel, «Estadísticas») -->
            <div class="numeros">
                ${numero(ctx.info.totalCompletadas, "misiones")}
                ${numero(diasPerfectos, "días perfectos")}
                ${numero(ctx.info.principalesCompletadas, "principales")}
                ${numero(ctx.info.jefesDerrotados, "jefes vencidos")}
                ${numero(estado.canjes.length, "premios canjeados")}
                ${numero(estado.personaje.xp, "XP total")}
            </div>
        </section>

        ${seccionResumen(estado, ctx)}

        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">🗓️ Calendario</h2>
                <span class="texto-suave mini">✨ ${plural(diasPerfectos, "día perfecto", "días perfectos")}</span>
            </div>
            ${mapaDeCalor(estado, ctx)}
            <div class="cal-leyenda">
                <span>Menos</span>
                <i class="celda n0"></i><i class="celda n1"></i><i class="celda n2"></i><i class="celda n3"></i><i class="celda n4"></i>
                <span>Más</span>
                <i class="celda n0 protegido"></i><span>Escudo</span>
                ${estado.descansos.length ? '<i class="celda n0 descanso"></i><span>Descanso</span>' : ""}
            </div>
            <p class="cal-detalle" id="cal-detalle">${detalleDia(estado, ctx.diaSeleccionado, racha)}</p>
        </section>

        <section class="panel">
            <h2 class="titulo-juego">💪 Atributos</h2>
            <p class="nota">Tu clase es tu atributo más alto: ahora eres <b>${ctx.avatar.clase.icono} ${ctx.avatar.clase.nombre}</b>.
               Cada atributo cambia algo de tu avatar en los niveles 3 y 6.</p>
            <div class="atributos">${Object.keys(ATRIBUTOS).map((clave) => tarjetaAtributo(estado, clave)).join("")}</div>
            ${seccionAtributosPropios(estado)}
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
        if (dia.descanso) clases.push("descanso");
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
    // "X de Y" cuenta solo las que tocaban ese día (las semanales se nombran, pero no suman a Y).
    const hechasDia = new Map([[fecha, new Set(hechas.map((c) => c.misionId))]]);
    const { hechas: cumplidas, total } = juego.cumplimientoDelDia(estado.misiones, fecha, hechasDia);
    const nombres = hechas.map((c) => {
        const mision = estado.misiones.find((m) => m.id === c.misionId);
        return esc(mision ? mision.nombre : "misión borrada");
    });
    let protegido = racha.protegidos.has(fecha) ? " · 🛡️ protegido por un escudo" : "";
    if (juego.enDescanso(estado, fecha)) protegido += " · 🏖️ descanso";
    const tareas = estado.tareas.filter((t) => t.hechaEn === fecha).map((t) => esc(t.nombre));
    const minutos = estado.enfoque.sesiones.filter((s) => s.fecha === fecha).reduce((suma, s) => suma + s.minutos, 0);
    const entrada = estado.diario[fecha];

    let texto = `<strong>${fechaLegible(fecha)}</strong>: ${cumplidas} de ${total}${protegido}`;
    if (nombres.length) texto += `<br><span class="texto-suave">${nombres.join(" · ")}</span>`;
    if (tareas.length) texto += `<br><span class="texto-suave">📌 ${tareas.join(" · ")}</span>`;
    if (minutos) texto += `<br><span class="texto-suave">⏱️ ${minutos} min de enfoque</span>`;
    if (entrada) {
        const icono = entrada.animo ? ANIMOS_DIARIO[entrada.animo].icono : "📓";
        texto += `<br>${icono} ${entrada.texto ? `«${esc(entrada.texto)}»` : ""}`;
        if (entrada.gratitud) texto += `<br>🙏 ${esc(entrada.gratitud)}`;
    }
    return texto;
}


// Tus atributos: para lo específico. Cada uno tiene su nivel y le suma a uno de los 4.
// Tocar uno abre la ventana para editarlo.
function seccionAtributosPropios(estado) {
    const propios = estado.atributosPropios;
    const tarjetas = propios.map((p) => {
        const n = juego.nivelDePropio(estado, p.id);
        const base = ATRIBUTOS[p.base];
        const usos = estado.misiones.filter((m) => m.atributoPropio === p.id && !m.archivadaEn).length;
        return `
            <div class="atributo atributo-propio" style="--color-atributo: ${p.color}" data-accion="editar-atributo" data-id="${p.id}"
                 role="button" aria-label="Editar ${esc(p.nombre)}">
                <div class="atributo-cabecera">
                    <span class="atributo-icono">${esc(p.icono)}</span>
                    <span class="atributo-nombre">${esc(p.nombre)}</span>
                    <span class="atributo-nivel">Nv ${n.nivel}</span>
                </div>
                ${barra(n.porcentaje, "barra-mini barra-atributo")}
                <span class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP</span>
                <span class="mini texto-suave">Suma a ${base.icono} ${base.nombre} · ${plural(usos, "misión", "misiones")}</span>
            </div>`;
    }).join("");
    const lleno = propios.length >= juego.MAX_ATRIBUTOS_PROPIOS;
    return `
        <div class="titulo-seccion titulo-propios">
            <h3 class="subtitulo">✨ Tus atributos</h3>
            <button type="button" class="boton boton-chico" data-accion="abrir" data-dialogo="atributo" ${lleno ? "disabled" : ""}>+ Nuevo</button>
        </div>
        ${propios.length
            ? `<div class="atributos">${tarjetas}</div>`
            : vacio("Crea atributos para lo específico: Programación, Inglés, Salud, tu emprendimiento…<br>Cada uno tiene su propio nivel y también sube uno de los 4.")}`;
}


function tarjetaAtributo(estado, clave) {
    const a = ATRIBUTOS[clave];
    const n = juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO);
    // Lo que cambia en tu avatar en los niveles 3 y 6.
    const rasgos = avatar.RASGOS[clave].map((u) => {
        const tiene = n.nivel >= u.nivel;
        return `<li class="${tiene ? "tiene" : ""}">${tiene ? "✓" : "🔒"} ${u.texto}${tiene ? "" : ` <small>Nv ${u.nivel}</small>`}</li>`;
    }).join("");
    return `
        <div class="atributo" style="--color-atributo: ${a.color}">
            <div class="atributo-cabecera">
                <span class="atributo-icono">${a.icono}</span>
                <span class="atributo-nombre">${a.nombre}</span>
                <span class="atributo-nivel">Nv ${n.nivel}</span>
            </div>
            ${barra(n.porcentaje, "barra-mini barra-atributo")}
            <span class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP</span>
            <ul class="atributo-rasgos">${rasgos}</ul>
        </div>`;
}



// ===== Resumen con gráficas (dentro de Progreso) =====
// Reglas que seguimos en las gráficas:
//   - Un solo color para los datos (el violeta de la app, comprobado sobre el fondo oscuro).
//   - Columnas delgadas, con la punta redondeada y la base recta.
//   - Los textos van en color de texto, nunca en el color de la gráfica.
//   - Todo valor se puede leer sin la gráfica: tocando una columna o en "Ver como tabla".

const COLOR_DATO = "#8b5cf6";

       // el color de las barras
const COLOR_APAGADO = "#4a4468";


function seccionResumen(estado, ctx) {
    const r = calcularResumen(estado, ctx.hoy, ctx.rangoResumen);
    const periodo = `${r.dias} días`;
    const cambio = (valor, unidad) => textoCambio(valor, unidad, `los ${periodo} anteriores`);

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
