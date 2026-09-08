import * as THREE from 'three';
import type { createMotion } from './city-life';
import type { SurfaceRole } from './outdoor-materials';

type Kit = {
  mat: (color: string, role?: SurfaceRole) => THREE.MeshStandardMaterial;
  box: (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    material: string | THREE.Material,
  ) => THREE.Mesh;
  mesh: (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    x?: number,
    y?: number,
    z?: number,
  ) => THREE.Mesh;
  batch: (parent: THREE.Object3D) => void;
  person: (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    index: number,
  ) => void;
};

/** A street-scale think coffee stand beside the final Fintoc headquarters. */
export function createCoffeeKiosk(
  world: THREE.Group,
  logo: THREE.Group,
  kit: Kit,
  motion: ReturnType<typeof createMotion>,
) {
  const { box, mesh, mat, batch, person } = kit;
  const site = { x: 29, z: -20, w: 9, d: 7 };
  const kiosk = new THREE.Group();
  kiosk.name = 'think · miniature coffee stand';
  kiosk.position.set(site.x, 0, site.z);
  world.add(kiosk);
  const dark = '#26302c',
    ivory = '#eee9dd',
    wood = '#ac855e';
  box(kiosk, 0.35, 0.02, 0.4, 8.4, 0.16, 6.1, '#c8c5b7');
  for (let x = -3.4; x < 4.3; x += 0.85)
    box(kiosk, x, 0.185, 0.4, 0.015, 0.005, 5.9, '#acae9f');

  const stand = new THREE.Group();
  stand.name = 'Timber counter, canopy and espresso equipment';
  kiosk.add(stand);
  box(stand, 0, 0.25, 0.15, 5.25, 1.25, 2.7, dark);
  for (let x = -2.45; x < 2.55; x += 0.26)
    box(stand, x, 0.34, 1.52, 0.2, 1.13, 0.13, wood);
  for (const side of [-1, 1])
    for (let z = -1.1; z < 1.5; z += 0.26)
      box(stand, side * 2.68, 0.34, z, 0.13, 1.13, 0.2, wood);
  box(stand, 0, 1.5, 0.2, 5.7, 0.13, 3.1, ivory);
  for (const x of [-2.5, 2.5])
    for (const z of [-1.25, 1.35])
      box(stand, x, 0.2, z, 0.12, 3.15, 0.12, dark);
  box(stand, 0, 3.28, 0.05, 5.9, 0.12, 3.65, dark);
  // A shallow fabric canopy, its alternating panels remain individual geometry.
  for (let i = 0; i < 10; i++) {
    box(
      stand,
      -2.655 + i * 0.59,
      3.41,
      0.05,
      0.59,
      0.075,
      3.65,
      i % 2 ? '#ccc6b3' : ivory,
    );
    box(
      stand,
      -2.655 + i * 0.59,
      3.06,
      1.88,
      0.59,
      0.36,
      0.08,
      i % 2 ? '#ccc6b3' : ivory,
    );
  }
  const chrome = mat('#acb7b4', 'metal');
  box(stand, -0.85, 1.64, -0.48, 1.9, 0.69, 0.87, chrome);
  box(stand, -0.85, 1.7, 0, 1.65, 0.15, 0.25, dark);
  for (const x of [-1.32, -0.43]) {
    box(stand, x, 1.94, 0.06, 0.2, 0.14, 0.4, chrome);
    box(stand, x, 1.96, 0.35, 0.13, 0.12, 0.43, dark);
    const button = mesh(
      stand,
      new THREE.CylinderGeometry(0.055, 0.055, 0.03, 8),
      mat('#598b63'),
      x,
      2.14,
      -0.025,
    );
    button.rotation.x = Math.PI / 2;
  }
  mesh(
    stand,
    new THREE.CylinderGeometry(0.23, 0.29, 0.52, 12),
    chrome,
    0.65,
    1.9,
    -0.35,
  );
  mesh(
    stand,
    new THREE.CylinderGeometry(0.22, 0.16, 0.38, 12),
    mat('#654d36'),
    0.65,
    2.33,
    -0.35,
  );
  box(stand, 1.85, 1.64, 0.55, 0.4, 0.08, 0.55, dark);
  box(stand, 1.85, 1.72, 0.49, 0.4, 0.31, 0.07, mat('#728b87', 'glass'));

  function cup(parent: THREE.Object3D, x: number, y: number, z: number) {
    mesh(
      parent,
      new THREE.CylinderGeometry(0.115, 0.08, 0.22, 12),
      mat(ivory),
      x,
      y + 0.11,
      z,
    );
    mesh(
      parent,
      new THREE.CylinderGeometry(0.095, 0.095, 0.012, 12),
      mat('#4e3423'),
      x,
      y + 0.222,
      z,
    );
    mesh(
      parent,
      new THREE.TorusGeometry(0.073, 0.023, 5, 10),
      mat(ivory),
      x + 0.12,
      y + 0.12,
      z,
    );
  }
  for (let i = 0; i < 3; i++) cup(stand, -1.5 + i * 0.42, 1.63, 1.05);
  for (let i = 0; i < 3; i++) cup(stand, -1.4 + i * 0.48, 2.33, -0.48);
  for (const x of [-0.6, 0.6]) box(stand, x, 3.31, 2.25, 0.1, 0.1, 1.2, dark);

  // Traced from the supplied PNG: the brain and lettering are real vector geometry.
  const sign = new THREE.Group();
  sign.name = 'think · vector logo sign';
  sign.position.set(0, 3.74, 2.8);
  sign.rotation.y = THREE.MathUtils.degToRad(28);
  kiosk.add(sign);
  const bounds = new THREE.Box3().setFromObject(logo);
  const artworkHeight = bounds.max.y - bounds.min.y;
  const signWidth = 3.2,
    signHeight = artworkHeight + 0.4;
  box(
    sign,
    0,
    -signHeight / 2 - 0.08,
    -0.08,
    signWidth + 0.16,
    signHeight + 0.16,
    0.12,
    dark,
  );
  box(sign, 0, -signHeight / 2, -0.015, signWidth, signHeight, 0.03, '#f7f7f7');
  logo.position.set(0, -artworkHeight / 2, 0.025);
  sign.add(logo);
  batch(sign);

  // A small bistro table, stools and a waiting customer establish the scale.
  mesh(
    stand,
    new THREE.CylinderGeometry(0.65, 0.65, 0.09, 20),
    mat(ivory),
    3.5,
    1.21,
    1.15,
  );
  mesh(
    stand,
    new THREE.CylinderGeometry(0.08, 0.13, 1.03, 8),
    mat(dark),
    3.5,
    0.69,
    1.15,
  );
  mesh(
    stand,
    new THREE.CylinderGeometry(0.38, 0.38, 0.07, 16),
    mat(dark),
    3.5,
    0.22,
    1.15,
  );
  cup(stand, 3.3, 1.26, 1.1);
  for (const z of [0.1, 2.2]) {
    mesh(
      stand,
      new THREE.CylinderGeometry(0.34, 0.34, 0.09, 12),
      mat(wood),
      3.5,
      0.78,
      z,
    );
    box(stand, 3.5, 0.18, z, 0.12, 0.56, 0.12, dark);
  }
  const customer = new THREE.Group();
  customer.name = 'Coffee customer';
  customer.position.set(1.5, 0.18, 2.5);
  customer.rotation.y = Math.PI;
  kiosk.add(customer);
  person(customer, 0, 0, 0, 1);
  batch(customer);

  const barista = new THREE.Group();
  barista.name = 'think barista';
  barista.position.set(1.5, 0.55, -0.6);
  kiosk.add(barista);
  box(barista, 0, 0.5, 0, 0.48, 0.66, 0.3, ivory);
  box(barista, 0, 0.51, 0.16, 0.38, 0.6, 0.035, dark);
  mesh(
    barista,
    new THREE.SphereGeometry(0.2, 8, 6),
    mat('#c79b79'),
    0,
    1.39,
    0,
  );
  mesh(
    barista,
    new THREE.CylinderGeometry(0.23, 0.23, 0.12, 12),
    mat(dark),
    0,
    1.56,
    0,
  );
  const arm = new THREE.Group();
  arm.name = 'Barista serving coffee';
  arm.position.set(-0.3, 1.07, 0);
  barista.add(arm);
  box(arm, 0, -0.12, 0.3, 0.14, 0.14, 0.6, ivory);
  cup(arm, 0, 0.02, 0.62);
  motion.track(arm, (t) => {
    arm.rotation.y = Math.sin(t * 10.2) * 0.24;
    arm.rotation.x = -0.1 + Math.sin(t * 10.2 + 0.6) * 0.1;
  });
  batch(arm);
  batch(barista);
  batch(stand);
  return site;
}
