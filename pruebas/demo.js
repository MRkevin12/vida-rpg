// demo.js — Crea una partida de EJEMPLO (inventada) para probar la app.
//
// Sirve para dos cosas:
//   1. Las pruebas (pruebas.js) necesitan una partida con historial.
//   2. Las capturas de pantalla del README se sacan con estos datos,
//      así nunca aparecen datos personales de nadie.
//
// Esta función NO toca localStorage: solo devuelve un objeto con la partida.

import * as datos from "../js/datos.js";
import * as acciones from "../js/acciones.js";
import * as juego from "../js/juego.js";
import { hoy, sumarDias, diaDeSemana } from "../js/fechas.js";

// Números "al azar" pero siempre iguales (para que la partida de ejemplo no cambie
// cada vez). Es un generador sencillo: con la misma semilla da la misma serie.
function azarFijo(semilla) {
    let n = semilla;
    return () => {
        n = (n * 1664525 + 1013904223) % 4294967296;
        return n / 4294967296;   // entre 0 y 1
    };
}

// Misiones diarias de ejemplo. "constancia" = probabilidad de cumplirla un día cualquiera.
const MISIONES = [
    { nombre: "Entrenar 30 minutos", dificultad: "dificil", atributo: "fuerza", dias: [0, 2, 4, 5], constancia: 0.8 },
    { nombre: "Leer 20 páginas", dificultad: "normal", atributo: "intelecto", dias: null, constancia: 0.85 },
    { nombre: "Estudiar programación", dificultad: "dificil", atributo: "intelecto", dias: [0, 1, 2, 3, 4], constancia: 0.9 },
    { nombre: "Meditar 10 minutos", dificultad: "facil", atributo: "carisma", dias: null, constancia: 0.6 },
    { nombre: "Llamar a un amigo", dificultad: "facil", atributo: "carisma", dias: [2, 6], constancia: 0.5 },
    { nombre: "Anotar mis gastos", dificultad: "facil", atributo: "riqueza", dias: null, constancia: 0.7 },
];

export function partidaDemo(dias = 45) {
    const estado = datos.estadoInicial();
    const azar = azarFijo(7);
    const inicio = sumarDias(hoy(), -(dias - 1));

    acciones.crearPersonaje(estado, "Aria");
    estado.personaje.creadoEn = inicio;   // como si llevara 45 días jugando

    for (const m of MISIONES) acciones.crearMision(estado, m);
    for (const m of estado.misiones) m.creadaEn = inicio;

    acciones.crearPrincipal(estado, {
        nombre: "Correr mis primeros 10 km",
        atributo: "fuerza",
        submisiones: "Comprar zapatillas\nCorrer 3 km sin parar\nCorrer 5 km\nCorrer 10 km",
    });
    acciones.crearPrincipal(estado, {
        nombre: "Abrir mi tienda en línea",
        atributo: "riqueza",
        submisiones: "Elegir el producto\nTomar las fotos\nPublicar la tienda\nPrimera venta",
    });

    acciones.crearLogro(estado, { nombre: "Primera semana", tipo: "racha", objetivo: 7, recompensa: 50 });
    acciones.crearLogro(estado, { nombre: "Cien misiones", tipo: "total", objetivo: 100, recompensa: 100 });
    acciones.crearLogro(estado, { nombre: "Mente brillante", tipo: "atributo", objetivo: 10, atributo: "intelecto", recompensa: 150 });
    acciones.crearLogro(estado, { nombre: "Maratón", tipo: "manual", descripcion: "Terminar una carrera de 42 km.", icono: "🏃", recompensa: 500 });

    acciones.crearRecompensa(estado, { nombre: "Ver una película", costo: 150 });
    acciones.crearRecompensa(estado, { nombre: "Pedir mi comida favorita", costo: 300 });
    acciones.crearRecompensa(estado, { nombre: "Un día libre sin culpa", costo: 800 });

    // La "foto" de antes sirve para que, al final, la app entregue lo que se ganó
    // con todo el historial (premios de jefes, logros…), igual que cuando juegas.
    const antes = acciones.foto(estado);

    // Historial: recorremos los días y, según la constancia, marcamos cada misión.
    // El día de hoy queda a medias (para que se vea qué falta por hacer).
    for (let i = 0; i < dias; i++) {
        const fecha = sumarDias(inicio, i);
        const esHoy = i === dias - 1;
        const finDeSemana = diaDeSemana(fecha) >= 5;
        const reciente = i >= dias - 7;   // la última semana va un poco mejor
        estado.misiones.forEach((mision, posicion) => {
            if (!juego.tocaEseDia(mision, fecha)) return;
            let probabilidad = MISIONES[posicion].constancia - (finDeSemana ? 0.25 : 0) + (reciente ? 0.1 : 0);
            if (esHoy) probabilidad = posicion < 2 ? 1 : 0;
            if (azar() >= probabilidad) return;
            const { xp, monedas } = juego.DIFICULTADES[mision.dificultad];
            estado.completadas.push({ misionId: mision.id, fecha, xp, monedas, atributo: mision.atributo, dificultad: mision.dificultad });
            acciones.ganar(estado, { xp, monedas, atributo: mision.atributo });
        });
    }

    // Tres pasos de la primera misión principal ya están hechos.
    const carrera = estado.principales[0];
    for (const paso of carrera.submisiones.slice(0, 3)) acciones.alternarSubmision(estado, carrera.id, paso.id);

    acciones.revisarCambios(estado, antes);
    estado.ultimaVisita = hoy();
    estado.ultimoAvisoEscudo = hoy();   // para que no salgan avisos viejos al abrir
    return estado;
}
