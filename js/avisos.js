// avisos.js — Notificaciones: recordatorios a tus horas y aviso al terminar el enfoque.
//
// Cómo funciona (ver también servidor/worker.js y sw.js):
//   1. Al activarlas, el iPhone crea una "suscripción" (una dirección para recibir avisos)
//      y la mandamos al servidor de avisos junto con tus horarios.
//   2. A cada hora programada, el servidor manda un aviso que solo dice su tipo
//      ("recordatorio" o "enfoque"). Ningún dato de tu partida sale del teléfono.
//   3. sw.js lo recibe y muestra el texto que esta app dejó preparado en el teléfono
//      (el "resumen para avisos": qué te falta cada día de la próxima semana).
//
// En el iPhone solo funciona con la app instalada en la pantalla de inicio (iOS 16.4 o más).

import * as juego from "./juego.js";
import * as vida from "./vida.js";
import { preguntaDelDia } from "./diario.js";
import { sumarDias, aTexto, lunesDe } from "./fechas.js";

// La dirección del servidor y su llave pública. Ninguna de las dos es secreta.
// En la compu (localhost) se usa el servidor de prueba: "npm run local" en la carpeta servidor/.
const EN_LA_COMPU = ["localhost", "127.0.0.1"].includes(location.hostname);
export const SERVIDOR = EN_LA_COMPU ? "http://127.0.0.1:8787" : "https://vida-rpg-avisos.vida-rpg-avisos.workers.dev";
const LLAVE_PUBLICA = "BIsttFvwAePACNPckoefvwwuDeAIVPPOna0-aoFU5n4sxvvvahQRZasy4jlHHwiA9JB0s8qw_cNnpZuQZV34wKA";

// El código de activación se guarda aparte de la partida (como el PIN): no va en las copias.
const CLAVE_CODIGO = "vida-rpg-avisos";
// Caché donde sw.js lee el resumen (su nombre NO empieza con "vida-rpg-v": sw.js no la borra).
const CACHE = "avisos-datos";
const ARCHIVO_RESUMEN = "./avisos-resumen.json";


// ===== ¿Se puede usar aquí? =====

export function compatible() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function esIphone() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// ¿Se abrió desde el ícono de la pantalla de inicio (y no en una pestaña del navegador)?
export function instalada() {
    return navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
}

export function codigo() {
    try {
        return localStorage.getItem(CLAVE_CODIGO) || "";
    } catch {
        return "";
    }
}

// ¿Están activadas en este teléfono? (hay código, permiso y suscripción)
export async function activadas(registro) {
    if (!codigo() || !registro || !compatible() || Notification.permission !== "granted") return false;
    return Boolean(await registro.pushManager.getSubscription());
}


// ===== Hablar con el servidor =====

async function pedir(ruta, datos) {
    let respuesta;
    try {
        respuesta = await fetch(SERVIDOR + ruta, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo: codigo(), ...datos }),
        });
    } catch {
        throw new Error("No hay conexión con el servidor de avisos. Revisa tu internet.");
    }
    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(resultado.error || "El servidor de avisos no respondió bien.");
    return resultado;
}

// Los avisos de cada misión, como los necesita el servidor: solo el número de la misión
// (nunca su nombre), su hora, sus días y hasta qué fecha NO hace falta avisar:
//   - si ya la hiciste hoy: hasta hoy;
//   - si es semanal y ya cumpliste las veces de la semana: hasta el domingo.
export function avisosDeMisiones(estado, hoy) {
    return estado.misiones.filter((m) => m.aviso && !m.archivadaEn).map((m) => {
        let saltarHasta = null;
        if (m.veces && juego.vecesEnSemana(estado.completadas, m.id, hoy) >= m.veces) {
            saltarHasta = sumarDias(lunesDe(hoy), 6);
        } else if (estado.completadas.some((c) => c.misionId === m.id && c.fecha === hoy) || juego.fallaDe(estado, m.id, hoy)) {
            saltarHasta = hoy;   // ya la hiciste (o ya dijiste que fallaste)
        }
        return { id: m.id, hora: m.aviso, dias: m.veces ? null : m.dias, saltarHasta };
    });
}

// Lo que el servidor necesita saber de tus ajustes.
function configuracion(estado) {
    const hoy = aTexto(new Date());
    return {
        horarios: estado.avisos.horarios.map(({ hora, dias }) => ({ hora, dias })),
        misiones: avisosDeMisiones(estado, hoy),
        zona: Intl.DateTimeFormat().resolvedOptions().timeZone,   // ej: "America/Bogota"
        avisarEnfoque: estado.avisos.enfoque,
        // En modo descanso no llegan recordatorios hasta ese día (incluido).
        descansoHasta: juego.descansoDe(estado, hoy)?.hasta || null,
    };
}

// Activar. Hay que llamarla directo desde un toque: el iPhone solo pide permiso así.
export async function activar(registro, codigoEscrito, estado) {
    const limpio = String(codigoEscrito || "").trim().toUpperCase();
    if (!limpio) throw new Error("Escribe el código de activación.");
    // Lo primero (sin esperar nada antes): la ventana de permiso del iPhone.
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") throw new Error("Sin tu permiso, el iPhone no deja mostrar notificaciones.");

    const suscripcion = await registro.pushManager
        .subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(LLAVE_PUBLICA) })
        .catch(() => { throw new Error("El teléfono no dejó activar los avisos. Abre la app desde su ícono e intenta otra vez."); });
    localStorage.setItem(CLAVE_CODIGO, limpio);
    try {
        await pedir("/guardar", { suscripcion: suscripcion.toJSON(), ...configuracion(estado) });
    } catch (error) {
        localStorage.removeItem(CLAVE_CODIGO);   // código malo o sin internet: queda como antes
        throw error;
    }
}

// Volver a mandar tus ajustes al servidor. app.js la llama después de cada cambio
// con siCambio = true: así solo se envían cuando algo cambió de verdad (por ejemplo,
// al marcar una misión que tiene aviso). Si no hay internet, se reintenta en el próximo cambio.
// Aunque nada cambie, cada 30 minutos (si usas la app) se vuelve a mandar: así, si el servidor
// perdió tu suscripción, se repara sola.
let ultimoEnviado = null;
let ultimoEnvio = 0;
const REENVIAR_CADA = 30 * 60 * 1000;

export async function sincronizar(registro, estado, { siCambio = false } = {}) {
    if (!codigo()) return;   // no están activadas en este teléfono
    const suscripcion = await registro?.pushManager.getSubscription();
    if (!suscripcion) return;
    const config = configuracion(estado);
    const texto = JSON.stringify(config);
    if (siCambio && texto === ultimoEnviado && Date.now() - ultimoEnvio < REENVIAR_CADA) return;
    await pedir("/guardar", { suscripcion: suscripcion.toJSON(), ...config });
    ultimoEnviado = texto;
    ultimoEnvio = Date.now();
}

// ¿Siguen funcionando en este teléfono? Si nunca las activaste: null (no hay problema).
//   "bloqueadas"  = el iPhone ya no da permiso (se arregla en los Ajustes del iPhone);
//   "desconectadas" = el iPhone perdió la suscripción (se arregla con «Reactivar»).
export async function problema() {
    if (!codigo() || !compatible() || !instalada()) return null;
    if (Notification.permission === "denied") return "bloqueadas";
    if (Notification.permission !== "granted") return "desconectadas";
    const registro = await navigator.serviceWorker.ready;
    return (await registro.pushManager.getSubscription()) ? null : "desconectadas";
}

// Reactivar con el código que ya estaba guardado (hay que llamarla desde un toque).
export function reactivar(registro, estado) {
    return activar(registro, codigo(), estado);
}

// Empezaste (fin = milisegundos) o cancelaste (fin = null) una sesión de enfoque.
// Si no hay internet en ese momento, no pasa nada: el premio igual llega al abrir la app.
export function avisarEnfoque(fin) {
    if (!codigo()) return;
    pedir("/enfoque", { fin }).catch(() => {});
}

export function probar() {
    return pedir("/probar", {});
}

export async function desactivar(registro) {
    await pedir("/desactivar", {}).catch(() => {});
    const suscripcion = await registro?.pushManager.getSubscription();
    await suscripcion?.unsubscribe();
    localStorage.removeItem(CLAVE_CODIGO);
}

// base64url -> bytes (así pide la llave el iPhone)
function aBytes(base64url) {
    const normal = base64url.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(normal + "=".repeat((4 - (normal.length % 4)) % 4)), (letra) => letra.charCodeAt(0));
}


// ===== El resumen para avisos =====
// Para cada día de la próxima semana, el texto que mostrará la notificación.
// Se vuelve a calcular cada vez que cambia tu partida, así que el de hoy siempre está al día.
// Los días que vienen dicen todo lo que toca (todavía no has hecho nada de esos días).

function lista(nombres) {
    return nombres.length <= 3 ? nombres.join(" · ") : `${nombres.slice(0, 3).join(" · ")} y ${nombres.length - 3} más`;
}

export function resumenParaAvisos(estado, hoy) {
    const racha = juego.calcularRacha(estado, hoy).actual;
    const salud = vida.calcularVida(estado, hoy);
    const dias = {};
    for (let i = 0; i < 7; i++) {
        const fecha = sumarDias(hoy, i);
        const hechas = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));
        const misiones = juego.misionesDelDia(estado.misiones, fecha)
            .filter((m) => !hechas.has(m.id) && !juego.fallaDe(estado, m.id, fecha)).map((m) => m.nombre);
        const semanales = juego.semanalesDelDia(estado.misiones, fecha)
            .filter((m) => !hechas.has(m.id) && juego.vecesEnSemana(estado.completadas, m.id, fecha) < m.veces)
            .map((m) => m.nombre);
        const tareas = estado.tareas.filter((t) => !t.hechaEn && (!t.fecha || t.fecha <= fecha)).map((t) => t.nombre);

        let titulo;
        const lineas = [];
        if (misiones.length) {
            titulo = misiones.length === 1 ? "⚔️ Te falta 1 misión" : `⚔️ Te faltan ${misiones.length} misiones`;
            lineas.push(lista(misiones));
            if (tareas.length) lineas.push(`📌 ${lista(tareas)}`);
        } else if (tareas.length) {
            titulo = tareas.length === 1 ? "📌 Tienes 1 tarea pendiente" : `📌 Tienes ${tareas.length} tareas pendientes`;
            lineas.push(lista(tareas));
        } else {
            titulo = "✨ ¡Todo listo por hoy!";
            lineas.push("No te falta nada. Descansa, héroe.");
        }
        if (semanales.length) lineas.push(`🗓️ Esta semana: ${lista(semanales)}`);
        if (i === 0 && misiones.length && racha > 0) lineas.push(`🔥 Racha de ${juego.plural(racha, "día", "días")} en juego`);

        const cuerpo = lineas.join("\n");
        // De noche: cuánta vida pierdes si no terminas (y el diario, si no lo escribiste).
        const noche = [cuerpo];
        const enJuego = vida.danoDelDia(estado, fecha).dano;
        if (enJuego) {
            noche.push(i === 0
                ? `❤️ ${salud.puntos}/${salud.maxima}: si no terminas hoy pierdes ${enJuego} de vida`
                : `❤️ Si no lo haces pierdes ${enJuego} de vida`);
        }
        if (i === 0 && salud.caido) noche.push(`☠️ Estás caído: llega a ${salud.levantarse} ❤️ para abrir la tienda`);
        if (!estado.diario[fecha]) noche.push(`📓 Diario: ${preguntaDelDia(fecha)}`);
        dias[fecha] = {
            titulo,
            cuerpo,
            cuerpoNoche: noche.join("\n"),   // desde las 7 p. m.
            insignia: misiones.length + tareas.length,   // el numerito sobre el ícono de la app
            porMision: textosDeMisiones(estado, fecha, hechas, i === 0 ? racha : 0),
        };
    }
    // Los nombres, por si llega el aviso de una misión que ya hiciste sin internet (ver sw.js).
    const nombres = {};
    for (const m of estado.misiones) if (m.aviso) nombres[m.id] = m.nombre;
    return { dias, nombres };
}

// El texto del aviso propio de cada misión con hora de aviso que esté pendiente ese día.
function textosDeMisiones(estado, fecha, hechas, racha) {
    const textos = {};
    for (const m of estado.misiones) {
        if (!m.aviso || m.archivadaEn || !juego.sePuedeMarcar(m, fecha) || hechas.has(m.id) || juego.fallaDe(estado, m.id, fecha)) continue;
        const veces = m.veces ? juego.vecesEnSemana(estado.completadas, m.id, fecha) : 0;
        if (m.veces && veces >= m.veces) continue;   // ya cumpliste la semana

        const lineas = [];
        if (m.meta) lineas.push(`Llevas ${juego.cantidadDe(estado, m, fecha)} de ${m.meta.cantidad} ${m.meta.unidad}`.trim() + ".");
        else if (m.veces) lineas.push(`Llevas ${veces} de ${m.veces} esta semana.`);
        else lineas.push("Todavía no la marcas hoy.");
        const d = juego.DIFICULTADES[m.dificultad];
        lineas.push(`+${d.xp} XP · +${d.monedas} monedas`);
        if (!m.veces && !juego.enDescanso(estado, fecha)) lineas.push(`❤️ Si no la haces hoy pierdes ${vida.DANO[m.dificultad]} de vida`);
        if (racha > 0) lineas.push(`🔥 Racha de ${juego.plural(racha, "día", "días")}`);
        textos[m.id] = { titulo: `⏰ ${m.nombre}`, cuerpo: lineas.join("\n") };
    }
    return textos;
}

// Deja el resumen en la caché del teléfono (donde sw.js lo puede leer)
// y actualiza el numerito del ícono con lo que te falta hoy.
export async function guardarResumen(estado, hoy = aTexto(new Date())) {
    if (!("caches" in window)) return;
    const resumen = resumenParaAvisos(estado, hoy);
    try {
        const cache = await caches.open(CACHE);
        await cache.put(ARCHIVO_RESUMEN, new Response(JSON.stringify(resumen), { headers: { "Content-Type": "application/json" } }));
        if ("setAppBadge" in navigator && "Notification" in window && Notification.permission === "granted") {
            const pendientes = resumen.dias[hoy].insignia;
            await (pendientes ? navigator.setAppBadge(pendientes) : navigator.clearAppBadge());
        }
    } catch {
        // Sin caché (ej: navegación privada): los avisos usarán un texto general.
    }
}
