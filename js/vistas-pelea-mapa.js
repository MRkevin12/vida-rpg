// vistas-pelea-mapa.js — La pelea sobre el mapa de la carrera (v146).
//
// Antes (v139–v145) la pelea del km tenía su propia caja al lado del mapa. Ahora pasa EN el mapa: la criatura del km
// aparece delante de ti, hacia donde corres, y se va acercando a medida que avanzas en el km. Cada poder (tajo, rayo,
// llamarada) sale de tu héroe y vuela hasta ella; si vas lento o pausas, ella te embiste o te lanza algo. Al cumplir el
// km, la escena grande de la Torre (vistas-running.js › htmlBatalla) aparece encima del mapa unos segundos con el golpe final.
//
// Cómo se dibuja (para que las animaciones no empiecen de cero cada segundo):
//   - El mapa (data-run-mapa) se vuelve a escribir con cada punto del GPS, más o menos cada segundo.
//   - La pelea va en una CAPA APARTE (data-run-pm), encima del mapa. Su contenido (htmlCapa) solo se vuelve a escribir
//     cuando cambia su firma (firmaDeLaCapa): un golpe nuevo, otra criatura, el final o llega una imagen.
//   - Cada segundo solo cambian cuatro variables del style de la capa (estiloDeLugar): --hx, --hy (tu héroe) y --cx, --cy
//     (la criatura). Todo lo de adentro se ubica con ellas: así se mueve con el mapa sin volver a crearse.
//   - La capa mide lo mismo que el dibujo del mapa (320 × 240 puntos, agrandado hasta llenar la caja y con los bordes
//     recortados). Por eso las posiciones son simples porcentajes del dibujo, y --px (en el CSS) es lo que mide en la
//     pantalla un punto del dibujo.
//
// Aquí solo se calcula y se arma el HTML (texto). Quien lo pone en la pantalla es app-running.js (ponerPeleaEnMapa).

import * as encuentros from "./encuentros.js";
import * as hallazgos from "./hallazgos.js";   // (v148) cofres y fogatas del camino
import * as bestiario from "./bestiario.js";
import { LIENZO } from "./dibujo-carrera.js";
import { esc } from "./vistas-comun.js";
import { chispasFF, numeroFF } from "./vistas-torre.js";
import { escenaDeBatalla, firmaDeBatalla, htmlBatalla, DURACION_FINAL, RECIENTE } from "./vistas-running.js";

// ===== Dónde va cada uno =====
export const LEJOS = 72;   // puntos del dibujo entre tu héroe y la criatura al empezar el km…
export const CERCA = 20;   // …y al terminarlo (casi encima). En el modo «Seguirme», 72 puntos son unos 95 m.
export const HEROE = { ancho: 21, alto: 28 };   // tu héroe en el mapa (sprites.spriteDeHeroeEnMapa): 1 punto de su imagen = 1 punto del dibujo

// Lo que tapan los rótulos del mapa, en px de la pantalla: arriba «Pradera» y «Ver todo»; abajo, el cartel de cada poder.
export const MARGENES = { arriba: 44, abajo: 34, lados: 6 };

// Cuántos puntos mide la criatura en el mapa: un tercio de su tamaño en la Torre (unos 32; los guardianes ya son más
// grandes) y un poco más si es el jefe. Su imagen se pixela con ese mismo tamaño (1 punto de la imagen = 1 punto del dibujo).
export const ladoEnMapa = (id, jefe = false) => Math.round((bestiario.CRIATURAS[id]?.talla || 96) / 3) + (jefe ? 4 : 0);

// La parte del dibujo (en puntos: x de 0 a 320, y de 0 a 240) que se ve en una caja de ancho × alto px. El dibujo se
// agranda hasta llenar la caja y se recortan los bordes que sobran. margenes (en px): lo que tapan los rótulos.
// Sin medidas (la caja todavía no se ve), todo el dibujo. escala = px de la pantalla por cada punto del dibujo.
export function parteVisible(ancho, alto, { arriba = 0, abajo = 0, lados = 0 } = {}) {
    const { ancho: W, alto: H } = LIENZO;
    if (!(ancho > 0 && alto > 0)) return { x0: 0, x1: W, y0: 0, y1: H, escala: 1 };
    const escala = Math.max(ancho / W, alto / H);
    const medioAncho = ancho / escala / 2;
    const medioAlto = alto / escala / 2;
    return {
        x0: W / 2 - medioAncho + lados / escala, x1: W / 2 + medioAncho - lados / escala,
        y0: H / 2 - medioAlto + arriba / escala, y1: H / 2 + medioAlto - abajo / escala,
        escala,
    };
}

// Dónde va la criatura (en % del dibujo, como `aqui`): delante de ti, hacia donde corres (rumbo), a LEJOS puntos al
// empezar el km y a CERCA al terminarlo (metros = lo que llevas del km). Sin rumbo (al empezar o si estás quieto),
// a un lado tuyo, hacia el centro del mapa. visible: la parte del dibujo que se ve (parteVisible); lado: cuánto mide
// la criatura (para que quepa entera). Devuelve { x, y } o null si todavía no sabes dónde estás.
export function lugarDeCriatura({ aqui, rumbo = null, metros = 0, visible = parteVisible(0, 0), lado = 26 }) {
    if (!aqui) return null;
    const { ancho: W, alto: H } = LIENZO;
    const hx = (aqui.x / 100) * W;   // tu héroe, en puntos del dibujo
    const hy = (aqui.y / 100) * H;
    const avance = Math.min(1, Math.max(0, metros / 1000));
    const distancia = LEJOS + (CERCA - LEJOS) * avance;
    let [ux, uy] = rumbo && Math.hypot(rumbo.x, rumbo.y) > 0.01 ? [rumbo.x, rumbo.y] : [hx > W / 2 ? -0.94 : 0.94, -0.34];
    const largo = Math.hypot(ux, uy);
    ux /= largo;
    uy /= largo;
    // Que quepa entera: se ubica por sus pies, así que arriba también tiene que caber su cuerpo, su nombre y su vida.
    const caja = { x0: visible.x0 + lado / 2, x1: visible.x1 - lado / 2, y0: visible.y0 + lado + 14, y1: visible.y1 - 2 };
    const dentro = (x, y) => [Math.min(caja.x1, Math.max(caja.x0, x)), Math.min(caja.y1, Math.max(caja.y0, y))];
    // (v151) Cerca del borde (sobre todo en «Ver todo», donde el recorrido llega hasta las orillas) la criatura no se salta
    // al otro lado ni se pega al borde: avanza por el camino, acercándose a ti de 4 en 4 puntos, hasta que cabe delante.
    for (let d = distancia; ; d = Math.max(CERCA, d - 4)) {
        const x = hx + ux * d;
        const y = hy + uy * d;
        if (x >= caja.x0 && x <= caja.x1 && y >= caja.y0 && y <= caja.y1) return { x: (x / W) * 100, y: (y / H) * 100 };
        if (d <= CERCA) break;
    }
    // Si delante no hay lugar (corres hacia un borde), se prueba del otro lado: al revés en x, en y o en las dos.
    let mejor = null;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const [x, y] = dentro(hx + ux * sx * distancia, hy + uy * sy * distancia);
        const lejos = Math.hypot(x - hx, y - hy);
        if (!mejor || lejos > mejor.lejos + 0.5) mejor = { x, y, lejos };
        if (lejos >= distancia * 0.7) break;   // lo bastante lejos de ti: este lugar sirve
    }
    return { x: (mejor.x / W) * 100, y: (mejor.y / H) * 100 };
}

// (v148) Dónde va el próximo cofre o fogata: delante de ti, a la distancia que falta (en el modo «Seguirme» 320 puntos del
// dibujo son unos 420 m, así que 1 m ≈ 0,76 puntos), a un lado del camino: el lado CONTRARIO al de la criatura (criatura,
// en % del dibujo), para que no se tapen. Si aun así quedan muy juntos, se aparta un poco más.
export const PUNTOS_POR_METRO = 320 / 420;
export const SEPARACION = 26;   // puntos del dibujo a un lado del camino
export function lugarDeHallazgo({ aqui, rumbo = null, falta = 0, visible = parteVisible(0, 0), criatura = null }) {
    if (!aqui) return null;
    const { ancho: W, alto: H } = LIENZO;
    const hx = (aqui.x / 100) * W;
    const hy = (aqui.y / 100) * H;
    const d = Math.max(12, falta * PUNTOS_POR_METRO);
    let [ux, uy] = rumbo && Math.hypot(rumbo.x, rumbo.y) > 0.01 ? [rumbo.x, rumbo.y] : [hx > W / 2 ? -0.94 : 0.94, 0.34];
    const largo = Math.hypot(ux, uy);
    ux /= largo;
    uy /= largo;
    // ¿De qué lado del camino está la criatura? (el signo del producto cruz entre el rumbo y la línea héroe → criatura)
    const [cx, cy] = criatura ? [(criatura.x / 100) * W, (criatura.y / 100) * H] : [hx, hy];
    const ladoCriatura = Math.sign(ux * (cy - hy) - uy * (cx - hx)) || 1;
    const lado = -ladoCriatura;   // el cofre va del otro lado
    const dentro = (x, y) => [Math.min(visible.x1 - 8, Math.max(visible.x0 + 8, x)), Math.min(visible.y1 - 4, Math.max(visible.y0 + 16, y))];
    // Delante (d) y a un costado (SEPARACION, girando el rumbo 90° hacia ese lado). Si queda encima de la criatura, más lejos.
    let [x, y] = dentro(hx + ux * d - uy * SEPARACION * lado, hy + uy * d + ux * SEPARACION * lado);
    if (criatura && Math.hypot(x - cx, y - cy) < 28) [x, y] = dentro(hx + ux * d - uy * SEPARACION * 2 * lado, hy + uy * d + ux * SEPARACION * 2 * lado);
    return { x: (x / W) * 100, y: (y / H) * 100 };
}

// El rumbo del GPS tiembla un poco: se mezcla con el anterior para que la criatura no salte de un lado a otro.
// Si das media vuelta (los dos apuntan casi al revés), se queda el nuevo. Sin rumbo nuevo, se queda el anterior.
export function mezclarRumbo(anterior, nuevo, peso = 0.5) {
    if (!nuevo) return anterior || null;
    if (!anterior) return nuevo;
    const x = anterior.x * (1 - peso) + nuevo.x * peso;
    const y = anterior.y * (1 - peso) + nuevo.y * peso;
    const largo = Math.hypot(x, y);
    return largo < 0.3 ? nuevo : { x: x / largo, y: y / largo };
}

// "50.00,48.20" (como lo escribe el mapa en data-aqui y data-rumbo) → { x: 50, y: 48.2 }, o null si no hay.
export function leerPar(texto) {
    const [x, y] = String(texto || "").split(",").map(Number);
    return texto && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

// (v147) De dónde sale (y adónde llega) lo que vuela de tu lado. Casi siempre es tu héroe; pero en «Ver todo», con un
// recorrido grande, tu héroe puede quedar en la parte recortada del mapa. Entonces el tiro sale del BORDE de lo que se ve,
// sobre la línea que va de la criatura a ti: así nada aparece desde fuera de la vista. visible: como parteVisible
// (la criatura siempre está dentro). Devuelve { x, y } en % del dibujo, como `aqui`.
export function puntoDeTiro(heroe, criatura, visible = parteVisible(0, 0), margen = 4) {
    if (!heroe || !criatura) return heroe || null;
    const { ancho: W, alto: H } = LIENZO;
    const [hx, hy] = [(heroe.x / 100) * W, (heroe.y / 100) * H];
    const [cx, cy] = [(criatura.x / 100) * W, (criatura.y / 100) * H];
    const caja = { x0: visible.x0 + margen, x1: visible.x1 - margen, y0: visible.y0 + margen, y1: visible.y1 - margen };
    if (hx >= caja.x0 && hx <= caja.x1 && hy >= caja.y0 && hy <= caja.y1) return heroe;
    // Se camina de la criatura (t = 0) hacia ti (t = 1) y se para donde la línea cruza el borde de la caja.
    let t = 1;
    const [dx, dy] = [hx - cx, hy - cy];
    if (dx > 0 && cx + dx * t > caja.x1) t = (caja.x1 - cx) / dx;
    if (dx < 0 && cx + dx * t < caja.x0) t = (caja.x0 - cx) / dx;
    if (dy > 0 && cy + dy * t > caja.y1) t = (caja.y1 - cy) / dy;
    if (dy < 0 && cy + dy * t < caja.y0) t = (caja.y0 - cy) / dy;
    t = Math.max(0, Math.min(1, t));
    return { x: ((cx + dx * t) / W) * 100, y: ((cy + dy * t) / H) * 100 };
}

// Lo que app-running.js escribe cada segundo en el style de la capa: dónde va tu héroe y dónde la criatura (en % del dibujo).
// (v147) tiro: de dónde sale lo que vuela de tu lado (puntoDeTiro); si no se da, tu héroe.
// (v148) objeto: dónde va el próximo cofre o fogata (lugarDeHallazgo), si hay uno cerca.
export function estiloDeLugar(heroe, criatura, tiro = heroe, objeto = null) {
    const c = criatura || heroe;
    const t = tiro || heroe;
    const o = objeto || heroe;
    return `--hx: ${heroe.x.toFixed(2)}%; --hy: ${heroe.y.toFixed(2)}%; --cx: ${c.x.toFixed(2)}%; --cy: ${c.y.toFixed(2)}%; --tx: ${t.x.toFixed(2)}%; --ty: ${t.y.toFixed(2)}%; --ox: ${o.x.toFixed(2)}%; --oy: ${o.y.toFixed(2)}%`;
}

// El nombre sobre la criatura: si es largo, la primera palabra («Araña tejedora» → «Araña»).
export const nombreCorto = (nombre) => (nombre.length <= 12 ? nombre : nombre.split(" ")[0]);

// ===== Lo que pasa en la capa =====
// Los tiempos de cada golpe (en ms desde que se dibuja): el poder SALE de tu héroe, VUELA hasta la criatura y PEGA
// (chispas, número, la vida baja). El rayo es más rápido; la llamarada sale un poco después del primer golpe.
export const TIEMPOS = { sale: 80, vuelo: 420, vueloRayo: 280, llamarada: 170 };

// ¿El último golpe es reciente? (se anima solo si lo es)
const golpeFresco = (golpes, final, ahora) => {
    const ultimo = golpes.at(-1);
    return !final && ultimo && ahora - ultimo.t < RECIENTE ? ultimo : null;
};

// Cambia cada vez que hay que volver a escribir la capa: un golpe nuevo, otra criatura, el final, llega una imagen…
// y también cuando un golpe (o la llegada de la criatura) deja de ser reciente: así se borran el cartel, los números y
// lo que voló (con «menos movimiento» se quedan quietos hasta ese momento). No cambia con los metros.
// sprites = { heroeMapa: imagen de tu héroe en el mapa, mapa: { id: imagen de la criatura en el mapa } }.
export function firmaDeLaCapa(en, ahora = Date.now(), sprites = {}) {
    const { pelea, final, golpes, llega } = escenaDeBatalla(en, ahora);
    const listas = [sprites.heroeMapa, pelea && sprites.mapa?.[pelea.id]].map(Boolean).join("");
    const reciente = Boolean(golpeFresco(golpes, final, ahora)) || llega;
    // (v148) El cofre o la fogata que viene, y el último que encontraste mientras sea reciente.
    const viene = hallazgos.proximo(en.inicio, en.distancia);
    const hallado = halladoFresco(en, ahora);
    return `${pelea?.km ?? "-"}:${final}:${golpes.length}:${reciente}:${listas}:${viene ? `${viene.tipo}${viene.metro}` : "-"}:${hallado ? hallado.metro : "-"}`;
}

// (v148) El último cofre o fogata que encontraste, si fue hace poco (RECIENTE). Si no, null.
export const halladoFresco = (en, ahora = Date.now()) => {
    const h = (en.hallados || []).at(-1);
    return h && ahora - h.t < RECIENTE ? h : null;
};

// (v148) El cofre y la fogata en cuadritos (12 × 12 puntos del dibujo). La llama parpadea (CSS run-pm-llama).
const DIBUJO_HALLAZGO = {
    cofre: `<rect x="0" y="5" width="12" height="7" fill="#7a4a1e"/><rect x="0" y="2" width="12" height="4" fill="#a8702e"/>
        <rect x="1" y="1" width="10" height="1" fill="#c8883a"/><rect x="0" y="5" width="12" height="1" fill="#3a2614"/>
        <rect x="5" y="5" width="2" height="3" fill="#fbbf24"/><rect x="0" y="11" width="12" height="1" fill="#2a1a0c"/>`,
    fogata: `<rect x="1" y="10" width="10" height="2" fill="#5a3a1e"/><rect x="3" y="9" width="6" height="1" fill="#7a5028"/>
        <g class="run-pm-llama"><rect x="3" y="4" width="6" height="5" fill="#e0501a"/><rect x="4" y="2" width="4" height="3" fill="#f07a1f"/>
        <rect x="5" y="5" width="2" height="4" fill="#ffd23c"/><rect x="5" y="1" width="2" height="2" fill="#ffb020"/></g>`,
};
const dibujoHallazgo = (tipo) => `<svg class="run-pm-objeto-svg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${DIBUJO_HALLAZGO[tipo]}</svg>`;

// (v148) El próximo cofre o fogata, delante de ti en el mapa, con los metros que faltan. Se ubica con --ox y --oy.
function htmlHallazgo(en) {
    const h = hallazgos.proximo(en.inicio, en.distancia);
    if (!h) return "";
    return `<div class="run-pm-objeto ${h.tipo}" aria-hidden="true">${dibujoHallazgo(h.tipo)}<b>${Math.max(1, Math.round(h.falta))} m</b></div>`;
}

// Una barrita de vida (de 0 a encuentros.VIDA) sobre la cabeza, con el nombre encima si lo hay. Si acaba de haber un
// golpe, empieza en la vida de antes y baja cuando el golpe pega (pega, en ms).
const vidaMini = (antes, ahora, clase, pega, nombre = "") => `
        <span class="run-pm-cabeza">
            ${nombre ? `<b class="run-pm-nombre">${esc(nombre)}</b>` : ""}
            <span class="run-pm-vida ${clase} ${ahora < 30 ? "grave" : ""}"><i style="--antes: ${antes}%; --ahora: ${ahora}%; animation-delay: ${pega}ms"></i></span>
        </span>`;

// El destello del golpe sobre la criatura (los mismos de la Torre: ff-tajo, ff-rayo, ff-fuego), en su momento.
const efectoFF = (efecto, cuando) => `<span class="ff-efecto ff-${efecto}" style="animation-delay: ${cuando}ms"></span>`;

export function htmlCapa(en, ahora = Date.now(), sprites = {}) {
    const { pelea, final, golpes, llega } = escenaDeBatalla(en, ahora);
    // Lo que se anima: el último golpe, si es reciente (si la capa se vuelve a escribir más tarde, no se repite).
    const fresco = golpeFresco(golpes, final, ahora);
    const poder = fresco ? encuentros.PODERES[fresco.tipo] : null;              // tu héroe lanzó un poder
    const ataque = fresco ? encuentros.ATAQUES_CRIATURA[fresco.tipo] : null;    // o la criatura te atacó
    const vuelo = fresco?.tipo === "rayo" ? TIEMPOS.vueloRayo : TIEMPOS.vuelo;
    const pega = TIEMPOS.sale + vuelo;
    // Las vidas de ahora y, si acaba de haber un golpe, las de antes (la barra baja cuando el golpe pega).
    const vidas = encuentros.vidasDeLaBatalla(golpes);
    const antes = fresco ? encuentros.vidasDeLaBatalla(golpes.slice(0, -1)) : vidas;

    // (v148) La fogata (un «golpe» que cura) y el último cofre o fogata que encontraste.
    const descanso = fresco?.tipo === "fogata" ? fresco : null;
    const hallado = halladoFresco(en, ahora);
    const cofre = hallado?.tipo === "cofre" ? hallado : null;
    const extras = (descanso ? chispasFF("cura", 120) + numeroFF(`+${descanso.cura} ❤️`, "cura", 160) : "")
        + (cofre ? chispasFF("critico", 80) + numeroFF(`+${hallazgos.COFRE.gemas} 💎`, "critico", 120) : "");
    const cartelHallazgo = cofre ? `${hallazgos.TIPOS.cofre.icono} ¡Cofre! +${hallazgos.COFRE.gemas} 💎 +${hallazgos.COFRE.xp} XP`
        : descanso ? `${hallazgos.TIPOS.fogata.icono} Descanso: +${descanso.cura} ❤️ y más margen` : "";
    const objeto = htmlHallazgo(en);

    const heroe = `
        <div class="run-pm-bando run-pm-heroe ${poder ? "lanza" : ""} ${ataque ? "herido" : ""} ${descanso ? "descansa" : ""}" style="--lado: ${HEROE.ancho}; --pega: ${pega}ms">
            <span class="run-pm-sombra"></span>
            ${final ? "" : vidaMini(antes.heroe, vidas.heroe, "de-heroe", pega)}
            <span class="run-pm-cuerpo"><img class="run-pm-sprite" src="${sprites.heroeMapa || ""}" alt="" draggable="false"></span>
            ${ataque ? chispasFF("herida", pega) + numeroFF(`−${fresco.herida}`, "herida", pega) : ""}
            ${extras}
        </div>`;
    const cartelSolo = cartelHallazgo ? `<p class="ff-ventana run-pm-cartel hallazgo">${esc(cartelHallazgo)}</p>` : "";
    // En el golpe final la criatura está en la escena grande (htmlFinal): aquí solo queda tu héroe (y lo que viene en el camino).
    if (!pelea || final) return `${objeto}${heroe}${cartelSolo}`;

    const criatura = bestiario.CRIATURAS[pelea.id] || {};
    const lado = ladoEnMapa(pelea.id, pelea.jefe);
    const clases = [
        pelea.jefe ? "jefe" : "",
        criatura.vuela ? "vuela" : "",
        llega ? "llega" : "",
        poder ? "golpeada" : "",
        fresco?.tipo === "lento" ? "embiste" : "",   // se te adelanta: te embiste
        fresco?.tipo === "pausa" ? "dispara" : "",   // aprovecha tu pausa: te lanza algo
    ].join(" ");
    const efectos = !poder ? "" : efectoFF(poder.efecto, pega) + (fresco.combo ? efectoFF("fuego", pega + TIEMPOS.llamarada) : "");
    const enemigo = `
        <div class="run-pm-bando run-pm-criatura ${clases}" style="--lado: ${lado}; --pega: ${pega}ms; --sale: ${TIEMPOS.sale}ms">
            <span class="run-pm-sombra"></span>
            ${vidaMini(antes.criatura, vidas.criatura, "de-enemigo", pega, `${pelea.jefe ? "👑 " : ""}${nombreCorto(encuentros.nombreDe(pelea))}`)}
            <span class="run-pm-giro"><span class="run-pm-cuerpo"><img class="run-pm-sprite" src="${sprites.mapa?.[pelea.id] || ""}" alt="" draggable="false"></span></span>
            ${efectos}
            ${poder ? chispasFF(fresco.combo ? "critico" : fresco.tipo === "rayo" ? "rayo" : "golpe", pega) + numeroFF(fresco.dano, fresco.combo ? "critico" : "", pega) : ""}
        </div>`;

    // Lo que vuela: tu poder (de tu héroe a la criatura) o lo que ella te lanza (al revés). Se apunta al pecho de cada uno:
    // --hm y --cm son la mitad de su alto, en % del dibujo (la criatura que vuela está más arriba).
    const pecho = `--hm: ${((HEROE.alto * 0.45 * 100) / LIENZO.alto).toFixed(2)}%; --cm: ${(((lado * 0.5 + (criatura.vuela ? 8 : 0)) * 100) / LIENZO.alto).toFixed(2)}%`;
    const tiro = (clase, cuando) => `<i class="run-pm-tiro ${clase}" style="${pecho}; animation-duration: ${vuelo}ms; animation-delay: ${cuando}ms"></i>`;
    const tiros = poder ? tiro(fresco.tipo, TIEMPOS.sale) + (fresco.combo ? tiro("llamarada", TIEMPOS.sale + TIEMPOS.llamarada) : "")
        : fresco?.tipo === "pausa" ? tiro("de-criatura", TIEMPOS.sale) : "";

    // El cartel de abajo: el nombre de lo que acaba de pasar, o quién aparece.
    const clase = encuentros.CLASES[pelea.clase];
    const icono = pelea.jefe ? "👑" : pelea.emboscada ? "⚠️" : clase?.icono || "⚔️";
    const cartel = poder ? `${poder.icono} ${poder.nombre}${fresco.combo ? ` + ${encuentros.PODERES.llamarada.icono} ${encuentros.PODERES.llamarada.nombre}` : ""}`
        : ataque ? `${ataque.icono} ${ataque.nombre}`
        : cartelHallazgo ? cartelHallazgo
        : llega ? `${icono} ¡Aparece ${encuentros.nombreDe(pelea)}!` : "";
    const claseCartel = poder ? "" : ataque ? "ataque" : cartelHallazgo ? "hallazgo" : llega ? "aparece" : "";

    return `${objeto}${enemigo}${heroe}${tiros}
        ${cartel ? `<p class="ff-ventana run-pm-cartel ${claseCartel}">${esc(cartel)}</p>` : ""}`;
}

// ===== El golpe final: la escena grande de la Torre, encima del mapa =====
// Solo durante DURACION_FINAL después de cumplir el km. Usa la batalla de siempre (htmlBatalla) y su firma.
export const SALIDA = 400;   // ms que tarda en desaparecer (termina un poco antes de DURACION_FINAL)

export function firmaDelFinal(en, ahora = Date.now(), sprites = {}) {
    return escenaDeBatalla(en, ahora).final ? firmaDeBatalla(en, ahora, sprites) : "";
}

export function htmlFinal(en, ahora = Date.now(), sprites = {}) {
    const { pelea, final } = escenaDeBatalla(en, ahora);
    if (!final) return "";
    // Entra en un instante y se va sola. La salida se cuenta desde que terminó el km (finEn): así termina a tiempo aunque
    // la capa se haya dibujado un poco tarde (el reloj de la app avanza de segundo en segundo).
    const sale = Math.max(0, DURACION_FINAL - SALIDA - 200 - Math.max(0, ahora - pelea.finEn));
    return `<div class="run-batalla run-final-escena" style="animation-delay: 0ms, ${sale}ms">${htmlBatalla(en, ahora, sprites)}</div>`;
}
