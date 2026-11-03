// acciones-running.js — Lo que cambia la partida en el Running (v109): la carrera en vivo, las carreras a mano y sus premios.
//
// Parte de acciones.js (se dividió por área en la v178). Como allá: cada función recibe el «estado» (la partida),
// lo cambia y lanza Error("mensaje en español") si algo no se puede. acciones.js lo reexporta todo, así que en la app
// se sigue llamando acciones.lo-que-sea.

import * as bestiario from "./bestiario.js";
import * as vida from "./vida.js";
import * as mapa from "./mapa.js";
import * as mascota from "./mascota.js";
import * as ruta from "./ruta.js";
import * as encuentros from "./encuentros.js";   // (v119) criaturas en tus carreras
import * as hallazgos from "./hallazgos.js";     // (v148) cofres y fogatas en el camino
import * as running from "./running.js";   // (v109) el running
import { hoy, sumarDias, lunesDe, aTexto } from "./fechas.js";
import { ganar, numeroEntre } from "./acciones-comun.js";
import { completarMision } from "./acciones.js";   // (es una función: se puede importar aunque acciones.js importe este archivo)

// ===== El running (v109) =====
// Las reglas están en running.js. Aquí se guarda la carrera en vivo, se anotan las carreras a mano y se cobran los premios.

// Los km y los minutos que escribes: con coma o con punto, dentro de un rango.
const kmValido = (valor) => numeroEntre(valor, running.MIN_KM, running.MAX_KM, "La distancia");
const minutosValidos = (valor) => Math.round(numeroEntre(valor, 1, running.MAX_MINUTOS, "El tiempo"));

function entrenamientoRunning(estado) {
    if (!estado.running.encurso) throw new Error("No tienes ninguna carrera en curso.");
    return estado.running.encurso;
}

// Empieza una carrera en vivo. gps: true = el teléfono mide la distancia (la pantalla pide el permiso).
export function empezarCarrera(estado, tipo, { gps = false, objetivo = "", pista = false } = {}) {
    const r = estado.running;
    if (r.encurso) throw new Error("Ya tienes una carrera en curso: termínala o cancélala primero.");
    if (!running.TIPOS[tipo]) throw new Error("Ese tipo de carrera no existe.");
    if (String(objetivo).trim() && !encuentros.leerObjetivo(objetivo)) throw new Error("Escribe el ritmo objetivo como minutos:segundos por km (ej: 6:30), entre 2:30 y 20:00.");
    const inicio = Date.now();
    r.encurso = { inicio, pausas: [], pausadoDesde: null, tipo, gps: Boolean(gps), distancia: 0, ultimo: null, precision: null, traza: [], marcas: [], puntosKm: [],
                  pista: pista && gps ? running.PISTA_METROS : null };   // (v131) en una pista de atletismo: se dibuja la pista y se cuentan las vueltas
    // (v119) Con GPS, cada km trae una criatura. El ritmo objetivo es el que escribiste o, si no, tu promedio.
    if (gps) {
        const propio = encuentros.leerObjetivo(objetivo);
        const kmPorZona = r.kmPorZona || encuentros.KM_POR_ZONA;
        Object.assign(r.encurso, {
            objetivo: propio || encuentros.objetivoPromedio(r.carreras),
            objetivoPropio: Boolean(propio),
            kmPorZona,   // (v132) se queda fijo en esta carrera aunque cambies el ajuste mientras corres
            encuentros: [encuentros.criaturaDelKm(inicio, 1, kmPorZona)],
            kmActual: kmActualNuevo(),   // lo que hace falta para decidir la pelea del km (y sus golpes, v139)
            tramo: { hechos: 0, desde: null, tAntes: null },   // (v139) los tramos de 100 m: cuántos van y cuándo empezó el actual (ms de carrera)
        });
        bestiario.anotarEncuentro(estado.arcade.bestiario, r.encurso.encuentros[0].id);
    }
}

// Pausa o reanuda el cronómetro. Al reanudar se olvida el último punto del GPS: si no, sumaría el camino de la pausa.
export function alternarPausaCarrera(estado, ahora = Date.now(), { contar = true } = {}) {
    const en = entrenamientoRunning(estado);
    if (en.pausadoDesde) {
        en.pausas.push({ desde: en.pausadoDesde, hasta: ahora });
        en.pausadoDesde = null;
        en.ultimo = null;
        en.filtro = null;      // (v131) el filtro empieza de nuevo donde estés
        en.autopausa = false;
        en.quieto = null;
        return { pausada: false };
    }
    en.pausadoDesde = ahora;
    if (en.kmActual && contar) {
        en.kmActual.pausas += 1;   // (v119) a los fantasmas y a los jefes no les gusta que te detengas
        // (v139) Y en la batalla, la criatura aprovecha tu pausa: te ataca y se corta tu racha de tramos.
        (en.kmActual.golpes = en.kmActual.golpes || []).push({ tipo: "pausa", dano: 0, herida: encuentros.ATAQUES_CRIATURA.pausa.herida, t: ahora });
        en.kmActual.racha = 0;
    }
    return { pausada: true };
}

// (v119) Lo que se mide de la pelea del km. (v139) golpes: los poderes de cada tramo y los ataques de la criatura.
const kmActualNuevo = () => ({ mitad: null, t800: null, pausas: 0, golpes: [], racha: 0 });

// (v139) Los tramos de 100 m que cruzaste con este punto del GPS: cada uno lanza un poder (o la criatura te ataca).
// desde/hasta: la distancia antes y después del punto. El momento exacto en que cruzaste cada 100 m se calcula
// en proporción a los metros entre el punto anterior y este (así un GPS que llega cada 1–2 s no cambia el tiempo del tramo).
function anotarTramos(estado, en, desde, hasta) {
    const ahora = running.tiempoDeEncurso(en, Date.now());
    // Una carrera empezada antes de la v139 no tenía tramos: se empieza a contar desde aquí (el primer tramo no cuenta).
    const tr = en.tramo || (en.tramo = { hechos: Math.floor(desde / encuentros.TRAMO), desde: null, tAntes: null });
    if (tr.tAntes === null) tr.tAntes = ahora;
    // El primer tramo empieza en el primer punto del GPS, no al pulsar «Empezar»: la búsqueda de señal no cuenta como lento.
    if (tr.desde === null && hasta > desde) tr.desde = tr.tAntes;
    tr.tAntes = Math.min(tr.tAntes, ahora);   // con la pausa automática el reloj se corrige hacia atrás
    const golpes = [];
    while (hasta >= (tr.hechos + 1) * encuentros.TRAMO) {
        const borde = (tr.hechos + 1) * encuentros.TRAMO;
        const parte = hasta > desde ? Math.min(1, Math.max(0, (borde - desde) / (hasta - desde))) : 1;
        const cruce = tr.tAntes + (ahora - tr.tAntes) * parte;
        tr.hechos += 1;
        const pelea = en.encuentros?.find((e) => !e.resultado);
        const k = en.kmActual;
        if (pelea && k && tr.desde !== null) {
            const poder = encuentros.poderDelTramo(pelea, (cruce - tr.desde) / 1000, en.objetivo, k.racha || 0, Boolean(mascota.especieActiva(estado)));
            if (poder) {
                k.racha = poder.racha;
                const golpe = { tipo: poder.tipo, dano: poder.dano, herida: poder.herida, combo: poder.combo, tramo: tr.hechos, t: Date.now() };
                (k.golpes = k.golpes || []).push(golpe);
                golpes.push(golpe);
            }
        }
        tr.desde = cruce;
    }
    tr.tAntes = ahora;
    return golpes;
}

// Un punto nuevo del GPS. Si no estás corriendo (o estás en pausa), se ignora. No lanza error: llega sola.
export function registrarPuntoCarrera(estado, punto) {
    const en = estado.running.encurso;
    if (!en || !en.gps || (en.pausadoDesde && !en.autopausa)) return null;
    en.precision = punto.precision;
    // (v131) Los puntos muy imprecisos no se usan; los demás pasan por el filtro (ver running.filtrarPunto).
    if (!(punto.precision <= running.PRECISION_MAX)) return null;
    const filtrado = running.filtrarPunto(en.filtro, punto);
    en.filtro = filtrado.filtro;
    if (!filtrado.punto) return null;
    punto = filtrado.punto;
    // (v131) Pausa automática: quieto unos segundos → el reloj se detiene; te alejas → sigue solo.
    if (estado.running.autopausa !== false) {
        if (en.autopausa) {
            if (running.metrosEntre(en.quieto, punto) < running.AUTOPAUSA.reanudar) return { distancia: en.distancia, autopausa: true };
            en.pausas.push({ desde: en.pausadoDesde, hasta: punto.t });
            en.pausadoDesde = null;
            en.autopausa = false;
            en.ultimo = { lat: en.quieto.lat, lon: en.quieto.lon, precision: punto.precision, t: punto.t - 1000 };   // se cuentan los metros desde donde paraste
            en.quieto = { lat: punto.lat, lon: punto.lon, t: punto.t };
        } else if (!en.quieto || running.metrosEntre(en.quieto, punto) > running.AUTOPAUSA.metros) {
            en.quieto = { lat: punto.lat, lon: punto.lon, t: punto.t };
        } else if (punto.t - en.quieto.t >= running.AUTOPAUSA.segundos * 1000 && en.distancia > 0) {
            en.pausadoDesde = en.quieto.t;   // desde que te quedaste quieto
            en.autopausa = true;
            return { distancia: en.distancia, autopausa: true };
        }
    }
    const { distancia, ultimo } = running.avanzar(en, punto);
    en.recientes = running.anotarReciente(en.recientes, punto.t, distancia);   // (v131) para el ritmo de ahora
    // (v116) Cada punto aceptado va al recorrido, y cada kilómetro completo anota su tiempo (para los parciales y la voz).
    if (ultimo && ultimo !== en.ultimo) {
        en.traza = en.traza || [];
        en.traza.push([ultimo.lat, ultimo.lon]);
        // Para no crecer sin fin en carreras largas: si pasa de 600 puntos, se queda con la mitad (uno sí, uno no).
        if (en.traza.length > 600) en.traza = en.traza.filter((_, i) => i % 2 === 0 || i === en.traza.length - 1);
    }
    const golpes = en.kmActual ? anotarTramos(estado, en, en.distancia, distancia) : [];   // (v139) los poderes de la batalla
    // (v148) Los cofres y fogatas que cruzaste con este punto. El cofre se cobra al guardar la carrera; la fogata cura a tu
    // héroe y da más margen a la pelea de este km (se anota ANTES de decidir el km, por si estaba justo al final).
    const encontrados = en.encuentros ? hallazgos.cruzados(en.inicio, en.distancia, distancia) : [];
    for (const h of encontrados) {
        (en.hallados = en.hallados || []).push({ ...h, t: Date.now() });
        if (h.tipo === "fogata" && en.kmActual) {
            en.kmActual.fogata = true;
            (en.kmActual.golpes = en.kmActual.golpes || []).push({ tipo: "fogata", dano: 0, herida: 0, cura: hallazgos.CURA_FOGATA, t: Date.now() });
        }
    }
    en.distancia = distancia;
    en.ultimo = ultimo;
    en.marcas = en.marcas || [];
    // (v119) Cuándo pasaste los 500 m y los 800 m de este km (para las criaturas acorazadas y las veloces).
    const resueltos = [];
    if (en.kmActual) {
        const base = en.marcas.length * 1000;
        const desdeKm = running.tiempoDeEncurso(en, Date.now()) - (en.marcas[en.marcas.length - 1] || 0);
        if (en.kmActual.mitad === null && distancia >= base + 500) en.kmActual.mitad = desdeKm;
        if (en.kmActual.t800 === null && distancia >= base + 800) en.kmActual.t800 = desdeKm;
    }
    let kmNuevo = null;
    while (distancia >= (en.marcas.length + 1) * 1000) {
        en.marcas.push(running.tiempoDeEncurso(en, Date.now()));
        (en.puntosKm = en.puntosKm || []).push([Math.round(punto.lat * 1e5) / 1e5, Math.round(punto.lon * 1e5) / 1e5]);   // dónde estabas (para la bandera del mapa)
        kmNuevo = en.marcas.length;
        // (v119) Se decide la pelea de este km y aparece la criatura del siguiente.
        const pelea = en.encuentros?.find((e) => e.km === kmNuevo && !e.resultado);
        if (pelea) {
            const segundos = running.parcialesDe(en.marcas).at(-1);
            const k = en.kmActual;
            const vencida = encuentros.resolver(pelea, {
                segundos,
                mitad: k.mitad === null ? NaN : k.mitad / 1000,
                ultimos200: k.t800 === null ? NaN : segundos - k.t800 / 1000,
                pausas: k.pausas,
            }, en.objetivo, Boolean(mascota.especieActiva(estado)), { fogata: Boolean(k.fogata) });
            pelea.resultado = vencida ? "vencida" : "escapo";
            pelea.segundos = segundos;
            // (v139) Para la escena del golpe final: con cuánta vida quedó y cuándo terminó la pelea.
            const vidas = encuentros.vidasDeLaBatalla(k.golpes, pelea.resultado);
            pelea.vida = vidas.criatura;
            pelea.vidaHeroe = vidas.heroe;
            pelea.finEn = Date.now();
            if (vencida) bestiario.anotarVictoria(estado.arcade.bestiario, pelea.id);
            resueltos.push(pelea);
        }
        if (en.encuentros) {
            const siguiente = encuentros.criaturaDelKm(en.inicio, kmNuevo + 1, en.kmPorZona);
            en.encuentros.push(siguiente);
            bestiario.anotarEncuentro(estado.arcade.bestiario, siguiente.id);
            en.kmActual = kmActualNuevo();
        }
    }
    const parciales = running.parcialesDe(en.marcas);
    return {
        distancia, kmNuevo, segundos: kmNuevo ? parciales[parciales.length - 1] : null, golpes, encontrados,
        resueltos, nuevo: kmNuevo && en.encuentros ? en.encuentros.at(-1) : null,
    };
}

export function cancelarCarrera(estado) {
    entrenamientoRunning(estado);
    estado.running.encurso = null;
}

// Termina la carrera en vivo y la guarda. km y minutos son lo que escribes en el formulario; si los dejas vacíos,
// se usa lo que midió el GPS y lo que marcó el cronómetro.
export function terminarCarrera(estado, { km = "", minutos = "", nota = "" } = {}) {
    const en = entrenamientoRunning(estado);
    if (en.pausadoDesde) {
        en.pausas.push({ desde: en.pausadoDesde, hasta: Date.now() });
        en.pausadoDesde = null;
    }
    const medido = en.distancia / 1000 >= running.MIN_GPS_KM ? Math.round((en.distancia / 1000) * 100) / 100 : "";
    // (v117) Con GPS, la distancia y el tiempo son LOS DEL GPS y el cronómetro: no se pueden cambiar (así es justo).
    // Solo la nota es tuya. Si el GPS casi no midió nada, no hay carrera que guardar: se cancela.
    if (en.gps) {
        if (medido === "") throw new Error("El GPS midió menos de 50 m, así que no hay carrera que guardar. Cancélala e inténtalo otra vez.");
        km = "";
        minutos = "";
    }
    const kmFinal = String(km).trim() !== "" ? km : medido;
    if (String(kmFinal).trim() === "") throw new Error("No hay distancia: anota los kilómetros que corriste.");
    const minutosFinal = String(minutos).trim() !== "" ? minutos : Math.max(1, Math.round(running.tiempoDeEncurso(en) / 60000));
    const fecha = aTexto(new Date(en.inicio));
    const resultado = guardarCarrera(estado, {
        fecha, km: kmFinal, minutos: minutosFinal, tipo: en.tipo, origen: en.gps ? "gps" : "manual", nota,
        // (v116) el recorrido y los parciales solo existen en las carreras con GPS
        traza: en.gps ? running.simplificarTraza(en.traza) : null,
        parciales: en.gps ? running.parcialesDe(en.marcas) : null,
        puntosKm: en.gps ? en.puntosKm : null,
        pista: en.pista || null,
        kmPorZona: en.kmPorZona || null,
    });
    // (v119) Las criaturas de la carrera: un extra que no toca el premio por km. La del km que quedó a medias se va.
    if (en.encuentros) {
        const peleas = en.encuentros.filter((e) => e.resultado);
        const total = encuentros.resumen(peleas);
        resultado.carrera.encuentros = peleas.map(({ km, id, clase, jefe, emboscada, resultado: fin }) => ({ km, id, clase, jefe, emboscada, resultado: fin }));
        resultado.carrera.objetivo = en.objetivo;
        if (total.total) {
            if (total.gemas || total.xp) ganar(estado, { gemas: total.gemas, xp: total.xp, atributo: "fuerza" });
            resultado.celebraciones.push({
                icono: total.vencidas === total.total ? "🏆" : "⚔️",
                etiqueta: "Criaturas de la carrera",
                titulo: `Venciste ${total.vencidas} de ${total.total}${total.jefes ? ` · ${total.jefes === 1 ? "1 jefe" : `${total.jefes} jefes`}` : ""}`,
                detalle: [total.gemas ? `+${total.gemas} 💎` : "", total.xp ? `+${total.xp} XP de 💪 Fuerza` : "",
                          total.escaparon.length ? `Escaparon: ${total.escaparon.slice(0, 3).join(", ")}${total.escaparon.length > 3 ? "…" : ""}` : "¡Ninguna escapó!"]
                    .filter(Boolean).join(" · "),
            });
        }
    }
    // (v148) Los cofres que abriste en el camino.
    const cofres = hallazgos.botinDeCofres(en.hallados);
    if (cofres.cofres) {
        ganar(estado, { gemas: cofres.gemas, xp: cofres.xp, atributo: "fuerza" });
        resultado.carrera.cofres = cofres.cofres;
        resultado.celebraciones.push({
            icono: "🎁", etiqueta: "Cofres del camino",
            titulo: cofres.cofres === 1 ? "Abriste 1 cofre" : `Abriste ${cofres.cofres} cofres`,
            detalle: `+${cofres.gemas} 💎 · +${cofres.xp} XP de 💪 Fuerza`,
        });
    }
    const fogatas = (en.hallados || []).filter((h) => h.tipo === "fogata").length;
    if (fogatas) resultado.carrera.fogatas = fogatas;
    estado.running.encurso = null;
    return resultado;
}

// Anota una carrera (hoy o ayer). Da XP de 💪 Fuerza y monedas, y avisa de récords, rangos, hitos y la meta semanal.
export function guardarCarrera(estado, valores) {
    const r = estado.running;
    const fecha = valores.fecha || hoy();
    if (fecha !== hoy() && fecha !== sumarDias(hoy(), -1)) throw new Error("Solo puedes anotar la carrera de hoy o de ayer.");
    const km = kmValido(valores.km);
    const minutos = minutosValidos(valores.minutos);
    if (!running.TIPOS[valores.tipo]) throw new Error("Ese tipo de carrera no existe.");
    const nota = String(valores.nota || "").trim().slice(0, 60);
    const antes = [...r.carreras];
    const rangoAntes = running.rangoDe(running.kmTotales(antes)).nombre;
    const semanaAntes = running.kmDeLaSemana(antes, lunesDe(fecha));
    const xp = running.xpDeCarrera(km, valores.tipo);
    const monedas = running.monedasDeCarrera(km);
    const carrera = { fecha, km, minutos, tipo: valores.tipo, origen: valores.origen === "gps" ? "gps" : "manual", nota, xp, monedas, creada: Date.now() };
    // (v116) Recorrido (lista de [lat, lon]) y parciales (segundos de cada kilómetro), si vienen y son válidos.
    const traza = running.simplificarTraza(valores.traza);
    if (traza.length >= 2) carrera.traza = traza;
    const parciales = (Array.isArray(valores.parciales) ? valores.parciales : []).filter((s) => Number.isFinite(s) && s > 0).slice(0, 100);
    if (parciales.length) carrera.parciales = parciales;
    if (valores.pista === running.PISTA_METROS) carrera.pista = running.PISTA_METROS;
    if (Number.isInteger(valores.kmPorZona) && valores.kmPorZona >= 1 && valores.kmPorZona <= 10) carrera.kmPorZona = valores.kmPorZona;   // (v132) para dibujar su mapa igual que cuando corriste   // (v131) corrida en pista
    const banderas = running.simplificarTraza(valores.puntosKm, 100);
    if (banderas.length) carrera.puntosKm = banderas;
    r.carreras = running.ordenar([...r.carreras, carrera]);
    ganar(estado, { xp, monedas, atributo: "fuerza" });

    const tipo = running.TIPOS[carrera.tipo];
    const celebraciones = [{
        icono: tipo.icono, etiqueta: carrera.origen === "gps" ? "¡Carrera en vivo guardada!" : "Carrera guardada",
        titulo: `${running.textoKm(km)} · ${tipo.nombre}`,
        detalle: `${running.textoRitmo(running.ritmoDeCarrera(carrera))} · ${running.textoDuracion(minutos)} · +${xp} XP de 💪 Fuerza${monedas ? ` · +${monedas} 🪙` : ""}`,
    }];
    for (const record of running.recordsBatidos(antes, carrera)) {
        celebraciones.push({ icono: "📈", etiqueta: "¡Récord personal!", titulo: record.titulo, detalle: record.detalle });
    }
    const kmAhora = running.kmTotales(r.carreras);
    const rangoAhora = running.rangoDe(kmAhora);
    if (rangoAhora.nombre !== rangoAntes) {
        celebraciones.push({ icono: rangoAhora.icono, etiqueta: "¡Nuevo rango de corredor!", titulo: rangoAhora.nombre,
                             detalle: `Llevas ${running.textoKm(kmAhora)} corridos en tu vida.` });
    }
    for (const hito of running.hitosNuevos(r, kmAhora)) {
        r.hitos.push(hito.id);
        ganar(estado, { gemas: hito.gemas });
        celebraciones.push({ icono: hito.icono, etiqueta: "¡Hito de kilómetros!", titulo: hito.titulo, detalle: `${hito.texto} +${hito.gemas} 💎` });
    }
    // (v117) La Ruta del Corredor: cada kilómetro completo que sumas avanza por el mapa del reino y da su premio.
    const avance = ruta.cobrar(r, kmAhora);
    if (avance) {
        ganar(estado, { gemas: avance.gemas, xp: avance.xp, atributo: "fuerza" });
        for (const lugar of avance.especiales.slice(-4)) {
            const info = mapa.LUGARES[lugar.tipo];
            const nombre = lugar.tipo === "fortaleza" ? `Fin de ${mapa.nombreRegion(lugar.region)}` : info.nombre;
            celebraciones.push({ pequena: true, icono: info.icono, titulo: `Km ${lugar.km}: ${nombre}`, detalle: ruta.textoDePremio(ruta.PREMIOS[lugar.tipo]) });
        }
        const km = avance.hasta - avance.desde + 1;
        celebraciones.push({ pequena: true, icono: "🗺️", titulo: `Ruta del Corredor: ${km === 1 ? "1 km más" : `${km} km más`} (km ${avance.hasta})`, detalle: ruta.textoDePremio({ gemas: avance.gemas, xp: avance.xp }) });
    }
    // La meta semanal: al cumplirla por primera vez esa semana, se cobra.
    const lunes = lunesDe(fecha);
    const semanaAhora = running.kmDeLaSemana(r.carreras, lunes);
    if (semanaAntes < r.metaKm && semanaAhora >= r.metaKm && !r.semanasCobradas.includes(lunes)) {
        r.semanasCobradas.push(lunes);
        ganar(estado, { gemas: running.PREMIO_META_SEMANA.gemas, xp: running.PREMIO_META_SEMANA.xp, atributo: "fuerza" });
        celebraciones.push({ icono: "🎯", etiqueta: "¡Meta semanal cumplida!", titulo: `${running.textoKm(semanaAhora)} esta semana`,
                             detalle: `+${running.PREMIO_META_SEMANA.gemas} 💎 · +${running.PREMIO_META_SEMANA.xp} XP de 💪 Fuerza` });
    }
    // Si elegiste una misión (ej: «Correr»), se marca sola ese día.
    const mision = r.mision && estado.misiones.find((m) => m.id === r.mision && !m.archivadaEn);
    if (mision) {
        try {
            completarMision(estado, mision.id, fecha);
            celebraciones.push({ pequena: true, icono: "✅", titulo: `Misión «${mision.nombre}» marcada` });
        } catch (error) {
            // ya estaba marcada, o no tocaba ese día: no pasa nada
        }
    }
    return { carrera, celebraciones };
}

// Borra una carrera equivocada y le quita lo que había dado (los hitos y las metas ya cobradas se quedan).
export function borrarCarrera(estado, indice) {
    const carrera = estado.running.carreras[indice];
    if (!carrera) throw new Error("Esa carrera no existe.");
    estado.running.carreras.splice(indice, 1);
    ganar(estado, { xp: -carrera.xp, monedas: -carrera.monedas, atributo: "fuerza" });
}

// Tu meta semanal de kilómetros.
export function cambiarMetaKm(estado, km) {
    estado.running.metaKm = Math.round(numeroEntre(km, running.META_KM_MIN, running.META_KM_MAX, "La meta"));
}

// (v124) La voz que habla en la carrera (el identificador que da el teléfono; vacío = automática).
export function cambiarVozRunning(estado, voz) {
    estado.running.voz = String(voz || "").slice(0, 200);
}

// (v132) Cada cuántos kilómetros cambia el paisaje (y las criaturas) en las carreras que EMPIECES desde ahora.
export function cambiarKmPorZona(estado, km) {
    const n = Math.round(Number(km));
    if (!Number.isFinite(n)) throw new Error("Escribe cuántos km.");
    estado.running.kmPorZona = Math.min(encuentros.KM_POR_ZONA_MAX, Math.max(encuentros.KM_POR_ZONA_MIN, n));
}

// (v131) La pausa automática y cómo se ve el mapa en vivo.
export function cambiarAutopausa(estado, encendida) {
    estado.running.autopausa = Boolean(encendida);
}
export function cambiarVistaMapa(estado, vista) {
    estado.running.vistaMapa = vista === "todo" ? "todo" : "seguir";
}

// (v120) El modo concentración de la carrera: una pantalla limpia, solo con lo que importa mientras corres.
export function cambiarConcentracion(estado, encendido) {
    estado.running.concentracion = Boolean(encendido);
}

// (v116) La voz que dice tu tiempo cada kilómetro.
export function cambiarAvisoKm(estado, encendido) {
    estado.running.avisoKm = Boolean(encendido);
}

// La misión que se marca sola al guardar una carrera (o ninguna).
export function cambiarMisionRunning(estado, valor) {
    const id = valor === "" || valor === null ? null : Number(valor);
    if (id !== null && !estado.misiones.some((m) => m.id === id && !m.archivadaEn)) throw new Error("Esa misión no existe.");
    estado.running.mision = id;
}
