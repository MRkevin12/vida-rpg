// vistas-running.js — La pantalla del Running (v109): correr en vivo, anotar carreras, tu progreso y tu historial.
//
// Como las demás vistas, solo convierte la partida en HTML (texto). Las reglas están en running.js.
// El cronómetro, la distancia y el ritmo en vivo tienen data-run-* : app.js los actualiza cada segundo sin redibujar
// la pantalla (así no se cierra el teclado ni se pierde la posición).

import * as running from "./running.js";
import { esc, selectorSecciones } from "./vistas.js";
import { plural } from "./juego.js";
import { fechaCorta, lunesDe } from "./fechas.js";

const barra = (porcentaje, clase = "") => `<div class="barra ${clase}"><div class="barra-relleno" style="width: ${Math.min(100, porcentaje)}%"></div></div>`;

// Las secciones de la pantalla (como en el Gimnasio).
export const SECCIONES_RUNNING = [["correr", "🏃 Correr"], ["progreso", "📈 Progreso"], ["historial", "📜 Historial"]];

// ctx = { hoy, ahora, subvista, tipo, gps: bool (la carrera usa GPS), gpsProblema: null | "permiso" | "senal" }
export function pantallaRunning(estado, ctx) {
    const r = estado.running;
    const kmSemana = running.kmDeLaSemana(r.carreras, lunesDe(ctx.hoy));
    const encabezado = `
        <div class="titulo-seccion encabezado">
            <h2 class="titulo-juego">🏃 Running</h2>
            <p class="contador ${kmSemana >= r.metaKm ? "completo" : ""}">${running.textoKm(kmSemana)}</p>
        </div>`;
    if (r.encurso) return `${encabezado}${vistaEnVivo(estado, ctx)}`;

    const pedida = ctx.subvista?.running;
    const seccion = SECCIONES_RUNNING.some(([clave]) => clave === pedida) ? pedida : "correr";
    const contenido = {
        correr: () => `
            ${tarjetaSemana(estado, ctx)}
            ${tarjetaSugerencia(estado, ctx)}
            ${panelEmpezar(ctx)}
            ${formularioManual(ctx)}`,
        progreso: () => `
            ${tarjetaRango(estado)}
            ${tarjetaSemanas(estado, ctx)}
            ${tarjetaRecords(estado)}
            ${tarjetaRitmos(estado)}
            ${tarjetaHitos(estado)}
            ${tarjetaAjustes(estado)}`,
        historial: () => tarjetaHistorial(estado),
    }[seccion];
    return `${encabezado}${selectorSecciones("running", SECCIONES_RUNNING, seccion)}${contenido()}`;
}

// Lo que dice el aviso del GPS. app.js lo vuelve a escribir cada segundo (data-run-gps), sin redibujar la pantalla.
export function textoGps(en, problema) {
    if (!en.gps) return "⏱ Solo cronómetro: anota la distancia al terminar.";
    if (problema === "permiso") return "⚠️ Sin permiso de ubicación: anota la distancia al terminar.";
    if (problema === "senal") return "📡 Señal GPS perdida: se reanuda sola cuando vuelva.";
    if (en.ultimo || en.distancia) return "📡 GPS activo: se miden los metros mientras la app esté abierta.";
    return "📡 Buscando señal GPS… (sal a un lugar abierto si tarda)";
}

// ===== Correr en vivo =====
// Mientras corres no hay menú: el cronómetro grande, la distancia, el ritmo y el formulario para terminar.
function vistaEnVivo(estado, ctx) {
    const en = estado.running.encurso;
    const tipo = running.TIPOS[en.tipo];
    const pausada = Boolean(en.pausadoDesde);
    const tiempo = running.tiempoDeEncurso(en, ctx.ahora);
    const ritmo = running.ritmoEnVivo(en, ctx.ahora);
    return `
        <section class="panel run-vivo ${pausada ? "pausada" : ""}">
            <p class="etiqueta">${tipo.icono} ${esc(tipo.nombre)}${pausada ? " · en pausa" : ""}</p>
            <p class="run-tiempo" data-run-tiempo>${running.textoTiempo(tiempo)}</p>
            <div class="run-datos">
                <div><small>Distancia</small><b data-run-km>${running.textoKm(en.distancia / 1000)}</b></div>
                <div><small>Ritmo</small><b data-run-ritmo>${running.textoRitmo(ritmo)}</b></div>
            </div>
            <p class="nota" data-run-gps>${textoGps(en, ctx.gpsProblema)}</p>
            <div class="run-botones">
                <button type="button" class="boton ${pausada ? "boton-principal" : "boton-secundario"}" data-accion="run-pausa">${pausada ? "▶ Seguir" : "⏸ Pausar"}</button>
                <button type="button" class="boton boton-secundario" data-accion="run-cancelar">✖ Cancelar</button>
            </div>
        </section>
        <form data-form="running-terminar" class="panel formulario">
            <h2 class="titulo-juego">🏁 Terminar y guardar</h2>
            <p class="nota">Si dejas un campo vacío, se usa lo que midió ${en.gps ? "el GPS" : "el cronómetro"}. Puedes corregirlo.</p>
            <label class="formulario-grupo"><span>Kilómetros</span>
                <input type="text" name="km" inputmode="decimal" placeholder="${en.gps ? "Lo que midió el GPS" : "Ej: 5,2"}" autocomplete="off"></label>
            <label class="formulario-grupo"><span>Minutos</span>
                <input type="text" name="minutos" inputmode="numeric" placeholder="Lo que marcó el cronómetro" autocomplete="off"></label>
            <label class="formulario-grupo"><span>Nota (opcional)</span>
                <input type="text" name="nota" maxlength="60" placeholder="Ej: con el perro" autocomplete="off"></label>
            <button type="submit" class="boton boton-principal boton-ancho">✅ Guardar carrera</button>
        </form>`;
}

// ===== Empezar una carrera =====
function panelEmpezar(ctx) {
    const tipo = running.TIPOS[ctx.tipo] || running.TIPOS.suave;
    const chips = Object.entries(running.TIPOS).map(([clave, t]) => `
        <button type="button" class="run-tipo ${clave === ctx.tipo ? "elegido" : ""}" data-accion="run-tipo" data-tipo="${clave}" aria-pressed="${clave === ctx.tipo}">
            <span aria-hidden="true">${t.icono}</span> ${esc(t.nombre)}</button>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">▶ Empezar una carrera</h2>
            <div class="run-tipos" role="group" aria-label="Tipo de carrera">${chips}</div>
            <p class="nota">${esc(tipo.texto)}${tipo.bono ? ` Suma +${tipo.bono} XP de bono.` : ""}</p>
            <div class="run-botones">
                <button type="button" class="boton boton-principal" data-accion="run-empezar" data-gps="1">📡 Empezar con GPS</button>
                <button type="button" class="boton boton-secundario" data-accion="run-empezar" data-gps="0">⏱ Solo cronómetro</button>
            </div>
            <p class="mini texto-suave">Con GPS, el teléfono mide los metros mientras la app esté abierta y con la pantalla encendida. Si la cierras, el cronómetro sigue, pero esos metros no se cuentan.</p>
        </section>`;
}

// ===== Tu semana y tu sugerencia =====
function tarjetaSemana(estado, ctx) {
    const r = estado.running;
    const lunes = lunesDe(ctx.hoy);
    const km = running.kmDeLaSemana(r.carreras, lunes);
    const racha = running.rachaSemanal(r.carreras, r.metaKm, ctx.hoy);
    const porcentaje = Math.round((km / r.metaKm) * 100);
    return `
        <section class="panel">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">🎯 Tu meta de la semana</h2>
                <p class="contador ${km >= r.metaKm ? "completo" : ""}">${km >= r.metaKm ? "✨" : ""}${running.textoKm(km)}</p>
            </div>
            ${barra(porcentaje, "barra-gym")}
            <p class="nota">Tu meta: ${r.metaKm} km esta semana. ${racha ? `🔥 <b>${plural(racha, "semana seguida", "semanas seguidas")}</b> cumpliendo.`
                : "Cumple tu meta para empezar una racha."}</p>
        </section>`;
}

function tarjetaSugerencia(estado, ctx) {
    const r = estado.running;
    const s = running.sugerencia(r.carreras, r.metaKm, ctx.hoy);
    const tipo = running.TIPOS[s.tipo];
    return `
        <section class="panel run-sugerencia">
            <p class="etiqueta">🧭 Para hoy</p>
            <p><b>${tipo.icono} ${esc(tipo.nombre)} · ${running.textoKm(s.km)}</b></p>
            <p class="nota">${esc(s.texto)}</p>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="run-tipo" data-tipo="${s.tipo}">Elegir este tipo</button>
        </section>`;
}

// Anotar una carrera que ya hiciste (hoy o ayer).
function formularioManual(ctx) {
    const opciones = Object.entries(running.TIPOS).map(([clave, t]) => `<option value="${clave}" ${clave === ctx.tipo ? "selected" : ""}>${t.nombre}</option>`).join("");
    return `
        <details class="plegable">
            <summary>✍️ Anotar una carrera que ya hiciste</summary>
            <form data-form="running-manual" class="formulario">
                <div class="run-campos">
                    <label class="formulario-grupo"><span>Kilómetros</span>
                        <input type="text" name="km" inputmode="decimal" required placeholder="Ej: 5,2" autocomplete="off"></label>
                    <label class="formulario-grupo"><span>Minutos</span>
                        <input type="text" name="minutos" inputmode="numeric" required placeholder="Ej: 32" autocomplete="off"></label>
                </div>
                <label class="formulario-grupo"><span>Tipo</span><select name="tipo">${opciones}</select></label>
                <label class="formulario-grupo"><span>Día</span>
                    <select name="fecha"><option value="hoy">Hoy</option><option value="ayer">Ayer</option></select></label>
                <label class="formulario-grupo"><span>Nota (opcional)</span>
                    <input type="text" name="nota" maxlength="60" autocomplete="off"></label>
                <button type="submit" class="boton boton-principal boton-ancho">Guardar carrera</button>
            </form>
        </details>`;
}

// ===== Progreso =====
function tarjetaRango(estado) {
    const total = running.kmTotales(estado.running.carreras);
    const rango = running.rangoDe(total);
    const siguiente = running.RANGOS.find((x) => x.desde > total);
    const porcentaje = siguiente ? Math.round(((total - rango.desde) / (siguiente.desde - rango.desde)) * 100) : 100;
    const tiempo = estado.running.carreras.reduce((suma, c) => suma + c.minutos, 0);
    return `
        <section class="panel">
            <p class="etiqueta">${rango.icono} ${esc(rango.nombre)}</p>
            <p class="run-tiempo-chico"><b>${running.textoKm(total)}</b> corridos en tu vida</p>
            ${barra(porcentaje, "barra-gym")}
            <p class="mini texto-suave">${siguiente
                ? `${siguiente.nombre} al llegar a ${siguiente.desde} km (te faltan ${running.textoKm(siguiente.desde - total)})`
                : "Ya llegaste al rango más alto."}</p>
            <p class="mini texto-suave">${estado.running.carreras.length ? `${plural(estado.running.carreras.length, "carrera", "carreras")} · ${running.textoDuracion(tiempo)} en total` : "Aún no hay carreras."}</p>
        </section>`;
}

// Las últimas 12 semanas: una barra por semana (la de hoy, resaltada). La línea punteada es tu meta.
function tarjetaSemanas(estado, ctx) {
    const r = estado.running;
    const semanas = running.kmPorSemana(r.carreras, ctx.hoy, 12);
    const maximo = Math.max(r.metaKm, ...semanas.map((s) => s.km));
    const actual = lunesDe(ctx.hoy);
    const barras = semanas.map((s) => `
        <div class="run-col ${s.lunes === actual ? "actual" : ""}" title="${fechaCorta(s.lunes)}: ${running.textoKm(s.km)}">
            <div class="run-barra"><i style="height: ${Math.round((s.km / maximo) * 100)}%"></i></div>
            <small>${Number(s.lunes.slice(8))}</small>
        </div>`).join("");
    const total = semanas.reduce((suma, s) => suma + s.km, 0);
    return `
        <section class="panel">
            <h2 class="titulo-juego">Tus km por semana <span class="texto-suave">12 semanas</span></h2>
            <div class="run-barras" style="--meta: ${(r.metaKm / maximo).toFixed(3)}" role="img"
                 aria-label="${running.textoKm(total)} en las últimas 12 semanas. Tu meta: ${r.metaKm} km por semana.">${barras}</div>
            <p class="mini texto-suave">Cada barra es una semana (el número es el día en que empieza). La línea es tu meta de ${r.metaKm} km. En 12 semanas llevas ${running.textoKm(total)}.</p>
        </section>`;
}

function tarjetaRecords(estado) {
    const rec = running.records(estado.running.carreras);
    if (!rec.masKm) return "";
    const fila = (icono, nombre, valor, detalle) => `
        <li><span aria-hidden="true">${icono}</span><span><b>${nombre}</b><small>${detalle}</small></span><b class="run-valor">${valor}</b></li>`;
    const lista = [
        fila("🏃", "Carrera más larga", running.textoKm(rec.masKm.km), fechaCorta(rec.masKm.fecha)),
        rec.mejorRitmo ? fila("⚡", "Mejor ritmo", running.textoRitmo(running.ritmoDeCarrera(rec.mejorRitmo)), `en ${running.textoKm(rec.mejorRitmo.km)} · ${fechaCorta(rec.mejorRitmo.fecha)}`) : "",
        fila("⏱", "Más tiempo seguido", running.textoDuracion(rec.masMinutos.minutos), `${running.textoKm(rec.masMinutos.km)} · ${fechaCorta(rec.masMinutos.fecha)}`),
        rec.semanaMasKm ? fila("📅", "Semana con más km", running.textoKm(rec.semanaMasKm.km), `desde el ${fechaCorta(rec.semanaMasKm.lunes)}`) : "",
    ].join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">📈 Tus récords</h2>
            <ul class="run-lista">${lista}</ul>
        </section>`;
}

// El ritmo de las últimas carreras (más arriba = más rápido). Solo cuentan las carreras de 3 km o más.
function tarjetaRitmos(estado) {
    const ultimas = running.ordenar(estado.running.carreras.filter((c) => c.km >= running.DISTANCIA_RITMO)).slice(-20);
    if (ultimas.length < 2) return "";
    const ritmos = ultimas.map((c) => running.ritmoDeCarrera(c));
    const min = Math.min(...ritmos);
    const max = Math.max(...ritmos);
    const rango = max - min || 1;
    const ancho = 300;
    const alto = 70;
    const puntos = ritmos.map((x, i) => `${(i / (ritmos.length - 1)) * (ancho - 8) + 4},${alto - 6 - ((max - x) / rango) * (alto - 12)}`);
    return `
        <section class="panel">
            <h2 class="titulo-juego">⚡ Tu ritmo <span class="texto-suave">últimas ${ultimas.length}</span></h2>
            <svg class="run-ritmos" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Tu ritmo en las últimas carreras: más arriba es más rápido">
                <polyline points="${puntos.join(" ")}" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
            <p class="mini texto-suave">Más arriba = más rápido. Mejor: ${running.textoRitmo(min)} · Último: ${running.textoRitmo(ritmos[ritmos.length - 1])}.</p>
        </section>`;
}

function tarjetaHitos(estado) {
    const total = running.kmTotales(estado.running.carreras);
    const filas = running.HITOS.map((h) => {
        const cobrado = estado.running.hitos.includes(h.id);
        const falta = Math.max(0, h.km - total);
        return `<li class="run-hito ${cobrado ? "cobrado" : ""}"><span aria-hidden="true">${h.icono}</span>
            <span><b>${esc(h.titulo)}</b><small>${cobrado ? `✓ Cobrado · +${h.gemas} 💎`
                : falta > 0 ? `Te faltan ${running.textoKm(falta)} · +${h.gemas} 💎`
                : `¡Lo alcanzaste! Se cobra con tu próxima carrera · +${h.gemas} 💎`}</small></span></li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏁 Hitos de kilómetros</h2>
            <ul class="run-lista">${filas}</ul>
        </section>`;
}

// Tu meta semanal y la misión que se marca sola.
function tarjetaAjustes(estado) {
    const r = estado.running;
    const misiones = estado.misiones.filter((m) => !m.archivadaEn);
    const opciones = misiones.map((m) => `<option value="${m.id}" ${r.mision === m.id ? "selected" : ""}>${esc(m.nombre)}</option>`).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">⚙️ Tus metas</h2>
            <div class="run-meta">
                <span>Km por semana: <b>${r.metaKm}</b></span>
                <span class="run-meta-botones">
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="run-meta" data-delta="-1" aria-label="Quitar un km">−</button>
                    <button type="button" class="boton boton-chico boton-secundario" data-accion="run-meta" data-delta="1" aria-label="Sumar un km">+</button>
                </span>
            </div>
            <label class="formulario-grupo"><span>Misión que se marca sola al guardar una carrera</span>
                <select data-running-mision>
                    <option value="">Ninguna</option>${opciones}
                </select></label>
            ${misiones.length ? "" : '<p class="mini texto-suave">Crea una misión (ej: «Correr») en Hoy para que se marque sola.</p>'}
        </section>`;
}

// ===== Historial =====
function tarjetaHistorial(estado) {
    const carreras = estado.running.carreras;
    if (!carreras.length) return '<p class="vacio">Aún no hay carreras. Empieza en la pestaña Correr: con GPS o anotando una que ya hiciste.</p>';
    const filas = carreras.map((c, indice) => ({ c, indice })).reverse().slice(0, 60).map(({ c, indice }) => {
        const tipo = running.TIPOS[c.tipo] || running.TIPOS.suave;
        return `
            <li class="run-fila">
                <span class="run-fila-icono" aria-hidden="true">${tipo.icono}</span>
                <span class="run-fila-texto"><b>${running.textoKm(c.km)} · ${esc(tipo.nombre)}</b>
                    <small>${fechaCorta(c.fecha)} · ${running.textoDuracion(c.minutos)} · ${running.textoRitmo(running.ritmoDeCarrera(c))} · ${c.origen === "gps" ? "📡 GPS" : "✍️ a mano"}</small>
                    ${c.nota ? `<small>“${esc(c.nota)}”</small>` : ""}
                </span>
                <button type="button" class="boton boton-chico boton-secundario" data-accion="run-borrar" data-indice="${indice}" aria-label="Borrar esta carrera">🗑</button>
            </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">Tus carreras <span class="texto-suave">${plural(carreras.length, "carrera", "carreras")}</span></h2>
            <ul class="run-historial">${filas}</ul>
            ${carreras.length > 60 ? '<p class="mini texto-suave">Se muestran las 60 más recientes.</p>' : ""}
        </section>`;
}

// ===== La tarjeta de Hoy =====
// Qué te toca correr hoy, lo que ya corriste, o la carrera que llevas en curso. Usa las mismas clases que la del gimnasio.
export function tarjetaRunningHoy(estado, ctx) {
    const r = estado.running;
    if (r.encurso) {
        const tipo = running.TIPOS[r.encurso.tipo] || running.TIPOS.suave;
        return `
        <div class="gym-hoy gym-hoy-activo">
            <span class="gym-hoy-icono" aria-hidden="true">${tipo.icono}</span>
            <span class="gym-hoy-texto"><b>Corriendo: ${esc(tipo.nombre)}</b><small>Tu carrera sigue en marcha.</small></span>
            <button type="button" class="boton boton-chico boton-principal" data-accion="ir" data-pantalla="running">Seguir</button>
        </div>`;
    }
    const km = running.kmDeLaSemana(r.carreras, lunesDe(ctx.hoy));
    const hechasHoy = r.carreras.filter((c) => c.fecha === ctx.hoy);
    if (hechasHoy.length) {
        const total = hechasHoy.reduce((suma, c) => suma + c.km, 0);
        return `
        <div class="gym-hoy gym-hoy-hecho">
            <span class="gym-hoy-icono" aria-hidden="true">✅</span>
            <span class="gym-hoy-texto"><b>Hoy corriste ${running.textoKm(total)}</b><small>Semana: ${running.textoKm(km)} de ${r.metaKm} km.</small></span>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="ir" data-pantalla="running">Ver</button>
        </div>`;
    }
    const sugerida = running.sugerencia(r.carreras, r.metaKm, ctx.hoy);
    const tipo = running.TIPOS[sugerida.tipo];
    return `
        <div class="gym-hoy">
            <span class="gym-hoy-icono" aria-hidden="true">${tipo.icono}</span>
            <span class="gym-hoy-texto"><b>Running: hoy toca ${esc(tipo.nombre)} · ${running.textoKm(sugerida.km)}</b><small>Semana: ${running.textoKm(km)} de ${r.metaKm} km</small></span>
            <button type="button" class="boton boton-chico boton-principal" data-accion="ir" data-pantalla="running">Correr</button>
        </div>`;
}
