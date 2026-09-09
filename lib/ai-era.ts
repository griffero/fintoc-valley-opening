import * as THREE from 'three';
import { ease, type createMotion } from './city-life';
import type { SurfaceRole } from './outdoor-materials';
import { STORY_TIMING } from './story-timing';

export type Kit = {
  box: (
    p: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string | THREE.Material,
  ) => THREE.Mesh;
  mesh: (
    p: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    x?: number,
    y?: number,
    z?: number,
  ) => THREE.Mesh;
  mat: (color: string, role?: SurfaceRole) => THREE.MeshStandardMaterial;
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
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ) => THREE.Mesh;
  batch: (p: THREE.Object3D) => void;
};
type Motion = ReturnType<typeof createMotion>;
function group(parent: THREE.Object3D, name: string, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
const visibleScale = (visible: boolean) => (visible ? 1 : 0.001);
function shiftedMotion(motion: Motion, offset: number) {
  return {
    track(object: THREE.Object3D, update: (t: number) => void) {
      motion.track(object, (t) => update(t - offset));
    },
  };
}

/** A deliberately playful Twitter → SpaceX replacement, followed by a roof launch. */
export function createSpaceXSequence(
  parent: THREE.Group,
  h: number,
  d: number,
  kit: Kit,
  masterMotion: Motion,
) {
  const motion = shiftedMotion(masterMotion, STORY_TIMING.twitterShift);
  const { box, mesh, mat, sculpture, batch } = kit;
  const old = group(parent, 'Twitter roundel · folds away', 0, h + 1, d / 2);
  const disc = mesh(
    old,
    new THREE.CylinderGeometry(4.8, 4.8, 0.55, 48),
    mat('#eee9dc', 'paint'),
    0,
    4,
    0,
  );
  disc.rotation.x = Math.PI / 2;
  const bird = sculpture('twitter-bird', 7, 0.3, '#39a7c4');
  bird.position.set(0, 1.2, 0.5);
  old.add(bird);
  batch(old);
  for (const x of [-5.7, 5.7])
    box(
      parent,
      x,
      h + 0.6,
      d / 2 - 0.2,
      0.22,
      3.2,
      0.22,
      mat('#737b74', 'metal'),
    );
  const next = group(
    parent,
    'SpaceX wordmark · replacement sign',
    0,
    h + 1,
    d / 2,
  );
  box(next, 0, 1.25, 0, 18.8, 3.5, 0.45, mat('#162127', 'paint'));
  const spacex = sculpture('spacex-wordmark', 16.9, 0.23, '#f5f3ed');
  spacex.position.set(0, 1.82, 0.26);
  next.add(spacex);
  batch(next);
  motion.track(old, (t) => {
    const p = ease(2.55, 3.2, t);
    old.rotation.x = -p * Math.PI * 0.48;
    old.position.y = h + 1 - p * 1.2;
    old.scale.setScalar(Math.max(0.001, 1 - ease(3.05, 3.35, t)));
  });
  motion.track(next, (t) => {
    const p = ease(3.04, 3.68, t);
    next.position.y = h + 1 - (1 - p) * 4;
    next.rotation.y = (1 - p) * Math.PI * 0.5;
    next.scale.setScalar(visibleScale(t >= 3.04));
  });

  const pad = group(parent, 'SpaceX roof launch pad', -5.3, h + 0.76, -3.2);
  mesh(
    pad,
    new THREE.CylinderGeometry(2.4, 2.6, 0.24, 40),
    mat('#8a918d', 'metal'),
  );
  const ring = mesh(
    pad,
    new THREE.TorusGeometry(1.8, 0.075, 5, 40),
    mat('#e9c84b', 'paint'),
    0,
    0.15,
    0,
  );
  ring.rotation.x = Math.PI / 2;
  batch(pad);
  const rocket = group(pad, 'SpaceX rocket · accelerating liftoff');
  const white = mat('#f4f3ed', 'paint'),
    black = mat('#273139', 'paint');
  mesh(rocket, new THREE.CylinderGeometry(0.71, 0.76, 9.6, 24), white, 0, 5, 0);
  mesh(
    rocket,
    new THREE.CylinderGeometry(0.72, 0.72, 0.8, 24),
    black,
    0,
    8.3,
    0,
  );
  mesh(
    rocket,
    new THREE.CylinderGeometry(0.48, 0.72, 2.15, 24),
    white,
    0,
    10.84,
    0,
  );
  mesh(rocket, new THREE.ConeGeometry(0.49, 1.75, 24), white, 0, 12.79, 0);
  mesh(
    rocket,
    new THREE.CylinderGeometry(0.45, 0.6, 0.5, 16),
    mat('#687475', 'metal'),
    0,
    0.1,
    0,
  );
  for (let i = 0; i < 4; i++) {
    const fin = group(rocket, 'Rocket aerodynamic fin');
    fin.rotation.y = (i * Math.PI) / 2;
    const shape = new THREE.Shape();
    shape.moveTo(0.55, 0.4);
    shape.lineTo(1.65, 0.2);
    shape.lineTo(0.6, 2.1);
    shape.closePath();
    mesh(
      fin,
      new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false }),
      white,
      0,
      0,
      -0.05,
    );
    batch(fin);
  }
  const emblem = sculpture('spacex-wordmark', 3.6, 0.018, '#273139');
  emblem.rotation.z = Math.PI / 2;
  emblem.position.set(0.22, 3, 0.73);
  rocket.add(emblem);
  batch(rocket);
  const flame = group(rocket, 'Rocket exhaust · flame');
  const hot = new THREE.MeshBasicMaterial({
    color: '#fff7bc',
    toneMapped: false,
  });
  const orange = new THREE.MeshBasicMaterial({
    color: '#ffab37',
    toneMapped: false,
  });
  mesh(
    flame,
    new THREE.CylinderGeometry(0.6, 0.05, 5.5, 14),
    orange,
    0,
    -2.75,
    0,
  ).castShadow = false;
  mesh(
    flame,
    new THREE.CylinderGeometry(0.4, 0.02, 3.8, 14),
    hot,
    0,
    -1.65,
    0.18,
  ).castShadow = false;
  motion.track(rocket, (t) => {
    const flight = Math.max(0, t - 4.12);
    rocket.position.set(
      flight * flight * 4,
      -0.1 + ease(3, 3.67, t) * 0.4 + flight * flight * 44,
      -flight * flight * 1.5,
    );
    rocket.rotation.z = -Math.min(0.22, flight * 0.1);
    rocket.scale.setScalar(visibleScale(t >= 3 && t < 6.25));
  });
  motion.track(flame, (t) => {
    const on = t >= 3.98 && t < 6.25;
    flame.scale.set(
      0.8 + 0.14 * Math.sin(t * 57),
      on ? 0.7 + 0.3 * Math.sin(t * 61) ** 2 : 0.001,
      0.9,
    );
    if (!on) flame.scale.setScalar(0.001);
  });
  for (let i = 0; i < 16; i++) {
    const puff = group(pad, `Launch smoke puff ${i + 1}`);
    mesh(
      puff,
      new THREE.IcosahedronGeometry(1, 2),
      mat(i % 2 ? '#c7c9c0' : '#dfe0d8'),
      0,
      0,
      0,
    ).castShadow = false;
    const angle = i * 2.399;
    motion.track(puff, (t) => {
      const age = t - (3.96 + i * 0.025),
        expand = ease(0, 0.55, age),
        fade = 1 - ease(0.85, 1.65, age);
      const r = expand * (1.5 + (i % 4)) + Math.max(0, age) * 0.6;
      puff.position.set(
        Math.cos(angle) * r,
        0.3 + expand * 0.55,
        Math.sin(angle) * r,
      );
      puff.scale.setScalar(
        Math.max(0.001, expand * fade * (0.6 + (i % 3) * 0.27)),
      );
    });
  }
}

/** Brand existing editable campuses, keeping their architectural massing. */
export function addAICampus(
  parent: THREE.Group,
  brand: 'openai' | 'anthropic',
  w: number,
  h: number,
  d: number,
  kit: Kit,
  motion: Motion,
) {
  const { box, mat, sculpture, batch } = kit;
  const sign = group(parent, `${brand} · architectural identity`);
  sign.userData.brandMount =
    brand === 'openai' ? 'roof-relief-and-facade' : 'cornice-lettering';
  const openAI = brand === 'openai';
  const upperRoof = 3 * Math.max(2.15, h / 3) + 0.94;
  const faceZ = openAI ? d * 0.02 : d / 2;
  const bandY = openAI ? upperRoof - 2.1 : h - 1.95;
  const bandWidth = openAI ? w * 0.84 : w + 0.12;
  // The lettering sits on a continuous architectural fascia, with returns at the corners.
  box(
    parent,
    0,
    bandY,
    faceZ + 0.065,
    bandWidth,
    2.05,
    0.2,
    mat(openAI ? '#e5dbc9' : '#e5d6c0'),
  );
  for (const side of [-1, 1])
    box(
      parent,
      side * (bandWidth / 2 - 0.08),
      bandY,
      faceZ - 0.42,
      0.16,
      2.05,
      1.1,
      mat(openAI ? '#e5dbc9' : '#e5d6c0'),
    );
  const logo = sculpture(
    openAI ? 'openai-wordmark' : 'anthropic-wordmark',
    openAI ? w * 0.64 : w * 0.74,
    0.14,
    '#222925',
  );
  const letteringHeight = new THREE.Box3()
    .setFromObject(logo)
    .getSize(new THREE.Vector3()).y;
  logo.scale.setScalar(Math.min(1, 1.62 / letteringHeight));
  logo.position.set(openAI ? 0 : 1.3, bandY + 0.24, faceZ + 0.19);
  sign.add(logo);
  const symbol = sculpture(
    openAI ? 'openai-blossom' : 'claude-spark',
    openAI ? 4.6 : 1.65,
    openAI ? 0.26 : 0.17,
    openAI ? '#1d2928' : '#d47758',
  );
  if (openAI) {
    symbol.rotation.x = -Math.PI / 2;
    symbol.position.set(w * 0.28, upperRoof + 0.12, -d * 0.07);
  } else symbol.position.set(-w * 0.4, bandY + 0.2, faceZ + 0.2);
  sign.add(symbol);
  batch(sign);
  motion.track(sign, (t) => {
    const start = openAI ? STORY_TIMING.openAI : STORY_TIMING.anthropic;
    sign.scale.setScalar(visibleScale(t >= start));
    sign.position.y = -(1 - ease(start, start + 0.35, t)) * 0.35;
  });
  const servers = group(
    parent,
    `${brand} · growing compute stacks`,
    -4.2,
    h + 0.8,
    -d * 0.28,
  );
  for (let i = 0; i < 3; i++) {
    const rack = group(
      servers,
      `${brand} · server stack ${i + 1}`,
      i * 2.5,
      0,
      0,
    );
    box(rack, 0, 0, 0, 1.8, 2.6, 1.5, mat('#394b4c', 'metal'));
    for (let row = 0; row < 7; row++) {
      box(
        rack,
        -0.1,
        0.24 + row * 0.32,
        0.78,
        1.4,
        0.12,
        0.04,
        mat('#172425', 'paint'),
      );
      box(
        rack,
        0.56,
        0.25 + row * 0.32,
        0.82,
        0.12,
        0.08,
        0.035,
        mat('#a0cc80', 'paint'),
      );
    }
    batch(rack);
    motion.track(rack, (t) => {
      const start = (brand === 'openai' ? 4.85 : 5.1) + i * 0.21;
      rack.position.y = -2.8 * (1 - ease(start, start + 0.32, t));
      rack.scale.setScalar(visibleScale(t >= start));
    });
  }
}

/** Small OpenClaw lobsters beside the OpenAI terrace pool. */
export function createOpenClawTerrace(
  parent: THREE.Group,
  h: number,
  d: number,
  kit: Kit,
  motion: Motion,
) {
  const { box, mesh, mat, text, batch } = kit;
  const deckY = Math.max(2.15, h / 3) + 0.68;
  const shell = mat('#dd553b', 'paint'),
    dark = mat('#b53929', 'paint');
  for (let i = 0; i < 3; i++) {
    const x = -5.6 + i * 4.3,
      z = d * 0.46;
    const lobster = group(parent, `OpenClaw lobster ${i + 1}`, x, deckY, z);
    function ellipsoid(
      p: THREE.Group,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      material: THREE.Material,
    ) {
      const piece = mesh(
        p,
        new THREE.SphereGeometry(1, 12, 8),
        material,
        x,
        y,
        z,
      );
      piece.scale.set(sx, sy, sz);
      return piece;
    }
    ellipsoid(lobster, 0, 0.25, 0, 0.32, 0.24, 0.6, shell);
    ellipsoid(lobster, 0, 0.29, 0.46, 0.27, 0.23, 0.28, shell);
    for (let segment = 0; segment < 4; segment++)
      ellipsoid(
        lobster,
        0,
        0.16,
        -0.52 - segment * 0.21,
        0.28 - segment * 0.035,
        0.15,
        0.19,
        segment % 2 ? shell : dark,
      );
    for (const side of [-1, 0, 1]) {
      const fan = ellipsoid(
        lobster,
        side * 0.16,
        0.12,
        -1.33,
        0.14,
        0.075,
        0.22,
        shell,
      );
      fan.rotation.y = side * -0.55;
    }
    for (const side of [-1, 1]) {
      for (let leg = 0; leg < 4; leg++) {
        const limb = box(
          lobster,
          side * 0.4,
          0.1,
          -0.35 + leg * 0.22,
          0.52,
          0.065,
          0.07,
          dark,
        );
        limb.rotation.y = side * (0.5 - leg * 0.2);
      }
      ellipsoid(
        lobster,
        side * 0.17,
        0.48,
        0.64,
        0.065,
        0.075,
        0.065,
        mat('#182629', 'paint'),
      );
      const antenna = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.17, 0.4, 0.62),
        new THREE.Vector3(side * 0.38, 0.58, 0.95),
        new THREE.Vector3(side * 0.64, 0.6, 1.35),
      ]);
      mesh(lobster, new THREE.TubeGeometry(antenna, 10, 0.022, 5, false), dark);
      const arm = box(
        lobster,
        side * 0.44,
        0.21,
        0.54,
        0.15,
        0.13,
        0.55,
        shell,
      );
      arm.rotation.y = side * 0.55;
      const claw = group(
        lobster,
        `OpenClaw lobster ${i + 1} · waving claw ${side}`,
        side * 0.65,
        0.24,
        0.85,
      );
      ellipsoid(claw, 0, 0, 0.1, 0.23, 0.16, 0.34, shell);
      for (const finger of [-1, 1]) {
        const part = ellipsoid(
          claw,
          finger * 0.13,
          0,
          0.4,
          0.1,
          0.12,
          0.23,
          shell,
        );
        part.rotation.y = -finger * 0.25;
      }
      batch(claw);
      motion.track(claw, (t) => {
        claw.rotation.x = Math.sin(t * 4.3 + i + side) * 0.22;
        claw.rotation.y = side * (0.16 + Math.sin(t * 3.1 + i) * 0.1);
      });
    }
    batch(lobster);
    motion.track(lobster, (t) => {
      lobster.position.set(
        x + Math.sin(t * 2.4 + i * 2) * 0.16,
        deckY + Math.abs(Math.sin(t * 5 + i)) * 0.025,
        z,
      );
      lobster.scale.setScalar(
        t >= STORY_TIMING.openClaw + i * 0.12 ? 0.78 : 0.001,
      );
      lobster.rotation.y = -0.45 + i * 0.32 + Math.sin(t * 1.8 + i) * 0.09;
    });
  }
  const plaque = group(
    parent,
    'OpenClaw · small terrace plaque',
    5.4,
    deckY,
    d * 0.45,
  );
  box(plaque, 0, 0, 0, 4.1, 1.05, 0.15, mat('#e4e1d3', 'paint'));
  text('OpenClaw', 0.51, 0.045, '#b94633', plaque, 0, 0.25, 0.1);
  batch(plaque);
  motion.track(plaque, (t) => {
    plaque.scale.setScalar(visibleScale(t >= STORY_TIMING.openClaw));
  });
}
