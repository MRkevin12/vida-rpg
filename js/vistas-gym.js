// vistas-gym.js — Las pantallas del Gimnasio (v66): tu entrenamiento, tu nivel de gym, tus músculos y tus récords.
//
// Como vistas.js, solo convierte la partida en HTML (texto). Las reglas están en gym.js.
// El peso y las repeticiones son <input> con data-gym="kg" / "reps": app.js los guarda al cambiarlos (sin redibujar,
// para que no se te cierre el teclado a medio escribir). Marcar una serie sí redibuja.

import * as gym from "./gym.js";
import * as fragua from "./fragua.js";
import * as avatar from "./avatar.js";
import * as gymAurelio from "./gym-aurelio.js";
import { describirMaestro } from "./maestro.js";
import { dibujarAvatar, dibujarAvatarGym } from "./dibujo.js";
import { dibujarMovimiento } from "./dibujo-ejercicios.js";
import { plural } from "./juego.js";
import { esc } from "./vistas.js";
import { fechaCorta, sumarDias, lunesDe, diaDeSemana, DIAS_LETRAS, hoy as hoyDeHoy } from "./fechas.js";

const barra = (porcentaje, clase = "") => `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;
const kilos = (kg) => `${String(kg).replace(".", ",")} kg`;
// El tiempo que llevas entrenando: 12:05 o 1:02:30.
const duracionLarga = (ms) => {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
const duracion = (segundos) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

// Una gráfica de línea pequeña (SVG) con los valores dados. Con menos de 2 valores no se dibuja.
function sparkline(valores, { ancho = 84, alto = 24, color = "#fbbf24" } = {}) {
    if (valores.length < 2) return "";
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const rango = max - min || 1;
    const puntos = valores.map((x, i) => `${(i / (valores.length - 1)) * (ancho - 4) + 2},${alto - 3 - ((x - min) / rango) * (alto - 6)}`);
    const ultimo = puntos[puntos.length - 1].split(",");
    return `<svg class="gym-spark" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" aria-hidden="true">
        <polyline points="${puntos.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${ultimo[0]}" cy="${ultimo[1]}" r="2.6" fill="${color}"/></svg>`;
}

// Cuánto hace de la última vez que hiciste una rutina, en palabras.
function haceCuanto(dias) {
    if (dias === null) return "Aún no la has hecho";
    if (dias === 0) return "Hecha hoy";
    if (dias === 1) return "Ayer";
    return `Hace ${dias} días`;
}

// ===== La tarjeta de Hoy =====
// Una sola fila: qué toca hoy y un botón para entrenar (o «Seguir» si ya empezaste).
export function tarjetaGymHoy(estado, ctx) {
    const g = estado.gym;
    const hechoHoy = g.sesiones.filter((s) => s.fecha === ctx.hoy);
    if (g.encurso) {
        const r = gym.rutinaPorId(g.encurso.rutina);
        return `
        <div class="gym-hoy gym-hoy-activo">
            <span class="gym-hoy-icono" aria-hidden="true">${r.icono}</span>
            <span class="gym-hoy-texto"><b>Entrenando: ${esc(r.nombre)}</b><small>${gym.seriesMarcadas(g.encurso)} series hechas</small></span>
            <button type="button" class="boton boton-chico boton-principal" data-accion="ir" data-pantalla="gym">Seguir</button>
        </div>`;
    }
    if (hechoHoy.length) {
        const r = gym.rutinaPorId(hechoHoy[hechoHoy.length - 1].rutina);
        return `
        <div class="gym-hoy gym-hoy-hecho">
            <span class="gym-hoy-icono" aria-hidden="true">✅</span>
            <span class="gym-hoy-texto"><b>Hoy entrenaste ${esc(r.nombre)}</b><small>Descansa: el músculo crece mientras duermes.</small></span>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="gym">Ver</button>
        </div>`;
    }
    const toca = gym.siguienteRutina(g.sesiones);
    const lunes = lunesDe(ctx.hoy);
    return `
        <div class="gym-hoy">
            <span class="gym-hoy-icono" aria-hidden="true">${toca.icono}</span>
            <span class="gym-hoy-texto"><b>Gym: hoy toca ${esc(toca.nombre)}</b><small>Meta de la semana: ${gym.diasDeLaSemana(g.sesiones, lunes)} de ${g.metaSemanal} días</small></span>
            <span class="gym-hoy-botones">
                <button type="button" class="boton boton-chico boton-principal" data-accion="gym-rapido" data-rutina="toca" aria-label="Marcar que hoy entrené">✅ Marcar</button>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="gym">Abrir</button>
            </span>
        </div>`;
}

// ===== La pantalla del gimnasio =====
// ctx = { hoy, ahora, avatar, descanso: { fin, total } | null }
export function pantallaGym(estado, ctx) {
    const g = estado.gym;
    return `
        <div class="titulo-seccion encabezado">
            <h2 class="titulo-juego">🏋️ Gimnasio</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="hoy">‹ Hoy</button>
        </div>
        ${!g.encurso && ctx.resumenGym ? tarjetaResumen(estado, ctx) : ""}
        ${tarjetaNivel(estado, ctx, Boolean(g.encurso))}
        ${g.encurso ? "" : consejoDelDia(ctx)}
        ${g.encurso ? "" : tarjetaEvolucion(estado, ctx)}
        ${g.encurso ? entrenamientoActual(estado, ctx) : `${tarjetaSemana(estado, ctx)}${listaDeRutinas(estado, ctx)}${tarjetaConstancia(estado, ctx)}`}
        ${g.encurso ? "" : `
            ${tarjetaMusculos(estado)}
            ${tarjetaRecords(estado)}
            ${tarjetaHitos(estado)}
            ${tarjetaLecturas(estado)}
            ${tarjetaPeso(estado, ctx)}
            ${tarjetaHistorial(estado)}
            ${tarjetaAjustes(estado)}`}`;
}

function tarjetaNivel(estado, ctx, compacta = false) {
    const sesiones = estado.gym.sesiones;
    const n = gym.nivelDeGym(sesiones);
    const rango = gym.rangoDe(n.nivel);
    const bono = Math.round(gym.bonoDeGym(n.nivel) * 100);
    const total = gym.totales(sesiones);
    const siguiente = gym.RANGOS.find((r) => r.desde > n.nivel);
    // (v74) Tu cuerpo en calzoncillos: el nivel de gym marca los músculos y tu peso (IMC) cambia la silueta.
    const miImc = gym.imcActual(estado.gym);
    // (v75) Vista previa: puedes ver cómo se vería tu cuerpo con otro nivel de gym o con otro peso, sin cambiar tus datos.
    const vista = ctx.gymVista || null;
    const fisico = vista?.fisico ?? gym.fisicoDe(n.nivel);
    const corpulencia = vista?.corp ?? gym.corpulenciaDe(miImc);
    const proximo = gym.NIVELES_DE_FISICO[fisico + 1];
    const cuerpo = dibujarAvatarGym({ ...ctx.avatar, fisico, corpulencia });
    const boton = (texto, atributos, activo) => `<button type="button" class="boton boton-chico ${activo ? "boton-principal" : "boton-secundario"}" data-accion="gym-vista" ${atributos} aria-pressed="${Boolean(activo)}">${texto}</button>`;
    const pesos = [[-1, "Delgado"], [0, "Normal"], [0.6, "Con peso"], [1.1, "Mucho peso"]];
    const controles = `
        <details class="plegable gym-vista" ${vista ? "open" : ""}>
            <summary>👀 Vista previa: ver cómo cambia tu cuerpo</summary>
            <p class="nota">Elige un nivel de físico y un peso para ver cómo se vería. No cambia tus datos.</p>
            <div class="gym-vista-botones">${gym.NIVELES_DE_FISICO.map((nivel, i) => boton(`Nv ${nivel}`, `data-fisico="${i}"`, vista && vista.fisico === i)).join("")}</div>
            <div class="gym-vista-botones">${pesos.map(([c, nombre]) => boton(nombre, `data-corp="${c}"`, vista && vista.corp === c)).join("")}</div>
            ${vista ? '<button type="button" class="boton boton-chico boton-secundario boton-ancho" data-accion="gym-vista" data-quitar="1">↩ Volver a mi cuerpo real</button>' : ""}
        </details>`;
    return `
        <section class="panel gym-heroe ${compacta ? "" : "gym-heroe-grande"}">
            <div class="gym-avatar" role="img" aria-label="Tu cuerpo: ${gym.NOMBRES_DE_FISICO[fisico]}">${cuerpo}</div>
            <div class="gym-nivel">
                ${vista ? '<p class="gym-vista-aviso">👀 Vista previa (no es tu cuerpo real)</p>' : ""}
                <p class="mini texto-suave gym-fisico">Físico: <b>${gym.NOMBRES_DE_FISICO[fisico]}</b>${proximo ? ` · ${gym.NOMBRES_DE_FISICO[fisico + 1]} en el nivel ${proximo}` : " · el máximo"}</p>
                <p class="etiqueta">${rango.icono} ${rango.nombre}</p>
                <p class="gym-nivel-numero">Nivel <b>${n.nivel}</b> de gym</p>
                ${barra(n.porcentaje, "barra-gym")}
                <p class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP${siguiente ? ` · ${siguiente.icono} ${siguiente.nombre} en el nivel ${siguiente.desde}` : ""}</p>
            </div>
        </section>
        ${controles}
<p class="nota gym-bono">${bono ? `💪 Tu entrenamiento le da a tu héroe <b>+${bono} % de vida y de ataque</b> en la Torre y en las mazmorras.`
            : "💪 Desde el nivel 2, cada nivel de gym le da a tu héroe +1 % de vida y de ataque en la Torre y las mazmorras (hasta +25 %)."}
            ${total.sesiones ? ` Llevas ${plural(total.sesiones, "sesión", "sesiones")}, ${plural(total.series, "serie", "series")} y ${total.volumen.toLocaleString("es")} kg movidos.` : ""}</p>`;
}

// ===== La semana =====
function tarjetaSemana(estado, ctx) {
    const g = estado.gym;
    const lunes = lunesDe(ctx.hoy);
    const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
    const hechos = gym.diasDeLaSemana(g.sesiones, lunes);
    const racha = gym.rachaSemanal(g.sesiones, g.metaSemanal, ctx.hoy);
    const celdas = dias.map((fecha) => {
        const deEseDia = g.sesiones.filter((s) => s.fecha === fecha);
        const iconos = deEseDia.map((s) => gym.rutinaPorId(s.rutina)?.icono || "🏋️").join("");
        const clases = ["gym-dia", deEseDia.length ? "hecho" : "", fecha === ctx.hoy ? "hoy" : "", fecha > ctx.hoy ? "futuro" : ""].join(" ");
        return `<li class="${clases}"><small>${DIAS_LETRAS[diaDeSemana(fecha)]}</small><span>${iconos || "·"}</span></li>`;
    }).join("");
    // (v74) La meta que se marca: un botón para decir «hoy entrené» (sin anotar series), o marcar otra rutina u otro día.
    const toca = gym.siguienteRutina(g.sesiones);
    const ayer = sumarDias(ctx.hoy, -1);
    const yaHoy = g.sesiones.some((s) => s.fecha === ctx.hoy && s.rutina === toca.id);
    const filaMarcar = (r, esAyer) => {
        const fecha = esAyer ? ayer : ctx.hoy;
        const hecha = g.sesiones.some((s) => s.fecha === fecha && s.rutina === r.id);
        return `<li class="gym-rutina gym-rutina-chica"><span>${r.icono} ${esc(r.nombre)}</span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-rapido" data-rutina="${r.id}" ${esAyer ? 'data-ayer="1"' : ""} ${hecha ? "disabled" : ""}>${hecha ? "✓" : "Marcar"}</button></li>`;
    };
    const marcar = `
        <button type="button" class="boton ${yaHoy ? "boton-secundario" : "boton-principal"} boton-ancho gym-marcar" data-accion="gym-rapido" data-rutina="toca" ${yaHoy ? "disabled" : ""}>
            ${yaHoy ? `✅ Hoy ya marcaste ${esc(toca.nombre)}` : `✅ Marcar que hoy entrené: ${toca.icono} ${esc(toca.nombre)}`}</button>
        <details class="plegable"><summary>Marcar otra rutina u otro día</summary>
            <p class="nota">Hoy:</p><ul class="gym-rutinas">${gym.RUTINA.map((r) => filaMarcar(r, false)).join("")}</ul>
            <p class="nota">Ayer, si se te olvidó:</p><ul class="gym-rutinas">${gym.RUTINA.map((r) => filaMarcar(r, true)).join("")}</ul>
        </details>`;
    return `
        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">🎯 Tu meta de la semana</h2>
                <p class="contador ${hechos >= g.metaSemanal ? "completo" : ""}">${hechos >= g.metaSemanal ? "✨" : ""}${hechos}/${g.metaSemanal}</p>
            </div>
            <ol class="gym-semana">${celdas}</ol>
            ${barra(Math.min(100, Math.round((hechos / g.metaSemanal) * 100)), "barra-gym")}
            <p class="nota">${racha ? `🔥 <b>${plural(racha, "semana seguida", "semanas seguidas")}</b> cumpliendo tu meta.` : "Cumple tu meta de la semana para empezar una racha de semanas."}
               Marca cada día que entrenes (+${gym.XP_RAPIDO} XP) o, si quieres, anota tus series más abajo (da más XP y récords).</p>
            ${marcar}
            ${tarjetaReto(estado, ctx)}
            ${recompensasDeConstancia(estado)}
        </section>`;
}

// ===== Las últimas 12 semanas (como el calendario de misiones): un cuadrito por día =====
function tarjetaConstancia(estado, ctx) {
    const sesiones = estado.gym.sesiones;
    if (!sesiones.length) return "";
    const SEMANAS = 12;
    const primerLunes = sumarDias(lunesDe(ctx.hoy), -7 * (SEMANAS - 1));
    const porDia = {};
    for (const s of sesiones) porDia[s.fecha] = (porDia[s.fecha] || 0) + 1;
    let celdas = "";
    let total = 0;
    for (let semana = 0; semana < SEMANAS; semana++) {
        for (let dia = 0; dia < 7; dia++) {
            const fecha = sumarDias(primerLunes, semana * 7 + dia);
            const n = porDia[fecha] || 0;
            total += n;
            celdas += `<i class="gym-cuadro n${Math.min(n, 2)} ${fecha > ctx.hoy ? "futuro" : ""} ${fecha === ctx.hoy ? "hoy" : ""}" title="${fechaCorta(fecha)}${n ? ` · ${plural(n, "entrenamiento", "entrenamientos")}` : ""}"></i>`;
        }
    }
    return `
        <section class="panel">
            <h2 class="titulo-juego">Tu constancia <span class="texto-suave">${SEMANAS} semanas</span></h2>
            <div class="gym-calendario" role="img" aria-label="${plural(total, "entrenamiento", "entrenamientos")} en las últimas ${SEMANAS} semanas">${celdas}</div>
            <p class="mini texto-suave">Cada columna es una semana (lunes arriba). ${plural(total, "entrenamiento", "entrenamientos")} en ${SEMANAS} semanas.</p>
        </section>`;
}

// ===== Elegir qué entrenar =====
function listaDeRutinas(estado, ctx) {
    const g = estado.gym;
    const toca = gym.siguienteRutina(g.sesiones);
    const ayer = sumarDias(ctx.hoy, -1);
    const fila = (r) => {
        const dias = gym.diasDesde(g.sesiones, r.id, ctx.hoy);
        const yaHoy = dias === 0;
        const esLaQueToca = r.id === toca.id && !yaHoy;
        const musculos = [...new Set(r.ejercicios.map((x) => gym.MUSCULOS[x.musculo].nombre))].join(" · ");
        return `
            <li class="gym-rutina ${esLaQueToca ? "toca" : ""} ${yaHoy ? "hecha" : ""}">
                <span class="gym-rutina-icono" aria-hidden="true">${r.icono}</span>
                <span class="gym-rutina-texto">
                    <b>${esc(r.nombre)}</b>${esLaQueToca ? ' <span class="gym-toca">Toca hoy</span>' : ""}
                    <small>${plural(r.ejercicios.length, "ejercicio", "ejercicios")} · ${gym.seriesPlaneadas(r)} series · ${musculos}</small>
                    <small class="texto-suave">${haceCuanto(dias)}</small>
                </span>
                <span class="gym-rutina-botones">
                    <button type="button" class="boton boton-chico ${esLaQueToca ? "boton-principal" : "boton-secundario"}" data-accion="gym-empezar" data-rutina="${r.id}" ${yaHoy ? "disabled" : ""}>${yaHoy ? "✓" : "Anotar"}</button>
                </span>
            </li>`;
    };
    const ayerFilas = gym.RUTINA.map((r) => {
        const hecha = g.sesiones.some((s) => s.fecha === ayer && s.rutina === r.id);
        return `<li class="gym-rutina gym-rutina-chica"><span>${r.icono} ${esc(r.nombre)}</span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-empezar" data-rutina="${r.id}" data-ayer="1" ${hecha ? "disabled" : ""}>${hecha ? "✓" : "Anotar"}</button></li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">Anotar un entrenamiento con detalle</h2>
            <p class="nota">Opcional: anota el peso y las repeticiones de cada serie. Da más XP de 💪 Fuerza que solo marcar el día, sube tus músculos,
               cuenta récords y la app te dice cómo superarte.</p>
            <ul class="gym-rutinas">${RUTINA_ORDENADA(toca).map(fila).join("")}</ul>
            <details class="plegable"><summary>Se me olvidó anotar ayer</summary><ul class="gym-rutinas">${ayerFilas}</ul></details>
        </section>`;
}

// La que toca primero y después las demás en su orden.
function RUTINA_ORDENADA(toca) {
    const i = gym.RUTINA.findIndex((r) => r.id === toca.id);
    return [...gym.RUTINA.slice(i), ...gym.RUTINA.slice(0, i)];
}

// ===== El entrenamiento en curso =====
function entrenamientoActual(estado, ctx) {
    return estado.gym.foco ? vistaDeFoco(estado, ctx) : vistaDeLista(estado, ctx);
}

// (v78) El MODO FOCO: una serie a la vez, con letras y botones grandes (para usar con las manos sudadas, entre pesa y pesa).
function vistaDeFoco(estado, ctx) {
    const g = estado.gym;
    const en = g.encurso;
    const rutina = gym.rutinaPorId(en.rutina);
    const total = en.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    const hechas = gym.seriesMarcadas(en);
    const actual = gym.serieActual(en);
    const descansando = ctx.descanso && ctx.descanso.fin > ctx.ahora;
    const sinMovimiento = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cabecera = `
        <div class="titulo-seccion">
            <div>
                <p class="etiqueta">${en.fecha !== ctx.hoy ? "Entrenamiento de ayer" : "Modo foco"}</p>
                <h2 class="titulo-juego">${rutina.icono} ${esc(rutina.nombre)}</h2>
            </div>
            <p class="contador ${hechas === total ? "completo" : ""}">${hechas}/${total}</p>
        </div>
        ${barra(total ? Math.round((hechas / total) * 100) : 0, "barra-gym")}
        <ul class="gym-chips" aria-label="Cómo vas">
            <li>⏱️ <b data-gym-inicio="${en.inicio}">${duracionLarga(Math.max(0, ctx.ahora - en.inicio))}</b></li>
            <li>🏋️ <b>${gym.volumenMarcado(en).toLocaleString("es")}</b> kg</li>
            <li>🔥 <b>${hechas}</b> de ${total}</li>
        </ul>`;
    const pie = `
        <button type="button" class="boton boton-chico ${en.calentado ? "boton-principal" : "boton-secundario"} gym-calentar" data-accion="gym-calentar" aria-pressed="${Boolean(en.calentado)}">
            ${en.calentado ? "✅ Calentamiento hecho (+" + gym.XP_CALENTAMIENTO + " XP)" : "🔥 Marcar calentamiento (+" + gym.XP_CALENTAMIENTO + " XP)"}</button>
        <div class="gym-foco-pie">
            <button type="button" class="boton boton-secundario" data-accion="gym-foco" data-valor="0">📋 Ver todos los ejercicios</button>
            <button type="button" class="boton boton-secundario" data-accion="gym-cancelar">Cancelar</button>
        </div>`;

    // Ya está todo hecho.
    if (!actual) {
        return `
        <section class="panel gym-sesion gym-foco">
            ${cabecera}
            <p class="gym-foco-listo">🏁 ¡Todo hecho!</p>
            ${burbujaDeAurelio(ctx)}
            <button type="button" class="boton boton-principal boton-ancho gym-foco-grande" data-accion="gym-terminar">Terminar entrenamiento</button>
            ${ejerciciosExtra(en)}
            ${pie}
        </section>`;
    }

    const ej = en.ejercicios[actual.ejercicio];
    const s = ej.series[actual.serie];
    const info = gym.ejercicioPorId(ej.id);
    const musculo = gym.MUSCULOS[info.musculo];
    const movimiento = gym.movimientoDe(ej.id);
    const antes = gym.ultimaVez(g.sesiones, ej.id);
    const pista = gym.sugerencia(info, antes);
    const stepper = (campo, etiqueta, valor, paso, unidad) => `
        <div class="gym-stepper">
            <span class="gym-stepper-nombre">${etiqueta}</span>
            <button type="button" class="gym-mas-menos" data-accion="gym-ajuste" data-ej="${actual.ejercicio}" data-serie="${actual.serie}" data-campo="${campo}" data-delta="${-paso}" aria-label="Menos ${etiqueta}">−</button>
            <b class="gym-stepper-valor">${String(valor).replace(".", ",")}<small>${unidad}</small></b>
            <button type="button" class="gym-mas-menos" data-accion="gym-ajuste" data-ej="${actual.ejercicio}" data-serie="${actual.serie}" data-campo="${campo}" data-delta="${paso}" aria-label="Más ${etiqueta}">+</button>
        </div>`;
    const siguiente = `<p class="gym-foco-serie">Serie <b>${actual.serie + 1}</b> de ${ej.series.length} · objetivo ${info.min}–${info.max} reps</p>`;
    let escena;
    if (descansando) {
        const falta = Math.ceil((ctx.descanso.fin - ctx.ahora) / 1000);
        const largo = 2 * Math.PI * 52;
        const parte = Math.max(0, Math.min(1, (ctx.descanso.fin - ctx.ahora) / ctx.descanso.total));
        escena = `
            <div class="gym-foco-descanso" role="timer">
                <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="gym-anillo-pista" cx="60" cy="60" r="52"/>
                    <circle class="gym-anillo" cx="60" cy="60" r="52" transform="rotate(-90 60 60)" stroke-dasharray="${largo.toFixed(1)}" stroke-dashoffset="${(largo * (1 - parte)).toFixed(1)}"
                            data-gym-anillo data-fin="${ctx.descanso.fin}" data-total="${ctx.descanso.total}" data-largo="${largo.toFixed(1)}"/></svg>
                <div class="gym-foco-descanso-texto"><small>Descanso</small><b data-descanso-fin="${ctx.descanso.fin}">${duracion(falta)}</b></div>
            </div>
            <p class="gym-foco-siguiente">Sigue: <b>${esc(info.nombre)}</b></p>`;
    } else {
        escena = `<div class="gym-foco-demo" aria-hidden="true">${dibujarMovimiento(movimiento, ctx.avatar.apariencia, { animar: !sinMovimiento })}</div>
                  <h3 class="gym-foco-nombre">${musculo.icono} ${esc(info.nombre)}</h3>`;
    }
    return `
        <section class="panel gym-sesion gym-foco">
            ${cabecera}
            ${escena}
            ${siguiente}
            <p class="mini gym-pista gym-pista-${pista.tipo}">💡 ${pista.texto}</p>
            <p class="mini gym-tecnica">🎯 ${esc(gymAurelio.consejoDeTecnica(movimiento, actual.ejercicio + actual.serie))}</p>
            ${stepper("kg", "Peso", s.kg, 2.5, " kg")}
            ${stepper("reps", "Repeticiones", s.reps, 1, "")}
            <button type="button" class="boton boton-secundario boton-ancho gym-contar" data-accion="gym-contar" data-ej="${actual.ejercicio}" data-serie="${actual.serie}">
                👆 ${s.contando ? `Toca por cada repetición: llevas ${s.reps}` : "Contar las repeticiones tocando"}</button>
            <button type="button" class="boton boton-principal boton-ancho gym-foco-grande" data-accion="gym-serie" data-ej="${actual.ejercicio}" data-serie="${actual.serie}">
                ${descansando ? "⏭️ Empezar ya esta serie" : "✅ Terminé la serie"}</button>
            ${descansando ? '<button type="button" class="boton boton-secundario boton-ancho" data-accion="gym-saltar-descanso">Saltar el descanso</button>' : ""}
            ${burbujaDeAurelio(ctx)}
            ${pie}
        </section>`;
}

// La lista de todos los ejercicios (el modo de siempre).
function vistaDeLista(estado, ctx) {
    const g = estado.gym;
    const en = g.encurso;
    const rutina = gym.rutinaPorId(en.rutina);
    const hechas = gym.seriesMarcadas(en);
    const total = en.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    const mejores = gym.mejoresDe(g.sesiones);
    const ayer = en.fecha !== ctx.hoy;
    const kilosMovidos = gym.volumenMarcado(en);
    // (v77) Solo se mueve la figura del ejercicio que toca ahora; las demás se quedan quietas (menos batería y menos distracción).
    const actual = en.ejercicios.findIndex((ej) => ej.series.some((s) => !s.hecha));
    const sinMovimiento = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ejercicios = en.ejercicios.map((ej, ei) => {
        const info = gym.ejercicioPorId(ej.id);
        const movimiento = gym.movimientoDe(ej.id);
        const antes = gym.ultimaVez(g.sesiones, ej.id);
        const mejor = mejores[ej.id];
        const pista = gym.sugerencia(info, antes);
        const musculo = gym.MUSCULOS[info.musculo];
        const series = ej.series.map((s, si) => `
            <div class="gym-serie ${s.hecha ? "hecha" : ""}">
                <span class="gym-n">${si + 1}</span>
                <label><span>kg</span><input type="number" inputmode="decimal" step="0.5" min="0" max="${gym.MAX_KG}" value="${s.kg}"
                    data-gym="kg" data-ej="${ei}" data-serie="${si}" aria-label="Peso de la serie ${si + 1}"></label>
                <label><span>reps</span><input type="number" inputmode="numeric" step="1" min="0" max="${gym.MAX_REPS}" value="${s.reps}"
                    data-gym="reps" data-ej="${ei}" data-serie="${si}" aria-label="Repeticiones de la serie ${si + 1}"></label>
                <button type="button" class="gym-ok" data-accion="gym-serie" data-ej="${ei}" data-serie="${si}" aria-pressed="${s.hecha}"
                        aria-label="Serie ${si + 1} hecha">✓</button>
            </div>`).join("");
        const hechasEj = ej.series.filter((s) => s.hecha).length;
        return `
            <article class="gym-ejercicio ${hechasEj === ej.series.length ? "completo" : ""} ${ei === actual ? "actual" : ""}">
                <div class="gym-demo" aria-hidden="true">${dibujarMovimiento(movimiento, ctx.avatar.apariencia, { animar: ei === actual && !sinMovimiento })}</div>
                <h3>${musculo.icono} ${esc(info.nombre)}</h3>
                <p class="mini texto-suave gym-meta-ej">${info.series} × ${info.min}–${info.max} reps · ${musculo.nombre}
                    ${sparkline(gym.historialDe(g.sesiones, ej.id).slice(-10).map((x) => x.puntaje), { ancho: 70, alto: 20 })}</p>
                <p class="mini gym-antes">${antes
                    ? `Última vez (${fechaCorta(antes.fecha)}): ${antes.series.map((s) => (s.kg ? `${kilos(s.kg)}×${s.reps}` : `${s.reps} reps`)).join(" · ")}`
                    : "Primera vez que lo haces."}
                    ${mejor && mejor.kg ? ` 🏆 ${kilos(mejor.kg)} × ${mejor.reps}` : ""}</p>
                <p class="mini gym-pista gym-pista-${pista.tipo}">💡 ${pista.texto}</p>
                <p class="mini gym-tecnica">🎯 Técnica: ${esc(gymAurelio.consejoDeTecnica(movimiento, ei))}</p>
                ${series}
                <div class="gym-mas">
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-serie-mas" data-ej="${ei}">+ serie</button>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-serie-menos" data-ej="${ei}" ${ej.series.length <= 1 ? "disabled" : ""}>− serie</button>
                </div>
            </article>`;
    }).join("");

    const descanso = ctx.descanso && ctx.descanso.fin > ctx.ahora
        ? `<div class="gym-descanso" role="timer">
              <span>⏳ Descanso <b data-descanso-fin="${ctx.descanso.fin}">${duracion(Math.ceil((ctx.descanso.fin - ctx.ahora) / 1000))}</b></span>
              <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-saltar-descanso">Saltar</button>
           </div>`
        : "";

    return `
        <section class="panel gym-sesion">
            <div class="titulo-seccion">
                <div>
                    <p class="etiqueta">${ayer ? `Entrenamiento de ayer` : "Entrenando ahora"}</p>
                    <h2 class="titulo-juego">${rutina.icono} ${esc(rutina.nombre)}</h2>
                </div>
                <p class="contador ${hechas === total ? "completo" : ""}">${hechas}/${total}</p>
            </div>
            ${barra(total ? Math.round((hechas / total) * 100) : 0, "barra-gym")}
            <ul class="gym-chips" aria-label="Cómo vas">
                <li>⏱️ <b data-gym-inicio="${en.inicio}">${duracionLarga(Math.max(0, ctx.ahora - en.inicio))}</b></li>
                <li>🏋️ <b>${kilosMovidos.toLocaleString("es")}</b> kg</li>
                <li>🔥 <b>${hechas}</b> de ${total} series</li>
            </ul>
            <button type="button" class="boton boton-chico ${en.calentado ? "boton-principal" : "boton-secundario"} gym-calentar" data-accion="gym-calentar" aria-pressed="${Boolean(en.calentado)}">
                ${en.calentado ? "✅ Calentamiento hecho (+" + gym.XP_CALENTAMIENTO + " XP)" : "🔥 Marcar calentamiento (+" + gym.XP_CALENTAMIENTO + " XP)"}</button>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-foco" data-valor="1">🎯 Pasar al modo foco (una serie a la vez)</button>
            ${descanso}
            ${burbujaDeAurelio(ctx)}
            ${ejercicios}
            ${ejerciciosExtra(en)}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="gym-terminar" ${hechas ? "" : "disabled"}>Terminar entrenamiento</button>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="gym-cancelar">Cancelar (no se guarda)</button>
            <p class="nota">Marca ✓ cada serie al terminarla: empieza el descanso (${gym.DESCANSOS.includes(g.descanso) ? duracion(g.descanso) : "1:30"}). El XP llega al terminar.</p>
        </section>`;
}

// Lo que dice Aurelio (entre serie y serie, al empezar, al calentar…). ctx.fraseGym = { tipo, texto } o null.
function burbujaDeAurelio(ctx) {
    if (!ctx.fraseGym) return "";
    return `<div class="gym-aurelio" role="status">
                <span class="gym-aurelio-retrato" aria-hidden="true">${dibujarAvatar(describirMaestro(), { mini: true })}</span>
                <p><b>Aurelio</b>${esc(ctx.fraseGym.texto)}</p>
            </div>`;
}

// El resumen del entrenamiento que acabas de terminar (hasta que cambies de pantalla).
function tarjetaResumen(estado, ctx) {
    const s = ctx.resumenGym;
    const r = gym.rutinaPorId(s.rutina);
    if (!r) return "";
    const series = s.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    const kg = Math.round(gym.volumenDe(s));
    const musculos = [...new Set(s.ejercicios.map((ej) => gym.ejercicioPorId(ej.id)?.musculo).filter(Boolean))];
    return `
        <section class="panel gym-resumen">
            <p class="etiqueta">🏁 ${s.rapido ? "Meta del día cumplida" : "Entrenamiento terminado"}</p>
            <h2 class="titulo-juego">${r.icono} ${esc(r.nombre)}</h2>
            <ul class="gym-chips">
                ${s.rapido ? "" : `<li>⏱️ <b>${s.minutos || 1}</b> min</li><li>🔥 <b>${series}</b> series</li>${kg ? `<li>🏋️ <b>${kg.toLocaleString("es")}</b> kg</li>` : ""}`}
                <li>💪 +<b>${s.xp}</b> XP</li>
                ${s.records.length ? `<li>📈 <b>${s.records.length}</b> ${s.records.length === 1 ? "récord" : "récords"}</li>` : ""}
            </ul>
            ${musculos.length ? `<p class="mini texto-suave">Trabajaste: ${musculos.map((m) => `${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}`).join(" · ")}</p>` : ""}
            ${ctx.fraseGym ? burbujaDeAurelio(ctx) : ""}
        </section>`;
}

// Los ejercicios extra que aún no están en el entrenamiento, agrupados por músculo.
function ejerciciosExtra(en) {
    const disponibles = gym.EXTRAS.filter((x) => !en.ejercicios.some((y) => y.id === x.id));
    if (!disponibles.length) return "";
    const porMusculo = {};
    for (const x of disponibles) (porMusculo[x.musculo] ||= []).push(x);
    const grupos = Object.entries(porMusculo).map(([m, lista]) => `
        <p class="mini texto-suave">${gym.MUSCULOS[m].icono} ${gym.MUSCULOS[m].nombre}</p>
        <div class="gym-extras">${lista.map((x) => `<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-extra" data-ejercicio="${x.id}">+ ${esc(x.nombre)}</button>`).join("")}</div>`).join("");
    return `<details class="plegable"><summary>➕ Ejercicio extra</summary>${grupos}</details>`;
}

// ===== Músculos =====
function tarjetaMusculos(estado) {
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

// ===== Récords =====
function tarjetaRecords(estado) {
    const mejores = Object.entries(gym.mejoresDe(estado.gym.sesiones))
        .sort((a, b) => b[1].puntaje - a[1].puntaje);
    const fila = ([id, m]) => {
        const ej = gym.ejercicioPorId(id);
        const hist = gym.historialDe(estado.gym.sesiones, id).slice(-12).map((x) => x.puntaje);
        return `<li class="gym-record"><span>${gym.MUSCULOS[ej.musculo].icono} ${esc(ej.nombre)}
                <small class="texto-suave">${m.kg ? `${kilos(m.kg)} × ${m.reps}` : `${m.reps} reps`} · ${fechaCorta(m.fecha)}</small></span>
                ${sparkline(hist)}</li>`;
    };
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏆 Récords personales</h2>
            ${mejores.length
                ? `<ul class="historial">${mejores.slice(0, 6).map(fila).join("")}</ul>
                   ${mejores.length > 6 ? `<details class="plegable"><summary>Ver los otros ${mejores.length - 6}</summary><ul class="historial">${mejores.slice(6).map(fila).join("")}</ul></details>` : ""}`
                : '<p class="nota">Aquí aparecerá tu mejor marca de cada ejercicio. Superarla da +15 XP extra.</p>'}
        </section>`;
}

// ===== Hitos =====
function tarjetaHitos(estado) {
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

// ===== (v79) El consejo del día, el reto de la semana y tu evolución =====
function consejoDelDia(ctx) {
    return `<div class="gym-aurelio gym-consejo">
                <span class="gym-aurelio-retrato" aria-hidden="true">${dibujarAvatar(describirMaestro(), { mini: true })}</span>
                <p><b>Consejo de Aurelio</b>${esc(gymAurelio.consejoDelDia(ctx.hoy))}</p>
            </div>`;
}

function tarjetaReto(estado, ctx) {
    const r = gym.progresoDelReto(estado.gym, lunesDe(ctx.hoy));
    return `<div class="gym-reto ${r.cobrado ? "cobrado" : ""}">
                <p class="etiqueta">🧙 Reto de la semana de Aurelio</p>
                <p class="gym-reto-texto">${r.reto.icono} ${esc(r.reto.texto(estado.gym))}</p>
                ${barra(Math.round((r.hecho / r.meta) * 100), "barra-gym")}
                <p class="mini texto-suave">${r.cobrado ? `✅ Cumplido y cobrado (+${gym.PREMIO_RETO.gemas} 💎)` : `${r.hecho.toLocaleString("es")} / ${r.meta.toLocaleString("es")} · premio: +${gym.PREMIO_RETO.gemas} 💎 y +${gym.PREMIO_RETO.xp} XP`}</p>
            </div>`;
}

function tarjetaEvolucion(estado, ctx) {
    const g = estado.gym;
    const fotos = gym.evolucion(g.sesiones, g.peso, g.altura);
    if (fotos.length < 2) return "";
    const ahora = { fecha: ctx.hoy, nivel: gym.nivelDeGym(g.sesiones).nivel, kg: g.peso[g.peso.length - 1]?.kg ?? null };
    ahora.fisico = gym.fisicoDe(ahora.nivel);
    ahora.corpulencia = gym.corpulenciaDe(gym.imcActual(g));
    const lista = [...fotos, ahora].slice(-5);
    const casillas = lista.map((f, i) => `
        <figure class="gym-foto ${i === lista.length - 1 ? "ahora" : ""}">
            <div class="gym-foto-cuerpo">${dibujarAvatarGym({ ...ctx.avatar, fisico: f.fisico, corpulencia: f.corpulencia })}</div>
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
function recompensasDeConstancia(estado) {
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
function tarjetaLecturas(estado) {
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
function tarjetaPeso(estado, ctx) {
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
                <input type="number" name="kg" inputmode="decimal" step="0.1" min="20" max="400" required placeholder="${hoyPuesto ? "Cambiar el peso de hoy" : "Tu peso de hoy (kg)"}" aria-label="Peso corporal en kilos">
                <button type="submit" class="boton boton-chico">${hoyPuesto ? "Cambiar" : "Anotar"}</button>
            </form>
            <form data-form="gym-altura" class="form-linea">
                <input type="number" name="cm" inputmode="numeric" step="1" min="100" max="230" required placeholder="${g.altura ? `Tu altura: ${g.altura} cm (cambiarla)` : "Tu altura (cm)"}" aria-label="Altura en centímetros">
                <button type="submit" class="boton boton-chico">${g.altura ? "Cambiar" : "Guardar"}</button>
            </form>
            <p class="mini texto-suave">Tu avatar de arriba cambia con tu peso (IMC) y con tu nivel de gym.</p>
        </section>`;
}

// ===== Historial =====
function tarjetaHistorial(estado) {
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
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-borrar" data-indice="${i}" aria-label="Borrar esta sesión">🗑️</button>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">Últimas sesiones</h2>
            <ul class="historial">${filas}</ul>
        </section>`;
}

// ===== Ajustes =====
function tarjetaAjustes(estado) {
    const g = estado.gym;
    const descansos = gym.DESCANSOS.map((s) => `
        <button type="button" class="boton boton-chico ${g.descanso === s ? "boton-principal" : "boton-secundario"}" data-accion="gym-descanso" data-segundos="${s}" aria-pressed="${g.descanso === s}">${duracion(s)}</button>`).join("");
    return `
        <details class="panel plegable">
            <summary>⚙️ Ajustes del gym</summary>
            <p class="nota">Días de gym por semana (tu meta): <b>${g.metaSemanal}</b></p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-meta" data-delta="-1" ${g.metaSemanal <= 1 ? "disabled" : ""}>− Menos</button>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-meta" data-delta="1" ${g.metaSemanal >= 7 ? "disabled" : ""}>+ Más</button>
            </div>
            <label class="campo-gym"><span class="nota">Al terminar un entrenamiento, marcar esta misión diaria:</span>
                <select data-gym-mision aria-label="Misión que se marca al entrenar">
                    <option value="">— Ninguna —</option>
                    ${estado.misiones.filter((m) => !m.archivadaEn).map((m) => `<option value="${m.id}" ${g.mision === m.id ? "selected" : ""}>${esc(m.nombre)}</option>`).join("")}
                </select></label>
            <p class="nota">Descanso entre series:</p>
            <div class="botones-dialogo">${descansos}</div>
        </details>`;
}
