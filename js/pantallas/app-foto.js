// app-foto.js — Las fotos de progreso (v197): tomar la foto, guardarla y la galería con su comparador.
//
// Reemplaza al lector de código (OCR) de la v193: ya no se «verifica» el contenido de la foto, solo se toma y se guarda.
// Sirve para ver tu avance semana a semana (por ejemplo en el gym) y para tener un recuerdo de cada misión.
//
//   const ok = await pedirFoto(mision, fecha);   → true si la foto quedó guardada (la usa «alternar-mision» y el ritual)
//   La foto se reduce (~1000 px) y se guarda en el teléfono (IndexedDB, ver fotos.js). No sale de ahí.
//
// Los botones (data-accion="fotos-…") están al final en ACCIONES_FOTO; app.js los suma a los demás.

import * as acciones from "../acciones.js";
import * as fotos from "../fotos.js";
import * as vistasFotos from "./vistas-fotos.js";
import { hoy } from "../fechas.js";
import { estado, $, ejecutar } from "../app.js";
import { avisar } from "./app-efectos.js";

// ===== Tomar una foto y guardarla =====

// Abre la ventana, espera a que tomes y guardes la foto. Devuelve una promesa: true si se guardó, false si cancelaste.
//   album: dónde se guarda (id de la misión como texto, o "progreso")   fecha: el día al que pertenece
function capturar({ titulo, detalle, album, fecha }) {
    const dialogo = $("#dialogo-foto");
    const entrada = $("#foto-entrada");
    const vista = $("#foto-vista");
    const estadoTexto = $("#foto-estado");
    const guardar = $("#foto-guardar");
    const tomar = $("#foto-tomar");

    $("#foto-mision").textContent = titulo;
    $("#foto-detalle").textContent = detalle;
    estadoTexto.textContent = "";
    estadoTexto.className = "foto-estado";
    vista.hidden = true;
    guardar.hidden = true;
    guardar.disabled = false;
    entrada.value = "";

    return new Promise((terminar) => {
        let guardada = false;
        let lista = null;        // la foto ya reducida (Blob), esperando que toques «Guardar»
        let urlVista = null;

        // Elegiste o tomaste una foto: se reduce y se muestra para que la revises antes de guardar.
        const elegir = async () => {
            const archivo = entrada.files[0];
            if (!archivo) return;
            guardar.hidden = true;
            estadoTexto.className = "foto-estado";
            estadoTexto.textContent = "⏳ Preparando la foto…";
            try {
                lista = await fotos.reducirImagen(archivo);
                if (urlVista) URL.revokeObjectURL(urlVista);
                urlVista = URL.createObjectURL(lista);
                vista.src = urlVista;
                vista.hidden = false;
                guardar.hidden = false;
                estadoTexto.textContent = "Revisa la foto. Si no te gusta, toma otra.";
            } catch (error) {
                console.error(error);
                lista = null;
                estadoTexto.className = "foto-estado foto-mal";
                estadoTexto.textContent = "⚠️ No se pudo preparar esa foto. Prueba con otra.";
            } finally {
                entrada.value = "";   // para poder elegir otra igual
            }
        };

        const alGuardar = async () => {
            if (!lista || guardar.disabled) return;
            guardar.disabled = true;
            try {
                await fotos.guardarFoto(album, fecha, lista);
                guardada = true;
                dialogo.close();
            } catch (error) {
                console.error(error);
                estadoTexto.className = "foto-estado foto-mal";
                estadoTexto.textContent = "⚠️ No se pudo guardar la foto en este teléfono. ¿Poco espacio? Libera un poco y vuelve a intentar.";
                guardar.disabled = false;
            }
        };

        const alTomar = () => entrada.click();

        const alCerrar = () => {
            entrada.removeEventListener("change", elegir);
            tomar.removeEventListener("click", alTomar);
            guardar.removeEventListener("click", alGuardar);
            dialogo.removeEventListener("close", alCerrar);
            if (urlVista) URL.revokeObjectURL(urlVista);
            vista.removeAttribute("src");
            terminar(guardada);
        };

        entrada.addEventListener("change", elegir);
        tomar.addEventListener("click", alTomar);
        guardar.addEventListener("click", alGuardar);
        dialogo.addEventListener("close", alCerrar);
        dialogo.showModal();
    });
}

// La foto de una misión que la pide (al completarla). true = quedó guardada.
export function pedirFoto(mision, fecha) {
    return capturar({
        titulo: mision.nombre,
        detalle: "Toma una foto de lo que hiciste. Se guarda en tu galería, en el álbum de esta misión.",
        album: String(mision.id),
        fecha,
    });
}

// La foto de progreso (la semanal): queda en el álbum «progreso» y se anota para el recordatorio.
async function tomarFotoDeProgreso() {
    const fecha = hoy();
    const ok = await capturar({
        titulo: "Foto de progreso",
        detalle: "Mismo lugar, misma luz y mismo ángulo que la vez anterior: así se nota el cambio.",
        album: fotos.ALBUM_LIBRE,
        fecha,
    });
    if (!ok) return;
    ejecutar(() => acciones.registrarFotoProgreso(estado, fecha));
    avisar("📷 Foto guardada");
    if (galeria) pintarGaleria();
}


// ===== La galería =====

let galeria = null;            // { album, seleccion: [fechas] } mientras la ventana está abierta
let urlsGaleria = [];          // direcciones temporales de las miniaturas (se sueltan al redibujar y al cerrar)
let versionDeDibujo = 0;       // para ignorar un dibujo viejo que terminó tarde

function soltarUrls() {
    for (const url of urlsGaleria) URL.revokeObjectURL(url);
    urlsGaleria = [];
}

// Los álbumes: el de progreso, y uno por cada misión que pide foto o ya tiene fotos.
function listarAlbumes(cuenta) {
    const lista = [{ id: fotos.ALBUM_LIBRE, nombre: "📈 Progreso", cuenta: cuenta[fotos.ALBUM_LIBRE] || 0 }];
    for (const m of estado.misiones) {
        const id = String(m.id);
        if ((m.foto && !m.archivadaEn) || cuenta[id]) lista.push({ id, nombre: m.nombre, cuenta: cuenta[id] || 0 });
    }
    // Fotos de una misión que ya no existe: se siguen viendo (y se pueden borrar).
    for (const id of Object.keys(cuenta)) {
        if (!lista.some((a) => a.id === id)) lista.push({ id, nombre: "Misión borrada", cuenta: cuenta[id] });
    }
    return lista;
}

async function pintarGaleria() {
    if (!galeria) return;
    const version = ++versionDeDibujo;
    try {
        const cuenta = await fotos.cuentaPorAlbum();
        const albumes = listarAlbumes(cuenta);
        if (!albumes.some((a) => a.id === galeria.album)) galeria.album = fotos.ALBUM_LIBRE;
        const registros = await fotos.fotosDeAlbum(galeria.album);
        if (version !== versionDeDibujo || !galeria) return;   // llegó tarde: ya hay un dibujo más nuevo
        soltarUrls();
        const lista = registros.map((r) => ({ fecha: r.fecha, url: URL.createObjectURL(r.imagen) }));
        urlsGaleria = lista.map((f) => f.url);
        galeria.seleccion = galeria.seleccion.filter((f) => lista.some((x) => x.fecha === f));
        $("#fotos-contenido").innerHTML = vistasFotos.contenidoGaleria({
            albumes, album: galeria.album, fotos: lista, seleccion: galeria.seleccion, semanal: estado.fotos.semanal,
        });
    } catch (error) {
        console.error(error);
        $("#fotos-contenido").innerHTML = `<p class="nota">⚠️ No se pudieron leer las fotos de este teléfono.</p>
            <div class="botones-dialogo"><button type="button" class="boton boton-secundario" data-accion="cerrar">Cerrar</button></div>`;
    }
}

function abrirGaleria(album = fotos.ALBUM_LIBRE) {
    galeria = { album, seleccion: [] };
    const dialogo = $("#dialogo-fotos");
    $("#fotos-contenido").innerHTML = `<p class="nota">Cargando tus fotos…</p>`;
    dialogo.addEventListener("close", () => { galeria = null; soltarUrls(); }, { once: true });
    dialogo.showModal();
    pintarGaleria();
}


// ===== Los botones =====

export const ACCIONES_FOTO = {
    "fotos-abrir": () => abrirGaleria(),
    "fotos-semanal": () => tomarFotoDeProgreso(),
    "fotos-nueva": () => tomarFotoDeProgreso(),
    "fotos-album": (boton) => {
        galeria.album = boton.dataset.album;
        galeria.seleccion = [];
        pintarGaleria();
    },
    // Tocar una miniatura la elige; con dos elegidas se comparan; una tercera reemplaza a la más vieja de las dos.
    "fotos-elegir": (boton) => {
        const fecha = boton.dataset.fecha;
        if (galeria.seleccion.includes(fecha)) galeria.seleccion = galeria.seleccion.filter((f) => f !== fecha);
        else galeria.seleccion = [...galeria.seleccion, fecha].slice(-2);
        pintarGaleria();
    },
    "fotos-borrar": async (boton) => {
        if (!confirm("¿Borrar esta foto? No se puede recuperar.")) return;
        await fotos.borrarFoto(galeria.album, boton.dataset.fecha);
        galeria.seleccion = [];
        pintarGaleria();
    },
    "fotos-recordatorio": () => {
        ejecutar(() => acciones.configurarFotos(estado, { semanal: !estado.fotos.semanal }));
        pintarGaleria();
    },
};
