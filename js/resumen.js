// resumen.js — Los números del resumen (últimos 7 o 30 días).
//
// Solo calcula; las gráficas se dibujan en vistas.js.
// "Cumplimiento" = de las misiones que TOCABAN cada día, cuántas hiciste.
// Los días de descanso (sin misiones) no cuentan ni a favor ni en contra.

import { sumarDias, diaDeSemana, lunesDe } from "./fechas.js";
import { ATRIBUTOS, ANIMOS_DIARIO, MOTIVOS_FALLA, hechasPorFecha, misionesDelDia, estaActiva, vecesEnSemana } from "./juego.js";
import { DESAFIOS, progresoDesafio, textoDesafio } from "./desafios.js";

function porcentaje(hechas, total) {
    return total > 0 ? Math.round((hechas / total) * 100) : null;   // null = no tocaba nada
}

// Suma el cumplimiento de un tramo de días: desde "hasta − (dias − 1)" hasta "hasta".
function tramo(estado, hasta, dias, hechasDia) {
    const inicio = estado.personaje.creadoEn;
    const porDia = [];
    let hechas = 0;
    let total = 0;
    let perfectos = 0;
    let conMisiones = 0;

    for (let i = dias - 1; i >= 0; i--) {
        const fecha = sumarDias(hasta, -i);
        if (fecha < inicio) {                     // antes de empezar a jugar
            porDia.push({ fecha, hechas: 0, total: 0, pct: null, antes: true });
            continue;
        }
        const programadas = misionesDelDia(estado.misiones, fecha);
        const completadas = hechasDia.get(fecha);
        const cumplidas = completadas ? programadas.filter((m) => completadas.has(m.id)).length : 0;
        porDia.push({ fecha, hechas: cumplidas, total: programadas.length, pct: porcentaje(cumplidas, programadas.length) });
        hechas += cumplidas;
        total += programadas.length;
        if (programadas.length > 0) {
            conMisiones += 1;
            if (cumplidas === programadas.length) perfectos += 1;
        }
    }
    return { porDia, hechas, total, pct: porcentaje(hechas, total), perfectos, conMisiones };
}

function xpEntre(estado, desde, hasta) {
    return estado.completadas
        .filter((c) => c.fecha >= desde && c.fecha <= hasta)
        .reduce((suma, c) => suma + c.xp, 0);
}

export function calcularResumen(estado, hoy, dias) {
    const hechasDia = hechasPorFecha(estado.completadas);
    const desde = sumarDias(hoy, -(dias - 1));
    const finAnterior = sumarDias(desde, -1);
    const inicioAnterior = sumarDias(finAnterior, -(dias - 1));

    const actual = tramo(estado, hoy, dias, hechasDia);
    // El tramo anterior solo sirve para comparar si ya jugabas durante TODO ese tramo
    // (comparar 30 días contra 10 no sería justo).
    const hayAnterior = estado.personaje.creadoEn <= inicioAnterior;
    const anterior = hayAnterior ? tramo(estado, finAnterior, dias, hechasDia) : null;

    // Por misión: de los días que le tocaban en el tramo, cuántos la hiciste.
    const misiones = estado.misiones.filter((m) => !m.archivadaEn).map((m) => {
        let tocaba = 0;
        let hizo = 0;
        let activa = 0;   // días que existía (para las semanales)
        for (const dia of actual.porDia) {
            if (dia.antes) continue;
            const hecha = Boolean(hechasDia.get(dia.fecha)?.has(m.id));
            if (m.veces) {
                if (estaActiva(m, dia.fecha)) activa += 1;
                if (hecha) hizo += 1;
            } else if (misionesDelDia([m], dia.fecha).length) {
                tocaba += 1;
                if (hecha) hizo += 1;
            }
        }
        // Una semanal de 3 veces debía hacerse 3 veces cada 7 días que estuvo activa.
        if (m.veces) {
            tocaba = Math.round((m.veces * activa) / 7);
            hizo = Math.min(hizo, tocaba);
        }
        return { id: m.id, nombre: m.nombre, atributo: m.atributo, hechas: hizo, total: tocaba, pct: porcentaje(hizo, tocaba) };
    }).filter((m) => m.total > 0).sort((a, b) => b.pct - a.pct);

    // Por atributo: misiones completadas en el tramo.
    const cuenta = {};
    for (const clave of Object.keys(ATRIBUTOS)) cuenta[clave] = 0;
    for (const c of estado.completadas) {
        if (c.fecha >= desde && c.fecha <= hoy && c.atributo in cuenta) cuenta[c.atributo] += 1;
    }
    const atributos = Object.keys(ATRIBUTOS).map((clave) => ({ clave, hechas: cuenta[clave] }));
    // El más descuidado: el que menos misiones tiene (si hay algo que comparar).
    const menor = Math.min(...atributos.map((a) => a.hechas));
    const mayor = Math.max(...atributos.map((a) => a.hechas));
    const descuidado = mayor > menor ? atributos.find((a) => a.hechas === menor).clave : null;

    // Mejor día de la semana (últimas 4 semanas, para que haya suficientes datos).
    const cuatroSemanas = tramo(estado, hoy, 28, hechasDia);
    const porSemana = Array.from({ length: 7 }, () => ({ hechas: 0, total: 0 }));
    for (const dia of cuatroSemanas.porDia) {
        const d = porSemana[diaDeSemana(dia.fecha)];
        d.hechas += dia.hechas;
        d.total += dia.total;
    }
    let mejorDia = null;
    porSemana.forEach((d, i) => {
        const pct = porcentaje(d.hechas, d.total);
        if (pct !== null && d.hechas > 0 && (!mejorDia || pct > mejorDia.pct)) mejorDia = { dia: i, pct };
    });

    return {
        dias,
        porDia: actual.porDia,
        cumplimiento: { hechas: actual.hechas, total: actual.total, pct: actual.pct },
        cambio: anterior && anterior.pct !== null && actual.pct !== null ? actual.pct - anterior.pct : null,
        perfectos: actual.perfectos,
        diasConMisiones: actual.conMisiones,
        xp: xpEntre(estado, desde, hoy),
        xpAnterior: hayAnterior ? xpEntre(estado, inicioAnterior, finAnterior) : null,
        mejorDia,
        misiones,
        atributos,
        descuidado,
    };
}


// ===== (v148) La semana EN CURSO (la tarjeta «Tu semana» de Hoy) =====
// Solo cuenta los días que ya pasaron (de lunes a hoy): lo que falta de la semana no cuenta como fallado.
// El gym, el running y las finanzas los suma vistas-hoy.js (así este archivo no depende de esas reglas).
export function semanaEnCurso(estado, hoy) {
    const lunes = lunesDe(hoy);
    const dias = diaDeSemana(hoy) + 1;   // lunes = 1 … domingo = 7
    const r = calcularResumen(estado, hoy, dias);
    return {
        lunes,
        dias,
        cumplimiento: r.cumplimiento,
        perfectos: r.perfectos,
        xp: r.xp,
        completadas: estado.completadas.filter((c) => c.fecha >= lunes && c.fecha <= hoy).length,
        tareas: estado.tareas.filter((t) => t.hechaEn && t.hechaEn >= lunes && t.hechaEn <= hoy).length,
        porDia: r.porDia.map((d) => ({ fecha: d.fecha, pct: d.pct, hechas: d.hechas })),
    };
}


// ===== Tu semana (la tarjeta del lunes) =====

// ¿Hay que mostrar el resumen de la semana pasada? Devuelve su lunes, o null.
// Se muestra si jugaste esa semana y todavía no cerraste la tarjeta en esta.
export function semanaPorMostrar(estado, hoy) {
    const esteLunes = lunesDe(hoy);
    const lunesPasado = sumarDias(esteLunes, -7);
    const jugaste = estado.personaje.creadoEn <= sumarDias(lunesPasado, 6);
    return jugaste && estado.semanaVista !== esteLunes ? lunesPasado : null;
}

// Todo lo que pasó en una semana (de lunes a domingo).
export function resumenSemana(estado, lunes) {
    const domingo = sumarDias(lunes, 6);
    const enSemana = (fecha) => Boolean(fecha) && fecha >= lunes && fecha <= domingo;
    // Es el resumen de "últimos 7 días" pero mirado desde el domingo (y compara con la semana anterior).
    const r = calcularResumen(estado, domingo, 7);

    // El mejor día de ESA semana.
    let mejor = null;
    for (const dia of r.porDia) {
        if (dia.pct !== null && dia.hechas > 0 && (!mejor || dia.pct > mejor.pct)) mejor = dia;
    }

    // Metas «N veces por semana» que existían esa semana.
    const semanales = estado.misiones
        .filter((m) => m.veces && m.creadaEn <= domingo && (!m.archivadaEn || m.archivadaEn > lunes))
        .map((m) => {
            const hechas = vecesEnSemana(estado.completadas, m.id, lunes);
            return { nombre: m.nombre, hechas, meta: m.veces, cumplida: hechas >= m.veces };
        });

    const sesiones = estado.enfoque.sesiones.filter((s) => enSemana(s.fecha));
    const animos = {};
    for (const clave of Object.keys(ANIMOS_DIARIO)) animos[clave] = 0;
    for (const [fecha, entrada] of Object.entries(estado.diario)) {
        if (enSemana(fecha) && entrada.animo) animos[entrada.animo] += 1;
    }

    const desafio = estado.desafios.find((d) => d.semana === lunes && DESAFIOS[d.tipo]);
    return {
        lunes,
        domingo,
        cumplimiento: r.cumplimiento,
        cambio: r.cambio,
        perfectos: r.perfectos,
        diasConMisiones: r.diasConMisiones,
        xp: r.xp,
        completadas: estado.completadas.filter((c) => enSemana(c.fecha)).length,
        mejorDia: mejor ? { dia: diaDeSemana(mejor.fecha), pct: mejor.pct } : null,
        descuidado: r.descuidado,
        semanales,
        tareas: estado.tareas.filter((t) => enSemana(t.hechaEn)).length,
        enfoque: { sesiones: sesiones.length, minutos: sesiones.reduce((suma, s) => suma + s.minutos, 0) },
        animos,
        desafio: desafio
            ? { texto: textoDesafio(desafio), progreso: progresoDesafio(estado, desafio), meta: desafio.meta, cobrado: Boolean(desafio.cobradoEn) }
            : null,
    };
}


// ===== Revisión semanal (v39) =====
// Al terminar una semana, escribes qué salió bien, qué mejorar, y eliges hasta 3 misiones de "foco"
// para la semana que empieza. Se guarda en estado.revisiones[lunes de la semana revisada].

export const MAX_FOCO = 3;

// Misiones que se pueden elegir como foco: las activas el día que haces la revisión.
export function misionesParaFoco(estado, hoy) {
    return estado.misiones.filter((m) => estaActiva(m, hoy));
}

// ===== Cómo te va con UNA misión (v149) =====
// Con el historial de una misión se ve a qué hora la sueles cumplir y qué día de la semana la fallas más.
// La hora sale de lo que se guarda al marcarla (completada.hora; las marcadas antes de la v149 no la tienen).

const DIAS_PLURAL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
const MINIMO_DATOS = 3;                       // con menos de 3 datos no se saca ninguna conclusión
const MAS_FACIL = { dificil: "normal", normal: "facil" };

export function analizarMision(estado, misionId) {
    const hechas = estado.completadas.filter((c) => c.misionId === misionId);
    const fallas = estado.fallas.filter((f) => f.misionId === misionId);

    // La hora de en medio (mediana) de todas las veces que la cumpliste.
    const horas = hechas.map((c) => c.hora).filter(Number.isInteger).sort((a, b) => a - b);
    const horaTipica = horas.length >= MINIMO_DATOS ? horas[Math.floor(horas.length / 2)] : null;

    // El día de la semana con más fallas, si de verdad destaca (al menos 3 y 40 % de todas).
    const porDia = [0, 0, 0, 0, 0, 0, 0];
    for (const f of fallas) porDia[diaDeSemana(f.fecha)] += 1;
    const peor = Math.max(...porDia);
    const diaFrecuente = peor >= MINIMO_DATOS && peor / fallas.length >= 0.4 ? porDia.indexOf(peor) : null;

    const intentos = hechas.length + fallas.length;
    return { hechas: hechas.length, fallas: fallas.length, horaTipica, diaFrecuente,
             tasaDeFalla: intentos ? Math.round((fallas.length / intentos) * 100) : 0 };
}

const textoHora = (hora) => `${String(hora).padStart(2, "0")}:00`;

// UN cambio concreto para una misión que fallas mucho (o null si no hay nada razonable que proponer).
// tipo: "quitar-dia" (ya no toca ese día) · "aviso" (le pone una alarma) · "bajar" (la baja de dificultad).
// Lo usa la revisión semanal; acciones.aplicarSugerencia() lo vuelve a calcular y lo aplica.
export function sugerirCambio(mision, analisis, motivo) {
    const sencilla = !mision.veces && !mision.diasMes;     // las metas «N veces» o del mes no tienen días fijos que quitar
    const dia = analisis.diaFrecuente;
    const diasQueToca = mision.dias || [0, 1, 2, 3, 4, 5, 6];

    if (sencilla && dia !== null && diasQueToca.includes(dia) && diasQueToca.length > 1) {
        return { tipo: "quitar-dia", dia,
                 texto: `La fallas sobre todo los ${DIAS_PLURAL[dia]}. Quítala de ese día y concéntrate en los demás.`,
                 boton: `Quitar los ${DIAS_PLURAL[dia]}` };
    }
    if (motivo === "olvido" && !mision.aviso) {
        const hora = analisis.horaTipica ?? 18;
        return { tipo: "aviso", hora: textoHora(hora),
                 texto: analisis.horaTipica !== null
                     ? `Se te olvida, y cuando la cumples suele ser hacia las ${analisis.horaTipica} h. Ponle un aviso a las ${textoHora(hora)}.`
                     : `Se te olvida. Ponle un aviso a las ${textoHora(hora)} para que no se pase el día.`,
                 boton: `Avisarme a las ${textoHora(hora)}` };
    }
    if (["tiempo", "energia", "ganas"].includes(motivo) && MAS_FACIL[mision.dificultad]) {
        const nueva = MAS_FACIL[mision.dificultad];
        return { tipo: "bajar", dificultad: nueva,
                 texto: "Te cuesta sostenerla. Bájala de dificultad: mejor una versión más pequeña que cumplas que una grande que falles.",
                 boton: `Pasarla a ${nueva === "facil" ? "Fácil" : "Normal"}` };
    }
    if (analisis.horaTipica !== null && !mision.aviso) {
        return { tipo: "aviso", hora: textoHora(analisis.horaTipica),
                 texto: `Cuando la cumples suele ser hacia las ${analisis.horaTipica} h. Un aviso a esa hora ayuda a no dejarla pasar.`,
                 boton: `Avisarme a las ${textoHora(analisis.horaTipica)}` };
    }
    return null;
}

// Lo que se ve en la revisión como pista: qué misión fallaste más esa semana, por qué motivo, a qué hora
// la sueles cumplir, y UN cambio concreto que proponer (o null si no hubo fallas).
export function pistaDeFallas(estado, lunes) {
    const domingo = sumarDias(lunes, 6);
    const fallas = (estado.fallas || []).filter((f) => f.fecha >= lunes && f.fecha <= domingo);
    if (!fallas.length) return null;

    const contar = (claves) => {
        const cuenta = {};
        for (const clave of claves) cuenta[clave] = (cuenta[clave] || 0) + 1;
        return Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];   // [clave, veces] la más repetida (undefined si no hay)
    };
    const [idMision, veces] = contar(fallas.map((f) => f.misionId));
    const mision = estado.misiones.find((m) => m.id === Number(idMision));
    const motivoFrecuente = contar(fallas.map((f) => f.motivo).filter((m) => MOTIVOS_FALLA[m]));   // puede no haber ninguno

    let analisis = null;
    let sugerencia = null;
    if (mision) {
        analisis = analizarMision(estado, mision.id);
        // El motivo de ESTA misión (esa semana) manda; si no dijo ninguno, el de todo su historial.
        const conMotivo = (lista) => contar(lista.filter((f) => MOTIVOS_FALLA[f.motivo]).map((f) => f.motivo));
        const motivo = (conMotivo(fallas.filter((f) => f.misionId === mision.id)) || conMotivo(estado.fallas.filter((f) => f.misionId === mision.id)))?.[0];
        sugerencia = mision.archivadaEn ? null : sugerirCambio(mision, analisis, motivo);
    }
    return {
        total: fallas.length,
        mision: mision ? mision.nombre : null,
        misionId: mision ? mision.id : null,
        veces,
        motivo: motivoFrecuente ? MOTIVOS_FALLA[motivoFrecuente[0]] : null,
        horaTipica: analisis ? analisis.horaTipica : null,
        diaFrecuente: analisis ? analisis.diaFrecuente : null,
        sugerencia,
    };
}

// ===== Dificultad adaptable (v151) =====
// Mira las últimas 3 semanas de una misión diaria: si casi siempre la cumples, propone subirla;
// si casi siempre la fallas, propone bajarla. Solo propone: quien decide es el usuario (acciones.aplicarDificultad).
const VENTANA_DIFICULTAD = 21;                 // días que se miran
const MINIMO_INTENTOS = 10;                    // con menos veces que intentarla no se decide nada
const SUBIR_DESDE = 0.9;                       // cumples el 90 % o más → subirla
const BAJAR_HASTA = 0.4;                       // cumples el 40 % o menos → bajarla
const MAS_DIFICIL = { facil: "normal", normal: "dificil" };

export function ajusteDeDificultad(estado, mision, hoy) {
    if (!mision || mision.archivadaEn || mision.veces || mision.diasMes) return null;   // las metas «N veces» o del mes tienen sus propias reglas
    const desde = sumarDias(hoy, -VENTANA_DIFICULTAD + 1);
    const hechas = estado.completadas.filter((c) => c.misionId === mision.id && c.fecha >= desde && c.fecha <= hoy).length;
    const fallas = estado.fallas.filter((f) => f.misionId === mision.id && f.fecha >= desde && f.fecha <= hoy).length;
    const intentos = hechas + fallas;
    if (intentos < MINIMO_INTENTOS) return null;

    const tasa = hechas / intentos;
    const cumplidas = `${Math.round(tasa * 100)} %`;
    if (tasa >= SUBIR_DESDE && MAS_DIFICIL[mision.dificultad]) {
        const nueva = MAS_DIFICIL[mision.dificultad];
        return { tipo: "subir", dificultad: nueva, cumplidas,
                 texto: `Llevas 3 semanas cumpliéndola (${cumplidas}). Ya te queda corta: súbela de dificultad.`,
                 boton: `Subirla a ${DIFICULTAD_NOMBRE[nueva]}` };
    }
    if (tasa <= BAJAR_HASTA && MAS_FACIL[mision.dificultad]) {
        const nueva = MAS_FACIL[mision.dificultad];
        return { tipo: "bajar", dificultad: nueva, cumplidas,
                 texto: `Solo la cumples el ${cumplidas} de las veces. Mejor una versión más pequeña que cumplas.`,
                 boton: `Bajarla a ${DIFICULTAD_NOMBRE[nueva]}` };
    }
    return null;
}

const DIFICULTAD_NOMBRE = { facil: "Fácil", normal: "Normal", dificil: "Difícil" };

// Los ajustes que propone hoy, para las misiones activas (hasta 3, las de mayor cambio primero).
export function ajustesDeDificultad(estado, hoy) {
    return estado.misiones
        .filter((m) => estaActiva(m, hoy))
        .map((m) => ({ misionId: m.id, nombre: m.nombre, ajuste: ajusteDeDificultad(estado, m, hoy) }))
        .filter((x) => x.ajuste)
        .slice(0, 3);
}

// La revisión que hiciste al empezar esta semana (la de la semana pasada), o null.
export function revisionVigente(estado, hoy) {
    return estado.revisiones[sumarDias(lunesDe(hoy), -7)] || null;
}

// Las misiones de foco de esta semana, que todavía existen y no están archivadas.
export function focoDeLaSemana(estado, hoy) {
    const revision = revisionVigente(estado, hoy);
    if (!revision) return [];
    return revision.foco
        .map((id) => estado.misiones.find((m) => m.id === id))
        .filter((m) => m && estaActiva(m, hoy));
}
