// sprites.js — Las imágenes en pixel art de la Torre: tu héroe, las criaturas y las salas.
//
// Un "sprite" es la imagen de un personaje en un videojuego. Aquí se arman a partir de
// los dibujos de la app (dibujo.js y dibujo-monstruos.js), pasados por pixel.js.
// Todas las funciones son asíncronas (se usan con await) y devuelven la dirección de la
// imagen, lista para ponerla en <img src="…">. pixel.js guarda cada una: la segunda vez
// que se pide la misma, sale al instante.

import { pixelar } from "./pixel.js";
import { dibujarAvatar } from "./dibujo.js";
import { dibujarMonstruo, dibujarSala, SALA } from "./dibujo-monstruos.js";
import { CRIATURAS, ORDEN } from "./bestiario.js";

export const HEROE = { ancho: 54, alto: 72 };   // el tamaño de tu héroe, en puntos

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

// La sala de una zona ("cripta", "biblioteca"…). Es un fondo: va sin contorno y con más colores.
export function spriteDeSala(zona) {
    return pixelar(dibujarSala(zona), SALA.ancho, SALA.alto, { clave: `sala-${zona}`, contorno: false, niveles: 20 });
}

// Todas las criaturas a la vez (para el bestiario): { esqueleto: "data:image/png…", … }
export async function spritesDeCriaturas() {
    const imagenes = await Promise.all(ORDEN.map(spriteDeMonstruo));
    return Object.fromEntries(ORDEN.map((id, i) => [id, imagenes[i]]));
}
