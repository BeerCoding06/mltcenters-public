import {
  OBSTACLE_GAP_BASE,
  OBSTACLE_SPAWN_AHEAD_MIN,
  OBSTACLE_SPAWN_AHEAD_SPREAD,
} from "../constants";
import type { Obstacle, ObstacleKind } from "../types";

const KINDS: ObstacleKind[] = [
  "rock",
  "woodBox",
  "fence",
  "hole",
  "tree",
  "barrier",
];

export class ObstacleManager {
  private pool: number[] = [];
  private nextId = 1;
  private lastSpawnZ = 0;

  reset() {
    this.pool = [];
    this.nextId = 1;
    this.lastSpawnZ = 0;
  }

  private acquireId(): number {
    return this.pool.pop() ?? this.nextId++;
  }

  recycle(id: number) {
    this.pool.push(id);
  }

  gapForDifficulty(questionsAnswered: number): number {
    return Math.max(18, OBSTACLE_GAP_BASE - Math.floor(questionsAnswered / 5));
  }

  trySpawn(scrollZ: number, questionsAnswered: number): Obstacle | null {
    const gap = this.gapForDifficulty(questionsAnswered);
    if (scrollZ - this.lastSpawnZ < gap) return null;
    this.lastSpawnZ = scrollZ;
    return {
      id: this.acquireId(),
      z:
        scrollZ +
        OBSTACLE_SPAWN_AHEAD_MIN +
        Math.random() * OBSTACLE_SPAWN_AHEAD_SPREAD,
      kind: KINDS[Math.floor(Math.random() * KINDS.length)],
      cleared: false,
    };
  }

  prune(scrollZ: number, obstacles: Obstacle[]): Obstacle[] {
    const kept: Obstacle[] = [];
    for (const o of obstacles) {
      if (o.z < scrollZ - 14) {
        if (!o.cleared) this.recycle(o.id);
      } else {
        kept.push(o);
      }
    }
    return kept;
  }
}
