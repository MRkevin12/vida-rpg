// voces-datos.js — El contenido de «Las Voces del Valle» (v44): la aldea, sus personas y sus conversaciones.
//
// Las reglas que mueven todo esto están en voces.js; aquí solo hay DATOS (para poder agregar personas y escenas
// sin tocar el código). Una prueba revisa que ninguna conversación se quede sin salida.
//
// HISTORIA. Al pie de la Torre hay una aldea. Cuando la Llama se apagó, la Sombra de la Voz —la de los cinco señores de la
// Campaña de la Voz: el Ego, el Qué dirán, la Envidia, el Miedo y el Orgullo— no mató a nadie: les quitó la voz a todos.
// Nadie dice lo que de verdad siente. Cada persona de la aldea guarda una cosa que no puede decir; tú no la vences con
// una espada: la ayudas a decirla. Es la parte de tu Carisma que ninguna batalla entrena.
//
// UNA ESCENA es un grafo de nodos. Cada nodo es:
//   { quien, texto, opciones: [...] }          alguien habla (quien: el id de una persona; sin quien = el narrador) y tú eliges
//   { evalua: [{ confianzaMin, marca, ir }] }  decide solo, según cuánto confía ya (la primera regla que se cumpla)
//   { fin: "bien" | "regular" | "mal", texto, leccion, tarea }   el final
// Una opción es { texto, ir, confianza (±), marca, tecnica, valor, si, noSi }:
//   confianza: cuánto sube o baja la confianza (es el «termómetro» oculto de la conversación)
//   marca: algo que queda anotado (por si un nodo más adelante lo pide con `si` / `noSi`)
//   tecnica: la técnica de Carisma que hace falta (ver voces.TECNICAS); se desbloquea con tu nivel real de Carisma
//   valor: el Valor mínimo (ver voces.valorDe): lo dan tus misiones de Carisma de la VIDA REAL de los últimos 7 días
// Siempre hay al menos una opción libre en cada nodo (una prueba lo comprueba): nunca te quedas encerrado.
//
// CÓMO SE ESCRIBE EL TEXTO:
//   · cuando habla una persona, el texto es lo que dice; lo que hace (los gestos) va entre _guiones bajos_ y se ve en cursiva.
//   · cuando narra el narrador, lo que dice alguien va entre «comillas».
//   · {n} es el nombre de tu héroe (sin género gramatical para él).

// Dónde pasan las cosas. fondo = una pintura de fondos/ (ver pinturas.js).
export const LUGARES = {
    fragua: { nombre: "La fragua", icono: "🔨", fondo: "torre" },
    posada: { nombre: "La posada del Gallo Dormido", icono: "🍺", fondo: "salon" },
    plaza: { nombre: "La plaza", icono: "⛲", fondo: "aldea" },
};

// Quién vive en la aldea.
//   dias: los días de la semana en que está en su lugar (0 = lunes … 6 = domingo)
//   voz: lo que la Sombra de la Voz le quitó (es uno de los cinco señores de la Campaña de la Voz)
//   aspecto: cómo se dibuja (como el Maestro Aurelio: ver avatar.APARIENCIA)
export const PERSONAS = {
    maren: {
        nombre: "Maren", oficio: "Herrera", lugar: "fragua", dias: [0, 1, 2, 3, 4, 5],
        voz: "El Orgullo", sombra: "Prefiere cargar sola antes que pedir ayuda.",
        saludo: "Golpea el hierro sin levantar la vista.",
        aspecto: { cuerpo: "femenino", piel: "media", rostro: "curtido", ojos: "gris", pelo: "rojizo", peinado: "recogido", barba: "ninguna", traje: "carmesi" },
        escenas: ["maren-1", "maren-2"],
    },
    tobias: {
        nombre: "Tobías", oficio: "Posadero", lugar: "posada", dias: [0, 1, 3, 4, 5, 6],
        voz: "El Qué dirán", sombra: "Hace lo que todos esperan de él, y está agotado.",
        saludo: "Sirve jarras con una sonrisa que no le llega a los ojos.",
        aspecto: { cuerpo: "masculino", piel: "clara", rostro: "amable", ojos: "azul", pelo: "claro", peinado: "corto", barba: "bigote", traje: "esmeralda" },
        escenas: ["tobias-1", "tobias-2"],
    },
    ilse: {
        nombre: "Ilse", oficio: "Bordadora", lugar: "plaza", dias: [0, 2, 4, 5, 6],
        voz: "La Envidia", sombra: "Admira a su hermana y no soporta que le vaya mejor.",
        saludo: "Borda con la mirada fija… y de reojo, el puesto de al lado.",
        aspecto: { cuerpo: "femenino", piel: "clara", rostro: "sereno", ojos: "verde", pelo: "negro", peinado: "melena", barba: "ninguna", traje: "violeta" },
        escenas: ["ilse-1", "ilse-2"],
    },
};

// Quien habla en alguna escena pero no tiene escenas propias todavía (por ahora, solo Vera).
export const INVITADOS = {
    vera: {
        nombre: "Vera", oficio: "Bordadora",
        aspecto: { cuerpo: "femenino", piel: "media", rostro: "amable", ojos: "miel", pelo: "rubio", peinado: "recogido", barba: "ninguna", traje: "azul" },
    },
};

// Cómo se llama el final de una conversación (para el cartel del resultado).
export const FINALES = {
    bien: { titulo: "Se abrió una voz", icono: "🌅" },
    regular: { titulo: "Un primer paso", icono: "🌤️" },
    mal: { titulo: "La puerta sigue cerrada", icono: "🌫️" },
};

const MAREN = "maren";
const TOBIAS = "tobias";
const ILSE = "ilse";
const VERA = "vera";

// Las mismas tres reglas para decidir el final de casi todas las escenas.
const FINAL_POR_CONFIANZA = (bien, regular) => ({
    evalua: [{ confianzaMin: bien, ir: "bien" }, { confianzaMin: regular, ir: "regular" }, { ir: "mal" }],
});

export const ESCENAS = {
    // ───────────────────────────── MAREN · el Orgullo ─────────────────────────────
    "maren-1": {
        persona: "maren", titulo: "El yunque solo", requiere: [], espera: 0, inicio: "a1",
        nodos: {
            a1: {
                texto: "La fragua huele a hierro y a ceniza. Maren golpea una hoz sin levantar la vista. Tiene la mano izquierda vendada, y el pedido de la cosecha —cuarenta hoces— apenas va por la mitad. Mañana se vence.",
                opciones: [
                    { texto: "Buenas tardes, Maren. ¿Cómo va el trabajo?", ir: "a2" },
                    { texto: "Te quedas junto a la puerta, en silencio, mirando cómo trabaja.", ir: "a2e", tecnica: "escuchar", confianza: 1 },
                    { texto: "Esa mano se ve mal. Déjame ayudarte con las hoces.", ir: "a2d", confianza: -1 },
                ],
            },
            a2: {
                quien: MAREN, texto: "Va. Como siempre. _No levanta la vista._ Si vienes a comprar, vuelve el sábado.",
                opciones: [
                    { texto: "No vengo a comprar. Vi la venda.", ir: "a3" },
                    { texto: "Entonces me quedo un rato, si no estorbo.", ir: "a3", confianza: 1 },
                ],
            },
            a2e: {
                quien: MAREN, texto: "_Pasa un buen rato antes de hablar._ Eres de los que se quedan mirando. Al menos no preguntas tonterías. _El martillo cae._ Eso ya es mucho en este pueblo.",
                opciones: [
                    { texto: "Golpeas más suave del lado izquierdo. ¿Te duele?", ir: "a3", confianza: 1 },
                    { texto: "Me gusta ver cómo le das forma al fuego.", ir: "a3", confianza: 1 },
                ],
            },
            a2d: {
                quien: MAREN, texto: "Dejé de necesitar niñera a los doce años. _El martillo cae más fuerte._ La mano está bien. Todo está bien.",
                opciones: [
                    { texto: "Perdona. No quise tratarte como si no pudieras.", ir: "a3", confianza: 1 },
                    { texto: "Se te cae el ritmo. Eso lo veo yo, y lo verá el pedido.", ir: "a3" },
                    { texto: "No me voy a ir mientras tengas esa mano así.", ir: "a3", tecnica: "firmeza", confianza: -2 },
                ],
            },
            a3: {
                quien: MAREN, texto: "Me corté con una hoz de prueba. Un descuido. _Mira el pedido sin querer._ Cuarenta para mañana. Hice veinte. Las otras veinte las hago esta noche.",
                opciones: [
                    { texto: "Con una mano, eso no se hace en una noche, Maren.", ir: "a4" },
                    { texto: "Debe ser pesado cargar con todo el valle sin que nadie lo note.", ir: "a4e", tecnica: "empatia", confianza: 2 },
                    { texto: "Si no llegas, nadie te lo va a reprochar.", ir: "a4n", confianza: -1 },
                    { texto: "Me costó años pedir ayuda. Hoy cargo mucho menos peso.", ir: "a4v", valor: 2, confianza: 2 },
                ],
            },
            a4: {
                quien: MAREN, texto: "Las manos que tengo son las que tengo. _Aprieta el mango del martillo._ Quien pide, queda debiendo. Y yo no le debo nada a nadie.",
                opciones: [
                    { texto: "Ayudar no es cobrar. Es solo ayudar.", ir: "a5", confianza: 1 },
                    { texto: "Te da miedo que, si aceptas una mano, el pueblo piense que ya no puedes.", ir: "a5", tecnica: "verdad", confianza: 1 },
                    { texto: "Está bien, no insisto. Si cambias de idea, estaré en la plaza.", ir: "ev", confianza: -1 },
                ],
            },
            a4e: {
                quien: MAREN, texto: "_Se queda quieta._ Nadie me lo había dicho así. _Traga saliva._ Es que si yo paro, se para todo. Mi padre no paró jamás. Se le fue la espalda y nadie lo notó hasta que no pudo levantarse.",
                opciones: [
                    { texto: "No tienes que ser tu padre. Tampoco tienes que hacerlo sola.", ir: "a5", confianza: 2 },
                    { texto: "Dejas que siga hablando, sin interrumpirla.", ir: "a5", tecnica: "escuchar", confianza: 1 },
                ],
            },
            a4n: {
                quien: MAREN, texto: "¿Que nadie me lo va a reprochar? _Se ríe sin ganas._ Reprochar no hace falta. Con que me miren, ya lo sé. _Te da la espalda._ Vete, que me atrasas.",
                opciones: [
                    { texto: "Perdona. Dije una tontería. Me callo y miro, si me dejas.", ir: "a5", confianza: 1 },
                    { texto: "Me voy. Vuelvo mañana.", ir: "ev" },
                ],
            },
            a4v: {
                quien: MAREN, texto: "_Levanta por fin los ojos._ ¿Tú? ¿Pidiendo ayuda? _Te mira un buen rato._ Qué poco se nota desde afuera.",
                opciones: [
                    { texto: "Se nota cuando uno deja de fingir que no pesa.", ir: "a5", confianza: 1 },
                ],
            },
            a5: {
                quien: MAREN, texto: "_Deja el martillo sobre el yunque._ Veinte hoces. Esta noche. Y yo, con esta mano… _Un silencio largo._ No sé cómo se pide esto, {n}. Nunca lo hice.",
                opciones: [
                    { texto: "Dime dónde pongo las manos.", ir: "ev", confianza: 1 },
                    { texto: "Te ayudo a cambio de que me enseñes a forjar. Así no le debes nada a nadie.", ir: "ev", confianza: 2 },
                    { texto: "Pídemelo como quieras. Yo ya dije que sí.", ir: "ev", confianza: 1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(4, 2),
            bien: {
                fin: "bien",
                texto: "Esa noche forjan juntos. Maren golpea, {n} sostiene las tenazas y sopla el fuelle; a medianoche las cuarenta hoces están alineadas contra la pared. Maren se limpia las manos y dice, sin mirarte: «Gracias. Fue más fácil de lo que pensé. Qué raro: pedir no me achicó.»",
                leccion: "Pedir ayuda no resta: le da al otro la oportunidad de ser útil. Quien nunca pide se queda sin nadie que le ofrezca.",
                tarea: "Pide ayuda con algo pequeño hoy, aunque puedas hacerlo solo",
            },
            regular: {
                fin: "regular",
                texto: "Maren acepta que sostengas las tenazas, pero no dice una palabra más. Terminan las hoces de madrugada. Al irte, solo gruñe: «Gracias. No lo comentes en el pueblo.» Fue un primer paso, aunque a ella le haya costado admitirlo.",
                leccion: "A una persona orgullosa a veces hay que dejarle hacerlo a su manera. La puerta queda abierta aunque no se note.",
                tarea: "Ofrece ayuda a alguien sin esperar que te lo agradezca",
            },
            mal: {
                fin: "mal",
                texto: "Maren termina las hoces sola, a la luz de la última brasa. Cuando vuelves por la mañana, el pedido está entregado y ella no te saluda. Hoy no hubo manera de que el orgullo cediera.",
                leccion: "Insistir o quitarle importancia a alguien que se defiende con el orgullo suele endurecerlo más. Escuchar primero abre más puertas que empujar.",
            },
        },
    },

    "maren-2": {
        persona: "maren", titulo: "Pedir sin humillarse", requiere: ["maren-1"], espera: 1, inicio: "b1",
        nodos: {
            b1: {
                texto: "Al día siguiente la fragua está en calma. Las cuarenta hoces ya están entregadas. Maren barre la ceniza con la mano buena. «Se me acabó el carbón» —dice sin preámbulo—. «Y el único que tiene de sobra es Tobías, el de la posada. Me da mucha rabia tener que ir a pedirle fiado.»",
                opciones: [
                    { texto: "¿Qué es lo que te da rabia, exactamente?", ir: "b2", confianza: 1 },
                    { texto: "Pues no pidas: yo te llevo el carbón.", ir: "b2", confianza: -1 },
                    { texto: "Esperas a que termine de barrer.", ir: "b2", tecnica: "escuchar", confianza: 1 },
                ],
            },
            b2: {
                quien: MAREN, texto: "Que va a pensar que no sé llevar mi negocio. Que voy a quedar como «la herrera que anda pidiendo». _Arroja la escoba contra la pared._ ¿Cómo se pide sin que se note que uno falla?",
                opciones: [
                    { texto: "Se puede pedir sin que parezca una súplica. Practiquemos: yo hago de Tobías.", ir: "b3", confianza: 1 },
                    { texto: "Un negocio sano pide créditos. Pasa en todas las herrerías.", ir: "b3", confianza: 1 },
                    { texto: "Dile que es el carbón el que te debe a ti, por haberse acabado tan rápido.", ir: "b3", tecnica: "humor", confianza: 1 },
                ],
            },
            b3: {
                texto: "Maren se cruza de brazos, como tomándote el pulso. «Bien. Haz de Tobías.» Se aclara la garganta. «Tobías, ejem… yo… tengo un problema. Es algo muy tonto, discúlpame de verdad, no quiero molestar, pero…»",
                opciones: [
                    { texto: "Para. Cuando te disculpas tanto, la petición parece una carga. Dilo más corto.", ir: "b4", confianza: 1 },
                    { texto: "Ahí fallas: suenas como si no merecieras pedirlo.", ir: "b4" },
                    { texto: "Entiendo por qué te disculpas tanto: te enseñaron que pedir es molestar. Probemos otras palabras.", ir: "b4", tecnica: "empatia", confianza: 2 },
                ],
            },
            b4: {
                texto: "Maren lo intenta de nuevo, ahora seca, casi un reclamo: «Tobías. Necesito carbón. Dámelo fiado.» Se detiene. «Eso salió como una orden.»",
                opciones: [
                    { texto: "Suena a orden porque no dijiste cuánto, ni cuándo, ni por qué.", ir: "b5", confianza: 1 },
                    { texto: "Prueba así: «Tobías, necesito dos sacos de carbón. Te los pago el sábado, cuando entregue la cosecha».", ir: "b5", confianza: 2 },
                    { texto: "Mejor que se lo pida otra persona.", ir: "b5", confianza: -1 },
                ],
            },
            b5: {
                quien: MAREN, texto: "_Lo repite con sus propias palabras:_ «Tobías, necesito dos sacos de carbón. Te los pago el sábado.» _Suena más a trato que a limosna. Hace una mueca._ Pero igual me da pánico ir. _Te mira._ Y tú no vas a ir a hablar por mí, ¿verdad?",
                opciones: [
                    { texto: "Voy contigo hasta la puerta de la posada. Entras tú sola.", ir: "ev", confianza: 2 },
                    { texto: "Voy contigo. Y yo también voy a pedirle algo a alguien por primera vez en mi vida.", ir: "ev", valor: 3, confianza: 2 },
                    { texto: "Ve tú sola. No necesitas a nadie.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(4, 2),
            bien: {
                fin: "bien",
                texto: "Esa tarde Maren cruza la puerta de la posada con la cabeza alta, y tú esperas en la plaza mirando las nubes. Sale veinte minutos después con dos sacos de carbón al hombro y una cerveza que Tobías insistió en regalarle. «No me hizo falta un solo perdón» —dice, atónita—. «Me dijo: “Claro, Maren, cuando quieras”. Dos veces.»",
                leccion: "Una petición clara —qué necesitas, cuánto, para cuándo y qué ofreces— se recibe mucho mejor que una disculpa larga. La gente suele querer ayudar: solo necesita saber cómo.",
                tarea: "Haz una petición concreta hoy: qué necesitas, cuánto y para cuándo",
            },
            regular: {
                fin: "regular",
                texto: "Maren va sola a la posada y vuelve con el carbón, aliviada pero seria. Deja los sacos junto al fuelle y murmura: «Ya está. No me hagas hablar de eso.» Pero la mano buena ya no aprieta tanto el mango.",
                leccion: "Aunque se haga a regañadientes, pedir una vez abre el camino para la siguiente. Lo difícil es la primera.",
            },
            mal: {
                fin: "mal",
                texto: "Maren decide ir otro día, «cuando haya más tiempo». Esa noche enciende la fragua con restos de leña y rabia. Pedir sigue pareciéndole una rendición. Hoy no se movió.",
                leccion: "Cuando alguien se cierra, a veces lo mejor es dejarle espacio y volver mañana con calma, sin hacerlo sentir ni empujado ni abandonado.",
            },
        },
    },

    // ───────────────────────────── TOBÍAS · el Qué dirán ─────────────────────────────
    "tobias-1": {
        persona: "tobias", titulo: "Lo que dirán", requiere: [], espera: 0, inicio: "t1",
        nodos: {
            t1: {
                texto: "La posada del Gallo Dormido está llena. Tobías sirve jarras, ríe, recuerda el nombre de todos y el de sus hijos. Nadie diría que lleva tres noches durmiendo cuatro horas. Cuando por fin cierra, se sienta al fondo, con la bandeja todavía en las manos.",
                opciones: [
                    { texto: "Siéntate, Tobías. Yo recojo las mesas.", ir: "t2", confianza: 1 },
                    { texto: "Esperas en silencio a que él hable.", ir: "t2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Qué gran noche. Eres el alma de este pueblo.", ir: "t2", confianza: -1 },
                ],
            },
            t2: {
                quien: TOBIAS, texto: "Gracias, {n}. Hoy un mercader, Oswin, me ofreció comprar la posada. Buen dinero. _Sonríe._ Le dije que lo pensaría. ¡Pero qué tontería! ¿Quién iba a querer que el Gallo Dormido cierre?",
                opciones: [
                    { texto: "¿Tú qué quieres, Tobías?", ir: "t3", confianza: 1 },
                    { texto: "Parece que la pregunta te pesó más de lo que dices.", ir: "t3e", tecnica: "empatia", confianza: 2 },
                    { texto: "Tienes razón, sería una tontería venderla.", ir: "t3", confianza: -1 },
                ],
            },
            t3: {
                quien: TOBIAS, texto: "Lo que quiero… _se queda mirando el techo._ No sé si importa lo que yo quiero. ¿Qué diría la gente? Mi padre levantó esta posada. Los viejos vienen a beber por él. Si la vendo, ¿qué soy? El hijo que dejó caer todo.",
                opciones: [
                    { texto: "Mantenerla es una forma de quererlo. Pero no es la única.", ir: "t4", confianza: 1 },
                    { texto: "Dijiste «qué diría la gente» tres veces, y ni una vez dijiste qué quieres tú.", ir: "t4", tecnica: "verdad", confianza: 1 },
                    { texto: "La gente se acostumbra a cualquier cosa.", ir: "t4" },
                    { texto: "Si Oswin te la compra, al menos te quedas con el cartel. Ya está medio dormido de verdad.", ir: "t4", tecnica: "humor", confianza: 2 },
                ],
            },
            t3e: {
                quien: TOBIAS, texto: "_Se le cae la sonrisa._ Estoy tan cansado, {n}. _Se frota la cara._ Hace años que me levanto antes del alba para una vida que no pedí. Pero decirlo suena a traición.",
                opciones: [
                    { texto: "No es traición. Es el primer dato honesto de la noche.", ir: "t4", confianza: 1 },
                    { texto: "Dejas que siga, sin apurarlo.", ir: "t4", tecnica: "escuchar", confianza: 1 },
                ],
            },
            t4: {
                quien: TOBIAS, texto: "Si cuelgo el delantal, tendré que decirle a todos que no puedo con esto, y ellos lo verán como una caída. _Una pausa._ Y aquí estoy: dueño de una posada que ama todo el mundo menos yo.",
                opciones: [
                    { texto: "¿Y si no lo vieran como una caída? ¿Y si lo vieran como un hombre que también se cuida?", ir: "t5", confianza: 1 },
                    { texto: "Podrías ir poco a poco: cerrar un día por semana. Empezar con eso.", ir: "t5", confianza: 1 },
                    { texto: "No tienes que decidir esta noche, pero sí decidir tú. Hoy no te dejo escapar con una broma.", ir: "t5", tecnica: "firmeza", confianza: 2 },
                    { texto: "Haz lo que prefieras, es tu vida.", ir: "t5", confianza: -1 },
                ],
            },
            t5: {
                quien: TOBIAS, texto: "_Deja la bandeja sobre la mesa por primera vez en la noche._ Un día por semana… el miércoles. Cerrar los miércoles. Se me ocurren como diez personas que me van a mirar mal. _Se ríe, de verdad esta vez._ Y dos que me lo agradecerán, aunque no lo digan.",
                opciones: [
                    { texto: "Hazlo. Y el primer miércoles estaré aquí, por si alguien pregunta.", ir: "ev", confianza: 1 },
                    { texto: "Piénsalo bien. Mañana lo ves más claro.", ir: "ev" },
                    { texto: "Vende ya, y viaja.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(4, 2),
            bien: {
                fin: "bien",
                texto: "Esa noche Tobías escribe un cartel con letra torcida: «Los miércoles, el Gallo duerme». Lo cuelga él mismo, antes de arrepentirse. «Si alguien protesta, ya sabré a quién enseñarle el cartel.» Y te mira: «Gracias por no decirme qué hacer. Solo por preguntarme qué quería yo.»",
                leccion: "Hacer lo que esperan los demás es cómodo hasta que cuesta la salud. Preguntarte primero «¿qué quiero yo?» no es egoísmo: es la base para poder dar sin resentimiento.",
                tarea: "Di que no a algo pequeño que no quieres hacer hoy, con amabilidad",
            },
            regular: {
                fin: "regular",
                texto: "Tobías promete pensarlo. Al irte, lo ves colgar el delantal en su gancho… y volver a ponérselo para limpiar. «Después» —dice—. «Lo hago después.» Pero ese «después» es la primera grieta en el muro.",
                leccion: "Un cambio que todavía no se atreve a nombrarse puede esperar. Lo importante es que la pregunta ya quedó sembrada.",
            },
            mal: {
                fin: "mal",
                texto: "Tobías sonríe y te sirve una cerveza que no pediste. Cambia de tema. Sales al aire frío y la posada vuelve a ser una fiesta con un hombre agotado en medio. Hoy la máscara no se movió.",
                leccion: "Cuando alguien usa la sonrisa como escudo, darle la razón o aconsejarlo no abre nada. Escuchar y preguntar, sí.",
            },
        },
    },

    "tobias-2": {
        persona: "tobias", titulo: "Los miércoles, el Gallo duerme", requiere: ["tobias-1"], espera: 1, inicio: "c1",
        nodos: {
            c1: {
                texto: "Tobías te espera en la cocina vacía, con un papel amarillento sobre la mesa. «Lo encontré detrás del barril de vino» —dice—. «Es de mi padre. No me atrevo a leerlo solo.»",
                opciones: [
                    { texto: "Lo leemos juntos, si quieres.", ir: "c2", confianza: 1 },
                    { texto: "Esperas a que él decida cuándo abrirlo.", ir: "c2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Léelo ahora y acabas con la duda.", ir: "c2" },
                ],
            },
            c2: {
                texto: "La carta dice: «Hijo: si lees esto, el Gallo sigue en pie, y tú con él. Debo confesarte algo que nunca dije en voz alta: yo quería ser marinero. No lo fui por miedo a lo que dirían los míos. No te pido que mantengas la posada. Te pido que no me imites en lo que callé.»",
                opciones: [
                    { texto: "Debe ser raro descubrir que tu padre también cargó con lo mismo.", ir: "c3", tecnica: "empatia", confianza: 2 },
                    { texto: "Parece que quería que fueras más libre que él.", ir: "c3", confianza: 1 },
                    { texto: "Entonces ya tienes permiso para venderla.", ir: "c3", confianza: -1 },
                ],
            },
            c3: {
                quien: TOBIAS, texto: "Toda la vida pensé que mantener este lugar era la forma de honrarlo. _Se limpia los ojos._ Qué tonto he sido. Y qué miedo me da ahora cambiar. Cerrar los miércoles, eso ya lo decidí. Pero decírselo a todos…",
                opciones: [
                    { texto: "Puedes decirlo sin pedir permiso: «A partir de ahora, los miércoles cerramos». Corto y claro.", ir: "c4", confianza: 2 },
                    { texto: "Si quieres, ensayamos. Yo hago de cliente enfadado.", ir: "c4", confianza: 1 },
                    { texto: "Cuando alguien proteste, no te justifiques más de una vez. Repite lo mismo con calma.", ir: "c4", tecnica: "firmeza", confianza: 2 },
                    { texto: "Mejor déjalo: la gente se acostumbra sin que se avise.", ir: "c4", confianza: -1 },
                ],
            },
            c4: {
                texto: "Ensayan. Tobías practica con voz temblorosa: «Hola, don Hilario… los miércoles… cerramos. Sí, ya sé que usted viene los miércoles.» Se atasca. «¡Ay! Es que me sale la disculpa sola.»",
                opciones: [
                    { texto: "Quita la disculpa y deja la razón: «Descanso los miércoles». Nada más.", ir: "c5", confianza: 1 },
                    { texto: "Cuando te salga la disculpa, respira antes de seguir. Esa pausa vale más que cualquier excusa.", ir: "c5", confianza: 1 },
                    { texto: "Yo también me disculpaba sin parar. Respirar antes de hablar me enseñó a no ofrecer excusas.", ir: "c5", valor: 2, confianza: 2 },
                ],
            },
            c5: {
                texto: "Al día siguiente, en la plaza, es día de mercado. Tobías clava su cartel con las manos sudadas: «Los miércoles, el Gallo duerme». Hay un murmullo. Don Hilario, el más viejo del pueblo, se acerca con cara de pocos amigos. «¿Cerrado los miércoles? ¿Y dónde bebo yo los miércoles?» Tobías traga saliva y te mira de reojo. El pueblo espera.",
                opciones: [
                    { texto: "Le haces un gesto de ánimo y te quedas a su lado, sin hablar por él.", ir: "ev", confianza: 2 },
                    { texto: "Respondes tú por Tobías: «Los miércoles descansa, don Hilario. Es un hombre cansado».", ir: "ev", confianza: -1 },
                    { texto: "Te alejas, para no entrometerte.", ir: "ev" },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Tobías respira hondo. «Don Hilario: los miércoles descanso. Si quiere, venga el jueves, que le guardo la mesa del fondo.» Silencio. Luego Hilario gruñe: «Hace cuarenta años que esperaba que alguien en este pueblo dijera algo así.» Y se sienta en el banco, riendo con una risa de dientes ausentes. Tobías ríe también, con los ojos húmedos: «Lo dije, {n}. Lo dije y el mundo no se acabó.»",
                leccion: "Decir que no con claridad y amabilidad, una sola vez, cuesta mucho menos de lo que imaginabas. Casi siempre, el mayor obstáculo es la película que te armaste antes de hablar.",
                tarea: "Di «no» o «ahora no» a algo, sin disculpas largas",
            },
            regular: {
                fin: "regular",
                texto: "Tobías contesta a medias: «Es que… los miércoles, ya sabe, hay cosas.» Hilario entiende lo que quiere entender. El cartel queda colgado, pero Tobías lo mira de lado el resto del día. Falta práctica.",
                leccion: "Una decisión que se explica con rodeos se vuelve a negociar una y otra vez. La claridad ahorra conversaciones.",
            },
            mal: {
                fin: "mal",
                texto: "Tobías retira el cartel antes de que nadie lo lea. «Más adelante» —dice—. La carta queda en el bolsillo del delantal, doblada. Hoy el miedo ganó el turno.",
                leccion: "Si alguien habla por ti o te apuran, el cambio que querías puede volver a esconderse. Se necesita tu propia voz.",
            },
        },
    },

    // ───────────────────────────── ILSE · la Envidia ─────────────────────────────
    "ilse-1": {
        persona: "ilse", titulo: "Dos telares", requiere: [], espera: 0, inicio: "i1",
        nodos: {
            i1: {
                texto: "En la plaza hay dos puestos de tela, uno junto al otro. En el de Vera, un corrillo de gente. En el de Ilse, el silencio y una araña tejiendo su propio telar en el toldo. Ilse borda un pañuelo con la mirada fija en la puntada, y aun así no deja de mirar de reojo el puesto vecino.",
                opciones: [
                    { texto: "¿Puedo ver tus bordados?", ir: "i2", confianza: 1 },
                    { texto: "Qué concurrido el puesto de al lado.", ir: "i2", confianza: -1 },
                    { texto: "Miras el pañuelo con ella, sin decir nada.", ir: "i2", tecnica: "escuchar", confianza: 1 },
                ],
            },
            i2: {
                quien: ILSE, texto: "Míralos. Cada punto, cuatro horas. _Te pasa el pañuelo._ Nadie lo mira. Y Vera pone dos florecitas torcidas y se lo llevan en un minuto. Es mi hermana, la quiero… pero a veces no me cae bien que sea tan afortunada.",
                opciones: [
                    { texto: "Tu bordado es mucho más fino. Se nota la diferencia.", ir: "i3", confianza: 1 },
                    { texto: "Duele más cuando es alguien a quien quieres, ¿verdad?", ir: "i3e", tecnica: "empatia", confianza: 2 },
                    { texto: "No tienes que compararte con ella.", ir: "i3" },
                    { texto: "Quizá Vera simplemente vende mejor.", ir: "i3", confianza: -1 },
                ],
            },
            i3e: {
                quien: ILSE, texto: "_Se queda mirando el hilo._ Sí. Eso. Duele más. Con una extraña es rabia. Con ella es… vergüenza de sentirlo.",
                opciones: [
                    { texto: "La vergüenza suele ser la parte que más calla. ¿Qué es lo que te quitó, según tú?", ir: "i3", confianza: 1 },
                    { texto: "Esperas, sin llenar el silencio.", ir: "i3", tecnica: "escuchar", confianza: 1 },
                ],
            },
            i3: {
                quien: ILSE, texto: "Ni siquiera es por las ventas. _Aprieta el hilo._ Cuando éramos niñas, mamá me enseñó a mí a bordar. A mí. Y Vera aprendió mirándome… y ahora todos dicen «qué talento tiene Vera». Como si se lo hubiera inventado.",
                opciones: [
                    { texto: "¿Se lo has dicho a ella? Lo de que aprendió de ti.", ir: "i4", confianza: 1 },
                    { texto: "Lo que sientes no es solo envidia por las ventas: sientes que te quitaron algo tuyo.", ir: "i4", tecnica: "verdad", confianza: 2 },
                    { texto: "Tal vez ella ni sabe que te duele.", ir: "i4", confianza: 1 },
                ],
            },
            i4: {
                quien: ILSE, texto: "¿Decirle? _Ríe seca._ ¿Y quedar como la hermana mezquina? Prefiero callar. _Una pausa._ Aunque callar me está pudriendo. A veces siento en la boca el sabor de lo que no digo.",
                opciones: [
                    { texto: "No es mezquino nombrar lo que duele. Mezquino sería hacerle pagar con frialdad lo que no le has dicho.", ir: "i5", confianza: 2 },
                    { texto: "Yo también callé algo parecido, y lo dije. Fueron cinco minutos incómodos y meses de alivio.", ir: "i5", valor: 2, confianza: 2 },
                    { texto: "Si quieres, le digo yo algo.", ir: "i5", confianza: -1 },
                ],
            },
            i5: {
                quien: ILSE, texto: "_Deja el bordado. Del puesto vecino llega la risa de Vera._ Si se lo digo, tendrá que ser sin acusarla. _Piensa._ ¿Cómo se empieza algo así?",
                opciones: [
                    { texto: "Empieza por lo que sientes tú, no por lo que hizo ella: «Me duele no haber sido vista».", ir: "ev", confianza: 2 },
                    { texto: "Empieza por felicitarla y luego ya ves.", ir: "ev" },
                    { texto: "Empieza por pedirle que te enseñe a vender.", ir: "ev", confianza: 1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(6, 3),
            bien: {
                fin: "bien",
                texto: "Ilse te mira, deja el pañuelo y cruza la plaza. «Vera, ¿tienes un momento? Hay algo que debí decirte hace años.» No oyes el resto. Pero esa tarde el puesto de Vera se cierra más temprano que nunca, y los dos toldos terminan compartiendo una sola mesa y dos sillas.",
                leccion: "La envidia es información: señala lo que valoras y sientes que te falta o te quitaron. Nombrarla con honestidad, sin acusar, la desarma.",
                tarea: "Felicita hoy a alguien a quien envidias, sin «peros»",
            },
            regular: {
                fin: "regular",
                texto: "Ilse promete hablar con ella «cuando sea el momento». Pero esa noche guarda el pañuelo en el cajón con más cuidado del acostumbrado. Algo se movió. Aún falta decirlo.",
                leccion: "Reconocer lo que sientes, aunque sea solo en voz baja, ya es empezar a soltarlo. Decirlo es el siguiente paso.",
            },
            mal: {
                fin: "mal",
                texto: "Ilse recoge el puesto antes de lo habitual. «Tengo mucho que hacer.» El telar de la araña sigue tejiendo su hilo despacio. Hoy no se abrió.",
                leccion: "Comparar, aconsejar o prometer hablar por alguien suele cerrarlo más. Cuando la envidia se siente vigilada, se esconde.",
            },
        },
    },

    "ilse-2": {
        persona: "ilse", titulo: "El hilo que se rompe", requiere: ["ilse-1"], espera: 1, inicio: "d1",
        nodos: {
            d1: {
                texto: "Vera cruza la plaza con un pañuelo en la mano. Es una versión más ligera del bordado de Ilse: los mismos puntos, apurados. «Mira, Ilse, copié tu “flor del valle”. ¿Te acuerdas de quién me la enseñó?» Sonríe, y no hay ironía en su cara, solo cariño. «Ya te lo dije mil veces: sin ti no sabría ni enhebrar.»",
                opciones: [
                    { texto: "Notas que Ilse no oye lo que Vera acaba de decir: está esperando otra cosa.", ir: "d2", tecnica: "escuchar", confianza: 1 },
                    { texto: "Dejas que hablen entre ellas y te quedas a un lado.", ir: "d2" },
                    { texto: "Le sonríes a Vera: «Se nota que te quiere».", ir: "d2" },
                ],
            },
            d2: {
                quien: ILSE, texto: "«Gracias» _dice rígida._ Qué amable. _Y a ti, en voz baja:_ Siempre dice lo mismo. Siempre tan generosa. ¿Sabes lo que cansa que te regalen el crédito cuando ya te quitaron el reconocimiento?",
                opciones: [
                    { texto: "Ilse, ¿oíste lo que acaba de decir? Dijo que aprendió de ti.", ir: "d3", confianza: 1 },
                    { texto: "Sientes que sus elogios son una limosna, y eso duele más que el silencio.", ir: "d3", tecnica: "empatia", confianza: 2 },
                    { texto: "No seas dura con Vera: no tiene la culpa.", ir: "d3", confianza: -1 },
                ],
            },
            d3: {
                texto: "Vera se queda quieta: ha oído. «¿Qué quieres decir con “quitaron”? Ilse… dime qué pasa.» No hay defensa en su voz: solo desconcierto. Ilse mira el telar, luego a su hermana, y por primera vez no le sale una respuesta ensayada.",
                opciones: [
                    { texto: "Si quieres decir algo, este es un buen momento. Sin acusarla.", ir: "d4", confianza: 1 },
                    { texto: "Les propongo sentarnos sin puestos ni clientes. Esto se arregla mejor sin prisa.", ir: "d4", tecnica: "firmeza", confianza: 2 },
                    { texto: "Mejor déjenlo para otro día: hay mucha gente.", ir: "d4", confianza: -1 },
                ],
            },
            d4: {
                quien: ILSE, texto: "Me duele. _Se le quiebra la voz en la segunda palabra._ No que te vaya bien. Que nadie me vea a mí. Yo te enseñé, y ahora todos dicen «qué talento tiene Vera». Nunca dije nada porque no quería parecer envidiosa. Y ahora lo soy.",
                opciones: [
                    { texto: "Sentirlo no te hace mala persona: te hace alguien que quería que la vieran.", ir: "d5", confianza: 2 },
                    { texto: "A mí me pasó con alguien cercano. Decirlo fue lo más incómodo y lo mejor que hice.", ir: "d5", valor: 3, confianza: 2 },
                    { texto: "Ya, pero tampoco es para tanto.", ir: "d5", confianza: -1 },
                ],
            },
            d5: {
                quien: VERA, texto: "_Tiene los ojos rojos._ Ilse, yo no sabía. Siempre pensé que no necesitabas que te lo dijera, que tú… _Se ríe y llora a la vez._ Te lo digo ahora: lo más bonito que hago es tuyo. Todo el mundo debería saberlo.",
                opciones: [
                    { texto: "Tal vez puedan poner un cartel juntas: «Bordados de Ilse y Vera».", ir: "ev", confianza: 1 },
                    { texto: "Dejas que se abracen sin decir nada.", ir: "ev", tecnica: "escuchar", confianza: 2 },
                    { texto: "Les haces notar que la gente está mirando.", ir: "ev", confianza: -1 },
                ],
            },
            ev: FINAL_POR_CONFIANZA(5, 3),
            bien: {
                fin: "bien",
                texto: "Esa tarde el toldo de Ilse se llena de gente, pero no porque Vera esté al lado: porque Vera, a gritos, le señala a cada cliente los puntos más finos y dice «esto es de mi hermana». Ilse, roja, vende cinco pañuelos antes del anochecer. Al cerrar, cuelga un cartel pequeño de madera: «Ilse & Vera, bordadoras».",
                leccion: "A veces la envidia se alimenta de lo que no decimos. Cuando la nombras sin acusar, la otra persona puede darte justo lo que te faltaba.",
                tarea: "Dile a alguien algo que valoras de su trabajo, sin «peros»",
            },
            regular: {
                fin: "regular",
                texto: "Ilse y Vera hablan, pero a medias. Hay un abrazo y también un «ya hablaremos». Al final del día, el telar sigue tejiendo despacio. Falta un hilo.",
                leccion: "Una conversación honesta a medias sigue siendo un avance. Basta con que las dos sepan que la puerta quedó abierta.",
            },
            mal: {
                fin: "mal",
                texto: "Ilse se endurece de nuevo. «Estoy bien. De verdad.» Vera se va con la mirada baja y el pañuelo apretado en la mano. Algunas heridas se cierran mal cuando se aprietan.",
                leccion: "Cuando alguien se abre y encuentra prisa, vuelve a cerrarse. Dar tiempo y espacio también es una forma de cuidar.",
            },
        },
    },
};
