import * as THREE from 'three';

const origin = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const smooth = (a: number, b: number, time: number) => {
  const p = THREE.MathUtils.clamp((time - a) / (b - a), 0, 1);
  return p * p * (3 - 2 * p);
};
export const CAMERA_HOLD = 183 / (24000 / 1001);

/** Alternating roof/side daylight measured on a fixed roof in yU+co's opening. */
export function sampleDaylight(
  time: number,
  baseElevation: number,
  amount = 1,
) {
  const strength = THREE.MathUtils.clamp(amount, 0, 1);
  const envelope =
    smooth(0.15, 1.3, time) * (1 - smooth(6.45, CAMERA_HOLD, time));
  const roofPhase = 0.5 - 0.5 * Math.cos(time * Math.PI * 2);
  const finalAzimuth = Math.atan2(-100, 95);
  const activeAzimuth = THREE.MathUtils.degToRad(-12 - 46 * roofPhase);
  const azimuth = THREE.MathUtils.lerp(
    finalAzimuth,
    activeAzimuth,
    envelope * strength,
  );
  const elevation = THREE.MathUtils.degToRad(
    THREE.MathUtils.clamp(
      baseElevation + (-12 + 33 * roofPhase) * envelope * strength,
      15,
      78,
    ),
  );
  const offset = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  ).multiplyScalar(145);
  const rotation = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(offset, origin, up),
  );
  const color = new THREE.Color('#fff4e8').lerp(
    new THREE.Color('#ffdebd').lerp(new THREE.Color('#fff5eb'), roofPhase),
    envelope * strength,
  );
  return {
    offset,
    rotation,
    color,
    sunFactor: 1 + (0.02 - 0.04 * roofPhase) * envelope * strength,
    ambientFactor: 1 + (0.01 - 0.02 * roofPhase) * envelope * strength,
    haze: 0.026 + 0.023 * envelope * (1 - roofPhase),
  };
}
