// resumen.js — Los números del resumen (últimos 7 o 30 días).
//
// Solo calcula; las gráficas se dibujan en vistas.js.
// "Cumplimiento" = de las misiones que TOCABAN cada día, cuántas hiciste.
// Los días de descanso (sin misiones) no cuentan ni a favor ni en contra.

import { sumarDias, diaDeSemana } from "./fechas.js";
import { ATRIBUTOS, hechasPorFecha, misionesDelDia } from "./juego.js";

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
        for (const dia of actual.porDia) {
            if (dia.antes) continue;
            if (misionesDelDia([m], dia.fecha).length) {
                tocaba += 1;
                if (hechasDia.get(dia.fecha)?.has(m.id)) hizo += 1;
            }
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
