// vida.js — La vida (salud) del héroe.
//
// Tu héroe tiene vida, como en un juego de rol:
//   - Al terminar cada día PIERDES vida por lo que tocaba y no hiciste: las misiones
//     de ese día, las tareas que vencieron y (el domingo) las metas semanales sin cumplir.
//   - RECUPERAS vida cada vez que cumples algo, y un poco más en un día perfecto.
//   - Con 80 % o más estás «En plena forma»: ganas 10 % más de XP y monedas.
//   - Si llega a 0, CAES en combate: la tienda y el arcade se cierran hasta que
//     recuperes la mitad (mientras tanto solo se venden pociones).
//
// Igual que la racha, la vida NO se guarda: se CALCULA simulando día por día desde
// estado.vida.desde. Así nunca se desordena, y si marcas algo de ayer recuperas esa vida.
// Solo se guardan las pociones que tomaste y tus días de descanso.
//
// Como juego.js, este archivo no dibuja ni guarda nada: solo calcula.

import * as juego from "./juego.js";
import { sumarDias, diaDeSemana, lunesDe } from "./fechas.js";


// ===== Números del balance =====

// Daño por cada misión que tocaba y no hiciste, según su dificultad.
export const DANO = { facil: 5, normal: 8, dificil: 12 };

// Vida que recuperas por cada misión o tarea cumplida, según su dificultad.
export const CURA = { facil: 2, normal: 4, dificil: 6 };

export const VIDA = {
    base: 100,            // vida máxima = 100 + 5 por cada nivel del personaje
    porNivel: 5,
    danoMaximoDia: 30,    // un solo día malo no te puede quitar más que esto
    tareaVencida: 5,      // una tarea que vence sin hacer (se cobra una sola vez)
    enfoque: 3,           // cada sesión de enfoque terminada
    paso: 4,              // cada paso de una misión principal
    diaPerfecto: 10,      // extra por hacer TODAS las misiones del día
    forma: 0.8,           // desde 80 %: «En plena forma»
    bonoForma: 0.1,       // …que da +10 % de XP y monedas
    herido: 0.3,          // menos de 30 %: herido
    levantarse: 0.5,      // si caíste, te levantas al recuperar la mitad
    torreMinima: 0.3,     // en la Torre empiezas con tu vida real (mínimo 30 %)
    descansoMaximo: 30,   // un descanso dura como mucho 30 días
};

// La poción de la tienda: se puede tomar una al día.
export const POCION = { cura: 25, precio: 40, porDia: 1 };

// Cómo se ve cada estado de la vida.
export const ESTADOS = {
    forma:  { icono: "✨", nombre: "En plena forma", texto: "+10 % de XP y monedas" },
    bien:   { icono: "❤️", nombre: "Bien", texto: "Llega a 80 % para estar en plena forma" },
    herido: { icono: "🤕", nombre: "Herido", texto: "Cumple misiones para curarte" },
    caido:  { icono: "☠️", nombre: "Caído en combate", texto: "Tienda y arcade cerrados" },
};


// ===== Cálculos =====

// La vida máxima crece con tu nivel.
export function vidaMaxima(estado) {
    return VIDA.base + VIDA.porNivel * juego.calcularNivel(estado.personaje.xp).nivel;
}

// Agrupa por fecha todo lo que cura o hace daño, para no recorrer las listas
// completas en cada día de la simulación. Ej: tareasVencen = Map { "2026-10-12" => [tarea, …] }
function prepararMapas(estado) {
    function porFecha(lista, fechaDe) {
        const mapa = new Map();
        for (const elemento of lista) {
            const fecha = fechaDe(elemento);
            if (!fecha) continue;
            if (!mapa.has(fecha)) mapa.set(fecha, []);
            mapa.get(fecha).push(elemento);
        }
        return mapa;
    }
    return {
        hechas: juego.hechasPorFecha(estado.completadas),
        completadas: porFecha(estado.completadas, (c) => c.fecha),
        tareasHechas: porFecha(estado.tareas, (t) => t.hechaEn),
        tareasVencen: porFecha(estado.tareas, (t) => t.fecha),
        enfoque: porFecha(estado.enfoque.sesiones, (s) => s.fecha),
        pasos: porFecha(estado.principales.flatMap((p) => p.submisiones), (s) => s.hecha && s.hechaEn),
        pociones: porFecha(estado.vida.pociones, (fecha) => fecha),
    };
}

// Cuánta vida recuperaste con lo que hiciste ese día.
function curacionDelDia(estado, fecha, mapas) {
    const del = (lista) => mapas[lista].get(fecha) || [];
    let cura = 0;
    for (const c of del("completadas")) cura += CURA[c.dificultad] ?? CURA.normal;
    for (const t of del("tareasHechas")) cura += CURA[t.premio?.dificultad || t.dificultad] ?? CURA.normal;
    cura += del("enfoque").length * VIDA.enfoque;
    cura += del("pasos").length * VIDA.paso;
    cura += del("pociones").length * POCION.cura;
    if (juego.esDiaPerfecto(estado.misiones, fecha, mapas.hechas)) cura += VIDA.diaPerfecto;
    return cura;
}

// Metas «N veces por semana»: cuántas veces te faltaron al cerrar la semana (el domingo).
// Si la misión no estuvo activa toda la semana (la creaste el jueves, estuviste de
// descanso…), solo se pide la parte proporcional.
function vecesQueFaltaron(estado, mision, domingo) {
    const lunes = lunesDe(domingo);
    const desde = estado.vida.desde || "";
    let diasActivos = 0;
    for (let i = 0; i < 7; i++) {
        const fecha = sumarDias(lunes, i);
        if (fecha >= desde && juego.estaActiva(mision, fecha) && !juego.enDescanso(estado, fecha)) diasActivos += 1;
    }
    const pedidas = Math.round((mision.veces * diasActivos) / 7);
    return Math.max(0, pedidas - juego.vecesEnSemana(estado.completadas, mision.id, domingo));
}

// El daño de un día: lo que tocaba y no hiciste (con el tope de 30).
// También sirve para HOY: «si no terminas, esto es lo que perderías».
// Devuelve { dano, faltas: { misiones, tareas, semanales }, descanso }.
export function danoDelDia(estado, fecha, mapas = prepararMapas(estado)) {
    const faltas = { misiones: 0, tareas: 0, semanales: 0 };
    if (juego.enDescanso(estado, fecha)) return { dano: 0, faltas, descanso: true };

    let dano = 0;
    const hechas = mapas.hechas.get(fecha) || new Set();
    for (const mision of juego.misionesDelDia(estado.misiones, fecha)) {
        if (hechas.has(mision.id)) continue;
        dano += DANO[mision.dificultad];
        faltas.misiones += 1;
    }
    for (const tarea of mapas.tareasVencen.get(fecha) || []) {
        // No cuenta si la creaste ya vencida o si la hiciste a tiempo.
        if (tarea.creadaEn > fecha || (tarea.hechaEn && tarea.hechaEn <= fecha)) continue;
        dano += VIDA.tareaVencida;
        faltas.tareas += 1;
    }
    if (diaDeSemana(fecha) === 6) {   // domingo: se cierra la semana
        for (const mision of estado.misiones.filter((m) => m.veces)) {
            const faltan = vecesQueFaltaron(estado, mision, fecha);
            dano += faltan * DANO[mision.dificultad];
            faltas.semanales += faltan;
        }
    }
    return { dano: Math.min(VIDA.danoMaximoDia, dano), faltas, descanso: false };
}

// La vida de hoy, simulando día por día desde que empezó a contar (estado.vida.desde).
// Cada día: primero se suma lo que curaste; al terminar el día, se resta el daño.
// Hoy solo suma (como la racha): el día todavía no termina.
export function calcularVida(estado, hoy) {
    const maxima = vidaMaxima(estado);
    const levantarse = Math.ceil(maxima * VIDA.levantarse);
    const mapas = prepararMapas(estado);
    let puntos = maxima;   // empiezas con la vida llena
    let caido = false;
    let cayoEn = null;
    const registro = [];   // qué pasó cada día: { fecha, cura, dano, puntos, cayo, levanto, faltas }

    for (let fecha = estado.vida.desde || hoy; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
        const antes = puntos;
        puntos = Math.min(maxima, puntos + curacionDelDia(estado, fecha, mapas));
        const cura = puntos - antes;
        let levanto = false;
        if (caido && puntos >= levantarse) {
            caido = false;
            levanto = true;
        }

        let dano = 0;
        let cayo = false;
        let faltas = null;
        if (fecha < hoy) {
            const resultado = danoDelDia(estado, fecha, mapas);
            faltas = resultado.faltas;
            dano = Math.min(puntos, resultado.dano);   // la vida no baja de 0
            puntos -= dano;
            if (puntos === 0 && !caido) {
                caido = true;
                cayoEn = fecha;
                cayo = true;
            }
        }
        registro.push({ fecha, cura, dano, puntos, cayo, levanto, faltas });
    }

    let nivel = "bien";
    if (caido) nivel = "caido";
    else if (puntos >= maxima * VIDA.forma) nivel = "forma";
    else if (puntos < maxima * VIDA.herido) nivel = "herido";

    return {
        puntos,
        maxima,
        porcentaje: Math.round((puntos / maxima) * 100),
        nivel,                       // "forma" | "bien" | "herido" | "caido"
        enForma: nivel === "forma",
        caido,
        cayoEn,
        levantarse,                  // la vida que necesitas para levantarte si caíste
        pocionesHoy: (mapas.pociones.get(hoy) || []).length,
        registro,
    };
}

// XP y monedas por cumplir algo de esa dificultad: con +10 % si estás en plena forma.
export function premio(estado, dificultad, hoy) {
    const { xp, monedas } = juego.DIFICULTADES[dificultad];
    if (!calcularVida(estado, hoy).enForma) return { xp, monedas, forma: false };
    const extra = 1 + VIDA.bonoForma;
    return { xp: Math.round(xp * extra), monedas: Math.round(monedas * extra), forma: true };
}

// En la Torre empiezas con la misma proporción de vida que tienes en la vida real.
export function proporcionTorre(vida) {
    return Math.max(VIDA.torreMinima, vida.puntos / vida.maxima);
}
