// acciones.js — Todo lo que CAMBIA la partida.
//
// Cada función recibe el "estado" (la partida completa) y lo modifica.
// Si algo no se puede hacer, lanza un error con un mensaje en español
// (throw new Error("...")) y app.js lo muestra en pantalla.
//
// Ninguna función de aquí guarda ni dibuja: de eso se encarga app.js.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as desafios from "./desafios.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as leyendas from "./leyendas.js";
import * as maestro from "./maestro.js";
import * as memorias from "./memorias.js";
import * as saga from "./saga.js";
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as pacto from "./pacto.js";
import * as eventos from "./eventos.js";
import * as rituales from "./rituales.js";
import * as cofre from "./cofre.js";
import * as mapa from "./mapa.js";
import * as mascota from "./mascota.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "./plantillas.js";
import { PISTAS } from "./musica.js";
import * as equipo from "./equipo.js";
import * as resumen from "./resumen.js";
import * as retos from "./retos.js";
import * as voces from "./voces.js";
import * as pergaminos from "./pergaminos.js";
import * as libros from "./libros.js";
import * as gym from "./gym.js";
import * as fragua from "./fragua.js";
import * as gymAurelio from "./gym-aurelio.js";
import { hoy, diasEntre, sumarDias, lunesDe, aTexto, esFechaValida } from "./fechas.js";


// ===== Ayudantes =====

// Da un número de id nuevo (1, 2, 3...) para cada cosa que se crea.
function nuevoId(estado) {
    const id = estado.siguienteId;
    estado.siguienteId += 1;
    return id;
}

// Busca un elemento por id en una lista, o lanza un error si no existe.
function buscar(lista, id, queEs) {
    const encontrado = lista.find((elemento) => elemento.id === id);
    if (!encontrado) throw new Error(`No encontré ${queEs}.`);
    return encontrado;
}

// Valida un nombre escrito por el usuario.
function validarNombre(texto, maximo) {
    const nombre = String(texto || "").trim();
    if (nombre.length === 0) throw new Error("Escribe un nombre.");
    if (nombre.length > maximo) throw new Error(`El nombre puede tener máximo ${maximo} letras.`);
    return nombre;
}

// Valida un número entero dentro de un rango.
function validarEntero(valor, minimo, maximo, queEs) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
        throw new Error(`${queEs} debe ser un número entero entre ${minimo} y ${maximo}.`);
    }
    return numero;
}

function validarAtributo(atributo) {
    if (!juego.ATRIBUTOS[atributo]) throw new Error("Elige un atributo.");
    return atributo;
}

// El formulario manda uno de los 4 ("fuerza") o uno tuyo ("propio:5").
// Devuelve el atributo base (el que sube y pega a los jefes) y, si es tuyo, su id.
function elegirAtributo(estado, valor) {
    const id = juego.idDePropio(valor);
    if (id === null) return { atributo: validarAtributo(valor), atributoPropio: null };
    const propio = juego.buscarPropio(estado, id);
    if (!propio) throw new Error("Ese atributo ya no existe.");
    return { atributo: propio.base, atributoPropio: propio.id };
}

function validarDificultad(dificultad) {
    if (!juego.DIFICULTADES[dificultad]) throw new Error("Elige una dificultad.");
    return dificultad;
}

// Suma (o resta, si los números son negativos) XP, monedas, gemas y XP de un atributo.
// Nada baja de 0. Monedas 🪙 = lo que haces en la vida real (para tus premios reales);
// gemas 💎 = el arcade y los premios extra (para el arcade y las mascotas). Ver arcade.js.
export function ganar(estado, { xp = 0, monedas = 0, gemas = 0, atributo = null }) {
    const personaje = estado.personaje;
    personaje.xp = Math.max(0, personaje.xp + xp);
    personaje.monedas = Math.max(0, personaje.monedas + monedas);
    personaje.gemas = Math.max(0, (personaje.gemas || 0) + gemas);
    if (atributo) {
        estado.atributos[atributo] = Math.max(0, estado.atributos[atributo] + xp);
    }
}


// ===== Personaje =====

export function crearPersonaje(estado, nombre) {
    estado.personaje = {
        nombre: validarNombre(nombre, 30),
        xp: 0,
        monedas: 0,
        gemas: 0,
        creadoEn: hoy(),
    };
    estado.vida = { desde: hoy(), pociones: [], avisadoHasta: null };   // la vida empieza a contar hoy
    estado.ultimaVisita = hoy();
}

export function renombrar(estado, nombre) {
    estado.personaje.nombre = validarNombre(nombre, 30);
}


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

// Los días de la semana vienen del formulario como lista de números (0 = lunes … 6 = domingo).
// Si están los 7, guardamos null, que significa "todos los días".
function validarDias(dias) {
    if (dias === undefined || dias === null) return null;
    const lista = [...new Set(dias.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (lista.length === 0) throw new Error("Elige al menos un día de la semana.");
    return lista.length === 7 ? null : lista;
}

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

// Hora del aviso de una misión (opcional): "18:00", o vacío = sin aviso.
function validarAviso(hora) {
    const texto = String(hora || "").trim();
    if (!texto) return null;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) throw new Error("Elige una hora válida para el aviso.");
    return texto;
}

// Momento del día (opcional): mañana, tarde o noche. Vacío = cualquier momento.
function validarMomento(momento) {
    if (!momento) return null;
    if (!juego.MOMENTOS[momento]) throw new Error("Elige un momento del día.");
    return momento;
}

export function crearMision(estado, { nombre, dificultad, atributo, dias, frecuencia, veces, diasMes, cantidad, unidad, aviso, momento }) {
    estado.misiones.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        dificultad: validarDificultad(dificultad),
        ...elegirAtributo(estado, atributo),                 // agrega "atributo" y "atributoPropio"
        ...validarFrecuencia({ frecuencia, dias, veces, diasMes }),   // agrega "dias", "veces" y "diasMes"
        meta: validarMeta(cantidad, unidad),
        aviso: validarAviso(aviso),
        momento: validarMomento(momento),
        creadaEn: hoy(),
        archivadaEn: null,
        pausas: [],
    });
}

// Editar una misión. Lo que ya completaste no cambia: cada registro del
// historial guardó su propia XP, dificultad y atributo.
export function editarMision(estado, { id, nombre, dificultad, atributo, dias, frecuencia, veces, diasMes, cantidad, unidad, aviso, momento }) {
    const mision = buscar(estado.misiones, Number(id), "esa misión");
    mision.nombre = validarNombre(nombre, 60);
    mision.dificultad = validarDificultad(dificultad);
    Object.assign(mision, elegirAtributo(estado, atributo));
    Object.assign(mision, validarFrecuencia({ frecuencia, dias, veces, diasMes }));
    mision.meta = validarMeta(cantidad, unidad);
    mision.aviso = validarAviso(aviso);
    mision.momento = validarMomento(momento);
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

export function completarMision(estado, id, fecha = hoy()) {
    const mision = buscar(estado.misiones, id, "esa misión");
    validarFecha(fecha);
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
                              atributoPropio: mision.atributoPropio || null, ...(esClave ? { clave: true } : {}) });
    ganar(estado, { xp, monedas, atributo: mision.atributo });
    return { xp, forma, clave: esClave };
}

// Deshace una misión de hoy o de ayer (por si la marcaste por error).
export function desmarcarMision(estado, id, fecha = hoy()) {
    validarFecha(fecha);
    const posicion = estado.completadas.findIndex((c) => c.misionId === id && c.fecha === fecha);
    if (posicion === -1) throw new Error("Esa misión no estaba completada ese día.");

    const [completada] = estado.completadas.splice(posicion, 1); // la quita de la lista
    ganar(estado, { xp: -completada.xp, monedas: -completada.monedas, atributo: completada.atributo });
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

export function crearTarea(estado, { nombre, fecha, dificultad, atributo }) {
    estado.tareas.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 80),
        fecha: validarFechaTarea(fecha),   // el día que vence (o null: sin fecha)
        dificultad: validarDificultad(dificultad),
        ...elegirAtributo(estado, atributo),
        creadaEn: hoy(),
        hechaEn: null,
        premio: null,                      // lo que dio al completarla (para poder devolverlo)
    });
}

export function editarTarea(estado, { id, nombre, fecha, dificultad, atributo }) {
    const tarea = buscar(estado.tareas, Number(id), "esa tarea");
    tarea.nombre = validarNombre(nombre, 80);
    tarea.fecha = validarFechaTarea(fecha);
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
export function escribirDiario(estado, { fecha, animo, texto, gratitud }) {
    validarFecha(fecha, "Solo puedes escribir el diario de hoy o de ayer.");
    if (animo && !juego.ANIMOS_DIARIO[animo]) throw new Error("Elige cómo te fue.");
    const frase = String(texto || "").trim();
    if (frase.length > diario.LARGO.texto) throw new Error(`El diario puede tener máximo ${diario.LARGO.texto} letras.`);
    const gracias = String(gratitud || "").trim();
    if (gracias.length > diario.LARGO.gratitud) {
        throw new Error(`Lo que agradeces puede tener máximo ${diario.LARGO.gratitud} letras.`);
    }

    const anterior = estado.diario[fecha];
    if (!diario.tieneContenido({ animo, texto: frase, gratitud: gracias })) {
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
        pregunta: frase ? diario.preguntaDelDia(fecha) : null,   // a qué respondiste (para leerlo después)
        premio,                                                  // lo que dio (para devolverlo si la borras)
    };
    return { xp: nuevo ? premio.xp : 0 };
}


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

function sincronizarCampanas(estado, danoAntes) {
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
function revisarLogros(estado, info) {
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


// ===== Avatar: equipamiento y mascota =====

export function comprarObjeto(estado, id) {
    const objeto = avatar.OBJETOS[id];
    if (!objeto) throw new Error("Ese objeto no existe.");
    if (objeto.logro) throw new Error("Ese objeto no se vende: se gana con un logro.");
    if (estado.avatar.comprados.includes(id)) throw new Error("Ya tienes ese objeto.");
    revisarQueNoEstesCaido(estado, "la tienda");
    // El equipo se paga con gemas 💎 (desde la v32): es para el juego, no un premio real.
    const precio = eventos.precioConEvento(objeto.precio, eventos.eventoDelDia(hoy(), estado));
    const faltan = precio - (estado.personaje.gemas || 0);
    if (faltan > 0) throw new Error(`Te faltan ${faltan} gemas 💎. Se ganan en el arcade, con los jefes, el cofre del día, los desafíos y el mapa.`);

    estado.personaje.gemas -= precio;
    estado.avatar.comprados.push(id);
    estado.avatar.equipado[objeto.espacio] = id; // se lo pone de una vez
    return { celebraciones: [{ pequena: true, icono: objeto.icono, titulo: `¡Nuevo equipo: ${objeto.nombre}!` }] };
}

// Ponerse un objeto (o quitárselo, si ya lo tenía puesto).
export function equiparObjeto(estado, id) {
    const objeto = avatar.OBJETOS[id];
    if (!objeto) throw new Error("Ese objeto no existe.");
    const disponibles = avatar.objetosDisponibles(estado, juego.resumen(estado, hoy()));
    if (!disponibles.has(id)) throw new Error("Todavía no tienes ese objeto.");

    const equipado = estado.avatar.equipado;
    equipado[objeto.espacio] = equipado[objeto.espacio] === id ? null : id;
}

// Renombrar a la mascota que te acompaña.
export function nombrarMascota(estado, nombre) {
    const especie = mascota.especieActiva(estado);
    const nuevo = validarNombre(nombre, 20);
    if (especie === mascota.INICIAL) estado.mascota.nombre = nuevo;
    else estado.mascota.adoptadas[especie].nombre = nuevo;
}

// Adoptar una mascota de la Tienda (v26). Llega como huevo y te acompaña desde ese momento.
export function comprarMascota(estado, especie) {
    const datos = mascota.MASCOTAS[especie];
    if (!datos || !datos.precio) throw new Error("Esa mascota no se vende.");
    if (mascota.tieneMascota(estado, especie)) throw new Error("Esa mascota ya es tuya.");
    revisarQueNoEstesCaido(estado, "la tienda");
    // Las mascotas se pagan con gemas 💎 (desde la v31).
    const precio = eventos.precioConEvento(datos.precio, eventos.eventoDelDia(hoy(), estado));
    const faltan = precio - (estado.personaje.gemas || 0);
    if (faltan > 0) throw new Error(`Te faltan ${faltan} gemas 💎. Se ganan en el arcade, con los jefes, el cofre del día, los desafíos y el mapa.`);

    estado.personaje.gemas -= precio;
    estado.mascota.adoptadas[especie] = { nombre: datos.nombre, desde: hoy() };
    estado.mascota.activa = especie;
    return { celebraciones: [{ icono: datos.icono, etiqueta: "¡Nueva mascota!", titulo: datos.nombre,
                               detalle: "Llega como huevo: crece con tus misiones diarias. Ya te acompaña." }] };
}

// Elegir qué mascota te acompaña (en la Torre y en tu avatar).
export function elegirMascota(estado, especie) {
    if (!mascota.tieneMascota(estado, especie)) throw new Error("Todavía no tienes esa mascota.");
    estado.mascota.activa = especie;
}

// Apariencia del avatar: tono de piel, color de pelo, peinado y barba.
export function cambiarApariencia(estado, campo, valor) {
    const opciones = avatar.APARIENCIA[campo];
    if (!opciones || !opciones[valor]) throw new Error("Esa opción no existe.");
    estado.apariencia[campo] = valor;
}

// Preferencias de la app (por ahora: sonido encendido o apagado).
export function cambiarAjuste(estado, clave, valor) {
    if (!(clave in estado.ajustes)) throw new Error("Ese ajuste no existe.");
    estado.ajustes[clave] = Boolean(valor);
}

// (v49) Cómo te sientes hoy decide cuánto menú ves: mal = modo esencial, normal = sin Aventuras, bien = todo.
export function elegirAnimo(estado, animo) {
    if (!["mal", "normal", "bien"].includes(animo)) throw new Error("Ese ánimo no existe.");
    estado.ajustes.animo = animo;
    estado.ajustes.esencial = animo === "mal";
}

// Música de fondo: qué pista suena (ver musica.js) y a qué volumen (de 0 a 1).
export function elegirMusica(estado, pista) {
    if (!PISTAS[pista]) throw new Error("Esa música no existe.");
    estado.ajustes.pista = pista;
    estado.ajustes.musica = true;   // elegir una pista también la enciende
}

export function cambiarVolumen(estado, volumen) {
    const v = Number(volumen);
    if (!Number.isFinite(v)) throw new Error("Ese volumen no es válido.");
    estado.ajustes.volumen = Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
}


// ===== Notificaciones: horarios de recordatorio =====
// Aquí solo se guardan en la partida; app.js después se los manda al servidor de avisos.

const MAX_HORARIOS = 10;   // el mismo límite que tiene el servidor

export function agregarHorario(estado, { hora, dias }) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(hora))) throw new Error("Elige una hora.");
    const horarios = estado.avisos.horarios;
    if (horarios.length >= MAX_HORARIOS) throw new Error(`Puedes tener máximo ${MAX_HORARIOS} recordatorios.`);
    if (horarios.some((h) => h.hora === hora)) throw new Error("Ya tienes un recordatorio a esa hora.");
    horarios.push({ id: nuevoId(estado), hora, dias: validarDias(dias) });
    horarios.sort((a, b) => a.hora.localeCompare(b.hora));   // ordenados de la mañana a la noche
}

export function quitarHorario(estado, id) {
    estado.avisos.horarios = estado.avisos.horarios.filter((h) => h.id !== id);
}

export function cambiarAvisoEnfoque(estado, encendido) {
    estado.avisos.enfoque = Boolean(encendido);
}


// ===== Minijuegos =====

// La ficha se gasta al EMPEZAR (si sales a la mitad, igual se gastó).
export function empezarPartida(estado, tipo) {
    if (!arcade.JUEGOS[tipo]) throw new Error("Ese minijuego no existe.");
    revisarQueNoEstesCaido(estado, "el arcade");
    if (arcade.fichasDisponibles(estado) < 1) {
        throw new Error("No tienes fichas. Completa una misión diaria para ganar una 🎟️.");
    }
    estado.arcade.usadas += 1;
    asegurarRetoDelDia(estado);   // (por si la app llevaba abierta desde ayer: así la meta se fija ANTES de jugar)
}

export function terminarPartida(estado, tipo, puntosObtenidos) {
    const juego = arcade.JUEGOS[tipo];
    const puntos = Math.max(0, Math.floor(Number(puntosObtenidos) || 0));
    const premio = arcade.premio(tipo, puntos);
    ganar(estado, { ...premio, atributo: juego.atributo });

    const anterior = estado.arcade.records[tipo] || 0;
    const nuevoRecord = puntos > anterior;
    if (nuevoRecord) estado.arcade.records[tipo] = puntos;
    const reto = cobrarReto(estado, tipo, puntos);

    return {
        puntos,
        premio,
        reto,
        record: estado.arcade.records[tipo] || 0,
        nuevoRecord: nuevoRecord && puntos > 0,
        celebraciones: nuevoRecord && anterior > 0
            ? [{ icono: "🏅", etiqueta: "¡Nuevo récord!", titulo: `${puntos} puntos`, detalle: juego.nombre }]
            : [],
    };
}


// ===== Las Voces del Valle (v44) =====
// La aventura de diálogos de Carisma (ver voces.js). Una conversación nueva gasta una ficha; seguir la que dejaste a
// medias, no. Los premios son gemas 💎 y XP de Carisma.

// Empieza (o sigue) una conversación. Devuelve la conversación en curso.
export function empezarEscena(estado, id) {
    revisarQueNoEstesCaido(estado, "la aldea");
    const v = estado.voces;
    const motivo = voces.motivoBloqueo(estado, id, hoy());
    if (motivo) throw new Error(motivo);
    if (v.escena) return v.escena;   // seguir la que ya empezaste: sin ficha
    if (arcade.fichasDisponibles(estado) < 1) {
        throw new Error("No tienes fichas. Completa una misión diaria para ganar una 🎟️.");
    }
    estado.arcade.usadas += 1;   // la ficha se gasta al EMPEZAR
    v.escena = voces.iniciarEscena(id, hoy());
    return v.escena;
}

// Eliges qué decir. Si con eso termina la conversación, se cobra y se guarda cómo salió.
// Devuelve { terminada: false } o, al terminar, { terminada: true, id, titulo, persona, fin, texto, leccion, tarea, premio, mejoro,
// epilogo (true si con esta recuperaste la última voz), celebraciones }.
export function elegirEnEscena(estado, indice) {
    const v = estado.voces;
    if (!v.escena) throw new Error("No estás en ninguna conversación.");
    const en = v.escena;
    voces.elegir(estado, en, indice, hoy());
    const final = voces.finDe(en);
    if (!final) return { terminada: false };

    const escena = voces.ESCENAS[en.id];
    const previo = v.hechas[en.id]?.fin || null;
    const premio = voces.premioDeFin(final.fin, previo);
    ganar(estado, { gemas: premio.gemas, xp: premio.xp, atributo: "carisma" });
    if (final.fin === "mal") v.fallos[en.id] = hoy();
    else v.hechas[en.id] = { fin: voces.mejorFin(previo, final.fin), fecha: hoy() };
    v.ultima[escena.persona] = hoy();
    v.escena = null;

    // Al recuperar la última voz, la aldea habla: se cuenta el epílogo y se paga (una sola vez).
    const celebraciones = [];
    let epilogo = false;
    if (!v.epilogo && voces.aldeaLibre(estado)) {
        const p = voces.EPILOGO.premio;
        v.epilogo = hoy();
        epilogo = true;
        ganar(estado, { gemas: p.gemas, xp: p.xp, atributo: "carisma" });
        celebraciones.push({ icono: "🗣️", etiqueta: "¡La aldea recuperó su voz!", titulo: voces.EPILOGO.titulo, detalle: `+${p.gemas} 💎 · +${p.xp} XP de Carisma` });
    }
    return {
        terminada: true, id: en.id, titulo: escena.titulo, persona: escena.persona, fin: final.fin,
        texto: final.texto, leccion: final.leccion || "", tarea: final.tarea || null,
        premio, mejoro: Boolean(previo) && final.fin !== previo && final.fin !== "mal", epilogo, celebraciones,
    };
}

// Dejar una conversación a medias para siempre: la ficha ya se gastó, y hoy no se vuelve a hablar con esa persona.
export function abandonarEscena(estado) {
    const v = estado.voces;
    if (!v.escena) throw new Error("No estás en ninguna conversación.");
    v.fallos[v.escena.id] = hoy();
    v.ultima[voces.ESCENAS[v.escena.id].persona] = hoy();
    v.escena = null;
}

// Convierte la lección de una conversación en una tarea real (de Carisma, para hoy). Una sola vez por conversación.
export function crearTareaDeEscena(estado, id, nombre) {
    const escena = voces.ESCENAS[id];
    const v = estado.voces;
    if (!escena || !v.hechas[id]) throw new Error("Primero vive esa conversación.");
    if (v.tareas[id]) throw new Error("Esa tarea ya la creaste.");
    // Solo vale una de las tareas que propone esa conversación (no un texto cualquiera).
    if (!Object.values(escena.nodos).some((nodo) => nodo.tarea === nombre)) throw new Error("Esa tarea no existe.");
    crearTarea(estado, { nombre, fecha: hoy(), dificultad: "normal", atributo: "carisma" });
    v.tareas[id] = true;
}


// ===== Reto del día del arcade (v40) =====

// Crea el reto de hoy si todavía no existe (se llama al abrir la app y al terminar cada partida).
export function asegurarRetoDelDia(estado) {
    retos.asegurarReto(estado, hoy());
}

// Anota la partida que acabas de terminar y, si con ella se cumple el reto de hoy, cobra el premio.
// Devuelve { gemas, xp, tipo } si se cumplió ahora mismo, o null.
function cobrarReto(estado, juego, valor) {
    const premio = retos.registrarPartida(estado, hoy(), juego, valor);
    if (premio) ganar(estado, premio);
    return premio;
}


// ===== Desafío de la semana =====

// Crea el desafío de esta semana si todavía no existe (se llama al abrir la app).
export function asegurarDesafio(estado) {
    const lunes = lunesDe(hoy());
    if (estado.desafios.some((d) => d.semana === lunes)) return null;
    const desafio = desafios.elegirDesafio(estado, lunes, hoy());
    estado.desafios.push(desafio);
    return { celebraciones: [{ pequena: true, icono: "🎯", titulo: `Desafío de la semana: ${desafios.textoDesafio(desafio)}` }] };
}

// Abre el cofre de los desafíos que acabas de cumplir. Como los logros, una vez
// cobrado queda cobrado. Solo se revisan esta semana y la pasada (marcando "ayer"
// un lunes todavía puedes sumar a la semana anterior).
function revisarDesafios(estado) {
    const celebraciones = [];
    const desde = lunesDe(sumarDias(hoy(), -1));
    for (const desafio of estado.desafios) {
        if (desafio.cobradoEn || desafio.semana < desde || !desafios.DESAFIOS[desafio.tipo]) continue;
        if (desafios.progresoDesafio(estado, desafio) < desafio.meta) continue;
        desafio.cobradoEn = hoy();
        ganar(estado, desafios.COFRE);
        celebraciones.push({
            icono: "🎁",
            etiqueta: "¡Desafío cumplido!",
            titulo: "Cofre abierto",
            detalle: `${desafios.textoDesafio(desafio)} · +${desafios.COFRE.xp} XP · +${desafios.COFRE.gemas} 💎`,
        });
    }
    return celebraciones;
}

// La tarjeta «Tu semana» (resumen de la semana pasada) se muestra hasta que la cierras.
export function cerrarResumenSemanal(estado) {
    estado.semanaVista = lunesDe(hoy());
}

// Revisión semanal (v39): qué salió bien, qué mejorar y hasta 3 misiones de foco para esta semana.
// Se guarda con el lunes de la semana REVISADA. Al guardarla, la tarjeta «Tu semana» también se cierra.
export function guardarRevision(estado, { lunes, bien, mejorar, foco }) {
    if (!esFechaValida(lunes) || lunesDe(lunes) !== lunes) throw new Error("Esa semana no es válida.");
    const ids = [...new Set((foco || []).map(Number))];
    if (ids.length > resumen.MAX_FOCO) throw new Error(`Elige como máximo ${resumen.MAX_FOCO} misiones de foco.`);
    for (const id of ids) {
        const mision = estado.misiones.find((m) => m.id === id);
        if (!mision || !juego.estaActiva(mision, hoy())) throw new Error("Una de las misiones de foco ya no existe.");
    }
    const limpiar = (texto) => String(texto || "").trim().slice(0, 500);
    estado.revisiones[lunes] = { bien: limpiar(bien), mejorar: limpiar(mejorar), foco: ids, hechaEn: hoy() };
    estado.semanaVista = lunesDe(hoy());
}


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

// Apunta cuánta armadura máxima tienes hoy, si cambió (te pusiste o quitaste algo, o cambiaste
// de etapa). Así vida.js sabe cuál tenías cada día, y lo que te pongas hoy no cambia el pasado.
// El primer apunte (fecha "") es «la de siempre»: vale para todos los días anteriores.
function anotarArmadura(estado) {
    if (!estado.personaje) return;
    const maxima = equipo.armaduraMaxima(estado);
    const cambios = estado.armadura.cambios;
    const ultimo = cambios[cambios.length - 1];
    if (!ultimo) cambios.push({ fecha: "", maxima });
    else if (ultimo.maxima === maxima) return;
    else if (ultimo.fecha === hoy()) ultimo.maxima = maxima;
    else cambios.push({ fecha: hoy(), maxima });
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


// ===== Vida: pociones y modo descanso =====
// La vida se calcula en vida.js. Aquí solo se guardan las pociones y los descansos.

// Si caíste en combate, la tienda y el arcade se cierran hasta que te levantes.
function revisarQueNoEstesCaido(estado, que) {
    const v = vida.calcularVida(estado, hoy());
    if (v.caido) {
        throw new Error(`Caíste en combate: ${que} se abre cuando llegues a ${v.levantarse} ❤️ (tienes ${v.puntos}). ` +
                        "Cumple misiones para curarte (o toma una poción).");
    }
}

// Comprar y tomar una poción: +25 de vida, una al día. (Se vende aunque hayas caído.)
export function tomarPocion(estado) {
    const v = vida.calcularVida(estado, hoy());
    if (v.pocionesHoy >= vida.POCION.porDia) throw new Error("Ya tomaste la poción de hoy. Mañana puedes tomar otra.");
    if (v.puntos >= v.maxima) throw new Error("Tu vida ya está llena.");
    const faltan = vida.POCION.precio - estado.personaje.monedas;
    if (faltan > 0) throw new Error(`Te faltan ${faltan} monedas.`);

    estado.personaje.monedas -= vida.POCION.precio;
    estado.vida.pociones.push(hoy());
    const cura = Math.min(vida.POCION.cura, v.maxima - v.puntos);
    return { celebraciones: [{ pequena: true, icono: "🧪", titulo: `Poción: +${cura} de vida` }] };
}

// Deshacer la poción de hoy: te devuelve las monedas.
export function deshacerPocion(estado) {
    const posicion = estado.vida.pociones.lastIndexOf(hoy());
    if (posicion === -1) throw new Error("No hay ninguna poción de hoy para deshacer.");
    estado.vida.pociones.splice(posicion, 1);
    estado.personaje.monedas += vida.POCION.precio;
}

// Modo descanso: desde hoy hasta el día que elijas (máximo 30 días).
// Esos días no pierdes vida ni se rompe tu racha, y no llegan recordatorios.
export function empezarDescanso(estado, hasta) {
    const fecha = hoy();
    if (juego.descansoDe(estado, fecha)) throw new Error("Ya estás en modo descanso.");
    if (!esFechaValida(String(hasta || "")) || hasta < fecha) throw new Error("Elige hasta qué día quieres descansar.");
    if (diasEntre(fecha, hasta) >= vida.VIDA.descansoMaximo) {
        throw new Error(`El descanso puede durar máximo ${vida.VIDA.descansoMaximo} días.`);
    }
    estado.descansos.push({ desde: fecha, hasta });
}

// Terminar antes: hoy todavía es de descanso; desde mañana todo vuelve a contar.
export function terminarDescanso(estado) {
    const fecha = hoy();
    const descanso = juego.descansoDe(estado, fecha);
    if (!descanso) throw new Error("No estás en modo descanso.");
    if (descanso.hasta === fecha) throw new Error("Tu descanso ya termina hoy.");
    descanso.hasta = fecha;
}

// Al abrir: cuánta vida perdiste en los días que pasaron (se avisa una sola vez).
export function revisarVidaAlAbrir(estado) {
    const fecha = hoy();
    const v = vida.calcularVida(estado, fecha);
    const desde = estado.vida.avisadoHasta || sumarDias(estado.vida.desde || fecha, -1);
    const dias = v.registro.filter((r) => r.fecha > desde && r.fecha < fecha);
    estado.vida.avisadoHasta = sumarDias(fecha, -1);
    const cuando = dias.length === 1 ? "ayer" : "mientras no estabas";
    const robo = roboDeLosDias(estado, dias, v, cuando);   // qué jefes te golpearon (para la escena del robo)

    if (v.caido && dias.some((r) => r.cayo)) {
        return { robo, celebraciones: [{ icono: "☠️", etiqueta: "¡Caíste en combate!", titulo: "Tienda y arcade cerrados",
                                         detalle: `Te quedaste sin vida. Cumple misiones hasta llegar a ${v.levantarse} ❤️ para abrirlos otra vez.` }] };
    }
    const perdida = dias.reduce((suma, r) => suma + r.dano, 0);
    if (!perdida) return null;
    const pendientes = dias.reduce((suma, r) => suma + (r.faltas ? r.faltas.misiones + r.faltas.tareas + r.faltas.semanales : 0), 0);
    return { robo, celebraciones: [{ pequena: true, icono: "💔",
                                     titulo: `Perdiste ${perdida} de vida ${cuando} (${juego.plural(pendientes, "pendiente sin hacer", "pendientes sin hacer")})` }] };
}

// Junta por jefe lo que te robaron esos días (del que más robó al que menos).
// Devuelve lo que necesita la escena del robo (ver vistas.pantallaRobo), o null si nadie te robó.
function roboDeLosDias(estado, dias, v, cuando) {
    const suma = {};
    for (const dia of dias) {
        for (const g of dia.golpes) {
            if (!g.dano || !g.roba) continue;   // (los días de antes de la v24 no tienen robo)
            if (!suma[g.atributo]) suma[g.atributo] = { dano: 0, base: 0, conArmadura: 0 };
            suma[g.atributo].dano += g.dano;
            suma[g.atributo].base += g.base;
            suma[g.atributo].conArmadura += g.conArmadura;
        }
    }
    const campanas = campana.estadoCampanas(estado);
    const golpes = Object.entries(suma)
        .filter(([categoria]) => campanas[categoria])
        .map(([categoria, s]) => ({
            categoria,
            jefe: campanas[categoria].jefe,
            dano: s.dano,
            curo: null,   // ya se lo llevó esos días: aquí solo se muestra
            jefeVida: { antes: null, despues: campanas[categoria].vida, maxima: campanas[categoria].vidaMax },
        }))
        .sort((a, b) => b.dano - a.dano);
    if (!golpes.length) return null;
    const total = (clave) => Object.values(suma).reduce((t, s) => t + s[clave], 0);
    return {
        titulo: cuando === "ayer" ? "Ayer, lo que no hiciste" : "Mientras no estabas",
        golpes,
        total: total("dano"),
        base: total("base"),
        conArmadura: total("conArmadura"),
        armadura: v.armadura,
    };
}


// ===== El Tratado de la Voluntad (tu pacto) =====

// Sellar el pacto (o renovarlo): hay que jurarlo y firmarlo con el dedo.
// Si lo renuevas, se guarda la fecha del primero: los días honrados se cuentan desde ahí.
export function firmarPacto(estado, { nombre, razon, firma, juro }) {
    if (!juro) throw new Error("Para sellar el pacto tienes que jurarlo: marca la casilla.");
    const limpio = validarNombre(nombre, 40);
    const motivo = String(razon || "").trim();
    if (motivo.length > pacto.LARGO_RAZON) throw new Error(`Tu porqué puede tener máximo ${pacto.LARGO_RAZON} letras.`);
    const trazo = String(firma || "").trim();
    if (!pacto.firmaValida(trazo)) throw new Error("Firma con tu dedo en el recuadro.");

    const anterior = estado.pacto;
    estado.pacto = {
        nombre: limpio,
        razon: motivo,
        firma: trazo,
        firmadoEn: hoy(),
        primeraVez: anterior?.primeraVez || hoy(),
        renovaciones: anterior ? anterior.renovaciones + 1 : 0,
    };
    return {
        celebraciones: [{
            icono: "📜",
            etiqueta: anterior ? "Juramento renovado" : "¡Pacto sellado!",
            titulo: limpio,
            detalle: "Por ti y para ti. Que tus actos lo cumplan cada día.",
        }],
    };
}


// ===== Rituales: la misión clave (mañana) y cerrar el día (noche) =====

// Elegir la misión clave de hoy: una de las que te faltan. Se puede cambiar mientras no la hayas hecho.
export function elegirClave(estado, id) {
    const fecha = hoy();
    const actual = rituales.claveDelDia(estado, fecha);
    if (actual && estado.completadas.some((c) => c.misionId === actual.id && c.fecha === fecha)) {
        throw new Error("Tu misión clave de hoy ya está cumplida.");
    }
    if (!rituales.pendientesDelDia(estado, fecha).some((m) => m.id === id)) {
        throw new Error("La misión clave tiene que ser una de las que te faltan hoy.");
    }
    estado.claves[fecha] = id;
}

// Cerrar el día (al terminar el ritual de la noche): un pequeño premio, una vez por día.
export function cerrarDia(estado) {
    const fecha = hoy();
    if (rituales.diaCerrado(estado, fecha)) return { premio: null };
    estado.noches.push(fecha);
    ganar(estado, rituales.PREMIO_CIERRE);
    const p = rituales.PREMIO_CIERRE;
    return {
        premio: p,
        celebraciones: [{ icono: "🌙", etiqueta: "Día cerrado", titulo: "Que descanses, héroe",
                          detalle: `+${p.xp} XP de Carisma · +${p.monedas} monedas por cerrar el día con honestidad.` }],
    };
}


// ===== Desafío relámpago =====

export function aceptarRelampago(estado, ahora = Date.now()) {
    const fecha = hoy();
    if (!rituales.relampagoDisponible(estado, fecha, new Date(ahora).getHours())) throw new Error("Hoy no hay un desafío relámpago.");
    estado.relampagos[fecha] = {
        inicio: ahora,
        base: rituales.hechasHoy(estado, fecha),   // lo que ya llevabas hecho no cuenta
        meta: rituales.metaRelampago(estado, fecha),
        minutos: rituales.RELAMPAGO.minutos,
        cobradoEn: null,
    };
}

export function rechazarRelampago(estado) {
    estado.relampagos[hoy()] = { rechazado: true };
}

// Si cumpliste el desafío relámpago a tiempo, se cobra (una vez). Se revisa después de cada acción.
function revisarRelampago(estado, ahora = Date.now()) {
    const fecha = hoy();
    const r = estado.relampagos[fecha];
    const situacion = rituales.estadoRelampago(estado, fecha, ahora, new Date(ahora).getHours());
    if (!r || situacion?.estado !== "activo" || situacion.progreso < situacion.meta) return [];
    r.cobradoEn = fecha;
    ganar(estado, rituales.RELAMPAGO.premio);
    const p = rituales.RELAMPAGO.premio;
    return [{ icono: "⚡", etiqueta: "¡Desafío relámpago cumplido!", titulo: `${r.meta} misiones a tiempo`,
              detalle: `+${p.xp} XP · +${p.gemas} 💎` }];
}


// ===== El cofre del día =====

export function abrirCofre(estado, azar = Math.random) {
    const fecha = hoy();
    if (estado.cofres[fecha]) throw new Error("Ya abriste el cofre de hoy. Mañana habrá otro.");
    if (!cofre.huboActividad(estado, fecha)) throw new Error("El cofre se abre con lo primero que cumplas hoy.");
    const premio = cofre.sortearPremio(estado, azar);
    if (premio.tipo === "gemas") ganar(estado, { gemas: premio.cantidad });
    if (premio.tipo === "xp") ganar(estado, { xp: premio.cantidad, atributo: premio.atributo });
    if (premio.tipo === "fichas") estado.arcade.extra = (estado.arcade.extra || 0) + premio.cantidad;
    if (premio.tipo === "objeto") estado.avatar.comprados.push(premio.objeto);
    // La poción del cofre cura sola (vida.js la cuenta para ese día).
    estado.cofres[fecha] = premio;
    return { premio };
}


// ===== Tu dragón =====

export function alimentarDragon(estado) {
    const fecha = hoy();
    const nombre = mascota.nombreDe(estado, mascota.especieActiva(estado));
    if (mascota.comioHoy(estado, fecha)) throw new Error(`${nombre} ya comió hoy.`);
    const faltan = mascota.COMIDA.precio - (estado.personaje.gemas || 0);   // en gemas 💎 (v31)
    if (faltan > 0) throw new Error(`Te faltan ${faltan} gemas 💎.`);
    estado.personaje.gemas -= mascota.COMIDA.precio;
    estado.mascota.comidas.push(fecha);
    return { celebraciones: [{ pequena: true, icono: "🍖", titulo: `${nombre} comió feliz: +${mascota.COMIDA.cura} de vida` }] };
}


// ===== El mapa del reino =====

// campanas (opcional): campana.estadoCampanas(estado), si ya lo tienes (así no se calcula otra vez).
export function reclamarLugar(estado, id, campanas = null) {
    const lugar = mapa.lugaresPorReclamar(estado, campanas).find((l) => l.id === id);
    if (!lugar) throw new Error("Ese lugar todavía no lo alcanzas, ya lo reclamaste o su señor sigue en pie.");
    const premio = mapa.LUGARES[lugar.tipo].premio;
    // El santuario fortalece tu atributo más descuidado; la guarida y el memorial, el de su campaña.
    const atributo = lugar.tipo === "santuario" ? mapa.atributoMasDescuidado(estado) : lugar.categoria || null;
    ganar(estado, { xp: premio.xp || 0, gemas: premio.gemas || 0, atributo });
    estado.mapa.reclamados.push(id);
    const partes = [];
    if (premio.xp) partes.push(`+${premio.xp} XP${atributo ? ` de ${juego.ATRIBUTOS[atributo].icono} ${juego.ATRIBUTOS[atributo].nombre}` : ""}`);
    if (premio.gemas) partes.push(`+${premio.gemas} 💎`);
    const titulo = lugar.tipo === "fortaleza" ? `¡${mapa.nombreRegion(lugar.region)} está libre!`
        : lugar.nombre ? `${lugar.nombre} · ${mapa.nombreRegion(lugar.region)}` : mapa.nombreRegion(lugar.region);
    return { celebraciones: [{ icono: mapa.LUGARES[lugar.tipo].icono, etiqueta: lugar.tipo === "fortaleza" ? "Región liberada" : mapa.LUGARES[lugar.tipo].nombre,
                               titulo, detalle: partes.join(" · ") }] };
}


// Reclamar todos los lugares con premio de una vez (un solo aviso con el total).
export function reclamarTodo(estado) {
    const campanas = campana.estadoCampanas(estado);
    const lugares = mapa.lugaresPorReclamar(estado, campanas);
    if (!lugares.length) throw new Error("No hay premios por reclamar en el mapa.");
    const antes = { xp: estado.personaje.xp, gemas: estado.personaje.gemas || 0 };
    for (const lugar of lugares) reclamarLugar(estado, lugar.id, campanas);
    return { celebraciones: [{ icono: "🗺️", etiqueta: "Premios del mapa", titulo: juego.plural(lugares.length, "lugar reclamado", "lugares reclamados"),
                               detalle: `+${estado.personaje.xp - antes.xp} XP · +${estado.personaje.gemas - antes.gemas} 💎` }] };
}


// ===== Golpe con timing =====
// Si al completar una misión tocas en el momento justo, el golpe al jefe es crítico (50 % más).

export function golpeCritico(estado, id, fecha) {
    const registro = estado.completadas.find((c) => c.misionId === id && c.fecha === fecha);
    if (!registro) throw new Error("Esa misión no está completada.");
    if (registro.critico) throw new Error("Ese golpe ya fue crítico.");
    registro.critico = true;
}


// ===== Al abrir la app =====

// Bonus de regreso: si vuelves tras varios días sin abrir la app, ganas XP extra.
export function registrarVisita(estado) {
    const fecha = hoy();
    const anterior = estado.ultimaVisita;
    estado.ultimaVisita = fecha;
    if (!anterior) return null;

    const dias = diasEntre(anterior, fecha);
    if (dias < juego.REGRESO.diasMinimos) return null;

    const xp = juego.bonoRegreso(dias);
    estado.bonos.push({ fecha, dias, xp });
    ganar(estado, { xp });
    return {
        celebraciones: [{
            icono: "🎉",
            etiqueta: "¡Bienvenido de vuelta!",
            titulo: `+${xp} XP`,
            detalle: `Volviste después de ${dias} días. Sigue desde donde quedaste.`,
        }],
    };
}

// Avisa (una sola vez) si un escudo salvó tu racha mientras no estabas.
export function revisarEscudosUsados(estado) {
    const fecha = hoy();
    const racha = juego.calcularRacha(estado, fecha);
    const desde = estado.ultimoAvisoEscudo || sumarDias(fecha, -400);
    const nuevos = [...racha.protegidos].filter((dia) => dia > desde).sort();
    if (nuevos.length === 0) return null;

    estado.ultimoAvisoEscudo = nuevos[nuevos.length - 1];
    const texto = nuevos.length === 1 ? "Un escudo protegió tu racha" : `${nuevos.length} escudos protegieron tu racha`;
    return { celebraciones: [{ pequena: true, icono: "🛡️", titulo: texto }] };
}


// ===== Antes y después =====
// app.js toma una "foto" antes de cada acción y la compara con cómo quedó.
// Así detectamos subidas de nivel, escudos nuevos y logros sin repetir código.

function nivelesDeAtributos(estado) {
    const niveles = {};
    for (const clave of Object.keys(juego.ATRIBUTOS)) {
        niveles[clave] = juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO).nivel;
    }
    return niveles;
}

function fotoDelAvatar(estado, info) {
    const a = avatar.describirAvatar(estado, hoy(), info);
    return {
        etapa: a.etapa.clave,
        clase: a.clave,
        animo: a.animo,
        // La etapa de cada mascota tuya (crecen todas, aunque no te acompañen).
        mascotas: Object.fromEntries(mascota.mascotasTuyas(estado).map((especie) =>
            [especie, avatar.etapaSegun(avatar.ETAPAS_MASCOTA, mascota.totalDe(estado, especie)).clave])),
        objetos: avatar.objetosDeLogroGanados(estado, info),
    };
}

function nivelesDePropios(estado) {
    const niveles = {};
    for (const propio of estado.atributosPropios) niveles[propio.id] = juego.nivelDePropio(estado, propio.id).nivel;
    return niveles;
}

function fotoDeVida(estado) {
    const v = vida.calcularVida(estado, hoy());
    return { puntos: v.puntos, caido: v.caido, enForma: v.enForma };
}

export function foto(estado) {
    if (estado.personaje && !estado.armadura.cambios.length) anotarArmadura(estado);   // el primer apunte, antes de que algo cambie
    const info = juego.resumen(estado, hoy());
    return {
        vida: fotoDeVida(estado),
        propios: nivelesDePropios(estado),
        nivel: juego.calcularNivel(estado.personaje.xp).nivel,
        atributos: nivelesDeAtributos(estado),
        escudos: info.racha.escudos,
        dano: campana.danoPorCategoria(estado),
        avatar: fotoDelAvatar(estado, info),
        memorias: memorias.cuantasAbiertas(memorias.datosDeMemorias(estado, info)),
        saga: sagaDe(estado).indice,
    };
}

// Cómo va la Saga de la Llama (ver saga.js).
function sagaDe(estado) {
    return saga.estadoDeSaga(saga.datosDeSaga(estado, campana.estadoCampanas(estado)));
}

export function revisarCambios(estado, antes) {
    // Primero los jefes y los cofres: sus recompensas pueden hacerte subir de nivel.
    const celebraciones = [...sincronizarCampanas(estado, antes.dano), ...revisarDesafios(estado), ...revisarRelampago(estado)];
    const info = juego.resumen(estado, hoy());

    const nivel = juego.calcularNivel(estado.personaje.xp).nivel;
    if (nivel > antes.nivel) {
        celebraciones.push({ tipo: "nivel", avatar: true, etiqueta: "¡Subiste de nivel!", titulo: `NIVEL ${nivel}`,
                             maestro: maestro.palabrasDeNivel(nivel) });
    }

    // La Saga de la Llama: cada acto que cumples se celebra y dice cuál es tu siguiente objetivo.
    const s = sagaDe(estado);
    for (let i = antes.saga ?? s.indice; i < s.indice; i++) {
        const acto = s.actos[i];
        const siguiente = s.actos[i + 1];
        celebraciones.push({ icono: "🧭", etiqueta: `Saga · Acto ${acto.numero} cumplido`, titulo: acto.titulo,
                             detalle: siguiente ? `Siguiente: ${siguiente.objetivo}` : `Eres ${saga.VIGIA.titulo}.`, maestro: acto.cierre });
    }

    // Aurelio te cuenta un capítulo más de su historia (ver memorias.js).
    const abiertas = memorias.cuantasAbiertas(memorias.datosDeMemorias(estado, info));
    for (let i = antes.memorias ?? abiertas; i < abiertas; i++) {
        const m = memorias.MEMORIAS[i];
        celebraciones.push({ icono: "🧙", etiqueta: "Aurelio quiere contarte algo", titulo: m.titulo,
                             detalle: `Capítulo ${memorias.ROMANOS[i]} de sus memorias. Léelo en Héroe › Historia.`, maestro: m.leccion });
    }

    const atributos = nivelesDeAtributos(estado);
    for (const [clave, nivelAtributo] of Object.entries(atributos)) {
        if (nivelAtributo > antes.atributos[clave]) {
            const a = juego.ATRIBUTOS[clave];
            celebraciones.push({ pequena: true, icono: a.icono, titulo: `${a.nombre} subió a nivel ${nivelAtributo}` });
        }
    }

    for (const [id, nivelPropio] of Object.entries(nivelesDePropios(estado))) {
        if (nivelPropio > (antes.propios?.[id] ?? nivelPropio)) {
            const propio = juego.buscarPropio(estado, Number(id));
            celebraciones.push({ pequena: true, icono: propio.icono, titulo: `${propio.nombre} subió a nivel ${nivelPropio}` });
        }
    }

    if (info.racha.escudos > antes.escudos) {
        celebraciones.push({
            icono: "🛡️",
            etiqueta: "¡Ganaste un escudo!",
            titulo: `Racha de ${info.racha.actual} días`,
            detalle: "Si un día fallas, el escudo protegerá tu racha.",
        });
    }

    for (const logro of revisarLogros(estado, info)) {
        celebraciones.push({
            icono: logro.icono || "🏆",
            etiqueta: "Logro desbloqueado",
            titulo: logro.nombre,
            detalle: logro.recompensa ? `+${logro.recompensa} monedas` : "",
        });
    }

    // La vida: levantarte después de caer, caer (al desmarcar algo de ayer) o entrar en plena forma.
    const vidaAhora = fotoDeVida(estado);
    if (antes.vida.caido && !vidaAhora.caido) {
        celebraciones.push({ icono: "❤️‍🩹", etiqueta: "¡Te levantaste!", titulo: "Tienda y arcade abiertos",
                             detalle: "Recuperaste la mitad de tu vida. ¡Sigue así!" });
    } else if (!antes.vida.caido && vidaAhora.caido) {
        celebraciones.push({ icono: "☠️", etiqueta: "¡Caíste en combate!", titulo: "Tienda y arcade cerrados",
                             detalle: "Te quedaste sin vida. Cumple misiones para levantarte." });
    } else if (!antes.vida.enForma && vidaAhora.enForma) {
        celebraciones.push({ pequena: true, icono: "✨", titulo: "¡En plena forma! +10 % de XP y monedas" });
    }

    // Cambios del avatar (se revisan después de los logros, que pueden dar objetos).
    const ahora = fotoDelAvatar(estado, info);
    const previo = antes.avatar;
    const indice = (clave) => avatar.ETAPAS.findIndex((e) => e.clave === clave);

    if (indice(ahora.etapa) > indice(previo.etapa)) {
        const etapa = avatar.ETAPAS[indice(ahora.etapa)];
        celebraciones.push({ avatar: true, etiqueta: "¡Tu avatar evolucionó!", titulo: etapa.nombre.toUpperCase(), detalle: etapa.cambio });
    }
    if (ahora.clase !== previo.clase && ahora.clase !== "aprendiz") {
        const clase = avatar.CLASES[ahora.clase];
        celebraciones.push({ pequena: true, icono: clase.icono, titulo: `Ahora eres ${clase.nombre}` });
    }
    for (const id of ahora.objetos.filter((o) => !previo.objetos.includes(o))) {
        const objeto = avatar.OBJETOS[id];
        celebraciones.push({ icono: objeto.icono, etiqueta: "¡Objeto desbloqueado!", titulo: objeto.nombre,
                             detalle: "Equípalo en tu Héroe › Equipo." });
    }
    for (const [especie, etapa] of Object.entries(ahora.mascotas)) {
        const antesEtapa = previo.mascotas?.[especie];
        if (!antesEtapa || antesEtapa === etapa) continue;   // recién adoptada, o no cambió
        const nombre = mascota.nombreDe(estado, especie);
        const textos = {
            cria: { icono: "🐣", etiqueta: "¡El huevo eclosionó!", detalle: `${nombre} salió del huevo.` },
            adulto: { icono: mascota.MASCOTAS[especie].icono, etiqueta: "¡Tu mascota creció!", detalle: `${nombre} ya es adulto.` },
        };
        if (textos[etapa]) celebraciones.push({ ...textos[etapa], titulo: nombre });
    }
    if ((previo.animo === "dormido" || previo.animo === "cansado") && previo.animo !== ahora.animo) {
        celebraciones.push({ pequena: true, icono: "😃", titulo: "¡Tu héroe despertó!" });
    }
    anotarArmadura(estado);
    return celebraciones;
}


// ===== El Gimnasio (v66) =====
// Las reglas están en gym.js. Aquí se guarda el entrenamiento en curso, se anotan las series y se cobra el premio.

const entrenamientoEnCurso = (estado) => {
    if (!estado.gym.encurso) throw new Error("No tienes ningún entrenamiento en curso.");
    return estado.gym.encurso;
};

const numeroEntre = (valor, minimo, maximo, que) => {
    const n = Number(String(valor).replace(",", "."));
    if (!Number.isFinite(n) || n < minimo || n > maximo) throw new Error(`${que} debe estar entre ${minimo} y ${maximo}.`);
    return Math.round(n * 100) / 100;
};

// Empieza (o sigue) un entrenamiento. fecha: hoy o ayer (por si se te olvidó anotarlo).
export function empezarGym(estado, rutinaId, fecha = hoy()) {
    const g = estado.gym;
    if (g.encurso) {
        if (g.encurso.rutina !== rutinaId) throw new Error("Ya tienes un entrenamiento en curso: termínalo o cancélalo primero.");
        return;
    }
    if (!gym.rutinaPorId(rutinaId)) throw new Error("Esa rutina no existe.");
    if (fecha !== hoy() && fecha !== sumarDias(hoy(), -1)) throw new Error("Solo puedes anotar el entrenamiento de hoy o de ayer.");
    if (g.sesiones.some((s) => s.fecha === fecha && s.rutina === rutinaId)) {
        throw new Error("Esa rutina ya la hiciste ese día. ¡El músculo crece descansando!");
    }
    g.encurso = gym.crearEntrenamiento(rutinaId, fecha, g.sesiones);
    // (v76) Aurelio te recibe en el gimnasio.
    const primero = gym.ejercicioPorId(g.encurso.ejercicios[0].id);
    return { frase: { tipo: "inicio", texto: gymAurelio.fraseDeGym("inicio", { nombre: estado.personaje.nombre, ejercicio: primero.nombre }, g.sesiones.length) } };
}

export function cancelarGym(estado) {
    entrenamientoEnCurso(estado);
    estado.gym.encurso = null;
}

// Marca o desmarca una serie como hecha.
export function marcarSerieGym(estado, ejercicio, serie) {
    const en = entrenamientoEnCurso(estado);
    const s = en.ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    s.hecha = !s.hecha;
    delete s.contando;
    if (!s.hecha) return { hecha: false };

    // (v76) Aurelio te dice algo según el momento: primera serie, récord, ejercicio terminado, mitad, última…
    const total = en.ejercicios.reduce((suma, ej) => suma + ej.series.length, 0);
    const hechas = gym.seriesMarcadas(en);
    const ej = en.ejercicios[ejercicio];
    const info = gym.ejercicioPorId(ej.id);
    const mejor = gym.mejoresDe(estado.gym.sesiones)[ej.id]?.puntaje || 0;
    const esRecord = mejor > 0 && gym.puntajeDe(s.kg, s.reps) > mejor;
    const ejercicioListo = ej.series.every((x) => x.hecha);
    const pendiente = en.ejercicios.find((x) => x.series.some((y) => !y.hecha));
    const tipo = hechas >= total ? "ultima" : esRecord ? "record" : ejercicioListo ? (pendiente ? "ejercicio" : "ejercicioFinal")
        : hechas === 1 ? "primera" : hechas === Math.ceil(total / 2) ? "mitad" : "serie";
    const frase = gymAurelio.fraseDeGym(tipo, {
        nombre: estado.personaje.nombre, ejercicio: info.nombre, siguiente: pendiente ? gym.ejercicioPorId(pendiente.id).nombre : "",
    }, hechas + ejercicio * 3 + serie);
    return { hecha: true, frase: { tipo, texto: frase } };
}

// (v76) El calentamiento: marcarlo da un poco de XP al terminar el entrenamiento.
export function calentarGym(estado) {
    const en = entrenamientoEnCurso(estado);
    en.calentado = !en.calentado;
    return { calentado: en.calentado, frase: en.calentado ? gymAurelio.fraseDeGym("calentado", { nombre: estado.personaje.nombre }, estado.gym.sesiones.length) : null };
}

// Anota el peso (kg) o las repeticiones de una serie.
export function anotarSerieGym(estado, ejercicio, serie, campo, valor) {
    const s = entrenamientoEnCurso(estado).ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    if (campo === "kg") s.kg = numeroEntre(valor === "" ? 0 : valor, 0, gym.MAX_KG, "El peso");
    else if (campo === "reps") s.reps = Math.round(numeroEntre(valor === "" ? 0 : valor, 0, gym.MAX_REPS, "Las repeticiones"));
    else throw new Error("Ese dato no existe.");
}

// Suma un ejercicio extra (de gym.EXTRAS) al entrenamiento en curso.
export function agregarEjercicioGym(estado, ejercicioId) {
    const en = entrenamientoEnCurso(estado);
    const ej = gym.EXTRAS.find((x) => x.id === ejercicioId);
    if (!ej) throw new Error("Ese ejercicio no existe.");
    if (en.ejercicios.some((x) => x.id === ejercicioId)) throw new Error("Ese ejercicio ya está en tu entrenamiento.");
    en.ejercicios.push({ ...gym.ejercicioDelEntrenamiento(ej, estado.gym.sesiones), extra: true });
}

// (v80) Contar las repeticiones tocando: la primera vez empieza de cero y cada toque suma una. Se apaga al marcar la serie.
export function contarRepeticionGym(estado, ejercicio, serie) {
    const ej = entrenamientoEnCurso(estado).ejercicios[ejercicio];
    const s = ej?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    if (s.hecha) throw new Error("Esa serie ya está marcada.");
    if (!s.contando) { s.contando = true; s.reps = 0; }
    s.reps = Math.min(gym.MAX_REPS, s.reps + 1);
    return { reps: s.reps, meta: gym.ejercicioPorId(ej.id).max };
}

// (v78) Sube o baja el peso (de 2,5 en 2,5 kg) o las repeticiones de una serie con los botones + y −.
export function ajustarSerieGym(estado, ejercicio, serie, campo, delta) {
    const s = entrenamientoEnCurso(estado).ejercicios[ejercicio]?.series[serie];
    if (!s) throw new Error("Esa serie no existe.");
    if (campo === "kg") s.kg = Math.max(0, Math.min(gym.MAX_KG, Math.round((s.kg + delta) * 100) / 100));
    else if (campo === "reps") s.reps = Math.max(0, Math.min(gym.MAX_REPS, Math.round(s.reps + delta)));
    else throw new Error("Ese dato no existe.");
}

// Una serie extra al final de un ejercicio (copia la anterior) o quitar la última.
export function cambiarSeriesGym(estado, ejercicio, delta) {
    const ej = entrenamientoEnCurso(estado).ejercicios[ejercicio];
    if (!ej) throw new Error("Ese ejercicio no existe.");
    if (delta > 0) {
        if (ej.series.length >= gym.MAX_SERIES) throw new Error(`Máximo ${gym.MAX_SERIES} series por ejercicio.`);
        const ultima = ej.series[ej.series.length - 1] || { kg: 0, reps: 10 };
        ej.series.push({ kg: ultima.kg, reps: ultima.reps, hecha: false });
    } else if (ej.series.length > 1) {
        ej.series.pop();
    }
}

// Termina el entrenamiento: lo guarda, da el XP de Fuerza, las monedas y los hitos, y avisa de los récords.
export function terminarGym(estado) {
    const entrenamiento = entrenamientoEnCurso(estado);
    const sesion = gym.cerrarEntrenamiento(entrenamiento, estado.gym.sesiones);
    const resultado = guardarSesionGym(estado, sesion);
    estado.gym.encurso = null;
    return resultado;
}

// (v74) La meta que se marca: dices que hoy (o ayer) entrenaste esa rutina, sin anotar series.
export function marcarGymRapido(estado, rutinaId, fecha = hoy()) {
    const g = estado.gym;
    if (!gym.rutinaPorId(rutinaId)) throw new Error("Esa rutina no existe.");
    if (fecha !== hoy() && fecha !== sumarDias(hoy(), -1)) throw new Error("Solo puedes marcar el entrenamiento de hoy o de ayer.");
    if (g.sesiones.some((s) => s.fecha === fecha && s.rutina === rutinaId)) {
        throw new Error("Esa rutina ya la marcaste ese día. ¡El músculo crece descansando!");
    }
    return guardarSesionGym(estado, gym.sesionRapida(rutinaId, fecha));
}

// Guarda una sesión ya armada: da el XP de Fuerza y las monedas, y avisa de niveles, músculos, lecturas, mazmorras e hitos.
function guardarSesionGym(estado, sesion) {
    const g = estado.gym;
    const nivelAntes = gym.nivelDeGym(g.sesiones).nivel;
    const fraguaAntes = torre.lugarAbierto(torre.arcadeConGym(estado), "fragua");
    const musculosAntes = gym.nivelesDeMusculos(g.sesiones);
    g.sesiones.push(sesion);
    g.sesiones.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    ganar(estado, { xp: sesion.xp, monedas: sesion.monedas, atributo: "fuerza" });

    const rutina = gym.rutinaPorId(sesion.rutina);
    const celebraciones = [{ icono: rutina.icono, etiqueta: sesion.rapido ? "¡Meta del día cumplida!" : sesion.completa ? "¡Entrenamiento completo!" : "Entrenamiento guardado",
                             titulo: rutina.nombre, detalle: `+${sesion.xp} XP de 💪 Fuerza${sesion.monedas ? ` · +${sesion.monedas} 🪙` : ""}`,
                             maestro: gymAurelio.fraseDeGym(sesion.rapido ? "marcado" : "fin", { nombre: estado.personaje.nombre }, g.sesiones.length) }];
    for (const r of sesion.records) {
        const ej = gym.ejercicioPorId(r.id);
        celebraciones.push({ icono: "📈", etiqueta: "¡Récord personal!", titulo: ej.nombre, detalle: "Superaste tu mejor marca. Eso es sobrecarga progresiva." });
    }
    const nivelAhora = gym.nivelDeGym(g.sesiones).nivel;
    if (nivelAhora > nivelAntes) {
        const rango = gym.rangoDe(nivelAhora);
        celebraciones.push({ icono: rango.icono, etiqueta: "¡Subiste de nivel de gym!", titulo: `Gym nivel ${nivelAhora} · ${rango.nombre}`,
                             detalle: `Tu héroe gana +${Math.round(gym.bonoDeGym(nivelAhora) * 100)} % de vida y ataque en la Torre.` });
    }
    // (v82) Tu físico subió de escalón: se muestra tu cuerpo de antes y el de ahora.
    if (gym.fisicoDe(nivelAhora) > gym.fisicoDe(nivelAntes)) {
        const corpulencia = gym.corpulenciaDe(gym.imcActual(g));
        celebraciones.push({ icono: "🏋️", etiqueta: "¡Tu cuerpo cambió!", titulo: `Físico: ${gym.NOMBRES_DE_FISICO[gym.fisicoDe(nivelAhora)]}`,
                             detalle: "Mira cómo se ve tu cuerpo ahora comparado con antes.", maestro: "Eso no se logra en un día, " + estado.personaje.nombre + ": se logra en muchos.",
                             cuerpo: { antes: { fisico: gym.fisicoDe(nivelAntes), corpulencia }, despues: { fisico: gym.fisicoDe(nivelAhora), corpulencia } } });
    }
    // Tu cuerpo abre la Fragua Profunda (nivel 5 de gym).
    if (!fraguaAntes && torre.lugarAbierto(torre.arcadeConGym(estado), "fragua")) {
        celebraciones.push({ icono: "⚒️", etiqueta: "¡Se abrió una mazmorra!", titulo: bestiario.LUGARES.fragua.nombre,
                             detalle: "Tu entrenamiento te dejó bajar a la Fragua Profunda. Búscala en el Arcade.", maestro: "Solo un cuerpo entrenado aguanta ese calor, " + estado.personaje.nombre + "." });
    }
    // Maren te deja una lectura nueva cada vez que subes al nivel que la abre.
    for (const lectura of fragua.LECTURAS) {
        if (lectura.nivel > nivelAntes && lectura.nivel <= nivelAhora) {
            celebraciones.push({ icono: "📜", etiqueta: "Maren te dejó una lectura", titulo: lectura.titulo, detalle: "Léela en el Gimnasio › Lecturas de la Fragua.", maestro: lectura.moraleja });
        }
    }
    const musculosAhora = gym.nivelesDeMusculos(g.sesiones);
    for (const [clave, m] of Object.entries(musculosAhora)) {
        if (m.nivel > musculosAntes[clave].nivel) {
            celebraciones.push({ pequena: true, icono: gym.MUSCULOS[clave].icono, titulo: `${gym.MUSCULOS[clave].nombre} subió a nivel ${m.nivel}` });
        }
    }
    // Si elegiste una misión (ej: «Ir al gym»), se marca sola ese día: no hace falta anotarlo dos veces.
    const mision = g.mision && estado.misiones.find((m) => m.id === g.mision && !m.archivadaEn);
    if (mision) {
        try {
            completarMision(estado, mision.id, sesion.fecha);
            celebraciones.push({ pequena: true, icono: "✅", titulo: `Misión «${mision.nombre}» marcada` });
        } catch (error) {
            // ya estaba marcada, o no tocaba ese día: no pasa nada
        }
    }
    for (const hito of gym.hitosNuevos(g, hoy())) {
        g.hitos.push(hito.id);
        ganar(estado, { gemas: hito.gemas });
        celebraciones.push({ icono: hito.icono, etiqueta: "¡Hito de gym!", titulo: hito.titulo, detalle: `${hito.texto} +${hito.gemas} 💎` });
    }
    // (v79) El reto de la semana de esa sesión: si ya lo cumpliste y no lo habías cobrado, se cobra.
    const lunes = lunesDe(sesion.fecha);
    const reto = gym.progresoDelReto(g, lunes);
    if (reto.cumplido && !reto.cobrado) {
        g.retosCobrados.push(lunes);
        ganar(estado, { gemas: gym.PREMIO_RETO.gemas, xp: gym.PREMIO_RETO.xp, atributo: "fuerza" });
        celebraciones.push({ icono: reto.reto.icono, etiqueta: "¡Reto de la semana cumplido!", titulo: reto.reto.texto(g),
                             detalle: `+${gym.PREMIO_RETO.gemas} 💎 · +${gym.PREMIO_RETO.xp} XP de 💪 Fuerza`, maestro: "Te lo propuse el lunes y lo cumpliste, " + estado.personaje.nombre + ". Así se hace." });
    }
    return { sesion, celebraciones };
}

// Borra una sesión equivocada y le quita lo que había dado (los hitos ya cobrados se quedan).
export function borrarSesionGym(estado, indice) {
    const sesion = estado.gym.sesiones[indice];
    if (!sesion) throw new Error("Esa sesión no existe.");
    estado.gym.sesiones.splice(indice, 1);
    ganar(estado, { xp: -sesion.xp, monedas: -sesion.monedas, atributo: "fuerza" });
}

// Anota tu peso corporal de hoy (si ya lo anotaste, lo cambia).
export function anotarPesoGym(estado, kg) {
    const valor = numeroEntre(kg, 20, 400, "El peso corporal");
    const lista = estado.gym.peso;
    const hoyTexto = hoy();
    const existente = lista.find((p) => p.fecha === hoyTexto);
    if (existente) existente.kg = valor;
    else lista.push({ fecha: hoyTexto, kg: valor });
    lista.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    if (lista.length > 400) lista.splice(0, lista.length - 400);
}

// Tu altura en centímetros (para calcular el IMC).
export function anotarAlturaGym(estado, cm) {
    estado.gym.altura = Math.round(numeroEntre(cm, 100, 230, "La altura"));
}

// (v82) Tu peso objetivo (vacío = quitarlo).
export function anotarMetaPesoGym(estado, kg) {
    estado.gym.metaPeso = kg === "" || kg === null ? null : numeroEntre(kg, 20, 400, "El peso objetivo");
}

// (v82) Tus medidas del día (en cm). Puedes anotar solo algunas; si ya anotaste hoy, se completan o se cambian.
export function anotarMedidasGym(estado, valores) {
    const nuevas = {};
    for (const clave of Object.keys(gym.MEDIDAS)) {
        const crudo = valores[clave];
        if (crudo === undefined || crudo === null || String(crudo).trim() === "") continue;
        nuevas[clave] = numeroEntre(crudo, 10, 250, `La medida de ${gym.MEDIDAS[clave].nombre.toLowerCase()}`);
    }
    if (!Object.keys(nuevas).length) throw new Error("Anota al menos una medida.");
    const lista = estado.gym.medidas;
    const hoyTexto = hoy();
    const existente = lista.find((m) => m.fecha === hoyTexto);
    if (existente) Object.assign(existente, nuevas);
    else lista.push({ fecha: hoyTexto, ...nuevas });
    lista.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    if (lista.length > 400) lista.splice(0, lista.length - 400);
}

export function cambiarAjusteGym(estado, clave, valor) {
    if (clave === "meta") estado.gym.metaSemanal = Math.round(numeroEntre(valor, 1, 7, "La meta"));
    else if (clave === "foco") {
        estado.gym.foco = Boolean(valor);
    } else if (clave === "mision") {
        const id = valor === "" || valor === null ? null : Number(valor);
        if (id !== null && !estado.misiones.some((m) => m.id === id && !m.archivadaEn)) throw new Error("Esa misión no existe.");
        estado.gym.mision = id;
    } else if (clave === "descanso") {
        const seg = Number(valor);
        if (!gym.DESCANSOS.includes(seg)) throw new Error("Ese descanso no existe.");
        estado.gym.descanso = seg;
    } else throw new Error("Ese ajuste no existe.");
}
