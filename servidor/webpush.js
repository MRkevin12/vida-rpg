// webpush.js — Enviar una notificación "push" a un teléfono, usando solo WebCrypto
// (las funciones de criptografía que ya trae Cloudflare, sin librerías).
//
// Para que Apple (o Google, o Microsoft) entregue el aviso hay que hacer dos cosas:
//
//   1. FIRMAR la petición (VAPID, RFC 8292). Es un "JWT": un texto con quién lo envía
//      y hasta cuándo vale, firmado con nuestra llave privada. Así el servicio de push
//      sabe que el aviso viene del mismo servidor con el que el iPhone se suscribió.
//
//   2. CIFRAR el contenido (RFC 8291, "aes128gcm"). Solo el iPhone puede leerlo:
//      ni Apple ni nadie en el camino ve lo que dice.
//
// Las llaves: el iPhone nos da su llave pública (p256dh) y un secreto (auth) al
// suscribirse. Nosotros creamos una llave de un solo uso por mensaje y, con la
// "matemática de curvas elípticas" (ECDH), ambos lados llegan al mismo secreto.

const texto = new TextEncoder();


// ===== Ayudantes =====

// base64url (el formato de las llaves) -> bytes
export function aBytes(base64url) {
    const normal = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const binario = atob(normal + "=".repeat((4 - (normal.length % 4)) % 4));
    return Uint8Array.from(binario, (letra) => letra.charCodeAt(0));
}

// bytes -> base64url
export function aBase64url(bytes) {
    let binario = "";
    for (const byte of new Uint8Array(bytes)) binario += String.fromCharCode(byte);
    return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Pega varias listas de bytes una tras otra.
function unir(...partes) {
    const resultado = new Uint8Array(partes.reduce((total, p) => total + p.length, 0));
    let posicion = 0;
    for (const parte of partes) {
        resultado.set(parte, posicion);
        posicion += parte.length;
    }
    return resultado;
}

async function hmac(clave, datos) {
    const llave = await crypto.subtle.importKey("raw", clave, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", llave, datos));
}

// HKDF (RFC 5869): mezcla un secreto con una "sal" y saca una llave del largo pedido.
// Con una sola vuelta alcanza, porque nunca pedimos más de 32 bytes.
async function hkdf(sal, secreto, info, largo) {
    const prk = await hmac(sal, secreto);
    return (await hmac(prk, unir(info, new Uint8Array([1])))).slice(0, largo);
}


// ===== 1. Firma (VAPID) =====

// vapid = { publica: "B…" (base64url), privada: { JWK }, sujeto: "https://…" o "mailto:…" }
export async function firmaVapid(endpoint, vapid, ahora = Date.now()) {
    const cabecera = aBase64url(texto.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
    const datos = aBase64url(texto.encode(JSON.stringify({
        aud: new URL(endpoint).origin,                 // a qué servicio de push va
        exp: Math.floor(ahora / 1000) + 12 * 60 * 60, // vale 12 horas (el máximo es 24)
        sub: vapid.sujeto,                             // quién lo envía
    })));
    const llave = await crypto.subtle.importKey("jwk", vapid.privada, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
    const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, llave, texto.encode(`${cabecera}.${datos}`));
    return `vapid t=${cabecera}.${datos}.${aBase64url(firma)}, k=${vapid.publica}`;
}


// ===== 2. Cifrado (aes128gcm) =====

// suscripcion = { endpoint, keys: { p256dh, auth } } (lo que da el iPhone al suscribirse)
// "opciones" solo se usa en las pruebas, para repetir el ejemplo del RFC 8291.
export async function cifrar(suscripcion, mensaje, opciones = {}) {
    const llaveTelefono = aBytes(suscripcion.keys.p256dh);   // 65 bytes
    const auth = aBytes(suscripcion.keys.auth);               // 16 bytes
    const sal = opciones.sal || crypto.getRandomValues(new Uint8Array(16));
    const nuestras = opciones.llaves ||
        await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const nuestraPublica = new Uint8Array(await crypto.subtle.exportKey("raw", nuestras.publicKey));

    // Secreto compartido entre nuestra llave privada y la pública del teléfono.
    const publicaTelefono = await crypto.subtle.importKey("raw", llaveTelefono, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const compartido = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: publicaTelefono }, nuestras.privateKey, 256));

    // De ahí salen la llave del cifrado (16 bytes) y el "nonce" (12 bytes).
    const ikm = await hkdf(auth, compartido, unir(texto.encode("WebPush: info\0"), llaveTelefono, nuestraPublica), 32);
    const llaveContenido = await hkdf(sal, ikm, texto.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await hkdf(sal, ikm, texto.encode("Content-Encoding: nonce\0"), 12);

    // Cifrar: el mensaje + el byte 2 (que significa "último bloque").
    const llaveAes = await crypto.subtle.importKey("raw", llaveContenido, "AES-GCM", false, ["encrypt"]);
    const cifrado = new Uint8Array(await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: nonce }, llaveAes, unir(texto.encode(mensaje), new Uint8Array([2]))));

    // Lo que viaja: sal (16) + tamaño de bloque 4096 (4) + largo de la llave (1) + nuestra llave (65) + cifrado.
    return unir(sal, new Uint8Array([0, 0, 16, 0]), new Uint8Array([nuestraPublica.length]), nuestraPublica, cifrado);
}


// ===== Enviar =====

// Devuelve el código de respuesta del servicio de push:
// 201 = entregado; 404 o 410 = esa suscripción ya no existe (se desinstaló la app o se quitó el permiso).
export async function enviarPush(suscripcion, datos, vapid, { ttl = 3600, urgencia = "normal" } = {}) {
    const cuerpo = await cifrar(suscripcion, JSON.stringify(datos));
    const respuesta = await fetch(suscripcion.endpoint, {
        method: "POST",
        headers: {
            Authorization: await firmaVapid(suscripcion.endpoint, vapid),
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            TTL: String(ttl),          // segundos que el servicio lo guarda si el teléfono está apagado
            Urgency: urgencia,
        },
        body: cuerpo,
    });
    return respuesta.status;
}
