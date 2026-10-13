// novedades.js — Qué hay de nuevo en cada versión.
//
// Después de actualizar, la app muestra una ventana con lo nuevo (una sola vez).
// Al publicar una versión: sube VERSION_APP (igual que VERSION en sw.js) y agrega
// sus cambios arriba de la lista.

export const VERSION_APP = 16;

export const NOVEDADES = [
    {
        version: 16,
        titulo: "La vida de tu héroe",
        cambios: [
            "❤️ Tu héroe tiene vida: la pierde por lo que no haces cada día y la recupera cumpliendo.",
            "✨ Con 80 % o más estás en plena forma: +10 % de XP y monedas.",
            "☠️ Si llega a 0, la tienda y el arcade se cierran hasta que recuperes la mitad.",
            "🧪 Pociones de vida en la Tienda (una al día).",
            "🏖️ Modo descanso en Ajustes, para vacaciones o días enfermo.",
            "🌙 El aviso de la noche dice cuánta vida pierdes si no terminas, y en la Torre subes con tu vida real.",
        ],
    },
    {
        version: 15,
        titulo: "Más profesional",
        cambios: [
            "☁️ Copia automática en la nube, cifrada con tu contraseña (Ajustes).",
            "🙂 Desbloqueo con Face ID, además del PIN.",
            "👉 Desliza una misión para completarla y «Deshacer» si te equivocas.",
            "🌅 Misiones por momento del día y «↕ Ordenar» arrastrando.",
            "📊 Toca una misión para ver su ficha: racha, récord y calendario.",
            "📌 «Una sola vez» al crear una misión, y tareas sin fecha.",
            "📋 Hábitos y premios listos para elegir con un toque.",
        ],
    },
    {
        version: 14,
        titulo: "Gráficos y Torre del héroe",
        cambios: [
            "🖼️ Fondos y escenarios con pinturas clásicas.",
            "🛡️ Avatar, dragón y equipo con más detalle.",
            "🗼 La Torre del héroe: batallas por turnos en el Arcade.",
        ],
    },
    {
        version: 13,
        titulo: "Avisos por misión",
        cambios: ["⏰ Cada misión puede avisarte a su hora, solo si no la has hecho."],
    },
    {
        version: 12,
        titulo: "Notificaciones",
        cambios: ["🔔 Recordatorios a las horas que elijas y aviso al terminar el enfoque."],
    },
    {
        version: 11,
        titulo: "Agenda y semana",
        cambios: [
            "📌 Tareas sueltas, metas semanales y misiones con cantidad.",
            "⏱️ Modo enfoque, 📓 diario, 🎯 desafío semanal y resumen de tu semana.",
        ],
    },
];

// Las novedades que todavía no viste (como mucho las 3 últimas versiones).
export function novedadesPorVer(vista) {
    return NOVEDADES.filter((n) => n.version > vista).slice(0, 3);
}
