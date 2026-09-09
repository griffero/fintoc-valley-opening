# Luz cinematográfica y neblina · v8

La iluminación se suaviza manteniendo la composición, geometría, cronología y movimiento solar de v7. La atmósfera es un único pase de profundidad antes del tone mapping, sin desenfocar logos ni texturas.

| Ajuste | Resultado |
| --- | --- |
| Sol al 95 % de la intensidad configurada y color final #fff0df | Luz ligeramente cálida y techos menos duros |
| Relleno de cielo 0,26 → 0,34; color #b5c9e2 | Más detalle en las caras en sombra y una separación suave entre sol y cielo |
| Hemisferio al 135 % del control ambiental; rebote #858d89 | Menos sombras negras sin un tinte sepia |
| Radio PCF 3,2 → 3,8; multiplicador GTAO 0,8 → 0,72 | Bordes de sombra más suaves, conservando el contacto con el suelo |
| Neblina según profundidad | Primer plano nítido, título con atmósfera leve y fondo algo más claro y frío |

La neblina usa `smoothstep(200, 365, distancia)` y una densidad máxima de `0,34 × haze`. El valor predeterminado de `haze` es 0,18: aproximadamente 1,8 % de mezcla a 260 unidades de cámara y 5,4 % a 330 unidades. Se mezcla en luz lineal con #dbe4e8. La variación solar modifica esa densidad como máximo un 12 % durante el timelapse y queda estable en el plano final.

## Ajustar y guardar

En **Iluminación → Neblina**, 0 elimina la atmósfera y 1 la intensifica. El control se guarda en el proyecto JSON como `lighting.haze`. Los proyectos anteriores reciben el valor suave 0,18 al abrirse; los demás ajustes de iluminación se conservan.

Se corrige también la conexión al buffer de profundidad: `ShaderPass` copia sus uniforms al crearse, por lo que la textura de profundidad activa se asigna después. Esto evita muestrear una copia que no recibió el render de la escena.

La implementación está en `lib/editable-valley.ts`; el color y la modulación del ciclo están en `lib/solar-motion.ts`. No se agrega una segunda niebla a la escena ni se altera la exposición configurada.

La luz direccional y sus animaciones se conservan en el GLB. Como el resto del postproceso, la neblina y las sombras dependen del renderizador: están en el editor web y el MP4, y deben configurarse en otro motor al importar el GLB.

## Verificación

Se comprueban carga de proyectos anteriores, rango del control, desactivación/restauración de la neblina, saltos temporales deterministas y restauración tras exportar GLB. La revisión visual compara fotogramas al inicio, en movimiento y en el plano final antes de generar el MP4 4K.
