/** Smooth jump arc — ease-in takeoff, peak, ease-out landing */
export function jumpArc(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 0;
  return Math.sin(t * Math.PI);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function squashFactor(t: number, landStart = 0.82): number {
  if (t < landStart) return 1;
  const p = (t - landStart) / (1 - landStart);
  return 1 - Math.sin(p * Math.PI) * 0.18;
}
