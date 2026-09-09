import * as THREE from 'three';

import { createTextureLibrary, type SurfaceRole } from './surface-textures';
export { surfaceGeometry, type SurfaceRole } from './surface-textures';

/** One scene owns the shared maps; materials retain independently editable colors. */
export function createSurfaceLibrary(
  renderer: THREE.WebGLRenderer,
  environment: THREE.Texture,
) {
  const textures = createTextureLibrary(renderer);
  const roughness: Record<SurfaceRole, number> = {
    masonry: 0.92,
    roof: 0.95,
    glass: 0.32,
    metal: 0.58,
    asphalt: 1,
    paving: 0.9,
    grass: 1,
    foliage: 1,
    wood: 0.85,
    solar: 0.34,
    paint: 0.7,
  };
  function createSurface(color: string, role: SurfaceRole = 'masonry') {
    const reflective = role === 'glass' || role === 'metal' || role === 'solar';
    const material = new THREE.MeshStandardMaterial({
      color,
      flatShading: role === 'foliage',
      roughness: roughness[role],
      metalness:
        role === 'metal'
          ? 0.65
          : role === 'glass' || role === 'solar'
            ? 0.16
            : 0,
      ...(role === 'paint' ? {} : textures.get(role)),
      ...(reflective
        ? {
            envMap: environment,
            envMapIntensity:
              role === 'metal' ? 0.34 : role === 'glass' ? 0.6 : 0.46,
          }
        : {}),
    });
    material.normalScale.setScalar(
      role === 'glass' || role === 'solar'
        ? 0.06
        : role === 'masonry'
          ? 0.55
          : 0.45,
    );
    material.name = `${role} · ${color}`;
    material.userData.surfaceRole = role;
    return material;
  }
  return { createSurface, dispose: textures.dispose };
}

/** Broad sky/horizon reflections. Entirely procedural; no photographic backdrop. */
export function outdoorEnvironment(renderer: THREE.WebGLRenderer) {
  const environment = new THREE.Scene();
  const geometry = new THREE.SphereGeometry(100, 64, 32);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const ground = new THREE.Color('#687273');
  const shadedHorizon = new THREE.Color('#9aa9ad');
  const horizon = new THREE.Color('#e4e9e7');
  const zenith = new THREE.Color('#7298ba');
  const cloud = new THREE.Color('#ffffff');
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i) / 100;
    const angle = Math.atan2(positions.getZ(i), positions.getX(i));
    if (y < 0) color.copy(horizon).lerp(ground, Math.min(1, -y * 3.2));
    else {
      color.copy(horizon).lerp(zenith, Math.pow(y, 0.55));
      // A cooler, shaded horizon on the opposite side gives adjacent glass faces different reflections.
      const horizonBand = Math.exp(-Math.pow(y / 0.28, 2));
      color.lerp(
        shadedHorizon,
        horizonBand * (0.16 + 0.14 * Math.cos(angle + 0.7)),
      );
      // Wide, soft cloud banks provide variation across adjacent glass planes.
      const bank = Math.exp(-Math.pow((y - 0.3) / 0.13, 2));
      color.lerp(cloud, bank * (0.52 + 0.4 * Math.sin(angle * 3 + 0.8)));
    }
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
  });
  environment.add(new THREE.Mesh(geometry, material));
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(environment, 0.035, 0.1, 200);
  geometry.dispose();
  material.dispose();
  generator.dispose();
  return target;
}
