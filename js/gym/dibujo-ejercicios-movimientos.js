// dibujo-ejercicios-movimientos.js — Los 64 movimientos del gym (v168): cada uno con su pose(u) (u = 0 inicio, 1 máxima
// contracción), su fondo y su encuadre. Se arman con las piezas de dibujo-ejercicios-piezas.js.
//
// Salió de dibujo-ejercicios.js, que es quien los usa (dibujarCuadro, tiraDeMovimiento…). Para buscar uno: su nombre.

import { SUELO, MEDIDAS, rad, dir, sumar, restar, unitario, mezcla, mezclaP, n1, curvaCerrada, brazo, brazoHacia, piernaHacia, dePie, tobilloEn, deFrente, DISCO, CUERO, SHORT, parte, bola, pie, puno, centroDelPuno, brazoEntero, marcoTorso, enTorso, rotar, cabezaDeFrente, torsoDeFrente, mancuernaDePunta, mancuernaDeLado, disco, puntaDeBarra, cable, barraRecta, pilaDePesas, subidaDeCable, cuerpoDeLado, cuerpoDeFrente, mancuernaGirada, barraDeFrente, cuerpoFrente, brazoHaciaTi, sentadoInclinado, apoyadoEnBanco, marco, almohadilla, almohadillaEntre, respaldo, rodillo } from "./dibujo-ejercicios-piezas.js";


// ===== Los movimientos =====
// Cada uno: vista ("lado" o "frente"), fondo (las máquinas que no se mueven, ver dibujarFondoEjercicio) y
// dibujar(u, pal, k): el cuerpo y lo que se mueve en ese instante.
export const MOVIMIENTOS = {
    // De pie, con mancuernas: el codo se queda quieto y el antebrazo sube.
    curl: {
        vista: "lado", fondo: "sala", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56));
            const b = brazo(c.S, mezcla(3, 12, u), mezcla(6, 150, u));
            const lejos = brazo(sumar(c.S, [-1.2, 0]), mezcla(3, 12, u), mezcla(6, 150, u));
            return cuerpoDeLado({ ...c, brazos: [b, lejos] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // De pie frente a la polea: los codos pegados al cuerpo y el antebrazo baja hasta estirar el brazo.
    triceps: {
        vista: "lado", fondo: "polea-alta", encuadre: [30, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(50), { espinilla: 4, muslo: 4, torso: 12 });
            const b = brazo(c.S, 6, mezcla(120, 8, u));
            const inicio = brazo(c.S, 6, 120);
            const polea = [93, 9];
            return pilaDePesas(99, subidaDeCable(polea, centroDelPuno(b), centroDelPuno(inicio)))
                + cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { delante: cable(polea, centroDelPuno(b)) + puntaDeBarra(centroDelPuno(b)) });
        },
    },
    // Sentado, de frente: las mancuernas suben desde los hombros hasta arriba de la cabeza.
    press_vertical: {
        vista: "frente", fondo: "asiento", encuadre: [18, 102],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const brazos = cuerpo.lados.map((l) => brazo(l.S, l.s * mezcla(78, 158, u), l.s * mezcla(-178, -171, u)));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: brazos.map((b) => mancuernaDeLado(centroDelPuno(b))).join("") });
        },
    },
    // Acostado en el banco: la barra baja al pecho y sube con los brazos estirados.
    press_horizontal: {
        vista: "lado", fondo: "banco", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 75], S = [45, 75];
            const b = brazoHacia(S, mezclaP([50, 66], [46, 49.5], u), 1);
            const lejos = brazoHacia(sumar(S, [0, 1]), mezclaP([50, 66], [46, 49.5], u), 1);
            const pierna = piernaHacia(H, [91, SUELO - MEDIDAS.tobillo], -1);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [{ ...pierna, planta: [1, 0] }, { ...piernaHacia(sumar(H, [-1, 1]), [88, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] }], giroCabeza: -8 }, pal, k, {
                entre: disco(barra),
                delante: puntaDeBarra(barra),
            });
        },
    },
    // De pie, de frente: los brazos suben a los lados hasta la altura de los hombros.
    elevacion_lateral: {
        vista: "frente", fondo: "sala", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60);
            const brazos = cuerpo.lados.map((l) => {
                const a1 = mezcla(10, 86, u);
                return brazo(l.S, l.s * a1, l.s * (a1 - 10));
            });
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { sobreLasManos: brazos.map((b) => mancuernaDePunta(centroDelPuno(b), 3.4)).join("") });
        },
    },
    // Sentado en la máquina, de frente: tira de la barra desde arriba hasta el pecho.
    jalon: {
        vista: "frente", fondo: "jalon", encuadre: [16, 104],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const y = mezcla(cuerpo.yHombro - 25, cuerpo.yHombro + 0.5, u);
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * mezcla(21.5, 18, u), y], l.s));
            const manos = brazos.map(centroDelPuno);
            const yBarra = (manos[0][1] + manos[1][1]) / 2;
            const barra = barraRecta([33, yBarra + 2.2], [38, yBarra]) + barraRecta([38, yBarra], [82, yBarra]) + barraRecta([82, yBarra], [87, yBarra + 2.2]);
            const rodillo = `<rect x="43" y="77.6" width="34" height="4.4" rx="2" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><rect x="44" y="78.2" width="32" height="1.6" fill="${CUERO.luz}"/>`;
            return cable([60, 3], [60, yBarra]) + cuerpoDeFrente(cuerpo, brazos, pal, k, { delanteDeLasPiernas: rodillo, bajoLasManos: barra });
        },
    },
    // Sentado, de lado: tira del cable hacia el abdomen y endereza la espalda.
    remo: {
        vista: "lado", fondo: "polea-baja", encuadre: [14, 120],
        dibujar(u, pal, k) {
            const H = [38, 85.5];
            const S = sumar(H, dir(180 - mezcla(18, -6, u)), MEDIDAS.torso);
            const S0 = sumar(H, dir(162), MEDIDAS.torso);
            const objetivo = (s, t) => mezclaP(sumar(s, [24.5, 5]), sumar(s, [9.5, 13.5]), t);
            const b = brazoHacia(S, objetivo(S, u), 1);
            const lejos = brazoHacia(sumar(S, [-1, 0.5]), objetivo(S, u), 1);
            const pierna = piernaHacia(H, [75, 93], -1);
            const polea = [101, 91];
            const mano = centroDelPuno(b);
            return pilaDePesas(102, subidaDeCable(polea, mano, centroDelPuno(brazoHacia(S0, objetivo(S0, 0), 1))))
                + cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [{ ...pierna, planta: [0, -1] }, { ...piernaHacia(sumar(H, [-1, 0.5]), [73, 94], -1), planta: [0, -1] }] }, pal, k, {
                    delante: cable(polea, mano) + puntaDeBarra(mano),
                });
        },
    },
    // Sentadilla con barra: la cadera baja y va atrás, las rodillas avanzan y el pecho se inclina.
    sentadilla: {
        vista: "lado", fondo: "jaula", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56), { espinilla: 34 * u, muslo: 72 * u, torso: 40 * u });
            const m = marcoTorso(c.H, c.S);
            const barra = enTorso(m, MEDIDAS.torso - 1.6, -4.4);
            const b = brazoHacia(c.S, sumar(sumar(barra, m.f, 1.6), m.u, -0.4), -1);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Peso muerto rumano: la cadera va hacia atrás, la espalda recta y la barra baja pegada a las piernas.
    bisagra: {
        vista: "lado", fondo: "sala", encuadre: [24, 96],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56), { espinilla: 5 * u, muslo: 28 * u, torso: 55 * u });
            const b = brazo(c.S, mezcla(4, 0, u), mezcla(2, 0, u));
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Boca abajo en la máquina: el talón sube hacia el glúteo empujando el rodillo.
    curl_femoral: {
        vista: "lado", fondo: "banco-femoral", encuadre: [14, 110],
        dibujar(u, pal, k) {
            const H = [60, 74], S = [35, 74];
            const K = sumar(H, dir(93), MEDIDAS.muslo);
            const A = sumar(K, dir(mezcla(92, 192, u)), MEDIDAS.pierna);
            const pierna = { H, K, A };
            const lejos = { H: sumar(H, [0, -1.2]), K: sumar(K, [-0.6, -1.2]), A: sumar(sumar(K, [-0.6, -1.2]), dir(mezcla(92, 192, u)), MEDIDAS.pierna) };
            const espinilla = unitario(restar(A, K));
            const rodillo = sumar(sumar(A, [espinilla[1], -espinilla[0]], -3.4), espinilla, -1.6);   // detrás del tobillo
            const eje = [81.5, 82];
            const palanca = barraRecta(eje, rodillo, 1.8) + `<circle cx="${n1(rodillo[0])}" cy="${n1(rodillo[1])}" r="2.8" fill="${CUERO.sombra}" stroke="${CUERO.linea}" stroke-width="1"/><circle cx="${n1(rodillo[0] + 0.5)}" cy="${n1(rodillo[1] - 0.5)}" r="1.6" fill="${CUERO.base}"/>`;
            const b = brazoHacia(S, [25, 85], -1);
            return cuerpoDeLado({ H, S, mira: -1, brazos: [b], piernas: [pierna, lejos], giroCabeza: -38 }, pal, k, { delante: palanca });
        },
    },
    // De pie sobre un escalón: los talones bajan y suben sobre la punta de los pies.
    talones: {
        vista: "lado", fondo: "escalon", encuadre: [24, 100],
        dibujar(u, pal, k) {
            const angulo = mezcla(-14, 36, u);
            const planta = [Math.cos(rad(angulo)), Math.sin(rad(angulo))];
            const abajo = [-planta[1], planta[0]];
            const bolaDelPie = [67.5, 96];
            const A = sumar(sumar(bolaDelPie, planta, -6), abajo, -MEDIDAS.tobillo);
            const c = dePie(A);
            c.piernas[0].planta = planta;
            const b = brazo(c.S, 3, 2);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { entre: mancuernaDePunta(centroDelPuno(sumar3(b, [-1.2, 0])), 3.2), delante: mancuernaDePunta(centroDelPuno(b), 3.4) });
        },
    },
    // Acostado en la colchoneta: el pecho sube hacia las rodillas y baja despacio.
    abdominales: {
        vista: "lado", fondo: "colchoneta", encuadre: [6, 114],
        dibujar(u, pal, k) {
            const H = [66, 95];
            const S = sumar(H, dir(mezcla(-92, -126, u)), MEDIDAS.torso);
            const m = marcoTorso(H, S);
            const nuca = sumar(sumar(m.S, m.u, MEDIDAS.cuello + 4.6), m.f, -4.2);
            const b = brazoHacia(S, nuca, -1);
            const pierna = piernaHacia(H, [88, 98], -1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [{ ...pierna, planta: [1, 0] }, { ...piernaHacia(sumar(H, [-1, 0.5]), [85, 98.5], -1), planta: [1, 0] }] }, pal, k);
        },
    },
    // De pie, de frente: los hombros suben hacia las orejas.
    encogimiento: {
        vista: "frente", fondo: "sala", encuadre: [24, 96],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { subir: 3.8 * u });
            const brazos = cuerpo.lados.map((l) => brazo(l.S, l.s * 5, l.s * 3));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { sobreLasManos: brazos.map((b) => mancuernaDePunta(centroDelPuno(b), 3.4)).join("") });
        },
    },

    // ===== (v168) Los movimientos nuevos: cada ejercicio con una figura que se parece a lo que haces =====
    // --- Pecho ---
    // Sentado en el banco inclinado: las mancuernas suben desde el pecho hasta arriba de los hombros.
    press_inclinado: {
        vista: "lado", fondo: "banco-inclinado", encuadre: [14, 100],
        dibujar(u, pal, k) {
            const { H, S, piernas } = sentadoInclinado();
            const mano = mezclaP(sumar(S, [5, -5]), sumar(S, [1.5, -25.4]), u);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [0.8, 0.8]), sumar(mano, [0.8, 0.4]), 1);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -6 }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Acostado en el banco plano, una mancuerna en cada mano: bajan junto al pecho y suben con los brazos estirados.
    press_mancuernas: {
        vista: "lado", fondo: "banco-libre", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 75], S = [45, 75];
            const mano = mezclaP([50.5, 67], [46, 49.5], u);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [0, 1]), sumar(mano, [0.6, 0.6]), 1);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 91), pierna(sumar(H, [-1, 1]), 88)], giroCabeza: -8 }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Acostado en el banco declinado (la cabeza más abajo, las piernas trabadas en los rodillos): la barra baja al pecho y sube.
    press_declinado: {
        vista: "lado", fondo: "banco-declinado", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 72];
            const S = sumar(H, dir(-70), MEDIDAS.torso);
            const mano = mezclaP(sumar(S, [4.5, -9.5]), sumar(S, [1, -25.4]), u);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [0.6, 0.9]), mano, 1);
            const pierna = (cadera, muslo, espinilla) => {
                const K = sumar(cadera, dir(muslo), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(espinilla), MEDIDAS.pierna) };
            };
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 118, 8), pierna(sumar(H, [-0.8, 1]), 116, 5)], giroCabeza: -4 }, pal, k, {
                entre: disco(barra),
                delante: puntaDeBarra(barra),
            });
        },
    },
    // Sentado en la máquina de aperturas (pec deck), de frente: los brazos se cierran delante del pecho, como abrazando un árbol.
    aperturas: {
        vista: "frente", fondo: "pec-deck", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const giro = mezcla(4, 102, u);   // 0 = los brazos al costado, 90 = apuntan hacia ti
            const brazos = cuerpo.lados.map((l) => brazoHaciaTi(l.S, l.s, giro, 14, 1.6));
            const manijas = brazos.map(centroDelPuno).map((m) => barraRecta([m[0], m[1] - 4.5], [m[0], m[1] + 4.5], 1.4)).join("");
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: manijas });
        },
    },
    // De pie entre dos poleas altas, de frente: los brazos bajan casi estirados y las manos se juntan delante de la cadera.
    cruce_poleas: {
        vista: "frente", fondo: "poleas-dobles", encuadre: [0, 120],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60);
            const angulo = mezcla(122, -18, u);   // 180 = arriba, 90 = al costado, 0 = abajo
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, sumar(l.S, [l.s * Math.sin(rad(angulo)), Math.cos(rad(angulo))], 25.7), l.s));
            const inicio = cuerpo.lados.map((l) => centroDelPuno(brazoHacia(l.S, sumar(l.S, [l.s * Math.sin(rad(122)), Math.cos(rad(122))], 25.7), l.s)));
            const manos = brazos.map(centroDelPuno);
            const poleas = [[16.5, 18], [103.5, 18]];
            const pesas = pilaDePesas(1, subidaDeCable(poleas[0], manos[0], inicio[0])) + pilaDePesas(106, subidaDeCable(poleas[1], manos[1], inicio[1]));
            const cables = manos.map((m, i) => cable(poleas[i], m)).join("");
            return pesas + cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: cables });
        },
    },
    // De frente al suelo: el cuerpo recto como una tabla baja hasta casi tocar el suelo y sube con los brazos estirados.
    flexion: {
        vista: "lado", fondo: "colchoneta", encuadre: [10, 112],
        dibujar(u, pal, k) {
            const A = [22, 95.5];
            const alto = mezcla(19, 3.5, u);   // cuántos grados sube la línea del cuerpo desde los pies
            const linea = [Math.cos(rad(alto)), -Math.sin(rad(alto))];
            const K = sumar(A, linea, MEDIDAS.pierna);
            const H = sumar(K, linea, MEDIDAS.muslo);
            const S = sumar(H, linea, MEDIDAS.torso);
            const planta = unitario([0.5, 0.87]);   // en puntas de pie
            const mano = [83, 100.4];
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-0.6, -0.8]), sumar(mano, [-1.5, 0]), 1);
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-1.2, -0.4]), A: sumar(A, [-1.6, 0]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -8 }, pal, k);
        },
    },
    // Entre las barras paralelas: los brazos se doblan hacia atrás, el cuerpo baja inclinado hacia adelante y vuelve a subir.
    fondos: {
        vista: "lado", fondo: "paralelas", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const mano = [60, 61];
            const S = mezclaP([61.5, 35.6], [67, 46.5], u);
            const inclinacion = mezcla(10, 32, u);
            const H = sumar(S, dir(-inclinacion), MEDIDAS.torso);
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-1, 0.4]), [59, 61], 1);
            const pierna = (cadera, atras) => piernaHacia(cadera, sumar(cadera, [-atras, 25.5]), -1);   // las rodillas dobladas, los pies atrás
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 7), pierna(sumar(H, [-1.6, 0.6]), 3)], giroCabeza: -inclinacion * 0.6 }, pal, k);
        },
    },

    // --- Tríceps ---
    // Acostado en el banco (press francés): los codos quietos apuntando arriba y la barra baja hasta la frente.
    press_frances: {
        vista: "lado", fondo: "banco-libre", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [70, 75], S = [45, 75];
            const antebrazo = mezcla(-42, -166, u);
            const b = brazo(S, 196, antebrazo);
            const lejos = brazo(sumar(S, [0, 1]), 196, antebrazo);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 91), pierna(sumar(H, [-1, 1]), 88)], giroCabeza: -8 }, pal, k, {
                entre: disco(barra, 6.5),
                delante: puntaDeBarra(barra),
            });
        },
    },
    // De espaldas a la polea alta, inclinado hacia adelante: la cuerda sale de detrás de la cabeza y los brazos se estiran arriba.
    extension_cuerda: {
        vista: "lado", fondo: "polea-alta", encuadre: [22, 120],
        dibujar(u, pal, k) {
            const H = [57, 63.5];
            const S = sumar(H, dir(210), MEDIDAS.torso);   // mira a la izquierda: inclinado 30° hacia adelante
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], 1), planta: [-1, 0] });
            // El brazo va un poco por detrás de la línea del torso y la cabeza mira un poco abajo: así no se tapan.
            const b = brazo(S, 200, mezcla(30, 196, u));
            const inicio = brazo(S, 200, 30);
            const polea = [93, 9];
            const mano = centroDelPuno(b);
            return pilaDePesas(99, subidaDeCable(polea, mano, centroDelPuno(inicio)))
                + cuerpoDeLado({ H, S, mira: -1, brazos: [b], piernas: [pierna(H, 50), pierna(sumar(H, [1.2, 0.4]), 64)], giroCabeza: 14 }, pal, k, {
                    entre: cable(polea, mano),
                    delante: puntaDeBarra(mano),
                });
        },
    },
    // De pie, una mancuerna con las dos manos: los codos arriba junto a la cabeza y la pesa sube desde la nuca.
    extension_arriba: {
        vista: "lado", fondo: "sala", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56));
            const antebrazo = mezcla(-14, -176, u);
            const b = brazo(c.S, 188, antebrazo);
            const lejos = brazo(sumar(c.S, [-1.2, 0.3]), 188, antebrazo);
            const hacia = unitario(restar(b.M, b.E));
            return cuerpoDeLado({ ...c, brazos: [b, lejos], giroCabeza: 6 }, pal, k, { entre: mancuernaGirada(sumar(centroDelPuno(b), hacia, 3.4), hacia) });
        },
    },
    // Apoyado en el banco: el brazo pegado al cuerpo y el antebrazo se estira hacia atrás.
    patada_triceps: {
        vista: "lado", fondo: "banco-plano", encuadre: [12, 104],
        dibujar(u, pal, k) {
            const { H, S, piernas, apoyo } = apoyadoEnBanco();
            const b = brazo(S, -84, mezcla(4, -86, u));
            const hacia = unitario(restar(b.M, b.E));
            return cuerpoDeLado({ H, S, brazos: [b, apoyo], piernas, giroCabeza: -12 }, pal, k, { delante: mancuernaGirada(centroDelPuno(b), [-hacia[1], hacia[0]]) });
        },
    },
    // Con las manos en el borde de un banco y los talones en el suelo: los codos se doblan hacia atrás y la cadera baja.
    fondos_banco: {
        vista: "lado", fondo: "banco-corto", encuadre: [4, 94],
        dibujar(u, pal, k) {
            const mano = [33.5, 81.6];
            const S = mezclaP([45.5, 59], [47.5, 69.5], u);
            const H = sumar(S, dir(-4), MEDIDAS.torso);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: unitario([0.3, -1]) });
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-1, 0.4]), sumar(mano, [-1, 0]), 1);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 72), pierna(sumar(H, [-1.4, 0.6]), 69.5)] }, pal, k);
        },
    },

    // --- Hombros ---
    // De pie, de lado: los brazos casi estirados suben hacia adelante hasta la altura de los hombros.
    elevacion_frontal: {
        vista: "lado", fondo: "sala", encuadre: [22, 106],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52));
            const a = mezcla(6, 96, u);
            const b = brazo(c.S, a, a + 6);
            const lejos = brazo(sumar(c.S, [-1.2, 0]), a, a + 6);
            return cuerpoDeLado({ ...c, brazos: [b, lejos] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Pájaros en la máquina (reverse pec deck), con el pecho contra la almohadilla: los brazos casi estirados empiezan
    // juntos adelante y se abren hacia atrás hasta formar una T.
    pajaros: {
        vista: "frente", fondo: "pec-deck-inverso", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            const giro = mezcla(100, 2, u);   // 90 = los brazos apuntan hacia ti, 0 = al costado
            const brazos = cuerpo.lados.map((l) => brazoHaciaTi(l.S, l.s, giro, 6, 0.8));
            const manijas = brazos.map(centroDelPuno).map((m) => barraRecta([m[0], m[1] - 4.5], [m[0], m[1] + 4.5], 1.4)).join("");
            const pecho = marco("M60 80 L60 86", 2) + almohadilla(51, 60, 18, 22);   // la almohadilla del pecho, delante de ti
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { sobreElTorso: pecho, bajoLasManos: manijas });
        },
    },
    // De pie frente a la polea: tira de la cuerda hacia la cara con los codos altos.
    face_pull: {
        vista: "lado", fondo: "polea-cara", encuadre: [26, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(46), { torso: -6 });
            const inicio = sumar(c.S, [24.6, -3]);
            const mano = mezclaP(inicio, sumar(c.S, [3.5, -11]), u);
            const b = brazoHacia(c.S, mano, -1);
            const lejos = brazoHacia(sumar(c.S, [-1.2, 0.2]), sumar(mano, [-1.2, 0.3]), -1);
            const polea = [93, 29];
            const punta = centroDelPuno(b);
            return pilaDePesas(99, subidaDeCable(polea, punta, centroDelPuno(brazoHacia(c.S, inicio, -1))))
                + cuerpoDeLado({ ...c, brazos: [b, lejos] }, pal, k, { delante: cable(polea, punta) + puntaDeBarra(punta) });
        },
    },

    // --- Espalda ---
    // Una rodilla y una mano en el banco: la mancuerna sube desde abajo hasta la cadera, con el codo hacia atrás.
    remo_mancuerna: {
        vista: "lado", fondo: "banco-plano", encuadre: [12, 104],
        dibujar(u, pal, k) {
            const { H, S, piernas, apoyo } = apoyadoEnBanco();
            const b = brazoHacia(S, mezclaP(sumar(S, [0.5, 25.4]), [50, 67], u), 1);
            return cuerpoDeLado({ H, S, brazos: [b, apoyo], piernas, giroCabeza: -12 }, pal, k, { delante: mancuernaDeLado(centroDelPuno(b)) });
        },
    },

    // --- Bíceps ---
    // Sentado en el banco inclinado: los brazos cuelgan por detrás del cuerpo y el antebrazo sube.
    curl_inclinado: {
        vista: "lado", fondo: "banco-inclinado", encuadre: [14, 100],
        dibujar(u, pal, k) {
            const { H, S, piernas } = sentadoInclinado();
            const antebrazo = mezcla(-6, 148, u);
            const b = brazo(S, -8, antebrazo);
            const lejos = brazo(sumar(S, [0.8, 0.8]), -8, antebrazo);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -4 }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Sentado en el banco Scott: los brazos apoyados en la almohadilla inclinada y el antebrazo sube hasta el hombro.
    curl_predicador: {
        vista: "lado", fondo: "scott", encuadre: [18, 98],
        dibujar(u, pal, k) {
            const H = [44, 78];
            const S = sumar(H, dir(164), MEDIDAS.torso);
            const antebrazo = mezcla(42, 166, u);
            const b = brazo(S, 46, antebrazo);
            const lejos = brazo(sumar(S, [-1, 0.4]), 46, antebrazo);
            const pierna = (cadera, x) => ({ ...piernaHacia(cadera, [x, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] });
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, 62), pierna(sumar(H, [-1, 0.6]), 59)], giroCabeza: 10 }, pal, k, {
                entre: disco(barra, 6),
                sobreElTorso: almohadillaEntre([48.5, 60.8], [58.5, 70.5], 6.5),   // la almohadilla, delante del pecho y debajo del brazo
                delante: puntaDeBarra(barra),
            });
        },
    },
    // Sentado en la punta del banco, inclinado: el codo apoyado en el muslo y la mancuerna sube hacia el hombro.
    curl_concentrado: {
        vista: "lado", fondo: "banco-corto", encuadre: [4, 92],
        dibujar(u, pal, k) {
            const H = [36, 81.6];
            const S = sumar(H, dir(138), MEDIDAS.torso);
            const b = brazo(S, 4, mezcla(-2, 158, u));
            const cerca = piernaHacia(H, [58, SUELO - MEDIDAS.tobillo], -1);
            const lejos = piernaHacia(sumar(H, [-1, 0.4]), [55, SUELO - MEDIDAS.tobillo], -1);
            const apoyo = brazoHacia(sumar(S, [-1, 0.5]), sumar(lejos.K, [-1, -4.5]), 1);   // la otra mano en la rodilla
            return cuerpoDeLado({ H, S, brazos: [b, apoyo], piernas: [{ ...cerca, planta: [1, 0] }, { ...lejos, planta: [1, 0] }], giroCabeza: 14 }, pal, k, {
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Colgado de la barra, de frente: el cuerpo sube hasta que la barbilla pasa la barra (los codos bajan hacia los costados).
    dominada: {
        vista: "frente", fondo: "barra-frente", encuadre: [12, 108],
        dibujar(u, pal, k) {
            const yHombro = mezcla(38.6, 17.5, u);
            const yCadera = yHombro + MEDIDAS.torso;
            // Las rodillas dobladas y los pies hacia atrás: la espinilla se aleja de ti y se ve más corta.
            const cuerpo = cuerpoFrente(60, yCadera, yHombro, (s) => ({ K: [60 + s * 5.4, yCadera + 19.6], A: [60 + s * 4.6, yCadera + 27.5] }));
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 20, 15.2], l.s));
            return cuerpoDeFrente(cuerpo, brazos, pal, k);
        },
    },
    // Remo con barra (o en barra T), inclinado: la barra sube desde abajo hasta el abdomen, con los codos hacia atrás.
    remo_inclinado: {
        vista: "lado", fondo: "sala", encuadre: [20, 100],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52), { espinilla: 14, muslo: 50, torso: 64 });
            const m = marcoTorso(c.H, c.S);
            const b = brazoHacia(c.S, mezclaP(sumar(c.S, [0.6, 25.4]), enTorso(m, 9, 9.5), u), 1);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -14 }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // De pie frente a la polea alta, un poco inclinado: los brazos casi estirados bajan desde arriba hasta los muslos.
    pullover: {
        vista: "lado", fondo: "polea-alta", encuadre: [26, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52), { espinilla: 8, muslo: 22, torso: 34 });
            const a = mezcla(150, 12, u);
            const b = brazo(c.S, a, a + 8);
            const polea = [93, 9];
            const mano = centroDelPuno(b);
            return pilaDePesas(99, subidaDeCable(polea, mano, centroDelPuno(brazo(c.S, 150, 158))))
                + cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { delante: cable(polea, mano) + puntaDeBarra(mano) });
        },
    },
    // En el banco de hiperextensiones (45°): el torso cuelga hacia el suelo y sube hasta quedar en línea con las piernas.
    hiperextension: {
        vista: "lado", fondo: "hiperextension", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const linea = dir(135);   // las piernas suben a 45°
            const A = [26, 86];
            const K = sumar(A, linea, MEDIDAS.pierna);
            const H = sumar(K, linea, MEDIDAS.muslo);
            const S = sumar(H, dir(mezcla(12, 135, u)), MEDIDAS.torso);
            const m = marcoTorso(H, S);
            const b = brazoHacia(S, enTorso(m, MEDIDAS.torso - 7, 6.5), -1);   // los brazos cruzados sobre el pecho
            const lejos = { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-0.8, -0.8]), A: sumar(A, [-0.8, -0.8]) };
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [{ H, K, A }, lejos], giroCabeza: mezcla(-10, 0, u) }, pal, k);
        },
    },
    // Colgado de la barra, de lado: las rodillas suben hasta la altura de la cadera y bajan despacio.
    colgado_rodillas: {
        vista: "lado", fondo: "barra-lado", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const S = [56.5, 32];
            const H = sumar(S, dir(mezcla(0, 8, u)), MEDIDAS.torso);   // la pelvis se adelanta un poco
            const pierna = (cadera, muslo, espinilla) => {
                const K = sumar(cadera, dir(muslo), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(espinilla), MEDIDAS.pierna) };
            };
            const muslo = mezcla(4, 100, u), espinilla = mezcla(-2, -6, u);
            const mano = [49, 7.4];   // las manos un poco por detrás de la cabeza: así el brazo no tapa la cara
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-1.2, 0]), sumar(mano, [-1.2, 0]), 1);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [pierna(H, muslo, espinilla), pierna(sumar(H, [-1.6, 0.4]), muslo - 4, espinilla - 2)] }, pal, k);
        },
    },

    // --- Cuádriceps ---
    // En la prensa inclinada: los pies empujan la plataforma, que sube y baja por sus rieles; las rodillas llegan cerca del pecho.
    prensa: {
        vista: "lado", fondo: "prensa", encuadre: [6, 112],
        dibujar(u, pal, k) {
            const A = sumar([70, 60], RIEL_PRENSA, -18 * u);
            return enLaPrensa(A, PLANTA_PRENSA, pal, k);
        },
    },
    // En la prensa con las piernas casi estiradas: solo se mueven los tobillos, que empujan la plataforma con la punta del pie.
    talones_prensa: {
        vista: "lado", fondo: "prensa", encuadre: [6, 112],
        dibujar(u, pal, k) {
            return enLaPrensa([70.5, 59.5], rotar(PLANTA_PRENSA, mezcla(-8, 30, u)), pal, k);
        },
    },
    // Sentado en la máquina de extensiones: la pierna sube hasta quedar estirada y baja despacio.
    extension_cuadriceps: {
        vista: "lado", fondo: "extension", encuadre: [16, 104],
        dibujar(u, pal, k) {
            const H = [48, 78];
            const S = sumar(H, dir(190), MEDIDAS.torso);   // un poco echado hacia atrás, contra el respaldo
            const pierna = (cadera, angulo) => {
                const K = sumar(cadera, dir(92), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(angulo), MEDIDAS.pierna) };
            };
            const angulo = mezcla(4, 86, u);   // 0 = la espinilla colgando, 90 = la pierna estirada
            const cerca = pierna(H, angulo), lejos = pierna(sumar(H, [-0.8, -1]), angulo - 2);
            const e = unitario(restar(cerca.A, cerca.K));
            const centro = sumar(sumar(cerca.A, [e[1], -e[0]], 3.6), e, -2);   // el rodillo, delante del tobillo
            const palanca = barraRecta([69.5, 78.7], centro, 1.8) + rodillo(centro);
            const b = brazoHacia(S, [H[0] + 5, H[1] + 3], 1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { delante: palanca });
        },
    },
    // En la máquina hack: la espalda apoyada en el respaldo, que baja por los rieles inclinados mientras las rodillas se doblan.
    hack: {
        vista: "lado", fondo: "hack", encuadre: [14, 100],
        dibujar(u, pal, k) {
            const H = sumar([58, 63], dir(35), mezcla(0, 17, u));
            const S = sumar(H, dir(215), MEDIDAS.torso);   // echado hacia atrás 35°
            const planta = unitario([1, -0.27]);
            const pie = [72, 98.8];
            const cerca = { ...piernaHacia(H, pie, -1), planta };
            const lejos = { ...piernaHacia(sumar(H, [-0.6, 0.8]), sumar(pie, [-2, 0.5]), -1), planta };
            const m = marcoTorso(H, S);
            const hombrera = almohadillaEntre(enTorso(m, MEDIDAS.torso + 2.5, -5), enTorso(m, MEDIDAS.torso + 2.5, 4), 3.6);
            const b = brazoHacia(S, enTorso(m, MEDIDAS.torso + 1, 8), 1);   // las manos en las manijas, junto a los hombros
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { detras: respaldo(H, 215, -2, 27), entre: hombrera });
        },
    },
    // Hack con barra: la barra va detrás de las piernas, con los brazos estirados; baja la cadera con el pecho alto.
    hack_barra: {
        vista: "lado", fondo: "sala", encuadre: [20, 100],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(56), { espinilla: 36 * u, muslo: 76 * u, torso: 24 * u });
            const b = brazo(c.S, -2, -2);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Zancada con mancuernas: un pie adelante y otro atrás; la cadera baja recta hasta que la rodilla de atrás casi toca el suelo.
    zancada: {
        vista: "lado", fondo: "sala", encuadre: [18, 96],
        dibujar(u, pal, k) {
            const H = [52, mezcla(66, 80.6, u)];
            const S = sumar(H, dir(178), MEDIDAS.torso);
            const adelante = { ...piernaHacia(H, [66, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] };
            const atras = { ...piernaHacia(sumar(H, [-1, 0.6]), [38, 96.6], -1), planta: unitario([0.8, 0.6]) };   // en puntas de pie
            const b = brazo(S, 3, 2);
            const lejos = brazo(sumar(S, [-1.2, 0]), 3, 2);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [adelante, atras] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Sentadilla búlgara: el empeine de atrás apoyado en un banco; la cadera baja sobre la pierna de adelante.
    bulgara: {
        vista: "lado", fondo: "banco-corto", encuadre: [2, 94],
        dibujar(u, pal, k) {
            const H = [53, mezcla(66, 80, u)];
            const S = sumar(H, dir(172), MEDIDAS.torso);
            const adelante = { ...piernaHacia(H, [68, SUELO - MEDIDAS.tobillo], -1), planta: [1, 0] };
            const atras = { ...piernaHacia(sumar(H, [-1, 0.6]), [28, 81.6], -1), planta: unitario([-1, -0.12]) };   // la suela mira hacia arriba
            const b = brazo(S, 3, 2);
            const lejos = brazo(sumar(S, [-1.2, 0]), 3, 2);
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas: [adelante, atras] }, pal, k, {
                entre: mancuernaDePunta(centroDelPuno(lejos), 3.4),
                delante: mancuernaDePunta(centroDelPuno(b), 3.6),
            });
        },
    },
    // Sentadilla goblet: una mancuerna de pie contra el pecho, con los codos abajo; el pecho queda más derecho.
    sentadilla_goblet: {
        vista: "lado", fondo: "sala", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(54), { espinilla: 40 * u, muslo: 76 * u, torso: 24 * u });
            const m = marcoTorso(c.H, c.S);
            const b = brazoHacia(c.S, enTorso(m, MEDIDAS.torso - 8, 8.5), 1);
            const pesa = mancuernaGirada(enTorso(m, MEDIDAS.torso - 5.5, 10), m.u);
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { sobreElTorso: pesa });
        },
    },
    // Sentadilla frontal: la barra apoyada delante de los hombros, con los codos altos; el pecho queda más derecho.
    sentadilla_frontal: {
        vista: "lado", fondo: "jaula", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(54), { espinilla: 40 * u, muslo: 76 * u, torso: 22 * u });
            const m = marcoTorso(c.H, c.S);
            const barra = enTorso(m, MEDIDAS.torso + 0.6, 5.6);
            // El brazo apunta adelante (los codos altos) y el antebrazo vuelve hacia la barra.
            const E = sumar(c.S, rotar(m.f, -14), MEDIDAS.brazo);
            const b = { S: c.S, E, M: sumar(E, unitario(restar(barra, E)), MEDIDAS.antebrazo - 1.4) };
            return cuerpoDeLado({ ...c, brazos: [b] }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Sentadilla sumo, de frente: los pies muy abiertos, las rodillas hacia afuera y la mancuerna colgando entre las piernas.
    sentadilla_sumo: {
        vista: "frente", fondo: "sala", encuadre: [14, 106],
        dibujar(u, pal, k) {
            const yCadera = mezcla(62.5, 79, u);
            // Al bajar, el muslo apunta hacia ti y hacia afuera: se ve más corto (escorzo).
            const cuerpo = cuerpoFrente(60, yCadera, yCadera - MEDIDAS.torso * mezcla(1, 0.94, u), (s) => ({
                K: [60 + s * mezcla(10.8, 17.6, u), mezcla(82, 83.5, u)], A: [60 + s * 16, SUELO - MEDIDAS.tobillo],
            }));
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 2.2, cuerpo.yHombro + 23.5], -l.s));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: mancuernaGirada([60, cuerpo.yHombro + 30.6], [0, 1]) });
        },
    },
    // Buenos días: la barra en la espalda, las piernas casi estiradas y el torso baja hasta casi quedar horizontal.
    buenos_dias: {
        vista: "lado", fondo: "jaula", encuadre: [22, 98],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(54), { espinilla: 6 * u, muslo: 30 * u, torso: 80 * u });
            const m = marcoTorso(c.H, c.S);
            const barra = enTorso(m, MEDIDAS.torso - 1.6, -4.4);
            const b = brazoHacia(c.S, sumar(sumar(barra, m.f, 1.6), m.u, -0.4), -1);
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -22 * u }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Peso muerto: la barra sale del suelo (u = 0) y sube pegada a las piernas hasta quedar de pie (u = 1).
    peso_muerto: {
        vista: "lado", fondo: "sala", encuadre: [20, 100],
        dibujar(u, pal, k) {
            const t = 1 - u;   // cuánto falta para estar de pie
            const c = dePie(tobilloEn(54), { espinilla: 25 * t, muslo: 70 * t, torso: 66 * t });
            const b = brazo(c.S, 4 * u, 2 * u);
            const barra = centroDelPuno(b);
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -16 * t }, pal, k, { detras: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Peso muerto sumo, de frente: los pies muy abiertos y las manos por dentro de las rodillas; la barra sube desde el suelo.
    peso_muerto_sumo: {
        vista: "frente", fondo: "sala", encuadre: [6, 114],
        dibujar(u, pal, k) {
            const escala = mezcla(0.62, 1, u);   // abajo el pecho se inclina hacia ti: el torso se ve más corto
            const yHombro = mezcla(66.9, 37.5, u);
            const yCadera = yHombro + MEDIDAS.torso * escala;
            const cuerpo = cuerpoFrente(60, yCadera, yHombro, (s) => ({ K: [60 + s * mezcla(18, 10.8, u), mezcla(84, 82, u)], A: [60 + s * 16, SUELO - MEDIDAS.tobillo] }));
            const yBarra = yHombro + 27.6;
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 8, yBarra - 1.6], l.s));
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { bajoLasManos: barraDeFrente([60, yBarra]) });
        },
    },

    // --- Isquiosurales ---
    // Sentado en la máquina: la pierna estirada baja empujando el rodillo hasta quedar doblada debajo del asiento.
    curl_femoral_sentado: {
        vista: "lado", fondo: "femoral-sentado", encuadre: [14, 104],
        dibujar(u, pal, k) {
            const H = [46, 76];
            const S = sumar(H, dir(192), MEDIDAS.torso);   // un poco echado hacia atrás, contra el respaldo
            const pierna = (cadera, angulo) => {
                const K = sumar(cadera, dir(90), MEDIDAS.muslo);
                return { H: cadera, K, A: sumar(K, dir(angulo), MEDIDAS.pierna) };
            };
            const angulo = mezcla(80, -8, u);   // de casi estirada (adelante) a doblada debajo del asiento
            const cerca = pierna(H, angulo), lejos = pierna(sumar(H, [-0.8, -1]), angulo + 2);
            const e = unitario(restar(cerca.A, cerca.K));
            const centro = sumar(sumar(cerca.A, [-e[1], e[0]], 3.4), e, -2);   // el rodillo, detrás del tobillo
            const palanca = barraRecta([67.5, 76], centro, 1.8) + rodillo(centro);
            const b = brazoHacia(S, [H[0] + 6, H[1] + 2.5], 1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { delante: palanca });
        },
    },
    // Curl nórdico: de rodillas con los tobillos trabados; el cuerpo recto cae despacio hacia adelante y vuelve.
    nordico: {
        vista: "lado", fondo: "nordico", encuadre: [10, 106],
        dibujar(u, pal, k) {
            const K = [48, 98];
            const A = sumar(K, dir(-92), MEDIDAS.pierna);   // la espinilla en el suelo, hacia atrás
            const inclinacion = mezcla(4, 62, u);
            const H = sumar(K, dir(180 - inclinacion), MEDIDAS.muslo);
            const S = sumar(H, dir(176 - inclinacion), MEDIDAS.torso);
            const m = marcoTorso(H, S);
            // Los brazos cruzados en el pecho; abajo se adelantan, listos para frenar en el suelo.
            const b = brazoHacia(S, mezclaP(enTorso(m, MEDIDAS.torso - 7, 6.5), sumar(S, [7, 12]), u), -1);
            const planta = unitario([-0.42, 0.91]);
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-1, 0.4]), K: sumar(K, [-1.6, -0.6]), A: sumar(A, [-1.6, -0.6]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b], piernas, giroCabeza: -6 * u }, pal, k);
        },
    },
    // De pie en la máquina, con el pecho apoyado: el talón sube hacia el glúteo empujando el rodillo.
    curl_femoral_pie: {
        vista: "lado", fondo: "femoral-pie", encuadre: [16, 100],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(52), { torso: 14 });
            const K = sumar(c.H, dir(10), MEDIDAS.muslo);
            const cerca = { H: c.H, K, A: sumar(K, dir(mezcla(4, -112, u)), MEDIDAS.pierna) };
            const e = unitario(restar(cerca.A, K));
            const centro = sumar(sumar(cerca.A, [-e[1], e[0]], 3.4), e, -2);   // el rodillo, detrás del tobillo
            const palanca = barraRecta([57, 81.4], centro, 1.8) + rodillo(centro);
            const b = brazoHacia(c.S, [69, 51], 1);   // las manos en las manijas
            return cuerpoDeLado({ ...c, brazos: [b], piernas: [cerca, { ...c.piernas[0], H: sumar(c.H, [-1, 0.4]) }] }, pal, k, { delante: palanca });
        },
    },

    // --- Pantorrillas ---
    // Sentado, con un peso sobre las rodillas: los talones bajan y suben sobre la punta de los pies.
    talones_sentado: {
        vista: "lado", fondo: "talones-sentado", encuadre: [16, 104],
        dibujar(u, pal, k) {
            const angulo = mezcla(-14, 30, u);
            const planta = [Math.cos(rad(angulo)), Math.sin(rad(angulo))];
            const abajo = [-planta[1], planta[0]];
            const A = sumar(sumar([72, 96], planta, -6), abajo, -MEDIDAS.tobillo);   // la punta del pie queda quieta en el escalón
            const H = [44, 77];
            const S = sumar(H, dir(174), MEDIDAS.torso);
            const cerca = { ...piernaHacia(H, A, -1), planta };
            const lejos = { ...piernaHacia(sumar(H, [-0.8, -0.8]), sumar(A, [-1.6, -0.4]), -1), planta };
            // La almohadilla apoyada sobre las rodillas, en una palanca con su disco, que sube con ellas.
            const sobre = sumar(cerca.K, [-4, -8.4]);
            const pivote = [92, 90];
            const palanca = barraRecta(pivote, sumar(sobre, [4, 2]), 2) + disco(sumar(mezclaP(pivote, sobre, 0.4), [0, -5]), 6.5)
                + almohadillaEntre(sumar(sobre, [-5, 0]), sumar(sobre, [6, 0]), 3.8);
            const b = brazoHacia(S, sumar(sobre, [-1, -1]), 1);   // las manos sobre la almohadilla
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos] }, pal, k, { delante: palanca });
        },
    },
    // Talones tipo burro: inclinado a 90°, los antebrazos apoyados adelante; los talones bajan y suben en el escalón.
    talones_burro: {
        vista: "lado", fondo: "burro", encuadre: [24, 116],
        dibujar(u, pal, k) {
            const angulo = mezcla(-14, 34, u);
            const planta = [Math.cos(rad(angulo)), Math.sin(rad(angulo))];
            const abajo = [-planta[1], planta[0]];
            const A = sumar(sumar([60.5, 96], planta, -6), abajo, -MEDIDAS.tobillo);
            const c = dePie(A, { torso: 86 });
            c.piernas[0].planta = planta;
            const b = brazoHacia(c.S, [98, 64.5], 1);   // el antebrazo apoyado en la almohadilla
            return cuerpoDeLado({ ...c, brazos: [b], giroCabeza: -16 }, pal, k);
        },
    },

    // --- Glúteos ---
    // Acostado boca arriba con las rodillas dobladas: la cadera sube hasta quedar en línea con los hombros y las rodillas.
    puente: {
        vista: "lado", fondo: "colchoneta", encuadre: [8, 100],
        dibujar(u, pal, k) {
            const S = [34, 95];
            const H = sumar(S, dir(mezcla(90, 122, u)), MEDIDAS.torso);
            const pie = [78, SUELO - MEDIDAS.tobillo];
            const cerca = { ...piernaHacia(H, pie, -1), planta: [1, 0] };
            const lejos = { ...piernaHacia(sumar(H, [-1, -0.8]), sumar(pie, [-2, 0]), -1), planta: [1, 0] };
            const b = brazoHacia(S, [S[0] + 25, 99.6], 1);   // los brazos en el suelo, a los costados
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos], giroCabeza: -6 }, pal, k);
        },
    },
    // Hip thrust: la espalda alta en el borde del banco y la barra sobre la cadera, que sube hasta quedar horizontal.
    hip_thrust: {
        vista: "lado", fondo: "banco-corto", encuadre: [4, 100],
        dibujar(u, pal, k) {
            const S = [34, 81.5];
            const H = sumar(S, dir(mezcla(52, 92, u)), MEDIDAS.torso);   // 52 = la cadera abajo, cerca del suelo; 90 = horizontal
            const pie = [80, SUELO - MEDIDAS.tobillo];
            const cerca = { ...piernaHacia(H, pie, -1), planta: [1, 0] };
            const lejos = { ...piernaHacia(sumar(H, [-1, -0.8]), sumar(pie, [-2.5, 0]), -1), planta: [1, 0] };
            const m = marcoTorso(H, S);
            const barra = enTorso(m, 0.5, 7.4);   // la barra sobre la cadera
            const b = brazoHacia(S, sumar(barra, [-2.5, 0.5]), -1);
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos], giroCabeza: mezcla(-10, 14, u) }, pal, k, { entre: disco(barra), delante: puntaDeBarra(barra) });
        },
    },
    // Patada de glúteo en polea baja: el cable va al tobillo y la pierna se va hacia atrás, casi estirada.
    patada_gluteo: {
        vista: "lado", fondo: "polea-suelo", encuadre: [24, 120],
        dibujar(u, pal, k) {
            const c = dePie(tobilloEn(64), { espinilla: 4, muslo: 6, torso: 30 });
            const pierna = (t) => {
                const muslo = mezcla(10, -40, t);
                const K = sumar(c.H, dir(muslo), MEDIDAS.muslo);
                return { H: c.H, K, A: sumar(K, dir(muslo - 14), MEDIDAS.pierna) };
            };
            const cerca = pierna(u);
            const polea = [93, 97];
            const b = brazoHacia(c.S, [93.5, 52], 1);   // las manos en la torre
            return pilaDePesas(99, subidaDeCable(polea, cerca.A, pierna(0).A))
                + cuerpoDeLado({ ...c, brazos: [b], piernas: [cerca, { ...c.piernas[0], H: sumar(c.H, [-1, 0.4]) }] }, pal, k, { delante: cable(polea, cerca.A) });
        },
    },
    // Sentado en la máquina de abducción, de frente: las rodillas se abren empujando las almohadillas hacia afuera.
    abduccion: {
        vista: "frente", fondo: "asiento", encuadre: [14, 106],
        dibujar(u, pal, k) {
            const cuerpo = deFrente(60, { sentado: true });
            for (const l of cuerpo.lados) {
                l.K = [60 + l.s * mezcla(8.4, 17, u), cuerpo.yCadera + 4.6];
                l.A = [60 + l.s * mezcla(9, 13.5, u), SUELO - MEDIDAS.tobillo];
            }
            const almohadillas = cuerpo.lados.map((l) => marco(`M${n1(l.K[0] + l.s * 6.5)} ${n1(l.K[1] + 6)} L${60 + l.s * 5} 95`, 1.6)
                + almohadilla(n1(l.K[0] + l.s * 6.5 - 2.5), n1(l.K[1] - 7), 5, 14)).join("");
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [60 + l.s * 13.5, 72], -l.s));   // las manos en las manijas
            return cuerpoDeFrente(cuerpo, brazos, pal, k, { delanteDeLasPiernas: almohadillas });
        },
    },

    // --- Abdomen ---
    // Plancha sobre los antebrazos: el cuerpo recto como una tabla; casi quieto, solo se nota la respiración.
    plancha: {
        vista: "lado", fondo: "colchoneta", encuadre: [10, 104],
        dibujar(u, pal, k) {
            const A = [20, 95.5];
            const linea = (alto) => [Math.cos(rad(alto)), -Math.sin(rad(alto))];
            const hombro = (alto) => sumar(A, linea(alto), MEDIDAS.pierna + MEDIDAS.muslo + MEDIDAS.torso);
            const alto = mezcla(9.2, 10, u);
            const K = sumar(A, linea(alto), MEDIDAS.pierna), H = sumar(K, linea(alto), MEDIDAS.muslo), S = hombro(alto);
            const mano = sumar(hombro(9.2), [12, 14.2]);   // el antebrazo en el suelo, hacia adelante
            const b = brazoHacia(S, mano, 1);
            const lejos = brazoHacia(sumar(S, [-0.6, -0.8]), sumar(mano, [-1.5, 0]), 1);
            const planta = unitario([0.5, 0.87]);   // en puntas de pie
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-1.2, -0.4]), A: sumar(A, [-1.6, 0]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b, lejos], piernas, giroCabeza: -6 }, pal, k);
        },
    },
    // De rodillas frente a la polea alta: la cuerda junto a la frente y el torso se enrolla hacia el suelo.
    crunch_polea: {
        vista: "lado", fondo: "polea-alta", encuadre: [22, 120],
        dibujar(u, pal, k) {
            const pose = (t) => {
                const K = [56, 99.5];
                const A = sumar(K, dir(-91), MEDIDAS.pierna);
                const H = sumar(K, dir(mezcla(186, 194, t)), MEDIDAS.muslo);   // la cadera se va un poco atrás
                const S = sumar(H, dir(180 - mezcla(18, 82, t)), MEDIDAS.torso);
                const m = marcoTorso(H, S);
                return { K, A, H, S, b: brazoHacia(S, enTorso(m, MEDIDAS.torso + 6, 4.5), 1) };
            };
            const { K, A, H, S, b } = pose(u);
            const polea = [93, 9];
            const punta = centroDelPuno(b);
            const planta = unitario([-1, -0.25]);   // el empeine en el suelo
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-1, 0.4]), K: sumar(K, [-1.6, 0]), A: sumar(A, [-1.6, 0]), planta }];
            return pilaDePesas(99, subidaDeCable(polea, punta, centroDelPuno(pose(0).b)))
                + cuerpoDeLado({ H, S, brazos: [b], piernas, giroCabeza: mezcla(0, 12, u) }, pal, k, { delante: cable(polea, punta) + puntaDeBarra(punta) });
        },
    },
    // Giro ruso, de frente: sentado, echado hacia atrás con las rodillas arriba; el disco va de un lado de la cadera al otro.
    giro_ruso: {
        vista: "frente", fondo: "colchoneta", encuadre: [14, 106],
        dibujar(u, pal, k) {
            const giro = mezcla(-1, 1, u);   // -1 = el disco a tu izquierda, 1 = a tu derecha
            const cuerpo = cuerpoFrente(60 + giro * 1.4, 96.5, 96.5 - MEDIDAS.torso * 0.74, () => ({}));   // echado atrás: el torso se ve más corto
            const centro = [60 + 14 * Math.sin(rad(giro * 90)), 88 - 8 * Math.cos(rad(giro * 90))];   // el disco hace un arco
            const brazos = cuerpo.lados.map((l) => brazoHacia(l.S, [centro[0] + l.s * 2.6, centro[1]], -l.s));
            // Las piernas: los muslos suben hacia ti (se ven cortos) y las rodillas quedan delante de todo: van al final.
            let piernas = "";
            for (const s of [-1, 1]) {
                const color = s < 0 ? pal.lejos : pal.piel;
                const H = [60 + s * 5, 96.5], K = [60 + s * 8.5, 86.5], A = [60 + s * 7, SUELO - MEDIDAS.tobillo];
                // Del más lejano al más cercano: el short, el muslo que sale de él, la espinilla, el pie y la rodilla.
                piernas += parte(H, K, 4.6 * k, 3.8, color) + parte(H, mezclaP(H, K, 0.3), 5.2 * k, 4.8 * k, SHORT)
                    + parte(K, A, 3.1, 1.9, color, { frente: s * 0.9 * k, atras: -s * 0.3 })
                    + `<path d="${curvaCerrada([[A[0] - 2.2, A[1] - 0.6], [A[0] + 2.2, A[1] - 0.6], [A[0] + 2.6 + s * 1.2, A[1] + 2.4], [A[0] + s * 0.6, A[1] + 3], [A[0] - 2.6 + s * 1.2, A[1] + 2.4]])}" fill="${color.sombra}" stroke="${color.linea}" stroke-width="1"/>`
                    + bola(K, 3.6, color);
            }
            return torsoDeFrente(cuerpo, pal, k) + cabezaDeFrente([cuerpo.N[0] + giro * 1.6, cuerpo.N[1]], pal)
                + brazos.map((b, i) => brazoEntero(b, i === 0 ? pal.lejos : pal.piel, k, i === 0 ? -1 : 1, { conPuno: false })).join("")
                + disco(centro, 5.5) + brazos.map((b, i) => puno(b, i === 0 ? pal.lejos : pal.piel)).join("")
                + piernas;
        },
    },
    // Acostado boca arriba: las piernas estiradas suben hasta quedar verticales y bajan sin tocar el suelo.
    elevacion_piernas: {
        vista: "lado", fondo: "colchoneta", encuadre: [8, 112],
        dibujar(u, pal, k) {
            const H = [62, 95], S = [37, 95];
            const linea = dir(mezcla(96, 178, u));   // 90 = estiradas sobre el suelo, 180 = hacia arriba
            const K = sumar(H, linea, MEDIDAS.muslo), A = sumar(K, linea, MEDIDAS.pierna);
            const lejos = { H: sumar(H, [-0.8, -0.8]), K: sumar(K, [-0.8, -0.8]), A: sumar(A, [-0.8, -0.8]) };
            const b = brazoHacia(S, [S[0] + 25, 99.6], 1);   // los brazos en el suelo, a los costados
            return cuerpoDeLado({ H, S, brazos: [b], piernas: [{ H, K, A }, lejos], giroCabeza: -4 }, pal, k);
        },
    },
    // Rueda abdominal: de rodillas, la rueda rueda hacia adelante hasta que el cuerpo queda casi estirado, y vuelve.
    rueda: {
        vista: "lado", fondo: "colchoneta", encuadre: [8, 116],
        dibujar(u, pal, k) {
            const K = [40, 99.5];
            const A = sumar(K, dir(-91), MEDIDAS.pierna);
            const H = sumar(K, dir(180 - mezcla(15, 64, u)), MEDIDAS.muslo);
            const S = sumar(H, dir(180 - mezcla(75, 83, u)), MEDIDAS.torso);
            // La rueda va por el suelo, adelante, a la distancia de los brazos casi estirados.
            const yRueda = 97.6;
            const centro = [S[0] + Math.sqrt(Math.max(0, 25.4 ** 2 - (yRueda - S[1]) ** 2)), yRueda];
            const b = brazoHacia(S, centro, 1);
            const ruedita = `<circle cx="${n1(centro[0])}" cy="${n1(centro[1])}" r="4.4" fill="${DISCO.sombra}" stroke="${DISCO.linea}" stroke-width="1"/>
                <circle cx="${n1(centro[0])}" cy="${n1(centro[1])}" r="2.6" fill="none" stroke="${DISCO.luz}" stroke-width="1"/>${puntaDeBarra(centro)}`;
            const planta = unitario([-1, -0.25]);
            const piernas = [{ H, K, A, planta }, { H: sumar(H, [-1, 0.4]), K: sumar(K, [-1.6, 0]), A: sumar(A, [-1.6, 0]), planta }];
            return cuerpoDeLado({ H, S, brazos: [b], piernas, giroCabeza: -10 }, pal, k, { entre: ruedita });
        },
    },
};

// (v168) La prensa de piernas: los rieles suben a 45° y la plataforma se mueve por ellos, siempre pegada a la planta del pie.
const RIEL_PRENSA = dir(135);                    // hacia arriba y adelante
const PLANTA_PRENSA = unitario([-1, -1]);        // la planta apoyada en la plataforma (los dedos hacia arriba)
const CENTRO_PRENSA = [69.8, 56];                // dónde está la plataforma con las piernas estiradas
function enLaPrensa(A, planta, pal, k) {
    const H = [44, 86];
    const S = sumar(H, dir(-124), MEDIDAS.torso);   // el respaldo, echado hacia atrás
    const cerca = { ...piernaHacia(H, A, -1), planta };
    const lejos = { ...piernaHacia(sumar(H, [-0.8, -0.6]), sumar(A, [-1.4, -0.6]), -1), planta };
    // La plataforma toca la punta de la planta (donde empuja el pie) y solo se mueve a lo largo del riel.
    const abajo = [-planta[1], planta[0]];
    const bola = sumar(sumar(A, planta, 6.5), abajo, 2.7);
    const avance = (bola[0] - CENTRO_PRENSA[0]) * RIEL_PRENSA[0] + (bola[1] - CENTRO_PRENSA[1]) * RIEL_PRENSA[1];
    const c = sumar(CENTRO_PRENSA, RIEL_PRENSA, avance + 1.8);
    const lado = [RIEL_PRENSA[1], -RIEL_PRENSA[0]];   // a lo largo de la plataforma
    const plataforma = barraRecta(sumar(c, lado, 10), sumar(c, lado, -9), 3)
        + barraRecta(sumar(c, lado, -9), sumar(sumar(c, lado, -9), RIEL_PRENSA, 9), 2)
        + disco(sumar(sumar(c, RIEL_PRENSA, 8), lado, -1), 7.5);
    const b = brazoHacia(S, [40, 88], 1);   // las manos en las manijas del asiento
    return cuerpoDeLado({ H, S, brazos: [b], piernas: [cerca, lejos], giroCabeza: 8 }, pal, k, { detras: plataforma });
}

// (v158) La pose de la victoria, para «¡Todo hecho!»: de frente, saca bíceps con los dos brazos.
export const VICTORIA = {
    vista: "frente", fondo: "sala", encuadre: [20, 100],
    dibujar(u, pal, k) {
        const cuerpo = deFrente(60);
        const brazos = cuerpo.lados.map((l) => brazo(l.S, l.s * mezcla(98, 104, u), l.s * mezcla(140, 200, u)));
        return cuerpoDeFrente(cuerpo, brazos, pal, k, { biceps: mezcla(0.8, 2.2, u) });
    },
};

const sumar3 = (b, v) => ({ S: sumar(b.S, v), E: sumar(b.E, v), M: sumar(b.M, v) });
