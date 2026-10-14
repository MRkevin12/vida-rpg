# <img src="iconos/icono-192.png" width="56" alt="" align="top"> Vida RPG

[![Pruebas](https://github.com/MRkevin12/vida-rpg/actions/workflows/pruebas.yml/badge.svg)](https://github.com/MRkevin12/vida-rpg/actions/workflows/pruebas.yml)
![Versión](https://img.shields.io/badge/versión-v24-8b5cf6)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-34d399)](LICENSE)

Una app de productividad que convierte tu día a día en un juego de rol: completas misiones, ganas experiencia, subes de nivel y derrotas jefes.

Está pensada para el iPhone. Se instala desde Safari o Chrome, funciona sin internet y guarda todo en el teléfono, sin cuentas ni anuncios. Lo único en la nube es un servidor pequeño para las notificaciones y una copia de seguridad **cifrada en el teléfono**, que el servidor no puede leer.

**Abrir la app:** https://mrkevin12.github.io/vida-rpg/

<p>
  <img src="capturas/hoy.jpg" width="200" alt="Pantalla Hoy: el héroe con sus cuatro rivales y el panel «Tu día» con el Maestro">
  <img src="capturas/resumen.jpg" width="200" alt="Resumen con gráficas de cumplimiento de los últimos 7 días">
  <img src="capturas/jefes.jpg" width="200" alt="Aventuras: accesos al reino y al arcade, y la campaña de jefes con el avatar contra una pintura clásica">
  <img src="capturas/personaje.jpg" width="200" alt="Pestaña Héroe: la ficha del avatar y sus secciones de equipo, mascotas, aspecto e historia">
  <img src="capturas/torre.jpg" width="200" alt="Torre del héroe: batalla por turnos en pixel art contra una criatura, con ventanas azules de comandos">
</p>

Las capturas usan una partida de ejemplo inventada.

## Qué tiene

La app tiene cinco pestañas: **Hoy** (tus misiones, tareas y diario del día), **Progreso** (racha, resumen, calendario, atributos y logros), **Aventuras** (el reino, la campaña de jefes, las misiones principales y el arcade), **Héroe** (tu avatar, su equipo, tus mascotas, su aspecto y tu historia) y **Tienda** (premios reales, equipo y mascotas). Las pantallas largas se dividen en secciones con un selector arriba.

- **Misiones diarias** con dificultad, atributo y los días de la semana en que tocan, **N veces por semana** el día que quieras (sin romper la racha) o **ciertos días de cada mes** (ej: «el 5 de cada mes»). Las que se cuentan («8 vasos de agua») tienen un botón +1 y se completan solas al llegar a la meta. Se agrupan por **momento del día** (mañana, tarde, noche) y se **ordenan arrastrando**. Si olvidaste marcar algo, puedes marcar el día de ayer.
- **Deslizar para completar** y botón **Deshacer** por si te equivocas.
- **«Fallé»:** reconocer que no hiciste una misión y por qué (no tuve tiempo, se me olvidó, no tuve ganas…). La vida se pierde en ese momento y la ficha del hábito muestra tu motivo más común.
- **Ficha de cada hábito:** su racha, su mejor racha, el porcentaje del último mes y un calendario de 12 semanas.
- **Tareas sueltas:** pendientes de una sola vez, con o sin fecha. Aparecen en Hoy el día que vencen (y se marcan como atrasadas si pasó la fecha). También se crean desde «Nueva misión» → «Una sola vez».
- **El Maestro Aurelio:** un mentor que te habla según cómo vas (tu vida, tu racha, tu pacto, la hora del día) y conversa contigo con respuestas para elegir.
- **Rituales:** en la mañana eliges tu **misión clave** (vale el doble); en la noche, el ritual te hace repasar lo que falta como cartas que deslizas, escribir el diario y leer el capítulo de hoy.
- **Cofre del día, desafío relámpago y eventos del día:** un premio al azar con lo primero que cumples, retos con reloj y días especiales (Mercader ambulante, Luna de sangre, Aguas termales…).
- **Golpe con timing:** al completar una misión aparece tu jefe; si tocas en el momento justo, el golpe es crítico.
- **Mapa del viaje:** cada cosa cumplida es un paso por un mapa antiguo, con tesoros, santuarios y fortalezas. Y tu **dragón** se acaricia y se alimenta.
- **El Tratado de la Voluntad:** un pacto contigo mismo, con frases de Séneca, Marco Aurelio, Epicteto y otros clásicos. Escribes tu porqué, lo firmas con el dedo y queda sellado con lacre. Cada día, la pantalla Hoy te recuerda el día de tu pacto, cuánto lo has honrado y su ley: nunca fallar dos días seguidos.
- **Bienvenida guiada** con hábitos y premios listos para elegir con un toque, y una ventana de **novedades** después de cada actualización.
- **Modo enfoque:** un temporizador de 15, 25 o 50 minutos que da lo mismo que una misión. Sigue contando aunque cierres la app.
- **Diario:** cada día marcas cómo te fue (5 ánimos), respondes una pregunta distinta y anotas algo que agradeces. En «Tu diario» tienes un calendario de ánimo, recuerdos de hace una semana, un mes y un año, un buscador, y ves cómo cambia tu ánimo los días que cumples tus misiones. Se puede descargar como texto. Escribirlo da XP y cura un poco de vida. Además, el diario se lee como un **libro**: cada día que escribes es un capítulo de «La crónica de» tu nombre, narrado con tus palabras y con lo que pasó ese día.
- **Desafío de la semana:** uno al azar cada lunes (adaptado a tu partida). Si lo cumples, abres un cofre.
- **Tu semana:** al empezar una semana nueva, un resumen de la anterior: cumplimiento, días perfectos, metas, enfoque, ánimo y el desafío.
- **XP, niveles y cuatro atributos:** Fuerza, Intelecto, Carisma y Riqueza. Además puedes crear **tus propios atributos** para cosas específicas (Programación, Inglés, Salud…): cada uno tiene su nivel y le suma a uno de los 4.
- **Vida del héroe:** al terminar cada día pierdes vida por lo que tocaba y no hiciste, y la recuperas cumpliendo. Con 80 % o más estás **en plena forma** (+10 % de XP y monedas). Si llega a 0 caes en combate: la tienda y el arcade se cierran hasta que recuperes la mitad. Hay **pociones** (una al día) y un **modo descanso** para vacaciones o días enfermo, que no quita vida ni rompe la racha.
- **Los jefes también pegan:** cada misión que fallas es un golpe del jefe de su categoría, que te **roba la vida** y se cura con ella (se ve en una escena animada). Tu **armadura** sale de tus objetos de protección: llena, fallar duele menos; gastada, duele más. Se gasta al fallar y se repara cumpliendo.
- **El equipo cuenta:** cada objeto da armadura, ataque, magia o suerte, y eso te hace más fuerte en la Torre (más daño, hechizos, críticos y golpes que duelen menos) y en los minijuegos (escudos, vidas de más, golpes más fuertes y monedas que valen más).
- **Rachas con escudos:** cada 7 días seguidos ganas un escudo que salva un día fallado. Los días de descanso no rompen la racha.
- **Resumen con gráficas** de los últimos 7 o 30 días: cumplimiento, días perfectos, XP, tu mejor día de la semana y qué atributo tienes descuidado.
- **Calendario de un año** al estilo de GitHub.
- **Misiones principales** divididas en pasos, para las metas grandes.
- **Campaña de jefes:** cada atributo tiene 5 jefes, cada uno más fuerte, en su propio escenario. Les haces daño cumpliendo misiones de ese atributo: las diarias, las tareas y el enfoque pegan poco y los pasos de una misión principal pegan mucho. Tu héroe ataca con su arma y el jefe recibe el golpe. Al vencer a los 5 empieza la **Partida+**: vuelven con más vida y mejores premios en cada ronda.
- **Logros** automáticos y personales, y una **tienda** donde cambias monedas por recompensas reales que tú defines.
- **Fondos pintados:** los escenarios del avatar y de las batallas son pinturas clásicas de dominio público (Constable, Bierstadt, Van Gogh, Turner, Panini…), con luciérnagas, brasas, nieve o estrellas que flotan según el fondo y rayos de luz. Los retratos de los jefes respiran a la luz de una vela.
- **Avatar que evoluciona** en 4 etapas, de la túnica de novato a la armadura de leyenda, con clase según tu atributo más alto, equipamiento de distinta rareza (común, raro, épico y legendario: del hacha de guerra a la lanza y las alas del dragón) y un dragón de mascota. La apariencia se personaliza: cuerpo, piel, rostro, ojos, pelo, barba y color del traje.
- **Torre del héroe:** un minijuego grande de batallas por turnos con el aspecto de un juego de rol clásico de consola: pixel art, ventanas azules y menú de comandos. Tiene 20 criaturas propias en 4 zonas, un guardián cada 5 pisos, magia de fuego, hielo y rayo (cada criatura tiene un punto débil por descubrir) y un **bestiario** que recuerda lo que aprendes. Tu poder sale de los niveles de tus atributos reales, y subes con tu vida real. El equipo **épico y legendario** suma habilidades especiales (esquivar, golpear dos veces, resistir un golpe mortal, ver el punto débil…) y tu **mascota pelea a tu lado**.
- **Monedas y gemas:** las monedas 🪙, con las que canjeas tus premios reales, salen solo de lo que haces en la vida real. Lo que ganas jugando (el arcade) y los premios extra (jefes, cofres, desafíos y mapa) dan gemas 💎, que se gastan en el equipo de tu avatar, las mascotas y el arcade (un bazar de provisiones para la Torre y la Mazmorra).
- **Mazmorra del Abismo:** se abre al superar el piso 20 de la Torre. Otras 20 criaturas en 4 zonas (una de ellas, tu propio reflejo en sombras), más difícil: cada criatura tiene un ataque especial (veneno, beber tu vida, sellar tu magia o cubrirse con una coraza), los guardianes se enfurecen a media vida y entre sótanos no hay descanso.
- **El Maestro Aurelio:** tu mentor te habla en todo el juego (pistas antes de cada guardián, palabras al caer, al subir de nivel, al vencer a un jefe, en tu diario y al cerrar el día) y te cuenta su propia historia en 8 capítulos que se abren a medida que avanzas.
- **«La primera piedra»:** un pergamino largo para los días difíciles, la historia de quien empezó la Torre poniendo una piedra cada día (Héroe › Historia).
- **La Saga de la Llama:** todas las historias del juego son una sola, con un objetivo: convertirte en Vigía. Siete actos que se cumplen en orden, de tu primera misión a encender la Llama, que solo prende con el fuego del reino liberado (tus 20 jefes): la Torre y la Mazmorra pueden ir por delante, pero no terminan la historia. El acto de ahora aparece en Hoy y Héroe › Historia ordena las historias en el tiempo.
- **Una historia que se cuenta jugando:** la Torre y la Mazmorra tienen prólogo, un capítulo por zona y epílogo. Se leen la primera vez que llegas a cada parte y se pueden releer en el Arcade.
- **Mascotas:** empiezas con un dragón y en la Tienda puedes adoptar otras seis de distinta rareza (cuervo, búho, basilisco, grifo, fénix y dragón de escarcha). Llegan como huevo, crecen con tus misiones y cada una tiene su habilidad en la Torre.
- **El reino:** el mapa del viaje, en pixel art, con seis regiones gobernadas por tus jefes. Cuando vences a uno en Aventuras, su guarida queda libre; la fortaleza de cada región se abre al caer sus cuatro señores. La **Crónica del reino** cuenta la historia que une todo y se escribe sola con lo que haces.
- **Tres minijuegos** más, que se juegan con fichas ganadas al completar misiones. En «Golpe preciso» peleas contra una criatura de la Torre.
- **Notificaciones:** recordatorios a las horas y días que elijas (con lo que te falta del día y, de noche, cuánta vida pierdes si no terminas), un aviso propio para cada misión que le pongas hora (solo si todavía no la hiciste) y un aviso cuando termina tu sesión de enfoque. El ícono muestra cuántas misiones te faltan. Cada aviso sale con prioridad alta y suena como uno nuevo; si se desconectan, la app lo detecta y ofrece reactivarlos.
- **PIN de 4 números o Face ID** para abrir la app.
- **Copia de seguridad automática en la nube**, cifrada con tu contraseña, además de la copia en un archivo.
- **Música de fondo** orquestal (Brahms, Holst y Grieg, grabaciones de dominio público o CC0): se elige la pista y el volumen en Ajustes, en la Torre suena la de batalla, en la Mazmorra la de misterio y, una vez descargada, suena sin internet.
- **Sonidos** hechos con código, que se pueden apagar en Ajustes.

## Instalarla en el iPhone

1. Abre https://mrkevin12.github.io/vida-rpg/ en **Safari**.
2. Toca **Compartir** y luego **Agregar a pantalla de inicio**.
3. Abre la app desde el ícono nuevo. Desde ahí funciona sin internet.

Cuando hay una versión nueva, la app muestra un aviso para actualizar. La versión instalada se ve en Ajustes.

También se puede instalar desde **Chrome** en el iPhone (iOS 16.4 o más): botón Compartir → **Agregar a la pantalla de inicio**. La app instalada guarda su partida aparte de la pestaña del navegador: si ya jugabas en una pestaña, exporta la copia ahí e impórtala en la app instalada.

## Notificaciones

Los avisos solo funcionan en la app instalada. Se activan en Ajustes → 🔔 Notificaciones con un código de activación.

Una app web no puede programar avisos por su cuenta, así que hay un servidor pequeño en **Cloudflare Workers** (carpeta `servidor/`). Ese servidor guarda solo la suscripción del teléfono, los horarios y la hora en que termina el enfoque. A la hora indicada envía un aviso que únicamente dice su tipo. El texto lo arma el propio teléfono (`sw.js`) con un resumen que la app deja guardado, así que **tus misiones no salen del iPhone**.

| Archivo | Para qué sirve |
|---|---|
| `js/avisos.js` | Activar, hablar con el servidor y preparar el texto de los avisos de los próximos 7 días |
| `servidor/worker.js` | El servidor: guarda tus horarios y cada minuto revisa si toca un aviso |
| `servidor/webpush.js` | Firma (VAPID) y cifra (aes128gcm) cada aviso, sin librerías |
| `servidor/pruebas.mjs` | Pruebas del servidor (`npm run pruebas`), incluido el ejemplo oficial del RFC 8291 |

Para publicar cambios del servidor, desde `servidor/` y con Node.js instalado: `npm install` (solo la primera vez) y `npm run publicar`. Los secretos (`CODIGO` y `VAPID_PRIVADA`) viven en Cloudflare y en `servidor/.dev.vars`, que no se sube a GitHub.

## Tus datos

Todo se guarda en el teléfono con `localStorage`. Si borras la app, borras tu partida, así que hay dos formas de tener copia:

- **Copia en la nube (automática):** Ajustes → ☁️ Copia en la nube. Una vez al día la app **cifra la partida en el teléfono** con una llave que sale de tu contraseña (PBKDF2 con 210 000 vueltas + AES-GCM) y la sube al servidor. El servidor solo guarda texto ilegible: sin tu contraseña nadie puede abrirla. En un teléfono nuevo: «☁️ Recuperar mi copia de la nube», con el código de activación y la contraseña (`js/nube.js`).
- **Archivo:** Ajustes → Exportar copia. Ese archivo sirve para recuperar la partida o pasarla a otro teléfono.

El PIN (o Face ID, con WebAuthn) evita que alguien con tu teléfono desbloqueado abra la app. No cifra los datos del teléfono: la protección de fondo es el código o Face ID del iPhone.

## Cómo está hecha

HTML, CSS y JavaScript sin librerías ni paso de compilación. Los personajes, objetos y escenarios no son imágenes: se dibujan con código (SVG), por eso se pueden personalizar y animar. Es una PWA: un *service worker* (`sw.js`) guarda los archivos en el teléfono la primera vez para que después abra sin conexión.

La idea central es que casi todo **se calcula a partir del historial** en lugar de guardarse: la racha, los escudos, el calendario, la vida de los jefes, el progreso del desafío semanal y el resumen salen de la lista de misiones completadas. Así no hay números que se puedan desincronizar.

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `estilos.css` | La estructura de la página y su aspecto |
| `js/app.js` | Conecta todo: escucha los toques, ejecuta acciones y redibuja |
| `js/acciones.js` | Lo que cambia la partida: crear, completar, editar, canjear |
| `js/juego.js` | Las reglas: XP, niveles, rachas, logros |
| `js/campana.js` | Los jefes: vida, daño, Partida+ y créditos de las pinturas |
| `js/desafios.js` | El desafío de la semana: cuáles hay, cómo se eligen y cómo se mide el progreso |
| `js/resumen.js` | Los números del resumen de 7 y 30 días y de «Tu semana» |
| `js/vistas.js` | Convierte la partida en HTML |
| `js/avatar.js` | Las reglas del avatar: etapas, clases, objetos y opciones de apariencia |
| `js/equipo.js` | Lo que da tu equipo: la armadura y el ataque, la magia y la suerte de cada objeto |
| `js/dibujo.js`, `js/dibujo-*.js` | El dibujo en SVG: cuerpo, ropa, objetos, escenarios y mascota |
| `js/arcade.js`, `js/minijuegos.js` | Las fichas y los tres minijuegos en `<canvas>` |
| `js/torre.js`, `js/bestiario.js` | Las reglas de la Torre del héroe y de la Mazmorra del Abismo (batallas por turnos, magia, ataques especiales y mejoras) y sus 40 criaturas, con lo que recuerdas de ellas |
| `js/leyendas.js` | La historia de la Torre y de la Mazmorra: prólogo, un capítulo por zona y epílogo |
| `js/memorias.js` | Las memorias del Maestro Aurelio: 8 capítulos que se abren en orden según cómo avanzas |
| `js/saga.js` | La Saga de la Llama: el hilo que une las historias, sus 7 actos y tu objetivo de ahora |
| `js/pergamino.js` | «La primera piedra»: la historia motivacional larga que se lee como un pergamino |
| `js/habilidades.js`, `js/mascota.js` | Las habilidades del equipo épico y legendario, y las mascotas: cuáles hay, cómo crecen y qué hacen en la Torre |
| `js/mapa.js`, `js/cronica.js`, `js/dibujo-mapa.js` | El reino: regiones, guaridas de los jefes y premios; la Crónica; y el dibujo del mapa en pixel art |
| `js/dibujo-monstruos.js`, `js/pixel.js`, `js/sprites.js` | Los dibujos de las criaturas y de las salas, y cómo se convierten en pixel art |
| `js/maestro.js`, `js/rituales.js`, `js/eventos.js` | El Maestro (saludos y conversación), la misión clave, el ritual de la noche, el desafío relámpago y los eventos del día |
| `js/cofre.js`, `js/mapa.js`, `js/mascota.js` | El cofre del día, el mapa del viaje y lo que hace tu dragón |
| `js/libro.js` | Tu diario contado como un libro: arma los capítulos con lo que pasó cada día |
| `js/pacto.js` | El Tratado de la Voluntad: su texto, la cita del día, la firma y los días honrados |
| `js/diario.js` | El diario: pregunta del día, racha, calendario de ánimo, lo que dice tu diario, recuerdos y búsqueda |
| `js/vida.js` | La vida del héroe: daño, curación, plena forma, caer en combate y pociones (se calcula día por día) |
| `js/pinturas.js`, `fondos/` | Las pinturas de los fondos y escenarios, con sus créditos |
| `js/datos.js` | Guardar, cargar y copias de seguridad |
| `js/seguridad.js` | El PIN (se guarda su huella SHA-256, nunca el PIN) y Face ID con WebAuthn |
| `js/nube.js` | La copia en la nube: cifrar y descifrar con tu contraseña, subir y recuperar |
| `js/plantillas.js`, `js/novedades.js` | Hábitos y premios listos para elegir, y las novedades de cada versión |
| `js/sonido.js` | Sonidos con la Web Audio API |
| `js/musica.js`, `musica/` | La música de fondo (bucle con la Web Audio API) y sus 3 grabaciones en MP3 |
| `js/fechas.js` | Ayudantes de fechas |
| `sw.js`, `manifest.json` | Funcionar sin internet e instalarse como app |

Para cambiar el balance del juego (cuánta XP da cada cosa, cuánta vida tiene cada jefe) basta con editar las constantes al inicio de `js/juego.js` y `js/campana.js`.

## Ejecutarla en tu compu

Los módulos de JavaScript necesitan un servidor: abrir `index.html` con doble clic no funciona. Con Python instalado:

```bash
git clone https://github.com/MRkevin12/vida-rpg.git
cd vida-rpg
python3 -m http.server 8000
```

Luego abre http://localhost:8000.

Al editar un archivo, recarga la página **dos veces**: el service worker muestra primero la copia guardada y descarga la nueva por detrás.

## Pruebas

Con el servidor encendido, abre http://localhost:8000/pruebas/. La página ejecuta 177 pruebas de las reglas del juego (niveles, armadura, robo de vida, equipo, atributos propios, diario, el libro, «Fallé», el pacto, el Maestro, rituales, cofre, eventos, mapa, rachas, escudos, vida, pociones, modo descanso, días de la semana, misiones semanales y con cantidad, tareas, enfoque, diario, desafíos, jefes y Partida+, Torre del héroe y su bestiario, la Mazmorra del Abismo y sus ataques especiales, la historia de las dos, el Maestro y sus memorias, la saga que une las historias, habilidades del equipo, mascotas, el reino y su crónica, fichas de hábitos, logros, tienda, monedas y gemas, el bazar, resumen, cifrado de la copia en la nube y copias de seguridad) y de los dibujos (que ninguna combinación de avatar se rompa, que las criaturas de la Torre y de la Mazmorra, las mascotas y los mapas sean imágenes válidas y que se conviertan en pixel art), y muestra cuáles pasan. El servidor tiene 10 pruebas más (`node servidor/pruebas.mjs`).

Las pruebas crean partidas en memoria y nunca tocan la partida guardada. Están en `pruebas/pruebas.js`, y `pruebas/demo.js` genera la partida de ejemplo de las capturas.

**Pruebas automáticas:** cada vez que se suben cambios, GitHub corre todas las pruebas en un navegador sin ventana (`.github/workflows/pruebas.yml` y `pruebas/ejecutar.mjs`). La insignia de arriba dice si pasaron.

## Publicar una versión nueva

1. Sube el número de `VERSION` en `sw.js`. Sin eso, los teléfonos no detectan el cambio.
2. Si agregaste archivos, súmalos a la lista `ARCHIVOS` del mismo archivo.
3. Agrega lo nuevo a `js/novedades.js` (y sube `VERSION_APP` al mismo número) y a `CHANGELOG.md`.
4. `git push`. GitHub Pages publica la rama `main` en uno o dos minutos y GitHub corre las pruebas.

## Créditos

- **Pinturas de los jefes:** 20 obras de dominio público tomadas de Wikimedia Commons (Doré, Caravaggio, Goya, Blake, Waterhouse, Redon y otros). El autor y la fuente de cada una están en la app, en Ajustes → Créditos de las imágenes, y en `js/campana.js`.
- **Fondos y escenarios:** 13 pinturas y grabados de dominio público (Constable, Hobbema, Thomas Cole, Bierstadt, Shishkin, Christian Jank, Van Gogh, Panini, Turner, Hubert Robert, Pieter Neefs y Piranesi), con sus créditos en la app y en `js/pinturas.js`.
- **Música:** grabaciones de Wikimedia Commons, recortadas y comprimidas: Brahms, Sinfonía n.º 1 (introducción), por Musopen Symphony (dominio público); Holst, «Marte, el que trae la guerra», por la Skidmore College Orchestra (CC0); y Grieg, «En la gruta del rey de la montaña», por Musopen Symphony (dominio público). Las fuentes están en la app (Ajustes → Créditos) y en `js/musica.js`.
- **Tipografía:** Orbitron, bajo la licencia SIL Open Font License (`fuentes/OFL.txt`).

## Licencia

El código está bajo la [licencia MIT](LICENSE). Las pinturas y la música son de dominio público (o CC0) y la tipografía tiene su propia licencia (ver Créditos). Los cambios de cada versión están en el [registro de cambios](CHANGELOG.md).
