// avatar.js — Las reglas del avatar.
//
// Igual que juego.js: aquí solo hay datos y cálculos, nada se dibuja.
// describirAvatar() junta todo lo que el dibujo necesita saber:
// etapa, clase, rasgos de los atributos, ánimo, equipamiento y mascota.

import { calcularNivel, ATRIBUTOS, BASE_ATRIBUTO } from "./juego.js";
import { diasEntre } from "./fechas.js";
import { calcularVida } from "./vida.js";


// 1. Etapas: el avatar evoluciona al subir de nivel.
export const ETAPAS = [
    { clave: "novato",     nombre: "Novato",     desde: 1,  cambio: "Túnica de lino de aprendiz." },
    { clave: "aventurero", nombre: "Aventurero", desde: 10, cambio: "Jubón del color de tu clase, cuero y botas altas." },
    { clave: "heroe",      nombre: "Héroe",      desde: 25, cambio: "Armadura de acero con oro, bufanda y capa." },
    { clave: "leyenda",    nombre: "Leyenda",    desde: 50, cambio: "Armadura legendaria, gema que brilla y aura." },
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

// 4. Ánimo: depende de tu vida, de tu racha y de los días sin completar misiones.
export const ANIMOS = {
    llamas:  { icono: "🔥", texto: "¡En llamas! Tu racha lo tiene encendido." },
    feliz:   { icono: "😄", texto: "¡Feliz! Sigue así." },
    normal:  { icono: "🙂", texto: "Listo para la aventura." },
    cansado: { icono: "🥱", texto: "Está cansado. Una misión hoy lo anima." },
    herido:  { icono: "🤕", texto: "Está herido. Cumple misiones para curarlo." },
    caido:   { icono: "☠️", texto: "Cayó en combate. Recupera la mitad de su vida para levantarlo." },
    dormido: { icono: "😴", texto: "Zzz… Completa una misión para despertarlo." },
};

// 5 y 6. Equipamiento: unos se compran con monedas, otros solo se ganan con logros.
export const ESPACIOS = { cabeza: "Cabeza", mano: "Mano", espalda: "Espalda", fondo: "Fondo" };

// Rareza: qué tan especial es un objeto (cambia el color de su marco).
// Los que se ganan con logros son siempre legendarios (y hay uno legendario que se compra).
export const RAREZAS = {
    comun:      { nombre: "Común",      color: "#9ca3af" },
    raro:       { nombre: "Raro",       color: "#38bdf8" },
    epico:      { nombre: "Épico",      color: "#c084fc" },
    legendario: { nombre: "Legendario", color: "#fbbf24" },
};

export const OBJETOS = {
    "gorra":         { nombre: "Gorra de aprendiz",   icono: "🧢", espacio: "cabeza",  precio: 60,  rareza: "comun" },
    "sombrero-mago": { nombre: "Sombrero de mago",    icono: "🧙", espacio: "cabeza",  precio: 120, rareza: "raro" },
    "casco":         { nombre: "Casco de caballero",  icono: "⛑️", espacio: "cabeza",  precio: 150, rareza: "epico" },
    "capucha":       { nombre: "Capucha del errante", icono: "🥷", espacio: "cabeza",  precio: 320, rareza: "epico" },
    "yelmo-alado":   { nombre: "Yelmo alado",         icono: "🪖", espacio: "cabeza",  precio: 380, rareza: "epico" },
    "corona":        { nombre: "Corona de 30 días",   icono: "👑", espacio: "cabeza",  rareza: "legendario",
                       logro: { tipo: "racha", meta: 30, texto: "Lograr una racha de 30 días" } },
    "corona-dragon": { nombre: "Corona del Dragón",   icono: "🐉", espacio: "cabeza",  precio: 1500, rareza: "legendario" },
    "espada-madera": { nombre: "Espada de madera",    icono: "🗡️", espacio: "mano",    precio: 60,  rareza: "comun" },
    "baston":        { nombre: "Bastón mágico",       icono: "🪄", espacio: "mano",    precio: 120, rareza: "raro" },
    "laud":          { nombre: "Laúd del bardo",      icono: "🪕", espacio: "mano",    precio: 120, rareza: "raro" },
    "hacha":         { nombre: "Hacha de guerra",     icono: "🪓", espacio: "mano",    precio: 380, rareza: "epico" },
    "mandoble":      { nombre: "Mandoble del juramento", icono: "🗡️", espacio: "mano", precio: 420, rareza: "epico" },
    "espada-jefe":   { nombre: "Espada del Jefe",     icono: "⚔️", espacio: "mano",    rareza: "legendario",
                       logro: { tipo: "jefes", meta: 1, texto: "Derrotar tu primer jefe" } },
    "lanza-dragon":  { nombre: "Lanza del Dragón",    icono: "🔱", espacio: "mano",    rareza: "legendario",
                       logro: { tipo: "jefes", meta: 8, texto: "Derrotar 8 jefes" } },
    "baculo-arcano": { nombre: "Báculo arcano",       icono: "🔮", espacio: "mano",    rareza: "legendario",
                       logro: { tipo: "torre", meta: 12, texto: "Superar 12 pisos de la Torre" } },
    "capa":          { nombre: "Capa carmesí",        icono: "🧣", espacio: "espalda", precio: 150, rareza: "epico" },
    "capa-real":     { nombre: "Capa real",           icono: "🟣", espacio: "espalda", precio: 450, rareza: "epico" },
    "alas":          { nombre: "Alas de luz",         icono: "🪽", espacio: "espalda", rareza: "legendario",
                       logro: { tipo: "perfectos", meta: 10, texto: "Tener 10 días perfectos" } },
    "alas-dragon":   { nombre: "Alas del Dragón",     icono: "🐲", espacio: "espalda", rareza: "legendario",
                       logro: { tipo: "nivel", meta: 25, texto: "Llegar al nivel 25" } },
    "bosque":        { nombre: "Fondo: Bosque",       icono: "🌲", espacio: "fondo",   precio: 100, rareza: "raro" },
    "castillo":      { nombre: "Fondo: Castillo",     icono: "🏰", espacio: "fondo",   precio: 150, rareza: "epico" },
    "galaxia":       { nombre: "Fondo: Galaxia",      icono: "🌌", espacio: "fondo",   precio: 250, rareza: "epico" },
    "salon":         { nombre: "Fondo: Salón de la fama", icono: "🏛️", espacio: "fondo", rareza: "legendario",
                       logro: { tipo: "logros", meta: 10, texto: "Conseguir 10 logros" } },
};

// Apariencia: para que el avatar se parezca a ti (se elige en la pantalla Personaje).
// Las opciones con "color" se muestran como círculos de color; las demás, como botones.
export const APARIENCIA = {
    cuerpo: {
        masculino: { nombre: "Masculino" },
        femenino:  { nombre: "Femenino" },
    },
    piel: {
        clara:  { nombre: "Clara",  color: "#f0c9a4", sombra: "#c99a70" },
        media:  { nombre: "Media",  color: "#d9a67c", sombra: "#b07a52" },
        canela: { nombre: "Canela", color: "#bd8454", sombra: "#93603a" },
        morena: { nombre: "Morena", color: "#8f5c3c", sombra: "#6c4128" },
        oscura: { nombre: "Oscura", color: "#5e3b27", sombra: "#402618" },
    },
    rostro: {
        sereno:   { nombre: "Sereno" },
        decidido: { nombre: "Decidido" },
        amable:   { nombre: "Amable" },
        curtido:  { nombre: "Curtido" },
    },
    ojos: {
        cafe:  { nombre: "Café",  color: "#5b3a1e" },
        miel:  { nombre: "Miel",  color: "#a8742a" },
        verde: { nombre: "Verde", color: "#3f8f5a" },
        azul:  { nombre: "Azul",  color: "#3b82c4" },
        gris:  { nombre: "Gris",  color: "#7b8794" },
    },
    pelo: {
        negro:   { nombre: "Negro",         color: "#16110e" },
        castano: { nombre: "Castaño",       color: "#3a2416" },
        claro:   { nombre: "Castaño claro", color: "#6b4a2a" },
        rubio:   { nombre: "Rubio",         color: "#b8924a" },
        rojizo:  { nombre: "Rojizo",        color: "#8a3b1c" },
        cano:    { nombre: "Canoso",        color: "#9a9aa0" },
    },
    peinado: {
        corto:    { nombre: "Corto" },
        rapado:   { nombre: "Rapado" },
        cresta:   { nombre: "Copete" },
        rizado:   { nombre: "Rizado" },
        melena:   { nombre: "Melena" },
        largo:    { nombre: "Largo" },
        recogido: { nombre: "Coleta" },
        calvo:    { nombre: "Calvo" },
    },
    barba: {
        ninguna:  { nombre: "Sin barba" },
        bigote:   { nombre: "Bigote" },
        candado:  { nombre: "Candado" },
        completa: { nombre: "Barba" },
    },
    // Color del traje. "clase" no tiene color propio: usa el de tu clase.
    traje: {
        clase:     { nombre: "El de tu clase" },
        azul:      { nombre: "Azul",      color: "#1e4fc2" },
        carmesi:   { nombre: "Carmesí",   color: "#9f1239" },
        esmeralda: { nombre: "Esmeralda", color: "#047857" },
        violeta:   { nombre: "Violeta",   color: "#6d28d9" },
        negro:     { nombre: "Negro",     color: "#2a2a34" },
        blanco:    { nombre: "Blanco",    color: "#c9ced8" },
    },
};

export const APARIENCIA_INICIAL = {
    cuerpo: "masculino", piel: "media", rostro: "sereno", ojos: "cafe",
    pelo: "castano", peinado: "corto", barba: "ninguna", traje: "clase",
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

export function calcularAnimo(estado, hoy, racha, vida = calcularVida(estado, hoy)) {
    const dias = diasSinMision(estado, hoy);
    if (vida.caido) return "caido";
    if (dias >= 3) return "dormido";
    if (vida.nivel === "herido") return "herido";
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
        case "nivel":     return calcularNivel(estado.personaje?.xp || 0).nivel;
        case "torre":     return estado.arcade?.records?.torre || 0;   // pisos superados (récord)
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
        apariencia: { ...APARIENCIA_INICIAL, ...estado.apariencia },
        mascota: {
            nombre: estado.mascota.nombre,
            etapa: etapaSegun(ETAPAS_MASCOTA, totalMisiones),
            total: totalMisiones,
            triste: animo === "dormido" || animo === "caido",   // si te descuidas, se pone triste
        },
    };
}
