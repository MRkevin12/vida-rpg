// pixel.js — Convierte un dibujo SVG en "pixel art", como los juegos de rol clásicos.
//
// Los dibujos de la app son vectores: se ven lisos a cualquier tamaño. Para que la
// Torre se vea como un juego de consola antigua hacemos lo contrario: pintamos el
// dibujo MUY pequeño (por ejemplo 96 × 96 puntos) y después la pantalla lo agranda
// sin suavizar (en CSS: image-rendering: pixelated). Cada punto queda como un cuadrito.
//
// Tres retoques para que parezca dibujado a mano, punto por punto:
//   1. Bordes duros: cada punto es del dibujo o no lo es (nada a medio transparentar).
//   2. Menos colores: los degradados se vuelven franjas, como en un sprite.
//   3. Contorno: una línea oscura de un punto alrededor de la figura.
//
// Como pintar una imagen tarda un instante, la función es asíncrona (se usa con await)
// y guarda cada resultado para no repetir el trabajo.

const CONTORNO = [20, 12, 34];          // el color de la línea de afuera (violeta casi negro)
const guardados = new Map();            // clave → dirección de la imagen ya hecha

function cargarImagen(direccion) {
    return new Promise((resolver) => {
        const imagen = new Image();
        // decode() espera a que la imagen esté lista para pintarse (en el iPhone, "onload"
        // a veces avisa un instante antes). Si el navegador no lo tiene o falla, se sigue igual.
        imagen.onload = () => Promise.resolve(imagen.decode?.()).catch(() => {}).then(() => resolver(imagen));
        imagen.onerror = () => resolver(null);
        imagen.src = direccion;
    });
}

// Un SVG (texto) como dirección que entiende <img>. Le ponemos el tamaño exacto en puntos:
// así el navegador lo pinta directamente a ese tamaño.
// encodeURIComponent deja pasar ' ( ) * y !, que pueden romper un atributo o un url(…) del
// CSS: esos también se convierten a su código (%27, %28…).
function direccionDeSvg(svg, ancho, alto) {
    const conMedidas = svg.replace("<svg", `<svg width="${ancho}" height="${alto}"`);
    const codificado = encodeURIComponent(conMedidas).replace(/[!'()*]/g, (letra) => `%${letra.charCodeAt(0).toString(16)}`);
    return `data:image/svg+xml;charset=utf-8,${codificado}`;
}

// Menos colores. Un color se puede describir con tres números: su TONO (rojo, verde, azul…,
// un ángulo de 0 a 360), cuánto color tiene (SATURACIÓN) y qué tan claro es (LUZ).
// Redondeamos sobre todo la luz: así un degradado suave se vuelve unas pocas franjas del
// mismo tono, que es como se sombrea un sprite. (Redondear rojo, verde y azul por separado
// deja puntos de colores raros en los bordes de cada franja.)
const TONOS = 48;          // pasos del tono
const SATURACIONES = 8;    // pasos de la saturación

export function redondearColor(rojo, verde, azul, niveles) {
    const [r, g, b] = [rojo / 255, verde / 255, azul / 255];
    const [maximo, minimo] = [Math.max(r, g, b), Math.min(r, g, b)];
    const diferencia = maximo - minimo;
    let luz = (maximo + minimo) / 2;
    let saturacion = diferencia === 0 ? 0 : diferencia / (1 - Math.abs(2 * luz - 1));
    let tono = 0;
    if (diferencia !== 0) {
        if (maximo === r) tono = ((g - b) / diferencia) % 6;
        else if (maximo === g) tono = (b - r) / diferencia + 2;
        else tono = (r - g) / diferencia + 4;
        tono = (tono * 60 + 360) % 360;
    }

    const redondear = (valor, pasos) => Math.round(valor * pasos) / pasos;
    luz = redondear(luz, niveles);
    saturacion = Math.min(1, redondear(saturacion, SATURACIONES));
    tono = (redondear(tono / 360, TONOS) * 360) % 360;

    // De vuelta a rojo, verde y azul.
    const croma = (1 - Math.abs(2 * luz - 1)) * saturacion;
    const x = croma * (1 - Math.abs(((tono / 60) % 2) - 1));
    const base = luz - croma / 2;
    const [r2, g2, b2] = [[croma, x, 0], [x, croma, 0], [0, croma, x], [0, x, croma], [x, 0, croma], [croma, 0, x]][Math.floor(tono / 60) % 6];
    return [r2, g2, b2].map((valor) => Math.round((valor + base) * 255));
}

// En sombras (el Reflejo sombrío de la Mazmorra): cada punto pasa a violeta oscuro, más claro
// donde el original era claro (así se siguen viendo las formas), con un poco de su color de antes.
export function enSombras(rojo, verde, azul) {
    const luz = 0.3 * rojo + 0.59 * verde + 0.11 * azul;
    const sombra = [30 + luz * 0.44, 16 + luz * 0.22, 52 + luz * 0.56];
    return sombra.map((valor, i) => Math.round(valor * 0.85 + [rojo, verde, azul][i] * 0.15));
}

// Retoca los puntos de un lienzo: bordes duros, menos colores y contorno.
// puntos = lista de números [rojo, verde, azul, opacidad, rojo, verde…] (4 por punto).
// sombra: true = todo en sombras (ver enSombras).
export function retocarPuntos(puntos, ancho, alto, { niveles = 14, contorno = true, sombra = false } = {}) {
    const total = ancho * alto;
    const lleno = new Uint8Array(total);   // 1 si el punto es parte del dibujo
    for (let i = 0; i < total; i++) {
        const opaco = puntos[i * 4 + 3] >= 128;
        lleno[i] = opaco ? 1 : 0;
        puntos[i * 4 + 3] = opaco ? 255 : 0;
        if (!opaco) continue;
        const color = sombra ? enSombras(puntos[i * 4], puntos[i * 4 + 1], puntos[i * 4 + 2]) : [puntos[i * 4], puntos[i * 4 + 1], puntos[i * 4 + 2]];
        puntos.set(redondearColor(...color, niveles), i * 4);
    }
    if (!contorno) return puntos;

    // Contorno: todo punto vacío que toca (arriba, abajo o a los lados) uno lleno.
    for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
            const i = y * ancho + x;
            if (lleno[i]) continue;
            const toca = (x > 0 && lleno[i - 1]) || (x < ancho - 1 && lleno[i + 1]) ||
                         (y > 0 && lleno[i - ancho]) || (y < alto - 1 && lleno[i + ancho]);
            if (!toca) continue;
            puntos.set([...CONTORNO, 255], i * 4);
        }
    }
    return puntos;
}

// (v93) Un SVG que se pinta como imagen NO puede cargar archivos de afuera (por seguridad, el navegador
// los ignora). Las pinturas de los fondos (<image href="fondos/aldea.jpg">) saldrían en blanco. Por eso,
// antes de pintar, cada una se lee y se mete DENTRO del SVG como "data:…" (el archivo convertido a texto).
const incrustadas = new Map();   // dirección → su versión "data:…"
function leerComoTexto(direccion) {
    if (!incrustadas.has(direccion)) {
        incrustadas.set(direccion, fetch(direccion).then((r) => (r.ok ? r.blob() : null)).then((blob) => (blob ? new Promise((listo) => {
            const lector = new FileReader();
            lector.onload = () => listo(lector.result);
            lector.onerror = () => listo(null);
            lector.readAsDataURL(blob);
        }) : null)).catch(() => null));
    }
    return incrustadas.get(direccion);
}

async function incrustarImagenes(svg) {
    const externas = [...new Set([...svg.matchAll(/<image[^>]*?\shref="(?!data:)([^"]+)"/g)].map((m) => m[1]))];
    for (const direccion of externas) {
        const texto = await leerComoTexto(direccion);
        if (texto) svg = svg.split(`href="${direccion}"`).join(`href="${texto}"`);
    }
    return svg;
}

// (v93) ¿Ya se hizo la imagen de esa clave? Devuelve su dirección al instante (o null si todavía no).
// Sirve para pintar el HTML sin esperar: si ya está hecha, se usa; si no, se pide y se pone después.
export const yaPixelado = (clave) => guardados.get(clave) || null;

// svg: el dibujo (texto). ancho × alto: el tamaño en puntos.
// opciones: { clave (para guardar el resultado), niveles (colores por canal), contorno,
//             sombra (todo en sombras), espejo (dado vuelta, como en un espejo),
//             puntos (v93: [{ x, y, color: [r, g, b] }, …] que se pintan al final, encima de todo;
//                     así se "estampan" los ojos, que al achicar el dibujo se perderían),
//             margen (v158: los puntos libres en cada borde; con contorno es 1. Con 0, cada unidad del dibujo
//                     cae justo en un punto: así dos imágenes del mismo tamaño quedan alineadas) }
// Devuelve la dirección de la imagen (se usa en <img src="…">), o null si no se pudo.
export async function pixelar(svg, ancho, alto, opciones = {}) {
    const { clave = null, contorno = true, espejo = false, puntos = [] } = opciones;
    if (clave && guardados.has(clave)) return guardados.get(clave);

    const imagen = await cargarImagen(direccionDeSvg(await incrustarImagenes(svg), ancho, alto));
    if (!imagen) return null;
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const g = lienzo.getContext("2d", { willReadFrequently: true });
    // Con contorno, el dibujo deja un punto libre en cada borde (para que la línea quepa).
    const margen = opciones.margen ?? (contorno ? 1 : 0);
    if (espejo) {
        g.translate(ancho, 0);   // dar vuelta el lienzo: lo de la izquierda queda a la derecha
        g.scale(-1, 1);
    }
    g.drawImage(imagen, margen, margen, ancho - margen * 2, alto - margen * 2);
    g.setTransform(1, 0, 0, 1, 0, 0);

    let direccion;
    try {
        const datos = g.getImageData(0, 0, ancho, alto);
        retocarPuntos(datos.data, ancho, alto, opciones);
        for (const { x, y, color } of puntos) {
            if (x < 0 || y < 0 || x >= ancho || y >= alto) continue;
            datos.data.set([...color, 255], (y * ancho + x) * 4);
        }
        g.putImageData(datos, 0, 0);
        direccion = lienzo.toDataURL("image/png");
    } catch {
        // Si el navegador no deja leer los puntos, queda el dibujo normal (sin retocar).
        direccion = direccionDeSvg(svg, ancho, alto);
    }
    if (clave) guardados.set(clave, direccion);
    return direccion;
}
