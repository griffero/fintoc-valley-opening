import * as THREE from 'three';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';

export const ease = (a: number, b: number, t: number) => {
  const p = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return p * p * (3 - 2 * p);
};

/** The same deterministic transforms drive playback, seeking and the GLB clip. */
export function createMotion() {
  const actors: { object: THREE.Object3D; update: (t: number) => void }[] = [];
  return {
    track(object: THREE.Object3D, update: (t: number) => void) {
      const existing = actors.find((a) => a.object === object);
      if (existing) {
        const before = existing.update;
        existing.update = (t) => {
          before(t);
          update(t);
        };
      } else actors.push({ object, update });
    },
    update(t: number) {
      actors.forEach((a) => a.update(t));
    },
    bake(samples: number[]) {
      const tracks: THREE.KeyframeTrack[] = [];
      for (const { object, update } of actors) {
        const original = {
          p: object.position.clone(),
          q: object.quaternion.clone(),
          s: object.scale.clone(),
        };
        const p: number[] = [],
          q: number[] = [],
          s: number[] = [];
        for (const t of samples) {
          update(t);
          p.push(...object.position.toArray());
          q.push(...object.quaternion.toArray());
          s.push(...object.scale.toArray());
        }
        tracks.push(
          new THREE.VectorKeyframeTrack(object.uuid + '.position', samples, p),
          new THREE.QuaternionKeyframeTrack(
            object.uuid + '.quaternion',
            samples,
            q,
          ),
          new THREE.VectorKeyframeTrack(object.uuid + '.scale', samples, s),
        );
        object.position.copy(original.p);
        object.quaternion.copy(original.q);
        object.scale.copy(original.s);
      }
      return tracks;
    },
  };
}

type Kit = {
  mat: (color: string) => THREE.MeshStandardMaterial;
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
  batch: (p: THREE.Object3D) => void;
  person: (
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    i: number,
  ) => void;
  sculpture: (
    asset: string,
    width: number,
    depth: number,
    color?: string | THREE.Material,
  ) => THREE.Group;
  text: (
    word: string,
    size: number,
    depth: number,
    color: string,
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ) => THREE.Mesh;
};

/** Miniature set pieces observed in yU+co's opening, rebuilt as editable geometry. */
export function createCityLife(
  world: THREE.Group,
  kit: Kit,
  motion: ReturnType<typeof createMotion>,
) {
  const { mat, box, mesh, batch, person, sculpture } = kit;
  const reserved: { x: number; z: number; w: number; d: number }[] = [];
  const ivory = '#e7decd',
    glass = '#688e96',
    steel = '#3e4b49',
    yellow = '#eabd32';
  const set = new THREE.Group();
  set.name = 'Opening district · animated miniatures';
  world.add(set);
  function group(parent: THREE.Object3D, name: string, x = 0, y = 0, z = 0) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  function reserve(x: number, z: number, w: number, d: number) {
    reserved.push({ x, z, w, d });
  }
  function beam(
    p: THREE.Object3D,
    a: number[],
    b: number[],
    r: number,
    c: string,
  ) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(start);
    const m = mesh(
      p,
      new THREE.CylinderGeometry(r, r, delta.length(), 5),
      mat(c),
    );
    m.position.copy(start.add(end).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return m;
  }
  function slab(
    p: THREE.Object3D,
    shape: THREE.Shape,
    y: number,
    h: number,
    c: string,
  ) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 20,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y, 0);
    return mesh(p, geo, mat(c));
  }
  function tank(
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
  ) {
    mesh(
      p,
      new THREE.CylinderGeometry(r, r, h, 32),
      mat('#c0c3b8'),
      x,
      y + h / 2,
      z,
    );
    mesh(
      p,
      new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.18, 32),
      mat(ivory),
      x,
      y + h,
      z,
    );
  }
  function solar(p: THREE.Object3D, x: number, y: number, z: number, rows = 3) {
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < 4; j++) {
        box(p, x + i * 1.5, y, z + j * 1.8, 1.4, 0.11, 1.65, '#32566d');
        for (let n = 1; n < 3; n++)
          box(
            p,
            x + i * 1.5,
            y + 0.12,
            z + j * 1.8 - 0.8 + n * 0.54,
            1.4,
            0.012,
            0.025,
            '#a0b2ba',
          );
      }
  }
  function parasol(
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    c: string,
  ) {
    beam(p, [x, y, z], [x, y + 2, z], 0.045, ivory);
    mesh(p, new THREE.ConeGeometry(1.35, 0.65, 8), mat(c), x, y + 2, z);
    box(p, x, y + 0.7, z, 1.5, 0.12, 1.5, ivory);
    for (const dx of [-1.2, 1.2])
      box(p, x + dx, y + 0.35, z, 0.6, 0.45, 0.65, '#b9b3a5');
  }

  // Curved ribbon floors, deep glass setbacks and a swooping steel/glass canopy.
  reserve(-26, 88, 32, 21);
  const wave = group(set, 'Ribbon campus · curved terraces', -26, 0, 88);
  const ribbon = new THREE.Shape();
  ribbon.moveTo(-15, -6);
  ribbon.bezierCurveTo(-14, -12, -7, -10, -2, -6);
  ribbon.bezierCurveTo(5, 0, 11, -11, 15, -5);
  ribbon.bezierCurveTo(19, 2, 9, 10, 2, 8);
  ribbon.bezierCurveTo(-6, 5, -16, 3, -15, -6);
  const contour = ribbon.getSpacedPoints(64);
  for (let floor = 0; floor < 4; floor++) {
    const y = 0.4 + floor * 2.8;
    slab(wave, ribbon, y, 0.48, ivory);
    const gl = slab(wave, ribbon, y + 0.48, 2.3, glass);
    gl.scale.set(0.91, 1, 0.91);
    for (let i = 0; i < contour.length - 1; i += 2) {
      const p = contour[i];
      box(
        wave,
        p.x * 0.923,
        y + 0.45,
        -p.y * 0.923,
        0.105,
        2.4,
        0.105,
        '#b9c1b9',
      );
    }
  }
  slab(wave, ribbon, 11.6, 0.35, ivory);
  // A pitched, bowed atrium is distinct from a rectangular office roof.
  const canopy = group(wave, 'Sweeping glass atrium');
  const verts: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = -13 + i * 1.04,
      ridge = 12.6 + Math.sin((i / 24) * Math.PI) * 6.2;
    verts.push(x, 12.2, -4, x, ridge, 1.6, x, 12.2, 6);
    if (i < 24)
      for (let j = 0; j < 2; j++) {
        const a = i * 3 + j;
        indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      }
    if (i % 2 === 0) {
      beam(canopy, [x, 12.2, -4], [x, ridge, 1.6], 0.055, ivory);
      beam(canopy, [x, ridge, 1.6], [x, 12.2, 6], 0.055, ivory);
    }
  }
  const canopyGeo = new THREE.BufferGeometry();
  canopyGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(verts, 3),
  );
  canopyGeo.setIndex(indices);
  canopyGeo.computeVertexNormals();
  mesh(
    canopy,
    canopyGeo,
    new THREE.MeshStandardMaterial({
      color: '#afcfd0',
      roughness: 0.27,
      metalness: 0.25,
      transparent: true,
      opacity: 0.54,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  for (let i = 0; i < 10; i++)
    person(wave, -10 + i * 1.8, 12, -6.1 + (i % 2) * 0.8, i);
  parasol(wave, -7, 12, -5, '#e4bd30');
  // Android silhouette is modeled from its elementary robot forms.
  const android = group(wave, 'Android roof sculpture', 6, 8, 8.8);
  mesh(
    android,
    new THREE.SphereGeometry(1.7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mat('#9ecb25'),
    0,
    3.4,
    0,
  );
  box(android, 0, 0.7, 0, 3.4, 2.55, 0.9, '#9ecb25');
  for (const s of [-1, 1]) {
    box(android, s * 1.1, 0, 0, 0.58, 1.3, 0.7, '#9ecb25');
    box(android, s * 2.1, 1, 0, 0.55, 2.4, 0.7, '#9ecb25');
    beam(android, [s * 0.85, 4.45, 0], [s * 1.35, 5.3, 0], 0.08, '#9ecb25');
    mesh(
      android,
      new THREE.SphereGeometry(0.13, 8, 6),
      mat(ivory),
      s * 0.72,
      4.1,
      1.44,
    );
  }
  batch(android);
  batch(canopy);
  batch(wave);

  // Stepped office, large oval roof emblem, pools and satellite hardware.
  reserve(5, 148, 28, 23);
  const stepped = group(set, 'Stepped technology campus', 5, 0, 148);
  for (let floor = 0; floor < 5; floor++) {
    const w = 28 - floor * 3,
      d = 22 - floor * 2.5,
      y = floor * 2.5;
    box(stepped, 0, y, 0, w, 2.2, d, ivory);
    for (const s of [-1, 1]) {
      box(stepped, 0, y + 0.7, s * (d / 2 + 0.02), w - 0.3, 1.05, 0.07, glass);
      box(stepped, s * (w / 2 + 0.02), y + 0.7, 0, 0.07, 1.05, d - 0.3, glass);
    }
    box(stepped, 0, y + 2.2, 0, w + 0.3, 0.3, d + 0.3, ivory);
  }
  const chip = sculpture('intel-2006-2020', 11, 0.15, '#28a7b7');
  chip.position.set(0, 12.7, 3.3);
  chip.rotation.x = -Math.PI / 2;
  stepped.add(chip);
  solar(stepped, -11, 5.3, 6, 2);
  tank(stepped, 9, 5.1, -6, 1.7, 1.5);
  batch(stepped);

  reserve(-64, 117, 23, 23);
  const auction = group(set, 'Auction campus · solar roofs', -64, 0, 117);
  box(auction, 0, 0, 0, 24, 8, 21, ivory);
  for (let y = 1; y < 8; y += 2) {
    for (const s of [-1, 1]) {
      box(auction, 0, y, s * 10.52, 23, 1.1, 0.07, glass);
      box(auction, s * 12.02, y, 0, 0.07, 1.1, 20, glass);
    }
  }
  box(auction, 0, 8, 0, 24.5, 0.5, 21.5, ivory);
  solar(auction, -10, 8.55, -7, 5);
  solar(auction, 4, 8.55, -7, 4);
  const auctionLogo = sculpture('ebay-1999-2012', 19, 0.8);
  auctionLogo.position.set(0, 8.7, 10);
  auction.add(auctionLogo);
  batch(auction);

  reserve(-63, 148, 25, 23);
  const social = group(set, 'Myspace campus · rooftop takeover', -63, 0, 148);
  for (let level = 0; level < 4; level++) {
    const w = 23 - level * 1.7,
      d = 20 - level * 1.2,
      y = level * 2.4;
    box(social, 0, y, 0, w, 2.1, d, ivory);
    for (const side of [-1, 1]) {
      box(
        social,
        0,
        y + 0.55,
        side * (d / 2 + 0.03),
        w - 0.3,
        1.25,
        0.06,
        glass,
      );
      box(
        social,
        side * (w / 2 + 0.03),
        y + 0.55,
        0,
        0.06,
        1.25,
        d - 0.3,
        glass,
      );
    }
    box(social, 0, y + 2.1, 0, w + 0.6, 0.3, d + 0.6, ivory);
  }
  box(social, 0, 9.6, 0, 17.3, 0.18, 15.8, '#a66f4b');
  tank(social, 6, 9.8, -5, 2.3, 1.8);
  parasol(social, -5, 9.8, -3, '#e4c32d');
  for (let i = 0; i < 15; i++)
    person(social, -7 + (i % 8) * 1.8, 9.8, 1 + Math.floor(i / 8) * 2.4, i);
  const oldSign = group(social, 'Myspace billboard dismantling', 0, 10, 7.5);
  box(oldSign, 0, 0, 0, 22, 4.9, 0.5, '#423674');
  const socialLogo = sculpture('myspace-2008', 20, 0.22, '#eee9dc');
  socialLogo.position.set(0, 0.6, 0.3);
  oldSign.add(socialLogo);
  for (const x of [-7, 7]) box(oldSign, x, -1.4, 0, 0.18, 1.5, 0.2, steel);
  const replacement = group(social, 'Facebook billboard assembly', 0, 10, 7.6);
  box(replacement, 0, 0, 0, 23, 5, 0.5, '#344675');
  const facebook = sculpture('facebook-lettering', 20, 0.3, '#eee9dc');
  facebook.position.set(0, 0.75, 0.3);
  replacement.add(facebook);
  motion.track(oldSign, (t) => {
    const p = ease(2.6, 3.25, t);
    oldSign.rotation.x = -p * Math.PI * 0.48;
    oldSign.position.y = 10 - p * 1.2;
    oldSign.scale.setScalar(Math.max(0.001, 1 - ease(3.05, 3.4, t)));
  });
  motion.track(replacement, (t) => {
    const p = ease(3.1, 3.9, t);
    replacement.scale.y = Math.max(0.001, p);
    replacement.position.y = 10;
  });
  batch(oldSign);
  batch(replacement);
  batch(social);

  // Geodesic glass dome: visible curved silhouette and explicit triangular struts.
  reserve(62, 117, 23, 23);
  const observatory = group(set, 'Glass dome campus', 62, 0, 117);
  box(observatory, 0, 0, 0, 22, 7, 22, ivory);
  for (let y = 1; y < 7; y += 2)
    for (const s of [-1, 1]) {
      box(observatory, 0, y, s * 11.02, 21, 1.2, 0.08, glass);
      box(observatory, s * 11.02, y, 0, 0.08, 1.2, 21, glass);
    }
  box(observatory, 0, 7, 0, 22.5, 0.45, 22.5, ivory);
  const domeGeo = new THREE.SphereGeometry(
    7.3,
    20,
    10,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  mesh(observatory, domeGeo, mat('#83a5ab'), 0, 7.45, 0);
  const lines = new THREE.LineSegments(
    new THREE.WireframeGeometry(domeGeo),
    new THREE.LineBasicMaterial({ color: '#d2dacf' }),
  );
  lines.position.y = 7.45;
  observatory.add(lines);
  tank(observatory, -8, 7.5, -6, 1.4, 2);
  batch(observatory);

  function crane(x: number, z: number, h: number, phase: number, end = 7.8) {
    const base = group(set, 'Tower crane · lattice mast', x, 0, z);
    box(base, 0, 0, 0, 3, 0.7, 3, '#858b7a');
    for (const dx of [-0.55, 0.55])
      for (const dz of [-0.55, 0.55])
        beam(base, [dx, 0.6, dz], [dx, h, dz], 0.1, yellow);
    for (let y = 0.7; y < h - 1.4; y += 1.8)
      for (const s of [-1, 1]) {
        beam(
          base,
          [-0.55, y, s * 0.55],
          [0.55, y + 1.8, s * 0.55],
          0.06,
          yellow,
        );
        beam(
          base,
          [-0.55, y + 1.8, s * 0.55],
          [0.55, y, s * 0.55],
          0.06,
          yellow,
        );
        beam(
          base,
          [s * 0.55, y, -0.55],
          [s * 0.55, y + 1.8, 0.55],
          0.06,
          yellow,
        );
        beam(base, [-0.55, y, s * 0.55], [0.55, y, s * 0.55], 0.065, yellow);
      }
    const boom = group(base, 'Slewing triangular jib', 0, h, 0);
    const rear = -6,
      tip = 15;
    for (const z of [-0.58, 0.58])
      beam(boom, [rear, 0, z], [tip, 0, z], 0.1, yellow);
    beam(boom, [rear, 1.25, 0], [tip, 1.25, 0], 0.095, yellow);
    for (let x = rear; x < tip; x += 1.4) {
      for (const s of [-1, 1]) {
        beam(boom, [x, 0, s * 0.58], [x + 1.4, 1.25, 0], 0.055, yellow);
        beam(boom, [x, 1.25, 0], [x + 1.4, 0, s * 0.58], 0.055, yellow);
      }
      beam(boom, [x, 0, -0.58], [x, 0, 0.58], 0.06, yellow);
    }
    beam(boom, [0, 1, 0], [0, 4, 0], 0.12, yellow);
    beam(boom, [0, 4, 0], [tip - 1, 1.2, 0], 0.035, steel);
    beam(boom, [0, 4, 0], [rear, 1.2, 0], 0.035, steel);
    box(boom, -4, -1.1, 0, 2.6, 1.1, 2.1, '#a9ac9d');
    box(boom, 1.3, -1.4, 0, 1.5, 1.5, 1.5, yellow);
    box(boom, 1.3, -1.1, 0.77, 1.2, 1, 0.035, '#506e76');
    const trolley = group(boom, 'Traveling trolley', 8, -0.15, 0);
    box(trolley, 0, 0, 0, 1.2, 0.35, 1.2, steel);
    const cable = group(trolley, 'Variable hoist cable');
    beam(cable, [-0.16, 0, 0], [-0.16, -1, 0], 0.025, steel);
    beam(cable, [0.16, 0, 0], [0.16, -1, 0], 0.025, steel);
    const hook = group(trolley, 'Hook and suspended concrete panel');
    box(hook, 0, -0.3, 0, 0.7, 0.5, 0.55, '#b5a22f');
    beam(hook, [0, -0.3, 0], [-2, -1.6, 0], 0.03, steel);
    beam(hook, [0, -0.3, 0], [2, -1.6, 0], 0.03, steel);
    box(hook, 0, -3.3, 0, 4.7, 1.7, 0.3, ivory);
    for (let i = -1; i <= 1; i++)
      box(hook, i * 1.3, -3.1, 0.17, 1.05, 1.05, 0.06, glass);
    batch(hook);
    batch(trolley);
    batch(cable);
    batch(boom);
    batch(base);
    motion.track(
      base,
      (t) => (base.scale.y = Math.max(0.001, 1 - ease(end, end + 0.95, t))),
    );
    motion.track(
      boom,
      (t) => (boom.rotation.y = phase + Math.sin(t * 0.85 + phase) * 0.5),
    );
    motion.track(
      trolley,
      (t) => (trolley.position.x = 8 + Math.sin(t * 1.05 + phase) * 3.5),
    );
    motion.track(
      cable,
      (t) => (cable.scale.y = 5.5 + Math.sin(t * 1.65 + phase) * 2.4),
    );
    motion.track(hook, (t) => {
      hook.position.y = -(5.5 + Math.sin(t * 1.65 + phase) * 2.4);
      hook.rotation.z = Math.sin(t * 2 + phase) * 0.04;
    });
    return base;
  }
  crane(30, 91, 25, 0.5, 5.8);
  crane(-34, 107, 27, -0.4, 4.5);
  crane(29, 143, 24, 1.7, 4.7);
  crane(27, -8, 29, -0.4, 7.6);
  crane(-23, 1, 23, 1.3, 7.1);
  crane(8, 30, 21, 2.2, 7.3);
  crane(-64, -54, 20, 1.4, 8);
  const folded = crane(-67, 116, 15, -0.9, 3.6);
  folded.position.y = 8.5;
  motion.track(
    folded,
    (t) => (folded.rotation.z = -1.38 * (1 - ease(0.15, 1.65, t))),
  );

  function excavator(x: number, z: number, phase: number) {
    const base = group(set, 'Excavator · crawler tracks', x, 0, z);
    for (const s of [-1, 1]) {
      box(base, s * 1.1, 0.15, 0, 0.65, 0.7, 3.6, '#303a36');
      for (let i = 0; i < 10; i++)
        box(base, s * 1.1, 0.1, -1.65 + i * 0.36, 0.72, 0.13, 0.18, '#596055');
      for (let dz = -1.3; dz < 1.5; dz += 0.65) {
        const m = mesh(
          base,
          new THREE.CylinderGeometry(0.29, 0.29, 0.7, 10),
          mat('#686959'),
          s * 1.1,
          0.5,
          dz,
        );
        m.rotation.z = Math.PI / 2;
      }
    }
    const cab = group(base, 'Rotating excavator cab', 0, 1, 0);
    box(cab, 0, 0, -0.3, 2.2, 0.8, 2.8, yellow);
    box(cab, -0.55, 0.7, -0.3, 1.05, 1.25, 1.55, yellow);
    box(cab, -0.55, 0.95, 0.5, 0.86, 0.84, 0.05, '#405a5d');
    box(cab, -1.1, 0.95, -0.3, 0.04, 0.84, 1.3, '#405a5d');
    const arm = group(cab, 'Main hydraulic boom', 0.6, 0.6, 0.5);
    beam(arm, [0, 0, 0], [0, 3.7, 2.6], 0.24, yellow);
    beam(arm, [0, 0.35, -0.1], [0, 2.7, 2.2], 0.09, '#afbab3');
    const stick = group(arm, 'Excavator articulated stick', 0, 3.7, 2.6);
    beam(stick, [0, 0, 0], [0, -2.5, 1.8], 0.17, yellow);
    beam(stick, [0, -0.2, 0.5], [0, -1.9, 1.7], 0.07, '#bcc6bf');
    const bucket = group(stick, 'Digging bucket', 0, -2.5, 1.8);
    const scoop = mesh(
      bucket,
      new THREE.CylinderGeometry(0.66, 0.66, 1.1, 12, 1, false, 0, Math.PI),
      mat('#645d40'),
    );
    scoop.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++)
      box(bucket, -0.48 + i * 0.24, -0.6, 0.5, 0.13, 0.17, 0.55, '#938366');
    batch(bucket);
    batch(stick);
    batch(arm);
    batch(cab);
    batch(base);
    motion.track(
      cab,
      (t) => (cab.rotation.y = phase + Math.sin(t * 1.9 + phase) * 0.8),
    );
    motion.track(
      arm,
      (t) => (arm.rotation.x = -0.22 + Math.sin(t * 2.5 + phase) * 0.35),
    );
    motion.track(
      stick,
      (t) => (stick.rotation.x = 0.2 + Math.sin(t * 2.5 + phase + 0.8) * 0.5),
    );
    motion.track(
      bucket,
      (t) => (bucket.rotation.x = 0.3 + Math.sin(t * 2.5 + phase + 1.4) * 0.65),
    );
    return base;
  }
  // The early empty lawns become a busy construction yard and a balloon festival.
  reserve(24, 115, 29, 25);
  reserve(22, 86, 34, 22);
  reserve(-24, 145, 25, 23);
  const yard = group(set, 'Active construction yard', 22, 0, 86);
  box(yard, 0, 0.08, 0, 30, 0.12, 19, '#a59a68');
  box(yard, -4, 0.2, 0, 17, 0.15, 14, '#716e52');
  const skeleton = group(yard, 'Exposed steel building frame', -4, 0.3, 0);
  for (let floor = 0; floor < 4; floor++) {
    const level = group(
      skeleton,
      `Construction floor ${floor + 1}`,
      0,
      floor * 3,
      0,
    );
    for (const x of [-7, 0, 7])
      for (const z of [-5.5, 0, 5.5]) box(level, x, 0, z, 0.22, 3, 0.22, steel);
    for (const z of [-5.5, 0, 5.5])
      box(level, 0, 2.85, z, 14.3, 0.2, 0.22, steel);
    for (const x of [-7, 0, 7]) box(level, x, 2.85, 0, 0.22, 0.2, 11.2, steel);
    const deck = group(level, 'Floor slab');
    box(deck, 0, 2.85, 0, 14, 0.15, 11, '#c7c6b6');
    motion.track(
      deck,
      (t) =>
        (deck.scale.x = Math.max(
          0.001,
          ease(0.7 + floor * 0.65, 1.6 + floor * 0.65, t),
        )),
    );
    batch(level);
  }
  for (let i = 0; i < 8; i++) {
    box(yard, 12, 0.2 + i * 0.15, -5, 1.3, 0.12, 7, ivory);
    box(yard, 9, 0.2 + i * 0.13, 5, 4.5, 0.11, 0.35, steel);
  }
  for (let i = 0; i < 11; i++) {
    const x = -13 + i * 2.6;
    box(yard, x, 0.2, 10, 1.9, 0.7, 0.5, '#e8e2c8');
    box(yard, x, 0.45, 10.27, 0.65, 0.25, 0.02, '#df6b25');
  }
  for (let i = 0; i < 15; i++)
    person(yard, -13 + (i % 5) * 5.6, 0.25, -8 + Math.floor(i / 5) * 7.5, i);
  batch(yard);
  excavator(33, 113, 0.5);
  excavator(32, 84, 2);
  excavator(13, 94, 4);
  excavator(-28, 144, 1.4);
  const westDigger = excavator(-30, 18, 2.5);
  const eastDigger = excavator(35, 22, 4.2);
  motion.track(
    westDigger,
    (t) => (westDigger.position.z = 18 + ease(5.4, 6.8, t) * 13),
  );
  motion.track(
    eastDigger,
    (t) => (eastDigger.position.z = 22 + ease(5.6, 7, t) * 9),
  );

  // Colored A-frame tents and tether ropes give the open field a readable scale.
  const camp = group(set, 'Balloon festival · tents and visitors', 24, 0, 116);
  const tentColors = ['#d13d25', '#ed9f24', '#e4ca31', '#3199a2', '#3474b3'];
  for (let i = 0; i < 15; i++) {
    const x = -10 + (i % 5) * 4.7,
      z = -8 + Math.floor(i / 5) * 7.2;
    const tent = group(camp, 'A-frame tent', x, 0.15, z);
    const tri = new THREE.Shape();
    tri.moveTo(-1.3, 0);
    tri.lineTo(0, 1.6);
    tri.lineTo(1.3, 0);
    tri.closePath();
    mesh(
      tent,
      new THREE.ExtrudeGeometry(tri, { depth: 2.7, bevelEnabled: false }),
      mat(tentColors[i % 5]),
    );
    const door = new THREE.Shape();
    door.moveTo(-0.65, 0);
    door.lineTo(0, 1.3);
    door.lineTo(0.65, 0);
    door.closePath();
    mesh(tent, new THREE.ShapeGeometry(door), mat('#514f3f'), 0, 0.01, 2.72);
    beam(tent, [0, 1.6, 0], [0, 0.02, -1], 0.022, ivory);
    beam(tent, [0, 1.6, 2.7], [0, 0.02, 3.7], 0.022, ivory);
    motion.track(
      tent,
      (t) => (tent.scale.y = 0.6 + 0.4 * ease(i * 0.025, 0.45 + i * 0.025, t)),
    );
    batch(tent);
    person(camp, x + 1.7, 0.15, z + 1, i);
  }
  batch(camp);

  function balloon(
    x: number,
    z: number,
    size: number,
    phase: number,
    palette: string[],
    alien: boolean,
  ) {
    const flight = group(set, 'Hot-air balloon · flight', x, 0.2, z);
    const basket = group(flight, 'Woven basket');
    box(basket, 0, 0, 0, 1.6, 0.85, 1.4, '#a57844');
    box(basket, 0, 0.7, 0, 1.8, 0.18, 1.6, '#c59a62');
    for (let i = -3; i <= 3; i++) {
      box(basket, i * 0.22, 0.1, 0.73, 0.07, 0.6, 0.03, '#d0a46a');
      box(basket, 0.82, 0.1, i * 0.2, 0.03, 0.6, 0.07, '#d0a46a');
    }
    for (const sx of [-0.7, 0.7])
      for (const sz of [-0.6, 0.6])
        beam(basket, [sx, 0.7, sz], [sx, 2.5, sz], 0.045, '#4b4d3c');
    const envelope = group(flight, 'Ribbed balloon envelope', 0, 2.5, 0);
    const profile = new THREE.SplineCurve([
      new THREE.Vector2(0.6, 0),
      new THREE.Vector2(0.9, 1),
      new THREE.Vector2(2, 3),
      new THREE.Vector2(3.8, 5.5),
      new THREE.Vector2(5.1, 8.3),
      new THREE.Vector2(5.45, 10.5),
      new THREE.Vector2(4.9, 12.6),
      new THREE.Vector2(3.5, 14.3),
      new THREE.Vector2(1.8, 15.3),
      new THREE.Vector2(0, 15.7),
    ])
      .getPoints(56)
      .map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
    for (let gore = 0; gore < 16; gore++) {
      mesh(
        envelope,
        new THREE.LatheGeometry(
          profile,
          4,
          (gore / 16) * Math.PI * 2,
          (Math.PI * 2) / 16,
        ),
        mat(palette[gore % palette.length]),
      );
      const angle = (gore / 16) * Math.PI * 2;
      const points = profile.map(
        (p) =>
          new THREE.Vector3(Math.sin(angle) * p.x, p.y, Math.cos(angle) * p.x),
      );
      const curve = new THREE.CatmullRomCurve3(points);
      mesh(
        envelope,
        new THREE.TubeGeometry(curve, 28, 0.036, 4, false),
        mat(palette[0]),
      );
    }
    // Wrap the emblem around the envelope instead of leaving a flat sign in front.
    function wrap(
      geometry: THREE.BufferGeometry,
      yOffset: number,
      lift = 0.06,
    ) {
      const source = geometry;
      geometry = new TessellateModifier(0.42, 7).modify(source);
      source.dispose();
      const pos = geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) + yOffset,
          angle = pos.getX(i) / 5.2 + 0.64;
        let radius = 0.6;
        for (let j = 1; j < profile.length; j++) {
          if (profile[j].y >= y) {
            const a = profile[j - 1],
              b = profile[j];
            radius = THREE.MathUtils.lerp(
              a.x,
              b.x,
              THREE.MathUtils.clamp((y - a.y) / (b.y - a.y), 0, 1),
            );
            break;
          }
        }
        radius += lift + pos.getZ(i);
        pos.setXYZ(i, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
      return geometry;
    }
    if (alien) {
      const badge = group(envelope, 'Alien balloon emblem · curved surface');
      const head = new THREE.Shape();
      head.moveTo(0, -3.1);
      head.bezierCurveTo(-4, -0.6, -3.1, 3.3, 0, 3.2);
      head.bezierCurveTo(3.1, 3.3, 4, -0.6, 0, -3.1);
      mesh(
        badge,
        wrap(
          new THREE.ExtrudeGeometry(head, {
            depth: 0.025,
            bevelEnabled: false,
            curveSegments: 18,
          }),
          9,
        ),
        mat('#ecebdc'),
      );
      for (const side of [-1, 1]) {
        const eye = new THREE.Shape();
        eye.absellipse(
          side * 1.13,
          -0.45,
          1,
          0.4,
          0,
          Math.PI * 2,
          false,
          side * 0.3,
        );
        mesh(
          badge,
          wrap(new THREE.ShapeGeometry(eye, 16), 9, 0.12),
          mat('#77a442'),
        );
      }
      const mouth = new THREE.Shape();
      mouth.moveTo(-0.38, -1.8);
      mouth.lineTo(0.38, -1.8);
      mouth.lineTo(0.24, -2);
      mouth.lineTo(-0.24, -2);
      mouth.closePath();
      mesh(
        badge,
        wrap(new THREE.ShapeGeometry(mouth), 9, 0.12),
        mat('#4d5061'),
      );
      batch(badge);
    } else {
      const logo = sculpture('old-fintoc-symbol', 4, 0.05, '#eee6d8');
      logo.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry = wrap(o.geometry, 7, 0.1);
      });
      envelope.add(logo);
    }
    const flame = group(flight, 'Burner flame', 0, 1.8, 0);
    mesh(flame, new THREE.ConeGeometry(0.23, 1.5, 8), mat('#f8b32c'));
    batch(basket);
    batch(envelope);
    motion.track(flight, (t) => {
      const lift = ease(0.2 + phase, 1.6 + phase, t),
        land = ease(3.8 + phase, 5.4 + phase, t);
      flight.position.set(
        x + Math.sin(t * 0.8 + phase) * 1.6 * lift,
        0.2 + (7 + Math.sin(t * 1.3 + phase)) * lift * (1 - land),
        z - t * 0.7 * lift,
      );
      flight.rotation.set(
        Math.sin(t * 1.5 + phase) * 0.035,
        Math.sin(t * 0.4 + phase) * 0.1,
        Math.sin(t * 1.2 + phase) * 0.035,
      );
      flight.scale.setScalar(size);
    });
    motion.track(envelope, (t) => {
      const inflation =
        ease(-0.4 + phase, 1.1 + phase, t) *
        (1 - ease(4.1 + phase, 5.9 + phase, t));
      envelope.scale.set(1, 0.1 + 0.9 * inflation, 1);
    });
    motion.track(flame, (t) =>
      flame.scale.setScalar(
        (0.6 + Math.sin(t * 24 + phase) * 0.25) * (1 - ease(4, 5, t)) + 0.001,
      ),
    );
  }
  balloon(21, 116, 1.15, 0, ['#5a4a9c', '#7866b7', '#8c7bc6', '#6f5aa9'], true);
  balloon(
    -29,
    145,
    0.74,
    0.55,
    ['#526aca', '#7086dd', '#445bbb', '#9ba9e5'],
    false,
  );

  // A second industrial silhouette: containers, concrete pipes and a mixing truck.
  const depot = group(set, 'Logistics and construction supplies', -24, 0, 145);
  for (let i = 0; i < 3; i++) {
    box(
      depot,
      7,
      0.1,
      -7 + i * 3.2,
      7,
      2.6,
      2.6,
      ['#a65d37', '#54887a', '#b89a49'][i],
    );
    for (let rib = 0; rib < 16; rib++)
      box(
        depot,
        3.7 + rib * 0.43,
        0.2,
        -5.67 + i * 3.2,
        0.05,
        2.3,
        0.035,
        '#d0bd87',
      );
  }
  for (let i = 0; i < 5; i++) {
    const pipe = mesh(
      depot,
      new THREE.CylinderGeometry(0.7, 0.7, 3, 16, 1, true),
      mat('#c2bda7'),
      -6 + i * 1.6,
      0.7,
      -6,
    );
    pipe.rotation.x = Math.PI / 2;
  }
  batch(depot);
  const truck = group(set, 'Moving concrete mixer', 0, 0, 130.2);
  box(truck, 0, 0.55, 0, 6.8, 0.55, 2.1, '#b99c39');
  box(truck, 2.25, 1.1, 0, 1.8, 1.8, 2, yellow);
  box(truck, 3.18, 1.75, 0, 0.05, 0.9, 1.7, glass);
  const drum = group(truck, 'Rotating mixer drum', -0.9, 1.9, 0);
  const drumMesh = mesh(
    drum,
    new THREE.CylinderGeometry(0.75, 1.1, 3.8, 14),
    mat('#e4ded0'),
  );
  drumMesh.rotation.z = Math.PI / 2;
  for (const x of [-1.8, -0.4, 1]) {
    const ring = mesh(
      drum,
      new THREE.TorusGeometry(0.94, 0.14, 6, 20),
      mat('#c75431'),
      x,
      0,
      0,
    );
    ring.rotation.y = Math.PI / 2;
  }
  for (const x of [-2, -0.7, 2.3])
    for (const z of [-1.1, 1.1]) {
      const wheel = mesh(
        truck,
        new THREE.CylinderGeometry(0.53, 0.53, 0.3, 12),
        mat('#30352f'),
        x,
        0.55,
        z,
      );
      wheel.rotation.x = Math.PI / 2;
    }
  batch(drum);
  batch(truck);
  motion.track(truck, (t) => (truck.position.x = -32 + t * 8));
  motion.track(drum, (t) => (drum.rotation.x = t * 2.7));
  return reserved;
}
