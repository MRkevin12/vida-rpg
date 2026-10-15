// cinematicas.js — Las cinemáticas de la Torre y la Mazmorra (v43): qué se ve y qué se dice.
//
// Una cinemática es una escena animada y corta, con la sala de fondo, las criaturas y tu héroe, movimientos de
// cámara, destellos y una línea de texto por toma. Salen en cuatro momentos (el que toca lo anota torre.js en
// `partida.cine`, y app.js la reproduce con cine.js):
//   "zona"    al entrar a la zona siguiente (un título con su nombre).
//   "entrada" al llegar al piso de un guardián, antes de pelear.
//   "derrota" cuando el guardián cae.
//   "final"   cuando cae el último guardián (el Apagador en la Torre, el Rey Hueco en la Mazmorra).
// Se pueden saltar siempre (y apagar en Ajustes). Este archivo solo arma los datos: no dibuja nada.
//
// Una toma: { fondo (id de la zona), actores: [{ quien: "criatura" | "heroe", x (% desde la izquierda), anim }],
//             camara ("arriba" | "zoom" | "izquierda" | "derecha" | "quieto"), foco (hacia dónde se acerca el zoom),
//             efecto ("destello" | "oscuro" | "temblor" | null), titulo, texto, ms (lo que dura), sonido }
// ({n} en los textos es el nombre de tu héroe; cine.js lo escribe como texto, nunca como HTML.)
//
// Ojo con la historia: la Llama de los Vigías solo arde al final de la saga (ver saga.js). Ninguna cinemática
// puede decir que ya arde (hay una prueba).

import { CRIATURAS, lugarDe, zonaDelPiso } from "./bestiario.js";
import { CINE_NUEVAS } from "./mazmorras.js";

export const TIPOS = ["zona", "entrada", "derrota", "final"];

// Dónde está cada uno en la escena (en % del ancho): la criatura a la izquierda, tu héroe a la derecha.
const X_CRIATURA = 32;
const X_HEROE = 78;

// La línea con que empieza el encuentro con el guardián de cada zona.
const ENTRADA = {
    cripta: "Al final de la cripta hay una puerta cerrada. Alguien la guarda desde hace siglos.",
    biblioteca: "Las páginas dejan de crujir. Entre los estantes, alguien levanta la vista.",
    fragua: "El suelo vibra. En el yunque más grande, algo enorme sigue forjando.",
    cima: "El viento calla un instante. Los rayos se juntan sobre una sola figura.",
    nubes: "El puente se estrecha hasta ser un solo paso. Al otro lado espera algo más grande que el cielo.",
    corona: "Aquí no llega el viento. Una campana de hierro suena una vez, sin eco.",
    cisterna: "El agua negra deja de moverse. Todo lo que respira, contiene el aliento.",
    raices: "Las raíces se apartan como cortinas. Algo muy viejo abre los ojos.",
    santuario: "Las velas negras se encienden solas, una a una, hasta formar un camino.",
    abismo: "La oscuridad late más fuerte. Desde el trono, algo hueco se pone de pie.",
};

// Cómo cae el guardián de cada zona (el último de cada lugar tiene su cinemática final aparte).
const DERROTA = {
    cripta: "El yelmo rueda por el suelo. Dentro no había nadie.",
    biblioteca: "El último libro se cierra solo.",
    fragua: "El fuego se apaga como un aliento. Queda el yunque, frío.",
    cima: "La tormenta se abre. Por primera vez en cien años, se ve el cielo.",
    nubes: "El coloso se deshace en lluvia, y el puente guarda silencio.",
    corona: "El Apagador cae sin hacer ruido.",
    cisterna: "El agua baja de golpe, como si alguien hubiera quitado un tapón.",
    raices: "El árbol se parte en dos. Por dentro estaba vacío.",
    santuario: "El espejo se rompe sin ruido. En cada pedazo, {n} sigue de pie.",
    abismo: "El Rey Hueco cae.",
};

// El subtítulo del cartel de cada zona nueva.
const SUBTITULO = {
    cripta: "Donde descansan los Vigías",
    biblioteca: "Lo que los Vigías supieron",
    fragua: "Donde se forjó la Torre",
    cima: "Sin techo ni muros",
    nubes: "Puentes sobre la tormenta",
    corona: "Un pedestal apagado",
    cisterna: "Los cimientos inundados",
    raices: "Un bosque al revés",
    santuario: "Rezos a las Sombras",
    abismo: "El fondo",
};

// (v64) Lo de las mazmorras nuevas se suma a lo de siempre.
Object.assign(ENTRADA, CINE_NUEVAS.ENTRADA);
Object.assign(DERROTA, CINE_NUEVAS.DERROTA);
Object.assign(SUBTITULO, CINE_NUEVAS.SUBTITULO);

const conNombre = (texto, nombre) => texto.replaceAll("{n}", nombre);

// El título de un guardián: «el Caballero sin Nombre, guardián» (con su género).
const guardianDe = (criatura) => `${criatura.nombre} · ${criatura.genero === "f" ? "guardiana" : "guardián"}`;

// La cinemática de ese momento: { tipo, tomas } o null si no hay. partida = la de la Torre o la Mazmorra
// (su criatura, su piso y su lugar); nombre = el de tu héroe.
export function cinematicaDe(tipo, partida, nombre) {
    const sitio = lugarDe(partida.lugar);
    const zona = zonaDelPiso(partida.piso, partida.lugar);
    const criatura = CRIATURAS[partida.enemigo?.id];
    if (!TIPOS.includes(tipo) || !zona || !criatura) return null;
    const fondo = zona.id;
    const el = { quien: "criatura", x: X_CRIATURA };
    const tu = { quien: "heroe", x: X_HEROE };
    const foco = `${X_CRIATURA}% 62%`;   // hacia dónde se acerca la cámara: la criatura
    let tomas = [];

    if (tipo === "zona") {
        tomas = [
            { fondo, actores: [{ quien: "heroe", x: 50, anim: "cine-camina" }], camara: "arriba", titulo: zona.nombre,
              texto: SUBTITULO[fondo] || "", ms: 3400, sonido: "campana" },
        ];
    } else if (tipo === "entrada") {
        tomas = [
            { fondo, actores: [el], camara: "arriba", efecto: "oscuro", texto: ENTRADA[fondo] || "", ms: 3200, sonido: "retumbo" },
            { fondo, actores: [{ ...el, anim: "cine-late" }], camara: "zoom", foco, efecto: "destello", titulo: guardianDe(criatura),
              texto: `${sitio.piso} ${partida.piso} · ${zona.nombre}`, ms: 2800, sonido: "campana" },
            { fondo, actores: [el, tu], camara: "quieto", texto: `{n} respira hondo y da un paso al frente.`, ms: 2400, sonido: "cursor" },
        ];
    } else if (tipo === "derrota") {
        tomas = [
            { fondo, actores: [{ ...el, anim: "cine-cae" }], camara: "zoom", foco, efecto: "destello", texto: DERROTA[fondo] || "",
              ms: 3000, sonido: "victoria" },
            { fondo, actores: [{ ...tu, x: 56 }], camara: "izquierda", texto: `{n} baja el arma. El camino sigue.`, ms: 2400 },
        ];
    } else if (CINE_NUEVAS.FINAL[partida.lugar]) {
        // (v64) El final de las minas y del laberinto: cuatro tomas con sus textos.
        const [a, b, c, d] = CINE_NUEVAS.FINAL[partida.lugar];
        tomas = [
            { fondo, actores: [{ ...el, anim: "cine-late" }], camara: "arriba", efecto: "oscuro", texto: a, ms: 3600, sonido: "retumbo" },
            { fondo, actores: [{ ...el, anim: "cine-late" }], camara: "zoom", foco, efecto: "temblor", texto: b, ms: 3600, sonido: "campana" },
            { fondo, actores: [{ ...el, anim: "cine-cae" }], camara: "zoom", foco, efecto: "destello", texto: c, ms: 3400, sonido: "victoria" },
            { fondo, actores: [{ ...tu, x: 56 }], camara: "izquierda", titulo: lugarDe(partida.lugar).nombre, texto: d, ms: 3600, sonido: "campana" },
        ];
    } else if (partida.lugar === "mazmorra") {
        // El final de la Mazmorra: el Rey Hueco, el primer Vigía que dejó de subir.
        tomas = [
            { fondo, actores: [{ ...el, anim: "cine-late" }], camara: "arriba", efecto: "oscuro",
              texto: "El Rey Hueco fue el primer Vigía que dejó de subir.", ms: 3400, sonido: "retumbo" },
            { fondo, actores: [{ ...el, anim: "cine-cae" }], camara: "zoom", foco, efecto: "destello",
              texto: "Su corona rueda por el suelo.", ms: 3000, sonido: "victoria" },
            { fondo, actores: [{ ...tu, x: 56 }], camara: "quieto", efecto: "oscuro",
              texto: "La oscuridad, por un momento, se calla.", ms: 3000 },
            { fondo, actores: [{ ...tu, x: 56 }], camara: "izquierda", titulo: "Saber bajar",
              texto: "{n} sube con la corona hueca en la mano.", ms: 3200, sonido: "campana" },
        ];
    } else {
        // El final de la Torre: la Corona, el Apagador y el pedestal frío. La Llama NO prende todavía.
        tomas = [
            { fondo, actores: [{ ...el, anim: "cine-late" }], camara: "arriba", efecto: "oscuro",
              texto: "La Corona de la Llama. Cien años sin luz.", ms: 3400, sonido: "retumbo" },
            { fondo, actores: [{ ...el, anim: "cine-late" }], camara: "zoom", foco, efecto: "temblor",
              texto: "El Apagador levanta su campana de hierro… y no alcanza a tocarla.", ms: 3200, sonido: "campana" },
            { fondo, actores: [{ ...el, anim: "cine-cae" }], camara: "zoom", foco, efecto: "destello",
              texto: "Cae sin hacer ruido, como cayó la Llama hace cien años.", ms: 3400 },
            { fondo, actores: [{ ...tu, x: 56 }], camara: "derecha", efecto: "oscuro",
              texto: "{n} acerca la antorcha al pedestal. La Llama no prende.", ms: 3400, sonido: "cursor" },
            { fondo, actores: [{ ...tu, x: 56 }], camara: "quieto",
              texto: "En la piedra, una inscripción: «Solo arde con el fuego de las Sombras vencidas».", ms: 4200, sonido: "campana" },
            { fondo, actores: [], camara: "arriba", titulo: "La Corona",
              texto: "Lo que falta no se hace aquí arriba, sino allá afuera.", ms: 3800 },
        ];
    }
    return {
        tipo,
        tomas: tomas.map((t) => ({
            efecto: null, titulo: "", sonido: null, foco: "50% 60%", ...t,
            texto: conNombre(t.texto || "", nombre),
            titulo: conNombre(t.titulo || "", nombre),
        })),
    };
}

// Cuánto dura una cinemática, en milisegundos.
export const duracion = (cinematica) => cinematica.tomas.reduce((suma, t) => suma + t.ms, 0);

// Los fondos y las criaturas que hacen falta para dibujarla (para preparar las imágenes antes).
export const fondosDe = (cinematica) => [...new Set(cinematica.tomas.map((t) => t.fondo))];
