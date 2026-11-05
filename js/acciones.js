// acciones.js — Todo lo que CAMBIA la partida.
//
// Cada función recibe el "estado" (la partida completa) y lo modifica.
// Si algo no se puede hacer, lanza un error con un mensaje en español
// (throw new Error("...")) y app.js lo muestra en pantalla.
//
// Ninguna función de aquí guarda ni dibuja: de eso se encarga app.js.
//
// (v178) Se dividió por área: el Gimnasio, el Running y las Finanzas viven en acciones-gym.js, acciones-running.js
// y acciones-finanzas.js; los ayudantes compartidos (ganar, nuevoId, validar…), en acciones-comun.js.
// Este archivo los reexporta: en el resto de la app se sigue usando `acciones.empezarGym(...)`, etc.

import * as juego from "./juego.js";
import * as insignias from "./insignias.js";   // (v101)
import * as avatar from "./avatar.js";
import { IDS_FONDO_RETRATO } from "./dibujo/dibujo-retrato-fondos.js";   // (v189)
import * as arcade from "./arcade/arcade.js";
import * as campana from "./campana.js";
import * as memento from "./memento/memento.js";   // (v142) el calendario de Memento Mori
import * as desafios from "./desafios.js";
import * as maestro from "./maestro.js";
import * as memorias from "./historias/memorias.js";
import * as saga from "./historias/saga.js";
import * as vida from "./vida.js";
import * as pacto from "./pacto.js";
import * as eventos from "./eventos.js";
import * as rituales from "./rituales.js";
import * as cofre from "./cofre.js";
import * as mapa from "./mapa.js";
import * as mascota from "./mascota.js";
import { PISTAS } from "./musica.js";
import * as equipo from "./equipo.js";
import * as resumen from "./resumen.js";
import * as temporadas from "./temporadas.js";   // (v149) las metas del mes
import * as secretos from "./secretos.js";         // (v149) los logros secretos
import * as voces from "./voces/voces.js";
import { hoy, diasEntre, sumarDias, lunesDe, esFechaValida } from "./fechas.js";
import { nuevoId, buscar, validarNombre, validarDificultad, ganar, validarDias, validarAviso, revisarQueNoEstesCaido, anotarArmadura, asegurarRetoDelDia, cobrarReto, nivelesDeAtributos } from "./acciones-comun.js";
import { crearTarea } from "./acciones-misiones.js";
import { revisarLogros, sincronizarCampanas } from "./acciones-aventuras.js";

export { ganar, asegurarRetoDelDia } from "./acciones-comun.js";
export * from "./acciones-misiones.js";    // (orden) misiones, tareas, enfoque y diario
export * from "./acciones-aventuras.js";   // (orden) principales, jefes, logros y tienda
export * from "./torre/acciones-torre.js";       // (orden) la Torre y la Mazmorra
export * from "./gym/acciones-gym.js";
export * from "./running/acciones-running.js";
export * from "./finanzas/acciones-finanzas.js";
export * from "./arcade/acciones-plataformas.js";   // (v185) La Senda del Reino



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

// (v189) El fondo del retrato de la cabecera (ver dibujo-retrato-fondos.js). Se guarda solo el id.
export function elegirRetratoFondo(estado, id) {
    if (!IDS_FONDO_RETRATO.includes(id)) throw new Error("Ese fondo no existe.");
    estado.ajustes.retratoFondo = id;
}

// (v49) Cómo te sientes hoy decide cuánto menú ves: mal = modo esencial, normal = sin Aventuras, bien = todo.
export function elegirAnimo(estado, animo) {
    if (!["mal", "normal", "bien"].includes(animo)) throw new Error("Ese ánimo no existe.");
    estado.ajustes.animo = animo;
    estado.ajustes.esencial = animo === "mal";
    // (v179) «Mal» también marca el día como «mal día» (no pierdes vida ni la racha), con un máximo por semana.
    // Si luego cambias de opinión y eliges otra, la marca de hoy se quita.
    const dia = hoy();
    const marcados = (estado.diasMalos || []).filter((d) => d !== dia);
    estado.diasMalos = (animo === "mal" && juego.quedanMalosDias(estado, dia) ? [...marcados, dia] : marcados).sort();
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

// ===== Temporadas (v149) =====
// Cada mes eliges hasta 4 metas. Al empezar el mes siguiente se cierran: se paga el premio y queda el resumen.

// Elige (o corrige) las metas de ESTE mes. Los valores vienen del formulario como meta_misiones, meta_km…;
// lo que se deja vacío no es una meta.
export function elegirMetasDeTemporada(estado, valores) {
    const mes = temporadas.mesDe(hoy());
    const metas = [];
    for (const [tipo, info] of Object.entries(temporadas.METAS)) {
        const texto = String(valores[`meta_${tipo}`] ?? "").trim().replace(",", ".");
        if (!texto) continue;
        const meta = Number(texto);
        const tope = info.unidad === "días" ? temporadas.diasDelMes(mes) : 100000;
        if (!Number.isFinite(meta) || meta < 1 || meta > tope) {
            throw new Error(`La meta «${info.nombre}» debe ser un número entre 1 y ${tope}.`);
        }
        metas.push({ tipo, meta: tipo === "km" ? Math.round(meta * 10) / 10 : Math.round(meta) });
    }
    if (metas.length < 1 || metas.length > temporadas.MAX_METAS) {
        throw new Error(`Elige entre 1 y ${temporadas.MAX_METAS} metas (deja vacías las que no quieras).`);
    }
    estado.temporadas[mes] = { metas, cierre: null };
}

// Al abrir la app: cierra las temporadas de meses que ya pasaron. Paga por cada meta cumplida (y el regalo
// si cumpliste todas) y guarda el resumen para contártelo en Hoy.
export function cerrarTemporadas(estado) {
    const celebraciones = [];
    const actual = temporadas.mesDe(hoy());
    for (const mes of Object.keys(estado.temporadas).sort()) {
        const guardada = estado.temporadas[mes];
        if (guardada.cierre || mes >= actual) continue;
        celebraciones.push(...cobrarPase(estado, mes));   // (v150) los niveles que alcanzaste y no cobraste, antes de cerrar
        const info = temporadas.temporadaDe(estado, mes, hoy());
        const premio = temporadas.premioDeTemporada(info.cumplidas, info.todas);
        ganar(estado, premio);
        guardada.cierre = {
            fecha: hoy(),
            cumplidas: info.cumplidas,
            total: info.total,
            todas: info.todas,
            valores: info.metas.map((m) => ({ tipo: m.tipo, meta: m.meta, valor: m.valor })),
            premio,
            numeros: temporadas.numerosDelMes(estado, mes, hoy()),
            visto: false,
        };
        celebraciones.push({ icono: "🗓️", etiqueta: `Temporada de ${temporadas.nombreDelMes(mes)} cerrada`,
                             titulo: `${info.cumplidas} de ${info.total} metas`,
                             detalle: premio.xp ? `+${premio.xp} XP · +${premio.gemas} 💎${premio.monedas ? ` · +${premio.monedas} 🪙` : ""}` : "Mira el resumen en Hoy." });
    }
    return { celebraciones };
}

// Pase de temporada (v150): cobra los niveles que ya alcanzaste en ese mes. Cada nivel se cobra una sola vez.
export function cobrarPase(estado, mes) {
    const guardada = estado.temporadas[mes];
    if (!guardada) return [];
    const pendientes = temporadas.nivelesPorCobrar(estado, mes, hoy());
    guardada.pase ||= { cobrados: [] };
    return pendientes.map((nivel) => {
        guardada.pase.cobrados.push(nivel.porcentaje);
        ganar(estado, nivel);
        const premio = [nivel.xp ? `+${nivel.xp} XP` : "", nivel.gemas ? `+${nivel.gemas} 💎` : "", nivel.monedas ? `+${nivel.monedas} 🪙` : ""]
            .filter(Boolean).join(" · ");
        return { icono: "🎖️", etiqueta: `Pase de ${temporadas.nombreDelMes(mes)}`,
                 titulo: `${nivel.porcentaje} % · ${nivel.texto}`, detalle: premio };
    });
}

// Cierra la tarjeta con el resumen de una temporada que ya pasó.
export function cerrarResumenTemporada(estado, mes) {
    const guardada = estado.temporadas[mes];
    if (!guardada?.cierre) throw new Error("Esa temporada no está cerrada.");
    guardada.cierre.visto = true;
}

// Revisión semanal: aplica el cambio que propuso la pista (quitar un día, poner un aviso o bajar la dificultad).
// Se vuelve a calcular aquí, así que solo se puede aplicar lo que de verdad se propuso.
export function aplicarSugerencia(estado, { misionId, lunes }) {
    if (!esFechaValida(lunes) || lunesDe(lunes) !== lunes) throw new Error("Esa semana no es válida.");
    const pista = resumen.pistaDeFallas(estado, lunes);
    const cambio = pista?.sugerencia;
    if (!cambio || pista.misionId !== Number(misionId)) throw new Error("Esa sugerencia ya no se puede aplicar.");
    const mision = buscar(estado.misiones, pista.misionId, "esa misión");
    if (cambio.tipo === "quitar-dia") {
        const quedan = (mision.dias || [0, 1, 2, 3, 4, 5, 6]).filter((d) => d !== cambio.dia);
        mision.dias = quedan.length === 7 ? null : quedan;
    } else if (cambio.tipo === "aviso") {
        mision.aviso = validarAviso(cambio.hora);
    } else if (cambio.tipo === "bajar") {
        mision.dificultad = validarDificultad(cambio.dificultad);
    }
    return { cambio: cambio.tipo, mision: mision.nombre };
}

// Dificultad adaptable (v151): aplica el ajuste que propuso resumen.ajusteDeDificultad.
// Se vuelve a calcular aquí, así que solo se puede aplicar lo que de verdad se propuso hoy.
// Lo que ya se hizo no cambia: cada registro guarda la dificultad de su día.
export function aplicarDificultad(estado, { misionId }) {
    const mision = buscar(estado.misiones, Number(misionId), "esa misión");
    const ajuste = resumen.ajusteDeDificultad(estado, mision, hoy());
    if (!ajuste) throw new Error("Esa sugerencia ya no se puede aplicar.");
    mision.dificultad = validarDificultad(ajuste.dificultad);
    return { cambio: ajuste.tipo, mision: mision.nombre, dificultad: mision.dificultad };
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


// ===== Vida: pociones y modo descanso =====
// La vida se calcula en vida.js. Aquí solo se guardan las pociones y los descansos.


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


// ===== (v103) Cuidar a tu mascota =====

// Un cuidado (acariciar, jugar, cepillar, entrenar): cada uno, una vez al día por mascota. Sube el vínculo.
export function cuidarMascota(estado, tipo) {
    const cuidado = mascota.CUIDADOS[tipo];
    if (!cuidado) throw new Error("Ese cuidado no existe.");
    const fecha = hoy();
    const especie = mascota.especieActiva(estado);
    const nombre = mascota.nombreDe(estado, especie);
    const etapa = avatar.etapaSegun(avatar.ETAPAS_MASCOTA, mascota.totalDe(estado, especie)).clave;
    if (etapa === "huevo" && !cuidado.huevo) throw new Error(`${nombre} todavía es un huevo: espera a que nazca.`);
    const hechos = mascota.cuidadosDeHoy(estado, especie, fecha);
    if (hechos.includes(tipo)) return { repetido: true, nombre };   // acariciar otra vez se puede, pero ya no suma
    if (estado.mascota.cuidados?.fecha !== fecha) estado.mascota.cuidados = { fecha, hechos: {} };
    estado.mascota.cuidados.hechos[especie] = [...hechos, tipo];
    const antes = mascota.nivelDeVinculo(mascota.vinculoDe(estado, especie));
    estado.mascota.vinculo ||= {};
    estado.mascota.vinculo[especie] = mascota.vinculoDe(estado, especie) + cuidado.puntos;
    const despues = mascota.nivelDeVinculo(estado.mascota.vinculo[especie]);
    const celebraciones = [];
    if (despues.indice > antes.indice) {
        const truco = mascota.TRUCOS.find((t) => t.nivel === despues.indice);
        celebraciones.push({ icono: "🐾", etiqueta: `Vínculo con ${nombre}`, titulo: despues.nombre,
                             detalle: truco ? `Aprendió un truco: ${truco.nombre}.` : `Ahora pelea ${Math.round(despues.bono * 100)} % más fuerte en la Torre.` });
    }
    return { celebraciones, nombre, puntos: cuidado.puntos };
}

// Explorar: una vez al día, tu mascota sale y vuelve con algo.
export function explorarConMascota(estado, azar = Math.random) {
    const fecha = hoy();
    const especie = mascota.especieActiva(estado);
    const nombre = mascota.nombreDe(estado, especie);
    const etapa = avatar.etapaSegun(avatar.ETAPAS_MASCOTA, mascota.totalDe(estado, especie)).clave;
    if (etapa === "huevo") throw new Error(`${nombre} todavía es un huevo: no puede salir.`);
    estado.mascota.exploraciones ||= {};
    if (estado.mascota.exploraciones[fecha]) throw new Error("Hoy ya salió a explorar. Mañana puede volver a salir.");
    const hallazgo = mascota.explorar(nombre, azar);
    estado.mascota.exploraciones[fecha] = { especie, tipo: hallazgo.tipo, cantidad: hallazgo.cantidad, texto: hallazgo.texto };
    if (hallazgo.tipo === "gemas") ganar(estado, { gemas: hallazgo.cantidad });
    if (hallazgo.tipo === "fichas") estado.arcade.extra = (estado.arcade.extra || 0) + hallazgo.cantidad;
    estado.mascota.vinculo ||= {};
    estado.mascota.vinculo[especie] = mascota.vinculoDe(estado, especie) + mascota.VINCULO_EXPLORAR;
    return { hallazgo };
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

// ===== Insignias (v101) =====

// Las insignias nuevas se celebran una vez. La primera vez que se mira (partida vieja o nueva) se anotan las que ya
// tenías, en silencio. Si se ganan varias juntas, se celebran las 2 primeras y las demás en un aviso pequeño.
export function revisarInsignias(estado, info = juego.resumen(estado, hoy())) {
    if (!estado.personaje) return [];
    estado.insignias ||= { vistas: null, puesta: null };
    const ahora = insignias.ganadas(estado, info);
    if (!estado.insignias.vistas) {
        estado.insignias.vistas = ahora;
        return [];
    }
    const nuevas = ahora.filter((id) => !estado.insignias.vistas.includes(id));
    estado.insignias.vistas.push(...nuevas);
    return nuevas.map((id, i) => {
        const insignia = insignias.POR_ID[id];
        return i < 2
            ? { insignia: id, etiqueta: `¡Insignia de ${insignias.GRADOS[insignia.grado].nombre.toLowerCase()}!`, titulo: insignia.nombre,
                detalle: `${insignia.texto}. Póntela en Héroe › Insignias.` }
            : { pequena: true, icono: "🏅", titulo: `Insignia nueva: ${insignia.nombre}` };
    });
}

// Llevar puesta una insignia (o quitarla, si ya la llevabas). Solo se puede una que ya ganaste.
export function ponerInsignia(estado, id) {
    if (!insignias.POR_ID[id]) throw new Error("Esa insignia no existe.");
    if (!insignias.ganadas(estado, juego.resumen(estado, hoy())).includes(id)) throw new Error("Todavía no ganaste esa insignia.");
    estado.insignias ||= { vistas: null, puesta: null };
    estado.insignias.puesta = estado.insignias.puesta === id ? null : id;
    return {};
}

// ===== Secretos (v149) =====

// Descubre los secretos que acabas de cumplir (ver secretos.js) y paga su premio. Se celebran los 2 primeros;
// los demás salen en un aviso pequeño. Si ya cumplías alguno al actualizar, se descubre en la primera acción.
function revisarSecretos(estado) {
    estado.secretos ||= {};
    return secretos.nuevosSecretos(estado, hoy()).map((secreto, i) => {
        estado.secretos[secreto.id] = hoy();
        ganar(estado, secreto.premio);
        return i < 2
            ? { icono: secreto.icono, etiqueta: "🗝️ ¡Secreto descubierto!", titulo: secreto.nombre,
                detalle: `${secreto.texto} +${secreto.premio.gemas} 💎 · +${secreto.premio.xp} XP` }
            : { pequena: true, icono: secreto.icono, titulo: `Secreto descubierto: ${secreto.nombre}` };
    });
}

export function revisarCambios(estado, antes) {
    // Primero los jefes y los cofres: sus recompensas pueden hacerte subir de nivel.
    const celebraciones = [...sincronizarCampanas(estado, antes.dano), ...revisarDesafios(estado), ...revisarRelampago(estado)];
    const info = juego.resumen(estado, hoy());
    celebraciones.push(...revisarInsignias(estado, info));   // (v101)
    celebraciones.push(...revisarSecretos(estado));          // (v149)
    celebraciones.push(...cobrarPase(estado, temporadas.mesDe(hoy())));   // (v150) el pase del mes en curso

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



// ===== El calendario de Memento Mori (v142) =====
// Guarda tu fecha de nacimiento y hasta qué edad cuentas vivir. No da XP: es solo para mirar y pensar.
export function configurarMemento(estado, valores) {
    estado.memento = memento.leerDatos(valores, hoy());
}

export function quitarMemento(estado) {
    estado.memento = { nacimiento: null, esperanza: memento.ESPERANZA_INICIAL };
}
