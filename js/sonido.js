// sonido.js — Sonidos cortos hechos con código (sin archivos de audio).
//
// Usamos la "Web Audio API" del navegador: un oscilador produce un tono
// (como una nota de teclado) y una ganancia controla su volumen.
// Cada sonido es una lista de notas: [frecuencia en Hz, cuándo empieza, cuánto dura].
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
};

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
    if (!sonido) return;
    const pedido = performance.now();
    Promise.resolve(despertar()).then(() => {
        // Si el motor tardó en despertar, el momento ya pasó: mejor no sonar tarde.
        if (!contexto || contexto.state !== "running" || performance.now() - pedido > 300) return;
        tocarNotas(sonido);
    }).catch(() => {});
}

function tocarNotas(sonido) {
    const ahora = contexto.currentTime;
    for (const [frecuencia, inicio, duracion] of sonido.notas) {
        const oscilador = contexto.createOscillator();
        const ganancia = contexto.createGain();
        oscilador.type = sonido.onda;
        oscilador.frequency.value = frecuencia;
        // El volumen sube de golpe y baja suave, para que no suene a "clic".
        ganancia.gain.setValueAtTime(0.0001, ahora + inicio);
        ganancia.gain.linearRampToValueAtTime(sonido.volumen, ahora + inicio + 0.01);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + duracion);
        oscilador.connect(ganancia);
        ganancia.connect(contexto.destination);
        oscilador.start(ahora + inicio);
        oscilador.stop(ahora + inicio + duracion + 0.02);
    }
}
