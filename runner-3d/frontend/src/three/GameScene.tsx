import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { AvatarCharacter } from "./AvatarCharacter";
import { FollowCamera } from "./FollowCamera";
import { ObstacleTrack, type Obstacle } from "./ObstacleTrack";
import type { AnimState } from "../types";

interface Props {
  speed: number;
  animState: AnimState;
  scrollZ: number;
  obstacles: Obstacle[];
  playerZ: number;
}

function SceneInner({ speed, animState, scrollZ, obstacles, playerZ }: Props) {
  const playerRef = useRef<THREE.Group>(null);
  const laneX = useRef(0);
  const laneTarget = useRef(0);

  useEffect(() => {
    if (animState === "dodgeLeft") laneTarget.current = -1.7;
    else if (animState === "dodgeRight") laneTarget.current = 1.7;
    else if (animState === "run" || animState === "idle") laneTarget.current = 0;
  }, [animState]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const speed = animState === "dodgeLeft" || animState === "dodgeRight" ? 14 : 6;
    laneX.current = THREE.MathUtils.lerp(laneX.current, laneTarget.current, delta * speed);
    playerRef.current.position.x = laneX.current;
    playerRef.current.position.z = playerZ;
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#87CEEB", "#4ade80", 0.6]} />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Stars radius={80} depth={40} count={1200} factor={3} fade speed={0.5} />

      <group ref={playerRef} position={[0, 0, playerZ]}>
        <AvatarCharacter animState={animState} speed={speed} position={[0, 0, 0]} />
      </group>

      <FollowCamera target={playerRef} />
      <ObstacleTrack obstacles={obstacles} scrollZ={scrollZ} />
    </>
  );
}

export function GameScene(props: Props) {
  return (
    <Canvas
      shadows
      camera={{ fov: 55, near: 0.1, far: 300, position: [0, 3, -6] }}
      className="h-full w-full"
      style={{ background: "linear-gradient(#87CEEB 0%, #b4e4ff 55%, #4ade80 55%)" }}
    >
      <Suspense
        fallback={
          <Html center>
            <span className="text-white text-sm animate-pulse">Loading 3D world…</span>
          </Html>
        }
      >
        <SceneInner
          speed={props.speed}
          animState={props.animState}
          scrollZ={props.scrollZ}
          obstacles={props.obstacles}
          playerZ={props.playerZ}
        />
      </Suspense>
    </Canvas>
  );
}
