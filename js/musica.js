// musica.js — La música de fondo.
//
// Siete grabaciones de DOMINIO PÚBLICO o CC0 (Wikimedia Commons), recortadas para
// que se repitan sin cortes bruscos y comprimidas a MP3 mono (carpeta musica/).
// (v58) Las cuatro nuevas se repiten con un fundido cruzado entre el final y el principio, así el bucle no se nota.
//
// Cómo suena:
//   - Se usa la Web Audio API: el archivo se decodifica una vez y se repite en bucle perfecto.
//     El volumen pasa por un "GainNode" porque en el iPhone el volumen de un <audio> no se
//     puede cambiar desde la página.
//   - El navegador solo deja sonar después de un toque: app.js llama a ponerMusica() en cada
//     toque. Al salir de la app se pausa (pausar) y sigue donde iba con el próximo toque.
//   - Un archivo decodificado ocupa ~30 MB de memoria (el MP3 pesa 2 MB, pero el sonido se
//     guarda "descomprimido"): por eso solo se guardan las 2 últimas pistas usadas.
//   - En el iPhone, con navigator.audioSession = "ambient", la música se mezcla con lo que
//     estés escuchando y respeta el interruptor de silencio.
//
// Los archivos no se bajan hasta que la música suena por primera vez (sw.js los guarda
// aparte, para que funcionen sin internet y no se vuelvan a bajar en cada versión).

import { motorDeAudio } from "./sonido.js";

export const PISTAS = {
    epica: {
        nombre: "Épica", icono: "🏰", obra: "Sinfonía n.º 1 (introducción)", autor: "Johannes Brahms",
        interpretes: "Musopen Symphony", licencia: "Dominio público",
        archivo: "./musica/brahms-sinfonia-1.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Brahms_-_Symphony_No._1_in_C_minor,_Op._68_-_I._Un_poco_sostenuto_-_Allegro_-_Meno_allegro_(Musopen_Symphony).flac",
        ganancia: 1.38,   // para que las tres suenen igual de fuerte
    },
    batalla: {
        nombre: "Batalla", icono: "⚔️", obra: "Los planetas: «Marte, el que trae la guerra»", autor: "Gustav Holst",
        interpretes: "Skidmore College Orchestra", licencia: "CC0",
        archivo: "./musica/holst-marte.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Holst,_The_Planets,_Op._32_-_I._Mars,_the_Bringer_of_War.ogg",
        ganancia: 1.05,
    },
    misterio: {
        nombre: "Misterio", icono: "🌑", obra: "Peer Gynt: «En la gruta del rey de la montaña»", autor: "Edvard Grieg",
        interpretes: "Musopen Symphony", licencia: "Dominio público",
        archivo: "./musica/grieg-rey-de-la-montana.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Grieg_-_Peer_Gynt_Suite_No._1,_Op._46_-_IV._In_the_Hall_of_the_Mountain_King_(Musopen_Symphony).flac",
        ganancia: 0.77,
    },
    // (v58) Las nuevas. «lectura» suena sola al leer pergaminos, memorias y el libro.
    lectura: {
        nombre: "Lectura", icono: "📜", obra: "Gymnopédie n.º 1", autor: "Erik Satie",
        interpretes: "Robin Alciatore (Musopen)", licencia: "Dominio público",
        archivo: "./musica/satie-gymnopedia-1.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg",
        ganancia: 1.0,
    },
    alba: {
        nombre: "Alba", icono: "🌅", obra: "Peer Gynt: «La mañana»", autor: "Edvard Grieg",
        interpretes: "Orquesta Sinfónica Nacional Checa (Musopen)", licencia: "Dominio público",
        archivo: "./musica/grieg-mananita.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Musopen_-_Morning.ogg",
        ganancia: 1.0,
    },
    nocturno: {
        nombre: "Nocturno", icono: "🌙", obra: "Nocturno n.º 2, op. 9", autor: "Frédéric Chopin",
        interpretes: "Peter Johnston (Musopen)", licencia: "CC0",
        archivo: "./musica/chopin-nocturno-9-2.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Chopin_Nocturne_No._2_in_E_Flat_Major,_Op._9.ogg",
        ganancia: 1.0,
    },
    abismo: {
        nombre: "Abismo", icono: "🕳️", obra: "Una noche en el monte pelado", autor: "Modest Mussorgsky",
        interpretes: "Musopen", licencia: "Dominio público",
        archivo: "./musica/mussorgsky-noche-en-el-monte-pelado.mp3",
        fuente: "https://commons.wikimedia.org/wiki/File:Modest_Mussorgsky_-_night_on_bald_mountain.ogg",
        ganancia: 1.0,
    },
};

// ¿Qué pista toca en cada escena? (v58) Una función pura, para poder probarla.
//   pantalla: la pantalla de Hoy, Aventuras, etc. (o "historia" si se lee la historia de la Torre)
//   torre: null si la Torre está cerrada, o "torre" / "mazmorra" si hay una batalla
//   elegida: la pista que tú elegiste en Ajustes; auto: si la música cambia según la escena (Ajustes)
// Sin «auto», suena la que elegiste (y en la Torre y la Mazmorra, las de siempre).
export const PANTALLAS_DE_LECTURA = ["pergamino", "biblioteca", "memorias", "libro", "pacto", "historia", "novela"];
export function pistaDeEscena({ pantalla, torre = null, elegida = "epica", auto = true }) {
    if (torre) return torre === "mazmorra" ? (auto ? "abismo" : "misterio") : "batalla";
    if (!auto) return elegida;
    if (PANTALLAS_DE_LECTURA.includes(pantalla)) return "lectura";
    if (pantalla === "diario") return "nocturno";
    if (pantalla === "mapa" || pantalla === "voces") return "alba";
    return elegida;
}

const VOLUMEN_BASE = 0.5;     // la música va por debajo de los efectos de sonido
const FUNDIDO = 1.2;          // segundos que tarda en subir o bajar el volumen

let sonando = null;           // { pista, fuente, ganancia }
let cargando = null;          // la pista que se está bajando
const decodificadas = new Map();   // pista → AudioBuffer (para no decodificar dos veces)

// En el iPhone (Safari 16.4+): mezclarse con otra música y respetar el modo silencio.
function sesionAmbiente() {
    try {
        if (navigator.audioSession) navigator.audioSession.type = "ambient";
    } catch { /* no importa */ }
}

async function decodificar(clave, motor) {
    let buffer = decodificadas.get(clave);
    if (!buffer) {
        const respuesta = await fetch(PISTAS[clave].archivo);
        if (!respuesta.ok) throw new Error("No se pudo cargar la música.");
        const datos = await respuesta.arrayBuffer();
        // decodeAudioData con promesa (Safari viejo solo acepta callbacks: por eso el envoltorio).
        buffer = await new Promise((listo, fallo) => motor.decodeAudioData(datos, listo, fallo));
    }
    // La usada de último va al final; si hay más de 2, se suelta la más vieja.
    decodificadas.delete(clave);
    decodificadas.set(clave, buffer);
    if (decodificadas.size > 2) decodificadas.delete(decodificadas.keys().next().value);
    return buffer;
}

// Que suene la pista (si ya suena esa, solo ajusta el volumen). volumen: de 0 a 1.
export async function reproducir(clave, volumen) {
    const motor = motorDeAudio();
    if (!motor || !PISTAS[clave]) return;
    sesionAmbiente();
    if (motor.state !== "running") await motor.resume().catch(() => {});
    if (sonando?.pista === clave) {
        ajustarVolumen(volumen);
        return;
    }
    if (cargando === clave) return;
    cargando = clave;
    try {
        const buffer = await decodificar(clave, motor);
        if (cargando !== clave) return;   // mientras bajaba, elegiste otra o la apagaste
        detener();
        const fuente = motor.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = true;
        const ganancia = motor.createGain();
        ganancia.gain.setValueAtTime(0.0001, motor.currentTime);
        ganancia.gain.linearRampToValueAtTime(objetivo(clave, volumen), motor.currentTime + FUNDIDO);
        fuente.connect(ganancia);
        ganancia.connect(motor.destination);
        fuente.start();
        sonando = { pista: clave, fuente, ganancia };
    } catch {
        // Sin internet la primera vez, o el teléfono no pudo: se intenta en el próximo toque.
    } finally {
        if (cargando === clave) cargando = null;
    }
}

function objetivo(clave, volumen) {
    return Math.max(0.0001, VOLUMEN_BASE * PISTAS[clave].ganancia * Math.min(1, Math.max(0, volumen)));
}

export function ajustarVolumen(volumen) {
    if (!sonando) return;
    const motor = motorDeAudio();
    sonando.ganancia.gain.cancelScheduledValues(motor.currentTime);
    sonando.ganancia.gain.setTargetAtTime(objetivo(sonando.pista, volumen), motor.currentTime, 0.15);
}

// Apagar con un fundido corto.
export function detener() {
    cargando = null;
    if (!sonando) return;   // (así no se crea el motor de audio sin necesidad)
    const motor = motorDeAudio();
    const { fuente, ganancia } = sonando;
    sonando = null;
    ganancia.gain.cancelScheduledValues(motor.currentTime);
    ganancia.gain.setTargetAtTime(0.0001, motor.currentTime, 0.25);
    fuente.stop(motor.currentTime + 1);
}

// Pausar (al salir de la app): se duerme el motor de audio; reproducir() lo despierta.
export function pausar() {
    const motor = sonando ? motorDeAudio() : null;
    if (motor && motor.state === "running") motor.suspend().catch(() => {});
}

export function estaSonando() {
    return Boolean(sonando);
}

// (v59) Baja las pistas de escena en segundo plano (una tras otra, sin decodificarlas) para que el cambio de escena
// sea inmediato y no espere a una descarga. sw.js las guarda en su caché de música. Si el teléfono ahorra datos, no.
let precargadas = false;
export function precargar(claves) {
    if (precargadas || navigator.connection?.saveData) return;
    precargadas = true;
    (async () => {
        for (const clave of claves) {
            try { if (PISTAS[clave]) await fetch(PISTAS[clave].archivo); } catch { /* sin internet: se intentará al sonar */ }
        }
    })();
}

// Qué pista suena ahora (o null). Sirve para comprobar que cambió de escena.
export function pistaActual() {
    return sonando?.pista || null;
}
