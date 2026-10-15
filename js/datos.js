// datos.js — Guardar y cargar la partida.
//
// Todo se guarda en el iPhone con localStorage: un pequeño "cajón" del
// navegador donde se puede guardar texto. Guardamos el estado completo
// del juego convertido a texto JSON bajo una sola clave.
//
// Como los datos viven SOLO en el teléfono, también hay funciones
// para exportar e importar una copia de seguridad.

import { hoy } from "./fechas.js";

const CLAVE = "vida-rpg";


// Cómo es una partida nueva. Aquí puedes ver TODOS los datos que guarda la app.
export function estadoInicial() {
    return {
        version: 27,
        personaje: null,      // { nombre, xp, monedas, gemas, creadoEn }
                              //   monedas 🪙: de lo que haces en la vida real, para tus premios reales
                              //   gemas 💎 (v31): del arcade y los premios extra, para el arcade y las mascotas
        atributos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 }, // XP de cada atributo
        atributosPropios: [], // los tuyos: { id, nombre, icono, color, base (uno de los 4), creadoEn }
                              //   misiones, tareas, principales, sesiones y registros guardan "atributoPropio" (su id o null)

        misiones: [],         // diarias: { id, nombre, dificultad, atributo, dias, veces, meta, aviso, creadaEn, archivadaEn, pausas }
                              //   aviso: hora del aviso de esa misión ("18:00") o null
                              //   momento: "manana" | "tarde" | "noche" | null (para agruparlas en Hoy)
                              //   dias: días de la semana que toca (0 = lunes … 6 = domingo) o null = todos
                              //   veces: si es «N veces por semana», ese N (y dias = null); si no, null
                              //   diasMes: si toca ciertos días de cada mes, cuáles (1 … 31; ej: [5] o [1, 15]); si no, null
                              //   meta: { cantidad, unidad } si se cuenta (ej: 8 vasos); si no, null
        completadas: [],      // historial: { misionId, fecha, xp, monedas, atributo, dificultad }
        avances: {},          // misiones con cantidad: cuánto llevas hoy y ayer, { "id|fecha": 3 }
        fallas: [],           // «Fallé»: { misionId, fecha, motivo (ver juego.MOTIVOS_FALLA), golpe (lo que te pegó el jefe) }

        tareas: [],           // sueltas: { id, nombre, fecha (vence, o null = sin fecha), dificultad, atributo, creadaEn,
                              //   hechaEn, premio: { xp, monedas, atributo, dificultad } }
        enfoque: {            // modo enfoque (pomodoro)
            activo: null,     // la sesión en curso: { inicio (milisegundos), minutos, atributo }
            sesiones: [],     // terminadas: { fecha, minutos, atributo, dificultad, xp, monedas }
        },
        diario: {},           // { "2026-10-12": { animo (ver juego.ANIMOS_DIARIO) o null, texto, gratitud,
                              //   pregunta (la del día, si escribiste texto), premio: { xp, monedas, atributo } } }
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

        vida: {               // la vida del héroe (ver vida.js). Los puntos se CALCULAN, no se guardan.
            desde: null,      // el día en que empezó a contar (al crear el personaje o al actualizar a la v16)
            pociones: [],     // los días en que tomaste una poción: ["2026-10-12", …]
            avisadoHasta: null,   // hasta qué día ya te avisamos cuánta vida perdiste
        },
        descansos: [],        // modo descanso: { desde, hasta } (los dos días incluidos)
        // Armadura (ver equipo.js y vida.js). No se guarda cuánta tienes (se calcula), solo:
        //   desde   = el día en que empezó a contar (null = desde que empezó la vida)
        //   cambios = cuál era tu armadura máxima cada vez que cambió: [{ fecha, maxima }]
        armadura: { desde: null, cambios: [] },
        claves: {},           // misión clave de cada día: { "2026-10-13": idDeLaMision } (ver rituales.js)
        noches: [],           // días que cerraste con el ritual de la noche
        relampagos: {},       // desafío relámpago de cada día: { inicio, base, meta, minutos, cobradoEn } o { rechazado }
        cofres: {},           // cofre de cada día, con lo que salió: { tipo, cantidad, atributo, objeto, icono, texto }
        libros: { casio: { marca: 0, leidos: 0, fin: null } },   // (v62) el libro largo de Historia: por dónde vas y cuándo lo terminaste
        pergaminos: { leidos: {} },   // (v57) los pergaminos de la Biblioteca prohibida que ya leíste: { id: fecha }
        mapa: { reclamados: [],     // lugares del mapa cuyo premio ya reclamaste ("r1-5"…)
                cines: [] },        // (v56) las cinemáticas del reino, el arcade y la aldea que ya viste ("region-1", "senor-r1-7"…)
        pacto: null,          // tu Tratado de la Voluntad (ver pacto.js): { nombre, razon, firma (trazo SVG),
                              //   firmadoEn, primeraVez, renovaciones }

        avatar: {             // equipamiento del avatar (ver avatar.js)
            comprados: [],    // ids de objetos comprados en la tienda
            equipado: { cabeza: null, pecho: null, mano: null, espalda: null, fondo: null },   // pecho: desde la v34
        },
        mascota: {           // tus mascotas (ver mascota.js)
            nombre: "Chispa", // el nombre del dragón, tu primera mascota
            comidas: [],      // los días en que comió la que te acompañaba
            activa: "dragon", // la que te acompaña
            adoptadas: {},    // las que adoptaste en la Tienda: { fenix: { nombre, desde (fecha) } }
        },
        arcade: { usadas: 0, records: {}, torre: null, mazmorra: null, extra: 0, bestiario: {}, bazar: [], despertar: false, retos: {} },   // fichas gastadas, mejor
                                              //   puntaje de cada minijuego (records.torre y records.mazmorra = pisos superados),
                                              //   la partida de la Torre y la de la Mazmorra en curso (ver torre.js) o null,
                                              //   fichas de cofres y lo que sabes de cada criatura (ver bestiario.js):
                                              //   { esqueleto: { vencidos: 3, elementos: ["fuego"] } }
                                              //   despertar (v38): si ya se te contó que la Torre despertó
                                              //   bazar: las provisiones compradas para la próxima partida ("pocion"…)
                                              //   retos (v40): el reto del día de cada fecha { tipo, meta, mejor, cobradoEn } (ver retos.js)
        campana: { recompensados: {},         // cuántos jefes de cada categoría ya dieron su premio
                   libres: {} },              // (v52) los que ya estaban vencidos antes de atar los jefes al mapa
        maestro: { leidas: 0 },               // cuántos capítulos de las memorias de Aurelio ya leíste (ver memorias.js)
        // Cómo se ve tu avatar (las opciones están en avatar.js → APARIENCIA).
        apariencia: { cuerpo: "masculino", piel: "media", rostro: "sereno", ojos: "cafe",
                      pelo: "castano", peinado: "corto", barba: "ninguna", traje: "clase" },
        // Sonido, golpe con timing, eventos del día y música de fondo (pista elegida y volumen de 0 a 1).
        ajustes: { sonido: true, golpe: true, eventos: true, musica: true, pista: "epica", volumen: 0.6, cinematicas: true, esencial: false, esencialAlAbrir: true,
                   animo: "bien", preguntarAnimo: true,
                   musicaAuto: true },   // (v58) la música cambia según la escena (lectura, diario, mapa, Mazmorra)   // (v49) cómo te sientes hoy: "mal" | "normal" | "bien" (decide el menú)
        avisos: {                             // notificaciones (ver avisos.js)
            horarios: [],                     // recordatorios: { id, hora: "20:00", dias (como en misiones) }
            enfoque: true,                    // avisar cuando termine una sesión de enfoque
        },

        ultimaVisita: null,   // último día que abriste la app (para el bonus de regreso)
        ultimoAvisoEscudo: null,
        ultimoRespaldo: null,
        semanaVista: null,    // lunes de la semana en que cerraste la tarjeta «Tu semana»
        voces: {              // Las Voces del Valle (v44; ver voces.js): la aventura de diálogos de Carisma
            escena: null,     //   la conversación en curso: { id, nodo, fecha, confianza, marcas, historial, reaccion } o null
            hechas: {},       //   las que ya viviste: { "maren-1": { fin: "bien" | "regular", fecha } } (guarda el mejor final)
            fallos: {},       //   las que salieron mal: { "maren-1": "2026-10-14" } (se puede volver al día siguiente)
            ultima: {},       //   la última vez que hablaste con cada persona: { maren: "2026-10-14" }
            tareas: {},       //   las lecciones que ya convertiste en tarea: { "maren-1": true }
            epilogo: null,    //   el día en que recuperaste la última voz y se contó el epílogo de la aldea (v45), o null
        },
        revisiones: {},       // revisión semanal (v39), por el lunes de la semana revisada:
                              //   { "2026-10-05": { bien, mejorar, foco (ids de misiones, máx. 3), hechaEn } }
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
        // Las gemas llegaron en la v31: las partidas de antes empiezan sin gemas.
        personaje: guardado.personaje ? { ...guardado.personaje, gemas: guardado.personaje.gemas || 0 } : null,
        atributos: { ...base.atributos, ...guardado.atributos },
        avances: { ...guardado.avances },
        enfoque: {
            activo: guardado.enfoque?.activo || null,
            sesiones: guardado.enfoque?.sesiones || [],
        },
        diario: { ...guardado.diario },
        revisiones: { ...guardado.revisiones },
        voces: {
            escena: guardado.voces?.escena || null,
            hechas: { ...guardado.voces?.hechas },
            fallos: { ...guardado.voces?.fallos },
            ultima: { ...guardado.voces?.ultima },
            tareas: { ...guardado.voces?.tareas },
            epilogo: guardado.voces?.epilogo || null,
        },
        avatar: {
            comprados: avatar.comprados || [],
            equipado: { ...base.avatar.equipado, ...avatar.equipado },
        },
        mascota: { ...base.mascota, ...guardado.mascota, adoptadas: { ...guardado.mascota?.adoptadas } },
        pergaminos: { leidos: { ...guardado.pergaminos?.leidos } },
        libros: { casio: { ...base.libros.casio, ...guardado.libros?.casio } },
        mapa: { reclamados: guardado.mapa?.reclamados || [], cines: guardado.mapa?.cines || [] },
        arcade: {
            usadas: guardado.arcade?.usadas || 0,
            records: { ...guardado.arcade?.records },
            torre: guardado.arcade?.torre || null,
            mazmorra: guardado.arcade?.mazmorra || null,
            extra: guardado.arcade?.extra || 0,
            bestiario: { ...guardado.arcade?.bestiario },
            bazar: guardado.arcade?.bazar || [],
            despertar: guardado.arcade?.despertar || false,
            retos: { ...guardado.arcade?.retos },
        },
        campana: {
            recompensados: { ...guardado.campana?.recompensados },
            // (v52) Los jefes atados al mapa: los que ya habías vencido antes (= los premios entregados) siguen vencidos.
            libres: (guardado.version || 0) < 27 ? { ...guardado.campana?.recompensados } : { ...guardado.campana?.libres },
        },
        maestro: { leidas: guardado.maestro?.leidas || 0 },
        // La vida empieza a contar el día en que llega esta versión: no castiga el pasado.
        vida: {
            desde: guardado.vida?.desde || (guardado.personaje ? hoy() : null),
            pociones: guardado.vida?.pociones || [],
            avisadoHasta: guardado.vida?.avisadoHasta || null,
        },
        // La armadura y el robo de vida (v24) empiezan a contar el día en que llega esta versión:
        // no cambian lo que ya pasó.
        armadura: {
            desde: guardado.armadura ? guardado.armadura.desde || null : (guardado.personaje ? hoy() : null),
            cambios: guardado.armadura?.cambios || [],
        },
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
