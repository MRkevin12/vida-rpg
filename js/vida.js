// vida.js — La vida (salud) del héroe.
//
// Tu héroe tiene vida, como en un juego de rol:
//   - Al terminar cada día PIERDES vida por lo que tocaba y no hiciste: las misiones
//     de ese día, las tareas que vencieron y (el domingo) las metas semanales sin cumplir.
//     Cada misión fallada es un GOLPE del jefe de su categoría, que se queda con la vida
//     que te quitó (te la «roba»: ver robosDeJefes y campana.js).
//   - Tu ARMADURA (ver equipo.js) cambia ese daño: llena te protege; gastada, te duele más.
//     Cada misión fallada la desgasta y cada misión cumplida la repara.
//   - RECUPERAS vida cada vez que cumples algo, y un poco más en un día perfecto.
//   - Con 80 % o más estás «En plena forma»: ganas 10 % más de XP y monedas.
//   - Si llega a 0, CAES en combate: la tienda y el arcade se cierran hasta que
//     recuperes la mitad (mientras tanto solo se venden pociones).
//
// Igual que la racha, la vida (y la armadura) NO se guardan: se CALCULAN simulando día por
// día desde estado.vida.desde. Así nunca se desordenan, y si marcas algo de ayer recuperas esa vida.
// Lo único que se apunta de la armadura es cuál era tu MÁXIMA cada día (estado.armadura.cambios):
// así, ponerte un casco hoy no cambia lo que pasó ayer.
// Solo se guardan las pociones que tomaste y tus días de descanso.
//
// Como juego.js, este archivo no dibuja ni guarda nada: solo calcula.

import * as juego from "./juego.js";
import { curaDeExploracion } from "./mascota.js";   // (v103)
import { eventoDelDia, factorPremio, factorCura } from "./eventos.js";
import { sumarDias, diaDeSemana, lunesDe } from "./fechas.js";
import { ARMADURA, armaduraMaxima, factorArmadura } from "./equipo.js";


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
    diario: 2,            // escribir el diario (cuidarte también cura)
    comidaDragon: 3,      // alimentar a tu dragón (ver mascota.js)
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
        fallas: porFecha(estado.fallas || [], (f) => f.fecha),
    };
}

// Cuánta vida recuperaste con lo que hiciste ese día.
function curacionDelDia(estado, fecha, mapas) {
    const del = (lista) => mapas[lista].get(fecha) || [];
    let cumplido = 0;   // lo que curan las misiones y tareas (las «Aguas termales» lo duplican)
    for (const c of del("completadas")) cumplido += CURA[c.dificultad] ?? CURA.normal;
    for (const t of del("tareasHechas")) cumplido += CURA[t.premio?.dificultad || t.dificultad] ?? CURA.normal;
    let cura = cumplido * factorCura(eventoDelDia(fecha, estado));
    cura += del("enfoque").length * VIDA.enfoque;
    cura += del("pasos").length * VIDA.paso;
    cura += del("pociones").length * POCION.cura;
    if (juego.esDiaPerfecto(estado.misiones, fecha, mapas.hechas)) cura += VIDA.diaPerfecto;
    if (estado.diario[fecha]) cura += VIDA.diario;
    if (estado.cofres?.[fecha]?.tipo === "pocion") cura += estado.cofres[fecha].cantidad;   // la poción del cofre
    cura += (estado.mascota?.comidas || []).filter((f) => f === fecha).length * VIDA.comidaDragon;
    cura += curaDeExploracion(estado, fecha);   // (v103) las hierbas que trajo tu mascota al explorar
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

// Cuánto se repara tu armadura con lo que cumpliste ese día.
function reparacionDelDia(estado, fecha, mapas) {
    const del = (lista) => mapas[lista].get(fecha) || [];
    let reparacion = 0;
    for (const c of del("completadas")) reparacion += ARMADURA.reparacion[c.dificultad] ?? ARMADURA.reparacion.normal;
    for (const t of del("tareasHechas")) reparacion += ARMADURA.reparacion[t.premio?.dificultad || t.dificultad] ?? ARMADURA.reparacion.normal;
    if (juego.esDiaPerfecto(estado.misiones, fecha, mapas.hechas)) reparacion += ARMADURA.diaPerfecto;
    return reparacion;
}

// Las misiones que fallaste ese día, en orden: primero las que marcaste con «Fallé» y, si el
// día ya terminó, las que quedaron sin hacer y (el domingo) cada vez que te faltó una meta semanal.
function fallosDelDia(estado, fecha, mapas, terminado) {
    const fallos = [];
    const hechas = mapas.hechas.get(fecha) || new Set();
    const contadas = new Set();
    for (const falla of mapas.fallas.get(fecha) || []) {
        const mision = estado.misiones.find((m) => m.id === falla.misionId);
        if (!mision || hechas.has(mision.id) || contadas.has(mision.id) || !juego.tocaEseDia(mision, fecha)) continue;
        contadas.add(mision.id);
        // "golpe": lo que te pegó cuando la marcaste (queda apuntado, ver acciones.fallarMision).
        fallos.push({ mision, fallada: true, golpe: falla.golpe });
    }
    if (!terminado) return fallos;
    for (const mision of juego.misionesDelDia(estado.misiones, fecha)) {
        if (!hechas.has(mision.id) && !contadas.has(mision.id)) fallos.push({ mision, fallada: false });
    }
    if (diaDeSemana(fecha) === 6) {   // domingo: se cierra la semana
        for (const mision of estado.misiones.filter((m) => m.veces)) {
            const faltan = vecesQueFaltaron(estado, mision, fecha);
            for (let i = 0; i < faltan; i++) fallos.push({ mision, fallada: false, semanal: true });
        }
    }
    return fallos;
}

// Tareas que vencieron ese día sin hacer (no cuenta si la creaste ya vencida o si la hiciste a tiempo).
function tareasVencidas(mapas, fecha) {
    return (mapas.tareasVencen.get(fecha) || [])
        .filter((tarea) => !(tarea.creadaEn > fecha || (tarea.hechaEn && tarea.hechaEn <= fecha))).length;
}

// Recibir los golpes de un día. "sim" = { puntos, armadura } (se cambia aquí mismo).
// Cada misión fallada pega según su dificultad × lo que diga tu armadura, y la desgasta.
// Las tareas vencidas pegan aparte (la armadura no las cubre). Tope: 30 por día, y la vida no baja de 0.
// hayArmadura = false en los días de antes de la v24: el daño de siempre, sin desgaste y sin robo.
function recibirGolpes(sim, fallos, tareas, hayArmadura = true) {
    let total = 0;
    const golpes = [];
    for (const { mision, fallada, semanal, golpe } of fallos) {
        const base = DANO[mision.dificultad] ?? DANO.normal;
        // Si el golpe quedó apuntado al fallar, vale ese: lo que hagas después no lo cambia.
        const conArmadura = golpe ?? (hayArmadura ? Math.round(base * factorArmadura(sim.armadura)) : base);
        const dano = Math.max(0, Math.min(conArmadura, VIDA.danoMaximoDia - total, sim.puntos));
        sim.puntos -= dano;
        total += dano;
        if (hayArmadura) sim.armadura = Math.max(0, sim.armadura - (ARMADURA.desgaste[mision.dificultad] ?? ARMADURA.desgaste.normal));
        golpes.push({ misionId: mision.id, atributo: mision.atributo, base, conArmadura, dano, fallada,
                      semanal: Boolean(semanal), roba: hayArmadura });
    }
    const porTareas = Math.max(0, Math.min(tareas * VIDA.tareaVencida, VIDA.danoMaximoDia - total, sim.puntos));
    sim.puntos -= porTareas;
    total += porTareas;
    const faltas = {
        misiones: golpes.filter((g) => !g.semanal).length,
        tareas,
        semanales: golpes.filter((g) => g.semanal).length,
    };
    return { dano: total, golpes, faltas };
}

// Lo que perderías un día si no hicieras nada de lo que falta (con la armadura que le pases;
// si no, con la máxima). Lo usan los avisos para los próximos días.
// Devuelve { dano, faltas: { misiones, tareas, semanales }, descanso }.
export function danoDelDia(estado, fecha, armadura = armaduraMaxima(estado), mapas = prepararMapas(estado)) {
    if (juego.enDescanso(estado, fecha)) return { dano: 0, faltas: { misiones: 0, tareas: 0, semanales: 0 }, descanso: true };
    const sim = { puntos: Infinity, armadura };
    const { dano, faltas } = recibirGolpes(sim, fallosDelDia(estado, fecha, mapas, true), tareasVencidas(mapas, fecha));
    return { dano, faltas, descanso: false };
}

// La vida de hoy, simulando día por día desde que empezó a contar (estado.vida.desde).
// Cada día: 1) se suma lo que curaste, 2) recibes los golpes de lo que fallaste (con la armadura
// que traías) y 3) la armadura se repara con lo que cumpliste.
// Hoy solo se cobra lo que marcaste con «Fallé»: el resto, cuando el día termine.
export function calcularVida(estado, hoy) {
    const maxima = vidaMaxima(estado);
    const armaduraMax = armaduraMaxima(estado);              // la de ahora (con lo que llevas puesto)
    const levantarse = Math.ceil(maxima * VIDA.levantarse);
    const mapas = prepararMapas(estado);
    // La armadura máxima de cada día pasado sale de los apuntes [{ fecha, maxima }] (en orden);
    // antes del primero vale la del primero y, si no hay ninguno, la de ahora.
    const cambios = estado.armadura?.cambios || [];
    const armaduraDesde = estado.armadura?.desde || "";      // antes de ese día no había armadura ni robos
    let siguiente = 0;                                       // el próximo apunte por aplicar
    let maximaDia = cambios.length ? cambios[0].maxima : armaduraMax;
    const sim = { puntos: maxima, armadura: null };          // empiezas con todo lleno
    let caido = false;
    let cayoEn = null;
    let pendienteHoy = 0;
    const registro = [];   // qué pasó cada día: { fecha, cura, dano, puntos, armadura, golpes, cayo, levanto, faltas }

    for (let fecha = estado.vida.desde || hoy; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
        // ¿Cambió tu armadura máxima ese día? Un objeto nuevo llega entero (suma lo suyo);
        // si te quitas uno, lo que tengas no puede pasar del nuevo máximo.
        const maximaAyer = maximaDia;
        while (siguiente < cambios.length && cambios[siguiente].fecha <= fecha) {
            maximaDia = cambios[siguiente].maxima;
            siguiente += 1;
        }
        if (fecha >= hoy) maximaDia = armaduraMax;           // hoy siempre vale la de ahora
        if (sim.armadura === null) sim.armadura = maximaDia;
        else sim.armadura = Math.min(maximaDia, sim.armadura + Math.max(0, maximaDia - maximaAyer));

        const antes = sim.puntos;
        sim.puntos = Math.min(maxima, sim.puntos + curacionDelDia(estado, fecha, mapas));
        const cura = sim.puntos - antes;
        let levanto = false;
        if (caido && sim.puntos >= levantarse) {
            caido = false;
            levanto = true;
        }

        let resultado = { dano: 0, golpes: [], faltas: null };
        if (!juego.enDescanso(estado, fecha)) {
            const terminado = fecha < hoy;
            const hayArmadura = fecha >= armaduraDesde;
            // «Si no terminas hoy»: cuánto perderías si el día terminara ahora mismo (en una copia).
            const todo = fecha === hoy
                ? recibirGolpes({ ...sim }, fallosDelDia(estado, fecha, mapas, true), tareasVencidas(mapas, fecha), hayArmadura)
                : null;
            resultado = recibirGolpes(sim, fallosDelDia(estado, fecha, mapas, terminado), terminado ? tareasVencidas(mapas, fecha) : 0, hayArmadura);
            // Primero se cobran las mismas «Fallé», así que la diferencia es lo que falta.
            if (todo) pendienteHoy = todo.dano - resultado.dano;
        }
        let cayo = false;
        if (resultado.dano && sim.puntos === 0 && !caido) {
            caido = true;
            cayoEn = fecha;
            cayo = true;
        }
        if (fecha >= armaduraDesde) sim.armadura = Math.min(maximaDia, sim.armadura + reparacionDelDia(estado, fecha, mapas));
        registro.push({
            fecha, cura, dano: resultado.dano, puntos: sim.puntos, armadura: sim.armadura,
            golpes: resultado.golpes, cayo, levanto, faltas: resultado.dano ? resultado.faltas : null,
        });
    }

    let nivel = "bien";
    if (caido) nivel = "caido";
    else if (sim.puntos >= maxima * VIDA.forma) nivel = "forma";
    else if (sim.puntos < maxima * VIDA.herido) nivel = "herido";

    return {
        puntos: sim.puntos,
        maxima,
        porcentaje: Math.round((sim.puntos / maxima) * 100),
        nivel,                       // "forma" | "bien" | "herido" | "caido"
        enForma: nivel === "forma",
        caido,
        cayoEn,
        levantarse,                  // la vida que necesitas para levantarte si caíste
        pocionesHoy: (mapas.pociones.get(hoy) || []).length,
        pendienteHoy,                // lo que perderías si hoy terminara ahora
        armadura: {
            puntos: sim.armadura,
            maxima: armaduraMax,
            factor: factorArmadura(sim.armadura),   // cuánto se multiplica el daño de una misión fallada
        },
        registro,
    };
}

// La vida que te robó cada jefe: una entrada por misión fallada que te quitó vida.
// [{ fecha, atributo, cantidad }] (campana.js se la suma a la vida del jefe de esa categoría).
export function robosDeJefes(estado, hoy, vida = calcularVida(estado, hoy)) {
    return vida.registro.flatMap((dia) => dia.golpes
        .filter((g) => g.roba && g.dano > 0)
        .map((g) => ({ fecha: dia.fecha, atributo: g.atributo, cantidad: g.dano })));
}

// XP y monedas por cumplir algo de esa dificultad: con +10 % si estás en plena forma.
// También suman el evento del día (ver eventos.js) y, si es tu misión clave, el doble (ver rituales.js).
export function premio(estado, dificultad, hoy, { atributo = null, clave = false } = {}) {
    const base = juego.DIFICULTADES[dificultad];
    const forma = calcularVida(estado, hoy).enForma;
    const evento = factorPremio(eventoDelDia(hoy, estado), { dificultad, atributo });
    const factor = (forma ? 1 + VIDA.bonoForma : 1) * (clave ? 2 : 1);
    return {
        xp: Math.round(base.xp * factor * evento.xp),
        monedas: Math.round(base.monedas * factor * evento.monedas),
        forma,
    };
}

// En la Torre empiezas con la misma proporción de vida que tienes en la vida real.
export function proporcionTorre(vida) {
    return Math.max(VIDA.torreMinima, vida.puntos / vida.maxima);
}
