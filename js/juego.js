// juego.js — Las reglas del juego.
//
// Este archivo NO toca la pantalla ni guarda nada: solo tiene números
// (cuánta XP da cada cosa) y funciones que calculan resultados.
// Si quieres cambiar el balance del juego, este es el lugar.

import { sumarDias, diaDeSemana, lunesDe } from "./fechas.js";
import { totalDerrotados } from "./campana.js";


// ===== Recompensas =====

// Cada misión diaria da XP y monedas según su dificultad.
export const DIFICULTADES = {
    facil:   { nombre: "Fácil",   xp: 10, monedas: 5 },
    normal:  { nombre: "Normal",  xp: 25, monedas: 10 },
    dificil: { nombre: "Difícil", xp: 50, monedas: 20 },
};

// Los 4 atributos del personaje. Cada misión sube uno de ellos.
export const ATRIBUTOS = {
    fuerza:    { nombre: "Fuerza",    icono: "💪", color: "#fb7185" },
    intelecto: { nombre: "Intelecto", icono: "🧠", color: "#22d3ee" },
    carisma:   { nombre: "Carisma",   icono: "💬", color: "#c084fc" },
    riqueza:   { nombre: "Riqueza",   icono: "💰", color: "#fbbf24" },
};

// Premios de las misiones principales. (Los jefes y su daño están en campana.js.)
export const PREMIOS = {
    submision: { xp: 30,  monedas: 15 },  // cada paso de una misión principal
    principal: { xp: 150, monedas: 75 },  // extra al terminar todos los pasos
};

// Rachas: cada 7 días seguidos ganas un escudo (puedes tener hasta 3).
export const ESCUDOS = { diasParaGanar: 7, maximo: 3 };

// Bonus de regreso: si vuelves tras 3 días o más, ganas 15 XP por día (máximo 150).
export const REGRESO = { diasMinimos: 3, xpPorDia: 15, xpMaximo: 150 };

// XP base de los niveles: pasar del nivel N al N+1 cuesta BASE × N.
export const BASE_PERSONAJE = 100; // personaje: 100, 200, 300...
export const BASE_ATRIBUTO = 50;   // atributos:  50, 100, 150...

// Modo enfoque: cada duración (en minutos) vale lo mismo que una misión de esa
// dificultad: la misma XP, las mismas monedas y el mismo daño al jefe.
export const ENFOQUE = { 15: "facil", 25: "normal", 50: "dificil" };

// Momento del día de una misión (opcional): en Hoy se agrupan así.
export const MOMENTOS = {
    manana: { icono: "🌅", nombre: "Mañana" },
    tarde:  { icono: "☀️", nombre: "Tarde" },
    noche:  { icono: "🌙", nombre: "Noche" },
};

// Cuando marcas que fallaste una misión, dices por qué (estado.fallas = [{ misionId, fecha, motivo }]).
// "relato" es cómo lo cuenta el libro de tu historia (ver libro.js).
export const MOTIVOS_FALLA = {
    tiempo:     { icono: "⏳", nombre: "No tuve tiempo",   relato: "le faltó tiempo" },
    olvido:     { icono: "🫥", nombre: "Se me olvidó",     relato: "se le olvidó" },
    ganas:      { icono: "🛋️", nombre: "No tuve ganas",    relato: "no tuvo ganas, y tuvo la honestidad de admitirlo" },
    energia:    { icono: "🔋", nombre: "Me faltó energía", relato: "le faltó energía" },
    imprevisto: { icono: "🌩️", nombre: "Surgió algo",      relato: "surgió algo que no estaba en sus planes" },
    otro:       { icono: "❔", nombre: "Otra razón",       relato: "por razones que no quedaron escritas" },
};

// ¿Marcaste que fallaste esa misión ese día?
export function fallaDe(estado, misionId, fecha) {
    return (estado.fallas || []).find((f) => f.misionId === misionId && f.fecha === fecha) || null;
}

// Diario: cómo te fue el día. "valor" sirve para sacar promedios (5 = genial … 1 = terrible)
// y "color" para el calendario de ánimo. (Ver también diario.js.)
export const ANIMOS_DIARIO = {
    genial:   { icono: "🤩", nombre: "Genial",   valor: 5, color: "#34d399" },
    bien:     { icono: "😀", nombre: "Bien",     valor: 4, color: "#a3e635" },
    normal:   { icono: "😐", nombre: "Normal",   valor: 3, color: "#fbbf24" },
    mal:      { icono: "😞", nombre: "Mal",      valor: 2, color: "#f97316" },
    terrible: { icono: "😫", nombre: "Terrible", valor: 1, color: "#fb7185" },
};

// Tipos de condición para los logros personalizados.
// "campo" indica si el logro necesita elegir además una misión o un atributo.
// "manual" es un logro de la vida real: no se cumple solo, lo marcas tú.
export const TIPOS_LOGRO = {
    manual:      { texto: "Logro personal (lo marco yo cuando lo consiga)", campo: "manual" },
    mision:      { texto: "Completar una misión diaria N veces", campo: "mision" },
    total:       { texto: "Completar N misiones diarias en total" },
    racha:       { texto: "Lograr una racha de N días" },
    perfectos:   { texto: "Tener N días perfectos" },
    nivel:       { texto: "Llegar al nivel N" },
    atributo:    { texto: "Subir un atributo al nivel N", campo: "atributo" },
    principales: { texto: "Completar N misiones principales" },
    jefes:       { texto: "Derrotar N jefes" },
    diario:      { texto: "Escribir en tu diario N días" },
};


// ===== Niveles =====

// A partir de la XP total calcula el nivel y el progreso dentro de ese nivel.
// Funciona como subir escaleras: vamos "gastando" la XP en cada escalón
// hasta que ya no alcanza para el siguiente.
export function calcularNivel(xpTotal, base = BASE_PERSONAJE) {
    let nivel = 1;
    let restante = xpTotal;
    while (restante >= base * nivel) {
        restante -= base * nivel;
        nivel += 1;
    }
    const necesaria = base * nivel;
    return {
        nivel,
        xpEnNivel: restante,     // XP que llevas dentro del nivel actual
        xpNecesaria: necesaria,  // XP que pide el nivel actual
        porcentaje: Math.round((restante / necesaria) * 1000) / 10,
    };
}


// ===== Atributos propios =====
// Además de los 4 atributos, puedes crear los tuyos para cosas específicas
// (Programación, Inglés, Salud…): estado.atributosPropios = [{ id, nombre, icono, color, base, creadoEn }].
// Cada uno va "colgado" de uno de los 4 (su base): su XP también sube la base. Así el avatar,
// la clase, los jefes y la Torre siguen funcionando igual. Su nivel se CALCULA del historial.

export const MAX_ATRIBUTOS_PROPIOS = 12;
export const COLORES_PROPIOS = ["#fb7185", "#f97316", "#fbbf24", "#a3e635", "#34d399", "#22d3ee", "#60a5fa", "#c084fc"];

// En los formularios, un atributo propio se elige con el valor "propio:5" (5 = su id).
const PREFIJO_PROPIO = "propio:";

export function clavePropio(id) {
    return `${PREFIJO_PROPIO}${id}`;
}

// "propio:5" → 5; "fuerza" → null.
export function idDePropio(clave) {
    const texto = String(clave || "");
    return texto.startsWith(PREFIJO_PROPIO) ? Number(texto.slice(PREFIJO_PROPIO.length)) : null;
}

export function buscarPropio(estado, id) {
    return id ? (estado.atributosPropios || []).find((a) => a.id === id) || null : null;
}

// Cómo se muestra el atributo de algo (una misión, una tarea…): el propio si tiene uno; si no, el base.
export function infoAtributo(estado, base, propioId) {
    const propio = buscarPropio(estado, propioId);
    return propio ? { icono: propio.icono, nombre: propio.nombre, color: propio.color } : ATRIBUTOS[base];
}

// La XP de un atributo propio: lo que diste con él (misiones, tareas, enfoque y misiones principales).
export function xpDePropio(estado, id) {
    let xp = 0;
    for (const c of estado.completadas) if (c.atributoPropio === id) xp += c.xp;
    for (const t of estado.tareas) if (t.premio?.atributoPropio === id) xp += t.premio.xp;
    for (const s of estado.enfoque.sesiones) if (s.atributoPropio === id) xp += s.xp;
    for (const p of estado.principales) {
        if (p.atributoPropio !== id) continue;
        xp += p.submisiones.filter((s) => s.hecha).length * PREMIOS.submision.xp;
        if (p.completadaEn) xp += PREMIOS.principal.xp;
    }
    return xp;
}

export function nivelDePropio(estado, id) {
    return calcularNivel(xpDePropio(estado, id), BASE_ATRIBUTO);
}


// ===== Calendario y rachas =====

// Cuenta cuántas misiones se completaron cada día: Map { "2026-10-12" => 3, ... }
export function contarPorFecha(completadas) {
    const conteo = new Map();
    for (const c of completadas) {
        conteo.set(c.fecha, (conteo.get(c.fecha) || 0) + 1);
    }
    return conteo;
}

// Qué misiones completaste cada día: Map { "2026-10-12" => Set { 1, 4 }, ... }
export function hechasPorFecha(completadas) {
    const mapa = new Map();
    for (const c of completadas) {
        if (!mapa.has(c.fecha)) mapa.set(c.fecha, new Set());
        mapa.get(c.fecha).add(c.misionId);
    }
    return mapa;
}

// ¿La misión existía ese día y no estaba archivada ni en pausa?
// mision.pausas: temporadas en que estuvo archivada: [{ desde, hasta }].
export function estaActiva(mision, fecha) {
    if (mision.creadaEn > fecha) return false;                             // todavía no existía
    if (mision.archivadaEn && mision.archivadaEn <= fecha) return false;   // ya estaba archivada
    return !(mision.pausas || []).some((p) => p.desde <= fecha && fecha < p.hasta);
}

// ¿Se podía marcar ese día?
// mision.dias: lista de días de la semana (0 = lunes … 6 = domingo), o null = todos.
// Las misiones «N veces por semana» (mision.veces) se pueden marcar cualquier día.
export function sePuedeMarcar(mision, fecha, diaSemana = diaDeSemana(fecha)) {
    if (!estaActiva(mision, fecha)) return false;
    return !mision.dias || mision.dias.includes(diaSemana);
}

// ¿Le TOCABA ese día? Es decir: si no la hacías, contaba como fallada.
// Las semanales nunca "tocan" un día concreto (tú eliges cuándo), así que no
// cuentan para la racha, los días perfectos ni el calendario.
export function tocaEseDia(mision, fecha, diaSemana = diaDeSemana(fecha)) {
    return !mision.veces && sePuedeMarcar(mision, fecha, diaSemana);
}

// Modo descanso (vacaciones, días enfermo): estado.descansos = [{ desde, hasta }] (los dos días incluidos).
// Esos días no pierdes vida ni se rompe tu racha, aunque no hagas nada.
export function descansoDe(estado, fecha) {
    return (estado.descansos || []).find((d) => d.desde <= fecha && fecha <= d.hasta) || null;
}

export function enDescanso(estado, fecha) {
    return Boolean(descansoDe(estado, fecha));
}

// Las misiones que tocaban ese día.
export function misionesDelDia(misiones, fecha) {
    const diaSemana = diaDeSemana(fecha);
    return misiones.filter((m) => tocaEseDia(m, fecha, diaSemana));
}

// Las misiones «N veces por semana» que se podían marcar ese día.
export function semanalesDelDia(misiones, fecha) {
    return misiones.filter((m) => m.veces && estaActiva(m, fecha));
}

// Cuántas veces completaste una misión en la semana (de lunes a domingo) de esa fecha.
export function vecesEnSemana(completadas, misionId, fecha) {
    const lunes = lunesDe(fecha);
    const domingo = sumarDias(lunes, 6);
    return completadas.filter((c) => c.misionId === misionId && c.fecha >= lunes && c.fecha <= domingo).length;
}

// Misiones con cantidad (mision.meta = { cantidad, unidad }): cuánto llevas ese día.
// El avance se guarda en estado.avances con la clave "id|fecha" (ej: "5|2026-10-12": 3).
export function cantidadDe(estado, mision, fecha) {
    const meta = mision.meta.cantidad;
    const hecha = estado.completadas.some((c) => c.misionId === mision.id && c.fecha === fecha);
    return hecha ? meta : Math.min(estado.avances[`${mision.id}|${fecha}`] || 0, meta);
}

// Agrupa misiones por momento del día (mañana, tarde, noche y "cualquier momento" al final),
// respetando el orden que tú les diste. Solo devuelve los grupos que tienen misiones.
export function agruparPorMomento(misiones) {
    const grupos = [...Object.entries(MOMENTOS), [null, { icono: "🕐", nombre: "Cualquier momento" }]]
        .map(([clave, m]) => ({ clave, ...m, misiones: misiones.filter((mision) => (mision.momento || null) === clave) }));
    return grupos.filter((g) => g.misiones.length);
}

// ===== Ficha de un hábito =====
// Racha, mejor racha, porcentaje de cumplimiento y un calendario de las últimas 12 semanas.
// Las misiones de días fijos se miden en días; las de «N veces por semana», en semanas.
export function estadisticasMision(estado, mision, hoy) {
    const registros = estado.completadas.filter((c) => c.misionId === mision.id);
    const hechas = new Set(registros.map((c) => c.fecha));
    const desde = mision.creadaEn;
    let racha = 0;
    let mejor = 0;
    let tocaron = 0;
    let cumplidas = 0;
    const hace30 = sumarDias(hoy, -29);

    if (mision.veces) {
        // Semana a semana: la racha son las semanas seguidas en que cumpliste las veces.
        for (let lunes = lunesDe(desde); lunes <= hoy; lunes = sumarDias(lunes, 7)) {
            const cumplida = vecesEnSemana(estado.completadas, mision.id, lunes) >= mision.veces;
            const enCurso = lunes === lunesDe(hoy);
            const conDescanso = [0, 1, 2, 3, 4, 5, 6].some((i) => enDescanso(estado, sumarDias(lunes, i)));
            if (cumplida) {
                racha += 1;
                mejor = Math.max(mejor, racha);
            } else if (!enCurso && !conDescanso) {
                racha = 0;              // la semana en curso (o con descanso) no rompe la racha
            }
            if (!enCurso && sumarDias(lunes, 6) >= hace30) {
                tocaron += 1;
                if (cumplida) cumplidas += 1;
            }
        }
    } else {
        for (let fecha = desde; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
            if (!tocaEseDia(mision, fecha)) continue;
            const hecha = hechas.has(fecha);
            if (!hecha && enDescanso(estado, fecha)) continue;   // de descanso: como si no tocara
            if (hecha) {
                racha += 1;
                mejor = Math.max(mejor, racha);
            } else if (fecha < hoy) {
                racha = 0;              // hoy todavía no termina: no rompe la racha
            }
            if (fecha >= hace30 && (fecha < hoy || hecha)) {
                tocaron += 1;
                if (hecha) cumplidas += 1;
            }
        }
    }

    // Calendario: 12 semanas, de lunes a domingo, terminando en esta semana.
    const inicio = sumarDias(lunesDe(hoy), -77);
    const dias = Array.from({ length: 84 }, (_, i) => {
        const fecha = sumarDias(inicio, i);
        let tipo;
        if (fecha > hoy) tipo = "futuro";
        else if (fecha < desde) tipo = "antes";
        else if (hechas.has(fecha)) tipo = "hecha";
        else if (!mision.veces && tocaEseDia(mision, fecha) && !enDescanso(estado, fecha)) tipo = fecha === hoy ? "pendiente" : "fallo";
        else tipo = "libre";
        return { fecha, tipo };
    });

    // Las veces que marcaste que fallaste, y el motivo que más se repite.
    const fallas = (estado.fallas || []).filter((f) => f.misionId === mision.id);
    const cuenta = {};
    for (const f of fallas) cuenta[f.motivo] = (cuenta[f.motivo] || 0) + 1;
    const motivoFrecuente = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a])[0] || null;

    return {
        total: registros.length,
        fallas: fallas.length,
        motivoFrecuente,
        xp: registros.reduce((suma, c) => suma + (c.xp || 0), 0),
        racha,
        mejor,
        unidad: mision.veces ? "semana" : "día",
        porcentaje: tocaron ? Math.round((cumplidas / tocaron) * 100) : null,
        dias,
    };
}

// Cuándo termina una sesión de enfoque (en milisegundos, como Date.now()).
export function finDelEnfoque(sesion) {
    return sesion.inicio + sesion.minutos * 60 * 1000;
}

// Cuántas misiones tocaban ese día. Si es 0, es día de descanso.
export function misionesActivasEn(misiones, fecha) {
    return misionesDelDia(misiones, fecha).length;
}

// Día perfecto: completaste TODAS las misiones que tocaban (y había al menos una).
export function esDiaPerfecto(misiones, fecha, hechas) {
    const programadas = misionesDelDia(misiones, fecha);
    const completadas = hechas.get(fecha);
    return programadas.length > 0 && Boolean(completadas) && programadas.every((m) => completadas.has(m.id));
}

// Calcula la racha "simulando" día por día desde que creaste el personaje.
// Un día cuenta para la racha si completaste al menos 1 misión.
// Así la racha nunca se desordena: siempre sale del historial.
export function calcularRacha(estado, hoy) {
    const conteo = contarPorFecha(estado.completadas);
    const protegidos = new Set(); // días salvados por un escudo
    let racha = 0;
    let mejor = 0;
    let escudos = 0;

    if (!estado.personaje) {
        return { actual: 0, mejor: 0, escudos: 0, protegidos };
    }

    function sumarUnDia() {
        racha += 1;
        mejor = Math.max(mejor, racha);
        if (racha % ESCUDOS.diasParaGanar === 0 && escudos < ESCUDOS.maximo) {
            escudos += 1;
        }
    }

    // Recorremos los días pasados (hasta ayer).
    for (let fecha = estado.personaje.creadoEn; fecha < hoy; fecha = sumarDias(fecha, 1)) {
        if (conteo.has(fecha)) {
            sumarUnDia();
        } else if (misionesActivasEn(estado.misiones, fecha) === 0 || enDescanso(estado, fecha)) {
            // Día libre (no tocaba ninguna misión) o en modo descanso: no suma ni rompe la racha.
        } else if (escudos > 0) {
            escudos -= 1;            // el escudo se gasta...
            protegidos.add(fecha);   // ...y la racha sigue viva
        } else {
            racha = 0;               // sin escudos, la racha se rompe
        }
    }

    // Hoy solo puede sumar: si todavía no haces nada, el día no ha terminado.
    if (conteo.has(hoy)) {
        sumarUnDia();
    }

    return { actual: racha, mejor, escudos, protegidos };
}

// Qué tan "encendido" se pinta un día en el mapa de calor (0 a 4).
export function nivelCalor(hechas, total) {
    if (hechas === 0) return 0;
    const proporcion = total > 0 ? hechas / total : 1;
    if (proporcion >= 1) return 4;      // día perfecto
    if (proporcion >= 0.66) return 3;
    if (proporcion >= 0.33) return 2;
    return 1;
}

// Prepara los datos del mapa de calor: 53 semanas (un año), de lunes a domingo.
export function datosCalendario(estado, hoy, racha, semanas = 53) {
    const hechasDia = hechasPorFecha(estado.completadas);
    const lunesDeEstaSemana = sumarDias(hoy, -diaDeSemana(hoy));
    const inicio = sumarDias(lunesDeEstaSemana, -(semanas - 1) * 7);
    const dias = [];

    for (let i = 0; i < semanas * 7; i++) {
        const fecha = sumarDias(inicio, i);
        if (fecha > hoy) {
            dias.push({ fecha, tipo: "futuro" });
        } else if (fecha < estado.personaje.creadoEn) {
            dias.push({ fecha, tipo: "antes" });
        } else {
            const { hechas, total } = cumplimientoDelDia(estado.misiones, fecha, hechasDia);
            let nivel = nivelCalor(hechas, total);
            // Hiciste algo aunque ese día no tocara nada (cambiaste los días después): se pinta suave.
            if (nivel === 0 && hechasDia.has(fecha)) nivel = 1;
            dias.push({ fecha, tipo: "dia", hechas, total, nivel, protegido: racha.protegidos.has(fecha), descanso: enDescanso(estado, fecha) });
        }
    }
    return { dias, semanas };
}

// De las misiones que tocaban ese día, cuántas completaste.
export function cumplimientoDelDia(misiones, fecha, hechasDia) {
    const programadas = misionesDelDia(misiones, fecha);
    const completadas = hechasDia.get(fecha);
    const hechas = completadas ? programadas.filter((m) => completadas.has(m.id)).length : 0;
    return { hechas, total: programadas.length };
}

// Resumen general que usan varias pantallas y los logros.
export function resumen(estado, hoy) {
    const hechasDia = hechasPorFecha(estado.completadas);
    let diasPerfectos = 0;

    if (estado.personaje) {
        for (let fecha = estado.personaje.creadoEn; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
            if (esDiaPerfecto(estado.misiones, fecha, hechasDia)) diasPerfectos += 1;
        }
    }

    return {
        racha: calcularRacha(estado, hoy),
        diasPerfectos,
        totalCompletadas: estado.completadas.length,
        principalesCompletadas: estado.principales.filter((p) => p.completadaEn).length,
        jefesDerrotados: totalDerrotados(estado),
    };
}


// ===== Bonus de regreso =====

// Bonus de regreso según los días que estuviste fuera.
export function bonoRegreso(dias) {
    return Math.min(dias * REGRESO.xpPorDia, REGRESO.xpMaximo);
}


// ===== Logros =====

// ¿Cuánto llevas de un logro? (se compara con logro.objetivo)
export function progresoLogro(logro, estado, info) {
    switch (logro.tipo) {
        case "manual":
            return logro.desbloqueadoEn ? 1 : 0; // solo cambia cuando tú lo marcas
        case "mision":
            return estado.completadas.filter((c) => c.misionId === logro.misionId).length;
        case "total":
            return info.totalCompletadas;
        case "racha":
            return info.racha.mejor; // tu mejor racha, para que no se pierda si luego fallas
        case "perfectos":
            return info.diasPerfectos;
        case "nivel":
            return calcularNivel(estado.personaje.xp).nivel;
        case "atributo": {
            // logro.atributo es uno de los 4 ("fuerza") o uno tuyo ("propio:5").
            const id = idDePropio(logro.atributo);
            if (id !== null) return buscarPropio(estado, id) ? nivelDePropio(estado, id).nivel : 0;
            return calcularNivel(estado.atributos[logro.atributo], BASE_ATRIBUTO).nivel;
        }
        case "principales":
            return info.principalesCompletadas;
        case "jefes":
            return info.jefesDerrotados;
        case "diario":
            return Object.keys(estado.diario).length;
        default:
            return 0;
    }
}

// plural(1, "día", "días") -> "1 día";  plural(3, "día", "días") -> "3 días"
export function plural(numero, singular, varios) {
    return `${numero} ${numero === 1 ? singular : varios}`;
}

// Texto que explica la condición de un logro.
export function describirLogro(logro, estado) {
    const n = logro.objetivo;
    switch (logro.tipo) {
        case "manual":      return "Logro personal";
        case "mision": {
            const mision = estado.misiones.find((m) => m.id === logro.misionId);
            const nombre = mision ? mision.nombre : "misión borrada";
            return `Completar «${nombre}» ${plural(n, "vez", "veces")}`;
        }
        case "total":       return `Completar ${plural(n, "misión diaria", "misiones diarias")}`;
        case "racha":       return `Lograr una racha de ${plural(n, "día", "días")}`;
        case "perfectos":   return `Tener ${plural(n, "día perfecto", "días perfectos")}`;
        case "nivel":       return `Llegar al nivel ${n}`;
        case "atributo": {
            const id = idDePropio(logro.atributo);
            if (id === null) return `${ATRIBUTOS[logro.atributo].nombre} al nivel ${n}`;
            const propio = buscarPropio(estado, id);
            return propio ? `${propio.nombre} al nivel ${n}` : `Un atributo borrado al nivel ${n}`;
        }
        case "principales": return `Completar ${plural(n, "misión principal", "misiones principales")}`;
        case "jefes":       return `Derrotar ${plural(n, "jefe", "jefes")}`;
        case "diario":      return `Escribir en tu diario ${plural(n, "día", "días")}`;
        default:            return "";
    }
}
