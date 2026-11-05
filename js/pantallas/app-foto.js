// app-foto.js — Las fotos de progreso (v197): tomar la foto, guardarla y (v199) la galería estilo celular.
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
    if (g) cargar();   // si la galería está abierta, que muestre la foto nueva
}


// ===== La galería (v199): como la de un celular, con pestañas internas =====
// Pestañas: Fotos (todas juntas, con filtros y modo «seleccionar») · Álbumes (una portada por álbum) · Comparar (dos fotos lado a lado).
// Tocar una foto abre el visor (otra ventana, a pantalla completa) donde se desliza entre fotos.

const PALETA_ALBUMES = ["#34d399", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#2dd4bf"];   // colores de tus álbumes propios
const SIN_FILTROS = { album: "todas", periodo: "todo", favoritas: false, orden: "recientes" };

// La galería abierta (o null). Todo lo que necesita para dibujarse vive aquí:
//   pestana, filtro, seleccion { activa, marcadas: [claves] }, moviendo ("seleccion" | "visor" | null), picker ("a" | "b" | null),
//   comparar { a, b } (claves), lista (todas las fotos ya leídas), visor { claves, i } mientras el visor está abierto.
let g = null;
let cargaActual = 0;      // para ignorar una lectura vieja que terminó tarde
let visorConectado = false;

// El tema de un álbum: el ícono y el color del atributo de su misión. El de progreso es dorado; los tuyos, de la paleta.
function temaDe(id) {
    if (id === fotos.ALBUM_LIBRE) return { icono: "📈", color: "#fbbf24", nombre: "Progreso", etiqueta: "Tu evolución" };
    const propio = estado.fotos.albumes.findIndex((a) => a.id === id);
    if (propio >= 0) return { icono: "📁", color: PALETA_ALBUMES[propio % PALETA_ALBUMES.length], nombre: estado.fotos.albumes[propio].nombre, etiqueta: "Álbum tuyo" };
    const mision = estado.misiones.find((m) => String(m.id) === id);
    if (!mision) return { icono: "🖼️", color: "#94a3b8", nombre: "Misión borrada", etiqueta: "Sin misión" };
    const atributo = juego.infoAtributo(estado, mision.atributo, mision.atributoPropio);
    return { icono: atributo.icono, color: atributo.color, nombre: mision.nombre, etiqueta: atributo.nombre };
}

// Los álbumes con lo que se ve en su portada: el de progreso primero, luego los que tienen fotos (el más reciente arriba) y al final los vacíos.
function listarAlbumes() {
    const ids = new Set([fotos.ALBUM_LIBRE]);
    for (const m of estado.misiones) if (m.foto && !m.archivadaEn) ids.add(String(m.id));
    for (const a of estado.fotos.albumes) ids.add(a.id);
    for (const f of g.lista) ids.add(f.album);   // incluso de misiones ya archivadas o borradas
    const albumes = [...ids].map((id) => {
        const suyas = g.lista.filter((f) => f.album === id);
        const nueva = suyas.reduce((m, f) => (!m || f.fecha >= m.fecha ? f : m), null);
        const vieja = suyas.reduce((m, f) => (!m || f.fecha < m.fecha ? f : m), null);
        return { id, tema: temaDe(id), cuenta: suyas.length, primera: vieja?.fecha || null, ultima: nueva?.fecha || null, portada: nueva?.url || null };
    });
    const grupo = (a) => (a.id === fotos.ALBUM_LIBRE ? 0 : a.cuenta ? 1 : 2);
    return albumes.sort((a, b) => grupo(a) - grupo(b) || (b.ultima || "").localeCompare(a.ultima || ""));
}

const visibles = () => fotos.filtrarFotos(g.lista, g.filtro, hoy());
const porClave = (clave) => g.lista.find((f) => f.clave === clave) || null;

// Dibuja la galería con lo que ya se leyó (no vuelve a leer la base). conservarScroll: seguir donde estabas.
function dibujar(conservarScroll = true) {
    if (!g) return;
    const albumes = listarAlbumes();
    if (g.filtro.album !== "todas" && !albumes.some((a) => a.id === g.filtro.album)) g.filtro.album = "todas";
    const y = $("#fotos-contenido [data-galeria-cuerpo]")?.scrollTop || 0;
    $("#fotos-contenido").innerHTML = vistasFotos.contenidoGaleria({
        pestana: g.pestana, hoy: hoy(), semanal: estado.fotos.semanal, total: g.lista.length, albumes, fotos: visibles(),
        filtro: g.filtro, seleccion: g.seleccion, moviendo: g.moviendo === "seleccion", picker: g.picker, eligiendoAlbum: g.eligiendoAlbum,
        comparar: { a: porClave(g.comparar.a), b: porClave(g.comparar.b) },
    });
    const cuerpo = $("#fotos-contenido [data-galeria-cuerpo]");
    if (cuerpo && conservarScroll) cuerpo.scrollTop = y;
}

// Lee todas las fotos de la base y dibuja.
async function cargar() {
    if (!g) return;
    const version = ++cargaActual;
    try {
        const registros = await fotos.todasLasFotos();
        if (version !== cargaActual || !g) return;   // llegó tarde: ya hay una lectura más nueva
        for (const f of g.lista) URL.revokeObjectURL(f.url);
        g.lista = registros.map((r) => ({
            clave: r.clave, album: r.album, fecha: r.fecha, favorita: Boolean(r.favorita), url: URL.createObjectURL(r.imagen), tema: temaDe(r.album),
        }));
        // Lo que ya no existe (borrada o movida) sale de la selección y del comparador.
        g.seleccion.marcadas = g.seleccion.marcadas.filter(porClave);
        for (const hueco of ["a", "b"]) if (g.comparar[hueco] && !porClave(g.comparar[hueco])) g.comparar[hueco] = null;
        dibujar();
        if (g.visor) dibujarVisor();
    } catch (error) {
        console.error(error);
        $("#fotos-contenido").innerHTML = `<div class="galeria"><p class="nota">⚠️ No se pudieron leer las fotos de este teléfono.</p>
            <div class="botones-dialogo"><button type="button" class="boton boton-secundario" data-accion="cerrar">Cerrar</button></div></div>`;
    }
}

function abrirGaleria() {
    g = { pestana: "fotos", filtro: { ...SIN_FILTROS }, seleccion: { activa: false, marcadas: [] }, moviendo: null, picker: null,
          eligiendoAlbum: false, comparar: { a: null, b: null }, lista: [], visor: null };
    const dialogo = $("#dialogo-fotos");
    $("#fotos-contenido").innerHTML = `<div class="galeria"><p class="nota galeria-cargando">Cargando tus fotos…</p></div>`;
    dialogo.addEventListener("close", () => {
        if (g) for (const f of g.lista) URL.revokeObjectURL(f.url);
        g = null;
    }, { once: true });
    dialogo.showModal();
    cargar();
}


// ===== El visor de una foto =====

function dibujarVisor() {
    if (!g?.visor) return;
    const foto = porClave(g.visor.claves[g.visor.i]);
    if (!foto) { $("#dialogo-visor").close(); return; }
    $("#visor-contenido").innerHTML = vistasFotos.contenidoVisor({
        foto, indice: g.visor.i, total: g.visor.claves.length, albumes: listarAlbumes(), moviendo: g.moviendo === "visor",
    });
}

function abrirVisor(clave) {
    const claves = visibles().map((f) => f.clave);
    g.visor = { claves, i: Math.max(0, claves.indexOf(clave)) };
    const dialogo = $("#dialogo-visor");
    // Deslizar con el dedo a los lados pasa a la foto siguiente o a la anterior (se conecta una sola vez).
    if (!visorConectado) {
        visorConectado = true;
        const caja = $("#visor-contenido");
        let inicio = null;
        caja.addEventListener("pointerdown", (evento) => { inicio = evento.target.closest("[data-visor-lienzo]") ? evento.clientX : null; });
        caja.addEventListener("pointerup", (evento) => {
            if (inicio === null) return;
            const dx = evento.clientX - inicio;
            inicio = null;
            if (Math.abs(dx) > 50) moverVisor(dx < 0 ? 1 : -1);
        });
        caja.addEventListener("pointercancel", () => { inicio = null; });
    }
    dialogo.addEventListener("close", () => {
        if (!g) return;
        g.visor = null;
        if (g.moviendo === "visor") g.moviendo = null;
        dibujar();   // por si marcaste favoritas o cambió algo
    }, { once: true });
    dibujarVisor();
    dialogo.showModal();
}

function moverVisor(paso) {
    if (!g?.visor) return;
    const i = g.visor.i + paso;
    if (i < 0 || i >= g.visor.claves.length) return;
    g.visor.i = i;
    dibujarVisor();
}


// ===== Organizar: favoritas, mover y borrar =====

// Marca o quita la estrella de varias fotos (se actualiza en pantalla sin volver a leer la base).
async function ponerFavorita(lista, valor) {
    for (const f of lista) {
        f.favorita = valor;
        await fotos.marcarFavorita(f.album, f.fecha, valor);
    }
}

// Pasa las fotos a otro álbum. Si en el álbum de destino ya hay una foto de ese día, esa no se mueve.
async function moverA(lista, destino) {
    let movidas = 0;
    for (const f of lista) if (await fotos.moverFoto(f.album, f.fecha, destino)) movidas += 1;
    const falto = lista.length - movidas;
    avisar(movidas
        ? `📁 ${movidas === 1 ? "1 foto movida" : `${movidas} fotos movidas`}${falto ? `. ${falto} no: ya hay una foto de ese día en el álbum` : ""}`
        : "📁 No se movió: ya hay una foto de ese día en ese álbum");
}

// Las fotos a las que se aplica la acción: las elegidas en la galería, o la que se ve en el visor.
function objetivo(origen) {
    if (origen === "visor") return g.visor ? [porClave(g.visor.claves[g.visor.i])].filter(Boolean) : [];
    return g.seleccion.marcadas.map(porClave).filter(Boolean);
}

async function cambiarDeAlbum(destino) {
    const origen = g.moviendo;
    const lista = objetivo(origen);
    g.moviendo = null;
    g.seleccion = { activa: false, marcadas: [] };
    await moverA(lista, destino);
    if (origen === "visor") $("#dialogo-visor").close();
    await cargar();
}

async function borrar(lista) {
    for (const f of lista) await fotos.borrarFoto(f.album, f.fecha);
}

// «Álbum nuevo»: pide el nombre. Si venías de «Mover a…», mueve las fotos al álbum recién creado.
async function albumNuevo() {
    const nombre = prompt("¿Cómo se llama el álbum nuevo?");
    if (nombre === null) return;
    const album = ejecutar(() => acciones.crearAlbumDeFotos(estado, nombre));
    if (!album) return;
    if (g.moviendo) await cambiarDeAlbum(album.id);
    else dibujar();
}


// ===== Los botones =====

const siguiente = (lista, actual) => lista[(lista.findIndex((x) => x.id === actual) + 1) % lista.length].id;

export const ACCIONES_FOTO = {
    "fotos-abrir": () => abrirGaleria(),
    "fotos-semanal": () => tomarFotoDeProgreso(),
    "fotos-nueva": () => tomarFotoDeProgreso(),

    // Las pestañas de adentro.
    "fotos-pestana": (boton) => {
        g.pestana = boton.dataset.pestana;
        g.eligiendoAlbum = false;
        g.seleccion = { activa: false, marcadas: [] };
        g.picker = null;
        dibujar(false);
    },

    // Filtros y orden.
    "fotos-album-elegir": () => { g.eligiendoAlbum = true; dibujar(); },
    "fotos-hoja-cerrar": () => { g.eligiendoAlbum = false; dibujar(); },
    "fotos-filtro-album": (boton) => { g.filtro.album = boton.dataset.album; g.eligiendoAlbum = false; dibujar(false); },
    "fotos-filtro-periodo": () => { g.filtro.periodo = siguiente(fotos.PERIODOS, g.filtro.periodo); dibujar(false); },
    "fotos-filtro-orden": () => { g.filtro.orden = siguiente(fotos.ORDENES, g.filtro.orden); dibujar(false); },
    "fotos-filtro-favoritas": () => { g.filtro.favoritas = !g.filtro.favoritas; dibujar(false); },
    "fotos-quitar-filtros": () => { g.filtro = { ...SIN_FILTROS }; dibujar(false); },
    "fotos-ver-album": (boton) => {   // desde la pestaña Álbumes: ver sus fotos
        g.filtro = { ...SIN_FILTROS, album: boton.dataset.album };
        g.pestana = "fotos";
        dibujar(false);
    },

    // Seleccionar varias fotos.
    "fotos-seleccionar": () => {
        g.seleccion = { activa: !g.seleccion.activa, marcadas: [] };
        dibujar();
    },

    // Tocar una foto: según el momento, la elige para un hueco del comparador, la marca o la abre.
    "fotos-tocar": (boton) => {
        const clave = boton.dataset.clave;
        if (g.picker) {
            g.comparar[g.picker] = clave;
            g.picker = null;
            g.pestana = "comparar";
            dibujar(false);
        } else if (g.seleccion.activa) {
            const marcadas = g.seleccion.marcadas;
            g.seleccion.marcadas = marcadas.includes(clave) ? marcadas.filter((c) => c !== clave) : [...marcadas, clave];
            dibujar();
        } else {
            abrirVisor(clave);
        }
    },

    // Comparar.
    "fotos-comparar-hueco": (boton) => { g.picker = boton.dataset.hueco; g.pestana = "fotos"; dibujar(false); },
    "fotos-picker-cancelar": () => { g.picker = null; g.pestana = "comparar"; dibujar(false); },
    "fotos-comparar-extremos": () => {
        const lista = visibles().sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));
        if (lista.length < 2) return;
        g.comparar = { a: lista[0].clave, b: lista[lista.length - 1].clave };
        dibujar(false);
    },
    "fotos-comparar-cambiar": () => { g.comparar = { a: g.comparar.b, b: g.comparar.a }; dibujar(false); },
    "fotos-comparar-marcadas": () => {
        const dos = g.seleccion.marcadas.map(porClave).filter(Boolean).sort((x, y) => (x.fecha < y.fecha ? -1 : 1));
        if (dos.length !== 2) return;
        g.comparar = { a: dos[0].clave, b: dos[1].clave };
        g.seleccion = { activa: false, marcadas: [] };
        g.pestana = "comparar";
        dibujar(false);
    },
    // Desde el visor: la foto que ves pasa a «Antes» (si está libre) o a «Después».
    "fotos-comparar-visor": () => {
        const clave = g.visor.claves[g.visor.i];
        if (!g.comparar.a || g.comparar.b) g.comparar.a = clave;
        else g.comparar.b = clave;
        g.pestana = "comparar";
        $("#dialogo-visor").close();   // al cerrarse, la galería se vuelve a dibujar
        avisar("↔️ Foto puesta en el comparador");
    },

    // Favoritas.
    "fotos-favorita-visor": async () => {
        const f = porClave(g.visor.claves[g.visor.i]);
        if (!f) return;
        await ponerFavorita([f], !f.favorita);
        dibujarVisor();
    },
    "fotos-favorita-marcadas": async () => {
        const lista = g.seleccion.marcadas.map(porClave).filter(Boolean);
        await ponerFavorita(lista, !lista.every((f) => f.favorita));   // si todas ya lo eran, se quitan
        g.seleccion = { activa: false, marcadas: [] };
        dibujar();
    },

    // Mover a otro álbum.
    "fotos-mover-abrir": (boton) => {
        g.moviendo = boton.dataset.origen;
        if (g.moviendo === "visor") dibujarVisor(); else dibujar();
    },
    "fotos-mover-cancelar": () => {
        const origen = g.moviendo;
        g.moviendo = null;
        if (origen === "visor") dibujarVisor(); else dibujar();
    },
    "fotos-mover-a": (boton) => cambiarDeAlbum(boton.dataset.album),

    // Álbumes propios.
    "fotos-album-nuevo": () => albumNuevo(),
    "fotos-album-borrar": (boton) => {
        if (!confirm("¿Borrar este álbum vacío?")) return;
        if (ejecutar(() => acciones.borrarAlbumDeFotos(estado, boton.dataset.album))) {
            g.filtro = { ...SIN_FILTROS };
            dibujar(false);
        }
    },

    // Borrar.
    "fotos-borrar-marcadas": async () => {
        const lista = g.seleccion.marcadas.map(porClave).filter(Boolean);
        if (!lista.length || !confirm(`¿Borrar ${lista.length === 1 ? "esta foto" : `estas ${lista.length} fotos`}? No se puede recuperar.`)) return;
        await borrar(lista);
        g.seleccion = { activa: false, marcadas: [] };
        await cargar();
    },
    "fotos-borrar-visor": async () => {
        const f = porClave(g.visor.claves[g.visor.i]);
        if (!f || !confirm("¿Borrar esta foto? No se puede recuperar.")) return;
        await borrar([f]);
        g.visor.claves.splice(g.visor.i, 1);
        g.visor.i = Math.min(g.visor.i, g.visor.claves.length - 1);
        if (!g.visor.claves.length) { $("#dialogo-visor").close(); await cargar(); return; }
        await cargar();   // vuelve a leer y, al terminar, redibuja el visor con la foto que quedó
    },

    "fotos-visor-mover": (boton) => moverVisor(Number(boton.dataset.paso)),
    "fotos-recordatorio": () => {
        ejecutar(() => acciones.configurarFotos(estado, { semanal: !estado.fotos.semanal }));
        dibujar();
    },
};
