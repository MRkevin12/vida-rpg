// hallazgos.js — Cofres y fogatas en el camino de tu carrera (v148).
//
// Mientras corres con GPS, en algunos kilómetros hay algo esperándote en el camino:
//   - 🎁 Cofre: al pasar por él, ganas su botín (gemas y XP de Fuerza). Se cobra al GUARDAR la carrera, como el botín
//     de las criaturas: si cancelas la carrera, no hay botín.
//   - 🔥 Fogata: un descanso junto al fuego. Tu héroe recupera vida en la pelea de ese km y esa pelea tiene un poco más de
//     margen para vencerla (como si te acompañara tu dragón).
// Igual que las criaturas, dónde cae cada uno sale de la hora en que empezaste (azar fijo): no cambia si recargas la app.
// Aquí solo hay reglas (sin pantalla ni guardar). Lo que encontraste vive en la carrera en curso (en.hallados).

export const COFRE = { gemas: 3, xp: 5 };   // el botín de cada cofre
export const PROB_COFRE = 0.6;             // de cada 10 km, unos 6 traen cofre
export const FOGATA_CADA = 2;              // una fogata cada 2 km (en el km 2, 4, 6…)
export const CURA_FOGATA = 30;             // vida que recupera tu héroe en la pelea
export const MARGEN_FOGATA = 0.02;         // 2 % más de margen para vencer la pelea de ese km
export const AVISO = 120;                  // metros antes de llegar en que aparece en el mapa

export const TIPOS = {
    cofre: { icono: "🎁", nombre: "Cofre" },
    fogata: { icono: "🔥", nombre: "Fogata" },
};

// Un número entre 0 y 1, siempre el mismo para la misma carrera, el mismo km y el mismo «extra».
const azar = (semilla, km, extra = 0) => {
    const x = Math.sin(semilla * 0.0007 + km * 7.137 + extra * 41.31) * 24634.6345;
    return x - Math.floor(x);
};

// Lo que hay en el km número `km` (1, 2, 3…) de la carrera que empezó en `inicio` (ms).
// Devuelve una lista (puede estar vacía) de { tipo, km, metro } con el metro contado desde la salida.
export function hallazgosDelKm(inicio, km) {
    const lista = [];
    const base = (km - 1) * 1000;
    let metroCofre = null;
    if (azar(inicio, km, 1) < PROB_COFRE) {
        metroCofre = base + 150 + Math.round(azar(inicio, km, 2) * 700);   // entre los 150 y los 850 m del km
        lista.push({ tipo: "cofre", km, metro: metroCofre });
    }
    if (km % FOGATA_CADA === 0) {
        let metro = base + 450 + Math.round(azar(inicio, km, 3) * 450);    // entre los 450 y los 900 m del km
        if (metroCofre !== null && Math.abs(metro - metroCofre) < 120) metro = metroCofre < base + 600 ? metroCofre + 200 : metroCofre - 200;
        lista.push({ tipo: "fogata", km, metro });
    }
    return lista.sort((a, b) => a.metro - b.metro);
}

// Lo que cruzaste al pasar de `desde` a `hasta` metros (los dos contados desde la salida).
export function cruzados(inicio, desde, hasta) {
    if (!(hasta > desde)) return [];
    const lista = [];
    for (let km = Math.floor(desde / 1000) + 1; km <= Math.floor(hasta / 1000) + 1; km++) {
        for (const h of hallazgosDelKm(inicio, km)) if (h.metro > desde && h.metro <= hasta) lista.push(h);
    }
    return lista;
}

// El próximo que viene (a AVISO metros o menos), para dibujarlo en el mapa delante de ti. O null.
export function proximo(inicio, distancia, avisar = AVISO) {
    const km = Math.floor(distancia / 1000) + 1;
    const siguientes = [...hallazgosDelKm(inicio, km), ...hallazgosDelKm(inicio, km + 1)].filter((h) => h.metro > distancia);
    const h = siguientes[0];
    return h && h.metro - distancia <= avisar ? { ...h, falta: h.metro - distancia } : null;
}

// El botín de los cofres abiertos de una carrera. hallados: [{ tipo, … }]. Devuelve { cofres, gemas, xp }.
export function botinDeCofres(hallados = []) {
    const cofres = hallados.filter((h) => h.tipo === "cofre").length;
    return { cofres, gemas: cofres * COFRE.gemas, xp: cofres * COFRE.xp };
}
