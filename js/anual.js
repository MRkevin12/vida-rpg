// anual.js — El «Año en revisión» (v181): los números de todo un año calendario.
//
// Solo calcula (no toca pantalla ni guarda). Las fechas son texto "AAAA-MM-DD", así que
// "es de ese año" se comprueba mirando cómo empieza el texto.
// Los jefes vencidos no guardan fecha: se cuentan «hasta hoy», no por año.

import { sumarDias } from "./fechas.js";
import { hechasPorFecha, esDiaPerfecto } from "./juego.js";
import { jefesVencidos } from "./campana.js";
import { totales as totalesGym } from "./gym/gym.js";
import { kmTotales } from "./running/running.js";

// Años que tienen algo que contar: desde el año en que creaste el personaje hasta el actual (el más nuevo primero).
export function aniosConDatos(estado, hoy) {
    const primero = Number(estado.personaje.creadoEn.slice(0, 4));
    const ultimo = Number(hoy.slice(0, 4));
    const anios = [];
    for (let a = ultimo; a >= primero; a--) anios.push(a);
    return anios;
}

// La racha más larga de días seguidos con al menos 1 misión hecha, dentro de ese año.
// (Es más estricta que la racha del juego: aquí no cuentan escudos ni días libres.)
export function mejorRachaDelAnio(estado, anio, hoy) {
    const hechas = hechasPorFecha(estado.completadas);
    const fin = `${anio}-12-31` < hoy ? `${anio}-12-31` : hoy;
    let mejor = { dias: 0, desde: null, hasta: null };
    let actual = { dias: 0, desde: null };
    for (let fecha = `${anio}-01-01`; fecha <= fin; fecha = sumarDias(fecha, 1)) {
        if (hechas.has(fecha)) {
            if (actual.dias === 0) actual.desde = fecha;
            actual.dias += 1;
            if (actual.dias > mejor.dias) mejor = { dias: actual.dias, desde: actual.desde, hasta: fecha };
        } else {
            actual = { dias: 0, desde: null };
        }
    }
    return mejor;
}

export function resumenAnual(estado, anio, hoy) {
    const prefijo = `${anio}-`;
    const delAnio = (fecha) => Boolean(fecha) && fecha.startsWith(prefijo);

    // Misiones: total, XP y cuántas por mes.
    const completadas = estado.completadas.filter((c) => delAnio(c.fecha));
    const porMes = Array.from({ length: 12 }, () => 0);
    for (const c of completadas) porMes[Number(c.fecha.slice(5, 7)) - 1] += 1;
    const maximo = Math.max(...porMes);
    const mejorMes = maximo > 0 ? porMes.indexOf(maximo) : null;

    // Días perfectos: solo de los días que ya pasaron (y desde que existe el personaje).
    const hechas = hechasPorFecha(estado.completadas);
    const fin = `${anio}-12-31` < hoy ? `${anio}-12-31` : hoy;
    let perfectos = 0;
    let diasActivos = 0;
    for (let fecha = `${anio}-01-01`; fecha <= fin; fecha = sumarDias(fecha, 1)) {
        if (fecha < estado.personaje.creadoEn) continue;
        if (hechas.has(fecha)) diasActivos += 1;
        if (esDiaPerfecto(estado.misiones, fecha, hechas)) perfectos += 1;
    }

    // Gym y running: filtrados por año con las mismas reglas que usa el resto de la app.
    const sesiones = estado.gym.sesiones.filter((s) => delAnio(s.fecha));
    const gym = totalesGym(sesiones);
    const carreras = estado.running.carreras.filter((c) => delAnio(c.fecha));
    const masLarga = carreras.reduce((m, c) => (!m || c.km > m.km ? c : m), null);

    const enfoque = estado.enfoque.sesiones.filter((s) => delAnio(s.fecha));

    return {
        anio,
        misiones: completadas.length,
        xp: completadas.reduce((suma, c) => suma + c.xp, 0),
        porMes,
        mejorMes,
        perfectos,
        diasActivos,
        racha: mejorRachaDelAnio(estado, anio, hoy),
        gym,
        running: { carreras: carreras.length, km: Math.round(kmTotales(carreras) * 10) / 10, masLarga: masLarga ? masLarga.km : 0 },
        enfoque: { sesiones: enfoque.length, minutos: enfoque.reduce((suma, s) => suma + s.minutos, 0) },
        tareas: estado.tareas.filter((t) => delAnio(t.hechaEn)).length,
        diario: Object.keys(estado.diario).filter(delAnio).length,
        jefesHastaHoy: jefesVencidos(estado),   // sin fecha: son los de toda la partida
    };
}
