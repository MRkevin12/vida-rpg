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

import { CRIATURAS, ELEMENTOS, PISOS_POR_ZONA, idDelPiso, vueltaDelPiso, zonaDelPiso, factorElemento, lugarDe, aLaZona, deLaZona, LUGARES } from "./bestiario.js";
import { HABILIDADES, ESQUIVAR_MAXIMO, tiene } from "./habilidades.js";
import { MASCOTAS } from "../mascota.js";
import { semilla as hashDeTexto } from "../desafios.js";
import { bonoDeGym, BOMBEO } from "../gym/gym.js";
import { CADA_GUARDIAN, REGLAS, MODOS, REACCIONES, GOLPE_VAPOR, reaccionDe, modoDe, MARCAS, marcarEnemigo, reglasDe, ESPECIALES, especialDe, regeneraDe, formaActual, NIVEL_TECNICA, TECNICAS, VOLUNTAD, usosPorPiso, SOBRE_LAS_NUBES, FURIA_GUARDIAN, MEJORAS, hayRuta, DONES, tieneDon, INTENCIONES, GOLPES, elMonstruo, alMonstruo, conMayuscula, nombreDelAtaque, nombreDelPiso, azar, elegir } from "./torre-reglas.js";
export * from "./torre-reglas.js";   // (orden) las reglas fijas: premios, modos, marcas, técnicas, rutas…

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
    // El entrenamiento real se nota en el combate: tu nivel de gym y, el día que entrenas, el bombeo (niveles.bombeo = true, v80).
    const fuerzaGym = 1 + bonoDeGym(niveles.gym || 1) + (niveles.bombeo ? BOMBEO : 0);
    const vidaMax = Math.round((40 + 6 * niveles.fuerza + 4 * niveles.carisma) * (gloria ? 1 + HABILIDADES.gloria.vida : 1) * fuerzaGym);
    const mana = 2 + Math.floor(niveles.intelecto / 3) + (magia >= 8 ? 1 : 0) + (habilidades.includes("estrellas") ? HABILIDADES.estrellas.mana : 0)
        + (habilidades.includes("leguas") ? HABILIDADES.leguas.mana : 0);   // (v100) «Siete leguas»
    const pociones = 1 + Math.floor(niveles.riqueza / 2) + (gloria ? 1 : 0);
    return {
        vida: vidaMax,
        vidaMax,
        ataque: Math.round((6 + 2 * niveles.fuerza) * fuerzaGym * (habilidades.includes("titan") ? HABILIDADES.titan.ataque : 1)) + ataque,
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
    const ganado = Math.round(cuanto * (tieneDon(h, "fervor") ? DONES.fervor : 1) * (tiene(h, "ritmo") ? HABILIDADES.ritmo.voluntad : 1));
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
    let dano = danoRecibido(h, danoPrevisto(m));
    if (tiene(h, "baluarte")) dano = Math.round(dano * HABILIDADES.baluarte.golpe);   // (v100) «Baluarte»
    return m.intencion === "fuerte" && tiene(h, "presagio") ? Math.round(dano * HABILIDADES.presagio.fuerte) : dano;
}

// Cuánto te quita un golpe del monstruo (tu armadura y, si te defiendes, tu escudo lo bajan).
export function danoRecibido(h, dano) {
    let total = Math.round(dano * (1 - (h.proteccion || 0)));
    if (h.defendiendo) total = Math.round(total * (1 - Math.min(0.95, h.defensa + (tiene(h, "arraigo") ? HABILIDADES.arraigo.defensa : 0))));
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
        const porBrasa = tiene(h, "brasa") && !piso.atacado;   // (v74) «Brasa»: el primer golpe de cada piso hace 50 % más
        const porImpulso = tiene(h, "impulso") && !piso.atacado;   // (v100) «Impulso»: 25 % más
        const critico = tecnica === "certero" || porImpetu || azarCritico < h.critico;
        const multiplicaCritico = (tiene(h, "desgarro") ? HABILIDADES.desgarro.critico : 1.8) + (tieneDon(h, "cazador") ? DONES.cazador : 0);
        // «Eco arcano» (don): el primer hechizo de cada piso pega el doble.
        const eco = magia && tieneDon(h, "eco") && !piso.eco;
        if (eco) piso.eco = true;
        // (v71) Reacción elemental con el hechizo del turno anterior.
        const previo = magia && m.afectado && m.afectado.turno === partida.turno - 1 ? m.afectado.elemento : null;
        const reaccion = reaccionDe(previo, elemento);
        const extra = factorDeDano(h, m) * (eco ? 2 : 1) * (reaccion ? REACCIONES[reaccion].factor : 1) * (porBrasa ? HABILIDADES.brasa.primero : 1) * (porImpulso ? HABILIDADES.impulso.primero : 1) * (magia && tiene(h, "ojo-dragon") ? HABILIDADES["ojo-dragon"].magia : 1)
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
        if (critico && tiene(h, "pisada") && h.mana < h.manaMax) {   // (v100) «Pisada del dragón»
            h.mana += HABILIDADES.pisada.mana;
            activas.push("pisada");
        }
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
        if (porImpulso) activas.push("impulso");   // (v100)
        if (porBrasa) activas.push("brasa");
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
        const cura = Math.min(Math.round(h.vidaMax * 0.35 * (tiene(h, "vigor") ? HABILIDADES.vigor.pocion : 1)), h.vidaMax - h.vida);
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
        const esquivar = Math.min(ESQUIVAR_MAXIMO, (tiene(h, "sombra") ? HABILIDADES.sombra.esquivar : 0) + (tiene(h, "ligereza") ? HABILIDADES.ligereza.esquivar : 0));
        if (esquivar && azar(partida) < esquivar) {
            eventos.push({ quien: "enemigo", tipo: intencion, especial: tipoEspecial, dano: 0, nombre, esquivado: true,
                           activas: ["sombra", "ligereza"].filter((clave) => tiene(h, clave)) });
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
    const cura = partida.marca === "ayuno" ? 0 : curaBase + (tiene(h, "regia") ? HABILIDADES.regia.cura : 0)
        + (tiene(h, "zancada") ? HABILIDADES.zancada.cura : 0) + (tiene(h, "leguas") ? HABILIDADES.leguas.cura : 0);   // (v100)
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

