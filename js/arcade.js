// arcade.js — Reglas de los minijuegos (los juegos en sí están en minijuegos.js).
//
// Para que los juegos sean un premio a tu productividad (y no la reemplacen),
// se juega con fichas: ganas 1 por cada misión diaria que completas.
//
// v31: el arcade paga en GEMAS 💎, no en monedas. Las monedas 🪙 son para tus premios de la
// vida real y solo salen de lo que haces en la vida real; las gemas se ganan jugando (y con
// los premios extra: jefes, cofre del día, desafíos y mapa) y se gastan en el arcade y en
// las mascotas. Así, lo que ganas jugando es lo que es: un juego.

export const FICHAS_DE_REGALO = 3;   // para que puedas probar desde el primer día
export const MAX_GEMAS = 15;         // máximo que da una partida
export const MAX_XP = 10;            // (v31: la mitad que antes)

export const JUEGOS = {
    carrera: {
        nombre: "Carrera del héroe", icono: "🏃", atributo: "fuerza",
        descripcion: "Tu héroe corre sin parar. Toca para saltar a los monstruos y atrapa monedas.",
        puntosPorGema: 50, puntosPorXp: 50,
    },
    lluvia: {
        nombre: "Lluvia de monedas", icono: "🪙", atributo: "riqueza",
        descripcion: "Desliza el dedo para mover a tu héroe: atrapa monedas y gemas, esquiva las bombas.",
        puntosPorGema: 3, puntosPorXp: 4,
    },
    golpe: {
        nombre: "Golpe preciso", icono: "🎯", atributo: "intelecto",
        descripcion: "Tu héroe contra una criatura de la Torre. Toca cuando la marca esté en el centro para un golpe crítico.",
        puntosPorGema: 30, puntosPorXp: 40,
    },
};

// Fichas: las de regalo + 1 por cada misión diaria completada + las de los cofres − las ya usadas.
// Se calculan (no se guardan), así nunca se desordenan.
export function fichasDisponibles(estado) {
    const ganadas = FICHAS_DE_REGALO + estado.completadas.length + (estado.arcade.extra || 0);
    return Math.max(0, ganadas - estado.arcade.usadas);
}

// ===== Tu equipo en los minijuegos (v24) =====
// poder = lo que suma tu equipo (equipo.poderDelEquipo) con la ARMADURA QUE TIENES AHORA
// (si fallaste misiones y está gastada, te protege menos).
export function ventajasDelEquipo(poder = {}) {
    const { armadura = 0, ataque = 0, magia = 0, suerte = 0 } = poder;
    return {
        escudos: Math.min(3, Math.floor(armadura / 25)),     // Carrera: choques que aguantas sin caer
        vidasExtra: Math.min(2, Math.floor(armadura / 30)),  // Lluvia: corazones de más
        fuerza: 1 + ataque / 20,                             // Golpe preciso: cada golpe quita (y suma) más
        zona: 1 + Math.min(0.5, magia / 25),                 // Golpe preciso: zonas de acierto más anchas
        suerte: 1 + suerte / 20,                             // Carrera y Lluvia: las monedas valen más
    };
}

// Lo que te da tu equipo en un juego, en palabras. Ej: "🛡️ 1 escudo · 🍀 monedas +20 %"
export function textoVentajas(tipo, v) {
    const partes = [];
    if (tipo === "carrera" && v.escudos) partes.push(`🛡️ ${v.escudos} ${v.escudos === 1 ? "escudo" : "escudos"}`);
    if (tipo === "lluvia" && v.vidasExtra) partes.push(`❤️ +${v.vidasExtra} ${v.vidasExtra === 1 ? "vida" : "vidas"}`);
    if (tipo === "golpe" && v.fuerza > 1) partes.push(`⚔️ +${Math.round((v.fuerza - 1) * 100)} % de daño`);
    if (tipo === "golpe" && v.zona > 1) partes.push(`🔮 zonas ${Math.round((v.zona - 1) * 100)} % más anchas`);
    if (tipo !== "golpe" && v.suerte > 1) partes.push(`🍀 monedas +${Math.round((v.suerte - 1) * 100)} %`);
    return partes.join(" · ");
}

// Lo que da una partida según los puntos (en gemas, no en monedas).
export function premio(tipo, puntos) {
    const juego = JUEGOS[tipo];
    return {
        gemas: Math.min(MAX_GEMAS, Math.floor(puntos / juego.puntosPorGema)),
        xp: Math.min(MAX_XP, Math.floor(puntos / juego.puntosPorXp)),
    };
}
