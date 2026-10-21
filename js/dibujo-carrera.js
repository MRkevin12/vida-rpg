// dibujo-carrera.js — El mapa de tu carrera en pixel art (v118, mejorado en la v119 y rehecho en la v144).
//
// Es un mapa PROPIO: no usa internet ni mapas de nadie. Con los puntos del GPS dibuja el camino que corres y, alrededor,
// un paisaje inventado que cambia por zonas (pradera, bosque, pantano, desierto, nieve y tierras del abismo; ver
// encuentros.ZONAS), con ríos, lagos, bosquecillos, colinas, montañas, aldeas y ruinas. El paisaje sale de un «azar fijo»
// por casilla: el mismo lugar se dibuja siempre igual, así nada «baila» cuando el mapa se vuelve a dibujar.
// (v144) Además: luz según la hora (amanecer, día, atardecer, noche), niebla, nieve y brasas según la zona, un mojón en
// cada km, tu km más rápido en dorado, huellas y un rastro de luz detrás de ti, pájaros, y cosas que se mueven (árboles,
// agua, fuego). Las piezas (dibujos y colores) están en dibujo-carrera-piezas.js.
// Devuelve texto SVG (como los demás dibujos). shape-rendering="crispEdges" deja los bordes en cuadritos.

import { ZONAS, KM_POR_ZONA, zonaDelKm } from "./encuentros.js";
import * as piezas from "./dibujo-carrera-piezas.js";

const { n1, cuadros, nuevoPintor, PALETAS, AGUAS } = piezas;
export const momentoDelDia = piezas.momentoDelDia;

export const LIENZO = { ancho: 320, alto: 240, margen: 30, minMetros: 160 };
const CASILLA = 16;   // el paisaje se reparte en casillas de 16 × 16 (el suelo, en cuadritos de 8 × 8)

// Un número entre 0 y 1 que siempre sale igual para la misma casilla.
const azar = (i, j, k = 0) => {
    const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
    return x - Math.floor(x);
};
const r1 = (n) => n.toFixed(1);

// (v144) Un azar «suave»: cambia poco a poco de una casilla a la vecina. Sirve para que los árboles se junten en
// bosquecillos con claros entre ellos y para las manchas del suelo (en vez de un tablero de ajedrez).
function suave(x, y, k) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const curva = (t) => t * t * (3 - 2 * t);
    const fx = curva(x - i);
    const fy = curva(y - j);
    const arriba = azar(i, j, k) + (azar(i + 1, j, k) - azar(i, j, k)) * fx;
    const abajo = azar(i, j + 1, k) + (azar(i + 1, j + 1, k) - azar(i, j + 1, k)) * fx;
    return arriba + (abajo - arriba) * fy;
}

// (v144) Las piezas ya dibujadas se guardan: el mapa se vuelve a dibujar cada segundo y cada pieza sale siempre igual.
const PIEZAS_HECHAS = new Map();
function piezaGuardada(nombre, momento) {
    const clave = `${nombre}|${momento}`;
    if (!PIEZAS_HECHAS.has(clave)) PIEZAS_HECHAS.set(clave, piezas.pieza(nombre, momento));
    return PIEZAS_HECHAS.get(clave);
}

// (v144) Mezcla colores «#rrggbb» según su peso: [[color, peso]…] → un color. Sirve para que el suelo pase de una zona a otra
// poco a poco. Si hay un solo color, se queda tal cual.
const RGB = new Map();
const aRgb = (c) => {
    if (!RGB.has(c)) RGB.set(c, [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
    return RGB.get(c);
};
function mezclarColores(lista) {
    if (lista.length === 1) return lista[0][0];
    const suma = [0, 0, 0];
    let total = 0;
    for (const [color, peso] of lista) {
        const rgb = aRgb(color);
        for (let i = 0; i < 3; i++) suma[i] += rgb[i] * peso;
        total += peso;
    }
    // Se redondea de 6 en 6: colores casi iguales quedan iguales y se pintan juntos (menos <path>, menos peso).
    return `#${suma.map((v) => Math.min(255, Math.round(v / total / 6) * 6).toString(16).padStart(2, "0")).join("")}`;
}

// Un nombre corto para los id del SVG (los <defs>), distinto para cada mapa: si hay varios mapas en la pantalla, no se mezclan.
function prefijo(texto) {
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    return `c${(h % 1679616).toString(36)}`;   // «c» y hasta 4 letras o números
}
const n0 = (v) => String(Math.round(v));   // un número entero (los cuadritos del suelo y las piezas caen en puntos enteros)

// lat/lon -> metros (desde el primer punto) -> puntos del lienzo.
// Modo «todo»: se ajusta para que quepa todo el recorrido (al menos LIENZO.minMetros de lado).
// Modo «seguir» (v131): una ventana fija de VENTANA_SEGUIR metros de ancho centrada en donde vas, para ver de cerca hacia dónde corres.
export const VENTANA_SEGUIR = 420;
function proyectar(traza, seguir = false) {
    const [lat0, lon0] = traza[0];
    const k = Math.cos((lat0 * Math.PI) / 180) * 111320;
    const aMetros = (p) => [(p[1] - lon0) * k, -(p[0] - lat0) * 110540];
    const metros = traza.map(aMetros);
    let cx;
    let cy;
    let escala;
    if (seguir) {
        [cx, cy] = metros[metros.length - 1];
        escala = LIENZO.ancho / VENTANA_SEGUIR;
    } else {
        const xs = metros.map((m) => m[0]);
        const ys = metros.map((m) => m[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        cx = (x0 + x1) / 2;
        cy = (y0 + y1) / 2;
        const ancho = Math.max(x1 - x0, LIENZO.minMetros);
        const alto = Math.max(y1 - y0, LIENZO.minMetros * 0.75);
        escala = Math.min((LIENZO.ancho - LIENZO.margen * 2) / ancho, (LIENZO.alto - LIENZO.margen * 2) / alto);
    }
    const W = LIENZO.ancho / 2;
    const H = LIENZO.alto / 2;
    return {
        escala,
        aMetros,
        aPantalla: (p) => { const [x, y] = aMetros(p); return [W + (x - cx) * escala, H + (y - cy) * escala]; },
        metrosAPantalla: (x, y) => [W + (x - cx) * escala, H + (y - cy) * escala],
        aMundo: (x, y) => [(x - W) / escala + cx, (y - H) / escala + cy],
    };
}

// (v144) El km de cada punto del camino. Los mojones (uno por km, donde estabas al cumplirlo) dicen dónde termina cada km;
// entre dos mojones se reparte por la distancia. Devuelve { kms (uno por punto), anclas: [[índice del punto, km]…] }.
function kmDeCadaPunto(enMetros, mojones, km) {
    const n = enMetros.length;
    const acumulado = [0];
    for (let i = 1; i < n; i++) acumulado.push(acumulado[i - 1] + Math.hypot(enMetros[i][0] - enMetros[i - 1][0], enMetros[i][1] - enMetros[i - 1][1]));
    const anclas = [[0, 0]];
    let desde = 0;
    mojones.forEach((m, k) => {
        let mejor = Infinity;
        let indice = -1;
        for (let i = desde; i < n; i++) {
            const d = (enMetros[i][0] - m[0]) ** 2 + (enMetros[i][1] - m[1]) ** 2;
            if (d < mejor) { mejor = d; indice = i; }
        }
        if (indice > anclas[anclas.length - 1][0]) { anclas.push([indice, k + 1]); desde = indice; }
    });
    const ultima = anclas[anclas.length - 1];
    if (ultima[0] < n - 1) anclas.push([n - 1, Math.max(km, ultima[1])]);
    const kms = new Array(n).fill(0);
    for (let a = 0; a + 1 < anclas.length; a++) {
        const [i0, k0] = anclas[a];
        const [i1, k1] = anclas[a + 1];
        const largo = acumulado[i1] - acumulado[i0] || 1;
        for (let i = i0; i <= i1; i++) kms[i] = k0 + ((acumulado[i] - acumulado[i0]) / largo) * (k1 - k0);
    }
    return { kms, anclas };
}

// La distancia (al cuadrado) del punto (x, y) al tramo a–b, y en qué parte del tramo cae (t de 0 a 1).
function aTramo(x, y, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const largo = dx * dx + dy * dy;
    const t = largo ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / largo)) : 0;
    return { d2: (a[0] + dx * t - x) ** 2 + (a[1] + dy * t - y) ** 2, t };
}

// (v144) Las animaciones del mapa (ver estilos.css, bloque v144) duran un divisor de 24 s y van en pasos de 1/8 s.
// Sus fases salen del reloj: así, aunque el mapa se vuelva a dibujar cada segundo, siguen donde iban en vez de empezar de cero.
// Hay 4 grupos (--f0 … --f3) desfasados 5/8 s, para que no se mueva todo a la vez.
const CICLO = 24;
function fases(reloj) {
    const t = Math.floor((Number(reloj) || 0) / 125) / 8;
    return [0, 1, 2, 3].map((n) => `--f${n}:${-((t + n * 0.625) % CICLO)}s`).join(";");
}

// ===== El mapa =====
// opciones = { traza: [[lat, lon]…], banderas: [[lat, lon]…] (una por km), encuentros: [{ km, resultado, jefe }…], km: lo corrido,
//              seguir: true (te sigue de cerca) o false (todo el recorrido), flecha: dibujar hacia dónde vas,
//              (v144) parciales: segundos de cada km (el más rápido brilla), hora: 0–24 (la luz del día), reloj: ms (las fases de
//              las animaciones), vivo: es la carrera en curso (huellas, rastro de luz y sombra del héroe) }
// porZona: cada cuántos km cambia el paisaje (las carreras viejas, sin dato, usan 3).
// Devuelve { svg, aqui: { x, y } en % (dónde va tu héroe) o null, rumbo: { x, y } (v146: hacia dónde corres, de largo 1,
// en el dibujo; null si todavía no se sabe), zona (la del final del recorrido) }.
// El paisaje y el río están anclados al TERRENO (en metros), así no «bailan» cuando el mapa te sigue.
export function mapaDeCarrera({ traza = [], banderas = [], encuentros = [], km = 0, seguir = false, flecha = false, porZona = 3,
                                parciales = [], hora, reloj = 0, vivo = flecha } = {}) {
    const lista = (traza || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]));
    const { ancho, alto } = LIENZO;
    const zonaFinal = zonaDelKm(Math.floor(km) + 1, porZona);
    if (!lista.length) {
        return {
            svg: `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Mapa de tu carrera">
                <rect width="${ancho}" height="${alto}" fill="${zonaFinal.suelo[0]}"/>
                <text x="160" y="124" text-anchor="middle" fill="#eef2ff" font-size="13">Buscando señal del GPS…</text></svg>`,
            aqui: null, rumbo: null, zona: zonaFinal,
        };
    }
    const momento = piezas.momentoDelDia(hora);
    const noche = momento === "noche";
    const vista = proyectar(lista, seguir);
    const { escala, aPantalla, metrosAPantalla, aMundo, aMetros } = vista;
    const puntos = lista.map(aPantalla);
    const enMetros = lista.map(aMetros);
    const mojones = (banderas || []).filter((b) => Array.isArray(b) && Number.isFinite(b[0]));
    const { kms, anclas } = kmDeCadaPunto(enMetros, mojones.map(aMetros), km);
    const n = puntos.length;
    const muestra = Math.max(1, Math.ceil(n / 90));   // para no medir contra todos los puntos
    const p = prefijo(`${lista[0]}|${n}|${km}|${seguir}|${momento}|${porZona}`);
    const visible = (x, y, margen = 0) => x > -margen && x < ancho + margen && y > -margen && y < alto + margen;

    // ¿Qué tan lejos queda un lugar del camino (en puntos del lienzo) y en qué km del camino está lo más cercano?
    const cerca = (x, y) => {
        let mejor = Infinity;
        let indice = 0;
        for (let i = 0; i < n; i += muestra) {
            const d = (puntos[i][0] - x) ** 2 + (puntos[i][1] - y) ** 2;
            if (d < mejor) { mejor = d; indice = i; }
        }
        const dUltimo = (puntos[n - 1][0] - x) ** 2 + (puntos[n - 1][1] - y) ** 2;
        if (dUltimo < mejor) { mejor = dUltimo; indice = n - 1; }
        // Se afina con los tramos de alrededor (entre dos puntos también hay camino).
        for (let i = Math.max(0, indice - muestra); i < Math.min(n - 1, indice + muestra); i++) {
            const { d2, t } = aTramo(x, y, puntos[i], puntos[i + 1]);
            if (d2 < mejor) { mejor = d2; indice = t < 0.5 ? i : i + 1; }
        }
        return { k: kms[indice], distancia: Math.sqrt(mejor) };
    };

    // (v144) La zona de un lugar según su km. Cerca del cambio de zona hay una franja (~32 puntos de cada lado) donde las dos
    // se mezclan: r (0–1, un azar fijo de cada casilla) decide de cuál es cada casilla (sus árboles, rocas…). Así no hay un
    // corte seco. El color del suelo se mezcla aparte (mezclaDe).
    const banda = 32 / escala / 1000;   // en km
    const zonaDe = (k, r) => {
        let kk = k;
        const frontera = Math.round(k / porZona) * porZona;
        if (frontera > 0 && Math.abs(k - frontera) < banda) {
            const t = (k - frontera + banda) / (2 * banda);   // 0: todavía en la zona de antes … 1: ya en la nueva
            kk = r < t ? frontera + 0.001 : frontera - 0.001;
        }
        return zonaDelKm(Math.floor(kk) + 1, porZona);
    };
    // Lo mismo, para mezclar colores: [[id de la zona, peso]…]. En la franja del cambio pesan las dos (ruido: un poco de azar).
    const mezclaDe = (k, ruido = 0) => {
        const frontera = Math.round(k / porZona) * porZona;
        if (frontera > 0 && Math.abs(k - frontera) < banda) {
            const t = Math.max(0, Math.min(1, (k - frontera + banda) / (2 * banda) + ruido));
            return [[zonaDelKm(frontera, porZona).id, 1 - t], [zonaDelKm(frontera + 1, porZona).id, t]];
        }
        return [[zonaDelKm(Math.floor(k) + 1, porZona).id, 1]];
    };

    // Las piezas que se usan se definen una sola vez en <defs> (ver dibujo-carrera-piezas.js), con un id corto
    // (el prefijo y un número: «c1a2_0», «c1a2_1»…; la copa de un árbol lleva «-c») para que cada <use> ocupe poco.
    const defs = new Map();
    const pedir = (nombre) => {
        const clave = piezas.normalizar(nombre);
        if (!defs.has(clave)) defs.set(clave, { ...piezaGuardada(clave, momento), id: `${p}_${defs.size.toString(36)}` });
        return defs.get(clave);
    };
    const usar = (nombre, x, y, extra = "", copa = false) => `<use href="#${pedir(nombre).id}${copa ? "-c" : ""}" x="${n0(x)}" y="${n0(y)}"${extra}/>`;
    const objetos = [];                       // { y, svg }: se dibujan de arriba abajo (lo de más abajo tapa a lo de atrás)
    const luces = nuevoPintor();              // lo que brilla de noche (ventanas, lava…): va encima de la oscuridad
    const halos = nuevoPintor();
    const lava = nuevoPintor();
    const fuegos = [];                        // llamas, humo y su resplandor
    const grupo = () => [0, 1, 2, 3].map(() => nuevoPintor());
    const efectos = { brillo: grupo(), copo: grupo(), brasa: grupo(), luciernaga: grupo(), niebla: grupo(), mariposa: grupo(), pasto: grupo() };
    const poner = (nombre, x, y, fase = 0) => {
        const pz = pedir(nombre);
        let svg = usar(nombre, x, y);
        if (pz.copa) svg += usar(nombre, x, y, ` class="cr-mece f${fase}"`, true);
        if (pz.luces.length && momento !== "dia") {
            for (const [lx, ly, lw, lh] of pz.luces) {
                luces.cuadro(x + lx, y + ly, lw, lh, "#ffcf6a");
                if (noche) halos.cuadro(x + lx - 1.5, y + ly - 1.5, lw + 3, lh + 3, "rgba(255,200,110,.22)");
            }
        }
        objetos.push({ y, svg });
    };
    const fogata = (x, y, fase) => {
        poner("fogata", x, y);
        fuegos.push(`${usar("llamaA", x, y - 2, ` class="cr-fuegoA f${fase}"`)}${usar("llamaB", x, y - 2, ` class="cr-fuegoB f${fase}" opacity="0"`)}`
            + `<path class="cr-humo f${fase}" fill="rgba(160,160,170,.45)" d="M${n1(x)} ${n1(y - 9)}h1v1h-1zM${n1(x + 1)} ${n1(y - 12)}h1v1h-1z"/>`
            + (momento !== "dia" ? `<circle cx="${n1(x)}" cy="${n1(y - 3)}" r="${noche ? 20 : 13}" fill="url(#${p}calor)"/>` : ""));
    };

    // 1) El río: cruza el terreno (su forma depende del lugar donde empezaste; está en metros). El camino lo cruza con puentes.
    const semilla = azar(Math.round(lista[0][0] * 1000), Math.round(lista[0][1] * 1000));
    const vertical = semilla > 0.5;
    const base = (semilla * 7) % 1 < 0.5 ? -(70 + ((semilla * 13) % 1) * 150) : 70 + ((semilla * 13) % 1) * 150;   // a 70–220 m de la salida
    const curva = (t) => base + Math.sin(t / 60 + semilla * 6) * 30 + Math.sin(t / 23) * 8;   // metros
    const alRio = (mx, my) => Math.abs(vertical ? mx - curva(my) : my - curva(mx)) * escala;   // distancia al centro del río, en puntos
    const grosor = Math.max(10, 16 * escala);

    // 2) El relieve y las construcciones grandes: uno (o ninguno) por cada «parcela» de 5 × 5 casillas.
    const paso = CASILLA / escala;   // cuántos metros mide una casilla
    const [mx0, my0] = aMundo(0, 0);
    const [mx1, my1] = aMundo(ancho, alto);
    // Cada lugar de salida tiene su propio paisaje: la cuadrícula del paisaje se corre unos metros según la semilla del lugar
    // (siempre los mismos para el mismo lugar: tu ruta de siempre se ve siempre igual).
    const [ox, oy] = [Math.floor(semilla * 9973) * 40, Math.floor(((semilla * 7) % 1) * 9973) * 40];
    const relieve = [];
    const ocupado = [];   // cajas donde ya hay algo grande: ahí no van árboles
    const libre = (x, y) => !ocupado.some((c) => x > c[0] && x < c[2] && y > c[1] && y < c[3]);
    const P = 5;
    for (let gj = Math.floor((my0 + oy) / paso / P) - 1; gj <= Math.floor((my1 + oy) / paso / P) + 1; gj++) {
        for (let gi = Math.floor((mx0 + ox) / paso / P) - 1; gi <= Math.floor((mx1 + ox) / paso / P) + 1; gi++) {
            const mx = (gi * P + 1 + azar(gi, gj, 51) * (P - 2)) * paso - ox;
            const my = (gj * P + 1 + azar(gi, gj, 52) * (P - 2)) * paso - oy;
            const [x, y] = metrosAPantalla(mx, my).map(Math.round);
            if (!visible(x, y, 50)) continue;
            const r = azar(gi, gj, 50);
            const lugar = cerca(x, y);
            const zona = zonaDe(lugar.k, azar(gi, gj, 53)).id;
            const tipo = rasgoDe(zona, r);
            if (!tipo) continue;
            const medidas = MEDIDAS[tipo];
            const w = medidas.w[0] + azar(gi, gj, 54) * (medidas.w[1] - medidas.w[0]);
            const h = medidas.h[0] + azar(gi, gj, 55) * (medidas.h[1] - medidas.h[0]);
            // Lejos del camino y del río (se mide desde el centro de lo que se dibuja).
            const centro = cerca(x, y - h / 2);
            if (centro.distancia < Math.max(w, h) / 2 + 10 || alRio(mx, my) < grosor / 2 + w / 2 + 4) continue;
            ocupado.push([x - w / 2 - 4, y - h - 2, x + w / 2 + 4, y + 6]);
            const ra = azar(gi, gj, 56);
            const pal = PALETAS[zona].colina;
            if (tipo === "colina" || tipo === "duna") relieve.push(piezas.relieveSvg(piezas.colina(x, y, w, h, pal, ra)));
            else if (tipo === "montana") {
                // Una cordillera: un pico chico atrás y uno grande adelante.
                const piedra = zona === "volcan" ? piezas.PIEDRAS.obsidiana : piezas.PIEDRAS.gris;
                const colores = [piedra.d, piedra.m, piedra.l, piedra.b];
                const nieve = zona === "volcan" ? null : ["#a8b6c8", "#e8eef6"];
                relieve.push(piezas.relieveSvg(piezas.montana(Math.round(x - w * 0.28), y - 2, w * 0.6, h * 0.62, colores, nieve, 1 - ra))
                    + piezas.relieveSvg(piezas.montana(x, y, w, h, colores, nieve, ra)));
            } else if (tipo === "volcan") {
                const piedra = piezas.PIEDRAS.obsidiana;
                const v = piezas.volcan(x, y, w, h, [piedra.d, piedra.m, piedra.l, piedra.b], ra);
                relieve.push(piezas.relieveSvg(v.lista));
                for (const c of v.lava) lava.cuadro(...c);
            } else if (tipo === "aldea") {
                const casa = `casa-${zona}`;
                poner(casa, x, y);
                if (ra < 0.8) poner(casa, x - 15, y - 7);
                if (ra > 0.35) poner(casa, x + 14, y - 4);
                if (ra > 0.6 && momento !== "dia") fogata(x + 2, y + 9, Math.floor(ra * 4));
            } else if (tipo === "torre") {
                poner(`torre-${zona}`, x, y);
                if (ra > 0.5) poner(`roca-${zona}`, x + 9, y + 3);
            } else if (tipo === "campamento") {
                poner(`tienda-${zona}`, x - 6, y);
                if (ra > 0.4) poner(`tienda-${zona}`, x + 9, y - 5);
                fogata(x + 3, y + 8, Math.floor(ra * 4));
            } else if (tipo === "ruinas") {
                poner(`ruina-${zona}`, x, y);
                if (ra > 0.4) poner(`ruina-${zona}`, x + 13, y + 5);
                poner(`roca-${zona}`, x - 10, y + 4);
            } else if (tipo === "choza") {
                poner(`choza-${zona}`, x, y);
                poner(`juncos-${zona}`, x + 10, y + 3);
            }
        }
    }

    // 3) Lo que hay en cada casilla (y, después, el suelo).
    const casillas = new Map();
    const llave = (i, j) => i * 1e6 + j;   // un número por casilla (más rápido que un texto como «12,5»)
    const detalle = nuevoPintor();
    const agua = [];
    const lagos = [];
    for (let wj = Math.floor((my0 + oy) / paso); wj * paso - oy < my1; wj++) {
        for (let wi = Math.floor((mx0 + ox) / paso); wi * paso - ox < mx1; wi++) {
            // Las casillas caen en puntos enteros (así sus números son cortos y los cuadritos no dejan rendijas).
            const [x, y] = metrosAPantalla(wi * paso - ox, wj * paso - oy).map(Math.round);
            const cx = x + CASILLA / 2;
            const cy = y + CASILLA / 2;
            const { k, distancia } = cerca(cx, cy);
            const zona = zonaDe(k, azar(wi, wj, 8));
            const z = zona.id;
            casillas.set(llave(wi, wj), { x, y, wi, wj, k });
            const densidad = suave(wi / 4, wj / 4, 30) + (DENSIDAD[z] || 0);
            detallesDelSuelo(detalle, efectos, lava, z, x, y, wi, wj, densidad, distancia, momento);
            if (distancia < CASILLA * 1.1) continue;                      // el camino queda libre
            if (alRio((wi + 0.5) * paso - ox, (wj + 0.5) * paso - oy) < grosor / 2 + 7) continue;   // el río también
            if (!libre(cx, cy)) continue;                                  // ahí hay una montaña, una aldea…
            const r = azar(wi, wj);
            const j = (m) => azar(wi, wj, m) - 0.5;
            const fase = Math.floor(azar(wi, wj, 61) * 4);
            if (azar(wi * 7 + 3, wj * 13 + 5, 77) < 0.014 && distancia > CASILLA * 2.2 && densidad < 0.62
                && alRio((wi + 0.5) * paso - ox, (wj + 0.5) * paso - oy) > grosor / 2 + 26 && !lagos.some(([lx, ly]) => Math.hypot(lx - cx, ly - cy) < 48)) {
                // Un lago (con lo que tenga alrededor según la zona), lejos de otros lagos.
                lagos.push([cx, cy]);
                const tam = 1.1 + azar(wj, wi) * 0.7;
                const tipoAgua = piezas.aguaDeZona(z);
                agua.push(lago(cx, cy, tam, tipoAgua, efectos, lava, fase));
                if (z === "desierto") poner("palmera-desierto", cx + 9 * tam, cy - 2, fase);
                if (z === "pantano") poner("juncos-pantano", cx - 8 * tam, cy + 3);
            } else if (distancia < CASILLA * 2.1 && azar(wi, wj, 40) < 0.09) {
                // Junto al camino: un cofre, una fogata, una ruina… (solo decoran: no dan nada).
                const cosa = JUNTO_AL_CAMINO[z][Math.floor(azar(wi, wj, 41) * 4)];
                if (cosa === "fogata") fogata(cx + j(1) * 6, cy + j(2) * 6, fase);
                else poner(`${cosa}-${z}`, cx + j(1) * 6, cy + j(2) * 6);
            } else if (densidad > 0.6) {
                // Bosquecillo: dos árboles (más grandes en el centro del bosque).
                const arboles = ARBOLES[z];
                const grande = densidad > 0.7 ? 2 : 1;
                poner(`${arboles[grande]}-${z}`, cx - 4 + j(1) * 4, cy - 2 + j(2) * 4, fase);
                if (azar(wi, wj, 3) < 0.6) poner(`${arboles[azar(wi, wj, 4) < 0.5 ? grande - 1 : grande]}-${z}`, cx + 4 + j(5) * 4, cy + 5 + j(6) * 3, (fase + 1) % 4);
            } else if (densidad > 0.47) {
                // Borde del bosque: árboles sueltos.
                if (r < 0.45) poner(`${ARBOLES[z][r < 0.2 ? 1 : 0]}-${z}`, cx + j(1) * 8, cy + j(2) * 8, fase);
            } else if (r < 0.17) {
                // Claro: una cosa suelta (arbusto, roca, tronco caído, hongos…).
                const tirada = azar(wi, wj, 6);
                const cosa = SUELTOS[z].find(([, hasta]) => tirada < hasta)[0];
                poner(`${cosa}-${z}`, cx + j(1) * 8, cy + j(2) * 8, fase);
            }
        }
    }
    // El suelo, en cuadritos de 8 × 8 fijos al terreno, con manchas de 4 tonos (tonoDelSuelo). Donde cambia la zona, los colores
    // se MEZCLAN: cerca del cambio de km (franja de ~32 puntos) y en el borde con las casillas vecinas. Así no hay cortes secos.
    const filasDelSuelo = new Map();
    for (const casilla of casillas.values()) casilla.mezcla = mezclaDe(casilla.k);
    for (const casilla of casillas.values()) {
        const { x, y, wi, wj, mezcla } = casilla;
        for (const b of [0, 1]) {
            const clave = wj * 2 + b;
            if (!filasDelSuelo.has(clave)) filasDelSuelo.set(clave, { y: y + b * 8, celdas: [] });
            for (const a of [0, 1]) {
                const ci = wi * 2 + a;
                const cj = wj * 2 + b;
                const tono = tonoDelSuelo(ci, cj);
                // La casilla pesa 1; sus vecinas hacia este cuadrito (a un lado y arriba o abajo), 0,4 cada una.
                const vecinas = [casillas.get(llave(wi + (a ? 1 : -1), wj)), casillas.get(llave(wi, wj + (b ? 1 : -1)))].filter(Boolean);
                const unaSola = mezcla.length === 1 && vecinas.every((v) => v.mezcla.length === 1 && v.mezcla[0][0] === mezcla[0][0]);
                let color;
                if (unaSola) color = PALETAS[mezcla[0][0]].suelo[tono];   // lo más común: todo es de la misma zona
                else {
                    const ruido = (azar(ci, cj, 9) - 0.5) * 0.3;
                    const pesos = new Map();
                    const sumar = (c, peso) => {
                        for (const [id, parte] of c.mezcla.length > 1 ? mezclaDe(c.k, ruido) : c.mezcla) pesos.set(id, (pesos.get(id) || 0) + parte * peso);
                    };
                    sumar(casilla, 1);
                    for (const v of vecinas) sumar(v, 0.4);
                    // Se mezclan solo las dos zonas que más pesan, en tercios: así hay pocos colores distintos (y el SVG pesa menos).
                    const dos = [...pesos].sort((p1, p2) => p2[1] - p1[1]).slice(0, 2);
                    const total = dos.reduce((s, [, v]) => s + v, 0);
                    const lista = dos.map(([id, peso]) => [PALETAS[id].suelo[tono], Math.round((peso / total) * 3)]).filter(([, peso]) => peso > 0);
                    color = mezclarColores(lista);
                }
                filasDelSuelo.get(clave).celdas.push({ x: x + a * 8, color });
            }
        }
    }
    // Las filas del suelo: los cuadritos seguidos del mismo color se juntan en un solo rectángulo.
    const suelo = nuevoPintor();
    for (const { y, celdas } of [...filasDelSuelo.values()].sort((f1, f2) => f1.y - f2.y)) {
        let i = 0;
        while (i < celdas.length) {
            let j = i;
            while (j + 1 < celdas.length && celdas[j + 1].color === celdas[i].color) j++;
            suelo.cuadro(celdas[i].x, y, (j - i + 1) * 8, 8, celdas[i].color);
            i = j + 1;
        }
    }

    // 4) El río, en tramos según la zona: agua azul, turbia en el pantano, hielo en las cumbres y lava en el abismo.
    const [desde, hasta] = vertical ? [my0 - 30, my1 + 30] : [mx0 - 30, mx1 + 30];
    const orilla = [];
    for (let t = desde; t <= hasta; t += Math.max(1, 4 / escala)) {
        const q = vertical ? metrosAPantalla(curva(t), t) : metrosAPantalla(t, curva(t));
        orilla.push({ q, agua: piezas.aguaDeZona(zonaDe(cerca(q[0], q[1]).k, 0.5).id) });
    }
    const tramosDelRio = [];
    orilla.forEach((o, i) => {
        const ultimo = tramosDelRio[tramosDelRio.length - 1];
        if (ultimo && ultimo.agua === o.agua) ultimo.puntos.push(o.q);
        else tramosDelRio.push({ agua: o.agua, puntos: ultimo ? [orilla[i - 1].q, o.q] : [o.q] });
    });
    const defsRio = [];
    const rioSvg = tramosDelRio.map(({ agua: tipo, puntos: pts }, i) => {
        const id = `${p}r${i}`;
        defsRio.push(`<path id="${id}" d="M${pts.map((q) => `${n1(q[0])} ${n1(q[1])}`).join(" ")}"/>`);
        const a = AGUAS[tipo];
        return `<use href="#${id}" stroke="rgba(0,0,0,.22)" stroke-width="${n1(grosor + 9)}"/><use href="#${id}" stroke="${a.orilla}" stroke-width="${n1(grosor + 3)}"/>`
            + `<use href="#${id}" stroke="${a.agua}" stroke-width="${n1(grosor)}"/><use href="#${id}" stroke="${a.medio}" stroke-width="${n1(grosor * 0.4)}" stroke-dasharray="16 7"/>`
            + `<use href="#${id}"${tipo === "hielo" ? "" : ' class="cr-corriente"'} stroke="${a.brillo}" stroke-width="1.2" stroke-dasharray="3 9"/>`;
    }).join("");

    // Los puentes: donde el camino cruza el río (el punto exacto sale de cuando el camino pasa de un lado al otro).
    const puentes = [];
    let antes = null;
    for (let i = 0; i < n; i++) {
        const m = enMetros[i];
        const lado = vertical ? m[0] - curva(m[1]) : m[1] - curva(m[0]);
        if (antes && Math.sign(lado) !== Math.sign(antes.lado) && lado !== 0) {
            const t = antes.lado / (antes.lado - lado);
            const [ax, ay] = puntos[i - 1];
            const q = [ax + (puntos[i][0] - ax) * t, ay + (puntos[i][1] - ay) * t];
            if (visible(q[0], q[1], 20)) puentes.push(puente(q, Math.abs(puntos[i][0] - ax) >= Math.abs(puntos[i][1] - ay), grosor));
        }
        antes = { lado };
    }

    // 5) El camino: solo los tramos que se ven. Pasto más claro a los lados, borde oscuro, tierra en dos tonos y, encima,
    //    bordes irregulares, manchas y piedritas (fijas al terreno: se reparten por los metros desde la salida).
    // Los puntos a menos de 2,5 puntos del lienzo del anterior se saltan (no se notan y ahorran texto).
    const trazo = (i0, i1) => {
        let d = "";
        let dentro = false;
        let ultimo = null;
        for (let i = i0; i <= i1; i++) {
            const ve = visible(puntos[i][0], puntos[i][1], 30) || (i > i0 && visible(puntos[i - 1][0], puntos[i - 1][1], 30))
                || (i < i1 && visible(puntos[i + 1][0], puntos[i + 1][1], 30));
            if (!ve) { dentro = false; continue; }
            if (dentro && i < i1 && Math.hypot(puntos[i][0] - ultimo[0], puntos[i][1] - ultimo[1]) < 2.5) continue;
            d += `${dentro ? " " : "M"}${n1(puntos[i][0])} ${n1(puntos[i][1])}`;
            dentro = true;
            ultimo = puntos[i];
        }
        return d;
    };
    const dCamino = trazo(0, n - 1);
    const marcas = nuevoPintor();
    const cada = 5 / escala;   // metros entre marca y marca
    let recorrido = 0;
    let siguiente = 0;
    for (let i = 1; i < n; i++) {
        const [ax, ay] = enMetros[i - 1];
        const largo = Math.hypot(enMetros[i][0] - ax, enMetros[i][1] - ay);
        while (largo > 0 && siguiente <= recorrido + largo) {
            const t = (siguiente - recorrido) / largo;
            const x = puntos[i - 1][0] + (puntos[i][0] - puntos[i - 1][0]) * t;
            const y = puntos[i - 1][1] + (puntos[i][1] - puntos[i - 1][1]) * t;
            if (visible(x, y, 8)) {
                const numero = Math.round(siguiente / cada);
                const k = kms[i - 1] + (kms[i] - kms[i - 1]) * t;
                marcaDelCamino(marcas, x, y, -(enMetros[i][1] - ay) / largo, (enMetros[i][0] - ax) / largo, numero, zonaDe(k, 0.5).id);
            }
            siguiente += cada;
        }
        recorrido += largo;
    }

    // (v144) Tu km más rápido (con al menos 2 km hechos) brilla en dorado.
    const lista2 = (parciales || []).filter((s) => Number.isFinite(s) && s > 0);
    const rapido = lista2.length > 1 ? lista2.indexOf(Math.min(...lista2)) + 1 : 0;
    const desdeRapido = anclas.find(([, k]) => k === rapido - 1);
    const hastaRapido = anclas.find(([, k]) => k === rapido);
    const dRapido = rapido && desdeRapido && hastaRapido ? trazo(desdeRapido[0], hastaRapido[0]) : "";
    if (dRapido) {
        // Unos destellos sobre el km dorado.
        for (let i = desdeRapido[0]; i <= hastaRapido[0]; i += Math.max(1, Math.round(6 / muestra))) {
            const [x, y] = puntos[i];
            if (visible(x, y) && azar(i, 3, 90) < 0.5) efectos.brillo[i % 4].cuadro(x - 0.5 + (azar(i, 4, 91) - 0.5) * 4, y - 0.5, 1, 1, "#fff2b0");
        }
    }

    // 6) Lo que va detrás de ti mientras corres: huellas, tu sombra y el camino que se ilumina a tu paso.
    const [ex, ey] = puntos[n - 1];
    let detrasDeTi = "";
    let rastro = "";
    if (vivo) {
        detrasDeTi = huellas(puntos) + `<path fill="rgba(0,0,0,.4)" d="M${n1(ex - 7)} ${n1(ey - 1)}h14v3h-14zM${n1(ex - 5)} ${n1(ey - 2)}h10v5h-10z"/>`;
        // Los últimos 150 m, en tres trozos que se apagan poco a poco.
        const cortes = [];
        let metros = 0;
        let i = n - 1;
        for (const limite of [50, 100, 150]) {
            const fin = i;
            while (i > 0 && metros < limite) {
                metros += Math.hypot(enMetros[i][0] - enMetros[i - 1][0], enMetros[i][1] - enMetros[i - 1][1]);
                i--;
            }
            if (i < fin) cortes.push([i, fin]);
        }
        rastro = cortes.map(([a, b], c) => `<path d="${trazo(a, b)}" stroke="#ffe9a8" stroke-opacity="${[0.7, 0.42, 0.2][c]}" stroke-width="2"/>`).join("");
    }

    // 7) Los mojones de cada km: verde si venciste a su criatura, gris si escapó, morado si era un jefe vencido.
    const hitos = mojones.map((b, k) => {
        const [x, y] = aPantalla(b);
        if (!visible(x, y, 14)) return "";
        const pelea = (encuentros || []).find((e) => e.km === k + 1);
        const color = !pelea?.resultado ? "#fbbf24" : pelea.resultado === "vencida" ? (pelea.jefe ? "#c084fc" : "#4ade80") : "#8a8a96";
        return piezas.mojon(x, y, k + 1, color, momento);
    }).join("");

    // 8) (v131) Hacia dónde vas: una flechita delante de ti (con la dirección de los últimos ~15 m).
    // (v146) Esa dirección (el rumbo) también se devuelve: la criatura del km se pone delante de ti, hacia donde corres.
    let flechaSvg = "";
    let rumbo = null;
    if (n > 1) {
        const fin = enMetros[n - 1];
        let atras = n - 2;
        while (atras > 0 && Math.hypot(fin[0] - enMetros[atras][0], fin[1] - enMetros[atras][1]) < 15) atras -= 1;
        const dx = fin[0] - enMetros[atras][0];
        const dy = fin[1] - enMetros[atras][1];
        const largo = Math.hypot(dx, dy);
        if (largo > 3) {
            const [ux, uy] = [dx / largo, dy / largo];   // en metros y en el dibujo es la misma dirección (la escala es igual en x y en y)
            rumbo = { x: ux, y: uy };
            const punta = [ex + ux * 26, ey + uy * 26];   // una flecha alargada (punta lejos, base angosta) para que se note hacia dónde apunta
            const [b1, b2] = [[ex + ux * 12 - uy * 4, ey + uy * 12 + ux * 4], [ex + ux * 12 + uy * 4, ey + uy * 12 - ux * 4]];
            if (flecha) flechaSvg = `<polygon points="${r1(punta[0])},${r1(punta[1])} ${r1(b1[0])},${r1(b1[1])} ${r1(b2[0])},${r1(b2[1])}" fill="#fbbf24" stroke="#1a1222" stroke-width="1.2"/>`;
        }
    }

    // 9) Pájaros que cruzan el cielo de vez en cuando (de noche, murciélagos). Cada vuelo dura 12 s de un ciclo de 24 s.
    const ciclo = Math.floor((Number(reloj) || 0) / (CICLO * 1000));
    let aves = "";
    if (azar(ciclo, 1, 70) < 0.5) {
        const y = 30 + azar(ciclo, 2, 71) * (alto - 80);
        const derecha = azar(ciclo, 3, 72) < 0.5;
        const color = noche ? "#0e0a14" : "#1c1a24";
        const bandada = [[0, 0], [-9, -5], [-8, 6]].slice(0, 2 + Math.floor(azar(ciclo, 4, 73) * 2));
        // Cada pájaro: el cuerpo y dos alas de 2 puntos (arriba en un cuadro, abajo en el otro).
        const alas = (arriba) => bandada.map(([bx, by]) => `M${bx - 3} ${by + (arriba ? -1 : 1)}h2v1h-2zM${bx + 2} ${by + (arriba ? -1 : 1)}h2v1h-2zM${bx - 1} ${by}h3v1h-3z`).join("");
        aves = `<g transform="translate(${derecha ? -30 : ancho + 30} ${n1(y)})${derecha ? "" : " scale(-1 1)"}"><g class="cr-vuelo">`
            + `<path class="cr-alaA" fill="${color}" d="${alas(true)}"/><path class="cr-alaB" fill="${color}" opacity="0" d="${alas(false)}"/></g></g>`;
    }

    // 10) La luz de la hora del día (una capa encima de todo el paisaje) y lo que brilla encima de ella.
    const luz = capaDeLuz(momento, p, vivo ? ex : ancho / 2, vivo ? ey : alto / 2);
    const conClase = (lista3, clase) => lista3.map((pintor, f) => (pintor.vacio() ? "" : pintor.svg().replace(/<path /g, `<path class="${clase} f${f}" `))).join("");
    const definiciones = [...defs.values()].map((pz) => `<g id="${pz.id}">${pz.base}</g>${pz.copa ? `<g id="${pz.id}-c">${pz.copa}</g>` : ""}`).join("");
    objetos.sort((a, b) => a.y - b.y);
    const [sx, sy] = puntos[0];
    const svg = `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Mapa de tu carrera" data-momento="${momento}" style="${fases(reloj)}">
        <defs><path id="${p}cam" d="${dCamino}"/>${dRapido ? `<path id="${p}rap" d="${dRapido}"/>` : ""}${defsRio.join("")}${definiciones}${luz.defs}
            <radialGradient id="${p}calor"><stop offset="0" stop-color="#ffb050" stop-opacity=".5"/><stop offset="1" stop-color="#ffb050" stop-opacity="0"/></radialGradient></defs>
        <rect width="${ancho}" height="${alto}" fill="${PALETAS[zonaFinal.id].suelo[1]}"/>${suelo.svg()}${detalle.svg()}${conClase(efectos.pasto, "cr-mece")}${relieve.join("")}
        <g fill="none" stroke-linejoin="round">${rioSvg}</g>${agua.join("")}
        <g fill="none" stroke-linejoin="round" stroke-linecap="round">
            <use href="#${p}cam" stroke="#e8f0c0" stroke-opacity=".07" stroke-width="26"/>
            ${dRapido ? `<use href="#${p}rap" class="cr-rapido" stroke="#fbbf24" stroke-opacity=".3" stroke-width="15"/>` : ""}
            <use href="#${p}cam" stroke="#2a1d12" stroke-width="9"/><use href="#${p}cam" stroke="#9a7a4c" stroke-width="6.5"/><use href="#${p}cam" stroke="#b39065" stroke-width="3"/>
        </g>${marcas.svg()}${puentes.join("")}
        ${objetos.map((o) => o.svg).join("")}
        ${conClase(efectos.niebla, "cr-niebla")}${conClase(efectos.copo, "cr-copo")}${conClase(efectos.mariposa, "cr-mariposa")}${detrasDeTi}${aves}
        ${luz.svg}
        ${halos.svg()}${luces.svg()}${lava.svg({ "#ff7a2a": "cr-lava", "#e0502a": "cr-lava", "#c8401a": "cr-lava" })}${fuegos.join("")}
        ${conClase(efectos.brillo, "cr-brillo")}${conClase(efectos.brasa, "cr-brasa")}${conClase(efectos.luciernaga, "cr-luciernaga")}
        <g fill="none" stroke-linejoin="round" stroke-linecap="round">${rastro}${dRapido ? `<use href="#${p}rap" stroke="#ffd76a" stroke-width="1.4" stroke-dasharray="2 2"/>` : ""}</g>
        ${hitos}
        <rect x="${r1(sx - 4)}" y="${r1(sy - 4)}" width="8" height="8" fill="#4ade80" stroke="#0b0816" stroke-width="1.2"/>
        ${flechaSvg}${vivo ? "" : `<rect x="${r1(ex - 3)}" y="${r1(ey - 3)}" width="6" height="6" fill="#f87171" stroke="#0b0816" stroke-width="1.2"/>`}</svg>`;
    return { svg, aqui: { x: (ex / ancho) * 100, y: (ey / alto) * 100 }, rumbo, zona: zonaFinal };
}

// ===== (v144) Las reglas del paisaje por zona =====
// Árboles de cada zona: [chico, mediano, grande] (los grandes van al centro de los bosquecillos).
const ARBOLES = {
    pradera: ["hojaS", "hojaM", "hojaG"],
    bosque: ["pinoS", "pinoM", "pinoG"],
    pantano: ["hojaS", "hojaM", "muerto"],
    desierto: ["cactusS", "cactusG", "cactusG"],
    nieve: ["pinoS", "pinoM", "pinoG"],
    volcan: ["roca", "muerto", "muerto"],
};
// Cosas sueltas de los claros: [pieza, hasta qué tirada (0–1)].
const SUELTOS = {
    pradera: [["arbusto", 0.35], ["roca", 0.55], ["tronco", 0.68], ["hongos", 0.8], ["hojaS", 1]],
    bosque: [["arbusto", 0.3], ["tronco", 0.5], ["hongos", 0.7], ["roca", 0.85], ["hojaM", 1]],
    pantano: [["juncos", 0.4], ["tronco", 0.55], ["hongos", 0.7], ["arbusto", 0.85], ["muerto", 1]],
    desierto: [["roca", 0.35], ["matorral", 0.6], ["calavera", 0.72], ["cactusS", 1]],
    nieve: [["roca", 0.45], ["arbusto", 0.7], ["tronco", 0.85], ["pinoS", 1]],
    volcan: [["roca", 0.55], ["muerto", 0.85], ["calavera", 1]],
};
// Lo que puede haber junto al camino (solo decora).
const JUNTO_AL_CAMINO = {
    pradera: ["cofre", "fogata", "ruina", "roca"],
    bosque: ["cofre", "fogata", "tronco", "ruina"],
    pantano: ["cofre", "juncos", "fogata", "ruina"],
    desierto: ["cofre", "ruina", "calavera", "fogata"],
    nieve: ["cofre", "fogata", "roca", "ruina"],
    volcan: ["cofre", "ruina", "roca", "calavera"],
};
// Cuánto bosque hay en cada zona (se suma al azar suave).
const DENSIDAD = { pradera: 0, bosque: 0.12, pantano: -0.04, desierto: -0.26, nieve: 0, volcan: -0.18 };

// Lo grande de cada parcela según la zona: [tipo, hasta qué tirada].
const RASGOS = {
    pradera: [["colina", 0.42], ["aldea", 0.55], ["torre", 0.61], ["montana", 0.66]],
    bosque: [["colina", 0.32], ["torre", 0.42], ["aldea", 0.48], ["montana", 0.54]],
    pantano: [["choza", 0.2], ["ruinas", 0.32], ["colina", 0.44]],
    desierto: [["duna", 0.5], ["ruinas", 0.64], ["campamento", 0.74]],
    nieve: [["montana", 0.5], ["torre", 0.6], ["aldea", 0.68]],
    volcan: [["volcan", 0.3], ["montana", 0.5], ["ruinas", 0.64], ["torre", 0.7]],
};
const rasgoDe = (zona, r) => (RASGOS[zona] || []).find(([, hasta]) => r < hasta)?.[0] || null;
// Lo que mide cada cosa grande (de … a …), en puntos del lienzo.
const MEDIDAS = {
    colina: { w: [36, 58], h: [12, 20] }, duna: { w: [40, 60], h: [10, 14] },
    montana: { w: [46, 68], h: [36, 52] }, volcan: { w: [46, 62], h: [32, 44] },
    aldea: { w: [40, 44], h: [20, 24] }, torre: { w: [14, 16], h: [26, 28] }, campamento: { w: [28, 30], h: [14, 16] },
    ruinas: { w: [28, 32], h: [16, 18] }, choza: { w: [22, 24], h: [16, 18] },
};

// El tono (0–3) del cuadrito (ci, cj) del suelo: manchas grandes y suaves, otras más chicas y un poco de azar.
function tonoDelSuelo(ci, cj) {
    const v = 0.68 * suave(ci / 8, cj / 8, 21) + 0.32 * suave(ci / 3, cj / 3, 22);
    return v < 0.38 ? 0 : v < 0.5 ? 1 : v < 0.62 ? 2 : 3;
}

// Los detalles chicos del suelo de una casilla (matas, flores, piedritas, ondas de arena, grietas de lava…) y los efectos de
// la zona (niebla, nieve, brasas, luciérnagas, mariposas). Van fijos al terreno, como todo el paisaje.
function detallesDelSuelo(detalle, efectos, lava, z, x, y, wi, wj, densidad, distancia, momento) {
    const [oscuro, claro] = PALETAS[z].pasto;
    const r = (m) => azar(wi, wj, 100 + m);
    const px = (m) => x + 2 + Math.floor(r(m) * 12);
    const py = (m) => y + 2 + Math.floor(r(m + 50) * 12);
    const verde = z === "pradera" || z === "bosque" || z === "pantano";
    for (let m = 0; m < 2; m++) {
        if (r(m) > (m ? 0.25 : 0.65)) continue;
        const [a, b] = [px(m + 2), py(m + 2)];
        if (verde) {
            // Una mata de pasto alto (algunas se mecen con el viento).
            const pintor = r(m + 4) < 0.35 && distancia > CASILLA ? efectos.pasto[Math.floor(r(m + 6) * 4)] : detalle;
            pintor.cuadro(a, b, 1, 3, oscuro);
            pintor.cuadro(a + 1, b + 1, 1, 1, claro);
        } else if (z === "desierto") {
            detalle.cuadro(a, b, 4, 1, claro);
            detalle.cuadro(a + 1, b + 1, 3, 1, oscuro);
        } else if (z === "nieve") {
            detalle.cuadro(a, b, 3, 1, oscuro);
            detalle.cuadro(a + 1, b - 1, 1, 1, claro);
        } else {
            detalle.cuadro(a, b, 2, 1, claro);
            if (r(m + 8) < 0.12) { lava.cuadro(a + 3, b + 2, 3, 1, "#c8401a"); lava.cuadro(a + 5, b + 3, 1, 2, "#e0502a"); }
        }
    }
    if (r(10) < 0.2) detalle.cuadro(px(11), py(11), 1, 1, z === "volcan" ? "#5a4a52" : "#6a6670");   // una piedrita
    // Flores en los claros de la pradera (y alguna en el bosque y el pantano).
    if (verde && densidad < 0.45 && r(12) < (z === "pradera" ? 0.4 : 0.12) && distancia > CASILLA * 0.8) {
        const colores = { pradera: ["#cdb85a", "#a8586e", "#cfd3df", "#7c6cae"], bosque: ["#8a7aa8", "#c8c0a0"], pantano: ["#8a9a5a", "#c8c0a0"] }[z];
        const color = colores[Math.floor(r(13) * colores.length)];
        const [a, b] = [px(14), py(14)];
        for (const [fx, fy] of [[0, 0], [2, 1], [-1, 2], [3, -1]].slice(0, 2 + Math.floor(r(15) * 3))) {
            detalle.cuadro(a + fx, b + fy + 1, 1, 1, oscuro);
            detalle.cuadro(a + fx, b + fy, 1, 1, color);
        }
    }
    // Los efectos de cada zona y hora (cada uno en uno de los 4 grupos de fase).
    const f = Math.floor(r(20) * 4);
    if ((z === "pantano" && r(21) < 0.18) || (momento === "amanecer" && verde && r(21) < 0.1)) {
        const [a, b] = [x + Math.floor(r(22) * 6) - 4, y + Math.floor(r(23) * 12)];
        efectos.niebla[f].cuadro(a, b, 22, 3, "rgba(206,218,212,.16)");
        efectos.niebla[f].cuadro(a + 5, b - 2, 12, 2, "rgba(206,218,212,.16)");
    }
    if (z === "nieve" && r(24) < 0.55) efectos.copo[f].cuadro(px(25), py(25), 1, 1, "#ffffff");
    if (z === "nieve" && r(26) < 0.25) efectos.copo[(f + 2) % 4].cuadro(px(27), py(27), 1, 1, "#eef3fa");
    if ((z === "volcan" && r(28) < 0.22) || (z === "desierto" && r(28) < 0.07)) efectos.brasa[f].cuadro(px(29), py(29), 1, 1, r(30) < 0.5 ? "#ff8a2a" : "#ffc04a");
    if (momento === "noche" && verde && r(31) < 0.12) efectos.luciernaga[f].cuadro(px(32), py(32), 1, 1, "#d8f070");
    if (momento !== "noche" && z === "pradera" && densidad < 0.5 && r(33) < 0.05) {
        const [a, b] = [px(34), py(34)];
        efectos.mariposa[f].cuadro(a, b, 1, 1, r(35) < 0.5 ? "#e8dcc0" : "#d8b860");
        efectos.mariposa[f].cuadro(a + 2, b, 1, 1, r(35) < 0.5 ? "#e8dcc0" : "#d8b860");
    }
}

// Una marca sobre el camino (nx, ny: hacia el costado): tierra que se sale, pasto que entra, manchas y piedritas.
function marcaDelCamino(marcas, x, y, nx, ny, numero, z) {
    const r = azar(numero, 7, 31);
    const lado = azar(numero, 7, 32) < 0.5 ? -1 : 1;
    const en = (d) => [x + nx * d * lado, y + ny * d * lado];
    if (r < 0.28) { const [a, b] = en(4.2); marcas.cuadro(a - 1, b - 1, 2, 2, "#9a7a4c"); }
    else if (r < 0.42) { const [a, b] = en(3.6); marcas.cuadro(a - 1, b - 0.5, 2, 1.5, "#2a1d12"); }
    else if (r < 0.56) { const [a, b] = en(1.2); marcas.cuadro(a - 1, b - 0.5, 2, 1, "#7d5f3a"); }
    else if (r < 0.66) { const [a, b] = en(1.6); marcas.cuadro(a - 0.5, b - 0.5, 1, 1, "#6e6a70"); }
    else if (r < 0.74) {
        // Algo de la zona sobre el camino: nieve, charcos, ceniza o arena.
        const [a, b] = en(0.8);
        const color = { nieve: "#e2e9f2", pantano: "#2c4a52", volcan: "#4a3a40", desierto: "#c4a46e" }[z];
        if (color) marcas.cuadro(a - 1.5, b - 0.5, 3, 1, color);
    }
}

// Un lago (normal, turbio, helado o de lava) hecho con cuadritos, con un brillo que parpadea.
function lago(x, y, tam, tipo, efectos, lava, fase) {
    const a = AGUAS[tipo];
    [x, y] = [Math.round(x), Math.round(y)];
    const w = Math.round(20 * tam);
    const h = Math.round(11 * tam);
    const lista = [];
    // Un óvalo de cuadritos: una fila de 1 punto por vez, cada una del ancho que le toca.
    const ovalo = (ow, oh, color, dy = 0) => {
        for (let f = 0; f < oh; f++) {
            const t = ((f + 0.5) / oh) * 2 - 1;
            const media = Math.round((ow / 2) * Math.sqrt(1 - t * t));
            if (media > 0) lista.push([x - media, Math.round(y - oh / 2) + f + dy, media * 2, 1, color]);
        }
    };
    ovalo(w + 5, h + 3, "rgba(0,0,0,.2)", 1);   // la orilla mojada (sombra)
    ovalo(w + 2, h + 2, a.orilla);
    ovalo(w, h, a.agua);
    // Agua bajita (más clara) arriba a la izquierda, y unas rayas de luz.
    for (let f = 1; f < Math.round(h * 0.4); f++) lista.push([x - Math.round(w * 0.4) + f, Math.round(y - h / 2) + f, Math.round(w * 0.3), 1, a.medio]);
    lista.push([x - Math.round(w / 5), y + 1, Math.round(w / 3), 1, a.brillo], [x + Math.round(w / 6), y + 3, Math.round(w / 6), 1, a.medio]);
    if (tipo === "hielo") lista.push([x - 5, y - 2, 4, 1, a.orilla], [x - 2, y - 1, 1, 2, a.orilla], [x + 3, y + 1, 5, 1, a.orilla]);
    if (tipo === "lava") {
        lava.cuadro(x - 4, y - 2, 4, 1, "#ff7a2a");
        lava.cuadro(x + 2, y, 3, 1, "#ff7a2a");
        lava.cuadro(x - 1, y + 2, 2, 1, "#e0502a");
    }
    if (tipo === "normal" || tipo === "turbia") lista.push([x + Math.round(w / 4), y - 2, 3, 2, "#2f5a2e"], [x + Math.round(w / 4) + 1, y - 2, 1, 1, "#6a9a4a"]);   // un nenúfar
    if (tipo !== "lava") {
        efectos.brillo[fase].cuadro(x + 3, y - 2, 2, 1, "#e6f4ff");
        efectos.brillo[(fase + 2) % 4].cuadro(x - 5, y + 2, 1, 1, "#e6f4ff");
    }
    return cuadros(lista);
}

// Un puente de madera sobre el río, a lo largo del camino (horizontal o vertical).
function puente([x, y], horizontal, grosor) {
    const largo = grosor + 12;
    const anchoP = 10;
    const [w, h] = horizontal ? [largo, anchoP] : [anchoP, largo];
    const [x0, y0] = [x - w / 2, y - h / 2];
    const lista = [[x0 + 1, y0 + h, w - 2, 2, "rgba(0,0,0,.35)"], [x0, y0, w, h, "#7a5030"]];
    // Las rendijas entre tablones (cruzadas al camino) y un poco de luz en los tablones.
    for (let i = 2; i < (horizontal ? w : h) - 1; i += 2.5) lista.push(horizontal ? [x0 + i, y0 + 1, 0.8, h - 2, "#4a2e18"] : [x0 + 1, y0 + i, w - 2, 0.8, "#4a2e18"]);
    lista.push(horizontal ? [x0, y0 + 1, w, 1, "#946640"] : [x0 + 1, y0, 1, h, "#946640"]);
    // Barandas y postes.
    if (horizontal) lista.push([x0, y0 - 1, w, 2, "#3a2414"], [x0, y0 + h - 1, w, 2, "#3a2414"], [x0 - 1, y0 - 2, 2, 3, "#22140a"], [x0 + w - 1, y0 - 2, 2, 3, "#22140a"], [x0 - 1, y0 + h - 1, 2, 3, "#22140a"], [x0 + w - 1, y0 + h - 1, 2, 3, "#22140a"]);
    else lista.push([x0 - 1, y0, 2, h, "#3a2414"], [x0 + w - 1, y0, 2, h, "#3a2414"], [x0 - 2, y0 - 1, 3, 2, "#22140a"], [x0 + w - 1, y0 - 1, 3, 2, "#22140a"], [x0 - 2, y0 + h - 1, 3, 2, "#22140a"], [x0 + w - 1, y0 + h - 1, 3, 2, "#22140a"]);
    return cuadros(lista);
}

// Tus huellas: en los últimos ~34 puntos del camino, una a cada lado, cada vez más tenues.
function huellas(puntos) {
    const niveles = [nuevoPintor(), nuevoPintor(), nuevoPintor()];
    let andado = 0;
    let siguiente = 2;
    let cuenta = 0;
    for (let i = puntos.length - 1; i > 0 && siguiente < 34; i--) {
        const [ax, ay] = puntos[i];
        const [bx, by] = puntos[i - 1];
        const largo = Math.hypot(bx - ax, by - ay);
        if (!largo) continue;
        const [ux, uy] = [(bx - ax) / largo, (by - ay) / largo];
        while (siguiente <= andado + largo && siguiente < 34) {
            const t = (siguiente - andado) / largo;
            const lado = cuenta % 2 ? 1 : -1;
            const [x, y] = [ax + (bx - ax) * t - uy * 1.3 * lado, ay + (by - ay) * t + ux * 1.3 * lado];
            niveles[Math.min(2, Math.floor(siguiente / 12))].cuadro(x - 0.7, y - 0.5, 1.4, 1, "#2a1d12");
            siguiente += 3.4;
            cuenta++;
        }
        andado += largo;
    }
    return niveles.map((pintor, i) => (pintor.vacio() ? "" : `<g opacity="${[0.7, 0.45, 0.22][i]}">${pintor.svg()}</g>`)).join("");
}

// La capa de luz de cada momento: tibia al amanecer (el sol sale por la derecha), naranja al atardecer y, de noche,
// oscuridad con un círculo de luz alrededor de tu héroe (cx, cy). De día no hace falta.
function capaDeLuz(momento, p, cx, cy) {
    const parada = (o, color, op) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${op}"/>`;
    const capa = `<rect width="${LIENZO.ancho}" height="${LIENZO.alto}" fill="url(#${p}luz)"/>`;
    if (momento === "amanecer") {
        return { defs: `<linearGradient id="${p}luz" x1="1" y1="0" x2="0" y2="1">${parada(0, "#ffb27a", 0.3)}${parada(0.5, "#e88a9a", 0.12)}${parada(1, "#4a3a8a", 0.24)}</linearGradient>`, svg: capa };
    }
    if (momento === "atardecer") {
        return { defs: `<linearGradient id="${p}luz" x1="0" y1="0" x2="1" y2="1">${parada(0, "#ff7a3a", 0.3)}${parada(0.45, "#c84a5a", 0.2)}${parada(1, "#24184a", 0.4)}</linearGradient>`, svg: capa };
    }
    if (momento === "noche") {
        return {
            defs: `<radialGradient id="${p}luz" gradientUnits="userSpaceOnUse" cx="${n1(cx)}" cy="${n1(cy)}" r="190">${parada(0, "#0a1030", 0.12)}${parada(0.3, "#0a1030", 0.42)}${parada(0.7, "#0a1030", 0.62)}${parada(1, "#0a1030", 0.72)}</radialGradient>`,
            svg: capa,
        };
    }
    return { defs: "", svg: "" };
}

// ===== (v131) La pista de atletismo =====
// En una pista el GPS dibuja círculos encimados; aquí se dibuja la pista de verdad (400 m en el carril 1: dos rectas de 84,39 m y
// dos curvas de 36,8 m de radio) y tu héroe va sobre ella según los metros que llevas en la vuelta. La salida está al inicio de la
// recta de abajo y se corre en sentido contrario a las agujas del reloj, como en cualquier pista.
const PISTA = { recta: 84.39, radio: 36.8, borde: 36.5, carril: 1.22, carriles: 6 };

// Dónde estás (en metros desde el centro de la pista) a `m` metros de la salida, en el carril 1.
export function puntoEnPista(m, largo = 400) {
    const { recta: L, radio: R } = PISTA;
    let p = ((m % largo) + largo) % largo;
    p *= (2 * L + 2 * Math.PI * R) / largo;   // por si la pista no mide exactamente 400 m
    if (p < L) return [-L / 2 + p, R];
    p -= L;
    if (p < Math.PI * R) { const t = Math.PI / 2 - p / R; return [L / 2 + R * Math.cos(t), R * Math.sin(t)]; }
    p -= Math.PI * R;
    if (p < L) return [L / 2 - p, -R];
    p -= L;
    const t = -Math.PI / 2 - p / R;
    return [-L / 2 + R * Math.cos(t), R * Math.sin(t)];
}

// opciones = { metros: lo corrido, largo: 400, vueltas: true }. Devuelve { svg, aqui, rumbo, zona: { nombre } } como mapaDeCarrera.
export function mapaDePista({ metros = 0, largo = 400 } = {}) {
    const { ancho, alto } = LIENZO;
    const { recta: L, borde, carril, carriles } = PISTA;
    const exterior = borde + carril * carriles;
    const s = Math.min((ancho - 36) / (L + 2 * exterior), (alto - 70) / (2 * exterior));
    const [cx, cy] = [ancho / 2, alto / 2 + 4];
    const aP = ([x, y]) => [cx + x * s, cy + y * s];
    // Un «estadio» (rectángulo con las puntas redondas) de radio r metros.
    const estadio = (r) => `M${r1(cx - (L / 2) * s)} ${r1(cy - r * s)} h${r1(L * s)} a${r1(r * s)} ${r1(r * s)} 0 0 1 0 ${r1(2 * r * s)} h${r1(-L * s)} a${r1(r * s)} ${r1(r * s)} 0 0 1 0 ${r1(-2 * r * s)} Z`;
    const lineas = Array.from({ length: carriles - 1 }, (_, i) => `<path d="${estadio(borde + carril * (i + 1))}" fill="none" stroke="#f4e6e0" stroke-width=".7" opacity=".7"/>`).join("");
    // Las gradas, arriba y abajo.
    const grada = (y, alto2) => Array.from({ length: 4 }, (_, i) => `<rect x="14" y="${r1(y + i * (alto2 / 4))}" width="${ancho - 28}" height="${r1(alto2 / 4 - 1)}" fill="${["#5a5266", "#6a6276", "#5a5266", "#4a4256"][i]}"/>`).join("")
        + Array.from({ length: 26 }, (_, i) => `<rect x="${18 + i * 11}" y="${r1(y + 2 + (i % 4) * (alto2 / 4))}" width="3" height="3" fill="${["#f87171", "#fbbf24", "#60a5fa", "#4ade80", "#eef2ff"][i % 5]}"/>`).join("");
    // El campo de fútbol del centro.
    const campoAncho = L * s * 0.95;
    const campoAlto = borde * 2 * s * 0.72;
    const campo = `<rect x="${r1(cx - campoAncho / 2)}" y="${r1(cy - campoAlto / 2)}" width="${r1(campoAncho)}" height="${r1(campoAlto)}" fill="none" stroke="#eef7e6" stroke-width="1"/>
        <line x1="${r1(cx)}" y1="${r1(cy - campoAlto / 2)}" x2="${r1(cx)}" y2="${r1(cy + campoAlto / 2)}" stroke="#eef7e6" stroke-width="1"/>
        <circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(campoAlto * 0.18)}" fill="none" stroke="#eef7e6" stroke-width="1"/>`;
    // La salida/meta: una franja blanca a lo ancho de los carriles.
    const [mx, my] = aP([-L / 2, borde]);
    const meta = `<rect x="${r1(mx - 1)}" y="${r1(my)}" width="2.5" height="${r1(carril * carriles * s)}" fill="#ffffff"/>`;
    // Lo que llevas de esta vuelta, en dorado sobre el carril 1.
    const enVuelta = metros % largo;
    const traza = [];
    for (let m = 0; m <= enVuelta; m += 4) traza.push(aP(puntoEnPista(m, largo)));
    traza.push(aP(puntoEnPista(enVuelta, largo)));
    const avance = traza.length > 1 ? `<polyline points="${traza.map((q) => `${r1(q[0])},${r1(q[1])}`).join(" ")}" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linejoin="round"/>` : "";
    const [ex, ey] = aP(puntoEnPista(metros, largo));
    // (v146) Hacia dónde corres: de aquí al punto de la pista 2 m más adelante (en las curvas, la tangente).
    const [sx, sy] = aP(puntoEnPista(metros + 2, largo));
    const largoRumbo = Math.hypot(sx - ex, sy - ey) || 1;
    const rumbo = { x: (sx - ex) / largoRumbo, y: (sy - ey) / largoRumbo };
    const vueltas = Math.floor(metros / largo);
    const svg = `<svg class="run-mapa-svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges" preserveAspectRatio="none" role="img" aria-label="Tu carrera en la pista">
        <rect width="${ancho}" height="${alto}" fill="#2a6a38"/>
        ${grada(4, 26)}${grada(alto - 30, 26)}
        <path d="${estadio(exterior + 1.5)}" fill="#e7e2d8"/>
        <path d="${estadio(exterior)}" fill="#b5482e"/>
        <path d="${estadio(borde)}" fill="#2e7a40" stroke="#f4e6e0" stroke-width="1"/>
        ${lineas}${campo}${meta}${avance}
        <rect x="${r1(ex - 3)}" y="${r1(ey - 3)}" width="6" height="6" fill="#f87171" stroke="#0b0816" stroke-width="1.2"/></svg>`;
    return { svg, aqui: { x: (ex / ancho) * 100, y: (ey / alto) * 100 }, rumbo, zona: { nombre: `🏟️ Pista · ${vueltas === 1 ? "1 vuelta" : `${vueltas} vueltas`} · ${Math.round(enVuelta)}/${largo} m` } };
}

export { ZONAS, KM_POR_ZONA };
