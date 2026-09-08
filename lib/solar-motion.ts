import * as THREE from 'three';

const morning = new THREE.Color('#ffd1a3');
const noon = new THREE.Color('#fff5e2');
const afternoon = new THREE.Color('#ffe3ba');
const origin = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const smooth = (p: number) => p * p * (3 - 2 * p);

/** An accelerated daylight arc, anchored to the established final-frame lighting. */
export function sampleDaylight(
  time: number,
  baseElevation: number,
  amount = 1,
) {
  // The original's final camera hold has an almost constant roof color balance.
  const p = smooth(THREE.MathUtils.clamp(time / (183 / (24000 / 1001)), 0, 1));
  const strength = THREE.MathUtils.clamp(amount, 0, 1);
  const azimuth =
    Math.atan2(-100, 95) + THREE.MathUtils.degToRad(95 * (1 - p) * strength);
  const elevation = THREE.MathUtils.degToRad(
    THREE.MathUtils.clamp(
      baseElevation + (29 * Math.sin(Math.PI * p) - 13 * (1 - p)) * strength,
      15,
      78,
    ),
  );
  const radius = Math.hypot(100, 95);
  const offset = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation) * radius,
    Math.sin(elevation) * 145,
    Math.cos(azimuth) * Math.cos(elevation) * radius,
  );
  const rotation = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(offset, origin, up),
  );
  const daylightColor =
    p < 0.46
      ? morning.clone().lerp(noon, smooth(p / 0.46))
      : noon.clone().lerp(afternoon, smooth((p - 0.46) / 0.54));
  return {
    offset,
    rotation,
    color: afternoon.clone().lerp(daylightColor, strength),
    sunFactor: 1 + strength * (-0.12 + 0.21 * Math.sin(Math.PI * p) + 0.12 * p),
    ambientFactor:
      1 + strength * (-0.08 + 0.1 * Math.sin(Math.PI * p) + 0.08 * p),
  };
}
