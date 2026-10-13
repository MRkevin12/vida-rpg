// pruebas.mjs — Pruebas del servidor de avisos.
// Cómo usarlas (desde esta carpeta):   node pruebas.mjs
//
// No envían nada de verdad: el KV y los servicios de push se reemplazan por imitaciones.

import { cifrar, firmaVapid, aBytes, aBase64url } from "./webpush.js";
import { horaLocal, avisosQueTocan, validarHorarios, validarMisiones, validarRespaldo } from "./worker.js";

let fallidas = 0;
async function prueba(nombre, funcion) {
    try {
        await funcion();
        console.log(`✅ ${nombre}`);
    } catch (error) {
        fallidas += 1;
        console.log(`❌ ${nombre}\n   ${error.message}`);
    }
}
function igual(real, esperado, que = "el resultado") {
    const [a, b] = [JSON.stringify(real), JSON.stringify(esperado)];
    if (a !== b) throw new Error(`${que}: esperaba ${b} y salió ${a}`);
}

// Una llave P-256 a partir de su parte privada (d) y pública (65 bytes: 0x04 + x + y).
function jwk(d, publica) {
    const bytes = aBytes(publica);
    return { kty: "EC", crv: "P-256", d, x: aBase64url(bytes.slice(1, 33)), y: aBase64url(bytes.slice(33, 65)) };
}


// El ejemplo del RFC 8291 (sección 5): con estas llaves y esta sal, el resultado debe ser idéntico.
await prueba("Cifrado: reproduce el ejemplo oficial del RFC 8291", async () => {
    const privada = jwk("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
        "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8");
    const { d, ...publica } = privada;
    const llaves = {
        privateKey: await crypto.subtle.importKey("jwk", privada, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]),
        publicKey: await crypto.subtle.importKey("jwk", publica, { name: "ECDH", namedCurve: "P-256" }, true, []),
    };
    const suscripcion = { keys: {
        p256dh: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
        auth: "BTBZMqHH6r4Tts7J_aSIgg",
    } };
    const resultado = await cifrar(suscripcion, "When I grow up, I want to be a watermelon",
                                   { sal: aBytes("DGv6ra1nlYgDCS1FRnbzlw"), llaves });
    igual(aBase64url(resultado),
        "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN");
});

await prueba("Firma VAPID: el JWT dice a qué servicio va, vence en 12 h y la firma es válida", async () => {
    const par = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const publica = aBase64url(await crypto.subtle.exportKey("raw", par.publicKey));
    const vapid = { publica, privada: await crypto.subtle.exportKey("jwk", par.privateKey), sujeto: "https://ejemplo.github.io/" };
    const ahora = Date.UTC(2026, 9, 12, 12, 0, 0);
    const cabecera = await firmaVapid("https://web.push.apple.com/abc123", vapid, ahora);

    const [, jwt, k] = cabecera.match(/^vapid t=([^,]+), k=(.+)$/);
    igual(k, publica, "la llave pública");
    const [c, d, firma] = jwt.split(".");
    const datos = JSON.parse(new TextDecoder().decode(aBytes(d)));
    igual(datos, { aud: "https://web.push.apple.com", exp: ahora / 1000 + 12 * 3600, sub: "https://ejemplo.github.io/" });
    const valida = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, par.publicKey, aBytes(firma),
                                              new TextEncoder().encode(`${c}.${d}`));
    igual(valida, true, "la firma");
});

await prueba("Hora local: convierte la hora del servidor (UTC) a la de Colombia", () => {
    // 2026-10-12 01:30 UTC = domingo 11 de octubre, 20:30 en Bogotá (UTC−5).
    igual(horaLocal(Date.UTC(2026, 9, 12, 1, 30), "America/Bogota"), { fecha: "2026-10-11", hora: "20:30", diaSemana: 6 });
    igual(horaLocal(Date.UTC(2026, 9, 12, 5, 0), "America/Bogota"), { fecha: "2026-10-12", hora: "00:00", diaSemana: 0 });
});

await prueba("Avisos de misión: a su hora y en sus días, salvo si ya la hiciste", () => {
    const lunes18 = Date.UTC(2026, 9, 12, 23, 0);   // lunes 12 de octubre, 18:00 en Bogotá
    const config = {
        zona: "America/Bogota", horarios: [], avisarEnfoque: false, finEnfoque: null,
        misiones: [
            { id: 5, hora: "18:00", dias: null, saltarHasta: null },
            { id: 6, hora: "18:00", dias: [1, 3], saltarHasta: null },          // solo martes y jueves
            { id: 7, hora: "18:00", dias: null, saltarHasta: "2026-10-12" },    // ya hecha hoy
            { id: 8, hora: "18:00", dias: null, saltarHasta: "2026-10-11" },    // hecha ayer: hoy sí avisa
        ],
    };
    igual(avisosQueTocan(config, lunes18), [{ tipo: "mision", id: 5 }, { tipo: "mision", id: 8 }]);
    igual(avisosQueTocan(config, lunes18 + 60000), [], "un minuto después");
    igual(avisosQueTocan({ ...config, misiones: undefined }, lunes18), [], "una configuración vieja sin misiones");
});

await prueba("Avisos de misión: se rechazan los datos mal formados", () => {
    igual(validarMisiones([{ id: 5, hora: "18:00", dias: [0], saltarHasta: "2026-10-12" }]),
          [{ id: 5, hora: "18:00", dias: [0], saltarHasta: "2026-10-12" }]);
    for (const malo of [[{ id: "5", hora: "18:00" }], [{ id: 5, hora: "6pm" }], [{ id: 5, hora: "18:00", saltarHasta: "ayer" }], [null]]) {
        igual(validarMisiones(malo), null, JSON.stringify(malo));
    }
});

await prueba("Avisos: los recordatorios suenan a su hora y en sus días", () => {
    const config = {
        zona: "America/Bogota",
        horarios: [{ hora: "20:30", dias: null }, { hora: "07:00", dias: [0, 1, 2, 3, 4] }],
        avisarEnfoque: true, finEnfoque: null,
    };
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 12, 1, 30)), [{ tipo: "recordatorio" }], "domingo 20:30");
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 12, 1, 31)), [], "un minuto después");
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 11, 12, 0)), [], "domingo 7:00 (ese no toca el fin de semana)");
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 12, 12, 0)), [{ tipo: "recordatorio" }], "lunes 7:00");
});

await prueba("Avisos: el fin del enfoque avisa una sola vez (en el minuto en que termina)", () => {
    const fin = Date.UTC(2026, 9, 12, 15, 25, 20);
    const config = { zona: "America/Bogota", horarios: [], avisarEnfoque: true, finEnfoque: fin };
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 12, 15, 25)), [], "antes de terminar");
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 12, 15, 26)), [{ tipo: "enfoque" }], "el minuto siguiente");
    igual(avisosQueTocan(config, Date.UTC(2026, 9, 12, 15, 27)), [], "y ya no más");
    igual(avisosQueTocan({ ...config, avisarEnfoque: false }, Date.UTC(2026, 9, 12, 15, 26)), [], "si lo apagaste");
});

await prueba("Horarios: se rechazan horas y días inventados", () => {
    igual(validarHorarios([{ hora: "07:05", dias: [0, 6] }, { hora: "21:00", dias: null }]),
          [{ hora: "07:05", dias: [0, 6] }, { hora: "21:00", dias: null }]);
    for (const malo of [[{ hora: "25:00" }], [{ hora: "7:00" }], [{ hora: "07:00", dias: [9] }], "nada",
                        Array.from({ length: 11 }, () => ({ hora: "08:00", dias: null }))]) {
        igual(validarHorarios(malo), null, JSON.stringify(malo).slice(0, 40));
    }
});

await prueba("Copia en la nube: se aceptan copias cifradas y se rechaza lo demás", () => {
    const buena = { sal: "c2Fs", iv: "aXY=", datos: "Y2lmcmFkbw==", fecha: "2026-10-12", extra: "se ignora" };
    igual(validarRespaldo(buena), { sal: "c2Fs", iv: "aXY=", datos: "Y2lmcmFkbw==", fecha: "2026-10-12" });
    for (const mala of [null, {}, { ...buena, datos: 5 }, { ...buena, fecha: "ayer" }, { ...buena, datos: "x".repeat(8_000_001) }]) {
        igual(validarRespaldo(mala), null, JSON.stringify(mala)?.slice(0, 40));
    }
});

console.log(fallidas ? `\nFallaron ${fallidas} pruebas.` : "\nTodas las pruebas del servidor pasaron.");
process.exitCode = fallidas ? 1 : 0;
