# Registro de cambios

Todas las versiones de Vida RPG. La versión instalada se ve en la app, en Ajustes.

## v29 — La Mazmorra del Abismo
- **Una mazmorra nueva bajo la Torre:** se abre al superar el piso 20 de la Torre del héroe (vencer al Dragón de la tormenta); mientras tanto, en el Arcade se ve cerrada con lo que falta. Se juega igual que la Torre pero bajando, con su propia partida guardada (`estado.arcade.mazmorra`) y su récord. Cuesta 1 ficha y paga más: 5 monedas y 8 XP de Fuerza por sótano (máx. 80 y 120).
- **20 criaturas nuevas en 4 zonas:** Cisternas anegadas (Sanguijuela gigante, Ahogado, Aguaviva pálida, Cangrejo acorazado y la Bestia de la cisterna), Bosque de raíces (Hongo carroñero, Escorpión de raíz, Gusano devorador, Raíz estranguladora y el Árbol hueco), Santuario de las Sombras (Acólito, Can del umbral, Sacerdotisa velada, Sabueso de ceniza y el **Reflejo sombrío**, que es tu propio héroe en sombras) y Corazón del Abismo (los cuatro Heraldos de las Sombras y el Rey Hueco). Dibujos SVG propios convertidos en pixel art, con 4 salas nuevas.
- **Más difícil:** las criaturas tienen más vida y ataque (un sótano 1 se parece a un piso 9 de la Torre), todas resisten un elemento y cada una tiene un **ataque especial**: ☠️ veneno (5 % de tu vida por turno durante 3 turnos; una poción lo cura), 🩸 drenar (se cura lo que te quita), 🔒 sello (te quita 2 hechizos) o 🐚 coraza (tu próximo golpe le hace la mitad). Los guardianes se **enfurecen** una vez al quedar con media vida y al bajar de sótano no recuperas vida. Balance simulado: quien recién supera la Torre llega al sótano 7–9; vencer al Rey Hueco pide atributos en nivel ~22 con buen equipo.
- **Historia:** la Torre («La Llama de los Vigías») y la Mazmorra («El Rey Hueco») cuentan una historia que sigue a la Crónica del reino (`js/leyendas.js`): un prólogo, un capítulo por zona y un epílogo. Se lee en la batalla la primera vez que llegas a cada zona o vences a su guardián, y se relee con «📜 Historia» en el Arcade.
- El bestiario tiene una sección para la Mazmorra (con el ataque especial de cada criatura). En la Mazmorra suena la música de misterio. Sonidos nuevos: veneno y coraza.
- Datos versión 15.

## v28 — Cada mes y pantalla de carga
- **Misiones de cada mes:** la frecuencia nueva «Cada mes» (`mision.diasMes`: uno o varios días del 1 al 31). El 29, el 30 y el 31 caen en el último día si el mes es más corto. Ese día la misión toca como cualquier otra: sale en Hoy y cuenta para la racha, los días perfectos, la vida, el calendario, el resumen y el daño a los jefes. En «Otros días» dice cuándo es la próxima vez. Dos plantillas nuevas: «Revisar mis finanzas del mes» (el 1) y «Pagar las cuentas del mes» (el 5).
- **Avisos de las mensuales:** el servidor solo entiende días de la semana, así que la app le dice «todos los días» y le pide callar hasta el día antes de la próxima vez (`saltarHasta`). No hubo que cambiar el servidor.
- **Pantalla de carga:** al abrir la app se ve el emblema con un aro de luz que gira, el título, una barra que se llena, frases que cambian («Despertando a tu héroe…») y un consejo de juego al azar. Se queda al menos 1,1 segundos (para que no parpadee) y se desvanece; si algo fallara, se quita sola a los 8 segundos.
- Datos versión 14.

## v27 — Todo en su lugar
- **Navegación nueva:** la barra de abajo es Hoy · Progreso · Aventuras · **Héroe** · Tienda. La pantalla del personaje tiene pestaña propia y los logros pasan a Progreso. Las pantallas sin pestaña (el reino, el arcade, el enfoque, el diario, el libro y el pacto) iluminan la pestaña de la que salen y tienen un botón «‹ volver» a ella.
- **Hoy, más corto (de ~4200 a ~3300 px):** la tarjeta del héroe es compacta (racha, escudos y plena forma como chips) y lleva debajo a tus **4 rivales** (antes era la lista «En combate» al final). El Maestro, el evento del día, el cofre, el desafío relámpago, tu pacto y el desafío de la semana van en **un solo panel «Tu día»** (antes eran seis tarjetas). Se quitaron los chips del mapa y del arcade (están en Aventuras). El diario muestra las caritas y pliega lo escrito.
- **Secciones:** las pantallas largas tienen un selector arriba que se queda pegado bajo la cabecera. Progreso: tu progreso y logros. Héroe: equipo, mascotas, aspecto e historia (pacto, diario, libro, crónica del reino y logros). Tienda: premios, equipo y mascotas (la tienda pasó de ~6200 px a una pantalla).
- **Aventuras:** dos accesos grandes (el reino y el arcade) y un selector con las 4 campañas que muestra una a la vez. Lo que explica cómo se pelea quedó plegado.
- **Nada repetido:** los niveles de los atributos y sus rasgos, solo en Progreso (antes también en «Clase»); los objetos de logro, solo en Héroe (y ahí solo los que faltan por ganar); la mascota se elige en Héroe (la Tienda solo la vende); las estadísticas van con la racha; el pacto salió de Ajustes.
- **Aspecto:** paneles con un borde más suave y una línea de luz arriba, más aire entre las partes, la pestaña elegida con una pastilla de luz y la ficha del héroe en horizontal.

## v26 — Leyendas, mascotas y el reino
- **Habilidades del equipo:** cada objeto épico y legendario tiene un rasgo que solo funciona en la Torre (`js/habilidades.js`). Épicos: Firme (el primer golpe de cada piso no duele), Sombra (20 % de esquivar), Ímpetu (primer golpe crítico), Desgarro (críticos ×2,8), Juramento (+30 % contra guardianes), Valor (+40 % con poca vida), Manto regio, Bastión y Estrellas. Legendarios: Constancia (4 mejoras y +1 de ataque por piso), Ojo del dragón (ves el punto débil y +20 % a los hechizos), Sed del vencedor (te curas 30 % de lo que pegas), Embestida (doble golpe), Arcano (punto débil ×2,2), Gracia (un golpe mortal por piso te deja con 40 %), Escamas (devuelves la mitad del daño) y Gloria (+40 % de vida y una poción). Se ven en la Tienda, en tu Personaje y en la ficha de la Torre.
- **Tu mascota en la Torre:** aparece junto a tu héroe y actúa entre tu turno y el de la criatura. El dragón escupe fuego cada 3 turnos (cuenta el punto débil y le enseña al bestiario). La cría pelea al 60 % y un turno más tarde; la adulta, al 100 %; si comió ese día, 20 % más; un huevo o una mascota triste no pelean.
- **Mascotas en la Tienda:** Cuervo (común, picotea), Búho (raro, devuelve hechizos), Basilisco (épico, petrifica: la criatura pierde su turno), Grifo (épico, garras, más contra guardianes), Fénix (legendario, cura cada turno y te levanta una vez por subida) y Dragón de escarcha (legendario, aliento de hielo). Llegan como huevo, crecen con las misiones desde que las adoptas, se elige cuál te acompaña y cada una se puede nombrar.
- **El reino:** el mapa se rehízo en pixel art, con un paisaje por región (valle, bosque, montañas, desierto, mar con islas y ciudadela), niebla sobre lo que no exploraste y tu héroe y tu mascota caminando. Cada región tiene las guaridas de cuatro de tus jefes de Aventuras (la región 1, los primeros de cada campaña; la 2, los segundos…): rojas mientras el señor gobierna, blancas cuando cae, con botín. La fortaleza se abre al caer los cuatro. La Ciudadela tiene cuatro memoriales y la Torre. Franja con las seis regiones y fichas de los señores con su vida.
- **La Crónica del reino:** un prólogo y un capítulo por región que se completan con un párrafo por cada señor que cae (`js/cronica.js`).
- Datos versión 13: `estado.mascota` guarda la mascota que te acompaña y las adoptadas. Las copias viejas siguen con su dragón.

## v25 — La Torre, como los clásicos
- **Aspecto de juego de rol de consola:** la Torre del héroe se ve en pixel art, con la criatura a la izquierda, tu héroe a la derecha, ventanas azules de borde blanco, una manito que señala el comando y animaciones a saltos (el paso al atacar, el parpadeo al recibir un golpe, la criatura que se deshace al caer). Tu avatar aparece como sprite, con tu ropa y tu equipo.
- **20 criaturas nuevas**, propias de la Torre: ya no salen los jefes de las campañas de hábitos. Están en 4 zonas de 5 pisos, cada una con su sala: Cripta olvidada, Biblioteca prohibida, Fragua del abismo y Cima de la tormenta. El quinto piso de cada zona es su guardián. Después del piso 20 vuelven «ancestrales», más fuertes y de otro color.
- **Magia de fuego, hielo y rayo:** «Magia» abre una lista de hechizos. Cada criatura tiene un punto débil (ese hechizo le hace 50 % más) y algunas resisten otro (la mitad). Las criaturas y sus ataques tienen nombre propio, y un cartel dice qué se usa en cada turno.
- **Bestiario** (botón en el Arcade): recuerda las criaturas que viste, cuántas veces las venciste y qué le hace cada hechizo que probaste. El menú de magia usa lo que ya sabes. Las que no conoces aparecen como sombras.
- **Golpe preciso** usa la misma escena: tu héroe contra una criatura de la Torre (de las que ya conoces), en su sala.
- Todo se dibuja en el teléfono, sin imágenes nuevas: los dibujos son SVG propios que la app convierte en pixel art (`js/pixel.js`). Una partida de la Torre guardada con la versión anterior sigue en su piso, con la criatura nueva. El balance no cambió: conocer los puntos débiles permite subir entre 1 y 4 pisos más.

## v24 — Los jefes también pegan
- **Robo de vida:** cada misión que fallas (con «Fallé» o al terminar el día sin hacerla) es un golpe del jefe de su categoría: te quita vida y se cura con ella, hasta su vida llena y sin revivir nunca a un jefe vencido. Una escena animada lo muestra al fallar y al abrir la app si fallaste mientras no estabas.
- **Armadura:** una barra nueva (cabecera, Hoy y Personaje) que sale de tus objetos de protección: la ropa de tu etapa (15/25/35/45) más lo que lleves en la cabeza y en la espalda. Con 40 recibes el daño normal; con 0, 50 % más; con 80 o más, la mitad. Se gasta con cada misión fallada y se repara con cada misión o tarea cumplida. Solo cuenta para las misiones falladas.
- **El equipo cuenta:** cada objeto tiene poder (🛡️ armadura, ⚔️ ataque, 🔮 magia, 🍀 suerte), visible en la Tienda y en Personaje.
- **Torre del héroe:** el equipo suma ataque, daño de hechizo, un hechizo extra (magia 8+) y críticos, y la armadura para hasta el 40 % de cada golpe.
- **Minijuegos:** escudos en la Carrera (1 por cada 25 de armadura), vidas de más en la Lluvia de monedas (1 por cada 30), golpes más fuertes y zonas más anchas en Golpe preciso, y monedas que valen más con suerte.
- Nada de esto cambia el pasado: la armadura y los robos empiezan a contar el día que llega la versión, cada «Fallé» guarda el golpe que recibió y la app apunta tu armadura máxima cuando cambia.

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
