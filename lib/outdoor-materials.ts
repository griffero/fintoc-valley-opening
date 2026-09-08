import * as THREE from 'three';

export type SurfaceRole = 'masonry' | 'glass' | 'metal';

/** Materials are selected by purpose, not by an exact match of their paint color. */
export function createSurface(color: string, role: SurfaceRole = 'masonry') {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: role === 'glass' ? 0.25 : role === 'metal' ? 0.48 : 0.86,
    metalness: role === 'glass' ? 0.32 : role === 'metal' ? 0.5 : 0,
    envMapIntensity: role === 'glass' ? 1.2 : 0.5,
  });
  material.name = `${role} · ${color}`;
  return material;
}

/** Broad sky/horizon reflections. Entirely procedural; no photographic backdrop. */
export function outdoorEnvironment(renderer: THREE.WebGLRenderer) {
  const environment = new THREE.Scene();
  const geometry = new THREE.SphereGeometry(100, 64, 32);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const ground = new THREE.Color('#716d55');
  const horizon = new THREE.Color('#e1e5dc');
  const zenith = new THREE.Color('#8eaec8');
  const cloud = new THREE.Color('#f1f0e7');
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i) / 100;
    const angle = Math.atan2(positions.getZ(i), positions.getX(i));
    if (y < 0) color.copy(horizon).lerp(ground, Math.min(1, -y * 3.2));
    else {
      color.copy(horizon).lerp(zenith, Math.pow(y, 0.55));
      // Wide, soft cloud banks provide variation across adjacent glass planes.
      const bank = Math.exp(-Math.pow((y - 0.3) / 0.13, 2));
      color.lerp(cloud, bank * (0.3 + 0.25 * Math.sin(angle * 3 + 0.8)));
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
