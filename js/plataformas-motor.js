// plataformas-motor.js — El motor de «La Senda del Reino» (v185): todo lo que se MUEVE en una partida.
//
// No dibuja ni toca la pantalla (eso es dibujo-plataformas.js y app-plataformas.js): solo calcula. Así se puede probar
// sin abrir el juego: las pruebas crean una partida, «aprietan» botones y miran qué pasó.
//
//   const partida = crearPartida("1-1", { ventajas });
//   paso(partida, { izquierda, derecha, saltar, fuego }, PASO);   // 120 veces por segundo
//
// Los sonidos y avisos no se reproducen aquí: se anotan en partida.sonidos y partida.avisos y app-plataformas.js los saca.
// Cuando la partida termina, partida.resultado = { gano, puntos, reliquias, tiempo, monedas, enemigos }.
//
// (v187) El «jugo» (lo que hace que un golpe se SIENTA): polvo al correr y aterrizar, estrellas al pisar, aros al tomar
// monedas… son partículas de partida.particulas. Y tres números que solo miran el dibujo y la app:
//   destello (s) = la pantalla se tiñe de rojo (te golpearon) · fogonazo (s) = un destello blanco (algo grande)
//   congelar (s) = la app detiene el juego un instante («hit-stop»): así un golpe fuerte pesa. El motor no lo usa.

import * as P from "./plataformas.js";

const { CELDA, FISICA, HEROE } = P;

// Un número «al azar» que siempre sale igual para la misma semilla (así cada partida es repetible).
function azarFijo(semilla) {
    let s = semilla >>> 0 || 1;
    return () => {
        s ^= s << 13; s >>>= 0;
        s ^= s >> 17;
        s ^= s << 5; s >>>= 0;
        return s / 4294967296;
    };
}

const signo = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const acercar = (valor, meta, cuanto) => (valor < meta ? Math.min(meta, valor + cuanto) : Math.max(meta, valor - cuanto));
const centroX = (a) => a.x + a.ancho / 2;
const centroY = (a) => a.y + a.alto / 2;


// ===== Crear la partida =====

// opciones.ventajas: lo que te da tu equipo (arcade.ventajasDelEquipo): escudos (≥ 1 = empiezas con armadura),
// vidasExtra, fuerza (las bolas de fuego dañan más a los jefes), zona (la bendición dura más) y suerte (monedas).
// opciones.def: (para las pruebas) un nivel hecho a mano, { id, mundo, tiempo, filas, jefe?, arena? }, en vez de uno de los de verdad.
export function crearPartida(nivelId, opciones = {}) {
    const def = opciones.def || P.POR_ID[nivelId];
    if (!def) throw new Error("Ese nivel no existe.");
    const ventajas = { escudos: 0, vidasExtra: 0, fuerza: 1, zona: 1, suerte: 1, ...opciones.ventajas };
    const nivel = P.prepararNivel(def);
    const partida = {
        def, nivel, mundo: def.mundo, ventajas,
        vista: { ancho: opciones.vistaAncho || 256, alto: P.VISTA_FILAS * CELDA },
        camara: { x: 0, y: 0 },
        vidas: P.VIDAS + (ventajas.vidasExtra || 0),
        monedas: 0, puntos: 0, tiempo: def.tiempo, usado: 0,
        reliquias: new Set(), control: -1, descubiertos: new Set(),   // descubiertos = los escondites que ya encontraste
        enemigos: [], objetos: [], disparos: [], proyectiles: [], particulas: [], textos: [],
        plataformas: [], derrumbes: [], cadenas: [], cofres: [], controles: [], golpeados: [], multi: {},
        jefe: null, puerta: null, metaAbierta: !def.jefe,
        fase: "jugando", reloj: 0, temblor: 0, espera: 0, combo: 0, destello: 0, fogonazo: 0, congelar: 0,
        sonidos: [], avisos: [], cambios: [], terminado: false, resultado: null,
        antes: { saltar: false, fuego: false },
        enemigosVencidos: 0,
        azar: azarFijo([...nivelId].reduce((s, letra) => s * 31 + letra.charCodeAt(0), 7)),
    };
    poblar(partida);
    nacer(partida);
    return partida;
}

// Pone en el nivel todo lo que se mueve: enemigos, plataformas, cofres, el jefe…
function poblar(partida) {
    const n = partida.nivel;
    for (const e of n.enemigos) partida.enemigos.push(crearEnemigo(partida, e.letra, e.c, e.f));
    for (const p of n.plataformas) {
        const x0 = p.c * CELDA;
        const y0 = p.f * CELDA;
        const plataforma = { tipo: p.tipo, x: x0, y: y0, ancho: 3 * CELDA, alto: 8, fase: 0, dx: 0, dy: 0 };
        if (p.tipo === "lado") Object.assign(plataforma, { desde: x0, hasta: p.hasta * CELDA });
        else Object.assign(plataforma, { desde: y0, hasta: p.hasta * CELDA });
        plataforma.velocidad = p.tipo === "lado" ? 46 : 38;
        partida.plataformas.push(plataforma);
    }
    for (const d of n.derrumbes) {
        partida.derrumbes.push({ x0: d.c * CELDA, y0: d.f * CELDA, x: d.c * CELDA, y: d.f * CELDA, ancho: d.ancho * CELDA, alto: 8,
                                 estado: "quieto", t: 0, vy: 0, dx: 0, dy: 0 });
    }
    for (const g of n.cadenas) {
        // Unas giran a un lado y otras al otro (según su columna), y no todas empiezan en el mismo ángulo.
        partida.cadenas.push({ cx: g.c * CELDA + 8, cy: g.f * CELDA + 8, angulo: (g.c * 0.7) % (Math.PI * 2),
                               velocidad: g.c % 2 ? 1.7 : -1.5, eslabones: 5 });
    }
    for (const k of n.cofres) partida.cofres.push({ x: k.c * CELDA + 1, y: k.f * CELDA + 4, ancho: 14, alto: 12, abierto: false });
    for (const [i, k] of n.controles.entries()) partida.controles.push({ i, c: k.c, f: k.f, x: k.c * CELDA, y: (k.f - 2) * CELDA, ancho: CELDA, alto: 3 * CELDA, activo: false });
    if (n.jefe) partida.jefe = crearJefe(partida, n.jefe.c, n.jefe.f);
}

function crearEnemigo(partida, letra, c, f) {
    const def = P.ENEMIGOS[letra];
    const e = {
        letra, def, conducta: def.conducta, ancho: def.ancho, alto: def.alto,
        x: c * CELDA + (CELDA - def.ancho) / 2, y: (f + 1) * CELDA - def.alto,
        vx: 0, vy: 0, mira: -1, activo: false, vivo: true, estado: "normal", t: 0, golpesFuego: 0, enSuelo: false,
        origen: { x: c * CELDA + (CELDA - def.ancho) / 2, y: (f + 1) * CELDA - def.alto }, celda: { c, f },
        espera: partida.azar() * 1.5,
    };
    if (def.conducta === "trampa") {          // sale de la urna que está en su celda
        e.y = f * CELDA - def.alto;
        e.salida = 0;                          // 0 = escondida, 1 = afuera del todo
        e.estado = "dentro";
    } else if (def.conducta === "ascua") {    // espera bajo la lava
        e.y = (f + 1) * CELDA;
        e.origen.y = e.y;
        e.estado = "espera";
    } else if (def.conducta === "arana") {    // cuelga del techo de su celda
        e.y = f * CELDA + 2;
        e.origen.y = e.y;
        e.estado = "arriba";
    } else if (def.conducta === "mazo") {     // un bloque de 2 × 2 celdas que cae
        e.x = c * CELDA + 1;
        e.y = f * CELDA + 1;
        e.origen = { x: e.x, y: e.y };
        e.estado = "arriba";
    } else if (def.conducta === "volador" || def.conducta === "picado") {
        e.y = f * CELDA + (CELDA - def.alto) / 2;
        e.origen.y = e.y;
    }
    return e;
}

function crearJefe(partida, c, f) {
    const especie = partida.def.jefe;
    const def = P.JEFES[especie];
    const [a0, a1] = partida.def.arena;
    const j = {
        especie, def, nombre: def.nombre, ancho: def.ancho, alto: def.alto,
        x: c * CELDA + CELDA / 2 - def.ancho / 2, y: (f + 1) * CELDA - def.alto,
        vx: 0, vy: 0, mira: -1, vida: def.golpes, dano: 0, estado: "espera", t: 0, inmune: 0, ciclo: 0,
        activo: false, vencido: false, vulnerable: false, enSuelo: false,
        arena: { x0: (a0 + 1) * CELDA, x1: Math.min(partida.nivel.ancho, a1 + 1) * CELDA },
        suelo: (f + 1) * CELDA,   // la altura del piso de la arena (donde pisa el jefe al empezar)
    };
    j.inicio = { x: j.x, y: j.y };
    if (especie === "dragon") {   // el dragón empieza volando, alto (fila 4)
        j.y = 4 * CELDA;
        j.inicio.y = j.y;
    }
    return j;
}

// Pone al héroe en el inicio o en el último punto de control, con una vida nueva.
function nacer(partida) {
    const n = partida.nivel;
    const control = partida.controles[partida.control];
    const lugar = control ? { c: control.c, f: control.f } : n.inicio;
    partida.heroe = {
        x: lugar.c * CELDA + (CELDA - HEROE.ancho) / 2, y: (lugar.f + 1) * CELDA - HEROE.alto,
        ancho: HEROE.ancho, alto: HEROE.alto, vx: 0, vy: 0, enSuelo: true, mira: 1,
        poder: partida.ventajas.escudos >= 1 ? "armadura" : "normal",
        inmune: control ? 2 : 0, bendicion: 0, coyote: 0, buffer: 0, saltando: false, sobre: null,
        andar: 0, aterrizaje: 0, lanzando: 0, cambio: 0, abajoAntes: 0,
    };
    partida.tiempo = partida.def.tiempo;
    partida.usado = 0;
    partida.fase = "jugando";
    partida.combo = 0;
    partida.disparos = [];
    partida.proyectiles = [];
    for (const d of partida.derrumbes) Object.assign(d, { x: d.x0, y: d.y0, estado: "quieto", t: 0, vy: 0 });
    // Si caíste ante el jefe, vuelve a empezar la pelea (con toda su vida) y la puerta se abre.
    const j = partida.jefe;
    if (j && !j.vencido) {
        const nuevo = crearJefe(partida, partida.nivel.jefe.c, partida.nivel.jefe.f);
        Object.assign(j, nuevo);
        abrirPuerta(partida);
    }
    partida.camara.x = limitarCamara(partida, centroX(partida.heroe) - partida.vista.ancho / 2);
    partida.camara.y = Math.max(0, n.alto * CELDA - partida.vista.alto);
}


// ===== Un paso del juego =====
// entrada = { izquierda, derecha, saltar, fuego }: qué botones están apretados ahora mismo.
export function paso(partida, entrada, dt = P.PASO) {
    if (partida.terminado) return;
    const pulso = {
        saltar: Boolean(entrada.saltar) && !partida.antes.saltar,   // recién apretado (no sostenido)
        fuego: Boolean(entrada.fuego) && !partida.antes.fuego,
    };
    partida.antes = { saltar: Boolean(entrada.saltar), fuego: Boolean(entrada.fuego) };
    partida.reloj += dt;
    partida.temblor = Math.max(0, partida.temblor - dt);
    partida.destello = Math.max(0, partida.destello - dt);
    partida.fogonazo = Math.max(0, partida.fogonazo - dt);

    if (partida.fase === "jugando") {
        partida.tiempo -= dt;
        partida.usado += dt;
        if (partida.tiempo <= 0) {
            partida.tiempo = 0;
            morir(partida);
        }
        if (partida.tiempo < 60 && partida.tiempo + dt >= 60) partida.sonidos.push("aviso");
        moverPlataformas(partida, dt);
        moverHeroe(partida, entrada, pulso, dt);
        for (const e of partida.enemigos) moverEnemigo(partida, e, dt);
        if (partida.jefe) moverJefe(partida, partida.jefe, dt);
        moverObjetos(partida, dt);
        moverDisparos(partida, dt);
        moverProyectiles(partida, dt);
        for (const k of partida.cadenas) k.angulo += k.velocidad * dt;
        if (partida.fase === "jugando") revisarChoques(partida, entrada);
    } else if (partida.fase === "muriendo") {
        const h = partida.heroe;
        partida.espera -= dt;
        if (partida.espera < 1.4) {   // primero queda quieto un instante; después salta y cae fuera de la pantalla
            h.vy = Math.min(FISICA.caidaMax * 1.4, h.vy + FISICA.gravedad * 0.8 * dt);
            h.y += h.vy * dt;
        }
        if (partida.espera <= 0) {
            partida.vidas -= 1;
            if (partida.vidas <= 0) terminar(partida, false);
            else nacer(partida);
        }
    } else if (partida.fase === "meta") {
        partida.espera -= dt;
        const h = partida.heroe;
        h.vx = 0;
        h.vy = Math.min(FISICA.caidaMax, h.vy + FISICA.gravedad * dt);
        P.moverCuerpo(h, partida.nivel, dt);
        if (partida.espera <= 0) terminar(partida, true);
    }

    for (const g of partida.golpeados) g.t -= dt;
    partida.golpeados = partida.golpeados.filter((g) => g.t > 0);
    moverParticulas(partida, dt);
    moverCamara(partida, dt);
}

function terminar(partida, gano) {
    partida.fase = "fin";
    partida.terminado = true;
    partida.resultado = {
        gano, puntos: Math.floor(partida.puntos), reliquias: [...partida.reliquias].sort((a, b) => a - b),
        tiempo: Math.round(partida.usado), monedas: partida.monedas, enemigos: partida.enemigosVencidos,
    };
}

function sumar(partida, puntos, x, y, texto = null) {
    partida.puntos += puntos;
    if (x !== undefined) partida.textos.push({ texto: texto || `${puntos}`, x, y, vida: 0.9, max: 0.9, color: "#fde68a" });
}

// ===== El «jugo»: partículas que no cambian el juego, solo cómo se siente =====
// max = la vida con la que nace (el dibujo la usa para saber cuánto le queda).
function particula(partida, datos) {
    partida.particulas.push({ vx: 0, vy: 0, gravedad: 0, ...datos, max: datos.vida });
}

// Nubecitas de polvo (o de nieve, o de ceniza: el dibujo elige el color según el mundo).
function polvo(partida, x, y, cuantas, abre = 40, sube = 30) {
    for (let i = 0; i < cuantas; i++) {
        const lado = cuantas === 1 ? 0 : (i / (cuantas - 1)) * 2 - 1;
        particula(partida, { tipo: "polvo", x: x + lado * 3, y, vx: lado * abre, vy: -sube * (0.6 + 0.4 * Math.abs(lado)), vida: 0.32 });
    }
}

// La estrella del golpe (al pisar, romper o pegarle al jefe).
function estrella(partida, x, y, grande = false) {
    particula(partida, { tipo: "estrella", x, y, vida: grande ? 0.28 : 0.16, grande });
}


// ===== La cámara =====
function limitarCamara(partida, x) {
    const n = partida.nivel;
    let min = 0;
    let max = n.ancho * CELDA - partida.vista.ancho;
    const j = partida.jefe;
    if (j && j.activo && !j.vencido) {       // en la pelea, la cámara se queda en la arena
        min = j.arena.x0 - CELDA;
        max = j.arena.x1 - partida.vista.ancho;
    }
    if (max < min) return (min + max) / 2;
    return Math.max(min, Math.min(max, x));
}

function moverCamara(partida, dt) {
    const h = partida.heroe;
    const ancho = partida.vista.ancho;
    let objetivo = centroX(h) - ancho / 2 + h.mira * 18;   // mira un poco hacia donde vas
    const j = partida.jefe;
    if (j && j.activo && !j.vencido) {
        // En la pelea, la cámara busca el punto medio entre tú y el jefe (sin dejarte nunca fuera de la pantalla).
        const medio = (centroX(h) + centroX(j)) / 2 - ancho / 2;
        objetivo = Math.max(centroX(h) - ancho + 48, Math.min(centroX(h) - 48, medio));
    }
    const actual = partida.camara.x;
    partida.camara.x = limitarCamara(partida, actual + (objetivo - actual) * (1 - Math.exp(-dt * 5)));
    partida.camara.y = Math.max(0, partida.nivel.alto * CELDA - partida.vista.alto);
}


// ===== El héroe =====
function moverHeroe(partida, entrada, pulso, dt) {
    const h = partida.heroe;
    const n = partida.nivel;
    h.inmune = Math.max(0, h.inmune - dt);
    h.bendicion = Math.max(0, h.bendicion - dt);
    h.aterrizaje = Math.max(0, h.aterrizaje - dt);
    h.lanzando = Math.max(0, h.lanzando - dt);
    h.cambio = Math.max(0, h.cambio - dt);

    // Si estás sobre una plataforma que se mueve, te lleva con ella.
    if (h.sobre) {
        const p = h.sobre;
        if (p.dx) {
            const llevado = { x: h.x, y: h.y, ancho: h.ancho, alto: h.alto, vx: p.dx / dt, vy: 0 };
            P.moverCuerpo(llevado, n, dt);
            h.x = llevado.x;
        }
        h.y = p.y - h.alto;
    }

    // Moverse de lado: acelera hacia donde aprietas; si sueltas, frena (sobre hielo, patina).
    const direccion = (entrada.derecha ? 1 : 0) - (entrada.izquierda ? 1 : 0);
    const hielo = h.enSuelo && h.pisa === "I";
    const reglas = hielo ? FISICA.hielo : FISICA;
    if (direccion) {
        h.mira = direccion;
        let aceleracion = h.enSuelo ? reglas.aceleracion : FISICA.aceleracionAire;
        if (h.vx && signo(h.vx) !== direccion) aceleracion = h.enSuelo ? reglas.giro : FISICA.aceleracionAire * 1.6;
        h.vx = Math.max(-FISICA.velocidadMax, Math.min(FISICA.velocidadMax, h.vx + direccion * aceleracion * dt));
    } else {
        h.vx = acercar(h.vx, 0, (h.enSuelo ? reglas.friccion : FISICA.friccionAire) * dt);
    }

    // Saltar, con «tiempo de coyote» y «buffer» (ver FISICA).
    h.coyote = h.enSuelo ? FISICA.coyote : Math.max(0, h.coyote - dt);
    h.buffer = pulso.saltar ? FISICA.buffer : Math.max(0, h.buffer - dt);
    if (h.buffer > 0 && h.coyote > 0) {
        h.vy = -(FISICA.salto + Math.abs(h.vx) * FISICA.saltoCorriendo);
        h.buffer = 0;
        h.coyote = 0;
        h.saltando = true;
        h.enSuelo = false;
        h.sobre = null;
        partida.sonidos.push("salto");
        polvo(partida, centroX(h), h.y + h.alto - 1, 2, 30, 10);
    }
    // Salto variable: mientras subes con el botón apretado, la gravedad pesa menos.
    if (h.vy >= 0) h.saltando = false;
    const gravedad = h.saltando && entrada.saltar && h.vy < 0 ? FISICA.gravedadSalto : FISICA.gravedad;
    h.vy = Math.min(FISICA.caidaMax, h.vy + gravedad * dt);

    // Bolas de fuego (con la brasa rúnica): máximo 2 a la vez.
    if (pulso.fuego && h.poder === "fuego" && partida.disparos.length < 2) {
        partida.disparos.push({ x: centroX(h) + h.mira * 6 - 3, y: h.y + 8, ancho: 6, alto: 6, vx: h.mira * 210, vy: 40, vida: 1.6 });
        h.lanzando = 0.18;
        partida.sonidos.push("bola");
    }

    const estabaEnSuelo = h.enSuelo;
    const caidaAntes = h.vy;
    h.abajoAntes = h.y + h.alto;
    const res = P.moverCuerpo(h, n, dt, { esconditos: true });
    h.enSuelo = Boolean(res.suelo);
    h.pisa = res.suelo;
    h.sobre = null;

    // Las plataformas (las que se mueven, las que se derrumban y el lomo de los mazos): se pisan desde arriba.
    if (h.vy >= 0) {
        for (const p of pisables(partida)) {
            if (h.x + h.ancho <= p.x || h.x >= p.x + p.ancho) continue;
            const pies = h.y + h.alto;
            if (h.abajoAntes <= p.y + 2 + Math.abs(p.dy || 0) && pies >= p.y - 0.01) {
                h.y = p.y - h.alto;
                h.vy = 0;
                h.enSuelo = true;
                h.sobre = p;
                h.pisa = "=";
                if (p.estado === "quieto") { p.estado = "tiembla"; p.t = 0; }
                break;
            }
        }
    }
    if (h.enSuelo && !estabaEnSuelo && caidaAntes > 120) {
        h.aterrizaje = 0.12;
        polvo(partida, centroX(h), h.y + h.alto - 1, caidaAntes > 300 ? 4 : 2, 30 + caidaAntes * 0.08, 14);
    }
    // Al correr se levanta polvo detrás de los pies; al frenar en seco (o dar la vuelta), delante.
    h.polvo = Math.max(0, (h.polvo || 0) - dt);
    if (h.enSuelo && h.polvo <= 0) {
        const frena = direccion && h.vx && signo(h.vx) !== direccion && Math.abs(h.vx) > 50;
        if (frena || Math.abs(h.vx) > FISICA.velocidadMax * 0.75) {
            particula(partida, { tipo: "polvo", x: centroX(h) - signo(h.vx) * (frena ? -4 : 5), y: h.y + h.alto - 2,
                                 vx: -signo(h.vx) * 18, vy: -14, vida: frena ? 0.3 : 0.24 });
            h.polvo = frena ? 0.05 : 0.13;
        }
    }
    if (h.enSuelo) partida.combo = 0;
    h.andar = h.enSuelo && Math.abs(h.vx) > 8 ? h.andar + Math.abs(h.vx) * dt : 0;

    // Bloques golpeados con la cabeza: el que está más cerca del centro del héroe.
    if (res.arriba.length) {
        const cx = centroX(h);
        const golpeado = res.arriba.reduce((a, b) => (Math.abs((a.c + 0.5) * CELDA - cx) <= Math.abs((b.c + 0.5) * CELDA - cx) ? a : b));
        golpearBloque(partida, golpeado.c, golpeado.f);
    }

    // Caer al vacío.
    if (h.y > n.alto * CELDA + 8) morir(partida);
}

function pisables(partida) {
    const lista = [...partida.plataformas];
    for (const d of partida.derrumbes) if (d.estado !== "ido") lista.push(d);
    for (const e of partida.enemigos) if (e.vivo && e.conducta === "mazo") lista.push(e);
    return lista;
}

// Recibir un golpe: la brasa vuelve a armadura, la armadura se pierde, y sin nada… caes.
function danarHeroe(partida) {
    const h = partida.heroe;
    if (h.inmune > 0 || h.bendicion > 0 || partida.fase !== "jugando") return;
    if (h.poder === "fuego") {
        h.poder = "armadura";
    } else if (h.poder === "armadura") {
        h.poder = "normal";
    } else {
        morir(partida);
        return;
    }
    h.inmune = 1.6;
    h.cambio = 0.6;
    partida.sonidos.push("impacto");
    partida.temblor = 0.2;
    partida.destello = 0.25;
    partida.congelar = 0.07;
    chispa(partida, centroX(h), centroY(h), "#fca5a5");
}

function morir(partida) {
    if (partida.fase !== "jugando") return;
    const h = partida.heroe;
    partida.fase = "muriendo";
    partida.espera = 1.9;
    h.vx = 0;
    h.vy = -330;
    h.poder = "normal";
    h.bendicion = 0;
    partida.sonidos.push("fallo");
    partida.temblor = 0.25;
    partida.destello = 0.35;
    partida.congelar = 0.14;
}


// ===== Los bloques =====
function golpearBloque(partida, c, f) {
    const n = partida.nivel;
    const h = partida.heroe;
    const letra = P.celda(n, c, f);
    partida.golpeados.push({ c, f, t: 0.2 });
    polvo(partida, c * CELDA + 8, (f + 1) * CELDA + 1, 2, 26, -12);   // el golpe suelta polvo del bloque
    const arriba = { x: c * CELDA, y: f * CELDA - 4, ancho: CELDA, alto: 6 };
    // Lo que estaba parado encima del bloque salta (los enemigos caen vencidos).
    for (const e of partida.enemigos) {
        if (e.vivo && e.activo && e.conducta !== "mazo" && e.conducta !== "trampa" && e.conducta !== "ascua" && P.seTocan(e, arriba)) {
            vencer(partida, e, "golpe");
        }
    }
    const cambiar = (nueva) => {
        P.ponerCelda(n, c, f, nueva);
        partida.cambios.push({ c, f });
    };
    const x = c * CELDA + 8;
    const y = f * CELDA;
    if (letra === "?" || letra === "$") {
        ganarMoneda(partida, x, y - 4, true);
        if (letra === "?") cambiar("u");
        else {
            const clave = `${c},${f}`;
            partida.multi[clave] = (partida.multi[clave] || 0) + 1;
            if (partida.multi[clave] >= 10) cambiar("u");
        }
    } else if (letra === "!" || letra === "*" || letra === "+") {
        cambiar("u");
        const tipo = letra === "*" ? "bendicion" : letra === "+" ? "vida" : h.poder === "normal" ? "pocion" : "brasa";
        partida.objetos.push({ tipo, x: c * CELDA + 2, y: y - 0.01, ancho: 12, alto: 12, vx: 0, vy: 0, saliendo: 0.5, base: y, enSuelo: false });
        partida.sonidos.push("poder");
    } else if (letra === "B" && h.poder !== "normal") {
        cambiar(".");
        for (const [vx, vy] of [[-60, -260], [60, -260], [-40, -170], [40, -170], [-90, -200], [90, -200]]) {
            partida.particulas.push({ tipo: "escombro", x: x - 3, y: y + 4, vx, vy, vida: 1.2, gravedad: 900, mundo: partida.mundo });
        }
        polvo(partida, x, y + 8, 3, 50, 20);
        estrella(partida, x, y + 8);
        sumar(partida, P.PUNTOS.ladrillo);
        partida.sonidos.push("ladrillo");
    } else {
        partida.sonidos.push("bloque");
    }
}

function ganarMoneda(partida, x, y, saltando = false) {
    partida.monedas += 1;
    const valor = Math.round(P.PUNTOS.moneda * (partida.ventajas.suerte || 1));
    sumar(partida, valor);
    partida.sonidos.push("moneda");
    if (saltando) partida.particulas.push({ tipo: "moneda", x: x - 4, y: y - 8, vx: 0, vy: -240, vida: 0.45, gravedad: 900 });
    else {
        particula(partida, { tipo: "brillo", x, y: y - 2, vy: -20, vida: 0.3 });
        particula(partida, { tipo: "anillo", x, y, vida: 0.25, radio: 7 });
    }
    if (partida.monedas % P.MONEDAS_POR_VIDA === 0) ganarVida(partida);
}

function ganarVida(partida) {
    partida.vidas += 1;
    partida.sonidos.push("vidaExtra");
    const h = partida.heroe;
    partida.textos.push({ texto: "+1♥", x: centroX(h), y: h.y - 4, vida: 1.2, max: 1.2, color: "#fb7185" });
}


// ===== Plataformas =====
function moverPlataformas(partida, dt) {
    for (const p of partida.plataformas) {
        const distancia = Math.max(CELDA, Math.abs(p.hasta - p.desde));
        p.fase += dt * Math.PI * (p.velocidad / distancia) / 2;
        const ahora = p.desde + (p.hasta - p.desde) * (1 - Math.cos(p.fase)) / 2;
        if (p.tipo === "lado") { p.dx = ahora - p.x; p.dy = 0; p.x = ahora; }
        else { p.dy = ahora - p.y; p.dx = 0; p.y = ahora; }
    }
    for (const d of partida.derrumbes) {
        d.dx = 0;
        d.dy = 0;
        if (d.estado === "tiembla") {
            d.t += dt;
            if (d.t >= 0.45) { d.estado = "cae"; d.vy = 0; partida.sonidos.push("ladrillo"); }
        } else if (d.estado === "cae") {
            d.vy = Math.min(400, d.vy + 900 * dt);
            d.dy = d.vy * dt;
            d.y += d.dy;
            if (d.y > partida.nivel.alto * CELDA + 20) d.estado = "ido";
        }
    }
}


// ===== Los enemigos =====
function enVista(partida, a, margen = 40) {
    const cam = partida.camara.x;
    return a.x + a.ancho > cam - margen && a.x < cam + partida.vista.ancho + margen;
}

function moverEnemigo(partida, e, dt) {
    if (!e.vivo) {
        // Vencido: o queda aplastado un momento, o sale volando y cae fuera de la pantalla.
        e.t += dt;
        if (e.estado === "cae") {
            e.vy = Math.min(FISICA.caidaMax, e.vy + FISICA.gravedad * dt);
            e.x += e.vx * dt;
            e.y += e.vy * dt;
        }
        return;
    }
    if (!e.activo) {
        if (!enVista(partida, e, 24)) return;
        e.activo = true;
        e.mira = centroX(partida.heroe) < centroX(e) ? -1 : 1;
    }
    e.t += dt;
    const h = partida.heroe;
    const n = partida.nivel;
    const d = e.def;
    const haciaHeroe = centroX(h) < centroX(e) ? -1 : 1;

    switch (e.conducta) {
        case "caminante":
        case "caparazon": {
            if (e.conducta === "caparazon" && e.estado === "concha") {
                e.vx = 0;
                if (e.t > 6) { e.estado = "normal"; e.t = 0; e.mira = haciaHeroe; }
            } else if (e.conducta === "caparazon" && e.estado === "rueda") {
                e.vx = e.mira * 220;
                e.inmuneHeroe = Math.max(0, (e.inmuneHeroe || 0) - dt);
            } else {
                e.vx = e.mira * d.velocidad;
                if (d.cuidadoso && e.enSuelo) {
                    const col = Math.floor((e.mira > 0 ? e.x + e.ancho + 1 : e.x - 1) / CELDA);
                    const fila = Math.floor((e.y + e.alto + 2) / CELDA);
                    const abajo = P.celda(n, col, fila);
                    if (!P.esSolida(abajo) && !P.esTabla(abajo)) e.mira = -e.mira;
                }
            }
            e.vy = Math.min(FISICA.caidaMax, e.vy + FISICA.gravedad * dt);
            const res = P.moverCuerpo(e, n, dt);
            e.enSuelo = Boolean(res.suelo);
            if (res.pared) {
                e.mira = -res.pared;
                if (e.estado === "rueda") partida.sonidos.push("bloque");
            }
            // Dos que caminan y se encuentran, se dan vuelta (no se atraviesan).
            if (e.estado === "normal") {
                for (const otro of partida.enemigos) {
                    if (otro === e || !otro.vivo || !otro.activo || otro.estado !== "normal") continue;
                    if (otro.conducta !== "caminante" && otro.conducta !== "caparazon") continue;
                    if (P.seTocan(e, otro) && (centroX(otro) - centroX(e)) * e.mira > 0) e.mira = -e.mira;
                }
            }
            break;
        }
        case "volador": {
            // Patrulla de lado a lado (3 celdas a cada lado de donde nace) con un vaivén suave.
            e.x += e.mira * d.velocidad * dt;
            if (e.x < e.origen.x - 3 * CELDA) e.mira = 1;
            if (e.x > e.origen.x + 3 * CELDA) e.mira = -1;
            e.y = e.origen.y + Math.sin(e.t * 3 + e.origen.x) * 10;
            break;
        }
        case "picado": {
            if (e.estado === "normal") {
                e.y = e.origen.y + Math.sin(e.t * 2.2) * 4;
                e.x += Math.sin(e.t * 0.9) * 10 * dt;
                e.mira = haciaHeroe;
                const dx = Math.abs(centroX(h) - centroX(e));
                if (e.espera <= 0 && dx < 100 && h.y > e.y + 8) { e.estado = "apunta"; e.t = 0; }
                e.espera -= dt;
            } else if (e.estado === "apunta") {
                if (e.t > 0.45) {
                    const ang = Math.atan2(centroY(h) - centroY(e), centroX(h) - centroX(e));
                    e.vx = Math.cos(ang) * 160;
                    e.vy = Math.sin(ang) * 160;
                    e.estado = "baja";
                    e.t = 0;
                    partida.sonidos.push("graznido");
                }
            } else if (e.estado === "baja") {
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                const suelo = P.esSolida(P.celda(n, Math.floor(centroX(e) / CELDA), Math.floor((e.y + e.alto + 1) / CELDA)));
                if (e.t > 1.1 || suelo) { e.estado = "sube"; e.t = 0; }
            } else {   // sube: vuelve a su sitio
                const dx = e.origen.x - e.x;
                const dy = e.origen.y - e.y;
                const largo = Math.hypot(dx, dy);
                if (largo < 2) { e.estado = "normal"; e.t = 0; e.espera = 1.4; }
                else { e.x += (dx / largo) * 60 * dt; e.y += (dy / largo) * 60 * dt; }
            }
            break;
        }
        case "saltador": {
            e.vy = Math.min(FISICA.caidaMax, e.vy + FISICA.gravedad * dt);
            if (e.enSuelo) {
                e.vx = 0;
                e.espera -= dt;
                if (e.espera <= 0) {
                    e.vy = -300;
                    e.vx = haciaHeroe * d.velocidad;
                    e.mira = haciaHeroe;
                    e.enSuelo = false;
                    e.espera = 1.3 + partida.azar() * 0.6;
                }
            }
            const res = P.moverCuerpo(e, n, dt);
            if (res.pared) e.vx = -e.vx;
            e.enSuelo = Boolean(res.suelo) && e.vy >= 0;
            break;
        }
        case "torreta": {
            e.mira = haciaHeroe;
            e.espera -= dt;
            const dx = Math.abs(centroX(h) - centroX(e));
            const dy = Math.abs(centroY(h) - centroY(e));
            if (e.espera <= 0 && dx < 180 && dy < 110 && enVista(partida, e, 0)) {
                e.espera = 2.6;
                e.t = 0;   // para el dibujo: el destello de disparo
                disparar(partida, e, h);
            }
            break;
        }
        case "trampa": {
            // dentro (escondida) → sube → fuera → baja. No sale si estás pegado a la urna.
            const cerca = Math.abs(centroX(h) - centroX(e)) < 22 && h.y + h.alto > e.y - 6;
            const ciclo = { dentro: 2.0, sube: 0.45, fuera: 1.3, baja: 0.45 };
            if (e.t >= ciclo[e.estado]) {
                const siguiente = { dentro: "sube", sube: "fuera", fuera: "baja", baja: "dentro" }[e.estado];
                if (!(e.estado === "dentro" && cerca)) { e.estado = siguiente; e.t = 0; }
            }
            e.salida = e.estado === "dentro" ? 0 : e.estado === "fuera" ? 1 : e.estado === "sube" ? e.t / ciclo.sube : 1 - e.t / ciclo.baja;
            break;
        }
        case "ascua": {
            if (e.estado === "espera") {
                e.espera -= dt;
                if (e.espera <= 0) { e.estado = "salta"; e.vy = -390; }
            } else {
                e.vy += 900 * dt;
                e.y += e.vy * dt;
                if (e.y >= e.origen.y) { e.y = e.origen.y; e.estado = "espera"; e.espera = 1.6 + partida.azar() * 1.2; }
            }
            break;
        }
        case "arana": {
            const dx = Math.abs(centroX(h) - centroX(e));
            if (e.estado === "arriba") {
                e.espera -= dt;
                if (e.espera <= 0 && dx < 40 && h.y > e.y) { e.estado = "baja"; e.t = 0; }
            } else if (e.estado === "baja") {
                e.y += d.velocidad * dt;
                const tope = P.esSolida(P.celda(n, Math.floor(centroX(e) / CELDA), Math.floor((e.y + e.alto + 1) / CELDA)));
                if (tope || e.y > e.origen.y + 6 * CELDA) { e.estado = "espera"; e.t = 0; }
            } else if (e.estado === "espera") {
                if (e.t > 0.9) e.estado = "sube";
            } else {
                e.y -= 40 * dt;
                if (e.y <= e.origen.y) { e.y = e.origen.y; e.estado = "arriba"; e.espera = 1.2; }
            }
            break;
        }
        case "mazo": {
            e.dx = 0;
            e.dy = 0;
            const debajo = h.x + h.ancho > e.x - 6 && h.x < e.x + e.ancho + 6 && h.y > e.y;
            if (e.estado === "arriba") {
                e.espera -= dt;
                if (e.espera <= 0 && debajo) { e.estado = "cae"; e.vy = 0; }
            } else if (e.estado === "cae") {
                e.vy = Math.min(480, e.vy + 1800 * dt);
                const antes = e.y;
                const res = P.moverCuerpo(e, n, dt);
                e.dy = e.y - antes;
                if (res.suelo) {
                    e.estado = "suelo";
                    e.t = 0;
                    partida.sonidos.push("retumbo");
                    if (enVista(partida, e, 0)) partida.temblor = Math.max(partida.temblor, 0.25);
                    for (const lado of [-1, 1]) {
                        partida.particulas.push({ tipo: "polvo", x: centroX(e) + lado * 14, y: e.y + e.alto - 4, vx: lado * 50, vy: -20, vida: 0.5, gravedad: 0 });
                    }
                }
            } else if (e.estado === "suelo") {
                if (e.t > 0.9) e.estado = "sube";
            } else {
                const antes = e.y;
                e.y = Math.max(e.origen.y, e.y - 48 * dt);
                e.dy = e.y - antes;
                if (e.y <= e.origen.y) { e.estado = "arriba"; e.espera = 0.6; }
            }
            break;
        }
    }
    // Lo que cae al vacío o a la lava desaparece.
    if (e.conducta !== "ascua" && e.y > n.alto * CELDA + 16) e.vivo = false;
    if ((e.conducta === "caminante" || e.conducta === "caparazon" || e.conducta === "saltador") &&
        P.celdasQueToca({ x: e.x + 2, y: e.y + e.alto - 4, ancho: e.ancho - 4, alto: 4 }, n, (l) => l === "~").length) {
        e.vivo = false;
        e.estado = "cae";
        e.vy = -100;
    }
}

function disparar(partida, e, h) {
    const x = centroX(e);
    const y = e.y + 5;
    if (e.def.disparo === "esquirla") {
        // El Cristal gélido: tres esquirlas en abanico hacia ti.
        const base = Math.atan2(centroY(h) - y, centroX(h) - x);
        for (const giro of [-0.32, 0, 0.32]) {
            partida.proyectiles.push({ tipo: "esquirla", x: x - 3, y: y - 3, ancho: 6, alto: 6, vx: Math.cos(base + giro) * 105,
                                       vy: Math.sin(base + giro) * 105, gravedad: 0, vida: 3, solido: true });
        }
        partida.sonidos.push("hielo");
    } else {
        partida.proyectiles.push({ tipo: "bola", x: x - 4, y: y, ancho: 8, alto: 8, vx: e.mira * 95, vy: 0, gravedad: 0, vida: 4, solido: true });
        partida.sonidos.push("fuego");
    }
}

// La caja con la que un enemigo te toca (la trampa y el ascua cambian según dónde están).
function cajaDe(e) {
    if (e.conducta === "trampa") {
        const alto = e.def.alto * e.salida;
        return { x: e.x, y: e.y + e.def.alto - alto, ancho: e.ancho, alto };
    }
    return e;
}

function tangible(e) {
    if (!e.vivo || !e.activo) return false;
    if (e.conducta === "trampa") return e.salida > 0.3;
    if (e.conducta === "ascua") return e.estado === "salta" && e.y < e.origen.y - 4;
    return true;
}

function vencer(partida, e, como) {
    e.vivo = false;
    e.t = 0;
    partida.enemigosVencidos += 1;
    if (como === "pisado") {
        e.estado = "aplastado";
    } else {
        e.estado = "cae";
        e.vy = -220;
        e.vx = (como === "golpe" ? 0 : signo(e.vx || e.mira)) * 40;
    }
    const puntos = como === "concha" ? P.PUNTOS.concha : como === "fuego" ? P.PUNTOS.fuego : P.PUNTOS.pisoton;
    if (como !== "pisado") {
        sumar(partida, puntos, centroX(e), e.y);
        estrella(partida, centroX(e), centroY(e));
    }
    if (e.def.id === "esqueleto") {
        for (const [vx, vy] of [[-50, -200], [40, -240], [0, -160]]) {
            partida.particulas.push({ tipo: "hueso", x: centroX(e), y: e.y + 4, vx, vy, vida: 0.9, gravedad: 900 });
        }
    }
    partida.sonidos.push(como === "pisado" ? "pisar" : "impacto");
}


// ===== Los objetos (poderes que salen de los bloques) =====
function moverObjetos(partida, dt) {
    const n = partida.nivel;
    for (const o of partida.objetos) {
        if (o.saliendo > 0) {   // sale del bloque, subiendo despacio
            o.saliendo -= dt;
            o.y = o.base - 12 * (1 - Math.max(0, o.saliendo) / 0.5);
            if (o.saliendo <= 0) {
                o.vx = o.tipo === "brasa" ? 0 : o.tipo === "bendicion" ? 62 : 48;
                if (centroX(partida.heroe) > centroX(o) && o.tipo !== "brasa") o.vx = -o.vx;   // se aleja de ti
            }
            continue;
        }
        if (o.tipo === "brasa") continue;
        o.vy = Math.min(FISICA.caidaMax, o.vy + FISICA.gravedad * dt);
        const res = P.moverCuerpo(o, n, dt);
        if (res.pared) o.vx = -res.pared * Math.abs(o.vx || 48);
        if (res.suelo && o.tipo === "bendicion") o.vy = -250;
    }
    partida.objetos = partida.objetos.filter((o) => o.y < n.alto * CELDA + 16);
}

function tomarObjeto(partida, o) {
    const h = partida.heroe;
    particula(partida, { tipo: "anillo", x: centroX(o), y: centroY(o), vida: 0.35, radio: 14, color: o.tipo === "vida" ? "#fb7185" : "#fde68a" });
    if (o.tipo === "bendicion") partida.fogonazo = 0.18;
    sumar(partida, o.tipo === "vida" ? 0 : P.PUNTOS.poder, centroX(o), o.y, o.tipo === "vida" ? "+1♥" : null);
    if (o.tipo === "pocion") {
        if (h.poder === "normal") { h.poder = "armadura"; h.cambio = 0.6; partida.avisos.push({ texto: "🛡️ ¡Armadura!", tipo: "poder" }); }
        partida.sonidos.push("coraza");
    } else if (o.tipo === "brasa") {
        h.poder = "fuego";
        h.cambio = 0.6;
        partida.sonidos.push("fuego");
        partida.avisos.push({ texto: "🔥 ¡Brasa rúnica! Lanza fuego con 🔥", tipo: "poder" });
    } else if (o.tipo === "bendicion") {
        h.bendicion = P.BENDICION_SEGUNDOS * (partida.ventajas.zona || 1);
        partida.sonidos.push("habilidad");
        partida.avisos.push({ texto: "✨ ¡Bendición de la Llama!", tipo: "poder" });
    } else if (o.tipo === "vida") {
        partida.vidas += 1;
        partida.sonidos.push("vidaExtra");
    }
}


// ===== Disparos =====
function moverDisparos(partida, dt) {
    const n = partida.nivel;
    for (const b of partida.disparos) {
        b.vida -= dt;
        b.vy = Math.min(320, b.vy + 1100 * dt);
        const vxAntes = b.vx;
        const res = P.moverCuerpo(b, n, dt);
        if (res.suelo) b.vy = -185;
        if (res.pared || b.vx === 0) {
            b.vida = 0;
            chispa(partida, b.x + (vxAntes > 0 ? 6 : 0), b.y + 3, "#fb923c");
        }
        if (!enVista(partida, b, 16)) b.vida = 0;
        // Contra los enemigos.
        for (const e of partida.enemigos) {
            if (b.vida <= 0 || !tangible(e) || !P.seTocan(b, cajaDe(e))) continue;
            b.vida = 0;
            chispa(partida, centroX(b), centroY(b), "#fb923c");
            if (!e.def.fuego) { partida.sonidos.push("bloque"); continue; }
            e.golpesFuego += 1;
            if (e.golpesFuego >= e.def.fuego) vencer(partida, e, "fuego");
            else { partida.sonidos.push("impacto"); e.golpeEn = partida.reloj; }   // (el dibujo lo hace destellar)
        }
        const j = partida.jefe;
        if (b.vida > 0 && j && j.activo && !j.vencido && P.seTocan(b, j)) {
            b.vida = 0;
            chispa(partida, centroX(b), centroY(b), "#fb923c");
            if (j.inmune <= 0) {
                j.dano += j.def.fuego * (partida.ventajas.fuerza || 1);
                partida.sonidos.push("impacto");
                if (j.dano >= 1) { j.dano -= 1; golpearJefe(partida, j); }
            }
        }
    }
    partida.disparos = partida.disparos.filter((b) => b.vida > 0);
}

function moverProyectiles(partida, dt) {
    const n = partida.nivel;
    for (const p of partida.proyectiles) {
        p.vida -= dt;
        if (p.aviso > 0) { p.aviso -= dt; continue; }   // los rayos y pilares avisan antes de dañar
        p.vy += (p.gravedad || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.solido && P.celdasQueToca({ x: p.x + 1, y: p.y + 1, ancho: p.ancho - 2, alto: p.alto - 2 }, n, P.esSolida).length) {
            p.vida = 0;
            chispa(partida, centroX(p), centroY(p), p.tipo === "esquirla" ? "#bae6fd" : "#fb923c");
        }
        if (p.y > n.alto * CELDA + 20) p.vida = 0;
    }
    partida.proyectiles = partida.proyectiles.filter((p) => p.vida > 0);
}

function chispa(partida, x, y, color) {
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + partida.reloj;
        partida.particulas.push({ tipo: "chispa", x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, vida: 0.25, gravedad: 0, color });
    }
}

function moverParticulas(partida, dt) {
    for (const p of partida.particulas) {
        p.vida -= dt;
        p.vy += (p.gravedad || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
    }
    partida.particulas = partida.particulas.filter((p) => p.vida > 0);
    if (partida.particulas.length > 160) partida.particulas.splice(0, partida.particulas.length - 160);   // un tope, para el iPhone
    for (const t of partida.textos) {
        t.vida -= dt;
        t.y -= 26 * dt;
    }
    partida.textos = partida.textos.filter((t) => t.vida > 0);
}


// ===== Los choques del héroe con todo lo demás =====
function revisarChoques(partida, entrada) {
    const h = partida.heroe;
    const n = partida.nivel;

    // ¿Entraste a un escondite? (al cruzar su pared falsa, el cuarto se descubre)
    if (n.escondites.length) {
        for (const k of P.celdasQueToca(h, n, () => true)) {
            const numero = n.escondite[`${k.c},${k.f}`];
            if (numero !== undefined && !partida.descubiertos.has(numero)) descubrir(partida, numero);
        }
    }
    // Monedas (son letras del nivel).
    for (const m of P.celdasQueToca(h, n, (l) => l === "o")) {
        P.ponerCelda(n, m.c, m.f, ".");
        ganarMoneda(partida, m.c * CELDA + 8, m.f * CELDA + 8);
    }
    // Pinchos (la mitad de abajo de la celda) y lava.
    const pies = { x: h.x + 2, y: h.y + h.alto - 8, ancho: h.ancho - 4, alto: 8 };
    if (P.celdasQueToca(pies, n, (l) => l === "~").some((k) => h.y + h.alto > k.f * CELDA + 6)) { morir(partida); return; }
    if (P.celdasQueToca(pies, n, (l) => l === "^").some((k) => h.y + h.alto > k.f * CELDA + 8)) {
        danarHeroe(partida);
        if (partida.fase === "jugando") h.vy = -240;
        if (partida.fase !== "jugando") return;
    }

    // Enemigos.
    for (const e of partida.enemigos) {
        if (!tangible(e)) continue;
        const caja = cajaDe(e);
        if (!P.seTocan(h, caja)) continue;
        if (e.conducta === "mazo") {
            if (h.sobre === e) continue;   // parado encima del mazo: no pasa nada
            danarHeroe(partida);
            continue;
        }
        if (h.bendicion > 0) { vencer(partida, e, "bendicion"); continue; }
        const desdeArriba = h.vy > 0 && h.abajoAntes <= caja.y + 7;
        if (e.conducta === "caparazon" && e.estado === "concha") {
            patear(partida, e, desdeArriba, entrada);
            continue;
        }
        if (e.def.pisable && desdeArriba) {
            pisar(partida, e, entrada);
            continue;
        }
        if (e.conducta === "caparazon" && e.estado === "rueda" && e.inmuneHeroe > 0) continue;
        danarHeroe(partida);
        if (partida.fase !== "jugando") return;
    }
    // Una concha que rueda vence a los enemigos que encuentra.
    for (const c of partida.enemigos) {
        if (!c.vivo || c.estado !== "rueda") continue;
        for (const e of partida.enemigos) {
            // (también a los que todavía no se movían: la concha puede llegar antes que la cámara)
            if (e === c || !e.vivo || (e.activo && !tangible(e)) || e.conducta === "mazo" || e.conducta === "ascua" || e.conducta === "trampa") continue;
            if (P.seTocan(c, cajaDe(e))) vencer(partida, e, "concha");
        }
    }

    // La cadena de fuego.
    for (const k of partida.cadenas) {
        for (let i = 1; i <= k.eslabones; i++) {
            const x = k.cx + Math.cos(k.angulo) * i * 10;
            const y = k.cy + Math.sin(k.angulo) * i * 10;
            if (P.seTocan(h, { x: x - 3, y: y - 3, ancho: 6, alto: 6 })) danarHeroe(partida);
        }
    }

    // Proyectiles de los enemigos y del jefe.
    for (const p of partida.proyectiles) {
        if (p.aviso > 0 || !P.seTocan(h, { x: p.x + 1, y: p.y + 1, ancho: p.ancho - 2, alto: p.alto - 2 })) continue;
        danarHeroe(partida);
        if (p.tipo === "bola" || p.tipo === "esquirla" || p.tipo === "roca") p.vida = 0;
    }

    // El jefe.
    const j = partida.jefe;
    if (j && j.activo && !j.vencido && P.seTocan(h, j)) {
        const desdeArriba = h.vy > 0 && h.abajoAntes <= j.y + 10;
        if (desdeArriba) {
            h.vy = -(entrada.saltar ? 400 : 340);
            h.y = j.y - h.alto;
            if (j.vulnerable && j.inmune <= 0) golpearJefe(partida, j);
            else partida.sonidos.push("coraza");
        } else if (h.bendicion <= 0) {
            danarHeroe(partida);
            h.vx = (centroX(h) < centroX(j) ? -1 : 1) * 150;
        }
    }

    // Objetos (poderes).
    for (const o of partida.objetos) {
        if (o.saliendo > 0.15 || !P.seTocan(h, o)) continue;
        o.tomado = true;
        tomarObjeto(partida, o);
    }
    partida.objetos = partida.objetos.filter((o) => !o.tomado);

    // Puntos de control.
    for (const k of partida.controles) {
        if (k.activo || !P.seTocan(h, k)) continue;
        k.activo = true;
        partida.control = Math.max(partida.control, k.i);
        partida.sonidos.push("campana");
        partida.avisos.push({ texto: "🚩 Punto de control", tipo: "control" });
    }
    // Reliquias.
    for (const r of n.reliquias) {
        if (partida.reliquias.has(r.i)) continue;
        if (!P.seTocan(h, { x: r.c * CELDA + 2, y: r.f * CELDA + 1, ancho: 12, alto: 14 })) continue;
        partida.reliquias.add(r.i);
        sumar(partida, P.PUNTOS.reliquia, r.c * CELDA + 8, r.f * CELDA);
        partida.sonidos.push("habilidad");
        partida.avisos.push({ texto: `◆ Reliquia ${partida.reliquias.size} de ${n.reliquias.length}`, tipo: "reliquia" });
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            partida.particulas.push({ tipo: "chispa", x: r.c * CELDA + 8, y: r.f * CELDA + 8, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, vida: 0.5, gravedad: 0, color: "#fbbf24" });
        }
    }
    // Cofres: dan 5 monedas.
    for (const k of partida.cofres) {
        if (k.abierto || !P.seTocan(h, k)) continue;
        k.abierto = true;
        partida.sonidos.push("cofre");
        sumar(partida, P.PUNTOS.cofre);
        for (let i = 0; i < 5; i++) ganarMoneda(partida, k.x + 7 + (i - 2) * 3, k.y - 4 * i, true);
    }
    // La meta: el Arco de la Llama (si hay jefe, está sellado hasta vencerlo).
    if (n.meta && partida.metaAbierta) {
        const arco = { x: n.meta.c * CELDA, y: (n.meta.f - 2) * CELDA, ancho: CELDA, alto: 3 * CELDA };
        if (P.seTocan(h, arco)) llegarALaMeta(partida);
    }
}

function descubrir(partida, numero) {
    partida.descubiertos.add(numero);
    for (const clave of partida.nivel.escondites[numero]) {
        const [c, f] = clave.split(",").map(Number);
        partida.cambios.push({ c, f });
    }
    partida.sonidos.push("secreto");
    partida.avisos.push({ texto: "🗝️ ¡Un pasaje secreto!", tipo: "secreto" });
}

// ¿Esa celda está dentro de un escondite que todavía no encontraste? (para no dibujar lo que hay adentro)
export function escondida(partida, c, f) {
    const numero = partida.nivel.escondite[`${c},${f}`];
    return numero !== undefined && !partida.descubiertos.has(numero);
}

function pisar(partida, e, entrada) {
    const h = partida.heroe;
    h.vy = -(entrada.saltar ? FISICA.reboteAlto : FISICA.rebote);
    h.saltando = entrada.saltar;
    h.y = cajaDe(e).y - h.alto;
    partida.combo += 1;
    const puntos = P.PUNTOS.pisoton * 2 ** Math.min(3, partida.combo - 1);
    sumar(partida, puntos, centroX(e), e.y);
    estrella(partida, centroX(h), h.y + h.alto, partida.combo > 2);
    polvo(partida, centroX(e), cajaDe(e).y + 2, 2, 50, 6);
    partida.congelar = Math.max(partida.congelar, 0.035);
    if (e.conducta === "caparazon") {
        e.estado = "concha";
        e.t = 0;
        e.vx = 0;
        partida.sonidos.push("pisar");
        return;
    }
    vencer(partida, e, "pisado");
}

function patear(partida, e, desdeArriba, entrada) {
    const h = partida.heroe;
    e.estado = "rueda";
    e.t = 0;
    e.mira = centroX(h) < centroX(e) ? 1 : -1;
    e.inmuneHeroe = 0.3;
    if (desdeArriba) {
        h.vy = -(entrada.saltar ? FISICA.reboteAlto : FISICA.rebote);
        h.y = e.y - h.alto;
    }
    sumar(partida, P.PUNTOS.pisoton, centroX(e), e.y);
    partida.sonidos.push("patada");
}

function llegarALaMeta(partida) {
    partida.fase = "meta";
    partida.espera = 2.4;
    const h = partida.heroe;
    h.vx = 0;
    const bono = P.PUNTOS.meta + Math.floor(partida.tiempo) * P.PUNTOS.porSegundo;
    sumar(partida, bono, centroX(h), h.y - 6);
    partida.sonidos.push("victoria");
    partida.avisos.push({ texto: `¡Nivel superado! +${bono}`, tipo: "meta" });
    for (let i = 0; i < 16; i++) {   // chispas doradas que salen del Arco
        const a = -Math.PI / 2 + (i / 15 - 0.5) * 2.4;
        particula(partida, { tipo: "chispa", x: centroX(h), y: h.y + 8, vx: Math.cos(a) * (90 + (i % 4) * 30), vy: Math.sin(a) * (90 + (i % 4) * 30),
                             gravedad: 220, vida: 1.1, color: i % 3 ? "#fde68a" : "#fff7d6" });
    }
}


// ===== Los jefes =====
function cerrarPuerta(partida) {
    const n = partida.nivel;
    const c = partida.def.arena[0];
    partida.puerta = [];
    for (let f = 0; f < n.alto; f++) {
        if (P.celda(n, c, f) === ".") {
            P.ponerCelda(n, c, f, "=");
            partida.cambios.push({ c, f });
            partida.puerta.push(f);
        }
    }
}

function abrirPuerta(partida) {
    if (!partida.puerta) return;
    const c = partida.def.arena[0];
    for (const f of partida.puerta) {
        P.ponerCelda(partida.nivel, c, f, ".");
        partida.cambios.push({ c, f });
    }
    partida.puerta = null;
}

function golpearJefe(partida, j) {
    j.vida -= 1;
    j.inmune = 1.1;
    partida.temblor = 0.3;
    partida.sonidos.push("critico");
    chispa(partida, centroX(j), j.y + 6, "#fde68a");
    estrella(partida, centroX(j), j.y + 4, true);
    partida.congelar = 0.12;
    partida.fogonazo = 0.12;
    if (j.vida <= 0) {
        j.vencido = true;
        j.vulnerable = false;
        j.estado = "vencido";
        j.t = 0;
        j.vy = -200;
        partida.proyectiles = [];
        sumar(partida, P.PUNTOS.jefe, centroX(j), j.y);
        partida.congelar = 0.3;
        partida.fogonazo = 0.35;
        partida.temblor = 0.6;
        for (let i = 0; i < 14; i++) {   // revienta en ascuas y chispas
            const a = (i / 14) * Math.PI * 2;
            particula(partida, { tipo: "chispa", x: centroX(j), y: centroY(j), vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 60, gravedad: 300,
                                 vida: 0.8, color: i % 2 ? "#fde68a" : "#fb923c" });
        }
        partida.sonidos.push("descarga");
        partida.avisos.push({ texto: `¡Venciste a ${j.nombre}!`, tipo: "jefe" });
        partida.enemigosVencidos += 1;
        return;
    }
    // Después del golpe, el jefe se aleja de un salto y sigue (más rápido).
    j.estado = "herido";
    j.t = 0;
    j.vulnerable = false;
    j.vy = j.especie === "dragon" ? 0 : -260;
    // (el Señor de la Fragua salta en su sitio: si se alejara, podría caer a la lava)
    j.vx = j.especie === "demonio" ? 0 : (centroX(partida.heroe) < centroX(j) ? 1 : -1) * 90;
}

// Qué tan furioso está: 1 al empezar; sube con cada golpe que le das.
const furia = (j) => 1 + 0.18 * (j.def.golpes - j.vida);

function cambiarEstado(j, estado) {
    j.estado = estado;
    j.t = 0;
}

function moverJefe(partida, j, dt) {
    const h = partida.heroe;
    j.inmune = Math.max(0, j.inmune - dt);
    j.t += dt;
    if (j.vencido) {
        // Cae, se apaga y a los 1,6 s se abre la puerta y el Arco de la Llama.
        if (j.especie === "dragon") j.y += 60 * dt;
        else gravedadJefe(partida, j, dt);
        if (j.t > 1.6 && !partida.metaAbierta) {
            partida.metaAbierta = true;
            abrirPuerta(partida);
            partida.sonidos.push("logro");
            partida.avisos.push({ texto: "El Arco de la Llama se abrió →", tipo: "meta" });
        }
        return;
    }
    if (!j.activo) {
        if (h.x > j.arena.x0 + CELDA * 1.5 && partida.fase === "jugando") {
            j.activo = true;
            cerrarPuerta(partida);
            partida.sonidos.push("retumbo");
            partida.temblor = 0.4;
            partida.avisos.push({ texto: j.nombre, tipo: "jefe" });
            cambiarEstado(j, j.especie === "dragon" ? "vuela" : "anda");
        } else {
            if (j.especie !== "dragon") gravedadJefe(partida, j, dt);
            return;
        }
    }
    // Si un jefe cae al vacío o a la lava (no debería pasar), vuelve a su sitio.
    if (j.y > partida.nivel.alto * CELDA) {
        j.x = j.inicio.x;
        j.y = j.inicio.y - 8;
        j.vy = 0;
        j.vx = 0;
    }
    const hacia = centroX(h) < centroX(j) ? -1 : 1;
    if (j.estado === "herido") {
        j.vulnerable = false;
        if (j.especie === "dragon") {
            j.y = Math.max(j.inicio.y, j.y - 90 * dt);
            if (j.t > 0.7) cambiarEstado(j, "vuela");
        } else {
            gravedadJefe(partida, j, dt);
            if (j.t > 0.5 && j.enSuelo) { j.vx = 0; cambiarEstado(j, "anda"); }
        }
        return;
    }
    ({ caballero: caballero, golem: golem, dragon: dragon, demonio: demonio })[j.especie](partida, j, h, hacia, dt);
}

function gravedadJefe(partida, j, dt) {
    j.vy = Math.min(FISICA.caidaMax, j.vy + FISICA.gravedad * dt);
    const res = P.moverCuerpo(j, partida.nivel, dt, { tablas: false });
    j.enSuelo = Boolean(res.suelo);
    return res;
}

// Una onda que corre por el suelo (hay que saltarla).
function onda(partida, x, suelo, lado, velocidad) {
    partida.proyectiles.push({ tipo: "onda", x: x - 6, y: suelo - 12, ancho: 12, alto: 12, vx: lado * velocidad, vy: 0, gravedad: 0, vida: 3, solido: true });
}

// --- El Caballero sin Nombre: camina hacia ti, tira tajos, embiste y queda aturdido al chocar contra el muro ---
function caballero(partida, j, h, hacia, dt) {
    const f = furia(j);
    j.vulnerable = j.estado === "aturdido";
    if (j.estado === "anda") {
        j.mira = hacia;
        j.vx = hacia * 42 * f;
        if (Math.abs(centroX(h) - centroX(j)) < 34 && j.t > 0.4) cambiarEstado(j, "tajo");
        else if (j.t > 2.2 / f) {
            if (j.vida <= 1 && partida.azar() < 0.5) {
                j.vy = -430;
                j.vx = hacia * 120;
                cambiarEstado(j, "salto");
            } else cambiarEstado(j, "aviso");
        }
    } else if (j.estado === "tajo") {
        j.vx = j.t < 0.35 ? 0 : j.t < 0.6 ? j.mira * 170 : 0;
        if (j.t > 0.35 && j.t < 0.4) partida.sonidos.push("tajo");
        if (j.t > 0.9) cambiarEstado(j, "aviso");
    } else if (j.estado === "aviso") {
        j.vx = 0;
        j.mira = hacia;
        if (j.t > 0.75) { cambiarEstado(j, "carga"); partida.sonidos.push("carga"); }
    } else if (j.estado === "carga") {
        j.vx = j.mira * 240 * f;
    } else if (j.estado === "salto") {
        if (j.enSuelo && j.t > 0.2) {
            partida.temblor = 0.3;
            partida.sonidos.push("retumbo");
            onda(partida, centroX(j), j.y + j.alto, -1, 120);
            onda(partida, centroX(j), j.y + j.alto, 1, 120);
            j.vx = 0;
            cambiarEstado(j, "anda");
        }
    } else if (j.estado === "aturdido") {
        j.vx = 0;
        if (j.t > 2.0) cambiarEstado(j, "anda");
    }
    const res = gravedadJefe(partida, j, dt);
    if (j.estado === "carga" && res.pared) {
        cambiarEstado(j, "aturdido");
        partida.temblor = 0.35;
        partida.sonidos.push("retumbo");
        j.vx = 0;
    }
    // El tajo: la espada alcanza un poco más allá de su cuerpo.
    if (j.estado === "tajo" && j.t > 0.35 && j.t < 0.65) {
        const filo = { x: j.mira > 0 ? j.x + j.ancho : j.x - 16, y: j.y + 8, ancho: 16, alto: 16 };
        if (P.seTocan(h, filo)) danarHeroe(partida);
    }
}

// --- El Gólem de hierro: salta y hace temblar el suelo, lanza rocas y se cansa ---
function golem(partida, j, h, hacia, dt) {
    const f = furia(j);
    j.vulnerable = j.estado === "cansado";
    if (j.estado === "anda") {
        j.mira = hacia;
        j.vx = hacia * 26 * f;
        if (j.t > 1.4) {
            j.vy = -470;
            j.vx = Math.max(-150, Math.min(150, (centroX(h) - centroX(j)) / 0.9));
            cambiarEstado(j, "salta");
        }
    } else if (j.estado === "salta") {
        if (j.enSuelo && j.t > 0.2) {
            j.vx = 0;
            partida.temblor = 0.4;
            partida.sonidos.push("retumbo");
            onda(partida, centroX(j), j.y + j.alto, -1, 125 * f);
            onda(partida, centroX(j), j.y + j.alto, 1, 125 * f);
            cambiarEstado(j, "lanza");
        }
    } else if (j.estado === "lanza") {
        j.vx = 0;
        j.mira = hacia;
        const rocas = j.vida <= 2 ? 3 : 2;
        const momentos = [0.4, 0.75, 1.1].slice(0, rocas);
        for (const m of momentos) {
            if (j.t >= m && j.t - dt < m) {
                const vuelo = 1.0;
                partida.proyectiles.push({ tipo: "roca", x: centroX(j) - 5, y: j.y, ancho: 10, alto: 10,
                                           vx: (centroX(h) - centroX(j)) / vuelo + (partida.azar() - 0.5) * 30, vy: -330, gravedad: 640, vida: 4, solido: true });
                partida.sonidos.push("impacto");
            }
        }
        if (j.t > momentos[momentos.length - 1] + 0.5) {
            j.ciclo += 1;
            cambiarEstado(j, j.ciclo % 2 === 0 ? "cansado" : "anda");
        }
    } else if (j.estado === "cansado") {
        j.vx = 0;
        if (j.t > 1.9) cambiarEstado(j, "anda");
    }
    gravedadJefe(partida, j, dt);
}

// --- El Dragón de la tormenta: vuela, llama a los rayos y se lanza en picado (y queda en el suelo, cansado) ---
function dragon(partida, j, h, hacia, dt) {
    const f = furia(j);
    const suelo = j.suelo;
    const centro = (j.arena.x0 + j.arena.x1) / 2;
    const rango = (j.arena.x1 - j.arena.x0) / 2 - j.ancho;
    j.vulnerable = j.estado === "posado";
    if (j.estado === "vuela" || j.estado === "anda") {
        j.mira = hacia;
        const objetivoX = centro + Math.sin(partida.reloj * 0.9) * rango - j.ancho / 2;
        j.x += (objetivoX - j.x) * Math.min(1, dt * 1.6);
        j.y = j.inicio.y + Math.sin(partida.reloj * 2.4) * 8;
        if (j.t > 2.4 / f) {
            j.ciclo += 1;
            cambiarEstado(j, j.ciclo % 2 ? "rayos" : "picado");
            if (j.estado === "picado") {
                const ang = Math.atan2(suelo - 10 - centroY(j), centroX(h) - centroX(j));
                j.vx = Math.cos(ang) * 230 * f;
                j.vy = Math.sin(ang) * 230 * f;
                partida.sonidos.push("chillido");
            }
        }
    } else if (j.estado === "rayos") {
        if (j.t < dt * 1.5) {
            // Marca dónde van a caer los rayos (avisan 1 segundo antes).
            const cantidad = j.vida <= 2 ? 5 : 3;
            const base = Math.floor(centroX(h) / CELDA);
            for (let i = 0; i < cantidad; i++) {
                const col = base + (i - Math.floor(cantidad / 2)) * 3;
                const x = col * CELDA + 4;
                if (x < j.arena.x0 || x > j.arena.x1 - 8) continue;
                partida.proyectiles.push({ tipo: "rayo", x, y: 0, ancho: 8, alto: suelo, vx: 0, vy: 0, gravedad: 0, aviso: 1.0, vida: 1.35, solido: false });
            }
        }
        if (j.t >= 1.0 && j.t - dt < 1.0) { partida.sonidos.push("rayo"); partida.temblor = 0.2; }
        if (j.t > 1.5) cambiarEstado(j, "vuela");
    } else if (j.estado === "picado") {
        j.x += j.vx * dt;
        j.y += j.vy * dt;
        j.mira = signo(j.vx) || j.mira;
        if (j.y + j.alto >= suelo - 1 || j.t > 1.6) {
            j.y = suelo - j.alto;
            partida.temblor = 0.3;
            partida.sonidos.push("retumbo");
            cambiarEstado(j, "posado");
        }
        j.x = Math.max(j.arena.x0, Math.min(j.arena.x1 - j.ancho, j.x));
    } else if (j.estado === "posado") {
        if (j.t > 1.7) cambiarEstado(j, "despega");
    } else if (j.estado === "despega") {
        j.y -= 110 * dt;
        if (j.y <= j.inicio.y) { j.y = j.inicio.y; cambiarEstado(j, "vuela"); }
    }
}

// --- El Señor de la Fragua: salta hacia ti, lanza abanicos de fuego, levanta pilares de llamas y se cansa ---
function demonio(partida, j, h, hacia, dt) {
    const f = furia(j);
    const n = partida.nivel;
    j.vulnerable = j.estado === "cansado";
    if (j.estado === "anda") {
        j.vx = 0;
        j.mira = hacia;
        if (j.t > 0.7 / f) {
            // Elige dónde caer: cerca de ti, pero sobre piso firme (no en la lava).
            const fila = Math.floor(j.suelo / CELDA);
            const columnas = [];
            for (let c = Math.ceil(j.arena.x0 / CELDA); c < j.arena.x1 / CELDA - 1; c++) {
                if (P.esSolida(P.celda(n, c, fila)) && P.esSolida(P.celda(n, c + 1, fila))) columnas.push(c);
            }
            const objetivo = columnas.reduce((a, b) => (Math.abs(b * CELDA - centroX(h) + hacia * 40) < Math.abs(a * CELDA - centroX(h) + hacia * 40) ? b : a), columnas[0] ?? 0);
            // Con vy = −500 y la gravedad de 1500, el salto dura 2 × 500 / 1500 ≈ 0,67 s: así cae justo donde quiere.
            j.vy = -500;
            j.vx = (objetivo * CELDA + CELDA - centroX(j)) / 0.67;
            cambiarEstado(j, "salta");
        }
    } else if (j.estado === "salta") {
        if (j.enSuelo && j.t > 0.2) {
            j.vx = 0;
            partida.temblor = 0.3;
            partida.sonidos.push("retumbo");
            cambiarEstado(j, j.ciclo % 2 ? "pilares" : "bolas");
        }
    } else if (j.estado === "bolas") {
        j.mira = hacia;
        if (j.t >= 0.5 && j.t - dt < 0.5) {
            const cantidad = j.vida <= 2 ? 5 : 3;
            const base = Math.atan2(centroY(h) - (j.y + 10), centroX(h) - centroX(j));
            for (let i = 0; i < cantidad; i++) {
                const giro = (i - (cantidad - 1) / 2) * 0.24;
                partida.proyectiles.push({ tipo: "bola", x: centroX(j) - 4, y: j.y + 10, ancho: 8, alto: 8,
                                           vx: Math.cos(base + giro) * 115 * f, vy: Math.sin(base + giro) * 115 * f, gravedad: 0, vida: 4, solido: true });
            }
            partida.sonidos.push("fuego");
        }
        if (j.t > 1.1) { j.ciclo += 1; cambiarEstado(j, j.ciclo % 3 === 2 ? "cansado" : "anda"); }
    } else if (j.estado === "pilares") {
        if (j.t < dt * 1.5) {
            const base = Math.floor(centroX(h) / CELDA);
            for (const desvio of j.vida <= 2 ? [-4, -2, 0, 2, 4] : [-3, 0, 3]) {
                const x = (base + desvio) * CELDA + 2;
                if (x < j.arena.x0 || x > j.arena.x1 - 12) continue;
                partida.proyectiles.push({ tipo: "pilar", x, y: j.suelo - 4 * CELDA, ancho: 12, alto: 4 * CELDA, vx: 0, vy: 0, gravedad: 0, aviso: 0.9, vida: 1.5, solido: false });
            }
        }
        if (j.t >= 0.9 && j.t - dt < 0.9) partida.sonidos.push("fuego");
        if (j.t > 1.6) { j.ciclo += 1; cambiarEstado(j, j.ciclo % 3 === 2 ? "cansado" : "anda"); }
    } else if (j.estado === "cansado") {
        j.vx = 0;
        if (j.t > 1.6) cambiarEstado(j, "anda");
    }
    gravedadJefe(partida, j, dt);
}


// ===== Para las pruebas y para la app =====
// Qué botones mostrar: el de fuego solo si tienes la brasa rúnica.
export const tieneFuego = (partida) => partida.heroe.poder === "fuego";

// Lo que se muestra arriba (vidas, monedas, puntos, tiempo, reliquias y la vida del jefe).
export function marcador(partida) {
    const j = partida.jefe;
    return {
        vidas: partida.vidas, monedas: partida.monedas, puntos: Math.floor(partida.puntos), tiempo: Math.ceil(partida.tiempo),
        reliquias: [...partida.reliquias], totalReliquias: partida.nivel.reliquias.length,
        jefe: j && j.activo && !j.vencido ? { nombre: j.nombre, vida: j.vida, golpes: j.def.golpes } : null,
        poder: partida.heroe.poder,
    };
}

// Saca (y vacía) los sonidos y avisos pendientes.
export function sacarSonidos(partida) {
    const lista = partida.sonidos;
    partida.sonidos = [];
    return lista;
}

export function sacarAvisos(partida) {
    const lista = partida.avisos;
    partida.avisos = [];
    return lista;
}
