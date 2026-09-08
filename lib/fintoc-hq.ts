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
  const crownFront = d / 2 - setback;
  // The aerial references show a triangular wing: tip at left, parasols at right.
  const tipX = -w / 2,
    wideX = w * 0.36;
  const terraceWidth = wideX - tipX,
    terraceDepth = terraceWidth * 0.27;
  const frontAt = (x: number) =>
    crownFront + terraceDepth * ((x - tipX) / terraceWidth);
  const tip = new THREE.Vector2(tipX, crownFront);
  const innerCorner = new THREE.Vector2(wideX, crownFront);
  const outerCorner = new THREE.Vector2(wideX, crownFront + terraceDepth);
  const frontAngle = -Math.atan2(terraceDepth, terraceWidth);
  function wedge(depth: number) {
    const shape = new THREE.Shape();
    shape.moveTo(tip.x, -tip.y);
    shape.lineTo(innerCorner.x, -innerCorner.y);
    shape.lineTo(outerCorner.x, -outerCorner.y);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }
  function edgeBox(
    target: THREE.Object3D,
    a: THREE.Vector2,
    b: THREE.Vector2,
    along: number,
    y: number,
    width: number,
    height: number,
    thickness: number,
    material: string | THREE.Material,
    outward = 0,
  ) {
    const dx = b.x - a.x,
      dz = b.y - a.y,
      length = Math.hypot(dx, dz);
    const item = box(
      target,
      a.x + dx * along - (dz / length) * outward,
      y,
      a.y + dz * along + (dx / length) * outward,
      width,
      height,
      thickness,
      material,
    );
    item.rotation.y = -Math.atan2(dz, dx);
    return item;
  }
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
  for (let x = -w / 2; x <= w / 2; x += 2.4)
    box(plinth, x, 0.2, frontAt(x) + 0.55, 1.6, 0.055, 0.65, '#b5bdb4');

  // A full-height rear slab and a shallower, lower projecting front volume.
  const coreDepth = d - setback;
  box(parent, 0, 0.3, -setback / 2, w, h - 0.3, coreDepth, glass);
  mesh(parent, wedge(terraceY - 0.3), glass, 0, 0.3, 0).name =
    'Fintoc · triangular lower wing';
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

  // Both exposed walls follow the triangular footprint, including the white fins.
  for (const [a, b] of [
    [tip, outerCorner],
    [outerCorner, innerCorner],
  ]) {
    const length = a.distanceTo(b),
      bays = Math.max(3, Math.round(length / 1.05));
    for (let floor = 0; floor < 12; floor++) {
      const y = 0.35 + (floor * (terraceY - 0.35)) / 12;
      edgeBox(parent, a, b, 0.5, y, length, 0.055, 0.075, frame, 0.04);
      for (let bay = 0; bay < bays; bay++)
        edgeBox(
          parent,
          a,
          b,
          (bay + 0.5) / bays,
          y + 0.065,
          length / bays - 0.065,
          (terraceY - 0.35) / 12 - 0.09,
          0.03,
          panes[(bay + floor * 2) % 5],
          0.02,
        );
    }
    for (let bay = 0; bay <= bays; bay++) {
      edgeBox(
        parent,
        a,
        b,
        bay / bays,
        0.35,
        bay === 0 || bay === bays ? 0.24 : bay % 3 === 0 ? 0.2 : 0.1,
        terraceY - 0.35,
        0.2,
        bay % 3 === 0 ? facade : ivory,
        0.09,
      );
      if (bay > 0 && bay < bays && bay % 3 !== 0)
        edgeBox(
          parent,
          a,
          b,
          bay / bays,
          (bay % 4) * step * 2 + 0.5,
          0.2,
          step * (bay % 2 ? 4 : 3),
          0.22,
          ivory,
          0.13,
        );
    }
    edgeBox(
      parent,
      a,
      b,
      0.5,
      terraceY - 0.2,
      length + 0.1,
      0.22,
      0.22,
      ivory,
      0.07,
    );
  }
  // The entrance sits on the same diagonal as the lower facade.
  const entry = new THREE.Group();
  entry.position.set(0, 0, frontAt(0));
  entry.rotation.y = frontAngle;
  plinth.add(entry);
  box(entry, 0, 0.3, 0.17, 2.8, 2.15, 0.08, '#304b47');
  for (const x of [-1.45, 0, 1.45])
    box(entry, x, 0.3, 0.25, 0.075, 2.15, 0.1, ivory);
  const canopy = mesh(
    entry,
    new THREE.CylinderGeometry(1.65, 1.65, 0.1, 30, 1, false, 0, Math.PI),
    mat('#c8d8d0'),
    0,
    2.65,
    0.1,
  );
  canopy.rotation.y = Math.PI / 2;
  batch(entry);
  batch(plinth);

  const terrace = new THREE.Group();
  terrace.name = 'Fintoc · triangular rooftop terrace';
  terrace.position.y = terraceY;
  parent.add(terrace);
  mesh(terrace, wedge(0.18), mat('#d6d0bb'));
  // Shorter boards toward the pointed end, all clipped to the same diagonal.
  for (let x = tipX + 0.6; x < wideX - 0.25; x += 0.42) {
    const boardDepth = frontAt(x - 0.18) - crownFront - 0.2;
    if (boardDepth <= 0) continue;
    box(
      terrace,
      x,
      0.185,
      crownFront + 0.1 + boardDepth / 2,
      0.36,
      0.02,
      boardDepth,
      '#c8b99a',
    );
  }
  for (const [a, b] of [
    [tip, outerCorner],
    [outerCorner, innerCorner],
  ]) {
    const length = a.distanceTo(b),
      posts = Math.ceil(length / 1.45);
    edgeBox(terrace, a, b, 0.5, 0.2, length, 0.95, 0.05, balconyGlass, 0.04);
    edgeBox(
      terrace,
      a,
      b,
      0.5,
      1.12,
      length + 0.05,
      0.06,
      0.09,
      '#b2bdb3',
      0.04,
    );
    for (let post = 0; post <= posts; post++)
      edgeBox(terrace, a, b, post / posts, 0.18, 0.045, 1, 0.06, ivory, 0.04);
  }
  function planter(x: number, z: number) {
    box(terrace, x, 0.19, z, 1.3, 0.42, 0.42, '#797e65');
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
  planter(-4.8, crownFront + 0.28);
  planter(-0.2, crownFront + 0.28);
  planter(4.5, crownFront + 2.75);
  for (const [x, depth] of [
    [1.7, 1.22],
    [4.15, 1.55],
  ]) {
    const z = crownFront + depth;
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
      new THREE.ConeGeometry(1.05, 0.42, 12),
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
    for (const dx of [-0.82, 0.82]) {
      box(terrace, x + dx, 0.2, z, 0.5, 0.42, 0.5, ivory);
      box(terrace, x + dx, 0.57, z - 0.22, 0.5, 0.5, 0.07, ivory);
    }
  }
  box(terrace, -2.6, 0.2, crownFront + 0.4, 1.8, 0.88, 0.43, '#69726a');
  box(terrace, -2.6, 1.08, crownFront + 0.4, 1.95, 0.12, 0.53, ivory);
  for (let i = 0; i < 5; i++)
    mesh(
      terrace,
      new THREE.CylinderGeometry(0.05, 0.065, 0.17, 8),
      mat(i % 2 ? '#cddce1' : '#cd983c'),
      -3.3 + i * 0.35,
      1.28,
      crownFront + 0.4,
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
    const x = i < 6 ? -3.9 + i : 2.1 + (i - 6) * 0.85,
      z = i < 6 ? frontAt(x) - 0.33 : crownFront + 0.35,
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
        arm.rotation.z = side * (2.2 + Math.sin(t * 11.4 + i * 1.7) * 0.38);
        arm.rotation.x = Math.sin(t * 6.9 + i) * 0.18;
      });
    }
    motion.track(p, (t) => {
      p.position.y =
        Math.max(0, Math.sin(t * 12.6 + i * 1.1)) *
        (i % 3 === 0 ? 0.12 : 0.035);
      p.rotation.y = ((i % 3) - 1) * 0.6 + Math.sin(t * 6.3 + i) * 0.14;
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
    logoWidth: 19,
  };
}
