// vistas-heroe.js — La pestaña Héroe: el personaje, insignias, aspecto, equipo, mascota y objetos de logro.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as avatar from "./avatar.js";
import * as habilidades from "./habilidades.js";
import * as vida from "./vida.js";
import * as mascota from "./mascota.js";
import * as equipo from "./equipo.js";
import { dibujarMascota, dibujarObjeto } from "./dibujo.js";
import { retratoPixel, figuraPixel, dioramaPixel, pixelEstatico, pixelarEnVivo } from "./retratos.js";
import * as insignias from "./insignias.js";   // (v101)
import { dibujarInsignia } from "./dibujo-insignias.js";
import * as gymReglas from "./gym.js";
import { esc, textoAnimo, barraDeVida, barraDeArmadura, selectorSecciones, barra, vacio } from "./vistas-comun.js";
import { seccionHistoria } from "./vistas-historia.js";

const { plural } = juego;

// Miniatura de un objeto, con el marco del color de su rareza.
export function iconoObjeto(id, extra = "") {
    return `<span class="objeto-icono rareza-${avatar.OBJETOS[id].rareza} ${extra}">${pixelEstatico(dibujarObjeto(id), 32, 32)}</span>`;
}


export function textoRareza(objeto) {
    const rareza = avatar.RAREZAS[objeto.rareza];
    return `<span class="rareza-texto" style="color: ${rareza.color}">${rareza.nombre}</span>`;
}


// Lo que da un objeto, para ponerlo al final de su línea. Ej: " · 🛡️ +12 · 🍀 +4" (o nada).
export function poderDe(objeto) {
    const texto = equipo.textoPoder(objeto.poder);
    // (v99) Cada par («🛡️ +8», «🔮 +4») va junto, pero entre uno y otro sí puede saltar de línea.
    return texto ? ` · ${texto.split(" · ").map((parte) => `<span class="poder-objeto">${parte}</span>`).join(" · ")}` : "";
}


// La habilidad de la Torre de un objeto épico o legendario (v26), en su propia línea (o nada).
export function habilidadDe(objeto) {
    const h = habilidades.HABILIDADES[objeto.habilidad];
    return h ? `<span class="habilidad-objeto">${h.icono} <b>${h.nombre}</b> · ${h.texto} <i>(en la Torre)</i></span>` : "";
}



// ===== Pantalla: Personaje (avatar, clase, equipamiento y mascota) =====

// (v66) Un botón en la ficha del héroe: su nivel de gym y el acceso al gimnasio.
function botonDeGym(estado) {
    const n = gymReglas.nivelDeGym(estado.gym.sesiones);
    const rango = gymReglas.rangoDe(n.nivel);
    const sesiones = estado.gym.sesiones.length;
    return `
        <button type="button" class="ficha-gym" data-accion="ir" data-pantalla="gym">
            <span class="ficha-gym-icono" aria-hidden="true">🏋️</span>
            <span class="ficha-gym-texto"><b>Gimnasio · nivel ${n.nivel} · ${rango.icono} ${rango.nombre}</b>
                <small>${sesiones ? `${plural(sesiones, "sesión", "sesiones")} · +${Math.round(gymReglas.bonoDeGym(n.nivel) * 100)} % de vida y ataque en la Torre` : "Entrena de verdad y tu héroe se hará más fuerte."}</small></span>
            <span aria-hidden="true">›</span>
        </button>`;
}


export function pantallaPersonaje(estado, ctx) {
    const a = ctx.avatar;
    const vista = ctx.subvista?.personaje || "equipo";

    // Las 4 etapas, marcando la actual y las que ya pasaste.
    const etapas = avatar.ETAPAS.map((e) => {
        const clase = e === a.etapa ? "actual" : a.nivel >= e.desde ? "pasada" : "";
        return `<li class="${clase}"><span>${e.nombre}</span><small>Nv ${e.desde}</small></li>`;
    }).join("");

    // Las secciones (solo se ve una a la vez). Los niveles de tus atributos y sus rasgos están en Progreso.
    const secciones = {
        equipo: () => `${seccionEquipamiento(estado, ctx)}${seccionObjetosDeLogro(estado, ctx, "Objetos por ganar")}`,
        mascotas: () => seccionMascota(estado, a.mascota, ctx),
        apariencia: () => seccionApariencia(estado, ctx),
        historia: () => seccionHistoria(estado, ctx),
        insignias: () => seccionInsignias(estado, ctx),   // (v101)
    };

    return `
        <section class="panel ficha">
            <div class="ficha-avatar">${dioramaPixel(a)}</div>
            <h2 class="titulo-juego">${esc(estado.personaje.nombre)}${a.insignia ? `<span class="ficha-insignia" title="${esc(insignias.POR_ID[a.insignia]?.nombre || "")}">${dibujarInsignia(a.insignia)}</span>` : ""}</h2>
            <p class="etiqueta">Nivel ${a.nivel} · ${a.etapa.nombre} · ${a.clase.icono} ${a.clase.nombre}</p>
            <p class="heroe-animo">${textoAnimo(a, ctx)}</p>
            <div class="ficha-vida">${barraDeVida(ctx.vida)}${barraDeArmadura(ctx.vida.armadura)}</div>
            <p class="mini texto-suave">${vida.ESTADOS[ctx.vida.nivel].texto} 🛡️ La armadura cuenta cuando fallas una misión:
               se gasta al fallar y se repara cumpliendo.</p>
            <ol class="etapas">${etapas}</ol>
            ${botonDeGym(estado)}
        </section>
        ${selectorSecciones("personaje", [["equipo", "🛡️ Equipo"], ["mascotas", "🐾 Mascotas"], ["apariencia", "🎨 Aspecto"], ["insignias", "🏅 Insignias"], ["historia", "📜 Historia"]], vista)}
        ${(secciones[vista] || secciones.equipo)()}`;
}


// (v101) Las insignias: la que llevas puesta arriba, y todas en una rejilla por grado (las que faltan, en sombra y con su avance).
function seccionInsignias(estado, ctx) {
    const datos = insignias.datosDeInsignias(estado, ctx.info || ctx.resumen || juego.resumen(estado, ctx.hoy));
    const lista = insignias.INSIGNIAS.map((i) => ({ ...i, ...insignias.progresoInsignia(i, datos) }));
    const tuyas = lista.filter((i) => i.ganada).length;
    const puesta = estado.insignias?.puesta;
    const tarjeta = (i) => `
        <li class="insignia ${i.ganada ? "ganada" : "bloqueada"} ${puesta === i.id ? "puesta" : ""} grado-${i.grado}">
            <span class="insignia-dibujo">${dibujarInsignia(i.id, { bloqueada: !i.ganada })}</span>
            <b>${i.ganada ? i.nombre : "???"}</b>
            <small>${i.texto}</small>
            ${i.ganada
                ? `<button type="button" class="boton boton-chico ${puesta === i.id ? "" : "boton-oro"}" data-accion="poner-insignia" data-id="${i.id}">${puesta === i.id ? "Quitar" : "Llevar"}</button>`
                : `<span class="insignia-avance">${barra(i.porcentaje, "barra-mini")}<small>${i.actual} / ${i.meta}</small></span>`}
        </li>`;
    const grupos = Object.entries(insignias.GRADOS).map(([grado, g]) => {
        const deEste = lista.filter((i) => i.grado === grado);
        return `<h3 class="subtitulo">${g.nombre} <small class="texto-suave">${deEste.filter((i) => i.ganada).length}/${deEste.length}</small></h3>
                <ul class="insignias">${deEste.map(tarjeta).join("")}</ul>`;
    }).join("");
    return `
        <section class="panel">
            <div class="titulo-seccion"><h2 class="titulo-juego">🏅 Insignias</h2><span class="etiqueta">${tuyas} de ${lista.length}</span></div>
            <p class="nota">Se ganan solas al llegar a un hito. Elige una para <b>llevarla puesta</b>: se ve en el pecho de tu héroe
               y junto a tu nombre.</p>
            ${puesta ? `<p class="insignia-llevas">${dibujarInsignia(puesta)}<span>Llevas <b>${insignias.POR_ID[puesta].nombre}</b><small>${insignias.POR_ID[puesta].texto}</small></span></p>` : ""}
            ${grupos}
        </section>`;
}



// Apariencia: cuerpo, piel, rostro, ojos, pelo, peinado, barba y color del traje.
// Los colores se eligen con círculos de color; lo demás, con botones de texto.
const TITULOS_APARIENCIA = {
    cuerpo: "Cuerpo", piel: "Tono de piel", rostro: "Rostro", ojos: "Color de ojos",
    pelo: "Color de pelo", peinado: "Peinado", barba: "Barba", traje: "Color del traje", marca: "Marcas", complemento: "Complementos" };


function seccionApariencia(estado, ctx) {
    const grupos = Object.entries(avatar.APARIENCIA).map(([campo, opciones]) => {
        const elegida = estado.apariencia[campo];
        const conColor = Object.values(opciones).some((opcion) => opcion.color);
        const botones = Object.entries(opciones).map(([valor, opcion]) => {
            const datos = `data-accion="apariencia" data-campo="${campo}" data-valor="${valor}" aria-pressed="${valor === elegida}"`;
            if (!conColor) return `<button type="button" ${datos}>${opcion.nombre}</button>`;
            // Una opción sin color propio (el traje "de tu clase") usa el color de la clase.
            return opcion.color
                ? `<button type="button" class="muestra" style="--color-muestra: ${opcion.color}" ${datos} aria-label="${opcion.nombre}"></button>`
                : `<button type="button" class="muestra auto" style="--color-muestra: ${ctx.avatar.clase.oscuro}" ${datos} aria-label="${opcion.nombre}">A</button>`;
        }).join("");
        const muchas = Object.keys(opciones).length > 4;
        return `
            <div class="apariencia-grupo">
                <span class="apariencia-titulo">${TITULOS_APARIENCIA[campo]} <small>${(opciones[elegida] || Object.values(opciones)[0]).nombre}</small></span>
                <div class="${conColor ? "muestras" : `selector ${muchas ? "selector-rejilla" : ""}`}" role="group" aria-label="${TITULOS_APARIENCIA[campo]}">${botones}</div>
            </div>`;
    }).join("");

    return `
        <section class="panel apariencia">
            <h2 class="titulo-juego">Apariencia</h2>
            <p class="nota">Elige cómo se ve tu avatar. Es gratis y lo puedes cambiar cuando quieras.</p>
            <!-- vista previa: se queda a la vista mientras eliges -->
            <div class="apariencia-previa">
                ${figuraPixel(ctx.avatar, { alt: "Así se ve tu héroe" })}
                ${retratoPixel(ctx.avatar, { lado: 160, clase: "primer-plano", alt: "Tu rostro de cerca" })}
            </div>
            ${grupos}
        </section>`;
}


function seccionEquipamiento(estado, ctx) {
    const a = ctx.avatar;
    const disponibles = avatar.objetosDisponibles(estado, ctx.info);
    const poder = equipo.poderDelEquipo(estado);
    const ropa = a.etapa.armadura || 0;

    const espacios = Object.entries(avatar.ESPACIOS).map(([espacio, nombre]) => {
        const id = a.equipado[espacio];
        const objeto = id ? avatar.OBJETOS[id] : null;
        return `<div class="espacio ${objeto ? `lleno rareza-${objeto.rareza}` : ""}">
                    <span class="espacio-icono">${objeto ? pixelEstatico(dibujarObjeto(id), 32, 32) : "—"}</span>
                    <span class="mini texto-suave">${nombre}</span>
                    <span class="mini">${objeto ? esc(objeto.nombre) : "Vacío"}</span>
                </div>`;
    }).join("");

    const inventario = [...disponibles].map((id) => {
        const objeto = avatar.OBJETOS[id];
        const puesto = a.equipado[objeto.espacio] === id;
        return `<li class="objeto ${puesto ? "puesto" : ""}">
                    ${iconoObjeto(id)}
                    <span class="objeto-info"><b>${objeto.nombre}</b>
                        <span class="mini texto-suave">${avatar.ESPACIOS[objeto.espacio]} · ${textoRareza(objeto)}${poderDe(objeto)}</span>
                        ${habilidadDe(objeto)}</span>
                    <button type="button" class="boton boton-chico ${puesto ? "" : "boton-oro"}" data-accion="equipar" data-id="${id}">
                        ${puesto ? "Quitar" : "Equipar"}</button>
                </li>`;
    }).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Equipamiento</h2>
            <div class="espacios">${espacios}</div>
            <div class="poder-equipo">
                <span><b>🛡️ ${ctx.vida.armadura.maxima}</b><small>Armadura máx.<br>${ropa} ropa + ${poder.armadura} objetos</small></span>
                <span><b>⚔️ +${poder.ataque}</b><small>Ataque</small></span>
                <span><b>🔮 +${poder.magia}</b><small>Magia</small></span>
                <span><b>🍀 +${poder.suerte}</b><small>Suerte</small></span>
            </div>
            <p class="nota">Lo que llevas puesto cuenta: la <b>armadura</b> te protege cuando fallas una misión, y el
               <b>ataque</b>, la <b>magia</b> y la <b>suerte</b> te hacen más fuerte en la Torre y en los minijuegos.</p>
            <h3 class="subtitulo">Tus objetos (${disponibles.size})</h3>
            ${disponibles.size
                ? `<ul class="lista">${inventario}</ul>`
                : vacio("Aún no tienes objetos. Cómpralos en la Tienda con gemas 💎 o gánalos con logros.")}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="subvista" data-pantalla="tienda" data-vista="equipo">⚔️ Ver el equipo de la tienda</button>
        </section>`;
}


function seccionMascota(estado, m, ctx) {
    const comio = mascota.comioHoy(estado, ctx.hoy);
    const siguiente = avatar.siguienteEtapa(avatar.ETAPAS_MASCOTA, m.etapa);
    const crecimiento = siguiente
        ? `${siguiente.clave === "cria" ? "Eclosiona" : "Crece a adulto"} en ${plural(siguiente.desde - m.total, "misión diaria", "misiones diarias")} más.`
        : "Ya es adulto. ¡Lo cuidaste muy bien!";
    const animo = m.triste
        ? "😢 Está triste: hace días que no completas misiones."
        : "😊 Está contento.";
    const enLaTorre = mascota.textoPotencia(mascota.mascotaDeBatalla(estado, m, ctx.hoy));
    // Las demás mascotas que tienes, para elegir cuál te acompaña.
    const otras = mascota.mascotasTuyas(estado).filter((especie) => especie !== m.especie).map((especie) => {
        const etapa = avatar.etapaSegun(avatar.ETAPAS_MASCOTA, mascota.totalDe(estado, especie));
        return `<li class="objeto">
                    ${retratoMascota(especie)}
                    <span class="objeto-info"><b>${esc(mascota.nombreDe(estado, especie))}</b>
                        <span class="mini texto-suave">${mascota.MASCOTAS[especie].nombre} · ${etapa.nombre} · ${textoRareza(mascota.MASCOTAS[especie])}</span></span>
                    <button type="button" class="boton boton-chico" data-accion="elegir-mascota" data-especie="${especie}">Llevar</button>
                </li>`;
    }).join("");

    return `
        <section class="panel">
            <h2 class="titulo-juego">Mascota</h2>
            <div class="mascota-ficha">
                <div class="mascota-dibujo">${pixelarEnVivo(dibujarMascota(m), 72 / 44)}</div>
                <div>
                    <p><b>${esc(m.nombre)}</b> · ${mascota.MASCOTAS[m.especie].nombre} · ${m.etapa.nombre}</p>
                    <p class="mini texto-suave">${crecimiento}</p>
                    <p class="mini">${animo}</p>
                </div>
            </div>
            <p class="mini">${habilidadDeMascota(m.especie)}</p>
            <p class="mini texto-suave">🗼 En la Torre ${enLaTorre}.</p>
            ${panelDeVinculo(estado, m, ctx)}
            <div class="mascota-acciones">
                <button type="button" class="boton ${comio ? "boton-secundario" : "boton-oro"}" data-accion="alimentar-dragon" ${comio ? "disabled" : ""}>
                    🍖 ${comio ? "Ya comió hoy" : `Alimentar · 💎 ${mascota.COMIDA.precio}`}</button>
                ${botonExplorar(estado, m, ctx)}
            </div>
            <p class="mini mascota-frase" id="mascota-frase">${estado.mascota.exploraciones?.[ctx.hoy]?.especie === m.especie
                ? esc(estado.mascota.exploraciones[ctx.hoy].texto)
                : comio ? `${esc(m.nombre)} comió hoy y está de buen ánimo.`
                : `Cuídalo cada día: sube su vínculo contigo. Comer le da ánimo (+${mascota.COMIDA.cura} ❤️ para ti).`}</p>
            <form class="form-linea" data-form="mascota">
                <input type="text" name="nombre" maxlength="20" required autocomplete="off" placeholder="Nuevo nombre" aria-label="Nombre de la mascota">
                <button type="submit" class="boton boton-chico">Renombrar</button>
            </form>
            <p class="nota">Crece con cada misión diaria que completas desde que la tienes: huevo → cría (10) → adulto (50).</p>
            ${otras ? `<h3 class="subtitulo">Tus otras mascotas</h3><ul class="lista">${otras}</ul>` : ""}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="subvista" data-pantalla="tienda" data-vista="mascotas">🐾 Adoptar en la tienda</button>
        </section>`;
}


// (v103) El vínculo con tu mascota: su nivel, los cuidados de hoy y los trucos que aprendió.
function panelDeVinculo(estado, m, ctx) {
    const puntos = mascota.vinculoDe(estado, m.especie);
    const v = mascota.nivelDeVinculo(puntos);
    const hechos = mascota.cuidadosDeHoy(estado, m.especie, ctx.hoy);
    const huevo = m.etapa.clave === "huevo";
    const cuidados = Object.entries(mascota.CUIDADOS).map(([tipo, c]) => {
        const hecho = hechos.includes(tipo);
        const imposible = huevo && !c.huevo;
        // Acariciar se puede repetir (te responde), pero suma una sola vez al día.
        const apagado = imposible || (hecho && tipo !== "acariciar");
        return `<button type="button" class="cuidado ${hecho ? "hecho" : ""}" data-accion="cuidar-mascota" data-tipo="${tipo}" ${apagado ? "disabled" : ""}
                        title="${c.texto}"><span aria-hidden="true">${hecho ? "✅" : c.icono}</span>${c.nombre}<small>${hecho ? "hoy ✓" : imposible ? "al nacer" : `+${c.puntos}`}</small></button>`;
    }).join("");
    const trucos = mascota.trucosDe(puntos);
    const proximo = mascota.TRUCOS.find((t) => t.nivel > v.indice);
    return `
        <div class="vinculo">
            <p class="vinculo-titulo"><span>💗 Vínculo: <b>${v.nombre}</b></span><small>${v.siguiente ? `${puntos} / ${v.siguiente.desde}` : "al máximo"}</small></p>
            ${barra(v.porcentaje, "barra-mini barra-vinculo")}
            <p class="mini texto-suave">${v.bono ? `Pelea ${Math.round(v.bono * 100)} % más en la Torre. ` : ""}${v.siguiente ? `Siguiente: ${v.siguiente.nombre}${proximo ? ` (aprende «${proximo.nombre}»)` : ""}.` : "Nada los separa."}</p>
            <div class="cuidados">${cuidados}</div>
            ${trucos.length ? `<p class="mini">Trucos: ${trucos.map((t) => `<button type="button" class="chip" data-accion="truco-mascota" data-truco="${t.id}">${t.icono} ${t.nombre}</button>`).join(" ")}</p>` : ""}
        </div>`;
}


// (v103) Mandarla a explorar (una vez al día).
function botonExplorar(estado, m, ctx) {
    const hoyFue = estado.mascota.exploraciones?.[ctx.hoy];
    const huevo = m.etapa.clave === "huevo";
    return `<button type="button" class="boton ${hoyFue || huevo ? "boton-secundario" : "boton-principal"}" data-accion="explorar-mascota" ${hoyFue || huevo ? "disabled" : ""}>
                🧭 ${hoyFue ? "Ya exploró hoy" : huevo ? "Explorar (al nacer)" : "Explorar"}</button>`;
}


// Objetos que no se compran: solo se ganan con logros.
// Los objetos que no se compran: solo se ganan con logros. Aquí van los que TODAVÍA no ganaste,
// con lo que llevas; los ganados ya están arriba, en «Tus objetos».
function seccionObjetosDeLogro(estado, ctx, titulo) {
    const deLogro = Object.entries(avatar.OBJETOS).filter(([, o]) => o.logro);
    const pendientes = deLogro.filter(([, o]) => avatar.progresoObjeto(o, estado, ctx.info) < o.logro.meta);
    const lista = pendientes.map(([id, o]) => {
        const progreso = avatar.progresoObjeto(o, estado, ctx.info);
        return `<li class="objeto">
                    ${iconoObjeto(id, "bloqueado")}
                    <span class="objeto-info"><b>${o.nombre}</b>
                        <span class="mini texto-suave">${textoRareza(o)}${poderDe(o)} · ${o.logro.texto}</span>
                        ${habilidadDe(o)}
                        ${barra(Math.round((progreso / o.logro.meta) * 100), "barra-mini")}</span>
                    <span class="mini texto-suave">${progreso}/${o.logro.meta}</span>
                </li>`;
    }).join("");
    return `
        <section class="panel">
            <h2 class="titulo-juego">🏅 ${titulo}</h2>
            <p class="nota">No se pueden comprar: solo se ganan. Llevas ${deLogro.length - pendientes.length} de ${deLogro.length}.</p>
            ${pendientes.length ? `<ul class="lista">${lista}</ul>` : vacio("¡Los ganaste todos! Están en «Tus objetos».")}
        </section>`;
}



// Aviso de que caíste en combate (en la Tienda y en el Arcade).
export function avisoCaido(v, titulo) {
    return `
        <div class="aviso-caido">
            <b>☠️ ${titulo}</b>
            <span>Caíste en combate. Se abre cuando llegues a <b>${v.levantarse} ❤️</b> (tienes ${v.puntos}).
                  Cada misión cumplida te cura; las pociones sí se venden.</span>
        </div>`;
}


// La poción de vida: +25 ❤️, una al día. Se vende aunque hayas caído.
export function tarjetaPocion(estado, v) {
    const p = vida.POCION;
    let boton;
    if (v.pocionesHoy >= p.porDia) boton = '<span class="mini texto-suave">Mañana otra</span>';
    else if (v.puntos >= v.maxima) boton = '<span class="mini texto-suave">Vida llena</span>';
    else {
        const puede = estado.personaje.monedas >= p.precio;
        boton = `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="pocion" ${puede ? "" : "disabled"}>Tomar</button>`;
    }
    return `
        <ul class="lista">
            <li class="objeto pocion">
                <span class="pocion-icono" aria-hidden="true">🧪</span>
                <span class="objeto-info"><b>Poción de vida</b>
                    <span class="mini texto-suave">+${p.cura} ❤️ · 🪙 ${p.precio} · una al día · tienes ${v.puntos}/${v.maxima}</span></span>
                ${boton}
            </li>
        </ul>`;
}



// La mascota dibujada en su marco de rareza (adulta, para ver cómo será).
export function retratoMascota(especie, extra = "") {
    const datos = mascota.MASCOTAS[especie];
    const m = { especie, nombre: datos.nombre, etapa: { clave: "adulto", nombre: "Adulta" }, total: 0, triste: false };
    return `<span class="objeto-icono retrato-mascota rareza-${datos.rareza} ${extra}">${pixelEstatico(dibujarMascota(m), 44, 34)}</span>`;
}


// Una línea con lo que hace una mascota en la Torre.
export function habilidadDeMascota(especie) {
    const h = mascota.MASCOTAS[especie].habilidad;
    return `<span class="habilidad-objeto">🐾 <b>${h.nombre}</b> · ${h.texto} <i>(en la Torre)</i></span>`;
}
