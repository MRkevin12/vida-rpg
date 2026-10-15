// novedades.js — Qué hay de nuevo en cada versión.
//
// Después de actualizar, la app muestra una ventana con lo nuevo (una sola vez).
// Al publicar una versión: sube VERSION_APP (igual que VERSION en sw.js) y agrega
// sus cambios arriba de la lista.

export const VERSION_APP = 50;

export const NOVEDADES = [
    {
        version: 50,
        titulo: "Una portada para tu día",
        cambios: [
            "🏰 La pregunta «¿Cómo te sientes hoy?» ahora ocupa toda la pantalla, con una pintura de fondo como portada del juego.",
            "🙂 Arriba de Hoy hay un botón grande que muestra cómo te sientes y te deja cambiarlo con un toque.",
            "🧙 El Maestro Aurelio te saluda según la hora y te comparte una frase de los clásicos, distinta cada día.",
        ],
    },
    {
        version: 49,
        titulo: "¿Cómo te sientes hoy?",
        cambios: [
            "🙂 Al abrir la app te pregunta cómo estás: 😔 Mal (solo lo esencial: Hoy y Tienda), 🙂 Normal (sin Aventuras: Hoy, Progreso, Héroe y Tienda) o 😄 Bien (todo el menú).",
            "Lo puedes cambiar cuando quieras con el botón «Mi ánimo» de Hoy.",
            "Si no quieres que pregunte, apaga «Preguntar cómo me siento» en Ajustes.",
        ],
    },
    {
        version: 48,
        titulo: "Modo esencial, más claro",
        cambios: [
            "🎯 En el modo esencial, Hoy ahora tiene tres grupos bien separados y de colores distintos, para no confundirlos: ⚔️ Misiones diarias (azul: tus hábitos que se repiten), 📌 Tareas (dorado: lo de una sola vez) y 🎯 Misiones importantes (violeta: tus objetivos grandes con pasos). Arriba hay tres números que te llevan a cada grupo.",
            "Se quita el diario, el progreso y todo lo demás. Quedan solo dos pestañas: Hoy y Tienda.",
            "La Tienda, en este modo, muestra solo tus monedas 🪙 y los premios reales que tú definiste (sin gemas, equipo ni mascotas).",
        ],
    },
    {
        version: 47,
        titulo: "Siempre en modo esencial",
        cambios: [
            "🚪 Ahora la app siempre abre en modo esencial: solo tus misiones, tareas, misiones principales y diario. Puedes salir con el botón 🎯 de Hoy para jugar completo; al volver a abrir la app, arranca otra vez en modo esencial.",
            "Si prefieres que abra como antes, apaga «Abrir siempre en modo esencial» en Ajustes.",
        ],
    },
    {
        version: 46,
        titulo: "Modo esencial",
        cambios: [
            "🎯 Un modo nuevo para ver solo lo importante. En la pantalla Hoy hay un botón «🎯 Esencial» (y un interruptor en Ajustes) que esconde tu héroe, «Tu día», los avisos y la semana, y deja tus misiones, las tareas, las misiones principales y el diario. Agregar misiones, tareas y objetivos queda a un toque.",
            "En ese modo, las pestañas quedan en Hoy, Progreso y Tienda. La Torre, las Voces del Valle, el Arcade y el Héroe siguen guardados: vuelven al apagarlo, y tu partida no cambia.",
            "No lo confundas con «⏱️ Enfoque», el temporizador de concentración: ese sigue igual (en el modo esencial solo aparece si tienes una sesión en marcha).",
        ],
    },
    {
        version: 45,
        titulo: "Más voces para el valle",
        cambios: [
            "🗣️ La aldea ya tiene las cinco voces completas, con DOS personas por cada una: Orgullo (Maren y el capitán Edmundo), Qué dirán (Tobías y Wren), Envidia (Ilse y el carpintero Gaspar), Miedo (el bardo Cassiel y la panadera Marta) y Ego (don Anselmo y el boticario Valerio). Son 7 personas nuevas y 14 conversaciones más, 20 en total.",
            "Cada una trata algo de la vida real: hablar en público, reclamar lo tuyo sin pelear, escuchar de verdad, admitir un error, dar el primer paso con alguien con quien discutiste, elegir tu camino frente a tu familia, reconocer a quien te supera…",
            "📜 Un final para la aldea: cuando recuperes la última voz se cuenta el epílogo (con Aurelio), da 40 💎 y 40 XP de Carisma, aparece en la saga y en tu libro, y se puede releer desde la aldea.",
            "Ahora la aldea solo muestra los lugares donde hay alguien ese día.",
        ],
    },
    {
        version: 44,
        titulo: "Las Voces del Valle",
        cambios: [
            "🗣️ Un juego nuevo de Carisma: una aventura de diálogos. Al pie de la Torre hay una aldea a la que la Sombra de la Voz le quitó la voz, y cada persona guarda algo que no puede decir: el orgullo de Maren, el qué dirán de Tobías, la envidia de Ilse. Lo encuentras en Aventuras → Las Voces del Valle.",
            "📅 La aldea cambia cada día: no todos están siempre en su lugar. Hablar con alguien cuesta 🎟️ 1 ficha y paga gemas 💎 y XP de Carisma. Eliges qué decir; la conversación tiene ramas y varios finales.",
            "🎶 Tu Carisma real te da poder: sus técnicas (Escuchar, Empatía, Verdad, Firmeza, Humor) se desbloquean con el nivel del atributo, y tu Valor sube con las misiones y tareas de Carisma de los últimos 7 días. Cada lección se puede convertir en una tarea de verdad.",
            "Por ahora hay 3 personas con 6 conversaciones. Vendrán más voces.",
        ],
    },
    {
        version: 43,
        titulo: "Cinemáticas en la Torre",
        cambios: [
            "🎬 La Torre ahora tiene cinemáticas: escenas animadas con la sala, la criatura y tu héroe, con cámara que se mueve, destellos y una línea de texto.",
            "Salen cuando llegas a una zona nueva, al encontrarte con un guardián, cuando el guardián cae y, la más larga, al derrotar al último: el Apagador en la Torre y el Rey Hueco en la Mazmorra.",
            "Se pueden saltar siempre (el botón «Saltar», o tocando la pantalla para pasar a la siguiente toma) y se apagan en Ajustes → 🎬 Cinemáticas. Si prefieres menos movimiento, el modo de «reducir movimiento» de tu iPhone también las calma.",
        ],
    },
    {
        version: 42,
        titulo: "Salas especiales en la Torre",
        cambios: [
            "🚪 Entre algunos pisos de la Torre ahora hay una sala: el tercer piso de cada zona y el de cada guardián. Es un respiro: eliges qué hacer, sin pelear.",
            "⛲ Fuente (antes de cada guardián): bebes y recuperas 40 % de vida, o llenas un frasco. 🕯️ Altar: ofreces sangre por ataque y hechizo, o rezas por Voluntad. 🛒 Mercader: trueques con lo que llevas (una poción por vida máxima, vida por pociones, un hechizo por filo). 📦 Cofre: un don o una mejora… o una trampa.",
            "Todo se paga con lo que llevas en la partida, no con gemas, y una sala nunca te mata. Si prefieres no arriesgar nada, siempre puedes seguir de largo. La Mazmorra no tiene salas: ahí no hay descanso.",
        ],
    },
    {
        version: 41,
        titulo: "Marcas y dones en la Torre",
        cambios: [
            "✦ Antes de subir a la Torre (o bajar a la Mazmorra) puedes elegir una marca: un trato con la Torre. Cada día se ofrecen 3 distintas. Te pone una dificultad extra (menos vida, sin pociones, sin magia, criaturas más duras, sin cura al subir…) y a cambio el premio final sube entre un 20 % y un 30 %.",
            "🎁 Dones: mejoras raras que cambian cómo peleas. Desde el piso 3, a veces entre tus tres opciones sale uno: 🩸 Sed de sangre, 🔔 Eco arcano, 🌵 Piel de espinas, 🏹 Ojo de cazador, 🔥 Fervor o 🎒 Botín de guerra. Cada uno se puede tener una sola vez por partida.",
            "Si ya tenías una partida a medias, sigue igual; las marcas y los dones valen para las que empieces ahora.",
        ],
    },
    {
        version: 40,
        titulo: "Reto del día en el arcade",
        cambios: [
            "🎯 Cada día hay un reto nuevo arriba del Arcade, por ejemplo «Llega a 300 puntos en la Carrera» o «Supera 4 pisos de la Torre». Se mide contra tu propio récord: ni imposible ni regalado.",
            "💎 Si lo cumples, ganas 6 💎 y 4 XP extra, una sola vez al día. Una barra te dice cuánto llevas.",
            "🔁 El reto cambia cada mañana y no repite el de ayer. La meta se fija al empezar el día: aunque hoy superes tu récord, el reto no se mueve.",
        ],
    },
    {
        version: 39,
        titulo: "Revisión semanal",
        cambios: [
            "📝 Al empezar la semana, la tarjeta «Tu semana» tiene un botón nuevo: «Hacer mi revisión». Tres pasos cortos: qué salió bien, qué quieres mejorar y cuáles misiones serán tu foco.",
            "💡 La revisión te recuerda qué misión fallaste más la semana pasada y el motivo que más repetiste, para que decidas con datos y no de memoria.",
            "⭐ Las misiones de foco (hasta 3) aparecen arriba de Hoy toda la semana, con una marca cuando ya las hiciste ese día.",
        ],
    },
    {
        version: 38,
        titulo: "La Torre despierta",
        cambios: [
            "🗼 La Torre despertó: la tormenta escondía la mitad. Ahora tiene 30 pisos: sobre la cima siguen los Puentes de nubes y la Corona de la Llama, con 10 criaturas nuevas. En lo más alto espera el Apagador, el que apagó la Llama hace cien años.",
            "👹 Las Sombras les enseñaron trucos a sus criaturas: 💠 barreras que se tragan tus golpes, 🌀 golpes cargados que sueltan al turno siguiente, 🪞 espejos que te devuelven los hechizos, criaturas que se regeneran y un jefe que cambia de punto débil a media vida.",
            "🎯 Técnicas de los Vigías, una por atributo real (desde su nivel 3, una vez por piso): 🔨 Quebrar (Fuerza), 🔍 Analizar (Intelecto), 😤 Intimidar (Carisma) y 🎯 Golpe certero (Riqueza).",
            "✨ Voluntad: una barra que se llena peleando y aguantando golpes (tu racha la empieza con algo). Llena, suelta un golpe enorme que rompe barreras y cargas.",
            "📜 La historia de la Torre cuenta por qué cambió todo, y el premio sube a 60 💎 y 45 XP.",
        ],
    },
    {
        version: 37,
        titulo: "La Torre, en el valle",
        cambios: [
            "🗼 La Torre de los Vigías está en el Valle del Comienzo, al principio del camino, donde Aurelio vive a su pie (como ya contaban el pergamino y sus memorias). Por eso se puede subir desde el primer día. Sus ventanas, en el mapa, se encienden con los pisos que subes.",
            "🔥 Al final de la Ciudadela ahora está el brasero de los Vigías, donde se junta el fuego de los cuatro memoriales. El final de la saga es volver al valle con ese fuego y encender la Llama: el camino termina donde empezó.",
            "🗺️ Desde las demás regiones, la Torre se ve a lo lejos: más chica cuanto más te alejas del valle, y otra vez más cerca al llegar a la Ciudadela, porque el camino da la vuelta.",
        ],
    },
    {
        version: 36,
        titulo: "La Llama, al final del camino",
        cambios: [
            "🕯️ La Llama de los Vigías ya no se enciende en el arcade: prende con el fuego de los cuatro memoriales de la Ciudadela, que arden cuando vences a los 20 señores del reino. Es el último acto de la saga, y se gana con tus días.",
            "🗼 Llegar a la cima de la Torre libera al último Vigía y abre la Mazmorra, pero la Llama sigue fría hasta que el reino sea libre. La Torre y la Mazmorra pueden ir por delante; ya no terminan la historia antes de tiempo.",
            "🧭 Nuevo orden de la saga: … El reino dividido, La cima de la Torre, El Rey Hueco y, al final, La Llama de los Vigías.",
        ],
    },
    {
        version: 35,
        titulo: "La Saga de la Llama",
        cambios: [
            "🧭 Todas las historias del juego ahora son una sola, con un objetivo: convertirte en Vigía. Liberar el reino de las Cuatro Sombras, volver a encender la Llama de la Torre y vencer al Rey Hueco.",
            "📚 En Héroe › Historia ves la saga completa: siete actos en orden, el de ahora con su meta y su progreso, y las historias ordenadas en el tiempo (la primera piedra, las memorias de Aurelio, la Crónica, la Torre, la Mazmorra y tu libro).",
            "🎯 Tu objetivo de la saga aparece en Hoy, en «Tu día», y cada acto que cumples se celebra y te dice cuál es el siguiente.",
            "🔗 Las historias se conectan: las Sombras volvieron cuando se apagó la Llama, Aurelio fue el aprendiz del último Vigía, el pergamino de Lía pasó por sus manos y tu dragón nació del último huevo de la Torre.",
        ],
    },
    {
        version: 34,
        titulo: "Armadura de pecho y equipo nuevo",
        cambios: [
            "🛡️ Nuevo espacio de equipo: el pecho. Peto de cuero, Cota de malla, Túnica arcana, Coraza de acero (épica) y la Coraza del Vigía (legendaria: se gana al encender la Llama, superando el piso 20 de la Torre).",
            "⚔️ Más equipo en la Tienda: Diadema de plata y Yelmo astado (cabeza), Daga del ladrón y Martillo de guerra (mano), Escudo redondo y Capa de plumas de cuervo (espalda), y dos fondos pintados: Mar embravecido (Aivazovski) y Aurora boreal (Church).",
            "✨ Seis habilidades nuevas en la Torre: Muralla, Rugido, Aturdir, Presagio, Aurora y Llama del Vigía.",
        ],
    },
    {
        version: 33,
        titulo: "La primera piedra",
        cambios: [
            "📜 Un pergamino nuevo para los días difíciles: «La primera piedra», la historia de quien empezó la Torre poniendo una piedra cada día. Diez capítulos, sus enseñanzas y una dedicatoria para ti (unos 9 minutos de lectura).",
            "Está en Héroe › Historia, y Aurelio te lo ofrece cuando le dices que no tienes ganas o que estás abrumado.",
        ],
    },
    {
        version: 32,
        titulo: "El equipo, con gemas",
        cambios: [
            "⚔️ El equipo de tu avatar (cascos, armas, capas…) ahora se compra con gemas 💎, igual que las mascotas. Las monedas 🪙 quedan solo para tus premios reales y las pociones de vida.",
        ],
    },
    {
        version: 31,
        titulo: "Monedas y gemas",
        cambios: [
            "🪙 Tus monedas ahora salen solo de lo que haces en la vida real: misiones, tareas, enfoque, misiones principales, tu diario, cerrar el día y tus logros. Son para tus premios reales.",
            "💎 Nueva moneda, las gemas: se ganan en el arcade (minijuegos, Torre y Mazmorra) y con los premios extra (jefes, cofre del día, desafíos y mapa). Se gastan en el arcade y en las mascotas.",
            "🧪 Bazar en el Arcade: con gemas compras provisiones para tu próxima subida o bajada (poción de reserva, piedra de afilar, pergamino arcano, raíz amarga contra el veneno y amuleto de vigor).",
            "⚖️ El arcade da la mitad de XP que antes. Tus monedas de siempre no cambian; las gemas empiezan en 0.",
        ],
    },
    {
        version: 30,
        titulo: "El Maestro Aurelio",
        cambios: [
            "🧙 Memorias de Aurelio: quién fue tu maestro antes de serlo, en 8 capítulos que te va contando a medida que avanzas (tu mejor racha, tus jefes, tu nivel, la Torre y la Mazmorra). Están en Héroe › Historia, y en Hoy te avisa cuando tiene algo nuevo que contarte.",
            "⚔️ En la Torre y en la Mazmorra te da una pista antes de cada guardián, y unas palabras cuando caes.",
            "🎉 Comenta cuando subes de nivel o vences a un jefe, responde a tu diario según cómo te fue y te despide al cerrar el día.",
            "💬 Puedes preguntarle «Háblame de ti» cuando conversas con él.",
        ],
    },
    {
        version: 29,
        titulo: "La Mazmorra del Abismo",
        cambios: [
            "⛓️ Bajo la Torre del héroe hay una mazmorra. Se abre cuando superas el piso 20 de la Torre (vence al Dragón de la tormenta).",
            "👹 20 criaturas nuevas en 4 zonas: Cisternas anegadas, Bosque de raíces, Santuario de las Sombras y Corazón del Abismo. Uno de sus guardianes es tu propio reflejo.",
            "💀 Es más difícil: pegan más fuerte y cada una tiene un ataque especial (☠️ veneno, 🩸 beber tu vida, 🔒 sellar tu magia o 🐚 coraza). Los guardianes se enfurecen a media vida y entre sótanos no descansas. Paga más: hasta 80 🪙 y 120 XP de Fuerza.",
            "📜 La Torre y la Mazmorra ahora cuentan una historia: quiénes eran los Vigías, por qué se apagó la Llama y qué hay debajo. Se lee la primera vez que llegas a cada zona, y lo que ya recorriste está en «📜 Historia», en el Arcade.",
            "🎵 En la Mazmorra suena la música de misterio, y el bestiario tiene una sección nueva para sus criaturas.",
        ],
    },
    {
        version: 28,
        titulo: "Cada mes y pantalla de carga",
        cambios: [
            "📅 Misiones de cada mes: en «Nueva misión» elige «Cada mes» y los días (ej: el 5, o el 1 y el 15). El 31 es el último día del mes, aunque el mes sea más corto.",
            "Ese día cuentan como cualquier misión (racha, vida, calendario y jefes), y en «Otros días» ves cuándo toca la próxima vez. Su aviso solo suena el día que toca.",
            "✨ Pantalla de carga al abrir la app, con un consejo de juego cada vez.",
        ],
    },
    {
        version: 27,
        titulo: "Todo en su lugar",
        cambios: [
            "🧭 La barra de abajo ahora es Hoy · Progreso · Aventuras · Héroe · Tienda. Tu héroe tiene su propia pestaña y los logros viven en Progreso.",
            "☀️ Hoy es más corto: tu héroe en pequeño con tus 4 rivales, y un solo panel «Tu día» con el Maestro, el evento, el cofre, tu pacto y los desafíos.",
            "🗂️ Las pantallas largas se dividen en secciones con un selector arriba que se queda a la vista: Progreso (números y logros), Héroe (equipo, mascotas, aspecto e historia) y Tienda (premios, equipo y mascotas).",
            "⚔️ En Aventuras se ve una campaña de jefes a la vez, con acceso directo al reino y al arcade.",
            "✨ Cada cosa está en un solo lugar (nada repetido) y todo se ve más limpio: paneles más suaves y la pestaña elegida resaltada.",
        ],
    },
    {
        version: 26,
        titulo: "Leyendas, mascotas y el reino",
        cambios: [
            "✨ Todo lo épico y legendario tiene ahora una habilidad especial en la Torre: esquivar, golpear dos veces, resistir un golpe mortal, ver el punto débil de cada criatura… Cada objeto dice la suya.",
            "🐾 Tu mascota pelea a tu lado en la Torre: el dragón escupe fuego, y cada especie tiene su habilidad. Cría, adulta y bien alimentada pelean distinto; triste, no pelea.",
            "🦉 Mascotas nuevas en la Tienda: Cuervo (común), Búho (rara), Basilisco y Grifo (épicas), Fénix y Dragón de escarcha (legendarias). Llegan como huevo y crecen con tus misiones.",
            "🗺️ El mapa ahora es el reino, en pixel art: seis regiones gobernadas por tus jefes. Cuando vences a uno, su guarida se libera y tiene botín; la fortaleza se abre al caer los cuatro.",
            "📜 La Crónica del reino cuenta la historia que une todo (las Sombras, sus veinte señores, el Maestro Aurelio, tu dragón y la Torre) y se escribe sola con lo que haces.",
        ],
    },
    {
        version: 25,
        titulo: "La Torre, como los clásicos",
        cambios: [
            "🗼 La Torre del héroe se ve como un juego de rol de consola: pixel art, la criatura a la izquierda, tu héroe a la derecha y ventanas azules con los comandos.",
            "👾 20 criaturas nuevas, propias de la Torre (ya no salen los jefes de tus hábitos), en 4 zonas: Cripta, Biblioteca, Fragua y Cima. Cada 5 pisos, un guardián.",
            "🔥 Magia de fuego, hielo y rayo: cada criatura tiene un punto débil (+50 % de daño) y algunas resisten otro. Hay que descubrirlo.",
            "📖 Bestiario: recuerda las criaturas que viste, cuántas veces las venciste y qué les hace cada hechizo. Está en el Arcade.",
            "🎯 Golpe preciso también cambió: ahora peleas contra una criatura de la Torre, en su sala.",
        ],
    },
    {
        version: 24,
        titulo: "Los jefes también pegan",
        cambios: [
            "🩸 Robo de vida: cuando fallas una misión, el jefe de su categoría te golpea, te quita vida y se cura con ella. Lo ves en una escena animada.",
            "🛡️ Barra de armadura: sale de tus objetos de protección (tu ropa, casco, capa, alas…). Llena, fallar duele menos; gastada, duele más. Se gasta al fallar y se repara cumpliendo.",
            "⚔️ Tu equipo ahora cuenta: cada objeto da armadura, ataque, magia o suerte (lo dice en la Tienda y en tu Personaje).",
            "🗼 En la Torre: más ataque, hechizos y críticos, y tu armadura para parte de cada golpe.",
            "🎮 En los minijuegos: escudos en la Carrera, vidas de más en la Lluvia de monedas y golpes más fuertes en Golpe preciso.",
        ],
    },
    {
        version: 23,
        titulo: "Música, leyendas y un mundo con más vida",
        cambios: [
            "🎵 Música de fondo: Brahms (épica), Holst (batalla) y Grieg (misterio). En la Torre suena la de batalla. Se elige en Ajustes.",
            "🪓 Equipo épico nuevo en la Tienda: Capucha del errante, Yelmo alado, Hacha de guerra, Mandoble y Capa real.",
            "🐉 Legendarios: Corona del Dragón (se compra) y tres que se ganan: Lanza del Dragón (8 jefes), Báculo arcano (12 pisos de la Torre) y Alas del Dragón (nivel 25).",
            "✨ Gráficos: luciérnagas, brasas, nieve o estrellas según tu fondo, rayos de luz, retratos de jefes que respiran, brillo en lo épico y legendario y pantallas que entran suave.",
        ],
    },
    {
        version: 22,
        titulo: "Un mundo que reacciona",
        cambios: [
            "🧙 El Maestro Aurelio: te habla según cómo vas y conversa contigo (en Hoy).",
            "🌅 Misión clave del día: vale el doble. 🌙 Ritual de la noche: repasa, escribe y cierra el día.",
            "🎁 Cofre del día con premio al azar, ⚡ desafíos relámpago y 🎲 eventos del día.",
            "⚔️ Golpe con timing al completar una misión: toca a tiempo para un crítico.",
            "🗺️ El mapa del viaje (chip en Hoy) y 🐉 tu dragón: acarícialo y aliméntalo.",
        ],
    },
    {
        version: 21,
        titulo: "Avisos más confiables",
        cambios: [
            "🔔 Cada aviso suena como uno nuevo (antes, si el anterior seguía en pantalla, el nuevo llegaba en silencio).",
            "⚡ Salen con prioridad alta, para que el iPhone no los retrase.",
            "🛡️ Si algo falla, igual llega un aviso: así el iPhone nunca corta tus notificaciones.",
            "🔕 Si se desconectan, la app te avisa en Hoy con un botón para reactivarlas.",
            "🎺 Con la app abierta, los avisos suenan con el cuerno de Vida RPG. Guía en Ajustes → Notificaciones.",
        ],
    },
    {
        version: 20,
        titulo: "Fallar con honor y tu libro",
        cambios: [
            "✗ Botón «Fallé» en cada misión: dices qué pasó, pierdes la vida en ese momento y se puede deshacer.",
            "📊 En la ficha de cada hábito, cuántas veces fallaste y tu motivo más común.",
            "📚 Tu diario ahora es un libro: cada día que escribes es un capítulo de «La crónica de» tu nombre.",
            "📖 Lo cuenta con tus palabras y lo que pasó ese día: misiones, jefes, logros y tropiezos. Se puede descargar.",
        ],
    },
    {
        version: 19,
        titulo: "El Tratado de la Voluntad",
        cambios: [
            "📜 Un pacto de sangre contigo mismo, por ti y para ti, con frases de Séneca, Marco Aurelio, Epicteto y otros.",
            "✍️ Escribe tu porqué, fírmalo con tu dedo y séllalo con lacre.",
            "🛡️ Cada día, en Hoy: el día de tu pacto, cuánto lo has honrado y una cita. Su ley: nunca fallar dos días seguidos.",
        ],
    },
    {
        version: 18,
        titulo: "Un diario de verdad",
        cambios: [
            "📖 «Tu diario»: calendario de ánimo, recuerdos, buscador y descarga (botón «Ver todo» en el diario de Hoy).",
            "🤩 5 ánimos, una pregunta distinta cada día y «Hoy agradezco…».",
            "🔎 Lo que dice tu diario: cómo cambia tu ánimo los días que cumples tus misiones.",
            "✍️ Escribirlo da +5 XP de Carisma, 2 monedas y cura 2 de vida. Lleva su propia racha.",
        ],
    },
    {
        version: 17,
        titulo: "Tus propios atributos",
        cambios: [
            "✨ Crea atributos para cosas específicas (Programación, Inglés, Salud…) en Progreso → Atributos.",
            "📈 Cada uno tiene su propio nivel, y su XP también sube uno de tus 4 atributos.",
            "🎯 Úsalos en misiones, tareas, enfoque, misiones principales y logros.",
        ],
    },
    {
        version: 16,
        titulo: "La vida de tu héroe",
        cambios: [
            "❤️ Tu héroe tiene vida: la pierde por lo que no haces cada día y la recupera cumpliendo.",
            "✨ Con 80 % o más estás en plena forma: +10 % de XP y monedas.",
            "☠️ Si llega a 0, la tienda y el arcade se cierran hasta que recuperes la mitad.",
            "🧪 Pociones de vida en la Tienda (una al día).",
            "🏖️ Modo descanso en Ajustes, para vacaciones o días enfermo.",
            "🌙 El aviso de la noche dice cuánta vida pierdes si no terminas, y en la Torre subes con tu vida real.",
        ],
    },
    {
        version: 15,
        titulo: "Más profesional",
        cambios: [
            "☁️ Copia automática en la nube, cifrada con tu contraseña (Ajustes).",
            "🙂 Desbloqueo con Face ID, además del PIN.",
            "👉 Desliza una misión para completarla y «Deshacer» si te equivocas.",
            "🌅 Misiones por momento del día y «↕ Ordenar» arrastrando.",
            "📊 Toca una misión para ver su ficha: racha, récord y calendario.",
            "📌 «Una sola vez» al crear una misión, y tareas sin fecha.",
            "📋 Hábitos y premios listos para elegir con un toque.",
        ],
    },
    {
        version: 14,
        titulo: "Gráficos y Torre del héroe",
        cambios: [
            "🖼️ Fondos y escenarios con pinturas clásicas.",
            "🛡️ Avatar, dragón y equipo con más detalle.",
            "🗼 La Torre del héroe: batallas por turnos en el Arcade.",
        ],
    },
    {
        version: 13,
        titulo: "Avisos por misión",
        cambios: ["⏰ Cada misión puede avisarte a su hora, solo si no la has hecho."],
    },
    {
        version: 12,
        titulo: "Notificaciones",
        cambios: ["🔔 Recordatorios a las horas que elijas y aviso al terminar el enfoque."],
    },
    {
        version: 11,
        titulo: "Agenda y semana",
        cambios: [
            "📌 Tareas sueltas, metas semanales y misiones con cantidad.",
            "⏱️ Modo enfoque, 📓 diario, 🎯 desafío semanal y resumen de tu semana.",
        ],
    },
];

// Las novedades que todavía no viste (como mucho las 3 últimas versiones).
export function novedadesPorVer(vista) {
    return NOVEDADES.filter((n) => n.version > vista).slice(0, 3);
}
