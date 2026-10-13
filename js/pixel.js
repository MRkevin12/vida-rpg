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

// Retoca los puntos de un lienzo: bordes duros, menos colores y contorno.
// puntos = lista de números [rojo, verde, azul, opacidad, rojo, verde…] (4 por punto).
export function retocarPuntos(puntos, ancho, alto, { niveles = 14, contorno = true } = {}) {
    const total = ancho * alto;
    const lleno = new Uint8Array(total);   // 1 si el punto es parte del dibujo
    for (let i = 0; i < total; i++) {
        const opaco = puntos[i * 4 + 3] >= 128;
        lleno[i] = opaco ? 1 : 0;
        puntos[i * 4 + 3] = opaco ? 255 : 0;
        if (!opaco) continue;
        puntos.set(redondearColor(puntos[i * 4], puntos[i * 4 + 1], puntos[i * 4 + 2], niveles), i * 4);
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

// svg: el dibujo (texto). ancho × alto: el tamaño en puntos.
// opciones: { clave (para guardar el resultado), niveles (colores por canal), contorno }
// Devuelve la dirección de la imagen (se usa en <img src="…">), o null si no se pudo.
export async function pixelar(svg, ancho, alto, opciones = {}) {
    const { clave = null, contorno = true } = opciones;
    if (clave && guardados.has(clave)) return guardados.get(clave);

    const imagen = await cargarImagen(direccionDeSvg(svg, ancho, alto));
    if (!imagen) return null;
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const g = lienzo.getContext("2d", { willReadFrequently: true });
    // Con contorno, el dibujo deja un punto libre en cada borde (para que la línea quepa).
    const margen = contorno ? 1 : 0;
    g.drawImage(imagen, margen, margen, ancho - margen * 2, alto - margen * 2);

    let direccion;
    try {
        const datos = g.getImageData(0, 0, ancho, alto);
        retocarPuntos(datos.data, ancho, alto, opciones);
        g.putImageData(datos, 0, 0);
        direccion = lienzo.toDataURL("image/png");
    } catch {
        // Si el navegador no deja leer los puntos, queda el dibujo normal (sin retocar).
        direccion = direccionDeSvg(svg, ancho, alto);
    }
    if (clave) guardados.set(clave, direccion);
    return direccion;
}
