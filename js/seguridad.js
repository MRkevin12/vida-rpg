// seguridad.js — PIN para que solo tú puedas abrir la app.
//
// Nunca guardamos el PIN tal cual. Guardamos su "huella" (hash SHA-256):
// un texto que se calcula a partir del PIN, pero del que no se puede
// sacar el PIN de vuelta. Para comprobar un PIN, calculamos su huella
// y la comparamos con la guardada.
//
// La "sal" es un texto al azar que se mezcla con el PIN antes de calcular
// la huella, para que dos personas con el mismo PIN tengan huellas distintas.
//
// Importante: esto evita que alguien que tome tu iPhone abra la app.
// La protección de fondo de tus datos es el código / Face ID del iPhone.
//
// El PIN se guarda en su propia clave (no dentro de la partida), así:
//   - las copias de seguridad no lo llevan,
//   - importar una copia no cambia tu PIN,
//   - si lo olvidas, puedes borrar y luego importar tu copia sin quedar bloqueado.

const CLAVE = "vida-rpg-pin";
export const LARGO_PIN = 4;


// Lee lo guardado: { sal, huella } si hay PIN, { omitido: true } si dijiste "Ahora no", o null.
function leer() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE));
    } catch {
        return null;
    }
}

export function hayPin() {
    const guardado = leer();
    return Boolean(guardado && guardado.huella);
}

// ¿Hay que ofrecerte crear un PIN? (no hay PIN y no dijiste "Ahora no")
export function debePreguntar() {
    return leer() === null;
}

export function omitir() {
    localStorage.setItem(CLAVE, JSON.stringify({ omitido: true }));
}

export function quitar() {
    localStorage.removeItem(CLAVE);
}

export async function guardarPin(pin) {
    const sal = salAlAzar();
    localStorage.setItem(CLAVE, JSON.stringify({ sal, huella: await calcularHuella(pin, sal) }));
}

export async function pinCorrecto(pin) {
    const guardado = leer();
    if (!guardado || !guardado.huella) return true; // sin PIN no hay nada que comprobar
    return (await calcularHuella(pin, guardado.sal)) === guardado.huella;
}


// ===== Ayudantes =====

// Convierte bytes a texto hexadecimal: [255, 1] -> "ff01"
function aHex(bytes) {
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function salAlAzar() {
    return aHex(crypto.getRandomValues(new Uint8Array(16)));
}

// SHA-256 de (sal + PIN). crypto.subtle es la criptografía que trae el navegador.
async function calcularHuella(pin, sal) {
    const bytes = new TextEncoder().encode(sal + pin);
    return aHex(await crypto.subtle.digest("SHA-256", bytes));
}
