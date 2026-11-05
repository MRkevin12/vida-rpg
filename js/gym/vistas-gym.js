// vistas-gym.js — Las pantallas del Gimnasio (v66): tu entrenamiento, tu nivel de gym, tus músculos y tus récords.
//
// Como vistas.js, solo convierte la partida en HTML (texto). Las reglas están en gym.js.
// El peso y las repeticiones son <input> con data-gym="kg" / "reps": app.js los guarda al cambiarlos (sin redibujar,
// para que no se te cierre el teclado a medio escribir). Marcar una serie sí redibuja.

import * as gym from "./gym.js";
import * as gymAurelio from "./gym-aurelio.js";
import { cuerpoGymPixel, pixelarEnVivo, escenaEjercicio, prepararEscena } from "../dibujo/retratos.js";
import { plural } from "../juego.js";
import { esc, selectorSecciones, vacio } from "../pantallas/vistas-comun.js";
import { fechaCorta, sumarDias, lunesDe, diaDeSemana, DIAS_LETRAS } from "../fechas.js";
import { barra, kilos, duracionLarga, sparkline, tarjetaMapaCuerpo, tarjetaMusculos, tarjetaHitos, tarjetaAvisos, tarjetaSalonRecords, tarjetaGraficaEjercicio, tarjetaDiarioGym, consejoDelDia, tarjetaReto, tarjetaEvolucion, recompensasDeConstancia, tarjetaLecturas, tarjetaPeso, tarjetaHistorial } from "./vistas-gym-tarjetas.js";
import { botonesDeEjercicio, figuraDeAurelio, burbujaDeAurelio, tarjetaResumen, ejerciciosExtra, tarjetaEditarRutinas } from "./vistas-gym-dialogos.js";
export { dialogoCambiarEjercicio, dialogoDiscos, dialogoCorregirSesion, dialogoSeguirGym, dialogoPlantilla, dialogoElegirEjercicio } from "./vistas-gym-dialogos.js";   // (orden) siguen saliendo de aquí
export { dibujarMapaCuerpo } from "./vistas-gym-tarjetas.js";   // (orden) siguen saliendo de aquí

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
    const racha = gym.rachaSemanal(g.sesiones, g.metaSemanal, ctx.hoy);   // (v164)
    // (v174) Aviso suave: solo una frase más en la tarjeta (sin ventanas ni botones) cuando llevas más días sin entrenar de lo normal para tu meta.
    const sinEntrenar = gym.avisoSinEntrenar(g, ctx.hoy);
    return `
        <div class="gym-hoy">
            <span class="gym-hoy-icono" aria-hidden="true">${toca.icono}</span>
            <span class="gym-hoy-texto"><b>Gym: hoy toca ${esc(toca.nombre)}</b><small>Meta de la semana: ${gym.diasDeLaSemana(g.sesiones, lunes)} de ${g.metaSemanal} días${racha ? ` · 🔥 ${plural(racha, "semana", "semanas")}` : ""}${gym.descargaDeLaSemana(g, lunes) ? " · 🛌 descarga" : ""}${sinEntrenar ? ` · ⏳ ${sinEntrenar} días sin entrenar` : ""}</small></span>
            <span class="gym-hoy-botones">
                <button type="button" class="boton boton-chico boton-principal" data-accion="gym-empezar" data-rutina="${toca.id}" aria-label="Empezar el entrenamiento de hoy">▶ Empezar</button>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="gym">Abrir</button>
            </span>
        </div>`;
}

// ===== La pantalla del gimnasio =====
// (v83) Un menú de 4 secciones (como Progreso y Tienda) en vez de una sola pantalla larguísima:
//   Entrenar (lo de hoy) · Progreso (músculos, récords, hitos, historial) · Cuerpo (físico, evolución, peso, medidas) · Más (Fragua y ajustes).
// Mientras hay un entrenamiento en curso no hay menú: solo ves el entrenamiento.
export const SECCIONES_GYM = [["entrenar", "🏋️ Entrenar"], ["progreso", "📈 Progreso"], ["cuerpo", "🧍 Cuerpo"], ["rutinas", "✏️ Rutinas"], ["mas", "📜 Más"]];

// ctx = { hoy, ahora, avatar, descanso: { fin, total } | null, subvista }
export function pantallaGym(estado, ctx) {
    const g = estado.gym;
    const encabezado = `
        <div class="titulo-seccion encabezado">
            <h2 class="titulo-juego">🏋️ Gimnasio</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="hoy">‹ Hoy</button>
        </div>`;
    // (v156) En el modo foco solo se ve el entrenamiento: así cabe todo en la pantalla sin deslizar.
    if (g.encurso && g.foco) return entrenamientoActual(estado, ctx);
    if (g.encurso) return `${encabezado}${tarjetaNivel(estado, ctx, true)}${entrenamientoActual(estado, ctx)}`;

    // (El resumen del entrenamiento recién terminado se ve en «Entrenar»; app.js te lleva ahí al terminar.)
    const pedida = ctx.subvista?.gym;
    const seccion = SECCIONES_GYM.some(([clave]) => clave === pedida) ? pedida : "entrenar";
    const menu = selectorSecciones("gym", SECCIONES_GYM, seccion);
    const contenido = {
        entrenar: () => `
            ${ctx.resumenGym ? tarjetaResumen(estado, ctx) : ""}
            ${tarjetaNivel(estado, ctx, true)}
            ${tarjetaAvisos(estado, ctx) || consejoDelDia(ctx)}
            ${tarjetaSemana(estado, ctx)}
            ${listaDeRutinas(estado, ctx)}`,
        progreso: () => `
            ${tarjetaConstancia(estado, ctx)}
            ${tarjetaMapaCuerpo(estado, ctx)}
            ${tarjetaMusculos(estado)}
            ${tarjetaSalonRecords(estado)}
            ${tarjetaGraficaEjercicio(estado, ctx)}
            ${tarjetaDiarioGym(estado)}
            ${tarjetaHitos(estado)}
            ${tarjetaHistorial(estado)}
            ${estado.gym.sesiones.length ? "" : vacio("Aún no hay entrenamientos. Cuando anotes el primero, aquí verás tu constancia, tus músculos y tus récords.", "entrenamientos")}`,
        cuerpo: () => `
            ${tarjetaNivel(estado, ctx, false)}
            ${tarjetaEvolucion(estado, ctx)}
            ${tarjetaPeso(estado, ctx)}`,
        rutinas: () => tarjetaEditarRutinas(estado),
        mas: () => `
            ${tarjetaLecturas(estado)}
            ${tarjetaAjustes(estado)}`,
    }[seccion];
    return `${encabezado}${menu}${contenido()}`;
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
    const cuerpo = cuerpoGymPixel({ ...ctx.avatar, fisico, corpulencia });
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
        ${compacta ? "" : controles}
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
    // (v160) El día solo cuenta cuando TERMINAS y anotas el entrenamiento: ya no hay botón de «marcar» sin entrenar.
    // Otra rutina u otro día se empieza desde la lista de rutinas de abajo.
    const toca = gym.siguienteRutina(g.sesiones);
    const yaHoy = g.sesiones.some((s) => s.fecha === ctx.hoy && s.rutina === toca.id);
    const marcar = `
        <button type="button" class="boton ${yaHoy ? "boton-secundario" : "boton-principal"} boton-ancho gym-marcar" data-accion="gym-empezar" data-rutina="${toca.id}" ${yaHoy ? "disabled" : ""}>
            ${yaHoy ? `✅ Hoy ya entrenaste ${esc(toca.nombre)}` : `▶ Empezar entrenamiento: ${toca.icono} ${esc(toca.nombre)}`}</button>
        <p class="nota">Se marca cuando lo termines. ¿Otra rutina u otro día? Elígela en la lista de abajo.</p>`;
    return `
        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">🎯 Tu meta de la semana</h2>
                <p class="contador ${hechos >= g.metaSemanal ? "completo" : ""}">${hechos >= g.metaSemanal ? "✨" : ""}${hechos}/${g.metaSemanal}</p>
            </div>
            <ol class="gym-semana">${celdas}</ol>
            ${barra(Math.min(100, Math.round((hechos / g.metaSemanal) * 100)), "barra-gym")}
            <p class="nota">${racha ? `🔥 <b>${plural(racha, "semana seguida", "semanas seguidas")}</b> cumpliendo tu meta.` : "Cumple tu meta de la semana para empezar una racha de semanas."}
               Empieza tu entrenamiento, anota tus series y al terminar el día cuenta (da XP y récords).</p>
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
                    <b>${esc(r.nombre)}${esLaQueToca ? ' <span class="gym-toca">Toca hoy</span>' : ""}</b>
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

// (v158) ¿Se ve el entrenamiento a pantalla completa? Sí, mientras entrenas en el modo foco: app.js le pone al <body>
// la clase gym-pantalla-completa, que esconde la cabecera y las pestañas (sales con «‹» o con «📋 Lista»).
export const pantallaCompletaGym = (estado) => Boolean(estado.gym?.encurso && estado.gym.foco);

// (v158) Todas las series del entrenamiento en cuadritos, agrupadas por ejercicio: las hechas (doradas), la de ahora
// (parpadea) y las que faltan. Cada grupo ocupa lo que sus series (style="flex: n").
function mapaDeSeries(en, actual) {
    const grupos = en.ejercicios.map((ej, ei) => `<li style="flex: ${ej.series.length}">${ej.series.map((s, si) =>
        `<i class="${s.hecha ? "hecha" : ""}${s.cal ? " cal" : ""}${actual && actual.ejercicio === ei && actual.serie === si ? " ahora" : ""}"></i>`).join("")}</li>`).join("");
    return `<ol class="gym-foco-mapa" aria-hidden="true">${grupos}</ol>`;
}

// (v78) El MODO FOCO: una serie a la vez, con letras y botones grandes (para usar con las manos sudadas, entre pesa y pesa).
// (v158) A pantalla completa, como la pantalla de un juego: arriba la rutina, el tiempo y las series en cuadritos;
// en el medio el escenario (la figura que hace el ejercicio, o el reloj del descanso); abajo los contadores de peso y
// repeticiones y el botón grande, a la altura del pulgar.
function vistaDeFoco(estado, ctx) {
    const g = estado.gym;
    const en = g.encurso;
    const rutina = gym.rutinaPorId(en.rutina);
    const total = gym.seriesTotales(en);
    const hechas = gym.seriesMarcadas(en);
    const actual = gym.serieActual(en);
    const descansando = ctx.descanso && ctx.descanso.fin > ctx.ahora;
    const sinMovimiento = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apariencia = ctx.avatar.apariencia;
    const fisico = ctx.avatar.fisico || 0;
    // (v158) Arriba: «‹» para salir (el entrenamiento sigue), la rutina, el tiempo y los kilos; debajo, las series.
    const cabecera = `
        <header class="gym-foco-cabeza">
            <button type="button" class="gym-foco-salir" data-accion="ir" data-pantalla="hoy" aria-label="Salir a Hoy (el entrenamiento sigue)">‹</button>
            <h2 class="titulo-juego">${rutina.icono} ${esc(rutina.nombre)}${en.fecha !== ctx.hoy ? " <small>(ayer)</small>" : ""}${en.descarga ? " <small>🛌 descarga</small>" : ""}</h2>
            <span class="gym-foco-dato">⏱️ <b data-gym-inicio="${en.inicio}">${duracionLarga(Math.max(0, ctx.ahora - en.inicio))}</b></span>
            <span class="gym-foco-dato">🏋️ <b>${gym.volumenMarcado(en).toLocaleString("es")}</b> kg</span>
        </header>
        <div class="gym-foco-avance">
            ${mapaDeSeries(en, actual)}
            <p class="contador ${hechas === total ? "completo" : ""}">${hechas}/${total}</p>
        </div>`;
    // (v84) Terminar antes de completar todas las series (si ya marcaste alguna): antes solo se podía desde la lista.
    const terminarYa = hechas > 0 && hechas < total
        ? '<button type="button" class="boton boton-chico boton-secundario" data-accion="gym-terminar">🏁 Terminar</button>' : "";
    // (v156) Los botones de abajo, chicos y en una sola fila.
    const pie = `
        <div class="gym-foco-pie-fila">
            ${terminarYa}
            <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-foco" data-valor="0">📋 Lista</button>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-cancelar">Cancelar</button>
        </div>`;

    // Ya está todo hecho: la figura saca bíceps (la pose de la victoria).
    if (!actual) {
        return `
        <section class="panel gym-sesion gym-foco gym-foco-fin">
            ${cabecera}
            <div class="gym-foco-escenario">
                <div class="gym-foco-demo" aria-hidden="true">${escenaEjercicio("victoria", apariencia, { animar: !sinMovimiento, fisico, cuadro: 8 })}</div>
                <p class="gym-foco-listo">🏁 ¡Todo hecho!</p>
            </div>
            ${burbujaDeAurelio(ctx)}
            <button type="button" class="boton boton-principal boton-ancho gym-foco-grande" data-accion="gym-terminar">Terminar entrenamiento</button>
            ${ejerciciosExtra(en)}
            ${pie}
        </section>`;
    }

    const ej = en.ejercicios[actual.ejercicio];
    const s = ej.series[actual.serie];
    const info = gym.ejercicioPorId(ej.id);
    // (v166) ¿Esta serie es de calentamiento? ¿Cuál es la serie de trabajo que toca? ¿Aún se puede cambiar, saltar o calentar este ejercicio?
    const esCal = Boolean(s.cal);
    const nTrabajo = ej.series.slice(0, actual.serie).filter((x) => !x.cal).length + 1;
    const sinEmpezar = !ej.series.some((x) => x.hecha);
    const musculo = gym.MUSCULOS[info.musculo];
    const movimiento = gym.movimientoDe(ej.id);
    const antes = gym.ultimaVez(g.sesiones, ej.id);
    const pista = gym.sugerencia(info, antes);
    // (v158) Los contadores de peso y repeticiones, como los de un juego: el nombre arriba, − valor + abajo.
    // (v173) En los ejercicios sin peso (flexiones, abdominales…) un 0 se lee «Peso corporal», no «0 kg».
    const stepper = (campo, etiqueta, valor, paso, unidad) => `
        <div class="gym-stepper">
            <span class="gym-stepper-nombre">${etiqueta}</span>
            <button type="button" class="gym-mas-menos" data-accion="gym-ajuste" data-ej="${actual.ejercicio}" data-serie="${actual.serie}" data-campo="${campo}" data-delta="${-paso}" aria-label="Menos ${etiqueta}">−</button>
            ${campo === "kg" && valor === 0 && gym.PESO_CORPORAL.has(ej.id)
        ? '<b class="gym-stepper-valor gym-stepper-corporal">Peso corporal</b>'
        : `<b class="gym-stepper-valor">${String(valor).replace(".", ",")}<small>${unidad}</small></b>`}
            <button type="button" class="gym-mas-menos" data-accion="gym-ajuste" data-ej="${actual.ejercicio}" data-serie="${actual.serie}" data-campo="${campo}" data-delta="${paso}" aria-label="Más ${etiqueta}">+</button>
        </div>`;
    const siguiente = esCal
        ? '<p class="gym-foco-serie">🔥 <b>Calentamiento</b> · ligero</p>'
        : `<p class="gym-foco-serie">Serie <b>${nTrabajo}</b> de ${gym.seriesDeTrabajo(ej).length} · ${info.min}–${info.max} reps</p>`;
    // (v158) Las series de este ejercicio en cuadritos: hechas, la de ahora y las que faltan.
    const pips = `<span class="gym-pips" aria-hidden="true">${ej.series.map((x, si) => `<i class="${x.hecha ? "hecha" : si === actual.serie ? "ahora" : ""}${x.cal ? " cal" : ""}"></i>`).join("")}</span>`;
    // (v156) De la última vez, solo la mejor serie (la de más peso) para que quepa en una línea.
    const mejorAntes = antes?.series.reduce((m, x) => (x.kg > m.kg || (x.kg === m.kg && x.reps > m.reps) ? x : m));
    const ultima = mejorAntes ? `<p class="gym-foco-chip gym-antes">Última vez: ${mejorAntes.kg ? `${kilos(mejorAntes.kg)}×${mejorAntes.reps}` : `${mejorAntes.reps} reps`}</p>` : "";
    // (v158) La figura en pixel art, grande, sobre el gimnasio. Con «menos movimiento» se queda quieta a mitad del gesto.
    const figura = escenaEjercicio(movimiento, apariencia, { animar: !descansando && !sinMovimiento, fisico, cuadro: descansando ? 0 : 5 });
    // Mientras haces este, se va preparando la imagen del ejercicio que sigue (así aparece al instante).
    const proximo = en.ejercicios[actual.ejercicio + 1];
    if (proximo) prepararEscena(gym.movimientoDe(proximo.id), apariencia, { fisico });
    // (v173) Qué ejercicio viene después, bajo el botón grande (en el descanso ya dice «Sigue: …»).
    const despues = descansando ? "" : `<p class="gym-foco-despues">${proximo
        ? `Siguiente: <b>${esc(gym.ejercicioPorId(proximo.id)?.nombre || "")}</b>` : "🏁 Es el último ejercicio"}</p>`;
    let escena;
    if (descansando) {
        const falta = Math.ceil((ctx.descanso.fin - ctx.ahora) / 1000);
        const largo = 2 * Math.PI * 50;
        const parte = Math.max(0, Math.min(1, (ctx.descanso.fin - ctx.ahora) / ctx.descanso.total));
        // (v158) El reloj grande en el medio del escenario (la figura queda quieta y oscura detrás) y Aurelio abajo.
        escena = `
            <div class="gym-foco-demo" aria-hidden="true">${figura}</div>
            <div class="gym-foco-descanso" role="timer">
                <div class="gym-foco-reloj">
                    ${pixelarEnVivo(`<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="gym-anillo-fondo" cx="60" cy="60" r="57"/><circle class="gym-anillo-pista" cx="60" cy="60" r="50"/>
                        <circle class="gym-anillo" cx="60" cy="60" r="50" transform="rotate(-90 60 60)" stroke-dasharray="${largo.toFixed(1)}" stroke-dashoffset="${(largo * (1 - parte)).toFixed(1)}"
                                data-gym-anillo data-fin="${ctx.descanso.fin}" data-total="${ctx.descanso.total}" data-largo="${largo.toFixed(1)}"/></svg>`, 2)}
                    <div class="gym-foco-descanso-texto"><small>Descanso</small><b data-descanso-fin="${ctx.descanso.fin}">${duracion(falta)}</b></div>
                </div>
                ${burbujaDeAurelio(ctx)}
            </div>`;
    } else {
        escena = `<div class="gym-foco-demo" aria-hidden="true">${figura}</div>
            <p class="gym-foco-chip">${musculo.icono} ${musculo.nombre} · ${actual.ejercicio + 1}/${en.ejercicios.length}</p>
            ${ultima}`;
    }
    const titulo = descansando
        ? `<p class="gym-foco-siguiente">Sigue: <b>${esc(info.nombre)}</b></p>`
        : `<h3 class="gym-foco-nombre">${esc(info.nombre)}</h3>`;
    // (v164) La pista de hoy (lo de la última vez ya está en la ficha de arriba). Si propone otro peso, un botón lo pone.
    const pistaHtml = esCal ? '<p class="mini gym-pista">🔥 Calentamiento: peso ligero, sin llegar al límite. No cuenta para récords ni kilos; con la primera de tu entrenamiento ganas +'+gym.XP_CALENTAMIENTO+' XP.</p>' : pista.motivo && pista.kg !== s.kg && (pista.tipo === "bajar" ? pista.kg < s.kg : pista.kg > s.kg)
        ? `<button type="button" class="boton boton-chico boton-secundario boton-ancho gym-subir" data-accion="gym-ajuste" data-ej="${actual.ejercicio}" data-serie="${actual.serie}" data-campo="kg" data-delta="${Math.round((pista.kg - s.kg) * 100) / 100}" title="${esc(pista.texto)}">${pista.kg > s.kg ? "⬆️" : "⬇️"} ${pista.motivo}: ${pista.kg > s.kg ? "subir" : "bajar"} a ${kilos(pista.kg)}</button>`
        : `<p class="mini gym-pista gym-pista-${pista.tipo}">💡 ${esc(pista.hoy)}</p>`;
    return `
        <section class="panel gym-sesion gym-foco ${descansando ? "gym-foco-descansando" : ""}">
            ${cabecera}
            <div class="gym-foco-escenario">${escena}${figuraDeAurelio(ctx, descansando)}</div>
            <div class="gym-foco-titulo">
                <div class="gym-foco-titulo-fila">${titulo}${sinEmpezar ? botonesDeEjercicio(actual.ejercicio, ej, false) : ""}</div>
                <div class="gym-foco-serie-fila">${siguiente}${pips}</div>
            </div>
            ${descansando ? preguntaRir(en) : pistaHtml}
            <div class="gym-steppers">
                ${stepper("kg", "Peso", s.kg, 2.5, " kg")}
                ${stepper("reps", "Reps", s.reps, 1, "")}
            </div>
            ${descansando ? `
            <div class="gym-foco-accion">
                <button type="button" class="boton boton-secundario" data-accion="gym-descanso-mas" data-segundos="-15">− 15 s</button>
                <button type="button" class="boton boton-principal gym-foco-grande" data-accion="gym-saltar-descanso">${esCal ? "▶️ Empezar calentamiento" : `▶️ Empezar serie ${nTrabajo}`}</button>
                <button type="button" class="boton boton-secundario" data-accion="gym-descanso-mas" data-segundos="15">+ 15 s</button>
            </div>` : `
            <div class="gym-foco-accion gym-foco-accion-serie">
                <button type="button" class="boton boton-secundario gym-contar" data-accion="gym-contar" data-ej="${actual.ejercicio}" data-serie="${actual.serie}"
                        aria-label="${s.contando ? `Toca por cada repetición: llevas ${s.reps}` : "Contar las repeticiones tocando"}">👆 ${s.contando ? s.reps : "Contar"}</button>
                <button type="button" class="boton boton-principal gym-foco-grande" data-accion="gym-serie" data-ej="${actual.ejercicio}" data-serie="${actual.serie}">✅ Terminé la serie</button>
            </div>`}
            ${despues}
            ${pie}
        </section>`;
}

// La lista de todos los ejercicios (el modo de siempre).
function vistaDeLista(estado, ctx) {
    const g = estado.gym;
    const en = g.encurso;
    const rutina = gym.rutinaPorId(en.rutina);
    const hechas = gym.seriesMarcadas(en);
    const total = gym.seriesTotales(en);
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
        const atascado = gym.estancamiento(g.sesiones, ej.id);   // (v164)
        const musculo = gym.MUSCULOS[info.musculo];
        const series = ej.series.map((s, si) => `
            <div class="gym-serie ${s.hecha ? "hecha" : ""} ${s.cal ? "gym-serie-cal" : ""}">
                <span class="gym-n">${s.cal ? "🔥" : ej.series.slice(0, si).filter((x) => !x.cal).length + 1}</span>
                <label><span>kg</span><input type="text" inputmode="decimal" value="${String(s.kg).replace(".", ",")}"
                    data-gym="kg" data-ej="${ei}" data-serie="${si}" aria-label="Peso de la serie ${si + 1}"></label>
                <label><span>reps</span><input type="number" inputmode="numeric" step="1" min="0" max="${gym.MAX_REPS}" value="${s.reps}"
                    data-gym="reps" data-ej="${ei}" data-serie="${si}" aria-label="Repeticiones de la serie ${si + 1}"></label>
                ${s.cal ? "<span></span>" : ""}<label ${s.cal ? "hidden" : ""}><span>RIR</span><select data-gym="rir" data-ej="${ei}" data-serie="${si}" aria-label="Repeticiones en reserva de la serie ${si + 1} (opcional)">
                    <option value="">–</option>${gym.RIR_OPCIONES.map((n) => `<option value="${n}" ${s.rir === n ? "selected" : ""}>${n === gym.MAX_RIR ? "4+" : n}</option>`).join("")}
                </select></label>
                <button type="button" class="gym-ok" data-accion="gym-serie" data-ej="${ei}" data-serie="${si}" aria-pressed="${s.hecha}"
                        aria-label="Serie ${si + 1} hecha">✓</button>
            </div>`).join("");
        const hechasEj = ej.series.filter((s) => s.hecha).length;
        return `
            <article class="gym-ejercicio ${hechasEj === ej.series.length ? "completo" : ""} ${ei === actual ? "actual" : ""}">
                <div class="gym-demo" aria-hidden="true">${escenaEjercicio(movimiento, ctx.avatar.apariencia, { animar: ei === actual && !sinMovimiento, fisico: ctx.avatar.fisico || 0, cuadro: 5 })}</div>
                <h3>${musculo.icono} ${esc(info.nombre)}</h3>
                <p class="mini texto-suave gym-meta-ej">${info.series} × ${info.min}–${info.max} reps · ${musculo.nombre}
                    ${sparkline(gym.historialDe(g.sesiones, ej.id).slice(-10).map((x) => x.puntaje), { ancho: 70, alto: 20 })}</p>
                <p class="mini gym-antes">${antes
                    ? `Última vez (${fechaCorta(antes.fecha)}): ${antes.series.map((s) => (s.kg ? `${kilos(s.kg)}×${s.reps}` : `${s.reps} reps`)).join(" · ")}`
                    : "Primera vez que lo haces."}
                    ${mejor && mejor.kg ? ` 🏆 ${kilos(mejor.kg)} × ${mejor.reps}` : ""}</p>
                <p class="mini gym-pista gym-pista-${pista.tipo}">💡 ${esc(pista.hoy)}</p>
                ${atascado ? `<p class="mini gym-pista gym-pista-estancado">⚠️ ${plural(atascado.sesiones, "sesión", "sesiones")} sin mejorar. ${esc(gym.propuestasDeEstancamiento(atascado)[0]?.texto || "")}</p>` : ""}
                <p class="mini gym-tecnica">🎯 Técnica: ${esc(gymAurelio.consejoDeTecnica(movimiento, ei))}</p>
                ${series}
                <div class="gym-mas">
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-serie-mas" data-ej="${ei}">+ serie</button>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-serie-menos" data-ej="${ei}" ${gym.seriesDeTrabajo(ej).length <= 1 ? "disabled" : ""}>− serie</button>
                    ${ej.series.some((x) => x.hecha) ? "" : botonesDeEjercicio(ei, ej, true)}
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
                    <p class="etiqueta">${ayer ? `Entrenamiento de ayer` : "Entrenando ahora"}${en.descarga ? " · 🛌 semana de descarga (menos series, mismo peso)" : ""}</p>
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
            <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-foco" data-valor="1">🎯 Pasar al modo foco (una serie a la vez)</button>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-discos" data-kg="">🧮 Calculadora de discos</button>
            ${descanso}
            ${burbujaDeAurelio(ctx)}
            ${ejercicios}
            ${ejerciciosExtra(en)}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="gym-terminar" ${hechas ? "" : "disabled"}>Terminar entrenamiento</button>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="gym-cancelar">Cancelar (no se guarda)</button>
            <p class="nota">Marca ✓ cada serie al terminarla: empieza el descanso (${gym.DESCANSOS.includes(g.descanso) ? duracion(g.descanso) : "1:30"}). El XP llega al terminar.</p>
        </section>`;
}

// (v164) En el descanso: «¿cuántas más podías hacer?» para la serie que acabas de terminar (opcional, un toque).
function preguntaRir(en) {
    const u = en.ultima;
    const s = u && en.ejercicios[u.ejercicio]?.series[u.serie];
    if (!s || !s.hecha) return "";
    const botones = gym.RIR_OPCIONES.map((n) => `
        <button type="button" class="gym-rir-boton" data-accion="gym-rir" data-ej="${u.ejercicio}" data-serie="${u.serie}" data-rir="${n}" aria-pressed="${s.rir === n}">${n === gym.MAX_RIR ? "4+" : n}</button>`).join("");
    return `<div class="gym-rir" role="group" aria-label="Repeticiones en reserva de la serie que hiciste">
                <span>¿Cuántas más podías? <small>(opcional)</small></span>
                <span class="gym-rir-botones">${botones}</span>
            </div>`;
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
            <p class="nota">Sonido y vibración en los últimos 3 segundos del descanso y al empezar la serie (en iPhone suena, pero no vibra):</p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-chico ${gym.avisoDeSerie(g) ? "boton-principal" : "boton-secundario"}" data-accion="gym-aviso-serie" data-valor="1" aria-pressed="${gym.avisoDeSerie(g)}">Sí</button>
                <button type="button" class="boton boton-chico ${gym.avisoDeSerie(g) ? "boton-secundario" : "boton-principal"}" data-accion="gym-aviso-serie" data-valor="0" aria-pressed="${!gym.avisoDeSerie(g)}">No</button>
            </div>
            <p class="nota">Pantalla encendida mientras entrenas (así el teléfono no se suspende entre series; gasta más batería):</p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-chico ${gym.pantallaEncendida(g) ? "boton-principal" : "boton-secundario"}" data-accion="gym-pantalla" data-valor="1" aria-pressed="${gym.pantallaEncendida(g)}">Sí</button>
                <button type="button" class="boton boton-chico ${gym.pantallaEncendida(g) ? "boton-secundario" : "boton-principal"}" data-accion="gym-pantalla" data-valor="0" aria-pressed="${!gym.pantallaEncendida(g)}">No</button>
            </div>
            <p class="nota">Tu historial como hoja de cálculo (Excel, Numbers, Google Sheets): una fila por serie.</p>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="gym-exportar-csv" ${g.sesiones.length ? "" : "disabled"}>📄 Exportar historial (CSV)</button>
        </details>`;
}
