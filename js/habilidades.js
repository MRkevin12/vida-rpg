// habilidades.js — Las habilidades especiales del equipo épico y legendario en la Torre (v26).
//
// Cada objeto épico o legendario tiene un "rasgo": una habilidad que solo funciona en la
// Torre del héroe y que no se parece a la de ningún otro objeto. Los épicos dan una ventaja
// clara; los legendarios cambian la forma de pelear.
//
// Aquí solo están los datos (nombre, texto y números). Qué objeto tiene cuál se dice en
// avatar.js (OBJETOS[id].habilidad) y cómo funciona cada una está en torre.js.
// Este archivo no importa nada: así cualquiera lo puede usar sin crear círculos.

export const HABILIDADES = {
    // --- Épicas ---
    firme:      { icono: "🪨", nombre: "Firme",          texto: "El primer golpe que recibes en cada piso no te hace daño." },
    sombra:     { icono: "🌑", nombre: "Sombra",         texto: "20 % de esquivar cada golpe.", esquivar: 0.2 },
    impetu:     { icono: "💨", nombre: "Ímpetu",         texto: "Tu primer golpe o hechizo de cada piso es un crítico seguro." },
    desgarro:   { icono: "🩸", nombre: "Desgarro",       texto: "Tus golpes críticos hacen ×2,8 (en vez de ×1,8).", critico: 2.8 },
    juramento:  { icono: "⚜️", nombre: "Juramento",      texto: "30 % más de daño contra los guardianes.", guardianes: 1.3 },
    valor:      { icono: "🔥", nombre: "Valor",          texto: "Con menos de la mitad de tu vida haces 40 % más de daño.", umbral: 0.5, extra: 1.4 },
    regia:      { icono: "👑", nombre: "Manto regio",    texto: "Al subir de piso recuperas 25 % más de vida.", cura: 0.25 },
    bastion:    { icono: "🏰", nombre: "Bastión",        texto: "Al defenderte te curas el triple.", cura: 3 },
    estrellas:  { icono: "✨", nombre: "Estrellas",      texto: "Dos hechizos más en cada piso.", mana: 2 },
    // (v34)
    muralla:    { icono: "🧱", nombre: "Muralla",        texto: "Al defenderte bloqueas 15 % más del golpe.", defensa: 0.15 },
    rugido:     { icono: "🦁", nombre: "Rugido",         texto: "Cada criatura empieza su piso con 15 % menos de vida.", vida: 0.15 },
    aturdir:    { icono: "💫", nombre: "Aturdir",        texto: "Tu primer golpe crítico de cada piso aturde a la criatura: pierde su turno." },
    presagio:   { icono: "🪶", nombre: "Presagio",       texto: "Los golpes fuertes de las criaturas te hacen 35 % menos.", fuerte: 0.65 },
    aurora:     { icono: "🌠", nombre: "Aurora",         texto: "Tu primer hechizo de cada piso no gasta PM." },

    // --- Legendarias ---
    constancia: { icono: "🎁", nombre: "Constancia",     texto: "Eliges entre 4 mejoras al vencer, y cada piso que superas suma +1 de ataque y +1 a tus hechizos.",
                  ataque: 1, hechizo: 1 },
    "ojo-dragon": { icono: "👁️", nombre: "Ojo del dragón", texto: "Ves el punto débil y lo que resiste cada criatura desde el primer turno, y tus hechizos hacen 20 % más.",
                  magia: 1.2 },
    sed:        { icono: "🍷", nombre: "Sed del vencedor", texto: "Tus golpes y hechizos te curan el 30 % del daño que hacen.", robo: 0.3 },
    embestida:  { icono: "⚡", nombre: "Embestida",      texto: "Tus ataques golpean dos veces (el segundo hace la mitad).", segundo: 0.5 },
    arcano:     { icono: "🔮", nombre: "Arcano",         texto: "Tus hechizos al punto débil hacen ×2,2 (en vez de ×1,5).", debil: 2.2 },
    gracia:     { icono: "🕊️", nombre: "Gracia",         texto: "Una vez por piso, un golpe que te dejaría en 0 te deja con el 40 % de tu vida.", vida: 0.4 },
    escamas:    { icono: "🐲", nombre: "Escamas",        texto: "Le devuelves a la criatura la mitad del daño que te hace.", reflejo: 0.5 },
    gloria:     { icono: "🏛️", nombre: "Gloria",         texto: "Empiezas cada subida con 40 % más de vida máxima y una poción extra.", vida: 0.4 },
    // (v74) Las piezas de constancia del gimnasio.
    vigor:      { icono: "🎽", nombre: "Vigor",          texto: "Tus pociones curan 50 % más.", pocion: 1.5 },
    ritmo:      { icono: "🥁", nombre: "Ritmo",          texto: "Ganas el doble de Voluntad.", voluntad: 2 },
    titan:      { icono: "🗿", nombre: "Titán",          texto: "Tu ataque base sube 20 %.", ataque: 1.2 },
    brasa:      { icono: "🔥", nombre: "Brasa",          texto: "Tu primer golpe o hechizo de cada piso hace 50 % más de daño.", primero: 1.5 },
    llama:      { icono: "🕯️", nombre: "Llama del Vigía", texto: "Tus hechizos de fuego hacen 50 % más y el veneno no te hace nada.", fuego: 1.5 },
};

// Lo máximo que puedes esquivar sumando todo (equipo y mascota): nunca más de 40 %.
export const ESQUIVAR_MAXIMO = 0.4;

// ¿Tienes esa habilidad? h = el héroe de la Torre (h.habilidades es una lista de claves).
export function tiene(h, clave) {
    return Boolean(h?.habilidades?.includes(clave));
}
