import type { AnimState, Obstacle, VisualFx } from "./types";

/** Mutable world state — updated in the game loop, read in useFrame (avoids React re-renders). */
export const worldState = {
  scrollZ: 0,
  obstacles: [] as Obstacle[],
  animState: "idle" as AnimState,
  jumpHeight: 0,
  speed: 8,
  fx: {
    shake: 0,
    speedLines: false,
    landingBurst: false,
  } as Pick<VisualFx, "shake" | "speedLines" | "landingBurst">,
};

const SEG_LEN = 5;

let obstacleFingerprint = "";
let obstacleListeners = new Set<() => void>();
let scrollSegment = -1;
let scrollListeners = new Set<() => void>();

export function publishWorldFrame(
  scrollZ: number,
  obstacles: Obstacle[],
  animState: AnimState,
  jumpHeight: number,
  speed: number,
  fx: typeof worldState.fx,
) {
  worldState.scrollZ = scrollZ;
  worldState.animState = animState;
  worldState.jumpHeight = jumpHeight;
  worldState.speed = speed;
  worldState.fx = fx;

  const seg = Math.floor(scrollZ / SEG_LEN);
  if (seg !== scrollSegment) {
    scrollSegment = seg;
    for (const fn of scrollListeners) fn();
  }

  const fp = obstacles.map((o) => `${o.id}:${o.z}:${o.cleared}`).join("|");
  if (fp !== obstacleFingerprint) {
    obstacleFingerprint = fp;
    worldState.obstacles = obstacles;
    for (const fn of obstacleListeners) fn();
  }
}

export function publishObstacles(obs: Obstacle[]) {
  const fp = obs.map((o) => `${o.id}:${o.z}:${o.cleared}`).join("|");
  if (fp === obstacleFingerprint) return;
  obstacleFingerprint = fp;
  worldState.obstacles = obs;
  for (const fn of obstacleListeners) fn();
}

export function subscribeObstacles(listener: () => void) {
  obstacleListeners.add(listener);
  return () => obstacleListeners.delete(listener);
}

export function getObstacleSnapshot() {
  return worldState.obstacles;
}

export function subscribeScrollSegment(listener: () => void) {
  scrollListeners.add(listener);
  return () => scrollListeners.delete(listener);
}

export function getScrollSegment() {
  return scrollSegment;
}
