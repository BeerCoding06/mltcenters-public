import Phaser from "phaser";

type Handler = (...args: unknown[]) => void;

class EventBusClass {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((h) => h(...args));
  }
}

export const EventBus = new EventBusClass();

export const GAME_EVENTS = {
  READY: "game-ready",
  OBSTACLE_HIT: "obstacle-hit",
  UPDATE_STATS: "update-stats",
  GAME_OVER: "game-over",
} as const;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 450,
    backgroundColor: "#87CEEB",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 1200 }, debug: false },
    },
    scene: [], // scenes added in GameCanvas
  };
}
