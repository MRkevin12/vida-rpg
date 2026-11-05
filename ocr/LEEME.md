# ocr/ — el lector de texto de las misiones con foto (v193)

Son los archivos de **Tesseract.js**, el programa que convierte una foto en texto. Están aquí (y no en
internet) para que la app pueda leer las fotos **sin conexión**. Los usa `js/pantallas/app-foto.js`.

| Archivo | Qué es | De dónde viene |
|---|---|---|
| `tesseract.esm.min.js` | La parte que usa la página (crea el lector) | tesseract.js 7.0.0 (npm) |
| `worker.min.js` | El "trabajador" que lee en segundo plano, sin trabar la pantalla | tesseract.js 7.0.0 (npm) |
| `tesseract-core-simd-lstm.wasm.js` | El motor de Tesseract compilado a WebAssembly (red neuronal LSTM, con SIMD) | tesseract.js-core 7.0.0 (npm) |
| `spa.traineddata.gz` | Lo que el motor "sabe" del español (versión `4.0.0_best_int`) | @tesseract.js-data/spa 1.0.0 (npm) |

- Licencia: **Apache 2.0** (ver `LICENSE-tesseract.js.md` y `LICENSE-tesseract-core.txt`).
  Tesseract OCR © Google y colaboradores; tesseract.js © Project Naptha y colaboradores.
- El service worker los guarda en una caché aparte (`ocr-vida-rpg`) que **no** se borra al actualizar la app,
  así los 6 MB se descargan una sola vez. Si alguna vez cambias estos archivos, cambia también `CACHE_OCR` en `sw.js`.
- El motor con SIMD necesita iOS 16.4 o más nuevo (lo mismo que las notificaciones).
