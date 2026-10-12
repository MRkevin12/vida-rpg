// datos.js — Guardar y cargar la partida.
//
// Todo se guarda en el iPhone con localStorage: un pequeño "cajón" del
// navegador donde se puede guardar texto. Guardamos el estado completo
// del juego convertido a texto JSON bajo una sola clave.
//
// Como los datos viven SOLO en el teléfono, también hay funciones
// para exportar e importar una copia de seguridad.

const CLAVE = "vida-rpg";


// Cómo es una partida nueva. Aquí puedes ver TODOS los datos que guarda la app.
export function estadoInicial() {
    return {
        version: 1,
        personaje: null,      // { nombre, xp, monedas, creadoEn }
        atributos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 }, // XP de cada atributo

        misiones: [],         // diarias: { id, nombre, dificultad, atributo, creadaEn, archivadaEn }
        completadas: [],      // historial: { misionId, fecha, xp, monedas, atributo }

        principales: [],      // { id, nombre, atributo, creadaEn, completadaEn, archivada,
                              //   submisiones: [{ id, nombre, hecha }] }
        jefes: [],            // { id, nombre, atributo, vidaMax, golpes: [{ fecha, dano }],
                              //   creadoEn, derrotadoEn, archivado }

        logros: [],           // { id, nombre, tipo, objetivo, misionId, atributo, recompensa,
                              //   creadoEn, desbloqueadoEn }
        recompensas: [],      // tienda: { id, nombre, costo }
        canjes: [],           // historial de la tienda: { nombre, costo, fecha }
        bonos: [],            // bonus de regreso recibidos: { fecha, dias, xp }

        avatar: {             // equipamiento del avatar (ver avatar.js)
            comprados: [],    // ids de objetos comprados en la tienda
            equipado: { cabeza: null, mano: null, espalda: null, fondo: null },
        },
        mascota: { nombre: "Chispa" },
        arcade: { usadas: 0, records: {} },   // fichas gastadas y mejor puntaje de cada minijuego
        campana: { recompensados: {} },       // cuántos jefes de cada categoría ya dieron su premio

        ultimaVisita: null,   // último día que abriste la app (para el bonus de regreso)
        ultimoAvisoEscudo: null,
        ultimoRespaldo: null,
        siguienteId: 1,       // contador para darle un id único a cada cosa nueva
    };
}

// Rellena lo que falte (por si el respaldo es de una versión más vieja de la app).
function completar(guardado) {
    const base = estadoInicial();
    const avatar = guardado.avatar || {};
    return {
        ...base,
        ...guardado,
        atributos: { ...base.atributos, ...guardado.atributos },
        avatar: {
            comprados: avatar.comprados || [],
            equipado: { ...base.avatar.equipado, ...avatar.equipado },
        },
        mascota: { ...base.mascota, ...guardado.mascota },
        arcade: {
            usadas: guardado.arcade?.usadas || 0,
            records: { ...guardado.arcade?.records },
        },
        campana: { recompensados: { ...guardado.campana?.recompensados } },
    };
}

// Lee la partida guardada. Si no hay ninguna, empieza una nueva.
export function cargar() {
    let texto = null;
    try {
        texto = localStorage.getItem(CLAVE);
        return texto ? completar(JSON.parse(texto)) : estadoInicial();
    } catch (error) {
        // Si el texto guardado está dañado, lo apartamos con otro nombre
        // (para no perderlo) y empezamos de cero.
        try {
            if (texto) localStorage.setItem(`${CLAVE}-danado-${Date.now()}`, texto);
        } catch { /* sin espacio: no podemos hacer más */ }
        return estadoInicial();
    }
}

// Guarda la partida. Se llama después de cada cambio.
export function guardar(estado) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (error) {
        alert("No se pudo guardar tu progreso en este dispositivo. Haz una copia de seguridad desde Ajustes.");
    }
}

// Borra la partida por completo.
export function borrarTodo() {
    localStorage.removeItem(CLAVE);
}

// Convierte la partida en texto para la copia de seguridad.
export function textoRespaldo(estado) {
    return JSON.stringify(estado, null, 2);
}

// Lee el texto de una copia de seguridad y comprueba que sea válida.
export function desdeRespaldo(texto) {
    let datos;
    try {
        datos = JSON.parse(texto);
    } catch {
        throw new Error("Ese archivo no es una copia de seguridad válida.");
    }
    if (!datos || typeof datos !== "object" || !datos.personaje || !Array.isArray(datos.misiones)) {
        throw new Error("Ese archivo no parece una copia de seguridad de Vida RPG.");
    }
    return completar(datos);
}

// Le pide al sistema que no borre nuestros datos para liberar espacio.
export function pedirAlmacenamientoPersistente() {
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(() => {});
    }
}
