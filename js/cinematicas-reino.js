// cinematicas-reino.js — Más cinemáticas (v56): el reino, el arcade, Las Voces del Valle y la historia de la Torre.
//
// Funcionan con el mismo reproductor de la Torre (cine.js) y el mismo formato de tomas (ver cinematicas.js), pero con
// otros fondos y personajes:
//   · fondo «pintura:camino» = una pintura de fondos/ (ver pinturas.js); o el id de una sala de la Torre («cripta»…).
//   · actores: "heroe", "criatura" (la que prepare app.js), "maestro" (Aurelio de cuerpo entero), el id de una persona de
//     la aldea, o el id de un jefe (se dibuja como una pintura enmarcada: imagenes.retratos).
//   · ambiente: "niebla" | "chispas" | "lluvia" (una capa que se mueve encima de la escena).
// Cada cinemática sale UNA vez (lo que ya viste se anota en estado.mapa.cines con una clave) y se puede volver a ver con
// un botón. Este archivo solo arma datos: no dibuja ni guarda nada.
//
// Ojo con la historia: la Llama de la Torre solo arde al final de la saga (ver saga.js): ninguna escena dice que ya arde.

import { CRIATURAS, LUGARES as LUGARES_TORRE } from "./bestiario.js";
import { REGIONES, tramoDe, vueltaDe, CIUDADELA } from "./mapa.js";

const conNombre = (texto, nombre) => texto.replaceAll("{n}", nombre);

// Qué pintura va de fondo en cada región del mapa.
export const PINTURA_DE_REGION = { valle: "aldea", bosque: "bosque", montanas: "cumbre", desierto: "camino", mar: "mar", ciudadela: "castillo" };

// El ambiente de cada región.
const AMBIENTE_DE_REGION = { valle: "chispas", bosque: "niebla", montanas: "niebla", desierto: "chispas", mar: "lluvia", ciudadela: "chispas" };

// Lo que dice Aurelio al llegar a cada región.
const AURELIO_EN_REGION = {
    valle: "Aquí empezó todo, {n}. El valle invita a quedarse; el camino, a seguir. Elige cada día.",
    bosque: "Los árboles no te pierden: es la duda la que te hace dar vueltas. Camina aunque no veas el final.",
    montanas: "Nadie sube una montaña con ganas todos los días. Se sube con costumbre, un paso tras otro.",
    desierto: "Aquí no pasa nada nuevo y eso es lo difícil. La constancia es hacer lo mismo cuando nadie mira.",
    mar: "El mar no se cruza: se espera. Remar sin prisa también es avanzar, {n}.",
    ciudadela: "Esta ciudad la levantaron quienes vencieron. Mira sus memoriales: cada fuego fue un carácter ganado.",
};

// Una sola clave por cosa vista (se guardan en estado.mapa.cines).
export const claveDeRegion = (region) => `region-${region}`;
export const claveDeSenor = (id) => `senor-${id}`;
export const claveDeFortaleza = (region) => `fortaleza-${region}`;
export const claveDeVoz = (escena) => `voz-${escena}`;
export const CLAVE_ARCADE = "arcade-intro";
export const CLAVE_VOCES = "voces-intro";
export const CLAVE_EPILOGO = "voces-epilogo";

// Rellena lo que todas las tomas necesitan y escribe el nombre del héroe.
function armar(tipo, tomas, nombre) {
    return {
        tipo,
        tomas: tomas.map((t) => ({
            efecto: null, titulo: "", sonido: null, foco: "50% 60%", ambiente: null, ...t,
            texto: conNombre(t.texto || "", nombre),
            titulo: conNombre(t.titulo || "", nombre),
        })),
    };
}

const tu = (x = 74, extra = {}) => ({ quien: "heroe", x, ...extra });
const aurelio = (x = 28, extra = {}) => ({ quien: "maestro", x, ...extra });


// ===== El reino =====

// Llegas a una región nueva.
export function cinematicaDeRegion(region, nombre) {
    const tramo = tramoDe(region);
    const datos = REGIONES[tramo];
    const fondo = `pintura:${PINTURA_DE_REGION[datos.paisaje]}`;
    const ambiente = AMBIENTE_DE_REGION[datos.paisaje];
    const vuelta = vueltaDe(region);
    const nombreRegion = vuelta ? `${datos.nombre} ${["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][vuelta] || vuelta + 1}` : datos.nombre;
    const habitantes = tramo === CIUDADELA
        ? "Cuatro memoriales esperan su fuego: cada uno se enciende al vencer a los cinco señores de una campaña."
        : "Aquí viven cuatro señores, uno por cada campaña. Cada misión que cumples les quita un poco de vida.";
    return armar("region", [
        { fondo, actores: [tu(50, { anim: "cine-camina" })], camara: "derecha", ambiente, titulo: nombreRegion, texto: datos.lema, ms: 3800, sonido: "campana" },
        { fondo, actores: [aurelio(26, { anim: "cine-flota" }), tu(72)], camara: "quieto", ambiente, texto: `Aurelio: «${AURELIO_EN_REGION[datos.paisaje]}»`, ms: 5200, sonido: "cursor" },
        { fondo, actores: [tu(60)], camara: "zoom", foco: "60% 60%", ambiente, texto: habitantes, ms: 4200 },
    ], nombre);
}

// Llegas a la guarida de un señor que ya habías vencido: se libera.
// senor = una de mapa.senoresDeRegion (tiene .jefe), atributo = juego.ATRIBUTOS[categoria].
export function cinematicaDeSenor(senor, region, atributo, nombre) {
    const datos = REGIONES[tramoDe(region)];
    const fondo = `pintura:${PINTURA_DE_REGION[datos.paisaje]}`;
    const jefe = senor.jefe;
    const jefeActor = { quien: jefe.id, x: 32 };
    return armar("senor", [
        { fondo, actores: [{ ...jefeActor, anim: "cine-flota" }, tu(74)], camara: "zoom", foco: "40% 55%", efecto: "oscuro", ambiente: "niebla",
          titulo: jefe.nombre, texto: jefe.texto, ms: 4600, sonido: "retumbo" },
        { fondo, actores: [{ ...jefeActor, anim: "cine-cae" }, tu(74)], camara: "zoom", foco: "40% 55%", efecto: "destello",
          texto: `${jefe.nombre} cae. {n} lo venció con ${atributo.icono} ${atributo.nombre}: ${jefe.titulo.toLowerCase()}.`, ms: 3800, sonido: "victoria" },
        { fondo, actores: [tu(56)], camara: "izquierda", ambiente: "chispas", titulo: "Guarida liberada",
          texto: "La cueva queda vacía y, entre las piedras, brilla lo que el señor guardaba. Es botín de {n}.", ms: 4000, sonido: "logro" },
    ], nombre);
}

// Los cuatro señores de una región cayeron: se abre la fortaleza (o arde el brasero, en la Ciudadela).
export function cinematicaDeFortaleza(region, nombre) {
    const tramo = tramoDe(region);
    const datos = REGIONES[tramo];
    if (tramo === CIUDADELA) {
        return armar("fortaleza", [
            { fondo: "pintura:castillo", actores: [tu(50, { anim: "cine-camina" })], camara: "derecha", ambiente: "chispas", titulo: "El brasero de los Vigías",
              texto: "Los cuatro memoriales arden. Su fuego sube por la Ciudadela y se junta en un solo brasero.", ms: 4600, sonido: "campana" },
            { fondo: "pintura:castillo", actores: [aurelio(26, { anim: "cine-flota" }), tu(72)], camara: "zoom", foco: "50% 55%", efecto: "destello",
              texto: "Aurelio: «Este fuego no es de la Torre todavía. Llévalo de vuelta al valle, {n}: ahí empezó todo.»", ms: 5200, sonido: "logro" },
        ], nombre);
    }
    return armar("fortaleza", [
        { fondo: "pintura:fortaleza", actores: [tu(50, { anim: "cine-camina" })], camara: "derecha", ambiente: "chispas", titulo: `Fortaleza de ${datos.nombre.replace(/^(El|La|Las|Los) /, "")}`,
          texto: "Los cuatro señores cayeron. Las puertas de la fortaleza, selladas desde hace siglos, empiezan a abrirse.", ms: 4400, sonido: "retumbo" },
        { fondo: "pintura:fortaleza", actores: [tu(60)], camara: "zoom", foco: "50% 50%", efecto: "destello",
          texto: "Dentro hay un tesoro que nadie tocó, y un camino que sigue hacia la región siguiente.", ms: 4200, sonido: "logro" },
    ], nombre);
}


// ===== El arcade y Las Voces del Valle =====

// La primera vez que entras al Arcade.
export function cinematicaDeArcade(nombre) {
    const fondo = "pintura:salon";
    return armar("arcade", [
        { fondo, actores: [tu(50, { anim: "cine-camina" })], camara: "arriba", ambiente: "chispas", titulo: "El Arcade de los Vigías",
          texto: "Al pie de la Torre, los Vigías dejaron salas donde entrenar sin riesgo.", ms: 4000, sonido: "campana" },
        { fondo, actores: [aurelio(26, { anim: "cine-flota" }), tu(72)], camara: "quieto",
          texto: "Aurelio: «Correr, atrapar monedas, acertar el golpe… Cada ficha que ganas con tus misiones es un turno aquí.»", ms: 5400, sonido: "cursor" },
        { fondo, actores: [aurelio(26), tu(72)], camara: "derecha", efecto: "destello",
          texto: "Aurelio: «Y si te sientes listo, la Torre te espera arriba. Sube con calma, {n}.»", ms: 4400, sonido: "logro" },
    ], nombre);
}

// La primera vez que entras a Las Voces del Valle.
export function cinematicaDeVoces(nombre) {
    const fondo = "pintura:aldea";
    return armar("voces", [
        { fondo, actores: [tu(50, { anim: "cine-camina" })], camara: "derecha", ambiente: "niebla", titulo: "Las Voces del Valle",
          texto: "Al pie de la Torre hay una aldea muy callada.", ms: 3800, sonido: "campana" },
        { fondo, actores: [aurelio(26, { anim: "cine-flota" }), tu(72)], camara: "quieto", ambiente: "niebla",
          texto: "Aurelio: «Cuando la Llama se apagó, la Sombra de la Voz no mató a nadie: les quitó la voz a todos.»", ms: 5400, sonido: "cursor" },
        { fondo, actores: [aurelio(26), tu(72)], camara: "zoom", foco: "70% 60%",
          texto: "Aurelio: «Nadie dice lo que de verdad siente. No los vencerás con una espada, {n}: los ayudarás a decirlo.»", ms: 5400, sonido: "logro" },
    ], nombre);
}

// Cuando una persona de la aldea recupera su voz (final «bien» de una conversación).
// persona = { id, nombre, voz (lo que le quitaron), lugar (id del lugar), fondo (pintura del lugar) }.
export function cinematicaDeVoz(persona, nombre) {
    const fondo = `pintura:${persona.fondo || "aldea"}`;
    return armar("voz", [
        { fondo, actores: [{ quien: persona.id, x: 30, anim: "cine-late" }, tu(74)], camara: "zoom", foco: "30% 60%", efecto: "oscuro", ambiente: "niebla",
          titulo: persona.nombre, texto: `${persona.nombre} respira hondo. Durante años calló lo que sentía.`, ms: 4200, sonido: "cursor" },
        { fondo, actores: [{ quien: persona.id, x: 30 }, tu(74)], camara: "zoom", foco: "30% 60%", efecto: "destello", ambiente: "chispas",
          texto: `Por fin lo dice, con su propia voz. ${persona.voz} se aleja sin hacer ruido.`, ms: 4600, sonido: "logro" },
        { fondo, actores: [{ quien: persona.id, x: 40 }, tu(66)], camara: "quieto", ambiente: "chispas",
          texto: "En la aldea alguien levanta la vista: se oye una voz que hacía mucho que no se oía.", ms: 4200 },
    ], nombre);
}

// Al recuperar la última voz de la aldea.
export function cinematicaDelEpilogo(nombre) {
    const fondo = "pintura:aldea";
    return armar("epilogo", [
        { fondo, actores: [tu(50)], camara: "arriba", ambiente: "niebla", titulo: "La aldea habla",
          texto: "La plaza, la fragua y la posada, tan calladas, de pronto no lo están.", ms: 4400, sonido: "campana" },
        { fondo, actores: [aurelio(26, { anim: "cine-flota" }), tu(72)], camara: "quieto", ambiente: "chispas", efecto: "destello",
          texto: "Aurelio: «Esto no lo logró ninguna espada. Lo lograste tú, escuchando.»", ms: 5000, sonido: "logro" },
    ], nombre);
}


// ===== Los pergaminos de la Biblioteca prohibida (v57) =====

// Al terminar de leer un pergamino: dos tomas de su historia, la moraleja (con Aurelio) y el presagio de lo que viene.
// p = un pergamino de pergaminos.js: { titulo, moraleja, presagio, escena: { fondo, ambiente, lineas: [dos textos] } }.
export function cinematicaDePergamino(p, nombre) {
    const { fondo, ambiente, lineas } = p.escena;
    return armar("pergamino", [
        { fondo, actores: [tu(50, { anim: "cine-camina" })], camara: "derecha", ambiente, titulo: p.titulo, texto: lineas[0], ms: 5000, sonido: "campana" },
        { fondo, actores: [tu(62)], camara: "zoom", foco: "60% 60%", ambiente, texto: lineas[1], ms: 5200, sonido: "cursor" },
        { fondo, actores: [aurelio(26, { anim: "cine-flota" }), tu(72)], camara: "quieto", efecto: "destello", ambiente: "chispas",
          titulo: "Moraleja", texto: `Aurelio: «${p.moraleja}»`, ms: 5600, sonido: "logro" },
        { fondo, actores: [tu(60)], camara: "arriba", efecto: "oscuro", ambiente: "niebla",
          texto: p.presagio, ms: 6200, sonido: "retumbo" },
    ], nombre);
}


// ===== «El Centinela», el libro de Casio (v62) =====

// Al terminar el libro: Casio de pie en el piso 19 (la criatura «centinela»), tú y Aurelio.
export function cinematicaDeCasio(nombre) {
    const fondo = "pintura:cumbre";
    const casio = { quien: "criatura", x: 30 };
    return armar("libro", [
        { fondo, actores: [{ ...casio, anim: "cine-late" }], camara: "arriba", ambiente: "niebla", efecto: "oscuro", titulo: "El Centinela",
          texto: "Cien años de guardia en el piso diecinueve. Casio subía cada mañana una escalera que nadie veía.", ms: 5600, sonido: "retumbo" },
        { fondo, actores: [{ ...casio, anim: "cine-late" }, tu(74)], camara: "zoom", foco: "30% 60%", ambiente: "chispas",
          texto: "Un día alguien llegó con un dragón de escamas moradas. Casio lo reconoció por el olor: Ceniza.", ms: 5200, sonido: "campana" },
        { fondo, actores: [casio, tu(74)], camara: "quieto", efecto: "destello", ambiente: "chispas",
          texto: "Bajó la espada. Y por primera vez en cien años, el cielo se abrió sobre la Torre.", ms: 5200, sonido: "victoria" },
        { fondo, actores: [aurelio(28, { anim: "cine-flota" }), tu(72)], camara: "derecha", ambiente: "chispas",
          titulo: "Bajó un piso", texto: "Aurelio: «Ayer subió. Hoy, también. Eso fue todo lo que Casio supo enseñar, {n}. Y alcanzó.»", ms: 6000, sonido: "logro" },
    ], nombre);
}


// ===== «La linterna de Orrin», el libro de Marta (v70) =====

// Al terminar el libro: el Rey Hueco en su trono de cuadernos, y lo que Marta pidió a quien bajara.
export function cinematicaDeOrrin(nombre) {
    const fondo = "abismo";
    const rey = { quien: "criatura", x: 30 };
    return armar("libro", [
        { fondo, actores: [{ ...rey, anim: "cine-late" }], camara: "arriba", ambiente: "niebla", efecto: "oscuro", titulo: "La linterna de Orrin",
          texto: "En el fondo de la Mazmorra hay un trono de cuadernos y una corona de cuerda sin nada dentro.", ms: 5600, sonido: "retumbo" },
        { fondo, actores: [{ ...rey, anim: "cine-late" }, tu(74)], camara: "zoom", foco: "30% 60%", ambiente: "niebla",
          texto: "Antes de ser el Rey Hueco fue Orrin: el mejor de los doce, el de la risa que se oía desde la cantera.", ms: 5600, sonido: "campana" },
        { fondo, actores: [rey, tu(74)], camara: "quieto", efecto: "destello", ambiente: "chispas",
          texto: "No lo vació un gran fallo. Lo vaciaron mil «solo un día» sin fecha de vuelta.", ms: 5200, sonido: "victoria" },
        { fondo, actores: [rey, tu(72)], camara: "derecha", ambiente: "chispas",
          titulo: "Su nombre", texto: "Marta escribió: «No lo odies. Llámalo Orrin, en voz alta, una vez. Y sube su linterna hasta la piedra del primer piso.»", ms: 6400, sonido: "logro" },
    ], nombre);
}


// ===== La historia: «▶ Ver escena» de cada capítulo (Torre y Mazmorra) =====

// El guardián de una zona (para que aparezca en la escena de su capítulo). Si no hay, null.
export function guardianDeZona(lugar, zonaId) {
    const sitio = LUGARES_TORRE[lugar];
    if (!sitio) return null;
    const id = sitio.orden.find((c) => CRIATURAS[c].zona === zonaId && CRIATURAS[c].guardian);
    return id || null;
}

// Parte un texto en trozos cortos (de una o dos frases) para ir contándolo toma a toma.
export function trozosDe(texto, max = 170) {
    const frases = texto.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) || [texto];
    const trozos = [];
    let actual = "";
    for (const frase of frases) {
        if (actual && (actual + frase).length > max) {
            trozos.push(actual.trim());
            actual = "";
        }
        actual += frase;
    }
    if (actual.trim()) trozos.push(actual.trim());
    return trozos;
}

const CAMARAS = ["derecha", "quieto", "izquierda", "zoom"];

// La escena de un capítulo de «📜 Historia».
//   capitulo = { id, numero, titulo, parrafos } (ver leyendas.capitulosDeLeyenda), lugar = "torre" | "mazmorra",
//   fondo = la sala de su zona (o la de la primera, en el prólogo), tieneGuardian = si hay un guardián que dibujar.
export function cinematicaDeCapitulo(capitulo, { lugar, fondo, tieneGuardian }, nombre) {
    const zona = tieneGuardian;
    const tomas = [];
    capitulo.parrafos.forEach((parrafo, p) => {
        // En un capítulo de zona: el primer párrafo es la llegada (el guardián espera); el segundo, cómo cae.
        const cae = zona && p === 1;
        const espera = zona && p === 0;
        trozosDe(parrafo).forEach((trozo, t) => {
            const primera = tomas.length === 0;
            const ultimoDelCaido = cae && t === trozosDe(parrafo).length - 1;
            tomas.push({
                fondo,
                actores: zona
                    ? [{ quien: "criatura", x: 32, anim: espera ? "cine-late" : ultimoDelCaido ? "cine-cae" : "cine-late" }, tu(74)]
                    : [aurelio(28, { anim: "cine-flota" }), tu(72)],
                camara: primera ? "arriba" : CAMARAS[tomas.length % CAMARAS.length],
                foco: zona ? "32% 60%" : "50% 60%",
                efecto: ultimoDelCaido ? "destello" : espera && t === 0 ? "oscuro" : null,
                ambiente: lugar === "mazmorra" ? "niebla" : "chispas",
                titulo: primera ? `${capitulo.numero} · ${capitulo.titulo}` : "",
                texto: trozo,
                ms: Math.min(14000, 2800 + trozo.length * 38),
                sonido: primera ? "campana" : ultimoDelCaido ? "victoria" : null,
            });
        });
    });
    return armar("capitulo", tomas, nombre);
}

// Los fondos (pinturas) y las salas que hacen falta para dibujar una cinemática, para preparar las imágenes antes.
export const salasDe = (cinematica) => [...new Set(cinematica.tomas.map((t) => t.fondo).filter((f) => f && !f.startsWith("pintura:")))];
export const actoresDe = (cinematica) => [...new Set(cinematica.tomas.flatMap((t) => t.actores.map((a) => a.quien)))];
