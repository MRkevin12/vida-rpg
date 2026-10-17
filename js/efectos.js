// efectos.js — Los efectos de las recompensas (v94): monedas que vuelan, números que cuentan y confeti.
//
// Solo dibujo: nada de aquí cambia la partida. app.js los llama después de cada acción
// (ver ejecutar()), comparando cuántas monedas, gemas y XP había antes y cuántas hay ahora.
//
// Las animaciones usan la "Web Animations API": elemento.animate([cuadros], { duración… }).
// Es como una animación de CSS, pero armada desde JavaScript (sirve cuando cada moneda
// tiene que ir a un lugar distinto, que depende de dónde tocaste).

import { icono } from "./iconos.js";

// Con «Reducir movimiento» activado en el teléfono no vuela nada (los números cambian igual).
const quieto = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Dónde tocaste la pantalla por última vez: de ahí salen las monedas.
let ultimoToque = null;
export function recordarToques() {
    document.addEventListener("pointerdown", (evento) => {
        ultimoToque = { x: evento.clientX, y: evento.clientY, cuando: Date.now() };
    }, { capture: true, passive: true });
}

function origen() {
    if (ultimoToque && Date.now() - ultimoToque.cuando < 3000) return ultimoToque;
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };   // si no, del centro
}

// La capa donde vuelan las cosas (encima de todo, sin tapar los toques).
function capa() {
    let caja = document.querySelector("#vuelos");
    if (!caja) {
        caja = document.createElement("div");
        caja.id = "vuelos";
        caja.setAttribute("aria-hidden", "true");
        document.body.append(caja);
    }
    return caja;
}

// Un número "al azar" pero repetible en una misma tanda (para repartir las monedas en abanico).
const azar = (i, n) => {
    const x = Math.sin(i * 91.7 + n * 47.3) * 43758.5453;
    return x - Math.floor(x);
};

// Hace volar `cuantos` íconos desde donde tocaste hasta `destino` (un elemento de la página).
// Primero saltan hacia afuera en abanico y después caen en el destino, uno detrás de otro.
// Al llegar cada uno, el destino da un saltito (clase "recibe").
export function volar(nombreIcono, cuantos, destino, { clase = "" } = {}) {
    if (!destino || quieto() || cuantos <= 0) return;
    const llegada = destino.getBoundingClientRect();
    if (!llegada.width) return;   // el destino está escondido
    const desde = origen();
    const hacia = { x: llegada.left + llegada.width / 2, y: llegada.top + llegada.height / 2 };
    const caja = capa();
    for (let i = 0; i < cuantos; i++) {
        const cosa = document.createElement("span");
        cosa.className = `vuelo ${clase}`;
        cosa.innerHTML = icono(nombreIcono);
        cosa.style.left = `${desde.x}px`;
        cosa.style.top = `${desde.y}px`;
        caja.append(cosa);
        // El abanico: un ángulo hacia arriba, entre −150° y −30°, y una distancia de 30 a 70 px.
        const angulo = (-150 + azar(i, 1) * 120) * (Math.PI / 180);
        const distancia = 30 + azar(i, 2) * 40;
        const [ax, ay] = [Math.cos(angulo) * distancia, Math.sin(angulo) * distancia];
        const [dx, dy] = [hacia.x - desde.x, hacia.y - desde.y];
        const animacion = cosa.animate([
            { transform: "translate(-50%, -50%) scale(0.4)", opacity: 0 },
            { transform: `translate(calc(-50% + ${ax}px), calc(-50% + ${ay}px)) scale(1.15)`, opacity: 1, offset: 0.28 },
            { transform: `translate(calc(-50% + ${ax * 0.6}px), calc(-50% + ${ay * 0.6 - 10}px)) scale(1)`, opacity: 1, offset: 0.42 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.75)`, opacity: 1, offset: 0.94 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, opacity: 0 },
        ], { duration: 820, delay: i * 70, easing: "cubic-bezier(0.45, 0, 0.55, 1)", fill: "backwards" });
        animacion.onfinish = () => {
            cosa.remove();
            destino.classList.remove("recibe");
            void destino.offsetWidth;   // reinicia la animación del saltito
            destino.classList.add("recibe");
        };
    }
}

// Cuántos íconos mandar según cuánto ganaste: 1 por cada `paso`, entre 1 y `maximo`.
export const cuantosPara = (cantidad, paso, maximo = 8) => Math.max(1, Math.min(maximo, Math.ceil(cantidad / paso)));

// El número de un elemento sube (o baja) contando, de `desde` a `hasta`.
const contando = new WeakMap();
export function contar(elemento, desde, hasta, { espera = 0, duracion = 900 } = {}) {
    if (!elemento || desde === hasta) return;
    if (quieto()) { elemento.textContent = hasta; return; }
    cancelAnimationFrame(contando.get(elemento));
    elemento.textContent = desde;
    const inicio = performance.now() + espera;
    const paso = (ahora) => {
        const t = Math.min(1, Math.max(0, (ahora - inicio) / duracion));
        const suave = 1 - Math.pow(1 - t, 3);   // empieza rápido y frena al final
        elemento.textContent = Math.round(desde + (hasta - desde) * suave);
        if (t < 1) contando.set(elemento, requestAnimationFrame(paso));
    };
    contando.set(elemento, requestAnimationFrame(paso));
}

// Confeti de cuadritos de colores que cae sobre un elemento (subir de nivel, vencer a un jefe).
const COLORES = ["#ffe45a", "#f5a524", "#8b5cf6", "#22d3ee", "#34d399", "#fb7185", "#ffffff"];
export function confeti(contenedor, cuantos = 42) {
    if (!contenedor || quieto()) return;
    contenedor.querySelector(".confeti")?.remove();
    const lluvia = document.createElement("div");
    lluvia.className = "confeti";
    lluvia.setAttribute("aria-hidden", "true");
    lluvia.innerHTML = Array.from({ length: cuantos }, (_, i) =>
        `<i style="--x: ${(azar(i, 3) * 100).toFixed(1)}%; --c: ${COLORES[i % COLORES.length]}; --t: ${(1.6 + azar(i, 4) * 1.6).toFixed(2)}s; ` +
        `--d: ${(azar(i, 5) * 0.6).toFixed(2)}s; --g: ${Math.round(-200 + azar(i, 6) * 400)}deg; --s: ${azar(i, 7) < 0.3 ? 9 : 6}px; --v: ${Math.round(-30 + azar(i, 8) * 60)}px"></i>`).join("");
    contenedor.append(lluvia);
    setTimeout(() => lluvia.remove(), 3800);
}
