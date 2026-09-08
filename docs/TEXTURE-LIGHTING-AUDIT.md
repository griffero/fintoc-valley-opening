# Auditoría final de texturas e iluminación · v4

La revisión de fotogramas al inicio, durante la transformación y en el plano final mostró que el siguiente salto de calidad estaba en la respuesta de las superficies. La composición, los edificios protagonistas, la cámara y la coreografía se mantienen.

## Diez mejoras de texturas implementadas

| # | Problema observado | Cambio aplicado |
| --- | --- | --- |
| 1 | Hormigón de color uniforme, parecido a plástico pintado. | Variación tonal en dos escalas, poro tenue y rugosidad irregular en fachadas y elementos de hormigón. |
| 2 | Grandes techos vacíos y sin acabado propio. | Membrana mate, juntas y pequeñas diferencias entre paños en cubiertas de oficinas, campus y sede Fintoc. |
| 3 | Ventanas con una respuesta demasiado uniforme. | Variación por paños, indicios discretos de persianas y rugosidad propia; reflejos del cielo controlados por material. |
| 4 | Metal poco distinguible de las superficies minerales. | Rugosidad direccional de acabado cepillado, respuesta metálica y reflejos específicos en estructuras y equipos. |
| 5 | Calles y estacionamientos como planos de color. | Agregado fino, variación amplia de paños y rugosidad de asfalto; también en vías internas y autopista. |
| 6 | Veredas y plazas sin escala de superficie. | Losas alternadas, juntas discretas y pequeñas diferencias de tono en ambas direcciones de calles, bases y plazas. |
| 7 | Césped homogéneo en grandes superficies. | Manchas suaves de dos escalas, detalle fino filtrado y acabado mate, también en jardines de campus. |
| 8 | Copas de árboles con aspecto de sólidos pintados. | Variación interna de color, normal suave y acabado sin brillo; se conserva la variación existente entre árboles. |
| 9 | Madera similar a hormigón marrón. | Veta longitudinal tenue y rugosidad diferenciada en el café think, la terraza triangular y las pérgolas. |
| 10 | Paneles solares como rectángulos azules. | Celdas, contactos finos, pequeñas variaciones entre celdas y vidrio de brillo controlado. |

Los logos y las cubiertas rojas del título mantienen sus materiales limpios. Las texturas son generadas por código con una semilla fija; no contienen fotografías ni sombras pintadas.

## Cuatro mejoras de iluminación implementadas

| # | Problema observado | Cambio aplicado |
| --- | --- | --- |
| 1 | Las sombras perdían contacto en detalles pequeños. | Ajuste del sesgo normal de 0,15 a 0,11 y del radio PCF de 4 a 3,2, conservando el mapa de 4096 y su cobertura. |
| 2 | La oclusión oscurecía zonas demasiado amplias. | GTAO más localizado: radio de 3,2 a 1,7, grosor de 1,6 a 0,65 y filtrado de 5 a 3; intensidad efectiva al 80 % del valor editable. |
| 3 | Cielo poco estructurado y rebote demasiado beige. | Entorno con más contraste entre cielo y nubes, rebote inferior neutro y reflejos explícitos por material. Sol final más neutro, relleno direccional de 0,18 a 0,26 y hemisferio al 125 % del valor editable para conservar detalle en sombra. |
| 4 | Un velo fijo y un levantamiento sepia teñían toda la imagen. | Sustitución por una única atmósfera suave calculada con la profundidad de la cámara. Se elimina la niebla duplicada del escenario y se conserva más contraste en primer plano. |

No cambian el recorrido solar, su periodo, las fases del timelapse ni la exposición configurada.

## Edición y exportación

- `lib/surface-textures.ts` genera los mapas de color, normales y metal/rugosidad de las diez familias. Los mapas de color usan sRGB; normales y metal/rugosidad son datos lineales.
- Las UV se preparan con dimensiones físicas antes de combinar geometría. Las texturas no se estiran de forma distinta en cada edificio ni dependen de un shader exclusivo del navegador. Cambiar después el tamaño de un objeto en el editor escala también su textura, como parte del objeto.
- Los mapas son compartidos por familia, con mipmaps y filtrado anisotrópico hasta 8×. El mapa de metal/rugosidad empaquetado evita duplicar imágenes por color al exportar.
- Los materiales, sus mapas y las UV se conservan en el GLB. Los controles de paleta y la configuración guardada siguen funcionando con el formato existente.
- Como en versiones anteriores, el entorno PMREM, las sombras PCF, el postproceso y la música pertenecen al render web; deben configurarse en otro motor al abrir el GLB.

La comprobación de exportación exige las diez familias texturadas y verifica reproducción determinista al avanzar/retroceder, restauración de títulos y restauración de la escena tras generar el GLB. La revisión visual usa fotogramas de ocho momentos de la animación, además del render final en 4K.

Referencias: [material visual de yU+co](https://www.yuco.com/works/silicon-valley), [materiales PBR de Three.js](https://threejs.org/docs/pages/MeshStandardMaterial.html) y [CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html).
