// voces-valle-2.js — Más voces para el valle (v45): siete personas nuevas, 14 conversaciones y el epílogo de la aldea.
//
// Con ellas, cada una de las cinco voces que la Sombra le quitó a la aldea tiene DOS personas (ver voces-datos.js para el
// formato de las conversaciones y cómo se escribe el texto):
//   El Orgullo     Maren (pedir ayuda) · Edmundo (dar el primer paso con un hermano)
//   El Qué dirán   Tobías (decir que no) · Wren (elegir su camino frente a la familia)
//   La Envidia     Ilse (celebrar a quien te supera, entre hermanas) · Gaspar (reconocer a un aprendiz que te supera)
//   El Miedo       Cassiel (hablar en público) · Marta (reclamar lo suyo sin pelear)
//   El Ego         Don Anselmo (escuchar) · Valerio (admitir un error)
// voces-datos.js junta todo esto con lo suyo (LUGARES, PERSONAS, INVITADOS y ESCENAS son la suma de los dos archivos).
//
// Ojo con la historia: la Llama de los Vigías solo arde al final de la saga (ver saga.js). El epílogo cuenta que la ALDEA
// recuperó la voz; no dice que la Llama ya arda (hay una prueba).

export const MAS_LUGARES = {
    muelle: { nombre: "El muelle", icono: "⚓", fondo: "mar" },
    taller: { nombre: "El taller de carpintería", icono: "🪚", fondo: "bosque" },
    notaria: { nombre: "La notaría", icono: "📜", fondo: "escena-intelecto" },
    teatro: { nombre: "El teatro de la plaza", icono: "🎭", fondo: "escena-carisma" },
    botica: { nombre: "La botica", icono: "🌿", fondo: "escena-riqueza" },
    camino: { nombre: "El cruce del camino", icono: "🛤️", fondo: "camino" },
};

export const MAS_PERSONAS = {
    edmundo: {
        nombre: "Edmundo", oficio: "Capitán retirado", lugar: "muelle", dias: [0, 2, 3, 4, 6],
        voz: "El Orgullo", sombra: "Lleva veinte años sin hablarle a su hermano por una pelea que casi nadie recuerda.",
        saludo: "Remienda una red con la vista puesta en la otra orilla de la bahía.",
        aspecto: { cuerpo: "masculino", piel: "morena", rostro: "curtido", ojos: "gris", pelo: "cano", peinado: "rapado", barba: "completa", traje: "azul" },
        escenas: ["edmundo-1", "edmundo-2"],
    },
    wren: {
        nombre: "Wren", oficio: "Hija del molinero", lugar: "camino", dias: [1, 2, 5, 6],
        voz: "El Qué dirán", sombra: "Hace lo que su familia espera, aunque sueña con otra vida.",
        saludo: "Mira el camino largo, sentada sobre una mochila a medio cerrar.",
        aspecto: { cuerpo: "femenino", piel: "oscura", rostro: "decidido", ojos: "cafe", pelo: "negro", peinado: "recogido", barba: "ninguna", traje: "blanco" },
        escenas: ["wren-1", "wren-2"],
    },
    gaspar: {
        nombre: "Gaspar", oficio: "Carpintero", lugar: "taller", dias: [0, 1, 3, 4, 5],
        voz: "La Envidia", sombra: "Critica a su aprendiz porque teme que ya lo supere.",
        saludo: "Lija una tabla con más fuerza de la necesaria.",
        aspecto: { cuerpo: "masculino", piel: "media", rostro: "decidido", ojos: "miel", pelo: "castano", peinado: "corto", barba: "bigote", traje: "negro" },
        escenas: ["gaspar-1", "gaspar-2"],
    },
    cassiel: {
        nombre: "Cassiel", oficio: "Bardo joven", lugar: "teatro", dias: [1, 3, 4, 6],
        voz: "El Miedo", sombra: "Tiene una voz preciosa y un pánico que se la come.",
        saludo: "Ensaya en un teatro vacío y se detiene en cada verso.",
        aspecto: { cuerpo: "masculino", piel: "canela", rostro: "sereno", ojos: "miel", pelo: "negro", peinado: "rizado", barba: "ninguna", traje: "azul" },
        escenas: ["cassiel-1", "cassiel-2"],
    },
    marta: {
        nombre: "Marta", oficio: "Panadera", lugar: "plaza", dias: [0, 2, 3, 5, 6],
        voz: "El Miedo", sombra: "Le fía el pan a quien no paga, porque no sabe cómo reclamar.",
        saludo: "Amasa con fuerza y el ceño de quien lleva una cuenta en la cabeza.",
        aspecto: { cuerpo: "femenino", piel: "canela", rostro: "amable", ojos: "cafe", pelo: "castano", peinado: "recogido", barba: "ninguna", traje: "blanco" },
        escenas: ["marta-1", "marta-2"],
    },
    anselmo: {
        nombre: "Don Anselmo", oficio: "Notario", lugar: "notaria", dias: [0, 1, 3, 5],
        voz: "El Ego", sombra: "Habla sin pausa de sí mismo y hace años que no escucha a nadie.",
        saludo: "Dicta una carta que nadie le pidió, sin dejar de admirar su pluma.",
        aspecto: { cuerpo: "masculino", piel: "clara", rostro: "curtido", ojos: "gris", pelo: "cano", peinado: "calvo", barba: "candado", traje: "negro" },
        escenas: ["anselmo-1", "anselmo-2"],
    },
    valerio: {
        nombre: "Valerio", oficio: "Boticario", lugar: "botica", dias: [1, 2, 4, 5, 6],
        voz: "El Ego", sombra: "No soporta equivocarse, y por eso nunca lo admite.",
        saludo: "Pesa hierbas con precisión de relojero y corrige a quien pase.",
        aspecto: { cuerpo: "masculino", piel: "media", rostro: "decidido", ojos: "verde", pelo: "castano", peinado: "corto", barba: "completa", traje: "esmeralda" },
        escenas: ["valerio-1", "valerio-2"],
    },
};

export const MAS_INVITADOS = {
    elsa: {
        nombre: "Elsa", oficio: "Viuda del molino",
        aspecto: { cuerpo: "femenino", piel: "clara", rostro: "amable", ojos: "gris", pelo: "cano", peinado: "recogido", barba: "ninguna", traje: "violeta" },
    },
};

// El final de la aldea: se cuenta (y se paga) cuando todas las conversaciones están hechas. Cada página es un párrafo.
export const EPILOGO = {
    titulo: "La aldea habla",
    premio: { gemas: 40, xp: 40 },
    paginas: [
        "Cae la tarde sobre la plaza y, sin que nadie lo haya convocado, la aldea entera se junta. Maren llega con una hogaza que Marta le fió sin apuntarla. Tobías ha cerrado la posada, aunque no sea miércoles. Ilse y Vera traen un mismo pañuelo bordado entre las dos. Cassiel afina el laúd en el centro, con las manos temblando y la voz entera.",
        "Entonces, uno a uno, empiezan a decir lo que callaron. Maren: «Necesito ayuda, y la pedí.» Gaspar: «El mejor carpintero del valle no soy yo, y está aquí.» Wren: «Me voy a la ciudad, y vuelvo.» Don Anselmo: «¿Y usted cómo está?» Valerio: «Me equivoqué una vez; lo arreglé.» Edmundo y su hermano Ciro llegan en el «Dos Hermanos», remendado y feo, y nadie dice nada: no hace falta. Cassiel canta.",
        "Aurelio ha bajado de su casa al pie de la Torre y mira todo desde el borde de la plaza, apoyado en el bastón. «No vencí a la Sombra de la Voz», le dice a {n}, «porque a ella no se la vence con una espada: se la vence aquí, cada vez que alguien dice lo que siente en lugar de callarlo. Tú no peleaste: escuchaste. Y escuchar es el comienzo de todo lo demás.»",
        "Arriba, en la Torre, el pedestal sigue frío: la Llama de los Vigías no prende con la voz de una aldea, sino con el fuego de los cuatro memoriales, y todavía hay señores allá afuera. Pero esta noche hay cuarenta ventanas encendidas en el valle, y en cada una, alguien por fin habla. Aurelio sonríe. «Es un buen comienzo para una Llama.»",
    ],
};

// Las mismas tres reglas para decidir el final de casi todas las conversaciones.
const FINAL_POR_CONFIANZA = (bien, regular) => ({
    evalua: [{ confianzaMin: bien, ir: "bien" }, { confianzaMin: regular, ir: "regular" }, { ir: "mal" }],
});

const CASSIEL = "cassiel";
const MARTA = "marta";
const ANSELMO = "anselmo";
const VALERIO = "valerio";
const EDMUNDO = "edmundo";
const WREN = "wren";
const GASPAR = "gaspar";
const ELSA = "elsa";

export const MAS_ESCENAS = {
    // ───────────────────────────── CASSIEL · el Miedo (hablar en público) ─────────────────────────────
    "cassiel-1": {
        persona: "cassiel", titulo: "La noche antes", requiere: [], espera: 0, inicio: "k1",
        nodos: {
            k1: {
                texto: "El teatro está vacío y huele a polvo y a cera. En el escenario, un muchacho recita una balada con los ojos cerrados. Es hermosa. A la mitad del tercer verso se detiene, se sacude las manos como quien se quema y empieza otra vez desde el principio. Mañana es la fiesta de la cosecha, y él es el último del programa.",
                opciones: [
                    { texto: "Tu voz es preciosa. ¿Por qué te detienes?", ir: "k2", confianza: 1 },
                    { texto: "Te quedas en la última fila y lo dejas empezar otra vez, sin interrumpir.", ir: "k2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Se te da muy bien. No tienes de qué preocuparte.", ir: "k2", confianza: -1 },
                ],
            },
            k2: {
                quien: CASSIEL, texto: "Me sé cada verso. Dormido me los sé. Y aun así, cada vez que imagino la plaza llena, se me va todo. _Se sacude las manos._ Estoy pensando en fingirme enfermo.",
                opciones: [
                    { texto: "¿Qué imaginas que va a pasar, exactamente?", ir: "k3", confianza: 1 },
                    { texto: "Es agotador ensayar tanto y que el miedo siga ahí, como si no sirviera de nada.", ir: "k3", tecnica: "empatia", confianza: 2 },
                    { texto: "Pues finge. Nadie se va a enterar.", ir: "k3", confianza: -1 },
                    { texto: "A mí también se me va la voz antes de hablar. Aprendí que el miedo no avisa de nada: solo hace ruido.", ir: "k3", valor: 2, confianza: 2 },
                ],
            },
            k3: {
                quien: CASSIEL, texto: "Que me quede en blanco. Que todos me miren esperando y no me salga ni la primera palabra. Y que se rían. _Una risa corta, sin gracia._ Que se rían del hijo de la tejedora que quiso ser bardo.",
                opciones: [
                    { texto: "Y si pasara, ¿qué haría falta para seguir? Piensa en esa escena, y en la mañana siguiente.", ir: "k4", confianza: 1 },
                    { texto: "Estás ensayando el desastre más que la balada.", ir: "k4", tecnica: "verdad", confianza: 2 },
                    { texto: "No va a pasar nada de eso.", ir: "k4" },
                ],
            },
            k4: {
                quien: CASSIEL, texto: "Quizá lo peor no sea quedarme en blanco. Quizá sea no subir nunca por si me quedo en blanco. _Mira las filas vacías._ Aunque eso suena a frase de libro.",
                opciones: [
                    { texto: "Prepara solo el primer verso, muy bien: el resto llega arrastrado. Empezar ya es media balada.", ir: "k5", confianza: 1 },
                    { texto: "Sube mañana aunque te tiemblen las manos. Con las manos temblando también sale la voz.", ir: "k5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Mejor otro año, cuando estés listo.", ir: "k5", confianza: -1 },
                ],
            },
            k5: {
                quien: CASSIEL, texto: "Un favor: ¿puedo recitártelo ahora de verdad, como si fueras toda la plaza? _Se sube al centro del escenario y respira._",
                opciones: [
                    { texto: "Con gusto. Y si te quedas en blanco, respira y vuelve al verso anterior. Yo no me voy a ir.", ir: "ev", confianza: 2 },
                    { texto: "Hazlo, pero sin parar a la mitad esta vez.", ir: "ev", confianza: 1 },
                    { texto: "Mejor guárdalo para mañana.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Cassiel recita la balada entera. Se le quiebra la voz dos veces, y las dos veces vuelve al verso anterior, respira y sigue. Al terminar, tú eres toda la plaza y aplaudes de pie. Él se ríe, con los ojos húmedos: «Se me fue la voz y no se acabó el mundo.» Mañana sube. Los nervios no se fueron: se quedaron a su lado, sin mandar.",
                leccion: "El miedo escénico no se vence esperando a que desaparezca: se atraviesa con un primer paso preparado, respiración y permiso para equivocarte. Ensayar ante alguien amable lo vuelve real.",
                tarea: "Practica en voz alta, delante de alguien, algo que te dé nervios",
            },
            regular: {
                fin: "regular",
                texto: "Cassiel recita hasta el final, esta vez sin detenerse, pero sin mirarte, como quien cruza un río con los ojos cerrados. No sabe si mañana subirá. Pero ya recitó una vez ante alguien.",
                leccion: "Practicar delante de otra persona ya es medio camino. Lo demás es repetirlo hasta que pese menos.",
                tarea: "Practica algo que te dé nervios delante de una sola persona de confianza",
            },
            mal: {
                fin: "mal",
                texto: "Cassiel guarda el cuaderno. «Creo que me va a dar fiebre mañana», dice sin mirarte. El teatro vuelve a quedar en silencio. Hoy el miedo ganó el ensayo.",
                leccion: "A quien tiene miedo, decirle que no hay motivo lo deja solo con él. Preguntar qué teme y preparar un primer paso pequeño ayuda más.",
            },
        },
    },

    "cassiel-2": {
        persona: "cassiel", titulo: "Antes de que se abra el telón", requiere: ["cassiel-1"], espera: 1, inicio: "q1",
        nodos: {
            q1: {
                texto: "Es la noche de la fiesta. Detrás del telón se oye la plaza llena: copas, risas, niños. Cassiel está entre bastidores con el laúd en las manos y la cara color ceniza. «No me acuerdo de nada» —dice—. «Ni el primer verso.»",
                opciones: [
                    { texto: "Respira conmigo: cuatro tiempos adentro, seis afuera.", ir: "q2", confianza: 1 },
                    { texto: "Le sostienes la mirada y esperas a que termine de decir lo que se le atora.", ir: "q2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Es solo una canción, Cassiel.", ir: "q2", confianza: -1 },
                ],
            },
            q2: {
                quien: CASSIEL, texto: "El primer verso. _Se muerde el labio._ ¿Cómo era? Empieza por… no, no me sale. Mi mente está como la plaza antes del amanecer: vacía.",
                opciones: [
                    { texto: "Ese verso lo dijiste anoche veinte veces. Dime lo primero que te venga, aunque no sea exacto.", ir: "q3", confianza: 1 },
                    { texto: "Te quedaste en blanco porque tu cuerpo cree que hay peligro. No te falta memoria: te sobra alarma.", ir: "q3", tecnica: "empatia", confianza: 2 },
                    { texto: "Aquí tienes la letra, léela.", ir: "q3" },
                    { texto: "Yo también me quedé en blanco una vez, delante de mucha gente. Respiré, dije «dame un segundo» y el resto vino solo.", ir: "q3", valor: 3, confianza: 2 },
                ],
            },
            q3: {
                texto: "Se oye la voz del presentador: «¡Y ahora, el bardo del valle!» Cassiel traga saliva. «Ya me llaman. Dime algo. Lo que sea.»",
                opciones: [
                    { texto: "Busca una cara amable entre el público y cántale solo a ella. Yo estaré en la primera fila.", ir: "q4", confianza: 1 },
                    { texto: "Si te quedas en blanco, improvisa: di que el bardo trae hoy el verso en el otro bolsillo. Se ríen contigo, no de ti.", ir: "q4", tecnica: "humor", confianza: 2 },
                    { texto: "Tú puedes. Solo no te equivoques.", ir: "q4", confianza: -1 },
                ],
            },
            q4: {
                quien: CASSIEL, texto: "Una cosa más. ¿Y si me equivoco igual? ¿Y si lo hago horrible?",
                opciones: [
                    { texto: "Entonces habrás cantado horrible delante de la gente que quieres, y mañana seguirá habiendo pan. Equivocarte es parte de subir.", ir: "q5", confianza: 1 },
                    { texto: "Vas a subir, vas a empezar y vas a terminar. Lo que salga en medio no te toca juzgarlo esta noche.", ir: "q5", tecnica: "firmeza", confianza: 2 },
                    { texto: "No te equivocarás.", ir: "q5" },
                ],
            },
            q5: {
                texto: "Cassiel sube. El silencio de la plaza es enorme. Alza el laúd. Abre la boca… y no sale nada. Un segundo. Dos. En primera fila, tú lo miras.",
                opciones: [
                    { texto: "Le haces un gesto pequeño: respira, y te señalas el pecho.", ir: "ev", confianza: 2 },
                    { texto: "Le sonríes y asientes, sin ayudarle con la letra.", ir: "ev", confianza: 1 },
                    { texto: "Cierras los ojos para no ver cómo se hunde.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Cassiel respira. Hace un gesto con la cabeza, hacia ti, y canta. El primer verso sale ronco. El segundo, entero. En el tercero la voz se le abre y la plaza se queda quieta. Al terminar hay un silencio hermoso y luego un aplauso enorme. Entre bastidores se deja caer contra un barril y se ríe sin parar: «¡Me tembló todo y canté!»",
                leccion: "El valor no es no sentir miedo: es hacer lo importante con él puesto. Una cara amable, una respiración y el primer verso bastan para arrancar.",
                tarea: "Haz hoy algo que te dé nervios, aunque sea pequeño",
            },
            regular: {
                fin: "regular",
                texto: "Cassiel canta, pero con la mirada fija en el suelo y sin parar para respirar. Termina rápido, casi sin aire. Hay aplausos corteses. Él sonríe a medias: «Terminé.» No es lo que soñaba, pero subió.",
                leccion: "Terminar con nervios también cuenta. La próxima vez habrá más soltura, y la voz pesará menos.",
            },
            mal: {
                fin: "mal",
                texto: "Cassiel no sube. «Se me fue la voz» —dice, y se lo cree—. El presentador anuncia otro número. Esa noche escribe, solo, una balada nueva sobre un telón cerrado.",
                leccion: "Si alguien está en blanco y le exiges perfección, se paraliza más. Calma, un primer paso pequeño y tu presencia ayudan más que las órdenes.",
            },
        },
    },

    // ───────────────────────────── MARTA · el Miedo (reclamar sin pelear) ─────────────────────────────
    "marta-1": {
        persona: "marta", titulo: "La cuenta pendiente", requiere: [], espera: 0, inicio: "m1",
        nodos: {
            m1: {
                texto: "El puesto de pan de Marta huele a lo mejor de la plaza, y a ella se le nota en la cara que no se da cuenta. Amasa con rabia contenida. Junto a la caja hay un cuaderno abierto con una columna de cuentas, y una de ellas está subrayada tres veces: «Rufo — 31 días».",
                opciones: [
                    { texto: "Esa masa ya está bien amasada, Marta. ¿Todo bien?", ir: "m2", confianza: 1 },
                    { texto: "Esperas, mirando el cuaderno sin tocarlo.", ir: "m2", tecnica: "escuchar", confianza: 1 },
                    { texto: "A todos nos deben plata, no pasa nada.", ir: "m2", confianza: -1 },
                ],
            },
            m2: {
                quien: MARTA, texto: "Rufo, el del establo. Lleva un mes llevándose el pan de la mañana y diciendo «mañana te pago». Treinta y un días. _Golpea la masa._ Son seis monedas, no es la ruina. Pero ya no sé si soy panadera o beneficencia.",
                opciones: [
                    { texto: "¿Qué te frena de pedirle que pague?", ir: "m3", confianza: 1 },
                    { texto: "Se nota que te enoja más lo que sientes contigo que lo que hizo él.", ir: "m3", tecnica: "empatia", confianza: 2 },
                    { texto: "Cóbrale y ya. Es muy fácil.", ir: "m3", confianza: -1 },
                    { texto: "A mí también me costaba pedir lo que me debían. Descubrí que dolía más callarlo que decirlo.", ir: "m3", valor: 2, confianza: 2 },
                ],
            },
            m3: {
                quien: MARTA, texto: "Me da miedo que se enoje. Es un hombre grande, de voz fuerte. Y es mi vecino: lo voy a ver toda la vida. Y si me deja de comprar, y si lo cuenta, y si… _Se frena._ Ya ves, me enredo sola.",
                opciones: [
                    { texto: "Pedir lo que te deben no es atacarlo: es cuidar tu panadería.", ir: "m4", confianza: 1 },
                    { texto: "Callar tampoco te protege: cada día que pasa, el enojo crece de tu lado.", ir: "m4", tecnica: "verdad", confianza: 2 },
                    { texto: "Mejor déjalo pasar: seis monedas no valen una pelea.", ir: "m4" },
                ],
            },
            m4: {
                quien: MARTA, texto: "Vale… pero ¿cómo? Si le digo «Rufo, me debes», suena a acusación. Y si le digo «cuando puedas», no sirve de nada.",
                opciones: [
                    { texto: "Prueba con tres partes: un hecho, lo que necesitas y para cuándo. «Rufo, llevas un mes sin pagar el pan, son seis monedas. Necesito que me las pagues el viernes.»", ir: "m5", confianza: 2 },
                    { texto: "Dile «cuando puedas», pero con cara seria.", ir: "m5" },
                    { texto: "No pidas permiso: di lo que necesitas y espera la respuesta en silencio, sin rellenar.", ir: "m5", tecnica: "firmeza", confianza: 2 },
                ],
            },
            m5: {
                texto: "Marta repite la frase entera, de corrido, con las manos llenas de harina: «Rufo, llevas un mes sin pagar el pan, son seis monedas. Necesito que me las pagues el viernes.» Se queda en silencio. «Suena firme» —dice, sorprendida—. «Y no suena a pelea.»",
                opciones: [
                    { texto: "Ahora díselo mañana, cuando venga. Aquí, tranquila, yo vigilo el horno.", ir: "ev", confianza: 1 },
                    { texto: "Dile también qué pasará si no paga, sin enojo: «Y si no, dejaré de fiarte el pan».", ir: "ev", tecnica: "firmeza", confianza: 2 },
                    { texto: "Prueba otra vez, más bajito, no vaya a oírte.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Marta repite la frase tres veces, hasta que deja de sonar a súplica. Al final se limpia las manos en el delantal y dice: «Mañana, cuando venga.» Y por primera vez desde hace un mes, esa noche duerme sin contar monedas.",
                leccion: "Pedir lo que es tuyo con claridad —un hecho, lo que necesitas y un plazo— suena firme sin sonar a pelea. Preparar las palabras antes quita buena parte del miedo.",
                tarea: "Prepara por escrito lo que necesitas pedir: hecho, necesidad y plazo",
            },
            regular: {
                fin: "regular",
                texto: "Marta dice que lo intentará, pero cuando te vas todavía duda, con la masa entre las manos. Tiene las palabras; le falta el valor para la hora. Al menos, ya las tiene.",
                leccion: "Tener las palabras listas es más de la mitad. El resto es la hora de decirlas.",
            },
            mal: {
                fin: "mal",
                texto: "Marta decide esperar «el momento adecuado», y ese momento no llega. El cuaderno sigue subrayado: «Rufo — 32 días». Hoy el miedo al conflicto decidió por ella.",
                leccion: "Evitar el conflicto no lo borra: lo agranda por dentro. Preparar las palabras antes lo hace manejable.",
            },
        },
    },

    "marta-2": {
        persona: "marta", titulo: "El hombre del establo", requiere: ["marta-1"], espera: 1, inicio: "r1",
        nodos: {
            r1: {
                texto: "Rufo llega a la panadería con su paso de oso y el sombrero hundido. Marta, detrás del mostrador, dice la frase preparada: «Rufo, llevas un mes sin pagar el pan. Necesito que me pagues el viernes.» Rufo se pone rojo. «¿Estás diciendo que soy un ladrón?» La cola de clientes se queda callada. Tú estás tercero en la fila.",
                opciones: [
                    { texto: "Te quedas cerca, en silencio, para que no esté sola, pero sin intervenir.", ir: "r2", confianza: 1 },
                    { texto: "Miras a Rufo: no parece enojado, parece avergonzado.", ir: "r2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Intervienes: «Rufo, no te pongas así».", ir: "r2", confianza: -1 },
                ],
            },
            r2: {
                quien: MARTA, texto: "_Se le va el color de la cara._ No… no dije eso, Rufo. Digo que… son seis monedas, y yo… _Te mira, buscando ayuda._",
                opciones: [
                    { texto: "Le haces un gesto pequeño: respira y repite lo que preparaste.", ir: "r3", confianza: 2 },
                    { texto: "Le dices en voz baja: «Lo estás haciendo bien. Una vez más, la frase entera».", ir: "r3", tecnica: "empatia", confianza: 2 },
                    { texto: "Hablas tú: «Lo que Marta quiere decir es…»", ir: "r3", confianza: -2 },
                ],
            },
            r3: {
                texto: "Marta endereza la espalda. «Rufo, necesito que me pagues el viernes las seis monedas.» Rufo parpadea, desconcertado, y su enfado se le arruga: «Es que… ahora no tengo. Mi caballo se enfermó y el veterinario…» Se frota la cara. «Yo no soy un ladrón, Marta.»",
                opciones: [
                    { texto: "Dejas que Marta responda; solo asientes.", ir: "r4", confianza: 1 },
                    { texto: "Le dices a Rufo: «Seguro que fue una semana dura. Marta no duda de ti: solo necesita saber para cuándo».", ir: "r4", tecnica: "empatia", confianza: 2 },
                    { texto: "Le dices a Rufo que se calle.", ir: "r4", confianza: -1 },
                ],
            },
            r4: {
                quien: MARTA, texto: "Entonces… ¿puedes el viernes, o el sábado? Dime tú un día, y ese día me lo traes. _Se sorprende de sus propias palabras._",
                opciones: [
                    { texto: "Dejas que ella cierre el trato: tú solo le sostienes la mirada.", ir: "r5", confianza: 1 },
                    { texto: "Le recuerdas, sin dureza, que sin pago el pan fiado se acaba. Marta asiente.", ir: "r5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Le dices a Rufo: «Si no pagas, te quedas sin pan».", ir: "r5", confianza: -1 },
                ],
            },
            r5: {
                texto: "Rufo se queda un momento callado. Luego suspira y se ríe sin ganas: «Qué vergüenza. Tienes razón. Mañana te traigo tres monedas y el sábado, el resto. Y el pan de hoy lo pago ahora.» Marta, temblando, estira la mano y le da la barra.",
                opciones: [
                    { texto: "Cuando se va, le dices a Marta: «Lo hiciste tú. Yo solo estaba aquí».", ir: "ev", confianza: 2 },
                    { texto: "Le dices a Marta que ha sido fácil.", ir: "ev" },
                    { texto: "Te vas sin decir nada.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Cuando se vacía la panadería, a Marta le tiemblan las rodillas y se ríe, y se ríe más, y acaba sentada sobre un saco de harina. «¡Me dijo que tenía razón! ¡Que tenía razón!» Esa noche, en el cuaderno, tacha «Rufo — 31 días» con un solo trazo y escribe debajo: «Pedir no mata.»",
                leccion: "Cuando el otro se pone a la defensiva no hace falta ganar la discusión: basta con repetir con calma lo que necesitas y dejarle espacio para salvar la cara.",
                tarea: "Si alguien se pone a la defensiva, repite con calma lo que necesitas",
            },
            regular: {
                fin: "regular",
                texto: "Rufo promete pagar y se va con el ceño fruncido; Marta queda pálida, aliviada y sin saber si salió bien. Al día siguiente él trae tres monedas sin decir nada. No fue perfecto, pero algo se movió.",
                leccion: "No todos los conflictos terminan en reconciliación inmediata: a veces basta con que se mueva lo que estaba parado.",
            },
            mal: {
                fin: "mal",
                texto: "Marta se echa atrás: «Déjalo, Rufo, no pasa nada.» Rufo se lleva el pan y la cola vuelve a hablar. Ella pasa el resto de la tarde amasando como si fuera a romper la mesa.",
                leccion: "Retirar una petición ante la primera reacción le enseña al otro que basta con enfadarse. Mantenerla con calma suele bastar.",
            },
        },
    },

    // ───────────────────────────── DON ANSELMO · el Ego (escuchar) ─────────────────────────────
    "anselmo-1": {
        persona: "anselmo", titulo: "El discurso sin pausas", requiere: [], espera: 0, inicio: "s1",
        nodos: {
            s1: {
                texto: "La notaría huele a papel y a colonia. Don Anselmo, de pie junto a una estantería que rebosa diplomas enmarcados, te recibe con los brazos abiertos: «¡Ah, {n}! Pase, pase. Justo le contaba a mi escribiente cómo gané el pleito de las aguas del molino hace veinte años: una obra maestra de la argumentación, si me permite la inmodestia.» No le permite; sigue hablando.",
                opciones: [
                    { texto: "Lo escuchas un rato, asintiendo, y buscas el momento para una pregunta.", ir: "s2", confianza: 1 },
                    { texto: "Le dejas hablar y te fijas en lo que evita mencionar.", ir: "s2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Qué impresionante, don Anselmo. Cuénteme más.", ir: "s2", confianza: -1 },
                ],
            },
            s2: {
                quien: ANSELMO, texto: "…y entonces el juez, que era un hombre de cortos alcances, me dijo: «Notario, no le entiendo». Y yo le contesté: «Señoría, ese es precisamente el problema». ¡Ja! Así soy yo. Dígame, ¿ha leído mi tratado sobre las servidumbres? Seiscientas páginas. Nadie lo lee, claro: no están a la altura.",
                opciones: [
                    { texto: "Don Anselmo, ¿puedo hacerle una pregunta? ¿Cuándo fue la última vez que alguien le contó algo a usted?", ir: "s3", confianza: 1 },
                    { texto: "Parece que le gustaría que alguien lo leyera de verdad.", ir: "s3", tecnica: "empatia", confianza: 2 },
                    { texto: "No hace falta que me lo diga: se nota que es un genio.", ir: "s3", confianza: -1 },
                    { texto: "Yo también hablaba mucho de mí cuando temía que no me escucharan. Pasa más de lo que se admite.", ir: "s3", valor: 2, confianza: 2 },
                ],
            },
            s3: {
                quien: ANSELMO, texto: "_Se detiene a medias._ ¿Que alguien me cuente…? _Se ríe, algo nervioso._ Qué pregunta tan curiosa. La gente viene a firmar y se va, y yo les explico, claro, para que entiendan. Mi hija decía que yo hablo como quien llena un silencio con paja.",
                opciones: [
                    { texto: "¿Y qué le contestaba usted?", ir: "s4", confianza: 1 },
                    { texto: "Don Anselmo, en los últimos cinco minutos no me ha preguntado nada. Ni una sola vez.", ir: "s4", tecnica: "verdad", confianza: 2 },
                    { texto: "Su hija exageraba.", ir: "s4", confianza: -1 },
                ],
            },
            s4: {
                quien: ANSELMO, texto: "_Se queda callado, y es la primera vez._ No… no le he preguntado nada. _Mira sus diplomas._ Hace años que no pregunto. Si pregunto, quizá la respuesta no sea sobre mí. Y yo… ¿quién soy cuando nadie me escucha hablar de mí?",
                opciones: [
                    { texto: "Quizá alguien que también sabe escuchar. Pruebe ahora: pregúnteme algo.", ir: "s5", confianza: 2 },
                    { texto: "No es grave: a mucha gente le pasa.", ir: "s5" },
                    { texto: "Un notario sin público: la profesión más silenciosa del reino. Probemos con un público de uno.", ir: "s5", tecnica: "humor", confianza: 2 },
                ],
            },
            s5: {
                quien: ANSELMO, texto: "_Carraspea, cohibido._ Entonces… ¿cómo está usted, {n}? ¿Qué trámite lo trae hoy? _Un silencio incómodo._ ¿Lo hice bien?",
                opciones: [
                    { texto: "Muy bien. Y ahora escuche lo que le conteste sin pensar en su siguiente frase.", ir: "ev", confianza: 2 },
                    { texto: "Muy bien. Ahora cuénteme su tratado.", ir: "ev", confianza: -1 },
                    { texto: "Bien, pero no pida aprobación: pregunte, y escuche.", ir: "ev", tecnica: "firmeza", confianza: 2 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Le cuentas tu trámite, una tontería de linderos, y don Anselmo te escucha con la pluma quieta. Hace una pregunta, luego otra. Cuando le contestas, asiente y no rellena el silencio. Al despedirte te toma la mano con las dos suyas: «Hacía tanto que no me contaban nada… Vuelva cuando quiera. Prometo preguntar.» En la puerta, su escribiente te sonríe en silencio, incrédulo.",
                leccion: "Hablar sin parar de uno mismo suele esconder miedo a no importar. Preguntar con interés de verdad y aguantar el silencio cambia las conversaciones.",
                tarea: "En tu próxima conversación, haz dos preguntas antes de contar nada tuyo",
            },
            regular: {
                fin: "regular",
                texto: "Don Anselmo hace una pregunta, y la respuesta le resulta tan interesante que la usa de trampolín para otra anécdota suya. Pero al despedirte dice, medio en broma: «Debo practicar eso de preguntar.» Algo se movió.",
                leccion: "Cambiar un hábito de años lleva práctica. Lo valioso es que ya lo notó.",
            },
            mal: {
                fin: "mal",
                texto: "Don Anselmo se ofende. «Joven, cuando usted tenga mi trayectoria…» Y continúa hablando, ahora de lo mal que lo tratan. Sales con la cabeza zumbando. Hoy el ego se defendió a gritos.",
                leccion: "Corregir de frente a alguien con mucho ego lo hace defenderse. Primero hay que mostrarle, con curiosidad, qué pierde.",
            },
        },
    },

    "anselmo-2": {
        persona: "anselmo", titulo: "La carta a Pía", requiere: ["anselmo-1"], espera: 1, inicio: "p1",
        nodos: {
            p1: {
                texto: "A la mañana siguiente, don Anselmo te espera con un pliego sin firmar y los ojos de quien no ha dormido. «Es una carta para mi hija Pía. Se fue del valle hace seis años, tras una discusión. Escribí doce páginas. Doce. Para explicarle por qué yo tenía razón.»",
                opciones: [
                    { texto: "¿Y qué le gustaría que ella sintiera al leerla?", ir: "p2", confianza: 1 },
                    { texto: "Lo escuchas, sin juzgar las doce páginas.", ir: "p2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Doce páginas es perfecto. Es usted un gran escritor.", ir: "p2", confianza: -1 },
                ],
            },
            p2: {
                quien: ANSELMO, texto: "Que entendiera. Que… _se detiene_ …que me diera la razón, supongo. _Se pasa la mano por la cara._ Qué torpe suena dicho en voz alta.",
                opciones: [
                    { texto: "¿Y si la carta preguntara en lugar de explicar?", ir: "p3", confianza: 1 },
                    { texto: "Parece que lo que de verdad echa de menos no es la razón: es a ella.", ir: "p3", tecnica: "empatia", confianza: 2 },
                    { texto: "Eso es lo que quiere todo el mundo: tener la razón.", ir: "p3" },
                    { texto: "Yo también discutí con alguien querido y quise ganar. Perdí tiempo que pude haber compartido.", ir: "p3", valor: 2, confianza: 2 },
                ],
            },
            p3: {
                quien: ANSELMO, texto: "_Con la pluma en el aire._ ¿Preguntar? ¿Qué le preguntaría? Ella seguro que ya no quiere saber nada de mí. Y si responde, y si… me dice cosas que no quiero oír.",
                opciones: [
                    { texto: "Quizá lo que no quiere oír es justo lo que necesita saber. Pregúntele cómo está y qué le dolió de aquella discusión.", ir: "p4", confianza: 1 },
                    { texto: "Tiene miedo de oír la verdad de su hija. Ya la conoce: le dolió que usted no la escuchara.", ir: "p4", tecnica: "verdad", confianza: 2 },
                    { texto: "Mejor no le escriba.", ir: "p4", confianza: -1 },
                ],
            },
            p4: {
                quien: ANSELMO, texto: "Tachemos entonces las doce páginas. _Una pausa larga._ ¿Qué queda? Tal vez tres líneas: «Pía, hace seis años no te escuché. Me gustaría hacerlo ahora, si quieres contarme.»",
                opciones: [
                    { texto: "Eso es una carta. Añada una pregunta concreta que ella pueda contestar fácil.", ir: "p5", confianza: 2 },
                    { texto: "Es corto. ¿No quedará frío?", ir: "p5", confianza: -1 },
                    { texto: "No la adorne: las tres líneas, tal cual.", ir: "p5", tecnica: "firmeza", confianza: 2 },
                ],
            },
            p5: {
                quien: ANSELMO, texto: "_Firma con mano temblorosa._ Y si no contesta…",
                opciones: [
                    { texto: "Entonces habrá escuchado primero, y eso ya no se lo quita nadie.", ir: "ev", confianza: 2 },
                    { texto: "Contestará, ya verá.", ir: "ev" },
                    { texto: "Entonces ella se lo pierde.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Don Anselmo dobla la carta de tres líneas y la sella con cera, él mismo, con un cuidado que nunca puso en un contrato. Se la entrega al mensajero con las dos manos. «Si ella no contesta» —dice con voz seria—, «yo seguiré preguntando.» Y ese hombre que llenaba cada silencio se queda en uno largo, mirando el camino por el que se irá la carta.",
                leccion: "Querer tener razón y querer a alguien a veces compiten. Cuando eliges preguntar, escuchar y pedir perdón antes que explicar, el vínculo suele ganar.",
                tarea: "Escríbele hoy a alguien con quien perdiste contacto: solo una pregunta",
            },
            regular: {
                fin: "regular",
                texto: "Don Anselmo envía la carta, pero añade una página «por si acaso», explicando. La tentación de tener razón le hizo un poco de trampa. Pero la mandó.",
                leccion: "Mandar el mensaje, aunque no sea perfecto, es lo que cuenta. Lo demás se pule con el tiempo.",
            },
            mal: {
                fin: "mal",
                texto: "Don Anselmo guarda la carta de tres líneas en un cajón, junto a las doce páginas. «Más adelante» —dice—. «Cuando encuentre las palabras exactas.» Las palabras exactas, sospechas, no existen.",
                leccion: "Esperar las palabras perfectas es otra forma de no decirlas. Un mensaje sencillo, enviado a tiempo, vale más.",
            },
        },
    },

    // ───────────────────────────── VALERIO · el Ego (admitir un error) ─────────────────────────────
    "valerio-1": {
        persona: "valerio", titulo: "Una receta equivocada", requiere: [], espera: 0, inicio: "v1",
        nodos: {
            v1: {
                texto: "La botica de Valerio es un ejemplo de orden: frascos etiquetados, balanzas y un cartel que dice «Aquí se cura con ciencia». Valerio, detrás del mostrador, corrige en voz alta a un cliente que preguntó por una infusión: «No, no, eso no se toma así.» Cuando el cliente se va, se vuelve hacia ti con la mirada fija. «Dígame, ¿en qué le puedo ayudar?» Pero una vena le late en la sien. Algo le pasa.",
                opciones: [
                    { texto: "¿Todo bien, Valerio? Parece que lo del cliente le molestó.", ir: "v2", confianza: 1 },
                    { texto: "Lo miras y esperas, sin llenar el silencio.", ir: "v2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Se nota que usted siempre sabe lo que hace.", ir: "v2", confianza: -1 },
                ],
            },
            v2: {
                quien: VALERIO, texto: "No hay nada que me moleste. _Reacomoda un frasco que ya estaba recto._ Es que la gente no entiende de dosis. Yo no me equivoco con las dosis. Jamás. Estudié diez años. Hay quien dice… _se interrumpe_ …no importa lo que digan.",
                opciones: [
                    { texto: "¿Qué dicen?", ir: "v3", confianza: 1 },
                    { texto: "Suena como si alguien hubiera puesto en duda lo que más cuida: su exactitud.", ir: "v3", tecnica: "empatia", confianza: 2 },
                    { texto: "Seguro que son envidiosos.", ir: "v3", confianza: -1 },
                    { texto: "A mí me costaba admitir un error porque sentía que me hacía menos. Era al revés: me hacía más sólido.", ir: "v3", valor: 2, confianza: 2 },
                ],
            },
            v3: {
                quien: VALERIO, texto: "_Baja la voz._ Elsa, la viuda del molino. Se enfermó el mes pasado… de lo que le receté. Una dosis que calculé yo mismo. Ella dice que fue mi infusión; yo digo que fue la edad. _Aprieta el borde del mostrador._ Hice los números tres veces. Los números no se equivocan.",
                opciones: [
                    { texto: "¿Y si revisara los números otra vez, no para probar que tiene razón, sino para saber qué pasó?", ir: "v4", confianza: 1 },
                    { texto: "Los números no se equivocan, pero las personas que los calculan sí. Y eso no lo hace menos científico.", ir: "v4", tecnica: "verdad", confianza: 2 },
                    { texto: "Elsa miente: usted es el mejor boticario.", ir: "v4", confianza: -1 },
                ],
            },
            v4: {
                quien: VALERIO, texto: "_Se sienta con pesadez._ Si me equivoqué… hice daño. A una mujer de setenta años. Y yo, que… _Calla._ Prefiero pensar que fue la edad. Es más limpio. Dime que fue la edad, {n}.",
                opciones: [
                    { texto: "No puedo decir eso. Pero decir «puede que me equivocara» no lo hace peor boticario: lo hace uno de verdad.", ir: "v5", confianza: 2 },
                    { texto: "Sí, probablemente fue la edad.", ir: "v5", confianza: -2 },
                    { texto: "No le voy a decir lo que quiere oír. Le digo lo que usted sabe: revise la receta.", ir: "v5", tecnica: "firmeza", confianza: 2 },
                ],
            },
            v5: {
                quien: VALERIO, texto: "_Saca un cuaderno y lo abre._ Pesé… quince gramos. Y el libro decía diez. _Se queda helado._ Leí quince. Quince, no diez. Un error de lectura. _Voz casi inaudible._ Fui yo. Lo hice yo.",
                opciones: [
                    { texto: "Es duro verlo. Pero ahora sabe la verdad, y puede corregirla.", ir: "ev", confianza: 2 },
                    { texto: "Bueno, cualquiera se equivoca. No se lo diga a nadie.", ir: "ev", confianza: -2 },
                    { texto: "Tiene que ir a pedirle perdón a Elsa.", ir: "ev", confianza: 1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Valerio cierra el cuaderno despacio, como quien cierra una puerta que lleva años abierta. «Fui yo» —repite—. No hay hundimiento en su voz: hay algo parecido al alivio. «Qué cansado era sostener que no me equivocaba.» Y descuelga el cartel de «Aquí se cura con ciencia» para escribir debajo, con letra firme: «…y con humildad.»",
                leccion: "Admitir un error en voz alta no destruye tu credibilidad: la construye. Lo que desgasta es defender durante semanas lo que ya sabes que no es cierto.",
                tarea: "Reconoce hoy un error pequeño, sin excusas y sin dramatizar",
            },
            regular: {
                fin: "regular",
                texto: "Valerio acepta revisar la receta y se encierra en la trastienda. Sales sin saber qué encontrará. Al día siguiente su cartel sigue igual, pero ya no corrige a nadie en voz alta. Algo duda dentro del hombre de las certezas.",
                leccion: "Dudar de uno mismo con honestidad es el primer paso para corregir. No hace falta que sea espectacular.",
            },
            mal: {
                fin: "mal",
                texto: "Valerio levanta la barbilla. «Gracias por su visita.» Te abre la puerta. «Usted no sabe de lo que habla.» Vuelve al mostrador y se queda, por dentro, más solo que nunca, rodeado de frascos perfectos.",
                leccion: "A quien necesita tener razón, decirle «te equivocaste» de frente lo atrinchera. Primero hay que darle un lugar seguro donde equivocarse.",
            },
        },
    },

    "valerio-2": {
        persona: "valerio", titulo: "Pedirle perdón a Elsa", requiere: ["valerio-1"], espera: 1, inicio: "w1",
        nodos: {
            w1: {
                texto: "Elsa, la viuda del molino, entra en la botica apoyada en su bastón. Valerio, detrás del mostrador, se pone blanco. Te mira, suplicante: «Está aquí. Y no sé por dónde empezar.»",
                opciones: [
                    { texto: "Respire y empiece por lo más simple: «Elsa, tengo que decirle algo».", ir: "w2", confianza: 1 },
                    { texto: "Le dejas decidir cuándo, sin presionar.", ir: "w2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Dígale que fue un malentendido.", ir: "w2", confianza: -2 },
                ],
            },
            w2: {
                quien: VALERIO, texto: "Dame las palabras. Yo sé de dosis, no de esto. ¿Qué se dice? ¿«Lo siento»? ¿«Cometí un error, pero»…?",
                opciones: [
                    { texto: "Sin «pero». «Cometí un error con su receta, y lo lamento.»", ir: "w3", confianza: 2 },
                    { texto: "Primero pregúntele cómo está. Ella cargó con esto sola.", ir: "w3", tecnica: "empatia", confianza: 2 },
                    { texto: "Dígale que fue una dosis difícil de calcular.", ir: "w3", confianza: -1 },
                ],
            },
            w3: {
                texto: "Elsa se apoya en el mostrador. «Valerio… ¿ocurre algo? Tienes cara de sepulcro.» Valerio respira. «Elsa, cometí un error con su receta, y lo lamento. Quince gramos donde eran diez.» El silencio se alarga como un hilo a punto de romperse.",
                opciones: [
                    { texto: "Le haces un gesto discreto: que no se explique más, que la deje responder.", ir: "w4", confianza: 2 },
                    { texto: "Le recuerdas, con un susurro, que no se excuse.", ir: "w4", tecnica: "firmeza", confianza: 1 },
                    { texto: "Interrumpes: «Fue sin querer, Elsa».", ir: "w4", confianza: -1 },
                ],
            },
            w4: {
                quien: ELSA, texto: "_Lo mira un buen rato._ Lo sabía. No digo que no me dolió, ni que no pasé semanas asustada. Pero lo sabía: eres hombre de números, no de maldades. Lo que no sabía era si lo dirías.",
                opciones: [
                    { texto: "Valerio, ¿quiere preguntarle qué necesita de usted ahora?", ir: "w5", confianza: 1 },
                    { texto: "Le dices a Valerio que lo que acaba de hacer, decir la verdad, vale más que todos sus diplomas.", ir: "w5", tecnica: "verdad", confianza: 2 },
                    { texto: "Le dices a Elsa que ya está, que no hay que remover más.", ir: "w5", confianza: -1 },
                ],
            },
            w5: {
                texto: "«Elsa, ¿qué puedo hacer yo por usted? Lo que sea.» Elsa sonríe, cansada y serena. «Revisa mis recetas de los últimos meses. Y yo vendré de nuevo, claro. A ver si ahora me enseñas a pesar yo misma el té.»",
                opciones: [
                    { texto: "Le sugieres a Valerio que acepte: «Con gusto. Y de paso reviso cada receta con otro par de ojos».", ir: "ev", confianza: 2 },
                    { texto: "Le sugieres que le ofrezca dinero como compensación.", ir: "ev" },
                    { texto: "Te vas para no estorbar.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Elsa se va con su paquete de hierbas y una promesa de pasar el jueves. Valerio se queda mirando la puerta. Luego saca de un cajón un segundo cartel, más pequeño, y lo pega junto al de la ciencia: «Si me equivoco, avíseme.» Al cerrar la botica, silba. Hacía diez años que no silbaba.",
                leccion: "Una buena disculpa tiene tres partes: reconocer lo que pasó sin excusas, escuchar al otro y ofrecer reparar. Disculparse bien no te humilla: le devuelve su dignidad al otro.",
                tarea: "Pide perdón hoy a quien debas: reconoce, sin «peros», y ofrece reparar",
            },
            regular: {
                fin: "regular",
                texto: "Valerio le pide perdón a Elsa a medias, con demasiadas explicaciones. Ella lo perdona con un gesto cansado. No es la disculpa de manual, pero la hizo. Y eso, en un hombre como él, pesa más de lo que parece.",
                leccion: "Una disculpa imperfecta es mejor que ninguna. Se puede afinar en la próxima.",
            },
            mal: {
                fin: "mal",
                texto: "Valerio balbucea algo sobre «unos números difíciles». Elsa asiente con cortesía, paga y se va sin su sonrisa de siempre. El boticario se queda con su cartel intacto y la sensación de que esta vez la ciencia no le sirvió de nada.",
                leccion: "Una disculpa con excusas sigue siendo una defensa. Quien la recibe lo nota.",
            },
        },
    },

    // ───────────────────────────── EDMUNDO · el Orgullo (dar el primer paso) ─────────────────────────────
    "edmundo-1": {
        persona: "edmundo", titulo: "El bote partido", requiere: [], espera: 0, inicio: "e1",
        nodos: {
            e1: {
                texto: "En el muelle hay un bote partido por la mitad sobre unos caballetes, cubierto con una lona. Edmundo, el capitán retirado, lo cuida más que a su casa, y a veces ni lo toca. Cuando llegas, está sentado a su lado remendando una red que nadie le pidió, con la vista en la otra orilla de la bahía, donde se ve una casita blanca con la chimenea encendida.",
                opciones: [
                    { texto: "Es un bote muy grande para estar tanto tiempo parado. ¿Qué le pasó?", ir: "e2", confianza: 1 },
                    { texto: "Te sientas cerca, mirando la bahía como él, sin preguntar.", ir: "e2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Qué casa tan bonita la del otro lado.", ir: "e2", confianza: -1 },
                ],
            },
            e2: {
                quien: EDMUNDO, texto: "El «Dos Hermanos». Lo construimos mi hermano Ciro y yo, con las manos. _Palpa la madera partida._ Hace veinte años discutimos por algo que ni recuerdo bien: quién tenía razón con las mareas, o con el reparto del pescado… Ciro lo partió con un hacha. Con un hacha, {n}. Y desde entonces, nada.",
                opciones: [
                    { texto: "¿Qué le dolió más: lo que dijo o lo del hacha?", ir: "e3", confianza: 1 },
                    { texto: "Veinte años es mucho tiempo para llevar una herida tan grande.", ir: "e3", tecnica: "empatia", confianza: 2 },
                    { texto: "Su hermano fue muy violento.", ir: "e3", confianza: -1 },
                    { texto: "Yo tuve un conflicto así con alguien querido. Pasaron años hasta que alguien dio el primer paso. Ojalá hubiera sido antes.", ir: "e3", valor: 2, confianza: 2 },
                ],
            },
            e3: {
                quien: EDMUNDO, texto: "Me dolió el orgullo. _Dice la palabra con desagrado._ Él dijo que yo no sabía de mar. Yo, que llevé tres barcos. Y si yo voy primero, ¿qué digo? ¿Que tenía razón él? No la tenía. ¿Entonces por qué iría yo primero? Que venga él, que fue quien agarró el hacha.",
                opciones: [
                    { texto: "Ir primero no es darle la razón: es decir que le importa más el bote que la pelea.", ir: "e4", confianza: 1 },
                    { texto: "Lleva veinte años esperando a que él dé el paso, y él espera lo mismo de usted. Los dos miran la bahía.", ir: "e4", tecnica: "verdad", confianza: 2 },
                    { texto: "Tiene razón: que venga él.", ir: "e4", confianza: -1 },
                ],
            },
            e4: {
                quien: EDMUNDO, texto: "_Se queda callado largo rato, remendando._ ¿Y si voy y no me abre? ¿Y si ya no me quiere ver? Veinte años es mucho tiempo para que te perdonen. Y si él… _Algo se le quiebra detrás de las palabras._ Y si ya se murió esa parte y yo no me enteré.",
                opciones: [
                    { texto: "Puede que no abra. Pero si no va, lo único seguro es que no se entera. Y vale la pena saberlo.", ir: "e5", confianza: 1 },
                    { texto: "Si no va, esto se decide solo, y no a su favor. Vaya con lo que siente, no con lo que quiere ganar.", ir: "e5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Si no abre, que él se lo pierda.", ir: "e5", confianza: -1 },
                ],
            },
            e5: {
                quien: EDMUNDO, texto: "_Levanta la lona del bote._ Mira. Está hecho trizas, pero la quilla se salvó. Con unos días de trabajo se arregla. Si lo hago… ¿tendrías valor de ir conmigo a la casa blanca? No para hablar por mí. Solo… para que haya alguien en el bote.",
                opciones: [
                    { texto: "Iré. Y la primera frase la dice usted.", ir: "ev", confianza: 2 },
                    { texto: "Mejor arréglelo primero y vaya cuando esté listo.", ir: "ev" },
                    { texto: "No, eso es entre ustedes.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Edmundo pasa la mano por la quilla, despacio. «Unos días» —dice—. Y por primera vez en veinte años saca sus herramientas. Al irte, lo oyes martillar. Allá, al otro lado de la bahía, la chimenea de la casa blanca saca humo en una línea muy recta, como quien también está esperando algo.",
                leccion: "El orgullo no protege lo que importa: protege la herida. Dar el primer paso no es perder; es preferir la relación a tener razón.",
                tarea: "Escribe un mensaje a alguien con quien llevas tiempo distanciado: solo un saludo",
            },
            regular: {
                fin: "regular",
                texto: "Edmundo vuelve a cubrir el bote con la lona. «Lo pensaré» —dice—. Pero esta vez, antes de que te vayas, lo ves quitar el polvo de la proa con la manga. Veinte años no se deshacen en una tarde: ese fue el primer trapo.",
                leccion: "Los rencores largos se deshacen con pasos pequeños. Lo importante es empezar a moverse.",
            },
            mal: {
                fin: "mal",
                texto: "Edmundo termina su red sin decir una palabra. «Qué sabe usted de hermanos» —dice al fin, y no es una pregunta—. El bote sigue partido. La chimenea de la otra orilla se apaga a la hora de siempre.",
                leccion: "Cuando alguien guarda un rencor, juzgar a la otra parte o darle la razón lo atrinchera. Mostrarle qué pierde él ayuda más.",
            },
        },
    },

    "edmundo-2": {
        persona: "edmundo", titulo: "Cruzar la bahía", requiere: ["edmundo-1"], espera: 1, inicio: "f1",
        nodos: {
            f1: {
                texto: "Unos días después, el «Dos Hermanos» flota por primera vez en veinte años: remendado, medio feo, pero entero. Edmundo está de pie en el muelle con un remo en la mano y la cara de quien va a tirarse de un acantilado. «Hoy» —dice—. «Antes de que me arrepienta.»",
                opciones: [
                    { texto: "Te subes al bote con él y remas en silencio.", ir: "f2", confianza: 1 },
                    { texto: "Lo dejas hablar mientras cruzan.", ir: "f2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Si tiene dudas, esperen a mañana.", ir: "f2", confianza: -1 },
                ],
            },
            f2: {
                quien: EDMUNDO, texto: "¿Qué le digo? Llevo veinte años ensayando discursos. En unos tengo razón; en otros lloro. En todos me muero de rabia. _Rema con fuerza._ Y ahora que estamos cerca, no me sale ninguno.",
                opciones: [
                    { texto: "Quizá no hace falta discurso. ¿Qué es lo primero que querría que Ciro supiera?", ir: "f3", confianza: 1 },
                    { texto: "Después de tanto ensayar, el cuerpo se pone nervioso. Es normal: es importante.", ir: "f3", tecnica: "empatia", confianza: 2 },
                    { texto: "Dígale que lo perdona.", ir: "f3", confianza: -1 },
                ],
            },
            f3: {
                quien: EDMUNDO, texto: "Que lo extraño. _Lo dice casi sin voz._ Que extraño pescar con él. Que no vi crecer a mis sobrinos. Que el bote… el bote era lo de menos. Eso. Eso es lo único que quiero que sepa.",
                opciones: [
                    { texto: "Entonces diga eso. Y deje la pelea para otro día, si hace falta.", ir: "f4", confianza: 2 },
                    { texto: "Ahora ya sabe qué quiere decir. Decirlo es lo único que le falta.", ir: "f4", tecnica: "verdad", confianza: 1 },
                    { texto: "No lo diga tan directo, o pensará que cedió.", ir: "f4", confianza: -1 },
                ],
            },
            f4: {
                texto: "Llegan al embarcadero de la casa blanca. En el porche, un hombre de pelo blanco, igual de rapado y curtido que Edmundo, los ve acercarse con una taza en la mano. No se mueve. La taza tiembla un poco. Edmundo se queda de pie en el bote, sin bajar. El silencio parece de piedra.",
                opciones: [
                    { texto: "Le das tiempo: no hablas por él, solo sostienes el amarre.", ir: "f5", confianza: 1 },
                    { texto: "Le dices en voz baja: «Ahora, capitán».", ir: "f5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Saludas tú primero a Ciro.", ir: "f5", confianza: -2 },
                ],
            },
            f5: {
                texto: "Edmundo dice por fin: «Ciro. Arreglé el bote. Quedó feo.» Ciro, sin soltar la taza: «Siempre fuiste mal carpintero.» Silencio. Y Ciro empieza a reír, o a llorar, es difícil saber. «Veinte años, Edmundo. Veinte años esperando que me trajeras ese bote.» Edmundo no responde: solo extiende la mano con el cabo.",
                opciones: [
                    { texto: "Les dejas el momento: miras el agua.", ir: "ev", confianza: 2 },
                    { texto: "Dices algo gracioso para romper la tensión.", ir: "ev" },
                    { texto: "Te vas de puntillas, y el momento se te escapa.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Ciro baja al embarcadero, despacio, y agarra el cabo. Nadie dice «perdón»: ninguno de los dos sabe cómo se hace. Pero Ciro dice «sube» y Edmundo sube. Desde el bote ves cómo dos hombres de pelo blanco se sientan en el porche, cada uno con una taza, hablando de mareas. De mareas. Y estás casi seguro de que ya no discuten por quién tenía razón.",
                leccion: "Para reconciliarte no hace falta resolver quién tenía razón: hace falta decir lo que echas de menos. Lo demás suele resolverse después.",
                tarea: "Dile a alguien que echas de menos hablar con él, sin ajustar cuentas",
            },
            regular: {
                fin: "regular",
                texto: "Edmundo y Ciro se saludan con torpeza y se sientan a un metro de distancia, sin saber qué decir. La conversación es breve y tosca, pero al irse Ciro dice: «Vuelve el domingo.» Para dos hombres como ellos, eso es una fiesta.",
                leccion: "No todas las reconciliaciones son cálidas desde el principio. Basta con abrir una puerta y volver a cruzarla.",
            },
            mal: {
                fin: "mal",
                texto: "Edmundo no baja del bote. «Otro día» —dice, y gira el remo—. Ciro lo ve alejarse con la taza en la mano. El «Dos Hermanos» vuelve a su caballete. Hoy ganó el orgullo, otra vez.",
                leccion: "Llegar hasta la puerta ya es mucho. Lo que falta, a veces, es alguien que sostenga el amarre sin decidir por ti.",
            },
        },
    },

    // ───────────────────────────── WREN · el Qué dirán (elegir su camino) ─────────────────────────────
    "wren-1": {
        persona: "wren", titulo: "La mochila del camino", requiere: [], espera: 0, inicio: "n1",
        nodos: {
            n1: {
                texto: "En la bifurcación del camino, donde el sendero del molino se separa del camino largo que sale del valle, una joven está sentada sobre una mochila a medio cerrar. Wren guarda en el abrigo una carta de la escuela de medicina de la ciudad. Lo sabes porque se le ve el borde, arrugado de tantas veces que la sacó y la volvió a esconder.",
                opciones: [
                    { texto: "Preguntas con suavidad: «¿Esperas a alguien?»", ir: "n2", confianza: 1 },
                    { texto: "Te sientas a su lado, sin preguntar.", ir: "n2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Dime que no es lo que parece: vas a irte.", ir: "n2", confianza: -1 },
                ],
            },
            n2: {
                quien: WREN, texto: "Me aceptaron. En la escuela de la ciudad. Hace tres semanas. No se lo he dicho a nadie. _Aprieta la correa de la mochila._ En casa dan por hecho que me quedaré con el molino cuando papá se retire. Es lo que hacemos. Siempre ha sido así.",
                opciones: [
                    { texto: "¿Y tú qué quieres?", ir: "n3", confianza: 1 },
                    { texto: "Debe ser raro sentir orgullo y miedo juntos por lo mismo.", ir: "n3", tecnica: "empatia", confianza: 2 },
                    { texto: "Qué suerte. Tienes que ir.", ir: "n3" },
                    { texto: "A mí me costó decir que quería algo distinto de lo que esperaban de mí. Pesó menos al decirlo que al callarlo.", ir: "n3", valor: 2, confianza: 2 },
                ],
            },
            n3: {
                quien: WREN, texto: "Quiero ir. Siempre quise. _Mira el camino largo._ Pero papá se quebró el hombro el año pasado y mamá lleva las cuentas con las manos temblando. Si me voy, dirán que los abandoné. Y no sé si tienen razón.",
                opciones: [
                    { texto: "Quizá puedas ir sin abandonarlos: ¿hay forma de ayudar desde lejos, o de preparar un relevo?", ir: "n4", confianza: 1 },
                    { texto: "Si te quedas por culpa, lo notarán. Y tú también.", ir: "n4", tecnica: "verdad", confianza: 2 },
                    { texto: "Si te quieren, entenderán.", ir: "n4" },
                ],
            },
            n4: {
                quien: WREN, texto: "No había pensado en un relevo. _Se queda mirando._ Mi primo Tomás es bueno con las piedras y busca trabajo. Podríamos… no sé, enseñarle. Pero eso es hablarlo con ellos, y entonces ya no hay marcha atrás.",
                opciones: [
                    { texto: "Sí, hay que hablarlo. Prepara antes lo que quieres decir.", ir: "n5", confianza: 1 },
                    { texto: "Hablarlo ya es decidir. Eso es lo que da miedo: que se vuelva real.", ir: "n5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Mejor que no se enteren hasta que estés lejos.", ir: "n5", confianza: -2 },
                ],
            },
            n5: {
                quien: WREN, texto: "_Respira hondo._ Los domingos comemos todos juntos. Si lo digo el domingo… ¿vendrías? No para hablar. Solo… para que haya alguien de mi lado.",
                opciones: [
                    { texto: "Sí. Y tú dices lo importante primero: lo que quieres, y lo que quieres cuidar.", ir: "ev", confianza: 2 },
                    { texto: "Mejor díselo antes, a solas con tu madre.", ir: "ev", confianza: 1 },
                    { texto: "Es un asunto de familia.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Wren se guarda la carta en el bolsillo del pecho, ya sin esconderla. Cierra la mochila del todo, pero no se levanta rumbo a la ciudad: se levanta rumbo al molino. «El domingo» —dice, con voz firme—. «Y si me tiembla, me miras.» Por primera vez en tres semanas, sonríe sin sentirse culpable.",
                leccion: "Decidir tu camino no es abandonar a quienes quieres: es decirlo con tiempo, con cuidado y con un plan para quienes se quedan.",
                tarea: "Habla hoy con alguien importante de algo que has estado ocultando",
            },
            regular: {
                fin: "regular",
                texto: "Wren guarda la carta y cierra la mochila, pero aún no decide cuándo hablar. «Antes de la cosecha» —dice—. Es una fecha, al menos. El camino largo sigue ahí, esperando sin prisa.",
                leccion: "Ponerle fecha a una conversación difícil la vuelve real. Una fecha vale más que un «algún día».",
            },
            mal: {
                fin: "mal",
                texto: "Wren se pone de pie, sacude la mochila y suspira. «Quizá es mejor así» —dice, y toma el sendero del molino—. A medio camino se detiene, se vuelve y mira un segundo la bifurcación. Hoy el qué dirán le ganó el camino.",
                leccion: "Cuando alguien duda entre su deseo y lo que esperan de él, apurarlo o darle la razón a quienes esperan no ayuda. Preguntarle qué quiere, sí.",
            },
        },
    },

    "wren-2": {
        persona: "wren", titulo: "La mesa de los domingos", requiere: ["wren-1"], espera: 1, inicio: "z1",
        nodos: {
            z1: {
                texto: "Domingo. En la casa del molino huele a pan recién hecho y a guiso, y la mesa es larga: cuatro adultos, tres niños y tú, sentado junto a Wren, que no ha tocado el plato. Su padre, con el brazo en cabestrillo, bendice la mesa. Wren te mira de reojo. «Ahora» —articula sin voz—. «O no sé si podré.»",
                opciones: [
                    { texto: "Le haces un gesto pequeño: respira, empieza por lo que quieres.", ir: "z2", confianza: 1 },
                    { texto: "Notas lo que ella no dice: tiene miedo de decepcionar a su padre.", ir: "z2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Hablas tú por ella: «Wren tiene algo que decir».", ir: "z2", confianza: -2 },
                ],
            },
            z2: {
                texto: "Wren se aclara la garganta. «Papá, mamá… tengo algo que contar. Me aceptaron en la escuela de medicina de la ciudad. Hace tres semanas. No dije nada porque… porque no sabía cómo.» La mesa se queda en silencio. La madre deja la cuchara. El padre, sin mover un músculo, mira el plato.",
                opciones: [
                    { texto: "Mantienes la calma y miras a Wren: lo hizo.", ir: "z3", confianza: 1 },
                    { texto: "Le sonríes: «Lo dijiste. Eso ya es lo más difícil».", ir: "z3", tecnica: "empatia", confianza: 2 },
                    { texto: "Rompes el silencio con una broma.", ir: "z3", confianza: -1 },
                ],
            },
            z3: {
                texto: "El padre habla con voz de piedra: «¿Y el molino? ¿Quién lo lleva? ¿Tu primo, que no sabe ni…? ¿Así pagas lo que hemos hecho por ti?» Wren titubea; tiene los ojos llenos de agua.",
                opciones: [
                    { texto: "Le murmuras: «Dile lo del relevo. Primero lo que cuidas, luego lo que quieres».", ir: "z4", confianza: 1 },
                    { texto: "Le recuerdas en voz baja: «No te justifiques de más. Di lo que has pensado».", ir: "z4", tecnica: "firmeza", confianza: 2 },
                    { texto: "Interrumpes: «Es una gran oportunidad, señor».", ir: "z4", confianza: -1 },
                ],
            },
            z4: {
                quien: WREN, texto: "Papá, no me voy a ir sin dejar el molino en buenas manos. Hablé con Tomás… y si quiere, se lo enseño todo antes de irme. Pero quiero ir. Quiero ser médica, y quiero que sea con su bendición, aunque no sé si la tendré.",
                opciones: [
                    { texto: "Dejas que el momento respire, sin interrumpir.", ir: "z5", confianza: 2 },
                    { texto: "Intervienes: «Estoy seguro de que lo entienden».", ir: "z5" },
                    { texto: "Te levantas, por la tensión.", ir: "z5", confianza: -1 },
                ],
            },
            z5: {
                texto: "Un silencio largo. Luego la madre estira la mano sobre la mesa y la pone sobre la de Wren: «Ya lo sabíamos. Te vimos sacar esa carta cien veces del abrigo. Solo esperábamos que nos lo dijeras tú.» El padre carraspea y se limpia la cara con la manga sana. «Tu abuela siempre dijo que alguien de esta familia tenía que ver más allá del río. Médica… mi hija, médica.»",
                opciones: [
                    { texto: "Le sonríes a Wren y te quedas en silencio: ahora es su momento con ellos.", ir: "ev", confianza: 2 },
                    { texto: "Propones un brindis.", ir: "ev", confianza: 1 },
                    { texto: "Dices que siempre supiste que sería así.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Esa tarde, después de comer, Wren y su padre salen al molino. Él le enseña la rueda, el cedazo, la piedra que él mismo talló; y ella le pregunta cosas como quien guarda un tesoro. En la puerta, Wren te agarra del brazo: «Pensé que me odiarían. Casi me quedo por ese pensamiento.» Se ríe, se seca los ojos. «Qué cosa más tonta: temer decir algo que ya sabían.»",
                leccion: "Muchas veces lo que tememos que piensen los demás no es lo que piensan. Decir la verdad con un plan —cómo cuidar lo que dejas— cambia la conversación.",
                tarea: "Dile a alguien cercano algo que temes que no le guste, con cariño y un plan",
            },
            regular: {
                fin: "regular",
                texto: "Wren dice lo que tenía que decir, pero se le va apagando la voz. Los padres escuchan con la cara tensa y prometen «pensarlo». No es un sí ni un no. La mesa se queda en silencio hasta el postre. Pero ya está dicho.",
                leccion: "A veces la primera reacción es tensa. Darle tiempo a la familia suele cambiar la segunda.",
            },
            mal: {
                fin: "mal",
                texto: "Wren se queda callada. Al final del almuerzo dice: «Nada, que está muy rico el guiso.» Te mira, avergonzada. La carta sigue en su abrigo. Otra semana de miedo la separa de la próxima mesa.",
                leccion: "No decir lo importante en el momento tiene un costo que se repite. Un empujón amable a tiempo ayuda; hablar por la persona, no.",
            },
        },
    },

    // ───────────────────────────── GASPAR · la Envidia (reconocer a un aprendiz) ─────────────────────────────
    "gaspar-1": {
        persona: "gaspar", titulo: "Las manos del aprendiz", requiere: [], espera: 0, inicio: "g1",
        nodos: {
            g1: {
                texto: "El taller de Gaspar huele a cedro y a barniz. En un rincón, un joven aprendiz, Nico, termina con paciencia una silla de respaldo curvo: es la mejor del taller, y los clientes de la plaza lo saben. Gaspar, cerca, lija una tabla con más fuerza de la necesaria y de vez en cuando le dice: «Ahí te falta pulir», «eso no se hace así». Siempre en el mismo tono: seco.",
                opciones: [
                    { texto: "Observas a los dos en silencio y le preguntas a Gaspar por su trabajo.", ir: "g2", confianza: 1 },
                    { texto: "Te fijas en lo que Gaspar nunca dice: no ha felicitado a Nico ni una vez.", ir: "g2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Qué buen aprendiz, Gaspar. Ya casi le pasa a usted.", ir: "g2", confianza: -2 },
                ],
            },
            g2: {
                quien: GASPAR, texto: "Es hábil, el muchacho. _Lo dice de mala gana._ Pero le falta oficio. Las sillas de respaldo curvo se piden mucho este año: es moda, ya pasará. Yo hago muebles de verdad, de los que duran cien años.",
                opciones: [
                    { texto: "¿Y cómo le va a usted con los pedidos?", ir: "g3", confianza: 1 },
                    { texto: "Debe ser raro ver a alguien que usted formó hacer algo que quizá usted no sabría hacer.", ir: "g3", tecnica: "empatia", confianza: 2 },
                    { texto: "Los muebles de verdad no pasan de moda.", ir: "g3", confianza: -1 },
                    { texto: "Yo también sentí miedo cuando alguien a quien ayudé me superó. Descubrí que dolía más callarlo que celebrarlo.", ir: "g3", valor: 2, confianza: 2 },
                ],
            },
            g3: {
                quien: GASPAR, texto: "Se me han caído tres encargos este mes. Tres. La gente va a la plaza y pregunta por la silla de Nico. _Lija con rabia._ Y yo le enseñé todo. ¡Todo! Hasta cómo agarrar el cepillo. ¿Y así me paga?",
                opciones: [
                    { texto: "¿Se lo ha dicho a él, lo de los encargos?", ir: "g4", confianza: 1 },
                    { texto: "Lo que usted le enseñó está en esa silla: cada curva es suya también.", ir: "g4", tecnica: "verdad", confianza: 2 },
                    { texto: "Es un desagradecido.", ir: "g4", confianza: -2 },
                ],
            },
            g4: {
                quien: GASPAR, texto: "_Se detiene y mira a Nico, a lo lejos._ Hace una cosa con el respaldo que yo no sé hacer. Se le ve en las manos: nació para esto. _Con voz muy baja._ Yo tardé veinte años en ser medio bueno.",
                opciones: [
                    { texto: "Entonces usted sabe lo que cuesta, y puede enseñarle lo que aún le falta: el oficio de tantos años.", ir: "g5", confianza: 2 },
                    { texto: "Es normal que le duela.", ir: "g5" },
                    { texto: "Si Nico lo supera, al menos le hará la silla de jubilado más bonita del valle.", ir: "g5", tecnica: "humor", confianza: 2 },
                ],
            },
            g5: {
                quien: GASPAR, texto: "_Suelta la lija._ Si le digo que es mejor que yo… ¿qué soy entonces? ¿Un carpintero viejo? ¿Un estorbo? ¿Qué le queda a un maestro cuando el alumno lo supera?",
                opciones: [
                    { texto: "Le queda lo que el alumno nunca tendrá: haber sido el primero que creyó en él.", ir: "ev", confianza: 2 },
                    { texto: "Le queda el título de maestro.", ir: "ev", confianza: 1 },
                    { texto: "Le queda envejecer tranquilo.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Gaspar deja la lija sobre el banco y cruza el taller con paso lento. Nico alza la vista, tenso: espera la crítica de siempre. «La curva del respaldo» —dice Gaspar, aclarándose la garganta—. «No la había visto nunca así. Enséñamela.» Nico parpadea, desconcertado; luego sonríe y le pasa la silla. Gaspar la gira, la mira de cerca. «Esto es de maestro» —murmura—. Y no sabes quién de los dos se emociona más.",
                leccion: "La envidia hacia quien nos supera esconde miedo a perder nuestro lugar. Convertirla en orgullo de maestro —«esto salió de mí»— la cura.",
                tarea: "Felicita hoy a alguien que te superó en algo, con una frase concreta",
            },
            regular: {
                fin: "regular",
                texto: "Gaspar no dice nada, pero esa tarde, sin darse cuenta, le pregunta a Nico cómo hizo el respaldo. Nico explica; Gaspar asiente con el ceño fruncido. Un comienzo torcido, pero comienzo.",
                leccion: "A veces la envidia se desarma preguntando, antes de poder felicitar.",
            },
            mal: {
                fin: "mal",
                texto: "Gaspar vuelve a su tabla. «Los jóvenes de hoy se creen genios» —masculla—. Nico, desde el rincón, baja la cabeza y sigue puliendo, en silencio. El taller huele a cedro y a algo que no es madera.",
                leccion: "Darle la razón a la envidia o llamar desagradecido a quien supera al maestro la alimenta. Reconocer el miedo que hay detrás ayuda más.",
            },
        },
    },

    "gaspar-2": {
        persona: "gaspar", titulo: "El cartel de la feria", requiere: ["gaspar-1"], espera: 1, inicio: "j1",
        nodos: {
            j1: {
                texto: "Día de feria en la plaza. El puesto del taller ofrece la silla de respaldo curvo de Nico, la más admirada, con una tarjeta que dice solo: «Taller de Gaspar». Gaspar, de pie junto a ella, tiene en la mano un cartel de madera nuevo y no se decide a colgarlo. «Pensaba poner el nombre de Nico» —dice—. «Y no me sale.»",
                opciones: [
                    { texto: "¿Qué pasaría si lo pusiera?", ir: "j2", confianza: 1 },
                    { texto: "Esperas a que termine de decir lo que se le atasca.", ir: "j2", tecnica: "escuchar", confianza: 1 },
                    { texto: "No lo ponga: su taller es lo que vende.", ir: "j2", confianza: -1 },
                ],
            },
            j2: {
                quien: GASPAR, texto: "Que la gente dirá «ah, el aprendiz es el bueno» y dejarán de entrar. Y si dejan de entrar, ¿qué soy? ¿El que firma lo que otro hace? _Aprieta el cartel._ Y si no lo pongo, soy el que se queda con lo de otro. Ya no sé cuál es peor.",
                opciones: [
                    { texto: "Quizá hay una tercera opción: que el taller sea de los dos.", ir: "j3", confianza: 2 },
                    { texto: "Está atrapado entre dos miedos: perder su lugar y perder su propia mirada.", ir: "j3", tecnica: "empatia", confianza: 2 },
                    { texto: "Elija la que le salga más barata.", ir: "j3", confianza: -1 },
                ],
            },
            j3: {
                quien: GASPAR, texto: "¿De los dos? _Sorprendido._ «Taller de Gaspar y Nico»… No. «Gaspar y…» _Calla._ No sé decirlo. Nunca compartí un cartel.",
                opciones: [
                    { texto: "Pruebe a decirlo en voz alta, hasta que suene a usted.", ir: "j4", confianza: 1 },
                    { texto: "Compartir el cartel no lo hace menos maestro: lo hace el maestro que formó a un buen carpintero.", ir: "j4", tecnica: "verdad", confianza: 2 },
                    { texto: "Mejor póngale un cartel pequeño.", ir: "j4" },
                ],
            },
            j4: {
                texto: "Nico se acerca, titubeante. «Maestro, no hace falta, de verdad. Yo… sin usted no habría aprendido a…» Se le traba la voz. «Todo lo que sé es de este taller.» Gaspar lo mira como si lo viera por primera vez.",
                opciones: [
                    { texto: "Le dices a Gaspar: «Nico acaba de decir lo que usted necesitaba oír. Escúchelo».", ir: "j5", confianza: 1 },
                    { texto: "Le dices a Gaspar en voz baja que el momento es ahora.", ir: "j5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Le dices a Nico que se calle.", ir: "j5", confianza: -2 },
                ],
            },
            j5: {
                quien: GASPAR, texto: "_Cuelga el cartel de un martillazo seco: «Taller de Gaspar y Nico»._ Está torcido. Lo enderezo. _Ríe, nervioso._ ¿Y ahora qué hago con estas manos, que no se quedan quietas?",
                opciones: [
                    { texto: "Dele la mano a Nico.", ir: "ev", confianza: 2 },
                    { texto: "Dígale: «Buen trabajo».", ir: "ev", confianza: 1 },
                    { texto: "Vaya a comer algo: está nervioso.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Gaspar le tiende la mano a Nico y Nico, en vez de estrecharla, lo abraza con torpeza, como quien abraza a un padre sin saber cómo. Esa tarde una clienta pregunta por el respaldo curvo y Gaspar, sin que nadie se lo pida, la lleva de la mano hasta el rincón donde Nico trabaja. «Aquí lo hacemos» —le dice—. «Los dos.»",
                leccion: "Reconocer en público el mérito de otro no te quita nada: dice algo bueno de ti. Quien comparte el crédito suele recibir más confianza, no menos.",
                tarea: "Reconoce en público el mérito de alguien, con su nombre y un hecho concreto",
            },
            regular: {
                fin: "regular",
                texto: "Gaspar cuelga el cartel con los dos nombres, pero no vuelve a mirarlo en todo el día. Nico sonríe de lado. El abrazo queda pendiente; pero el cartel dice lo que dice.",
                leccion: "Hacer lo correcto con torpeza sigue siendo hacerlo. El resto se afina con el tiempo.",
            },
            mal: {
                fin: "mal",
                texto: "Gaspar guarda el cartel en un cajón. «Otro año» —dice, y repite la tarjeta de siempre—. Nico baja la mirada. El respaldo curvo sigue siendo lo más admirado de la feria, pero la tarjeta lleva un solo nombre.",
                leccion: "Apropiarse del mérito ajeno corroe más al que lo hace que al que lo pierde. A veces solo hace falta un cartel para cambiarlo.",
            },
        },
    },
};
