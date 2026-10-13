// arcade.js — Reglas de los minijuegos (los juegos en sí están en minijuegos.js).
//
// Para que los juegos sean un premio a tu productividad (y no la reemplacen),
// se juega con fichas: ganas 1 por cada misión diaria que completas.

export const FICHAS_DE_REGALO = 3;   // para que puedas probar desde el primer día
export const MAX_MONEDAS = 15;       // máximo que da una partida
export const MAX_XP = 20;

export const JUEGOS = {
    carrera: {
        nombre: "Carrera del héroe", icono: "🏃", atributo: "fuerza",
        descripcion: "Tu héroe corre sin parar. Toca para saltar a los monstruos y atrapa monedas.",
        puntosPorMoneda: 50, puntosPorXp: 25,
    },
    lluvia: {
        nombre: "Lluvia de monedas", icono: "🪙", atributo: "riqueza",
        descripcion: "Desliza el dedo para mover a tu héroe: atrapa monedas y gemas, esquiva las bombas.",
        puntosPorMoneda: 3, puntosPorXp: 2,
    },
    golpe: {
        nombre: "Golpe preciso", icono: "🎯", atributo: "intelecto",
        descripcion: "Tu héroe contra un monstruo. Toca cuando la marca esté en el centro para un golpe crítico.",
        puntosPorMoneda: 30, puntosPorXp: 20,
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

// Lo que da una partida según los puntos.
export function premio(tipo, puntos) {
    const juego = JUEGOS[tipo];
    return {
        monedas: Math.min(MAX_MONEDAS, Math.floor(puntos / juego.puntosPorMoneda)),
        xp: Math.min(MAX_XP, Math.floor(puntos / juego.puntosPorXp)),
    };
}
