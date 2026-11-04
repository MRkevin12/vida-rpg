// acciones-torre.js — La Torre del héroe y la Mazmorra del Abismo (los minijuegos grandes), el bazar del arcade
// y las memorias de Aurelio.
//
// Salió de acciones.js (que lo reexporta con `export *`): en la app se sigue usando `acciones.entrarTorre(...)`, etc.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as arcade from "./arcade.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as leyendas from "./leyendas.js";
import * as memorias from "./memorias.js";
import * as vida from "./vida.js";
import * as eventos from "./eventos.js";
import * as mascota from "./mascota.js";
import * as equipo from "./equipo.js";
import * as pergaminos from "./pergaminos.js";
import * as libros from "./libros.js";
import * as gym from "./gym.js";
import { hoy } from "./fechas.js";
import { ganar, revisarQueNoEstesCaido, asegurarRetoDelDia, cobrarReto, nivelesDeAtributos } from "./acciones-comun.js";

// ===== Torre del héroe y Mazmorra del Abismo (los minijuegos grandes) =====
// La partida se guarda en estado.arcade.torre (o estado.arcade.mazmorra): puedes salir y
// seguirla después. lugar = "torre" o "mazmorra"; si no se dice, la Torre.
// La Mazmorra se abre al superar el piso 20 de la Torre (ver torre.mazmorraAbierta).

// La partida en curso de ese lugar (o un error si no hay).
function partidaDe(estado, lugar) {
    if (!bestiario.LUGARES[lugar]) throw new Error("Ese lugar no existe.");
    const partida = estado.arcade[lugar];
    if (!partida) throw new Error(`No hay una partida de la ${bestiario.LUGARES[lugar].nombre} en curso.`);
    return partida;
}

// Devuelve { relato }: la historia que se cuenta al entrar por primera vez (o null).
// marca (v41, opcional): una de las marcas que se ofrecen hoy (ver torre.marcasDelDia). Solo cuenta al EMPEZAR
// una partida nueva: si ya hay una en curso, esa sigue con la suya.
export function empezarTorre(estado, semilla, lugar = "torre", marca = null, modo = "normal") {
    if (!bestiario.LUGARES[lugar]) throw new Error("Ese lugar no existe.");
    if (!torre.MODOS[modo]) throw new Error("Ese modo no existe.");
    if (marca && !torre.marcasDelDia(hoy(), lugar).includes(marca)) throw new Error("Esa marca no se ofrece hoy.");
    revisarQueNoEstesCaido(estado, "el arcade");
    const enCurso = estado.arcade[lugar];
    if (enCurso) {
        // Ya hay una partida: se sigue esa (sin gastar otra ficha). Si es de una versión
        // anterior, su monstruo se cambia por la criatura de ese piso.
        torre.ponerAlDia(enCurso);
        bestiario.anotarEncuentro(estado.arcade.bestiario, enCurso.enemigo.id);
        return { relato: lugar === "torre" ? contarElDespertar(estado) : null };
    }
    if (!torre.lugarAbierto(torre.arcadeConGym(estado), lugar)) {
        throw new Error(lugar === "mazmorra"
            ? `La Mazmorra del Abismo se abre cuando superes el piso ${torre.ABRIR_MAZMORRA} de la Torre del héroe.`
            : `${bestiario.LUGARES[lugar].nombre}: ${bestiario.LUGARES[lugar].abre.texto}`);
    }
    if (modo === "asalto" && (estado.arcade.records[lugar] || 0) < torre.MODOS.asalto.pisoMinimo) {
        throw new Error(`El Asalto de guardianes se abre cuando superes el piso ${torre.MODOS.asalto.pisoMinimo} de ${bestiario.LUGARES[lugar].nombre}.`);
    }
    if (arcade.fichasDisponibles(estado) < 1) {
        throw new Error("No tienes fichas. Completa una misión diaria para ganar una 🎟️.");
    }
    // El reto diario: la marca y el azar son los de hoy (los mismos para todo el día).
    if (modo === "diaria") {
        marca = torre.marcaDeLaDiaria(hoy(), lugar);
        semilla = torre.semillaDeLaDiaria(hoy(), lugar);
    }
    estado.arcade.usadas += 1;   // la ficha se gasta al EMPEZAR
    asegurarRetoDelDia(estado);
    // Entras con tu vida real: si llegas herido, empiezas con menos vida.
    const proporcion = vida.proporcionTorre(vida.calcularVida(estado, hoy()));
    const partida = torre.nuevaPartida({ ...nivelesDeAtributos(estado), gym: gym.nivelDeGym(estado.gym.sesiones).nivel, bombeo: gym.bombeoDeHoy(estado.gym.sesiones, hoy()) }, semilla, proporcion, equipoDeBatalla(estado), lugar, marca, modo);
    // Las provisiones del bazar se usan al empezar (y se gastan).
    torre.usarProvisiones(partida, estado.arcade.bazar);
    estado.arcade.bazar = [];
    estado.arcade[lugar] = partida;
    bestiario.anotarEncuentro(estado.arcade.bestiario, partida.enemigo.id);
    const relato = leyendas.relatoAlEmpezar(lugar, estado.arcade.records[lugar] || 0, estado.personaje.nombre);
    if (relato && lugar === "torre") estado.arcade.despertar = true;   // (el prólogo ya cuenta el despertar)
    return { relato: relato || (lugar === "torre" ? contarElDespertar(estado) : null) };
}

// v38: a quien ya había subido antes de que la Torre despertara, se le cuenta una vez lo que cambió.
function contarElDespertar(estado) {
    const relato = leyendas.relatoDelDespertar(estado.arcade.records.torre || 0, estado.arcade.despertar, estado.personaje.nombre);
    if (relato) estado.arcade.despertar = true;
    return relato;
}

// opcion: con accion "hechizo", cuál lanzas ("fuego", "hielo" o "rayo"); con "tecnica", cuál usas.
// Lo que aprendes peleando queda en tu bestiario: qué le hace cada hechizo a esa criatura
// y cuántas veces la venciste. («Analizar» te lo enseña todo de una vez.)
export function accionTorre(estado, accion, opcion = null, lugar = "torre") {
    const partida = partidaDe(estado, lugar);
    const id = partida.enemigo.id;
    // Si ya cambió de forma (el último guardián, a media vida), lo que veas no es lo de su ficha.
    const cambiada = Boolean(partida.enemigo.cambio);
    const turno = torre.actuar(partida, accion, opcion);   // lo que pasó: [{ quien, tipo, dano… }]
    const rebotado = turno.some((e) => e.quien === "heroe" && e.reflejado);
    if (accion === "hechizo" && !cambiada && !rebotado) bestiario.anotarElemento(estado.arcade.bestiario, id, opcion);
    if (accion === "tecnica" && opcion === "analizar" && !cambiada) {
        for (const elemento of Object.keys(bestiario.ELEMENTOS)) bestiario.anotarElemento(estado.arcade.bestiario, id, elemento);
    }
    // El aliento de tu dragón también enseña: si es de fuego o de hielo, ya sabes qué le hace.
    for (const e of turno.filter((e) => e.quien === "mascota" && e.elemento)) bestiario.anotarElemento(estado.arcade.bestiario, id, e.elemento);
    if (turno.some((e) => e.tipo === "derrotado")) bestiario.anotarVictoria(estado.arcade.bestiario, id);
    return { eventos: turno };
}

// Devuelve { relato }: si el piso que acabas de superar era el de un guardián y es la primera
// vez que lo vences, la historia sigue (o null).
export function mejoraTorre(estado, clave, lugar = "torre") {
    const partida = partidaDe(estado, lugar);
    const vencido = partida.piso;
    torre.elegirMejora(partida, clave);
    bestiario.anotarEncuentro(estado.arcade.bestiario, partida.enemigo.id);   // la criatura del piso nuevo
    return { relato: leyendas.relatoTrasGuardian(lugar, vencido, estado.arcade.records[lugar] || 0, estado.personaje.nombre) };
}

// v43: la cinemática que toca ver ahora en esa partida ({ tipo }) o null. La borra de la partida, así que se ve una
// sola vez. Con reproducir = false (o con las cinemáticas apagadas en Ajustes) también la borra pero devuelve null.
export function tomarCinematica(estado, lugar = "torre", reproducir = true) {
    const partida = estado.arcade[lugar];
    const tipo = partida?.cine || null;
    if (!tipo) return null;
    partida.cine = null;
    return reproducir && estado.ajustes.cinematicas !== false ? { tipo } : null;
}

// (v62, v70) Los libros largos de Historia («El Centinela» y «La linterna de Orrin», ver libros.js): se guarda por qué
// capítulo vas (para «Continuar») y el más lejano que abriste.
export function marcarLibro(estado, id, capitulo) {
    const libro = libros.libroPorId(id);
    if (!libro) throw new Error("Ese libro no existe.");
    if (!Number.isInteger(capitulo) || capitulo < 0 || capitulo >= libro.CAPITULOS.length) throw new Error("Ese capítulo no existe.");
    if (!libros.capituloAbierto(libro, capitulo, libros.recordDe(estado, id))) {
        throw new Error(capitulo < libro.CAPITULOS_LIBRES ? libro.PUERTA.textoLibre : libro.PUERTA.textoFinal);
    }
    const marca = estado.libros[id];
    marca.marca = capitulo;
    marca.leidos = Math.max(marca.leidos, capitulo + 1);
}

// Terminar el libro (hay que haber llegado al último capítulo y tener todo abierto). La primera vez da un premio.
export function terminarLibro(estado, id) {
    const libro = libros.libroPorId(id);
    if (!libro) throw new Error("Ese libro no existe.");
    if (libros.recordDe(estado, id) < libro.PUERTA.final) throw new Error("Todavía te faltan capítulos por abrir.");
    const marca = estado.libros[id];
    if (marca.leidos < libro.CAPITULOS.length) throw new Error("Léelo hasta el último capítulo.");
    if (marca.fin) return { primera: false };
    marca.fin = hoy();
    ganar(estado, { ...libro.PREMIO, atributo: "intelecto" });
    return {
        primera: true, premio: libro.PREMIO,
        celebraciones: [{ icono: "📖", etiqueta: "¡Libro terminado!", titulo: libro.TITULO, detalle: `+${libro.PREMIO.xp} XP de Intelecto · +${libro.PREMIO.gemas} 💎` }],
    };
}

// (v57) Terminas de leer un pergamino de la Biblioteca prohibida. La primera vez da un pequeño premio (y se cuenta en una cinemática).
// Solo se pueden leer en orden y cuando se cumple su condición (ver pergaminos.js).
export function terminarPergamino(estado, id) {
    const biblioteca = pergaminos.estadoDeBiblioteca(estado.personaje.nombre, pergaminos.datosDePartida(estado));
    const p = biblioteca.pergaminos.find((x) => x.id === id);
    if (!p) throw new Error("Ese pergamino no existe.");
    if (!p.abierto) throw new Error(`Todavía no puedes leerlo. ${p.falta}`);
    if (p.leido) return { primera: false, id };
    estado.pergaminos.leidos[id] = hoy();
    ganar(estado, { ...pergaminos.PREMIO_LECTURA, atributo: "intelecto" });
    const premio = pergaminos.PREMIO_LECTURA;
    return {
        primera: true, id, premio,
        celebraciones: [{ icono: "📜", etiqueta: "¡Pergamino leído!", titulo: p.titulo, detalle: `«${p.moraleja}» · +${premio.xp} XP de Intelecto · +${premio.gemas} 💎` }],
    };
}

// (v56) Anota que ya viste una cinemática del reino, el arcade o la aldea (clave: ver cinematicas-reino.js).
// Devuelve true si es la primera vez y las cinemáticas están encendidas (entonces toca reproducirla).
export function verCinematica(estado, clave) {
    if (estado.mapa.cines.includes(clave)) return false;
    estado.mapa.cines.push(clave);
    return estado.ajustes.cinematicas !== false;
}

// (v56) Volver a ver todas las escenas del reino (Ajustes).
export function reiniciarCinematicas(estado) {
    estado.mapa.cines = [];
}

// v60: elegir camino entre pisos (ver torre.RUTAS). Devuelve { texto }.
export function rutaTorre(estado, clave, lugar = "torre") {
    return torre.elegirRuta(partidaDe(estado, lugar), clave);
}

// v42: lo que haces en una sala especial entre pisos (ver torre.SALAS). Devuelve { texto }.
export function salaTorre(estado, opcion, lugar = "torre") {
    return torre.resolverSala(partidaDe(estado, lugar), opcion);
}


// Lo que tu equipo aporta en la Torre y en los minijuegos: su ataque, magia y suerte, y la
// armadura que tienes AHORA (si fallaste misiones y está gastada, protege menos).
// Desde la v26, también las habilidades de lo épico y legendario y la mascota que te acompaña.
// v38: también tu racha de días, que te da Voluntad al empezar.
export function equipoDeBatalla(estado) {
    const fecha = hoy();
    const info = juego.resumen(estado, fecha);
    const a = avatar.describirAvatar(estado, fecha, info);
    return {
        ...equipo.poderDelEquipo(estado),
        armadura: vida.calcularVida(estado, fecha).armadura.puntos,
        habilidades: equipo.habilidadesDelEquipo(estado),
        mascota: mascota.mascotaDeBatalla(estado, a.mascota, fecha),
        racha: info.racha.actual,
    };
}

// Cobrar al terminar (o al rendirte): gemas 💎 y XP según los pisos superados (en la Torre,
// de Carisma; en la Mazmorra, más, y de Fuerza).
export function terminarTorre(estado, lugar = "torre") {
    const partida = partidaDe(estado, lugar);
    const sitio = bestiario.LUGARES[lugar];
    const pisos = torre.pisosSuperados(partida);
    // «Eco de la Torre»: la Torre paga el doble ese día (la Mazmorra, no).
    const factor = lugar === "torre" ? eventos.factorTorre(eventos.eventoDelDia(hoy(), estado)) : 1;
    const modo = torre.modoDe(partida);
    const base = torre.premio(pisos, lugar, partida.marca, modo);
    const premio = { gemas: base.gemas * factor, xp: base.xp * factor };
    const atributo = torre.REGLAS[lugar].atributo;
    ganar(estado, { ...premio, atributo });
    const abiertasAntes = Object.keys(bestiario.LUGARES).filter((l) => torre.lugarAbierto({ records: estado.arcade.records, gymNivel: torre.arcadeConGym(estado).gymNivel }, l));
    // (v65) El asalto tiene su propio récord (guardianes vencidos) y no abre nada; lo demás cuenta como siempre.
    const claveRecord = modo === "asalto" ? `asalto-${lugar}` : lugar;
    const medida = modo === "asalto" ? Math.round(pisos / torre.CADA_GUARDIAN) : pisos;
    const anterior = estado.arcade.records[claveRecord] || 0;
    const nuevoRecord = medida > anterior;
    if (nuevoRecord) estado.arcade.records[claveRecord] = medida;
    estado.arcade[lugar] = null;
    // El reto diario: su mejor resultado del día y el premio extra (una sola vez al día).
    let bonus = null;
    if (modo === "diaria") {
        const d = estado.arcade.diaria;
        if (d.fecha !== hoy()) { d.fecha = hoy(); d.mejor = 0; d.cobrado = false; }
        d.mejor = Math.max(d.mejor, pisos);
        if (pisos >= torre.MODOS.diaria.meta && !d.cobrado) {
            d.cobrado = true;
            bonus = torre.MODOS.diaria.bonus;
            ganar(estado, { ...bonus, atributo });
        }
    }
    const reto = cobrarReto(estado, lugar, modo === "asalto" ? 0 : pisos);   // (el asalto cuenta como partida, no como pisos)
    const celebraciones = [];
    if (nuevoRecord && anterior > 0) {
        celebraciones.push(modo === "asalto"
            ? { icono: "👑", etiqueta: `¡Nuevo récord de asalto en ${sitio.nombre}!`, titulo: juego.plural(medida, "guardián vencido", "guardianes vencidos"), detalle: "Cada uno, un guardián de verdad." }
            : { icono: sitio.icono, etiqueta: `¡Nuevo récord en la ${sitio.nombre}!`,
                titulo: `${sitio.piso} ${pisos + 1}`, detalle: `Superaste ${pisos} ${pisos === 1 ? sitio.piso.toLowerCase() : sitio.pisos}.` });
    }
    if (bonus) {
        celebraciones.push({ icono: "📅", etiqueta: "¡Reto diario cumplido!", titulo: `${torre.MODOS.diaria.meta} pisos o más`,
                             detalle: `Premio extra: +${bonus.gemas} 💎 · +${bonus.xp} XP` });
    }
    for (const otro of Object.values(bestiario.LUGARES)) {
        if (abiertasAntes.includes(otro.id) || !torre.lugarAbierto({ records: estado.arcade.records, gymNivel: torre.arcadeConGym(estado).gymNivel }, otro.id)) continue;
        celebraciones.push({
            icono: otro.icono, etiqueta: "¡Se abrió una mazmorra!", titulo: otro.nombre,
            detalle: otro.id === "mazmorra" ? "Bajo la Torre hay una escalera. Más difícil y con criaturas nuevas: búscala en el Arcade."
                : `${otro.resumen.split(". ")[0]}. Búscala en el Arcade.`,
        });
    }
    return { lugar, pisos, modo, premio, bonus, reto, marca: partida.marca || null, atributo, record: estado.arcade.records[claveRecord] || 0, nuevoRecord: nuevoRecord && pisos > 0, celebraciones };
}


// ===== El bazar del arcade (v31) =====
// Provisiones para tu próxima subida a la Torre o bajada a la Mazmorra (ver torre.PROVISIONES).
// Se pagan con gemas 💎, se puede tener una de cada una y se gastan al empezar la partida.
export function comprarProvision(estado, clave) {
    const provision = torre.PROVISIONES[clave];
    if (!provision) throw new Error("Eso no se vende en el bazar.");
    revisarQueNoEstesCaido(estado, "el arcade");
    if (estado.arcade.bazar.includes(clave)) throw new Error(`Ya llevas ${provision.nombre}: se usa al empezar tu próxima partida.`);
    const faltan = provision.precio - (estado.personaje.gemas || 0);
    if (faltan > 0) throw new Error(`Te faltan ${faltan} gemas 💎.`);
    estado.personaje.gemas -= provision.precio;
    estado.arcade.bazar.push(clave);
}


// ===== Las memorias de Aurelio (v30) =====
// Al abrirlas, todas las que ya te contó quedan leídas (y su aviso en Hoy desaparece).
export function leerMemorias(estado) {
    const abiertas = memorias.cuantasAbiertas(memorias.datosDeMemorias(estado, juego.resumen(estado, hoy())));
    estado.maestro.leidas = Math.max(estado.maestro.leidas || 0, abiertas);
}
