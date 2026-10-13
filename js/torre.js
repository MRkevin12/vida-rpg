// torre.js — Las reglas de la Torre del héroe (el minijuego grande).
//
// Subes piso a piso. En cada piso peleas por turnos contra un monstruo (los retratos
// de los jefes). Antes de cada turno ves qué va a hacer el monstruo ("intención"),
// así puedes decidir: atacar, lanzar un hechizo, defenderte o tomar una poción.
// Al ganar eliges una mejora entre tres. La partida termina cuando tu vida llega a 0.
//
// Tu poder sale de los NIVELES DE TUS ATRIBUTOS reales: cumplir misiones te hace
// más fuerte también aquí.
//   Fuerza → vida y ataque · Intelecto → hechizos · Carisma → defensa y vida
//   Riqueza → pociones y golpes críticos
// Y de tu EQUIPO (v24, ver equipo.js): ⚔️ ataque, 🔮 magia (hechizos), 🍀 suerte (críticos)
// y 🛡️ armadura (cada golpe del monstruo te quita menos).
//
// Como todo lo que es "juego puro", este archivo no dibuja ni guarda nada: recibe la
// partida (un objeto) y la cambia. La partida se guarda en estado.arcade.torre,
// así puedes salir y seguir después.

import { CAMPANAS } from "./campana.js";

export const ATRIBUTO = "carisma";                       // el premio sube Carisma
export const PREMIO = { monedasPorPiso: 3, xpPorPiso: 5, maxMonedas: 40, maxXp: 60 };
export const CADA_GUARDIAN = 5;                          // cada 5 pisos, un guardián (más fuerte)

// Los monstruos: los 20 jefes de las campañas, intercalados (uno de cada categoría por vez).
const CATEGORIAS = Object.keys(CAMPANAS);
export const MONSTRUOS = Array.from({ length: 5 }, (_, i) => CATEGORIAS.map((c) => CAMPANAS[c].jefes[i])).flat();

export const ACCIONES = {
    atacar:   { icono: "⚔️", nombre: "Atacar" },
    hechizo:  { icono: "🔮", nombre: "Hechizo" },
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
    golpe:  { icono: "⚔️", texto: "Va a atacar" },
    fuerte: { icono: "💥", texto: "Prepara un golpe fuerte" },
    furia:  { icono: "😡", texto: "Se enfurece (más ataque)" },
    curar:  { icono: "💚", texto: "Se va a curar" },
};


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
// equipo = { ataque, magia, suerte, armadura } (lo que suma tu equipo; la armadura, la que tienes ahora)
export function heroeDeLaTorre(niveles, equipo = {}) {
    const { ataque = 0, magia = 0, suerte = 0, armadura = 0 } = equipo;
    const vidaMax = 40 + 6 * niveles.fuerza + 4 * niveles.carisma;
    const mana = 2 + Math.floor(niveles.intelecto / 3) + (magia >= 8 ? 1 : 0);
    const pociones = 1 + Math.floor(niveles.riqueza / 2);
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
    };
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

export function monstruoDelPiso(piso) {
    const jefe = MONSTRUOS[(piso - 1) % MONSTRUOS.length];
    const guardian = esGuardian(piso);
    const vidaMax = Math.round((22 + 9 * piso + 0.6 * piso * piso) * (guardian ? 1.6 : 1));
    return {
        id: jefe.id,
        nombre: jefe.nombre,
        titulo: jefe.titulo,
        guardian,
        vida: vidaMax,
        vidaMax,
        ataque: Math.round((4 + 1.6 * piso) * (guardian ? 1.25 : 1)),
        intencion: "golpe",
    };
}

// Qué hará el monstruo en su próximo turno (se muestra antes, para que puedas prepararte).
function nuevaIntencion(partida) {
    const m = partida.enemigo;
    if (m.intencion === "fuerte" || m.intencion === "furia") return "golpe";   // no repite lo especial
    const opciones = ["golpe", "golpe", "golpe", "fuerte", "fuerte", "furia"];
    if (m.guardian && m.vida < m.vidaMax * 0.6) opciones.push("curar", "curar");
    return elegir(partida, opciones);
}

// Cuánto daño hará el monstruo con su intención actual (para mostrarlo).
export function danoPrevisto(m) {
    if (m.intencion === "golpe") return m.ataque;
    if (m.intencion === "fuerte") return Math.round(m.ataque * 1.9);
    return 0;
}

// h (opcional) = tu héroe: así el número ya descuenta lo que para tu armadura.
export function textoIntencion(m, h = null) {
    const i = INTENCIONES[m.intencion];
    const dano = h ? danoRecibido({ ...h, defendiendo: false }, danoPrevisto(m)) : danoPrevisto(m);
    return { icono: i.icono, texto: dano ? `${i.texto} (${dano})` : i.texto };
}


// ===== La partida =====

// proporcion: con cuánta vida subes (1 = llena). Sale de tu vida real (ver vida.js):
// si llegas herido, empiezas con menos.
export function nuevaPartida(niveles, semilla = Date.now() % 4294967296, proporcion = 1, equipo = {}) {
    const heroe = heroeDeLaTorre(niveles, equipo);
    heroe.vida = Math.max(1, Math.round(heroe.vidaMax * proporcion));
    return {
        semilla,
        piso: 1,
        fase: "batalla",          // "batalla" | "mejora" (elegir premio) | "fin"
        heroe,
        enemigo: monstruoDelPiso(1),
        opciones: [],             // las 3 mejoras para elegir
        registro: heroe.vida < heroe.vidaMax
            ? `Piso 1. Llegas con el ${Math.round(proporcion * 100)} % de tu vida real. ¡Cuidado!`
            : "Piso 1. ¡Que empiece la subida!",
    };
}

export function pisosSuperados(partida) {
    return partida.piso - 1;
}

// Una acción del héroe y la respuesta del monstruo.
// Devuelve lo que pasó (para las animaciones y los sonidos): [{ quien, tipo, dano, critico }]
export function actuar(partida, accion) {
    if (partida.fase !== "batalla") throw new Error("Ahora no estás en una batalla.");
    const h = partida.heroe;
    const m = partida.enemigo;
    const eventos = [];
    const frases = [];

    // --- Turno del héroe ---
    h.defendiendo = false;
    if (accion === "atacar" || accion === "hechizo") {
        if (accion === "hechizo" && h.mana < 1) throw new Error("No te quedan hechizos en este piso.");
        const base = accion === "hechizo" ? h.hechizo : h.ataque;
        const variacion = accion === "hechizo" ? 0.9 + azar(partida) * 0.2 : 0.85 + azar(partida) * 0.3;
        const critico = azar(partida) < h.critico;
        const dano = Math.max(1, Math.round(base * variacion * (critico ? 1.8 : 1)));
        if (accion === "hechizo") h.mana -= 1;
        m.vida = Math.max(0, m.vida - dano);
        eventos.push({ quien: "heroe", tipo: accion, dano, critico });
        frases.push(`${accion === "hechizo" ? "Tu hechizo" : "Tu golpe"} le quita ${dano} a ${m.nombre}${critico ? " (¡crítico!)" : ""}.`);
    } else if (accion === "defender") {
        h.defendiendo = true;
        const cura = Math.min(h.curaDefensa, h.vidaMax - h.vida);
        h.vida += cura;
        eventos.push({ quien: "heroe", tipo: "defender", cura });
        frases.push(`Te cubres${cura ? ` y recuperas ${cura}` : ""}.`);
    } else if (accion === "pocion") {
        if (h.pociones < 1) throw new Error("No te quedan pociones.");
        h.pociones -= 1;
        const cura = Math.min(Math.round(h.vidaMax * 0.35), h.vidaMax - h.vida);
        h.vida += cura;
        eventos.push({ quien: "heroe", tipo: "pocion", cura });
        frases.push(`Bebes una poción: +${cura} de vida.`);
    } else {
        throw new Error("Esa acción no existe.");
    }

    // --- ¿Cayó el monstruo? ---
    if (m.vida <= 0) {
        frases.push(`¡${m.nombre} cae! Piso ${partida.piso} superado.`);
        partida.fase = "mejora";
        partida.opciones = tresMejoras(partida);
        partida.registro = frases.join(" ");
        eventos.push({ quien: "enemigo", tipo: "derrotado" });
        return eventos;
    }

    // --- Turno del monstruo ---
    const intencion = m.intencion;
    if (intencion === "golpe" || intencion === "fuerte") {
        const dano = danoRecibido(h, danoPrevisto(m));
        h.vida = Math.max(0, h.vida - dano);
        eventos.push({ quien: "enemigo", tipo: intencion, dano });
        frases.push(`${m.nombre} te golpea: −${dano}${h.defendiendo ? " (bloqueaste parte)" : ""}.`);
    } else if (intencion === "furia") {
        m.ataque = Math.round(m.ataque * 1.25);
        eventos.push({ quien: "enemigo", tipo: "furia" });
        frases.push(`${m.nombre} se enfurece: su ataque sube a ${m.ataque}.`);
    } else if (intencion === "curar") {
        const cura = Math.min(Math.round(m.vidaMax * 0.18), m.vidaMax - m.vida);
        m.vida += cura;
        eventos.push({ quien: "enemigo", tipo: "curar", cura });
        frases.push(`${m.nombre} se cura ${cura}.`);
    }

    if (h.vida <= 0) {
        partida.fase = "fin";
        frases.push(`Caíste en el piso ${partida.piso}.`);
    } else {
        m.intencion = nuevaIntencion(partida);
    }
    partida.registro = frases.join(" ");
    return eventos;
}

// Tres mejoras distintas al azar.
function tresMejoras(partida) {
    const claves = Object.keys(MEJORAS);
    const elegidas = [];
    while (elegidas.length < 3) {
        const clave = elegir(partida, claves);
        if (!elegidas.includes(clave)) elegidas.push(clave);
    }
    return elegidas;
}

// Aplicar la mejora elegida y subir al piso siguiente.
export function elegirMejora(partida, clave) {
    if (partida.fase !== "mejora" || !partida.opciones.includes(clave)) throw new Error("Elige una de las tres mejoras.");
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
    // Al subir: recuperas un poco de vida y todos tus hechizos.
    h.vida = Math.min(h.vidaMax, h.vida + Math.round(h.vidaMax * 0.1));
    h.mana = h.manaMax;
    h.defendiendo = false;
    partida.piso += 1;
    partida.enemigo = monstruoDelPiso(partida.piso);
    partida.enemigo.intencion = nuevaIntencion(partida);
    partida.opciones = [];
    partida.fase = "batalla";
    partida.registro = esGuardian(partida.piso)
        ? `Piso ${partida.piso}: ¡un guardián! ${partida.enemigo.nombre} es más fuerte que los demás.`
        : `Piso ${partida.piso}: aparece ${partida.enemigo.nombre}.`;
}

// Lo que ganas al terminar, según los pisos que superaste.
export function premio(pisos) {
    return {
        monedas: Math.min(PREMIO.maxMonedas, pisos * PREMIO.monedasPorPiso),
        xp: Math.min(PREMIO.maxXp, pisos * PREMIO.xpPorPiso),
    };
}
