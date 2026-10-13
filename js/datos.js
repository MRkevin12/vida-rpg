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
        version: 3,
        personaje: null,      // { nombre, xp, monedas, creadoEn }
        atributos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 }, // XP de cada atributo

        misiones: [],         // diarias: { id, nombre, dificultad, atributo, dias, veces, meta, aviso, creadaEn, archivadaEn, pausas }
                              //   aviso: hora del aviso de esa misión ("18:00") o null
                              //   momento: "manana" | "tarde" | "noche" | null (para agruparlas en Hoy)
                              //   dias: días de la semana que toca (0 = lunes … 6 = domingo) o null = todos
                              //   veces: si es «N veces por semana», ese N (y dias = null); si no, null
                              //   meta: { cantidad, unidad } si se cuenta (ej: 8 vasos); si no, null
        completadas: [],      // historial: { misionId, fecha, xp, monedas, atributo, dificultad }
        avances: {},          // misiones con cantidad: cuánto llevas hoy y ayer, { "id|fecha": 3 }

        tareas: [],           // sueltas: { id, nombre, fecha (vence, o null = sin fecha), dificultad, atributo, creadaEn,
                              //   hechaEn, premio: { xp, monedas, atributo, dificultad } }
        enfoque: {            // modo enfoque (pomodoro)
            activo: null,     // la sesión en curso: { inicio (milisegundos), minutos, atributo }
            sesiones: [],     // terminadas: { fecha, minutos, atributo, dificultad, xp, monedas }
        },
        diario: {},           // { "2026-10-12": { animo: "bien" | "normal" | "mal" | null, texto } }
        desafios: [],         // desafío de cada semana: { semana (su lunes), tipo, meta, cobradoEn }

        principales: [],      // { id, nombre, atributo, creadaEn, completadaEn, archivada,
                              //   submisiones: [{ id, nombre, hecha, hechaEn }] }
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
        arcade: { usadas: 0, records: {}, torre: null },   // fichas gastadas, mejor puntaje de cada minijuego
                                              //   y la partida de la Torre en curso (ver torre.js), o null
        campana: { recompensados: {} },       // cuántos jefes de cada categoría ya dieron su premio
        // Cómo se ve tu avatar (las opciones están en avatar.js → APARIENCIA).
        apariencia: { cuerpo: "masculino", piel: "media", rostro: "sereno", ojos: "cafe",
                      pelo: "castano", peinado: "corto", barba: "ninguna", traje: "clase" },
        ajustes: { sonido: true },            // preferencias de la app
        avisos: {                             // notificaciones (ver avisos.js)
            horarios: [],                     // recordatorios: { id, hora: "20:00", dias (como en misiones) }
            enfoque: true,                    // avisar cuando termine una sesión de enfoque
        },

        ultimaVisita: null,   // último día que abriste la app (para el bonus de regreso)
        ultimoAvisoEscudo: null,
        ultimoRespaldo: null,
        semanaVista: null,    // lunes de la semana en que cerraste la tarjeta «Tu semana»
        siguienteId: 1,       // contador para darle un id único a cada cosa nueva
    };
}

// Rellena lo que falte (por si el respaldo es de una versión más vieja de la app).
// Las listas nuevas (tareas, desafíos…) ya vienen vacías en "base".
function completar(guardado) {
    const base = estadoInicial();
    const avatar = guardado.avatar || {};
    return {
        ...base,
        ...guardado,
        version: base.version,
        atributos: { ...base.atributos, ...guardado.atributos },
        avances: { ...guardado.avances },
        enfoque: {
            activo: guardado.enfoque?.activo || null,
            sesiones: guardado.enfoque?.sesiones || [],
        },
        diario: { ...guardado.diario },
        avatar: {
            comprados: avatar.comprados || [],
            equipado: { ...base.avatar.equipado, ...avatar.equipado },
        },
        mascota: { ...base.mascota, ...guardado.mascota },
        arcade: {
            usadas: guardado.arcade?.usadas || 0,
            records: { ...guardado.arcade?.records },
            torre: guardado.arcade?.torre || null,
        },
        campana: { recompensados: { ...guardado.campana?.recompensados } },
        apariencia: { ...base.apariencia, ...guardado.apariencia },
        ajustes: { ...base.ajustes, ...guardado.ajustes },
        avisos: { ...base.avisos, ...guardado.avisos },
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
