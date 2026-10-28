// retratos.js — El héroe, Aurelio y la gente del valle en pixel art, en todas las pantallas (v93).
//
// En la Torre ya se usaban imágenes en pixel art (sprites.js). Aquí se hacen las de las demás
// pantallas: el retrato de la cabecera, la tarjeta del héroe, la escena de la campaña, Aurelio…
//
// Un problema y su arreglo:
//   1. Pixelar es ASÍNCRONO (tarda un instante: hay que pintar el dibujo en un lienzo), pero vistas.js
//      arma el HTML de una vez. Por eso imagen() devuelve un <img> enseguida: si la imagen ya está hecha,
//      con ella; si no, vacío, y la pone apenas esté lista (busca los <img data-pixel="…">).
//   2. Al achicar el dibujo, los ojos (que miden menos de un punto) se pierden y la cara queda lisa.
//      rasgosEnPixeles() calcula dónde caen los ojos en la imagen chica y los "estampa" encima.

import { pixelar, yaPixelado } from "./pixel.js";
import { dibujarAvatar, dibujarAvatarGym } from "./dibujo.js";
import { dibujarSala, SALA } from "./dibujo-monstruos.js";   // (v108) las salas de la Torre, para las ilustraciones
import { rutaPintura } from "./pinturas.js";
import * as ejercicios from "./dibujo-ejercicios.js";   // (v158) las figuras del gym

// Los encuadres de dibujarAvatar (su viewBox: x, y, ancho, alto), ver dibujo.js.
const ENCUADRES = {
    mini: [75, 11, 50, 50],
    batalla: [32.5, 6, 135, 180],
    completo: [6, 2, 188, 188],
    gym: [22, 10, 156, 180],      // (v96) el cuerpo del gimnasio (dibujarAvatarGym)
};

// La cabeza se dibuja ×1,12 alrededor del punto (100, 58.5) (ESCALA_CABEZA en dibujo.js) y los ojos
// están en (96.25, 41.55) y en su espejo (ver cara() en dibujo-cuerpo.js).
const CABEZA = { x: 100, y: 58.5, escala: 1.12 };
const OJOS = [[96.25, 41.55], [103.75, 41.55]];
const TINTA = [26, 18, 38];           // casi negro violeta, el mismo tono del contorno
const BRILLO = [246, 241, 231];       // el blanco del ojo

// Dónde quedan los ojos en una imagen de ancho × alto puntos, y qué pintar.
// contorno: pixelar() deja 1 punto libre en cada borde (para la línea de afuera).
export function rasgosEnPixeles(d, encuadre, ancho, alto, contorno = true) {
    // Dormido o caído, la cabeza se inclina y los ojos van cerrados: se deja como sale.
    if (d.animo === "dormido" || d.animo === "caido") return [];
    const [vx, vy, vw, vh] = ENCUADRES[encuadre];
    const margen = contorno ? 1 : 0;
    const escalaX = (ancho - 2 * margen) / vw;
    const escalaY = (alto - 2 * margen) / vh;
    const aPunto = ([x, y]) => [
        margen + (CABEZA.x + (x - CABEZA.x) * CABEZA.escala - vx) * escalaX,
        margen + (CABEZA.y + (y - CABEZA.y) * CABEZA.escala - vy) * escalaY,
    ];
    const puntos = [];
    const [izq, der] = OJOS.map(aPunto);
    // Los dos ojos a la misma altura y a la misma distancia del centro de la cara (simétricos).
    const y = Math.floor(izq[1]);
    const centro = (izq[0] + der[0]) / 2;
    const separacion = Math.max(1, Math.round((der[0] - izq[0]) / 2));
    const columnas = [Math.round(centro - separacion - 0.5), Math.round(centro + separacion - 0.5)];
    // Si el retrato es grande (la cara mide 12 puntos o más), el ojo es una pupila de 2 puntos con su brillo.
    const grande = escalaX * 22 >= 12;
    for (const x of columnas) {
        puntos.push({ x, y, color: TINTA });
        if (grande) puntos.push({ x, y: y + 1, color: TINTA }, { x: x === columnas[0] ? x - 1 : x + 1, y, color: BRILLO });
    }
    return puntos;
}

// Un nombre corto y fijo para cada imagen (sirve de clave y de atributo en el HTML).
function huella(texto) {
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

// Pide una imagen en pixel art: si ya está hecha, devuelve su dirección; si no, la empieza a hacer (crear() devuelve
// una promesa con su dirección) y devuelve null. Cuando esté lista, la pone en todo lo que tenga data-pixel="clave":
// un <img> (en src) o, desde la v158, un <image> de un SVG (en href).
const VACIA = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const enCamino = new Map();
function pedirImagen(clave, crear) {
    const lista = yaPixelado(clave);
    if (lista) return lista;
    if (!enCamino.has(clave)) {
        enCamino.set(clave, crear().then((direccion) => {
            enCamino.delete(clave);
            if (!direccion) return;
            for (const elemento of document.querySelectorAll(`[data-pixel="${clave}"]`)) {
                if (elemento.tagName.toLowerCase() === "image") elemento.setAttribute("href", direccion);
                else elemento.src = direccion;
                elemento.removeAttribute("data-pixel");
                elemento.classList.remove("cargando");
            }
        }));
    }
    return null;
}

// Un <img> en pixel art.
function imagen(clave, crear, { clase = "", ancho, alto, alt = "" }) {
    const lista = pedirImagen(clave, crear);
    const medidas = `width="${ancho}" height="${alto}"`;
    if (lista) return `<img class="pixel ${clase}" src="${lista}" ${medidas} alt="${alt}" draggable="false">`;
    return `<img class="pixel ${clase} cargando" data-pixel="${clave}" src="${VACIA}" ${medidas} alt="${alt}" draggable="false">`;
}

// --- Las imágenes ---

// La cara y los hombros (la cabecera, Aurelio en los consejos). 32 × 32 puntos.
// lado: los puntos por lado (32 normal; 96 en el primer plano de Apariencia, v113: con tantos puntos el dibujo ya trae
// sus ojos bien hechos y no hace falta estamparlos).
export function retratoPixel(d, { clase = "", alt = "", lado = 32 } = {}) {
    const [ancho, alto] = [lado, lado];
    const clave = `retrato-${lado === 32 ? "" : `${lado}-`}${huella(JSON.stringify(d))}`;
    const puntos = lado > 48 ? [] : rasgosEnPixeles(d, "mini", ancho, alto);
    return imagen(clave, () => pixelar(dibujarAvatar(d, { mini: true }), ancho, alto,
        { clave, puntos }), { clase: `retrato-pixel ${clase}`, ancho, alto, alt });
}

// De cuerpo entero, sin fondo (la campaña, el arcade, Aurelio de pie). Del mismo tamaño que en la Torre: 54 × 72.
// efectos: true = detrás van sus llamas o su aura (si las tiene), pixeladas en vivo como en el diorama.
export function figuraPixel(d, { clase = "", alt = "" , efectos = false } = {}) {
    const [ancho, alto] = [54, 72];
    const clave = `figura-${huella(JSON.stringify(d))}`;
    const img = imagen(clave, () => pixelar(dibujarAvatar(d, { batalla: true, sinEfectos: true }), ancho, alto,
        { clave, puntos: rasgosEnPixeles(d, "batalla", ancho, alto) }), { clase: `figura-pixel ${clase}`, ancho, alto, alt });
    const detras = efectos ? dibujarAvatar(d, { batalla: true, capa: "detras" }) : "";
    // Sin llamas ni aura, la capa de atrás queda vacía (solo <defs>): entonces va la imagen sola.
    if (!detras || !/<(path|circle|ellipse|g|rect)\b/.test(detras.replace(/<defs>[\s\S]*?<\/defs>/g, ""))) return img;
    return `<div class="figura-con-efectos"><div class="figura-efectos" aria-hidden="true">${pixelarEnVivo(detras, 135 / ancho)}</div>${img}</div>`;
}

// La escena completa del héroe (la tarjeta de Hoy y la de Héroe), por capas, como un diorama:
//   1. el paisaje en pixel art (quieto)
//   2. lo que va detrás del héroe, en dibujo: partículas, aura y llamas (se mueven)
//   3. el héroe y su mascota en pixel art (respiran con CSS)
//   4. lo que oscurece la escena (cansado, dormido)
// (v113) 144 puntos de lado (antes 108): más puntos = más detalle en la cara y la ropa.
export const LADO_DIORAMA = 144;
export function dioramaPixel(d, { clase = "" } = {}) {
    const lado = LADO_DIORAMA;
    const base = huella(JSON.stringify(d));
    const fondo = imagen(`fondo-${lado}-${base}`, () => pixelar(dibujarAvatar(d, { capa: "fondo" }), lado, lado,
        { clave: `fondo-${lado}-${base}`, contorno: false, niveles: 10 }), { clase: "diorama-fondo", ancho: lado, alto: lado });
    const figura = imagen(`cuerpo-${lado}-${base}`, () => pixelar(dibujarAvatar(d, { capa: "figura" }), lado, lado,
        { clave: `cuerpo-${lado}-${base}`, puntos: rasgosEnPixeles(d, "completo", lado, lado) }),
        { clase: "diorama-figura", ancho: lado, alto: lado, alt: `Avatar: ${d.clase.nombre} ${d.etapa.nombre}` });
    return `<div class="diorama ${clase}" style="--lado: ${lado}">
        ${fondo}
        <div class="diorama-detras" aria-hidden="true">${pixelarEnVivo(dibujarAvatar(d, { capa: "detras" }), 188 / lado)}</div>
        ${figura}
        <div class="diorama-encima" aria-hidden="true">${dibujarAvatar(d, { capa: "encima" })}</div>
    </div>`;
}

// Las llamas, el aura y las partículas siguen siendo dibujo (se animan con CSS), pero se ven en pixel art con un
// filtro de "mosaico": toma un punto de cada cuadrito de lado `paso` y lo agranda hasta llenar el cuadrito.
//   feFlood + feComposite + feTile → una rejilla con un punto de muestra en cada cuadrito
//   feComposite "in"              → de lo dibujado, solo quedan esos puntos
//   feMorphology "dilate"         → cada punto crece hasta tapar su cuadrito
// (v96) Sirve para cualquier dibujo: el filtro cubre todo su viewBox, y `paso` es el lado de un punto en
// unidades del dibujo (por ejemplo, un dibujo de 120 de ancho con paso 2,5 se ve como 48 puntos de ancho).
let filtros = 0;
export function pixelarEnVivo(svg, paso) {
    const id = `mosaico-${++filtros}`;
    const [vx, vy, vw, vh] = (svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 200 200").split(/[\s,]+/).map(Number);
    const filtro = `<filter id="${id}" x="${vx}" y="${vy}" width="${vw}" height="${vh}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood x="${vx}" y="${vy}" width="${(paso * 0.5).toFixed(3)}" height="${(paso * 0.5).toFixed(3)}" flood-color="#000"/>
        <feComposite x="${vx}" y="${vy}" width="${paso.toFixed(3)}" height="${paso.toFixed(3)}"/>
        <feTile result="rejilla"/>
        <feComposite in="SourceGraphic" in2="rejilla" operator="in"/>
        <feMorphology operator="dilate" radius="${(paso / 2).toFixed(3)}"/>
    </filter>`;
    // Todo lo que hay dentro del <svg> (salvo las definiciones) pasa por el filtro.
    return svg.trim().replace(/(<svg[^>]*>)(<defs>[\s\S]*?<\/defs>)?([\s\S]*)(<\/svg>)$/,
        (_, abre, defs = "", resto, cierra) => `${abre}${defs}<defs>${filtro}</defs><g filter="url(#${id})">${resto}</g>${cierra}`);
}

// (v96) Tu cuerpo en el gimnasio, en pixel art y con sus ojos. Misma densidad que la figura de batalla (≈0,4 puntos por unidad).
export function cuerpoGymPixel(d, { clase = "" } = {}) {
    const [ancho, alto] = [93, 108];   // (v112) antes 62 × 72: más puntos = una cara con más detalle
    const clave = `gym-${huella(JSON.stringify(d))}`;
    return imagen(clave, () => pixelar(dibujarAvatarGym(d), ancho, alto, { clave, puntos: rasgosEnPixeles(d, "gym", ancho, alto) }),
        { clase: `figura-pixel cuerpo-gym-pixel ${clase}`, ancho, alto, alt: `Tu cuerpo: nivel de físico ${d.fisico || 0}` });
}

// (v96) Cualquier dibujo SVG fijo en pixel art (mascotas, objetos…).
// ancho × alto = puntos de la imagen; contorno: la línea oscura de afuera (para figuras sueltas sí, para escenas no).
// (Los dibujos llevan ids que cambian cada vez —av12, mo7…, ver nuevoId en dibujo-base.js—: se quitan para la clave.)
export function pixelEstatico(svg, ancho, alto, { clase = "", alt = "", contorno = true } = {}) {
    const clave = `dibujo-${ancho}x${alto}-${contorno ? 1 : 0}-${huella(svg.replace(/\b(av|es|mo|m|sala|d)\d+/g, ""))}`;
    return imagen(clave, () => pixelar(svg, ancho, alto, { clave, contorno }), { clase: `dibujo-pixel ${clase}`, ancho, alto, alt });
}

// (v108) Una ilustración en pixel art, como las de un libro: un fondo (una pintura «pintura:aldea» o una sala de la
// Torre «cripta») y, encima, los personajes de pie (cada uno: { d, x } con d = describirAvatar() o describirMaestro(),
// y x = dónde, en % del ancho). titulo = un letrero abajo. clase = "miniatura" para las pequeñas de la lista de Historia.
export function ilustracion(fondo, { actores = [], titulo = "", clase = "" } = {}) {
    let imagenFondo;
    if (String(fondo).startsWith("pintura:")) {
        imagenFondo = `<img class="pixel ilustracion-fondo" src="${rutaPintura(fondo.slice(8))}" alt="" draggable="false">`;
    } else {
        const clave = `sala-${fondo}`;   // la misma clave que sprites.js › spriteDeSala: se comparte la imagen
        imagenFondo = imagen(clave, () => pixelar(dibujarSala(fondo), SALA.ancho, SALA.alto, { clave, contorno: false, niveles: 20 }),
            { clase: "ilustracion-fondo", ancho: SALA.ancho, alto: SALA.alto });
    }
    const personajes = actores.filter(({ d }) => d).map(({ d, x = 50 }) => `<div class="ilustracion-actor" style="left: ${x}%">${figuraPixel(d)}</div>`).join("");   // sin héroe (d vacío), solo el fondo
    return `<figure class="ilustracion ${clase}" aria-hidden="true">${imagenFondo}${personajes}${titulo ? `<figcaption>${titulo}</figcaption>` : ""}</figure>`;
}

// ===== (v158) La escena de un ejercicio del gym =====
// Dos imágenes en pixel art, una sobre otra, dentro de un SVG:
//   1. el gimnasio de fondo (con las máquinas que no se mueven), más grande que el cuadro: si la pantalla es más ancha
//      o más alta que el dibujo, se sigue viendo la sala;
//   2. la TIRA con los 20 cuadros de la repetición, uno al lado del otro. Una ventana del tamaño de un cuadro la deja ver
//      de a uno, y <animate> la corre de cuadro en cuadro (calcMode="discrete": salta, no se desliza), como un dibujo animado.
// preserveAspectRatio="xMidYMax meet": el cuadro entero cabe, centrado y apoyado abajo (el suelo queda abajo).
// animar = false: queda quieto en el cuadro `cuadro` (0 = la posición de inicio).
const clavesEjercicio = (movimiento, apariencia, fisico) => {
    const quien = huella(JSON.stringify([apariencia.piel, apariencia.pelo, apariencia.peinado, apariencia.barba, apariencia.cuerpo]));
    return { fondo: `ej-fondo-${ejercicios.fondoDe(movimiento)}`, tira: `ej-tira-${movimiento}-${fisico}-${quien}` };
};

// Empieza a hacer las imágenes de un ejercicio (sin dibujarlo): así, cuando llegues a él, ya están listas.
export function prepararEscena(movimiento, apariencia = {}, { fisico = 0 } = {}) {
    const claves = clavesEjercicio(movimiento, apariencia, fisico);
    const fondo = pedirImagen(claves.fondo, () => pixelar(ejercicios.dibujarFondoEjercicio(movimiento), ejercicios.FONDO.ancho, ejercicios.FONDO.alto,
        { clave: claves.fondo, contorno: false, margen: 0 }));
    const tira = pedirImagen(claves.tira, () => pixelar(ejercicios.tiraDeMovimiento(movimiento, apariencia, { fisico }).svg,
        ejercicios.ANCHO * ejercicios.CUADROS.length, ejercicios.ALTO, { clave: claves.tira, margen: 0 }));
    return { claves, fondo, tira };
}

export function escenaEjercicio(movimiento, apariencia = {}, { animar = true, fisico = 0, cuadro = 0, clase = "" } = {}) {
    const { ANCHO, ALTO, FONDO, CUADROS } = ejercicios;
    const { claves, fondo, tira } = prepararEscena(movimiento, apariencia, { fisico });
    // Mientras la imagen no está hecha, el <image> queda vacío y con data-pixel (pedirImagen le pone la imagen después).
    const origen = (clave, direccion) => (direccion ? `href="${direccion}"` : `href="${VACIA}" data-pixel="${clave}"`);
    const { valores, tiempos, duracion } = ejercicios.animacionDeTira();
    const animacion = animar
        ? `<animate attributeName="x" values="${valores.join(";")}" keyTimes="${tiempos.join(";")}" dur="${duracion}s" calcMode="discrete" repeatCount="indefinite"/>`
        : "";
    // El viewBox es la parte del cuadro que importa (encuadreDe): en una pantalla alta y angosta, la figura sale más grande.
    return `<svg class="escena-ejercicio ${clase}" viewBox="${ejercicios.encuadreDe(movimiento).join(" ")}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <image ${origen(claves.fondo, fondo)} x="${FONDO.x}" y="${FONDO.y}" width="${FONDO.ancho}" height="${FONDO.alto}" preserveAspectRatio="none" style="image-rendering: pixelated"/>
        <svg width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
            <image ${origen(claves.tira, tira)} x="${-cuadro * ANCHO}" y="0" width="${ANCHO * CUADROS.length}" height="${ALTO}" preserveAspectRatio="none" style="image-rendering: pixelated">${animacion}</image>
        </svg>
    </svg>`;
}

// Para tenerlas listas antes de abrir una pantalla (al arrancar la app): así salen al instante.
export function prepararRetratos(lista) {
    const caja = document.createElement("div");
    caja.innerHTML = lista.join("");
    return Promise.all([...enCamino.values()]);
}
