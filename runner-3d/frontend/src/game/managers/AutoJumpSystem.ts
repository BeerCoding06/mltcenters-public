import { JUMP_DURATION, JUMP_HEIGHT, JUMP_LAND_RATIO, JUMP_START_RATIO } from "../constants";
import { jumpArc, squashFactor } from "../easing";
import type { AnimState } from "../types";

export interface JumpFrame {
  progress: number;
  height: number;
  squash: number;
  anim: AnimState;
}

export class AutoJumpSystem {
  private active = false;
  private elapsed = 0;
  private targetObstacleId: number | null = null;

  start(obstacleId: number) {
    this.active = true;
    this.elapsed = 0;
    this.targetObstacleId = obstacleId;
  }

  get targetId() {
    return this.targetObstacleId;
  }

  isActive() {
    return this.active;
  }

  reset() {
    this.active = false;
    this.elapsed = 0;
    this.targetObstacleId = null;
  }

  update(delta: number): JumpFrame | null {
    if (!this.active) return null;
    this.elapsed += delta;
    const progress = Math.min(1, this.elapsed / JUMP_DURATION);

    let anim: AnimState = "jump";
    if (progress < JUMP_START_RATIO) anim = "jump_start";
    else if (progress > 1 - JUMP_LAND_RATIO) anim = "jump_land";

    if (progress >= 1) {
      this.reset();
      return {
        progress: 1,
        height: 0,
        squash: 1,
        anim: "run",
      };
    }

    return {
      progress,
      height: jumpArc(progress) * JUMP_HEIGHT,
      squash: squashFactor(progress),
      anim,
    };
  }
}
