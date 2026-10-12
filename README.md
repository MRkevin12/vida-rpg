# <img src="iconos/icono-192.png" width="56" alt="" align="top"> Vida RPG

Una app de productividad que convierte tu día a día en un juego de rol: completas misiones, ganas experiencia, subes de nivel y derrotas jefes.

Está pensada para el iPhone. Se instala desde Safari o Chrome, funciona sin internet y guarda todo en el teléfono: tus datos no van a ningún servidor, y no hay cuentas ni anuncios. Lo único en la nube es un servidor pequeño de notificaciones, que solo conoce tus horarios.

**Abrir la app:** https://mrkevin12.github.io/vida-rpg/

<p>
  <img src="capturas/hoy.jpg" width="200" alt="Pantalla Hoy: lista de misiones del día con su XP">
  <img src="capturas/resumen.jpg" width="200" alt="Resumen con gráficas de cumplimiento de los últimos 7 días">
  <img src="capturas/jefes.jpg" width="200" alt="Campaña de jefes: el avatar contra una pintura clásica">
  <img src="capturas/personaje.jpg" width="200" alt="Pantalla del personaje con su avatar y apariencia">
</p>

Las capturas usan una partida de ejemplo inventada.

## Qué tiene

- **Misiones diarias** con dificultad, atributo y los días de la semana en que tocan, o **N veces por semana** el día que quieras (sin romper la racha). Las que se cuentan («8 vasos de agua») tienen un botón +1 y se completan solas al llegar a la meta. Se pueden editar, reordenar, archivar y restaurar. Si olvidaste marcar algo, puedes marcar el día de ayer.
- **Tareas sueltas:** pendientes de una sola vez con fecha de entrega. Aparecen en Hoy el día que vencen (y se marcan como atrasadas si pasó la fecha).
- **Modo enfoque:** un temporizador de 15, 25 o 50 minutos que da lo mismo que una misión. Sigue contando aunque cierres la app.
- **Diario de una línea:** una frase y tu ánimo de cada día, visibles al tocar el día en el calendario.
- **Desafío de la semana:** uno al azar cada lunes (adaptado a tu partida). Si lo cumples, abres un cofre.
- **Tu semana:** al empezar una semana nueva, un resumen de la anterior: cumplimiento, días perfectos, metas, enfoque, ánimo y el desafío.
- **XP, niveles y cuatro atributos:** Fuerza, Intelecto, Carisma y Riqueza.
- **Rachas con escudos:** cada 7 días seguidos ganas un escudo que salva un día fallado. Los días de descanso no rompen la racha.
- **Resumen con gráficas** de los últimos 7 o 30 días: cumplimiento, días perfectos, XP, tu mejor día de la semana y qué atributo tienes descuidado.
- **Calendario de un año** al estilo de GitHub.
- **Misiones principales** divididas en pasos, para las metas grandes.
- **Campaña de jefes:** cada atributo tiene 5 jefes, cada uno más fuerte, en su propio escenario. Les haces daño cumpliendo misiones de ese atributo: las diarias, las tareas y el enfoque pegan poco y los pasos de una misión principal pegan mucho. Tu héroe ataca con su arma y el jefe recibe el golpe. Al vencer a los 5 empieza la **Partida+**: vuelven con más vida y mejores premios en cada ronda.
- **Logros** automáticos y personales, y una **tienda** donde cambias monedas por recompensas reales que tú defines.
- **Avatar que evoluciona** en 4 etapas, de la túnica de novato a la armadura de leyenda, con clase según tu atributo más alto, equipamiento de distinta rareza y un dragón de mascota. La apariencia se personaliza: cuerpo, piel, rostro, ojos, pelo, barba y color del traje.
- **Tres minijuegos** que se juegan con fichas ganadas al completar misiones.
- **Notificaciones:** recordatorios a las horas y días que elijas (con lo que te falta del día), un aviso propio para cada misión que le pongas hora (solo si todavía no la hiciste) y un aviso cuando termina tu sesión de enfoque. El ícono muestra cuántas misiones te faltan.
- **PIN de 4 números** para abrir la app y **copia de seguridad** en un archivo.
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

Todo se guarda en el teléfono con `localStorage`. Nada sale del dispositivo.

Eso también significa que **si borras la app, borras tu partida**. Haz una copia de seguridad cada tanto desde Ajustes → Exportar copia. Ese archivo sirve para recuperar la partida o pasarla a otro teléfono.

El PIN evita que alguien con tu teléfono desbloqueado abra la app. No cifra los datos: la protección de fondo es el código o Face ID del iPhone.

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
| `js/dibujo.js`, `js/dibujo-*.js` | El dibujo en SVG: cuerpo, ropa, objetos, escenarios y mascota |
| `js/arcade.js`, `js/minijuegos.js` | Las fichas y los tres minijuegos en `<canvas>` |
| `js/datos.js` | Guardar, cargar y copias de seguridad |
| `js/seguridad.js` | El PIN (se guarda su huella SHA-256, nunca el PIN) |
| `js/sonido.js` | Sonidos con la Web Audio API |
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

Con el servidor encendido, abre http://localhost:8000/pruebas/. La página ejecuta 56 pruebas de las reglas del juego (niveles, rachas, escudos, días de la semana, misiones semanales y con cantidad, tareas, enfoque, diario, desafíos, jefes y Partida+, logros, tienda, resumen y copias de seguridad) y de los dibujos (que ninguna combinación de avatar se rompa), y muestra cuáles pasan.

Las pruebas crean partidas en memoria y nunca tocan la partida guardada. Están en `pruebas/pruebas.js`, y `pruebas/demo.js` genera la partida de ejemplo de las capturas.

## Publicar una versión nueva

1. Sube el número de `VERSION` en `sw.js`. Sin eso, los teléfonos no detectan el cambio.
2. Si agregaste archivos, súmalos a la lista `ARCHIVOS` del mismo archivo.
3. `git push`. GitHub Pages publica la rama `main` en uno o dos minutos.

## Créditos

- **Pinturas de los jefes:** 20 obras de dominio público tomadas de Wikimedia Commons (Doré, Caravaggio, Goya, Blake, Waterhouse, Redon y otros). El autor y la fuente de cada una están en la app, en Ajustes → Créditos de las imágenes, y en `js/campana.js`.
- **Tipografía:** Orbitron, bajo la licencia SIL Open Font License (`fuentes/OFL.txt`).
