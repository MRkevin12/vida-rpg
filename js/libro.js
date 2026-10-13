// libro.js — Tu historia contada como un libro: «La crónica de [tu nombre]».
//
// Cada día que escribes en tu diario se convierte en un CAPÍTULO. El capítulo junta tus
// palabras con lo que pasó ese día en el juego (misiones, tareas, enfoque, pasos de tus
// misiones principales, jefes derrotados, logros, lo que fallaste y por qué, tu vida…)
// y lo narra como una crónica, en tercera persona.
//
// No hay inteligencia artificial: son frases preparadas que se eligen según lo que pasó
// (y, para que no se repitan siempre igual, según la fecha). Este archivo solo arma el
// texto; vistas.js lo dibuja como las páginas de un libro.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import { calcularVida, robosDeJefes } from "./vida.js";
import { sumarDias, desdeTexto, fechaLegible } from "./fechas.js";

export const EPIGRAFE = { texto: "Nuestra vida es lo que nuestros pensamientos hacen de ella.", autor: "Marco Aurelio" };


// ===== Ayudantes =====

// Un número por fecha (días desde 1970): sirve para elegir frases distintas cada día.
function numeroDelDia(fecha) {
    return Math.round(desdeTexto(fecha).getTime() / 86400000);
}

// Elige una frase de la lista según la fecha ("sal" cambia la elección entre listas).
function elegir(lista, fecha, sal = 0) {
    return lista[(numeroDelDia(fecha) + sal) % lista.length];
}

// ["a", "b", "c"] → "«a», «b» y «c»"
export function enumerar(nombres, comillas = true) {
    const lista = nombres.map((n) => (comillas ? `«${n}»` : n));
    if (lista.length <= 1) return lista.join("");
    return `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`;
}

// 12 → "XII" (los capítulos van en números romanos, como en los libros antiguos).
export function aRomano(numero) {
    const valores = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
                     [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let resto = numero;
    let texto = "";
    for (const [valor, letras] of valores) {
        while (resto >= valor) {
            texto += letras;
            resto -= valor;
        }
    }
    return texto;
}

// Primera letra en mayúscula ("lunes 12 de octubre" → "Lunes 12 de octubre").
const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);


// ===== Las frases =====

const APERTURAS = {
    genial: [
        (f, n) => `El ${f} amaneció con buen viento para ${n}.`,
        (f) => `Hay días en que todo encaja, y el ${f} fue uno de ellos.`,
        (f, n) => `El ${f}, ${n} caminó con paso ligero, como quien sabe hacia dónde va.`,
    ],
    bien: [
        (f, n) => `El ${f} fue un buen día de camino para ${n}.`,
        (f, n) => `Sin grandes estruendos, el ${f} ${n} siguió avanzando.`,
        (f, n) => `El ${f} ${n} se levantó con ánimo, y el día respondió.`,
        (f) => `El ${f} fue de esos días en que el esfuerzo rinde.`,
    ],
    normal: [
        (f) => `El ${f} fue un día como tantos, y aun así quedó escrito.`,
        (f) => `Nada extraordinario ocurrió el ${f}; pero los días comunes también construyen leyendas.`,
        (f) => `El ${f} transcurrió en silencio, sin gloria y sin derrota.`,
        (f, n) => `El ${f} ${n} hizo lo suyo, sin más ruido que el de sus propios pasos.`,
    ],
    mal: [
        (f, n) => `El ${f} el camino se hizo cuesta arriba para ${n}.`,
        (f) => `Hubo niebla el ${f}, de esa que no se ve pero pesa.`,
        (f, n) => `El ${f} no fue fácil, y ${n} lo supo desde temprano.`,
    ],
    terrible: [
        (f) => `El ${f} fue uno de esos días que ponen a prueba a cualquiera.`,
        (f) => `Hay batallas que se sienten perdidas antes de empezar; el ${f} fue así.`,
        (f, n) => `El ${f} el cielo se cerró sobre ${n}.`,
    ],
    ninguno: [
        (f, n) => `El ${f} quedó registrado en la crónica de ${n}.`,
    ],
};

const CIERRES = {
    genial: ["Fue un gran capítulo.", "Y la historia siguió escribiéndose con letra firme."],
    bien: ["Paso a paso, la historia siguió adelante.", "Un buen día, de esos que suman."],
    normal: ["Un día más en el camino, y el camino seguía.", "No todos los capítulos son épicos; todos son necesarios."],
    mal: ["Pero mañana sería otro día.", "Las leyendas también están hechas de días así."],
    terrible: ["Pero ni siquiera la noche más larga dura para siempre.", "Y aun así, la historia no terminaba ahí."],
    ninguno: ["La historia continuaba."],
};

const TITULOS = {
    genial: ["Viento a favor", "La jornada luminosa", "Con el sol de frente", "El día de las buenas noticias", "Todo a su favor"],
    bien: ["Paso firme", "Buen camino", "Sin prisa y sin pausa", "Tierra firme", "La marcha sigue"],
    normal: ["Un día más", "La calma", "El camino de siempre", "Entre dos batallas", "Lo cotidiano"],
    mal: ["Cuesta arriba", "La niebla", "Días grises", "El peso del día", "Contra corriente"],
    terrible: ["La noche más larga", "Contra las cuerdas", "El fondo del pozo", "La prueba", "Bajo la tormenta"],
    ninguno: ["Una página más"],
};
const TITULOS_PERFECTO = ["Un día sin sombras", "Todo en su lugar", "La jornada completa"];
const TITULOS_TORMENTA = ["La tormenta", "Contra el viento"];


// ===== Lo que pasó cada día =====

// Los jefes que cayeron ese día: [{ nombre, titulo }].
// robos: la vida que te robó cada jefe (se calcula una vez para todo el libro).
export function jefesCaidos(estado, fecha, robos = robosDeJefes(estado, fecha)) {
    const antes = campana.estadoCampanas(estado, sumarDias(fecha, -1), robos);
    const despues = campana.estadoCampanas(estado, fecha, robos);
    const caidos = [];
    for (const [categoria, c] of Object.entries(despues)) {
        for (let n = antes[categoria].derrotados; n < c.derrotados; n++) {
            const jefe = c.campana.jefes[n % campana.VIDAS.length];
            caidos.push({ nombre: jefe.nombre, titulo: jefe.titulo });
        }
    }
    return caidos;
}

// El jefe que más vida le robó ese día: { nombre, cantidad } (o null).
function mayorLadron(estado, fecha, golpes, robos) {
    const porCategoria = {};
    for (const g of golpes || []) if (g.roba) porCategoria[g.atributo] = (porCategoria[g.atributo] || 0) + g.dano;
    const [categoria, cantidad] = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0] || [];
    if (!cantidad) return null;
    const c = campana.estadoCampanas(estado, fecha, robos)[categoria];
    return c ? { nombre: c.jefe.nombre, cantidad } : null;
}

// Todo lo que pasó un día, ya ordenado para contarlo.
function hechosDelDia(estado, fecha, hoy, registroVida, robos) {
    const hechasIds = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));
    const tocaban = juego.misionesDelDia(estado.misiones, fecha);
    const fallas = (estado.fallas || []).filter((f) => f.fecha === fecha);
    const falladas = new Set(fallas.map((f) => f.misionId));
    const nombreDe = (id) => estado.misiones.find((m) => m.id === id)?.nombre || "una misión borrada";
    return {
        tocaban,
        hechas: tocaban.filter((m) => hechasIds.has(m.id)).map((m) => m.nombre),
        semanales: estado.misiones.filter((m) => m.veces && hechasIds.has(m.id)).map((m) => m.nombre),
        fallas: fallas.map((f) => ({ nombre: nombreDe(f.misionId), motivo: juego.MOTIVOS_FALLA[f.motivo] || juego.MOTIVOS_FALLA.otro })),
        // Lo que quedó sin hacer y no marcaste como fallado (solo en días que ya terminaron).
        sinHacer: fecha < hoy ? tocaban.filter((m) => !hechasIds.has(m.id) && !falladas.has(m.id)).map((m) => m.nombre) : [],
        tareas: estado.tareas.filter((t) => t.hechaEn === fecha).map((t) => t.nombre),
        minutos: estado.enfoque.sesiones.filter((s) => s.fecha === fecha).reduce((suma, s) => suma + s.minutos, 0),
        pasos: estado.principales.flatMap((p) => p.submisiones.filter((s) => s.hecha && s.hechaEn === fecha)
            .map((s) => ({ principal: p.nombre, paso: s.nombre }))),
        principales: estado.principales.filter((p) => p.completadaEn === fecha).map((p) => p.nombre),
        jefes: jefesCaidos(estado, fecha, robos),
        ladron: mayorLadron(estado, fecha, registroVida.get(fecha)?.golpes, robos),
        logros: estado.logros.filter((l) => l.desbloqueadoEn === fecha).map((l) => l.nombre),
        cofre: estado.desafios.some((d) => d.cobradoEn === fecha),
        premios: estado.canjes.filter((c) => c.fecha === fecha).map((c) => c.nombre),
        pacto: estado.pacto?.primeraVez === fecha,
        vida: registroVida.get(fecha) || null,
        racha: juego.calcularRacha(estado, fecha).actual,
    };
}


// ===== Los capítulos =====

// El título: lo más importante que pasó; si no pasó nada especial, según el ánimo.
function tituloDelCapitulo(h, animo, fecha) {
    if (h.pacto) return "El juramento";
    if (h.principales.length) return "La gran misión cumplida";
    if (h.jefes.length) return `La caída de ${h.jefes[0].nombre}`;
    if (h.vida?.cayo) return "El día que cayó";
    if (h.tocaban.length && h.hechas.length === h.tocaban.length) return elegir(TITULOS_PERFECTO, fecha);
    if (h.fallas.length + h.sinHacer.length >= 2 && !h.hechas.length) return elegir(TITULOS_TORMENTA, fecha);
    return elegir(TITULOS[animo], fecha);
}

// Arma un capítulo: { numero, fecha, titulo, animo, parrafos: [{ tipo: "texto" | "cita", texto }] }.
// Los textos son texto plano (con lo que tú escribiste dentro): vistas.js los escapa al dibujarlos.
function armarCapitulo(estado, fecha, numero, hoy, nombre, registroVida, robos) {
    const entrada = estado.diario[fecha];
    const animo = entrada.animo && juego.ANIMOS_DIARIO[entrada.animo] ? entrada.animo : "ninguno";
    const h = hechosDelDia(estado, fecha, hoy, registroVida, robos);
    const dia = fechaLegible(fecha);
    const parrafos = [];
    const texto = (t) => parrafos.push({ tipo: "texto", texto: t });

    // 1. Cómo empezó.
    const apertura = elegir(APERTURAS[animo], fecha)(dia, nombre);
    texto(mayuscula(apertura));

    // 2. Sus hazañas.
    const hazanas = [];
    if (h.pacto) hazanas.push("Ese día selló con su sangre el Tratado de la Voluntad.");
    if (h.tocaban.length && h.hechas.length === h.tocaban.length) {
        hazanas.push(h.hechas.length <= 4
            ? `Cumplió todas sus misiones (${enumerar(h.hechas)}): fue un día perfecto.`
            : `Cumplió sus ${h.hechas.length} misiones: fue un día perfecto.`);
    } else if (h.hechas.length) {
        hazanas.push(`Cumplió ${h.hechas.length} de sus ${h.tocaban.length} misiones: ${enumerar(h.hechas.slice(0, 4))}${h.hechas.length > 4 ? " y otras más" : ""}.`);
    }
    if (h.semanales.length) hazanas.push(`Avanzó también en sus metas de la semana: ${enumerar(h.semanales)}.`);
    if (h.tareas.length) hazanas.push(`${hazanas.length ? "Además despachó" : "Despachó"} ${h.tareas.length === 1 ? "una tarea pendiente" : "sus tareas pendientes"}: ${enumerar(h.tareas.slice(0, 4))}.`);
    if (h.minutos) hazanas.push(`Dedicó ${h.minutos} minutos a la concentración profunda.`);
    for (const p of h.pasos.slice(0, 2)) hazanas.push(`En su gran misión «${p.principal}» dio un paso más: ${p.paso}.`);
    for (const p of h.principales) hazanas.push(`¡Y completó al fin su misión principal «${p}»!`);
    for (const j of h.jefes) hazanas.push(`Ese día derrotó a ${j.nombre}, ${j.titulo.toLowerCase()}.`);
    if (h.logros.length) hazanas.push(`Ganó ${h.logros.length === 1 ? "el logro" : "los logros"} ${enumerar(h.logros)}.`);
    if (h.cofre) hazanas.push("Abrió el cofre del desafío de la semana.");
    if (h.premios.length) hazanas.push(`Y se concedió un premio bien ganado: ${enumerar(h.premios)}.`);
    texto(hazanas.length ? hazanas.join(" ") : "No hubo hazañas ese día, pero dejó constancia de su paso, y eso también cuenta.");

    // 3. Sus sombras: lo que falló (y por qué), lo que quedó sin hacer y lo que le costó.
    const sombras = [];
    if (h.fallas.length === 1) {
        sombras.push(`No todo fue victoria: «${h.fallas[0].nombre}» quedó sin cumplir; ${h.fallas[0].motivo.relato}.`);
    } else if (h.fallas.length > 1) {
        // «Leer» (no tuve ganas) y «Gym» (se me olvidó) quedaron sin cumplir.
        const lista = h.fallas.map((f) => `«${f.nombre}» (${f.motivo.nombre.toLowerCase()})`);
        sombras.push(`No todo fue victoria: ${enumerar(lista, false)} quedaron sin cumplir.`);
    }
    if (h.sinHacer.length === 1) sombras.push(`«${h.sinHacer[0]}» quedó sin hacer.`);
    else if (h.sinHacer.length > 1) sombras.push(`${mayuscula(h.sinHacer.length === h.tocaban.length ? "ninguna de sus misiones se cumplió" : `${h.sinHacer.length} misiones quedaron sin hacer`)}.`);
    if (h.vida?.cayo) sombras.push("Esa noche cayó en combate: su vida llegó a cero.");
    else if (h.ladron && h.ladron.cantidad === h.vida?.dano) sombras.push(`${h.ladron.nombre} le robó ${h.vida.dano} de vida.`);
    else if (h.ladron) sombras.push(`Le costó ${h.vida.dano} de vida; ${h.ladron.nombre} se llevó ${h.ladron.cantidad}.`);
    else if (h.vida?.dano) sombras.push(`Le costó ${h.vida.dano} de vida.`);
    if (sombras.length) texto(sombras.join(" "));

    // 4. Sus palabras (lo que escribió en el diario) y lo que agradeció.
    if (entrada.texto) {
        texto(entrada.pregunta ? `Esa noche, ante la pregunta «${entrada.pregunta}», escribió:` : "En su diario dejó escrito:");
        parrafos.push({ tipo: "cita", texto: entrada.texto });
    }
    if (entrada.gratitud) texto(`Antes de dormir, dio gracias por esto: «${entrada.gratitud}».`);

    // 5. El cierre.
    const cierre = [];
    if (h.racha >= 3) cierre.push(`Llevaba ${h.racha} días seguidos sin rendirse.`);
    cierre.push(elegir(CIERRES[animo], fecha, 1));
    texto(cierre.join(" "));

    return { numero, fecha, titulo: tituloDelCapitulo(h, animo, fecha), animo, parrafos };
}

// Todos los capítulos, del primero al último (un capítulo por cada día con diario).
export function capitulosDelLibro(estado, hoy) {
    const fechas = Object.keys(estado.diario).filter((f) => f <= hoy).sort();
    if (!fechas.length) return [];
    const nombre = estado.pacto?.nombre || estado.personaje.nombre;
    const vida = calcularVida(estado, hoy);
    const registroVida = new Map(vida.registro.map((r) => [r.fecha, r]));
    const robos = robosDeJefes(estado, hoy, vida);
    return fechas.map((fecha, i) => armarCapitulo(estado, fecha, i + 1, hoy, nombre, registroVida, robos));
}

// El libro entero como texto (para descargarlo).
export function libroComoTexto(estado, hoy) {
    const nombre = estado.pacto?.nombre || estado.personaje.nombre;
    const lineas = [`LA CRÓNICA DE ${nombre.toUpperCase()}`, "", `«${EPIGRAFE.texto}» — ${EPIGRAFE.autor}`, ""];
    for (const c of capitulosDelLibro(estado, hoy)) {
        lineas.push(`CAPÍTULO ${aRomano(c.numero)} · ${c.titulo}`, "");
        for (const p of c.parrafos) lineas.push(p.tipo === "cita" ? `    «${p.texto}»` : p.texto, "");
    }
    return lineas.join("\n");
}
