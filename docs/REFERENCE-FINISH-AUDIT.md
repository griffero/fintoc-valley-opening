# Nueva comparación con el original · v11

Se compararon fotogramas del video original de yU+co alrededor de 2,5, 5 y 10 segundos con v10 y la nueva versión. También se revisaron las vistas de conjunto, YouTube/Google, fachadas Oracle/Alibaba y el título aislado de la [galería oficial de yU+co](https://www.yuco.com/works/silicon-valley). Esta auditoría se centra en la lectura de materiales y luz, no en igualar cada edificio o píxel.

## Diez detalles y cambios aplicados

| # | Diferencia respecto de la referencia | Mejora aplicada |
| --- | --- | --- |
| 1 | Vidrios demasiado azules, claros y uniformes. | Paños más oscuros, mayor variación entre ventanas y persianas discretas en una minoría. |
| 2 | Las caras contiguas reflejaban casi lo mismo. | Horizonte de reflexión asimétrico, vidrio algo menos rugoso y reflejos más definidos. |
| 3 | Las copas parecían espuma lisa. | Sombreado por caras que recupera el acabado poligonal de la miniatura. |
| 4 | El rebote dejaba las superficies minerales gris verdosas. | Rebote inferior más cálido, conservando el relleno frío del cielo. |
| 5 | Los techos tenían un acabado excesivamente impecable. | Grano fino y mayor variación entre láminas, con juntas contenidas. |
| 6 | El estuco apenas se distinguía de pintura uniforme. | Variación tonal de dos escalas y relieve de poros un poco más legible. |
| 7 | Veredas y plazas perdían el detalle de losas. | Variación por losa y juntas algo más contrastadas. |
| 8 | El asfalto resultaba demasiado uniforme. | Franjas amplias y suaves de desgaste, con rugosidad variable. |
| 9 | El rojo del título respondía como pintura completamente mate. | Reflejos suaves de luz sobre los techos rojos. |
| 10 | El timelapse cambiaba dirección, pero poco la respuesta luminosa de los materiales. | Variación solar de ±6%, con ambiente en oposición suave de ±2%. |

La cámara, los tiempos del relato, la exposición y el control de neblina con valor predeterminado 0,18 se conservan. La niebla sigue usando profundidad real y deja nítido el primer plano.

## Marcas integradas en la arquitectura

Se modifican **4 de los 13 conjuntos arquitectónicos con marca (31%)**. Myspace/Facebook cuenta como un mismo edificio. El recuento excluye el café, vehículos, NFT y las langostas, que son detalles secundarios.

- **NVIDIA:** palabra sobre la fachada superior y ojo verde en relieve horizontal sobre la cubierta; se elimina el tablero elevado y sus soportes.
- **OpenAI:** palabra en el frente del último volumen retranqueado y nudo en relieve sobre su cubierta.
- **Anthropic:** letras corpóreas y símbolo terracota en la cornisa, sin cartel independiente.
- **Myspace → Facebook:** el cambio de identidad ocurre en una franja de la fachada superior; la fiesta queda visible en la terraza.

Se conservan HP, Google y YouTube, además de la placa única de Fintoc con letras blancas sobre negro y su transición antigua → nueva. Sora y fusión siguen ausentes.

## Parámetros y edición

- `lib/surface-textures.ts`: albedo de vidrio 0,76–1,00; persiana 0,085; amplitud de estuco 0,065/0,03; láminas de cubierta 0,065 y grano 0,035; losas 0,08 y juntas 0,14; desgaste de asfalto con amplitud inferior a ±3%.
- `lib/outdoor-materials.ts`: rugosidad base del vidrio 0,32 e intensidad propia de entorno 0,60; normales de estuco 0,55; `flatShading` únicamente en follaje; horizonte direccional.
- `lib/editable-valley.ts`: tintes de vidrio de oficinas/título más oscuros; rebote #988b79; rugosidad del techo rojo 0,43 y metalicidad 0,02.
- `lib/solar-motion.ts`: amplitud de energía solar y ambiente, con fase y envolvente originales conservadas.
- `lib/ai-era.ts`, `lib/tech-era.ts` y `lib/city-life.ts`: montajes arquitectónicos, con transformaciones animadas exportables.

## Comprobación y límites

La exportación comprueba diez familias PBR, los cinco grupos de identidad integrados (dos pertenecen al cambio Myspace/Facebook), la identidad única de Fintoc, ausencia de Sora/fusión, reproducción determinista y restauración tras editar y exportar GLB. Los materiales y las nuevas marcas siguen siendo geometría editable. El GLB incorpora normales por cara en el follaje para conservar su acabado poligonal fuera del navegador; la verificación comprueba las normales de cada triángulo.

La revisión visual cubre comienzo, transformación y cierre; no se presenta una puntuación de similitud. Las reflexiones procedurales, sombras PCF y oclusión de pantalla siguen siendo aproximaciones en tiempo real al render del original. El entorno, la niebla y el postproceso deben configurarse en el motor destino al importar GLB.
