// fragua.js — Las lecturas de la Fragua (v69): siete textos de Maren, la herrera de la aldea, para quien entrena.
//
// Se abren con el NIVEL DE GYM (ver gym.js) y se leen en la pantalla del Gimnasio. Cada una habla de algo que le pasa
// de verdad a quien entrena: el primer día, el descanso, subir de a poco, el estancamiento, el dolor, la constancia y
// para qué sirve la fuerza. Es texto plano (vistas-gym.js lo escapa). Este archivo no dibuja ni guarda nada.
//
// Maren es la herrera de «Las Voces del Valle» (voces-datos.js); su fragua es la de la aldea, la que arde bajo la Torre.

export const LECTURAS = [
    {
        nivel: 1,
        titulo: "El hierro no pide permiso",
        parrafos: [
            "El primer día que fui a la fragua de mi tía, el martillo me pesaba más que un yunque. Lo levanté tres veces y se me cayó. Ella no dijo nada. Lo recogió, me lo puso otra vez en la mano y volvió a su trabajo.",
            "Con los años entendí lo que me enseñó aquella mañana: el hierro no pide permiso ni espera a que tengas ganas. No le importa si dormiste mal, si tu madre te regañó o si afuera llueve. Está ahí, frío y pesado, y lo único que le habla es el que llega.",
            "Por eso, a quien empieza le digo siempre lo mismo: el primer día es el más difícil, y no por el peso. Es difícil porque todavía no eres alguien que va. Cada vez que vienes, aunque rindas poco, te vas pareciendo un poco más a esa persona. Un día miras atrás y descubres que ya eres ella, y que nadie te lo dijo.",
            "No me traigas hoy tu mejor trabajo. Tráeme tu presencia. Lo demás se forja solo, golpe a golpe.",
        ],
        moraleja: "Llegar es la mitad del trabajo, y la mitad que más cuesta.",
    },
    {
        nivel: 2,
        titulo: "Calor y descanso",
        parrafos: [
            "Un herrero joven cree que el acero se hace con fuego. Pasa los años aprendiendo que se hace con fuego y con agua. Hay que calentarlo hasta que cante, golpearlo, y después hundirlo en el agua fría, y esperar. Si lo golpeas sin parar, se parte. Si lo enfrías sin haberlo calentado, se rompe. Es el vaivén lo que lo hace fuerte.",
            "Tuve un aprendiz, Teo, que tenía más ganas que nadie. Venía todos los días, a todas horas, y golpeaba hasta que le sangraban las manos. Decía que descansar era para los flojos. Su primera hoja se quebró al tercer golpe, y no entendió por qué. «Si trabajé más que todos», me decía.",
            "Le expliqué lo que ahora te explico: el cuerpo funciona igual que el acero. Lo que haces en la sala es el fuego; lo que haces después, comer, dormir, no hacer nada, es el agua. Los músculos no crecen mientras levantas: crecen mientras descansas de haber levantado. Quien se salta el descanso no está trabajando más: está rompiéndose más despacio.",
            "Los días que no entrenas también forman parte del entrenamiento. Tómalos en serio, como tomas los otros.",
        ],
        moraleja: "El descanso no es lo contrario del esfuerzo: es la mitad que lo vuelve útil.",
    },
    {
        nivel: 4,
        titulo: "Una pizca más",
        parrafos: [
            "Una hoja buena no sale de un golpe enorme. Sale de mil golpes pequeños, doblando el metal sobre sí mismo una vez, y otra, y otra. Cada pliegue añade una capa que antes no existía. Si miras la hoja, no ves los pliegues; ves una línea limpia. Pero están todos ahí, y son lo que hace que no se rompa.",
            "Con el cuerpo pasa igual. Los que empiezan quieren hacerlo todo el primer mes: más peso, más series, más días. A las tres semanas se lesionan o se cansan, y dejan de venir. Los que se quedan hacen algo mucho más aburrido: suben un poco. Una repetición más que la vez pasada. Un par de kilos cuando ya no cuesta. Nada que merezca contarse.",
            "Hazme caso: mide lo de hoy contra lo de la semana pasada, no contra lo del que tienes al lado. Si hoy hiciste una repetición más, ganaste. Si hiciste las mismas con mejor forma, ganaste. Si hiciste menos, pero viniste, también ganaste, porque la hoja se hace con los golpes y no con los días buenos.",
            "En un año habrás doblado el metal trescientas veces. Entonces mira tu hoja.",
        ],
        moraleja: "Lo que no parece mucho, repetido muchas veces, lo cambia todo.",
    },
    {
        nivel: 6,
        titulo: "La barra que no sube",
        parrafos: [
            "Llegará una semana, y lo sé porque a todos nos llega, en que no subirás. Pondrás el mismo peso que el mes pasado y te costará igual. La semana siguiente, igual. Empezarás a pensar que ya llegaste a tu límite, o que no sirves para esto, o que todo lo que hiciste fue un espejismo.",
            "Cuando el metal deja de ceder, el herrero no le pega más fuerte. Lo vuelve a meter al fuego. A veces el problema es que el hierro está frío, y otras que el martillo es el equivocado, y otras que uno lleva demasiadas horas sin parar y ya no ve lo que hace. Cambia algo: la forma, el descanso, la comida, el orden de los ejercicios. Pero no abandones la fragua.",
            "Yo he visto a gente salir de un estancamiento tomándose una semana más ligera, durmiendo ocho horas, comiendo mejor. Sin hacer nada heroico. Y volvían con más fuerza de la que tenían antes. El estancamiento no es un muro: es el cuerpo diciéndote que está absorbiendo todo lo que le diste.",
            "Cuando la barra no suba, escribe lo que hiciste de todos modos. Lo vas a querer leer dentro de seis meses, cuando la barra sí haya subido.",
        ],
        moraleja: "Cuando no avanzas, no empujes más fuerte: ajusta, descansa y sigue.",
    },
    {
        nivel: 9,
        titulo: "El dolor que enseña y el que avisa",
        parrafos: [
            "Un cantero de la aldea vino un día con el hombro vendado. Se había empeñado en levantar lo que levantaba a los veinte, a los sesenta años, y el cuerpo le dijo que no. No lo regañé: yo había hecho lo mismo en mi juventud. Pero aprovecho cada historia así para decirles una cosa a los que vienen.",
            "Hay dos clases de dolor. Está el que llega al día siguiente, en el músculo, pesado y parejo, y se va en dos días: ese es el dolor del que trabajó. Y está el que llega de golpe, agudo, en una articulación o en un punto preciso, y no se va con el descanso: ese no es de trabajo, es un aviso. El primero se agradece. El segundo se escucha.",
            "Y entre los dos, un consejo de herrera: la técnica va antes que el peso. Un golpe mal dado con un martillo enorme no es un golpe fuerte, es un golpe malo. Baja el peso hasta que el movimiento sea limpio, y sube solo cuando lo puedas repetir sin pensar. Nadie te va a medir por lo que levantas con la espalda doblada.",
            "Quien entrena durante años no es el más fuerte del primer año: es el que no se lesionó en el segundo. Cuida lo que te permite volver.",
        ],
        moraleja: "No gana quien más levanta hoy, sino quien puede seguir levantando dentro de diez años.",
    },
    {
        nivel: 13,
        titulo: "Los doce martillos",
        parrafos: [
            "En mi fragua cuelgan doce martillos y ninguno sobra. Hay uno pesado para aplastar, otro ligero para detalles, uno de punta para marcar y uno plano para alisar. Un herrero que solo usa su martillo favorito hace piezas torcidas. Tiene que usarlos todos, aunque algunos no le gusten, porque cada uno hace lo que los otros no pueden.",
            "En el cuerpo ocurre igual. Todos tenemos un músculo favorito: el que se ve en el espejo, el que da gusto trabajar. Y todos tenemos uno que evitamos porque cuesta, porque nadie lo mira, porque se siente aburrido. Las piernas, la espalda, las pantorrillas. Pues bien: esos son los que sostienen a los demás. Una Torre con la cima bonita y los cimientos flojos se cae en el primer viento.",
            "Por eso aquel que te dio tu rutina te hizo pasar por todos: pecho, hombros, espalda, brazos, piernas. No es capricho. Es que un cuerpo equilibrado no se lesiona, no se cansa pronto y no se tuerce con los años. Cuando te den ganas de saltarte el día de piernas, recuerda que ese es el día que te sostiene los otros seis.",
            "La próxima vez que no tengas ganas de usar ese martillo, úsalo. Lo que no te gusta es, casi siempre, lo que más te falta.",
        ],
        moraleja: "Lo que más evitas entrenar es, casi siempre, lo que más te sostiene.",
    },
    {
        nivel: 18,
        titulo: "Lo que queda cuando el fuego se apaga",
        parrafos: [
            "Un día, alguien que ya no recuerdo me preguntó para qué sirve la fuerza. Me lo preguntó con un poco de burla, creyendo que una herrera iba a decir que para ganar peleas. Le contesté lo que sigo creyendo: sirve para cargar.",
            "Sirve para cargar lo tuyo sin que te doble, para cargar a otro cuando se cae, para cargar un día largo sin quejarte. Sirve para subir las escaleras a los setenta años. Para cuando tus hijos te necesiten y tengas con qué. La Torre de los Vigías la levantaron manos que sabían cargar, y la sostuvieron manos que no se cansaban de volver.",
            "Tú empezaste levantando un hierro que no querías levantar. Con el tiempo, ese hierro dejó de pesar, y entonces pusiste otro más grande. Eso, repetido durante meses, te ha cambiado de maneras que todavía no ves entera: en la espalda, sí, pero también en cómo te despiertas, en cómo aguantas un mal día, en lo que crees que puedes hacer.",
            "Cuando el fuego se apaga queda el metal. Lo que hiciste hoy quedará aunque no te acuerdes de ello. Tu cuerpo es la primera Torre que levantas, y la más importante, porque es la única que llevas contigo adonde vayas. Sigue subiendo.",
        ],
        moraleja: "La fuerza no se hizo para presumir: se hizo para poder cargar lo que importa.",
    },
];

// Cuántas lecturas se pueden leer con ese nivel de gym.
export const lecturasAbiertas = (nivelGym) => LECTURAS.filter((l) => nivelGym >= l.nivel);

// Minutos de lectura (unas 200 palabras por minuto).
export function minutosDeLectura(l) {
    return Math.max(1, Math.round(l.parrafos.join(" ").split(/\s+/).filter(Boolean).length / 200));
}
