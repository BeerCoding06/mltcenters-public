import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "../game/EventBus";
import { RunnerScene } from "../game/RunnerScene";

interface Props {
  onReady: (scene: RunnerScene) => void;
}

export function GameCanvas({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<RunnerScene | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current.id || "phaser-game");
    if (!containerRef.current.id) containerRef.current.id = "phaser-game";

    config.scene = [
      class extends RunnerScene {
        create() {
          super.create();
          sceneRef.current = this;
          onReady(this);
        }
      },
    ];

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [onReady]);

  return (
    <div
      ref={containerRef}
      id="phaser-game"
      className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-2 ring-orange-500/30"
      style={{ aspectRatio: "16/9", minHeight: 240 }}
    />
  );
}
