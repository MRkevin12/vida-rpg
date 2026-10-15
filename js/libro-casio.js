// libro-casio.js — «El Centinela»: el libro de la vida de Casio, el último Vigía (v62).
//
// Es una novela en tres libros y veinticuatro capítulos, escrita por Aurelio, que fue su aprendiz. Une lo que ya cuentan las
// otras historias (las Memorias de Aurelio, la Torre, el diario de Casio, el pergamino del nombre raspado) y le agrega lo
// que faltaba: de dónde venía Casio, por qué subía sin miedo, qué pasó aquella noche de tormenta y cómo fueron los cien años
// que pasó de guardia en el piso 19.
//
//   Libro primero: La orilla (capítulos I a V) · su infancia y su primera subida.
//   Libro segundo: La Torre (capítulos VI a XVIII) · los años de los Vigías, Aurelio, Ceniza y la noche de la tormenta.
//   Libro tercero: La guardia (capítulos XIX a XXIV) · los cien años del Centinela y el día en que alguien subió.
//
// Los libros primero y segundo se pueden leer desde el principio. El tercero (el Centinela y el final) se abre cuando liberas
// a Casio en la Torre (superar el piso 20), porque cuenta lo que hay detrás de ese combate.
//
// Cada capítulo termina con lo que Casio aprendió («la moraleja»). Al terminar el libro hay una escena y un premio.
//
// Es TEXTO PLANO (vistas.js lo escapa). {n} es el nombre de tu héroe y solo aparece en el libro tercero.
// No dice que la Llama ya arde: eso solo pasa al final de la Saga (ver saga.js).
//
// Ojo con lo que ya cuentan las otras historias: el Archivista y el Caballero sin Nombre siguen en sus pisos (los vence tu
// héroe más tarde), el sello de la Fragua sigue entero (se parte cuando cae el Señor de la Fragua) y el Apagador sigue siendo un
// misterio. Hay una prueba que revisa que no se cuele ninguna contradicción obvia.

export const ID = "casio";
export const TITULO = "El Centinela";
export const SUBTITULO = "La historia de Casio, el último Vigía, contada por quien fue su aprendiz.";
export const AUTOR = "Aurelio";

// Lo que hace falta para abrir el libro tercero: el piso de la Torre que hay que haber superado.
export const PISO_PARA_EL_FINAL = 20;
// Cuántos capítulos se pueden leer desde el principio (los libros primero y segundo).
export const CAPITULOS_LIBRES = 18;

// Lo que se gana al terminar el libro (una sola vez).
export const PREMIO = { xp: 40, gemas: 20 };

// Los tres libros: en qué capítulo (empezando en 0) empieza cada uno.
export const LIBROS = [
    { desde: 0, titulo: "Libro primero", nombre: "La orilla" },
    { desde: 5, titulo: "Libro segundo", nombre: "La Torre" },
    { desde: 18, titulo: "Libro tercero", nombre: "La guardia" },
];

export const PROLOGO = [
    "Durante cien años me pregunté cómo se contaba a un hombre que se había convertido en una armadura. Por fuera, Casio fue eso: un guerrero azul de piedra y viento en el piso diecinueve, que no dejaba pasar a nadie. Quien lo veía por primera vez pensaba en un monstruo. Quien lo veía por segunda, en un muro. Nadie pensaba en un muchacho que tuvo miedo a la oscuridad.",
    "Ahora que alguien lo ha liberado, me han pedido que escriba quién era. Lo hago porque se lo debo, y porque descubrí algo demasiado tarde: una persona no es lo último que le pasó. Casio no fue la guardia de cien años. Fue todo lo que había antes, y la guardia fue solo su manera de seguir siendo él.",
    "Lo que sé de su infancia me lo contó él mismo, durante las noches de subida, en esa hora en que los hombres callados se vuelven hablantes. Lo que él no me contó, me lo contó su hermana Isa, que vivió hasta los noventa años en la misma casa de brea, junto al río. Lo que pasó después de la tormenta lo he reunido de quienes llegaron al piso diecinueve y de algunas cosas que solo se explican si uno acepta que una armadura puede pensar.",
    "Escribo despacio, como me enseñó. Tú, que lees esto, léelo igual.",
];

export const CAPITULOS = [
    // ===== LIBRO PRIMERO: LA ORILLA =====
    {
        titulo: "El hijo del barquero",
        parrafos: [
            "Casio nació en la orilla del río que corre al pie del valle, en una casa de tablas que olía a brea y a pescado. Su padre era barquero: cruzaba a la gente de una orilla a la otra por unas monedas o por un favor, según quién fuera. Su madre remendaba redes y cantaba muy bajito mientras lo hacía, de tal forma que la casa entera parecía tener una melodía de fondo, como el rumor del agua. Casio creció entre las dos cosas: el canto bajo y la corriente.",
            "De su padre aprendió lo primero que supo: que al río no se le discute. «Puedes remar contra la corriente un rato —le decía—, pero al final hay que entender hacia dónde va el agua y buscar la forma de cruzarla igual.» Era una frase que repetía cada vez que algo se ponía difícil, sin darle más importancia que a un refrán. Años después, ya en la Torre, Casio la usaba como quien usa un martillo: sin pensar de dónde la había sacado.",
            "Era un niño flaco, callado y miedoso. Le tenía miedo a la oscuridad, a los perros grandes y, sobre todo, a lo que no sabía. En las noches sin luna se tapaba la cabeza con la manta y escuchaba los ruidos de la casa como si cada uno fuera un paso. El crujido de una tabla era un ladrón. El golpe del agua contra el muelle, un animal. El silencio entre un ruido y otro, lo peor de todo, porque en el silencio podía caber cualquier cosa.",
            "Su padre lo sabía y nunca se burló. Una noche, cuando Casio tenía siete años, lo sacó de la cama sin decir nada, lo envolvió en una manta y lo llevó al muelle. Lo sentó en el bote, soltó la amarra y remó hasta el medio del río, donde dejó que la barca se meciera en silencio. No había luna. No había nada.",
            "«Mira —le dijo—. Está oscuro. Pero el río sigue ahí, igual que de día. Lo único que cambió es que tú no lo ves.» Y no dijo más. Se limitó a esperar, con los remos recogidos, mirando como si hubiera algo que mirar. Casio, con el corazón en la garganta, hizo lo mismo. Al principio solo vio negro. Después, poco a poco, sus ojos empezaron a acostumbrarse. Primero apareció el brillo del agua. Luego la silueta de la otra orilla, más oscura que el cielo. Después las estrellas, que habían estado ahí todo el tiempo.",
            "La oscuridad seguía siendo oscuridad, pero ya no era un enemigo. Era un lugar donde había que esperar un poco antes de ver. Casio, en la barca, con su padre callado al lado, sintió algo parecido a un descubrimiento: que no todo lo que da miedo se vence peleando, y que algunas cosas se vencen simplemente quedándose.",
            "Años después, cuando Casio enseñaba a otros, repetía una frase que no sabía de dónde la había sacado, aunque yo sí lo sé: «El miedo casi siempre es lo que sentimos antes de que los ojos se acostumbren». Me lo dijo a mí una noche, subiendo, cuando el piso de arriba parecía demasiado oscuro para pisarlo. Subí igual, y tenía razón.",
        ],
        moraleja: "Al miedo no se le gana huyendo: se le gana quedándose el rato que hace falta para que los ojos se acostumbren.",
    },
    {
        titulo: "Las monedas del barquero",
        parrafos: [
            "Cuando Casio tenía doce años, ocurrió algo pequeño que moldeó, sin que él lo supiera, buena parte de lo que sería. Una mañana, al limpiar el bote después de un cruce, encontró debajo de un banco una bolsa de cuero llena de monedas. No eran monedas de cobre como las de su padre. Eran de plata, brillantes, y había tantas que sus dedos no alcanzaron a rodear la bolsa.",
            "No dijo nada. Se sentó en el muelle con la bolsa en las rodillas y pensó en todo lo que podía hacerse con ella. Podía comprar un bote nuevo para su padre, de los que no hacen agua. Podía comprarle a su madre una red mejor, o una manta que no estuviera remendada cuatro veces. Podía comprar libros, aunque aún no sabía leer bien. Cada cosa que imaginaba era buena, y eso era lo peligroso: la bolsa no le pedía hacer nada malo, solo algo comprensible.",
            "Se la enseñó a su padre al caer la tarde. El barquero la miró un rato, sopesándola en la mano, y luego preguntó: «¿Dónde la encontraste?». «Bajo el banco.» «¿Y de quién crees que es?» «No lo sé.» «Sí lo sabes —dijo el padre—. De quien cruzó esta mañana.» Casio asintió despacio. Había cruzado un mercader de la ciudad alta, un hombre gordo y apurado, que había pagado tres cobres y se había ido sin mirar atrás.",
            "Al día siguiente, a primera hora, padre e hijo remaron hasta la otra orilla y caminaron dos horas hasta el almacén del mercader. El hombre se puso pálido al ver la bolsa, y luego rojo, y luego sonrió con una sonrisa que a Casio no le gustó: la de quien calcula cuánto debe agradecer. «Muy honrado —dijo—. Os mereceis una recompensa.» Sacó cinco monedas de plata de la bolsa y se las ofreció. El barquero negó con la cabeza. «No hace falta.» «Insisto.» «Nos paga el río», contestó el padre, y se dio la vuelta.",
            "De regreso, Casio no pudo evitar preguntar: «Con cinco monedas hubiéramos podido arreglar el techo». «Sí», dijo el padre. «Entonces, ¿por qué…?» El barquero dejó de remar. «Porque las cinco monedas, hijo, no eran por devolver lo que era suyo. Eran por no haberme quedado con ello. Y eso no se paga. Si empiezas a cobrar por no robar, un día no robarás solo por cobrar, y ya no será lo mismo.»",
            "Casio no lo entendió del todo. Lo entendió años después, en la Biblioteca, leyendo sobre las Cuatro Sombras. Supo entonces que la Sombra del Tesoro no entra por las grandes puertas, sino por las pequeñas monedas. Que nadie se vuelve codicioso de golpe, sino a fuerza de decir «solo esta vez» y «es comprensible». Y que su padre, sin saberlo, había apagado a una de ellas un día cualquiera, en un bote, sin ninguna espada.",
        ],
        moraleja: "Las grandes caídas empiezan con las pequeñas monedas. No se paga la honradez: se practica, y se practica cuando nadie lo sabría.",
    },
    {
        titulo: "Isa",
        parrafos: [
            "Casio tenía una hermana, dos años menor, llamada Isa. Si él era flaco, callado y miedoso, ella era redonda, ruidosa y valiente. A los cinco años se tiraba al río desde el muelle sin pensarlo, y a los seis le había dicho a un perro enorme, que ladraba a todo el que pasaba, que se callara de una vez. El perro, asombrado, se calló. Casio la miraba con una mezcla de envidia y de asombro: ¿cómo era posible no tener miedo?",
            "Se lo preguntó una noche, a los nueve años, cuando se quedaron solos en la casa. Isa se encogió de hombros: «Sí tengo miedo. Solo que me dura menos». Casio pensó que era una respuesta absurda, pero no lo era. Con los años descubriría que el miedo de Isa era igual que el suyo, solo que ella no lo guardaba: lo sentía, lo gritaba, lo dejaba salir y seguía. Casio, que lo almacenaba en silencio, se cansaba el doble.",
            "Fue Isa la que inventó, sin darse cuenta, la frase que haría famoso a Casio. Una tarde de lluvia, él se negaba a cruzar el río para recoger unas redes: el agua estaba revuelta, el cielo negro, y tenía una sensación fea en el estómago. Isa lo miró con impaciencia. «Tienes miedo hoy —le dijo—. Y mañana también lo tendrás. Así que vamos hoy, y mañana tendrás una cosa menos de qué asustarte.» Cruzaron. Fue un cruce duro, empapado y lleno de tropiezos. Pero cuando terminaron, Casio se sentó en la orilla con las redes sobre las rodillas y sintió algo muy parecido a la paz.",
            "Cuando Casio se fue a la Torre, Isa se quedó. Lo vio marchar con una mezcla de orgullo y de tristeza. Alguien tenía que cuidar a los padres, que se hacían viejos; alguien tenía que seguir con el bote. Heredó la barca a los veintidós y fue barquera cuarenta años. Cruzó a miles de personas de una orilla a la otra, y a cada una, sin saberlo, le dio un poco de aquella calma práctica que era su manera de ser valiente.",
            "No volvieron a verse muy seguido. Casio subía a la Torre por la mañana y bajaba al atardecer; Isa trabajaba de sol a sol en el río. Pero una vez al año, el día de su cumpleaños, se encontraban en el muelle al amanecer y cruzaban juntos, sin decir nada, hasta el medio del río, donde dejaban que la barca se meciera. Era su manera de decirse todo lo que nunca decían.",
            "Años después, cuando le conté a Isa que Casio había subido a la cima y no había vuelto a bajar, ella me escuchó en silencio, con las manos en el regazo. «No me sorprende —dijo al fin—. Mi hermano nunca supo irse a medias.» Después añadió algo que me quedó grabado: «No todos subimos la Torre, Aurelio. Pero alguien tiene que cuidar el río. Y eso también es subir».",
        ],
        moraleja: "No todos suben la misma torre. Cuidar lo que otros dejan atrás, el río, la casa, la barca, también es una forma de subir.",
    },
    {
        titulo: "La canción de la casa de brea",
        parrafos: [
            "La madre de Casio cantaba. No cantaba para nadie, ni en fiestas, ni en la plaza: cantaba para sí misma, muy bajito, mientras remendaba las redes, y nadie le había enseñado esa melodía porque ella la había inventado. Tenía una sola estrofa, sin palabras, que subía tres notas y bajaba dos, y que se repetía una y otra vez, de forma que a veces parecía no empezar ni terminar nunca, como el río.",
            "Casio se dormía con ella. Era lo primero que oía por las mañanas y lo último por las noches. Cuando tenía miedo, bastaba que la oyera en la habitación de al lado para que el miedo se volviera un poco más pequeño. Nunca le preguntó por qué cantaba. Un día, ya mayor, lo hizo, y ella, sorprendida, tardó en contestar. «No lo sé —dijo—. Creo que canto para no oír mis pensamientos.»",
            "Casio se rio, pero luego lo pensó mucho. Su madre, sin saberlo, le había dado una herramienta: que a veces no hay que vencer lo que uno piensa, sino darle algo que hacer con las manos y la voz mientras pasa. Una melodía sencilla, una repetición, un ritmo. Cuando se fue a la Torre, se la llevó consigo. La tarareaba por las escaleras, tres notas arriba, dos abajo, al compás de sus pasos.",
            "Yo la oí por primera vez el segundo día de subir con él. Pensé que era una costumbre rara de viejo. Al tercer día la tarareaba yo también, sin darme cuenta, y al cuarto me pillé siguiéndola con los pies. Descubrí que los escalones se hacían más cortos cuando uno subía al ritmo de algo. Que el cansancio, en vez de pesar, se repartía en compases. Casio nunca me explicó la melodía ni de dónde venía. «Es de mi madre», decía, y nada más.",
            "Años después, la tarareaba yo solo en la oscuridad del piso doce, y noté con una especie de asombro que la había aprendido sin querer, igual que él. No sé a cuántos he enseñado la canción desde entonces. A todos los que suben conmigo se la dejo al oído, y ellos la llevan donde van. Quizá, en algún lugar, alguien la tararee ahora en una escalera cualquiera sin saber que la inventó la madre de un barquero, hace mucho, para no oír sus pensamientos.",
        ],
        moraleja: "A veces no hay que vencer los pensamientos: basta con darles un ritmo. Una canción sencilla acorta cualquier escalera.",
    },
    {
        titulo: "La pregunta del Caballero",
        parrafos: [
            "A los diecisiete años, Casio vio por primera vez la Torre de cerca. Hasta entonces había sido para él una sombra lejana en el valle, como una montaña con ventanas. Pero ese verano su padre enfermó, con una tos que no cedía y una fiebre que subía por las noches, y los barqueros de la orilla le dijeron lo que todos decían de la Torre: que quien la subía volvía distinto. Casio no quería volver distinto. Quería que su padre mejorara. Y alguien le dijo que en lo alto había una Llama que alumbraba más lejos que cualquier cosa, y que quien la veía cerca podía pedirle algo.",
            "Subió sin plan y sin armas, con unas botas gastadas y un pedazo de pan en el bolsillo. Pasó la puerta de la Cripta, donde las antorchas ardían con un fuego azul que no daba calor, y recorrió pasillos de tumbas sin nombre, con el corazón latiéndole en los oídos. Llegó a una puerta cerrada. Delante había una armadura de pie, con un yelmo que no miraba a nadie. No se movía, pero cuando Casio quiso pasar, una voz salió de dentro, tranquila y sin prisa: «¿Por qué subes?».",
            "Casio contestó lo que pensaba, que era la pura verdad: «Para que mi padre se cure». La armadura no se apartó. «Esa es la razón por la que empezaste —dijo—. Yo te pregunto por qué subes.» Casio se quedó callado. No lo sabía. Intentó con «para ser fuerte», con «porque quiero ver la Llama», con «porque no tengo otra cosa que hacer». A todas la armadura respondió igual, sin enfado, con la misma paciencia de una piedra: «Esa es la razón por la que empezaste».",
            "Bajó al anochecer sin haber pasado. Volvió al día siguiente y al otro. Cada vez la misma pregunta, cada vez una respuesta nueva, cada vez el mismo silencio. La armadura no tenía nombre ni cara. Era el Caballero que guardaba la puerta desde hacía siglos, y tampoco él recordaba el suyo: lo había dejado, decía, para no tener nada que defender salvo el juramento. Casio, que no entendía ni el juramento ni la pregunta, volvía igual.",
            "Mientras tanto su padre mejoraba, despacio, sin ayuda de ninguna Llama. Casio lo veía sentarse al sol, probar el caldo, volver a tomar los remos. Una noche, mirándolo, comprendió algo extraño: que había subido a la Torre por una razón que ya no existía. Su padre estaba curado. Podía dejarlo, volver al muelle, retomar la vida de siempre. Y sin embargo, a la mañana siguiente, se encontró otra vez en el primer escalón. No sabía por qué.",
            "La puerta se abrió al octavo día, sin que Casio hubiera dicho nada brillante. Se abrió porque ese día, en vez de contestar, se sentó en el suelo frente al Caballero y dijo: «No lo sé todavía. Pero vuelvo todos los días». La armadura se hizo a un lado con un chirrido de metal viejo. «Eso —respondió— ya es una razón para subir. Las otras las irás descubriendo en el camino.»",
            "Pasó la puerta con las rodillas temblando. Detrás había una escalera larga y empinada, y un olor a polvo y a siglos. No sabía qué había arriba. Sabía solo que había subido un piso más que el día anterior, y que al día siguiente subiría otro. Fue la primera vez que pensó, sin saber que lo pensaba, esas palabras que lo definirían: «Porque ayer subí».",
        ],
        moraleja: "No hace falta saber por qué subes para empezar. Basta con volver mañana: las razones se encuentran caminando.",
    },

    // ===== LIBRO SEGUNDO: LA TORRE =====
    {
        titulo: "Los años de la Biblioteca",
        parrafos: [
            "El padre de Casio se curó ese otoño, no por la Torre, sino por el tiempo y un buen caldo. Casio comprendió que había subido por una razón y se quedaba por otra, y que esa segunda razón era más fuerte. Dejó el muelle, aprendió el juramento de los Vigías y, con él, el hábito de subir un piso cada día. Isa le cosió una bolsa para el pan; su madre, un abrigo con tres bolsillos. «Para que lleves lo que haga falta», le dijo. A los veinte años llegó a la Biblioteca.",
            "Allí vivía el Archivista. Era un anciano más hecho de papel que de carne, que llevaba siglos buscando una única respuesta, y que escribía la misma pregunta en el margen de cada libro: «¿Cómo se vence a una Sombra para siempre?». Casio, que aún no tenía miedo a los libros, se instaló en una mesa del fondo y empezó a leer. Leyó tres años.",
            "Aprendió a ordenar lo que sabía, a dudar de las respuestas fáciles y a distinguir entre lo que un libro dice y lo que quiere que creas. Aprendió que los Vigías de antes habían escrito mucho sobre cómo pelear y casi nada sobre cómo no cansarse. Aprendió los nombres de las Cuatro Sombras, sus costumbres, sus disfraces. Aprendió que la Torre tenía treinta pisos, aunque nadie hubiera visto más de veinte, y que había una zona, sobre las nubes, que ninguno de los libros describía.",
            "Y aprendió algo que lo acompañó siempre: que saber una cosa no es lo mismo que hacerla. En esa mesa había leído cien veces cómo se sube un piso, y el piso lo seguía subiendo a pie. Los libros no le aliviaban el cansancio ni le hacían los escalones más bajos. Lo único que hacían, y no era poco, era enseñarle qué estaba haciendo mientras lo hacía.",
            "El Archivista lo observaba de lejos, con unos ojos que parecían dos monedas viejas. Un día, ya muy anciano, se le acercó con un libro cerrado y le dijo: «Lo leí todo. Hallé la respuesta en la primera página y tardé dos siglos en entenderla». Abrió el libro. En la primera página solo había una línea: «No se puede. Se vence cada día, o vuelve».",
            "Casio no lo entendió ese día. El Archivista, antes de volver a su mesa a seguir buscando como si nada, señaló con un dedo que ya era casi ceniza hacia el suelo, hacia abajo, hacia el fondo de la Torre. «Allí está la otra mitad de la respuesta —susurró—. Pero ese libro no lo escribió nadie.» Casio levantó la vista hacia el dedo, hacia el suelo, hacia la nada. Y supo, con la intuición de quien aún no tiene palabras, que algún día tendría que bajar.",
        ],
        moraleja: "Saber cómo se hace una cosa no la hace. Lo que vence a las Sombras no se aprende en los libros: se repite cada día.",
    },
    {
        titulo: "El invierno que no subió",
        parrafos: [
            "Hay una parte de la vida de Casio que casi nadie conoce, porque él nunca la contaba, y que sin embargo es la más importante. Fue en su cuarto invierno en la Torre, cuando ya llevaba tres años en la Biblioteca. Había leído tanto que había empezado a confundir leer con subir. Pasaba el día entero en su mesa, con una vela, descifrando cosas, y al anochecer se decía a sí mismo: «Hoy ya hice suficiente». Y no subía el piso.",
            "Al principio fue un día. Después dos. Luego una semana, porque había descubierto un libro fascinante. Luego otra, porque hacía frío y las escaleras estaban heladas. Luego tres, porque ya llevaba tantos días sin subir que subir de nuevo le parecía un esfuerzo desproporcionado. En el fondo sabía lo que estaba pasando. Era la misma historia que había leído de los Vigías que dejaron de jurar: no una decisión, sino una acumulación de excusas razonables.",
            "Lo que lo despertó fue una conversación casual con una Vigía vieja llamada Marta, que bajaba a buscarle un libro. «¿Hace cuánto que no subes?», le preguntó sin mirarlo. Casio, que se pasaba la vida preguntando, no supo responder. Hizo la cuenta de cabeza: veintitrés días. Sintió que el estómago se le caía.",
            "«No me mires así —dijo Marta—. Le pasa a todo el mundo. Lo que no le pasa a todo el mundo es darse cuenta.» Dejó el libro sobre la mesa y añadió con suavidad: «Hay una regla, muchacho. Puedes faltar un día. Nunca dos seguidos. No porque el segundo sea peor, sino porque es en el segundo donde se te olvida que habías faltado el primero».",
            "Casio no durmió esa noche. A la mañana siguiente, con el cuerpo molido y la cabeza llena de reproches, se plantó al pie de la escalera. No tenía fuerzas para subir un piso entero. No tenía ganas de nada. Subió un solo escalón. Se quedó parado en él, con una mano en la baranda, respirando como quien ha corrido una carrera. Luego bajó, se fue a su mesa y se puso a leer. Pero lo había hecho: había subido un escalón.",
            "Al día siguiente subió dos. Al otro, un piso entero, a regañadientes. No hubo gloria en el regreso ni música ni sentimiento de redención. Hubo solo un chico cansado que volvía a hacer, con torpeza, lo que había dejado. Años después, cuando le conté mi propio invierno sin subir, Casio solo me dijo: «No importa cuántos días faltaste. Importa si volviste el siguiente». Y yo supe que lo decía con conocimiento de causa.",
        ],
        moraleja: "Volver es el verdadero juramento. No importa cuánto te alejaste: importa si hoy subes aunque sea un escalón.",
    },
    {
        titulo: "El acero que cayó del cielo",
        parrafos: [
            "En la Fragua el aire quemaba. Casio llegó a ella con veintitrés años y un cuerpo que ya sabía subir. La Torre sube hacia el cielo, pero la Fragua la agarra desde abajo: su fuego viene de las profundidades, y los Vigías forjaban allí sus armas con un metal que no se encuentra en las minas.",
            "Ese metal cae del cielo. Cuando hay tormenta en la cima, el rayo que golpea la Torre deja caer al piso de arriba unas gotas de acero azul, tan puro que parece un trozo de cielo congelado. Los Vigías lo recogían, lo bajaban a la Fragua y lo trabajaban con paciencia. El herrero se llamaba Brann y era un hombre grande, de manos negras y poca conversación. Aceptó a Casio con una condición: «Si quieres una armadura, la forjas tú. Yo solo soplo el fuego».",
            "Tardó casi un año. Casio hizo la coraza, mal; la deshizo; hizo otra, peor; la volvió a deshacer. Le sangraban las manos, le dolía la espalda, y varias veces estuvo a punto de tirar el martillo y volver a su mesa de libros, donde nada quemaba. Brann nunca dijo una palabra de ánimo. Solo, cuando Casio estaba a punto de abandonar, dejaba a su lado un cuenco de caldo y se marchaba sin mirarlo.",
            "Con el tiempo la armadura salió, azul como el amanecer en la cima, ligera para su resistencia y con un pequeño defecto en el hombro izquierdo que Casio nunca quiso arreglar. «Me recuerda quién la hizo», decía. Cuando se la puso por primera vez, Brann la miró de arriba abajo, golpeó la coraza con el nudillo y gruñó: «Sirve». Era la mayor alabanza que Casio recibiría de él, y la guardó como un tesoro.",
            "Fue en la Fragua donde Casio descubrió algo que no se contaba. Debajo del yunque más grande, medio oculto por el hollín, había un sello de hierro de casi un metro de ancho, con una inscripción que ya nadie leía. Casio la limpió con un trapo, letra a letra, durante una semana. Decía: «Aquí se cierra lo que no debe salir». No entendió nada. Lo anotó en un papel, lo guardó en el pecho y pensó en el dedo ceniciento del Archivista, apuntando hacia abajo.",
            "Se lo mostró a Brann. El herrero se limitó a asentir, como si siempre lo hubiera sabido. «Las cosas importantes —dijo— se esconden a la vista. La gente pasa por encima y no las ve porque ya tiene decidido qué es una herrería.» Fue lo más largo que le oyó decir en tres años. Después volvió a soplar el fuego y no habló más del asunto. Pero Casio, que ya empezaba a sospechar lo que había debajo de la Torre, cada vez que pasaba junto al yunque pisaba con un poco más de cuidado.",
        ],
        moraleja: "Lo que de verdad te protege no se compra ni se hereda: se forja tú mismo, aunque salga torcido la primera vez.",
    },
    {
        titulo: "Los doce nombres",
        parrafos: [
            "Una de las cosas que Casio hacía cada mañana, antes de subir, era pasar la mano por la piedra del primer piso. Allí estaban grabados los nombres de los doce primeros Vigías, los que habían jurado ante Lía cuando la Torre apenas tenía pisos. Eran doce nombres de doce personas que habían subido, una por una, cuando nadie sabía si valdría la pena. Casio los conocía de memoria, y los repetía por lo bajo como quien reza.",
            "Pero había un hueco. En la sexta línea había un nombre raspado, como con un cuchillo, hasta dejar la piedra lisa. Casio lo había visto cientos de veces sin preguntarse nada. Una mañana, quizá porque había leído demasiado, quizá porque a veces las preguntas llegan cuando tienen que llegar, se detuvo ante el hueco y pensó: «¿Quién era?».",
            "Se lo preguntó a Marta, que ya era vieja. Ella tardó en responder. «Se llamaba Orrin —dijo al fin—. El mejor de los doce. Subía más rápido que nadie, escribía mejor que nadie y tenía una risa que se oía desde la cantera.» Casio esperó. «Un invierno pidió descansar un día, y ese día no terminó.» Marta se quedó mirando el hueco con una expresión difícil de descifrar. «Raspó su nombre alguien que lo quería mucho. Dicen que fue para no tener que verlo cada mañana.»",
            "«¿Y qué pasó con él?» «Se quedó abajo. Muy abajo. Hay cosas que se cuentan, pero yo no las cuento.» Casio no insistió. Dio las gracias, subió su piso del día y, por la noche, anotó en su diario: «El nombre raspado se llama Orrin. Se rindió sin hacer ruido. Cuando nos rindamos nosotros, tampoco hará ruido».",
            "Esa noche, al bajar, hizo algo que nunca había hecho. Se detuvo ante el hueco, sacó un clavo de su bolsa y, con la punta, grabó muy despacio, sobre la piedra lisa, una sola letra: una O. No el nombre completo. Solo la inicial, pequeña, casi invisible. «No voy a borrarlo —murmuró—. Pero tampoco voy a olvidarlo.» Porque había comprendido que raspar un nombre es una forma de esconder una herida, y que las heridas escondidas no se curan: se enconan.",
            "Cuando yo llegué a la Torre, años después, la O seguía allí. Casio me la mostró un día, con su manera sobria de enseñar. «Aquí lo recordamos —dijo—. No para juzgarlo. Para no repetirlo.» Pasé la mano por la letra, fría y pequeña, y sentí una especie de respeto. Mucho más tarde, cuando bajé a los sótanos donde vive el Rey Hueco, supe de quién era la corona que rodaba por el suelo, y me alegré de que alguien, alguna vez, hubiera tenido el valor de recordarlo.",
        ],
        moraleja: "No raspes lo que duele: recuérdalo, para no repetirlo. Lo que se esconde no se cura; lo que se nombra, sí.",
    },
    {
        titulo: "Los Vigías que quedaban",
        parrafos: [
            "Cuando Casio llegó a la cima de la Torre, ya casi no había Vigías. Los doce primeros, los de los nombres grabados en el primer piso, eran una leyenda; sus hijos, un recuerdo; y los hijos de sus hijos, apenas una docena de hombres y mujeres repartidos por los pisos, que subían menos cada año. Nadie había perdido una batalla. Simplemente, poco a poco, la gente había dejado de jurar en voz alta.",
            "«Ya sé lo que se promete —decían—. No hace falta decirlo.» Y una cosa que no se dice se olvida un poco más cada día. Casio, con su costumbre de preguntar, fue de uno en uno. A una anciana llamada Marta le preguntó por qué había dejado de subir. «No dejé de subir —contestó—. Subo cuando puedo.» A un hombre de su edad, llamado Dante, le preguntó lo mismo. «Descanso un poco —dijo—. Ya volveré.»",
            "Ninguno era malo ni cobarde. Todos eran amables y razonables, y ninguno tenía una fecha de regreso. Casio recordó las palabras de un pergamino viejo que había leído en la Biblioteca: descansar es parar con una fecha de vuelta; rendirse es parar sin escribirla. Y sintió, por primera vez, un frío distinto al de las alturas.",
            "Quiso cambiarlo. Reunió a los Vigías que quedaban en la plaza de la Torre y les pidió que volvieran a jurar. Habló con torpeza, porque no era hombre de discursos, pero con una sinceridad que hizo que algunos bajaran la mirada. Les dijo que la Llama no se mantenía sola, que cada mañana alguien tenía que subir, aunque fuera un escalón, o un día el fuego se apagaría sin ruido.",
            "Algunos sonrieron con ternura, como se sonríe a un joven entusiasta. Otros se excusaron: tenían cosas que hacer, hijos que cuidar, rodillas que dolían. Marta fue la única que levantó la mano. «Yo juraré contigo —dijo—. Pero te aviso: eso no los hará volver.» Tenía razón. Tres años después Marta murió, tranquila, en su cama, con el juramento todavía en los labios. Uno por uno, los demás dejaron de subir. Casio se quedó como el último.",
            "No lloró. Solo aprendió algo que le costó muchos años aceptar: que no se puede obligar a nadie a seguir un camino. Lo único que se puede hacer es seguir andando uno mismo, y dejar la puerta abierta. Esa noche subió su piso de siempre, como siempre, solo. Y al llegar a la cima encendió una vela en la piedra, junto a la Llama grande, por Marta. Fue la primera vez que lo hizo. No fue la última.",
        ],
        moraleja: "Nadie puede subir por ti ni obligarte a subir. Pero tu constancia, si no se apaga, deja la puerta abierta para el que quiera volver.",
    },
    {
        titulo: "El muchacho de la plaza",
        parrafos: [
            "Yo era, por entonces, un muchacho con talento y sin constancia. Lo digo sin vergüenza: es lo que fui. Empezaba cien cosas, no terminaba ninguna y siempre tenía una buena razón para dejar la siguiente para mañana. Pasaba las tardes en la plaza del valle, mirando la Torre desde abajo, muy seguro de que algún día la subiría. Pero ese día siempre era mañana.",
            "Una tarde de otoño vi pasar a un hombre con una armadura celeste que subía a la Torre como quien va a trabajar. No iba rápido ni tenía prisa. Caminaba como camina quien ha hecho algo tantas veces que ya no necesita pensarlo. Me quedé mirándolo y, sin saber por qué, lo seguí hasta la puerta y le pregunté: «¿Por qué subes todos los días?».",
            "Ni siquiera se detuvo. Siguió subiendo el primer escalón, luego el segundo, y contestó de espaldas, sin ninguna solemnidad: «Porque ayer subí».",
            "Fue la respuesta más simple que había oído en mi vida y la que más me ha costado entender. Esa noche no dormí. Pensé que había mil razones mejores para subir: la gloria, la fuerza, los demás. Y que aquel hombre había elegido la única que no necesitaba ninguna otra. Era como si todas las razones grandes fueran paredes, y esta, la más pequeña, fuera la única que sostenía el techo.",
            "Al día siguiente volví a la plaza. Él pasó a la misma hora. Le dije: «Quiero aprender a subir como tú». Esta vez se detuvo. Me miró de arriba abajo con cierta tristeza, la de quien ya ha visto muchas veces a muchachos entusiastas que no duran, y respondió: «Con una condición».",
            "No supe entonces que yo era el primer aprendiz que aceptaba en veinte años, ni que había buscado a alguien así durante buena parte de su vida. Años después me confesó, en una de esas noches en que los hombres callados hablan, que al verme en la plaza había pensado: «Este no va a durar». Y que había decidido enseñarme igual. «No por ti —me dijo—. Por la puerta abierta.»",
        ],
        moraleja: "A veces la mejor razón para seguir es la más sencilla: lo hice ayer, lo hago hoy.",
    },
    {
        titulo: "Un piso al día",
        parrafos: [
            "La condición era una sola: subir con él un piso cada día, sin excepciones. Ni por lluvia, ni por enfermedad, ni por cansancio. Si un día no se podía, se subía un escalón, pero se subía. Me dio un pergamino viejo, «La primera piedra», y me dijo: «Léelo cuando quieras rendirte».",
            "La primera semana inventé once excusas. Estaba cansado, tenía que ayudar a mi madre, había llovido, iba a llover, no me encontraba bien, mejor empezaba el lunes. Casio las escuchó todas sin responder ninguna. No las rebatió ni las juzgó. Cada mañana esperaba al pie del primer escalón, con la misma cara tranquila, y yo subía igual, protestando. Al octavo día dejé de inventar excusas. No porque me hubiera convencido, sino porque comprendí que la única persona que las escuchaba era yo.",
            "Fueron los mejores años de mi vida, aunque en el momento no lo supiera. Casio me enseñó que las Sombras no eran monstruos que llegaban de afuera, sino costumbres que uno alimenta. «Cada vez que cedes —decía— les das de comer. Cada vez que cumples, las dejas con hambre.» Yo lo escuchaba con el escepticismo de la juventud, hasta que vencí a mi primera Sombra, la Pereza de las mañanas, levantándome a la misma hora durante cuarenta días.",
            "Corrí a contárselo, esperando un elogio. Casio solo asintió y dijo: «Bien. Mañana, otra vez». Me sentí desinflado. Años después comprendí que era el mayor elogio que sabía dar: el que no convierte lo hecho en un trofeo, sino en un punto de partida.",
            "Con el tiempo aprendí a ver lo que había detrás. Casio no era frío ni duro: era un hombre que se había prometido a sí mismo no hacer de ninguna victoria un descanso. Llevaba años sin celebrar nada, y eso lo había hecho extrañamente feliz. Tenía una paz que yo no entendía y que envidiaba: la de quien ha dejado de pedirle emoción al camino.",
            "A veces, por las tardes, se sentaba conmigo en la terraza de un piso y miraba el valle sin decir nada. Yo, nervioso, quería llenar el silencio con comentarios. Una vez me dijo, sin mirarme: «No hace falta hablar, Aurelio. Ya se dice todo subiendo». Tardé veinte años en entender que lo que me estaba enseñando no era a subir. Era a estar.",
        ],
        moraleja: "Una victoria no es un descanso: es el punto desde donde se empieza otra vez. «Bien. Mañana, otra vez.»",
    },
    {
        titulo: "La mentira de Aurelio",
        parrafos: [
            "Debo contar algo de lo que no me enorgullezco. Fue en mi tercer año de subir, un día en que la fiebre me tenía los huesos blandos y la cabeza pesada. No había subido el piso. Me había quedado en la cama, con una manta hasta la barbilla, diciéndome que descansar un día no era malo. Pero cuando Casio me preguntó, por la tarde, si había subido, le contesté: «Sí».",
            "No sé por qué lo dije. Era una mentira pequeña, de esas que se escapan antes de pensarlas. Casio me miró un momento con aquella cara suya sin gestos y asintió. No dijo nada. Pasaron los días. Yo, con el peso de lo dicho en el pecho, subía cada mañana con un cuidado exagerado, como si pudiera compensar con los escalones lo que había mentido con la lengua. Casio no volvió a mencionarlo.",
            "Una semana después, no aguanté. Lo busqué en la terraza del piso donde solía sentarse y le dije de golpe: «Te mentí. Aquel día no subí. Estaba enfermo y me dio vergüenza». Esperé un reproche, una mirada severa, un sermón sobre la honestidad. Casio, sin volverse, respondió: «Ya lo sabía».",
            "«¿Cómo?», pregunté, desconcertado. «Porque tu piso estaba sin pisar. Las escaleras guardan las huellas del polvo.» Hubo un silencio. «¿Y por qué no dijiste nada?» Casio tardó en contestar. «Porque la mentira no era para mí. Me la dijiste a mí, pero era para ti. Y una mentira que uno se dice a sí mismo no se cura con un regaño.»",
            "Se volvió por fin hacia mí y me miró con una ternura que yo no le conocía. «Mentir sobre un día que faltaste es lo más natural del mundo. Lo grave no es el día: es que empieces a contarte que no faltas. Porque entonces ya no sabrás cuándo volver.» Me puso una mano en el hombro. «Hoy me dijiste la verdad. Eso vale más que el piso que no subiste.»",
            "Nunca he vuelto a mentirle a nadie sobre mi constancia. No por virtud, sino por algo más práctico: aprendí que quien se miente sobre lo que hace pierde el mapa de dónde está. Y que decir «hoy fallé» en voz alta es la forma más rápida de volver a subir.",
        ],
        moraleja: "Mentirte sobre lo que haces es perder el mapa de dónde estás. Decir «hoy fallé» en voz alta es la manera más rápida de volver.",
    },
    {
        titulo: "Lo que Casio no sabía enseñar",
        parrafos: [
            "No todo fue paz. Hubo un año en que estuve a punto de dejarlo todo. Llevaba siete años subiendo y sentía que no avanzaba: los pisos eran los mismos, los escalones eran los mismos, yo mismo era el mismo. Una mañana de lluvia, al llegar al pie de la escalera, me di la vuelta y dije en voz alta: «No puedo más». Casio, que esperaba como siempre con la misma cara tranquila, no se movió.",
            "No intentó convencerme. No me dijo que era normal, ni que pasaría, ni que había que tener fe. Se limitó a mirarme un buen rato. Después, con una voz que no le reconocía, un poco ronca, dijo algo que me desarmó: «Yo tampoco sé cómo se enseña esto». Me quedé de piedra. Era la última frase que esperaba oír de un hombre que parecía tener todas las respuestas.",
            "Se sentó en el primer escalón, bajo la lluvia, con su armadura celeste empapada, y me contó algo que nunca había contado. Que el invierno que no subió, siendo joven, había sido el peor de su vida. Que desde entonces vivía con miedo de volver a hacerlo. Que enseñarme era, en parte, una manera de no fallar: si yo subía, él tenía que subir también, porque no podía pedirme lo que no se exigía a sí mismo. «No soy tu maestro —me dijo—. Soy alguien que sube delante de ti, y que se ha acostumbrado a que lo sigas. Eso es todo lo que sé hacer.»",
            "Hubo un largo silencio. La lluvia golpeaba las piedras. Yo, que había esperado un sermón, descubrí que lo que necesitaba era justo eso: la confesión de que a él también le costaba. No para consolarme, sino para entender que costar no era una señal de error. Era, simplemente, lo que costaba.",
            "Subí aquel día. No porque me hubiera convencido, sino porque ya no me parecía una carga que él estuviera subiendo también. Dos escalones, tres, un piso entero, mojados los dos, sin hablar. En lo alto nos sentamos a mirar la lluvia sobre el valle. «Gracias por decírmelo», le dije. Él asintió con la cabeza y respondió: «Gracias por quedarte». No sé cuál de los dos aprendió más aquel día. Me inclino a pensar que fue él.",
            "Años después, cuando fui yo quien tuvo que enseñar a otros, repetí aquella escena sin saberlo. Tuve alumnos que quisieron rendirse. A todos les dije lo mismo que me dijo Casio: «Yo tampoco sé cómo se enseña esto. Pero puedo subir delante de ti». Funcionó con unos y con otros no. Pero fue lo más sincero que supe decir.",
        ],
        moraleja: "Enseñar no es tener todas las respuestas: es seguir subiendo delante de otro, aunque a ti también te cueste.",
    },
    {
        titulo: "Ceniza",
        parrafos: [
            "En lo alto de la Torre vivían los dragones de los Vigías. Eran cuatro cuando Casio empezó a subir, y uno cuando yo llegué. Los otros habían muerto de viejos, sin hacer ruido, como mueren las cosas que han hecho su trabajo. Quedaba una dragona llamada Ceniza, de escamas grises como el humo de una vela, que ya casi no volaba.",
            "Casio la cuidaba. Cada mañana, antes de la subida, le llevaba agua del manantial y se sentaba a su lado un rato en silencio. Yo, que al principio tenía miedo, aprendí a quedarme con ellos. Aprendí que había una forma de compañía que no necesitaba palabras, y que Casio la practicaba mejor que nadie.",
            "A veces la dragona abría un ojo, enorme y dorado, lo miraba y volvía a cerrarlo, con una especie de suspiro. Casio le rascaba detrás de la oreja, donde las escamas eran más finas. Nunca le hablaba. Yo lo observaba desde la puerta y comprendía que aquel hombre, que no sabía hablar de lo que sentía, tenía una manera de querer que no necesitaba traducción.",
            "Una noche Ceniza se murió. Casio estaba a su lado; yo, dormido en un rincón. Cuando desperté, el viejo Vigía tenía la frente apoyada en el costado frío de la dragona y no se movía. No pregunté. Esperé. Después me contó que en sus últimas horas ella le había confiado algo: un huevo, el último, que había puesto años atrás y que nunca había eclosionado.",
            "«No se abre con calor —me explicó, envolviéndolo en una manta de lana—. Lo intenté con fuego, con ternura, con paciencia. Se abre con constancia. Algún día encontrarás a quien lo merezca.» Me lo puso en los brazos. Yo, que aún no sabía sostener ni mis promesas, sostuve ese huevo con las dos manos y sentí un peso que no era de piedra.",
            "Lo guardé durante cien años, envuelto en lana, junto al fuego. Casio no me pidió que lo cuidara: me lo confió, que es otra cosa. Y descubrí que la confianza pesa mucho más que la obligación, porque no se puede cumplir a medias. Una obligación se cumple o no. Una confianza se honra, o se traiciona, o se sostiene, cada día, de una manera distinta.",
        ],
        moraleja: "Lo que vale la pena crece despacio. Y confiar algo a alguien es la forma más honda de enseñarle a cuidar.",
    },
    {
        titulo: "La luz del este",
        parrafos: [
            "Hay una costumbre de los Vigías que casi nadie conoce, y que Casio mantuvo durante treinta años sin contársela a nadie. Cada noche, antes de bajar de la cima, encendía una pequeña linterna de aceite en el borde de la terraza más alta y la tapaba y destapaba con la mano: dos destellos, una pausa, dos destellos. Era un saludo antiguo, de los tiempos de Lía y de la cartógrafa Nera, y ya nadie lo respondía.",
            "Hasta una noche de otoño en que, muy lejos, hacia el este, más allá de la niebla de otro valle, alguien le contestó. Dos destellos, una pausa, dos destellos. Casio se quedó inmóvil con la linterna en la mano. Pensó que era una estrella, un reflejo, un error de los ojos cansados. Repitió la señal. Desde la lejanía le respondió, igual, sin prisa, la misma luz diminuta.",
            "Durante veinte años se comunicaron así. Nunca se vieron la cara, nunca supo el nombre del otro. Era un Vigía, supuso, como él, en una Torre como la suya, cuidando una Llama como la suya, en un valle que Casio no había pisado jamás. Se saludaban cada noche, dos destellos, una pausa, dos destellos, y esa era toda la conversación. Casio decía después que fue la más honda de su vida.",
            "No necesitaban palabras. Cada noche, la luz del este le decía lo mismo: «Sigo aquí». Y cada noche, la suya contestaba: «Yo también». En los años en que Marta murió, en que los demás Vigías dejaron de subir, en que Casio estuvo más solo que nunca, esa luz diminuta fue lo único que lo sostuvo. Saber que, al otro lado de la niebla, alguien hacía lo mismo, le bastaba.",
            "Una vez, en una noche de tormenta, la luz del este tardó mucho en contestar. Casio esperó con el corazón detenido. Al fin respondió, débil, dos destellos, una pausa, dos destellos, y Casio, aliviado, se sentó en el suelo de piedra y se rio solo, como un niño. «Era el saludo de alguien que seguía subiendo», me explicó años más tarde, cuando por fin me lo contó.",
            "Nunca supo lo que le pasó a ese Vigía desconocido. Solo recordaba que, la misma noche en que la Llama de su Torre se apagó, la luz del este también dejó de contestar. No una vez, sino para siempre. Casio lo supo en cuanto lo vio: dos destellos, una pausa, y nada. Esa noche, mientras la tormenta lo ataba a la Torre, pensó que había dos luces apagándose a la vez, y que una de ellas no la había protegido a tiempo.",
        ],
        moraleja: "Nunca subes del todo solo. En algún lugar que no ves, alguien repite tu mismo gesto. Y saberlo basta para seguir.",
    },
    {
        titulo: "La mañana en que la Llama tembló",
        parrafos: [
            "Una mañana de primavera, la Llama de la cima empezó a apagarse. No se notó desde el valle: nadie miró hacia arriba, nadie se dio cuenta. Pero Casio, que llevaba treinta años subiendo todos los días, notó la diferencia en el color. La Llama de siempre era dorada. Esa mañana tenía un borde azulado y parecía respirar con dificultad.",
            "Pasó el día entero en la Biblioteca, entre libros que ya había leído cien veces, buscando alguna pista que explicara lo que sentía. No encontró ninguna. El Archivista, desde su mesa, levantó la vista un momento y volvió a su libro sin decir palabra. Por la noche, Casio volvió a la Fragua a limpiar el sello que había descubierto de joven. Entonces lo comprendió todo de golpe.",
            "La Torre no se había levantado para mirar el cielo. Se había levantado encima de algo, para taparlo. El sello de hierro, la frase del Archivista, el frío que subía de los cimientos: todo apuntaba al mismo sitio. Había un pozo bajo la Torre. Y la Llama era el peso que lo mantenía cerrado. Mientras ardiera, lo que dormía allí abajo dormiría. Si se apagaba, el pozo se abriría.",
            "Casio no sabía, con la certeza fría de quien ha leído demasiado, si era el último que lo sabía. Se sentó en el suelo de la Fragua, junto al yunque frío, y pensó en todas las cosas que no había hecho. Pensó en Isa, en sus padres, en su infancia en el río. Pensó en mí, que dormía tranquilo en algún rincón de la Torre. Y tomó una decisión que ya había tomado, en el fondo, desde que vio la Llama cambiar de color.",
            "Escribió en su diario aquella noche. Me lo leyó muchos años después, ya casi sin voz, en una de las pocas ocasiones en que lo vi débil. Decía que pensaba subir a proteger la Llama. Y decía también que no pensaba bajar, si no podía hacerlo bien. «Hay cosas que se cuidan con el cuerpo —escribió—, y la Llama es una de ellas.»",
            "A mí no me dijo nada. Me despertó al amanecer, me pidió que lo ayudara a ponerse la armadura y me miró con una calma que me asustó más que cualquier grito. «Si no vuelvo al anochecer —dijo— no subas a buscarme. Sigue subiendo un piso cada día, como te enseñé.» Le pedí que me dejara ir con él. Me negó con la cabeza. «Tu piso de hoy es el primero —respondió—. Empieza por ahí.»",
            "Se puso el yelmo. Me puso una mano en el hombro, un segundo, como quien comprueba que algo sigue en su sitio. Luego empezó a subir. Lo vi alejarse escalón por escalón, con su armadura azul brillando en la penumbra de la escalera, y cuando desapareció en la primera curva, comprendí con una claridad dolorosa que acababa de ver a un hombre irse a hacer lo que había practicado toda su vida.",
        ],
        moraleja: "Hay cosas que se cuidan con el cuerpo y con la constancia, no con grandes gestos. A veces cuidar una luz es la forma de subir más alto.",
    },
    {
        titulo: "La tormenta",
        parrafos: [
            "Casio no me contó nunca lo que pasó esa noche, pero lo sé porque el piso diecinueve lo cuenta, y porque he hablado con quienes lo han visto después. Subió los dieciocho pisos de un tirón, sin detenerse. Pasó la Cripta, donde el Caballero se hizo a un lado sin pronunciar palabra. Pasó la Biblioteca, donde el Archivista levantó la vista y la bajó de nuevo. Pasó la Fragua, donde el sello de hierro esperaba bajo el yunque. Y llegó a la cima de los rayos.",
            "Allí, donde la Torre ya no tiene techo ni muros, esperaba la tormenta. No era una tormenta cualquiera. Parecía hecha de memoria: de todas las veces que alguien dijo «mañana» y nunca lo hizo, de todos los pasos que no se dieron. Salía de un dragón enorme, de ojos como relámpagos, que cruzaba el cielo en círculos lentos.",
            "Casio peleó toda la noche. No venció y no perdió. Mientras tuvo la espada en la mano, el dragón no pudo bajar a los pisos de abajo, donde dormía el valle. Eso era lo único que importaba. Peleó con la técnica de treinta años de subir y la paciencia de quien no tiene nada que demostrar. Cuando un rayo le rozaba el hombro, respondía con un tajo azul; cuando el viento lo empujaba, apoyaba un pie y no cedía.",
            "Y cuando ya amanecía, vio algo por encima de las nubes, en los puentes de piedra blanca que nadie había pisado en años: una figura alta, encapuchada, que caminaba sin prisa con una vara en la mano. En la punta de la vara, una campana de hierro. No hacía ruido. Eso fue lo más extraño. El resto de las Sombras gritaba, rugía, hacía temblar el suelo; esta pasaba como pasa quien sabe que nadie lo mira.",
            "Debajo de la capa, Casio creyó ver un destello de metal en el hombro, el brillo de algo que, a lo mejor, alguna vez fue una armadura. Pero la distancia era mucha, la niebla espesa, y se dijo después que quizá no había visto nada. Quiso gritar, pero la tormenta le llenaba la boca de viento. Quiso correr hacia los puentes, pero el dragón le cortó el paso con un ala. Estaba atrapado a una distancia de la Corona que no podía recorrer.",
            "Y entonces ocurrió. La figura llegó a lo alto, a la Corona de la Llama. Levantó la campana y la bajó sobre el fuego. La Llama no se defendió. Se apagó sin ruido, como se apaga una vela cuando se le acerca una mano. Y la tormenta, que había rugido toda la noche, cerró sobre la Torre como un puño. Casio, de pie en el piso diecinueve, sintió que algo se rompía muy lejos, en el fondo de la tierra: un crujido sordo, como el de un sello que empieza a ceder.",
        ],
        moraleja: "Hay noches en que no se gana ni se pierde: se resiste. Y resistir, a veces, es lo único que protege lo que hay debajo.",
    },

    // ===== LIBRO TERCERO: LA GUARDIA =====
    {
        titulo: "La guardia",
        parrafos: [
            "Cuando amaneció, Casio estaba de pie en el piso diecinueve, y ya no pudo irse. No fue un castigo ni una condena: fue lo que le pasa a quien lleva toda la vida haciendo lo mismo y, un día, lo hace una vez más. La tormenta lo ató a la Torre como se ata un barco al muelle. Su armadura azul se volvió piedra y viento, su espada se volvió relámpago, y su rostro, que nunca tuvo prisa, dejó de cambiar.",
            "Pero no dejó de pensar. Esa fue la parte que yo ignoré cien años. Imaginaba al Centinela como se imagina una estatua: rígida, vacía, eterna. Y no era así. Casio estaba despierto. Veía pasar los días, uno tras otro, desde el piso diecinueve, y los contaba. Y cada mañana hacía lo único que sabía hacer: subía.",
            "No podía abandonar su piso, pero dentro de él subía una escalera imaginaria, escalón por escalón, desde el suelo hasta el cielo abierto, y volvía a bajarla al anochecer. Un piso al día. Era la promesa que me había hecho, y la cumplió cien años dentro de una armadura que no se movía. Nadie lo vio hacerlo. Nadie lo sabría nunca. Y sin embargo, cada mañana, el Centinela subía.",
            "Cuando alguien llegaba a su piso, la tormenta lo obligaba a pelear. Tenía que levantar la espada, y la levantaba. Pero hay una cosa que el rayo no le quitó: la medida de sus golpes. Cada vez que un aprendiz llegaba a la cima, Casio le pegaba con la mitad de su fuerza, lo justo para que entendiera lo que le faltaba. Nadie murió en ese piso. Los que se rendían bajaban vivos y más sabios; los que no, se quedaban a su lado, un día, una semana, hasta que algo cambiaba.",
            "Pocos llegaron. Cien años es mucho tiempo en una Torre que nadie sube. Casio pasó largas temporadas en silencio, mirando hacia arriba el lugar donde había visto apagarse la Llama, y pensando en el muchacho al que había dejado esperando abajo. Pensaba, sobre todo, en una cosa: «Espero que haya seguido subiendo».",
        ],
        moraleja: "La constancia no necesita testigos ni escenario. Se puede cumplir una promesa incluso cuando nadie mira y nada se mueve.",
    },
    {
        titulo: "Cartas que nadie leyó",
        parrafos: [
            "Durante la guardia, Casio escribía cartas. No tenía papel ni tinta ni manos para sostener una pluma, pero las escribía igual, dentro de su cabeza, en esa lengua callada de los que no pueden hablar. Las dirigía a quienes echaba de menos. Nadie las leyó nunca. Yo las he reconstruido a partir de lo que me contó, con la parte de verdad que cabe en una conjetura.",
            "El primer año le escribió a Isa. «Hermana: me quedé. No sé cuánto durará. Cuida a mamá, cuida el bote. Dile al río que lo recuerdo.» Después, cuando pasaron los años y Casio supo que ya no estaba viva, siguió escribiéndole igual. «Hoy el cielo estaba claro. Habrías cruzado sin miedo, como siempre.»",
            "El año diez le escribió a Marta. «Tenías razón: nadie volvió. Pero yo sigo subiendo. Hoy puse una piedra pequeña junto a tu vela.» El año treinta le escribió a Brann, el herrero. «Mi armadura aguanta. El defecto del hombro sigue ahí. Sirve.» El año cuarenta y tres, a Ceniza: «No sé si el huevo se abrirá. Aurelio lo cuida. Creo que él sí ha seguido subiendo».",
            "El año sesenta, por primera vez, escribió a Orrin. «Te recuerdo. Grabé tu inicial en la piedra. No sé dónde estás ni en qué te has convertido. Pero me alegro de haber sabido tu nombre. Si me oyes, vuelve.» Fue la única carta que lloró, si una armadura de piedra puede llorar. Y fue también la única que, años después, tuvo una respuesta, aunque Casio nunca la supo: el eco en el fondo de la Mazmorra, donde el Rey Hueco escuchó una vez, sin saber de dónde venía, una voz que decía «vuelve».",
            "El año noventa le escribió a mí. «Aurelio: no te culpo. Si estás leyendo esto, es que algo ha cambiado. Si no lo estás leyendo, es que sigues esperando. Y entonces te pido solo una cosa: sube. No por mí. Porque ayer subiste.» Esa carta me la contó cuando todo hubo terminado. Lloré como no lloraba desde niño.",
            "No escribió más cartas después de esa. Los últimos años los pasó en silencio, contando escalones imaginarios, mirando cómo cambiaban las estaciones sobre la cima. No esperaba nada. Seguía subiendo. Y esa, dijo años después, fue la parte de la guardia que más le enseñó: que la esperanza no es esperar que algo cambie, sino seguir haciendo lo que haces mientras tanto.",
        ],
        moraleja: "La esperanza no es esperar que algo cambie: es seguir haciendo lo que haces mientras tanto.",
    },
    {
        titulo: "Los que llegaron antes",
        parrafos: [
            "En cien años, no fueron tantos los que llegaron al piso diecinueve. Pero los hubo, y Casio los recordó a todos. Los recordaba por cómo subían, por cómo peleaban, por cómo se iban. Cada uno le enseñó algo, aunque ninguno lo supiera.",
            "El primero fue un pastor joven que subió buscando una oveja perdida. Entró en la Torre por error, subió sin saber lo que hacía, y llegó al piso diecinueve con las botas llenas de barro y la mirada de quien no entiende dónde está. Casio, obligado por la tormenta a pelear, le pegó con la mitad de la mitad de su fuerza, y el pastor cayó de rodillas y dijo: «Perdón, me equivoqué de camino». Casio lo miró desde su cuerpo de viento y pensó: «No te equivocaste. Todos los que suben se equivocan primero». El pastor bajó. Años después volvió a subir, con intención.",
            "Una mujer llegó una vez con un hacha, convencida de que podía derribar la Torre y acabar con las Sombras de golpe. Peleó con rabia, con fuerza, con una furia que daba miedo. Casio resistió todo el día. Al anochecer, la mujer cayó de agotamiento y se echó a llorar. Casio, que no podía hablar, la miró hasta que se quedó dormida. Cuando despertó, algo había cambiado en ella: ya no quería derribar nada. Solo entender. Bajó con el hacha al hombro y la mirada más tranquila.",
            "Hubo un hombre que llegó para pedirle perdón. Era descendiente de uno de los Vigías que habían dejado de subir. Contó una larga historia de culpas heredadas, de abuelos que se rindieron, de padres que se avergonzaron. Casio, desde su silencio, lo escuchó con atención. Al final, el hombre preguntó: «¿Puedo subir yo, aunque ellos no lo hicieron?». Y Casio, con la mitad de su fuerza, lo empujó con suavidad hacia la escalera. Era su manera de decir que sí.",
            "También hubo quien llegó con malas intenciones. Un hombre ambicioso, enviado por alguien que quería la Llama para sí, y que se encontró con un muro azul que no cedía. Casio le pegó con toda su fuerza, la primera y la única vez en cien años. El hombre bajó los pisos rodando y no volvió. Casio no sintió remordimiento: había dado a cada quien lo que necesitaba, no lo que pedía.",
            "De todos ellos aprendió lo mismo, y lo repetía para sus adentros cada noche: que la ayuda no es hacer que el camino sea fácil, sino que no sea imposible. A unos les dio la mitad de su fuerza, a otros una puerta, a otros un empujón, a uno solo toda su ira. Y a todos, sin excepción, un piso por delante donde decidir si seguían subiendo o no.",
        ],
        moraleja: "Ayudar no es hacer fácil el camino, sino evitar que sea imposible. A cada quien, lo que necesita, no lo que pide.",
    },
    {
        titulo: "El año en que no subió",
        parrafos: [
            "Casio contó los días de la guardia durante cincuenta años sin fallar uno. Cada mañana, el Centinela subía su escalera imaginaria. Cada noche la bajaba. Era un ritual tan antiguo que ya no lo pensaba: lo hacía como se respira. Y entonces, un día cualquiera del año cincuenta y uno, no lo hizo.",
            "No fue una decisión. Fue una distracción: se quedó mirando una nube. Una nube grande, blanca, que cruzaba el cielo sobre la Torre con una lentitud hipnótica. La miró toda la mañana, toda la tarde. Cuando el sol empezó a ponerse, Casio comprendió con una punzada de pánico que había olvidado subir. Era el primer día en cincuenta años que no cumplía su promesa.",
            "El segundo día fue peor. Se dijo: «Ya fallé ayer. Mañana lo compenso». Y luego: «Total, ¿a quién le importa?». Había una lógica perversa en ese razonamiento, y Casio la reconoció de inmediato: era la voz de la Sombra de la mañana, la que lo llevaba esperando cincuenta años. No necesitaba ganar la discusión. Le bastaba con que él dejara de subir una vez más.",
            "Pasaron tres días. Cuatro. Una semana. La escalera imaginaria seguía allí, esperando, y cada día que la ignoraba se hacía un poco más alta, un poco más difícil. Casio, inmóvil en su piso de viento, recordó a Marta: «Puedes faltar un día. Nunca dos seguidos». Había faltado siete. Pero no había sido por maldad ni por cansancio: había sido, simplemente, por inercia.",
            "Y entonces hizo lo que había aprendido de joven, en el invierno de la Biblioteca. No intentó subir un piso entero. No se reprochó nada. Subió un solo escalón imaginario. Uno. Se quedó parado en él, con la mano en una baranda que no existía, y respiró. Después bajó. Al día siguiente subió dos. Al otro, un piso entero, a regañadientes. No hubo gloria ni redención. Solo un viejo guerrero de piedra que retomaba, con torpeza, lo que había dejado.",
            "Me lo contó años después, con una especie de risa tranquila. «Cincuenta años sin fallar y fallé siete días por una nube —dijo—. Fue lo mejor que me pasó.» No entendí. «Porque me recordó cómo se vuelve —explicó—. Y cuando llevas mucho tiempo sin fallar, olvidas que fallar siempre fue posible. Volver, Aurelio, es la única habilidad que no se pierde por usarla poco.»",
        ],
        moraleja: "Volver es la única habilidad que no se gasta. Da igual cuántos días faltaste: hoy sube un escalón.",
    },
    {
        titulo: "Lo que Aurelio hizo mientras tanto",
        parrafos: [
            "Debo decir, para ser justo, lo que hice yo durante los cien años de la guardia de Casio. No es un secreto, pero tampoco es algo de lo que se hable con orgullo. Esperé. Esperé a que el anochecer pasara, y luego una semana, y luego un año, con la promesa clavada como una astilla: «No subas a buscarme». Y no subí. Esa fue mi primera falla.",
            "No lo digo para torturarme. Es un hecho. Casio me había pedido dos cosas: que no lo buscara y que siguiera subiendo un piso cada día. La primera la cumplí con una exactitud casi cruel. La segunda la abandoné, poco a poco, sin darme cuenta. Primero subí un piso al día. Después, cuando me dolían las rodillas, uno cada dos. Después, uno por semana. Después, ninguno. No hubo un día en que decidiera dejarlo. Hubo, simplemente, una mañana en que no subí, y otra, y otra.",
            "Me puse a enseñar a otros, que es la manera más elegante de no hacer lo que uno predica. Tuve alumnos, muchos, jóvenes con ojos brillantes que querían aprender a subir. Les contaba cómo hacerlo. Les hablaba de las Sombras, de las costumbres, de las pequeñas victorias. Y todos, sin excepción, se rendían antes del quinto piso. No supe ver entonces lo que ahora veo: no me creían porque yo no subía.",
            "Un maestro que no practica enseña, sobre todo, a rendirse. Eso me lo dijo muchos años después una de mis últimas alumnas, una niña llamada Lena, que dejó la Torre a los doce años con una sinceridad desarmante. «Usted habla muy bien de subir —me dijo—, pero nunca lo he visto subir.» Me quedé sin palabras. Era verdad. Hacía ochenta años que no subía ni un escalón.",
            "Guardé el huevo envuelto en lana, junto al fuego. Eso sí lo hice bien, con una devoción que me sorprende. Lo giraba cada día, lo abrigaba, le hablaba. Cuando no tenía fuerzas para nada más, tenía fuerzas para eso. A veces pienso que el huevo me salvó, porque era lo único que me obligaba a levantarme: tenía que cuidar algo, y eso, aunque no era subir, no era rendirse.",
            "Hasta que llegó alguien. {n}, con la antorcha apagada y los ojos de quien no sabe todavía lo que va a ser. Le di el huevo sin saber si estaba haciendo bien. Y comprendí, observando cómo subía, que lo que yo no había hecho en cien años lo hacía otro en una semana. No me dio envidia. Me dio vergüenza, y la vergüenza, bien usada, es un buen principio. Esa noche, por primera vez en mucho tiempo, subí un escalón.",
        ],
        moraleja: "Un maestro que no practica enseña a rendirse. Y nunca es tarde para subir un escalón: la vergüenza, bien usada, es un buen principio.",
    },
    {
        titulo: "El que subió",
        parrafos: [
            "Un día, después de más años de los que Casio había contado, alguien llegó al piso dieciocho. Subió despacio, como suben los que han aprendido a subir todos los días. Llevaba una antorcha apagada y, a su lado, un dragón pequeño de escamas moradas que miraba todo con curiosidad. Casio, que había visto pasar a cientos de personas por el pie de la escalera, supo en cuanto lo vio que esta era distinta.",
            "No fue por la armadura ni por el arma. Fue por el dragón. Reconoció su olor antes de verlo del todo: era el de Ceniza, tibio y un poco a ceniza fría. Entonces comprendió que el huevo se había abierto, y que si el huevo se había abierto, alguien había tenido la constancia que hacía falta para abrirlo. Una alegría sin palabras le recorrió la armadura de piedra.",
            "El rayo lo obligó a pelear. Levantó la espada y la bajó con la mitad de su fuerza, como siempre, y esperó. {n} esquivó, golpeó, aguantó, probó fuego, probó hielo. No ganó de inmediato. Cayó una vez, se levantó, volvió a intentarlo. Casio, desde su cuerpo de tormenta, solo pensaba en una cosa: «Qué bien sube».",
            "Mientras peleaban, Casio miraba. Observaba cómo {n} se detenía a recuperar el aliento antes de golpear; cómo usaba la cabeza antes que la fuerza; cómo, cuando el golpe dolía, no maldecía ni se quejaba, sino que respiraba y volvía a empezar. Reconoció en cada gesto lo que él mismo había enseñado, pasado por otra mano y otro tiempo. Y comprendió que, de alguna forma, su guardia no había sido en vano: lo que había dejado estaba allí, intacto, subiendo.",
            "Cuando el golpe final llegó, Casio no lo esquivó. El Dragón de la tormenta, más arriba, rugió y se deshizo en lluvia; y con él se deshizo la tormenta. Por primera vez en cien años, el cielo se abrió sobre la Torre. La armadura celeste, que había sido piedra y viento, volvió a ser acero azul. Casio bajó la espada despacio, como quien por fin puede dejar una carga que ya había dejado de sentir.",
            "Miró a {n} y sonrió. No dijo nada, porque no hacía falta. Solo levantó la mano izquierda, con un gesto muy pequeño, y señaló hacia abajo. Hacia el valle, hacia la plaza, hacia donde un viejo con un huevo de lana llevaba cien años esperando. «Dile a Aurelio —murmuró— que bajé un piso.» Y entonces, por fin, descansó.",
        ],
        moraleja: "Quien sube cada día, aunque nadie lo vea, acaba encontrando a quien lo necesita. Y cuando llega ese día, todo lo repetido cobra sentido.",
    },
];

export const EPILOGO = [
    "Me dieron el mensaje en el pie de la Torre, al mediodía. Dijeron: «Bajó un piso». Entendí de inmediato. Y comprendí también lo único que me quedaba por hacer: subir. Tardé todavía un tiempo en atreverme: el miedo vuelve siempre disfrazado de «todavía no». Pero una noche, por fin, subí.",
    "Subí los diecinueve pisos como lo hacía cuando era joven, uno detrás de otro, sin prisa y sin excusas. Me costó. Tenía los huesos cansados y las manos temblorosas. Pasé la puerta de la Cripta, donde el Caballero me miró sin decir nada, y el sillón del Archivista, donde alguien seguía buscando, y la Fragua, donde el yunque estaba frío. Llegué al piso diecinueve justo cuando el sol caía sobre las piedras. La armadura estaba allí, de pie, apoyada en la espada. Era solo una armadura, ya sin tormenta. Y dentro, sin nadie, quedaba una nota doblada, en el hueco del yelmo.",
    "La leí despacio. Decía: «Aurelio: gracias por subir. No era tu culpa. Cuando la Llama arda otra vez, busca en el valle del este. Allí también hubo un Casio». No supe qué quería decir. Todavía no lo sé. Pero guardé la nota junto al fuego, al lado del lugar donde había estado el huevo, y comprendí algo: que la historia de un hombre no se acaba cuando él descansa. Se acaba cuando alguien la sigue.",
    "Dejé la armadura donde estaba. Se ve desde lejos, azul sobre la piedra, y los que suben a la cima la saludan con la cabeza. Algunos le dejan una piedra pequeña a los pies. No sé quién empezó la costumbre. Creo que fue el propio piso.",
    "Y cada mañana, antes de que salga el sol, subo yo también un piso. No porque lo haya prometido, sino por la razón más simple de todas, la que me dio un hombre de espaldas, hace mucho tiempo, en un escalón: porque ayer subí.",
];

export const ENSENANZAS = [
    "Al miedo no se le gana huyendo, sino quedándote el rato que hace falta para que los ojos se acostumbren.",
    "Las grandes caídas empiezan con las pequeñas monedas: la honradez se practica cuando nadie lo sabría.",
    "No hace falta saber por qué subes para empezar: basta con volver mañana.",
    "Saber cómo se hace una cosa no la hace. Lo que importa se repite cada día.",
    "Volver es el verdadero juramento: no importa cuánto faltaste, sino si hoy subes aunque sea un escalón.",
    "Lo que de verdad te protege lo forjas tú, aunque la primera vez te salga torcido.",
    "No raspes lo que duele: nómbralo y recuérdalo para no repetirlo.",
    "Nadie sube por ti, pero tu constancia deja la puerta abierta al que quiera volver.",
    "A veces no hay que vencer los pensamientos: basta con darles un ritmo, como una canción en la escalera.",
    "Mentirte sobre lo que haces es perder el mapa de dónde estás. Decir «hoy fallé» es la manera más rápida de volver.",
    "Nunca subes del todo solo: en algún lugar que no ves, alguien repite tu mismo gesto.",
    "Una victoria no es un descanso: es el punto desde el que se empieza otra vez.",
    "Enseñar es seguir subiendo delante de otro, aunque a ti también te cueste.",
    "Confiar algo a alguien es la forma más honda de enseñarle a cuidar.",
    "Cuidar una luz también es subir.",
    "Se puede cumplir una promesa aunque nadie mire y nada se mueva.",
    "La esperanza no es esperar que algo cambie: es seguir haciendo lo que haces mientras tanto.",
    "Ayudar no es hacer fácil el camino, sino evitar que sea imposible.",
    "Volver es la única habilidad que no se gasta con el tiempo: hoy sube un escalón.",
    "Un maestro que no practica enseña a rendirse, y nunca es tarde para subir un escalón.",
    "Quien sube cada día acaba encontrando a quien lo necesita.",
];

export const FIRMA = "Aurelio, que fue su aprendiz";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
                 "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"];

// El libro con el nombre puesto (y qué capítulos puedes abrir ya).
// tuPiso = tu récord de la Torre. Devuelve { titulo, subtitulo, autor, prologo, capitulos: [{ numero, titulo, parrafos, moraleja,
//   abierto, bloqueado (texto, si no), libro (el libro al que pertenece), empiezaLibro (su título, si abre un libro nuevo) }],
//   epilogo, ensenanzas, firma, minutos, palabras }
export function libroDeCasio(nombre, tuPiso = 0) {
    const poner = (texto) => texto.replaceAll("{n}", nombre);
    const termino = tuPiso >= PISO_PARA_EL_FINAL;
    const capitulos = CAPITULOS.map((c, i) => {
        const abierto = i < CAPITULOS_LIBRES || termino;
        const libro = [...LIBROS].reverse().find((l) => i >= l.desde);
        return {
            numero: ROMANOS[i], titulo: c.titulo, abierto, libro,
            empiezaLibro: LIBROS.find((l) => l.desde === i) || null,
            parrafos: abierto ? c.parrafos.map(poner) : [],
            moraleja: abierto ? c.moraleja : "",
            bloqueado: abierto ? null : `Aurelio te lo entregará cuando liberes a Casio: supera el piso ${PISO_PARA_EL_FINAL} de la Torre.`,
        };
    });
    return {
        titulo: TITULO, subtitulo: SUBTITULO, autor: AUTOR,
        prologo: PROLOGO, capitulos,
        epilogo: termino ? EPILOGO.map(poner) : [], ensenanzas: ENSENANZAS, firma: FIRMA,
        minutos: minutosDeLectura(), palabras: palabras(),
    };
}

// Cuántas palabras tiene todo el libro.
export function palabras() {
    const todo = [...PROLOGO, ...CAPITULOS.flatMap((c) => [c.titulo, ...c.parrafos, c.moraleja]), ...EPILOGO, ...ENSENANZAS].join(" ");
    return todo.split(/\s+/).filter(Boolean).length;
}

// Unas 200 palabras por minuto, leyendo con calma.
export function minutosDeLectura() {
    return Math.max(1, Math.round(palabras() / 200));
}
