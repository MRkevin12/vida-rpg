// novedades.js — Qué hay de nuevo en cada versión.
//
// Después de actualizar, la app muestra una ventana con lo nuevo (una sola vez).
// Al publicar una versión: sube VERSION_APP (igual que VERSION en sw.js) y agrega
// sus cambios arriba de la lista.

export const VERSION_APP = 81;

export const NOVEDADES = [
    {
        version: 81,
        titulo: "Modo foco más completo",
        cambios: [
            "📋 En el modo foco ahora ves lo que hiciste la última vez en ese ejercicio y, cuando llegaste al tope de repeticiones, un botón «⬆️ Subir a X kg» que sube el peso de la serie de un toque.",
            "⏱️ Durante el descanso puedes acortarlo o alargarlo de 15 en 15 segundos.",
        ],
    },
    {
        version: 80,
        titulo: "El bombeo",
        cambios: [
            "💪 El día que entrenas, tu héroe está «bombeado»: +10 % de vida y de ataque en la Torre y en las mazmorras hasta mañana (se suma al bono de tu nivel de gym). Lo ves en la tarjeta de la Torre.",
            "👆 En el modo foco puedes contar las repeticiones tocando un botón grande: cada toque suma una (con un tic y una vibración) y, al llegar al máximo del rango, suena un destello.",
        ],
    },
    {
        version: 79,
        titulo: "Tu evolución y el reto de Aurelio",
        cambios: [
            "📸 «Tu evolución»: una tira con tu cuerpo (en calzoncillos, con tu peso de entonces) cada vez que tu físico subió de escalón, hasta hoy. Así ves cómo vas cambiando.",
            "🧙 Cada día, un consejo de Aurelio sobre entrenamiento, descanso o constancia. Y cada lunes te propone un reto de la semana (cumplir tu meta, romper 2 récords, mover 6 000 kg o trabajar 4 músculos distintos); al cumplirlo cobras +25 💎 y +30 XP, una vez por semana.",
            "🎖️ Cinco hitos nuevos de gym: 25 sesiones, constancia de acero (8 semanas), 25 récords, 250 toneladas y nivel 15.",
        ],
    },
    {
        version: 78,
        titulo: "Modo foco en el gimnasio",
        cambios: [
            "🎯 Nuevo modo foco al entrenar: una serie a la vez, con letras y botones grandes (pensado para usarlo con las manos sudadas). Ves la figura haciendo el ejercicio, el número de serie, y subes o bajas el peso (de 2,5 en 2,5 kg) y las repeticiones con grandes botones + y −. Un botón enorme dice «✅ Terminé la serie».",
            "⏳ Entre serie y serie sale un anillo de descanso que se va vaciando, con lo que viene después y las palabras de Aurelio. Puedes empezar la siguiente ya, o saltar el descanso.",
            "📋 Si prefieres ver todos los ejercicios juntos, hay un botón para volver a la lista (y otro para volver al modo foco).",
        ],
    },
    {
        version: 77,
        titulo: "Cada ejercicio, en movimiento",
        cambios: [
            "🎬 En el entrenamiento, cada ejercicio trae una figura animada que hace el movimiento (press de banca, curl, sentadilla, jalón, remo, peso muerto, elevaciones laterales, talones, abdominales y más) con tu color de piel y de pelo. La del ejercicio que te toca ahora se mueve; las demás esperan quietas.",
            "✨ El ejercicio actual se resalta con un borde dorado. Si tu iPhone tiene activado «Reducir movimiento», las figuras se quedan quietas.",
        ],
    },
    {
        version: 76,
        titulo: "Entrenar en el gimnasio",
        cambios: [
            "🏋️ Tu avatar es mucho más grande en la pestaña del Gimnasio y está dentro de un gimnasio de verdad: rack con la barra y los discos, espejo grande, pesas rusas y colchoneta. Se ve mejor cómo vas mejorando.",
            "🧙 Aurelio te acompaña mientras entrenas: te recibe al empezar y entre serie y serie te dice algo según el momento (primera serie, mitad del entrenamiento, ejercicio terminado, última serie, ¡marca nueva!). Al terminar te despide con unas palabras.",
            "⏱️ Mientras entrenas ves cuánto llevas: el reloj del entrenamiento, los kilos movidos y las series hechas. Cada ejercicio trae un consejo de técnica, el golpe de una pesa suena y vibra al marcar la serie, y al terminar el descanso suena una campana.",
            "🔥 Puedes marcar el calentamiento (+10 XP) y, al terminar, ves un resumen: minutos, series, kilos, XP, récords y los músculos que trabajaste.",
        ],
    },
    {
        version: 75,
        titulo: "Vista previa de tu cuerpo",
        cambios: [
            "👀 En la pestaña del Gimnasio, bajo tu avatar, hay una «Vista previa»: elige un nivel de físico (1, 3, 6, 10, 15 o 22) y un peso (delgado, normal, con peso o mucho peso) para ver cómo se vería tu cuerpo. No cambia tus datos reales y puedes volver a tu cuerpo con un botón.",
            "💪 Los últimos niveles de físico se notan más: más hombros, brazos y piernas en el nivel 15 y, sobre todo, en el 22 (Titán).",
        ],
    },
    {
        version: 74,
        titulo: "El gimnasio: tu cuerpo y tu constancia",
        cambios: [
            "🎯 El gimnasio ahora es una meta que se marca: en la pestaña del Gimnasio (y en Hoy) hay un botón «✅ Marcar que hoy entrené». Cuenta para tu meta de la semana, da XP y marca tu misión elegida; anotar las series con detalle sigue ahí, como opción. Los Ajustes del gym no cambian.",
            "⚖️ Altura, peso e IMC: anota tu altura y tu peso y la app calcula tu IMC con su escala de colores y el rango de peso normal para tu altura.",
            "🩳 Tu avatar sin ropa (en calzoncillos) en la pestaña del Gimnasio: se ve más ancho o más delgado según tu peso, y a medida que subes de nivel de gym se marcan el pecho, los hombros, los bíceps, el abdomen y las piernas (6 niveles de físico). Tu héroe también se ve más fornido en el resto de la app.",
            "🛡️ Armadura por constancia: cumple tu meta de días por semana varias semanas seguidas y ganas piezas legendarias: Cinta de hierro (2 semanas), Peto del constante (4), Coraza del Titán (8) y Capa de la Fragua (12). Traen habilidades nuevas para la Torre: Vigor, Ritmo, Titán y Brasa.",
        ],
    },
    {
        version: 73,
        titulo: "La Fragua Profunda",
        cambios: [
            "⚒️ Una quinta mazmorra, la Fragua Profunda: 15 hornos en 3 zonas, bajo el piso de la Fragua de la Torre, donde Brann forjó las armas de los Vigías y no volvió a parar. Da XP de Fuerza, sus 15 criaturas (con dibujo, voz y ficha en el bestiario; ahora 95) resisten el fuego y casi todas se cubren o se cargan, y su guardián final tiene una segunda forma. Trae su propia historia, cinemáticas y final.",
            "🏋️ Se abre con tu cuerpo: al llegar al nivel 5 de gimnasio, o bajando 10 cámaras del Laberinto de los Ecos. Al entrenar, la app te avisa cuando se abre.",
            "📜 Cuando subes al nivel de gym que abre una lectura de la Fragua, Maren te avisa. Además, en el Gimnasio suena «Marte», de Holst, para levantar hierro.",
        ],
    },
    {
        version: 72,
        titulo: "Aurelio y el gimnasio",
        cambios: [
            "🧙 El Maestro Aurelio ahora sabe de tu gimnasio: celebra el día que rompes una marca y, si llevas 3 días o más sin entrenar, te recuerda qué rutina toca. Si le preguntas «¿Cómo voy?», también te cuenta tu nivel de gym y tus días de la semana.",
            "🟥 Nueva tarjeta «Tu constancia» en el Gimnasio: un cuadrito por día de las últimas 12 semanas, para ver tu regularidad de un vistazo.",
        ],
    },
    {
        version: 71,
        titulo: "Reacciones elementales",
        cambios: [
            "🔥❄️⚡ Si lanzas dos hechizos DISTINTOS en turnos seguidos, el segundo provoca una reacción: ♨️ Vapor (fuego + hielo: +30 % de daño y su próximo golpe pega menos), 🌩️ Conducción (hielo + rayo: +15 % y la criatura pierde su turno; los guardianes la resisten) y 💥 Explosión (fuego + rayo: +40 % y rompe su barrera y su coraza).",
            "El menú de Magia te avisa qué hechizo provocaría una reacción en ese momento, y en la escena aparece el nombre de la reacción sobre la criatura.",
        ],
    },
    {
        version: 70,
        titulo: "La linterna de Orrin",
        cambios: [
            "📖 Un segundo libro largo en Héroe › Historia: «La linterna de Orrin», escrito por Marta, una de los doce primeros Vigías. Cuenta quién fue Orrin, el de la risa que se oía desde la cantera, cómo el mejor de los doce se quedó abajo con un «solo un día» sin fecha de vuelta, cómo de su vacío nacieron las Cuatro Sombras y qué pasó cuando Marta bajó a buscarlo. 18 capítulos en 3 libros (unos 35 minutos de lectura), con su escena final y su premio.",
            "🔓 Los dos primeros libros se abren al llegar al sótano 5 de la Mazmorra; el tercero, al superar el sótano 10 (el Rey Hueco).",
            "🏋️ Tu ficha de Héroe tiene un acceso al Gimnasio con tu nivel de gym, y el resumen de tu semana cuenta tus días de entrenamiento.",
        ],
    },
    {
        version: 69,
        titulo: "La Fragua",
        cambios: [
            "📜 Lecturas de la Fragua: siete textos de Maren, la herrera, para quien entrena (el primer día, el descanso, subir de a poco, cuando la barra no sube, el dolor, la constancia y para qué sirve la fuerza). Se abren al subir de nivel de gym, en la pantalla del Gimnasio.",
            "➕ Ejercicios extra: dentro de un entrenamiento puedes sumar dominadas, sentadilla, hip thrust, abdominales y 14 más. Cuentan igual (XP, récords y gráficas). Hay dos músculos nuevos: Glúteos y Abdomen.",
            "🏋️ En la tarjeta de la Torre ves cuánta vida y ataque extra te da tu nivel de gym.",
        ],
    },
    {
        version: 68,
        titulo: "Más gimnasio",
        cambios: [
            "📈 Cada ejercicio tiene su gráfica de progreso (en tus récords y dentro del entrenamiento), para ver cómo sube tu fuerza sesión a sesión.",
            "⚖️ Peso corporal: anótalo cuando quieras y mira su gráfica y cuánto has cambiado.",
            "✅ En Ajustes del gym puedes elegir una misión diaria (por ejemplo «Ir al gym») y se marca sola al terminar un entrenamiento: no la anotas dos veces.",
        ],
    },
    {
        version: 67,
        titulo: "Ataques que se ven",
        cambios: [
            "👾 Las criaturas ya no solo embisten: cada una ataca a su manera. Zarpazos de garras, tajos de acero, mordidas que se cierran, escupitajos que viajan hasta ti, aguijones, volutas de espectro, bolas de fuego que estallan, rayos de sus ojos, esquirlas de cristal, ráfagas de viento y golpes pesados con onda de choque.",
            "💥 Los golpes fuertes y las descargas se ven más grandes (y a veces sacuden la escena). Si esquivas, el ataque pasa de largo o cae a tu lado.",
        ],
    },
    {
        version: 66,
        titulo: "El Gimnasio",
        cambios: [
            "🏋️ Tu rutina real de gym dentro del juego: Pecho + Tríceps, Hombros, Isquiosurales, Espalda, Bíceps, Cuádriceps y Pantorrilla, con sus ejercicios, series y repeticiones. En Hoy ves cuál toca y la app te lleva al entrenamiento.",
            "📝 Anotas el peso y las repeticiones de cada serie (ya vienen llenos con lo de la última vez), marcas ✓ y empieza el descanso con cuenta atrás, sonido y vibración. La app te dice cómo superarte: una repetición más, o subir el peso al llegar al tope.",
            "💪 Cada serie da XP de Fuerza; terminar da monedas; superar tu marca da XP extra (📈 récords personales). Tus 8 músculos suben de nivel por separado y el nivel de gym le da a tu héroe hasta +25 % de vida y ataque en la Torre y las mazmorras. Tu avatar se ve más fornido al subir de nivel.",
            "🔥 Meta de días por semana, racha de semanas, historial de sesiones y 12 hitos con gemas. Si se te olvidó anotar ayer, puedes registrarlo.",
        ],
    },
    {
        version: 65,
        titulo: "Modos de juego",
        cambios: [
            "👑 Asalto de guardianes: solo guardianes, uno tras otro (piso 5, 10, 15…). Entre uno y otro recuperas 30 % de vida y eliges una mejora. Se abre al superar el piso 5 y tiene su propio récord (guardianes vencidos). Premio ×0,8.",
            "📅 Reto diario: el mismo reto para todo el día (misma marca y mismo azar). Si superas 8 pisos, ganas 30 💎 y 20 XP extra, una vez al día.",
            "📖 En cada tarjeta, las reglas largas están plegadas en «Cómo se juega y qué llevas» y el modo se elige antes de empezar.",
        ],
    },
    {
        version: 64,
        titulo: "Dos mazmorras nuevas",
        cambios: [
            "⛏️ Las Minas de la Codicia: 15 niveles en 3 zonas (Galerías olvidadas, La veta dorada y la Tesorería del Rey Avaro). Se abren al bajar 10 sótanos de la Mazmorra del Abismo. Dan XP de Riqueza y las criaturas casi todas traen un truco (barreras, coraza, venenos, reflejos). El Rey Avaro cambia de punto débil a media vida.",
            "🌀 El Laberinto de los Ecos: 15 cámaras en 3 zonas (Pasillos de espejos, Cámara de los Ecos y Salón del Silencio). Se abre al bajar 10 niveles de las Minas. Da XP de Intelecto y es lo más difícil del juego. Ahí fueron a parar las voces que la aldea perdió.",
            "👾 30 criaturas nuevas, con su dibujo, su voz y su ficha en el bestiario (ahora 80); salas con sus propios colores, historia por zona (📜 Historia), cinemáticas y música propias. Tienen su propio récord, marcas y premios.",
        ],
    },
    {
        version: 63,
        titulo: "Habilidades a la vista",
        cambios: [
            "🎖️ En la batalla, cada vez que una habilidad de tu equipo o un don se nota en un golpe, aparece su etiqueta dorada junto a tu héroe con su nombre (Ímpetu, Embestida, Firme, Aurora, Bastión, Sombra, Escamas…), con un destello de sonido. También salen sus iconos en la secuencia del turno.",
            "📋 Debajo de los comandos hay un panel «Habilidades y técnicas»: tus habilidades pasivas, tus dones y tus técnicas, cada una con lo que hace.",
            "✨ Cada técnica tiene su propio efecto: Quebrar agrieta el suelo, Analizar pasa una línea de luz con una lupa, Intimidar lanza ondas oscuras y Golpe certero cierra una mira dorada.",
        ],
    },
    {
        version: 62,
        titulo: "Un libro nuevo: El Centinela",
        cambios: [
            "📖 En Héroe › Historia hay un libro largo: «El Centinela», la vida de Casio, el último Vigía, contada por Aurelio. Son 3 libros y 24 capítulos (unas 12 000 palabras, más de una hora de lectura): su infancia junto al río, su hermana Isa, la Biblioteca y la Fragua, el muchacho de la plaza, el huevo de Ceniza, la noche de la tormenta y los cien años que pasó de guardia en el piso 19.",
            "Cada capítulo termina con lo que Casio aprendió. El libro se abre en la portada, recuerda por dónde vas («Continuar») y tiene un índice. Mientras lees suena la música de Lectura.",
            "Los dos primeros libros se pueden leer desde ya. El tercero (la guardia y el final) se abre cuando liberes a Casio en la Torre (supera el piso 20). Al terminarlo hay una escena y un premio: +40 XP y +20 💎.",
        ],
    },
    {
        version: 61,
        titulo: "Gira el teléfono",
        cambios: [
            "📱 Si giras el teléfono, las partes de juego aprovechan el ancho: la batalla de la Torre y la Mazmorra muestra la escena grande a la izquierda y el orden, el mensaje y los comandos a la derecha; el botín y las rutas son una fila de tarjetas.",
            "🎬 Las cinemáticas se ven en pantalla ancha (16:9), el mapa del reino se parte en dos columnas (el mapa y la información) y los minijuegos del arcade usan todo el lienzo.",
            "Todo lo demás (Hoy, el diario, la tienda…) sigue en vertical. Un iPhone no deja bloquear la orientación a una app instalada: tú decides cuándo girar.",
        ],
    },
    {
        version: 60,
        titulo: "La Torre, más clara y con más impacto",
        cambios: [
            "❤️ En la batalla ves la vida de los dos encima de la escena, con un trozo claro que muestra lo que se perdió en el golpe. Los estados (élite ⭐, coraza 🐚, barrera 💠, espejo 🪞, carga 🌀, veneno ☠️) van como iconos junto a la vida.",
            "🔢 Arriba a la derecha está el orden del turno con las caras de cada uno: tú «Ahora», los demás «Luego». Después de actuar, cada cara se enciende en su momento.",
            "⚠️ Lo que va a hacer la criatura sale en un globo: amarillo si es raro y rojo si es peligroso (golpe fuerte o ataque especial).",
            "⚔️ Los golpes tienen impacto: un arco blanco al atacar, dorado y con «¡CRÍTICO!» en los críticos, y uno enorme con destello en el Golpe de Voluntad. Al vencer aparece «¡Victoria!» antes del botín.",
            "🃏 El botín ahora son tarjetas, con icono, efecto y su tipo (ofensiva, defensiva, mágica o táctica). Los dones raros brillan en dorado.",
            "🔀 Nuevo: en el 2.º piso de cada zona el camino se bifurca. «Camino del desafío»: una criatura de élite que deja un don seguro y +1 poción. «Sendero tranquilo»: te curas y la criatura llega cansada.",
            "🔧 Arreglado: en el botín, «Don raro» se encimaba con el nombre de la mejora.",
        ],
    },
    {
        version: 59,
        titulo: "La música te sigue",
        cambios: [
            "🎵 La música cambia sola según dónde estés: Lectura al leer pergaminos, memorias y el libro; Nocturno en el diario; Alba en el mapa y la aldea; Abismo en la Mazmorra. Ahora las pistas nuevas se bajan en segundo plano, para que el cambio sea inmediato.",
            "En Ajustes ves qué pista suena en la pantalla donde estás. Si no cambia sola, revisa que «Música» y «Música según la escena» estén encendidas.",
        ],
    },
    {
        version: 58,
        titulo: "Más música, voces y turnos claros",
        cambios: [
            "🎼 Cuatro pistas nuevas: «Lectura» (Gymnopédie n.º 1, de Satie), «Alba» (la mañana de Grieg), «Nocturno» (Chopin) y «Abismo» (Mussorgsky). Con «Música según la escena» (Ajustes), suena Lectura al leer pergaminos, memorias y el libro, Nocturno en el diario, Alba en el mapa y la aldea, y Abismo en la Mazmorra.",
            "🔊 Cada criatura de la Torre y la Mazmorra tiene su voz: se oye al aparecer, al atacar, cuando le pegas y cuando cae. Tu espada, tus pociones y tu mascota (el dragón ruge, el cuervo grazna, el búho ulula…) también suenan.",
            "⚡ Los ataques especiales se ven y se oyen: un banner con su nombre y lo que hacen, y un efecto distinto para el veneno, el drenaje, el sello, la coraza, la barrera, la carga, el espejo y la descarga (que sacude la pantalla).",
            "🔢 La batalla muestra la secuencia del turno: 1 Tú → 2 tu mascota → 3 la criatura → 4 el fin del turno. Antes de actuar te dice qué va a pasar; después, qué pasó, en orden.",
            "🔧 Arreglado: el botón «▶ Ver escena» de la historia de la Torre se veía como un cuadro enorme.",
        ],
    },
    {
        version: 57,
        titulo: "La Biblioteca prohibida",
        cambios: [
            "📚 Siete pergaminos nuevos, además de «La primera piedra»: el juramento de los Vigías, las hermanas de la niebla, el mapa de Nera, el diario de Casio, el nombre raspado, la carta de Maren y lo que arde después. Cada uno cuenta un trozo más del mundo.",
            "🔓 Se abren en orden: hace falta leer el anterior y avanzar en el juego (misiones, jefes, el mapa, la Torre, la Mazmorra, la aldea y la Saga). Los encuentras en Héroe › Historia › La Biblioteca prohibida.",
            "🌟 Cada uno termina con una moraleja para los días difíciles. Al acabar de leerlo, se cuenta en una escena animada y ganas +30 XP y +15 💎 (una sola vez).",
            "🌫️ Cada pergamino deja una pregunta sin responder: son las pistas de las sagas que vendrán cuando termines la Saga de la Llama. Las ves en «Lo que queda abierto».",
        ],
    },
    {
        version: 56,
        titulo: "Animaciones y escenas nuevas",
        cambios: [
            "🎬 Cinemáticas nuevas: al llegar a una región del mapa, al liberar la guarida de un señor vencido, al abrir una fortaleza, la primera vez que entras al Arcade y a Las Voces del Valle, y cuando alguien de la aldea recupera su voz. Se pueden saltar y volver a ver (en el mapa y en Ajustes).",
            "🗺️ En el mapa, los señores que venciste aparecen en su guarida, con su retrato y una marca ✓.",
            "📜 La historia de la Torre es más interactiva: cada capítulo se abre y se cierra, y tiene su botón «▶ Ver escena» con Aurelio, el guardián y las salas animadas. La Crónica del reino también tiene sus escenas.",
            "✨ Más animaciones en todo el juego: las pantallas y las tarjetas entran con suavidad, las barras se llenan, los botones rebotan al tocarlos y las ventanas se abren con efecto. Si tu teléfono tiene «Reducir movimiento», todo queda quieto.",
        ],
    },
    {
        version: 55,
        titulo: "Tus misiones principales, al frente",
        cambios: [
            "🎯 Arriba de Hoy siempre ves tus 3 misiones principales más avanzadas, con su barra y el siguiente paso: lo marcas ahí mismo con un toque.",
            "La pestaña de las principales ahora va justo después de Misiones.",
        ],
    },
    {
        version: 54,
        titulo: "Aurelio, al final",
        cambios: [
            "🧙 La pestaña Aurelio de Hoy ahora es la última, y Hoy abre directo en tus misiones.",
        ],
    },
    {
        version: 53,
        titulo: "Viajas más rápido",
        cambios: [
            "🐎 Cada jefe que vences hace que tu héroe avance más rápido por el mapa: +10 % en cada paso por jefe (hasta ×3). Con 3 jefes vencidos, cada paso vale 1,3.",
            "En el mapa ves cuánto más rápido viajas. Así llegas antes a los jefes que te esperan en otras regiones.",
        ],
    },
    {
        version: 52,
        titulo: "Los jefes te esperan en el mapa",
        cambios: [
            "🗺️ Cada jefe vive en una región del mapa del reino y solo puedes vencerlo cuando tu héroe llega ahí. Mientras tanto, el daño que le haces se le guarda 🔒 y lo recibe todo junto el día que llegas.",
            "💪 Los jefes ahora son más duros (150, 300, 500, 750 y 1100 de vida). Los que ya habías vencido siguen vencidos.",
            "🧙 Nueva pestaña Aurelio en Hoy (en los ánimos Bien y Normal), la primera: tu personaje, el resumen de tus rivales, «Tu día» con Aurelio y tu semana.",
            "🔧 Arreglado: los botones «Por atributo» y «Por momento» de Hoy no funcionaban. El interruptor del modo esencial en Ajustes ahora también cambia tu ánimo.",
            "📱 La pantalla queda fija: con un dedo solo haces scroll (sin zoom con doble toque); con dos dedos sí puedes hacer zoom.",
        ],
    },
    {
        version: 51,
        titulo: "Hoy, más ordenado",
        cambios: [
            "📑 Hoy ahora tiene pestañas y solo ves una sección a la vez: ⚔️ Misiones, 🗓️ Metas de la semana, 📌 Tareas, 🎯 Importantes y 📓 Diario (el diario no sale en el modo esencial). Cada una tiene su color y su contador.",
            "💪 Las misiones y las tareas se agrupan por atributo (Fuerza, Intelecto, Carisma, Riqueza y los tuyos), cada uno con su color. Si prefieres, cambia a «Por momento» (mañana, tarde, noche).",
            "Lo que antes iba arriba (tu semana, héroe y «Tu día») ahora está debajo de las secciones, para que lo primero que veas sea lo que vas a hacer.",
        ],
    },
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
