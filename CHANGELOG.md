# Registro de cambios

Todas las versiones de Vida RPG. La versión instalada se ve en la app, en Ajustes.

## v210 — La Senda suena viva

- **Voces de las criaturas**: el motor anota `voz:<id>:<momento>` en `partida.sonidos` (helper `voz()`, solo si la criatura está en pantalla) y `app-plataformas.js` lo pasa a `sonarVoz` (familias de `FAMILIA_DE_CRIATURA`, ya existían). Momentos: `aparece` (al despertar y, de vez en cuando, un murmullo de una criatura a la vista), `ataque` (salto del cieno, disparo de gárgola/cristal, picado de la arpía, bajada de la araña, raíz que sube, ascua que salta; jefes al entrar en un estado de ataque, `ESTADOS_DE_ATAQUE`), `herido` (bola de fuego sin matar; golpe al jefe) y `cae`.
- **Ambiente** (`ambiente()` en el motor, con `Math.random`: no toca `partida.azar`): Campos «ulular», Minas «gota», Cumbres «ventisca» y brasas «brasa» en la Fortaleza. En las Cumbres el rayo lejano del fondo (cada 8,5 s desde el segundo 3, mismo reloj que `pintarRelampago`) suena «crujido» y 1,4 s después «trueno».
- Sonidos nuevos en `sonido.js`: trueno, crujido, gota, ventisca, brasa. El mazo de piedra sigue con «retumbo».
- Probado: 496 pruebas de la app (nueva: voces, ambiente y trueno).

## v209 — Botones más grandes en horizontal

- Senda en horizontal: columnas del mando de 142 a 166 px; cruceta 66 × 92, saltar 90, fuego 66 (antes 56 × 76, 74 y 58). El lienzo cede ~48 px de ancho en total.

## v208 — Horizontal: la app y los juegos

- **La Senda del Reino** (`css/20-senda.css`, bloque de horizontal): el lienzo va entre dos columnas propias del mando (`--senda-lado-izq/-der`); antes ocupaba toda la pantalla y la cruceta y el botón de saltar tapaban al héroe (al empezar el nivel la cámara está topada a la izquierda) y el suelo. Los botones pueden meterse un poco en la zona del notch (`--senda-borde-*`). La barra del recorrido vuelve a verse (arriba a la izquierda); pausa y ✖ arriba a la derecha. Botones de la cruceta más altos (56 × 76). `ajustarLienzo()` no cambia: mide la caja y el ancho del mundo sale solo (~300 puntos en un iPhone de 852 × 393).
- **Pausa y resultado de la Senda** en horizontal: botones en 2 columnas; el resultado con la tabla a la izquierda y el premio a la derecha.
- **Toda la app** (`css/99-pixel.css`, bloque v208): con `orientation: landscape` y `max-height: 540px`, las pestañas son una columna fija a la izquierda (`--ancho-riel`), `--alto-pestanas: 0px` (avisos, «Deshacer» y la barra de la carrera bajan al borde) y la cabecera más baja (retrato 38 px). `#juego` deja libre la columna y el notch de la derecha.
- **PIN, «¿Cómo te sientes hoy?» y carga** en dos columnas. Las capas centradas (`.capa-oscura`, `.bloqueo`) usan `margin-block: auto`: si no caben, se puede bajar hasta arriba (con `place-items: center` lo de arriba quedaba fuera de alcance).
- **Minijuegos**: título, marcador y ✖ en una fila (`.minijuego-barra { display: contents }`); el lienzo usa el resto del alto. Todos los `.minijuego` respetan el notch de los lados.
- `app.js › medirCabecera()`: `--alto-cabecera` se vuelve a medir al girar (evento `resize`).
- Probado: 495 pruebas de la app; capturas en 844 × 390, 667 × 375 y 390 × 844 (vertical sin cambios).

## v207 — Tu propio plan de Finanzas

- **Porcentajes configurables** en Ajustes («💰 Plan de Finanzas», `index.html` + `app-dialogos.js › ajustes()`). Se guardan en `estado.finanzas.plan` (`{ necesidad, gusto, ahorro }`, enteros de 0 a 100 que sumen 100). Por defecto 50/30/20 (`finanzas.PLAN_POR_DEFECTO`).
- **Reglas** (`finanzas.js`): `porcentajesDelPlan`, `textoDelPlan`; `planDelMes` usa tu plan (y devuelve `porcentaje`); `repartoDe(monto, pct)`; los consejos de Aurelio ya no dicen números fijos.
- **Acción** `configurarPlanFinanzas`: rechaza texto vacío, decimales, negativos, más de 100 y sumas distintas de 100 (sin cambiar nada).
- **Vistas**: título «Tu plan 10/20/70», la línea de porcentajes, el reparto del último ingreso y los textos de Anotar/No entran al plan usan tu plan.
- **Datos**: `estadoInicial` y `completar` traen `plan`; las partidas viejas salen con 50/30/20. Sin cambio de versión de datos (sigue en 44). Ojo: `estadoInicial` y `completar` deben poner las claves en el mismo orden, porque la prueba de la copia compara como texto.
- Probado: 495 pruebas de la app; en la app: guardar 10/20/70, rechazar 40/40/40 con su aviso, la dona y los límites con los nuevos porcentajes, y ninguna pantalla se sale a 320 y 375 px.

## v206 — Finanzas: solo gastas lo que tienes

- **No se gasta plata que no hay** (`acciones-finanzas.js › exigirSaldo`): gasto, pago de fijo, transferencia y corrección de gasto se comparan con `finanzas.saldoDisponible` (del medio elegido, o el total sin medio). Al corregir un gasto no cuenta su monto anterior (`saldosPorMedio(estado, excluirGastoId)`).
- **Corregir o borrar un ingreso / borrar una transferencia** se deshace si deja un medio en negativo que antes no lo estaba.
- **Pagar con dos medios** (`repartirPago`): `medio2` + `monto2` en el formulario (plegable «Pagar con dos medios»); el gasto guarda `pagos: [{ medio, monto }, …]` y `saldosPorMedio` descuenta cada parte. El historial muestra «Banco $X + Efectivo $Y». Datos: versión 44 (campo opcional, sin migración).
- **Lo que sobra pasa al mes siguiente** (`sobranteDeMesesAnteriores`): `resumenDelMes` da `arrastre` y `disponible`; «Te queda» y la tarjeta de Hoy usan `disponible`; `ritmoDelMes.libre` suma el arrastre y nunca pasa de lo disponible. Aurelio lo cuenta y su alerta de ritmo compara con lo que tienes (entró + arrastre).
- **Pantallas angostas**: `.selector-secciones` con 6 secciones en 2 filas (≤420 px; con 5, ≤340 px); palabras largas en botones de opción se parten con guion; las 4 cifras de Finanzas en 2 × 2.
- Probado: 494 pruebas de la app, recorrido de Finanzas en la app (rechazos, dos medios, historial, corregir, borrar), fechas difíciles, robot de 3 min y búsqueda de textos encimados a 320/375/393 px.

## v205 — Barra de abajo en su sitio

- La corrección de la v203 para la barra de pestañas restaba `clientHeight` (`app-efectos.js › medir`); en el iPhone instalado ese valor no coincide con la pantalla visible y la barra bajaba ~34 pt, cortando las etiquetas. Ahora cabecera y barras se corrigen solo con `visualViewport.offsetTop`.
- Sin cambios de datos. Pruebas: 488 de la app.

## v204 — Sin rebote al deslizar

- **Al pasarte del final o del inicio, la cabecera, la sub-barra del gym y las pestañas se corrían a media pantalla.** Causa: desde la v203 el `html` tiene `overflow-x: clip`, así que el navegador toma el `overscroll` de la ventana del `html` y el `overscroll-behavior-y: none` del `body` dejó de valer. Ahora el `html` también lleva `overscroll-behavior: none` (`css/01-base.css`). Prueba nueva en `pruebas/pruebas.js`.
- Sin cambios de datos. Pruebas: 488 de la app.

## v203 — La pantalla ya no se descuadra

- **La página se corría de lado** (gym en «Lista»): el `overflow-x: clip` del `body` pasaba a la ventana como `hidden`, que no deja deslizar con el dedo pero sí deja que iOS corra la página al enfocar un campo. Ahora `html` también lleva `overflow-x: clip` (`css/01-base.css`) y el body recorta de verdad.
- **La fila «+ calentamiento · cambiar · saltar»** medía ~430 px (`flex: 0 0 auto`): en la lista va en su línea y baja de renglón (`.gym-mas .gym-ej-botones`, `css/14-gym-foco.css`).
- **La barra de pestañas a media pantalla tras cerrar el teclado** (`app-efectos.js › arreglarVistaTrasTeclado`, rehecho): el empujón de scroll se repite a 80/400/900 ms, y si iOS deja la vista corrida se mide con `visualViewport` y se recolocan cabecera, pestañas, aviso, deshacer y barra de carrera (`--vv-arriba`/`--vv-abajo` + clase `vista-corrida` en `<html>`, solo mientras hace falta). Mientras escribes no se toca nada.
- **320 px**: `.atributos` y `.mes-animo` con `minmax(0, 1fr)`; los días del calendario sin alto mínimo en pantallas ≤360 px.
- Revisado con un recorrido automático de las 20 pantallas, sus subvistas y las 21 ventanas a 320, 375 y 430 px: nada se sale por los lados.
- Sin cambios de datos. Pruebas: 488 de la app.

## v202 — Sin barras de desplazamiento

- Se ocultan las barras de desplazamiento en toda la app (`css/99-pixel.css`, al final): `scrollbar-width: none` y `::-webkit-scrollbar` en `html`, `body` y el resto. Antes solo se ocultaban dentro de la galería.
- Sin cambios de datos. Pruebas: 487 de la app.

## v201 — Galería más ordenada

- **Álbum en un botón + lista** (`hojaDeAlbumes`, estado `eligiendoAlbum`): se acabaron los chips que se cortaban a la derecha. Periodo, orden, favoritas y «Quitar» ahora se acomodan en filas (`flex-wrap`) con nombres cortos (`PERIODOS/ORDENES.corto`).
- Filtros más pequeños y sin `position: sticky` (se van al bajar). «Seleccionar» sale siempre que haya fotos.
- **La barra de la derecha era la de la página de atrás**: iOS la dibuja encima del diálogo. `html:has(.galeria-dialogo[open]) { overflow: hidden }` la congela; además el relleno de 120 px abajo solo va en la pestaña Fotos (`galeria-cuerpo-fotos`).
- Sin cambios de datos. Pruebas: 487 de la app.

## v200 — Galería sin barra de desplazamiento

- La barra lateral del desplazamiento de la galería se oculta (`css/99-pixel.css › .galeria-cuerpo`). Sin cambios de datos.

## v199 — La galería de fotos, como la de un celular

- **Pantalla completa con pestañas internas** (`#dialogo-fotos`, `vistas-fotos.js › contenidoGaleria`): **Fotos** (todas juntas por día, cuadrícula de 3 columnas), **Álbumes** (portadas con el tema de la misión + «Álbum nuevo») y **Comparar** (dos huecos «Antes» / «Después»).
- **Filtros y orden** (`fotos.js › filtrarFotos`, puro y probado): álbum (chips), periodo (todo, este mes, 3 meses, este año), favoritas y más recientes/antiguas. Los filtros se quedan arriba al bajar.
- **Organizar**: modo «Seleccionar» (elegir varias → comparar, ⭐ favorita, 📁 mover, 🗑️ borrar), `marcarFavorita`, `moverFoto` (no pisa si el destino ya tiene una foto de ese día) y **álbumes propios** (`estado.fotos.albumes`, `crearAlbumDeFotos` / `borrarAlbumDeFotos`).
- **Visor** (`#dialogo-visor`): pantalla completa, se desliza a los lados, con ⭐, comparar, mover y borrar. Con el comparador: elegir la foto de un hueco, o «Primera y última».
- Se quita la subventana de álbum de la v198 (ahora un álbum es un filtro de la pestaña Fotos, con su franja temática).
- Datos: `estado.fotos.albumes` es nuevo y opcional (las copias viejas lo reciben vacío; sin subir la versión). Pruebas: 487 de la app.

## v198 — Tus fotos, en álbumes con tema

- **«Mis fotos» = portadas**: `vistas-fotos.js › contenidoGaleria` dibuja una tarjeta por álbum (portada = su foto más reciente, número de fotos y «hace N días»). El álbum de progreso va primero, luego los que tienen fotos y al final los vacíos (borde punteado).
- **Tema por misión**: `app-foto.js › temaDe` toma el ícono y el color del atributo de la misión (`juego.infoAtributo`, también atributos propios); el de progreso es dorado. Se aplica con la variable CSS `--tema` (el color se valida con una expresión antes de ponerlo en el estilo).
- **Subventana de álbum** (`#dialogo-album`, encima de «Mis fotos»): cabecera con el tema, datos (fotos, rango de fechas, días de camino), fotos agrupadas por mes (lo nuevo arriba), visor de una foto con «‹ Antes» / «Después ›» y borrar, y comparador de dos. Botón «↔ Antes y después» (primera contra última).
- `fotos.js › resumenPorAlbum` (cuenta, primera, última y portada de cada álbum) en una sola lectura de la base.
- Al elegir una foto el visor sube solo (salto directo) y la foto reserva su tamaño antes de cargar (si no, la pantalla se corría). Pruebas: 484 de la app (+1).

## v197 — Fotos de progreso

- **Fuera el OCR de la v193** (`ocr/` y `js/foto.js`, ~6 MB). `sw.js` borra la caché `ocr-vida-rpg-*` que ya estaba en el teléfono.
- **`js/fotos.js` (nuevo)**: guarda las fotos en **IndexedDB** (`vida-rpg-fotos`), reducidas a ~1000 px (JPEG, ~150 KB). Una foto por álbum y día (la misma clave la reemplaza). Álbum de una misión = su id; álbum libre = `"progreso"`. Reglas puras: `faltaFotoSemanal`.
- **Misiones con foto**: `pedirFoto(mision, fecha)` abre la cámara, muestra la vista previa y guarda; `completarMision` sigue pidiendo `conFoto`. Desmarcar una misión NO borra su foto.
- **Galería** (`vistas-fotos.js` + `app-foto.js`, botón en Progreso): álbumes, miniaturas, foto grande (con borrar) y comparador de dos fechas (la más vieja a la izquierda y los días entre las dos).
- **Foto de progreso semanal**: `estado.fotos = { semanal, ultima }` (datos v43; las copias viejas la reciben encendida). Tarjeta en Hoy hasta que tomas la foto de la semana. Acciones `registrarFotoProgreso` y `configurarFotos`.
- Las fotos NO van en la copia .json; «Borrar todo» sí las borra. Pruebas: 480 de la app (−1 de OCR, +3 de fotos).

## v196 — Aurelio se viste según la hora y habla más

- **Ropa por hora**: `maestro.js › momentoDelDia(hora)` (madrugada 0–5, mañana 6–11, tarde 12–17, noche 18–23) y `ROPA_POR_MOMENTO` (traje y capa). `describirMaestro(hora = ahora)` ya devuelve el atuendo del momento: todas las pantallas donde sale Aurelio lo muestran sin cambiar. La tarde conserva su traje violeta de siempre.
- **Más conversación**: `TEMAS` (8 temas nuevos) en la lista «💭 Hablar de otra cosa» (modo `temas` de `dialogoMaestro`). Los temas de siempre (fuerza, normal, sin ganas, abrumado) ahora tienen 2–3 respuestas cada uno, elegidas al azar. Botón «🔁 Dime más» (`SIN_MAS` lista los temas con una sola respuesta); `maestro-opcion` intenta no repetir la respuesta anterior.
- De madrugada (antes de las 5) el saludo es «ve a dormir», antes que el «Buenos días».
- **Resumen para la IA siempre disponible**: botón en Progreso (copia la semana pasada) y nota con dónde pegarlo, también en la tarjeta del lunes.
- Datos: sin cambios. Pruebas: 481 de 481 (+2).

## v195 — Tu semana, lista para la IA

- **Botón «🤖 Copiar resumen para la IA»** en la tarjeta «Tu semana pasada» (`copiar-semana-ia` en `app-botones.js`). Copia un texto plano al portapapeles; no se envía nada a ningún servidor.
- **`resumen.js › textoSemanaParaIA(estado, lunes)`** arma el texto: cumplimiento, misiones y XP, días perfectos, mejor día, metas semanales, tareas, enfoque, ánimo, atributo descuidado, **racha y escudos** al terminar esa semana, **fallas** (la misión más fallada, el motivo y la hora típica), **gimnasio** (días frente a la meta y récords), **carrera** (km y carreras) y **tu revisión semanal**. Termina con una petición en español.
- No lleva finanzas ni el texto del diario (son privados). Datos: sin cambios. Pruebas: 479 de 479 (+1).

## v194 — Premios que se cobran al hacer tu misión

- **Premio ligado a una misión** (`recompensa.misionId`, opcional, en el formulario de la Tienda). Se canjea si la misión se hizo **hoy o ayer**, y una sola vez por cada vez que la hiciste (`recompensa.ultimoCanjeFecha`).
- **Reglas** en `js/juego.js › vueltaPendiente` y `premiosListos`. `canjear` las aplica; el canje guarda `recompensaId` y `anteriorCanje` para que `deshacerCanje` las restaure.
- **Dónde se ve**: la tarjeta de la Tienda (candado 🔒 y botón activo solo si está listo), un bloque 🎁 arriba en Hoy, y el último paso del ritual (`ritual-canjear`).
- **Aviso de la noche**: una línea «🎁 Premio listo» en `resumenParaAvisos` (el texto va en la caché del teléfono; el servidor no cambia).
- Datos: sin subir la versión (los campos nuevos son opcionales: las recompensas de antes quedan sin misión). Pruebas: 478 de 478 (+3).

## v193 — Misiones con foto

- **Casilla «📷 Pedir foto para completarla»** en el formulario de misión (`mision.foto`; las de cantidad no la llevan). Para completarla (botón, deslizar o el ritual de la noche) se abre la ventana «Prueba con foto».
- **Código del día** (`js/foto.js › codigoDeMision`): palabra + número (ej. «LOBO 47»), fijo para cada misión y fecha.
- **OCR sin internet**: Tesseract.js 7.0.0 + núcleo WebAssembly (SIMD + LSTM) + español `4.0.0_best_int` en `ocr/` (~6 MB, Apache 2.0). `js/pantallas/app-foto.js` achica la foto a 1600 px, la lee en modo página (3) y, si no aparece el código, en modo texto disperso (11).
- **Comparación tolerante** (`verificarTexto`): mayúsculas, sin tildes, letras parecidas unificadas (0/O, 1/I/L, 5/S, 8/B…) y distancia de Levenshtein dentro del texto, con 1 error cada 5 letras.
- `completarMision(estado, id, fecha, { conFoto })`: sin foto verificada lanza «Esta misión pide una foto…»; el registro guarda `foto: true`. La foto **no se guarda**.
- `sw.js`: caché aparte `ocr-vida-rpg-1` que no se borra al actualizar (los 6 MB se bajan una sola vez, al instalar).
- Datos: versión 42 (las misiones de antes quedan con `foto: false`). Pruebas: 475 de 475 (+2).

## v192 — La app, más ordenada por dentro

Nada cambia por fuera (mismas reglas, mismas pantallas: comparadas píxel a píxel). Solo el orden de los archivos:

- **`css/`**: `estilos.css` (15 634 líneas) se partió en 21 trozos seguidos, en el MISMO orden (la cascada no cambia); `estilos-pixel.css` es ahora `css/99-pixel.css`. `index.html` los carga en orden y las pruebas los leen juntos (`leerCSS()`).
- **`js/` en carpetas por tema**: `pantallas/`, `dibujo/`, `gym/`, `running/`, `torre/`, `arcade/`, `historias/`, `voces/`, `finanzas/`, `memento/`. Lo general (juego, datos, fechas, acciones, app.js…) sigue en `js/`. `voces-valle-2.js` pasó a `voces/voces-personas.js`.
- **Archivos gigantes divididos** (reexportados con `export *` o por nombre: el resto de la app no cambia): `acciones.js` → `acciones-misiones.js`, `acciones-aventuras.js`, `acciones-torre.js` (ayudantes compartidos en `acciones-comun.js`); `torre.js` → `torre-reglas.js`; `dibujo-monstruos.js` → `dibujo-salas.js`; `dibujo-ejercicios.js` → `-piezas.js` y `-movimientos.js`; `vistas-gym.js` → `vistas-gym-tarjetas.js` y `vistas-gym-dialogos.js`.
- **Registro de cambios**: v1–v149 a `docs/CHANGELOG-v1-v149.md`.
- Encontrado y sin tocar (para no cambiar cómo se ve): en `css/15-carga-reino.css` sobra una `}` tras el bloque v88, y por eso el navegador ignora la regla `.reino-franja` que sigue.
- Pruebas: 473 de 473 (una ajustada a la ruta nueva de La Senda en `sw.js`).

## v191 — Avisos más claros
- `sw.js › mostrar`: el cuerpo del aviso se junta en una sola línea (los renglones van separados por « · »), se acorta a 150 caracteres y lleva `timestamp`. iOS cortaba o mostraba mal los saltos de línea de los avisos de misiones y de recordatorio.
- Sin cambios en los datos ni en el servidor. Pendiente: probar en el iPhone cómo se ve el aviso de «Te faltan N misiones» (el ícono de la barra de estado sigue siendo el de la app).

## v190 — Pantalla fija, sin zoom
- Sin zoom con dos dedos: el viewport lleva `minimum-scale=1, maximum-scale=1, user-scalable=no`; `html` pasa de `touch-action: pan-x pan-y pinch-zoom` a `pan-x pan-y`, y `app.js › sinZoom()` cancela `gesturestart/change/end` (iOS) y los `touchmove` con 2 o más dedos (`passive: false`). Al alejar, iOS achicaba la app y quedaba descuadrada.
- `.cabecera`: fondo casi sólido sin `backdrop-filter` y con `transform: translateZ(0)`. En el iPhone, la cabecera pegada con desenfoque a veces dejaba de pintar su contenido (se veía solo lo de abajo, borroso).

## v189 — Fondos para el retrato
- Nuevo `js/dibujo-retrato-fondos.js`: `FONDOS_RETRATO` (12 fondos: clase, noche, atardecer, bosque, océano, volcán, montañas, castillo, cristales, galaxia, dorado, liso), `fondoValido` y `fondoDeRetrato`. Cada fondo es SVG simple en el espacio del retrato mini (ventana 75–125 × 11–61).
- Se guarda solo el id en `estado.ajustes.retratoFondo` (acción `elegirRetratoFondo`); sin él, o con un id desconocido, se usa el de siempre (el color de la clase). No hay versión de datos nueva.
- `avatar.describirAvatar` trae `retratoFondo`, así la clave del retrato en pixel art cambia con el fondo. Ajustes: sección «Fondo de tu retrato» con una cuadrícula de retratos (`pintarRetratoFondos`).

## v188 — La Senda del Reino, sin pantalla azul
- En el iPhone, mantener el dedo o tocar muy seguido (en TODA la app, no solo en el juego) seleccionaba texto (todo azul, como para copiar) o sacaba la lupa: cancelar `pointerdown` no lo evita en iOS.
- `js/app-plataformas.js`: `touchstart` cancelado (`passive: false`) en los controles y en `#senda-pantalla` (menos en los botones de pausa y resultado), y `selectstart` / `contextmenu` cancelados en toda `#senda`.
- `estilos.css`: `body` con `user-select: none` y `-webkit-touch-callout: none` (toda la app); solo `input`, `textarea`, `select` y `.seleccionable` pueden seleccionarse. Además `.senda` y todo lo de adentro con `user-select: none`, `-webkit-touch-callout: none`, sin resaltado al tocar y `touch-action: manipulation` (sin zoom de doble toque).

## v187 — La Senda del Reino, con cara de videojuego
- **`js/dibujo-plataformas-escena.js`** (nuevo): `PALETAS` (con `niebla` y `musgo`), herramientas (`ruido`, `lienzo`, `px`, `circulo` de filas nítidas, `halo` guardado por color/radio, `brillar` con `lighter`), `crearFondos(mundo, alto)` con 3–7 capas por mundo (`{ lienzo, factor, deriva, brillo, alfa, efecto }`: cielo, nubes que el viento mueve, montañas con borde de luz y bruma del color del aire, castillo en ruinas, soportes de mina con faroles, cristales, luna y aurora que late, nieve que sigue la forma del pico, volcán con cráter y ríos de lava, torres con ventanas y estandartes), `pintarFondos`, `pintarBrillosDeFondo` (lo que brilla se pinta después de la oscuridad), relámpagos cada 8,5 s en las cumbres, resplandor de lava que respira, `pintarAmbiente` (luciérnagas, polvo dorado, pájaros, polvo de cristal, gotas, nieve en dos profundidades con viento, ascuas y ceniza: sin lista, el lugar sale del reloj), `crearLuzDePantalla` (viñeta + tono del mundo + rayos del alba; un drawImage por cuadro) y `selloDeLuz` (la oscuridad ya no crea un degradado por luz en cada cuadro).
- **`js/dibujo-plataformas.js`** (reescrito): terreno con sombra según la profundidad, borde por mundo (pasto con briznas, roca con vetas, nieve amontonada, remate de la muralla), piedra con musgo o nieve encima, hielo con burbujas, tablas con veta y clavos; adornos quietos horneados con el terreno en la celda vacía (flores, lápidas, espadas, cristales, hongos, montones de nieve, calaveras, huesos; raíces, estalactitas, carámbanos y cadenas colgando) y `adornosVivos` por columna (pasto que se mece y se aparta al pasar, destellos de cristal y escarcha). Lava con costras, burbujas y gotas; antorchas de 4 cuadros con chispas y halo; monedas con borde; bloques con un brillo que cruza el bronce; estandarte que ondea; reliquias con chispas que giran. Oscuridad en dos pasadas (el fondo se oscurece y brilla lo suyo; lo de adelante se pinta en un lienzo aparte y se oscurece con `source-atop`). Héroe: sombra en el suelo, estirar/aplastar, respiración, estela dorada con la bendición, tinte rojo al caer; criaturas con saltito al caminar, sombra y destello blanco al recibir fuego; jefe con sombra y temblor al caer. Partículas nuevas (`polvo`, `estrella`, `anillo`, `brillo`), números con borde, saltito y parpadeo (los de 1000 o más, al doble), temblor de cámara en onda (dos ejes), destello rojo, fogonazo blanco e **iris** al entrar, caer, renacer (con columna de luz) y llegar al Arco.
- **`js/plataformas-motor.js`**: `destello`, `fogonazo` y `congelar` (hit-stop que aplica la app), `particula`/`polvo`/`estrella`; polvo al saltar, aterrizar, correr y frenar; estrellas y hit-stop al pisar, romper ladrillos y golpear al jefe; aros al tomar monedas y poderes; chispas al vencer al jefe y al llegar al Arco; `e.golpeEn`; textos con `max`; tope de 160 partículas.
- **`js/vistas-plataformas.js`**: mapa con un camino SVG por mundo (tramos recorrido / siguiente animado / cerrado) sobre su portada, nodos en `PARADAS` y tu héroe (`img[data-senda-heroe]`) parado en el elegido; `entradaDelNivel`, `pausaDeLaSenda(nivelId, { marcador, fichas, sonido, musica })`, resultado con tabla y `data-contar`, `valoresDelMarcador` / `formaDelMarcador` / `marcadorDeLaSenda` (dos marcos de pixel), `barraDelJefe` (placa con nombre, celdas por golpe y rastro), `recorridoDelNivel`.
- **`js/app-plataformas.js`**: `mostrarCapa` (clases `capa-entrada`, `capa-pausa`, `capa-final`: `.entrada` ya existía para el diario), tarjeta de entrada de 1,7 s con el juego quieto, hit-stop, marcador que solo cambia sus números, barra del recorrido, avisos por tipo, pausa con Reiniciar (1 ficha; cuentan los puntos que llevabas), Sonido y Música, conteo animado del resultado (tocar lo termina) y el héroe en el mapa.
- `index.html`: `#senda-recorrido`, el centro de la cruceta y las letras A/B. `estilos.css`: el bloque de la Senda desde «Marcos de pixel» (contorno sin esquinas con 4 sombras), mando con cruceta y botones redondos de bronce y cobre, menús y resultado. `sw.js`: v187 y el archivo nuevo.
- Pruebas: 3 nuevas (el jugo, el escenario con todas las fases del pintor y la interfaz) y la del marcador del jefe cambiada. App: 472 de 472.

## v186 — La Senda del Reino, más clara
- Vertical: `.senda-pantalla` pasa de `aspect-ratio` 0.86 a 0.74 (el juego es más alto) y `.senda-controles` es un panel con fondo y borde (en horizontal sigue flotando sin fondo). Se quita el hueco vacío entre el lienzo y los botones.
- Los bloques con premio (`pintarBloqueRunico`) dibujan un destello de cuatro puntas en vez de la runa que parecía una «R».
- Nivel 1-1: un bloque con premio (columna 6), monedas en la fila 10 (columna 8) y un esqueleto en la columna 10, todo a la vista desde el inicio.
- No se tocó la dificultad: falta que alguien juegue los niveles en el iPhone.

## v185 — La Senda del Reino (juego de plataformas en el Arcade)
- Juego nuevo: 4 mundos (Campos del Alba, Minas de Cristal, Cumbres de la Tormenta, Fortaleza de la Llama), 3 niveles en cada uno y un jefe al final (Caballero sin Nombre, Gólem de hierro, Dragón de la tormenta y Señor de la Fragua, con los sprites de la Torre). 3 reliquias por nivel (36 en total) en caminos altos, bloques y **escondites** (cuartos `_` que se ven como pared hasta cruzar su pared falsa `%`).
- **`js/plataformas.js`** (reglas puras): `FISICA` (aceleración/fricción, hielo, salto variable con `gravedadSalto`, coyote 0,1 s, buffer 0,12 s), `LETRAS`, `ENEMIGOS` (14 tipos: caminante, cuidadoso, caparazón que se patea, volador, picado, saltador, torreta de bolas o esquirlas, trampa en urna, ascua, araña, mazo), `JEFES`, `PODERES`, `PUNTOS`, `MUNDOS`; `prepararNivel` (cuadrícula → celdas y entidades; detecta los escondites), `moverCuerpo` (AABB contra la cuadrícula en pasitos de 6 puntos, tablas de un solo sentido, bloque escondido `+`), progreso (`nivelAbierto` se calcula, `registrarNivel`, `totalReliquias`) y `alcanzable` (búsqueda de saltos posibles, con margen, para las pruebas).
- **`js/plataformas-niveles.js`**: los 16 niveles como recetas (`nivel({ huecos, piezas, filas })` con `escalera`, `bloque`, `columna`, `techo`, `nicho`, `escondite`).
- **`js/plataformas-motor.js`** (sin DOM): `crearPartida(id, { ventajas, def })`, `paso(partida, entrada, dt)` a 120 pasos fijos por segundo. Poderes: Poción de vigor (armadura: aguanta un golpe y rompe ladrillos), Brasa rúnica (bolas de fuego, máx. 2), Bendición de la Llama (invencible 9 s), Amuleto de vida; vida cada 100 monedas. Puntos de control, cofres, plataformas que van y vienen, que suben y bajan y que se derrumban, cadenas de fuego, tiempo, combo de pisotones, cámara suave (en la pelea encuadra al jefe y a ti). Jefes con estados (aviso/embestida/aturdido, salto con ondas/rocas/cansado, vuelo/rayos/picado/posado, salto/abanico/pilares/cansado), puerta que se cierra y Arco sellado hasta vencerlos. Sonidos y avisos en colas (`sacarSonidos`, `sacarAvisos`).
- **`js/dibujo-plataformas.js`**: terreno de cada mundo pintado una vez en un lienzo del tamaño del nivel (lo animado, cada cuadro), 3 capas de fondo con paralaje que se repiten cada 512 puntos, oscuridad con luces en minas y fortaleza, contorno del héroe según el poder, letras de 3 × 5 para los puntos, `miniaturaDeMundo` para las portadas.
- **`js/app-plataformas.js`**: la capa `#senda` (mapa ↔ partida), lienzo de 240 puntos de alto (el ancho sale de la pantalla; en horizontal, pantalla completa con los botones encima), **multitoque** con `pointerId` (se puede deslizar de ◀ a ▶), teclado (flechas/A-D, espacio/W/Z, X/J/Shift, P/Esc), pausa al salir de la app, música por mundo (`musica.pistaDeEscena({ senda })`; «Batalla» con el jefe).
- **`js/vistas-plataformas.js`** (tarjeta del Arcade, mapa con el nivel elegido fijo arriba, resultado, pausa, marcador) y **`js/acciones-plataformas.js`** (`empezarSenda` gasta 1 ficha y exige nivel abierto; `terminarSenda` cobra como un minijuego —`arcade.JUEGOS.plataformas`, 400 pts por 💎 y 600 pts por XP de Fuerza, topes de siempre— y anota el nivel solo si llegaste a la meta; celebra el mundo superado y las 3 reliquias).
- Arcade: `textoVentajas("plataformas")` (armadura al empezar, vidas, fuego contra jefes, bendición más larga); reto del día nuevo `retos.RETOS.plataformas` (base 1500 pts). Sonidos nuevos: `pisar`, `bloque`, `ladrillo`, `poder`, `vidaExtra`, `patada`, `bola`, `secreto`. `minijuegos.esMinijuego` (los 3 de siempre).
- Datos v41: `arcade.plataformas = { niveles: { "1-1": { mejor, reliquias, tiempo, ganadoEn, veces } } }` (las partidas viejas lo reciben vacío en `completar`).
- Pruebas: 18 nuevas (niveles bien formados y alcanzables, choques, salto/coyote/buffer, pisotones y armadura, bloques, concha, fuego, meta y vidas, los 4 jefes, escondites, dibujo de cada nivel, progreso, acciones y topes, ventajas y migración, pantallas, sonidos y música, archivos). App: 469 de 469.

## v184 — Pasos de principales enlazados con misiones diarias
- Datos (campos opcionales, sin migrar): `submision.enlace = { misionId, veces, desde }` y `submision.auto` (true si se marcó sola). `juego.vecesDelEnlace(estado, enlace)` cuenta las completadas de esa misión desde `desde`.
- `acciones.js`: `enlazarSubmision` (sin `mision` quita el enlace) y `sincronizarEnlaces`, llamada al final de `completarMision` y `desmarcarMision` (las demás vías, como `fijarCantidad`, pasan por ellas). Marca el paso reutilizando `alternarSubmision` (mismo XP y misma celebración de principal completada) y solo desmarca los `auto`; `alternarSubmision` borra `auto` cuando lo toca el usuario.
- Pantalla: botón 🔗 en cada paso sin hacer (`abrir-enlace` → `<dialog id="dialogo-enlace">`, `PREPARAR.enlace`, formulario `enlace`) y el avance «🔗 Misión · 1 de 20» bajo el nombre del paso.
- Pruebas: 1 nueva.

## v183 — Las metas semanales, a la vista
- `vistas-hoy.js`: las misiones con `veces` (N por semana) salen en la pestaña Misiones, bajo las diarias (`bloqueSemana`, «🗓️ Esta semana x/y»), con «quedan N días» / «último día» en cada tarjeta. Se quitó la pestaña Metas (`seccionMetas`); si había guardada la subvista «metas», Hoy cae en Misiones. Las semanales siguen sin contar para el día perfecto ni para el contador de diarias.
- Pruebas: 1 nueva; se ajustaron las que nombraban la pestaña Metas.

## v182 — Mucha más apariencia
- `avatar.js › APARIENCIA`: +9 pieles, +9 ojos, +11 pelos, +10 trajes, +7 peinados, +7 barbas, +5 rostros, +8 marcas, +5 complementos y DOS campos nuevos: `orejas` (4) y `gafas` (6). `APARIENCIA_INICIAL` y `datos.js` los incluyen (las partidas viejas los reciben por la mezcla `{...base, ...guardado}`; no hace falta migrar).
- Dibujo (`dibujo-cuerpo.js`): `orejas()` (dentro de `cara`), `gafas()` (si hay unas elegidas, no salen las finas del Intelecto), casos nuevos en `pelo`, `barba`, `marcaDeCara`, `complemento` y `ROSTROS`.
- Pantalla: `vistas-heroe.js › TITULOS_APARIENCIA` (títulos de los dos campos nuevos). La prueba existente de «todas las opciones se dibujan» ya los cubre.

## v181 — Tu año en revisión
- **`js/anual.js`** (solo calcula): `resumenAnual(estado, anio, hoy)`, `aniosConDatos`, `mejorRachaDelAnio` (días seguidos con ≥1 misión; sin escudos ni días libres). Los jefes vencidos no guardan fecha, así que se muestran «en toda tu partida».
- **`js/vistas-anual.js`** (`contenidoAnual`) + `<dialog id="dialogo-anual">` + botón «Ver mi año» en Progreso. Cambiar de año usa `data-accion="anio-anual"` (no cierra la ventana). CSS `.anual-meses`.
- Pruebas: 1 nueva.

## v180 — Más vida en la pantalla
- **Chispas** (`efectos.js › chispas`): un canvas de 36 cuadritos que se apaga solo (1,4 s). Logros, cofres y premios (las celebraciones no épicas). Subir de nivel y vencer jefes siguen con el confeti.
- **Iluminación** (`pixel.js`: opciones `luz` y `suelo`): luz de borde desde arriba-izquierda y sombra elíptica bajo los pies. Activo en `sprites.js` para héroe, mascota, criaturas, personas, Maestro y los sprites del mapa de la carrera. La sombra de suelo solo en Maestro y personas (la Torre ya tiene `.ff-sombra`).
- **Estados vacíos** (`vistas-comun.js › ESCENAS_VACIAS`, `vacio(texto, escena)`): escena pixel + frase de Aurelio en misiones, metas, tareas, diario, gym, carreras y tienda.
- **Barra de XP** (`app.js › moverBarra`): clases `llenando` (brillo diagonal) y `nivel-destello`. Pestaña activa más grande y con brillo.
- Pruebas: 2 nuevas (luz/sombra; estados vacíos). App: 448 de 448.

## v179 — Mal día, rival de hace 30 días y capítulo del mes
- **Mal día** (datos v40): `estado.diasMalos` (fechas). `acciones.elegirAnimo("mal")` marca hoy si quedan días (`juego.MAL_DIA.maxPorSemana` = 2 en los 7 días que terminan hoy; `quedanMalosDias`); elegir otro ánimo lo quita. `juego.enDescanso` ahora también es verdadero en un mal día (`esMalDia`), así que vida, racha, pacto, semanales y avisos lo tratan como descanso de un día sin tocar `descansos`. Hoy muestra la misión más fácil como meta del día; Progreso lo rotula «mal día».
- **Rival de hace 30 días**: `running.rivalDeHace(carreras, fecha, {salida})` (±`RIVAL.margen` = 10 días, sin pista; con `salida`, solo si empezó a ≤250 m y tiene recorrido) y `running.contraRival` (diferencia de ritmo en s/km). `vistas-running.fantasmaDe` lo prefiere a «la última vez» (el mapa dice «👻 tú hace 1 mes»); el resumen de la carrera suma «Tú contra tú» (`htmlRival`).
- **Capítulo del mes**: `libro.capituloDelMes` / `capitulosDeMeses` (meses ya terminados con actividad; usa `temporadas`, `revisiones`, `diasMalos`, racha). No cambia la numeración de los capítulos diarios; el índice del libro los lista (página `mes-AAAA-MM`) y `libroComoTexto` los incluye.
- 3 pruebas nuevas.

## v178 — acciones.js dividido por área
- Sin cambios de comportamiento. `js/acciones.js` (3485 líneas) se dividió en `acciones-gym.js` (Gimnasio), `acciones-running.js`, `acciones-finanzas.js` y `acciones-comun.js` (ayudantes compartidos: `ganar`, `nuevoId`, `buscar`, `validar…`, `numeroEntre`). `acciones.js` los reexporta con `export *`, así que en la app se sigue usando `acciones.x`. Las 177 funciones públicas son las mismas.
- Los archivos nuevos van en `ARCHIVOS` de `sw.js`. `acciones-gym.js` y `acciones-running.js` importan `completarMision` de `acciones.js` (es una función: el ciclo de imports es seguro).
- Prueba nueva: ningún nombre se repite entre los archivos de acciones (con `export *`, un repetido desaparecería sin aviso). Pruebas: app 443.

## v177 — Plantillas de rutinas
- `js/rutinas-plantillas.js` (nuevo, en `ARCHIVOS` de `sw.js`): `PLANTILLAS` (Cuerpo completo, Empuje / Tirón / Piernas, Torso / Piernas), `OBJETIVOS` (déficit, mantener, aumento), `armarPlantilla(id, objetivo)` y `objetivoSugerido(gym)` (según tu peso objetivo). Cada ejercicio es `[id, series déficit, series mantener, series aumento]`; el objetivo cambia las series y qué ejercicios lleva (las repeticiones son fijas por ejercicio).
- `acciones.crearRutinasDePlantilla`: las rutinas salen como copias con `base: null` (no entran al turno de «Hoy toca»; `gym.siguienteRutina` busca hacia atrás la última sesión que sí cuenta). `MAX_COPIAS` sube a 12. Helpers `nombreEnUso` e `idLibreDeCopia` (compartidos con `duplicarRutina`).
- Pantalla: botón «📚 Nueva rutina desde una plantilla» en Rutinas y `dialogoPlantilla` (plan, objetivo, vista previa de las rutinas con sus series); la sección pasa a llamarse «Mis copias y plantillas». Pruebas: app 442.

## v176 — Elige ejercicios viéndolos
- `dialogoElegirEjercicio` (`js/vistas-gym.js`): al tocar un ejercicio de una rutina (o «➕ Agregar ejercicio») se abre una ventana con su animación (`escenaEjercicio`), los músculos en chips y la lista del músculo; tocar uno lo muestra y «Cambiar por este» / «Agregar a la rutina» lo aplica. Reglas: `gym.ejerciciosParaElegir`. Acciones nuevas en `app-gym.js`: `gym-rutina-elegir`, `gym-rutina-nuevo`, `gym-elegir-musculo`, `gym-elegir-ver`, `gym-elegir-usar` (estado en `ui.elegirEjercicio`). Se quitan los `<select>` de Rutinas y sus manejadores en `app.js`. Pruebas: app 441.

## v175 — Rutinas mejor organizadas
- `tarjetaEditarRutinas` (`js/vistas-gym.js`): intro de una línea con «¿Cómo funciona?» plegado; «Rutinas de la semana» primero (cada una con ejercicios, series y músculos); «📋 Mis copias» en su sección con contador; `tarjetaVolumenPlaneado` ahora es un `<details>` al final con el aviso «⚠️ N por reforzar». Estilos `.gym-rutinas-*` en `estilos.css`. Pruebas: app 440.

## v174 — Más herramientas para tu gym
- Aviso de días sin entrenar: `gym.diasSinEntrenar`, `diasParaAvisar` (⌈7 ÷ meta⌉ + 2, mínimo 3) y `avisoSinEntrenar`; sale como una frase más en `tarjetaGymHoy` (sin ventana ni botón).
- Duplicar rutina: `estado.gym.copias` `[{ id, base, nombre, icono }]` (hasta `MAX_COPIAS` = 6); sus ejercicios van en `estado.gym.rutinas[idDeLaCopia]` y `gym.aplicarRutinas(rutinas, copias)` las pone al final de `RUTINA` con `copia: true`. No entran en el turno (`siguienteRutina`), en el volumen planeado ni en `rutinaPara`. `acciones.duplicarRutina` y `borrarCopiaDeRutina` (no se borra si ya hay entrenamientos con ella). Datos: `version` 39.
- CSV: `gym.sesionesACsv` (una fila por serie, con BOM para Excel) y el botón de Ajustes del gym (`exportarCsvGym` en `app-gym.js`: compartir en el iPhone, descargar en la compu).
- Aviso de serie: `estado.gym.avisoSerie` (sin migración: `gym.avisoDeSerie` cuenta como `true` si falta). Un tic por segundo en los últimos 3 s del descanso (`js/app.js`, `ui.ticDescansoGym`) y el sonido/vibración de siempre al terminar, ahora con interruptor.
- Pruebas: el bloque que las ejecuta estaba a la mitad de `pruebas.js` y las que se agregaron debajo (desde la v161) se registraban pero nunca corrían. Se movió al final. Al correrlas salieron dos pruebas viejas desactualizadas (discos con barra de 10 kg y saltar el único ejercicio); ya están corregidas. App 440.

## v173 — Un entrenamiento más cómodo
- Pantalla encendida: `ajustarPantallaGym` (`js/app-gym.js`, se llama en cada `dibujarPantalla`) usa `mantenerPantallaDespierta` (`app-running.js`; ahora no pide dos veces y se vuelve a pedir tras el `release` del teléfono). Ajuste `estado.gym.pantalla` (sin migración: `gym.pantallaEncendida` cuenta como `true` si falta), botones Sí/No en «Ajustes del gym».
- PIN: `gym.entrenandoAhora` — solo se salta en las primeras 4 h (`HORAS_SIN_PIN`) de un entrenamiento o carrera (`js/app.js`).
- Entrenamiento viejo (>12 h, `gym.entrenamientoViejo`): `dialogoSeguirGym` ofrece Descartar / Terminar (`gym-terminar-viejo`) / Continuar.
- Peso corporal: `gym.PESO_CORPORAL`; con 0 kg el contador dice «Peso corporal» y la pista de la primera vez no dice «empieza ligero».
- Modo foco: «Siguiente: …» bajo el botón grande; se quita el 🧮 del contador de peso (la calculadora sigue en la lista).
- Pruebas: app 439.

## v172 — Cambiar ejercicio, solo del mismo músculo
- `js/vistas-gym.js` (`dialogoCambiarEjercicio`): la lista solo trae los ejercicios del músculo del ejercicio que cambias (antes también los demás músculos). Pruebas: app 438.

## v171 — Sin PIN durante el entrenamiento
- `js/app.js` (`visibilitychange`): si hay un entrenamiento del gym (`estado.gym.encurso`) o una carrera (`estado.running.encurso`) en curso, no se tapa la app con el PIN al pasar a segundo plano. Al terminar o cancelar, vuelve a pedirlo como antes.
- Pruebas: app 438.

## v170 — Actualización de avisos
- Sin cambios de lógica: sube la versión para que el iPhone instale de nuevo la app con los avisos del descanso (`js/app.js`, `js/avisos.js`, `sw.js`).

## v169 — Avisos del descanso
- Al irse a segundo plano con un descanso del gym corriendo, `js/app.js` (`visibilitychange`) llama a `avisos.avisarDescansoGym(fin)`, que manda `/descanso-gym` con `keepalive`. Al volver manda `null`. El Worker (`servidor/worker.js`) programa una alarma exacta en un Durable Object (clase `Descanso`, `setAlarm`; migración `new_sqlite_classes` en `wrangler.toml`), avisa una sola vez y la cancela si vuelves. Antes se probó con el reloj por minuto, pero llegaba hasta 60 s tarde. Tipo de aviso `descanso` en `sw.js`.
- Pruebas: servidor 12, app 438.

## v168 — Cada ejercicio, su propio movimiento
- `js/dibujo-ejercicios.js`: 51 movimientos nuevos en `MOVIMIENTOS` (64 en total; los 13 originales no cambian) y fondos nuevos en `MAQUINAS` (`NOMBRES_DE_FONDOS`). Ayudantes nuevos (`torreDePolea`, `rodillo`, `respaldo`, `discoDeCanto`…); los cambios de torso y de cuerpo tienen valor por defecto, así que lo viejo se dibuja igual.
- `js/gym.js`: `MOVIMIENTO_DE` apunta cada ejercicio de `CATALOGO` a su movimiento. `js/gym-aurelio.js`: dos consejos en `TECNICAS` por movimiento nuevo.
- Pruebas: el conteo de movimientos pasa de 13 a 64 y hay una prueba nueva (movimientos distintos, fondos existentes, consejos, ejercicios que los usan).
- Pendiente de ver en el iPhone. Aproximados: `pajaros-mancuernas` y `aperturas-mancuernas` (muestran máquinas), `curl-polea` y `curl-barra` (muestran mancuernas), `arnold-press` sin giro de muñeca.

## v167 — Un solo calentamiento
- Se quita el botón «Calentar» general (`gym-calentar`) del foco (`pie`) y de la lista. `gym.cerrarEntrenamiento`: `calentado` también es verdadero si se marcó alguna serie de calentamiento (`cal`), así los +10 XP (`XP_CALENTAMIENTO`) siguen existiendo, una vez por entrenamiento. La acción `calentarGym` queda (la usan las pruebas). Pruebas: 437.

## v166 — Un entrenamiento más flexible
- Cambiar / saltar un ejercicio del entrenamiento en curso (`acciones.cambiarEjercicioEnCurso`, `saltarEjercicioGym`; solo si no tiene series hechas). `en.plan` guarda las series que de verdad ibas a hacer (`gym.seriesPlaneadasDe`) para que saltar no quite el «completo» ni las monedas; la sesión guarda `planeadas`.
- Calentamiento por ejercicio: series con `cal: true` (`agregarCalentamientoGym`, `quitarCalentamientoGym`; 50/70/85 % del peso de trabajo, máx. 3, descanso de 30 s). No se guardan en la sesión ni cuentan: `seriesMarcadas`, `seriesTotales`, `volumenMarcado`, récords y XP las ignoran.
- Corregir una sesión guardada: `gym.armarSesion` (compartida con `cerrarEntrenamiento`), `gym.corregirSesion`, `acciones.corregirSesionGym` (recalcula XP, monedas y récords contra las sesiones anteriores y ajusta Fuerza y monedas; las sesiones posteriores no se recalculan). Diálogo `#dialogo-gym`.
- Calculadora de discos: `gym.discosPara`, `estado.gym.barra` (10/15/20; ajuste «barra»), botón 🧮 en el foco y en la lista.
- Gráfica grande por ejercicio en Progreso: `gym.progresoDe`, `ejerciciosConHistorial`, `graficaGrande` y `tarjetaGraficaEjercicio` (`ui.gymEjercicio`).
- Datos: `version` 38 (`gym.barra`). Pruebas: 437.

## v165 — Aurelio cobra vida en el gym
- `gym-aurelio.js`: más frases en `mitad`, `serie` y `ejercicio`.
- `vistas-gym.js`: `cabezaDeAurelio` (retrato + símbolo, `EMOTE_DE_FRASE`) y `figuraDeAurelio` (figura de cuerpo entero en `.gym-foco-escenario`); el texto del globo lleva `data-aurelio-texto`; 🤔/🛌/⚖️ en «Aurelio te avisa».
- `app-gym.js › animarAurelio` (se llama al final de `dibujarPantalla` en el gym): escribe la frase letra por letra una sola vez (tocar el globo la completa), reacciona (`reacciona-serie|ejercicio|record`) y llega caminando (`ui.aurelioEntra`, al empezar). Solo ocurre con una frase nueva: redibujar no lo repite. Sin movimiento si `prefers-reduced-motion`.
- CSS `gym-aurelio-*` en `estilos.css`. La reacción es un salto y un destello con la figura quieta (no hay sprites de «victoria» de Aurelio). Sin cambio de datos. Pruebas: 432.

## v164 — Un gym que te ayuda a progresar
- `gym.js` › `sugerencia`: devuelve `texto` («Última vez: 60 kg × 8. Hoy intenta…»), `hoy`, `kg`, `reps` y `motivo`. Doble progresión, afinada con el RIR (≥ 3 → subir; 0 sin llegar al mínimo → bajar 2,5 kg).
- RIR opcional por serie (`serie.rir`, 0–4): en el descanso del modo foco (`gym-rir`, `acciones.anotarRirGym`, `encurso.ultima`) y un selector en la lista (`data-gym="rir"`). Se guarda en la sesión solo si se anotó.
- Récords: `records[i].tipos` (`1rm`, `peso`, `reps`) y `nivel` (`nivelDeRecord`: +1 cada 3 récords del ejercicio, hasta 5); monedas `monedasDeRecord`. El récord en vivo también cuenta el peso y las series ya hechas hoy. `salonDeRecords` + `MEDALLAS` → «🏛️ Salón de récords» en Progreso (reemplaza «Récords personales»).
- Estancamiento: `estancamiento`, `estancados` (últimos 42 días), `propuestasDeEstancamiento` (descarga, rango, ejercicio parecido).
- Descarga: `estado.gym.descargas = [{ lunes, cobrada }]`; `semanasSinDescanso`, `tocaDescarga` (6 semanas), `seriesDeDescarga` (−40 %), `seriesPlaneadasDe`; `empezarDescargaGym` / `quitarDescargaGym`; premio `PREMIO_DESCARGA` en el primer entrenamiento de la semana; las sesiones llevan `descarga: true`.
- Equilibrio: `musculosOlvidados` (< 6 series en cada una de las 3 últimas semanas entrenadas) y `rutinaPara`.
- Diario: `sesion.nota = { sueno, texto }` (`anotarNotaGym`, en el resumen), `rendimientos` y `patronesDelGym` (sueño y partes del cuerpo que se repiten) → «📓 Diario del gym».
- «Aurelio te avisa» en Entrenar (descarga, estancados, olvidados; si no hay nada, el consejo del día). Racha semanal en la fila de Hoy.
- `#dialogo-gym` + `app-gym.js › ofrecerSeguirGym`: al abrir la app con `gym.encurso`, «¿Continuar el entrenamiento?».
- Datos: `version` 37 (`descargas`). Pruebas: 431.

## v163 — Entrena en silencio y coma en los kilos
- `app-efectos.js` › `ponerMusica`: no suena la música de fondo mientras hay `estado.gym.encurso` (incluye el modo foco). Los efectos siguen.
- `vistas-gym.js`: los campos decimales (peso de hoy, objetivo, medidas y kg de las series) pasan a `type="text"` con `inputmode="decimal"`, para que el teclado del iPhone muestre la coma. `numeroEntre` ya convertía la coma.
- Sin cambio de datos guardados. Pruebas: 423.

## v162 — Volumen semanal por músculo en Rutinas
- `gym.js`: `seriesPlaneadasPorMusculo()` suma las series de `RUTINA` (incluye las rutinas editadas) y `valoracionDeVolumen(n)` (nada, poco < 10, bien 10–20, mucho > 20).
- `vistas-gym.js`: `tarjetaVolumenPlaneado()` encima de las rutinas en la pestaña «Rutinas».
- Sin cambio de datos guardados. Pruebas: 423.

## v161 — Rutinas editables y más ejercicios
- `gym.js`: `EXTRAS` pasa de 18 a 59 ejercicios; `CATALOGO` (todos) y `ejercicioPorId` lo usa. `estado.gym.rutinas = { rutinaId: [{ id, series }] }` guarda tus cambios y `aplicarRutinas` los pone en `RUTINA` (se llama al cargar, al empezar y al editar). Sin cambio de `version` (campo opcional).
- `acciones.js`: `agregarEjercicioARutina`, `quitarEjercicioDeRutina`, `cambiarEjercicioDeRutina`, `cambiarSeriesDeRutina`, `moverEjercicioDeRutina`, `restaurarRutina` (no se edita con un entrenamiento en curso).
- `vistas-gym.js`: pestaña «✏️ Rutinas» (`tarjetaEditarRutinas`); selects en `app.js` (`data-gym-rutina-agregar`, `data-gym-rutina-cambiar`).

## v160 — Entrenar de verdad
- `vistas-gym.js`: se quitó el botón «Marcar que hoy entrené» (pestaña y Hoy) y la lista «marcar otra rutina u otro día». Ahora «Empezar entrenamiento» (`gym-empezar`); el día cuenta al terminar y anotar series. `marcarGymRapido` sigue en `acciones.js` pero ya no tiene botón.

## v159 — sw.js roto (arreglado)
- `sw.js` empezaba con dos `+` sueltos (`+` y `+// sw.js…`, sobrados de un parche) desde la v155: error de sintaxis, el navegador no podía instalar el service worker nuevo, así que el iPhone no se actualizaba ni mostraba «Actualizar». Se quitaron.
- Prueba nueva: `sw.js` se compila sin error de sintaxis.
- Pruebas: 421.

## v158 — El gym en foco, a pantalla completa
- `app.js` › `dibujarPantalla`: clase `gym-pantalla-completa` en el `<body>` cuando la pantalla es el gym y `vistasGym.pantallaCompletaGym(estado)` (entrenamiento en curso + modo foco). Esconde `.cabecera`, `.pestanas` y `.run-flotante`; se quita al salir, terminar, cancelar o pasar a la lista. `refrescar` ya no guarda `--alto-cabecera` = 0 cuando la cabecera está escondida.
- `vistas-gym.js` › `vistaDeFoco` rehecho: cabecera con «‹» (`data-accion="ir"` a Hoy), `mapaDeSeries` (todas las series en cuadritos por ejercicio), escenario que crece (`flex: 1`) con la figura o el reloj del descanso (figura quieta y oscura detrás, Aurelio abajo), fichas de músculo y «Última vez», nombre + serie + `gym-pips`, contadores y botón dorado. Mismas acciones y atributos (`gym-ajuste`, `gym-contar`, `gym-serie`, `gym-saltar-descanso`, `gym-descanso-mas`, `data-gym-inicio`, `data-descanso-fin`, `data-gym-anillo`). «¡Todo hecho!» muestra la pose `victoria`.
- `dibujo-ejercicios.js` rehecho: esqueleto con huesos de largo fijo (`MEDIDAS`), cinemática inversa (`articulacion`) para codos y rodillas, cuerpo con cápsulas de músculo sombreadas a mano (`parte`, `bola`), cabeza con pelo/barba según la apariencia, top deportivo con cuerpo femenino, músculo según el físico (`musculoDe`). 13 movimientos + `victoria`, cada uno con `fondo` (máquinas que no se mueven) y `encuadre`. `CUADROS` (20 por repetición: pausa abajo, subida, aprieta arriba, bajada lenta), `tiraDeMovimiento`, `animacionDeTira`, `dibujarFondoEjercicio` (sala ancha: de x -80 a 200 y de y -60 a 110), `encuadreDe`. Ya no exporta `dibujarMovimiento`.
- `retratos.js`: `pedirImagen` (sirve para `<img>` y para `<image>` de SVG), `escenaEjercicio` (fondo + tira en pixel art; `<animate attributeName="x" calcMode="discrete">` salta de cuadro en cuadro) y `prepararEscena` (prepara el ejercicio siguiente). `pixel.js` › `pixelar`: opción `margen`.
- `estilos.css`: bloque `v158` (reemplaza a los de v78 y v156): pantalla completa con `100dvh` y `safe-area`, marcos de píxel, contadores de juego, botón dorado; `.gym-demo` de 120 px.
- Pruebas: 420 (5 nuevas o rehechas: figuras y tira, huesos de largo fijo, animación cuadro a cuadro, la lista y la pantalla completa).

## v157 — Aviso de actualización más confiable
- `app-version.js`: `revisarVersionNueva()` compara el número de la caché guardada (`vida-rpg-vN`) con `VERSION_APP`; si la caché es más nueva, muestra «Actualizar». Antes solo salía con `controllerchange`, que el iPhone puede no mandar. Se llama al registrar el SW, en `updatefound`/`statechange`, al volver a la app y 4 s después de `update()`.
- Pruebas: 416.

## v156 — Gym en foco: todo en una pantalla
- `vistas-gym.js` › `pantallaGym`: con el modo foco y un entrenamiento en curso, solo se dibuja el entrenamiento (sin encabezado ni `tarjetaNivel`).
- `vistaDeFoco`: cabecera en una fila (rutina, tiempo, kg, contador); figura o anillo de descanso a la izquierda y nombre/serie/última vez (solo la mejor serie) a la derecha; peso y reps lado a lado; «Contar» al lado de «Terminé la serie»; ±15 s a los lados de «Empezar serie N»; pie en una fila (Calentar, Terminar, Lista, Cancelar). Si toca subir de peso, la pista es el botón. Se quitó el consejo de técnica en el foco.
- `estilos.css`: bloque `v156` (reemplaza al de v155).
- Pruebas: 416 (3 ajustadas a los textos nuevos).

## v155 — Gym en foco sin deslizar
- `vistas-gym.js` › `vistaDeFoco`: durante el descanso, un solo botón «Empezar la serie N ya» (`gym-saltar-descanso`, que solo termina el descanso). Antes «Empezar ya» ejecutaba `gym-serie` y marcaba la serie como hecha. Se quitó «Saltar el descanso» (duplicado). Se oculta el botón de contar mientras descansas.
- `vistas-gym.js`: la burbuja de Aurelio sale del modo foco por serie (queda en «¡Todo hecho!»).
- `estilos.css`: bloque `v155` con tamaños compactos para `.gym-foco`.
- Pruebas: 416 (2 actualizadas al nuevo botón).

## v154 — Con «Mal», sin gym
- `vistas-hoy.js` › `cuadriculaDeAreas`: con el ánimo «Mal» (modo esencial) ya no se dibuja la tarjeta de gym.
- Pruebas: 416 (1 nueva).

## v153 — Marcas de colores en Memento
- `memento.js`: `semanasMarcadas` devuelve `{ km, gym, misiones }` (antes `{ carrera, meta }`). Mismas reglas: km = carreras y metas de km; gym = meta de días; misiones = 7 días.
- `vistas-memento.js`: `TIPOS_MARCA`; cada tipo tiene su trazo (`mm-km`, `mm-gym`, `mm-misiones`). Si una semana tiene varios, la casilla se parte en franjas (2 tipos: 3 y 2 puntos; 3 tipos: 2, 1 y 2). Leyenda y texto de la casilla actualizados.
- `estilos.css`: colores azul, morado y verde.
- Datos: sin cambios (`version` sigue en 36).
- Pruebas: 415.

## v152 — Luz del sol real en la carrera y criatura en «Ver todo»
- `running.js`: `horasDelSol(lat, lon, ms)` (salida y puesta del sol, fórmula NOAA; `null` en los polos) y `horaDeLuz(hora, sol)` (traduce la hora real a amanecer, día, atardecer o noche).
- `vistas-running.js`: `luzDelDia(ms, traza)` usa el primer punto del GPS; sin GPS, las horas fijas de siempre. Lo usan el mapa en vivo, el historial y el resumen.
- `vistas-pelea-mapa.js`: `lugarDeCriatura` acerca la criatura por tu camino (de 4 en 4 puntos) cuando delante no cabe, en vez de saltar al otro lado.
- La pista (`mapaDePista`) ya recibía la hora; ahora también sigue el sol real.
- Datos: sin cambios (`version` sigue en 36).
- Pruebas: 415 (2 nuevas).

## v151 — Dificultad adaptable
- `resumen.js`: `ajusteDeDificultad(estado, mision, hoy)` (ventana de 21 días, mínimo 10 intentos; ≥ 90 % propone subir, ≤ 40 % bajar; no mira metas «N veces» ni del mes) y `ajustesDeDificultad` (hasta 3 misiones activas).
- `acciones.js`: `aplicarDificultad(estado, { misionId })`: vuelve a calcular la propuesta antes de cambiar la misión.
- `vistas-diario.js` y `app-botones.js`: la propuesta aparece en la ventana «Revisión semanal» con su botón.
- Datos: sin cambios (`version` sigue en 36).
- Pruebas: 413 (2 nuevas).

## v150 — Pase de temporada
- `temporadas.js`: `PASE` (4 niveles), `progresoDelPase` (promedio de las metas, cada una hasta 100 %) y `nivelesPorCobrar`.
- `acciones.js`: `cobrarPase(estado, mes)`; se llama al revisar cambios (mes en curso) y antes de cerrar un mes.
- `vistas-temporada.js`: barra y niveles dentro de la tarjeta de temporada.
- Datos: `estado.temporadas[mes].pase = { cobrados: [25, …] }` (sin cambiar la versión de los datos).
- Pruebas: 411. Dos pruebas de cierre cambiaron sus números porque el pase también paga.

## Versiones anteriores

De la v1 a la v149: [docs/CHANGELOG-v1-v149.md](docs/CHANGELOG-v1-v149.md).
