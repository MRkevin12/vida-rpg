// leyendas.js — La historia de la Torre del héroe y de la Mazmorra del Abismo (v29).
//
// La historia en pocas palabras (sigue a la Crónica del reino, ver cronica.js):
//   - TORRE, «La Torre de los Vigías»: los Vigías, los primeros que vencieron a las Sombras,
//     levantaron la Torre y encendieron en su cima una Llama que las mantenía lejos. Hace cien
//     años se apagó. Tu héroe sube y descubre, guardián tras guardián, que la Torre no se
//     construyó para mirar el cielo, sino para tapar algo que hay debajo. En la Corona, la Llama
//     NO prende: solo arde con el fuego de los cuatro memoriales del reino (ver saga.js, v36).
//   - v38, «La Torre despierta» (el DESPERTAR, que explica lo que cambió ese día): la Torre
//     dormía; desde que alguien volvió a subirla, despertó. La tormenta escondía la mitad: sobre
//     la cima siguen los Puentes de nubes y la Corona de la Llama, donde espera el Apagador (el
//     que apagó la Llama hace cien años). Las Sombras lo notaron y les enseñaron trucos a sus
//     criaturas; Aurelio te enseñó las técnicas de los Vigías y la Voluntad.
//   - MAZMORRA, «El Rey Hueco»: al caer el Dragón de la cima se abre una escalera bajo la Torre.
//     Abajo está el lugar donde nacen las Sombras, y en el fondo, el Rey Hueco: el primer Vigía
//     que dejó de subir.
//
// Cada lugar tiene un prólogo, un capítulo por zona (lo que encuentras al llegar y lo que pasa
// cuando cae su guardián) y un epílogo. Se cuentan en la batalla la PRIMERA vez que llegas a
// cada parte (ver relatoAlEmpezar y relatoTrasGuardian) y se pueden releer en «📜 Historia».
//
// Como libro.js y cronica.js, todo es TEXTO PLANO (vistas.js lo escapa al mostrarlo).
// {n} es el nombre de tu héroe. Sin género gramatical para el héroe (se usa su nombre).

import { PISOS_POR_ZONA, lugarDe } from "./bestiario.js";
import { LEYENDAS_NUEVAS } from "./mazmorras.js";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];

export const LEYENDAS = {
    torre: {
        titulo: "La Torre de los Vigías",
        prologo: {
            titulo: "La Torre sin cima",
            parrafos: [
                "Nadie recuerda quién puso la primera piedra. En el valle dicen que fueron los Vigías: los primeros que vencieron a las Sombras y que, para no olvidar cómo lo hicieron, levantaron una torre en la que cada piso es una prueba. (Un pergamino de la Biblioteca prohibida cuenta otra cosa: que fue una muchacha llamada Lía.)",
                "En lo alto ardía la Llama del Vigía. Mientras alumbraba el reino, las Sombras no se atrevían a volver. Hace cien años se apagó, la Torre se llenó de criaturas que nadie invitó y las Cuatro Sombras volvieron a repartirse el reino.",
                "El Maestro Aurelio, que fue aprendiz del último Vigía, le entrega a {n} una antorcha apagada. «Sube. No por la gloria: para saber de qué eres capaz. Esta antorcha no la encenderás aquí dentro, sino allá afuera, con cada Sombra que venzas.»",
            ],
        },
        // v38: lo que cambió el día en que la Torre despertó.
        despertar: {
            titulo: "La Torre despierta",
            parrafos: [
                "Durante cien años la Torre durmió. Una torre que nadie sube se duerme como se duerme un músculo: piso a piso, sin hacer ruido. Pero desde que {n} empezó a subir, algo cambió. Las piedras crujen de noche, y en lo más alto, por encima de la tormenta, han vuelto a verse luces.",
                "La tormenta escondía la mitad de la Torre. Sobre la cima de los rayos siguen los pisos que los últimos Vigías levantaron antes de que la Llama se apagara: los Puentes de nubes y, en lo más alto, la Corona de la Llama, con su pedestal vacío. Ahora son treinta pisos. Allá arriba espera el que apagó la Llama con la mano.",
                "Las Sombras también lo notaron. Hacía cien años que nadie subía, y ahora alguien sube todos los días. Les enseñaron trucos a sus criaturas: levantan barreras que se tragan los golpes, cargan golpes que parten la piedra, se cubren con espejos que devuelven los hechizos y se rehacen de sus heridas.",
                "Aurelio no se asustó. «Si ellas aprenden, tú también», le dijo a {n}, y le enseñó las técnicas de los Vigías, una por cada parte de la vida que cuidas: Quebrar, con la fuerza; Analizar, con la mente; Intimidar, con la voz; y el Golpe certero, con lo que sabes ganar. «Y algo que las Sombras nunca entendieron: la Voluntad. Se llena con cada golpe que aguantas sin rendirte, y cuando está llena, la sueltas de una vez.»",
            ],
            aviso: "✨ Nuevo: técnicas (una por atributo, desde su nivel 3) y la barra de Voluntad. La Torre ahora tiene 30 pisos.",
        },
        // Una entrada por zona (la clave es su id, ver bestiario.ZONAS).
        zonas: {
            cripta: {
                entrada: "Los primeros pisos son tumbas. Aquí descansan los Vigías, cada uno con su nombre grabado en la piedra… menos uno. Las antorchas arden con fuego azul y no dan calor. Más adelante, algo sigue haciendo guardia.",
                caida: "El Caballero sin Nombre se arrodilla. Bajo el yelmo no había nadie: solo el juramento de no dejar pasar a quien no estuviera listo. En su peto, una inscripción: «El que guarda la puerta no necesita nombre». Su guardia por fin termina; la de {n} empieza.",
            },
            biblioteca: {
                entrada: "Sobre las tumbas, los Vigías guardaron lo que sabían. Estantes hasta el techo, libros encadenados y la misma pregunta escrita en cada margen: ¿cómo se vence a una Sombra para siempre? Alguien pasó la vida entera buscando la respuesta.",
                caida: "El Archivista cierra su último libro. «Lo leí todo —dice—, y la respuesta estaba en la primera página: no se puede. A las Sombras se las vence cada día, o vuelven.» Antes de deshacerse en polvo no señala hacia arriba, sino hacia abajo. {n} todavía no entiende por qué.",
            },
            fragua: {
                entrada: "Aquí los Vigías forjaban sus armas con un fuego que subía de las profundidades. Las paredes queman al tacto y el suelo vibra, como si algo respirara debajo de la Torre.",
                caida: "El Señor de la Fragua se apaga como un horno sin carbón. Sobre el yunque queda lo último que se forjó aquí: un sello de hierro, partido en dos. {n} comprende que la Torre no se construyó solo para mirar el cielo. Se construyó encima de algo. Para mantenerlo cerrado.",
            },
            cima: {
                entrada: "Sin techo ni muros: solo el viento y los rayos. Entre ellos se ve una figura con armadura celeste. Es el último Vigía que subió, hace cien años. Nunca volvió a bajar. Y más arriba, donde debería estar el cielo, la tormenta tapa algo que no deja ver.",
                caida: "El Dragón de la tormenta cae, y con él la tormenta. Por primera vez en cien años el cielo se abre, y la figura de armadura celeste baja la espada, como quien por fin puede descansar. Entonces {n} ve lo que la tormenta escondía: la Torre no termina aquí. Sobre las nubes siguen los puentes de los últimos Vigías. Y abajo, al pie de la Torre, el sello de los cimientos termina de quebrarse: una escalera baja hacia la oscuridad. «Las Sombras no vienen de lejos —dice Aurelio—. Vienen de abajo.»",
                aviso: "🔓 Se abrió la Mazmorra del Abismo. La encontrarás en el Arcade.",
            },
            nubes: {
                entrada: "Sobre la tormenta, la Torre se vuelve puente. Pasarelas de piedra blanca saltan de nube en nube, sin barandas, y el viento empuja hacia el vacío a quien duda. Aquí las criaturas no esperan a que llegues: te ven venir desde muy lejos, y se preparan.",
                caida: "El Coloso de las nubes se deshace en lluvia, y por un momento el puente queda en silencio. Los Vigías lo tallaron para sostener el cielo; {n} lo ve caer y entiende que lo que sostiene algo no es la piedra, sino la costumbre de no soltarlo. Al fondo del último puente brilla una escalera de oro.",
            },
            corona: {
                entrada: "La Corona de la Llama: un círculo de columnas de oro alrededor de un pedestal apagado. Aquí no llega el viento. Algo lo apaga todo: el ruido, la luz, las ganas. Junto al pedestal, alguien alto y encapuchado sostiene una vara con una campana de hierro en la punta: un apagador de velas.",
                caida: "El Apagador cae sin hacer ruido, como cayó la Llama hace cien años. Fue él: subió en silencio cuando nadie miraba, y la apagó con la mano. {n} acerca la antorcha al pedestal, pero la Llama no prende. En la piedra hay una inscripción: «Solo arde con el fuego de las Sombras vencidas».",
            },
        },
        epilogo: {
            titulo: "La Corona",
            parrafos: [
                "Desde la Corona se ve todo el reino: el camino que sale del valle y, muy lejos, al final, la Ciudadela con sus cuatro memoriales. Ningún Vigía había subido tan alto en cien años.",
                "Abajo, Aurelio mira la luz de la antorcha en lo alto. «Ya sabes subir —le dice a {n} cuando baja—. Lo que falta no se hace aquí arriba, sino allá afuera: la Llama se enciende con cada señor que cae.»",
            ],
            aviso: "🏆 Llegaste a la Corona de la Llama. La Torre sigue: más arriba esperan las criaturas ancestrales.",
        },
    },

    mazmorra: {
        titulo: "El Rey Hueco",
        prologo: {
            titulo: "La escalera",
            parrafos: [
                "La escalera baja más de lo que debería. A cada vuelta el aire es más frío y el cielo abierto sobre la tormenta, allá arriba, más pequeño.",
                "Ahora {n} sabe la verdad: los Vigías no levantaron la Torre para vigilar el cielo. La clavaron en la tierra como una estaca, para sujetar la puerta del lugar donde nacen las Sombras. Cada «mañana» y cada «no puedo» empezaron aquí abajo, como una semilla.",
                "Aurelio no baja. «Allá abajo no te sirve lo que sabes —le dice a {n}—. Te sirve lo que eres cuando nadie te mira.»",
            ],
        },
        zonas: {
            cisterna: {
                entrada: "Los cimientos de la Torre están inundados. El agua negra llega a las rodillas y no refleja nada. Algo se mueve debajo, despacio, como se mueven las cosas que tienen todo el tiempo del mundo.",
                caida: "La Bestia de la cisterna se hunde por última vez y el agua baja de golpe, como si alguien hubiera quitado un tapón. Donde estaba su guarida hay una puerta de raíces, y del otro lado se oye un latido.",
            },
            raices: {
                entrada: "Detrás de la puerta hay un bosque al revés: raíces que cuelgan del techo y hongos que brillan con luz propia. Todo crece, pero nada florece. Es lo que pasa con lo que se deja para después: no muere; se pudre.",
                caida: "El Árbol hueco se parte en dos. Por dentro no tenía corazón: solo un hueco del tamaño de todo lo que nunca se intentó. Detrás de él, unos escalones tallados por manos humanas siguen bajando.",
            },
            santuario: {
                entrada: "Alguien vive aquí. Velas negras, cánticos en voz baja y una frase repetida en cada muro: «Descansa. Ya lo harás mañana». Son los Acólitos: bajaron a pelear contra las Sombras y terminaron rezándoles.",
                caida: "Al fondo del santuario había un espejo, y en el espejo, {n}. Pero no era {n}: era quien {n} habría sido si nunca hubiera empezado, con sus mismas armas y todas sus excusas. Al caer no gritó. Solo dijo: «Volveré cada vez que dudes». {n} sabe que es verdad, y baja igual.",
            },
            abismo: {
                entrada: "El fondo. No hay muros, solo una oscuridad que late. Aquí esperan los Heraldos de las Cuatro Sombras —el del Cuerpo, el de la Mente, el de la Voz y el del Tesoro— y, detrás de ellos, en un trono hecho de días perdidos, el Rey Hueco.",
                caida: "El Rey Hueco fue, hace mucho, un Vigía: el primero que dejó de subir. Se quedó tanto tiempo abajo que se vació por dentro, y de ese vacío nacieron las Sombras. Cuando {n} lo vence, la corona rueda por el suelo y la oscuridad, por un momento, se calla.",
            },
        },
        epilogo: {
            titulo: "Saber bajar",
            parrafos: [
                "{n} sube los veinte sótanos con la corona hueca en la mano. No hay fanfarria. Al pie de la Torre lo espera Aurelio, que esa noche, después de cien años, sube con {n} los veinte pisos hasta la cima y se sienta junto al pedestal frío.",
                "«No las venciste para siempre —le dice—. Nadie puede. Pero ahora sabes dónde nacen, y sabes bajar a buscarlas. Lo que falta no se hace aquí: la Llama se enciende allá afuera, con el fuego de los cuatro memoriales.» Desde ese día, cuando una Sombra vuelve, {n} ya no le tiene miedo: la conoce por su nombre.",
            ],
            aviso: "🏆 Venciste al Rey Hueco. La Mazmorra sigue abierta: más abajo esperan las criaturas abisales.",
        },
    },
};

Object.assign(LEYENDAS, LEYENDAS_NUEVAS);   // (v64) la historia de las minas y del laberinto (ver mazmorras.js)

const leyendaDe = (lugar) => LEYENDAS[lugar] || LEYENDAS.torre;
const conNombre = (nombre) => (texto) => texto.replaceAll("{n}", nombre);

// Cuántos pisos hay que superar para terminar la historia (vencer al último guardián).
export const finalDe = (lugar) => lugarDe(lugar).zonas.length * PISOS_POR_ZONA;


// ===== Para releer: la pantalla «📜 Historia» =====
// alcanzado: los pisos superados más lejos (tu récord, o lo que llevas en la partida de ahora).
// Devuelve [{ id, numero ("Prólogo" | "I"… | "Epílogo"), titulo, abierto, parrafos: [texto],
//             pendiente (texto, si falta su final), bloqueado (texto, si todavía no llegas), aviso }]
export function capitulosDeLeyenda(lugar, alcanzado, nombre) {
    const leyenda = leyendaDe(lugar);
    const sitio = lugarDe(lugar);
    const poner = conNombre(nombre);
    const piso = sitio.piso.toLowerCase();
    const capitulos = [{
        id: "prologo", numero: "Prólogo", titulo: leyenda.prologo.titulo, abierto: true,
        parrafos: leyenda.prologo.parrafos.map(poner),
    }];
    sitio.zonas.forEach((zona, i) => {
        const llegada = i * PISOS_POR_ZONA;          // pisos superados para llegar a esta zona
        const guardian = (i + 1) * PISOS_POR_ZONA;   // y para vencer a su guardián
        const abierto = alcanzado >= llegada;
        const textos = leyenda.zonas[zona.id];
        const parrafos = abierto ? [poner(textos.entrada)] : [];
        if (alcanzado >= guardian) parrafos.push(poner(textos.caida));
        capitulos.push({
            id: zona.id, numero: ROMANOS[i], titulo: zona.nombre, abierto, parrafos,
            pendiente: abierto && alcanzado < guardian ? `Vence al guardián del ${piso} ${guardian} para leer cómo termina.` : null,
            bloqueado: abierto ? null : `Llega al ${piso} ${llegada + 1} para leerlo.`,
            aviso: alcanzado >= guardian ? textos.aviso || null : null,
        });
    });
    // v38: el despertar de la Torre va después del prólogo (siempre se puede leer).
    if (leyenda.despertar) {
        capitulos.splice(1, 0, {
            id: "despertar", numero: "Interludio", titulo: leyenda.despertar.titulo, abierto: true,
            parrafos: leyenda.despertar.parrafos.map(poner), aviso: leyenda.despertar.aviso,
        });
    }
    const final = finalDe(lugar);
    const terminado = alcanzado >= final;
    capitulos.push({
        id: "epilogo", numero: "Epílogo", titulo: leyenda.epilogo.titulo, abierto: terminado,
        parrafos: terminado ? leyenda.epilogo.parrafos.map(poner) : [],
        aviso: terminado ? leyenda.epilogo.aviso : null,
        bloqueado: terminado ? null : `Supera el ${piso} ${final} para leerlo.`,
    });
    return capitulos;
}


// ===== En la batalla: lo que se cuenta la primera vez =====
// Un relato son una o más páginas que se leen una tras otra:
//   { lugar, paginas: [{ etiqueta, titulo, parrafos: [texto], sala (la zona del fondo), aviso }] }

// Al empezar: el prólogo (y en la Torre, el despertar) y la llegada a la primera zona, solo si
// nunca superaste un piso ahí (record = tu récord en ese lugar). Si no, null.
export function relatoAlEmpezar(lugar, record, nombre) {
    if (record > 0) return null;
    const leyenda = leyendaDe(lugar);
    const sitio = lugarDe(lugar);
    const poner = conNombre(nombre);
    const zona = sitio.zonas[0];
    return {
        lugar: sitio.id,
        paginas: [
            { etiqueta: `${sitio.nombre} · Prólogo`, titulo: leyenda.prologo.titulo, parrafos: leyenda.prologo.parrafos.map(poner), sala: zona.id },
            ...(leyenda.despertar ? [paginaDelDespertar(leyenda, sitio, poner)] : []),
            { etiqueta: `${sitio.nombre} · Capítulo I`, titulo: zona.nombre, parrafos: [poner(leyenda.zonas[zona.id].entrada)], sala: zona.id },
        ],
    };
}

const paginaDelDespertar = (leyenda, sitio, poner) => ({
    etiqueta: `${sitio.nombre} · Interludio`, titulo: leyenda.despertar.titulo,
    parrafos: leyenda.despertar.parrafos.map(poner), sala: "nubes", aviso: leyenda.despertar.aviso,
});

// v38: a quien ya había subido la Torre antes de que despertara, se le cuenta UNA vez lo que
// cambió (visto = si ya se le contó; ver estado.arcade.despertar). Si no hace falta, null.
export function relatoDelDespertar(record, visto, nombre) {
    if (visto || record <= 0) return null;
    const leyenda = LEYENDAS.torre;
    return { lugar: "torre", paginas: [paginaDelDespertar(leyenda, lugarDe("torre"), conNombre(nombre))] };
}

// Al vencer a un guardián (pisoVencido = 5, 10, 15 o 20) por PRIMERA vez (tu récord era menor):
// cómo cae y lo que viene (la zona siguiente o, después del último, el epílogo). Si no, null.
export function relatoTrasGuardian(lugar, pisoVencido, record, nombre) {
    if (pisoVencido % PISOS_POR_ZONA !== 0 || pisoVencido > finalDe(lugar) || record >= pisoVencido) return null;
    const leyenda = leyendaDe(lugar);
    const sitio = lugarDe(lugar);
    const poner = conNombre(nombre);
    const i = pisoVencido / PISOS_POR_ZONA - 1;
    const zona = sitio.zonas[i];
    const siguiente = sitio.zonas[i + 1];
    const textos = leyenda.zonas[zona.id];
    const paginas = [{ etiqueta: `${sitio.nombre} · Capítulo ${ROMANOS[i]}`, titulo: zona.nombre, parrafos: [poner(textos.caida)], sala: zona.id, aviso: textos.aviso }];
    paginas.push(siguiente
        ? { etiqueta: `${sitio.nombre} · Capítulo ${ROMANOS[i + 1]}`, titulo: siguiente.nombre, parrafos: [poner(leyenda.zonas[siguiente.id].entrada)], sala: siguiente.id }
        : { etiqueta: `${sitio.nombre} · Epílogo`, titulo: leyenda.epilogo.titulo, parrafos: leyenda.epilogo.parrafos.map(poner), sala: zona.id, aviso: leyenda.epilogo.aviso });
    return { lugar: sitio.id, paginas };
}
