// app.js — El "director" de la app.
//
// 1. Carga la partida y muestra la pantalla correcta.
// 2. Escucha los toques en botones y los envíos de formularios.
// 3. Llama a la acción que corresponde (acciones.js), guarda (datos.js)
//    y vuelve a dibujar (vistas.js).
// 4. Muestra las animaciones y celebraciones.

import * as datos from "./datos.js";
import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import { hoy, fechaLegible, diasEntre } from "./fechas.js";


// ===== Estado de la app =====
let estado = datos.cargar();     // la partida completa
let pantallaActual = "hoy";      // qué pestaña se está viendo
let diaSeleccionado = null;      // día tocado en el calendario

// Atajo: $("#algo") es lo mismo que document.querySelector("#algo")
const $ = (selector) => document.querySelector(selector);

// Qué función dibuja cada pantalla.
const DIBUJAR = {
    hoy: vistas.pantallaHoy,
    progreso: vistas.pantallaProgreso,
    aventuras: vistas.pantallaAventuras,
    logros: vistas.pantallaLogros,
    tienda: vistas.pantallaTienda,
};


// ===== Arranque =====
// iniciar() se llama al FINAL de este archivo, cuando ya existen todas
// las variables (const/let) que usa. Los scripts "module" se ejecutan
// cuando el HTML ya está cargado.

function iniciar() {
    datos.pedirAlmacenamientoPersistente();
    registrarServiceWorker();
    rellenarOpciones();
    conectarEventos();

    if (estado.personaje) {
        entrarAlJuego();
    } else {
        $("#crear-personaje").hidden = false;
    }
}

function entrarAlJuego() {
    $("#crear-personaje").hidden = true;
    $("#juego").hidden = false;
    refrescar();
    revisarAlAbrir();
}

// Al abrir (o volver a) la app: bonus de regreso y aviso de escudos usados.
function revisarAlAbrir() {
    ejecutar(() => {
        const celebraciones = [
            ...(acciones.registrarVisita(estado)?.celebraciones || []),
            ...(acciones.revisarEscudosUsados(estado)?.celebraciones || []),
        ];
        return { celebraciones };
    });
}

// El service worker guarda los archivos en el teléfono para que la app funcione sin internet.
function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {
            // Si falla (ej: abriendo el archivo directo), la app igual funciona con internet.
        });
    }
}


// ===== Ejecutar una acción =====
// Todas las acciones pasan por aquí: así guardar, redibujar y celebrar
// se hace siempre igual, sin repetir código.
function ejecutar(accion, efectos = {}) {
    const antes = acciones.foto(estado);
    let resultado;
    try {
        resultado = accion() || {};
    } catch (error) {
        alert(error.message);   // ej: "Ya completaste esta misión hoy."
        return null;
    }

    const celebraciones = [
        ...(resultado.celebraciones || []),
        ...acciones.revisarCambios(estado, antes),
    ];
    datos.guardar(estado);

    const subioNivel = celebraciones.some((c) => c.tipo === "nivel");
    refrescar({ ...efectos, subioNivel });
    celebraciones.forEach(celebrar);
    return resultado;
}


// ===== Dibujar =====

function refrescar(efectos = {}) {
    actualizarCabecera(efectos.subioNivel);
    dibujarPantalla(efectos);
}

function actualizarCabecera(subioNivel) {
    const personaje = estado.personaje;
    const nivel = juego.calcularNivel(personaje.xp);

    // Array.from separa bien los emojis (si el nombre empieza con uno).
    $("#cab-avatar").textContent = Array.from(personaje.nombre)[0].toUpperCase();
    $("#cab-nombre").textContent = personaje.nombre;
    $("#cab-xp").textContent = `${nivel.xpEnNivel} / ${nivel.xpNecesaria} XP`;
    $("#cab-monedas").textContent = personaje.monedas;

    const numeroNivel = $("#cab-nivel");
    if (numeroNivel.textContent !== String(nivel.nivel)) {
        const yaTeniaNumero = numeroNivel.textContent !== "";
        numeroNivel.textContent = nivel.nivel;
        if (yaTeniaNumero) reproducirAnimacion(numeroNivel, "pulso");
    }

    moverBarra($("#cab-barra"), nivel.porcentaje, subioNivel);
}

// Mueve la barra de XP. Al subir de nivel, primero la llena y luego la vacía.
function moverBarra(barra, porcentaje, subioNivel) {
    if (!subioNivel) {
        barra.style.width = `${porcentaje}%`;
        return;
    }
    barra.style.width = "100%";
    setTimeout(() => {
        barra.style.transition = "none";   // vaciar sin animación
        barra.style.width = "0%";
        barra.offsetWidth;                 // obliga al navegador a aplicar el cambio ya
        barra.style.transition = "";       // vuelve la animación del CSS
        barra.style.width = `${porcentaje}%`;
    }, 700);
}

function dibujarPantalla(efectos = {}) {
    const fecha = hoy();
    const contexto = {
        hoy: fecha,
        info: juego.resumen(estado, fecha),
        diaSeleccionado,
        recordarRespaldo: necesitaRespaldo(fecha),
        ...efectos,   // ej: { recienHecha: 3 } para animar la misión 3
    };

    const contenedor = $(`#pantalla-${pantallaActual}`);
    contenedor.innerHTML = DIBUJAR[pantallaActual](estado, contexto);

    if (pantallaActual === "progreso" && !efectos.mantenerScroll) {
        // El calendario empieza mostrando las semanas más recientes (a la derecha).
        const scroll = $("#calendario-scroll");
        scroll.scrollLeft = scroll.scrollWidth;
    }
}

// Recordar la copia de seguridad: después de 7 días de juego, si nunca
// la hiciste o pasó más de un mes desde la última.
function necesitaRespaldo(fecha) {
    if (diasEntre(estado.personaje.creadoEn, fecha) < 7) return false;
    return !estado.ultimoRespaldo || diasEntre(estado.ultimoRespaldo, fecha) > 30;
}

// Muestra la sección elegida y marca su pestaña (sin dibujar el contenido).
function mostrarSeccion(nombre) {
    pantallaActual = nombre;
    for (const seccion of document.querySelectorAll(".pantalla")) {
        seccion.hidden = seccion.id !== `pantalla-${nombre}`;
    }
    for (const pestana of document.querySelectorAll(".pestana")) {
        if (pestana.dataset.pantalla === nombre) pestana.setAttribute("aria-current", "page");
        else pestana.removeAttribute("aria-current");
    }
}

function cambiarPantalla(nombre) {
    mostrarSeccion(nombre);
    dibujarPantalla();
    window.scrollTo(0, 0);
}


// ===== Animaciones y celebraciones =====

// Texto que sube y se desvanece sobre un elemento (ej: "+25 XP").
function flotar(selector, texto, negativo = false) {
    const elemento = $(selector);
    if (!elemento) return;
    const etiqueta = document.createElement("span");
    etiqueta.className = negativo ? "flotante negativo" : "flotante";
    etiqueta.textContent = texto;
    elemento.appendChild(etiqueta);
    etiqueta.addEventListener("animationend", () => etiqueta.remove());
}

function flotarXp(selector, xp) {
    if (xp) flotar(selector, xp > 0 ? `+${xp} XP` : `${xp} XP`, xp < 0);
}

// Pone una clase de animación CSS y la quita al terminar, para poder repetirla.
function reproducirAnimacion(elemento, clase) {
    elemento.classList.remove(clase);
    elemento.offsetWidth; // truco para "reiniciar" la animación
    elemento.classList.add(clase);
    elemento.addEventListener("animationend", () => elemento.classList.remove(clase), { once: true });
}

// Las celebraciones grandes se muestran una tras otra (en cola).
const cola = [];
let temporizadorCelebracion = null;

function celebrar(celebracion) {
    if (celebracion.pequena) {
        avisar(`${celebracion.icono} ${celebracion.titulo}`);
        return;
    }
    cola.push(celebracion);
    if ($("#celebracion").hidden) siguienteCelebracion();
}

function siguienteCelebracion() {
    clearTimeout(temporizadorCelebracion);
    const capa = $("#celebracion");
    const celebracion = cola.shift();
    if (!celebracion) {
        capa.hidden = true;
        return;
    }
    $("#cel-icono").textContent = celebracion.icono;
    $("#cel-etiqueta").textContent = celebracion.etiqueta;
    $("#cel-titulo").textContent = celebracion.titulo;
    $("#cel-detalle").textContent = celebracion.detalle || "";
    capa.hidden = false;
    reproducirAnimacion($(".celebracion-caja"), "entrar");
    temporizadorCelebracion = setTimeout(siguienteCelebracion, 3200);
}

// Aviso pequeño abajo de la pantalla.
let temporizadorAviso = null;
function avisar(texto) {
    const aviso = $("#aviso");
    // Si hay una ventana abierta, el aviso se mete dentro para que se vea encima.
    (document.querySelector("dialog[open]") || document.body).appendChild(aviso);
    aviso.textContent = texto;
    aviso.hidden = false;
    reproducirAnimacion(aviso, "entrar");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { aviso.hidden = true; }, 2600);
}


// ===== Ventanas (diálogos) =====

// Crea las "píldoras" de dificultad y atributo a partir de juego.js
// (así, si cambias la XP allá, aquí se actualiza solo).
function rellenarOpciones() {
    for (const grupo of document.querySelectorAll('[data-opciones="dificultad"]')) {
        grupo.insertAdjacentHTML("beforeend", Object.entries(juego.DIFICULTADES).map(([clave, d]) => `
            <label class="pildora dificultad-${clave}">
                <input type="radio" name="dificultad" value="${clave}" ${clave === "normal" ? "checked" : ""}>
                <span>${d.nombre}<small>+${d.xp} XP</small></span>
            </label>`).join(""));
    }
    for (const grupo of document.querySelectorAll('[data-opciones="atributo"]')) {
        grupo.insertAdjacentHTML("beforeend", Object.entries(juego.ATRIBUTOS).map(([clave, a], i) => `
            <label class="pildora" style="--color-dificultad: ${a.color}">
                <input type="radio" name="atributo" value="${clave}" ${i === 0 ? "checked" : ""}>
                <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
            </label>`).join(""));
    }
    $("#logro-tipo").innerHTML = Object.entries(juego.TIPOS_LOGRO)
        .map(([clave, t]) => `<option value="${clave}">${t.texto}</option>`).join("");

    const d = juego.DIFICULTADES;
    const p = juego.PREMIOS;
    $("#reglas").innerHTML = `
        <p><strong>Misiones diarias:</strong> Fácil +${d.facil.xp} XP · Normal +${d.normal.xp} XP · Difícil +${d.dificil.xp} XP. También dan monedas y suben su atributo.</p>
        <p><strong>Niveles:</strong> pasar del nivel N al N+1 cuesta ${juego.BASE_PERSONAJE}×N XP. Cada atributo sube con ${juego.BASE_ATRIBUTO}×N XP.</p>
        <p><strong>Rachas:</strong> un día cuenta si completas al menos 1 misión. Cada ${juego.ESCUDOS.diasParaGanar} días seguidos ganas un escudo (máx. ${juego.ESCUDOS.maximo}) que salva tu racha si fallas un día.</p>
        <p><strong>Bonus de regreso:</strong> si vuelves tras ${juego.REGRESO.diasMinimos} días o más, ganas ${juego.REGRESO.xpPorDia} XP por día ausente (máx. ${juego.REGRESO.xpMaximo}).</p>
        <p><strong>Misiones principales:</strong> +${p.submision.xp} XP por paso y +${p.principal.xp} XP al terminar.</p>
        <p><strong>Jefes:</strong> +${p.golpe.xp} XP por golpe y +${p.jefe.xp} XP al derrotarlo.</p>
        <p><strong>Días perfectos:</strong> completar todas tus misiones diarias del día.</p>`;
}

// Preparativos especiales al abrir algunas ventanas.
const PREPARAR = {
    logro() {
        const activas = estado.misiones.filter((m) => !m.archivadaEn);
        $("#logro-mision").innerHTML = activas.length
            ? activas.map((m) => `<option value="${m.id}">${vistas.esc(m.nombre)}</option>`).join("")
            : '<option value="">(primero crea una misión diaria)</option>';
        mostrarCamposLogro();
    },
    ajustes() {
        $("#ajustes-nombre").value = estado.personaje.nombre;
        $("#ajustes-ultimo-respaldo").textContent = estado.ultimoRespaldo
            ? `Última copia: ${fechaLegible(estado.ultimoRespaldo)}.`
            : "Todavía no has hecho ninguna copia.";
    },
};

function abrirDialogo(nombre) {
    const dialogo = $(`#dialogo-${nombre}`);
    for (const formulario of dialogo.querySelectorAll("form")) formulario.reset();
    PREPARAR[nombre]?.();
    dialogo.showModal();
}

// En el logro, mostrar el campo extra según el tipo de condición.
function mostrarCamposLogro() {
    const campo = juego.TIPOS_LOGRO[$("#logro-tipo").value].campo;
    $("#campo-mision").hidden = campo !== "mision";
    $("#campo-atributo").hidden = campo !== "atributo";
}


// ===== Copia de seguridad =====

async function exportar() {
    const nombre = `vida-rpg-${hoy()}.json`;
    const archivo = new File([datos.textoRespaldo(estado)], nombre, { type: "application/json" });

    try {
        if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
            // En el iPhone abre el menú de compartir: elige «Guardar en Archivos».
            await navigator.share({ files: [archivo], title: "Copia de Vida RPG" });
        } else {
            // En la compu: descarga el archivo.
            const enlace = document.createElement("a");
            enlace.href = URL.createObjectURL(archivo);
            enlace.download = nombre;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
        }
    } catch (error) {
        if (error.name === "AbortError") return; // cerraste el menú sin guardar
        alert("No se pudo exportar la copia.");
        return;
    }
    estado.ultimoRespaldo = hoy();
    datos.guardar(estado);
    PREPARAR.ajustes();
    dibujarPantalla();
    avisar("💾 Copia de seguridad lista");
}

async function importar(archivo) {
    try {
        const nuevo = datos.desdeRespaldo(await archivo.text());
        const seguro = confirm(`¿Reemplazar tu partida actual por la copia de «${nuevo.personaje.nombre}»? Lo que tienes ahora se perderá.`);
        if (!seguro) return;
        estado = nuevo;
        datos.guardar(estado);
        $("#dialogo-ajustes").close();
        refrescar();
        avisar("📥 Copia importada");
    } catch (error) {
        alert(error.message);
    }
}

function borrarTodo() {
    if (!confirm("¿Seguro? Se borrará TODO tu progreso de este teléfono.")) return;
    if (!confirm("Última oportunidad: esto no se puede deshacer. ¿Borrar todo?")) return;
    datos.borrarTodo();
    estado = datos.estadoInicial();
    diaSeleccionado = null;
    $("#dialogo-ajustes").close();
    $("#juego").hidden = true;
    $("#cab-nivel").textContent = "";
    mostrarSeccion("hoy");
    $("#crear-personaje form").reset();
    $("#crear-personaje").hidden = false;
}


// ===== Toques en botones =====
// En vez de poner un "listener" en cada botón, escuchamos TODOS los toques
// en el documento y miramos el data-accion del botón tocado.
// Así funciona también con los botones que se dibujan después.

const ACCIONES = {
    ir: (boton) => cambiarPantalla(boton.dataset.pantalla),
    abrir: (boton) => abrirDialogo(boton.dataset.dialogo),
    cerrar: (boton) => boton.closest("dialog").close(),

    "alternar-mision": (boton) => {
        const id = Number(boton.dataset.id);
        const estabaHecha = boton.getAttribute("aria-pressed") === "true";
        const resultado = estabaHecha
            ? ejecutar(() => acciones.desmarcarMision(estado, id))
            : ejecutar(() => acciones.completarMision(estado, id), { recienHecha: id });
        if (resultado) flotarXp(`.mision[data-id="${id}"]`, resultado.xp);
    },
    "archivar-mision": (boton) => {
        if (confirm("¿Archivar esta misión? Dejará de aparecer, pero su historial se guarda.")) {
            ejecutar(() => acciones.archivarMision(estado, Number(boton.dataset.id)));
        }
    },

    "alternar-submision": (boton) => {
        const id = Number(boton.dataset.id);
        const resultado = ejecutar(() => acciones.alternarSubmision(estado, id, Number(boton.dataset.sub)));
        if (resultado) flotarXp(`.tarjeta[data-id="${id}"]`, resultado.xp);
    },
    "borrar-submision": (boton) => {
        ejecutar(() => acciones.borrarSubmision(estado, Number(boton.dataset.id), Number(boton.dataset.sub)));
    },
    "archivar-principal": (boton) => {
        if (confirm("¿Archivar esta misión principal?")) {
            ejecutar(() => acciones.archivarPrincipal(estado, Number(boton.dataset.id)));
        }
    },

    "deshacer-golpe": (boton) => {
        const id = Number(boton.dataset.id);
        const resultado = ejecutar(() => acciones.deshacerGolpe(estado, id));
        if (resultado) flotarXp(`.jefe[data-id="${id}"]`, resultado.xp);
    },
    "archivar-jefe": (boton) => {
        if (confirm("¿Archivar este jefe?")) {
            ejecutar(() => acciones.archivarJefe(estado, Number(boton.dataset.id)));
        }
    },

    "borrar-logro": (boton) => {
        if (confirm("¿Borrar este logro?")) {
            ejecutar(() => acciones.borrarLogro(estado, Number(boton.dataset.id)));
        }
    },

    canjear: (boton) => {
        const recompensa = estado.recompensas.find((r) => r.id === Number(boton.dataset.id));
        if (recompensa && confirm(`¿Canjear «${recompensa.nombre}» por ${recompensa.costo} monedas?`)) {
            ejecutar(() => acciones.canjear(estado, recompensa.id));
        }
    },
    "borrar-recompensa": (boton) => {
        if (confirm("¿Quitar esta recompensa de la tienda?")) {
            ejecutar(() => acciones.borrarRecompensa(estado, Number(boton.dataset.id)));
        }
    },

    // Tocar un día del calendario: solo cambia el detalle (sin redibujar todo,
    // para no perder la posición del scroll).
    "ver-dia": (boton) => {
        diaSeleccionado = boton.dataset.fecha;
        document.querySelector(".celda.elegido")?.classList.remove("elegido");
        boton.classList.add("elegido");
        const racha = juego.calcularRacha(estado, hoy());
        $("#cal-detalle").innerHTML = vistas.detalleDia(estado, diaSeleccionado, racha);
    },

    exportar: () => exportar(),
    importar: () => $("#archivo-respaldo").click(),
    "borrar-todo": () => borrarTodo(),
};


// ===== Formularios =====
// Cada formulario tiene data-form="...". Recibimos sus valores como objeto:
// { nombre: "Ir al gym", dificultad: "dificil", ... }

const FORMULARIOS = {
    personaje(valores) {
        try {
            acciones.crearPersonaje(estado, valores.nombre);
        } catch (error) {
            alert(error.message);
            return false;
        }
        datos.guardar(estado);
        entrarAlJuego();
        return true;
    },
    mision: (valores) => ejecutar(() => acciones.crearMision(estado, valores)),
    principal: (valores) => ejecutar(() => acciones.crearPrincipal(estado, valores)),
    jefe: (valores) => ejecutar(() => acciones.crearJefe(estado, valores)),
    logro: (valores) => ejecutar(() => acciones.crearLogro(estado, valores)),
    recompensa: (valores) => ejecutar(() => acciones.crearRecompensa(estado, valores)),
    renombrar(valores) {
        const resultado = ejecutar(() => acciones.renombrar(estado, valores.nombre));
        if (resultado) avisar("✏️ Nombre actualizado");
        return false; // no cerrar la ventana de ajustes
    },
    submision: (valores, formulario) =>
        ejecutar(() => acciones.agregarSubmision(estado, Number(formulario.dataset.id), valores.nombre)),
    atacar(valores, formulario) {
        const id = Number(formulario.dataset.id);
        const resultado = ejecutar(() => acciones.atacarJefe(estado, id, valores.dano), { golpeado: id });
        if (resultado) flotar(`.jefe[data-id="${id}"]`, `−${resultado.dano} HP`, true);
        return resultado;
    },
};


// ===== Conectar eventos =====

function conectarEventos() {
    document.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-accion]");
        if (boton && !boton.disabled) ACCIONES[boton.dataset.accion]?.(boton);
    });

    document.addEventListener("submit", (evento) => {
        const formulario = evento.target;
        const tipo = formulario.dataset.form;
        if (!tipo) return;
        evento.preventDefault(); // no recargar la página
        const valores = Object.fromEntries(new FormData(formulario));
        const salioBien = FORMULARIOS[tipo](valores, formulario);
        const dialogo = formulario.closest("dialog");
        if (salioBien && dialogo && tipo !== "renombrar") dialogo.close();
    });

    // Cerrar una ventana tocando fuera de ella (en el fondo oscuro).
    for (const dialogo of document.querySelectorAll("dialog")) {
        dialogo.addEventListener("click", (evento) => {
            if (evento.target === dialogo) dialogo.close();
        });
    }

    $("#logro-tipo").addEventListener("change", mostrarCamposLogro);

    $("#archivo-respaldo").addEventListener("change", (evento) => {
        const archivo = evento.target.files[0];
        evento.target.value = ""; // permite elegir el mismo archivo otra vez
        if (archivo) importar(archivo);
    });

    $("#celebracion").addEventListener("click", siguienteCelebracion);

    // Al volver a la app (el iPhone la deja abierta en segundo plano):
    // redibujar por si cambió el día y revisar el bonus de regreso.
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && estado.personaje) {
            refrescar();
            revisarAlAbrir();
        }
    });
}


// ¡A jugar!
iniciar();
