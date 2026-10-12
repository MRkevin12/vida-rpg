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
import { hoy, diasEntre, sumarDias } from "./fechas.js";


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

// Suma (o resta, si los números son negativos) XP, monedas y XP de un atributo.
// Nada baja de 0.
export function ganar(estado, { xp = 0, monedas = 0, atributo = null }) {
    const personaje = estado.personaje;
    personaje.xp = Math.max(0, personaje.xp + xp);
    personaje.monedas = Math.max(0, personaje.monedas + monedas);
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
        creadoEn: hoy(),
    };
    estado.ultimaVisita = hoy();
}

export function renombrar(estado, nombre) {
    estado.personaje.nombre = validarNombre(nombre, 30);
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

export function crearMision(estado, { nombre, dificultad, atributo, dias }) {
    if (!juego.DIFICULTADES[dificultad]) throw new Error("Elige una dificultad.");
    estado.misiones.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        dificultad,
        atributo: validarAtributo(atributo),
        dias: validarDias(dias),
        creadaEn: hoy(),
        archivadaEn: null,
        pausas: [],
    });
}

// Editar una misión. Lo que ya completaste no cambia: cada registro del
// historial guardó su propia XP, dificultad y atributo.
export function editarMision(estado, { id, nombre, dificultad, atributo, dias }) {
    const mision = buscar(estado.misiones, Number(id), "esa misión");
    if (!juego.DIFICULTADES[dificultad]) throw new Error("Elige una dificultad.");
    mision.nombre = validarNombre(nombre, 60);
    mision.dificultad = dificultad;
    mision.atributo = validarAtributo(atributo);
    mision.dias = validarDias(dias);
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

// Solo se puede marcar hoy o ayer (por si se te olvidó).
function validarFecha(fecha) {
    const actual = hoy();
    if (fecha !== actual && fecha !== sumarDias(actual, -1)) {
        throw new Error("Solo puedes marcar misiones de hoy o de ayer.");
    }
    return fecha;
}

export function completarMision(estado, id, fecha = hoy()) {
    const mision = buscar(estado.misiones, id, "esa misión");
    validarFecha(fecha);
    if (!juego.tocaEseDia(mision, fecha)) throw new Error("Esa misión no tocaba ese día.");
    if (estado.completadas.some((c) => c.misionId === id && c.fecha === fecha)) {
        throw new Error("Esa misión ya estaba completada ese día.");
    }

    const { xp, monedas } = juego.DIFICULTADES[mision.dificultad];
    // Guardamos cuánto dio (y su dificultad y atributo de ese momento), para poder
    // restarlo exacto si la desmarcas y para que editar la misión no cambie el pasado.
    estado.completadas.push({ misionId: id, fecha, xp, monedas, atributo: mision.atributo, dificultad: mision.dificultad });
    ganar(estado, { xp, monedas, atributo: mision.atributo });
    return { xp };
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


// ===== Misiones principales =====

export function crearPrincipal(estado, { nombre, atributo, submisiones }) {
    // El cuadro de texto trae una submisión por línea.
    const pasos = String(submisiones || "").split("\n").map((linea) => linea.trim()).filter(Boolean);
    if (pasos.length === 0) throw new Error("Escribe al menos una submisión (una por línea).");
    if (pasos.some((paso) => paso.length > 80)) throw new Error("Cada submisión puede tener máximo 80 letras.");

    estado.principales.push({
        id: nuevoId(estado),
        nombre: validarNombre(nombre, 60),
        atributo: validarAtributo(atributo),
        creadaEn: hoy(),
        completadaEn: null,
        archivada: false,
        submisiones: pasos.map((paso) => ({ id: nuevoId(estado), nombre: paso, hecha: false })),
    });
}

export function agregarSubmision(estado, principalId, nombre) {
    const principal = buscar(estado.principales, principalId, "esa misión principal");
    if (principal.completadaEn) throw new Error("Esa misión principal ya está completada.");
    principal.submisiones.push({ id: nuevoId(estado), nombre: validarNombre(nombre, 80), hecha: false });
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
        ganar(estado, { ...premio, atributo: principal.atributo });
        return { xp: premio.xp, celebraciones: revisarPrincipal(estado, principal) };
    }

    // Desmarcar: se resta el premio del paso y, si ya estaba completada, también el extra.
    sub.hecha = false;
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
            const jefe = c.campana.jefes[dados - 1];
            const premio = campana.premioJefe(dados);
            ganar(estado, { ...premio, atributo: categoria });
            celebraciones.push({
                imagen: campana.imagenDe(jefe.id),
                etiqueta: "¡Jefe derrotado!",
                titulo: jefe.nombre,
                detalle: `Venciste: ${jefe.titulo} · +${premio.xp} XP · +${premio.monedas} monedas`,
            });
            if (dados === campana.VIDAS.length) {
                celebraciones.push({ icono: "👑", etiqueta: "¡Campaña completada!", titulo: c.campana.nombre,
                                     detalle: "Derrotaste a los 5 jefes de esta categoría." });
            }
        }
        while (dados > c.derrotados) {
            const premio = campana.premioJefe(dados);
            ganar(estado, { xp: -premio.xp, monedas: -premio.monedas, atributo: categoria });
            dados -= 1;
        }
        recompensados[categoria] = dados;

        // Aviso del golpe al jefe actual.
        const golpe = c.dano - (danoAntes[categoria] || 0);
        if (golpe > 0 && c.jefe && !cayoAlguno) {
            celebraciones.push({ pequena: true, icono: "⚔️",
                                 titulo: `${c.jefe.nombre} −${golpe} (le quedan ${c.vida} de vida)` });
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
        logro.atributo = validarAtributo(atributo);
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
    const recompensa = buscar(estado.recompensas, id, "esa recompensa");
    const faltan = recompensa.costo - estado.personaje.monedas;
    if (faltan > 0) throw new Error(`Te faltan ${faltan} monedas.`);

    estado.personaje.monedas -= recompensa.costo;
    estado.canjes.push({ nombre: recompensa.nombre, costo: recompensa.costo, fecha: hoy() });
    return {
        celebraciones: [{
            icono: "🎁",
            etiqueta: "Recompensa canjeada",
            titulo: recompensa.nombre,
            detalle: "¡Te lo ganaste! Disfrútalo.",
        }],
    };
}


// ===== Avatar: equipamiento y mascota =====

export function comprarObjeto(estado, id) {
    const objeto = avatar.OBJETOS[id];
    if (!objeto) throw new Error("Ese objeto no existe.");
    if (objeto.logro) throw new Error("Ese objeto no se vende: se gana con un logro.");
    if (estado.avatar.comprados.includes(id)) throw new Error("Ya tienes ese objeto.");
    const faltan = objeto.precio - estado.personaje.monedas;
    if (faltan > 0) throw new Error(`Te faltan ${faltan} monedas.`);

    estado.personaje.monedas -= objeto.precio;
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

export function nombrarMascota(estado, nombre) {
    estado.mascota.nombre = validarNombre(nombre, 20);
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


// ===== Minijuegos =====

// La ficha se gasta al EMPEZAR (si sales a la mitad, igual se gastó).
export function empezarPartida(estado, tipo) {
    if (!arcade.JUEGOS[tipo]) throw new Error("Ese minijuego no existe.");
    if (arcade.fichasDisponibles(estado) < 1) {
        throw new Error("No tienes fichas. Completa una misión diaria para ganar una 🎟️.");
    }
    estado.arcade.usadas += 1;
}

export function terminarPartida(estado, tipo, puntosObtenidos) {
    const juego = arcade.JUEGOS[tipo];
    const puntos = Math.max(0, Math.floor(Number(puntosObtenidos) || 0));
    const premio = arcade.premio(tipo, puntos);
    ganar(estado, { ...premio, atributo: juego.atributo });

    const anterior = estado.arcade.records[tipo] || 0;
    const nuevoRecord = puntos > anterior;
    if (nuevoRecord) estado.arcade.records[tipo] = puntos;

    return {
        puntos,
        premio,
        record: estado.arcade.records[tipo] || 0,
        nuevoRecord: nuevoRecord && puntos > 0,
        celebraciones: nuevoRecord && anterior > 0
            ? [{ icono: "🏅", etiqueta: "¡Nuevo récord!", titulo: `${puntos} puntos`, detalle: juego.nombre }]
            : [],
    };
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
            detalle: `Volviste después de ${dias} días. Aquí no hay castigos: sigue desde donde quedaste.`,
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
        mascota: a.mascota.etapa.clave,
        objetos: avatar.objetosDeLogroGanados(estado, info),
    };
}

export function foto(estado) {
    const info = juego.resumen(estado, hoy());
    return {
        nivel: juego.calcularNivel(estado.personaje.xp).nivel,
        atributos: nivelesDeAtributos(estado),
        escudos: info.racha.escudos,
        dano: campana.danoPorCategoria(estado),
        avatar: fotoDelAvatar(estado, info),
    };
}

export function revisarCambios(estado, antes) {
    // Primero los jefes: sus recompensas pueden hacerte subir de nivel.
    const celebraciones = sincronizarCampanas(estado, antes.dano);
    const info = juego.resumen(estado, hoy());

    const nivel = juego.calcularNivel(estado.personaje.xp).nivel;
    if (nivel > antes.nivel) {
        celebraciones.push({ tipo: "nivel", avatar: true, etiqueta: "¡Subiste de nivel!", titulo: `NIVEL ${nivel}` });
    }

    const atributos = nivelesDeAtributos(estado);
    for (const [clave, nivelAtributo] of Object.entries(atributos)) {
        if (nivelAtributo > antes.atributos[clave]) {
            const a = juego.ATRIBUTOS[clave];
            celebraciones.push({ pequena: true, icono: a.icono, titulo: `${a.nombre} subió a nivel ${nivelAtributo}` });
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
                             detalle: "Equípalo en tu personaje." });
    }
    if (ahora.mascota !== previo.mascota) {
        const nombre = estado.mascota.nombre;
        const textos = {
            cria: { icono: "🐣", etiqueta: "¡El huevo eclosionó!", detalle: `${nombre} salió del huevo.` },
            adulto: { icono: "🐉", etiqueta: "¡Tu mascota creció!", detalle: `${nombre} ya es adulto.` },
        };
        if (textos[ahora.mascota]) celebraciones.push({ ...textos[ahora.mascota], titulo: nombre });
    }
    if ((previo.animo === "dormido" || previo.animo === "cansado") && previo.animo !== ahora.animo) {
        celebraciones.push({ pequena: true, icono: "😃", titulo: "¡Tu héroe despertó!" });
    }
    return celebraciones;
}
