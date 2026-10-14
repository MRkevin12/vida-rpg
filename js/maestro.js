// maestro.js — El Maestro Aurelio: tu mentor.
//
// Te habla según cómo vas: te saluda en la mañana y te pide elegir tu misión clave, te
// recuerda tu pacto si ayer fallaste, te anima si estás herido, te avisa del cofre o del
// desafío relámpago, y en la noche te invita a cerrar el día. También puedes conversar con
// él eligiendo respuestas.
//
// v30: participa en más partes del juego. Te cuenta su historia por capítulos (memorias.js),
// te da una pista antes de cada guardián de la Torre y la Mazmorra y te habla cuando caes,
// comenta cuando subes de nivel o vences a un jefe, responde a tu diario y te despide en el
// ritual de la noche.
//
// No es inteligencia artificial: son frases preparadas que se eligen según tu partida.
// Se dibuja con el mismo sistema del avatar (dibujo.js): un anciano de barba blanca.

import * as juego from "./juego.js";
import * as memorias from "./memorias.js";
import * as saga from "./saga.js";
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
// info (opcional) = juego.resumen(estado, hoy), si ya lo calculaste (así no se repite el trabajo).
export function contexto(estado, hoy, ahora = Date.now(), info = juego.resumen(estado, hoy)) {
    const hora = new Date(ahora).getHours();
    const pendientes = rituales.pendientesDelDia(estado, hoy);
    const clave = rituales.claveDelDia(estado, hoy);
    const orden = { facil: 0, normal: 1, dificil: 2 };
    const datos = memorias.datosDeMemorias(estado, info);
    const abiertas = memorias.cuantasAbiertas(datos);
    const leidas = Math.min(estado.maestro?.leidas || 0, abiertas);
    return {
        hoy,
        hora,
        nombre: estado.pacto?.nombre || estado.personaje.nombre,
        vida: calcularVida(estado, hoy),
        racha: info.racha.actual,
        // Sus memorias: cuántas te contó, cuántas leíste y lo que falta para la siguiente.
        memorias: {
            abiertas,
            leidas,
            sinLeer: abiertas - leidas,
            total: memorias.MEMORIAS.length,
            siguiente: abiertas < memorias.MEMORIAS.length ? memorias.pista(memorias.MEMORIAS[abiertas], datos) : null,
        },
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
    // Si te contó algo nuevo de su pasado (y no es momento de algo más urgente).
    if (c.memorias?.sinLeer) {
        return c.memorias.leidas
            ? `Siéntate un momento, ${n}. Hay algo más de mi pasado que ya puedes saber.`
            : `Nunca te conté quién fui antes de ser tu maestro, ${n}. Cuando quieras, siéntate y te lo cuento.`;
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
    { id: "historia", texto: "📜 Háblame de ti" },
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

// ===== Sus palabras en el resto del juego (v30) =====
// Se eligen por un número (el nivel, el piso, la fecha…), no al azar: así no cambian cada vez
// que se vuelve a dibujar la pantalla.
const una = (lista, numero) => lista[Math.abs(Math.round(numero)) % lista.length];

// Antes de cada guardián de la Torre y de la Mazmorra: una pista sobre su punto débil (y lo que resiste).
export const CONSEJOS_DE_GUARDIAN = {
    caballero: "Una armadura vacía no siente el frío: ya está muerta. Pero el metal llama al rayo, y su escudo cede ante la fuerza.",
    liche: "Toda su vida está escrita en papel. Y el papel le tiene miedo al fuego. Cuando empiece a leer en voz alta, cúbrete.",
    demonio: "No le lleves fuego a quien vive en la fragua. Lo que apaga un horno es el frío. Y si aviva la fundición, defiéndete.",
    dragon: "El rayo es su aliento: no se lo devuelvas. El hielo, en cambio, le pesa en las alas. Cuando cierre el ojo de la tormenta, protégete.",
    "coloso-nubes": "Es mármol: el hielo le resbala, pero el rayo lo agrieta. Su muralla de nubes no se rompe con hechizos: quiébrala con fuerza.",
    apagador: "Su capa se come el fuego: empieza con rayo. A media vida se le rompe, y lo de adentro le teme al fuego. Y cuando levante la campana, no te quedes sin defensa.",
    kraken: "Vive en agua helada: el frío no le hace nada. Pero el agua lleva el rayo hasta el fondo.",
    arbol: "Un árbol muerto por dentro arde como yesca. Y el rayo ya le cayó muchas veces.",
    reflejo: "Tiene tu fuego, porque es tuyo. Lo que no tiene es calma: enfríalo.",
    "rey-hueco": "Está hecho de días fríos y vacíos. Llévale lo único que nunca tuvo: fuego.",
};

export function consejoDeGuardian(id) {
    return CONSEJOS_DE_GUARDIAN[id] || "Este es más fuerte que los demás. Mira bien lo que planea antes de cada golpe.";
}

// Cuando caes en la Torre o en la Mazmorra.
const CONSUELOS = [
    "Caer no es perder. Perder es no volver a subir.",
    "Casio caía a menudo. Lo que nunca hizo fue quedarse en el suelo.",
    "Cada criatura que te venció hoy ya te enseñó algo. Mira tu bestiario antes de volver.",
    "Tu fuerza aquí sale de lo que haces allá afuera. Cumple tus misiones y vuelve más fuerte.",
    "Mañana, un piso más que hoy. Así se sube una torre, y así se baja a un abismo.",
];

export function consueloAlCaer(pisos) {
    return una(CONSUELOS, pisos);
}

// Al subir de nivel.
const AL_SUBIR = [
    "Un nivel más. No lo celebres demasiado: mañana se sube igual.",
    "Lo que hiciste pesa más que lo que prometiste. Sigue así.",
    "Casio decía: «El nivel no se gana: se acumula». Sigue acumulando.",
    "Más fuerte que ayer. Es la única comparación que importa.",
    "Cada nivel es la suma de días que nadie vio. Yo los vi.",
];

export function palabrasDeNivel(nivel) {
    return una(AL_SUBIR, nivel);
}

// Al vencer a un jefe de tus campañas (numero = cuántos llevas vencidos).
const AL_VENCER = [
    "Una Sombra menos. Ahora no le vuelvas a dar de comer.",
    "No lo venciste con un golpe, sino con muchos días. Recuérdalo cuando quiera volver.",
    "Así cayó mi primera Sombra: sin gloria y sin atajos. Bien hecho.",
    "Las Sombras no mueren: se mueren de hambre. Sigue sin alimentarla.",
];

export function palabrasDeJefe(numero) {
    return una(AL_VENCER, numero);
}

// Lo que te responde cuando escribes en tu diario, según cómo te fue (ver juego.ANIMOS_DIARIO).
const AL_DIARIO = {
    genial: ["Guarda este día en la memoria: los malos pasan más rápido cuando recuerdas los buenos.",
             "Disfrútalo sin culpa. Te lo ganaste."],
    bien: ["Un buen día no es un día perfecto. Es un día honesto.",
           "«Bien», muchas veces seguidas, termina siendo extraordinario."],
    normal: ["Los días normales son los ladrillos de la Torre. Nadie los aplaude, pero sin ellos no hay torre.",
             "No todos los días tienen que significar algo. Algunos solo tienen que pasar bien hechos."],
    mal: ["Un mal día no es una mala vida. Mañana empieza en cero.",
          "Escribirlo ya es empezar a soltarlo."],
    terrible: ["Hoy solo te pido una cosa: descansa. Mañana hablamos de lo demás.",
               "Hasta Casio tuvo días así. Si te pesan muchos seguidos, habla con alguien de confianza: pedir ayuda también es valentía."],
};

// fecha: "AAAA-MM-DD" (para elegir la frase sin que cambie en todo el día).
export function respuestaAlDiario(animo, fecha) {
    const lista = AL_DIARIO[animo];
    return lista ? una(lista, Number(fecha.replaceAll("-", ""))) : null;
}

// Al cerrar el día en el ritual de la noche. d = { hechas, falladas, pendientes } de hoy.
export function palabrasDeLaNoche(d) {
    if (d.hechas && !d.falladas && !d.pendientes) return "Día completo. Duerme en paz: hoy no le debes nada a nadie, tampoco a ti.";
    if (d.falladas) return "Fallaste en algo y lo dijiste en voz alta. Eso también es honrar tu pacto. Mañana, otra vez.";
    if (!d.hechas) return "Hoy no fue tu día. Que no sean dos seguidos.";
    return "Lo que hiciste hoy cuenta, aunque no haya sido todo. Descansa.";
}


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
            const s = saga.estadoDeSaga(saga.datosDeSaga(estado, campana.estadoCampanas(estado)));
            partes.push(s.completada ? "Ya eres Vigía: mantén la Llama encendida." : `En la saga, tu objetivo es este: ${s.objetivo}`);
            return partes.join(" ");
        }
        case "consejo": {
            const consejo = CONSEJOS[Math.floor(azar() * CONSEJOS.length)];
            return `«${consejo.texto}» — ${consejo.autor}`;
        }
        case "historia": {
            const m = c.memorias;
            if (m.sinLeer) return "Hay cosas que no le cuento a cualquiera. A ti ya te puedo contar más: lee mis memorias.";
            if (m.siguiente) return `Ya te conté ${m.abiertas} de ${m.total} capítulos de mi vida. El que sigue te lo contaré ${m.siguiente}.`;
            return "Ya lo sabes todo de mí. Ahora la historia que importa es la tuya.";
        }
        default:
            return saludo(c);
    }
}
