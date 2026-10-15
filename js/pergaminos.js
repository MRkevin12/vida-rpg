// pergaminos.js — La Biblioteca prohibida: los pergaminos de la historia, en orden (v57).
//
// «La primera piedra» (pergamino.js) fue el primero. Aquí están los que siguen: cada uno lo escribió alguien distinto
// (Ander, Casio, una cartógrafa, un Vigía sin nombre, una herrera…), cuenta un trozo más del mundo y deja una moraleja
// para los días difíciles. Se abren EN ORDEN: hace falta haber leído el anterior y haber llegado a cierto punto del juego
// (misiones, jefes, el mapa, la Torre, la Mazmorra, la aldea, la saga). Al terminar de leer uno se cuenta en una cinemática,
// da un pequeño premio (una sola vez) y queda anotado en estado.pergaminos.leidos = { id: "2026-10-15" }.
//
// Cada uno termina con un PRESAGIO: algo que queda sin explicar. Son los hilos de las sagas que vendrán cuando termines
// la Saga de la Llama (ver SAGAS_FUTURAS): hoy se anuncian, todavía no se juegan.
//
// Todo es TEXTO PLANO (vistas.js lo escapa). {n} es el nombre de tu héroe (solo en el último). Este archivo no dibuja ni guarda.

import * as primera from "./pergamino.js";
import * as mapa from "./mapa.js";
import * as campana from "./campana.js";
import * as voces from "./voces.js";
import * as saga from "./saga.js";

// Lo que se gana al terminar de leer uno por primera vez.
export const PREMIO_LECTURA = { xp: 30, gemas: 15 };

// Los pergaminos nuevos (el primero, «La primera piedra», sale de pergamino.js).
const NUEVOS = [
    {
        id: "juramento", titulo: "El juramento de los Vigías",
        subtitulo: "Escrito por Ander, el cantero. Hallado dentro de un yelmo viejo, en la cripta de la Torre.",
        condicion: { tipo: "misiones", valor: 5, texto: "cumple 5 misiones" },
        prologo: [
            "Yo no subí a la Torre: yo corté sus piedras. Pero vi nacer a los Vigías desde abajo, y quien corta la piedra sabe mejor que nadie qué aguanta y qué se rompe. Esto es lo que vi.",
        ],
        capitulos: [
            {
                titulo: "La única regla",
                parrafos: [
                    "Cuando la Torre ya se veía desde todo el valle, empezó a llegar gente que quería ayudar a mi hija. Eran muchos y todos con buenas intenciones, y Lía tuvo miedo de que la torre se convirtiera en una feria. Así que puso una sola regla para quien quisiera subir.",
                    "No pidió fuerza ni talento. Pidió una frase, dicha en voz alta, delante de alguien: «Subiré un piso hoy, aunque sea pequeño. Y si un día no lo subo, lo diré». Eso fue todo el juramento.",
                ],
            },
            {
                titulo: "Por qué en voz alta",
                parrafos: [
                    "Yo no lo entendía. Le dije: «Hija, ¿qué más da? Quien quiere cumplir cumple, y quien no, no». Lía me respondió con algo que todavía me da vueltas: «Padre, las promesas que nadie oye son las primeras que se rompen. No porque seamos malos, sino porque no hay quien nos las recuerde».",
                    "Y tenía razón. Vi a muchos fallar un día. Los que lo decían al día siguiente, avergonzados pero sinceros, volvían a subir. Los que se lo callaban acababan callando también el motivo de bajar la mirada, y a los pocos meses ya no estaban.",
                ],
            },
            {
                titulo: "Los doce nombres",
                parrafos: [
                    "Los primeros doce que juraron grabaron sus nombres en la piedra del primer piso. Yo los grabé, uno por uno, con mi propio cincel. Doce nombres, doce frases, doce miradas nerviosas.",
                    "Hoy, cuando paso la mano por esa piedra, noto algo extraño: hay un nombre que alguien raspó con un cuchillo, hasta dejarlo liso. No me acuerdo de quién era. Me da miedo preguntar.",
                ],
            },
        ],
        ensenanzas: [
            "Lo que se promete en voz alta pesa más que lo que se piensa en silencio.",
            "Decir «hoy falté» no es una derrota: es la forma de volver.",
            "Nadie sube solo del todo: alguien que te recuerde tu palabra vale más que cien ganas.",
        ],
        moraleja: "Una promesa que alguien escucha es una promesa que se cumple.",
        presagio: "En la piedra del primer piso hay un nombre raspado hasta dejarlo liso. Ander no recuerda de quién era… y le da miedo preguntar.",
        escena: {
            fondo: "pintura:salon", ambiente: "chispas",
            lineas: [
                "En la piedra del primer piso hay doce nombres. Cada uno es una frase dicha en voz alta.",
                "Los que decían «hoy falté» al día siguiente volvían a subir. Los que callaban, no.",
            ],
        },
    },
    {
        id: "hermanas", titulo: "Las hermanas de la niebla",
        subtitulo: "Escrito por Lía, ya anciana. Hallado entre las páginas de un libro de cuentas de la Biblioteca prohibida.",
        condicion: { tipo: "jefes", valor: 1, texto: "vence a tu primer jefe" },
        prologo: [
            "Los niños del valle preguntan por qué hay cuatro Sombras y no una sola. Les respondo lo que me enseñó la niebla: porque lo que nos detiene tiene muchas caras, pero una sola madre.",
        ],
        capitulos: [
            {
                titulo: "Cuatro caras",
                parrafos: [
                    "Cuando llegué a la cima y vi la niebla desde arriba, descubrí que no era una sola cosa. Había cuatro corrientes, tan juntas que desde abajo parecían una. Una pesaba en el cuerpo: la que susurra «hoy no tengo fuerzas». Otra pesaba en la cabeza: la que dice «todavía no sé lo suficiente». La tercera se metía en la garganta: «mejor no digo nada». Y la cuarta, en el bolsillo: «esto es mucho para lo que tengo».",
                    "Con el tiempo las llamamos las Cuatro Sombras: la del Cuerpo, la de la Mente, la de la Voz y la del Tesoro. Ninguna es un monstruo. Cada una es una excusa que se hizo costumbre.",
                ],
            },
            {
                titulo: "La madre",
                parrafos: [
                    "Lo más importante lo supe tarde. Las cuatro tienen la misma madre, y la oí nombrar mil veces en el valle sin saber que hablaban de ella: «Mañana». «Mañana será otro día», decían los niños antes de aprender su propio nombre. El Mañana no es una Sombra que grite ni que ataque. Es la que hace que todas las demás tengan de qué comer.",
                    "Cada «mañana» que alguien dice de verdad y no cumple es una cucharada para una de las cuatro. Cada «hoy» que se cumple, aunque sea pequeño, las deja sin su madre un día más.",
                ],
            },
            {
                titulo: "Cómo se las deja sin comer",
                parrafos: [
                    "No se les gana peleando. Lo intenté al principio y me cansé: eran cuatro, eran fuertes y volvían cada mañana. Se les gana de otro modo: no alimentándolas. Una piedra al día es una cucharada menos. Parece poco. Pero una Sombra con hambre se vuelve pequeña, y una Sombra pequeña, vista desde arriba, es solo niebla.",
                    "Les escribo esto a los que vengan: no odien a las Sombras. Son lo que queda de todas las veces que dudamos. Ódienlas menos y no las alimenten más.",
                ],
            },
        ],
        ensenanzas: [
            "Lo que te detiene tiene muchas caras, pero casi siempre la misma raíz: dejarlo para mañana.",
            "Un «hoy» cumplido deja sin comer a todas tus Sombras a la vez.",
            "No se vence a una costumbre peleando contra ella, sino dejando de alimentarla.",
        ],
        moraleja: "Lo que no alimentas, se encoge.",
        presagio: "Las Cuatro Sombras tienen una madre: el Mañana. Lía nunca dijo dónde duerme. Solo escribió: «Bajo la Torre hay un pozo, y no es de agua».",
        escena: {
            fondo: "pintura:bosque", ambiente: "niebla",
            lineas: [
                "Desde la cima, la niebla no era una sola cosa: eran cuatro corrientes tan juntas que parecían una.",
                "Todas tenían la misma madre. No gritaba ni atacaba. Se llamaba Mañana.",
            ],
        },
    },
    {
        id: "mapa", titulo: "El mapa que Lía no terminó",
        subtitulo: "Dibujado y escrito por Nera, la cartógrafa. Hallado enrollado dentro de un tubo de bronce, en el Bosque de las Dudas.",
        condicion: { tipo: "region", valor: 1, texto: "llega a la segunda región del mapa" },
        prologo: [
            "Soy Nera. Dibujo mapas. Lía me pidió uno de lo que se veía desde la cima, y es el único trabajo de mi vida que no pude terminar. No por falta de tinta: por falta de mundo conocido.",
        ],
        capitulos: [
            {
                titulo: "Lo que se veía desde arriba",
                parrafos: [
                    "La primera tarde que subí, la niebla estaba bajo mis pies y el horizonte se abría como una página en blanco. Dibujé el valle, el río, la ladera de la cantera. Y entonces, más lejos de lo que mi tinta alcanzaba, vi otras nieblas.",
                    "Eran seis. Seis valles, cada uno bajo su propia capa gris, repartidos como las puntas de una estrella. Y en cada uno, muy pequeña, titilando, algo que no podía ser sino una luz.",
                ],
            },
            {
                titulo: "Las seis luces",
                parrafos: [
                    "Se lo conté a Lía. Se quedó callada un rato y luego dijo: «Alguien más subió». No lo dijo con tristeza ni con celos. Lo dijo como quien encuentra, de pronto, a alguien que camina en su misma dirección.",
                    "Esa noche encendió una segunda hoguera, más grande, para que desde los otros valles supieran que aquí también había alguien. A la tercera noche, desde el valle del este, respondieron con una luz parpadeante. Dos destellos, una pausa, dos destellos. Era un saludo.",
                ],
            },
            {
                titulo: "El fuego que se comparte",
                parrafos: [
                    "Con los años, viajeros de los seis valles llegaron a nuestra Torre y se llevaron de vuelta brasas de la Llama, envueltas en barro y musgo. Con ellas encendieron sus propias hogueras. Descubrimos algo hermoso: la Llama no se gasta al repartirla. Cada brasa que se lleva alguien deja la Llama intacta y enciende otra.",
                    "No terminé el mapa porque nunca se termina: cada vez que alguien enciende una luz nueva, hay que dibujar un punto más. Hoy dejo el pergamino con un espacio vacío en el centro, donde irá lo que aún no sabemos.",
                ],
            },
        ],
        ensenanzas: [
            "Mientras subes, otros suben en lugares que no ves. No estás tan solo como crees.",
            "El fuego (el ánimo, el ejemplo) se comparte sin gastarse.",
            "Un mapa útil deja espacio en blanco para lo que todavía no sabes.",
        ],
        moraleja: "Tu luz no se gasta al encender la de otro.",
        presagio: "Eran seis valles con seis luces. Cuando la Llama de la Torre se apagó, hace cien años, las seis luces se apagaron también… una tras otra, en el mismo mes.",
        escena: {
            fondo: "pintura:camino", ambiente: "chispas",
            lineas: [
                "Desde la cima, más allá de la niebla del valle, titilaban seis luces diminutas.",
                "Lía encendió otra hoguera. Desde el valle del este respondieron: dos destellos, una pausa, dos destellos.",
            ],
        },
    },
    {
        id: "casio", titulo: "El diario de Casio",
        subtitulo: "Escrito por Casio, el último Vigía, la noche antes de la tormenta. Hallado en la Torre, bajo una antorcha apagada.",
        condicion: { tipo: "torre", valor: 10, texto: "sube la Torre hasta el piso 10" },
        prologo: [
            "No sé si alguien leerá esto. Lo escribo porque Aurelio, mi aprendiz, me preguntó hoy por qué no tengo miedo, y le mentí. Se lo debo en papel.",
        ],
        capitulos: [
            {
                titulo: "Lo que está debajo",
                parrafos: [
                    "Hace años descubrí por qué la Torre es tan alta y tiene tantos pisos: no se hizo para mirar el cielo. Lía la levantó encima de algo, para taparlo. Bajo el primer piso, más hondo que cualquier cantera, hay un pozo. De ahí sube un frío que no es de la tierra.",
                    "Allí duerme la madre de las Sombras, la que Lía llamó el Mañana. La Torre es la tapa. La Llama de la cima es el peso que la mantiene cerrada: mientras arde, el pozo duerme.",
                ],
            },
            {
                titulo: "La Llama que tiembla",
                parrafos: [
                    "Esta semana la Llama ha empezado a temblar. Los viejos libros no dicen por qué. Quizá porque pasan años sin que suban Vigías nuevos, quizá porque los de ahora ya no juran en voz alta. No lo sé. Solo sé que si se apaga, el pozo se abre.",
                    "Mañana subiré a la cima a protegerla. Le dije a Aurelio que me esperara abajo. No le dije que, si la tormenta me atrapa, no pienso bajar. Hay cosas que se cuidan con el cuerpo, y la Llama es una de ellas.",
                ],
            },
            {
                titulo: "Lo que quiero que sepa Aurelio",
                parrafos: [
                    "Aurelio: si lees esto, es que no bajé. No te enfades conmigo ni contigo. Cuidar una luz también es subir, aunque desde abajo parezca quedarse quieto. Y no te quedes tú quieto esperándome: sigue subiendo un piso cada día, como te enseñé.",
                    "Y si algún día encuentras a alguien que suba por costumbre y no por gloria, dale mi armadura celeste. No pesa tanto como parece. Pesa lo que pesa lo que uno decide cuidar.",
                ],
            },
        ],
        ensenanzas: [
            "No todo avance es subir: cuidar lo que ya tienes también es avanzar.",
            "Lo importante se protege con constancia, no con grandes gestos.",
            "Quien te espera arriba no quiere que te quedes abajo esperándolo.",
        ],
        moraleja: "Cuidar una luz también es subir.",
        presagio: "Bajo la Torre hay un pozo, y la Llama era su tapa. Casio escribió que, si se apagaba, el pozo se abriría. Y la Llama lleva cien años apagada…",
        escena: {
            fondo: "pintura:torre", ambiente: "niebla",
            lineas: [
                "La noche antes de la tormenta, Casio escribió en un papel lo que no se atrevió a decir.",
                "«Cuidar una luz también es subir», escribió. Y se puso la armadura celeste.",
            ],
        },
    },
    {
        id: "nombre", titulo: "El nombre raspado",
        subtitulo: "Sin firma. Hallado en el fondo de la Mazmorra, enrollado alrededor de una linterna rota.",
        condicion: { tipo: "mazmorra", valor: 5, texto: "baja hasta el sótano 5 de la Mazmorra" },
        prologo: [
            "Nadie quiso firmar este pergamino, y yo tampoco. Si lo firmara tendría que decir el nombre que le raspamos a la piedra. Por eso lo cuento así, sin nombre, como se cuentan las cosas de las que uno se avergüenza.",
        ],
        capitulos: [
            {
                titulo: "El mejor de los doce",
                parrafos: [
                    "Se llamaba Orrin, y fue el mejor de los doce primeros Vigías. Subía más rápido que nadie, escribía mejor que nadie y tenía una risa que se oía desde la cantera. Fue el primero en pasar el piso cien, y el que más veces gritó: «¡Ya casi!».",
                    "Si hubiera que apostar por quién sería el último en rendirse, todos habríamos apostado por él.",
                ],
            },
            {
                titulo: "Solo un día",
                parrafos: [
                    "Un invierno estaba cansado. Pidió descansar un día. Todos le dijimos que sí, porque se lo había ganado. Pero Orrin no dijo «hasta mañana»: dijo «solo un día». Y como no puso fecha de vuelta, el día no terminó.",
                    "Al siguiente dijo «un día más». Después, «cuando pase el frío». Después, «cuando tenga ganas». Cada vez, una razón nueva y razonable. Nadie podía decirle que no, porque cada razón, sola, era verdad.",
                ],
            },
            {
                titulo: "Lo que llena el vacío",
                parrafos: [
                    "Cuando quisimos darnos cuenta, Orrin ya no subía. Ni siquiera bajaba: se quedaba. Se fue quedando, como se queda un recipiente sin tapa: sin ruido, sin dolor, un poco más vacío cada día. La risa se le apagó primero. Después, las ganas de explicar por qué. Al final, hasta el nombre.",
                    "No cayó por un gran fallo. Cayó por mil pequeños descansos sin fecha de regreso. Escribo esto para que los que vengan sepan distinguir: descansar es parar con la fecha de vuelta escrita. Rendirse es parar sin escribirla.",
                ],
            },
        ],
        ensenanzas: [
            "Descansar es parar con fecha de vuelta. Rendirse es parar sin ponerla.",
            "Nadie se rinde de golpe: se rinde en mil «solo un día» que parecían razonables.",
            "Los mejores también pueden quedarse. La constancia no es talento: es volver.",
        ],
        moraleja: "Cuando descanses, escribe el día en que vuelves.",
        presagio: "El Rey Hueco tuvo un nombre y una risa que se oía desde la cantera. Su linterna sigue encendida en el fondo… y alguien, en la oscuridad, sigue esperando que se la devuelvan.",
        escena: {
            fondo: "abismo", ambiente: "niebla",
            lineas: [
                "Orrin no se rindió de golpe: pidió «solo un día», y no puso fecha de vuelta.",
                "Cuando descanses, escribe el día en que vuelves. Eso es lo que lo separa de rendirse.",
            ],
        },
    },
    {
        id: "voz", titulo: "La carta de Maren",
        subtitulo: "Escrita por Maren, la herrera de la aldea, a quien no conoce. Hallada clavada en la puerta de la fragua.",
        condicion: { tipo: "voces", valor: 3, texto: "ayuda a tres personas de la aldea a recuperar su voz" },
        prologo: [
            "No sé quién eres, pero sé que has hablado con la gente de la aldea. Por eso te escribo a ti. Yo sola no habría podido, y esa es justo la lección.",
        ],
        capitulos: [
            {
                titulo: "El orgullo de cargar sola",
                parrafos: [
                    "Durante años creí que ser fuerte era no pedir nada. Golpeaba el hierro de sol a sol y cuando algo pesaba demasiado, lo cargaba sola, aunque me temblaran los brazos. «Yo puedo», decía. Y era verdad: podía. Eso es lo peligroso del orgullo, que casi siempre tiene razón.",
                    "No me di cuenta de que me estaba quedando muda. No porque la Sombra de la Voz me hubiera cortado la lengua, sino porque cada vez que una frase como «¿me ayudas?» me subía a la garganta, yo la tragaba.",
                ],
            },
            {
                titulo: "La primera palabra",
                parrafos: [
                    "Una tarde, alguien se sentó junto a mi yunque y no me preguntó nada, solo escuchó. Y la frase se me salió sola: «Estoy cansada». Dos palabras. Se me llenaron los ojos, y no de tristeza: de alivio. Como si hubiera dejado, por fin, una piedra enorme.",
                    "Esa persona no me arregló nada. No hizo falta. Solo estuvo. Y yo aprendí que pedir ayuda no es admitir que eres débil. Es reconocer que las cosas importantes se levantan entre varios, como la Torre.",
                ],
            },
            {
                titulo: "Lo que se dice se vuelve piedra",
                parrafos: [
                    "Ahora, cada vez que alguien de la aldea recupera su voz, siento un golpe en el pecho, como el del martillo. He llegado a pensar que cada cosa que se dice en voz alta es una piedra puesta en la Torre. No hay torre sin piedras. Y no hay piedras sin alguien que las diga.",
                    "Si tú también cargas algo solo, haz lo que yo tardé tanto en hacer: dilo. A quien sea, aunque tiemble. Es la piedra más difícil de poner y la que más sostiene.",
                ],
            },
        ],
        ensenanzas: [
            "Pedir ayuda no es debilidad: es la única forma de levantar lo muy pesado.",
            "El orgullo casi siempre tiene razón en lo pequeño y se equivoca en lo importante.",
            "Lo que se dice en voz alta deja de pesar sobre una sola persona.",
        ],
        moraleja: "Decir «necesito ayuda» también es poner una piedra.",
        presagio: "Maren no es la única que perdió la voz. En el camino de los seis valles, cuentan, hay aldeas enteras que llevan cien años sin hablar. Aldeas que no tienen un Aurelio que las escuche.",
        escena: {
            fondo: "pintura:aldea", ambiente: "chispas",
            lineas: [
                "Durante años Maren cargó sola lo más pesado. «Yo puedo», decía. Y era verdad.",
                "Un día alguien se sentó junto a su yunque. Ella dijo dos palabras: «Estoy cansada». Y se sintió más ligera.",
            ],
        },
    },
    {
        id: "brasas", titulo: "Lo que arde después",
        subtitulo: "Escrito por Aurelio, para quien encienda la Llama. Sellado desde hace cien años; solo se abre con el fuego de los memoriales.",
        condicion: { tipo: "saga", valor: 1, texto: "enciende la Llama de los Vigías (completa la Saga)" },
        prologo: [
            "Lo escribí hace cien años, el día que Casio no bajó. Lo sellé con cera y le puse una condición: que solo se abriera cuando la Llama ardiera otra vez. Si lo lees, es que ocurrió. Y entonces, {n}, quiero decirte algo.",
        ],
        capitulos: [
            {
                titulo: "Lo que no te dije",
                parrafos: [
                    "Te dije que el objetivo era volver a encender la Llama. Era verdad, pero no era todo. Encenderla no era llegar: era cerrar el pozo un tiempo más. Un tiempo, no para siempre. Lo que duerme bajo la Torre no se mata: se mantiene dormido, con la misma constancia con que se mantuvo dormido hace siglos.",
                    "Por eso la Llama no es un trofeo. Es una tarea. Cada día, alguien tiene que seguir poniendo su piedra.",
                ],
            },
            {
                titulo: "Los seis valles",
                parrafos: [
                    "Seguro ya leíste el mapa de Nera: seis valles, seis luces. Cuando nuestra Llama se apagó, las seis se apagaron también. No es casualidad: todas nacieron de una brasa de esta. Y en alguno de esos valles hay Torres como la nuestra, con Llamas como la nuestra, y gente que, como tú, está esperando que alguien lleve el fuego.",
                    "Ahora tienes brasas. Tu constancia no solo alumbra tu valle: puede llegar más lejos de lo que alcanza tu vista.",
                ],
            },
            {
                titulo: "La pregunta final",
                parrafos: [
                    "Cien años estuve esperando a alguien que pudiera. Y ahora que llegaste, descubro que lo importante nunca fue que alguien pudiera: fue que alguien volviera cada día. Eso fue Lía. Eso fue Casio, aunque no bajara. Eso eres tú.",
                    "Cuando termines de leer esto, la saga habrá terminado. Pero tu camino, no. Los caminos largos no se cierran: cambian de nombre. Mañana tienes una piedra. Hoy también. Ya sabes cómo se sube.",
                ],
            },
        ],
        ensenanzas: [
            "Llegar a la meta no es el final: es el momento de decidir cuál es la siguiente.",
            "Lo que se construye con constancia se mantiene con constancia.",
            "Tu ejemplo puede encender luces que ni siquiera ves.",
        ],
        moraleja: "Terminar un camino es empezar el siguiente.",
        presagio: "Seis valles, seis luces apagadas, un pozo dormido y una aldea sin voz al otro lado de la niebla. La Saga de la Llama terminó. La de las Brasas está por escribirse.",
        escena: {
            fondo: "pintura:aurora", ambiente: "chispas",
            lineas: [
                "Cien años estuvo sellado este pergamino, esperando que la Llama ardiera.",
                "La Llama no era un trofeo: era una tarea. Y la tarea, desde hoy, también es tuya.",
            ],
        },
    },
];

// Las sagas que vendrán (solo se anuncian: todavía no se juegan). requiere = los pergaminos que hay que haber leído.
export const SAGAS_FUTURAS = [
    { id: "madre", icono: "🕳️", titulo: "La Madre de las Sombras", requiere: ["hermanas", "casio"],
      texto: "Bajo la Torre duerme el Mañana, la madre de las Cuatro Sombras. Mientras la Llama arda, duerme. ¿Qué pasa cuando alguien baja hasta su pozo?" },
    { id: "brasas", icono: "🔥", titulo: "Las Brasas de los seis valles", requiere: ["mapa", "brasas"],
      texto: "Seis valles, seis luces apagadas. Con el fuego de tu Llama, un Vigía puede volver a encenderlas, una por una." },
    { id: "hueco", icono: "👑", titulo: "La linterna de Orrin", requiere: ["juramento", "nombre"],
      texto: "El Rey Hueco tuvo un nombre y una risa. Su linterna sigue encendida en el fondo, esperando que alguien se la devuelva." },
    { id: "aldea", icono: "🗣️", titulo: "La aldea sin nombre", requiere: ["voz", "brasas"],
      texto: "Al otro lado de la niebla hay aldeas que llevan cien años sin hablar, y ningún Aurelio que las escuche." },
];

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// El primero, «La primera piedra», con el mismo formato que los demás.
function primero(nombre) {
    const p = primera.pergaminoPara(nombre);
    return {
        id: "piedra", titulo: p.titulo, subtitulo: p.subtitulo,
        condicion: { tipo: "siempre", valor: 0, texto: "" },
        prologo: p.prologo,
        capitulos: p.capitulos.map((c) => ({ titulo: c.titulo, parrafos: c.parrafos })),
        ensenanzas: p.ensenanzas,
        cierre: p.dedicatoria, firma: p.firma,
        moraleja: "Tu primera piedra no es la de ayer ni la de mañana: es la de hoy.",
        presagio: "En la última página, Lía dibujó un camino que sale del valle y se pierde en la niebla. No lo terminó: dejó un espacio en blanco.",
        escena: {
            fondo: "pintura:aldea", ambiente: "chispas",
            lineas: [
                "Una niña puso una piedra en una colina, un día cualquiera. Nadie la vio.",
                "De esa piedra salió una Torre, una Llama y los Vigías. Todo empezó con una sola piedra.",
            ],
        },
    };
}

// Todos, en orden, con el nombre puesto: [{ id, numero, titulo, subtitulo, condicion, prologo, capitulos, ensenanzas, cierre, firma,
//   moraleja, presagio, escena, minutos }]
export function todosLosPergaminos(nombre) {
    const poner = (texto) => texto.replaceAll("{n}", nombre);
    const lista = [primero(nombre), ...NUEVOS.map((p) => ({
        ...p,
        prologo: p.prologo.map(poner),
        capitulos: p.capitulos.map((c) => ({ titulo: c.titulo, parrafos: c.parrafos.map(poner) })),
        cierre: [], firma: "",
    }))];
    return lista.map((p, i) => ({ ...p, numero: ROMANOS[i], minutos: minutosDe(p) }));
}

export const pergaminoDe = (id, nombre) => todosLosPergaminos(nombre).find((p) => p.id === id) || null;

export const IDS = ["piedra", ...NUEVOS.map((p) => p.id)];

// Unas 200 palabras por minuto, leyendo con calma.
export function minutosDe(p) {
    const texto = [...p.prologo, ...p.capitulos.flatMap((c) => c.parrafos), ...p.ensenanzas, ...(p.cierre || [])].join(" ");
    return Math.max(1, Math.round(texto.split(/\s+/).filter(Boolean).length / 200));
}

// Lo que hace falta saber de la partida para abrir cada pergamino (lo calcula app.js / vistas.js).
//   datos = { leidos: { id: fecha }, completadas, derrotados, region, torre (tu récord), mazmorra (tu récord), voces (recuperadas), saga (true si terminó) }
export function cumpleCondicion(condicion, datos) {
    const valor = {
        siempre: 1, misiones: datos.completadas, jefes: datos.derrotados, region: datos.region,
        torre: datos.torre, mazmorra: datos.mazmorra, voces: datos.voces, saga: datos.saga ? 1 : 0,
    }[condicion.tipo] ?? 0;
    return valor >= (condicion.valor || 0);
}

// Saca de la partida lo que cuenta para abrir los pergaminos.
export function datosDePartida(estado) {
    const campanas = campana.estadoCampanas(estado);
    const records = estado.arcade?.records || {};
    return {
        leidos: estado.pergaminos?.leidos || {},
        completadas: estado.completadas.length,
        derrotados: Object.values(campanas).reduce((suma, c) => suma + (c.derrotados || 0), 0),
        region: mapa.posicion(estado).region,
        torre: records.torre || 0,
        mazmorra: records.mazmorra || 0,
        voces: voces.progreso(estado).hechas,
        saga: saga.estadoDeSaga(saga.datosDeSaga(estado, campanas)).completada,
    };
}

// El estado de toda la biblioteca. Se abren en orden: hace falta haber leído el anterior Y cumplir la condición.
// Devuelve { pergaminos: [{ ...p, abierto, leido, falta (texto) }], leidos (cuántos), total, siguiente (id del próximo por leer o null) }
export function estadoDeBiblioteca(nombre, datos) {
    const lista = todosLosPergaminos(nombre);
    let anteriorLeido = true;
    const pergaminos = lista.map((p) => {
        const leido = Boolean(datos.leidos?.[p.id]);
        const cumple = cumpleCondicion(p.condicion, datos);
        const abierto = anteriorLeido && cumple;
        let falta = "";
        if (!abierto) {
            const partes = [];
            if (!anteriorLeido) partes.push("lee el pergamino anterior");
            if (!cumple) partes.push(p.condicion.texto);
            falta = partes.join(" y ");
            falta = falta.charAt(0).toUpperCase() + falta.slice(1) + ".";
        }
        anteriorLeido = leido;
        return { ...p, abierto, leido, falta };
    });
    const siguiente = pergaminos.find((p) => p.abierto && !p.leido)?.id || null;
    return { pergaminos, leidos: pergaminos.filter((p) => p.leido).length, total: pergaminos.length, siguiente };
}

// Las sagas futuras con lo que ya se insinuó: se «abren» a medida que lees los pergaminos que las anuncian.
export function sagasFuturas(leidos) {
    return SAGAS_FUTURAS.map((s) => ({ ...s, insinuada: s.requiere.every((id) => leidos?.[id]), pistas: s.requiere.filter((id) => leidos?.[id]).length }));
}
