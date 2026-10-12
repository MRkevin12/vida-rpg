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
        dibujar(g) {
            g.textAlign = "center";
            for (const t of lista) {
                g.globalAlpha = Math.max(0, t.vida);
                g.font = `800 ${t.tamano}px Orbitron, sans-serif`;
                g.lineWidth = 3;
                g.strokeStyle = "rgba(0,0,0,.6)";
                g.strokeText(t.texto, t.x, t.y);
                g.fillStyle = t.color;
                g.fillText(t.texto, t.x, t.y);
            }
            g.globalAlpha = 1;
        },
    };
}

// Cartel de pausa encima del juego.
function cartel(g, ancho, alto, titulo, subtitulo) {
    g.fillStyle = "rgba(5,3,12,.65)";
    g.fillRect(0, 0, ancho, alto);
    g.textAlign = "center";
    g.fillStyle = "#fff";
    g.font = "800 28px Orbitron, sans-serif";
    g.fillText(titulo, ancho / 2, alto / 2);
    g.font = "600 15px -apple-system, system-ui, sans-serif";
    g.fillStyle = "#c4b5fd";
    g.fillText(subtitulo, ancho / 2, alto / 2 + 28);
}


// ===== El ciclo del juego =====

// tipo: "carrera" | "lluvia" | "golpe"
// retratos: direcciones de las pinturas de tus jefes (para "Golpe preciso")
// alTerminar(puntos) se llama una sola vez cuando acaba la partida.
// sonar(nombre) reproduce un sonido (app.js decide si el sonido está encendido).
export async function jugar(tipo, { lienzo, avatarSvg, retratos = [], marcador, ayuda, alTerminar, sonar = () => {} }) {
    const crear = { carrera, lluvia, golpe }[tipo];

    // Preparamos las imágenes: tu avatar (convertido a mapa de bits) y el retrato de un jefe.
    const [svgHeroe, rival] = await Promise.all([
        imagenDeSvg(avatarSvg),
        tipo === "golpe" && retratos.length ? cargarImagen(elegir(retratos)) : null,
    ]);
    const heroe = aMapaDeBits(svgHeroe, 300, 400);   // el avatar de batalla mide 126 × 168 (proporción 3:4)

    // El lienzo mide lo mismo que en pantalla, multiplicado por la densidad
    // de píxeles (devicePixelRatio) para que se vea nítido. La limitamos a 2:
    // se ve igual de bien y el teléfono pinta menos de la mitad de píxeles (ahorra batería).
    const ancho = lienzo.clientWidth;
    const alto = lienzo.clientHeight;
    const escala = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);
    const g = lienzo.getContext("2d");
    g.setTransform(escala, 0, 0, escala, 0, 0);

    const juego = crear({ ancho, alto, heroe, rival, sonar });
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

function carrera({ ancho, alto, heroe, sonar }) {
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
                if (!juego.termino && choca(caja, c)) {
                    juego.termino = true;
                    sonar("fallo");
                    textos.agregar("¡AY!", h.x + hw / 2, h.y, "#fb7185", 24);
                }
            }
            for (const m of monedas) {
                if (!m.tomada && choca(caja, { x: m.x - 10, y: m.y - 10, w: 20, h: 20 })) {
                    m.tomada = true;
                    recogidas += 1;
                    sonar("moneda");
                    textos.agregar("+5", m.x, m.y - 10);
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
            juego.puntos = Math.floor(distancia) + recogidas * 5;
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
            for (const o of obstaculos) obstaculo(g, o, suelo, tiempo);
            dibujarImagen(g, heroe, h.x, h.y, hw, hh);
            textos.dibujar(g);
        },
        marcador() {
            return `🏃 ${juego.puntos} pts · 🪙 ${recogidas}`;
        },
    };
    return juego;
}


// ===== Juego 2: Lluvia de monedas =====

function lluvia({ ancho, alto, heroe, sonar }) {
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
    let vidas = 3;
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
                        juego.puntos += c.valor;
                        sonar("moneda");
                        textos.agregar(`+${c.valor}`, c.x, c.y - 8, c.tipo === "gema" ? "#67e8f9" : ORO);
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

function golpe({ ancho, alto, heroe, rival, sonar }) {
    const RONDAS = 5;
    const VIDA = 300;
    const ZONAS = [   // qué tan cerca del centro tocaste
        { radio: 0.03, valor: 100, texto: "¡CRÍTICO!", color: ORO },
        { radio: 0.09, valor: 60, texto: "¡Genial!", color: "#34d399" },
        { radio: 0.18, valor: 30, texto: "Bien", color: "#67e8f9" },
    ];
    const barra = { x: 22, y: alto - 50, w: ancho - 44, h: 22 };
    const suelo = barra.y - 30;
    const hh = Math.min(118, alto * 0.42);    // héroe
    const hw = hh * 0.75;
    const tm = Math.min(170, alto * 0.5);     // alto del retrato del jefe
    const am = tm * 0.8;                      // ancho (las pinturas son 4:5)
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
        ayuda: "Toca cuando la marca blanca esté en el centro dorado. Tienes 5 golpes contra uno de tus jefes.",
        puntos: 0,
        termino: false,
        tocar() {
            if (espera > 0 || final) return;
            const distancia = Math.abs(marca - 0.5);
            const zona = ZONAS.find((z) => distancia <= z.radio);
            const valor = zona ? zona.valor : 0;
            juego.puntos += valor;
            vida = Math.max(0, vida - valor);
            textos.agregar(zona ? zona.texto : "Fallaste", ancho / 2, alto * 0.2,
                           zona ? zona.color : "#94a3b8", zona && valor === 100 ? 26 : 20);
            sonar(valor ? "impacto" : "fallo");
            if (valor) {
                textos.agregar(`-${valor}`, ancho * 0.94 - am / 2, suelo - tm * 0.6, "#fb7185", 18);
                temblor = 0.4;
            }
            embestida = 0.4;
            ronda += 1;
            rapidez *= 1.2;      // cada golpe la marca va más rápido
            espera = 0.9;
            if (vida === 0) {
                juego.puntos += 50;
                textos.agregar("¡K.O.! +50", ancho / 2, alto * 0.32, ORO, 24);
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
            cielo(g, ancho, alto, "#1b1033", "#120a24");
            const brillo = g.createRadialGradient(ancho / 2, suelo, 10, ancho / 2, suelo, ancho * 0.6);
            brillo.addColorStop(0, "rgba(251,113,133,.25)");
            brillo.addColorStop(1, "rgba(251,113,133,0)");
            g.fillStyle = brillo;
            g.fillRect(0, 0, ancho, alto);

            // Héroe: se lanza hacia adelante al golpear.
            const avance = embestida > 0 ? Math.sin((embestida / 0.4) * Math.PI) * 40 : 0;
            dibujarImagen(g, heroe, ancho * 0.06 + avance, suelo - hh * 0.92, hw, hh);

            // Rival: el retrato de un jefe, enmarcado. Tiembla al recibir el golpe.
            const mx = ancho * 0.94 - am + (temblor > 0 ? azar(-5, 5) : 0);
            const my = suelo - tm;
            g.save();
            rectRedondo(g, mx, my, am, tm, 8);
            g.clip();
            if (rival) g.drawImage(rival, mx, my, am, tm);
            else { g.fillStyle = "#1c1336"; g.fillRect(mx, my, am, tm); }
            if (temblor > 0.25) { g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(mx, my, am, tm); }   // destello del golpe
            if (vida === 0) { g.fillStyle = "rgba(0,0,0,.65)"; g.fillRect(mx, my, am, tm); }             // derrotado
            g.restore();
            g.strokeStyle = "#8a6a12";
            g.lineWidth = 3;
            rectRedondo(g, mx, my, am, tm, 8);
            g.stroke();

            // Vida del rival.
            const vx = mx;
            const vw = am;
            const vy = my - 14;
            g.fillStyle = "#0d0a1c";
            rectRedondo(g, vx, vy, vw, 8, 4);
            g.fill();
            g.fillStyle = "#f43f5e";
            rectRedondo(g, vx, vy, Math.max(0.01, vw * (vida / VIDA)), 8, 4);
            g.fill();

            // Barra de poder: rojo (fallo), celeste (bien), verde (genial), dorado (crítico).
            g.fillStyle = "#3f1d2b";
            rectRedondo(g, barra.x, barra.y, barra.w, barra.h, 8);
            g.fill();
            for (const [radio, color] of [[0.18, "#0e7490"], [0.09, "#059669"], [0.03, ORO]]) {
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
