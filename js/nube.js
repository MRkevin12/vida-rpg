// nube.js — Copia de seguridad automática en la nube, CIFRADA en el teléfono.
//
// La partida se cifra AQUÍ, en el iPhone, con una llave que sale de tu contraseña.
// Al servidor (el mismo de las notificaciones) solo llega un texto ilegible: ni
// Cloudflare ni nadie puede leerlo sin tu contraseña. Si cambias de teléfono, bajas
// la copia y la abres con la contraseña.
//
//   contraseña ──PBKDF2──▶ llave (256 bits) ──AES-GCM──▶ partida cifrada ──▶ nube
//
// PBKDF2 da muchas vueltas (210 000) a propósito: así probar contraseñas al azar
// cuesta muchísimo. AES-GCM, además de cifrar, detecta si alguien cambió los datos.
//
// En este teléfono se guarda la llave (no la contraseña), para hacer la copia
// diaria sin pedírtela. La llave vive al lado de tu partida, que ya está aquí sin cifrar.

import { SERVIDOR, codigo as codigoDeAvisos } from "./avisos.js";
import { aTexto } from "./fechas.js";

const CLAVE = "vida-rpg-nube";   // { codigo, sal, llave, ultima } — aparte de la partida, como el PIN
const VUELTAS = 210000;


// ===== Lo guardado en este teléfono =====

function leer() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE));
    } catch {
        return null;
    }
}

function escribir(config) {
    localStorage.setItem(CLAVE, JSON.stringify(config));
}

export function configurada() {
    return Boolean(leer()?.llave);
}

export function ultimaCopia() {
    return leer()?.ultima || null;
}

// ¿Ya está el código de las notificaciones? (así no hay que escribirlo otra vez)
export function hayCodigo() {
    return Boolean(leer()?.codigo || codigoDeAvisos());
}

export function desactivar() {
    localStorage.removeItem(CLAVE);
}


// ===== Cifrar =====

// bytes <-> base64 (por partes: con textos grandes, todo junto desborda la memoria)
function aBase64(bytes) {
    const b = new Uint8Array(bytes);
    let texto = "";
    for (let i = 0; i < b.length; i += 0x8000) texto += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return btoa(texto);
}

function deBase64(texto) {
    return Uint8Array.from(atob(texto), (letra) => letra.charCodeAt(0));
}

export async function derivarLlave(contrasena, sal) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(contrasena), "PBKDF2", false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: VUELTAS }, base, 256));
}

export async function cifrar(texto, llave) {
    const iv = crypto.getRandomValues(new Uint8Array(12));   // número de un solo uso: cada copia distinta
    const k = await crypto.subtle.importKey("raw", llave, "AES-GCM", false, ["encrypt"]);
    const datos = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(texto));
    return { iv: aBase64(iv), datos: aBase64(datos) };
}

export async function descifrar({ iv, datos }, llave) {
    const k = await crypto.subtle.importKey("raw", llave, "AES-GCM", false, ["decrypt"]);
    try {
        const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(iv) }, k, deBase64(datos));
        return new TextDecoder().decode(bytes);
    } catch {
        throw new Error("La contraseña no es correcta.");
    }
}


// ===== Hablar con el servidor =====

async function pedir(ruta, codigo, datos) {
    let respuesta;
    try {
        respuesta = await fetch(SERVIDOR + ruta, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo, ...datos }),
        });
    } catch {
        throw new Error("No hay conexión con el servidor. Revisa tu internet.");
    }
    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(resultado.error || "El servidor no respondió bien.");
    return resultado;
}

function limpiarCodigo(texto) {
    return String(texto || "").trim().toUpperCase();
}


// ===== Lo que usa la app =====

export async function activar(estado, contrasena, codigoEscrito) {
    if (String(contrasena).length < 8) throw new Error("La contraseña debe tener al menos 8 letras.");
    const codigo = limpiarCodigo(codigoEscrito || codigoDeAvisos());
    if (!codigo) throw new Error("Escribe el código de activación.");
    const sal = crypto.getRandomValues(new Uint8Array(16));
    const llave = await derivarLlave(contrasena, sal);
    escribir({ codigo, sal: aBase64(sal), llave: aBase64(llave), ultima: null });
    try {
        await subir(estado);
    } catch (error) {
        desactivar();   // código malo o sin internet: queda como antes
        throw error;
    }
}

export async function subir(estado) {
    const config = leer();
    if (!config) throw new Error("La copia en la nube no está activada.");
    const hoy = aTexto(new Date());
    const { iv, datos } = await cifrar(JSON.stringify(estado), deBase64(config.llave));
    await pedir("/respaldo/guardar", config.codigo, { respaldo: { sal: config.sal, iv, datos, fecha: hoy } });
    escribir({ ...config, ultima: hoy });
}

// Una vez al día, al abrir la app. Sin internet no pasa nada: se intenta la próxima vez.
export async function copiaDiaria(estado) {
    const config = leer();
    if (!config?.llave || config.ultima === aTexto(new Date())) return false;
    try {
        await subir(estado);
        return true;
    } catch {
        return false;
    }
}

// Bajar la copia y abrirla con la contraseña. Este teléfono queda con la copia activada.
export async function recuperar(codigoEscrito, contrasena) {
    const codigo = limpiarCodigo(codigoEscrito || leer()?.codigo || codigoDeAvisos());
    if (!codigo) throw new Error("Escribe el código de activación.");
    const { respaldo } = await pedir("/respaldo/leer", codigo, {});
    if (!respaldo) throw new Error("Todavía no hay ninguna copia en la nube.");
    const llave = await derivarLlave(contrasena, deBase64(respaldo.sal));
    const texto = await descifrar(respaldo, llave);
    escribir({ codigo, sal: respaldo.sal, llave: aBase64(llave), ultima: respaldo.fecha });
    return { texto, fecha: respaldo.fecha };
}
