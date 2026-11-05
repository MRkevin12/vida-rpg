// vistas-gym-tarjetas.js — Las tarjetas de Progreso del Gimnasio: músculos y mapa del cuerpo, hitos, avisos de Aurelio,
// Salón de récords, la gráfica de un ejercicio, el diario del gym, consejo y reto, constancia, lecturas de la Fragua,
// peso, medidas e historial. Además, los ayudantes pequeños (barra, kilos, sparkline, cabezaDeAurelio).
//
// Salió de vistas-gym.js (que las usa). Solo convierte la partida en HTML: las reglas están en gym.js.

import * as gym from "./gym.js";
import * as fragua from "./fragua.js";
import * as avatar from "../avatar.js";
import * as gymAurelio from "./gym-aurelio.js";
import { describirMaestro } from "../maestro.js";
import { retratoPixel, cuerpoGymPixel } from "../dibujo/retratos.js";
import { plural } from "../juego.js";
import { esc } from "../pantallas/vistas-comun.js";
import { fechaCorta, lunesDe, hoy as hoyDeHoy } from "../fechas.js";


export const barra = (porcentaje, clase = "") => `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;
export const kilos = (kg) => `${String(kg).replace(".", ",")} kg`;
// El tiempo que llevas entrenando: 12:05 o 1:02:30.
export const duracionLarga = (ms) => {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
// Una gráfica de línea pequeña (SVG) con los valores dados. Con menos de 2 valores no se dibuja.
// (v147) En pixel art: va dentro del marco de píxel del HUD de la carrera (CSS .gym-spark), los puntos caen en números
// enteros (la línea sale en escalones, sin suavizar), las rayitas del fondo marcan el medio y el último valor es un cuadro.
export function sparkline(valores, { ancho = 84, alto = 24, color = "#fbbf24" } = {}) {
    if (valores.length < 2) return "";
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const rango = max - min || 1;
    const puntos = valores.map((x, i) => [Math.round((i / (valores.length - 1)) * (ancho - 6) + 3), Math.round(alto - 4 - ((x - min) / rango) * (alto - 8))]);
    const [ux, uy] = puntos[puntos.length - 1];
    const medio = Math.round(alto / 2);
    return `<svg class="gym-spark" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" aria-hidden="true">
        <path d="M0 ${medio}h${ancho}" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="2 2"/>
        <polyline points="${puntos.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="miter"/>
        <rect x="${ux - 2.5}" y="${uy - 2.5}" width="5" height="5" fill="${color}" stroke="#06040d" stroke-width="1"/></svg>`;
}
// (v165) La cara de Aurelio: su retrato redondo, que rebota cada pocos segundos, y su símbolo encima (si hay).
export function cabezaDeAurelio(emote = "") {
    return `<span class="gym-aurelio-cabeza" aria-hidden="true"><span class="gym-aurelio-retrato">${retratoPixel(describirMaestro())}</span>${emote ? `<span class="gym-aurelio-emote" data-aurelio-emote>${emote}</span>` : ""}</span>`;
}
// ===== Músculos =====
// ===== (v148) El mapa del cuerpo: qué músculos trabajaste esta semana y cuáles te faltan =====
// Dos siluetas en cuadritos (de frente y de espaldas). Cada zona es un músculo de gym.MUSCULOS y se pinta según sus
// series de la semana (gym.nivelDeSeries: 0 apagado, 1 poco, 2 bien, 3 mucho). Lo gris (cabeza, antebrazos, pies) no cuenta.
// Cada pieza: [músculo o null, x, y, ancho, alto] en una cuadrícula de 30 × 66 por silueta.
const SILUETA_FRENTE = [
    [null, 12, 0, 6, 7], [null, 13, 7, 4, 2],
    ["hombros", 6, 9, 5, 4], ["hombros", 19, 9, 5, 4],
    ["pecho", 11, 9, 8, 7],
    ["biceps", 5, 13, 4, 8], ["biceps", 21, 13, 4, 8],
    [null, 4, 21, 4, 9], [null, 22, 21, 4, 9],
    ["core", 11, 16, 8, 12],
    [null, 10, 28, 10, 4],
    ["cuadriceps", 10, 32, 4, 15], ["cuadriceps", 16, 32, 4, 15],
    [null, 10, 47, 4, 15], [null, 16, 47, 4, 15],
    [null, 9, 62, 5, 3], [null, 16, 62, 5, 3],
];
const SILUETA_ESPALDA = [
    [null, 12, 0, 6, 7], [null, 13, 7, 4, 2],
    ["hombros", 6, 9, 5, 4], ["hombros", 19, 9, 5, 4],
    ["espalda", 10, 9, 10, 17],
    ["triceps", 5, 13, 4, 8], ["triceps", 21, 13, 4, 8],
    [null, 4, 21, 4, 9], [null, 22, 21, 4, 9],
    ["gluteos", 10, 26, 10, 6],
    ["isquios", 10, 32, 4, 15], ["isquios", 16, 32, 4, 15],
    ["pantorrillas", 10, 47, 4, 15], ["pantorrillas", 16, 47, 4, 15],
    [null, 9, 62, 5, 3], [null, 16, 62, 5, 3],
];

export function dibujarMapaCuerpo(series) {
    const silueta = (piezas, dx) => piezas.map(([m, x, y, w, h]) => {
        const clase = m ? `gc-${gym.nivelDeSeries(series[m] || 0)}` : "gc-base";
        const titulo = m ? `<title>${gym.MUSCULOS[m].nombre}: ${series[m] || 0} series</title>` : "";
        return `<rect class="${clase}" x="${x + dx}" y="${y}" width="${w}" height="${h}">${titulo}</rect>`;
    }).join("");
    return `<svg class="gym-cuerpo-mapa" viewBox="0 0 76 74" shape-rendering="crispEdges" role="img" aria-label="Músculos trabajados esta semana">
        ${silueta(SILUETA_FRENTE, 2)}${silueta(SILUETA_ESPALDA, 44)}
        <text x="17" y="73" text-anchor="middle">Frente</text><text x="59" y="73" text-anchor="middle">Espalda</text>
    </svg>`;
}

export function tarjetaMapaCuerpo(estado, ctx) {
    const series = gym.seriesPorMusculoDeLaSemana(estado.gym.sesiones, lunesDe(ctx.hoy));
    const nombres = (lista) => lista.map((m) => `${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}`).join(" · ");
    const faltan = Object.keys(gym.MUSCULOS).filter((m) => !series[m]);
    const fuertes = Object.keys(gym.MUSCULOS).filter((m) => gym.nivelDeSeries(series[m]) >= 2).sort((a, b) => series[b] - series[a]);
    const olvidados = gym.musculosOlvidados(estado.gym, ctx.hoy);   // (v164)
    return `
        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">🧍 Tu cuerpo esta semana</h2>
                <p class="contador ${faltan.length ? "" : "completo"}">${Object.keys(gym.MUSCULOS).length - faltan.length}/${Object.keys(gym.MUSCULOS).length}</p>
            </div>
            ${dibujarMapaCuerpo(series)}
            <ul class="gym-cuerpo-leyenda" aria-label="Leyenda">
                <li><i class="gc-0"></i> Sin trabajar</li><li><i class="gc-1"></i> Poco (1–5)</li>
                <li><i class="gc-2"></i> Bien (6–11)</li><li><i class="gc-3"></i> Mucho (12+)</li>
            </ul>
            ${fuertes.length ? `<p class="nota">💪 Lo más trabajado: ${nombres(fuertes.slice(0, 3))}.</p>` : ""}
            <p class="nota">${faltan.length ? `⏳ Te faltan: ${nombres(faltan)}.` : "✨ ¡Trabajaste todos tus músculos esta semana!"}</p>
            ${olvidados.length ? `<p class="nota gym-pista-estancado">⚖️ Llevas ${gym.SEMANAS_EQUILIBRIO} semanas con poco trabajo (menos de 6 series) de ${nombresDeMusculos(olvidados)}.</p>` : ""}
            <p class="mini texto-suave">Cuenta las series de lunes a domingo. Unas 10 series por músculo a la semana es lo que se suele recomendar para crecer.</p>
        </section>`;
}

export function tarjetaMusculos(estado) {
    const niveles = gym.nivelesDeMusculos(estado.gym.sesiones);
    const filas = Object.entries(gym.MUSCULOS).map(([clave, m]) => {
        const n = niveles[clave];
        return `
            <li class="gym-musculo">
                <span class="gym-musculo-nombre">${m.icono} ${m.nombre}</span>
                <span class="gym-musculo-nivel">Nv ${n.nivel}</span>
                ${barra(n.porcentaje, "barra-gym")}
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">Tus músculos</h2>
            <ul class="gym-musculos">${filas}</ul>
        </section>`;
}

// (Los récords están en el Salón de récords, v164: tarjetaSalonRecords.)

// ===== Hitos =====
export function tarjetaHitos(estado) {
    const g = estado.gym;
    const hechos = g.hitos.length;
    const lista = gym.HITOS.map((h) => {
        const logrado = g.hitos.includes(h.id);
        return `<li class="gym-hito ${logrado ? "logrado" : ""}">
                    <span class="gym-hito-icono" aria-hidden="true">${logrado ? h.icono : "🔒"}</span>
                    <span><b>${h.titulo}</b><small>${h.texto}</small></span>
                    <span class="gym-hito-premio">${logrado ? "✓" : `+${h.gemas} 💎`}</span>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🎖️ Hitos de gym <span class="texto-suave">${hechos}/${gym.HITOS.length}</span></h2>
            <ul class="gym-hitos">${lista}</ul>
        </section>`;
}

// ===== (v164) Lo que Aurelio te avisa antes de entrenar =====
// La semana de descarga (si toca o si ya es), los ejercicios estancados (con qué probar) y los músculos olvidados.
// Si no hay nada que avisar, en su lugar sale el consejo del día.
// Los nombres de unos músculos en una frase: «🦵 Cuádriceps, 🦿 Isquiosurales y 🧱 Glúteos». Con más de 4, «… y 3 más».
function nombresDeMusculos(lista, maximo = 4) {
    const nombres = lista.slice(0, maximo).map((m) => `${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}`);
    if (lista.length > maximo) return `${nombres.join(", ")} y ${lista.length - maximo} más`;
    return nombres.join(", ").replace(/, ([^,]*)$/, " y $1");
}

export function tarjetaAvisos(estado, ctx) {
    const g = estado.gym;
    const avisos = [];
    let emoteDeAvisos = "⚖️";   // (v165) 🤔 si hay un ejercicio estancado, 🛌 si toca descansar, ⚖️ si hay músculos olvidados
    const descarga = gym.descargaDeLaSemana(g, lunesDe(ctx.hoy));
    const semanas = gym.semanasSinDescanso(g, ctx.hoy);
    const recorte = Math.round(gym.RECORTE_DESCARGA * 100);
    if (descarga) {
        avisos.push(`
            <li class="gym-aviso gym-aviso-descarga"><b>🛌 Semana de descarga</b>
                <small>Cada ejercicio trae un ${recorte} % menos de series. Usa el mismo peso (o un poco menos) y no busques récords: esta semana se gana descansando.
                ${descarga.cobrada ? "✅ Ya cobraste el premio por descansar bien." : `Al terminar tu primer entrenamiento de la semana: +${gym.PREMIO_DESCARGA.gemas} 💎 y +${gym.PREMIO_DESCARGA.xp} XP.`}</small>
                ${descarga.cobrada || g.encurso ? "" : '<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-descarga-quitar">Quitar la descarga</button>'}</li>`);
    } else if (gym.tocaDescarga(g, ctx.hoy)) {
        emoteDeAvisos = "🛌";
        avisos.push(`
            <li class="gym-aviso"><b>🛌 Toca una semana de descarga</b>
                <small>Llevas ${plural(semanas, "semana seguida", "semanas seguidas")} entrenando. Una semana con un ${recorte} % menos de series deja que el cuerpo se recupere
                y vuelvas más fuerte. Premio por descansar bien: +${gym.PREMIO_DESCARGA.gemas} 💎.</small>
                <button type="button" class="boton boton-chico boton-principal" data-accion="gym-descarga">🛌 Empezar la descarga esta semana</button></li>`);
    }
    const pesos = gym.pesosMaximos(g.sesiones);
    for (const e of gym.estancados(g.sesiones, ctx.hoy).slice(0, 2)) {
        const ej = gym.ejercicioPorId(e.id);
        emoteDeAvisos = "🤔";
        const propuestas = gym.propuestasDeEstancamiento(e, semanas).filter((p) => !(p.tipo === "descarga" && descarga));
        avisos.push(`
            <li class="gym-aviso"><b>⚠️ ${esc(ej.nombre)}: ${plural(e.sesiones, "sesión", "sesiones")} sin mejorar</b>
                <small>Tu mejor marca (${pesos[e.id] ? `1RM estimado: ${kilos(e.mejor)}` : `${e.mejor} reps`}) no ha subido. Prueba una de estas:</small>
                <ul class="gym-propuestas">${propuestas.map((p) => `<li>${p.icono} ${esc(p.texto)}</li>`).join("")}</ul></li>`);
    }
    const olvidados = gym.musculosOlvidados(g, ctx.hoy);
    if (olvidados.length) {
        const r = gym.rutinaPara(olvidados);
        const yaHoy = r && g.sesiones.some((s) => s.fecha === ctx.hoy && s.rutina === r.id);
        avisos.push(`
            <li class="gym-aviso"><b>⚖️ Llevas ${gym.SEMANAS_EQUILIBRIO} semanas con poco trabajo de ${nombresDeMusculos(olvidados)}</b>
                <small>Menos de 6 series por semana. ${r ? `«${esc(r.nombre)}» es la rutina que más los trabaja.` : "Agrega un ejercicio para ellos en ✏️ Rutinas."}</small>
                ${r && !yaHoy && !g.encurso ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-empezar" data-rutina="${r.id}">▶ Empezar ${r.icono} ${esc(r.nombre)}</button>` : ""}</li>`);
    }
    if (!avisos.length) return "";
    return `
        <section class="panel gym-avisos">
            <div class="gym-aurelio gym-consejo">
                ${cabezaDeAurelio(emoteDeAvisos)}
                <p><b>Aurelio te avisa</b>${avisos.length === 1 ? "Mira esto antes de entrenar." : `Mira estas ${avisos.length} cosas antes de entrenar.`}</p>
            </div>
            <ul class="gym-avisos-lista">${avisos.join("")}</ul>
        </section>`;
}

// ===== (v164) El Salón de récords: tu mejor marca de cada ejercicio, por músculo, con su medalla =====
export function tarjetaSalonRecords(estado) {
    const sesiones = estado.gym.sesiones;
    const salon = gym.salonDeRecords(sesiones);
    const zonas = Object.keys(gym.MUSCULOS).filter((m) => salon[m]);
    const medallas = gym.MEDALLAS.map((m) => `${m.icono} ${m.desde}`).join(" · ");
    if (!zonas.length) {
        return `
        <section class="panel">
            <h2 class="titulo-juego">🏛️ Salón de récords</h2>
            <p class="nota">Aquí aparecerá tu mejor marca de cada ejercicio, agrupada por músculo. Superarla da +${gym.XP_RECORD} XP y monedas, y cada músculo gana medallas con sus récords (${medallas}).</p>
        </section>`;
    }
    const total = zonas.reduce((suma, m) => suma + salon[m].records, 0);
    const bloque = (m) => {
        const z = salon[m];
        const musculo = gym.MUSCULOS[m];
        const siguiente = gym.MEDALLAS.find((x) => x.desde > z.records);
        const filas = z.ejercicios.map((x) => {
            const ej = gym.ejercicioPorId(x.id);
            const hist = gym.historialDe(sesiones, x.id).slice(-12).map((p) => p.puntaje);
            const marca = x.kg ? `1RM ${kilos(x.puntaje)} (${kilos(x.kg)} × ${x.reps})${x.kgMax > x.kg ? ` · máx. ${kilos(x.kgMax)}` : ""}` : `${x.reps} reps`;
            return `<li class="gym-record"><span>${esc(ej.nombre)}
                    <small class="texto-suave">${marca} · ${fechaCorta(x.fecha)}${x.records ? ` · 📈 ${x.records}` : ""}</small></span>
                    ${sparkline(hist)}</li>`;
        }).join("");
        return `
            <details class="plegable gym-salon">
                <summary><span>${musculo.icono} ${musculo.nombre}</span>
                    <span class="gym-medalla">${z.medalla ? `${z.medalla.icono} ${z.medalla.nombre}` : "—"}</span>
                    <small class="texto-suave">${plural(z.records, "récord", "récords")}${siguiente ? ` · ${siguiente.icono} a los ${siguiente.desde}` : ""}</small></summary>
                <ul class="historial">${filas}</ul>
            </details>`;
    };
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏛️ Salón de récords <span class="texto-suave">${plural(total, "récord", "récords")}</span></h2>
            <p class="nota">Tu mejor marca de cada ejercicio, por músculo. Cada récord da +${gym.XP_RECORD} XP y monedas: cuantos más llevas en un ejercicio, más difícil
               es el siguiente y más vale (hasta ×${gym.MAX_NIVEL_RECORD}). Medallas por récords: ${medallas}.</p>
            ${zonas.map(bloque).join("")}
        </section>`;
}

// ===== (v166) La gráfica grande de un ejercicio: tu 1RM y tu volumen, sesión a sesión =====
// Arriba, la línea del 1RM estimado (o de las repeticiones, si no hay peso); abajo, barras del volumen (kg × reps).
// Los puntos de una semana de descarga van en azul.
function graficaGrande(puntos) {
    const ancho = 320;
    const alto = 200;
    const izq = 36;
    const der = 10;
    const lista = puntos.slice(-20);
    const n = lista.length;
    const x = (i) => Math.round(izq + (n === 1 ? (ancho - izq - der) / 2 : (i / (n - 1)) * (ancho - izq - der)));
    const valores = lista.map((p) => p.puntaje);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const y = (v) => Math.round(98 - ((v - min) / (max - min || 1)) * 70);   // la línea vive entre y = 28 y y = 98
    const volMax = Math.max(...lista.map((p) => p.volumen), 1);
    const linea = lista.map((p, i) => `${x(i)},${y(p.puntaje)}`).join(" ");
    const ancho1 = Math.max(4, Math.min(16, Math.floor((ancho - izq - der) / n) - 3));
    const barras = lista.map((p, i) => {
        const h = Math.max(2, Math.round((p.volumen / volMax) * 52));
        return `<rect x="${x(i) - Math.floor(ancho1 / 2)}" y="${176 - h}" width="${ancho1}" height="${h}" fill="${p.descarga ? "#38bdf8" : "#a78bfa"}"><title>${fechaCorta(p.fecha)}: ${p.volumen.toLocaleString("es")} kg</title></rect>`;
    }).join("");
    const cuadros = lista.map((p, i) => `<rect x="${x(i) - 2.5}" y="${y(p.puntaje) - 2.5}" width="5" height="5" fill="${p.descarga ? "#38bdf8" : "#fbbf24"}" stroke="#06040d" stroke-width="1"><title>${fechaCorta(p.fecha)}: ${p.puntaje}</title></rect>`).join("");
    const redondo = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
    return `<svg class="gym-grafica" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Tu 1RM y tu volumen en este ejercicio" shape-rendering="crispEdges">
        <text x="2" y="12" class="gym-grafica-titulo">1RM estimado</text>
        <path d="M${izq} 28h${ancho - izq - der}M${izq} 63h${ancho - izq - der}M${izq} 98h${ancho - izq - der}" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="${izq - 4}" y="31" text-anchor="end">${redondo(max)}</text>
        <text x="${izq - 4}" y="101" text-anchor="end">${redondo(min)}</text>
        ${n > 1 ? `<polyline points="${linea}" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linejoin="miter"/>` : ""}
        ${cuadros}
        <text x="2" y="122" class="gym-grafica-titulo">Volumen (kg × reps)</text>
        <path d="M${izq} 176h${ancho - izq - der}" stroke="rgba(255,255,255,.2)" stroke-width="1"/>
        <text x="${izq - 4}" y="132" text-anchor="end">${volMax.toLocaleString("es")}</text>
        ${barras}
        <text x="${izq}" y="194">${fechaCorta(lista[0].fecha)}</text>
        ${n > 1 ? `<text x="${ancho - der}" y="194" text-anchor="end">${fechaCorta(lista[n - 1].fecha)}</text>` : ""}
    </svg>`;
}

export function tarjetaGraficaEjercicio(estado, ctx) {
    const sesiones = estado.gym.sesiones;
    const ids = gym.ejerciciosConHistorial(sesiones);
    if (!ids.length) return "";
    const id = ids.includes(ctx.gymEjercicio) ? ctx.gymEjercicio : ids[0];
    const puntos = gym.progresoDe(sesiones, id);
    const ej = gym.ejercicioPorId(id);
    const conPeso = puntos.some((p) => p.kg > 0);
    const primero = puntos[0];
    const mejor = puntos.reduce((m, p) => (p.puntaje > m.puntaje ? p : m));
    const cambio = puntos.length > 1 && primero.puntaje > 0 ? Math.round(((puntos[puntos.length - 1].puntaje - primero.puntaje) / primero.puntaje) * 100) : null;
    const volumenTotal = puntos.reduce((suma, p) => suma + p.volumen, 0);
    const opciones = ids.map((x) => `<option value="${x}" ${x === id ? "selected" : ""}>${esc(gym.ejercicioPorId(x).nombre)}</option>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">📈 Gráfica por ejercicio</h2>
            <label class="campo-gym"><span class="nota">Elige un ejercicio:</span>
                <select data-gym-grafica aria-label="Ejercicio de la gráfica">${opciones}</select></label>
            ${graficaGrande(puntos)}
            <ul class="gym-chips">
                <li>🏆 <b>${conPeso ? kilos(mejor.puntaje) : `${mejor.puntaje} reps`}</b> ${conPeso ? "1RM" : "mejor"}</li>
                <li>📅 <b>${puntos.length}</b> ${puntos.length === 1 ? "sesión" : "sesiones"}</li>
                ${cambio !== null ? `<li>${cambio >= 0 ? "📈" : "📉"} <b>${cambio > 0 ? "+" : ""}${cambio}</b> % desde el inicio</li>` : ""}
                <li>🏋️ <b>${volumenTotal.toLocaleString("es")}</b> ${conPeso ? "kg movidos" : "reps"}</li>
            </ul>
            <p class="mini texto-suave">${esc(ej.nombre)}. El 1RM es el peso máximo que podrías levantar una vez (se estima con tu mejor serie). Los puntos azules son semanas de descarga.</p>
        </section>`;
}

// ===== (v164) El diario del gym: tus notas (sueño y molestias) y los patrones que se ven en ellas =====
export function tarjetaDiarioGym(estado) {
    const sesiones = estado.gym.sesiones;
    if (!sesiones.length) return "";
    const patrones = gym.patronesDelGym(sesiones);
    const notas = sesiones.filter((s) => s.nota).slice(-6).reverse().map((s) => {
        const r = gym.rutinaPorId(s.rutina);
        const sueno = s.nota.sueno ? `${gym.SUENOS[s.nota.sueno].icono} ${gym.SUENOS[s.nota.sueno].nombre}` : "";
        return `<li class="gym-nota-fila"><b>${fechaCorta(s.fecha)} · ${r?.icono || "🏋️"} ${esc(r?.nombre || "")}</b>
                    <small class="texto-suave">${[sueno, s.nota.texto ? `«${esc(s.nota.texto)}»` : ""].filter(Boolean).join(" · ")}</small></li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">📓 Diario del gym</h2>
            ${patrones.length
                ? `<ul class="gym-propuestas">${patrones.map((p) => `<li>${p.icono} ${esc(p.texto)}</li>`).join("")}</ul>`
                : '<p class="nota">Al terminar cada entrenamiento, anota cómo dormiste anoche y si algo te molestó. Con unas cuantas notas, aquí verás patrones (por ejemplo, si rindes menos cuando duermes mal).</p>'}
            ${notas ? `<ul class="historial">${notas}</ul>` : ""}
        </section>`;
}

// ===== (v79) El consejo del día, el reto de la semana y tu evolución =====
export function consejoDelDia(ctx) {
    return `<div class="gym-aurelio gym-consejo">
                ${cabezaDeAurelio()}
                <p><b>Consejo de Aurelio</b>${esc(gymAurelio.consejoDelDia(ctx.hoy))}</p>
            </div>`;
}

export function tarjetaReto(estado, ctx) {
    const r = gym.progresoDelReto(estado.gym, lunesDe(ctx.hoy));
    return `<div class="gym-reto ${r.cobrado ? "cobrado" : ""}">
                <p class="etiqueta">🧙 Reto de la semana de Aurelio</p>
                <p class="gym-reto-texto">${r.reto.icono} ${esc(r.reto.texto(estado.gym))}</p>
                ${barra(Math.round((r.hecho / r.meta) * 100), "barra-gym")}
                <p class="mini texto-suave">${r.cobrado ? `✅ Cumplido y cobrado (+${gym.PREMIO_RETO.gemas} 💎)` : `${r.hecho.toLocaleString("es")} / ${r.meta.toLocaleString("es")} · premio: +${gym.PREMIO_RETO.gemas} 💎 y +${gym.PREMIO_RETO.xp} XP`}</p>
            </div>`;
}

export function tarjetaEvolucion(estado, ctx) {
    const g = estado.gym;
    const fotos = gym.evolucion(g.sesiones, g.peso, g.altura);
    if (fotos.length < 2) return "";
    const ahora = { fecha: ctx.hoy, nivel: gym.nivelDeGym(g.sesiones).nivel, kg: g.peso[g.peso.length - 1]?.kg ?? null };
    ahora.fisico = gym.fisicoDe(ahora.nivel);
    ahora.corpulencia = gym.corpulenciaDe(gym.imcActual(g));
    const lista = [...fotos, ahora].slice(-5);
    const casillas = lista.map((f, i) => `
        <figure class="gym-foto ${i === lista.length - 1 ? "ahora" : ""}">
            <div class="gym-foto-cuerpo">${cuerpoGymPixel({ ...ctx.avatar, fisico: f.fisico, corpulencia: f.corpulencia })}</div>
            <figcaption><b>${i === lista.length - 1 ? "Hoy" : fechaCorta(f.fecha)}</b><small>Nv ${f.nivel} · ${gym.NOMBRES_DE_FISICO[f.fisico]}${f.kg ? ` · ${kilos(f.kg)}` : ""}</small></figcaption>
        </figure>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">📸 Tu evolución</h2>
            <p class="nota">Cómo se veía tu cuerpo cada vez que tu físico subió de escalón. Desliza para verlo.</p>
            <div class="gym-evolucion">${casillas}</div>
        </section>`;
}

// ===== Recompensas de constancia: piezas de armadura que se ganan cumpliendo tu meta varias semanas seguidas =====
export function recompensasDeConstancia(estado) {
    const mejor = gym.mejorRachaSemanal(estado.gym.sesiones, estado.gym.metaSemanal, hoyDeHoy());
    const piezas = Object.entries(avatar.OBJETOS).filter(([, o]) => o.logro?.tipo === "gymsemanas").sort((a, b) => a[1].logro.meta - b[1].logro.meta);
    const filas = piezas.map(([id, o]) => {
        const ganada = mejor >= o.logro.meta;
        return `<li class="gym-pieza ${ganada ? "ganada" : ""}">
                    <span class="gym-pieza-icono" aria-hidden="true">${ganada ? o.icono : "🔒"}</span>
                    <span><b>${esc(o.nombre)}</b><small>${ganada ? "¡Ganada! Equípala en Héroe › Equipo." : `${esc(o.logro.texto)} · llevas ${Math.min(mejor, o.logro.meta)}/${o.logro.meta}`}</small></span>
                </li>`;
    }).join("");
    return `<details class="plegable"><summary>🛡️ Armadura por constancia (${piezas.filter(([, o]) => mejor >= o.logro.meta).length}/${piezas.length})</summary>
                <p class="nota">Cumple tu meta de días por semana varias semanas seguidas y ganas piezas legendarias para tu héroe.</p>
                <ul class="gym-piezas">${filas}</ul></details>`;
}

// ===== Las lecturas de la Fragua (se abren con el nivel de gym) =====
export function tarjetaLecturas(estado) {
    const nivel = gym.nivelDeGym(estado.gym.sesiones).nivel;
    const abiertas = fragua.lecturasAbiertas(nivel).length;
    const lista = fragua.LECTURAS.map((l) => {
        if (nivel < l.nivel) {
            return `<li class="gym-lectura cerrada"><span aria-hidden="true">🔒</span><span><b>${esc(l.titulo)}</b><small>Se abre en el nivel ${l.nivel} de gym.</small></span></li>`;
        }
        return `
            <li class="gym-lectura">
                <details>
                    <summary><b>${esc(l.titulo)}</b> <small class="texto-suave">${fragua.minutosDeLectura(l)} min</small></summary>
                    <div class="gym-lectura-texto">
                        ${l.parrafos.map((p) => `<p>${esc(p)}</p>`).join("")}
                        <p class="gym-moraleja">«${esc(l.moraleja)}»</p>
                    </div>
                </details>
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">📜 Lecturas de la Fragua <span class="texto-suave">${abiertas}/${fragua.LECTURAS.length}</span></h2>
            <p class="nota">Maren, la herrera, escribió estos textos para quien entrena. Se abren al subir de nivel de gym.</p>
            <ul class="gym-lecturas">${lista}</ul>
        </section>`;
}

// ===== Peso corporal =====
export function tarjetaPeso(estado, ctx) {
    const g = estado.gym;
    const lista = g.peso;
    const ultimo = lista[lista.length - 1];
    const primero = lista[0];
    const cambio = ultimo && primero && lista.length > 1 ? Math.round((ultimo.kg - primero.kg) * 10) / 10 : null;
    const hoyPuesto = ultimo && ultimo.fecha === ctx.hoy;
    // (v74) El IMC, con tu último peso y tu altura.
    const valorImc = gym.imcActual(g);
    const cat = valorImc === null ? null : gym.categoriaDeImc(valorImc);
    const marcador = valorImc === null ? 0 : Math.max(2, Math.min(98, ((valorImc - 15) / 25) * 100));
    const [min, max] = g.altura ? gym.pesoSaludable(g.altura) : [0, 0];
    const bloqueImc = valorImc === null
        ? `<p class="nota">${g.altura ? "Anota tu peso para calcular el IMC." : ultimo ? "Anota tu altura para calcular el IMC." : "Anota tu altura y tu peso para calcular el IMC."}</p>`
        : `<div class="gym-imc">
               <p class="gym-imc-numero"><b style="color: ${cat.color}">${String(valorImc).replace(".", ",")}</b> <span>IMC · ${cat.nombre}</span></p>
               <div class="gym-imc-escala" role="img" aria-label="IMC ${valorImc}: ${cat.nombre}">
                   <i style="background: #38bdf8; flex: 3.5"></i><i style="background: #34d399; flex: 6.5"></i><i style="background: #fbbf24; flex: 5"></i><i style="background: #fb7185; flex: 10"></i>
                   <b style="left: ${marcador}%"></b></div>
               <p class="mini texto-suave">Para ${g.altura} cm, un IMC normal va de ${kilos(min)} a ${kilos(max)}. El IMC no distingue músculo de grasa: con mucho músculo puede salir más alto de lo que parece.</p>
           </div>`;
    return `
        <section class="panel">
            <h2 class="titulo-juego">⚖️ Peso, altura e IMC</h2>
            ${ultimo ? `<p class="gym-peso-actual"><b>${kilos(ultimo.kg)}</b> <span class="texto-suave">· ${fechaCorta(ultimo.fecha)}${cambio !== null ? ` · ${cambio > 0 ? "+" : ""}${String(cambio).replace(".", ",")} kg desde el inicio` : ""}${g.altura ? ` · ${g.altura} cm` : ""}</span></p>
                       ${sparkline(lista.slice(-30).map((p) => p.kg), { ancho: 300, alto: 48, color: "#34d399" })}`
                : `<p class="nota">Anota tu peso de vez en cuando para ver tu avance${g.altura ? ` (tu altura: ${g.altura} cm)` : ""}.</p>`}
            ${bloqueImc}
            <form data-form="gym-peso" class="form-linea">
                <input type="text" name="kg" inputmode="decimal" required placeholder="${hoyPuesto ? "Cambiar el peso de hoy" : "Tu peso de hoy (kg)"}" aria-label="Peso corporal en kilos">
                <button type="submit" class="boton boton-chico">${hoyPuesto ? "Cambiar" : "Anotar"}</button>
            </form>
            <form data-form="gym-altura" class="form-linea">
                <input type="number" name="cm" inputmode="numeric" step="1" min="100" max="230" required placeholder="${g.altura ? `Tu altura: ${g.altura} cm (cambiarla)` : "Tu altura (cm)"}" aria-label="Altura en centímetros">
                <button type="submit" class="boton boton-chico">${g.altura ? "Cambiar" : "Guardar"}</button>
            </form>
            ${bloqueMetaDePeso(g)}
            <p class="mini texto-suave">Tu avatar de arriba cambia con tu peso (IMC) y con tu nivel de gym.</p>
        </section>
        ${tarjetaMedidas(estado, ctx)}`;
}

// ===== (v82) Peso objetivo y medidas del cuerpo =====
function bloqueMetaDePeso(g) {
    const a = gym.avanceDePeso(g.peso, g.metaPeso);
    const estado = a
        ? `<div class="gym-metapeso">
               <p class="mini">🎯 Tu objetivo: <b>${kilos(g.metaPeso)}</b> · ${a.llego ? "¡lo lograste! 🎉" : `te faltan <b>${kilos(Math.abs(a.falta))}</b> ${a.falta < 0 ? "por bajar" : "por subir"}`}</p>
               ${barra(a.porcentaje, "barra-gym")}
           </div>`
        : g.metaPeso ? `<p class="mini">🎯 Tu objetivo: <b>${kilos(g.metaPeso)}</b>. Anota tu peso para ver el avance.</p>` : "";
    return `${estado}
            <form data-form="gym-meta-peso" class="form-linea">
                <input type="text" name="kg" inputmode="decimal" placeholder="${g.metaPeso ? `Objetivo: ${kilos(g.metaPeso)} (cambiarlo; vacío lo quita)` : "Tu peso objetivo (kg)"}" aria-label="Peso objetivo en kilos">
                <button type="submit" class="boton boton-chico">${g.metaPeso ? "Cambiar" : "Fijar"}</button>
            </form>`;
}

function tarjetaMedidas(estado, ctx) {
    const lista = estado.gym.medidas;
    const ultima = lista[lista.length - 1];
    const filas = Object.entries(gym.MEDIDAS).map(([clave, m]) => {
        const c = gym.cambioDeMedida(lista, clave);
        if (!c) return "";
        const dif = Math.round((c.ultimo - c.primero) * 10) / 10;
        const historia = lista.filter((x) => Number.isFinite(x[clave])).slice(-12).map((x) => x[clave]);
        return `<li class="gym-medida"><span>${m.icono} ${m.nombre}</span>
                    <span><b>${String(c.ultimo).replace(".", ",")} cm</b>${c.cuantas > 1 ? ` <small class="texto-suave">(${dif > 0 ? "+" : ""}${String(dif).replace(".", ",")} cm desde el inicio)</small>` : ""}</span>
                    ${sparkline(historia, { ancho: 70, alto: 20, color: "#38bdf8" })}</li>`;
    }).join("");
    const campos = Object.entries(gym.MEDIDAS).map(([clave, m]) => `
        <label class="gym-campo-medida"><span>${m.icono} ${m.nombre}</span>
            <input type="text" name="${clave}" inputmode="decimal" placeholder="${ultima?.[clave] ? String(ultima[clave]).replace(".", ",") : "cm"}" aria-label="${m.nombre} en centímetros"></label>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">📏 Medidas del cuerpo</h2>
            ${filas ? `<ul class="gym-medidas">${filas}</ul>` : '<p class="nota">Con una cinta métrica, anota de vez en cuando tu pecho, brazo, cintura y muslo: a veces el cuerpo cambia aunque el peso no.</p>'}
            <form data-form="gym-medidas" class="gym-form-medidas">
                <div class="gym-campos-medida">${campos}</div>
                <button type="submit" class="boton boton-chico boton-ancho">Anotar las de hoy</button>
            </form>
        </section>`;
}

// ===== Historial =====
export function tarjetaHistorial(estado) {
    const sesiones = estado.gym.sesiones;
    if (!sesiones.length) return "";
    const recientes = sesiones.map((s, i) => ({ s, i })).slice(-12).reverse();
    const filas = recientes.map(({ s, i }) => {
        const r = gym.rutinaPorId(s.rutina);
        const series = s.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
        const volumen = Math.round(gym.volumenDe(s));
        return `<li class="gym-historial">
                    <span><b>${r.icono} ${esc(r.nombre)}</b>
                        <small class="texto-suave">${fechaCorta(s.fecha)} · ${s.rapido ? "✅ marcado" : plural(series, "serie", "series")}${volumen ? ` · ${volumen.toLocaleString("es")} kg` : ""} · +${s.xp} XP${s.records.length ? ` · 📈 ${plural(s.records.length, "récord", "récords")}` : ""}</small></span>
                    ${s.rapido || !series ? "" : `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-editar" data-indice="${i}" aria-label="Corregir esta sesión">✏️</button>`}
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-borrar" data-indice="${i}" aria-label="Borrar esta sesión">🗑️</button>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">Últimas sesiones</h2>
            <ul class="historial">${filas}</ul>
        </section>`;
}
