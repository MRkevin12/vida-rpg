// app-botones.js — Los demás botones (data-accion): misiones, tareas, tienda, logros, mascota, avisos, ajustes…
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as avatar from "./avatar.js";
import * as torre from "./torre.js";
import * as vida from "./vida.js";
import * as rituales from "./rituales.js";
import * as mascota from "./mascota.js";
import * as avisos from "./avisos.js";
import * as nube from "./nube.js";
import { calcularResumen, semanaPorMostrar } from "./resumen.js";
import { hoy } from "./fechas.js";
import { estado, pantallaActual, ui, subvista, $, avatarActual, preguntarAnimo, elegirAnimo, ejecutar,
         dibujarPantalla, fechaVista, cambiarPantalla, exportar, borrarTodo } from "./app.js";
import { sonar, flotarXp, reproducirAnimacion, celebrar, avisar, ofrecerDeshacer } from "./app-efectos.js";
import { pintarDescanso, pintarNube, idEnEdicion, abrirDialogo, pintarAvisos, sincronizarAvisos, probarAvisos } from "./app-dialogos.js";
import { gestoReciente, iniciarGolpe } from "./app-gestos.js";
import { registroSW } from "./app-version.js";

// Cambia cuánto llevas de una misión con cantidad. Si así llega a la meta,
// se completa (con su animación); si baja de la meta, se desmarca.
function cambiarCantidad(mision, fecha, nueva) {
    const antes = juego.cantidadDe(estado, mision, fecha);
    const completa = nueva >= mision.meta.cantidad && antes < mision.meta.cantidad;
    const resultado = ejecutar(() => acciones.fijarCantidad(estado, mision.id, fecha, nueva),
                               completa ? { recienHecha: mision.id } : {});
    if (!resultado) return;
    sonar(resultado.xp > 0 ? "completar" : resultado.xp < 0 ? "desmarcar" : "salto");
    flotarXp(`.mision[data-id="${mision.id}"]`, resultado.xp);
    if (resultado.xp > 0) {
        ofrecerDeshacer(`✔ ${mision.nombre} · +${resultado.xp} XP`, () => ejecutar(() => acciones.fijarCantidad(estado, mision.id, fecha, antes)));
    }
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_GENERALES = {
    ir: (boton) => cambiarPantalla(boton.dataset.pantalla),
    abrir: (boton) => abrirDialogo(boton.dataset.dialogo),
    cerrar: (boton) => boton.closest("dialog").close(),

    "alternar-mision": (boton) => {
        const id = Number(boton.dataset.id);
        const fecha = fechaVista();   // hoy, o ayer si estás corrigiendo el día anterior
        const estabaHecha = boton.getAttribute("aria-pressed") === "true";
        const resultado = estabaHecha
            ? ejecutar(() => acciones.desmarcarMision(estado, id, fecha))
            : ejecutar(() => acciones.completarMision(estado, id, fecha), { recienHecha: id });
        if (!resultado) return;
        sonar(estabaHecha ? "desmarcar" : "completar");
        flotarXp(`.mision[data-id="${id}"]`, resultado.xp);
        if (!estabaHecha) {
            const mision = estado.misiones.find((m) => m.id === id);
            ofrecerDeshacer(`✔ ${mision.nombre} · +${resultado.xp} XP${resultado.clave ? " 🔑" : ""}${resultado.forma ? " ✨" : ""}`,
                            () => ejecutar(() => acciones.desmarcarMision(estado, id, fecha)));
            setTimeout(() => iniciarGolpe(id, fecha), 350);   // el golpe con timing contra el jefe
        }
    },
    "ver-fecha": (boton) => {
        ui.diaVisto = boton.dataset.dia;
        dibujarPantalla();
    },
    "editar-mision": (boton) => {
        boton.closest("dialog")?.close();   // si viene de la ficha, la ficha se cierra
        abrirDialogo("mision", estado.misiones.find((m) => m.id === Number(boton.dataset.id)));
    },
    // Tocar una misión abre su ficha (salvo justo después de deslizarla).
    "ver-ficha": (elemento) => {
        if (gestoReciente) return;
        const mision = estado.misiones.find((m) => m.id === Number(elemento.dataset.id));
        if (mision) abrirDialogo("ficha", mision);
    },
    // Estos tres botones están dentro de la ventana de editar misión.
    "mover-mision": (boton) => {
        ejecutar(() => acciones.moverMision(estado, idEnEdicion(boton), Number(boton.dataset.direccion)));
    },
    "archivar-mision": (boton) => {
        if (confirm("¿Archivar esta misión? Dejará de aparecer, pero su historial se guarda y la puedes restaurar.")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            if (ejecutar(() => acciones.archivarMision(estado, id))) {
                ofrecerDeshacer("📦 Misión archivada", () => ejecutar(() => acciones.restaurarMision(estado, id)));
            }
        }
    },
    "restaurar-mision": (boton) => ejecutar(() => acciones.restaurarMision(estado, Number(boton.dataset.id))),
    "restaurar-principal": (boton) => ejecutar(() => acciones.restaurarPrincipal(estado, Number(boton.dataset.id))),

    // Misiones con cantidad: +1 / −1 (data-paso) o escribir el número.
    "sumar-cantidad": (boton) => {
        const id = Number(boton.dataset.id);
        const mision = estado.misiones.find((m) => m.id === id);
        const fecha = fechaVista();
        const nueva = juego.cantidadDe(estado, mision, fecha) + Number(boton.dataset.paso);
        cambiarCantidad(mision, fecha, nueva);
    },
    "escribir-cantidad": (boton) => {
        const id = Number(boton.dataset.id);
        const mision = estado.misiones.find((m) => m.id === id);
        const fecha = fechaVista();
        const texto = prompt(`¿Cuánto llevas? (meta: ${mision.meta.cantidad} ${mision.meta.unidad})`, juego.cantidadDe(estado, mision, fecha));
        if (texto === null || texto.trim() === "") return;   // canceló
        cambiarCantidad(mision, fecha, Number(texto.trim()));
    },

    // Tareas sueltas.
    "alternar-tarea": (boton) => {
        const id = Number(boton.dataset.id);
        const estabaHecha = boton.getAttribute("aria-pressed") === "true";
        const resultado = ejecutar(() => acciones.alternarTarea(estado, id), estabaHecha ? {} : { recienTarea: id });
        if (!resultado) return;
        sonar(estabaHecha ? "desmarcar" : "completar");
        flotarXp(`.tarea[data-tarea="${id}"]`, resultado.xp);
        if (!estabaHecha) {
            const tarea = estado.tareas.find((x) => x.id === id);
            ofrecerDeshacer(`✔ ${tarea.nombre} · +${resultado.xp} XP`, () => ejecutar(() => acciones.alternarTarea(estado, id)));
        }
    },
    "editar-tarea": (boton) => {
        abrirDialogo("tarea", estado.tareas.find((t) => t.id === Number(boton.dataset.id)));
    },
    "borrar-tarea": (boton) => {
        if (confirm("¿Borrar esta tarea?")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarTarea(estado, id));
        }
    },

    "cancelar-enfoque": () => {
        if (confirm("¿Cancelar la sesión? Si la cortas ahora, no recibes premio.")) {
            if (ejecutar(() => acciones.cancelarEnfoque(estado))) avisos.avisarEnfoque(null);
        }
    },

    // Notificaciones (en Ajustes).
    "quitar-horario": (boton) => {
        if (ejecutar(() => acciones.quitarHorario(estado, Number(boton.dataset.id)))) {
            sincronizarAvisos();
            pintarAvisos();
        }
    },
    "aviso-enfoque": (casilla) => {
        if (ejecutar(() => acciones.cambiarAvisoEnfoque(estado, casilla.checked))) sincronizarAvisos();
    },
    "probar-avisos": () => probarAvisos().catch((error) => alert(error.message)),
    "probar-cuerno": () => sonar("aviso"),
    "reactivar-avisos": () => {
        if (!registroSW) {
            alert("La app todavía se está preparando. Intenta otra vez en unos segundos.");
            return;
        }
        avisos.reactivar(registroSW, estado)
            .then(() => {
                ui.problemaAvisos = null;
                dibujarPantalla();
                avisar("🔔 Notificaciones reactivadas");
                return probarAvisos();
            })
            .catch((error) => alert(error.message));
    },
    "desactivar-avisos": () => {
        if (!confirm("¿Desactivar las notificaciones en este teléfono? Tus horarios quedan guardados.")) return;
        avisos.desactivar(registroSW)
            .then(pintarAvisos)
            .then(() => avisar("🔕 Notificaciones desactivadas"));
    },
    // (v49) El botón de Hoy ahora abre la pregunta «¿Cómo te sientes hoy?» para cambiar el menú cuando quieras.
    "alternar-esencial": () => preguntarAnimo(),
    "elegir-animo": (boton) => elegirAnimo(boton.dataset.animo),
    // (v52) «Por atributo» / «Por momento» en Hoy. (Antes usaban la acción «subvista», que intentaba abrir una pantalla «hoy-agrupar».)
    "agrupar-hoy": (boton) => {
        ui.agruparHoy = boton.dataset.grupo;
        dibujarPantalla({ mantenerScroll: true });
    },
    "cerrar-semana": () => {
        ejecutar(() => acciones.cerrarResumenSemanal(estado));
        window.scrollTo(0, 0);
    },
    // (v149) Cerrar el resumen de una temporada que ya terminó.
    "cerrar-temporada": (boton) => ejecutar(() => acciones.cerrarResumenTemporada(estado, boton.dataset.mes)),
    // (v149) Revisión semanal: aplicar el cambio que propuso la pista. El diálogo sigue abierto (no se borra lo que escribiste).
    "aplicar-sugerencia": (boton) => {
        const resultado = ejecutar(() => acciones.aplicarSugerencia(estado, { misionId: boton.dataset.id, lunes: boton.dataset.lunes }));
        if (!resultado) return;
        boton.disabled = true;
        boton.textContent = "✅ Cambio aplicado";
        avisar("🛠️ Listo: ya cambié la misión");
    },
    // (v151) Dificultad adaptable: aplicar el ajuste que propuso la revisión. El botón queda marcado como hecho.
    "aplicar-dificultad": (boton) => {
        const resultado = ejecutar(() => acciones.aplicarDificultad(estado, { misionId: boton.dataset.id }));
        if (!resultado) return;
        boton.disabled = true;
        boton.textContent = "✅ Dificultad cambiada";
        avisar("⚖️ Listo: ya cambié la dificultad");
    },
    "revisar-semana": () => {
        const lunes = semanaPorMostrar(estado, hoy());
        if (lunes) abrirDialogo("revision", lunes);
    },

    "alternar-submision": (boton) => {
        const id = Number(boton.dataset.id);
        const sub = Number(boton.dataset.sub);
        const resultado = ejecutar(() => acciones.alternarSubmision(estado, id, sub));
        if (!resultado) return;
        sonar(resultado.xp > 0 ? "completar" : "desmarcar");
        flotarXp(`.tarjeta[data-id="${id}"]`, resultado.xp);
        if (resultado.xp > 0) {
            ofrecerDeshacer(`✔ Paso completado · +${resultado.xp} XP`, () => ejecutar(() => acciones.alternarSubmision(estado, id, sub)));
        }
    },
    "borrar-submision": (boton) => {
        ejecutar(() => acciones.borrarSubmision(estado, Number(boton.dataset.id), Number(boton.dataset.sub)));
    },
    "archivar-principal": (boton) => {
        if (confirm("¿Archivar esta misión principal?")) {
            ejecutar(() => acciones.archivarPrincipal(estado, Number(boton.dataset.id)));
        }
    },

    "editar-logro": (boton) => {
        abrirDialogo("logro", estado.logros.find((l) => l.id === Number(boton.dataset.id)));
    },
    "borrar-logro": (boton) => {
        if (confirm("¿Borrar este logro?")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarLogro(estado, id));
        }
    },
    lograr: (boton) => {
        if (confirm("¿Conseguiste este logro? ¡Felicidades!")) {
            ejecutar(() => acciones.lograrManual(estado, Number(boton.dataset.id)));
        }
    },

    // Elegir una sección de una pantalla larga (ej: Tienda › Mascotas). Si es de otra pantalla, se va a ella.
    // (v101) Llevar puesta una insignia (o quitarla).
    "poner-insignia": (boton) => {
        if (ejecutar(() => acciones.ponerInsignia(estado, boton.dataset.id))) sonar("cursor");
    },
    // (v100) En la Tienda › Equipo: ver solo una casilla (cabeza, pecho, piernas…) o todo.
    "filtro-equipo": (boton) => {
        subvista.tiendaEquipo = boton.dataset.espacio;
        sonar("cursor");
        dibujarPantalla({ mantenerScroll: true });
    },
    subvista: (boton) => {
        const { pantalla, vista } = boton.dataset;
        subvista[pantalla] = vista;
        if (pantallaActual !== pantalla) {
            cambiarPantalla(pantalla);
            return;
        }
        dibujarPantalla({ mantenerScroll: true });
        // Si bajaste mucho (el menú va pegado bajo la cabecera), la sección nueva empieza desde arriba.
        const selector = $(`#pantalla-${pantalla} .selector-secciones`);
        if (selector && selector.getBoundingClientRect().top <= parseFloat(getComputedStyle(selector).top) + 1) window.scrollTo(0, 0);
    },
    // En Aventuras: ver otra campaña de jefes.
    "ver-campana": (boton) => {
        ui.campanaVista = boton.dataset.categoria;
        dibujarPantalla({ mantenerScroll: true });
    },

    comprar: (boton) => {
        const objeto = avatar.OBJETOS[boton.dataset.id];
        if (objeto && confirm(`¿Comprar «${objeto.nombre}» por ${objeto.precio} gemas 💎?`)) {
            if (ejecutar(() => acciones.comprarObjeto(estado, boton.dataset.id))) sonar("moneda");
        }
    },
    equipar: (boton) => ejecutar(() => acciones.equiparObjeto(estado, boton.dataset.id)),
    // Mascotas (v26): adoptar una en la Tienda o elegir cuál te acompaña.
    "comprar-mascota": (boton) => {
        const datos = mascota.MASCOTAS[boton.dataset.especie];
        if (datos && confirm(`¿Adoptar «${datos.nombre}» por ${datos.precio} gemas 💎? Llega como huevo.`)) {
            if (ejecutar(() => acciones.comprarMascota(estado, boton.dataset.especie))) sonar("cofre");
        }
    },
    "elegir-mascota": (boton) => {
        if (ejecutar(() => acciones.elegirMascota(estado, boton.dataset.especie))) {
            avisar(`🐾 Ahora te acompaña ${mascota.nombreDe(estado, boton.dataset.especie)}`);
        }
    },
    apariencia: (boton) => ejecutar(() => acciones.cambiarApariencia(estado, boton.dataset.campo, boton.dataset.valor)),

    pocion: () => {
        if (!confirm(`¿Tomar una poción de vida por ${vida.POCION.precio} monedas? (+${vida.POCION.cura} ❤️)`)) return;
        if (ejecutar(() => acciones.tomarPocion(estado))) {
            sonar("moneda");
            ofrecerDeshacer(`🧪 Poción · −${vida.POCION.precio} 🪙`, () => ejecutar(() => acciones.deshacerPocion(estado)));
        }
    },
    "terminar-descanso": () => {
        if (!confirm("¿Terminar el descanso? Hoy todavía cuenta como descanso; desde mañana todo vuelve a contar.")) return;
        if (ejecutar(() => acciones.terminarDescanso(estado))) {
            avisar("🏖️ El descanso termina hoy");
            if ($("#dialogo-ajustes").open) pintarDescanso();
        }
    },

    canjear: (boton) => {
        const recompensa = estado.recompensas.find((r) => r.id === Number(boton.dataset.id));
        if (recompensa && confirm(`¿Canjear «${recompensa.nombre}» por ${recompensa.costo} monedas?`)) {
            if (ejecutar(() => acciones.canjear(estado, recompensa.id))) {
                sonar("moneda");
                ofrecerDeshacer(`🎁 ${recompensa.nombre} · −${recompensa.costo} 🪙`, () => ejecutar(() => acciones.deshacerCanje(estado)));
            }
        }
    },
    "editar-atributo": (elemento) => {
        abrirDialogo("atributo", estado.atributosPropios.find((a) => a.id === Number(elemento.dataset.id)));
    },
    "borrar-atributo": (boton) => {
        if (confirm("¿Borrar este atributo? Lo que lo usaba vuelve a su atributo base. La XP que ya ganaste no se pierde.")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarAtributoPropio(estado, id));
        }
    },
    "editar-recompensa": (boton) => {
        abrirDialogo("recompensa", estado.recompensas.find((r) => r.id === Number(boton.dataset.id)));
    },
    "borrar-recompensa": (boton) => {
        if (confirm("¿Quitar esta recompensa de la tienda?")) {
            const id = idEnEdicion(boton);
            boton.closest("dialog").close();
            ejecutar(() => acciones.borrarRecompensa(estado, id));
        }
    },

    // «Fallé» y deshacerlo.
    "fallar-mision": (boton) => {
        const mision = estado.misiones.find((m) => m.id === Number(boton.dataset.id));
        if (mision) abrirDialogo("falla", mision);
    },
    "quitar-falla": (boton) => {
        if (ejecutar(() => acciones.quitarFalla(estado, Number(boton.dataset.id), fechaVista()))) avisar("↺ Ya no está marcada como fallada");
    },

    // El cofre, el desafío relámpago y tu mascota.
    "abrir-cofre": (boton) => {
        if (boton.classList.contains("abriendo")) return;
        boton.classList.add("abriendo");   // tiembla y se abre (estilos.css)
        sonar("cofre");
        setTimeout(() => {
            const resultado = ejecutar(() => acciones.abrirCofre(estado));
            if (!resultado) return;
            const p = resultado.premio;
            celebrar({ icono: p.icono, etiqueta: "🎁 Cofre del día", titulo: p.texto,
                       detalle: p.tipo === "pocion" ? "Ya te curó." : p.tipo === "objeto" ? "Póntelo en tu Héroe › Equipo." : "¡Mañana habrá otro!" });
        }, 900);
    },
    "aceptar-relampago": () => {
        if (ejecutar(() => acciones.aceptarRelampago(estado))) {
            sonar("relampago");
            avisar(`⚡ ¡Que empiece! Tienes ${rituales.RELAMPAGO.minutos / 60} horas`);
        }
    },
    "rechazar-relampago": () => ejecutar(() => acciones.rechazarRelampago(estado)),
    "acariciar-dragon": () => {
        const frase = mascota.fraseAlAcariciar(estado, avatarActual().mascota, hoy());
        $("#mascota-frase").textContent = frase;
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, "acariciado");
        sonar("ronroneo");
    },
    // (v103) Los cuidados de cada día: acariciar, jugar, cepillar y entrenar. Suben el vínculo.
    "cuidar-mascota": (boton) => {
        const tipo = boton.dataset.tipo;
        const resultado = ejecutar(() => acciones.cuidarMascota(estado, tipo), { mantenerScroll: true });
        if (!resultado) return;
        const cuidado = mascota.CUIDADOS[tipo];
        const frase = tipo === "acariciar" ? mascota.fraseAlAcariciar(estado, avatarActual().mascota, hoy())
            : `${resultado.nombre}: ${cuidado.texto}`;
        $("#mascota-frase").textContent = resultado.repetido ? frase : `${frase} (+${resultado.puntos} de vínculo)`;
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, { acariciar: "acariciado", jugar: "juega", cepillar: "cepillado", entrenar: "entrena" }[tipo]);
        sonar(tipo === "acariciar" ? "ronroneo" : "cursor");
    },
    "explorar-mascota": () => {
        const resultado = ejecutar(() => acciones.explorarConMascota(estado), { mantenerScroll: true });
        if (!resultado) return;
        $("#mascota-frase").textContent = resultado.hallazgo.texto;
        sonar(resultado.hallazgo.tipo === "nada" ? "cursor" : "cofre");
    },
    // (v103) Un truco: solo se ve (no cambia nada de la partida).
    "truco-mascota": (boton) => {
        const truco = mascota.TRUCOS.find((t) => t.id === boton.dataset.truco);
        if (!truco) return;
        $("#mascota-frase").textContent = truco.frase.replace("{n}", avatarActual().mascota.nombre);
        const dibujo = $(".mascota-dibujo");
        if (dibujo) reproducirAnimacion(dibujo, truco.animacion);
        sonar(truco.id === "rugir" ? "retumbo" : "cursor");
    },
    "alimentar-dragon": () => {
        if (ejecutar(() => acciones.alimentarDragon(estado))) sonar("moneda");
    },
    // El bazar del arcade: una provisión para la próxima partida de la Torre o la Mazmorra.
    "comprar-provision": (boton) => {
        const p = torre.PROVISIONES[boton.dataset.clave];
        if (p && confirm(`¿Comprar «${p.nombre}» (${p.texto.toLowerCase()}) por ${p.precio} gemas 💎? Se usa al empezar tu próxima partida.`)) {
            if (ejecutar(() => acciones.comprarProvision(estado, boton.dataset.clave), { mantenerScroll: true })) sonar("moneda");
        }
    },

    // Resumen: cambiar entre 7 y 30 días.
    "rango-resumen": (boton) => {
        ui.rangoResumen = Number(boton.dataset.dias);
        dibujarPantalla();
    },
    // Tocar una columna de la gráfica: muestra los números de ese día.
    "ver-columna": (columna) => {
        const dia = calcularResumen(estado, hoy(), ui.rangoResumen).porDia[Number(columna.dataset.i)];
        document.querySelector(".columna.elegida")?.classList.remove("elegida");
        columna.classList.add("elegida");
        $("#resumen-detalle").innerHTML = vistas.textoDiaResumen(dia);
    },

    // Copia en la nube.
    "nube-subir": () => {
        avisar("☁️ Cifrando y subiendo…");
        nube.subir(estado).then(() => { pintarNube(); avisar("☁️ Copia guardada en la nube"); }).catch((error) => alert(error.message));
    },
    "nube-desactivar": () => {
        if (!confirm("¿Desactivar la copia en la nube en este teléfono? La última copia queda guardada en la nube.")) return;
        nube.desactivar();
        pintarNube();
    },

    exportar: () => exportar(),
    importar: () => $("#archivo-respaldo").click(),
    "borrar-todo": () => borrarTodo(),
};
