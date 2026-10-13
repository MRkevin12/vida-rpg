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
    const llave = leer()?.llave;   // si tenías Face ID, se mantiene
    localStorage.setItem(CLAVE, JSON.stringify({ sal, huella: await calcularHuella(pin, sal), ...(llave ? { llave } : {}) }));
}

export async function pinCorrecto(pin) {
    const guardado = leer();
    if (!guardado || !guardado.huella) return true; // sin PIN no hay nada que comprobar
    return (await calcularHuella(pin, guardado.sal)) === guardado.huella;
}


// ===== Face ID (o Touch ID) =====
// Usa WebAuthn, la misma tecnología de las "llaves de acceso" (passkeys): el iPhone crea
// una llave que solo se puede usar después de reconocer tu cara. Aquí guardamos solo el
// número (id) de esa llave. Necesita el PIN activado: si Face ID falla, entras con el PIN.

export async function faceIdDisponible() {
    try {
        return Boolean(window.PublicKeyCredential)
            && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
        return false;
    }
}

export function hayFaceId() {
    return Boolean(leer()?.llave);
}

export async function activarFaceId(nombre) {
    const credencial = await navigator.credentials.create({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Vida RPG", id: location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: nombre, displayName: nombre },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
        timeout: 60000,
    } });
    const guardado = leer() || {};
    guardado.llave = aBase64url(credencial.rawId);
    localStorage.setItem(CLAVE, JSON.stringify(guardado));
}

export function quitarFaceId() {
    const guardado = leer();
    if (!guardado) return;
    delete guardado.llave;
    localStorage.setItem(CLAVE, JSON.stringify(guardado));
}

// Pide tu cara. Devuelve true si el iPhone confirmó que eres tú.
export async function comprobarFaceId() {
    const llave = leer()?.llave;
    if (!llave) return false;
    const respuesta = await navigator.credentials.get({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: deBase64url(llave) }],
        userVerification: "required",
        timeout: 60000,
    } });
    // En la respuesta, el byte 32 trae "banderas"; la de valor 4 (UV) dice que se verificó a la persona.
    return (new Uint8Array(respuesta.response.authenticatorData)[32] & 0x04) !== 0;
}


// ===== Ayudantes =====

function aBase64url(bytes) {
    let texto = "";
    for (const b of new Uint8Array(bytes)) texto += String.fromCharCode(b);
    return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64url(texto) {
    const normal = texto.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(normal + "=".repeat((4 - (normal.length % 4)) % 4)), (letra) => letra.charCodeAt(0));
}

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
