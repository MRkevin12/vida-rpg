// avatar.js — Las reglas del avatar.
//
// Igual que juego.js: aquí solo hay datos y cálculos, nada se dibuja.
// describirAvatar() junta todo lo que el dibujo necesita saber:
// etapa, clase, rasgos de los atributos, ánimo, equipamiento y mascota.

import { calcularNivel, ATRIBUTOS, BASE_ATRIBUTO } from "./juego.js";
import { diasEntre, hoy as hoyDeHoy } from "./fechas.js";
import { calcularVida } from "./vida.js";
import { fisicoDe, nivelDeGym, mejorRachaSemanal } from "./gym.js";
import { especieActiva, nombreDe, totalDe } from "./mascota.js";


// 1. Etapas: el avatar evoluciona al subir de nivel.
// "armadura": la protección que da la ropa de esa etapa (ver «Armadura» en equipo.js).
export const ETAPAS = [
    { clave: "novato",     nombre: "Novato",     desde: 1,  armadura: 15, cambio: "Túnica de lino de aprendiz." },
    { clave: "aventurero", nombre: "Aventurero", desde: 10, armadura: 25, cambio: "Jubón del color de tu clase, cuero y botas altas." },
    { clave: "heroe",      nombre: "Héroe",      desde: 25, armadura: 35, cambio: "Armadura de acero con oro, bufanda y capa." },
    { clave: "leyenda",    nombre: "Leyenda",    desde: 50, armadura: 45, cambio: "Armadura legendaria, gema que brilla y aura." },
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
// v34: el PECHO (armaduras que se ponen sobre la ropa de tu etapa).
// v100: PIERNAS (pantalones) y PIES (botas). El orden es el de la pantalla.
export const ESPACIOS = { cabeza: "Cabeza", pecho: "Pecho", piernas: "Piernas", pies: "Pies", mano: "Mano", espalda: "Espalda", fondo: "Fondo" };

// "poder" (v24): lo que da cada objeto. armadura = protege cuando fallas una misión;
// ataque, magia y suerte = más fuerza en la Torre y en los minijuegos (ver equipo.js).
// "habilidad" (v26): los épicos y legendarios tienen además un rasgo especial que solo
// funciona en la Torre (ver habilidades.js).
// Rareza: qué tan especial es un objeto (cambia el color de su marco).
// Los que se ganan con logros son siempre legendarios (y hay uno legendario que se compra).
export const RAREZAS = {
    comun:      { nombre: "Común",      color: "#9ca3af" },
    raro:       { nombre: "Raro",       color: "#38bdf8" },
    epico:      { nombre: "Épico",      color: "#c084fc" },
    legendario: { nombre: "Legendario", color: "#fbbf24" },
};

export const OBJETOS = {
    "gorra":         { nombre: "Gorra de aprendiz",   icono: "🧢", espacio: "cabeza",  precio: 60,  rareza: "comun", poder: { armadura: 3 } },
    "sombrero-mago": { nombre: "Sombrero de mago",    icono: "🧙", espacio: "cabeza",  precio: 120, rareza: "raro", poder: { armadura: 2, magia: 4 } },
    "casco":         { nombre: "Casco de caballero",  icono: "⛑️", espacio: "cabeza",  precio: 150, rareza: "epico", poder: { armadura: 12 }, habilidad: "firme" },
    "capucha":       { nombre: "Capucha del errante", icono: "🥷", espacio: "cabeza",  precio: 320, rareza: "epico", poder: { armadura: 7, suerte: 4 }, habilidad: "sombra" },
    "yelmo-alado":   { nombre: "Yelmo alado",         icono: "🪖", espacio: "cabeza",  precio: 380, rareza: "epico", poder: { armadura: 15, ataque: 1 }, habilidad: "impetu" },
    "corona":        { nombre: "Corona de 30 días",   icono: "👑", espacio: "cabeza",  rareza: "legendario", poder: { armadura: 8, suerte: 6 }, habilidad: "constancia",
                       logro: { tipo: "racha", meta: 30, texto: "Lograr una racha de 30 días" } },
    "corona-dragon": { nombre: "Corona del Dragón",   icono: "🐉", espacio: "cabeza",  precio: 1500, rareza: "legendario", poder: { armadura: 18, magia: 4, suerte: 4 }, habilidad: "ojo-dragon" },
    "diadema":       { nombre: "Diadema de plata",    icono: "💠", espacio: "cabeza",  precio: 140, rareza: "raro", poder: { armadura: 2, magia: 3, suerte: 3 } },
    "yelmo-astado":  { nombre: "Yelmo astado",        icono: "🐂", espacio: "cabeza",  precio: 400, rareza: "epico", poder: { armadura: 13, ataque: 2 }, habilidad: "rugido" },
    // --- Pecho (v34) ---
    "peto-cuero":    { nombre: "Peto de cuero",       icono: "🦺", espacio: "pecho",   precio: 80,  rareza: "comun", poder: { armadura: 5 } },
    "cota-malla":    { nombre: "Cota de malla",       icono: "⛓️", espacio: "pecho",   precio: 160, rareza: "raro", poder: { armadura: 9 } },
    "tunica-arcana": { nombre: "Túnica arcana",       icono: "🔯", espacio: "pecho",   precio: 170, rareza: "raro", poder: { armadura: 3, magia: 5 } },
    "coraza":        { nombre: "Coraza de acero",     icono: "🛡️", espacio: "pecho",   precio: 420, rareza: "epico", poder: { armadura: 16 }, habilidad: "muralla" },
    "coraza-vigia":  { nombre: "Coraza del Vigía",    icono: "🕯️", espacio: "pecho",   rareza: "legendario", poder: { armadura: 20, ataque: 2, magia: 2 }, habilidad: "llama",
                       logro: { tipo: "torre", meta: 20, texto: "Despejar la tormenta: superar 20 pisos de la Torre" } },
    "espada-madera": { nombre: "Espada de madera",    icono: "🗡️", espacio: "mano",    precio: 60,  rareza: "comun", poder: { ataque: 2 } },
    "baston":        { nombre: "Bastón mágico",       icono: "🪄", espacio: "mano",    precio: 120, rareza: "raro", poder: { magia: 5, ataque: 1 } },
    "laud":          { nombre: "Laúd del bardo",      icono: "🪕", espacio: "mano",    precio: 120, rareza: "raro", poder: { suerte: 6, magia: 2 } },
    "hacha":         { nombre: "Hacha de guerra",     icono: "🪓", espacio: "mano",    precio: 380, rareza: "epico", poder: { ataque: 5 }, habilidad: "desgarro" },
    "mandoble":      { nombre: "Mandoble del juramento", icono: "🗡️", espacio: "mano", precio: 420, rareza: "epico", poder: { ataque: 7 }, habilidad: "juramento" },
    "espada-jefe":   { nombre: "Espada del Jefe",     icono: "⚔️", espacio: "mano",    rareza: "legendario", poder: { ataque: 6 }, habilidad: "sed",
                       logro: { tipo: "jefes", meta: 1, texto: "Derrotar tu primer jefe" } },
    "lanza-dragon":  { nombre: "Lanza del Dragón",    icono: "🔱", espacio: "mano",    rareza: "legendario", poder: { ataque: 9, suerte: 4 }, habilidad: "embestida",
                       logro: { tipo: "jefes", meta: 8, texto: "Derrotar 8 jefes" } },
    "baculo-arcano": { nombre: "Báculo arcano",       icono: "🔮", espacio: "mano",    rareza: "legendario", poder: { magia: 10, ataque: 2 }, habilidad: "arcano",
                       logro: { tipo: "torre", meta: 12, texto: "Superar 12 pisos de la Torre" } },
    "daga":          { nombre: "Daga del ladrón",     icono: "🔪", espacio: "mano",    precio: 130, rareza: "raro", poder: { ataque: 3, suerte: 4 } },
    "martillo":      { nombre: "Martillo de guerra",  icono: "🔨", espacio: "mano",    precio: 440, rareza: "epico", poder: { ataque: 8 }, habilidad: "aturdir" },
    "capa":          { nombre: "Capa carmesí",        icono: "🧣", espacio: "espalda", precio: 150, rareza: "epico", poder: { armadura: 8 }, habilidad: "valor" },
    "capa-real":     { nombre: "Capa real",           icono: "🟣", espacio: "espalda", precio: 450, rareza: "epico", poder: { armadura: 12, magia: 2 }, habilidad: "regia" },
    "alas":          { nombre: "Alas de luz",         icono: "🪽", espacio: "espalda", rareza: "legendario", poder: { armadura: 10, suerte: 5 }, habilidad: "gracia",
                       logro: { tipo: "perfectos", meta: 10, texto: "Tener 10 días perfectos" } },
    "alas-dragon":   { nombre: "Alas del Dragón",     icono: "🐲", espacio: "espalda", rareza: "legendario", poder: { armadura: 18, ataque: 3 }, habilidad: "escamas",
                       logro: { tipo: "nivel", meta: 25, texto: "Llegar al nivel 25" } },
    // --- (v74) Recompensas de constancia en el gimnasio: se ganan cumpliendo tu meta semanal varias semanas seguidas ---
    "cinta-hierro":   { nombre: "Cinta de hierro",   icono: "🎽", espacio: "cabeza",  rareza: "legendario", poder: { armadura: 5, ataque: 1 }, habilidad: "vigor",
                        logro: { tipo: "gymsemanas", meta: 2, texto: "Cumplir tu meta de gym 2 semanas seguidas" } },
    "peto-constante": { nombre: "Peto del constante", icono: "🏋️", espacio: "pecho",  rareza: "legendario", poder: { armadura: 13, ataque: 1 }, habilidad: "ritmo",
                        logro: { tipo: "gymsemanas", meta: 4, texto: "Cumplir tu meta de gym 4 semanas seguidas" } },
    "coraza-titan":   { nombre: "Coraza del Titán",  icono: "🗿", espacio: "pecho",   rareza: "legendario", poder: { armadura: 22, ataque: 3 }, habilidad: "titan",
                        logro: { tipo: "gymsemanas", meta: 8, texto: "Cumplir tu meta de gym 8 semanas seguidas" } },
    "capa-fragua":    { nombre: "Capa de la Fragua", icono: "🔥", espacio: "espalda", rareza: "legendario", poder: { armadura: 14, ataque: 2 }, habilidad: "brasa",
                        logro: { tipo: "gymsemanas", meta: 12, texto: "Cumplir tu meta de gym 12 semanas seguidas" } },
    "escudo":        { nombre: "Escudo redondo",      icono: "🛡️", espacio: "espalda", precio: 160, rareza: "raro", poder: { armadura: 9 } },
    "capa-cuervo":   { nombre: "Capa de plumas de cuervo", icono: "🪶", espacio: "espalda", precio: 430, rareza: "epico", poder: { armadura: 9, suerte: 4 }, habilidad: "presagio" },
    "bosque":        { nombre: "Fondo: Bosque",       icono: "🌲", espacio: "fondo",   precio: 100, rareza: "raro" },
    "castillo":      { nombre: "Fondo: Castillo",     icono: "🏰", espacio: "fondo",   precio: 150, rareza: "epico", habilidad: "bastion" },
    "galaxia":       { nombre: "Fondo: Galaxia",      icono: "🌌", espacio: "fondo",   precio: 250, rareza: "epico", habilidad: "estrellas" },
    "salon":         { nombre: "Fondo: Salón de la fama", icono: "🏛️", espacio: "fondo", rareza: "legendario", habilidad: "gloria",
                       logro: { tipo: "logros", meta: 10, texto: "Conseguir 10 logros" } },
    "mar":           { nombre: "Fondo: Mar embravecido", icono: "🌊", espacio: "fondo", precio: 120, rareza: "raro" },
    "aurora":        { nombre: "Fondo: Aurora boreal", icono: "🌠", espacio: "fondo",  precio: 300, rareza: "epico", habilidad: "aurora" },

    // ===== (v100) Piernas: pantalones. "aspecto" dice cómo se dibujan (dibujo-ropa.js › piernas):
    // tela = color del pantalón, ribete = una franja al costado, placas = color de las placas de metal en los muslos.
    "calzas-lino":        { nombre: "Calzas de lino",            icono: "👖", espacio: "piernas", precio: 50,  rareza: "comun", poder: { armadura: 2 },
                            aspecto: { tela: "#b8a07a" } },
    "pantalon-viajero":   { nombre: "Pantalón de viajero",       icono: "👖", espacio: "piernas", precio: 70,  rareza: "comun", poder: { armadura: 3, suerte: 1 },
                            aspecto: { tela: "#5b4636" } },
    "bombachos":          { nombre: "Bombachos del explorador",  icono: "👖", espacio: "piernas", precio: 140, rareza: "raro", poder: { armadura: 4, suerte: 3 },
                            aspecto: { tela: "#3f5f4a", ribete: "#c8a040" } },
    "calzas-arcanas":     { nombre: "Calzas de seda arcana",     icono: "👖", espacio: "piernas", precio: 160, rareza: "raro", poder: { armadura: 2, magia: 4 },
                            aspecto: { tela: "#4b2a7a", ribete: "#e3b53c" } },
    "pantalon-cuero":     { nombre: "Pantalón de cuero curtido", icono: "👖", espacio: "piernas", precio: 180, rareza: "raro", poder: { armadura: 7 },
                            aspecto: { tela: "#6a4528", ribete: "#3a2416" } },
    "quijotes-acero":     { nombre: "Quijotes de acero",         icono: "👖", espacio: "piernas", precio: 390, rareza: "epico", poder: { armadura: 12 }, habilidad: "arraigo",
                            aspecto: { tela: "#2e2a3a", placas: "#a9b3c4" } },
    "grebas-sombra":      { nombre: "Grebas de la sombra",       icono: "👖", espacio: "piernas", precio: 420, rareza: "epico", poder: { armadura: 6, suerte: 5 }, habilidad: "ligereza",
                            aspecto: { tela: "#1c1a26", placas: "#3a3550", ribete: "#7c3aed" } },
    "grebas-baluarte":    { nombre: "Grebas del Baluarte",       icono: "👖", espacio: "piernas", rareza: "legendario", poder: { armadura: 16, ataque: 2 }, habilidad: "baluarte",
                            aspecto: { tela: "#22304f", placas: "#e3b53c", ribete: "#e3b53c" },
                            logro: { tipo: "perfectos", meta: 20, texto: "Tener 20 días perfectos" } },

    // ===== (v100) Pies: botas. aspecto: tipo ("cuero" o "metal"), color, alto (dónde empieza la caña:
    // 0 = en la rodilla, 1 = en el tobillo) y ribete (la vuelta de arriba).
    "sandalias":          { nombre: "Sandalias de cuero",        icono: "🥾", espacio: "pies", precio: 40,  rareza: "comun", poder: { armadura: 1, suerte: 1 },
                            aspecto: { tipo: "cuero", color: "#8a5a34", alto: 0.9 } },
    "botas-camino":       { nombre: "Botas de camino",           icono: "🥾", espacio: "pies", precio: 70,  rareza: "comun", poder: { armadura: 3 },
                            aspecto: { tipo: "cuero", color: "#5a3f28", alto: 0.55 } },
    "botas-montana":      { nombre: "Botas de montaña",          icono: "🥾", espacio: "pies", precio: 130, rareza: "raro", poder: { armadura: 4, suerte: 2 },
                            aspecto: { tipo: "cuero", color: "#3a2a1e", alto: 0.35, ribete: "#9a7248" } },
    "botas-arcanas":      { nombre: "Botas del aprendiz arcano", icono: "🥾", espacio: "pies", precio: 150, rareza: "raro", poder: { armadura: 2, magia: 4 },
                            aspecto: { tipo: "cuero", color: "#3b2266", alto: 0.35, ribete: "#e3b53c" } },
    "escarpes-hierro":    { nombre: "Escarpes de hierro",        icono: "🥾", espacio: "pies", precio: 360, rareza: "epico", poder: { armadura: 10 }, habilidad: "zancada",
                            aspecto: { tipo: "metal", color: "#a9b3c4", alto: 0.3 } },
    "botas-viento":       { nombre: "Botas del viento",          icono: "🥾", espacio: "pies", precio: 410, rareza: "epico", poder: { armadura: 5, ataque: 2, suerte: 3 }, habilidad: "impulso",
                            aspecto: { tipo: "cuero", color: "#2e5a7a", alto: 0.25, ribete: "#d9deeb" } },
    "botas-leguas":       { nombre: "Botas de siete leguas",     icono: "🥾", espacio: "pies", rareza: "legendario", poder: { armadura: 9, suerte: 5 }, habilidad: "leguas",
                            aspecto: { tipo: "cuero", color: "#4a2a14", alto: 0.2, ribete: "#e3b53c" },
                            logro: { tipo: "racha", meta: 60, texto: "Lograr una racha de 60 días" } },
    "escarpes-dragon":    { nombre: "Escarpes del Dragón",       icono: "🥾", espacio: "pies", precio: 1400, rareza: "legendario", poder: { armadura: 14, ataque: 3, magia: 2 }, habilidad: "pisada",
                            aspecto: { tipo: "metal", color: "#3a5a90", alto: 0.2, ribete: "#e3b53c" } },

    // ===== (v100) Más equipo en la tienda. Son VARIANTES de otros objetos (mismo dibujo, otro color o
    // metal): ver dibujo-objetos.js › VARIANTES. Las capas nuevas son la capa de siempre en otro color.
    "gorra-roja":         { nombre: "Gorra del cazador",         icono: "🧢", espacio: "cabeza",  precio: 50,  rareza: "comun", poder: { armadura: 2, suerte: 1 } },
    "yelmo-hierro":       { nombre: "Yelmo de hierro",           icono: "🪖", espacio: "cabeza",  precio: 90,  rareza: "comun", poder: { armadura: 6 } },
    "capucha-arcana":     { nombre: "Capucha arcana",            icono: "🥷", espacio: "cabeza",  precio: 150, rareza: "raro", poder: { armadura: 4, magia: 3 } },
    "diadema-dorada":     { nombre: "Diadema dorada",            icono: "💠", espacio: "cabeza",  precio: 160, rareza: "raro", poder: { armadura: 2, suerte: 5 } },
    "peto-reforzado":     { nombre: "Peto reforzado",            icono: "🦺", espacio: "pecho",   precio: 100, rareza: "comun", poder: { armadura: 6 } },
    "cota-dorada":        { nombre: "Cota dorada",               icono: "⛓️", espacio: "pecho",   precio: 200, rareza: "raro", poder: { armadura: 8, suerte: 2 } },
    "tunica-esmeralda":   { nombre: "Túnica esmeralda",          icono: "🔯", espacio: "pecho",   precio: 180, rareza: "raro", poder: { armadura: 3, magia: 4, suerte: 1 } },
    "baston-roble":       { nombre: "Bastón de roble",           icono: "🪄", espacio: "mano",    precio: 70,  rareza: "comun", poder: { magia: 3 } },
    "daga-veneno":        { nombre: "Daga de jade",              icono: "🔪", espacio: "mano",    precio: 170, rareza: "raro", poder: { ataque: 3, suerte: 5 } },
    "martillo-ligero":    { nombre: "Martillo del herrero",      icono: "🔨", espacio: "mano",    precio: 220, rareza: "raro", poder: { ataque: 5 } },
    "capa-gris":          { nombre: "Capa de lana gris",         icono: "🧣", espacio: "espalda", precio: 70,  rareza: "comun", poder: { armadura: 4 } },
    "capa-azul":          { nombre: "Capa del alba",             icono: "🧣", espacio: "espalda", precio: 140, rareza: "raro", poder: { armadura: 6 } },
    "capa-esmeralda":     { nombre: "Capa del bosque",           icono: "🧣", espacio: "espalda", precio: 150, rareza: "raro", poder: { armadura: 5, suerte: 2 } },
    // Fondos nuevos: las pinturas de los escenarios de batalla y de la Torre ("pintura" = cuál, ver pinturas.js).
    "fondo-alpes":        { nombre: "Fondo: Tormenta en los Alpes", icono: "🏔️", espacio: "fondo", precio: 200, rareza: "raro", pintura: "escena-fuerza" },
    "fondo-galeria":      { nombre: "Fondo: La Gran Galería",    icono: "🖼️", espacio: "fondo",   precio: 200, rareza: "raro", pintura: "escena-intelecto" },
    "fondo-teatro":       { nombre: "Fondo: El gran teatro",     icono: "🎭", espacio: "fondo",   precio: 200, rareza: "raro", pintura: "escena-carisma" },
    "fondo-catedral":     { nombre: "Fondo: Catedral de noche",  icono: "🕯️", espacio: "fondo",   precio: 220, rareza: "raro", pintura: "escena-riqueza" },
    "fondo-carceles":     { nombre: "Fondo: Las cárceles de Piranesi", icono: "⛓️", espacio: "fondo", precio: 240, rareza: "raro", pintura: "torre" },
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
        // (v102)
        porcelana: { nombre: "Porcelana", color: "#f8dfc9", sombra: "#d4a98a" },
        oliva:     { nombre: "Oliva",     color: "#c79d6e", sombra: "#9c7348" },
        ebano:     { nombre: "Ébano",     color: "#422819", sombra: "#2a1810" },
    },
    rostro: {
        sereno:   { nombre: "Sereno" },
        decidido: { nombre: "Decidido" },
        amable:   { nombre: "Amable" },
        curtido:  { nombre: "Curtido" },
        severo:   { nombre: "Severo" },     // (v102) cejas bajas y rectas
        cansado:  { nombre: "Ojeroso" },    // (v102) ojeras de tanto estudiar
    },
    ojos: {
        cafe:  { nombre: "Café",  color: "#5b3a1e" },
        miel:  { nombre: "Miel",  color: "#a8742a" },
        verde: { nombre: "Verde", color: "#3f8f5a" },
        azul:  { nombre: "Azul",  color: "#3b82c4" },
        gris:  { nombre: "Gris",  color: "#7b8794" },
        // (v102)
        ambar:   { nombre: "Ámbar",   color: "#c9821a" },
        violeta: { nombre: "Violeta", color: "#7c4ab8" },
        negro:   { nombre: "Negro",   color: "#1c1410" },
        hielo:   { nombre: "Hielo",   color: "#9fd6ea" },
    },
    pelo: {
        negro:   { nombre: "Negro",         color: "#16110e" },
        castano: { nombre: "Castaño",       color: "#3a2416" },
        claro:   { nombre: "Castaño claro", color: "#6b4a2a" },
        rubio:   { nombre: "Rubio",         color: "#b8924a" },
        rojizo:  { nombre: "Rojizo",        color: "#8a3b1c" },
        cano:    { nombre: "Canoso",        color: "#9a9aa0" },
        // (v102)
        platino:  { nombre: "Platino",        color: "#d9cfae" },
        blanco:   { nombre: "Blanco",         color: "#e6e3dc" },
        cobrizo:  { nombre: "Cobrizo",        color: "#b0542a" },
        azabache: { nombre: "Negro azulado",  color: "#1b2340" },
        ceniza:   { nombre: "Ceniza",         color: "#6e6a64" },
        vino:     { nombre: "Vino",           color: "#5a1a2a" },
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
        // (v102)
        trenza:   { nombre: "Trenza" },
        puntas:   { nombre: "En punta" },
        lado:     { nombre: "Raya al lado" },
        mono:     { nombre: "Moño" },
    },
    barba: {
        ninguna:  { nombre: "Sin barba" },
        bigote:   { nombre: "Bigote" },
        candado:  { nombre: "Candado" },
        completa: { nombre: "Barba" },
        // (v102)
        perilla:  { nombre: "Perilla" },
        patillas: { nombre: "Patillas" },
        larga:    { nombre: "Barba larga" },
        corta:    { nombre: "Barba corta" },
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
        // (v102)
        dorado:    { nombre: "Dorado",    color: "#a87412" },
        borgona:   { nombre: "Borgoña",   color: "#5c1022" },
        oliva:     { nombre: "Oliva",     color: "#4d5a24" },
        cielo:     { nombre: "Cielo",     color: "#3a8ad0" },
        acero:     { nombre: "Gris acero", color: "#4a5568" },
        cobre:     { nombre: "Cobre",     color: "#9a4a1c" },
    },
    // (v102) Marcas de la cara (dibujo-cuerpo.js › cara).
    marca: {
        ninguna:   { nombre: "Ninguna" },
        cicatriz:  { nombre: "Cicatriz en el ojo" },
        mejilla:   { nombre: "Cicatriz en la mejilla" },
        guerra:    { nombre: "Pintura de guerra" },
        runa:      { nombre: "Runa en la frente" },
        lunar:     { nombre: "Lunar" },
    },
    // (v102) Complementos (dibujo-cuerpo.js › complemento). Van encima de la cara y debajo del sombrero.
    complemento: {
        ninguno:   { nombre: "Ninguno" },
        parche:    { nombre: "Parche" },
        pendiente: { nombre: "Pendiente de oro" },
        cinta:     { nombre: "Cinta en la frente" },
        aros:      { nombre: "Dos aros" },
        venda:     { nombre: "Venda en la cabeza" },
    },
};

export const APARIENCIA_INICIAL = {
    cuerpo: "masculino", piel: "media", rostro: "sereno", ojos: "cafe",
    pelo: "castano", peinado: "corto", barba: "ninguna", traje: "clase",
    marca: "ninguna", complemento: "ninguno",   // (v102)
};

// 7. Mascota: crece con las misiones diarias que completas (desde que la adoptaste: ver mascota.js).
export const ETAPAS_MASCOTA = [
    { clave: "huevo",  nombre: "Huevo",  desde: 0 },
    { clave: "cria",   nombre: "Cría",   desde: 10 },
    { clave: "adulto", nombre: "Adulto", desde: 50 },
];


// ===== Cálculos =====

// Busca el último elemento de una lista de etapas cuyo "desde" ya alcanzaste.
export function etapaSegun(lista, valor) {
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
        case "gymsemanas": return mejorRachaSemanal(estado.gym?.sesiones || [], estado.gym?.metaSemanal || 4, hoyDeHoy());   // (v74) la constancia en el gimnasio
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
    const especie = especieActiva(estado);
    const totalMisiones = totalDe(estado, especie);

    return {
        nivel,
        etapa,
        fisico: fisicoDe(nivelDeGym(estado.gym?.sesiones || []).nivel),   // (v66) qué tan fornido te hace el gimnasio (0–3)
        clave: claseClave,
        clase: CLASES[claseClave],
        niveles,
        rasgos,
        animo,
        diasSinMision: diasSinMision(estado, hoy),
        equipado,
        insignia: estado.insignias?.puesta || null,   // (v101) la insignia que llevas en el pecho (ponerInsignia revisa que sea tuya)
        apariencia: { ...APARIENCIA_INICIAL, ...estado.apariencia },
        mascota: {
            especie,                               // cuál te acompaña ("dragon", "fenix"…)
            nombre: nombreDe(estado, especie),
            etapa: etapaSegun(ETAPAS_MASCOTA, totalMisiones),
            total: totalMisiones,
            triste: animo === "dormido" || animo === "caido",   // si te descuidas, se pone triste
        },
    };
}
