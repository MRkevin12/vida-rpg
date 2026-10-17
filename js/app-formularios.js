// app-formularios.js — Los formularios (data-form): crear y editar misiones, tareas, logros, recompensas…
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as datos from "./datos.js";
import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as mascota from "./mascota.js";
import * as avisos from "./avisos.js";
import * as nube from "./nube.js";
import { fechaLegible } from "./fechas.js";
import { estado, $, entrarAlJuego, ejecutar, cargarPartida } from "./app.js";
import { mostrarRobo, sonar, avisar, ofrecerDeshacer } from "./app-efectos.js";
import { pintarDescanso, pintarNube, pintarAvisos, sincronizarAvisos, probarAvisos } from "./app-dialogos.js";
import { registroSW } from "./app-version.js";


// Los formularios de este archivo (data-form="…"). app.js los junta todos en FORMULARIOS.
export const FORMULARIOS_GENERALES = {
    personaje(valores) {
        try {
            acciones.crearPersonaje(estado, valores.nombre);
        } catch (error) {
            alert(error.message);
            return false;
        }
        datos.guardar(estado);
        entrarAlJuego({ nuevo: true });
        return true;
    },
    // Si el formulario trae un id, se está editando; si no, creando.
    mision(valores) {
        if (valores.id) return ejecutar(() => acciones.editarMision(estado, valores));
        // «Una sola vez» se guarda como tarea (da su premio una vez y aparece en 📌 Tareas).
        if (valores.frecuencia === "unica") {
            const resultado = ejecutar(() => acciones.crearTarea(estado, valores));
            if (resultado) avisar("📌 Guardada en Tareas");
            return resultado;
        }
        return ejecutar(() => acciones.crearMision(estado, valores));
    },
    tarea: (valores) => ejecutar(() => (valores.id ? acciones.editarTarea(estado, valores) : acciones.crearTarea(estado, valores))),
    principal: (valores) => ejecutar(() => acciones.crearPrincipal(estado, valores)),
    enfoque(valores) {
        const resultado = ejecutar(() => acciones.empezarEnfoque(estado, valores));
        if (resultado) {
            sonar("completar");
            avisos.avisarEnfoque(juego.finDelEnfoque(estado.enfoque.activo));   // para el aviso al terminar
        }
        return resultado;
    },
    // Activar notificaciones: pide permiso al iPhone y registra este teléfono en el servidor.
    "activar-avisos"(valores) {
        if (!registroSW) {
            alert("La app todavía se está preparando. Intenta otra vez en unos segundos.");
            return false;
        }
        avisos.activar(registroSW, valores.codigo, estado)
            .then(async () => {
                // Para empezar, un recordatorio todos los días a las 8 p. m. (lo puedes cambiar).
                if (!estado.avisos.horarios.length) {
                    ejecutar(() => acciones.agregarHorario(estado, { hora: "20:00" }));
                    await avisos.sincronizar(registroSW, estado);
                }
                await pintarAvisos();
                await probarAvisos();
            })
            .catch((error) => alert(error.message));
        return false;   // no cerrar Ajustes
    },
    horario(valores) {
        if (ejecutar(() => acciones.agregarHorario(estado, valores))) {
            sincronizarAvisos();
            pintarAvisos();
        }
        return false;   // no cerrar Ajustes
    },
    falla(valores) {
        const id = Number(valores.id);
        const resultado = ejecutar(() => acciones.fallarMision(estado, id, valores.fecha, valores.motivo));
        if (resultado) {
            const mision = estado.misiones.find((m) => m.id === id);
            // Primero la escena del robo; al cerrarla, la opción de deshacer.
            mostrarRobo(resultado.robo, () => ofrecerDeshacer(`✗ ${mision.nombre}${resultado.dano ? ` · −${resultado.dano} ❤️` : ""}`,
                                                              () => ejecutar(() => acciones.quitarFalla(estado, id, valores.fecha))));
        }
        return resultado;
    },
    revision(valores) {
        const resultado = ejecutar(() => acciones.guardarRevision(estado, valores));
        if (resultado) avisar("📝 Revisión guardada. ¡A por esta semana!");
        return resultado;
    },
    logro: (valores) => ejecutar(() => (valores.id ? acciones.editarLogro(estado, valores) : acciones.crearLogro(estado, valores))),
    recompensa: (valores) => ejecutar(() => (valores.id ? acciones.editarRecompensa(estado, valores) : acciones.crearRecompensa(estado, valores))),
    atributo(valores) {
        const resultado = ejecutar(() => (valores.id ? acciones.editarAtributoPropio(estado, valores) : acciones.crearAtributoPropio(estado, valores)));
        if (resultado && !valores.id) avisar(`${valores.icono || "⭐"} Atributo creado: ya lo puedes elegir en tus misiones`);
        return resultado;
    },
    mascota(valores) {
        const resultado = ejecutar(() => acciones.nombrarMascota(estado, valores.nombre));
        if (resultado) avisar(`🐾 Tu mascota ahora se llama ${mascota.nombreDe(estado, mascota.especieActiva(estado))}`);
        return resultado;
    },
    // Activar la copia en la nube: cifra y sube la primera copia.
    "nube-activar"(valores, formulario) {
        if (valores.contrasena !== valores.repetir) {
            alert("Las dos contraseñas no coinciden.");
            return false;
        }
        const boton = formulario.querySelector('[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Cifrando y subiendo…";
        nube.activar(estado, valores.contrasena, valores.codigo)
            .then(() => { pintarNube(); avisar("☁️ Copia en la nube activada"); })
            .catch((error) => {
                alert(error.message);
                boton.disabled = false;
                boton.textContent = "Activar copia en la nube";
            });
        return false;   // no cerrar Ajustes
    },
    // Recuperar la copia de la nube (reemplaza la partida de este teléfono).
    "nube-recuperar"(valores, formulario) {
        const boton = formulario.querySelector('[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Descifrando…";
        nube.recuperar(valores.codigo, valores.contrasena)
            .then(({ texto, fecha }) => {
                const nuevo = datos.desdeRespaldo(texto);
                const pregunta = `¿Reemplazar la partida de este teléfono por la copia del ${fechaLegible(fecha)} («${nuevo.personaje.nombre}»)?`;
                if (estado.personaje && !confirm(pregunta)) return;
                $("#dialogo-nube").close();
                cargarPartida(nuevo, `☁️ Copia del ${fechaLegible(fecha)} recuperada`);
            })
            .catch((error) => alert(error.message))
            .finally(() => {
                boton.disabled = false;
                boton.textContent = "Recuperar";
            });
        return false;
    },
    descanso(valores) {
        if (ejecutar(() => acciones.empezarDescanso(estado, valores.hasta))) {
            avisar("🏖️ Modo descanso activado");
            pintarDescanso();
        }
        return false;   // no cerrar Ajustes
    },
    renombrar(valores) {
        const resultado = ejecutar(() => acciones.renombrar(estado, valores.nombre));
        if (resultado) avisar("✏️ Nombre actualizado");
        return false; // no cerrar la ventana de ajustes
    },
    submision: (valores, formulario) =>
        ejecutar(() => acciones.agregarSubmision(estado, Number(formulario.dataset.id), valores.nombre)),
};
