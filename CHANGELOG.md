# Registro de cambios

Todas las versiones de Vida RPG. La versión instalada se ve en la app, en Ajustes.

## v23 — Música, leyendas y un mundo con más vida
- **Música de fondo:** tres grabaciones orquestales de dominio público o CC0 (Brahms, Holst y Grieg) que se repiten sin cortes. Se elige la pista y el volumen en Ajustes; en la Torre suena la de batalla. Se pausa al salir de la app y, una vez descargada, suena sin internet (el service worker la guarda aparte para no bajarla otra vez en cada versión).
- **Equipo épico nuevo:** Capucha del errante, Yelmo alado, Hacha de guerra, Mandoble del juramento y Capa real.
- **Legendarios nuevos:** Corona del Dragón (1500 monedas), Lanza del Dragón (derrotar 8 jefes), Báculo arcano (superar 12 pisos de la Torre; sus runas giran) y Alas del Dragón (nivel 25).
- **Gráficos:** partículas en el aire según el fondo (luciérnagas, polvo, brasas, nieve o estrellas), rayos de luz, retratos de jefes que respiran con luz de vela, un reflejo que cruza los marcos épicos y legendarios, y pantallas que entran con una transición suave.

## v22 — Un mundo que reacciona
- **El Maestro Aurelio** (dibujado con el sistema del avatar): en Hoy te dice lo más importante del momento (caída, pacto, relámpago, cofre, herida, mañana, noche, racha) y conversa contigo: «¿Cómo me siento?», «¿Cómo voy?», «Dame un consejo».
- **Ritual de la mañana:** eliges tu misión clave; si la cumples vale el doble (XP, monedas y daño al jefe).
- **Ritual de la noche:** repasas lo que falta como cartas (deslizar → la hice, ← no la hice con su motivo), escribes el diario y lees el capítulo de hoy. Cerrar el día da +10 XP y 5 monedas.
- **Cofre del día:** con lo primero que cumples se desbloquea; trae monedas, XP, fichas, una poción o, rara vez, equipo.
- **Eventos del día** (la mitad de los días): Mercader ambulante (−30 % en la tienda), Bendición (+50 % XP de un atributo), Día de fortuna, Aguas termales, Luna de sangre, Eco de la Torre y Visita del sabio. Se apagan en Ajustes.
- **Desafío relámpago:** algunos días, 3 misiones en 2 horas por +40 XP y 40 monedas, con reloj en vivo.
- **Golpe con timing:** al completar una misión, tocar con la marca en la zona dorada da un crítico (+50 % de daño al jefe). Se apaga en Ajustes.
- **Mapa del viaje:** un paso por cada cosa cumplida, un lugar cada 4 pasos, regiones de 25 lugares con tesoros, santuarios y fortaleza.
- **Tu dragón:** se acaricia (te responde) y se alimenta una vez al día (15 monedas, +3 de vida).

## v21 — Avisos más confiables
- Cada notificación lleva una etiqueta nueva (`renotify`, `silent: false`): antes, un recordatorio con la misma etiqueta que otro que seguía en pantalla lo reemplazaba **en silencio**.
- El servidor manda todos los avisos con **urgencia alta** (antes los recordatorios iban con «normal» y el iPhone podía retrasarlos).
- El service worker **siempre** muestra algo, aunque el texto guardado esté dañado o falle algo: el iPhone corta las notificaciones de las apps que reciben avisos sin mostrarlos.
- La app revisa al abrir si siguen conectadas (permiso y suscripción) y muestra en Hoy «🔕 … Reactivar». Además vuelve a mandar la suscripción al servidor cada 30 minutos de uso.
- «El cuerno»: con la app abierta, los avisos suenan con un toque propio. Guía en Ajustes → Notificaciones para que lleguen siempre y suenen (el iPhone no deja que una app web elija el sonido de sus notificaciones).

## v20 — Fallar con honor y tu libro
- Botón **«✗ Fallé»** en cada misión que tocaba: eliges qué pasó (6 motivos), pierdes la vida en ese momento (no dos veces), su recordatorio ya no llega y se puede deshacer. Si al final la haces, la falla se borra sola.
- La **ficha del hábito** muestra cuántas veces fallaste y tu motivo más común.
- **Tu libro:** el diario se lee como «La crónica de» tu nombre. Cada día que escribes es un capítulo con título, narrado en tercera persona con lo que pasó (misiones, tareas, enfoque, pasos, jefes derrotados, logros, premios, fallas y su motivo, vida perdida) y tus propias palabras. Portada, índice por meses, páginas que se pasan deslizando y descarga en texto.

## v19 — El Tratado de la Voluntad
- Un **pacto de sangre** contigo mismo, «por mí y para mí»: preámbulo, 8 artículos (constancia, verdad, caída, tiempo, descanso, recompensas, juicio y porqué) y citas de Heráclito, Aristóteles, Séneca, Marco Aurelio, Epicteto y Píndaro.
- Escribes **tu porqué**, lo **firmas con el dedo** y queda **sellado con lacre** con tu inicial. Se puede renovar.
- En Hoy: el día de tu pacto, el porcentaje de días honrados y una cita diaria; si ayer fallaste, te recuerda el artículo III: nunca fallar dos días seguidos.

## v18 — Un diario de verdad
- **5 ánimos** (genial, bien, normal, mal, terrible), una **pregunta del día** distinta cada día, «🙏 Hoy agradezco…» y textos de hasta 500 letras.
- Pantalla **«Tu diario»**: racha de días escribiendo, ánimo del mes, **calendario de ánimo** por colores, **lo que dice tu diario** (tu ánimo los días que cumples todo frente a los demás, y tu mejor día de la semana), **recuerdos** de hace una semana, un mes y un año, **buscador** (sin importar tildes), filtro por ánimo y **descarga** en texto.
- Escribirlo da +5 XP de Carisma y 2 monedas (una vez al día) y cura 2 de vida. Nuevo logro: «Escribir en tu diario N días».
- El aviso de la noche trae la pregunta del día.

## v17 — Tus propios atributos
- Crea hasta 12 **atributos propios** en Progreso → Atributos (nombre, emoji y color), para medir cosas específicas.
- Cada uno va ligado a uno de los 4: su XP también sube ese atributo, así cuentan para la clase, el avatar, los jefes y la Torre.
- Tienen su propio nivel y se usan en misiones, tareas, enfoque, misiones principales y logros («llegar al nivel N»).
- Al borrar uno, lo que lo usaba vuelve a su atributo base; la XP ganada no se pierde.

## v16 — La vida de tu héroe
- El héroe tiene **vida** (100 + 5 por nivel). Al terminar cada día pierde 5/8/12 por cada misión que no hiciste (fácil/normal/difícil), 5 por cada tarea que vence y, el domingo, por las metas semanales sin cumplir (máximo 30 por día).
- Cumplir **cura**: 2/4/6 por misión o tarea, 4 por paso de misión principal, 3 por sesión de enfoque y 10 extra en un día perfecto. Marcar algo de ayer recupera lo perdido.
- **En plena forma** (80 % o más): +10 % de XP y monedas.
- **Caer en combate** (0 de vida): la tienda y el arcade se cierran hasta recuperar la mitad. El avatar se ve herido o caído.
- **Pociones de vida** en la Tienda: +25 por 40 monedas, una al día.
- **Modo descanso** (hasta 30 días): no quita vida ni rompe la racha, y el servidor no manda recordatorios.
- El aviso de la noche dice cuánta vida pierdes si no terminas; en la Torre subes con tu vida real.

## v15 — Más profesional
- Copia automática en la nube, una vez al día, **cifrada en el teléfono** con una contraseña (PBKDF2 + AES-GCM). Se recupera en otro teléfono con esa contraseña.
- Desbloqueo con **Face ID** (WebAuthn), además del PIN.
- **Deslizar** una misión para completarla y botón **Deshacer** (misiones, tareas, pasos, archivar y canjes).
- Misiones agrupadas por **momento del día** (mañana, tarde, noche) y **ordenar arrastrando**.
- **Ficha de cada hábito**: racha, mejor racha, porcentaje del último mes y calendario de 12 semanas.
- **Bienvenida guiada** con hábitos y premios listos para elegir; plantillas en «Nueva misión».
- «**Una sola vez**» al crear una misión; las tareas pueden no tener fecha.
- Ventana de **novedades** después de cada actualización.
- Pruebas automáticas en GitHub, licencia MIT y este registro de cambios.

## v14 — Gráficos y Torre del héroe
- Fondos y escenarios con 13 pinturas clásicas de dominio público.
- Avatar más realista (metal, piel, texturas, sombras), dragón y equipo redibujados.
- **Torre del héroe**: batallas por turnos piso a piso, con mejoras y guardianes.

## v13 — Avisos por misión
- Cada misión puede tener su hora de aviso; solo llega si todavía no la hiciste.

## v12 — Notificaciones
- Recordatorios a las horas que elijas y aviso al terminar el enfoque (servidor en Cloudflare Workers).

## v11 — Agenda y semana
- Tareas sueltas, misiones «N veces por semana» y con cantidad, modo enfoque, diario, desafío semanal, resumen de la semana y Partida+.

## v10 — Gráficos nuevos
- Avatar redibujado con volumen, animaciones de combate, escenarios y rareza del equipo.

## v9 — Ícono nuevo

## v8 — Editar y ordenar
- Editar y reordenar misiones, días de la semana, resumen con gráficas, sonidos y apariencia del avatar.

## v1 a v7 — Las bases
- Misiones diarias, XP, niveles, atributos, rachas con escudos, misiones principales, logros, tienda y PIN.
- Avatar que evoluciona, minijuegos, campaña de jefes y actualizaciones confiables en el iPhone.
