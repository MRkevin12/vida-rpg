// sprites.js — Las imágenes en pixel art de la Torre: tu héroe, las criaturas y las salas.
//
// Un "sprite" es la imagen de un personaje en un videojuego. Aquí se arman a partir de
// los dibujos de la app (dibujo.js y dibujo-monstruos.js), pasados por pixel.js.
// Todas las funciones son asíncronas (se usan con await) y devuelven la dirección de la
// imagen, lista para ponerla en <img src="…">. pixel.js guarda cada una: la segunda vez
// que se pide la misma, sale al instante.

import { pixelar } from "./pixel.js";
import { dibujarAvatar, dibujarMascota } from "./dibujo.js";
import { dibujarMonstruo, dibujarSala, SALA } from "./dibujo-monstruos.js";
import { dibujarMapa, MEDIDAS } from "./dibujo-mapa.js";
import { CRIATURAS, ORDEN } from "./bestiario.js";

export const HEROE = { ancho: 54, alto: 72 };   // el tamaño de tu héroe, en puntos
export const MASCOTA = { ancho: 44, alto: 34 }; // el de tu mascota (su dibujo mide 72 × 56)

// d = la descripción de tu avatar (avatar.describirAvatar). Si cambias de ropa o de
// equipo, la descripción cambia y se hace una imagen nueva.
export function spriteDeHeroe(d) {
    const svg = dibujarAvatar(d, { batalla: true, sinEfectos: true });
    return pixelar(svg, HEROE.ancho, HEROE.alto, { clave: `heroe-${JSON.stringify(d)}` });
}

export function spriteDeMonstruo(id) {
    const talla = CRIATURAS[id]?.talla || 96;
    return pixelar(dibujarMonstruo(id), talla, talla, { clave: `monstruo-${id}` });
}

// Tu mascota en la Torre. b = la de la partida: { especie, etapa ("huevo" | "cria" | "adulto"), triste }.
export function spriteDeMascota(b) {
    const m = { especie: b.especie, nombre: b.nombre, etapa: { clave: b.etapa, nombre: b.etapa }, triste: Boolean(b.triste) };
    return pixelar(dibujarMascota(m), MASCOTA.ancho, MASCOTA.alto, { clave: `mascota-${b.especie}-${b.etapa}-${m.triste}` });
}

// La sala de una zona ("cripta", "biblioteca"…). Es un fondo: va sin contorno y con más colores.
export function spriteDeSala(zona) {
    return pixelar(dibujarSala(zona), SALA.ancho, SALA.alto, { clave: `sala-${zona}`, contorno: false, niveles: 20 });
}

// El mapa de una región (datos = mapa.datosParaDibujar). Es grande: sin contorno y con más colores.
export function spriteDeMapa(datos) {
    return pixelar(dibujarMapa(datos), MEDIDAS.ancho, MEDIDAS.alto, { clave: `mapa-${JSON.stringify(datos)}`, contorno: false, niveles: 20 });
}

// Tu héroe y tu mascota en el mapa: pequeños, como los personajes del mapa del mundo de los juegos clásicos.
export function spriteDeHeroeEnMapa(d) {
    return pixelar(dibujarAvatar(d, { batalla: true, sinEfectos: true }), 21, 28, { clave: `heroe-mapa-${JSON.stringify(d)}` });
}

export function spriteDeMascotaEnMapa(m) {
    const datos = { especie: m.especie, nombre: m.nombre, etapa: m.etapa, triste: Boolean(m.triste) };
    return pixelar(dibujarMascota(datos), 20, 16, { clave: `mascota-mapa-${m.especie}-${m.etapa.clave}-${datos.triste}` });
}

// Todas las criaturas a la vez (para el bestiario): { esqueleto: "data:image/png…", … }
export async function spritesDeCriaturas() {
    const imagenes = await Promise.all(ORDEN.map(spriteDeMonstruo));
    return Object.fromEntries(ORDEN.map((id, i) => [id, imagenes[i]]));
}
