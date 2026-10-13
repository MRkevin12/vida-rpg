// mapa.js — El mapa del viaje.
//
// Tu héroe avanza por un camino: cada misión, tarea o sesión de enfoque cumplida es un
// PASO. Cada 4 pasos llegas a un lugar nuevo, y cada región tiene 25 lugares. En algunos
// lugares hay algo que reclamar: un tesoro (monedas), un santuario (XP para tu atributo
// más descuidado) y, al final de cada región, una fortaleza (un gran premio).
//
// La posición se CALCULA de tu historial; solo se guarda qué lugares ya reclamaste
// (estado.mapa.reclamados = ["r1-5", "r1-10", …]).

import { ATRIBUTOS } from "./juego.js";

export const PASOS_POR_LUGAR = 4;
export const LUGARES_POR_REGION = 25;

export const REGIONES = [
    { nombre: "El Valle del Comienzo", paisaje: "valle" },
    { nombre: "El Bosque de las Dudas", paisaje: "bosque" },
    { nombre: "Las Montañas de la Disciplina", paisaje: "montanas" },
    { nombre: "El Desierto de la Constancia", paisaje: "desierto" },
    { nombre: "El Mar de la Paciencia", paisaje: "mar" },
    { nombre: "La Ciudadela del Carácter", paisaje: "ciudadela" },
];

export const LUGARES = {
    camino:    { icono: "", nombre: "Camino" },
    tesoro:    { icono: "💰", nombre: "Tesoro", premio: { monedas: 25 } },
    santuario: { icono: "🕯️", nombre: "Santuario", premio: { xp: 40 } },   // al atributo más descuidado
    fortaleza: { icono: "🏰", nombre: "Fortaleza", premio: { monedas: 100, xp: 100 } },
};

// Los pasos que llevas: todo lo que cumpliste.
export function pasosTotales(estado) {
    return estado.completadas.length + estado.tareas.filter((t) => t.hechaEn).length + estado.enfoque.sesiones.length;
}

// Dónde estás: lugar alcanzado (0 = el punto de partida), región (0, 1, 2…) y cuánto falta.
export function posicion(estado) {
    const pasos = pasosTotales(estado);
    const lugar = Math.floor(pasos / PASOS_POR_LUGAR);   // lugares alcanzados en total
    return {
        pasos,
        lugar,
        region: Math.floor(lugar / LUGARES_POR_REGION),
        enRegion: lugar % LUGARES_POR_REGION,              // 0…24 dentro de la región
        hastaSiguiente: PASOS_POR_LUGAR - (pasos % PASOS_POR_LUGAR),
    };
}

// Qué hay en el lugar n de una región (1…25).
export function tipoDeLugar(n) {
    if (n === LUGARES_POR_REGION) return "fortaleza";
    if (n % 10 === 5) return "tesoro";
    if (n % 10 === 0) return "santuario";
    return "camino";
}

// El nombre de una región (después de la sexta, vuelven a empezar con «II», «III»…).
export function nombreRegion(region) {
    const vuelta = Math.floor(region / REGIONES.length);
    const base = REGIONES[region % REGIONES.length];
    return vuelta ? `${base.nombre} ${["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][vuelta] || vuelta + 1}` : base.nombre;
}

export function paisajeDe(region) {
    return REGIONES[region % REGIONES.length].paisaje;
}

export function idLugar(region, n) {
    return `r${region + 1}-${n}`;
}

// Los lugares con premio que ya alcanzaste y todavía no reclamaste.
export function lugaresPorReclamar(estado) {
    const { lugar } = posicion(estado);
    const reclamados = new Set(estado.mapa?.reclamados || []);
    const lista = [];
    for (let global = 1; global <= lugar; global++) {
        const region = Math.floor((global - 1) / LUGARES_POR_REGION);
        const n = ((global - 1) % LUGARES_POR_REGION) + 1;
        const tipo = tipoDeLugar(n);
        const id = idLugar(region, n);
        if (tipo !== "camino" && !reclamados.has(id)) lista.push({ id, region, n, tipo });
    }
    return lista;
}

// El atributo con menos XP (el santuario lo fortalece).
export function atributoMasDescuidado(estado) {
    return Object.keys(ATRIBUTOS).reduce((menor, clave) => (estado.atributos[clave] < estado.atributos[menor] ? clave : menor));
}

// Dónde va cada lugar en el dibujo del mapa (un camino que sube haciendo curvas).
// Lienzo de 360 × 980; el lugar 0 (el punto de partida) abajo, el 25 arriba.
export function puntosDelCamino() {
    return Array.from({ length: LUGARES_POR_REGION + 1 }, (_, i) => ({
        x: Math.round(180 + 115 * Math.sin(i * 0.82)),
        y: Math.round(930 - i * 35),
    }));
}
