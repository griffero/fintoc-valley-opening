import * as THREE from 'three';
import { ease, type createMotion } from './city-life';

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
  sculpture: (
    asset: string,
    width: number,
    depth: number,
    color?: string | THREE.Material,
    separate?: boolean,
  ) => THREE.Group;
};

/** One permanent sign on the headquarters; both authentic identities share its center. */
export function createFintocIdentity(
  parent: THREE.Group,
  anchor: { roof: { y: number; z: number }; logoWidth: number },
  background: THREE.Material,
  kit: Kit,
  motion: ReturnType<typeof createMotion>,
) {
  const sign = new THREE.Group();
  sign.name = 'Fintoc · single identity';
  sign.position.set(0, anchor.roof.y, anchor.roof.z);
  parent.add(sign);
  const height = 5.5;
  kit.box(
    sign,
    0,
    0,
    0,
    anchor.logoWidth + 1.8,
    height,
    0.36,
    background,
  ).name = 'Fintoc · black sign panel';
  const lettering = new THREE.MeshStandardMaterial({
    name: 'Fintoc · white lettering',
    color: '#ffffff',
    roughness: 0.62,
  });
  for (const old of [true, false]) {
    const logo = kit.sculpture(
      old ? 'old-fintoc-logo' : 'fintoc-logo',
      anchor.logoWidth * (old ? 0.83 : 1),
      0.18,
      lettering,
      true,
    );
    logo.name = old ? 'Fintoc · 2021 identity' : 'Fintoc · current identity';
    const bounds = new THREE.Box3().setFromObject(logo);
    // Center each source outline within the same sign, despite their different aspect ratios.
    logo.position.set(
      0,
      (height - bounds.getSize(new THREE.Vector3()).y) / 2,
      0.21,
    );
    sign.add(logo);
    const parts = logo.children.filter(
      (o): o is THREE.Mesh => o instanceof THREE.Mesh,
    );
    parts.sort(
      (a, b) => a.geometry.boundingBox!.min.x - b.geometry.boundingBox!.min.x,
    );
    parts.forEach((part, i) => {
      const center = part.geometry.boundingBox!.getCenter(new THREE.Vector3());
      part.geometry.translate(-center.x, -center.y, -center.z);
      part.name = `${old ? '2021' : '2024'} Fintoc · component ${i + 1}`;
      const order = i / Math.max(1, parts.length - 1);
      motion.track(part, (t) => {
        const born = old
          ? ease(5.15 + order * 0.15, 5.65 + order * 0.15, t)
          : ease(6.88 + order * 0.14, 7.46 + order * 0.14, t);
        const split = old
          ? ease(6.35 + order * 0.08, 6.75 + order * 0.08, t)
          : 0;
        const gone = old
          ? ease(6.45 + order * 0.08, 6.75 + order * 0.08, t)
          : 0;
        const drift = old ? split : 1 - born;
        part.position.set(
          center.x + (order - 0.5) * drift * 2.6,
          center.y + (old ? split * 1.8 - (1 - born) * 0.8 : drift * 1.6),
          center.z + drift * (0.25 + (i % 3) * 0.18),
        );
        part.rotation.set(drift * 0.25, 0, drift * (order - 0.5) * 0.6);
        // Keep both groups in the GLB; visibility toggles would drop the old identity at export.
        part.scale.setScalar(Math.max(0.001, born * (1 - gone)));
      });
    });
  }
  return sign;
}
