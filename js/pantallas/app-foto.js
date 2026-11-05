// app-foto.js — La ventana «📷 Prueba con foto» (v193): muestra el código del día, abre la cámara,
// lee la foto con OCR (Tesseract, SIN internet: sus archivos están en ocr/) y dice si el código aparece.
//
// Uso: const ok = await pedirFoto(mision, fecha);  → true solo si la foto pasó la prueba.
// La foto NO se guarda: solo se lee y se olvida (pesa mucho y el localStorage es chico).

import { codigoDeMision, verificarTexto } from "../foto.js";
import { $ } from "../app.js";

// Dónde están los archivos de Tesseract (rutas completas: el "worker" las necesita así).
const CARPETA_OCR = new URL("../../ocr/", import.meta.url).href;
const LADO_MAXIMO = 1600;   // achicamos la foto (12 megapíxeles → ~2): lee igual de bien y mucho más rápido

let lector = null;          // promesa del lector de Tesseract (se crea la primera vez y se reutiliza)
let alAvanzar = null;       // a quién avisar del progreso mientras lee

// Crea el lector una sola vez. import() dinámico: los ~6 MB solo se cargan cuando de verdad tomas una foto.
function obtenerLector() {
    if (!lector) {
        lector = (async () => {
            const { default: Tesseract } = await import("../../ocr/tesseract.esm.min.js");
            const trabajador = await Tesseract.createWorker("spa", 1, {   // 1 = el motor LSTM (red neuronal)
                workerPath: CARPETA_OCR + "worker.min.js",
                corePath: CARPETA_OCR + "tesseract-core-simd-lstm.wasm.js",
                langPath: CARPETA_OCR,          // ahí está spa.traineddata.gz
                cacheMethod: "none",            // ya lo guarda el service worker: no duplicarlo en IndexedDB
                workerBlobURL: false,
                logger: (m) => alAvanzar?.(m),
            });
            // Solo letras y números: así no "inventa" signos raros donde hay manchas.
            await trabajador.setParameters({
                tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ",
            });
            return trabajador;
        })();
        lector.catch(() => { lector = null; });   // si falló, la próxima vez se vuelve a intentar
    }
    return lector;
}

// Cerrar el lector al terminar: en el iPhone ocupa bastante memoria.
async function soltarLector() {
    const anterior = lector;
    lector = null;
    try { (await anterior)?.terminate(); } catch { /* ya estaba cerrado */ }
}

// La foto → un canvas más chico (createImageBitmap ya la gira según cómo tenías el teléfono).
async function prepararImagen(archivo) {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close?.();
    return lienzo;
}

// Cómo busca el texto en la hoja (tessedit_pageseg_mode):
//   "3"  = como una página normal (párrafos y líneas). Es el de siempre.
//   "11" = texto disperso: palabras sueltas en cualquier parte. Encuentra mejor un código escrito
//          en medio de una hoja con otras cosas (lo probamos con varias letras "a mano").
export const MODOS = ["3", "11"];

// Lee el texto de la foto (puede ser el archivo o un canvas ya preparado).
// avance recibe el porcentaje (0–100) mientras reconoce.
export async function leerTexto(imagen, avance = () => {}, modo = "3") {
    alAvanzar = (m) => {
        if (m.status === "recognizing text") avance(Math.round(m.progress * 100));
    };
    const [trabajador, lienzo] = await Promise.all([
        obtenerLector(),
        imagen instanceof HTMLCanvasElement ? imagen : prepararImagen(imagen),
    ]);
    await trabajador.setParameters({ tessedit_pageseg_mode: modo });
    const { data } = await trabajador.recognize(lienzo);
    alAvanzar = null;
    return data.text || "";
}

// Lee la foto con cada modo hasta encontrar el código. Devuelve el resultado de verificarTexto
// (y el texto leído, para mostrarlo si no lo encontró).
async function buscarCodigo(archivo, codigo, avance) {
    const lienzo = await prepararImagen(archivo);   // se prepara una sola vez para las dos lecturas
    let ultimo = null;
    for (const [i, modo] of MODOS.entries()) {
        const texto = await leerTexto(lienzo, (p) => avance(p, i + 1), modo);
        ultimo = { ...verificarTexto(texto, codigo), texto };
        if (ultimo.ok) break;
    }
    return ultimo;
}

// Abre la ventana y espera. Devuelve una promesa que termina en true (foto válida) o false (cancelaste).
export function pedirFoto(mision, fecha) {
    const dialogo = $("#dialogo-foto");
    const entrada = $("#foto-entrada");
    const vista = $("#foto-vista");
    const estadoTexto = $("#foto-estado");
    const codigo = codigoDeMision(mision.id, fecha);

    $("#foto-mision").textContent = mision.nombre;
    $("#foto-codigo").textContent = codigo.texto;
    estadoTexto.textContent = "";
    estadoTexto.className = "foto-estado";
    vista.hidden = true;
    entrada.value = "";

    return new Promise((terminar) => {
        let aprobada = false;
        let leyendo = false;
        let urlVista = null;

        const elegir = async () => {
            const archivo = entrada.files[0];
            if (!archivo || leyendo) return;
            leyendo = true;
            dialogo.classList.add("leyendo");
            if (urlVista) URL.revokeObjectURL(urlVista);
            urlVista = URL.createObjectURL(archivo);
            vista.src = urlVista;
            vista.hidden = false;
            estadoTexto.className = "foto-estado";
            estadoTexto.textContent = "🔎 Preparando el lector… (la primera vez tarda un poco más)";
            try {
                const resultado = await buscarCodigo(archivo, codigo, (p, vuelta) => {
                    estadoTexto.textContent = `🔎 Leyendo la foto${vuelta > 1 ? " otra vez, con más cuidado" : ""}… ${p} %`;
                });
                const texto = resultado.texto;
                if (resultado.ok) {
                    aprobada = true;
                    estadoTexto.className = "foto-estado foto-ok";
                    estadoTexto.textContent = `✅ ¡Código «${codigo.texto}» encontrado!`;
                    setTimeout(() => dialogo.close(), 900);
                } else {
                    estadoTexto.className = "foto-estado foto-mal";
                    const leido = texto.replace(/\s+/g, " ").trim().slice(0, 60);
                    estadoTexto.textContent = `❌ No encontré «${codigo.texto}». ` +
                        (leido ? `Leí: «${leido}». ` : "No pude leer ningún texto. ") +
                        "Prueba con más luz, letras grandes y el teléfono derecho.";
                }
            } catch (error) {
                console.error(error);
                estadoTexto.className = "foto-estado foto-mal";
                estadoTexto.textContent = "⚠️ No se pudo leer la foto en este teléfono. Vuelve a intentarlo.";
            } finally {
                leyendo = false;
                dialogo.classList.remove("leyendo");
                entrada.value = "";   // para poder elegir otra foto igual
            }
        };

        const tomar = () => entrada.click();

        const alCerrar = () => {
            entrada.removeEventListener("change", elegir);
            $("#foto-tomar").removeEventListener("click", tomar);
            dialogo.removeEventListener("close", alCerrar);
            if (urlVista) URL.revokeObjectURL(urlVista);
            vista.removeAttribute("src");
            soltarLector();
            terminar(aprobada);
        };

        entrada.addEventListener("change", elegir);
        $("#foto-tomar").addEventListener("click", tomar);
        dialogo.addEventListener("close", alCerrar);
        dialogo.showModal();
    });
}
