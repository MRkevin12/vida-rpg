// avatar.js — Las reglas del avatar.
//
// Igual que juego.js: aquí solo hay datos y cálculos, nada se dibuja.
// describirAvatar() junta todo lo que el dibujo necesita saber:
// etapa, clase, rasgos de los atributos, ánimo, equipamiento y mascota.

import { calcularNivel, ATRIBUTOS, BASE_ATRIBUTO } from "./juego.js";
import { diasEntre } from "./fechas.js";


// 1. Etapas: el avatar evoluciona al subir de nivel.
export const ETAPAS = [
    { clave: "novato",     nombre: "Novato",     desde: 1,  cambio: "Ropa sencilla de aprendiz." },
    { clave: "aventurero", nombre: "Aventurero", desde: 10, cambio: "Túnica del color de tu clase y botas." },
    { clave: "heroe",      nombre: "Héroe",      desde: 25, cambio: "Capa de héroe y adornos dorados." },
    { clave: "leyenda",    nombre: "Leyenda",    desde: 50, cambio: "Aura brillante de leyenda." },
];

// 3. Clases: según tu atributo más alto.
export const CLASES = {
    aprendiz:  { nombre: "Aprendiz", icono: "🌱", color: "#94a3b8", oscuro: "#475569",
                 texto: "Completa misiones para descubrir tu clase." },
    fuerza:    { nombre: "Guerrero", icono: "⚔️", color: "#fb7185", oscuro: "#be123c",
                 texto: "Tu atributo más alto es Fuerza." },
    intelecto: { nombre: "Mago", icono: "🔮", color: "#22d3ee", oscuro: "#0e7490",
                 texto: "Tu atributo más alto es Intelecto." },
    carisma:   { nombre: "Bardo", icono: "🎶", color: "#c084fc", oscuro: "#7e22ce",
                 texto: "Tu atributo más alto es Carisma." },
    riqueza:   { nombre: "Mercader", icono: "⚖️", color: "#fbbf24", oscuro: "#b45309",
                 texto: "Tu atributo más alto es Riqueza." },
    completo:  { nombre: "Aventurero completo", icono: "🌟", color: "#34d399", oscuro: "#047857",
                 texto: "Tus 4 atributos están equilibrados (todos en nivel 3 o más)." },
};

// 2. Rasgos: cada atributo cambia algo visible al llegar a cierto nivel.
export const RASGOS = {
    fuerza:    [{ nivel: 3, texto: "Brazos más fuertes" }, { nivel: 6, texto: "Hombreras de armadura" }],
    intelecto: [{ nivel: 3, texto: "Lentes de sabio" },    { nivel: 6, texto: "Libro de hechizos" }],
    carisma:   [{ nivel: 3, texto: "Corbatín y gran sonrisa" }, { nivel: 6, texto: "Broche de rosa" }],
    riqueza:   [{ nivel: 3, texto: "Cadena de oro" },      { nivel: 6, texto: "Aretes de oro" }],
};

// 4. Ánimo: depende de tu racha y de los días sin completar misiones.
export const ANIMOS = {
    llamas:  { icono: "🔥", texto: "¡En llamas! Tu racha lo tiene encendido." },
    feliz:   { icono: "😄", texto: "¡Feliz! Sigue así." },
    normal:  { icono: "🙂", texto: "Listo para la aventura." },
    cansado: { icono: "🥱", texto: "Está cansado. Una misión hoy lo anima." },
    dormido: { icono: "😴", texto: "Zzz… Completa una misión para despertarlo." },
};

// 5 y 6. Equipamiento: unos se compran con monedas, otros solo se ganan con logros.
export const ESPACIOS = { cabeza: "Cabeza", mano: "Mano", espalda: "Espalda", fondo: "Fondo" };

export const OBJETOS = {
    "gorra":         { nombre: "Gorra de aprendiz",   icono: "🧢", espacio: "cabeza",  precio: 60 },
    "sombrero-mago": { nombre: "Sombrero de mago",    icono: "🧙", espacio: "cabeza",  precio: 120 },
    "casco":         { nombre: "Casco de caballero",  icono: "⛑️", espacio: "cabeza",  precio: 150 },
    "corona":        { nombre: "Corona de 30 días",   icono: "👑", espacio: "cabeza",
                       logro: { tipo: "racha", meta: 30, texto: "Lograr una racha de 30 días" } },
    "espada-madera": { nombre: "Espada de madera",    icono: "🗡️", espacio: "mano",    precio: 60 },
    "baston":        { nombre: "Bastón mágico",       icono: "🪄", espacio: "mano",    precio: 120 },
    "laud":          { nombre: "Laúd del bardo",      icono: "🪕", espacio: "mano",    precio: 120 },
    "espada-jefe":   { nombre: "Espada del Jefe",     icono: "⚔️", espacio: "mano",
                       logro: { tipo: "jefes", meta: 1, texto: "Derrotar tu primer jefe" } },
    "capa":          { nombre: "Capa carmesí",        icono: "🧣", espacio: "espalda", precio: 150 },
    "alas":          { nombre: "Alas de luz",         icono: "🪽", espacio: "espalda",
                       logro: { tipo: "perfectos", meta: 10, texto: "Tener 10 días perfectos" } },
    "bosque":        { nombre: "Fondo: Bosque",       icono: "🌲", espacio: "fondo",   precio: 100 },
    "castillo":      { nombre: "Fondo: Castillo",     icono: "🏰", espacio: "fondo",   precio: 150 },
    "galaxia":       { nombre: "Fondo: Galaxia",      icono: "🌌", espacio: "fondo",   precio: 250 },
    "salon":         { nombre: "Fondo: Salón de la fama", icono: "🏛️", espacio: "fondo",
                       logro: { tipo: "logros", meta: 10, texto: "Conseguir 10 logros" } },
};

// 7. Mascota: crece con las misiones diarias que completas.
export const ETAPAS_MASCOTA = [
    { clave: "huevo",  nombre: "Huevo",  desde: 0 },
    { clave: "cria",   nombre: "Cría",   desde: 10 },
    { clave: "adulto", nombre: "Adulto", desde: 50 },
];


// ===== Cálculos =====

// Busca el último elemento de una lista de etapas cuyo "desde" ya alcanzaste.
function etapaSegun(lista, valor) {
    return [...lista].reverse().find((etapa) => valor >= etapa.desde);
}

export function siguienteEtapa(lista, etapa) {
    return lista[lista.indexOf(etapa) + 1] || null;
}

export function etapaDeNivel(nivel) {
    return etapaSegun(ETAPAS, nivel);
}

function nivelesDeAtributos(estado) {
    const niveles = {};
    for (const clave of Object.keys(ATRIBUTOS)) {
        niveles[clave] = calcularNivel(estado.atributos[clave], BASE_ATRIBUTO).nivel;
    }
    return niveles;
}

// La clase es tu atributo con más XP. Si los 4 están parejos (todos en nivel 3
// o más y a máximo 1 nivel de diferencia), eres "Aventurero completo".
export function calcularClase(estado) {
    const niveles = Object.values(nivelesDeAtributos(estado));
    if (Math.min(...niveles) >= 3 && Math.max(...niveles) - Math.min(...niveles) <= 1) {
        return "completo";
    }
    let mejor = null;
    for (const clave of Object.keys(ATRIBUTOS)) {
        if (estado.atributos[clave] > 0 && (!mejor || estado.atributos[clave] > estado.atributos[mejor])) {
            mejor = clave;
        }
    }
    return mejor || "aprendiz";
}

// Días desde tu última misión diaria completada (o desde que empezaste).
export function diasSinMision(estado, hoy) {
    let ultima = estado.personaje.creadoEn;
    for (const c of estado.completadas) {
        if (c.fecha > ultima) ultima = c.fecha;
    }
    return diasEntre(ultima, hoy);
}

export function calcularAnimo(estado, hoy, racha) {
    const dias = diasSinMision(estado, hoy);
    if (dias >= 3) return "dormido";
    if (dias === 2) return "cansado";
    if (racha.actual >= 7) return "llamas";
    if (racha.actual >= 3 || estado.completadas.some((c) => c.fecha === hoy)) return "feliz";
    return "normal";
}

// ¿Cuánto llevas de la condición de un objeto de logro?
export function progresoObjeto(objeto, estado, info) {
    switch (objeto.logro.tipo) {
        case "racha":     return info.racha.mejor;
        case "jefes":     return info.jefesDerrotados;
        case "perfectos": return info.diasPerfectos;
        case "logros":    return estado.logros.filter((l) => l.desbloqueadoEn).length;
        default:          return 0;
    }
}

// Objetos de logro que ya ganaste (se calculan, no se guardan: nunca se desordenan).
export function objetosDeLogroGanados(estado, info) {
    return Object.keys(OBJETOS).filter((id) => {
        const objeto = OBJETOS[id];
        return objeto.logro && progresoObjeto(objeto, estado, info) >= objeto.logro.meta;
    });
}

// Todo lo que puedes equiparte: lo comprado + lo ganado con logros.
export function objetosDisponibles(estado, info) {
    return new Set([...estado.avatar.comprados, ...objetosDeLogroGanados(estado, info)]);
}

// Junta todo lo que hace falta para dibujar el avatar.
export function describirAvatar(estado, hoy, info) {
    const nivel = calcularNivel(estado.personaje.xp).nivel;
    const etapa = etapaDeNivel(nivel);
    const claseClave = calcularClase(estado);

    // Rasgos: 0, 1 o 2 según cuántos umbrales alcanzó cada atributo.
    const niveles = nivelesDeAtributos(estado);
    const rasgos = {};
    for (const [clave, umbrales] of Object.entries(RASGOS)) {
        rasgos[clave] = umbrales.filter((u) => niveles[clave] >= u.nivel).length;
    }

    // Solo se dibuja lo equipado que de verdad tienes.
    const disponibles = objetosDisponibles(estado, info);
    const equipado = {};
    for (const espacio of Object.keys(ESPACIOS)) {
        const id = estado.avatar.equipado[espacio];
        equipado[espacio] = id && disponibles.has(id) ? id : null;
    }

    const animo = calcularAnimo(estado, hoy, info.racha);
    const totalMisiones = estado.completadas.length;

    return {
        nivel,
        etapa,
        clave: claseClave,
        clase: CLASES[claseClave],
        niveles,
        rasgos,
        animo,
        diasSinMision: diasSinMision(estado, hoy),
        equipado,
        mascota: {
            nombre: estado.mascota.nombre,
            etapa: etapaSegun(ETAPAS_MASCOTA, totalMisiones),
            total: totalMisiones,
            triste: animo === "dormido",   // si la descuidas 3 días, se pone triste
        },
    };
}
