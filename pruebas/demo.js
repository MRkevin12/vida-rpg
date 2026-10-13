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
import { preguntaDelDia } from "../js/diario.js";

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
    { nombre: "Entrenar 30 minutos", dificultad: "dificil", atributo: "fuerza", dias: [0, 2, 4, 5], momento: "manana", constancia: 0.8 },
    { nombre: "Leer 20 páginas", dificultad: "normal", atributo: "intelecto", dias: null, momento: "noche", constancia: 0.85 },
    { nombre: "Estudiar programación", dificultad: "dificil", atributo: "intelecto", dias: [0, 1, 2, 3, 4], momento: "tarde", constancia: 0.9 },
    { nombre: "Meditar 10 minutos", dificultad: "facil", atributo: "carisma", dias: null, momento: "manana", constancia: 0.6 },
    { nombre: "Llamar a un amigo", dificultad: "facil", atributo: "carisma", dias: [2, 6], constancia: 0.5 },
    { nombre: "Anotar mis gastos", dificultad: "facil", atributo: "riqueza", dias: null, momento: "noche", constancia: 0.7 },
    { nombre: "Nadar", dificultad: "normal", atributo: "fuerza", frecuencia: "semana", veces: 2, constancia: 0.4 },
    { nombre: "Beber agua", dificultad: "facil", atributo: "fuerza", dias: null, cantidad: 8, unidad: "vasos", constancia: 0.75 },
];

// Frases del diario de ejemplo y lo que agradece (se repiten en ciclo).
const DIARIO = [
    ["Terminé el módulo de funciones", "Que el código por fin funcionó"],
    ["Día largo, pero cumplí lo básico", ""],
    ["Corrí sin parar por primera vez", "Mis piernas, que aguantaron"],
    ["Dormí poco y me costó concentrarme", ""],
    ["Buena conversación con mi hermana", "Mi hermana"],
    ["Organicé la semana con calma", "Tener un plan"],
];

export function partidaDemo(dias = 45) {
    const estado = datos.estadoInicial();
    const azar = azarFijo(7);
    const inicio = sumarDias(hoy(), -(dias - 1));

    acciones.crearPersonaje(estado, "Aria");
    estado.personaje.creadoEn = inicio;   // como si llevara 45 días jugando
    estado.vida.desde = inicio;           // y su vida contara desde entonces

    for (const m of MISIONES) acciones.crearMision(estado, m);
    for (const m of estado.misiones) m.creadaEn = inicio;

    // Dos atributos propios, para lo específico (le suman a Intelecto y a Riqueza).
    acciones.crearAtributoPropio(estado, { nombre: "Programación", icono: "💻", base: "intelecto", color: "#60a5fa" });
    acciones.crearAtributoPropio(estado, { nombre: "Finanzas", icono: "📈", base: "riqueza", color: "#a3e635" });
    const [programacion, finanzas] = estado.atributosPropios;
    estado.misiones.find((m) => m.nombre === "Estudiar programación").atributoPropio = programacion.id;
    estado.misiones.find((m) => m.nombre === "Anotar mis gastos").atributoPropio = finanzas.id;

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
            if (!juego.sePuedeMarcar(mision, fecha)) return;
            // Una semanal no se hace más veces de las que pide la semana.
            if (mision.veces && juego.vecesEnSemana(estado.completadas, mision.id, fecha) >= mision.veces) return;
            let probabilidad = MISIONES[posicion].constancia - (finDeSemana ? 0.25 : 0) + (reciente ? 0.1 : 0);
            if (esHoy) probabilidad = posicion < 2 ? 1 : 0;
            if (azar() >= probabilidad) return;
            const { xp, monedas } = juego.DIFICULTADES[mision.dificultad];
            estado.completadas.push({ misionId: mision.id, fecha, xp, monedas, atributo: mision.atributo, dificultad: mision.dificultad,
                                      atributoPropio: mision.atributoPropio || null });
            acciones.ganar(estado, { xp, monedas, atributo: mision.atributo });
        });

        // Una sesión de enfoque de 25 minutos casi todos los días hábiles.
        if (!finDeSemana && !esHoy && azar() < 0.6) {
            const { xp, monedas } = juego.DIFICULTADES.normal;
            estado.enfoque.sesiones.push({ fecha, minutos: 25, atributo: "intelecto", dificultad: "normal", xp, monedas });
            acciones.ganar(estado, { xp, monedas, atributo: "intelecto" });
        }
        // El diario de las últimas dos semanas: el ánimo sigue a lo que cumplió ese día.
        if (i >= dias - 14 && !esHoy) {
            const tocaban = juego.misionesDelDia(estado.misiones, fecha);
            const hechas = new Set(estado.completadas.filter((c) => c.fecha === fecha).map((c) => c.misionId));
            const parte = tocaban.length ? tocaban.filter((m) => hechas.has(m.id)).length / tocaban.length : 1;
            const animo = parte === 1 ? "genial" : parte >= 0.6 ? "bien" : parte >= 0.3 ? "normal" : "mal";
            const [texto, gratitud] = DIARIO[i % DIARIO.length];
            estado.diario[fecha] = { animo, texto, gratitud, pregunta: preguntaDelDia(fecha), premio: null };
        }
    }

    // Hoy lleva 5 de 8 vasos de agua.
    const agua = estado.misiones.find((m) => m.meta);
    estado.avances[`${agua.id}|${hoy()}`] = 5;

    // Tareas sueltas: una atrasada, una para hoy, dos próximas y una ya hecha.
    const tareas = [
        { nombre: "Renovar el pasaporte", fecha: sumarDias(hoy(), -2), dificultad: "normal", atributo: "riqueza" },
        { nombre: "Pagar el recibo de la luz", fecha: hoy(), dificultad: "facil", atributo: "riqueza" },
        { nombre: "Entregar el informe del curso", fecha: sumarDias(hoy(), 3), dificultad: "dificil", atributo: "intelecto" },
        { nombre: "Comprar el regalo de Ana", fecha: sumarDias(hoy(), 9), dificultad: "facil", atributo: "carisma" },
        { nombre: "Llevar la bici al taller", fecha: sumarDias(hoy(), -3), dificultad: "normal", atributo: "fuerza" },
    ];
    for (const t of tareas) acciones.crearTarea(estado, t);
    const hecha = estado.tareas[estado.tareas.length - 1];
    acciones.alternarTarea(estado, hecha.id);
    hecha.hechaEn = sumarDias(hoy(), -3);   // la hizo el día que vencía

    // Tres pasos de la primera misión principal ya están hechos.
    const carrera = estado.principales[0];
    for (const paso of carrera.submisiones.slice(0, 3)) acciones.alternarSubmision(estado, carrera.id, paso.id);

    acciones.revisarCambios(estado, antes);
    estado.ultimaVisita = hoy();
    estado.ultimoAvisoEscudo = hoy();   // para que no salgan avisos viejos al abrir
    return estado;
}
