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
import { calcularResumen } from "../js/resumen.js";
import { hoy, sumarDias, diasEntre, diaDeSemana } from "../js/fechas.js";
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


// ===== Avatar y ajustes =====

prueba("Apariencia: se puede cambiar, y una opción inventada no se acepta", () => {
    const estado = partidaNueva();
    acciones.cambiarApariencia(estado, "piel", "oscura");
    igual(estado.apariencia.piel, "oscura");
    debeFallar(() => acciones.cambiarApariencia(estado, "piel", "verde"), "no existe");
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
    const vieja = JSON.stringify({ personaje: { nombre: "Antigua", xp: 0, monedas: 0, creadoEn: hoy() }, misiones: [] });
    const estado = datos.desdeRespaldo(vieja);
    igual(estado.ajustes, { sonido: true });
    igual(estado.apariencia.peinado, "corto");
    igual(estado.campana, { recompensados: {} });
});

prueba("Copia de seguridad: un archivo cualquiera se rechaza", () => {
    debeFallar(() => datos.desdeRespaldo("hola"), "no es una copia de seguridad válida");
    debeFallar(() => datos.desdeRespaldo('{"otra": "cosa"}'), "no parece una copia");
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
        cierto(juego.tocaEseDia(mision, c.fecha), `la misión tocaba ese día (${clave})`);
    }
    // La XP de cada atributo coincide con lo que dice el historial.
    const xpDiarias = estado.completadas.reduce((suma, c) => suma + c.xp, 0);
    const pasos = estado.principales.flatMap((p) => p.submisiones).filter((s) => s.hecha).length;
    const jefes = Object.values(estado.campana.recompensados)
        .reduce((suma, n) => suma + Array.from({ length: n }, (_, i) => campana.premioJefe(i + 1).xp).reduce((a, b) => a + b, 0), 0);
    igual(estado.personaje.xp, xpDiarias + pasos * juego.PREMIOS.submision.xp + jefes);
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
