// dibujo-plataformas.js — Cómo se VE «La Senda del Reino» (v185; v187: más escenario, luz y «jugo»): pixel art en un <canvas>.
//
// Todo se dibuja con rectángulos de un punto (fillRect), como el pixel art de verdad, en un lienzo chico (240 puntos
// de alto) que la pantalla agranda sin suavizar. Las criaturas y tu héroe son los sprites de la Torre (sprites.js),
// achicados; el terreno, los adornos y los objetos se pintan aquí. Los fondos, el ambiente y la luz de la pantalla
// están en dibujo-plataformas-escena.js.
//
//   const pintor = crearPintor(partida, imagenes);   // prepara los fondos y el terreno (una vez por nivel)
//   pintor.dibujar(g);                               // pinta un cuadro (60 veces por segundo)
//
// Para que vaya rápido: el terreno que no se mueve (y sus adornos quietos: flores, lápidas, carámbanos…) se pinta UNA
// vez en un lienzo escondido del tamaño del nivel, y en cada cuadro solo se copia el pedazo que se ve. Lo animado
// (monedas, lava, antorchas, el pasto que se mueve) se pinta cada vez, pero solo en las columnas que se ven.
//
// El orden de un cuadro: fondo → (oscuridad del fondo y lo que brilla en él) → terreno y todo lo que se mueve →
// (oscuridad de adelante) → luces que suman → partículas del ambiente → destellos → viñeta → iris (al entrar/salir).

import * as P from "./plataformas.js";
import {
    PALETAS, ruido, lienzo, px, circulo, brillar, crearFondos, pintarFondos, pintarBrillosDeFondo,
    pintarAmbiente, crearLuzDePantalla, selloDeLuz, ANCHO_FONDO,
} from "./dibujo-plataformas-escena.js";

const { CELDA } = P;


// ===== El terreno (una celda de 16 × 16) =====
// lados: qué lados de la celda dan al aire (para el pasto, la nieve y los bordes).
// prof: cuántas celdas de suelo tiene encima (0 = la de arriba): lo hondo se pinta más oscuro.
function pintarCelda(g, letra, x, y, c, f, mundo, lados, prof = 0) {
    const pal = PALETAS[mundo];
    if (letra === "#") pintarSuelo(g, x, y, c, f, mundo, pal, lados, prof);
    else if (letra === "=" || letra === "%") pintarPiedra(g, x, y, c, f, pal, letra === "%", mundo, lados);
    else if (letra === "I") pintarHielo(g, x, y, c, f, pal, lados);
    else if (letra === "-") pintarTabla(g, x, y, c, pal, mundo);
    else if (letra === "^") pintarPinchos(g, x, y);
    else if (letra === "U") pintarUrna(g, x, y);
    else if (letra === "G") pintarPivote(g, x, y);
}

// La sombra de lo hondo: cuanto más abajo, más oscuro (de a franjas de 4 puntos).
function sombraHonda(g, x, y, prof) {
    for (let k = 0; k < 4; k++) {
        const a = Math.min(0.5, (prof * 4 + k) * 0.042);
        if (a <= 0) continue;
        g.globalAlpha = a;
        px(g, x, y + k * 4, 16, 4, "#06040c");
    }
    g.globalAlpha = 1;
}

function pintarSuelo(g, x, y, c, f, mundo, pal, lados, prof) {
    const [base, oscuro, claro] = pal.tierra;
    if (mundo === 4) {
        pintarMuralla(g, x, y, c, f, pal, lados);
    } else {
        px(g, x, y, 16, 16, base);
        for (let i = 0; i < 5; i++) {
            const sx = x + Math.floor(ruido(c, f, i) * 13);
            const sy = y + 3 + Math.floor(ruido(f, c, i + 9) * 11);
            if (mundo === 1) {          // piedritas redondas enterradas
                px(g, sx, sy, 3, 2, oscuro);
                px(g, sx, sy, 2, 1, claro);
            } else if (mundo === 2) {   // vetas de la roca, en capas
                px(g, sx - 2, sy, 6, 1, i % 2 ? oscuro : claro);
            } else {                    // tierra helada con escarcha
                px(g, sx, sy, 2, 1, i % 2 ? oscuro : "#5a6584");
            }
        }
        if (mundo === 2 && ruido(c, f, 40) < 0.22) {   // vetas de cristal
            const cx = x + 3 + Math.floor(ruido(c, f, 41) * 9);
            const cy = y + 5 + Math.floor(ruido(c, f, 42) * 8);
            px(g, cx, cy, 3, 2, pal.cristal[1]);
            px(g, cx, cy, 1, 1, pal.cristal[0]);
            px(g, cx + 1, cy + 2, 1, 1, pal.cristal[3]);
        }
        if (mundo === 1 && lados.arriba) {   // raíces que bajan del pasto
            for (let i = 0; i < 2; i++) {
                const rx = x + 2 + Math.floor(ruido(c, f, 50 + i) * 12);
                px(g, rx, y + 4, 1, 2 + Math.floor(ruido(c, f, 52 + i) * 4), "#241a14");
            }
        }
    }
    sombraHonda(g, x, y, prof);
    if (lados.izq) { px(g, x, y, 1, 16, oscuro); g.globalAlpha = 0.3; px(g, x + 1, y, 1, 16, "#000"); g.globalAlpha = 1; }
    if (lados.der) { px(g, x + 15, y, 1, 16, oscuro); g.globalAlpha = 0.3; px(g, x + 14, y, 1, 16, "#000"); g.globalAlpha = 1; }
    if (lados.abajo) px(g, x, y + 15, 16, 1, oscuro);
    if (lados.arriba) pintarBordeDeArriba(g, x, y, c, f, mundo, pal, lados);
}

// La capa de arriba del suelo: pasto (mundo 1), roca clara (2), nieve (3) o el remate de la muralla (4).
function pintarBordeDeArriba(g, x, y, c, f, mundo, pal, lados) {
    const [luz, medio, sombra] = pal.borde;
    if (mundo === 1) {
        px(g, x, y, 16, 4, sombra);
        px(g, x, y, 16, 3, medio);
        px(g, x, y, 16, 1, luz);
        for (let i = 0; i < 16; i++) {   // el borde de abajo, irregular (el pasto «gotea» sobre la tierra)
            const largo = Math.floor(ruido(c * 16 + i, f, 7) * 3);
            if (largo) px(g, x + i, y + 4, 1, largo, sombra);
        }
        for (let i = 0; i < 4; i++) px(g, x + Math.floor(ruido(c, f, 30 + i) * 15), y + 1, 1, 1, luz);
        for (let i = 0; i < 3; i++) {   // briznas quietas que asoman
            const bx = x + Math.floor(ruido(c, f, 20 + i) * 15);
            px(g, bx, y - 1, 1, 1, luz);
            if (ruido(c, f, 23 + i) < 0.5) px(g, bx, y - 2, 1, 1, medio);
        }
        if (lados.izq) px(g, x, y + 3, 1, 3, medio);
        if (lados.der) px(g, x + 15, y + 3, 1, 3, medio);
    } else if (mundo === 2) {
        px(g, x, y, 16, 3, medio);
        px(g, x, y, 16, 1, luz);
        for (let i = 0; i < 16; i++) if (ruido(c * 16 + i, f, 8) < 0.4) px(g, x + i, y + 3, 1, 1, sombra);
        if (ruido(c, f, 50) < 0.35) px(g, x + Math.floor(ruido(c, f, 51) * 14), y, 2, 1, pal.cristal[0]);
    } else if (mundo === 3) {
        const grosor = 4 + Math.floor(ruido(c, f, 60) * 2);
        for (let i = 0; i < 16; i++) {
            const alto = grosor + Math.round(Math.sin((c * 16 + i) * 0.45) * 1.2);
            px(g, x + i, y, 1, alto, medio);
            px(g, x + i, y + alto, 1, 1, sombra);
            if (Math.sin((c * 16 + i) * 0.45) > 0.7) px(g, x + i, y - 1, 1, 1, luz);   // la nieve se amontona
        }
        px(g, x, y, 16, 1, luz);
        px(g, x, y + 1, 16, 1, "#e6edf7");
        if (lados.izq) px(g, x, y + 4, 1, 2 + Math.floor(ruido(c, f, 61) * 4), medio);
        if (lados.der) px(g, x + 15, y + 4, 1, 2 + Math.floor(ruido(c, f, 62) * 4), medio);
    } else {
        px(g, x, y, 16, 4, sombra);
        px(g, x, y, 16, 3, medio);
        px(g, x, y, 16, 1, luz);
        for (let i = 3; i < 16; i += 8) px(g, x + i, y + 1, 1, 2, sombra);   // las juntas del remate
    }
}

// La muralla de la fortaleza: ladrillos de piedra oscura, corridos fila por medio.
function pintarMuralla(g, x, y, c, f, pal) {
    const [base, oscuro, claro] = pal.tierra;
    px(g, x, y, 16, 16, "#1c1314");
    for (let fila = 0; fila < 4; fila++) {
        const corrido = (fila + f) % 2 ? 4 : 0;
        for (let k = -1; k < 3; k++) {
            const desde = Math.max(x, x + k * 8 + corrido);
            const hasta = Math.min(x + 16, x + k * 8 + corrido + 7);
            if (hasta <= desde) continue;
            const r = ruido(c * 3 + k, f * 4 + fila);
            px(g, desde, y + fila * 4, hasta - desde, 3, r < 0.3 ? oscuro : base);
            px(g, desde, y + fila * 4, hasta - desde, 1, claro);
            if (r > 0.92) px(g, desde + 2, y + fila * 4 + 1, 1, 2, "#1c1314");   // un ladrillo rajado
            if (r > 0.97) px(g, desde + 4, y + fila * 4 + 2, 1, 1, "#c2410c");    // con brasa adentro
        }
    }
}

function pintarPiedra(g, x, y, c, f, pal, falsa, mundo, lados) {
    const [luz, cara, sombra, borde] = pal.piedra;
    px(g, x, y, 16, 16, borde);
    px(g, x + 1, y + 1, 14, 14, cara);
    for (let i = 0; i < 3; i++) {   // manchas de la piedra
        g.globalAlpha = 0.5;
        px(g, x + 3 + Math.floor(ruido(c, f, 10 + i) * 9), y + 3 + Math.floor(ruido(c, f, 20 + i) * 9), 2, 1, ruido(c, f, 30 + i) < 0.5 ? sombra : luz);
    }
    g.globalAlpha = 1;
    px(g, x + 1, y + 1, 14, 1, luz);
    px(g, x + 1, y + 1, 1, 14, luz);
    px(g, x + 1, y + 14, 14, 1, sombra);
    px(g, x + 14, y + 1, 1, 14, sombra);
    px(g, x + 2, y + 2, 1, 1, "#ffffff40");
    const r = ruido(c, f, 3);
    if (r < 0.5) {   // una grieta
        const gx = x + 4 + Math.floor(r * 14);
        px(g, gx, y + 4, 1, 3, sombra);
        px(g, gx + 1, y + 7, 1, 2, sombra);
    }
    if (ruido(c, f, 8) < 0.25) px(g, x + 13, y + 13, 2, 2, borde);   // una esquina desportillada
    if (falsa) {   // la pared falsa tiene una grieta un poco más marcada (una pista)
        px(g, x + 5, y + 3, 1, 4, borde);
        px(g, x + 6, y + 7, 1, 3, borde);
        px(g, x + 7, y + 10, 1, 2, borde);
    }
    if (!lados?.arriba) return;
    if (mundo === 1 && ruido(c, f, 40) < 0.55) {   // musgo arriba, que cuelga un poco
        const [claro2, oscuro2] = pal.musgo;
        px(g, x + 1, y, 14, 2, oscuro2);
        px(g, x + 1, y, 14, 1, claro2);
        for (let i = 0; i < 14; i++) if (ruido(c * 16 + i, f, 41) < 0.3) px(g, x + 1 + i, y + 2, 1, 1 + Math.floor(ruido(c, f, i) * 2), oscuro2);
    } else if (mundo === 3) {   // nieve encima
        px(g, x, y, 16, 3, "#d2dcea");
        px(g, x, y, 16, 1, "#f4f7fc");
        for (let i = 0; i < 16; i++) if (ruido(c * 16 + i, f, 42) < 0.35) px(g, x + i, y + 3, 1, 1, "#d2dcea");
    }
}

function pintarHielo(g, x, y, c, f, pal, lados) {
    const [brillo, cara, sombra, borde] = pal.hielo || pal.piedra;
    px(g, x, y, 16, 16, borde);
    px(g, x + 1, y + 1, 14, 14, cara);
    px(g, x + 1, y + 1, 14, 2, brillo);
    px(g, x + 1, y + 12, 14, 2, sombra);
    for (let i = 0; i < 4; i++) px(g, x + 3 + i * 2, y + 9 - i * 2, 2, 1, brillo);   // un reflejo en diagonal
    if (ruido(c, f, 5) < 0.4) px(g, x + 10, y + 5, 3, 1, sombra);
    if (ruido(c, f, 6) < 0.5) { px(g, x + 4, y + 11, 1, 2, borde); px(g, x + 5, y + 10, 1, 1, borde); }   // burbujas de aire atrapadas
    if (lados?.arriba) px(g, x, y, 16, 1, "#ffffff");
}

function pintarTabla(g, x, y, c, pal, mundo) {
    const [luz, cara, sombra] = pal.tabla;
    px(g, x, y, 16, 5, sombra);
    px(g, x, y, 16, 4, cara);
    px(g, x, y, 16, 1, luz);
    if (mundo === 4) {   // una reja de hierro
        for (let i = 1; i < 16; i += 4) px(g, x + i, y + 1, 1, 3, sombra);
        return;
    }
    px(g, x + 3 + Math.floor(ruido(c, 1) * 4), y + 2, 4, 1, sombra);   // la veta de la madera
    px(g, x + 7, y + 1, 1, 3, sombra);
    px(g, x + 1, y + 2, 1, 1, "#1f150c");   // los clavos
    px(g, x + 14, y + 2, 1, 1, "#1f150c");
    px(g, x + 3, y + 5, 2, 3, sombra);      // el soporte
    px(g, x + 11, y + 5, 2, 3, sombra);
}

function pintarPinchos(g, x, y) {
    px(g, x, y + 13, 16, 3, "#2b2d36");
    px(g, x, y + 13, 16, 1, "#4a4e5c");
    for (let i = 0; i < 4; i++) {
        const bx = x + i * 4;
        px(g, bx + 1, y + 7, 2, 6, "#7c8596");
        px(g, bx + 1, y + 5, 1, 2, "#c5ccd8");
        px(g, bx + 2, y + 7, 1, 6, "#5a6170");
        px(g, bx + 1, y + 4, 1, 1, "#eef2f7");
    }
}

function pintarUrna(g, x, y) {
    // Una urna de piedra con la boca abierta (de ahí sale la raíz).
    px(g, x + 1, y, 14, 3, "#2a1f1e");
    px(g, x, y + 1, 16, 2, "#5a4440");
    px(g, x + 2, y + 3, 12, 12, "#4a3632");
    px(g, x + 2, y + 3, 2, 12, "#634a44");
    px(g, x + 12, y + 3, 2, 12, "#33241f");
    px(g, x + 3, y + 7, 10, 1, "#2a1f1e");
    px(g, x + 1, y + 15, 14, 1, "#241a18");
}

function pintarPivote(g, x, y) {
    px(g, x, y, 16, 16, "#23252c");
    px(g, x + 1, y + 1, 14, 14, "#4b4f5c");
    px(g, x + 1, y + 1, 14, 1, "#7b8090");
    for (const [a, b] of [[3, 3], [11, 3], [3, 11], [11, 11]]) px(g, x + a, y + b, 2, 2, "#2b2d34");
}


// ===== Los adornos quietos (se pintan con el terreno, en la celda vacía de encima o de debajo) =====

// Sobre el suelo: flores, lápidas y espadas (mundo 1), cristales y hongos (2), montones de nieve (3), huesos (4).
function adornoDeSuelo(g, x, y, c, f, mundo, pal) {
    const r = ruido(c, f, 77);
    const pie = y + 16;
    if (mundo === 1) {
        const [luz, medio, sombra] = pal.borde;
        if (r < 0.26) {          // una mata de pasto
            for (let i = 0; i < 4; i++) {
                const bx = x + 3 + i * 3 + Math.floor(ruido(c, f, i) * 2);
                const alto = 2 + Math.floor(ruido(c, f, 10 + i) * 4);
                px(g, bx, pie - alto, 1, alto, i % 2 ? medio : sombra);
                px(g, bx, pie - alto, 1, 1, luz);
            }
        } else if (r < 0.38) {   // flores silvestres
            for (let i = 0; i < 3; i++) {
                const fx = x + 2 + Math.floor(ruido(c, f, 20 + i) * 12);
                const alto = 3 + Math.floor(ruido(c, f, 23 + i) * 3);
                const color = ["#e8d36a", "#d97a8a", "#c9c1e8", "#f1ece0"][Math.floor(ruido(c, f, 26 + i) * 4)];
                px(g, fx, pie - alto, 1, alto, sombra);
                px(g, fx - 1, pie - alto - 1, 3, 1, color);
                px(g, fx, pie - alto - 2, 1, 3, color);
                px(g, fx, pie - alto - 1, 1, 1, "#fff7d6");
            }
        } else if (r < 0.45) {   // una piedra
            px(g, x + 5, pie - 3, 6, 3, pal.piedra[2]);
            px(g, x + 6, pie - 4, 4, 1, pal.piedra[2]);
            px(g, x + 6, pie - 4, 3, 1, pal.piedra[1]);
        } else if (r < 0.49) {   // una lápida de la última guerra, con su cruz tallada
            px(g, x + 4, pie - 10, 8, 10, pal.piedra[3]);
            px(g, x + 5, pie - 11, 6, 1, pal.piedra[3]);
            px(g, x + 5, pie - 10, 6, 10, pal.piedra[2]);
            px(g, x + 5, pie - 10, 6, 1, pal.piedra[1]);
            px(g, x + 7, pie - 8, 2, 5, pal.piedra[3]);
            px(g, x + 6, pie - 7, 4, 1, pal.piedra[3]);
            px(g, x + 4, pie - 2, 3, 2, pal.musgo[1]);
        } else if (r < 0.52) {   // una espada clavada
            px(g, x + 8, pie - 8, 1, 8, "#9aa0ae");
            px(g, x + 9, pie - 8, 1, 8, "#5f6574");
            px(g, x + 6, pie - 9, 6, 1, "#7a5a2e");
            px(g, x + 8, pie - 12, 2, 3, "#5a3a22");
            px(g, x + 8, pie - 13, 2, 1, "#c08a34");
        }
    } else if (mundo === 2) {
        if (r < 0.22) {          // cristales que crecen del suelo
            const violeta = ruido(c, f, 78) < 0.4;
            const [claro, medio] = violeta ? [pal.cristal[2], pal.cristal[3]] : [pal.cristal[0], pal.cristal[1]];
            for (const [dx, alto] of [[6, 7], [3, 4], [10, 5]]) {
                const a = alto + Math.floor(ruido(c, f, dx) * 3);
                px(g, x + dx, pie - a, 2, a, medio);
                px(g, x + dx, pie - a, 1, a, claro);
                px(g, x + dx, pie - a - 1, 1, 1, claro);
            }
        } else if (r < 0.32) {   // hongos que dan luz
            for (const dx of [4, 9]) {
                const alto = 3 + Math.floor(ruido(c, f, dx) * 3);
                px(g, x + dx + 1, pie - alto, 1, alto, "#9aa6c4");
                px(g, x + dx - 1, pie - alto - 2, 5, 2, "#2dd4bf");
                px(g, x + dx, pie - alto - 3, 3, 1, "#5eead4");
                px(g, x + dx, pie - alto - 2, 1, 1, "#ccfbf1");
            }
        } else if (r < 0.44) {   // cascotes
            px(g, x + 3, pie - 2, 4, 2, pal.piedra[2]);
            px(g, x + 9, pie - 3, 3, 3, pal.piedra[3]);
            px(g, x + 9, pie - 3, 2, 1, pal.piedra[1]);
        }
    } else if (mundo === 3) {
        if (r < 0.26) {          // un montón de nieve
            for (let i = 0; i < 10; i++) {
                const alto = Math.round(Math.sin((i / 9) * Math.PI) * 3);
                if (alto > 0) px(g, x + 3 + i, pie - alto, 1, alto, i < 5 ? "#f4f7fc" : "#c5d2e6");
            }
        } else if (r < 0.36) {   // pasto helado
            for (let i = 0; i < 4; i++) {
                const alto = 2 + Math.floor(ruido(c, f, 10 + i) * 3);
                px(g, x + 4 + i * 2, pie - alto, 1, alto, "#a7c4de");
            }
        } else if (r < 0.43) {   // una roca con nieve
            px(g, x + 4, pie - 4, 8, 4, pal.piedra[2]);
            px(g, x + 5, pie - 5, 6, 2, "#f4f7fc");
        } else if (r < 0.48) {   // un arbusto seco
            for (const [a, b, l] of [[7, 0, 6], [5, -2, 4], [10, 2, 4]]) {
                px(g, x + a, pie - l, 1, l, "#2a3048");
                px(g, x + a + Math.sign(b), pie - l, 1, 1, "#2a3048");
            }
        }
    } else {
        if (r < 0.1) {           // una calavera
            px(g, x + 5, pie - 5, 6, 4, "#cfc8b8");
            px(g, x + 6, pie - 1, 4, 1, "#a8a090");
            px(g, x + 6, pie - 4, 2, 2, "#1c1314");
            px(g, x + 9, pie - 4, 1, 2, "#1c1314");
            px(g, x + 5, pie - 5, 6, 1, "#e7e2d4");
        } else if (r < 0.22) {   // huesos
            px(g, x + 3, pie - 2, 7, 1, "#d8d2c2");
            px(g, x + 2, pie - 3, 2, 2, "#d8d2c2");
            px(g, x + 9, pie - 2, 2, 2, "#d8d2c2");
            px(g, x + 10, pie - 1, 4, 1, "#a8a090");
        } else if (r < 0.32) {   // cascotes
            px(g, x + 4, pie - 3, 4, 3, pal.piedra[2]);
            px(g, x + 4, pie - 3, 3, 1, pal.piedra[1]);
            px(g, x + 10, pie - 2, 3, 2, pal.piedra[3]);
        } else if (r < 0.36) {   // una espada rota
            px(g, x + 7, pie - 5, 1, 5, "#7c8596");
            px(g, x + 5, pie - 6, 5, 1, "#5a4632");
            px(g, x + 7, pie - 8, 1, 2, "#3a2a1e");
        }
    }
}

// Debajo de un techo: raíces (mundo 1), estalactitas (2), carámbanos (3) y cadenas (4).
function adornoColgante(g, x, y, c, f, mundo, pal) {
    const r = ruido(c, f, 88);
    if (mundo === 1 && r < 0.4) {
        for (let i = 0; i < 3; i++) {
            const rx = x + 2 + Math.floor(ruido(c, f, 90 + i) * 12);
            const largo = 2 + Math.floor(ruido(c, f, 93 + i) * 6);
            px(g, rx, y, 1, largo, i % 2 ? "#3a2a21" : "#4a6b2f");
            if (largo > 4) px(g, rx + 1, y + largo - 2, 1, 1, "#6f9a45");
        }
    } else if (mundo === 2 && r < 0.45) {
        for (let i = 0; i < 2; i++) {
            const rx = x + 3 + Math.floor(ruido(c, f, 90 + i) * 9);
            const largo = 3 + Math.floor(ruido(c, f, 93 + i) * 5);
            for (let k = 0; k < largo; k++) px(g, rx - (k < largo / 2 ? 1 : 0), y + k, k < largo / 2 ? 3 : 1, 1, pal.piedra[2]);
            if (ruido(c, f, 96 + i) < 0.5) px(g, rx, y + largo, 1, 1, pal.cristal[1]);
        }
    } else if (mundo === 3 && r < 0.6) {
        const [brillo, cara] = pal.hielo;
        for (let i = 0; i < 3; i++) {
            if (i && ruido(c, f, 99 + i) < 0.4) continue;
            const rx = x + 2 + Math.floor(ruido(c, f, 90 + i) * 11);
            const largo = 3 + Math.floor(ruido(c, f, 93 + i) * 7);
            for (let k = 0; k < largo; k++) {
                const w = Math.max(1, Math.round((1 - k / largo) * 3));
                px(g, rx, y + k, w, 1, cara);
                px(g, rx, y + k, 1, 1, brillo);
            }
        }
    } else if (mundo === 4 && r < 0.16) {
        const rx = x + 7;
        const largo = 6 + Math.floor(ruido(c, f, 91) * 8);
        for (let k = 0; k < largo; k += 3) {
            px(g, rx, y + k, 2, 2, "#4a4448");
            px(g, rx + (k % 6 ? 1 : 0), y + k + 2, 1, 1, "#2a2528");
        }
    }
}

// Los adornos que se mueven (se pintan en cada cuadro): el pasto del mundo 1, los destellos de los cristales y de la nieve.
// Se arman una vez, por columna, así en cada cuadro solo se miran las columnas que se ven.
function adornosVivos(n, mundo, oculta) {
    const porColumna = Array.from({ length: n.ancho }, () => []);
    const libre = (letra) => letra === "." || letra === "o";
    for (let c = 0; c < n.ancho; c++) {
        for (let f = 1; f < n.alto; f++) {
            const letra = P.celda(n, c, f);
            if (oculta(c, f) || oculta(c, f - 1) || n.escondite[`${c},${f}`] !== undefined || !libre(P.celda(n, c, f - 1))) continue;
            const x = c * CELDA;
            const y = f * CELDA;
            if (mundo === 1 && letra === "#") {
                for (let i = 0; i < 2; i++) {
                    porColumna[c].push({ tipo: "pasto", x: x + 3 + i * 7 + Math.floor(ruido(c, f, 140 + i) * 4), y, alto: 3 + Math.floor(ruido(c, f, 142 + i) * 3) });
                }
            } else if (mundo === 2 && (letra === "#" || letra === "=") && ruido(c, f - 1, 77) < 0.22) {
                porColumna[c].push({ tipo: "cristal", x: x + 6, y: y - 8, fase: ruido(c, f, 7) * 9 });
            } else if (mundo === 3 && (letra === "#" || letra === "=" || letra === "I") && ruido(c, f, 150) < 0.5) {
                porColumna[c].push({ tipo: "escarcha", x: x + Math.floor(ruido(c, f, 151) * 15), y: y + 1, fase: ruido(c, f, 152) * 9 });
            }
        }
    }
    return porColumna;
}


// ===== Lo que se pinta en cada cuadro =====

function pintarBloqueRunico(g, x, y, letra) {
    if (letra === "u") {   // ya usado: bronce apagado
        px(g, x, y, 16, 16, "#1f160e");
        px(g, x + 1, y + 1, 14, 14, "#4a3a28");
        px(g, x + 1, y + 1, 14, 1, "#5f4c34");
        for (const [a, b] of [[2, 2], [12, 2], [2, 12], [12, 12]]) px(g, x + a, y + b, 2, 2, "#2c2117");
        return;
    }
    // Un bloque de bronce con un destello que late (más fuerte y más lento cada tanto).
    px(g, x, y, 16, 16, "#2a1a08");
    px(g, x + 1, y + 1, 14, 14, "#8a6424");
    px(g, x + 1, y + 1, 14, 1, "#c08a34");
    px(g, x + 1, y + 1, 1, 14, "#b07c2c");
    px(g, x + 1, y + 14, 14, 1, "#5a3c12");
    px(g, x + 14, y + 1, 1, 14, "#5a3c12");
    for (const [a, b] of [[2, 2], [12, 2], [2, 12], [12, 12]]) px(g, x + a, y + b, 2, 2, "#4a3010");
    return true;
}

function pintarDestelloDelBloque(g, x, y, letra, reloj) {
    const brillo = 0.55 + 0.45 * Math.sin(reloj * 4 + x * 0.05);
    const runa = brillo > 0.8 ? "#fff1b8" : brillo > 0.5 ? "#fcd34d" : "#e2a530";
    // (v186) El símbolo: un destello de cuatro puntas: se entiende a la primera que el bloque guarda algo.
    px(g, x + 7, y + 3, 2, 10, runa);
    px(g, x + 3, y + 7, 10, 2, runa);
    px(g, x + 6, y + 6, 4, 4, runa);
    px(g, x + 5, y + 5, 1, 1, runa);
    px(g, x + 10, y + 5, 1, 1, runa);
    px(g, x + 5, y + 10, 1, 1, runa);
    px(g, x + 10, y + 10, 1, 1, runa);
    px(g, x + 7, y + 7, 2, 2, "#fff8dc");
    if (letra === "*") px(g, x + 3, y + 3, 1, 1, "#ffffff");
    // (v187) Cada tanto, un brillo cruza el bronce en diagonal (como el reflejo en un metal).
    const cruce = ((reloj * 0.7 + x * 0.013) % 2.4) * 12 - 4;
    if (cruce > 0 && cruce < 20) {
        g.globalAlpha = 0.5;
        for (let k = 0; k < 14; k++) {
            const bx = Math.round(cruce - k * 0.6) + 1;
            if (bx >= 1 && bx <= 13) px(g, x + bx, y + 1 + k, 2, 1, "#ffe8a8");
        }
        g.globalAlpha = 1;
    }
}

function pintarLadrillo(g, x, y, mundo) {
    const [cara, sombra, junta] = PALETAS[mundo].ladrillo;
    px(g, x, y, 16, 16, junta);
    for (let fila = 0; fila < 4; fila++) {
        const corrido = fila % 2 ? 4 : 0;
        for (let k = -1; k < 3; k++) {
            const bx = Math.max(x, x + k * 8 + corrido);
            const fin = Math.min(x + 16, x + k * 8 + corrido + 7);
            if (fin <= bx) continue;
            px(g, bx, y + fila * 4, fin - bx, 3, cara);
            px(g, bx, y + fila * 4 + 2, fin - bx, 1, sombra);
            px(g, bx, y + fila * 4, 1, 1, "#ffffff30");
        }
    }
}

function pintarMoneda(g, x, y, reloj, semilla = 0) {
    // Gira: se ve de frente, de canto y vuelta. Con borde oscuro, así se lee sobre cualquier fondo.
    const cuadro = Math.floor(reloj * 8 + semilla) % 6;
    const ancho = [8, 6, 4, 2, 4, 6][cuadro];
    const cx = x + 8 - ancho / 2;
    if (ancho <= 2) {
        px(g, cx, y + 3, 2, 10, "#8a5208");
        px(g, cx, y + 4, 1, 8, "#fde68a");
        return;
    }
    px(g, cx, y + 3, ancho, 10, "#6b3d05");
    px(g, cx + 1, y + 4, ancho - 2, 8, "#f5b730");
    px(g, cx + 1, y + 4, 1, 8, "#fde68a");
    px(g, cx + ancho - 2, y + 5, 1, 7, "#c98a12");
    px(g, cx + Math.floor(ancho / 2), y + 6, 1, 4, "#c98a12");
    if (cuadro === 0) px(g, cx + 2, y + 5, 1, 1, "#ffffff");
}

function pintarLava(g, x, y, c, reloj, pal, superficie) {
    const [amarillo, naranja, rojo, oscuro, negro] = pal.lava;
    px(g, x, y, 16, 16, rojo);
    px(g, x, y + 9, 16, 7, oscuro);
    px(g, x, y + 13, 16, 3, negro);
    // Costras oscuras que flotan despacio.
    for (let k = 0; k < 2; k++) {
        const cx = Math.floor((ruido(c, k, 5) * 16 + reloj * (2.5 + k * 1.5)) % 16);
        px(g, x + cx, y + 6 + k * 4, Math.min(4, 16 - cx), 1, k ? negro : oscuro);
    }
    if (superficie) {
        for (let i = 0; i < 16; i++) {
            const ola = Math.round(Math.sin((c * 16 + i) * 0.35 + reloj * 3) * 1.5);
            px(g, x + i, y + 2 + ola, 1, 4, naranja);
            px(g, x + i, y + 1 + ola, 1, 1, amarillo);
        }
        // Burbujas que suben y revientan.
        const vuelta = Math.floor(reloj * 0.8 + ruido(c, 3));
        const t = (reloj * 0.8 + ruido(c, 3)) % 1;
        if (ruido(c, vuelta) < 0.35) {
            const bx = x + 4 + Math.floor(ruido(c, 9) * 8);
            if (t < 0.85) px(g, bx, y + 9 - Math.floor(t * 7), 2, 2, amarillo);
            else { px(g, bx - 2, y + 1, 1, 1, amarillo); px(g, bx + 3, y, 1, 1, amarillo); }
        }
        // Una gota que salta fuera y vuelve a caer.
        const salto = (reloj * 1.3 + ruido(c, 11)) % 1;
        if (ruido(c, Math.floor(reloj * 1.3 + ruido(c, 11)), 12) < 0.18) {
            px(g, x + 8 + Math.round(salto * 5), y - Math.round(Math.sin(salto * Math.PI) * 14), 1, 2, salto < 0.5 ? amarillo : naranja);
        }
    } else {
        px(g, x, y, 16, 4, naranja);
    }
}

function pintarAntorcha(g, x, y, reloj, mundo) {
    if (mundo === 4) {   // en la muralla: un soporte de hierro
        px(g, x + 5, y + 8, 6, 2, "#3a3438");
        px(g, x + 7, y + 6, 2, 7, "#5a5056");
    } else {             // en el campo y las minas: un poste de madera
        px(g, x + 7, y + 6, 2, 10, "#4a3220");
        px(g, x + 7, y + 6, 1, 10, "#6a4a30");
        px(g, x + 5, y + 5, 6, 2, "#2e2a2a");
    }
    // La llama: cuatro dibujos que se turnan, y la punta que baila.
    const cuadro = Math.floor(reloj * 11 + x * 0.37) % 4;
    const baile = [0, 1, 0, -1][cuadro];
    const alto = [0, 1, 2, 1][cuadro];
    px(g, x + 5, y + 1, 6, 5, "#c2410c");
    px(g, x + 6, y - 1 - alto, 4, 6 + alto, "#ea580c");
    px(g, x + 7 + baile, y - 3 - alto, 2, 4, "#fb923c");
    px(g, x + 7, y + 1, 2, 3, "#fde68a");
    px(g, x + 7 + baile, y - 4 - alto, 1, 1, "#fdba74");
    const chispa = (reloj * 1.6 + x * 0.01) % 1;   // una chispa que sube y se apaga
    if (chispa < 0.6) px(g, x + 8 + Math.round(Math.sin(chispa * 9) * 2), y - 4 - Math.round(chispa * 16), 1, 1, chispa < 0.3 ? "#fde68a" : "#fb923c");
}


// ===== Sprites hechos a mano para lo que no es una criatura =====

function pintarPocion(g, x, y, reloj) {
    px(g, x + 4, y, 4, 2, "#6b4a2e");          // el corcho
    px(g, x + 4, y + 2, 4, 2, "#a8b4c4");      // el cuello de vidrio
    px(g, x + 1, y + 4, 10, 8, "#7f1d1d");
    px(g, x + 2, y + 5, 8, 6, "#dc2626");
    px(g, x + 3, y + 6, 2, 2, "#fca5a5");
    if (Math.sin(reloj * 6) > 0) px(g, x + 7, y + 8, 1, 1, "#fecaca");
}

function pintarBrasa(g, x, y, reloj) {
    // Una brasa rúnica en un pequeño brasero de hierro.
    px(g, x + 2, y + 9, 8, 3, "#3a3438");
    px(g, x + 1, y + 8, 10, 1, "#5a5056");
    const v = Math.sin(reloj * 12) > 0 ? 1 : 0;
    px(g, x + 3, y + 3 + v, 6, 5, "#ea580c");
    px(g, x + 4, y + 1 + v, 4, 5, "#fb923c");
    px(g, x + 5, y + 3, 2, 3, "#fde68a");
}

function pintarEstrella(g, x, y, reloj) {
    // La Bendición de la Llama: una chispa de cuatro puntas, blanca y dorada.
    const c = Math.floor(reloj * 10) % 2 ? "#fde68a" : "#ffffff";
    px(g, x + 5, y, 2, 12, c);
    px(g, x, y + 5, 12, 2, c);
    px(g, x + 3, y + 3, 6, 6, "#fbbf24");
    px(g, x + 4, y + 4, 4, 4, "#fff7d6");
}

function pintarAmuleto(g, x, y) {
    px(g, x + 3, y, 6, 2, "#c08a34");
    px(g, x + 1, y + 2, 10, 8, "#c08a34");
    px(g, x + 2, y + 3, 8, 6, "#9f1239");
    px(g, x + 3, y + 4, 3, 2, "#fb7185");
    px(g, x + 4, y + 10, 4, 2, "#c08a34");
}

function pintarReliquia(g, x, y, reloj) {
    // Una piedra rúnica de ámbar que flota y late, con chispas que giran alrededor.
    const flota = Math.round(Math.sin(reloj * 2.6 + x) * 2);
    const yy = y + flota;
    px(g, x + 4, yy, 4, 1, "#7c4a03");
    px(g, x + 2, yy + 1, 8, 2, "#b45309");
    px(g, x + 1, yy + 3, 10, 7, "#d97706");
    px(g, x + 2, yy + 10, 8, 2, "#b45309");
    px(g, x + 4, yy + 12, 4, 1, "#7c4a03");
    px(g, x + 2, yy + 3, 3, 3, "#fde68a");
    const runa = Math.sin(reloj * 5) > 0 ? "#fff7d6" : "#fcd34d";
    px(g, x + 6, yy + 4, 1, 5, runa);
    px(g, x + 5, yy + 6, 3, 1, runa);
    for (let i = 0; i < 2; i++) {
        const a = reloj * 3 + i * Math.PI;
        px(g, Math.round(x + 6 + Math.cos(a) * 9), Math.round(yy + 6 + Math.sin(a) * 4), 1, 1, "#fde68a");
    }
}

function pintarCofre(g, x, y, abierto) {
    px(g, x, y + 4, 14, 8, "#5a3a22");
    px(g, x, y + 4, 14, 1, "#7a5232");
    px(g, x, y + 11, 14, 1, "#2e1d10");
    px(g, x + 3, y + 4, 1, 8, "#8a8f9c");
    px(g, x + 10, y + 4, 1, 8, "#8a8f9c");
    if (abierto) {
        px(g, x, y, 14, 3, "#3a2414");
        px(g, x + 2, y + 4, 10, 2, "#1a1008");
    } else {
        px(g, x, y, 14, 5, "#6a4428");
        px(g, x, y, 14, 1, "#8a5e36");
        px(g, x + 6, y + 4, 2, 3, "#fbbf24");
    }
}

function pintarControl(g, x, y, activo, reloj) {
    // Un estandarte en un asta: gris y caído hasta que lo tocas; rojo, con su emblema, y ondeando después.
    px(g, x + 3, y + 2, 2, 46, "#5a4632");
    px(g, x + 3, y + 2, 1, 46, "#7a6044");
    px(g, x + 2, y, 4, 3, activo ? "#fbbf24" : "#6b6b78");
    if (activo) {
        for (let k = 0; k < 10; k++) {   // la tela ondea: cada columna sube y baja un poco
            const ola = Math.round(Math.sin(reloj * 6 - k * 0.7) * (k / 9) * 1.5);
            px(g, x + 5 + k, y + 4 + ola, 1, 13, k % 3 ? "#9f1239" : "#881337");
            px(g, x + 5 + k, y + 4 + ola, 1, 1, "#e11d48");
            if (k === 0 || k === 9) px(g, x + 5 + k, y + 17 + ola, 1, 2, "#9f1239");
        }
        px(g, x + 8, y + 8 + Math.round(Math.sin(reloj * 6 - 2) * 0.5), 3, 4, "#fbbf24");
    } else {
        px(g, x + 5, y + 14, 5, 12, "#4b4b56");
        px(g, x + 5, y + 14, 5, 1, "#6b6b78");
    }
}

function pintarArco(g, x, y, abierto, reloj) {
    // El Arco de la Llama: dos pilares y un arco de piedra; adentro, el fuego que te lleva al siguiente nivel.
    const piedra = "#6a6578";
    const sombra = "#3c394a";
    px(g, x - 8, y + 6, 6, 42, sombra);
    px(g, x - 8, y + 6, 4, 42, piedra);
    px(g, x + 18, y + 6, 6, 42, sombra);
    px(g, x + 18, y + 6, 4, 42, piedra);
    for (let k = 0; k < 6; k++) { px(g, x - 8, y + 10 + k * 7, 6, 1, sombra); px(g, x + 18, y + 10 + k * 7, 6, 1, sombra); }   // las hiladas
    for (let k = 0; k < 32; k++) {
        const altura = Math.round(Math.sin((k / 31) * Math.PI) * 8);
        px(g, x - 8 + k, y + 6 - altura, 1, 5, k % 7 ? piedra : sombra);
    }
    px(g, x + 6, y - 6, 4, 4, "#fbbf24");   // la gema de la clave
    if (abierto) {
        for (let k = 0; k < 6; k++) {
            const v = Math.sin(reloj * 8 + k) > 0 ? 1 : 0;
            g.fillStyle = ["rgba(251,146,60,.55)", "rgba(253,224,71,.5)", "rgba(234,88,12,.45)"][k % 3];
            g.fillRect(x - 2 + k * 3, y + 14 - (k % 3) * 3 - v, 3, 34 + (k % 3) * 3 + v);
        }
        px(g, x + 4, y + 26, 8, 22, "rgba(255, 247, 214, 0.55)");
        for (let i = 0; i < 3; i++) {   // chispas que suben dentro del arco
            const t = (reloj * 0.9 + i * 0.33) % 1;
            px(g, x + 2 + ((i * 5 + Math.floor(reloj * 3)) % 12), y + 46 - Math.round(t * 36), 1, 1, t < 0.5 ? "#fff7d6" : "#fde68a");
        }
    } else {
        for (let k = 0; k < 4; k++) px(g, x - 2 + k * 6, y + 10, 2, 38, "#2b2a33");   // barrotes: sellado
        px(g, x - 2, y + 24, 22, 2, "#2b2a33");
    }
}

function pintarPlataforma(g, x, y, ancho, mundo, tiembla) {
    const pal = PALETAS[mundo];
    const [luz, cara, sombra] = mundo === 3 ? pal.tabla : pal.piedra;
    const dx = tiembla ? (Math.random() < 0.5 ? -1 : 1) : 0;
    px(g, x + dx, y, ancho, 8, sombra);
    px(g, x + dx, y, ancho, 6, cara);
    px(g, x + dx, y, ancho, 1, luz);
    for (let i = 8; i < ancho; i += 16) px(g, x + dx + i, y + 1, 1, 5, sombra);
    px(g, x + dx + 2, y + 8, ancho - 4, 1, "rgba(0,0,0,.35)");   // su sombra
    if (tiembla !== undefined) {   // la que se derrumba tiene grietas
        px(g, x + dx + 5, y + 2, 2, 1, "#1a1820");
        px(g, x + dx + ancho - 9, y + 3, 3, 1, "#1a1820");
    }
}

function pintarMazo(g, x, y) {
    // Un bloque de piedra atado con hierro, con púas abajo.
    px(g, x, y, 30, 26, "#2a2733");
    px(g, x + 1, y + 1, 28, 24, "#5f5a6e");
    px(g, x + 1, y + 1, 28, 2, "#8a8598");
    px(g, x + 1, y + 22, 28, 3, "#3e3a4a");
    px(g, x, y + 7, 30, 3, "#4b4f5c");
    px(g, x, y + 17, 30, 3, "#4b4f5c");
    for (const bx of [3, 25]) for (const by of [8, 18]) px(g, x + bx, y + by, 2, 1, "#9aa0ae");
    px(g, x + 9, y + 11, 4, 3, "#1a1820");   // ojos tallados, serios
    px(g, x + 17, y + 11, 4, 3, "#1a1820");
    px(g, x + 10, y + 12, 2, 1, "#b91c1c");
    px(g, x + 18, y + 12, 2, 1, "#b91c1c");
    for (let i = 0; i < 5; i++) {
        px(g, x + 2 + i * 6, y + 26, 4, 2, "#7c8596");
        px(g, x + 3 + i * 6, y + 28, 2, 2, "#c5ccd8");
    }
}

// Letras de 3 × 5 puntos para los números que suben («100», «+1♥», «x2»).
const LETRAS_PIXEL = {
    0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"],
    3: ["111", "001", "011", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
    6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"],
    9: ["111", "101", "111", "001", "111"], "+": ["000", "010", "111", "010", "000"], "♥": ["10100", "11110", "11110", "01100", "00100"],
    x: ["000", "101", "010", "101", "000"],
};

// Un texto de pixel con borde oscuro alrededor (se lee sobre cualquier fondo). escala = 2 lo hace el doble de grande.
function textoPixel(g, texto, x, y, color, escala = 1) {
    const letras = [...texto].map((l) => LETRAS_PIXEL[l]).filter(Boolean);
    const ancho = letras.reduce((s, l) => s + (l[0].length + 1) * escala, -escala);
    let cx = Math.round(x - ancho / 2);
    for (const pasada of ["borde", "color"]) {
        let lx = cx;
        for (const letra of letras) {
            for (const [f, fila] of letra.entries()) {
                for (const [c, punto] of [...fila].entries()) {
                    if (punto !== "1") continue;
                    const px0 = lx + c * escala;
                    const py0 = y + f * escala;
                    if (pasada === "borde") px(g, px0 - 1, py0 - 1, escala + 2, escala + 2, "#140c22");
                    else px(g, px0, py0, escala, escala, color);
                }
            }
            lx += (letra[0].length + 1) * escala;
        }
    }
}

// El color de los puntos según cuánto valen: los combos grandes se notan.
function colorDePuntos(texto, color) {
    if (color !== "#fde68a") return color;
    const n = Number(texto);
    return n >= 1000 ? "#fbbf24" : n >= 800 ? "#fb7185" : n >= 400 ? "#fb923c" : n >= 200 ? "#fde047" : "#fef9e7";
}


// ===== Siluetas: el contorno de color de tu héroe (armadura, fuego, bendición) y el destello blanco de los golpes =====
function silueta(imagen, color) {
    if (!imagen) return null;
    const l = lienzo(imagen.width, imagen.height);
    const g = l.getContext("2d");
    g.drawImage(imagen, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, l.width, l.height);
    return l;
}

// Un borde de 1 punto alrededor del dibujo (para la armadura y el fuego).
function contorno(imagen, color) {
    const s = silueta(imagen, color);
    if (!s) return null;
    const l = lienzo(imagen.width + 2, imagen.height + 2);
    const g = l.getContext("2d");
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(s, dx, dy);
    g.globalCompositeOperation = "destination-out";
    g.drawImage(imagen, 1, 1);
    return l;
}

const suavizar = (t) => t * t * (3 - 2 * t);   // de 0 a 1, arranca y termina despacio


// ===== El pintor =====
// imagenes = { heroe, enemigos: { esqueleto: Image, … }, jefe } (todas pueden faltar: se pinta un rectángulo).
export function crearPintor(partida, imagenes = {}) {
    const n = partida.nivel;
    const mundo = partida.mundo;
    const pal = PALETAS[mundo];
    const fondos = crearFondos(mundo, partida.vista.alto);

    // Los escondites: hasta que entras, se ven como la pared que los rodea (y no se ve lo que hay adentro).
    const oculta = (c, f) => {
        const numero = n.escondite[`${c},${f}`];
        return numero !== undefined && !partida.descubiertos.has(numero);
    };
    const enEscondite = (c, f) => n.escondite[`${c},${f}`] !== undefined;
    const disfrazDe = (c, f) => {
        for (const [dc, df] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [0, -2]]) {
            const letra = P.celda(n, c + dc, f + df);
            if ((letra === "#" || letra === "=" || letra === "I") && !enEscondite(c + dc, f + df)) return letra === "I" ? "=" : letra;
        }
        return "#";
    };
    const techo = (letra) => letra === "#" || letra === "=" || letra === "I";
    const profundidad = (c, f) => {
        let k = 0;
        while (k < 3 && P.celda(n, c, f - k - 1) === "#" && !enEscondite(c, f - k - 1)) k++;
        return k;
    };

    // El terreno quieto (y sus adornos quietos), pintado una vez.
    const terreno = lienzo(n.ancho * CELDA, n.alto * CELDA);
    const gt = terreno.getContext("2d");
    const pintarEn = (c, f) => {
        if (c < 0 || f < 0 || c >= n.ancho || f >= n.alto) return;
        const x = c * CELDA;
        const y = f * CELDA;
        gt.clearRect(x, y, CELDA, CELDA);
        const letra = P.celda(n, c, f);
        if (enEscondite(c, f)) {
            pintarCelda(gt, disfrazDe(c, f), x, y, c, f, mundo, { arriba: false, abajo: false, izq: false, der: false }, 1);
            if (oculta(c, f)) {
                if (letra === "%") { px(gt, x + 6, y + 4, 1, 4, "rgba(0,0,0,.35)"); px(gt, x + 7, y + 8, 1, 3, "rgba(0,0,0,.35)"); }   // una grieta (la pista)
            } else {
                gt.fillStyle = "rgba(4, 3, 10, 0.62)";   // descubierto: la pared del fondo del cuarto, en sombra
                gt.fillRect(x, y, CELDA, CELDA);
            }
            return;
        }
        if (letra === "." || letra === "o") {   // una celda vacía: quizá lleva un adorno (sobre el suelo o colgando del techo)
            const abajo = P.celda(n, c, f + 1);
            if ((abajo === "#" || abajo === "=") && !enEscondite(c, f + 1)) adornoDeSuelo(gt, x, y, c, f, mundo, pal);
            if (f > 0 && techo(P.celda(n, c, f - 1)) && !enEscondite(c, f - 1)) adornoColgante(gt, x, y, c, f, mundo, pal);
            return;
        }
        if (letra === "+" || ANIMADAS.has(letra)) return;
        pintarCelda(gt, letra, x, y, c, f, mundo, ladosDe(n, c, f, letra, oculta), letra === "#" ? profundidad(c, f) : 0);
    };
    for (let f = 0; f < n.alto; f++) for (let c = 0; c < n.ancho; c++) pintarEn(c, f);
    const vivos = adornosVivos(n, mundo, oculta);

    const heroe = imagenes.heroe || null;
    const brillos = {
        armadura: contorno(heroe, "#cbd5e1"),
        fuego: contorno(heroe, "#fb923c"),
        bendicion: contorno(heroe, "#fde68a"),
        blanco: silueta(heroe, "#ffffff"),
        rojo: silueta(heroe, "#ef4444"),
        oro: silueta(heroe, "#fde68a"),
    };
    const jefeImagen = imagenes.jefe || null;
    const jefeBlanco = silueta(jefeImagen, "#ffffff");
    const blancos = {};   // el destello blanco de cada criatura (se hace la primera vez que hace falta)
    const blancoDe = (id) => (blancos[id] ??= silueta(imagenes.enemigos?.[id], "#ffffff"));

    // Lienzos de la vista (se ajustan al tamaño de la pantalla): la oscuridad, lo de adelante y la luz de la pantalla.
    const sombra = lienzo(8, 8);
    const frente = lienzo(8, 8);
    let luzDePantalla = null;

    // Lo que el pintor recuerda entre cuadros (no es parte del juego: solo cómo se ve).
    const memoria = {
        fase: partida.fase, irisDesde: 0, irisX: null, irisY: null, muerteX: 0, muerteY: 0,
        estela: [], ultimoReloj: -1,
    };

    function ajustarVista(ancho, alto) {
        for (const l of [sombra, frente]) if (l.width !== ancho || l.height !== alto) { l.width = ancho; l.height = alto; }
        if (!luzDePantalla || luzDePantalla.width !== ancho || luzDePantalla.height !== alto) luzDePantalla = crearLuzDePantalla(mundo, ancho, alto);
    }

    function dibujar(g) {
        const ancho = partida.vista.ancho;
        const alto = partida.vista.alto;
        const reloj = partida.reloj;
        ajustarVista(ancho, alto);
        recordarFase(reloj);
        // El temblor: una onda que se apaga (no saltos al azar), en los dos ejes, más fuerte en lo horizontal.
        const fuerza = Math.min(1, partida.temblor * 4);
        const tx = fuerza ? Math.round(Math.sin(reloj * 97) * 3 * fuerza) : 0;
        const ty = fuerza ? Math.round(Math.cos(reloj * 73) * 2 * fuerza) : 0;
        const camX = Math.round(partida.camara.x) + tx;
        const camY = Math.round(partida.camara.y);
        g.imageSmoothingEnabled = false;
        const oscuro = pal.oscuridad > 0;
        const c0 = Math.max(0, Math.floor(camX / CELDA) - 1);
        const c1 = Math.min(n.ancho - 1, Math.floor((camX + ancho) / CELDA) + 1);

        // 1. El cielo y las capas del fondo. En las cuevas, el fondo se oscurece y después brilla lo que da luz.
        pintarFondos(g, fondos, camX, ancho, alto, reloj);
        if (oscuro) {
            prepararOscuridad(camX, camY, ancho, alto, c0, c1);
            g.drawImage(sombra, 0, 0);
            pintarBrillosDeFondo(g, fondos, camX, ancho, alto, reloj);
        }

        // 2. Lo de adelante (terreno, criaturas, tu héroe…). En las cuevas se pinta aparte, para oscurecerlo solo a él.
        const gf = oscuro ? frente.getContext("2d") : g;
        if (oscuro) { gf.imageSmoothingEnabled = false; gf.clearRect(0, 0, ancho, alto); }
        gf.save();
        gf.translate(0, ty);
        pintarAdelante(gf, camX, camY, ancho, alto, reloj, c0, c1);
        gf.restore();
        if (oscuro) {
            gf.globalCompositeOperation = "source-atop";   // la oscuridad solo cae donde hay algo pintado
            gf.drawImage(sombra, 0, 0);
            gf.globalCompositeOperation = "source-over";
            g.drawImage(frente, 0, 0);
        }

        // 3. Las luces que suman (antorchas, lava, fuego, cristales): encima de la oscuridad.
        g.save();
        g.translate(0, ty);
        pintarLuces(g, camX, camY, reloj, c0, c1);
        g.restore();

        // 4. El ambiente, los destellos de la pantalla, la viñeta y el iris.
        pintarAmbiente(g, mundo, camX, ancho, alto, reloj);
        if (partida.destello > 0) {   // un golpe: la pantalla se tiñe de rojo un instante
            g.globalAlpha = Math.min(0.32, partida.destello * 1.2);
            px(g, 0, 0, ancho, alto, "#b91c1c");
        }
        if (partida.fogonazo > 0) {   // algo grande (golpe al jefe, bendición): un fogonazo blanco
            g.globalAlpha = Math.min(0.55, partida.fogonazo * 1.6);
            px(g, 0, 0, ancho, alto, "#fff7e0");
        }
        if (partida.fase === "muriendo") {   // al caer, todo se apaga un poco
            g.globalAlpha = Math.min(0.35, (1.9 - partida.espera) * 0.5);
            px(g, 0, 0, ancho, alto, "#12040a");
        }
        g.globalAlpha = 1;
        g.drawImage(luzDePantalla, 0, 0);
        pintarIris(g, camX, camY, ancho, alto, reloj);
    }

    function pintarAdelante(g, camX, camY, ancho, alto, reloj, c0, c1) {
        // Lo que cambió en el terreno (una puerta que se cierra…) se vuelve a pintar.
        for (const { c, f } of partida.cambios) {
            for (const [dc, df] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) pintarEn(c + dc, f + df);
        }
        partida.cambios = [];
        g.drawImage(terreno, camX, camY, ancho, alto, 0, 0, ancho, alto);

        // Los adornos que se mueven (pasto, destellos).
        pintarAdornosVivos(g, camX, camY, reloj, c0, c1);

        // Las celdas animadas que se ven.
        const golpe = new Map(partida.golpeados.map((b) => [`${b.c},${b.f}`, b]));
        for (let f = 0; f < n.alto; f++) {
            for (let c = c0; c <= c1; c++) {
                const letra = P.celda(n, c, f);
                if (!ANIMADAS.has(letra) || oculta(c, f)) continue;
                const b = golpe.get(`${c},${f}`);
                const salto = b ? -Math.round(Math.sin((1 - b.t / 0.2) * Math.PI) * 4) : 0;
                const x = c * CELDA - camX;
                const y = f * CELDA - camY + salto;
                if (letra === "o") pintarMoneda(g, x, y, reloj, c * 0.7);
                else if (letra === "B") pintarLadrillo(g, x, y, mundo);
                else if (letra === "~") pintarLava(g, x, y, c, reloj, pal, P.celda(n, c, f - 1) !== "~");
                else if (letra === "T") pintarAntorcha(g, x, y, reloj, mundo);
                else if (pintarBloqueRunico(g, x, y, letra)) pintarDestelloDelBloque(g, x, y, letra, reloj);
            }
        }

        // Las cosas del nivel: plataformas, cofres, estandartes, reliquias y el Arco.
        for (const p of partida.plataformas) pintarPlataforma(g, Math.round(p.x - camX), Math.round(p.y - camY), p.ancho, mundo);
        for (const d of partida.derrumbes) {
            if (d.estado !== "ido") pintarPlataforma(g, Math.round(d.x - camX), Math.round(d.y - camY), d.ancho, mundo, d.estado === "tiembla");
        }
        for (const k of partida.cofres) {
            if (!oculta(Math.floor(k.x / CELDA), Math.floor(k.y / CELDA))) pintarCofre(g, Math.round(k.x - camX), Math.round(k.y - camY), k.abierto);
        }
        for (const k of partida.controles) pintarControl(g, k.c * CELDA - camX + 4, (k.f - 2) * CELDA - camY, k.activo, reloj);
        for (const r of n.reliquias) if (!partida.reliquias.has(r.i) && !oculta(r.c, r.f)) pintarReliquia(g, r.c * CELDA - camX + 2, r.f * CELDA - camY + 1, reloj);
        if (n.meta) pintarArco(g, n.meta.c * CELDA - camX, (n.meta.f - 2) * CELDA - camY, partida.metaAbierta, reloj);

        // Objetos, enemigos, el jefe y los disparos.
        for (const o of partida.objetos) {
            const x = Math.round(o.x - camX);
            const y = Math.round(o.y - camY);
            if (o.saliendo > 0) {   // mientras sale del bloque, solo se ve lo que asoma por encima
                g.save();
                g.beginPath();
                g.rect(x - 2, -10, 16, Math.round(o.base - camY) + 10);
                g.clip();
            }
            if (o.tipo === "pocion") pintarPocion(g, x, y, reloj);
            else if (o.tipo === "brasa") pintarBrasa(g, x, y, reloj);
            else if (o.tipo === "bendicion") pintarEstrella(g, x, y, reloj);
            else pintarAmuleto(g, x, y);
            if (o.saliendo > 0) g.restore();
        }
        for (const e of partida.enemigos) pintarEnemigo(g, e, camX, camY, reloj);
        for (const k of partida.cadenas) {
            for (let i = 1; i <= k.eslabones; i++) {
                const x = Math.round(k.cx + Math.cos(k.angulo) * i * 10 - camX);
                const y = Math.round(k.cy + Math.sin(k.angulo) * i * 10 - camY);
                px(g, x - 3, y - 3, 6, 6, "#ea580c");
                px(g, x - 2, y - 2, 4, 4, "#fb923c");
                px(g, x - 1, y - 1, 2, 2, "#fde68a");
            }
        }
        if (partida.jefe) pintarJefe(g, partida.jefe, camX, camY, reloj);
        for (const p of partida.proyectiles) pintarProyectil(g, p, camX, camY, reloj);
        for (const b of partida.disparos) {
            const x = Math.round(b.x - camX);
            const y = Math.round(b.y - camY);
            const giro = Math.floor(reloj * 16) % 2;
            px(g, x - Math.sign(b.vx) * 4 + 1, y + 2, 4, 2, "rgba(234,88,12,.5)");   // la cola
            px(g, x, y + giro, 6, 6 - giro, "#ea580c");
            px(g, x + 1, y + 1, 4, 4, "#fb923c");
            px(g, x + 2, y + 2, 2, 2, "#fde68a");
        }

        // Tu héroe (con su sombra en el suelo y, con la bendición, una estela).
        pintarHeroe(g, camX, camY, reloj);

        // Partículas y números que suben.
        for (const p of partida.particulas) pintarParticula(g, p, camX, camY, reloj);
        for (const t of partida.textos) {
            const edad = (t.max || 0.9) - t.vida;
            if (t.vida < 0.2 && Math.floor(reloj * 20) % 2) continue;   // al final, parpadea antes de irse
            const salto = edad < 0.12 ? Math.round((1 - edad / 0.12) * 3) : 0;   // aparece con un saltito
            const grande = Number(t.texto) >= 1000;
            textoPixel(g, t.texto, t.x - camX, Math.round(t.y - camY) - salto, colorDePuntos(t.texto, t.color), grande ? 2 : 1);
        }
    }

    function pintarAdornosVivos(g, camX, camY, reloj, c0, c1) {
        const h = partida.heroe;
        const pies = h.y + h.alto;
        const centro = h.x + h.ancho / 2;
        const [luz, medio, oscuro] = pal.borde;
        for (let c = c0; c <= c1; c++) {
            for (const a of vivos[c]) {
                const x = a.x - camX;
                const y = a.y - camY;
                if (a.tipo === "pasto") {
                    // El viento lo mece; si pasas por encima, se aparta hacia el otro lado.
                    let mece = Math.round(Math.sin(reloj * 2.3 + a.x * 0.15) * 0.8);
                    if (Math.abs(a.x - centro) < 7 && Math.abs(pies - a.y) < 6) mece = a.x < centro ? -2 : 2;
                    for (const [dx, extra, color] of [[-1, -1, oscuro], [0, 0, medio], [1, -2, oscuro]]) {
                        const largo = Math.max(1, a.alto + extra);
                        const base = Math.ceil(largo / 2);
                        px(g, x + dx, y - base, 1, base, color);
                        px(g, x + dx + mece + (dx < 0 ? -1 : dx > 0 ? 1 : 0) * (largo > 3 ? 1 : 0), y - largo, 1, largo - base, color === medio ? luz : medio);
                    }
                } else if (a.tipo === "cristal") {
                    if (Math.sin(reloj * 1.3 + a.fase) > 0.95) { px(g, x - 1, y, 3, 1, "#ffffff"); px(g, x, y - 1, 1, 3, "#ffffff"); }
                } else if (a.tipo === "escarcha") {
                    if (Math.sin(reloj * 1.7 + a.fase) > 0.93) px(g, x, y, 1, 1, "#ffffff");
                }
            }
        }
    }

    // Dónde está el suelo debajo de un punto (para la sombra). Devuelve su altura o null.
    function sueloDebajo(cx, pies) {
        const c = Math.floor(cx / CELDA);
        for (let f = Math.max(0, Math.floor((pies - 1) / CELDA)); f < n.alto && f < Math.floor(pies / CELDA) + 6; f++) {
            const letra = P.celda(n, c, f);
            if ((P.esSolida(letra) || P.esTabla(letra)) && f * CELDA >= pies - 1 && !oculta(c, f)) return f * CELDA;
        }
        return null;
    }

    function pintarSombra(g, cx, pies, ancho, camX, camY) {
        const suelo = sueloDebajo(cx, pies);
        if (suelo === null) return;
        const lejos = Math.min(1, (suelo - pies) / 90);
        const w = Math.max(4, Math.round(ancho * (1 - lejos * 0.6)));
        g.globalAlpha = 0.38 * (1 - lejos);
        px(g, Math.round(cx - w / 2 - camX), suelo - camY - 1, w, 2, "#05030a");
        px(g, Math.round(cx - w / 2 - camX) + 1, suelo - camY - 2, w - 2, 1, "#05030a");
        g.globalAlpha = 1;
    }

    function pintarHeroe(g, camX, camY, reloj) {
        const h = partida.heroe;
        if (partida.fase === "fin") return;
        const jugando = partida.fase === "jugando";
        const ancho = heroe ? heroe.width : 22;
        const alto = heroe ? heroe.height : 30;
        const centro = Math.round(h.x + h.ancho / 2 - camX);
        const pies = Math.round(h.y + h.alto + 1 - camY);
        if (partida.fase !== "muriendo") pintarSombra(g, h.x + h.ancho / 2, h.y + h.alto, 16, camX, camY);

        // La estela de la bendición: copias doradas que se quedan atrás.
        if (memoria.ultimoReloj !== reloj && Math.floor(reloj * 30) !== Math.floor(memoria.ultimoReloj * 30)) {
            memoria.estela.unshift({ x: h.x, y: h.y, mira: h.mira });
            memoria.estela.length = Math.min(memoria.estela.length, 6);
        }
        memoria.ultimoReloj = reloj;
        if (h.bendicion > 0 && brillos.oro && jugando) {
            for (const [i, paso] of memoria.estela.entries()) {
                if (i % 2 === 0 || i > 5) continue;
                g.globalAlpha = 0.32 - i * 0.05;
                dibujarFigura(g, brillos.oro, Math.round(paso.x + h.ancho / 2 - camX), Math.round(paso.y + h.alto + 1 - camY), paso.mira, 1, 1);
            }
            g.globalAlpha = 1;
        }
        if (h.inmune > 0 && jugando && Math.floor(reloj * 14) % 2) return;   // parpadea

        // Estirar y aplastar: al despegar se estira; al caer de alto, se aplasta un instante.
        let ex = 1;
        let ey = 1;
        if (jugando || partida.fase === "meta") {
            if (h.aterrizaje > 0) { const t = h.aterrizaje / 0.12; ey = 1 - 0.16 * t; ex = 1 + 0.14 * t; }
            else if (!h.enSuelo && h.vy < -160) { ey = 1.08; ex = 0.92; }
            else if (!h.enSuelo && h.vy > 260) { ey = 1.05; ex = 0.95; }
        }
        if (partida.fase === "meta") g.globalAlpha = Math.max(0, Math.min(1, (partida.espera - 0.8) / 0.9));   // entra en la luz del Arco

        const poder = h.bendicion > 0 ? "bendicion" : h.poder;
        const brillo = brillos[poder];
        if (brillo && partida.fase !== "muriendo") {
            const a = g.globalAlpha;
            if (poder === "bendicion") g.globalAlpha = a * (0.6 + 0.4 * Math.sin(reloj * 20));
            dibujarFigura(g, brillo, centro, pies + 1, h.mira, ex, ey);
            g.globalAlpha = a;
        }
        if (heroe) {
            // Al caminar, las piernas se alternan; quieto, respira (el cuerpo baja un punto cada tanto).
            const piernas = Math.round(alto * 0.27);
            const cuerpo = alto - piernas;
            const corre = h.enSuelo && Math.abs(h.vx) > 8;
            const paso = corre ? Math.floor(h.andar / 7) % 2 : -1;
            const respira = jugando && h.enSuelo && !corre && Math.floor(reloj * 1.6) % 2 ? 1 : 0;
            const enAire = !h.enSuelo && jugando;
            const anchoD = Math.round(ancho * ex);
            const piernasD = Math.max(1, Math.round(piernas * ey));
            const cuerpoD = Math.max(1, Math.round(cuerpo * ey));
            const x0 = centro - Math.floor(anchoD / 2);
            const y0 = pies - piernasD - cuerpoD;
            g.save();
            if (h.mira > 0) { g.translate(centro * 2, 0); g.scale(-1, 1); }   // tu héroe (de la Torre) mira a la izquierda
            g.drawImage(heroe, 0, 0, ancho, cuerpo, x0, y0 + (paso === 1 ? 1 : 0) + respira, anchoD, cuerpoD - respira);
            const mitad = Math.floor(ancho / 2);
            const mitadD = Math.round(mitad * ex);
            const arribaIzq = paso === 0 || enAire ? 1 : 0;
            const arribaDer = paso === 1 ? 1 : 0;
            g.drawImage(heroe, 0, cuerpo, mitad, piernas, x0, y0 + cuerpoD - arribaIzq, mitadD, piernasD);
            g.drawImage(heroe, mitad, cuerpo, ancho - mitad, piernas, x0 + mitadD, y0 + cuerpoD - arribaDer, anchoD - mitadD, piernasD);
            const blanco = h.cambio > 0 && Math.floor(reloj * 20) % 2 ? brillos.blanco : null;
            const rojo = partida.fase === "muriendo" ? brillos.rojo : null;
            if (blanco || rojo) {
                g.globalAlpha = rojo ? 0.45 : 1;
                g.drawImage(blanco || rojo, x0, y0, anchoD, cuerpoD + piernasD);
            }
            if (h.lanzando > 0) px(g, x0, y0 + 12, 3, 3, "#fde68a");   // el destello de la mano al lanzar fuego
            g.restore();
        } else {
            px(g, centro - 5, pies - 26, 10, 26, "#c4b5fd");
        }
        g.globalAlpha = 1;
    }

    // Un dibujo entero (contorno o silueta) con los pies en (centro, pies), mirando a un lado y estirado ex × ey.
    function dibujarFigura(g, imagen, centro, pies, mira, ex, ey) {
        const w = Math.round(imagen.width * ex);
        const hh = Math.round(imagen.height * ey);
        g.save();
        if (mira > 0) { g.translate(centro * 2, 0); g.scale(-1, 1); }
        g.drawImage(imagen, centro - Math.floor(w / 2), pies - hh, w, hh);
        g.restore();
    }

    function pintarEnemigo(g, e, camX, camY, reloj) {
        if (!e.activo && !e.vivo) return;
        if (!e.vivo && e.estado === "aplastado" && e.t > 0.45) return;
        if (e.conducta === "mazo") {
            if (e.vivo) pintarMazo(g, Math.round(e.x - camX), Math.round(e.y - camY));
            return;
        }
        const imagen = imagenes.enemigos?.[e.def.id] || null;
        const lado = e.def.dibujo;
        let ancho = lado;
        let alto = lado;
        let x = e.x + e.ancho / 2 - lado / 2;
        let y = e.y + e.alto - lado;   // los pies del dibujo, en los pies de la caja
        let voltear = e.mira < 0;      // las criaturas de la Torre miran a la derecha
        let alReves = false;
        if (e.conducta === "trampa") {
            // La raíz asoma de la urna: solo se ve lo que ya salió.
            if (e.salida <= 0.02) return;
            y = e.y + e.def.alto - lado * e.salida - 2;
            g.save();
            g.beginPath();
            g.rect(Math.round(x - camX) - 2, -40, lado + 4, Math.round(e.y + e.def.alto - camY) + 40);
            g.clip();
        }
        if (e.conducta === "volador") alto = Math.round(lado * (Math.sin(reloj * 14 + e.x) > 0 ? 1 : 0.82));   // aleteo
        if (e.conducta === "caparazon" && e.estado !== "normal") {   // escondido en su caparazón
            alto = Math.round(lado * 0.62);
            y = e.y + e.alto - alto;
            if (e.estado === "rueda") voltear = Math.floor(reloj * 14) % 2 === 0;
        }
        if (e.conducta === "saltador" && e.enSuelo && e.espera < 0.25) { alto = Math.round(lado * 0.8); ancho = Math.round(lado * 1.12); x -= (ancho - lado) / 2; y = e.y + e.alto - alto; }
        if (!e.vivo && e.estado === "aplastado") { alto = Math.round(lado * 0.4); ancho = Math.round(lado * 1.15); x -= (ancho - lado) / 2; y = e.y + e.alto - alto; }
        if (!e.vivo && e.estado === "cae") alReves = true;
        if (e.conducta === "arana") {
            px(g, Math.round(e.x + e.ancho / 2 - camX), Math.round(e.origen.y - 6 - camY), 1, Math.round(e.y - e.origen.y + 8), "rgba(220,220,235,.55)");
        }
        if (e.conducta === "torreta" && e.t < 0.2 && e.vivo) {   // el destello del disparo
            g.fillStyle = e.def.disparo === "esquirla" ? "rgba(186,230,253,.5)" : "rgba(251,146,60,.5)";
            g.fillRect(Math.round(x - camX) - 2, Math.round(y - camY) - 2, lado + 4, lado + 4);
        }
        if (e.conducta === "ascua" && e.estado === "espera") { if (e.conducta === "trampa") g.restore(); return; }
        // Los que caminan dan un saltito en cada paso (así se ven vivos, no deslizándose).
        const camina = e.vivo && e.enSuelo && Math.abs(e.vx) > 1 && (e.conducta === "caminante" || (e.conducta === "caparazon" && e.estado === "normal"));
        if (camina) y -= Math.floor(reloj * 7 + e.origen.x * 0.1) % 2;
        if (e.vivo && e.enSuelo && e.conducta !== "trampa") {   // su sombra
            g.globalAlpha = 0.3;
            px(g, Math.round(e.x + 1 - camX), Math.round(e.y + e.alto - camY) - 1, e.ancho - 2, 2, "#05030a");
            g.globalAlpha = 1;
        }
        const sx = Math.round(x - camX);
        const sy = Math.round(y - camY);
        g.save();
        g.translate(sx + ancho / 2, sy + alto / 2);
        g.scale(voltear ? -1 : 1, alReves ? -1 : 1);
        if (imagen) g.drawImage(imagen, -ancho / 2, -alto / 2, ancho, alto);
        else px(g, -ancho / 2, -alto / 2, ancho, alto, "#7c3aed");
        if (e.golpeEn !== undefined && reloj - e.golpeEn < 0.12 && imagen) g.drawImage(blancoDe(e.def.id), -ancho / 2, -alto / 2, ancho, alto);   // le dio el fuego
        g.restore();
        if (e.conducta === "trampa") g.restore();
    }

    function pintarJefe(g, j, camX, camY, reloj) {
        if (j.vencido && j.t > 1.6) return;
        const lado = j.def.dibujo;
        const x = Math.round(j.x + j.ancho / 2 - lado / 2 - camX);
        const y = Math.round(j.y + j.alto - lado - camY + (j.especie === "dragon" ? 10 : 2));
        if (!j.vencido) pintarSombra(g, j.x + j.ancho / 2, j.y + j.alto, j.ancho + 6, camX, camY);
        g.save();
        g.translate(x + lado / 2, 0);
        if (j.mira < 0) g.scale(-1, 1);
        g.translate(-lado / 2, 0);
        if (j.vencido) g.globalAlpha = Math.max(0, 1 - j.t / 1.6);
        else if (j.inmune > 0 && Math.floor(reloj * 16) % 2) g.globalAlpha = 0.4;
        const temblando = j.vencido ? Math.round(Math.sin(reloj * 60) * 2) : 0;   // al caer vencido, tiembla
        if (jefeImagen) g.drawImage(jefeImagen, temblando, y, lado, lado);
        else px(g, temblando, y, lado, lado, "#9f1239");
        // Antes de embestir (o al herirlo) destella en blanco.
        const destella = (j.estado === "aviso" && Math.floor(reloj * 12) % 2) || (j.inmune > 0.8) || (j.vencido && Math.floor(reloj * 10) % 2);
        if (destella && jefeBlanco) { g.globalAlpha = 0.7; g.drawImage(jefeBlanco, temblando, y, lado, lado); }
        g.restore();
        if (j.vulnerable && !j.vencido) {
            // Aturdido o cansado: estrellitas que giran sobre su cabeza (¡ahora puedes pisarlo!).
            for (let i = 0; i < 3; i++) {
                const a = reloj * 4 + (i * Math.PI * 2) / 3;
                const sx = Math.round(j.x + j.ancho / 2 + Math.cos(a) * 12 - camX);
                const sy = Math.round(j.y - 6 + Math.sin(a) * 3 - camY);
                px(g, sx - 1, sy, 3, 1, "#fde68a");
                px(g, sx, sy - 1, 1, 3, "#fde68a");
            }
        }
    }

    function pintarProyectil(g, p, camX, camY, reloj) {
        const x = Math.round(p.x - camX);
        const y = Math.round(p.y - camY);
        if (p.tipo === "bola") {
            px(g, x - Math.sign(p.vx || 1) * 4 + 2, y + 3, 4, 2, "rgba(251,146,60,.45)");
            px(g, x, y, 8, 8, "#9a3412");
            px(g, x + 1, y + 1, 6, 6, "#ea580c");
            px(g, x + 2, y + 2, 4, 4, "#fbbf24");
            px(g, x + 3, y + 2, 2, 2, "#fef3c7");
        } else if (p.tipo === "esquirla") {
            px(g, x + 1, y, 4, 6, "#7dd3fc");
            px(g, x, y + 2, 6, 2, "#bae6fd");
            px(g, x + 2, y + 1, 1, 3, "#ffffff");
        } else if (p.tipo === "roca") {
            px(g, x, y + 1, 10, 8, "#3a3644");
            px(g, x + 1, y, 8, 10, "#5f5a6e");
            px(g, x + 2, y + 1, 3, 2, "#8a8598");
        } else if (p.tipo === "onda") {
            for (let i = 0; i < 3; i++) {
                const h = 4 + ((i + Math.floor(reloj * 12)) % 3) * 3;
                px(g, x + i * 4, y + 12 - h, 3, h, i === 1 ? "#c4b5a0" : "#8a7c68");
            }
        } else if (p.tipo === "rayo") {
            if (p.aviso > 0) {   // el aviso: una marca que parpadea en el suelo
                if (Math.floor(reloj * 10) % 2) {
                    px(g, x - 2, y + p.alto - 3, 12, 3, "rgba(253, 224, 71, 0.85)");
                    for (let k = 0; k < p.alto; k += 12) px(g, x + 3, y + k, 2, 4, "rgba(253, 224, 71, 0.25)");
                }
            } else {
                px(g, x, y, 8, p.alto, "rgba(191, 219, 254, 0.55)");
                for (let k = 0; k < p.alto; k += 6) {
                    const zig = Math.floor(ruido(k, Math.floor(reloj * 20)) * 5) - 2;
                    px(g, x + 3 + zig, y + k, 2, 6, "#ffffff");
                }
            }
        } else if (p.tipo === "pilar") {
            if (p.aviso > 0) {
                if (Math.floor(reloj * 10) % 2) px(g, x - 1, y + p.alto - 3, 14, 3, "rgba(251, 146, 60, 0.9)");
            } else {
                for (let k = 0; k < p.alto; k += 4) {
                    const w = 12 - (Math.floor(reloj * 18 + k) % 3);   // las llamas tiemblan
                    px(g, x + (12 - w) / 2, y + p.alto - k - 4, w, 4, k < 16 ? "#fde047" : k < 40 ? "#fb923c" : "#ea580c");
                }
            }
        }
    }

    function pintarParticula(g, p, camX, camY, reloj) {
        const x = Math.round(p.x - camX);
        const y = Math.round(p.y - camY);
        const resto = Math.max(0, Math.min(1, p.vida / (p.max || 0.5)));   // 1 = recién nacida, 0 = se va
        if (p.tipo === "moneda") pintarMoneda(g, x - 4, y - 4, reloj * 3);
        else if (p.tipo === "escombro") {
            const [cara, sombra] = PALETAS[p.mundo || mundo].ladrillo;
            const gira = Math.floor(reloj * 14 + p.vx) % 2;   // da vueltas en el aire
            px(g, x, y, gira ? 5 : 4, gira ? 4 : 5, sombra);
            px(g, x, y, gira ? 4 : 3, gira ? 3 : 4, cara);
        } else if (p.tipo === "hueso") {
            px(g, x, y, 5, 2, "#e7e2d4");
            px(g, x - 1, y - 1, 2, 2, "#e7e2d4");
            px(g, x + 4, y + 1, 2, 2, "#e7e2d4");
        } else if (p.tipo === "polvo") {
            // Una nubecita que se agranda y se desvanece (de nieve en las cumbres, de ceniza en la fortaleza).
            const lado = 2 + Math.round((1 - resto) * 3);
            g.globalAlpha = 0.65 * resto;
            px(g, x - Math.floor(lado / 2), y - Math.floor(lado / 2), lado, lado, mundo === 3 ? "#eef3fb" : mundo === 4 ? "#8b7d7b" : mundo === 2 ? "#8c93b0" : "#c9b89c");
            g.globalAlpha = 1;
        } else if (p.tipo === "estrella") {
            // El golpe: una estrella de cuatro puntas que se abre y se apaga en un instante.
            const r = Math.round(2 + (1 - resto) * (p.grande ? 10 : 5));
            const color = resto > 0.5 ? "#ffffff" : "#fde68a";
            px(g, x - r, y, r * 2 + 1, 1, color);
            px(g, x, y - r, 1, r * 2 + 1, color);
            px(g, x - 1, y - 1, 3, 3, color);
            if (p.grande) { px(g, x - r + 2, y - r + 2, 1, 1, color); px(g, x + r - 2, y - r + 2, 1, 1, color); px(g, x - r + 2, y + r - 2, 1, 1, color); px(g, x + r - 2, y + r - 2, 1, 1, color); }
        } else if (p.tipo === "anillo") {
            // Un aro que se agranda (al tomar una moneda o un poder).
            const r = Math.round(3 + (1 - resto) * (p.radio || 10));
            g.globalAlpha = resto;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                px(g, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1, p.color || "#fde68a");
            }
            g.globalAlpha = 1;
        } else if (p.tipo === "brillo") {
            const color = p.color || "#fde68a";
            px(g, x - 1, y, 3, 1, color);
            px(g, x, y - 1, 1, 3, color);
        } else {   // chispa, ascua
            const lado = resto > 0.4 ? 2 : 1;
            px(g, x, y, lado, lado, p.color || "#fde68a");
        }
    }

    // La oscuridad de las cuevas y la fortaleza, con luz alrededor del héroe, antorchas, lava y fuego.
    function prepararOscuridad(camX, camY, ancho, alto, c0, c1) {
        const s = sombra.getContext("2d");
        const sello = selloDeLuz();
        s.globalCompositeOperation = "source-over";
        s.clearRect(0, 0, ancho, alto);
        s.globalAlpha = 1;
        s.fillStyle = `rgba(4, 3, 10, ${pal.oscuridad})`;
        s.fillRect(0, 0, ancho, alto);
        s.globalCompositeOperation = "destination-out";
        const luz = (x, y, radio, fuerza = 1) => {
            s.globalAlpha = fuerza;
            s.drawImage(sello, x - radio, y - radio, radio * 2, radio * 2);
        };
        const h = partida.heroe;
        const parpadeo = 1 + Math.sin(partida.reloj * 9) * 0.04;
        luz(h.x + h.ancho / 2 - camX, h.y + 8 - camY, (h.poder === "fuego" || h.bendicion > 0 ? 96 : 78) * parpadeo);
        for (let f = 0; f < n.alto; f++) {
            for (let c = c0; c <= c1; c++) {
                const letra = P.celda(n, c, f);
                if (oculta(c, f)) continue;
                if (letra === "T") luz(c * CELDA + 8 - camX, f * CELDA + 2 - camY, 50 * parpadeo);
                else if (letra === "~" && P.celda(n, c, f - 1) !== "~" && c % 2 === 0) luz(c * CELDA + 8 - camX, f * CELDA - camY, 34, 0.8);
                else if (letra === "o" || letra === "?" || letra === "!" || letra === "*" || letra === "$") luz(c * CELDA + 8 - camX, f * CELDA + 8 - camY, 14, 0.5);
            }
            if (mundo === 2) for (let c = c0; c <= c1; c++) for (const a of vivos[c]) if (a.tipo === "cristal" && Math.floor(a.y / CELDA) === f) luz(a.x - camX, a.y - camY, 22, 0.55);
        }
        for (const r of n.reliquias) if (!partida.reliquias.has(r.i) && !oculta(r.c, r.f)) luz(r.c * CELDA + 8 - camX, r.f * CELDA + 8 - camY, 26, 0.8);
        for (const b of partida.disparos) luz(b.x + 3 - camX, b.y + 3 - camY, 26, 0.9);
        for (const p of partida.proyectiles) if (p.tipo === "bola" || (p.tipo === "pilar" && !p.aviso)) luz(p.x + p.ancho / 2 - camX, p.y + p.alto / 2 - camY, 28, 0.8);
        for (const k of partida.cadenas) luz(k.cx - camX, k.cy - camY, 64, 0.7);
        for (const e of partida.enemigos) if (e.vivo && e.activo && e.def.id === "ascua") luz(e.x + 5 - camX, e.y + 5 - camY, 30, 0.9);
        if (n.meta) luz(n.meta.c * CELDA + 8 - camX, (n.meta.f - 1) * CELDA - camY, partida.metaAbierta ? 60 : 30);
        for (const k of partida.controles) if (k.activo) luz(k.c * CELDA + 8 - camX, (k.f - 1) * CELDA - camY, 40, 0.8);
        const j = partida.jefe;
        if (j && j.activo) luz(j.x + j.ancho / 2 - camX, j.y + j.alto / 2 - camY, 70, 0.7);
        s.globalAlpha = 1;
        s.globalCompositeOperation = "source-over";
    }

    // Las luces que suman (encima de todo): el halo tibio de las antorchas, la lava, el fuego y los cristales.
    function pintarLuces(g, camX, camY, reloj, c0, c1) {
        for (let f = 0; f < n.alto; f++) {
            for (let c = c0; c <= c1; c++) {
                const letra = P.celda(n, c, f);
                if (letra !== "T" && letra !== "~") continue;
                if (oculta(c, f)) continue;
                if (letra === "T") brillar(g, [251, 146, 60], 26, c * CELDA + 8 - camX, f * CELDA + 1 - camY, 0.42 + 0.1 * Math.sin(reloj * 13 + c));
                else if (c % 2 === 0 && P.celda(n, c, f - 1) !== "~") brillar(g, [251, 120, 40], 22, c * CELDA + 16 - camX, f * CELDA + 2 - camY, 0.4 + 0.12 * Math.sin(reloj * 2 + c));
            }
        }
        if (mundo === 2) for (let c = c0; c <= c1; c++) for (const a of vivos[c]) if (a.tipo === "cristal") brillar(g, [56, 189, 216], 14, a.x - camX, a.y - camY + 3, 0.35);
        for (const b of partida.disparos) brillar(g, [251, 146, 60], 14, b.x + 3 - camX, b.y + 3 - camY, 0.6);
        for (const p of partida.proyectiles) if (p.tipo === "bola" || (p.tipo === "pilar" && !p.aviso)) brillar(g, [251, 120, 40], 18, p.x + p.ancho / 2 - camX, p.y + p.alto / 2 - camY, 0.5);
        for (const k of partida.cadenas) brillar(g, [251, 146, 60], 30, k.cx + Math.cos(k.angulo) * 30 - camX, k.cy + Math.sin(k.angulo) * 30 - camY, 0.35);
        for (const r of n.reliquias) if (!partida.reliquias.has(r.i) && !oculta(r.c, r.f)) brillar(g, [251, 191, 36], 18, r.c * CELDA + 8 - camX, r.f * CELDA + 8 - camY, 0.4 + 0.15 * Math.sin(reloj * 3));
        if (n.meta && partida.metaAbierta) brillar(g, [253, 186, 116], partida.fase === "meta" ? 60 : 36, n.meta.c * CELDA + 8 - camX, (n.meta.f - 1) * CELDA - camY, partida.fase === "meta" ? 0.8 : 0.4);
        const h = partida.heroe;
        if (partida.fase === "jugando" && (h.poder === "fuego" || h.bendicion > 0)) {
            brillar(g, h.bendicion > 0 ? [253, 230, 138] : [251, 146, 60], 22, h.x + h.ancho / 2 - camX, h.y + 10 - camY, h.bendicion > 0 ? 0.5 : 0.25);
        }
        // Al renacer: una columna de luz donde vuelves a aparecer.
        const renace = reloj - memoria.irisDesde;
        if (memoria.renacio && renace >= 0 && renace < 0.7) {
            const a = 1 - renace / 0.7;
            g.globalCompositeOperation = "lighter";
            g.globalAlpha = a * 0.5;
            px(g, Math.round(h.x + h.ancho / 2 - camX) - 5, 0, 10, Math.round(h.y + h.alto - camY), "#fde68a");
            g.globalAlpha = a * 0.7;
            px(g, Math.round(h.x + h.ancho / 2 - camX) - 2, 0, 4, Math.round(h.y + h.alto - camY), "#fff7e0");
            g.globalAlpha = 1;
            g.globalCompositeOperation = "source-over";
        }
    }

    // Recuerda en qué fase está la partida, para saber cuándo abrir o cerrar el iris.
    function recordarFase(reloj) {
        const fase = partida.fase;
        if (fase === memoria.fase) return;
        const h = partida.heroe;
        if (fase === "muriendo") { memoria.muerteX = h.x + h.ancho / 2; memoria.muerteY = h.y + h.alto / 2; }
        if (fase === "jugando" && memoria.fase === "muriendo") { memoria.irisDesde = reloj; memoria.renacio = true; }
        if (fase === "meta") { memoria.muerteX = h.x + h.ancho / 2; memoria.muerteY = h.y + h.alto / 2; }
        memoria.fase = fase;
    }

    // El iris: un círculo que se abre al entrar al nivel o al renacer, y se cierra al caer o al llegar al Arco.
    function pintarIris(g, camX, camY, ancho, alto, reloj) {
        const h = partida.heroe;
        const maximo = Math.hypot(ancho, alto);
        let radio = maximo;
        let cx = h.x + h.ancho / 2 - camX;
        let cy = h.y + h.alto / 2 - camY;
        if (partida.fase === "fin") radio = 0;
        else if (partida.fase === "muriendo" && partida.espera < 0.6) {
            radio = maximo * suavizar(partida.espera / 0.6);
            cx = memoria.muerteX - camX;
            cy = Math.min(alto - 30, memoria.muerteY - camY);
        } else if (partida.fase === "meta" && partida.espera < 0.7) {
            radio = maximo * suavizar(partida.espera / 0.7);
            cx = memoria.muerteX - camX;
            cy = memoria.muerteY - camY;
        } else if (partida.fase === "jugando") {
            const desde = Math.max(memoria.renacio ? memoria.irisDesde : 0, 0);
            const t = (reloj - desde) / 0.55;
            if (t < 1) radio = maximo * suavizar(Math.max(0, t));
        }
        if (radio >= maximo) return;
        radio = Math.max(0, Math.round(radio / 2) * 2);   // de a 2 puntos: el borde se ve pixelado
        g.fillStyle = "#05030a";
        g.beginPath();
        g.rect(0, 0, ancho, alto);
        if (radio > 0) g.arc(cx, cy, radio, 0, Math.PI * 2);
        g.fill("evenodd");
    }

    return { dibujar };
}

// Las letras que se pintan en CADA cuadro (son animadas o pueden cambiar): no van en el lienzo del terreno.
const ANIMADAS = new Set(["o", "?", "!", "*", "$", "u", "B", "~", "T"]);
const SOLIDAS_PARA_BORDES = (l) => l === "#" || l === "=" || l === "%" || l === "I" || l === "B" || l === "u";

// pareceMuro(c, f) = true si esa celda es parte de un escondite sin descubrir (desde afuera se ve como pared).
function ladosDe(nivel, c, f, letra, pareceMuro = () => false) {
    const otro = (dc, df) => {
        if (pareceMuro(c + dc, f + df)) return true;
        const vecina = P.celda(nivel, c + dc, f + df);
        return letra === "#" ? vecina === "#" || vecina === "%" : SOLIDAS_PARA_BORDES(vecina);
    };
    return { arriba: f > 0 && !otro(0, -1), abajo: !otro(0, 1) && f < nivel.alto - 1, izq: !otro(-1, 0), der: !otro(1, 0) };
}

// Una miniatura de un mundo (para las tarjetas del mapa): su cielo, sus capas y una franja de su suelo. Devuelve un lienzo.
export function miniaturaDeMundo(mundo, ancho = 240, alto = 96) {
    const fondos = crearFondos(mundo, 240);
    const l = lienzo(ancho, alto);
    const g = l.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(fondos.cielo, 0, 0, ancho, alto);
    // Las capas se apoyan abajo, a su tamaño (se ve la parte de abajo de cada una: montañas, árboles, torres).
    const capas = fondos.capas.filter((capa) => capa.lienzo);
    capas.forEach((capa, i) => {
        const x = -Math.round((i * 47) % ANCHO_FONDO);
        const y = alto - capa.lienzo.height + 18;
        g.drawImage(capa.lienzo, x, y);
        if (capa.brillo) {
            g.globalCompositeOperation = "lighter";
            g.globalAlpha = 0.6;
            g.drawImage(capa.brillo, x, y);
            g.globalAlpha = 1;
            g.globalCompositeOperation = "source-over";
        }
    });
    // Una franja de suelo, con su borde (pasto, roca, nieve o muralla).
    for (let c = 0; c < Math.ceil(ancho / CELDA); c++) {
        pintarCelda(g, "#", c * CELDA, alto - 14, c, 1, mundo, { arriba: true, abajo: false, izq: false, der: false });
    }
    if (mundo === 4) {   // y un poco de lava
        const pal = PALETAS[4];
        for (let c = 6; c < 9; c++) pintarLava(g, c * CELDA, alto - 14, c, 0.4, pal, true);
    }
    g.drawImage(crearLuzDePantalla(mundo, ancho, alto), 0, 0);
    return l;
}

export { PALETAS };
