// ejecutar.mjs — Corre las pruebas de la app en un navegador sin ventana.
//
// Lo usa GitHub (ver .github/workflows/pruebas.yml) en cada publicación:
// abre http://localhost:8000/pruebas/, espera el resultado y termina con
// código 0 si todo pasó o 1 si algo falló (así GitHub sabe si marcar ✓ o ✗).
//
// En tu compu no hace falta: basta con abrir esa página en Chrome.

import { chromium } from "playwright";

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
const errores = [];
pagina.on("pageerror", (error) => errores.push(String(error)));

await pagina.goto("http://localhost:8000/pruebas/");
await pagina.waitForFunction(() => window.resultadoPruebas, null, { timeout: 120000 });
const resultado = await pagina.evaluate(() => ({
    ...window.resultadoPruebas,
    malas: [...document.querySelectorAll("li.mal")].map((li) => li.textContent),
}));
await navegador.close();

console.log(`Pruebas de la app: ${resultado.total - resultado.fallidas} de ${resultado.total} pasaron.`);
for (const mala of resultado.malas) console.log(`  ✗ ${mala}`);
for (const error of errores) console.log(`  Error en la página: ${error}`);
process.exit(resultado.fallidas || errores.length ? 1 : 0);
