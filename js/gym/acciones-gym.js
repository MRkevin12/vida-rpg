// acciones-gym.js — Lo que cambia la partida en el Gimnasio (v66): entrenar, rutinas, copias y plantillas.
//
// Parte de acciones.js (se dividió por área en la v178). Como allá: cada función recibe el «estado» (la partida),
// lo cambia y lanza Error("mensaje en español") si algo no se puede. acciones.js lo reexporta todo, así que en la app
// se sigue llamando acciones.lo-que-sea.

import * as torre from "../torre/torre.js";
import * as bestiario from "../torre/bestiario.js";
import * as gym from "./gym.js";
import * as plantillas from "./rutinas-plantillas.js";   // (v177) plantillas de rutinas del gym
import * as fragua from "./fragua.js";
import * as gymAurelio from "./gym-aurelio.js";
import { hoy, sumarDias, lunesDe } from "../fechas.js";
import { nuevoId, ganar, numeroEntre } from "../acciones-comun.js";
import { completarMision } from "../acciones-misiones.js";   // (es una función: se puede importar aunque acciones.js importe este archivo)

// ===== El Gimnasio (v66) =====
// Las reglas están en gym.js. Aquí se guarda el entrenamiento en curso, se anotan las series y se cobra el premio.

const entrenamientoEnCurso = (estado) => {
    if (!estado.gym.encurso) throw new Error("No tienes ningún entrenamiento en curso.");
    return estado.gym.encurso;
};


// Empieza (o sigue) un entrenamiento. fecha: hoy o ayer (por si se te olvidó anotarlo).
export function empezarGym(estado, rutinaId, fecha = hoy()) {
    const g = estado.gym;
    if (g.encurso) {
        if (g.encurso.rutina !== rutinaId) throw new Error("Ya tienes un entrenamiento en curso: termínalo o cancélalo primero.");
        return;
    }
    gym.aplicarRutinas(g.rutinas, g.copias);   // (v160)
    if (!gym.rutinaPorId(rutinaId)) throw new Error("Esa rutina no existe.");
    if (fecha !== hoy() && fecha !== sumarDias(hoy(), -1)) throw new Error("Solo puedes anotar el entrenamiento de hoy o de ayer.");
    if (g.sesiones.some((s) => s.fecha === fecha && s.rutina === rutinaId)) {
        throw new Error("Esa rutina ya la hiciste ese día. ¡El músculo crece descansando!");
    }
    g.encurso = gym.crearEntrenamiento(rutinaId, fecha, g.sesiones);
    // (v164) En una semana de descarga, cada ejercicio trae un 40 % menos de series (el peso, igual).
    if (gym.descargaDeLaSemana(g, lunesDe(fecha))) {
        g.encurso.descarga = true;
        for (const ej of g.encurso.ejercicios) ej.series = ej.series.slice(0, gym.seriesDeDescarga(ej.series.length));
    }
    // (v76) Aurelio te recibe en el gimnasio.
    const primero = gym.ejercicioPorId(g.encurso.ejercicios[0].id);
    return { frase: { tipo: "inicio", texto: gymAurelio.fraseDeGym("inicio", { nombre: estado.personaje.nombre, ejercicio: primero.nombre }, g.sesiones.length) } };
}

export function cancelarGym(estado) {
    entrenamientoEnCurso(estado);
    estado.gym.encurso = null;
}

// Marca o desmarca una serie como hecha.
export function marcarSerieGym(estado, ejercicio, serie) {
    const en = entrenamientoEnCurso(estado);
    const s = en.ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    s.hecha = !s.hecha;
    delete s.contando;
    if (!s.hecha) {
        delete s.rir;
        if (en.ultima?.ejercicio === ejercicio && en.ultima?.serie === serie) delete en.ultima;
        return { hecha: false };
    }
    // (v166) Una serie de calentamiento no cuenta para nada (ni récords, ni RIR, ni el avance): solo se marca y se descansa poco.
    if (s.cal) {
        delete en.ultima;   // (para que el descanso no pregunte el RIR de otra serie)
        return { hecha: true, cal: true, frase: { tipo: "calentado", texto: gymAurelio.fraseDeGym("calentado", { nombre: estado.personaje.nombre }, ejercicio + serie) } };
    }
    en.ultima = { ejercicio, serie };   // (v164) la serie que acabas de hacer: en el descanso te pregunta su RIR

    // (v76) Aurelio te dice algo según el momento: primera serie, récord, ejercicio terminado, mitad, última…
    const total = gym.seriesTotales(en);
    const hechas = gym.seriesMarcadas(en);
    const ej = en.ejercicios[ejercicio];
    const info = gym.ejercicioPorId(ej.id);
    // (v164) Récord: mejor 1RM o más peso que nunca, contando también las series que ya hiciste hoy de este ejercicio
    // (así la segunda serie igual a la primera no vuelve a ser «récord»).
    const hoyHechas = ej.series.filter((x, i) => x.hecha && !x.cal && i !== serie);
    const mejor = Math.max(gym.mejoresDe(estado.gym.sesiones)[ej.id]?.puntaje || 0, ...hoyHechas.map((x) => gym.puntajeDe(x.kg, x.reps)));
    const pesoAntes = gym.pesosMaximos(estado.gym.sesiones)[ej.id] || 0;
    const pesoMax = Math.max(pesoAntes, ...hoyHechas.map((x) => x.kg));
    const esRecord = (mejor > 0 && gym.puntajeDe(s.kg, s.reps) > mejor) || (pesoAntes > 0 && s.kg > pesoMax);
    const ejercicioListo = ej.series.every((x) => x.hecha);
    const pendiente = en.ejercicios.find((x) => x.series.some((y) => !y.hecha));
    const tipo = hechas >= total ? "ultima" : esRecord ? "record" : ejercicioListo ? (pendiente ? "ejercicio" : "ejercicioFinal")
        : hechas === 1 ? "primera" : hechas === Math.ceil(total / 2) ? "mitad" : "serie";
    const frase = gymAurelio.fraseDeGym(tipo, {
        nombre: estado.personaje.nombre, ejercicio: info.nombre, siguiente: pendiente ? gym.ejercicioPorId(pendiente.id).nombre : "",
    }, hechas + ejercicio * 3 + serie);
    return { hecha: true, frase: { tipo, texto: frase } };
}

// (v76) El calentamiento: marcarlo da un poco de XP al terminar el entrenamiento.
export function calentarGym(estado) {
    const en = entrenamientoEnCurso(estado);
    en.calentado = !en.calentado;
    return { calentado: en.calentado, frase: en.calentado ? gymAurelio.fraseDeGym("calentado", { nombre: estado.personaje.nombre }, estado.gym.sesiones.length) : null };
}

// Anota el peso (kg) o las repeticiones de una serie.
export function anotarSerieGym(estado, ejercicio, serie, campo, valor) {
    const s = entrenamientoEnCurso(estado).ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    if (campo === "kg") s.kg = numeroEntre(valor === "" ? 0 : valor, 0, gym.MAX_KG, "El peso");
    else if (campo === "reps") s.reps = Math.round(numeroEntre(valor === "" ? 0 : valor, 0, gym.MAX_REPS, "Las repeticiones"));
    else if (campo === "rir") {   // (v164) vacío = no lo anoto
        if (valor === "" || valor === null) delete s.rir;
        else s.rir = Math.round(numeroEntre(valor, 0, gym.MAX_RIR, "Las repeticiones en reserva"));
    } else throw new Error("Ese dato no existe.");
}

// (v164) Las repeticiones en reserva de una serie, con un toque (en el descanso del modo foco). Tocar el mismo número lo quita.
export function anotarRirGym(estado, ejercicio, serie, rir) {
    const s = entrenamientoEnCurso(estado).ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    const valor = Math.round(numeroEntre(rir, 0, gym.MAX_RIR, "Las repeticiones en reserva"));
    if (s.rir === valor) delete s.rir;
    else s.rir = valor;
    return { rir: s.rir ?? null };
}

// Suma un ejercicio extra (de gym.EXTRAS) al entrenamiento en curso.
export function agregarEjercicioGym(estado, ejercicioId) {
    const en = entrenamientoEnCurso(estado);
    const ej = gym.CATALOGO.find((x) => x.id === ejercicioId);
    if (!ej) throw new Error("Ese ejercicio no existe.");
    if (en.ejercicios.some((x) => x.id === ejercicioId)) throw new Error("Ese ejercicio ya está en tu entrenamiento.");
    en.ejercicios.push({ ...gym.ejercicioDelEntrenamiento(ej, estado.gym.sesiones), extra: true });
}

// (v80) Contar las repeticiones tocando: la primera vez empieza de cero y cada toque suma una. Se apaga al marcar la serie.
export function contarRepeticionGym(estado, ejercicio, serie) {
    const ej = entrenamientoEnCurso(estado).ejercicios[ejercicio];
    const s = ej?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    if (s.hecha) throw new Error("Esa serie ya está marcada.");
    if (!s.contando) { s.contando = true; s.reps = 0; }
    s.reps = Math.min(gym.MAX_REPS, s.reps + 1);
    return { reps: s.reps, meta: gym.ejercicioPorId(ej.id).max };
}

// (v78) Sube o baja el peso (de 2,5 en 2,5 kg) o las repeticiones de una serie con los botones + y −.
export function ajustarSerieGym(estado, ejercicio, serie, campo, delta) {
    const s = entrenamientoEnCurso(estado).ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    if (campo === "kg") s.kg = Math.max(0, Math.min(gym.MAX_KG, Math.round((s.kg + delta) * 100) / 100));
    else if (campo === "reps") s.reps = Math.max(0, Math.min(gym.MAX_REPS, Math.round(s.reps + delta)));
    else throw new Error("Ese dato no existe.");
}

// Una serie extra al final de un ejercicio (copia la anterior) o quitar la última.
export function cambiarSeriesGym(estado, ejercicio, delta) {
    const ej = entrenamientoEnCurso(estado).ejercicios[ejercicio];
    if (!ej) throw new Error("Ese ejercicio no existe.");
    const trabajo = gym.seriesDeTrabajo(ej);   // (v166) las de calentamiento no cuentan
    if (delta > 0) {
        if (trabajo.length >= gym.MAX_SERIES) throw new Error(`Máximo ${gym.MAX_SERIES} series por ejercicio.`);
        const ultima = ej.series[ej.series.length - 1] || { kg: 0, reps: 10 };
        ej.series.push({ kg: ultima.kg, reps: ultima.reps, hecha: false });
    } else if (trabajo.length > 1) {
        for (let i = ej.series.length - 1; i >= 0; i--) {
            if (!ej.series[i].cal) { ej.series.splice(i, 1); break; }
        }
    }
}

// ===== (v166) Cambiar, saltar y calentar ejercicios en pleno entrenamiento =====
// Cambiar o saltar solo se puede si aún no hiciste ninguna serie de ese ejercicio. `en.plan` guarda cuántas series ibas a hacer
// de verdad (para que saltar un ejercicio no te quite el «entrenamiento completo» ni las monedas).
function ejercicioSinEmpezar(estado, indice) {
    const en = entrenamientoEnCurso(estado);
    const ej = en.ejercicios[indice];
    if (!ej) throw new Error("Ese ejercicio no existe.");
    if (ej.series.some((s) => s.hecha)) throw new Error("Ya hiciste series de este ejercicio: termínalo (o bórralo después en el historial).");
    if (!Number.isFinite(en.plan)) en.plan = gym.seriesPlaneadasDe(en);
    return { en, ej };
}

// La máquina está ocupada: cambia este ejercicio por otro (se llena con lo de la última vez del nuevo).
export function cambiarEjercicioEnCurso(estado, indice, nuevoId) {
    const { en, ej } = ejercicioSinEmpezar(estado, indice);
    const nuevo = gym.ejercicioPorId(nuevoId);
    if (!nuevo) throw new Error("Ese ejercicio no existe.");
    if (en.ejercicios.some((x) => x.id === nuevoId)) throw new Error("Ese ejercicio ya está en tu entrenamiento.");
    const hecho = gym.ejercicioDelEntrenamiento(nuevo, estado.gym.sesiones);
    if (en.descarga) hecho.series = hecho.series.slice(0, gym.seriesDeDescarga(hecho.series.length));
    en.plan += hecho.series.length - gym.seriesDeTrabajo(ej).length;
    en.ejercicios[indice] = { ...hecho, cambiado: true };
    delete en.ultima;
}

// Sáltate este ejercicio (no se guarda nada de él).
export function saltarEjercicioGym(estado, indice) {
    const { en, ej } = ejercicioSinEmpezar(estado, indice);
    if (en.ejercicios.length <= 1) throw new Error("Es el único ejercicio: si hoy no vas a entrenar, cancela el entrenamiento.");
    en.plan = Math.max(1, en.plan - gym.seriesDeTrabajo(ej).length);
    en.ejercicios.splice(indice, 1);
    delete en.ultima;
}

// Una serie ligera antes de las pesadas: el 50 % del peso de trabajo, luego 70 % y 85 %. No da XP ni cuenta para récords.
export function agregarCalentamientoGym(estado, indice) {
    const ej = entrenamientoEnCurso(estado).ejercicios[indice];
    if (!ej) throw new Error("Ese ejercicio no existe.");
    const trabajo = gym.seriesDeTrabajo(ej);
    if (trabajo.some((s) => s.hecha)) throw new Error("Ya empezaste las series de trabajo de este ejercicio.");
    const previas = ej.series.filter((s) => s.cal).length;
    if (previas >= gym.MAX_CALENTAMIENTOS) throw new Error(`Máximo ${gym.MAX_CALENTAMIENTOS} series de calentamiento por ejercicio.`);
    const kgTrabajo = trabajo[0]?.kg || 0;
    const kg = kgTrabajo > 0 ? Math.round((kgTrabajo * gym.PORCENTAJES_CALENTAMIENTO[previas]) / 2.5) * 2.5 : 0;
    ej.series.splice(previas, 0, { kg, reps: gym.REPS_CALENTAMIENTO, hecha: false, cal: true });
}

// Quita la última serie de calentamiento que aún no hiciste.
export function quitarCalentamientoGym(estado, indice) {
    const ej = entrenamientoEnCurso(estado).ejercicios[indice];
    if (!ej) throw new Error("Ese ejercicio no existe.");
    for (let i = ej.series.length - 1; i >= 0; i--) {
        if (ej.series[i].cal && !ej.series[i].hecha) { ej.series.splice(i, 1); return; }
    }
    throw new Error("No hay calentamiento por quitar.");
}

// Termina el entrenamiento: lo guarda, da el XP de Fuerza, las monedas y los hitos, y avisa de los récords.
export function terminarGym(estado) {
    const entrenamiento = entrenamientoEnCurso(estado);
    const sesion = gym.cerrarEntrenamiento(entrenamiento, estado.gym.sesiones);
    const resultado = guardarSesionGym(estado, sesion);
    estado.gym.encurso = null;
    return resultado;
}

// (v74) La meta que se marca: dices que hoy (o ayer) entrenaste esa rutina, sin anotar series.
export function marcarGymRapido(estado, rutinaId, fecha = hoy()) {
    const g = estado.gym;
    if (!gym.rutinaPorId(rutinaId)) throw new Error("Esa rutina no existe.");
    if (fecha !== hoy() && fecha !== sumarDias(hoy(), -1)) throw new Error("Solo puedes marcar el entrenamiento de hoy o de ayer.");
    if (g.sesiones.some((s) => s.fecha === fecha && s.rutina === rutinaId)) {
        throw new Error("Esa rutina ya la marcaste ese día. ¡El músculo crece descansando!");
    }
    return guardarSesionGym(estado, gym.sesionRapida(rutinaId, fecha));
}

// Guarda una sesión ya armada: da el XP de Fuerza y las monedas, y avisa de niveles, músculos, lecturas, mazmorras e hitos.
function guardarSesionGym(estado, sesion) {
    const g = estado.gym;
    const nivelAntes = gym.nivelDeGym(g.sesiones).nivel;
    const fraguaAntes = torre.lugarAbierto(torre.arcadeConGym(estado), "fragua");
    const musculosAntes = gym.nivelesDeMusculos(g.sesiones);
    g.sesiones.push(sesion);
    g.sesiones.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    ganar(estado, { xp: sesion.xp, monedas: sesion.monedas, atributo: "fuerza" });

    const rutina = gym.rutinaPorId(sesion.rutina);
    const celebraciones = [{ icono: rutina.icono, etiqueta: sesion.rapido ? "¡Meta del día cumplida!" : sesion.completa ? "¡Entrenamiento completo!" : "Entrenamiento guardado",
                             titulo: rutina.nombre, detalle: `+${sesion.xp} XP de 💪 Fuerza${sesion.monedas ? ` · +${sesion.monedas} 🪙` : ""}`,
                             maestro: gymAurelio.fraseDeGym(sesion.rapido ? "marcado" : "fin", { nombre: estado.personaje.nombre }, g.sesiones.length) }];
    // (v164) Cada récord dice de qué es (1RM, peso o repeticiones) y su nivel: cuanto más récords llevas en un ejercicio, más vale.
    for (const r of sesion.records) {
        const ej = gym.ejercicioPorId(r.id);
        const tipos = (r.tipos || ["1rm"]).map((t) => gym.NOMBRE_DE_RECORD[t]).join(" y de ");
        const nivel = r.nivel || 1;
        celebraciones.push({ icono: nivel >= 3 ? "🏆" : "📈", etiqueta: `¡Récord de ${tipos}!`, titulo: ej.nombre,
                             detalle: `Superaste tu mejor marca. +${gym.monedasDeRecord(nivel)} 🪙${nivel > 1 ? ` · récord de nivel ${nivel}` : ""}` });
    }
    // (v164) El primer entrenamiento de una semana de descarga: el premio por descansar bien.
    const descarga = sesion.descarga && gym.descargaDeLaSemana(g, lunesDe(sesion.fecha));
    if (descarga && !descarga.cobrada) {
        descarga.cobrada = true;
        ganar(estado, { gemas: gym.PREMIO_DESCARGA.gemas, xp: gym.PREMIO_DESCARGA.xp, atributo: "fuerza" });
        celebraciones.push({ icono: "🛌", etiqueta: "¡Descansaste bien!", titulo: "Semana de descarga",
                             detalle: `+${gym.PREMIO_DESCARGA.gemas} 💎 · +${gym.PREMIO_DESCARGA.xp} XP de 💪 Fuerza`,
                             maestro: `Bajar el volumen no es retroceder, ${estado.personaje.nombre}: es tomar impulso. La semana que viene vuelves más fuerte.` });
    }
    const nivelAhora = gym.nivelDeGym(g.sesiones).nivel;
    if (nivelAhora > nivelAntes) {
        const rango = gym.rangoDe(nivelAhora);
        celebraciones.push({ icono: rango.icono, etiqueta: "¡Subiste de nivel de gym!", titulo: `Gym nivel ${nivelAhora} · ${rango.nombre}`,
                             detalle: `Tu héroe gana +${Math.round(gym.bonoDeGym(nivelAhora) * 100)} % de vida y ataque en la Torre.` });
    }
    // (v82) Tu físico subió de escalón: se muestra tu cuerpo de antes y el de ahora.
    if (gym.fisicoDe(nivelAhora) > gym.fisicoDe(nivelAntes)) {
        const corpulencia = gym.corpulenciaDe(gym.imcActual(g));
        celebraciones.push({ icono: "🏋️", etiqueta: "¡Tu cuerpo cambió!", titulo: `Físico: ${gym.NOMBRES_DE_FISICO[gym.fisicoDe(nivelAhora)]}`,
                             detalle: "Mira cómo se ve tu cuerpo ahora comparado con antes.", maestro: "Eso no se logra en un día, " + estado.personaje.nombre + ": se logra en muchos.",
                             cuerpo: { antes: { fisico: gym.fisicoDe(nivelAntes), corpulencia }, despues: { fisico: gym.fisicoDe(nivelAhora), corpulencia } } });
    }
    // Tu cuerpo abre la Fragua Profunda (nivel 5 de gym).
    if (!fraguaAntes && torre.lugarAbierto(torre.arcadeConGym(estado), "fragua")) {
        celebraciones.push({ icono: "⚒️", etiqueta: "¡Se abrió una mazmorra!", titulo: bestiario.LUGARES.fragua.nombre,
                             detalle: "Tu entrenamiento te dejó bajar a la Fragua Profunda. Búscala en el Arcade.", maestro: "Solo un cuerpo entrenado aguanta ese calor, " + estado.personaje.nombre + "." });
    }
    // Maren te deja una lectura nueva cada vez que subes al nivel que la abre.
    for (const lectura of fragua.LECTURAS) {
        if (lectura.nivel > nivelAntes && lectura.nivel <= nivelAhora) {
            celebraciones.push({ icono: "📜", etiqueta: "Maren te dejó una lectura", titulo: lectura.titulo, detalle: "Léela en el Gimnasio › Lecturas de la Fragua.", maestro: lectura.moraleja });
        }
    }
    const musculosAhora = gym.nivelesDeMusculos(g.sesiones);
    for (const [clave, m] of Object.entries(musculosAhora)) {
        if (m.nivel > musculosAntes[clave].nivel) {
            celebraciones.push({ pequena: true, icono: gym.MUSCULOS[clave].icono, titulo: `${gym.MUSCULOS[clave].nombre} subió a nivel ${m.nivel}` });
        }
    }
    // Si elegiste una misión (ej: «Ir al gym»), se marca sola ese día: no hace falta anotarlo dos veces.
    const mision = g.mision && estado.misiones.find((m) => m.id === g.mision && !m.archivadaEn);
    if (mision) {
        try {
            completarMision(estado, mision.id, sesion.fecha);
            celebraciones.push({ pequena: true, icono: "✅", titulo: `Misión «${mision.nombre}» marcada` });
        } catch (error) {
            // ya estaba marcada, o no tocaba ese día: no pasa nada
        }
    }
    for (const hito of gym.hitosNuevos(g, hoy())) {
        g.hitos.push(hito.id);
        ganar(estado, { gemas: hito.gemas });
        celebraciones.push({ icono: hito.icono, etiqueta: "¡Hito de gym!", titulo: hito.titulo, detalle: `${hito.texto} +${hito.gemas} 💎` });
    }
    // (v79) El reto de la semana de esa sesión: si ya lo cumpliste y no lo habías cobrado, se cobra.
    const lunes = lunesDe(sesion.fecha);
    const reto = gym.progresoDelReto(g, lunes);
    if (reto.cumplido && !reto.cobrado) {
        g.retosCobrados.push(lunes);
        ganar(estado, { gemas: gym.PREMIO_RETO.gemas, xp: gym.PREMIO_RETO.xp, atributo: "fuerza" });
        celebraciones.push({ icono: reto.reto.icono, etiqueta: "¡Reto de la semana cumplido!", titulo: reto.reto.texto(g),
                             detalle: `+${gym.PREMIO_RETO.gemas} 💎 · +${gym.PREMIO_RETO.xp} XP de 💪 Fuerza`, maestro: "Te lo propuse el lunes y lo cumpliste, " + estado.personaje.nombre + ". Así se hace." });
    }
    return { sesion, celebraciones };
}

// (v164) Empezar una semana de descarga (la de hoy): cada entrenamiento de esta semana trae un 40 % menos de series.
export function empezarDescargaGym(estado) {
    const g = estado.gym;
    if (g.encurso) throw new Error("Termina o cancela tu entrenamiento antes de empezar la descarga.");
    const lunes = lunesDe(hoy());
    if (gym.descargaDeLaSemana(g, lunes)) throw new Error("Esta semana ya es de descarga.");
    g.descargas.push({ lunes, cobrada: false });
}

// (v164) Quitar la descarga de esta semana (solo si aún no te dio el premio).
export function quitarDescargaGym(estado) {
    const g = estado.gym;
    if (g.encurso) throw new Error("Termina o cancela tu entrenamiento antes de quitar la descarga.");
    const d = gym.descargaDeLaSemana(g, lunesDe(hoy()));
    if (!d) throw new Error("Esta semana no es de descarga.");
    if (d.cobrada) throw new Error("Ya entrenaste en descarga esta semana: se queda así.");
    g.descargas.splice(g.descargas.indexOf(d), 1);
}

// (v164) La nota de una sesión ya guardada (de ese día y esa rutina): cómo dormiste y una línea de molestias.
// valores = { sueno?: "bien" | "regular" | "mal" | "", texto?: "…" }. Lo que no mandes se queda como estaba.
export function anotarNotaGym(estado, fecha, rutinaId, valores) {
    const sesion = estado.gym.sesiones.find((s) => s.fecha === fecha && s.rutina === rutinaId);
    if (!sesion) throw new Error("Esa sesión no existe.");
    const nota = { ...sesion.nota };
    if (valores.sueno !== undefined) {
        if (valores.sueno && !gym.SUENOS[valores.sueno]) throw new Error("Esa opción de sueño no existe.");
        if (valores.sueno && nota.sueno !== valores.sueno) nota.sueno = valores.sueno;
        else delete nota.sueno;   // vacío, o tocar la misma otra vez, la quita
    }
    if (valores.texto !== undefined) {
        const texto = String(valores.texto).trim();
        if (texto.length > gym.MAX_NOTA) throw new Error(`La nota puede tener hasta ${gym.MAX_NOTA} letras.`);
        if (texto) nota.texto = texto;
        else delete nota.texto;
    }
    if (Object.keys(nota).length) sesion.nota = nota;
    else delete sesion.nota;
    return sesion.nota || null;
}

// (v166) Corrige el peso o las repeticiones de una sesión ya guardada. Se recalculan su XP, sus monedas y sus récords
// (contra las sesiones anteriores) y se te da o se te quita la diferencia. Las sesiones posteriores no se recalculan
// y los hitos ya cobrados se quedan.
// cambios = [{ ejercicio, serie, kg, reps }] (los números pueden venir como texto con coma).
export function corregirSesionGym(estado, indice, cambios) {
    const sesion = estado.gym.sesiones[indice];
    if (!sesion) throw new Error("Esa sesión no existe.");
    if (sesion.rapido) throw new Error("Esa sesión solo se marcó, no tiene series que corregir.");
    const limpios = cambios.map((c) => ({
        ejercicio: c.ejercicio, serie: c.serie,
        kg: numeroEntre(c.kg === "" ? 0 : c.kg, 0, gym.MAX_KG, "El peso"),
        reps: Math.round(numeroEntre(c.reps, 1, gym.MAX_REPS, "Las repeticiones")),
    }));
    const nueva = gym.corregirSesion(sesion, limpios, estado.gym.sesiones.slice(0, indice));
    ganar(estado, { xp: nueva.xp - sesion.xp, monedas: nueva.monedas - sesion.monedas, atributo: "fuerza" });
    estado.gym.sesiones[indice] = nueva;
    return { sesion: nueva, xp: nueva.xp - sesion.xp, monedas: nueva.monedas - sesion.monedas };
}

// Borra una sesión equivocada y le quita lo que había dado (los hitos ya cobrados se quedan).
export function borrarSesionGym(estado, indice) {
    const sesion = estado.gym.sesiones[indice];
    if (!sesion) throw new Error("Esa sesión no existe.");
    estado.gym.sesiones.splice(indice, 1);
    ganar(estado, { xp: -sesion.xp, monedas: -sesion.monedas, atributo: "fuerza" });
}

// Anota tu peso corporal de hoy (si ya lo anotaste, lo cambia).
export function anotarPesoGym(estado, kg) {
    const valor = numeroEntre(kg, 20, 400, "El peso corporal");
    const lista = estado.gym.peso;
    const hoyTexto = hoy();
    const existente = lista.find((p) => p.fecha === hoyTexto);
    if (existente) existente.kg = valor;
    else lista.push({ fecha: hoyTexto, kg: valor });
    lista.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    if (lista.length > 400) lista.splice(0, lista.length - 400);
}

// Tu altura en centímetros (para calcular el IMC).
export function anotarAlturaGym(estado, cm) {
    estado.gym.altura = Math.round(numeroEntre(cm, 100, 230, "La altura"));
}

// (v82) Tu peso objetivo (vacío = quitarlo).
export function anotarMetaPesoGym(estado, kg) {
    estado.gym.metaPeso = kg === "" || kg === null ? null : numeroEntre(kg, 20, 400, "El peso objetivo");
}

// (v82) Tus medidas del día (en cm). Puedes anotar solo algunas; si ya anotaste hoy, se completan o se cambian.
export function anotarMedidasGym(estado, valores) {
    const nuevas = {};
    for (const clave of Object.keys(gym.MEDIDAS)) {
        const crudo = valores[clave];
        if (crudo === undefined || crudo === null || String(crudo).trim() === "") continue;
        nuevas[clave] = numeroEntre(crudo, 10, 250, `La medida de ${gym.MEDIDAS[clave].nombre.toLowerCase()}`);
    }
    if (!Object.keys(nuevas).length) throw new Error("Anota al menos una medida.");
    const lista = estado.gym.medidas;
    const hoyTexto = hoy();
    const existente = lista.find((m) => m.fecha === hoyTexto);
    if (existente) Object.assign(existente, nuevas);
    else lista.push({ fecha: hoyTexto, ...nuevas });
    lista.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    if (lista.length > 400) lista.splice(0, lista.length - 400);
}

// ===== (v160) Editar tus rutinas =====
// Tus cambios se guardan en estado.gym.rutinas = { rutinaId: [{ id, series }] } y gym.aplicarRutinas los pone en RUTINA.
// Mientras entrenas no se puede editar (el entrenamiento en curso usa la rutina tal como estaba).
function listaEditable(estado, rutinaId) {
    const g = estado.gym;
    if (g.encurso) throw new Error("Termina o cancela tu entrenamiento antes de editar tus rutinas.");
    gym.aplicarRutinas(g.rutinas, g.copias);
    const rutina = gym.rutinaPorId(rutinaId);
    if (!rutina) throw new Error("Esa rutina no existe.");
    if (!g.rutinas[rutinaId]) g.rutinas[rutinaId] = rutina.ejercicios.map((x) => ({ id: x.id, series: x.series }));
    return g.rutinas[rutinaId];
}
const guardarRutinas = (estado) => gym.aplicarRutinas(estado.gym.rutinas, estado.gym.copias);

// (v174) Duplicar una rutina para probar una variante sin tocar la original. Devuelve el id de la copia.
export function duplicarRutina(estado, rutinaId) {
    const g = estado.gym;
    if (g.encurso) throw new Error("Termina o cancela tu entrenamiento antes de duplicar una rutina.");
    gym.aplicarRutinas(g.rutinas, g.copias);
    const origen = gym.rutinaPorId(rutinaId);
    if (!origen) throw new Error("Esa rutina no existe.");
    if (g.copias.length >= gym.MAX_COPIAS) throw new Error(`Puedes tener hasta ${gym.MAX_COPIAS} copias: borra alguna primero.`);
    const baseId = origen.copia ? origen.base : origen.id;   // (null si salió de una plantilla)
    const nombreBase = (baseId && gym.rutinaPorId(baseId)?.nombre) || origen.nombre;
    let n = 1;
    let nombre;
    do { nombre = n === 1 ? `${nombreBase} (copia)` : `${nombreBase} (copia ${n})`; n += 1; } while (nombreEnUso(g, nombre));
    const id = idLibreDeCopia(g);
    g.copias.push({ id, base: baseId, nombre, icono: origen.icono });
    g.rutinas[id] = origen.ejercicios.map((x) => ({ id: x.id, series: x.series }));
    guardarRutinas(estado);
    return id;
}

// ¿Ya hay una rutina (de fábrica o copia) con ese nombre?
const nombreEnUso = (g, nombre) => gym.RUTINA.some((r) => r.nombre === nombre) || g.copias.some((c) => c.nombre === nombre);
// El id de una copia nunca se repite (ni aunque borres copias): el historial lo usa para saber con qué rutina entrenaste.
function idLibreDeCopia(g) {
    for (let k = 1; ; k += 1) {
        const id = `copia-${Date.now().toString(36)}${k > 1 ? `-${k}` : ""}`;
        if (!gym.rutinaPorId(id) && !g.copias.some((c) => c.id === id) && !g.sesiones.some((s) => s.rutina === id)) return id;
    }
}

// (v177) Crea las rutinas de una plantilla (para un objetivo: deficit, mantener o aumento). Se suman a tus copias, sin tocar
// las que ya tienes ni cambiar a cuál le toca entrenar. Devuelve los ids creados.
export function crearRutinasDePlantilla(estado, plantillaId, objetivo) {
    const g = estado.gym;
    if (g.encurso) throw new Error("Termina o cancela tu entrenamiento antes de crear rutinas.");
    gym.aplicarRutinas(g.rutinas, g.copias);
    const armadas = plantillas.armarPlantilla(plantillaId, objetivo);
    if (g.copias.length + armadas.length > gym.MAX_COPIAS) {
        throw new Error(`Esta plantilla crea ${armadas.length} rutinas y solo caben ${gym.MAX_COPIAS} en total (tienes ${g.copias.length}): borra alguna copia primero.`);
    }
    const ids = armadas.map((r) => {
        let nombre = r.nombre;
        for (let n = 2; nombreEnUso(g, nombre); n += 1) nombre = `${r.nombre} (${n})`;
        const id = idLibreDeCopia(g);
        g.copias.push({ id, base: null, nombre, icono: r.icono });
        g.rutinas[id] = r.ejercicios.map((x) => ({ id: x.id, series: x.series }));
        return id;
    });
    guardarRutinas(estado);
    return ids;
}

// Borra una copia. Si ya hiciste entrenamientos con ella no se puede: el historial los necesita.
export function borrarCopiaDeRutina(estado, rutinaId) {
    const g = estado.gym;
    if (g.encurso) throw new Error("Termina o cancela tu entrenamiento antes de borrar una copia.");
    const i = g.copias.findIndex((c) => c.id === rutinaId);
    if (i === -1) throw new Error("Esa copia no existe.");
    if (g.sesiones.some((s) => s.rutina === rutinaId)) throw new Error("Ya hiciste entrenamientos con esta copia: se queda para que tu historial siga completo.");
    g.copias.splice(i, 1);
    delete g.rutinas[rutinaId];
    guardarRutinas(estado);
}

export function agregarEjercicioARutina(estado, rutinaId, ejercicioId) {
    const base = gym.ejercicioPorId(ejercicioId);
    if (!base) throw new Error("Ese ejercicio no existe.");
    const lista = listaEditable(estado, rutinaId);
    if (lista.some((x) => x.id === ejercicioId)) throw new Error("Ese ejercicio ya está en la rutina.");
    if (lista.length >= 12) throw new Error("Una rutina puede tener hasta 12 ejercicios.");
    lista.push({ id: ejercicioId, series: base.series });
    guardarRutinas(estado);
}

export function quitarEjercicioDeRutina(estado, rutinaId, ejercicioId) {
    const lista = listaEditable(estado, rutinaId);
    if (lista.length <= 1) throw new Error("La rutina necesita al menos un ejercicio.");
    const i = lista.findIndex((x) => x.id === ejercicioId);
    if (i === -1) throw new Error("Ese ejercicio no está en la rutina.");
    lista.splice(i, 1);
    guardarRutinas(estado);
}

// Cambia un ejercicio por otro (se queda en el mismo lugar y con las mismas series).
export function cambiarEjercicioDeRutina(estado, rutinaId, viejoId, nuevoId) {
    if (!gym.ejercicioPorId(nuevoId)) throw new Error("Ese ejercicio no existe.");
    const lista = listaEditable(estado, rutinaId);
    const i = lista.findIndex((x) => x.id === viejoId);
    if (i === -1) throw new Error("Ese ejercicio no está en la rutina.");
    if (viejoId !== nuevoId && lista.some((x) => x.id === nuevoId)) throw new Error("Ese ejercicio ya está en la rutina.");
    lista[i] = { id: nuevoId, series: lista[i].series };
    guardarRutinas(estado);
}

export function cambiarSeriesDeRutina(estado, rutinaId, ejercicioId, delta) {
    const lista = listaEditable(estado, rutinaId);
    const x = lista.find((y) => y.id === ejercicioId);
    if (!x) throw new Error("Ese ejercicio no está en la rutina.");
    x.series = Math.max(1, Math.min(gym.MAX_SERIES, x.series + delta));
    guardarRutinas(estado);
}

export function moverEjercicioDeRutina(estado, rutinaId, ejercicioId, delta) {
    const lista = listaEditable(estado, rutinaId);
    const i = lista.findIndex((x) => x.id === ejercicioId);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    guardarRutinas(estado);
}

// Vuelve a los ejercicios de fábrica de esa rutina.
export function restaurarRutina(estado, rutinaId) {
    listaEditable(estado, rutinaId);
    delete estado.gym.rutinas[rutinaId];
    guardarRutinas(estado);
}

export function cambiarAjusteGym(estado, clave, valor) {
    if (clave === "meta") estado.gym.metaSemanal = Math.round(numeroEntre(valor, 1, 7, "La meta"));
    else if (clave === "barra") {   // (v166) lo que pesa tu barra, para la calculadora de discos
        const kg = Number(valor);
        if (!gym.BARRAS.includes(kg)) throw new Error("Esa barra no existe.");
        estado.gym.barra = kg;
    } else if (clave === "foco") {
        estado.gym.foco = Boolean(valor);
    } else if (clave === "pantalla") {   // (v173) pantalla encendida mientras entrenas
        estado.gym.pantalla = Boolean(valor);
    } else if (clave === "avisoSerie") {   // (v174) sonido y vibración al acabar el descanso
        estado.gym.avisoSerie = Boolean(valor);
    } else if (clave === "mision") {
        const id = valor === "" || valor === null ? null : Number(valor);
        if (id !== null && !estado.misiones.some((m) => m.id === id && !m.archivadaEn)) throw new Error("Esa misión no existe.");
        estado.gym.mision = id;
    } else if (clave === "descanso") {
        const seg = Number(valor);
        if (!gym.DESCANSOS.includes(seg)) throw new Error("Ese descanso no existe.");
        estado.gym.descanso = seg;
    } else throw new Error("Ese ajuste no existe.");
}

