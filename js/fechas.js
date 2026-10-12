// fechas.js — Ayudantes para trabajar con fechas.
//
// Las fechas se guardan como texto "AAAA-MM-DD" (ej: "2026-10-12").
// Ventajas: se guardan fácil en JSON y se pueden comparar con < y >
// como si fueran palabras ("2026-10-11" < "2026-10-12" es true).
//
// IMPORTANTE: usamos siempre la hora LOCAL del iPhone. No usamos
// toISOString() porque esa función da la fecha en hora UTC (Londres),
// y en Colombia después de las 7 p.m. ya diría que es "mañana".

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
               "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun",
                             "jul", "ago", "sep", "oct", "nov", "dic"];

// Días de la semana empezando en lunes (como en diaDeSemana: 0 = lunes … 6 = domingo).
export const DIAS_LETRAS = ["L", "M", "X", "J", "V", "S", "D"];
export const DIAS_CORTOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

const MS_POR_DIA = 24 * 60 * 60 * 1000;


// 5 -> "05"
function dosDigitos(numero) {
    return String(numero).padStart(2, "0");
}

// Objeto Date -> "AAAA-MM-DD"
export function aTexto(fecha) {
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

// "AAAA-MM-DD" -> objeto Date (a la medianoche local)
export function desdeTexto(texto) {
    const [anio, mes, dia] = texto.split("-").map(Number);
    return new Date(anio, mes - 1, dia); // en JavaScript los meses van de 0 a 11
}

// La fecha de hoy como texto.
export function hoy() {
    return aTexto(new Date());
}

// sumarDias("2026-10-12", 1) -> "2026-10-13"   (también acepta números negativos)
export function sumarDias(texto, dias) {
    const fecha = desdeTexto(texto);
    fecha.setDate(fecha.getDate() + dias);
    return aTexto(fecha);
}

// Cuántos días hay de una fecha a otra: diasEntre("2026-10-10", "2026-10-12") -> 2
export function diasEntre(desde, hasta) {
    // Math.round corrige los cambios de horario de verano (días de 23 o 25 horas).
    return Math.round((desdeTexto(hasta) - desdeTexto(desde)) / MS_POR_DIA);
}

// 0 = lunes, 1 = martes ... 6 = domingo
// (getDay() de JavaScript empieza en domingo; lo corremos para empezar en lunes)
export function diaDeSemana(texto) {
    return (desdeTexto(texto).getDay() + 6) % 7;
}

// "2026-10-12" -> "lunes 12 de octubre"
export function fechaLegible(texto) {
    const fecha = desdeTexto(texto);
    return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

// "2026-10-12" -> "12 oct"
export function fechaCorta(texto) {
    const fecha = desdeTexto(texto);
    return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}
