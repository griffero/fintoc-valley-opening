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
  person: (
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    i: number,
  ) => void;
};
export const OPENING_CAMPUSES = [
  { x: -22, z: 180.5, w: 42, d: 21, name: 'Folded research campus' },
  { x: 23.5, z: 180.5, w: 33, d: 21, name: 'Solar innovation campus' },
  { x: 61, z: 148, w: 22, d: 22, name: 'Courtyard laboratories' },
];

/** Large connected foreground complexes, based on the agency's campus compositions. */
export function createOpeningCampuses(world: THREE.Group, kit: Kit) {
  const { box, mesh, mat, batch, person } = kit;
  const glass = mat('#6f8991', 'glass'),
    frame = mat('#d8d0c3');
  const shadowGlass = mat('#53686f', 'glass'),
    stone = mat('#b5afa4');
  const roof = mat('#e4ded3'),
    darkRoof = mat('#8e938f');
  function polygon(
    p: THREE.Group,
    points: number[][],
    y: number,
    h: number,
    material: THREE.Material,
  ) {
    const shape = new THREE.Shape(
      points.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    mesh(p, geometry, material, 0, y, 0);
  }
  function wing(
    p: THREE.Group,
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    vertical = false,
  ) {
    box(p, x, 0.2, z, w, h, d, vertical ? stone : glass);
    if (vertical) {
      for (let ix = -w / 2 + 0.7; ix < w / 2 - 0.2; ix += 1.7)
        for (let y = 0.85; y < h - 1; y += 2.6)
          for (const side of [-1, 1])
            box(
              p,
              x + ix,
              y,
              z + side * (d / 2 + 0.025),
              0.9,
              1.85,
              0.06,
              shadowGlass,
            );
      for (let iz = -d / 2 + 0.7; iz < d / 2 - 0.2; iz += 1.7)
        for (let y = 0.85; y < h - 1; y += 2.6)
          for (const side of [-1, 1])
            box(
              p,
              x + side * (w / 2 + 0.025),
              y,
              z + iz,
              0.06,
              1.85,
              0.9,
              shadowGlass,
            );
    } else {
      for (let y = 0.3; y < h; y += 2.5)
        box(p, x, y, z, w + 0.15, 0.38, d + 0.15, frame);
      for (let ix = -w / 2 + 0.2; ix < w / 2; ix += 2.8)
        for (const side of [-1, 1])
          box(p, x + ix, 0.2, z + (side * d) / 2, 0.13, h, 0.14, frame);
    }
    box(p, x, h + 0.2, z, w + 0.3, 0.38, d + 0.3, roof);
    box(p, x, h + 0.58, z, w - 0.65, 0.12, d - 0.65, darkRoof);
  }
  function garden(p: THREE.Group, x: number, z: number, w: number, d: number) {
    box(p, x, 0.21, z, w, 0.22, d, '#a29b88');
    box(p, x, 0.43, z, w - 0.18, 0.18, d - 0.18, '#648448');
    for (let i = 0; i < Math.max(1, Math.floor(w / 3)); i++) {
      const px = x - w / 2 + 1.5 + i * 3;
      box(p, px, 0.55, z, 0.13, 1.1, 0.13, '#827057');
      const crown = mesh(
        p,
        new THREE.IcosahedronGeometry(0.85, 1),
        mat('#5b7a40'),
        px,
        2,
        z,
      );
      crown.scale.y = 0.8;
    }
  }
  function solar(
    p: THREE.Group,
    x: number,
    y: number,
    z: number,
    cols: number,
    rows: number,
  ) {
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        box(
          p,
          x + i * 1.8,
          y,
          z + j * 2.1,
          1.65,
          0.13,
          1.9,
          mat('#3f5865', 'glass'),
        );
        for (let k = 1; k < 4; k++)
          box(
            p,
            x + i * 1.8,
            y + 0.14,
            z + j * 2.1 - 0.95 + k * 0.475,
            1.6,
            0.015,
            0.018,
            '#b8c7c6',
          );
      }
  }
  function plant(
    p: THREE.Group,
    x: number,
    y: number,
    z: number,
    rows: number,
  ) {
    for (let i = 0; i < rows; i++) {
      box(p, x + i * 2, y, z, 1.6, 0.7, 2, '#9ca19d');
      for (const dz of [-0.5, 0.5])
        mesh(
          p,
          new THREE.CylinderGeometry(0.43, 0.43, 0.12, 12),
          mat('#59615f'),
          x + i * 2,
          y + 0.76,
          z + dz,
        );
    }
  }
  function parked(p: THREE.Group, x: number, z: number, i: number, angle = 0) {
    const car = new THREE.Group();
    car.position.set(x, 0.23, z);
    car.rotation.y = angle;
    p.add(car);
    const color = ['#c9d4d0', '#b45240', '#f0dd84', '#528b8b', '#c9c5b7'][
      i % 5
    ];
    box(car, 0, 0.2, 0, 1.18, 0.5, 2.3, color);
    box(car, 0, 0.7, -0.1, 1.06, 0.42, 1.12, mat('#607f88', 'glass'));
    for (const dx of [-0.6, 0.6])
      for (const dz of [-0.72, 0.72])
        box(car, dx, 0.1, dz, 0.18, 0.35, 0.4, '#323737');
    batch(car);
  }
  function parking(p: THREE.Group, x: number, z: number, count: number) {
    box(
      p,
      x + ((count - 1) * 2.2) / 2,
      0.2,
      z,
      count * 2.2 + 0.7,
      0.045,
      4.3,
      '#777970',
    );
    for (let i = 0; i <= count; i++)
      box(p, x - 1.05 + i * 2.2, 0.25, z, 0.045, 0.015, 3.7, '#dfdbcd');
    for (let i = 0; i < count; i++)
      if (i % 5 !== 3) parked(p, x + i * 2.2, z, i);
  }
  function internalDrive(p: THREE.Group, points: number[][], width: number) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const road = box(
        p,
        (a[0] + b[0]) / 2,
        0.185,
        (a[1] + b[1]) / 2,
        width,
        0.04,
        Math.hypot(dx, dz) + 0.08,
        '#74766e',
      );
      road.rotation.y = Math.atan2(dx, dz);
    }
  }
  const groups = OPENING_CAMPUSES.map((site) => {
    const p = new THREE.Group();
    p.name = site.name;
    p.position.set(site.x, 0, site.z);
    world.add(p);
    p.userData.architecture = 'Connected opening campus';
    box(p, 0, 0.08, 0, site.w, 0.1, site.d, '#b9b4a7');
    return p;
  });
  // Long folded wings occupy the foreground instead of isolated garden plots.
  const folded = groups[0];
  const footprint = [
    [-20, -9],
    [20, -9],
    [20, 8],
    [11, 5],
    [7, -1],
    [-7, -1],
    [-13, 8],
    [-20, 5],
  ];
  polygon(folded, footprint, 0.2, 6.2, glass);
  for (const y of [0.25, 2.35, 4.45, 6.5])
    polygon(folded, footprint, y, 0.32, frame);
  for (let i = 0; i < footprint.length; i++) {
    const a = footprint[i],
      b = footprint[(i + 1) % footprint.length];
    const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 2.6);
    for (let j = 0; j < n; j++)
      box(
        folded,
        a[0] + ((b[0] - a[0]) * j) / n,
        0.2,
        a[1] + ((b[1] - a[1]) * j) / n,
        0.18,
        6.3,
        0.18,
        stone,
      );
  }
  wing(folded, -16, -4, 7, 8, 8.3, true);
  plant(folded, -6, 6.9, -5, 6);
  internalDrive(
    folded,
    [
      [-9, 9],
      [-8, 6],
      [-4, 3],
      [3, 3],
      [9, 6],
      [11, 9],
    ],
    2.5,
  );
  garden(folded, 0, 6.7, 8.5, 2.1);
  parking(folded, -4, 0.5, 4);
  for (let i = 0; i < 10; i++) person(folded, -10 + i * 2, 0.2, 9.1, i);
  batch(folded);

  const solarCampus = groups[1];
  wing(solarCampus, -11, -0.5, 8, 17, 8.2, true);
  wing(solarCampus, 3, -5.2, 19.5, 8.3, 5.9);
  wing(solarCampus, 5.2, 4.2, 17.5, 3.6, 4.3);
  box(solarCampus, 6, 0.3, 1.3, 2.4, 2.7, 5.5, glass);
  box(solarCampus, 6, 3, 1.3, 2.7, 0.23, 5.5, roof);
  solar(solarCampus, -4.6, 6.7, -8, 9, 3);
  solar(solarCampus, -1.5, 5.1, 3.1, 8, 2);
  plant(solarCampus, -12.7, 8.95, -5, 2);
  garden(solarCampus, -1.5, 0.4, 4.8, 2.3);
  parking(solarCampus, -3.5, 8.2, 5);
  internalDrive(
    solarCampus,
    [
      [15.1, 9.4],
      [15.1, -0.1],
      [10.8, -0.1],
    ],
    2,
  );
  for (let i = 0; i < 8; i++) person(solarCampus, -5.4 + i * 1.4, 0.25, 1.8, i);
  batch(solarCampus);

  const lab = groups[2];
  wing(lab, -7, -0.8, 6.5, 17.7, 10.3, true);
  wing(lab, 2.8, -6.5, 12.8, 6.3, 7.3);
  wing(lab, 7.3, 3.8, 5, 11.4, 5.5);
  box(lab, 0, 4.5, 4, 9.7, 2, 2.6, glass);
  box(lab, 0, 6.5, 4, 10, 0.27, 2.8, roof);
  garden(lab, 0, -0.3, 4.8, 3.7);
  parking(lab, -2.5, 8.6, 3);
  solar(lab, -2.1, 8.1, -8.5, 5, 2);
  plant(lab, -8.5, 11, -4, 2);
  for (let i = 0; i < 5; i++) person(lab, -2.7 + i * 1.1, 0.25, 4.9, i);
  batch(lab);
  return OPENING_CAMPUSES;
}
