/** A cyclic sequence of explicit moves and holds, independent of playback direction. */
export function taskMotion(
  time: number,
  duration: number,
  phase: number,
  keys: readonly (readonly [number, number])[],
) {
  const p = (((time / duration + phase) % 1) + 1) % 1;
  for (let i = 1; i < keys.length; i++) {
    const [end, value] = keys[i];
    if (p <= end) {
      const [start, previous] = keys[i - 1];
      const u = Math.max(0, Math.min(1, (p - start) / (end - start)));
      return previous + (value - previous) * u * u * (3 - 2 * u);
    }
  }
  return keys[keys.length - 1][1];
}
