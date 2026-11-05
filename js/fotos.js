// fotos.js — Las fotos de progreso (v197): se guardan EN EL TELÉFONO, reducidas, sin internet.
//
// ¿Por qué no en localStorage? Porque ahí caben ~5 MB en total, y una sola foto del iPhone pesa varios MB.
// IndexedDB es otra caja del navegador, hecha para archivos grandes. Aquí se guardan las fotos ya reducidas
// (~1000 px, unos 100–200 KB cada una).
//
// Cada foto pertenece a un ÁLBUM y a una FECHA, y solo hay una por álbum y día (si tomas otra, reemplaza):
//   · el álbum de una misión es su id (texto): "7"   → las fotos de «Gym», por ejemplo
//   · el álbum libre es "progreso"                    → tus fotos semanales de progreso
// Las fotos NO van en la copia de seguridad (.json): pesarían demasiado. Viven solo en este teléfono.

import { lunesDe } from "./fechas.js";

const NOMBRE_BD = "vida-rpg-fotos";
const TIENDA = "fotos";
export const ALBUM_LIBRE = "progreso";
const LADO_MAXIMO = 1000;     // la foto se reduce para que su lado más largo mida esto
const CALIDAD = 0.82;         // calidad del JPEG (0 a 1)

// La clave de una foto: álbum + fecha. Así «una por día» sale solo: guardar otra con la misma clave la reemplaza.
export const claveDe = (album, fecha) => `${album}|${fecha}`;

// ===== Las reglas (puras, sin IndexedDB) =====

// ¿Toca pedirte hoy la foto de progreso de la semana? Sí si el recordatorio está encendido y
// todavía no hay foto de progreso en la semana de hoy (de lunes a domingo).
export function faltaFotoSemanal(estado, hoy) {
    const fotos = estado.fotos;
    if (!fotos?.semanal) return false;
    return !fotos.ultima || lunesDe(fotos.ultima) < lunesDe(hoy);
}

// ===== La caja (IndexedDB) =====

let abierta = null;   // la promesa de la base ya abierta (se abre una sola vez)

function abrirBD() {
    if (!abierta) {
        abierta = new Promise((resolver, rechazar) => {
            const peticion = indexedDB.open(NOMBRE_BD, 1);
            peticion.onupgradeneeded = () => {
                const tienda = peticion.result.createObjectStore(TIENDA, { keyPath: "clave" });
                tienda.createIndex("album", "album");
            };
            peticion.onsuccess = () => resolver(peticion.result);
            peticion.onerror = () => rechazar(peticion.error);
        });
        abierta.catch(() => { abierta = null; });   // si falló, la próxima vez se vuelve a intentar
    }
    return abierta;
}

// Envuelve una petición de IndexedDB en una promesa (para poder usar await).
function esperar(peticion) {
    return new Promise((resolver, rechazar) => {
        peticion.onsuccess = () => resolver(peticion.result);
        peticion.onerror = () => rechazar(peticion.error);
    });
}

async function tienda(modo) {
    const bd = await abrirBD();
    return bd.transaction(TIENDA, modo).objectStore(TIENDA);
}

// Guarda (o reemplaza) la foto de ese álbum en esa fecha. `imagen` es un Blob (la foto ya reducida).
export async function guardarFoto(album, fecha, imagen) {
    const registro = { clave: claveDe(album, fecha), album: String(album), fecha, imagen, guardada: Date.now() };
    await esperar((await tienda("readwrite")).put(registro));
    // Pide al navegador que NO borre estas fotos si el teléfono se queda sin espacio (si no lo permite, no pasa nada).
    try { await navigator.storage?.persist?.(); } catch { /* da igual */ }
    return registro;
}

// Las fotos de un álbum, de la más vieja a la más nueva: [{ fecha, imagen }].
export async function fotosDeAlbum(album) {
    const todas = await esperar((await tienda("readonly")).index("album").getAll(String(album)));
    return todas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

// Cuántas fotos hay en cada álbum: { "7": 12, "progreso": 3 }.
export async function cuentaPorAlbum() {
    const todas = await esperar((await tienda("readonly")).getAll());
    const cuenta = {};
    for (const f of todas) cuenta[f.album] = (cuenta[f.album] || 0) + 1;
    return cuenta;
}

export async function borrarFoto(album, fecha) {
    await esperar((await tienda("readwrite")).delete(claveDe(album, fecha)));
}

// Para «Borrar todo»: que no quede ninguna foto en el teléfono.
export async function borrarTodas() {
    try { await esperar((await tienda("readwrite")).clear()); } catch { /* si no hay base, no hay nada que borrar */ }
}

// ===== Reducir la foto =====

// La foto del iPhone (12 megapíxeles) → un JPEG de ~1000 px. createImageBitmap ya la gira según cómo
// tenías el teléfono. Devuelve un Blob.
export async function reducirImagen(archivo, lado = LADO_MAXIMO, calidad = CALIDAD) {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close?.();
    return new Promise((resolver, rechazar) =>
        lienzo.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo reducir la foto."))), "image/jpeg", calidad));
}
