// app-gym.js — Los botones y formularios del gimnasio (gym-…).
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as gym from "./gym.js";
import { hoy, sumarDias } from "./fechas.js";
import { estado, ui, subvista, ejecutar, dibujarPantalla, cambiarPantalla, $ } from "./app.js";
import { sonar } from "./app-efectos.js";
import { dialogoSeguirGym } from "./vistas-gym.js";

// (v164) Al abrir la app con un entrenamiento a medias: «¿Continuar el entrenamiento?».
// (La sesión en curso ya se guarda en cada serie y en cada número que cambias; esto solo te lo recuerda.)
export function ofrecerSeguirGym() {
    if (!estado.gym?.encurso) return;
    const dialogo = $("#dialogo-gym");
    if (!dialogo) return;
    dialogo.innerHTML = dialogoSeguirGym(estado, hoy());
    if (!dialogo.open) dialogo.showModal();
}

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
            ui.descansoGym = r.hecha ? { fin: Date.now() + estado.gym.descanso * 1000, total: estado.gym.descanso * 1000 } : null;
            if (r.frase) ui.fraseGym = r.frase;
            return r;
        }, { mantenerScroll: true });
        if (resultado) {
            sonar(resultado.hecha ? "pesa" : "desmarcar");
            if (resultado.hecha) navigator.vibrate?.(30);
            if (resultado.frase?.tipo === "record") setTimeout(() => sonar("critico"), 250);
        }
    },
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
