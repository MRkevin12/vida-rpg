// vistas-plataformas.js — Las pantallas de «La Senda del Reino» (v185; v187: con aspecto de videojuego): la tarjeta del
// Arcade, el mapa de los mundos (un camino con sus niveles y tu héroe parado en el elegido), la tarjeta de entrada
// («MUNDO 1 · 1-1»), el marcador con marcos de pixel, la barra del jefe, la pausa y el resultado (con conteo).
//
// Como todas las vistas: reciben datos y devuelven texto HTML, sin cambiar la partida. El juego en sí (el lienzo)
// lo mueve app-plataformas.js. vistas.js reúne este archivo con los demás.

import * as P from "./plataformas.js";
import * as arcade from "./arcade.js";
import { ATRIBUTOS, plural } from "./juego.js";
import { esc } from "./vistas-comun.js";
import { icono } from "./iconos.js";

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
// Cada mundo es un camino que serpentea sobre su paisaje: los niveles son paradas (con su estado) y tu héroe
// espera parado en el nivel elegido. El tramo ya recorrido se ve dorado; el que sigue, marcado y en movimiento.
const PARADAS = [[12, 72], [37, 44], [63, 72], [88, 44]];   // dónde va cada nivel (en % del ancho y del alto)

// elegido = el id del nivel que se está mirando; fichas = las que tienes; caido = si caíste en combate.
export function mapaDeLaSenda(estado, { elegido, fichas, caido }) {
    const progreso = progresoDe(estado);
    const id = P.POR_ID[elegido] && P.nivelAbierto(progreso, elegido) ? elegido : nivelSugerido(progreso);
    const mundos = P.MUNDOS.map((m) => {
        const niveles = P.nivelesDelMundo(m.numero);
        const abierto = P.mundoAbierto(progreso, m.numero);
        const reliquias = niveles.reduce((s, n) => s + P.reliquiasDe(progreso, n.id).length, 0);
        const totales = niveles.filter((n) => !n.jefe).length * P.RELIQUIAS_POR_NIVEL;
        const nodos = niveles.map((n, i) => {
            const ganado = P.nivelGanado(progreso, n.id);
            const abre = P.nivelAbierto(progreso, n.id);
            const clases = ["senda-nodo", ganado ? "ganado" : "", abre ? "" : "cerrado", n.id === id ? "elegido" : "", n.jefe ? "jefe" : ""].filter(Boolean).join(" ");
            const marca = n.jefe ? (ganado ? "👑" : "☠️") : rombos(P.reliquiasDe(progreso, n.id));
            const [x, y] = PARADAS[i] || PARADAS[PARADAS.length - 1];
            const heroe = n.id === id ? '<img class="senda-heroe-mapa" data-senda-heroe alt="" />' : "";
            return `<li style="--x: ${x}%; --y: ${y}%">${heroe}<button type="button" class="${clases}" data-accion="senda-elegir" data-nivel="${n.id}" ${abre ? "" : "disabled"}
                         aria-label="Nivel ${n.id}: ${esc(n.nombre)}${abre ? "" : " (cerrado)"}">
                        <b>${abre ? (n.jefe ? "☠️" : n.id) : "🔒"}</b><small>${marca}</small></button></li>`;
        }).join("");
        // Los tramos del camino: recorrido (dorado), el siguiente (se mueve) o todavía cerrado.
        // Un tramo sale de un nivel: si ya lo ganaste, está recorrido; si está abierto, es por donde sigues.
        const tramos = niveles.slice(0, -1).map((n, i) => {
            const [x0, y0] = PARADAS[i];
            const [x1, y1] = PARADAS[i + 1] || PARADAS[PARADAS.length - 1];
            const estadoTramo = P.nivelGanado(progreso, n.id) ? "hecho" : P.nivelAbierto(progreso, n.id) ? "siguiente" : "cerrado";
            const medio = (x0 + x1) / 2;
            return `<path class="senda-tramo ${estadoTramo}" d="M${x0} ${y0} C${medio} ${y0} ${medio} ${y1} ${x1} ${y1}" vector-effect="non-scaling-stroke" />`;
        }).join("");
        return `
            <section class="panel senda-mundo ${abierto ? "" : "cerrado"}">
                <div class="senda-mundo-cabeza">
                    <span class="senda-mundo-titulo"><small>Mundo ${m.numero}</small> ${m.nombre}</span>
                    <span class="senda-mundo-reliquias">◆ ${reliquias}/${totales}</span>
                </div>
                <div class="senda-camino-caja">
                    <img class="senda-portada" data-senda-portada="${m.numero}" alt="" />
                    <svg class="senda-tramos" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${tramos}</svg>
                    <ol class="senda-camino">${nodos}</ol>
                </div>
                <p class="mini texto-suave">${abierto ? m.texto : "🔒 Se abre al vencer al jefe del mundo anterior."}</p>
            </section>`;
    }).join("");
    return `
        ${detalleDelNivel(estado, id, fichas, caido)}
        ${mundos}
        <details class="plegable panel senda-ayuda">
            <summary>📖 Cómo se juega</summary>
            <p class="nota">Muévete con ◀ ▶ y salta con el botón grande (mantenlo apretado para saltar más alto). Puedes correr y saltar a la vez.
               En la compu: flechas o A/D para moverte, espacio o W para saltar, X para lanzar fuego y Esc para la pausa.</p>
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

// ===== La tarjeta de entrada a un nivel («MUNDO 1 · 1-1»), sobre el lienzo negro, antes de que se abra el iris =====
export function entradaDelNivel(nivelId, vidas) {
    const n = P.POR_ID[nivelId];
    const m = P.mundoDe(n);
    const jefe = n.jefe ? P.JEFES[n.jefe] : null;
    return `
        <div class="senda-entrada" role="status">
            <p class="senda-entrada-mundo">Mundo ${m.numero} · ${esc(m.nombre)}</p>
            <p class="senda-entrada-nivel">${n.jefe ? "Jefe" : n.id}</p>
            <p class="senda-entrada-nombre">${esc(n.nombre)}</p>
            <p class="senda-entrada-pie">${jefe ? `☠️ Te espera ${esc(jefe.nombre)}` : `${icono("corazon")} × ${vidas} · ${icono("reloj")} ${n.tiempo} s`}</p>
        </div>`;
}

// ===== La pausa: seguir, volver a empezar, el sonido, la música y salir =====
// datos = { marcador, fichas, sonido, musica } (todo opcional).
export function pausaDeLaSenda(nivelId, datos = {}) {
    const n = P.POR_ID[nivelId];
    const m = datos.marcador;
    const fichas = datos.fichas ?? 0;
    const estado = m
        ? `<p class="senda-pausa-estado">${icono("estrella")} ${m.puntos} · ${icono("moneda")} ${m.monedas} · ${icono("reloj")} ${m.tiempo} s${m.totalReliquias ? ` · <span class="senda-rombos">${rombos(m.reliquias, m.totalReliquias)}</span>` : ""}</p>`
        : "";
    const interruptor = (accion, nombre, prendido, icon) =>
        `<button type="button" class="senda-menu-boton senda-menu-interruptor ${prendido ? "prendido" : ""}" data-accion="${accion}" aria-pressed="${prendido ? "true" : "false"}">
            ${icono(icon)} ${nombre}: <b>${prendido ? "Sí" : "No"}</b></button>`;
    return `
        <div class="senda-menu" role="dialog" aria-label="Pausa">
            <p class="senda-menu-titulo">Pausa</p>
            <p class="senda-menu-nivel">${n.id} · ${esc(n.nombre)}</p>
            ${estado}
            <div class="senda-menu-botones">
                <button type="button" class="senda-menu-boton principal" data-accion="senda-seguir">${icono("reproducir")} Continuar</button>
                <button type="button" class="senda-menu-boton" data-accion="senda-reiniciar" ${fichas > 0 ? "" : "disabled"}>
                    ${icono("repetir")} Reiniciar <small>${fichas > 0 ? "1 ficha" : "sin fichas"}</small></button>
                ${interruptor("senda-sonido", "Sonido", datos.sonido !== false, "altavoz")}
                ${interruptor("senda-musica", "Música", datos.musica !== false, "nota")}
                <button type="button" class="senda-menu-boton peligro" data-accion="senda-rendirse">${icono("mapa")} Salir al mapa</button>
            </div>
        </div>`;
}

// ===== El resultado de un nivel (encima del lienzo) =====
// r = lo que devolvió acciones.terminarSenda; resultado = el de la partida; fichas = las que quedan.
// Los números llevan data-contar: la app los hace subir de 0 a su valor, uno tras otro (como en los juegos de antes).
export function finalDeLaSenda(r, resultado, nivelId, fichas, salio = false) {
    const n = P.POR_ID[nivelId];
    const atributo = ATRIBUTOS[arcade.JUEGOS.plataformas.atributo];
    const siguiente = P.siguienteNivel(nivelId);
    const otro = resultado.gano && siguiente && r.progreso ? siguiente : nivelId;
    const titulo = resultado.gano ? (n.jefe ? "¡Jefe vencido!" : "¡Nivel superado!") : salio ? "Saliste del nivel" : "Sin vidas";
    const nuevas = r.progreso?.nuevas?.length || 0;
    const fila = (icon, nombre, valor, extra = "") =>
        `<li><span>${icono(icon)} ${nombre}</span><b ${typeof valor === "number" ? `data-contar="${valor}"` : ""}>${valor}</b>${extra}</li>`;
    const filas = [
        fila("estrella", "Puntos", r.puntos),
        fila("moneda", "Monedas", resultado.monedas),
        n.jefe ? "" : `<li><span>${icono("rombo")} Reliquias</span><b class="senda-rombos">${rombos(resultado.reliquias)}</b>${nuevas ? `<em>${plural(nuevas, "nueva", "nuevas")}</em>` : ""}</li>`,
        fila("reloj", "Tiempo", resultado.tiempo, "<em>s</em>"),
        fila("espadas", "Criaturas", resultado.enemigos),
    ].filter(Boolean).join("");
    const abre = r.progreso?.abre ? P.POR_ID[r.progreso.abre] : null;
    return `
        <div class="senda-final ${resultado.gano ? "gano" : "perdio"}">
            <p class="senda-final-titulo">${titulo}</p>
            <h3>${n.id} · ${esc(n.nombre)}</h3>
            <ul class="senda-final-tabla">${filas}</ul>
            <p class="senda-final-premio">+${r.premio.gemas} 💎 · +${r.premio.xp} XP de ${atributo.icono} ${atributo.nombre}</p>
            ${r.nuevoRecord ? '<p class="senda-final-record">🏅 ¡Nuevo récord!</p>' : ""}
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

// ===== El marcador de arriba: dos marcos de pixel (vidas, monedas, reliquias y poder · puntos y tiempo) =====
// Los números llevan data-hud: la app los cambia sin rehacer el HTML (ver valoresDelMarcador).
const PODER_ICONO = { armadura: "escudo", fuego: "fuego", bendicion: "chispas" };

export function valoresDelMarcador(m) {
    return {
        vidas: `×${m.vidas}`,
        monedas: `×${String(m.monedas).padStart(2, "0")}`,
        puntos: String(m.puntos).padStart(6, "0"),
        tiempo: String(Math.max(0, m.tiempo)),
        reliquias: m.totalReliquias ? rombos(m.reliquias, m.totalReliquias) : "",
    };
}

// Lo que obliga a rehacer el marcador entero (lo demás solo cambia sus números).
export const formaDelMarcador = (m) => `${m.totalReliquias}|${m.poder}|${m.jefe ? `${m.jefe.nombre}/${m.jefe.golpes}` : ""}`;

export function marcadorDeLaSenda(m) {
    const v = valoresDelMarcador(m);
    const poder = PODER_ICONO[m.poder] ? `<span class="senda-hud-poder" title="Tu poder">${icono(PODER_ICONO[m.poder])}</span>` : "";
    return `
        <div class="senda-hud-fila">
            <div class="senda-marco">
                <span class="senda-hud-dato">${icono("corazon")}<b data-hud="vidas">${v.vidas}</b></span>
                <span class="senda-hud-dato">${icono("moneda")}<b data-hud="monedas">${v.monedas}</b></span>
                ${m.totalReliquias ? `<span class="senda-hud-dato senda-hud-reliquias"><b data-hud="reliquias">${v.reliquias}</b></span>` : ""}
                ${poder}
            </div>
            <div class="senda-marco senda-marco-derecha">
                <span class="senda-hud-dato"><b data-hud="puntos">${v.puntos}</b></span>
                <span class="senda-hud-dato ${m.tiempo <= 60 ? "senda-poco" : ""}" data-hud-tiempo>${icono("reloj")}<b data-hud="tiempo">${v.tiempo}</b></span>
            </div>
        </div>
        ${m.jefe ? barraDelJefe(m.jefe) : ""}`;
}

// La barra del jefe: su nombre en una placa, la vida en un marco con una marca por golpe y un rastro que baja despacio.
export function barraDelJefe(j) {
    const celdas = Array.from({ length: j.golpes }, (_, i) => `<i class="${i < j.vida ? "lleno" : ""}"></i>`).join("");
    return `
        <div class="senda-jefe" style="--vida: ${(j.vida / j.golpes).toFixed(3)}" data-vida="${j.vida}" data-golpes="${j.golpes}"
             role="img" aria-label="Vida del jefe: ${j.vida} de ${j.golpes}">
            <span class="senda-jefe-nombre">${icono("calavera")} ${esc(j.nombre)}</span>
            <span class="senda-jefe-barra"><i class="senda-jefe-rastro"></i><i class="senda-jefe-lleno"></i><span class="senda-jefe-celdas">${celdas}</span></span>
        </div>`;
}

// La barra del recorrido (debajo del juego, en vertical): dónde estás entre el inicio y el Arco, con los estandartes.
export function recorridoDelNivel(partida) {
    const largo = Math.max(1, partida.nivel.ancho * P.CELDA);
    const marcas = partida.controles.map((k) => `<i class="senda-recorrido-bandera" style="left: ${((k.c * P.CELDA) / largo * 100).toFixed(1)}%"></i>`).join("");
    const final = partida.jefe ? icono("calavera") : icono("castillo");
    return `
        <div class="senda-recorrido" aria-hidden="true">
            <span class="senda-recorrido-pista">${marcas}<i class="senda-recorrido-lleno"></i><i class="senda-recorrido-heroe"></i></span>
            <span class="senda-recorrido-fin">${final}</span>
        </div>`;
}
