// juego.js — Las reglas del juego.
//
// Este archivo NO toca la pantalla ni guarda nada: solo tiene números
// (cuánta XP da cada cosa) y funciones que calculan resultados.
// Si quieres cambiar el balance del juego, este es el lugar.

import { sumarDias, diaDeSemana } from "./fechas.js";


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

// Premios de las aventuras (misiones principales y jefes).
export const PREMIOS = {
    submision: { xp: 30,  monedas: 15 },  // cada paso de una misión principal
    principal: { xp: 150, monedas: 75 },  // extra al terminar todos los pasos
    golpe:     { xp: 15,  monedas: 5 },   // cada avance contra un jefe
    jefe:      { xp: 250, monedas: 100 }, // extra al derrotar al jefe
};

// Aspecto de los jefes (el dibujo de cada uno está en dibujo.js).
export const MONSTRUOS = {
    dragon:    { nombre: "Dragón",    icono: "🐉" },
    golem:     { nombre: "Gólem",     icono: "🪨" },
    slime:     { nombre: "Slime",     icono: "🟢" },
    esqueleto: { nombre: "Esqueleto", icono: "💀" },
    kraken:    { nombre: "Kraken",    icono: "🐙" },
    demonio:   { nombre: "Demonio",   icono: "😈" },
};

// Qué monstruo es un jefe (los jefes creados antes de elegir aspecto reciben uno según su id).
export function monstruoDe(jefe) {
    const tipos = Object.keys(MONSTRUOS);
    return MONSTRUOS[jefe.monstruo] ? jefe.monstruo : tipos[jefe.id % tipos.length];
}

// Cómo se ve el jefe según la vida que le queda.
export function estadoDelJefe(porcentajeVida) {
    if (porcentajeVida <= 0) return "derrotado";
    if (porcentajeVida < 30) return "agotado";
    if (porcentajeVida <= 60) return "herido";
    return "furioso";
}

// Rachas: cada 7 días seguidos ganas un escudo (puedes tener hasta 3).
export const ESCUDOS = { diasParaGanar: 7, maximo: 3 };

// Bonus de regreso: si vuelves tras 3 días o más, ganas 15 XP por día (máximo 150).
export const REGRESO = { diasMinimos: 3, xpPorDia: 15, xpMaximo: 150 };

// XP base de los niveles: pasar del nivel N al N+1 cuesta BASE × N.
export const BASE_PERSONAJE = 100; // personaje: 100, 200, 300...
export const BASE_ATRIBUTO = 50;   // atributos:  50, 100, 150...

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


// ===== Calendario y rachas =====

// Cuenta cuántas misiones se completaron cada día: Map { "2026-10-12" => 3, ... }
export function contarPorFecha(completadas) {
    const conteo = new Map();
    for (const c of completadas) {
        conteo.set(c.fecha, (conteo.get(c.fecha) || 0) + 1);
    }
    return conteo;
}

// Cuántas misiones diarias existían ese día (creadas antes y no archivadas todavía).
export function misionesActivasEn(misiones, fecha) {
    return misiones.filter((m) => m.creadaEn <= fecha && (!m.archivadaEn || m.archivadaEn > fecha)).length;
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
        } else if (misionesActivasEn(estado.misiones, fecha) === 0) {
            // Ese día no tenías misiones: no suma ni rompe la racha.
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
    const conteo = contarPorFecha(estado.completadas);
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
            const hechas = conteo.get(fecha) || 0;
            const total = misionesActivasEn(estado.misiones, fecha);
            dias.push({
                fecha,
                tipo: "dia",
                hechas,
                total,
                nivel: nivelCalor(hechas, total),
                protegido: racha.protegidos.has(fecha),
            });
        }
    }
    return { dias, semanas };
}

// Resumen general que usan varias pantallas y los logros.
export function resumen(estado, hoy) {
    const conteo = contarPorFecha(estado.completadas);
    let diasPerfectos = 0;

    if (estado.personaje) {
        for (let fecha = estado.personaje.creadoEn; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
            const total = misionesActivasEn(estado.misiones, fecha);
            if (total > 0 && (conteo.get(fecha) || 0) >= total) {
                diasPerfectos += 1;
            }
        }
    }

    return {
        racha: calcularRacha(estado, hoy),
        diasPerfectos,
        totalCompletadas: estado.completadas.length,
        principalesCompletadas: estado.principales.filter((p) => p.completadaEn).length,
        jefesDerrotados: estado.jefes.filter((j) => j.derrotadoEn).length,
    };
}


// ===== Aventuras =====

// Vida que le queda a un jefe (vida máxima menos el daño de todos los golpes).
export function vidaRestante(jefe) {
    const dano = jefe.golpes.reduce((suma, golpe) => suma + golpe.dano, 0);
    return Math.max(0, jefe.vidaMax - dano);
}

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
        case "atributo":
            return calcularNivel(estado.atributos[logro.atributo], BASE_ATRIBUTO).nivel;
        case "principales":
            return info.principalesCompletadas;
        case "jefes":
            return info.jefesDerrotados;
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
        case "atributo":    return `${ATRIBUTOS[logro.atributo].nombre} al nivel ${n}`;
        case "principales": return `Completar ${plural(n, "misión principal", "misiones principales")}`;
        case "jefes":       return `Derrotar ${plural(n, "jefe", "jefes")}`;
        default:            return "";
    }
}
