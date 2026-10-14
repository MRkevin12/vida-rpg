// cine.js — Reproduce una cinemática (ver cinematicas.js) en la capa #cine de index.html.
//
// Cada toma es una escena nueva: el fondo (la sala), los actores y una cámara que se mueve con CSS. Las tomas
// pasan solas; tocar la pantalla salta a la siguiente y el botón «Saltar» termina todo.
// El texto se escribe poco a poco, y SIEMPRE como texto (el nombre de tu héroe es lo que escribiste tú:
// nunca se mete como HTML).

const $ = (selector) => document.querySelector(selector);

// Las criaturas y tu héroe, en puntos de pixel art (el ancho de su sprite); los de la criatura salen de su ficha.
const TALLA_HEROE = 54;

// Crea una imagen suelta (el sprite de un actor o el fondo de la toma).
function imagen(clase, direccion, estilos = {}) {
    const img = document.createElement("img");
    img.className = clase;
    img.src = direccion || "";
    img.alt = "";
    img.draggable = false;
    for (const [nombre, valor] of Object.entries(estilos)) img.style.setProperty(nombre, valor);
    return img;
}

// Arma el DOM de una toma. imagenes = { salas: { cripta: "data:…" }, criatura: "data:…", heroe: "data:…", tallaCriatura }
function armarToma(toma, imagenes) {
    const raiz = document.createElement("div");
    raiz.className = `cine-toma camara-${toma.camara} ${toma.efecto ? `efecto-${toma.efecto}` : ""}`;
    raiz.style.setProperty("--ms", `${toma.ms}ms`);
    raiz.style.setProperty("--foco", toma.foco);

    // El «mundo» es lo que mueve la cámara: el fondo y los actores van juntos.
    const mundo = document.createElement("div");
    mundo.className = "cine-mundo";
    mundo.append(imagen("cine-fondo", imagenes.salas?.[toma.fondo]));
    for (const actor of toma.actores) {
        const direccion = actor.quien === "heroe" ? imagenes.heroe : imagenes.criatura;
        const talla = actor.quien === "heroe" ? TALLA_HEROE : imagenes.tallaCriatura || 96;
        const sombra = document.createElement("span");
        sombra.className = "cine-sombra";
        const figura = document.createElement("div");
        figura.className = `cine-actor cine-${actor.quien} ${actor.anim || ""}`;
        figura.style.setProperty("--x", `${actor.x}%`);
        figura.style.setProperty("--talla", String(talla));
        figura.append(sombra, imagen("cine-sprite", direccion));
        mundo.append(figura);
    }
    raiz.append(mundo);

    const destello = document.createElement("span");
    destello.className = "cine-destello";
    raiz.append(destello);

    if (toma.titulo) {
        const titulo = document.createElement("h2");
        titulo.className = "cine-titulo";
        titulo.textContent = toma.titulo;
        raiz.append(titulo);
    }
    return raiz;
}

// Reproduce la cinemática y devuelve una promesa que se cumple al terminar (o al saltarla).
//   opciones.sonar = la función de sonido (sonar de sonido.js)
export function reproducir(cinematica, imagenes, { sonar = () => {} } = {}) {
    const capa = $("#cine");
    const escena = $("#cine-escena");
    const texto = $("#cine-texto");
    const saltar = $("#cine-saltar");
    if (!capa || !escena || !cinematica?.tomas?.length) return Promise.resolve();

    return new Promise((terminar) => {
        let indice = -1;
        let siguiente = null;    // el temporizador que pasa a la toma siguiente
        let escribiendo = null;  // el que escribe el texto letra por letra
        let cerrada = false;

        const parar = () => {
            clearTimeout(siguiente);
            clearInterval(escribiendo);
        };

        function cerrar() {
            if (cerrada) return;
            cerrada = true;
            parar();
            capa.removeEventListener("click", alTocar);
            saltar.removeEventListener("click", alSaltar);
            document.removeEventListener("keydown", alTeclear);
            capa.hidden = true;
            escena.replaceChildren();
            texto.textContent = "";
            terminar();
        }

        // El texto aparece en el primer 65 % de la toma (nunca más lento que una letra cada 22 ms).
        function escribir(frase, ms) {
            clearInterval(escribiendo);
            texto.textContent = "";
            if (!frase) return;
            const paso = 22;
            const letrasPorPaso = Math.max(1, Math.ceil(frase.length / ((ms * 0.65) / paso)));
            let n = 0;
            escribiendo = setInterval(() => {
                n = Math.min(frase.length, n + letrasPorPaso);
                texto.textContent = frase.slice(0, n);
                if (n >= frase.length) clearInterval(escribiendo);
            }, paso);
        }

        function mostrar(i) {
            parar();
            if (i >= cinematica.tomas.length) return cerrar();
            indice = i;
            const toma = cinematica.tomas[i];
            escena.replaceChildren(armarToma(toma, imagenes));
            escribir(toma.texto, toma.ms);
            if (toma.sonido) sonar(toma.sonido);
            siguiente = setTimeout(() => mostrar(i + 1), toma.ms);
        }

        const alTocar = (evento) => {
            if (evento.target === saltar) return;   // el botón tiene su propio manejador
            mostrar(indice + 1);
        };
        const alSaltar = (evento) => {
            evento.stopPropagation();
            cerrar();
        };
        const alTeclear = (evento) => {
            if (evento.key === "Escape") cerrar();
        };

        capa.addEventListener("click", alTocar);
        saltar.addEventListener("click", alSaltar);
        document.addEventListener("keydown", alTeclear);
        capa.hidden = false;
        mostrar(0);
    });
}
