// vistas.js — Convierte la partida en HTML.
//
// Cada función recibe el estado y devuelve un texto con HTML.
// app.js pone ese texto dentro de la pantalla que corresponde.
// Aquí no se cambia nada de la partida: solo se "dibuja".
//
// Los botones llevan atributos data-accion="..." y data-id="...".
// app.js escucha los toques y, según data-accion, sabe qué hacer.
//
// (v133) Este archivo era enorme (más de 4700 líneas), así que se dividió por pantalla.
// Ahora solo REÚNE los archivos vistas-*.js: app.js y las pruebas siguen usando «vistas.algo»
// sin saber en qué archivo está cada función. Para cambiar una pantalla, abre su archivo:
//
//   vistas-comun.js        — piezas que usan varias pantallas (esc, barras, botones)
//   vistas-hoy.js          — la pantalla Hoy
//   vistas-diario.js       — el diario y la revisión de la semana
//   vistas-progreso.js     — la pestaña Progreso
//   vistas-aventuras.js    — Aventuras: principales, jefes, logros
//   vistas-mapa.js         — el mapa del reino y la Crónica
//   vistas-historia.js     — Historia: saga, pacto, pergaminos, biblioteca
//   vistas-arcade.js       — el arcade
//   vistas-torre.js        — la Torre, la Mazmorra y el bestiario
//   vistas-enfoque.js      — el modo enfoque
//   vistas-ajustes.js      — avisos, nube y novedades
//   vistas-inicio.js       — «¿Cómo te sientes hoy?» y la portada
//   vistas-heroe.js        — la pestaña Héroe
//   vistas-tienda.js       — la Tienda
//
// (Aparte están vistas-gym.js, vistas-running.js y vistas-voces.js, que app.js usa directamente.)

export * from "./vistas-comun.js";
export * from "./vistas-hoy.js";
export * from "./vistas-diario.js";
export * from "./vistas-progreso.js";
export * from "./vistas-aventuras.js";
export * from "./vistas-mapa.js";
export * from "./vistas-historia.js";
export * from "./vistas-arcade.js";
export * from "./vistas-torre.js";
export * from "./vistas-enfoque.js";
export * from "./vistas-ajustes.js";
export * from "./vistas-inicio.js";
export * from "./vistas-heroe.js";
export * from "./vistas-tienda.js";
