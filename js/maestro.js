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
import * as memorias from "./historias/memorias.js";
import * as saga from "./historias/saga.js";
import * as campana from "./campana.js";
import { ETAPAS, CLASES, APARIENCIA_INICIAL } from "./avatar.js";
import { calcularVida } from "./vida.js";
import { cumplimientoDelPacto, citaDelDia } from "./pacto.js";
import { cofreDisponible } from "./cofre.js";
import { eventoDelDia } from "./eventos.js";
import * as rituales from "./rituales.js";
import * as gymReglas from "./gym/gym.js";
import { diasEntre, lunesDe } from "./fechas.js";

export const NOMBRE = "Maestro Aurelio";

// (v196) El momento del día según la hora (0 a 23).
export function momentoDelDia(hora) {
    if (hora < 6) return "madrugada";
    if (hora < 12) return "manana";
    if (hora < 18) return "tarde";
    return "noche";
}

// (v196) Cómo va vestido Aurelio en cada momento del día: el color del traje y la capa.
// En la tarde lleva su traje de siempre (violeta, sin capa).
export const ROPA_POR_MOMENTO = {
    madrugada: { traje: "negro",   espalda: "capa-gris" },   // de madrugada: ropa oscura y capa de lana
    manana:    { traje: "cielo",   espalda: null },          // por la mañana: algo claro, ligero
    tarde:     { traje: "violeta", espalda: null },          // su traje de siempre
    noche:     { traje: "borgona", espalda: "capa-azul" },   // por la noche: borgoña y capa del alba
};

// Cómo se dibuja (lo mismo que describirAvatar() devuelve para tu héroe).
// hora: por defecto, la de ahora; así Aurelio se viste distinto según la hora en que abras la app.
export function describirMaestro(hora = new Date().getHours()) {
    const ropa = ROPA_POR_MOMENTO[momentoDelDia(hora)];
    return {
        nivel: 60,
        etapa: ETAPAS[1],
        clave: "intelecto",
        clase: CLASES.intelecto,
        niveles: { fuerza: 2, intelecto: 9, carisma: 6, riqueza: 2 },
        rasgos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 },
        animo: "normal",
        diasSinMision: 0,
        equipado: { cabeza: "sombrero-mago", mano: "baston", espalda: ropa.espalda, fondo: null },
        apariencia: { ...APARIENCIA_INICIAL, piel: "clara", rostro: "curtido", ojos: "gris", pelo: "cano",
                      peinado: "largo", barba: "completa", traje: ropa.traje },
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
    // (v72) Lo que sabe de tu gimnasio: cuánto hace que entrenaste, qué toca y cómo va tu semana.
    const sesionesGym = estado.gym?.sesiones || [];
    const ultimaGym = sesionesGym[sesionesGym.length - 1];
    const gym = {
        sesiones: sesionesGym.length,
        hechoHoy: sesionesGym.some((s) => s.fecha === hoy),
        diasSin: ultimaGym ? diasEntre(ultimaGym.fecha, hoy) : null,
        toca: gymReglas.siguienteRutina(sesionesGym).nombre,
        semana: gymReglas.diasDeLaSemana(sesionesGym, lunesDe(hoy)),
        meta: estado.gym?.metaSemanal || 4,
        nivel: gymReglas.nivelDeGym(sesionesGym).nivel,
        recordHoy: Boolean(ultimaGym && ultimaGym.fecha === hoy && ultimaGym.records.length),
    };
    return {
        hoy,
        hora,
        gym,
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
    // (v196) De madrugada (antes de las 5), lo que más ayuda es dormir, no un «buenos días».
    if (c.hora < 5) return `Es muy tarde, ${n}. Lo que hoy no hiciste puede esperar. Lo que tu cuerpo necesita, no: ve a dormir.`;
    if (c.hora < 12 && !c.clave && c.pendientes.length) {
        return `Buenos días, ${n}. Hoy te esperan ${misiones(c.pendientes.length)}${c.evento ? `, y ${c.evento.nombre.toLowerCase()} anda cerca` : ""}. ¿Cuál será tu misión clave?`;
    }
    if (c.hora >= 18 && !c.cerrado) {
        return `Cae la noche, ${n}. ${c.pendientes.length ? `Te quedan ${misiones(c.pendientes.length)}. ` : ""}¿Cerramos el día juntos?`;
    }
    // (v72) El gimnasio: un aplauso si rompiste una marca hoy, o un empujón si hace días que no entrenas.
    if (c.gym?.recordHoy) return `Hoy rompiste una marca en el gimnasio, ${n}. Eso no es suerte: es sobrecarga progresiva. Descansa bien: ahí se crece.`;
    if (c.gym?.sesiones && !c.gym.hechoHoy && c.gym.diasSin >= 3) {
        return `Hace ${c.gym.diasSin} días que no pisas el gimnasio, ${n}. El hierro espera: hoy toca ${c.gym.toca}. Basta con la primera serie.`;
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

// Los temas que solo tienen UNA respuesta: ahí no sale el botón «Dime más».
export const SIN_MAS = ["comoVoy", "historia"];

// (v196) «Hablar de otra cosa»: más temas, en una segunda lista para que la primera no sea larguísima.
export const TEMAS = [
    { id: "hora",       texto: "🕰️ ¿Qué hago a esta hora?" },
    { id: "cansado",    texto: "😴 Estoy cansado" },
    { id: "procrastino", texto: "🐌 Estoy postergando algo" },
    { id: "preocupado", texto: "😟 Estoy preocupado" },
    { id: "celebrar",   texto: "🎉 Logré algo" },
    { id: "gym",        texto: "🏋️ Hablemos del gimnasio" },
    { id: "manana",     texto: "🌅 Prepararme para mañana" },
    { id: "casio",      texto: "🐉 Cuéntame de Casio" },
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
    // (v196) Casi cada tema tiene varias respuestas: con «Dime más» sale otra distinta.
    const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
    switch (opcion) {
        case "fuerza":
            return c.dificil
                ? elegir([
                    `Aprovéchala. Ataca primero la más difícil, ${mision(c.dificil)}: después todo será cuesta abajo.`,
                    `La fuerza no se guarda para mañana. Empieza por ${mision(c.dificil)}, la que más pesa, y el resto caerá solo.`,
                    `Una buena racha de energía es un regalo raro. Gástala en ${mision(c.dificil)}, no en lo fácil.`,
                ])
                : elegir([
                    "Aprovéchala en tu gran misión: da hoy un paso que venías postergando.",
                    "Con fuerza y sin misiones pendientes, adelanta algo de mañana o entrena. La energía bien usada se acumula.",
                ]);
        case "normal":
            return elegir([
                `Un paso a la vez. Empieza por ${mision(c.pendientes[0])} y no pienses en el resto todavía.`,
                `Un día normal es el mejor para avanzar sin ruido. Haz ${mision(c.pendientes[0])} y verás cómo lo demás se acomoda.`,
                `Lo normal, repetido, es lo que forja el carácter. Empieza por ${mision(c.pendientes[0])}.`,
            ]);
        case "sinGanas":
            return elegir([
                `Las ganas llegan después del primer paso, no antes. Haz solo ${mision(c.facil)}. Solo esa. Después decides.`,
                `No te pido ganas, te pido cinco minutos. Dale cinco minutos a ${mision(c.facil)} y, si quieres, paras.`,
                `Hasta Casio tenía días sin ganas. La diferencia es que igual daba el primer paso. Haz ${mision(c.facil)}.`,
            ]);
        case "abrumado":
            return elegir([
                "Respira. No tienes que ganar hoy la guerra entera: elige una misión clave y deja que el resto espere. " +
                    "Y si estás enfermo o sin fuerzas de verdad, usa el modo descanso: descansar con honor no es rendirse.",
                `Cuando todo parece demasiado, haz una sola cosa. Una. Que sea ${mision(c.facil)} y suelta lo demás por hoy.`,
                "Lo que te abruma casi siempre es la lista entera mirada de golpe. Tápala con la mano y mira solo la primera línea.",
            ]);
        // ----- (v196) Los temas de «Hablar de otra cosa» -----
        case "hora": {
            const momento = momentoDelDia(c.hora);
            return elegir({
                madrugada: [
                    "Es de madrugada. Lo único valiente que puedes hacer ahora es dormir. Mañana lo ves con otra cabeza.",
                    "A estas horas todo parece más grande y más oscuro de lo que es. Descansa; el día arreglará la mitad.",
                ],
                manana: [
                    `La mañana es tuya. ${c.clave ? `Empieza por tu misión clave, ${mision(c.clave)}.` : "Elige tu misión clave y empieza por ella."}`,
                    "Lo primero que haces marca el resto del día. Cumple una misión antes de mirar nada más.",
                    "Agua, luz y una misión. Así empieza un buen día, sin complicarlo.",
                ],
                tarde: [
                    `La tarde es para sostener. ${c.pendientes.length ? `Te quedan ${juego.plural(c.pendientes.length, "misión", "misiones")}: no las dejes para la noche.` : "Ya cumpliste lo de hoy; usa el resto para lo que disfrutas."}`,
                    "A media tarde cae la energía. Camina cinco minutos, bebe agua y vuelve a lo tuyo.",
                ],
                noche: [
                    `Cae la noche. ${c.cerrado ? "Ya cerraste el día: descansa." : "Es buen momento para cerrar el día juntos."}`,
                    "Por la noche se mira atrás sin juzgar. Anota una cosa que salió bien y apaga las pantallas.",
                ],
            }[momento]);
        }
        case "cansado":
            return elegir([
                "Dormir también es una misión. Si tu cuerpo pide descanso de verdad, dáselo; si es solo pereza, camina diez minutos y vuelve a preguntarte.",
                `Lo que cansa casi nunca es la tarea, sino la cuenta de todo lo que falta. Haz ${mision(c.facil)} y deja de contar.`,
                "Un día de poco es mejor que un día de nada. Baja la exigencia, no el compromiso.",
            ]);
        case "procrastino":
            return elegir([
                `Dos minutos. Pon un reloj y trabaja en ${mision(c.pendientes[0])} solo dos minutos. Casi siempre seguirás después.`,
                "La Sombra de la mañana discute bien, pero habla poco. Levántate antes de que termine su argumento.",
                "No esperes sentirte listo: nadie lo está. Haz primero la parte más pequeña y más fea.",
            ]);
        case "preocupado":
            return elegir([
                "Escribe lo que te preocupa en tu diario. Lo que está en el papel pesa menos que lo que da vueltas en la cabeza.",
                "Separa lo que depende de ti de lo que no. Con lo primero haz algo hoy; lo segundo, suéltalo, como decía Epicteto.",
                "Si la preocupación te quita el sueño muchos días seguidos, cuéntaselo a alguien de confianza. Pedir ayuda también es valentía.",
            ]);
        case "celebrar":
            return elegir([
                "Cuéntaselo a alguien además de a mí. Los logros que se dicen en voz alta pesan más.",
                "Anótalo en tu diario. Dentro de un año será la prueba de lo que eres capaz.",
                "Bien hecho. Disfrútalo un momento antes de pensar en lo que sigue. Te lo ganaste.",
            ]);
        case "gym": {
            if (!c.gym?.sesiones) return "Aún no has pisado el gimnasio. Empieza con la primera serie, no con la rutina entera. Lo difícil es cruzar la puerta.";
            const base = `Vas en el nivel ${c.gym.nivel}: ${c.gym.semana} de ${c.gym.meta} días esta semana. Hoy toca ${c.gym.toca}.`;
            if (c.gym.hechoHoy) return `${base} Hoy ya entrenaste: come bien y duerme, que ahí es donde se crece.`;
            if (c.gym.diasSin >= 3) return `${base} Llevas ${c.gym.diasSin} días sin ir. Basta con la primera serie.`;
            return `${base} ${elegir(["Sube un poco el peso o una repetición: eso es progresar.", "La técnica primero, el peso después.", "Descansa entre series sin mirar el teléfono."])}`;
        }
        case "manana":
            return elegir([
                "Antes de dormir, elige las tres cosas que sí o sí harás mañana. Decidir de noche, sin prisa, cuesta mucho menos que decidir con sueño.",
                "Deja lista la primera misión: la ropa, la botella, el libro a la vista. Quita hoy el primer obstáculo de mañana.",
                `Mañana empieza esta noche. ${c.cerrado ? "Ya cerraste el día: ahora, a dormir." : "Cierra el día y deja escrito cómo te fue."}`,
            ]);
        case "casio":
            return elegir([
                "Casio nunca corría. Subía como quien camina hacia su casa. Decía: «El nivel no se gana: se acumula».",
                "Una vez le dije que hablara más. Me contestó: «No hace falta hablar, Aurelio. Ya se dice todo subiendo».",
                "Casio escribía cartas dentro de su cabeza a quienes echaba de menos. Nadie las leyó nunca, pero él las escribió todas.",
                "Una mujer llegó con un hacha para derribar la Torre. Casio resistió todo el día, sin hacerle daño. Ella se fue sin querer derribar nada.",
            ]);
        case "comoVoy": {
            const jefe = jefeMasCercano(estado);
            const partes = [
                c.racha ? `Llevas ${juego.plural(c.racha, "día", "días")} de racha.` : "Hoy puede empezar tu racha.",
                `Tu vida está en ${c.vida.puntos} de ${c.vida.maxima}.`,
            ];
            if (c.gym?.sesiones) partes.push(`En el gimnasio vas en el nivel ${c.gym.nivel}: ${c.gym.semana} de ${c.gym.meta} días esta semana.`);
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
