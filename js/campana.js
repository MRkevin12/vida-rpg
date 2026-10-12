// campana.js — La campaña de jefes.
//
// Hay 4 campañas (una por atributo) con 5 jefes cada una, cada vez más fuertes.
// Cada jefe representa un obstáculo real (la pereza, el miedo, la codicia…).
//
// No se ataca a mano: el daño sale de cumplir tus objetivos en esa categoría.
//   - Misión diaria: poco daño (según su dificultad).
//   - Paso de una misión principal: mucho daño.
//   - Completar la misión principal entera: daño extra.
//
// Todo se CALCULA a partir de tu historial (como las rachas): si desmarcas una
// misión, el daño se descuenta solo y nada se desordena.
//
// Imágenes: obras de arte de dominio público (Wikimedia Commons), en jefes/.

export const DANO = {
    diaria: { facil: 4, normal: 8, dificil: 15 },
    paso: 40,        // cada paso (submisión) de una misión principal
    principal: 100,  // extra al completar toda la misión principal
};

// Vida de los jefes 1 a 5 de cada campaña.
export const VIDAS = [80, 160, 260, 400, 600];

// Recompensa al derrotar al jefe número n (1 a 5): XP del atributo de la campaña y monedas.
export function premioJefe(numero) {
    return { xp: 100 * numero, monedas: 50 * numero };
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

export function imagenDe(id) {
    return `jefes/${id}.jpg`;
}

// Cómo se ve el jefe según la vida que le queda.
export function estadoVisual(porcentaje) {
    if (porcentaje <= 0) return "derrotado";
    if (porcentaje < 30) return "agotado";
    if (porcentaje <= 60) return "herido";
    return "furioso";
}


// ===== Cálculos =====

// Daño total que has hecho en cada categoría, sumando todo tu historial.
export function danoPorCategoria(estado) {
    const dano = {};
    for (const categoria of Object.keys(CAMPANAS)) dano[categoria] = 0;

    const dificultadDe = new Map(estado.misiones.map((m) => [m.id, m.dificultad]));
    for (const c of estado.completadas) {
        if (!(c.atributo in dano)) continue;
        const dificultad = dificultadDe.get(c.misionId) || "normal";
        dano[c.atributo] += DANO.diaria[dificultad] || DANO.diaria.normal;
    }
    for (const p of estado.principales) {
        if (!(p.atributo in dano)) continue;
        const pasos = p.submisiones.filter((s) => s.hecha).length;
        dano[p.atributo] += pasos * DANO.paso + (p.completadaEn ? DANO.principal : 0);
    }
    return dano;
}

// Estado de cada campaña: qué jefe toca, cuánta vida le queda y cuántos cayeron.
// Funciona como subir de nivel: el daño se va "gastando" jefe por jefe.
export function estadoCampanas(estado) {
    const dano = danoPorCategoria(estado);
    const resultado = {};
    for (const [categoria, campana] of Object.entries(CAMPANAS)) {
        let restante = dano[categoria];
        let indice = 0;
        while (indice < VIDAS.length && restante >= VIDAS[indice]) {
            restante -= VIDAS[indice];
            indice += 1;
        }
        const completa = indice >= VIDAS.length;
        const vidaMax = completa ? 0 : VIDAS[indice];
        const vida = completa ? 0 : vidaMax - restante;
        resultado[categoria] = {
            categoria,
            campana,
            dano: dano[categoria],
            derrotados: indice,
            completa,
            indice,                                    // 0 a 4 (o 5 si ya ganaste todo)
            jefe: completa ? null : campana.jefes[indice],
            vida,
            vidaMax,
            porcentaje: completa ? 0 : Math.round((vida / vidaMax) * 1000) / 10,
        };
    }
    return resultado;
}

export function totalDerrotados(estado) {
    return Object.values(estadoCampanas(estado)).reduce((suma, c) => suma + c.derrotados, 0);
}
