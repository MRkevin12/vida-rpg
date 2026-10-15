// sonido.js — Sonidos cortos hechos con código (sin archivos de audio).
//
// Usamos la "Web Audio API" del navegador: un oscilador produce un tono
// (como una nota de teclado) y una ganancia controla su volumen.
// Cada sonido es una lista de notas: [frecuencia en Hz, cuándo empieza, cuánto dura, frecuencia final (opcional)].
// Si hay frecuencia final, la nota se desliza de una a otra (un rugido que baja, un chillido que sube).
// (v58) Un sonido también puede llevar `ruido`: ráfagas de «ssshh» filtradas, para soplidos, golpes y chispas:
//   [cuándo empieza, cuánto dura, filtro en Hz, volumen, filtro final (opcional), tipo ("lowpass" | "highpass" | "bandpass")]
//
// Como no hay archivos, funciona sin internet y no ocupa espacio.
// En el iPhone, si el interruptor lateral está en silencio, no suena (es lo normal).

const SONIDOS = {
    completar: { onda: "triangle", volumen: 0.22, notas: [[660, 0, 0.09], [990, 0.08, 0.16]] },
    desmarcar: { onda: "triangle", volumen: 0.16, notas: [[440, 0, 0.08], [330, 0.07, 0.14]] },
    moneda:    { onda: "square",   volumen: 0.07, notas: [[1319, 0, 0.06], [1760, 0.06, 0.18]] },
    logro:     { onda: "triangle", volumen: 0.22, notas: [[523, 0, 0.1], [784, 0.1, 0.1], [1047, 0.2, 0.3]] },
    nivel:     { onda: "triangle", volumen: 0.24, notas: [[523, 0, 0.12], [659, 0.11, 0.12], [784, 0.22, 0.12], [1047, 0.33, 0.4]] },
    // Jefe derrotado: un golpe grave y luego una fanfarria.
    victoria:  { onda: "sawtooth", volumen: 0.1,  notas: [[98, 0, 0.25], [392, 0.2, 0.14], [494, 0.33, 0.14], [587, 0.46, 0.14], [784, 0.6, 0.5]] },
    // Minijuegos
    salto:     { onda: "square",   volumen: 0.05, notas: [[330, 0, 0.05], [495, 0.04, 0.08]] },
    impacto:   { onda: "sawtooth", volumen: 0.14, notas: [[160, 0, 0.07], [80, 0.05, 0.16]] },
    fallo:     { onda: "sawtooth", volumen: 0.1,  notas: [[196, 0, 0.12], [131, 0.1, 0.25]] },
    // «El cuerno»: el toque propio de Vida RPG cuando llega un aviso con la app abierta.
    aviso:     { onda: "sawtooth", volumen: 0.11, notas: [[196, 0, 0.2], [262, 0.17, 0.2], [330, 0.34, 0.2], [392, 0.51, 0.7]] },
    // El cofre del día: madera que cruje y un brillo que sube.
    cofre:     { onda: "triangle", volumen: 0.2,  notas: [[110, 0, 0.12], [123, 0.14, 0.12], [784, 0.75, 0.12], [988, 0.85, 0.12], [1319, 0.95, 0.35]] },
    // El dragón contento: un ronroneo grave.
    ronroneo:  { onda: "triangle", volumen: 0.18, notas: [[82, 0, 0.18], [87, 0.16, 0.18], [82, 0.32, 0.25]] },
    // Golpe crítico: un tajo seco y un brillo agudo.
    critico:   { onda: "sawtooth", volumen: 0.14, notas: [[220, 0, 0.06], [110, 0.05, 0.12], [1568, 0.12, 0.25]] },
    // Robo de vida: el golpe del jefe, tu vida que se escapa (notas que bajan) y su gruñido al curarse.
    robo:      { onda: "sawtooth", volumen: 0.11, notas: [[98, 0.38, 0.14], [370, 0.78, 0.12], [311, 0.9, 0.12], [262, 1.02, 0.12], [208, 1.14, 0.3], [82, 1.7, 0.45]] },
    // Desafío relámpago: un chispazo que sube.
    relampago: { onda: "square",   volumen: 0.06, notas: [[880, 0, 0.05], [1320, 0.05, 0.05], [1760, 0.1, 0.18]] },
    // La Torre: el "bip" del menú y los tres hechizos (el fuego ruge grave, el hielo
    // tintinea agudo y el rayo chasquea de arriba abajo).
    cursor:    { onda: "square",   volumen: 0.05, notas: [[988, 0, 0.04], [1319, 0.035, 0.06]] },
    fuego:     { onda: "sawtooth", volumen: 0.11, notas: [[110, 0, 0.14], [147, 0.1, 0.14], [196, 0.2, 0.14], [262, 0.3, 0.28]] },
    hielo:     { onda: "triangle", volumen: 0.16, notas: [[1568, 0, 0.08], [2093, 0.07, 0.08], [1760, 0.14, 0.08], [2637, 0.21, 0.3]] },
    rayo:      { onda: "square",   volumen: 0.07, notas: [[1976, 0, 0.04], [247, 0.04, 0.12], [1568, 0.17, 0.04], [123, 0.21, 0.3]] },
    // La Mazmorra (v29): el veneno burbujea (dos notas que bajan, como un trago amargo) y la
    // coraza suena a metal que se cierra.
    veneno:    { onda: "triangle", volumen: 0.16, notas: [[523, 0, 0.07], [494, 0.08, 0.07], [311, 0.18, 0.22]] },
    coraza:    { onda: "square",   volumen: 0.06, notas: [[196, 0, 0.05], [1175, 0.04, 0.05], [988, 0.1, 0.2]] },
    // Las cinemáticas (v43): un retumbo grave que sube del suelo y una campana que resuena.
    retumbo:   { onda: "sawtooth", volumen: 0.13, notas: [[55, 0, 0.5], [49, 0.15, 0.6], [41, 0.4, 0.9]] },
    campana:   { onda: "triangle", volumen: 0.16, notas: [[392, 0, 1.0], [784, 0, 0.7], [1175, 0.02, 0.45]] },

    // ===== (v58) La Torre y la Mazmorra: tus golpes, los ataques especiales y tu mascota =====
    // Tu espada: un tajo que silba y un golpe de metal.
    tajo:      { onda: "sawtooth", volumen: 0.07, notas: [[1100, 0, 0.09, 220], [180, 0.1, 0.1, 90]], ruido: [[0, 0.14, 3200, 0.22, 900, "bandpass"]] },
    // Una poción: tres tragos que suben.
    pocion:    { onda: "triangle", volumen: 0.14, notas: [[300, 0, 0.08, 520], [360, 0.11, 0.08, 620], [430, 0.22, 0.12, 760]] },
    // Los ataques especiales de las criaturas: cada uno suena distinto, para reconocerlo con los ojos cerrados.
    drenar:    { onda: "sawtooth", volumen: 0.1,  notas: [[140, 0, 0.5, 520], [90, 0.5, 0.25, 60]], ruido: [[0, 0.5, 400, 0.18, 1800, "bandpass"]] },
    sellar:    { onda: "triangle", volumen: 0.12, notas: [[1250, 0.04, 0.05], [940, 0.14, 0.05], [1560, 0.24, 0.2, 780]], ruido: [[0, 0.06, 5000, 0.3, 5000, "highpass"], [0.1, 0.06, 5000, 0.3, 5000, "highpass"], [0.2, 0.06, 5000, 0.3, 5000, "highpass"]] },
    barrera:   { onda: "triangle", volumen: 0.12, notas: [[880, 0, 0.35, 1760], [1320, 0.06, 0.4, 2640], [660, 0.12, 0.45, 1320]] },
    carga:     { onda: "sawtooth", volumen: 0.08, notas: [[110, 0, 1.0, 440], [220, 0.25, 0.8, 880]], ruido: [[0, 1.0, 300, 0.12, 2400, "bandpass"]] },
    descarga:  { onda: "sawtooth", volumen: 0.2,  notas: [[70, 0, 0.55, 28], [2200, 0, 0.05, 110]], ruido: [[0, 0.55, 900, 0.45, 80, "lowpass"]] },
    reflejo:   { onda: "triangle", volumen: 0.12, notas: [[1568, 0, 0.1], [2093, 0.08, 0.1], [1568, 0.16, 0.25, 784]] },
    // Tu mascota, según quién sea.
    rugidito:  { onda: "sawtooth", volumen: 0.1,  notas: [[260, 0, 0.3, 110]], ruido: [[0, 0.3, 700, 0.18, 300, "lowpass"]] },
    graznido:  { onda: "square",   volumen: 0.06, notas: [[720, 0, 0.1, 520], [680, 0.13, 0.12, 440]] },
    ulular:    { onda: "triangle", volumen: 0.14, notas: [[420, 0, 0.2], [330, 0.26, 0.4]] },
    siseo:     { onda: "triangle", volumen: 0.02, notas: [[200, 0, 0.5]], ruido: [[0, 0.55, 5500, 0.28, 5500, "highpass"]] },
    chillido:  { onda: "square",   volumen: 0.06, notas: [[1900, 0, 0.3, 1000]] },
    fenix:     { onda: "triangle", volumen: 0.16, notas: [[784, 0, 0.15], [988, 0.12, 0.15], [1319, 0.24, 0.45]] },
};

// ===== (v58) Las voces de las criaturas =====
// Cada criatura pertenece a una «familia» que decide cómo suena. Una familia es un sonido básico
// (onda, nota grave y el ruido que lo acompaña); de ahí salen sus cuatro momentos:
//   aparece (llega al piso) · ataque · herido (le pegas) · cae (la derrotas).
const FAMILIAS = {
    chillido:  { onda: "square",   base: 1500, vol: 0.05, ruido: [4500, 0.16, 2500, "bandpass"] },            // murciélagos, aves, voces agudas
    hueso:     { onda: "square",   base: 260,  vol: 0.07, trillo: 3, ruido: [3500, 0.2, 3500, "highpass"] },   // esqueletos y madera que cruje
    baba:      { onda: "sawtooth", base: 95,   vol: 0.1,  trillo: 2, ruido: [500, 0.25, 250, "lowpass"] },     // lo viscoso, lo húmedo
    bicho:     { onda: "square",   base: 950,  vol: 0.04, trillo: 5, ruido: [6000, 0.18, 6000, "highpass"] },  // picadas, pinzas y siseos
    espectral: { onda: "triangle", base: 520,  vol: 0.13, vibrato: true, ruido: [1800, 0.08, 900, "bandpass"] }, // fantasmas y lamentos
    bestia:    { onda: "sawtooth", base: 140,  vol: 0.1,  ruido: [900, 0.2, 350, "bandpass"] },               // gruñidos
    fuego:     { onda: "sawtooth", base: 85,   vol: 0.09, ruido: [1400, 0.4, 200, "lowpass"] },               // llamas
    metal:     { onda: "square",   base: 120,  vol: 0.07, ruido: [2500, 0.3, 600, "bandpass"], campana: 640 },   // armaduras y piedra
    cristal:   { onda: "triangle", base: 2100, vol: 0.12, campana: 2800, ruido: [7000, 0.05, 7000, "highpass"] }, // hielo y espejos
    viento:    { onda: "sine",     base: 300,  vol: 0.04, ruido: [500, 0.4, 2600, "bandpass"] },               // ráfagas
    rugido:    { onda: "sawtooth", base: 95,   vol: 0.14, ruido: [800, 0.4, 150, "lowpass"] },                 // dragones y jefes enormes
    ojo:       { onda: "sine",     base: 240,  vol: 0.14, vibrato: true },                                     // zumbidos
};

// Qué familia es cada criatura de la Torre y de la Mazmorra (una prueba revisa que no falte ninguna).
export const FAMILIA_DE_CRIATURA = {
    murcielago: "chillido", esqueleto: "hueso", cieno: "baba", arana: "bicho", caballero: "metal",
    ojo: "ojo", grimorio: "espectral", espectro: "espectral", gargola: "bestia", liche: "espectral",
    ascua: "fuego", "cieno-magma": "baba", golem: "metal", mimico: "bestia", demonio: "fuego",
    cristal: "cristal", "ala-trueno": "chillido", sierpe: "bicho", centinela: "metal", dragon: "rugido",
    arpia: "chillido", nubarron: "viento", esfinge: "bestia", "espiritu-viento": "viento", "coloso-nubes": "metal",
    "vigia-caido": "hueso", "llama-negra": "fuego", espejo: "cristal", "ojo-corona": "ojo", apagador: "metal",
    sanguijuela: "baba", ahogado: "espectral", aguaviva: "baba", cangrejo: "bicho", kraken: "rugido",
    hongo: "baba", escorpion: "bicho", gusano: "baba", raiz: "hueso", arbol: "rugido",
    acolito: "espectral", can: "bestia", sacerdotisa: "espectral", sabueso: "bestia", reflejo: "espectral",
    "heraldo-cuerpo": "rugido", "heraldo-mente": "ojo", "heraldo-voz": "chillido", "heraldo-tesoro": "metal", "rey-hueco": "rugido",
};

export const MOMENTOS_DE_VOZ = ["aparece", "ataque", "herido", "cae"];

// El sonido de una familia en ese momento (un objeto como los de SONIDOS).
export function sonidoDeVoz(familia, momento) {
    const f = FAMILIAS[familia];
    if (!f || !MOMENTOS_DE_VOZ.includes(momento)) return null;
    const b = f.base;
    // [nota inicial, nota final, duración] de cada momento.
    const [desde, hasta, dur] = {
        aparece: [b * 0.55, b * 1.05, 0.5],
        ataque: [b * 1.3, b * 0.7, 0.24],
        herido: [b * 0.9, b * 1.6, 0.15],
        cae: [b, b * 0.3, 0.8],
    }[momento];
    const notas = [];
    if (f.trillo) {
        // Una serie de golpecitos (huesos, patas, pinzas) en vez de un solo tono.
        const golpes = momento === "cae" ? f.trillo + 2 : f.trillo;
        for (let i = 0; i < golpes; i++) notas.push([b * (i % 2 ? 0.8 : 1.2), i * 0.055, 0.04, b * (i % 2 ? 0.6 : 1)]);
    } else if (f.vibrato) {
        // Una nota que tiembla: dos tonos casi iguales que se mezclan.
        notas.push([desde, 0, dur, hasta], [desde * 1.03, 0, dur, hasta * 1.03]);
    } else {
        notas.push([desde, 0, dur, hasta]);
    }
    if (f.campana) notas.push([f.campana, 0.01, momento === "cae" ? 0.9 : 0.3]);
    const ruido = f.ruido ? [[0, dur, f.ruido[0], f.ruido[1], f.ruido[2], f.ruido[3]]] : [];
    return { onda: f.onda, volumen: f.vol * (momento === "cae" ? 1.15 : momento === "herido" ? 0.9 : 1), notas, ruido };
}

// Suena la voz de una criatura (por su id) en ese momento. Una criatura sin familia no suena.
export function sonarVoz(criatura, momento) {
    const sonido = sonidoDeVoz(FAMILIA_DE_CRIATURA[criatura], momento);
    if (sonido) reproducirSonido(sonido);
}

// ¿Existe un sonido con ese nombre? (las cinemáticas piden los suyos por nombre y hay una prueba que lo comprueba)
export const existeSonido = (nombre) => Object.hasOwn(SONIDOS, nombre);

let contexto = null;   // el "motor" de audio; se crea la primera vez que hace falta

// El navegador solo deja sonar después de que tocas la pantalla.
// app.js llama a despertar() en cada toque: crea el motor (la primera vez)
// y lo reanuda si el teléfono lo había dormido.
export function despertar() {
    const motor = motorDeAudio();
    if (motor && motor.state !== "running") return motor.resume().catch(() => {});
    return Promise.resolve();
}

// El motor de audio (lo comparte la música de fondo: ver musica.js). null si no hay audio.
export function motorDeAudio() {
    try {
        const Motor = window.AudioContext || window.webkitAudioContext;
        if (!contexto) contexto = new Motor();
        return contexto;
    } catch {
        return null;   // si el navegador no deja usar audio, la app sigue igual, sin sonido
    }
}

export function sonar(nombre) {
    const sonido = SONIDOS[nombre];
    if (sonido) reproducirSonido(sonido);
}

function reproducirSonido(sonido) {
    const pedido = performance.now();
    Promise.resolve(despertar()).then(() => {
        // Si el motor tardó en despertar, el momento ya pasó: mejor no sonar tarde.
        if (!contexto || contexto.state !== "running" || performance.now() - pedido > 300) return;
        tocarNotas(sonido);
    }).catch(() => {});
}

// Un segundo de «ssshh» (ruido blanco), que se reutiliza para todos los soplidos y golpes.
let ruidoBlanco = null;
function bufferDeRuido() {
    if (!ruidoBlanco) {
        ruidoBlanco = contexto.createBuffer(1, contexto.sampleRate, contexto.sampleRate);
        const datos = ruidoBlanco.getChannelData(0);
        for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    }
    return ruidoBlanco;
}

function tocarNotas(sonido) {
    const ahora = contexto.currentTime;
    for (const [frecuencia, inicio, duracion, final] of sonido.notas) {
        const oscilador = contexto.createOscillator();
        const ganancia = contexto.createGain();
        oscilador.type = sonido.onda;
        oscilador.frequency.setValueAtTime(frecuencia, ahora + inicio);
        // Con frecuencia final, la nota se desliza hasta ella.
        if (final) oscilador.frequency.exponentialRampToValueAtTime(Math.max(20, final), ahora + inicio + duracion);
        // El volumen sube de golpe y baja suave, para que no suene a "clic".
        ganancia.gain.setValueAtTime(0.0001, ahora + inicio);
        ganancia.gain.linearRampToValueAtTime(sonido.volumen, ahora + inicio + 0.01);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + duracion);
        oscilador.connect(ganancia);
        ganancia.connect(contexto.destination);
        oscilador.start(ahora + inicio);
        oscilador.stop(ahora + inicio + duracion + 0.02);
    }
    for (const [inicio, duracion, filtro, volumen, filtroFinal, tipo = "bandpass"] of sonido.ruido || []) {
        const fuente = contexto.createBufferSource();
        const pasa = contexto.createBiquadFilter();
        const ganancia = contexto.createGain();
        fuente.buffer = bufferDeRuido();
        fuente.loop = true;
        pasa.type = tipo;
        pasa.frequency.setValueAtTime(filtro, ahora + inicio);
        if (filtroFinal && filtroFinal !== filtro) pasa.frequency.exponentialRampToValueAtTime(Math.max(20, filtroFinal), ahora + inicio + duracion);
        ganancia.gain.setValueAtTime(0.0001, ahora + inicio);
        ganancia.gain.linearRampToValueAtTime(volumen, ahora + inicio + 0.012);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + duracion);
        fuente.connect(pasa);
        pasa.connect(ganancia);
        ganancia.connect(contexto.destination);
        fuente.start(ahora + inicio);
        fuente.stop(ahora + inicio + duracion + 0.02);
    }
}
