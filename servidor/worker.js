// worker.js — El servidor de avisos de Vida RPG (corre en Cloudflare Workers).
//
// Tus datos de juego siguen viviendo solo en el iPhone. Aquí se guarda únicamente:
//   - la "suscripción" del iPhone (la dirección a la que Apple le entrega los avisos),
//   - tus horarios de recordatorio y tu zona horaria,
//   - los avisos de cada misión: su número, hora y días, y hasta qué fecha no hace falta
//     avisar (porque ya la hiciste). El nombre de la misión nunca llega aquí,
//   - a qué hora termina tu sesión de enfoque (si hay una en curso).
// El TEXTO de cada aviso lo arma el propio iPhone (sw.js) con tus datos.
//
// Tiene dos partes:
//   fetch()     — recibe lo que manda la app: guardar, enfoque, probar y desactivar.
//   scheduled() — Cloudflare la ejecuta cada minuto (ver wrangler.toml): si toca un aviso, lo envía.
//
// Secretos (se ponen con "npx wrangler secret put NOMBRE", nunca en el código):
//   CODIGO        — el código de activación que escribes en la app.
//   VAPID_PRIVADA — la llave privada para firmar los avisos (formato JWK).

import { enviarPush } from "./webpush.js";

const CLAVE_KV = "config";   // todo se guarda en una sola entrada del KV
const MAX_HORARIOS = 10;
const MAX_MISIONES = 30;

// Desde qué páginas se puede llamar al servidor: la app publicada y la de pruebas en la compu.
const ORIGENES = ["https://mrkevin12.github.io", "http://localhost:8000", "http://127.0.0.1:8000"];


export default {
    async fetch(peticion, env) {
        // CORS: el navegador solo deja que la app lea la respuesta si su origen está permitido.
        const origen = peticion.headers.get("Origin");
        const cors = {
            "Access-Control-Allow-Origin": ORIGENES.includes(origen) ? origen : ORIGENES[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            Vary: "Origin",
        };
        const responder = (codigoHttp, datos) => new Response(JSON.stringify(datos),
            { status: codigoHttp, headers: { ...cors, "Content-Type": "application/json" } });

        if (peticion.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
        if (peticion.method === "GET") return responder(200, { ok: true, servicio: "Avisos de Vida RPG" });
        if (peticion.method !== "POST") return responder(405, { error: "Método no permitido." });

        let datos;
        try {
            datos = await peticion.json();
        } catch {
            return responder(400, { error: "Datos inválidos." });
        }
        if (!env.CODIGO || datos.codigo !== env.CODIGO) {
            return responder(403, { error: "El código de activación no es correcto." });
        }

        const ruta = RUTAS[new URL(peticion.url).pathname];
        if (!ruta) return responder(404, { error: "No existe esa dirección." });
        try {
            return responder(200, await ruta(datos, env));
        } catch (error) {
            return responder(400, { error: error.message });
        }
    },

    // Cada minuto.
    async scheduled(evento, env, ctx) {
        ctx.waitUntil(revisarAvisos(env, evento.scheduledTime));
    },
};


// ===== Lo que puede pedir la app =====

const RUTAS = {
    // Activar o actualizar: la suscripción (opcional), los horarios, los avisos de misión,
    // la zona y si avisar del enfoque. La app lo vuelve a mandar cada vez que algo cambia.
    async "/guardar"(datos, env) {
        const anterior = await leer(env) || {};
        const horarios = validarHorarios(datos.horarios);
        if (!horarios) throw new Error("Los horarios no son válidos.");
        const misiones = validarMisiones(datos.misiones ?? []);
        if (!misiones) throw new Error("Los avisos de misión no son válidos.");
        const suscripcion = datos.suscripcion === undefined ? anterior.suscripcion : validarSuscripcion(datos.suscripcion);
        if (!suscripcion) throw new Error("Falta la suscripción del teléfono.");
        await guardar(env, {
            ...anterior,
            suscripcion,
            horarios,
            misiones,
            zona: validarZona(datos.zona),
            avisarEnfoque: Boolean(datos.avisarEnfoque),
        });
        return { ok: true };
    },

    // Empezaste (fin = milisegundos) o cancelaste (fin = null) una sesión de enfoque.
    async "/enfoque"(datos, env) {
        const config = await leer(env);
        if (!config) throw new Error("Primero activa las notificaciones.");
        const fin = Number(datos.fin);
        config.finEnfoque = Number.isFinite(fin) && fin > Date.now() ? fin : null;
        await guardar(env, config);
        return { ok: true };
    },

    // Mandar un aviso de prueba ahora mismo.
    async "/probar"(datos, env) {
        const config = await leer(env);
        if (!config?.suscripcion) throw new Error("Primero activa las notificaciones.");
        const estado = await enviarPush(config.suscripcion, { tipo: "prueba" }, vapid(env), { ttl: 600 });
        return { ok: estado >= 200 && estado < 300, estado };
    },

    async "/desactivar"(datos, env) {
        await env.DATOS.delete(CLAVE_KV);
        return { ok: true };
    },
};


// ===== Cada minuto: ¿toca algún aviso? =====

async function revisarAvisos(env, ahora) {
    const config = await leer(env);
    if (!config?.suscripcion) return;

    for (const aviso of avisosQueTocan(config, ahora)) {
        const opciones = aviso.tipo === "enfoque" ? { ttl: 600, urgencia: "high" } : { ttl: 3600 };
        const estado = await enviarPush(config.suscripcion, aviso, vapid(env), opciones);
        console.log(`Aviso «${aviso.tipo}»: respuesta ${estado}`);
        if (estado === 404 || estado === 410) {
            // El iPhone ya no acepta avisos (se desinstaló la app o quitaste el permiso).
            await guardar(env, { ...config, suscripcion: null });
            return;
        }
    }
}

// Qué avisos tocan en este minuto. Es una función "pura" (no envía nada) para poder probarla.
export function avisosQueTocan(config, ahora) {
    const minuto = Math.floor(ahora / 60000) * 60000;   // el comienzo de este minuto
    const { fecha, hora, diaSemana } = horaLocal(minuto, config.zona);
    const tocaHoy = (h) => h.hora === hora && (!h.dias || h.dias.includes(diaSemana));
    const avisos = [];
    // Un solo recordatorio aunque haya dos horarios a la misma hora.
    if (config.horarios.some(tocaHoy)) avisos.push({ tipo: "recordatorio" });
    // Cada misión con aviso, salvo las que ya hiciste (saltarHasta = hasta qué día no hace falta avisar).
    for (const m of config.misiones || []) {
        const yaHecha = m.saltarHasta && fecha <= m.saltarHasta;
        if (tocaHoy(m) && !yaHecha) avisos.push({ tipo: "mision", id: m.id });
    }
    // El enfoque que terminó durante el minuto anterior (así avisa una sola vez).
    const fin = config.finEnfoque;
    if (config.avisarEnfoque && fin && fin <= minuto && fin > minuto - 60000) avisos.push({ tipo: "enfoque" });
    return avisos;
}

// La fecha ("2026-10-12"), la hora ("20:30") y el día de la semana (0 = lunes … 6 = domingo)
// en tu zona horaria. El servidor vive en hora UTC; Colombia está 5 horas atrás.
export function horaLocal(ms, zona) {
    const formato = new Intl.DateTimeFormat("en-US", {
        timeZone: zona, hourCycle: "h23", weekday: "short",
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    const partes = {};
    for (const parte of formato.formatToParts(new Date(ms))) partes[parte.type] = parte.value;
    return {
        fecha: `${partes.year}-${partes.month}-${partes.day}`,
        hora: `${partes.hour}:${partes.minute}`,
        diaSemana: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(partes.weekday),
    };
}


// ===== Validar lo que llega =====

// [{ hora: "07:30", dias: [0, 2, 4] o null }] -> la lista limpia, o null si algo está mal.
export function validarHorarios(lista) {
    if (!Array.isArray(lista) || lista.length > MAX_HORARIOS) return null;
    const limpios = [];
    for (const h of lista) {
        if (!h || !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.hora)) return null;
        const dias = h.dias ?? null;
        if (dias !== null && !(Array.isArray(dias) && dias.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))) return null;
        limpios.push({ hora: h.hora, dias });
    }
    return limpios;
}

// [{ id: 5, hora: "18:00", dias: [0, 2, 4] o null, saltarHasta: "2026-10-12" o null }]
export function validarMisiones(lista) {
    if (!Array.isArray(lista) || lista.length > MAX_MISIONES) return null;
    const limpias = [];
    for (const m of lista) {
        const [horario] = validarHorarios([m]) || [];   // la hora y los días se validan igual
        const saltarHasta = m?.saltarHasta ?? null;
        if (!horario || !Number.isInteger(m.id)) return null;
        if (saltarHasta !== null && !/^\d{4}-\d{2}-\d{2}$/.test(saltarHasta)) return null;
        limpias.push({ id: m.id, ...horario, saltarHasta });
    }
    return limpias;
}

function validarSuscripcion(s) {
    const valida = s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://")
        && typeof s.keys?.p256dh === "string" && typeof s.keys?.auth === "string";
    return valida ? { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } } : null;
}

function validarZona(zona) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: zona });
        return typeof zona === "string" ? zona : "America/Bogota";
    } catch {
        return "America/Bogota";
    }
}


// ===== Ayudantes =====

function leer(env) {
    return env.DATOS.get(CLAVE_KV, "json");
}

function guardar(env, config) {
    return env.DATOS.put(CLAVE_KV, JSON.stringify(config));
}

function vapid(env) {
    return { publica: env.VAPID_PUBLICA, privada: JSON.parse(env.VAPID_PRIVADA), sujeto: env.VAPID_SUJETO };
}
