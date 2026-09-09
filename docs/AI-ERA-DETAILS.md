# Detalles de la era de IA · v7

Detalles de IA en geometría editable, con la secuencia de épocas definida en `lib/story-timing.ts`:

- **Twitter → SpaceX:** el letrero circular se pliega entre 2,9 y 3,7 s; el cartel oficial de SpaceX aparece entre 3,39 y 4,03 s. Un cohete emerge sobre una plataforma de techo y despega desde 4,47 s, con aceleración, llama y humo en geometría. Es una transición creativa entre marcas, no una afirmación de que Twitter se haya rebautizado SpaceX.
- **OpenAI y Anthropic:** logos oficiales extruidos sobre dos edificios existentes. OpenAI ocupa el campus oeste, y Anthropic el edificio que antes tenía el cartel de Hooli para que el nombre sea legible dentro del encuadre final. Sus letreros aparecen desde 4,5 y 4,8 segundos; sus equipos de cómputo aparecen después. Se conservan los identificadores de los objetos para abrir proyectos anteriores.
- **Sora:** un estudio junto a SpaceX baja su cortina entre 8 y 8,53 s, pliega su cartel y muestra CLOSED y APR 2026. El guiño se basa en el cierre de las experiencias web y app de Sora el 26 de abril de 2026, confirmado por [OpenAI](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation). A la fecha de esta implementación, el cierre de la API está anunciado para el 24 de septiembre de 2026; la escena representa el cierre de la app, no la quiebra de OpenAI.
- **OpenClaw:** tres langostas pequeñas que aparecen desde 7,3 segundos junto a la piscina de la terraza de OpenAI, con cola segmentada, patas, antenas y pinzas animadas; una placa identifica el detalle. Son modelos propios en geometría, inspirados en la identidad de [OpenClaw](https://openclaw.ai/) y su [símbolo oficial](https://openclaw.ai/favicon.svg).

## Edición

`lib/ai-era.ts` contiene estas piezas y sus tiempos. Las transformaciones se registran en el mismo sistema que el resto de la ciudad; el cohete, humo, letreros, cortina, equipos y langostas se incluyen en la animación del GLB. La placa de Sora usa tipografía geométrica de la escena. Los demás logos se extruyen de SVG oficiales cuya procedencia y hashes están en `public/assets/ai-era-logo-sources.json`.

Los materiales y luces de v4 se mantienen. El exportador MP4 desactiva la observación de archivos durante el render para que cambios en otros directorios no recarguen una animación que está siendo exportada.
