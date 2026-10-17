// ruta.js — La Ruta del Corredor (v117): tus kilómetros recorren el reino.
//
// Es un mapa HIPOTÉTICO: cada kilómetro que corres (con GPS o anotado) es un lugar del mismo mapa del reino
// (mapa.js: 6 regiones de 25 lugares, y después vuelven a empezar). Cada kilómetro da un premio; los lugares
// especiales (tesoros, santuarios, guaridas y la fortaleza al final) dan uno mayor.
// Aquí solo hay reglas: lo que se guarda es un número, `running.rutaCobrada` (hasta qué kilómetro ya cobraste).
// Dónde estás se CALCULA con tus kilómetros totales, así nunca se desordena.

import * as mapa from "./mapa.js";
import { kmTotales } from "./running.js";

// Lo que da cada tipo de lugar al llegar. El XP va a 💪 Fuerza (es lo que corres).
export const PREMIOS = {
    camino:    { gemas: 1 },
    tesoro:    { gemas: 10 },
    santuario: { xp: 20 },
    guarida:   { gemas: 8, xp: 10 },
    memorial:  { gemas: 8, xp: 10 },
    fortaleza: { gemas: 30, xp: 40 },
};

// Los kilómetros completos que llevas (el que va a medias aún no cuenta).
export const kmDeRuta = (carreras) => Math.floor(kmTotales(carreras) + 1e-6);

// Qué hay en el kilómetro n de tu vida (1, 2, 3…): { region, lugar (1…25 dentro de la región), tipo }.
export function lugarDeKm(n) {
    const region = Math.floor((n - 1) / mapa.LUGARES_POR_REGION);
    const lugar = ((n - 1) % mapa.LUGARES_POR_REGION) + 1;
    return { region, lugar, tipo: mapa.tipoDeLugar(lugar, region) };
}

export const premioDeKm = (n) => PREMIOS[lugarDeKm(n).tipo];

// Dónde estás: región, lugares alcanzados en ella (0…25) y cuánto falta para el siguiente kilómetro.
export function posicion(kmTotal) {
    const km = Math.floor(kmTotal + 1e-6);
    return {
        km,
        region: Math.floor(km / mapa.LUGARES_POR_REGION),
        enRegion: km % mapa.LUGARES_POR_REGION,
        faltaKm: Math.round((1 - (kmTotal - km)) * 100) / 100,
    };
}

// El siguiente lugar con premio grande (no un simple camino): { km, tipo, region, lugar, faltaKm }.
export function proximoEspecial(kmTotal) {
    const desde = Math.floor(kmTotal + 1e-6) + 1;
    for (let n = desde; n < desde + mapa.LUGARES_POR_REGION; n++) {
        const l = lugarDeKm(n);
        if (l.tipo !== "camino") return { km: n, ...l, faltaKm: Math.round((n - kmTotal) * 100) / 100 };
    }
    return null;
}

// Cobra los kilómetros nuevos: de `rutaCobrada + 1` hasta los km completos que llevas. Devuelve lo ganado:
// { desde, hasta, gemas, xp, especiales: [{ km, tipo, region }] } o null si no hay nada nuevo.
export function cobrar(running, kmTotal) {
    const hasta = Math.floor(kmTotal + 1e-6);
    const desde = (running.rutaCobrada || 0) + 1;
    if (hasta < desde) return null;
    let gemas = 0;
    let xp = 0;
    const especiales = [];
    for (let n = desde; n <= hasta; n++) {
        const l = lugarDeKm(n);
        const premio = PREMIOS[l.tipo];
        gemas += premio.gemas || 0;
        xp += premio.xp || 0;
        if (l.tipo !== "camino") especiales.push({ km: n, tipo: l.tipo, region: l.region });
    }
    running.rutaCobrada = hasta;
    return { desde, hasta, gemas, xp, especiales };
}

// "💰 Tesoro", "🏰 Fortaleza"… y lo que da, para los textos.
export function textoDePremio(premio) {
    return [premio.gemas ? `+${premio.gemas} 💎` : "", premio.xp ? `+${premio.xp} XP de 💪 Fuerza` : ""].filter(Boolean).join(" · ");
}
