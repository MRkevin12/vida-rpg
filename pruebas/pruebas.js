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
import * as retos from "../js/retos.js";
import * as cinematicas from "../js/cinematicas.js";
import * as voces from "../js/voces.js";
import * as vistasVoces from "../js/vistas-voces.js";
import { existeSonido } from "../js/sonido.js";
import { calcularResumen, semanaPorMostrar, resumenSemana, pistaDeFallas, focoDeLaSemana, MAX_FOCO } from "../js/resumen.js";
import { resumenParaAvisos, avisosDeMisiones } from "../js/avisos.js";
import * as torre from "../js/torre.js";
import * as bestiario from "../js/bestiario.js";
import * as leyendas from "../js/leyendas.js";
import * as habilidades from "../js/habilidades.js";
import * as cronica from "../js/cronica.js";
import * as cinesReino from "../js/cinematicas-reino.js";
import { dibujarMapa } from "../js/dibujo-mapa.js";
import * as sprites from "../js/sprites.js";
import { retocarPuntos, redondearColor, enSombras } from "../js/pixel.js";
import { dibujarMonstruo, dibujarSala, CON_DIBUJO } from "../js/dibujo-monstruos.js";
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
import * as memorias from "../js/memorias.js";
import * as pergamino from "../js/pergamino.js";
import * as pergaminos from "../js/pergaminos.js";
import * as libroCasio from "../js/libro-casio.js";
import * as cinematicasModulo from "../js/cinematicas.js";
import * as saga from "../js/saga.js";
import * as vistas from "../js/vistas.js";
import * as arcade from "../js/arcade.js";
import * as nube from "../js/nube.js";
import { VERSION_APP, NOVEDADES, novedadesPorVer } from "../js/novedades.js";
import { PLANTILLAS_MISIONES, PLANTILLAS_RECOMPENSAS } from "../js/plantillas.js";
import { hoy, sumarDias, diasEntre, diaDeSemana, lunesDe } from "../js/fechas.js";
import * as avatar from "../js/avatar.js";
import * as gym from "../js/gym.js";
import * as ataques from "../js/ataques.js";
import * as fragua from "../js/fragua.js";
import * as libroOrrin from "../js/libro-orrin.js";
import * as libros from "../js/libros.js";
import * as vistasGym from "../js/vistas-gym.js";
import * as equipo from "../js/equipo.js";
import { dibujarAvatar, dibujarMascota, dibujarObjeto, dibujarEscenario } from "../js/dibujo.js";
import { PISTAS } from "../js/musica.js";
import * as musicaModulo from "../js/musica.js";
import * as sonidoModulo from "../js/sonido.js";
import { PINTURAS as PINTURAS_DE_FONDO } from "../js/pinturas.js";
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
    // El reto del día (v40) también cambia con la fecha: se deja uno que nunca se cumple (las pruebas del reto
    // ponen el suyo).
    estado.arcade.retos[hoy()] = { tipo: "partidas", meta: 9999, mejor: 0, cobradoEn: null };
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
    igual([jefe.indice, jefe.vida, jefe.vidaMax], [0, 142, 150]);

    acciones.crearPrincipal(estado, { nombre: "Meta", atributo: "fuerza", submisiones: "Paso 1\nPaso 2" });
    const meta = estado.principales[0];
    acciones.alternarSubmision(estado, meta.id, meta.submisiones[0].id);   // 40 de daño
    jefe = campana.estadoCampanas(estado).fuerza;
    igual(jefe.vida, 102);
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
    const pasos = Array.from({ length: 73 }, (_, i) => `Paso ${i + 1}`).join("\n");
    acciones.crearPrincipal(estado, { nombre: "Meta enorme", atributo: "fuerza", submisiones: pasos });
    // Los jefes viven en las regiones 1 a 5 del mapa (v52): tu héroe camina 400 pasos hasta la región 5.
    for (let n = 0; n < 400; n++) estado.tareas.push({ id: 5000 + n, nombre: "x", hechaEn: hoy(), premio: null });
    // 73 pasos × 40 = 2920 de daño; la ronda 1 suma 2800 de vida: sobran 120.
    const celebraciones = jugar(estado, () => { for (const paso of estado.principales[0].submisiones) paso.hecha = true; });
    let c = campana.estadoCampanas(estado).fuerza;
    igual([c.derrotados, c.ronda, c.indice], [5, 2, 0]);
    // El primer jefe de la ronda 2 vive en el Valle II (región 7): aún no llegas, así que el daño que sobra se le guarda.
    // Con 5 jefes vencidos el viaje va ×1,5: los 400 pasos valen 600 y llegas justo al Valle II (región 7).
    igual([c.vidaMax, c.vida, c.esperando, c.guardado, c.region], [225, 105, false, 0, 6], "50 % más de vida; al llegar a su región recibe el daño guardado");
    igual(campana.premioJefe(6), { xp: 150, gemas: 75 }, "y da 50 % más de premio (en gemas)");
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
    const { xp, monedas } = diario.PREMIO_DIARIO;   // escribir el diario también da su premio (en monedas: es de la vida real)
    igual([estado.personaje.xp, estado.personaje.monedas, estado.personaje.gemas], [desafios.COFRE.xp + xp, monedas, desafios.COFRE.gemas],
          "el cofre del desafío paga en gemas");
    jugar(estado, () => {});
    igual(estado.personaje.gemas, desafios.COFRE.gemas, "el cofre no se cobra dos veces");
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

prueba("Revisión semanal: se guarda por semana, cierra la tarjeta y deja hasta 3 misiones de foco", () => {
    const estado = partidaNueva();
    const [a, b, c, d] = ["A", "B", "C", "D"].map((nombre) => crearMision(estado, { nombre }));
    const lunesPasado = sumarDias(lunesDe(hoy()), -7);
    estado.personaje.creadoEn = lunesPasado;
    for (const m of estado.misiones) m.creadaEn = lunesPasado;

    igual(focoDeLaSemana(estado, hoy()), [], "sin revisión no hay foco");
    acciones.guardarRevision(estado, { lunes: lunesPasado, bien: "  gym  ", mejorar: "dormir", foco: [String(a.id), b.id] });
    igual(estado.revisiones[lunesPasado].bien, "gym", "se limpian los espacios");
    igual(estado.revisiones[lunesPasado].foco, [a.id, b.id], "los ids del formulario llegan como texto");
    igual(semanaPorMostrar(estado, hoy()), null, "guardar la revisión cierra la tarjeta");
    igual(focoDeLaSemana(estado, hoy()).map((m) => m.nombre), ["A", "B"]);

    acciones.archivarMision(estado, b.id);
    igual(focoDeLaSemana(estado, hoy()).map((m) => m.nombre), ["A"], "una misión archivada sale del foco");

    debeFallar(() => acciones.guardarRevision(estado, { lunes: lunesPasado, foco: [a.id, c.id, d.id, b.id] }), "como máximo");
    debeFallar(() => acciones.guardarRevision(estado, { lunes: lunesPasado, foco: [999] }), "ya no existe");
    debeFallar(() => acciones.guardarRevision(estado, { lunes: sumarDias(lunesPasado, 2), foco: [] }), "no es válida");
    igual(MAX_FOCO, 3);
});

prueba("Revisión semanal: la pista dice qué misión fallaste más y por qué motivo", () => {
    const estado = partidaNueva();
    const a = crearMision(estado, { nombre: "A" });
    const b = crearMision(estado, { nombre: "B" });
    const lunes = sumarDias(lunesDe(hoy()), -7);
    igual(pistaDeFallas(estado, lunes), null, "sin fallas no hay pista");
    estado.fallas.push({ misionId: a.id, fecha: lunes, motivo: "ganas" });
    estado.fallas.push({ misionId: b.id, fecha: sumarDias(lunes, 1), motivo: "tiempo" });
    estado.fallas.push({ misionId: b.id, fecha: sumarDias(lunes, 2), motivo: "tiempo" });
    estado.fallas.push({ misionId: b.id, fecha: sumarDias(lunes, 8), motivo: "otro" });   // otra semana: no cuenta
    const pista = pistaDeFallas(estado, lunes);
    igual([pista.total, pista.mision, pista.veces, pista.motivo.nombre], [3, "B", 2, "No tuve tiempo"]);
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
    igual(torre.MONSTRUOS.length, 30, "las 30 criaturas (desde la v38)");
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
    igual([p.piso, p.fase, p.heroe.mana], [2, "ruta", p.heroe.manaMax], "en el piso 2 el camino se bifurca (v60)");
    torre.elegirRuta(p, "desafio");
    igual(p.fase, "batalla");
});

prueba("Torre: sin hechizos ni pociones no se pueden usar; la misma semilla da la misma partida", () => {
    const p = torre.nuevaPartida(NIVELES_1, 9);
    p.heroe.mana = 0;
    p.heroe.pociones = 0;
    debeFallar(() => torre.actuar(p, "hechizo", "fuego"), "hechizos");
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
    igual([estado.personaje.monedas, estado.personaje.gemas, estado.atributos.carisma], [0, torre.premio(3).gemas, torre.premio(3).xp],
          "paga en gemas, no en monedas");
    igual([estado.arcade.records.torre, estado.arcade.torre], [3, null]);
    igual(torre.premio(100), { gemas: torre.PREMIO.maxGemas, xp: torre.PREMIO.maxXp }, "el premio tiene un máximo");
});


// ===== La Torre al estilo de los clásicos (v25) =====

prueba("Torre: 6 zonas de 5 pisos con criaturas propias (ninguna es un jefe de tus campañas) y un guardián al final", () => {
    igual([bestiario.ZONAS.length, bestiario.ORDEN.length], [6, bestiario.ZONAS.length * bestiario.PISOS_POR_ZONA], "30 criaturas");
    const jefes = Object.values(campana.CAMPANAS).flatMap((c) => c.jefes.map((j) => j.id));
    igual(bestiario.ORDEN.filter((id) => jefes.includes(id)), [], "ids repetidos con los jefes");
    bestiario.ORDEN.forEach((id, i) => {
        const piso = i + 1;
        const c = bestiario.CRIATURAS[id];
        igual(c.zona, bestiario.zonaDelPiso(piso).id, `${id} está en la zona de su piso`);
        igual(Boolean(c.guardian), torre.esGuardian(piso), `${id}: solo el quinto de cada zona es guardián`);
        cierto(bestiario.ELEMENTOS[c.debil], `${id} tiene punto débil`);
        cierto(c.resiste === null || (bestiario.ELEMENTOS[c.resiste] && c.resiste !== c.debil), `${id}: lo que resiste no es su punto débil`);
        cierto(c.golpe && c.fuerte && c.texto && ["m", "f"].includes(c.genero) && c.talla > 0, `${id} tiene todos sus datos`);
        igual(torre.monstruoDelPiso(piso).id, id);
    });
    // Los tres hechizos se reparten parejo entre los puntos débiles.
    for (const elemento of Object.keys(bestiario.ELEMENTOS)) {
        cierto(bestiario.ORDEN.filter((id) => bestiario.CRIATURAS[id].debil === elemento).length >= 6, `varias criaturas débiles a ${elemento}`);
    }
    // Después del piso 30 vuelven las mismas, «ancestrales» y más fuertes.
    const [primero, vuelta] = [torre.monstruoDelPiso(1), torre.monstruoDelPiso(31)];
    igual([vuelta.id, vuelta.vuelta, vuelta.nombre], [primero.id, 1, `${primero.nombre} ancestral`]);
    cierto(vuelta.vidaMax > primero.vidaMax && torre.esGuardian(35) && bestiario.zonaDelPiso(31).id === "cripta", "la segunda vuelta");
});

prueba("Torre: el hechizo del punto débil hace 50 % más, el que resiste la mitad, y hay que elegir cuál lanzar", () => {
    // El Caballero sin Nombre (piso 5): débil al rayo, resiste el hielo; el fuego le hace el daño normal.
    const lanzar = (elemento) => {
        const p = torre.nuevaPartida(NIVELES_1, 77);
        p.piso = 5;
        p.enemigo = torre.monstruoDelPiso(5);
        p.heroe.critico = 0;
        return torre.actuar(p, "hechizo", elemento)[0];
    };
    const [fuego, rayo, hielo] = ["fuego", "rayo", "hielo"].map(lanzar);
    igual([fuego.efecto, rayo.efecto, hielo.efecto], [null, "debil", "resiste"]);
    // (Las tres partidas tienen la misma semilla: lo único que cambia es el elemento. El ±1 es por el redondeo.)
    cierto(Math.abs(rayo.dano - fuego.dano * bestiario.DEBIL) <= 1, `el punto débil: ${rayo.dano} contra ${fuego.dano}`);
    cierto(Math.abs(hielo.dano - fuego.dano * bestiario.RESISTE) <= 1, `lo que resiste: ${hielo.dano} contra ${fuego.dano}`);
    igual([fuego.tipo, fuego.elemento], ["hechizo", "fuego"]);
    const p = torre.nuevaPartida(NIVELES_1, 1);
    debeFallar(() => torre.actuar(p, "hechizo"), "Elige un hechizo");
    debeFallar(() => torre.actuar(p, "hechizo", "veneno"), "Elige un hechizo");
    igual(p.heroe.mana, p.heroe.manaMax, "un hechizo que no existe no gasta nada");
});

prueba("Torre: las frases nombran a la criatura y a su ataque; la intención dice qué va a usar", () => {
    const p = torre.nuevaPartida(NIVELES_1, 3);
    p.piso = 4;
    p.enemigo = torre.monstruoDelPiso(4);            // la Araña tejedora (femenino)
    p.enemigo.intencion = "fuerte";
    igual(torre.textoIntencion(p.enemigo).texto, `Prepara «Aguijón venenoso» (${torre.danoPrevisto(p.enemigo)})`);
    const eventos = torre.actuar(p, "atacar");
    cierto(p.registro.includes("a la Araña tejedora") && p.registro.includes("La Araña tejedora usa «Aguijón venenoso»"), p.registro);
    igual(eventos[1].nombre, "Aguijón venenoso");
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    cierto(p.registro.includes("¡La Araña tejedora cae!"), p.registro);
    torre.elegirMejora(p, p.opciones[0]);
    torre.resolverSala(p, "seguir");   // (v42) antes del guardián hay una fuente
    cierto(p.registro.includes("el Caballero sin Nombre, guardián de la Cripta olvidada"), p.registro);
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    torre.elegirMejora(p, p.opciones[0]);
    cierto(p.registro.startsWith("Entras a la Biblioteca prohibida. Piso 6: aparece el Ojo vigía."), p.registro);
});

prueba("Bestiario: recuerda las criaturas que viste, las que venciste y lo que le hace cada hechizo", () => {
    const estado = partidaNueva();
    igual(estado.arcade.bestiario, {}, "empieza vacío");
    acciones.empezarTorre(estado, 5);
    const b = estado.arcade.bestiario;
    igual(b, { murcielago: { vencidos: 0, elementos: [] } }, "al entrar ya viste a la del piso 1");
    igual(bestiario.loQueSabes(b, "murcielago", "rayo"), null, "todavía no probaste nada");
    estado.arcade.torre.enemigo.vida = 500;         // para que aguante los tres hechizos
    estado.arcade.torre.heroe.mana = 3;
    for (const elemento of ["rayo", "fuego", "rayo"]) acciones.accionTorre(estado, "hechizo", elemento);
    igual(b.murcielago.elementos, ["rayo", "fuego"], "cada hechizo se apunta una vez");
    igual([bestiario.loQueSabes(b, "murcielago", "rayo"), bestiario.loQueSabes(b, "murcielago", "fuego"), bestiario.loQueSabes(b, "murcielago", "hielo")],
          ["debil", "normal", null]);
    estado.arcade.torre.enemigo.vida = 1;
    acciones.accionTorre(estado, "atacar");
    igual(b.murcielago.vencidos, 1);
    acciones.mejoraTorre(estado, estado.arcade.torre.opciones[0]);
    cierto(b.esqueleto, "al subir ves a la del piso nuevo");
    igual(bestiario.progresoBestiario(b), { vistas: 2, total: 30 });
    // Al terminar la subida, lo aprendido se queda.
    acciones.terminarTorre(estado);
    igual(estado.arcade.bestiario.murcielago.vencidos, 1, "el bestiario sobrevive a la partida");
});

prueba("Torre: una partida guardada con un jefe de la versión anterior sigue con la criatura de ese piso", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 9);
    const p = estado.arcade.torre;
    p.piso = 7;
    p.enemigo = { id: "medusa", nombre: "Medusa", titulo: "La Parálisis", guardian: false, vida: 50, vidaMax: 100, ataque: 15, intencion: "fuerte" };
    const copia = datos.desdeRespaldo(datos.textoRespaldo(estado));
    acciones.empezarTorre(copia, 9);                 // «Continuar»
    const m = copia.arcade.torre.enemigo;
    const nuevo = torre.monstruoDelPiso(7);
    igual([m.id, m.vida, m.vidaMax, m.intencion], [nuevo.id, Math.round(nuevo.vidaMax / 2), nuevo.vidaMax, "fuerte"], "misma parte de vida");
    cierto(copia.arcade.bestiario[nuevo.id], "y queda vista en el bestiario");
    torre.actuar(copia.arcade.torre, "atacar");      // se puede seguir jugando
    // Una copia de antes de la v25 no tenía bestiario: empieza vacío.
    delete estado.arcade.bestiario;
    igual(datos.desdeRespaldo(datos.textoRespaldo(estado)).arcade.bestiario, {});
});

prueba("Pixel art: bordes duros, menos colores y un contorno oscuro alrededor", () => {
    // Un lienzo de 3 × 3 con un solo punto en el centro (y uno casi transparente en la esquina).
    const puntos = new Uint8ClampedArray(3 * 3 * 4);
    puntos.set([200, 100, 50, 255], 4 * 4);          // el del centro
    puntos.set([255, 255, 255, 90], 0);              // muy transparente: no cuenta
    retocarPuntos(puntos, 3, 3);
    const opacidad = (i) => puntos[i * 4 + 3];
    igual([0, 2, 6, 8].map(opacidad), [0, 0, 0, 0], "las esquinas quedan vacías");
    igual([1, 3, 4, 5, 7].map(opacidad), [255, 255, 255, 255, 255], "el centro y sus 4 vecinos (el contorno)");
    cierto(puntos[1 * 4] < 40 && puntos[1 * 4 + 1] < 40, "el contorno es oscuro");
    cierto(puntos[4 * 4] > puntos[4 * 4 + 1] && puntos[4 * 4 + 1] > puntos[4 * 4 + 2], "el centro sigue siendo naranja");
    // Sin contorno (los fondos): solo se toca el punto que ya existía.
    const fondo = new Uint8ClampedArray(3 * 3 * 4);
    fondo.set([10, 20, 30, 255], 4 * 4);
    retocarPuntos(fondo, 3, 3, { contorno: false });
    igual([0, 1, 3, 5, 7, 8].map((i) => fondo[i * 4 + 3]), [0, 0, 0, 0, 0, 0]);
    // Los colores se redondean: dos tonos casi iguales quedan idénticos, y blanco y negro no cambian.
    igual(redondearColor(120, 60, 30, 14), redondearColor(122, 61, 31, 14), "dos colores casi iguales");
    igual([redondearColor(0, 0, 0, 14), redondearColor(255, 255, 255, 14)], [[0, 0, 0], [255, 255, 255]]);
});

prueba("Dibujo: las criaturas y las salas de la Torre y la Mazmorra son SVG válidos (también como imagen)", () => {
    // Para convertirlos en pixel art el navegador los lee como IMAGEN, que es más estricto que
    // ponerlos dentro de la página: un atributo repetido o una etiqueta sin cerrar lo rompe.
    const valido = (svg, que) => {
        dibujoSano(svg.trim(), que);
        const leido = new DOMParser().parseFromString(svg, "image/svg+xml");
        cierto(!leido.querySelector("parsererror"), `${que} se puede leer como imagen`);
    };
    // (El Reflejo sombrío no tiene dibujo propio: es tu héroe en sombras.)
    const conFigura = Object.values(bestiario.LUGARES).flatMap((l) => l.orden).filter((id) => !bestiario.CRIATURAS[id].espejo);
    igual([...CON_DIBUJO].sort(), [...conFigura].sort(), "cada criatura tiene su dibujo");
    for (const id of conFigura) valido(dibujarMonstruo(id), `la criatura ${id}`);
    for (const zona of Object.values(bestiario.LUGARES).flatMap((l) => l.zonas)) valido(dibujarSala(zona.id), `la sala ${zona.id}`);
    igual(dibujarMonstruo("no-existe").includes("<defs>"), false, "una criatura que no existe: dibujo vacío");
    // El avatar de batalla también pasa por ahí.
    valido(dibujarAvatar(avatarDePrueba({ etapa: avatar.ETAPAS[3] }), { batalla: true, sinEfectos: true }), "el avatar de batalla");
});

prueba("Pixel art: el héroe, una criatura y una sala se convierten en imágenes", async () => {
    const [heroe, monstruo, sala] = await Promise.all([
        sprites.spriteDeHeroe(avatarDePrueba()),
        sprites.spriteDeMonstruo("esqueleto"),
        sprites.spriteDeSala("cripta"),
    ]);
    for (const [imagen, que] of [[heroe, "el héroe"], [monstruo, "la criatura"], [sala, "la sala"]]) {
        cierto(typeof imagen === "string" && imagen.startsWith("data:image/png"), `${que} es una imagen PNG`);
    }
    igual(await sprites.spriteDeMonstruo("esqueleto"), monstruo, "la segunda vez sale de lo guardado");
    // Su tamaño en puntos es el que dice el bestiario.
    const medir = (direccion) => new Promise((resolver) => {
        const imagen = new Image();
        imagen.onload = () => resolver([imagen.width, imagen.height]);
        imagen.src = direccion;
    });
    const talla = bestiario.CRIATURAS.esqueleto.talla;
    igual([await medir(monstruo), await medir(heroe)], [[talla, talla], [sprites.HEROE.ancho, sprites.HEROE.alto]]);
});

prueba("Torre (pantalla): batalla, menú de magia, botín, final y bestiario se dibujan sin huecos", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 11);
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (cambios = {}) => ({ partida: estado.arcade.torre, nombre: "Prueba <b>", sprites: imagenes, eventos: [], menu: "principal",
                                   ultimo: "atacar", bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);

    let html = vistas.pantallaTorre(t());
    sano(html, "la batalla");
    cierto(html.includes("Murciélago de cripta") && html.includes("Cripta olvidada") && html.includes("Prueba &lt;b&gt;"), "nombres (escapados)");
    cierto(html.includes('data-torre="atacar"') && html.includes('data-menu="magia"') && !html.includes("data-elemento"), "el menú principal");
    cierto(/ff-comando elegido[^>]*data-torre="atacar"/.test(html), "la manito está en «Atacar»");

    html = vistas.pantallaTorre(t({ menu: "magia", ultimo: "hielo" }));
    sano(html, "el menú de magia");
    cierto(["fuego", "hielo", "rayo"].every((e) => html.includes(`data-elemento="${e}"`)) && html.includes("sin probar"), "los tres hechizos");

    // Después de lanzar rayo: el turno se anima y el bestiario ya sabe que es su punto débil.
    estado.arcade.torre.enemigo.vida = 500;
    const { eventos } = acciones.accionTorre(estado, "hechizo", "rayo");
    html = vistas.pantallaTorre(t({ eventos }));
    sano(html, "el turno");
    cierto(html.includes("ff-rayo") && html.includes("¡Punto débil!") && html.includes("Débil: ⚡"), "el efecto del hechizo");
    cierto(vistas.pantallaTorre(t({ menu: "magia" })).includes("¡punto débil!"), "y el menú lo recuerda");

    estado.arcade.torre.enemigo.vida = 1;
    html = vistas.pantallaTorre(t({ eventos: acciones.accionTorre(estado, "atacar").eventos }));
    sano(html, "el botín");
    cierto(html.includes("¡Victoria!") && html.includes('data-accion="torre-mejora"') && html.includes("ff-enemigo") && html.includes(" cae"), "eliges botín");

    acciones.mejoraTorre(estado, estado.arcade.torre.opciones[0]);
    sano(vistas.pantallaTorre(t()), "el piso siguiente");
    const resultado = acciones.terminarTorre(estado);
    html = vistas.pantallaTorre(t({ partida: null, resultado }));
    sano(html, "el final");
    cierto(html.includes("Premio cobrado") && html.includes("1 piso"), "el premio");

    const todas = Object.fromEntries(bestiario.ORDEN.map((id) => [id, "data:image/png;base64,AA"]));
    html = vistas.pantallaBestiario({ bestiario: estado.arcade.bestiario, sprites: todas });
    sano(html, "el bestiario");
    cierto(html.includes("Murciélago de cripta") && html.includes("vencido ×1") && html.includes("⚡ débil"), "lo que conoces");
    cierto(!html.includes("Dragón de la tormenta") && html.includes("???") && html.includes("Piso 20 · Guardián"), "lo que no, en sombras");
    sano(vistas.pantallaArcade(estado, { vida: vida.calcularVida(estado, hoy()), avatar: avatarDePrueba() }), "la tarjeta del Arcade");
});


// ===== La Mazmorra del Abismo y las historias (v29) =====

prueba("Mazmorra: 4 zonas de 5 sótanos con 20 criaturas nuevas, cada una con su ataque especial", () => {
    const orden = bestiario.ORDEN_MAZMORRA;
    igual(orden.length, bestiario.ZONAS_MAZMORRA.length * bestiario.PISOS_POR_ZONA, "20 criaturas");
    const jefes = Object.values(campana.CAMPANAS).flatMap((c) => c.jefes.map((j) => j.id));
    igual(orden.filter((id) => jefes.includes(id) || bestiario.ORDEN.includes(id)), [], "ids nuevos (ni jefes ni de la Torre)");
    orden.forEach((id, i) => {
        const piso = i + 1;
        const c = bestiario.CRIATURAS[id];
        igual(c.zona, bestiario.zonaDelPiso(piso, "mazmorra").id, `${id} está en la zona de su sótano`);
        igual(Boolean(c.guardian), torre.esGuardian(piso), `${id}: solo el quinto de cada zona es guardián`);
        cierto(bestiario.ELEMENTOS[c.debil] && bestiario.ELEMENTOS[c.resiste] && c.resiste !== c.debil, `${id}: tiene punto débil y resiste otro`);
        cierto(torre.ESPECIALES[c.especial?.tipo] && c.especial.nombre, `${id} tiene su ataque especial`);
        cierto(c.golpe && c.fuerte && c.texto && ["m", "f"].includes(c.genero) && c.talla > 0, `${id} tiene todos sus datos`);
        igual(torre.monstruoDelPiso(piso, "mazmorra").id, id);
        igual(bestiario.lugarDeCriatura(id), "mazmorra");
    });
    for (const elemento of Object.keys(bestiario.ELEMENTOS)) {
        cierto(orden.filter((id) => bestiario.CRIATURAS[id].debil === elemento).length >= 6, `varias criaturas débiles a ${elemento}`);
    }
    for (const tipo of ["veneno", "drenar", "sellar", "coraza"]) {
        cierto(orden.filter((id) => bestiario.CRIATURAS[id].especial.tipo === tipo).length >= 4, `varias usan ${tipo}`);
    }
    // Después del sótano 20 vuelven, «abisales».
    const vuelta = torre.monstruoDelPiso(21, "mazmorra");
    igual([vuelta.id, vuelta.nombre], [orden[0], `${bestiario.CRIATURAS[orden[0]].nombre} abisal`]);
    igual(bestiario.lugarDeCriatura("esqueleto"), "torre");
    igual(bestiario.progresoBestiario({ sanguijuela: { vencidos: 0, elementos: [] } }, "mazmorra"), { vistas: 1, total: 20 });
});

prueba("Mazmorra: es más difícil que la Torre (más vida y ataque en cada sótano, sin descanso al bajar) y paga más", () => {
    for (let piso = 1; piso <= 20; piso++) {
        const [abajo, arriba] = [torre.monstruoDelPiso(piso, "mazmorra"), torre.monstruoDelPiso(piso)];
        cierto(abajo.vidaMax > arriba.vidaMax && abajo.ataque > arriba.ataque, `sótano ${piso} contra piso ${piso}`);
    }
    const subir = torre.nuevaPartida(NIVELES_1, 4);
    const bajar = torre.nuevaPartida(NIVELES_1, 4, 1, {}, "mazmorra");
    igual([subir.lugar, bajar.lugar], ["torre", "mazmorra"]);
    cierto(bajar.registro.startsWith("Sótano 1.") && bajar.registro.includes("descenso"), bajar.registro);
    for (const p of [subir, bajar]) {
        p.heroe.vida = 20;
        p.enemigo.vida = 1;
        torre.actuar(p, "atacar");
        torre.elegirMejora(p, p.opciones.find((c) => c !== "vigor" && c !== "descanso"));
    }
    igual(bajar.heroe.vida, 20, "en la Mazmorra no recuperas vida al bajar");
    cierto(subir.heroe.vida > 20, "en la Torre, sí");
    cierto(bajar.registro.startsWith("Sótano 2:"), bajar.registro);
    const [premioAbajo, premioArriba] = [torre.premio(20, "mazmorra"), torre.premio(20)];
    cierto(premioAbajo.gemas > premioArriba.gemas && premioAbajo.xp > premioArriba.xp, "paga más");
    igual(torre.premio(100, "mazmorra"), { gemas: torre.REGLAS.mazmorra.premio.maxGemas, xp: torre.REGLAS.mazmorra.premio.maxXp });
});

prueba("Mazmorra: no se abre hasta superar el piso 20 de la Torre; se juega aparte y paga en Fuerza", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.empezarTorre(estado, 1, "mazmorra"), "piso 20");
    debeFallar(() => acciones.empezarTorre(estado, 1, "sotano"), "no existe");
    estado.arcade.records.torre = 19;
    cierto(!torre.mazmorraAbierta(estado.arcade), "con 19 pisos, todavía no");
    // En la subida de ahora ya superaste el 20: se abre aunque no hayas cobrado.
    acciones.empezarTorre(estado, 1);
    estado.arcade.torre.piso = 21;
    cierto(torre.mazmorraAbierta(estado.arcade), "se abre en cuanto lo superas");
    estado.arcade.torre.piso = 1;
    estado.arcade.records.torre = 20;
    cierto(torre.mazmorraAbierta(estado.arcade), "con 20 pisos, sí");

    const fichas = arcade.fichasDisponibles(estado);
    const r = acciones.empezarTorre(estado, 1, "mazmorra");
    igual(arcade.fichasDisponibles(estado), fichas - 1, "gasta una ficha");
    igual([estado.arcade.mazmorra.lugar, estado.arcade.mazmorra.enemigo.id], ["mazmorra", "sanguijuela"]);
    cierto(estado.arcade.torre && estado.arcade.torre.lugar === "torre", "la subida de la Torre sigue guardada aparte");
    cierto(r.relato && r.relato.paginas[0].etiqueta.includes("Mazmorra"), "la primera vez se cuenta el prólogo");
    cierto(estado.arcade.bestiario.sanguijuela, "queda vista en el bestiario");

    const p = estado.arcade.mazmorra;
    p.piso = 4;
    const final = acciones.terminarTorre(estado, "mazmorra");
    const premio = torre.premio(3, "mazmorra");
    igual([final.lugar, final.pisos, final.premio, final.atributo], ["mazmorra", 3, premio, "fuerza"]);
    igual([estado.atributos.fuerza, estado.arcade.records.mazmorra, estado.arcade.mazmorra], [premio.xp, 3, null]);
    cierto(estado.arcade.torre, "cobrar la Mazmorra no toca la Torre");
});

prueba("Mazmorra: al superar el piso 20 de la Torre se celebra que se abrió", () => {
    const estado = partidaNueva();
    estado.arcade.records.torre = 15;
    acciones.empezarTorre(estado, 2);
    estado.arcade.torre.piso = 21;
    const r = acciones.terminarTorre(estado);
    cierto(r.celebraciones.some((c) => c.titulo === "Mazmorra del Abismo"), "se avisa una vez");
    acciones.empezarTorre(estado, 2);
    estado.arcade.torre.piso = 25;
    cierto(!acciones.terminarTorre(estado).celebraciones.some((c) => c.titulo === "Mazmorra del Abismo"), "y no se repite");
});


// ===== Marcas de partida y dones (v41) =====

prueba("Marcas: cada día se ofrecen 3 distintas (las mismas todo el día); «Ayuno» no va a la Mazmorra", () => {
    for (const lugar of ["torre", "mazmorra"]) {
        for (let n = 0; n < 40; n++) {
            const marcas = torre.marcasDelDia(dia(n), lugar);
            igual(new Set(marcas).size, torre.MARCAS_POR_DIA, "3 distintas");
            igual(torre.marcasDelDia(dia(n), lugar), marcas, "siempre las mismas para el mismo día");
            cierto(marcas.every((m) => torre.MARCAS[m]), "todas existen");
            if (lugar === "mazmorra") cierto(!marcas.includes("ayuno"), "Ayuno solo sirve en la Torre");
        }
    }
    const distintas = new Set(Array.from({ length: 40 }, (_, n) => torre.marcasDelDia(dia(n)).join()));
    cierto(distintas.size > 5, "los días cambian las marcas");
});

prueba("Marcas: cada una cambia la partida (vida, pociones, magia, criaturas) y el premio sube", () => {
    const base = torre.nuevaPartida(NIVELES_1, 5);
    const con = (marca) => torre.nuevaPartida(NIVELES_1, 5, 1, {}, "torre", marca);
    igual(con("cristal").heroe.vidaMax, Math.round(base.heroe.vidaMax * 0.75));
    cierto(base.heroe.pociones > 0 && con("sinfrascos").heroe.pociones === 0, "sin pociones");
    const muda = con("silencio");
    igual([muda.heroe.mana, muda.heroe.manaMax], [0, 0]);
    debeFallar(() => torre.actuar(muda, "hechizo", "fuego"), "No te quedan hechizos");
    igual(con("salvaje").enemigo.ataque, Math.round(base.enemigo.ataque * 1.25));
    igual(con("piel").enemigo.vidaMax, Math.round(base.enemigo.vidaMax * 1.3));
    igual(con("piel").enemigo.vida, con("piel").enemigo.vidaMax, "sale con toda su vida");
    igual([con("ayuno").marca, base.marca], ["ayuno", null]);
    debeFallar(() => con("inventada"), "no existe");
    cierto(con("cristal").registro.includes("Cristal"), "el registro cuenta la marca");

    // El premio se multiplica (después del tope) y sin marca queda igual que antes.
    igual(torre.premio(10), { gemas: 30, xp: 25 });
    igual(torre.premio(10, "torre", "salvaje"), { gemas: 39, xp: 32 });
    igual(torre.premio(100, "torre", "salvaje"), { gemas: 78, xp: 58 }, "máx. 60 💎 y 45 XP, ×1,3");
    cierto(Object.values(torre.MARCAS).every((m) => m.premio > 1), "todas dan más premio");
});

prueba("Marcas: «Pieles duras» respeta el «Rugido» (la criatura sigue saliendo herida) y «Ayuno» quita la cura al subir", () => {
    const rugida = torre.nuevaPartida(NIVELES_1, 3, 1, { habilidades: ["rugido"] }, "torre", "piel");
    cierto(rugida.enemigo.vida < rugida.enemigo.vidaMax, "con Rugido no sale con toda su vida");

    const curar = (marca) => {
        const p = torre.nuevaPartida(NIVELES_1, 9, 1, {}, "torre", marca);
        p.heroe.vida = 10;
        p.fase = "mejora";
        p.opciones = ["afilar"];
        torre.elegirMejora(p, "afilar");
        return p.heroe.vida;
    };
    cierto(curar(null) > 10, "normalmente subir de piso te cura");
    igual(curar("ayuno"), 10, "con Ayuno no");
});

prueba("Marcas: se elige al empezar, solo entre las del día, y cambia el premio al cobrar", () => {
    const estado = partidaNueva();
    const del = torre.marcasDelDia(hoy(), "torre");
    const fuera = Object.keys(torre.MARCAS).find((m) => !del.includes(m));
    debeFallar(() => acciones.empezarTorre(estado, 1, "torre", fuera), "no se ofrece hoy");
    igual(estado.arcade.usadas, 0, "si falla no gasta la ficha");
    acciones.empezarTorre(estado, 1, "torre", del[0]);
    igual(estado.arcade.torre.marca, del[0]);
    acciones.empezarTorre(estado, 1, "torre", del[1]);   // ya había una: sigue con su marca
    igual(estado.arcade.torre.marca, del[0], "una partida en curso no cambia de marca");
    estado.arcade.torre.piso = 11;                         // 10 pisos superados
    const r = acciones.terminarTorre(estado);
    igual([r.marca, r.premio], [del[0], torre.premio(10, "torre", del[0])]);
    cierto(r.premio.gemas > torre.premio(10).gemas, "más gemas que sin marca");
});

prueba("Dones: salen entre las mejoras desde el piso 3, nunca repetidos, y quedan guardados", () => {
    const opcionesDe = (semilla, piso, dones = []) => {
        const p = torre.nuevaPartida(NIVELES_1, semilla);
        p.piso = piso;
        p.heroe.dones = dones;
        p.enemigo.vida = 1;
        torre.actuar(p, "atacar");
        return p;
    };
    let visto = false;
    for (let semilla = 1; semilla <= 60; semilla++) {
        cierto(!opcionesDe(semilla, 2).opciones.some((c) => torre.MEJORAS[c].don), "antes del piso 3 no salen");
        const p = opcionesDe(semilla, 6);
        igual(p.fase, "mejora");
        const dones = p.opciones.filter((c) => torre.MEJORAS[c].don);
        cierto(dones.length <= 1, "como mucho uno por pantalla");
        igual(new Set(p.opciones).size, p.opciones.length, "sin repetidos");
        if (dones.length) {
            visto = true;
            torre.elegirMejora(p, dones[0]);
            igual(p.heroe.dones, dones, "queda guardado");
        }
        const sinElDon = opcionesDe(semilla, 6, Object.keys(torre.MEJORAS).filter((c) => torre.MEJORAS[c].don));
        cierto(!sinElDon.opciones.some((c) => torre.MEJORAS[c].don), "si ya tienes todos, no salen más");
    }
    cierto(visto, "en 60 partidas salió al menos un don");
});

prueba("Dones: cada uno hace lo que dice", () => {
    const pelea = (dones, semilla = 11) => {
        const p = torre.nuevaPartida(NIVELES_1, semilla);
        p.heroe.dones = dones;
        p.enemigo.vida = p.enemigo.vidaMax = 9999;   // que no muera
        return p;
    };
    const dano = (p, accion, opcion) => torre.actuar(p, accion, opcion).find((e) => e.quien === "heroe").dano;

    // Sed de sangre: un crítico te cura el 10 % de tu vida máxima.
    let p = pelea(["sangre"]);
    Object.assign(p.heroe, { vidaMax: 100, vida: 50, critico: 1 });
    igual(torre.actuar(p, "atacar").find((e) => e.quien === "heroe").cura, 10);

    // Ojo de cazador: el crítico pega ×2,3 en vez de ×1,8.
    p = pelea([]);
    p.heroe.critico = 1;
    const normal = dano(p, "atacar");
    p = pelea(["cazador"]);
    p.heroe.critico = 1;
    const cazador = dano(p, "atacar");
    cierto(cazador > normal * 1.2 && cazador < normal * 1.35, `cazador ${cazador} contra ${normal}`);

    // Eco arcano: el primer hechizo del piso pega el doble; el segundo, normal.
    p = pelea([]);
    const [a1, a2] = [dano(p, "hechizo", "fuego"), dano(p, "hechizo", "fuego")];
    p = pelea(["eco"]);
    const [b1, b2] = [dano(p, "hechizo", "fuego"), dano(p, "hechizo", "fuego")];
    cierto(Math.abs(b1 - 2 * a1) <= 2, `eco: primer hechizo ${b1} contra ${a1} ×2`);
    igual(b2, a2, "el segundo no cambia");

    // Piel de espinas: le devuelves el 30 % de lo que te pega.
    p = pelea(["espinas"]);
    const respuesta = torre.actuar(p, "atacar").find((e) => e.quien === "enemigo");
    cierto(respuesta.dano > 0, "te pegó");
    igual(respuesta.reflejo, Math.round(respuesta.dano * 0.3));

    // Fervor: 50 % más de Voluntad (golpear +6 y aguantar un golpe +10).
    p = pelea([]);
    torre.actuar(p, "atacar");
    const sin = p.heroe.voluntad;
    p = pelea(["fervor"]);
    torre.actuar(p, "atacar");
    cierto(p.heroe.voluntad > sin, `fervor ${p.heroe.voluntad} contra ${sin}`);
    igual(p.heroe.voluntad, Math.round(6 * 1.5) + Math.round(10 * 1.5));

    // Botín de guerra: al vencer recuperas el 10 % de tu vida.
    p = pelea(["botin"]);
    Object.assign(p.heroe, { vidaMax: 100, vida: 50 });
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    igual([p.fase, p.heroe.vida], ["mejora", 60]);
});


// ===== Salas especiales (v42) =====

// Una partida que acaba de entrar a ese piso (venciendo al anterior y eligiendo la primera mejora).
function llegarAlPiso(piso, lugar = "torre", semilla = 5) {
    const p = torre.nuevaPartida(NIVELES_1, semilla, 1, {}, lugar);
    p.piso = piso - 1;
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    torre.elegirMejora(p, p.opciones[0]);
    return p;
}

// Una partida ya dentro de una sala de ese tipo.
function enSala(tipo, cambios = {}) {
    const p = torre.nuevaPartida(NIVELES_1, 8);
    p.fase = "sala";
    p.sala = { tipo, antes: "Piso 3: aparece algo." };
    p.piso = 3;
    Object.assign(p.heroe, { vidaMax: 100, vida: 50, pociones: 2, mana: 2, manaMax: 2, ataque: 10, hechizo: 20, voluntad: 0 }, cambios);
    return p;
}

prueba("Salas: hay una en el 3.º piso de cada zona y antes de cada guardián; la Mazmorra no tiene", () => {
    for (let piso = 2; piso <= 30; piso++) {
        const p = llegarAlPiso(piso);
        const esperada = piso % 5 === 0 ? "fuente" : piso % 5 === 3 ? ["altar", "mercader", "cofre"] : null;
        if (!esperada) {
            igual(p.fase, piso % 5 === 2 ? "ruta" : "batalla", `piso ${piso}: sin sala${piso % 5 === 2 ? " (pero con ruta, v60)" : ""}`);
            continue;
        }
        igual(p.fase, "sala", `piso ${piso}: sala`);
        cierto(Array.isArray(esperada) ? esperada.includes(p.sala.tipo) : p.sala.tipo === esperada, `piso ${piso}: ${p.sala.tipo}`);
        cierto(p.registro.includes(torre.SALAS[p.sala.tipo].texto), "el registro cuenta qué sala es");
        debeFallar(() => torre.actuar(p, "atacar"), "Ahora no estás en una batalla");
        debeFallar(() => torre.elegirMejora(p, "afilar"), "Elige una de las mejoras");
    }
    for (let sotano = 2; sotano <= 12; sotano++) igual(llegarAlPiso(sotano, "mazmorra").fase, sotano % 5 === 2 ? "ruta" : "batalla", `sótano ${sotano}`);
    cierto(Object.keys(torre.SALAS).length === 4, "cuatro salas");
    cierto(Object.values(torre.SALAS).every((s) => s.opciones.seguir), "todas dejan seguir sin hacer nada");
});

prueba("Salas: la fuente y el altar", () => {
    let p = enSala("fuente");
    const r = torre.resolverSala(p, "beber");
    igual([p.heroe.vida, p.fase, p.sala], [90, "batalla", null]);
    cierto(p.registro.startsWith(r.texto) && p.registro.includes("Piso 3: aparece algo."), "cuenta lo que pasó y sigue con el piso");
    p = enSala("fuente");
    torre.resolverSala(p, "frasco");
    igual(p.heroe.pociones, 3);

    p = enSala("altar");
    torre.resolverSala(p, "sangre");
    igual([p.heroe.vida, p.heroe.ataque, p.heroe.hechizo], [37, 14, 28], "−25 % de la vida actual (12,5 → 13), +4 y +8");
    p = enSala("altar", { vida: 3 });
    debeFallar(() => torre.resolverSala(p, "sangre"), "demasiado herido");
    igual(p.fase, "sala", "si no se puede, sigues en la sala");
    p = enSala("altar");
    torre.resolverSala(p, "rezar");
    igual(p.heroe.voluntad, 35);
    p = enSala("altar");
    torre.resolverSala(p, "seguir");
    igual([p.heroe.vida, p.heroe.ataque, p.fase], [50, 10, "batalla"]);
});

prueba("Salas: el mercader hace trueques con lo que llevas (y no acepta lo que no tienes)", () => {
    let p = enSala("mercader");
    torre.resolverSala(p, "vigor");
    igual([p.heroe.pociones, p.heroe.vidaMax, p.heroe.vida], [1, 114, 64]);
    p = enSala("mercader", { pociones: 0 });
    debeFallar(() => torre.resolverSala(p, "vigor"), "No tienes pociones");

    p = enSala("mercader");
    torre.resolverSala(p, "frascos");
    igual([p.heroe.vida, p.heroe.pociones], [40, 4], "−20 % de la vida actual (10), +2 pociones");
    p = enSala("mercader", { vida: 4 });
    debeFallar(() => torre.resolverSala(p, "frascos"), "demasiado herido");

    p = enSala("mercader");
    torre.resolverSala(p, "filo");
    igual([p.heroe.manaMax, p.heroe.mana, p.heroe.ataque], [1, 1, 15]);
    p = enSala("mercader", { manaMax: 0, mana: 0 });
    debeFallar(() => torre.resolverSala(p, "filo"), "No tienes hechizos");
    debeFallar(() => torre.resolverSala(p, "inventada"), "no existe");
    debeFallar(() => torre.resolverSala(enSala("fuente"), "vigor"), "no existe", "una opción de otra sala");
});

prueba("Salas: el cofre da un don o una mejora, o una trampa que nunca te mata", () => {
    const resultados = new Set();
    for (let semilla = 1; semilla <= 120; semilla++) {
        const p = enSala("cofre");
        p.semilla = semilla;
        const antes = { ...p.heroe, dones: [] };
        const { texto } = torre.resolverSala(p, "abrir");
        cierto(p.heroe.vida >= 1, "nunca te mata");
        if (texto.startsWith("¡Una trampa!")) {
            resultados.add("trampa");
            igual(antes.vida - p.heroe.vida, 15, "el 15 % de la vida máxima (100)");
        } else {
            resultados.add((p.heroe.dones || []).length ? "don" : "mejora");
            cierto(texto.startsWith("Dentro hay"), texto);
        }
        igual(p.fase, "batalla");
    }
    igual([...resultados].sort(), ["don", "mejora", "trampa"], "en 120 cofres salió de todo");
    // Una trampa con poca vida te deja al menos en 1.
    const p = enSala("cofre", { vida: 5 });
    for (let semilla = 1; semilla <= 60; semilla++) {
        const q = enSala("cofre", { vida: 5 });
        q.semilla = semilla;
        torre.resolverSala(q, "abrir");
        cierto(q.heroe.vida >= 1, "con 5 de vida tampoco");
    }
    debeFallar(() => torre.resolverSala(p, "beber"), "no existe");
});

prueba("Salas: se guardan con la partida y se puede huir desde ellas", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 5);
    const p = estado.arcade.torre;
    p.piso = 2;
    p.enemigo.vida = 1;
    acciones.accionTorre(estado, "atacar");
    acciones.mejoraTorre(estado, p.opciones[0]);
    igual([p.piso, p.fase], [3, "sala"], "el piso 3 empieza con una sala");
    const guardada = JSON.parse(JSON.stringify(estado.arcade.torre));
    igual([guardada.fase, guardada.sala.tipo], ["sala", p.sala.tipo], "sobrevive a guardar y cargar");
    debeFallar(() => acciones.salaTorre(estado, "inventada"), "no existe");
    acciones.salaTorre(estado, "seguir");
    igual(estado.arcade.torre.fase, "batalla");

    // Huir desde la sala: cuentan los pisos superados, no el de la sala.
    const e2 = partidaNueva();
    acciones.empezarTorre(e2, 5);
    Object.assign(e2.arcade.torre, { piso: 5, fase: "sala", sala: { tipo: "fuente", antes: "" } });
    const r = acciones.terminarTorre(e2);
    igual(r.pisos, 4);
});


// ===== Cinemáticas (v43) =====

// Qué cinemática anota la partida al llegar a ese piso (venciendo al anterior) y al vencer a su criatura.
const cineAlLlegar = (piso, lugar = "torre") => llegarAlPiso(piso, lugar).cine;
function cineAlVencer(piso, lugar = "torre") {
    const p = torre.nuevaPartida(NIVELES_1, 5, 1, {}, lugar);
    p.piso = piso;
    p.enemigo = torre.monstruoDelPiso(piso, lugar);
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    return p.cine;
}

prueba("Cinemáticas: la partida anota cuál toca (zona nueva, guardián, derrota y final)", () => {
    igual(torre.nuevaPartida(NIVELES_1, 5).cine, null, "al empezar no hay ninguna (el piso 1 ya tiene su historia)");
    igual([cineAlLlegar(2), cineAlLlegar(3), cineAlLlegar(4)], [null, null, null]);
    igual(cineAlLlegar(5), "entrada", "el piso de un guardián");
    igual(cineAlLlegar(6), "zona", "empieza una zona nueva");
    igual([cineAlLlegar(10), cineAlLlegar(11), cineAlLlegar(30), cineAlLlegar(31)], ["entrada", "zona", "entrada", "zona"], "también después de dar la vuelta");
    igual(cineAlLlegar(6, "mazmorra"), "zona");
    igual(cineAlLlegar(5, "mazmorra"), "entrada");

    igual([cineAlVencer(3), cineAlVencer(4)], [null, null], "una criatura común no tiene");
    igual([cineAlVencer(5), cineAlVencer(20), cineAlVencer(25)], ["derrota", "derrota", "derrota"]);
    igual(cineAlVencer(30), "final", "cae el Apagador");
    igual(cineAlVencer(60), "derrota", "el final solo es una vez, en la primera vuelta");
    igual([cineAlVencer(5, "mazmorra"), cineAlVencer(20, "mazmorra")], ["derrota", "final"], "cae el Rey Hueco");
});

prueba("Cinemáticas: tomarla la borra (se ve una sola vez) y respeta Ajustes", () => {
    const estado = partidaNueva();
    igual(acciones.tomarCinematica(estado), null, "sin partida no hay nada");
    acciones.empezarTorre(estado, 5);
    const p = estado.arcade.torre;
    p.cine = "entrada";
    igual(acciones.tomarCinematica(estado), { tipo: "entrada" });
    igual([p.cine, acciones.tomarCinematica(estado)], [null, null], "ya no sale otra vez");

    estado.ajustes.cinematicas = false;
    p.cine = "zona";
    igual(acciones.tomarCinematica(estado), null, "apagadas en Ajustes: no se ven");
    igual(p.cine, null, "pero se borra, para que no salga al encenderlas");
    estado.ajustes.cinematicas = true;
    p.cine = "derrota";
    igual(acciones.tomarCinematica(estado, "torre", false), null, "descartarla también la borra");
    igual(p.cine, null);
    igual(datos.estadoInicial().ajustes.cinematicas, true, "vienen encendidas");
});

prueba("Cinemáticas: cada zona de la Torre y la Mazmorra tiene las suyas, completas y no muy largas", () => {
    const LIMITE = { zona: 5000, entrada: 10000, derrota: 7000, final: 25000 };
    const CAMARAS = ["arriba", "zoom", "izquierda", "derecha", "quieto"];
    const EFECTOS = [null, "destello", "oscuro", "temblor"];
    let vistas = 0;
    for (const lugar of ["torre", "mazmorra"]) {
        const zonas = bestiario.lugarDe(lugar).zonas;
        zonas.forEach((zona, i) => {
            const piso = (i + 1) * 5;   // el guardián de la zona
            const p = torre.nuevaPartida(NIVELES_1, 5, 1, {}, lugar);
            p.piso = piso;
            p.enemigo = torre.monstruoDelPiso(piso, lugar);
            const tipos = i === zonas.length - 1 ? ["zona", "entrada", "final"] : ["zona", "entrada", "derrota"];
            for (const tipo of tipos) {
                const c = cinematicas.cinematicaDe(tipo, p, "Aria");
                const donde = `${lugar}/${zona.id}/${tipo}`;
                cierto(c && c.tomas.length >= 1, `${donde}: tiene tomas`);
                cierto(cinematicas.duracion(c) <= LIMITE[tipo], `${donde}: dura ${cinematicas.duracion(c)} ms`);
                for (const t of c.tomas) {
                    cierto(t.fondo === zona.id, `${donde}: el fondo es la zona`);
                    cierto(t.ms >= 1500 && t.ms <= 4500, `${donde}: una toma de ${t.ms} ms`);
                    cierto(t.texto || t.titulo, `${donde}: dice algo`);
                    cierto(CAMARAS.includes(t.camara) && EFECTOS.includes(t.efecto), `${donde}: cámara y efecto`);
                    cierto(!t.sonido || existeSonido(t.sonido), `${donde}: el sonido «${t.sonido}» existe`);
                    cierto(!/\{n\}/.test(t.texto + t.titulo), `${donde}: el nombre se pone`);
                    cierto(t.actores.every((a) => ["criatura", "heroe"].includes(a.quien) && a.x >= 0 && a.x <= 100), `${donde}: actores`);
                    // La Llama solo arde al final de la saga: ninguna cinemática puede decir que ya arde.
                    cierto(!/vuelve a arder|hasta la Llama|luz de la Llama|Llama (ya )?(arde|brilla|se enciende)/i.test(t.texto + t.titulo), `${donde}: no dice que la Llama arde`);
                    vistas += 1;
                }
                igual(cinematicas.fondosDe(c), [zona.id], `${donde}: un solo fondo`);
            }
        });
    }
    cierto(vistas > 60, "se revisaron muchas tomas");
    igual(cinematicas.cinematicaDe("inventada", torre.nuevaPartida(NIVELES_1, 1), "Aria"), null);
    const unaZona = torre.nuevaPartida(NIVELES_1, 1);
    cierto(cinematicas.cinematicaDe("entrada", unaZona, "Aria").tomas.some((t) => t.titulo.includes("Murciélago") || t.titulo.includes("guardián")), "el nombre del guardián sale en el cartel");
    cierto(cinematicas.cinematicaDe("derrota", unaZona, "Ana").tomas.some((t) => t.texto.includes("Ana")), "el nombre de tu héroe aparece");
    igual(["retumbo", "campana"].every(existeSonido), true, "los dos sonidos nuevos");
});


// ===== Las Voces del Valle (v44) =====

// Las personas de la aldea están en su lugar ciertos días de la semana: para que las pruebas no dependan del día en que se
// corran, aquí están todas todos los días (y al terminar se deja todo como estaba).
function conLaAldeaAbierta(prueba) {
    const antes = Object.fromEntries(Object.entries(voces.PERSONAS).map(([id, p]) => [id, p.dias]));
    for (const p of Object.values(voces.PERSONAS)) p.dias = [0, 1, 2, 3, 4, 5, 6];
    try {
        return prueba();
    } finally {
        for (const [id, dias] of Object.entries(antes)) voces.PERSONAS[id].dias = dias;
    }
}

// Juega una conversación eligiendo siempre la opción libre que más confianza da (sin técnicas ni valor, con lo que tiene
// un héroe nuevo), o la que diga elegirIndice(nodo, opcionesLibres). Devuelve lo que devolvió elegirEnEscena al terminar.
function jugarConversacion(estado, idEscena, elegirIndice = null) {
    acciones.empezarEscena(estado, idEscena);
    for (let paso = 0; paso < 40; paso++) {
        const en = estado.voces.escena;
        const opciones = voces.opcionesDe(estado, en, hoy()).filter((o) => !o.bloqueada);
        const nodo = voces.nodoActual(en);
        const confianzaDe = (o) => nodo.opciones[o.indice].confianza || 0;
        const indice = elegirIndice ? elegirIndice(nodo, opciones) : opciones.reduce((a, b) => (confianzaDe(b) > confianzaDe(a) ? b : a)).indice;
        const r = acciones.elegirEnEscena(estado, indice);
        if (r.terminada) return r;
    }
    throw new Error("la conversación no terminó");
}

prueba("Voces: ninguna conversación se queda sin salida y las tres salidas son posibles", () => {
    cierto(Object.keys(voces.ESCENAS).length >= 6, "hay conversaciones");
    const titulos = new Set();
    for (const [id, escena] of Object.entries(voces.ESCENAS)) {
        cierto(voces.PERSONAS[escena.persona]?.escenas.includes(id), `${id}: su persona la lista`);
        cierto(escena.requiere.every((previa) => voces.ESCENAS[previa]?.persona === escena.persona), `${id}: lo que pide existe y es de la misma persona`);
        cierto(!titulos.has(escena.titulo), `${id}: título repetido`);
        titulos.add(escena.titulo);
        const nodos = escena.nodos;
        cierto(nodos[escena.inicio], `${id}: tiene inicio`);

        // Cada nodo tiene opciones, decide solo o es un final; todo lo que apunta existe; siempre hay una opción libre.
        for (const [nombre, nodo] of Object.entries(nodos)) {
            const donde = `${id}/${nombre}`;
            if (nodo.fin) {
                cierto(["bien", "regular", "mal"].includes(nodo.fin) && nodo.texto, `${donde}: final`);
                cierto(nodo.leccion, `${donde}: tiene lección`);
                cierto(!nodo.tarea || nodo.tarea.length <= 80, `${donde}: la tarea cabe (80 letras)`);
            } else if (nodo.evalua) {
                cierto(nodo.evalua.every((r) => nodos[r.ir]), `${donde}: sus reglas apuntan a nodos que existen`);
                const ultima = nodo.evalua[nodo.evalua.length - 1];
                cierto(ultima.confianzaMin === undefined && !ultima.marca, `${donde}: la última regla siempre se cumple`);
            } else {
                cierto(nodo.texto && nodo.opciones?.length, `${donde}: dice algo y da opciones`);
                cierto(nodo.opciones.every((o) => nodos[o.ir] && o.texto), `${donde}: todas las opciones llevan a un nodo que existe`);
                cierto(nodo.opciones.some((o) => !o.tecnica && !o.valor && !o.si), `${donde}: hay una opción libre (nadie se queda encerrado)`);
                cierto(nodo.opciones.every((o) => !o.tecnica || voces.TECNICAS[o.tecnica]), `${donde}: la técnica existe`);
            }
            if (nodo.quien) cierto(voces.personaDe(nodo.quien), `${donde}: quien habla existe`);
            // Los gestos van entre _guiones bajos_: tienen que estar emparejados.
            for (const texto of [nodo.texto, ...(nodo.opciones || []).map((o) => o.texto)].filter(Boolean)) {
                cierto((texto.match(/_/g) || []).length % 2 === 0, `${donde}: guiones bajos sin cerrar en «${texto.slice(0, 30)}»`);
            }
        }

        // Se puede llegar a todos los nodos, y a los tres finales; y a «bien» solo con opciones libres.
        const alcanzables = new Set();
        const finales = new Set();
        const finalesLibres = new Set();
        const visto = new Set();
        const recorrer = (nombre, confianza, marcas, libre) => {
            const clave = `${nombre}|${confianza}|${marcas.join()}|${libre}`;
            if (visto.has(clave)) return;
            visto.add(clave);
            alcanzables.add(nombre);
            const nodo = nodos[nombre];
            if (nodo.fin) {
                finales.add(nodo.fin);
                if (libre) finalesLibres.add(nodo.fin);
            } else if (nodo.evalua) {
                const regla = nodo.evalua.find((r) => (r.confianzaMin === undefined || confianza >= r.confianzaMin) && (!r.marca || marcas.includes(r.marca)));
                recorrer(regla.ir, confianza, marcas, libre);
            } else {
                for (const o of nodo.opciones) {
                    recorrer(o.ir, confianza + (o.confianza || 0), o.marca && !marcas.includes(o.marca) ? [...marcas, o.marca].sort() : marcas, libre && !o.tecnica && !o.valor);
                }
            }
        };
        recorrer(escena.inicio, 0, [], true);
        igual(Object.keys(nodos).filter((n) => !alcanzables.has(n)), [], `${id}: nodos a los que nunca se llega`);
        igual([...finales].sort(), ["bien", "mal", "regular"], `${id}: los tres finales se pueden alcanzar`);
        cierto(finalesLibres.has("bien"), `${id}: se puede llegar al mejor final sin técnicas ni valor`);
    }
});

prueba("Voces: las técnicas salen del nivel de Carisma y el Valor, de lo que hiciste de verdad esta semana", () => {
    igual(voces.tecnicasDe(1), ["escuchar"]);
    igual(voces.tecnicasDe(3), ["escuchar", "empatia", "verdad"]);
    igual(voces.tecnicasDe(9).length, Object.keys(voces.TECNICAS).length);

    const estado = partidaNueva();
    igual([voces.nivelDeCarisma(estado), voces.valorDe(estado, hoy())], [1, 0]);
    estado.atributos.carisma = 150;   // 50 + 100 de XP: nivel 3
    igual(voces.nivelDeCarisma(estado), 3);

    const carisma = crearMision(estado, { atributo: "carisma" });
    const fuerza = crearMision(estado, { nombre: "Correr", atributo: "fuerza" });
    for (const m of [carisma, fuerza]) m.creadaEn = dia(-30);
    marcarEn(estado, carisma, dia(-2));
    marcarEn(estado, carisma, dia(-6));
    marcarEn(estado, carisma, dia(-7));      // hace 7 días: ya no cuenta
    marcarEn(estado, fuerza, dia(-1));       // de otro atributo: no cuenta
    igual(voces.valorDe(estado, hoy()), 2);
    acciones.crearTarea(estado, { nombre: "Llamar a alguien", dificultad: "facil", atributo: "carisma" });
    acciones.alternarTarea(estado, estado.tareas[0].id);
    igual(voces.valorDe(estado, hoy()), 3, "una tarea de Carisma hecha también suma");
    for (let n = 0; n < 8; n++) marcarEn(estado, carisma, hoy());
    igual(voces.valorDe(estado, hoy()), voces.MAX_VALOR, "tiene tope");
});

prueba("Voces: la agenda del día (quién está, con quién se puede hablar y por qué no)", () => {
    // Cada día de la semana hay al menos dos personas en la aldea.
    const estado = partidaNueva();
    for (let n = 0; n < 7; n++) {
        const fecha = dia(n);
        const presentes = voces.agendaDelDia(estado, fecha).flatMap((l) => l.personas);
        cierto(presentes.length >= 2, `${fecha}: solo ${presentes.length} personas`);
    }

    conLaAldeaAbierta(() => {
        const estado2 = partidaNueva();
        igual(voces.motivoBloqueo(estado2, "maren-1", hoy()), null, "la primera está libre");
        cierto(voces.motivoBloqueo(estado2, "maren-2", hoy()).includes("Antes, habla con Maren"), "la segunda pide la primera");
        igual(voces.motivoBloqueo(estado2, "no-existe", hoy()), "Esa conversación no existe.");
        estado2.voces.hechas["maren-1"] = { fin: "regular", fecha: hoy() };
        estado2.voces.ultima.maren = hoy();
        cierto(voces.motivoBloqueo(estado2, "maren-2", hoy()).includes("hoy"), "hoy ya hablaste con ella");
        estado2.voces.ultima.maren = dia(-1);
        igual(voces.motivoBloqueo(estado2, "maren-2", hoy()), null, "al día siguiente ya se puede");
        const maren = voces.agendaDelDia(estado2, hoy()).flatMap((l) => l.personas).find((p) => p.id === "maren");
        igual(maren.escenaId, "maren-2", "le toca la siguiente");
        estado2.voces.hechas["maren-1"] = { fin: "bien", fecha: hoy() };
        cierto(voces.motivoBloqueo(estado2, "maren-1", hoy()).includes("mejor final"), "con el mejor final no se repite");
    });

    // Un día en que no está, el motivo lo dice.
    const e3 = partidaNueva();
    const domingo = Array.from({ length: 7 }, (_, n) => dia(n)).find((f) => diaDeSemana(f) === 6);
    cierto(voces.motivoBloqueo(e3, "maren-1", domingo).includes("no está"), "Maren no trabaja los domingos");
    cierto(voces.progreso(e3).total >= 6 && voces.progreso(e3).hechas === 0);
});

prueba("Voces: elegir cambia la confianza, lo bloqueado no se puede elegir y la conversación decide su final", () => {
    const estado = partidaNueva();
    const en = voces.iniciarEscena("maren-1", hoy());
    igual([en.nodo, en.confianza, en.historial.length], ["a1", 0, 1]);
    let opciones = voces.opcionesDe(estado, en, hoy());
    igual(opciones.map((o) => o.bloqueada === null), [true, true, true], "con Carisma 1, «Escuchar» ya está aprendida");

    voces.elegir(estado, en, 2, hoy());          // pisarle el orgullo: −1
    igual([en.nodo, en.confianza, en.reaccion], ["a2d", -1, -1]);
    igual(en.historial.map((h) => h.quien), ["narrador", "yo", "maren"]);
    opciones = voces.opcionesDe(estado, en, hoy());
    cierto(opciones[2].bloqueada.includes("Firmeza"), "la Firmeza pide Carisma 4");
    debeFallar(() => voces.elegir(estado, en, 2, hoy()), "Todavía no puedes");
    debeFallar(() => voces.elegir(estado, en, 9, hoy()), "no existe");

    // Con Carisma 4, se desbloquea.
    estado.atributos.carisma = 300;
    cierto(voces.opcionesDe(estado, en, hoy())[2].bloqueada === null, "con nivel 4 la Firmeza se abre");
    voces.elegir(estado, en, 0, hoy());          // «Perdona…»: +1 → a3
    igual(en.nodo, "a3");
    cierto(voces.opcionesDe(estado, en, hoy())[3].bloqueada === "Valor 2", "la valiente pide Valor 2");
    const carisma = crearMision(estado, { atributo: "carisma" });
    carisma.creadaEn = dia(-3);
    marcarEn(estado, carisma, dia(-1));
    marcarEn(estado, carisma, dia(-2));
    igual(voces.opcionesDe(estado, en, hoy())[3].bloqueada, null, "con 2 misiones de Carisma de verdad, se abre");

    // El final lo decide la confianza (nodo «ev»): a1 → +0, a2 → +1, a3 → +0, a4 → +1, a5 → +2 = 4: bien.
    const ruta = voces.iniciarEscena("maren-1", hoy());
    for (const i of [0, 1, 0, 0, 1]) voces.elegir(estado, ruta, i, hoy());
    igual([voces.finDe(ruta).fin, ruta.confianza], ["bien", 4]);
    // Y por el camino de pisarle el orgullo, mal.
    const mala = voces.iniciarEscena("maren-1", hoy());
    for (const i of [2, 1, 2, 1]) voces.elegir(estado, mala, i, hoy());   // −1, 0, −1 (le quitas importancia) y te vas: −2
    igual(voces.finDe(mala).fin, "mal");
});

prueba("Voces: empezar gasta una ficha (seguir, no), cada final paga lo suyo y las conversaciones se encadenan", () => {
    conLaAldeaAbierta(() => {
        const estado = partidaNueva();
        const fichas = arcade.fichasDisponibles(estado);
        acciones.empezarEscena(estado, "maren-1");
        igual(arcade.fichasDisponibles(estado), fichas - 1, "gasta una ficha");
        acciones.empezarEscena(estado, "maren-1");
        igual(arcade.fichasDisponibles(estado), fichas - 1, "seguir la conversación no gasta otra");
        debeFallar(() => acciones.empezarEscena(estado, "tobias-1"), "conversación a medias");
        acciones.abandonarEscena(estado);
        igual([estado.voces.escena, estado.voces.fallos["maren-1"]], [null, hoy()]);
        debeFallar(() => acciones.empezarEscena(estado, "maren-1"), "Ya hablaste con Maren hoy");

        // Una conversación completa: bien.
        const gemas = estado.personaje.gemas;
        const xp = estado.atributos.carisma;
        const r = jugarConversacion(estado, "tobias-1");
        igual([r.terminada, r.fin, r.persona], [true, "bien", "tobias"]);
        igual(r.premio, voces.PREMIOS.bien);
        igual([estado.personaje.gemas, estado.atributos.carisma], [gemas + voces.PREMIOS.bien.gemas, xp + voces.PREMIOS.bien.xp]);
        igual([estado.voces.hechas["tobias-1"].fin, estado.voces.escena], ["bien", null]);
        cierto(r.leccion && r.tarea && r.texto.includes("Tobías"), "trae su lección y su tarea");
        debeFallar(() => acciones.empezarEscena(estado, "tobias-1"), "mejor final");

        // Esa misma persona ya no habla más hoy; al día siguiente toca la segunda; y la primera con el mejor final ya no se repite.
        debeFallar(() => acciones.empezarEscena(estado, "tobias-2"), "Ya hablaste con Tobías hoy");
        estado.voces.ultima.tobias = dia(-1);
        const r2 = jugarConversacion(estado, "tobias-2");
        igual(r2.fin, "bien");

        // Sin fichas no se empieza.
        estado.arcade.usadas = 9999;
        debeFallar(() => acciones.empezarEscena(estado, "ilse-1"), "No tienes fichas");
    });
});

prueba("Voces: un mal final se repite otro día, uno regular se puede mejorar (paga la diferencia) y la lección se vuelve tarea", () => {
    conLaAldeaAbierta(() => {
        const estado = partidaNueva();
        // Mal: elige siempre lo que menos confianza da.
        const peor = (nodo, opciones) => opciones.reduce((a, b) => ((nodo.opciones[b.indice].confianza || 0) < (nodo.opciones[a.indice].confianza || 0) ? b : a)).indice;
        const gemas = estado.personaje.gemas;
        const mal = jugarConversacion(estado, "maren-1", peor);
        igual([mal.fin, mal.premio], ["mal", voces.PREMIOS.mal]);
        igual(estado.personaje.gemas, gemas, "un mal final no da gemas");
        igual([estado.voces.hechas["maren-1"], estado.voces.fallos["maren-1"]], [undefined, hoy()]);
        igual(voces.siguienteEscena(estado, "maren"), "maren-1", "sigue siendo la que le toca");

        // Mejorar un regular: paga solo lo que falta.
        estado.voces.hechas["maren-1"] = { fin: "regular", fecha: dia(-3) };
        estado.voces.ultima.maren = dia(-1);
        const antes = estado.personaje.gemas;
        const mejor = jugarConversacion(estado, "maren-1");
        igual(mejor.fin, "bien");
        igual(mejor.premio, { gemas: voces.PREMIOS.bien.gemas - voces.PREMIOS.regular.gemas, xp: voces.PREMIOS.bien.xp - voces.PREMIOS.regular.xp });
        igual([estado.personaje.gemas - antes, mejor.mejoro, estado.voces.hechas["maren-1"].fin], [4, true, "bien"]);

        // La lección se vuelve una tarea real de Carisma, una sola vez, y solo con una tarea que la conversación propone.
        debeFallar(() => acciones.crearTareaDeEscena(estado, "maren-1", "Una tarea inventada"), "no existe");
        debeFallar(() => acciones.crearTareaDeEscena(estado, "ilse-1", mejor.tarea), "Primero vive");
        acciones.crearTareaDeEscena(estado, "maren-1", mejor.tarea);
        const tarea = estado.tareas[estado.tareas.length - 1];
        igual([tarea.nombre, tarea.atributo, tarea.fecha], [mejor.tarea, "carisma", hoy()]);
        debeFallar(() => acciones.crearTareaDeEscena(estado, "maren-1", mejor.tarea), "ya la creaste");
    });
});

prueba("Voces: la partida nueva trae lo suyo, el texto se escapa y las pantallas se dibujan", () => {
    const estado = partidaNueva();
    igual(estado.voces, { escena: null, hechas: {}, fallos: {}, ultima: {}, tareas: {}, epilogo: null });

    // Los gestos van en cursiva; el nombre del héroe, escapado (lo escribió el usuario).
    const nombre = '<img src=x onerror="alert(1)">';
    const html = vistasVoces.formato("Hola, {n}. _Sonríe._ <b>no</b>", nombre);
    cierto(!html.includes("<img") && !html.includes("<b>") && html.includes('<em class="voces-gesto">Sonríe.</em>'), html);

    conLaAldeaAbierta(() => {
        const ctx = { hoy: hoy(), vida: { caido: false } };
        const aldea = vistasVoces.pantallaVoces(estado, ctx);
        cierto(["Maren", "Tobías", "Ilse", "La fragua", "Hablar", "Tu Carisma", "Escuchar"].every((t) => aldea.includes(t)), "la aldea muestra lo suyo");
        acciones.empezarEscena(estado, "maren-1");
        const escena = vistasVoces.pantallaEscena({ estado, nombre, hoy: hoy(), resultado: null });
        cierto(escena.includes("hoz") && escena.includes('data-accion="voces-elegir"'), "la conversación muestra su texto y sus opciones");
        cierto(!escena.includes("<img src=x"), "el nombre no se cuela como HTML");
        cierto(vistasVoces.pantallaVoces(estado, ctx).includes("Seguir hablando"), "la aldea ofrece seguir la conversación");

        const otra = partidaNueva();
        const r = jugarConversacion(otra, "ilse-1");
        const final = vistasVoces.pantallaEscena({ estado: otra, nombre: "Aria", hoy: hoy(), resultado: r });
        cierto(final.includes("Aurelio anota") && final.includes("Crear la tarea") && final.includes("Volver a la aldea"), "el final trae la lección y la tarea");
    });
});


// ===== Más voces y el final de la aldea (v45) =====

prueba("Voces: cada una de las cinco voces tiene dos personas, y todas las conversaciones se pueden ganar con un héroe nuevo", () => {
    // Cinco voces, dos personas cada una (Ego, Qué dirán, Envidia, Miedo, Orgullo) y dos conversaciones por persona.
    const porVoz = {};
    for (const p of Object.values(voces.PERSONAS)) porVoz[p.voz] = (porVoz[p.voz] || 0) + 1;
    igual(porVoz, { "El Orgullo": 2, "El Qué dirán": 2, "La Envidia": 2, "El Miedo": 2, "El Ego": 2 });
    cierto(Object.values(voces.PERSONAS).every((p) => p.escenas.length === 2), "dos conversaciones cada una");
    igual(Object.keys(voces.ESCENAS).length, 20);
    cierto(Object.values(voces.PERSONAS).every((p) => voces.LUGARES[p.lugar] && p.dias.length >= 4), "tienen lugar y vienen casi todos los días");
    cierto(Object.values(voces.LUGARES).every((l) => PINTURAS_DE_FONDO[l.fondo]), "todos los fondos existen en pinturas.js");

    // Con un héroe de Carisma 1, sin misiones de verdad y eligiendo lo que más confianza da, TODAS terminan «bien».
    conLaAldeaAbierta(() => {
        const estado = partidaNueva();
        estado.arcade.extra = 500;
        for (const id of Object.keys(voces.ESCENAS)) {
            estado.voces.ultima = {};
            const r = jugarConversacion(estado, id);
            igual([id, r.fin], [id, "bien"]);
        }
        cierto(voces.aldeaLibre(estado), "con las 20 hechas, la aldea queda libre");
    });
});

prueba("Voces: al recuperar la última voz se cuenta el epílogo, se paga una vez y queda en el libro y en la saga", () => {
    conLaAldeaAbierta(() => {
        const estado = partidaNueva();
        estado.arcade.extra = 500;
        igual(voces.aldeaLibre(estado), false);
        const ids = Object.keys(voces.ESCENAS);
        let ultimo = null;
        const gemasAntes = estado.personaje.gemas;
        const celebraciones = [];
        for (const id of ids) {
            estado.voces.ultima = {};
            ultimo = jugarConversacion(estado, id);
            celebraciones.push(...ultimo.celebraciones);
            if (id !== ids[ids.length - 1]) igual([id, ultimo.epilogo, estado.voces.epilogo], [id, false, null]);
        }
        igual([ultimo.epilogo, estado.voces.epilogo], [true, hoy()]);
        igual(celebraciones.length, 1, "una sola celebración");
        cierto(celebraciones[0].titulo === voces.EPILOGO.titulo && celebraciones[0].detalle.includes("40"), "la celebración dice lo suyo");
        const pagoDeLasConversaciones = ids.length * voces.PREMIOS.bien.gemas;
        igual(estado.personaje.gemas - gemasAntes, pagoDeLasConversaciones + voces.EPILOGO.premio.gemas, "el epílogo paga 40 💎 una sola vez");

        // Mejorar una conversación después no vuelve a pagar el epílogo.
        estado.voces.hechas[ids[0]] = { fin: "regular", fecha: dia(-3) };
        estado.voces.ultima = {};
        const otra = jugarConversacion(estado, ids[0]);
        igual([otra.epilogo, otra.celebraciones.length], [false, 0]);

        // Las pantallas: la aldea ofrece el epílogo, el epílogo no tiene huecos ni dice que la Llama arde.
        const ctx = { hoy: hoy(), vida: { caido: false } };
        const aldea = vistasVoces.pantallaVoces(estado, ctx);
        cierto(aldea.includes("La aldea ya habló") && aldea.includes('data-accion="voces-epilogo"'), "la aldea ofrece releer el epílogo");
        const html = vistasVoces.pantallaEscena({ estado, nombre: "Aria", hoy: hoy(), resultado: null, epilogo: true });
        cierto(html.includes("La aldea habla") && html.includes("Aurelio") && !/undefined|NaN|\[object/.test(html), "el epílogo se dibuja");
        const textoEpilogo = voces.EPILOGO.paginas.join(" ");
        cierto(!/vuelve a arder|hasta la Llama|luz de la Llama|Llama (ya )?(arde|brilla|se enciende)/i.test(textoEpilogo), "el epílogo no dice que la Llama arde");
        cierto(textoEpilogo.includes("no prende"), "y recuerda que la Llama sigue esperando");

        // El último final avisa de que viene el epílogo.
        const final = vistasVoces.pantallaEscena({ estado, nombre: "Aria", hoy: hoy(), resultado: { ...ultimo, epilogo: true } });
        cierto(final.includes("la aldea habla") && final.includes('data-accion="voces-epilogo"'), "el último final lleva al epílogo");

        // El libro cuenta lo que pasó en la aldea ese día.
        estado.diario[hoy()] = { animo: "bien", texto: "Un gran día.", gratitud: "", premio: null };
        const capitulo = libro.capitulosDelLibro(estado, hoy()).find((c) => c.fecha === hoy());
        const texto = capitulo.parrafos.map((p) => p.texto).join(" ");
        cierto(texto.includes("En la aldea habló con"), `el libro cuenta la conversación: ${texto.slice(0, 200)}`);
        // (el epílogo es del día en que se recuperó la última voz: aquí lo movemos a hoy para ver el título del capítulo)
        estado.voces.epilogo = hoy();
        const c2 = libro.capitulosDelLibro(estado, hoy()).find((c) => c.fecha === hoy());
        igual(c2.titulo, "La aldea habla");
        cierto(c2.parrafos.map((p) => p.texto).join(" ").includes("la aldea entera recuperó su voz"), "y que la aldea habló");
    });
});

prueba("Voces: los datos de la aldea (lugares, fondos y personas) están completos", () => {
    for (const [id, p] of Object.entries(voces.PERSONAS)) {
        cierto(p.nombre && p.oficio && p.voz && p.sombra && p.saludo, `${id}: tiene sus textos`);
        const d = voces.describirPersona(id);
        const svg = dibujarAvatar(d, { batalla: true, sinEfectos: true });
        cierto(typeof svg === "string" && svg.startsWith("<svg") && !/undefined|NaN/.test(svg), `${id}: se dibuja`);
        cierto(Object.keys(avatar.APARIENCIA).every((campo) => avatar.APARIENCIA[campo][p.aspecto[campo]]), `${id}: su aspecto usa opciones que existen`);
    }
    for (const [id, p] of Object.entries(voces.INVITADOS)) {
        cierto(Object.keys(avatar.APARIENCIA).every((campo) => avatar.APARIENCIA[campo][p.aspecto[campo]]), `${id}: su aspecto usa opciones que existen`);
    }
    // Todos los textos de las conversaciones: sin dobles espacios ni espacios al final (se ven mal en pantalla).
    for (const [id, escena] of Object.entries(voces.ESCENAS)) {
        for (const [nombre, nodo] of Object.entries(escena.nodos)) {
            for (const texto of [nodo.texto, nodo.leccion, nodo.tarea, ...(nodo.opciones || []).map((o) => o.texto)].filter(Boolean)) {
                cierto(texto === texto.trim() && !/  /.test(texto), `${id}/${nombre}: espacios raros en «${texto.slice(0, 30)}»`);
            }
        }
    }
});



// Una partida de la Mazmorra contra la criatura del sótano indicado, con la intención dada.
function mazmorraContra(piso, intencion = "especial", semilla = 21) {
    const p = torre.nuevaPartida(NIVELES_1, semilla, 1, {}, "mazmorra");
    p.piso = piso;
    p.enemigo = torre.monstruoDelPiso(piso, "mazmorra");
    p.enemigo.intencion = intencion;
    p.heroe.vidaMax = p.heroe.vida = 500;   // para que aguante
    p.heroe.critico = 0;
    return p;
}

prueba("Mazmorra: el veneno quita vida cada turno (3 turnos) y una poción lo cura", () => {
    const p = mazmorraContra(3);   // la Aguaviva pálida: «Filamentos»
    igual(torre.textoIntencion(p.enemigo).texto, `Va a usar «Filamentos» (${torre.danoPrevisto(p.enemigo)} + veneno)`);
    const eventos = torre.actuar(p, "defender");
    const golpe = eventos.find((e) => e.quien === "enemigo");
    const veneno = eventos.find((e) => e.quien === "veneno");
    igual([golpe.tipo, golpe.especial], ["especial", "veneno"]);
    igual(veneno.dano, Math.round(500 * torre.ESPECIALES.veneno.porTurno), "5 % de la vida máxima");
    igual(p.heroe.veneno, torre.ESPECIALES.veneno.turnos - 1, "le quedan 2 turnos");
    cierto(p.registro.includes("¡Te envenena!") && p.registro.includes("El veneno te quita"), p.registro);
    igual(p.enemigo.intencion === "especial", false, "no repite el especial");
    const curado = torre.actuar(p, "pocion");
    igual([p.heroe.veneno, curado[0].antidoto], [0, true], "la poción lo cura");
    igual(curado.some((e) => e.quien === "veneno"), false, "ya no quita vida");
});

prueba("Mazmorra: drenar cura a la criatura, el sello quita hechizos y la coraza parte tu golpe a la mitad", () => {
    // Drenar: la Sanguijuela gigante se cura lo que te quita.
    const d = mazmorraContra(1);
    d.enemigo.vida = d.enemigo.vidaMax - 50;
    const antes = d.enemigo.vida;
    const drenar = torre.actuar(d, "defender").find((e) => e.quien === "enemigo");
    igual(drenar.especial, "drenar");
    cierto(drenar.dano > 0 && drenar.cura === Math.min(drenar.dano, 50), `se cura ${drenar.cura} de ${drenar.dano}`);
    igual(d.enemigo.vida, antes + drenar.cura);

    // Sello: el Ahogado te quita 2 hechizos de este piso.
    const s = mazmorraContra(2);
    s.heroe.mana = 3;
    const sello = torre.actuar(s, "defender").find((e) => e.quien === "enemigo");
    igual([sello.especial, sello.sello, s.heroe.mana], ["sellar", 2, 1]);

    // Coraza: el Cangrejo acorazado se cubre y tu próximo golpe le hace la mitad.
    const c = mazmorraContra(4);
    igual(torre.textoIntencion(c.enemigo).texto, "Se cubrirá con «Caparazón» (½ de daño)");
    const cubrirse = torre.actuar(c, "defender").find((e) => e.quien === "enemigo");
    igual([cubrirse.especial, cubrirse.dano, c.enemigo.coraza], ["coraza", undefined, true], "no pega, se cubre");
    const [con, sin] = [mazmorraContra(4, "golpe", 9), mazmorraContra(4, "golpe", 9)];
    con.enemigo.coraza = true;
    const [golpeCon, golpeSin] = [torre.actuar(con, "atacar")[0], torre.actuar(sin, "atacar")[0]];
    cierto(Math.abs(golpeCon.dano - golpeSin.dano / 2) <= 1 && golpeCon.coraza, `con coraza ${golpeCon.dano}, sin ${golpeSin.dano}`);
    igual(con.enemigo.coraza, false, "la coraza dura un turno");
});

prueba("Mazmorra: sus guardianes se enfurecen una vez al quedar con media vida (los de la Torre, no)", () => {
    const p = mazmorraContra(5, "golpe");   // la Bestia de la cisterna
    const ataque = p.enemigo.ataque;
    p.enemigo.vida = Math.floor(p.enemigo.vidaMax / 2) + 1;
    const eventos = torre.actuar(p, "atacar");
    cierto(eventos.some((e) => e.quien === "furia") && p.enemigo.enfurecido, "se enfurece");
    igual(p.enemigo.ataque, Math.round(ataque * torre.FURIA_GUARDIAN));
    cierto(p.registro.includes("guardiana") || p.registro.includes("enfurece"), p.registro);
    p.enemigo.intencion = "golpe";
    igual(torre.actuar(p, "atacar").some((e) => e.quien === "furia"), false, "solo una vez");

    const t = torre.nuevaPartida(NIVELES_1, 21);
    t.piso = 5;
    t.enemigo = torre.monstruoDelPiso(5);
    t.enemigo.vida = Math.floor(t.enemigo.vidaMax / 2) + 1;
    t.heroe.vida = t.heroe.vidaMax = 500;
    igual(torre.actuar(t, "atacar").some((e) => e.quien === "furia"), false, "en la Torre no");
});

prueba("Mazmorra: el guardián se presenta en femenino si es una guardiana", () => {
    const p = torre.nuevaPartida(NIVELES_1, 3, 1, {}, "mazmorra");
    p.piso = 4;
    p.enemigo = torre.monstruoDelPiso(4, "mazmorra");
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    cierto(p.registro.includes("¡El Cangrejo acorazado cae! Sótano 4 superado."), p.registro);
    torre.elegirMejora(p, p.opciones[0]);
    cierto(p.registro.includes("la Bestia de la cisterna, guardiana de las Cisternas anegadas"), p.registro);
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    torre.elegirMejora(p, p.opciones[0]);
    cierto(p.registro.startsWith("Entras al Bosque de raíces. Sótano 6: aparece el Hongo carroñero."), p.registro);
});

prueba("Historia: la Torre y la Mazmorra se cuentan por capítulos que se abren al avanzar", () => {
    const inicio = leyendas.capitulosDeLeyenda("torre", 0, "Ana");
    igual(inicio.map((c) => c.id), ["prologo", "despertar", "cripta", "biblioteca", "fragua", "cima", "nubes", "corona", "epilogo"]);
    igual(inicio.map((c) => c.abierto), [true, true, true, false, false, false, false, false, false]);
    cierto(inicio[0].parrafos.join(" ").includes("Ana") && inicio[1].parrafos.join(" ").includes("Ana"), "usa el nombre del héroe");
    igual(inicio[2].parrafos.length, 1, "la Cripta: solo la llegada");
    cierto(inicio[2].pendiente.includes("piso 5") && inicio[3].bloqueado.includes("piso 6"), "lo que falta");
    const todo = leyendas.capitulosDeLeyenda("torre", 30, "Ana");
    cierto(todo.every((c) => c.abierto) && todo.slice(2, 8).every((c) => c.parrafos.length === 2), "con el piso 30, todo");
    cierto(todo[5].aviso.includes("Mazmorra"), "la cima de la tormenta abre la Mazmorra");
    cierto(todo[8].aviso.includes("Corona"), "el epílogo es la Corona");
    const abajo = leyendas.capitulosDeLeyenda("mazmorra", 7, "Ana");
    igual(abajo.map((c) => c.abierto), [true, true, true, false, false, false]);
    cierto(abajo[2].pendiente.includes("sótano 10") && abajo[3].bloqueado.includes("sótano 11"), "en la Mazmorra son sótanos");
    // Ningún texto se queda con la marca del nombre sin cambiar.
    for (const lugar of ["torre", "mazmorra"]) {
        cierto(!JSON.stringify(leyendas.capitulosDeLeyenda(lugar, 99, "Ana")).includes("{n}"), `${lugar}: sin {n}`);
    }

    // En la batalla: el prólogo al empezar (solo si nunca superaste un piso) y lo que sigue a cada guardián.
    igual(leyendas.relatoAlEmpezar("torre", 0, "Ana").paginas.map((p) => p.titulo), ["La Torre sin cima", "La Torre despierta", "Cripta olvidada"]);
    igual(leyendas.relatoAlEmpezar("torre", 3, "Ana"), null);
    igual(leyendas.relatoTrasGuardian("torre", 5, 0, "Ana").paginas.map((p) => p.titulo), ["Cripta olvidada", "Biblioteca prohibida"]);
    igual([leyendas.relatoTrasGuardian("torre", 5, 5, "Ana"), leyendas.relatoTrasGuardian("torre", 4, 0, "Ana"), leyendas.relatoTrasGuardian("torre", 35, 0, "Ana")],
          [null, null, null], "ya leído, sin guardián, o después del final");
    const tormenta = leyendas.relatoTrasGuardian("torre", 20, 19, "Ana");
    igual(tormenta.paginas.map((p) => p.titulo), ["Cima de la tormenta", "Puentes de nubes"], "la tormenta escondía más pisos");
    cierto(tormenta.paginas[0].aviso.includes("Mazmorra"), "al caer el Dragón se abre la Mazmorra");
    igual(leyendas.relatoTrasGuardian("torre", 30, 29, "Ana").paginas.map((p) => p.titulo), ["Corona de la Llama", "La Corona"]);
    const final = leyendas.relatoTrasGuardian("mazmorra", 20, 19, "Ana");
    igual(final.paginas.map((p) => p.titulo), ["Corazón del Abismo", "Saber bajar"]);
    cierto(final.paginas[1].aviso.includes("Rey Hueco"), "el epílogo de la Mazmorra");
});

prueba("Historia en la partida: se cuenta la primera vez que llegas, después ya no", () => {
    const estado = partidaNueva();
    cierto(acciones.empezarTorre(estado, 3).relato, "primera subida: el prólogo");
    igual(acciones.empezarTorre(estado, 3).relato, null, "al continuar, nada");
    const p = estado.arcade.torre;
    p.piso = 5;
    p.enemigo = torre.monstruoDelPiso(5);
    p.enemigo.vida = 1;
    acciones.accionTorre(estado, "atacar");
    const r = acciones.mejoraTorre(estado, p.opciones[0]);
    igual(r.relato.paginas.map((x) => x.titulo), ["Cripta olvidada", "Biblioteca prohibida"], "cae el Caballero sin Nombre");
    acciones.terminarTorre(estado);
    cierto(estado.arcade.records.torre === 5 && acciones.empezarTorre(estado, 4).relato === null, "la segunda vez, ya no");
});

prueba("Mazmorra: las copias viejas quedan sin partida en la Mazmorra, y una subida sin lugar sigue siendo de la Torre", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 8);
    delete estado.arcade.mazmorra;
    delete estado.arcade.torre.lugar;   // una partida guardada antes de la v29
    const copia = datos.desdeRespaldo(datos.textoRespaldo(estado));
    igual(copia.arcade.mazmorra, null);
    acciones.empezarTorre(copia, 8);   // «Continuar»
    igual(copia.arcade.torre.lugar, "torre");
    torre.actuar(copia.arcade.torre, "atacar");
});

prueba("Pixel art: el Reflejo sombrío es tu héroe en sombras", async () => {
    const [claro, oscuro] = [enSombras(255, 255, 255), enSombras(0, 0, 0)];
    cierto(claro[2] > claro[1] && oscuro.every((v) => v < 60), `violeta: ${claro} y ${oscuro}`);
    cierto(claro.reduce((a, b) => a + b) > oscuro.reduce((a, b) => a + b) + 200, "lo claro sigue más claro");
    igual(await sprites.spriteDeMonstruo("reflejo"), null, "sin tu avatar no hay reflejo");
    const imagen = await sprites.spriteDeMonstruo("reflejo", avatarDePrueba());
    cierto(typeof imagen === "string" && imagen.startsWith("data:image/png"), "es una imagen PNG");
    const todas = await sprites.spritesDeCriaturas(avatarDePrueba());
    igual(Object.keys(todas).length, 80, "las 80 criaturas para el bestiario (Torre, Mazmorra, Minas y Laberinto)");
});

prueba("Mazmorra (pantalla): tarjeta cerrada y abierta, batalla, historia, bestiario y final sin huecos", () => {
    const estado = partidaNueva();
    const ctx = () => ({ vida: vida.calcularVida(estado, hoy()), avatar: avatarDePrueba() });
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);
    let html = vistas.pantallaArcade(estado, ctx());
    sano(html, "el arcade (cerrada)");
    cierto(html.includes("Mazmorra del Abismo") && html.includes("0 de 20 pisos") && !html.includes('data-lugar="mazmorra"'), "cerrada");
    estado.arcade.records.torre = 20;
    html = vistas.pantallaArcade(estado, ctx());
    sano(html, "el arcade (abierta)");
    cierto(html.includes("Bajar a la mazmorra") && html.includes('data-accion="torre-abrir" data-lugar="mazmorra"') &&
           html.includes('data-accion="historia-abrir" data-lugar="torre"'), "abierta, con su historia");

    acciones.empezarTorre(estado, 4, "mazmorra");
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (cambios = {}) => ({ partida: estado.arcade.mazmorra, nombre: "Prueba", sprites: imagenes, eventos: [], menu: "principal",
                                   ultimo: "atacar", bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    html = vistas.pantallaTorre(t());
    sano(html, "la batalla");
    cierto(html.includes("Sótano 1") && html.includes("Cisternas anegadas") && html.includes("Sanguijuela gigante"), "en la Mazmorra");

    // Un turno con veneno.
    const p = estado.arcade.mazmorra;
    p.piso = 3;
    p.enemigo = torre.monstruoDelPiso(3, "mazmorra");
    bestiario.anotarEncuentro(estado.arcade.bestiario, p.enemigo.id);
    p.enemigo.intencion = "especial";
    p.heroe.vida = p.heroe.vidaMax = 500;
    html = vistas.pantallaTorre(t({ eventos: acciones.accionTorre(estado, "defender", null, "mazmorra").eventos }));
    sano(html, "el turno con veneno");
    cierto(html.includes("ff-numero veneno") && html.includes("Veneno: 2 turnos") && html.includes("envenenado"), "el veneno se ve");

    const relato = leyendas.relatoAlEmpezar("mazmorra", 0, "Prueba");
    html = vistas.pantallaRelato({ pagina: relato.paginas[0], sala: "data:image/png;base64,CC", numero: 1, total: 2 });
    sano(html, "una página de la historia");
    cierto(html.includes("La escalera") && html.includes('data-accion="torre-relato"') && html.includes("Continuar"), "la página");
    html = vistas.pantallaHistoria({ lugar: "mazmorra", capitulos: leyendas.capitulosDeLeyenda("mazmorra", 0, "Prueba") });
    sano(html, "la historia");
    cierto(html.includes("El Rey Hueco") && html.includes("🔒") && html.includes("Cisternas anegadas"), "la historia para releer");

    const todas = Object.fromEntries([...bestiario.ORDEN, ...bestiario.ORDEN_MAZMORRA].map((id) => [id, "data:image/png;base64,AA"]));
    html = vistas.pantallaBestiario({ bestiario: estado.arcade.bestiario, sprites: todas, mazmorra: true });
    sano(html, "el bestiario");
    cierto(html.includes("Aguaviva pálida") && html.includes("«Filamentos» · veneno") && html.includes("Sótano 5 · Guardiana"), "la sección de la Mazmorra");

    const resultado = acciones.terminarTorre(estado, "mazmorra");
    html = vistas.pantallaTorre(t({ partida: null, resultado }));
    sano(html, "el final");
    cierto(html.includes("2 sótanos") && html.includes("Fuerza") && html.includes("Bajar otra vez"), "el premio");
});


// ===== El equipo legendario, las mascotas y el reino (v26) =====

// Una partida de la Torre en el piso indicado, con habilidades y (si se pide) una mascota.
function torreCon(habilidades = [], piso = 1, mascotaDeBatalla = null, semilla = 11) {
    const p = torre.nuevaPartida(NIVELES_1, semilla, 1, { habilidades, mascota: mascotaDeBatalla });
    p.piso = piso;
    p.enemigo = torre.monstruoDelPiso(piso);
    return p;
}
const adulta = (especie, cambios = {}) => ({ especie, nombre: especie, etapa: "adulto", potencia: 1, alimentada: false, triste: false, ...cambios });

prueba("Equipo: cada objeto épico y legendario tiene una habilidad distinta; los comunes y raros, ninguna", () => {
    const usadas = [];
    for (const [id, o] of Object.entries(avatar.OBJETOS)) {
        const especial = o.rareza === "epico" || o.rareza === "legendario";
        igual(Boolean(o.habilidad), especial, `${id} (${o.rareza})`);
        if (o.habilidad) {
            cierto(habilidades.HABILIDADES[o.habilidad], `${id}: su habilidad existe`);
            cierto(!usadas.includes(o.habilidad), `${id}: no repite habilidad`);
            usadas.push(o.habilidad);
        }
    }
    const estado = partidaNueva();
    equipar(estado, "casco", "baston", "capa-real", "galaxia");   // épico, raro, épico, épico (fondo)
    igual(equipo.habilidadesDelEquipo(estado), ["firme", "regia", "estrellas"]);
    igual(acciones.equipoDeBatalla(estado).habilidades, ["firme", "regia", "estrellas"], "llegan a la Torre");
});

prueba("Habilidades épicas: Firme, Sombra, Ímpetu, Desgarro, Juramento, Valor, Manto regio, Bastión y Estrellas", () => {
    // Firme: el primer golpe de cada piso no hace daño; el segundo, sí.
    let p = torreCon(["firme"]);
    p.enemigo.vida = 999;
    torre.actuar(p, "defender");
    igual(p.heroe.vida, p.heroe.vidaMax, "el primer golpe no duele");
    torre.actuar(p, "defender");
    cierto(p.heroe.vida < p.heroe.vidaMax, "el segundo sí");
    // Sombra: con 20 % de esquivar, en 40 golpes alguno se esquiva.
    p = torreCon(["sombra"]);
    let esquivados = 0;
    for (let i = 0; i < 40; i++) {
        p.heroe.vida = p.heroe.vidaMax;
        p.enemigo.vida = 999;
        p.enemigo.intencion = "golpe";
        esquivados += torre.actuar(p, "defender").filter((e) => e.esquivado).length;
    }
    cierto(esquivados > 2 && esquivados < 20, `esquivó ${esquivados} de 40`);
    // Ímpetu: el primer golpe de cada piso es crítico.
    p = torreCon(["impetu"]);
    p.heroe.critico = 0;
    igual(torre.actuar(p, "atacar")[0].critico, true, "primer golpe crítico");
    igual(torre.actuar(p, "atacar")[0].critico, false, "el segundo, no");
    // Desgarro: un crítico hace ×2,8 (con la misma semilla, comparamos con y sin).
    const golpeCritico = (lista) => { const x = torreCon(lista); x.heroe.critico = 1; return torre.actuar(x, "atacar")[0].dano; };
    cierto(Math.abs(golpeCritico(["desgarro"]) - golpeCritico([]) * 2.8 / 1.8) <= 1, "desgarro");
    // Juramento: 30 % más contra un guardián (piso 5).
    const contraGuardian = (lista) => { const x = torreCon(lista, 5); x.heroe.critico = 0; return torre.actuar(x, "atacar")[0].dano; };
    cierto(Math.abs(contraGuardian(["juramento"]) - contraGuardian([]) * 1.3) <= 1, "juramento");
    // Valor: con menos de la mitad de la vida, 40 % más.
    const conPocaVida = (lista) => { const x = torreCon(lista); x.heroe.critico = 0; x.heroe.vida = 5; return torre.actuar(x, "atacar")[0].dano; };
    cierto(Math.abs(conPocaVida(["valor"]) - conPocaVida([]) * 1.4) <= 1, "valor");
    // Manto regio: al subir de piso te curas 35 % en vez de 10 %.
    p = torreCon(["regia"]);
    p.heroe.vida = 10;
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    p.opciones = ["afilar", "tomo", "frasco"];
    torre.elegirMejora(p, "afilar");
    igual(p.heroe.vida, 10 + Math.round(p.heroe.vidaMax * 0.35));
    // Bastión: defenderte te cura el triple. Estrellas: dos hechizos más.
    const sin = torre.heroeDeLaTorre(NIVELES_1);
    p = torreCon(["bastion"]);
    p.heroe.vida = 10;
    p.enemigo.intencion = "furia";   // no pega este turno
    igual(torre.actuar(p, "defender")[0].cura, sin.curaDefensa * 3);
    igual(torre.heroeDeLaTorre(NIVELES_1, { habilidades: ["estrellas"] }).manaMax, sin.manaMax + 2);
});

prueba("Habilidades legendarias: Constancia, Ojo del dragón, Sed, Embestida, Arcano, Gracia, Escamas y Gloria", () => {
    // Constancia: 4 mejoras para elegir y +1 de ataque por piso.
    let p = torreCon(["constancia"]);
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    igual(p.opciones.length, 4, "cuatro mejoras");
    const ataque = p.heroe.ataque;
    torre.elegirMejora(p, p.opciones.find((o) => o !== "afilar"));
    igual(p.heroe.ataque, ataque + 1, "+1 de ataque al subir");
    // Ojo del dragón: los hechizos hacen 20 % más (y la Torre muestra el punto débil: ver la prueba de pantalla).
    const hechizo = (lista) => { const x = torreCon(lista); x.heroe.critico = 0; return torre.actuar(x, "hechizo", "hielo")[0].dano; };
    cierto(Math.abs(hechizo(["ojo-dragon"]) - hechizo([]) * 1.2) <= 1, "ojo del dragón");
    // Sed: te cura el 30 % de lo que pegas.
    p = torreCon(["sed"]);
    p.heroe.vida = 5;
    p.enemigo.vida = 999;
    const golpe = torre.actuar(p, "atacar")[0];
    igual(golpe.cura, Math.round(golpe.dano * 0.3));
    // Embestida: el ataque va dos veces (el segundo, la mitad).
    const ataqueSimple = (lista) => { const x = torreCon(lista); x.heroe.critico = 0; return torre.actuar(x, "atacar")[0]; };
    const [uno, doble] = [ataqueSimple([]), ataqueSimple(["embestida"])];
    igual([doble.doble, doble.dano], [true, uno.dano + Math.round(uno.dano / 2)]);
    // Arcano: el punto débil hace ×2,2 (el murciélago es débil al rayo).
    cierto(Math.abs((() => { const x = torreCon(["arcano"]); x.heroe.critico = 0; return torre.actuar(x, "hechizo", "rayo")[0].dano; })()
                    - (() => { const x = torreCon([]); x.heroe.critico = 0; return torre.actuar(x, "hechizo", "rayo")[0].dano; })() * 2.2 / 1.5) <= 1, "arcano");
    // Gracia: una vez por piso, un golpe mortal te deja con el 40 % de tu vida.
    p = torreCon(["gracia"]);
    p.enemigo.vida = 999;
    p.heroe.vida = 1;
    p.enemigo.intencion = "fuerte";
    const eventos = torre.actuar(p, "atacar");
    cierto(eventos.some((e) => e.habilidad === "gracia") && p.fase === "batalla", "te salvó");
    igual(p.heroe.vida, Math.round(p.heroe.vidaMax * 0.4));
    p.heroe.vida = 1;
    p.enemigo.intencion = "fuerte";
    torre.actuar(p, "atacar");
    igual(p.fase, "fin", "la segunda vez en el mismo piso, no");
    // Escamas: le devuelves la mitad, y eso también puede derribarlo.
    p = torreCon(["escamas"]);
    p.enemigo.vida = 3;
    p.enemigo.intencion = "fuerte";
    const turno = torre.actuar(p, "defender");
    const suGolpe = turno.find((e) => e.quien === "enemigo" && e.dano);
    igual(suGolpe.reflejo, Math.round(suGolpe.dano / 2));
    igual(p.fase, "mejora", "lo derribaron tus escamas");
    // Gloria: 40 % más de vida máxima y una poción extra.
    const conGloria = torre.heroeDeLaTorre(NIVELES_1, { habilidades: ["gloria"] });
    igual([conGloria.vidaMax, conGloria.pociones], [Math.round(torre.heroeDeLaTorre(NIVELES_1).vidaMax * 1.4), torre.heroeDeLaTorre(NIVELES_1).pociones + 1]);
});

prueba("Mascotas: se adoptan en la Tienda, llegan como huevo, crecen desde ese día y se elige cuál acompaña", () => {
    const estado = partidaNueva();
    igual([mascota.especieActiva(estado), mascota.mascotasTuyas(estado)], ["dragon", ["dragon"]]);
    debeFallar(() => acciones.comprarMascota(estado, "dragon"), "no se vende");
    debeFallar(() => acciones.comprarMascota(estado, "fenix"), "Te faltan");
    acciones.ganar(estado, { monedas: 2000 });
    debeFallar(() => acciones.comprarMascota(estado, "buho"), "gemas");   // las monedas no sirven: se adoptan con gemas
    acciones.ganar(estado, { gemas: 500 });
    const leer = crearMision(estado);
    marcarEn(estado, leer, dia(-1));                            // una misión de ayer: cuenta para el dragón
    const antes = jugar(estado, () => acciones.comprarMascota(estado, "buho"));
    igual([estado.personaje.gemas, estado.personaje.monedas, mascota.especieActiva(estado)], [500 - mascota.MASCOTAS.buho.precio, 2010, "buho"]);
    debeFallar(() => acciones.comprarMascota(estado, "buho"), "ya es tuya");
    igual([mascota.totalDe(estado, "dragon"), mascota.totalDe(estado, "buho")], [1, 0], "el búho crece desde hoy");
    let a = avatar.describirAvatar(estado, hoy(), juego.resumen(estado, hoy()));
    igual([a.mascota.especie, a.mascota.nombre, a.mascota.etapa.clave], ["buho", "Búho", "huevo"]);
    acciones.nombrarMascota(estado, "Sabio");
    igual([mascota.nombreDe(estado, "buho"), mascota.nombreDe(estado, "dragon")], ["Sabio", "Chispa"], "renombra a la que te acompaña");
    acciones.elegirMascota(estado, "dragon");
    igual(mascota.especieActiva(estado), "dragon");
    debeFallar(() => acciones.elegirMascota(estado, "grifo"), "Todavía no");
    cierto(Array.isArray(antes), "se puede revisar lo que cambió");
    // Al eclosionar (10 misiones desde que lo adoptaste), avisa con su nombre.
    for (let i = 0; i < 9; i++) estado.completadas.push({ misionId: 999, fecha: hoy(), xp: 0, monedas: 0, atributo: "intelecto", dificultad: "facil" });
    const celebraciones = jugar(estado, () => estado.completadas.push({ misionId: 998, fecha: hoy(), xp: 0, monedas: 0, atributo: "intelecto", dificultad: "facil" }));
    cierto(celebraciones.some((c) => c.etiqueta === "¡El huevo eclosionó!" && c.titulo === "Sabio"), "el búho eclosiona");
    a = avatar.describirAvatar(estado, hoy(), juego.resumen(estado, hoy()));
    igual(a.mascota.especie, "dragon", "eclosionó aunque no te acompañara");
    // Una copia de antes de la v26: el dragón de siempre, sin adoptadas.
    const vieja = JSON.parse(datos.textoRespaldo(partidaNueva()));
    vieja.mascota = { nombre: "Humo", comidas: [] };
    const copia = datos.desdeRespaldo(JSON.stringify(vieja));
    igual([copia.mascota.nombre, copia.mascota.activa, copia.mascota.adoptadas], ["Humo", "dragon", {}]);
});

prueba("Mascotas en la Torre: el huevo no pelea, la cría actúa más lento, comer da 20 % y triste no pelea", () => {
    const estado = partidaNueva();
    const m = { especie: "dragon", nombre: "Chispa", etapa: avatar.ETAPAS_MASCOTA[2], total: 60, triste: false };
    igual(mascota.mascotaDeBatalla(estado, m, hoy()).potencia, 1, "adulta: 100 %");
    estado.mascota.comidas.push(hoy());
    igual(mascota.mascotaDeBatalla(estado, m, hoy()).potencia, 1.2, "comió hoy: 120 %");
    igual(mascota.mascotaDeBatalla(estado, { ...m, triste: true }, hoy()).potencia, 0, "triste: no pelea");
    igual(mascota.potenciaDe("cria"), 0.6);
    igual(mascota.potenciaDe("huevo"), 0);

    // El dragón adulto escupe fuego cada 3 turnos (y el bestiario aprende que el esqueleto es débil al fuego).
    let p = torreCon([], 2, adulta("dragon"));
    p.enemigo.vida = 999;
    const turnos = [1, 2, 3].map(() => torre.actuar(p, "defender").find((e) => e.quien === "mascota"));
    igual(turnos.map((e) => e?.tipo || null), [null, null, "ataque"]);
    igual([turnos[2].elemento, turnos[2].efecto], ["fuego", "debil"]);
    // La cría, cada 4.
    p = torreCon([], 2, adulta("dragon", { etapa: "cria", potencia: 0.6 }));
    p.enemigo.vida = 999;
    igual([1, 2, 3, 4].map(() => Boolean(torre.actuar(p, "defender").find((e) => e.quien === "mascota"))), [false, false, false, true]);
    // El huevo, nunca.
    p = torreCon([], 2, adulta("dragon", { etapa: "huevo", potencia: 0 }));
    p.enemigo.vida = 999;
    cierto([1, 2, 3, 4, 5, 6].every(() => !torre.actuar(p, "defender").some((e) => e.quien === "mascota")), "el huevo no pelea");

    // En la partida de verdad, el bestiario aprende del aliento del dragón.
    const conDragon = partidaNueva();
    acciones.empezarTorre(conDragon, 3);
    const t = conDragon.arcade.torre;
    t.mascota = adulta("dragon");
    t.turno = 2;
    t.enemigo.vida = 999;
    acciones.accionTorre(conDragon, "defender");
    igual(bestiario.loQueSabes(conDragon.arcade.bestiario, "murcielago", "fuego"), "normal", "lo aprendió el dragón");
});

prueba("Mascotas en la Torre: el búho devuelve hechizos, el basilisco petrifica y el fénix cura y te levanta una vez", () => {
    let p = torreCon([], 1, adulta("buho"));
    p.enemigo.vida = 999;
    p.heroe.mana = 0;
    torre.actuar(p, "defender");
    torre.actuar(p, "defender");
    igual(p.heroe.mana, 0);
    torre.actuar(p, "defender");
    igual(p.heroe.mana, 1, "al tercer turno, un hechizo");

    p = torreCon([], 3, adulta("basilisco"));
    p.enemigo.vida = 999;
    p.turno = 3;
    p.heroe.vida = p.heroe.vidaMax;
    p.enemigo.intencion = "fuerte";
    const eventos = torre.actuar(p, "atacar");
    cierto(eventos.some((e) => e.tipo === "petrificar") && eventos.some((e) => e.tipo === "petrificada"), "queda de piedra");
    igual([p.heroe.vida, p.enemigo.intencion], [p.heroe.vidaMax, "fuerte"], "pierde el turno y guarda su golpe");

    p = torreCon([], 1, adulta("fenix"));
    p.enemigo.vida = 999;
    p.heroe.vida = 10;
    const llama = torre.actuar(p, "atacar").find((e) => e.quien === "mascota");
    igual([llama?.tipo, llama?.cura], ["cura", Math.round(p.heroe.vidaMax * 0.04)], "la llama vital cura cada turno");
    p.heroe.vida = 1;
    p.enemigo.intencion = "fuerte";
    const cae = torre.actuar(p, "atacar");
    cierto(cae.some((e) => e.tipo === "renacer") && p.fase === "batalla", "renace");
    igual(p.heroe.vida > p.heroe.vidaMax * 0.4, true);
    p.heroe.vida = 1;
    p.enemigo.intencion = "fuerte";
    p.heroe.proteccion = 0;
    torre.actuar(p, "atacar");
    igual(p.fase, "fin", "solo una vez por subida");
});

prueba("Reino: las guaridas son de los jefes de cada campaña, se liberan al vencerlos y abren la fortaleza", () => {
    igual([7, 12, 17, 22].map((n) => mapa.tipoDeLugar(n, 0)), ["guarida", "guarida", "guarida", "guarida"]);
    igual(mapa.tipoDeLugar(7, 5), "memorial", "en la Ciudadela, memoriales");
    igual(mapa.tipoDeLugar(7, 6), "guarida", "y en la segunda vuelta, guaridas otra vez");
    const estado = partidaNueva();
    let campanas = campana.estadoCampanas(estado);
    const valle = mapa.senoresDeRegion(0, campanas);
    igual(valle.map((s) => s.jefe.id), ["lobo", "medusa", "narciso", "recaudadores"]);
    igual(mapa.senoresDeRegion(1, campanas).map((s) => s.jefe.id).sort(), ["cerbero", "minotauro", "pluton", "sirenas"]);
    igual(mapa.senoresDeRegion(6, campanas)[0].numero, 5, "Valle II: los jefes de la ronda 2");
    igual(valle.map((s) => [s.liberada, s.actual]), [[false, true], [false, true], [false, true], [false, true]]);

    // 30 lecturas (Intelecto): 7 lugares y Medusa cae (pero el Lobo no).
    const leer = crearMision(estado);
    envejecer(estado, 29);
    for (let n = -29; n <= 0; n++) marcarEn(estado, leer, dia(n));
    campanas = campana.estadoCampanas(estado);
    const medusa = mapa.senoresDeRegion(0, campanas).find((s) => s.jefe.id === "medusa");
    igual([medusa.n, medusa.liberada], [12, true]);
    igual(mapa.lugaresPorReclamar(estado).map((l) => l.id), ["r1-5"], "la guarida del Lobo (lugar 7) no tiene botín: sigue en pie");
    for (let n = 0; n < 24; n++) estado.tareas.push({ id: 900 + n, nombre: "x", hechaEn: hoy(), premio: null });   // 54 pasos: lugar 13
    igual(mapa.lugaresPorReclamar(estado).map((l) => l.id), ["r1-5", "r1-10", "r1-12"]);
    const xp = estado.atributos.intelecto;
    acciones.reclamarLugar(estado, "r1-12");
    igual(estado.atributos.intelecto - xp, mapa.LUGARES.guarida.premio.xp, "el botín de la guarida es de su campaña");
    debeFallar(() => acciones.reclamarLugar(estado, "r1-7"), "sigue en pie");

    // La fortaleza: aunque llegues, se abre cuando caen los cuatro.
    for (let n = 0; n < 50; n++) estado.tareas.push({ id: 950 + n, nombre: "x", hechaEn: hoy(), premio: null });   // lugar 26
    cierto(!mapa.lugaresPorReclamar(estado).some((l) => l.id === "r1-25"), "fortaleza cerrada");
    for (const atributo of ["fuerza", "carisma", "riqueza"]) {
        const m = crearMision(estado, { atributo, dificultad: "dificil" });
        for (let n = -10; n <= 0; n++) marcarEn(estado, m, dia(n));                      // 11 × 15 = 165 > 150
    }
    campanas = campana.estadoCampanas(estado);
    cierto(mapa.regionLiberada(0, campanas), "los cuatro cayeron");
    cierto(mapa.lugaresPorReclamar(estado).some((l) => l.id === "r1-25"), "fortaleza abierta");
    const dibujo = mapa.datosParaDibujar(estado, 0, campanas);
    igual([dibujo.alcanzado, dibujo.regionLibre, dibujo.lugares[12].reclamado, dibujo.lugares[7].libre], [25, true, true, true]);
    const reino = mapa.resumenDelReino(estado, campanas);
    igual([reino.length, reino[0].liberada, reino[1].pisada, reino[2].pisada], [6, true, true, false]);
});

prueba("Crónica: el prólogo con tu nombre, un capítulo por región y un párrafo por cada señor que cae", () => {
    const estado = partidaNueva();
    let capitulos = cronica.capitulosDeLaCronica(estado, campana.estadoCampanas(estado), { heroe: "Aria", dragon: "Chispa" });
    igual(capitulos.map((c) => c.numero), ["Prólogo", "I", "II", "III", "IV", "V", "VI"]);
    cierto(capitulos[0].parrafos.some((p) => p.texto.includes("Aria") && p.texto.includes("Chispa")), "con tu nombre y el de tu dragón");
    igual(capitulos.filter((c) => c.abierto).length, 2, "el prólogo y el valle");
    cierto(capitulos[2].bloqueado.includes("El Bosque de las Dudas"), "lo que falta, cerrado");
    cierto(capitulos[1].parrafos.filter((p) => p.tipo === "pendiente").length === 4, "los cuatro señores todavía gobiernan");
    cierto(capitulos[1].parrafos.some((p) => p.texto.startsWith("Los Recaudadores") && p.texto.includes("gobiernan")), "plural: «gobiernan»");
    const leer = crearMision(estado);
    for (let n = -18; n <= 0; n++) marcarEn(estado, leer, dia(n));                        // 152 de daño: cae Medusa
    capitulos = cronica.capitulosDeLaCronica(estado, campana.estadoCampanas(estado), { heroe: "Aria", dragon: "Chispa" });
    const caida = capitulos[1].parrafos.find((p) => p.tipo === "caida");
    cierto(caida && caida.texto.startsWith("Medusa"), "el párrafo de Medusa");
    cierto(capitulos.every((c) => c.parrafos.every((p) => !/undefined|NaN|\{n\}|\{m\}/.test(p.texto))), "sin huecos");
});

prueba("Dibujo: las 7 mascotas en sus 3 etapas y los mapas de las 6 regiones son SVG válidos", () => {
    const valido = (svg, que) => {
        dibujoSano(svg.trim(), que);
        cierto(!new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror"), `${que} se puede leer como imagen`);
    };
    for (const especie of Object.keys(mascota.MASCOTAS)) {
        for (const etapa of avatar.ETAPAS_MASCOTA) {
            for (const triste of [false, true]) valido(dibujarMascota({ especie, nombre: especie, etapa, total: 0, triste }), `${especie} ${etapa.clave}`);
        }
    }
    const estado = partidaNueva();
    const campanas = campana.estadoCampanas(estado);
    for (let region = 0; region < 7; region++) {
        valido(dibujarMapa({ ...mapa.datosParaDibujar(estado, region, campanas), alcanzado: 9 }), `mapa de la región ${region + 1}`);
    }
});

prueba("Pantallas: el reino, la tienda de mascotas y la Torre con mascota y habilidades se dibujan sin huecos", async () => {
    const estado = partidaDemo();
    estado.mascota.adoptadas.grifo = { nombre: "Garra", desde: hoy() };
    equipar(estado, "corona-dragon", "lanza-dragon");
    const ctx = { vida: vida.calcularVida(estado, hoy()), avatar: avatar.describirAvatar(estado, hoy(), juego.resumen(estado, hoy())),
                  info: juego.resumen(estado, hoy()), hoy: hoy(), evento: null, regionMapa: null };
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);
    let html = vistas.pantallaMapa(estado, ctx);
    sano(html, "el reino");
    cierto(html.includes("Crónica del reino") && html.includes("mapa-imagen") && html.includes("data-accion=\"mapa-senor\""), "las partes del reino");
    html = vistas.pantallaTienda(estado, { ...ctx, subvista: { tienda: "mascotas" } });
    sano(html, "la tienda (mascotas)");
    cierto(html.includes("data-accion=\"comprar-mascota\" data-especie=\"fenix\""), "las mascotas en la tienda");
    html = vistas.pantallaTienda(estado, { ...ctx, subvista: { tienda: "equipo" } });
    cierto(html.includes("Ojo del dragón"), "las habilidades en el equipo de la tienda");
    sano(vistas.pantallaPersonaje(estado, ctx), "el personaje");
    sano(vistas.pantallaArcade(estado, ctx), "el arcade");

    // La Torre: con el «Ojo del dragón» el menú de magia ya sabe el punto débil.
    acciones.empezarTorre(estado, 7);
    estado.arcade.torre.mascota = adulta("grifo", { nombre: "Garra" });
    const t = { partida: estado.arcade.torre, nombre: "Aria", sprites: { heroe: "", enemigo: "", sala: "", mascota: "x" }, eventos: [],
                menu: "magia", ultimo: "fuego", bestiario: {}, resultado: null, fichas: 1 };
    html = vistas.pantallaTorre(t);
    sano(html, "la Torre");
    cierto(html.includes("¡punto débil!") && html.includes("ff-mascota"), "punto débil revelado y la mascota en la escena");
    estado.arcade.torre.turno = 1;
    estado.arcade.torre.enemigo.vida = 999;
    const { eventos } = acciones.accionTorre(estado, "atacar");
    html = vistas.pantallaTorre({ ...t, menu: "principal", eventos });
    sano(html, "el turno con mascota");
    cierto(html.includes("ff-garra") && html.includes("Garras"), "el ataque del grifo se anima");

    // La imagen del mapa en pixel art.
    const imagen = await sprites.spriteDeMapa(mapa.datosParaDibujar(estado, 0, campana.estadoCampanas(estado)));
    cierto(imagen.startsWith("data:image/png"), "el mapa en pixel art");
});


// ===== Misiones de cada mes y pantalla de carga (v28) =====

prueba("Misiones mensuales: tocan ciertos días de cada mes; el 31 cae en el último día de los meses cortos", () => {
    const pago = { creadaEn: "2026-01-01", archivadaEn: null, pausas: [], dias: null, veces: null, diasMes: [5] };
    igual(["2026-02-05", "2026-02-06", "2026-03-05", "2026-03-04"].map((f) => juego.tocaEseDia(pago, f)), [true, false, true, false]);
    const ultimo = { ...pago, diasMes: [31] };
    igual(["2026-01-31", "2026-02-28", "2026-04-30", "2026-04-29", "2028-02-29"].map((f) => juego.tocaEseDia(ultimo, f)),
          [true, true, true, false, true], "el 31 = el último día (también en un año bisiesto)");
    const quincenal = { ...pago, diasMes: [1, 15] };
    igual(juego.proximaVez(quincenal, "2026-10-13"), "2026-10-15");
    igual(juego.proximaVez(quincenal, "2026-10-16"), "2026-11-01");
    igual(juego.proximaVez({ ...pago, archivadaEn: "2026-10-01" }, "2026-10-13"), null, "archivada: nunca más");
    // Cuenta como una misión que toca ese día: está en la lista del día y no en la de otros días.
    igual(juego.misionesDelDia([pago], "2026-10-05").length, 1);
    igual(juego.misionesDelDia([pago], "2026-10-06").length, 0);
});

prueba("Misiones mensuales: se crean y se editan con sus días; sin días, no se puede", () => {
    const estado = partidaNueva();
    debeFallar(() => crearMision(estado, { frecuencia: "mes", diasMes: [] }), "al menos un día del mes");
    debeFallar(() => crearMision(estado, { frecuencia: "mes", diasMes: ["0", "32"] }), "al menos un día del mes");
    const m = crearMision(estado, { nombre: "Pagar el arriendo", frecuencia: "mes", diasMes: ["15", "1", "15"] });
    igual([m.diasMes, m.dias, m.veces], [[1, 15], null, null], "ordenados y sin repetir");
    acciones.editarMision(estado, { ...m, id: m.id, frecuencia: "semana", veces: "2" });
    igual([m.diasMes, m.veces], [null, 2], "al pasar a semanal se olvidan los días del mes");
    acciones.editarMision(estado, { ...m, id: m.id, frecuencia: "mes", diasMes: ["31"] });
    igual([m.diasMes, m.veces, m.dias], [[31], null, null]);
    igual(vistas.textoDiasMes([5]), "El 5 de cada mes");
    igual(vistas.textoDiasMes([31]), "El último día de cada mes");
    igual(vistas.textoDiasMes([1, 15, 31]), "Los días 1, 15 y último día de cada mes");
    // La plantilla mensual de la lista se crea igual.
    const plantilla = PLANTILLAS_MISIONES.find((p) => p.frecuencia === "mes");
    acciones.crearMision(estado, plantilla);
    igual(estado.misiones[estado.misiones.length - 1].diasMes, plantilla.diasMes);
});

prueba("Misiones mensuales: hoy salen en la lista, cuentan para la vida y el aviso se calla hasta la próxima vez", () => {
    const estado = partidaNueva();
    const diaDeHoy = Number(hoy().slice(8));
    const m = crearMision(estado, { nombre: "Revisar finanzas", frecuencia: "mes", diasMes: [String(diaDeHoy)], aviso: "09:00" });
    igual(juego.misionesDelDia(estado.misiones, hoy()).map((x) => x.id), [m.id], "toca hoy");
    cierto(vida.calcularVida(estado, hoy()).pendienteHoy > 0, "si no la haces hoy, pierdes vida");
    let aviso = avisosDeMisiones(estado, hoy())[0];
    igual([aviso.dias, aviso.saltarHasta], [null, null], "hoy toca: el servidor avisa");
    acciones.completarMision(estado, m.id);
    aviso = avisosDeMisiones(estado, hoy())[0];
    const proxima = juego.proximaVez(m, sumarDias(hoy(), 1));
    igual(aviso.saltarHasta, sumarDias(proxima, -1), "hecha: se calla hasta el día antes de la próxima");
    cierto(proxima > sumarDias(hoy(), 20), "la próxima es el mes que viene");
    // En la ficha se mide en veces, y en «Otros días» dice cuándo toca.
    igual(juego.estadisticasMision(estado, m, hoy()).unidad, "vez");
    const otra = crearMision(estado, { nombre: "Pagar cuentas", frecuencia: "mes", diasMes: [String(diaDeHoy === 1 ? 2 : 1)] });
    const html = vistas.pantallaHoy(estado, {
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info: juego.resumen(estado, hoy()),
        avatar: avatar.describirAvatar(estado, hoy(), juego.resumen(estado, hoy())), vida: vida.calcularVida(estado, hoy()),
        maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null, subvista: { hoy: "misiones" }, diarioVista: {},
    });
    cierto(html.includes("de cada mes") && html.includes("📅 próxima:"), "Hoy muestra la frecuencia y la próxima fecha");
    cierto(!/undefined|NaN/.test(html), "sin huecos");
    igual(otra.diasMes.length, 1);
});

prueba("Pantalla de carga: está en la página, se quita sola al arrancar y nunca se queda más de 8 segundos", async () => {
    const pagina = await (await fetch("../index.html", { cache: "no-store" })).text();
    cierto(pagina.includes('id="carga"') && pagina.includes("carga-barra") && pagina.includes("carga-consejo"), "las partes de la pantalla de carga");
    cierto(pagina.includes("8000") && pagina.indexOf('id="carga"') < pagina.indexOf('id="bloqueo"'), "va antes que todo, con su seguro de 8 segundos");
    const app = await (await fetch("../js/app.js", { cache: "no-store" })).text();
    cierto(/ocultarCarga\(\);\s*\}/.test(app), "iniciar() la quita al terminar");
});


// ===== La app ordenada (v27) =====

prueba("Orden: cada pantalla larga se divide en secciones y cada cosa está en un solo lugar", () => {
    const estado = partidaDemo();
    const info = juego.resumen(estado, hoy());
    const ctx = (subvista = {}) => ({
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista, campanaVista: null, diarioVista: {},
    });
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);
    const veces = (html, texto) => html.split(texto).length - 1;

    // Hoy › Aurelio (v52): el héroe, el resumen de sus rivales y un solo panel «Tu día»; sin lista «En combate» ni chips del mapa o del arcade.
    let html = vistas.pantallaHoy(estado, ctx({ hoy: "aurelio" }));
    sano(html, "Hoy");
    cierto(html.includes('aria-label="Tus rivales"') && veces(html, "class=\"panel panel-dia\"") === 1, "héroe con rivales y panel del día");
    cierto(!html.includes("En combate") && !html.includes("data-pantalla=\"arcade\"") && !html.includes("data-pantalla=\"mapa\""), "sin lo repetido");

    // Progreso: los números o los logros.
    html = vistas.pantallaProgreso(estado, ctx());
    sano(html, "Progreso");
    cierto(html.includes("data-vista=\"logros\"") && html.includes("class=\"numeros\"") && html.includes("atributo-rasgos"), "números y rasgos");
    cierto(!html.includes(">Estadísticas</h2>"), "las estadísticas van con la racha (ya no son un panel aparte)");
    html = vistas.pantallaProgreso(estado, ctx({ progreso: "logros" }));
    sano(html, "Progreso › Logros");
    cierto(html.includes("Salón de la fama") && !html.includes("Calendario"), "solo los logros");

    // Héroe: cuatro secciones; los rasgos ya no se repiten aquí.
    for (const seccion of ["equipo", "mascotas", "apariencia", "historia"]) {
        html = vistas.pantallaPersonaje(estado, ctx({ personaje: seccion }));
        sano(html, `Héroe › ${seccion}`);
        cierto(!html.includes("atributo-rasgos") && !html.includes("Clase:"), `${seccion}: sin los rasgos repetidos`);
    }
    cierto(vistas.pantallaPersonaje(estado, ctx({ personaje: "historia" })).includes("data-pantalla=\"pacto\""), "el pacto está en la historia");

    // Tienda: tres secciones; los objetos de logro ya no se repiten aquí.
    for (const seccion of ["recompensas", "equipo", "mascotas"]) {
        html = vistas.pantallaTienda(estado, ctx({ tienda: seccion }));
        sano(html, `Tienda › ${seccion}`);
        cierto(!html.includes("Objetos que no se venden"), `${seccion}: sin los objetos de logro repetidos`);
    }

    // Aventuras: se ve una campaña a la vez (con su selector) y los accesos al reino y al arcade.
    html = vistas.pantallaAventuras(estado, ctx());
    sano(html, "Aventuras");
    igual(veces(html, "data-accion=\"ver-campana\""), 4, "las 4 campañas en el selector");
    igual(veces(html, "class=\"panel campana jefe"), 1, "una sola tarjeta de campaña");
    cierto(html.includes("data-pantalla=\"mapa\"") && html.includes("data-pantalla=\"arcade\""), "los accesos");
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
    // Un novato tiene 15 de armadura: recibe ×1,31 (y cada misión fallada la gasta).
    const estado = partidaNueva();
    const leer = crearMision(estado);                                          // normal: 8
    crearMision(estado, { nombre: "Gym", dificultad: "dificil" });            // difícil: 12
    vidaDesde(estado, 2);
    marcarEn(estado, leer, dia(-2));                                           // hace 2 días solo faltó el gym
    const v = vida.calcularVida(estado, hoy());
    // Hace 2 días: gym 12 × 1,31 = 16 (armadura 15 → 6, y leer la repara a 9).
    // Ayer: leer 8 × 1,39 = 11 (armadura → 3) y gym 12 × 1,46 = 18 → 29.
    igual(v.registro.map((r) => r.dano), [16, 29, 0], "hace 2 días, ayer y hoy");
    igual(v.puntos, 105 - 16 - 29);
    igual(v.pendienteHoy, 30, "lo que perderías si no haces nada hoy (con la armadura rota y el tope de 30)");
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
    igual(vida.calcularVida(estado, hoy()).puntos, 94, "ayer no la hiciste: 8 × 1,31 = −11");
    acciones.completarMision(estado, leer.id, dia(-1));
    igual(vida.calcularVida(estado, hoy()).puntos, 105, "la marcaste: ya no hay daño");

    const otra = partidaNueva();
    const gym = crearMision(otra);
    vidaDesde(otra, 3);                                    // 3 días sin hacerla: −11, −11, −12 (la armadura se gasta)
    igual(vida.calcularVida(otra, hoy()).puntos, 71);
    acciones.completarMision(otra, gym.id);
    igual(vida.calcularVida(otra, hoy()).puntos, 71 + 4 + 10, "misión normal + día perfecto");
});

prueba("Vida: en plena forma (80 % o más) das +10 % de XP y monedas; si no, lo normal", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    vidaDesde(estado, 3);                                  // 71 de 105 = 68 %: «bien», sin bono
    igual(vida.calcularVida(estado, hoy()).nivel, "bien");
    igual(acciones.completarMision(estado, leer.id), { xp: 25, forma: false, clave: false });
    igual(vida.calcularVida(estado, hoy()).nivel, "forma", "con 85 de 105 vuelve a estar en forma");
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
    vidaDesde(estado, 3);                                  // 71 de 105
    debeFallar(() => acciones.tomarPocion(estado), "Te faltan 40");
    acciones.ganar(estado, { monedas: 100 });
    acciones.tomarPocion(estado);
    igual([vida.calcularVida(estado, hoy()).puntos, estado.personaje.monedas], [96, 60], "71 + 25");
    acciones.deshacerPocion(estado);
    igual([vida.calcularVida(estado, hoy()).puntos, estado.personaje.monedas], [71, 100]);
});

prueba("Vida: al abrir la app avisa una sola vez cuánta vida perdiste", () => {
    const estado = partidaNueva();
    crearMision(estado);
    vidaDesde(estado, 1);
    igual(acciones.revisarVidaAlAbrir(estado).celebraciones[0].titulo, "Perdiste 11 de vida ayer (1 pendiente sin hacer)");
    igual(acciones.revisarVidaAlAbrir(estado), null, "la segunda vez ya no");
});

prueba("Metas semanales: al cerrar la semana quitan vida por cada vez que faltó (proporcional si empezó a mitad)", () => {
    const estado = partidaNueva();
    const gym = crearMision(estado, { nombre: "Gym", frecuencia: "semana", veces: 3 });   // normal: 8 por vez (× armadura)
    const lunesPasado = sumarDias(lunesDe(hoy()), -7);
    const domingo = sumarDias(lunesPasado, 6);
    estado.personaje.creadoEn = gym.creadaEn = estado.vida.desde = lunesPasado;
    marcarEn(estado, gym, lunesPasado);                    // 1 de 3: faltaron 2
    const danoDelDomingo = () => vida.calcularVida(estado, hoy()).registro.find((r) => r.fecha === domingo).dano;
    igual(danoDelDomingo(), 22, "11 + 11 (la armadura se gasta un poco con la primera)");
    estado.vida.desde = sumarDias(lunesPasado, 3);         // si la vida empezó el jueves: pedía 2 (de 4 días)
    igual(danoDelDomingo(), 11);
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
    cierto(resumenParaAvisos(estado, hoy()).dias[hoy()].cuerpoNoche.includes("❤️ 105/105: si no terminas hoy pierdes 11 de vida"),
           "el aviso de la noche");
    acciones.empezarDescanso(estado, hoy());
    cierto(!resumenParaAvisos(estado, hoy()).dias[hoy()].cuerpoNoche.includes("pierdes"), "de descanso no pierdes nada");

    const herido = partidaNueva();
    crearMision(herido);
    vidaDesde(herido, 3);                                  // 71 de 105
    acciones.empezarTorre(herido, 7);
    const h = herido.arcade.torre.heroe;
    igual(h.vida, Math.round((h.vidaMax * 71) / 105));
    igual(vida.proporcionTorre({ puntos: 5, maxima: 100 }), 0.3, "nunca menos de 30 %");
});

prueba("Copias viejas: la vida empieza a contar el día que llega la actualización", () => {
    const viejo = partidaNueva();
    delete viejo.vida;
    delete viejo.descansos;
    delete viejo.armadura;
    const cargado = datos.desdeRespaldo(JSON.stringify(viejo));
    igual([cargado.vida.desde, cargado.vida.pociones, cargado.descansos], [hoy(), [], []]);
    igual(cargado.armadura, { desde: hoy(), cambios: [] }, "la armadura y los robos tampoco cambian el pasado");
});


// ===== Armadura, robo de vida y equipo (v24) =====

// Pone objetos (ya comprados) sin pasar por la tienda.
function equipar(estado, ...ids) {
    for (const id of ids) {
        estado.avatar.comprados.push(id);
        estado.avatar.equipado[avatar.OBJETOS[id].espacio] = id;
    }
}

prueba("Armadura: sale de la ropa de tu etapa + tus objetos de protección, y decide cuánto duele fallar", () => {
    const estado = partidaNueva();
    igual(equipo.armaduraMaxima(estado), 15, "un novato solo tiene su túnica");
    equipar(estado, "casco", "capa", "mandoble");
    igual(equipo.poderDelEquipo(estado), { armadura: 20, ataque: 7, magia: 0, suerte: 0 });
    igual(equipo.armaduraMaxima(estado), 35, "15 de la ropa + 12 del casco + 8 de la capa (el arma no protege)");
    estado.avatar.equipado.cabeza = "corona-dragon";   // puesta, pero no la tienes: no cuenta
    igual(equipo.armaduraMaxima(estado), 23);
    // Con 0 recibes 50 % más; con 40, lo normal; con 80 o más, la mitad.
    igual([0, 40, 80, 100].map(equipo.factorArmadura), [1.5, 1, 0.5, 0.5]);
    igual(equipo.textoPoder(avatar.OBJETOS["corona-dragon"].poder), "🛡️ +18 · 🔮 +4 · 🍀 +4");

    // Cada etapa protege más, y cada objeto solo da poderes que existen (las armas no dan armadura).
    igual(avatar.ETAPAS.map((e) => e.armadura), [15, 25, 35, 45]);
    for (const [id, objeto] of Object.entries(avatar.OBJETOS)) {
        for (const clave of Object.keys(objeto.poder || {})) cierto(clave in equipo.PODERES, `poder «${clave}» de ${id}`);
        if (objeto.espacio === "mano" || objeto.espacio === "fondo") cierto(!objeto.poder?.armadura, `${id} no da armadura`);
        if (["cabeza", "pecho", "espalda"].includes(objeto.espacio)) cierto(objeto.poder?.armadura > 0, `${id} protege`);
    }
});

prueba("Armadura: fallar la gasta, cumplir la repara, y con buena armadura el golpe duele menos", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);                       // normal: pega 8 y gasta 6 de armadura
    vidaDesde(estado, 1);
    let v = vida.calcularVida(estado, hoy());
    igual([v.registro[0].dano, v.armadura.puntos, v.armadura.maxima], [11, 9, 15], "8 × 1,31 = 11; la armadura baja de 15 a 9");
    acciones.completarMision(estado, leer.id);              // +3 por la misión y +5 del día perfecto
    igual(vida.calcularVida(estado, hoy()).armadura.puntos, 15, "reparada (sin pasar del máximo)");

    const heroe = partidaNueva();
    crearMision(heroe);
    heroe.personaje.xp = 30000;                             // nivel 25: Héroe (armadura de acero: 35)
    equipar(heroe, "corona-dragon", "alas-dragon");        // +18 y +18 = 71
    vidaDesde(heroe, 1);
    v = vida.calcularVida(heroe, hoy());
    igual([v.armadura.maxima, v.registro[0].dano, v.armadura.puntos], [71, 5, 65], "8 × 0,61 = 5");
});

prueba("Armadura: lo que te pones hoy no cambia el pasado, y llega entero", () => {
    const estado = partidaNueva();
    crearMision(estado);
    vidaDesde(estado, 2);                                   // 2 días sin hacerla: −11 y −11; armadura 15 → 9 → 3
    jugar(estado, () => {});                                // (como al abrir la app: apunta la armadura que tenías)
    let v = vida.calcularVida(estado, hoy());
    igual([v.puntos, v.armadura.puntos], [83, 3]);
    jugar(estado, () => {
        acciones.ganar(estado, { gemas: 200 });
        acciones.comprarObjeto(estado, "casco");            // +12 de armadura (se equipa solo)
    });
    v = vida.calcularVida(estado, hoy());
    igual([v.puntos, v.armadura.puntos, v.armadura.maxima], [83, 15, 27], "la vida de ayer no cambió; el casco suma sus 12");
    jugar(estado, () => acciones.equiparObjeto(estado, "casco"));   // te lo quitas
    v = vida.calcularVida(estado, hoy());
    igual([v.armadura.puntos, v.armadura.maxima], [3, 15]);

    // Y lo que ya te pegó hoy queda apuntado: ponerte armadura después no lo rebaja.
    const otra = partidaNueva();
    const leer = crearMision(otra);
    jugar(otra, () => {});
    igual(acciones.fallarMision(otra, leer.id, hoy(), "tiempo").dano, 11);
    igual(otra.fallas[0].golpe, 11, "el golpe queda en el registro");
    jugar(otra, () => {
        acciones.ganar(otra, { gemas: 2000 });
        acciones.comprarObjeto(otra, "corona-dragon");      // +18 de armadura
    });
    igual(vida.calcularVida(otra, hoy()).puntos, 105 - 11, "sigue costando 11");
});

prueba("Robo de vida: al fallar, el jefe de esa categoría se cura con lo que te quitó", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);                       // Intelecto → Medusa (150 de vida)
    vidaDesde(estado, 3);
    for (const n of [-3, -2, -1]) marcarEn(estado, leer, dia(n));   // 3 golpes de 8: Medusa queda en 126
    igual(campana.estadoCampanas(estado).intelecto.vida, 126);

    const r = acciones.fallarMision(estado, leer.id, hoy(), "tiempo");
    igual([r.dano, r.robo.total, r.robo.base, r.robo.conArmadura], [11, 11, 8, 11], "8 × 1,31 con armadura de novato");
    igual(r.robo.golpes.map((g) => [g.jefe.id, g.dano, g.curo, g.jefeVida]), [["medusa", 11, 11, { antes: 126, despues: 137, maxima: 150 }]]);
    igual(vida.calcularVida(estado, hoy()).puntos, 105 - 11);
    const c = campana.estadoCampanas(estado).intelecto;
    igual([c.vida, c.curado, c.dano], [137, 11, 24], "se curó con tu vida");
    igual(vida.robosDeJefes(estado, hoy()), [{ fecha: hoy(), atributo: "intelecto", cantidad: 11 }]);

    // La escena del robo se dibuja con eso.
    const escena = vistas.pantallaRobo(r.robo, "<svg></svg>");
    cierto(escena.includes("Medusa te robó 11 de vida") && escena.includes("La Parálisis se hace más fuerte: recuperó 11"), "el texto de la escena");
    cierto(!/undefined|NaN/.test(escena), "la escena no tiene huecos");

    acciones.quitarFalla(estado, leer.id, hoy());           // te arrepientes: se lo devuelve
    igual(campana.estadoCampanas(estado).intelecto.vida, 126);
});

prueba("Robo de vida: un jefe no pasa de su vida llena ni revive a uno vencido; lo de antes de la v24 no cuenta", () => {
    const estado = partidaNueva();
    acciones.crearPrincipal(estado, { nombre: "Curso", atributo: "intelecto", submisiones: "a\nb\nc\nd\ne" });
    const principal = estado.principales[0];
    for (const paso of principal.submisiones.slice(0, 4)) acciones.alternarSubmision(estado, principal.id, paso.id);   // 4 pasos = 160: cae Medusa
    const leer = crearMision(estado);
    let c = campana.estadoCampanas(estado).intelecto;
    igual([c.derrotados, c.jefe.id, c.vida], [1, "cerbero", 300]);
    const r = acciones.fallarMision(estado, leer.id, hoy(), "ganas");
    c = campana.estadoCampanas(estado).intelecto;
    igual([r.dano, r.robo.golpes[0].curo, c.derrotados, c.vida], [11, 0, 1, 300], "tú pierdes vida, pero Cerbero ya estaba lleno");

    const vieja = partidaNueva();
    crearMision(vieja);
    vidaDesde(vieja, 2);
    vieja.armadura.desde = hoy();                           // la v24 llegó hoy
    const v = vida.calcularVida(vieja, hoy());
    igual([v.registro.map((d) => d.dano), v.armadura.puntos], [[8, 8, 0], 15], "esos días valen como antes: 8, sin gastar armadura");
    igual(vida.robosDeJefes(vieja, hoy()), [], "y nadie te robó");
});

prueba("Robo de vida: al abrir la app te cuenta qué jefes te robaron mientras no estabas", () => {
    const estado = partidaNueva();
    crearMision(estado);                                                     // Intelecto: Medusa
    crearMision(estado, { nombre: "Gym", atributo: "fuerza", dificultad: "dificil" });   // Fuerza: El Lobo
    vidaDesde(estado, 1);
    const robo = acciones.revisarVidaAlAbrir(estado).robo;
    // Leer: 8 × 1,31 = 11 (armadura 15 → 9). Gym: 12 × 1,39 = 17.
    igual([robo.titulo, robo.total, robo.base, robo.conArmadura], ["Ayer, lo que no hiciste", 28, 20, 28]);
    igual(robo.golpes.map((g) => [g.jefe.id, g.dano]), [["lobo", 17], ["medusa", 11]], "primero el que más robó");
    const escena = vistas.pantallaRobo(robo, "<svg></svg>");
    cierto(escena.includes("Tus jefes te robaron 28 de vida") && !/undefined|NaN/.test(escena), "la escena con varios jefes");
});

prueba("Equipo en la Torre: suma ataque, magia y suerte, y tu armadura para parte de cada golpe", () => {
    const sin = torre.heroeDeLaTorre(NIVELES_1);
    const con = torre.heroeDeLaTorre(NIVELES_1, { ataque: 7, magia: 10, suerte: 4, armadura: 60 });
    igual([sin.ataque, sin.hechizo, sin.manaMax, Math.round(sin.critico * 100), sin.proteccion], [8, 13, 2, 10, 0]);
    igual([con.ataque, con.hechizo, con.manaMax, Math.round(con.critico * 100), con.proteccion], [15, 28, 3, 14, 0.3]);
    igual(torre.danoRecibido(con, 10), 7, "la armadura para el 30 %");
    igual(torre.danoRecibido({ ...con, defendiendo: true }, 10), Math.round(7 * (1 - con.defensa)), "y además te defiendes");
    igual(torre.heroeDeLaTorre(NIVELES_1, { armadura: 100 }).proteccion, 0.4, "máximo 40 %");

    // La partida de verdad empieza con lo que llevas puesto y la armadura que tienes ahora.
    const estado = partidaNueva();
    equipar(estado, "mandoble", "casco");
    const deBatalla = acciones.equipoDeBatalla(estado);
    igual([deBatalla.armadura, deBatalla.ataque, deBatalla.magia, deBatalla.suerte], [27, 7, 0, 0]);
    igual(deBatalla.habilidades, ["firme", "juramento"], "y las habilidades del casco y del mandoble");
    acciones.empezarTorre(estado, 5);
    igual([estado.arcade.torre.heroe.ataque, estado.arcade.torre.heroe.proteccion], [15, 27 / 200]);
});

prueba("Equipo en los minijuegos: escudos, vidas de más, fuerza, zonas más anchas y monedas que valen más", () => {
    igual(arcade.ventajasDelEquipo({}), { escudos: 0, vidasExtra: 0, fuerza: 1, zona: 1, suerte: 1 }, "sin equipo, nada cambia");
    const v = arcade.ventajasDelEquipo({ armadura: 60, ataque: 10, magia: 10, suerte: 10 });
    igual(v, { escudos: 2, vidasExtra: 2, fuerza: 1.5, zona: 1.4, suerte: 1.5 });
    igual(arcade.ventajasDelEquipo({ armadura: 100, magia: 50 }), { escudos: 3, vidasExtra: 2, fuerza: 1, zona: 1.5, suerte: 1 }, "con tope");
    igual(arcade.textoVentajas("carrera", v), "🛡️ 2 escudos · 🍀 monedas +50 %");
    igual(arcade.textoVentajas("golpe", v), "⚔️ +50 % de daño · 🔮 zonas 40 % más anchas");
    igual(arcade.textoVentajas("lluvia", arcade.ventajasDelEquipo({})), "");
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
    const [monedas, gemas] = [estado.personaje.monedas, estado.personaje.gemas];
    const { premio } = acciones.abrirCofre(estado, azarFijo(0.1, 0.5));    // 10 → gemas: 15 + 13 = 28
    igual([premio.tipo, premio.cantidad, estado.personaje.gemas - gemas, estado.personaje.monedas - monedas], ["gemas", 28, 28, 0]);
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

prueba("Mapa del reino: cada 4 pasos un lugar; tesoros y santuarios se reclaman una vez", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    envejecer(estado, 29);
    for (let n = -29; n <= 0; n++) marcarEn(estado, leer, dia(n));           // 30 pasos; 240 de daño vencen a Medusa (+10 % de viaje)
    const pos = mapa.posicion(estado);
    igual([mapa.pasosBrutos(estado), pos.pasos, pos.lugar, pos.region, pos.enRegion, pos.hastaSiguiente], [30, 33, 8, 0, 8, 3]);
    igual([5, 10, 25, 7, 8].map((n) => mapa.tipoDeLugar(n)), ["tesoro", "santuario", "fortaleza", "guarida", "camino"]);
    igual(mapa.lugaresPorReclamar(estado).map((l) => l.id), ["r1-5"]);
    const gemas = estado.personaje.gemas;
    acciones.reclamarLugar(estado, "r1-5");
    igual(estado.personaje.gemas - gemas, mapa.LUGARES.tesoro.premio.gemas);
    debeFallar(() => acciones.reclamarLugar(estado, "r1-5"), "ya lo reclamaste");
    debeFallar(() => acciones.reclamarLugar(estado, "r1-10"), "todavía no");
    debeFallar(() => acciones.reclamarLugar(estado, "r1-7"), "sigue en pie");
    igual(mapa.nombreRegion(6), "El Valle del Comienzo II");

    const otra = partidaNueva();                                               // 44 pasos (48 con el viaje más rápido): lugar 12
    const gym = crearMision(otra);
    envejecer(otra, 43);
    for (let n = -43; n <= 0; n++) marcarEn(otra, gym, dia(n));
    igual(mapa.lugaresPorReclamar(otra).map((l) => l.id), ["r1-5", "r1-10", "r1-12"], "y la guarida de Medusa, ya liberada");
    const [xp, gemasAntes] = [otra.personaje.xp, otra.personaje.gemas];
    acciones.reclamarTodo(otra);
    igual([otra.personaje.gemas - gemasAntes, otra.personaje.xp - xp, mapa.lugaresPorReclamar(otra).length], [45, 60, 0], "reclamar todo (tesoro 25 + santuario 40 XP + guarida 20 y 20)");
});

prueba("Tu dragón: alimentarlo cuesta 15, una vez al día, y te cura 3; acariciarlo responde", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.alimentarDragon(estado), "Te faltan 15");
    acciones.ganar(estado, { gemas: 50 });                                     // la comida se paga con gemas
    crearMision(estado);
    vidaDesde(estado, 2);                                                      // 105 − 16 = 89
    const antes = vida.calcularVida(estado, hoy()).puntos;
    acciones.alimentarDragon(estado);
    igual([vida.calcularVida(estado, hoy()).puntos - antes, estado.personaje.gemas], [mascota.COMIDA.cura, 35]);
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


// ===== La primera piedra (v33) =====

prueba("La primera piedra: un pergamino largo, completo y con tu nombre en la dedicatoria", () => {
    igual(pergamino.CAPITULOS.length, 10, "diez capítulos");
    for (const c of pergamino.CAPITULOS) cierto(c.titulo && c.parrafos.length >= 1 && c.parrafos.every((p) => p.length > 20), `«${c.titulo}» tiene texto`);
    igual(pergamino.ENSENANZAS.length, 10, "diez enseñanzas");
    cierto(pergamino.palabras() >= 1500, `es largo: ${pergamino.palabras()} palabras`);
    igual(pergamino.minutosDeLectura(), Math.round(pergamino.palabras() / 200));
    const p = pergamino.pergaminoPara("Ana");
    igual(p.capitulos.map((c) => c.numero).slice(0, 3), ["I", "II", "III"]);
    const texto = JSON.stringify(p);
    cierto(!texto.includes("{n}") && p.dedicatoria[0].includes("en las tuyas, Ana"), "el nombre en su lugar");
    cierto(pergamino.ENSENANZAS.includes("Puedes fallar un día. Nunca dos seguidos."), "la ley de tu pacto");
});

prueba("La primera piedra (pantalla): se lee como un rollo, sin huecos, y se llega desde Héroe y desde Aurelio", () => {
    const estado = partidaNueva();
    estado.personaje.nombre = "Ana <b>";
    const html = vistas.pantallaPergamino(estado);
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    cierto(html.includes("rollo-vara") && html.includes("rollo-papel") && html.includes("La primera piedra"), "el rollo");
    igual(html.split('class="rollo-capitulo"').length - 1, 10, "los diez capítulos");
    cierto(html.includes("Ana &lt;b&gt;") && !html.includes("Ana <b>"), "el nombre va escapado");
    cierto(html.includes("Las enseñanzas de la primera piedra") && html.includes("— Lía, la de la primera piedra"), "enseñanzas y firma");

    const c = maestro.contexto(estado, hoy(), Date.now());
    const dialogo = (opcion) => vistas.dialogoMaestro({ maestro: c }, { modo: "respuesta", respuesta: "…", opcion });
    cierto(dialogo("sinGanas").includes('data-accion="pergamino-abrir"') && dialogo("abrumado").includes('data-accion="pergamino-abrir"'),
           "Aurelio lo ofrece si no tienes ganas o estás abrumado");
    igual(dialogo("consejo").includes("pergamino-abrir"), false, "y no en cualquier respuesta");
});


// ===== La Saga de la Llama (v35) =====

prueba("Saga: 7 actos en orden con un objetivo final; el primero que falta es el de ahora", () => {
    igual(saga.ACTOS.length, 7);
    igual(new Set(saga.ACTOS.map((a) => a.id)).size, 7, "ids distintos");
    const historias = saga.HISTORIAS.map((h) => h.id);
    igual(historias, ["pergamino", "orrin", "memorias", "casio", "cronica", "torre", "mazmorra", "voces", "libro"], "las historias, en el orden en que pasan");
    for (const h of saga.HISTORIAS) cierto(["pergamino-abrir", "memorias-abrir", "novela-abrir", "ir", "historia-abrir"].includes(h.abrir.accion), `${h.id} se puede abrir`);
    for (const a of saga.ACTOS) {
        cierto(a.titulo && a.relato && a.objetivo && a.cierre && a.condicion.meta > 0, `${a.id} tiene todo`);
        cierto(a.lee === "pacto" || historias.includes(a.lee), `${a.id} lleva a una historia`);
    }
    igual(saga.ACTOS.find((a) => a.id === "huevo").condicion.meta, avatar.ETAPAS_MASCOTA[1].desde, "el huevo se abre cuando el dragón eclosiona");

    const campanas = (...derrotados) => Object.fromEntries(derrotados.map((d, i) => [`c${i}`, { derrotados: d }]));
    const ir = (cambios) => saga.estadoDeSaga({ completadas: 0, pacto: false, campanas: campanas(0, 0, 0, 0), records: {}, torreEnCurso: 0, ...cambios });
    igual([ir({}).indice, ir({}).objetivo], [0, "Pon tu primera piedra: cumple tu primera misión."]);
    igual(ir({ completadas: 3 }).indice, 1, "después, el juramento");
    igual(ir({ completadas: 3, pacto: true }).indice, 2);
    let s = ir({ completadas: 10, pacto: true, campanas: campanas(2, 1, 1, 0) });
    igual([s.indice, s.avance, s.meta], [3, 3, 4], "faltan los primeros señores de una Sombra");
    igual(ir({ completadas: 10, pacto: true, campanas: campanas(1, 1, 1, 1) }).indice, 4, "la cima de la Torre");
    igual(ir({ completadas: 10, pacto: true, campanas: campanas(1, 1, 1, 1), torreEnCurso: 20 }).indice, 4, "con 20 pisos no basta: la Corona está en el 30");
    igual(ir({ completadas: 10, pacto: true, campanas: campanas(1, 1, 1, 1), torreEnCurso: 30 }).indice, 5, "la subida de ahora también cuenta");
    s = ir({ completadas: 10, pacto: true, campanas: campanas(5, 7, 5, 4), records: { torre: 32, mazmorra: 20 } });
    igual([s.indice, s.avance], [6, 19], "los 20 señores (cada Sombra cuenta hasta 5)");
    s = ir({ completadas: 10, pacto: true, campanas: campanas(5, 5, 5, 5), records: { torre: 32, mazmorra: 20 } });
    igual([s.indice, s.completada, s.objetivo], [7, true, saga.VIGIA.objetivo], "eres Vigía");
    igual(ir({ completadas: 10, campanas: campanas(5, 5, 5, 5), records: { torre: 32, mazmorra: 20 } }).indice, 1, "en orden: sin el juramento no se avanza");
    igual(saga.conNombres("{n} y {m}", { heroe: "Ana", dragon: "Chispa" }), "Ana y Chispa");
});

prueba("Saga (v36): el arcade no termina la historia; la Llama se enciende al final del camino del reino", () => {
    const campanas = (...derrotados) => Object.fromEntries(derrotados.map((d, i) => [`c${i}`, { derrotados: d }]));
    const ir = (cambios) => saga.estadoDeSaga({ completadas: 50, pacto: true, campanas: campanas(1, 1, 1, 1), records: {}, torreEnCurso: 0, ...cambios });
    const ultimo = saga.ACTOS[saga.ACTOS.length - 1];
    igual([ultimo.id, ultimo.condicion.tipo], ["llama", "senores"], "el último acto es la Llama, y se gana con tus jefes (la vida real)");
    igual(saga.ACTOS.map((a) => a.id).slice(3), ["reino", "cima", "abismo", "llama"], "el reino, la cima, el abismo y, al final, la Llama");

    // Torre y Mazmorra completas, pero el reino a medias: la saga sigue en la Llama.
    let s = ir({ records: { torre: 30, mazmorra: 30 } });
    igual([s.actos[s.indice].id, s.completada, s.avance, s.meta], ["llama", false, 4, 20], "con todo el arcade, falta el reino");
    s = ir({ campanas: campanas(1, 0, 1, 0), records: { torre: 30, mazmorra: 30 } });
    igual(s.actos.map((a) => a.hecho ? "hecho" : a.actual ? "ahora" : a.listo ? "listo" : "falta"),
          ["hecho", "hecho", "hecho", "ahora", "listo", "listo", "falta"], "lo que ya lograste del arcade espera su turno");
    // El reino libre sin haber subido la Torre: falta llegar a la cima.
    s = ir({ campanas: campanas(5, 5, 5, 5) });
    igual([s.actos[s.indice].id, s.completada], ["cima", false]);
    // Las dos cosas: Vigía.
    cierto(ir({ campanas: campanas(5, 5, 5, 5), records: { torre: 30, mazmorra: 20 } }).completada, "las dos: eres Vigía");

    // Los textos: ni la Torre ni la Mazmorra dicen que la Llama ya arde.
    const textoDe = (lugar) => JSON.stringify(leyendas.capitulosDeLeyenda(lugar, 99, "Ana"));
    cierto(leyendas.LEYENDAS.torre.zonas.corona.caida.includes("la Llama no prende"), "en la Corona la Llama sigue fría");
    cierto(!/vuelve a arder|hasta la Llama|luz de la Llama/.test(textoDe("torre") + textoDe("mazmorra")), "nadie la enciende en el arcade");
    cierto(textoDe("mazmorra").includes("fuego de los cuatro memoriales"), "la Mazmorra manda de vuelta al reino");
    cierto(avatar.OBJETOS["coraza-vigia"].logro.texto.startsWith("Despejar la tormenta"), "la Coraza del Vigía, al despejar la tormenta");
    cierto(saga.conNombres(saga.VIGIA.relato, { heroe: "Ana", dragon: "Chispa" }).includes("fuego de los cuatro memoriales"), "el final: el fuego del reino");
});

prueba("Saga en la partida: se ve en Hoy y en Héroe › Historia, y cada acto cumplido se celebra", () => {
    const estado = partidaNueva();
    const info = () => juego.resumen(estado, hoy());
    const ctx = (subvista = {}) => ({
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info: info(), avatar: avatar.describirAvatar(estado, hoy(), info()),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista, campanaVista: null, diarioVista: {},
    });
    let html = vistas.pantallaHoy(estado, ctx({ hoy: "aurelio" }));
    cierto(html.includes("Saga · Acto I: La primera piedra") && html.includes("Pon tu primera piedra"), "el objetivo de ahora, en Hoy");

    const leer = crearMision(estado);
    const celebraciones = jugar(estado, () => acciones.completarMision(estado, leer.id));
    const acto = celebraciones.find((c) => c.etiqueta === "Saga · Acto I cumplido");
    cierto(acto && acto.detalle.startsWith("Siguiente: Haz el juramento") && acto.maestro, "se celebra y dice lo que sigue");

    html = vistas.pantallaHoy(estado, ctx({ hoy: "aurelio" }));
    cierto(html.includes("Acto II: El juramento") && !html.includes("Sella tu pacto"), "el pacto no se repite: lo pide la saga");

    html = vistas.pantallaPersonaje(estado, ctx({ personaje: "historia" }));
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    cierto(html.includes("La Saga de la Llama") && html.includes("Las historias, en orden") && html.includes("📜 Firmar tu pacto"), "la saga en Héroe");
    const orden = ["La primera piedra", "Memorias de Aurelio", "Crónica del reino", "La Torre de los Vigías", "El Rey Hueco", "Tu libro"]
        .map((titulo) => html.indexOf(titulo, html.indexOf("Las historias, en orden")));
    cierto(orden.every((posicion, i) => posicion > 0 && (i === 0 || posicion > orden[i - 1])), `en orden: ${orden}`);
    cierto(maestro.responder(estado, maestro.contexto(estado, hoy()), "comoVoy").includes("En la saga, tu objetivo es este: Haz el juramento"), "Aurelio te lo recuerda");
});

prueba("Historias conectadas: Aurelio no está en la cima antes de tiempo y cada historia nombra a las otras", async () => {
    const leer = async (ruta) => (await fetch(ruta, { cache: "no-store" })).text();
    const [cronicaJs, leyendasJs] = await Promise.all([leer("../js/cronica.js"), leer("../js/leyendas.js")]);
    cierto(!cronicaJs.includes("Desde lo alto de la Torre, el Maestro Aurelio"), "la Crónica: Aurelio espera al pie de la Torre");
    cierto(!leyendasJs.includes("En la cima, Aurelio aviva la Llama"), "la Mazmorra: Aurelio sube recién al final");
    cierto(cronicaJs.includes("la Llama de la Torre se apagó. Entonces volvieron las Cuatro Sombras"), "las Sombras volvieron por la Llama");
    cierto(leyendasJs.includes("una muchacha llamada Lía"), "la Torre nombra a Lía");
    cierto(memorias.MEMORIAS[1].parrafos[0].includes("«La primera piedra»"), "Casio le dio el pergamino a Aurelio");
    cierto(memorias.MEMORIAS[7].parrafos[1].includes("junto a la Llama apagada"), "y al final suben juntos a esperar el fuego");
    cierto(cronicaJs.includes("ese fuego es el que falta en la cima"), "la Crónica lleva a la Llama");
    cierto(pergamino.pergaminoPara("Ana").dedicatoria[0].includes("Casio") && pergamino.pergaminoPara("Ana").dedicatoria[0].includes("Aurelio"),
           "el pergamino pasó de Casio a Aurelio, y de Aurelio a ti");
    cierto(mascota.MASCOTAS.dragon.texto.includes("último huevo de los dragones de la Torre"), "tu dragón, el último de la Torre");
});


// ===== La Torre despierta (v38) =====

const NIVELES_3 = { fuerza: 3, intelecto: 3, carisma: 3, riqueza: 3 };
function torreDespierta(piso = 1, niveles = NIVELES_3, semilla = 11) {
    const p = torre.nuevaPartida(niveles, semilla);
    p.piso = piso;
    p.enemigo = torre.monstruoDelPiso(piso);
    p.enemigo.intencion = "golpe";
    return p;
}

prueba("Técnicas (v38): una por atributo, desde su nivel 3, y una vez por piso", () => {
    igual(torre.heroeDeLaTorre({ fuerza: 3, intelecto: 2, carisma: 4, riqueza: 1 }).tecnicas, ["quebrar", "intimidar"], "según tus niveles reales");
    igual(torre.heroeDeLaTorre(NIVELES_1).tecnicas, [], "un héroe nuevo todavía no sabe ninguna");
    cierto(torre.motivoTecnica(torre.heroeDeLaTorre(NIVELES_1), "analizar").includes("nivel 3"), "se dice cómo se aprende");
    igual(new Set(Object.values(torre.TECNICAS).map((t) => t.atributo)).size, 4, "una por cada atributo");

    const p = torreDespierta(2);
    const eventos = torre.actuar(p, "tecnica", "certero");
    cierto(eventos[0].tecnica === "certero" && eventos[0].critico, "el Golpe certero siempre es crítico");
    debeFallar(() => torre.actuar(p, "tecnica", "certero"), "Ya la usaste");
    debeFallar(() => torre.actuar(p, "tecnica", "volar"), "no existe");
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    torre.elegirMejora(p, p.opciones[0]);
    torre.resolverSala(p, "seguir");   // (v42) el piso 3 empieza con una sala
    igual(torre.motivoTecnica(p.heroe, "certero"), null, "en el piso siguiente se puede otra vez");
    p.heroe.maestria = 1;
    p.enemigo.intencion = "golpe";
    torre.actuar(p, "tecnica", "certero");
    igual(torre.motivoTecnica(p.heroe, "certero"), null, "con «Maestría», una vez más por piso");
});

prueba("Barrera y Quebrar (v38): la barrera se traga tus golpes; Quebrar la rompe de una vez", () => {
    const p = torreDespierta(5);   // el Caballero sin Nombre levanta «Escudo del juramento»
    igual(bestiario.CRIATURAS.caballero.especial.tipo, "barrera");
    p.enemigo.intencion = "especial";
    let eventos = torre.actuar(p, "defender");
    const barrera = Math.round(p.enemigo.vidaMax * torre.ESPECIALES.barrera.parte);
    cierto(eventos.some((e) => e.especial === "barrera") && p.enemigo.barrera === barrera, `levanta una barrera de ${barrera}`);
    cierto(torre.textoIntencion({ ...p.enemigo, intencion: "especial", barrera: 0 }).texto.includes(`absorbe ${barrera}`), "se avisa antes");
    const vida = p.enemigo.vida;
    eventos = torre.actuar(p, "atacar");
    const golpe = eventos.find((e) => e.quien === "heroe");
    cierto(golpe.absorbido > 0 && p.enemigo.vida === vida - (golpe.dano - golpe.absorbido), "lo que absorbe no llega a su vida");
    p.enemigo.barrera = 999;
    p.enemigo.intencion = "golpe";
    eventos = torre.actuar(p, "tecnica", "quebrar");
    cierto(eventos[0].rompio && p.enemigo.barrera === 0 && eventos[0].absorbido === 0, "Quebrar la rompe y pega entero");
});

prueba("Carga e Intimidar (v38): un golpe cargado se suelta al turno siguiente, salvo que lo intimides", () => {
    const p = torreDespierta(10);   // el Archivista carga «Conjuro prohibido»
    p.heroe.vidaMax = p.heroe.vida = 999;
    p.enemigo.intencion = "especial";
    let eventos = torre.actuar(p, "defender");
    cierto(eventos.some((e) => e.especial === "carga") && p.enemigo.cargando && p.enemigo.intencion === "descarga", "carga, y el próximo turno descarga");
    cierto(torre.textoIntencion(p.enemigo, p.heroe).texto.startsWith("¡Descarga «Conjuro prohibido»!"), torre.textoIntencion(p.enemigo, p.heroe).texto);
    igual(torre.danoPrevisto(p.enemigo), Math.round(p.enemigo.ataque * torre.ESPECIALES.carga.golpe), "pega mucho más");
    eventos = torre.actuar(p, "tecnica", "intimidar");
    cierto(eventos.some((e) => e.tipo === "intimidada") && !p.enemigo.cargando && p.heroe.vida === 999, "intimidado: pierde la carga y no pega");

    // Sin intimidar, la descarga pega; defenderse la aguanta mejor.
    const q = torreDespierta(10);
    q.heroe.vidaMax = q.heroe.vida = 999;
    q.enemigo.cargando = true;
    q.enemigo.intencion = "descarga";
    const previsto = torre.danoRecibido({ ...q.heroe, defendiendo: true }, torre.danoPrevisto(q.enemigo));
    torre.actuar(q, "defender");
    igual([999 - q.heroe.vida, q.enemigo.cargando], [previsto, false], "descarga contra tu escudo (con la vida llena, defender no cura)");
});

prueba("Espejo, regeneración y cambio de forma (v38)", () => {
    // El Grimorio voraz se cubre con «Página espejo»: tu próximo hechizo rebota.
    const p = torreDespierta(7);
    p.enemigo.espejo = true;
    const vida = p.enemigo.vida;
    const eventos = torre.actuar(p, "hechizo", "fuego");
    const tuyo = eventos.find((e) => e.quien === "heroe");
    cierto(tuyo.reflejado > 0 && p.enemigo.vida === vida && !p.enemigo.espejo, "no le hace nada, te devuelve la mitad y el espejo se va");
    // El Cieno de magma se regenera al final de cada turno.
    const q = torreDespierta(12);
    q.enemigo.vida = 10;
    const r = torre.actuar(q, "defender");
    cierto(r.some((e) => e.quien === "regenera" && e.cura > 0), "se regenera");
    // El Apagador cambia de punto débil a media vida.
    const a = torreDespierta(30, { fuerza: 30, intelecto: 30, carisma: 30, riqueza: 30 });
    igual([torre.formaActual(a.enemigo).debil, torre.formaActual(a.enemigo).resiste], ["rayo", "fuego"]);
    a.enemigo.vida = Math.round(a.enemigo.vidaMax / 2) + 5;
    const f = torre.actuar(a, "atacar");
    cierto(f.some((e) => e.quien === "fase") && a.enemigo.cambio, "¡cambia de forma!");
    igual([torre.formaActual(a.enemigo).debil, torre.formaActual(a.enemigo).resiste], ["fuego", "rayo"], "a oscuras le teme al fuego");
});

prueba("Voluntad (v38): tu racha la empieza, pelear la llena y su golpe rompe todo", () => {
    igual(torre.heroeDeLaTorre(NIVELES_1, { racha: 4 }).voluntad, 4 * torre.VOLUNTAD.porDia, "tu racha de días");
    igual(torre.heroeDeLaTorre(NIVELES_1, { racha: 90 }).voluntad, torre.VOLUNTAD.inicialMax, "con tope");
    const p = torreDespierta(4);
    p.heroe.vidaMax = p.heroe.vida = 999;
    p.heroe.voluntad = 0;
    torre.actuar(p, "atacar");
    igual(p.heroe.voluntad, torre.VOLUNTAD.alGolpear + torre.VOLUNTAD.alRecibir, "golpear y aguantar llenan la barra");
    debeFallar(() => torre.actuar(p, "voluntad"), "todavía no está llena");

    p.heroe.voluntad = torre.VOLUNTAD.max;
    Object.assign(p.enemigo, { vida: 9999, vidaMax: 9999, barrera: 80, cargando: true, intencion: "descarga" });
    const eventos = torre.actuar(p, "voluntad");
    const golpe = eventos.find((e) => e.tipo === "voluntad");
    cierto(golpe.dano >= Math.max(p.heroe.ataque, p.heroe.hechizo) * 2 && golpe.rompio, `un golpe enorme (${golpe.dano}) que rompe lo que lo cubre`);
    cierto(p.enemigo.barrera === 0 && !p.enemigo.cargando && p.enemigo.vida === 9999 - golpe.dano, "sin barrera y sin carga");
    cierto(p.heroe.voluntad <= torre.VOLUNTAD.alRecibir, "la barra se vacía");
});

prueba("La Torre despierta (v38): 30 pisos, criaturas más duras sobre las nubes y su historia", () => {
    igual(bestiario.ZONAS.slice(4).map((z) => z.id), ["nubes", "corona"]);
    igual([torre.monstruoDelPiso(25).id, torre.monstruoDelPiso(30).id], ["coloso-nubes", "apagador"], "dos guardianes nuevos");
    // Sobre la tormenta son más duros que lo que daría la cuenta de siempre.
    const piso = 26;
    const deSiempre = Math.round(22 + 9 * piso + 0.6 * piso * piso);
    cierto(torre.monstruoDelPiso(piso).vidaMax > deSiempre, "más vida sobre las nubes");
    // Casi todas las criaturas de arriba tienen un truco.
    const arriba = bestiario.ORDEN.slice(20);
    cierto(arriba.every((id) => bestiario.CRIATURAS[id].especial || bestiario.CRIATURAS[id].regenera), "todas las de arriba tienen truco");
    for (const tipo of ["barrera", "carga", "reflejo"]) cierto(bestiario.ORDEN.filter((id) => bestiario.CRIATURAS[id].especial?.tipo === tipo).length >= 4, `varias usan ${tipo}`);
    cierto(maestro.consejoDeGuardian("apagador").includes("fuego"), "Aurelio avisa del cambio de forma");
    // El premio llega a su tope en el piso 20.
    igual(torre.premio(20), { gemas: 60, xp: 45 });
    igual(torre.premio(30), { gemas: 60, xp: 45 });
    // La saga pide la Corona (piso 30), no la cima de la tormenta.
    igual(saga.ACTOS.find((a) => a.id === "cima").condicion.meta, bestiario.ORDEN.length);
    igual(avatar.OBJETOS["coraza-vigia"].logro.meta, 20, "la Coraza del Vigía sigue al despejar la tormenta (piso 20)");
});

prueba("El despertar se cuenta una vez (v38): en el prólogo a quien empieza, y aparte a quien ya había subido", () => {
    const veterano = partidaNueva();
    veterano.arcade.records.torre = 6;
    const primera = acciones.empezarTorre(veterano, 3);
    igual(primera.relato.paginas.map((p) => p.titulo), ["La Torre despierta"]);
    cierto(veterano.arcade.despertar && primera.relato.paginas[0].parrafos.join(" ").includes("Prueba"), "con tu nombre, y queda anotado");
    igual(acciones.empezarTorre(veterano, 3).relato, null, "la segunda vez, ya no");

    const nuevo = partidaNueva();
    igual(acciones.empezarTorre(nuevo, 3).relato.paginas.map((p) => p.titulo), ["La Torre sin cima", "La Torre despierta", "Cripta olvidada"]);
    cierto(nuevo.arcade.despertar, "a quien empieza, se le cuenta en el prólogo");
    igual(datos.estadoInicial().arcade.despertar, false);
    igual(datos.desdeRespaldo(datos.textoRespaldo(veterano)).arcade.despertar, true, "va en la copia de seguridad");
});

prueba("Analizar en la partida (v38): te enseña su punto débil y queda en el bestiario", () => {
    const estado = partidaNueva();
    estado.atributos.intelecto = 150;   // nivel 3 de Intelecto
    acciones.empezarTorre(estado, 3);
    const id = estado.arcade.torre.enemigo.id;
    estado.arcade.torre.heroe.vidaMax = estado.arcade.torre.heroe.vida = 999;
    acciones.accionTorre(estado, "tecnica", "analizar");
    igual(estado.arcade.bestiario[id].elementos.length, 3, "los tres hechizos, de una vez");
    cierto(estado.arcade.torre.enemigo.analizado, "y en la batalla ya lo sabes");
});

prueba("Pantalla de la Torre (v38): técnicas, Voluntad y los trucos de la criatura, sin huecos", () => {
    const estado = partidaNueva();
    estado.atributos.fuerza = 150;   // nivel 3 de Fuerza: Quebrar
    acciones.empezarTorre(estado, 3);
    const p = estado.arcade.torre;
    const t = (cambios = {}) => ({ partida: p, nombre: "Prueba", sprites: {}, eventos: [], menu: "principal", ultimo: "atacar",
                                   bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    let html = vistas.pantallaTorre(t());
    cierto(html.includes("Técnicas") && html.includes("1 lista") && html.includes("ff-voluntad-barra") && !html.includes('data-torre="voluntad"'), "el menú y la barra");
    html = vistas.pantallaTorre(t({ menu: "tecnicas" }));
    cierto(html.includes("🔨 Quebrar") && html.includes("🔒 Intelecto 3") && !/undefined|NaN/.test(html), "las técnicas, con las que faltan");
    p.heroe.voluntad = torre.VOLUNTAD.max;
    Object.assign(p.enemigo, { barrera: 12, espejo: true, cargando: true });
    html = vistas.pantallaTorre(t());
    cierto(html.includes('data-torre="voluntad"') && html.includes("Barrera: 12") && html.includes("Espejo") && html.includes("Cargando"), "Voluntad lista y los trucos a la vista");
    const eventos = acciones.accionTorre(estado, "voluntad").eventos;
    html = vistas.pantallaTorre(t({ eventos }));
    cierto(html.includes("Golpe de Voluntad") && html.includes("ff-voluntad") && !/undefined|NaN/.test(html), "el golpe se anuncia");
});


// ===== La Torre, en el valle (v37) =====

prueba("La Torre en el valle (v37): el mapa la dibuja al principio del camino y la Ciudadela tiene el brasero", () => {
    const estado = partidaNueva();
    const campanas = campana.estadoCampanas(estado);
    // Las ventanas de la Torre que están encendidas (6 para 30 pisos).
    const ventanas = (svg) => {
        const torre = svg.slice(svg.indexOf('<g class="torre-valle">'), svg.indexOf("</g>", svg.indexOf('<g class="torre-valle">')));
        return torre.split('height="3" fill="#ffd27a"').length - 1;
    };
    let valle = mapa.datosParaDibujar(estado, 0, campanas);
    igual(valle.torre, { pisos: 0, tope: 30, encendida: false });
    cierto(dibujarMapa(valle).includes('<g class="torre-valle">'), "la Torre está en el valle, junto a la partida");
    igual(ventanas(dibujarMapa(valle)), 0, "sin pisos, ventanas apagadas");

    estado.arcade.records.torre = 10;
    valle = mapa.datosParaDibujar(estado, 0, campanas);
    igual([valle.torre.pisos, ventanas(dibujarMapa(valle))], [10, 2], "10 pisos: 2 de 6 ventanas");
    estado.arcade.records.torre = 37;
    igual(mapa.datosParaDibujar(estado, 0, campanas).torre.pisos, 30, "más de 30 pisos cuenta como la Corona");

    const ciudadela = dibujarMapa(mapa.datosParaDibujar(estado, mapa.CIUDADELA, campanas));
    cierto(ciudadela.includes('<g class="brasero">') && !ciudadela.includes("torre-valle"), "en la Ciudadela, el brasero (la Torre no)");
    cierto(!dibujarMapa(mapa.datosParaDibujar(estado, 2, campanas)).includes("torre-valle"), "en las demás regiones, solo a lo lejos");
    cierto(dibujarMapa(mapa.datosParaDibujar(estado, mapa.REGIONES.length, campanas)).includes("torre-valle"), "el Valle II también la tiene");

    // En el valle, la nota del mapa lleva al Arcade; en la Ciudadela se habla del brasero.
    const ctx = { regionMapa: 0 };
    cierto(vistas.pantallaMapa(estado, ctx).includes('data-pantalla="arcade"'), "desde el mapa del valle se sube la Torre");
});

prueba("La Torre en el valle (v37): ninguna historia la pone en la Ciudadela", async () => {
    const leer = async (ruta) => (await fetch(ruta, { cache: "no-store" })).text();
    const [cronicaJs, pergaminoJs, leyendasJs] = await Promise.all([leer("../js/cronica.js"), leer("../js/pergamino.js"), leer("../js/leyendas.js")]);
    cierto(cronicaJs.includes("vive en el Valle del Comienzo, al pie de la Torre"), "Aurelio vive al pie de la Torre, en el valle");
    cierto(!cronicaJs.includes("en la Ciudadela del Carácter, se alza la Torre"), "la Crónica ya no la pone al final");
    cierto(!pergaminoJs.includes("Dicen en la Ciudadela") && !leyendasJs.includes("En la Ciudadela dicen"), "lo de la primera piedra se dice en el valle");
    cierto(!memorias.MEMORIAS[0].parrafos.join(" ").includes("Ciudadela"), "Aurelio vio a Casio en el valle");
    cierto(saga.ACTOS.find((a) => a.id === "llama").objetivo.includes("de vuelta a la Torre"), "el final: volver a la Torre con el fuego");
});


// ===== Armadura de pecho y equipo nuevo (v34) =====

prueba("Equipo (v34): el espacio del pecho y objetos nuevos en todos los espacios", () => {
    igual(Object.keys(avatar.ESPACIOS), ["cabeza", "pecho", "mano", "espalda", "fondo"]);
    const por = (espacio) => Object.keys(avatar.OBJETOS).filter((id) => avatar.OBJETOS[id].espacio === espacio);
    igual(por("pecho"), ["peto-cuero", "cota-malla", "tunica-arcana", "coraza", "coraza-vigia"]);
    for (const id of ["diadema", "yelmo-astado", "daga", "martillo", "escudo", "capa-cuervo", "mar", "aurora"]) cierto(avatar.OBJETOS[id], `existe ${id}`);
    // Las pinturas nuevas tienen su crédito.
    for (const id of ["mar", "aurora"]) cierto(PINTURAS_DE_FONDO[id]?.artista, `crédito de ${id}`);

    const estado = partidaNueva();
    igual(estado.avatar.equipado.pecho, null, "una partida nueva tiene el pecho vacío");
    equipar(estado, "coraza", "casco");
    igual(equipo.armaduraMaxima(estado), 15 + 16 + 12, "la ropa + la coraza + el casco");
    igual(avatar.describirAvatar(estado, hoy(), juego.resumen(estado, hoy())).equipado.pecho, "coraza");
    cierto(equipo.habilidadesDelEquipo(estado).includes("muralla"), "la coraza da «Muralla»");
    // Una copia de antes de la v34 no tenía pecho: se agrega vacío.
    delete estado.avatar.equipado.pecho;
    igual(datos.desdeRespaldo(datos.textoRespaldo(estado)).avatar.equipado.pecho, null);

    // La Coraza del Vigía se gana al llegar a la cima (20 pisos de la Torre).
    const vigia = avatar.OBJETOS["coraza-vigia"];
    estado.arcade.records.torre = 19;
    cierto(!avatar.objetosDeLogroGanados(estado, juego.resumen(estado, hoy())).includes("coraza-vigia"), "con 19 pisos, no");
    estado.arcade.records.torre = 20;
    cierto(avatar.objetosDeLogroGanados(estado, juego.resumen(estado, hoy())).includes("coraza-vigia"), "con 20, sí");
    igual([vigia.rareza, vigia.habilidad], ["legendario", "llama"]);

    // Se dibuja encima del torso, en las cuatro etapas y con los dos cuerpos.
    for (const etapa of avatar.ETAPAS) {
        for (const cuerpo of ["masculino", "femenino"]) {
            for (const id of por("pecho")) {
                const svg = dibujarAvatar(avatarDePrueba({ etapa, apariencia: { ...avatar.APARIENCIA_INICIAL, cuerpo },
                                                           equipado: { cabeza: null, pecho: id, mano: null, espalda: null, fondo: null } }));
                dibujoSano(svg, `${id} en ${etapa.clave} (${cuerpo})`);
            }
        }
    }
});

prueba("Habilidades (v34): Muralla, Rugido, Aturdir, Presagio, Aurora y Llama del Vigía", () => {
    // Muralla: al defenderte bloqueas 15 % más.
    const sin = torre.heroeDeLaTorre(NIVELES_1);
    const con = torre.heroeDeLaTorre(NIVELES_1, { habilidades: ["muralla"] });
    igual(Math.round((con.defensa - sin.defensa) * 100), 15);

    // Rugido: la criatura de cada piso empieza con 15 % menos de vida.
    const rugida = torre.nuevaPartida(NIVELES_1, 3, 1, { habilidades: ["rugido"] });
    igual(rugida.enemigo.vida, Math.round(rugida.enemigo.vidaMax * 0.85), "desde el piso 1");
    rugida.enemigo.vida = 1;
    torre.actuar(rugida, "atacar");
    torre.elegirMejora(rugida, rugida.opciones[0]);
    igual(rugida.enemigo.vida, Math.round(rugida.enemigo.vidaMax * 0.85), "y en el piso siguiente");

    // Aturdir: el primer crítico de cada piso deja a la criatura sin su turno (solo una vez por piso).
    const a = torreCon(["aturdir"], 3);
    a.heroe.critico = 1;
    a.enemigo.vida = a.enemigo.vidaMax = 999;
    a.enemigo.intencion = "fuerte";
    const vidaAntes = a.heroe.vida;
    let eventos = torre.actuar(a, "atacar");
    cierto(eventos.some((e) => e.tipo === "aturdida") && a.heroe.vida >= vidaAntes, "pierde su turno y no te pega");
    igual(a.enemigo.intencion, "fuerte", "guarda lo que planeaba");
    eventos = torre.actuar(a, "atacar");
    igual(eventos.some((e) => e.tipo === "aturdida"), false, "el segundo crítico del piso ya no aturde");

    // Presagio: los golpes fuertes te hacen 35 % menos (y la intención ya lo descuenta).
    const golpeFuerte = (habilidades) => {
        const p = torreCon(habilidades, 4);
        p.enemigo.intencion = "fuerte";
        p.enemigo.vida = 999;
        return torre.actuar(p, "pocion").find((e) => e.quien === "enemigo").dano;
    };
    const [normal, presagio] = [golpeFuerte([]), golpeFuerte(["presagio"])];
    igual(presagio, Math.round(normal * 0.65));
    const vista = torreCon(["presagio"], 4);
    vista.enemigo.intencion = "fuerte";
    cierto(torre.textoIntencion(vista.enemigo, vista.heroe).texto.includes(`(${presagio})`), "la intención muestra el golpe ya rebajado");

    // Aurora: el primer hechizo de cada piso no gasta PM.
    const au = torreCon(["aurora"]);
    au.enemigo.vida = 999;
    const pm = au.heroe.mana;
    torre.actuar(au, "hechizo", "fuego");
    igual(au.heroe.mana, pm, "gratis");
    torre.actuar(au, "hechizo", "fuego");
    igual(au.heroe.mana, pm - 1, "el segundo, no");

    // Llama del Vigía: fuego 50 % más fuerte y el veneno no te hace nada.
    const fuego = (habilidades) => {
        const p = torreCon(habilidades, 2, null, 77);
        p.heroe.critico = 0;
        p.enemigo.vida = 999;
        return torre.actuar(p, "hechizo", "fuego")[0].dano;
    };
    cierto(Math.abs(fuego(["llama"]) - fuego([]) * 1.5) <= 1, "el fuego hace 50 % más");
    const m = torre.nuevaPartida(NIVELES_1, 5, 1, { habilidades: ["llama"] }, "mazmorra");
    m.piso = 3;
    m.enemigo = torre.monstruoDelPiso(3, "mazmorra");   // la Aguaviva pálida: veneno
    m.enemigo.intencion = "especial";
    m.heroe.vida = m.heroe.vidaMax = 500;
    torre.actuar(m, "defender");
    cierto(!m.heroe.veneno && m.registro.includes("Llama del Vigía"), m.registro);
});


// ===== Monedas y gemas (v31) =====

prueba("Monedas y gemas: el arcade paga en gemas (y la mitad de XP); las monedas solo salen de la vida real", () => {
    igual(arcade.premio("carrera", 100000), { gemas: arcade.MAX_GEMAS, xp: arcade.MAX_XP });
    igual([arcade.MAX_GEMAS, arcade.MAX_XP], [15, 10], "minijuegos: máx. 15 💎 y 10 XP (antes 20)");
    igual([torre.PREMIO.maxXp, torre.REGLAS.mazmorra.premio.maxXp], [45, 60], "la Torre (con 30 pisos desde la v38) y la Mazmorra");
    igual(torre.premio(3), { gemas: 9, xp: 7 }, "3 pisos: 9 💎 y 7 XP (2,5 por piso, hacia abajo)");

    const estado = partidaNueva();
    const leer = crearMision(estado);
    acciones.completarMision(estado, leer.id);
    const [monedas, gemas] = [estado.personaje.monedas, estado.personaje.gemas];
    cierto(monedas > 0 && gemas === 0, "una misión da monedas, no gemas");
    const r = acciones.terminarPartida(estado, "golpe", 300);
    igual([estado.personaje.monedas, estado.personaje.gemas], [monedas, r.premio.gemas], "un minijuego da gemas, no monedas");
    // Los premios extra también son gemas.
    cierto([desafios.COFRE, rituales.RELAMPAGO.premio, campana.premioJefe(1), mapa.LUGARES.fortaleza.premio]
        .every((p) => p.gemas > 0 && !("monedas" in p)), "desafío, relámpago, jefes y mapa: en gemas");
    cierto(!cofre.PREMIOS_COFRE.some((p) => p.tipo === "monedas"), "el cofre del día ya no da monedas");
});

// ===== Reto del día del arcade (v40) =====

prueba("Reto del día: la meta sale de tu récord, nunca baja de la base y la Torre tiene tope", () => {
    const estado = partidaNueva();
    igual(retos.metaDelReto(estado, "carrera", hoy()), retos.RETOS.carrera.base, "sin récord: la base");
    estado.arcade.records.carrera = 500;
    cierto([350, 400, 450].includes(retos.metaDelReto(estado, "carrera", hoy())), "70, 80 o 90 % del récord, de 10 en 10");
    estado.arcade.records.carrera = 20;
    igual(retos.metaDelReto(estado, "carrera", hoy()), 100, "un récord chico no baja de la base");
    estado.arcade.records.torre = 100;
    igual(retos.metaDelReto(estado, "torre", hoy()), 30, "la Torre tiene 30 pisos");
});

prueba("Reto del día: cada día uno distinto, sin repetir el de ayer; la Mazmorra solo si ya está abierta", () => {
    const estado = partidaNueva();
    estado.arcade.retos = {};
    let anterior = null;
    const vistos = new Set();
    for (let n = -40; n <= 0; n++) {
        const reto = retos.asegurarReto(estado, dia(n));
        cierto(reto.tipo !== anterior, `el día ${n} repite el de ayer (${reto.tipo})`);
        cierto(reto.tipo !== "mazmorra", "la Mazmorra está cerrada");
        vistos.add(reto.tipo);
        anterior = reto.tipo;
    }
    cierto(vistos.size >= 4, `en 41 días salen varios retos distintos (salieron ${[...vistos]})`);
    igual(retos.asegurarReto(estado, dia(0)), estado.arcade.retos[dia(0)], "pedirlo otra vez no lo cambia");
    cierto(!(dia(-40) in estado.arcade.retos), "los de hace más de 30 días se borran");

    estado.arcade.records.torre = 25;   // abre la Mazmorra
    const abiertos = new Set();
    for (let n = 1; n <= 60; n++) abiertos.add(retos.asegurarReto(estado, dia(n)).tipo);
    cierto(abiertos.has("mazmorra"), "con la Mazmorra abierta también puede tocar");
});

prueba("Reto del día: se cumple una sola vez, paga gemas y XP extra y no mueve la meta", () => {
    const estado = partidaNueva();
    estado.arcade.retos[hoy()] = { tipo: "carrera", meta: 100, mejor: 0, cobradoEn: null };
    const gemasAntes = estado.personaje.gemas;

    let r = acciones.terminarPartida(estado, "carrera", 60);
    igual([r.reto, estado.arcade.retos[hoy()].mejor], [null, 60], "60 de 100: todavía no");
    r = acciones.terminarPartida(estado, "lluvia", 500);
    igual(estado.arcade.retos[hoy()].mejor, 60, "otro juego no cuenta");
    r = acciones.terminarPartida(estado, "carrera", 120);
    igual([r.reto.gemas, r.reto.xp], [retos.PREMIO_RETO.gemas, retos.PREMIO_RETO.xp]);
    igual(estado.arcade.retos[hoy()].cobradoEn, hoy());
    const delasPartidas = arcade.premio("carrera", 60).gemas + arcade.premio("lluvia", 500).gemas + arcade.premio("carrera", 120).gemas;
    igual(estado.personaje.gemas, gemasAntes + delasPartidas + retos.PREMIO_RETO.gemas, "gemas: las 3 partidas + el reto");
    r = acciones.terminarPartida(estado, "carrera", 300);
    igual(r.reto, null, "no se cobra dos veces");
    igual(estado.arcade.retos[hoy()].meta, 100, "la meta no se mueve aunque superes tu récord");
});

prueba("Reto del día: la Torre cuenta pisos superados y «partidas» cuenta cualquier juego", () => {
    const estado = partidaNueva();
    estado.arcade.retos[hoy()] = { tipo: "torre", meta: 3, mejor: 0, cobradoEn: null };
    acciones.empezarTorre(estado, 1);
    estado.arcade.torre.piso = 3;                       // 2 pisos superados
    igual(acciones.terminarTorre(estado).reto, null, "2 de 3");
    acciones.empezarTorre(estado, 1);
    estado.arcade.torre.piso = 4;                       // 3 pisos superados
    const r = acciones.terminarTorre(estado);
    igual([r.reto.tipo, r.reto.atributo], ["torre", "carisma"]);

    estado.arcade.retos[dia(0)] = { tipo: "partidas", meta: 2, mejor: 0, cobradoEn: null };
    igual(acciones.terminarPartida(estado, "golpe", 10).reto, null);
    igual(acciones.terminarPartida(estado, "lluvia", 5).reto.tipo, "partidas");
});

prueba("Reto del día: empezar una partida crea el reto de hoy (por si la app llevaba abierta desde ayer)", () => {
    const estado = partidaNueva();
    estado.arcade.retos = {};
    acciones.empezarPartida(estado, "carrera");
    cierto(estado.arcade.retos[hoy()], "se creó el reto de hoy");
});

prueba("Bazar: las provisiones se pagan con gemas, una de cada una, y se usan al empezar la próxima partida", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.comprarProvision(estado, "afilar"), "Te faltan");
    debeFallar(() => acciones.comprarProvision(estado, "inventada"), "no se vende");
    acciones.ganar(estado, { gemas: 200 });
    for (const clave of ["afilar", "pocion", "antidoto", "amuleto"]) acciones.comprarProvision(estado, clave);
    debeFallar(() => acciones.comprarProvision(estado, "pocion"), "Ya llevas");
    const p = torre.PROVISIONES;
    igual(estado.personaje.gemas, 200 - p.afilar.precio - p.pocion.precio - p.antidoto.precio - p.amuleto.precio);
    igual(estado.arcade.bazar, ["afilar", "pocion", "antidoto", "amuleto"]);

    const normal = torre.heroeDeLaTorre(NIVELES_1);   // un héroe nuevo, sin provisiones
    acciones.empezarTorre(estado, 4, "torre");
    const h = estado.arcade.torre.heroe;
    igual([h.ataque, h.pociones, h.vidaMax, h.inmuneVeneno], [normal.ataque + 4, normal.pociones + 1, normal.vidaMax + Math.round(normal.vidaMax * 0.15), true]);
    igual(estado.arcade.bazar, [], "se gastaron al empezar");
    cierto(estado.arcade.torre.registro.includes("Llevas: ⚔️ Piedra de afilar"), estado.arcade.torre.registro);

    // La raíz amarga para el veneno de la Mazmorra.
    const m = torre.nuevaPartida(NIVELES_1, 5, 1, {}, "mazmorra");
    torre.usarProvisiones(m, ["antidoto"]);
    m.piso = 3;
    m.enemigo = torre.monstruoDelPiso(3, "mazmorra");   // la Aguaviva pálida: veneno
    m.enemigo.intencion = "especial";
    m.heroe.vida = m.heroe.vidaMax = 500;
    const eventos = torre.actuar(m, "defender");
    cierto(!m.heroe.veneno && !eventos.some((e) => e.quien === "veneno") && m.registro.includes("raíz amarga"), m.registro);
});

prueba("Monedas y gemas: las copias viejas empiezan sin gemas, y el arcade y la tienda las muestran", () => {
    const estado = partidaNueva();
    estado.personaje.monedas = 300;
    delete estado.personaje.gemas;
    delete estado.arcade.bazar;
    const copia = datos.desdeRespaldo(datos.textoRespaldo(estado));
    igual([copia.personaje.monedas, copia.personaje.gemas, copia.arcade.bazar], [300, 0, []], "las monedas se quedan igual");

    copia.personaje.gemas = 120;
    copia.arcade.bazar = ["pocion"];
    const ctx = { vida: vida.calcularVida(copia, hoy()), avatar: avatarDePrueba(), evento: null, subvista: { tienda: "mascotas" } };
    let html = vistas.pantallaArcade(copia, ctx);
    cierto(!/undefined|NaN/.test(html) && html.includes("💎 Bazar") && html.includes("💎 120") && html.includes("✓ La llevas") &&
           html.includes('data-accion="comprar-provision" data-clave="afilar"'), "el bazar en el Arcade");
    cierto(!html.includes("🪙 y"), "el arcade ya no promete monedas");
    html = vistas.pantallaTienda(copia, ctx);
    cierto(!/undefined|NaN/.test(html) && html.includes("💎 180") && html.includes("💎 120 gemas"), "las mascotas cuestan gemas");
    html = vistas.pantallaTienda(copia, { ...ctx, subvista: { tienda: "equipo" } });
    cierto(!/undefined|NaN/.test(html) && html.includes(`💎 ${avatar.OBJETOS.gorra.precio}`) &&
           !html.split("Equipamiento")[1].split("Los objetos legendarios")[0].includes("🪙"),
           "el equipo también (la poción de vida sigue en monedas)");

    // Comprar equipo: con gemas, no con monedas.
    copia.personaje.monedas = 5000;
    copia.personaje.gemas = 0;
    debeFallar(() => acciones.comprarObjeto(copia, "gorra"), "gemas");
    copia.personaje.gemas = 100;
    acciones.comprarObjeto(copia, "gorra");
    igual([copia.personaje.gemas, copia.personaje.monedas], [100 - avatar.OBJETOS.gorra.precio, 5000]);
});


// ===== El Maestro Aurelio en todo el juego (v30) =====

prueba("Memorias de Aurelio: 8 capítulos que se abren en orden, según cómo avanzas", () => {
    igual(memorias.MEMORIAS.length, 8);
    igual(new Set(memorias.MEMORIAS.map((m) => m.id)).size, 8, "ids distintos");
    for (const m of memorias.MEMORIAS) cierto(m.titulo && m.parrafos.length === 2 && m.leccion, `${m.id} tiene título, dos párrafos y su lección`);
    const nada = { siempre: 0, racha: 0, jefes: 0, nivel: 1, torre: 0, mazmorra: 0 };
    igual(memorias.cuantasAbiertas(nada), 1, "la primera, desde el primer día");
    igual(memorias.cuantasAbiertas({ ...nada, racha: 7 }), 2);
    igual(memorias.cuantasAbiertas({ ...nada, racha: 9, jefes: 1, nivel: 10 }), 4);
    igual(memorias.cuantasAbiertas({ ...nada, mazmorra: 20, torre: 20 }), 1, "en orden: sin la racha no se abre lo demás");
    igual(memorias.cuantasAbiertas({ siempre: 0, racha: 30, jefes: 9, nivel: 25, torre: 22, mazmorra: 20 }), 8, "todas");

    const datos = { ...nada, racha: 12, nivel: 6 };
    const capitulos = memorias.capitulosDeMemorias(datos, 1, { heroe: "Ana", dragon: "Chispa" });
    igual(capitulos.map((c) => c.abierto), [true, true, false, false, false, false, false, false]);
    igual(capitulos.map((c) => c.nueva), [false, true, false, false, false, false, false, false], "la segunda todavía no la leíste");
    igual(capitulos[2].pista, "Aurelio te lo contará cuando venzas a tu primer jefe.");
    igual([capitulos[3].pista, capitulos[3].parrafos, capitulos[3].leccion], [null, [], null], "lo que no se abrió no se ve");
    cierto(memorias.pista(memorias.MEMORIAS[3], datos).includes("vas en el 6"), "dice cuánto te falta");
    const todo = memorias.capitulosDeMemorias({ siempre: 0, racha: 30, jefes: 9, nivel: 25, torre: 22, mazmorra: 20 }, 8, { heroe: "Ana", dragon: "Chispa" });
    const texto = JSON.stringify(todo);
    cierto(!texto.includes("{n}") && !texto.includes("{m}") && texto.includes("Ana") && texto.includes("De él nació Chispa"), "los nombres en su lugar");
});

prueba("Memorias en la partida: Aurelio avisa en Hoy, se celebran al abrirse y quedan leídas al abrirlas", () => {
    const estado = partidaNueva();
    const a = (hora) => { const f = new Date(); f.setHours(hora, 0, 0, 0); return f.getTime(); };
    let c = maestro.contexto(estado, hoy(), a(14));
    igual([c.memorias.abiertas, c.memorias.leidas, c.memorias.sinLeer, c.memorias.total], [1, 0, 1, 8]);
    cierto(maestro.saludo(c).includes("Nunca te conté quién fui"), maestro.saludo(c));
    cierto(maestro.saludo(maestro.contexto(estado, hoy(), a(21))).includes("Cae la noche"), "de noche, primero cerrar el día");
    cierto(vistas.dialogoMaestro({ maestro: c }, { modo: "inicio" }).includes('data-accion="memorias-abrir"'), "en la conversación, «Escuchar su historia»");
    cierto(maestro.responder(estado, c, "historia").includes("lee mis memorias"), "«Háblame de ti»");

    acciones.leerMemorias(estado);
    c = maestro.contexto(estado, hoy(), a(14));
    igual([c.memorias.leidas, c.memorias.sinLeer], [1, 0], "leídas");
    cierto(!maestro.saludo(c).includes("pasado") && maestro.responder(estado, c, "historia").includes("Ya te conté 1 de 8"), "y ya no insiste");

    // Al abrirse un capítulo, se celebra con su lección.
    const antes = acciones.foto(estado);
    antes.memorias = 0;
    const celebracion = acciones.revisarCambios(estado, antes).find((x) => x.etiqueta === "Aurelio quiere contarte algo");
    igual([celebracion.titulo, celebracion.maestro], [memorias.MEMORIAS[0].titulo, memorias.MEMORIAS[0].leccion]);
    // Al subir de nivel, también dice algo.
    const previo = acciones.foto(estado);
    estado.personaje.xp += 100;
    const nivel = acciones.revisarCambios(estado, previo).find((x) => x.tipo === "nivel");
    igual(nivel.maestro, maestro.palabrasDeNivel(2));
    // Las copias de antes de la v30 empiezan sin memorias leídas.
    delete estado.maestro;
    igual(datos.desdeRespaldo(datos.textoRespaldo(estado)).maestro, { leidas: 0 });
});

prueba("Aurelio en la Torre y la Mazmorra: una pista antes de cada guardián y unas palabras si caes", () => {
    const guardianes = [...bestiario.ORDEN, ...bestiario.ORDEN_MAZMORRA].filter((id) => bestiario.CRIATURAS[id].guardian);
    igual(guardianes.length, 10);
    for (const id of guardianes) cierto(maestro.CONSEJOS_DE_GUARDIAN[id], `tiene un consejo para ${id}`);
    igual(Object.keys(maestro.CONSEJOS_DE_GUARDIAN).sort(), [...guardianes].sort(), "y ninguno de más");

    const estado = partidaNueva();
    acciones.empezarTorre(estado, 6);
    const p = estado.arcade.torre;
    const imagenes = { heroe: "data:,", enemigo: "data:,", sala: "data:,", maestro: "data:image/png;base64,MM" };
    const t = (cambios = {}) => ({ partida: estado.arcade.torre, nombre: "Prueba", sprites: imagenes, eventos: [], menu: "principal",
                                   ultimo: "atacar", bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    igual(vistas.pantallaTorre(t()).includes("ff-maestro"), false, "contra una criatura normal no dice nada");
    p.piso = 5;
    p.enemigo = torre.monstruoDelPiso(5);
    let html = vistas.pantallaTorre(t());
    cierto(html.includes("ff-maestro") && html.includes("el metal llama al rayo") && html.includes("data:image/png;base64,MM"), "antes del Caballero");
    p.heroe.vida = 1;
    p.enemigo.intencion = "golpe";
    const { eventos } = acciones.accionTorre(estado, "defender");
    html = vistas.pantallaTorre(t({ eventos }));
    igual(p.fase, "fin");
    cierto(html.includes(maestro.consueloAlCaer(4)), "al caer, unas palabras");
});

prueba("Aurelio responde a tu diario, te despide en la noche y sus memorias se leen sin huecos", () => {
    for (const animo of Object.keys(juego.ANIMOS_DIARIO)) cierto(maestro.respuestaAlDiario(animo, hoy()), `responde a «${animo}»`);
    igual(maestro.respuestaAlDiario("mal", "2026-10-13"), maestro.respuestaAlDiario("mal", "2026-10-13"), "el mismo día, la misma frase");
    igual(maestro.respuestaAlDiario("inventado", hoy()), null);
    cierto(maestro.palabrasDeLaNoche({ hechas: 3, falladas: 0, pendientes: 0 }).includes("Día completo"), "día completo");
    cierto(maestro.palabrasDeLaNoche({ hechas: 2, falladas: 1, pendientes: 0 }).includes("Fallaste"), "con una fallada");
    cierto(maestro.palabrasDeLaNoche({ hechas: 0, falladas: 0, pendientes: 2 }).includes("no fue tu día"), "sin nada");

    const estado = partidaNueva();
    estado.personaje.nombre = "Ana <b>";
    const info = juego.resumen(estado, hoy());
    const ctx = { hoy: hoy(), info, maestro: maestro.contexto(estado, hoy(), Date.now(), info), memoriasDesde: 0 };
    let html = vistas.pantallaMemorias(estado, ctx);
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    cierto(html.includes("Memorias de Aurelio") && html.includes("El que dejaba todo para mañana") && html.includes("Nuevo"), "el primer capítulo, nuevo");
    cierto(html.includes("???") && html.includes("🔒 Aurelio te lo contará cuando logres una racha de 7 días"), "el siguiente, con lo que falta");
    estado.diario[hoy()] = { animo: "bien", texto: "" };
    const ctxHoy = (subvista) => ({
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: ctx.maestro, evento: null, subvista, diarioVista: {},
    });
    cierto(vistas.pantallaHoy(estado, ctxHoy({ hoy: "aurelio" })).includes('data-accion="memorias-abrir"'), "en Hoy › Aurelio: «Escuchar»");
    cierto(vistas.pantallaHoy(estado, ctxHoy({ hoy: "diario" })).includes(maestro.respuestaAlDiario("bien", hoy())), "en Hoy › Diario: su respuesta");
});


// ===== «Fallé» y tu libro (v20) =====

prueba("Fallé: dices por qué, pierdes la vida al instante, ya no se recuerda y se borra si al final la haces", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);                                          // normal: 8 × 1,31 = −11
    const gym = crearMision(estado, { nombre: "Gym", frecuencia: "semana", veces: 2 });
    debeFallar(() => acciones.fallarMision(estado, gym.id, hoy(), "tiempo"), "toda la semana");
    debeFallar(() => acciones.fallarMision(estado, leer.id, hoy(), "inventado"), "Elige qué pasó");
    igual(acciones.fallarMision(estado, leer.id, hoy(), "ganas").dano, 11);
    igual(vida.calcularVida(estado, hoy()).puntos, 105 - 11, "se pierde ahora, no esta noche");
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
    igual(vida.calcularVida(estado, hoy()).puntos, 94);
    acciones.quitarFalla(estado, leer.id, dia(-1));
    igual(vida.calcularVida(estado, hoy()).puntos, 94);
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
    acciones.crearPrincipal(estado, { nombre: "Curso", atributo: "intelecto", submisiones: "Uno\nDos\nTres\nCuatro\nCinco" });
    const principal = estado.principales[0];
    for (const paso of principal.submisiones.slice(0, 4)) {      // 4 pasos × 40 = 160: cae el primer jefe
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
    vidaDesde(estado, 2);                                   // 2 días sin hacerla: 105 − 11 − 11 = 83
    const antes = vida.calcularVida(estado, hoy()).puntos;
    acciones.escribirDiario(estado, { fecha: dia(-1), animo: "mal", texto: "", gratitud: "" });
    igual([antes, vida.calcularVida(estado, hoy()).puntos], [83, 83 + vida.VIDA.diario]);
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

prueba("Objetos (v23): los legendarios nuevos se ganan con el nivel 25 y con 12 pisos de la Torre", () => {
    const estado = partidaNueva();
    const alas = avatar.OBJETOS["alas-dragon"];
    const baculo = avatar.OBJETOS["baculo-arcano"];
    igual(avatar.progresoObjeto(alas, estado, juego.resumen(estado, hoy())), 1, "nivel al empezar");
    igual(avatar.progresoObjeto(baculo, estado, juego.resumen(estado, hoy())), 0, "pisos al empezar");
    igual(juego.calcularNivel(30000).nivel, 25, "XP para el nivel 25");
    estado.personaje.xp = 30000;
    estado.arcade.records.torre = 12;
    const ganados = avatar.objetosDeLogroGanados(estado, juego.resumen(estado, hoy()));
    cierto(ganados.includes("alas-dragon"), "las Alas del Dragón al nivel 25");
    cierto(ganados.includes("baculo-arcano"), "el Báculo arcano con 12 pisos");
    cierto(!ganados.includes("lanza-dragon"), "la Lanza del Dragón pide 8 jefes");
    // La Corona del Dragón es legendaria pero se compra.
    igual(avatar.OBJETOS["corona-dragon"].precio, 1500);
});

prueba("Música (v23): la pista y el volumen se guardan y se revisan", () => {
    const estado = partidaNueva();
    igual([estado.ajustes.musica, estado.ajustes.pista, estado.ajustes.volumen], [true, "epica", 0.6]);
    acciones.cambiarAjuste(estado, "musica", false);
    acciones.elegirMusica(estado, "batalla");
    igual([estado.ajustes.musica, estado.ajustes.pista], [true, "batalla"], "elegir una pista la enciende");
    debeFallar(() => acciones.elegirMusica(estado, "reguetón"), "no existe");
    acciones.cambiarVolumen(estado, 1.7);
    igual(estado.ajustes.volumen, 1, "el volumen no pasa de 1");
    acciones.cambiarVolumen(estado, 0.333);
    igual(estado.ajustes.volumen, 0.33);
    debeFallar(() => acciones.cambiarVolumen(estado, "mucho"), "no es válido");
});

prueba("Música (v23, v58): las 7 pistas existen y son de dominio público o CC0", async () => {
    igual(Object.keys(PISTAS), ["epica", "batalla", "misterio", "lectura", "alba", "nocturno", "abismo"]);
    for (const [clave, pista] of Object.entries(PISTAS)) {
        cierto(["Dominio público", "CC0"].includes(pista.licencia), `licencia de ${clave}`);
        cierto(pista.fuente.startsWith("https://commons.wikimedia.org/wiki/File:"), `fuente de ${clave}`);
        const respuesta = await fetch(`../${pista.archivo.replace("./", "")}`, { method: "HEAD" });
        cierto(respuesta.ok, `el archivo ${pista.archivo} existe`);
    }
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
    igual(estado.ajustes, { sonido: true, golpe: true, eventos: true, musica: true, pista: "epica", volumen: 0.6, cinematicas: true, esencial: false, esencialAlAbrir: true,
                          animo: "bien", preguntarAnimo: true, musicaAuto: true });
    igual([estado.claves, estado.cofres, estado.noches, estado.mapa, estado.arcade.extra], [{}, {}, [], { reclamados: [], cines: [] }, 0], "lo de la v22");
    igual(estado.apariencia, avatar.APARIENCIA_INICIAL, "la apariencia inicial completa");
    igual(estado.campana, { recompensados: {}, libres: {} });
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

prueba("Dibujo (v23): el aire del fondo (partículas y rayos) solo va en el dibujo completo", () => {
    const d = avatarDePrueba();
    cierto(dibujarAvatar(d).includes('class="particula'), "partículas en el dibujo completo");
    cierto(!dibujarAvatar(d, { mini: true }).includes("particula"), "sin partículas en el retrato pequeño");
    cierto(!dibujarAvatar(d, { batalla: true }).includes("particula"), "sin partículas en batalla");
    for (const [id, objeto] of Object.entries(avatar.OBJETOS).filter(([, o]) => o.espacio === "fondo")) {
        const svg = dibujarAvatar(avatarDePrueba({ equipado: { cabeza: null, mano: null, espalda: null, fondo: id } }));
        dibujoSano(svg, `fondo ${id}`);
        igual(svg.includes("rayos-luz"), !["galaxia", "aurora"].includes(id), `rayos de luz en ${objeto.nombre} (no de noche)`);
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



// ===== Modo esencial (v46) =====

prueba("Modo esencial: Hoy muestra solo tus misiones en tres grupos, la Tienda solo los premios, y Aventuras sigue teniendo lo suyo", () => {
    const estado = partidaDemo();
    const info = juego.resumen(estado, hoy());
    const ctx = () => ({
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista: {}, campanaVista: null, diarioVista: {},
    });
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);
    igual(datos.estadoInicial().ajustes.esencial, false, "viene apagado");
    igual(datos.estadoInicial().ajustes.esencialAlAbrir, true, "pero al abrir la app arranca en él (v47)");
    debeFallar(() => acciones.cambiarAjuste(partidaNueva(), "inventado", true), "no existe");

    // Completo (v52): Hoy en pestañas y la primera es Aurelio, con tu héroe, tus rivales y «Tu día».
    const completo = vistas.pantallaHoy(estado, ctx());
    sano(completo, "Hoy completo");
    cierto(completo.indexOf('data-vista="aurelio"') > completo.indexOf('data-vista="diario"'), "la pestaña Aurelio va la última (v54)");
    cierto(completo.includes("⚔️ Misiones diarias") && !completo.includes('aria-label="Tu día"'), "Hoy abre en las misiones");
    const aurelio = vistas.pantallaHoy(estado, { ...ctx(), subvista: { hoy: "aurelio" } });
    cierto(aurelio.includes('aria-label="Tu día"') && aurelio.includes('aria-label="Tus rivales"') && aurelio.includes("heroe-hoy"), "Aurelio: héroe, rivales y «Tu día»");
    cierto(completo.includes('data-accion="alternar-esencial"'), "con el botón de ánimo");
    for (const vista of ["misiones", "metas", "tareas", "importantes", "diario"]) {
        const html = vistas.pantallaHoy(estado, { ...ctx(), subvista: { hoy: vista } });
        sano(html, `Hoy › ${vista}`);
        cierto(!html.includes('aria-label="Tu día"'), `Hoy › ${vista}: solo su sección`);
    }
    const misiones = vistas.pantallaHoy(estado, { ...ctx(), subvista: { hoy: "misiones" } });
    cierto(misiones.includes("subtitulo-atributo") && misiones.includes('data-accion="agrupar-hoy"'), "por atributo, con el botón para cambiar");
    cierto(!misiones.includes('data-pantalla="hoy-agrupar"'), "el botón de agrupar ya no intenta abrir otra pantalla");
    const porMomento = vistas.pantallaHoy(estado, { ...ctx(), subvista: { hoy: "misiones" }, agruparHoy: "momento" });
    cierto(!porMomento.includes("subtitulo-atributo"), "por momento: sin los títulos de atributo");

    // Esencial: sin la pestaña Aurelio (ni héroe, «Tu día», semana o diario); abre en las misiones.
    acciones.elegirAnimo(estado, "mal");
    const html = vistas.pantallaHoy(estado, ctx());
    sano(html, "Hoy esencial");
    cierto(html.includes("⚔️ Misiones diarias") && html.includes("+ Nueva misión"), "abre en las misiones diarias");
    for (const vista of ["misiones", "metas", "tareas", "importantes"]) cierto(html.includes(`data-vista="${vista}"`), `pestaña ${vista}`);
    cierto(!html.includes('data-vista="aurelio"') && !html.includes('data-vista="diario"'), "sin las pestañas Aurelio ni Diario");
    cierto(!html.includes('aria-label="Tu día"') && !html.includes("Rivales") && !html.includes('class="panel semana"'), "sin héroe, «Tu día» ni semana");
    cierto(vistas.pantallaHoy(estado, { ...ctx(), subvista: { hoy: "aurelio" } }).includes("⚔️ Misiones diarias"), "si pides Aurelio en el esencial, ves las misiones");
    const importantes = vistas.pantallaHoy(estado, { ...ctx(), subvista: { hoy: "importantes" } });
    cierto(importantes.includes("🎯 Misiones importantes") && importantes.includes('data-dialogo="principal"') && !importantes.includes("contra los jefes"), "las importantes, sin hablar de jefes");
    cierto(!vistas.pantallaHoy(estado, { ...ctx(), fechaVista: sumarDias(hoy(), -1) }).includes("hoy-tabs"), "viendo ayer, sin pestañas");

    // El enfoque (temporizador) solo aparece si tienes una sesión en marcha.
    cierto(!html.includes('data-pantalla="enfoque"'), "sin sesión, sin botón de enfoque");
    igual([estado.ajustes.esencial, estado.ajustes.animo], [true, "mal"], "«mal» enciende el modo esencial");
    acciones.empezarEnfoque(estado, { minutos: 25, atributo: "intelecto" });
    cierto(vistas.pantallaHoy(estado, ctx()).includes('data-pantalla="enfoque"'), "con una sesión activa, sí");
    acciones.cancelarEnfoque(estado);

    // La Tienda: solo los premios reales y las monedas (sin gemas, poción, equipo ni mascotas).
    const tiendaEsencial = vistas.pantallaTienda(estado, { ...ctx(), subvista: { tienda: "mascotas" } });
    sano(tiendaEsencial, "Tienda esencial");
    cierto(tiendaEsencial.includes("Tus monedas") && tiendaEsencial.includes("Recompensas") && tiendaEsencial.includes('data-dialogo="recompensa"'), "monedas y premios");
    cierto(!tiendaEsencial.includes("💎") && !tiendaEsencial.includes("Equipo") && !tiendaEsencial.includes("Mascotas") && !tiendaEsencial.includes("gemas"), "sin gemas, equipo ni mascotas");

    // Apagado: todo vuelve (y las principales siguen en Aventuras, una sola vez).
    acciones.elegirAnimo(estado, "bien");
    const tiendaCompleta = vistas.pantallaTienda(estado, ctx());
    cierto(tiendaCompleta.includes("💎") && tiendaCompleta.includes("Mascotas"), "la tienda completa sigue igual");
    const aventuras = vistas.pantallaAventuras(estado, ctx());
    sano(aventuras, "Aventuras");
    igual(aventuras.split('aria-label="Misiones principales"').length - 1, 1, "una sola vez en Aventuras");
    cierto(aventuras.includes("Campaña de jefes") && !aventuras.includes("esencial-grupo"), "y la campaña de jefes sigue ahí, sin los estilos del modo esencial");
});


// ===== Jefes atados al mapa (v52) =====

prueba("Jefes y mapa: el jefe de la región 2 no recibe daño hasta que tu héroe llega; el daño se le guarda", () => {
    igual([0, 1, 4, 5, 9].map(campana.regionDelJefe), [0, 1, 4, 6, 10], "la Ciudadela (región 6) no tiene jefes");
    igual([0, 99, 100, 250].map(campana.regionDelHeroe), [0, 0, 1, 2]);
    const estado = partidaNueva();
    acciones.crearPrincipal(estado, { nombre: "Curso", atributo: "intelecto", submisiones: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10" });
    const principal = estado.principales[0];
    // 10 pasos × 40 + 100 al terminarla = 500: Medusa (150) cae y Cerbero (300) tendría que caer también…
    const celebraciones = jugar(estado, () => { for (const paso of principal.submisiones) acciones.alternarSubmision(estado, principal.id, paso.id); });
    let c = campana.estadoCampanas(estado).intelecto;
    igual([c.derrotados, c.jefe.id, c.esperando, c.vida, c.guardado], [1, "cerbero", true, 300, 350], "…pero vive en la región 2: el daño se le guarda");
    igual(estado.campana.recompensados.intelecto, 1, "solo el premio de Medusa");
    cierto(celebraciones.some((x) => x.titulo === "Medusa"), "cae Medusa");
    // Tu héroe camina hasta la región 2 (100 pasos) y Cerbero recibe todo el daño guardado.
    jugar(estado, () => { for (let n = 0; n < 100; n++) estado.tareas.push({ id: 7000 + n, nombre: "x", hechaEn: hoy(), premio: null }); });
    c = campana.estadoCampanas(estado).intelecto;
    igual([c.derrotados, c.jefe.id, c.esperando, c.vida], [2, "hidra", true, 500], "Cerbero cae al llegar; la Hidra espera en la región 3");
    igual(estado.campana.recompensados.intelecto, 2);
    const info = juego.resumen(estado, hoy());
    const html = vistas.pantallaAventuras(estado, {
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista: {}, campanaVista: "intelecto", diarioVista: {},
    });
    cierto(html.includes("🔒 Te espera en") && !/undefined|NaN/.test(html), "Aventuras dice dónde te espera");
});

prueba("Jefes y mapa: los jefes que ya habías vencido antes de la v52 siguen vencidos (con la vida de antes)", () => {
    const vieja = partidaNueva();
    const leer = crearMision(vieja);
    envejecer(vieja, 30);
    for (let n = -30; n <= 0; n++) marcarEn(vieja, leer, dia(n));   // 31 × 8 = 248: antes caían Medusa (80) y Cerbero (160)
    vieja.campana.recompensados = { intelecto: 2 };
    delete vieja.campana.libres;
    const estado = datos.desdeRespaldo(JSON.stringify({ ...vieja, version: 26 }));
    igual(estado.campana.libres, { intelecto: 2 }, "la migración guarda los que ya cayeron");
    const c = campana.estadoCampanas(estado).intelecto;
    igual([c.derrotados, c.jefe.id, c.esperando], [2, "hidra", true], "siguen vencidos, aunque tu héroe esté en la región 1");
    igual(c.guardado, 248 - 80 - 160, "lo que sobra se guarda para la Hidra");
});


prueba("Jefes y mapa: cada jefe vencido acelera el viaje del héroe (+10 % por jefe, máximo ×3)", () => {
    const estado = partidaNueva();
    igual([campana.jefesVencidos(estado), campana.factorDeViaje(estado)], [0, 1], "sin jefes, sin bono");
    for (let n = 0; n < 40; n++) estado.tareas.push({ id: 8000 + n, nombre: "x", hechaEn: hoy(), premio: null });
    igual(mapa.pasosTotales(estado), 40);
    // 150 de daño de Intelecto = cae el primer jefe (aunque aún no lo "venza" el mapa, cuenta para el viaje).
    for (let n = 0; n < 10; n++) estado.tareas.push({ id: 8100 + n, nombre: "x", hechaEn: hoy(), premio: { atributo: "intelecto", dificultad: "dificil", xp: 50 } });
    igual([campana.jefesVencidos(estado), campana.factorDeViaje(estado)], [1, 1.1]);
    igual([mapa.pasosBrutos(estado), mapa.pasosTotales(estado)], [50, 55], "50 pasos valen 55");
    estado.campana.libres = { fuerza: 5, intelecto: 5, carisma: 5, riqueza: 5 };
    cierto(campana.factorDeViaje(estado) <= campana.FACTOR_VIAJE_MAXIMO, "el bono tiene tope");
});


// ===== Cinemáticas del reino, el arcade, la aldea y la historia (v56) =====

prueba("Cinemáticas del reino: tomas completas, sin huecos, con el nombre del héroe y sin decir que la Llama ya arde", () => {
    const estado = partidaNueva();
    const campanas = campana.estadoCampanas(estado);
    const todas = [];
    for (let region = 0; region < 12; region++) todas.push(cinesReino.cinematicaDeRegion(region, "Aria"));
    const senor = mapa.senoresDeRegion(0, campanas)[0];
    todas.push(cinesReino.cinematicaDeSenor(senor, 0, juego.ATRIBUTOS[senor.categoria], "Aria"));
    for (const region of [0, 1, 5, 6]) todas.push(cinesReino.cinematicaDeFortaleza(region, "Aria"));
    todas.push(cinesReino.cinematicaDeArcade("Aria"), cinesReino.cinematicaDeVoces("Aria"), cinesReino.cinematicaDelEpilogo("Aria"));
    todas.push(cinesReino.cinematicaDeVoz({ id: "maren", nombre: "Maren", voz: "El Orgullo", fondo: "torre" }, "Aria"));
    for (const c of todas) {
        cierto(c.tomas.length >= 2, `${c.tipo}: al menos 2 tomas`);
        for (const t of c.tomas) {
            cierto(t.fondo && t.ms >= 2000 && t.texto, `${c.tipo}: cada toma tiene fondo, duración y texto`);
            cierto(!/undefined|NaN|\{n\}|\[object/.test(`${t.texto}${t.titulo}`), `${c.tipo}: sin huecos`);
            cierto(!/(la llama|el fuego)[^.]*\b(arde ya|ya arde|se enciende)\b/i.test(t.texto) || c.tipo === "fortaleza", "no dice que la Llama de la Torre ya arde");
        }
    }
    cierto(todas[0].tomas[0].titulo === "El Valle del Comienzo" && todas.some((c) => c.tomas.some((t) => t.texto.includes("Aria"))), "con el nombre y el título de la región");
    igual(cinesReino.cinematicaDeRegion(6, "Aria").tomas[0].titulo, "El Valle del Comienzo II", "las vueltas siguientes llevan su número");
    igual(cinesReino.cinematicaDeSenor(senor, 0, juego.ATRIBUTOS[senor.categoria], "Aria").tomas[0].actores[0].quien, senor.jefe.id, "el jefe sale como retrato");
});

prueba("Cinemáticas del reino: cada una se ve una sola vez, se pueden reiniciar y se respetan los ajustes", () => {
    const estado = partidaNueva();
    igual(estado.mapa.cines, []);
    igual(acciones.verCinematica(estado, cinesReino.claveDeRegion(0)), true, "la primera vez, se reproduce");
    igual(acciones.verCinematica(estado, cinesReino.claveDeRegion(0)), false, "la segunda, no");
    igual(estado.mapa.cines, ["region-0"]);
    estado.ajustes.cinematicas = false;
    igual(acciones.verCinematica(estado, cinesReino.CLAVE_ARCADE), false, "apagadas: no se reproduce, pero se anota");
    cierto(estado.mapa.cines.includes("arcade-intro"));
    acciones.reiniciarCinematicas(estado);
    igual(estado.mapa.cines, []);
});

prueba("Historia: cada capítulo se parte en tomas cortas, con el guardián en los de zona", () => {
    const capitulos = leyendas.capitulosDeLeyenda("torre", 20, "Aria");
    const prologo = capitulos.find((c) => c.id === "prologo");
    const escena = cinesReino.cinematicaDeCapitulo(prologo, { lugar: "torre", fondo: "cripta", tieneGuardian: false }, "Aria");
    cierto(escena.tomas.length >= prologo.parrafos.length, "al menos una toma por párrafo");
    cierto(escena.tomas.every((t) => t.texto.length <= 260 && t.ms >= 2800 && t.ms <= 14000), "tomas cortas y de duración razonable");
    igual(escena.tomas[0].titulo, `Prólogo · ${prologo.titulo}`, "la primera lleva el título");
    cierto(escena.tomas.every((t) => !t.actores.some((a) => a.quien === "criatura")), "el prólogo lo cuenta Aurelio, sin guardián");
    const cripta = capitulos.find((c) => c.id === "cripta");
    const guardian = cinesReino.guardianDeZona("torre", "cripta");
    cierto(guardian && bestiario.CRIATURAS[guardian].guardian, "cada zona tiene su guardián");
    const deZona = cinesReino.cinematicaDeCapitulo(cripta, { lugar: "torre", fondo: "cripta", tieneGuardian: true }, "Aria");
    cierto(deZona.tomas.some((t) => t.actores.some((a) => a.quien === "criatura" && a.anim === "cine-cae")), "al final del capítulo, el guardián cae");
    for (const t of deZona.tomas) cierto(!/\{n\}/.test(t.texto), "sin {n} sin reemplazar");
    // Los textos largos se parten por frases, sin perder nada.
    const largo = "Una frase corta. Otra frase un poco más larga que la anterior, para llenar espacio. Y una tercera que ya no cabe en el mismo trozo de arriba, seguro.";
    const trozos = cinesReino.trozosDe(largo, 80);
    igual(trozos.join(" ").replace(/\s+/g, " "), largo, "no se pierde ni se repite texto");
    cierto(trozos.length >= 2 && trozos.every((t) => t.length <= 160), "se parte en trozos");
    // La pantalla de Historia: capítulos desplegables con su botón «Ver escena».
    const html = vistas.pantallaHistoria({ lugar: "torre", capitulos });
    cierto(html.includes("<details") && html.includes('data-accion="cine-capitulo"') && !/undefined|NaN|\[object/.test(html), "capítulos que se abren, con su escena");
    igual(html.split('data-accion="cine-capitulo"').length - 1, capitulos.filter((c) => c.abierto).length, "un botón por capítulo abierto");
});

prueba("Mapa: los señores vencidos se ven en su guarida y cada región tiene su botón para ver la escena", () => {
    const estado = partidaNueva();
    const leer = crearMision(estado);
    envejecer(estado, 29);
    for (let n = -29; n <= 0; n++) marcarEn(estado, leer, dia(n));   // 240 de daño de Intelecto: cae Medusa
    const info = juego.resumen(estado, hoy());
    const ctx = {
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista: {}, campanaVista: null, diarioVista: {},
    };
    const html = vistas.pantallaMapa(estado, ctx);
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    igual(html.split('class="mapa-trofeo"').length - 1, 1, "solo Medusa, el único señor vencido, aparece en su guarida");
    cierto(html.includes('data-accion="cine-region"') && html.includes("Ver la escena de esta región"), "con el botón de la escena");
    cierto(html.includes("mapa-guarida libre"), "su guarida queda marcada como libre");
});

// ===== La Biblioteca prohibida (v57) =====

prueba("Biblioteca: ocho pergaminos con lore, moraleja y presagio, sin huecos y con el nombre en su lugar", () => {
    const lista = pergaminos.todosLosPergaminos("Ana");
    igual(lista.length, 8, "ocho pergaminos");
    igual(lista.map((p) => p.numero), ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]);
    igual(lista.map((p) => p.id), pergaminos.IDS);
    igual(new Set(lista.map((p) => p.id)).size, 8, "sin ids repetidos");
    for (const p of lista) {
        cierto(p.titulo && p.subtitulo && p.prologo.length >= 1 && p.capitulos.length >= 3, `«${p.titulo}»: título, prólogo y al menos 3 capítulos`);
        cierto(p.capitulos.every((c) => c.titulo && c.parrafos.length >= 1 && c.parrafos.every((x) => x.length > 20)), `«${p.titulo}»: capítulos con texto`);
        cierto(p.ensenanzas.length >= 3 && p.moraleja.length > 15 && p.presagio.length > 30, `«${p.titulo}»: enseñanzas, moraleja y presagio`);
        cierto(p.escena.lineas.length === 2 && p.escena.fondo && p.escena.ambiente, `«${p.titulo}»: datos de su escena`);
        cierto(!/\{n\}|undefined|NaN|\[object/.test(JSON.stringify(p)), `«${p.titulo}»: sin huecos`);
        cierto(p.minutos >= 1, `«${p.titulo}»: se lee en ${p.minutos} min`);
    }
    cierto(pergaminos.pergaminoDe("brasas", "Ana").prologo[0].includes("Ana"), "el último habla de ti");
    igual(pergaminos.pergaminoDe("piedra", "Ana").titulo, "La primera piedra", "el primero es el de siempre");
    // Lo nuevo no puede decir que la Llama ya arde, salvo el último (que solo se abre al terminar la saga).
    for (const p of lista.slice(0, 7)) cierto(!/(la Llama|el fuego)[^.]*\b(ya arde|arde otra vez|volvió a arder)\b/i.test(JSON.stringify(p)), `«${p.titulo}» no dice que la Llama ya arde`);
});

prueba("Biblioteca: se abren en orden (leer el anterior + cumplir su condición)", () => {
    const base = { leidos: {}, completadas: 0, derrotados: 0, region: 0, torre: 0, mazmorra: 0, voces: 0, saga: false };
    let b = pergaminos.estadoDeBiblioteca("Ana", base);
    igual(b.pergaminos.map((p) => p.abierto), [true, false, false, false, false, false, false, false], "al principio, solo el primero");
    igual(b.siguiente, "piedra");
    // Cumplir la condición del segundo sin haber leído el primero no basta.
    b = pergaminos.estadoDeBiblioteca("Ana", { ...base, completadas: 50, derrotados: 5, region: 3, torre: 30, mazmorra: 20, voces: 10, saga: true });
    igual(b.pergaminos.filter((p) => p.abierto).map((p) => p.id), ["piedra"], "hay que leerlos en orden");
    cierto(b.pergaminos[1].falta.includes("Lee el pergamino anterior"), "dice qué falta");
    // Leído el primero, el segundo pide 5 misiones.
    b = pergaminos.estadoDeBiblioteca("Ana", { ...base, leidos: { piedra: "2026-10-15" } });
    igual([b.pergaminos[1].abierto, b.pergaminos[1].falta], [false, "Cumple 5 misiones."]);
    b = pergaminos.estadoDeBiblioteca("Ana", { ...base, leidos: { piedra: "2026-10-15" }, completadas: 5 });
    igual([b.pergaminos[1].abierto, b.siguiente, b.leidos], [true, "juramento", 1]);
    // Todo leído y todo cumplido: la biblioteca queda completa.
    const todos = Object.fromEntries(pergaminos.IDS.map((id) => [id, "2026-10-15"]));
    b = pergaminos.estadoDeBiblioteca("Ana", { ...base, leidos: todos, completadas: 50, derrotados: 5, region: 3, torre: 30, mazmorra: 20, voces: 10, saga: true });
    igual([b.leidos, b.total, b.siguiente], [8, 8, null]);
    // El último solo se abre al terminar la saga.
    b = pergaminos.estadoDeBiblioteca("Ana", { ...base, leidos: Object.fromEntries(pergaminos.IDS.slice(0, 7).map((id) => [id, "x"])), completadas: 50, derrotados: 5, region: 3, torre: 30, mazmorra: 20, voces: 10, saga: false });
    igual(b.pergaminos[7].abierto, false, "«Lo que arde después» espera a la Llama");
    // Las sagas futuras se insinúan según lo leído.
    igual(pergaminos.sagasFuturas({}).every((x) => !x.insinuada), true);
    igual(pergaminos.sagasFuturas({ hermanas: "x", casio: "x" }).filter((x) => x.insinuada).map((x) => x.id), ["madre"]);
});

prueba("Biblioteca: terminar de leer un pergamino da el premio una sola vez y no se salta el orden", () => {
    const estado = partidaNueva();
    igual(estado.pergaminos, { leidos: {} }, "empieza vacía");
    debeFallar(() => acciones.terminarPergamino(estado, "juramento"), "Todavía no puedes leerlo. Lee el pergamino anterior y cumple 5 misiones.");
    debeFallar(() => acciones.terminarPergamino(estado, "inventado"), "no existe");
    const antes = [estado.personaje.xp, estado.personaje.gemas, estado.atributos.intelecto];
    const r = acciones.terminarPergamino(estado, "piedra");
    igual([r.primera, r.premio], [true, pergaminos.PREMIO_LECTURA]);
    igual([estado.personaje.xp - antes[0], estado.personaje.gemas - antes[1], estado.atributos.intelecto - antes[2]],
          [pergaminos.PREMIO_LECTURA.xp, pergaminos.PREMIO_LECTURA.gemas, pergaminos.PREMIO_LECTURA.xp], "XP, gemas y atributo");
    cierto(r.celebraciones[0].detalle.includes(pergaminos.pergaminoDe("piedra", "Ana").moraleja), "la celebración muestra la moraleja");
    igual(acciones.terminarPergamino(estado, "piedra").primera, false, "la segunda vez, sin premio");
    igual(estado.personaje.xp - antes[0], pergaminos.PREMIO_LECTURA.xp, "no se cobra dos veces");
    debeFallar(() => acciones.terminarPergamino(estado, "juramento"), "Todavía no puedes leerlo. Cumple 5 misiones.");
    for (let n = 0; n < 5; n++) estado.completadas.push({ misionId: 1, fecha: hoy(), xp: 10, monedas: 5, atributo: "fuerza", dificultad: "facil" });
    igual(acciones.terminarPergamino(estado, "juramento").primera, true, "con 5 misiones, se abre el segundo");
    // Se guarda y sobrevive a una copia de seguridad.
    const copia = datos.desdeRespaldo(datos.paraRespaldo ? datos.paraRespaldo(estado) : JSON.stringify(estado));
    igual(Object.keys(copia.pergaminos.leidos), ["piedra", "juramento"], "queda guardado");
    igual(datos.desdeRespaldo(JSON.stringify({ version: 1, personaje: { nombre: "Vieja", xp: 0, monedas: 0, creadoEn: hoy() }, misiones: [] })).pergaminos, { leidos: {} }, "una copia vieja la trae vacía");
});

prueba("Biblioteca (pantallas): lista con candados, pergamino con moraleja y botón de terminar, escena al final", () => {
    const estado = partidaNueva();
    estado.personaje.nombre = "Ana <b>";
    let html = vistas.pantallaBiblioteca(estado);
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    cierto(html.includes("0 de 8") && html.includes('data-accion="pergamino-abrir" data-id="piedra"'), "el primero se puede abrir");
    cierto(html.includes("???") && html.includes("Lee el pergamino anterior"), "los demás, con su candado y lo que falta");
    cierto(html.includes("Lo que queda abierto") && html.includes("Una historia todavía sin nombre"), "las sagas que vendrán, todavía ocultas");
    html = vistas.pantallaPergamino(estado, { pergaminoId: "piedra" });
    cierto(html.includes("rollo-moraleja") && html.includes('data-accion="pergamino-terminar" data-id="piedra"') && html.includes("Terminé de leerlo"), "moraleja y botón de terminar");
    cierto(html.includes("Pergamino I de 8") && html.includes("Ana &lt;b&gt;"), "su número y el nombre escapado");
    html = vistas.pantallaPergamino(estado, { pergaminoId: "juramento" });
    cierto(html.includes("🔒") && !html.includes("rollo-papel"), "un pergamino cerrado no se puede leer");
    acciones.terminarPergamino(estado, "piedra");
    html = vistas.pantallaPergamino(estado, { pergaminoId: "piedra" });
    cierto(html.includes('data-accion="pergamino-escena"') && !html.includes('data-accion="pergamino-terminar"') && html.includes("Lo leíste el"), "ya leído: ver la escena otra vez");
    cierto(vistas.pantallaBiblioteca(estado).includes("1 de 8"), "la biblioteca cuenta el que leíste");
    // Héroe › Historia lleva a la Biblioteca.
    const info = juego.resumen(estado, hoy());
    const historia = vistas.pantallaPersonaje(estado, {
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista: { personaje: "historia" }, campanaVista: null, diarioVista: {},
    });
    cierto(historia.includes('data-accion="biblioteca-abrir"') && historia.includes("1 de 8 leídos"), "desde Héroe › Historia");
    // La cinemática de cada pergamino: cuatro tomas, con la moraleja y el presagio.
    for (const p of pergaminos.todosLosPergaminos("Ana")) {
        const c = cinesReino.cinematicaDePergamino(p, "Ana");
        igual(c.tomas.length, 4, `«${p.titulo}»: cuatro tomas`);
        cierto(c.tomas[2].texto.includes(p.moraleja) && c.tomas[3].texto === p.presagio, `«${p.titulo}»: moraleja y presagio`);
        cierto(c.tomas.every((t) => t.fondo && t.ms >= 4000 && !/\{n\}|undefined/.test(t.texto)), `«${p.titulo}»: tomas completas`);
    }
});

// ===== Música por escena, voces de criaturas y turnos claros (v58) =====

prueba("Música por escena: lectura, diario, mapa, Mazmorra y Torre; sin «auto» suena lo que elegiste", () => {
    const elegir = (extra) => musicaModulo.pistaDeEscena({ elegida: "epica", auto: true, ...extra });
    for (const pantalla of ["pergamino", "biblioteca", "memorias", "libro", "pacto", "historia"]) igual(elegir({ pantalla }), "lectura", `${pantalla} → lectura`);
    igual(elegir({ pantalla: "diario" }), "nocturno");
    igual([elegir({ pantalla: "mapa" }), elegir({ pantalla: "voces" })], ["alba", "alba"]);
    igual(elegir({ pantalla: "hoy" }), "epica", "en Hoy, la que elegiste");
    igual(elegir({ pantalla: "hoy", elegida: "misterio" }), "misterio");
    igual([elegir({ pantalla: "arcade", torre: "torre" }), elegir({ pantalla: "arcade", torre: "mazmorra" })], ["batalla", "abismo"], "la Torre y la Mazmorra");
    // Con la música automática apagada: lo de siempre.
    igual(elegir({ pantalla: "pergamino", auto: false }), "epica");
    igual(elegir({ pantalla: "mapa", auto: false, elegida: "batalla" }), "batalla");
    igual(elegir({ pantalla: "arcade", torre: "mazmorra", auto: false }), "misterio", "la Mazmorra sin auto conserva su música de antes");
    for (const clave of ["lectura", "alba", "nocturno", "abismo"]) cierto(PISTAS[clave].obra && PISTAS[clave].autor && PISTAS[clave].interpretes, `${clave}: con sus créditos`);
    // Todas las pistas que usa pistaDeEscena existen.
    for (const pantalla of ["pergamino", "diario", "mapa", "hoy"]) cierto(PISTAS[elegir({ pantalla })], `la pista de ${pantalla} existe`);
    igual(datos.estadoInicial().ajustes.musicaAuto, true, "viene encendida");
    igual([typeof musicaModulo.precargar, typeof musicaModulo.pistaActual, musicaModulo.pistaActual()], ["function", "function", null], "se puede saber qué suena y precargar las pistas");
});

prueba("Voces: cada criatura de la Torre y de la Mazmorra tiene su voz (aparece, ataca, herido y cae)", () => {
    const todas = Object.values(bestiario.LUGARES).flatMap((l) => l.orden);
    igual(todas.length, 80, "las 80 criaturas de los cuatro lugares");
    for (const id of todas) {
        const familia = sonidoModulo.FAMILIA_DE_CRIATURA[id];
        cierto(familia, `${id} tiene familia`);
        for (const momento of sonidoModulo.MOMENTOS_DE_VOZ) {
            const sonido = sonidoModulo.sonidoDeVoz(familia, momento);
            cierto(sonido && sonido.notas.length >= 1 && sonido.volumen > 0 && sonido.volumen < 0.3, `${id} · ${momento}`);
            for (const [frecuencia, inicio, duracion, final] of sonido.notas) {
                cierto(frecuencia >= 20 && frecuencia < 8000 && inicio >= 0 && duracion > 0 && (final === undefined || final >= 20), `${id} · ${momento}: notas válidas`);
            }
        }
    }
    igual(sonidoModulo.sonidoDeVoz("inventada", "ataque"), null, "una familia que no existe no suena");
    igual(sonidoModulo.sonidoDeVoz("bestia", "inventado"), null);
    // Las familias suenan distinto entre sí.
    cierto(JSON.stringify(sonidoModulo.sonidoDeVoz("rugido", "ataque")) !== JSON.stringify(sonidoModulo.sonidoDeVoz("chillido", "ataque")), "un rugido no suena como un chillido");
    cierto(JSON.stringify(sonidoModulo.sonidoDeVoz("bestia", "cae")) !== JSON.stringify(sonidoModulo.sonidoDeVoz("bestia", "ataque")), "cada momento suena distinto");
    // Los sonidos nuevos de la batalla existen (los pide app.js por su nombre).
    for (const nombre of ["tajo", "pocion", "drenar", "sellar", "barrera", "carga", "descarga", "reflejo", "veneno", "coraza",
                          "rugidito", "graznido", "ulular", "siseo", "chillido", "fenix"]) cierto(sonidoModulo.existeSonido(nombre), `existe «${nombre}»`);
});

prueba("Batalla: la secuencia del turno (plan y resultado, en orden) y un banner y efecto por cada ataque especial", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 11);
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (cambios = {}) => ({ partida: estado.arcade.torre, nombre: "Ana", sprites: imagenes, eventos: [], menu: "principal",
                                   ultimo: "atacar", bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);
    // Antes de actuar (v60): el orden del turno con las caras (tú «Ahora», la criatura «Luego») y su intención en un globo.
    let html = vistas.pantallaTorre(t());
    sano(html, "el plan");
    cierto(html.includes('class="ff-orden plan"') && html.includes("Ahora") && html.includes("Luego") && !html.includes('class="ff-turnos'), "antes de actuar, el orden");
    cierto(html.includes('class="ff-globo') && html.includes("Mordisco"), "lo que va a hacer la criatura, en su globo");
    const numeros = (texto) => [...texto.matchAll(/ff-turno-numero" aria-hidden="true">(\d)</g)].map((x) => Number(x[1]));
    const orden = html.slice(html.indexOf('<ol class="ff-orden'), html.indexOf("</ol>", html.indexOf('<ol class="ff-orden')));
    cierto(orden.indexOf("ff-orden-tuyo") < orden.indexOf("ff-orden-criatura") && !orden.includes("ff-orden-mascota"), "primero tú, después la criatura (sin mascota)");
    // Después de actuar: lo que pasó, en orden.
    const evento = (quien, tipo, extra = {}) => ({ quien, tipo, ...extra });
    html = vistas.pantallaTorre(t({ eventos: [evento("heroe", "atacar", { dano: 12 }), evento("enemigo", "golpe", { dano: 5, nombre: "Mordisco" })] }));
    sano(html, "el turno jugado");
    cierto(html.includes('class="ff-turnos jugado"') && html.includes("Mordisco") && html.includes("−5"), "el turno jugado");
    igual(numeros(html), [1, 2], "1 tú, 2 la criatura");
    // Con la mascota y el fin del turno hay cuatro pasos, en el orden de siempre.
    estado.arcade.torre.mascota = { especie: "dragon", nombre: "Chispa", etapa: "cria", potencia: 1, cada: 3, espera: 0 };
    html = vistas.pantallaTorre(t({ sprites: { ...imagenes, mascota: "data:image/png;base64,DD" },
        eventos: [evento("heroe", "atacar", { dano: 12 }), evento("mascota", "ataque", { dano: 7, nombre: "Aliento de fuego" }),
                  evento("enemigo", "golpe", { dano: 5, nombre: "Mordisco" }), evento("veneno", "veneno", { dano: 4 })] }));
    sano(html, "el turno completo");
    igual(numeros(html), [1, 2, 3, 4], "tú, la mascota, la criatura y el fin del turno");
    const turno = html.slice(html.indexOf('<ol class="ff-turnos'), html.indexOf("</ol>", html.indexOf('<ol class="ff-turnos')));
    cierto(turno.indexOf("Aliento de fuego") < turno.indexOf("Mordisco") && turno.indexOf("Mordisco") < turno.indexOf("Veneno −4"), "en ese orden");
    // Cuando cae, el último paso de la criatura es su caída.
    html = vistas.pantallaTorre(t({ eventos: [evento("heroe", "atacar", { dano: 99 }), evento("enemigo", "derrotado")] }));
    cierto(html.includes("Cae derrotada"), "la caída aparece en la secuencia");
    // Cada ataque especial: su banner, su efecto y su paso resaltado.
    const casos = [
        ["veneno", { tipo: "especial", dano: 6 }, "ff-sp-veneno"], ["drenar", { tipo: "especial", dano: 8, cura: 8 }, "ff-sp-drenar"],
        ["sellar", { tipo: "especial", dano: 5, sello: 2 }, "ff-sp-sellar"], ["coraza", { tipo: "especial" }, "ff-sp-coraza"],
        ["barrera", { tipo: "especial", barrera: 40 }, "ff-sp-barrera"], ["carga", { tipo: "especial" }, "ff-sp-carga"],
        ["reflejo", { tipo: "especial" }, "ff-sp-reflejo"],
    ];
    for (const [clave, extra, efecto] of casos) {
        html = vistas.pantallaTorre(t({ eventos: [evento("heroe", "atacar", { dano: 3 }), evento("enemigo", "especial", { especial: clave, nombre: "Ataque raro", ...extra })] }));
        sano(html, `el especial ${clave}`);
        cierto(html.includes(`ff-especial ff-especial-${clave}`) && html.includes(efecto) && html.includes("ff-turno-especial") && html.includes("«Ataque raro»"), `${clave}: banner, efecto y paso resaltado`);
    }
    html = vistas.pantallaTorre(t({ eventos: [evento("heroe", "defender"), evento("enemigo", "descarga", { dano: 20, nombre: "Infierno" })] }));
    cierto(html.includes("ff-especial-descarga") && html.includes("ff-sp-descarga") && html.includes("ff-sacude"), "la descarga: banner, onda y sacudida");
    // Un golpe normal no es un especial.
    html = vistas.pantallaTorre(t({ eventos: [evento("heroe", "atacar", { dano: 3 }), evento("enemigo", "golpe", { dano: 4, nombre: "Mordisco" })] }));
    cierto(!html.includes("ff-especial-") && !html.includes("ff-turno-especial"), "un golpe normal no es especial");
    // Si lo esquivas, el efecto sobre ti no aparece (pero el banner sí dice qué intentó).
    html = vistas.pantallaTorre(t({ eventos: [evento("heroe", "defender"), evento("enemigo", "especial", { especial: "veneno", nombre: "Filamentos", dano: 0, esquivado: true })] }));
    cierto(html.includes("ff-especial-veneno") && !html.includes("ff-sp-veneno") && html.includes("esquivaste"), "esquivado: sin efecto sobre ti");
    // Y la Mazmorra también.
    estado.arcade.records.torre = 20;
    acciones.empezarTorre(estado, 4, "mazmorra");
    const mazmorra = vistas.pantallaTorre({ ...t(), partida: estado.arcade.mazmorra });
    sano(mazmorra, "la Mazmorra");
    cierto(mazmorra.includes("ff-orden plan"), "la Mazmorra también muestra el orden del turno");
});

// ===== La batalla más clara: rutas, élite, tarjetas y barras (v60) =====

prueba("Rutas: en el 2.º piso de cada zona eliges camino; el desafío trae una élite con don seguro, el sendero te cura", () => {
    igual([1, 2, 7, 12, 3, 5].map(torre.hayRuta), [false, true, true, true, false, false]);
    // El desafío: la criatura es de élite.
    let p = llegarAlPiso(2);
    igual(p.fase, "ruta");
    cierto(p.registro.includes("bifurca"), "el registro lo cuenta");
    debeFallar(() => torre.actuar(p, "atacar"), "Ahora no estás en una batalla");
    debeFallar(() => torre.elegirRuta(p, "inventada"), "Ese camino no existe");
    const [vida, ataque] = [p.enemigo.vidaMax, p.enemigo.ataque];
    torre.elegirRuta(p, "desafio");
    igual([p.fase, p.enemigo.elite, p.enemigo.vidaMax, p.enemigo.ataque], ["batalla", true, Math.round(vida * torre.ELITE.vida), Math.round(ataque * torre.ELITE.ataque)]);
    debeFallar(() => torre.elegirRuta(p, "calma"), "Ahora no estás eligiendo camino");
    // Al vencerla: un don seguro entre las opciones y +1 poción.
    const pociones = p.heroe.pociones;
    p.enemigo.vida = 1;
    p.heroe.ataque = 999;
    torre.actuar(p, "atacar");
    igual(p.fase, "mejora");
    cierto(p.opciones.some((c) => torre.MEJORAS[c].don), "un don seguro");
    igual(p.heroe.pociones, pociones + 1, "+1 poción");
    // El sendero: te cura y la criatura llega cansada.
    p = llegarAlPiso(2);
    p.heroe.vida = 10;
    const vidaAntes = p.enemigo.vidaMax;
    torre.elegirRuta(p, "calma");
    igual([p.heroe.vida, p.enemigo.vidaMax, p.enemigo.elite], [10 + Math.round(p.heroe.vidaMax * torre.CALMA.cura), Math.round(vidaAntes * torre.CALMA.vida), undefined]);
    // Y en la Mazmorra, también.
    igual(llegarAlPiso(7, "mazmorra").fase, "ruta");
});

prueba("Botín en tarjetas: cada mejora tiene su tipo, y la pantalla las muestra con icono, efecto y cinta de don", () => {
    for (const [clave, mejora] of Object.entries(torre.MEJORAS)) cierto(torre.TIPOS_DE_MEJORA[mejora.tipo], `${clave} tiene tipo`);
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 11);
    const p = estado.arcade.torre;
    p.enemigo.vida = 0;
    p.fase = "mejora";
    p.opciones = ["afilar", "mana", "vigor", "sangre"];
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (cambios = {}) => ({ partida: p, nombre: "Ana", sprites: imagenes, eventos: [], menu: "principal", ultimo: "atacar",
                                   bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    let html = vistas.pantallaTorre(t({ eventos: [{ quien: "heroe", tipo: "atacar", dano: 40 }, { quien: "enemigo", tipo: "derrotado" }] }));
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    igual(html.split('class="ff-carta ').length - 1, 4, "cuatro tarjetas");
    for (const tipo of ["ofensiva", "magica", "defensiva"]) cierto(html.includes(`tipo-${tipo}`), `una ${tipo}`);
    cierto(html.includes("✦ Don raro") && html.includes("ff-carta tipo-ofensiva don"), "la cinta del don");
    cierto(html.includes('data-accion="torre-mejora" data-mejora="afilar"'), "se eligen igual que antes");
    cierto(html.includes("ff-victoria") && html.includes("tras-victoria"), "primero la victoria, después el botín");
    // La ruta, en dos tarjetas.
    p.fase = "ruta";
    p.ruta = { antes: "Piso 2: aparece algo." };
    html = vistas.pantallaTorre(t());
    cierto(html.includes('data-accion="torre-ruta" data-ruta="desafio"') && html.includes('data-accion="torre-ruta" data-ruta="calma"') && html.includes("bifurca"), "las dos rutas");
});

prueba("Escena de batalla: la vida de los dos a la vista (con lo que se perdió), los estados en iconos, el arco del golpe y el crítico", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 11);
    const p = estado.arcade.torre;
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (cambios = {}) => ({ partida: p, nombre: "Ana", sprites: imagenes, eventos: [], menu: "principal", ultimo: "atacar",
                                   bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    let html = vistas.pantallaTorre(t());
    cierto(html.includes("ff-hud-enemigo") && html.includes(`${p.enemigo.vida}/${p.enemigo.vidaMax}`) && html.includes(`${p.heroe.vida}/${p.heroe.vidaMax}`), "las dos barras con sus números");
    cierto(!html.includes("ff-hp-fantasma"), "sin golpes, sin fantasma");
    p.enemigo.vida -= 10;
    p.heroe.vida -= 4;
    html = vistas.pantallaTorre(t({ eventos: [{ quien: "heroe", tipo: "atacar", dano: 10, critico: true }, { quien: "enemigo", tipo: "golpe", dano: 4, nombre: "Mordisco" }] }));
    igual(html.split("ff-hp-fantasma").length - 1, 2, "las dos barras muestran lo que se perdió");
    cierto(html.includes("ff-arco critico") && html.includes("¡CRÍTICO!"), "el arco dorado y el crítico");
    cierto(html.includes('class="ff-orden jugado"'), "las caras del orden se encienden");
    // Los estados en iconos.
    p.enemigo.coraza = true;
    p.enemigo.barrera = 12;
    p.heroe.veneno = 2;
    p.enemigo.elite = true;
    html = vistas.pantallaTorre(t());
    const hud = html.indexOf("ff-hud-enemigo");
    const estados = html.slice(html.indexOf('class="ff-estados"', hud), html.indexOf("</span>", html.indexOf('class="ff-estados"', hud)));
    cierto(estados.includes("⭐") && estados.includes("🐚") && estados.includes("💠12"), "élite, coraza y barrera junto a su vida");
    cierto(html.includes("☠️2"), "tu veneno junto a tu vida");
    // La Voluntad: un arco enorme y la escena destella.
    html = vistas.pantallaTorre(t({ eventos: [{ quien: "heroe", tipo: "voluntad", dano: 50, nombre: "Golpe de Voluntad" }] }));
    cierto(html.includes("ff-arco voluntad") && html.includes("ff-destella"), "el Golpe de Voluntad se siente");
    // Un ataque fuerte o especial pone el globo en peligro.
    p.enemigo.intencion = "fuerte";
    cierto(vistas.pantallaTorre(t()).includes("ff-globo peligro"), "un golpe fuerte se anuncia en rojo");
});

// ===== En horizontal (v61) =====

prueba("Horizontal: la batalla, las cinemáticas, el mapa y los minijuegos tienen su diseño para el teléfono girado", async () => {
    const css = await (await fetch("../estilos.css", { cache: "no-store" })).text();
    const inicio = css.indexOf("@media (orientation: landscape) and (max-height: 540px)");
    cierto(inicio > 0, "hay un bloque para pantallas horizontales bajitas (no tabletas ni la compu)");
    const bloque = css.slice(inicio);
    for (const [selector, que] of [[".torre-caja", "la batalla"], [".ff-escena", "la escena de batalla"], [".cine-escena", "las cinemáticas"],
                                   ["#pantalla-mapa", "el mapa"], [".minijuego-lienzo", "los minijuegos"], [".ff-cartas", "las tarjetas del botín"]]) {
        cierto(bloque.includes(selector), `${que} se reacomoda`);
    }
    cierto(bloque.includes("grid-template-columns") && bloque.includes("16 / 9"), "dos columnas y escena 16:9");
    cierto(!/\.contenido\s*\{[^}]*max-width:\s*980px/.test(css.slice(0, inicio)), "el resto de la app sigue en su columna angosta");
    const manifiesto = await (await fetch("../manifest.json", { cache: "no-store" })).json();
    igual(manifiesto.orientation, "any", "la app instalada deja girar");
});

// ===== «El Centinela», el libro largo de Casio (v62) =====

prueba("El Centinela: un libro largo (24 capítulos en 3 libros) con moraleja en cada uno, sin huecos y con el nombre solo al final", () => {
    igual(libroCasio.CAPITULOS.length, 24, "veinticuatro capítulos");
    cierto(libroCasio.palabras() >= 11000, `es largo: ${libroCasio.palabras()} palabras`);
    cierto(libroCasio.minutosDeLectura() >= 55, `se lee en ${libroCasio.minutosDeLectura()} minutos`);
    igual(libroCasio.LIBROS.map((l) => l.nombre), ["La orilla", "La Torre", "La guardia"], "tres libros");
    igual(libroCasio.LIBROS.map((l) => l.desde), [0, 5, 18]);
    igual(libroCasio.CAPITULOS_LIBRES, 18, "los dos primeros libros están libres");
    for (const [i, c] of libroCasio.CAPITULOS.entries()) {
        cierto(c.titulo && c.parrafos.length >= 4 && c.parrafos.every((p) => p.length > 40), `capítulo ${i + 1}: «${c.titulo}» tiene texto`);
        cierto(c.moraleja.length > 25, `capítulo ${i + 1}: tiene moraleja`);
        cierto(c.parrafos.join(" ").split(/\s+/).length >= 330, `capítulo ${i + 1}: no es corto`);
    }
    cierto(libroCasio.ENSENANZAS.length >= 16 && libroCasio.PROLOGO.length >= 3 && libroCasio.EPILOGO.length >= 4, "enseñanzas, prólogo y epílogo");
    const libro = libroCasio.libroDeCasio("Ana", 30);
    const texto = JSON.stringify(libro);
    cierto(!/\{n\}|undefined|NaN|\[object/.test(texto), "sin huecos");
    cierto(libro.capitulos.slice(18).some((c) => c.parrafos.join(" ").includes("Ana")), "tu nombre aparece en el libro tercero");
    cierto(!libroCasio.CAPITULOS.slice(0, 18).some((c) => c.parrafos.join(" ").includes("{n}")), "pero no antes de que liberes a Casio");
    // Lo que ya cuentan las otras historias no se contradice.
    const todo = libroCasio.CAPITULOS.map((c) => c.parrafos.join(" ")).join(" ") + libroCasio.EPILOGO.join(" ");
    cierto(!/Archivista[^.]*(murió|se convirtió en polvo|se deshizo)/i.test(todo.replace("antes de volver a su mesa", "")), "el Archivista sigue en su biblioteca");
    cierto(!/(la Llama|el fuego)[^.]*\b(ya arde|arde otra vez|volvió a arder)\b/i.test(todo), "no dice que la Llama ya arde");
    cierto(todo.includes("Ayer subí") || todo.includes("ayer subí"), "tiene la frase de Casio");
    cierto(todo.includes("piso diecinueve") && todo.includes("Ceniza") && todo.includes("Orrin"), "enlaza con la Torre, el dragón y el nombre raspado");
    cierto(todo.includes("armadura celeste") || todo.includes("celeste"), "la armadura celeste");
});

prueba("El Centinela: los capítulos finales se abren al liberar a Casio (piso 20) y se puede leer, continuar y terminar una vez", () => {
    const cerrado = libroCasio.libroDeCasio("Ana", 0);
    igual(cerrado.capitulos.filter((c) => c.abierto).length, 18, "hasta el capítulo 18");
    cierto(cerrado.capitulos[18].bloqueado.includes("piso 20") && cerrado.capitulos[18].parrafos.length === 0 && cerrado.epilogo.length === 0, "lo demás, cerrado y sin texto");
    igual(libroCasio.libroDeCasio("Ana", 20).capitulos.filter((c) => c.abierto).length, 24, "con el piso 20, todos");
    const estado = partidaNueva();
    igual(estado.libros.casio, { marca: 0, leidos: 0, fin: null }, "empieza sin leer");
    acciones.marcarLibro(estado, "casio", 0);
    acciones.marcarLibro(estado, "casio", 5);
    acciones.marcarLibro(estado, "casio", 2);
    igual([estado.libros.casio.marca, estado.libros.casio.leidos], [2, 6], "recuerda dónde vas y lo más lejos que llegaste");
    debeFallar(() => acciones.marcarLibro(estado, "casio", 18), "Aurelio te lo entregará cuando liberes a Casio: supera el piso 20 de la Torre.");
    debeFallar(() => acciones.marcarLibro(estado, "casio", 99), "Ese capítulo no existe.");
    debeFallar(() => acciones.marcarLibro(estado, "otro", 0), "Ese libro no existe.");
    debeFallar(() => acciones.terminarLibro(estado, "casio"), "Todavía te faltan capítulos por abrir.");
    estado.arcade.records.torre = 20;
    debeFallar(() => acciones.terminarLibro(estado, "casio"), "Léelo hasta el último capítulo.");
    acciones.marcarLibro(estado, "casio", 23);
    const antes = [estado.personaje.xp, estado.personaje.gemas];
    const r = acciones.terminarLibro(estado, "casio");
    igual([r.primera, estado.personaje.xp - antes[0], estado.personaje.gemas - antes[1]], [true, libroCasio.PREMIO.xp, libroCasio.PREMIO.gemas], "el premio");
    igual(acciones.terminarLibro(estado, "casio").primera, false, "una sola vez");
    igual(estado.personaje.xp - antes[0], libroCasio.PREMIO.xp, "no se cobra dos veces");
    // Sobrevive a una copia de seguridad y una copia vieja lo trae vacío.
    const copia = datos.desdeRespaldo(JSON.stringify(estado));
    igual([copia.libros.casio.leidos, Boolean(copia.libros.casio.fin)], [24, true], "queda guardado");
    igual(datos.desdeRespaldo(JSON.stringify({ version: 1, personaje: { nombre: "Vieja", xp: 0, monedas: 0, creadoEn: hoy() }, misiones: [] })).libros.casio, { marca: 0, leidos: 0, fin: null }, "una copia vieja");
    // La escena final.
    const c = cinesReino.cinematicaDeCasio("Ana");
    cierto(c.tomas.length === 4 && c.tomas.every((t) => t.ms >= 4000 && !/\{n\}|undefined/.test(t.texto)) && c.tomas[0].actores[0].quien === "criatura", "la escena de Casio (la criatura «centinela»)");
});

prueba("El Centinela (pantallas): portada con prólogo e índice, capítulo con moraleja, navegación y final; está en Historia y suena Lectura", () => {
    const estado = partidaNueva();
    estado.personaje.nombre = "Ana <b>";
    let html = vistas.pantallaNovela(estado, { capituloNovela: null });
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    cierto(html.includes("El Centinela") && html.includes("Prólogo") && html.includes("Empezar a leer") && html.includes("Libro primero · La orilla") && html.includes("Libro tercero · La guardia"), "portada: título, prólogo, empezar e índice por libros");
    igual(html.split('data-accion="novela-capitulo"').length - 1, 18 + 1, "18 capítulos abiertos en el índice + el botón de empezar");
    cierto(html.includes("disabled") && html.includes("liberes a Casio"), "los últimos, cerrados con su motivo");
    html = vistas.pantallaNovela(estado, { capituloNovela: 0 });
    cierto(html.includes("Capítulo I de 24") && html.includes("El hijo del barquero") && html.includes("Lo que aprendió Casio") && html.includes("novela-texto"), "un capítulo con su moraleja");
    cierto(html.includes('data-accion="novela-indice"') && /data-i="1"[^>]*>Siguiente/.test(html) && /data-i="-1"[^>]*disabled/.test(html), "navegación: sin «anterior» en el primero");
    html = vistas.pantallaNovela(estado, { capituloNovela: 18 });
    cierto(!html.includes("Capítulo XIX de"), "un capítulo cerrado no se puede abrir: vuelve a la portada");
    estado.arcade.records.torre = 20;
    html = vistas.pantallaNovela(estado, { capituloNovela: 23 });
    cierto(html.includes("Epílogo") && html.includes("Lo que enseña este libro") && html.includes("Aurelio, que fue su aprendiz") && html.includes("Ana &lt;b&gt;") && html.includes('data-accion="novela-terminar"'), "el último: epílogo, enseñanzas, nombre escapado y «Terminé el libro»");
    cierto(/data-i="24"[^>]*disabled/.test(html) && html.includes(">Fin</button>"), "no hay capítulo siguiente");
    estado.libros.casio.leidos = 24;
    estado.libros.casio.fin = hoy();
    html = vistas.pantallaNovela(estado, { capituloNovela: 23 });
    cierto(html.includes('data-accion="novela-escena"') && !html.includes('data-accion="novela-terminar"') && html.includes("Terminaste este libro"), "ya terminado: ver la escena otra vez");
    html = vistas.pantallaNovela(estado, { capituloNovela: null });
    cierto(html.includes("24 de 24") && html.includes("Continuar: capítulo"), "la portada dice dónde seguir");
    // En Héroe › Historia.
    const info = juego.resumen(estado, hoy());
    const historia = vistas.pantallaPersonaje(estado, {
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista: { personaje: "historia" }, campanaVista: null, diarioVista: {},
    });
    cierto(historia.includes('data-accion="novela-abrir"') && historia.includes("El Centinela") && historia.includes("24 de 24 capítulos"), "aparece en Historia");
    igual(musicaModulo.pistaDeEscena({ pantalla: "novela", elegida: "epica", auto: true }), "lectura", "suena la música de lectura");
});

// ===== Habilidades a la vista (v63) =====

prueba("Habilidades visibles: cada golpe dice qué habilidades y dones se notaron (impetu, embestida, aurora, firme, bastión…)", () => {
    const hero = (p) => p.heroe;
    // Ímpetu: el primer golpe de cada piso; el segundo ya no.
    let p = torreCon(["impetu"], 3, null, 21);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    let ev = torre.actuar(p, "atacar");
    cierto(ev.find((e) => e.quien === "heroe").activas.includes("impetu"), "ímpetu en el primer golpe");
    ev = torre.actuar(p, "atacar");
    cierto(!(ev.find((e) => e.quien === "heroe").activas || []).includes("impetu"), "pero no en el segundo");
    // Embestida: el golpe va dos veces.
    p = torreCon(["embestida"], 3, null, 22);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    cierto(torre.actuar(p, "atacar").find((e) => e.quien === "heroe").activas.includes("embestida"), "embestida");
    // Aurora: el primer hechizo de cada piso no gasta PM.
    p = torreCon(["aurora"], 3, null, 23);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    cierto(torre.actuar(p, "hechizo", "fuego").find((e) => e.quien === "heroe").activas.includes("aurora"), "aurora");
    // Llama del Vigía: el fuego.
    p = torreCon(["llama"], 3, null, 24);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    cierto(torre.actuar(p, "hechizo", "fuego").find((e) => e.quien === "heroe").activas.includes("llama"), "llama con el fuego");
    p = torreCon(["llama"], 3, null, 24);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    cierto(!(torre.actuar(p, "hechizo", "hielo").find((e) => e.quien === "heroe").activas || []).includes("llama"), "pero no con el hielo");
    // Defender: bastión y muralla.
    p = torreCon(["bastion", "muralla"], 3, null, 25);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    igual(torre.actuar(p, "defender").find((e) => e.quien === "heroe").activas, ["bastion", "muralla"], "al defenderte");
    // Juramento contra un guardián.
    p = torreCon(["juramento"], 5, null, 26);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    cierto(p.enemigo.guardian && torre.actuar(p, "atacar").find((e) => e.quien === "heroe").activas.includes("juramento"), "juramento contra un guardián");
    // Firme: el primer golpe que recibes (se ve en el evento de la criatura).
    p = torreCon(["firme"], 3, null, 27);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    p.enemigo.intencion = "golpe";
    ev = torre.actuar(p, "defender");
    const suyo = ev.find((e) => e.quien === "enemigo");
    cierto(suyo.dano === 0 && suyo.activas.includes("firme"), "firme: el primer golpe no duele y se ve");
    // Sin habilidades, sin etiquetas.
    p = torreCon([], 3, null, 28);
    p.enemigo.vida = p.enemigo.vidaMax = 9999;
    cierto(!torre.actuar(p, "defender").some((e) => e.activas), "sin habilidades no hay etiquetas");
    hero(p);
});

prueba("Habilidades visibles (pantalla): etiquetas doradas sobre tu héroe, panel con todo lo que sabes y un efecto por técnica", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 11);
    const p = estado.arcade.torre;
    p.heroe.habilidades = ["impetu", "firme", "bastion"];
    p.heroe.dones = ["eco"];
    p.heroe.tecnicas = ["quebrar", "analizar"];
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (cambios = {}) => ({ partida: p, nombre: "Ana", sprites: imagenes, eventos: [], menu: "principal", ultimo: "atacar",
                                   bestiario: estado.arcade.bestiario, resultado: null, fichas: 2, ...cambios });
    const ev = (quien, tipo, extra = {}) => ({ quien, tipo, ...extra });
    let html = vistas.pantallaTorre(t({ eventos: [ev("heroe", "atacar", { dano: 12, critico: true, activas: ["impetu", "embestida"] }),
                                                  ev("enemigo", "golpe", { dano: 0, nombre: "Mordisco", activas: ["firme"] })] }));
    cierto(!/undefined|NaN|\[object/.test(html), "sin huecos");
    cierto(html.includes('class="ff-habs"') && html.includes("💨 Ímpetu") && html.includes("⚡ Embestida") && html.includes("🪨 Firme"), "las tres etiquetas con su nombre");
    cierto(html.includes("ff-hab-fila") && html.includes("Eco arcano") && html.includes("Quebrar") && html.includes("<em>don</em>") && html.includes("<em>técnica</em>") && html.includes("<em>pasiva</em>"),
           "el panel: pasivas, dones y técnicas");
    cierto(html.includes("🎖️ Habilidades y técnicas") && html.includes("(6)"), "con su cuenta");
    // En el turno jugado, junto a tu acción van sus iconos.
    cierto(/Tú[\s\S]*?Ataque[\s\S]*?💨⚡/.test(html), "los iconos junto a tu acción");
    // Sin habilidades ni técnicas, no hay panel.
    p.heroe.habilidades = [];
    p.heroe.dones = [];
    p.heroe.tecnicas = [];
    cierto(!vistas.pantallaTorre(t()).includes("ff-habilidades"), "sin nada que mostrar, sin panel");
    // Un efecto para cada técnica, incluso las que no hacen daño.
    for (const tecnica of ["quebrar", "analizar", "intimidar", "certero"]) {
        html = vistas.pantallaTorre(t({ eventos: [ev("heroe", "tecnica", { tecnica, nombre: tecnica, dano: tecnica === "quebrar" || tecnica === "certero" ? 9 : 0 })] }));
        cierto(html.includes(`ff-efecto ff-${tecnica}`), `efecto de ${tecnica}`);
    }
    cierto(sonidoModulo.existeSonido("habilidad"), "suena un destello");
});

// ===== Las Minas de la Codicia y el Laberinto de los Ecos (v64) =====

prueba("Mazmorras nuevas: cuatro lugares, 15 criaturas en cada una (3 zonas de 5 con su guardián), todas con su dibujo y su historia", () => {
    igual(Object.keys(bestiario.LUGARES), ["torre", "mazmorra", "minas", "laberinto"]);
    for (const id of ["minas", "laberinto"]) {
        const lugar = bestiario.LUGARES[id];
        igual([lugar.zonas.length, lugar.orden.length], [3, 15], `${id}: 3 zonas y 15 criaturas`);
        lugar.orden.forEach((c, i) => {
            const criatura = bestiario.CRIATURAS[c];
            igual(Boolean(criatura.guardian), (i + 1) % 5 === 0, `${c}: el guardián es el quinto de cada zona`);
            cierto(criatura.nombre && criatura.golpe && criatura.fuerte && criatura.texto.length > 30 && criatura.talla >= 70, `${c}: tiene todo sus datos`);
            cierto(["fuego", "hielo", "rayo"].includes(criatura.debil) && criatura.debil !== criatura.resiste, `${c}: su punto débil`);
            if (criatura.especial) cierto(torre.ESPECIALES[criatura.especial.tipo], `${c}: su especial existe`);
            cierto(CON_DIBUJO.includes(c), `${c}: tiene dibujo`);
            cierto(sonidoModulo.FAMILIA_DE_CRIATURA[c], `${c}: voz`);
        });
        igual(bestiario.lugarDeCriatura(lugar.orden[0]), id, "se sabe en qué lugar vive cada una");
        const leyenda = leyendas.LEYENDAS[id];
        cierto(leyenda.prologo.parrafos.length === 3 && leyenda.epilogo.parrafos.length === 2 && leyenda.epilogo.aviso, `${id}: prólogo y epílogo`);
        for (const zona of lugar.zonas) {
            cierto(leyenda.zonas[zona.id].entrada.length > 80 && leyenda.zonas[zona.id].caida.length > 80, `${zona.id}: historia`);
        }
        cierto(!/undefined|NaN|\[object/.test(JSON.stringify(leyenda)), `${id}: la historia sin huecos`);
        const capitulos = leyendas.capitulosDeLeyenda(id, 15, "Ana");
        igual(capitulos.map((c) => c.id), ["prologo", ...lugar.zonas.map((z) => z.id), "epilogo"], `${id}: se lee entera`);
        cierto(capitulos.every((c) => c.abierto) && !capitulos.some((c) => c.parrafos.some((p) => p.includes("{n}"))), `${id}: abierta y con tu nombre`);
    }
    // Las salas y los dibujos se pueden pintar.
    for (const zona of [...bestiario.LUGARES.minas.zonas, ...bestiario.LUGARES.laberinto.zonas]) {
        cierto(dibujarSala(zona.id).includes("<svg"), `sala ${zona.id}`);
    }
});

prueba("Mazmorras nuevas: se abren en cadena (Torre 20 → Mazmorra, Mazmorra 10 → Minas, Minas 10 → Laberinto) y se pagan en su atributo", () => {
    const arcadeCon = (records, extra = {}) => ({ records, ...extra });
    igual(["torre", "mazmorra", "minas", "laberinto"].map((l) => torre.lugarAbierto(arcadeCon({}), l)), [true, false, false, false]);
    igual(["mazmorra", "minas", "laberinto"].map((l) => torre.lugarAbierto(arcadeCon({ torre: 20 }), l)), [true, false, false]);
    igual(["minas", "laberinto"].map((l) => torre.lugarAbierto(arcadeCon({ torre: 20, mazmorra: 9 }), l)), [false, false]);
    igual(["minas", "laberinto"].map((l) => torre.lugarAbierto(arcadeCon({ torre: 20, mazmorra: 10 }), l)), [true, false]);
    igual(torre.lugarAbierto(arcadeCon({ torre: 20, mazmorra: 10, minas: 10 }), "laberinto"), true);
    igual(torre.lugarAbierto(arcadeCon({}), "inventada"), false);
    // La partida de ahora también cuenta.
    const enCurso = torre.nuevaPartida(NIVELES_1, 3, 1, {}, "mazmorra");
    enCurso.piso = 11;
    igual(torre.lugarAbierto(arcadeCon({ torre: 20 }, { mazmorra: enCurso }), "minas"), true, "bajaste 10 sótanos en esta partida");
    // Atributos y premios.
    igual([torre.REGLAS.minas.atributo, torre.REGLAS.laberinto.atributo], ["riqueza", "intelecto"]);
    igual(torre.premio(100, "minas"), { gemas: 90, xp: 70 }, "el tope de las minas");
    igual(torre.premio(3, "laberinto"), { gemas: 21, xp: 15 }, "tres cámaras en el laberinto");
    // Las criaturas de cada lugar: el piso 1 es el primero de su lista y el 15 es el guardián de la última zona.
    for (const id of ["minas", "laberinto"]) {
        const lugar = bestiario.LUGARES[id];
        igual(torre.monstruoDelPiso(1, id).id, lugar.orden[0]);
        const ultimo = torre.monstruoDelPiso(15, id);
        igual([ultimo.id, ultimo.guardian], [lugar.orden[14], true]);
        cierto(ultimo.vidaMax > torre.monstruoDelPiso(14, id).vidaMax && ultimo.ataque > torre.monstruoDelPiso(14, id).ataque, `${id}: el guardián final es lo más duro`);
        const vuelta = torre.monstruoDelPiso(16, id);
        igual([vuelta.id, vuelta.vuelta, vuelta.nombre.endsWith(lugar.vuelta)], [lugar.orden[0], 1, true], `${id}: al dar la vuelta vuelven más fuertes (${lugar.vuelta})`);
    }
    // Lo de siempre no cambió: la fórmula de la Torre y de la Mazmorra sigue igual.
    igual([torre.monstruoDelPiso(7).vidaMax, torre.monstruoDelPiso(7).ataque], [114, 15], "Torre, piso 7");
    igual([torre.monstruoDelPiso(3, "mazmorra").vidaMax, torre.monstruoDelPiso(3, "mazmorra").ataque], [188, 23], "Mazmorra, sótano 3");
});

prueba("Mazmorras nuevas: se pueden jugar enteras (empezar, pelear, subir de piso, cobrar) y guardan su récord", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.empezarTorre(estado, 5, "minas"), "Minas de la Codicia: Baja 10 sótanos en la Mazmorra del Abismo: en el décimo hay una grieta con un brillo dorado.");
    estado.arcade.records.torre = 20;
    estado.arcade.records.mazmorra = 10;
    const antes = arcade.fichasDisponibles(estado);
    const r = acciones.empezarTorre(estado, 5, "minas");
    cierto(r.relato && r.relato.lugar === "minas", "al empezar se cuenta la historia");
    igual(arcade.fichasDisponibles(estado), antes - 1, "gasta una ficha");
    const p = estado.arcade.minas;
    igual([p.lugar, p.piso, p.enemigo.id], ["minas", 1, "mi-murcielago"]);
    cierto(p.registro.startsWith("Nivel 1.") && p.registro.includes("el descenso"), "el registro habla de niveles");
    // Se pelea y se sube de nivel con las mismas reglas.
    p.heroe.ataque = 9999;
    const ev = acciones.accionTorre(estado, "atacar", null, "minas").eventos;
    cierto(ev.some((e) => e.tipo === "derrotado") && p.fase === "mejora", "cae y toca elegir mejora");
    acciones.mejoraTorre(estado, p.opciones[0], "minas");
    igual(p.piso, 2, "sube de nivel (cura 5 % al subir, como dice su regla)");
    p.fase = "batalla";
    // Cobrar: premio de Riqueza y récord solo de las minas.
    const xp = estado.atributos.riqueza;
    const cobro = acciones.terminarTorre(estado, "minas");
    igual([cobro.lugar, cobro.pisos, cobro.atributo, estado.arcade.records.minas], ["minas", 1, "riqueza", 1]);
    cierto(estado.atributos.riqueza > xp, "sube Riqueza");
    igual(estado.arcade.minas, null, "la partida termina");
    igual(estado.arcade.records.mazmorra, 10, "el récord de la Mazmorra no cambia");
    // Al llegar a 10 niveles en las minas se abre el laberinto (con su aviso).
    estado.arcade.minas = torre.nuevaPartida(NIVELES_1, 7, 1, {}, "minas");
    estado.arcade.minas.piso = 11;
    const fin = acciones.terminarTorre(estado, "minas");
    cierto(fin.celebraciones.some((c) => c.titulo === "Laberinto de los Ecos" && c.etiqueta.includes("mazmorra")), "se abre el laberinto");
    igual(torre.lugarAbierto({ records: estado.arcade.records }, "laberinto"), true);
    // Y el laberinto también se juega.
    acciones.empezarTorre(estado, 9, "laberinto");
    igual([estado.arcade.laberinto.lugar, estado.arcade.laberinto.enemigo.id], ["laberinto", "la-espejo"]);
    // La copia de seguridad conserva las partidas de las mazmorras nuevas.
    const copia = datos.desdeRespaldo(JSON.stringify(estado));
    igual([copia.arcade.laberinto.lugar, copia.arcade.minas], ["laberinto", null]);
    igual(datos.desdeRespaldo(JSON.stringify({ version: 1, personaje: { nombre: "Vieja", xp: 0, monedas: 0, creadoEn: hoy() }, misiones: [] })).arcade.minas, null, "una copia vieja");
});

prueba("Mazmorras nuevas (pantallas): tarjetas en el Arcade (cerradas con lo que falta, abiertas con récord y botón), bestiario completo y cinemáticas", () => {
    const estado = partidaNueva();
    const info = juego.resumen(estado, hoy());
    const ctx = () => ({
        hoy: hoy(), fechaVista: hoy(), ahora: Date.now(), info, avatar: avatar.describirAvatar(estado, hoy(), info),
        vida: vida.calcularVida(estado, hoy()), maestro: maestro.contexto(estado, hoy(), Date.now()), evento: null,
        rangoResumen: 7, subvista: {}, campanaVista: null, diarioVista: {},
    });
    const sano = (html, que) => cierto(!/undefined|NaN|\[object/.test(html), `${que} no tiene huecos`);
    let html = vistas.pantallaArcade(estado, ctx());
    sano(html, "el arcade cerrado");
    igual(html.split("mazmorra-cerrada").length - 1, 3, "las tres mazmorras cerradas");
    cierto(html.includes("Minas de la Codicia") && html.includes("Laberinto de los Ecos") && html.includes("Baja 10 sótanos") && html.includes("Baja 10 niveles"), "dicen qué falta");
    estado.arcade.records = { torre: 20, mazmorra: 12, minas: 11 };
    html = vistas.pantallaArcade(estado, ctx());
    sano(html, "el arcade abierto");
    igual(html.split("mazmorra-cerrada").length - 1, 0, "todas abiertas");
    for (const lugar of ["mazmorra", "minas", "laberinto"]) {
        cierto(html.includes(`data-accion="torre-abrir" data-lugar="${lugar}"`) && html.includes(`data-accion="historia-abrir" data-lugar="${lugar}"`), `${lugar}: entrar e historia`);
    }
    cierto(html.includes("Bajar a las minas") && html.includes("Entrar al laberinto") && html.includes("Récord: 11 niveles superados") && html.includes('data-sala="ecos"'), "textos propios, récord y portada");
    cierto(html.includes('name="marca-minas"') && html.includes('name="marca-laberinto"') && !html.includes("Ayuno"), "marcas para cada una (sin «Ayuno», que es de la Torre)");
    // El bestiario muestra los lugares abiertos y los cerrados con su motivo.
    const imagenes = Object.fromEntries(Object.values(bestiario.LUGARES).flatMap((l) => l.orden).map((id) => [id, "data:image/png;base64,AA"]));
    html = vistas.pantallaBestiario({ bestiario: {}, sprites: imagenes, abiertos: ["torre", "mazmorra", "minas"] });
    sano(html, "el bestiario");
    cierto(html.includes("Minas de la Codicia") && html.includes("Galerías olvidadas") && html.includes("🔒 Laberinto de los Ecos") && html.includes("0 de 80") === false, "minas abiertas y laberinto cerrado");
    cierto(html.includes("0 de 65"), "65 criaturas visibles");
    // La batalla se dibuja con el nombre y la sala de cada lugar.
    acciones.empezarTorre(estado, 4, "laberinto");
    const imgs = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    html = vistas.pantallaTorre({ partida: estado.arcade.laberinto, nombre: "Ana", sprites: imgs, eventos: [], menu: "principal", ultimo: "atacar",
                                  bestiario: estado.arcade.bestiario, resultado: null, fichas: 2 });
    sano(html, "la batalla del laberinto");
    cierto(html.includes("Cámara 1") && html.includes("Pasillos de espejos") && html.includes("Espejo errante"), "su cámara, su zona y su criatura");
    // Las cinemáticas de cada zona y el final.
    for (const [lugar, ultimo] of [["minas", "mi-rey"], ["laberinto", "la-silencio"]]) {
        const partida = { lugar, piso: 15, enemigo: { id: ultimo } };
        const final = cinematicasModulo.cinematicaDe("final", partida, "Ana");
        cierto(final && final.tomas.length === 4 && final.tomas.every((t) => t.texto && !/\{n\}|undefined/.test(t.texto + t.titulo)), `${lugar}: el final`);
        for (const tipo of ["entrada", "derrota", "zona"]) {
            const c = cinematicasModulo.cinematicaDe(tipo, { lugar, piso: tipo === "zona" ? 6 : 5, enemigo: { id: bestiario.LUGARES[lugar].orden[tipo === "zona" ? 5 : 4] } }, "Ana");
            cierto(c && c.tomas.every((t) => t.texto || t.titulo) && !/undefined/.test(JSON.stringify(c)), `${lugar}: ${tipo}`);
        }
    }
    // Suena a lo suyo.
    igual([musicaModulo.pistaDeEscena({ pantalla: "arcade", torre: "minas" }), musicaModulo.pistaDeEscena({ pantalla: "arcade", torre: "laberinto" })], ["batalla", "misterio"]);
});

// ===== Modos de juego (v65) =====

prueba("Modos: el Asalto de guardianes empieza en el 5.º piso, sube de guardián en guardián y paga un 20 % menos", () => {
    const p = torre.nuevaPartida(NIVELES_1, 4, 1, {}, "torre", null, "asalto");
    igual([torre.modoDe(p), p.piso, p.enemigo.guardian], ["asalto", 5, true], "el primer combate es contra un guardián");
    igual(torre.pisosSuperados(p), 0, "todavía no venciste a ninguno");
    p.enemigo.vida = 1;
    torre.actuar(p, "atacar");
    igual(p.fase, "mejora", "al vencerlo eliges una mejora");
    torre.elegirMejora(p, p.opciones[0]);
    igual([p.piso, p.enemigo.guardian], [10, true], "salta al siguiente guardián");
    igual(torre.pisosSuperados(p), 5);
    cierto(torre.premio(10, "torre", null, "asalto").gemas < torre.premio(10).gemas, "premio ×0,8");
    igual(torre.modoDe({}), "normal", "sin modo es normal");
});

prueba("Modos: el Asalto pide haber superado el piso 5 y tiene su propio récord", () => {
    const estado = partidaNueva();
    debeFallar(() => acciones.empezarTorre(estado, 5, "torre", null, "asalto"), "Asalto");
    igual(arcade.fichasDisponibles(estado) >= 1, true, "no se gastó la ficha");
    estado.arcade.records.torre = 5;
    acciones.empezarTorre(estado, 5, "torre", null, "asalto");
    const p = estado.arcade.torre;
    p.piso = 15; p.heroe.vida = 1; p.enemigo.intencion = "golpe";
    acciones.accionTorre(estado, "atacar");
    igual(p.fase, "fin");
    const r = acciones.terminarTorre(estado);
    igual(r.modo, "asalto");
    igual(estado.arcade.records["asalto-torre"], 2, "10 pisos = 2 guardianes");
    igual(estado.arcade.records.torre, 5, "el récord normal no cambia");
});

prueba("Modos: el Reto diario usa la misma marca y semilla todo el día y da el extra una sola vez", () => {
    const f = "2026-10-15";
    igual(torre.semillaDeLaDiaria(f), torre.semillaDeLaDiaria(f), "misma semilla");
    cierto(torre.semillaDeLaDiaria(f) !== torre.semillaDeLaDiaria("2026-10-16"), "otro día, otro azar");
    cierto(torre.MARCAS[torre.marcaDeLaDiaria(f)], "la marca existe");
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 99, "torre", null, "diaria");
    const p = estado.arcade.torre;
    igual([torre.modoDe(p), p.marca], ["diaria", torre.marcaDeLaDiaria(hoy())], "la marca es la del día, no la que se pidió");
    p.piso = 9; p.heroe.vida = 1; p.enemigo.intencion = "golpe";
    acciones.accionTorre(estado, "atacar");
    const r = acciones.terminarTorre(estado);
    igual(r.bonus, torre.MODOS.diaria.bonus, "8 pisos o más: bono");
    igual(estado.arcade.diaria.cobrado, true);
    estado.arcade.usadas = 0;
    acciones.empezarTorre(estado, 99, "torre", null, "diaria");
    const q = estado.arcade.torre;
    q.piso = 9; q.heroe.vida = 1; q.enemigo.intencion = "golpe";
    acciones.accionTorre(estado, "atacar");
    igual(acciones.terminarTorre(estado).bonus, null, "el segundo intento del día ya no da bono");
});

// ===== El Gimnasio (v66) =====

// Un entrenamiento completo: todas las series hechas, con el peso y las repeticiones dados.
function entrenar(estado, rutinaId, kg = 40, reps = 10, fecha = hoy()) {
    acciones.empezarGym(estado, rutinaId, fecha);
    const en = estado.gym.encurso;
    en.ejercicios.forEach((ej, ei) => ej.series.forEach((_, si) => {
        acciones.anotarSerieGym(estado, ei, si, "kg", kg);
        acciones.anotarSerieGym(estado, ei, si, "reps", reps);
        acciones.marcarSerieGym(estado, ei, si);
    }));
    return acciones.terminarGym(estado);
}

prueba("Gym: tu rutina tiene 7 entrenamientos y 24 ejercicios, cada uno con músculo y rango de repeticiones", () => {
    igual(gym.RUTINA.map((r) => r.id), ["pecho-triceps", "hombros", "isquios", "espalda", "biceps", "cuadriceps", "pantorrillas"]);
    const ejercicios = gym.RUTINA.flatMap((r) => r.ejercicios);
    igual(ejercicios.length, 24);
    igual(new Set(ejercicios.map((x) => x.id)).size, 24, "ids únicos");
    for (const x of ejercicios) {
        cierto(gym.MUSCULOS[x.musculo], `${x.id} tiene músculo`);
        cierto(x.min < x.max && x.series >= 3, `${x.id}: series y repeticiones`);
    }
    igual(gym.seriesPlaneadas(gym.rutinaPorId("pecho-triceps")), 19, "4+3+3 de pecho y 3+3+3 de tríceps");
    igual(gym.ejercicioPorId("press-banca"), { id: "press-banca", nombre: "Press de banca plano", musculo: "pecho", series: 4, min: 6, max: 10 });
});

prueba("Gym: el peso estimado de una repetición y la sugerencia para superarte", () => {
    igual(gym.unaRepeticion(60, 10), 80, "Epley: 60 × (1 + 10/30)");
    igual(gym.unaRepeticion(0, 12), 0);
    igual(gym.puntajeDe(0, 12), 12, "sin peso cuentan las repeticiones");
    const ej = gym.ejercicioPorId("press-banca");
    igual(gym.sugerencia(ej, null).tipo, "nuevo");
    const mal = { fecha: "2026-01-01", series: [{ kg: 40, reps: 8 }, { kg: 40, reps: 7 }, { kg: 40, reps: 6 }, { kg: 40, reps: 6 }] };
    igual(gym.sugerencia(ej, mal).tipo, "reps");
    const tope = { fecha: "2026-01-01", series: [1, 2, 3, 4].map(() => ({ kg: 40, reps: 10 })) };
    const s = gym.sugerencia(ej, tope);
    igual([s.tipo, s.kg], ["peso", 42.5], "al llegar al tope en todas las series, sube peso");
});

prueba("Gym: un entrenamiento da XP de Fuerza, monedas y el primer hito; sube músculos y nivel", () => {
    const estado = partidaNueva();
    const r = entrenar(estado, "hombros");   // 10 series
    igual(r.sesion.xp, 10 * gym.XP_POR_SERIE + gym.XP_SESION_COMPLETA, "series + sesión completa");
    igual(estado.atributos.fuerza, r.sesion.xp, "el XP va a Fuerza");
    igual(estado.personaje.xp, r.sesion.xp);
    igual(estado.personaje.monedas, gym.MONEDAS_SESION);
    igual(estado.gym.encurso, null);
    cierto(estado.gym.hitos.includes("primera"), "primer hito cobrado");
    igual(estado.personaje.gemas, 10, "+10 💎 del hito «Primera sesión»");
    cierto(r.celebraciones.some((c) => c.etiqueta === "¡Hito de gym!"), "se celebra");
    const hombros = gym.nivelesDeMusculos(estado.gym.sesiones).hombros;
    igual([hombros.nivel, hombros.xpEnNivel], [1, 40], "10 series = 40 XP de hombros (el nivel 2 pide 50)");
    igual(gym.nivelDeGym(estado.gym.sesiones).nivel, 1, "60 XP de gym: el nivel 2 pide 100");
});

prueba("Gym: solo una vez por rutina y día, y solo hoy o ayer; no se puede cambiar de rutina a medias", () => {
    const estado = partidaNueva();
    entrenar(estado, "espalda");
    debeFallar(() => acciones.empezarGym(estado, "espalda"), "ya la hiciste");
    acciones.empezarGym(estado, "biceps");
    debeFallar(() => acciones.empezarGym(estado, "hombros"), "en curso");
    acciones.empezarGym(estado, "biceps");   // la misma: sigue
    acciones.cancelarGym(estado);
    debeFallar(() => acciones.empezarGym(estado, "biceps", sumarDias(hoy(), -5)), "hoy o de ayer");
    debeFallar(() => acciones.empezarGym(estado, "no-existe"), "no existe");
    acciones.empezarGym(estado, "biceps", sumarDias(hoy(), -1));
    igual(estado.gym.encurso.fecha, sumarDias(hoy(), -1), "se puede anotar el de ayer");
});

prueba("Gym: valida lo que anotas y no deja terminar sin series hechas", () => {
    const estado = partidaNueva();
    acciones.empezarGym(estado, "pantorrillas");
    debeFallar(() => acciones.terminarGym(estado), "al menos una serie");
    debeFallar(() => acciones.anotarSerieGym(estado, 0, 0, "kg", -5), "peso");
    debeFallar(() => acciones.anotarSerieGym(estado, 0, 0, "reps", 500), "repeticiones");
    debeFallar(() => acciones.anotarSerieGym(estado, 9, 0, "kg", 5), "serie");
    acciones.anotarSerieGym(estado, 0, 0, "kg", "12,5");
    igual(estado.gym.encurso.ejercicios[0].series[0].kg, 12.5, "acepta coma decimal");
    acciones.cambiarSeriesGym(estado, 0, 1);
    igual(estado.gym.encurso.ejercicios[0].series.length, 5, "una serie extra");
    for (let i = 0; i < 10; i++) { try { acciones.cambiarSeriesGym(estado, 0, 1); } catch (e) { /* tope */ } }
    igual(estado.gym.encurso.ejercicios[0].series.length, gym.MAX_SERIES, "máximo de series");
});

prueba("Gym: superar tu marca es un récord (+XP); la primera vez no lo es; borrar la sesión devuelve todo", () => {
    const estado = partidaNueva();
    entrenar(estado, "biceps", 20, 10, sumarDias(hoy(), -1));
    igual(estado.gym.sesiones[0].records, [], "la primera vez no hay con qué comparar");
    const r = entrenar(estado, "biceps", 25, 10);
    igual(r.sesion.records.length, 3, "los 3 ejercicios con más peso");
    igual(r.sesion.xp, 9 * gym.XP_POR_SERIE + gym.XP_SESION_COMPLETA + 3 * gym.XP_RECORD);
    cierto(estado.gym.hitos.includes("primer-record"));
    igual(gym.mejoresDe(estado.gym.sesiones)["curl-barra"].kg, 25);
    const xpAntes = estado.atributos.fuerza;
    acciones.borrarSesionGym(estado, 1);
    igual(estado.atributos.fuerza, xpAntes - r.sesion.xp, "se quita el XP");
    igual(estado.gym.sesiones.length, 1);
    igual(gym.mejoresDe(estado.gym.sesiones)["curl-barra"].kg, 20, "el récord vuelve al anterior");
});

prueba("Gym: la rutina que toca es la siguiente a la última; la racha cuenta semanas que cumplen la meta", () => {
    igual(gym.siguienteRutina([]).id, "pecho-triceps");
    igual(gym.siguienteRutina([{ rutina: "pecho-triceps" }]).id, "hombros");
    igual(gym.siguienteRutina([{ rutina: "pantorrillas" }]).id, "pecho-triceps", "da la vuelta");
    const lunes = lunesDe(hoy());
    const s = (fecha) => ({ fecha, rutina: "hombros", ejercicios: [], xp: 0, records: [] });
    const semana = (desde, dias) => Array.from({ length: dias }, (_, i) => s(sumarDias(desde, i)));
    const sesiones = [...semana(sumarDias(lunes, -14), 3), ...semana(sumarDias(lunes, -7), 3)];
    igual(gym.rachaSemanal(sesiones, 3, hoy()), 2, "dos semanas pasadas con 3 días; la actual aún no rompe");
    igual(gym.rachaSemanal(sesiones, 4, hoy()), 0, "con meta 4 ninguna cumple");
    igual(gym.diasDeLaSemana([s(lunes), s(lunes)], lunes), 1, "dos sesiones el mismo día cuentan un día");
    igual(gym.diasDesde([{ rutina: "hombros", fecha: sumarDias(hoy(), -4) }], "hombros", hoy()), 4);
});

prueba("Gym: el nivel de gym da hasta +25 % de vida y ataque en la Torre, y engorda al avatar", () => {
    igual(gym.bonoDeGym(1), 0);
    igual(gym.bonoDeGym(11), 0.1);
    igual(gym.bonoDeGym(99), gym.MAX_BONO, "tope");
    igual([gym.fisicoDe(1), gym.fisicoDe(3), gym.fisicoDe(8), gym.fisicoDe(15)], [0, 1, 2, 3]);
    const base = { fuerza: 5, intelecto: 1, carisma: 1, riqueza: 1 };
    const sin = torre.heroeDeLaTorre(base);
    const con = torre.heroeDeLaTorre({ ...base, gym: 11 });
    igual(con.vidaMax, Math.round(sin.vidaMax * 1.1), "+10 % de vida");
    igual(con.ataque, Math.round((6 + 2 * 5) * 1.1), "+10 % de ataque");
    igual(torre.heroeDeLaTorre({ ...base, gym: 1 }).ataque, sin.ataque, "nivel 1: sin cambio");
    const d0 = avatarDePrueba({ etapa: avatar.ETAPAS[2], fisico: 0 });
    const d3 = avatarDePrueba({ etapa: avatar.ETAPAS[2], fisico: 3 });
    cierto(dibujarAvatar(d3, { sinEfectos: true }).startsWith("<svg"), "el avatar fornido es un SVG");
    cierto(dibujarAvatar(d0, { sinEfectos: true }) !== dibujarAvatar(d3, { sinEfectos: true }), "se nota el físico");
});

prueba("Gym: una partida guardada sin gimnasio lo recibe vacío, y las sesiones viajan en la copia", () => {
    const estado = partidaNueva();
    const viejo = JSON.parse(JSON.stringify(estado));
    delete viejo.gym;
    const cargado = datos.desdeRespaldo(JSON.stringify(viejo));
    igual(cargado.gym, gym.gymInicial());
    entrenar(estado, "hombros");
    const copia = datos.desdeRespaldo(datos.textoRespaldo(estado));
    igual(copia.gym.sesiones.length, 1, "las sesiones viajan en la copia de seguridad");
    igual(copia.gym.metaSemanal, 4);
});

prueba("Gym: las pantallas se dibujan (la fila de Hoy, la elección, el entrenamiento y los resultados)", () => {
    const estado = partidaNueva();
    const ctx = { hoy: hoy(), ahora: Date.now(), avatar: avatarDePrueba({ etapa: avatar.ETAPAS[1] }), descanso: null };
    cierto(vistasGym.tarjetaGymHoy(estado, ctx).includes("hoy toca Pecho + Tríceps"));
    let html = vistasGym.pantallaGym(estado, ctx);
    cierto(html.includes('data-accion="gym-empezar"') && html.includes("Tus músculos"), "elección");
    acciones.empezarGym(estado, "pecho-triceps");
    html = vistasGym.pantallaGym(estado, { ...ctx, descanso: { fin: Date.now() + 60000, total: 60000 } });
    cierto(html.includes('data-gym="kg"') && html.includes("data-descanso-fin") && html.includes("Press de banca plano"), "entrenamiento");
    cierto(vistasGym.tarjetaGymHoy(estado, ctx).includes("Entrenando"));
    acciones.marcarSerieGym(estado, 0, 0);
    acciones.terminarGym(estado);
    html = vistasGym.pantallaGym(estado, ctx);
    cierto(html.includes("Récords personales") && html.includes("Últimas sesiones") && html.includes("Hitos de gym"), "resultados");
    cierto(html.includes("Tu constancia") && (html.match(/gym-cuadro n/g) || []).length === 84, "el calendario de 12 semanas tiene 84 cuadritos");
    cierto(vistasGym.tarjetaGymHoy(estado, ctx).includes("Hoy entrenaste"));
});

prueba("Gym: la gráfica de cada ejercicio y el peso corporal", () => {
    const estado = partidaNueva();
    entrenar(estado, "biceps", 20, 10, sumarDias(hoy(), -1));
    entrenar(estado, "biceps", 25, 10);
    const h = gym.historialDe(estado.gym.sesiones, "curl-barra");
    igual(h.map((x) => x.puntaje), [gym.unaRepeticion(20, 10), gym.unaRepeticion(25, 10)], "un punto por sesión, con su mejor serie");
    igual(gym.historialDe(estado.gym.sesiones, "press-banca"), [], "sin datos de lo que no has hecho");
    debeFallar(() => acciones.anotarPesoGym(estado, 5), "peso");
    acciones.anotarPesoGym(estado, "78,4");
    acciones.anotarPesoGym(estado, 78.1);
    igual(estado.gym.peso, [{ fecha: hoy(), kg: 78.1 }], "uno por día: el segundo cambia el primero");
    const ctx = { hoy: hoy(), ahora: Date.now(), avatar: avatarDePrueba({ etapa: avatar.ETAPAS[1] }), descanso: null };
    const html = vistasGym.pantallaGym(estado, ctx);
    cierto(html.includes("Peso corporal") && html.includes("78,1 kg") && html.includes("gym-spark"), "se ve el peso y las gráficas");
});

prueba("Gym: al terminar un entrenamiento se marca sola la misión que elegiste", () => {
    const estado = partidaNueva();
    const m = crearMision(estado, { nombre: "Ir al gym" });
    debeFallar(() => acciones.cambiarAjusteGym(estado, "mision", 9999), "no existe");
    acciones.cambiarAjusteGym(estado, "mision", String(m.id));
    igual(estado.gym.mision, m.id);
    const r = entrenar(estado, "hombros");
    cierto(estado.completadas.some((c) => c.misionId === m.id && c.fecha === hoy()), "la misión quedó marcada");
    cierto(r.celebraciones.some((c) => c.titulo?.includes("Ir al gym")), "y se avisa");
    // Si ya estaba marcada, no pasa nada.
    estado.gym.sesiones = [];
    entrenar(estado, "espalda");
    igual(estado.completadas.filter((c) => c.misionId === m.id).length, 1, "no se marca dos veces");
    acciones.cambiarAjusteGym(estado, "mision", "");
    igual(estado.gym.mision, null);
});

prueba("Gym: se pueden sumar ejercicios extra, que cuentan igual (XP, músculo y récords)", () => {
    const estado = partidaNueva();
    igual(gym.EXTRAS.length, 18);
    for (const x of gym.EXTRAS) cierto(gym.MUSCULOS[x.musculo] && x.min < x.max, `${x.id} es válido`);
    const ids = [...gym.RUTINA.flatMap((r) => r.ejercicios), ...gym.EXTRAS].map((x) => x.id);
    igual(new Set(ids).size, ids.length, "ningún id repetido entre la rutina y los extras");
    acciones.empezarGym(estado, "pecho-triceps");
    debeFallar(() => acciones.agregarEjercicioGym(estado, "press-banca"), "no existe");
    acciones.agregarEjercicioGym(estado, "abdominales");
    debeFallar(() => acciones.agregarEjercicioGym(estado, "abdominales"), "ya está");
    const en = estado.gym.encurso;
    igual([en.ejercicios.length, en.ejercicios[6].id, en.ejercicios[6].series.length], [7, "abdominales", 3]);
    const html = vistasGym.pantallaGym(estado, { hoy: hoy(), ahora: Date.now(), avatar: avatarDePrueba({ etapa: avatar.ETAPAS[1] }), descanso: null });
    cierto(html.includes('data-accion="gym-extra"') && html.includes("Abdominales (crunch)"), "se muestra");
    en.ejercicios[6].series.forEach((_, si) => { acciones.anotarSerieGym(estado, 6, si, "reps", 15); acciones.marcarSerieGym(estado, 6, si); });
    const r = acciones.terminarGym(estado);
    igual(r.sesion.xp, 3 * gym.XP_POR_SERIE, "3 series de abdomen (no llega al 80 % de la rutina)");
    cierto(gym.nivelesDeMusculos(estado.gym.sesiones).core.xpEnNivel > 0, "sube el abdomen");
});

prueba("Gym: las 7 lecturas de la Fragua se abren con el nivel de gym", () => {
    igual(fragua.LECTURAS.length, 7);
    igual(fragua.LECTURAS.map((l) => l.nivel), [...fragua.LECTURAS.map((l) => l.nivel)].sort((a, b) => a - b), "van en orden de nivel");
    for (const l of fragua.LECTURAS) {
        cierto(l.titulo && l.moraleja && l.parrafos.length >= 3, `${l.titulo} está completa`);
        cierto(fragua.minutosDeLectura(l) >= 1);
        cierto(!/undefined|\{n\}/.test(l.parrafos.join(" ")), "sin huecos");
    }
    igual(fragua.lecturasAbiertas(1).length, 1);
    igual(fragua.lecturasAbiertas(6).length, 4);
    igual(fragua.lecturasAbiertas(30).length, 7);
    const estado = partidaNueva();
    const ctx = { hoy: hoy(), ahora: Date.now(), avatar: avatarDePrueba({ etapa: avatar.ETAPAS[1] }), descanso: null };
    const html = vistasGym.pantallaGym(estado, ctx);
    cierto(html.includes("Lecturas de la Fragua") && html.includes("El hierro no pide permiso") && html.includes("Se abre en el nivel 2"), "la primera abierta y la segunda cerrada");
});

// ===== «La linterna de Orrin», el segundo libro largo (v70) =====

prueba("Orrin: 18 capítulos en 3 libros, cada uno con su moraleja, y coherente con las otras historias", () => {
    igual(libroOrrin.CAPITULOS.length, 18);
    igual(libroOrrin.LIBROS.map((l) => l.desde), [0, 5, 12]);
    igual(libroOrrin.CAPITULOS_LIBRES, 12);
    for (const c of libroOrrin.CAPITULOS) {
        cierto(c.titulo && c.moraleja && c.parrafos.length === 5, `${c.titulo}: título, moraleja y 5 párrafos`);
        cierto(c.parrafos.every((p) => p.length > 120), `${c.titulo}: párrafos con cuerpo`);
    }
    const texto = [...libroOrrin.PROLOGO, ...libroOrrin.CAPITULOS.flatMap((c) => c.parrafos), ...libroOrrin.EPILOGO].join(" ");
    cierto(!/undefined|\{n\}/.test(texto), "sin huecos ni marcas sin reemplazar");
    // Lo que ya cuentan las otras historias (pergamino del nombre raspado, Casio y la Mazmorra):
    for (const frase of ["solo un día", "Ya casi", "piso cien", "cantera", "Brasa", "Mañana", "Cuerpo", "Mente", "Voz", "Tesoro", "Dragón de la tormenta"]) {
        cierto(texto.includes(frase) || texto.includes(frase.toLowerCase()) || texto.includes(frase.replace("Ya", "ya")), `menciona «${frase}»`);
    }
    cierto(!/la Llama (ya )?arde|encendiste la Llama/.test(texto), "no dice que la Llama ya arde");
    cierto(libroOrrin.minutosDeLectura() >= 30, `se lee en ${libroOrrin.minutosDeLectura()} min`);
    cierto(libroOrrin.ENSENANZAS.length >= 15);
});

prueba("Orrin: se abre con tu récord en la Mazmorra (sótano 5 y sótano 10) y da su premio una vez", () => {
    const estado = partidaNueva();
    igual(libros.IDS, ["casio", "orrin"]);
    igual(libros.libroDeEstado(estado, "orrin").capitulos.filter((c) => c.abierto).length, 0, "cerrado al principio");
    debeFallar(() => acciones.marcarLibro(estado, "orrin", 0), "sótano 5");
    estado.arcade.records.mazmorra = 5;
    igual(libros.libroDeEstado(estado, "orrin").capitulos.filter((c) => c.abierto).length, 12, "los libros primero y segundo");
    acciones.marcarLibro(estado, "orrin", 11);
    debeFallar(() => acciones.marcarLibro(estado, "orrin", 12), "sótano 10");
    debeFallar(() => acciones.terminarLibro(estado, "orrin"), "capítulos");
    estado.arcade.records.mazmorra = 10;
    igual(libros.libroDeEstado(estado, "orrin").capitulos.filter((c) => c.abierto).length, 18, "todo abierto");
    debeFallar(() => acciones.terminarLibro(estado, "orrin"), "hasta el último");
    acciones.marcarLibro(estado, "orrin", 17);
    const xp = estado.atributos.intelecto;
    const r = acciones.terminarLibro(estado, "orrin");
    igual([r.primera, estado.atributos.intelecto - xp, estado.libros.orrin.fin], [true, libroOrrin.PREMIO.xp, hoy()]);
    igual(acciones.terminarLibro(estado, "orrin").primera, false, "el premio es una sola vez");
    igual(estado.libros.casio.leidos, 0, "el otro libro no se toca");
    debeFallar(() => acciones.marcarLibro(estado, "no-existe", 0), "no existe");
});

prueba("Orrin: las pantallas (portada cerrada, índice, capítulo y el último) y la escena final", () => {
    const estado = partidaNueva();
    const html = (cambios = {}) => vistas.pantallaNovela(estado, { libroNovela: "orrin", ...cambios });
    let h = html();
    cierto(h.includes("La linterna de Orrin") && h.includes("caja que solo se abre"), "portada cerrada con el candado");
    cierto(!h.includes("Prólogo"), "sin prólogo mientras está cerrado");
    estado.arcade.records.mazmorra = 10;
    h = html();
    cierto(h.includes("Libro primero · La cantera") && h.includes("Libro tercero · La linterna") && h.includes("Empezar a leer"), "índice con los 3 libros");
    acciones.marcarLibro(estado, "orrin", 0);
    h = html({ capituloNovela: 0 });
    cierto(h.includes("La risa en la cantera") && h.includes("Lo que aprendió Marta"), "un capítulo");
    acciones.marcarLibro(estado, "orrin", 17);
    h = html({ capituloNovela: 17 });
    cierto(h.includes("Para quien baje") && h.includes("Epílogo") && h.includes('data-accion="novela-terminar"'), "el último capítulo");
    cierto(vistas.pantallaNovela(estado, { libroNovela: "casio", capituloNovela: null }).includes("El Centinela"), "el libro de Casio sigue igual");
    const cine = cinesReino.cinematicaDeOrrin("Prueba");
    igual([cine.tipo, cine.tomas.length], ["libro", 4]);
    cierto(cine.tomas.every((t) => t.texto && !t.texto.includes("{n}")), "tomas con texto");
});

// ===== Reacciones elementales (v71) =====

prueba("Reacciones: dos hechizos distintos en turnos seguidos provocan Vapor, Conducción o Explosión", () => {
    igual(torre.reaccionDe("fuego", "hielo"), "vapor");
    igual(torre.reaccionDe("rayo", "hielo"), "conduccion");
    igual(torre.reaccionDe("fuego", "rayo"), "explosion");
    igual([torre.reaccionDe("fuego", "fuego"), torre.reaccionDe(null, "fuego")], [null, null]);
    const nueva = () => {
        const p = torre.nuevaPartida(NIVELES_1, 31);
        p.heroe.vida = p.heroe.vidaMax = 9999;
        p.heroe.mana = 5;
        p.enemigo.vida = p.enemigo.vidaMax = 9999;
        p.enemigo.intencion = "golpe";
        return p;
    };
    // Vapor: el segundo hechizo lleva la reacción y la criatura queda empañada (su golpe pega menos).
    let p = nueva();
    torre.actuar(p, "hechizo", "fuego");
    igual(torre.reaccionPosible(p, "hielo"), "vapor", "el menú avisa de la reacción");
    igual(torre.reaccionPosible(p, "fuego"), null, "el mismo elemento no reacciona");
    let r = torre.actuar(p, "hechizo", "hielo");
    igual(r.find((e) => e.quien === "heroe").reaccion, "vapor");
    igual(p.enemigo.empanada, false, "el vapor dura un solo golpe de la criatura");
    cierto(p.registro.includes("Vapor"), "la frase lo cuenta");
    // Conducción: pierde su turno.
    p = nueva();
    torre.actuar(p, "hechizo", "hielo");
    r = torre.actuar(p, "hechizo", "rayo");
    igual(r.find((e) => e.quien === "heroe").reaccion, "conduccion");
    cierto(r.some((e) => e.quien === "enemigo" && e.tipo === "aturdida"), "la criatura pierde su turno");
    // Explosión: rompe la coraza y la barrera.
    p = nueva();
    torre.actuar(p, "hechizo", "fuego");
    p.enemigo.coraza = true;
    p.enemigo.barrera = 50;
    r = torre.actuar(p, "hechizo", "rayo");
    igual(r.find((e) => e.quien === "heroe").reaccion, "explosion");
    igual([p.enemigo.coraza, p.enemigo.barrera], [false, 0], "rompe lo que lo cubría");
    // Pasar un turno de por medio (atacar) borra la reacción; los guardianes resisten la Conducción.
    p = nueva();
    torre.actuar(p, "hechizo", "fuego");
    torre.actuar(p, "atacar");
    r = torre.actuar(p, "hechizo", "hielo");
    igual(r.find((e) => e.quien === "heroe").reaccion, undefined, "no fue en turnos seguidos");
    p = nueva();
    p.enemigo.guardian = true;
    torre.actuar(p, "hechizo", "hielo");
    r = torre.actuar(p, "hechizo", "rayo");
    cierto(!r.some((e) => e.quien === "enemigo" && e.tipo === "aturdida"), "un guardián no se aturde");
    // El golpe con reacción de Vapor pega más que el mismo hechizo sin reacción (misma semilla).
    const a = nueva(); torre.actuar(a, "hechizo", "fuego");
    const b = nueva(); torre.actuar(b, "atacar");
    const conReaccion = torre.actuar(a, "hechizo", "hielo").find((e) => e.quien === "heroe").dano;
    const sinReaccion = torre.actuar(b, "hechizo", "hielo").find((e) => e.quien === "heroe").dano;
    cierto(conReaccion > sinReaccion * 1.1, `con reacción ${conReaccion} > sin ella ${sinReaccion}`);
});

prueba("Maestro: sabe de tu gimnasio (te empuja si hace días que no entrenas y celebra tus marcas)", () => {
    const estado = partidaNueva();
    const a = (h) => new Date(2026, 0, 15, h).getTime();
    estado.misiones = [];
    let c = maestro.contexto(estado, hoy(), a(14));
    igual([c.gym.sesiones, c.gym.diasSin, c.gym.hechoHoy], [0, null, false], "sin sesiones no dice nada del gym");
    cierto(!maestro.saludo(c).includes("gimnasio"), "no menciona el gym");
    entrenar(estado, "espalda", 30, 10, sumarDias(hoy(), -1));
    estado.gym.sesiones[0].fecha = sumarDias(hoy(), -5);
    c = maestro.contexto(estado, hoy(), a(14));
    igual([c.gym.diasSin, c.gym.toca], [5, "Bíceps"]);
    cierto(maestro.saludo(c).includes("Hace 5 días que no pisas el gimnasio") && maestro.saludo(c).includes("Bíceps"), "te empuja");
    cierto(maestro.responder(estado, c, "comoVoy").includes("En el gimnasio vas en el nivel 1"), "«¿Cómo voy?» cuenta el gym");
    entrenar(estado, "biceps", 20, 10);
    entrenar(estado, "hombros", 20, 10, sumarDias(hoy(), -1));
    estado.gym.sesiones.sort((x, y) => (x.fecha < y.fecha ? -1 : 1));
    estado.gym.sesiones[estado.gym.sesiones.length - 1].records = [{ id: "curl-barra", puntaje: 30 }];
    c = maestro.contexto(estado, hoy(), a(14));
    cierto(c.gym.recordHoy && maestro.saludo(c).includes("rompiste una marca"), "celebra el récord de hoy");
});

// ===== Los ataques de las criaturas se ven (v67) =====

prueba("Ataques: las 80 criaturas tienen un estilo de ataque válido y los 11 estilos se usan", () => {
    const todas = Object.values(bestiario.LUGARES).flatMap((l) => l.orden);
    igual(todas.length, 80);
    const usados = new Set();
    for (const id of todas) {
        const estilo = ataques.estiloDe(id);
        cierto(ataques.ESTILOS[estilo], `${id} tiene estilo (${estilo})`);
        usados.add(estilo);
    }
    igual([...usados].sort(), Object.keys(ataques.ESTILOS).sort(), "todos los estilos los usa alguien");
    igual(ataques.estiloDe("dragon"), "fuego");
    igual(ataques.estiloDe("esqueleto"), "tajo");
    igual(ataques.estiloDe("ojo"), "rayo");
});

prueba("Ataques: el recorrido sale por delante de la criatura y llega al héroe; si esquivas, pasa de largo", () => {
    const normal = ataques.recorrido({ talla: 96 });
    const falla = ataques.recorrido({ talla: 96 }, { falla: true });
    cierto(normal.x0 > 62 && normal.x1 < 150, "va de la criatura al héroe");
    cierto(falla.x1 > 192, "esquivado: sale de la escena");
    igual(ataques.recorrido({}, { fuerte: true }).tam > ataques.recorrido({}).tam, true, "el fuerte es más grande");
    cierto(ataques.recorrido({ vuela: true, talla: 72 }).y0 > ataques.recorrido({ talla: 72 }).y0, "las que vuelan salen más arriba");
    const html = ataques.htmlDelAtaque("esquirlas", { talla: 80 });
    igual((html.match(/class="a"/g) || []).length, 3, "tres esquirlas");
    cierto(!ataques.htmlDelAtaque("escupitajo", {}, { falla: true }).includes('class="b"'), "un proyectil esquivado no tiene impacto");
    cierto(ataques.htmlDelAtaque("mordida", {}, { falla: true }).includes('class="b"'), "la mordida al aire sí cierra las dos mandíbulas");
    igual(ataques.htmlDelAtaque("no-existe", {}), "");
});

prueba("Ataques: la batalla dibuja el ataque de la criatura cuando te pega, y no cuando solo se cura", () => {
    const estado = partidaNueva();
    acciones.empezarTorre(estado, 11);
    const imagenes = { heroe: "data:image/png;base64,AA", enemigo: "data:image/png;base64,BB", sala: "data:image/png;base64,CC" };
    const t = (eventos) => ({ partida: estado.arcade.torre, nombre: "Prueba", sprites: imagenes, eventos, menu: "principal", ultimo: "atacar",
                              bestiario: estado.arcade.bestiario, resultado: null, fichas: 2 });
    const golpe = vistas.pantallaTorre(t([{ quien: "heroe", tipo: "defender" }, { quien: "enemigo", tipo: "golpe", dano: 4, nombre: "Mordisco" }]));
    cierto(/ff-atq ff-atq-garras\s+"/.test(golpe) || golpe.includes("ff-atq ff-atq-garras"), "el murciélago ataca con garras");
    const fuerte = vistas.pantallaTorre(t([{ quien: "heroe", tipo: "defender" }, { quien: "enemigo", tipo: "fuerte", dano: 9, nombre: "Picada" }]));
    cierto(fuerte.includes("ff-atq ff-atq-garras fuerte"), "el golpe fuerte es más grande");
    const esquivado = vistas.pantallaTorre(t([{ quien: "heroe", tipo: "defender" }, { quien: "enemigo", tipo: "golpe", dano: 0, nombre: "Mordisco", esquivado: true }]));
    cierto(esquivado.includes("falla"), "esquivado: el ataque pasa de largo");
    const cura = vistas.pantallaTorre(t([{ quien: "heroe", tipo: "defender" }, { quien: "enemigo", tipo: "curar", cura: 5, nombre: "Regenerar" }]));
    cierto(!cura.includes("ff-atq "), "curarse no es atacar");
    cierto(!vistas.pantallaTorre(t([])).includes("ff-atq "), "sin turno jugado no hay ataque");
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
