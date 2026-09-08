import * as THREE from 'three';
import type { SurfaceRole } from './outdoor-materials';

type Kit = {
  box: (
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string | THREE.Material,
  ) => THREE.Mesh;
  mesh: (
    p: THREE.Object3D,
    g: THREE.BufferGeometry,
    m: THREE.Material | THREE.Material[],
    x?: number,
    y?: number,
    z?: number,
  ) => THREE.Mesh;
  mat: (color: string, role?: SurfaceRole) => THREE.MeshStandardMaterial;
  batch: (p: THREE.Object3D) => void;
};

export const NEIGHBORHOOD_FAMILIES = [
  'Open courtyard',
  'Garden terraces',
  'Twin towers and skybridge',
  'Chamfered glass wedge',
  'Sawtooth workshops',
  'Oval office tower',
  'Long slab on pilotis',
  'Vertical fin tower',
  'Gabled studio cluster',
  'Vaulted exhibition hall',
  'Cantilevered office',
  'Civic courtyard pavilion',
] as const;

/** Independent massing and structure, rather than variations of the hero office. */
export function createNeighborhoodBuilding(
  parent: THREE.Group,
  w: number,
  d: number,
  height: number,
  family: number,
  seed: number,
  facade: THREE.Material,
  kit: Kit,
) {
  const { box, mesh, mat, batch } = kit;
  const variant = seed % 4;
  const trim = ['#e8e0d1', '#d6d6cb', '#c4b69d', '#adb5b3'][variant];
  const accent = ['#aa8066', '#b8ad94', '#889897', '#c6b69c'][variant];
  const glass = mat(
    ['#809b9e', '#718d99', '#a4b4ad', '#637f88'][variant],
    'glass',
  );
  const roof = mat(['#d2c5ae', '#aeb4b0', '#bfb8aa', '#d6d1c3'][variant]);
  const metal = mat('#667675', 'metal');
  const h = Math.max(5, height);
  parent.name = `${NEIGHBORHOOD_FAMILIES[family]} · ${seed}`;
  parent.userData.architecture = NEIGHBORHOOD_FAMILIES[family];
  box(parent, 0, 0, 0, w + 0.65, 0.16, d + 0.65, '#c8bfae');

  function beam(
    a: number[],
    b: number[],
    thickness = 0.13,
    material: THREE.Material = metal,
  ) {
    const from = new THREE.Vector3(...a),
      to = new THREE.Vector3(...b);
    const part = box(
      parent,
      0,
      0,
      0,
      thickness,
      from.distanceTo(to),
      thickness,
      material,
    );
    part.position.copy(from).add(to).multiplyScalar(0.5);
    part.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      to.sub(from).normalize(),
    );
  }
  function slab(
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    tall: number,
    vertical = false,
  ) {
    box(parent, x, y, z, width, tall, depth, glass);
    const floors = Math.max(1, Math.round(tall / (vertical ? 3.1 : 2.55)));
    for (let f = 0; f <= floors; f++)
      box(
        parent,
        x,
        y + (f * tall) / floors,
        z,
        width + 0.12,
        vertical ? 0.12 : 0.3,
        depth + 0.12,
        facade,
      );
    const spacing = vertical ? 0.95 : 2.2;
    for (let px = -width / 2 + 0.16; px <= width / 2; px += spacing)
      for (const side of [-1, 1])
        box(
          parent,
          x + px,
          y,
          z + side * (depth / 2 + 0.05),
          vertical ? 0.19 : 0.1,
          tall,
          vertical ? 0.42 : 0.1,
          trim,
        );
    for (let pz = -depth / 2 + 0.16; pz <= depth / 2; pz += spacing)
      for (const side of [-1, 1])
        box(
          parent,
          x + side * (width / 2 + 0.05),
          y,
          z + pz,
          vertical ? 0.42 : 0.1,
          tall,
          vertical ? 0.19 : 0.1,
          trim,
        );
    box(parent, x, y + tall + 0.14, z, width + 0.2, 0.22, depth + 0.2, roof);
  }
  function garden(
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
  ) {
    box(parent, x, y, z, width, 0.24, depth, '#a2947b');
    box(parent, x, y + 0.24, z, width - 0.12, 0.24, depth - 0.12, '#597146');
  }
  function pergola(
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
  ) {
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        box(
          parent,
          x + (sx * width) / 2,
          y,
          z + (sz * depth) / 2,
          0.12,
          1.5,
          0.12,
          accent,
        );
    for (let px = -width / 2; px <= width / 2 + 0.01; px += 0.52)
      box(parent, x + px, y + 1.5, z, 0.17, 0.16, depth + 0.35, accent);
  }
  function polygon(
    points: number[][],
    y: number,
    tall: number,
    material: THREE.Material,
  ) {
    const outline = new THREE.Shape(
      points.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    const geo = new THREE.ExtrudeGeometry(outline, {
      depth: tall,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return mesh(parent, geo, material, 0, y, 0);
  }
  function glassPolygon(points: number[][], tall: number, spacing: number) {
    polygon(points, 0.18, tall, glass);
    const floors = Math.max(2, Math.round(tall / 2.7));
    for (let i = 0; i <= floors; i++)
      polygon(
        points,
        0.18 + (i * tall) / floors,
        0.18,
        i === floors ? roof : facade,
      );
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const count = Math.max(
        1,
        Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) / spacing),
      );
      for (let j = 0; j < count; j++) {
        const x = THREE.MathUtils.lerp(a[0], b[0], j / count);
        const z = THREE.MathUtils.lerp(a[1], b[1], j / count);
        box(parent, x, 0.18, z, 0.12, tall, 0.12, trim);
      }
    }
  }
  function pitchedRoof(
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    rise: number,
    sawtooth = false,
  ) {
    // Extrude a real triangular section along the building's length.
    const cross = new THREE.Shape();
    cross.moveTo(-width / 2, 0);
    cross.lineTo(width / 2, 0);
    cross.lineTo(sawtooth ? width / 2 : 0, rise);
    cross.closePath();
    const geo = new THREE.ExtrudeGeometry(cross, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
    });
    mesh(parent, geo, roof, x, y, z - depth / 2);
    if (sawtooth)
      box(
        parent,
        x + width / 2 + 0.018,
        y + 0.2,
        z,
        0.05,
        rise - 0.22,
        depth - 0.35,
        glass,
      );
    else
      for (const side of [-1, 1]) {
        beam(
          [x - width / 2, y, z + (side * depth) / 2],
          [x, y + rise, z + (side * depth) / 2],
          0.13,
        );
        beam(
          [x, y + rise, z + (side * depth) / 2],
          [x + width / 2, y, z + (side * depth) / 2],
          0.13,
        );
      }
  }

  if (family === 0) {
    // A genuinely empty U-shaped court, framed by wings of unequal height.
    slab(0, 0.18, -d * 0.32, w * 0.96, d * 0.32, h * 0.64);
    slab(-w * 0.34, 0.18, d * 0.15, w * 0.28, d * 0.62, h * 0.86, true);
    slab(w * 0.35, 0.18, d * 0.15, w * 0.26, d * 0.62, h * 0.46);
    garden(0, 0.17, d * 0.02, w * 0.3, d * 0.35);
    pergola(w * 0.35, h * 0.46 + 0.58, d * 0.23, w * 0.19, d * 0.27);
  } else if (family === 1) {
    const level = Math.max(2.15, h / 3);
    for (let i = 0; i < 3; i++) {
      const depth = d * (1 - i * 0.24),
        z = -d * i * 0.12;
      slab(0, 0.18 + i * (level + 0.38), z, w * (1 - i * 0.09), depth, level);
      if (i < 2)
        garden(
          0,
          0.58 + (i + 1) * level + i * 0.38,
          z + depth / 2 - 0.75,
          w * 0.7,
          1.05,
        );
    }
    pergola(0, 3 * level + 1.32, -d * 0.26, w * 0.42, d * 0.25);
  } else if (family === 2) {
    const tower = h * 0.94 + 2;
    slab(-w * 0.32, 0.18, -d * 0.08, w * 0.31, d * 0.75, tower, true);
    slab(w * 0.32, 0.18, d * 0.08, w * 0.31, d * 0.75, tower * 0.73);
    slab(0, tower * 0.5, 0, w * 0.44, d * 0.25, 1.6);
    beam(
      [-w * 0.2, tower * 0.5, d * 0.15],
      [w * 0.2, tower * 0.5 + 1.6, d * 0.15],
    );
    beam(
      [w * 0.2, tower * 0.5, d * 0.15],
      [-w * 0.2, tower * 0.5 + 1.6, d * 0.15],
    );
    garden(0, 0.18, d * 0.33, w * 0.22, d * 0.2);
  } else if (family === 3) {
    const points = [
      [-w * 0.48, -d * 0.48],
      [w * 0.13, -d * 0.48],
      [w * 0.48, -d * 0.12],
      [w * 0.48, d * 0.48],
      [-w * 0.2, d * 0.48],
      [-w * 0.48, d * 0.18],
    ];
    glassPolygon(points, h * 0.9, 1.55);
    polygon(
      points.map(([x, z]) => [x * 0.6, z * 0.6]),
      h * 0.9 + 0.4,
      0.38,
      metal,
    );
    box(parent, -w * 0.18, 0.2, d * 0.37, w * 0.42, h * 0.9, 0.5, accent);
  } else if (family === 4) {
    const wall = 2.8 + variant * 0.3;
    box(parent, 0, 0.18, 0, w, wall, d, facade);
    for (let i = 0; i < 3; i++) {
      const x = -w / 3 + (i * w) / 3;
      pitchedRoof(x, wall + 0.18, 0, w / 3, d, 1.45, true);
      box(parent, x, 0.4, d / 2 + 0.02, w * 0.21, 1.95, 0.08, metal);
    }
    box(parent, -w * 0.4, wall + 0.2, -d * 0.35, 0.48, 3.4, 0.48, accent);
  } else if (family === 5) {
    const points = Array.from({ length: 24 }, (_, i) => [
      Math.cos((i * Math.PI) / 12) * w * 0.46,
      Math.sin((i * Math.PI) / 12) * d * 0.46,
    ]);
    glassPolygon(points, h * 1.13, 1.3);
    polygon(
      points.map(([x, z]) => [x * 0.7, z * 0.7]),
      h * 1.13 + 0.45,
      0.4,
      roof,
    );
    box(parent, 0, h * 1.13 + 0.85, 0, w * 0.3, 0.7, d * 0.18, metal);
  } else if (family === 6) {
    const raised = 2.4,
      tall = Math.max(3.4, h * 0.46);
    for (const x of [-w * 0.36, 0, w * 0.36])
      for (const z of [-d * 0.22, d * 0.22])
        box(parent, x, 0.18, z, 0.45, raised, 0.45, facade);
    slab(0, raised, 0, w, d * 0.68, tall);
    box(
      parent,
      -w * 0.35,
      0.18,
      -d * 0.33,
      w * 0.22,
      raised + tall + 0.65,
      d * 0.22,
      accent,
    );
    garden(w * 0.22, 0.18, d * 0.38, w * 0.36, d * 0.15);
    for (let i = 0; i < 5; i++)
      box(
        parent,
        w * 0.32,
        0.18 + i * 0.32,
        -d * 0.28 + i * 0.3,
        w * 0.18,
        0.32,
        0.4,
        trim,
      );
  } else if (family === 7) {
    const tower = h * 1.12 + 1;
    slab(0, 0.18, 0, w * 0.67, d * 0.66, tower, true);
    for (const x of [-w * 0.4, w * 0.4])
      box(parent, x, 0.18, 0, w * 0.12, tower + 0.75, d * 0.84, facade);
    box(parent, 0, tower + 0.36, 0, w * 0.88, 0.42, d * 0.9, trim);
    box(parent, 0, 0.18, d * 0.35, w * 0.54, 1.9, d * 0.25, glass);
  } else if (family === 8) {
    for (let i = 0; i < 2; i++) {
      const x = (i - 0.5) * w * 0.52,
        z = (i - 0.5) * d * 0.13;
      const wall = 2.8 + i * 0.7;
      box(
        parent,
        x,
        0.18,
        z,
        w * 0.42,
        wall,
        d * 0.76,
        i === 0 ? facade : mat(accent),
      );
      box(parent, x, 0.5, z + d * 0.382, w * 0.31, wall - 0.4, 0.055, glass);
      pitchedRoof(x, wall + 0.18, z, w * 0.46, d * 0.79, 1.7);
    }
    box(parent, 0, 0.18, 0, w * 0.14, 2, d * 0.3, glass);
  } else if (family === 9) {
    const wall = 2.8,
      radius = w * 0.46,
      rise = 2.5;
    box(parent, 0, 0.18, 0, w * 0.92, wall, d * 0.88, glass);
    const section = new THREE.Shape();
    section.moveTo(-radius, 0);
    for (let i = 0; i <= 20; i++) {
      const angle = Math.PI - (i * Math.PI) / 20;
      section.lineTo(Math.cos(angle) * radius, Math.sin(angle) * rise);
    }
    section.closePath();
    const canopy = new THREE.ExtrudeGeometry(section, {
      depth: d * 0.9,
      bevelEnabled: false,
      curveSegments: 1,
    });
    mesh(parent, canopy, mat('#a7bab8', 'glass'), 0, wall + 0.18, -d * 0.45);
    for (let rib = 0; rib < 5; rib++) {
      const z = -d * 0.45 + rib * d * 0.225;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 12,
          b = ((i + 1) * Math.PI) / 12;
        beam(
          [Math.cos(a) * radius, wall + 0.18 + Math.sin(a) * rise, z],
          [Math.cos(b) * radius, wall + 0.18 + Math.sin(b) * rise, z],
          0.13,
          mat(trim),
        );
      }
      for (const x of [-radius, radius])
        box(parent, x, 0.18, z, 0.16, wall, 0.16, trim);
    }
  } else if (family === 10) {
    const lower = Math.max(3, h * 0.52);
    slab(-w * 0.22, 0.18, -d * 0.1, w * 0.5, d * 0.78, lower, true);
    slab(
      w * 0.05,
      lower + 0.6,
      d * 0.08,
      w * 0.86,
      d * 0.62,
      Math.max(2.6, h * 0.36),
    );
    beam(
      [w * 0.42, 0.18, d * 0.26],
      [w * 0.26, lower + 0.6, d * 0.26],
      0.3,
      mat(trim),
    );
    beam(
      [w * 0.42, 0.18, -d * 0.15],
      [w * 0.26, lower + 0.6, -d * 0.15],
      0.3,
      mat(trim),
    );
    garden(-w * 0.25, lower + 0.6, -d * 0.32, w * 0.35, d * 0.14);
  } else {
    // Low civic pavilion: a floating roof enclosing a planted, open center.
    const wall = 3.2 + variant * 0.35;
    for (const side of [-1, 1]) {
      slab(side * w * 0.37, 0.18, 0, w * 0.23, d * 0.92, wall, true);
      box(parent, 0, wall + 0.5, side * d * 0.38, w, 0.38, d * 0.24, roof);
      for (const x of [-w * 0.22, w * 0.22])
        box(parent, x, 0.18, side * d * 0.4, 0.18, wall + 0.4, 0.18, trim);
    }
    garden(0, 0.18, 0, w * 0.34, d * 0.34);
    box(parent, 0, 0.18, d * 0.3, w * 0.42, 0.3, 0.6, accent);
  }
  batch(parent);
}
