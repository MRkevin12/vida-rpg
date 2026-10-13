// mascota.js — Lo que tu dragón hace cuando lo cuidas.
//
// Puedes acariciarlo (te responde con una frase) y alimentarlo una vez al día por unas
// monedas: comer le da ánimo y a ti te cura un poco (ver vida.js). Los días que comió se
// guardan en estado.mascota.comidas.

export const COMIDA = { precio: 15, cura: 3 };

export function comioHoy(estado, fecha) {
    return (estado.mascota.comidas || []).includes(fecha);
}

// Frases según cómo está. {n} es el nombre del dragón.
const FRASES = {
    huevo: [
        "El huevo se mueve un poco bajo tu mano.",
        "Sientes calor dentro del cascarón: algo crece ahí.",
        "Un golpecito desde adentro. Te escuchó.",
    ],
    cria: [
        "{n} cierra los ojos y ronronea como una brasa.",
        "{n} te muerde el dedo, sin fuerza: quiere jugar.",
        "{n} suelta una chispa de alegría.",
        "{n} se acurruca en tu mano y deja de temblar.",
    ],
    adulto: [
        "{n} inclina la cabeza ante ti: te reconoce.",
        "{n} te mira con calma. Confía en ti.",
        "{n} despliega las alas y deja escapar un rugido grave.",
        "{n} apoya el hocico en tu hombro, como diciendo «sigue».",
    ],
    triste: [
        "{n} apenas levanta la cabeza. Te extrañaba.",
        "{n} te mira sin fuerzas. Cumple una misión y verás cómo cambia.",
    ],
    hambre: [
        "Le suenan las tripas: tiene hambre.",
        "Mira tu bolsa de monedas con ojos grandes: tiene hambre.",
    ],
};

// Lo que responde al acariciarlo. "mascota" viene de describirAvatar() (etapa, triste, nombre).
export function fraseAlAcariciar(estado, mascota, fecha, azar = Math.random) {
    const elegir = (lista) => lista[Math.floor(azar() * lista.length)].replace("{n}", mascota.nombre);
    if (mascota.triste) return elegir(FRASES.triste);
    const frase = elegir(FRASES[mascota.etapa.clave]);
    // Si ya salió del huevo y hoy no comió, a veces lo dice.
    if (mascota.etapa.clave !== "huevo" && !comioHoy(estado, fecha) && azar() < 0.4) return `${frase} ${elegir(FRASES.hambre)}`;
    return frase;
}
