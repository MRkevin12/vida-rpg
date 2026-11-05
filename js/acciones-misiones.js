// acciones-misiones.js — Lo de todos los días: atributos propios, misiones diarias, tareas sueltas,
// el modo enfoque, el diario de una línea y las cartas a tu yo futuro.
//
// Salió de acciones.js (que lo reexporta con `export *`): en la app se sigue usando `acciones.completarMision(...)`.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as eventos from "./eventos.js";
import { hoy, sumarDias, aTexto, esFechaValida } from "./fechas.js";
import { nuevoId, buscar, validarNombre, validarEntero, validarAtributo, elegirAtributo, validarDificultad, ganar, validarDias, validarAviso } from "./acciones-comun.js";
import { sincronizarEnlaces } from "./acciones-aventuras.js";

// ===== Atributos propios (para cosas específicas: Programación, Inglés…) =====

function validarIconoYColor(icono, color, base) {
    const textoIcono = String(icono || "").trim() || "⭐";
    if (textoIcono.length > 8) throw new Error("El ícono debe ser un solo emoji.");
    // Si no eliges color, usa el de su atributo base.
    return { icono: textoIcono, color: juego.COLORES_PROPIOS.includes(color) ? color : juego.ATRIBUTOS[base].color };
}

// Que no haya dos atributos con el mismo nombre (ni uno que se llame como los 4).
function revisarNombreLibre(estado, nombre, excepto = null) {
    const igual = (texto) => texto.toLowerCase() === nombre.toLowerCase();
    if (Object.values(juego.ATRIBUTOS).some((a) => igual(a.nombre)) ||
        estado.atributosPropios.some((a) => a !== excepto && igual(a.nombre))) {
        throw new Error("Ya tienes un atributo con ese nombre.");
    }
}

export function crearAtributoPropio(estado, { nombre, icono, color, base }) {
    if (estado.atributosPropios.length >= juego.MAX_ATRIBUTOS_PROPIOS) {
        throw new Error(`Puedes tener máximo ${juego.MAX_ATRIBUTOS_PROPIOS} atributos propios.`);
    }
    const limpio = validarNombre(nombre, 24);
    revisarNombreLibre(estado, limpio);
    const atributoBase = validarAtributo(base);
    estado.atributosPropios.push({
        id: nuevoId(estado),
        nombre: limpio,
        ...validarIconoYColor(icono, color, atributoBase),
        base: atributoBase,   // su XP también sube este atributo (no se cambia después)
        creadoEn: hoy(),
    });
}

// Se cambian el nombre, el ícono y el color. La base no: la XP que ya diste no se puede mover.
export function editarAtributoPropio(estado, { id, nombre, icono, color }) {
    const propio = buscar(estado.atributosPropios, Number(id), "ese atributo");
    const limpio = validarNombre(nombre, 24);
    revisarNombreLibre(estado, limpio, propio);
    propio.nombre = limpio;
    Object.assign(propio, validarIconoYColor(icono, color, propio.base));
}

// Borrar: lo que lo usaba vuelve a su atributo base. El historial (y la XP de la base) no cambia.
export function borrarAtributoPropio(estado, id) {
    const propio = buscar(estado.atributosPropios, id, "ese atributo");
    estado.atributosPropios = estado.atributosPropios.filter((a) => a !== propio);
    for (const lista of [estado.misiones, estado.tareas, estado.principales]) {
        for (const elemento of lista) if (elemento.atributoPropio === propio.id) elemento.atributoPropio = null;
    }
    if (estado.enfoque.activo?.atributoPropio === propio.id) estado.enfoque.activo.atributoPropio = null;
}


// ===== Misiones diarias =====


// Los días del mes (1 … 31) también vienen como lista. El 29, 30 y 31 valen aunque el mes
// sea más corto: ese mes tocan el último día (ver juego.tocaEnElMes).
function validarDiasMes(dias) {
    const lista = [...new Set((dias || []).map(Number))].filter((d) => Number.isInteger(d) && d >= 1 && d <= 31).sort((a, b) => a - b);
    if (lista.length === 0) throw new Error("Elige al menos un día del mes.");
    return lista;
}

// Cada cuánto toca una misión: en días fijos de la semana ("dias"), N veces por semana,
// el día que tú quieras ("semana"), o ciertos días de cada mes ("mes").
function validarFrecuencia({ frecuencia, dias, veces, diasMes }) {
    if (frecuencia === "semana") {
        return { dias: null, veces: validarEntero(veces, 1, 6, "Las veces por semana"), diasMes: null };
    }
    if (frecuencia === "mes") {
        return { dias: null, veces: null, diasMes: validarDiasMes(diasMes) };
    }
    return { dias: validarDias(dias), veces: null, diasMes: null };
}

// Meta de cantidad (opcional): ej. 8 vasos de agua. Si el campo viene vacío,
// es una misión normal de marcar y listo.
function validarMeta(cantidad, unidad) {
    if (cantidad === undefined || cantidad === null || String(cantidad).trim() === "") return null;
    const textoUnidad = String(unidad || "").trim();
    if (textoUnidad.length > 20) throw new Error("La unidad puede tener máximo 20 letras.");
    return { cantidad: validarEntero(cantidad, 2, 1000, "La cantidad"), unidad: textoUnidad };
}


// Momento del día (opcional): mañana, tarde o noche. Vacío = cualquier momento.
function validarMomento(momento) {
    if (!momento) return null;
    if (!juego.MOMENTOS[momento]) throw new Error("Elige un momento del día.");
    return momento;
}

// (v193) «Pedir foto»: la casilla del formulario llega como "on" (o no llega). Las misiones con
// cantidad no la llevan: se completan solas al llegar a la meta y no hay un momento para la foto.
function validarFoto(foto, meta) {
    return Boolean(foto) && foto !== "false" && !meta;
}

export function crearMision(estado, { nombre, dificultad, atributo, dias, frecuencia, veces, diasMes, cantidad, unidad, aviso, momento, foto }) {
    const meta = validarMeta(cantidad, unidad);
    estado.misiones.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        dificultad: validarDificultad(dificultad),
        ...elegirAtributo(estado, atributo),                 // agrega "atributo" y "atributoPropio"
        ...validarFrecuencia({ frecuencia, dias, veces, diasMes }),   // agrega "dias", "veces" y "diasMes"
        meta,
        aviso: validarAviso(aviso),
        momento: validarMomento(momento),
        foto: validarFoto(foto, meta),   // (v193) para completarla hay que tomar una foto (v197: se guarda en el teléfono)
        creadaEn: hoy(),
        archivadaEn: null,
        pausas: [],
    });
}

// Editar una misión. Lo que ya completaste no cambia: cada registro del
// historial guardó su propia XP, dificultad y atributo.
export function editarMision(estado, { id, nombre, dificultad, atributo, dias, frecuencia, veces, diasMes, cantidad, unidad, aviso, momento, foto }) {
    const mision = buscar(estado.misiones, Number(id), "esa misión");
    mision.nombre = validarNombre(nombre, 60);
    mision.dificultad = validarDificultad(dificultad);
    Object.assign(mision, elegirAtributo(estado, atributo));
    Object.assign(mision, validarFrecuencia({ frecuencia, dias, veces, diasMes }));
    mision.meta = validarMeta(cantidad, unidad);
    mision.aviso = validarAviso(aviso);
    mision.momento = validarMomento(momento);
    mision.foto = validarFoto(foto, mision.meta);
}

// Mover una misión un puesto arriba (-1) o abajo (+1) entre las que no están archivadas.
export function moverMision(estado, id, direccion) {
    const visibles = estado.misiones.filter((m) => !m.archivadaEn);
    const posicion = visibles.findIndex((m) => m.id === id);
    const vecina = visibles[posicion + direccion];
    if (posicion === -1 || !vecina) return;   // ya está en el borde
    const a = estado.misiones.indexOf(visibles[posicion]);
    const b = estado.misiones.indexOf(vecina);
    [estado.misiones[a], estado.misiones[b]] = [estado.misiones[b], estado.misiones[a]];   // intercambiar
}

// Ordenar arrastrando: "ids" es el orden nuevo de TODAS las misiones no archivadas.
// Las archivadas quedan al final, como estaban.
export function ordenarMisiones(estado, ids) {
    const activas = estado.misiones.filter((m) => !m.archivadaEn);
    const nuevas = ids.map(Number);
    if (nuevas.length !== activas.length || !activas.every((m) => nuevas.includes(m.id))) {
        throw new Error("No se pudo guardar el orden. Vuelve a intentarlo.");
    }
    estado.misiones = [...nuevas.map((id) => buscar(activas, id, "esa misión")), ...estado.misiones.filter((m) => m.archivadaEn)];
}

// Solo se puede marcar hoy o ayer (por si se te olvidó).
function validarFecha(fecha, mensaje = "Solo puedes marcar misiones de hoy o de ayer.") {
    const actual = hoy();
    if (fecha !== actual && fecha !== sumarDias(actual, -1)) throw new Error(mensaje);
    return fecha;
}

// opciones.conFoto (v193): true cuando ya tomaste y guardaste la foto (ver fotos.js y app-foto.js).
export function completarMision(estado, id, fecha = hoy(), opciones = {}) {
    const mision = buscar(estado.misiones, id, "esa misión");
    validarFecha(fecha);
    if (mision.foto && !opciones.conFoto) throw new Error("Esta misión pide una foto de lo que hiciste.");
    if (!juego.sePuedeMarcar(mision, fecha)) throw new Error("Esa misión no tocaba ese día.");
    if (estado.completadas.some((c) => c.misionId === id && c.fecha === fecha)) {
        throw new Error("Esa misión ya estaba completada ese día.");
    }

    // Si la habías marcado como fallada, ya no lo está: al final sí la hiciste.
    estado.fallas = estado.fallas.filter((f) => !(f.misionId === id && f.fecha === fecha));
    // En plena forma (vida de 80 % o más) da 10 % más, el evento del día puede sumar, y si es
    // tu misión clave de ese día vale el doble (ver vida.js, eventos.js y rituales.js).
    const esClave = estado.claves[fecha] === id;
    const { xp, monedas, forma } = vida.premio(estado, mision.dificultad, hoy(), { atributo: mision.atributo, clave: esClave });
    // Guardamos cuánto dio (y su dificultad y atributo de ese momento), para poder
    // restarlo exacto si la desmarcas y para que editar la misión no cambie el pasado.
    estado.completadas.push({ misionId: id, fecha, xp, monedas, atributo: mision.atributo, dificultad: mision.dificultad,
                              atributoPropio: mision.atributoPropio || null, ...(esClave ? { clave: true } : {}),
                              ...(opciones.conFoto ? { foto: true } : {}),   // (v193) se completó con una foto
                              // (v149) La hora en que la marcaste (solo si es de hoy): sirve para saber a qué hora la sueles cumplir.
                              ...(fecha === hoy() ? { hora: new Date().getHours() } : {}) });
    ganar(estado, { xp, monedas, atributo: mision.atributo });
    // (v184) Si algún paso de una misión principal estaba enlazado con esta misión, se marca solo.
    const enlaces = sincronizarEnlaces(estado);
    return { xp, forma, clave: esClave, ...(enlaces.celebraciones.length ? { celebraciones: enlaces.celebraciones } : {}) };
}

// Deshace una misión de hoy o de ayer (por si la marcaste por error).
export function desmarcarMision(estado, id, fecha = hoy()) {
    validarFecha(fecha);
    const posicion = estado.completadas.findIndex((c) => c.misionId === id && c.fecha === fecha);
    if (posicion === -1) throw new Error("Esa misión no estaba completada ese día.");

    const [completada] = estado.completadas.splice(posicion, 1); // la quita de la lista
    ganar(estado, { xp: -completada.xp, monedas: -completada.monedas, atributo: completada.atributo });
    sincronizarEnlaces(estado);   // (v184) un paso que se marcó solo con esta misión se desmarca también
    return { xp: -completada.xp };
}

// «Fallé»: reconocer que no la hiciste (y por qué). La vida se pierde en ese momento,
// no al terminar el día (y no se cobra dos veces: ver vida.js). Solo hoy o ayer, y solo
// misiones que tocaban ese día: las semanales tienen toda la semana.
export function fallarMision(estado, id, fecha, motivo) {
    const mision = buscar(estado.misiones, id, "esa misión");
    validarFecha(fecha, "Solo puedes marcar como fallada una misión de hoy o de ayer.");
    if (mision.veces) throw new Error("Las metas de la semana no se marcan como falladas: tienes toda la semana.");
    if (!juego.tocaEseDia(mision, fecha)) throw new Error("Esa misión no tocaba ese día.");
    if (estado.completadas.some((c) => c.misionId === id && c.fecha === fecha)) throw new Error("Esa misión ya está hecha ese día.");
    if (juego.fallaDe(estado, id, fecha)) throw new Error("Ya la marcaste como fallada.");
    if (!juego.MOTIVOS_FALLA[motivo]) throw new Error("Elige qué pasó.");
    const jefeAntes = campana.estadoCampanas(estado)[mision.atributo];
    const falla = { misionId: id, fecha, motivo };
    estado.fallas.push(falla);

    // El jefe de su categoría te golpea y se queda con la vida que te quitó (ver vida.js y campana.js).
    const v = vida.calcularVida(estado, hoy());
    const golpe = v.registro.find((r) => r.fecha === fecha)?.golpes.find((g) => g.misionId === id);
    // El golpe queda apuntado (como el XP de una misión cumplida): comprar armadura o cumplir
    // otras misiones después no cambia lo que ya te pegó.
    if (golpe) falla.golpe = golpe.conArmadura;
    const jefeDespues = campana.estadoCampanas(estado)[mision.atributo];
    if (!golpe || !jefeAntes || !jefeDespues) return { dano: 0, robo: null };   // de descanso: no pasa nada
    if (!golpe.roba) return { dano: golpe.dano, robo: null };                    // un día de antes de la v24: sin robo
    const mismoJefe = jefeDespues.derrotados === jefeAntes.derrotados;
    return {
        dano: golpe.dano,
        // Lo que necesita la escena del robo (ver vistas.pantallaRobo).
        robo: {
            titulo: `${fecha === hoy() ? "Fallaste" : "Ayer fallaste"} «${mision.nombre}»`,
            golpes: [{
                categoria: mision.atributo,
                jefe: jefeDespues.jefe,
                dano: golpe.dano,                    // la vida que te quitó (y que se llevó)
                // Lo que de verdad se curó (no pasa de su vida llena; si fue ayer, ya se lo había llevado).
                curo: mismoJefe ? Math.max(0, jefeDespues.vida - jefeAntes.vida) : 0,
                jefeVida: { antes: mismoJefe ? jefeAntes.vida : jefeDespues.vida, despues: jefeDespues.vida, maxima: jefeDespues.vidaMax },
            }],
            total: golpe.dano,
            base: golpe.base,                        // lo que pega una misión de esa dificultad
            conArmadura: golpe.conArmadura,          // menos si tu armadura está bien; más si está gastada
            armadura: v.armadura,
        },
    };
}

// Deshacer el «Fallé» (por si te equivocaste o al final sí vas a hacerla).
export function quitarFalla(estado, id, fecha) {
    validarFecha(fecha, "Solo puedes cambiar misiones de hoy o de ayer.");
    if (!juego.fallaDe(estado, id, fecha)) throw new Error("Esa misión no estaba marcada como fallada.");
    estado.fallas = estado.fallas.filter((f) => !(f.misionId === id && f.fecha === fecha));
}

// Misiones con cantidad: guarda cuánto llevas ese día (ej: 5 de 8 vasos).
// Al llegar a la meta se completa sola; si bajas de la meta, se desmarca.
export function fijarCantidad(estado, id, fecha, cantidad) {
    const mision = buscar(estado.misiones, id, "esa misión");
    if (!mision.meta) throw new Error("Esa misión no tiene una cantidad que contar.");
    validarFecha(fecha);
    if (!juego.sePuedeMarcar(mision, fecha)) throw new Error("Esa misión no tocaba ese día.");
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 0) throw new Error("Escribe un número entero (0 o más).");
    const nueva = Math.min(numero, mision.meta.cantidad);

    // Solo se guarda el avance de hoy y de ayer: lo más viejo ya no se puede cambiar.
    const ayer = sumarDias(hoy(), -1);
    for (const clave of Object.keys(estado.avances)) {
        if (clave.split("|")[1] < ayer) delete estado.avances[clave];
    }
    const clave = `${id}|${fecha}`;
    if (nueva === 0) delete estado.avances[clave];
    else estado.avances[clave] = nueva;

    const hecha = estado.completadas.some((c) => c.misionId === id && c.fecha === fecha);
    if (nueva === mision.meta.cantidad && !hecha) return completarMision(estado, id, fecha);
    if (nueva < mision.meta.cantidad && hecha) return desmarcarMision(estado, id, fecha);
    return { xp: 0 };
}

// Archivar = deja de aparecer, pero su historial se conserva (calendario, logros).
export function archivarMision(estado, id) {
    buscar(estado.misiones, id, "esa misión").archivadaEn = hoy();
}

// Recuperar una misión archivada. El tiempo que estuvo archivada se guarda como
// una "pausa", para que esos días no cuenten como fallados.
export function restaurarMision(estado, id) {
    const mision = buscar(estado.misiones, id, "esa misión");
    if (!mision.archivadaEn) return;
    mision.pausas = [...(mision.pausas || []), { desde: mision.archivadaEn, hasta: hoy() }];
    mision.archivadaEn = null;
}


// ===== Tareas sueltas (pendientes de una sola vez, con fecha) =====

// La fecha es opcional: sin fecha, la tarea queda en Hoy hasta que la hagas.
function validarFechaTarea(fecha) {
    if (!fecha) return null;
    if (!esFechaValida(String(fecha))) throw new Error("Elige para cuándo es la tarea.");
    return fecha;
}

// Una tarea con hora de alarma necesita un día: si no eligieron fecha, es para hoy.
function fechaYAviso(fecha, aviso) {
    const hora = validarAviso(aviso);
    return { fecha: validarFechaTarea(fecha) || (hora ? hoy() : null), aviso: hora };
}

export function crearTarea(estado, { nombre, fecha, dificultad, atributo, aviso }) {
    estado.tareas.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 80),
        ...fechaYAviso(fecha, aviso),      // fecha: el día que vence (o null) · aviso: hora de la alarma ("18:00") o null
        dificultad: validarDificultad(dificultad),
        ...elegirAtributo(estado, atributo),
        creadaEn: hoy(),
        hechaEn: null,
        premio: null,                      // lo que dio al completarla (para poder devolverlo)
    });
}

export function editarTarea(estado, { id, nombre, fecha, dificultad, atributo, aviso }) {
    const tarea = buscar(estado.tareas, Number(id), "esa tarea");
    tarea.nombre = validarNombre(nombre, 80);
    Object.assign(tarea, fechaYAviso(fecha, aviso));
    tarea.dificultad = validarDificultad(dificultad);
    Object.assign(tarea, elegirAtributo(estado, atributo));
}

// Completar una tarea (da su premio una sola vez) o deshacerla si la marcaste por error.
export function alternarTarea(estado, id) {
    const tarea = buscar(estado.tareas, id, "esa tarea");
    if (!tarea.hechaEn) {
        const { xp, monedas, forma } = vida.premio(estado, tarea.dificultad, hoy(), { atributo: tarea.atributo });
        tarea.hechaEn = hoy();
        tarea.premio = { xp, monedas, atributo: tarea.atributo, dificultad: tarea.dificultad, atributoPropio: tarea.atributoPropio || null };
        ganar(estado, tarea.premio);
        return { xp, forma };
    }
    validarFecha(tarea.hechaEn, "Solo puedes desmarcar tareas que hiciste hoy o ayer.");
    const { xp, monedas, atributo } = tarea.premio;
    ganar(estado, { xp: -xp, monedas: -monedas, atributo });
    tarea.hechaEn = null;
    tarea.premio = null;
    return { xp: -xp };
}

// Solo se borran las pendientes: las hechas quedan en tu historial.
export function borrarTarea(estado, id) {
    const tarea = buscar(estado.tareas, id, "esa tarea");
    if (tarea.hechaEn) throw new Error("Esa tarea ya está hecha: queda guardada en tu historial.");
    estado.tareas = estado.tareas.filter((t) => t !== tarea);
}


// ===== Modo enfoque (pomodoro) =====
// Se guarda la HORA en que empezaste, no un contador: así el tiempo sigue
// corriendo aunque cierres la app, y al volver se revisa si ya terminó.

export function empezarEnfoque(estado, { minutos, atributo }, ahora = Date.now()) {
    if (estado.enfoque.activo) throw new Error("Ya tienes una sesión de enfoque en curso.");
    if (!juego.ENFOQUE[minutos]) throw new Error("Elige cuántos minutos.");
    estado.enfoque.activo = { inicio: ahora, minutos: Number(minutos), ...elegirAtributo(estado, atributo) };
}

// Cancelar a la mitad: no da premio.
export function cancelarEnfoque(estado) {
    estado.enfoque.activo = null;
}

// Si la sesión en curso ya terminó, la guarda y entrega su premio.
export function revisarEnfoque(estado, ahora = Date.now()) {
    const activo = estado.enfoque.activo;
    if (!activo || ahora < juego.finDelEnfoque(activo)) return null;

    const dificultad = juego.ENFOQUE[activo.minutos];
    const { xp, monedas } = vida.premio(estado, dificultad, hoy(), { atributo: activo.atributo });
    // La fecha es la del momento en que terminó (aunque abras la app al día siguiente).
    const fecha = aTexto(new Date(juego.finDelEnfoque(activo)));
    estado.enfoque.sesiones.push({ fecha, minutos: activo.minutos, atributo: activo.atributo, dificultad, xp, monedas,
                                   atributoPropio: activo.atributoPropio || null });
    estado.enfoque.activo = null;
    ganar(estado, { xp, monedas, atributo: activo.atributo });

    const a = juego.infoAtributo(estado, activo.atributo, activo.atributoPropio);
    return {
        celebraciones: [{
            icono: "⏱️",
            etiqueta: "¡Sesión de enfoque completada!",
            titulo: `${activo.minutos} minutos`,
            detalle: `+${xp} XP de ${a.icono} ${a.nombre} · +${monedas} monedas`,
        }],
    };
}


// ===== Diario de una línea =====

// Una entrada por día (hoy o ayer): cómo te fue, tu respuesta a la pregunta del día y algo que agradeces.
// La primera vez que escribes ese día ganas un pequeño premio (ver diario.js); si la borras, se devuelve.
export function escribirDiario(estado, { fecha, animo, texto, gratitud, etiquetas = [], energia = null, salto = 0 }) {
    validarFecha(fecha, "Solo puedes escribir el diario de hoy o de ayer.");
    if (animo && !juego.ANIMOS_DIARIO[animo]) throw new Error("Elige cómo te fue.");
    // (v106) Lo que hiciste (etiquetas que existen, sin repetir) y tu energía (1 a 5).
    const marcas = [...new Set([].concat(etiquetas || []))].filter((clave) => diario.ETIQUETAS[clave]);
    const fuerza = energia === null || energia === "" ? null : Number(energia);
    if (fuerza !== null && !(fuerza >= 1 && fuerza <= 5)) throw new Error("La energía va de 1 a 5.");
    const frase = String(texto || "").trim();
    if (frase.length > diario.LARGO.texto) throw new Error(`El diario puede tener máximo ${diario.LARGO.texto} letras.`);
    const gracias = String(gratitud || "").trim();
    if (gracias.length > diario.LARGO.gratitud) {
        throw new Error(`Lo que agradeces puede tener máximo ${diario.LARGO.gratitud} letras.`);
    }

    const anterior = estado.diario[fecha];
    if (!diario.tieneContenido({ animo, texto: frase, gratitud: gracias, etiquetas: marcas, energia: fuerza })) {
        // Vacía: se borra y se devuelve su premio.
        const p = anterior?.premio;
        if (p) ganar(estado, { xp: -p.xp, monedas: -p.monedas, atributo: p.atributo });
        delete estado.diario[fecha];
        return { borrada: Boolean(anterior) };
    }

    let premio = anterior?.premio || null;
    const nuevo = !premio;
    if (nuevo) {
        // «Visita del sabio»: el triple de XP (se guarda en la entrada, así al borrarla se devuelve exacto).
        const factor = eventos.factorDiario(eventos.eventoDelDia(fecha, estado));
        premio = { ...diario.PREMIO_DIARIO, xp: diario.PREMIO_DIARIO.xp * factor };
        ganar(estado, premio);
    }
    estado.diario[fecha] = {
        animo: animo || null,
        texto: frase,
        gratitud: gracias,
        pregunta: frase ? diario.preguntaConSalto(fecha, salto) : null,   // a qué respondiste (para leerlo después; v106: puede ser «otra pregunta»)
        etiquetas: marcas,                                       // (v106) lo que hiciste ese día
        energia: fuerza,                                         // (v106) tu energía, de 1 a 5
        premio,                                                  // lo que dio (para devolverlo si la borras)
    };
    return { xp: nuevo ? premio.xp : 0 };
}


// ===== (v106) Cartas a tu yo futuro =====

export function escribirCarta(estado, { texto, dias }) {
    const carta = String(texto || "").trim();
    if (!carta) throw new Error("Escribe algo en la carta.");
    if (carta.length > diario.LARGO_CARTA) throw new Error(`La carta puede tener máximo ${diario.LARGO_CARTA} letras.`);
    const plazo = Number(dias);
    if (!diario.PLAZOS_CARTA.includes(plazo)) throw new Error("Elige cuándo se abre.");
    estado.cartas ||= [];
    const fecha = hoy();
    estado.cartas.push({ id: nuevoId(estado), escrita: fecha, abrir: sumarDias(fecha, plazo), texto: carta, abiertaEn: null });
    return { abrir: sumarDias(fecha, plazo) };
}

export function abrirCarta(estado, id) {
    const carta = (estado.cartas || []).find((c) => c.id === Number(id));
    if (!carta) throw new Error("Esa carta no existe.");
    if (carta.abrir > hoy()) throw new Error("Todavía está sellada.");
    if (!carta.abiertaEn) carta.abiertaEn = hoy();
    return { carta };
}


// ===== Fotos de progreso (v197) =====
// Las fotos mismas viven en IndexedDB (ver fotos.js). Aquí solo se anota LO QUE NECESITAN las reglas:
// cuándo fue la última foto de progreso (para el recordatorio de la semana) y si el recordatorio está encendido.

// Anota que tomaste la foto de progreso de esa fecha (solo avanza: una foto vieja no atrasa el recordatorio).
export function registrarFotoProgreso(estado, fecha = hoy()) {
    if (!esFechaValida(fecha)) throw new Error("La fecha de la foto no es válida.");
    if (!estado.fotos.ultima || fecha > estado.fotos.ultima) estado.fotos.ultima = fecha;
    return estado.fotos.ultima;
}

// Enciende o apaga el recordatorio semanal de la foto de progreso.
export function configurarFotos(estado, { semanal }) {
    estado.fotos.semanal = semanal === true || semanal === "on";
    return { semanal: estado.fotos.semanal };
}
