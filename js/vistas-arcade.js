// vistas-arcade.js — El arcade: la portada de los minijuegos, el reto del día y el bazar.
//
// Parte de vistas.js (se dividió por pantalla en la v133). Como todas las vistas: recibe datos y devuelve
// un texto con HTML; no cambia la partida. app.js lo usa a través de vistas.js, que reúne todos los archivos.

import * as juego from "./juego.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as desafios from "./desafios.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as habilidades from "./habilidades.js";
import * as vida from "./vida.js";
import * as rituales from "./rituales.js";
import * as mascota from "./mascota.js";
import * as equipo from "./equipo.js";
import { rutaPintura } from "./pinturas.js";
import { figuraPixel } from "./retratos.js";
import * as retos from "./retos.js";
import { chipAtributo, esc, vacio, encabezado, selectorSecciones, barra, textoPremioReto } from "./vistas-comun.js";
import { notaDeGym, selectorDeModo, selectorDeMarcas, tarjetaMazmorra } from "./vistas-torre.js";
import { avisoCaido } from "./vistas-heroe.js";

const { ATRIBUTOS, plural } = juego;

// ===== Pantalla: Arcade (minijuegos) =====

export function pantallaArcade(estado, ctx) {
    const caido = ctx.vida.caido;
    const fichas = arcade.fichasDisponibles(estado);
    const puedeJugar = fichas > 0 && !caido;   // si caíste en combate, el arcade se cierra
    // Lo que aporta tu equipo (con la armadura que tienes ahora).
    const poder = { ...equipo.poderDelEquipo(estado), armadura: ctx.vida.armadura.puntos };
    const ventajas = arcade.ventajasDelEquipo(poder);
    const heroeTorre = torre.heroeDeLaTorre({ fuerza: 1, intelecto: 1, carisma: 1, riqueza: 1 }, poder);
    // v38: las técnicas que ya aprendiste (según el nivel de tus atributos reales).
    const nivelDe = (clave) => juego.calcularNivel(estado.atributos[clave], juego.BASE_ATRIBUTO).nivel;
    const tecnicasTorre = Object.entries(torre.TECNICAS).map(([clave, t]) => {
        const sabe = nivelDe(t.atributo) >= torre.NIVEL_TECNICA;
        return sabe ? `${t.icono} <b>${t.nombre}</b>` : `<span class="texto-suave">🔒 ${t.nombre} (${ATRIBUTOS[t.atributo].nombre} ${torre.NIVEL_TECNICA})</span>`;
    });
    const habilidadesTorre = equipo.habilidadesDelEquipo(estado);
    const petTorre = mascota.mascotaDeBatalla(estado, ctx.avatar.mascota, ctx.hoy);
    const tarjetas = Object.entries(arcade.JUEGOS).map(([clave, j]) => {
        const record = estado.arcade.records[clave] || 0;
        const ventaja = arcade.textoVentajas(clave, ventajas);
        return `
            <article class="panel minijuego-tarjeta">
                <div class="minijuego-cabecera">
                    <span class="minijuego-icono">${j.icono}</span>
                    <div>
                        <h3>${j.nombre}</h3>
                        ${chipAtributo(j.atributo)}
                    </div>
                </div>
                <p class="nota">${j.descripcion}</p>
                <p class="mini equipo-ventaja">${ventaja ? `🧰 Tu equipo: ${ventaja}` : "🧰 Tu equipo todavía no da ventaja aquí."}</p>
                <p class="mini">🏅 Récord: <b>${record}</b> pts</p>
                <button type="button" class="boton boton-principal boton-ancho" data-accion="jugar" data-juego="${clave}"
                        ${puedeJugar ? "" : "disabled"}>Jugar · 🎟️ 1 ficha</button>
            </article>`;
    }).join("");

    // La Torre: el minijuego grande, arriba de todo.
    const partida = estado.arcade.torre;
    const recordTorre = estado.arcade.records.torre || 0;
    const conocidas = bestiario.progresoBestiario(estado.arcade.bestiario);
    const tarjetaTorre = `
        <article class="panel torre-tarjeta">
            <div class="torre-portada" style="background-image: url(${rutaPintura("torre")})">
                <span class="torre-portada-titulo">🗼 Torre del héroe</span>
            </div>
            <p class="nota">Batallas por turnos como en los juegos de rol clásicos: ${bestiario.ZONAS.length} zonas, ${conocidas.total} criaturas y un
               guardián cada ${torre.CADA_GUARDIAN} pisos. <b>Tu poder sale de los niveles de tus atributos reales.</b></p>
            ${notaDeGym(estado)}
            <details class="plegable plegable-reglas">
                <summary>📖 Cómo se juega y qué llevas</summary>
            <p class="nota">Combina hechizos distintos en turnos seguidos: ♨️ Vapor (fuego + hielo), 🌩️ Conducción (hielo + rayo) y 💥 Explosión (fuego + rayo).</p>
            <p class="nota">Antes de cada turno ves qué planea tu rival: ataca, usa magia, defiéndete o toma una poción. Cada criatura
               tiene un punto débil (🔥 fuego, ❄️ hielo o ⚡ rayo): descúbrelo y queda en tu bestiario. Desde que la Torre despertó, sus
               criaturas levantan barreras, cargan golpes y devuelven hechizos. El orden de cada turno es: tú, tu mascota, la criatura y el
               fin del turno (veneno, regeneración).</p>
            <p class="mini equipo-ventaja">🎯 Técnicas (una por atributo, desde su nivel ${torre.NIVEL_TECNICA}; una vez por piso): ${tecnicasTorre.join(" · ")}.</p>
            <p class="mini">✨ Voluntad: se llena peleando y aguantando golpes, y tu racha la empieza con algo. Llena, suelta un golpe
               ${String(torre.VOLUNTAD.multiplica).replace(".", ",")} veces más fuerte que rompe barreras y cargas.</p>
            <p class="mini">❤️ Subes con tu vida real: empiezas con el
               ${Math.round(vida.proporcionTorre(ctx.vida) * 100)} % de tu vida.</p>
            <p class="mini equipo-ventaja">🧰 Tu equipo: ${[
                poder.ataque ? `⚔️ +${poder.ataque} de ataque` : "",
                poder.magia ? `🔮 +${Math.round(poder.magia * 1.5)} a los hechizos` : "",
                poder.suerte ? `🍀 +${poder.suerte} % de crítico` : "",
                `🛡️ tu armadura para el ${Math.round(heroeTorre.proteccion * 100)} % de cada golpe`,
            ].filter(Boolean).join(" · ")}.</p>
            ${habilidadesTorre.length
                ? `<p class="mini equipo-ventaja">✨ Habilidades: ${habilidadesTorre.map((c) => `${habilidades.HABILIDADES[c].icono} <b>${habilidades.HABILIDADES[c].nombre}</b>`).join(" · ")}</p>`
                : `<p class="mini texto-suave">✨ El equipo épico y legendario da habilidades especiales en la Torre.</p>`}
            <p class="mini equipo-ventaja">${mascota.MASCOTAS[petTorre.especie].icono} ${esc(petTorre.nombre)} te acompaña:
               «${mascota.MASCOTAS[petTorre.especie].habilidad.nombre}» · ${mascota.textoPotencia(petTorre)}.</p>
            </details>
            <p class="mini">🏅 Récord: ${recordTorre ? `${plural(recordTorre, "piso superado", "pisos superados")}` : "todavía ninguno"}
               · Premio: ${torre.PREMIO.gemasPorPiso} 💎 y ${String(torre.PREMIO.xpPorPiso).replace(".", ",")} XP de Carisma por piso
               (máx. ${torre.PREMIO.maxGemas} 💎 y ${torre.PREMIO.maxXp} XP)</p>
            ${selectorDeModo(estado, "torre", partida, ctx.hoy)}
            ${selectorDeMarcas("torre", partida, ctx.hoy)}
            <button type="button" class="boton boton-principal boton-ancho" data-accion="torre-abrir" data-lugar="torre" ${!caido && (partida || fichas) ? "" : "disabled"}>
                ${partida ? `Continuar · piso ${partida.piso}` : "Subir a la torre · 🎟️ 1 ficha"}</button>
            <div class="torre-botones">
                <button type="button" class="boton boton-secundario" data-accion="historia-abrir" data-lugar="torre">📜 Historia</button>
                <button type="button" class="boton boton-secundario" data-accion="bestiario-abrir">📖 Bestiario · ${conocidas.vistas}/${conocidas.total}</button>
            </div>
        </article>`;

    // (v105) El arcade, ordenado: arriba tu héroe con tus fichas y el reto del día; abajo, un menú con cuatro secciones
    // (la Torre, las mazmorras, los minijuegos y el bazar) y solo se ve una a la vez.
    const MAZMORRAS = ["mazmorra", "minas", "laberinto", "fragua"];
    const abiertas = MAZMORRAS.filter((lugar) => torre.lugarAbierto(torre.arcadeConGym(estado), lugar)).length;
    const enCurso = MAZMORRAS.filter((lugar) => estado.arcade[lugar]).length;
    const vista = ctx.subvista?.arcade || "torre";
    const secciones = {
        torre: () => tarjetaTorre,
        mazmorras: () => `
            <p class="nota">Cada mazmorra se abre al llegar lejos en la anterior. Llevas <b>${abiertas} de ${MAZMORRAS.length}</b> abiertas.</p>
            ${MAZMORRAS.map((lugar) => tarjetaMazmorra(estado, caido, fichas, ctx.hoy, lugar)).join("")}`,
        minijuegos: () => `
            <p class="nota">Partidas cortas: cada una cuesta 1 ficha y da gemas 💎 y XP según tus puntos
               (máx. ${arcade.MAX_GEMAS} 💎 y ${arcade.MAX_XP} XP).</p>
            ${fichas || caido ? "" : vacio("Sin fichas por ahora. Completa una misión diaria y vuelve a jugar.")}
            ${tarjetas}`,
        bazar: () => panelBazar(estado, caido),
    };
    return `
        ${encabezado("🕹️ Arcade", "aventuras", "Aventuras")}
        ${caido ? avisoCaido(ctx.vida, "El arcade está cerrado") : ""}
        <section class="panel arcade-cabecera">
            <div class="arcade-heroe">${figuraPixel(ctx.avatar, { alt: "Tu héroe" })}</div>
            <div>
                <h2 class="titulo-juego">Arcade del héroe</h2>
                <p class="fichas">🎟️ ${plural(fichas, "ficha", "fichas")}</p>
                <p class="mini texto-suave">Ganas <b>1 ficha</b> por cada misión diaria completada.</p>
                <p class="mini">🗼 Récord en la Torre: <b>${recordTorre}</b> · ⛓️ ${abiertas}/${MAZMORRAS.length} mazmorras${enCurso ? ` · ${plural(enCurso, "partida", "partidas")} a medias` : ""}</p>
            </div>
        </section>
        ${tarjetaReto(estado, ctx)}
        ${selectorSecciones("arcade", [["torre", `🗼 Torre${partida ? " ·" : ""}`], ["mazmorras", "⛓️ Mazmorras"], ["minijuegos", "🕹️ Minijuegos"], ["bazar", "🛒 Bazar"]], vista)}
        ${(secciones[vista] || secciones.torre)()}`;
}


function tarjetaReto(estado, ctx) {
    const reto = estado.arcade.retos[ctx.hoy];
    if (!reto) return "";
    const datos = retos.RETOS[reto.tipo];
    const hecho = Boolean(reto.cobradoEn);
    return `
        <section class="panel reto-dia ${hecho ? "cumplido" : ""}" aria-label="Reto del día">
            <p class="etiqueta">🎯 Reto del día</p>
            <h3 class="reto-texto">${datos.icono} ${datos.texto(reto.meta)}</h3>
            ${barra(retos.porcentajeDelReto(reto), hecho ? "barra-oro" : "")}
            <p class="mini">${hecho
                ? `✅ ¡Cumplido hoy! Ganaste ${textoPremioReto(retos.PREMIO_RETO)}.`
                : `Llevas <b>${Math.min(reto.mejor, reto.meta)}</b> de ${reto.meta} ${datos.unidad} · Premio: ${textoPremioReto(retos.PREMIO_RETO)} (una vez al día).`}</p>
        </section>`;
}



// ===== Las gemas y el bazar del arcade (v31) =====
// Las gemas 💎 se ganan jugando y con los premios extra; se gastan aquí y en las mascotas.
// Las monedas 🪙 quedan para tus premios reales.
function panelBazar(estado, caido) {
    const gemas = estado.personaje.gemas || 0;
    const llevas = estado.arcade.bazar || [];
    const filas = Object.entries(torre.PROVISIONES).map(([clave, p]) => {
        const la = llevas.includes(clave);
        const puede = !la && !caido && gemas >= p.precio;
        const accion = la
            ? '<span class="mini oro">✓ La llevas</span>'
            : `<button type="button" class="boton boton-chico ${puede ? "boton-oro" : ""}" data-accion="comprar-provision" data-clave="${clave}"
                       ${puede ? "" : "disabled"}>💎 ${p.precio}</button>`;
        return `<li class="provision ${la ? "llevada" : ""}">
                    <span class="provision-icono" aria-hidden="true">${p.icono}</span>
                    <span><b>${p.nombre}</b><small>${p.texto}</small></span>
                    ${accion}
                </li>`;
    }).join("");
    const premioJefe = [campana.premioJefe(1).gemas, campana.premioJefe(5).gemas];
    return `
        <section class="panel bazar">
            <div class="titulo-seccion">
                <h2 class="titulo-juego">💎 Bazar</h2>
                <span class="saldo-gemas">💎 ${gemas}</span>
            </div>
            <p class="nota">Provisiones para tu próxima subida a la Torre o bajada a la Mazmorra: se usan al empezar.
               Se pagan con <b>gemas</b>, la moneda del juego (con ellas también compras equipo y adoptas mascotas).</p>
            <ul class="provisiones">${filas}</ul>
            <details class="plegable">
                <summary>💎 Cómo ganar gemas</summary>
                <dl class="estadisticas">
                    <div><dt>Minijuegos</dt><dd>💎 hasta ${arcade.MAX_GEMAS}</dd></div>
                    <div><dt>Torre del héroe</dt><dd>💎 ${torre.PREMIO.gemasPorPiso} por piso (máx. ${torre.PREMIO.maxGemas})</dd></div>
                    ${["mazmorra", "minas", "laberinto", "fragua"].map((l) => `<div><dt>${bestiario.LUGARES[l].nombre}</dt><dd>💎 ${torre.REGLAS[l].premio.gemasPorPiso} por ${bestiario.LUGARES[l].piso.toLowerCase()} (máx. ${torre.REGLAS[l].premio.maxGemas})</dd></div>`).join("")}
                    <div><dt>Jefe derrotado (1.º al 5.º)</dt><dd>💎 ${premioJefe[0]}–${premioJefe[1]}</dd></div>
                    <div><dt>Cofre del día</dt><dd>💎 15–40 (a veces)</dd></div>
                    <div><dt>Desafío de la semana</dt><dd>💎 ${desafios.COFRE.gemas}</dd></div>
                    <div><dt>Desafío relámpago</dt><dd>💎 ${rituales.RELAMPAGO.premio.gemas}</dd></div>
                    <div><dt>Tesoros y guaridas del mapa</dt><dd>💎 20–100</dd></div>
                </dl>
            </details>
        </section>`;
}
