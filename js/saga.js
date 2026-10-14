// saga.js — La Saga de la Llama: el hilo que une todas las historias del juego (v35).
//
// Las historias de la app se escribieron por partes: el pergamino (pergamino.js), las memorias
// de Aurelio (memorias.js), la Crónica del reino (cronica.js) y las leyendas de la Torre y la
// Mazmorra (leyendas.js). Son UNA sola historia contada en desorden:
//
//   Hace siglos      Lía pone la primera piedra de la Torre y enciende la Llama: nacen los Vigías.
//   Hace cien años   Casio, el último Vigía, sube a salvar la Llama y no vuelve. La Llama se apaga.
//                    Su aprendiz, Aurelio, se queda abajo esperando, con el último huevo de dragón.
//   Ahora            Sin la Llama, las Cuatro Sombras se reparten el reino entre veinte señores
//                    (tus jefes). Aurelio te encuentra y te da el huevo. Tú pones tu primera piedra.
//
// La saga le da un OBJETIVO a todo: convertirte en Vigía volviendo a encender la Llama. Son 7 actos
// que se cumplen en orden (como las memorias); el primero que falta es tu objetivo de ahora y se ve
// en Hoy. Nada se guarda: se CALCULA con lo que ya hiciste.
//
// La Llama es el FINAL, y se enciende con la vida real (v36): no prende con antorchas, sino con el
// fuego de los cuatro memoriales de la Ciudadela, que arden cuando caen los 20 señores (tus jefes).
// La Torre está en el Valle del Comienzo, donde empieza el camino (v37): el final es volver a ella.
// Por eso la Torre y la Mazmorra (el arcade) pueden ir por delante, pero no terminan la saga: llegar
// a la cima libera a Casio y abre la Mazmorra; encender la Llama exige terminar el camino del reino.
//
// Texto plano (vistas.js lo escapa). {n} es tu héroe y {m} tu dragón. Sin género para el héroe.

export const TITULO = "La Saga de la Llama";
export const OBJETIVO = "Convertirte en Vigía: volver a encender la Llama de la Torre. No prende con antorchas, sino con el fuego de los cuatro memoriales, que arden cuando liberas el reino de las Cuatro Sombras.";

// Las historias de la app, en el orden en que pasan las cosas.
// abrir = cómo se abre (la acción de app.js y sus datos).
export const HISTORIAS = [
    { id: "pergamino", icono: "📜", titulo: "La primera piedra", cuando: "Hace siglos",
      texto: "Lía levanta la Torre piedra a piedra y enciende la primera Llama. Así nacen los Vigías.",
      abrir: { accion: "pergamino-abrir" } },
    { id: "memorias", icono: "🧙", titulo: "Memorias de Aurelio", cuando: "Hace cien años",
      texto: "Casio, el último Vigía, sube a salvar la Llama y no vuelve. Su aprendiz, Aurelio, se queda esperando abajo.",
      abrir: { accion: "memorias-abrir" } },
    { id: "cronica", icono: "🗺️", titulo: "Crónica del reino", cuando: "Ahora",
      texto: "Sin la Llama, las Cuatro Sombras se reparten el reino entre veinte señores: tus jefes. Aurelio te da el huevo.",
      abrir: { accion: "ir", pantalla: "mapa" } },
    { id: "torre", icono: "🗼", titulo: "La Torre de los Vigías", cuando: "Ahora",
      texto: "Subes la Torre, piso a piso, hasta la cima, donde la Llama apagada espera el fuego del reino.",
      abrir: { accion: "historia-abrir", lugar: "torre" } },
    { id: "mazmorra", icono: "⛓️", titulo: "El Rey Hueco", cuando: "Después",
      texto: "Bajo la Torre está el lugar donde nacen las Sombras, y en el fondo, el primer Vigía que dejó de subir.",
      abrir: { accion: "historia-abrir", lugar: "mazmorra" } },
    { id: "libro", icono: "📖", titulo: "Tu libro", cuando: "Cada día",
      texto: "Tus días, escritos como el capítulo más nuevo de la saga.",
      abrir: { accion: "ir", pantalla: "libro" } },
];

// Los actos. condicion = { tipo, meta }; lee = la historia que sigue a ese acto (id de HISTORIAS
// o "pacto"); cierre = lo que te dice Aurelio cuando lo cumples.
export const ACTOS = [
    {
        id: "piedra", titulo: "La primera piedra",
        relato: "Como Lía hace siglos, {n} empieza con una sola piedra. Nadie la ve todavía. No hace falta.",
        objetivo: "Pon tu primera piedra: cumple tu primera misión.",
        condicion: { tipo: "misiones", meta: 1 }, lee: "pergamino",
        cierre: "Ya pusiste la primera. Lía empezó igual.",
    },
    {
        id: "juramento", titulo: "El juramento",
        relato: "Los Vigías no juraban ante reyes ni ante maestros: juraban ante sí mismos, antes de subir el primer piso. Ese juramento es tu pacto.",
        objetivo: "Haz el juramento de los Vigías: firma tu Tratado de la Voluntad.",
        condicion: { tipo: "pacto", meta: 1 }, lee: "pacto",
        cierre: "Ya juraste. Ahora la palabra hay que cumplirla todos los días.",
    },
    {
        id: "huevo", titulo: "El huevo de Aurelio",
        relato: "Aurelio guardó cien años el último huevo de los dragones de la Torre. No se abre con calor, sino con constancia: ahí dentro espera {m}.",
        objetivo: "Haz que el huevo se abra: cumple 10 misiones.",
        condicion: { tipo: "dragon", meta: 10 }, lee: "memorias",
        cierre: "Casio tenía razón: se abrió con constancia.",
    },
    {
        id: "reino", titulo: "El reino dividido",
        relato: "Cuando la Llama se apagó, las Cuatro Sombras volvieron y se repartieron el reino. Sus primeros señores gobiernan el Valle del Comienzo.",
        objetivo: "Libera el Valle del Comienzo: vence al primer señor de cada Sombra (un jefe de cada atributo).",
        condicion: { tipo: "primeros", meta: 4 }, lee: "cronica",
        cierre: "El valle despierta. Las Sombras ya saben tu nombre.",
    },
    {
        id: "cima", titulo: "La cima de la Torre",
        relato: "En la cima de la Torre, entre los rayos, alguien monta guardia desde hace cien años junto a la Llama apagada. Llegar arriba no la enciende, pero libera a quien la espera.",
        objetivo: "Sube la Torre del héroe hasta la cima: supera el piso 20.",
        condicion: { tipo: "torre", meta: 20 }, lee: "torre",
        cierre: "Llegaste arriba y Casio, por fin, descansa. La Llama sigue fría: no prende con antorchas, sino con lo que vences allá afuera.",
    },
    {
        id: "abismo", titulo: "El Rey Hueco",
        relato: "Al caer el Dragón de la tormenta se abrió una escalera bajo la Torre. Allá abajo nacen las Sombras, y en el fondo espera el primer Vigía que dejó de subir.",
        objetivo: "Baja al fondo de la Mazmorra del Abismo y vence al Rey Hueco: supera el sótano 20.",
        condicion: { tipo: "mazmorra", meta: 20 }, lee: "mazmorra",
        cierre: "Ahora sabes dónde nacen las Sombras y sabes bajar a buscarlas. Solo falta encender la Llama.",
    },
    {
        // El final: se cumple con la vida real (tus jefes), nunca solo con el arcade.
        id: "llama", titulo: "La Llama de los Vigías",
        relato: "La Llama no prende con antorchas. Prende con el fuego de los cuatro memoriales de la Ciudadela, y cada memorial se enciende cuando caen los cinco señores de su Sombra. Es lo único que no se gana en una batalla: se gana cada día.",
        objetivo: "Enciende los cuatro memoriales y lleva su fuego de vuelta a la Torre: vence a los 20 señores (los 5 jefes de cada atributo).",
        condicion: { tipo: "senores", meta: 20 }, lee: "cronica",
        cierre: "La Llama arde otra vez, encendida con tus días. Cien años esperé para ver esto.",
    },
];

// Cuando ya cumpliste los 7 actos: la saga no termina, se mantiene.
export const VIGIA = {
    titulo: "Vigía de la Llama",
    relato: "{n} volvió al Valle del Comienzo con el fuego de los cuatro memoriales, lo subió hasta la cima y la Llama de los Vigías volvió a arder. La saga no termina: como Lía, como Casio, cada día se pone una piedra y la Llama sigue encendida.",
    objetivo: "Mantén la Llama encendida: no falles dos días seguidos.",
};

// Lo que cuenta para cada acto. c = { completadas, pacto, campanas (campana.estadoCampanas), records, torreEnCurso }
export function avanceDe(condicion, c) {
    const derrotados = Object.values(c.campanas || {}).map((x) => x.derrotados || 0);
    const valor = {
        misiones: c.completadas,
        pacto: c.pacto ? 1 : 0,
        dragon: c.completadas,                                         // el dragón crece con todas tus misiones
        primeros: derrotados.filter((n) => n >= 1).length,             // un señor caído en cada Sombra
        senores: derrotados.reduce((suma, n) => suma + Math.min(5, n), 0),
        torre: Math.max(c.records?.torre || 0, c.torreEnCurso || 0),
        mazmorra: c.records?.mazmorra || 0,
    }[condicion.tipo] || 0;
    return Math.min(condicion.meta, valor);
}

// Los datos que necesita la saga, sacados de la partida.
// campanas = campana.estadoCampanas(estado) (se pide aparte para no calcularlo dos veces).
export function datosDeSaga(estado, campanas) {
    const torre = estado.arcade?.torre;
    return {
        completadas: estado.completadas.length,
        pacto: Boolean(estado.pacto?.firma),
        campanas,
        records: estado.arcade?.records || {},
        torreEnCurso: torre ? torre.piso - 1 : 0,
    };
}

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII"];

// Cómo va tu saga. Los actos se cumplen EN ORDEN: el primero que falta es el de ahora.
// Devuelve { actos: [{ ...acto, numero, avance, hecho, actual, listo }], indice (el de ahora, o 7 si terminaste),
//            completada, objetivo, avance, meta }
// listo = su meta ya se cumplió aunque todavía no le toca (por ejemplo, la Torre subida antes de liberar
// el valle): se cuenta cuando llegues a ese acto.

export function estadoDeSaga(datos) {
    const avances = ACTOS.map((a) => avanceDe(a.condicion, datos));
    let indice = ACTOS.findIndex((a, i) => avances[i] < a.condicion.meta);
    if (indice === -1) indice = ACTOS.length;
    const actos = ACTOS.map((a, i) => ({
        ...a, numero: ROMANOS[i], avance: avances[i],
        hecho: i < indice, actual: i === indice, listo: avances[i] >= a.condicion.meta,
    }));
    const actual = actos[indice];
    return {
        actos,
        indice,
        completada: indice === ACTOS.length,
        objetivo: actual ? actual.objetivo : VIGIA.objetivo,
        avance: actual ? actual.avance : 1,
        meta: actual ? actual.condicion.meta : 1,
    };
}

// El texto con el nombre de tu héroe y de tu dragón.
export function conNombres(texto, nombres) {
    return texto.replaceAll("{n}", nombres.heroe).replaceAll("{m}", nombres.dragon);
}
