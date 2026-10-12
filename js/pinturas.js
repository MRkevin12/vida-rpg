// pinturas.js — Las pinturas que se usan como fondos y escenarios.
//
// Son obras clásicas de DOMINIO PÚBLICO (o CC0), tomadas de Wikimedia Commons,
// recortadas y comprimidas en la carpeta fondos/ (así funcionan sin internet).
// Igual que los retratos de los jefes (campana.js), su autor y su fuente
// se muestran en Ajustes → Créditos de las imágenes.

const COMMONS = "https://commons.wikimedia.org/wiki/File:";

export const PINTURAS = {
    // Fondos del avatar: uno por etapa…
    aldea:     { obra: "La carreta de heno", artista: "John Constable", anio: "1821",
                 archivo: "John Constable - The Hay Wain (1821).jpg" },
    camino:    { obra: "La avenida de Middelharnis", artista: "Meindert Hobbema", anio: "1689",
                 archivo: "Meindert Hobbema 001.jpg" },
    fortaleza: { obra: "La partida", artista: "Thomas Cole", anio: "1837",
                 archivo: "Thomas Cole, The Departure, 1837, NGA 166439.jpg" },
    cumbre:    { obra: "Entre la Sierra Nevada, California", artista: "Albert Bierstadt", anio: "1868",
                 archivo: "Albert Bierstadt - Among the Sierra Nevada, California - Google Art Project.jpg" },
    // …y los que se compran o se ganan.
    bosque:    { obra: "Mañana en un bosque de pinos", artista: "Iván Shishkin y Konstantín Savitski", anio: "1889",
                 archivo: "Shishkin, Ivan - Morning in a Pine Forest.jpg" },
    castillo:  { obra: "Proyecto del castillo de Neuschwanstein", artista: "Christian Jank", anio: "1869",
                 archivo: "Christian Jank - Entwurf von Schloss Neuschwanstein 1869 restored.jpg" },
    galaxia:   { obra: "La noche estrellada", artista: "Vincent van Gogh", anio: "1889",
                 archivo: "Van Gogh - Starry Night - Google Art Project.jpg" },
    salon:     { obra: "Interior del Panteón de Roma", artista: "Giovanni Paolo Panini", anio: "c. 1734",
                 archivo: "Giovanni Paolo Panini, Interior of the Pantheon, Rome, c. 1734, NGA 165.jpg" },
    // Escenarios de batalla de cada campaña.
    "escena-fuerza":    { obra: "Tormenta de nieve: Aníbal cruzando los Alpes", artista: "J. M. W. Turner", anio: "1812",
                          archivo: "Joseph Mallord William Turner 081.jpg" },
    "escena-intelecto": { obra: "Proyecto para la Gran Galería del Louvre", artista: "Hubert Robert", anio: "1796",
                          archivo: "Hubert Robert, Project for the Transformation of the Grande Galerie of the Louvre, 1796.jpg" },
    "escena-carisma":   { obra: "Fiesta musical en el Teatro Argentina de Roma", artista: "Giovanni Paolo Panini", anio: "1747",
                          archivo: "Fête musicale donnée par le cardinal de La Rochefoucauld au théâtre Argentina de Rome en 1747 - Paolo Panini - Musée du Louvre Peintures INV 414.jpg" },
    "escena-riqueza":   { obra: "Interior de una iglesia gótica de noche", artista: "Pieter Neefs el Viejo", anio: "1636",
                          archivo: "Pieter Neefs I - The Interior of a Gothic Church by Night.jpeg" },
    // La Torre del héroe (minijuego).
    torre:     { obra: "El puente levadizo (Cárceles imaginarias, lámina VII)", artista: "Giovanni Battista Piranesi", anio: "c. 1745",
                 archivo: "Giovanni Battista Piranesi - The Drawbridge, plate VII from the series Carceri d'Invenzione - Google Art Project.jpg" },
};

// La imagen recortada que usa la app.
export function rutaPintura(id) {
    return `fondos/${id}.jpg`;
}

// La página de la obra en Wikimedia Commons.
export function fuentePintura(id) {
    return COMMONS + encodeURIComponent(PINTURAS[id].archivo.replace(/ /g, "_"));
}
