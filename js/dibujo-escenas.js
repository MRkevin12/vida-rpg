// dibujo-escenas.js — Fondos y efectos de luz.
//
// Tres tipos de dibujos:
//   1. El fondo del avatar (lienzo de 200 × 200). Cada ETAPA tiene el suyo
//      (aldea → camino → fortaleza → cumbre) y además se pueden comprar otros.
//   2. Efectos detrás del personaje: aura de leyenda, llamas de la racha, noche.
//   3. Los escenarios de batalla de cada campaña (lienzo ancho, de 320 × 180).
//
// Los fondos y escenarios son PINTURAS clásicas de dominio público (ver pinturas.js).
// Encima se pone una viñeta: los bordes y el suelo más oscuros hacen que la mirada
// vaya al personaje, como la luz de un escenario.

import { halo, destello } from "./dibujo-base.js";
import { rutaPintura } from "./pinturas.js";


// ===== 1. Fondos del avatar =====

// La pintura de cada etapa (si no compraste o ganaste otro fondo).
const FONDO_DE_ETAPA = ["aldea", "camino", "fortaleza", "cumbre"];

export function fondo(d, p) {
    const id = p.id;
    const pintura = d.equipado.fondo || FONDO_DE_ETAPA[p.etapa] || "aldea";
    return `<defs>
                <radialGradient id="${id}-vineta" cx="50%" cy="42%" r="74%">
                    <stop offset=".42" stop-color="#0b0816" stop-opacity="0"/>
                    <stop offset="1" stop-color="#0b0816" stop-opacity=".72"/></radialGradient>
                <linearGradient id="${id}-piso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#0b0816" stop-opacity="0"/>
                    <stop offset="1" stop-color="#0b0816" stop-opacity=".7"/></linearGradient>
                ${halo(`${id}-clase`, d.clase.color, 0.26)}
            </defs>
            <image href="${rutaPintura(pintura)}" width="200" height="200" preserveAspectRatio="xMidYMid slice"/>
            <rect width="200" height="200" fill="#0b0816" opacity=".12"/>
            <rect width="200" height="200" fill="url(#${id}-vineta)"/>
            <rect y="128" width="200" height="72" fill="url(#${id}-piso)"/>
            <!-- una luz suave del color de tu clase detrás del personaje -->
            <circle cx="100" cy="104" r="78" fill="url(#${id}-clase)"/>`;
}

// ===== 2. Efectos detrás del personaje =====

// Leyenda (nivel 50+): aura dorada que palpita.
export function aura(p) {
    return `<defs>${halo(`${p.id}-aura`, "#ffe08a", 0.75, 0.55)}</defs>
            <circle class="aura" cx="100" cy="104" r="88" fill="url(#${p.id}-aura)"/>
            ${destello(40, 58, 4.6)}${destello(162, 74, 3.6)}${destello(150, 148, 3.6)}${destello(48, 132, 2.8)}`;
}

// Racha de 7+ días: fuego a los lados, con el centro más claro y brasas que suben.
export function llamas(p) {
    const llama = (x, alto, ancho, relleno) =>
        `<path class="llama" d="M${x - ancho} 184 C${x - ancho - 3} ${184 - alto * 0.4} ${x - ancho * 0.5} ${184 - alto * 0.55} ${x - ancho * 0.25} ${184 - alto * 0.8}
                C${x - ancho * 0.1} ${184 - alto * 0.62} ${x + ancho * 0.1} ${184 - alto * 0.9} ${x + ancho * 0.1} ${184 - alto}
                C${x + ancho * 0.5} ${184 - alto * 0.7} ${x + ancho + 3} ${184 - alto * 0.4} ${x + ancho} 184 Z" fill="${relleno}"/>`;
    const fuego = (x, alto) => `${llama(x, alto, 11, `url(#${p.id}-fuego)`)}${llama(x + 1, alto * 0.62, 6.4, `url(#${p.id}-fuego2)`)}`;
    return `<defs>
                <linearGradient id="${p.id}-fuego" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d1340c"/><stop offset=".55" stop-color="#f07a0a"/><stop offset="1" stop-color="#ffd24a" stop-opacity=".2"/></linearGradient>
                <linearGradient id="${p.id}-fuego2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a1a"/><stop offset=".6" stop-color="#ffe27a"/><stop offset="1" stop-color="#fff7d6" stop-opacity=".3"/></linearGradient>
                ${halo(`${p.id}-brasa`, "#ff7a1a", 0.5)}</defs>
            <ellipse cx="100" cy="178" rx="74" ry="26" fill="url(#${p.id}-brasa)"/>
            ${fuego(52, 84)}${fuego(68, 52)}${fuego(148, 84)}${fuego(132, 52)}
            <g fill="#ffd24a">${[[44, 96], [60, 78], [156, 92], [140, 74], [50, 60], [152, 56]].map(([x, y], i) => `<circle class="chispa" cx="${x}" cy="${y}" r="${i % 2 ? 0.9 : 1.3}"/>`).join("")}</g>`;
}

// Buen ánimo: una luz cálida detrás.
export function resplandor(p) {
    return `<defs>${halo(`${p.id}-res`, "#ffe9a8", 0.4)}</defs><circle cx="100" cy="96" r="74" fill="url(#${p.id}-res)"/>`;
}

// Dormido: es de noche (luna y penumbra azul).
export function noche() {
    return `<rect width="200" height="200" fill="#0a1030" opacity=".55"/>
            <path d="M158 26 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22 z" fill="#dbe3f5" opacity=".9"/>
            ${destello(138, 22, 2.5)}${destello(176, 60, 2)}
            <g class="zzz" fill="#dbe3f5" font-family="sans-serif" font-weight="700"><text x="116" y="34" font-size="9">z</text><text x="123" y="26" font-size="7">z</text></g>`;
}


// ===== 3. Escenarios de batalla (uno por campaña) =====

export function escenario(categoria, id) {
    return `<svg class="escena-svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <defs><radialGradient id="${id}-v" cx="50%" cy="44%" r="72%">
                    <stop offset=".3" stop-color="#0b0816" stop-opacity=".12"/>
                    <stop offset="1" stop-color="#0b0816" stop-opacity=".78"/></radialGradient></defs>
                <image href="${rutaPintura(`escena-${categoria}`)}" width="320" height="180" preserveAspectRatio="xMidYMid slice"/>
                <rect width="320" height="180" fill="url(#${id}-v)"/>
            </svg>`;
}
