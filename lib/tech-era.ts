import * as THREE from 'three';
import { ease, type createMotion } from './city-life';
import type { Kit } from './ai-era';
import { STORY_TIMING } from './story-timing';

type Motion = ReturnType<typeof createMotion>;
function group(parent: THREE.Object3D, name: string, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
const show = (yes: boolean) => (yes ? 1 : 0.001);

/** A restrained rooftop identity on the same office architecture as its neighbors. */
export function addNvidiaIdentity(
  parent: THREE.Group,
  w: number,
  d: number,
  h: number,
  kit: Kit,
  motion: Motion,
) {
  const { box, mat, sculpture, batch } = kit;
  const sign = group(
    parent,
    'NVIDIA · office rooftop identity',
    0,
    h + 0.85,
    d * 0.27,
  );
  box(sign, 0, 0, 0, w, 4.7, 0.35, mat('#ece8db', 'paint'));
  const eye = sculpture('nvidia-eye', 4.3, 0.2, '#76b900');
  eye.position.set(-w * 0.35, 1.05, 0.22);
  sign.add(eye);
  const word = sculpture('nvidia-wordmark', w * 0.67, 0.24, '#202b26');
  word.position.set(w * 0.13, 1.05, 0.22);
  sign.add(word);
  for (const x of [-w * 0.33, w * 0.33])
    box(sign, x, -0.8, 0, 0.17, 0.9, 0.23, mat('#727d75', 'metal'));
  batch(sign);
  motion.track(sign, (t) => {
    const p = ease(STORY_TIMING.nvidia, STORY_TIMING.nvidia + 0.4, t);
    sign.position.y = h + 0.85 - (1 - p) * 0.65;
    sign.scale.setScalar(show(t >= STORY_TIMING.nvidia));
  });
}

export const NFT_SITE = { x: -63, z: 85, w: 22, d: 21 };

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
      const start = STORY_TIMING.nftCrash + i * 0.32,
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
  motion.track(yard, (t) => {
    yard.scale.setScalar(show(t >= STORY_TIMING.nftRise));
  });
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
      car.scale.setScalar(show(t >= STORY_TIMING.waymo + i * 0.13));
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
