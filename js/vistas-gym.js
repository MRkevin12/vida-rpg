// vistas-gym.js — Las pantallas del Gimnasio (v66): tu entrenamiento, tu nivel de gym, tus músculos y tus récords.
//
// Como vistas.js, solo convierte la partida en HTML (texto). Las reglas están en gym.js.
// El peso y las repeticiones son <input> con data-gym="kg" / "reps": app.js los guarda al cambiarlos (sin redibujar,
// para que no se te cierre el teclado a medio escribir). Marcar una serie sí redibuja.

import * as gym from "./gym.js";
import { plural } from "./juego.js";
import { esc } from "./vistas.js";
import { dibujarAvatar } from "./dibujo.js";
import { fechaCorta, sumarDias, lunesDe, diaDeSemana, DIAS_LETRAS } from "./fechas.js";

const barra = (porcentaje, clase = "") => `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${porcentaje}%"></div></div>`;
const kilos = (kg) => `${String(kg).replace(".", ",")} kg`;
const duracion = (segundos) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

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
            <span class="gym-hoy-texto"><b>Gym: hoy toca ${esc(toca.nombre)}</b><small>Esta semana ${gym.diasDeLaSemana(g.sesiones, lunes)} de ${g.metaSemanal} días</small></span>
            <button type="button" class="boton boton-chico boton-principal" data-accion="ir" data-pantalla="gym">Entrenar</button>
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
        ${tarjetaNivel(estado, ctx)}
        ${g.encurso ? entrenamientoActual(estado, ctx) : `${tarjetaSemana(estado, ctx)}${listaDeRutinas(estado, ctx)}`}
        ${g.encurso ? "" : `
            ${tarjetaMusculos(estado)}
            ${tarjetaRecords(estado)}
            ${tarjetaHitos(estado)}
            ${tarjetaHistorial(estado)}
            ${tarjetaAjustes(estado)}`}`;
}

function tarjetaNivel(estado, ctx) {
    const sesiones = estado.gym.sesiones;
    const n = gym.nivelDeGym(sesiones);
    const rango = gym.rangoDe(n.nivel);
    const bono = Math.round(gym.bonoDeGym(n.nivel) * 100);
    const total = gym.totales(sesiones);
    const siguiente = gym.RANGOS.find((r) => r.desde > n.nivel);
    return `
        <section class="panel gym-heroe">
            <div class="gym-avatar" aria-hidden="true">${dibujarAvatar(ctx.avatar)}</div>
            <div class="gym-nivel">
                <p class="etiqueta">${rango.icono} ${rango.nombre}</p>
                <p class="gym-nivel-numero">Nivel <b>${n.nivel}</b> de gym</p>
                ${barra(n.porcentaje, "barra-gym")}
                <p class="mini texto-suave">${n.xpEnNivel} / ${n.xpNecesaria} XP${siguiente ? ` · ${siguiente.icono} ${siguiente.nombre} en el nivel ${siguiente.desde}` : ""}</p>
            </div>
        </section>
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
    return `
        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">Tu semana</h2>
                <p class="contador ${hechos >= g.metaSemanal ? "completo" : ""}">${hechos >= g.metaSemanal ? "✨" : ""}${hechos}/${g.metaSemanal}</p>
            </div>
            <ol class="gym-semana">${celdas}</ol>
            ${barra(Math.min(100, Math.round((hechos / g.metaSemanal) * 100)), "barra-gym")}
            <p class="nota">${racha ? `🔥 <b>${plural(racha, "semana seguida", "semanas seguidas")}</b> cumpliendo tu meta.` : "Cumple tu meta de la semana para empezar una racha de semanas."}</p>
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
                <button type="button" class="boton boton-chico ${esLaQueToca ? "boton-principal" : "boton-secundario"}" data-accion="gym-empezar" data-rutina="${r.id}" ${yaHoy ? "disabled" : ""}>${yaHoy ? "✓" : "Empezar"}</button>
            </li>`;
    };
    const ayerFilas = gym.RUTINA.map((r) => {
        const hecha = g.sesiones.some((s) => s.fecha === ayer && s.rutina === r.id);
        return `<li class="gym-rutina gym-rutina-chica"><span>${r.icono} ${esc(r.nombre)}</span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-empezar" data-rutina="${r.id}" data-ayer="1" ${hecha ? "disabled" : ""}>${hecha ? "✓" : "Anotar"}</button></li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">¿Qué entrenas hoy?</h2>
            <p class="nota">Cada serie que hagas de verdad le da XP de 💪 Fuerza a tu héroe, sube tus músculos y tu nivel de gym.
               Anota el peso y las repeticiones: la app te dice cómo superarte.</p>
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
    const g = estado.gym;
    const en = g.encurso;
    const rutina = gym.rutinaPorId(en.rutina);
    const hechas = gym.seriesMarcadas(en);
    const total = en.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    const mejores = gym.mejoresDe(g.sesiones);
    const ayer = en.fecha !== ctx.hoy;

    const ejercicios = en.ejercicios.map((ej, ei) => {
        const info = gym.ejercicioPorId(ej.id);
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
            <article class="gym-ejercicio ${hechasEj === ej.series.length ? "completo" : ""}">
                <h3>${musculo.icono} ${esc(info.nombre)}</h3>
                <p class="mini texto-suave">${info.series} × ${info.min}–${info.max} reps · ${musculo.nombre}</p>
                <p class="mini gym-antes">${antes
                    ? `Última vez (${fechaCorta(antes.fecha)}): ${antes.series.map((s) => (s.kg ? `${kilos(s.kg)}×${s.reps}` : `${s.reps} reps`)).join(" · ")}`
                    : "Primera vez que lo haces."}
                    ${mejor && mejor.kg ? ` 🏆 ${kilos(mejor.kg)} × ${mejor.reps}` : ""}</p>
                <p class="mini gym-pista gym-pista-${pista.tipo}">💡 ${pista.texto}</p>
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
            ${descanso}
            ${ejercicios}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="gym-terminar" ${hechas ? "" : "disabled"}>Terminar entrenamiento</button>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="gym-cancelar">Cancelar (no se guarda)</button>
            <p class="nota">Marca ✓ cada serie al terminarla: empieza el descanso (${gym.DESCANSOS.includes(g.descanso) ? duracion(g.descanso) : "1:30"}). El XP llega al terminar.</p>
        </section>`;
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
        return `<li><span>${gym.MUSCULOS[ej.musculo].icono} ${esc(ej.nombre)}</span>
                <span class="texto-suave">${m.kg ? `${kilos(m.kg)} × ${m.reps}` : `${m.reps} reps`} · ${fechaCorta(m.fecha)}</span></li>`;
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
                        <small class="texto-suave">${fechaCorta(s.fecha)} · ${plural(series, "serie", "series")}${volumen ? ` · ${volumen.toLocaleString("es")} kg` : ""} · +${s.xp} XP${s.records.length ? ` · 📈 ${plural(s.records.length, "récord", "récords")}` : ""}</small></span>
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
            <p class="nota">Descanso entre series:</p>
            <div class="botones-dialogo">${descansos}</div>
        </details>`;
}
