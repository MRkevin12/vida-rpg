// foto.js — Misiones con foto (v193): las reglas para comprobar que la foto trae el código del día.
//
// Cómo funciona:
//   1. Cada misión con foto tiene un CÓDIGO distinto cada día (ej. «LOBO 47»). Sale de mezclar el id
//      de la misión con la fecha, así que es siempre el mismo ese día (aunque cierres la app).
//   2. Tú lo escribes en tu cuaderno (o donde hiciste la tarea) y le tomas una foto.
//   3. El OCR (Tesseract, en app-foto.js) convierte la foto en texto. Aquí comparamos ese texto con
//      el código, perdonando errores pequeños de lectura (el OCR casi nunca acierta al 100 %).
//
// Este archivo solo calcula: no toca la cámara ni la pantalla (por eso se puede probar).

// Palabras del código: cortas, sin Ñ ni tildes, y sin letras que el OCR confunde mucho entre sí.
export const PALABRAS = [
    "LOBO", "ROCA", "FARO", "MURO", "ARCO", "TORRE", "LANZA", "CAPA", "FUEGO", "RAYO",
    "NUBE", "MAREA", "PUMA", "CUERVO", "DUNA", "VELA", "PUENTE", "CAMPO", "TRUENO", "HACHA",
    "ESCUDO", "YUNQUE", "MONTE", "RUNA", "FORJA", "PLUMA", "TRIGO", "HIERRO", "BRASA", "NIEVE",
];

// Un número "al azar" pero fijo para el mismo texto (así el código no cambia durante el día).
function mezclar(texto) {
    let h = 2166136261;   // FNV-1a: una forma sencilla de mezclar letras en un número
    for (const letra of texto) {
        h ^= letra.charCodeAt(0);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

// El código de una misión en una fecha: { palabra: "LOBO", numero: 47, texto: "LOBO 47" }.
export function codigoDeMision(id, fecha) {
    const h = mezclar(`${id}|${fecha}`);
    const palabra = PALABRAS[h % PALABRAS.length];
    const numero = 10 + (Math.floor(h / PALABRAS.length) % 90);   // de 10 a 99
    return { palabra, numero, texto: `${palabra} ${numero}` };
}

// Letras que el OCR confunde: las pasamos todas a una sola forma ANTES de comparar.
// Ej.: si lee «L0B0» (con ceros) cuenta igual que «LOBO».
const PARECIDAS = { "0": "O", "Q": "O", "D": "O", "1": "I", "L": "I", "|": "I", "!": "I", "5": "S", "8": "B", "2": "Z", "6": "G" };

// Deja el texto en mayúsculas, sin tildes, solo letras y números, y con las parecidas unificadas.
// "  lobo-47\n" → "IOBO47"  (la L y la O quedan en su forma única; al código le pasa lo mismo)
export function normalizar(texto) {
    return String(texto || "")
        .toUpperCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")   // quita tildes (á → a)
        .split("")
        .map((letra) => PARECIDAS[letra] || letra)
        .join("")
        .replace(/[^A-Z0-9]/g, "");
}

// ¿Cuántos cambios de letra (poner, quitar o cambiar una) hacen falta, como mínimo, para que
// "buscado" aparezca DENTRO de "texto"? 0 = aparece tal cual. (Distancia de Levenshtein, en la
// versión que permite empezar y terminar en cualquier parte del texto.)
export function distanciaDentro(buscado, texto) {
    if (!buscado) return 0;
    // fila[j] = el menor número de cambios para que buscado[0..i] termine justo en texto[j]
    let fila = new Array(texto.length + 1).fill(0);   // fila 0: empezar en cualquier parte no cuesta
    for (let i = 1; i <= buscado.length; i++) {
        const nueva = [i];
        for (let j = 1; j <= texto.length; j++) {
            const cambio = buscado[i - 1] === texto[j - 1] ? 0 : 1;
            nueva[j] = Math.min(fila[j - 1] + cambio,   // cambiar (o acertar) la letra
                                fila[j] + 1,            // al texto le sobra una letra
                                nueva[j - 1] + 1);      // al texto le falta una letra
        }
        fila = nueva;
    }
    return Math.min(...fila);   // terminar en cualquier parte del texto
}

// Cuántos errores perdonamos: 1 de cada 5 letras (mínimo 1). «LOBO47» (6 letras) → 1 error.
export function erroresPermitidos(largo) {
    return Math.max(1, Math.floor(largo / 5));
}

// Lo principal: ¿el texto que leyó el OCR trae el código? Devuelve
// { ok, errores, permitidos, leido } (leido = el texto ya limpio, para mostrarlo si falla).
export function verificarTexto(texto, codigo) {
    const buscado = normalizar(codigo.texto);
    const leido = normalizar(texto);
    const errores = distanciaDentro(buscado, leido);
    const permitidos = erroresPermitidos(buscado.length);
    return { ok: leido.length > 0 && errores <= permitidos, errores, permitidos, leido };
}
