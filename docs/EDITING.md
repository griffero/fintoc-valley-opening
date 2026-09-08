# Fintoc Valley: editable 3D scene

The viewport is a real Three.js scene. Buildings, lettering, roads, cars, trees, billboards, balloons, cranes, excavators and the helicopter are geometry. The only prerecorded media used by the application is the soundtrack.

## Edit in the browser

- Select a campus in **Objetos**, or click it in the viewport. Adjust its position, footprint, height and facade color.
- **Cámara** adjusts the animated camera's azimuth, elevation and framing. **Explorar en 3D** switches to an orbit camera.
- **Colores** controls the scene palette. The two title lines are editable under **Objetos**.
- **Luz** controls sunlight, sky fill, exposure, contact occlusion, solar elevation and **Ciclos de luz**, the strength of alternating roof/facade daylight. Set its value to zero for a fixed sun. **Desenfoque de movimiento** controls the exposure duration of real subframe integration.
- **Guardar proyecto** downloads a JSON file. **Abrir proyecto** restores it. Changes also persist in this browser's local storage.
- **Exportar modelo 3D** downloads a GLB containing editable scene geometry, materials, instanced vegetation/vehicles, lights and a named animation clip. It includes the individual old/new Fintoc logo pieces, the expanding office, rigid title floors, beveled roofs, foundations and steel frames, the reference-based headquarters and its animated rooftop guests, balloon inflation/flight, crane slewing/trolleys/hoists, excavator joints, mixer truck and billboard replacement. The browser camera, postprocessing and the soundtrack remain in the web project; they are not baked into the GLB. Regular vehicle traffic uses procedural instance matrices in the web renderer.
- The camera button in the transport bar exports the current frame as PNG.

## Edit the source

- `lib/scene-config.ts`: defaults and validated project format.
- `lib/editable-valley.ts`: geometry builders, logo extrusion, city generation, lighting, camera motion, scene animation and GLB export.
- `lib/city-life.ts`: curved and stepped campuses, balloon profiles and wrapped emblems, lattice cranes, excavators, construction yards, tents, rooftop activity, mixer truck and historical billboards. Coordinates, dimensions, colors and timing are editable here. `createMotion` drives both timeline seeking and exported position/rotation/scale tracks.
- `lib/opening-campus.ts`: three connected foreground complexes with folded wings, solar roofs, a courtyard laboratory, parking bays and small internal drives. Their whole footprints are reserved before background buildings and vegetation are generated.
- `lib/neighborhood-buildings.ts`: twelve independent architectural families for the unbranded neighborhood: open courts, planted terraces, twin towers with skybridges, chamfered wedges, sawtooth workshops, oval towers, slabs on pilotis, fin towers, gabled studios, vaulted halls, cantilevers and civic pavilions. Their massing, glazing, structure and roofs are actual geometry. The scene derives larger parcels from the spaces between roads, distributes families by district, avoids immediate repeats and spaces taller buildings. Wider blocks contain multiple wings without introducing extra public streets. The two selectable unbranded campuses use terraces and a cantilever respectively.
- `lib/coffee-kiosk.ts`: think coffee stand at x=29, z=-20, beside the final headquarters. The counter, canopy, espresso machine, cups, seating and serving barista are separate 3D parts. The user-supplied PNG was traced to SVG paths; the brain and lettering are extruded geometry, retained as editable meshes in GLB export. The original PNG remains alongside the SVG for reference.
- `lib/fintoc-hq.ts`: Cerro El Plomo 5420, reconstructed from the three supplied references: stepped glass tower, white fins, triangular setback terrace with a matching diagonal lower facade, two parasols, planters, roof equipment and waving guests. All are editable geometry.
- `lib/outdoor-materials.ts`: material response for ten surface families, clean paint, and a structured outdoor sky environment.
- `lib/surface-textures.ts`: seeded PBR maps and metric UVs prepared before batching; color, normal and packed metallic/roughness textures are embedded in GLB exports.
- `docs/TEXTURE-LIGHTING-AUDIT.md`: the ten texture improvements and four lighting changes implemented in v4.
- `lib/construction-timeline.ts`: shared two-front construction events and crane delivery times.
- `lib/shutter-pass.ts`: linear-light temporal exposure for actors, camera and daylight before AO and output tone mapping.
- `lib/task-motion.ts`: deterministic machinery task cycles with moves and holds.
- `docs/VISUAL-AUDIT.md`: observations, measurements, implemented changes and remaining differences from the original.
- `lib/solar-motion.ts`: deterministic one-second roof/side lighting cycles with phase and entry/exit envelopes measured from the reference. The final pose matches the established afternoon composition. The GLB includes the sun's rotation animation; color and intensity variation are applied by the web renderer.
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

Affine tracking of the reference measured a scale from 0.672 to 1.0 and a final hold at 7.6326 seconds. Applying that transform literally to this different city layout framed too much empty suburb. The current shot adapts the composition: an initial target of approximately (-8, 3, 105), scale 0.78, and a scale-aware advance into the unchanged final target and scale 1.0. The hold remains at 7.6326 seconds. Camera, buildings and motion are rendered geometry; the source video is not a background.

The measured reference orientation is approximately 27° elevation and 46° azimuth. Those values replace the earlier 36°/36° view, and the target is reframed to match the final title placement. The current advance is composed around the active startup district; the final framing and 7.6326-second hold remain unchanged. Saved version-1 projects migrate to version 2 while retaining the user's relative camera and light adjustments, colors and building edits.

Lighting combines an animated shadow-casting directional sun, cool sky fill, neutral ground bounce, structured environment reflections, localized GTAO and restrained depth-based atmosphere. Textured surfaces use shared color, normal and packed metallic/roughness maps, with UVs in scene units. The former fixed screen-space warm veil and shadow lift were removed. The light alternates between roof-heavy illumination at half seconds and side-heavy illumination at integer seconds. Its amplitude enters between 0.15–1.30 seconds and settles between 6.45–7.6326 seconds. This is an art-directed reconstruction of observed lighting phases, not a claim to recover astronomical day cycles. Exposure remains fixed through the clip.

The old car ghost silhouettes were removed. The renderer integrates three real subframes of actors, camera and daylight in linear HDR color before computing central-frame AO and ACES/sRGB output. The 4K offline export uses eight temporal samples per frame. The title plot changes from grass to demolition earth to pavement; postprocessing, material-color changes and soundtrack remain in the web project and should be recreated when opening the GLB in another renderer.


## Construction and export behavior

Title floors are independent rigid groups. Each appears at its own exact timeline event, then settles a short distance to its final level. The GLB uses STEP interpolation for the appearance scale, and includes those event times in the exported sample set; windows no longer squash vertically. Steel frames remain separately animated. Editing the title replaces its floor registry, so obsolete text does not leave orphan animation tracks.

The final headquarters rises by translation from below the terrain, preserving the proportions of its facade and terrace. It is an artistic emergence, not a simulation of that building’s real construction. The selected height/width/depth still scale the final model normally. Rooftop guests retain independently animated arms and bodies.

The exported animation uses a common ancestor for geometry and lights so the sun rotation track resolves correctly. Tracks of user-hidden buildings are filtered out. The export includes current vehicle geometry; traffic motion itself remains procedural in the web project. Sky environment, haze, exposure, color-changing construction ground, audio and postprocessing should be recreated when opening the GLB in another renderer.

The final headquarters has one Fintoc wordmark on the upper roof. Its terrace narrows to a tip at the left and widens toward the two parasols at the right, as in the supplied aerial views. The deck, glazing, handrails, lower facade and furniture follow this triangular footprint.


## V1 construction choreography

Eight temporary low-rise blocks clear the title plot between 3.25 and 3.76 seconds. No title foundations appear before 3.78 seconds. Each steel level precedes its rigid facade floor by 0.17 seconds. Two construction fronts meet in SILICON; VALLEY resolves last, by 7.18 seconds. Seven selected floor/roof events also drive the hero crane destinations, hoists, trolleys and load release. Cables retract with an empty hook after deposition. Hero cranes clear the title by 7.54 seconds.

The export samples the complete actor system together, so parent machinery and animated cargo stay synchronized. Cargo visibility uses STEP scale tracks, and exact deposition times are included. The temporary campus, debris, pedestrian movements, compressed balloon episode, faster rooftop gestures and helicopter arrival are included as transform animation.
