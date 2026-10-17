// pixel-pintura.js — Convierte una PINTURA (jpg) en pixel art de buena calidad (v95).
//
// pixel.js está pensado para dibujos (SVG con formas limpias). Una pintura es distinta: tiene miles
// de colores mezclados. Si solo se achica, queda borrosa y sucia. Aquí se hace como un artista de
// pixel art, en cinco pasos:
//   1. Achicar con cuidado (el navegador promedia los puntos de cada cuadrito).
//   2. Más contraste y más color: al achicar, todo se apaga un poco.
//   3. Afilar: que los bordes (ojos, siluetas) no se pierdan.
//   4. Elegir una PALETA corta (16 a 24 colores) sacada de la misma pintura, con "k-medias":
//      se reparten k colores al azar y se mueven, una y otra vez, al promedio de los puntos que
//      les quedan más cerca, hasta que cada uno representa bien a un grupo de puntos.
//   5. Pintar cada punto con el color de la paleta más parecido, con TRAMADO (dithering):
//      una rejilla fija (Bayer) empuja un poco cada punto hacia arriba o hacia abajo, y así los
//      degradados se vuelven puntitos alternados, como en los juegos clásicos.
//
// Todo pasa en un <canvas> pequeño, en el teléfono, sin internet. El resultado se guarda en memoria.

const hechas = new Map();   // clave → dirección "data:image/png…" ya hecha

// La rejilla de Bayer 4 × 4: cada casilla dice cuánto empujar ese punto (de 0 a 15).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function cargar(direccion) {
    return new Promise((listo) => {
        const imagen = new Image();
        imagen.onload = () => listo(imagen);
        imagen.onerror = () => listo(null);
        imagen.src = direccion;
    });
}

// Pasos 2 y 3: contraste, color y filo sobre los puntos [r, g, b, a, r, g, b, a…].
function retocar(datos, ancho, alto, { contraste, saturacion, filo }) {
    const p = datos;
    for (let i = 0; i < p.length; i += 4) {
        let [r, g, b] = [p[i], p[i + 1], p[i + 2]];
        const gris = 0.299 * r + 0.587 * g + 0.114 * b;
        // Saturación: alejar cada canal del gris. Contraste: alejar del gris medio (128).
        [r, g, b] = [r, g, b].map((c) => (gris + (c - gris) * saturacion - 128) * contraste + 128);
        p[i] = r; p[i + 1] = g; p[i + 2] = b;
    }
    if (!filo) return;
    // Afilar ("unsharp"): a cada punto se le suma la diferencia con el promedio de sus 4 vecinos.
    const copia = Float32Array.from(p);
    for (let y = 1; y < alto - 1; y++) {
        for (let x = 1; x < ancho - 1; x++) {
            const i = (y * ancho + x) * 4;
            for (let c = 0; c < 3; c++) {
                const vecinos = (copia[i - 4 + c] + copia[i + 4 + c] + copia[i - ancho * 4 + c] + copia[i + ancho * 4 + c]) / 4;
                p[i + c] = copia[i + c] + (copia[i + c] - vecinos) * filo;
            }
        }
    }
}

// Paso 4: la paleta de k colores (k-medias). Empieza con colores repartidos por toda la imagen
// (no al azar: así el resultado es siempre el mismo) y los mueve 10 veces.
function paletaDe(datos, k) {
    const total = datos.length / 4;
    let centros = Array.from({ length: k }, (_, j) => {
        const i = Math.floor(((j + 0.5) / k) * total) * 4;
        return [datos[i], datos[i + 1], datos[i + 2]];
    });
    for (let vuelta = 0; vuelta < 10; vuelta++) {
        const sumas = centros.map(() => [0, 0, 0, 0]);
        for (let i = 0; i < datos.length; i += 4) {
            const j = masCercano(centros, datos[i], datos[i + 1], datos[i + 2]);
            sumas[j][0] += datos[i]; sumas[j][1] += datos[i + 1]; sumas[j][2] += datos[i + 2]; sumas[j][3]++;
        }
        centros = sumas.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centros[j]));
    }
    return centros.map((c) => c.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
}

// El color de la paleta más parecido (distancia "pesada": el ojo nota más el verde que el azul).
function masCercano(paleta, r, g, b) {
    let mejor = 0, menor = Infinity;
    for (let j = 0; j < paleta.length; j++) {
        const [pr, pg, pb] = paleta[j];
        const d = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2;
        if (d < menor) { menor = d; mejor = j; }
    }
    return mejor;
}

// La pintura en pixel art. direccion = "jefes/lobo.jpg" (o cualquier imagen del sitio).
// opciones: colores (tamaño de la paleta), tramado (0 = sin puntitos, 1 = muchos), contraste,
//           saturacion, filo (cuánto afilar), clave (para guardarla).
export async function pixelarPintura(direccion, ancho, alto, opciones = {}) {
    const { colores = 20, tramado = 0.55, contraste = 1.12, saturacion = 1.18, filo = 0.45, clave = `${direccion}|${ancho}x${alto}` } = opciones;
    if (hechas.has(clave)) return hechas.get(clave);
    const imagen = await cargar(direccion);
    if (!imagen) return null;

    // Paso 1: achicar en dos saltos (primero al doble y después al tamaño final): queda más limpio.
    const medio = document.createElement("canvas");
    medio.width = ancho * 2; medio.height = alto * 2;
    const gm = medio.getContext("2d");
    gm.imageSmoothingQuality = "high";
    // "cover": se recorta lo que sobra para llenar el cuadro sin deformar la pintura.
    const escala = Math.max(medio.width / imagen.width, medio.height / imagen.height);
    const [w, h] = [imagen.width * escala, imagen.height * escala];
    gm.drawImage(imagen, (medio.width - w) / 2, (medio.height - h) / 2, w, h);
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho; lienzo.height = alto;
    const g = lienzo.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingQuality = "high";
    g.drawImage(medio, 0, 0, ancho, alto);

    let direccionFinal;
    try {
        const datos = g.getImageData(0, 0, ancho, alto);
        const trabajo = Float32Array.from(datos.data);
        retocar(trabajo, ancho, alto, { contraste, saturacion, filo });
        const paleta = paletaDe(trabajo, colores);
        // Paso 5: cada punto a su color de paleta, con el empujón de la rejilla de Bayer.
        const empuje = 34 * tramado;
        for (let y = 0; y < alto; y++) {
            for (let x = 0; x < ancho; x++) {
                const i = (y * ancho + x) * 4;
                const desvio = (BAYER[(y % 4) * 4 + (x % 4)] / 15 - 0.5) * empuje;
                const j = masCercano(paleta, trabajo[i] + desvio, trabajo[i + 1] + desvio, trabajo[i + 2] + desvio);
                datos.data[i] = paleta[j][0]; datos.data[i + 1] = paleta[j][1]; datos.data[i + 2] = paleta[j][2]; datos.data[i + 3] = 255;
            }
        }
        g.putImageData(datos, 0, 0);
        direccionFinal = lienzo.toDataURL("image/png");
    } catch {
        direccionFinal = null;   // si el navegador no deja leer los puntos, se queda la pintura normal
    }
    if (direccionFinal) hechas.set(clave, direccionFinal);
    return direccionFinal;
}

// ¿Ya está hecha? (sin esperar)
export const pinturaHecha = (clave) => hechas.get(clave) || null;


// ===== Guardarlas en el teléfono (Cache Storage) =====
// Pixelar las ~35 pinturas tarda unos segundos la primera vez. El resultado se guarda en un "caché"
// del navegador (como el del service worker, pero aparte): las siguientes veces sale al instante.
// El nombre NO empieza con "vida-rpg-v", así que al actualizar la app no se borra (ver sw.js).
// Si un día cambia la forma de pixelar, se sube el número (v1 → v2) y se hacen de nuevo.
const CAJA = "pixel-pinturas-v1";
const direccionEnCaja = (clave) => `./pixel-cache/${encodeURIComponent(clave)}`;

async function leerDeCaja(clave) {
    try {
        const respuesta = await (await caches.open(CAJA)).match(direccionEnCaja(clave));
        if (!respuesta) return null;
        const blob = await respuesta.blob();
        return await new Promise((listo) => {
            const lector = new FileReader();
            lector.onload = () => listo(lector.result);
            lector.onerror = () => listo(null);
            lector.readAsDataURL(blob);
        });
    } catch {
        return null;   // sin Cache Storage (por ejemplo, en una ventana privada): se hacen de nuevo
    }
}

async function guardarEnCaja(clave, direccion) {
    try {
        const blob = await (await fetch(direccion)).blob();
        await (await caches.open(CAJA)).put(direccionEnCaja(clave), new Response(blob, { headers: { "Content-Type": "image/png" } }));
    } catch { /* si no se puede guardar, la próxima vez se vuelve a hacer */ }
}

// Prepara una lista de pinturas, UNA POR UNA y dejando respirar a la pantalla entre cada una
// (así la app no se traba mientras trabaja). lista = [{ clave, direccion, ancho, alto, listo(url) }].
export async function prepararPinturas(lista) {
    for (const p of lista) {
        let url = hechas.get(p.clave) || await leerDeCaja(p.clave);
        if (!url) {
            await new Promise((siga) => setTimeout(siga, 30));   // un respiro antes de cada pintura nueva
            url = await pixelarPintura(p.direccion, p.ancho, p.alto, { clave: p.clave, colores: 24, tramado: 0.55 });
            if (url) await guardarEnCaja(p.clave, url);
        }
        if (url) {
            hechas.set(p.clave, url);
            p.listo(url);
        }
    }
}
