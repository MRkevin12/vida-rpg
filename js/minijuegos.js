// minijuegos.js — Tres minijuegos con tu avatar, dibujados en un <canvas>.
//
// Un <canvas> es un lienzo en el que JavaScript dibuja cuadro por cuadro
// (unas 60 veces por segundo). Cada juego es un objeto con:
//   actualizar(dt)  → mueve todo (dt = segundos desde el cuadro anterior)
//   dibujar(g)      → pinta todo en el lienzo (g = "contexto" de dibujo)
//   tocar(x, y)     → cuando tocas la pantalla
//   mover(x)        → cuando deslizas el dedo
//   marcador()      → el texto de arriba (puntos, tiempo…)
// La función jugar() hace el ciclo de cuadros, ajusta el tamaño y escucha los toques.

const ORO = "#fbbf24";


// ===== Ayudantes =====

// Carga una imagen desde una dirección (devuelve null si no se pudo).
function cargarImagen(direccion) {
    return new Promise((resolver) => {
        const imagen = new Image();
        imagen.onload = () => resolver(imagen);
        imagen.onerror = () => resolver(null);
        imagen.src = direccion;
    });
}

// Convierte un dibujo SVG (texto) en una imagen que el canvas puede pintar.
function imagenDeSvg(svg) {
    return cargarImagen("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
}

// Dibujar un SVG en cada cuadro es muy lento (el navegador lo vuelve a "calcular"
// cada vez). Por eso lo pintamos UNA sola vez en un lienzo escondido (un mapa de
// bits) y en el juego copiamos ese lienzo, que es rapidísimo.
function aMapaDeBits(imagen, ancho, alto) {
    if (!imagen) return null;
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext("2d").drawImage(imagen, 0, 0, ancho, alto);
    return lienzo;
}

function dibujarImagen(g, imagen, x, y, ancho, alto) {
    if (imagen) {
        g.drawImage(imagen, x, y, ancho, alto);
    } else {   // si la imagen no cargó, al menos un rectángulo
        g.fillStyle = "#8b5cf6";
        g.fillRect(x, y, ancho, alto);
    }
}

// ¿Se tocan dos rectángulos? { x, y, w, h }
function choca(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function azar(min, max) {
    return min + Math.random() * (max - min);
}

function elegir(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function cielo(g, ancho, alto, arriba, abajo) {
    const degradado = g.createLinearGradient(0, 0, 0, alto);
    degradado.addColorStop(0, arriba);
    degradado.addColorStop(1, abajo);
    g.fillStyle = degradado;
    g.fillRect(0, 0, ancho, alto);
}

// Rectángulo con esquinas redondeadas (dibujado a mano para que funcione en todos los iPhone).
function rectRedondo(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
}

function moneda(g, x, y, r) {
    g.fillStyle = ORO;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#b45309";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#fde68a";
    g.beginPath();
    g.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2);
    g.fill();
}

function gema(g, x, y, r) {
    g.fillStyle = "#22d3ee";
    g.beginPath();
    g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y);
    g.closePath();
    g.fill();
    g.strokeStyle = "#0e7490";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "rgba(255,255,255,.65)";
    g.beginPath();
    g.moveTo(x, y - r); g.lineTo(x + r * 0.45, y - r * 0.2); g.lineTo(x, y);
    g.closePath();
    g.fill();
}

function bomba(g, x, y, r, tiempo) {
    g.strokeStyle = "#a16207";
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x + r * 0.5, y - r * 0.7);
    g.quadraticCurveTo(x + r, y - r * 1.5, x + r * 1.2, y - r * 1.3);
    g.stroke();
    g.fillStyle = Math.sin(tiempo * 30) > 0 ? "#fde047" : "#f97316";   // chispa que parpadea
    g.beginPath();
    g.arc(x + r * 1.2, y - r * 1.3, 3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1f2937";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.35)";
    g.beginPath();
    g.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    g.fill();
}

// Obstáculos de la carrera: rocas, cristales oscuros y espectros.
// o = { x (borde izquierdo), t (tamaño), tipo }; se apoyan sobre el suelo.
function obstaculo(g, o, suelo, tiempo) {
    const { x, t } = o;
    const p = (fx, fy) => [x + fx * t, suelo - fy * t];   // punto relativo al obstáculo
    const poligono = (puntos, relleno, borde) => {
        g.beginPath();
        puntos.forEach(([fx, fy], i) => (i ? g.lineTo(...p(fx, fy)) : g.moveTo(...p(fx, fy))));
        g.closePath();
        g.fillStyle = relleno;
        g.fill();
        if (borde) { g.strokeStyle = borde; g.lineWidth = 1.5; g.stroke(); }
    };

    if (o.tipo === "roca") {
        poligono([[0.04, 0], [0.18, 0.55], [0.44, 0.92], [0.76, 0.68], [0.96, 0]], "#3f3a55", "#15121f");
        poligono([[0.18, 0.55], [0.44, 0.92], [0.5, 0.3]], "#5a5478");
    } else if (o.tipo === "cristales") {
        poligono([[0.08, 0], [0.28, 0.88], [0.46, 0]], "#2e1065", "#12081f");
        poligono([[0.36, 0], [0.6, 1], [0.78, 0]], "#3b1a7a", "#12081f");
        poligono([[0.66, 0], [0.86, 0.62], [0.98, 0]], "#2e1065", "#12081f");
        poligono([[0.6, 1], [0.66, 0.3], [0.56, 0.3]], "#7c3aed");
    } else {
        // Espectro: una sombra encapuchada con ojos rojos que brillan.
        g.beginPath();
        g.moveTo(...p(0.14, 0));
        g.quadraticCurveTo(...p(0.04, 0.62), ...p(0.5, 0.98));
        g.quadraticCurveTo(...p(0.96, 0.62), ...p(0.86, 0));
        g.quadraticCurveTo(...p(0.74, 0.14), ...p(0.62, 0));
        g.quadraticCurveTo(...p(0.5, 0.14), ...p(0.38, 0));
        g.quadraticCurveTo(...p(0.26, 0.14), ...p(0.14, 0));
        g.closePath();
        g.fillStyle = "#0b0816";
        g.fill();
        g.strokeStyle = "#4c1d95";
        g.lineWidth = 1.5;
        g.stroke();
        g.save();
        g.shadowColor = "#ef4444";
        g.shadowBlur = 8;
        g.fillStyle = Math.sin(tiempo * 5 + x) > -0.6 ? "#ef4444" : "#7f1d1d";   // parpadea
        for (const fx of [0.38, 0.62]) {
            g.beginPath();
            g.arc(...p(fx, 0.6), t * 0.055, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }
}

// Textos que suben y se desvanecen ("+5", "¡CRÍTICO!").
function crearTextos() {
    let lista = [];
    return {
        agregar(texto, x, y, color = ORO, tamano = 18) {
            lista.push({ texto, x, y, color, tamano, vida: 1 });
        },
        actualizar(dt) {
            for (const t of lista) {
                t.vida -= dt * 1.1;
                t.y -= 38 * dt;
            }
            lista = lista.filter((t) => t.vida > 0);
        },
        dibujar(mundo) {
            const g = mundo.capaTexto || mundo;   // (v96) el texto va en su capa, nítido (ver jugar)
            g.textAlign = "center";
            for (const t of lista) {
                g.globalAlpha = Math.max(0, t.vida);
                g.font = `700 ${t.tamano}px DotGothic16, Orbitron, sans-serif`;
                g.lineWidth = 4;
                g.lineJoin = "miter";
                g.strokeStyle = "#140c22";
                g.strokeText(t.texto, t.x, t.y);
                g.fillStyle = t.color;
                g.fillText(t.texto, t.x, t.y);
            }
            g.globalAlpha = 1;
        },
    };
}

// Cartel de pausa encima del juego.
function cartel(mundo, ancho, alto, titulo, subtitulo) {
    const g = mundo.capaTexto || mundo;   // (v96) en la capa de texto
    g.fillStyle = "rgba(5,3,12,.65)";
    g.fillRect(0, 0, ancho, alto);
    g.textAlign = "center";
    g.fillStyle = "#fff";
    g.font = "700 28px DotGothic16, Orbitron, sans-serif";
    g.fillText(titulo, ancho / 2, alto / 2);
    g.font = "400 16px DotGothic16, -apple-system, system-ui, sans-serif";
    g.fillStyle = "#c4b5fd";
    g.fillText(subtitulo, ancho / 2, alto / 2 + 28);
}


// ===== El ciclo del juego =====

// tipo: "carrera" | "lluvia" | "golpe"
// pixel: para "Golpe preciso", las imágenes en pixel art de la batalla (ver sprites.js):
//        { heroe, rival, sala (direcciones de las imágenes), nombre (el de la criatura) }
// alTerminar(puntos) se llama una sola vez cuando acaba la partida.
// sonar(nombre) reproduce un sonido (app.js decide si el sonido está encendido).
// ventajas: lo que te da tu equipo (ver arcade.ventajasDelEquipo): escudos, vidas, fuerza, zona y suerte.
export async function jugar(tipo, { lienzo, avatarSvg, pixel = null, marcador, ayuda, alTerminar, sonar = () => {},
                                    ventajas = { escudos: 0, vidasExtra: 0, fuerza: 1, zona: 1, suerte: 1 } }) {
    const crear = { carrera, lluvia, golpe }[tipo];

    // Preparamos las imágenes: tu avatar (convertido a mapa de bits) y, en "Golpe preciso",
    // las de la batalla en pixel art.
    const conEscena = tipo === "golpe" && pixel;
    const [svgHeroe, miHeroe, rival, sala] = await Promise.all([
        imagenDeSvg(avatarSvg),
        conEscena ? cargarImagen(pixel.heroe) : null,
        conEscena ? cargarImagen(pixel.rival) : null,
        conEscena ? cargarImagen(pixel.sala) : null,
    ]);
    const escena = conEscena ? { heroe: miHeroe, rival, sala, nombre: pixel.nombre } : null;
    const heroe = aMapaDeBits(svgHeroe, 300, 400);   // el avatar de batalla mide 126 × 168 (proporción 3:4)

    // El lienzo mide lo mismo que en pantalla, multiplicado por la densidad
    // de píxeles (devicePixelRatio) para que se vea nítido. La limitamos a 2:
    // se ve igual de bien y el teléfono pinta menos de la mitad de píxeles (ahorra batería).
    const ancho = lienzo.clientWidth;
    const alto = lienzo.clientHeight;
    // (v96) Pixel art: el mundo se pinta a la MITAD de resolución (un punto = 2 px de pantalla) y el CSS lo
    // agranda sin suavizar (image-rendering: pixelated). Los juegos siguen pensando en px de pantalla:
    // setTransform achica todo lo que dibujan.
    const PUNTO = 2;
    lienzo.width = Math.round(ancho / PUNTO);
    lienzo.height = Math.round(alto / PUNTO);
    const g = lienzo.getContext("2d");
    g.setTransform(1 / PUNTO, 0, 0, 1 / PUNTO, 0, 0);
    // El texto, en cambio, a resolución completa (si no, no se leería): va en otro lienzo, encima y transparente.
    // La densidad de píxeles se limita a 2 (se ve igual de bien y ahorra batería).
    const escala = Math.min(2, window.devicePixelRatio || 1);
    const capa = document.createElement("canvas");
    capa.className = "minijuego-texto";
    capa.width = Math.round(ancho * escala);
    capa.height = Math.round(alto * escala);
    capa.style.cssText = `left: ${lienzo.offsetLeft + lienzo.clientLeft}px; top: ${lienzo.offsetTop + lienzo.clientTop}px; width: ${ancho}px; height: ${alto}px`;
    lienzo.after(capa);
    const gt = capa.getContext("2d");
    gt.setTransform(escala, 0, 0, escala, 0, 0);
    g.capaTexto = gt;

    const juego = crear({ ancho, alto, heroe, escena, sonar, ventajas });
    ayuda.textContent = juego.ayuda;

    let anterior = performance.now();
    let terminado = false;
    let pausado = false;

    function cuadro(ahora) {
        if (terminado) return;
        // dt máximo de 0,05 s: si el teléfono se traba, el juego no "salta".
        const dt = Math.min(0.05, (ahora - anterior) / 1000);
        anterior = ahora;
        if (!pausado) juego.actualizar(dt);
        gt.clearRect(0, 0, ancho, alto);   // la capa de texto se limpia en cada cuadro
        juego.dibujar(g);
        if (pausado) cartel(g, ancho, alto, "Pausa", "Toca para seguir");
        marcador.textContent = juego.marcador();
        if (juego.termino) {
            terminar(900);   // un momento para ver qué pasó
            return;
        }
        requestAnimationFrame(cuadro);
    }

    function terminar(demora) {
        if (terminado) return;
        terminado = true;
        setTimeout(() => capa.remove(), demora);   // (v96) la capa de texto se va con el juego
        lienzo.removeEventListener("pointerdown", alTocar);
        lienzo.removeEventListener("pointermove", alMover);
        document.removeEventListener("keydown", alTeclear);
        document.removeEventListener("visibilitychange", alOcultar);
        setTimeout(() => alTerminar(Math.round(juego.puntos)), demora);
    }

    const posicion = (evento) => {
        const caja = lienzo.getBoundingClientRect();
        return { x: evento.clientX - caja.left, y: evento.clientY - caja.top };
    };
    function alTocar(evento) {
        evento.preventDefault();
        if (pausado) {
            pausado = false;
            anterior = performance.now();
            return;
        }
        const p = posicion(evento);
        juego.mover?.(p.x);
        juego.tocar?.(p.x, p.y);
    }
    function alMover(evento) {
        juego.mover?.(posicion(evento).x);
    }
    function alTeclear(evento) {   // en la compu: barra espaciadora
        if (evento.key === " ") {
            evento.preventDefault();
            juego.tocar?.(ancho / 2, alto / 2);
        }
    }
    function alOcultar() {          // si sales de la app, el juego se pausa
        if (document.hidden) pausado = true;
    }

    lienzo.addEventListener("pointerdown", alTocar);
    lienzo.addEventListener("pointermove", alMover);
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("visibilitychange", alOcultar);
    requestAnimationFrame(cuadro);

    // Para salir antes de tiempo (cuenta los puntos que llevabas).
    return { detener: () => terminar(0) };
}


// ===== Juego 1: Carrera del héroe =====

function carrera({ ancho, alto, heroe, sonar, ventajas }) {
    // f agranda todo si el lienzo es alto, para que el héroe no se vea diminuto.
    // El salto también se escala, así que dura lo mismo y sube en proporción.
    const f = Math.max(1, alto / 300);
    const suelo = alto - 36;
    const hw = 54 * f;                   // tamaño del héroe en pantalla
    const hh = 72 * f;
    const pies = hh * 0.92;              // dónde quedan los pies dentro del dibujo
    const h = { x: 34, y: suelo - pies, vy: 0, enSuelo: true };
    const obstaculos = [];
    const monedas = [];
    const textos = crearTextos();
    const estrellas = Array.from({ length: 28 }, () => ({ x: azar(0, ancho), y: azar(0, suelo - 70), r: azar(0.6, 1.8) }));
    let velocidad = 230;
    let tiempo = 0;
    let distancia = 0;
    let recorrido = 0;
    let recogidas = 0;
    let puntosMonedas = 0;
    let escudos = ventajas.escudos;   // tu armadura: cada escudo aguanta un choque
    let invencible = 0;               // segundos sin poder chocar (después de usar un escudo)
    const valorMoneda = Math.round(5 * ventajas.suerte);
    let proximo = 1.3;
    let proximaMoneda = 1.6;

    const juego = {
        ayuda: "Toca la pantalla para saltar los obstáculos. Atrapa las monedas.",
        puntos: 0,
        termino: false,
        tocar() {
            if (h.enSuelo && !juego.termino) {
                h.vy = -780 * f;
                h.enSuelo = false;
                sonar("salto");
            }
        },
        actualizar(dt) {
            tiempo += dt;
            invencible = Math.max(0, invencible - dt);
            velocidad = Math.min(560, 230 + tiempo * 9);   // cada vez más rápido
            recorrido += velocidad * dt;
            distancia += (velocidad * dt) / 10;

            // Salto: la gravedad tira hacia abajo hasta tocar el suelo.
            h.vy += 2300 * f * dt;
            h.y += h.vy * dt;
            if (h.y >= suelo - pies) {
                h.y = suelo - pies;
                h.vy = 0;
                h.enSuelo = true;
            }

            proximo -= dt;
            if (proximo <= 0) {
                obstaculos.push({ x: ancho + 20, t: azar(36, 54) * f, tipo: elegir(["roca", "cristales", "espectro"]) });
                proximo = azar(0.75, 1.7) * (320 / velocidad) + 0.3;
            }
            proximaMoneda -= dt;
            if (proximaMoneda <= 0) {
                monedas.push({ x: ancho + 20, y: suelo - azar(60, 140) * f });
                proximaMoneda = azar(0.9, 2.2);
            }
            for (const o of obstaculos) o.x -= velocidad * dt;
            for (const m of monedas) m.x -= velocidad * dt;

            // Choques (las cajas son un poco más chicas que el dibujo, para ser justos).
            const caja = { x: h.x + 14, y: h.y + 10, w: hw - 28, h: pies - 14 };
            for (const o of obstaculos) {
                const c = { x: o.x + o.t * 0.2, y: suelo - o.t * 0.78, w: o.t * 0.6, h: o.t * 0.72 };
                if (juego.termino || o.roto || invencible > 0 || !choca(caja, c)) continue;
                if (escudos > 0) {
                    // Tu armadura aguanta el golpe: el obstáculo se rompe y sigues corriendo.
                    escudos -= 1;
                    invencible = 1.2;
                    o.roto = true;
                    sonar("impacto");
                    textos.agregar("🛡️ ¡Bloqueado!", h.x + hw / 2, h.y, "#67e8f9", 20);
                } else {
                    juego.termino = true;
                    sonar("fallo");
                    textos.agregar("¡AY!", h.x + hw / 2, h.y, "#fb7185", 24);
                }
            }
            for (const m of monedas) {
                if (!m.tomada && choca(caja, { x: m.x - 10, y: m.y - 10, w: 20, h: 20 })) {
                    m.tomada = true;
                    recogidas += 1;
                    puntosMonedas += valorMoneda;
                    sonar("moneda");
                    textos.agregar(`+${valorMoneda}`, m.x, m.y - 10);
                }
            }

            // Quitar lo que ya salió de la pantalla.
            for (let i = obstaculos.length - 1; i >= 0; i--) {
                if (obstaculos[i].x < -80) obstaculos.splice(i, 1);
            }
            for (let i = monedas.length - 1; i >= 0; i--) {
                if (monedas[i].x < -30 || monedas[i].tomada) monedas.splice(i, 1);
            }
            textos.actualizar(dt);
            juego.puntos = Math.floor(distancia) + puntosMonedas;
        },
        dibujar(g) {
            cielo(g, ancho, alto, "#1e1b4b", "#3b0764");
            // Estrellas y colinas que se mueven más lento (efecto de profundidad).
            g.fillStyle = "#fff";
            for (const e of estrellas) {
                g.globalAlpha = 0.6;
                g.beginPath();
                g.arc((((e.x - recorrido * 0.03) % ancho) + ancho) % ancho, e.y, e.r, 0, Math.PI * 2);
                g.fill();
            }
            g.globalAlpha = 1;
            g.fillStyle = "#2e1065";
            g.beginPath();
            g.moveTo(0, suelo);
            for (let x = 0; x <= ancho; x += 10) {
                g.lineTo(x, suelo - 46 - 20 * Math.sin((x + recorrido * 0.25) / 55));
            }
            g.lineTo(ancho, suelo);
            g.closePath();
            g.fill();

            // Suelo con rayas que avanzan.
            g.fillStyle = "#1c1336";
            g.fillRect(0, suelo, ancho, alto - suelo);
            g.fillStyle = "#8b5cf6";
            g.fillRect(0, suelo, ancho, 3);
            g.fillStyle = "rgba(139,92,246,.35)";
            for (let x = -(recorrido % 40); x < ancho; x += 40) g.fillRect(x, suelo + 14, 18, 3);

            for (const m of monedas) moneda(g, m.x, m.y + Math.sin(tiempo * 6 + m.x) * 3, 9);
            for (const o of obstaculos) if (!o.roto) obstaculo(g, o, suelo, tiempo);
            // Después de un choque bloqueado, el héroe parpadea dentro de una burbuja de luz.
            if (invencible > 0) {
                g.strokeStyle = "rgba(103,232,249,.75)";
                g.lineWidth = 3;
                g.beginPath();
                g.arc(h.x + hw / 2, h.y + hh * 0.5, hh * 0.55, 0, Math.PI * 2);
                g.stroke();
                g.globalAlpha = Math.floor(invencible * 10) % 2 ? 0.45 : 1;
            }
            dibujarImagen(g, heroe, h.x, h.y, hw, hh);
            g.globalAlpha = 1;
            textos.dibujar(g);
        },
        marcador() {
            return `🏃 ${juego.puntos} pts · 🪙 ${recogidas}${escudos ? ` · 🛡️ ${escudos}` : ""}`;
        },
    };
    return juego;
}


// ===== Juego 2: Lluvia de monedas =====

function lluvia({ ancho, alto, heroe, sonar, ventajas }) {
    const hw = 60;
    const hh = 80;
    const piso = alto - 6;
    const h = { x: ancho / 2 - hw / 2, objetivo: ancho / 2 - hw / 2 };
    const cosas = [];
    const textos = crearTextos();
    const TIPOS = [
        { tipo: "moneda", valor: 1, probabilidad: 60 },
        { tipo: "gema", valor: 5, probabilidad: 12 },
        { tipo: "bomba", valor: 0, probabilidad: 28 },
    ];
    let restante = 30;
    let vidas = 3 + ventajas.vidasExtra;   // tu armadura te da corazones de más
    let proximo = 0.5;
    let transcurrido = 0;
    let temblor = 0;

    function tipoAlAzar() {
        let numero = Math.random() * 100;
        for (const t of TIPOS) {
            if (numero < t.probabilidad) return t;
            numero -= t.probabilidad;
        }
        return TIPOS[0];
    }

    const juego = {
        ayuda: "Desliza el dedo para mover a tu héroe. Atrapa 🪙 y 💎, esquiva las 💣.",
        puntos: 0,
        termino: false,
        mover(x) {
            h.objetivo = Math.max(0, Math.min(ancho - hw, x - hw / 2));
        },
        actualizar(dt) {
            restante -= dt;
            transcurrido += dt;
            temblor = Math.max(0, temblor - dt);
            h.x += (h.objetivo - h.x) * Math.min(1, dt * 12);   // se desliza suave hacia el dedo

            proximo -= dt;
            if (proximo <= 0) {
                cosas.push({ ...tipoAlAzar(), x: azar(14, ancho - 14), y: -20, v: azar(140, 220) + transcurrido * 6 });
                proximo = Math.max(0.22, 0.55 - transcurrido * 0.011);   // cada vez llueve más
            }

            const caja = { x: h.x + 8, y: piso - hh + 8, w: hw - 16, h: hh - 8 };
            for (const c of cosas) {
                c.y += c.v * dt;
                if (!c.tomada && choca(caja, { x: c.x - 11, y: c.y - 11, w: 22, h: 22 })) {
                    c.tomada = true;
                    if (c.tipo === "bomba") {
                        vidas -= 1;
                        sonar("impacto");
                        temblor = 0.35;
                        textos.agregar("💥", c.x, c.y, "#fb7185", 26);
                    } else {
                        const valor = Math.round(c.valor * ventajas.suerte);   // la suerte hace que valgan más
                        juego.puntos += valor;
                        sonar("moneda");
                        textos.agregar(`+${valor}`, c.x, c.y - 8, c.tipo === "gema" ? "#67e8f9" : ORO);
                    }
                }
            }
            for (let i = cosas.length - 1; i >= 0; i--) {
                if (cosas[i].tomada || cosas[i].y > alto + 30) cosas.splice(i, 1);
            }
            textos.actualizar(dt);
            if (restante <= 0 || vidas <= 0) {
                restante = Math.max(0, restante);
                juego.termino = true;
            }
        },
        dibujar(g) {
            g.save();
            if (temblor > 0) g.translate(azar(-4, 4), azar(-4, 4));
            cielo(g, ancho, alto, "#0c1445", "#2e1065");
            const resplandor = g.createRadialGradient(ancho / 2, 0, 10, ancho / 2, 0, ancho * 0.8);
            resplandor.addColorStop(0, "rgba(251,191,36,.18)");
            resplandor.addColorStop(1, "rgba(251,191,36,0)");
            g.fillStyle = resplandor;
            g.fillRect(0, 0, ancho, alto);
            for (const c of cosas) {
                if (c.tipo === "moneda") moneda(g, c.x, c.y, 11);
                else if (c.tipo === "gema") gema(g, c.x, c.y, 12);
                else bomba(g, c.x, c.y, 11, transcurrido);
            }
            g.fillStyle = "#1c1336";
            g.fillRect(0, piso, ancho, alto - piso);
            dibujarImagen(g, heroe, h.x, piso - hh, hw, hh);
            textos.dibujar(g);
            g.restore();
        },
        marcador() {
            return `⏱ ${Math.ceil(restante)} s · ${"❤️".repeat(Math.max(0, vidas))} · ⭐ ${juego.puntos}`;
        },
    };
    return juego;
}


// ===== Juego 3: Golpe preciso =====
// Se ve como una batalla de la Torre: la sala arriba (en pixel art), con una criatura a la
// izquierda y tu héroe a la derecha; debajo, la barra de poder.
// escena = { heroe, rival, sala (imágenes en pixel art), nombre (el de la criatura) } o null.

function golpe({ ancho, alto, heroe, escena, sonar, ventajas }) {
    const RONDAS = 5;
    const VIDA = 300;
    // Qué tan cerca del centro tocaste. La magia de tu equipo agranda las zonas y el ataque
    // hace que cada golpe quite más.
    const ZONAS = [
        { radio: 0.03, valor: 100, texto: "¡CRÍTICO!", color: ORO },
        { radio: 0.09, valor: 60, texto: "¡Genial!", color: "#34d399" },
        { radio: 0.18, valor: 30, texto: "Bien", color: "#67e8f9" },
    ].map((z) => ({ ...z, radio: Math.min(0.3, z.radio * ventajas.zona), valor: Math.round(z.valor * ventajas.fuerza) }));

    // La sala mide 192 × 128 puntos. "px" es cuánto mide en pantalla cada punto: lo más grande
    // que quepa a lo ancho, dejando abajo sitio para la barra.
    const img = escena || {};
    const px = Math.min(ancho / 192, (alto - 104) / 128);
    const sala = { x: (ancho - 192 * px) / 2, ancho: 192 * px, alto: 128 * px };
    const suelo = sala.alto - 10 * px;                       // donde pisan
    const barra = { x: 22, y: sala.alto + (alto - sala.alto) / 2, w: ancho - 44, h: 22 };
    // El rival, a la izquierda (su imagen ya viene en puntos); tu héroe (54 × 72 puntos), a la derecha.
    const rival = { w: (img.rival ? img.rival.width : 88) * px, h: (img.rival ? img.rival.height : 88) * px, x: sala.x + 62 * px };
    const yo = { w: 54 * px, h: 72 * px, x: sala.x + 160 * px };
    const textos = crearTextos();
    let ronda = 0;
    let marca = 0;          // posición de la marca: de 0 (izquierda) a 1 (derecha)
    let direccion = 1;
    let rapidez = 0.85;
    let espera = 0;
    let vida = VIDA;
    let embestida = 0;
    let temblor = 0;
    let final = false;

    const juego = {
        ayuda: "Toca cuando la marca blanca esté en el centro dorado. Tienes 5 golpes contra una criatura de la Torre.",
        puntos: 0,
        termino: false,
        tocar() {
            if (espera > 0 || final) return;
            const distancia = Math.abs(marca - 0.5);
            const zona = ZONAS.find((z) => distancia <= z.radio);
            const valor = zona ? zona.valor : 0;
            juego.puntos += valor;
            vida = Math.max(0, vida - valor);
            textos.agregar(zona ? zona.texto : "Fallaste", ancho / 2, sala.alto * 0.24,
                           zona ? zona.color : "#94a3b8", zona === ZONAS[0] ? 26 : 20);
            sonar(valor ? "impacto" : "fallo");
            if (valor) {
                textos.agregar(`${valor}`, rival.x, suelo - rival.h * 0.55, "#fff", 20);
                temblor = 0.4;
            }
            embestida = 0.4;
            ronda += 1;
            rapidez *= 1.2;      // cada golpe la marca va más rápido
            espera = 0.9;
            if (vida === 0) {
                juego.puntos += 50;
                textos.agregar("¡K.O.! +50", ancho / 2, sala.alto * 0.42, ORO, 24);
                final = true;
            }
            if (ronda >= RONDAS) final = true;
        },
        actualizar(dt) {
            embestida = Math.max(0, embestida - dt);
            temblor = Math.max(0, temblor - dt);
            textos.actualizar(dt);
            if (espera > 0) {
                espera -= dt;
                if (espera <= 0 && final) juego.termino = true;
                return;
            }
            marca += direccion * rapidez * dt;   // la marca va y viene
            if (marca >= 1) { marca = 1; direccion = -1; }
            if (marca <= 0) { marca = 0; direccion = 1; }
        },
        dibujar(g) {
            g.fillStyle = "#0b0816";
            g.fillRect(0, 0, ancho, alto);

            // --- La sala, en pixel art: se agranda SIN suavizar para que se vean los puntos ---
            g.imageSmoothingEnabled = false;
            if (img.sala) g.drawImage(img.sala, sala.x, 0, sala.ancho, sala.alto);
            else cielo(g, ancho, sala.alto, "#1b1033", "#120a24");

            // Sombras en el suelo.
            g.fillStyle = "rgba(5,3,12,.5)";
            for (const quien of [rival, yo]) {
                g.beginPath();
                g.ellipse(quien.x, suelo + 1.5 * px, quien.w * 0.36, 4 * px, 0, 0, Math.PI * 2);
                g.fill();
            }

            // El rival: al recibir el golpe tiembla y parpadea; vencido, se apaga.
            const sacudida = temblor > 0 ? azar(-4, 4) : 0;
            const parpadea = temblor > 0.16 && Math.floor(temblor * 18) % 2 === 0;
            if (!parpadea) {
                g.globalAlpha = vida === 0 ? 0.3 : 1;
                if (img.rival) g.drawImage(img.rival, rival.x - rival.w / 2 + sacudida, suelo - rival.h, rival.w, rival.h);
                else { g.fillStyle = "#3a2c4c"; g.fillRect(rival.x - rival.w / 2, suelo - rival.h, rival.w, rival.h); }
                g.globalAlpha = 1;
            }

            // Tu héroe: da un paso hacia el rival al golpear.
            const avance = embestida > 0 ? Math.sin((embestida / 0.4) * Math.PI) * 20 * px : 0;
            if (img.heroe) g.drawImage(img.heroe, yo.x - yo.w / 2 - avance, suelo - 2 * px - yo.h, yo.w, yo.h);
            else dibujarImagen(g, heroe, yo.x - yo.w / 2 - avance, suelo - yo.h, yo.w, yo.h);
            g.imageSmoothingEnabled = true;

            // El tajo: dos cortes blancos sobre el rival.
            if (temblor > 0.22) {
                g.strokeStyle = "#fff";
                g.lineWidth = 2 * px;
                g.beginPath();
                g.moveTo(rival.x + rival.w * 0.3, suelo - rival.h * 0.9); g.lineTo(rival.x - rival.w * 0.3, suelo - rival.h * 0.2);
                g.moveTo(rival.x + rival.w * 0.42, suelo - rival.h * 0.78); g.lineTo(rival.x - rival.w * 0.12, suelo - rival.h * 0.14);
                g.stroke();
            }

            // El marco blanco de la escena.
            g.strokeStyle = "#f1f3ff";
            g.lineWidth = 2;
            rectRedondo(g, Math.max(1, sala.x + 1), 1, Math.min(ancho, sala.ancho) - 2, sala.alto - 2, 8);
            g.stroke();

            // Ventana azul con el nombre y la vida del rival (como las de la Torre).
            const ventana = { x: Math.max(8, sala.x + 8), y: 8, w: Math.min(176, ancho * 0.52), h: 36 };
            const azul = g.createLinearGradient(0, ventana.y, 0, ventana.y + ventana.h);
            azul.addColorStop(0, "#3350c8");
            azul.addColorStop(1, "#0a1258");
            g.fillStyle = azul;
            rectRedondo(g, ventana.x, ventana.y, ventana.w, ventana.h, 7);
            g.fill();
            g.strokeStyle = "#f1f3ff";
            g.stroke();
            const gt = g.capaTexto || g;   // (v96) el nombre, nítido en la capa de texto
            gt.textAlign = "left";
            gt.font = "400 13px DotGothic16, -apple-system, system-ui, sans-serif";
            gt.fillStyle = "#fff";
            gt.fillText(img.nombre || "Criatura", ventana.x + 9, ventana.y + 15, ventana.w - 18);
            g.fillStyle = "#05072a";
            g.fillRect(ventana.x + 9, ventana.y + 22, ventana.w - 18, 6);
            g.fillStyle = "#e11d48";
            g.fillRect(ventana.x + 9, ventana.y + 22, (ventana.w - 18) * (vida / VIDA), 6);

            // --- La barra de poder: rojo (fallo), celeste (bien), verde (genial), dorado (crítico) ---
            g.fillStyle = "#3f1d2b";
            rectRedondo(g, barra.x, barra.y, barra.w, barra.h, 8);
            g.fill();
            for (const [radio, color] of [[ZONAS[2].radio, "#0e7490"], [ZONAS[1].radio, "#059669"], [ZONAS[0].radio, ORO]]) {
                g.fillStyle = color;
                g.fillRect(barra.x + barra.w * (0.5 - radio), barra.y, barra.w * radio * 2, barra.h);
            }
            const xm = barra.x + barra.w * marca;
            g.fillStyle = "#fff";
            g.fillRect(xm - 2, barra.y - 6, 4, barra.h + 12);
            g.beginPath();
            g.moveTo(xm - 8, barra.y - 12); g.lineTo(xm + 8, barra.y - 12); g.lineTo(xm, barra.y - 4);
            g.closePath();
            g.fill();

            textos.dibujar(g);
        },
        marcador() {
            return `🎯 ${juego.puntos} pts · Golpe ${Math.min(ronda + 1, RONDAS)}/${RONDAS}`;
        },
    };
    return juego;
}
