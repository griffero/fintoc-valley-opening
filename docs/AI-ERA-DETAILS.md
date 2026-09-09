# Detalles de la era de IA · v11

Detalles de IA en geometría editable, con la secuencia de épocas definida en `lib/story-timing.ts`:

- **Twitter → SpaceX:** el letrero circular se pliega entre 2,9 y 3,7 s; el cartel oficial de SpaceX aparece entre 3,39 y 4,03 s. Un cohete emerge sobre una plataforma de techo y despega desde 4,47 s, con aceleración, llama y humo en geometría. Es una transición creativa entre marcas, no una afirmación de que Twitter se haya rebautizado SpaceX.
- **OpenAI y Anthropic:** logos oficiales extruidos e integrados en las fachadas de dos edificios existentes; OpenAI también tiene su nudo en relieve sobre la cubierta. OpenAI ocupa el campus oeste, y Anthropic el edificio que antes tenía el cartel de Hooli para que el nombre sea legible dentro del encuadre final. Sus letreros aparecen desde 4,5 y 4,8 segundos; sus equipos de cómputo aparecen después. Se conservan los identificadores de los objetos para abrir proyectos anteriores.
- **OpenClaw:** tres langostas pequeñas que aparecen desde 7,3 segundos junto a la piscina de la terraza de OpenAI, con cola segmentada, patas, antenas y pinzas animadas; una placa identifica el detalle. Son modelos propios en geometría, inspirados en la identidad de [OpenClaw](https://openclaw.ai/) y su [símbolo oficial](https://openclaw.ai/favicon.svg).

## Edición

`lib/ai-era.ts` contiene estas piezas y sus tiempos. Las transformaciones se registran en el mismo sistema que el resto de la ciudad; el cohete, humo, letreros, equipos y langostas se incluyen en la animación del GLB. Los logos se extruyen de SVG oficiales cuya procedencia y hashes están en `public/assets/ai-era-logo-sources.json`.

La comparación v11 refina los materiales y la respuesta de luz; se documenta en `docs/REFERENCE-FINISH-AUDIT.md`. El exportador MP4 desactiva la observación de archivos durante el render para que cambios en otros directorios no recarguen una animación que está siendo exportada.
