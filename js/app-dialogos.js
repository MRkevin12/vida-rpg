// app-dialogos.js — Las ventanas (diálogos): preparar cada formulario antes de abrirlo, y las notificaciones.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as seguridad from "./seguridad.js";
import * as avatar from "./avatar.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as desafios from "./desafios.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as locutor from "./locutor.js";   // (v128) las voces grabadas
import * as vida from "./vida.js";
import * as diario from "./diario.js";
import * as memorias from "./memorias.js";
import * as saga from "./saga.js";
import * as rituales from "./rituales.js";
import * as mascota from "./mascota.js";
import * as mapa from "./mapa.js";
import { PINTURAS, fuentePintura } from "./pinturas.js";
import { PLANTILLAS_MISIONES } from "./plantillas.js";
import * as musica from "./musica.js";
import * as equipo from "./equipo.js";
import * as avisos from "./avisos.js";
import * as nube from "./nube.js";
import { hoy, fechaLegible, DIAS_LETRAS, DIAS_CORTOS } from "./fechas.js";
import { estado, pantallaActual, $, fechaVista } from "./app.js";
import { avisar } from "./app-efectos.js";
import { registroSW, mostrarVersion } from "./app-version.js";

// ===== Ventanas (diálogos) =====

// Crea las "píldoras" de dificultad y atributo a partir de juego.js
// (así, si cambias la XP allá, aquí se actualiza solo).
export function rellenarOpciones() {
    for (const grupo of document.querySelectorAll('[data-opciones="dificultad"]')) {
        grupo.insertAdjacentHTML("beforeend", Object.entries(juego.DIFICULTADES).map(([clave, d]) => `
            <label class="pildora dificultad-${clave}">
                <input type="radio" name="dificultad" value="${clave}" ${clave === "normal" ? "checked" : ""}>
                <span>${d.nombre}<small>+${d.xp} XP</small></span>
            </label>`).join(""));
    }
    pintarPildorasAtributo();
    $('[data-opciones="motivo"]').insertAdjacentHTML("beforeend", Object.entries(juego.MOTIVOS_FALLA).map(([clave, m], i) => `
        <label class="pildora">
            <input type="radio" name="motivo" value="${clave}" ${i === 0 ? "checked" : ""}>
            <span><b class="pildora-icono">${m.icono}</b><small>${m.nombre}</small></span>
        </label>`).join(""));
    // Ventana de atributo propio: a cuál de los 4 le suma, y su color.
    $('[data-opciones="base"]').insertAdjacentHTML("beforeend", Object.entries(juego.ATRIBUTOS).map(([clave, a], i) => `
        <label class="pildora" style="--color-dificultad: ${a.color}">
            <input type="radio" name="base" value="${clave}" ${i === 0 ? "checked" : ""}>
            <span><b class="pildora-icono">${a.icono}</b><small>${a.nombre}</small></span>
        </label>`).join(""));
    $('[data-opciones="color"]').insertAdjacentHTML("beforeend", `
        <label class="pildora pildora-color"><input type="radio" name="color" value="" checked>
            <span title="El de su atributo base">Auto</span></label>` + juego.COLORES_PROPIOS.map((color) => `
        <label class="pildora pildora-color"><input type="radio" name="color" value="${color}">
            <span style="--muestra: ${color}" aria-label="Color ${color}"></span></label>`).join(""));
    for (const grupo of document.querySelectorAll('[data-opciones="dias"]')) {
        grupo.insertAdjacentHTML("beforeend", DIAS_LETRAS.map((letra, dia) => `
            <label class="pildora" title="${DIAS_CORTOS[dia]}">
                <input type="checkbox" name="dias" value="${dia}" checked>
                <span>${letra}</span>
            </label>`).join(""));
    }
    $("#mision-plantilla").innerHTML = '<option value="">— Escribir la mía —</option>' +
        Object.entries(juego.ATRIBUTOS).map(([clave, a]) => `<optgroup label="${a.icono} ${a.nombre}">${
            PLANTILLAS_MISIONES.filter((p) => p.atributo === clave).map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("")}</optgroup>`).join("");

    $("#logro-tipo").innerHTML = Object.entries(juego.TIPOS_LOGRO)
        .map(([clave, t]) => `<option value="${clave}">${t.texto}</option>`).join("");

    // Créditos de las obras de arte: los jefes, los fondos y los escenarios (todas de dominio público).
    const credito = (enlace, c) => `<p><a href="${enlace}" target="_blank" rel="noopener">${c.obra}</a> — ${c.artista}, ${c.anio}.</p>`;
    $("#creditos").innerHTML = `<h4>Jefes</h4>${Object.entries(campana.CREDITOS).map(([id, c]) => credito(campana.fuenteDe(id), c)).join("")}
        <h4>Fondos y escenarios</h4>${Object.entries(PINTURAS).map(([id, c]) => credito(fuentePintura(id), c)).join("")}
        <h4>Voces de la carrera</h4>${Object.values(locutor.VOCES).map((v) => `<p>${v.nombre.replace(" (grabada)", "")}: ${v.licencia}. Sintetizada con Piper (MIT).</p>`).join("")}
        <h4>Música</h4>${Object.values(musica.PISTAS).map((m) => `<p><a href="${m.fuente}" target="_blank" rel="noopener">${m.obra}</a> —
            ${m.autor}; interpreta ${m.interpretes} (${m.licencia}).</p>`).join("")}`;

    // Las pistas de música (Ajustes).
    $("#ajustes-pistas").insertAdjacentHTML("beforeend", Object.entries(musica.PISTAS).map(([clave, m]) => `
        <label class="pildora"><input type="radio" name="pista" value="${clave}">
            <span>${m.icono} ${m.nombre}<small>${m.autor.split(" ").pop()}</small></span></label>`).join(""));

    const d = juego.DIFICULTADES;
    const p = juego.PREMIOS;
    $("#reglas").innerHTML = `
        <p><strong>Misiones diarias:</strong> Fácil +${d.facil.xp} XP · Normal +${d.normal.xp} XP · Difícil +${d.dificil.xp} XP. También dan monedas y suben su atributo.</p>
        <p><strong>Veces por semana:</strong> una misión «3 veces por semana» se puede marcar cualquier día hasta cumplir la meta. No rompe la racha ni cuenta para los días perfectos.</p>
        <p><strong>Cada mes:</strong> una misión mensual toca los días del mes que elijas (el 31 = el último día, aunque el mes sea más corto).
           Ese día cuenta como cualquier misión: racha, vida y jefes. En «Otros días» ves cuándo toca la próxima vez.</p>
        <p><strong>Misiones con cantidad:</strong> tienen un botón +1 y se completan solas al llegar a la meta (ej: 8 vasos de agua).</p>
        <p><strong>Tareas sueltas:</strong> pendientes de una sola vez, con fecha. Aparecen en Hoy el día que vencen y dan XP como una misión de su dificultad.</p>
        <p><strong>Modo enfoque:</strong> ${Object.entries(juego.ENFOQUE).map(([m, dif]) => `${m} min = misión ${d[dif].nombre.toLowerCase()}`).join(", ")}. Si cancelas, no hay premio.</p>
        <p><strong>Tu pacto:</strong> el Tratado de la Voluntad es un juramento contigo mismo que firmas con el dedo. Un día
           queda «honrado» si hiciste algo (una misión, una tarea, una sesión de enfoque o tu diario) o estabas de descanso;
           los días sin misiones no cuentan. Su ley: nunca fallar dos días seguidos.</p>
        <p><strong>El Maestro y los rituales:</strong> el Maestro Aurelio te habla según cómo vas. En la mañana eliges tu
           <em>misión clave</em>: si la cumples vale el doble (XP, monedas y daño al jefe). En la noche, el ritual te hace repasar
           lo que falta (la hice / no la hice), escribir el diario y leer tu capítulo; cerrar el día da +${rituales.PREMIO_CIERRE.xp} XP
           y ${rituales.PREMIO_CIERRE.monedas} monedas.</p>
        <p><strong>La Saga de la Llama:</strong> todas las historias del juego son una sola (Héroe › Historia las ordena: la primera
           piedra, las memorias de Aurelio, la Crónica del reino, la Torre, la Mazmorra y tu libro). Su objetivo: convertirte en Vigía.
           Son ${saga.ACTOS.length} actos que se cumplen en orden (${saga.ACTOS.map((a) => a.titulo).join(", ")}); el que toca es tu
           objetivo de ahora y se ve en Hoy, en «Tu día».</p>
        <p><strong>Aurelio en todo el juego:</strong> te da una pista antes de cada guardián de la Torre y de la Mazmorra y te habla
           cuando caes; comenta cuando subes de nivel o vences a un jefe, responde a tu diario y te despide al cerrar el día.
           Sus <strong>memorias</strong> (Héroe › Historia) cuentan quién fue antes de ser tu maestro: ${memorias.MEMORIAS.length}
           capítulos que se abren en orden con tu mejor racha, tus jefes vencidos, tu nivel y tus récords de la Torre y la Mazmorra.</p>
        <p><strong>Monedas y gemas:</strong> las monedas 🪙 son para tus premios reales y solo salen de lo que haces en la vida
           real (misiones, tareas, enfoque, misiones principales, tu diario, cerrar el día y tus logros). Las gemas 💎 son la moneda
           del juego: se ganan en el arcade (minijuegos, Torre y Mazmorra) y con los premios extra (jefes, cofre del día, desafíos y
           mapa), y se gastan en el equipo de tu avatar, las mascotas y el bazar del arcade. Así, lo que ganas jugando no se
           convierte en premios reales.</p>
        <p><strong>Cofre del día:</strong> con lo primero que cumplas se desbloquea un cofre con un premio al azar (gemas, XP,
           fichas, una poción o, rara vez, equipo).</p>
        <p><strong>Eventos del día:</strong> más o menos la mitad de los días pasa algo (Mercader ambulante, Luna de sangre,
           Aguas termales…). Se pueden apagar en Ajustes.</p>
        <p><strong>Desafío relámpago:</strong> algunos días aparece un reto con reloj: ${rituales.RELAMPAGO.meta} misiones en
           ${rituales.RELAMPAGO.minutos / 60} horas por +${rituales.RELAMPAGO.premio.xp} XP y ${rituales.RELAMPAGO.premio.gemas} gemas.</p>
        <p><strong>Golpe con timing:</strong> al completar una misión, toca cuando la marca esté en la zona dorada: golpe crítico
           (+50 % de daño al jefe). Se puede apagar en Ajustes.</p>
        <p><strong>El reino (el mapa):</strong> cada cosa cumplida es un paso; cada ${mapa.PASOS_POR_LUGAR} pasos llegas a un lugar.
           Cada región tiene tesoros, santuarios y las guaridas de cuatro señores: tus jefes de Aventuras (en la región 1, los
           primeros de cada campaña; en la 2, los segundos…). Cuando vences a un señor, su guarida queda libre y tiene botín
           (+${mapa.LUGARES.guarida.premio.gemas} gemas y ${mapa.LUGARES.guarida.premio.xp} XP de su atributo). La fortaleza del final se abre cuando caen
           los cuatro. La sexta región, la Ciudadela del Carácter, tiene cuatro memoriales (se encienden al vencer a los cinco
           señores de una campaña) y el brasero de los Vigías, donde se junta su fuego. La Torre está en el Valle del Comienzo, al
           principio del camino (se sube en el Arcade). La <strong>Crónica del reino</strong> cuenta la historia y se escribe sola.</p>
        <p><strong>Mascotas:</strong> empiezas con un dragón; en la Tienda puedes adoptar otras con gemas (común, rara, épica y legendaria).
           Cada una llega como huevo y crece con las misiones diarias que completas desde que la tienes. La que te acompaña
           pelea a tu lado en la Torre con su habilidad (la cría al ${mascota.POTENCIA.cria * 100} %, la adulta al 100 %, y un
           ${Math.round((mascota.ALIMENTADA - 1) * 100)} % más si comió ese día; triste, no pelea). Acarícialas, y aliméntalas una vez al día
           (${mascota.COMIDA.precio} gemas): te curan ${mascota.COMIDA.cura} de vida.</p>
        <p><strong>Fallé:</strong> el botón ✗ de una misión marca que no la hiciste y por qué. La vida se pierde en ese
           momento (no dos veces) y el recordatorio de esa misión ya no llega. Se puede deshacer, y si al final la haces, la falla
           se borra sola. En la ficha de cada hábito ves cuántas veces fallaste y tu motivo más común.</p>
        <p><strong>Tu libro:</strong> cada día que escribes en el diario se vuelve un capítulo de «La crónica de» tu nombre, contado
           con lo que pasó ese día: misiones, tareas, jefes derrotados, logros, lo que fallaste y tus propias palabras.</p>
        <p><strong>Diario:</strong> cada día puedes marcar cómo te fue (5 ánimos), responder la pregunta del día y anotar algo
           que agradeces. Escribirlo da +${diario.PREMIO_DIARIO.xp} XP de Carisma y ${diario.PREMIO_DIARIO.monedas} monedas (una vez al día)
           y cura ${vida.VIDA.diario} de vida. En «Tu diario» ves el calendario de ánimo, lo que tu diario dice de ti, tus recuerdos,
           el buscador y puedes descargarlo.</p>
        <p><strong>Desafío de la semana:</strong> cada lunes toca uno al azar. Si lo cumples antes del domingo, abres un cofre: +${desafios.COFRE.xp} XP y ${desafios.COFRE.gemas} gemas.</p>
        <p><strong>Vida:</strong> tienes ${vida.VIDA.base} + ${vida.VIDA.porNivel} por nivel. Al terminar cada día pierdes
           ${vida.DANO.facil}/${vida.DANO.normal}/${vida.DANO.dificil} (fácil/normal/difícil) por cada misión que tocaba y no hiciste,
           ${vida.VIDA.tareaVencida} por cada tarea que vence y, el domingo, por cada vez que te faltó en las metas semanales
           (máximo ${vida.VIDA.danoMaximoDia} por día). Recuperas ${vida.CURA.facil}/${vida.CURA.normal}/${vida.CURA.dificil} por cada misión o tarea,
           ${vida.VIDA.paso} por paso de misión principal, ${vida.VIDA.enfoque} por sesión de enfoque y ${vida.VIDA.diaPerfecto} extra en un día perfecto.
           Con ${vida.VIDA.forma * 100} % o más estás <em>en plena forma</em>: +${vida.VIDA.bonoForma * 100} % de XP y monedas.
           Si llegas a 0 caes en combate: la tienda y el arcade se cierran hasta que recuperes la mitad.
           Poción: +${vida.POCION.cura} por ${vida.POCION.precio} monedas, una al día. En la Torre subes con tu vida real.</p>
        <p><strong>Los jefes también pegan (robo de vida):</strong> cada misión que fallas es un golpe del jefe de su categoría.
           Te quita vida y se la queda: se cura con ella (hasta su vida llena; nunca revive a un jefe vencido). Lo ves en una
           escena al marcar «Fallé» y al abrir la app si fallaste mientras no estabas.</p>
        <p><strong>Armadura:</strong> sale de tus objetos de protección: la ropa de tu etapa
           (${avatar.ETAPAS.map((e) => `${e.nombre} ${e.armadura}`).join(", ")}) más lo que lleves en la cabeza y en la espalda, hasta
           ${equipo.ARMADURA.tope}. Solo cuenta cuando fallas una misión: con ${equipo.ARMADURA.normal} recibes el daño normal; con 0,
           un 50 % más; con ${equipo.ARMADURA.normal * 2} o más, la mitad. Cada misión fallada la gasta
           (${equipo.ARMADURA.desgaste.facil}/${equipo.ARMADURA.desgaste.normal}/${equipo.ARMADURA.desgaste.dificil}) y cada misión o tarea cumplida la repara
           (${equipo.ARMADURA.reparacion.facil}/${equipo.ARMADURA.reparacion.normal}/${equipo.ARMADURA.reparacion.dificil}, +${equipo.ARMADURA.diaPerfecto} en un día perfecto).
           Las tareas vencidas pegan igual: la armadura no las cubre.</p>
        <p><strong>Tu equipo cuenta:</strong> cada objeto dice lo que da. 🛡️ Armadura: además de protegerte al fallar, en la Torre
           para parte de cada golpe (hasta 40 %), en la Carrera te da escudos (1 por cada 25) y en la Lluvia de monedas, vidas
           (1 por cada 30). ⚔️ Ataque: más daño en la Torre y en Golpe preciso. 🔮 Magia: hechizos más fuertes y zonas de acierto
           más anchas. 🍀 Suerte: más golpes críticos y monedas que valen más en los minijuegos.
           Lo <strong>épico y legendario</strong> tiene además una habilidad especial en la Torre (esquivar, golpear dos veces,
           resistir un golpe mortal, ver el punto débil…): cada objeto dice la suya.</p>
        <p><strong>Modo descanso:</strong> hasta ${vida.VIDA.descansoMaximo} días (vacaciones, enfermedad) sin perder vida ni racha, y sin recordatorios.</p>
        <p><strong>Tus atributos:</strong> en Progreso puedes crear hasta ${juego.MAX_ATRIBUTOS_PROPIOS} atributos para cosas
           específicas (Programación, Inglés…). Cada uno tiene su nivel y le suma a uno de los 4, así que también cuenta para
           tu clase, tu avatar, los jefes y la Torre.</p>
        <p><strong>Niveles:</strong> pasar del nivel N al N+1 cuesta ${juego.BASE_PERSONAJE}×N XP. Cada atributo sube con ${juego.BASE_ATRIBUTO}×N XP.</p>
        <p><strong>Rachas:</strong> un día cuenta si completas al menos 1 misión. Cada ${juego.ESCUDOS.diasParaGanar} días seguidos ganas un escudo (máx. ${juego.ESCUDOS.maximo}) que salva tu racha si fallas un día.</p>
        <p><strong>Bonus de regreso:</strong> si vuelves tras ${juego.REGRESO.diasMinimos} días o más, ganas ${juego.REGRESO.xpPorDia} XP por día ausente (máx. ${juego.REGRESO.xpMaximo}).</p>
        <p><strong>Misiones principales:</strong> +${p.submision.xp} XP por paso y +${p.principal.xp} XP al terminar.</p>
        <p><strong>Jefes:</strong> 5 por categoría, cada vez más fuertes. Los dañas cumpliendo objetivos de su categoría:
           misión diaria −${campana.DANO.diaria.facil}/−${campana.DANO.diaria.normal}/−${campana.DANO.diaria.dificil} (fácil/normal/difícil),
           paso de misión principal −${campana.DANO.paso}, misión principal completa −${campana.DANO.principal} extra.
           Las tareas y las sesiones de enfoque pegan como una misión diaria de su dificultad.
           Derrotar al jefe N da ${campana.premioJefe(1).xp}×N XP y ${campana.premioJefe(1).gemas}×N gemas.
           <strong>Partida+:</strong> al vencer a los 5, la campaña vuelve a empezar; cada ronda suma
           ${campana.MEJORA_POR_RONDA * 100} % a la vida de los jefes y a sus premios.</p>
        <p><strong>Días perfectos:</strong> completar todas tus misiones diarias del día.</p>
        <p><strong>Avatar:</strong> evoluciona en los niveles ${avatar.ETAPAS.slice(1).map((e) => `${e.desde} (${e.nombre})`).join(", ")}.
           Tu clase es tu atributo más alto. Cada atributo cambia algo visible en los niveles 3 y 6.
           Su ánimo depende de tu racha: tras 3 días sin misiones se duerme.</p>
        <p><strong>Crecimiento de la mascota:</strong> eclosiona con 10 misiones diarias completadas (desde que la tienes) y es adulta con 50.</p>
        <p><strong>Minijuegos:</strong> empiezas con ${arcade.FICHAS_DE_REGALO} fichas y ganas 1 por cada misión diaria completada.
           Cada partida da hasta ${arcade.MAX_GEMAS} gemas y ${arcade.MAX_XP} XP según tus puntos.
           <strong>Bazar:</strong> con gemas compras provisiones (una de cada una) que se usan al empezar tu próxima subida a la
           Torre o bajada a la Mazmorra: ${Object.values(torre.PROVISIONES).map((p) => `${p.nombre} (${p.texto.toLowerCase()})`).join(", ")}.</p>
        <p><strong>Torre del héroe:</strong> batallas por turnos piso a piso (1 ficha por subida; puedes salir y seguir después).
           Tu vida y tu ataque salen de Fuerza, los hechizos de Intelecto, la defensa de Carisma y las pociones y los críticos de Riqueza.
           Tiene ${bestiario.ZONAS.length} zonas de ${torre.CADA_GUARDIAN} pisos (${bestiario.ZONAS.map((z) => z.nombre).join(", ")}), con
           ${bestiario.ORDEN.length} criaturas propias y un guardián al final de cada zona; después del piso ${bestiario.ORDEN.length} vuelven, más fuertes.
           <strong>Desde que la Torre despertó (v38)</strong>, muchas criaturas tienen un truco: 💠 barrera (absorbe tus golpes hasta
           romperse), 🌀 carga (al turno siguiente suelta un golpe de ${String(torre.ESPECIALES.carga.golpe).replace(".", ",")} veces su ataque:
           defiéndete) o 🪞 espejo (tu próximo hechizo rebota y te quita la mitad). Algunas se regeneran, y el Apagador del piso 30
           cambia de punto débil a media vida.
           <strong>Técnicas:</strong> una por atributo, desde su nivel ${torre.NIVEL_TECNICA}, una vez por piso:
           ${Object.values(torre.TECNICAS).map((t) => `${t.icono} ${t.nombre} (${juego.ATRIBUTOS[t.atributo].nombre}: ${t.texto.toLowerCase()})`).join(", ")}.
           <strong>Voluntad:</strong> se llena al golpear, al defenderte y, sobre todo, al aguantar golpes; tu racha te da
           ${torre.VOLUNTAD.porDia} por día al empezar (máx. ${torre.VOLUNTAD.inicialMax}). Llena, el Golpe de Voluntad pega
           ${String(torre.VOLUNTAD.multiplica).replace(".", ",")} veces tu mejor ataque y rompe barreras, corazas, espejos y cargas.
           <strong>Magia:</strong> los hechizos son de fuego, hielo o rayo. Cada criatura tiene un punto débil (ese hechizo le hace
           ${Math.round((bestiario.DEBIL - 1) * 100)} % más) y algunas resisten otro (les hace la mitad). Lo que descubres queda en tu
           <strong>bestiario</strong> (botón en el Arcade): la próxima vez el menú de magia ya te lo dice.
           Premio: ${torre.PREMIO.gemasPorPiso} gemas y ${String(torre.PREMIO.xpPorPiso).replace(".", ",")} XP de Carisma
           por piso superado (máx. ${torre.PREMIO.maxGemas} y ${torre.PREMIO.maxXp}).</p>
        <p><strong>Mazmorra del Abismo:</strong> se abre al superar el piso ${torre.ABRIR_MAZMORRA} de la Torre y se juega igual, pero bajando
           (${bestiario.ZONAS_MAZMORRA.map((z) => z.nombre).join(", ")}). Es más difícil: sus ${bestiario.ORDEN_MAZMORRA.length} criaturas pegan
           más fuerte y cada una tiene un ataque especial: ☠️ veneno (${Math.round(torre.ESPECIALES.veneno.porTurno * 100)} % de tu vida por turno
           durante ${torre.ESPECIALES.veneno.turnos} turnos; una poción lo cura), 🩸 drenar (se cura lo que te quita), 🔒 sello (te quita
           ${torre.ESPECIALES.sellar.pm} hechizos) o 🐚 coraza (tu próximo golpe le hace la mitad). Sus guardianes se enfurecen al quedar con
           media vida y al bajar de sótano no recuperas vida. Premio: ${torre.REGLAS.mazmorra.premio.gemasPorPiso} gemas y
           ${torre.REGLAS.mazmorra.premio.xpPorPiso} XP de Fuerza por sótano (máx. ${torre.REGLAS.mazmorra.premio.maxGemas} y
           ${torre.REGLAS.mazmorra.premio.maxXp}).</p>
        <p><strong>Más mazmorras (v64):</strong> las <b>Minas de la Codicia</b> ⛏️ (15 niveles; se abren al bajar 10 sótanos de la Mazmorra; dan XP de
           Riqueza) y el <b>Laberinto de los Ecos</b> 🌀 (15 cámaras; se abre al bajar 10 niveles de las Minas; da XP de Intelecto). Tienen criaturas,
           historia y premios propios, y se juegan con las mismas reglas.</p>
        <p><strong>Historia:</strong> la Torre y las mazmorras cuentan una historia que sigue a la Crónica del reino. Se lee en la batalla
           la primera vez que llegas a cada zona y se puede releer con «📜 Historia» en el Arcade.</p>`;
}

// Preparativos al abrir cada ventana. Si reciben un elemento (una misión, un logro…),
// la ventana se abre en modo EDICIÓN con sus datos; si no, en modo CREAR.
export const PREPARAR = {
    mision(mision) {
        const formulario = $("#dialogo-mision form");
        modoEdicion(formulario, mision, { crear: ["Nueva misión", "Crear misión"], editar: ["Editar misión", "Guardar cambios"] });
        // La lista de plantillas y «Una sola vez» solo sirven al crear.
        ocultarCampo($("#campo-plantilla"), Boolean(mision));
        ocultarCampo($("#opcion-unica"), Boolean(mision));
        // Días: al crear, todos marcados; al editar, los de la misión.
        for (const casilla of formulario.querySelectorAll('input[name="dias"]')) {
            casilla.checked = !mision || !mision.dias || mision.dias.includes(Number(casilla.value));
        }
        // Días del mes: al crear, ninguno (tú eliges); al editar, los de la misión.
        marcarDiasMes(formulario, mision?.diasMes || []);
        if (mision) {
            formulario.elements.nombre.value = mision.nombre;
            formulario.elements.dificultad.value = mision.dificultad;
            formulario.elements.atributo.value = valorAtributo(mision);
            formulario.elements.frecuencia.value = mision.veces ? "semana" : mision.diasMes ? "mes" : "dias";
            if (mision.veces) formulario.elements.veces.value = mision.veces;
            formulario.elements.cantidad.value = mision.meta ? mision.meta.cantidad : "";
            formulario.elements.unidad.value = mision.meta ? mision.meta.unidad : "";
            formulario.elements.aviso.value = mision.aviso || "";
            formulario.elements.momento.value = mision.momento || "";
        }
        mostrarCamposFrecuencia();
    },
    tarea(tarea) {
        const formulario = $("#dialogo-tarea form");
        modoEdicion(formulario, tarea, { crear: ["Nueva tarea", "Crear tarea"], editar: ["Editar tarea", "Guardar cambios"] });
        formulario.elements.fecha.value = tarea ? tarea.fecha : hoy();   // por defecto, para hoy
        if (tarea) {
            formulario.elements.nombre.value = tarea.nombre;
            formulario.elements.aviso.value = tarea.aviso || "";
            formulario.elements.dificultad.value = tarea.dificultad;
            formulario.elements.atributo.value = valorAtributo(tarea);
        }
    },
    recompensa(recompensa) {
        const formulario = $("#dialogo-recompensa form");
        modoEdicion(formulario, recompensa, { crear: ["Nueva recompensa", "Agregar a la tienda"], editar: ["Editar recompensa", "Guardar cambios"] });
        if (recompensa) {
            formulario.elements.nombre.value = recompensa.nombre;
            formulario.elements.costo.value = recompensa.costo;
        }
    },
    logro(logro) {
        const formulario = $("#dialogo-logro form");
        modoEdicion(formulario, logro, { crear: ["Nuevo logro", "Crear logro"], editar: ["Editar logro", "Guardar cambios"] });

        const activas = estado.misiones.filter((m) => !m.archivadaEn);
        $("#logro-mision").innerHTML = activas.length
            ? activas.map((m) => `<option value="${m.id}">${vistas.esc(m.nombre)}</option>`).join("")
            : '<option value="">(primero crea una misión diaria)</option>';

        const tipo = $("#logro-tipo");
        tipo.disabled = false;
        $("#campo-recompensa").hidden = false;
        formulario.elements.recompensa.disabled = false;
        if (logro) {
            formulario.elements.nombre.value = logro.nombre;
            formulario.elements.icono.value = logro.icono || "";
            formulario.elements.descripcion.value = logro.descripcion || "";
            formulario.elements.objetivo.value = logro.objetivo;
            formulario.elements.recompensa.value = logro.recompensa;
            tipo.value = logro.tipo;
        }
        mostrarCamposLogro();
        if (logro) {
            // Al editar no se cambia la condición; y si ya lo conseguiste, tampoco la meta ni el premio.
            tipo.disabled = true;
            for (const selector of ["#campo-mision", "#campo-atributo"]) ocultarCampo($(selector), true);
            if (logro.desbloqueadoEn) {
                ocultarCampo($("#campo-objetivo"), true);
                ocultarCampo($("#campo-recompensa"), true);
            }
        }
    },
    atributo(propio) {
        const formulario = $("#dialogo-atributo form");
        modoEdicion(formulario, propio, { crear: ["Nuevo atributo", "Crear atributo"], editar: ["Editar atributo", "Guardar cambios"] });
        // La base no se cambia al editar (la XP que ya diste no se puede mover): se muestra como texto.
        ocultarCampo($("#campo-base"), Boolean(propio));
        $("#atributo-base-texto").hidden = !propio;
        if (propio) {
            const base = juego.ATRIBUTOS[propio.base];
            formulario.elements.nombre.value = propio.nombre;
            formulario.elements.icono.value = propio.icono;
            formulario.elements.color.value = propio.color;
            $("#atributo-base-texto").textContent = `Su XP también sube ${base.icono} ${base.nombre}.`;
        }
    },
    ajustes() {
        mostrarVersion();
        pintarAvisos();
        $("#ajustes-nombre").value = estado.personaje.nombre;
        $("#ajustes-sonido").checked = estado.ajustes.sonido;
        $("#ajustes-golpe").checked = estado.ajustes.golpe;
        $("#ajustes-eventos").checked = estado.ajustes.eventos;
        $("#ajustes-cinematicas").checked = estado.ajustes.cinematicas !== false;
        $("#ajustes-esencial").checked = Boolean(estado.ajustes.esencial);
        $("#ajustes-esencial-al-abrir").checked = Boolean(estado.ajustes.esencialAlAbrir);
        $("#ajustes-preguntar-animo").checked = Boolean(estado.ajustes.preguntarAnimo);
        $("#ajustes-musica-auto").checked = estado.ajustes.musicaAuto !== false;
        // Qué toca en esta escena (así se ve que la música sigue a dónde estás).
        const ahora = musica.pistaDeEscena({ pantalla: pantallaActual, torre: null, elegida: estado.ajustes.pista, auto: estado.ajustes.musicaAuto !== false });
        const pistaAhora = musica.PISTAS[ahora];
        $("#ajustes-sonando").textContent = estado.ajustes.musica && pistaAhora
            ? `🎵 En esta pantalla suena: ${pistaAhora.icono} ${pistaAhora.nombre} (${pistaAhora.obra}).` : "";
        $("#ajustes-musica").checked = estado.ajustes.musica;
        $("#ajustes-volumen").value = Math.round((Number.isFinite(estado.ajustes.volumen) ? estado.ajustes.volumen : 0.6) * 100);
        for (const radio of document.querySelectorAll('input[name="pista"]')) radio.checked = radio.value === estado.ajustes.pista;
        $("#ajustes-ultimo-respaldo").textContent = estado.ultimoRespaldo
            ? `Última copia: ${fechaLegible(estado.ultimoRespaldo)}.`
            : "Todavía no has hecho ninguna copia.";

        const hayPin = seguridad.hayPin();
        $("#ajustes-pin-estado").textContent = hayPin
            ? "Activado: la app pide tu PIN al abrirla y si vuelves después de 1 minuto."
            : "Desactivado: cualquiera con tu iPhone desbloqueado puede abrir la app.";
        $("#ajustes-pin-botones").innerHTML = hayPin
            ? `<button type="button" class="boton boton-secundario" data-accion="cambiar-pin">Cambiar PIN</button>
               <button type="button" class="boton boton-secundario" data-accion="quitar-pin">Quitar PIN</button>`
            : `<button type="button" class="boton boton-principal" data-accion="activar-pin">Activar PIN</button>`;
        if (hayPin) pintarFaceId();
        pintarNube();
        pintarDescanso();
    },
    // «Fallé»: la ventana que pregunta qué pasó.
    falla(mision) {
        const formulario = $("#dialogo-falla form");
        const fecha = fechaVista();
        formulario.elements.id.value = mision.id;
        formulario.elements.fecha.value = fecha;
        const descanso = juego.enDescanso(estado, fecha);
        $("#falla-texto").textContent = `«${mision.nombre}» quedará como fallada ${fecha === hoy() ? "hoy" : "ayer"}.` +
            (descanso ? " Estás de descanso: no pierdes vida." : ` Pierdes ${vida.DANO[mision.dificultad]} ❤️ ahora, no al terminar el día.`);
        $("#falla-pacto").textContent = estado.pacto
            ? "Reconocerlo también es cumplir tu pacto: «Solo marcaré lo que de verdad hice.» — Artículo II"
            : "Reconocerlo con honestidad también es avanzar.";
    },
    ficha(mision) {
        $("#ficha-contenido").innerHTML = vistas.fichaMision(estado, mision, hoy());
    },
    // Revisión semanal: recibe el lunes de la semana que se revisa.
    revision(lunes) {
        $("#revision-contenido").innerHTML = vistas.contenidoRevision(estado, lunes, hoy());
    },
    // (v149) Las metas del mes.
    temporada() {
        $("#temporada-contenido").innerHTML = vistas.contenidoTemporada(estado, hoy());
    },
    ordenar() {
        $("#ordenar-lista").innerHTML = vistas.listaOrdenar(estado);
    },
    nube() {
        // El código solo se pide si este teléfono todavía no lo tiene.
        const pedirCodigo = !nube.hayCodigo();
        ocultarCampo($("#nube-campo-codigo"), !pedirCodigo);
        $("#nube-campo-codigo input").required = pedirCodigo;
    },
};

// Face ID en Ajustes (solo si el teléfono lo tiene y hay PIN: el PIN es el plan B).
async function pintarFaceId() {
    if (!(await seguridad.faceIdDisponible())) return;
    $("#ajustes-pin-botones").insertAdjacentHTML("beforeend", seguridad.hayFaceId()
        ? `<button type="button" class="boton boton-secundario" data-accion="quitar-faceid">Quitar Face ID</button>`
        : `<button type="button" class="boton boton-principal" data-accion="activar-faceid">🙂 Activar Face ID</button>`);
}

export function pintarDescanso() {
    $("#ajustes-descanso").innerHTML = vistas.seccionDescanso(estado, hoy());
}

export function pintarNube() {
    $("#ajustes-nube").innerHTML = vistas.seccionNube({
        configurada: nube.configurada(),
        ultima: nube.ultimaCopia(),
        codigoGuardado: nube.hayCodigo(),
    });
}

// Pone un formulario en modo "crear" o "editar": título, texto del botón,
// los botones que solo sirven al editar y el id oculto del elemento.
function modoEdicion(formulario, elemento, textos) {
    const [titulo, boton] = elemento ? textos.editar : textos.crear;
    formulario.querySelector("[data-titulo]").textContent = titulo;
    formulario.querySelector("[data-enviar]").textContent = boton;
    formulario.querySelector("[data-solo-editar]").hidden = !elemento;
    formulario.elements.id.value = elemento ? elemento.id : "";
}

// Oculta (o muestra) un campo y desactiva sus controles para que el formulario no los pida.
function ocultarCampo(campo, oculto) {
    campo.hidden = oculto;
    for (const control of campo.querySelectorAll("input, select")) control.disabled = oculto;
}

// El id del elemento que se está editando en la ventana de un botón.
export function idEnEdicion(boton) {
    return Number(boton.closest("form").elements.id.value);
}

// Las píldoras de atributo (los 4 + los tuyos). Se arman al abrir cada ventana,
// así siempre aparecen los atributos que hayas creado.
function pintarPildorasAtributo(raiz = document) {
    for (const grupo of raiz.querySelectorAll('[data-opciones="atributo"]')) {
        const leyenda = grupo.querySelector("legend").outerHTML;
        grupo.innerHTML = leyenda + vistas.pildorasAtributo(estado, "fuerza");
    }
}

// El valor de la píldora de algo que ya existe: "fuerza" o, si tiene uno tuyo, "propio:5".
function valorAtributo(elemento) {
    return elemento.atributoPropio ? juego.clavePropio(elemento.atributoPropio) : elemento.atributo;
}

export function abrirDialogo(nombre, elemento = null) {
    const dialogo = $(`#dialogo-${nombre}`);
    pintarPildorasAtributo(dialogo);
    for (const formulario of dialogo.querySelectorAll("form")) formulario.reset();
    PREPARAR[nombre]?.(elemento);
    dialogo.showModal();
}

// En la misión: mostrar los días de la semana, o cuántas veces por semana.
// En la misión: mostrar los días de la semana, las veces por semana o la fecha (si es de una sola vez).
export function mostrarCamposFrecuencia() {
    const frecuencia = $("#dialogo-mision form").elements.frecuencia.value;
    ocultarCampo($("#campo-dias"), frecuencia !== "dias");
    ocultarCampo($("#campo-veces"), frecuencia !== "semana");
    ocultarCampo($("#campo-mes"), frecuencia !== "mes");
    ocultarCampo($("#campo-unica"), frecuencia !== "unica");
    ocultarCampo($("#campos-repetir"), frecuencia === "unica");
}

// Marca en el formulario de misión los días del mes de la lista (y desmarca los demás).
function marcarDiasMes(formulario, diasMes) {
    for (const casilla of formulario.querySelectorAll('input[name="diasMes"]')) {
        casilla.checked = diasMes.includes(Number(casilla.value));
    }
}

// Elegir un hábito de la lista rellena el formulario de misión.
export function usarPlantilla() {
    const plantilla = PLANTILLAS_MISIONES.find((p) => p.id === $("#mision-plantilla").value);
    if (!plantilla) return;
    const f = $("#dialogo-mision form").elements;
    f.nombre.value = plantilla.nombre;
    f.dificultad.value = plantilla.dificultad;
    f.atributo.value = plantilla.atributo;
    f.frecuencia.value = plantilla.frecuencia || "dias";
    if (plantilla.veces) f.veces.value = plantilla.veces;
    for (const casilla of $("#dialogo-mision form").querySelectorAll('input[name="dias"]')) {
        casilla.checked = !plantilla.dias || plantilla.dias.includes(Number(casilla.value));
    }
    if (plantilla.diasMes) marcarDiasMes($("#dialogo-mision form"), plantilla.diasMes);
    f.cantidad.value = plantilla.cantidad || "";
    f.unidad.value = plantilla.unidad || "";
    f.momento.value = plantilla.momento || "";
    mostrarCamposFrecuencia();
}

// En el logro, mostrar solo los campos que usa el tipo de condición elegido.
export function mostrarCamposLogro() {
    const campo = juego.TIPOS_LOGRO[$("#logro-tipo").value].campo;
    ocultarCampo($("#campo-mision"), campo !== "mision");
    ocultarCampo($("#campo-atributo"), campo !== "atributo");
    ocultarCampo($("#campo-objetivo"), campo === "manual");   // un logro personal no tiene meta numérica
}


// ===== Notificaciones =====

// Dibuja la sección de notificaciones de Ajustes. Depende del teléfono
// (si la app está instalada, si diste permiso…), por eso se arma aparte.
export async function pintarAvisos() {
    const info = {
        compatible: avisos.compatible(),
        instalar: avisos.esIphone() && !avisos.instalada(),
        permiso: "Notification" in window ? Notification.permission : "default",
        activadas: await avisos.activadas(registroSW),
    };
    $("#ajustes-avisos").innerHTML = vistas.seccionAvisos(estado, info);
}

// Después de cambiar los horarios: mandarlos al servidor de avisos.
export function sincronizarAvisos() {
    avisos.sincronizar(registroSW, estado).catch((error) => avisar(`⚠️ ${error.message}`));
}

export function probarAvisos() {
    return avisos.probar().then((respuesta) => avisar(respuesta.ok
        ? "🔔 Aviso de prueba enviado"
        : `⚠️ El servicio de avisos respondió ${respuesta.estado}`));
}
