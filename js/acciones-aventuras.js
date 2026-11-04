// acciones-aventuras.js — Misiones principales, la campaña de jefes, logros, la tienda y la bienvenida
// (los primeros hábitos y premios).
//
// Salió de acciones.js (que lo reexporta con `export *`): en la app se sigue usando `acciones.crearPrincipal(...)`.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import * as maestro from "./maestro.js";
import * as vida from "./vida.js";
import * as eventos from "./eventos.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "./plantillas.js";
import { hoy } from "./fechas.js";
import { nuevoId, buscar, validarNombre, validarEntero, elegirAtributo, ganar, revisarQueNoEstesCaido } from "./acciones-comun.js";
import { crearMision } from "./acciones-misiones.js";

// ===== Misiones principales =====

export function crearPrincipal(estado, { nombre, atributo, submisiones }) {
    // El cuadro de texto trae una submisión por línea.
    const pasos = String(submisiones || "").split("\n").map((linea) => linea.trim()).filter(Boolean);
    if (pasos.length === 0) throw new Error("Escribe al menos una submisión (una por línea).");
    if (pasos.some((paso) => paso.length > 80)) throw new Error("Cada submisión puede tener máximo 80 letras.");

    estado.principales.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        ...elegirAtributo(estado, atributo),
        creadaEn: hoy(),
        completadaEn: null,
        archivada: false,
        submisiones: pasos.map((paso) => ({ id: nuevoId(estado), nombre: paso, hecha: false, hechaEn: null })),
    });
}

export function agregarSubmision(estado, principalId, nombre) {
    const principal = buscar(estado.principales, principalId, "esa misión principal");
    if (principal.completadaEn) throw new Error("Esa misión principal ya está completada.");
    principal.submisiones.push({ id: nuevoId(estado), nombre: validarNombre(nombre, 80), hecha: false, hechaEn: null });
}

// Si todos los pasos están hechos, completa la misión principal y da el premio extra.
function revisarPrincipal(estado, principal) {
    const celebraciones = [];
    const todasHechas = principal.submisiones.length > 0 && principal.submisiones.every((s) => s.hecha);
    if (todasHechas && !principal.completadaEn) {
        const premio = juego.PREMIOS.principal;
        principal.completadaEn = hoy();
        ganar(estado, { ...premio, atributo: principal.atributo });
        celebraciones.push({
            icono: "🏁",
            etiqueta: "Misión principal completada",
            titulo: principal.nombre,
            detalle: `+${premio.xp} XP · +${premio.monedas} monedas`,
        });
    }
    return celebraciones;
}

export function alternarSubmision(estado, principalId, subId) {
    const principal = buscar(estado.principales, principalId, "esa misión principal");
    const sub = buscar(principal.submisiones, subId, "esa submisión");
    const premio = juego.PREMIOS.submision;
    delete sub.auto;   // (v184) si tú lo marcas o desmarcas, deja de ser «marcado solo» (sincronizarEnlaces lo vuelve a poner)

    if (!sub.hecha) {
        sub.hecha = true;
        sub.hechaEn = hoy();   // para el desafío semanal «Avanza N pasos»
        ganar(estado, { ...premio, atributo: principal.atributo });
        return { xp: premio.xp, celebraciones: revisarPrincipal(estado, principal) };
    }

    // Desmarcar: se resta el premio del paso y, si ya estaba completada, también el extra.
    sub.hecha = false;
    sub.hechaEn = null;
    ganar(estado, { xp: -premio.xp, monedas: -premio.monedas, atributo: principal.atributo });
    let xp = -premio.xp;
    if (principal.completadaEn) {
        const extra = juego.PREMIOS.principal;
        principal.completadaEn = null;
        ganar(estado, { xp: -extra.xp, monedas: -extra.monedas, atributo: principal.atributo });
        xp -= extra.xp;
    }
    return { xp };
}

// (v184) Enlazar un paso con una misión diaria: al completarla `veces` veces, el paso se marca solo.
// Sin `mision` quita el enlace. Si ya llevas esas veces (hoy ya la hiciste), se marca de una vez.
export function enlazarSubmision(estado, { principal, sub, mision, veces }) {
    const p = buscar(estado.principales, Number(principal), "esa misión principal");
    const paso = buscar(p.submisiones, Number(sub), "esa submisión");
    if (paso.hecha) throw new Error("Ese paso ya está completado.");
    if (!mision) {
        delete paso.enlace;
        return { celebraciones: [] };
    }
    const m = buscar(estado.misiones, Number(mision), "esa misión");
    if (m.archivadaEn) throw new Error("Esa misión está archivada.");
    const n = Number(veces);
    if (!Number.isInteger(n) || n < 1 || n > 999) throw new Error("Escribe cuántas veces (de 1 a 999).");
    paso.enlace = { misionId: m.id, veces: n, desde: hoy() };
    return sincronizarEnlaces(estado);
}

// (v184) Pone al día los pasos enlazados: marca los que ya llevan sus veces y desmarca los que se pasaron de largo
// (por ejemplo si deshiciste la misión). Solo toca los que se marcaron solos (`auto`), nunca los que marcaste tú.
export function sincronizarEnlaces(estado) {
    const celebraciones = [];
    for (const principal of estado.principales) {
        if (principal.archivada) continue;
        for (const sub of principal.submisiones) {
            if (!sub.enlace) continue;
            const lleva = juego.vecesDelEnlace(estado, sub.enlace);
            if (!sub.hecha && lleva >= sub.enlace.veces) {
                const r = alternarSubmision(estado, principal.id, sub.id);
                sub.auto = true;
                celebraciones.push({ icono: "🔗", etiqueta: "Paso completado solo", titulo: sub.nombre,
                                     detalle: `${principal.nombre} · +${r.xp} XP` }, ...(r.celebraciones || []));
            } else if (sub.hecha && sub.auto && lleva < sub.enlace.veces) {
                alternarSubmision(estado, principal.id, sub.id);
            }
        }
    }
    return { celebraciones };
}

export function borrarSubmision(estado, principalId, subId) {
    const principal = buscar(estado.principales, principalId, "esa misión principal");
    const sub = buscar(principal.submisiones, subId, "esa submisión");
    if (sub.hecha) throw new Error("No puedes borrar un paso que ya completaste.");
    if (principal.submisiones.length === 1) throw new Error("La misión necesita al menos una submisión.");

    principal.submisiones = principal.submisiones.filter((s) => s.id !== subId);
    // Si los pasos que quedan ya están todos hechos, la misión se completa.
    return { celebraciones: revisarPrincipal(estado, principal) };
}

export function archivarPrincipal(estado, id) {
    buscar(estado.principales, id, "esa misión principal").archivada = true;
}

export function restaurarPrincipal(estado, id) {
    buscar(estado.principales, id, "esa misión principal").archivada = false;
}


// ===== Jefes (campaña) =====
// El daño a los jefes se calcula solo a partir de tus misiones (campana.js).
// Aquí entregamos la recompensa de cada jefe que cae (o la devolvemos si
// desmarcas misiones y el jefe "revive"), y avisamos de cada golpe.

export function sincronizarCampanas(estado, danoAntes) {
    const celebraciones = [];
    const recompensados = estado.campana.recompensados;

    for (const [categoria, c] of Object.entries(campana.estadoCampanas(estado))) {
        let dados = recompensados[categoria] || 0;
        let cayoAlguno = false;

        while (dados < c.derrotados) {
            dados += 1;
            cayoAlguno = true;
            const porRonda = campana.VIDAS.length;
            const ronda = Math.ceil(dados / porRonda);
            const jefe = c.campana.jefes[(dados - 1) % porRonda];
            const premio = campana.premioJefe(dados);
            ganar(estado, { ...premio, atributo: categoria });
            celebraciones.push({
                imagen: campana.imagenDe(jefe.id),
                etiqueta: ronda > 1 ? `¡Jefe derrotado! · Ronda ${ronda}` : "¡Jefe derrotado!",
                titulo: jefe.nombre,
                detalle: `Venciste: ${jefe.titulo} · +${premio.xp} XP · +${premio.gemas} 💎`,
                maestro: maestro.palabrasDeJefe(dados),   // lo que te dice Aurelio
            });
            if (dados % porRonda === 0) {
                celebraciones.push({
                    icono: "👑",
                    etiqueta: ronda > 1 ? `¡Ronda ${ronda} completada!` : "¡Campaña completada!",
                    titulo: c.campana.nombre,
                    detalle: `Derrotaste a los 5 jefes. Partida+: vuelven en la ronda ${ronda + 1}, más fuertes y con mejores premios.`,
                });
            }
        }
        while (dados > c.derrotados) {
            const premio = campana.premioJefe(dados);
            ganar(estado, { xp: -premio.xp, gemas: -premio.gemas, atributo: categoria });
            dados -= 1;
        }
        recompensados[categoria] = dados;

        // Aviso del golpe al jefe actual.
        const golpe = c.dano - (danoAntes[categoria] || 0);
        if (golpe > 0 && !cayoAlguno) {
            // (v52) Si su región está más adelante en el mapa, el golpe se le guarda.
            celebraciones.push({ pequena: true, icono: c.esperando ? "🔒" : "⚔️",
                                 titulo: c.esperando
                                     ? `${c.jefe.nombre}: +${golpe} de daño guardado (lo recibe al llegar a la región ${c.region + 1})`
                                     : `${c.jefe.nombre} −${golpe} (le quedan ${c.vida} de vida)` });
        }
    }
    return celebraciones;
}


// ===== Logros =====

export function crearLogro(estado, { nombre, tipo, objetivo, misionId, atributo, recompensa, descripcion, icono }) {
    const tipoLogro = juego.TIPOS_LOGRO[tipo];
    if (!tipoLogro) throw new Error("Elige el tipo de condición.");

    const textoDescripcion = String(descripcion || "").trim();
    if (textoDescripcion.length > 300) throw new Error("La descripción puede tener máximo 300 letras.");
    const textoIcono = String(icono || "").trim();
    if (textoIcono.length > 8) throw new Error("El ícono debe ser un solo emoji.");

    const logro = {
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        tipo,
        // Un logro personal se cumple una sola vez: su meta siempre es 1.
        objetivo: tipo === "manual" ? 1 : validarEntero(objetivo, 1, 100000, "La meta"),
        misionId: null,
        atributo: null,
        recompensa: validarEntero(recompensa, 0, 100000, "La recompensa"),
        descripcion: textoDescripcion,
        icono: textoIcono,       // emoji opcional; si está vacío se usa 🏆
        creadoEn: hoy(),
        desbloqueadoEn: null,
    };
    if (tipoLogro.campo === "mision") {
        if (!misionId) throw new Error("Primero crea una misión diaria para este logro.");
        logro.misionId = buscar(estado.misiones, Number(misionId), "esa misión").id;
    }
    if (tipoLogro.campo === "atributo") {
        const elegido = elegirAtributo(estado, atributo);
        logro.atributo = elegido.atributoPropio ? juego.clavePropio(elegido.atributoPropio) : elegido.atributo;
    }
    estado.logros.push(logro);
}

// Editar un logro. La condición (tipo, misión, atributo) no se cambia: para eso se crea otro.
// Si ya está conseguido, la meta y el premio tampoco (ya se entregó).
export function editarLogro(estado, { id, nombre, descripcion, icono, objetivo, recompensa }) {
    const logro = buscar(estado.logros, Number(id), "ese logro");
    const textoDescripcion = String(descripcion || "").trim();
    if (textoDescripcion.length > 300) throw new Error("La descripción puede tener máximo 300 letras.");
    const textoIcono = String(icono || "").trim();
    if (textoIcono.length > 8) throw new Error("El ícono debe ser un solo emoji.");

    logro.nombre = validarNombre(nombre, 60);
    logro.descripcion = textoDescripcion;
    logro.icono = textoIcono;
    if (!logro.desbloqueadoEn) {
        if (logro.tipo !== "manual") logro.objetivo = validarEntero(objetivo, 1, 100000, "La meta");
        logro.recompensa = validarEntero(recompensa, 0, 100000, "La recompensa");
    }
}

export function borrarLogro(estado, id) {
    estado.logros = estado.logros.filter((logro) => logro.id !== id);
}

// Marca como conseguido un logro personal (de la vida real).
export function lograrManual(estado, id) {
    const logro = buscar(estado.logros, id, "ese logro");
    if (logro.tipo !== "manual") throw new Error("Ese logro se desbloquea solo al cumplir su condición.");
    if (logro.desbloqueadoEn) throw new Error("Ya conseguiste ese logro.");

    logro.desbloqueadoEn = hoy();
    ganar(estado, { monedas: logro.recompensa });
    return {
        celebraciones: [{
            icono: logro.icono || "🏆",
            etiqueta: "¡Logro conseguido!",
            titulo: logro.nombre,
            detalle: logro.recompensa ? `+${logro.recompensa} monedas` : "Bien hecho.",
        }],
    };
}

// Revisa qué logros se acaban de cumplir, los desbloquea y entrega sus monedas.
// Un logro desbloqueado se queda desbloqueado para siempre.
export function revisarLogros(estado, info) {
    const nuevos = [];
    for (const logro of estado.logros) {
        if (!logro.desbloqueadoEn && juego.progresoLogro(logro, estado, info) >= logro.objetivo) {
            logro.desbloqueadoEn = hoy();
            ganar(estado, { monedas: logro.recompensa });
            nuevos.push(logro);
        }
    }
    return nuevos;
}


// ===== Tienda =====

export function crearRecompensa(estado, { nombre, costo }) {
    estado.recompensas.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        costo: validarEntero(costo, 1, 1000000, "El precio"),
    });
}

export function editarRecompensa(estado, { id, nombre, costo }) {
    const recompensa = buscar(estado.recompensas, Number(id), "esa recompensa");
    recompensa.nombre = validarNombre(nombre, 60);
    recompensa.costo = validarEntero(costo, 1, 1000000, "El precio");
}

export function borrarRecompensa(estado, id) {
    estado.recompensas = estado.recompensas.filter((r) => r.id !== id);
}

export function canjear(estado, id) {
    revisarQueNoEstesCaido(estado, "la tienda");
    const recompensa = buscar(estado.recompensas, id, "esa recompensa");
    const costo = eventos.precioConEvento(recompensa.costo, eventos.eventoDelDia(hoy(), estado));   // con el mercader, más barato
    const faltan = costo - estado.personaje.monedas;
    if (faltan > 0) throw new Error(`Te faltan ${faltan} monedas.`);

    estado.personaje.monedas -= costo;
    estado.canjes.push({ nombre: recompensa.nombre, costo, fecha: hoy() });
    return {
        celebraciones: [{
            icono: "🎁",
            etiqueta: "Recompensa canjeada",
            titulo: recompensa.nombre,
            detalle: "¡Te lo ganaste! Disfrútalo.",
        }],
    };
}


// Deshacer el último canje: te devuelve las monedas.
export function deshacerCanje(estado) {
    const canje = estado.canjes.pop();
    if (!canje) throw new Error("No hay ningún canje para deshacer.");
    estado.personaje.monedas += canje.costo;
}


// ===== Bienvenida: los primeros hábitos y premios =====

export function aplicarBienvenida(estado, { misiones = [], recompensas = [] }) {
    for (const id of misiones) {
        const plantilla = PLANTILLAS_MISIONES.find((p) => p.id === id);
        if (plantilla) crearMision(estado, plantilla);
    }
    for (const id of recompensas) {
        const plantilla = PLANTILLAS_RECOMPENSAS.find((p) => p.id === id);
        if (plantilla) crearRecompensa(estado, plantilla);
    }
}
