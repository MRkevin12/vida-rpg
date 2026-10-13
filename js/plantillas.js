// plantillas.js — Hábitos y premios listos para elegir con un toque.
//
// Los usan la bienvenida (al crear el personaje) y la ventana «Nueva misión»
// (para no tener que escribir todo). Cada plantilla tiene los mismos campos
// que el formulario de misión, así se puede crear directo con crearMision().

export const PLANTILLAS_MISIONES = [
    // 💪 Fuerza
    { id: "ejercicio", nombre: "Hacer ejercicio 30 minutos", dificultad: "dificil", atributo: "fuerza", frecuencia: "semana", veces: 3, momento: "manana" },
    { id: "caminar", nombre: "Caminar 20 minutos", dificultad: "facil", atributo: "fuerza", momento: "tarde" },
    { id: "agua", nombre: "Beber agua", dificultad: "facil", atributo: "fuerza", cantidad: 8, unidad: "vasos" },
    { id: "dormir", nombre: "Dormir antes de las 11", dificultad: "normal", atributo: "fuerza", momento: "noche" },
    // 🧠 Intelecto
    { id: "leer", nombre: "Leer 20 páginas", dificultad: "normal", atributo: "intelecto", cantidad: 20, unidad: "páginas", momento: "noche" },
    { id: "estudiar", nombre: "Estudiar programación", dificultad: "dificil", atributo: "intelecto", dias: [0, 1, 2, 3, 4], momento: "tarde" },
    { id: "ingles", nombre: "Practicar inglés", dificultad: "normal", atributo: "intelecto", momento: "tarde" },
    // 💬 Carisma
    { id: "meditar", nombre: "Meditar 10 minutos", dificultad: "facil", atributo: "carisma", momento: "manana" },
    { id: "llamar", nombre: "Llamar a un amigo o familiar", dificultad: "facil", atributo: "carisma", frecuencia: "semana", veces: 2 },
    { id: "agradecer", nombre: "Escribir 3 cosas buenas del día", dificultad: "facil", atributo: "carisma", momento: "noche" },
    // 💰 Riqueza
    { id: "gastos", nombre: "Anotar mis gastos", dificultad: "facil", atributo: "riqueza", momento: "noche" },
    { id: "ahorrar", nombre: "Guardar algo de dinero", dificultad: "normal", atributo: "riqueza", frecuencia: "semana", veces: 1 },
    { id: "proyecto", nombre: "Avanzar mi proyecto o negocio", dificultad: "dificil", atributo: "riqueza", dias: [0, 2, 4], momento: "tarde" },
];

export const PLANTILLAS_RECOMPENSAS = [
    { id: "capitulo", nombre: "Ver un capítulo de mi serie", costo: 120 },
    { id: "videojuegos", nombre: "Una hora de videojuegos", costo: 150 },
    { id: "redes", nombre: "Media hora de redes sociales", costo: 50 },
    { id: "comida", nombre: "Pedir mi comida favorita", costo: 300 },
    { id: "salida", nombre: "Salir a pasear o al cine", costo: 400 },
    { id: "capricho", nombre: "Comprarme algo que quiero", costo: 800 },
];
