// vistas-ajustes.js — Ajustes: notificaciones, copia en la nube y novedades de cada versión.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import { fechaLegible, DIAS_LETRAS, DIAS_CORTOS } from "./fechas.js";
import { ICONOS, esc, vacio } from "./vistas-comun.js";

// ===== Ajustes: notificaciones =====
// info = { compatible, instalar (falta instalarla en la pantalla de inicio), permiso, activadas }

export function seccionAvisos(estado, info) {
    if (!info.compatible || info.instalar) {
        return `<p class="nota">Solo funcionan con la app <b>instalada en la pantalla de inicio</b> (iPhone con iOS 16.4 o más).
                   En Chrome: botón Compartir → «Agregar a la pantalla de inicio». Después ábrela desde el ícono y vuelve aquí.</p>`;
    }
    if (info.permiso === "denied") {
        return `<p class="nota">Bloqueaste las notificaciones de Vida RPG. Para volver a permitirlas:
                   Ajustes del iPhone → Notificaciones → Vida RPG.</p>`;
    }
    if (!info.activadas) {
        return `
            <p class="nota">Recordatorios a las horas que elijas, con lo que te falta del día,
               y un aviso cuando termine tu sesión de enfoque.</p>
            <form data-form="activar-avisos" class="form-linea">
                <input type="text" name="codigo" required autocomplete="off" autocapitalize="characters" spellcheck="false"
                       placeholder="Código de activación" aria-label="Código de activación">
                <button type="submit" class="boton boton-chico">Activar</button>
            </form>`;
    }

    const textoDias = (dias) => (dias ? dias.map((d) => DIAS_CORTOS[d]).join(", ") : "Todos los días");
    const filas = estado.avisos.horarios.map((h) => `
        <li>
            <span><b>${h.hora}</b> <span class="texto-suave">· ${textoDias(h.dias)}</span></span>
            <button type="button" class="boton-icono chico" data-accion="quitar-horario" data-id="${h.id}"
                    aria-label="Quitar el recordatorio de las ${h.hora}">${ICONOS.cerrar}</button>
        </li>`).join("");
    const dias = DIAS_LETRAS.map((letra, dia) => `
        <label class="pildora" title="${DIAS_CORTOS[dia]}">
            <input type="checkbox" name="dias" value="${dia}" checked><span>${letra}</span>
        </label>`).join("");

    // Las misiones con su propia hora de aviso (se cambian al editar cada misión).
    const conAviso = estado.misiones.filter((m) => m.aviso && !m.archivadaEn)
        .sort((a, b) => a.aviso.localeCompare(b.aviso))
        .map((m) => `<b>${m.aviso}</b> ${esc(m.nombre)}`);
    const avisosMision = conAviso.length
        ? `<p class="nota">⏰ Avisos de misión: ${conAviso.join(" · ")}. Llegan solo si no la has hecho;
               se cambian al editar cada misión.</p>`
        : `<p class="nota">⏰ También puedes ponerle una hora de aviso a cada misión (al crearla o editarla):
               te avisa solo de esa misión y solo si no la has hecho.</p>`;

    return `
        <p class="nota">✅ Activadas en este teléfono. Recordatorios generales (con todo lo que te falta):</p>
        ${filas ? `<ul class="horarios">${filas}</ul>` : vacio("Sin recordatorios. Agrega uno abajo.")}
        <form data-form="horario" class="horario-nuevo">
            <div class="form-linea">
                <input type="time" name="hora" value="20:00" required aria-label="Hora del recordatorio">
                <button type="submit" class="boton boton-chico">+ Agregar</button>
            </div>
            <fieldset class="opciones opciones-7" aria-label="Días del recordatorio">${dias}</fieldset>
        </form>
        ${avisosMision}
        <label class="interruptor">
            <span><b>⏱️ Fin del enfoque</b><br><span class="nota">Avisar cuando termine una sesión.</span></span>
            <input type="checkbox" data-accion="aviso-enfoque" ${estado.avisos.enfoque ? "checked" : ""}>
        </label>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="probar-avisos">Enviar prueba</button>
            <button type="button" class="boton boton-secundario" data-accion="desactivar-avisos">Desactivar</button>
        </div>
        ${guiaDeAvisos()}`;
}


// Lo que se revisa en el iPhone para que los avisos lleguen siempre y suenen.
function guiaDeAvisos() {
    return `
        <details class="plegable guia-avisos">
            <summary>📋 Para que lleguen siempre y suenen</summary>
            <ol>
                <li><b>Ajustes del iPhone → Notificaciones → Vida RPG:</b> «Permitir notificaciones» y <b>Sonidos</b> activados,
                    y los tres lugares (pantalla bloqueada, centro de notificaciones y avisos). Si usas el «Resumen programado»,
                    deja Vida RPG fuera de él (con entrega <b>inmediata</b>): si no, los junta y llegan tarde.</li>
                <li><b>Modos de concentración</b> (No molestar, Dormir, Trabajo…): en Ajustes → Concentración, agrega Vida RPG a las
                    apps permitidas de cada modo. Si no, llegan sin sonar.</li>
                <li><b>El silencio del iPhone:</b> con el interruptor lateral (o el botón de acción) en silencio no suena nada.
                    Sube el volumen de «Tono y alertas» en Ajustes → Sonidos y vibraciones.</li>
                <li><b>Abre la app de vez en cuando:</b> al abrirla revisa que los avisos sigan conectados y, si hace falta,
                    los repara sola o te avisa arriba en «Hoy».</li>
            </ol>
            <p class="nota"><b>🎺 Sobre el sonido:</b> el iPhone no deja que una app web elija un sonido propio para sus
               notificaciones (solo las apps de la App Store pueden): suenan con el tono de alertas del iPhone. Si quieres uno
               que reconozcas, en iOS 17.2 o más puedes cambiar el tono de alertas predeterminado en Ajustes → Sonidos y
               vibraciones (ojo: cambia también el de otras apps que usen el predeterminado). Con la app abierta, los avisos
               suenan con su propio toque: el cuerno de Vida RPG.</p>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="probar-cuerno">🎺 Escuchar el cuerno</button>
        </details>`;
}



// ===== Ajustes: copia en la nube =====
// info = { configurada, ultima (fecha de la última copia), codigoGuardado (ya está el código de las notificaciones) }

export function seccionNube(info) {
    if (!info.configurada) {
        return `
            <p class="nota">Guarda una copia de tu partida en la nube, <b>sola, una vez al día</b>. Se cifra en el teléfono
               con una contraseña tuya: en la nube nadie puede leerla. Si cambias de teléfono, la recuperas con esa contraseña.</p>
            <form data-form="nube-activar" class="formulario-grupo">
                ${info.codigoGuardado ? "" : `<input type="text" name="codigo" required autocomplete="off" autocapitalize="characters"
                    spellcheck="false" placeholder="Código de activación" aria-label="Código de activación">`}
                <input type="password" name="contrasena" required minlength="8" autocomplete="new-password"
                       placeholder="Contraseña (mínimo 8 letras)" aria-label="Contraseña de la copia">
                <input type="password" name="repetir" required minlength="8" autocomplete="new-password"
                       placeholder="Repite la contraseña" aria-label="Repite la contraseña">
                <p class="nota">⚠️ Anótala en un lugar seguro: si la olvidas, nadie puede abrir la copia (ni siquiera el servidor).</p>
                <button type="submit" class="boton boton-principal">Activar copia en la nube</button>
            </form>`;
    }
    return `
        <p class="nota">✅ Activada. ${info.ultima ? `Última copia: <b>${fechaLegible(info.ultima)}</b>.` : "Todavía sin copias."}
           Se hace sola una vez al día, al abrir la app con internet.</p>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="nube-subir">Respaldar ahora</button>
            <button type="button" class="boton boton-secundario" data-accion="abrir" data-dialogo="nube">Recuperar</button>
        </div>
        <button type="button" class="enlace" data-accion="nube-desactivar">Desactivar en este teléfono</button>`;
}



// ===== Novedades =====

export function contenidoNovedades(lista, titulo = "🆕 Novedades") {
    return `
        <div class="titulo-seccion">
            <h2 class="titulo-juego">${titulo}</h2>
            <button type="button" class="boton boton-chico boton-secundario" data-accion="cerrar">Cerrar</button>
        </div>
        ${lista.map((n) => `
            <section class="novedad">
                <p class="etiqueta">Versión ${n.version}</p>
                <h3>${n.titulo}</h3>
                <ul>${n.cambios.map((c) => `<li>${c}</li>`).join("")}</ul>
            </section>`).join("")}`;
}
