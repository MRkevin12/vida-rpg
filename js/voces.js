// voces.js — Las reglas de «Las Voces del Valle» (v44): la aventura de diálogos de Carisma.
//
// Al pie de la Torre hay una aldea a la que la Sombra de la Voz le quitó la voz (ver voces-datos.js). Cada día algunas
// personas están en su lugar (la fragua, la posada, la plaza) y tú decides con quién hablar. Hablar con alguien es una
// conversación con ramas: eliges qué decir y su confianza sube o baja; al final se abre, se entreabre o se cierra, y
// te lleva una lección que puedes convertir en una tarea de la vida real.
//
// Cómo se conecta con el resto de la app:
//   · Tu NIVEL DE CARISMA real desbloquea técnicas (Escuchar, Empatía, Verdad, Firmeza, Humor): opciones que solo ven
//     quienes ya las aprendieron.
//   · Tu VALOR sale de lo que hiciste de verdad: las misiones y tareas de Carisma de los últimos 7 días. Abre las
//     opciones más valientes («yo también pasé por eso…»).
//   · Cada conversación nueva gasta una FICHA del arcade y paga gemas 💎 y XP de Carisma.
//   · Las lecciones se pueden volver tareas reales (atributo Carisma).
//
// Este archivo es «juego puro»: no dibuja ni guarda nada. La partida vive en estado.voces (ver datos.js):
//   estado.voces = { escena (la conversación en curso o null), hechas { id: { fin, fecha } },
//                    fallos { id: fecha }, ultima { persona: fecha } }

import { calcularNivel, BASE_ATRIBUTO } from "./juego.js";
import { sumarDias, diaDeSemana, diasEntre } from "./fechas.js";
import { ETAPAS, CLASES, APARIENCIA_INICIAL } from "./avatar.js";
import { LUGARES, PERSONAS, INVITADOS, ESCENAS, FINALES, EPILOGO } from "./voces-datos.js";

export { LUGARES, PERSONAS, INVITADOS, ESCENAS, FINALES, EPILOGO };

// ===== Tu poder: técnicas y valor =====

// Se aprenden con el nivel de tu atributo Carisma (el real: el de tus misiones, no el del juego).
export const TECNICAS = {
    escuchar: { nivel: 1, icono: "👂", nombre: "Escuchar", texto: "Callar a tiempo y dejar que el otro siga." },
    empatia:  { nivel: 2, icono: "💗", nombre: "Empatía", texto: "Nombrar lo que el otro siente." },
    verdad:   { nivel: 3, icono: "🪞", nombre: "Verdad", texto: "Decir lo que ves, con cuidado." },
    firmeza:  { nivel: 4, icono: "🛡️", nombre: "Firmeza", texto: "Sostener lo que piensas sin gritar." },
    humor:    { nivel: 5, icono: "🎭", nombre: "Humor", texto: "Aflojar la tensión sin burlarte." },
};

export const nivelDeCarisma = (estado) => calcularNivel(estado.atributos.carisma, BASE_ATRIBUTO).nivel;

// Las técnicas que ya sabes (con ese nivel de Carisma).
export const tecnicasDe = (nivel) => Object.keys(TECNICAS).filter((clave) => nivel >= TECNICAS[clave].nivel);

// El valor máximo: con 5 misiones o tareas de Carisma esta semana ya estás «a tope».
export const MAX_VALOR = 5;

// Tu VALOR: cuántas misiones y tareas de Carisma hiciste de verdad en los últimos 7 días (hasta MAX_VALOR).
export function valorDe(estado, fecha) {
    const desde = sumarDias(fecha, -6);
    const enSemana = (dia) => Boolean(dia) && dia >= desde && dia <= fecha;
    const misiones = estado.completadas.filter((c) => c.atributo === "carisma" && enSemana(c.fecha)).length;
    const tareas = estado.tareas.filter((t) => t.atributo === "carisma" && enSemana(t.hechaEn)).length;
    return Math.min(MAX_VALOR, misiones + tareas);
}

// ===== El premio =====
// Una conversación nueva paga una sola vez; si ya la habías hecho a medias («regular») y la mejoras, paga la diferencia.
// (Menos que el arcade en general: es una historia que se acaba, no un juego que se repite.)
export const PREMIOS = {
    bien: { gemas: 8, xp: 6 },
    regular: { gemas: 4, xp: 3 },
    mal: { gemas: 0, xp: 1 },
};
const ORDEN_DE_FINES = { mal: 0, regular: 1, bien: 2 };

export function premioDeFin(fin, previo = null) {
    const nuevo = PREMIOS[fin];
    const viejo = previo ? PREMIOS[previo] : { gemas: 0, xp: 0 };
    return { gemas: Math.max(0, nuevo.gemas - viejo.gemas), xp: Math.max(0, nuevo.xp - viejo.xp) };
}

export const mejorFin = (a, b) => (!a ? b : !b ? a : ORDEN_DE_FINES[b] > ORDEN_DE_FINES[a] ? b : a);

// ===== Quién es quién =====

// Una persona de la aldea, o un invitado que solo habla en alguna escena.
export const personaDe = (id) => PERSONAS[id] || INVITADOS[id] || null;

// Cómo se dibuja (lo mismo que describirAvatar() devuelve para tu héroe; ver también maestro.describirMaestro).
export function describirPersona(id) {
    const persona = personaDe(id);
    return {
        nivel: 5,
        etapa: ETAPAS[0],
        clave: "aprendiz",
        clase: CLASES.aprendiz,
        niveles: { fuerza: 2, intelecto: 2, carisma: 2, riqueza: 2 },
        rasgos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 },
        animo: "normal",
        diasSinMision: 0,
        equipado: { cabeza: null, mano: null, espalda: null, fondo: null },
        apariencia: { ...APARIENCIA_INICIAL, ...persona.aspecto },
        mascota: { nombre: "", etapa: { clave: "huevo" }, total: 0, triste: false },
    };
}

// ===== La agenda de cada día =====

// La conversación que le toca a esa persona: la primera que todavía no hiciste.
export function siguienteEscena(estado, persona) {
    return PERSONAS[persona].escenas.find((id) => !estado.voces.hechas[id]) || null;
}

// ¿Puedes empezar esa conversación hoy? Devuelve null si sí, o el motivo si no.
export function motivoBloqueo(estado, id, fecha) {
    const escena = ESCENAS[id];
    if (!escena) return "Esa conversación no existe.";
    const v = estado.voces;
    const persona = PERSONAS[escena.persona];
    if (v.escena) {
        if (v.escena.id === id) return null;   // seguir con la que ya empezaste
        const otra = PERSONAS[ESCENAS[v.escena.id].persona];
        return `Tienes una conversación a medias con ${otra.nombre}. Termínala primero.`;
    }
    if (v.hechas[id]?.fin === "bien") return "Ya viviste esta conversación con su mejor final.";
    for (const previa of escena.requiere) {
        if (!v.hechas[previa]) return `Antes, habla con ${persona.nombre} de «${ESCENAS[previa].titulo}».`;
    }
    if (!persona.dias.includes(diaDeSemana(fecha))) return `Hoy ${persona.nombre} no está en ${LUGARES[persona.lugar].nombre.toLowerCase()}.`;
    const ultima = v.ultima[escena.persona];
    if (ultima === fecha) return `Ya hablaste con ${persona.nombre} hoy. Vuelve mañana.`;
    if (ultima && diasEntre(ultima, fecha) < escena.espera) return `${persona.nombre} necesita un día para pensar. Vuelve mañana.`;
    return null;
}

// Lo que hay hoy en la aldea: cada lugar con las personas que están y su conversación.
//   [{ id, lugar (sus datos), personas: [{ id, persona, escenaId (o null si ya no tiene más), motivo, enCurso }] }]
export function agendaDelDia(estado, fecha) {
    const v = estado.voces;
    return Object.entries(LUGARES).map(([id, lugar]) => ({
        id,
        lugar,
        personas: Object.entries(PERSONAS)
            .filter(([, p]) => p.lugar === id && p.dias.includes(diaDeSemana(fecha)))
            .map(([personaId, persona]) => {
                const enCurso = v.escena && ESCENAS[v.escena.id].persona === personaId ? v.escena.id : null;
                const escenaId = enCurso || siguienteEscena(estado, personaId);
                return {
                    id: personaId, persona, escenaId, enCurso: Boolean(enCurso),
                    motivo: escenaId ? motivoBloqueo(estado, escenaId, fecha) : null,
                };
            }),
    }));
}

// ¿Ya recuperaste todas las voces? (todas las conversaciones hechas, con el final que sea menos «mal»). Cuando pasa por
// primera vez, se cuenta el epílogo de la aldea (EPILOGO) y se paga una vez (estado.voces.epilogo guarda el día).
export const aldeaLibre = (estado) => Object.keys(ESCENAS).every((id) => estado.voces.hechas[id]);

// Cuánto llevas del valle: conversaciones hechas, con mejor final y total.
export function progreso(estado) {
    const ids = Object.keys(ESCENAS);
    const hechas = ids.filter((id) => estado.voces.hechas[id]);
    return { total: ids.length, hechas: hechas.length, bien: hechas.filter((id) => estado.voces.hechas[id].fin === "bien").length };
}

// ===== Una conversación =====
// La conversación en curso es un objeto sencillo (se guarda en estado.voces.escena):
//   { id, nodo (en cuál va), fecha (cuándo empezó), confianza, marcas: [], historial: [{ quien, texto }], reaccion (±) }

// Mete el texto de un nodo en el historial (solo los últimos 14 se guardan).
function anotar(en, nodo) {
    if (nodo?.texto && !nodo.fin) en.historial.push({ quien: nodo.quien || "narrador", texto: nodo.texto });
    en.historial = en.historial.slice(-14);
}

const cumple = (en, regla) => (regla.confianzaMin === undefined || en.confianza >= regla.confianzaMin) &&
    (!regla.marca || en.marcas.includes(regla.marca));

// Pasa a ese nodo. Los nodos «evalua» deciden solos (con la confianza y las marcas) hasta llegar a uno de verdad.
function avanzar(en, destino) {
    const nodos = ESCENAS[en.id].nodos;
    for (let vueltas = 0; nodos[destino]?.evalua && vueltas < 10; vueltas++) {
        destino = nodos[destino].evalua.find((regla) => cumple(en, regla)).ir;
    }
    en.nodo = destino;
    anotar(en, nodos[destino]);
}

export function iniciarEscena(id, fecha) {
    const en = { id, nodo: null, fecha, confianza: 0, marcas: [], historial: [], reaccion: 0 };
    avanzar(en, ESCENAS[id].inicio);
    return en;
}

export const nodoActual = (en) => ESCENAS[en.id].nodos[en.nodo];

// Si la conversación ya terminó: su final ({ fin, texto, leccion, tarea }); si no, null.
export const finDe = (en) => (nodoActual(en)?.fin ? nodoActual(en) : null);

// Lo que puedes decir ahora: [{ indice, texto, tecnica, valor, bloqueada (el motivo, o null) }].
// «indice» es el de la lista original del nodo (así elegir() sabe a cuál te refieres).
export function opcionesDe(estado, en, fecha) {
    const nodo = nodoActual(en);
    if (!nodo?.opciones) return [];
    const nivel = nivelDeCarisma(estado);
    const valor = valorDe(estado, fecha);
    return nodo.opciones
        .map((o, indice) => ({ ...o, indice }))
        .filter((o) => (!o.si || en.marcas.includes(o.si)) && (!o.noSi || !en.marcas.includes(o.noSi)))
        .map((o) => {
            const tecnica = o.tecnica ? TECNICAS[o.tecnica] : null;
            let bloqueada = null;
            if (tecnica && nivel < tecnica.nivel) bloqueada = `${tecnica.icono} ${tecnica.nombre} · Carisma ${tecnica.nivel}`;
            else if (o.valor && valor < o.valor) bloqueada = `Valor ${o.valor}`;
            return { indice: o.indice, texto: o.texto, tecnica: o.tecnica || null, valor: o.valor || 0, bloqueada };
        });
}

// Eliges una opción: suma su confianza, anota tu frase y pasa al nodo siguiente.
export function elegir(estado, en, indice, fecha) {
    const opcion = opcionesDe(estado, en, fecha).find((o) => o.indice === indice);
    if (!opcion) throw new Error("Esa opción no existe.");
    if (opcion.bloqueada) throw new Error(`Todavía no puedes decir eso (${opcion.bloqueada}).`);
    const original = nodoActual(en).opciones[indice];
    en.confianza += original.confianza || 0;
    en.reaccion = Math.sign(original.confianza || 0);
    if (original.marca && !en.marcas.includes(original.marca)) en.marcas.push(original.marca);
    en.historial.push({ quien: "yo", texto: original.texto });
    avanzar(en, original.ir);
    return nodoActual(en);
}
