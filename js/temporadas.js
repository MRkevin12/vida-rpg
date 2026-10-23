// temporadas.js — Las temporadas (v149): metas del MES, con una recompensa al final y un resumen de cómo te fue.
//
// Cada mes eliges hasta 4 metas (ej: 60 misiones, 12 entrenamientos). Se guardan en estado.temporadas["2026-10"]:
//   { metas: [{ tipo, meta }], cierre: null | { fecha, cumplidas, total, todas, valores, premio, numeros, visto } }
// El avance NO se guarda: se calcula mirando el historial del mes (como la racha), así nunca se desordena.
// Al empezar el mes siguiente, la temporada se «cierra»: se paga el premio y se guarda su resumen.
//
// Aquí solo hay reglas y cálculos: no toca la pantalla ni guarda nada.

import { MESES, diaDeSemana } from "./fechas.js";
import { hechasPorFecha, esDiaPerfecto } from "./juego.js";

export const MAX_METAS = 4;
export const PREMIO_META = { gemas: 5, xp: 40 };                  // por cada meta cumplida
export const PREMIO_TODAS = { gemas: 15, xp: 150, monedas: 50 };   // de regalo si cumples todas las que elegiste

// Qué se puede medir. «base» = la meta que se sugiere si todavía no tienes historial.
export const METAS = {
    misiones:  { icono: "✅", nombre: "Misiones cumplidas",  unidad: "misiones",         base: 60 },
    perfectos: { icono: "🎯", nombre: "Días perfectos",      unidad: "días",             base: 8 },
    gym:       { icono: "🏋️", nombre: "Días de gimnasio",    unidad: "días",             base: 12 },
    km:        { icono: "🏃", nombre: "Kilómetros corridos", unidad: "km",               base: 30 },
    diario:    { icono: "📖", nombre: "Días con diario",     unidad: "días",             base: 15 },
};


// ===== Meses =====

// "2026-10-14" → "2026-10"
export function mesDe(fecha) {
    return fecha.slice(0, 7);
}

export function mesAnterior(mes) {
    const [anio, numero] = mes.split("-").map(Number);
    return numero === 1 ? `${anio - 1}-12` : `${anio}-${String(numero - 1).padStart(2, "0")}`;
}

export function mesSiguiente(mes) {
    const [anio, numero] = mes.split("-").map(Number);
    return numero === 12 ? `${anio + 1}-01` : `${anio}-${String(numero + 1).padStart(2, "0")}`;
}

export function diasDelMes(mes) {
    const [anio, numero] = mes.split("-").map(Number);
    return new Date(anio, numero, 0).getDate();   // el día 0 del mes siguiente = el último de este
}

export function nombreDelMes(mes) {
    return MESES[Number(mes.slice(5, 7)) - 1];
}

// Cuántos días del mes ya pasaron (contando hoy): 0 si el mes aún no llega, todos si ya terminó.
export function diasTranscurridos(mes, hoy) {
    if (hoy < `${mes}-01`) return 0;
    return mesDe(hoy) === mes ? Number(hoy.slice(8, 10)) : diasDelMes(mes);
}


// ===== Avance de cada meta =====

// Cuánto llevas de ese tipo de meta dentro del mes (hasta «hoy» como mucho).
export function valorDeMeta(estado, tipo, mes, hoy) {
    const enMes = (fecha) => Boolean(fecha) && fecha.slice(0, 7) === mes;
    switch (tipo) {
        case "misiones":
            return estado.completadas.filter((c) => enMes(c.fecha)).length;
        case "perfectos": {
            const hechas = hechasPorFecha(estado.completadas);
            let dias = 0;
            const hasta = diasTranscurridos(mes, hoy);
            for (let i = 1; i <= hasta; i++) {
                if (esDiaPerfecto(estado.misiones, `${mes}-${String(i).padStart(2, "0")}`, hechas)) dias += 1;
            }
            return dias;
        }
        case "gym":
            return new Set(estado.gym.sesiones.filter((s) => enMes(s.fecha)).map((s) => s.fecha)).size;
        case "km":
            return Math.round(estado.running.carreras.filter((c) => enMes(c.fecha)).reduce((suma, c) => suma + c.km, 0) * 10) / 10;
        case "diario":
            return Object.keys(estado.diario).filter(enMes).length;
        default:
            return 0;
    }
}

// La meta que se te sugiere: un poco más (10 %) de lo que lograste el mes pasado; sin historial, la «base».
export function metaSugerida(estado, tipo, mes, hoy) {
    const antes = valorDeMeta(estado, tipo, mesAnterior(mes), hoy);
    return antes > 0 ? Math.max(1, Math.ceil(antes * 1.1)) : METAS[tipo].base;
}

// Las metas que se rellenan solas en el formulario: misiones y días perfectos siempre; gym, km y diario
// solo si ya los usas (tienes historial de ese tipo).
export function tiposSugeridos(estado) {
    const usa = {
        misiones: true,
        perfectos: true,
        gym: estado.gym.sesiones.length > 0,
        km: estado.running.carreras.length > 0,
        diario: Object.keys(estado.diario).length > 0,
    };
    return Object.keys(METAS).filter((tipo) => usa[tipo]).slice(0, MAX_METAS);
}


// ===== La temporada de un mes =====

// Todo lo que necesita la pantalla de una temporada: sus metas con avance, y cuántas llevas cumplidas.
// Devuelve null si ese mes no eligió metas.
export function temporadaDe(estado, mes, hoy) {
    const guardada = estado.temporadas?.[mes];
    if (!guardada) return null;
    const total = diasDelMes(mes);
    const pasados = diasTranscurridos(mes, hoy);
    const metas = guardada.metas.map((m) => {
        const valor = valorDeMeta(estado, m.tipo, mes, hoy);
        return {
            ...m,
            ...METAS[m.tipo],
            valor,
            pct: Math.min(100, Math.round((valor / m.meta) * 100)),
            cumplida: valor >= m.meta,
            // ¿Vas al ritmo de lo que falta? (lo que deberías llevar hoy, repartido parejo por el mes)
            alRitmo: valor >= (m.meta * pasados) / total,
        };
    });
    const cumplidas = metas.filter((m) => m.cumplida).length;
    return {
        mes,
        nombre: nombreDelMes(mes),
        metas,
        cumplidas,
        total: metas.length,
        todas: metas.length > 0 && cumplidas === metas.length,
        diasRestantes: total - pasados,
        cierre: guardada.cierre || null,
    };
}

// Los números del mes que se guardan en el cierre para contar «cómo te fue» (también sirven para comparar con el mes anterior).
export function numerosDelMes(estado, mes, hoy) {
    const enMes = (c) => c.fecha.slice(0, 7) === mes;
    const delMes = estado.completadas.filter(enMes);
    const porDia = {};
    for (const c of delMes) porDia[c.fecha] = (porDia[c.fecha] || 0) + 1;
    const mejor = Object.entries(porDia).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    const porDiaSemana = [0, 0, 0, 0, 0, 0, 0];
    for (const fecha of Object.keys(porDia)) porDiaSemana[diaDeSemana(fecha)] += porDia[fecha];
    const mejorDiaSemana = porDiaSemana.some(Boolean) ? porDiaSemana.indexOf(Math.max(...porDiaSemana)) : null;
    return {
        misiones: delMes.length,
        xp: delMes.reduce((suma, c) => suma + c.xp, 0),
        perfectos: valorDeMeta(estado, "perfectos", mes, hoy),
        mejorDia: mejor ? { fecha: mejor[0], misiones: mejor[1] } : null,
        mejorDiaSemana,   // 0 = lunes … 6 = domingo
    };
}

// Lo que se paga al cerrar un mes: por cada meta cumplida, y el regalo si las cumpliste todas.
export function premioDeTemporada(cumplidas, todas) {
    const premio = { gemas: cumplidas * PREMIO_META.gemas, xp: cumplidas * PREMIO_META.xp, monedas: 0 };
    if (todas) {
        premio.gemas += PREMIO_TODAS.gemas;
        premio.xp += PREMIO_TODAS.xp;
        premio.monedas += PREMIO_TODAS.monedas;
    }
    return premio;
}

// Una frase para contar cómo te fue y qué hacer el mes que viene.
export function veredicto(cierre) {
    if (cierre.total === 0) return "";
    if (cierre.todas) return "¡Temporada perfecta! Cumpliste todas tus metas.";
    if (cierre.cumplidas === 0) return "Este mes costó. Pasa: el próximo elige metas más pequeñas y súbelas poco a poco.";
    if (cierre.cumplidas * 2 > cierre.total) return "Buen mes: cumpliste la mayoría de tus metas.";
    return "Avanzaste, aunque te quedaste corto. Mira cuáles fallaron y ajusta esas.";
}

// Un consejo concreto para la siguiente temporada: la meta que más se quedó corta, con una cifra más realista.
// Devuelve null si cumpliste todo.
export function consejoParaLaSiguiente(cierre) {
    const falladas = cierre.valores.filter((v) => v.valor < v.meta);
    if (!falladas.length) return null;
    const peor = falladas.sort((a, b) => a.valor / a.meta - b.valor / b.meta)[0];
    const realista = Math.max(1, Math.ceil(peor.valor * 1.2));
    const info = METAS[peor.tipo];
    return `${info.icono} «${info.nombre}»: te quedaste en ${peor.valor} de ${peor.meta}. Prueba con ${realista} el mes que viene.`;
}


// ===== El pase de temporada (v150) =====
// Cada mes, a medida que avanzas, se desbloquean niveles del pase. Cada nivel se cobra una sola vez.
// El progreso es el promedio de tus metas (cada una cuenta hasta 100 %), así que cumplir una meta
// por completo no tapa el avance de las demás.
export const PASE = [
    { porcentaje: 25,  gemas: 20,  xp: 0,   monedas: 0,   texto: "Primer paso" },
    { porcentaje: 50,  gemas: 40,  xp: 0,   monedas: 20,  texto: "Mitad del camino" },
    { porcentaje: 75,  gemas: 60,  xp: 40,  monedas: 0,   texto: "Tres cuartos" },
    { porcentaje: 100, gemas: 100, xp: 100, monedas: 100, texto: "Sello del mes" },
];

// Cuánto avanzó el pase (0 a 100): el promedio del avance de cada meta.
export function progresoDelPase(temporada) {
    if (!temporada || !temporada.metas.length) return 0;
    const suma = temporada.metas.reduce((total, m) => total + Math.min(100, (m.valor / m.meta) * 100), 0);
    return Math.floor(suma / temporada.metas.length);
}

// Los niveles del pase que ya alcanzaste en ese mes y todavía no se cobraron.
export function nivelesPorCobrar(estado, mes, hoy) {
    const t = temporadaDe(estado, mes, hoy);
    if (!t) return [];
    const cobrados = estado.temporadas[mes].pase?.cobrados || [];
    const pct = progresoDelPase(t);
    return PASE.filter((nivel) => pct >= nivel.porcentaje && !cobrados.includes(nivel.porcentaje));
}
