# Fintoc Valley: editable 3D scene

The viewport is a real Three.js scene. Buildings, lettering, roads, cars, trees, billboards, balloons, cranes, excavators and the helicopter are geometry. The only prerecorded media used by the application is the soundtrack.

## Edit in the browser

- Select a campus in **Objetos**, or click it in the viewport. Adjust its position, footprint, height and facade color.
- **Cámara** adjusts the animated camera's azimuth, elevation and framing. **Explorar en 3D** switches to an orbit camera.
- **Colores** controls the scene palette. The two title lines are editable under **Objetos**.
- **Luz** controls sunlight, sky fill, exposure, contact occlusion, solar elevation and **Recorrido del sol**, the strength of the accelerated daylight arc. Set its value to zero for a fixed sun.
- **Guardar proyecto** downloads a JSON file. **Abrir proyecto** restores it. Changes also persist in this browser's local storage.
- **Exportar modelo 3D** downloads a GLB containing editable scene geometry, materials, instanced vegetation/vehicles, lights and a named animation clip. It includes the individual old/new Fintoc logo pieces, the expanding office, rigid title floors, beveled roofs, foundations and steel frames, the reference-based headquarters and its animated rooftop guests, balloon inflation/flight, crane slewing/trolleys/hoists, excavator joints, mixer truck and billboard replacement. The browser camera, postprocessing and the soundtrack remain in the web project; they are not baked into the GLB. Regular vehicle traffic uses procedural instance matrices in the web renderer.
- The camera button in the transport bar exports the current frame as PNG.

## Edit the source

- `lib/scene-config.ts`: defaults and validated project format.
- `lib/editable-valley.ts`: geometry builders, logo extrusion, city generation, lighting, camera motion, scene animation and GLB export.
- `lib/city-life.ts`: curved and stepped campuses, balloon profiles and wrapped emblems, lattice cranes, excavators, construction yards, tents, rooftop activity, mixer truck and historical billboards. Coordinates, dimensions, colors and timing are editable here. `createMotion` drives both timeline seeking and exported position/rotation/scale tracks.
- `lib/coffee-kiosk.ts`: think coffee stand at x=33, z=-16, beside the final headquarters. The counter, canopy, espresso machine, cups, seating and serving barista are separate 3D parts. The user-supplied PNG was traced to SVG paths; the brain and lettering are extruded geometry, retained as editable meshes in GLB export. The original PNG remains alongside the SVG for reference.
- `lib/fintoc-hq.ts`: Cerro El Plomo 5420, reconstructed from the three supplied references: stepped glass tower, white fins, triangular setback terrace with a matching diagonal lower facade, two parasols, planters, roof equipment and waving guests. All are editable geometry.
- `lib/outdoor-materials.ts`: explicit glass/masonry/metal roles and a procedural outdoor sky environment.
- `lib/task-motion.ts`: deterministic machinery task cycles with moves and holds.
- `docs/VISUAL-AUDIT.md`: observations, measurements, implemented changes and remaining differences from the original.
- `lib/solar-motion.ts`: deterministic morning-to-afternoon sun direction, elevation, color and intensity. The final pose matches the established afternoon composition. The GLB includes the sun's rotation animation; color and intensity variation are applied by the web renderer.
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

Traffic speed is set in `carRoutes` in `lib/editable-valley.ts`: 14–24 scene units per second, approximately three times the earlier 4–9 range. Reference calibration used six source frames (210–216, 0.25025 seconds) during the camera hold: moving vehicle features traveled approximately 182, 199 and 277 pixels per second at 1920×1080; a car rounding the corner traveled approximately 141 pixels per second. This is a visual speed calibration, not a reconstruction of each vehicle's route. Traffic still uses the common timeline, so changing its speed does not change the camera, logo transformation or soundtrack.

## Camera reconstruction

Reference: [Silicon Valley opening by yU+co for HBO](https://www.yuco.com/works/silicon-valley).

Affine tracking of static landmarks in the 1920×1080 reference gives a nearly linear image scale from 0.672 to 1.0 over source frames 0–183 at 24000/1001 fps. The corresponding screen-space fixed point is approximately (3116, -1048). The camera holds after 7.6326 seconds. The renderer converts this transform to an orthographic camera target and zoom; the scene is not using tracked video as its background.

Lighting combines an animated shadow-casting directional sun, cool directional sky fill, a hemisphere light, a generated environment for reflections, and GTAO contact occlusion. During the camera advance the sun sweeps through 95 degrees, rises toward midday, and descends to the established final solar elevation. Its direction, tint and intensity then hold from 7.6326 seconds through the closing frame, following the reference’s nearly stable late roof colors. Shadow direction and length change continuously while light color shifts from warm morning through neutral midday to warm afternoon. This is an art-directed time-lapse arc inspired by the source, not an astronomical reconstruction. The final image uses ACES tone mapping, filtered PCF shadows with a wider penumbra, modest distance haze and antialiasing. Two low-opacity past-position vehicle silhouettes approximate short shutter trails; these are not an optical motion-blur reconstruction. The title plot changes from grass to construction earth to pavement in the browser; that material-color transition is not part of the GLB transform clip. These postprocessing effects should be recreated in the destination editor when opening the GLB.


## Construction and export behavior

Title floors are independent rigid groups. Each appears at its own exact timeline event, then settles a short distance to its final level. The GLB uses STEP interpolation for the appearance scale, and includes those event times in the exported sample set; windows no longer squash vertically. Steel frames remain separately animated. Editing the title replaces its floor registry, so obsolete text does not leave orphan animation tracks.

The final headquarters rises by translation from below the terrain, preserving the proportions of its facade and terrace. It is an artistic emergence, not a simulation of that building’s real construction. The selected height/width/depth still scale the final model normally. Rooftop guests retain independently animated arms and bodies.

The exported animation uses a common ancestor for geometry and lights so the sun rotation track resolves correctly. Tracks of user-hidden buildings are filtered out. The export includes current vehicle and short-trail geometry; traffic motion itself remains procedural in the web project. Sky environment, haze, exposure, color-changing construction ground, audio and postprocessing should be recreated when opening the GLB in another renderer.

The final headquarters has one Fintoc wordmark on the upper roof. Its terrace narrows to a tip at the left and widens toward the two parasols at the right, as in the supplied aerial views. The deck, glazing, handrails, lower facade and furniture follow this triangular footprint.
