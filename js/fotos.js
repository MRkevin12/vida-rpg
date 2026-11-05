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

import { lunesDe, sumarDias } from "./fechas.js";

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
    const registro = { clave: claveDe(album, fecha), album: String(album), fecha, imagen, favorita: false, guardada: Date.now() };
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

// (v198) Para las portadas de los álbumes: de cada uno, cuántas fotos tiene, la primera y la última fecha,
// y la imagen más reciente (la portada): { "7": { cuenta, primera, ultima, portada }, … }.
export async function resumenPorAlbum() {
    const todas = await esperar((await tienda("readonly")).getAll());
    const resumen = {};
    for (const f of todas) {
        const a = (resumen[f.album] ||= { cuenta: 0, primera: f.fecha, ultima: f.fecha, portada: f.imagen });
        a.cuenta += 1;
        if (f.fecha < a.primera) a.primera = f.fecha;
        if (f.fecha >= a.ultima) { a.ultima = f.fecha; a.portada = f.imagen; }
    }
    return resumen;
}

export async function borrarFoto(album, fecha) {
    await esperar((await tienda("readwrite")).delete(claveDe(album, fecha)));
}

// Para «Borrar todo»: que no quede ninguna foto en el teléfono.
export async function borrarTodas() {
    try { await esperar((await tienda("readwrite")).clear()); } catch { /* si no hay base, no hay nada que borrar */ }
}

// ===== (v199) Filtrar y ordenar (reglas puras) =====

// Los periodos del filtro de fechas y los dos órdenes. La galería los va cambiando al tocar el botón.
export const PERIODOS = [
    { id: "todo", nombre: "Todo el tiempo", corto: "Todo" },
    { id: "mes", nombre: "Este mes", corto: "Este mes" },
    { id: "3m", nombre: "Últimos 3 meses", corto: "3 meses" },
    { id: "anio", nombre: "Este año", corto: "Este año" },
];
export const ORDENES = [
    { id: "recientes", nombre: "Más recientes", corto: "Recientes" },
    { id: "antiguas", nombre: "Más antiguas", corto: "Antiguas" },
];

// De todas las fotos [{ album, fecha, favorita }], las que cumplen el filtro, ya ordenadas.
//   filtro = { album: "todas" | id, periodo: "todo" | "mes" | "3m" | "anio", favoritas: true/false, orden: "recientes" | "antiguas" }
export function filtrarFotos(lista, filtro, hoy) {
    const desde = {
        todo: "",
        mes: hoy.slice(0, 7) + "-01",
        "3m": sumarDias(hoy, -90),
        anio: hoy.slice(0, 4) + "-01-01",
    }[filtro.periodo] ?? "";
    const sentido = filtro.orden === "antiguas" ? 1 : -1;
    return lista
        .filter((f) => (filtro.album === "todas" || f.album === filtro.album) && (!filtro.favoritas || f.favorita) && f.fecha >= desde)
        .sort((a, b) => sentido * (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.album < b.album ? -1 : a.album > b.album ? 1 : 0));
}

// ===== (v199) Organizar: todas las fotos, favoritas y mover de álbum =====

export async function todasLasFotos() {
    return esperar((await tienda("readonly")).getAll());
}

// Marca o quita la estrella de una foto.
export async function marcarFavorita(album, fecha, valor) {
    const t = await tienda("readwrite");
    const registro = await esperar(t.get(claveDe(album, fecha)));
    if (registro) await esperar(t.put({ ...registro, favorita: Boolean(valor) }));
}

// Pasa una foto a otro álbum. Devuelve false si no se pudo: es el mismo álbum, o el de destino ya
// tiene una foto de ese día (solo hay una por álbum y día, así que no se pisa).
export async function moverFoto(album, fecha, destino) {
    const t = await tienda("readwrite");
    const registro = await esperar(t.get(claveDe(album, fecha)));
    if (!registro || String(destino) === registro.album) return false;
    const claveNueva = claveDe(destino, fecha);
    if (await esperar(t.get(claveNueva))) return false;
    await esperar(t.put({ ...registro, clave: claveNueva, album: String(destino) }));
    await esperar(t.delete(registro.clave));
    return true;
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
