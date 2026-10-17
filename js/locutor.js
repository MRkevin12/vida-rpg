// locutor.js — La voz GRABADA de la carrera (v128).
//
// El iPhone no le entrega a las páginas web las voces que descargas en Ajustes (solo unas pocas de fábrica), así que la app trae
// sus propias voces: audios cortos (locutor/<voz>/<clave>.mp3) hechos con Piper (ver herramientas/generar-voces.py). Aquí solo se
// descargan, se decodifican y se reproducen uno tras otro con el audio de la página (Web Audio). No usa internet si ya se bajaron
// (el service worker los guarda: sw.js › CACHE_VOCES; «Descargar voz» los baja todos de una vez).
// Web Audio se mezcla con tu música (no la pausa); si el iPhone tiene el interruptor de silencio puesto, no suena.

import { motorDeAudio } from "./sonido.js";
import { TEXTOS } from "./frases.js";

export const PREFIJO = "pack:";   // en running.voz: «pack:ald» = la voz grabada «ald»
export const VOCES = {
    ald:    { nombre: "Ald · mexicano (grabada)",    licencia: "es_MX-ald-medium, dominio público (Unlicense)" },
    claude: { nombre: "Claude · mexicana (grabada)", licencia: "es_MX-claude-high, Apache 2.0" },
};

export const esGrabada = (voz) => typeof voz === "string" && voz.startsWith(PREFIJO) && Boolean(VOCES[voz.slice(PREFIJO.length)]);
const nombreDe = (voz) => voz.slice(PREFIJO.length);
const direccion = (voz, clave) => `./locutor/${nombreDe(voz)}/${clave}.mp3`;

const buffers = new Map();   // dirección → AudioBuffer (o null si no existe)
let sonando = [];            // lo que suena ahora, para poder callarlo

// Descarga y decodifica un audio. Devuelve null si no existe o no se pudo (la carrera sigue con la voz del teléfono).
async function cargar(voz, clave) {
    const url = direccion(voz, clave);
    if (buffers.has(url)) return buffers.get(url);
    const motor = motorDeAudio();
    let buffer = null;
    try {
        const respuesta = await fetch(url);
        if (respuesta.ok && motor) {
            const datos = await respuesta.arrayBuffer();
            // Safari viejo solo entiende la versión con «callback» de decodeAudioData.
            buffer = await new Promise((ok, falla) => { const p = motor.decodeAudioData(datos, ok, falla); p?.then?.(ok, falla); });
        }
    } catch {
        buffer = null;
    }
    buffers.set(url, buffer);
    return buffer;
}

// El audio solo arranca tras un toque del usuario: se llama desde «Empezar» y «Probar la voz».
export function despertar() {
    const motor = motorDeAudio();
    return motor && motor.state !== "running" ? motor.resume().catch(() => {}) : Promise.resolve();
}

export function callar() {
    for (const fuente of sonando) { try { fuente.stop(); } catch { /* ya terminó */ } }
    sonando = [];
}

// Reproduce las claves una tras otra (con un respiro entre ellas). true si pudo; false si faltó algún audio
// (entonces no suena nada y quien llama usa la voz del teléfono).
export async function decir(voz, claves, { hueco = 0.14 } = {}) {
    const motor = motorDeAudio();
    if (!motor || !esGrabada(voz) || !claves?.length) return false;
    await despertar();
    const piezas = await Promise.all(claves.map((clave) => cargar(voz, clave)));
    if (piezas.some((p) => !p)) return false;
    callar();   // si aún hablaba el aviso anterior, se calla
    let inicio = motor.currentTime + 0.05;
    for (const buffer of piezas) {
        const fuente = motor.createBufferSource();
        fuente.buffer = buffer;
        fuente.connect(motor.destination);
        fuente.start(inicio);
        sonando.push(fuente);
        inicio += buffer.duration + hueco;
    }
    return true;
}

// Baja todos los audios de una voz para usarla sin internet. alAvanzar(hechos, total) para mostrar el avance.
export async function descargar(voz, alAvanzar = () => {}) {
    const claves = Object.keys(TEXTOS);
    let hechos = 0;
    let faltaron = 0;
    for (let i = 0; i < claves.length; i += 8) {
        await Promise.all(claves.slice(i, i + 8).map(async (clave) => {
            try {
                const respuesta = await fetch(direccion(voz, clave));   // el service worker lo guarda en su caché
                if (!respuesta.ok) faltaron += 1;
                else await respuesta.arrayBuffer();
            } catch { faltaron += 1; }
            hechos += 1;
        }));
        alAvanzar(hechos, claves.length);
    }
    return { total: claves.length, faltaron };
}
