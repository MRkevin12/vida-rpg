// vistas-torre.js — La Torre y la Mazmorra: la batalla por turnos, los comandos, el final, los relatos y el bestiario.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as leyendas from "./leyendas.js";
import * as habilidades from "./habilidades.js";
import * as maestro from "./maestro.js";
import * as mascota from "./mascota.js";
import * as ataques from "./ataques.js";
import * as gymReglas from "./gym.js";
import { hoy as fechaDeHoy } from "./fechas.js";
import { esc, barra, ICONOS, textoPremioReto, ficha } from "./vistas-comun.js";

const { ATRIBUTOS, plural } = juego;

// La Mazmorra del Abismo (v29): cerrada (con lo que falta para abrirla) o abierta.
// Las marcas de partida (v41): 3 al día, o la que llevas si ya hay una partida en curso.
// Los botones de radio se llaman "marca-torre" / "marca-mazmorra"; app.js lee el que esté marcado.
const textoPremioMarca = (m) => `premio ×${String(m.premio).replace(".", ",")}`;


// (v65) Los modos de juego: Normal, Asalto de guardianes y Reto diario. Con una partida en curso, solo se dice cuál es.
// Los botones de radio se llaman "modo-torre" / "modo-minas"…; app.js lee el que esté marcado.
// (v66) Lo que tu entrenamiento real le da al héroe en el combate, o cómo conseguirlo.
export function notaDeGym(estado) {
    const nivel = gymReglas.nivelDeGym(estado.gym.sesiones).nivel;
    const bono = Math.round(gymReglas.bonoDeGym(nivel) * 100);
    const bombeo = gymReglas.bombeoDeHoy(estado.gym.sesiones, fechaDeHoy());
    const linea = bono
        ? `<p class="mini equipo-ventaja">🏋️ Tu nivel de gym (${nivel}) te da <b>+${bono} % de vida y de ataque</b>.</p>`
        : '<p class="mini texto-suave">🏋️ Entrena en el gimnasio y tu héroe ganará vida y ataque aquí.</p>';
    // (v80) El bombeo: entrenaste hoy.
    return linea + (bombeo
        ? `<p class="mini equipo-ventaja">💪 <b>Bombeo:</b> entrenaste hoy, así que tu héroe va un <b>+${Math.round(gymReglas.BOMBEO * 100)} % más fuerte</b> (vida y ataque) hasta mañana.</p>`
        : `<p class="mini texto-suave">💪 El día que entrenas, tu héroe gana un +${Math.round(gymReglas.BOMBEO * 100)} % extra (el «bombeo»).</p>`);
}


export function selectorDeModo(estado, lugar, partida, fecha) {
    const M = torre.MODOS;
    if (partida) {
        const m = M[torre.modoDe(partida)];
        return `<p class="mini equipo-ventaja">${m.icono} Modo: <b>${m.nombre}</b></p>`;
    }
    const recordAsalto = estado.arcade.records[`asalto-${lugar}`] || 0;
    const sitio = bestiario.LUGARES[lugar];
    const faltaAsalto = (estado.arcade.records[lugar] || 0) < M.asalto.pisoMinimo;
    const d = estado.arcade.diaria;
    const hoyD = d.fecha === fecha ? d : { mejor: 0, cobrado: false };
    const marca = torre.MARCAS[torre.marcaDeLaDiaria(fecha, lugar)];
    return `
        <fieldset class="opciones opciones-1 modos">
            <legend>Modo de juego</legend>
            <label class="pildora"><input type="radio" name="modo-${lugar}" value="normal" checked><span><b>${M.normal.icono} ${M.normal.nombre}</b><small>${M.normal.texto}</small></span></label>
            <label class="pildora ${faltaAsalto ? "apagada" : ""}"><input type="radio" name="modo-${lugar}" value="asalto" ${faltaAsalto ? "disabled" : ""}><span><b>${M.asalto.icono} ${M.asalto.nombre}</b>
                <small>${faltaAsalto ? `🔒 Supera el piso ${M.asalto.pisoMinimo} de ${sitio.nombre}.` : `${M.asalto.texto}${recordAsalto ? ` Tu récord: ${plural(recordAsalto, "guardián", "guardianes")}.` : ""}`}</small></span></label>
            <label class="pildora"><input type="radio" name="modo-${lugar}" value="diaria"><span><b>${M.diaria.icono} ${M.diaria.nombre}</b>
                <small>${M.diaria.texto} Hoy: ${marca.icono} ${marca.nombre}. ${hoyD.cobrado ? "✅ Premio de hoy cobrado." : `Mejor de hoy: ${hoyD.mejor} de ${M.diaria.meta} (+${M.diaria.bonus.gemas} 💎).`}</small></span></label>
        </fieldset>`;
}


export function selectorDeMarcas(lugar, partida, fecha) {
    if (partida) {
        const m = torre.MARCAS[partida.marca];
        return `<p class="mini equipo-ventaja">${m ? `✦ Marca: ${m.icono} <b>${m.nombre}</b> (${m.texto} · ${textoPremioMarca(m)})` : "✦ Sin marca"}</p>`;
    }
    return `
        <fieldset class="opciones opciones-1 marcas">
            <legend>Marca de esta partida <span class="texto-suave">(opcional: más riesgo, más premio)</span></legend>
            <label class="pildora"><input type="radio" name="marca-${lugar}" value="" checked><span><b>Sin marca</b><small>Como siempre</small></span></label>
            ${torre.marcasDelDia(fecha, lugar).map((clave) => {
                const m = torre.MARCAS[clave];
                return `<label class="pildora"><input type="radio" name="marca-${lugar}" value="${clave}"><span><b>${m.icono} ${m.nombre}</b><small>${m.texto} · ${textoPremioMarca(m)}</small></span></label>`;
            }).join("")}
        </fieldset>`;
}


// (v64) Una tarjeta por mazmorra: la del Abismo (v29) y, a partir de ella, las Minas de la Codicia y el Laberinto de los Ecos.
// Cerrada dice qué falta para abrirla; abierta, lo que hay dentro, tu récord y el botón para entrar.
export function tarjetaMazmorra(estado, caido, fichas, fecha, lugar = "mazmorra") {
    const sitio = bestiario.LUGARES[lugar];
    const abre = lugar === "mazmorra" ? { lugar: "torre", piso: torre.ABRIR_MAZMORRA } : sitio.abre;
    const previo = bestiario.LUGARES[abre.lugar];
    if (!torre.lugarAbierto(torre.arcadeConGym(estado), lugar)) {
        const record = estado.arcade.records[abre.lugar] || 0;
        return `
            <article class="panel mazmorra-cerrada">
                <span class="mazmorra-candado" aria-hidden="true">🔒</span>
                <div>
                    <h3>${sitio.icono} ${sitio.nombre}</h3>
                    <p class="nota">${lugar === "mazmorra"
                        ? `Algo duerme bajo la Torre. Se abre cuando superes el piso ${torre.ABRIR_MAZMORRA} de la Torre del héroe (vence al Dragón de la tormenta).`
                        : esc(sitio.abre.texto)}</p>
                    ${barra(Math.min(100, (record / abre.piso) * 100))}
                    <p class="mini">Tu récord en ${previo.id === "torre" ? "la Torre" : previo.nombre}: ${record} de ${abre.piso} ${previo.pisos}.</p>
                </div>
            </article>`;
    }
    const partida = estado.arcade[lugar];
    const record = estado.arcade.records[lugar] || 0;
    const conocidas = bestiario.progresoBestiario(estado.arcade.bestiario, lugar);
    const reglas = torre.REGLAS[lugar];
    const atributo = ATRIBUTOS[reglas.atributo];
    const e = torre.ESPECIALES;
    const descripcion = lugar === "mazmorra"
        ? `Bajo la Torre, ${bestiario.ZONAS_MAZMORRA.length} zonas y ${conocidas.total} criaturas nuevas. <b>Más difícil:</b> pegan
           más fuerte y cada una tiene un ataque especial: ${e.veneno.icono} veneno (una poción lo cura), ${e.drenar.icono} beber tu vida,
           ${e.sellar.icono} sellar tu magia o ${e.coraza.icono} coraza (tu próximo golpe le hace la mitad). Los guardianes se enfurecen a
           media vida y entre sótano y sótano no hay descanso.`
        : esc(sitio.resumen);
    const pisos = sitio.piso.toLowerCase();
    return `
        <article class="panel torre-tarjeta mazmorra-tarjeta mazmorra-${lugar}">
            <div class="torre-portada mazmorra-portada">
                <img class="mazmorra-portada-sala" data-sala="${sitio.portada || "abismo"}" alt="" draggable="false">
                <span class="torre-portada-titulo">${sitio.icono} ${sitio.nombre}</span>
            </div>
            <p class="nota">${descripcion}</p>
            <p class="mini">🏅 Récord: ${record ? plural(record, `${pisos} superado`, `${sitio.pisos} superados`) : "todavía ninguno"}
               · ${sitio.zonas.length} zonas · ${conocidas.total} criaturas
               · Premio: ${reglas.premio.gemasPorPiso} 💎 y ${reglas.premio.xpPorPiso} XP de ${atributo.icono} ${atributo.nombre} por ${pisos}
               (máx. ${reglas.premio.maxGemas} 💎 y ${reglas.premio.maxXp} XP)</p>
            ${selectorDeModo(estado, lugar, partida, fecha)}
            ${selectorDeMarcas(lugar, partida, fecha)}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="torre-abrir" data-lugar="${lugar}" ${!caido && (partida || fichas) ? "" : "disabled"}>
                ${partida ? `Continuar · ${pisos} ${partida.piso}` : `${sitio.boton || "Bajar a la mazmorra"} · 🎟️ 1 ficha`}</button>
            <div class="torre-botones">
                <button type="button" class="boton boton-secundario" data-accion="historia-abrir" data-lugar="${lugar}">📜 Historia</button>
                <button type="button" class="boton boton-secundario" data-accion="bestiario-abrir">📖 Bestiario · ${conocidas.vistas}/${conocidas.total}</button>
            </div>
        </article>`;
}



// ===== La Torre del héroe (pantalla completa) =====
// (También la Mazmorra del Abismo: es la misma pantalla. partida.lugar dice cuál es.)
// Se ve como un juego de rol clásico: la criatura a la izquierda, tu héroe a la derecha y,
// abajo, ventanas azules con los comandos y el estado de cada uno.
// t = { partida, nombre (el de tu héroe), sprites: { heroe, enemigo, sala } (imágenes en pixel art),
//       eventos (lo que acaba de pasar), menu ("principal" | "magia"), ultimo (el último comando
//       que usaste: ahí queda la manito), bestiario (lo que sabes de las criaturas),
//       resultado (al cobrar), fichas }
//
// Todo lo que pasa en un turno llega junto (tu acción y la respuesta de la criatura). Para que
// se vea en orden, cada animación empieza un poco después que la anterior (animation-delay).
const TURNO_MASCOTA = 400;

   // milisegundos: cuándo actúa tu mascota
const TURNO_ENEMIGO = 650;
   // y cuándo responde la criatura

// Un número que salta sobre quien recibe el golpe o la cura.
const numeroFF = (texto, clase, cuando) =>
    `<span class="ff-numero ${clase}" style="animation-delay: ${cuando}ms" aria-hidden="true">${texto}</span>`;


// La barra superior de la Torre (o la Mazmorra): el título y la ✕ para salir.
const barraTorre = (titulo, detalle = "") => `
    <div class="minijuego-barra">
        <span class="titulo-juego">${titulo}${detalle ? ` <small class="ff-zona">${detalle}</small>` : ""}</span>
        <button type="button" class="boton-icono" data-accion="torre-salir" aria-label="Salir de la torre">${ICONOS.cerrar}</button>
    </div>`;


// Una imagen en pixel art. talla = cuántos puntos mide de ancho (el CSS la agranda).
// Va en tres capas, cada una con su propia animación: ff-figura (se mece en reposo), ff-paso (lo que hace:
// avanzar, embestir…) y ff-retro (v92: el retroceso al recibir un golpe). Así no se pisan entre ellas.
const spriteFF = (direccion, nombre, talla, tinte = "") => `
    <span class="ff-figura"${tinte ? ` style="filter: ${tinte}"` : ""}><span class="ff-paso"><span class="ff-retro">
        <img class="ff-sprite" src="${direccion || ""}" alt="${esc(nombre)}" style="--talla: ${talla}" draggable="false">
    </span></span></span>`;


// El fondo de la escena: la sala de esa zona.
const salaFF = (direccion) => (direccion ? `<img class="ff-sala" src="${direccion}" alt="" draggable="false">` : "");


// (v92) El ambiente de cada zona: partículas que flotan (polvo, brasas, lluvia…), luz y bruma.
// Es solo dibujo (CSS): no cambia nada de la batalla. Las zonas que no estén aquí usan "polvo".
export const AMBIENTES = {
    cripta: "polvo", biblioteca: "polvo", galerias: "polvo", silencio: "polvo",
    fragua: "brasas", hornos: "brasas", yunque: "brasas",
    cima: "lluvia", nubes: "viento",
    corona: "oro", veta: "oro", tesoreria: "oro",
    cisterna: "burbujas", raices: "esporas", santuario: "ceniza", abismo: "latido",
    pasillos: "reflejos", ecos: "reflejos", corazon: "llama-azul",
};


// Un número "al azar" entre 0 y 1, pero siempre el mismo para (i, n): así la escena no cambia
// cada vez que se redibuja (si cambiara, las partículas saltarían de lugar en cada turno).
const azarFijo = (i, n) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
};


// Atrás (detrás de los personajes): las partículas. Cada una con su lugar (--x, --y), su tamaño
// en puntos (--s), cuánto tarda en dar la vuelta (--t) y en qué momento de la vuelta empieza (--d).
const ambienteFF = (zonaId) => {
    const tipo = AMBIENTES[zonaId] || "polvo";
    const puntos = Array.from({ length: 16 }, (_, i) =>
        `<i style="--x: ${(azarFijo(i, 1) * 100).toFixed(1)}%; --y: ${(azarFijo(i, 2) * 100).toFixed(1)}%; ` +
        `--s: ${1 + Math.floor(azarFijo(i, 3) * 2)}; --t: ${(4 + azarFijo(i, 4) * 5).toFixed(2)}s; --d: ${(-azarFijo(i, 5) * 9).toFixed(2)}s"></i>`).join("");
    return `<div class="ff-ambiente ff-amb-${tipo}" aria-hidden="true">${puntos}</div>`;
};


// Adelante (encima de los personajes): la bruma del suelo, la luz que parpadea y las esquinas oscuras.
const frenteFF = (zonaId) => `<div class="ff-frente ff-amb-${AMBIENTES[zonaId] || "polvo"}" aria-hidden="true"></div>`;


// (v92) Chispas al recibir un golpe: 8 cuadritos que salen disparados del punto del impacto.
// clase = de qué color (fuego, hielo, rayo, critico, herida, muerte…); cuando = en qué milisegundo del turno;
// cuantas = cuántos cuadritos (repartidos en círculo: 360° / cuantas entre uno y otro, con un poco de azar).
const chispasFF = (clase, cuando, cuantas = 8) => `<span class="ff-chispas ${clase}" style="--cuando: ${cuando}ms" aria-hidden="true">${
    Array.from({ length: cuantas }, (_, i) => `<i style="--a: ${Math.round(i * (360 / cuantas) + azarFijo(i, 7) * 30)}deg; --l: ${(0.7 + azarFijo(i, 8) * 0.6).toFixed(2)}"></i>`).join("")
}</span>`;


// Las criaturas «ancestrales» (después del piso 20) son las mismas, de otro color.
const tinteDeVuelta = (vuelta) => (vuelta ? `hue-rotate(${(vuelta * 140) % 360}deg) saturate(1.2)` : "");


// (v58) Los ataques especiales, bien a la vista: el nombre grande y lo que hace. Una criatura los usa cuando prepara «su ataque especial»
// (en la Mazmorra) o un truco (barrera, carga, espejo en la Torre). `descarga` es el golpe que cargó el turno anterior.
const ICONO_DESCARGA = "💢";


function textoDelEspecial(suyo, h) {
    const tipo = suyo.tipo === "descarga" ? "descarga" : suyo.especial;
    const esquivado = suyo.esquivado ? " Pero lo esquivaste." : "";
    const texto = {
        veneno: `Te envenena: pierdes ${Math.round(torre.ESPECIALES.veneno.porTurno * 100)} % de vida cada turno, ${torre.ESPECIALES.veneno.turnos} turnos. Una poción lo cura.`,
        drenar: `Se cura lo mismo que te quita${suyo.cura ? ` (+${suyo.cura})` : ""}.`,
        sellar: `Sella tu magia${suyo.sello ? `: −${suyo.sello} PM` : ""}.`,
        coraza: "Se cubre: tu próximo golpe le hará la mitad. «Quebrar» la rompe.",
        barrera: `Levanta una barrera${suyo.barrera ? ` de ${suyo.barrera}` : ""} que absorbe tus golpes. «Quebrar» y la Voluntad la rompen.`,
        carga: "¡Está cargando un golpe enorme! Defiéndete el próximo turno o usa «Intimidar».",
        reflejo: "Se cubre con un espejo: tu próximo hechizo le rebota. Usa un golpe normal.",
        descarga: "¡Suelta el golpe que cargaba! Defenderte lo reduce.",
    }[tipo];
    return { tipo, icono: tipo === "descarga" ? ICONO_DESCARGA : torre.ESPECIALES[tipo].icono, texto: `${texto || ""}${esquivado}` };
}


// (v58) La secuencia del turno, bien clara: 1 Tú → 2 tu mascota → 3 la criatura → 4 el fin del turno.
// Después de actuar muestra lo que pasó en ese orden (cada paso se enciende cuando le toca); antes de actuar, lo que va a pasar.
// Devuelve una lista de pasos [{ icono, quien, texto, clase, cuando }].
function pasosDelTurno(t, ctxTurno) {
    const { eventos, tuyo, mio, suyo, veneno, regenera, cayo, elemento, pet, criatura, especial, esquivaste, enfurecido, cambioDeForma } = ctxTurno;
    const p = t.partida;
    const m = p.enemigo;
    const h = p.heroe;
    const pasos = [];
    if (eventos.length) {
        // --- Lo que acaba de pasar ---
        if (tuyo) {
            const que = elemento ? `${elemento.icono} ${elemento.nombre}`
                : tuyo.tipo === "tecnica" ? `${torre.TECNICAS[tuyo.tecnica].icono} ${tuyo.nombre}`
                : tuyo.tipo === "voluntad" ? "✨ Golpe de Voluntad"
                : { atacar: "⚔️ Ataque", defender: "🛡️ Defensa", pocion: "🧪 Poción" }[tuyo.tipo] || "Tu turno";
            const resultado = tuyo.dano ? ` · ${tuyo.critico ? "¡crítico! " : ""}${tuyo.dano}` : tuyo.cura ? ` · +${tuyo.cura} ❤️` : "";
            const notadas = (tuyo.activas || []).map(infoDeHabilidad).filter(Boolean).map((i) => i.icono).join("");
            pasos.push({ icono: "🧑", quien: "Tú", texto: `${que}${resultado}${notadas ? ` ${notadas}` : ""}`, clase: "tuyo", cuando: 0 });
        }
        if (mio) pasos.push({ icono: "🐾", quien: pet?.nombre || "Tu mascota", texto: `${mio.nombre}${mio.dano ? ` · ${mio.dano}` : mio.cura ? ` · +${mio.cura} ❤️` : ""}`, clase: "mascota", cuando: TURNO_MASCOTA });
        if (cayo) {
            pasos.push({ icono: "💀", quien: criatura.nombre || m.nombre, texto: "Cae derrotada", clase: "cae", cuando: TURNO_ENEMIGO });
        } else if (suyo) {
            const sp = especial ? textoDelEspecial(suyo, h) : null;
            const texto = ["intimidada", "aturdida", "petrificada"].includes(suyo.tipo) ? "Pierde su turno"
                : sp ? `${sp.icono} «${suyo.nombre}»${suyo.dano ? ` · −${suyo.dano} ❤️` : ""}`
                : suyo.tipo === "curar" ? `💚 ${suyo.nombre} · +${suyo.cura}`
                : suyo.tipo === "furia" ? "😡 Se enfurece"
                : `«${suyo.nombre}»${esquivaste ? " · ¡esquivado!" : suyo.dano ? ` · −${suyo.dano} ❤️` : ""}`;
            pasos.push({ icono: "👹", quien: criatura.nombre || m.nombre, texto, clase: sp ? "especial" : "criatura", cuando: TURNO_ENEMIGO });
        }
        const fin = [];
        if (enfurecido) fin.push("😡 ¡Furia!");
        if (cambioDeForma) fin.push("🔁 Cambia de forma");
        if (regenera) fin.push(`🌿 Se regenera +${regenera.cura}`);
        if (veneno) fin.push(`☠️ Veneno −${veneno.dano}`);
        if (fin.length) pasos.push({ icono: "⏳", quien: "Fin del turno", texto: fin.join(" · "), clase: "fin", cuando: TURNO_ENEMIGO + 450 });
        return pasos;
    }
    // --- Lo que va a pasar ---
    pasos.push({ icono: "🧑", quien: "Tú", texto: "Elige un comando", clase: "tuyo", cuando: 0, ahora: true });
    if (pet && pet.potencia > 0) pasos.push({ icono: "🐾", quien: pet.nombre, texto: "Actúa si le toca", clase: "mascota", cuando: 0 });
    const intencion = torre.textoIntencion(m, h);
    const esEspecial = m.intencion === "especial" || m.intencion === "descarga";
    pasos.push({ icono: "👹", quien: criatura.nombre || m.nombre, texto: `${intencion.icono} ${intencion.texto}`, clase: esEspecial ? "especial" : "criatura", cuando: 0 });
    return pasos;
}


// ===== (v60) La batalla, más clara =====

// Una barra de vida pequeña encima de un personaje. Si el golpe acaba de pasar, un «fantasma» claro muestra lo que
// perdió y se encoge hasta la vida de ahora (cuando: en qué momento del turno pasa).
function vidaEncima(actual, maximo, antes, cuando, clase = "") {
    const pct = (n) => Math.max(0, Math.min(100, Math.round((n / Math.max(1, maximo)) * 100)));
    const cambio = antes !== actual;
    return `<span class="ff-hp ${clase} ${actual / maximo < 0.3 ? "grave" : ""}" aria-hidden="true">
                ${cambio ? `<i class="ff-hp-fantasma" style="--antes: ${pct(antes)}%; --ahora: ${pct(actual)}%; animation-delay: ${cuando}ms"></i>` : ""}
                <i class="ff-hp-relleno" style="width: ${pct(actual)}%"></i>
                <b>${Math.max(0, actual)}/${maximo}</b>
            </span>`;
}


// Los estados que hay que ver de un vistazo, como iconos junto a la barra.
function iconosDeEstado(m) {
    const e = torre.ESPECIALES;
    return [
        m.elite ? "⭐" : "",
        m.coraza ? e.coraza.icono : "",
        m.barrera > 0 ? `${e.barrera.icono}${m.barrera}` : "",
        m.espejo ? e.reflejo.icono : "",
        m.cargando ? e.carga.icono : "",
        m.enfurecido ? "😡" : "",
        m.petrificada ? "🪨" : "",
    ].filter(Boolean).join(" ");
}


function iconosDelHeroe(h) {
    return [
        h.veneno > 0 ? `${torre.ESPECIALES.veneno.icono}${h.veneno}` : "",
        (h.voluntad || 0) >= torre.VOLUNTAD.max ? "✨" : "",
    ].filter(Boolean).join(" ");
}


// El orden del turno, arriba de la escena, con la cara de cada uno (como en los RPG): quién actúa ahora y quién después.
// Antes de actuar: tú «Ahora», los demás «Luego». Después de actuar: cada cara se enciende en su momento y queda marcada ✓.
function ordenDelTurno(t, jugado) {
    const p = t.partida;
    const pet = p.mascota;
    const caras = [
        { img: t.sprites.heroe, nombre: t.nombre, clase: "tuyo", cuando: 0 },
        ...(pet && pet.potencia > 0 && t.sprites.mascota ? [{ img: t.sprites.mascota, nombre: pet.nombre, clase: "mascota", cuando: TURNO_MASCOTA }] : []),
        { img: t.sprites.enemigo, nombre: p.enemigo.nombre, clase: "criatura", cuando: TURNO_ENEMIGO },
    ];
    return `
        <ol class="ff-orden ${jugado ? "jugado" : "plan"}" aria-label="Orden del turno">
            ${caras.map((c, i) => `
                <li class="ff-orden-cara ff-orden-${c.clase} ${!jugado && i === 0 ? "ahora" : ""}" style="animation-delay: ${c.cuando}ms" title="${esc(c.nombre)}">
                    <span class="ff-orden-marco">${c.img ? `<img src="${c.img}" alt="" draggable="false">` : ""}</span>
                    <small>${jugado ? "✓" : i === 0 ? "Ahora" : "Luego"}</small>
                </li>`).join("")}
        </ol>`;
}


// Lo que va a hacer la criatura en su turno, en un globo sobre la escena (lo más importante para decidir).
function globoDeIntencion(p) {
    const m = p.enemigo;
    if (p.fase !== "batalla" || m.vida <= 0) return "";
    const i = m.petrificada ? { icono: "🪨", texto: "De piedra: pierde su turno" } : torre.textoIntencion(m, p.heroe);
    const peligro = ["especial", "descarga", "fuerte"].includes(m.intencion) ? "peligro" : m.intencion === "golpe" ? "" : "aviso";
    return `<p class="ff-globo ${peligro}" role="status"><span aria-hidden="true">⚠️</span> ${i.icono} ${esc(i.texto)}</p>`;
}


// Una tarjeta del botín: icono grande, nombre, efecto y qué clase de mejora es (ofensiva, defensiva, mágica o táctica).
function tarjetaMejora(clave, i) {
    const mejora = torre.MEJORAS[clave];
    const tipo = torre.TIPOS_DE_MEJORA[mejora.tipo] || torre.TIPOS_DE_MEJORA.tactica;
    return `
        <button type="button" class="ff-carta tipo-${mejora.tipo || "tactica"} ${mejora.don ? "don" : ""}" data-accion="torre-mejora" data-mejora="${clave}"
                style="animation-delay: ${i * 90}ms">
            ${mejora.don ? '<span class="ff-carta-cinta">✦ Don raro</span>' : ""}
            <span class="ff-carta-icono" aria-hidden="true">${mejora.icono}</span>
            <b class="ff-carta-nombre">${mejora.nombre}</b>
            <span class="ff-carta-texto">${mejora.texto}</span>
            <span class="ff-carta-tipo">${tipo.icono} ${tipo.nombre}</span>
        </button>`;
}


function tarjetaRuta(clave, i) {
    const r = torre.RUTAS[clave];
    return `
        <button type="button" class="ff-carta ff-ruta ruta-${clave}" data-accion="torre-ruta" data-ruta="${clave}" style="animation-delay: ${i * 120}ms">
            <span class="ff-carta-icono" aria-hidden="true">${r.icono}</span>
            <b class="ff-carta-nombre">${r.nombre}</b>
            <span class="ff-carta-texto">${r.texto}</span>
            <span class="ff-carta-tipo">${r.riesgo}</span>
        </button>`;
}


// (v63) Una habilidad del equipo o un don: su icono, nombre y texto (para mostrarla en pantalla).
const infoDeHabilidad = (clave) => habilidades.HABILIDADES[clave] || torre.MEJORAS[clave] || null;


// Las habilidades que se notaron en un golpe, como etiquetas que aparecen una tras otra (desde `cuando` milisegundos).
function etiquetasDeHabilidad(claves = [], cuando = 0) {
    return claves.map(infoDeHabilidad).filter(Boolean).map((i, n) =>
        `<span class="ff-hab" style="animation-delay: ${cuando + n * 280}ms">${i.icono} ${esc(i.nombre)}</span>`).join("");
}


// El panel plegable con todo lo que sabes hacer: tus habilidades del equipo, tus dones y tus técnicas.
function panelDeHabilidades(h) {
    const pasivas = [...(h.habilidades || []), ...(h.dones || [])].map(infoDeHabilidad).filter(Boolean);
    const tecnicas = (h.tecnicas || []).map((c) => torre.TECNICAS[c]).filter(Boolean);
    const cuantas = pasivas.length + tecnicas.length;
    if (!cuantas) return "";
    const fila = (i, extra = "") => `<li class="ff-hab-fila"><span class="ff-hab-icono" aria-hidden="true">${i.icono}</span>
        <span><b>${esc(i.nombre)}</b>${extra}<small>${esc(i.texto)}</small></span></li>`;
    return `
        <details class="ff-ventana ff-habilidades">
            <summary>🎖️ Habilidades y técnicas <small>(${cuantas})</small></summary>
            <ul>
                ${pasivas.map((i) => fila(i, i.don ? " <em>don</em>" : " <em>pasiva</em>")).join("")}
                ${tecnicas.map((i) => fila(i, " <em>técnica</em>")).join("")}
            </ul>
        </details>`;
}


export function pantallaTorre(t) {
    if (t.resultado) return finalTorre(t);
    const p = t.partida;
    const h = p.heroe;
    const m = p.enemigo;
    const sitio = bestiario.lugarDe(p.lugar);   // la Torre o la Mazmorra
    const criatura = bestiario.CRIATURAS[m.id] || {};
    const zona = bestiario.zonaDelPiso(p.piso, p.lugar);
    const eventos = t.eventos || [];

    // Lo que acaba de pasar, para las animaciones. El orden: tu acción (enseguida), la de tu
    // mascota (a los 0,4 s) y la respuesta de la criatura (a los 0,65 s).
    const tuyo = eventos.find((e) => e.quien === "heroe");
    const suyo = eventos.find((e) => e.quien === "enemigo" && e.tipo !== "derrotado");
    const cambioDeForma = eventos.find((e) => e.quien === "fase");      // el último guardián cambió de forma (v38)
    const regenera = eventos.find((e) => e.quien === "regenera");       // y lo que se regeneró al final del turno
    const veneno = eventos.find((e) => e.quien === "veneno");          // lo que te quitó el veneno al final del turno
    const enfurecido = eventos.some((e) => e.quien === "furia");       // un guardián de la Mazmorra se enfureció
    const pega = suyo && torre.GOLPES.includes(suyo.tipo) && suyo.especial !== "coraza";
    const mio = eventos.find((e) => e.quien === "mascota" && e.tipo !== "renacer");   // lo que hizo tu mascota
    const renacer = eventos.find((e) => e.tipo === "renacer");
    const gracia = eventos.find((e) => e.habilidad === "gracia");
    const cayo = eventos.some((e) => e.tipo === "derrotado");
    const tePego = suyo?.dano ? suyo : null;
    const esquivaste = suyo?.esquivado;
    const elemento = tuyo?.tipo === "hechizo" ? bestiario.ELEMENTOS[tuyo.elemento] : null;
    const pet = p.mascota;
    // (v58) Los ataques especiales de la criatura: se ven como un banner grande y con su efecto propio.
    const especial = suyo && !esquivaste && (suyo.especial || suyo.tipo === "descarga") ? (suyo.tipo === "descarga" ? "descarga" : suyo.especial) : null;
    const especialInfo = suyo && (suyo.especial || suyo.tipo === "descarga") ? textoDelEspecial(suyo, h) : null;
    const bannerEspecial = especialInfo?.texto ? `
        <div class="ff-especial ff-especial-${especialInfo.tipo}" style="animation-delay: ${TURNO_ENEMIGO}ms" aria-hidden="true">
            <span class="ff-especial-icono">${especialInfo.icono}</span>
            <span class="ff-especial-texto"><b>«${esc(suyo.nombre)}»</b><small>${esc(especialInfo.texto)}</small></span>
        </div>` : "";
    const fxEnemigo = ["carga", "barrera", "coraza", "reflejo", "descarga"].includes(especial)
        ? `<span class="ff-sp ff-sp-${especial}" style="animation-delay: ${TURNO_ENEMIGO + 150}ms" aria-hidden="true"></span>` : "";
    const fxHeroe = ["veneno", "sellar", "drenar"].includes(especial)
        ? `<span class="ff-sp ff-sp-${especial}" style="animation-delay: ${TURNO_ENEMIGO + 250}ms" aria-hidden="true"></span>` : "";
    // (v67) El ataque de la criatura se VE: garras, tajo, mordida, escupitajo, fuego, rayo… (ver ataques.js). Los especiales que
    // ya traen su propio efecto (veneno, sellar, drenar) no lo repiten.
    const golpeFuerte = suyo && ["fuerte", "descarga", "especial"].includes(suyo.tipo);
    const fxAtaque = pega && !fxHeroe
        ? ataques.htmlDelAtaque(ataques.estiloDe(m.id), criatura, { fuerte: golpeFuerte, falla: Boolean(esquivaste) }) : "";
    const secuencia = eventos.length ? (() => {
        const pasos = pasosDelTurno(t, { eventos, tuyo, mio, suyo, veneno, regenera, cayo, elemento, pet, criatura, especial: Boolean(especialInfo),
                                         esquivaste, enfurecido, cambioDeForma });
        return `
        <ol class="ff-turnos ${eventos.length ? "jugado" : "plan"}" aria-label="${eventos.length ? "Lo que pasó en el turno, en orden" : "Lo que va a pasar este turno, en orden"}">
            ${pasos.map((paso, i) => `
                <li class="ff-turno ff-turno-${paso.clase} ${paso.ahora ? "ahora" : ""}" style="animation-delay: ${paso.cuando}ms">
                    <span class="ff-turno-numero" aria-hidden="true">${i + 1}</span>
                    <span class="ff-turno-icono" aria-hidden="true">${paso.icono}</span>
                    <span class="ff-turno-texto"><b>${esc(paso.quien)}</b><small>${esc(paso.texto)}</small></span>
                </li>`).join("")}
        </ol>`;
    })() : "";

    // (v60) La vida de antes del turno, para que la barra muestre lo que se perdió (lo que te curaste se resta).
    const antesEnemigo = Math.min(m.vidaMax, Math.max(0, m.vida) + (tuyo?.dano || 0) + (mio?.dano || 0) - (tuyo?.absorbido || 0)
        - (regenera?.cura || 0) - (suyo?.cura || 0));
    const antesHeroe = Math.min(h.vidaMax, Math.max(0, h.vida) + (tePego?.dano || 0) + (veneno?.dano || 0) + (tuyo?.reflejado || 0)
        - (tuyo?.cura || 0) - (mio?.tipo === "cura" ? mio.cura : 0) - ((gracia || renacer)?.cura || 0));
    // El tajo: un arco grande (dorado si es crítico; enorme si es el Golpe de Voluntad).
    const golpeFisico = tuyo?.dano && (tuyo.tipo === "atacar" || tuyo.tipo === "tecnica" || tuyo.tipo === "voluntad");
    const arco = golpeFisico ? `<span class="ff-arco ${tuyo.tipo === "voluntad" ? "voluntad" : tuyo.critico ? "critico" : ""}" aria-hidden="true"></span>` : "";
    const avisoCritico = tuyo?.critico ? '<span class="ff-aviso ff-critico" aria-hidden="true">¡CRÍTICO!</span>' : "";
    const victoria = cayo ? `<p class="ff-victoria" aria-hidden="true">¡Victoria!</p>` : "";

    // El cartel de arriba dice el nombre de lo que se usa: lo tuyo, lo de tu mascota y lo de la criatura.
    const cartel = (texto, cuando) => `<p class="ff-ventana ff-anuncio" style="animation-delay: ${cuando}ms">${esc(texto)}</p>`;
    const tuCartel = elemento ? `${elemento.icono} ${elemento.nombre}`
        : tuyo?.tipo === "tecnica" ? `${torre.TECNICAS[tuyo.tecnica].icono} ${tuyo.nombre}`
        : tuyo?.tipo === "voluntad" ? "✨ Golpe de Voluntad"
        : { defender: "Defensa", pocion: "Poción" }[tuyo?.tipo];
    const carteles = `${tuCartel ? cartel(tuCartel, 0) : ""}${mio ? cartel(mio.nombre, TURNO_MASCOTA) : ""}` +
                     `${suyo?.nombre && !especialInfo ? cartel(suyo.nombre, TURNO_ENEMIGO) : ""}`;

    // --- La criatura ---
    const clasesEnemigo = [
        criatura.vuela ? "vuela" : "",
        tuyo?.dano ? "golpeado" : "",
        mio?.dano ? "golpeado-mascota" : "",
        pega ? "ataca" : "",
        suyo?.tipo === "furia" || suyo?.especial === "carga" || cambioDeForma ? "furia" : "",
        ["coraza", "barrera", "reflejo"].includes(suyo?.especial) ? "coraza" : "",
        mio?.tipo === "petrificar" ? "piedra" : "",
        cayo ? (suyo?.reflejo ? "cae tarde" : "cae") : m.vida <= 0 ? "vencido" : "",
    ].join(" ");
    // (v63) Cada técnica tiene su propio efecto (Analizar e Intimidar también, aunque no hagan daño).
    const claseDeEfecto = tuyo?.tipo === "hechizo" ? tuyo.elemento : tuyo?.tipo === "voluntad" ? "voluntad" : tuyo?.tipo === "tecnica" ? tuyo.tecnica : "tajo";
    const efecto = !tuyo || !(tuyo.dano || tuyo.tipo === "tecnica") ? ""
        : `<span class="ff-efecto ff-${claseDeEfecto}" aria-hidden="true"></span>`;
    const efectoMascota = !mio?.dano ? "" : `<span class="ff-efecto ff-${mio.elemento || "garra"} ff-de-mascota" aria-hidden="true"></span>`;
    const enemigo = `
        <div class="ff-bando ff-enemigo ${clasesEnemigo} ${m.elite ? "elite" : ""}">
            <span class="ff-sombra"></span>
            ${spriteFF(t.sprites.enemigo, m.nombre, criatura.talla || 96, tinteDeVuelta(m.vuelta))}
            ${efecto}${arco}${efectoMascota}${fxEnemigo}${avisoCritico}
            ${tuyo?.dano ? chispasFF(tuyo.critico ? "critico" : tuyo.tipo === "hechizo" ? tuyo.elemento : "golpe", 280) : ""}
            ${mio?.dano ? chispasFF(mio.elemento || "garra", TURNO_MASCOTA + 100) : ""}
            ${cayo ? chispasFF("muerte", suyo?.reflejo ? 1250 : 750, 14) : ""}
            ${tuyo?.dano ? numeroFF(tuyo.dano, tuyo.critico ? "critico" : "", 300) : ""}
            ${mio?.dano ? numeroFF(mio.dano, "de-mascota", TURNO_MASCOTA + 120) : ""}
            ${suyo?.reflejo ? numeroFF(suyo.reflejo, "de-mascota", TURNO_ENEMIGO + 350) : ""}
            ${tuyo?.reaccion ? `<span class="ff-aviso ff-reaccion" aria-hidden="true">${torre.REACCIONES[tuyo.reaccion].icono} ${torre.REACCIONES[tuyo.reaccion].nombre}</span>` : ""}
            ${tuyo?.efecto === "debil" ? '<span class="ff-aviso" aria-hidden="true">¡Punto débil!</span>' : ""}
            ${tuyo?.efecto === "resiste" ? '<span class="ff-aviso ff-resiste" aria-hidden="true">Resiste</span>' : ""}
            ${tuyo?.coraza && !tuyo?.efecto ? '<span class="ff-aviso ff-resiste" aria-hidden="true">Coraza</span>' : ""}
            ${tuyo?.absorbido && !tuyo?.efecto && !tuyo?.coraza ? '<span class="ff-aviso ff-resiste" aria-hidden="true">Barrera</span>' : ""}
            ${tuyo?.rompio ? '<span class="ff-aviso" aria-hidden="true">¡Roto!</span>' : ""}
            ${enfurecido ? '<span class="ff-aviso ff-furia" aria-hidden="true">¡Furia!</span>' : ""}
            ${cambioDeForma ? '<span class="ff-aviso ff-furia" aria-hidden="true">¡Cambia de forma!</span>' : ""}
            ${regenera ? numeroFF(`+${regenera.cura}`, "cura", TURNO_ENEMIGO + 550) : ""}
            ${suyo?.cura ? numeroFF(suyo.cura, "cura", TURNO_ENEMIGO + (suyo.especial === "drenar" ? 450 : 150)) : ""}
        </div>`;

    // --- Tu mascota (si te acompaña) ---
    const clasesMascota = [
        mio && (mio.tipo === "ataque" || mio.tipo === "petrificar") ? "ataca" : "",
        mio && (mio.tipo === "mana" || mio.tipo === "cura") ? "brilla" : "",
        renacer ? "renace" : "",
        pet && pet.potencia <= 0 ? "quieta" : "",
    ].join(" ");
    const mascotaHtml = pet && t.sprites.mascota ? `
        <div class="ff-bando ff-mascota ${clasesMascota}">
            <span class="ff-sombra"></span>
            ${spriteFF(t.sprites.mascota, pet.nombre, 44)}
        </div>` : "";

    // --- Tu héroe ---
    const clasesHeroe = [
        { atacar: "ataca", hechizo: "lanza", defender: "defiende", pocion: "bebe", voluntad: "ataca voluntad" }[tuyo?.tipo]
            || (tuyo?.tipo === "tecnica" ? (tuyo.dano ? "ataca" : "lanza") : ""),
        tePego ? "herido" : "",
        h.veneno > 0 ? "envenenado" : "",
        esquivaste ? "esquiva" : "",
        gracia || renacer ? "salvado" : "",
        p.fase === "fin" ? "ko" : "",
        p.fase === "mejora" ? "victoria" : "",
        eventos.length ? "tras-golpe" : "",
    ].join(" ");
    const curaDeMascota = mio?.tipo === "cura" ? mio.cura : 0;
    const heroe = `
        <div class="ff-bando ff-heroe ${clasesHeroe}">
            <span class="ff-encima">${vidaEncima(h.vida, h.vidaMax, antesHeroe, TURNO_ENEMIGO + 250, "de-heroe")}<span class="ff-estados">${iconosDelHeroe(h)}</span></span>
            <span class="ff-sombra"></span>
            ${spriteFF(t.sprites.heroe, t.nombre, 54)}
            ${tuyo?.tipo === "defender" ? '<span class="ff-escudo" aria-hidden="true"></span>' : ""}${fxHeroe}
            <span class="ff-habs" aria-hidden="true">${etiquetasDeHabilidad(tuyo?.activas, 80)}${etiquetasDeHabilidad(suyo?.activas, TURNO_ENEMIGO + 300)}</span>
            ${tuyo?.cura ? numeroFF(tuyo.cura, "cura", 150) : ""}
            ${tuyo?.reflejado ? numeroFF(`${tuyo.reflejado} 🪞`, "", 300) : ""}
            ${tuyo?.mana ? numeroFF("+1 PM", "pm", 150) : ""}
            ${curaDeMascota ? numeroFF(curaDeMascota, "cura", TURNO_MASCOTA + 100) : ""}
            ${mio?.tipo === "mana" ? numeroFF("+1 PM", "pm", TURNO_MASCOTA + 100) : ""}
            ${tePego ? chispasFF(golpeFuerte ? "herida fuerte" : "herida", TURNO_ENEMIGO + 230) : ""}
            ${tePego ? numeroFF(tePego.dano, "", TURNO_ENEMIGO + 250) : ""}
            ${suyo?.sello ? numeroFF(`−${suyo.sello} PM`, "pm", TURNO_ENEMIGO + 500) : ""}
            ${veneno ? numeroFF(`${veneno.dano} ☠️`, "veneno", TURNO_ENEMIGO + 700) : ""}
            ${esquivaste ? numeroFF("¡Esquivas!", "pm", TURNO_ENEMIGO + 250) : ""}
            ${gracia || renacer ? numeroFF(`+${(gracia || renacer).cura}`, "cura", TURNO_ENEMIGO + 700) : ""}
        </div>`;

    const escena = `
        <div class="ff-escena ${tuyo?.elemento === "rayo" ? "relampago" : ""} ${especial === "descarga" || (golpeFuerte && pega && !esquivaste && ["golpe", "mordida"].includes(ataques.estiloDe(m.id))) ? "ff-sacude" : ""} ${tuyo?.tipo === "voluntad" ? "ff-destella" : ""} ${tuyo?.critico ? "ff-golpe-critico" : ""}">
            ${salaFF(t.sprites.sala)}${ambienteFF(zona.id)}${carteles}${enemigo}${heroe}${mascotaHtml}${frenteFF(zona.id)}${fxAtaque}${bannerEspecial}
            <div class="ff-hud ff-hud-enemigo">
                <b>${m.guardian ? "👑 " : ""}${esc(m.nombre)}</b>
                ${vidaEncima(m.vida, m.vidaMax, antesEnemigo, 300, "de-enemigo")}
                <span class="ff-estados">${iconosDeEstado(m)}</span>
            </div>
            ${p.fase === "batalla" || eventos.length ? ordenDelTurno(t, eventos.length > 0) : ""}
            ${globoDeIntencion(p)}
            ${victoria}
        </div>
        ${secuencia}`;

    // --- Abajo: los comandos (o el botín, o el final) y las fichas ---
    // Si aparecen justo después de un golpe, esperan un instante para que se vea el golpe final.
    const espera = eventos.length ? "tras-golpe" : "";
    let abajo;
    if (p.fase === "mejora") {
        abajo = `
            <div class="ff-ventana ff-botin ${espera ? "tras-victoria" : ""}">
                <p class="ff-titulo">¡Victoria! <small>${sitio.piso} ${p.piso} superado${m.elite ? " · ⭐ era de élite" : ""}</small></p>
                <p class="ff-renglon">Elige tu botín:</p>
                <div class="ff-cartas">${p.opciones.map(tarjetaMejora).join("")}</div>
            </div>`;
    } else if (p.fase === "ruta") {
        // v60: el camino se bifurca. Dos tarjetas: más riesgo y mejor botín, o un respiro.
        abajo = `
            <div class="ff-ventana ff-botin ${espera}">
                <p class="ff-titulo">🔀 El camino se bifurca <small>antes del ${sitio.piso.toLowerCase()} ${p.piso}</small></p>
                <p class="ff-renglon">Elige por dónde sigues: cambia lo que te espera.</p>
                <div class="ff-cartas ff-cartas-dos">${Object.keys(torre.RUTAS).map(tarjetaRuta).join("")}</div>
            </div>
            <button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Huir y cobrar lo ganado</button>`;
    } else if (p.fase === "sala") {
        // v42: una sala entre pisos. Cada opción dice lo que cuesta y lo que da; la que no puedes hacer se apaga.
        const sala = torre.SALAS[p.sala.tipo];
        abajo = `
            <div class="ff-ventana ff-botin ${espera}">
                <p class="ff-titulo">${sala.icono} ${sala.nombre} <small>antes del ${sitio.piso.toLowerCase()} ${p.piso}</small></p>
                <p class="ff-renglon">${esc(sala.texto)}</p>
                ${Object.entries(sala.opciones).map(([clave, o]) => {
                    const motivo = torre.motivoSala(p, clave);
                    return `<button type="button" class="ff-comando" data-accion="torre-sala" data-opcion="${clave}" ${motivo ? `disabled title="${esc(motivo)}"` : ""}>
                                <span class="ff-cursor" aria-hidden="true"></span>
                                <span class="ff-comando-nombre">${o.nombre}</span><small>${motivo ? esc(motivo) : o.texto}</small></button>`;
                }).join("")}
            </div>
            <button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Huir y cobrar lo ganado</button>`;
    } else if (p.fase === "fin") {
        const pisos = torre.pisosSuperados(p);
        const premio = torre.premio(pisos, p.lugar, p.marca, torre.modoDe(p));
        const atributo = ATRIBUTOS[torre.REGLAS[sitio.id].atributo];
        const piso = sitio.piso.toLowerCase();
        abajo = `
            <div class="ff-ventana ff-botin ${espera}">
                <p class="ff-titulo">${sitio.verboFin || (sitio.id === "mazmorra" ? "Fin del descenso" : "Fin de la subida")} <small>Caíste en el ${piso} ${p.piso}</small></p>
                <p class="ff-renglon">Superaste <b>${torre.modoDe(p) === "asalto" ? plural(Math.round(pisos / torre.CADA_GUARDIAN), "guardián", "guardianes") : plural(pisos, piso, sitio.pisos)}</b>.</p>
                <p class="ff-renglon ff-oro">+${premio.gemas} 💎 · +${premio.xp} XP de ${atributo.icono} ${atributo.nombre}</p>
                <button type="button" class="ff-comando elegido" data-accion="torre-cobrar">
                    <span class="ff-cursor" aria-hidden="true"></span><span class="ff-comando-nombre">Cobrar premio</span></button>
            </div>`;
    } else {
        abajo = `
            <div class="ff-tablero">
                ${comandosTorre(t)}
                <div class="ff-fichas">${fichaEnemigo(t)}${fichaHeroe(h, t.nombre, p.mascota)}</div>
            </div>
            ${panelDeHabilidades(h)}
            <button type="button" class="enlace torre-rendirse" data-accion="torre-rendirse">Huir y cobrar lo ganado</button>`;
    }

    // El Maestro Aurelio: una pista antes de pelear con un guardián, y unas palabras si caes.
    const consejo = p.fase === "fin" ? maestro.consueloAlCaer(torre.pisosSuperados(p))
        : p.fase === "batalla" && m.guardian && !eventos.length && m.vida === m.vidaMax ? maestro.consejoDeGuardian(m.id) : null;
    const aurelio = consejo ? `
        <div class="ff-ventana ff-maestro ${espera}">
            ${t.sprites.maestro ? `<img class="ff-maestro-retrato" src="${t.sprites.maestro}" alt="" draggable="false">` : ""}
            <p><b>Aurelio</b>${esc(consejo)}</p>
        </div>` : "";

    return `
        ${barraTorre(`${sitio.icono} ${sitio.piso} ${p.piso}`, `${torre.modoDe(p) !== "normal" ? `${torre.MODOS[torre.modoDe(p)].icono} ` : ""}${p.marca ? `${torre.MARCAS[p.marca].icono} ` : ""}${zona.nombre}${m.guardian ? " 👑" : ""}`)}
        ${escena}
        <p class="ff-ventana ff-mensaje" role="status">${esc(p.registro)}</p>
        ${aurelio}
        ${abajo}`;
}


// La ventana de comandos. El menú principal, la lista de hechizos si tocaste «Magia» o la de
// técnicas si tocaste «Técnicas» (v38). Con la Voluntad llena aparece su comando, en dorado.
function comandosTorre(t) {
    const h = t.partida.heroe;
    const m = t.partida.enemigo;
    // La manito señala el último comando que usaste.
    const fila = (clave, nombre, detalle, atributos, clase = "") => `
        <button type="button" class="ff-comando ${clave === t.ultimo ? "elegido" : ""} ${clase}" ${atributos}>
            <span class="ff-cursor" aria-hidden="true"></span><span class="ff-comando-nombre">${nombre}</span><small>${detalle}</small></button>`;

    if (t.menu === "magia") {
        const hechizos = Object.entries(bestiario.ELEMENTOS).map(([clave, e]) => {
            // Si ya probaste ese hechizo con esta criatura, tu bestiario recuerda qué le hace
            // (y con el «Ojo del dragón» lo sabes de una vez).
            const sabes = loQueSabesEnLaTorre(t, clave);
            const detalle = { debil: "¡punto débil!", resiste: "lo resiste", normal: "daño normal" }[sabes] || "sin probar";
            const reaccion = torre.reaccionPosible(t.partida, clave);
            return fila(clave, `${e.icono} ${e.nombre}`, reaccion ? `${torre.REACCIONES[reaccion].icono} ¡reacción: ${torre.REACCIONES[reaccion].nombre}!` : detalle,
                        `data-accion="torre-accion" data-torre="hechizo" data-elemento="${clave}"`, `ff-hechizo ${sabes ? `ff-${sabes}` : ""}`);
        }).join("");
        return `
            <div class="ff-ventana ff-comandos">
                <p class="ff-titulo">Magia <small>PM ${h.mana}/${h.manaMax} · daño ~${h.hechizo}</small></p>
                ${hechizos}
                ${fila("volver", "↩ Volver", "", 'data-accion="torre-menu" data-menu="principal"')}
            </div>`;
    }
    if (t.menu === "tecnicas") {
        const tecnicas = Object.entries(torre.TECNICAS).map(([clave, tecnica]) => {
            const motivo = torre.motivoTecnica(h, clave);
            const sabe = (h.tecnicas || []).includes(clave);
            const detalle = !sabe ? `🔒 ${ATRIBUTOS[tecnica.atributo].nombre} ${torre.NIVEL_TECNICA}` : motivo ? "usada en este piso" : tecnica.texto;
            return fila(clave, `${tecnica.icono} ${tecnica.nombre}`, esc(detalle),
                        `data-accion="torre-accion" data-torre="tecnica" data-tecnica="${clave}" ${motivo ? "disabled" : ""}`, "ff-hechizo ff-tecnica");
        }).join("");
        return `
            <div class="ff-ventana ff-comandos">
                <p class="ff-titulo">Técnicas <small>una vez por piso</small></p>
                ${tecnicas}
                ${fila("volver", "↩ Volver", "", 'data-accion="torre-menu" data-menu="principal"')}
            </div>`;
    }
    const a = torre.ACCIONES;
    const listas = Object.keys(torre.TECNICAS).filter((clave) => !torre.motivoTecnica(h, clave)).length;
    const voluntadLlena = (h.voluntad || 0) >= torre.VOLUNTAD.max;
    return `
        <div class="ff-ventana ff-comandos">
            ${voluntadLlena ? fila("voluntad", `${a.voluntad.icono} ${a.voluntad.nombre}`, `×${String(torre.VOLUNTAD.multiplica).replace(".", ",")}`,
                                   'data-accion="torre-accion" data-torre="voluntad"', "ff-voluntad") : ""}
            ${fila("atacar", a.atacar.nombre, `${Math.round(h.ataque * 0.85)}–${Math.round(h.ataque * 1.15)}`, 'data-accion="torre-accion" data-torre="atacar"')}
            ${fila("hechizo", a.hechizo.nombre, `PM ${h.mana}/${h.manaMax}`, `data-accion="torre-menu" data-menu="magia" ${h.mana ? "" : "disabled"}`)}
            ${fila("tecnica", a.tecnica.nombre, (h.tecnicas || []).length ? `${listas} lista${listas === 1 ? "" : "s"}` : `🔒 nivel ${torre.NIVEL_TECNICA}`,
                   `data-accion="torre-menu" data-menu="tecnicas" ${(h.tecnicas || []).length ? "" : "disabled"}`)}
            ${fila("defender", a.defender.nombre, `−${Math.round(h.defensa * 100)} % · +${h.curaDefensa}`, 'data-accion="torre-accion" data-torre="defender"')}
            ${fila("pocion", a.pocion.nombre, `×${h.pociones}`, `data-accion="torre-accion" data-torre="pocion" ${h.pociones ? "" : "disabled"}`)}
        </div>`;
}


// Lo que sabes de un hechizo contra la criatura de ahora: lo de tu bestiario o, con el
// «Ojo del dragón» (la Corona del Dragón), la verdad desde el primer turno.
// (v38: si la analizaste, también; y si cambió de forma, solo vale lo de ahora.)
function loQueSabesEnLaTorre(t, elemento) {
    const m = t.partida.enemigo;
    const forma = torre.formaActual(m);
    if (bestiario.CRIATURAS[m.id] && (m.analizado || habilidades.tiene(t.partida.heroe, "ojo-dragon"))) {
        return forma.debil === elemento ? "debil" : forma.resiste === elemento ? "resiste" : "normal";
    }
    if (m.cambio) return null;
    return bestiario.loQueSabes(t.bestiario, m.id, elemento);
}


// La ficha de la criatura: nombre, vida, qué planea, cómo está (coraza, furia) y lo que ya sabes de ella.
function fichaEnemigo(t) {
    const m = t.partida.enemigo;
    const intencion = torre.textoIntencion(m, t.partida.heroe);
    const iconos = (que) => Object.keys(bestiario.ELEMENTOS)
        .filter((e) => loQueSabesEnLaTorre(t, e) === que)
        .map((e) => bestiario.ELEMENTOS[e].icono).join("");
    const [debil, resiste] = [iconos("debil"), iconos("resiste")];
    const sabes = [debil ? `Débil: ${debil}` : "", resiste ? `Resiste: ${resiste}` : ""].filter(Boolean).join(" · ");
    return `
        <div class="ff-ventana ff-ficha">
            <b class="ff-nombre">${m.guardian ? "👑 " : ""}${esc(m.nombre)}</b>
            <div class="ff-vida"><i style="width: ${(m.vida / m.vidaMax) * 100}%"></i></div>
            <span class="ff-cifras">${m.vida}/${m.vidaMax}</span>
            <span class="ff-intencion">${m.petrificada ? "🪨 De piedra: pierde su turno" : `${intencion.icono} ${esc(intencion.texto)}`}</span>
            ${estadoDeLaCriatura(m)}
            ${sabes ? `<span class="ff-sabes">${sabes}</span>` : ""}
        </div>`;
}


// Cómo está la criatura: coraza, furia y (v38) barrera, espejo, golpe cargado, regeneración y forma.
function estadoDeLaCriatura(m) {
    const e = torre.ESPECIALES;
    const criatura = bestiario.CRIATURAS[m.id] || {};
    const partes = [
        m.coraza ? `${e.coraza.icono} Coraza: ½ de daño` : "",
        m.barrera > 0 ? `${e.barrera.icono} Barrera: ${m.barrera}` : "",
        m.espejo ? `${e.reflejo.icono} Espejo: devuelve tus hechizos` : "",
        m.cargando ? `${e.carga.icono} Cargando un golpe` : "",
        criatura.regenera ? `♻️ Se regenera ${Math.round(criatura.regenera * 100)} %` : "",
        m.cambio ? `🌑 ${criatura.fase?.nombre || "Cambió de forma"}` : "",
        m.enfurecido ? "😡 Enfurecido" : "",
    ].filter(Boolean);
    return partes.length ? `<span class="ff-sabes">${partes.join(" · ")}</span>` : "";
}


// La ficha de tu héroe: vida (VIT), hechizos que quedan (PM), Voluntad (v38), pociones,
// armadura, tus habilidades (los iconos) y tu mascota.
function fichaHeroe(h, nombre, pet) {
    const parte = h.vida / h.vidaMax;
    const estado = h.vida <= 0 ? "ko" : parte < 0.3 ? "grave" : "";
    return `
        <div class="ff-ventana ff-ficha ff-ficha-heroe ${estado}">
            <b class="ff-nombre">${esc(nombre)}</b>
            <div class="ff-vida"><i style="width: ${parte * 100}%"></i></div>
            <dl class="ff-datos">
                <dt>VIT</dt><dd>${h.vida}<small>/${h.vidaMax}</small></dd>
                <dt>PM</dt><dd>${h.mana}<small>/${h.manaMax}</small></dd>
            </dl>
            <div class="ff-voluntad-barra ${(h.voluntad || 0) >= torre.VOLUNTAD.max ? "llena" : ""}" role="img"
                 aria-label="Voluntad ${h.voluntad || 0} de ${torre.VOLUNTAD.max}"><i style="width: ${Math.min(100, ((h.voluntad || 0) / torre.VOLUNTAD.max) * 100)}%"></i></div>
            <span class="ff-sabes">🧪 ×${h.pociones}${h.proteccion ? ` · 🛡️ −${Math.round(h.proteccion * 100)} %` : ""}${
                (h.habilidades || []).length ? ` · ${h.habilidades.map((c) => habilidades.HABILIDADES[c].icono).join("")}` : ""}</span>
            ${h.veneno > 0 ? `<span class="ff-sabes ff-envenenado">${torre.ESPECIALES.veneno.icono} Veneno: ${plural(h.veneno, "turno", "turnos")} (una poción lo cura)</span>` : ""}
            ${pet ? `<span class="ff-sabes">${mascota.MASCOTAS[pet.especie].icono} ${esc(pet.nombre)} ${pet.potencia > 0 ? "" : "· no pelea"}</span>` : ""}
        </div>`;
}


function finalTorre(t) {
    const r = t.resultado;
    const sitio = bestiario.lugarDe(r.lugar);
    const atributo = ATRIBUTOS[r.atributo] || ATRIBUTOS[torre.ATRIBUTO];
    const piso = sitio.piso.toLowerCase();
    return `
        ${barraTorre(`${sitio.icono} ${sitio.nombre}`)}
        <div class="ff-escena ff-escena-final">
            ${salaFF(t.sprites.sala)}
            <div class="ff-bando ff-heroe ${r.pisos ? "victoria" : ""}">
                <span class="ff-sombra"></span>${spriteFF(t.sprites.heroe, t.nombre, 54)}
            </div>
        </div>
        <div class="ff-ventana ff-botin">
            <p class="ff-titulo">Premio cobrado</p>
            <p class="ff-puntos">${r.modo === "asalto" ? plural(Math.round(r.pisos / torre.CADA_GUARDIAN), "guardián vencido", "guardianes vencidos") : plural(r.pisos, piso, sitio.pisos)}</p>
            <p class="ff-renglon">${r.nuevoRecord ? "🏅 ¡Nuevo récord!" : `🏅 Récord: ${r.modo === "asalto" ? plural(r.record, "guardián", "guardianes") : plural(r.record, piso, sitio.pisos)}`}</p>
            <p class="ff-renglon ff-oro">+${r.premio.gemas} 💎 · +${r.premio.xp} XP de ${atributo.icono} ${atributo.nombre}</p>
            ${r.modo && r.modo !== "normal" ? `<p class="ff-renglon">${torre.MODOS[r.modo].icono} Modo: ${torre.MODOS[r.modo].nombre}</p>` : ""}
            ${r.bonus ? `<p class="ff-renglon ff-oro">📅 ¡Reto diario cumplido! +${r.bonus.gemas} 💎 · +${r.bonus.xp} XP extra</p>` : ""}
            ${r.marca ? `<p class="ff-renglon">✦ Marca: ${torre.MARCAS[r.marca].icono} ${torre.MARCAS[r.marca].nombre} · ${textoPremioMarca(torre.MARCAS[r.marca])}</p>` : ""}
            ${r.reto ? `<p class="ff-renglon ff-oro">🎯 ¡Reto del día cumplido! ${textoPremioReto(r.reto)}</p>` : ""}
            <button type="button" class="ff-comando elegido" data-accion="torre-abrir" data-lugar="${sitio.id}" ${t.fichas ? "" : "disabled"}>
                <span class="ff-cursor" aria-hidden="true"></span>
                <span class="ff-comando-nombre">${t.fichas ? (sitio.otraVez || (sitio.id === "mazmorra" ? "Bajar otra vez" : "Subir otra vez")) : "Sin fichas"}</span><small>${t.fichas ? `🎟️ ${t.fichas}` : ""}</small></button>
            <button type="button" class="ff-comando" data-accion="torre-salir">
                <span class="ff-cursor" aria-hidden="true"></span><span class="ff-comando-nombre">Salir</span></button>
        </div>`;
}



// ===== Una página de la historia (v29) =====
// Se muestra en la misma capa que la batalla, la primera vez que llegas a una parte nueva.
// r = { pagina: { etiqueta, titulo, parrafos, aviso }, sala (imagen de fondo), numero, total }
export function pantallaRelato(r) {
    const { pagina } = r;
    const ultima = r.numero >= r.total;
    return `
        ${barraTorre("📜 Historia", `${r.numero} de ${r.total}`)}
        <div class="ff-escena ff-escena-relato">
            ${salaFF(r.sala)}
            <p class="ff-relato-titulo"><small>${esc(pagina.etiqueta)}</small>${esc(pagina.titulo)}</p>
        </div>
        <div class="ff-ventana ff-relato">
            ${pagina.parrafos.map((texto) => `<p>${esc(texto)}</p>`).join("")}
            ${pagina.aviso ? `<p class="ff-oro">${esc(pagina.aviso)}</p>` : ""}
            <button type="button" class="ff-comando elegido" data-accion="torre-relato">
                <span class="ff-cursor" aria-hidden="true"></span>
                <span class="ff-comando-nombre">${ultima ? "¡A pelear!" : "Continuar"}</span><small>${ultima ? "" : "▸"}</small></button>
        </div>`;
}


// ===== La historia completa de un lugar, para releer (v29) =====
// h = { lugar ("torre" | "mazmorra"), capitulos (leyendas.capitulosDeLeyenda) }
export function pantallaHistoria(h) {
    const sitio = bestiario.lugarDe(h.lugar);
    const leyenda = leyendas.LEYENDAS[sitio.id];
    const ultimoAbierto = [...h.capitulos].reverse().find((c) => c.abierto && c.parrafos.length)?.id;
    const capitulos = h.capitulos.map((c) => {
        if (!c.abierto) {
            return `<article class="ff-ventana ff-capitulo cerrado">
                        <p class="ff-titulo">${esc(c.numero)} · ${esc(c.titulo)} <small>🔒</small></p>
                        <p class="ff-renglon"><small>${esc(c.bloqueado)}</small></p>
                    </article>`;
        }
        // (v56) Cada capítulo se abre y se cierra; el último que puedes leer viene abierto, con su botón para verlo animado.
        return `<details class="ff-ventana ff-capitulo" ${c.id === ultimoAbierto ? "open" : ""}>
                    <summary class="ff-titulo">${esc(c.numero)} · ${esc(c.titulo)}</summary>
                    ${c.parrafos.map((texto) => `<p>${esc(texto)}</p>`).join("")}
                    ${c.pendiente ? `<p class="ff-renglon"><small>⏳ ${esc(c.pendiente)}</small></p>` : ""}
                    ${c.aviso ? `<p class="ff-oro">${esc(c.aviso)}</p>` : ""}
                    <button type="button" class="boton boton-chico ff-ver-escena" data-accion="cine-capitulo" data-lugar="${esc(h.lugar)}" data-id="${esc(c.id)}">▶ Ver escena</button>
                </details>`;
    }).join("");
    return `
        ${barraTorre(`📜 ${esc(leyenda.titulo)}`, sitio.nombre)}
        <div class="ff-historia">${capitulos}</div>`;
}



// ===== El bestiario: las criaturas de la Torre (y de la Mazmorra) que ya conoces =====
// b = { bestiario (estado.arcade.bestiario), sprites: { id: imagen }, mazmorra (true si ya se abrió) }
export function pantallaBestiario(b) {
    // (v64) b.abiertos = los lugares que ya se abrieron (si no se dice, la Torre y, con `mazmorra`, la Mazmorra).
    const abiertos = b.abiertos || ["torre", ...(b.mazmorra ? ["mazmorra"] : [])];
    const progreso = abiertos.map((lugar) => bestiario.progresoBestiario(b.bestiario, lugar));
    const vistas = progreso.reduce((suma, x) => suma + x.vistas, 0);
    const total = progreso.reduce((suma, x) => suma + x.total, 0);
    const seccion = (lugar) => {
        const sitio = bestiario.LUGARES[lugar];
        const zonas = sitio.zonas.map((zona, i) => {
            const criaturas = sitio.orden.filter((id) => bestiario.CRIATURAS[id].zona === zona.id).map((id) => {
                const c = bestiario.CRIATURAS[id];
                const piso = sitio.orden.indexOf(id) + 1;
                const ficha = bestiario.fichaDe(b.bestiario, id);
                const imagen = `<img class="ff-sprite" src="${b.sprites[id] || ""}" alt="" style="--talla: ${c.talla}" draggable="false">`;
                const guardian = c.guardian ? ` · ${c.genero === "f" ? "Guardiana" : "Guardián"}` : "";
                if (!ficha) {
                    // Todavía no te la cruzaste: solo su sombra.
                    return `<article class="ff-ventana ff-criatura desconocida">
                                <div class="ff-retrato">${imagen}</div>
                                <div><b class="ff-nombre">???</b><small>${sitio.piso} ${piso}${guardian}</small></div>
                            </article>`;
                }
                const elementos = Object.entries(bestiario.ELEMENTOS).map(([clave, e]) => {
                    const sabes = bestiario.loQueSabes(b.bestiario, id, clave);
                    const texto = { debil: "débil", resiste: "resiste", normal: "normal" }[sabes] || "?";
                    return `<span class="ff-elemento ${sabes ? `ff-${sabes}` : ""}">${e.icono} ${texto}</span>`;
                }).join("");
                const especial = c.especial ? torre.ESPECIALES[c.especial.tipo] : null;
                return `<article class="ff-ventana ff-criatura">
                            <div class="ff-retrato">${imagen}</div>
                            <div>
                                <b class="ff-nombre">${c.guardian ? "👑 " : ""}${c.nombre}</b>
                                <small>${sitio.piso} ${piso} · ${ficha.vencidos ? `vencid${c.genero === "f" ? "a" : "o"} ×${ficha.vencidos}` : "sin vencer"}</small>
                                <p>${c.texto}</p>
                                ${especial ? `<p class="ff-especial">${especial.icono} «${c.especial.nombre}» · ${especial.nombre.toLowerCase()}</p>` : ""}
                                ${c.regenera ? `<p class="ff-especial">♻️ Se regenera un ${Math.round(c.regenera * 100)} % por turno</p>` : ""}
                                ${c.fase ? `<p class="ff-especial">🌑 A media vida cambia de forma («${c.fase.nombre}»): su punto débil cambia</p>` : ""}
                                <div class="ff-elementos">${elementos}</div>
                            </div>
                        </article>`;
            }).join("");
            const desde = i * bestiario.PISOS_POR_ZONA + 1;
            const plurales = sitio.pisos;
            return `<h3 class="ff-zona-titulo">${zona.nombre} <small>${plurales} ${desde}–${desde + bestiario.PISOS_POR_ZONA - 1}</small></h3>
                    <p class="ff-zona-texto">${zona.texto}</p>${criaturas}`;
        }).join("");
        return `<h2 class="ff-lugar-titulo">${sitio.icono} ${sitio.nombre}</h2>${zonas}`;
    };

    return `
        ${barraTorre("📖 Bestiario", `${vistas} de ${total}`)}
        <p class="ff-ventana ff-mensaje">Aquí queda lo que aprendes en la Torre y en la Mazmorra. Lanza hechizos (o usa «Analizar»)
           para descubrir el punto débil de cada criatura: la próxima vez ya lo sabrás.</p>
        <div class="ff-bestiario">
            ${Object.keys(bestiario.LUGARES).map((lugar) => abiertos.includes(lugar) ? seccion(lugar)
                : `<h2 class="ff-lugar-titulo">🔒 ${bestiario.LUGARES[lugar].nombre}</h2>
                   <p class="ff-zona-texto">${lugar === "mazmorra" ? `Se abre al superar el piso ${torre.ABRIR_MAZMORRA} de la Torre.` : esc(bestiario.LUGARES[lugar].abre.texto)} Sus criaturas aparecerán aquí.</p>`).join("")}
        </div>`;
}
