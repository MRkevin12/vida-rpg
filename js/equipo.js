// equipo.js — Lo que te da tu equipo (v24).
//
// Cada objeto tiene un "poder" (ver OBJETOS en avatar.js):
//   🛡️ armadura → te protege cuando fallas una misión (ver «Armadura» abajo y vida.js)
//   ⚔️ ataque   → más daño en la Torre y en «Golpe preciso»
//   🔮 magia    → hechizos más fuertes en la Torre y una zona dorada más ancha en «Golpe preciso»
//   🍀 suerte   → más golpes críticos en la Torre y monedas que valen más en los minijuegos
//
// Como juego.js, este archivo no dibuja ni guarda nada: solo calcula.

import { OBJETOS, etapaDeNivel } from "./avatar.js";
import { HABILIDADES } from "./habilidades.js";
import { calcularNivel } from "./juego.js";

export const PODERES = {
    armadura: { icono: "🛡️", nombre: "Armadura" },
    ataque:   { icono: "⚔️", nombre: "Ataque" },
    magia:    { icono: "🔮", nombre: "Magia" },
    suerte:   { icono: "🍀", nombre: "Suerte" },
};

// ===== Armadura =====
// La armadura MÁXIMA sale de tus objetos de protección: la ropa de tu etapa (ETAPAS en avatar.js)
// + lo que llevas en la cabeza y en la espalda. Llega hasta 100.
// Cada misión que fallas la desgasta, y cada misión cumplida la repara un poco.
// Cuanto más baja está, más daño recibes: con 40 recibes el daño normal, con 0 un 50 % más
// y con 80 o más, la mitad.
export const ARMADURA = {
    tope: 100,
    normal: 40,                                   // con 40, el daño de siempre
    desgaste: { facil: 4, normal: 6, dificil: 9 },  // lo que pierde por cada misión fallada
    reparacion: { facil: 2, normal: 3, dificil: 4 }, // lo que recupera por cada misión o tarea cumplida
    diaPerfecto: 5,                                 // extra por hacer todas las misiones del día
};

// Por cuánto se multiplica el daño de una misión fallada: 0 → ×1,5 · 40 → ×1 · 80 o más → ×0,5.
export function factorArmadura(puntos) {
    return Math.max(0.5, 1.5 - puntos / (ARMADURA.normal * 2));
}

// Los objetos que llevas puestos y que de verdad tienes (comprados o de logro).
// Para los de logro se confía en que, al ponértelos, ya los habías ganado (equiparObjeto lo revisa).
export function objetosPuestos(estado) {
    const comprados = estado.avatar?.comprados || [];
    return Object.values(estado.avatar?.equipado || {})
        .filter((id) => id && OBJETOS[id] && (OBJETOS[id].logro || comprados.includes(id)));
}

// La suma del poder de lo que llevas puesto. Ej: { armadura: 20, ataque: 7, magia: 0, suerte: 4 }
export function poderDelEquipo(estado) {
    const poder = { armadura: 0, ataque: 0, magia: 0, suerte: 0 };
    for (const id of objetosPuestos(estado)) {
        for (const [clave, valor] of Object.entries(OBJETOS[id].poder || {})) poder[clave] += valor;
    }
    return poder;
}

// Las habilidades de la Torre de lo que llevas puesto (v26): ["firme", "gracia", …].
export function habilidadesDelEquipo(estado) {
    return objetosPuestos(estado).map((id) => OBJETOS[id].habilidad).filter((clave) => HABILIDADES[clave]);
}

// La armadura de tu ropa (según tu etapa) + la de tus objetos, hasta 100.
export function armaduraMaxima(estado) {
    const etapa = etapaDeNivel(calcularNivel(estado.personaje?.xp || 0).nivel);
    return Math.min(ARMADURA.tope, etapa.armadura + poderDelEquipo(estado).armadura);
}

// Texto corto del poder de un objeto. Ej: "🛡️ +12 · 🍀 +4"
export function textoPoder(poder = {}) {
    return Object.entries(poder).filter(([, valor]) => valor)
        .map(([clave, valor]) => `${PODERES[clave].icono} +${valor}`).join(" · ");
}
