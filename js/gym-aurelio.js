// gym-aurelio.js — El Maestro Aurelio en el gimnasio (v76): lo que te dice entre serie y serie, y consejos de técnica.
//
// Son frases preparadas (no inteligencia artificial) que se eligen según el momento del entrenamiento:
//   inicio     → al empezar el entrenamiento
//   calentado  → al marcar el calentamiento
//   primera    → la primera serie de todas
//   serie      → una serie cualquiera
//   mitad      → justo a la mitad del entrenamiento
//   ejercicio  → al terminar todas las series de un ejercicio
//   record     → una serie que supera tu mejor marca
//   ultima     → la última serie de todo el entrenamiento
//   fin        → al terminar el entrenamiento (sale en la celebración)
//   marcado    → al marcar el día sin anotar series
// {n} es tu nombre y {ejercicio} / {siguiente} los ejercicios. Este archivo solo elige texto: no dibuja ni guarda nada.

export const FRASES = {
    inicio: [
        "Calienta primero, {n}: cinco minutos hoy te ahorran semanas mañana.",
        "No vienes a demostrar nada. Vienes a sumar una repetición más que la última vez.",
        "El hierro no pide permiso ni espera a que tengas ganas. Qué bueno que llegaste.",
        "Llegar fue lo más difícil. Lo demás es una serie, y después otra.",
        "Hoy toca {ejercicio}. Una repetición bien hecha vale más que tres a medias.",
        "Respira hondo, afloja los hombros y empieza despacio. La Torre se sube un escalón a la vez.",
    ],
    calentado: [
        "Músculos calientes, cabeza clara. Así se empieza, {n}.",
        "Bien hecho. El calentamiento es el seguro más barato que existe.",
        "Ahora sí: el cuerpo ya sabe lo que viene.",
        "Calentar es respetar lo que quieres construir. Adelante.",
    ],
    primera: [
        "La primera serie es la más difícil, y ya la tienes.",
        "Eso es empezar. Ahora respira y no pienses en las demás: piensa en la siguiente.",
        "Ya rompiste la inercia, {n}. Lo demás es repetir.",
        "Una serie hecha pesa más que diez planeadas.",
    ],
    serie: [
        "Respira. Baja controlado, sube con fuerza.",
        "La técnica antes que el peso, {n}. Nadie te mide por lo que levantas con la espalda doblada.",
        "Cada repetición es un ladrillo de tu Torre.",
        "El dolor que enseña es el del músculo; el que avisa es el de la articulación. Escucha los dos.",
        "Maren diría: golpe, enfría, vuelve. Descansa lo justo y vuelve.",
        "No cuentes las que faltan. Cuenta solo la que estás haciendo.",
        "Más lento en la bajada: ahí es donde el músculo aprende.",
        "Así se forja el acero: calor, descanso y constancia.",
        "Nadie nace fuerte, {n}: se vuelve fuerte los días que no tiene ganas.",
        "Lo que haces hoy lo agradecerá tu yo de dentro de un año.",
        "Mira tu progreso, no el del de al lado.",
        "Si fuera fácil, no valdría la pena. Sigue.",
        "Esta serie cuenta igual que la primera, {n}. No la hagas a medias.",
        "Concéntrate en el músculo que trabaja. Sentir la contracción vale más que el peso.",
        "Cada serie bien hecha te acerca a la siguiente marca. Confía en el proceso.",
        "Respira por la nariz al subir y suelta el aire al hacer el esfuerzo. Así sostienes el ritmo.",
        "No tienes que sentirte increíble para hacer una buena serie, {n}. Basta con hacerla bien.",
    ],
    mitad: [
        "Vas por la mitad, {n}. Lo difícil ya pasó.",
        "Mitad del camino. Ahora no se trata de fuerza: se trata de no soltar el ritmo.",
        "Ya hiciste más de lo que habías hecho al empezar. Sigue así.",
        "La mitad ya está hecha, {n}. Lo que queda es lo que te va a diferenciar.",
        "Mitad hecha. Ahora el cuerpo ya sabe a lo que vino: respeta cada repetición.",
        "Vas a la mitad y el ritmo se mantiene. Eso es disciplina, no suerte.",
        "Ya pasaste lo más pesado de la sesión, {n}. Ahora solo hay que cerrarla bien.",
    ],
    ejercicio: [
        "{ejercicio}: listo. Descansa y sigue con {siguiente}.",
        "Ese ejercicio ya es historia. Ahora, {siguiente}.",
        "Bien cerrado, {n}. Un ejercicio menos y un músculo más fuerte. Sigue con {siguiente}.",
        "Cumpliste. Tómate tu descanso: {siguiente} te espera.",
        "Otro ejercicio terminado, {n}. Cada uno suma y ninguno se pierde.",
        "Bien hecho. Un poco de agua, respira y prepárate para {siguiente}.",
    ],
    ejercicioFinal: [
        "{ejercicio}: listo. Ya no queda nada por hacer, {n}.",
        "Último ejercicio terminado. Respira: acabaste lo que viniste a hacer.",
    ],
    record: [
        "¡Marca nueva! Eso no es suerte, {n}: es sobrecarga progresiva.",
        "Superaste tu mejor marca. Ayer no podías; hoy sí. Eso es crecer.",
        "Ese peso, con esas repeticiones, jamás lo habías movido. Apúntalo.",
        "Récord personal. El cuerpo te escuchó.",
    ],
    ultima: [
        "Última serie, {n}. Dala toda: después ya no hay nada que guardar.",
        "La última es la que más cuenta. Deja todo en ella.",
        "Una más y terminas. Piensa en cómo vas a sentirte al acabar.",
    ],
    fin: [
        "Terminaste, {n}. El músculo no crece mientras levantas: crece mientras descansas. Descansa bien.",
        "Hoy hiciste lo que ayer te daba pereza. Eso se llama carácter.",
        "Otra piedra en la Torre. Come bien, duerme mejor y vuelve cuando toque.",
        "No fue el entrenamiento perfecto: fue el que hiciste. Y ese es el que cuenta.",
        "Cumpliste con tu palabra, {n}. Casio habría sonreído.",
        "Orrin paró sin fecha de vuelta; tú acabas de apuntar la tuya. Así se hace.",
    ],
    marcado: [
        "Lo marcaste, {n}. Un día más que cumples: eso es constancia.",
        "Anotado. Ni los días buenos ni los malos: los que vienes, esos son los que cuentan.",
        "Otro día en tu libro de las subidas. Descansa bien.",
        "Hoy cumpliste. Mañana, si toca descansar, descansa; y si toca entrenar, aquí estaremos.",
    ],
};

// Elige una frase del momento. indice cambia de una a otra (así no se repite la misma seguida).
export function fraseDeGym(tipo, datos = {}, indice = 0) {
    const lista = FRASES[tipo] || FRASES.serie;
    const texto = lista[Math.abs(indice) % lista.length];
    return texto
        .replaceAll("{n}", datos.nombre || "héroe")
        .replaceAll("{ejercicio}", datos.ejercicio || "ese ejercicio")
        .replaceAll("{siguiente}", datos.siguiente || "el siguiente");
}

// Consejos de técnica de cada movimiento (ver MOVIMIENTO_DE en gym.js).
export const TECNICAS = {
    press_horizontal: ["Omóplatos atrás y abajo, pies firmes en el suelo.", "Baja la barra hasta el pecho, controlado, y empuja sin despegar la espalda del banco."],
    press_vertical: ["Abdomen apretado y costillas abajo: no arquees la espalda.", "Empuja recto hacia arriba y bloquea los codos sin encogerte."],
    elevacion_lateral: ["Sube hasta la altura de los hombros, con los codos un poco flexionados.", "Sin balanceo: si necesitas impulso, baja el peso."],
    curl: ["Codos pegados al cuerpo: solo se mueve el antebrazo.", "Sube con fuerza y baja lento: la bajada también trabaja."],
    triceps: ["Codos quietos, apuntando al frente.", "Extiende del todo y aprieta el tríceps un segundo arriba."],
    jalon: ["Tira con los codos, no con las manos: lleva los codos hacia abajo y atrás.", "Pecho arriba, hombros lejos de las orejas."],
    remo: ["Espalda recta y pecho abierto: junta los omóplatos al final.", "Tira con los codos hacia atrás, sin balancear el torso."],
    sentadilla: ["Rodillas hacia donde apuntan los pies y talones firmes.", "Baja hasta donde puedas mantener la espalda recta; sube empujando el suelo."],
    bisagra: ["Empuja la cadera hacia atrás como cerrando una puerta con ella; espalda recta.", "Las piernas casi estiradas y la barra pegada al cuerpo."],
    curl_femoral: ["Caderas pegadas al banco: no las levantes.", "Sube con fuerza y baja en tres segundos."],
    talones: ["Sube lo más alto que puedas y aguanta un segundo arriba.", "Baja despacio hasta estirar bien la pantorrilla."],
    abdominales: ["Enrolla el torso, no tires del cuello con las manos.", "Exhala al subir y aprieta el abdomen arriba."],
    encogimiento: ["Sube los hombros hacia las orejas, sin girarlos.", "Aguanta un segundo arriba y baja lento."],
    // (v168) Los movimientos nuevos (uno para cada ejercicio que antes se veía como otro).
    // Pecho
    press_mancuernas: ["Baja las mancuernas a los lados del pecho, con los codos un poco por debajo de los hombros.", "Empuja hacia arriba y júntalas sin chocarlas; los omóplatos siguen pegados al banco."],
    press_inclinado: ["Banco a unos 30 o 45 grados: más inclinado trabaja sobre todo el hombro.", "Baja hasta la parte alta del pecho y empuja sin despegar la espalda del respaldo."],
    press_declinado: ["Traba bien las piernas en los rodillos antes de sacar el peso.", "Baja la barra a la parte baja del pecho, controlada, y empuja recto hacia arriba."],
    aperturas: ["Los codos un poco doblados y quietos: el movimiento sale del hombro.", "Junta las manos delante del pecho, aprieta un segundo y abre despacio."],
    cruce_poleas: ["Un pie adelante y el pecho alto; los brazos casi estirados todo el tiempo.", "Lleva las manos juntas hacia abajo y al frente, como abrazando un barril, y vuelve lento."],
    flexion: ["El cuerpo recto como una tabla: aprieta el abdomen y los glúteos.", "Las manos debajo de los hombros; baja hasta casi tocar el suelo con el pecho."],
    fondos: ["Inclínate un poco hacia adelante para que trabaje más el pecho.", "Baja hasta que los brazos queden casi paralelos al suelo, sin que molesten los hombros."],
    // Tríceps
    press_frances: ["Los codos quietos apuntando arriba: solo se mueve el antebrazo.", "Baja la barra despacio hacia la frente y extiende sin abrir los codos."],
    extension_cuerda: ["Inclínate un poco hacia adelante y deja los codos cerca de la cabeza.", "Estira los brazos del todo y vuelve despacio hasta sentir el tríceps estirado."],
    extension_arriba: ["Los codos apuntando al techo y cerca de la cabeza, sin abrirlos.", "Baja la mancuerna detrás de la nuca, despacio, y sube hasta estirar los brazos."],
    patada_triceps: ["El brazo pegado al cuerpo y paralelo al suelo: el codo no se mueve.", "Estira el brazo hacia atrás, aprieta un segundo y baja despacio."],
    fondos_banco: ["Las manos en el borde del banco y la espalda cerca de él.", "Baja doblando los codos hacia atrás, sin pasar de 90 grados, y empuja hasta estirarlos."],
    // Hombros
    elevacion_frontal: ["Sube hasta la altura de los hombros, con los brazos casi estirados.", "Sin balancear el torso: si necesitas impulso, el peso es demasiado."],
    pajaros: ["Los brazos casi estirados y los hombros abajo, lejos de las orejas.", "Abre hacia atrás juntando los omóplatos y vuelve despacio."],
    face_pull: ["La polea a la altura de la cara: tira de la cuerda hacia los ojos.", "Codos altos y abiertos; al final separa las manos y aprieta los omóplatos."],
    // Espalda
    remo_mancuerna: ["La espalda recta y paralela al suelo, con la mano y la rodilla firmes en el banco.", "Lleva la mancuerna hacia la cadera, con el codo pegado al cuerpo."],
    remo_inclinado: ["Inclínate con la espalda recta y las rodillas un poco dobladas.", "Lleva la barra al abdomen con los codos hacia atrás y bájala controlada."],
    dominada: ["Empieza colgado con los brazos estirados y los hombros firmes.", "Sube llevando el pecho a la barra y baja despacio, sin balancearte."],
    pullover: ["Los brazos casi estirados y el torso un poco inclinado hacia adelante.", "Baja la barra en arco hasta los muslos, sintiendo la espalda, y vuelve lento."],
    hiperextension: ["La almohadilla justo debajo de la cadera, para doblarte desde ahí.", "Sube hasta quedar en línea con las piernas; no arquees la espalda de más."],
    // Bíceps
    curl_inclinado: ["La espalda pegada al respaldo y los brazos colgando detrás del cuerpo.", "Sube sin adelantar los codos y baja hasta estirar el brazo."],
    curl_predicador: ["Los brazos bien apoyados en la almohadilla, con las axilas en el borde.", "Baja controlado hasta casi estirar, sin soltar el peso de golpe."],
    curl_concentrado: ["El codo apoyado en la parte de adentro del muslo, sin moverse.", "Sube despacio, aprieta arriba un segundo y baja lento."],
    // Cuádriceps
    prensa: ["La espalda y la cadera pegadas al respaldo todo el tiempo.", "Baja hasta que las rodillas lleguen cerca del pecho y empuja sin trabar las rodillas."],
    extension_cuadriceps: ["Ajusta la máquina para que la rodilla quede a la altura del eje.", "Sube hasta estirar la pierna, aprieta un segundo y baja despacio."],
    hack: ["La espalda y los hombros pegados a las almohadillas.", "Baja hasta que los muslos queden paralelos a la plataforma y empuja con todo el pie."],
    hack_barra: ["La barra pegada a la parte de atrás de las piernas y el pecho alto.", "Baja la cadera como en una sentadilla y sube empujando el suelo."],
    zancada: ["Un paso largo, con el peso en la pierna de adelante.", "Baja recto hasta que la rodilla de atrás casi toque el suelo."],
    bulgara: ["El empeine de atrás en el banco y casi todo el peso en la pierna de adelante.", "Baja recto, con el torso firme, y sube empujando con el talón."],
    sentadilla_goblet: ["La mancuerna pegada al pecho y los codos hacia abajo.", "Baja entre las rodillas con la espalda recta y sube empujando el suelo."],
    sentadilla_frontal: ["La barra sobre la parte de adelante de los hombros y los codos bien altos.", "El pecho derecho durante todo el movimiento; baja controlado."],
    // Isquiosurales y glúteos
    peso_muerto: ["La barra pegada a las piernas, sobre el medio del pie.", "Espalda recta y pecho alto: empuja el suelo con las piernas y estira la cadera al final."],
    peso_muerto_sumo: ["Los pies muy abiertos y las manos por dentro de las rodillas.", "Empuja las rodillas hacia afuera y sube con el pecho alto y la barra pegada."],
    buenos_dias: ["La barra en la espalda alta y las rodillas apenas dobladas.", "Lleva la cadera hacia atrás con la espalda recta hasta sentir la parte de atrás del muslo."],
    curl_femoral_sentado: ["La almohadilla de arriba firme sobre los muslos, cerca de las rodillas.", "Lleva los talones hacia abajo y atrás, y vuelve en tres segundos."],
    nordico: ["Los tobillos bien trabados y el cuerpo recto de las rodillas a la cabeza.", "Baja lo más lento que puedas y frena con las manos cuando ya no aguantes."],
    curl_femoral_pie: ["La cadera quieta y apoyada: solo se mueve la pierna.", "Sube el talón hacia el glúteo, aprieta y baja despacio."],
    sentadilla_sumo: ["Los pies bien abiertos y las puntas hacia afuera.", "Las rodillas siguen la dirección de los pies; baja con el pecho alto."],
    puente: ["Los pies cerca de la cadera y los brazos en el suelo.", "Sube la cadera apretando los glúteos hasta que hombros, cadera y rodillas queden en línea."],
    hip_thrust: ["El borde del banco justo debajo de los omóplatos y la barra sobre la cadera.", "Arriba, el torso horizontal y la barbilla hacia el pecho; aprieta los glúteos un segundo."],
    patada_gluteo: ["El torso firme y un poco inclinado: no arquees la espalda.", "Lleva la pierna hacia atrás con el glúteo, sin girar la cadera, y vuelve lento."],
    abduccion: ["Siéntate derecho, con la espalda en el respaldo.", "Abre las rodillas con fuerza, aguanta un segundo y cierra despacio."],
    // Pantorrillas
    talones_sentado: ["La almohadilla firme sobre las rodillas y la punta de los pies en el escalón.", "Sube lo más alto que puedas y baja hasta estirar bien la pantorrilla."],
    talones_prensa: ["Solo la punta de los pies en la plataforma, con las piernas casi estiradas.", "Empuja con los dedos lo más lejos que puedas y vuelve hasta estirar la pantorrilla."],
    talones_burro: ["La espalda recta y los antebrazos firmes en el apoyo.", "Baja los talones hasta estirar y sube lo más alto que puedas, sin rebotar."],
    // Abdomen
    plancha: ["Codos debajo de los hombros y el cuerpo recto: ni la cadera arriba ni hundida.", "Aprieta el abdomen y los glúteos, y sigue respirando."],
    crunch_polea: ["La cadera quieta: el movimiento es enrollar la espalda hacia el suelo.", "Lleva los codos hacia los muslos, suelta el aire y sube despacio."],
    giro_ruso: ["Echa el torso hacia atrás con la espalda recta, no encorvada.", "Gira desde el tronco, no solo con los brazos, y lleva el peso de un lado al otro."],
    colgado_rodillas: ["Cuelga quieto: no uses el balanceo para subir las piernas.", "Sube las rodillas hacia el pecho enrollando la pelvis y baja lento."],
    elevacion_piernas: ["La parte baja de la espalda pegada al suelo todo el tiempo.", "Sube las piernas estiradas y bájalas despacio, sin tocar el suelo."],
    rueda: ["Aprieta el abdomen y los glúteos antes de rodar.", "Llega solo hasta donde puedas sin que se hunda la espalda, y vuelve con el abdomen."],
};

export function consejoDeTecnica(movimiento, indice = 0) {
    const lista = TECNICAS[movimiento];
    return lista ? lista[Math.abs(indice) % lista.length] : "";
}

// El consejo de Aurelio del día (cambia cada día y es el mismo todo el día). Cosas básicas y sensatas: no son consejos médicos.
export const CONSEJOS_DEL_DIA = [
    "Dormir bien es parte del entrenamiento: el músculo se repara de noche.",
    "Toma agua durante el día, no solo cuando entrenas.",
    "Come algo de proteína en cada comida: huevos, carne, pescado, legumbres o lácteos.",
    "Calentar cinco minutos antes de levantar pesado vale más que cualquier suplemento.",
    "Sube el peso de a poquito: una repetición más o dos kilos más. Lo pequeño, repetido, lo cambia todo.",
    "Un día de descanso no es un día perdido: es cuando el cuerpo construye lo que entrenaste.",
    "Anota lo que levantas: lo que no se mide, no se puede superar.",
    "La técnica primero. Si no puedes controlar el peso en la bajada, es demasiado.",
    "Entrenar con sueño o con hambre rinde menos: cuida lo que haces antes de venir.",
    "No te compares con el que lleva años: compárate con tu yo de hace un mes.",
    "Estira un poco al terminar, cuando el músculo ya está caliente.",
    "Si algo duele de forma aguda en una articulación, para. Descansar un día es barato; una lesión, cara.",
    "Respira: exhala al hacer el esfuerzo y no aguantes el aire.",
    "Los mejores resultados no vienen del entrenamiento perfecto, sino del que sí haces cada semana.",
    "Mira tu constancia, no solo el espejo: el espejo tarda, el calendario no miente.",
    "Entrena todo el cuerpo: las piernas y la espalda sostienen lo que luce.",
];
export function consejoDelDia(fechaTexto) {
    const n = [...fechaTexto].reduce((suma, c) => suma + c.charCodeAt(0) * 7, 0);
    return CONSEJOS_DEL_DIA[n % CONSEJOS_DEL_DIA.length];
}
