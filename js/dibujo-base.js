// dibujo-base.js — Herramientas que comparten todos los dibujos.
//
// Los dibujos de la app son SVG: texto que describe formas (caminos, círculos…)
// y que el navegador pinta. Aquí están las piezas que se repiten:
//   - colores: mezclar, aclarar y oscurecer;
//   - materiales: degradados que dan volumen (tela, piel, acero, oro…);
//   - formas: brazos y piernas ("cápsulas"), destellos y pivotes para animar.
//
// La luz viene siempre de ARRIBA A LA IZQUIERDA: cada forma es más clara
// por ese lado y más oscura por el otro. Eso es lo que la hace ver con volumen.

export const TRAZO = "#120c1c";       // contorno oscuro
export const SOMBRA = "#150a33";      // las sombras tiran a violeta (se ve más rico que el negro)

let contador = 0;

// Cada dibujo necesita ids distintos para sus degradados (si no, se pisan entre sí).
export function nuevoId(prefijo = "d") {
    contador += 1;
    return `${prefijo}${contador}`;
}


// ===== Colores =====

// "#rrggbb" → [r, g, b]
function aNumeros(color) {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
}

// Mezcla dos colores: t = 0 da "a", t = 1 da "b", 0.5 la mitad.
export function mezclar(a, b, t) {
    const [x, y] = [aNumeros(a), aNumeros(b)];
    return "#" + x.map((valor, i) => Math.round(valor + (y[i] - valor) * t).toString(16).padStart(2, "0")).join("");
}

export const aclarar = (color, t) => mezclar(color, "#fff6e0", t);    // hacia una luz cálida
export const oscurecer = (color, t) => mezclar(color, SOMBRA, t);     // hacia una sombra violeta


// ===== Materiales =====

// Material mate (tela, piel, cuero): de claro a oscuro.
export function mate(id, color, luz = 0.22, sombra = 0.42) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0.45">
                <stop offset="0" stop-color="${aclarar(color, luz)}"/>
                <stop offset=".45" stop-color="${color}"/>
                <stop offset="1" stop-color="${oscurecer(color, sombra)}"/>
            </linearGradient>`;
}

// Material brillante (acero, oro): con una franja de luz, como el metal pulido.
export function metal(id, color) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0.6">
                <stop offset="0" stop-color="${aclarar(color, 0.35)}"/>
                <stop offset=".22" stop-color="${aclarar(color, 0.75)}"/>
                <stop offset=".4" stop-color="${color}"/>
                <stop offset=".72" stop-color="${oscurecer(color, 0.5)}"/>
                <stop offset="1" stop-color="${oscurecer(color, 0.25)}"/>
            </linearGradient>`;
}

// Luz redonda que se desvanece (auras, brillos, sombras en el suelo).
export function halo(id, color, fuerza = 0.6, medio = 0.5) {
    return `<radialGradient id="${id}">
                <stop offset="0" stop-color="${color}" stop-opacity="${fuerza}"/>
                <stop offset="${medio}" stop-color="${color}" stop-opacity="${fuerza * 0.35}"/>
                <stop offset="1" stop-color="${color}" stop-opacity="0"/>
            </radialGradient>`;
}

// Degradado vertical de varios colores (cielos y fondos).
export function vertical(id, colores) {
    const pasos = colores.map((color, i) =>
        `<stop offset="${(i / (colores.length - 1)).toFixed(2)}" stop-color="${color}"/>`).join("");
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${pasos}</linearGradient>`;
}


// ===== Formas =====

const n = (valor) => Math.round(valor * 100) / 100;   // 2 decimales: el SVG queda más corto

// Una "cápsula": la forma de un brazo o una pierna. Une dos círculos
// (uno en cada articulación) con líneas rectas, así puede ser más gruesa en un extremo.
export function capsula(x1, y1, r1, x2, y2, r2) {
    const angulo = Math.atan2(y2 - y1, x2 - x1);
    const distancia = Math.hypot(x2 - x1, y2 - y1);
    const abertura = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / distancia)));
    const punto = (cx, cy, r, a) => `${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
    return `M${punto(x1, y1, r1, angulo + abertura)}
            A${n(r1)} ${n(r1)} 0 1 1 ${punto(x1, y1, r1, angulo - abertura)}
            L${punto(x2, y2, r2, angulo - abertura)}
            A${n(r2)} ${n(r2)} 0 0 1 ${punto(x2, y2, r2, angulo + abertura)} Z`;
}

// Destello de 4 puntas.
export function destello(x, y, r, clase = "chispa", color = "#fff3c4") {
    return `<path class="${clase}" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${color}"/>`;
}

// Pivote: envuelve un dibujo para que el CSS pueda GIRARLO alrededor del punto (x, y)
// (por ejemplo, el brazo alrededor del hombro). El truco: mover el punto al origen,
// girar ahí (grupo con la clase) y devolver todo a su sitio.
export function pivote(x, y, clase, contenido) {
    return `<g transform="translate(${x} ${y})"><g class="${clase}"><g transform="translate(${-x} ${-y})">${contenido}</g></g></g>`;
}
