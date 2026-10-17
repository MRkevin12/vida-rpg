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
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
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
    // (v134) Se llama miles de veces (la racha y la vida se calculan día por día): leer cada parte con slice
    // es varias veces más rápido que split + map. Si el texto no tiene la forma exacta, se usa el camino largo.
    if (texto.length === 10) {
        return new Date(+texto.slice(0, 4), +texto.slice(5, 7) - 1, +texto.slice(8, 10)); // los meses van de 0 a 11
    }
    const [anio, mes, dia] = texto.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
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

// El lunes de la semana de esa fecha: lunesDe("2026-10-15") -> "2026-10-12"
export function lunesDe(texto) {
    return sumarDias(texto, -diaDeSemana(texto));
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

// ¿El texto es una fecha real "AAAA-MM-DD"? ("2026-02-30" no lo es)
export function esFechaValida(texto) {
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) && aTexto(desdeTexto(texto)) === texto;
}

// Milisegundos -> "mm:ss" (para el reloj del modo enfoque): 90000 -> "01:30"
export function relojTexto(ms) {
    const segundos = Math.max(0, Math.ceil(ms / 1000));
    return `${dosDigitos(Math.floor(segundos / 60))}:${dosDigitos(segundos % 60)}`;
}

// Igual, pero con horas cuando hace falta: "1:59:59" (o "05:09" si queda menos de una hora).
export function relojLargo(ms) {
    const segundos = Math.max(0, Math.ceil(ms / 1000));
    const horas = Math.floor(segundos / 3600);
    if (!horas) return relojTexto(ms);
    return `${horas}:${dosDigitos(Math.floor((segundos % 3600) / 60))}:${dosDigitos(segundos % 60)}`;
}
