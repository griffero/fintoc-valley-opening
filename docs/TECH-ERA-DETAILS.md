# Waymo, NVIDIA y cronología visual · v10

La escena recupera la arquitectura y el nivel de detalle de las versiones anteriores. Se elimina la planta de fusión completa. NVIDIA usa el mismo edificio de oficinas claro, ventanas por piso y techo plano que sus vecinos: 23 unidades de ancho y 16 de alto, con un letrero normal en el techo. Yahoo conserva su nueva ubicación en el edificio este. Fintoc tiene una sola placa negra sobre la sede: las letras blancas cambian de la identidad antigua a la actual.

## Orden del relato

Los tiempos están centralizados en `lib/story-timing.ts`:

| Tiempo | Acción |
| --- | --- |
| 0–1,15 s | Ciudad tecnológica previa |
| 1,15–3,4 s | Aparecen los NFT; las piezas caen como dominós, WEB3 se desploma y se desparraman las fichas |
| 2,9–4,03 s | Twitter se pliega y aparece SpaceX; el cohete despega desde 4,47 s |
| 4,5–5,2 s | Aparecen OpenAI y Anthropic; luego sus equipos de cómputo |
| 5,15–7,60 s | Logo antiguo de Fintoc, desarme y ensamblado de la identidad actual en la misma sede |
| 5,35–5,75 s | Se instala el letrero de NVIDIA sobre un edificio convencional |
| 6–6,91 s | Entran progresivamente ocho Waymos al tráfico |
| 7,3–7,54 s | Aparecen las tres langostas de OpenClaw |

Es una lectura por épocas y acontecimientos, no una cronología de fundación de empresas. Twitter → SpaceX sigue siendo una transición creativa. La progresión Fintoc y la construcción del título mantienen el hilo principal y transcurren en paralelo.


## Assets y edición

Los Waymos conservan sensores, domo de techo y símbolos oficiales en las puertas, con rutas a 21–25 unidades por segundo, acordes al timelapse. Referencias: [fotos oficiales](https://waymo.com/media-resources/) y [descripción del sistema de sensores](https://waymo.com/blog/2020/03/designing-5th-generation-waymo-driver/). Source: Waymo. Las piezas NFT son pixel art propio y una metáfora del desplome especulativo, sin cifras ni proyectos concretos.

Los [vectores de NVIDIA](https://www.nvidia.com/en-gb/about-nvidia/legal-info/logo-brand-usage/) se extruyen en geometría. Los SVG integrados, fuentes exactas y hashes están en `public/assets/tech-era-logo-sources.json`. `lib/tech-era.ts` contiene identidades, coleccionables y robotaxis; `lib/ai-era.ts`, el resto de los acontecimientos. `lib/story-timing.ts` permite ajustar su orden sin cambiar la velocidad de la cámara ni de los autos.

Los identificadores internos `yahoo` y `office` se mantienen para cargar proyectos anteriores: corresponden a NVIDIA y Yahoo, respectivamente. Los valores predeterminados del megacampus anterior migran a las dimensiones y color de oficinas normales; los valores personalizados se respetan.

## Verificación

El renderizador comprueba saltos temporales deterministas, restauración tras editar títulos y exportar, diez familias de texturas PBR, animación de los actores nuevos y ausencia de geometría de fusión/megacampus y del estudio retirado. También se verifica la migración de configuraciones sin perder ediciones personales.
