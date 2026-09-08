import * as THREE from 'three';
import type { createMotion } from './city-life';

type Kit = {
  box: (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string | THREE.Material,
  ) => THREE.Mesh;
  mesh: (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    x?: number,
    y?: number,
    z?: number,
  ) => THREE.Mesh;
  mat: (color: string) => THREE.MeshStandardMaterial;
  batch: (parent: THREE.Object3D) => void;
};

/** Cerro El Plomo 5420: glass slab, white fins and the occupied setback terrace. */
export function createFintocHQ(
  parent: THREE.Group,
  dimensions: { width: number; depth: number; height: number },
  facade: THREE.Material,
  kit: Kit,
  motion: ReturnType<typeof createMotion>,
) {
  const { box, mesh, mat, batch } = kit;
  const w = dimensions.width * 0.82,
    d = dimensions.depth * 0.7,
    h = dimensions.height;
  const terraceY = h * 0.825,
    setback = d * 0.31;
  const front = d / 2,
    crownFront = front - setback;
  const ivory = '#e9eee7',
    frame = '#b9cdc7';
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#456f68',
    roughness: 0.23,
    metalness: 0.22,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
  });
  const panes = ['#4d766f', '#60867d', '#6d8e84', '#3e6663', '#7b9890'].map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.28,
        metalness: 0.24,
        envMapIntensity: 0.9,
      }),
  );
  const balconyGlass = new THREE.MeshPhysicalMaterial({
    color: '#a9d0c3',
    roughness: 0.18,
    metalness: 0.05,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const plinth = new THREE.Group();
  plinth.name = 'Fintoc · entrance plaza';
  parent.add(plinth);
  box(plinth, 0, 0.05, 0, w + 2, 0.2, d + 2, '#cbc9ba');
  box(plinth, 0, 0.25, 0, w - 0.8, 1.5, d - 0.8, '#304e48');
  for (let x = -w / 2; x <= w / 2; x += 2.4)
    box(plinth, x, 0.2, front + 0.55, 1.6, 0.055, 0.65, '#b5bdb4');

  // A full-height rear slab and a shallower, lower projecting front volume.
  const coreDepth = d - setback;
  box(parent, 0, 0.3, -setback / 2, w, h - 0.3, coreDepth, glass);
  box(
    parent,
    -w * 0.07,
    0.3,
    front - setback / 2,
    w * 0.86,
    terraceY - 0.3,
    setback,
    glass,
  );
  const stories = 14,
    step = (h - 0.38) / stories,
    cols = 14;
  for (let floor = 0; floor < stories; floor++) {
    const y = 0.38 + floor * step;
    for (let col = 0; col < cols; col++) {
      const x = -w / 2 + ((col + 0.5) * w) / cols;
      const material =
        panes[(col * 7 + floor * 3 + (floor % 3 === 0 ? 2 : 0)) % panes.length];
      for (const z of [-d / 2 - 0.015, crownFront + 0.018])
        box(parent, x, y, z, w / cols - 0.065, step - 0.07, 0.03, material);
    }
    for (const side of [-1, 1]) {
      for (let bay = 0; bay < 7; bay++)
        box(
          parent,
          side * (w / 2 + 0.018),
          y,
          -d / 2 + ((bay + 0.5) * coreDepth) / 7,
          0.03,
          step - 0.06,
          coreDepth / 7 - 0.05,
          panes[(floor + bay * 3) % 5],
        );
      box(
        parent,
        side * (w / 2 + 0.045),
        y,
        -setback / 2,
        0.065,
        0.05,
        coreDepth + 0.07,
        frame,
      );
    }
    for (const z of [-d / 2 - 0.045, crownFront + 0.045])
      box(parent, 0, y, z, w + 0.08, 0.05, 0.065, frame);
  }
  for (let col = 0; col <= cols; col++)
    for (const z of [-d / 2 - 0.055, crownFront + 0.055])
      box(
        parent,
        -w / 2 + (col * w) / cols,
        0.35,
        z,
        0.06,
        h - 0.3,
        0.08,
        frame,
      );
  for (let bay = 0; bay <= 7; bay++)
    for (const side of [-1, 1])
      box(
        parent,
        side * (w / 2 + 0.055),
        0.35,
        -d / 2 + (bay * coreDepth) / 7,
        0.08,
        h - 0.3,
        0.06,
        frame,
      );

  // The photographed curtain wall stays green; irregular white vertical fins
  // borrow the stronger hierarchy visible in the user's architectural render.
  const faceW = w * 0.86,
    faceX = -w * 0.07;
  for (let floor = 0; floor < 12; floor++) {
    const y = 0.35 + (floor * (terraceY - 0.35)) / 12;
    box(parent, faceX, y, front + 0.04, faceW, 0.055, 0.075, frame);
    for (let col = 0; col < 12; col++) {
      const x = faceX - faceW / 2 + ((col + 0.5) * faceW) / 12;
      box(
        parent,
        x,
        y + 0.065,
        front + 0.018,
        faceW / 12 - 0.065,
        (terraceY - 0.35) / 12 - 0.09,
        0.03,
        panes[(col + floor * 2) % 5],
      );
    }
  }
  for (let col = 0; col <= 12; col++) {
    const x = faceX - faceW / 2 + (col * faceW) / 12;
    box(
      parent,
      x,
      0.35,
      front + 0.13,
      col === 0 || col === 12 ? 0.34 : col % 3 === 0 ? 0.24 : 0.1,
      terraceY - 0.35,
      0.26,
      col % 3 === 0 ? facade : ivory,
    );
    if (col > 0 && col < 12 && col % 3 !== 0) {
      const start = (col % 4) * step * 2 + 0.5;
      box(
        parent,
        x,
        start,
        front + 0.19,
        0.23,
        step * (col % 2 ? 4 : 3),
        0.25,
        ivory,
      );
    }
  }
  for (const side of [-1, 1])
    box(
      parent,
      faceX + (side * faceW) / 2,
      0.35,
      front - setback / 2,
      0.22,
      terraceY - 0.35,
      setback + 0.2,
      facade,
    );
  box(
    parent,
    faceX,
    terraceY - 0.22,
    front + 0.12,
    faceW + 0.3,
    0.3,
    0.32,
    ivory,
  );
  // Recessed street entry and the fine circular entrance canopy.
  box(plinth, 0, 0.3, front + 0.17, 2.8, 2.15, 0.08, '#304b47');
  for (const x of [-1.45, 0, 1.45])
    box(plinth, x, 0.3, front + 0.25, 0.075, 2.15, 0.1, ivory);
  const canopy = mesh(
    plinth,
    new THREE.CylinderGeometry(1.65, 1.65, 0.1, 30, 1, false, 0, Math.PI),
    mat('#c8d8d0'),
    0,
    2.65,
    front + 0.1,
  );
  canopy.rotation.y = Math.PI / 2;
  batch(plinth);

  const terrace = new THREE.Group();
  terrace.name = 'Fintoc · setback rooftop terrace';
  terrace.position.y = terraceY;
  parent.add(terrace);
  box(
    terrace,
    faceX,
    0,
    front - setback / 2,
    faceW + 0.3,
    0.18,
    setback + 0.2,
    '#d6d0bb',
  );
  for (let x = faceX - faceW / 2 + 0.15; x < faceX + faceW / 2; x += 0.42)
    box(
      terrace,
      x,
      0.185,
      front - setback / 2,
      0.36,
      0.02,
      setback - 0.16,
      '#c8b99a',
    );
  box(
    terrace,
    faceX,
    0.2,
    front + 0.15,
    faceW + 0.25,
    0.95,
    0.05,
    balconyGlass,
  );
  box(terrace, faceX, 1.12, front + 0.16, faceW + 0.4, 0.06, 0.09, '#b2bdb3');
  for (let x = faceX - faceW / 2; x <= faceX + faceW / 2 + 0.1; x += 1.65)
    box(terrace, x, 0.18, front + 0.16, 0.045, 1, 0.06, ivory);
  for (const x of [faceX - faceW / 2, faceX + faceW / 2]) {
    box(
      terrace,
      x,
      0.2,
      front - setback / 2,
      0.05,
      0.95,
      setback,
      balconyGlass,
    );
    box(
      terrace,
      x,
      1.12,
      front - setback / 2,
      0.09,
      0.06,
      setback + 0.1,
      '#b2bdb3',
    );
  }
  function planter(x: number, z: number) {
    box(terrace, x, 0.19, z, 1.5, 0.42, 0.65, '#797e65');
    for (let i = 0; i < 4; i++)
      mesh(
        terrace,
        new THREE.IcosahedronGeometry(0.32, 1),
        mat(['#547443', '#718851'][i % 2]),
        x - 0.5 + i * 0.34,
        0.81,
        z,
      );
  }
  planter(-4.8, crownFront + 0.5);
  planter(-1.8, crownFront + 0.5);
  planter(4.7, crownFront + 0.5);
  for (const x of [1.2, 4.1]) {
    const z = front - 1.3;
    mesh(
      terrace,
      new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8),
      mat('#aeb5a8'),
      x,
      1.25,
      z,
    );
    mesh(
      terrace,
      new THREE.ConeGeometry(1.25, 0.48, 12),
      mat('#e7e0d8'),
      x,
      2.45,
      z,
    );
    mesh(
      terrace,
      new THREE.CylinderGeometry(0.65, 0.65, 0.09, 20),
      mat('#ded9c9'),
      x,
      1.04,
      z,
    );
    for (const dx of [-0.95, 0.95]) {
      box(terrace, x + dx, 0.2, z, 0.5, 0.42, 0.5, ivory);
      box(terrace, x + dx, 0.57, z - 0.22, 0.5, 0.5, 0.07, ivory);
    }
  }
  box(terrace, -3.5, 0.2, front - 0.9, 2.4, 0.88, 0.63, '#69726a');
  box(terrace, -3.5, 1.08, front - 0.9, 2.65, 0.12, 0.83, ivory);
  for (let i = 0; i < 5; i++)
    mesh(
      terrace,
      new THREE.CylinderGeometry(0.05, 0.065, 0.17, 8),
      mat(i % 2 ? '#cddce1' : '#cd983c'),
      -4.35 + i * 0.4,
      1.28,
      front - 0.9,
    );
  batch(terrace);

  const party = new THREE.Group();
  party.name = 'Fintoc · rooftop celebration';
  party.position.y = terraceY + 0.21;
  parent.add(party);
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Group();
    p.name = `Celebrating teammate ${i + 1}`;
    party.add(p);
    const x = -5.7 + (i % 6) * 1.2,
      z = front - 0.4 - (i > 5 ? 1.1 : 0),
      shirt = ['#f3dfc2', '#3e8482', '#576b96', '#dba75d', '#dadbd2'][i % 5];
    p.position.set(x, 0, z);
    p.rotation.y = ((i % 3) - 1) * 0.6;
    box(p, -0.1, 0, 0, 0.13, 0.45, 0.18, '#404d4a');
    box(p, 0.1, 0, 0, 0.13, 0.45, 0.18, '#404d4a');
    box(p, 0, 0.43, 0, 0.4, 0.48, 0.25, shirt);
    mesh(p, new THREE.SphereGeometry(0.17, 8, 6), mat('#cda986'), 0, 1.1, 0);
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.name = `Raised arm ${side}`;
      arm.position.set(side * 0.24, 0.82, 0);
      p.add(arm);
      box(arm, 0, -0.4, 0, 0.12, 0.42, 0.13, shirt);
      mesh(
        arm,
        new THREE.SphereGeometry(0.07, 6, 4),
        mat('#cda986'),
        0,
        -0.47,
        0,
      );
      if (i % 3 === 0 && side === 1)
        mesh(
          arm,
          new THREE.CylinderGeometry(0.045, 0.055, 0.14, 8),
          mat('#e5cd91'),
          0,
          -0.55,
          0,
        );
      motion.track(arm, (t) => {
        arm.rotation.z = side * (2.2 + Math.sin(t * 3.8 + i * 1.7) * 0.38);
        arm.rotation.x = Math.sin(t * 2.3 + i) * 0.18;
      });
    }
    motion.track(p, (t) => {
      p.position.y =
        Math.max(0, Math.sin(t * 4.2 + i * 1.1)) * (i % 3 === 0 ? 0.12 : 0.035);
      p.rotation.y = ((i % 3) - 1) * 0.6 + Math.sin(t * 2.1 + i) * 0.14;
    });
    batch(p);
  }

  const roof = new THREE.Group();
  roof.name = 'Fintoc · upper roof and equipment';
  roof.position.y = h;
  parent.add(roof);
  box(roof, 0, 0, -setback / 2, w + 0.3, 0.18, coreDepth + 0.3, ivory);
  for (const z of [-d / 2, crownFront])
    box(roof, 0, 0.18, z, w + 0.3, 0.35, 0.15, '#8ca09a');
  for (const x of [-w / 2, w / 2])
    box(roof, x, 0.18, -setback / 2, 0.15, 0.35, coreDepth, '#8ca09a');
  const path = new THREE.Shape(),
    left = -w / 2 + 0.5,
    right = w / 2 - 0.5,
    back = -d / 2 + 0.5,
    near = crownFront - 0.5,
    r = 0.5;
  path.moveTo(left + r, back);
  path.lineTo(right - r, back);
  path.quadraticCurveTo(right, back, right, back + r);
  path.lineTo(right, near - r);
  path.quadraticCurveTo(right, near, right - r, near);
  path.lineTo(left + r, near);
  path.quadraticCurveTo(left, near, left, near - r);
  path.lineTo(left, back + r);
  path.quadraticCurveTo(left, back, left + r, back);
  const curve = new THREE.CatmullRomCurve3(
    path.getPoints(12).map((v) => new THREE.Vector3(v.x, 0.24, v.y)),
    true,
  );
  mesh(roof, new THREE.TubeGeometry(curve, 80, 0.03, 4, true), mat('#77867e'));
  box(roof, -w * 0.28, 0.2, -d * 0.22, 2.5, 0.55, 1.3, '#a4aaa0');
  box(roof, -w * 0.1, 0.23, -d * 0.22, 3.2, 0.22, 0.48, '#b6bcb0');
  for (const x of [-w * 0.3, 0, w * 0.3])
    box(roof, x, 0.18, crownFront - 0.15, 0.12, 0.72, 0.18, '#42534b');
  for (let i = 0; i < 3; i++)
    mesh(
      roof,
      new THREE.CylinderGeometry(0.28, 0.28, 0.13, 12),
      mat('#6d7971'),
      -w * 0.33 + i * 0.62,
      0.81,
      -d * 0.22,
    );
  batch(roof);
  return {
    roof: { y: h + 0.85, z: crownFront - 0.1 },
    facade: { y: terraceY + 1.25, z: crownFront + 0.1 },
    logoWidth: 19,
  };
}
