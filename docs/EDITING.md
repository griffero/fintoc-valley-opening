# Fintoc Valley: editable 3D scene

The viewport is a real Three.js scene. Buildings, lettering, roads, cars, trees, billboards and the helicopter are geometry. The only prerecorded media used by the application is the soundtrack.

## Edit in the browser

- Select a campus in **Objetos**, or click it in the viewport. Adjust its position, footprint, height and facade color.
- **Cámara** adjusts the animated camera's azimuth, elevation and framing. **Explorar en 3D** switches to an orbit camera.
- **Colores** controls the scene palette. The two title lines are editable under **Objetos**.
- **Luz** controls sunlight, sky fill, exposure, contact occlusion and solar elevation.
- **Guardar proyecto** downloads a JSON file. **Abrir proyecto** restores it. Changes also persist in this browser's local storage.
- **Exportar modelo 3D** downloads a GLB containing editable scene geometry, materials, instanced vegetation/vehicles, lights and a named animation clip for the title construction, Fintoc building, cranes and helicopter. The browser camera, postprocessing and the soundtrack remain in the web project; they are not baked into the GLB. Vehicle traffic uses procedural instance matrices in the web renderer.
- The camera button in the transport bar exports the current frame as PNG.

## Edit the source

- `lib/scene-config.ts`: defaults and validated project format.
- `lib/editable-valley.ts`: geometry builders, logo extrusion, city generation, lighting, camera motion, scene animation and GLB export.
- `app/page.tsx`: editor, playback, project import/export and local persistence.
- `app/valley.css`: editor presentation.
- `public/assets`: actual SVG logos and source records.
- `public/fonts`: geometric typefaces and Anton's OFL license.
- `scripts/font-to-three.py`: converts an OFL TTF to Three.js outline data.

Run `npm install` and `npm run dev` to work locally. Build with `npm run build`.

## Camera reconstruction

Reference: [Silicon Valley opening by yU+co for HBO](https://www.yuco.com/works/silicon-valley).

Affine tracking of static landmarks in the 1920×1080 reference gives a nearly linear image scale from 0.672 to 1.0 over source frames 0–183 at 24000/1001 fps. The corresponding screen-space fixed point is approximately (3116, -1048). The camera holds after 7.6326 seconds. The renderer converts this transform to an orthographic camera target and zoom; the scene is not using tracked video as its background.

Lighting combines a warm shadow-casting directional sun, cool directional sky fill, a hemisphere light, a generated environment for reflections, and GTAO contact occlusion. The final image uses ACES tone mapping and antialiasing. These postprocessing effects should be recreated in the destination editor when opening the GLB.
