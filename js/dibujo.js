// dibujo.js — Arma el dibujo del avatar juntando todas sus partes.
//
// El avatar es un SVG que se pinta por CAPAS, de atrás hacia adelante
// (lo último queda encima): fondo → capa → piernas → torso → brazos → cabeza.
// Cada parte vive en su propio archivo:
//   dibujo-base.js     colores, materiales y formas que se repiten
//   dibujo-cuerpo.js   medidas del cuerpo, cara y pelo
//   dibujo-ropa.js     la ropa y la armadura de cada etapa
//   dibujo-objetos.js  sombreros, armaduras de pecho, armas, capas, escudo y alas
//   dibujo-escenas.js  fondos, efectos de luz y escenarios de batalla
//   dibujo-mascota.js  el dragón
//
// Las clases CSS (pj, capa, brazo-arma, ojos, llama, orbe…) son las que se animan
// en estilos.css. Aquí solo se dibuja; nada se mueve desde JavaScript.

import { APARIENCIA, APARIENCIA_INICIAL, CLASES, OBJETOS } from "./avatar.js";
import { nuevoId, mate, metal, piel as materialPiel, tejido, grano, halo, aclarar, oscurecer, mezclar, pivote, SOMBRA } from "./dibujo-base.js";
import { esqueleto, cuello, cara, lentes, barba, pelo } from "./dibujo-cuerpo.js";
import { piernas, torso, bufanda, brazo, hombreras } from "./dibujo-ropa.js";
import { sombrero, arma, capa, capaCuervo, escudo, alas, alasDragon, armaduraDePecho, libro, miniatura, INCLINACION, TAPA_PELO, baseDe, conVariante, CAPAS_COLOR } from "./dibujo-objetos.js";
import { piernasDesnudas, torsoDesnudo, brazoDesnudo, calzoncillos, escenaDeGimnasio } from "./dibujo-gym.js";
import { fondo, ambiente, aura, llamas, resplandor, noche, escenario } from "./dibujo-escenas.js";
import { cuerpoMascota, dibujarMascota } from "./dibujo-mascota.js";

export { dibujarMascota };

const ETAPAS = ["novato", "aventurero", "heroe", "leyenda"];
// La cabeza va un poco más grande que la real para que la cara se distinga en pequeño
// (1,12: lo justo; más se ve de caricatura).
const ESCALA_CABEZA = 1.12;


// ===== La paleta =====
// Reúne los colores de ESTE avatar (piel, pelo, traje, metal…) y crea un "material"
// (degradado) para cada uno. Las partes piden un material con p.m("tela"), p.m("acero")…
function crearPaleta(d) {
    const id = nuevoId("av");
    const ap = d.apariencia;
    const etapa = Math.max(0, ETAPAS.indexOf(d.etapa.clave));
    const piel = APARIENCIA.piel[ap.piel] || APARIENCIA.piel.media;
    const pelo = (APARIENCIA.pelo[ap.pelo] || APARIENCIA.pelo.castano).color;
    const ojos = (APARIENCIA.ojos[ap.ojos] || APARIENCIA.ojos.cafe).color;

    // El traje es del color de tu clase, salvo que elijas otro en "Apariencia".
    const elegido = (APARIENCIA.traje[ap.traje] || {}).color;
    const traje = elegido || d.clase.oscuro;
    // El novato viste lino sin teñir (con un toque del color elegido, si hay).
    const tela = etapa === 0 ? (elegido ? mezclar("#a8946c", elegido, 0.35) : "#a8946c") : traje;
    const acero = etapa === 3 ? "#66718f" : "#a9b3c4";   // la leyenda lleva acero oscuro, azulado
    // (v100) Pantalones y botas que llevas puestos (su "aspecto", ver avatar.js).
    const ropaPiernas = OBJETOS[d.equipado?.piernas]?.aspecto || null;
    const ropaPies = OBJETOS[d.equipado?.pies]?.aspecto || null;

    const colores = {
        piel: materialPiel(`${id}-piel`, piel.color),
        pelo: mate(`${id}-pelo`, pelo, 0.3, 0.45),
        tela: mate(`${id}-tela`, tela, 0.2, 0.48),
        lino: mate(`${id}-lino`, "#d9cfb8", 0.2, 0.4),
        pantalon: mate(`${id}-pantalon`, ropaPiernas?.tela || (etapa === 0 ? "#5c4a3a" : "#2e2a3a"), 0.14, 0.5),
        cuero: mate(`${id}-cuero`, "#6a4528", 0.25, 0.5),
        bota: mate(`${id}-bota`, ropaPies?.tipo === "cuero" ? ropaPies.color : (etapa === 0 ? "#5a3f28" : "#3a2a1e"), 0.2, 0.5),
        // (v100) El metal de unas botas de metal y el de las placas de unos pantalones.
        "bota-metal": metal(`${id}-bota-metal`, ropaPies?.tipo === "metal" ? ropaPies.color : acero),
        "placa-pierna": metal(`${id}-placa-pierna`, ropaPiernas?.placas || acero),
        acero: metal(`${id}-acero`, acero),
        oro: metal(`${id}-oro`, "#e3b53c"),
        bufanda: mate(`${id}-bufanda`, elegido ? aclarar(elegido, 0.12) : mezclar(d.clase.color, d.clase.oscuro, 0.4), 0.25, 0.45),
        gema: mate(`${id}-gema`, d.clase.color, 0.55, 0.4),
        "gema-luz": halo(`${id}-gema-luz`, d.clase.color, 0.7),
        suelo: halo(`${id}-suelo`, "#000000", 0.6, 0.6),
        ao: halo(`${id}-ao`, SOMBRA, 0.55, 0.45),     // sombra suave de contacto ("oclusión")
        tejido: tejido(`${id}-tejido`),
        grano: grano(`${id}-grano`),
    };

    return {
        id,
        etapa,
        defs: Object.values(colores).join(""),
        m: (nombre) => `url(#${id}-${nombre})`,
        // Colores "planos" (sin degradado), para líneas y detalles pequeños.
        piel: piel.color,
        pielSombra: piel.sombra,
        pelo,
        peloLuz: aclarar(pelo, 0.42),
        ojos,
        borde: d.clase.color,
        capa: oscurecer(traje, 0.22),
        cueroClaro: "#9a7248",
        oroPlano: "#e3b53c",
        oroClaro: "#f8e08e",
        oroOscuro: "#8a6212",
        ropaPiernas,   // (v100) ver dibujo-ropa.js › piernas y bota
        ropaPies,
    };
}


// ===== El avatar =====
// d = resultado de describirAvatar() (ver avatar.js)
// mini = true: solo cabeza y hombros, para la cabecera de la app
// batalla = true: sin fondo ni mascota, para pelear contra un jefe
// sinEfectos = true: además sin aura, fuego ni brillo (para los minijuegos)
// capa (v93) = solo una parte del dibujo completo, para armar el retrato en pixel art por capas (retratos.js):
//   "fondo"   el paisaje (sin nada que se mueva)
//   "detras"  lo que va entre el paisaje y el héroe: partículas, aura, llamas y resplandor (se anima)
//   "figura"  el héroe, su sombra en el suelo y la mascota
//   "encima"  lo que oscurece la escena entera (cansado, dormido, caído)
//   "todo"    todo junto (lo de siempre)
export function dibujarAvatar(d, { mini = false, batalla = false, sinEfectos = false, capa: parte = "todo" } = {}) {
    // (v100) "puesto" = los objetos de verdad (con sus variantes); en "d" quedan los de base, que son los que se dibujan.
    const puesto = { ...(d.equipado || {}) };
    const fondoPuesto = OBJETOS[puesto.fondo]?.pintura || puesto.fondo;
    d = {
        ...d,
        apariencia: { ...APARIENCIA_INICIAL, ...d.apariencia },
        equipado: { ...puesto, cabeza: baseDe(puesto.cabeza), pecho: baseDe(puesto.pecho), mano: baseDe(puesto.mano), fondo: fondoPuesto },
    };
    const p = crearPaleta(d);
    const e = esqueleto(d);
    const dormido = d.animo === "dormido";
    const caido = d.animo === "caido";   // sin vida: cabeza baja y la escena se apaga

    // --- Pelo y sombrero: si el sombrero tapa la cabeza, se recorta el pelo de arriba ---
    const cabello = pelo(d, p);
    const corte = TAPA_PELO[d.equipado.cabeza];
    const recorte = corte ? `<clipPath id="${p.id}-corte"><rect x="60" y="${corte}" width="80" height="120"/></clipPath>` : "";
    const recortar = (capaPelo) => (corte && capaPelo ? `<g clip-path="url(#${p.id}-corte)">${capaPelo}</g>` : capaPelo);
    // La cabeza se dibuja un poco más grande que en la vida real: así la cara se distingue
    // aunque el avatar se vea pequeño. Dormido (o caído), además, cae hacia adelante.
    const giro = ` transform="${dormido || caido ? "rotate(9 100 58) " : ""}translate(100 58.5) scale(${ESCALA_CABEZA}) translate(-100 -58.5)"`;

    // --- Espalda: alas, capa comprada, escudo o la capa del héroe ---
    let espalda = "";
    const capaPuesta = CAPAS_COLOR[d.equipado.espalda];   // (v100) todas las capas de color
    if (d.equipado.espalda === "alas") espalda = alas(p);
    else if (d.equipado.espalda === "alas-dragon") espalda = alasDragon(p);
    else if (capaPuesta) espalda = pivote(100, 62, "capa", capa(e, p, capaPuesta.color, capaPuesta.oro));
    else if (d.equipado.espalda === "capa-cuervo") espalda = pivote(100, 62, "capa", capaCuervo(e, p));
    else if (d.equipado.espalda === "escudo") espalda = escudo(p);
    else if (p.etapa >= 2) espalda = pivote(100, 62, "capa", capa(e, p, p.capa, p.etapa === 3));

    // --- Brazo derecho: sostiene el arma. Va en un pivote en el hombro para poder atacar ---
    const armaId = d.equipado.mano;
    const [mx, my] = e.der.mano;
    const enMano = armaId
        ? `<g transform="translate(${mx} ${my})"><g class="arma-giro"><g transform="rotate(${INCLINACION[armaId]})">${conVariante(puesto.mano, p, arma(armaId, p))}</g></g></g>`
        : "";
    // El brazo va detrás del torso y la mano con el arma delante; los dos pivotes giran igual.
    const derecho = brazo("der", d, e, p, enMano, Boolean(armaId));
    const brazoDerecho = pivote(...e.der.hombro, "brazo-arma", derecho.atras);
    const manoDerecha = pivote(...e.der.hombro, "brazo-arma", derecho.frente);
    // La "estela" es el arco de luz que deja el golpe (solo se ve mientras ataca).
    const estela = sinEfectos || mini
        ? ""
        : `<g transform="translate(136 98)"><g class="estela" opacity="0">
               <path transform="translate(-136 -98)" d="M126 43 A56 56 0 0 1 188 117 A82 82 0 0 0 126 43 Z" fill="${aclarar(d.clase.color, 0.55)}"/></g></g>`;

    // --- Brazo izquierdo: con Intelecto 6+ lleva el libro de hechizos ---
    const izquierdo = brazo("izq", d, e, p, d.rasgos.intelecto >= 2 ? libro(e.izq.mano, p) : "");

    // El retrato pequeño lleva un fondo liso: a ese tamaño el paisaje no se distingue.
    const capaFondo = [
        batalla ? "" : mini ? `<rect x="60" width="80" height="80" fill="${oscurecer(d.clase.oscuro, 0.5)}"/><circle cx="100" cy="40" r="36" fill="${p.m("gema-luz")}"/>` : fondo(d, p),
    ];
    const capaDetras = [
        // El aire del fondo: partículas que flotan y rayos de luz (solo en el dibujo completo).
        batalla || mini ? "" : ambiente(d, p),
        p.etapa === 3 && !sinEfectos ? aura(p) : "",
        d.animo === "llamas" && !sinEfectos ? llamas(p) : "",
        d.animo === "feliz" && !sinEfectos ? resplandor(p) : "",
    ];
    const capaFigura = [
        // Sombra en el suelo: una amplia y suave, y otra más oscura justo bajo los pies.
        mini ? "" : `<ellipse cx="100" cy="183.4" rx="34" ry="6" fill="${p.m("suelo")}"/>
                     <ellipse cx="101" cy="181.8" rx="19" ry="2.6" fill="${p.m("ao")}"/>`,
        '<g class="pj">',
        espalda,
        mini ? "" : piernas(d, e, p),
        '<g class="pj-torso">',
        `<g${giro}>${recortar(cabello.atras)}</g>`,
        izquierdo.atras,
        brazoDerecho,
        cuello(e, p),
        torso(d, e, p),
        // La armadura de pecho (v34) va encima de la ropa de la etapa.
        d.equipado.pecho ? conVariante(puesto.pecho, p, armaduraDePecho(d.equipado.pecho, e, p)) : "",
        // La cabeza le hace sombra al pecho (la luz viene de arriba).
        `<ellipse cx="101" cy="62.6" rx="${e.fem ? 8 : 9.5}" ry="3.6" fill="${p.m("ao")}"/>`,
        izquierdo.frente,
        manoDerecha,
        bufanda(d, e, p),
        hombreras(d, e, p),
        `<g${giro}>${cara(d, e, p)}${barba(d, p)}${recortar(cabello.frente)}${d.rasgos.intelecto >= 1 ? lentes(p) : ""}${conVariante(puesto.cabeza, p, sombrero(d.equipado.cabeza, p))}</g>`,
        "</g>",
        estela,
        "</g>",
    ];
    const capaEncima = [
        // Cansado, dormido o caído: la escena se oscurece.
        dormido && !batalla ? noche() : "",
        d.animo === "cansado" && !batalla ? '<rect width="200" height="200" fill="#0b0816" opacity=".3"/>' : "",
        caido && !batalla ? '<rect width="200" height="200" fill="#0b0816" opacity=".5"/>' : "",
    ];
    const mascota = mini || batalla ? "" : `<g transform="translate(160 165)">${cuerpoMascota(d.mascota)}</g>`;
    const partes = {
        todo: [...capaFondo, ...capaDetras, ...capaFigura, ...capaEncima, mascota],
        fondo: capaFondo,
        detras: capaDetras,
        figura: [...capaFigura, mascota],
        encima: capaEncima,
    };
    const capas = [`<defs>${p.defs}${recorte}</defs>`, ...(partes[parte] || partes.todo)];

    // El encuadre completo recorta un poco los bordes para que la figura se vea más grande.
    const vista = mini ? "75 11 50 50" : batalla ? "32.5 6 135 180" : "6 2 188 188";
    return `<svg class="avatar-svg animo-${d.animo}${mini ? " avatar-mini" : ""}" viewBox="${vista}" role="img"
                 aria-label="Avatar: ${d.clase.nombre} ${d.etapa.nombre}" xmlns="http://www.w3.org/2000/svg">${capas.join("")}</svg>`;
}


// ===== (v74) El avatar sin ropa de la pestaña del gimnasio =====
// d = describirAvatar() con `corpulencia` (de tu IMC) añadida. Sale en calzoncillos para ver el avance del cuerpo:
// el nivel de gym (d.fisico, 0 a 5) marca los músculos y el peso cambia la cintura y las piernas (ver dibujo-gym.js).
export function dibujarAvatarGym(d) {
    d = {
        ...d, animo: "normal", apariencia: { ...APARIENCIA_INICIAL, ...d.apariencia },
        equipado: { cabeza: null, pecho: null, mano: null, espalda: null, fondo: null },
        rasgos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 },
    };
    const p = crearPaleta(d);
    const e = esqueleto(d);
    const cabello = pelo(d, p);
    const giro = ` transform="translate(100 58.5) scale(${ESCALA_CABEZA}) translate(-100 -58.5)"`;
    const izquierdo = brazoDesnudo("izq", d, e, p);
    const derecho = brazoDesnudo("der", d, e, p);
    const capas = [
        `<defs>${p.defs}</defs>`,
        escenaDeGimnasio(p.id),
        `<ellipse cx="100" cy="183.4" rx="36" ry="6" fill="${p.m("suelo")}"/><ellipse cx="101" cy="181.8" rx="20" ry="2.6" fill="${p.m("ao")}"/>`,
        '<g class="pj">',
        piernasDesnudas(d, e, p),
        '<g class="pj-torso">',
        `<g${giro}>${cabello.atras}</g>`,
        izquierdo.atras,
        derecho.atras,
        cuello(e, p),
        torsoDesnudo(d, e, p),
        calzoncillos(e),
        `<ellipse cx="101" cy="62.6" rx="${e.fem ? 8 : 9.5}" ry="3.6" fill="${p.m("ao")}"/>`,
        izquierdo.frente,
        derecho.frente,
        `<g${giro}>${cara(d, e, p)}${barba(d, p)}${cabello.frente}</g>`,
        "</g>",
        "</g>",
    ];
    // El encuadre recorta la sala para que el cuerpo se vea grande.
    return `<svg class="avatar-svg avatar-gym" viewBox="22 10 156 180" role="img" aria-label="Tu cuerpo: nivel de físico ${d.fisico || 0}"
                 xmlns="http://www.w3.org/2000/svg">${capas.join("")}</svg>`;
}


// ===== Miniaturas de los objetos (tienda e inventario) =====

// Un avatar "de muestra" para tener una paleta con qué pintar el objeto suelto.
const MUESTRA = {
    etapa: { clave: "heroe" }, clave: "aprendiz", clase: CLASES.aprendiz, animo: "normal",
    rasgos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 },
    equipado: { cabeza: null, pecho: null, piernas: null, pies: null, mano: null, espalda: null, fondo: null },
    apariencia: APARIENCIA_INICIAL,
};

export function dibujarObjeto(id) {
    const objeto = OBJETOS[id];
    if (!objeto) return "";
    const p = crearPaleta(MUESTRA);
    const abrir = (vista) => `<svg class="objeto-svg" viewBox="${vista}" role="img" aria-label="${objeto.nombre}" xmlns="http://www.w3.org/2000/svg">`;

    if (objeto.espacio === "fondo") {
        return `${abrir("0 0 200 200")}${fondo({ ...MUESTRA, equipado: { fondo: objeto.pintura || id }, clase: CLASES.carisma }, p)}</svg>`;
    }
    // (v100) Pantalones y botas: unas piernas de muestra con la prenda puesta, encuadradas.
    if (objeto.espacio === "piernas" || objeto.espacio === "pies") {
        const conPrenda = { ...MUESTRA, equipado: { ...MUESTRA.equipado, [objeto.espacio]: id } };
        const pp = crearPaleta(conPrenda);
        const vista = objeto.espacio === "piernas" ? "72 104 56 80" : "74 154 52 32";
        return `${abrir(vista)}<defs>${pp.defs}</defs>${piernas(conPrenda, esqueleto(conPrenda), pp)}</svg>`;
    }
    const mini = miniatura(id, p, esqueleto(MUESTRA));
    return mini ? `${abrir(mini.vista)}<defs>${p.defs}</defs>${mini.dibujo}</svg>` : "";
}


// ===== Escenario de batalla de una campaña =====
export function dibujarEscenario(categoria) {
    return escenario(categoria, nuevoId("es"));
}
