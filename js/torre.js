// torre.js — Las reglas de la Torre del héroe (el minijuego grande).
//
// Subes piso a piso. En cada piso peleas por turnos contra una criatura de la Torre
// (están en bestiario.js: 4 zonas de 5 pisos, con un guardián al final de cada una).
// Antes de cada turno ves qué va a hacer ("intención"), así puedes decidir: atacar,
// lanzar un hechizo, defenderte o tomar una poción. Al ganar eliges una mejora entre
// tres. La partida termina cuando tu vida llega a 0.
//
// Los hechizos son de fuego, hielo o rayo. Cada criatura tiene un punto débil (ese
// hechizo le hace 50 % más) y algunas resisten otro (la mitad): hay que descubrirlo.
//
// Tu poder sale de los NIVELES DE TUS ATRIBUTOS reales: cumplir misiones te hace
// más fuerte también aquí.
//   Fuerza → vida y ataque · Intelecto → hechizos · Carisma → defensa y vida
//   Riqueza → pociones y golpes críticos
// Y de tu EQUIPO (v24, ver equipo.js): ⚔️ ataque, 🔮 magia (hechizos), 🍀 suerte (críticos)
// y 🛡️ armadura (cada golpe del monstruo te quita menos).
//
// v26: lo épico y legendario que llevas puesto suma HABILIDADES especiales (ver habilidades.js:
// esquivar, resistir con 1 de vida, golpear dos veces…), y tu MASCOTA pelea a tu lado
// (ver mascota.js: ataca, te devuelve hechizos, petrifica o te cura, según la especie).
//
// v29: las mismas reglas sirven para la MAZMORRA DEL ABISMO, que está debajo de la Torre
// y se abre al superar su piso 20. Es más difícil: criaturas más fuertes, con un ataque
// especial cada una (ver ESPECIALES), guardianes que se enfurecen a media vida y nada de
// descanso al bajar de piso. La partida guarda en qué lugar estás (partida.lugar).
//
// v38, «La Torre despierta»: la Torre tiene 30 pisos (6 zonas) y sus criaturas aprendieron
// trucos (ver ESPECIALES): levantar una BARRERA que absorbe tus golpes, CARGAR un golpe enorme
// que suelta al turno siguiente, cubrirse con un ESPEJO que te devuelve los hechizos,
// REGENERARSE cada turno y, el último guardián, cambiar de punto débil a media vida (FASE).
// Tú tienes con qué responder:
//   - TÉCNICAS (ver TECNICAS): una por atributo real, desde el nivel 3 de ese atributo. Cada una
//     se usa una vez por piso: Quebrar (Fuerza), Analizar (Intelecto), Intimidar (Carisma) y
//     Golpe certero (Riqueza). Así cada hábito de la vida real sirve para algo distinto aquí.
//   - VOLUNTAD (ver VOLUNTAD): una barra que se llena al pelear y al recibir golpes (y tu racha de
//     días la empieza con algo). Llena, suelta un golpe triple que rompe barreras y cargas.
//
// Como todo lo que es "juego puro", este archivo no dibuja ni guarda nada: recibe la
// partida (un objeto) y la cambia. La partida se guarda en estado.arcade.torre (o en
// estado.arcade.mazmorra), así puedes salir y seguir después.

import { CRIATURAS, ELEMENTOS, ORDEN, PISOS_POR_ZONA, idDelPiso, vueltaDelPiso, zonaDelPiso, factorElemento, lugarDe, aLaZona, deLaZona, LUGARES } from "./bestiario.js";
import { HABILIDADES, ESQUIVAR_MAXIMO, tiene } from "./habilidades.js";
import { MASCOTAS } from "./mascota.js";
import { NUEVOS_LUGARES } from "./mazmorras.js";
import { semilla as hashDeTexto } from "./desafios.js";
import { bonoDeGym } from "./gym.js";

// El premio es en gemas 💎 (la moneda del arcade, v31) y algo de XP (desde la v31, la mitad).
export const ATRIBUTO = "carisma";                       // el premio sube Carisma
// (v38: con 30 pisos, el tope sube de 40 a 60 gemas y de 30 a 45 XP: se alcanza en el piso 20.)
export const PREMIO = { gemasPorPiso: 3, xpPorPiso: 2.5, maxGemas: 60, maxXp: 45 };
export const CADA_GUARDIAN = PISOS_POR_ZONA;             // cada 5 pisos, un guardián (más fuerte)

// Lo que cambia según el lugar:
//   atributo y premio: lo que ganas al terminar · curaAlSubir: parte de tu vida que recuperas
//   al pasar de piso · enfurecer: los guardianes se enfurecen al quedar con media vida.
//   escala: cómo crecen sus criaturas con el piso: vida = a + b·piso + c·piso², ataque = a + b·piso; los guardianes, además,
//   × guardianVida / guardianAtaque (v64: ahora es un dato, y las mazmorras nuevas traen el suyo; ver mazmorras.js).
export const REGLAS = {
    torre:    { atributo: ATRIBUTO, premio: PREMIO, curaAlSubir: 0.1, enfurecer: false,
                escala: { vida: [22, 9, 0.6], ataque: [4, 1.6], guardianVida: 1.6, guardianAtaque: 1.25 } },
    mazmorra: { atributo: "fuerza", premio: { gemasPorPiso: 5, xpPorPiso: 4, maxGemas: 80, maxXp: 60 },
                curaAlSubir: 0, enfurecer: true,
                escala: { vida: [120, 20, 0.9], ataque: [16, 2.2], guardianVida: 1.5, guardianAtaque: 1.2 } },
};
for (const [id, lugar] of Object.entries(NUEVOS_LUGARES)) REGLAS[id] = lugar.regla;   // (v64) minas y laberinto

// ===== Modos de juego (v65) =====
// Cada partida de la Torre o de una mazmorra se juega en un modo (`partida.modo`; las de antes no lo traen: «normal»).
//   normal: lo de siempre, piso a piso hasta que caigas.
//   asalto: solo los guardianes, uno tras otro (el 5.º piso, el 10.º…). Entre uno y otro recuperas 30 % de vida y eliges una mejora.
//           No hay salas ni rutas. Paga ×0,8 por piso equivalente y tiene su propio récord (guardianes vencidos). Hay que haber
//           superado el piso 5 de ese lugar.
//   diaria: el reto del día: la misma marca y el mismo azar para todo el día (la semilla sale de la fecha). Si superas 8 pisos,
//           premio extra una sola vez al día (y su récord del día se guarda).
export const MODOS = {
    normal: { icono: "⚔️", nombre: "Normal", texto: "Sube piso a piso hasta que caigas." },
    asalto: { icono: "👑", nombre: "Asalto de guardianes", pisoMinimo: 5, curaEntreCombates: 0.3, premio: 0.8,
              texto: "Solo guardianes, uno tras otro. Entre uno y otro recuperas 30 % de vida y eliges una mejora. Sin salas ni rutas; premio ×0,8." },
    diaria: { icono: "📅", nombre: "Reto diario", meta: 8, bonus: { gemas: 30, xp: 20 },
              texto: "El mismo reto para todo el día: misma marca y mismo azar. Si superas 8 pisos, premio extra (una vez al día)." },
};
// ===== Reacciones elementales (v71) =====
// Si lanzas dos hechizos DISTINTOS en turnos seguidos, el segundo provoca una reacción con el primero:
//   Vapor (fuego + hielo): +30 % de daño y su próximo golpe pega 35 % menos.
//   Conducción (hielo + rayo): +15 % de daño y la criatura pierde su turno (los guardianes lo resisten).
//   Explosión (fuego + rayo): +40 % de daño y rompe su barrera y su coraza.
// La criatura recuerda el último hechizo en `m.afectado = { elemento, turno }` (el número de tu acción).
export const REACCIONES = {
    vapor:      { icono: "♨️", nombre: "Vapor",      elementos: ["fuego", "hielo"], factor: 1.3,  texto: "su próximo golpe pega menos" },
    conduccion: { icono: "🌩️", nombre: "Conducción", elementos: ["hielo", "rayo"],  factor: 1.15, texto: "pierde su turno" },
    explosion:  { icono: "💥", nombre: "Explosión",  elementos: ["fuego", "rayo"],  factor: 1.4,  texto: "rompe lo que lo cubre" },
};
export const GOLPE_VAPOR = 0.65;   // lo que queda de su golpe después del Vapor
export function reaccionDe(a, b) {
    if (!a || !b || a === b) return null;
    return Object.keys(REACCIONES).find((k) => REACCIONES[k].elementos.includes(a) && REACCIONES[k].elementos.includes(b)) || null;
}
// ¿Qué reacción provocaría ahora un hechizo de ese elemento? (para avisarlo en el menú de magia)
export function reaccionPosible(partida, elemento) {
    const previo = partida.enemigo?.afectado;
    return previo && previo.turno === partida.turno ? reaccionDe(previo.elemento, elemento) : null;
}

export const modoDe = (partida) => (MODOS[partida?.modo] ? partida.modo : "normal");

// ===== Marcas de partida (v41) =====
// Antes de empezar una subida (o un descenso) puedes elegir UNA marca: un trato con la Torre. Te pone una
// dificultad extra y, a cambio, el premio final sube (`premio` = cuánto se multiplica). Cada día se ofrecen
// 3 de ellas (las mismas todo el día), y siempre puedes ir sin marca.
//   solo: si es de un solo lugar («Ayuno» no sirve en la Mazmorra, donde ya no hay descanso).
export const MARCAS = {
    cristal:    { icono: "💎", nombre: "Cristal",           texto: "−25 % de vida máxima",                   premio: 1.3 },
    sinfrascos: { icono: "🚫", nombre: "Sin frascos",       texto: "Empiezas sin pociones",                  premio: 1.2 },
    salvaje:    { icono: "🐗", nombre: "Criaturas salvajes", texto: "Pegan 25 % más fuerte",                  premio: 1.3 },
    piel:       { icono: "🪨", nombre: "Pieles duras",      texto: "Tienen 30 % más de vida",                premio: 1.25 },
    silencio:   { icono: "🤐", nombre: "Magia muda",        texto: "No tienes hechizos",                     premio: 1.3 },
    ayuno:      { icono: "🍂", nombre: "Ayuno",             texto: "No recuperas vida al pasar de piso",     premio: 1.25, solo: "torre" },
};
export const MARCAS_POR_DIA = 3;

// Las marcas que se ofrecen ese día en ese lugar: siempre las mismas para la misma fecha.
export function marcasDelDia(fecha, lugar = "torre") {
    const claves = Object.keys(MARCAS).filter((clave) => !MARCAS[clave].solo || MARCAS[clave].solo === lugar);
    let semilla = hashDeTexto(`${fecha}${lugar}`) || 1;
    const elegidas = [];
    while (elegidas.length < MARCAS_POR_DIA) {
        semilla = (semilla * 1664525 + 1013904223) % 4294967296;
        elegidas.push(...claves.splice(Math.floor((semilla / 4294967296) * claves.length), 1));
    }
    return elegidas;
}

// La marca fija del reto diario de ese día en ese lugar (la primera de las que se ofrecen) y su semilla (siempre la misma ese día).
export const marcaDeLaDiaria = (fecha, lugar = "torre") => marcasDelDia(fecha, lugar)[0];
export const semillaDeLaDiaria = (fecha, lugar = "torre") => hashDeTexto(`diaria-${fecha}-${lugar}`) || 1;

// La criatura que sale en cada piso, ya con lo que cambia la marca («Criaturas salvajes», «Pieles duras»).
function marcarEnemigo(marca, m) {
    if (marca === "salvaje") m.ataque = Math.round(m.ataque * 1.25);
    if (marca === "piel") {
        const parte = m.vida / m.vidaMax;   // (con «Rugido» la criatura ya sale herida: se mantiene esa parte)
        m.vidaMax = Math.round(m.vidaMax * 1.3);
        m.vida = Math.round(m.vidaMax * parte);
    }
    return m;
}

// ===== El bazar del arcade (v31) =====
// Provisiones que se compran con gemas y se usan al EMPEZAR tu próxima subida (o bajada):
// todas las que tengas, una vez. Se puede tener una de cada una.
export const PROVISIONES = {
    pocion:    { icono: "🧪", nombre: "Poción de reserva", texto: "+1 poción", precio: 25 },
    afilar:    { icono: "⚔️", nombre: "Piedra de afilar",  texto: "+4 de ataque", precio: 40 },
    pergamino: { icono: "📜", nombre: "Pergamino arcano",  texto: "+1 hechizo por piso", precio: 45 },
    antidoto:  { icono: "🌿", nombre: "Raíz amarga",       texto: "El veneno no te hace nada", precio: 50 },
    amuleto:   { icono: "❤️", nombre: "Amuleto de vigor",  texto: "+15 % de vida máxima", precio: 60 },
};

// Le da al héroe de una partida nueva las provisiones que llevas (claves de PROVISIONES).
export function usarProvisiones(partida, claves = []) {
    const h = partida.heroe;
    const usadas = claves.filter((clave) => PROVISIONES[clave]);
    for (const clave of usadas) {
        if (clave === "pocion") h.pociones += 1;
        if (clave === "afilar") h.ataque += 4;
        if (clave === "pergamino") { h.manaMax += 1; h.mana += 1; }
        if (clave === "antidoto") h.inmuneVeneno = true;
        if (clave === "amuleto") {
            const extra = Math.round(h.vidaMax * 0.15);
            h.vidaMax += extra;
            h.vida += extra;
        }
    }
    if (usadas.length) partida.registro += ` Llevas: ${usadas.map((c) => `${PROVISIONES[c].icono} ${PROVISIONES[c].nombre}`).join(", ")}.`;
    return usadas;
}
const reglasDe = (partida) => REGLAS[partida.lugar] || REGLAS.torre;

// Cuántos pisos de la Torre hay que superar para que se abra la Mazmorra (vencer al guardián del 20).
export const ABRIR_MAZMORRA = 20;

// arcade = estado.arcade. Se abre con tu récord de la Torre, o en cuanto lo superas en la subida de ahora.
export function mazmorraAbierta(arcade) {
    const enCurso = arcade?.torre && modoDe(arcade.torre) !== "asalto" ? pisosSuperados(arcade.torre) : 0;
    return Math.max(arcade?.records?.torre || 0, enCurso) >= ABRIR_MAZMORRA;
}

// (v64) ¿Está abierto ese lugar? La Torre, siempre; la Mazmorra, al superar el piso 20 de la Torre; las demás, al superar cierto
// piso del lugar anterior (ver `abre` en mazmorras.js). Cuenta lo que llevas en la partida de ahora.
export function lugarAbierto(arcade, lugar) {
    if (lugar === "torre") return true;
    if (lugar === "mazmorra") return mazmorraAbierta(arcade);
    const abre = LUGARES[lugar]?.abre;
    if (!abre) return false;
    const enCurso = arcade?.[abre.lugar] && modoDe(arcade[abre.lugar]) !== "asalto" ? pisosSuperados(arcade[abre.lugar]) : 0;
    return Math.max(arcade?.records?.[abre.lugar] || 0, enCurso) >= abre.piso;
}

// Los ataques especiales de las criaturas de la Mazmorra.
//   fuerza: cuánto de su ataque pega (la coraza no pega).
//   veneno: además te quita parte de tu vida máxima al final de cada turno, durante 3 turnos
//           (defenderte no lo para; una poción, sí).
//   drenar: se cura lo mismo que te quitó.
//   sellar: te quita hechizos (PM) de este piso.
//   coraza: tu próximo golpe (y el de tu mascota) le hace la mitad.
// v38: los trucos que aprendieron las criaturas de la Torre (no pegan el turno en que los usan):
//   barrera: se cubre con una barrera que absorbe hasta esa parte de su vida máxima (tus golpes la
//            gastan antes de llegar a su vida). «Quebrar» y la Voluntad la rompen de una vez.
//   carga:   junta fuerzas; el turno siguiente DESCARGA un golpe que pega `golpe` veces su ataque.
//            Defiéndete, o usa «Intimidar» para que lo pierda.
//   reflejo: se cubre con un espejo: tu próximo hechizo no le hace nada y te devuelve la mitad.
//            Los golpes (sin magia) no rebotan.
export const ESPECIALES = {
    veneno:  { icono: "☠️", nombre: "Veneno", fuerza: 0.8, turnos: 3, porTurno: 0.05 },
    drenar:  { icono: "🩸", nombre: "Drenar", fuerza: 1.3 },
    sellar:  { icono: "🔒", nombre: "Sello",  fuerza: 0.7, pm: 2 },
    coraza:  { icono: "🐚", nombre: "Coraza", fuerza: 0, factor: 0.5 },
    barrera: { icono: "💠", nombre: "Barrera", fuerza: 0, parte: 0.25 },
    carga:   { icono: "🌀", nombre: "Carga",   fuerza: 0, golpe: 2.6 },
    reflejo: { icono: "🪞", nombre: "Espejo",  fuerza: 0, devuelve: 0.5 },
};
const especialDe = (m) => CRIATURAS[m.id]?.especial || null;

// Lo que se regenera cada turno (parte de su vida máxima), si es de las que se regeneran.
const regeneraDe = (m) => CRIATURAS[m.id]?.regenera || 0;

// Su punto débil y lo que resiste AHORA: el último guardián cambia de forma a media vida (fase).
export function formaActual(m) {
    const criatura = CRIATURAS[m.id] || {};
    return m.cambio && criatura.fase ? { ...criatura, debil: criatura.fase.debil, resiste: criatura.fase.resiste } : criatura;
}


// ===== Técnicas y Voluntad (v38) =====

// Las técnicas de los Vigías: una por atributo. Se aprende al llegar al nivel NIVEL_TECNICA de
// ese atributo en la vida real, y cada una se usa una vez por piso (más con «Maestría»).
export const NIVEL_TECNICA = 3;
export const TECNICAS = {
    quebrar:   { icono: "🔨", nombre: "Quebrar",       atributo: "fuerza",    fuerza: 1.3, texto: "Golpe ×1,3 que rompe su barrera y su coraza" },
    analizar:  { icono: "🔍", nombre: "Analizar",      atributo: "intelecto", texto: "Descubres su punto débil y lo que resiste, y recuperas 1 PM" },
    intimidar: { icono: "😤", nombre: "Intimidar",     atributo: "carisma",   texto: "Pierde su próxima acción (y el golpe que estaba cargando)" },
    certero:   { icono: "🎯", nombre: "Golpe certero", atributo: "riqueza",   texto: "Un golpe que siempre es crítico" },
};

// La Voluntad: se llena peleando (al golpear, al defenderte y, sobre todo, al aguantar golpes).
// Empieza con algo según tu racha de días (porDia por cada día, hasta inicialMax).
// Llena, el «Golpe de Voluntad» pega `multiplica` veces tu mejor ataque (golpe o hechizo),
// rompe su barrera, su coraza y su espejo, y le quita el golpe que estaba cargando.
export const VOLUNTAD = { max: 100, alGolpear: 6, alDefender: 5, alRecibir: 10, porDia: 3, inicialMax: 30, multiplica: 2.5 };

// Cuántas veces puedes usar cada técnica en este piso.
const usosPorPiso = (h) => 1 + (h.maestria || 0);

// v38: sobre la tormenta (los Puentes de nubes y la Corona) las criaturas son más duras.
export const SOBRE_LAS_NUBES = { zonas: ["nubes", "corona"], vida: 1.1, ataque: 1.1 };

// Cuánto más pega un guardián de la Mazmorra cuando se enfurece (una vez, con media vida).
export const FURIA_GUARDIAN = 1.3;

// Los monstruos, en el orden en que aparecen (el del piso 1, el del 2…).
export const MONSTRUOS = ORDEN.map((id) => ({ id, ...CRIATURAS[id] }));

// Los comandos de la batalla, en el orden del menú.
export const ACCIONES = {
    atacar:   { icono: "⚔️", nombre: "Atacar" },
    hechizo:  { icono: "🔮", nombre: "Magia" },
    tecnica:  { icono: "🎯", nombre: "Técnicas" },
    defender: { icono: "🛡️", nombre: "Defender" },
    pocion:   { icono: "🧪", nombre: "Poción" },
    voluntad: { icono: "✨", nombre: "Voluntad" },
};

export const MEJORAS = {
    afilar:   { icono: "⚔️", nombre: "Hoja afilada",     texto: "+3 de ataque", tipo: "ofensiva" },
    tomo:     { icono: "📖", nombre: "Tomo antiguo",     texto: "+5 de daño de hechizo", tipo: "magica" },
    vigor:    { icono: "❤️", nombre: "Vigor",            texto: "+12 de vida máxima (y te cura 12)", tipo: "defensiva" },
    frasco:   { icono: "🧪", nombre: "Frasco extra",     texto: "+1 poción", tipo: "defensiva" },
    mana:     { icono: "✨", nombre: "Mente clara",      texto: "+1 hechizo por piso", tipo: "magica" },
    suerte:   { icono: "🍀", nombre: "Trébol",           texto: "+6 % de golpe crítico", tipo: "ofensiva" },
    escudo:   { icono: "🛡️", nombre: "Escudo reforzado", texto: "Defender bloquea 8 % más", tipo: "defensiva" },
    descanso: { icono: "🔥", nombre: "Fogata",           texto: "Recuperas 40 % de tu vida", tipo: "defensiva" },
    // v38
    impulso:  { icono: "✨", nombre: "Llama interior",   texto: "+35 de Voluntad", tipo: "tactica" },
    maestria: { icono: "🎓", nombre: "Maestría",         texto: "Cada técnica, una vez más por piso", tipo: "tactica" },
    // v41: los DONES. Cambian cómo peleas (no solo un número) y son raros: desde el piso 3 a veces sale uno entre
    // las opciones, y cada don se puede tener una sola vez por partida (quedan en `heroe.dones`).
    sangre:   { icono: "🩸", nombre: "Sed de sangre",    texto: "Cada golpe crítico te cura 10 % de tu vida máxima", don: true, tipo: "ofensiva" },
    eco:      { icono: "🔔", nombre: "Eco arcano",       texto: "Tu primer hechizo de cada piso pega el doble", don: true, tipo: "magica" },
    espinas:  { icono: "🌵", nombre: "Piel de espinas",  texto: "Le devuelves 30 % del daño que recibes", don: true, tipo: "defensiva" },
    cazador:  { icono: "🏹", nombre: "Ojo de cazador",   texto: "Tus críticos pegan ×2,3 en vez de ×1,8", don: true, tipo: "ofensiva" },
    fervor:   { icono: "🔥", nombre: "Fervor",           texto: "Ganas 50 % más de Voluntad", don: true, tipo: "tactica" },
    botin:    { icono: "🎒", nombre: "Botín de guerra",  texto: "Al vencer a una criatura recuperas 10 % de tu vida", don: true, tipo: "defensiva" },
};

// (v60) Qué clase de mejora es cada una (se ve en su tarjeta del botín).
export const TIPOS_DE_MEJORA = {
    ofensiva:  { icono: "⚔️", nombre: "Ofensiva" },
    defensiva: { icono: "🛡️", nombre: "Defensiva" },
    magica:    { icono: "🔮", nombre: "Mágica" },
    tactica:   { icono: "✨", nombre: "Táctica" },
};

// ===== Rutas (v60) =====
// En el segundo piso de cada zona (y de cada sótano) eliges por dónde seguir. Cambia el riesgo de la partida:
//   desafio: la criatura que viene es de ÉLITE (más vida y más ataque); si la vences, el botín trae un don seguro y +1 poción.
//   calma:   un manantial te cura y la criatura llega cansada (menos vida).
export const RUTAS = {
    desafio: { icono: "⚔️", nombre: "Camino del desafío", riesgo: "Más difícil",
               texto: "Te espera una criatura de élite: +40 % de vida y +20 % de ataque. Si la vences: un don raro seguro en el botín y +1 poción." },
    calma:   { icono: "🌿", nombre: "Sendero tranquilo", riesgo: "Más seguro",
               texto: "Un manantial en el camino: recuperas 20 % de tu vida, y la criatura llega cansada (−25 % de vida)." },
};
export const ELITE = { vida: 1.4, ataque: 1.2 };
export const CALMA = { cura: 0.2, vida: 0.75 };
export const PISO_DE_RUTA = 2;   // el lugar dentro de la zona donde se elige (el 2.º piso de cada zona)

// ¿Hay que elegir ruta antes de este piso?
export const hayRuta = (piso) => piso % PISOS_POR_ZONA === PISO_DE_RUTA;

// Elegir por dónde seguir. Devuelve { texto }.
export function elegirRuta(partida, clave) {
    if (partida.fase !== "ruta" || !partida.ruta) throw new Error("Ahora no estás eligiendo camino.");
    if (!RUTAS[clave]) throw new Error("Ese camino no existe.");
    const h = partida.heroe;
    const m = partida.enemigo;
    let texto;
    if (clave === "desafio") {
        const parte = m.vida / m.vidaMax;
        m.vidaMax = Math.round(m.vidaMax * ELITE.vida);
        m.vida = Math.max(1, Math.round(m.vidaMax * parte));
        m.ataque = Math.round(m.ataque * ELITE.ataque);
        m.elite = true;
        texto = `Tomas el camino del desafío: ${elMonstruo(m)} es de élite.`;
    } else {
        const cura = Math.min(Math.round(h.vidaMax * CALMA.cura), h.vidaMax - h.vida);
        h.vida += cura;
        m.vidaMax = Math.max(1, Math.round(m.vidaMax * CALMA.vida));
        m.vida = Math.min(m.vida, m.vidaMax);
        texto = `Tomas el sendero tranquilo: ${cura ? `bebes del manantial (+${cura} de vida) y ` : ""}${elMonstruo(m)} llega cansad${m.genero === "f" ? "a" : "o"}.`;
    }
    partida.registro = `${conMayuscula(texto)} ${partida.ruta.antes}`;
    partida.ruta = null;
    partida.fase = "batalla";
    return { texto };
}

// Los números de los dones (para que el texto y las reglas no se separen).
export const DONES = { sangre: 0.1, espinas: 0.3, cazador: 0.5, fervor: 1.5, botin: 0.1, probabilidad: 0.5, desdePiso: 3 };
const tieneDon = (h, clave) => (h.dones || []).includes(clave);

const INTENCIONES = {
    golpe:    { icono: "⚔️", texto: "Va a atacar" },
    fuerte:   { icono: "💥", texto: "Prepara un golpe fuerte" },
    furia:    { icono: "😡", texto: "Se enfurece (más ataque)" },
    curar:    { icono: "💚", texto: "Se va a curar" },
    especial: { icono: "✨", texto: "Prepara su ataque especial" },   // (el icono real sale de ESPECIALES)
    descarga: { icono: "💢", texto: "Va a descargar su golpe cargado" },  // (v38: el turno después de «carga»)
};

// Las intenciones que pegan (el resto no te quita vida).
export const GOLPES = ["golpe", "fuerte", "especial", "descarga"];


// ===== Cómo se nombra a una criatura en las frases =====
// «el Esqueleto», «la Araña tejedora», «al Esqueleto», «a la Araña tejedora».
const elMonstruo = (m) => `${m.genero === "f" ? "la" : "el"} ${m.nombre}`;
const alMonstruo = (m) => (m.genero === "f" ? `a la ${m.nombre}` : `al ${m.nombre}`);
const conMayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

// Cómo se llama el ataque que va a usar («Mordisco», «Picada», «Filamentos»…).
function nombreDelAtaque(m) {
    const criatura = CRIATURAS[m.id] || {};
    if (m.intencion === "especial" || m.intencion === "descarga") return criatura.especial?.nombre || "Ataque";
    return (m.intencion === "fuerte" ? criatura.fuerte : criatura.golpe) || "Ataque";
}

// «Piso 7» o «Sótano 7».
const nombreDelPiso = (partida, piso = partida.piso) => `${lugarDe(partida.lugar).piso} ${piso}`;


// ===== Azar con semilla =====
// La partida guarda su propia "semilla": así se puede repetir igual (útil en las pruebas)
// y no cambia si cierras y vuelves a abrir la app a mitad de un turno.
function azar(partida) {
    partida.semilla = (partida.semilla * 1664525 + 1013904223) % 4294967296;
    return partida.semilla / 4294967296;
}

function elegir(partida, lista) {
    return lista[Math.floor(azar(partida) * lista.length)];
}


// ===== El héroe =====

// niveles = { fuerza, intelecto, carisma, riqueza } (los niveles de tus atributos, 1 o más)
// equipo = { ataque, magia, suerte, armadura, habilidades } (lo que suma tu equipo; la armadura,
// la que tienes ahora; habilidades, las de tus objetos épicos y legendarios)
// equipo.racha (v38): tus días seguidos, que te dan Voluntad al empezar.
// niveles.gym (v66, opcional): tu nivel de gimnasio; da hasta +25 % de vida y de ataque (ver gym.js).
export function heroeDeLaTorre(niveles, equipo = {}) {
    const { ataque = 0, magia = 0, suerte = 0, armadura = 0 } = equipo;
    const habilidades = (equipo.habilidades || []).filter((clave) => HABILIDADES[clave]);
    const gloria = habilidades.includes("gloria");
    const fuerzaGym = 1 + bonoDeGym(niveles.gym || 1);   // el entrenamiento real se nota en el combate
    const vidaMax = Math.round((40 + 6 * niveles.fuerza + 4 * niveles.carisma) * (gloria ? 1 + HABILIDADES.gloria.vida : 1) * fuerzaGym);
    const mana = 2 + Math.floor(niveles.intelecto / 3) + (magia >= 8 ? 1 : 0) + (habilidades.includes("estrellas") ? HABILIDADES.estrellas.mana : 0);
    const pociones = 1 + Math.floor(niveles.riqueza / 2) + (gloria ? 1 : 0);
    return {
        vida: vidaMax,
        vidaMax,
        ataque: Math.round((6 + 2 * niveles.fuerza) * fuerzaGym) + ataque,
        hechizo: 10 + 3 * niveles.intelecto + Math.round(magia * 1.5),
        mana,                 // hechizos que te quedan en este piso
        manaMax: mana,
        // parte del daño que bloqueas al defender («Muralla»: 15 % más)
        defensa: Math.min(0.75, 0.5 + niveles.carisma * 0.025) + (habilidades.includes("muralla") ? HABILIDADES.muralla.defensa : 0),
        curaDefensa: 2 + niveles.carisma,
        pociones,
        critico: Math.min(0.4, Math.min(0.3, 0.08 + niveles.riqueza * 0.02) + suerte / 100),
        proteccion: Math.min(0.4, armadura / 200),   // parte de cada golpe que para tu armadura (máx. 40 %)
        defendiendo: false,
        habilidades,
        // v38: las técnicas que ya aprendiste (las de los atributos en nivel 3 o más) y tu Voluntad.
        tecnicas: Object.keys(TECNICAS).filter((clave) => (niveles[TECNICAS[clave].atributo] || 0) >= NIVEL_TECNICA),
        voluntad: Math.min(VOLUNTAD.inicialMax, Math.max(0, Math.round((equipo.racha || 0) * VOLUNTAD.porDia))),
        maestria: 0,
        enEstePiso: pisoNuevo(),   // lo que ya pasó en este piso (para «Firme», «Ímpetu», «Gracia» y las técnicas)
    };
}

function pisoNuevo() {
    return { golpeado: false, atacado: false, gracia: false, aurora: false, aturdio: false, eco: false, tecnicas: {} };
}

// ¿Puedes usar esa técnica ahora? Devuelve null si sí, o el motivo si no.
export function motivoTecnica(h, clave) {
    const tecnica = TECNICAS[clave];
    if (!tecnica) return "Esa técnica no existe.";
    if (!(h.tecnicas || []).includes(clave)) return `Se aprende con ${tecnica.atributo} en nivel ${NIVEL_TECNICA}.`;
    if ((h.enEstePiso?.tecnicas?.[clave] || 0) >= usosPorPiso(h)) return "Ya la usaste en este piso.";
    return null;
}

// («Fervor» es un don: sube lo que ganas, no lo que ya tienes.)
const sumarVoluntad = (h, cuanto) => {
    const ganado = Math.round(cuanto * (tieneDon(h, "fervor") ? DONES.fervor : 1));
    h.voluntad = Math.min(VOLUNTAD.max, (h.voluntad || 0) + ganado);
};

// Le pega a la criatura: primero se gasta su barrera (si tiene). Devuelve cuánto absorbió.
function golpearA(m, dano) {
    const absorbido = Math.min(m.barrera || 0, dano);
    m.barrera = (m.barrera || 0) - absorbido;
    m.vida = Math.max(0, m.vida - (dano - absorbido));
    return absorbido;
}

// «Rugido»: la criatura de cada piso empieza con menos vida.
function rugir(h, m) {
    if (tiene(h, "rugido")) m.vida = Math.round(m.vidaMax * (1 - HABILIDADES.rugido.vida));
    return m;
}

// Cuánto te hará el golpe que prepara la criatura (con tu armadura y, en los golpes fuertes, «Presagio»).
function danoContra(h, m) {
    const dano = danoRecibido(h, danoPrevisto(m));
    return m.intencion === "fuerte" && tiene(h, "presagio") ? Math.round(dano * HABILIDADES.presagio.fuerte) : dano;
}

// Cuánto te quita un golpe del monstruo (tu armadura y, si te defiendes, tu escudo lo bajan).
export function danoRecibido(h, dano) {
    let total = Math.round(dano * (1 - (h.proteccion || 0)));
    if (h.defendiendo) total = Math.round(total * (1 - h.defensa));
    return total;
}


// ===== Los monstruos =====

export function esGuardian(piso) {
    return piso % CADA_GUARDIAN === 0;
}

// lugar = "torre" o "mazmorra". Los de la Mazmorra tienen bastante más vida y ataque desde
// el primer sótano (y crecen más rápido): un sótano 1 se parece a un piso 9 de la Torre.
export function monstruoDelPiso(piso, lugar = "torre") {
    const id = idDelPiso(piso, lugar);
    const criatura = CRIATURAS[id];
    const guardian = esGuardian(piso);
    const vuelta = vueltaDelPiso(piso, lugar);   // después del piso 20 vuelven los mismos, «ancestrales» (o «abisales»)
    const e = (REGLAS[lugar] || REGLAS.torre).escala;   // (v64) lo que crece cada lugar con el piso
    const nubes = lugar === "torre" && SOBRE_LAS_NUBES.zonas.includes(criatura.zona);
    const vidaMax = Math.round((e.vida[0] + e.vida[1] * piso + e.vida[2] * piso * piso) * (guardian ? e.guardianVida : 1) * (nubes ? SOBRE_LAS_NUBES.vida : 1));
    const ataque = Math.round((e.ataque[0] + e.ataque[1] * piso) * (guardian ? e.guardianAtaque : 1) * (nubes ? SOBRE_LAS_NUBES.ataque : 1));
    return {
        id,
        nombre: vuelta ? `${criatura.nombre} ${lugarDe(lugar).vuelta}` : criatura.nombre,
        genero: criatura.genero,
        guardian,
        vuelta,
        vida: vidaMax,
        vidaMax,
        ataque,
        intencion: "golpe",
    };
}

// Qué hará el monstruo en su próximo turno (se muestra antes, para que puedas prepararte).
// Las de la Mazmorra pueden preparar su ataque especial (nunca dos veces seguidas).
function nuevaIntencion(partida) {
    const m = partida.enemigo;
    if (m.cargando) return "descarga";                                       // lo que cargó, lo suelta
    if (["fuerte", "furia", "especial", "descarga"].includes(m.intencion)) return "golpe";   // no repite lo especial
    const opciones = ["golpe", "golpe", "golpe", "fuerte", "fuerte", "furia"];
    // (una barrera no se levanta de nuevo mientras le queda)
    if (especialDe(m) && !(especialDe(m).tipo === "barrera" && m.barrera > 0)) opciones.push("especial", "especial");
    if (m.guardian && m.vida < m.vidaMax * 0.6) opciones.push("curar", "curar");
    return elegir(partida, opciones);
}

// Cuánto daño hará el monstruo con su intención actual (para mostrarlo).
export function danoPrevisto(m) {
    if (m.intencion === "golpe") return m.ataque;
    if (m.intencion === "fuerte") return Math.round(m.ataque * 1.9);
    if (m.intencion === "descarga") return Math.round(m.ataque * ESPECIALES.carga.golpe);
    if (m.intencion === "especial") return Math.round(m.ataque * (ESPECIALES[especialDe(m)?.tipo]?.fuerza || 0));
    return 0;
}

// h (opcional) = tu héroe: así el número ya descuenta lo que para tu armadura.
// Ej: { icono: "💥", texto: "Prepara «Estocada» (12)" } o { icono: "☠️", texto: "Va a usar «Filamentos» (9 + veneno)" }
export function textoIntencion(m, h = null) {
    const i = INTENCIONES[m.intencion] || INTENCIONES.golpe;
    const dano = h ? danoContra({ ...h, defendiendo: false }, m) : danoPrevisto(m);
    if (m.intencion === "especial") {
        const tipo = especialDe(m)?.tipo;
        const efecto = { veneno: `${dano} + veneno`, drenar: `${dano} y se cura`, sellar: `${dano} y −${ESPECIALES.sellar.pm} PM` }[tipo];
        if (tipo === "coraza") return { icono: ESPECIALES.coraza.icono, texto: `Se cubrirá con «${nombreDelAtaque(m)}» (½ de daño)` };
        if (tipo === "barrera") return { icono: ESPECIALES.barrera.icono, texto: `Levantará «${nombreDelAtaque(m)}» (absorbe ${Math.round(m.vidaMax * ESPECIALES.barrera.parte)})` };
        if (tipo === "reflejo") return { icono: ESPECIALES.reflejo.icono, texto: `Se cubrirá con «${nombreDelAtaque(m)}» (devuelve tus hechizos)` };
        if (tipo === "carga") {
            const golpe = h ? danoContra({ ...h, defendiendo: false }, { ...m, intencion: "descarga" }) : Math.round(m.ataque * ESPECIALES.carga.golpe);
            return { icono: ESPECIALES.carga.icono, texto: `Cargará «${nombreDelAtaque(m)}»: al turno siguiente, ${golpe}` };
        }
        return { icono: ESPECIALES[tipo]?.icono || i.icono, texto: `Va a usar «${nombreDelAtaque(m)}» (${efecto})` };
    }
    if (!dano) return { icono: i.icono, texto: i.texto };
    if (m.intencion === "descarga") return { icono: i.icono, texto: `¡Descarga «${nombreDelAtaque(m)}»! (${dano})` };
    const verbo = m.intencion === "fuerte" ? "Prepara" : "Va a usar";
    return { icono: i.icono, texto: `${verbo} «${nombreDelAtaque(m)}» (${dano})` };
}


// ===== La partida =====

// proporcion: con cuánta vida subes (1 = llena). Sale de tu vida real (ver vida.js):
// si llegas herido, empiezas con menos.
// equipo.mascota (opcional): la mascota que te acompaña (ver mascotaDeBatalla en mascota.js).
// lugar: "torre" (se sube) o "mazmorra" (se baja).
// marca (v41, opcional): una clave de MARCAS; la partida la recuerda en `partida.marca`.
export function nuevaPartida(niveles, semilla = Date.now() % 4294967296, proporcion = 1, equipo = {}, lugar = "torre", marca = null, modo = "normal") {
    if (marca && !MARCAS[marca]) throw new Error("Esa marca no existe.");
    if (!MODOS[modo]) throw new Error("Ese modo no existe.");
    marca = marca || null;
    const heroe = heroeDeLaTorre(niveles, equipo);
    // Lo que la marca le quita al héroe ANTES de calcular con cuánta vida entra.
    if (marca === "cristal") heroe.vidaMax = Math.round(heroe.vidaMax * 0.75);
    if (marca === "sinfrascos") heroe.pociones = 0;
    if (marca === "silencio") { heroe.mana = 0; heroe.manaMax = 0; }
    heroe.vida = Math.max(1, Math.round(heroe.vidaMax * proporcion));
    const sitio = lugarDe(lugar);
    const asalto = modo === "asalto";
    const pisoInicial = asalto ? PISOS_POR_ZONA : 1;   // en el asalto, el primer combate es contra el guardián del 5.º piso
    const primero = `${sitio.piso} ${pisoInicial}`;
    return {
        lugar: LUGARES[lugar] ? lugar : "torre",
        modo,
        semilla,
        marca,                    // la marca elegida (o null)
        cine: null,               // la cinemática que toca ver ("zona", "entrada", "derrota", "final") o null (v43)
        piso: pisoInicial,
        fase: "batalla",          // "batalla" | "mejora" (elegir premio) | "fin"
        heroe,
        enemigo: marcarEnemigo(marca, rugir(heroe, monstruoDelPiso(pisoInicial, lugar))),
        mascota: equipo.mascota && MASCOTAS[equipo.mascota.especie] ? { ...equipo.mascota } : null,
        turno: 0,                 // cuántas acciones llevas (la mascota actúa cada tantos turnos)
        renacio: false,           // si el fénix ya te levantó en esta subida
        opciones: [],             // las mejoras para elegir (3, o 4 con «Constancia»)
        registro: (heroe.vida < heroe.vidaMax
            ? `${primero}. Llegas con el ${Math.round(proporcion * 100)} % de tu vida real. ¡Cuidado!`
            : asalto ? `${primero}: ¡el primer guardián te espera! Asalto de guardianes.`
            : `${primero}. ¡Que empiece ${sitio.verboBajar || (lugar === "mazmorra" ? "el descenso" : "la subida")}!`) +
            (marca ? ` Marca: ${MARCAS[marca].icono} ${MARCAS[marca].nombre} (${MARCAS[marca].texto}).` : ""),
    };
}

// Una partida guardada con una versión anterior de la app puede tener un monstruo que ya no
// vive en la Torre (antes eran los jefes de tus campañas). Se cambia por el de ese piso, con
// la misma parte de vida que le quedaba. (Y las de antes de la v29 no decían su lugar: son de la Torre.)
export function ponerAlDia(partida) {
    if (!partida) return partida;
    partida.lugar ||= "torre";
    if (CRIATURAS[partida.enemigo?.id]) return partida;
    const viejo = partida.enemigo || {};
    const nuevo = monstruoDelPiso(partida.piso, partida.lugar);
    const parte = viejo.vidaMax ? viejo.vida / viejo.vidaMax : 1;
    nuevo.vida = Math.round(nuevo.vidaMax * parte);
    if (partida.fase === "batalla") nuevo.vida = Math.max(1, nuevo.vida);
    if (INTENCIONES[viejo.intencion]) nuevo.intencion = viejo.intencion;
    partida.enemigo = nuevo;
    return partida;
}

export function pisosSuperados(partida) {
    return partida.piso - (modoDe(partida) === "asalto" ? PISOS_POR_ZONA : 1);
}

// Una acción del héroe, la de su mascota y la respuesta del monstruo.
// accion: "atacar" | "hechizo" | "tecnica" | "defender" | "pocion" | "voluntad". El tercer dato
// (opcion) dice cuál: con "hechizo", el elemento ("fuego", "hielo" o "rayo"); con "tecnica", cuál
// técnica ("quebrar", "analizar", "intimidar" o "certero").
// Devuelve lo que pasó (para las animaciones y los sonidos):
//   [{ quien ("heroe" | "mascota" | "enemigo" | "furia" | "veneno"), tipo, dano, critico, doble, elemento,
//      efecto ("debil" | "resiste" | null), cura, nombre, esquivado, reflejo, habilidad,
//      especial ("veneno" | "drenar" | "sellar" | "coraza" | "barrera" | "carga" | "reflejo"), sello (PM que te quitó),
//      coraza (tu golpe chocó con ella), absorbido (lo que paró su barrera), reflejado (lo que te devolvió su espejo),
//      tecnica (cuál usaste), rompio (rompiste su barrera o su coraza) }]
// (v38: también { quien: "fase" } cuando el último guardián cambia de forma y { quien: "regenera", cura }.)
export function actuar(partida, accion, opcion = null) {
    const elemento = accion === "hechizo" ? opcion : null;
    const tecnica = accion === "tecnica" ? opcion : null;
    if (partida.fase !== "batalla") throw new Error("Ahora no estás en una batalla.");
    const h = partida.heroe;
    const m = partida.enemigo;
    const eventos = [];
    const frases = [];
    const activas = [];   // (v63) las habilidades y dones que se notaron en tu acción (se muestran en pantalla)

    // --- Turno del héroe ---
    if (accion === "hechizo") {
        if (h.mana < 1) throw new Error("No te quedan hechizos en este piso.");
        if (!ELEMENTOS[elemento]) throw new Error("Elige un hechizo: fuego, hielo o rayo.");
    }
    if (!["atacar", "hechizo", "tecnica", "defender", "pocion", "voluntad"].includes(accion)) throw new Error("Esa acción no existe.");
    if (accion === "pocion" && h.pociones < 1) throw new Error("No te quedan pociones.");
    h.enEstePiso ||= pisoNuevo();   // (las partidas de antes de la v26 no lo tenían)
    h.enEstePiso.tecnicas ||= {};   // (ni las de antes de la v38)
    h.tecnicas ||= [];
    h.voluntad ||= 0;
    if (accion === "tecnica") {
        const motivo = motivoTecnica(h, tecnica);
        if (motivo) throw new Error(motivo);
    }
    if (accion === "voluntad" && h.voluntad < VOLUNTAD.max) throw new Error("Tu Voluntad todavía no está llena.");
    const piso = h.enEstePiso;
    partida.turno = (partida.turno || 0) + 1;
    h.defendiendo = false;
    const forma = formaActual(m);      // su punto débil de ahora (el último guardián cambia a media vida)
    if (accion === "tecnica") piso.tecnicas[tecnica] = (piso.tecnicas[tecnica] || 0) + 1;
    const golpe = accion === "atacar" || (accion === "tecnica" && (tecnica === "quebrar" || tecnica === "certero"));
    if (accion === "hechizo" && m.espejo) {
        // Su espejo te devuelve el hechizo: a él no le hace nada y a ti, la mitad.
        if (!(tiene(h, "aurora") && !piso.aurora)) h.mana -= 1;
        else piso.aurora = true;
        const reflejado = Math.max(1, Math.round(h.hechizo * ESPECIALES.reflejo.devuelve));
        h.vida = Math.max(0, h.vida - reflejado);
        piso.atacado = true;
        eventos.push({ quien: "heroe", tipo: "hechizo", elemento, efecto: null, dano: 0, reflejado });
        frases.push(`¡${conMayuscula(elMonstruo(m))} te devuelve el hechizo con su espejo! Te quita ${reflejado}.`);
        salvarDeLaCaida(partida, eventos, frases);
    } else if (accion === "voluntad") {
        // El Golpe de Voluntad: rompe todo lo que lo cubre y pega fuerte.
        const base = Math.max(h.ataque, h.hechizo);
        if (tiene(h, "valor") && h.vida < h.vidaMax * HABILIDADES.valor.umbral) activas.push("valor");
        if (tiene(h, "juramento") && m.guardian) activas.push("juramento");
        const dano = Math.max(1, Math.round(base * VOLUNTAD.multiplica * factorDeDano(h, m) * (0.95 + azar(partida) * 0.1)));
        const rompio = Boolean(m.barrera || m.coraza || m.espejo || m.cargando);
        m.barrera = 0;
        m.coraza = false;
        m.espejo = false;
        const perdioCarga = Boolean(m.cargando);
        m.cargando = false;
        if (perdioCarga) m.intencion = "golpe";
        h.voluntad = 0;
        m.vida = Math.max(0, m.vida - dano);
        piso.atacado = true;
        eventos.push({ quien: "heroe", tipo: "voluntad", dano, rompio, nombre: "Golpe de Voluntad" });
        frases.push(`¡Golpe de Voluntad! Le quitas ${dano} ${alMonstruo(m)}.` + (rompio ? " Nada de lo que lo cubría resiste." : "") +
                    (perdioCarga ? " Pierde el golpe que cargaba." : ""));
    } else if (accion === "tecnica" && tecnica === "analizar") {
        m.analizado = true;
        const mana = h.mana < h.manaMax ? 1 : 0;
        h.mana += mana;
        const nombreDe = (e) => (e ? ELEMENTOS[e].nombre.toLowerCase() : null);
        eventos.push({ quien: "heroe", tipo: "tecnica", tecnica, nombre: TECNICAS.analizar.nombre, mana });
        frases.push(`Analizas ${alMonstruo(m)}: es débil al ${nombreDe(forma.debil) || "nada"}` +
                    (forma.resiste ? ` y resiste el ${nombreDe(forma.resiste)}` : " y no resiste nada") + "." +
                    (mana ? " Recuperas 1 PM." : ""));
    } else if (accion === "tecnica" && tecnica === "intimidar") {
        m.intimidada = true;
        sumarVoluntad(h, VOLUNTAD.alDefender);
        eventos.push({ quien: "heroe", tipo: "tecnica", tecnica, nombre: TECNICAS.intimidar.nombre });
        frases.push(`Miras ${alMonstruo(m)} a los ojos y no retrocedes.`);
    } else if (accion === "atacar" || accion === "hechizo" || golpe) {
        const magia = accion === "hechizo";
        // El punto débil de la criatura multiplica el daño del hechizo; lo que resiste, lo divide.
        let factor = magia ? factorElemento(forma, elemento) : 1;
        const efecto = factor > 1 ? "debil" : factor < 1 ? "resiste" : null;
        if (efecto === "debil" && tiene(h, "arcano")) factor = HABILIDADES.arcano.debil;
        const base = magia ? h.hechizo : h.ataque;
        const variacion = magia ? 0.9 + azar(partida) * 0.2 : 0.85 + azar(partida) * 0.3;
        const azarCritico = azar(partida);
        const porImpetu = tiene(h, "impetu") && !piso.atacado;
        const critico = tecnica === "certero" || porImpetu || azarCritico < h.critico;
        const multiplicaCritico = (tiene(h, "desgarro") ? HABILIDADES.desgarro.critico : 1.8) + (tieneDon(h, "cazador") ? DONES.cazador : 0);
        // «Eco arcano» (don): el primer hechizo de cada piso pega el doble.
        const eco = magia && tieneDon(h, "eco") && !piso.eco;
        if (eco) piso.eco = true;
        // (v71) Reacción elemental con el hechizo del turno anterior.
        const previo = magia && m.afectado && m.afectado.turno === partida.turno - 1 ? m.afectado.elemento : null;
        const reaccion = reaccionDe(previo, elemento);
        const extra = factorDeDano(h, m) * (eco ? 2 : 1) * (reaccion ? REACCIONES[reaccion].factor : 1) * (magia && tiene(h, "ojo-dragon") ? HABILIDADES["ojo-dragon"].magia : 1)
            * (magia && elemento === "fuego" && tiene(h, "llama") ? HABILIDADES.llama.fuego : 1)   // «Llama del Vigía»
            * (tecnica === "quebrar" ? TECNICAS.quebrar.fuerza : 1);
        // «Quebrar» rompe su barrera y su coraza antes de pegar.
        const rompio = tecnica === "quebrar" && Boolean(m.barrera || m.coraza);
        if (tecnica === "quebrar") {
            m.barrera = 0;
            m.coraza = false;
        }
        // La Explosión rompe su barrera y su coraza antes de pegar.
        const rompioReaccion = reaccion === "explosion" && Boolean(m.barrera || m.coraza);
        if (reaccion === "explosion") {
            m.barrera = 0;
            m.coraza = false;
        }
        // Si se cubrió con su coraza, tu golpe le hace la mitad.
        const coraza = m.coraza ? ESPECIALES.coraza.factor : 1;
        let dano = Math.max(1, Math.round(base * variacion * (critico ? multiplicaCritico : 1) * factor * extra * coraza));
        // «Embestida»: el golpe va dos veces (el segundo hace la mitad).
        const doble = !magia && tiene(h, "embestida");
        if (doble) dano += Math.max(1, Math.round(dano * HABILIDADES.embestida.segundo));
        // «Aurora»: el primer hechizo de cada piso no gasta PM.
        const gratis = magia && tiene(h, "aurora") && !piso.aurora;
        if (gratis) piso.aurora = true;
        else if (magia) h.mana -= 1;
        piso.atacado = true;
        // «Aturdir»: el primer golpe crítico de cada piso deja a la criatura sin su turno.
        const aturde = !magia && critico && tiene(h, "aturdir") && !piso.aturdio;
        if (aturde) {
            piso.aturdio = true;
            m.aturdida = true;
        }
        const absorbido = golpearA(m, dano);
        sumarVoluntad(h, VOLUNTAD.alGolpear);
        // (v71) Lo que deja la reacción, y el hechizo queda anotado para la siguiente.
        if (reaccion === "conduccion" && !m.guardian && m.vida > 0) m.aturdida = true;
        if (reaccion === "vapor" && m.vida > 0) m.empanada = true;
        if (magia) m.afectado = { elemento, turno: partida.turno };
        // «Sed del vencedor»: tus golpes y hechizos te curan.
        let cura = tiene(h, "sed") ? Math.min(Math.round(dano * HABILIDADES.sed.robo), h.vidaMax - h.vida) : 0;
        // «Sed de sangre» (don): cada golpe crítico te cura.
        if (critico && tieneDon(h, "sangre")) cura += Math.min(Math.round(h.vidaMax * DONES.sangre), h.vidaMax - h.vida - cura);
        h.vida += cura;
        const conTecnica = tecnica ? { tecnica, nombre: TECNICAS[tecnica].nombre, rompio } : {};
        // (v63) Lo que se notó en este golpe.
        if (porImpetu) activas.push("impetu");
        if (critico && tiene(h, "desgarro")) activas.push("desgarro");
        if (critico && tieneDon(h, "cazador")) activas.push("cazador");
        if (critico && tieneDon(h, "sangre") && cura > 0) activas.push("sangre");
        if (doble) activas.push("embestida");
        if (aturde) activas.push("aturdir");
        if (tiene(h, "sed") && cura > 0 && !(critico && tieneDon(h, "sangre"))) activas.push("sed");
        if (gratis) activas.push("aurora");
        if (eco) activas.push("eco");
        if (efecto === "debil" && tiene(h, "arcano")) activas.push("arcano");
        if (magia && tiene(h, "ojo-dragon")) activas.push("ojo-dragon");
        if (magia && elemento === "fuego" && tiene(h, "llama")) activas.push("llama");
        if (tiene(h, "valor") && h.vida < h.vidaMax * HABILIDADES.valor.umbral) activas.push("valor");
        if (tiene(h, "juramento") && m.guardian) activas.push("juramento");
        eventos.push(magia
            ? { quien: "heroe", tipo: "hechizo", elemento, efecto, dano, critico, cura, coraza: Boolean(m.coraza), absorbido, ...(reaccion ? { reaccion } : {}) }
            : { quien: "heroe", tipo: tecnica ? "tecnica" : "atacar", dano, critico, doble, cura, coraza: Boolean(m.coraza), absorbido, ...conTecnica });
        const que = magia ? `Tu hechizo de ${ELEMENTOS[elemento].nombre.toLowerCase()}`
            : tecnica ? `«${TECNICAS[tecnica].nombre}»` : doble ? "Tu doble golpe" : "Tu golpe";
        frases.push(`${rompio ? "¡Rompes lo que lo cubría! " : ""}${que} le quita ${dano} ${alMonstruo(m)}${critico ? " (¡crítico!)" : ""}.` +
                    (efecto === "debil" ? " ¡Es su punto débil!" : efecto === "resiste" ? " Lo resiste: casi no le duele." : "") +
                    (reaccion ? ` ¡Reacción de ${REACCIONES[reaccion].nombre}: ${rompioReaccion ? "rompe lo que lo cubría" : REACCIONES[reaccion].texto}${reaccion === "conduccion" && m.guardian ? " (pero un guardián lo resiste)" : ""}!` : "") +
                    (absorbido ? ` Su barrera para ${absorbido}${m.barrera ? ` (le queda ${m.barrera})` : " y se rompe"}.` : "") +
                    (m.coraza ? " Su coraza para la mitad." : "") +
                    (gratis ? " La aurora no te cobra el hechizo." : "") +
                    (eco ? " ¡El eco arcano duplica tu hechizo!" : "") +
                    (aturde ? ` ¡${conMayuscula(elMonstruo(m))} queda aturdid${m.genero === "f" ? "a" : "o"}!` : "") +
                    (cura ? ` Recuperas ${cura}.` : ""));
    } else if (accion === "defender") {
        h.defendiendo = true;
        sumarVoluntad(h, VOLUNTAD.alDefender);
        if (tiene(h, "bastion")) activas.push("bastion");
        if (tiene(h, "muralla")) activas.push("muralla");
        const curaBase = h.curaDefensa * (tiene(h, "bastion") ? HABILIDADES.bastion.cura : 1);
        const cura = Math.min(curaBase, h.vidaMax - h.vida);
        h.vida += cura;
        eventos.push({ quien: "heroe", tipo: "defender", cura });
        frases.push(`Te cubres${cura ? ` y recuperas ${cura}` : ""}.`);
    } else if (accion === "pocion") {
        h.pociones -= 1;
        const cura = Math.min(Math.round(h.vidaMax * 0.35), h.vidaMax - h.vida);
        h.vida += cura;
        const antidoto = (h.veneno || 0) > 0;   // la poción también cura el veneno
        h.veneno = 0;
        eventos.push({ quien: "heroe", tipo: "pocion", cura, antidoto });
        frases.push(`Bebes una poción: +${cura} de vida${antidoto ? " y se te pasa el veneno" : ""}.`);
    }

    // (v63) Las habilidades que se notaron van en tu evento: la pantalla las muestra con su nombre.
    const tuEvento = eventos.find((e) => e.quien === "heroe");
    if (tuEvento && activas.length) tuEvento.activas = [...new Set(activas)];

    // --- Tu mascota ---
    const suyo = actuaMascota(partida);
    if (suyo) {
        eventos.push(suyo.evento);
        frases.push(suyo.frase);
    }
    m.coraza = false;   // la coraza dura un solo turno tuyo (y de tu mascota)
    m.espejo = false;   // y el espejo también

    // --- ¿Cayó el monstruo? (o caíste tú con tu propio hechizo devuelto) ---
    if (m.vida <= 0) return vencer(partida, eventos, frases);
    if (h.vida <= 0) {
        partida.fase = "fin";
        frases.push(`Caíste en el ${nombreDelPiso(partida).toLowerCase()}.`);
        partida.registro = frases.join(" ");
        return eventos;
    }

    // --- El último guardián cambia de forma a media vida (una vez): su punto débil ya no es el mismo ---
    const fase = CRIATURAS[m.id]?.fase;
    if (fase && !m.cambio && m.vida <= m.vidaMax / 2) {
        m.cambio = true;
        m.analizado = false;
        eventos.push({ quien: "fase", tipo: "fase", nombre: fase.nombre });
        frases.push(`¡${conMayuscula(elMonstruo(m))} cambia de forma («${fase.nombre}»)! Su punto débil ya no es el mismo.`);
    }

    // --- Los guardianes de la Mazmorra se enfurecen al quedar con media vida (una vez) ---
    if (reglasDe(partida).enfurecer && m.guardian && !m.enfurecido && m.vida <= m.vidaMax / 2) {
        m.enfurecido = true;
        m.ataque = Math.round(m.ataque * FURIA_GUARDIAN);
        eventos.push({ quien: "furia", tipo: "enfurecido", nombre: "¡Furia!" });
        frases.push(`¡${conMayuscula(elMonstruo(m))} se enfurece al verse herid${m.genero === "f" ? "a" : "o"}! Su ataque sube a ${m.ataque}.`);
    }

    // --- Turno del monstruo ---
    const intencion = m.intencion;
    const sujeto = conMayuscula(elMonstruo(m));
    const especial = intencion === "especial" ? especialDe(m) : null;
    const empanadaAhora = Boolean(m.empanada);   // (v71) el Vapor dura un solo turno de la criatura
    const dePiedra = Boolean(m.petrificada || m.aturdida || m.intimidada);
    if (m.intimidada) {
        // «Intimidar»: pierde esta acción, y si estaba cargando un golpe, también lo pierde.
        const perdioCarga = Boolean(m.cargando) || intencion === "descarga";
        m.intimidada = false;
        m.cargando = false;
        m.aturdida = false;
        m.petrificada = false;
        m.intencion = "golpe";
        eventos.push({ quien: "enemigo", tipo: "intimidada", nombre: "Intimidad" + (m.genero === "f" ? "a" : "o") });
        frases.push(`${sujeto} duda y pierde su turno${perdioCarga ? ": ¡se le escapa el golpe que cargaba!" : "."}`);
    } else if (m.aturdida && !m.petrificada) {
        // «Aturdir» (el martillo de guerra): pierde este turno y guarda lo que planeaba.
        m.aturdida = false;
        eventos.push({ quien: "enemigo", tipo: "aturdida", nombre: "Aturdid" + (m.genero === "f" ? "a" : "o") });
        frases.push(`${sujeto} sigue aturdid${m.genero === "f" ? "a" : "o"}: pierde su turno.`);
    } else if (dePiedra) {
        m.aturdida = false;
        // La mirada del basilisco: pierde este turno (y guarda lo que planeaba para el próximo).
        m.petrificada = false;
        eventos.push({ quien: "enemigo", tipo: "petrificada", nombre: "De piedra" });
        frases.push(`${sujeto} sigue de piedra: pierde su turno.`);
    } else if (especial?.tipo === "coraza") {
        m.coraza = true;
        eventos.push({ quien: "enemigo", tipo: "especial", especial: "coraza", nombre: especial.nombre });
        frases.push(`${sujeto} se cubre con «${especial.nombre}»: tu próximo golpe le hará la mitad.`);
    } else if (especial?.tipo === "barrera") {
        m.barrera = Math.round(m.vidaMax * ESPECIALES.barrera.parte);
        eventos.push({ quien: "enemigo", tipo: "especial", especial: "barrera", nombre: especial.nombre, barrera: m.barrera });
        frases.push(`${sujeto} levanta «${especial.nombre}»: una barrera de ${m.barrera} para tus golpes.`);
    } else if (especial?.tipo === "reflejo") {
        m.espejo = true;
        eventos.push({ quien: "enemigo", tipo: "especial", especial: "reflejo", nombre: especial.nombre });
        frases.push(`${sujeto} se cubre con «${especial.nombre}»: si le lanzas un hechizo, te lo devuelve.`);
    } else if (especial?.tipo === "carga") {
        m.cargando = true;
        eventos.push({ quien: "enemigo", tipo: "especial", especial: "carga", nombre: especial.nombre });
        frases.push(`${sujeto} empieza a cargar «${especial.nombre}». ¡El próximo turno lo suelta!`);
    } else if (GOLPES.includes(intencion)) {
        const nombre = nombreDelAtaque(m);
        const tipoEspecial = especial?.tipo || null;
        // «Sombra»: puedes esquivarlo del todo.
        const esquivar = Math.min(ESQUIVAR_MAXIMO, tiene(h, "sombra") ? HABILIDADES.sombra.esquivar : 0);
        if (esquivar && azar(partida) < esquivar) {
            eventos.push({ quien: "enemigo", tipo: intencion, especial: tipoEspecial, dano: 0, nombre, esquivado: true, activas: ["sombra"] });
            frases.push(`${sujeto} usa «${nombre}», pero lo esquivas.`);
        } else {
            const activasE = [];   // (v63) lo que se notó en este golpe de la criatura
            if (m.intencion === "fuerte" && tiene(h, "presagio")) activasE.push("presagio");
            let dano = danoContra(h, m);
            if (m.empanada) dano = Math.round(dano * GOLPE_VAPOR);   // (v71) el Vapor le quita fuerza a este golpe
            if (tiene(h, "firme") && !piso.golpeado) {   // «Firme»: el primero no duele
                dano = 0;
                activasE.push("firme");
            }
            piso.golpeado = true;
            h.vida = Math.max(0, h.vida - dano);
            if (dano > 0) sumarVoluntad(h, VOLUNTAD.alRecibir);   // lo que aguantas te da Voluntad
            if (intencion === "descarga") m.cargando = false;
            // «Escamas»: le devuelves parte del golpe.
            // (y «Piel de espinas», un don, le devuelve parte del golpe).
            const reflejoEscamas = tiene(h, "escamas") ? Math.round(dano * HABILIDADES.escamas.reflejo) : 0;
            const reflejo = reflejoEscamas + (tieneDon(h, "espinas") ? Math.round(dano * DONES.espinas) : 0);
            golpearA(m, reflejo);
            if (reflejoEscamas > 0) activasE.push("escamas");
            if (tieneDon(h, "espinas") && dano > 0) activasE.push("espinas");
            const evento = { quien: "enemigo", tipo: intencion, especial: tipoEspecial, dano, nombre, reflejo };
            if (tipoEspecial === "veneno" && tiene(h, "llama") && !h.inmuneVeneno) activasE.push("llama");
            if (activasE.length) evento.activas = activasE;
            let extra = "";
            if (tipoEspecial === "veneno" && (h.inmuneVeneno || tiene(h, "llama"))) {
                extra = h.inmuneVeneno ? " Tu raíz amarga para el veneno." : " La Llama del Vigía quema el veneno.";
            } else if (tipoEspecial === "veneno") {
                h.veneno = ESPECIALES.veneno.turnos;
                extra = " ¡Te envenena!";
            } else if (tipoEspecial === "drenar" && m.vida > 0) {
                evento.cura = Math.min(dano, m.vidaMax - m.vida);
                m.vida += evento.cura;
                if (evento.cura) extra = ` Se cura ${evento.cura}.`;
            } else if (tipoEspecial === "sellar") {
                evento.sello = Math.min(ESPECIALES.sellar.pm, h.mana);
                h.mana -= evento.sello;
                extra = evento.sello ? ` Sella tu magia: −${evento.sello} PM.` : "";
            }
            eventos.push(evento);
            frases.push(`${sujeto} usa «${nombre}»: −${dano}${h.defendiendo ? " (bloqueaste parte)" : ""}.${extra}` +
                        (reflejo ? ` Tus ${reflejoEscamas ? "escamas" : "espinas"} le devuelven ${reflejo}.` : ""));
            salvarDeLaCaida(partida, eventos, frases);
        }
    } else if (intencion === "furia") {
        m.ataque = Math.round(m.ataque * 1.25);
        eventos.push({ quien: "enemigo", tipo: "furia", nombre: "Furia" });
        frases.push(`${sujeto} se enfurece: su ataque sube a ${m.ataque}.`);
    } else if (intencion === "curar") {
        const cura = Math.min(Math.round(m.vidaMax * 0.18), m.vidaMax - m.vida);
        m.vida += cura;
        eventos.push({ quien: "enemigo", tipo: "curar", cura, nombre: "Regenerar" });
        frases.push(`${sujeto} se cura ${cura}.`);
    }

    if (empanadaAhora) m.empanada = false;

    // --- Las que se regeneran recuperan un poco al final de cada turno (v38) ---
    if (regeneraDe(m) && m.vida > 0 && m.vida < m.vidaMax && h.vida > 0) {
        const cura = Math.min(Math.round(m.vidaMax * regeneraDe(m)), m.vidaMax - m.vida);
        m.vida += cura;
        eventos.push({ quien: "regenera", tipo: "regenera", cura });
        frases.push(`Se regenera ${cura}.`);
    }

    // --- El veneno: al final de cada turno, mientras dure ---
    if (h.vida > 0 && (h.veneno || 0) > 0) {
        const dano = Math.max(1, Math.round(h.vidaMax * ESPECIALES.veneno.porTurno));
        h.vida = Math.max(0, h.vida - dano);
        h.veneno -= 1;
        eventos.push({ quien: "veneno", tipo: "veneno", dano });
        frases.push(`El veneno te quita ${dano}${h.veneno ? ` (${h.veneno} ${h.veneno === 1 ? "turno más" : "turnos más"})` : " y se pasa"}.`);
        salvarDeLaCaida(partida, eventos, frases);
    }

    if (h.vida <= 0) {
        partida.fase = "fin";
        frases.push(`Caíste en el ${nombreDelPiso(partida).toLowerCase()}.`);
    } else if (m.vida <= 0) {
        return vencer(partida, eventos, frases);   // lo derribaron tus escamas
    } else if (!dePiedra) {
        m.intencion = nuevaIntencion(partida);
    }
    partida.registro = frases.join(" ");
    return eventos;
}

// El monstruo cayó: se acaba el piso y toca elegir la mejora.
function vencer(partida, eventos, frases) {
    frases.push(`¡${conMayuscula(elMonstruo(partida.enemigo))} cae! ${nombreDelPiso(partida)} superado.`);
    // «Botín de guerra» (don): al vencer recuperas un poco de vida.
    const h = partida.heroe;
    if (tieneDon(h, "botin") && h.vida > 0) {
        const cura = Math.min(Math.round(h.vidaMax * DONES.botin), h.vidaMax - h.vida);
        h.vida += cura;
        if (cura) frases.push(`Del botín de guerra recuperas ${cura}.`);
    }
    // (v60) Vencer a una criatura de élite: +1 poción (y el botín trae un don seguro, ver mejorasAlAzar).
    if (partida.enemigo.elite) {
        h.pociones += 1;
        frases.push("Era de élite: +1 poción.");
    }
    partida.fase = "mejora";
    partida.cine = cineAlVencer(partida);
    partida.opciones = mejorasAlAzar(partida);
    partida.registro = frases.join(" ");
    eventos.push({ quien: "enemigo", tipo: "derrotado" });
    return eventos;
}

// Lo que multiplica tu daño según tus habilidades: «Valor» (con poca vida) y «Juramento» (contra guardianes).
function factorDeDano(h, m) {
    let factor = 1;
    if (tiene(h, "valor") && h.vida < h.vidaMax * HABILIDADES.valor.umbral) factor *= HABILIDADES.valor.extra;
    if (tiene(h, "juramento") && m.guardian) factor *= HABILIDADES.juramento.guardianes;
    return factor;
}

// Si un golpe te dejó en 0: «Gracia» (una vez por piso) o el fénix (una vez por subida) te levantan.
function salvarDeLaCaida(partida, eventos, frases) {
    const h = partida.heroe;
    if (h.vida > 0) return;
    if (tiene(h, "gracia") && !h.enEstePiso.gracia) {
        h.enEstePiso.gracia = true;
        h.vida = Math.max(1, Math.round(h.vidaMax * HABILIDADES.gracia.vida));
        eventos.push({ quien: "heroe", tipo: "habilidad", habilidad: "gracia", nombre: HABILIDADES.gracia.nombre, cura: h.vida });
        frases.push(`«Gracia»: una luz te sostiene y quedas con ${h.vida} de vida.`);
        return;
    }
    const pet = partida.mascota;
    const datos = pet && MASCOTAS[pet.especie]?.torre;
    if (datos?.tipo === "fenix" && pet.potencia > 0 && !partida.renacio) {
        partida.renacio = true;
        h.vida = Math.max(1, Math.round(h.vidaMax * datos.renacer * Math.min(1, pet.potencia)));
        eventos.push({ quien: "mascota", tipo: "renacer", cura: h.vida, nombre: "Renacer" });
        frases.push(`${pet.nombre} te envuelve en llamas: ¡renaces con ${h.vida} de vida!`);
    }
}

// Lo que hace tu mascota en este turno (o null si no le toca o no puede pelear).
// Una cría actúa un turno más tarde que una adulta; un huevo o una mascota triste no pelean.
function actuaMascota(partida) {
    const pet = partida.mascota;
    const datos = pet && MASCOTAS[pet.especie]?.torre;
    if (!datos || !(pet.potencia > 0)) return null;
    const h = partida.heroe;
    const m = partida.enemigo;
    if (m.vida <= 0) return null;
    const nombre = MASCOTAS[pet.especie].habilidad.nombre;
    const cada = (datos.cada || 1) + (pet.etapa === "cria" ? 1 : 0);
    const toca = partida.turno % cada === 0;

    if (datos.tipo === "ataque" && toca) {
        const factor = datos.elemento ? factorElemento(formaActual(m), datos.elemento) : 1;
        const efecto = factor > 1 ? "debil" : factor < 1 ? "resiste" : null;
        const guardian = datos.guardianes && m.guardian ? datos.guardianes : 1;
        const coraza = m.coraza ? ESPECIALES.coraza.factor : 1;   // también choca con su coraza
        const dano = Math.max(1, Math.round(h.ataque * datos.fuerza * pet.potencia * factor * guardian * coraza));
        golpearA(m, dano);
        return {
            evento: { quien: "mascota", tipo: "ataque", dano, elemento: datos.elemento || null, efecto, nombre },
            frase: `${pet.nombre} usa «${nombre}»: −${dano}.` + (efecto === "debil" ? " ¡Punto débil!" : efecto === "resiste" ? " Lo resiste." : ""),
        };
    }
    if (datos.tipo === "mana" && toca && h.mana < h.manaMax) {
        h.mana += 1;
        return { evento: { quien: "mascota", tipo: "mana", nombre }, frase: `${pet.nombre} te devuelve un hechizo (PM ${h.mana}/${h.manaMax}).` };
    }
    if (datos.tipo === "petrificar" && toca) {
        m.petrificada = true;
        return { evento: { quien: "mascota", tipo: "petrificar", nombre }, frase: `${pet.nombre} usa «${nombre}»: ¡${elMonstruo(m)} queda de piedra!` };
    }
    if (datos.tipo === "fenix") {
        const cura = Math.min(Math.round(h.vidaMax * datos.cura * pet.potencia), h.vidaMax - h.vida);
        if (cura > 0) {
            h.vida += cura;
            return { evento: { quien: "mascota", tipo: "cura", cura, nombre: "Llama vital" }, frase: `${pet.nombre} te cura ${cura}.` };
        }
    }
    return null;
}

// Mejoras distintas al azar: 3, o 4 con «Constancia». Desde el piso 3, a veces una de ellas es un don (la última).
function mejorasAlAzar(partida) {
    const h = partida.heroe;
    // «Maestría» solo si ya sabes alguna técnica (y hasta 2 veces).
    const claves = Object.keys(MEJORAS).filter((clave) => !MEJORAS[clave].don &&
        (clave !== "maestria" || ((h.tecnicas || []).length && (h.maestria || 0) < 2)));
    const dones = Object.keys(MEJORAS).filter((clave) => MEJORAS[clave].don && !tieneDon(h, clave));
    const cuantas = tiene(partida.heroe, "constancia") ? 4 : 3;
    // (la élite deja un don seguro, si te queda alguno por tener)
    const conDon = dones.length > 0 && (partida.enemigo?.elite || (partida.piso >= DONES.desdePiso && azar(partida) < DONES.probabilidad));
    const elegidas = [];
    while (elegidas.length < cuantas - (conDon ? 1 : 0)) {
        const clave = elegir(partida, claves);
        if (!elegidas.includes(clave)) elegidas.push(clave);
    }
    if (conDon) elegidas.push(elegir(partida, dones));
    return elegidas;
}

// Aplicar la mejora elegida y pasar al piso siguiente (en la Mazmorra, bajar).
// Le da una mejora al héroe (sin pasar de piso). La usan elegirMejora y el cofre de las salas (v42).
function darMejora(h, clave) {
    if (MEJORAS[clave].don) h.dones = [...(h.dones || []), clave];   // un don no hace nada aquí: lo leen las batallas
    switch (clave) {
        case "afilar":   h.ataque += 3; break;
        case "tomo":     h.hechizo += 5; break;
        case "vigor":    h.vidaMax += 12; h.vida = Math.min(h.vidaMax, h.vida + 12); break;
        case "frasco":   h.pociones += 1; break;
        case "mana":     h.manaMax += 1; break;
        case "suerte":   h.critico = Math.min(0.5, h.critico + 0.06); break;
        case "escudo":   h.defensa = Math.max(h.defensa, Math.min(tiene(h, "muralla") ? 0.95 : 0.85, h.defensa + 0.08)); break;
        case "descanso": h.vida = Math.min(h.vidaMax, h.vida + Math.round(h.vidaMax * 0.4)); break;
        case "impulso":  sumarVoluntad(h, 35); break;
        case "maestria": h.maestria = (h.maestria || 0) + 1; break;
    }
}

export function elegirMejora(partida, clave) {
    if (partida.fase !== "mejora" || !partida.opciones.includes(clave)) throw new Error("Elige una de las mejoras.");
    const h = partida.heroe;
    darMejora(h, clave);
    if (tiene(h, "constancia")) {
        h.ataque += HABILIDADES.constancia.ataque;
        h.hechizo += HABILIDADES.constancia.hechizo;
    }
    // Al subir: recuperas un poco de vida (más con el «Manto regio») y todos tus hechizos.
    // En la Mazmorra no hay descanso: solo lo del «Manto regio». El veneno se pasa.
    // Con la marca «Ayuno» no recuperas nada.
    const asalto = modoDe(partida) === "asalto";
    const curaBase = asalto ? MODOS.asalto.curaEntreCombates : reglasDe(partida).curaAlSubir;   // (v65) en el asalto, 30 % entre guardianes
    const cura = partida.marca === "ayuno" ? 0 : curaBase + (tiene(h, "regia") ? HABILIDADES.regia.cura : 0);
    h.vida = Math.min(h.vidaMax, h.vida + Math.round(h.vidaMax * cura));
    h.mana = h.manaMax;
    h.veneno = 0;
    h.defendiendo = false;
    h.enEstePiso = pisoNuevo();
    partida.piso += asalto ? PISOS_POR_ZONA : 1;
    partida.enemigo = marcarEnemigo(partida.marca, rugir(h, monstruoDelPiso(partida.piso, partida.lugar)));
    partida.enemigo.intencion = nuevaIntencion(partida);
    partida.opciones = [];
    partida.fase = "batalla";
    const zona = zonaDelPiso(partida.piso, partida.lugar);
    const m = partida.enemigo;
    const entras = partida.piso % PISOS_POR_ZONA === 1 ? `Entras ${aLaZona(zona)}. ` : "";
    partida.registro = esGuardian(partida.piso)
        ? `${nombreDelPiso(partida)}: ¡${elMonstruo(m)}, ${m.genero === "f" ? "guardiana" : "guardián"} ${deLaZona(zona)}, te cierra el paso!`
        : `${entras}${nombreDelPiso(partida)}: aparece ${elMonstruo(m)}.`;
    partida.cine = cineAlLlegar(partida);
    // v42: en algunos pisos, antes de pelear, hay una sala (la criatura espera al otro lado).
    const tipo = salaDelPiso(partida);
    if (tipo) {
        partida.sala = { tipo, antes: partida.registro };
        partida.fase = "sala";
        partida.registro = `${nombreDelPiso(partida)}: ${SALAS[tipo].texto}`;
    } else if (hayRuta(partida.piso) && !asalto) {
        // v60: el camino se bifurca (la criatura espera al final de cualquiera de los dos).
        partida.ruta = { antes: partida.registro };
        partida.fase = "ruta";
        partida.registro = `${nombreDelPiso(partida)}: el camino se bifurca. ¿Por dónde sigues?`;
    }
}


// ===== Cinemáticas (v43) =====
// Aquí solo se ANOTA cuál toca (en `partida.cine`); qué se ve lo dice cinematicas.js y la reproduce app.js, que
// después la borra con acciones.tomarCinematica. Una partida guardada con una cinemática sin ver la mostrará al abrirse.
//   al llegar a un piso: "entrada" (es el de un guardián) o "zona" (empieza una zona nueva; el piso 1 ya tiene su historia)
//   al vencer: "derrota" (cayó un guardián) o "final" (cayó el último del lugar: el Apagador o el Rey Hueco)
function cineAlLlegar(partida) {
    if (esGuardian(partida.piso)) return "entrada";
    if (partida.piso % PISOS_POR_ZONA === 1 && partida.piso > 1) return "zona";
    return null;
}

function cineAlVencer(partida) {
    if (!esGuardian(partida.piso)) return null;
    return partida.piso === lugarDe(partida.lugar).zonas.length * PISOS_POR_ZONA ? "final" : "derrota";
}


// ===== Salas especiales (v42) =====
// Entre algunos pisos de la Torre (el 3.º de cada zona y el último, el del guardián) aparece una sala: un respiro
// donde eliges qué hacer, sin pelear. La Mazmorra no tiene: ahí no hay descanso. Todo sale de tu partida (vida,
// pociones, hechizos…), no se gasta ninguna gema. La partida queda en fase "sala" hasta que eliges (o sales).
//   partida.sala = { tipo, antes (lo que decía el registro del piso, para devolverlo al elegir) }
// Cada opción: nombre y texto (lo que cuesta y lo que da). `seguir` no hace nada.
export const SALAS = {
    fuente: {
        icono: "⛲", nombre: "Fuente clara",
        texto: "Una fuente de agua clara brota entre las piedras, justo antes de lo que viene.",
        opciones: {
            beber:   { nombre: "Beber",            texto: "Recuperas 40 % de tu vida" },
            frasco:  { nombre: "Llenar un frasco", texto: "+1 poción" },
            seguir:  { nombre: "Seguir",           texto: "No tocas nada" },
        },
    },
    altar: {
        icono: "🕯️", nombre: "Altar antiguo",
        texto: "Un altar de los Vigías con velas encendidas. Pide una ofrenda, o un rezo.",
        opciones: {
            sangre:  { nombre: "Ofrecer sangre",   texto: "Pierdes 25 % de tu vida actual: +4 de ataque y +8 de hechizo" },
            rezar:   { nombre: "Rezar",            texto: "+35 de Voluntad" },
            seguir:  { nombre: "Seguir",           texto: "No tocas nada" },
        },
    },
    mercader: {
        icono: "🛒", nombre: "Mercader errante",
        texto: "Un mercader encapuchado vende en la escalera. No acepta gemas: solo trueques.",
        opciones: {
            vigor:   { nombre: "Poción por vigor",  texto: "−1 poción: +14 de vida máxima" },
            frascos: { nombre: "Vida por frascos",  texto: "−20 % de tu vida actual: +2 pociones" },
            filo:    { nombre: "Magia por filo",    texto: "−1 hechizo por piso: +5 de ataque" },
            seguir:  { nombre: "Seguir",            texto: "No compras nada" },
        },
    },
    cofre: {
        icono: "📦", nombre: "Cofre sin dueño",
        texto: "Un cofre cerrado entre los escombros. Puede guardar un tesoro… o una trampa.",
        opciones: {
            abrir:   { nombre: "Abrirlo",          texto: "70 %: un don o una mejora · 30 %: una trampa (−15 % de vida máxima de golpe)" },
            seguir:  { nombre: "Dejarlo",          texto: "No te arriesgas" },
        },
    },
};
const TRAMPA = { probabilidad: 0.3, vida: 0.15 };

// Un número entre 0 y 1 que sale de la partida y del piso (NO gasta el azar de las batallas, así que las salas
// no mueven las semillas del resto de la partida).
function azarDeSala(partida, etiqueta) {
    return (hashDeTexto(`${partida.semilla}|${partida.piso}|${etiqueta}`) % 1000) / 1000;
}

// ¿Qué sala hay antes de este piso? (o null). Solo en la Torre: el 3.º de cada zona (al azar entre altar, mercader
// y cofre) y el del guardián (una fuente para prepararte).
function salaDelPiso(partida) {
    if (partida.lugar !== "torre" || modoDe(partida) === "asalto") return null;   // (el asalto no tiene salas)
    const lugarEnZona = partida.piso % PISOS_POR_ZONA;
    if (lugarEnZona === 0) return "fuente";
    if (lugarEnZona === 3) return ["altar", "mercader", "cofre"][Math.floor(azarDeSala(partida, "sala") * 3)];
    return null;
}

// ¿Puedes hacer esta opción ahora? Devuelve null si sí, o el motivo si no (para el botón y para las reglas).
export function motivoSala(partida, opcion) {
    const h = partida.heroe;
    const sala = SALAS[partida.sala?.tipo];
    if (!sala?.opciones[opcion]) return "Esa opción no existe.";
    if (opcion === "sangre" && h.vida < 4) return "Estás demasiado herido para ofrecer sangre.";
    if (opcion === "vigor" && h.pociones < 1) return "No tienes pociones para cambiar.";
    if (opcion === "frascos" && h.vida < 6) return "Estás demasiado herido para este trato.";
    if (opcion === "filo" && h.manaMax < 1) return "No tienes hechizos que cambiar.";
    return null;
}

// Haz lo que elijas en la sala y sigue al piso. Devuelve { texto }: lo que pasó.
export function resolverSala(partida, opcion) {
    if (partida.fase !== "sala" || !partida.sala) throw new Error("Ahora no estás en una sala.");
    const motivo = motivoSala(partida, opcion);
    if (motivo) throw new Error(motivo);
    const h = partida.heroe;
    const pierde = (cantidad) => Math.max(0, Math.min(h.vida - 1, Math.max(1, Math.round(cantidad))));   // nunca te mata
    let texto = "Sigues tu camino.";
    switch (opcion) {
        case "beber": {
            const cura = Math.min(Math.round(h.vidaMax * 0.4), h.vidaMax - h.vida);
            h.vida += cura;
            texto = cura ? `Bebes y recuperas ${cura} de vida.` : "Bebes: ya estabas entero.";
            break;
        }
        case "frasco":  h.pociones += 1; texto = "Llenas un frasco: +1 poción."; break;
        case "sangre": {
            const perdida = pierde(h.vida * 0.25);
            h.vida -= perdida;
            h.ataque += 4;
            h.hechizo += 8;
            texto = `Ofreces ${perdida} de vida al altar: +4 de ataque y +8 de hechizo.`;
            break;
        }
        case "rezar":   sumarVoluntad(h, 35); texto = "Rezas ante el altar: +35 de Voluntad."; break;
        case "vigor":   h.pociones -= 1; h.vidaMax += 14; h.vida += 14; texto = "Entregas una poción: +14 de vida máxima."; break;
        case "frascos": {
            const perdida = pierde(h.vida * 0.2);
            h.vida -= perdida;
            h.pociones += 2;
            texto = `Pagas ${perdida} de vida: +2 pociones.`;
            break;
        }
        case "filo":    h.manaMax -= 1; h.mana = Math.min(h.mana, h.manaMax); h.ataque += 5; texto = "Cambias un hechizo por filo: +5 de ataque."; break;
        case "abrir": {
            if (azarDeSala(partida, "cofre") < TRAMPA.probabilidad) {
                const dano = pierde(h.vidaMax * TRAMPA.vida);   // el 15 % de la máxima, sin matarte
                h.vida -= dano;
                texto = `¡Una trampa! Pierdes ${dano} de vida.`;
            } else {
                const dones = Object.keys(MEJORAS).filter((c) => MEJORAS[c].don && !tieneDon(h, c));
                const comunes = Object.keys(MEJORAS).filter((c) => !MEJORAS[c].don && c !== "maestria" && c !== "descanso");
                const lista = dones.length && azarDeSala(partida, "tipo") < 0.5 ? dones : comunes;
                const clave = lista[Math.floor(azarDeSala(partida, "premio") * lista.length)];
                darMejora(h, clave);
                texto = `Dentro hay ${MEJORAS[clave].icono} ${MEJORAS[clave].nombre}: ${MEJORAS[clave].texto}.`;
            }
            break;
        }
    }
    partida.registro = `${texto} ${partida.sala.antes}`;
    partida.sala = null;
    partida.fase = "batalla";
    return { texto };
}

// Lo que ganas al terminar, según los pisos que superaste (y el lugar: la Mazmorra paga más).
// En gemas 💎 (no en monedas) y XP.
// marca (v41, opcional): la que elegiste al empezar; multiplica el premio (ya con el tope puesto).
export function premio(pisos, lugar = "torre", marca = null, modo = "normal") {
    const p = (REGLAS[lugar] || REGLAS.torre).premio;
    const factor = (MARCAS[marca]?.premio || 1) * (modo === "asalto" ? MODOS.asalto.premio : 1);
    return {
        gemas: Math.floor(Math.min(p.maxGemas, pisos * p.gemasPorPiso) * factor),
        xp: Math.floor(Math.min(p.maxXp, Math.floor(pisos * p.xpPorPiso)) * factor),
    };
}
