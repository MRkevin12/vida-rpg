// secretos.js — Los logros secretos (v149): nadie te dice cómo se ganan. Aparecen solos cuando haces algo especial.
//
// Los LOGROS los defines tú, y las INSIGNIAS tienen metas a la vista. Los secretos no: mientras no los
// descubres, solo ves una pista misteriosa. Al descubrirlos se revela qué hiciste y recibes un premio.
// Se guardan en estado.secretos = { "madrugador": "2026-10-22" } (el día en que se descubrió).
//
// Aquí solo están las reglas (qué secretos hay y cuándo se cumplen): no toca la pantalla ni guarda nada.

import { diasEntre, diaDeSemana, sumarDias } from "./fechas.js";

const hayHora = (c) => Number.isInteger(c.hora);   // las misiones marcadas antes de la v149 no guardaron la hora

// Cuenta cuántas misiones hubo cada día: { "2026-10-22": 3, … }
function porDia(estado) {
    const cuenta = {};
    for (const c of estado.completadas) cuenta[c.fecha] = (cuenta[c.fecha] || 0) + 1;
    return cuenta;
}

// cumple(estado, hoy) → true si ya hiciste eso. premio = lo que recibes al descubrirlo.
export const SECRETOS = [
    { id: "madrugador", icono: "🌅", nombre: "Madrugador", premio: { gemas: 8, xp: 50 },
      pista: "Algo se logra cuando el mundo todavía duerme.",
      texto: "Cumplir una misión antes de las 6 de la mañana.",
      cumple: (estado) => estado.completadas.some((c) => hayHora(c) && c.hora < 6) },
    { id: "noctambulo", icono: "🦉", nombre: "Noctámbulo", premio: { gemas: 8, xp: 50 },
      pista: "Hay quien cumple cuando ya casi es otro día.",
      texto: "Cumplir una misión pasadas las 11 de la noche.",
      cumple: (estado) => estado.completadas.some((c) => hayHora(c) && c.hora >= 23) },
    { id: "siete-en-uno", icono: "🌈", nombre: "Siete en uno", premio: { gemas: 10, xp: 60 },
      pista: "Un solo día puede valer por varios.",
      texto: "Cumplir 7 misiones en un mismo día.",
      cumple: (estado) => Object.values(porDia(estado)).some((n) => n >= 7) },
    { id: "cuatro-caminos", icono: "🧭", nombre: "Los cuatro caminos", premio: { gemas: 10, xp: 60 },
      pista: "Fuerza, mente, palabra y oro… en una sola jornada.",
      texto: "Cumplir una misión de cada uno de los 4 atributos el mismo día.",
      cumple: (estado) => {
          const atributos = {};
          for (const c of estado.completadas) (atributos[c.fecha] ||= new Set()).add(c.atributo);
          return Object.values(atributos).some((conjunto) => ["fuerza", "intelecto", "carisma", "riqueza"].every((a) => conjunto.has(a)));
      } },
    { id: "hierro", icono: "⚒️", nombre: "Hábito de hierro", premio: { gemas: 12, xp: 80 },
      pista: "Lo que se repite una y otra vez se vuelve parte de ti.",
      texto: "Cumplir la misma misión 30 veces.",
      cumple: (estado) => {
          const veces = {};
          for (const c of estado.completadas) veces[c.misionId] = (veces[c.misionId] || 0) + 1;
          return Object.values(veces).some((n) => n >= 30);
      } },
    { id: "honesto", icono: "🪞", nombre: "Honesto contigo", premio: { gemas: 8, xp: 60 },
      pista: "Admitir un tropiezo también es una victoria.",
      texto: "Reconocer 5 misiones falladas con «Fallé».",
      cumple: (estado) => estado.fallas.length >= 5 },
    { id: "domingos", icono: "⛪", nombre: "Domingos de héroe", premio: { gemas: 10, xp: 70 },
      pista: "El día de descanso de los demás es tu día de ventaja.",
      texto: "Cumplir al menos una misión 4 domingos seguidos.",
      cumple: (estado) => {
          const dias = porDia(estado);
          return Object.keys(dias).some((fecha) => diaDeSemana(fecha) === 6 && [7, 14, 21].every((n) => dias[sumarDias(fecha, n)]));
      } },
    { id: "doblete", icono: "⚡", nombre: "Doblete", premio: { gemas: 10, xp: 60 },
      pista: "Hierro y asfalto, sin dejar pasar el día.",
      texto: "Entrenar en el gimnasio y salir a correr el mismo día.",
      cumple: (estado) => {
          const gym = new Set(estado.gym.sesiones.map((s) => s.fecha));
          return estado.running.carreras.some((c) => gym.has(c.fecha));
      } },
    { id: "nuevo-ano", icono: "🎆", nombre: "Año nuevo, vida nueva", premio: { gemas: 10, xp: 70 },
      pista: "Hay un día en que todos prometen. Pocos cumplen.",
      texto: "Cumplir una misión un 1 de enero.",
      cumple: (estado) => estado.completadas.some((c) => c.fecha.slice(5) === "01-01") },
    { id: "un-ano", icono: "🎂", nombre: "Un año contigo", premio: { gemas: 25, xp: 200 },
      pista: "El tiempo es el mejor testigo.",
      texto: "Cumplir un año desde que creaste a tu héroe (con al menos 50 misiones hechas).",
      cumple: (estado, hoy) => Boolean(estado.personaje) && diasEntre(estado.personaje.creadoEn, hoy) >= 365 && estado.completadas.length >= 50 },
    { id: "reflexivo", icono: "📝", nombre: "El que se mira", premio: { gemas: 10, xp: 70 },
      pista: "Detenerse a pensar también es avanzar.",
      texto: "Hacer 4 revisiones semanales.",
      cumple: (estado) => Object.keys(estado.revisiones).length >= 4 },
    { id: "temporada-perfecta", icono: "🏅", nombre: "Temporada perfecta", premio: { gemas: 20, xp: 150 },
      pista: "Un mes entero, todas las promesas cumplidas.",
      texto: "Cumplir todas las metas de una temporada mensual.",
      cumple: (estado) => Object.values(estado.temporadas || {}).some((t) => t.cierre?.todas) },
    { id: "dragon", icono: "🐉", nombre: "Dragón sobre su tesoro", premio: { gemas: 10, xp: 60 },
      pista: "Guardar también es una forma de poder.",
      texto: "Juntar 1.000 monedas sin gastarlas.",
      cumple: (estado) => Boolean(estado.personaje) && estado.personaje.monedas >= 1000 },
];

export const POR_ID = Object.fromEntries(SECRETOS.map((s) => [s.id, s]));

// Los secretos que se cumplen ahora y todavía no estaban descubiertos.
export function nuevosSecretos(estado, hoy) {
    const ya = estado.secretos || {};
    return SECRETOS.filter((s) => !ya[s.id] && s.cumple(estado, hoy));
}
