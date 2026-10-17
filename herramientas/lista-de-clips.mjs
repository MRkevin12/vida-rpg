// Imprime en JSON todos los audios que necesita la voz de la carrera: { "km-1": "Kilómetro uno.", … }.
// Lo lee generar-voces.py:   node herramientas/lista-de-clips.mjs
import { TEXTOS } from "../js/frases.js";

console.log(JSON.stringify(TEXTOS));
