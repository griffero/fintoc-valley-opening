# Fintoc Valley Opening

Intro animada en Three.js inspirada en los títulos de *Silicon Valley*, con Fintoc como protagonista. La ciudad, los logos, la cámara y las animaciones se generan en 3D y siguen siendo editables. La música está incluida como archivo de audio.

- [Abrir el editor publicado](https://fintoc-valley-opening.fintoc-7375.chatgpt.site/)
- [Descargar el video v12 en 4K con música](https://github.com/griffero/fintoc-valley-opening/releases/tag/v12)
- [Guía de edición y estructura del proyecto](docs/EDITING.md)
- [Nueva auditoría del original: diez ajustes y marcas integradas](docs/REFERENCE-FINISH-AUDIT.md)
- [Auditoría visual y cambios](docs/VISUAL-AUDIT.md)
- [Diez mejoras de texturas y cuatro de iluminación](docs/TEXTURE-LIGHTING-AUDIT.md)
- [SpaceX, OpenAI, Anthropic y OpenClaw](docs/AI-ERA-DETAILS.md)
- [Waymo, NVIDIA y cronología visual](docs/TECH-ERA-DETAILS.md)
- [Luz cinematográfica y neblina editable](docs/CINEMATIC-LIGHTING.md)

## Ejecutar localmente

Requiere Node.js 22.13 o superior y npm.

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 3000
```

Abre `http://localhost:3000`. El editor permite modificar edificios, cámara, iluminación, colores y títulos, guardar o abrir proyectos JSON y exportar geometría animada como GLB.

Para compilar:

```bash
npm run build
```

## Renderizar el MP4

El renderizador incluido usa la misma escena Three.js, sin grabar la interfaz. Requiere Google Chrome, ffmpeg con soporte para H.264 y una GPU compatible con WebGL 2. Se ha ejecutado en macOS con Apple Silicon.

Desde la raíz del repositorio:

```bash
node scripts/video-export/export.mjs
```

Genera `outputs/fintoc-valley-v12-4k.mp4`: 3840 × 2160, 24 fps, 262 fotogramas, ocho muestras temporales por fotograma y la pista de música incluida. Usa un perfil de Chrome separado y un servidor temporal en el puerto 3040; ambos se cierran al terminar.

La ubicación predeterminada de Chrome es la habitual en macOS y ffmpeg se busca en el `PATH`. Para otras instalaciones, define `CHROME_PATH` y `FFMPEG_PATH`. Los ajustes de la exportación están en `scripts/video-export/render.html`; no se leen automáticamente desde el almacenamiento del editor en otro navegador.

Para comprobar fotogramas a 1080p sin generar el video completo:

```bash
node scripts/video-export/export.mjs --probe
```

Agrega `--verify` para comprobar también la estabilidad al avanzar y retroceder, la edición de títulos y la restauración de la escena después de exportar un GLB. Los archivos temporales quedan en `work/video-export/`, excluido de Git.

## Archivos principales

| Archivo | Contenido |
| --- | --- |
| `app/page.tsx` | Editor y controles de reproducción |
| `lib/editable-valley.ts` | Escena, cámara, iluminación y exportación GLB |
| `lib/scene-config.ts` | Valores iniciales y formato del proyecto |
| `lib/opening-campus.ts` | Conjuntos de edificios del primer plano |
| `lib/neighborhood-buildings.ts` | Familias arquitectónicas de los edificios secundarios |
| `lib/fintoc-identity.ts` | Una sola marca Fintoc: placa blanca y transición del logo antiguo al nuevo en negro |
| `lib/fintoc-hq.ts` | Sede final y terraza triangular |
| `lib/coffee-kiosk.ts` | Puesto de café think |
| `lib/city-life.ts` | Globos, grúas, maquinaria y actividad urbana |
| `lib/tech-era.ts` | Robotaxis, caída de NFT/Web3 e identidad de NVIDIA |
| `public/assets/` | Logos vectoriales y registros de sus fuentes |
| `public/media/opening-soundtrack.m4a` | Música de la animación |

La referencia visual es la [intro de Silicon Valley de yU+co](https://www.yuco.com/works/silicon-valley). Las fuentes de los logos y la licencia de Anton se conservan junto a sus archivos. Este repositorio no concede derechos adicionales sobre música, marcas o material de terceros.
