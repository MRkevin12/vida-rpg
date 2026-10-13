// mapa.js — El mapa del reino (rehecho en la v26).
//
// Tu héroe avanza por un camino: cada misión, tarea o sesión de enfoque cumplida es un
// PASO. Cada 4 pasos llegas a un lugar nuevo, y cada región tiene 25 lugares.
//
// El reino tiene 6 regiones y en ellas viven los señores de tus campañas (los jefes de
// Aventuras): en la región 1 están los primeros jefes de cada campaña (el Lobo, Medusa,
// Narciso y los Recaudadores), en la 2 los segundos… y así hasta el Mar de la Paciencia.
// La sexta, la Ciudadela del Carácter, no tiene señores: tiene cuatro memoriales (uno por
// campaña, que se encienden al vencer a sus cinco señores) y, al final, la Torre.
// Después vuelve a empezar («El Valle del Comienzo II»), con los jefes de la ronda siguiente.
//
// En cada lugar puede haber algo:
//   💰 tesoro · 🕯️ santuario (XP para tu atributo más descuidado)
//   ⚔️ guarida de un señor: si ya lo venciste (en Aventuras), se libera y tiene botín
//   🗿 memorial (en la Ciudadela)
//   🏰 fortaleza, al final de la región: se abre cuando caen sus cuatro señores
//
// La posición y el estado de las guaridas se CALCULAN de tu historial; solo se guarda qué
// lugares ya reclamaste (estado.mapa.reclamados = ["r1-5", "r1-7", …]).

import { ATRIBUTOS } from "./juego.js";
import { CAMPANAS, VIDAS, estadoCampanas } from "./campana.js";

export const PASOS_POR_LUGAR = 4;
export const LUGARES_POR_REGION = 25;
export const GUARIDAS = [7, 12, 17, 22];        // en qué lugares de cada región están las guaridas
export const CIUDADELA = 5;                       // la sexta región (empezando en 0)

export const REGIONES = [
    { nombre: "El Valle del Comienzo",          paisaje: "valle",     icono: "🌾", lema: "Donde todo invita a quedarse." },
    { nombre: "El Bosque de las Dudas",         paisaje: "bosque",    icono: "🌲", lema: "Se camina mucho y se avanza poco." },
    { nombre: "Las Montañas de la Disciplina",  paisaje: "montanas",  icono: "⛰️", lema: "La cima se alcanza sin ganas muchos días." },
    { nombre: "El Desierto de la Constancia",   paisaje: "desierto",  icono: "🏜️", lema: "Nada cambia, y eso es lo difícil." },
    { nombre: "El Mar de la Paciencia",         paisaje: "mar",       icono: "🌊", lema: "El mar no se cruza: se espera." },
    { nombre: "La Ciudadela del Carácter",      paisaje: "ciudadela", icono: "🏯", lema: "La construyen quienes vencieron." },
];

// Los nombres de los memoriales de la Ciudadela (uno por campaña).
export const MEMORIALES = {
    fuerza: "Memorial del Cuerpo", intelecto: "Memorial de la Mente",
    carisma: "Memorial de la Voz", riqueza: "Memorial del Tesoro",
};

export const LUGARES = {
    camino:    { icono: "", nombre: "Camino" },
    tesoro:    { icono: "💰", nombre: "Tesoro", premio: { monedas: 25 } },
    santuario: { icono: "🕯️", nombre: "Santuario", premio: { xp: 40 } },              // al atributo más descuidado
    guarida:   { icono: "⚔️", nombre: "Guarida liberada", premio: { monedas: 20, xp: 20 } },   // al atributo de su campaña
    memorial:  { icono: "🗿", nombre: "Memorial encendido", premio: { monedas: 50, xp: 50 } }, // al atributo de su campaña
    fortaleza: { icono: "🏰", nombre: "Fortaleza", premio: { monedas: 100, xp: 100 } },
};


// ===== Dónde estás =====

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

// Qué región es (0 a 5, se repiten) y en qué vuelta vas (0 = la primera, 1 = «II»…).
export const tramoDe = (region) => region % REGIONES.length;
export const vueltaDe = (region) => Math.floor(region / REGIONES.length);

// Qué hay en el lugar n de una región (1…25).
export function tipoDeLugar(n, region = 0) {
    if (n === LUGARES_POR_REGION) return "fortaleza";
    if (GUARIDAS.includes(n)) return tramoDe(region) === CIUDADELA ? "memorial" : "guarida";
    if (n % 10 === 5) return "tesoro";
    if (n % 10 === 0) return "santuario";
    return "camino";
}

// El nombre de una región (después de la sexta, vuelven a empezar con «II», «III»…).
export function nombreRegion(region) {
    const vuelta = vueltaDe(region);
    const base = REGIONES[tramoDe(region)];
    return vuelta ? `${base.nombre} ${["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][vuelta] || vuelta + 1}` : base.nombre;
}

export function paisajeDe(region) {
    return REGIONES[tramoDe(region)].paisaje;
}

export function idLugar(region, n) {
    return `r${region + 1}-${n}`;
}


// ===== Los señores de cada región =====

// De qué campaña es la guarida del lugar n (el orden cambia en cada región, para variar).
export function categoriaDeGuarida(region, n) {
    const categorias = Object.keys(CAMPANAS);
    const giro = tramoDe(region) % categorias.length;
    const orden = [...categorias.slice(giro), ...categorias.slice(0, giro)];
    return orden[GUARIDAS.indexOf(n)];
}

// Las 4 guaridas (o memoriales) de una región y cómo están.
// campanas = campana.estadoCampanas(estado). Cada una: { n, id, tipo, categoria, jefe (null en un memorial),
//   numero (qué jefe es de su campaña, contando las rondas: 0, 1, 2…), liberada, actual (es el jefe que peleas ahora) }
export function senoresDeRegion(region, campanas) {
    const tramo = tramoDe(region);
    const vuelta = vueltaDe(region);
    return GUARIDAS.map((n) => {
        const categoria = categoriaDeGuarida(region, n);
        const c = campanas[categoria];
        if (tramo === CIUDADELA) {
            // Un memorial se enciende cuando cayeron los 5 señores de su campaña (en esta vuelta).
            const meta = (vuelta + 1) * VIDAS.length;
            return { n, id: idLugar(region, n), tipo: "memorial", categoria, jefe: null, numero: meta,
                     liberada: c.derrotados >= meta, actual: false, nombre: MEMORIALES[categoria],
                     faltan: Math.max(0, meta - c.derrotados) };
        }
        const numero = vuelta * VIDAS.length + tramo;   // el jefe número «numero» de su campaña (0 = el primero)
        return { n, id: idLugar(region, n), tipo: "guarida", categoria, jefe: CAMPANAS[categoria].jefes[tramo], numero,
                 liberada: c.derrotados > numero, actual: c.derrotados === numero, nombre: CAMPANAS[categoria].jefes[tramo].nombre };
    });
}

// ¿Cayeron los cuatro señores (o se encendieron los cuatro memoriales) de la región?
export function regionLiberada(region, campanas) {
    return senoresDeRegion(region, campanas).every((s) => s.liberada);
}


// ===== Lo que se puede reclamar =====

// Los lugares con premio que ya alcanzaste y todavía no reclamaste. Las guaridas, solo si su
// señor cayó; la fortaleza, solo si la región está liberada.
// campanas (opcional): estadoCampanas(estado), si ya lo calculaste (se calcula solo si hace falta).
export function lugaresPorReclamar(estado, campanas = null) {
    const { lugar } = posicion(estado);
    const reclamados = new Set(estado.mapa?.reclamados || []);
    const lista = [];
    const deCampanas = () => (campanas ||= estadoCampanas(estado));
    for (let global = 1; global <= lugar; global++) {
        const region = Math.floor((global - 1) / LUGARES_POR_REGION);
        const n = ((global - 1) % LUGARES_POR_REGION) + 1;
        const tipo = tipoDeLugar(n, region);
        const id = idLugar(region, n);
        if (tipo === "camino" || reclamados.has(id)) continue;
        if (tipo === "guarida" || tipo === "memorial") {
            const senor = senoresDeRegion(region, deCampanas()).find((s) => s.n === n);
            if (!senor.liberada) continue;
            lista.push({ id, region, n, tipo, categoria: senor.categoria, nombre: senor.nombre });
            continue;
        }
        if (tipo === "fortaleza" && !regionLiberada(region, deCampanas())) continue;
        lista.push({ id, region, n, tipo });
    }
    return lista;
}

// El atributo con menos XP (el santuario lo fortalece).
export function atributoMasDescuidado(estado) {
    return Object.keys(ATRIBUTOS).reduce((menor, clave) => (estado.atributos[clave] < estado.atributos[menor] ? clave : menor));
}

// Lo que el dibujo del mapa necesita saber de una región (ver dibujo-mapa.js):
// { region, alcanzado (lugares alcanzados en ella), lugares: { n: { tipo, reclamado, libre } }, regionLibre }
export function datosParaDibujar(estado, region, campanas) {
    const pos = posicion(estado);
    const reclamados = new Set(estado.mapa?.reclamados || []);
    const senores = senoresDeRegion(region, campanas);
    const lugares = {};
    for (let n = 1; n <= LUGARES_POR_REGION; n++) {
        const tipo = tipoDeLugar(n, region);
        if (tipo === "camino") continue;
        const senor = senores.find((s) => s.n === n);
        lugares[n] = { tipo, reclamado: reclamados.has(idLugar(region, n)), libre: senor ? senor.liberada : false };
    }
    return {
        region,
        alcanzado: region < pos.region ? LUGARES_POR_REGION : pos.enRegion,
        lugares,
        regionLibre: senores.every((s) => s.liberada),
    };
}

// Cómo va cada región que ya pisaste (para la franja del reino): { region, nombre, liberada, senoresCaidos }.
export function resumenDelReino(estado, campanas) {
    const { region: actual } = posicion(estado);
    const primera = Math.floor(actual / REGIONES.length) * REGIONES.length;   // las 6 de la vuelta en que vas
    return Array.from({ length: REGIONES.length }, (_, i) => {
        const region = primera + i;
        const senores = senoresDeRegion(region, campanas);
        return {
            region,
            nombre: nombreRegion(region),
            icono: REGIONES[i].icono,
            pisada: region <= actual,
            actual: region === actual,
            liberada: senores.every((s) => s.liberada),
            senoresCaidos: senores.filter((s) => s.liberada).length,
        };
    });
}


// ===== El dibujo =====
// Dónde va cada lugar en el mapa (un camino que sube haciendo curvas), en un lienzo de
// 192 × 416 puntos: el lugar 0 (la partida) abajo, el 25 (la fortaleza) arriba.
export const LIENZO = { ancho: 192, alto: 416 };

export function puntosDelCamino() {
    return Array.from({ length: LUGARES_POR_REGION + 1 }, (_, i) => ({
        x: Math.round(96 + 56 * Math.sin(i * 0.74 + 0.5)),
        y: Math.round(396 - i * 13.9),
    }));
}
