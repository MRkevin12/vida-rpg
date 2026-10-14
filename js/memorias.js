// memorias.js — Las Memorias de Aurelio: la historia de tu maestro (v30).
//
// Aurelio no cuenta su pasado de una vez: te lo va contando a medida que avanzas, un capítulo
// cada vez que logras algo que él respeta (una racha, tu primer jefe, la Torre…). Los capítulos
// se abren EN ORDEN: el siguiente solo se abre cuando el anterior ya está abierto.
//
// La historia en pocas palabras (une la Crónica, la Torre y la Mazmorra): Aurelio fue aprendiz
// de Casio, el último Vigía. Casio subió a la Torre a salvar la Llama y nunca volvió (es el
// Centinela celeste del piso 19). Aurelio, por miedo, se quedó cien años al pie de la Torre,
// igual que el Rey Hueco se quedó abajo. Por eso te enseña.
//
// Nada se guarda salvo cuántos capítulos ya leíste (estado.maestro.leidas): cuáles están
// abiertos se CALCULA. Texto plano (vistas.js lo escapa). {n} es tu héroe y {m} tu dragón.
// Sin género gramatical para el héroe (se usa su nombre).

import { calcularNivel } from "./juego.js";

// condicion: { tipo, valor } → qué hace falta para que Aurelio te lo cuente.
//   racha (tu mejor racha) · jefes (vencidos) · nivel · torre y mazmorra (pisos superados: tu récord)
export const MEMORIAS = [
    {
        id: "manana",
        titulo: "El que dejaba todo para mañana",
        condicion: { tipo: "siempre", valor: 0 },
        parrafos: [
            "Antes de ser maestro, Aurelio fue un muchacho con talento y sin constancia. Empezaba cien cosas y no terminaba ninguna, y siempre tenía una buena razón para dejar la siguiente para mañana.",
            "Una tarde, en la plaza del valle, vio pasar a un hombre de armadura celeste que subía a la Torre como quien va a trabajar. Le preguntó por qué subía todos los días. El hombre ni se detuvo: «Porque ayer subí».",
        ],
        leccion: "La constancia no empieza con ganas. Empieza con ayer.",
    },
    {
        id: "casio",
        titulo: "Casio, el último Vigía",
        condicion: { tipo: "racha", valor: 7 },
        parrafos: [
            "Aquel hombre se llamaba Casio y era el último de los Vigías. Aceptó a Aurelio como aprendiz con una sola condición: subir con él un piso cada día, sin excepciones. El primer día le dio a leer un pergamino viejo, «La primera piedra». «Léelo cuando quieras rendirte», le dijo.",
            "La primera semana, Aurelio inventó once excusas. Casio las escuchó todas sin responder ninguna. Al octavo día, Aurelio dejó de inventarlas: no porque Casio lo hubiera convencido, sino porque entendió que la única persona que escuchaba sus excusas era él mismo.",
        ],
        leccion: "Las excusas solo convencen a quien las dice.",
    },
    {
        id: "sombra",
        titulo: "La primera Sombra",
        condicion: { tipo: "jefes", valor: 1 },
        parrafos: [
            "Casio le enseñó que las Sombras no son monstruos que llegan de afuera, sino costumbres que uno alimenta. «Cada vez que cedes, les das de comer —decía—. Cada vez que cumples, las dejas con hambre.»",
            "Aurelio venció a su primera Sombra, la Pereza de las mañanas, sin desenvainar nada: levantándose a la misma hora durante cuarenta días. Cuando se lo contó a Casio, esperando un elogio, el Vigía solo le dijo: «Bien. Mañana, otra vez».",
        ],
        leccion: "A una costumbre no se la vence: se la reemplaza.",
    },
    {
        id: "huevo",
        titulo: "El huevo de la Torre",
        condicion: { tipo: "nivel", valor: 10 },
        parrafos: [
            "En lo alto de la Torre vivían los dragones de los Vigías. La última dragona murió dejando un huevo que nunca se abrió. Casio se lo confió a Aurelio: «No se abre con calor, sino con constancia. Algún día encontrarás a quien merezca llevarlo».",
            "Aurelio lo guardó durante cien años, envuelto en lana, junto al fuego. Es el huevo que le dio a {n} en el Valle del Comienzo. De él nació {m}.",
        ],
        leccion: "Lo que vale la pena crece despacio.",
    },
    {
        id: "subida",
        titulo: "La última subida",
        condicion: { tipo: "torre", valor: 10 },
        parrafos: [
            "Una mañana, la Llama de la cima empezó a apagarse. Casio se puso la armadura y le pidió a Aurelio que lo esperara abajo: «Si no vuelvo al anochecer, no subas a buscarme. Sigue subiendo un piso cada día, como te enseñé».",
            "Aurelio esperó un día, una semana, un año. Casio nunca bajó. La Llama se apagó, la Torre se llenó de criaturas y las Sombras empezaron a volver al reino, una por una.",
        ],
        leccion: "Esperar también es decidir.",
    },
    {
        id: "quietos",
        titulo: "Los años quietos",
        condicion: { tipo: "jefes", valor: 5 },
        parrafos: [
            "Aurelio no subió a buscarlo. Tenía miedo, y el miedo aprendió a disfrazarse de prudencia: «mañana, cuando esté listo». Tampoco siguió subiendo un piso cada día, como le había prometido a Casio.",
            "Envejeció al pie de la Torre, enseñando a otros lo que él mismo había dejado de hacer. Todos sus alumnos se rindieron antes del quinto piso. Ninguno vio lo que Aurelio sabía bien: un maestro que no practica enseña, sobre todo, a rendirse.",
        ],
        leccion: "El miedo rara vez dice que no. Dice «todavía no».",
    },
    {
        id: "centinela",
        titulo: "El Centinela",
        condicion: { tipo: "torre", valor: 20 },
        parrafos: [
            "Cuando {n} volvió de la cima y le habló del Centinela celeste que no dejaba pasar a nadie, Aurelio se quedó callado mucho rato. Era Casio. La tormenta lo había atado a la Torre, de guardia para siempre junto a la Llama que no pudo encender.",
            "«Lo liberaste tú —dijo al fin, con la voz rota—. Lo que yo no me atreví a hacer en cien años, lo hiciste en unas semanas. No por ser más fuerte que yo: por subir todos los días.»",
        ],
        leccion: "Nadie llega arriba de un salto.",
    },
    {
        id: "temor",
        titulo: "Lo que Aurelio teme",
        condicion: { tipo: "mazmorra", valor: 20 },
        parrafos: [
            "Al ver la corona hueca, Aurelio contó su último secreto. Él sabe cómo se empieza a ser como el Rey Hueco, porque estuvo a punto: el primer Vigía que dejó de subir no cayó en un día; se fue quedando, un «mañana» tras otro, igual que Aurelio al pie de la Torre.",
            "«Por eso te enseño —le dijo a {n}—. No porque yo sepa ganar, sino porque sé cómo se pierde. Y se pierde igual que se gana: un día a la vez.» Esa noche, después de cien años, el viejo maestro volvió a subir la Torre, piso por piso, hasta la cima, y se sentó junto a la Llama apagada a esperar el fuego de los memoriales.",
        ],
        leccion: "Se pierde igual que se gana: un día a la vez.",
    },
];

export const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// Lo que cuenta para abrir capítulos. info = juego.resumen(estado, hoy) (ya trae la racha y los jefes).
export function datosDeMemorias(estado, info) {
    return {
        siempre: 0,
        racha: info.racha.mejor,
        jefes: info.jefesDerrotados,
        nivel: calcularNivel(estado.personaje?.xp || 0).nivel,
        torre: estado.arcade?.records?.torre || 0,
        mazmorra: estado.arcade?.records?.mazmorra || 0,
    };
}

// Cuántos capítulos están abiertos (en orden: se cuenta hasta el primero que falta).
export function cuantasAbiertas(datos) {
    const primeraCerrada = MEMORIAS.findIndex((m) => datos[m.condicion.tipo] < m.condicion.valor);
    return primeraCerrada === -1 ? MEMORIAS.length : primeraCerrada;
}

// Lo que falta para el capítulo, en palabras. Ej: «cuando llegues al nivel 10 (vas en el 6)».
export function pista(memoria, datos) {
    const { tipo, valor } = memoria.condicion;
    const tienes = datos[tipo];
    return {
        siempre: "ya",
        racha: `cuando logres una racha de ${valor} días (tu mejor: ${tienes})`,
        jefes: valor === 1 ? "cuando venzas a tu primer jefe" : `cuando hayas vencido a ${valor} jefes (llevas ${tienes})`,
        nivel: `cuando llegues al nivel ${valor} (vas en el ${tienes})`,
        torre: valor >= 20
            ? `cuando despejes la tormenta: supera el piso ${valor} de la Torre del héroe (tu récord: ${tienes})`
            : `cuando superes el piso ${valor} de la Torre del héroe (tu récord: ${tienes})`,
        mazmorra: `cuando vuelvas del fondo de la Mazmorra: supera el sótano ${valor} (tu récord: ${tienes})`,
    }[tipo];
}

// Todos los capítulos, para leer. leidas = estado.maestro.leidas. nombres = { heroe, dragon }.
// Devuelve [{ id, numero, titulo, abierto, nueva (abierto y todavía no leído), parrafos, leccion, pista (si es el siguiente) }]
export function capitulosDeMemorias(datos, leidas, nombres) {
    const abiertas = cuantasAbiertas(datos);
    const poner = (texto) => texto.replaceAll("{n}", nombres.heroe).replaceAll("{m}", nombres.dragon);
    return MEMORIAS.map((m, i) => ({
        id: m.id,
        numero: ROMANOS[i],
        titulo: m.titulo,
        abierto: i < abiertas,
        nueva: i < abiertas && i >= leidas,
        parrafos: i < abiertas ? m.parrafos.map(poner) : [],
        leccion: i < abiertas ? m.leccion : null,
        pista: i === abiertas ? `Aurelio te lo contará ${pista(m, datos)}.` : null,
    }));
}
