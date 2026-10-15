// mazmorras.js — Tres mazmorras nuevas: «Las Minas de la Codicia» y «El Laberinto de los Ecos» (v64) y «La Fragua Profunda» (v73).
//
// Son SOLO DATOS (no importan nada): bestiario.js, torre.js, leyendas.js y cinematicas.js los leen y los suman a lo que ya
// hay. Funcionan con las mismas reglas de la Torre y la Mazmorra del Abismo (ver torre.js), pero cada una tiene lo suyo:
//
//   Las Minas de la Codicia (⛏️, Riqueza)   15 niveles en 3 zonas. Se abren al bajar 10 sótanos de la Mazmorra del Abismo.
//   El Laberinto de los Ecos (🌀, Intelecto) 15 cámaras en 3 zonas. Se abre al bajar 10 niveles de las Minas.
//   La Fragua Profunda (⚒️, Fuerza)          15 hornos en 3 zonas. Se abre al bajar 10 cámaras del Laberinto O al llegar al nivel 5 de
//                                            gimnasio: solo un cuerpo entrenado aguanta su calor (ver gym.js).
//
// Cada zona tiene 5 criaturas (la quinta es su guardián). Las criaturas nuevas reutilizan los dibujos de las que ya existían,
// con otros colores y otros nombres (ver dibujo-monstruos.js). En la historia: las Minas son la guarida de la Sombra del Tesoro y el
// Laberinto es donde fueron a parar las voces que la Sombra de la Voz le quitó a la aldea (ver voces-datos.js).
//
// Todo es TEXTO PLANO (vistas.js lo escapa). {n} es el nombre de tu héroe.

// ===== Los lugares =====
// abre = lo que hay que haber superado para abrirlo: { lugar, piso } (en ese lugar). escala = cómo crecen sus criaturas con el piso:
//   vida = a + b·piso + c·piso², ataque = a + b·piso (los guardianes, además, × guardianVida / guardianAtaque).
export const ZONAS_MINAS = [
    { id: "galerias", nombre: "Galerías olvidadas", articulo: "las", texto: "Túneles apuntalados con vigas podridas. Aquí se empezó a cavar por necesidad y se siguió por hambre." },
    { id: "veta", nombre: "La veta dorada", articulo: "la", texto: "El oro corre por la roca como venas. Brilla tanto que cuesta acordarse de por qué se bajó." },
    { id: "tesoreria", nombre: "Tesorería del Rey Avaro", articulo: "la", texto: "Montañas de monedas y ni una sola ventana. Quien lo tiene todo aquí abajo ya no puede salir." },
];

export const ZONAS_LABERINTO = [
    { id: "pasillos", nombre: "Pasillos de espejos", articulo: "los", texto: "Cada pared devuelve una versión de ti. Ninguna se parece del todo." },
    { id: "ecos", nombre: "Cámara de los Ecos", articulo: "la", texto: "Aquí lo que dices vuelve cambiado. Y lo que piensas, también." },
    { id: "silencio", nombre: "Salón del Silencio", articulo: "el", texto: "Ni un sonido, ni siquiera el tuyo. Hay cosas que solo se oyen cuando todo calla." },
];

export const ZONAS_FRAGUA = [
    { id: "hornos", nombre: "Hornos fríos", articulo: "los", texto: "Bocas de horno apagadas, con las herramientas colgadas esperando una mano que no llega." },
    { id: "yunque", nombre: "El yunque", articulo: "el", texto: "Un yunque del tamaño de una casa. De cada golpe lejano salen chispas que se quedan colgando en el aire." },
    { id: "corazon", nombre: "El corazón de la Fragua", articulo: "el", texto: "Una llama azul que no calienta y un hombre que lleva cien años golpeando sin levantar la vista." },
];

export const NUEVOS_LUGARES = {
    minas: {
        id: "minas", nombre: "Minas de la Codicia", icono: "⛏️", piso: "Nivel", pisos: "niveles", vuelta: "dorada", zonas: ZONAS_MINAS,
        verboBajar: "el descenso", verboFin: "Fin del descenso", otraVez: "Bajar otra vez", boton: "Bajar a las minas",
        abre: { lugar: "mazmorra", piso: 10, texto: "Baja 10 sótanos en la Mazmorra del Abismo: en el décimo hay una grieta con un brillo dorado." },
        portada: "tesoreria",
        regla: {
            atributo: "riqueza",
            premio: { gemasPorPiso: 6, xpPorPiso: 4.5, maxGemas: 90, maxXp: 70 },
            curaAlSubir: 0.05, enfurecer: true,
            escala: { vida: [150, 26, 1.1], ataque: [20, 2.5], guardianVida: 1.5, guardianAtaque: 1.2 },
        },
        resumen: "Quince niveles bajo el valle, donde se cavó oro hasta olvidar para qué. Las criaturas son más duras que en la Mazmorra y casi todas tienen un truco: barreras, coraza, venenos y reflejos. Aquí no hay salas: el oro no da descanso, pero sí un pequeño respiro (5 % de vida) al bajar.",
    },
    laberinto: {
        id: "laberinto", nombre: "Laberinto de los Ecos", icono: "🌀", piso: "Cámara", pisos: "cámaras", vuelta: "reflejada", zonas: ZONAS_LABERINTO,
        verboBajar: "el recorrido", verboFin: "Fin del recorrido", otraVez: "Entrar otra vez", boton: "Entrar al laberinto",
        abre: { lugar: "minas", piso: 10, texto: "Baja 10 niveles en las Minas de la Codicia: entre las monedas del décimo hay un espejo." },
        portada: "ecos",
        regla: {
            atributo: "intelecto",
            premio: { gemasPorPiso: 7, xpPorPiso: 5, maxGemas: 105, maxXp: 80 },
            curaAlSubir: 0, enfurecer: true,
            escala: { vida: [170, 28, 1.3], ataque: [24, 2.8], guardianVida: 1.5, guardianAtaque: 1.25 },
        },
        resumen: "Quince cámaras de espejos, ecos y silencio. Aquí fueron a parar las voces que se perdieron. Es lo más difícil del juego: las criaturas pegan fuerte, repiten tus trucos y casi no hay descanso. Pero lo que se oye al final vale la pena.",
    },
    fragua: {
        id: "fragua", nombre: "Fragua Profunda", icono: "⚒️", piso: "Horno", pisos: "hornos", vuelta: "al rojo", zonas: ZONAS_FRAGUA,
        verboBajar: "el descenso", verboFin: "Fin del descenso", otraVez: "Bajar otra vez", boton: "Bajar a la Fragua",
        abre: { lugar: "laberinto", piso: 10, gym: 5,
                texto: "Baja 10 cámaras del Laberinto de los Ecos… o entrena de verdad: llega al nivel 5 de gimnasio. Solo un cuerpo entrenado aguanta el calor de la Fragua Profunda." },
        portada: "corazon",
        regla: {
            atributo: "fuerza",
            premio: { gemasPorPiso: 6.5, xpPorPiso: 4.8, maxGemas: 98, maxXp: 75 },
            curaAlSubir: 0.03, enfurecer: true,
            escala: { vida: [160, 27, 1.2], ataque: [22, 2.6], guardianVida: 1.5, guardianAtaque: 1.22 },
        },
        resumen: "Quince hornos bajo el piso de la Fragua, donde Brann forjó las armas de los Vigías y no volvió a parar. Las criaturas están hechas de hierro, brasa y ceniza: resisten el fuego y casi todas se cubren o se cargan. Da XP de Fuerza, y se abre con tu cuerpo: entrena de verdad hasta el nivel 5 de gimnasio, o baja 10 cámaras del Laberinto.",
    },
};

// ===== Las criaturas (las ids empiezan con «mi-» en las Minas y «la-» en el Laberinto) =====
// Los dibujos están en dibujo-monstruos.js (con los mismos ids).
export const NUEVAS_CRIATURAS = {
    // --- Galerías olvidadas ---
    "mi-murcielago": {
        nombre: "Murciélago de socavón", genero: "m", zona: "galerias", debil: "fuego", resiste: null,
        golpe: "Picada", fuerte: "Chillido sordo", talla: 78, vuela: true,
        texto: "Vive donde no llega la luz. Reconoce de lejos a quien lleva años sin ver el sol.",
    },
    "mi-minero": {
        nombre: "Minero hueco", genero: "m", zona: "galerias", debil: "fuego", resiste: "hielo",
        golpe: "Pico oxidado", fuerte: "Barrenazo", especial: { tipo: "sellar", nombre: "Polvo de mina" }, talla: 94,
        texto: "Sigue cavando aunque ya no queda nada que encontrar. Es lo único que sabe hacer.",
    },
    "mi-cieno": {
        nombre: "Cieno de azufre", genero: "m", zona: "galerias", debil: "hielo", resiste: "fuego",
        golpe: "Salpicadura ácida", fuerte: "Oleada", especial: { tipo: "veneno", nombre: "Gases de mina" }, talla: 86,
        texto: "Mana de las grietas y huele a huevo podrido. Quien lo respira mucho tiempo ya no nota el olor.",
    },
    "mi-arana": {
        nombre: "Araña de cobre", genero: "f", zona: "galerias", debil: "rayo", resiste: "fuego",
        golpe: "Mordida", fuerte: "Hilo metálico", especial: { tipo: "coraza", nombre: "Caparazón de cobre" }, talla: 88,
        texto: "Teje con hilos que conducen el trueno. Por eso las galerías suenan como un arpa cuando hay tormenta arriba.",
    },
    "mi-capataz": {
        nombre: "Capataz de hueso", genero: "m", zona: "galerias", guardian: true, debil: "rayo", resiste: "fuego",
        golpe: "Látigo", fuerte: "Sentencia de turno", especial: { tipo: "barrera", nombre: "Escudo de turno" }, talla: 112,
        texto: "Guardián de las galerías. Lleva siglos contando cuánto falta para que termine el turno de los demás.",
    },

    // --- La veta dorada ---
    "mi-cristal": {
        nombre: "Cristal de oro", genero: "m", zona: "veta", debil: "hielo", resiste: "fuego",
        golpe: "Esquirla áurea", fuerte: "Reflejo cegador", especial: { tipo: "reflejo", nombre: "Brillo" }, talla: 82, vuela: true,
        texto: "Brilla tanto que uno se ve en él más rico de lo que es. Esa es su trampa.",
    },
    "mi-golem": {
        nombre: "Gólem de lingotes", genero: "m", zona: "veta", debil: "rayo", resiste: "fuego",
        golpe: "Puño de oro", fuerte: "Alud de lingotes", especial: { tipo: "barrera", nombre: "Coraza de oro" }, talla: 104,
        texto: "Lo armó alguien que quería un guardián que nunca pidiera sueldo. Todavía no entiende para qué sirve el oro.",
    },
    "mi-ascua": {
        nombre: "Ascua de fundición", genero: "f", zona: "veta", debil: "hielo", resiste: "fuego",
        golpe: "Chispazo", fuerte: "Colada", especial: { tipo: "drenar", nombre: "Calor voraz" }, talla: 80, vuela: true,
        texto: "Sale de las fundiciones donde se derretía lo que no era de nadie. Se alimenta de lo que se calienta.",
    },
    "mi-mimico": {
        nombre: "Cofre voraz", genero: "m", zona: "veta", debil: "fuego", resiste: "hielo",
        golpe: "Mordisco de tapa", fuerte: "Lengua de cadena", especial: { tipo: "sellar", nombre: "Candado" }, talla: 92,
        texto: "Parece tan lleno que nadie piensa en lo que hay debajo de la tapa. Casi todos, cuando lo piensan, ya es tarde.",
    },
    "mi-dragon": {
        nombre: "Wyrm de la veta", genero: "m", zona: "veta", guardian: true, debil: "hielo", resiste: "fuego",
        golpe: "Zarpazo dorado", fuerte: "Aliento de brasas", especial: { tipo: "carga", nombre: "Fundir la roca" }, talla: 120,
        texto: "Guardián de la veta. Duerme sobre su propio oro y se despierta, siempre, un poco antes de que se lo lleves.",
    },

    // --- Tesorería del Rey Avaro ---
    "mi-recaudador": {
        nombre: "Recaudador espectral", genero: "m", zona: "tesoreria", debil: "rayo", resiste: "hielo",
        golpe: "Cobro", fuerte: "Embargo", especial: { tipo: "drenar", nombre: "Interés" }, talla: 92, vuela: true,
        texto: "Cobra por cada día que viviste sin pensar en lo que valía. Nunca da recibo.",
    },
    "mi-gargola": {
        nombre: "Gárgola de plata", genero: "f", zona: "tesoreria", debil: "rayo", resiste: "fuego",
        golpe: "Zarpazo plateado", fuerte: "Picado", especial: { tipo: "coraza", nombre: "Plata maciza" }, talla: 96,
        texto: "Vigila los tesoros desde el techo. Lo que más teme es que alguien se los lleve, y lo que más desea, que alguien los mire.",
    },
    "mi-libro": {
        nombre: "Libro de cuentas", genero: "m", zona: "tesoreria", debil: "fuego", resiste: "hielo",
        golpe: "Mordida de tinta", fuerte: "Deuda impagable", especial: { tipo: "reflejo", nombre: "Cuentas claras" }, talla: 84, vuela: true,
        texto: "Anota todo lo que debes, y también lo que te deben. Siempre sale que debes más.",
    },
    "mi-centinela": {
        nombre: "Centinela de oro", genero: "m", zona: "tesoreria", debil: "rayo", resiste: "hielo",
        golpe: "Alabarda", fuerte: "Guardia impenetrable", especial: { tipo: "barrera", nombre: "Muro de monedas" }, talla: 108,
        texto: "Una armadura rellena de monedas. Cuando cae, tintinea durante un buen rato.",
    },
    "mi-rey": {
        nombre: "El Rey Avaro", genero: "m", zona: "tesoreria", guardian: true, debil: "fuego", resiste: "hielo",
        fase: { debil: "rayo", resiste: "fuego", nombre: "Sin corona" },
        golpe: "Cetro de oro", fuerte: "Todo es mío", especial: { tipo: "drenar", nombre: "Cobrar tributo" }, talla: 128,
        texto: "Guardián de la Tesorería. Lo juntó todo y descubrió que no podía llevarse nada a ninguna parte. Por eso no deja que nadie lo intente.",
    },

    // --- Pasillos de espejos ---
    "la-espejo": {
        nombre: "Espejo errante", genero: "m", zona: "pasillos", debil: "rayo", resiste: "hielo",
        golpe: "Esquirla", fuerte: "Destello", especial: { tipo: "reflejo", nombre: "Rebote" }, talla: 82, vuela: true,
        texto: "Se pasea por los pasillos devolviendo lo que le muestran. No tiene nada propio, salvo las ganas de que no lo mires.",
    },
    "la-sombra": {
        nombre: "Sombra del pasillo", genero: "f", zona: "pasillos", debil: "fuego", resiste: "rayo",
        golpe: "Roce frío", fuerte: "Lamento", especial: { tipo: "sellar", nombre: "Susurro" }, talla: 90, vuela: true,
        texto: "Es lo que queda de quien se miró demasiado tiempo en un espejo, esperando que le dijera algo distinto.",
    },
    "la-murcielago": {
        nombre: "Murciélago de eco", genero: "m", zona: "pasillos", debil: "rayo", resiste: null,
        golpe: "Mordisco", fuerte: "Grito agudo", especial: { tipo: "drenar", nombre: "Chillido que roba" }, talla: 76, vuela: true,
        texto: "Ve por el sonido. Por eso aquí, donde todo suena distinto a como es, está siempre desorientado y furioso.",
    },
    "la-arana": {
        nombre: "Araña de cristal", genero: "f", zona: "pasillos", debil: "fuego", resiste: "hielo",
        golpe: "Picada fina", fuerte: "Lluvia de esquirlas", especial: { tipo: "veneno", nombre: "Tela de espejo" }, talla: 86,
        texto: "Su tela es tan clara que no se ve. Lo único que se ve es a ti mismo, atrapado en ella.",
    },
    "la-gemelo": {
        nombre: "El Gemelo", genero: "m", zona: "pasillos", guardian: true, debil: "fuego", resiste: "rayo",
        golpe: "Tu mismo tajo", fuerte: "Tu mejor tajo", especial: { tipo: "reflejo", nombre: "Tu propio golpe" }, talla: 112,
        texto: "Guardián de los pasillos. Pelea con tus mismos movimientos, un instante después. Si dudas, él duda; si avanzas, avanza.",
    },

    // --- Cámara de los Ecos ---
    "la-ojo": {
        nombre: "Ojo del eco", genero: "m", zona: "ecos", debil: "hielo", resiste: "rayo",
        golpe: "Mirada repetida", fuerte: "Rayo doble", especial: { tipo: "carga", nombre: "Segunda mirada" }, talla: 84, vuela: true,
        texto: "Mira todo dos veces: la primera ve lo que hay, y la segunda, lo que querías que hubiera.",
    },
    "la-hongo": {
        nombre: "Hongo de voz", genero: "m", zona: "ecos", debil: "fuego", resiste: "rayo",
        golpe: "Embestida", fuerte: "Estallido de susurros", especial: { tipo: "sellar", nombre: "Esporas de eco" }, talla: 88,
        texto: "Crece donde alguien dijo algo y se arrepintió. Cada sombrerito es una frase que nunca terminó de salir.",
    },
    "la-aguaviva": {
        nombre: "Aguaviva de sonido", genero: "f", zona: "ecos", debil: "rayo", resiste: "hielo",
        golpe: "Roce vibrante", fuerte: "Descarga de ecos", especial: { tipo: "veneno", nombre: "Eco urticante" }, talla: 84, vuela: true,
        texto: "Flota por el aire entre lo que se dice y lo que se oye. Pica con palabras de otros.",
    },
    "la-acolito": {
        nombre: "Acólito del eco", genero: "m", zona: "ecos", debil: "rayo", resiste: "fuego",
        golpe: "Daga ritual", fuerte: "Repetir en voz baja", especial: { tipo: "barrera", nombre: "Murmullo" }, talla: 92,
        texto: "Repite en voz baja todo lo que oye. Con los años perdió su voz propia, y ya no sabe si lo que dice es suyo.",
    },
    "la-coro": {
        nombre: "Coro de la Voz Hueca", genero: "m", zona: "ecos", guardian: true, debil: "rayo", resiste: "hielo",
        golpe: "Nota desafinada", fuerte: "Gran coro", especial: { tipo: "carga", nombre: "Gran coro" }, talla: 116,
        texto: "Guardián de la Cámara. No es una voz: son todas las que se perdieron, cantando la misma nota hueca.",
    },

    // --- Salón del Silencio ---
    "la-mudo": {
        nombre: "Mudo", genero: "m", zona: "silencio", debil: "fuego", resiste: "hielo",
        golpe: "Manotazo", fuerte: "Abrazo callado", especial: { tipo: "sellar", nombre: "Silencio" }, talla: 92,
        texto: "Intentó gritar tantas veces sin que nadie lo oyera que un día dejó de intentarlo.",
    },
    "la-can": {
        nombre: "Can sin ladrido", genero: "m", zona: "silencio", debil: "fuego", resiste: "rayo",
        golpe: "Dentellada", fuerte: "Desgarro", especial: { tipo: "drenar", nombre: "Mordida muda" }, talla: 88,
        texto: "Nunca ladra. Por eso nadie lo ve venir, y cuando lo notan ya es tarde.",
    },
    "la-sacerdotisa": {
        nombre: "Sacerdotisa callada", genero: "f", zona: "silencio", debil: "rayo", resiste: "fuego",
        golpe: "Toque pálido", fuerte: "Letanía muda", especial: { tipo: "coraza", nombre: "Voto de silencio" }, talla: 100,
        texto: "Juró no volver a decir nada que no estuviera segura de poder cumplir. Lleva siglos sin decir una palabra.",
    },
    "la-gusano": {
        nombre: "Gusano del vacío", genero: "m", zona: "silencio", debil: "hielo", resiste: "fuego",
        golpe: "Mordida", fuerte: "Embestida ciega", especial: { tipo: "veneno", nombre: "Quietud" }, talla: 90,
        texto: "Se come lo que se deja sin decir. Está muy, muy gordo.",
    },
    "la-silencio": {
        nombre: "El Gran Silencio", genero: "m", zona: "silencio", guardian: true, debil: "fuego", resiste: "rayo",
        fase: { debil: "rayo", resiste: "fuego", nombre: "Sin eco" },
        golpe: "Quietud", fuerte: "Lo no dicho", especial: { tipo: "sellar", nombre: "Silencio total" }, talla: 124,
        texto: "Guardián del Salón. No hace ruido ni lo necesita: su peso es todo lo que nunca se dijo en voz alta.",
    },

    // ===== La Fragua Profunda (las ids empiezan con «fa-») =====
    // --- Hornos fríos ---
    "fa-murcielago": {
        nombre: "Murciélago de hollín", genero: "m", zona: "hornos", debil: "hielo", resiste: null,
        golpe: "Aleteo ceniciento", fuerte: "Nube de hollín", talla: 76, vuela: true,
        texto: "Duerme colgado de las bocas de los hornos. Se despierta con el frío, que es lo que menos esperaba encontrar aquí.",
    },
    "fa-aprendiz": {
        nombre: "Aprendiz de fuelle", genero: "m", zona: "hornos", debil: "hielo", resiste: "fuego",
        golpe: "Pinza", fuerte: "Golpe de fuelle", especial: { tipo: "sellar", nombre: "Humo en los ojos" }, talla: 94,
        texto: "Sigue moviendo el fuelle aunque ya no queda fuego. Nadie le dijo que podía parar.",
    },
    "fa-escoria": {
        nombre: "Escoria viva", genero: "f", zona: "hornos", debil: "hielo", resiste: "fuego",
        golpe: "Salpicadura al rojo", fuerte: "Colada", especial: { tipo: "veneno", nombre: "Humo de forja" }, talla: 86,
        texto: "Es lo que sobra cuando el metal se limpia. Se juntó con tanto descarte que un día se puso en pie.",
    },
    "fa-escorpion": {
        nombre: "Escorpión de brasa", genero: "m", zona: "hornos", debil: "hielo", resiste: "fuego",
        golpe: "Aguijón candente", fuerte: "Pinza al rojo", especial: { tipo: "coraza", nombre: "Caparazón de hierro" }, talla: 90,
        texto: "Nació entre las cenizas tibias de una colada. Todo su cuerpo está caliente menos la cola.",
    },
    "fa-capataz": {
        nombre: "Capataz del fuelle", genero: "m", zona: "hornos", guardian: true, debil: "hielo", resiste: "fuego",
        golpe: "Tenaza", fuerte: "Mazazo de turno", especial: { tipo: "carga", nombre: "Soplo al máximo" }, talla: 112,
        texto: "Guardián de los hornos. Lleva cien años dando órdenes a un fuego que se apagó hace noventa y nueve.",
    },

    // --- El yunque ---
    "fa-chispa": {
        nombre: "Espíritu de la chispa", genero: "m", zona: "yunque", debil: "hielo", resiste: "fuego",
        golpe: "Chispazo", fuerte: "Lluvia de chispas", especial: { tipo: "reflejo", nombre: "Destello" }, talla: 88, vuela: true,
        texto: "Salta del yunque con cada golpe y ya no encuentra por dónde volver. Brilla un instante y se vuelve a encender.",
    },
    "fa-molde": {
        nombre: "Molde hueco", genero: "m", zona: "yunque", debil: "rayo", resiste: "fuego",
        golpe: "Embestida", fuerte: "Aplastar", especial: { tipo: "barrera", nombre: "Cáscara de arena" }, talla: 100,
        texto: "Una pieza que nunca llegó a rellenarse. Camina buscando el metal que le falta para ser algo.",
    },
    "fa-gargola": {
        nombre: "Gárgola de hierro", genero: "f", zona: "yunque", debil: "rayo", resiste: "fuego",
        golpe: "Zarpazo de hierro", fuerte: "Picado", especial: { tipo: "coraza", nombre: "Hierro colado" }, talla: 94,
        texto: "La colocaron para vigilar la fragua desde el techo. Con los años se olvidó de qué.",
    },
    "fa-brasa": {
        nombre: "Brasa mayor", genero: "f", zona: "yunque", debil: "hielo", resiste: "fuego",
        golpe: "Llamarada", fuerte: "Estallido", especial: { tipo: "carga", nombre: "Rojo vivo" }, talla: 84, vuela: true,
        texto: "La última brasa de un horno enorme. No quiere apagarse, y por eso se volvió peligrosa.",
    },
    "fa-coloso": {
        nombre: "Coloso del yunque", genero: "m", zona: "yunque", guardian: true, debil: "rayo", resiste: "fuego",
        golpe: "Martillazo", fuerte: "Derrumbe", especial: { tipo: "carga", nombre: "Alzar el martillo" }, talla: 124,
        texto: "Guardián del yunque. Lo forjaron para golpear sin cansarse y eso es lo único que sabe hacer.",
    },

    // --- El corazón de la Fragua ---
    "fa-sombra": {
        nombre: "Sombra del herrero", genero: "f", zona: "corazon", debil: "rayo", resiste: "hielo",
        golpe: "Toque de ceniza", fuerte: "Vacío", especial: { tipo: "sellar", nombre: "Sin respiro" }, talla: 92, vuela: true,
        texto: "Es la sombra de todos los que trabajaron aquí sin parar. Tiene los hombros caídos y no deja de moverse.",
    },
    "fa-acero": {
        nombre: "Acero estelar", genero: "m", zona: "corazon", debil: "fuego", resiste: "rayo",
        golpe: "Esquirla azul", fuerte: "Filo del cielo", especial: { tipo: "reflejo", nombre: "Brillo de acero" }, talla: 84, vuela: true,
        texto: "El metal que cae con las tormentas, trabajado durante cien años. Es tan puro que ya no se deja doblar.",
    },
    "fa-cofre": {
        nombre: "Cofre de carbón", genero: "m", zona: "corazon", debil: "hielo", resiste: "fuego",
        golpe: "Mordisco de tapa", fuerte: "Brasas en la boca", especial: { tipo: "veneno", nombre: "Gas de carbón" }, talla: 90,
        texto: "Guarda el carbón de la última noche. Si lo abres, cuesta más cerrarlo que lo que pesa.",
    },
    "fa-dragon": {
        nombre: "Dragón de brasa", genero: "m", zona: "corazon", debil: "hielo", resiste: "fuego",
        golpe: "Zarpazo", fuerte: "Aliento de forja", especial: { tipo: "carga", nombre: "Soplar la fragua" }, talla: 118,
        texto: "Llegó atraído por el calor y se quedó cuando se acabó. Duerme sobre el yunque más caliente.",
    },
    "fa-brann": {
        nombre: "Brann, el herrero sin descanso", genero: "m", zona: "corazon", guardian: true, debil: "hielo", resiste: "fuego",
        fase: { debil: "rayo", resiste: "hielo", nombre: "Al rojo blanco" },
        golpe: "Martillo", fuerte: "Golpe sin pausa", especial: { tipo: "drenar", nombre: "Un golpe más" }, talla: 124,
        texto: "Forjó las armas de los Vigías y, cuando la Llama se apagó, siguió golpeando: parar era admitir que nadie volvería.",
    },
};

// ===== La historia de cada mazmorra (se lee en 📜 Historia; ver leyendas.js) =====
export const LEYENDAS_NUEVAS = {
    minas: {
        titulo: "El Rey Avaro",
        prologo: {
            titulo: "La grieta dorada",
            parrafos: [
                "En el décimo sótano, entre las raíces, una grieta de la pared deja pasar un brillo que no es de ninguna llama. {n} acerca la antorcha y lo ve: una galería tallada a mano, con rieles oxidados que bajan y no suben.",
                "Aurelio, que conoce todos los pisos de la Torre menos este, se asoma y se queda en silencio. «Las Minas de la Codicia —dice por fin—. Las abrieron los que necesitaban pagar una deuda y cavaron hasta olvidar de quién era. La Sombra del Tesoro vive aquí abajo, entre el oro que no sirvió para nada.»",
                "Antes de que {n} baje, le pone una moneda en la mano. «No es para gastarla. Es para acordarte, allá abajo, de lo poco que pesa lo que de verdad importa.»",
            ],
        },
        zonas: {
            galerias: {
                entrada: "Las vigas crujen. Cada tantos pasos hay una carretilla abandonada, con su pico dentro, como si el que la empujaba hubiera salido un momento y no hubiera vuelto. En la oscuridad, algo cava todavía.",
                caida: "El Capataz de hueso se deshace con un último «turno terminado». Entre sus costillas había un reloj de arena sin una sola gota: llevaba siglos contando un tiempo que no existía. Detrás de él, la galería se abre en una cueva donde el oro corre por las paredes.",
            },
            veta: {
                entrada: "La veta late. Es oro puro, en vetas del grosor de un brazo, y brilla tanto que {n} tiene que entrecerrar los ojos. Cada reflejo promete algo distinto: una casa, un barco, una vida sin preocupaciones. Todos mienten con la misma voz.",
                caida: "El Wyrm de la veta cae sobre su propio oro y por primera vez parece dormir de verdad. Debajo de él no había tesoro: solo un nido vacío y una nota en una letra que {n} no conoce: «Lo guardé tanto que olvidé para quién». Más abajo se oye algo parecido a una risa.",
            },
            tesoreria: {
                entrada: "La Tesorería no tiene techo: tiene monedas. Montañas hasta donde alcanza la vista, tan altas que parecen techo. No hay ni una ventana, ni una puerta de salida, ni un reloj. Quien se queda aquí un día se queda cien años, sin notarlo.",
                caida: "El Rey Avaro se quita la corona. Debajo no hay cabeza, solo otra corona más pequeña, y debajo otra, y otra: toda una vida de acumular sin usar. Cuando cae, todo el oro de la sala se vuelve polvo y el polvo, ceniza. «No me lo podía llevar —murmura—. Pero tampoco podía soltarlo.» Entre la ceniza, {n} encuentra un espejo pequeño.",
            },
        },
        epilogo: {
            titulo: "Lo que pesa el oro",
            parrafos: [
                "{n} sube los quince niveles con las manos vacías y un espejo en el bolsillo. No hay fanfarria. Arriba, al pie de la Torre, Aurelio lo mira y sonríe: «Ahora sabes lo que pesa lo que se junta y no se usa».",
                "«El tesoro nunca fue el oro —dice—: era lo que se podía hacer con él. Y quien no hace nada con lo que tiene, ya lo perdió.» Desde ese día, cuando {n} gasta una moneda en algo que lo hace feliz, recuerda el reloj de arena sin una gota.",
            ],
            aviso: "🏆 Venciste al Rey Avaro. Entre su ceniza había un espejo: quizá lleve a otro lugar.",
        },
    },
    laberinto: {
        titulo: "El Gran Silencio",
        prologo: {
            titulo: "El espejo del décimo nivel",
            parrafos: [
                "En el espejo que dejó el Rey Avaro, {n} no se ve a sí mismo: ve un pasillo. Uno largo, de paredes que son otros espejos, y al fondo, apenas, algo que suena como una voz muy lejana diciendo un nombre.",
                "Aurelio frunce el ceño. «Es el Laberinto de los Ecos. Allí van a parar las voces que se pierden: lo que nadie se atrevió a decir, lo que se dijo y no se escuchó. Cuando la Sombra de la Voz les quitó la voz a los de la aldea, todo lo que callaron tuvo que ir a algún sitio.»",
                "«Es lo más difícil de todo lo que has hecho —añade—. Porque aquí no te pelea nadie más que tú mismo. Y tú te conoces muy bien.»",
            ],
        },
        zonas: {
            pasillos: {
                entrada: "Cada pared es un espejo, y cada espejo muestra un {n} distinto: uno más fuerte, uno más cansado, uno que ya se rindió. Los pasillos giran sin que se note y los pasos suenan más fuertes de lo que deberían.",
                caida: "El Gemelo imita el último golpe de {n}… y se detiene un segundo antes de caer. «Peleas igual que yo», dice con una voz idéntica. «Entonces tampoco vas a rendirte.» Se deshace en cristales que, al caer, forman una escalera hacia una cámara más profunda.",
            },
            ecos: {
                entrada: "Aquí la voz de {n} vuelve cambiada. Dice «voy a subir» y el eco contesta «mañana». Dice «puedo» y el eco, «quizá». Es la cámara de todo lo que uno se dice a sí mismo cuando nadie lo oye.",
                caida: "El Coro de la Voz Hueca canta una última nota, y al terminarla, por un instante, todas las voces son una sola y dicen algo que {n} entiende: «Gracias por escucharnos». Después se quedan en silencio, y el silencio, esta vez, es de descanso.",
            },
            silencio: {
                entrada: "No hay sonido. Ni los pasos, ni la respiración, ni el latido de {n}. Hay cosas que solo se oyen cuando todo calla, y {n} empieza a oírlas: todas las cosas que no ha dicho. Pesan más de lo que esperaba.",
                caida: "El Gran Silencio se deshace despacio, como una nube que se va. Lo que pesaba no era el silencio: era lo no dicho. Y cuando se va, por primera vez en todo el laberinto, {n} oye su propia voz, clara y completa, diciendo en voz alta lo que había callado.",
            },
        },
        epilogo: {
            titulo: "Decirlo en voz alta",
            parrafos: [
                "{n} sale del laberinto con la voz un poco ronca, como quien ha hablado mucho después de años de callar. Aurelio, al pie de la Torre, no pregunta qué pasó. Solo dice: «Ahora entiendes por qué las voces de la aldea importaban».",
                "«Lo que no se dice no desaparece —añade—: se va a algún lugar a esperar. Y cada vez que alguien lo dice, aunque sea tarde, ese lugar se vacía un poco.» Esa noche, por primera vez, {n} le habla a alguien de algo que llevaba mucho tiempo guardando.",
            ],
            aviso: "🏆 Venciste al Gran Silencio. Lo que callaste, por fin, se oyó.",
        },
    },
    fragua: {
        titulo: "El herrero sin descanso",
        prologo: {
            titulo: "El calor que sube del suelo",
            parrafos: [
                "En el piso de la Fragua, debajo del yunque grande, hay una trampilla que ni la ceniza consigue tapar. Sube de ella un aire que quema los ojos y huele a hierro mojado. {n} la abre con el pie y se queda mirando: abajo, muy abajo, hay una luz azul que no calienta.",
                "Aurelio se asoma con la manga sobre la cara. «La Fragua Profunda. Aquí abajo estaban los hornos de verdad: los de arriba son solo el escaparate. Brann, el herrero, forjó aquí las armas de los Vigías, y cuando la Llama se apagó no dejó de golpear. Cien años. Si paraba, tenía que aceptar que nadie volvería.»",
                "«No todo el mundo aguanta ese calor —añade—. Hace falta un cuerpo entrenado, de los que no se rinden a mitad de la escalera. Pero ojo, {n}: el que no descansa también se pierde. Baja con el cuerpo fuerte y la cabeza tranquila. Y si ves a Brann, no le hables de fuerza: dile que puede sentarse.»",
            ],
        },
        zonas: {
            hornos: {
                entrada: "Los hornos están fríos, pero el aire pesa: huele a ceniza vieja y a hierro mojado. En cada boca cuelga una herramienta, lista para una mano que no llega. En algún sitio, sin motivo, un fuelle sigue soplando donde ya no queda fuego.",
                caida: "El Capataz del fuelle suelta la tenaza y, por primera vez, el fuelle deja de soplar. En el silencio se oye lo que tapaba: golpes lejanos, regulares, de un martillo que lleva demasiado tiempo golpeando el mismo sitio.",
            },
            yunque: {
                entrada: "El yunque es del tamaño de una casa, y de él saltan chispas que no llegan al suelo: se quedan colgadas en el aire como estrellas pequeñas. Cada golpe lejano hace temblar las paredes. Las criaturas de aquí no nacieron: las forjaron, y todavía llevan la marca del molde.",
                caida: "El Coloso del yunque se desarma pieza a pieza, y cada una, al caer, suena como una campana. Debajo no había nada que proteger: solo un yunque agrietado. El martillo golpeó tantas veces el mismo punto que acabó partiendo lo que quería forjar. Hay golpes que, de tanto repetirse sin pausa, rompen.",
            },
            corazon: {
                entrada: "En el corazón de la Fragua arde una llama azul que no calienta. Es el acero que cae del cielo con las tormentas, trabajado durante cien años sin una pausa. En el centro, un hombre enorme, de manos negras, golpea y golpea sin levantar la vista. No parece enfadado: parece que ya no sabe hacer otra cosa.",
                caida: "Brann deja el martillo. Le tiemblan las manos: nadie le había dicho en cien años que podía parar. «Pensé que si dejaba de golpear tendría que aceptar que no volvían», dice con una voz cansadísima. {n} no discute: le acerca un banco. Brann se sienta. Y el fuego de la Fragua, que llevaba cien años encendido a la fuerza, se apaga como se apagan los fuegos cuando por fin ya no hacen falta.",
            },
        },
        epilogo: {
            titulo: "Descansar también es forjar",
            parrafos: [
                "{n} sube los quince hornos con las manos negras de hollín y el cuerpo agotado, pero con la cabeza clara. Arriba, junto al yunque, Aurelio lo espera con un cuenco de agua. «¿Te dijo algo Brann?» «Que parar no era rendirse», responde {n}. «Que nunca se lo había dicho nadie.»",
                "Aurelio se queda un rato en silencio. «Hay dos maneras de perderse, {n}. Una es parar sin fecha de vuelta, como Orrin. La otra es no parar nunca, como Brann. Las dos se parecen más de lo que creemos: en las dos, uno deja de elegir.» Mira el fuego apagado. «El camino está en medio: golpear, descansar, y volver a golpear.»",
                "Desde ese día, cuando {n} termina de entrenar y se sienta a descansar, no lo hace con culpa. Lo hace como quien enfría el acero en el agua: con la certeza de que sin ese descanso, lo forjado se rompe.",
            ],
            aviso: "🏆 Venciste a Brann. La Fragua Profunda descansa, y tú también puedes hacerlo.",
        },
    },
};

// ===== Las cinemáticas (ver cinematicas.js): la entrada, la caída y el cartel de cada zona =====
export const CINE_NUEVAS = {
    ENTRADA: {
        galerias: "Las vigas crujen. Al fondo, alguien sigue cavando donde ya no hay nada.",
        veta: "El oro corre por las paredes y brilla tanto que cuesta seguir mirando.",
        tesoreria: "No hay techo: hay monedas. Y sentado entre ellas, alguien que no se levanta hace siglos.",
        pasillos: "Cada pared devuelve un rostro. Uno de ellos se mueve antes que tú.",
        ecos: "Dices una palabra y el eco contesta otra. No es la que tú dijiste.",
        silencio: "Ni siquiera tu corazón suena. Algo inmenso, quieto, espera.",
        hornos: "Los hornos están fríos y, aun así, un fuelle sigue soplando en la oscuridad.",
        yunque: "Chispas que no caen. Un golpe lejano que no se detiene.",
        corazon: "Una llama azul que no calienta, y un herrero que lleva cien años sin levantar la vista.",
    },
    DERROTA: {
        galerias: "El Capataz suelta su látigo: el turno, por fin, ha terminado.",
        veta: "El Wyrm cae sobre su oro y, por primera vez, duerme de verdad.",
        tesoreria: "La corona rueda. Debajo de ella hay otra, y otra: toda una vida de guardar.",
        pasillos: "El Gemelo se rompe en mil espejos, y en cada uno {n} sigue de pie.",
        ecos: "El coro canta una última nota y, al fin, todas las voces son una.",
        silencio: "El Silencio se va como una nube. Y {n} oye su propia voz.",
        hornos: "El Capataz suelta la tenaza: el fuelle, por fin, se calla.",
        yunque: "El Coloso se desarma: de tanto golpear el mismo punto, rompió el yunque.",
        corazon: "Brann deja el martillo. Nadie le había dicho que podía parar.",
    },
    SUBTITULO: {
        galerias: "Donde se cavó sin saber para qué",
        veta: "El oro que no sirvió de nada",
        tesoreria: "Lo que se junta y no se usa",
        pasillos: "Una versión de ti en cada pared",
        ecos: "Lo que dijiste y volvió cambiado",
        silencio: "Todo lo que nunca se dijo",
        hornos: "Un fuego que se apagó y nadie avisó",
        yunque: "Golpear sin pausa, golpear sin rumbo",
        corazon: "El que no descansó nunca",
    },
    // El final de cada mazmorra (las tomas de la última cinemática).
    FINAL: {
        minas: [
            "El Rey Avaro fue el primero que cavó para pagar una deuda. Después ya no recordaba a quién.",
            "Se quita la corona, y debajo hay otra, y otra: toda una vida de guardar sin usar.",
            "Cuando cae, el oro de la Tesorería se vuelve ceniza. Entre ella, un espejo pequeño que {n} se guarda.",
            "Lo que se junta y no se usa, pesa. Lo que se gasta en lo que importa, se queda para siempre.",
        ],
        laberinto: [
            "El Gran Silencio no tiene cara. Es el peso de todo lo que nunca se dijo en voz alta.",
            "{n} da un paso y, por primera vez en el laberinto, oye algo: su propia voz, diciendo lo que callaba.",
            "El Silencio se deshace como una nube. Las voces perdidas, por fin, vuelven a casa.",
            "Lo que no se dice no desaparece: espera. Pero cada vez que alguien lo dice, espera un poco menos.",
        ],
        fragua: [
            "Brann forjó las armas de los Vigías. Cuando la Llama se apagó, siguió golpeando: parar era aceptar que no volverían.",
            "{n} no le gana con fuerza. Le acerca un banco, y Brann, por primera vez en cien años, se sienta.",
            "Con el herrero, se apaga el fuego que ardía a la fuerza. En el yunque agrietado queda una sola marca, la del último golpe.",
            "Orrin paró sin fecha de vuelta; Brann no paró nunca. Entre los dos está el camino: golpear, descansar y volver.",
        ],
    },
};
