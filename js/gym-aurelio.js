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
    ],
    mitad: [
        "Vas por la mitad, {n}. Lo difícil ya pasó.",
        "Mitad del camino. Ahora no se trata de fuerza: se trata de no soltar el ritmo.",
        "Ya hiciste más de lo que habías hecho al empezar. Sigue así.",
    ],
    ejercicio: [
        "{ejercicio}: listo. Descansa y sigue con {siguiente}.",
        "Ese ejercicio ya es historia. Ahora, {siguiente}.",
        "Bien cerrado, {n}. Un ejercicio menos y un músculo más fuerte. Sigue con {siguiente}.",
        "Cumpliste. Tómate tu descanso: {siguiente} te espera.",
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
