// maestro.js — El Maestro Aurelio: tu mentor.
//
// Te habla según cómo vas: te saluda en la mañana y te pide elegir tu misión clave, te
// recuerda tu pacto si ayer fallaste, te anima si estás herido, te avisa del cofre o del
// desafío relámpago, y en la noche te invita a cerrar el día. También puedes conversar con
// él eligiendo respuestas.
//
// No es inteligencia artificial: son frases preparadas que se eligen según tu partida.
// Se dibuja con el mismo sistema del avatar (dibujo.js): un anciano de barba blanca.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import { ETAPAS, CLASES, APARIENCIA_INICIAL } from "./avatar.js";
import { calcularVida } from "./vida.js";
import { cumplimientoDelPacto, citaDelDia } from "./pacto.js";
import { cofreDisponible } from "./cofre.js";
import { eventoDelDia } from "./eventos.js";
import * as rituales from "./rituales.js";

export const NOMBRE = "Maestro Aurelio";

// Cómo se dibuja (lo mismo que describirAvatar() devuelve para tu héroe).
export function describirMaestro() {
    return {
        nivel: 60,
        etapa: ETAPAS[1],
        clave: "intelecto",
        clase: CLASES.intelecto,
        niveles: { fuerza: 2, intelecto: 9, carisma: 6, riqueza: 2 },
        rasgos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 },
        animo: "normal",
        diasSinMision: 0,
        equipado: { cabeza: "sombrero-mago", mano: "baston", espalda: null, fondo: null },
        apariencia: { ...APARIENCIA_INICIAL, piel: "clara", rostro: "curtido", ojos: "gris", pelo: "cano",
                      peinado: "largo", barba: "completa", traje: "violeta" },
        mascota: { nombre: "", etapa: { clave: "huevo" }, total: 0, triste: false },
    };
}

// Todo lo que el Maestro necesita saber de tu día.
export function contexto(estado, hoy, ahora = Date.now()) {
    const hora = new Date(ahora).getHours();
    const pendientes = rituales.pendientesDelDia(estado, hoy);
    const clave = rituales.claveDelDia(estado, hoy);
    const orden = { facil: 0, normal: 1, dificil: 2 };
    return {
        hoy,
        hora,
        nombre: estado.pacto?.nombre || estado.personaje.nombre,
        vida: calcularVida(estado, hoy),
        racha: juego.calcularRacha(estado, hoy).actual,
        pacto: cumplimientoDelPacto(estado, hoy),
        cofre: cofreDisponible(estado, hoy),
        relampago: rituales.estadoRelampago(estado, hoy, ahora, hora),
        evento: eventoDelDia(hoy, estado),
        tocan: juego.misionesDelDia(estado.misiones, hoy).length,
        pendientes,
        facil: [...pendientes].sort((a, b) => orden[a.dificultad] - orden[b.dificultad])[0] || null,
        dificil: [...pendientes].sort((a, b) => orden[b.dificultad] - orden[a.dificultad])[0] || null,
        clave,
        claveHecha: Boolean(clave && estado.completadas.some((c) => c.misionId === clave.id && c.fecha === hoy)),
        cerrado: rituales.diaCerrado(estado, hoy),
    };
}

// Lo primero que te dice (lo más importante del momento).
export function saludo(c) {
    const n = c.nombre;
    const misiones = (k) => juego.plural(k, "misión", "misiones");
    if (c.vida.caido) {
        return `Has caído, ${n}. No te avergüences: levántate. ${c.facil ? `Empieza por algo pequeño: «${c.facil.nombre}».` : "Cada paso cuenta."}`;
    }
    if (c.pacto?.ayerFallado && !c.pacto.hoyHonrado) return `Ayer fallaste, ${n}. Recuerda tu pacto: hoy no puede ser el segundo día.`;
    if (c.relampago?.estado === "activo") {
        return `El tiempo corre: te ${c.relampago.meta - c.relampago.progreso === 1 ? "falta 1" : `faltan ${c.relampago.meta - c.relampago.progreso}`} para vencer el desafío relámpago.`;
    }
    if (c.cofre) return `Tu cofre del día te espera, ${n}. Ábrelo: te lo ganaste.`;
    if (c.vida.nivel === "herido") return `Te veo herido, ${n}. Cada misión que cumplas te cura${c.facil ? `; empieza por «${c.facil.nombre}»` : ""}.`;
    if (c.tocan && !c.pendientes.length) return "Todo hecho por hoy. Así, día tras día, se forja el carácter.";
    if (c.hora < 12 && !c.clave && c.pendientes.length) {
        return `Buenos días, ${n}. Hoy te esperan ${misiones(c.pendientes.length)}${c.evento ? `, y ${c.evento.nombre.toLowerCase()} anda cerca` : ""}. ¿Cuál será tu misión clave?`;
    }
    if (c.hora >= 18 && !c.cerrado) {
        return `Cae la noche, ${n}. ${c.pendientes.length ? `Te quedan ${misiones(c.pendientes.length)}. ` : ""}¿Cerramos el día juntos?`;
    }
    if (c.clave && !c.claveHecha) return `Tu misión clave de hoy es «${c.clave.nombre}». Vale el doble: no la sueltes.`;
    if (c.racha >= 7) return `${c.racha} días seguidos. No es suerte, ${n}: es carácter.`;
    const cita = citaDelDia(c.hoy);
    return `«${cita.texto}» — ${cita.autor}`;
}


// ===== Conversar =====

export const OPCIONES = [
    { id: "fuerza",   texto: "💪 Hoy tengo fuerza" },
    { id: "normal",   texto: "🙂 Me siento normal" },
    { id: "sinGanas", texto: "😩 No tengo ganas" },
    { id: "abrumado", texto: "😵 Estoy abrumado" },
    { id: "comoVoy",  texto: "📊 ¿Cómo voy?" },
    { id: "consejo",  texto: "💡 Dame un consejo" },
];

// Citas de clásicos (traducciones libres de obras de dominio público).
export const CONSEJOS = [
    { texto: "No nos perturban las cosas, sino las opiniones que tenemos de ellas.", autor: "Epicteto" },
    { texto: "Lo que se interpone en el camino se convierte en el camino.", autor: "Marco Aurelio" },
    { texto: "Sufrimos más en la imaginación que en la realidad.", autor: "Séneca" },
    { texto: "No es porque las cosas sean difíciles que no nos atrevemos; es porque no nos atrevemos que son difíciles.", autor: "Séneca" },
    { texto: "Quien conoce a los demás es sabio; quien se conoce a sí mismo es iluminado.", autor: "Lao-Tse" },
    { texto: "Primero dite a ti mismo lo que quieres ser; luego haz lo que tienes que hacer.", autor: "Epicteto" },
];

// El jefe que está más cerca de caer.
function jefeMasCercano(estado) {
    return Object.values(campana.estadoCampanas(estado)).sort((a, b) => a.vida - b.vida)[0];
}

// Lo que responde a cada opción.
export function responder(estado, c, opcion, azar = Math.random) {
    const mision = (m) => (m ? `«${m.nombre}»` : "lo que te falte");
    switch (opcion) {
        case "fuerza":
            return c.dificil
                ? `Aprovéchala. Ataca primero la más difícil, ${mision(c.dificil)}: después todo será cuesta abajo.`
                : "Aprovéchala en tu gran misión: da hoy un paso que venías postergando.";
        case "normal":
            return `Un paso a la vez. Empieza por ${mision(c.pendientes[0])} y no pienses en el resto todavía.`;
        case "sinGanas":
            return `Las ganas llegan después del primer paso, no antes. Haz solo ${mision(c.facil)}. Solo esa. Después decides.`;
        case "abrumado":
            return "Respira. No tienes que ganar hoy la guerra entera: elige una misión clave y deja que el resto espere. " +
                "Y si estás enfermo o sin fuerzas de verdad, usa el modo descanso: descansar con honor no es rendirse.";
        case "comoVoy": {
            const jefe = jefeMasCercano(estado);
            const partes = [
                c.racha ? `Llevas ${juego.plural(c.racha, "día", "días")} de racha.` : "Hoy puede empezar tu racha.",
                `Tu vida está en ${c.vida.puntos} de ${c.vida.maxima}.`,
            ];
            if (c.pacto?.porcentaje !== null && c.pacto?.porcentaje !== undefined) partes.push(`Has honrado tu pacto el ${c.pacto.porcentaje} % de los días.`);
            if (jefe) partes.push(`${jefe.jefe.nombre} es el jefe más cerca de caer: le quedan ${jefe.vida} de vida.`);
            return partes.join(" ");
        }
        case "consejo": {
            const consejo = CONSEJOS[Math.floor(azar() * CONSEJOS.length)];
            return `«${consejo.texto}» — ${consejo.autor}`;
        }
        default:
            return saludo(c);
    }
}
