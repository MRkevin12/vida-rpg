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
import * as juego from "../juego.js";
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
    refrescarGaleria();
}


// ===== La galería: «Mis fotos» (portadas) y la subventana de cada álbum =====

let galeriaAbierta = false;    // ¿está abierta la ventana de portadas?
let albumVista = null;         // el álbum abierto en su subventana: { id, lista: [{ fecha, url }], seleccion: [fechas] }
let urlsPortadas = [];         // direcciones temporales de las portadas (se sueltan al redibujar y al cerrar)
let urlsAlbum = [];            // y las de las fotos del álbum abierto
let datosPortadas = null;      // lo último que se leyó para dibujar las portadas
let cargaPortadas = 0;         // contadores para ignorar una carga vieja que terminó tarde
let cargaAlbum = 0;

function soltar(urls) {
    for (const url of urls) URL.revokeObjectURL(url);
    return [];
}

// El tema de un álbum: el ícono y el color del atributo de su misión. El de progreso es dorado.
function temaDe(id) {
    if (id === fotos.ALBUM_LIBRE) return { icono: "📈", color: "#fbbf24", nombre: "Progreso", etiqueta: "Tu evolución" };
    const mision = estado.misiones.find((m) => String(m.id) === id);
    if (!mision) return { icono: "🖼️", color: "#94a3b8", nombre: "Misión borrada", etiqueta: "Sin misión" };
    const atributo = juego.infoAtributo(estado, mision.atributo, mision.atributoPropio);
    return { icono: atributo.icono, color: atributo.color, nombre: mision.nombre, etiqueta: atributo.nombre };
}

// Los álbumes: el de progreso primero; luego los que tienen fotos (el más reciente arriba) y al final los vacíos.
function listarAlbumes(resumen) {
    const ids = new Set([fotos.ALBUM_LIBRE]);
    for (const m of estado.misiones) if (m.foto && !m.archivadaEn) ids.add(String(m.id));
    for (const id of Object.keys(resumen)) ids.add(id);   // incluso de misiones ya archivadas o borradas
    const albumes = [...ids].map((id) => ({
        id, tema: temaDe(id), cuenta: resumen[id]?.cuenta || 0, ultima: resumen[id]?.ultima || null, imagen: resumen[id]?.portada || null,
    }));
    const orden = (a) => (a.id === fotos.ALBUM_LIBRE ? 0 : a.cuenta ? 1 : 2);
    return albumes.sort((a, b) => orden(a) - orden(b) || (b.ultima || "").localeCompare(a.ultima || ""));
}

// Dibuja las portadas con lo último leído (sin volver a leer la base).
function dibujarPortadas() {
    if (!galeriaAbierta || !datosPortadas) return;
    $("#fotos-contenido").innerHTML = vistasFotos.contenidoGaleria({ ...datosPortadas, semanal: estado.fotos.semanal, hoy: hoy() });
}

// Lee los álbumes de la base y dibuja las portadas.
async function cargarPortadas() {
    if (!galeriaAbierta) return;
    const version = ++cargaPortadas;
    try {
        const albumes = listarAlbumes(await fotos.resumenPorAlbum());
        if (version !== cargaPortadas || !galeriaAbierta) return;   // llegó tarde: ya hay una carga más nueva
        urlsPortadas = soltar(urlsPortadas);
        datosPortadas = {
            albumes: albumes.map((a) => {
                const url = a.imagen ? URL.createObjectURL(a.imagen) : null;
                if (url) urlsPortadas.push(url);
                return { id: a.id, tema: a.tema, cuenta: a.cuenta, ultima: a.ultima, portada: url };
            }),
        };
        dibujarPortadas();
    } catch (error) {
        console.error(error);
        $("#fotos-contenido").innerHTML = `<p class="nota">⚠️ No se pudieron leer las fotos de este teléfono.</p>
            <div class="botones-dialogo"><button type="button" class="boton boton-secundario" data-accion="cerrar">Cerrar</button></div>`;
    }
}

// Dibuja la subventana del álbum con las fotos ya leídas. «ver» sube hasta la foto que elegiste.
function dibujarAlbum(ver = false) {
    if (!albumVista) return;
    $("#album-contenido").innerHTML = vistasFotos.contenidoAlbum({
        album: { id: albumVista.id, tema: temaDe(albumVista.id) },
        fotos: albumVista.lista, seleccion: albumVista.seleccion, hoy: hoy(),
    });
    if (ver) $("#album-contenido [data-visor]")?.scrollIntoView({ block: "start" });
}

// Lee las fotos del álbum de la base y lo dibuja.
async function cargarAlbum() {
    if (!albumVista) return;
    const version = ++cargaAlbum;
    try {
        const registros = await fotos.fotosDeAlbum(albumVista.id);
        if (version !== cargaAlbum || !albumVista) return;
        urlsAlbum = soltar(urlsAlbum);
        albumVista.lista = registros.map((r) => {
            const url = URL.createObjectURL(r.imagen);
            urlsAlbum.push(url);
            return { fecha: r.fecha, url };
        });
        albumVista.seleccion = albumVista.seleccion.filter((f) => albumVista.lista.some((x) => x.fecha === f));
        dibujarAlbum();
    } catch (error) {
        console.error(error);
        $("#album-contenido").innerHTML = `<p class="nota">⚠️ No se pudieron leer las fotos de este álbum.</p>
            <div class="botones-dialogo"><button type="button" class="boton boton-secundario" data-accion="cerrar">Cerrar</button></div>`;
    }
}

// Después de guardar o borrar una foto: poner al día lo que esté abierto.
function refrescarGaleria() {
    cargarPortadas();
    cargarAlbum();
}

function abrirGaleria() {
    galeriaAbierta = true;
    datosPortadas = null;
    const dialogo = $("#dialogo-fotos");
    $("#fotos-contenido").innerHTML = `<p class="nota">Cargando tus fotos…</p>`;
    dialogo.addEventListener("close", () => { galeriaAbierta = false; datosPortadas = null; urlsPortadas = soltar(urlsPortadas); }, { once: true });
    dialogo.showModal();
    cargarPortadas();
}

// La subventana de un álbum, encima de «Mis fotos».
function abrirAlbum(id) {
    albumVista = { id, lista: [], seleccion: [] };
    const dialogo = $("#dialogo-album");
    $("#album-contenido").innerHTML = `<p class="nota">Abriendo el álbum…</p>`;
    dialogo.addEventListener("close", () => {
        albumVista = null;
        urlsAlbum = soltar(urlsAlbum);
        cargarPortadas();   // por si cambió algo (una foto nueva o borrada)
    }, { once: true });
    dialogo.showModal();
    cargarAlbum();
}


// ===== Los botones =====

export const ACCIONES_FOTO = {
    "fotos-abrir": () => abrirGaleria(),
    "fotos-semanal": () => tomarFotoDeProgreso(),
    "fotos-nueva": () => tomarFotoDeProgreso(),
    "fotos-album": (boton) => abrirAlbum(boton.dataset.album),
    // Tocar una miniatura la elige; con dos elegidas se comparan; una tercera reemplaza a la más vieja de las dos.
    "fotos-elegir": (boton) => {
        const fecha = boton.dataset.fecha;
        if (albumVista.seleccion.includes(fecha)) albumVista.seleccion = albumVista.seleccion.filter((f) => f !== fecha);
        else albumVista.seleccion = [...albumVista.seleccion, fecha].slice(-2);
        dibujarAlbum(albumVista.seleccion.length > 0);
    },
    // «Antes y después»: la primera foto del álbum contra la última.
    "fotos-antes-despues": () => {
        const lista = albumVista.lista;
        if (lista.length < 2) return;
        albumVista.seleccion = [lista[0].fecha, lista[lista.length - 1].fecha];
        dibujarAlbum(true);
    },
    // Con UNA foto elegida: pasar a la más antigua (-1) o a la más reciente (+1).
    "fotos-mover": (boton) => {
        if (albumVista.seleccion.length !== 1) return;
        const i = albumVista.lista.findIndex((f) => f.fecha === albumVista.seleccion[0]);
        const vecina = albumVista.lista[i + Number(boton.dataset.paso)];
        if (!vecina) return;
        albumVista.seleccion = [vecina.fecha];
        dibujarAlbum(true);
    },
    "fotos-borrar": async (boton) => {
        if (!confirm("¿Borrar esta foto? No se puede recuperar.")) return;
        await fotos.borrarFoto(albumVista.id, boton.dataset.fecha);
        albumVista.seleccion = [];
        cargarAlbum();
    },
    "fotos-recordatorio": () => {
        ejecutar(() => acciones.configurarFotos(estado, { semanal: !estado.fotos.semanal }));
        dibujarPortadas();
    },
};
