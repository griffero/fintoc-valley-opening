# Auditoría visual: Silicon Valley × Fintoc

Fecha: 7 de septiembre de 2026. Objetivo: acercar la arquitectura, la respuesta de materiales y la sensación de tiempo acelerado, manteniendo una escena 3D editable.

## Referencias y método

- Opening de [yU+co para HBO](https://www.yuco.com/works/silicon-valley): video de 1920 × 1080, 261 cuadros a 24000/1001 fps. Se revisaron cuadros de inicio, transformación y cierre: 24, 60, 120, 180, 210 y 240.
- Tres imágenes aportadas por el usuario de Cerro El Plomo 5420: dos vistas aéreas del edificio real y un render arquitectónico. Las fotos guiaron la terraza y los volúmenes; el render ayudó a interpretar las aletas blancas.
- Comparación visual del render en navegador en el cierre, aproximadamente 2.5 s y 5.5 s; revisión de geometría, materiales y funciones temporales. La revisión paralela de especialistas se basó en el video y el código; la inspección del navegador la hizo el agente principal.
- No se usó una puntuación de similitud píxel a píxel: Fintoc sustituye edificios y cambia la composición. Las mediciones indicadas abajo son observaciones concretas, no una reconstrucción física de las luces originales.

## Hallazgos y correcciones

| Área | Diferencia encontrada | Cambio realizado |
| --- | --- | --- |
| Sede final | El bloque genérico no representaba la oficina real ni su terraza. | Torre de vidrio verde, volumen frontal más bajo, aletas blancas, terraza triangular retranqueada con fachada inferior diagonal, dos sombrillas, jardineras, bar y diez personas celebrando. Cubierta técnica con borde y recorrido redondeado. Un único letrero Fintoc sobre la cubierta. |
| Vidrios | Solo dos colores exactos recibían propiedades de vidrio; otros paños se comportaban como mampostería mate. | Materiales elegidos por función, tintes de paños distintos y reflejos amplios de cielo y horizonte. Se reemplazó el entorno interior de reflexión. |
| Techos del título | El rojo usaba un material que ignoraba el sol. Faltaba espesor legible en el borde. | Material iluminado, remate rojo con bisel fino y fascia oscura. Ajuste de reflectancia para conservar la saturación bajo ACES. |
| Fachadas y masa | Las letras y el vecindario repetían demasiado la misma caja y patrón de ventanas. | Letras algo más altas, fachadas con distintas proporciones de vidrio y montantes. Cinco variantes de edificios secundarios: patio en L, escalonado, torre sobre podio, estudio bajo y bloque de bandas. |
| Suelo y vegetación | La gran parcela del título seguía siendo césped al terminar la obra. Había un único perfil de árbol. | Césped → tierra de obra → pavimento; avenida curva siguiendo el borde del título. Copas redondas de distintas proporciones, coníferas y separación cromática entre follaje y césped. |
| Sombras y profundidad | Sombras muy recortadas y escasa separación atmosférica. El parámetro de radio no ampliaba la penumbra con el filtro anterior. | Filtro PCF con radio efectivo mayor, sesgo ajustado, reflejos exteriores y una neblina de distancia leve. Se conserva la oclusión de contacto editable. |
| Paso del tiempo | Grúas y excavadoras oscilaban con senos continuos, sin intención de tarea. | Maniobras breves separadas por pausas: izar, girar, colocar y volver; cavar, levantar y descargar. Fases y duraciones distintas por máquina. |
| Construcción | Estirar el edificio terminado deformaba ventanas y pisos. | Letras ensambladas por pisos rígidos con apariciones escalonadas y un asentamiento corto. La sede final emerge por traslación, conservando sus proporciones. |
| Tráfico | La velocidad ya estaba cerca; faltaba parte de la huella visual de exposición. | Se mantiene 14–24 unidades/s. Dos siluetas de posiciones anteriores aproximan una estela corta y dejan la arquitectura nítida. También se corrigió la orientación de los autos que viajan en sentido contrario sobre la autopista. |
| Cierre solar | El arco seguía cambiando demasiado durante la pausa final de cámara. | El cambio de luz se concentra en los primeros 7.63 s y el cierre mantiene dirección, color e intensidad. |

## Evidencia temporal

La medición previa del tráfico usó los cuadros 210–216, separados por 0.25025 s, durante la pausa de cámara. Rasgos de vehículos recorrieron aproximadamente 182, 199 y 277 píxeles/s; un vehículo en curva, 141 píxeles/s. Un techo estático dio desplazamiento nulo. Esto fundamenta el rango de velocidad actual; no implica haber recuperado cada ruta.

Entre los cuadros 183 y 252, la mediana RGB de un parche de techo claro de HP pasó de `[225, 202, 182]` a `[225, 203, 181]`; la de Yahoo pasó de `[225, 209, 203]` a `[226, 210, 202]`. El balance cromático tardío es casi constante. Esto justifica contener el cambio global de luz al cierre, pero por sí solo no demuestra que el sol original estuviera inmóvil.

## Límites y diferencias que permanecen

- El original tiene más arquitectura específica por empresa y menos repetición en la trama urbana. Las variantes nuevas mejoran la silueta del barrio, pero no reconstruyen cada inmueble.
- Su iluminación incluye rebotes y reflejos más complejos. Cielo procedural, luz de relleno y oclusión de pantalla son aproximaciones de tiempo real, no iluminación global calculada fuera de línea.
- Las estelas de autos son una aproximación geométrica económica. El original tiene desenfoque de obturador más rico en vehículos, personas y rotores.
- Las operaciones se coordinan por ciclos de tareas, pero no reproducen cada demolición, ruta de peatón ni maniobra del video. Algunos actores secundarios conservan movimientos más simples.
- La sede reproduce los rasgos reconocibles de las imágenes; sus dimensiones se adaptan a la parcela y al encuadre. No es un modelo de levantamiento arquitectónico.
- La cámara conserva la trayectoria medida y aprobada anteriormente. El ritmo de la música y el reproductor se mantienen.

## Edición y entrega

La escena sigue siendo geometría Three.js: no se colocó el video original como fondo. Los controles de edificios, colores, luz, cámara, texto, guardado de proyecto y exportación GLB siguen disponibles. Los pisos se exportan con aparición STEP y tiempos de evento exactos; los gestos del rooftop y la maquinaria tienen pistas de transformación. La exportación usa una raíz común para que también encuentre la animación del sol.

Los cambios de color del suelo y del sol, la neblina, la oclusión, el entorno de reflexión, el sonido y el tráfico procedural pertenecen al proyecto web. El GLB conserva geometría, materiales y las animaciones de transformación documentadas en `EDITING.md`.
