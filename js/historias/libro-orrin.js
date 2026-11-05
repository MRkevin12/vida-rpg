// libro-orrin.js — «La linterna de Orrin»: el libro del primer Vigía que dejó de subir (v70).
//
// Lo escribe Marta, una de los doce primeros Vigías, que fue la mejor amiga de Orrin y la que raspó su nombre de la piedra.
// Cuenta lo que las otras historias solo insinúan (el pergamino del nombre raspado, las Memorias de Aurelio, el libro de Casio,
// la Mazmorra): quién fue Orrin, por qué el mejor de los doce se quedó abajo, cómo nacieron las Cuatro Sombras de su vacío y
// qué pasó cuando alguien bajó a buscarlo.
//
//   Libro primero: La cantera (capítulos I a V) · cómo se conocieron, los doce, el «¡Ya casi!», el piso cien y la linterna.
//   Libro segundo: El invierno (capítulos VI a XII) · el cansancio, el «solo un día», las razones y las cuatro pérdidas.
//   Libro tercero: La linterna (capítulos XIII a XVIII) · lo que hizo Lía, los años, el descenso de Marta y el último consejo.
//
// Los libros primero y segundo se abren cuando bajas al sótano 5 de la Mazmorra (donde se encuentra el pergamino del nombre
// raspado). El tercero se abre al superar el sótano 10: cuenta lo que hay detrás del Rey Hueco.
//
// Cada capítulo termina con lo que aprendió Marta («la moraleja»). Al terminar el libro hay una escena y un premio.
//
// Es TEXTO PLANO (vistas.js lo escapa). No usa {n}: Marta escribió hace mucho y no puede saber cómo te llamas.
// Ojo con lo que ya cuentan las otras historias: Orrin fue el mejor de los doce, subió el piso cien, tenía una risa que se
// oía desde la cantera, no dijo «hasta mañana» sino «solo un día», y alguien que lo quería mucho raspó su nombre. El Rey Hueco
// vive en el fondo de la Mazmorra y de su vacío nacieron las Sombras (Cuerpo, Mente, Voz y Tesoro). La puerta de abajo se cierra
// y solo se vuelve a abrir cuando cae el Dragón de la cima. Hay una prueba que revisa que no se cuele ninguna contradicción.

export const ID = "orrin";
export const TITULO = "La linterna de Orrin";
export const SUBTITULO = "La historia del primer Vigía que dejó de subir, contada por la amiga que raspó su nombre.";
export const AUTOR = "Marta";
export const ETIQUETA_MORALEJA = "Lo que aprendió Marta";

// Dónde se abre: se mide con tu récord en la Mazmorra (sótanos superados).
export const PUERTA = {
    lugar: "mazmorra",
    libre: 5,      // los libros primero y segundo
    final: 10,     // el libro tercero
    textoLibre: "Marta lo dejó en una caja que solo se abre con el eco de quien baja: llega al sótano 5 de la Mazmorra.",
    textoFinal: "Marta escribió esta parte para quien llegue hasta el Rey Hueco: supera el sótano 10 de la Mazmorra.",
};
// Cuántos capítulos se pueden leer cuando se abre el libro (los libros primero y segundo).
export const CAPITULOS_LIBRES = 12;

// Lo que se gana al terminar el libro (una sola vez).
export const PREMIO = { xp: 40, gemas: 20 };

// Los tres libros: en qué capítulo (empezando en 0) empieza cada uno.
export const LIBROS = [
    { desde: 0, titulo: "Libro primero", nombre: "La cantera" },
    { desde: 5, titulo: "Libro segundo", nombre: "El invierno" },
    { desde: 12, titulo: "Libro tercero", nombre: "La linterna" },
];

export const PROLOGO = [
    "Mi madre hacía sogas, y de ella aprendí que una cuerda no se rompe por el tirón más fuerte, sino por la hebra que se fue deshilachando sin que nadie la mirara. Por eso escribo esto: para contar cómo se deshilachó el mejor de nosotros, y cómo yo, que lo vi, miré para otro lado.",
    "Hace años dejé un pergamino sin firma. Lo escribí con vergüenza y por eso no puse mi nombre. Este sí lo firmo. Me llamo Marta, fui una de los doce primeros Vigías, y lo que sigue es todo lo que sé de Orrin, incluso lo que hice yo y no me gusta contar.",
    "Lo dejo en una caja bajo la piedra lisa del primer piso, con una cerradura que hizo Ander para que solo se abra con el eco de quien baja. No me preguntes cómo funciona: Ander nunca explicaba sus cerraduras. Alguien bajará, aunque hoy nadie se atreva. Cuando lo haga, que no vaya solo a vencer: que vaya también a recordar.",
];

export const CAPITULOS = [
    // ===== LIBRO PRIMERO: LA CANTERA =====
    {
        titulo: "La risa en la cantera",
        parrafos: [
            "Tenía quince años cuando llegué a la cantera, con tres rollos de soga al hombro y la orden de mi madre de no volver hasta que alguien me pagara por ellos. Se levantaba entonces la Torre del valle, y hacían falta sogas para subir las piedras. Era la primera vez que veía a tanta gente junta, y todos sabían qué hacer menos yo.",
            "Lo primero que oí de Orrin fue su risa. Venía de lo alto de la pared de la cantera, donde un muchacho estaba de pie sobre un bloque a medio cortar, contándole un chiste a una mula. Yo pensé que se burlaba de mí, que llegaba con mis rollos y mi cara de susto. Pero no: se reía de todo, y su risa tenía algo raro, que hacía que hasta las piedras parecieran pesar menos.",
            "Tenía diecisiete años y trabajaba de aprendiz con Ander, el cantero. No sabía estarse quieto, hablaba con todos y apuntaba todo lo que veía en un cuaderno de tapas de cuero: el nombre de cada mula, cuántas carretas subían al día, lo que dijo el viejo de la herrería. Escribía mejor que nadie que yo conociera. Lo que él contaba parecía haber pasado de verdad, aunque lo hubiera inventado a medias.",
            "Se me rompió una soga ese primer día, y fue él quien bajó a ayudarme. La anudó con un nudo que no conocía y me dijo: «Una cuerda que se rompe te enseña dónde estaba la hebra mala». Me preguntó el nombre y lo repitió dos veces, despacio, como si lo probara. «Marta. Me gusta. Suena a algo que no se cae.»",
            "Antes de irse me hizo una pregunta que cambió mi vida: «¿Tú subes?». «¿Adónde?», le pregunté. Señaló la Torre, que apenas tenía doce pisos. «Lía subió ayer el último con sus manos. Dice que necesita gente que suba cada día, aunque sea un escalón». Le dije que yo no era fuerte. Se rio. «Yo tampoco. Hablo mucho para que no se note.»",
        ],
        moraleja: "Una buena compañía no te hace fuerte: te hace volver.",
    },
    {
        titulo: "Los doce",
        parrafos: [
            "Fuimos doce los primeros. No nos eligió nadie: nos fuimos juntando de a uno, durante un otoño, alrededor de una niña de pelo revuelto que había levantado una torre de piedra y pedía algo que sonaba demasiado sencillo para ser verdad. Lía no pedía valor ni talento. Pedía que subiéramos un piso al día, y que si un día no lo subíamos, lo dijéramos.",
            "Éramos gente muy distinta. Había un panadero que contaba los escalones y lloraba cuando perdía la cuenta. Una chica callada, Elisa, que subía mejor de noche. Dos hermanos que se peleaban a cada rato y se esperaban siempre en el descanso. Bruno, al que nadie le oyó una frase entera. Y yo, la de las sogas, y Orrin, el que no paraba de hablar.",
            "La noche del juramento grabaron nuestros nombres en la piedra del primer piso. Ander los grabó con su cincel, uno por uno, y Orrin, que le sostenía la lámpara, fue leyéndolos en voz alta cada vez que quedaba uno. Cuando salió el suyo, se puso colorado por primera y única vez que yo recuerde. Dijo: «Ahora ya no puedo echarme atrás: está escrito». Y se rio, pero un poco tarde.",
            "Fue Orrin quien inventó el libro. Una noche le dijo a Lía: «Si prometemos en voz alta, alguien tiene que apuntarlo». Y se encargó él. Cada noche, antes de dormir, cada Vigía decía en voz alta hasta qué piso había llegado ese día y él lo anotaba en su cuaderno, que se llamó desde entonces el Libro de las subidas. Era un trabajo pesado que nadie le pidió. Lo hizo durante años, con una letra que yo todavía veo.",
            "Cuando pienso en esas primeras noches, con los doce sentados en el suelo del primer piso diciendo cada uno su número, lo que más recuerdo es que Orrin nunca decía el suyo primero. Siempre esperaba a que hablaran todos. Después, con voz más baja, decía su piso, que casi siempre era el más alto. Y yo creo que ya entonces, aunque no lo supiera, había alguien dentro de él que no quería que se notara cuánto corría.",
        ],
        moraleja: "Lo que prometes en voz alta, alguien tiene que poder apuntarlo.",
    },
    {
        titulo: "«¡Ya casi!»",
        parrafos: [
            "Todo el mundo sabe que los Vigías gritan «¡Ya casi!» cuando están cerca del final de un piso. Poca gente sabe quién lo inventó. Fue Orrin, y lo hizo por casualidad, un día de calor en que subíamos la escalera del piso quince con las piernas hechas de plomo.",
            "Él iba delante. Se detuvo en un recodo, jadeando, y de pronto levantó la cabeza y gritó, hacia arriba, hacia nadie: «¡Ya casi!». No estaba cerca. Faltaban todavía cuarenta escalones. Pero lo gritó con tanta convicción que los demás, que lo oímos desde abajo, nos reímos, y al reírnos se nos aflojaron las piernas, y subimos esos cuarenta escalones sin darnos cuenta.",
            "Desde ese día, el que llegaba primero al final de un tramo gritaba «¡Ya casi!» para los de abajo, y los de abajo respondían «¡Ya casi!» para él, y así, de un piso al otro, la escalera de la Torre se llenó de una frase que no significaba nada y que lo cambiaba todo. Yo he subido miles de veces desde entonces. Todavía hoy, cuando se me acaban las fuerzas en lo alto de un tramo, grito «¡Ya casi!» y siento que alguien me contesta.",
            "Mucho después me di cuenta de algo que entonces no vi. Orrin siempre lo gritaba antes de estar casi. Nunca después. Nunca decía «llegué», ni «ya está». Siempre «ya casi», como si estar a punto fuera el único lugar donde se sentía a salvo. Cuando uno dice «ya casi» no ha llegado todavía; y quien nunca llega no tiene que preguntarse qué hace después.",
            "No lo supe leer. Me pareció el grito de un hombre feliz, y lo era, a su manera. Pero la alegría que se empuja siempre hacia delante tiene un cansancio detrás, y ese cansancio no se oye desde abajo.",
        ],
        moraleja: "Hay quien grita «ya casi» para animar a otros y para no tener que pararse a sí mismo.",
    },
    {
        titulo: "El piso cien",
        parrafos: [
            "El año cuarto, la Torre ya se veía desde el mar, y los Vigías habíamos subido por turnos todos los pisos que existían. Quedaba un número redondo y tonto que no significaba nada, el piso cien, y a nadie se le habría ocurrido que fuera una carrera. A Orrin sí.",
            "No lo dijo como un reto. Lo dijo como un juego, una noche, riéndose: «¿Quién llega primero al cien?». Y nos dimos cuenta de que todos queríamos saberlo. Salimos los doce al amanecer, con las lámparas encendidas aunque ya había luz, y subimos por el hueco de la escalera, gritando «¡ya casi!» a cada recodo.",
            "Orrin llegó primero, por mucho. Fue el primero de todos en pisar el cien y se quedó parado en el último escalón, con los brazos abiertos, mirando el valle desde allí, que era la vista más grande que habíamos visto. Los demás fuimos llegando uno a uno. Elisa lloró. Los hermanos se abrazaron. Yo me senté en el suelo, sin aire, sonriendo como una tonta.",
            "Esa noche hubo fiesta en el primer piso. Todos comimos, cantamos, nos felicitamos entre nosotros. Todos menos Orrin, que no estaba. Lo encontré en el piso noventa y siete, sentado en la escalera, con el cuaderno sobre las rodillas, escribiendo números. Le temblaban las manos. «¿Qué haces aquí?», le pregunté. «Apunto lo que subimos hoy —me dijo—. Si no lo apunto, se me va.»",
            "Me senté a su lado. Estuvimos un rato callados. «Nunca descansas —le dije—. Ni siquiera hoy.» Se quedó mirando el cuaderno. «Si paro —dijo, tan bajito que casi no lo oí—, me alcanza lo que llevo detrás.» No me explicó qué era. Yo tampoco se lo pregunté, y esa es una de las cosas que más tarde pagué.",
        ],
        moraleja: "Quien no sabe descansar tampoco sabe volver: le da miedo parar porque nunca aprendió a hacerlo con fecha de regreso.",
    },
    {
        titulo: "La linterna",
        parrafos: [
            "Al cumplirse el quinto año, Lía nos regaló una linterna a cada uno. Las había hecho Ander con los clavos de la primera puerta de la Torre, fundidos y vueltos a forjar, con un cristal grueso y un asa de hierro negro. Cada una tenía grabado un nombre en la base, y nos las entregó una por una, en el primer piso, delante de todos.",
            "«No son para ver el camino —dijo—. El camino ya lo conocéis. Son para que quien vaya detrás sepa dónde estáis.» Y nos contó que cada noche las encenderíamos a la vez, y que si una linterna se apagaba durante tres noches seguidas, alguien subiría a ver qué pasaba. «No a regañaros. A acompañaros.»",
            "Aquella noche fue la primera en que las doce luces subieron por la Torre juntas. Desde el valle se veían como un collar que trepaba despacio por la piedra. Los niños del pueblo salieron a las puertas de las casas a mirarlas. Dicen que ese año nació más gente que ningún otro, aunque eso quizá lo inventó Orrin.",
            "La linterna de Orrin tenía una abolladura en la base, de cuando se le cayó de las manos al recibirla, y él la llamó «la Abuela» porque decía que era la más vieja y la más terca de todas. La cuidaba como a una persona. La limpiaba cada tarde con un trapo, le cambiaba el aceite el primer día de cada mes, y nunca, en cinco años, se le apagó una sola noche.",
            "Lo recuerdo caminando por el piso treinta con la Abuela en una mano y el cuaderno en la otra, silbando bajito. Pensé entonces que era el hombre más feliz del mundo. Y quizá lo era. Pero la luz de una linterna alumbra lo de alrededor y deja en sombra a quien la lleva. Yo, que miraba su luz, no vi nunca su cara cuando no estaba mirando nadie.",
        ],
        moraleja: "Una luz encendida no prueba que quien la lleva esté bien: pregúntale, aunque se ría.",
    },

    // ===== LIBRO SEGUNDO: EL INVIERNO =====
    {
        titulo: "El primer frío",
        parrafos: [
            "El invierno del año once fue el más duro que yo recuerde. Nevó en el valle por primera vez en treinta años y la nieve se coló por las rendijas de la Torre, helando los escalones. Subíamos con las manos envueltas en trapos, con la cara cubierta, tosiendo. Lía propuso que todos descansáramos una semana. Los doce votamos que sí, entre bostezos.",
            "Todos menos Orrin. «Yo subo despacio, si hace falta —dijo—, pero subo. Si me quedo quieto, me enfrío.» Le dijimos que no hacía falta, que bastaba una semana. Se rio y dijo que ya lo pensaría. No dijo que no. Y no lo pensó. Siguió subiendo mientras los demás dormíamos hasta tarde, y de noche seguía apuntando el Libro de las subidas con la letra cada vez más pequeña.",
            "Yo me di cuenta de que algo iba mal por la tos. Tosía distinto: seco, como si le arañara por dentro. Por la risa también. Ya no llegaba a tiempo: reía un instante después del chiste, como si hubiera que recordarlo primero. Una tarde le vi las manos, hinchadas y rojas, y le dije que parara. «Después de esta semana», contestó.",
            "Después de esa semana vino otra, y la nieve no se fue. Yo lo vigilaba de lejos, porque me daba vergüenza hacerlo de cerca. Pensaba: él sabe lo que hace; él es el mejor de los doce. Y esa fue la primera hebra que se me deshilachó: creer que el más fuerte no necesita que lo cuiden.",
            "Hace falta mucha honestidad para pensar de otro «está mal» sin esperar a que él lo diga. A mí me faltó entonces. Esperé a que me lo pidiera, y no me lo pidió, porque quien está acostumbrado a ser el que ayuda no sabe pedirlo. Se lo agradecí callándome. Es lo más cobarde que he hecho jamás, y todavía creía estar siendo respetuosa.",
        ],
        moraleja: "Respetar a alguien no es dejarlo solo con su cansancio: es preguntarle dos veces.",
    },
    {
        titulo: "Solo un día",
        parrafos: [
            "Una noche de enero, a la hora de apuntar las subidas, Orrin no dijo su piso. Cuando le tocó el turno se quedó mirando el cuaderno un buen rato y por fin dijo, sin levantar la cabeza: «Mañana no subo. Solo un día». Lo dijo con una voz tan tranquila que nos dio más miedo que si hubiera gritado.",
            "Lía fue la primera en contestar: «Claro que sí, Orrin. Te lo has ganado». Y todos dijimos que sí, y alguien le dio una palmada en la espalda, y otro dijo que ya era hora. Nos sentimos buenos. Estábamos tan convencidos de que hacíamos lo correcto que ninguno vio lo que faltaba en la frase de Orrin: la fecha. No dijo «hasta mañana». Dijo «solo un día». Y un día sin nombre no termina nunca.",
            "Debajo del primer piso, junto a la base de la Torre, hay un cuarto pequeño que llamábamos la Brasa. Es el único sitio donde llega el calor de la Llama sin quemar: el aire sube desde abajo, tibio y quieto, y en invierno se está allí mejor que en ningún otro lugar del valle. Orrin se llevó una manta y el cuaderno y bajó a dormir a la Brasa. «Solo un día», repitió desde la escalera. Y le contestamos con un «¡ya casi!» que sonó a despedida.",
            "No le pedí que dijera hasta cuándo. Lo pensé, de pie en el primer escalón, mirando cómo bajaba con la lámpara. Pensé: si se lo pregunto, es como decirle que no confío en él. Callé. Fue mi primer error de verdad. Lo recuerdo palabra por palabra, porque los errores que uno comete por delicadeza son los que más pesan después.",
            "Hubo un gesto que me quedó grabado. Antes de cerrar la puerta de la Brasa, Orrin colgó su linterna en el gancho del pasillo, la Abuela, bien encendida. «Para que sepáis dónde estoy», dijo. Lo dijo en broma, como si fuera el tema del juego. Pero lo había dicho él: «dónde estoy». No «cuándo vuelvo».",
        ],
        moraleja: "Descansar es parar con fecha de vuelta. Pregunta siempre: ¿hasta cuándo?",
    },
    {
        titulo: "Las razones",
        parrafos: [
            "Al día siguiente no subió. Fue lo normal, lo esperado. Le llevé sopa a mediodía y estaba tumbado en la manta con una sonrisa cansada, escribiendo algo. «Un día más», dijo cuando le pregunté. Le dije que muy bien. Le dejé la sopa y subí mis pisos pensando que había hecho una buena obra.",
            "A la semana, la razón fue «cuando pase el frío». Un mes después fue «cuando acabe de ordenar mis notas». Más tarde, «cuando se me quite este cansancio de los huesos». Después, «cuando tenga ganas». Cada razón era razonable, y ese era el problema: nadie puede decirle a otro que no tiene derecho a esperar a que pase el frío o a ordenar sus notas.",
            "Yo le llevaba sopa, castañas, libros. Ellos le llevaban cosas también: Elisa una manta más gruesa, los hermanos una silla, el panadero pan caliente. Eran regalos del cariño, y poco a poco fueron haciendo del cuarto un lugar donde se estaba demasiado bien. No lo supimos. Cada cosa que le dábamos para que estuviera cómodo le quitaba un motivo para salir.",
            "Mi madre decía que una soga se deshilacha hebra a hebra y que desde fuera no se nota hasta que cede de golpe. Cada razón de Orrin era una hebra. Ninguna era mentira. Ninguna rompía nada por sí sola. Pero cada una dejaba la cuerda un poco más fina, hasta que ya no sostenía ni su propio peso.",
            "Lo que no supe hasta mucho después fue que él apuntaba cada razón en el Libro de las subidas, con fecha, como si fuera una subida más. Las encontré años más tarde, cuarenta y una en total, escritas con esa letra bonita que se le fue encogiendo. La última decía: «Cuando alguien me lo pida bien». Al leerla me di cuenta de que había estado esperando. Yo estaba tan ocupada siendo amable que no se me ocurrió ser exigente.",
        ],
        moraleja: "Cuando cada razón sola es verdad, hay que mirar la suma: cuarenta razones razonables hacen una rendición.",
    },
    {
        titulo: "El cuerpo",
        parrafos: [
            "Lo primero que perdió fueron las piernas, y no fue de golpe. Primero dejó de subir. Después dejó de bajar al comedor, y le llevábamos la comida. Después dejó de salir de la Brasa para tomar el sol a mediodía, porque «afuera hace frío». Después, hasta de levantarse de la manta le parecía un esfuerzo desproporcionado.",
            "Lo que cuesta entender es que el cuerpo no protesta cuando uno lo deja. Protesta la primera semana: duele, pesa, pide moverse. La tercera semana ya no. Se acostumbra. Se acostumbra tan bien que cuando uno quiere volver a usarlo, el cuerpo ha olvidado cómo y se ofende. La pereza no es un vicio: es lo que pasa cuando algo que funcionaba deja de pedirse.",
            "Orrin engordó, pero eso fue lo de menos. Lo peor fue lo que cambió en sus ojos. Un hombre que se mueve mira distinto de uno que no: tiene los ojos puestos en algo que viene. Los suyos empezaron a mirar hacia dentro, o hacia ninguna parte. Yo lo notaba cuando entraba con la sopa: ya no levantaba la vista para ver quién llegaba. Reconocía los pasos y seguía mirando la pared.",
            "Una vez intenté sacarlo a pasear. Bajamos al primer piso, se sentó en un escalón y dijo, con la respiración cortada: «Mira, qué tonto, me ahogo en cinco escalones». Se rio, pero esta vez la risa le salió sola, sin gracia, como el eco de otra cosa. Esa noche no quiso volver a intentarlo. «Cuando entre en calor, Marta, cuando entre en calor.»",
            "Hoy, con muchos años encima, sé que hay un primer enemigo de quien se rinde y es su propio cuerpo, que lo cree sinceramente cuando le dice «descansa». Aquel cuerpo fue lo primero que el vacío de Orrin se llevó, y después le dio forma. Dicen que el Heraldo del Cuerpo, allá abajo, arrastra los pies como quien sube la escalera más larga con las rodillas rotas. Yo sé de dónde viene esa manera de arrastrarse.",
        ],
        moraleja: "El cuerpo no protesta cuando lo dejas: se acostumbra. Por eso conviene moverlo antes de que olvide cómo.",
    },
    {
        titulo: "La mente",
        parrafos: [
            "Lo segundo que perdió fue lo que mejor sabía hacer: pensar. No es que dejara de ser inteligente. Al contrario: se volvió más listo que nunca, pero todo su ingenio empezó a servir a una sola causa, la de quedarse. Orrin, que siempre había sido el mejor contador de historias, se convirtió en el mejor contador de excusas.",
            "Yo discutía con él, y siempre perdía. Le decía: «Llevas dos meses sin subir». Y él me explicaba, con paciencia y con ejemplos, por qué dos meses no eran nada, por qué descansar era también avanzar, por qué la Torre no iba a salir corriendo, por qué los grandes hombres de la historia descansaron mucho más que eso. Me convencía. Me iba a mi cuarto pensando: tiene razón. Y a la mañana siguiente me daba cuenta de que nadie había dicho nada sobre volver.",
            "La mente que quiere quedarse es el mejor abogado del mundo. Encuentra una ley, un precedente y un testigo para cada cosa que se le pida defender. No miente: elige. Escoge con cuidado cuáles verdades iluminar y cuáles dejar en sombra. Y si uno la oye con corazón de amigo, la cree entera.",
            "También fue entonces cuando se le acabaron las ganas de leer. En el cuarto de la Brasa se apilaban libros que ya no abría. Y el Libro de las subidas se quedó parado. La última entrada, de puño y letra de Orrin, tiene fecha de un día de febrero y dice: «Hoy no subí. Pero pensé mucho». Debajo hay una raya, y después nada. Cuando lo vi, entendí que no había dejado de escribir por cansancio, sino porque ya no tenía números que apuntar.",
            "Dicen que el Heraldo de la Mente, allá abajo, no ataca: argumenta. Habla muy bajo y muy amable, y quien lo escucha empieza a asentir. Yo conozco esa voz. Era la voz de Orrin el invierno que se quedó, explicándome con ternura por qué yo no tenía por qué preocuparme.",
        ],
        moraleja: "Cuidado con la mente que se vuelve brillante para quedarse: no miente, pero escoge muy bien qué verdades enseñar.",
    },
    {
        titulo: "La voz y el tesoro",
        parrafos: [
            "Lo tercero que perdió fue la voz, y esto es lo que menos se entiende. No se quedó mudo. Hablaba con todos. Pero dejó de decir lo que de verdad pasaba. Cuando venía alguien a verlo, le decía «mañana subo», «ya casi estoy listo», «esta semana empiezo». Palabras que sonaban a promesa y que en su boca ya eran solo ruido.",
            "Lo peor de las mentiras blandas es que primero se las dice uno a los demás y luego se las cree. A los tres meses ya no mentía: creía de verdad que iba a subir mañana. Hacía planes, calculaba pisos, hablaba de lo que haría. La voz, cuando se rompe, no se queda callada: se llena de futuro, y el futuro es lo que uno cuenta cuando no tiene presente.",
            "Dejó de reírse. Nadie notó el día exacto, y eso lo vuelve peor. La risa que se oía desde la cantera se fue apagando, de a poco, hasta que una tarde me di cuenta de que hacía meses que no la oía. Le conté un chiste de los suyos para ver si reaccionaba. Sonrió con la boca. Los ojos se quedaron donde estaban, mirando otra cosa.",
            "Y fue entonces cuando el cuarto se llenó de tesoros. No de oro, sino de pequeñas cosas: mantas, dulces, adornos, regalos, cajas de recuerdos que nadie abría. Cada visita traía algo, y Orrin las guardaba todas, por si acaso, en estantes, en rincones, debajo de la cama. Quien se queda quieto acumula, porque lo que ya no vive lo sustituye con lo que posee. Al final casi no cabía en su propio cuarto.",
            "Hoy sé que de esas cuatro pérdidas, cuerpo, mente, voz y tesoro, nacieron las que llaman las Cuatro Sombras. No las creó un mal que viniera de fuera. Las hizo el vacío que dejó lo que Orrin ya no hacía: allí donde antes había subida, se abrió un hueco, y los huecos, cuando nadie los llena con algo vivo, se llenan solos con lo peor. Eso es todo lo que sé de dónde vienen. Y es más de lo que quisiera.",
        ],
        moraleja: "Todo lo que dejas de hacer deja un hueco, y el hueco se llena solo si tú no lo llenas.",
    },
    {
        titulo: "El nombre en la piedra",
        parrafos: [
            "Llegó la primavera y con ella la nieve se fue. Los cerezos florecieron, y yo seguí subiendo, y el cuarto de la Brasa seguía igual. Los demás Vigías fueron dejando de bajar. Algunos se cansaron; otros, como yo, se quedaron sin saber qué decir. Lía bajaba cada tarde a sentarse con él, en silencio, sin preguntar nada.",
            "Una noche de mayo, al apuntar la subida de la noche, vi el nombre de Orrin en la piedra del primer piso. Estaba allí, como siempre, grabado por Ander entre los doce, con su inicial grande y redonda. Lo había mirado todos los días durante años sin pensar nada. Pero esa noche me pareció que me miraba. Y sentí una rabia que no era rabia, sino algo más feo y más pequeño.",
            "Tenía en el bolsillo un cuchillo de cortar sogas. Lo saqué sin pensar y empecé a raspar. No fue un acto de odio: fue de cobardía. Cada letra que borraba era una letra menos que tendría que mirar cada mañana, y con ella una pregunta menos. Cuando acabé, la piedra quedó lisa, con una forma de hueco. Yo estaba sudando y no recuerdo haber respirado.",
            "Al día siguiente Lía vio el hueco. Se quedó mirándolo mucho rato, con las manos en la espalda. Yo estaba detrás, esperando que me regañara, y quería que lo hiciera. No dijo nada. Solo, al rato, tocó la piedra con la yema de los dedos y murmuró: «Lo que se raspa se puede volver a grabar. Pero hay que acordarse de dónde estaba». Entendí que sabía quién había sido y que no iba a decírmelo.",
            "Esa es la verdad que no conté en el pergamino que dejé sin firma: el que raspó el nombre fui yo. Dicen que lo hizo alguien que lo quería mucho, para no tener que verlo cada mañana. Es cierto. Pero no lo cuento como excusa. Fue más fácil borrar su nombre que ir a buscarlo. Y todo el que borra un nombre se quita, de paso, la obligación de buscar a quien lo llevaba.",
        ],
        moraleja: "Borrar el nombre de quien se rindió es quitarte la obligación de volver a buscarlo.",
    },

    // ===== LIBRO TERCERO: LA LINTERNA =====
    {
        titulo: "Lo que hizo Lía",
        parrafos: [
            "Muchos preguntaron después por qué Lía no hizo más. Por qué no lo sacó a la fuerza, por qué no lo llevó en brazos, por qué no gritó. Yo se lo pregunté una vez, de frente, y su respuesta es lo único bueno que saqué de aquellos años. «A nadie se le rescata a empujones, Marta —me dijo—. A nadie. Se le deja la puerta abierta y una luz encendida. Y se le espera sin cobrarle la espera.»",
            "Hizo exactamente eso. Durante casi un año bajó cada tarde a la Brasa. No le pedía nada: se sentaba junto a él, a veces le leía algo, a veces solo se quedaba mirando la Llama por la rendija. Contaba cosas del valle, de los niños, de las cosechas. No le preguntaba cuándo volvería. Y a veces Orrin le contestaba, y a veces no.",
            "Un día, hacia el final de ese año, Lía subió muy seria. Dijo que la Brasa ya no era la Brasa. Que el cuarto se había hecho más hondo y que las paredes no se veían. Que el calor ya no subía: bajaba. «Ya no es solo él —me dijo—. Hay algo más allí abajo. Algo que no tenía nombre y que ahora empieza a tenerlo.» No dijo qué. Años después supe que se llamaba el Mañana.",
            "Dejó de bajar porque la Llama necesitaba que alguien la cuidara cada día y no podía hacer las dos cosas. Fue la decisión más dura de su vida y la tomó sin llorar, con la cara muy tranquila, como quien suelta una cuerda para no arrastrar a los demás. Me pidió que yo bajara de vez en cuando a comprobar que seguía vivo. Le dije que sí. Y lo hice, tres veces al año, durante los años siguientes, sin decirle nunca la cosa que debía decirle.",
            "Esa es la parte que no entendí hasta ahora: Lía no abandonó a Orrin, y yo tampoco, pero ninguna de las dos le dijimos lo único que hacía falta. «Vuelve.» Una palabra. Nos pareció brusca, indelicada. Teníamos más miedo de ser duras que de perderlo. Y el miedo a ser duras nos hizo, sin darnos cuenta, tibias.",
        ],
        moraleja: "A nadie se le rescata a empujones, pero tampoco hay que callar la palabra que ayuda: «vuelve».",
    },
    {
        titulo: "Tres años",
        parrafos: [
            "Pasaron tres años. Yo seguí subiendo, y llegué a ser la que más subía de los doce, aunque sin gracia, sin gritos de «ya casi», sin ganas de que nadie me aplaudiera. Subía como quien paga una deuda. Cada piso era un pequeño pago, y cada noche, al apuntarlo, me parecía que debía un poco más.",
            "Los demás se fueron apagando por distintos caminos. Los hermanos se casaron y se mudaron al valle. Elisa subía solo de noche y cada vez menos. El panadero perdió la cuenta de los escalones, por fin, y no volvió a lamentarlo. Bruno desapareció un día sin decir palabra. Cuando quise darme cuenta, éramos cinco Vigías subiendo, luego tres. La Torre ya no tenía dos luces cada noche: tenía una, o ninguna.",
            "Había una luz que no se apagaba, y era la de la Abuela, la linterna de Orrin, colgada en el gancho del pasillo. Las demás linternas de los doce se fueron quedando sin aceite, una tras otra. La de Orrin ardía cada noche, y nadie preguntaba por qué. Era yo: cada atardecer la encendía, y cada primer día de mes, sin decírselo a nadie, le rellenaba el aceite y le limpiaba el cristal con el trapo que él mismo usaba. Lo hice durante años, a escondidas, incluso después de raspar su nombre.",
            "No sé explicar la contradicción. Borré el nombre de un hombre y seguí cuidando su luz. Supongo que una parte de mí sabía que lo segundo era lo importante, y que la otra parte, la que raspaba, necesitaba culparse de algo para no tener que culparse de lo demás. Esa linterna fue lo único que me impidió volverme loca en aquellos años: mientras ardiera, Orrin no estaba perdido. Estaba esperando. Hoy pienso que fue, además, mi segundo error: Lía había dicho que si una linterna se apagaba tres noches seguidas, alguien subiría a ver qué pasaba. La de Orrin nunca se apagó, así que nadie subió. Las alarmas callan cuando alguien las cuida en silencio.",
            "Una noche, al cumplirse el tercer año, escribí el pergamino sin firma. Lo escribí sin poner mi nombre ni el suyo, y lo enrollé alrededor de la linterna. Decidí que bajaría con ella. Sabía que algo estaba cambiando en el fondo, que la puerta de la Brasa se había vuelto más pesada cada vez que la empujaba, y que si no bajaba pronto, no podría volver a hacerlo.",
        ],
        moraleja: "Cuidar la luz de alguien sin decírselo es algo, pero a veces hay que bajar a decírselo.",
    },
    {
        titulo: "Bajar",
        parrafos: [
            "La puerta de la Brasa pesaba como si fuera de plomo. Tuve que empujarla con el hombro, y detrás ya no había el cuartito tibio de otros tiempos, sino una escalera ancha que bajaba y bajaba y se perdía en la oscuridad. El aire olía a pan olvidado y a ceniza fría. Bajé con la linterna de Orrin en una mano, su linterna, la Abuela, y la mía en la otra.",
            "A mitad de la escalera empecé a ver formas. No eran monstruos todavía: eran siluetas apoyadas en las paredes, a distintos niveles, como estatuas de gente que se hubiera sentado a descansar y no se hubiera levantado. Una estaba encorvada, arrastrando los pies sin moverse del sitio. Otra murmuraba bajito, hablando sola con mucha delicadeza. Otra tenía la boca abierta pero no salía sonido. Otra abrazaba un montón de cosas que no soltaba.",
            "No me tocaron. Pasé por entre ellas con las dos linternas en alto, y cada una, al verme, se hacía a un lado un poco. Años después comprendí por qué. Yo llevaba dos luces encendidas y no les ofrecía nada a lo que ellas pedían: ni excusas, ni descansos, ni silencios, ni cosas. Ellas solo existían donde alguien les daba de comer. Yo no tenía qué darles.",
            "Al final de la escalera había una sala sin muros, solo una oscuridad que latía, y en el centro un trono grande hecho de algo que al principio tomé por piedra y luego vi que eran cuadernos: miles de cuadernos, apilados, atados con cuerdas, las notas de miles de días en los que no pasó nada. Sentado en lo alto, con una corona de cuerda sin nada dentro, estaba Orrin.",
            "No lo reconocí al instante. Se había vuelto muy delgado, muy gris, con los ojos hundidos, y tenía las manos sobre las rodillas, quietas. Pero cuando me acerqué con la luz y vi, entre el hollín de su cara, la forma de su nariz y la curva de su boca, una especie de espasmo me recorrió entera. Era él. Seguía siendo él, debajo de todo. Solo que no lo sabía.",
        ],
        moraleja: "Quien baja a buscar a otro no necesita armas: necesita luz y no darle de comer a lo que lo retiene.",
    },
    {
        titulo: "Lo que se le dice a quien se quedó",
        parrafos: [
            "Me quedé de pie delante del trono, sin saber qué decir. Había ensayado mil veces mis palabras durante el descenso: discursos, reproches, ruegos. Pero cuando lo tuve delante, todos se me cayeron de la mano. Lo que dije al final fue lo más sencillo del mundo. «Orrin —dije—. Soy Marta.»",
            "Levantó la cabeza muy despacio. Tenía los ojos como los de alguien que despierta de un sueño largo y no sabe todavía dónde está. Me miró sin reconocerme. Me miró con cortesía. «Ah —dijo—. Qué amable. Pase, pase. Estoy en un momento de descanso. Subiré enseguida.» Y sonrió con esa sonrisa de antes, la de las razones. Entonces comprendí que ya no sabía su propio nombre.",
            "No discutí. No le dije que se había olvidado de sí mismo ni le recité las cuarenta y una razones. Hice lo único que se me ocurrió: levanté la Abuela, su linterna, y la puse en el suelo entre los dos. Estaba abollada de un lado, como siempre, y ardía con una llama firme y pequeña. «Es tuya —le dije—. La he cuidado yo. Me ha costado tres años de aceite.»",
            "Se quedó mirándola. Y vi lo que había estado esperando durante años. Primero, un parpadeo. Luego, una arruga entre las cejas, la arruga de quien busca una palabra en la punta de la lengua. Y por fin, con un hilo de voz, casi inaudible, dijo: «¡Ya… casi!». Lo dijo como una pregunta, como si no estuviera seguro de que la frase le perteneciera. «Ya casi», repitió. Y entonces, por primera vez en muchos años, se rio.",
            "Fue una risa corta, quebrada, de dos notas. Pero la oí desde dentro de mis propios huesos. Fue la risa de la cantera, y por un momento los miles de cuadernos del trono temblaron. Los Heraldos, detrás de mí, se agitaron. «Vuelve, Orrin —le dije al fin, con la voz rota—. No tienes que volver entero. Basta con un escalón. Vuelve.» Fue la palabra que debí decirle tres años antes.",
        ],
        moraleja: "A quien se quedó no hace falta convencerlo: hace falta devolverle su luz y decirle, sin miedo a ser dura, «vuelve».",
    },
    {
        titulo: "La luz en el fondo",
        parrafos: [
            "No volvió. Lo escribo despacio, porque es la parte más dura. Se rio, abrió los ojos, dijo «ya casi», y después se le fue la luz de la cara, poco a poco, como la de una vela que se agota. «Estoy muy cansado, Marta —dijo, y por fin dijo mi nombre—. Déjame un rato más.» Y yo, que había bajado a pedirle que volviera, comprendí que su vuelta no dependía de mí. Que solo podía dejarle la luz.",
            "Detrás de mí, los Heraldos empezaron a moverse. La escalera crujió. Una sombra ancha se desprendió de la oscuridad. Supe que me quedaban pocos minutos. Le dejé a Orrin la Abuela, bien encendida, a los pies del trono. Le puse encima el pergamino sin firma, enrollado a su alrededor. Dije en voz alta, para que lo oyera aunque no lo entendiera: «No la apagues. Está encendida por ti. Alguien vendrá».",
            "Subí corriendo, con mi linterna, sin mirar atrás. A mitad de la escalera sentí un golpe en el vidrio de la linterna de Orrin, allá abajo, un sonido de cristal que se quebraba. Giré. Una grieta oscura recorría la Abuela de arriba abajo. Pero la llama seguía ardiendo, pequeña y dorada, a pesar de todo, al lado del trono vacío de Orrin. Me quedé un instante mirándola. Después seguí subiendo.",
            "Salí por la puerta de la Brasa justo a tiempo. Detrás de mí se cerró con un sonido que no olvidaré: no un portazo, sino un suspiro grande, como el de una mano que se cierra. Intenté abrirla otra vez y era piedra lisa. Desde entonces nadie ha podido bajar. Dicen que se abrirá cuando caiga el Dragón de la tormenta, el de la cima, y que entonces será otra escalera, más larga y más oscura que la que yo conocí.",
            "Esa noche subí hasta el piso cien, el que subimos juntos, y me quedé mirando el valle. No lloré. Grité una vez «¡Ya casi!» hacia abajo, hacia el fondo, y esperé. No oí nada. Pero aprendí algo que todavía me sirve: que la luz y la voz de uno pueden llegar por caminos que no se ven, a lugares donde uno no sabe, y a oídos que uno no conoce. Hay palabras que tardan años en llegar. Quizá la mía, y las de otros, sean de esas.",
        ],
        moraleja: "A veces solo puedes dejar una luz encendida y confiar en que alguien la llevará hasta el final.",
    },
    {
        titulo: "Para quien baje",
        parrafos: [
            "Si lees esto, es que has bajado. No sé quién eres ni cuándo vives. Sé que has pasado por los Heraldos, que has visto lo que yo vi, y que probablemente estás a punto de enfrentarte a un rey con una corona de cuerda. Quiero decirte algunas cosas, que es lo único útil que puedo hacer desde aquí.",
            "Lo primero: no lo odies. Es muy fácil. Lleva cientos de años rodeado de lo peor de nosotros, y cualquiera lo odiaría. Pero él no eligió ser eso. Se quedó un día, y otro, y otro, y cada «solo un día» le fue quitando un poco de sí mismo. Si lo odias, estarás odiando al que habría podido ser tú. Y todos podemos quedarnos, también tú, también yo, aunque hoy te sientas fuerte.",
            "Lo segundo: no vayas solo a vencer. Vence, claro, porque no hay otra manera de pasar. Pero cuando acabe, cuando la corona ruede por el suelo y la oscuridad se calle, busca en el suelo. Busca una linterna con una abolladura en la base y un cristal roto. Seguirá encendida. Es la Abuela. Y llámalo por su nombre. No por «Rey Hueco»: por Orrin. Dilo una vez, en voz alta. Los nombres, dichos por quien los recuerda, tienen una fuerza que no se gasta.",
            "Lo tercero, y es lo que más importa: sube la linterna. Llévala hasta la piedra lisa del primer piso, donde yo raspé su nombre, y si puedes, grábalo otra vez, con tu cincel o con lo que tengas. Hazlo sin ceremonia, sin discursos. Un nombre vuelve a la piedra cuando alguien decide acordarse de él, y para eso no hay que esperar a que nadie nos dé permiso. Fue lo que no supimos hacer los doce.",
            "Si aprendes algo de mi historia, que sea esto: nadie se rinde de golpe, nadie se rescata a empujones, y lo único que de verdad sirve es dejar la puerta abierta, la luz encendida y decirle, sin miedo a ser dura, «vuelve». Te lo dice una vieja que tardó tres años en bajar y toda una vida en entender por qué no bajó antes. No tardes tú.",
        ],
        moraleja: "Nadie se rinde de golpe y nadie se rescata a empujones: deja la puerta abierta, la luz encendida y di «vuelve».",
    },
];

export const EPILOGO = [
    "Hoy, con ochenta años y las rodillas hechas un lío de nudos, subí un piso. Uno solo, el primero, despacio, agarrándome a la barandilla. Me costó más que los cien que subí con Orrin. Al llegar arriba grité «¡ya casi!» por costumbre, hacia abajo, hacia nadie. Y desde lo hondo de la Torre, me pareció oír que alguien respondía.",
    "No sé si fue el eco o fue él. Prefiero no saberlo. A veces la duda es lo que mantiene encendida una luz, y yo tengo todavía una linterna que cuidar. Cuando la mía se apague, alguien tendrá que subir a ver qué pasa. No a regañarme. A acompañarme. Así lo dijo Lía una vez, y no hay mejor definición de lo que somos.",
    "Sube hoy un escalón. Hazlo por ti, por mí, y por el primero de nosotros que se quedó abajo.",
];

export const ENSENANZAS = [
    "Una buena compañía no te hace fuerte: te hace volver.",
    "Lo que prometes en voz alta, alguien tiene que poder apuntarlo.",
    "Hay quien grita «ya casi» para animar a otros y para no tener que pararse a sí mismo.",
    "Quien no sabe descansar tampoco sabe volver.",
    "Una luz encendida no prueba que quien la lleva esté bien: pregúntale, aunque se ría.",
    "Respetar a alguien no es dejarlo solo con su cansancio: es preguntarle dos veces.",
    "Descansar es parar con fecha de vuelta. Pregunta siempre: ¿hasta cuándo?",
    "Cuarenta razones razonables hacen una rendición.",
    "El cuerpo no protesta cuando lo dejas: se acostumbra.",
    "La mente que quiere quedarse no miente: elige qué verdades enseñar.",
    "Todo lo que dejas de hacer deja un hueco, y el hueco se llena solo si tú no lo llenas.",
    "Borrar el nombre de quien se rindió es quitarte la obligación de buscarlo.",
    "A nadie se le rescata a empujones, pero tampoco hay que callar la palabra que ayuda: «vuelve».",
    "Cuidar la luz de alguien sin decírselo es algo, pero a veces hay que bajar a decírselo.",
    "Quien baja a buscar a otro no necesita armas: necesita luz.",
    "A quien se quedó no hace falta convencerlo: hace falta devolverle su luz y decirle «vuelve».",
    "A veces solo puedes dejar una luz encendida y confiar en que alguien la llevará hasta el final.",
    "Un nombre vuelve a la piedra cuando alguien decide acordarse de él.",
];

export const FIRMA = "Marta, una de los doce, que raspó su nombre";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

// El libro con el nombre puesto (y qué capítulos puedes abrir ya).
// record = tu récord en la Mazmorra (sótanos superados). Devuelve lo mismo que libroDeCasio:
// { titulo, subtitulo, autor, prologo, capitulos: [{ numero, titulo, parrafos, moraleja, abierto, bloqueado, libro, empiezaLibro }],
//   epilogo, ensenanzas, firma, minutos, palabras }
export function libroDe(nombre, record = 0) {
    const poner = (texto) => texto.replaceAll("{n}", nombre);
    const abreLibre = record >= PUERTA.libre;
    const termino = record >= PUERTA.final;
    const capitulos = CAPITULOS.map((c, i) => {
        const abierto = i < CAPITULOS_LIBRES ? abreLibre : termino;
        const libro = [...LIBROS].reverse().find((l) => i >= l.desde);
        return {
            numero: ROMANOS[i], titulo: c.titulo, abierto, libro,
            empiezaLibro: LIBROS.find((l) => l.desde === i) || null,
            parrafos: abierto ? c.parrafos.map(poner) : [],
            moraleja: abierto ? c.moraleja : "",
            bloqueado: abierto ? null : (i < CAPITULOS_LIBRES ? PUERTA.textoLibre : PUERTA.textoFinal),
        };
    });
    return {
        titulo: TITULO, subtitulo: SUBTITULO, autor: AUTOR,
        prologo: abreLibre ? PROLOGO : [], capitulos,
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
