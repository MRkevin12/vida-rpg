// torre-reglas.js — Las reglas FIJAS de la Torre y de las mazmorras: premios, REGLAS por lugar, modos (v65),
// reacciones elementales (v71), marcas (v41), dones y mejoras, técnicas y Voluntad (v38), rutas (v60),
// cómo se nombra a una criatura y el azar con semilla.
//
// Salió de torre.js, que lo reexporta (`export *`): en la app se sigue usando `torre.MODOS`, `torre.premio(...)`, etc.
// Este archivo NO importa nada de torre.js (así no hay ciclos).

import { CRIATURAS, ORDEN, PISOS_POR_ZONA, lugarDe, LUGARES } from "./bestiario.js";
import { NUEVOS_LUGARES } from "./mazmorras.js";
import { semilla as hashDeTexto } from "../desafios.js";
import { nivelDeGym } from "../gym/gym.js";


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
export function marcarEnemigo(marca, m) {
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
export const reglasDe = (partida) => REGLAS[partida.lugar] || REGLAS.torre;

// Cuántos pisos de la Torre hay que superar para que se abra la Mazmorra (vencer al guardián del 20).
export const ABRIR_MAZMORRA = 20;

// arcade = estado.arcade. Se abre con tu récord de la Torre, o en cuanto lo superas en la subida de ahora.
export function mazmorraAbierta(arcade) {
    const enCurso = arcade?.torre && modoDe(arcade.torre) !== "asalto" ? pisosSuperados(arcade.torre) : 0;
    return Math.max(arcade?.records?.torre || 0, enCurso) >= ABRIR_MAZMORRA;
}

// (v64) ¿Está abierto ese lugar? La Torre, siempre; la Mazmorra, al superar el piso 20 de la Torre; las demás, al superar cierto
// piso del lugar anterior (ver `abre` en mazmorras.js). Cuenta lo que llevas en la partida de ahora.
// (v73) La Fragua Profunda también se abre con tu cuerpo: `abre.gym` es el nivel de gimnasio que la abre. Como lugarAbierto solo
// recibe `estado.arcade`, esta función le suma `gymNivel` a una copia.
export const arcadeConGym = (estado) => ({ ...estado.arcade, gymNivel: nivelDeGym(estado.gym?.sesiones || []).nivel });

export function lugarAbierto(arcade, lugar) {
    if (lugar === "torre") return true;
    if (lugar === "mazmorra") return mazmorraAbierta(arcade);
    const abre = LUGARES[lugar]?.abre;
    if (!abre) return false;
    const enCurso = arcade?.[abre.lugar] && modoDe(arcade[abre.lugar]) !== "asalto" ? pisosSuperados(arcade[abre.lugar]) : 0;
    if (abre.gym && (arcade?.gymNivel || 0) >= abre.gym) return true;
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
export const especialDe = (m) => CRIATURAS[m.id]?.especial || null;

// Lo que se regenera cada turno (parte de su vida máxima), si es de las que se regeneran.
export const regeneraDe = (m) => CRIATURAS[m.id]?.regenera || 0;

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
export const usosPorPiso = (h) => 1 + (h.maestria || 0);

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
export const tieneDon = (h, clave) => (h.dones || []).includes(clave);

export const INTENCIONES = {
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
export const elMonstruo = (m) => `${m.genero === "f" ? "la" : "el"} ${m.nombre}`;
export const alMonstruo = (m) => (m.genero === "f" ? `a la ${m.nombre}` : `al ${m.nombre}`);
export const conMayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

// Cómo se llama el ataque que va a usar («Mordisco», «Picada», «Filamentos»…).
export function nombreDelAtaque(m) {
    const criatura = CRIATURAS[m.id] || {};
    if (m.intencion === "especial" || m.intencion === "descarga") return criatura.especial?.nombre || "Ataque";
    return (m.intencion === "fuerte" ? criatura.fuerte : criatura.golpe) || "Ataque";
}

// «Piso 7» o «Sótano 7».
export const nombreDelPiso = (partida, piso = partida.piso) => `${lugarDe(partida.lugar).piso} ${piso}`;


// ===== Azar con semilla =====
// La partida guarda su propia "semilla": así se puede repetir igual (útil en las pruebas)
// y no cambia si cierras y vuelves a abrir la app a mitad de un turno.
export function azar(partida) {
    partida.semilla = (partida.semilla * 1664525 + 1013904223) % 4294967296;
    return partida.semilla / 4294967296;
}

export function elegir(partida, lista) {
    return lista[Math.floor(azar(partida) * lista.length)];
}


export function pisosSuperados(partida) {
    return partida.piso - (modoDe(partida) === "asalto" ? PISOS_POR_ZONA : 1);
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
