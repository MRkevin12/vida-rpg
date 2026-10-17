// insignias.js — Las insignias del héroe (v101): se ganan solas al llegar a ciertos hitos.
//
// No se confunden con los LOGROS (esos los defines tú) ni con los objetos legendarios (esos dan poder).
// Una insignia es un recuerdo de algo que lograste: la primera misión, una racha de 30 días, vencer a
// todos los jefes… Se guardan en una colección, y una de ellas la puedes llevar puesta: se ve en el pecho
// de tu héroe (dibujo.js) y junto a tu retrato.
//
// Este archivo solo tiene las reglas (qué insignias hay y cuánto llevas de cada una): no dibuja nada.

import { calcularNivel, progresoLogro } from "./juego.js";
import { nivelDeGym } from "./gym.js";

// Los grados: cuánto cuesta ganarlas. Cambian la forma y el color del dibujo (dibujo-insignias.js).
export const GRADOS = {
    bronce:  { nombre: "Bronce",  orden: 0 },
    plata:   { nombre: "Plata",   orden: 1 },
    oro:     { nombre: "Oro",     orden: 2 },
    leyenda: { nombre: "Leyenda", orden: 3 },
};

// cuenta = qué número se mira (ver datosDeInsignias); meta = cuánto hace falta.
// icono = el ícono en pixel art del centro (ver iconos.js › ICONOS).
export const INSIGNIAS = [
    // --- Misiones ---
    { id: "primer-paso",    nombre: "El primer paso",       grado: "bronce",  icono: "brote",     cuenta: "misiones",   meta: 1,    texto: "Cumplir tu primera misión" },
    { id: "manos-obra",     nombre: "Manos a la obra",      grado: "bronce",  icono: "martillo",  cuenta: "misiones",   meta: 25,   texto: "Cumplir 25 misiones" },
    { id: "cien-victorias", nombre: "Cien victorias",       grado: "plata",   icono: "medalla",   cuenta: "misiones",   meta: 100,  texto: "Cumplir 100 misiones" },
    { id: "incansable",     nombre: "Incansable",           grado: "oro",     icono: "trofeo",    cuenta: "misiones",   meta: 500,  texto: "Cumplir 500 misiones" },
    { id: "mil-hazanas",    nombre: "Mil hazañas",          grado: "leyenda", icono: "corona",    cuenta: "misiones",   meta: 1000, texto: "Cumplir 1000 misiones" },
    // --- Rachas (la mejor que tuviste) ---
    { id: "semana-fuego",   nombre: "Semana de fuego",      grado: "bronce",  icono: "fuego",     cuenta: "racha",      meta: 7,    texto: "Una racha de 7 días" },
    { id: "mes-imparable",  nombre: "Mes imparable",        grado: "plata",   icono: "fuego",     cuenta: "racha",      meta: 30,   texto: "Una racha de 30 días" },
    { id: "cien-amaneceres", nombre: "Cien amaneceres",     grado: "oro",     icono: "amanecer",  cuenta: "racha",      meta: 100,  texto: "Una racha de 100 días" },
    { id: "ano-en-llamas",  nombre: "Un año en llamas",     grado: "leyenda", icono: "sol",       cuenta: "racha",      meta: 365,  texto: "Una racha de 365 días" },
    // --- Nivel ---
    { id: "aprendiz",       nombre: "Aprendiz",             grado: "bronce",  icono: "estrella",  cuenta: "nivel",      meta: 5,    texto: "Llegar al nivel 5" },
    { id: "aventurero",     nombre: "Aventurero",           grado: "plata",   icono: "espadas",   cuenta: "nivel",      meta: 10,   texto: "Llegar al nivel 10" },
    { id: "heroe-reino",    nombre: "Héroe del reino",      grado: "oro",     icono: "escudo",    cuenta: "nivel",      meta: 25,   texto: "Llegar al nivel 25" },
    { id: "leyenda-viva",   nombre: "Leyenda viva",         grado: "leyenda", icono: "corona",    cuenta: "nivel",      meta: 50,   texto: "Llegar al nivel 50" },
    // --- Días perfectos ---
    { id: "dia-redondo",    nombre: "Día redondo",          grado: "bronce",  icono: "diana",     cuenta: "perfectos",  meta: 5,    texto: "Tener 5 días perfectos" },
    { id: "precision",      nombre: "Precisión",            grado: "oro",     icono: "diana",     cuenta: "perfectos",  meta: 30,   texto: "Tener 30 días perfectos" },
    // --- Jefes ---
    { id: "primer-trofeo",  nombre: "Primer trofeo",        grado: "bronce",  icono: "calavera",  cuenta: "jefes",      meta: 1,    texto: "Vencer a tu primer jefe" },
    { id: "cazador-sombras", nombre: "Cazador de sombras",  grado: "plata",   icono: "espada",    cuenta: "jefes",      meta: 10,   texto: "Vencer a 10 jefes" },
    { id: "libertador",     nombre: "Libertador del reino", grado: "leyenda", icono: "castillo",  cuenta: "jefes",      meta: 20,   texto: "Vencer a los 20 jefes" },
    // --- Misiones principales ---
    { id: "gran-objetivo",  nombre: "Gran objetivo",        grado: "bronce",  icono: "bandera",   cuenta: "principales", meta: 1,   texto: "Terminar una misión principal" },
    { id: "constructor",    nombre: "Constructor de sueños", grado: "oro",    icono: "mapa",      cuenta: "principales", meta: 5,   texto: "Terminar 5 misiones principales" },
    // --- La Torre ---
    { id: "escalador",      nombre: "Escalador",            grado: "plata",   icono: "torre",     cuenta: "torre",      meta: 10,   texto: "Superar 10 pisos de la Torre" },
    { id: "la-cima",        nombre: "La cima",              grado: "oro",     icono: "montana",   cuenta: "torre",      meta: 30,   texto: "Superar 30 pisos de la Torre" },
    // --- El gimnasio ---
    { id: "sudor-honesto",  nombre: "Sudor honesto",        grado: "bronce",  icono: "pesa",      cuenta: "gym",        meta: 10,   texto: "Entrenar 10 veces" },
    { id: "hierro-forjado", nombre: "Hierro forjado",       grado: "plata",   icono: "brazo",     cuenta: "gym",        meta: 50,   texto: "Entrenar 50 veces" },
    { id: "cuerpo-titan",   nombre: "Cuerpo de titán",      grado: "oro",     icono: "pesa",      cuenta: "nivelGym",   meta: 5,    texto: "Llegar al nivel 5 del gimnasio" },
    // --- El diario ---
    { id: "pluma-fiel",     nombre: "Pluma fiel",           grado: "bronce",  icono: "pluma",     cuenta: "diario",     meta: 7,    texto: "Escribir 7 días en tu diario" },
    { id: "cronista",       nombre: "Cronista",             grado: "plata",   icono: "cuaderno",  cuenta: "diario",     meta: 50,   texto: "Escribir 50 días en tu diario" },
    // --- El reino ---
    { id: "voz-del-valle",  nombre: "Voz del valle",        grado: "plata",   icono: "globo",     cuenta: "voces",      meta: 10,   texto: "Recuperar 10 voces del valle" },
    { id: "guardian-saber", nombre: "Guardián del saber",   grado: "oro",     icono: "pergamino", cuenta: "pergaminos", meta: 8,    texto: "Leer los 8 pergaminos prohibidos" },
    { id: "amigo-bestias",  nombre: "Amigo de las bestias", grado: "plata",   icono: "huella",    cuenta: "mascotas",   meta: 3,    texto: "Tener 3 mascotas" },
    { id: "buscatesoros",   nombre: "Buscador de tesoros",  grado: "plata",   icono: "regalo",    cuenta: "cofres",     meta: 30,   texto: "Abrir 30 cofres del día" },
    { id: "coleccionista",  nombre: "Coleccionista",        grado: "plata",   icono: "bolsa",     cuenta: "objetos",    meta: 20,   texto: "Tener 20 objetos de equipo" },
    { id: "bien-merecido",  nombre: "Bien merecido",        grado: "bronce",  icono: "moneda",    cuenta: "canjes",     meta: 10,   texto: "Canjear 10 premios reales" },
];

export const POR_ID = Object.fromEntries(INSIGNIAS.map((i) => [i.id, i]));

// Los números que miran las insignias. info = juego.resumen(estado, hoy).
export function datosDeInsignias(estado, info) {
    const tieneTexto = (e) => Boolean(e && (e.texto?.trim() || e.animo || e.gratitud?.trim?.()));
    return {
        misiones: info.totalCompletadas,
        racha: info.racha.mejor,
        nivel: calcularNivel(estado.personaje?.xp || 0).nivel,
        perfectos: progresoLogro({ tipo: "perfectos" }, estado, info),
        jefes: info.jefesDerrotados,
        principales: info.principalesCompletadas,
        torre: estado.arcade?.records?.torre || 0,
        gym: estado.gym?.sesiones?.length || 0,
        nivelGym: nivelDeGym(estado.gym?.sesiones || []).nivel,
        diario: Object.values(estado.diario || {}).filter(tieneTexto).length,
        voces: Object.keys(estado.voces?.hechas || {}).length,
        pergaminos: Object.keys(estado.pergaminos?.leidos || {}).length,
        mascotas: 1 + Object.keys(estado.mascota?.adoptadas || {}).length,
        cofres: Object.keys(estado.cofres || {}).length,
        objetos: estado.avatar?.comprados?.length || 0,
        canjes: estado.canjes?.length || 0,
    };
}

// Cuánto llevas de una insignia: { actual, meta, ganada, porcentaje }.
export function progresoInsignia(insignia, datos) {
    const actual = Math.min(datos[insignia.cuenta] || 0, insignia.meta);
    return { actual, meta: insignia.meta, ganada: actual >= insignia.meta, porcentaje: Math.round((100 * actual) / insignia.meta) };
}

// Los ids de las insignias que ya ganaste (en el orden de la lista).
export function ganadas(estado, info) {
    const datos = datosDeInsignias(estado, info);
    return INSIGNIAS.filter((i) => progresoInsignia(i, datos).ganada).map((i) => i.id);
}
