// vistas-plataformas.js — Las pantallas de «La Senda del Reino» (v185): la tarjeta del Arcade, el mapa de los
// mundos (con el nivel elegido) y el resultado al terminar un nivel.
//
// Como todas las vistas: reciben datos y devuelven texto HTML, sin cambiar la partida. El juego en sí (el lienzo)
// lo mueve app-plataformas.js. vistas.js reúne este archivo con los demás.

import * as P from "./plataformas.js";
import * as arcade from "./arcade.js";
import { ATRIBUTOS, plural } from "./juego.js";
import { esc } from "./vistas-comun.js";

const progresoDe = (estado) => estado.arcade.plataformas || P.progresoInicial();

// Las reliquias de un nivel, como rombos llenos (◆, encontrada) y vacíos (◇).
export function rombos(encontradas, total = P.RELIQUIAS_POR_NIVEL) {
    return Array.from({ length: total }, (_, i) => (encontradas.includes(i) ? "◆" : "◇")).join("");
}

// El nivel que conviene mostrar al abrir el mapa: el primero abierto que todavía no terminaste (o el último).
export function nivelSugerido(progreso) {
    const abiertos = P.NIVELES.filter((n) => P.nivelAbierto(progreso, n.id));
    return (abiertos.find((n) => !P.nivelGanado(progreso, n.id)) || abiertos[abiertos.length - 1] || P.NIVELES[0]).id;
}

// ===== La tarjeta del Arcade (arriba de los minijuegos) =====
export function tarjetaSenda(estado, puedeJugar, ventaja) {
    const progreso = progresoDe(estado);
    const ganados = P.NIVELES.filter((n) => P.nivelGanado(progreso, n.id)).length;
    const mundos = P.MUNDOS.filter((m) => P.mundoAbierto(progreso, m.numero)).length;
    const record = estado.arcade.records.plataformas || 0;
    return `
        <article class="panel minijuego-tarjeta senda-tarjeta">
            <div class="senda-tarjeta-portada">
                <img class="senda-portada" data-senda-portada="${Math.min(4, Math.max(1, mundos))}" alt="" />
                <span class="senda-tarjeta-titulo">🏰 La Senda del Reino</span>
            </div>
            <p class="nota">Un juego de plataformas con tu héroe: ${P.MUNDOS.length} mundos, ${P.NIVELES.length} niveles y un jefe al final de cada
               mundo. Corre, salta sobre las criaturas de la Torre, rompe bloques y busca las reliquias escondidas.</p>
            <p class="mini">🗺️ <b>${ganados}</b> de ${P.NIVELES.length} niveles · ◆ <b>${P.totalReliquias(progreso)}</b> de ${P.RELIQUIAS_TOTALES} reliquias
               · 🏅 Récord: <b>${record}</b> pts</p>
            <p class="mini equipo-ventaja">${ventaja ? `🧰 Tu equipo: ${ventaja}` : "🧰 Con armadura en tu equipo empiezas cada nivel con armadura."}</p>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="senda-abrir" ${puedeJugar ? "" : "disabled"}>
                🗺️ Abrir el mapa · 🎟️ 1 ficha por nivel</button>
        </article>`;
}

// ===== El mapa de los mundos =====
// elegido = el id del nivel que se está mirando; fichas = las que tienes; caido = si caíste en combate.
export function mapaDeLaSenda(estado, { elegido, fichas, caido }) {
    const progreso = progresoDe(estado);
    const id = P.POR_ID[elegido] && P.nivelAbierto(progreso, elegido) ? elegido : nivelSugerido(progreso);
    const mundos = P.MUNDOS.map((m) => {
        const niveles = P.nivelesDelMundo(m.numero);
        const abierto = P.mundoAbierto(progreso, m.numero);
        const reliquias = niveles.reduce((s, n) => s + P.reliquiasDe(progreso, n.id).length, 0);
        const totales = niveles.filter((n) => !n.jefe).length * P.RELIQUIAS_POR_NIVEL;
        const nodos = niveles.map((n) => {
            const ganado = P.nivelGanado(progreso, n.id);
            const abre = P.nivelAbierto(progreso, n.id);
            const clases = ["senda-nodo", ganado ? "ganado" : "", abre ? "" : "cerrado", n.id === id ? "elegido" : "", n.jefe ? "jefe" : ""].filter(Boolean).join(" ");
            const marca = n.jefe ? (ganado ? "👑" : "☠️") : rombos(P.reliquiasDe(progreso, n.id));
            return `<li><button type="button" class="${clases}" data-accion="senda-elegir" data-nivel="${n.id}" ${abre ? "" : "disabled"}
                         aria-label="Nivel ${n.id}: ${esc(n.nombre)}${abre ? "" : " (cerrado)"}">
                        <b>${abre ? n.id : "🔒"}</b><small>${marca}</small></button></li>`;
        }).join("");
        return `
            <section class="panel senda-mundo ${abierto ? "" : "cerrado"}">
                <div class="senda-mundo-portada">
                    <img class="senda-portada" data-senda-portada="${m.numero}" alt="" />
                    <span class="senda-mundo-titulo">Mundo ${m.numero} · ${m.nombre}</span>
                    <span class="senda-mundo-reliquias">◆ ${reliquias}/${totales}</span>
                </div>
                <p class="mini texto-suave">${abierto ? m.texto : "🔒 Se abre al vencer al jefe del mundo anterior."}</p>
                <ol class="senda-camino">${nodos}</ol>
            </section>`;
    }).join("");
    return `
        ${detalleDelNivel(estado, id, fichas, caido)}
        ${mundos}
        <details class="plegable panel senda-ayuda">
            <summary>📖 Cómo se juega</summary>
            <p class="nota">Muévete con ◀ ▶ y salta con el botón grande (mantenlo apretado para saltar más alto). Puedes correr y saltar a la vez.
               En la compu: flechas o A/D para moverte, espacio o W para saltar y X para lanzar fuego.</p>
            <p class="nota">Salta encima de las criaturas para vencerlas. El <b>Cangrejo acorazado</b> se esconde en su caparazón: tócalo y sale
               rodando, llevándose a los que encuentre. La <b>Raíz</b>, el <b>Ascua</b> y el <b>Mazo</b> no se pisan: esquívalos.</p>
            <ul class="senda-poderes">
                <li><b>🧪 ${P.PODERES.pocion.nombre}:</b> ${P.PODERES.pocion.texto}</li>
                <li><b>🔥 ${P.PODERES.brasa.nombre}:</b> ${P.PODERES.brasa.texto}</li>
                <li><b>✨ ${P.PODERES.bendicion.nombre}:</b> ${P.PODERES.bendicion.texto}</li>
                <li><b>❤️ ${P.PODERES.vida.nombre}:</b> ${P.PODERES.vida.texto} También ganas una cada ${P.MONEDAS_POR_VIDA} monedas.</li>
            </ul>
            <p class="nota">Golpea desde abajo los bloques con runa. Hay bloques escondidos, paredes falsas y caminos altos: ahí están las
               <b>reliquias</b> (3 por nivel; solo cuentan si llegas al Arco de la Llama). Los jefes solo se pueden pisar cuando quedan
               aturdidos o cansados (les giran estrellitas sobre la cabeza).</p>
        </details>`;
}

function detalleDelNivel(estado, id, fichas, caido) {
    const progreso = progresoDe(estado);
    const n = P.POR_ID[id];
    const datos = progreso.niveles[id];
    const m = P.mundoDe(n);
    const puede = fichas > 0 && !caido;
    const juego = arcade.JUEGOS.plataformas;
    const atributo = ATRIBUTOS[juego.atributo];
    return `
        <section class="panel senda-detalle" aria-label="Nivel elegido">
            <p class="etiqueta">Mundo ${m.numero} · ${n.jefe ? "Jefe" : `Nivel ${n.numero}`}</p>
            <h3 class="senda-detalle-nombre">${n.id} · ${esc(n.nombre)}</h3>
            <p class="mini">${n.jefe
                ? `☠️ ${P.JEFES[n.jefe].nombre} te espera al final. ${datos?.ganadoEn ? "👑 Ya lo venciste." : ""}`
                : `◆ Reliquias: <b class="senda-rombos">${rombos(P.reliquiasDe(progreso, id))}</b>`}
               · ⏱ ${n.tiempo} s</p>
            <p class="mini">${datos?.ganadoEn
                ? `🏅 Mejor: <b>${datos.mejor}</b> pts · ⚡ ${datos.tiempo} s · terminado ${plural(datos.veces, "vez", "veces")}`
                : "Todavía no lo terminas."}</p>
            <p class="mini texto-suave">Premio: hasta ${arcade.MAX_GEMAS} 💎 y ${arcade.MAX_XP} XP de ${atributo.icono} ${atributo.nombre} según tus puntos
               · 🎟️ tienes ${plural(fichas, "ficha", "fichas")}.</p>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="senda-jugar" data-nivel="${id}" ${puede ? "" : "disabled"}>
                ${caido ? "Caíste en combate: el arcade está cerrado" : fichas ? "▶ Jugar · 🎟️ 1 ficha" : "Sin fichas: completa una misión diaria"}</button>
        </section>`;
}

// ===== El resultado de un nivel (encima del lienzo) =====
// r = lo que devolvió acciones.terminarSenda; resultado = el de la partida; fichas = las que quedan.
export function finalDeLaSenda(r, resultado, nivelId, fichas, salio = false) {
    const n = P.POR_ID[nivelId];
    const atributo = ATRIBUTOS[arcade.JUEGOS.plataformas.atributo];
    const siguiente = P.siguienteNivel(nivelId);
    const otro = resultado.gano && siguiente && r.progreso ? siguiente : nivelId;
    const titulo = resultado.gano ? (n.jefe ? "¡Jefe vencido!" : "¡Nivel superado!") : salio ? "Saliste del nivel" : "Sin vidas";
    const lineas = [
        n.jefe ? "" : `${rombos(resultado.reliquias)} reliquias${r.progreso?.nuevas?.length ? ` · ${plural(r.progreso.nuevas.length, "nueva", "nuevas")}` : ""}`,
        `⏱ ${resultado.tiempo} s · 🪙 ${resultado.monedas} · ⚔️ ${resultado.enemigos}`,
    ].filter(Boolean);
    const abre = r.progreso?.abre ? P.POR_ID[r.progreso.abre] : null;
    return `
        <div class="senda-final ${resultado.gano ? "gano" : ""}">
            <p class="etiqueta">${titulo}</p>
            <h3>${n.id} · ${esc(n.nombre)}</h3>
            <p class="minijuego-puntos">${r.puntos} ${r.puntos === 1 ? "punto" : "puntos"}</p>
            ${lineas.map((l) => `<p class="mini">${l}</p>`).join("")}
            <p class="minijuego-premio">+${r.premio.gemas} 💎 · +${r.premio.xp} XP de ${atributo.icono} ${atributo.nombre}</p>
            ${r.nuevoRecord ? "<p>🏅 ¡Nuevo récord!</p>" : ""}
            ${r.progreso?.mejor && !r.progreso.primeraVez ? "<p class=\"mini\">📈 Tu mejor marca en este nivel.</p>" : ""}
            ${abre ? `<p class="mini oro">🗺️ Se abrió: ${abre.id} · ${esc(abre.nombre)}</p>` : ""}
            ${resultado.gano || n.jefe ? "" : "<p class=\"mini texto-suave\">Las reliquias solo cuentan si llegas al Arco de la Llama.</p>"}
            <p class="mini texto-suave">🎟️ ${fichas ? `Te quedan ${plural(fichas, "ficha", "fichas")} (1 por nivel).` : "No te quedan fichas: completa una misión diaria."}</p>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="senda-mapa">🗺️ Mapa</button>
                <button type="button" class="boton boton-principal" data-accion="senda-jugar" data-nivel="${otro}" ${fichas > 0 ? "" : "disabled"}>
                    ${fichas > 0 ? (otro === nivelId ? "↻ Otra vez" : "▶ Siguiente") : "Sin fichas"}</button>
            </div>
        </div>`;
}

export function pausaDeLaSenda(nivelId) {
    const n = P.POR_ID[nivelId];
    return `
        <div class="senda-final">
            <p class="etiqueta">Pausa</p>
            <h3>${n.id} · ${esc(n.nombre)}</h3>
            <div class="botones-dialogo">
                <button type="button" class="boton boton-secundario" data-accion="senda-rendirse">Salir del nivel</button>
                <button type="button" class="boton boton-principal" data-accion="senda-seguir">▶ Seguir</button>
            </div>
        </div>`;
}

// El marcador de arriba (vidas, monedas, puntos, tiempo, reliquias y la vida del jefe).
export function marcadorDeLaSenda(m) {
    const jefe = m.jefe
        ? `<span class="senda-jefe"><small>${esc(m.jefe.nombre)}</small><span class="senda-jefe-vida">${"▮".repeat(m.jefe.vida)}${"▯".repeat(m.jefe.golpes - m.jefe.vida)}</span></span>`
        : "";
    const reliquias = m.totalReliquias ? `<span>${rombos(m.reliquias, m.totalReliquias)}</span>` : "";
    return `<span>❤️ ${m.vidas}</span><span>🪙 ${m.monedas}</span><span>⭐ ${m.puntos}</span>${reliquias}<span class="${m.tiempo <= 60 ? "senda-poco" : ""}">⏱ ${m.tiempo}</span>${jefe}`;
}
