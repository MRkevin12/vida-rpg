// vistas-mapa.js — El mapa del reino, los señores de cada región y la Crónica.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as campana from "./campana.js";
import * as mapa from "./mapa.js";
import * as cronica from "./cronica.js";
import * as mascota from "./mascota.js";
import { icono } from "./iconos.js";
import { esc, barra, notaJefeEsperando, encabezado } from "./vistas-comun.js";

const { plural } = juego;

// ===== El mapa del reino (v26) =====
// La imagen del mapa (pixel art) la pone app.js después de dibujar la pantalla, porque hacerla
// tarda un instante: aquí solo va su lugar (#mapa-imagen), con tu héroe y tu mascota encima.

// Dónde va algo del lienzo del mapa, en % (para ponerlo encima de la imagen).
const enElMapa = (p) => `left: ${((p.x / mapa.LIENZO.ancho) * 100).toFixed(2)}%; top: ${((p.y / mapa.LIENZO.alto) * 100).toFixed(2)}%`;


// (v86) Rótulos sobre el mapa: el nombre de cada señor (dorado si ya cayó), «Inicio», la fortaleza y la Torre.
function etiquetasDelMapa(senores, puntos, tramo, alcanzado) {
    const rotulo = (p, texto, clase = "", dy = 4) => `<span class="mapa-rotulo ${clase}" style="${enElMapa({ x: p.x, y: p.y + dy })}">${texto}</span>`;
    const ciudadela = tramo === mapa.CIUDADELA;
    return `
        ${rotulo(puntos[0], "Inicio", "", 8)}
        ${senores.map((s) => rotulo(puntos[s.n], `${s.liberada ? "✓ " : ""}${esc(s.nombre)}`, s.liberada ? "libre" : s.n <= alcanzado ? "" : "lejos", 8)).join("")}
        ${rotulo(puntos[mapa.LUGARES_POR_REGION], ciudadela ? "Brasero de los Vigías" : "Fortaleza", "mayor", 10)}
        ${tramo === 0 ? rotulo({ x: mapa.TORRE_VALLE.x - 6, y: mapa.TORRE_VALLE.y }, "Torre de los Vigías", "mayor", 8) : ""}`;
}


// La franja con las 6 regiones de la vuelta en que vas (v86: con nombre, barra de recorrido y dónde estás).
function franjaDelReino(estado, campanas, region) {
    const regiones = mapa.resumenDelReino(estado, campanas);
    const liberadas = regiones.filter((r) => r.pisada && r.liberada).length;
    const senores = regiones.reduce((suma, r) => suma + (r.pisada ? r.senoresCaidos : 0), 0);
    const tarjetas = regiones.map((r) => `
        <button type="button" class="reino-region ${r.liberada && r.pisada ? "libre" : ""} ${r.actual ? "actual" : ""} ${r.region === region ? "vista" : ""}"
                data-accion="mapa-region" data-region="${r.region}" ${r.pisada ? "" : "disabled"}
                aria-label="${r.nombre}${r.pisada ? `: ${r.senoresCaidos} de 4 señores` : " (todavía no llegas)"}">
            ${r.actual ? '<span class="reino-aqui" aria-hidden="true">📍</span>' : ""}
            <span class="reino-icono" aria-hidden="true">${r.pisada ? r.icono : "🔒"}</span>
            <small>${cronica.ROMANOS[r.region] || r.region + 1}</small>
            <b class="reino-nombre">${r.corto}</b>
            ${r.pisada ? `<span class="reino-barra" aria-hidden="true"><i style="width: ${Math.round((r.avance / mapa.LUGARES_POR_REGION) * 100)}%"></i></span>
                          <em>${r.liberada ? "✓ libre" : `⚔️ ${r.senoresCaidos}/4`}</em>` : '<em>—</em>'}
        </button>`).join("");
    return `
        <nav class="reino-franja" aria-label="Regiones del reino">${tarjetas}</nav>
        <p class="reino-total">🏁 ${liberadas} de ${regiones.length} regiones libres · ⚔️ ${senores} de ${regiones.length * 4} señores vencidos</p>`;
}


// (v86) La leyenda del mapa: qué es cada dibujo.
function leyendaDelMapa(ciudadela) {
    const fila = (icono, texto) => `<li><span aria-hidden="true">${icono}</span>${texto}</li>`;
    return `
        <details class="plegable mapa-leyenda">
            <summary>🧭 Leyenda del mapa</summary>
            <ul class="mapa-leyenda-lista">
                ${fila("🔥", "Fogata: donde empieza el camino de la región.")}
                ${fila("🟡", "Puntos amarillos: los lugares que ya recorriste (cada " + mapa.PASOS_POR_LUGAR + " pasos, uno).")}
                ${fila("💰", "Cofre: tesoro con gemas (lugares 5 y 15).")}
                ${fila("🕯️", "Santuario: XP para tu atributo más descuidado (lugares 10 y 20).")}
                ${fila("⚔️", ciudadela ? "Memorial: se enciende al vencer a los 5 señores de su campaña." : "Guarida: roja con estandarte si el señor sigue en pie; blanca si ya cayó.")}
                ${fila("🏰", ciudadela ? "Brasero de los Vigías: arde cuando se encienden los cuatro memoriales." : "Fortaleza: sus puertas se abren cuando caen los cuatro señores.")}
                ${fila("🪧", "Postes de señal, ríos con puente y campamentos: decoran el viaje, no dan premio.")}
                ${fila("🌫️", "Niebla: lo que todavía no exploras.")}
            </ul>
        </details>`;
}


// La ficha de uno de los señores de la región (o de un memorial de la Ciudadela).
function fichaSenor(s, region, campanas, porReclamar, alcanzado) {
    const c = campanas[s.categoria];
    const a = juego.ATRIBUTOS[s.categoria];
    const llegaste = s.n <= alcanzado;
    const reclamable = porReclamar.find((l) => l.id === s.id);
    const boton = reclamable
        ? `<button type="button" class="boton boton-chico boton-oro" data-accion="reclamar-lugar" data-id="${s.id}">Botín</button>` : "";
    if (s.tipo === "memorial") {
        const llevas = Math.min(5, c.derrotados - (s.numero - 5));
        return `<li class="senor ${s.liberada ? "libre" : ""}" id="senor-${s.id}">
                    <span class="senor-memorial" aria-hidden="true">${s.liberada ? "🔥" : "🗿"}</span>
                    <span class="objeto-info"><b>${s.nombre}</b>
                        <span class="mini texto-suave">Lugar ${s.n} · ${a.icono} ${a.nombre}</span>
                        <span class="mini">${s.liberada ? "Encendido: vencidos los 5 señores de su campaña." : `Se enciende al vencer a los 5 señores de la ${c.campana.nombre}: llevas ${llevas} de 5.`}</span>
                        ${s.liberada ? "" : barra(Math.round((llevas / 5) * 100), "barra-mini")}</span>
                    ${boton}
                </li>`;
    }
    const jefe = s.jefe;
    let estadoTexto;
    if (s.liberada) {
        estadoTexto = `<span class="mini oro">✓ Derrotado · guarida liberada${llegaste ? "" : ` (llegas en el lugar ${s.n})`}</span>`;
    } else if (s.actual) {
        estadoTexto = `<span class="mini">⚔️ Es tu rival ahora en Aventuras. Debilítalo con misiones de ${a.icono} ${a.nombre}:
                           ${c.vida} de ${c.vidaMax} ❤️</span>${barra(c.porcentaje, "barra-mini barra-jefe")}${notaJefeEsperando(c)}`;
    } else {
        const antes = c.jefe;
        estadoTexto = `<span class="mini texto-suave">Espera en su guarida. Antes tienes que vencer a ${esc(antes.nombre)} (${esc(antes.titulo.toLowerCase())}).</span>`;
    }
    return `<li class="senor ${s.liberada ? "libre" : s.actual ? "actual" : "lejano"}" id="senor-${s.id}">
                <figure class="retrato mini senor-retrato ${s.liberada ? "derrotado" : ""}"><img src="${campana.imagenDe(jefe.id)}" alt="${esc(jefe.nombre)}"></figure>
                <span class="objeto-info"><b>${esc(jefe.nombre)}</b>
                    <span class="mini texto-suave">${esc(jefe.titulo)} · lugar ${s.n} · ${a.icono} ${a.nombre}</span>
                    ${estadoTexto}</span>
                ${boton}
            </li>`;
}


// La Crónica del reino: un capítulo por región, que se va escribiendo con lo que haces.
function seccionCronica(estado, campanas, region) {
    const capitulos = cronica.capitulosDeLaCronica(estado, campanas, {
        heroe: estado.personaje.nombre,
        dragon: mascota.nombreDe(estado, mascota.INICIAL),
    });
    const abiertoPorDefecto = `r${region + 1}`;
    const html = capitulos.map((c) => {
        if (!c.abierto) {
            return `<div class="capitulo bloqueado"><span class="capitulo-numero">Capítulo ${c.numero}</span>
                        <b>${esc(c.titulo)}</b><small>🔒 ${esc(c.bloqueado)}</small></div>`;
        }
        const parrafos = c.parrafos.map((p) => `<p class="parrafo-${p.tipo}">${p.tipo === "caida" ? "⚔️ " : ""}${esc(p.texto)}</p>`).join("");
        return `<details class="capitulo" ${c.id === abiertoPorDefecto ? "open" : ""}>
                    <summary><span class="capitulo-numero">${c.id === "prologo" ? "Prólogo" : `Capítulo ${c.numero}`}</span> <b>${esc(c.titulo)}</b></summary>
                    ${parrafos}
                    ${/^r\d+$/.test(c.id) ? `<button type="button" class="boton boton-chico boton-secundario" data-accion="cine-region" data-region="${Number(c.id.slice(1)) - 1}">▶ Ver escena</button>` : ""}
                </details>`;
    }).join("");
    return `
        <section class="cronica">
            <h2 class="cronica-titulo">Crónica del reino</h2>
            <p class="cronica-sub">Se escribe sola: cada región que alcanzas y cada señor que cae agregan una página.</p>
            ${html}
        </section>`;
}


export function pantallaMapa(estado, ctx) {
    const pos = mapa.posicion(estado);
    const region = Math.min(ctx.regionMapa ?? pos.region, pos.region);
    const campanas = campana.estadoCampanas(estado);
    const dibujo = mapa.datosParaDibujar(estado, region, campanas);
    const senores = mapa.senoresDeRegion(region, campanas);
    const caidos = senores.filter((s) => s.liberada).length;
    const tramo = mapa.tramoDe(region);
    const datos = mapa.REGIONES[tramo];
    const puntos = mapa.puntosDelCamino();
    const porReclamar = mapa.lugaresPorReclamar(estado, campanas);
    const numeros = mapa.resumenDeRegion(estado, region, campanas);

    // Encima del mapa: tu héroe y tu mascota (en la región donde vas) y un botón en cada guarida.
    const aqui = region === pos.region ? puntos[pos.enRegion] : null;
    const encima = `
        ${aqui ? `<img class="mapa-heroe" id="mapa-heroe" alt="${esc(estado.personaje.nombre)}" style="${enElMapa(aqui)}">
                  <img class="mapa-mascota" id="mapa-mascota" alt="" style="${enElMapa({ x: aqui.x + 13, y: aqui.y + 2 })}">` : ""}
        ${senores.map((s) => `<button type="button" class="mapa-guarida ${s.liberada ? "libre" : ""}" data-accion="mapa-senor" data-id="senor-${s.id}"
                                      style="${enElMapa(puntos[s.n])}" aria-label="${esc(s.nombre)}: ${s.liberada ? "liberada" : "en pie"}">
                                  ${s.liberada && s.jefe ? `<img class="mapa-trofeo" src="${campana.imagenDe(s.jefe.id)}" alt="" loading="lazy" decoding="async">` : ""}</button>`).join("")}
        ${tramo === 0 ? `<button type="button" class="mapa-guarida" data-accion="ir" data-pantalla="arcade"
                                 style="${enElMapa({ x: mapa.TORRE_VALLE.x, y: mapa.TORRE_VALLE.y - 30 })}" aria-label="La Torre de los Vigías: súbela en el Arcade"></button>` : ""}
        ${etiquetasDelMapa(senores, puntos, tramo, dibujo.alcanzado)}`;

    const listaReclamar = porReclamar.length ? `
        <section class="panel mapa-premios">
            <div class="titulo-seccion">
                <h3 class="subtitulo">🎁 ${juego.plural(porReclamar.length, "lugar con botín", "lugares con botín")}</h3>
                ${porReclamar.length > 1 ? '<button type="button" class="boton boton-chico boton-oro" data-accion="reclamar-todo">Reclamar todo</button>' : ""}
            </div>
            <ul class="lista">${porReclamar.slice(0, 3).map((l) => {
                const lugar = mapa.LUGARES[l.tipo];
                const premio = [lugar.premio.gemas ? `+${lugar.premio.gemas} 💎` : "", lugar.premio.xp ? `+${lugar.premio.xp} XP` : ""].filter(Boolean).join(" · ");
                const nombre = l.nombre ? `${lugar.nombre}: ${esc(l.nombre)}`
                    : l.tipo === "fortaleza" ? (mapa.tramoDe(l.region) === mapa.CIUDADELA ? "Brasero de los Vigías: arden los cuatro" : "Fortaleza: región liberada")
                    : `${lugar.nombre} · lugar ${l.n}`;
                return `<li class="objeto"><span class="pocion-icono" aria-hidden="true">${lugar.icono}</span>
                    <span class="objeto-info"><b>${nombre}</b><span class="mini texto-suave">${mapa.nombreRegion(l.region)} · ${premio}</span></span>
                    <button type="button" class="boton boton-chico boton-oro" data-accion="reclamar-lugar" data-id="${l.id}">Reclamar</button></li>`;
            }).join("")}</ul>
            ${porReclamar.length > 3 ? `<p class="nota">…y ${juego.plural(porReclamar.length - 3, "lugar más", "lugares más")}.</p>` : ""}
        </section>` : "";

    const progreso = region === pos.region
        ? `${campana.factorDeViaje(estado) > 1 ? `🐎 Viajas ×${String(Math.round(campana.factorDeViaje(estado) * 10) / 10).replace(".", ",")} más rápido por tus jefes vencidos. ` : ""}Lugar ${pos.enRegion} de ${mapa.LUGARES_POR_REGION} · te ${pos.hastaSiguiente === 1 ? "falta 1 paso" : `faltan ${pos.hastaSiguiente} pasos`} para el siguiente.`
        : "Región recorrida.";
    const ciudadela = tramo === mapa.CIUDADELA;
    const finalDeRegion = ciudadela
        ? (caidos === 4 ? "El brasero de los Vigías arde: su fuego es el que falta en la Torre, de vuelta en el Valle del Comienzo."
                        : "Cuando ardan los cuatro, su fuego se juntará en el brasero de los Vigías.")
        : (caidos === 4 ? "Las puertas de la fortaleza están abiertas." : "Las puertas de la fortaleza se abren cuando caigan los cuatro.");
    const notaTorre = tramo === 0
        ? `<p class="nota">🗼 Al principio del camino, junto a la casa de Aurelio, se alza la Torre de los Vigías. Se sube desde el
           <button type="button" class="enlace enlace-en-linea" data-accion="ir" data-pantalla="arcade">Arcade</button>; sus ventanas se encienden con los pisos que subes.</p>`
        : "";

    return `
        ${encabezado("🗺️ El reino", "aventuras", "Aventuras")}
        ${franjaDelReino(estado, campanas, region)}
        <section class="panel mapa-cabecera">
            <div class="mapa-navegar">
                <button type="button" class="boton-icono" data-accion="mapa-region" data-region="${region - 1}" ${region > 0 ? "" : "disabled"} aria-label="Región anterior">‹</button>
                <div><p class="etiqueta">Capítulo ${cronica.ROMANOS[region] || region + 1}</p><h3 class="mapa-region">${mapa.nombreRegion(region)}</h3>
                     <p class="mapa-lema">${datos.lema}</p></div>
                <button type="button" class="boton-icono" data-accion="mapa-region" data-region="${region + 1}" ${region < pos.region ? "" : "disabled"} aria-label="Región siguiente">›</button>
            </div>
            <div class="mapa-datos">
                <div><b>${numeros.alcanzado}/${numeros.total}</b><span>📍 Lugares</span></div>
                <div><b>${caidos}/4</b><span>${ciudadela ? "🗿 Memoriales" : "⚔️ Señores"}</span></div>
                <div><b>${numeros.botin.tesoro.reclamados}/${numeros.botin.tesoro.total}</b><span>💰 Tesoros</span></div>
                <div><b>${numeros.botin.santuario.reclamados}/${numeros.botin.santuario.total}</b><span>🕯️ Santuarios</span></div>
            </div>
            ${barra(numeros.porcentaje, "barra-mini")}
            <p class="nota">${progreso} ${finalDeRegion}
               ${numeros.pendientes ? `🎁 Tienes <b>${plural(numeros.pendientes, "lugar con botín", "lugares con botín")}</b> en esta región.` : ""}</p>
            ${notaTorre}
            <button type="button" class="boton boton-chico boton-secundario" data-accion="cine-region" data-region="${region}">🎬 Ver la escena de esta región</button>
        </section>
        ${listaReclamar}
        <div class="mapa-pixel" data-region="${region}">
            <img class="mapa-imagen" id="mapa-imagen" alt="Mapa de ${mapa.nombreRegion(region)}">
            ${encima}
        </div>
        ${leyendaDelMapa(ciudadela)}
        <section class="panel">
            <h3 class="subtitulo">${tramo === mapa.CIUDADELA ? "🗿 Los memoriales" : "⚔️ Los señores de la región"}</h3>
            <p class="nota">${tramo === mapa.CIUDADELA
                ? "Cada memorial se enciende cuando caen los cinco señores de su campaña. Su fuego es el único que vuelve a encender la Llama de la Torre."
                : "Son tus jefes de Aventuras: caen con las misiones de su atributo. Al caer, su guarida queda libre y tiene botín."}</p>
            <ul class="lista">${senores.map((s) => fichaSenor(s, region, campanas, porReclamar, dibujo.alcanzado)).join("")}</ul>
        </section>
        ${seccionCronica(estado, campanas, region)}
        <p class="nota">Cada misión, tarea o sesión de enfoque es un paso; cada ${mapa.PASOS_POR_LUGAR} pasos llegas a un lugar:
           💰 tesoros, 🕯️ santuarios (XP para tu atributo más descuidado), ⚔️ guaridas de los señores y, al final, ${ciudadela ? "el brasero de los Vigías" : "la fortaleza"}.</p>`;
}
