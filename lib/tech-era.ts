import * as THREE from 'three';
import { ease, type createMotion } from './city-life';
import type { Kit } from './ai-era';

type Motion = ReturnType<typeof createMotion>;
function group(parent: THREE.Object3D, name: string, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
const show = (yes: boolean) => (yes ? 1 : 0.001);

/** A fictional processor-shaped megacampus, with authentic NVIDIA artwork. */
export function createNvidiaCampus(
  parent: THREE.Group,
  w: number,
  d: number,
  h: number,
  facade: THREE.Material,
  kit: Kit,
  motion: Motion,
) {
  const { box, mesh, mat, sculpture, batch } = kit;
  const green = mat('#76b900', 'paint');
  const metal = mat('#434c48', 'metal');
  const glass = mat('#263e40', 'glass');
  box(parent, 0, 0.12, 0, w + 1, 0.65, d + 1, mat('#b9bdb0', 'paving'));
  // Four stepped compute floors assemble in the time-lapse, like chip packages.
  for (let i = 0; i < 4; i++) {
    const levelH = h / 4;
    const level = group(
      parent,
      `NVIDIA · compute tier ${i + 1}`,
      0,
      0.7 + i * levelH,
      0,
    );
    const width = w - i * 1.25,
      depth = d - i * 0.55;
    box(level, 0, 0, 0, width, levelH - 0.25, depth, facade);
    box(level, 0, 0.6, depth / 2 + 0.03, width - 1, levelH - 1.4, 0.07, glass);
    box(level, 0, levelH - 0.6, 0, width + 0.35, 0.25, depth + 0.35, green);
    for (let x = -width / 2 + 0.5; x < width / 2; x += 1.25)
      box(level, x, 0.5, depth / 2 + 0.2, 0.16, levelH - 1.1, 0.55, metal);
    for (const side of [-1, 1])
      for (let z = -depth / 2 + 0.6; z < depth / 2; z += 0.85)
        box(
          level,
          side * (width / 2 + 0.1),
          0.45,
          z,
          0.5,
          levelH - 0.95,
          0.14,
          metal,
        );
    batch(level);
    motion.track(level, (t) => {
      const rise = ease(3.6 + i * 0.33, 4.08 + i * 0.33, t);
      level.position.y = 0.7 + i * levelH - (1 - rise) * levelH;
      level.scale.y = Math.max(0.001, rise);
    });
  }
  const crown = group(parent, 'NVIDIA · giant processor crown', 0, h + 0.7, 0);
  box(crown, 0, 0, 0, w - 3, 0.8, d - 1.5, mat('#131e1b', 'metal'));
  for (const side of [-1, 1])
    for (let x = -w / 2 + 3; x < w / 2 - 2; x += 1.2)
      box(
        crown,
        x,
        0.1,
        side * (d / 2 - 0.15),
        0.6,
        0.22,
        1.65,
        mat('#a59b65', 'metal'),
      );
  const eye = sculpture('nvidia-eye', 14, 0.24, '#76b900');
  eye.rotation.x = -Math.PI / 2;
  eye.position.set(0, 0.85, 4.5);
  crown.add(eye);
  // Broad lettering is below the roofline so the final camera cannot crop it.
  const fascia = group(
    crown,
    'NVIDIA · monumental wordmark',
    0,
    -7.5,
    d / 2 + 0.46,
  );
  box(fascia, 0, 0, 0, w + 0.3, 7.2, 0.6, mat('#15221d', 'paint'));
  const logo = sculpture('nvidia-wordmark', w - 2.1, 0.38, '#f2f3e8');
  logo.position.set(0, 1.2, 0.35);
  fascia.add(logo);
  box(fascia, 0, 0.1, 0.35, w, 0.24, 0.12, green);
  batch(fascia);
  // Two exposed industrial cooling fans make the silhouette unmistakably hardware.
  for (const x of [-w * 0.36, w * 0.36]) {
    const fan = group(crown, 'NVIDIA cooling fan', x, 1, -2.3);
    const ring = mesh(fan, new THREE.TorusGeometry(1.8, 0.22, 8, 24), metal);
    ring.rotation.x = Math.PI / 2;
    const rotor = group(fan, 'NVIDIA · spinning fan', 0, 0.08, 0);
    for (let j = 0; j < 6; j++) {
      const blade = box(rotor, 0, 0, 0.82, 0.53, 0.09, 1.5, metal);
      // Rotate a separate pivot instead of moving the shared box geometry.
      const pivot = group(rotor, 'Fan blade');
      pivot.add(blade);
      pivot.rotation.y = (j * Math.PI) / 3;
      batch(pivot);
    }
    motion.track(rotor, (t) => {
      rotor.rotation.y = t * 9;
    });
  }
  batch(crown);
  motion.track(crown, (t) => {
    crown.position.y = h + 0.7 - (1 - ease(4.9, 5.55, t)) * 5;
    crown.scale.setScalar(show(t >= 4.9));
  });
  batch(parent);
}

export const FUSION_SITE = { x: 27.5, z: 50, w: 23, d: 19 };
export const NFT_SITE = { x: -63, z: 85, w: 22, d: 21 };

/** A half-built toroidal reactor: a promise under construction, no real company claim. */
export function createFusionYard(world: THREE.Group, kit: Kit, motion: Motion) {
  const { box, mesh, mat, text, batch } = kit;
  const yard = group(
    world,
    'Fusion power · coming soon construction',
    FUSION_SITE.x,
    0,
    FUSION_SITE.z,
  );
  const steel = mat('#6a7774', 'metal'),
    copper = mat('#bb7950', 'metal');
  const yellow = mat('#e8b735', 'paint');
  box(yard, 0, 0.15, 0, 22, 0.25, 18, mat('#adae9d', 'paving'));
  mesh(
    yard,
    new THREE.CylinderGeometry(6.5, 6.8, 0.5, 40),
    mat('#c9c6b6'),
    -1.3,
    0.7,
    -0.8,
  );
  const chamber = mesh(
    yard,
    new THREE.TorusGeometry(4.3, 1.25, 12, 40),
    steel,
    -1.3,
    2.7,
    -0.8,
  );
  chamber.rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) {
    // Vertical magnetic coils around the toroidal vacuum chamber; one section remains open.
    const a = (i * Math.PI * 2) / 12 + Math.PI / 6;
    const coil = group(
      yard,
      `Fusion · installed magnet ${i + 1}`,
      -1.3 + Math.cos(a) * 4.3,
      2.7,
      -0.8 + Math.sin(a) * 4.3,
    );
    mesh(coil, new THREE.TorusGeometry(1.58, 0.23, 6, 16), copper);
    coil.rotation.y = -a;
    batch(coil);
    motion.track(coil, (t) => {
      const p = ease(2.9 + i * 0.17, 3.35 + i * 0.17, t);
      coil.position.y = 2.7 + (1 - p) * 3.4;
      coil.scale.setScalar(show(t >= 2.9 + i * 0.17));
    });
  }
  // Exposed center column and external pipes; no lit plasma in an unfinished plant.
  mesh(
    yard,
    new THREE.CylinderGeometry(1.1, 1.3, 5.7, 20),
    steel,
    -1.3,
    3.6,
    -0.8,
  );
  for (const x of [-8.7, 8.7]) box(yard, x, 0.4, -4.8, 0.55, 10.5, 0.7, yellow);
  box(yard, 0, 10.9, -4.8, 18.2, 0.65, 0.85, yellow);
  const trolley = group(
    yard,
    'Fusion · suspended final magnet',
    3.5,
    10.4,
    -4.8,
  );
  box(trolley, 0, 0, 0, 1.6, 0.5, 1.5, mat('#434d4b', 'metal'));
  box(trolley, 0, -3.7, 0, 0.07, 3.7, 0.07, steel);
  mesh(trolley, new THREE.TorusGeometry(1.58, 0.23, 6, 16), copper, 0, -4.2, 0);
  batch(trolley);
  motion.track(trolley, (t) => {
    trolley.position.x = 3.5 - 1.1 * ease(3.8, 6, t);
    trolley.rotation.z = Math.sin(t * 2.7) * 0.035;
  });
  box(yard, 7.6, 0.45, 0.4, 3, 3.1, 4.2, mat('#dad7c6'));
  for (let i = 0; i < 5; i++)
    box(yard, 7.6, 0.85 + i * 0.4, 2.53, 2.3, 0.15, 0.04, steel);
  const pipe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(4, 1.6, 0),
    new THREE.Vector3(5.5, 1.6, 0),
    new THREE.Vector3(5.5, 1.1, 3),
    new THREE.Vector3(7, 1.1, 3),
  ]);
  mesh(yard, new THREE.TubeGeometry(pipe, 18, 0.23, 8, false), steel);
  // Clear two-line hoarding across the front of the parcel.
  const sign = group(yard, 'Fusion · COMING SOON hoarding', 0, 0.45, 8.3);
  box(sign, 0, 0, 0, 21.3, 4.15, 0.26, mat('#213d45', 'paint'));
  text('FUSION POWER', 1.75, 0.12, '#f1eedc', sign, 0, 2.15, 0.17);
  text('COMING SOON', 1.28, 0.1, '#e8bf49', sign, 0, 0.52, 0.17);
  for (let i = 0; i < 12; i++) {
    const stripe = box(
      sign,
      -9.8 + i * 1.78,
      0.03,
      0.19,
      0.7,
      0.15,
      0.05,
      yellow,
    );
    stripe.rotation.z = -0.5;
  }
  batch(sign);
  for (const x of [-10.5, 10.5])
    for (let z = -8; z < 6.5; z += 2.2)
      box(yard, x, 0.4, z, 0.08, 2, 0.08, steel);
  for (const x of [-10.5, 10.5])
    box(yard, x, 1.5, -1.4, 0.055, 0.06, 14.6, steel);
  batch(yard);
  return FUSION_SITE;
}

/** Original pixel collectibles collapse like dominoes; this is a visual metaphor. */
export function createNFTCrash(world: THREE.Group, kit: Kit, motion: Motion) {
  const { box, mesh, mat, text, batch } = kit;
  const yard = group(
    world,
    'NFT / Web3 · speculative domino crash',
    NFT_SITE.x,
    0,
    NFT_SITE.z,
  );
  const gold = mat('#d0a245', 'metal');
  box(yard, 0, 0.1, 0, 21, 0.28, 20, mat('#b3b5a6', 'paving'));
  const patterns = [
    [
      '0011100',
      '0111110',
      '1101011',
      '1111111',
      '1011101',
      '1010101',
      '0100010',
    ],
    [
      '1000001',
      '1100011',
      '1111111',
      '1011101',
      '1111111',
      '0111110',
      '0011100',
    ],
    [
      '0011100',
      '0111110',
      '1111111',
      '1010101',
      '1111111',
      '0101010',
      '1101011',
    ],
  ];
  const colors = ['#8964b1', '#479698', '#da9773'];
  for (let i = 0; i < 3; i++) {
    const x = -6.8 + i * 6.8;
    const tile = group(
      yard,
      `NFT · falling collectible ${i + 1}`,
      x,
      0.45,
      2.8 + i * 0.45,
    );
    box(tile, 0, 0, 0, 6, 7.6, 0.55, gold);
    box(tile, 0, 0.42, 0.31, 5.2, 6.6, 0.08, mat('#263441', 'paint'));
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 7; col++)
        if (patterns[i][row][col] === '1')
          box(
            tile,
            (col - 3) * 0.62,
            5.65 - row * 0.62,
            0.38,
            0.59,
            0.59,
            0.1,
            mat(colors[i], 'paint'),
          );
    text('NFT', 0.83, 0.08, '#f6d775', tile, 0, 0.7, 0.41);
    batch(tile);
    motion.track(tile, (t) => {
      const start = 1.85 + i * 0.32,
        fall = ease(start, start + 0.68, t);
      const impact = Math.max(0, t - start - 0.68);
      const bounce = Math.sin(impact * 20) * Math.exp(-impact * 7) * 0.055;
      tile.rotation.x = -(fall * 1.46 - (t > start + 0.68 ? bounce : 0));
      tile.rotation.z = fall * (i - 1) * 0.065;
    });
  }
  const marquee = group(yard, 'Web3 · collapsing marquee', 0, 9, -5.4);
  box(marquee, 0, 0, 0, 19.6, 3.2, 0.3, mat('#775295', 'paint'));
  text('WEB3', 2.25, 0.15, '#f3e9dd', marquee, 0, 0.4, 0.2);
  batch(marquee);
  motion.track(marquee, (t) => {
    const p = ease(2.7, 3.4, t);
    marquee.position.y = 9 - p * 7.8;
    marquee.rotation.z = -p * 0.19;
    marquee.rotation.x = -p * 0.65;
  });
  for (let i = 0; i < 9; i++) {
    const token = group(
      yard,
      `Web3 · spilled token ${i + 1}`,
      7,
      0.7 + i * 0.28,
      5.6,
    );
    mesh(token, new THREE.CylinderGeometry(1.1, 1.1, 0.23, 20), gold);
    batch(token);
    motion.track(token, (t) => {
      const p = ease(2.6 + i * 0.025, 3.25 + i * 0.025, t);
      token.position.set(
        7 - p * (i % 3) * 2.1,
        0.65 + (1 - p) * i * 0.28,
        5.6 + p * (Math.floor(i / 3) - 1) * 1.7,
      );
      token.rotation.z = p * (i % 2 ? 0.2 : -0.16);
    });
  }
  const sale = group(yard, 'NFT · clearance sign', -4, 0.4, 7.8);
  box(sale, 0, 0, 0, 12, 2.3, 0.2, mat('#e9d78e', 'paint'));
  text('CLEARANCE', 1.14, 0.09, '#9f3632', sale, 0, 0.53, 0.13);
  batch(sale);
  motion.track(sale, (t) => {
    sale.scale.setScalar(show(t >= 3.3));
  });
  batch(yard);
  return NFT_SITE;
}

/** Small I-PACE-inspired robotaxis with real Waymo marks and visible sensor suites. */
export function createWaymoFleet(
  world: THREE.Group,
  kit: Kit,
  motion: Motion,
  avenueX: (z: number) => number,
) {
  const { box, mesh, mat, sculpture, batch } = kit;
  const white = mat('#eff1e8', 'paint'),
    black = mat('#202c31', 'paint');
  const glass = mat('#37545e', 'glass'),
    blue = mat('#0583ff', 'paint');
  // These routes stay on the established lanes and use the same time-lapse scale.
  const routes = [
    { axis: 0, lane: 100, phase: -82, speed: 23, direction: 1 },
    { axis: 0, lane: 68, phase: 85, speed: 21, direction: -1 },
    { axis: 0, lane: 35, phase: -100, speed: 22, direction: 1 },
    { axis: 1, lane: -48, phase: 150, speed: 25, direction: -1 },
    { axis: 1, lane: 45, phase: 104, speed: 22, direction: -1 },
    { axis: 0, lane: -27, phase: -170, speed: 24, direction: 1 },
    { axis: 1, lane: -78, phase: -20, speed: 24, direction: 1 },
    { axis: 1, lane: 77, phase: 147, speed: 21, direction: -1 },
  ];
  routes.forEach((route, i) => {
    const car = group(world, `Waymo · robotaxi ${i + 1}`);
    box(car, 0, 0.36, 0, 1.4, 0.62, 2.95, white);
    box(car, 0, 0.92, -0.12, 1.25, 0.64, 1.74, glass);
    box(car, 0, 1.55, -0.18, 1.28, 0.1, 1.62, white);
    for (const side of [-1, 1]) {
      box(car, side * 0.63, 0.92, -0.13, 0.06, 0.62, 0.1, white);
      for (const z of [-0.93, 0.93]) {
        mesh(
          car,
          new THREE.CylinderGeometry(0.32, 0.32, 0.19, 12),
          black,
          side * 0.69,
          0.35,
          z,
        ).rotation.z = Math.PI / 2;
        mesh(
          car,
          new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12),
          mat('#a7b0ad', 'metal'),
          side * 0.7,
          0.35,
          z,
        ).rotation.z = Math.PI / 2;
      }
      // Fender lidar pods, door mark, and front/rear lamps.
      mesh(
        car,
        new THREE.SphereGeometry(0.18, 10, 7),
        black,
        side * 0.7,
        0.99,
        0.98,
      );
      box(
        car,
        side * 0.46,
        0.72,
        1.49,
        0.36,
        0.14,
        0.035,
        mat('#e6eedc', 'paint'),
      );
      box(
        car,
        side * 0.46,
        0.72,
        -1.49,
        0.36,
        0.12,
        0.035,
        mat('#ba4a39', 'paint'),
      );
      const mark = sculpture('waymo-w', 0.47, 0.016);
      mark.rotation.y = (side * Math.PI) / 2;
      mark.position.set(side * 0.712, 0.47, 0.05);
      car.add(mark);
    }
    box(car, 0, 1.66, -0.12, 0.98, 0.13, 1.04, white);
    mesh(
      car,
      new THREE.CylinderGeometry(0.28, 0.4, 0.3, 16),
      black,
      0,
      1.97,
      -0.12,
    );
    mesh(
      car,
      new THREE.CylinderGeometry(0.405, 0.405, 0.065, 16),
      blue,
      0,
      1.86,
      -0.12,
    );
    for (const side of [-1, 1])
      mesh(
        car,
        new THREE.SphereGeometry(0.13, 8, 6),
        black,
        side * 0.43,
        1.83,
        0.2,
      );
    box(car, 0, 0.62, 1.49, 0.34, 0.25, 0.07, black);
    batch(car);
    motion.track(car, (t) => {
      const p =
        ((((route.phase + t * route.speed * route.direction + 210) % 420) +
          420) %
          420) -
        210;
      const bend = route.axis && route.lane === 45;
      car.position.set(
        route.axis
          ? (bend ? avenueX(p) : route.lane) + route.direction * 1.55
          : p,
        0.12,
        route.axis ? p : route.lane + route.direction * 1.55,
      );
      car.rotation.y =
        (route.axis
          ? bend
            ? Math.atan2(avenueX(p + 0.1) - avenueX(p - 0.1), 0.2)
            : 0
          : Math.PI / 2) + (route.direction < 0 ? Math.PI : 0);
    });
  });
}
