import * as THREE from 'three';

export type TexturedSurface =
  | 'masonry'
  | 'roof'
  | 'glass'
  | 'metal'
  | 'asphalt'
  | 'paving'
  | 'grass'
  | 'foliage'
  | 'wood'
  | 'solar';
export type SurfaceRole = TexturedSurface | 'paint';

// Tile dimensions are in scene units, never stretched to each building's bounds.
export const SURFACE_TILES: Record<TexturedSurface, number> = {
  masonry: 8,
  roof: 12,
  glass: 8,
  metal: 3,
  asphalt: 16,
  paving: 8,
  grass: 48,
  foliage: 4,
  wood: 4,
  solar: 2.4,
};
const fract = (n: number) => n - Math.floor(n);
const hash = (x: number, y: number, salt = 0) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453);
const smooth = (n: number) => n * n * (3 - 2 * n);
function noise(u: number, v: number, cells: number, salt = 0) {
  const x = u * cells,
    y = v * cells;
  const ix = Math.floor(x),
    iy = Math.floor(y);
  const a = smooth(fract(x)),
    b = smooth(fract(y));
  const at = (dx: number, dy: number) =>
    hash((ix + dx) % cells, (iy + dy) % cells, salt);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(at(0, 0), at(1, 0), a),
    THREE.MathUtils.lerp(at(0, 1), at(1, 1), a),
    b,
  );
}
const line = (coordinate: number, width: number) =>
  1 -
  THREE.MathUtils.smoothstep(
    Math.min(fract(coordinate), 1 - fract(coordinate)),
    width * 0.5,
    width,
  );

type SurfaceMaps = {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
};

/** Seeded, seamless PBR maps. Color is neutral so palette edits still work. */
export function createTextureLibrary(renderer: THREE.WebGLRenderer) {
  const maps = new Map<TexturedSurface, SurfaceMaps>();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  function get(role: TexturedSurface): SurfaceMaps {
    const existing = maps.get(role);
    if (existing) return existing;
    const size = role === 'grass' ? 512 : 256;
    const albedo = new Uint8ClampedArray(size * size * 4);
    const roughness = new Uint8ClampedArray(albedo.length);
    const normals = new Uint8ClampedArray(albedo.length);
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const u = x / size,
          v = y / size,
          i = y * size + x;
        const broad = noise(u, v, 4, 3),
          medium = noise(u, v, 16, 9);
        const fine = hash(x, y, 17);
        let color = 0.975,
          rough = 0.96,
          height = 0.5;
        switch (role) {
          case 'masonry': {
            const pores = Math.max(0, fine - 0.89) * 0.45;
            color =
              0.975 + (broad - 0.5) * 0.065 + (medium - 0.5) * 0.03 - pores;
            rough = 0.87 + medium * 0.12;
            height = 0.5 + (medium - 0.5) * 0.03 - pores;
            break;
          }
          case 'roof': {
            const seam = Math.max(line(u * 4, 0.018), line(v * 2, 0.014));
            const sheet = hash(Math.floor(u * 4), Math.floor(v * 2), 11);
            color =
              0.94 +
              sheet * 0.065 +
              (medium - 0.5) * 0.018 +
              (fine - 0.5) * 0.035 -
              seam * 0.055;
            rough = 0.9 + broad * 0.09;
            height = 0.5 - seam * 0.13 + (fine - 0.5) * 0.014;
            break;
          }
          case 'glass': {
            const col = Math.floor(u * 5),
              row = Math.floor(v * 3);
            const pane = hash(col, row, 21);
            const blind = pane > 0.8 && fract(v * 3) > 0.36 ? 0.085 : 0;
            color = 0.76 + pane * 0.24 - blind;
            rough = 0.64 + pane * 0.32;
            height = 0.5 + (broad - 0.5) * 0.015;
            break;
          }
          case 'metal': {
            const brush = noise(u, 0, 128, 16) * 0.9 + broad * 0.1;
            color = 0.975 + (broad - 0.5) * 0.022;
            rough = 0.68 + brush * 0.19 + medium * 0.1;
            height = 0.5 + (brush - 0.5) * 0.012;
            break;
          }
          case 'asphalt': {
            const patch = smooth(broad);
            // Broad resurfacing bands, softened at their boundaries; no baked shadows or cracks.
            const wear = noise(u, 0, 8, 32) - 0.5;
            color =
              0.94 + (patch - 0.5) * 0.09 + (fine - 0.5) * 0.06 + wear * 0.055;
            rough = 0.84 + medium * 0.16;
            height = 0.5 + (fine - 0.5) * 0.08;
            break;
          }
          case 'paving': {
            const row = Math.floor(v * 4);
            const stagger = u * 4 + (row % 2) * 0.5;
            const joint = Math.max(line(stagger, 0.022), line(v * 4, 0.022));
            const slab = hash(Math.floor(stagger) % 4, row, 6);
            color = 0.93 + slab * 0.08 - joint * 0.14;
            rough = 0.86 + slab * 0.11;
            height = 0.5 - joint * 0.15 + (fine - 0.5) * 0.012;
            break;
          }
          case 'grass': {
            color =
              0.88 +
              (broad - 0.5) * 0.17 +
              (medium - 0.5) * 0.075 +
              (fine - 0.5) * 0.018;
            rough = 0.98;
            height = 0.5 + (medium - 0.5) * 0.025;
            break;
          }
          case 'foliage': {
            color = 0.9 + (broad - 0.5) * 0.17 + (medium - 0.5) * 0.09;
            rough = 0.98;
            height = 0.5 + (medium - 0.5) * 0.055;
            break;
          }
          case 'wood': {
            const grain =
              0.5 +
              0.5 * Math.sin((u * 26 + noise(u, v, 4, 8) * 0.6) * Math.PI * 2);
            color = 0.94 + (broad - 0.5) * 0.04 - grain * 0.06;
            rough = 0.83 + grain * 0.14;
            height = 0.5 - grain * 0.026;
            break;
          }
          case 'solar': {
            const cell = hash(Math.floor(u * 6), Math.floor(v * 6), 3);
            const seam = Math.max(line(u * 6, 0.055), line(v * 6, 0.055));
            const contact = line(u * 18, 0.026) * 0.4;
            color = 0.77 + cell * 0.12 + seam * 0.16 + contact * 0.07;
            rough = 0.73 + cell * 0.15 + seam * 0.1;
            height = 0.5 - seam * 0.012;
            break;
          }
        }
        heights[i] = height;
        // Encode albedo as sRGB; data textures remain linear, without color conversion.
        const encoded =
          (color <= 0.0031308
            ? color * 12.92
            : 1.055 * Math.pow(color, 1 / 2.4) - 0.055) * 255;
        for (let c = 0; c < 3; c++) {
          albedo[i * 4 + c] = encoded;
          roughness[i * 4 + c] = c === 1 ? rough * 255 : 255;
        }
        albedo[i * 4 + 3] = roughness[i * 4 + 3] = 255;
      }
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const at = (dx: number, dy: number) =>
          heights[((y + dy + size) % size) * size + ((x + dx + size) % size)];
        const dx = (at(-1, 0) - at(1, 0)) * 2;
        const dy = (at(0, 1) - at(0, -1)) * 2;
        const length = Math.hypot(dx, dy, 1),
          i = (y * size + x) * 4;
        normals[i] = ((dx / length) * 0.5 + 0.5) * 255;
        normals[i + 1] = ((dy / length) * 0.5 + 0.5) * 255;
        normals[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
        normals[i + 3] = 255;
      }
    function texture(data: Uint8ClampedArray, channel: string, color = false) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d')!;
      const image = context.createImageData(size, size);
      image.data.set(data);
      context.putImageData(image, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.name = `${role} · ${channel}`;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      return texture;
    }
    const packed = texture(roughness, 'metallic-roughness');
    const result = {
      map: texture(albedo, 'albedo', true),
      normalMap: texture(normals, 'normal'),
      roughnessMap: packed,
      metalnessMap: packed,
    };
    maps.set(role, result);
    return result;
  }
  return {
    get,
    dispose: () => {
      for (const set of maps.values())
        for (const texture of new Set(Object.values(set))) texture.dispose();
      maps.clear();
    },
  };
}

/** Bake metric UVs before batching. UVs and maps survive GLB export. */
export function surfaceGeometry(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  scale = new THREE.Vector3(1, 1, 1),
) {
  if (Array.isArray(material) || geometry.userData.surfaceUV) return geometry;
  const role = material.userData.surfaceRole as SurfaceRole | undefined;
  if (!role || role === 'paint') return geometry;
  const tile = SURFACE_TILES[role];
  const g = geometry.clone(),
    p = g.getAttribute('position'),
    n = g.getAttribute('normal');
  const uv = new Float32Array(p.count * 2);
  const curved = /Sphere|Icosahedron|Cone|Cylinder|Lathe|Torus|Tube/.test(
    geometry.type,
  );
  const originalUV = g.getAttribute('uv');
  if (curved && originalUV) {
    g.computeBoundingBox();
    const bounds = g.boundingBox!.getSize(new THREE.Vector3()).multiply(scale);
    for (let i = 0; i < p.count; i++) {
      uv[i * 2] =
        (originalUV.getX(i) * Math.PI * Math.max(bounds.x, bounds.z)) / tile;
      uv[i * 2 + 1] = (originalUV.getY(i) * bounds.y) / tile;
    }
  } else {
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) * scale.x,
        y = p.getY(i) * scale.y,
        z = p.getZ(i) * scale.z;
      const nx = Math.abs(n?.getX(i) || 0),
        ny = Math.abs(n?.getY(i) || 0),
        nz = Math.abs(n?.getZ(i) || 0);
      const top = ny >= nx && ny >= nz;
      uv[i * 2] = (top ? x : nx > nz ? z : x) / tile;
      uv[i * 2 + 1] = (top ? -z : y) / tile;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.userData.surfaceUV = true;
  return g;
}
