// app-torre.js — El mapa del reino, los minijuegos, la Torre y la Mazmorra: abrir, pintar, sonidos de turno y sus botones.
//
// Parte de app.js (se dividió por tema en la v134). Usa del director (app.js) lo que todos necesitan:
// la partida (estado), ejecutar(), dibujarPantalla(), $()…

import * as acciones from "./acciones.js";
import * as juego from "./juego.js";
import * as vistas from "./vistas.js";
import * as arcade from "./arcade.js";
import * as campana from "./campana.js";
import * as torre from "./torre.js";
import * as bestiario from "./bestiario.js";
import * as sprites from "./sprites.js";
import * as maestro from "./maestro.js";
import * as mapa from "./mapa.js";
import * as minijuegos from "./minijuegos.js";
import { dibujarAvatar } from "./dibujo.js";
import { estado, ui, $, avatarActual, ejecutar, dibujarPantalla, ACCIONES } from "./app.js";
import { descartarCinematica, reproducirCinematica, abrirHistoria } from "./app-historias.js";
import { voz, sonar, ponerMusica, reproducirAnimacion } from "./app-efectos.js";

// ===== El mapa del reino =====
// La pantalla se dibuja sin la imagen del mapa: hacerla (pixel art) tarda un instante, así que
// se pone aquí después. pixel.js la guarda: si no cambió nada, la segunda vez sale al instante.
export async function pintarMapa() {
    const caja = $(".mapa-pixel");
    if (!caja) return;
    const region = Number(caja.dataset.region);
    const datos = mapa.datosParaDibujar(estado, region, campana.estadoCampanas(estado));
    const a = avatarActual();
    const [imagen, heroe, compania] = await Promise.all([
        sprites.spriteDeMapa(datos),
        $("#mapa-heroe") ? sprites.spriteDeHeroeEnMapa(a) : null,
        $("#mapa-mascota") ? sprites.spriteDeMascotaEnMapa(a.mascota) : null,
    ]);
    // Si mientras tanto cambiaste de región o de pantalla, esta imagen ya no va.
    if ($(".mapa-pixel") !== caja) return;
    if (imagen) $("#mapa-imagen").src = imagen;
    if (heroe) $("#mapa-heroe").src = heroe;
    if (compania) $("#mapa-mascota").src = compania;
    caja.classList.add("listo");
}


// ===== Minijuegos =====

let partida = null;        // el minijuego que se está jugando (para poder detenerlo)

export let juegoActual = null;    // qué minijuego es ("carrera", "lluvia" o "golpe")

export async function jugarMinijuego(tipo) {
    // Gastar la ficha (si no hay, ejecutar() muestra el mensaje y devuelve null).
    if (!ejecutar(() => acciones.empezarPartida(estado, tipo))) return;

    const minijuego = arcade.JUEGOS[tipo];
    juegoActual = tipo;
    $("#mj-titulo").textContent = `${minijuego.icono} ${minijuego.nombre}`;
    $("#mj-final").hidden = true;
    $("#mj-marcador").textContent = "Cargando…";
    $("#minijuego").hidden = false;   // primero se muestra, para que el lienzo tenga tamaño

    partida = await minijuegos.jugar(tipo, {
        lienzo: $("#mj-lienzo"),
        avatarSvg: dibujarAvatar(avatarActual(), { batalla: true, sinEfectos: true }),
        pixel: tipo === "golpe" ? await escenaDeGolpe() : null,
        marcador: $("#mj-marcador"),
        ayuda: $("#mj-ayuda"),
        alTerminar: (puntos) => terminarMinijuego(tipo, puntos),
        sonar,
        ventajas: arcade.ventajasDelEquipo(acciones.equipoDeBatalla(estado)),   // lo que te da tu equipo
    });
}

// "Golpe preciso" se ve como una batalla de la Torre: tu héroe contra una criatura de las
// que ya conoces (si todavía no subiste nunca, una de la primera zona), en su sala.
async function escenaDeGolpe() {
    const conocidas = bestiario.ORDEN.filter((id) => estado.arcade.bestiario[id]);
    const posibles = conocidas.length ? conocidas : bestiario.ORDEN.slice(0, bestiario.PISOS_POR_ZONA - 1);
    const id = posibles[Math.floor(Math.random() * posibles.length)];
    const criatura = bestiario.CRIATURAS[id];
    const [heroe, rival, sala] = await Promise.all([
        sprites.spriteDeHeroe(avatarActual()),
        sprites.spriteDeMonstruo(id),
        sprites.spriteDeSala(criatura.zona),
    ]);
    return { heroe, rival, sala, nombre: criatura.nombre };
}

function terminarMinijuego(tipo, puntos) {
    partida = null;
    const resultado = ejecutar(() => acciones.terminarPartida(estado, tipo, puntos));
    if (!resultado) return;

    const atributo = juego.ATRIBUTOS[arcade.JUEGOS[tipo].atributo];
    $("#mj-puntos").textContent = `${resultado.puntos} ${resultado.puntos === 1 ? "punto" : "puntos"}`;
    $("#mj-record").textContent = resultado.nuevoRecord ? "🏅 ¡Nuevo récord!" : `🏅 Récord: ${resultado.record}`;
    $("#mj-premio").textContent = `+${resultado.premio.gemas} 💎 · +${resultado.premio.xp} XP de ${atributo.icono} ${atributo.nombre}` +
        (resultado.reto ? ` · 🎯 ¡Reto del día! ${vistas.textoPremioReto(resultado.reto)}` : "");
    const fichas = arcade.fichasDisponibles(estado);
    $("#mj-otra").disabled = fichas < 1;
    $("#mj-otra").textContent = fichas ? `Otra vez · 🎟️ ${fichas}` : "Sin fichas";
    $("#mj-final").hidden = false;
    if (resultado.nuevoRecord) sonar("logro");
}

// ===== Torre del héroe y Mazmorra del Abismo =====
// Son por turnos, así que no usan lienzo: se vuelven a dibujar después de cada acción.
// Las dos usan la misma capa (#torre); lugarAbierto dice cuál se está jugando.

export let lugarAbierto = "torre";     // "torre" o "mazmorra"

let resultadoTorre = null;      // lo que se cobró al terminar (para mostrar el resumen)

let menuTorre = "principal";    // qué comandos se ven: "principal", "magia" (los hechizos) o "tecnicas" (v38)

let ultimoComando = "atacar";   // el último comando que usaste: ahí queda la manito

let ultimoHechizo = "fuego";    // y el último hechizo, dentro de «Magia»

let ultimaTecnica = "quebrar";  // y la última técnica, dentro de «Técnicas»

// La historia que se está contando (ver leyendas.js): { relato, pagina, salas } o null.
let relatoEnCurso = null;

// Las imágenes en pixel art de la batalla (ver sprites.js). Hacerlas tarda un instante,
// así que se preparan ANTES de dibujar (con await) y se guardan aquí.
const spritesTorre = { heroe: null, enemigo: null, sala: null, mascota: null, maestro: null };

async function prepararSprites() {
    const partida = estado.arcade[lugarAbierto];
    spritesTorre.heroe = await sprites.spriteDeHeroe(avatarActual());
    spritesTorre.maestro = await sprites.spriteDeMaestro(maestro.describirMaestro());   // su cara, para sus consejos
    if (!partida) return;   // al cobrar ya no hay partida: quedan la sala y la criatura de antes
    [spritesTorre.enemigo, spritesTorre.sala, spritesTorre.mascota] = await Promise.all([
        sprites.spriteDeMonstruo(partida.enemigo.id, avatarActual()),   // (el Reflejo sombrío es tu héroe)
        sprites.spriteDeSala(bestiario.zonaDelPiso(partida.piso, partida.lugar).id),
        partida.mascota ? sprites.spriteDeMascota(partida.mascota) : null,
    ]);
}

// Empieza a contar una historia (relato = { paginas }), con la sala de fondo de cada página.
async function mostrarRelato(relato) {
    const salas = await Promise.all(relato.paginas.map((p) => sprites.spriteDeSala(p.sala)));
    relatoEnCurso = { relato, pagina: 0, salas };
    pintarTorre();
    $("#torre-caja").scrollTop = 0;
}

function pintarTorre(eventos = []) {
    if (relatoEnCurso) {
        const { relato, pagina, salas } = relatoEnCurso;
        $("#torre-caja").innerHTML = vistas.pantallaRelato({
            pagina: relato.paginas[pagina], sala: salas[pagina], numero: pagina + 1, total: relato.paginas.length,
        });
        return;
    }
    $("#torre-caja").innerHTML = vistas.pantallaTorre({
        partida: estado.arcade[lugarAbierto],
        nombre: estado.personaje.nombre,
        sprites: spritesTorre,
        eventos,
        menu: menuTorre,
        ultimo: menuTorre === "magia" ? ultimoHechizo : menuTorre === "tecnicas" ? ultimaTecnica : ultimoComando,
        bestiario: estado.arcade.bestiario,
        resultado: resultadoTorre,
        fichas: arcade.fichasDisponibles(estado),
    });
}

// lugar: "torre" o "mazmorra".
// marca (v41): la que elegiste en la tarjeta del Arcade ("" o null = sin marca). Solo cuenta en una partida nueva.
async function abrirTorre(lugar = "torre", marca = null, modo = "normal") {
    // Si no hay partida, empezar una (gasta 1 ficha). Si hay, se sigue esa.
    lugarAbierto = lugar;
    resultadoTorre = null;
    relatoEnCurso = null;
    menuTorre = "principal";
    const resultado = ejecutar(() => acciones.empezarTorre(estado, undefined, lugar, marca || null, modo));
    if (!resultado) return;
    await prepararSprites();
    $("#torre").hidden = false;
    // La primera vez, antes de pelear, se cuenta cómo empieza la historia.
    if (resultado.relato) await mostrarRelato(resultado.relato);
    else pintarTorre();
    ponerMusica();   // en la Torre suena la música de batalla; en la Mazmorra, «Abismo»
    if (!resultado.relato) vozDeLlegada();   // (v58) la criatura que te espera
    // Si quedó una cinemática sin ver (saliste justo antes), se ve ahora; si empieza el relato, ese ya cuenta la historia.
    if (resultado.relato) descartarCinematica(lugar);
    else await reproducirCinematica(lugar);
}

function cerrarTorre() {
    $("#torre").hidden = true;   // la partida queda guardada: se sigue después
    resultadoTorre = null;
    relatoEnCurso = null;
    dibujarPantalla();
    ponerMusica();
}

// Sonidos de un turno, al compás de las animaciones (tu acción, la de tu mascota y la de la criatura).
// (v58) Cada quien suena a su tiempo, igual que las animaciones y la secuencia de turnos de la pantalla:
//   0 s tu acción · 0,4 s tu mascota · 0,65 s la criatura (su voz y su ataque, con su sonido propio si es especial) · 1 s el fin del turno.
// Cada criatura tiene su voz (sonido.sonarVoz, que respeta el ajuste de sonido): aparece, ataca, se queja cuando le pegas y cae.
const SONIDO_DE_MASCOTA = { dragon: "rugidito", cuervo: "graznido", buho: "ulular", basilisco: "siseo", grifo: "chillido", fenix: "fenix", escarcha: "hielo" };

const SONIDO_DE_ESPECIAL = { veneno: "veneno", drenar: "drenar", sellar: "sellar", coraza: "coraza", barrera: "barrera", carga: "carga", reflejo: "reflejo" };

function sonarTurno(eventos) {
    const partida = estado.arcade[lugarAbierto];
    const criatura = partida?.enemigo?.id;
    const heroe = eventos.find((e) => e.quien === "heroe");
    const mascota = eventos.find((e) => e.quien === "mascota");
    const enemigo = eventos.find((e) => e.quien === "enemigo" && e.tipo !== "derrotado");
    const cayo = eventos.some((e) => e.tipo === "derrotado");
    const veneno = eventos.find((e) => e.quien === "veneno");
    const tarde = (ms, hacer) => setTimeout(hacer, ms);

    // (v63) Una habilidad o un don que se nota: un destello de sonido (en tu acción y, si es de la criatura, en su turno).
    if (heroe?.activas?.length) tarde(120, () => sonar("habilidad"));
    if (enemigo?.activas?.length) tarde(950, () => sonar("habilidad"));

    // 1. Tú
    if (heroe?.tipo === "hechizo") sonar(heroe.elemento);   // "fuego", "hielo" o "rayo"
    if (heroe?.tipo === "atacar" || (heroe?.tipo === "tecnica" && heroe.dano)) sonar("tajo");
    if (heroe?.tipo === "defender") sonar("coraza");
    if (heroe?.tipo === "pocion") sonar("pocion");
    if (heroe?.tipo === "voluntad") sonar("nivel");          // el Golpe de Voluntad
    if (heroe?.tipo === "tecnica" && !heroe.dano) sonar("cursor");   // Analizar o Intimidar
    if (heroe?.reflejado) tarde(250, () => sonar("coraza"));    // su espejo te devolvió el hechizo
    if (heroe?.dano) tarde(300, () => sonar(heroe.critico ? "critico" : "impacto"));
    if (heroe?.cura && heroe.tipo !== "pocion") sonar("moneda");
    // La criatura se queja si le pegaste (y no cayó).
    if (criatura && !cayo && (heroe?.dano || mascota?.dano)) tarde(heroe?.dano ? 350 : 650, () => voz(criatura, "herido"));

    // 2. Tu mascota
    if (mascota) {
        const suena = SONIDO_DE_MASCOTA[partida?.mascota?.especie];
        if (mascota.tipo === "renacer") tarde(450, () => sonar("nivel"));
        else {
            if (suena) tarde(400, () => sonar(suena));
            if (mascota.dano || mascota.elemento) tarde(520, () => sonar(mascota.elemento || "impacto"));
            else if (!suena) tarde(450, () => sonar("moneda"));
        }
    }

    // 3. La criatura
    if (cayo) {
        if (criatura) tarde(enemigo?.reflejo ? 1100 : 700, () => voz(criatura, "cae"));
        tarde(enemigo?.reflejo ? 1250 : 850, () => sonar("victoria"));
    } else if (enemigo) {
        const especial = enemigo.tipo === "descarga" ? "descarga" : enemigo.especial;
        if (criatura && (torre.GOLPES.includes(enemigo.tipo) || enemigo.tipo === "especial")) tarde(650, () => voz(criatura, "ataque"));
        if (especial && SONIDO_DE_ESPECIAL[especial] || especial === "descarga") {
            tarde(especial === "descarga" ? 700 : 760, () => sonar(especial === "descarga" ? "descarga" : SONIDO_DE_ESPECIAL[especial]));
        }
        if (enemigo.dano) tarde(900, () => sonar(partida?.fase === "fin" ? "fallo" : "impacto"));
        if (enemigo.especial === "coraza" || enemigo.especial === "barrera" || enemigo.especial === "reflejo") tarde(1000, () => sonar("coraza"));
    }

    // 4. El fin del turno
    if (eventos.some((e) => e.quien === "fase")) tarde(500, () => sonar("robo"));
    if (veneno) tarde(1250, () => sonar("veneno"));
    if (eventos.some((e) => e.quien === "furia")) tarde(450, () => { sonar("robo"); if (criatura) voz(criatura, "ataque"); });
    if (eventos.some((e) => e.tipo === "renacer" || e.habilidad === "gracia")) tarde(1350, () => sonar("nivel"));
}

// Cuando llega una criatura nueva (el piso siguiente, o al abrir la Torre), se oye su voz.
function vozDeLlegada() {
    const id = estado.arcade[lugarAbierto]?.enemigo?.id;
    if (id) setTimeout(() => voz(id, "aparece"), 450);
}


export function cerrarMinijuego() {
    if (partida) {
        // A mitad de partida: se termina y cuentan los puntos que llevabas.
        if (!confirm("¿Terminar la partida ahora? Cuentan los puntos que llevas.")) return;
        partida.detener();
        return;
    }
    $("#minijuego").hidden = true;
    dibujarPantalla();
}

// Los botones de este archivo (data-accion="…"). app.js los junta todos en ACCIONES.
export const ACCIONES_TORRE = {
    jugar: (boton) => jugarMinijuego(boton.dataset.juego),

    // Torre del héroe y Mazmorra del Abismo (data-lugar dice cuál).
    "torre-abrir": (boton) => {
        const lugar = bestiario.LUGARES[boton.dataset.lugar] ? boton.dataset.lugar : "torre";
        // La marca de la tarjeta del Arcade (en «Subir otra vez» no hay tarjeta: sin marca).
        const marcada = boton.closest("article")?.querySelector(`input[name="marca-${lugar}"]:checked`);
        const modo = boton.closest("article")?.querySelector(`input[name="modo-${lugar}"]:checked`)?.value || "normal";   // (v65)
        return abrirTorre(lugar, marcada?.value || null, modo);
    },
    "historia-abrir": (boton) => {
        lugarAbierto = bestiario.LUGARES[boton.dataset.lugar] ? boton.dataset.lugar : "torre";
        abrirHistoria(lugarAbierto);
        ponerMusica();
    },
    "torre-salir": () => cerrarTorre(),
    // «Continuar» en una página de la historia: la siguiente, o volver a la batalla.
    "torre-relato": () => {
        if (!relatoEnCurso) return;
        relatoEnCurso.pagina += 1;
        if (relatoEnCurso.pagina >= relatoEnCurso.relato.paginas.length) relatoEnCurso = null;
        sonar("cursor");
        pintarTorre();
        $("#torre-caja").scrollTop = 0;
    },
    // «Magia» abre la lista de hechizos, «Técnicas» la de técnicas; «Volver» regresa a los comandos.
    "torre-menu": (boton) => {
        menuTorre = ["magia", "tecnicas"].includes(boton.dataset.menu) ? boton.dataset.menu : "principal";
        sonar("cursor");
        pintarTorre();
    },
    "torre-accion": (boton) => {
        // elemento: solo en los hechizos; tecnica: solo en las técnicas (v38).
        const { torre: comando, elemento = null, tecnica = null } = boton.dataset;
        const resultado = ejecutar(() => acciones.accionTorre(estado, comando, elemento || tecnica, lugarAbierto));
        if (!resultado) return;
        ultimoComando = comando;
        if (elemento) ultimoHechizo = elemento;
        if (tecnica) ultimaTecnica = tecnica;
        menuTorre = "principal";
        pintarTorre(resultado.eventos);
        sonarTurno(resultado.eventos);
        // Cayó un guardián: después de verlo deshacerse, su cinemática.
        if (resultado.eventos.some((e) => e.tipo === "derrotado") && estado.arcade[lugarAbierto]?.cine) {
            setTimeout(() => reproducirCinematica(lugarAbierto), 1700);
        }
    },
    "torre-mejora": async (boton) => {
        const resultado = ejecutar(() => acciones.mejoraTorre(estado, boton.dataset.mejora, lugarAbierto));
        if (!resultado) return;
        sonar("completar");
        await prepararSprites();   // la criatura del piso nuevo (y su sala, si cambia la zona)
        // Si acabas de vencer a un guardián por primera vez, la historia sigue.
        if (resultado.relato) {
            await mostrarRelato(resultado.relato);   // la historia ya cuenta la llegada a la zona nueva
            descartarCinematica(lugarAbierto);
        } else {
            pintarTorre();
            vozDeLlegada();   // (v58) la criatura del piso nuevo
            await reproducirCinematica(lugarAbierto);   // llegaste a una zona nueva o al piso de un guardián
        }
    },
    // El camino se bifurca (v60): desafío (élite, mejor botín) o sendero tranquilo (te curas, criatura cansada).
    "torre-ruta": (boton) => {
        const resultado = ejecutar(() => acciones.rutaTorre(estado, boton.dataset.ruta, lugarAbierto));
        if (!resultado) return;
        sonar(boton.dataset.ruta === "desafio" ? "retumbo" : "pocion");
        pintarTorre();
        vozDeLlegada();
    },
    // Una sala entre pisos (v42): la opción elegida cambia a tu héroe y sigue la batalla.
    "torre-sala": (boton) => {
        const resultado = ejecutar(() => acciones.salaTorre(estado, boton.dataset.opcion, lugarAbierto));
        if (!resultado) return;
        sonar(boton.dataset.opcion === "seguir" ? "cursor" : "completar");
        pintarTorre();
    },
    "torre-rendirse": () => {
        const sitio = bestiario.LUGARES[lugarAbierto];
        const texto = lugarAbierto === "torre"
            ? "¿Huir de la Torre? Cobras lo que ganaste hasta ahora y la subida termina."
            : `¿Huir de ${lugarAbierto === "mazmorra" ? "la Mazmorra" : `las ${sitio.nombre.split(" ")[0]}`.replace("las Laberinto", "el Laberinto")}? Cobras lo que ganaste hasta ahora y ${sitio.verboBajar || "el descenso"} termina.`;
        if (!confirm(texto)) return;
        ACCIONES["torre-cobrar"]();
    },
    "torre-cobrar": () => {
        const resultado = ejecutar(() => acciones.terminarTorre(estado, lugarAbierto));
        if (!resultado) return;
        resultadoTorre = resultado;
        sonar(resultado.nuevoRecord ? "logro" : "moneda");
        pintarTorre();
    },

    // El mapa del reino.
    "reclamar-lugar": (boton) => ejecutar(() => acciones.reclamarLugar(estado, boton.dataset.id)),
    "reclamar-todo": () => ejecutar(() => acciones.reclamarTodo(estado)),
    "mapa-region": (boton) => {
        ui.regionMapa = Number(boton.dataset.region);
        dibujarPantalla();
    },
    // Tocar una guarida en el mapa: se ve la ficha de su señor (y brilla un momento).
    "mapa-senor": (boton) => {
        const ficha = document.getElementById(boton.dataset.id);
        if (!ficha) return;
        ficha.scrollIntoView({ behavior: "smooth", block: "start" });
        reproducirAnimacion(ficha, "resaltado");
    },
};
