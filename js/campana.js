// campana.js — La campaña de jefes.
//
// Hay 4 campañas (una por atributo) con 5 jefes cada una, cada vez más fuertes.
// Cada jefe representa un obstáculo real (la pereza, el miedo, la codicia…).
//
// No se ataca a mano: el daño sale de cumplir tus objetivos en esa categoría.
//   - Misión diaria, tarea suelta o sesión de enfoque: poco daño (según su dificultad).
//   - Paso de una misión principal: mucho daño.
//   - Completar la misión principal entera: daño extra.
//
// Partida+: al vencer a los 5 jefes, la campaña vuelve a empezar (ronda 2, 3…)
// con los mismos jefes, pero más fuertes y con mejores premios.
//
// Robo de vida (v24): cuando fallas una misión, el jefe de su categoría te golpea y se
// queda con la vida que te quitó (ver vida.js). Se cura, pero nunca revive a un jefe vencido.
//
// Todo se CALCULA a partir de tu historial (como las rachas): si desmarcas una
// misión, el daño se descuenta solo y nada se desordena.
//
// Atados al mapa (v52): cada jefe vive en una región del mapa del reino (el 1.º de cada campaña en la
// región 1, el 2.º en la 2…). Mientras tu héroe no llegue a esa región, el jefe no recibe el daño:
// se GUARDA, y lo recibe todo junto el día que llegas. Los jefes que ya habías vencido antes de
// la v52 (estado.campana.libres) siguen vencidos, con la vida que tenían entonces (VIDAS_ANTES).
//
// Imágenes: obras de arte de dominio público (Wikimedia Commons), en jefes/.

import { hoy } from "./fechas.js";
import { robosDeJefes } from "./vida.js";
import { REGIONES, PASOS_POR_LUGAR, LUGARES_POR_REGION } from "./mapa.js";

export const DANO = {
    diaria: { facil: 4, normal: 8, dificil: 15 },
    paso: 40,        // cada paso (submisión) de una misión principal
    principal: 100,  // extra al completar toda la misión principal
};

// Vida de los jefes 1 a 5 de cada campaña (en la ronda 1). Subió en la v52 (antes: VIDAS_ANTES).
export const VIDAS = [150, 300, 500, 750, 1100];
export const VIDAS_ANTES = [80, 160, 260, 400, 600];

// En Partida+ cada ronda suma 50 % a la vida y a los premios:
// ronda 1 = ×1, ronda 2 = ×1,5, ronda 3 = ×2…
export const MEJORA_POR_RONDA = 0.5;

function multiplicador(ronda) {
    return 1 + MEJORA_POR_RONDA * (ronda - 1);
}

// Vida del jefe número "indice" (0 a 4) en esa ronda.
export function vidaJefe(indice, ronda = 1) {
    return Math.round(VIDAS[indice] * multiplicador(ronda));
}

// Vida del jefe que enfrentas después de vencer a "n" jefes de una categoría.
// libres: cuántos de esa campaña ya habías vencido antes de la v52 (esos usan la vida de antes).
function vidaDelJefe(n, libres = 0) {
    const ronda = Math.floor(n / VIDAS.length) + 1;
    const vidas = n < libres ? VIDAS_ANTES : VIDAS;
    return Math.round(vidas[n % VIDAS.length] * multiplicador(ronda));
}

// ===== Jefes y mapa (v52) =====

// En qué región del mapa vive el jefe número n de una campaña (0 = el primero, contando las rondas).
// Cada vuelta del mapa tiene 6 regiones: 5 con jefes y la Ciudadela (sin jefes).
export function regionDelJefe(n) {
    return Math.floor(n / VIDAS.length) * REGIONES.length + (n % VIDAS.length);
}

// (v53) Cuantos más jefes venzas, más rápido avanza tu héroe: cada jefe vencido suma +10 % a cada paso (máximo ×3).
// Cuenta a los jefes cuyo daño ya está completo, aunque todavía te esperen en su región (así el viaje más
// rápido te ayuda a llegar hasta ellos).
export const BONO_VIAJE_POR_JEFE = 0.1;
export const FACTOR_VIAJE_MAXIMO = 3;

export function jefesVencidos(estado) {
    const dano = danoPorCategoria(estado);
    let total = 0;
    for (const categoria of Object.keys(CAMPANAS)) {
        const libres = estado.campana?.libres?.[categoria] || 0;
        let restante = dano[categoria];
        let n = 0;
        while (restante >= vidaDelJefe(n, libres)) {
            restante -= vidaDelJefe(n, libres);
            n += 1;
        }
        total += n;
    }
    return total;
}

// Por cuánto se multiplican tus pasos en el mapa (1 = sin bono).
export function factorDeViaje(estado) {
    return Math.min(FACTOR_VIAJE_MAXIMO, 1 + BONO_VIAJE_POR_JEFE * jefesVencidos(estado));
}

// En qué región está tu héroe después de dar "pasos" pasos (ver mapa.posicion).
export function regionDelHeroe(pasos) {
    return Math.floor(Math.floor(pasos / PASOS_POR_LUGAR) / LUGARES_POR_REGION);
}

// Las fechas de todos tus pasos, ordenadas (cada misión, tarea o sesión de enfoque es un paso).
function fechasDePasos(estado) {
    return [
        ...estado.completadas.map((c) => c.fecha),
        ...estado.tareas.filter((t) => t.hechaEn).map((t) => t.hechaEn),
        ...estado.enfoque.sesiones.map((s) => s.fecha),
    ].map((f) => f || "").sort();
}

// Recompensa al derrotar al jefe número n de una categoría, contando todas las rondas
// (1 a 5 = ronda 1, 6 a 10 = ronda 2…): XP del atributo de la campaña y gemas 💎 (desde la v31;
// antes eran monedas: las monedas quedan solo para lo que haces en la vida real).
export function premioJefe(n) {
    const ronda = Math.floor((n - 1) / VIDAS.length) + 1;
    const numero = ((n - 1) % VIDAS.length) + 1;   // su puesto dentro de la ronda (1 a 5)
    const m = multiplicador(ronda);
    return { xp: Math.round(100 * numero * m), gemas: Math.round(50 * numero * m) };
}

export const CAMPANAS = {
    fuerza: {
        nombre: "Campaña del Cuerpo", lema: "Vence a la pereza y a las excusas.",
        jefes: [
            { id: "lobo", nombre: "El Lobo", titulo: "La Pereza",
              texto: "Te espera cómodo en la cama, disfrazado de descanso." },
            { id: "minotauro", nombre: "El Minotauro", titulo: "La Rutina sin Rumbo",
              texto: "Encerrado en su laberinto, te hace dar vueltas sin avanzar." },
            { id: "ciclope", nombre: "El Cíclope", titulo: "El Cansancio",
              texto: "Un solo ojo, siempre pesado, que te repite «mañana»." },
            { id: "coloso", nombre: "El Coloso", titulo: "Las Excusas",
              texto: "Un gigante que crece con cada «no tengo tiempo»." },
            { id: "leviatan", nombre: "Leviatán", titulo: "La Indisciplina",
              texto: "La bestia del caos. Solo la constancia la derrota." },
        ],
    },
    intelecto: {
        nombre: "Campaña de la Mente", lema: "Domina la distracción y la duda.",
        jefes: [
            { id: "medusa", nombre: "Medusa", titulo: "La Parálisis",
              texto: "Su mirada te congela: tanto pensar que nunca empiezas." },
            { id: "cerbero", nombre: "Cerbero", titulo: "La Procrastinación",
              texto: "Tres cabezas: «después», «luego» y «mañana»." },
            { id: "hidra", nombre: "La Hidra", titulo: "Las Distracciones",
              texto: "Cortas una cabeza y aparecen dos." },
            { id: "mefistofeles", nombre: "Mefistófeles", titulo: "Los Atajos",
              texto: "Te ofrece resultados sin esfuerzo, a cambio de todo." },
            { id: "dragon_rojo", nombre: "El Gran Dragón Rojo", titulo: "La Ignorancia",
              texto: "El enemigo final de la mente: no querer aprender." },
        ],
    },
    carisma: {
        nombre: "Campaña de la Voz", lema: "Supera el miedo y el ego.",
        jefes: [
            { id: "narciso", nombre: "Narciso", titulo: "El Ego",
              texto: "Tan enamorado de su reflejo que no escucha a nadie." },
            { id: "sirenas", nombre: "Las Sirenas", titulo: "El Qué Dirán",
              texto: "Cantan dudas para que cambies de rumbo." },
            { id: "circe", nombre: "Circe", titulo: "La Envidia",
              texto: "Envenena el agua cuando a otros les va bien." },
            { id: "pesadilla", nombre: "La Pesadilla", titulo: "El Miedo",
              texto: "Se sienta en tu pecho la noche antes de hablar en público." },
            { id: "satanas", nombre: "El Ángel Caído", titulo: "El Orgullo",
              texto: "Prefiere caer antes que pedir ayuda." },
        ],
    },
    riqueza: {
        nombre: "Campaña del Tesoro", lema: "Derrota a la deuda y a la codicia.",
        jefes: [
            { id: "recaudadores", nombre: "Los Recaudadores", titulo: "Las Deudas",
              texto: "Llevan la cuenta de cada gasto que no planeaste." },
            { id: "pluton", nombre: "Pluto", titulo: "El Gasto Impulsivo",
              texto: "El demonio de la riqueza que todo lo quiere ya." },
            { id: "fafner", nombre: "Fafner", titulo: "El Miedo a Invertir",
              texto: "Duerme sobre su oro y nunca lo hace crecer." },
            { id: "mammon", nombre: "Mammón", titulo: "La Codicia",
              texto: "Su trono se sostiene sobre los que aplasta." },
            { id: "gerion", nombre: "Gerión", titulo: "El Fraude",
              texto: "Rostro honesto, cola de escorpión. El último guardián del tesoro." },
        ],
    },
};

// Créditos de las obras (todas de dominio público, tomadas de Wikimedia Commons).
const COMMONS = "https://commons.wikimedia.org/wiki/File:";
export const CREDITOS = {
    lobo:         { obra: "Caperucita Roja", artista: "Gustave Doré", anio: "1862", archivo: "GustaveDore_She_was_astonished_to_see_how_her_grandmother_looked.jpg" },
    minotauro:    { obra: "El Minotauro", artista: "George Frederic Watts", anio: "1885", archivo: "George_Frederic_Watts_-_The_Minotaur_-_Google_Art_Project.jpg" },
    ciclope:      { obra: "El Cíclope", artista: "Odilon Redon", anio: "c. 1914", archivo: "Odilon_Redon_-_The_Cyclops,_c._1914.jpg" },
    coloso:       { obra: "El Coloso", artista: "Atribuido a Francisco de Goya", anio: "c. 1808–1812", archivo: "The_Colossus,_Francisco_de_Goya.jpg" },
    leviatan:     { obra: "La destrucción de Leviatán", artista: "Gustave Doré", anio: "1866", archivo: "122.The_Destruction_of_Leviathan.jpg" },
    medusa:       { obra: "Medusa", artista: "Caravaggio", anio: "c. 1598", archivo: "Medusa-Caravaggio_(Uffizi).jpg" },
    cerbero:      { obra: "Infierno, Canto VI: Cerbero", artista: "Gustave Doré", anio: "1861", archivo: "Inferno_Canto_6_-_Cerberus_(148618330)_(cropped).jpg" },
    hidra:        { obra: "Hércules y la Hidra de Lerna", artista: "Gustave Moreau", anio: "1875–1876", archivo: "Gustave_Moreau_-_Hercules_and_the_Lernaean_Hydra_-_1964.231_-_Art_Institute_of_Chicago.jpg" },
    mefistofeles: { obra: "Mefistófeles en el cielo (Fausto)", artista: "Eugène Delacroix", anio: "1828", archivo: "Eug%C3%A8ne_Delacroix_-_Mephistopheles_in_the_Sky_-_Google_Art_Project.jpg" },
    dragon_rojo:  { obra: "El Gran Dragón Rojo y la Mujer vestida de Sol", artista: "William Blake", anio: "c. 1803–1805", archivo: "Brooklyn_Museum_-_The_Great_Red_Dragon_and_the_Woman_Clothed_with_the_Sun_(Rev._12_1-4)_-_William_Blake.jpg" },
    narciso:      { obra: "Narciso", artista: "Caravaggio", anio: "c. 1597–1599", archivo: "Michelangelo_Merisi_da_Caravaggio_-_Narcissus_-_WGA04109.jpg" },
    sirenas:      { obra: "Ulises y las sirenas", artista: "John William Waterhouse", anio: "1891", archivo: "John_William_Waterhouse_-_Ulysses_and_the_Sirens_(1891).jpg" },
    circe:        { obra: "Circe Invidiosa", artista: "John William Waterhouse", anio: "1892", archivo: "J._W._Waterhouse_-_Circe_Invidiosa_-_Google_Art_Project.jpg" },
    pesadilla:    { obra: "La pesadilla", artista: "Henry Fuseli", anio: "1781", archivo: "John_Henry_Fuseli_-_The_NightmareFXD.jpg" },
    satanas:      { obra: "Satanás (El paraíso perdido)", artista: "Gustave Doré", anio: "1866", archivo: "GustaveDoreParadiseLostSatanProfile.jpg" },
    recaudadores: { obra: "Los recaudadores de impuestos", artista: "Según Marinus van Reymerswaele", anio: "s. XVI–XVII", archivo: "Marinus_Claeszoon_van_Reymerswaele_-_Tax_collectors_-_M.Ob.592_MNW_-_National_Museum_in_Warsaw.jpg" },
    pluton:       { obra: "Infierno, Canto VII: Pluto", artista: "Gustave Doré", anio: "1861", archivo: "Inferno_Canto_7_lines_8-9.jpg" },
    fafner:       { obra: "Fafner (Sigfrido y el ocaso de los dioses)", artista: "Arthur Rackham", anio: "1911", archivo: "Siegfried_and_the_Twilight_of_the_Gods_p_022.jpg" },
    mammon:       { obra: "Mammón", artista: "George Frederic Watts", anio: "1884–1885", archivo: "George_Frederic_Watts_(1817-1904)_-_Mammon_-_N01630_-_National_Gallery.jpg" },
    gerion:       { obra: "Infierno, Canto XVII: el vuelo de Gerión", artista: "Gustave Doré", anio: "c. 1880", archivo: "Gustave_Dor%C3%A9_-_Chant_17._Geryon%27s_Flight_(c._1880).jpg" },
};

export function fuenteDe(id) {
    return COMMONS + CREDITOS[id].archivo;
}

// (v95) Las versiones en pixel art de los jefes (app.js › pinturasEnPixel las pone aquí cuando están listas).
const enPixel = new Map();
export function ponerImagenPixel(id, direccion) {
    enPixel.set(id, direccion);
}

// La imagen del jefe: su versión en pixel art si ya está lista; si no, la pintura de siempre.
export function imagenDe(id) {
    return enPixel.get(id) || `jefes/${id}.jpg`;
}

// Cómo se ve el jefe según la vida que le queda.
export function estadoVisual(porcentaje) {
    if (porcentaje <= 0) return "derrotado";
    if (porcentaje < 30) return "agotado";
    if (porcentaje <= 60) return "herido";
    return "furioso";
}


// ===== Cálculos =====

// Cada golpe que le diste a cada campaña, con su fecha: { fuerza: [{ fecha, dano }, …], … }
function golpesConFecha(estado) {
    const golpes = {};
    for (const categoria of Object.keys(CAMPANAS)) golpes[categoria] = [];

    // Un golpe de algo hecho con cierta dificultad (como una misión diaria).
    // "factor": la misión clave pega el doble y un golpe crítico, 50 % más.
    const golpear = (atributo, fecha, dificultad, factor = 1) => {
        if (atributo in golpes) golpes[atributo].push({ fecha: fecha || "", dano: Math.round((DANO.diaria[dificultad] || DANO.diaria.normal) * factor) });
    };

    const dificultadDe = new Map(estado.misiones.map((m) => [m.id, m.dificultad]));
    for (const c of estado.completadas) {
        // La dificultad que tenía al completarla (los registros viejos no la guardaban).
        golpear(c.atributo, c.fecha, c.dificultad || dificultadDe.get(c.misionId), (c.clave ? 2 : 1) * (c.critico ? 1.5 : 1));
    }
    for (const t of estado.tareas) {
        if (t.premio) golpear(t.premio.atributo, t.hechaEn, t.premio.dificultad);   // tareas sueltas hechas
    }
    for (const s of estado.enfoque.sesiones) golpear(s.atributo, s.fecha, s.dificultad);
    for (const p of estado.principales) {
        if (!(p.atributo in golpes)) continue;
        // Los pasos viejos no guardaban su fecha: cuentan desde el principio.
        for (const s of p.submisiones.filter((s) => s.hecha)) golpes[p.atributo].push({ fecha: s.hechaEn || "", dano: DANO.paso });
        if (p.completadaEn) golpes[p.atributo].push({ fecha: p.completadaEn, dano: DANO.principal });
    }
    return golpes;
}

// Daño total que has hecho en cada categoría, sumando todo tu historial.
export function danoPorCategoria(estado) {
    const dano = {};
    for (const [categoria, lista] of Object.entries(golpesConFecha(estado))) {
        dano[categoria] = lista.reduce((suma, g) => suma + g.dano, 0);
    }
    return dano;
}

// Estado de cada campaña: qué jefe toca, en qué ronda, cuánta vida le queda y cuántos cayeron.
// Funciona como subir de nivel: el daño se va "gastando" jefe por jefe, en orden de fecha.
// Lo que te robó un jefe (al fallar) lo cura, pero solo hasta su vida llena: nunca revive
// a uno vencido. Después del 5.º jefe sigue el 1.º de la ronda siguiente (Partida+).
// fecha: hasta qué día contar los robos (hoy, salvo en el libro). robos: si ya los calculaste.
export function estadoCampanas(estado, fecha = hoy(), robos = robosDeJefes(estado, fecha)) {
    const golpes = golpesConFecha(estado);
    const pasos = fechasDePasos(estado);
    const factor = factorDeViaje(estado);   // (v53) los jefes vencidos aceleran el viaje
    const resultado = {};
    for (const [categoria, campana] of Object.entries(CAMPANAS)) {
        const libres = estado.campana?.libres?.[categoria] || 0;
        // ¿Puedes pelear con el jefe n habiendo dado "dados" pasos? (los de antes de la v52, siempre)
        const puedePelear = (n, dados) => n < libres || regionDelJefe(n) <= regionDelHeroe(Math.floor(dados * factor));
        const sucesos = [
            ...golpes[categoria].filter((g) => g.fecha <= fecha),
            ...robos.filter((r) => r.atributo === categoria && r.fecha <= fecha).map((r) => ({ fecha: r.fecha, cura: r.cantidad })),
        ];
        // Por fecha; el mismo día, primero tus golpes y después lo que te robaron.
        sucesos.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.cura ? 1 : 0) - (b.cura ? 1 : 0)));

        let restante = 0;     // el daño que lleva el jefe actual (si aún no llegas a su región, es el daño guardado)
        let derrotados = 0;
        let dano = 0;
        let curado = 0;
        let dados = 0;        // pasos dados hasta la fecha del suceso
        const avanzar = (hasta) => { while (dados < pasos.length && pasos[dados] <= hasta) dados += 1; };
        // Cae el jefe si tiene el daño suficiente Y tu héroe ya llegó a su región.
        const vencer = () => {
            while (restante >= vidaDelJefe(derrotados, libres) && puedePelear(derrotados, dados)) {
                restante -= vidaDelJefe(derrotados, libres);
                derrotados += 1;
            }
        };
        for (const suceso of sucesos) {
            avanzar(suceso.fecha);
            if (suceso.cura) {
                const cura = Math.min(suceso.cura, restante);   // no pasa de su vida llena
                restante -= cura;
                curado += cura;
                continue;
            }
            dano += suceso.dano;
            restante += suceso.dano;
            vencer();
        }
        avanzar(fecha);   // si llegaste a la región después del último golpe, el daño guardado se aplica ahora
        vencer();
        const ronda = Math.floor(derrotados / VIDAS.length) + 1;
        const indice = derrotados % VIDAS.length;
        const vidaMax = vidaDelJefe(derrotados, libres);
        const esperando = !puedePelear(derrotados, dados);   // su región está más adelante en el mapa
        const vida = esperando ? vidaMax : vidaMax - restante;
        resultado[categoria] = {
            categoria,
            campana,
            dano,                          // todo el daño que le hiciste a esta campaña
            curado,                        // lo que se curaron sus jefes con la vida que te robaron
            derrotados,                    // en total, sumando todas las rondas
            ronda,                         // 1 = la normal; 2 o más = Partida+
            indice,                        // 0 a 4: qué jefe de la ronda toca ahora
            jefe: campana.jefes[indice],
            vida,
            vidaMax,
            esperando,                     // true: aún no llegas a su región; el daño se le guarda
            guardado: esperando ? restante : 0,   // el daño guardado que recibirá al llegar
            region: regionDelJefe(derrotados),    // la región del mapa donde vive (0 = la primera)
            pasosHeroe: Math.floor(dados * factor),   // los pasos que llevas en el mapa (con el bono de viaje)
            porcentaje: Math.round((vida / vidaMax) * 1000) / 10,
        };
    }
    return resultado;
}

export function totalDerrotados(estado) {
    return Object.values(estadoCampanas(estado)).reduce((suma, c) => suma + c.derrotados, 0);
}
