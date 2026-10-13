// cronica.js — La Crónica del Reino: la historia que une el mapa, los jefes, la Torre y tu mascota (v26).
//
// La historia en pocas palabras: el reino de tu héroe estaba en orden hasta que llegaron
// las Cuatro Sombras (la del Cuerpo, la Mente, la Voz y el Tesoro) y lo repartieron entre
// veinte señores: tus jefes de Aventuras (la Pereza, la Parálisis, el Ego, las Deudas…).
// El Maestro Aurelio te dio un huevo (tu dragón) y una advertencia: a esos señores se les
// vence con lo que haces cada día. Recorres el mapa región por región, cada una gobernada
// por cuatro señores, hasta la Ciudadela del Carácter, donde se alza la Torre.
//
// Cada región es un capítulo. Se lee al llegar a ella, y se completa a medida que caen sus
// señores (con un párrafo para cada uno) y cuando queda libre.
//
// Como libro.js, todo es TEXTO PLANO: vistas.js lo escapa al mostrarlo. {n} es el nombre de
// tu héroe y {m} el de tu dragón. Sin género gramatical para el héroe (se usa su nombre).

import { CAMPANAS } from "./campana.js";
import { ATRIBUTOS } from "./juego.js";
import * as mapa from "./mapa.js";

export const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const PROLOGO = {
    titulo: "El reino dividido",
    parrafos: [
        "Hubo un tiempo en que el reino de {n} se gobernaba solo. El cuerpo descansaba lo justo, la mente aprendía, la voz se atrevía y el tesoro crecía despacio, como crecen las cosas que duran.",
        "Entonces llegaron las Cuatro Sombras —la del Cuerpo, la de la Mente, la de la Voz y la del Tesoro— y repartieron el reino entre veinte señores. Ninguno empuñó una espada: cada uno es una costumbre con nombre. La Pereza, la Parálisis, el Ego, las Deudas… Se alimentan de cada «mañana» y de cada «no tengo tiempo».",
        "El Maestro Aurelio encontró a {n} en el Valle del Comienzo. No le dio un arma. Le dio un huevo tibio y una advertencia: «A estos señores no se los vence en una batalla. Se los vence con lo que haces cada día. Cada misión cumplida es un golpe; cada paso, un palmo de tierra recuperada». De ese huevo nació {m}.",
        "Al final del camino, en la Ciudadela del Carácter, se alza la Torre. Sus puertas nunca se cierran y nadie sabe cuántos pisos tiene. Los que la suben vuelven distintos. Los que liberan el reino, dicen, por fin la ven desde arriba.",
    ],
};

// Un capítulo por región: lo que encuentras al llegar y lo que pasa cuando queda libre.
const CAPITULOS = [
    {
        llegada: "El valle es verde y engañoso: aquí todo invita a quedarse. Las casas tienen las ventanas cerradas hasta tarde y los caminos se borran de tanto no usarlos. En sus cuatro rincones viven los primeros señores, los más pequeños y los más difíciles de ver, porque se parecen al descanso.",
        libre: "El valle despierta. Las ventanas se abren temprano y el camino vuelve a marcarse con pisadas. {n} sigue hacia el norte, donde los árboles empiezan a cerrarse.",
    },
    {
        llegada: "En el bosque los senderos se parecen entre sí. Se camina mucho y se avanza poco, y entre los troncos se oyen voces que preguntan para qué. Aquí la duda no grita: susurra. Por eso es tan fácil obedecerla.",
        libre: "La niebla del bosque se levanta. Los senderos que daban vueltas ahora llevan a alguna parte. {n} ya no pregunta para qué: lo sabe.",
    },
    {
        llegada: "Las montañas no se suben de un salto. Cada paso cuesta lo mismo que el anterior, y el viento enseña lo que ningún maestro puede: que la cima se alcanza sin ganas muchos días. Arriba, los señores esperan que {n} se canse antes de llegar.",
        libre: "Desde la cumbre se ve todo lo recorrido. {n} entiende que no subió por fuerza, sino por costumbre. El descenso lleva al desierto.",
    },
    {
        llegada: "En el desierto no pasa nada, y eso es lo difícil. Los días se parecen, el horizonte no se acerca y los espejismos ofrecen atajos. Aquí gana quien sigue caminando cuando nadie mira y nada cambia.",
        libre: "Los espejismos se desvanecen y el desierto muestra su secreto: los oasis estaban en el camino, no fuera de él. {n} llega a la costa.",
    },
    {
        llegada: "El mar no se cruza: se espera. Las mareas tienen su propio tiempo y no se apuran por nadie. En sus islas viven los señores más antiguos, los que gobernaban el reino desde mucho antes de que {n} naciera.",
        libre: "El mar se calma. Por primera vez las islas están en paz, y el horizonte muestra lo que siempre estuvo ahí: la Ciudadela y, sobre ella, la Torre.",
    },
    {
        llegada: "La Ciudadela no tiene señores: la construyen quienes los vencieron. En su plaza hay cuatro memoriales apagados, uno por cada Sombra, que se encienden cuando sus cinco señores han caído. En el centro, la Torre.",
        libre: "Los cuatro memoriales arden. El reino de {n} vuelve a gobernarse solo. Desde lo alto de la Torre, el Maestro Aurelio mira el camino recorrido y no dice nada: no hace falta. Pero en el horizonte, muy lejos, algo se mueve. Las Sombras nunca se van del todo.",
    },
];

// Al volver a empezar (Partida+): «II», «III»…
const REGRESO = "Las Sombras volvieron, más fuertes, como vuelven las costumbres que uno cree vencidas. El camino es el mismo; {n}, no.";

// Lo que se cuenta cuando cae cada señor.
const CAIDAS = {
    lobo: "El Lobo de la Pereza huyó del valle el día en que {n} se levantó sin negociar con la almohada. Dejó su guarida vacía y, en ella, el calor de muchas mañanas perdidas.",
    medusa: "Medusa, la Parálisis, no resistió que {n} empezara sin estar listo. Su mirada ya no congela: ahora la piedra es ella.",
    narciso: "Narciso, el Ego, se quedó mirando su reflejo mientras {n} escuchaba a los demás. Cuando quiso hablar, ya nadie lo esperaba.",
    recaudadores: "Los Recaudadores cerraron sus libros. Cada deuda pagada fue una hoja arrancada, hasta que no quedó cuenta que cobrar.",
    minotauro: "El Minotauro, la Rutina sin rumbo, se perdió en su propio laberinto. {n} encontró la salida con un hilo sencillo: saber para qué hacía cada cosa.",
    cerbero: "Cerbero tenía tres cabezas —«después», «luego» y «mañana»— y ninguna sobrevivió a un «ahora» dicho muchas veces.",
    sirenas: "Las Sirenas cantaron hasta quedarse sin voz. {n} siguió remando, con los oídos atentos solo a lo que de verdad importaba.",
    pluton: "Pluto, el Gasto impulsivo, quiso comprarlo todo y se quedó sin nada. {n} aprendió a esperar un día antes de cada capricho.",
    ciclope: "El Cíclope del Cansancio cerró su único ojo. {n} no dejó de estar a veces sin fuerzas: dejó de obedecerle.",
    hidra: "A la Hidra de las Distracciones le crecían dos cabezas por cada una cortada. {n} dejó de cortar y aprendió a no mirarlas.",
    circe: "Circe, la Envidia, envenenó el agua por última vez. {n} había dejado de compararse, y el veneno ya no tenía en quién caer.",
    fafner: "Fafner, el Miedo a invertir, dormía sobre su oro. {n} lo despertó invirtiendo poco pero sin falta, y el dragón se quedó sin tesoro que guardar.",
    coloso: "El Coloso de las Excusas era enorme porque {n} lo alimentaba. Bastaron unas semanas sin «no tengo tiempo» para que se derrumbara.",
    mefistofeles: "Mefistófeles ofreció el último atajo. {n} eligió el camino largo, y el diablo, sin nadie a quien tentar, se fue a otra parte.",
    pesadilla: "La Pesadilla se sentó por última vez sobre el pecho de {n}, la noche antes de hablar en público. A la mañana siguiente, {n} habló igual.",
    mammon: "Mammón, la Codicia, se quedó solo sobre su trono. {n} había aprendido que tener suficiente también es una forma de riqueza.",
    leviatan: "Leviatán, la Indisciplina, se hundió en el mar del que había salido. No lo venció una gran batalla, sino cien días de hacer lo mismo.",
    dragon_rojo: "El Gran Dragón Rojo, la Ignorancia, cayó ante una sola arma: las ganas de aprender que {n} cultivó cada día.",
    satanas: "El Ángel Caído, el Orgullo, prefería caer antes que pedir ayuda. {n} pidió ayuda, y fue eso lo que lo derrotó.",
    gerion: "Gerión, el Fraude, mostró su rostro honesto por última vez. {n} ya distinguía las promesas de las cuentas claras.",
};

// ¿El nombre es plural? («Las Sirenas», «Los Recaudadores»): así el verbo concuerda.
const plural = (nombre) => /^(Los|Las) /.test(nombre);

// La Crónica según dónde vas. estado: la partida. campanas: campana.estadoCampanas(estado).
// nombres = { heroe, dragon }.
// Devuelve [{ id, numero ("Prólogo" | "I"…), titulo, abierto, parrafos: [{ tipo: "texto" | "caida" | "pendiente", texto }],
//             bloqueado (texto, si todavía no llegas) }]
export function capitulosDeLaCronica(estado, campanas, nombres) {
    const pos = mapa.posicion(estado);
    const poner = (texto) => texto.replaceAll("{n}", nombres.heroe).replaceAll("{m}", nombres.dragon);
    const capitulos = [{
        id: "prologo", numero: "Prólogo", titulo: PROLOGO.titulo, abierto: true,
        parrafos: PROLOGO.parrafos.map((texto) => ({ tipo: "texto", texto: poner(texto) })),
    }];

    // Las regiones de la vuelta en que vas, más las de vueltas anteriores (ya recorridas).
    const ultima = Math.max(pos.region, mapa.REGIONES.length - 1);
    for (let region = 0; region <= ultima; region++) {
        const tramo = mapa.tramoDe(region);
        const vuelta = mapa.vueltaDe(region);
        const numero = ROMANOS[region] || String(region + 1);
        const titulo = mapa.nombreRegion(region);
        if (region > pos.region) {
            // Todavía no llegas: se ve el título, pero no se lee.
            if (vuelta === mapa.vueltaDe(pos.region)) {
                capitulos.push({ id: `r${region + 1}`, numero, titulo, abierto: false, parrafos: [],
                                 bloqueado: `Llega a ${titulo} para leerlo.` });
            }
            continue;
        }
        const capitulo = CAPITULOS[tramo];
        const parrafos = [];
        if (vuelta) parrafos.push({ tipo: "texto", texto: poner(REGRESO) });
        parrafos.push({ tipo: "texto", texto: poner(capitulo.llegada) });
        for (const s of mapa.senoresDeRegion(region, campanas)) {
            const atributo = ATRIBUTOS[s.categoria];
            if (s.tipo === "memorial") {
                parrafos.push(s.liberada
                    ? { tipo: "caida", texto: `El ${s.nombre} se enciende: los cinco señores de la ${CAMPANAS[s.categoria].nombre.replace("Campaña", "Sombra")} cayeron.` }
                    : { tipo: "pendiente", texto: `El ${s.nombre} sigue apagado. Faltan ${s.faltan} ${s.faltan === 1 ? "señor" : "señores"} de la ${CAMPANAS[s.categoria].nombre} (${atributo.icono} ${atributo.nombre}).` });
                continue;
            }
            parrafos.push(s.liberada
                ? { tipo: "caida", texto: poner(CAIDAS[s.jefe.id] || `${s.jefe.nombre} cayó.`) }
                : { tipo: "pendiente", texto: `${s.jefe.nombre} —${s.jefe.titulo.toLowerCase()}— todavía ${plural(s.jefe.nombre) ? "gobiernan" : "gobierna"} desde su guarida. ` +
                                              `${plural(s.jefe.nombre) ? "Se debilitan" : "Se debilita"} con cada misión de ${atributo.icono} ${atributo.nombre}.` });
        }
        if (mapa.regionLiberada(region, campanas)) parrafos.push({ tipo: "texto", texto: poner(capitulo.libre) });
        capitulos.push({ id: `r${region + 1}`, numero, titulo, abierto: true, parrafos });
    }
    return capitulos;
}
