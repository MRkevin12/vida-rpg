// frases.js — Todo lo que dice la voz de la carrera (v128): números, avisos de criaturas y frases de motivación.
//
// Cada pieza es { k: clave del audio, t: texto }. Con una VOZ GRABADA (carpeta locutor/<voz>/<clave>.mp3) se reproducen los audios;
// con la voz del teléfono se lee el texto. `TEXTOS` es la lista completa de audios que hay que generar
// (herramientas/generar-voces.py la lee con herramientas/lista-de-clips.mjs). Si cambias un texto, vuelve a generar los audios.
// Aquí solo hay datos y funciones puras (sin audio ni pantalla).

import * as bestiario from "./bestiario.js";
import { ZONAS, CLASES } from "./encuentros.js";

// ===== Números en palabras (0 a 99) =====
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince",
    "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis",
    "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };

export function numeroEnPalabras(n) {
    if (n < 30) return UNIDADES[n];
    const resto = n % 10;
    return resto ? `${DECENAS[Math.floor(n / 10)]} y ${UNIDADES[resto]}` : DECENAS[n / 10];
}

// Delante de un sustantivo masculino: «un minuto», «veintiún segundos», «treinta y un minutos».
const antesDeSustantivo = (n) => numeroEnPalabras(n).replace(/veintiuno$/, "veintiún").replace(/\buno$/, "un");

export const MAX_KM = 60;
export const MAX_MIN = 30;
export const textoKm = (n) => `Kilómetro ${numeroEnPalabras(n)}.`;
export const textoMin = (n) => `${antesDeSustantivo(n)} ${n === 1 ? "minuto" : "minutos"}`;
export const textoSeg = (n) => `${antesDeSustantivo(n)} ${n === 1 ? "segundo" : "segundos"}`;

// ===== Criaturas =====
const idsDeLaCarrera = () => {
    const zonas = new Set(ZONAS.map((z) => z.criaturas));
    return Object.entries(bestiario.CRIATURAS).filter(([, c]) => zonas.has(c.zona) && !c.espejo).map(([id, c]) => ({ id, ...c }));
};
const articulo = (c, mayuscula = false) => { const a = c.genero === "f" ? "la" : "el"; return mayuscula ? a[0].toUpperCase() + a.slice(1) : a; };
const aLa = (c) => (c.genero === "f" ? "a la" : "al");

// ===== Las pistas (qué pide cada tipo de criatura) =====
export const PISTAS = {
    normal: "Mantén tu ritmo objetivo todo el kilómetro.",
    rapida: "Acelera los últimos doscientos metros.",
    pesada: "Ritmo parejo: la segunda mitad igual que la primera.",
    fantasma: "No te detengas, o se esfuma.",
    jefe: "Termina este kilómetro a tu ritmo objetivo, sin pausas.",
    emboscada: "Corre este kilómetro a ritmo de tempo, un cinco por ciento más rápido.",
};

// ===== Frases de motivación =====
export const FRASES = {
    inicio: [
        "¡Vamos, héroe! El camino te espera.",
        "Respira hondo y empieza suave. Hoy sumas otro paso.",
        "Cada kilómetro es una victoria. Empecemos.",
        "Nadie lo hará por ti, y por eso vale la pena.",
        "El reino se recorre paso a paso. ¡A correr!",
        "Tu yo de mañana te lo va a agradecer.",
        "No necesitas ganas, solo empezar.",
        "Que hoy suene tu música y tu paso.",
        "Calienta el cuerpo, enfoca la mente. ¡Allá vamos!",
        "Hoy no corres contra nadie, solo contra tu excusa.",
    ],
    km: [
        "¡Bien hecho! Un kilómetro más en tu historia.",
        "Sigue así, vas muy bien.",
        "Tu cuerpo puede más de lo que tu mente cree.",
        "Un paso a la vez, y ya vas lejos.",
        "Respira profundo y relaja los hombros.",
        "Constancia, no velocidad. Eso es lo que cuenta.",
        "Cada kilómetro te acerca a tu mejor versión.",
        "Lo difícil ya lo hiciste: salir de casa.",
        "Mantén la cabeza arriba y la mirada al frente.",
        "Qué buen ritmo llevas, héroe.",
        "Siente tus pasos, siente tu fuerza.",
        "No pares ahora, tu futuro te está mirando.",
        "El dolor de hoy es la fuerza de mañana.",
        "Tú puedes con esto y con mucho más.",
        "Suelta la tensión de los brazos y sigue.",
        "Eres más fuerte de lo que piensas.",
        "Un kilómetro más y la Torre te lo reconoce.",
        "La disciplina vence al talento cuando el talento no corre.",
        "Corre con ganas, pero también con cabeza.",
        "Cada zancada cuenta.",
        "Esto es tuyo. Nadie te lo quita.",
        "Mira cuánto has avanzado desde que empezaste.",
        "Respira por la nariz y saca el aire por la boca.",
        "Hoy estás construyendo al héroe que quieres ser.",
        "Las piernas se cansan, pero la voluntad no.",
        "Vas increíble. Que no se te olvide.",
        "Aprieta un poquito el paso, tú sabes que puedes.",
        "Ya casi, ya casi… siempre es ya casi.",
        "Este es el momento en que se forjan los fuertes.",
        "Orgulloso de ti. Sigue adelante.",
    ],
    vencida: [
        "¡Esa fue una gran pelea!",
        "¡Cayó! Tu ritmo fue letal.",
        "¡Eso es! Así se corre.",
        "¡Victoria! Sigue con esa energía.",
        "Una criatura menos en tu camino.",
        "¡Qué ritmo tan bueno! Nada te detiene.",
        "¡Lo lograste! El reino te lo agradece.",
        "¡Impecable! Mantén esa cadencia.",
        "¡Así se hace, campeón!",
        "Tu constancia derrotó al enemigo.",
        "¡Otra más para tu bestiario!",
        "¡Qué fuerza! Sigue así.",
    ],
    escapo: [
        "Se escapó, pero ya vendrá otra. Tú sigue.",
        "No pasa nada, la próxima la alcanzas.",
        "Un mal kilómetro no define tu carrera.",
        "Respira y recupera tu ritmo.",
        "La constancia te hace ganar. Sigue.",
        "Aprende y vuelve más fuerte.",
        "No pierdes nada: la siguiente es tuya.",
        "Ajusta tu paso, tú puedes.",
        "Que no te desanime: estás corriendo, y eso ya es ganar.",
        "Tranquilo, el siguiente kilómetro es una nueva oportunidad.",
    ],
    lento: [
        "Un poquito más de ritmo, que se te escapa.",
        "Acelera un poco, vas justo.",
        "Aprieta el paso, la criatura se te va.",
        "Ánimo, sube un poquito la cadencia.",
        "Es el momento de apretar, tú puedes.",
        "Levanta las rodillas y acelera suave.",
        "Un esfuerzo más y la alcanzas.",
        "No aflojes, ya vas por la mitad.",
        "Mete un poco más de ritmo ahora.",
        "Respira y acelera, tú puedes.",
    ],
    jefe: [
        "Es un jefe. Concentración total.",
        "Este es el momento. Sin pausas.",
        "Respira, enfócate y demuestra de qué estás hecho.",
        "Los jefes no se rinden, tú tampoco.",
        "Un kilómetro, un jefe. Dalo todo.",
        "Hoy te toca ser leyenda.",
        "Mantén la calma y el ritmo. Tú puedes.",
        "Todo tu entrenamiento es para este momento.",
    ],
    final: [
        "¡Terminaste! Eso se celebra.",
        "Lo hiciste, héroe. Orgulloso de ti.",
        "Otra carrera en tu historia. ¡Bien hecho!",
        "Estira, respira y toma agua. Mereces el descanso.",
        "Hoy fuiste más fuerte que ayer.",
        "Cada carrera cuenta, y esta fue buena.",
        "Campeón. Sin excusas, sin pausa. Así se hace.",
        "El reino se hace más grande con cada carrera tuya.",
        "Termina bien: camina un poco para recuperar.",
        "Guarda tu carrera y recoge tu botín.",
    ],
};

// Una frase de la categoría, distinta de la última que salió de esa categoría. azar: () => número entre 0 y 1.
const ultimas = {};
export function fraseDe(categoria, azar = Math.random) {
    const lista = FRASES[categoria];
    let i = Math.floor(azar() * lista.length);
    if (lista.length > 1 && i === ultimas[categoria]) i = (i + 1) % lista.length;
    ultimas[categoria] = i;
    return { k: `f-${categoria}-${i}`, t: lista[i] };
}

// ===== Todos los audios que existen: clave → texto =====
export const TEXTOS = (() => {
    const t = {};
    for (let n = 1; n <= MAX_KM; n++) t[`km-${n}`] = textoKm(n);
    for (let n = 1; n <= MAX_MIN; n++) t[`min-${n}`] = textoMin(n);
    for (let n = 1; n <= 59; n++) t[`seg-${n}`] = textoSeg(n);
    for (const c of idsDeLaCarrera()) {
        const nombre = `${articulo(c)} ${c.nombre}`;
        if (c.guardian) t[`apj-${c.id}`] = `¡Cuidado! Aparece un jefe: ${c.nombre}.`;
        else {
            t[`ap-${c.id}`] = `Aparece ${nombre}.`;
            t[`ape-${c.id}`] = `¡Emboscada! ${articulo(c, true)} ${c.nombre} te sale al paso.`;
        }
        t[`ven-${c.id}`] = `¡Venciste ${aLa(c)} ${c.nombre}!`;
        t[`esc-${c.id}`] = `${articulo(c, true)} ${c.nombre} escapó.`;
    }
    for (const [clave, texto] of Object.entries(PISTAS)) t[`pista-${clave}`] = texto;
    for (const [cat, lista] of Object.entries(FRASES)) lista.forEach((texto, i) => { t[`f-${cat}-${i}`] = texto; });
    t["prueba"] = "Así sonará tu voz durante la carrera.";
    return t;
})();

// ===== Los anuncios (listas de piezas) =====
const pieza = (k) => ({ k, t: TEXTOS[k] });
// Un número fuera de lo grabado se lee con la voz del teléfono: la pieza queda sin clave (k: null) y todo el aviso cae al texto.
const o = (k, t) => (TEXTOS[k] ? pieza(k) : { k: null, t });

// El tiempo de un kilómetro: «cinco minutos, doce segundos».
export function piezasDeTiempo(segundos) {
    const s = Math.round(segundos);
    const m = Math.floor(s / 60);
    const resto = s % 60;
    const piezas = [];
    if (m) piezas.push(o(`min-${m}`, textoMin(m)));
    if (resto || !m) piezas.push(o(`seg-${resto}`, textoSeg(resto)));
    return piezas;
}

const piezaDeCriatura = (prefijo, id, texto) => o(`${prefijo}-${id}`, texto);

// La criatura que aparece (al empezar y al cumplir cada km).
export function piezasDeAparicion(encuentro) {
    const c = bestiario.CRIATURAS[encuentro.id];
    const nombre = c?.nombre || "una criatura";
    const prefijo = encuentro.jefe ? "apj" : encuentro.emboscada ? "ape" : "ap";
    const texto = encuentro.jefe ? `Aparece un jefe: ${nombre}.` : encuentro.emboscada ? `¡Emboscada! ${nombre} te sale al paso.` : `Aparece ${nombre}.`;
    const clase = encuentro.jefe ? "jefe" : encuentro.emboscada ? "emboscada" : encuentro.clase;
    return [piezaDeCriatura(prefijo, encuentro.id, texto), pieza(`pista-${clase}`)];
}

// La pelea que terminó: venciste o escapó, y una frase.
export function piezasDeFin(pelea, azar = Math.random) {
    const c = bestiario.CRIATURAS[pelea.id];
    const nombre = c?.nombre || "la criatura";
    const vencida = pelea.resultado === "vencida";
    return [
        piezaDeCriatura(vencida ? "ven" : "esc", pelea.id, vencida ? `¡Venciste a ${nombre}!` : `${nombre} escapó.`),
        fraseDe(vencida ? "vencida" : "escapo", azar),
    ];
}

// Todo lo que se dice al cumplir un kilómetro.
export function anuncioDeKm(numero, segundos, pelea, siguiente, azar = Math.random) {
    const piezas = [o(`km-${numero}`, textoKm(numero)), ...piezasDeTiempo(segundos)];
    if (pelea) piezas.push(...piezasDeFin(pelea, azar));
    else piezas.push(fraseDe("km", azar));
    if (siguiente) {
        piezas.push(...piezasDeAparicion(siguiente));
        if (siguiente.jefe) piezas.push(fraseDe("jefe", azar));
    }
    return piezas;
}

export function anuncioDeInicio(primera, azar = Math.random) {
    return [fraseDe("inicio", azar), ...(primera ? piezasDeAparicion(primera) : [])];
}

export const anuncioDeLento = (azar = Math.random) => [fraseDe("lento", azar)];
export const anuncioFinal = (azar = Math.random) => [fraseDe("final", azar)];
export const anuncioDePrueba = (azar = Math.random) => [pieza("prueba"), o("km-3", textoKm(3)), ...piezasDeTiempo(312), fraseDe("km", azar)];

// De una lista de piezas: las claves (o null si alguna no tiene audio) y el texto para la voz del teléfono.
export function resumirPiezas(piezas) {
    const conPunto = (t) => (/[.!?…:]$/.test(t) ? t : `${t}.`);
    return { claves: piezas.every((p) => p.k) ? piezas.map((p) => p.k) : null, texto: piezas.map((p) => conPunto(p.t)).join(" ") };
}

export { CLASES };
