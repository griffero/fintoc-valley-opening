# Fintoc Valley: editable 3D scene

The viewport is a real Three.js scene. Buildings, lettering, roads, cars, trees, billboards, balloons, cranes, excavators and the helicopter are geometry. The only prerecorded media used by the application is the soundtrack.

## Edit in the browser

- Select a campus in **Objetos**, or click it in the viewport. Adjust its position, footprint, height and facade color.
- **Cámara** adjusts the animated camera's azimuth, elevation and framing. **Explorar en 3D** switches to an orbit camera.
- **Colores** controls the scene palette. The two title lines are editable under **Objetos**.
- **Luz** controls sunlight, sky fill, exposure, contact occlusion and solar elevation.
- **Guardar proyecto** downloads a JSON file. **Abrir proyecto** restores it. Changes also persist in this browser's local storage.
- **Exportar modelo 3D** downloads a GLB containing editable scene geometry, materials, instanced vegetation/vehicles, lights and a named animation clip. It includes the individual old/new Fintoc logo pieces, the expanding office, title foundations and steel frames, balloon inflation/flight, crane slewing/trolleys/hoists, excavator joints, mixer truck and billboard replacement. The browser camera, postprocessing and the soundtrack remain in the web project; they are not baked into the GLB. Regular vehicle traffic uses procedural instance matrices in the web renderer.
- The camera button in the transport bar exports the current frame as PNG.

## Edit the source

- `lib/scene-config.ts`: defaults and validated project format.
- `lib/editable-valley.ts`: geometry builders, logo extrusion, city generation, lighting, camera motion, scene animation and GLB export.
- `lib/city-life.ts`: curved and stepped campuses, balloon profiles and wrapped emblems, lattice cranes, excavators, construction yards, tents, rooftop activity, mixer truck and historical billboards. Coordinates, dimensions, colors and timing are editable here. `createMotion` drives both timeline seeking and exported position/rotation/scale tracks.
- `app/page.tsx`: editor, playback, project import/export and local persistence.
- `app/valley.css`: editor presentation.
- `public/assets`: actual SVG logos and source records.
- `public/fonts`: geometric typefaces and Anton's OFL license.
- `scripts/font-to-three.py`: converts an OFL TTF to Three.js outline data.

Run `npm install` and `npm run dev` to work locally. Build with `npm run build`.

## Brand progression and opening activity

The first Fintoc office uses the authentic blue dot/chevron and wordmark from the official 2021 quickstart repository. Its individual SVG shapes assemble from 0.05 seconds, separate from 1.85 seconds, and disappear as two new floors rise. The current 2024 identity assembles at a larger width from 2.6 seconds. The final Fintoc headquarters also assembles its oversized current logo from 4.9 seconds. The first office remains selectable and configurable in **Objetos**.

The old logo's unmodified SVGs and first-party verification are recorded in `public/assets/old-fintoc-provenance.md`. Historical eBay, Intel and Myspace vectors and their source records are in `public/assets/opening-extra-logos-provenance.md`.

The opening district includes two ribbed hot-air balloons, eight articulated tower cranes, six excavators, fifteen A-frame tents, an exposed steel construction site, a mixer truck, a curved ribbon campus with a glass atrium, stepped offices and a triangulated glass dome. The Myspace rooftop billboard is replaced by Facebook during the camera advance. The title progresses from foundations to exposed steel and finished letter-shaped buildings. These set pieces are named separately in the GLB scene hierarchy; edit their transforms, materials and animation tracks in a compatible 3D editor.

## Camera reconstruction

Reference: [Silicon Valley opening by yU+co for HBO](https://www.yuco.com/works/silicon-valley).

Affine tracking of static landmarks in the 1920×1080 reference gives a nearly linear image scale from 0.672 to 1.0 over source frames 0–183 at 24000/1001 fps. The corresponding screen-space fixed point is approximately (3116, -1048). The camera holds after 7.6326 seconds. The renderer converts this transform to an orthographic camera target and zoom; the scene is not using tracked video as its background.

Lighting combines a warm shadow-casting directional sun, cool directional sky fill, a hemisphere light, a generated environment for reflections, and GTAO contact occlusion. The final image uses ACES tone mapping and antialiasing. These postprocessing effects should be recreated in the destination editor when opening the GLB.
