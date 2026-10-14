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
// Como todo lo que es "juego puro", este archivo no dibuja ni guarda nada: recibe la
// partida (un objeto) y la cambia. La partida se guarda en estado.arcade.torre (o en
// estado.arcade.mazmorra), así puedes salir y seguir después.

import { CRIATURAS, ELEMENTOS, ORDEN, PISOS_POR_ZONA, idDelPiso, vueltaDelPiso, zonaDelPiso, factorElemento, lugarDe, aLaZona, deLaZona } from "./bestiario.js";
import { HABILIDADES, ESQUIVAR_MAXIMO, tiene } from "./habilidades.js";
import { MASCOTAS } from "./mascota.js";

// El premio es en gemas 💎 (la moneda del arcade, v31) y algo de XP (desde la v31, la mitad).
export const ATRIBUTO = "carisma";                       // el premio sube Carisma
export const PREMIO = { gemasPorPiso: 3, xpPorPiso: 2.5, maxGemas: 40, maxXp: 30 };
export const CADA_GUARDIAN = PISOS_POR_ZONA;             // cada 5 pisos, un guardián (más fuerte)

// Lo que cambia según el lugar:
//   atributo y premio: lo que ganas al terminar · curaAlSubir: parte de tu vida que recuperas
//   al pasar de piso · enfurecer: los guardianes se enfurecen al quedar con media vida.
export const REGLAS = {
    torre:    { atributo: ATRIBUTO, premio: PREMIO, curaAlSubir: 0.1, enfurecer: false },
    mazmorra: { atributo: "fuerza", premio: { gemasPorPiso: 5, xpPorPiso: 4, maxGemas: 80, maxXp: 60 },
                curaAlSubir: 0, enfurecer: true },
};

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
    const enCurso = arcade?.torre ? pisosSuperados(arcade.torre) : 0;
    return Math.max(arcade?.records?.torre || 0, enCurso) >= ABRIR_MAZMORRA;
}

// Los ataques especiales de las criaturas de la Mazmorra.
//   fuerza: cuánto de su ataque pega (la coraza no pega).
//   veneno: además te quita parte de tu vida máxima al final de cada turno, durante 3 turnos
//           (defenderte no lo para; una poción, sí).
//   drenar: se cura lo mismo que te quitó.
//   sellar: te quita hechizos (PM) de este piso.
//   coraza: tu próximo golpe (y el de tu mascota) le hace la mitad.
export const ESPECIALES = {
    veneno: { icono: "☠️", nombre: "Veneno", fuerza: 0.8, turnos: 3, porTurno: 0.05 },
    drenar: { icono: "🩸", nombre: "Drenar", fuerza: 1.3 },
    sellar: { icono: "🔒", nombre: "Sello",  fuerza: 0.7, pm: 2 },
    coraza: { icono: "🐚", nombre: "Coraza", fuerza: 0, factor: 0.5 },
};
const especialDe = (m) => CRIATURAS[m.id]?.especial || null;

// Cuánto más pega un guardián de la Mazmorra cuando se enfurece (una vez, con media vida).
export const FURIA_GUARDIAN = 1.3;

// Los monstruos, en el orden en que aparecen (el del piso 1, el del 2…).
export const MONSTRUOS = ORDEN.map((id) => ({ id, ...CRIATURAS[id] }));

// Los comandos de la batalla, en el orden del menú.
export const ACCIONES = {
    atacar:   { icono: "⚔️", nombre: "Atacar" },
    hechizo:  { icono: "🔮", nombre: "Magia" },
    defender: { icono: "🛡️", nombre: "Defender" },
    pocion:   { icono: "🧪", nombre: "Poción" },
};

export const MEJORAS = {
    afilar:   { icono: "⚔️", nombre: "Hoja afilada",     texto: "+3 de ataque" },
    tomo:     { icono: "📖", nombre: "Tomo antiguo",     texto: "+5 de daño de hechizo" },
    vigor:    { icono: "❤️", nombre: "Vigor",            texto: "+12 de vida máxima (y te cura 12)" },
    frasco:   { icono: "🧪", nombre: "Frasco extra",     texto: "+1 poción" },
    mana:     { icono: "✨", nombre: "Mente clara",      texto: "+1 hechizo por piso" },
    suerte:   { icono: "🍀", nombre: "Trébol",           texto: "+6 % de golpe crítico" },
    escudo:   { icono: "🛡️", nombre: "Escudo reforzado", texto: "Defender bloquea 8 % más" },
    descanso: { icono: "🔥", nombre: "Fogata",           texto: "Recuperas 40 % de tu vida" },
};

const INTENCIONES = {
    golpe:    { icono: "⚔️", texto: "Va a atacar" },
    fuerte:   { icono: "💥", texto: "Prepara un golpe fuerte" },
    furia:    { icono: "😡", texto: "Se enfurece (más ataque)" },
    curar:    { icono: "💚", texto: "Se va a curar" },
    especial: { icono: "✨", texto: "Prepara su ataque especial" },   // (el icono real sale de ESPECIALES)
};

// Las intenciones que pegan (el resto no te quita vida).
export const GOLPES = ["golpe", "fuerte", "especial"];


// ===== Cómo se nombra a una criatura en las frases =====
// «el Esqueleto», «la Araña tejedora», «al Esqueleto», «a la Araña tejedora».
const elMonstruo = (m) => `${m.genero === "f" ? "la" : "el"} ${m.nombre}`;
const alMonstruo = (m) => (m.genero === "f" ? `a la ${m.nombre}` : `al ${m.nombre}`);
const conMayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

// Cómo se llama el ataque que va a usar («Mordisco», «Picada», «Filamentos»…).
function nombreDelAtaque(m) {
    const criatura = CRIATURAS[m.id] || {};
    if (m.intencion === "especial") return criatura.especial?.nombre || "Ataque";
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
export function heroeDeLaTorre(niveles, equipo = {}) {
    const { ataque = 0, magia = 0, suerte = 0, armadura = 0 } = equipo;
    const habilidades = (equipo.habilidades || []).filter((clave) => HABILIDADES[clave]);
    const gloria = habilidades.includes("gloria");
    const vidaMax = Math.round((40 + 6 * niveles.fuerza + 4 * niveles.carisma) * (gloria ? 1 + HABILIDADES.gloria.vida : 1));
    const mana = 2 + Math.floor(niveles.intelecto / 3) + (magia >= 8 ? 1 : 0) + (habilidades.includes("estrellas") ? HABILIDADES.estrellas.mana : 0);
    const pociones = 1 + Math.floor(niveles.riqueza / 2) + (gloria ? 1 : 0);
    return {
        vida: vidaMax,
        vidaMax,
        ataque: 6 + 2 * niveles.fuerza + ataque,
        hechizo: 10 + 3 * niveles.intelecto + Math.round(magia * 1.5),
        mana,                 // hechizos que te quedan en este piso
        manaMax: mana,
        defensa: Math.min(0.75, 0.5 + niveles.carisma * 0.025),   // parte del daño que bloqueas al defender
        curaDefensa: 2 + niveles.carisma,
        pociones,
        critico: Math.min(0.4, Math.min(0.3, 0.08 + niveles.riqueza * 0.02) + suerte / 100),
        proteccion: Math.min(0.4, armadura / 200),   // parte de cada golpe que para tu armadura (máx. 40 %)
        defendiendo: false,
        habilidades,
        enEstePiso: pisoNuevo(),   // lo que ya pasó en este piso (para «Firme», «Ímpetu» y «Gracia»)
    };
}

function pisoNuevo() {
    return { golpeado: false, atacado: false, gracia: false };
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
    const mazmorra = lugar === "mazmorra";
    const vidaMax = mazmorra
        ? Math.round((120 + 20 * piso + 0.9 * piso * piso) * (guardian ? 1.5 : 1))
        : Math.round((22 + 9 * piso + 0.6 * piso * piso) * (guardian ? 1.6 : 1));
    const ataque = mazmorra
        ? Math.round((16 + 2.2 * piso) * (guardian ? 1.2 : 1))
        : Math.round((4 + 1.6 * piso) * (guardian ? 1.25 : 1));
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
    if (["fuerte", "furia", "especial"].includes(m.intencion)) return "golpe";   // no repite lo especial
    const opciones = ["golpe", "golpe", "golpe", "fuerte", "fuerte", "furia"];
    if (especialDe(m)) opciones.push("especial", "especial");
    if (m.guardian && m.vida < m.vidaMax * 0.6) opciones.push("curar", "curar");
    return elegir(partida, opciones);
}

// Cuánto daño hará el monstruo con su intención actual (para mostrarlo).
export function danoPrevisto(m) {
    if (m.intencion === "golpe") return m.ataque;
    if (m.intencion === "fuerte") return Math.round(m.ataque * 1.9);
    if (m.intencion === "especial") return Math.round(m.ataque * (ESPECIALES[especialDe(m)?.tipo]?.fuerza || 0));
    return 0;
}

// h (opcional) = tu héroe: así el número ya descuenta lo que para tu armadura.
// Ej: { icono: "💥", texto: "Prepara «Estocada» (12)" } o { icono: "☠️", texto: "Va a usar «Filamentos» (9 + veneno)" }
export function textoIntencion(m, h = null) {
    const i = INTENCIONES[m.intencion] || INTENCIONES.golpe;
    const dano = h ? danoRecibido({ ...h, defendiendo: false }, danoPrevisto(m)) : danoPrevisto(m);
    if (m.intencion === "especial") {
        const tipo = especialDe(m)?.tipo;
        const efecto = { veneno: `${dano} + veneno`, drenar: `${dano} y se cura`, sellar: `${dano} y −${ESPECIALES.sellar.pm} PM` }[tipo];
        if (tipo === "coraza") return { icono: ESPECIALES.coraza.icono, texto: `Se cubrirá con «${nombreDelAtaque(m)}» (½ de daño)` };
        return { icono: ESPECIALES[tipo]?.icono || i.icono, texto: `Va a usar «${nombreDelAtaque(m)}» (${efecto})` };
    }
    if (!dano) return { icono: i.icono, texto: i.texto };
    const verbo = m.intencion === "fuerte" ? "Prepara" : "Va a usar";
    return { icono: i.icono, texto: `${verbo} «${nombreDelAtaque(m)}» (${dano})` };
}


// ===== La partida =====

// proporcion: con cuánta vida subes (1 = llena). Sale de tu vida real (ver vida.js):
// si llegas herido, empiezas con menos.
// equipo.mascota (opcional): la mascota que te acompaña (ver mascotaDeBatalla en mascota.js).
// lugar: "torre" (se sube) o "mazmorra" (se baja).
export function nuevaPartida(niveles, semilla = Date.now() % 4294967296, proporcion = 1, equipo = {}, lugar = "torre") {
    const heroe = heroeDeLaTorre(niveles, equipo);
    heroe.vida = Math.max(1, Math.round(heroe.vidaMax * proporcion));
    const mazmorra = lugar === "mazmorra";
    const primero = mazmorra ? "Sótano 1" : "Piso 1";
    return {
        lugar: mazmorra ? "mazmorra" : "torre",
        semilla,
        piso: 1,
        fase: "batalla",          // "batalla" | "mejora" (elegir premio) | "fin"
        heroe,
        enemigo: monstruoDelPiso(1, lugar),
        mascota: equipo.mascota && MASCOTAS[equipo.mascota.especie] ? { ...equipo.mascota } : null,
        turno: 0,                 // cuántas acciones llevas (la mascota actúa cada tantos turnos)
        renacio: false,           // si el fénix ya te levantó en esta subida
        opciones: [],             // las mejoras para elegir (3, o 4 con «Constancia»)
        registro: heroe.vida < heroe.vidaMax
            ? `${primero}. Llegas con el ${Math.round(proporcion * 100)} % de tu vida real. ¡Cuidado!`
            : `${primero}. ¡Que empiece ${mazmorra ? "el descenso" : "la subida"}!`,
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
    return partida.piso - 1;
}

// Una acción del héroe, la de su mascota y la respuesta del monstruo.
// accion: "atacar" | "hechizo" | "defender" | "pocion". Con "hechizo", elemento dice cuál:
// "fuego", "hielo" o "rayo".
// Devuelve lo que pasó (para las animaciones y los sonidos):
//   [{ quien ("heroe" | "mascota" | "enemigo" | "furia" | "veneno"), tipo, dano, critico, doble, elemento,
//      efecto ("debil" | "resiste" | null), cura, nombre, esquivado, reflejo, habilidad,
//      especial ("veneno" | "drenar" | "sellar" | "coraza"), sello (PM que te quitó), coraza (tu golpe chocó con ella) }]
export function actuar(partida, accion, elemento = null) {
    if (partida.fase !== "batalla") throw new Error("Ahora no estás en una batalla.");
    const h = partida.heroe;
    const m = partida.enemigo;
    const eventos = [];
    const frases = [];

    // --- Turno del héroe ---
    if (accion === "hechizo") {
        if (h.mana < 1) throw new Error("No te quedan hechizos en este piso.");
        if (!ELEMENTOS[elemento]) throw new Error("Elige un hechizo: fuego, hielo o rayo.");
    }
    if (!["atacar", "hechizo", "defender", "pocion"].includes(accion)) throw new Error("Esa acción no existe.");
    if (accion === "pocion" && h.pociones < 1) throw new Error("No te quedan pociones.");
    h.enEstePiso ||= pisoNuevo();   // (las partidas de antes de la v26 no lo tenían)
    const piso = h.enEstePiso;
    partida.turno = (partida.turno || 0) + 1;
    h.defendiendo = false;
    if (accion === "atacar" || accion === "hechizo") {
        const magia = accion === "hechizo";
        // El punto débil de la criatura multiplica el daño del hechizo; lo que resiste, lo divide.
        let factor = magia ? factorElemento(CRIATURAS[m.id] || {}, elemento) : 1;
        const efecto = factor > 1 ? "debil" : factor < 1 ? "resiste" : null;
        if (efecto === "debil" && tiene(h, "arcano")) factor = HABILIDADES.arcano.debil;
        const base = magia ? h.hechizo : h.ataque;
        const variacion = magia ? 0.9 + azar(partida) * 0.2 : 0.85 + azar(partida) * 0.3;
        const azarCritico = azar(partida);
        const critico = (tiene(h, "impetu") && !piso.atacado) || azarCritico < h.critico;
        const multiplicaCritico = tiene(h, "desgarro") ? HABILIDADES.desgarro.critico : 1.8;
        const extra = factorDeDano(h, m) * (magia && tiene(h, "ojo-dragon") ? HABILIDADES["ojo-dragon"].magia : 1);
        // Si se cubrió con su coraza, tu golpe le hace la mitad.
        const coraza = m.coraza ? ESPECIALES.coraza.factor : 1;
        let dano = Math.max(1, Math.round(base * variacion * (critico ? multiplicaCritico : 1) * factor * extra * coraza));
        // «Embestida»: el golpe va dos veces (el segundo hace la mitad).
        const doble = !magia && tiene(h, "embestida");
        if (doble) dano += Math.max(1, Math.round(dano * HABILIDADES.embestida.segundo));
        if (magia) h.mana -= 1;
        piso.atacado = true;
        m.vida = Math.max(0, m.vida - dano);
        // «Sed del vencedor»: tus golpes y hechizos te curan.
        const cura = tiene(h, "sed") ? Math.min(Math.round(dano * HABILIDADES.sed.robo), h.vidaMax - h.vida) : 0;
        h.vida += cura;
        eventos.push(magia
            ? { quien: "heroe", tipo: "hechizo", elemento, efecto, dano, critico, cura, coraza: Boolean(m.coraza) }
            : { quien: "heroe", tipo: "atacar", dano, critico, doble, cura, coraza: Boolean(m.coraza) });
        const que = magia ? `Tu hechizo de ${ELEMENTOS[elemento].nombre.toLowerCase()}` : doble ? "Tu doble golpe" : "Tu golpe";
        frases.push(`${que} le quita ${dano} ${alMonstruo(m)}${critico ? " (¡crítico!)" : ""}.` +
                    (efecto === "debil" ? " ¡Es su punto débil!" : efecto === "resiste" ? " Lo resiste: casi no le duele." : "") +
                    (m.coraza ? " Su coraza para la mitad." : "") +
                    (cura ? ` Recuperas ${cura}.` : ""));
    } else if (accion === "defender") {
        h.defendiendo = true;
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

    // --- Tu mascota ---
    const suyo = actuaMascota(partida);
    if (suyo) {
        eventos.push(suyo.evento);
        frases.push(suyo.frase);
    }
    m.coraza = false;   // la coraza dura un solo turno tuyo (y de tu mascota)

    // --- ¿Cayó el monstruo? ---
    if (m.vida <= 0) return vencer(partida, eventos, frases);

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
    const dePiedra = Boolean(m.petrificada);
    if (dePiedra) {
        // La mirada del basilisco: pierde este turno (y guarda lo que planeaba para el próximo).
        m.petrificada = false;
        eventos.push({ quien: "enemigo", tipo: "petrificada", nombre: "De piedra" });
        frases.push(`${sujeto} sigue de piedra: pierde su turno.`);
    } else if (especial?.tipo === "coraza") {
        m.coraza = true;
        eventos.push({ quien: "enemigo", tipo: "especial", especial: "coraza", nombre: especial.nombre });
        frases.push(`${sujeto} se cubre con «${especial.nombre}»: tu próximo golpe le hará la mitad.`);
    } else if (GOLPES.includes(intencion)) {
        const nombre = nombreDelAtaque(m);
        const tipoEspecial = especial?.tipo || null;
        // «Sombra»: puedes esquivarlo del todo.
        const esquivar = Math.min(ESQUIVAR_MAXIMO, tiene(h, "sombra") ? HABILIDADES.sombra.esquivar : 0);
        if (esquivar && azar(partida) < esquivar) {
            eventos.push({ quien: "enemigo", tipo: intencion, especial: tipoEspecial, dano: 0, nombre, esquivado: true });
            frases.push(`${sujeto} usa «${nombre}», pero lo esquivas.`);
        } else {
            let dano = danoRecibido(h, danoPrevisto(m));
            if (tiene(h, "firme") && !piso.golpeado) dano = 0;   // «Firme»: el primero no duele
            piso.golpeado = true;
            h.vida = Math.max(0, h.vida - dano);
            // «Escamas»: le devuelves parte del golpe.
            const reflejo = tiene(h, "escamas") ? Math.round(dano * HABILIDADES.escamas.reflejo) : 0;
            m.vida = Math.max(0, m.vida - reflejo);
            const evento = { quien: "enemigo", tipo: intencion, especial: tipoEspecial, dano, nombre, reflejo };
            let extra = "";
            if (tipoEspecial === "veneno" && h.inmuneVeneno) {
                extra = " Tu raíz amarga para el veneno.";
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
                        (reflejo ? ` Tus escamas le devuelven ${reflejo}.` : ""));
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
    partida.fase = "mejora";
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
        const factor = datos.elemento ? factorElemento(CRIATURAS[m.id] || {}, datos.elemento) : 1;
        const efecto = factor > 1 ? "debil" : factor < 1 ? "resiste" : null;
        const guardian = datos.guardianes && m.guardian ? datos.guardianes : 1;
        const coraza = m.coraza ? ESPECIALES.coraza.factor : 1;   // también choca con su coraza
        const dano = Math.max(1, Math.round(h.ataque * datos.fuerza * pet.potencia * factor * guardian * coraza));
        m.vida = Math.max(0, m.vida - dano);
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

// Mejoras distintas al azar: 3, o 4 con «Constancia».
function mejorasAlAzar(partida) {
    const claves = Object.keys(MEJORAS);
    const cuantas = tiene(partida.heroe, "constancia") ? 4 : 3;
    const elegidas = [];
    while (elegidas.length < cuantas) {
        const clave = elegir(partida, claves);
        if (!elegidas.includes(clave)) elegidas.push(clave);
    }
    return elegidas;
}

// Aplicar la mejora elegida y pasar al piso siguiente (en la Mazmorra, bajar).
export function elegirMejora(partida, clave) {
    if (partida.fase !== "mejora" || !partida.opciones.includes(clave)) throw new Error("Elige una de las mejoras.");
    const h = partida.heroe;
    switch (clave) {
        case "afilar":   h.ataque += 3; break;
        case "tomo":     h.hechizo += 5; break;
        case "vigor":    h.vidaMax += 12; h.vida = Math.min(h.vidaMax, h.vida + 12); break;
        case "frasco":   h.pociones += 1; break;
        case "mana":     h.manaMax += 1; break;
        case "suerte":   h.critico = Math.min(0.5, h.critico + 0.06); break;
        case "escudo":   h.defensa = Math.min(0.85, h.defensa + 0.08); break;
        case "descanso": h.vida = Math.min(h.vidaMax, h.vida + Math.round(h.vidaMax * 0.4)); break;
    }
    if (tiene(h, "constancia")) {
        h.ataque += HABILIDADES.constancia.ataque;
        h.hechizo += HABILIDADES.constancia.hechizo;
    }
    // Al subir: recuperas un poco de vida (más con el «Manto regio») y todos tus hechizos.
    // En la Mazmorra no hay descanso: solo lo del «Manto regio». El veneno se pasa.
    const cura = reglasDe(partida).curaAlSubir + (tiene(h, "regia") ? HABILIDADES.regia.cura : 0);
    h.vida = Math.min(h.vidaMax, h.vida + Math.round(h.vidaMax * cura));
    h.mana = h.manaMax;
    h.veneno = 0;
    h.defendiendo = false;
    h.enEstePiso = pisoNuevo();
    partida.piso += 1;
    partida.enemigo = monstruoDelPiso(partida.piso, partida.lugar);
    partida.enemigo.intencion = nuevaIntencion(partida);
    partida.opciones = [];
    partida.fase = "batalla";
    const zona = zonaDelPiso(partida.piso, partida.lugar);
    const m = partida.enemigo;
    const entras = partida.piso % PISOS_POR_ZONA === 1 ? `Entras ${aLaZona(zona)}. ` : "";
    partida.registro = esGuardian(partida.piso)
        ? `${nombreDelPiso(partida)}: ¡${elMonstruo(m)}, ${m.genero === "f" ? "guardiana" : "guardián"} ${deLaZona(zona)}, te cierra el paso!`
        : `${entras}${nombreDelPiso(partida)}: aparece ${elMonstruo(m)}.`;
}

// Lo que ganas al terminar, según los pisos que superaste (y el lugar: la Mazmorra paga más).
// En gemas 💎 (no en monedas) y XP.
export function premio(pisos, lugar = "torre") {
    const p = (REGLAS[lugar] || REGLAS.torre).premio;
    return {
        gemas: Math.min(p.maxGemas, pisos * p.gemasPorPiso),
        xp: Math.min(p.maxXp, Math.floor(pisos * p.xpPorPiso)),
    };
}
