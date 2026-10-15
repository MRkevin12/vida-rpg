# Registro de cambios

Todas las versiones de Vida RPG. La versión instalada se ve en la app, en Ajustes.

## v56 — Animaciones y cinemáticas del reino
- **`js/cinematicas-reino.js`** (nuevo, en `sw.js`): cinemáticas de región, de guarida liberada (`senor`), de fortaleza, del Arcade, de Las Voces (intro, voz recuperada y epílogo) y de cada capítulo de la historia de la Torre. Mismo reproductor (`cine.js`), ahora con fondos `pintura:…` (fondos/), actores nuevos (`maestro`, personas de la aldea, retratos de jefes enmarcados) y `ambiente` (niebla, chispas, lluvia).
- Se ven una vez (`estado.mapa.cines`, datos v27, `acciones.verCinematica`): máximo 2 por visita al mapa (`revisarCines` en app.js). Se repiten con «🎬 Ver la escena de esta región», «▶ Ver escena» (Crónica e Historia) y «Volver a ver las escenas» en Ajustes. Respetan «Cinemáticas» de Ajustes.
- **Mapa:** `.mapa-trofeo` (retrato del señor vencido en su guarida, con ✓).
- **Historia:** capítulos como `<details>` con `▶ Ver escena` (`cinematicaDeCapitulo` parte el texto en tomas; el guardián aparece y cae en su capítulo).
- **Animaciones globales (CSS):** `.entra` al cambiar de pantalla (`animarEntrada`), tarjetas en cascada, barras que se llenan, rebote en botones y pestañas, ventanas con fundido. Todo se apaga con `prefers-reduced-motion`.

## v55 — Misiones principales al frente
- `destacadasDeHoy(estado)`: tarjeta fija arriba de Hoy (en todos los ánimos, no viendo ayer ni en la pestaña Principales) con las 3 principales más avanzadas, su barra y el siguiente paso con su check (`alternar-submision`). La pestaña «Principales» pasa al 2.º lugar.

## v54 — La pestaña Aurelio, al final
- En `pantallaHoy` la pestaña `aurelio` pasa a ser la última y la pestaña por defecto vuelve a ser `misiones`.

## v53 — El viaje se acelera con cada jefe
- `campana.jefesVencidos(estado)` (por daño, aunque el jefe espere en su región) y `factorDeViaje` (`1 + 0,1 × jefes`, tope ×3). `mapa.pasosTotales` = `pasosBrutos × factor`; `estadoCampanas` usa el mismo factor para saber en qué región estás. El mapa muestra «🐎 Viajas ×N más rápido».

## v52 — Jefes atados al mapa, pestaña Aurelio y arreglos
- **Jefes y mapa** (`campana.js`): `regionDelJefe(n)` (5 regiones con jefes + la Ciudadela por vuelta) y `regionDelHeroe(pasos)`. En `estadoCampanas`, un jefe solo cae si tu héroe ya llegó a su región ese día (`fechasDePasos`); si no, el daño se guarda (`esperando`, `guardado`, `region`, `pasosHeroe`). Los vencidos antes de la v52 quedan en `estado.campana.libres` (migración en `completar()`, datos versión 27) y usan `VIDAS_ANTES`.
- **Jefes más duros:** `VIDAS = [150, 300, 500, 750, 1100]` (antes 80, 160, 260, 400, 600). Aventuras, el mapa y Hoy muestran «🔒 Te espera en…» con los pasos que faltan.
- **Pestaña Aurelio en Hoy** (no en el esencial), la primera y la que abre: `tarjetaHeroe` (sin la fila de rivales), `resumenRivales`, `panelDelDia`, `tarjetaSemana` y `tarjetaFoco`.
- **Arreglos:** «Por atributo / Por momento» usaba la acción `subvista` con `data-pantalla="hoy-agrupar"` y `cambiarPantalla` fallaba → nueva acción `agrupar-hoy`. El interruptor de Ajustes ahora llama a `elegirAnimo`. 3 pruebas fallaban desde la v49 (CI en rojo en v49–v51): actualizadas. 222 pruebas.
- **Pantalla fija:** `html { touch-action: pan-x pan-y pinch-zoom }` (sin zoom con doble toque, sí con dos dedos) y `body { overflow-x: clip }`.

## v51 — Hoy en secciones
- `pantallaHoy`: pestañas `.hoy-tabs` (`subvista.hoy`: misiones · metas · tareas · importantes · diario) y solo se dibuja la elegida, en todos los ánimos (el diario no sale en el esencial). Reemplaza al resumen del modo esencial y a `ir-grupo`.
- Misiones y tareas agrupadas por atributo con `agruparPorAtributo` (título de color y «hechas/total»); alternable a «Por momento» con `subvista["hoy-agrupar"]`. Las metas semanales tienen su propia pestaña.
- El orden cambió: botón de ánimo, pestañas y contenido primero; semana, foco, avisos, héroe y «Tu día» debajo.

## v50 — Portada para «¿Cómo te sientes hoy?»
- `#dialogo-animo` ahora es pantalla completa (`.dialogo-animo`): pintura `fondos/camino.jpg` con velo oscuro, el Maestro Aurelio, saludo por hora y una cita de `maestro.CONSEJOS` que cambia por día. La arma `vistas.pantallaAnimo(nombre, hora, dia)`.
- Botón grande `.boton-animo` arriba de Hoy (reemplaza al chip): muestra el ánimo actual y reabre la portada.

## v49 — ¿Cómo te sientes hoy?
- **Pregunta al abrir la app** (`#dialogo-animo`, `preguntarAnimo`/`elegirAnimo` en app.js): 😔 mal → modo esencial (Hoy y Tienda), 🙂 normal → `body.modo-normal` (Hoy, Progreso, Héroe y Tienda; sin Aventuras), 😄 bien → todo el menú. Guarda `ajustes.animo` y pone `ajustes.esencial`. El botón de Hoy («🙂 Mi ánimo») reabre la pregunta. `ajustes.preguntarAnimo` (por defecto sí) se apaga en Ajustes; apagado, vale lo de la v47. Acción: `acciones.elegirAnimo`.

## v48 — Modo esencial, más claro
- **Hoy esencial en tres grupos de colores** (`pantallaHoy`): ⚔️ **Misiones diarias** (cian: la lista de hoy con sus momentos, metas semanales, «+ Nueva misión» y «Ordenar»), 📌 **Tareas** (oro: las de una sola vez) y 🎯 **Misiones importantes** (violeta: las principales, con otro nombre y sin hablar de jefes). Arriba, un resumen con tres números (`⚔️ 2/7 · 📌 1 · 🎯 1`) que llevan a cada grupo. Sin diario.
- **Dos pestañas:** Hoy y Tienda (sin Progreso). La **Tienda esencial** muestra solo el saldo de monedas 🪙 y los premios reales con su historial de canjes: sin gemas, poción, equipo ni mascotas.
- Interno: `seccionPrincipales(estado, esencial)`, `PANTALLAS_ESENCIALES` = hoy, tienda, enfoque, y el manejador `ir-grupo`. 220 pruebas.

## v47 — Siempre en modo esencial
- **«🚪 Abrir siempre en modo esencial»** (`ajustes.esencialAlAbrir`, encendido por defecto): al abrir la app (`entrarAlJuego`, también tras el PIN) se pone `ajustes.esencial = true`. Dentro de la sesión, el botón 🎯 de Hoy sigue sacándote del modo; al volver a abrir, arranca otra vez en él. Se apaga en Ajustes (junto al interruptor del modo esencial). Datos versión 26.

## v46 — Modo esencial
- **🎯 Modo esencial** (`ajustes.esencial`): un botón «🎯 Esencial» en la pantalla Hoy (junto al selector Ayer/Hoy) y un interruptor en Ajustes. Encendido, **Hoy** muestra solo lo importante: tus misiones del día con «+ Nueva misión» y «Ordenar», las tareas, las **misiones principales** (que antes estaban solo en Aventuras) y el diario. Se esconden el héroe, «Tu día» (Aurelio, cofre, relámpago, pacto, desafío), los avisos, la tarjeta de la semana y el foco semanal; el aviso de la copia de seguridad se queda.
- **Pestañas:** quedan **Hoy, Progreso y Tienda**. Aventuras (campaña, Torre, Voces, Arcade, mapa) y Héroe se esconden, pero siguen guardados; la partida no cambia al encenderlo ni al apagarlo. Si lo enciendes estando en otra pantalla, te lleva a Hoy.
- El botón «⏱️ Enfoque» (el temporizador de concentración, otra cosa) solo aparece en el modo esencial si hay una sesión en marcha.
- Interno: `seccionPrincipales(estado)` sale de `pantallaAventuras` y se usa también en Hoy. Datos versión 25. 220 pruebas.

## v45 — Más voces para el valle
- **Las cinco voces completas, con dos personas cada una** (`js/voces-valle-2.js`, nuevo; `voces-datos.js` suma lo suyo con lo de la v44): 🟥 **Orgullo** — Maren (pedir ayuda) y el capitán **Edmundo** (dar el primer paso con su hermano, tras veinte años); 🟦 **Qué dirán** — Tobías (decir que no) y **Wren** (elegir su camino frente a su familia); 🟪 **Envidia** — Ilse (entre hermanas) y el carpintero **Gaspar** (reconocer a un aprendiz que lo supera); 🟨 **Miedo** — el bardo **Cassiel** (hablar en público) y la panadera **Marta** (reclamar lo suyo sin pelear); 🟩 **Ego** — **don Anselmo**, el notario que no escucha, y el boticario **Valerio** (admitir un error).
- **7 personas, 14 conversaciones y 6 lugares nuevos** (el muelle, el taller, la notaría, el teatro, la botica y el cruce del camino): en total 10 personas, 20 conversaciones. Mismo formato, mismas técnicas y Valor. Todas se pueden ganar sin técnicas (hay prueba que las juega con un héroe nuevo).
- **Un final para la aldea:** al recuperar la última voz (todas las conversaciones hechas, bien o regular) se cuenta el **epílogo «La aldea habla»** (con Aurelio), paga 40 💎 y 40 XP de Carisma una sola vez y se puede releer desde la aldea. Aparece en la saga («✅ La aldea habló») y en tu libro (el capítulo del día se llama «La aldea habla»; todos los días se cuenta con quién hablaste). El epílogo recuerda que la Llama sigue esperando el fuego de los memoriales (hay prueba de que no dice que arde).
- La aldea solo muestra los lugares donde hay alguien ese día. Datos versión 24 (`estado.voces.epilogo`). 219 pruebas.

## v44 — Las Voces del Valle (juego nuevo de Carisma)
- **Una aventura de diálogos con ramas**, en un mundo que cambia cada día. Al pie de la Torre hay una aldea a la que la **Sombra de la Voz** le quitó la voz (los cinco señores de la Campaña de la Voz: Ego, Qué dirán, Envidia, Miedo, Orgullo). Cada persona guarda algo que no puede decir; no se vence con una espada, sino ayudándola a decirlo. Se entra por Aventuras → «Las Voces del Valle» y también está en Héroe › Historia (la saga).
- **La aldea del día** (`voces.agendaDelDia`): tres lugares (🔨 la fragua, 🍺 la posada, ⛲ la plaza) y tres personas —**Maren** (el Orgullo), **Tobías** (el Qué dirán) e **Ilse** (la Envidia)— que están en su lugar solo ciertos días de la semana. Cada una tiene 2 conversaciones encadenadas (la segunda pide la primera y un día de por medio): 6 en total, de unas 8 a 12 réplicas, con 3 finales (se abrió una voz / un primer paso / la puerta sigue cerrada).
- **Cómo se juega:** eliges qué decir; cada opción sube o baja una «confianza» oculta y el final sale de ella. Hablar con alguien por primera vez cuesta 🎟️ 1 ficha (seguir una conversación a medias, no) y paga 8 💎 y 6 XP de Carisma con el mejor final (4 y 3 con el regular; si lo mejoras, paga la diferencia). Un mal final se puede reintentar al día siguiente.
- **Tu Carisma real da poder:** 5 técnicas (👂 Escuchar nivel 1, 💗 Empatía 2, 🪞 Verdad 3, 🛡️ Firmeza 4, 🎭 Humor 5) que desbloquean opciones según el nivel de tu atributo Carisma; y el **Valor** (💪, hasta 5) sube con las misiones y tareas de Carisma de los últimos 7 días y abre las respuestas más valientes. Con respuestas libres siempre se puede llegar al mejor final (hay una prueba): la técnica ayuda, no obliga.
- **Hacia la vida real:** cada lección termina con una nota de Aurelio y una tarea propuesta («Pide ayuda con algo pequeño hoy…») que se crea con un toque como tarea de Carisma para hoy.
- **Archivos nuevos:** `voces.js` (reglas), `voces-datos.js` (la aldea y las conversaciones: solo datos), `vistas-voces.js` (pantallas). Los personajes se dibujan con el sistema del avatar, como el Maestro. Datos versión 23 (`estado.voces`). 216 pruebas (7 nuevas, que recorren todos los caminos de cada conversación).

## v43 — Cinemáticas en la Torre
- **Cuatro momentos** (los anota `torre.js` en `partida.cine`: `cineAlLlegar` y `cineAlVencer`): 🏞️ **zona** (al entrar a una zona nueva: cartel con su nombre), ⚔️ **entrada** (al llegar al piso de un guardián, 3 tomas: la sala, su nombre y tu héroe frente a él), 💥 **derrota** (cae el guardián: se deshace, y tu héroe baja el arma) y 🔥 **final** (cae el último del lugar: el Apagador en la Torre, con 6 tomas, y el Rey Hueco en la Mazmorra, con 4). El final solo en la primera vuelta; después de dar la vuelta, los guardianes vuelven a tener entrada y derrota.
- **Cómo se hacen** (`js/cinematicas.js`, datos; `js/cine.js`, reproductor): son tomas de 2 a 4 s con la sala de fondo, los sprites en pixel art de las criaturas y de tu héroe, cámara (sube, se acerca, se desliza), destellos, temblor, viñeta, un cartel y una línea de texto que se escribe sola. Sin videos: funcionan sin internet y no pesan. Los sonidos son los de siempre más dos nuevos, `retumbo` y `campana`.
- **Siempre se pueden saltar:** botón «Saltar», o tocar la pantalla para pasar de toma. Se apagan en Ajustes → 🎬 Cinemáticas (`ajustes.cinematicas`). Con «reducir movimiento» del iPhone se quitan la cámara, el temblor y los destellos. Si empieza una página de historia, esa cuenta la llegada y la cinemática de zona se descarta.
- **Cuidado con la historia:** ninguna cinemática dice que la Llama ya arde (la saga la enciende al final del camino): en el final de la Torre «La Llama no prende». Hay una prueba con el mismo filtro de palabras que las leyendas.
- Datos versión 22 (`partida.cine`, `ajustes.cinematicas`). 209 pruebas (3 nuevas).

## v42 — Salas especiales en la Torre
- **Salas** (`SALAS`, `salaDelPiso`, `resolverSala` y `motivoSala` en `torre.js`): al entrar a un piso de la Torre cuyo número es 3 (mod 5) hay una sala al azar entre altar, mercader y cofre; al entrar a uno múltiplo de 5 (el del guardián), una fuente. La Mazmorra no tiene. La partida queda en fase `"sala"` (con `partida.sala`) hasta que eliges; la criatura del piso ya está esperando y la batalla sigue después.
- ⛲ **Fuente:** beber (+40 % de vida) o llenar un frasco (+1 poción). 🕯️ **Altar:** ofrecer sangre (−25 % de la vida actual, +4 ataque y +8 hechizo) o rezar (+35 de Voluntad). 🛒 **Mercader:** poción por +14 de vida máxima, −20 % de vida por 2 pociones, o un hechizo por +5 de ataque. 📦 **Cofre:** 70 % un don o una mejora (`darMejora`, sacada de `elegirMejora`), 30 % trampa (−15 % de la vida máxima). Todas dejan «seguir» sin hacer nada.
- Se paga con la partida (no con gemas) y nada te mata: `pierde()` siempre deja al menos 1 de vida. Las opciones imposibles (sin pociones, sin hechizos, muy herido) se apagan con su motivo.
- El azar de las salas sale de la semilla de la partida y del piso, no gasta el azar de las batallas.
- Pantalla: ventana de sala con sus opciones (`torre-sala`) y «Huir y cobrar lo ganado»; `acciones.salaTorre`. 206 pruebas (5 nuevas; 2 viejas ajustadas para pasar la sala).

## v41 — Marcas y dones en la Torre
- **Marcas de partida** (`MARCAS` y `marcasDelDia` en `torre.js`): al empezar una subida o un descenso se puede elegir una de las 3 marcas del día (según la fecha y el lugar), o ninguna. 💎 Cristal (−25 % de vida), 🚫 Sin frascos (sin pociones), 🐗 Criaturas salvajes (+25 % de ataque), 🪨 Pieles duras (+30 % de vida), 🤐 Magia muda (sin hechizos) y 🍂 Ayuno (sin cura al subir de piso; solo en la Torre). El premio final se multiplica entre ×1,2 y ×1,3 (después del tope de gemas/XP). `empezarTorre(estado, semilla, lugar, marca)` solo acepta las del día.
- **Dones** (6 mejoras raras en `MEJORAS`, con `don: true`): 🩸 Sed de sangre, 🔔 Eco arcano, 🌵 Piel de espinas, 🏹 Ojo de cazador, 🔥 Fervor y 🎒 Botín de guerra. Desde el piso 3 puede salir uno (50 %) entre las opciones de mejora, nunca repetido; se guardan en `heroe.dones`.
- **Pantalla:** selector de marcas en las tarjetas de la Torre y la Mazmorra; la marca se ve en la cabecera de la batalla y en el resumen final; los dones se marcan «✦ Don raro» al elegirlos.
- Los datos no cambian de versión (la marca y los dones viven dentro de la partida de la Torre; las partidas viejas siguen sin marca). 201 pruebas (6 nuevas).

## v40 — Reto del día en el arcade
- **Reto del día** (`js/retos.js`, nuevo): cada día toca uno de 6 retos (puntos en Carrera / Lluvia / Golpe preciso, pisos de la Torre, sótanos de la Mazmorra si ya está abierta, o «juega N partidas»). Sin repetir el de ayer. La meta es el 70–90 % de tu récord (50–70 % en pisos), redondeada y nunca menor que una base, y se fija al crear el reto: superar tu récord ese día no la mueve.
- **Premio:** 6 💎 y 4 XP (del atributo del juego) una sola vez al día, al cumplirlo. Sale en la pantalla de resultado de la partida o de la Torre.
- **Pantalla:** tarjeta «🎯 Reto del día» arriba del Arcade con barra de progreso.
- Datos versión 21 (`estado.arcade.retos`, un reto por fecha; se guardan 30 días). 195 pruebas (5 nuevas; `partidaNueva()` deja un reto neutro para que las demás pruebas no dependan de la fecha).

## v39 — Revisión semanal
- **Revisión de la semana** (`guardarRevision` en `acciones.js`, `contenidoRevision` en `vistas.js`): botón «📝 Hacer mi revisión» en la tarjeta «Tu semana». Se escribe qué salió bien y qué mejorar (hasta 500 letras cada uno) y se eligen hasta 3 misiones de foco. Se guarda en `estado.revisiones` por el lunes de la semana revisada, y guardar también cierra la tarjeta.
- **Pista de fallas** (`pistaDeFallas` en `resumen.js`): dice cuántas misiones fallaste esa semana, cuál más y el motivo más repetido.
- **⭐ Foco de la semana** (`focoDeLaSemana`): tarjeta arriba de Hoy con las misiones de foco que siguen activas, marcadas con ✅ cuando ya las hiciste hoy.
- Datos versión 20 (`revisiones: {}`; las partidas viejas la reciben vacía). 190 pruebas (2 nuevas).

## v38 — La Torre despierta
- **La historia lo explica** («La Torre despierta», `leyendas.js`): una torre que nadie sube se duerme; desde que tu héroe volvió a subirla, despertó. La tormenta escondía la mitad: sobre la cima siguen los **Puentes de nubes** y la **Corona de la Llama**. Las Sombras lo notaron y les enseñaron trucos a sus criaturas, y Aurelio te enseñó las técnicas de los Vigías y la Voluntad. Se cuenta en el prólogo a quien empieza y una vez aparte a quien ya había subido, y se puede releer en «📜 Historia».
- **30 pisos** (antes 20) y **10 criaturas nuevas**: Arpía de los vientos, Nubarrón, Esfinge alada, Espíritu del viento y el Coloso de las nubes (guardián del 25); Vigía caído, Llama negra, Espejo de la Corona, Ojo de la Corona y el **Apagador** (guardián del 30, el que apagó la Llama hace cien años). Dos dibujos nuevos (la Arpía y el Apagador) y dos salas nuevas. Sobre la tormenta las criaturas tienen 10 % más de vida y de ataque.
- **Trucos de las criaturas**: 💠 barrera (absorbe tus golpes hasta romperse), 🌀 carga (al turno siguiente suelta un golpe de 2,6 veces su ataque), 🪞 espejo (tu próximo hechizo rebota y te quita la mitad), ♻️ regeneración y, el Apagador, un cambio de forma a media vida que cambia su punto débil. Los guardianes de siempre (Caballero, Archivista, Señor de la Fragua, Dragón) y algunas criaturas también aprendieron uno.
- **Técnicas de los Vigías**, una por atributo real (desde su nivel 3, una vez por piso): 🔨 Quebrar (Fuerza: golpe ×1,3 que rompe barreras y corazas), 🔍 Analizar (Intelecto: descubre su punto débil, lo anota en el bestiario y te devuelve 1 PM), 😤 Intimidar (Carisma: pierde su próxima acción, también un golpe cargado) y 🎯 Golpe certero (Riqueza: crítico seguro).
- **Voluntad**: una barra que se llena al golpear (+6), al defenderte (+5) y al aguantar golpes (+10); tu racha de días la empieza (+3 por día, hasta 30). Llena, el **Golpe de Voluntad** pega 2,5 veces tu mejor ataque y rompe barrera, coraza, espejo y carga. Dos mejoras nuevas: «Llama interior» (+35 de Voluntad) y «Maestría» (cada técnica, una vez más por piso).
- **Balance** (simulado): los pisos 1–20 y la Mazmorra quedan casi como antes; llegar a la Corona es contenido de largo plazo (con equipo medio, el 22 % lo logra con atributos en nivel 18 y el 85 % con nivel 22). El premio de la Torre sube a 60 💎 y 45 XP (se alcanza en el piso 20). La saga pide ahora la Corona (piso 30); la Mazmorra y la Coraza del Vigía siguen en el piso 20 («despejar la tormenta»). Datos versión 19.

## v37 — La Torre, en el valle
- **La Torre de los Vigías está en el Valle del Comienzo**, al principio del camino, donde Aurelio vive a su pie. Antes, el mapa y la Crónica la ponían al final, en la Ciudadela, y no cuadraba que se pudiera subir en el Arcade desde el primer día (ni con el pergamino, que cuenta que Lía la levantó en su valle, ni con las memorias de Aurelio).
- **El mapa:** en el valle, la Torre se dibuja junto al punto de partida y sus 6 ventanas se encienden con los pisos que subes (tocarla abre el Arcade); en lo alto arde la Llama cuando terminas la saga. En las demás regiones se ve a lo lejos, más chica cuanto más te alejas, y otra vez más cerca en la Ciudadela, porque el camino da la vuelta hacia el valle.
- **La Ciudadela** termina ahora en el **brasero de los Vigías**, donde se junta el fuego de los cuatro memoriales (mismo premio que antes). El final de la saga es volver al valle con ese fuego y encender la Llama: el camino termina donde empezó.
- Textos ajustados en la Crónica (prólogo, el valle, el mar y la Ciudadela), la historia de la Torre, el pergamino, la primera memoria de Aurelio y la saga.

## v36 — La Llama, al final del camino
- **El arcade ya no termina la saga.** Antes, superar el piso 20 de la Torre encendía la Llama (el objetivo de la saga) aunque el reino siguiera en manos de las Sombras. Ahora la Llama solo prende con el fuego de los cuatro memoriales de la Ciudadela, que arden cuando vences a los 20 señores (tus jefes): el final de la saga se gana con la vida real, al final del camino del reino.
- **Nuevo orden de los actos:** La primera piedra, El juramento, El huevo de Aurelio, El reino dividido, **La cima de la Torre** (piso 20: liberas al último Vigía y se abre la Mazmorra), **El Rey Hueco** (sótano 20) y, al final, **La Llama de los Vigías** (los 20 señores).
- Los actos que ya cumpliste antes de tiempo (por ejemplo, la Torre subida antes de liberar el valle) se marcan «Ya lo lograste» y cuentan cuando llegas a ellos.
- **Historias ajustadas:** en la cima, la antorcha no prende («Solo arde con el fuego de las Sombras vencidas»); la historia de la Torre se llama ahora «La Torre de los Vigías»; Aurelio y la Mazmorra mandan de vuelta al reino; la Crónica dice que el fuego de los memoriales es el que falta en la cima. La Coraza del Vigía se gana «al llegar a la cima» (igual que antes: 20 pisos).

## v35 — La Saga de la Llama
- **Una sola historia con un objetivo** (`js/saga.js`): el pergamino de Lía, las memorias de Aurelio, la Crónica del reino, la Torre, la Mazmorra y tu libro son partes de la misma saga. El objetivo: convertirte en Vigía, liberar el reino de las Cuatro Sombras, volver a encender la Llama de la Torre y vencer al Rey Hueco.
- **Siete actos que se cumplen en orden** (se calculan con lo que ya hiciste, no se guardan): La primera piedra (1 misión), El juramento (firmar el pacto), El huevo de Aurelio (10 misiones: el dragón se abre), El reino dividido (el primer jefe de cada atributo), La Llama de los Vigías (piso 20 de la Torre), Las Cuatro Sombras (los 20 jefes) y El Rey Hueco (sótano 20 de la Mazmorra). Después eres «Vigía de la Llama».
- **Tu objetivo, siempre a la vista:** en Hoy, «Tu día» muestra el acto de ahora con su progreso. Cada acto cumplido se celebra con unas palabras de Aurelio y el objetivo siguiente, y «¿Cómo voy?» te lo recuerda.
- **Héroe › Historia** muestra la saga completa, con el acto de ahora y un botón para leer su historia, y las historias ordenadas en el tiempo (hace siglos, hace cien años, ahora…).
- **Las historias ya no se contradicen:** las Sombras volvieron cuando se apagó la Llama; Aurelio fue el aprendiz del último Vigía y espera al pie de la Torre (sube a la cima recién al final, después de la Mazmorra); Casio le dio el pergamino de Lía, y la dedicatoria del pergamino lo cuenta; la Torre nombra a Lía; y tu dragón nació del último huevo de los dragones de la Torre.

## v34 — Armadura de pecho y equipo nuevo
- **Espacio nuevo: el pecho** (`avatar.ESPACIOS.pecho`), que va encima de la ropa de tu etapa (`dibujo-objetos.armaduraDePecho`): Peto de cuero (común, 🛡️ +5, 80 💎), Cota de malla (raro, 🛡️ +9, 160), Túnica arcana (raro, 🛡️ +3 🔮 +5, 170), Coraza de acero (épico, 🛡️ +16, 420, «Muralla») y Coraza del Vigía (legendario, 🛡️ +20 ⚔️ +2 🔮 +2, «Llama del Vigía»; se gana encendiendo la Llama: 20 pisos de la Torre).
- **Más objetos en cada espacio:** Diadema de plata (raro) y Yelmo astado (épico, «Rugido») en la cabeza; Daga del ladrón (raro) y Martillo de guerra (épico, «Aturdir») en la mano; Escudo redondo (raro) y Capa de plumas de cuervo (épico, «Presagio») en la espalda; y dos fondos con pinturas de dominio público: Mar embravecido («La novena ola», Aivazovski, 1850) y Aurora boreal (Church, 1865, épico, «Aurora»).
- **Seis habilidades nuevas** en la Torre y la Mazmorra: Muralla (defender bloquea 15 % más), Rugido (cada criatura empieza con 15 % menos de vida), Aturdir (el primer crítico de cada piso le quita su turno), Presagio (los golpes fuertes te hacen 35 % menos), Aurora (el primer hechizo de cada piso es gratis) y Llama del Vigía (fuego 50 % más fuerte e inmunidad al veneno).
- Héroe › Equipo muestra los 5 espacios. Datos versión 18 (las copias viejas reciben el pecho vacío).

## v33 — La primera piedra
- **Pergamino motivacional** (`js/pergamino.js`): «La primera piedra», la historia de Lía, la hija del cantero, que levantó la Torre poniendo una piedra cada día para ver más allá de la niebla del valle. Prólogo, 10 capítulos (los días sin ganas, las opiniones de los demás, el día que no subió, la Sombra de la mañana, la tormenta, los que llegaron…), las diez «enseñanzas de la primera piedra» y una dedicatoria con el nombre de tu héroe. Unas 1.860 palabras.
- Se lee en una pantalla nueva con forma de rollo (varas de madera arriba y abajo) que se desenrolla al abrirla. Está en Héroe › Historia, y el Maestro Aurelio lo ofrece cuando le dices que no tienes ganas o que estás abrumado.

## v32 — El equipo, con gemas
- El equipo del avatar (Tienda › Equipo) se compra con gemas 💎, con los mismos precios. Las monedas 🪙 quedan para los premios reales y las pociones de vida. El descuento del «Mercader ambulante» sigue valiendo para el equipo.

## v31 — Monedas y gemas
- **Economía más justa:** las monedas 🪙 (las de tus premios reales) salen solo de la vida real: misiones, tareas, enfoque, misiones principales, el diario, cerrar el día y tus logros. Antes el arcade podía pagar más que las propias misiones (1 ficha por misión y hasta 15 🪙 por minijuego, 40 por la Torre y 80 por la Mazmorra).
- **Gemas 💎**, la moneda del juego (`personaje.gemas`): se ganan en el arcade (minijuegos hasta 15, Torre 3 por piso hasta 40, Mazmorra 5 por sótano hasta 80) y con los premios extra, que antes daban monedas: jefes (50×N), cofre del día (15–40), desafío semanal (50), desafío relámpago (40) y mapa (20–100). Se gastan en las mascotas (adoptarlas y su comida) y en el **bazar del arcade**.
- **Bazar** (`torre.PROVISIONES`): provisiones para la próxima subida o bajada, una de cada una, que se gastan al empezar: Poción de reserva (+1 poción, 25 💎), Piedra de afilar (+4 de ataque, 40), Pergamino arcano (+1 hechizo por piso, 45), Raíz amarga (inmune al veneno, 50) y Amuleto de vigor (+15 % de vida máxima, 60). Las fichas no se venden: siguen saliendo de tus misiones.
- **La mitad de XP en el arcade:** minijuegos hasta 10 (antes 20), Torre 2,5 por piso hasta 30 (antes 5 y 60), Mazmorra 4 por sótano hasta 60 (antes 8 y 120).
- La cabecera muestra monedas y gemas. Las monedas que ya tenías no cambian; las gemas empiezan en 0. Datos versión 17.

## v30 — El Maestro Aurelio
- **Memorias de Aurelio** (`js/memorias.js`): la historia de tu maestro en 8 capítulos que se abren en orden a medida que avanzas (siempre, mejor racha de 7, primer jefe, nivel 10, piso 10 de la Torre, 5 jefes, piso 20 de la Torre y sótano 20 de la Mazmorra). Fue aprendiz de Casio, el último Vigía, que subió a salvar la Llama y nunca volvió (es el Centinela celeste de la Torre); por miedo se quedó cien años al pie de la Torre, como el Rey Hueco se quedó abajo. Cada capítulo termina con una lección. Se leen en Héroe › Historia, en un pergamino como la Crónica; los cerrados dicen qué falta.
- **Aurelio en todo el juego:** en Hoy avisa cuando tiene algo nuevo que contarte («📜 Escuchar»); en la conversación hay «Háblame de ti»; en la Torre y la Mazmorra da una pista antes de cada guardián (sobre su punto débil) y unas palabras cuando caes; comenta al subir de nivel y al vencer a un jefe; responde a tu diario según tu ánimo y te despide en el ritual de la noche.
- Datos versión 16 (`estado.maestro.leidas`).

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
