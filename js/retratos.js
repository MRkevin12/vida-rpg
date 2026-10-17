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
import { dibujarAvatar } from "./dibujo.js";

// Los encuadres de dibujarAvatar (su viewBox: x, y, ancho, alto), ver dibujo.js.
const ENCUADRES = {
    mini: [75, 11, 50, 50],
    batalla: [32.5, 6, 135, 180],
    completo: [6, 2, 188, 188],
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

// Un <img> en pixel art. crear() hace la imagen (devuelve una promesa con su dirección).
const VACIA = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const enCamino = new Map();
function imagen(clave, crear, { clase = "", ancho, alto, alt = "" }) {
    const lista = yaPixelado(clave);
    const medidas = `width="${ancho}" height="${alto}"`;
    if (lista) return `<img class="pixel ${clase}" src="${lista}" ${medidas} alt="${alt}" draggable="false">`;
    if (!enCamino.has(clave)) {
        enCamino.set(clave, crear().then((direccion) => {
            enCamino.delete(clave);
            if (!direccion) return;
            for (const img of document.querySelectorAll(`img[data-pixel="${clave}"]`)) {
                img.src = direccion;
                img.removeAttribute("data-pixel");
            }
        }));
    }
    return `<img class="pixel ${clase} cargando" data-pixel="${clave}" src="${VACIA}" ${medidas} alt="${alt}" draggable="false">`;
}

// --- Las imágenes ---

// La cara y los hombros (la cabecera, Aurelio en los consejos). 32 × 32 puntos.
export function retratoPixel(d, { clase = "", alt = "" } = {}) {
    const [ancho, alto] = [32, 32];
    const clave = `retrato-${huella(JSON.stringify(d))}`;
    return imagen(clave, () => pixelar(dibujarAvatar(d, { mini: true }), ancho, alto,
        { clave, puntos: rasgosEnPixeles(d, "mini", ancho, alto) }), { clase: `retrato-pixel ${clase}`, ancho, alto, alt });
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
export const LADO_DIORAMA = 72;
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
let filtros = 0;
function pixelarEnVivo(svg, paso) {
    const id = `mosaico-${++filtros}`;
    const filtro = `<filter id="${id}" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood x="0" y="0" width="${(paso * 0.5).toFixed(3)}" height="${(paso * 0.5).toFixed(3)}" flood-color="#000"/>
        <feComposite width="${paso.toFixed(3)}" height="${paso.toFixed(3)}"/>
        <feTile result="rejilla"/>
        <feComposite in="SourceGraphic" in2="rejilla" operator="in"/>
        <feMorphology operator="dilate" radius="${(paso / 2).toFixed(3)}"/>
    </filter>`;
    // Todo lo que hay dentro del <svg> (salvo las definiciones) pasa por el filtro.
    return svg.replace(/(<svg[^>]*>)(<defs>[\s\S]*?<\/defs>)?([\s\S]*)(<\/svg>)$/,
        (_, abre, defs = "", resto, cierra) => `${abre}${defs}<defs>${filtro}</defs><g filter="url(#${id})">${resto}</g>${cierra}`);
}

// Para tenerlas listas antes de abrir una pantalla (al arrancar la app): así salen al instante.
export function prepararRetratos(lista) {
    const caja = document.createElement("div");
    caja.innerHTML = lista.join("");
    return Promise.all([...enCamino.values()]);
}
