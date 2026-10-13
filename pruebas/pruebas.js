// pruebas.js — Pruebas automáticas de las reglas del juego.
//
// Cómo usarlas: con la app abierta en tu compu (ver README), entra a
//     http://localhost:8000/pruebas/
// y verás una lista: ✅ si la regla funciona, ❌ si algo se rompió.
//
// Cada prueba crea una partida nueva EN MEMORIA, hace algo y comprueba el
// resultado. Nunca usan localStorage, así que no tocan tu partida guardada.
//
// Sirven para cambiar el código sin miedo: si después de un cambio todas
// siguen en verde, las reglas del juego siguen funcionando igual.

import * as datos from "../js/datos.js";
import * as acciones from "../js/acciones.js";
import * as juego from "../js/juego.js";
import * as campana from "../js/campana.js";
import * as desafios from "../js/desafios.js";
import { calcularResumen, semanaPorMostrar, resumenSemana } from "../js/resumen.js";
import { resumenParaAvisos, avisosDeMisiones } from "../js/avisos.js";
import * as torre from "../js/torre.js";
import * as vida from "../js/vida.js";
import * as diario from "../js/diario.js";
import * as pacto from "../js/pacto.js";
import * as libro from "../js/libro.js";
import * as eventos from "../js/eventos.js";
import * as rituales from "../js/rituales.js";
import * as cofre from "../js/cofre.js";
import * as mapa from "../js/mapa.js";
import * as mascota from "../js/mascota.js";
import * as maestro from "../js/maestro.js";
import * as vistas from "../js/vistas.js";
import * as arcade from "../js/arcade.js";
import * as nube from "../js/nube.js";
import { VERSION_APP, NOVEDADES, novedadesPorVer } from "../js/novedades.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "../js/plantillas.js";
import { hoy, sumarDias, diasEntre, diaDeSemana, lunesDe } from "../js/fechas.js";
import * as avatar from "../js/avatar.js";
import { dibujarAvatar, dibujarMascota, dibujarObjeto, dibujarEscenario } from "../js/dibujo.js";
import { partidaDemo } from "./demo.js";


// ===== Herramientas para escribir pruebas =====

const pruebas = [];

function prueba(nombre, funcion) {
    pruebas.push({ nombre, funcion });
}

// Compara dos valores (los pasa a texto JSON para poder comparar listas y objetos).
function igual(real, esperado, que = "el resultado") {
    const a = JSON.stringify(real);
    const b = JSON.stringify(esperado);
    if (a !== b) throw new Error(`${que}: esperaba ${b} y salió ${a}`);
}

function cierto(valor, que) {
    if (!valor) throw new Error(`debía cumplirse: ${que}`);
}

// Como debeFallar, pero para funciones asíncronas (las que usan await).
async function debeFallarAsync(funcion, texto) {
    try {
        await funcion();
    } catch (error) {
        if (!error.message.includes(texto)) throw new Error(`falló con otro mensaje: «${error.message}»`);
        return;
    }
    throw new Error(`debía fallar con «${texto}» y no falló`);
}

// La función debe fallar con un mensaje que contenga "texto".
function debeFallar(funcion, texto) {
    try {
        funcion();
    } catch (error) {
        if (!error.message.includes(texto)) throw new Error(`falló con otro mensaje: «${error.message}»`);
        return;
    }
    throw new Error(`debía fallar con «${texto}» y no falló`);
}

const dia = (n) => sumarDias(hoy(), n);   // dia(-1) = ayer, dia(-7) = hace una semana

// Una partida nueva con su personaje. Los eventos del día van apagados: si no, las pruebas
// darían otros números según la fecha en que se corran (las de eventos los encienden).
function partidaNueva() {
    const estado = datos.estadoInicial();
    acciones.crearPersonaje(estado, "Prueba");
    estado.ajustes.eventos = false;
    return estado;
}

function crearMision(estado, cambios = {}) {
    acciones.crearMision(estado, { nombre: "Leer", dificultad: "normal", atributo: "intelecto", ...cambios });
    return estado.misiones[estado.misiones.length - 1];
}

// Hace como si la partida (y sus misiones) existieran desde hace "dias" días.
function envejecer(estado, dias) {
    estado.personaje.creadoEn = dia(-dias);
    for (const mision of estado.misiones) mision.creadaEn = dia(-dias);
}

// Como envejecer(), y además la vida empieza a contar desde ese día (para probar la vida).
function vidaDesde(estado, dias) {
    envejecer(estado, dias);
    estado.vida.desde = dia(-dias);
}

// Marca una misión en cualquier fecha. La app solo deja marcar hoy o ayer;
// aquí escribimos el historial directamente para poder probar el pasado.
function marcarEn(estado, mision, fecha) {
    const { xp, monedas } = juego.DIFICULTADES[mision.dificultad];
    estado.completadas.push({ misionId: mision.id, fecha, xp, monedas, atributo: mision.atributo, dificultad: mision.dificultad });
    acciones.ganar(estado, { xp, monedas, atributo: mision.atributo });
}

// Igual que app.js: foto de antes, acción, y revisar qué cambió
// (ahí se entregan los premios de jefes y logros).
function jugar(estado, accion) {
    const antes = acciones.foto(estado);
    accion();
    return acciones.revisarCambios(estado, antes);
}


// ===== Fechas =====

prueba("Fechas: sumar días cruza meses y años bisiestos", () => {
    igual(sumarDias("2024-02-28", 2), "2024-03-01");
    igual(sumarDias("2025-01-01", -1), "2024-12-31");
    igual(diasEntre("2024-12-31", "2025-01-02"), 2);
});

prueba("Fechas: la semana empieza en lunes (0) y termina en domingo (6)", () => {
    igual(diaDeSemana("2024-01-01"), 0);   // fue lunes
    igual(diaDeSemana("2024-01-07"), 6);   // fue domingo
});


// ===== Niveles =====

prueba("Niveles: pasar del nivel N al N+1 cuesta 100 × N de XP", () => {
    igual(juego.calcularNivel(0).nivel, 1);
    igual(juego.calcularNivel(99).nivel, 1);
    igual(juego.calcularNivel(100).nivel, 2);
    igual(juego.calcularNivel(299).nivel, 2);    // 100 + 200 = 300 para llegar al 3
    igual(juego.calcularNivel(300).nivel, 3);
    igual(juego.calcularNivel(150).xpEnNivel, 50);
    igual(juego.calcularNivel(50, juego.BASE_ATRIBUTO).nivel, 2);   // los atributos suben más rápido
});


// ===== Misiones diarias =====

prueba("Completar una misión da su XP, sus monedas y sube su atributo", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    acciones.completarMision(estado, mision.id);
    // Un héroe nuevo tiene la vida llena: está en plena forma y gana 10 % más (normal: 25 → 28 XP, 10 → 11 monedas).
    igual(estado.personaje.xp, 28);
    igual(estado.personaje.monedas, 11);
    igual(estado.atributos.intelecto, 28);
});

prueba("No se puede completar la misma misión dos veces el mismo día", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    acciones.completarMision(estado, mision.id);
    debeFallar(() => acciones.completarMision(estado, mision.id), "ya estaba completada");
});

prueba("Desmarcar una misión devuelve exactamente lo que dio", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado, { dificultad: "dificil" });
    acciones.completarMision(estado, mision.id);
    acciones.desmarcarMision(estado, mision.id);
    igual([estado.personaje.xp, estado.personaje.monedas, estado.atributos.intelecto], [0, 0, 0]);
});

prueba("Editar una misión no cambia lo que ya ganaste con ella", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);                       // normal: 25 XP (+10 % en plena forma = 28)
    acciones.completarMision(estado, mision.id);
    acciones.editarMision(estado, { id: mision.id, nombre: "Leer mucho", dificultad: "dificil", atributo: "fuerza" });
    igual(estado.personaje.xp, 28, "la XP ganada");
    acciones.desmarcarMision(estado, mision.id);              // devuelve 28, no 55
    igual([estado.personaje.xp, estado.atributos.intelecto, estado.atributos.fuerza], [0, 0, 0]);
});

prueba("Se puede marcar ayer, pero no días más viejos", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    envejecer(estado, 5);
    acciones.completarMision(estado, mision.id, dia(-1));
    igual(estado.completadas[0].fecha, dia(-1));
    debeFallar(() => acciones.completarMision(estado, mision.id, dia(-2)), "hoy o de ayer");
});

prueba("Días de la semana: una misión solo se puede completar el día que toca", () => {
    const estado = partidaNueva();
    const otroDia = (diaDeSemana(hoy()) + 3) % 7;
    const mision = crearMision(estado, { dias: [otroDia] });
    igual(juego.tocaEseDia(mision, hoy()), false);
    igual(juego.misionesDelDia(estado.misiones, hoy()).length, 0);
    debeFallar(() => acciones.completarMision(estado, mision.id), "no tocaba");
});

prueba("Días de la semana: los 7 días se guardan como «todos» y 0 días no se acepta", () => {
    const estado = partidaNueva();
    igual(crearMision(estado, { dias: [0, 1, 2, 3, 4, 5, 6] }).dias, null);
    igual(crearMision(estado, { dias: ["4", "0"] }).dias, [0, 4]);   // del formulario llegan como texto
    debeFallar(() => crearMision(estado, { dias: [] }), "al menos un día");
});

prueba("Reordenar: mover una misión hacia arriba la intercambia con la anterior", () => {
    const estado = partidaNueva();
    crearMision(estado, { nombre: "A" });
    crearMision(estado, { nombre: "B" });
    const c = crearMision(estado, { nombre: "C" });
    acciones.moverMision(estado, c.id, -1);
    igual(estado.misiones.map((m) => m.nombre), ["A", "C", "B"]);
    acciones.moverMision(estado, c.id, -1);
    acciones.moverMision(estado, c.id, -1);   // ya está arriba: no pasa nada
    igual(estado.misiones.map((m) => m.nombre), ["C", "A", "B"]);
});

prueba("Archivar y restaurar: el tiempo archivada queda como pausa", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    acciones.archivarMision(estado, mision.id);
    igual(juego.misionesDelDia(estado.misiones, hoy()).length, 0, "misiones de hoy con la misión archivada");
    acciones.restaurarMision(estado, mision.id);
    igual(mision.archivadaEn, null);
    igual(mision.pausas, [{ desde: hoy(), hasta: hoy() }]);
});


// ===== Misiones semanales y con cantidad =====

prueba("Semanales: se pueden marcar cualquier día y cuentan las veces de lunes a domingo", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado, { frecuencia: "semana", veces: 3 });
    igual([mision.dias, mision.veces], [null, 3]);
    igual(juego.sePuedeMarcar(mision, hoy()), true);
    acciones.completarMision(estado, mision.id);
    igual(juego.vecesEnSemana(estado.completadas, mision.id, hoy()), 1);
    marcarEn(estado, mision, dia(-7));   // hace 7 días era otra semana: no cuenta para esta
    igual(juego.vecesEnSemana(estado.completadas, mision.id, hoy()), 1);
    debeFallar(() => crearMision(estado, { frecuencia: "semana", veces: 7 }), "entre 1 y 6");
});

prueba("Semanales: no rompen la racha ni cuentan para los días perfectos", () => {
    const estado = partidaNueva();
    const diaria = crearMision(estado);
    const semanal = crearMision(estado, { nombre: "Gym", frecuencia: "semana", veces: 2 });
    envejecer(estado, 3);
    for (const n of [-3, -2, -1, 0]) marcarEn(estado, diaria, dia(n));   // el gym, ningún día
    igual(juego.calcularRacha(estado, hoy()).actual, 4, "la racha");
    igual(juego.resumen(estado, hoy()).diasPerfectos, 4, "los días perfectos");
    igual(juego.misionesDelDia(estado.misiones, hoy()), [diaria], "las que tocan hoy");
    igual(juego.semanalesDelDia(estado.misiones, hoy()), [semanal], "las semanales de hoy");
});

prueba("Cantidad: al llegar a la meta se completa sola, y si bajas se desmarca", () => {
    const estado = partidaNueva();
    igual(crearMision(estado, { cantidad: "" }).meta, null, "sin cantidad es una misión normal");
    const agua = crearMision(estado, { nombre: "Agua", cantidad: "3", unidad: "vasos" });
    igual(agua.meta, { cantidad: 3, unidad: "vasos" });
    acciones.fijarCantidad(estado, agua.id, hoy(), 2);
    igual([juego.cantidadDe(estado, agua, hoy()), estado.completadas.length], [2, 0]);
    igual(acciones.fijarCantidad(estado, agua.id, hoy(), 3).xp, 28, "al llegar a 3 se completa (en plena forma)");
    igual(estado.completadas.length, 1);
    acciones.fijarCantidad(estado, agua.id, hoy(), 2);
    igual([estado.completadas.length, estado.personaje.xp], [0, 0], "al bajar de la meta se desmarca");
    debeFallar(() => acciones.fijarCantidad(estado, agua.id, hoy(), -1), "número entero");
});


// ===== Rachas y escudos =====

prueba("Racha: cuenta los días seguidos con al menos una misión", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    envejecer(estado, 4);
    for (const n of [-4, -3, -1, 0]) marcarEn(estado, mision, dia(n));   // falló hace 2 días
    const racha = juego.calcularRacha(estado, hoy());
    igual([racha.actual, racha.mejor], [2, 2]);
});

prueba("Racha: a los 7 días ganas un escudo, y el escudo salva un día fallado", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    envejecer(estado, 9);
    for (const n of [-9, -8, -7, -6, -5, -4, -3, -1, 0]) marcarEn(estado, mision, dia(n));   // falló hace 2 días
    const racha = juego.calcularRacha(estado, hoy());
    igual(racha.actual, 9, "la racha sigue");
    igual(racha.escudos, 0, "el escudo se gastó");
    cierto(racha.protegidos.has(dia(-2)), "el día fallado quedó protegido");
});

prueba("Racha: los días de descanso no la rompen", () => {
    const estado = partidaNueva();
    // Solo toca hoy y hace 2 días; los demás días son de descanso.
    const mision = crearMision(estado, { dias: [diaDeSemana(hoy()), diaDeSemana(dia(-2))] });
    envejecer(estado, 4);
    marcarEn(estado, mision, dia(-2));
    marcarEn(estado, mision, hoy());
    igual(juego.calcularRacha(estado, hoy()).actual, 2);
});

prueba("Racha: los días que una misión estuvo archivada no cuentan como fallados", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    envejecer(estado, 6);
    mision.pausas = [{ desde: dia(-4), hasta: dia(-1) }];   // pausada 3 días
    for (const n of [-6, -5, -1, 0]) marcarEn(estado, mision, dia(n));
    igual(juego.calcularRacha(estado, hoy()).actual, 4);
});


// ===== Misiones principales y jefes =====

prueba("Misión principal: cada paso da premio y terminarla da un extra", () => {
    const estado = partidaNueva();
    acciones.crearPrincipal(estado, { nombre: "Meta", atributo: "riqueza", submisiones: "Paso 1\nPaso 2" });
    const meta = estado.principales[0];
    acciones.alternarSubmision(estado, meta.id, meta.submisiones[0].id);
    igual(estado.personaje.xp, 30);
    acciones.alternarSubmision(estado, meta.id, meta.submisiones[1].id);
    igual(estado.personaje.xp, 30 + 30 + 150);
    igual(meta.completadaEn, hoy());
});

prueba("Jefes: las diarias hacen poco daño y los pasos de una misión principal, mucho", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado, { atributo: "fuerza" });   // normal: 8 de daño
    acciones.completarMision(estado, mision.id);
    let jefe = campana.estadoCampanas(estado).fuerza;
    igual([jefe.indice, jefe.vida, jefe.vidaMax], [0, 72, 80]);

    acciones.crearPrincipal(estado, { nombre: "Meta", atributo: "fuerza", submisiones: "Paso 1\nPaso 2" });
    const meta = estado.principales[0];
    acciones.alternarSubmision(estado, meta.id, meta.submisiones[0].id);   // 40 de daño
    jefe = campana.estadoCampanas(estado).fuerza;
    igual(jefe.vida, 32);
    igual(campana.estadoCampanas(estado).intelecto.dano, 0, "daño al jefe de otra categoría");
});

prueba("Jefes: al caer uno recibes su premio, y si desmarcas lo que lo derrotó, se devuelve", () => {
    const estado = partidaNueva();
    acciones.crearPrincipal(estado, { nombre: "Meta", atributo: "fuerza", submisiones: "Paso 1\nPaso 2" });
    const meta = estado.principales[0];
    const [paso1, paso2] = meta.submisiones;

    jugar(estado, () => acciones.alternarSubmision(estado, meta.id, paso1.id));              // 40 de daño
    const celebraciones = jugar(estado, () => acciones.alternarSubmision(estado, meta.id, paso2.id));   // +40 +100
    igual(campana.estadoCampanas(estado).fuerza.derrotados, 1);
    igual(estado.campana.recompensados.fuerza, 1);
    cierto(celebraciones.some((c) => c.etiqueta === "¡Jefe derrotado!"), "hay celebración del jefe");
    igual(estado.personaje.xp, 30 + 30 + 150 + campana.premioJefe(1).xp);

    jugar(estado, () => acciones.alternarSubmision(estado, meta.id, paso2.id));              // deshacer
    igual(estado.campana.recompensados.fuerza, 0, "premios de jefe entregados");
    igual(estado.personaje.xp, 30, "la XP vuelve a ser la del primer paso");
});

prueba("Jefes: cada jefe tiene más vida que el anterior y hay 5 por categoría", () => {
    for (const lista of Object.values(campana.CAMPANAS)) igual(lista.jefes.length, campana.VIDAS.length);
    for (let i = 1; i < campana.VIDAS.length; i++) cierto(campana.VIDAS[i] > campana.VIDAS[i - 1], "vida creciente");
});

prueba("Partida+: tras los 5 jefes empieza la ronda 2, con más vida y mejores premios", () => {
    const estado = partidaNueva();
    const pasos = Array.from({ length: 38 }, (_, i) => `Paso ${i + 1}`).join("\n");
    acciones.crearPrincipal(estado, { nombre: "Meta enorme", atributo: "fuerza", submisiones: pasos });
    // 38 pasos × 40 = 1520 de daño; la ronda 1 suma 1500 de vida.
    const celebraciones = jugar(estado, () => { for (const paso of estado.principales[0].submisiones) paso.hecha = true; });
    const c = campana.estadoCampanas(estado).fuerza;
    igual([c.derrotados, c.ronda, c.indice], [5, 2, 0]);
    igual([c.vidaMax, c.vida], [120, 100], "el primer jefe de la ronda 2 tiene 50 % más de vida");
    igual(campana.premioJefe(6), { xp: 150, monedas: 75 }, "y da 50 % más de premio");
    igual(estado.campana.recompensados.fuerza, 5, "premios entregados");
    cierto(celebraciones.some((x) => x.etiqueta === "¡Campaña completada!"), "avisa que empieza la Partida+");
});


// ===== Tareas sueltas =====

prueba("Tareas: dan su premio una vez, se pueden deshacer y las hechas no se borran", () => {
    const estado = partidaNueva();
    acciones.crearTarea(estado, { nombre: "Pagar la luz", fecha: hoy(), dificultad: "dificil", atributo: "riqueza" });
    const tarea = estado.tareas[0];
    acciones.alternarTarea(estado, tarea.id);
    igual([estado.personaje.xp, estado.personaje.monedas, estado.atributos.riqueza], [55, 22, 55]);   // difícil +10 %
    debeFallar(() => acciones.borrarTarea(estado, tarea.id), "ya está hecha");
    acciones.alternarTarea(estado, tarea.id);   // deshacer
    igual([estado.personaje.xp, estado.personaje.monedas, tarea.hechaEn], [0, 0, null]);
    acciones.borrarTarea(estado, tarea.id);
    igual(estado.tareas.length, 0);
    debeFallar(() => acciones.crearTarea(estado, { nombre: "X", fecha: "2026-02-30", dificultad: "facil", atributo: "fuerza" }),
               "para cuándo");
});

prueba("Tareas: golpean al jefe de su atributo como una misión de su dificultad", () => {
    const estado = partidaNueva();
    acciones.crearTarea(estado, { nombre: "Informe", fecha: dia(3), dificultad: "normal", atributo: "intelecto" });
    acciones.alternarTarea(estado, estado.tareas[0].id);
    igual(campana.estadoCampanas(estado).intelecto.dano, campana.DANO.diaria.normal);
});


// ===== Modo enfoque y diario =====

prueba("Enfoque: antes de tiempo no da nada; al terminar da lo mismo que una misión", () => {
    const estado = partidaNueva();
    const inicio = Date.now();
    acciones.empezarEnfoque(estado, { minutos: "25", atributo: "intelecto" }, inicio);
    debeFallar(() => acciones.empezarEnfoque(estado, { minutos: "25", atributo: "intelecto" }), "en curso");
    igual(acciones.revisarEnfoque(estado, inicio + 24 * 60 * 1000), null, "a los 24 minutos");
    const resultado = acciones.revisarEnfoque(estado, inicio + 25 * 60 * 1000);
    igual(resultado.celebraciones.length, 1, "celebraciones");
    igual([estado.personaje.xp, estado.personaje.monedas, estado.atributos.intelecto], [28, 11, 28]);   // normal +10 %
    igual(estado.enfoque.activo, null);
    igual(campana.estadoCampanas(estado).intelecto.dano, campana.DANO.diaria.normal, "daño al jefe");
});

prueba("Enfoque: cancelar a la mitad no da premio", () => {
    const estado = partidaNueva();
    acciones.empezarEnfoque(estado, { minutos: "15", atributo: "fuerza" });
    acciones.cancelarEnfoque(estado);
    igual([estado.enfoque.activo, estado.enfoque.sesiones.length, estado.personaje.xp], [null, 0, 0]);
    debeFallar(() => acciones.empezarEnfoque(estado, { minutos: "40", atributo: "fuerza" }), "minutos");
});

prueba("Diario: guarda la frase y el ánimo de hoy o de ayer; vacío se borra", () => {
    const estado = partidaNueva();
    acciones.escribirDiario(estado, { fecha: hoy(), animo: "bien", texto: "  Buen día  " });
    igual(estado.diario[hoy()], { animo: "bien", texto: "Buen día", gratitud: "", pregunta: diario.preguntaDelDia(hoy()),
                                  premio: diario.PREMIO_DIARIO });
    acciones.escribirDiario(estado, { fecha: hoy(), animo: "", texto: "" });
    igual(hoy() in estado.diario, false);
    debeFallar(() => acciones.escribirDiario(estado, { fecha: dia(-2), animo: "bien", texto: "" }), "hoy o de ayer");
    debeFallar(() => acciones.escribirDiario(estado, { fecha: hoy(), animo: "feliz", texto: "" }), "cómo te fue");
});


// ===== Desafío de la semana y «Tu semana» =====

prueba("Desafío semanal: se elige uno por semana y no cambia al volver a abrir", () => {
    const estado = partidaNueva();
    crearMision(estado);
    cierto(acciones.asegurarDesafio(estado) !== null, "se crea el de esta semana");
    igual(acciones.asegurarDesafio(estado), null, "la segunda vez no crea otro");
    igual(estado.desafios.length, 1);
    igual(estado.desafios[0].semana, lunesDe(hoy()));
    cierto(desafios.DESAFIOS[estado.desafios[0].tipo].disponible(estado, lunesDe(hoy())), "el desafío es posible");
});

prueba("Desafío semanal: no toca uno imposible para tu partida", () => {
    const estado = partidaNueva();
    crearMision(estado, { dificultad: "facil" });
    envejecer(estado, 7);
    const lunes = lunesDe(hoy());
    igual(desafios.DESAFIOS.dificiles.disponible(estado, lunes), false, "sin misiones difíciles");
    igual(desafios.DESAFIOS.atributos.disponible(estado, lunes), false, "sin misiones de los 4 atributos");
    igual(desafios.DESAFIOS.total.meta(estado, lunes), 6, "80 % de las 7 que tocan");
});

prueba("Desafío semanal: si se crea a mitad de semana, pide menos", () => {
    const estado = partidaNueva();
    const lunes = lunesDe(hoy());
    const completo = desafios.elegirDesafio(estado, lunes);
    const sabado = desafios.elegirDesafio(estado, lunes, sumarDias(lunes, 5));   // quedan 2 de 7 días
    igual(sabado.tipo, completo.tipo, "el mismo desafío");
    igual(sabado.meta, Math.max(1, Math.round((completo.meta * 2) / 7)));
    cierto(sabado.meta < completo.meta, "una meta más pequeña");
});

prueba("Desafío semanal: al cumplirlo se abre el cofre una sola vez", () => {
    const estado = partidaNueva();
    estado.desafios.push({ semana: lunesDe(hoy()), tipo: "diario", meta: 1, cobradoEn: null });
    const celebraciones = jugar(estado, () => acciones.escribirDiario(estado, { fecha: hoy(), animo: "bien", texto: "" }));
    cierto(celebraciones.some((c) => c.etiqueta === "¡Desafío cumplido!"), "hay celebración del cofre");
    const { xp, monedas } = diario.PREMIO_DIARIO;   // escribir el diario también da su premio
    igual([estado.personaje.xp, estado.personaje.monedas], [desafios.COFRE.xp + xp, desafios.COFRE.monedas + monedas]);
    jugar(estado, () => {});
    igual(estado.personaje.monedas, desafios.COFRE.monedas + monedas, "el cofre no se cobra dos veces");
});

prueba("Tu semana: resume la semana pasada de lunes a domingo y se muestra hasta cerrarla", () => {
    const estado = partidaNueva();
    igual(semanaPorMostrar(estado, hoy()), null, "un personaje nuevo no tiene semana pasada");
    const mision = crearMision(estado);
    const lunesPasado = sumarDias(lunesDe(hoy()), -7);
    estado.personaje.creadoEn = lunesPasado;
    mision.creadaEn = lunesPasado;
    for (const n of [0, 2, 4, 6]) marcarEn(estado, mision, sumarDias(lunesPasado, n));   // lun, mié, vie y dom
    marcarEn(estado, mision, hoy());                                                     // esta semana: no cuenta
    estado.diario[lunesPasado] = { animo: "bien", texto: "" };

    igual(semanaPorMostrar(estado, hoy()), lunesPasado);
    const s = resumenSemana(estado, lunesPasado);
    igual([s.completadas, s.perfectos, s.cumplimiento.pct, s.animos.bien], [4, 4, 57, 1]);
    acciones.cerrarResumenSemanal(estado);
    igual(semanaPorMostrar(estado, hoy()), null, "después de cerrarla");
});


// ===== Logros y tienda =====

prueba("Logros: se desbloquean solos al cumplir la meta y pagan su recompensa", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado);
    acciones.crearLogro(estado, { nombre: "Primera misión", tipo: "total", objetivo: 1, recompensa: 50 });
    jugar(estado, () => acciones.completarMision(estado, mision.id));
    igual(estado.logros[0].desbloqueadoEn, hoy());
    igual(estado.personaje.monedas, 11 + 50);   // la misión (en plena forma) + el logro
});

prueba("Logros personales: solo se consiguen cuando tú los marcas", () => {
    const estado = partidaNueva();
    acciones.crearLogro(estado, { nombre: "Graduarme", tipo: "manual", recompensa: 200 });
    jugar(estado, () => {});
    igual(estado.logros[0].desbloqueadoEn, null);
    acciones.lograrManual(estado, estado.logros[0].id);
    igual(estado.logros[0].desbloqueadoEn, hoy());
    igual(estado.personaje.monedas, 200);
});

prueba("Tienda: canjear descuenta las monedas y no deja canjear sin saldo", () => {
    const estado = partidaNueva();
    acciones.crearRecompensa(estado, { nombre: "Película", costo: 100 });
    const recompensa = estado.recompensas[0];
    debeFallar(() => acciones.canjear(estado, recompensa.id), "Te faltan 100 monedas");
    acciones.ganar(estado, { monedas: 130 });
    acciones.canjear(estado, recompensa.id);
    igual(estado.personaje.monedas, 30);
    igual(estado.canjes.length, 1);
});


// ===== Resumen =====

prueba("Resumen: el cumplimiento cuenta solo las misiones que tocaban", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { nombre: "Leer" });
    const gym = crearMision(estado, { nombre: "Gym", atributo: "fuerza" });
    envejecer(estado, 6);                       // 7 días jugando (con hoy)
    marcarEn(estado, leer, dia(-1));
    marcarEn(estado, gym, dia(-1));             // ayer: día perfecto
    marcarEn(estado, leer, hoy());

    const r = calcularResumen(estado, hoy(), 7);
    igual(r.porDia.length, 7);
    igual(r.cumplimiento, { hechas: 3, total: 14, pct: 21 });
    igual(r.perfectos, 1);
    igual(r.xp, 75);
    igual(r.cambio, null, "sin periodo anterior completo no hay comparación");
    igual(r.misiones.map((m) => [m.nombre, m.hechas, m.total]), [["Leer", 2, 7], ["Gym", 1, 7]]);
    igual(r.descuidado, "carisma", "el atributo con menos misiones (el primero de los empatados)");
});

prueba("Resumen: los días de descanso y los de antes de empezar no cuentan", () => {
    const estado = partidaNueva();
    const mision = crearMision(estado, { dias: [diaDeSemana(hoy())] });   // solo toca hoy
    envejecer(estado, 2);                                                  // 3 días jugando
    marcarEn(estado, mision, hoy());
    const r = calcularResumen(estado, hoy(), 7);
    igual(r.cumplimiento, { hechas: 1, total: 1, pct: 100 });
    igual(r.diasConMisiones, 1);
    igual(r.porDia.filter((d) => d.antes).length, 4, "días antes de empezar a jugar");
});


// ===== Notificaciones =====

prueba("Notificaciones: los horarios se ordenan, no se repiten y validan la hora", () => {
    const estado = partidaNueva();
    acciones.agregarHorario(estado, { hora: "20:00" });
    acciones.agregarHorario(estado, { hora: "07:30", dias: ["0", "1", "2", "3", "4"] });
    igual(estado.avisos.horarios.map((h) => [h.hora, h.dias]), [["07:30", [0, 1, 2, 3, 4]], ["20:00", null]]);
    debeFallar(() => acciones.agregarHorario(estado, { hora: "20:00" }), "Ya tienes");
    debeFallar(() => acciones.agregarHorario(estado, { hora: "25:00" }), "Elige una hora");
    acciones.quitarHorario(estado, estado.avisos.horarios[0].id);
    igual(estado.avisos.horarios.map((h) => h.hora), ["20:00"]);
});

prueba("Notificaciones: el texto dice lo que falta hoy y, de noche, recuerda el diario", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { nombre: "Leer" });
    crearMision(estado, { nombre: "Gym" });
    acciones.crearTarea(estado, { nombre: "Pagar la luz", fecha: hoy(), dificultad: "facil", atributo: "riqueza" });
    acciones.completarMision(estado, leer.id);

    let deHoy = resumenParaAvisos(estado, hoy()).dias[hoy()];
    igual([deHoy.titulo, deHoy.insignia], ["⚔️ Te falta 1 misión", 2]);
    igual(deHoy.cuerpo, "Gym\n📌 Pagar la luz\n🔥 Racha de 1 día en juego");
    cierto(deHoy.cuerpoNoche.endsWith(`📓 Diario: ${diario.preguntaDelDia(hoy())}`), "de noche recuerda el diario con la pregunta del día");

    const manana = resumenParaAvisos(estado, hoy()).dias[dia(1)];
    igual(manana.titulo, "⚔️ Te faltan 2 misiones", "mañana todavía no has hecho nada");

    acciones.completarMision(estado, estado.misiones[1].id);
    acciones.alternarTarea(estado, estado.tareas[0].id);
    acciones.escribirDiario(estado, { fecha: hoy(), animo: "bien", texto: "" });
    deHoy = resumenParaAvisos(estado, hoy()).dias[hoy()];
    igual([deHoy.titulo, deHoy.insignia], ["✨ ¡Todo listo por hoy!", 0]);
    igual(deHoy.cuerpoNoche, deHoy.cuerpo, "con el diario escrito no lo recuerda");
});


prueba("Aviso de misión: la hora es opcional y se valida", () => {
    const estado = partidaNueva();
    igual(crearMision(estado, { aviso: "18:00" }).aviso, "18:00");
    igual(crearMision(estado, { aviso: "" }).aviso, null, "sin aviso");
    debeFallar(() => crearMision(estado, { aviso: "25:00" }), "hora válida");
});

prueba("Aviso de misión: al servidor solo le llega el número y hasta cuándo no avisar", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { nombre: "Leer", aviso: "18:00" });
    const gym = crearMision(estado, { nombre: "Gym", aviso: "07:00", frecuencia: "semana", veces: 1 });
    crearMision(estado, { nombre: "Sin aviso" });
    igual(avisosDeMisiones(estado, hoy()), [
        { id: leer.id, hora: "18:00", dias: null, saltarHasta: null },
        { id: gym.id, hora: "07:00", dias: null, saltarHasta: null },
    ]);
    acciones.completarMision(estado, leer.id);   // hecha hoy: no avisar hasta hoy
    acciones.completarMision(estado, gym.id);    // semana cumplida: no avisar hasta el domingo
    igual(avisosDeMisiones(estado, hoy()).map((a) => a.saltarHasta), [hoy(), sumarDias(lunesDe(hoy()), 6)]);
    cierto(!JSON.stringify(avisosDeMisiones(estado, hoy())).includes("Leer"), "el nombre no sale del teléfono");
});

prueba("Aviso de misión: el texto es solo de esa misión, y desaparece al hacerla", () => {
    const estado = partidaNueva();
    const agua = crearMision(estado, { nombre: "Beber agua", aviso: "15:00", cantidad: "8", unidad: "vasos" });
    acciones.fijarCantidad(estado, agua.id, hoy(), 3);
    let resumen = resumenParaAvisos(estado, hoy());
    igual(resumen.dias[hoy()].porMision[agua.id],
          { titulo: "⏰ Beber agua", cuerpo: "Llevas 3 de 8 vasos.\n+25 XP · +10 monedas\n❤️ Si no la haces hoy pierdes 8 de vida" });   // normal
    igual(resumen.nombres[agua.id], "Beber agua");
    acciones.fijarCantidad(estado, agua.id, hoy(), 8);
    resumen = resumenParaAvisos(estado, hoy());
    igual(agua.id in resumen.dias[hoy()].porMision, false, "ya hecha: sin aviso propio");
});


// ===== Torre del héroe =====

const NIVELES_1 = { fuerza: 1, intelecto: 1, carisma: 1, riqueza: 1 };

prueba("Torre: tu poder sale de tus atributos, y cada 5 pisos hay un guardián más fuerte", () => {
    const debil = torre.heroeDeLaTorre(NIVELES_1);
    const fuerte = torre.heroeDeLaTorre({ fuerza: 6, intelecto: 6, carisma: 6, riqueza: 6 });
    cierto(fuerte.vidaMax > debil.vidaMax && fuerte.ataque > debil.ataque && fuerte.hechizo > debil.hechizo, "más atributos, más poder");
    cierto(fuerte.pociones > debil.pociones && fuerte.critico > debil.critico, "Riqueza da pociones y críticos");
    const [p4, p5, p6] = [4, 5, 6].map(torre.monstruoDelPiso);
    igual([p4.guardian, p5.guardian, p6.guardian], [false, true, false]);
    cierto(p5.vidaMax > p6.vidaMax, "el guardián del piso 5 aguanta más que el monstruo del 6");
    igual(torre.MONSTRUOS.length, 20, "los 20 jefes");
});

prueba("Torre: atacar daña; defenderse reduce el golpe del monstruo", () => {
    const p = torre.nuevaPartida(NIVELES_1, 42);
    const vidaAntes = p.enemigo.vida;
    torre.actuar(p, "atacar");
    cierto(p.enemigo.vida < vidaAntes, "el monstruo perdió vida");

    const a = torre.nuevaPartida(NIVELES_1, 7);
    const b = torre.nuevaPartida(NIVELES_1, 7);
    a.enemigo.intencion = b.enemigo.intencion = "fuerte";
    torre.actuar(a, "defender");
    torre.actuar(b, "pocion");   // gasta el turno sin defenderse
    const perdidaA = a.heroe.vidaMax - a.heroe.vida;
    const perdidaB = b.heroe.vidaMax - b.heroe.vida;
    cierto(perdidaA < perdidaB, `defenderse duele menos (${perdidaA} contra ${perdidaB})`);
});

prueba("Torre: al vencer eliges una de tres mejoras y subes de piso con los hechizos recargados", () => {
    const p = torre.nuevaPartida(NIVELES_1, 3);
    p.heroe.mana = 0;
    p.enemigo.vida = 1;
    const eventos = torre.actuar(p, "atacar");
    cierto(eventos.some((e) => e.tipo === "derrotado"), "el monstruo cae");
    igual(p.fase, "mejora");
    igual(new Set(p.opciones).size, 3, "tres mejoras distintas");
    debeFallar(() => torre.elegirMejora(p, "inventada"), "Elige una");
    torre.elegirMejora(p, p.opciones[0]);
    igual([p.piso, p.fase, p.heroe.mana], [2, "batalla", p.heroe.manaMax]);
});

prueba("Torre: sin hechizos ni pociones no se pueden usar; la misma semilla da la misma partida", () => {
    const p = torre.nuevaPartida(NIVELES_1, 9);
    p.heroe.mana = 0;
    p.heroe.pociones = 0;
    debeFallar(() => torre.actuar(p, "hechizo"), "hechizos");
    debeFallar(() => torre.actuar(p, "pocion"), "pociones");
    const jugar = () => { const x = torre.nuevaPartida(NIVELES_1, 123); for (let i = 0; i < 3; i++) torre.actuar(x, "atacar"); return x; };
    igual(jugar(), jugar(), "dos partidas con la misma semilla");
});

prueba("Torre: gasta una ficha al empezar, se puede seguir después y al caer se cobra el premio", () => {
    const estado = partidaNueva();
    const fichas = arcade.fichasDisponibles(estado);
    acciones.empezarTorre(estado, 5);
    acciones.empezarTorre(estado, 5);   // ya hay una partida: se sigue esa
    igual(arcade.fichasDisponibles(estado), fichas - 1, "solo una ficha");
    const p = estado.arcade.torre;
    p.piso = 4;                           // como si hubiera superado 3 pisos
    p.heroe.vida = 1;
    p.enemigo.intencion = "golpe";
    acciones.accionTorre(estado, "atacar");   // ataca, el monstruo responde y lo derriba
    igual(p.fase, "fin", "cayó");
    const r = acciones.terminarTorre(estado);
    igual([r.pisos, r.premio], [3, torre.premio(3)]);
    igual([estado.personaje.monedas, estado.atributos.carisma], [torre.premio(3).monedas, torre.premio(3).xp]);
    igual([estado.arcade.records.torre, estado.arcade.torre], [3, null]);
    igual(torre.premio(100), { monedas: torre.PREMIO.maxMonedas, xp: torre.PREMIO.maxXp }, "el premio tiene un máximo");
});


// ===== Más profesional (v15) =====

prueba("Momento del día: se guarda, se valida y Hoy agrupa mañana, tarde, noche y el resto", () => {
    const estado = partidaNueva();
    const noche = crearMision(estado, { nombre: "Leer", momento: "noche" });
    const libre = crearMision(estado, { nombre: "Agua" });
    const manana = crearMision(estado, { nombre: "Correr", momento: "manana" });
    igual([noche.momento, libre.momento], ["noche", null]);
    debeFallar(() => crearMision(estado, { momento: "madrugada" }), "momento");
    igual(juego.agruparPorMomento(estado.misiones).map((g) => [g.clave, g.misiones.map((m) => m.nombre)]),
          [["manana", ["Correr"]], ["noche", ["Leer"]], [null, ["Agua"]]]);
    igual(manana.momento, "manana");
});

prueba("Ordenar: el orden nuevo se guarda y las archivadas quedan al final", () => {
    const estado = partidaNueva();
    const [a, b, c] = ["A", "B", "C"].map((nombre) => crearMision(estado, { nombre }));
    const vieja = crearMision(estado, { nombre: "Vieja" });
    acciones.archivarMision(estado, vieja.id);
    acciones.ordenarMisiones(estado, [c.id, a.id, b.id]);
    igual(estado.misiones.map((m) => m.nombre), ["C", "A", "B", "Vieja"]);
    debeFallar(() => acciones.ordenarMisiones(estado, [c.id, a.id]), "orden");
});

prueba("Ficha de un hábito: racha, mejor racha y porcentaje del último mes", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { nombre: "Leer" });
    envejecer(estado, 9);
    for (const n of [-9, -8, -7, -5, -4, -3, -2, -1]) marcarEn(estado, leer, dia(n));   // falló hace 6 días
    const s = juego.estadisticasMision(estado, leer, hoy());
    igual([s.racha, s.mejor, s.total, s.unidad], [5, 5, 8, "día"], "hoy aún no la hace: no rompe la racha");
    igual(s.porcentaje, Math.round((8 / 9) * 100), "8 de los 9 días que tocaban");
    igual(s.dias.length, 84, "12 semanas de calendario");
    igual(s.dias.find((d) => d.fecha === dia(-6)).tipo, "fallo");
    igual(s.dias.find((d) => d.fecha === hoy()).tipo, "pendiente");
});

prueba("Ficha de un hábito semanal: la racha se cuenta en semanas cumplidas", () => {
    const estado = partidaNueva();
    const gym = crearMision(estado, { nombre: "Gym", frecuencia: "semana", veces: 2 });
    const lunes = lunesDe(hoy());
    gym.creadaEn = estado.personaje.creadoEn = sumarDias(lunes, -21);
    for (const n of [-21, -20, -14, -13, -7]) marcarEn(estado, gym, sumarDias(lunes, n));   // la semana pasada solo 1 vez
    const s = juego.estadisticasMision(estado, gym, hoy());
    igual([s.racha, s.mejor, s.unidad], [0, 2, "semana"]);
});

prueba("Una sola vez: las tareas pueden no tener fecha y quedan en Hoy hasta hacerlas", () => {
    const estado = partidaNueva();
    acciones.crearTarea(estado, { nombre: "Llamar al banco", fecha: "", dificultad: "facil", atributo: "riqueza" });
    igual(estado.tareas[0].fecha, null);
    igual(resumenParaAvisos(estado, hoy()).dias[dia(3)].insignia, 1, "sigue pendiente días después");
});

prueba("Deshacer un canje devuelve las monedas", () => {
    const estado = partidaNueva();
    acciones.crearRecompensa(estado, { nombre: "Serie", costo: 100 });
    acciones.ganar(estado, { monedas: 150 });
    acciones.canjear(estado, estado.recompensas[0].id);
    acciones.deshacerCanje(estado);
    igual([estado.personaje.monedas, estado.canjes.length], [150, 0]);
    debeFallar(() => acciones.deshacerCanje(estado), "ningún canje");
});

prueba("Bienvenida: todas las plantillas crean misiones y premios válidos", () => {
    const estado = partidaNueva();
    acciones.aplicarBienvenida(estado, { misiones: PLANTILLAS_MISIONES.map((p) => p.id), recompensas: PLANTILLAS_RECOMPENSAS.map((r) => r.id) });
    igual([estado.misiones.length, estado.recompensas.length], [PLANTILLAS_MISIONES.length, PLANTILLAS_RECOMPENSAS.length]);
    igual(new Set(PLANTILLAS_MISIONES.map((p) => p.id)).size, PLANTILLAS_MISIONES.length, "ids distintos");
});

prueba("Novedades: la última es la versión actual y solo se muestran las que no viste", () => {
    igual(NOVEDADES[0].version, VERSION_APP);
    igual(novedadesPorVer(VERSION_APP), []);
    igual(novedadesPorVer(VERSION_APP - 1).map((n) => n.version), [VERSION_APP]);
});

prueba("Versión: la de las novedades es la misma que la del service worker", async () => {
    const texto = await (await fetch("../sw.js", { cache: "no-store" })).text();
    igual(Number(texto.match(/vida-rpg-v(\d+)/)[1]), VERSION_APP, "VERSION en sw.js");
});

prueba("Nube: la partida se cifra; con la contraseña se abre y con otra no", async () => {
    const sal = crypto.getRandomValues(new Uint8Array(16));
    const llave = await nube.derivarLlave("caballo-azul-27", sal);
    const cifrada = await nube.cifrar('{"personaje":"Aria"}', llave);
    cierto(!cifrada.datos.includes("Aria") && !atob(cifrada.datos).includes("Aria"), "no se ve el contenido");
    igual(await nube.descifrar(cifrada, llave), '{"personaje":"Aria"}');
    const otra = await nube.derivarLlave("caballo-azul-28", sal);
    await debeFallarAsync(() => nube.descifrar(cifrada, otra), "contraseña no es correcta");
});


// ===== La vida del héroe (v16) =====

prueba("Vida: empieza llena (100 + 5 por nivel) y con la vida llena estás en plena forma", () => {
    const estado = partidaNueva();
    const v = vida.calcularVida(estado, hoy());
    igual([v.puntos, v.maxima, v.nivel, v.caido], [105, 105, "forma", false]);
    acciones.ganar(estado, { xp: 100 });   // nivel 2
    igual(vida.calcularVida(estado, hoy()).maxima, 110);
});

prueba("Vida: al terminar el día pierdes por cada misión sin hacer (hoy todavía no quita)", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);                                          // normal: −8
    crearMision(estado, { nombre: "Gym", dificultad: "dificil" });            // difícil: −12
    vidaDesde(estado, 2);
    marcarEn(estado, leer, dia(-2));                                           // hace 2 días solo faltó el gym
    const v = vida.calcularVida(estado, hoy());
    igual(v.registro.map((r) => r.dano), [12, 20, 0], "hace 2 días, ayer y hoy");
    igual(v.puntos, 105 - 12 - 20);
    igual(vida.danoDelDia(estado, hoy()).dano, 20, "lo que perderías si no haces nada hoy");
});

prueba("Vida: un día malo quita máximo 30, y una tarea vencida quita 5 una sola vez", () => {
    const estado = partidaNueva();
    for (const nombre of ["A", "B", "C"]) crearMision(estado, { nombre, dificultad: "dificil" });   // 36 en un día
    vidaDesde(estado, 1);
    igual(vida.calcularVida(estado, hoy()).registro[0].dano, 30, "con tope");

    const otra = partidaNueva();
    acciones.crearTarea(otra, { nombre: "Pagar", fecha: dia(-2), dificultad: "facil", atributo: "riqueza" });
    otra.tareas[0].creadaEn = dia(-3);
    vidaDesde(otra, 3);
    igual(vida.calcularVida(otra, hoy()).registro.map((r) => r.dano), [0, 5, 0, 0]);
});

prueba("Vida: cumplir cura (+10 en un día perfecto) y marcar algo de ayer recupera lo perdido", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    vidaDesde(estado, 1);
    igual(vida.calcularVida(estado, hoy()).puntos, 97, "ayer no la hiciste: −8");
    acciones.completarMision(estado, leer.id, dia(-1));
    igual(vida.calcularVida(estado, hoy()).puntos, 105, "la marcaste: ya no hay daño");

    const otra = partidaNueva();
    const gym = crearMision(otra);
    vidaDesde(otra, 3);                                    // 3 días sin hacerla: 105 − 24 = 81
    igual(vida.calcularVida(otra, hoy()).puntos, 81);
    acciones.completarMision(otra, gym.id);
    igual(vida.calcularVida(otra, hoy()).puntos, 81 + 4 + 10, "misión normal + día perfecto");
});

prueba("Vida: en plena forma (80 % o más) das +10 % de XP y monedas; si no, lo normal", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    vidaDesde(estado, 3);                                  // 81 de 105 = 77 %: «bien», sin bono
    igual(vida.calcularVida(estado, hoy()).nivel, "bien");
    igual(acciones.completarMision(estado, leer.id), { xp: 25, forma: false, clave: false });
    igual(vida.calcularVida(estado, hoy()).nivel, "forma", "con 95 de 105 vuelve a estar en forma");
});

prueba("Vida: en 0 caes; la tienda y el arcade se cierran hasta recuperar la mitad (las pociones sí se venden)", () => {
    const estado = partidaNueva();
    acciones.ganar(estado, { xp: 300, monedas: 500 });     // nivel 3: 115 de vida; para levantarse, 58
    for (const nombre of ["A", "B", "C", "D"]) crearMision(estado, { nombre, dificultad: "dificil" });
    acciones.crearRecompensa(estado, { nombre: "Película", costo: 10 });
    vidaDesde(estado, 4);                                  // 4 días sin nada: 115 → 85 → 55 → 25 → 0
    let v = vida.calcularVida(estado, hoy());
    igual([v.puntos, v.caido, v.cayoEn, v.levantarse], [0, true, dia(-1), 58]);
    igual(avatar.calcularAnimo(estado, hoy(), juego.calcularRacha(estado, hoy())), "caido", "el avatar cayó");
    debeFallar(() => acciones.canjear(estado, estado.recompensas[0].id), "Caíste en combate");
    debeFallar(() => acciones.comprarObjeto(estado, "gorra"), "Caíste en combate");
    debeFallar(() => acciones.empezarPartida(estado, "carrera"), "Caíste en combate");
    debeFallar(() => acciones.empezarTorre(estado, 1), "Caíste en combate");

    acciones.tomarPocion(estado);                          // +25
    debeFallar(() => acciones.tomarPocion(estado), "Ya tomaste");
    const celebraciones = jugar(estado, () => {
        for (const m of estado.misiones) acciones.completarMision(estado, m.id);   // 4 × 6 + 10 del día perfecto
    });
    v = vida.calcularVida(estado, hoy());
    igual([v.puntos, v.caido], [25 + 24 + 10, false]);
    cierto(celebraciones.some((c) => c.etiqueta === "¡Te levantaste!"), "avisa que te levantaste");
    acciones.canjear(estado, estado.recompensas[0].id);   // la tienda ya abrió
});

prueba("Pociones: +25 por 40 monedas, una al día; no con la vida llena; se pueden deshacer", () => {
    const llena = partidaNueva();
    acciones.ganar(llena, { monedas: 100 });
    debeFallar(() => acciones.tomarPocion(llena), "ya está llena");

    const estado = partidaNueva();
    crearMision(estado);
    vidaDesde(estado, 3);                                  // 81 de 105
    debeFallar(() => acciones.tomarPocion(estado), "Te faltan 40");
    acciones.ganar(estado, { monedas: 100 });
    acciones.tomarPocion(estado);
    igual([vida.calcularVida(estado, hoy()).puntos, estado.personaje.monedas], [105, 60], "81 + 25, sin pasar del máximo");
    acciones.deshacerPocion(estado);
    igual([vida.calcularVida(estado, hoy()).puntos, estado.personaje.monedas], [81, 100]);
});

prueba("Vida: al abrir la app avisa una sola vez cuánta vida perdiste", () => {
    const estado = partidaNueva();
    crearMision(estado);
    vidaDesde(estado, 1);
    igual(acciones.revisarVidaAlAbrir(estado).celebraciones[0].titulo, "Perdiste 8 de vida ayer (1 pendiente sin hacer)");
    igual(acciones.revisarVidaAlAbrir(estado), null, "la segunda vez ya no");
});

prueba("Metas semanales: al cerrar la semana quitan vida por cada vez que faltó (proporcional si empezó a mitad)", () => {
    const estado = partidaNueva();
    const gym = crearMision(estado, { nombre: "Gym", frecuencia: "semana", veces: 3 });   // normal: −8 por vez
    const lunesPasado = sumarDias(lunesDe(hoy()), -7);
    const domingo = sumarDias(lunesPasado, 6);
    estado.personaje.creadoEn = gym.creadaEn = estado.vida.desde = lunesPasado;
    marcarEn(estado, gym, lunesPasado);                    // 1 de 3: faltaron 2
    const danoDelDomingo = () => vida.calcularVida(estado, hoy()).registro.find((r) => r.fecha === domingo).dano;
    igual(danoDelDomingo(), 16);
    estado.vida.desde = sumarDias(lunesPasado, 3);         // si la vida empezó el jueves: pedía 2 (de 4 días)
    igual(danoDelDomingo(), 8);
});

prueba("Modo descanso: no quita vida ni rompe la racha, y dura máximo 30 días", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    vidaDesde(estado, 3);
    marcarEn(estado, leer, dia(-3));
    estado.descansos.push({ desde: dia(-2), hasta: dia(-1) });   // 2 días de descanso sin hacer nada
    igual(vida.calcularVida(estado, hoy()).puntos, 105);
    igual(juego.calcularRacha(estado, hoy()).actual, 1, "la racha sigue viva");

    const otra = partidaNueva();
    debeFallar(() => acciones.empezarDescanso(otra, dia(30)), "máximo 30");
    debeFallar(() => acciones.empezarDescanso(otra, dia(-1)), "hasta qué día");
    acciones.empezarDescanso(otra, dia(2));
    igual([juego.enDescanso(otra, hoy()), juego.enDescanso(otra, dia(2)), juego.enDescanso(otra, dia(3))], [true, true, false]);
    debeFallar(() => acciones.empezarDescanso(otra, dia(3)), "Ya estás");
    acciones.terminarDescanso(otra);                       // hoy todavía descansa; mañana ya cuenta
    igual(otra.descansos, [{ desde: hoy(), hasta: hoy() }]);
});

prueba("Vida en avisos y en la Torre: de noche dice cuánto pierdes; en la Torre subes con tu vida real", () => {
    const estado = partidaNueva();
    crearMision(estado, { nombre: "Leer" });
    cierto(resumenParaAvisos(estado, hoy()).dias[hoy()].cuerpoNoche.includes("❤️ 105/105: si no terminas hoy pierdes 8 de vida"),
           "el aviso de la noche");
    acciones.empezarDescanso(estado, hoy());
    cierto(!resumenParaAvisos(estado, hoy()).dias[hoy()].cuerpoNoche.includes("pierdes"), "de descanso no pierdes nada");

    const herido = partidaNueva();
    crearMision(herido);
    vidaDesde(herido, 3);                                  // 81 de 105
    acciones.empezarTorre(herido, 7);
    const h = herido.arcade.torre.heroe;
    igual(h.vida, Math.round((h.vidaMax * 81) / 105));
    igual(vida.proporcionTorre({ puntos: 5, maxima: 100 }), 0.3, "nunca menos de 30 %");
});

prueba("Copias viejas: la vida empieza a contar el día que llega la actualización", () => {
    const viejo = partidaNueva();
    delete viejo.vida;
    delete viejo.descansos;
    const cargado = datos.desdeRespaldo(JSON.stringify(viejo));
    igual([cargado.vida.desde, cargado.vida.pociones, cargado.descansos], [hoy(), [], []]);
});


// ===== Más interactiva (v22) =====

// Una función de azar "fija": devuelve los números que le das, en orden (para poder comprobar el sorteo).
const azarFijo = (...numeros) => () => numeros.shift();

prueba("Eventos del día: salen de la fecha (siempre el mismo ese día), aparecen todos y se pueden apagar", () => {
    const fechas = Array.from({ length: 300 }, (_, i) => sumarDias("2026-01-01", i));
    const conEvento = fechas.filter((f) => eventos.eventoDelDia(f));
    cierto(conEvento.length > 120 && conEvento.length < 210, `más o menos la mitad de los días (${conEvento.length} de 300)`);
    igual(eventos.eventoDelDia("2026-03-14"), eventos.eventoDelDia("2026-03-14"));
    igual(new Set(conEvento.map((f) => eventos.eventoDelDia(f).clave)).size, Object.keys(eventos.EVENTOS).length, "aparecen todos");
    igual(eventos.eventoDelDia(conEvento[0], partidaNueva()), null, "apagados en Ajustes");
});

prueba("Eventos del día: bendición, luna de sangre, fortuna, mercader, termas, eco y sabio", () => {
    const e = (clave, atributo = null) => ({ clave, atributo });
    igual(eventos.factorPremio(e("bendicion", "fuerza"), { dificultad: "normal", atributo: "fuerza" }), { xp: 1.5, monedas: 1 });
    igual(eventos.factorPremio(e("bendicion", "fuerza"), { dificultad: "normal", atributo: "carisma" }), { xp: 1, monedas: 1 });
    igual(eventos.factorPremio(e("luna"), { dificultad: "dificil" }), { xp: 2, monedas: 1 });
    igual(eventos.factorPremio(e("fortuna"), { dificultad: "facil" }), { xp: 1, monedas: 1.5 });
    igual([eventos.precioConEvento(100, e("mercader")), eventos.precioConEvento(100, null)], [70, 100]);
    igual([eventos.factorCura(e("termas")), eventos.factorTorre(e("eco")), eventos.factorDiario(e("sabio"))], [2, 2, 3]);
});

prueba("Aguas termales: ese día cada misión cumplida cura el doble", () => {
    const termas = Array.from({ length: 200 }, (_, i) => dia(-1 - i)).find((f) => eventos.eventoDelDia(f)?.clave === "termas");
    const estado = partidaNueva();
    const gym = crearMision(estado, { dificultad: "dificil" });
    vidaDesde(estado, diasEntre(termas, hoy()) + 3);          // 3 días sin hacerla: 105 − 36 = 69
    marcarEn(estado, gym, termas);
    const cura = () => vida.calcularVida(estado, hoy()).registro.find((r) => r.fecha === termas).cura;
    estado.ajustes.eventos = true;
    const conEvento = cura();
    estado.ajustes.eventos = false;
    igual([conEvento, cura()], [12 + 10, 6 + 10], "la misión cura el doble (+10 del día perfecto, que no cambia)");
});

prueba("Misión clave: una de las que faltan hoy; vale el doble (XP, monedas y daño al jefe)", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);                                          // normal, Intelecto
    const gym = crearMision(estado, { nombre: "Gym", atributo: "fuerza" });
    debeFallar(() => acciones.elegirClave(estado, 999), "una de las que te faltan");
    acciones.elegirClave(estado, leer.id);
    igual(rituales.claveDelDia(estado, hoy()).id, leer.id);
    const resultado = acciones.completarMision(estado, leer.id);
    igual([resultado.xp, resultado.clave, estado.personaje.monedas], [55, true, 22], "25 y 10, +10 % en plena forma, ×2");
    igual(campana.estadoCampanas(estado).intelecto.dano, campana.DANO.diaria.normal * 2, "el doble de daño al jefe");
    debeFallar(() => acciones.elegirClave(estado, gym.id), "ya está cumplida");
});

prueba("Ritual de la noche: muestra lo pendiente, y cerrar el día da su premio una sola vez", () => {
    const estado = partidaNueva();
    const [a, b, c] = ["A", "B", "C"].map((nombre) => crearMision(estado, { nombre }));
    acciones.completarMision(estado, a.id);
    acciones.fallarMision(estado, b.id, hoy(), "tiempo");
    igual(rituales.pendientesDelDia(estado, hoy()).map((m) => m.id), [c.id]);
    const xp = estado.personaje.xp;
    igual(acciones.cerrarDia(estado).premio, rituales.PREMIO_CIERRE);
    igual(estado.personaje.xp - xp, rituales.PREMIO_CIERRE.xp);
    igual(acciones.cerrarDia(estado).premio, null, "la segunda vez no da nada");
});

prueba("Desafío relámpago: aparece algunos días, cuenta lo que haces después de aceptarlo y paga si llegas a tiempo", () => {
    const estado = partidaNueva();
    const [a, b, c] = ["A", "B", "C", "D"].map((nombre) => crearMision(estado, { nombre }));
    const ofrecidos = Array.from({ length: 80 }, (_, i) => dia(i + 1)).filter((f) => rituales.relampagoDisponible(estado, f, 10));
    cierto(ofrecidos.length > 10 && ofrecidos.length < 50, `algunos días (${ofrecidos.length} de 80)`);
    igual(rituales.relampagoDisponible(estado, ofrecidos[0], 19), false, "no de noche");

    acciones.completarMision(estado, a.id);                                    // antes de aceptar: no cuenta
    estado.relampagos[hoy()] = { inicio: Date.now(), base: rituales.hechasHoy(estado, hoy()), meta: 2, minutos: 120, cobradoEn: null };
    acciones.completarMision(estado, b.id);
    igual(rituales.estadoRelampago(estado, hoy(), Date.now(), 12).progreso, 1);
    const celebraciones = jugar(estado, () => acciones.completarMision(estado, c.id));
    cierto(celebraciones.some((x) => x.etiqueta === "¡Desafío relámpago cumplido!"), "paga");
    igual(estado.relampagos[hoy()].cobradoEn, hoy());

    estado.relampagos[hoy()] = { inicio: Date.now() - 3 * 3600000, base: 0, meta: 5, minutos: 120, cobradoEn: null };
    igual(rituales.estadoRelampago(estado, hoy(), Date.now(), 12).estado, "vencido", "se acabó el tiempo");
});

prueba("Cofre del día: se abre con lo primero que cumplas, una vez, y entrega su premio", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    debeFallar(() => acciones.abrirCofre(estado), "lo primero que cumplas");
    acciones.completarMision(estado, leer.id);
    const monedas = estado.personaje.monedas;
    const { premio } = acciones.abrirCofre(estado, azarFijo(0.1, 0.5));    // 10 → monedas: 15 + 13 = 28
    igual([premio.tipo, premio.cantidad, estado.personaje.monedas - monedas], ["monedas", 28, 28]);
    debeFallar(() => acciones.abrirCofre(estado), "Ya abriste");
    igual(cofre.sortearPremio(estado, azarFijo(0.5, 0, 0)).tipo, "xp");
    igual(cofre.sortearPremio(estado, azarFijo(0.75)).tipo, "fichas");
    igual(cofre.sortearPremio(estado, azarFijo(0.9)).tipo, "pocion");
    igual(cofre.sortearPremio(estado, azarFijo(0.99, 0)).tipo, "objeto");
});

prueba("Cofre del día: las fichas suman al arcade y la poción cura", () => {
    const conFichas = partidaNueva();
    acciones.completarMision(conFichas, crearMision(conFichas).id);
    const fichas = arcade.fichasDisponibles(conFichas);
    acciones.abrirCofre(conFichas, azarFijo(0.75));
    igual(arcade.fichasDisponibles(conFichas), fichas + cofre.FICHAS);

    const conPocion = partidaNueva();
    const gym = crearMision(conPocion, { dificultad: "dificil" });
    vidaDesde(conPocion, 5);                                                   // 105 − 60 = 45
    acciones.completarMision(conPocion, gym.id);
    const antes = vida.calcularVida(conPocion, hoy()).puntos;
    acciones.abrirCofre(conPocion, azarFijo(0.9));
    igual(vida.calcularVida(conPocion, hoy()).puntos, antes + cofre.CURA_POCION);
});

prueba("Mapa del viaje: cada 4 pasos un lugar; tesoros, santuarios y fortaleza se reclaman una vez", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    envejecer(estado, 29);
    for (let n = -29; n <= 0; n++) marcarEn(estado, leer, dia(n));           // 30 pasos
    const pos = mapa.posicion(estado);
    igual([pos.pasos, pos.lugar, pos.region, pos.enRegion, pos.hastaSiguiente], [30, 7, 0, 7, 2]);
    igual([5, 10, 25, 7].map(mapa.tipoDeLugar), ["tesoro", "santuario", "fortaleza", "camino"]);
    igual(mapa.lugaresPorReclamar(estado).map((l) => l.id), ["r1-5"]);
    const monedas = estado.personaje.monedas;
    acciones.reclamarLugar(estado, "r1-5");
    igual(estado.personaje.monedas - monedas, mapa.LUGARES.tesoro.premio.monedas);
    debeFallar(() => acciones.reclamarLugar(estado, "r1-5"), "ya lo reclamaste");
    debeFallar(() => acciones.reclamarLugar(estado, "r1-10"), "todavía no");
    igual(mapa.nombreRegion(6), "El Valle del Comienzo II");

    const otra = partidaNueva();                                               // 44 pasos: lugar 11
    const gym = crearMision(otra);
    envejecer(otra, 43);
    for (let n = -43; n <= 0; n++) marcarEn(otra, gym, dia(n));
    igual(mapa.lugaresPorReclamar(otra).map((l) => l.id), ["r1-5", "r1-10"]);
    const [xp, monedasAntes] = [otra.personaje.xp, otra.personaje.monedas];
    acciones.reclamarTodo(otra);
    igual([otra.personaje.monedas - monedasAntes, otra.personaje.xp - xp, mapa.lugaresPorReclamar(otra).length], [25, 40, 0], "reclamar todo");
});

prueba("Tu dragón: alimentarlo cuesta 15, una vez al día, y te cura 3; acariciarlo responde", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.alimentarDragon(estado), "Te faltan 15");
    acciones.ganar(estado, { monedas: 50 });
    crearMision(estado);
    vidaDesde(estado, 2);                                                      // 105 − 16 = 89
    const antes = vida.calcularVida(estado, hoy()).puntos;
    acciones.alimentarDragon(estado);
    igual([vida.calcularVida(estado, hoy()).puntos - antes, estado.personaje.monedas], [mascota.COMIDA.cura, 35]);
    debeFallar(() => acciones.alimentarDragon(estado), "ya comió hoy");
    const d = avatar.describirAvatar(estado, hoy(), juego.resumen(estado, hoy()));
    cierto(mascota.fraseAlAcariciar(estado, d.mascota, hoy(), () => 0).length > 10, "responde con una frase");
});

prueba("Golpe con timing: un crítico le pega 50 % más al jefe, una sola vez", () => {
    const estado = partidaNueva();
    const gym = crearMision(estado, { dificultad: "dificil" });
    debeFallar(() => acciones.golpeCritico(estado, gym.id, hoy()), "no está completada");
    acciones.completarMision(estado, gym.id);
    acciones.golpeCritico(estado, gym.id, hoy());
    igual(campana.estadoCampanas(estado).intelecto.dano, Math.round(campana.DANO.diaria.dificil * 1.5));
    debeFallar(() => acciones.golpeCritico(estado, gym.id, hoy()), "ya fue crítico");
});

prueba("El Maestro: su saludo depende de cómo vas, y responde a lo que le dices", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { nombre: "Leer", dificultad: "facil" });
    crearMision(estado, { nombre: "Gym", dificultad: "dificil" });
    const a = (hora) => { const f = new Date(); f.setHours(hora, 0, 0, 0); return f.getTime(); };
    let c = maestro.contexto(estado, hoy(), a(8));
    cierto(maestro.saludo(c).includes("¿Cuál será tu misión clave?"), "en la mañana pide la misión clave");
    cierto(maestro.responder(estado, c, "sinGanas").includes("«Leer»"), "sin ganas: la más fácil");
    cierto(maestro.responder(estado, c, "fuerza").includes("«Gym»"), "con fuerza: la más difícil");
    c = maestro.contexto(estado, hoy(), a(21));
    cierto(maestro.saludo(c).includes("Cae la noche"), "en la noche invita a cerrar el día");
    acciones.completarMision(estado, leer.id);
    cierto(maestro.saludo(maestro.contexto(estado, hoy(), a(21))).includes("cofre"), "avisa del cofre");

    const raro = partidaNueva();
    crearMision(raro, { nombre: "<img src=x onerror=alert(1)>" });
    const html = vistas.dialogoMaestro({ maestro: maestro.contexto(raro, hoy(), a(8)) }, { modo: "clave" });
    cierto(html.includes("&lt;img") && !html.includes("<img src=x"), "los nombres van escapados");
});


// ===== «Fallé» y tu libro (v20) =====

prueba("Fallé: dices por qué, pierdes la vida al instante, ya no se recuerda y se borra si al final la haces", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);                                          // normal: −8
    const gym = crearMision(estado, { nombre: "Gym", frecuencia: "semana", veces: 2 });
    debeFallar(() => acciones.fallarMision(estado, gym.id, hoy(), "tiempo"), "toda la semana");
    debeFallar(() => acciones.fallarMision(estado, leer.id, hoy(), "inventado"), "Elige qué pasó");
    igual(acciones.fallarMision(estado, leer.id, hoy(), "ganas").dano, 8);
    igual(vida.calcularVida(estado, hoy()).puntos, 105 - 8, "se pierde ahora, no esta noche");
    debeFallar(() => acciones.fallarMision(estado, leer.id, hoy(), "ganas"), "Ya la marcaste");
    igual(resumenParaAvisos(estado, hoy()).dias[hoy()].titulo, "✨ ¡Todo listo por hoy!", "ya no se recuerda");
    igual(avisosDeMisiones({ ...estado, misiones: [{ ...leer, aviso: "18:00" }] }, hoy())[0].saltarHasta, hoy(), "ni su aviso");
    acciones.completarMision(estado, leer.id);                                 // al final sí la hizo
    igual([estado.fallas.length, vida.calcularVida(estado, hoy()).puntos], [0, 105]);
});

prueba("Fallé ayer: la vida se pierde una sola vez, y quitar la falla no la devuelve (igual no la hiciste)", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    vidaDesde(estado, 1);
    acciones.fallarMision(estado, leer.id, dia(-1), "tiempo");
    igual(vida.calcularVida(estado, hoy()).puntos, 97);
    acciones.quitarFalla(estado, leer.id, dia(-1));
    igual(vida.calcularVida(estado, hoy()).puntos, 97);
    debeFallar(() => acciones.fallarMision(estado, leer.id, dia(-2), "tiempo"), "hoy o de ayer");
});

prueba("Fallé: la ficha del hábito cuenta las fallas y el motivo que más se repite", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    estado.fallas.push({ misionId: leer.id, fecha: dia(-3), motivo: "ganas" }, { misionId: leer.id, fecha: dia(-2), motivo: "tiempo" },
                       { misionId: leer.id, fecha: dia(-1), motivo: "ganas" });
    const s = juego.estadisticasMision(estado, leer, hoy());
    igual([s.fallas, s.motivoFrecuente], [3, "ganas"]);
});

prueba("Tu libro: cada día con diario es un capítulo, contado con lo que pasó y tus palabras", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { nombre: "Leer" });
    const gym = crearMision(estado, { nombre: "Gym", atributo: "fuerza" });
    envejecer(estado, 2);
    marcarEn(estado, leer, dia(-2));
    marcarEn(estado, gym, dia(-2));
    estado.diario[dia(-2)] = { animo: "genial", texto: "Gran día <b>", gratitud: "Mi familia", pregunta: "¿Qué fue lo mejor de hoy?" };
    marcarEn(estado, leer, dia(-1));
    estado.fallas.push({ misionId: gym.id, fecha: dia(-1), motivo: "ganas" });
    estado.diario[dia(-1)] = { animo: "mal", texto: "", gratitud: "" };

    const [uno, dos] = libro.capitulosDelLibro(estado, hoy());
    igual([uno.numero, dos.numero], [1, 2]);
    cierto(["Un día sin sombras", "Todo en su lugar", "La jornada completa"].includes(uno.titulo), "un día perfecto tiene su título");
    const textos = (c) => c.parrafos.map((p) => p.texto).join(" ");
    cierto(textos(uno).includes("Cumplió todas sus misiones («Leer» y «Gym»): fue un día perfecto."), "las misiones");
    cierto(uno.parrafos.some((p) => p.tipo === "cita" && p.texto === "Gran día <b>"), "tus palabras, tal cual");
    cierto(textos(uno).includes("ante la pregunta «¿Qué fue lo mejor de hoy?»"), "la pregunta del día");
    cierto(textos(uno).includes("dio gracias por esto: «Mi familia»"), "lo que agradeciste");
    cierto(textos(dos).includes("«Gym» quedó sin cumplir; no tuvo ganas"), "lo que fallaste y por qué");
    igual(libro.aRomano(1994), "MCMXCIV");

    const html = vistas.pantallaLibro(estado, { hoy: hoy(), paginaLibro: 1 });
    cierto(html.includes("Gran día &lt;b&gt;") && !html.includes("Gran día <b>"), "lo que escribiste va escapado");
    cierto(vistas.pantallaLibro(estado, { hoy: hoy(), paginaLibro: "indice" }).includes(uno.titulo), "el índice");
});

prueba("Tu libro: el día que cae un jefe, el capítulo lleva su nombre", () => {
    const estado = partidaNueva();
    acciones.crearPrincipal(estado, { nombre: "Curso", atributo: "intelecto", submisiones: "Uno\nDos\nTres" });
    const principal = estado.principales[0];
    for (const paso of principal.submisiones.slice(0, 2)) {      // 2 pasos × 40 = 80: cae el primer jefe
        paso.hecha = true;
        paso.hechaEn = dia(-1);
    }
    estado.diario[dia(-1)] = { animo: "bien", texto: "", gratitud: "" };
    const caidos = libro.jefesCaidos(estado, dia(-1));
    igual(caidos.length, 1);
    igual(libro.jefesCaidos(estado, dia(-2)).length, 0, "el día antes todavía no había caído");
    const capitulo = libro.capitulosDelLibro(estado, hoy())[0];
    igual(capitulo.titulo, `La caída de ${caidos[0].nombre}`);
    cierto(capitulo.parrafos.some((p) => p.texto.includes(`dio un paso más: Uno.`)), "el paso de la misión principal");
});


// ===== El Tratado de la Voluntad (v19) =====

// Una firma de prueba: un trazo con varios puntos.
const FIRMA = "M10 50 L20 60 L30 40 L40 70 L50 30 L60 80 L70 20 L80 90 L90 10";

prueba("Pacto: para sellarlo hay que jurarlo y firmarlo; renovarlo guarda la fecha del primero", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.firmarPacto(estado, { nombre: "Ana", firma: FIRMA }), "jurarlo");
    debeFallar(() => acciones.firmarPacto(estado, { nombre: "Ana", firma: "M10 10", juro: "on" }), "Firma con tu dedo");
    debeFallar(() => acciones.firmarPacto(estado, { nombre: "Ana", firma: `${FIRMA}"/><script>alert(1)</script>`, juro: "on" }),
               "Firma con tu dedo");
    const celebraciones = acciones.firmarPacto(estado, { nombre: " Ana ", razon: " Por mi familia ", firma: FIRMA, juro: "on" }).celebraciones;
    igual(celebraciones[0].etiqueta, "¡Pacto sellado!");
    igual([estado.pacto.nombre, estado.pacto.razon, estado.pacto.firmadoEn, estado.pacto.primeraVez, estado.pacto.renovaciones],
          ["Ana", "Por mi familia", hoy(), hoy(), 0]);
    estado.pacto.primeraVez = dia(-10);
    acciones.firmarPacto(estado, { nombre: "Ana", razon: "", firma: FIRMA, juro: "on" });
    igual([estado.pacto.primeraVez, estado.pacto.renovaciones], [dia(-10), 1], "renovado");
});

prueba("Pacto: días honrados (algo hecho o descanso); los días sin misiones no cuentan y hoy solo suma", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado, { dias: [diaDeSemana(dia(-4)), diaDeSemana(dia(-3)), diaDeSemana(dia(-2)), diaDeSemana(dia(-1)), diaDeSemana(hoy())] });
    envejecer(estado, 5);
    acciones.firmarPacto(estado, { nombre: "Ana", firma: FIRMA, juro: "on" });
    estado.pacto.primeraVez = dia(-5);                     // hace 5 días no tocaba nada: no cuenta
    marcarEn(estado, leer, dia(-4));                       // honrado
    estado.diario[dia(-3)] = { animo: "bien", texto: "", gratitud: "" };   // el diario también cuenta
    estado.descansos.push({ desde: dia(-2), hasta: dia(-2) });             // descanso: honrado
    // ayer: nada → fallado. Hoy: todavía no cuenta.
    let c = pacto.cumplimientoDelPacto(estado, hoy());
    igual([c.dia, c.honrados, c.contados, c.porcentaje, c.ayerFallado, c.hoyHonrado], [6, 3, 4, 75, true, false]);
    acciones.completarMision(estado, leer.id);
    c = pacto.cumplimientoDelPacto(estado, hoy());
    igual([c.honrados, c.contados, c.porcentaje, c.hoyHonrado], [4, 5, 80, true], "hoy ya suma");
});

prueba("Pacto: el pergamino lleva tu nombre y tu porqué (escapados) y la firma solo si es válida", () => {
    const estado = partidaNueva();
    const ctx = { hoy: hoy(), renovandoPacto: false };
    cierto(vistas.pantallaPacto(estado, ctx).includes('data-form="pacto"'), "sin firmar: el formulario para firmar");
    acciones.firmarPacto(estado, { nombre: "Ana <b>", razon: "<img src=x onerror=alert(1)>", firma: FIRMA, juro: "on" });
    const html = vistas.pantallaPacto(estado, ctx);
    cierto(html.includes("Yo, Ana &lt;b&gt;, caballero de mi propia vida"), "el preámbulo con tu nombre");
    cierto(html.includes("&lt;img src=x onerror=alert(1)&gt;") && !html.includes("<img src=x"), "tu porqué, escapado");
    cierto(html.includes(`d="${FIRMA}"`), "la firma dibujada");
    estado.pacto.firma = 'M0 0" onload="alert(1)';
    cierto(!vistas.pantallaPacto(estado, ctx).includes("onload"), "una firma inválida no se dibuja");
    igual(pacto.citaDelDia("2026-10-12"), pacto.citaDelDia("2026-10-12"), "la cita del día no cambia en el día");
});


// ===== Diario (v18) =====

prueba("Diario: la primera vez da +5 XP de Carisma y 2 monedas (una vez); al borrarlo se devuelven", () => {
    const estado = partidaNueva();
    const { xp, monedas } = diario.PREMIO_DIARIO;
    const resultado = acciones.escribirDiario(estado, { fecha: hoy(), animo: "genial", texto: "Gran día", gratitud: "  Mi familia " });
    igual(resultado.xp, xp);
    igual([estado.personaje.xp, estado.personaje.monedas, estado.atributos.carisma], [xp, monedas, xp]);
    igual(estado.diario[hoy()].gratitud, "Mi familia");
    acciones.escribirDiario(estado, { fecha: hoy(), animo: "bien", texto: "Lo cambié", gratitud: "" });
    igual(estado.personaje.xp, xp, "editarla no da otro premio");
    acciones.escribirDiario(estado, { fecha: hoy(), animo: "", texto: "", gratitud: "" });
    igual([hoy() in estado.diario, estado.personaje.xp, estado.personaje.monedas], [false, 0, 0], "borrada: se devuelve");
    debeFallar(() => acciones.escribirDiario(estado, { fecha: hoy(), texto: "x".repeat(501) }), "máximo 500");
    debeFallar(() => acciones.escribirDiario(estado, { fecha: hoy(), gratitud: "x".repeat(121) }), "máximo 120");
});

prueba("Diario: una pregunta por día (siempre la misma ese día), y escribirlo cura 2 de vida", () => {
    igual(diario.preguntaDelDia("2026-10-12"), diario.preguntaDelDia("2026-10-12"));
    cierto(diario.preguntaDelDia("2026-10-12") !== diario.preguntaDelDia("2026-10-13"), "mañana toca otra");
    const estado = partidaNueva();
    crearMision(estado);
    vidaDesde(estado, 2);                                   // 2 días sin hacerla: 105 − 16 = 89
    const antes = vida.calcularVida(estado, hoy()).puntos;
    acciones.escribirDiario(estado, { fecha: dia(-1), animo: "mal", texto: "", gratitud: "" });
    igual([antes, vida.calcularVida(estado, hoy()).puntos], [89, 89 + vida.VIDA.diario]);
    igual(estado.diario[dia(-1)].pregunta, null, "sin texto no guarda la pregunta");
});

prueba("Diario: la racha cuenta días seguidos escribiendo (hoy sin escribir todavía no la rompe)", () => {
    const estado = partidaNueva();
    for (const n of [-4, -2, -1]) estado.diario[dia(n)] = { animo: "bien", texto: "", gratitud: "" };
    igual(diario.rachaDiario(estado, hoy()), 2);
    estado.diario[hoy()] = { animo: "bien", texto: "", gratitud: "" };
    igual(diario.rachaDiario(estado, hoy()), 3);
});

prueba("Diario: compara tu ánimo los días que cumples todas tus misiones con los demás", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    envejecer(estado, 9);
    for (let n = -9; n <= -1; n++) {
        const cumplio = n % 2 === 0;                        // un día sí y otro no
        if (cumplio) marcarEn(estado, leer, dia(n));
        estado.diario[dia(n)] = { animo: cumplio ? "genial" : "mal", texto: "", gratitud: "" };
    }
    igual(diario.loQueDiceTuDiario({ ...estado, diario: { [hoy()]: { animo: "bien" } } }).suficiente, false, "con 1 día no alcanza");
    const d = diario.loQueDiceTuDiario(estado);
    igual([d.suficiente, d.cumpliendo.promedio, d.sinCumplir.promedio], [true, 5, 2]);
    igual(diario.animoDe(4.2), "bien");
});

prueba("Diario: recuerdos (hace una semana, un mes y un año), búsqueda sin tildes y calendario del mes", () => {
    const estado = partidaNueva();
    const hoyFijo = "2026-03-31";
    estado.diario["2026-03-24"] = { animo: "bien", texto: "Aprendí una canción", gratitud: "" };
    estado.diario["2026-02-28"] = { animo: "mal", texto: "Examen difícil", gratitud: "Mis amigos" };   // febrero no tiene 31
    estado.diario["2025-03-31"] = { animo: "genial", texto: "Viaje", gratitud: "" };
    igual(diario.recuerdos(estado, hoyFijo).map((r) => r.titulo), ["Hace una semana", "Hace un mes", "Hace un año"]);
    igual(diario.buscarEntradas(estado, { texto: "CANCION" }).map((e) => e.fecha), ["2026-03-24"]);
    igual(diario.buscarEntradas(estado, { texto: "amigos" }).map((e) => e.fecha), ["2026-02-28"], "también busca en lo que agradeces");
    igual(diario.buscarEntradas(estado, { animo: "genial" }).map((e) => e.fecha), ["2025-03-31"]);
    const mes = diario.mesDeAnimo(estado, "2026-03", hoyFijo);
    igual([mes.filter((c) => c === null).length, mes.filter(Boolean).length], [6, 31], "marzo de 2026 empieza en domingo");
    igual(mes.find((c) => c?.fecha === "2026-03-24").animo, "bien");
    cierto(diario.diarioComoTexto(estado, "Aria").includes("Agradezco: Mis amigos"), "se puede descargar como texto");
});

prueba("Logros: «escribir en tu diario N días»", () => {
    const estado = partidaNueva();
    acciones.crearLogro(estado, { nombre: "Escritor", tipo: "diario", objetivo: 1, recompensa: 20 });
    jugar(estado, () => acciones.escribirDiario(estado, { fecha: hoy(), animo: "bien", texto: "", gratitud: "" }));
    igual(estado.logros[0].desbloqueadoEn, hoy());
    igual(juego.describirLogro(estado.logros[0], estado), "Escribir en tu diario 1 día");
});


// ===== Atributos propios (v17) =====

prueba("Atributos propios: van colgados de uno de los 4, y su XP sube los dos (y pega al jefe de la base)", () => {
    const estado = partidaNueva();
    acciones.crearAtributoPropio(estado, { nombre: "Programación", icono: "💻", base: "intelecto" });
    const prog = estado.atributosPropios[0];
    igual([prog.base, prog.color], ["intelecto", juego.ATRIBUTOS.intelecto.color], "sin color elegido, usa el de su base");
    const mision = crearMision(estado, { nombre: "Leetcode", atributo: juego.clavePropio(prog.id) });
    igual([mision.atributo, mision.atributoPropio], ["intelecto", prog.id]);
    acciones.completarMision(estado, mision.id);
    igual([juego.xpDePropio(estado, prog.id), estado.atributos.intelecto], [28, 28], "normal en plena forma");
    igual(campana.estadoCampanas(estado).intelecto.dano, campana.DANO.diaria.normal, "daño al jefe de Intelecto");
    acciones.desmarcarMision(estado, mision.id);
    igual(juego.xpDePropio(estado, prog.id), 0);
});

prueba("Atributos propios: también en tareas, enfoque y misiones principales; avisan al subir de nivel", () => {
    const estado = partidaNueva();
    acciones.crearAtributoPropio(estado, { nombre: "Inglés", icono: "🗣️", base: "carisma", color: "#60a5fa" });
    const ingles = estado.atributosPropios[0];
    const clave = juego.clavePropio(ingles.id);
    acciones.crearTarea(estado, { nombre: "Examen", fecha: hoy(), dificultad: "dificil", atributo: clave });
    const celebraciones = jugar(estado, () => acciones.alternarTarea(estado, estado.tareas[0].id));   // 55 XP: nivel 2
    cierto(celebraciones.some((c) => c.titulo === "Inglés subió a nivel 2"), "avisa que subió de nivel");

    const inicio = Date.now();
    acciones.empezarEnfoque(estado, { minutos: "15", atributo: clave }, inicio);
    acciones.revisarEnfoque(estado, inicio + 15 * 60 * 1000);                                          // fácil: 11 XP
    acciones.crearPrincipal(estado, { nombre: "Llegar a B2", atributo: clave, submisiones: "Terminar el curso" });
    const principal = estado.principales[0];
    acciones.alternarSubmision(estado, principal.id, principal.submisiones[0].id);                     // 30 + 150
    igual(juego.xpDePropio(estado, ingles.id), 55 + 11 + 30 + 150);
    igual(estado.enfoque.sesiones[0].atributoPropio, ingles.id);
});

prueba("Atributos propios: nombres únicos, máximo 12; la base no se edita y al borrarlo todo vuelve a su base", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.crearAtributoPropio(estado, { nombre: "fuerza", base: "fuerza" }), "Ya tienes");
    acciones.crearAtributoPropio(estado, { nombre: "Salud", icono: "🥗", base: "fuerza" });
    debeFallar(() => acciones.crearAtributoPropio(estado, { nombre: "SALUD", base: "carisma" }), "Ya tienes");
    const salud = estado.atributosPropios[0];
    const mision = crearMision(estado, { nombre: "Ensalada", atributo: juego.clavePropio(salud.id) });
    acciones.completarMision(estado, mision.id);

    acciones.editarAtributoPropio(estado, { id: salud.id, nombre: "Comer sano", icono: "🍎", color: "#a3e635", base: "riqueza" });
    igual([salud.nombre, salud.icono, salud.color, salud.base], ["Comer sano", "🍎", "#a3e635", "fuerza"], "la base no cambia");

    acciones.borrarAtributoPropio(estado, salud.id);
    igual([estado.atributosPropios.length, mision.atributoPropio, mision.atributo], [0, null, "fuerza"]);
    igual(estado.atributos.fuerza, 28, "la XP de la base no se pierde");
    debeFallar(() => crearMision(estado, { atributo: juego.clavePropio(salud.id) }), "ya no existe");

    for (let i = 0; i < juego.MAX_ATRIBUTOS_PROPIOS; i++) acciones.crearAtributoPropio(estado, { nombre: `A${i}`, base: "fuerza" });
    debeFallar(() => acciones.crearAtributoPropio(estado, { nombre: "Otro", base: "fuerza" }), "máximo 12");
});

prueba("Logros: «subir un atributo al nivel N» también sirve con los tuyos", () => {
    const estado = partidaNueva();
    acciones.crearAtributoPropio(estado, { nombre: "Programación", icono: "💻", base: "intelecto" });
    const clave = juego.clavePropio(estado.atributosPropios[0].id);
    acciones.crearLogro(estado, { nombre: "Dev", tipo: "atributo", objetivo: 2, atributo: clave, recompensa: 10 });
    igual(juego.describirLogro(estado.logros[0], estado), "Programación al nivel 2");
    const mision = crearMision(estado, { dificultad: "dificil", atributo: clave });
    jugar(estado, () => acciones.completarMision(estado, mision.id));                                 // 55 XP: nivel 2
    igual(estado.logros[0].desbloqueadoEn, hoy());
});


// ===== Avatar y ajustes =====

prueba("Apariencia: se puede cambiar, y una opción inventada no se acepta", () => {
    const estado = partidaNueva();
    acciones.cambiarApariencia(estado, "piel", "oscura");
    igual(estado.apariencia.piel, "oscura");
    debeFallar(() => acciones.cambiarApariencia(estado, "piel", "verde"), "no existe");
});

prueba("Apariencia: las opciones nuevas (cuerpo, rostro, ojos, traje) se pueden elegir", () => {
    const estado = partidaNueva();
    for (const [campo, opciones] of Object.entries(avatar.APARIENCIA)) {
        cierto(avatar.APARIENCIA_INICIAL[campo] in opciones, `la opción inicial de «${campo}» existe`);
        for (const valor of Object.keys(opciones)) {
            acciones.cambiarApariencia(estado, campo, valor);
            igual(estado.apariencia[campo], valor);
        }
    }
});

prueba("Objetos: todos tienen una rareza válida, y los de logro son legendarios", () => {
    for (const [id, objeto] of Object.entries(avatar.OBJETOS)) {
        cierto(objeto.rareza in avatar.RAREZAS, `rareza de ${id}`);
        if (objeto.logro) igual(objeto.rareza, "legendario", `rareza de ${id}`);
    }
});

prueba("Ajustes: el sonido se puede apagar", () => {
    const estado = partidaNueva();
    igual(estado.ajustes.sonido, true);
    acciones.cambiarAjuste(estado, "sonido", false);
    igual(estado.ajustes.sonido, false);
});


// ===== Copia de seguridad =====

prueba("Copia de seguridad: exportar e importar deja la partida igual", () => {
    const estado = partidaDemo();
    const copia = datos.desdeRespaldo(datos.textoRespaldo(estado));
    igual(copia, estado);
});

prueba("Copia de seguridad: una copia vieja se completa con lo que le falte", () => {
    const vieja = JSON.stringify({ version: 1, personaje: { nombre: "Antigua", xp: 0, monedas: 0, creadoEn: hoy() }, misiones: [] });
    const estado = datos.desdeRespaldo(vieja);
    igual(estado.version, datos.estadoInicial().version, "la versión de los datos");
    igual(estado.ajustes, { sonido: true, golpe: true, eventos: true });
    igual([estado.claves, estado.cofres, estado.noches, estado.mapa, estado.arcade.extra], [{}, {}, [], { reclamados: [] }, 0], "lo de la v22");
    igual(estado.apariencia, avatar.APARIENCIA_INICIAL, "la apariencia inicial completa");
    igual(estado.campana, { recompensados: {} });
    igual([estado.tareas, estado.desafios, estado.diario, estado.avances], [[], [], {}, {}], "las listas nuevas");
    igual(estado.enfoque, { activo: null, sesiones: [] });
    igual(estado.avisos, { horarios: [], enfoque: true }, "las notificaciones");
    igual(estado.arcade.torre, null, "sin partida de la Torre");
});

prueba("Copia de seguridad: un archivo cualquiera se rechaza", () => {
    debeFallar(() => datos.desdeRespaldo("hola"), "no es una copia de seguridad válida");
    debeFallar(() => datos.desdeRespaldo('{"otra": "cosa"}'), "no parece una copia");
});


// ===== Dibujos =====
// Los dibujos son texto SVG. No podemos "ver" si quedaron bonitos, pero sí comprobar
// que ninguna combinación se rompe (un número mal calculado aparece como NaN).

function dibujoSano(svg, que) {
    cierto(svg.startsWith("<svg") && svg.endsWith("</svg>"), `${que} es un SVG completo`);
    for (const malo of ["NaN", "undefined", "null", "[object"]) {
        cierto(!svg.includes(malo), `${que} no contiene «${malo}»`);
    }
}

// Descripción de un avatar para dibujar (lo que normalmente arma describirAvatar).
function avatarDePrueba(cambios = {}) {
    return {
        nivel: 1, etapa: avatar.ETAPAS[0], clave: "aprendiz", clase: avatar.CLASES.aprendiz, animo: "normal",
        rasgos: { fuerza: 0, intelecto: 0, carisma: 0, riqueza: 0 },
        equipado: { cabeza: null, mano: null, espalda: null, fondo: null },
        apariencia: { ...avatar.APARIENCIA_INICIAL },
        mascota: { nombre: "Chispa", etapa: avatar.ETAPAS_MASCOTA[0], total: 0, triste: false },
        ...cambios,
    };
}

prueba("Dibujo: el avatar se dibuja en todas las etapas, clases, cuerpos y peinados", () => {
    let dibujados = 0;
    for (const etapa of avatar.ETAPAS) {
        for (const [clave, clase] of Object.entries(avatar.CLASES)) {
            for (const cuerpo of Object.keys(avatar.APARIENCIA.cuerpo)) {
                for (const peinado of Object.keys(avatar.APARIENCIA.peinado)) {
                    const d = avatarDePrueba({ etapa, clave, clase, apariencia: { ...avatar.APARIENCIA_INICIAL, cuerpo, peinado } });
                    dibujoSano(dibujarAvatar(d), `${etapa.clave}/${clave}/${cuerpo}/${peinado}`);
                    dibujados += 1;
                }
            }
        }
    }
    igual(dibujados, 4 * 6 * 2 * 8);
});

prueba("Dibujo: cada opción de apariencia, ánimo, rasgo y objeto se dibuja bien", () => {
    for (const [campo, opciones] of Object.entries(avatar.APARIENCIA)) {
        for (const valor of Object.keys(opciones)) {
            dibujoSano(dibujarAvatar(avatarDePrueba({ apariencia: { ...avatar.APARIENCIA_INICIAL, [campo]: valor } })), `${campo}=${valor}`);
        }
    }
    for (const animo of Object.keys(avatar.ANIMOS)) dibujoSano(dibujarAvatar(avatarDePrueba({ animo })), `ánimo ${animo}`);
    for (const etapa of avatar.ETAPAS) {
        const rasgos = { fuerza: 2, intelecto: 2, carisma: 2, riqueza: 2 };
        dibujoSano(dibujarAvatar(avatarDePrueba({ etapa, rasgos })), `rasgos al máximo en ${etapa.clave}`);
    }
    for (const [id, objeto] of Object.entries(avatar.OBJETOS)) {
        const equipado = { cabeza: null, mano: null, espalda: null, fondo: null, [objeto.espacio]: id };
        dibujoSano(dibujarAvatar(avatarDePrueba({ equipado })), `avatar con ${id}`);
        dibujoSano(dibujarObjeto(id), `miniatura de ${id}`);
    }
    // Los tres encuadres: completo, batalla y retrato pequeño.
    for (const opciones of [{}, { batalla: true }, { batalla: true, sinEfectos: true }, { mini: true }]) {
        dibujoSano(dibujarAvatar(avatarDePrueba({ etapa: avatar.ETAPAS[3] }), opciones), `encuadre ${JSON.stringify(opciones)}`);
    }
});

prueba("Dibujo: la mascota y los escenarios de batalla se dibujan bien", () => {
    for (const etapa of avatar.ETAPAS_MASCOTA) {
        for (const triste of [false, true]) dibujoSano(dibujarMascota({ nombre: "Chispa", etapa, total: 0, triste }), `mascota ${etapa.clave}`);
    }
    for (const categoria of Object.keys(campana.CAMPANAS)) dibujoSano(dibujarEscenario(categoria).trim(), `escenario de ${categoria}`);
});

prueba("Dibujo: dos avatares en la misma página no comparten ids (sus colores no se mezclan)", () => {
    const ids = (svg) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    const [a, b] = [ids(dibujarAvatar(avatarDePrueba())), ids(dibujarAvatar(avatarDePrueba()))];
    cierto(a.length > 5, "el dibujo define sus materiales");
    igual(a.filter((id) => b.includes(id)), [], "ids repetidos entre dos dibujos");
    igual(new Set(a).size, a.length, "ids únicos dentro de un dibujo");
});


// ===== La partida de ejemplo =====

prueba("Partida de ejemplo: su historial respeta las reglas", () => {
    const estado = partidaDemo();
    const vistas = new Set();
    for (const c of estado.completadas) {
        const clave = `${c.misionId}|${c.fecha}`;
        cierto(!vistas.has(clave), `sin repetidos (${clave})`);
        vistas.add(clave);
        const mision = estado.misiones.find((m) => m.id === c.misionId);
        cierto(juego.sePuedeMarcar(mision, c.fecha), `la misión se podía marcar ese día (${clave})`);
    }
    // La XP coincide con lo que dice el historial.
    const suma = (lista) => lista.reduce((total, x) => total + x.xp, 0);
    const pasos = estado.principales.flatMap((p) => p.submisiones).filter((s) => s.hecha).length;
    const jefes = Object.values(estado.campana.recompensados)
        .reduce((total, n) => total + suma(Array.from({ length: n }, (_, i) => campana.premioJefe(i + 1))), 0);
    const tareas = suma(estado.tareas.filter((t) => t.premio).map((t) => t.premio));
    igual(estado.personaje.xp,
          suma(estado.completadas) + pasos * juego.PREMIOS.submision.xp + jefes + tareas + suma(estado.enfoque.sesiones));
});


// ===== Ejecutar todo y mostrar el resultado =====

const lista = document.querySelector("#lista");
let fallidas = 0;

for (const { nombre, funcion } of pruebas) {
    const fila = document.createElement("li");
    try {
        await funcion();
        fila.className = "bien";
        fila.textContent = `✅ ${nombre}`;
    } catch (error) {
        fallidas += 1;
        fila.className = "mal";
        fila.textContent = `❌ ${nombre}`;
        const detalle = document.createElement("small");
        detalle.textContent = error.message;
        fila.appendChild(detalle);
    }
    lista.appendChild(fila);
}

const total = document.querySelector("#total");
total.textContent = fallidas === 0
    ? `Las ${pruebas.length} pruebas pasaron.`
    : `Fallaron ${fallidas} de ${pruebas.length} pruebas.`;
total.className = fallidas === 0 ? "bien" : "mal";
// Para que un programa (o tú, desde la consola) pueda leer el resultado.
window.resultadoPruebas = { total: pruebas.length, fallidas };
