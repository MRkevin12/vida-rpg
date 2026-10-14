// novedades.js — Qué hay de nuevo en cada versión.
//
// Después de actualizar, la app muestra una ventana con lo nuevo (una sola vez).
// Al publicar una versión: sube VERSION_APP (igual que VERSION en sw.js) y agrega
// sus cambios arriba de la lista.

export const VERSION_APP = 31;

export const NOVEDADES = [
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
