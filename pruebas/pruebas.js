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
import * as arcade from "../js/arcade.js";
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

// Una partida nueva con su personaje.
function partidaNueva() {
    const estado = datos.estadoInicial();
    acciones.crearPersonaje(estado, "Prueba");
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
    igual(estado.personaje.xp, 25);
    igual(estado.personaje.monedas, 10);
    igual(estado.atributos.intelecto, 25);
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
    const mision = crearMision(estado);                       // normal: 25 XP
    acciones.completarMision(estado, mision.id);
    acciones.editarMision(estado, { id: mision.id, nombre: "Leer mucho", dificultad: "dificil", atributo: "fuerza" });
    igual(estado.personaje.xp, 25, "la XP ganada");
    acciones.desmarcarMision(estado, mision.id);              // devuelve 25, no 50
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
    igual(acciones.fijarCantidad(estado, agua.id, hoy(), 3).xp, 25, "al llegar a 3 se completa");
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
    igual([estado.personaje.xp, estado.personaje.monedas, estado.atributos.riqueza], [50, 20, 50]);
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
    igual([estado.personaje.xp, estado.personaje.monedas, estado.atributos.intelecto], [25, 10, 25]);
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
    igual(estado.diario[hoy()], { animo: "bien", texto: "Buen día" });
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
    igual([estado.personaje.xp, estado.personaje.monedas], [desafios.COFRE.xp, desafios.COFRE.monedas]);
    jugar(estado, () => {});
    igual(estado.personaje.monedas, desafios.COFRE.monedas, "el cofre no se cobra dos veces");
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
    igual(estado.personaje.monedas, 10 + 50);
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
    cierto(deHoy.cuerpoNoche.endsWith("📓 Falta tu frase del diario"), "de noche recuerda el diario");

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
          { titulo: "⏰ Beber agua", cuerpo: "Llevas 3 de 8 vasos.\n+25 XP · +10 monedas" });   // normal
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
    igual(estado.ajustes, { sonido: true });
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
        funcion();
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
