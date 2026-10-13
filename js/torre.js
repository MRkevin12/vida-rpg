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
// Como todo lo que es "juego puro", este archivo no dibuja ni guarda nada: recibe la
// partida (un objeto) y la cambia. La partida se guarda en estado.arcade.torre,
// así puedes salir y seguir después.

import { CRIATURAS, ELEMENTOS, ORDEN, PISOS_POR_ZONA, idDelPiso, vueltaDelPiso, zonaDelPiso, factorElemento } from "./bestiario.js";

export const ATRIBUTO = "carisma";                       // el premio sube Carisma
export const PREMIO = { monedasPorPiso: 3, xpPorPiso: 5, maxMonedas: 40, maxXp: 60 };
export const CADA_GUARDIAN = PISOS_POR_ZONA;             // cada 5 pisos, un guardián (más fuerte)

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
    golpe:  { icono: "⚔️", texto: "Va a atacar" },
    fuerte: { icono: "💥", texto: "Prepara un golpe fuerte" },
    furia:  { icono: "😡", texto: "Se enfurece (más ataque)" },
    curar:  { icono: "💚", texto: "Se va a curar" },
};


// ===== Cómo se nombra a una criatura en las frases =====
// «el Esqueleto», «la Araña tejedora», «al Esqueleto», «a la Araña tejedora».
const elMonstruo = (m) => `${m.genero === "f" ? "la" : "el"} ${m.nombre}`;
const alMonstruo = (m) => (m.genero === "f" ? `a la ${m.nombre}` : `al ${m.nombre}`);
const conMayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

// Cómo se llama el ataque que va a usar («Mordisco», «Picada»…).
function nombreDelAtaque(m) {
    const criatura = CRIATURAS[m.id] || {};
    return (m.intencion === "fuerte" ? criatura.fuerte : criatura.golpe) || "Ataque";
}


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
    const id = idDelPiso(piso);
    const criatura = CRIATURAS[id];
    const guardian = esGuardian(piso);
    const vuelta = vueltaDelPiso(piso);   // después del piso 20 vuelven los mismos, «ancestrales»
    const vidaMax = Math.round((22 + 9 * piso + 0.6 * piso * piso) * (guardian ? 1.6 : 1));
    return {
        id,
        nombre: vuelta ? `${criatura.nombre} ancestral` : criatura.nombre,
        genero: criatura.genero,
        guardian,
        vuelta,
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
// Ej: { icono: "💥", texto: "Prepara «Estocada» (12)" }
export function textoIntencion(m, h = null) {
    const i = INTENCIONES[m.intencion];
    const dano = h ? danoRecibido({ ...h, defendiendo: false }, danoPrevisto(m)) : danoPrevisto(m);
    if (!dano) return { icono: i.icono, texto: i.texto };
    const verbo = m.intencion === "fuerte" ? "Prepara" : "Va a usar";
    return { icono: i.icono, texto: `${verbo} «${nombreDelAtaque(m)}» (${dano})` };
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

// Una partida guardada con una versión anterior de la app puede tener un monstruo que ya no
// vive en la Torre (antes eran los jefes de tus campañas). Se cambia por el de ese piso, con
// la misma parte de vida que le quedaba.
export function ponerAlDia(partida) {
    if (!partida || CRIATURAS[partida.enemigo?.id]) return partida;
    const viejo = partida.enemigo || {};
    const nuevo = monstruoDelPiso(partida.piso);
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

// Una acción del héroe y la respuesta del monstruo.
// accion: "atacar" | "hechizo" | "defender" | "pocion". Con "hechizo", elemento dice cuál:
// "fuego", "hielo" o "rayo".
// Devuelve lo que pasó (para las animaciones y los sonidos):
//   [{ quien, tipo, dano, critico, elemento, efecto ("debil" | "resiste" | null), cura, nombre }]
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
    h.defendiendo = false;
    if (accion === "atacar" || accion === "hechizo") {
        const magia = accion === "hechizo";
        // El punto débil de la criatura multiplica el daño del hechizo; lo que resiste, lo divide.
        const factor = magia ? factorElemento(CRIATURAS[m.id] || {}, elemento) : 1;
        const efecto = factor > 1 ? "debil" : factor < 1 ? "resiste" : null;
        const base = magia ? h.hechizo : h.ataque;
        const variacion = magia ? 0.9 + azar(partida) * 0.2 : 0.85 + azar(partida) * 0.3;
        const critico = azar(partida) < h.critico;
        const dano = Math.max(1, Math.round(base * variacion * (critico ? 1.8 : 1) * factor));
        if (magia) h.mana -= 1;
        m.vida = Math.max(0, m.vida - dano);
        eventos.push(magia
            ? { quien: "heroe", tipo: "hechizo", elemento, efecto, dano, critico }
            : { quien: "heroe", tipo: "atacar", dano, critico });
        const que = magia ? `Tu hechizo de ${ELEMENTOS[elemento].nombre.toLowerCase()}` : "Tu golpe";
        frases.push(`${que} le quita ${dano} ${alMonstruo(m)}${critico ? " (¡crítico!)" : ""}.` +
                    (efecto === "debil" ? " ¡Es su punto débil!" : efecto === "resiste" ? " Lo resiste: casi no le duele." : ""));
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
        frases.push(`¡${conMayuscula(elMonstruo(m))} cae! Piso ${partida.piso} superado.`);
        partida.fase = "mejora";
        partida.opciones = tresMejoras(partida);
        partida.registro = frases.join(" ");
        eventos.push({ quien: "enemigo", tipo: "derrotado" });
        return eventos;
    }

    // --- Turno del monstruo ---
    const intencion = m.intencion;
    const sujeto = conMayuscula(elMonstruo(m));
    if (intencion === "golpe" || intencion === "fuerte") {
        const dano = danoRecibido(h, danoPrevisto(m));
        const nombre = nombreDelAtaque(m);
        h.vida = Math.max(0, h.vida - dano);
        eventos.push({ quien: "enemigo", tipo: intencion, dano, nombre });
        frases.push(`${sujeto} usa «${nombre}»: −${dano}${h.defendiendo ? " (bloqueaste parte)" : ""}.`);
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
    const zona = zonaDelPiso(partida.piso);
    const entras = partida.piso % PISOS_POR_ZONA === 1 ? `Entras a la ${zona.nombre}. ` : "";
    partida.registro = esGuardian(partida.piso)
        ? `Piso ${partida.piso}: ¡${elMonstruo(partida.enemigo)}, guardián de la ${zona.nombre}, te cierra el paso!`
        : `${entras}Piso ${partida.piso}: aparece ${elMonstruo(partida.enemigo)}.`;
}

// Lo que ganas al terminar, según los pisos que superaste.
export function premio(pisos) {
    return {
        monedas: Math.min(PREMIO.maxMonedas, pisos * PREMIO.monedasPorPiso),
        xp: Math.min(PREMIO.maxXp, pisos * PREMIO.xpPorPiso),
    };
}
