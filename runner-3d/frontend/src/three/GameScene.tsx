import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, Stars } from "@react-three/drei";
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

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Environment preset="sunset" />
      <Stars radius={80} depth={40} count={2000} factor={3} fade speed={0.5} />

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
