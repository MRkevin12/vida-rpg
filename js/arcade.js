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

// Fichas: las de regalo + 1 por cada misión diaria completada − las ya usadas.
// Se calculan (no se guardan), así nunca se desordenan.
export function fichasDisponibles(estado) {
    const ganadas = FICHAS_DE_REGALO + estado.completadas.length;
    return Math.max(0, ganadas - estado.arcade.usadas);
}

// Lo que da una partida según los puntos.
export function premio(tipo, puntos) {
    const juego = JUEGOS[tipo];
    return {
        monedas: Math.min(MAX_MONEDAS, Math.floor(puntos / juego.puntosPorMoneda)),
        xp: Math.min(MAX_XP, Math.floor(puntos / juego.puntosPorXp)),
    };
}
