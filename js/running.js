// running.js — El Running (v109): tus carreras y caminatas convertidas en fuerza para tu héroe.
//
// Solo reglas puras: no toca la pantalla ni guarda nada (eso lo hacen acciones.js y vistas-running.js).
//
// Dos maneras de anotar una carrera:
//   · a mano: los km, los minutos y el tipo de entrenamiento;
//   · en vivo: el cronómetro corre y el GPS del teléfono suma los metros (solo mientras la app está abierta).
//
// Lo guardado (estado.running) es poco: { carreras, encurso, metaKm, hitos, semanasCobradas, mision }.
// Los récords, los rangos, las semanas y los ritmos se CALCULAN desde las carreras, así nunca se desordenan.

import { lunesDe, sumarDias, diasEntre, diaDeSemana } from "./fechas.js";

// ===== Constantes de balance =====
export const MAX_KM = 100;             // lo más que se puede anotar de una vez
export const MAX_MINUTOS = 1000;       // unas 16 horas
export const MIN_KM = 0.1;
export const XP_CARRERA = 10;          // por cada carrera anotada
export const XP_POR_KM = 10;          // y por cada kilómetro
export const MONEDAS_POR_KM = 2;       // monedas 🪙 por kilómetro
export const DISTANCIA_RITMO = 3;      // el mejor ritmo solo cuenta desde esta distancia (km)
export const META_KM_MIN = 1;
export const META_KM_MAX = 200;
export const PREMIO_META_SEMANA = { gemas: 15, xp: 30 };   // al cumplir la meta semanal de km (una vez por semana)
export const PRECISION_MAX = 25;       // metros: los puntos del GPS menos precisos se ignoran
export const SALTO_MAX_MS = 9;         // m/s (unos 32 km/h): más rápido es un salto del GPS, no se suma
export const MIN_PASO = 3;             // metros: movimientos más chicos son ruido y no se suman
export const MIN_GPS_KM = 0.05;        // si el GPS midió menos de 50 m, no se usa su distancia

// ===== Tipos de carrera =====
export const TIPOS = {
    suave:      { nombre: "Trote suave",  icono: "🌱", bono: 0,  texto: "Ritmo cómodo: puedes hablar mientras corres." },
    intervalos: { nombre: "Intervalos",    icono: "⚡", bono: 15, texto: "Sprints cortos alternados con descanso." },
    tempo:      { nombre: "Ritmo fuerte",  icono: "🔥", bono: 10, texto: "Un ritmo exigente, pero sostenido." },
    larga:      { nombre: "Tirada larga",  icono: "🏔", bono: 20, texto: "La carrera larga de la semana." },
    caminata:   { nombre: "Caminata",      icono: "🧍", bono: 0,  texto: "Caminar también cuenta: el cuerpo se acostumbra." },
};

// ===== Rangos de corredor (según los km totales de tu vida) =====
export const RANGOS = [
    { desde: 0,   nombre: "Paso de aprendiz",       icono: "🌱" },
    { desde: 15,  nombre: "Mensajero del valle",    icono: "🏃" },
    { desde: 50,  nombre: "Correo del reino",       icono: "⚡" },
    { desde: 120, nombre: "Viento del camino",      icono: "💨" },
    { desde: 250, nombre: "Relámpago de la aldea",  icono: "🔥" },
    { desde: 500, nombre: "Leyenda de los caminos", icono: "🏆" },
];
export const rangoDe = (km) => [...RANGOS].reverse().find((r) => km >= r.desde) || RANGOS[0];

// ===== Hitos de kilómetros (una vez cada uno, con gemas) =====
export const HITOS = [
    { id: "km10",   km: 10,   icono: "🌱", titulo: "Primeros 10 km",  texto: "Diez kilómetros ya son un camino.",         gemas: 10 },
    { id: "km42",   km: 42.2, icono: "🏆", titulo: "Una maratón",     texto: "42,2 km: lo que mide una maratón.",         gemas: 40 },
    { id: "km100",  km: 100,  icono: "💨", titulo: "100 km",          texto: "Cien kilómetros en tus piernas.",           gemas: 50 },
    { id: "km250",  km: 250,  icono: "🔥", titulo: "250 km",          texto: "Tu camino ya se nota en el mapa.",          gemas: 80 },
    { id: "km500",  km: 500,  icono: "🏆", titulo: "500 km",          texto: "Medio millar de kilómetros. Leyenda.",      gemas: 150 },
    { id: "km1000", km: 1000, icono: "👑", titulo: "1000 km",         texto: "Mil kilómetros. Pocos llegan.",             gemas: 300 },
];

// ===== Lo que se guarda al empezar =====
export function runningInicial() {
    return {
        carreras: [],          // [{ fecha, km, minutos, tipo, origen: "manual" | "gps", xp, monedas, nota, creada }]
        encurso: null,         // la carrera en vivo: ver empezarCarrera (acciones.js)
        metaKm: 10,            // cuántos km quieres correr por semana
        hitos: [],             // ids de los hitos de kilómetros ya cobrados
        semanasCobradas: [],   // los lunes de las semanas cuya meta ya cobraste
        mision: null,          // la misión diaria que se marca sola al guardar una carrera (id), o null
        rutaCobrada: 0,        // (v117) hasta qué kilómetro de la Ruta del Corredor (ruta.js) ya cobraste el premio
        concentracion: true,   // (v120) pantalla limpia mientras corres
        voz: "",              // (v124) la voz elegida (su identificador); vacío = la del teléfono
        kmPorZona: 2,          // (v132) cada cuántos km cambia el paisaje del mapa (1 a 10)
        autopausa: true,       // (v131) el reloj se detiene solo si te quedas quieto
        vistaMapa: "seguir",   // (v131) el mapa en vivo: «seguir» (te sigue de cerca) o «todo» (todo el recorrido)
        avisoKm: true,         // (v116) la voz que dice tu tiempo cada kilómetro (solo con GPS)
    };
}

// ===== Cálculos de una carrera =====
// El ritmo es minutos por kilómetro (5,5 = 5 min 30 s por km).
export const ritmoDe = (km, minutos) => (km > 0 ? minutos / km : 0);
export const ritmoDeCarrera = (carrera) => ritmoDe(carrera.km, carrera.minutos);

// 5.5 -> "5:30 /km"; 0 -> "—"
export function textoRitmo(ritmo) {
    if (!ritmo || !Number.isFinite(ritmo)) return "—";
    let minutos = Math.floor(ritmo);
    let segundos = Math.round((ritmo - minutos) * 60);
    if (segundos === 60) { minutos += 1; segundos = 0; }
    return `${minutos}:${String(segundos).padStart(2, "0")} /km`;
}

// 75 -> "1 h 15 min"; 42 -> "42 min"
export function textoDuracion(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

// 12,3 -> "12,3 km" (con coma, como lo escribes en el teléfono)
export const textoKm = (km) => `${(Math.round(km * 100) / 100).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")} km`;

export const xpDeCarrera = (km, tipo) => XP_CARRERA + Math.round(km * XP_POR_KM) + (TIPOS[tipo]?.bono || 0);
export const monedasDeCarrera = (km) => Math.round(km * MONEDAS_POR_KM);

// ===== Ordenar y sumar =====
export const ordenar = (carreras) => [...carreras].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.creada || 0) - (b.creada || 0)));

export const kmTotales = (carreras) => carreras.reduce((suma, c) => suma + c.km, 0);

// Los km de la semana que empieza el lunes dado.
export function kmDeLaSemana(carreras, lunes) {
    const domingo = sumarDias(lunes, 6);
    return carreras.filter((c) => c.fecha >= lunes && c.fecha <= domingo).reduce((suma, c) => suma + c.km, 0);
}

// Los km de las últimas `semanas` semanas, de la más vieja a la más nueva: [{ lunes, km }].
export function kmPorSemana(carreras, hoyTexto, semanas = 12) {
    const primero = sumarDias(lunesDe(hoyTexto), -7 * (semanas - 1));
    return Array.from({ length: semanas }, (_, i) => {
        const lunes = sumarDias(primero, i * 7);
        return { lunes, km: Math.round(kmDeLaSemana(carreras, lunes) * 100) / 100 };
    });
}

// Cuántas semanas seguidas cumpliste la meta (la semana de hoy cuenta si ya la cumpliste; si no, no rompe la racha).
export function rachaSemanal(carreras, metaKm, hoyTexto) {
    let lunes = lunesDe(hoyTexto);
    let racha = 0;
    if (kmDeLaSemana(carreras, lunes) >= metaKm) racha++;
    lunes = sumarDias(lunes, -7);
    while (kmDeLaSemana(carreras, lunes) >= metaKm) {
        racha++;
        lunes = sumarDias(lunes, -7);
    }
    return racha;
}

// Los récords de todas las carreras: la más larga, el mejor ritmo (desde DISTANCIA_RITMO km), la de más tiempo
// y la semana con más km. Cada uno es la carrera (o la semana) o null si aún no hay.
export function records(carreras) {
    let masKm = null;
    let mejorRitmo = null;
    let masMinutos = null;
    const porSemana = {};
    for (const c of carreras) {
        if (!masKm || c.km > masKm.km) masKm = c;
        if (c.km >= DISTANCIA_RITMO && (!mejorRitmo || ritmoDeCarrera(c) < ritmoDeCarrera(mejorRitmo))) mejorRitmo = c;
        if (!masMinutos || c.minutos > masMinutos.minutos) masMinutos = c;
        const lunes = lunesDe(c.fecha);
        porSemana[lunes] = (porSemana[lunes] || 0) + c.km;
    }
    let semanaMasKm = null;
    for (const [lunes, km] of Object.entries(porSemana)) {
        if (!semanaMasKm || km > semanaMasKm.km) semanaMasKm = { lunes, km: Math.round(km * 100) / 100 };
    }
    return { masKm, mejorRitmo, masMinutos, semanaMasKm };
}

// Los récords que una carrera nueva bate (solo si ya había carreras antes: la primera no es un récord).
// Devuelve una lista de { clave, titulo, detalle }.
export function recordsBatidos(antes, nueva) {
    if (!antes.length) return [];
    const previo = records(antes);
    const batidos = [];
    if (nueva.km > previo.masKm.km) batidos.push({ clave: "distancia", titulo: "Más kilómetros", detalle: `${textoKm(nueva.km)} en una sola carrera.` });
    if (nueva.km >= DISTANCIA_RITMO && (!previo.mejorRitmo || ritmoDeCarrera(nueva) < ritmoDeCarrera(previo.mejorRitmo))) {
        batidos.push({ clave: "ritmo", titulo: "Mejor ritmo", detalle: `${textoRitmo(ritmoDeCarrera(nueva))}, en ${textoKm(nueva.km)}.` });
    }
    if (nueva.minutos > previo.masMinutos.minutos) batidos.push({ clave: "tiempo", titulo: "Más tiempo corriendo", detalle: `${textoDuracion(nueva.minutos)} seguidos.` });
    return batidos;
}

// Los hitos de kilómetros que ya alcanzaste y todavía no cobraste.
export function hitosNuevos(running, kmTotal) {
    return HITOS.filter((h) => kmTotal >= h.km && !running.hitos.includes(h.id));
}

// ===== Sugerencia: qué te toca correr hoy =====
// Mira tu última carrera, tu semana y tu meta. Nunca es obligatoria: es una idea.
export function sugerencia(carreras, metaKm, hoyTexto) {
    const orden = ordenar(carreras);
    const ultima = orden[orden.length - 1];
    if (!ultima) return { tipo: "suave", km: 2, texto: "Empieza con 2 km de trote suave. Lo importante es volver mañana." };
    const diasDesde = diasEntre(ultima.fecha, hoyTexto);
    if (diasDesde >= 4) return { tipo: "suave", km: 2, texto: "Hace varios días que no corres. Vuelve con calma: 2 km suaves." };
    if (["intervalos", "tempo"].includes(ultima.tipo) && diasDesde < 2) {
        return { tipo: "suave", km: 3, texto: "Tu última carrera fue intensa: hoy toca recuperar con 3 km suaves." };
    }
    const lunes = lunesDe(hoyTexto);
    const semana = kmDeLaSemana(carreras, lunes);
    const haceLarga = carreras.some((c) => c.tipo === "larga" && c.fecha >= lunes);
    if (!haceLarga && semana >= metaKm * 0.6 && diaDeSemana(hoyTexto) >= 5) {
        const km = Math.max(5, Math.round(metaKm * 0.4 * 10) / 10);
        return { tipo: "larga", km, texto: `Ya llevas ${textoKm(semana)} de ${metaKm}: esta semana te falta una tirada larga de ${textoKm(km)}.` };
    }
    const haceIntervalos = carreras.some((c) => c.tipo === "intervalos" && c.fecha >= sumarDias(hoyTexto, -7));
    if (!haceIntervalos) return { tipo: "intervalos", km: 3, texto: "Esta semana no has hecho intervalos. Prueba 3 km: 6 sprints cortos con descanso." };
    return { tipo: "suave", km: 4, texto: "Un trote suave de 4 km para sumar kilómetros sin cansarte de más." };
}

// ===== El cronómetro =====
// Tiempo corrido en milisegundos: todo desde el inicio, menos las pausas.
export function tiempoDeEncurso(en, ahora = Date.now()) {
    const cerradas = en.pausas.reduce((suma, p) => suma + (p.hasta - p.desde), 0);
    const pausaActual = en.pausadoDesde ? ahora - en.pausadoDesde : 0;
    return Math.max(0, ahora - en.inicio - cerradas - pausaActual);
}

// 3725000 -> "1:02:05"; 65000 -> "1:05". Sin horas, muestra minutos:segundos.
export function textoTiempo(ms) {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

// El ritmo mientras corres (min/km), o null si todavía no hay distancia para calcularlo.
export function ritmoEnVivo(en, ahora = Date.now()) {
    const km = en.distancia / 1000;
    if (km < MIN_GPS_KM) return null;
    return ritmoDe(km, tiempoDeEncurso(en, ahora) / 60000);
}

// ===== El GPS =====
// Distancia en metros entre dos puntos { lat, lon } (fórmula de haversine: cuenta la curva de la Tierra).
export function metrosEntre(a, b) {
    const radio = 6371000;
    const rad = (grados) => (grados * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * radio * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Un punto nuevo del GPS: cuánto suma a la carrera. punto = { lat, lon, precision (m), t (ms) }.
// Devuelve { distancia, ultimo }: el punto de referencia cambia solo cuando de verdad te moviste.
export function avanzar(en, punto) {
    if (!punto || !(punto.precision <= PRECISION_MAX)) return { distancia: en.distancia, ultimo: en.ultimo };
    if (!en.ultimo) return { distancia: en.distancia, ultimo: punto };
    const metros = metrosEntre(en.ultimo, punto);
    // (v131) El paso mínimo crece con el error de la lectura: así el baile del GPS estando quieto no suma metros. Corriendo no se
    // pierde nada: se mide desde el último punto fijo, solo que se toman muestras más espaciadas.
    const umbral = Math.max(MIN_PASO, Math.min(12, (punto.precisionCruda || 0) * 0.75));
    if (metros < umbral) return { distancia: en.distancia, ultimo: en.ultimo };   // quieto: no sumes el ruido
    const segundos = (punto.t - en.ultimo.t) / 1000;
    if (segundos > 0 && metros / segundos > SALTO_MAX_MS) return { distancia: en.distancia, ultimo: punto };   // salto raro
    return { distancia: en.distancia + metros, ultimo: punto };
}

// ===== (v131) Un GPS más fino =====
// 1) Filtro de Kalman: cada lectura del GPS trae su error (precisión, en metros). En vez de creerle a cada punto, se lleva una
//    «posición estimada» que se mueve hacia el punto nuevo más o menos según lo confiable que sea: un punto preciso la mueve mucho;
//    uno dudoso, poco. Así el zigzag del GPS (que inflaba los metros) se aplana.
// 2) Los saltos imposibles (más rápido que RAPIDEZ_RARA) con un punto impreciso se descartan sin tocar el filtro.
export const RUIDO_KALMAN = 4;        // m/s: cuánto puede moverse de verdad una persona entre dos lecturas
export const RAPIDEZ_RARA = 15;       // m/s: más que esto desde la posición estimada es un salto del GPS
export function filtrarPunto(filtro, punto) {
    if (!filtro) return { filtro: { lat: punto.lat, lon: punto.lon, varianza: punto.precision ** 2, t: punto.t }, punto };
    const dt = Math.max(0, (punto.t - filtro.t) / 1000);
    if (punto.precision > 10 && metrosEntre(filtro, punto) / Math.max(dt, 1) > RAPIDEZ_RARA) return { filtro, punto: null };
    const prevista = filtro.varianza + dt * RUIDO_KALMAN ** 2;
    const k = prevista / (prevista + punto.precision ** 2);   // 0 = no le creo nada; 1 = le creo todo
    const nuevo = { lat: filtro.lat + k * (punto.lat - filtro.lat), lon: filtro.lon + k * (punto.lon - filtro.lon), varianza: (1 - k) * prevista, t: punto.t };
    return { filtro: nuevo, punto: { lat: nuevo.lat, lon: nuevo.lon, precision: Math.sqrt(nuevo.varianza), precisionCruda: punto.precision, t: punto.t } };
}

// Qué tan buena es la señal según la precisión de la última lectura.
export function calidadGps(precision) {
    if (!Number.isFinite(precision)) return null;
    if (precision <= 8) return { nivel: "buena", icono: "🟢", texto: `buena (±${Math.round(precision)} m)` };
    if (precision <= PRECISION_MAX) return { nivel: "regular", icono: "🟡", texto: `regular (±${Math.round(precision)} m)` };
    return { nivel: "mala", icono: "🔴", texto: `débil (±${Math.round(precision)} m): esos puntos no se cuentan` };
}

// 3) El ritmo de AHORA (los últimos ~30 s), no el promedio de toda la carrera. recientes = [{ t, d }] (ms, metros).
export const VENTANA_RITMO = 30000;
export function anotarReciente(recientes, t, distancia) {
    const lista = [...(recientes || []), { t, d: distancia }];
    while (lista.length > 2 && t - lista[1].t > VENTANA_RITMO) lista.shift();
    return lista.slice(-60);
}
export function ritmoActual(en, ahora = Date.now()) {
    const r = en.recientes || [];
    if (en.pausadoDesde || r.length < 2 || ahora - r.at(-1).t > 15000) return ritmoEnVivo(en, ahora);
    const metros = r.at(-1).d - r[0].d;
    const segundos = (r.at(-1).t - r[0].t) / 1000;
    if (metros < 25 || segundos < 8) return ritmoEnVivo(en, ahora);
    return segundos / 60 / (metros / 1000);
}

// 4) Pausa automática: si en AUTOPAUSA.segundos no te alejas AUTOPAUSA.metros, el reloj se detiene (desde que te quedaste quieto);
//    vuelve solo cuando te alejas AUTOPAUSA.reanudar metros. No cuenta como pausa para los fantasmas ni para los jefes.
export const AUTOPAUSA = { segundos: 10, metros: 8, reanudar: 15 };

// ===== (v131) Modo pista =====
export const PISTA_METROS = 400;
export const vueltasDe = (metros, pista = PISTA_METROS) => Math.floor(metros / pista);

// ===== Recorrido y parciales por kilómetro (v116) =====
export const MAX_TRAZA = 120;   // puntos que se guardan del recorrido de cada carrera con GPS

// Deja como mucho `max` puntos del recorrido (siempre el primero y el último) para no llenar la memoria del teléfono.
// puntos = [[lat, lon], …]; devuelve la lista con 5 decimales (≈ 1 m).
// (v148) La carrera «fantasma»: la última que empezaste cerca del mismo lugar (a menos de `radio` metros), con recorrido.
// carreras: las guardadas; salida: [lat, lon] del primer punto de la carrera de hoy. Devuelve la carrera o null.
// No sirve en pista (ahí todas las vueltas son iguales).
export function carreraFantasma(carreras, salida, { radio = 250 } = {}) {
    if (!Array.isArray(salida) || !Number.isFinite(salida[0])) return null;
    const aqui = { lat: salida[0], lon: salida[1] };
    for (let i = (carreras || []).length - 1; i >= 0; i--) {
        const c = carreras[i];
        if (c.pista || !Array.isArray(c.traza) || c.traza.length < 2 || !(c.minutos > 0)) continue;
        const [lat, lon] = c.traza[0];
        if (metrosEntre(aqui, { lat, lon }) <= radio) return c;
    }
    return null;
}

// (v148) El clima del día en el mapa de la carrera (es un juego: no se pide a internet). Sale de la fecha, así todo el día
// es el mismo. En la nieve la lluvia es nevada y en el desierto, tormenta de arena; en las Tierras del Abismo, ceniza.
export const CLIMAS = {
    despejado: { icono: "☀️", nombre: "Despejado" },
    lluvia: { icono: "🌧️", nombre: "Lluvia" },
    niebla: { icono: "🌫️", nombre: "Niebla" },
    nevada: { icono: "🌨️", nombre: "Nevada" },
    arena: { icono: "🌪️", nombre: "Tormenta de arena" },
    ceniza: { icono: "🌋", nombre: "Lluvia de ceniza" },
};
export function climaDelDia(fecha, zona = "pradera") {
    const n = [...String(fecha)].reduce((suma, letra) => (suma * 31 + letra.charCodeAt(0)) % 100003, 7);
    const x = Math.sin(n * 12.9898) * 43758.5453;
    const r = x - Math.floor(x);
    const base = r < 0.6 ? "despejado" : r < 0.82 ? "lluvia" : "niebla";
    if (base !== "lluvia") return base;
    return { nieve: "nevada", desierto: "arena", volcan: "ceniza" }[zona] || "lluvia";
}

export function simplificarTraza(puntos, max = MAX_TRAZA) {
    const lista = (puntos || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    const redondo = (p) => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
    if (lista.length <= max) return lista.map(redondo);
    const salida = [];
    for (let i = 0; i < max; i++) salida.push(redondo(lista[Math.round((i * (lista.length - 1)) / (max - 1))]));
    return salida;
}

// Los tiempos acumulados (ms) en cada marca de kilómetro -> los segundos que costó cada kilómetro.
// [300000, 612000] -> [300, 312]
export function parcialesDe(marcas) {
    let antes = 0;
    return (marcas || []).map((ms) => {
        const segundos = Math.max(1, Math.round((ms - antes) / 1000));
        antes = ms;
        return segundos;
    });
}

// 312 -> "5:12"
export function textoSegundos(segundos) {
    const s = Math.round(segundos);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// 312 -> "5 minutos 12 segundos" (para que lo diga la voz)
export function textoParaVoz(segundos) {
    const s = Math.round(segundos);
    const m = Math.floor(s / 60);
    const resto = s % 60;
    return `${m ? `${m} ${m === 1 ? "minuto" : "minutos"}` : ""}${m && resto ? " " : ""}${resto || !m ? `${resto} ${resto === 1 ? "segundo" : "segundos"}` : ""}`;
}

// Qué tal repartiste tu esfuerzo: el km más rápido y el más lento, y si la segunda mitad fue más rápida (negativo = «split negativo»).
// Con menos de 2 kilómetros no hay nada que analizar (null).
export function analisisDeParciales(parciales) {
    if (!parciales || parciales.length < 2) return null;
    const mejor = Math.min(...parciales);
    const peor = Math.max(...parciales);
    const mitad = Math.floor(parciales.length / 2);
    const suma = (lista) => lista.reduce((a, b) => a + b, 0);
    const primera = suma(parciales.slice(0, mitad)) / mitad;
    const segunda = suma(parciales.slice(parciales.length - mitad)) / mitad;
    return {
        mejor, peor, mejorKm: parciales.indexOf(mejor) + 1, peorKm: parciales.indexOf(peor) + 1,
        promedio: Math.round(suma(parciales) / parciales.length),
        diferencia: Math.round(segunda - primera),   // segundos por km: negativo = acabaste más rápido de lo que empezaste
    };
}

// ===== ¿Qué tiempo podrías hacer? (v116) =====
// Fórmula de Riegel: T2 = T1 × (D2 / D1)^1,06. Parte de tu mejor carrera reciente de 3 km o más (hasta 25 km),
// llevada a 5 km para compararlas entre sí. Solo cuentan carreras suaves, de tempo, intervalos o largas (no la caminata).
export const DISTANCIAS_PREDICCION = [["5 km", 5], ["10 km", 10], ["Media maratón", 21.0975], ["Maratón", 42.195]];
export function prediccionesDe(carreras) {
    const validas = ordenar(carreras).filter((c) => c.tipo !== "caminata" && c.km >= DISTANCIA_RITMO && c.km <= 25).slice(-30);
    if (!validas.length) return null;
    const equivalente = (c) => c.minutos * (5 / c.km) ** 1.06;   // minutos que costarían 5 km con ese esfuerzo
    const base = validas.reduce((mejor, c) => (equivalente(c) < equivalente(mejor) ? c : mejor));
    return {
        base,
        tiempos: DISTANCIAS_PREDICCION.map(([nombre, km]) => ({ nombre, km, minutos: Math.round(base.minutos * (km / base.km) ** 1.06) })),
    };
}

// ===== Comparar con tu carrera anterior =====
// La última carrera parecida a esta: mismo tipo y una distancia de hasta un 25 % más o menos. Devuelve
// { anterior, segundosPorKm } (negativo = esta fue más rápida), o null si no hay ninguna parecida antes.
export function comparacionDe(carreras, carrera) {
    const antes = ordenar(carreras).filter((c) => c !== carrera && c.tipo === carrera.tipo
        && Math.abs(c.km - carrera.km) <= carrera.km * 0.25
        && (c.fecha < carrera.fecha || (c.fecha === carrera.fecha && (c.creada || 0) < (carrera.creada || 0))));
    const anterior = antes[antes.length - 1];
    if (!anterior) return null;
    return { anterior, segundosPorKm: Math.round((ritmoDeCarrera(carrera) - ritmoDeCarrera(anterior)) * 60) };
}

// -18 -> "▼ 0:18 /km más rápida que tu anterior de este tipo"; 0 -> "Mismo ritmo que la anterior"
export function textoComparacion(comparacion) {
    const s = Math.abs(comparacion.segundosPorKm);
    if (s === 0) return "Mismo ritmo que tu anterior de este tipo";
    const texto = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} /km`;
    return comparacion.segundosPorKm < 0
        ? `▼ ${texto} más rápida que tu anterior de este tipo`
        : `▲ ${texto} más lenta que tu anterior de este tipo`;
}
