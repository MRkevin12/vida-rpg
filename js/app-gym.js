// app-gym.js — Los botones y formularios del gimnasio (gym-…).
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as gym from "./gym.js";
import { hoy, sumarDias } from "./fechas.js";
import { estado, ui, subvista, ejecutar, dibujarPantalla, cambiarPantalla, $ } from "./app.js";
import { sonar } from "./app-efectos.js";
import { dialogoSeguirGym, dialogoCambiarEjercicio, dialogoDiscos, dialogoCorregirSesion } from "./vistas-gym.js";
import { esc } from "./vistas-comun.js";

// (v164) Al abrir la app con un entrenamiento a medias: «¿Continuar el entrenamiento?».
// (La sesión en curso ya se guarda en cada serie y en cada número que cambias; esto solo te lo recuerda.)
export function ofrecerSeguirGym() {
    if (!estado.gym?.encurso) return;
    const dialogo = $("#dialogo-gym");
    if (!dialogo) return;
    dialogo.innerHTML = dialogoSeguirGym(estado, hoy());
    if (!dialogo.open) dialogo.showModal();
}

// ===== (v165) Aurelio con vida: escribe a mano, reacciona y llega caminando =====
// animarAurelio() se llama al final de cada dibujarPantalla. Redibujar la pantalla (un + o un −) no repite nada:
// lo suyo solo ocurre cuando hay una frase NUEVA (o un entrenamiento nuevo).
const sinMovimiento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const MS_POR_LETRA = 28;
let temporizadorDeTexto = null;
let ultimaEscrita = null;     // la frase que ya se escribió (o se está escribiendo)
let ultimaReaccion = null;    // la frase a la que ya reaccionó Aurelio en la escena

// La reacción de su figura según la frase: un récord es un salto doble con destello; terminar un ejercicio, un salto grande.
const REACCION_DE_FRASE = { record: "record", ejercicio: "ejercicio", ejercicioFinal: "ejercicio", ultima: "ejercicio", fin: "ejercicio" };

function escribirALetras(elemento) {
    const texto = elemento.textContent;
    let hechas = 0;
    const pintar = () => {
        // Lo escrito se ve; lo que falta ocupa su lugar pero está transparente (así la burbuja no cambia de tamaño mientras escribe).
        elemento.innerHTML = `<span>${esc(texto.slice(0, hechas))}</span><span class="falta">${esc(texto.slice(hechas))}</span>`;
    };
    const terminar = () => { clearInterval(temporizadorDeTexto); temporizadorDeTexto = null; elemento.textContent = texto; };
    pintar();
    temporizadorDeTexto = setInterval(() => {
        hechas += 1;
        if (hechas >= texto.length || !elemento.isConnected) terminar();
        else pintar();
    }, MS_POR_LETRA);
    // Tocar el globo completa la frase de golpe.
    elemento.closest(".gym-aurelio")?.addEventListener("click", terminar, { once: true });
}

export function animarAurelio() {
    const frase = ui.fraseGym;
    if (!frase) { ultimaEscrita = null; ultimaReaccion = null; }
    if (!estado.gym.encurso) ui.aurelioEntra = false;
    const quieto = sinMovimiento();

    // 1. Llega caminando (solo al empezar el entrenamiento) y, si pasó algo nuevo, reacciona.
    const figura = document.querySelector("[data-aurelio-figura]");
    if (figura && !quieto) {
        if (ui.aurelioEntra) { figura.classList.add("entra"); ui.aurelioEntra = false; }
        else if (frase && frase.texto !== ultimaReaccion) figura.classList.add(`reacciona-${REACCION_DE_FRASE[frase.tipo] || "serie"}`);
        if (frase) ultimaReaccion = frase.texto;
    }

    // 2. El símbolo sobre su cabeza aparece de golpe cuando la frase es nueva.
    const nueva = frase && frase.texto !== ultimaEscrita;
    if (nueva && !quieto) for (const emote of document.querySelectorAll("[data-aurelio-emote]")) emote.classList.add("nuevo");

    // 3. La frase se escribe letra por letra (una sola vez).
    const elemento = document.querySelector("[data-aurelio-texto]");
    if (!elemento) { clearInterval(temporizadorDeTexto); temporizadorDeTexto = null; return; }
    if (nueva) {
        clearInterval(temporizadorDeTexto);
        ultimaEscrita = frase.texto;
        if (!quieto && frase.texto.length) escribirALetras(elemento);
    }
}

// (v166) Los diálogos del gym (cambiar ejercicio, calculadora de discos y corregir una sesión) usan la ventana #dialogo-gym.
function mostrarDialogoGym(html) {
    const dialogo = $("#dialogo-gym");
    if (!dialogo) return;
    dialogo.innerHTML = html;
    if (!dialogo.open) dialogo.showModal();
}
// Calculadora de discos: el peso que se está viendo (se cambia con los botones + y −).
function mostrarDiscos() { mostrarDialogoGym(dialogoDiscos(estado, ui.discosKg || 0)); }

export let gymVista = null;               // (v75) la vista previa del cuerpo en el gimnasio: { fisico, corp } o null

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_GYM = {
    // El gimnasio (v66). Ver gym.js, vistas-gym.js y el final de acciones.js.
    "gym-empezar": (boton) => {
        const fecha = boton.dataset.ayer ? sumarDias(hoy(), -1) : hoy();
        const empezo = ejecutar(() => acciones.empezarGym(estado, boton.dataset.rutina, fecha));
        if (!empezo) return;
        ui.descansoGym = null;
        ui.resumenGym = null;
        ui.aurelioEntra = true;   // (v165) Aurelio llega caminando a la escena
        subvista.gym = "entrenar";
        if (empezo.frase) { ui.fraseGym = empezo.frase; sonar("campana"); dibujarPantalla(); }
        window.scrollTo(0, 0);
    },
    // (v75) La vista previa del cuerpo: elegir un nivel de físico o un peso, o volver al cuerpo real.
    "gym-vista": (boton) => {
        const d = boton.dataset;
        if (d.quitar) gymVista = null;
        else {
            const real = { fisico: gym.fisicoDe(gym.nivelDeGym(estado.gym.sesiones).nivel), corp: gym.corpulenciaDe(gym.imcActual(estado.gym)) };
            gymVista = { ...real, ...(gymVista || {}) };
            if (d.fisico !== undefined) gymVista.fisico = Number(d.fisico);
            if (d.corp !== undefined) gymVista.corp = Number(d.corp);
        }
        dibujarPantalla({ mantenerScroll: true });
    },
    // La meta que se marca: «hoy entrené» sin anotar series.
    "gym-rapido": (boton) => {
        const fecha = boton.dataset.ayer ? sumarDias(hoy(), -1) : hoy();
        const rutina = boton.dataset.rutina === "toca" ? gym.siguienteRutina(estado.gym.sesiones).id : boton.dataset.rutina;
        const marcado = ejecutar(() => acciones.marcarGymRapido(estado, rutina, fecha), { mantenerScroll: true });
        if (marcado) {
            sonar("completar");
            ui.resumenGym = marcado.sesion;
            subvista.gym = "entrenar";
            ui.fraseGym = { tipo: "marcado", texto: marcado.celebraciones[0]?.maestro || "" };
            dibujarPantalla({ mantenerScroll: true });
        }
    },
    "gym-serie": (boton) => {
        const resultado = ejecutar(() => {
            const r = acciones.marcarSerieGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie));
            // Al terminar una serie empieza el descanso; al desmarcarla, se quita.
            const segundos = r.cal ? gym.DESCANSO_CALENTAMIENTO : estado.gym.descanso;   // (v166) tras calentar se descansa poco
            ui.descansoGym = r.hecha ? { fin: Date.now() + segundos * 1000, total: segundos * 1000 } : null;
            if (r.frase) ui.fraseGym = r.frase;
            return r;
        }, { mantenerScroll: true });
        if (resultado) {
            sonar(resultado.hecha ? "pesa" : "desmarcar");
            if (resultado.hecha) navigator.vibrate?.(30);
            if (resultado.frase?.tipo === "record") setTimeout(() => sonar("critico"), 250);
        }
    },
    // (v166) Calentar, cambiar y saltar un ejercicio durante el entrenamiento.
    "gym-calentar-ej": (boton) => ejecutar(() => acciones.agregarCalentamientoGym(estado, Number(boton.dataset.ej)), { mantenerScroll: true }),
    "gym-calentar-quitar": (boton) => ejecutar(() => acciones.quitarCalentamientoGym(estado, Number(boton.dataset.ej)), { mantenerScroll: true }),
    "gym-cambiar": (boton) => mostrarDialogoGym(dialogoCambiarEjercicio(estado, Number(boton.dataset.ej))),
    "gym-cambiar-a": (boton) => {
        if (!ejecutar(() => acciones.cambiarEjercicioEnCurso(estado, Number(boton.dataset.ej), boton.dataset.ejercicio), { mantenerScroll: true })) return;
        $("#dialogo-gym")?.close();
        sonar("cursor");
    },
    "gym-saltar": (boton) => {
        if (!confirm("¿Saltar este ejercicio? No se guarda nada de él en este entrenamiento.")) return;
        ejecutar(() => acciones.saltarEjercicioGym(estado, Number(boton.dataset.ej)), { mantenerScroll: true });
    },
    // (v166) La calculadora de discos.
    "gym-discos": (boton) => {
        const en = estado.gym.encurso;
        const actual = en && gym.serieActual(en);
        const kg = Number(boton.dataset.kg) || (actual ? en.ejercicios[actual.ejercicio].series[actual.serie].kg : 0) || 40;
        ui.discosKg = kg;
        mostrarDiscos();
    },
    "gym-discos-ajuste": (boton) => { ui.discosKg = Math.max(0, Math.min(gym.MAX_KG, Math.round(((ui.discosKg || 0) + Number(boton.dataset.delta)) * 100) / 100)); mostrarDiscos(); },
    "gym-barra": (boton) => { if (ejecutar(() => acciones.cambiarAjusteGym(estado, "barra", boton.dataset.barra), { mantenerScroll: true })) mostrarDiscos(); },
    // (v166) Corregir una sesión ya guardada.
    "gym-editar": (boton) => mostrarDialogoGym(dialogoCorregirSesion(estado, Number(boton.dataset.indice))),
    "gym-cerrar-dialogo": () => $("#dialogo-gym")?.close(),
    "gym-extra": (boton) => ejecutar(() => acciones.agregarEjercicioGym(estado, boton.dataset.ejercicio), { mantenerScroll: true }),
    // (v78) El modo foco: los botones + y − de peso y repeticiones, y pasar de la lista al modo foco.
    "gym-ajuste": (boton) => ejecutar(() => acciones.ajustarSerieGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie), boton.dataset.campo, Number(boton.dataset.delta)), { mantenerScroll: true }),
    // (v80) Cada toque es una repetición: suena un tic y, al llegar al máximo del rango, un destello.
    "gym-contar": (boton) => {
        const r = ejecutar(() => acciones.contarRepeticionGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie)), { mantenerScroll: true });
        if (!r) return;
        sonar(r.reps >= r.meta ? "habilidad" : "cursor");
        navigator.vibrate?.(15);
    },
    "gym-foco": (boton) => ejecutar(() => acciones.cambiarAjusteGym(estado, "foco", boton.dataset.valor === "1"), { mantenerScroll: true }),
    "gym-calentar": () => {
        const r = ejecutar(() => acciones.calentarGym(estado), { mantenerScroll: true });
        if (r?.frase) { ui.fraseGym = r.frase; sonar("completar"); dibujarPantalla({ mantenerScroll: true }); }
    },
    "gym-serie-mas": (boton) => ejecutar(() => acciones.cambiarSeriesGym(estado, Number(boton.dataset.ej), 1), { mantenerScroll: true }),
    "gym-serie-menos": (boton) => ejecutar(() => acciones.cambiarSeriesGym(estado, Number(boton.dataset.ej), -1), { mantenerScroll: true }),
    // (v81) Acortar o alargar el descanso que corre, de 15 en 15 segundos.
    "gym-descanso-mas": (boton) => {
        if (!ui.descansoGym) return;
        const cambio = Number(boton.dataset.segundos) * 1000;
        ui.descansoGym = { fin: Math.max(Date.now() + 5000, ui.descansoGym.fin + cambio), total: Math.max(15000, ui.descansoGym.total + cambio) };
        dibujarPantalla({ mantenerScroll: true });
    },
    "gym-saltar-descanso": () => { ui.descansoGym = null; dibujarPantalla({ mantenerScroll: true }); },
    // (v164) Las repeticiones en reserva de la serie que acabas de hacer (en el descanso del modo foco).
    "gym-rir": (boton) => {
        const r = ejecutar(() => acciones.anotarRirGym(estado, Number(boton.dataset.ej), Number(boton.dataset.serie), Number(boton.dataset.rir)), { mantenerScroll: true });
        if (r) sonar("cursor");
    },
    // (v164) La semana de descarga, la nota de la sesión y «¿Continuar el entrenamiento?».
    "gym-descarga": () => {
        if (!ejecutar(() => acciones.empezarDescargaGym(estado), { mantenerScroll: true })) return;
        ui.fraseGym = null;
        sonar("completar");
    },
    "gym-descarga-quitar": () => {
        if (!confirm("¿Quitar la semana de descarga? Tus entrenamientos volverán a tener todas sus series.")) return;
        ejecutar(() => acciones.quitarDescargaGym(estado), { mantenerScroll: true });
    },
    "gym-nota-sueno": (boton) => {
        const d = boton.dataset;
        if (ejecutar(() => acciones.anotarNotaGym(estado, d.fecha, d.rutina, { sueno: d.sueno }), { mantenerScroll: true })) sonar("cursor");
    },
    "gym-continuar": () => {
        $("#dialogo-gym")?.close();
        cambiarPantalla("gym");
    },
    "gym-descartar": () => {
        if (!confirm("¿Descartar el entrenamiento? Se pierde lo que anotaste y no da premio.")) return;
        $("#dialogo-gym")?.close();
        ui.descansoGym = null;
        ui.fraseGym = null;
        ejecutar(() => acciones.cancelarGym(estado));
    },
    "gym-terminar": () => {
        const hechas = gym.seriesMarcadas(estado.gym.encurso);
        const planeadas = gym.seriesPlaneadasDe(estado.gym.encurso);
        if (hechas * 2 < planeadas && !confirm(`Solo marcaste ${hechas} de ${planeadas} series. ¿Terminar así?`)) return;
        const fin = ejecutar(() => acciones.terminarGym(estado));
        if (fin) {
            ui.descansoGym = null;
            ui.resumenGym = fin.sesion;
            subvista.gym = "entrenar";
            ui.fraseGym = { tipo: "fin", texto: fin.celebraciones[0]?.maestro || "" };
            sonar("completar");
            dibujarPantalla();
            window.scrollTo(0, 0);
        }
    },
    "gym-cancelar": () => {
        if (!confirm("¿Cancelar el entrenamiento? Se pierde lo que anotaste y no da premio.")) return;
        ui.descansoGym = null;
        ui.fraseGym = null;
        ejecutar(() => acciones.cancelarGym(estado));
    },
    "gym-borrar": (boton) => {
        if (!confirm("¿Borrar esta sesión? Se le quita el XP y las monedas que dio.")) return;
        ejecutar(() => acciones.borrarSesionGym(estado, Number(boton.dataset.indice)), { mantenerScroll: true });
    },
    // (v160) Editar tus rutinas: quitar, mover, cambiar las series y restaurar (agregar y cambiar son selects: ver app.js).
    "gym-rutina-quitar": (boton) => ejecutar(() => acciones.quitarEjercicioDeRutina(estado, boton.dataset.rutina, boton.dataset.ejercicio), { mantenerScroll: true }),
    "gym-rutina-series": (boton) => ejecutar(() => acciones.cambiarSeriesDeRutina(estado, boton.dataset.rutina, boton.dataset.ejercicio, Number(boton.dataset.delta)), { mantenerScroll: true }),
    "gym-rutina-mover": (boton) => ejecutar(() => acciones.moverEjercicioDeRutina(estado, boton.dataset.rutina, boton.dataset.ejercicio, Number(boton.dataset.delta)), { mantenerScroll: true }),
    "gym-rutina-restaurar": (boton) => {
        if (!confirm("¿Volver a los ejercicios de fábrica de esta rutina? Tu historial no se borra.")) return;
        ejecutar(() => acciones.restaurarRutina(estado, boton.dataset.rutina), { mantenerScroll: true });
    },
    "gym-meta": (boton) => ejecutar(() => acciones.cambiarAjusteGym(estado, "meta", estado.gym.metaSemanal + Number(boton.dataset.delta)), { mantenerScroll: true }),
    "gym-descanso": (boton) => ejecutar(() => acciones.cambiarAjusteGym(estado, "descanso", boton.dataset.segundos), { mantenerScroll: true }),
};


// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
export const FORMULARIOS_GYM = {
    "gym-altura"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarAlturaGym(estado, valores.cm), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
    "gym-medidas"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarMedidasGym(estado, valores), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
    "gym-meta-peso"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarMetaPesoGym(estado, valores.kg), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
    // (v166) Corregir el peso y las repeticiones de una sesión guardada: los campos se llaman k-<ejercicio>-<serie> y r-<ejercicio>-<serie>.
    "gym-corregir"(valores) {
        const cambios = [];
        for (const [nombre, valor] of Object.entries(valores)) {
            const [, campo, ei, si] = /^([kr])-(\d+)-(\d+)$/.exec(nombre) ? [0, ...nombre.split("-")] : [];
            if (!campo) continue;
            let c = cambios.find((x) => x.ejercicio === Number(ei) && x.serie === Number(si));
            if (!c) { c = { ejercicio: Number(ei), serie: Number(si) }; cambios.push(c); }
            c[campo === "k" ? "kg" : "reps"] = valor;
        }
        const r = ejecutar(() => acciones.corregirSesionGym(estado, Number(valores.indice), cambios), { mantenerScroll: true });
        if (r) sonar("completar");
        return Boolean(r);
    },
    // (v164) La línea de molestias o dolor de la sesión que acabas de terminar.
    "gym-nota"(valores) {
        return Boolean(ejecutar(() => acciones.anotarNotaGym(estado, valores.fecha, valores.rutina, { texto: valores.texto }), { mantenerScroll: true }));
    },
    "gym-peso"(valores, formulario) {
        const ok = ejecutar(() => acciones.anotarPesoGym(estado, valores.kg), { mantenerScroll: true });
        if (ok) formulario.reset();
        return ok;
    },
};
