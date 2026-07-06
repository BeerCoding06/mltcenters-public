import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { AvatarCharacter } from "./AvatarCharacter";
import { FollowCamera } from "./FollowCamera";
import { ObstacleTrack } from "./ObstacleTrack";
import type { AnimState, Obstacle, VisualFx } from "../game/types";
import { JUMP_HEIGHT } from "../game/constants";

interface Props {
  speed: number;
  animState: AnimState;
  scrollZ: number;
  obstacles: Obstacle[];
  jumpHeight: number;
  fx: VisualFx;
}

function SceneInner({ speed, animState, scrollZ, obstacles, jumpHeight, fx }: Props) {
  const playerRef = useRef<THREE.Group>(null);
  const jumpProgress =
    jumpHeight > 0 ? jumpHeight / JUMP_HEIGHT : animState.includes("jump") ? 0.5 : 0;

  useFrame(() => {
    if (!playerRef.current) return;
    playerRef.current.position.x = 0;
    playerRef.current.position.z = 0;
  });

  return (
    <>
      <ambientLight intensity={0.68} />
      <hemisphereLight args={["#87CEEB", "#4ade80", 0.65]} />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Stars radius={80} depth={40} count={1000} factor={3} fade speed={0.5} />

      <group ref={playerRef}>
        <AvatarCharacter
          animState={animState}
          speed={speed}
          jumpHeight={jumpHeight}
          jumpProgress={jumpProgress}
        />
      </group>

      {fx.landingBurst && (
        <mesh position={[0, 0.05, 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 1.2, 24]} />
          <meshBasicMaterial color="#86efac" transparent opacity={0.5} />
        </mesh>
      )}

      <FollowCamera
        target={playerRef}
        shake={fx.shake}
        zoom={fx.speedLines ? 1.1 : 1}
      />
      <ObstacleTrack obstacles={obstacles} scrollZ={scrollZ} />
    </>
  );
}

export function GameScene(props: Props) {
  return (
    <Canvas
      shadows
      camera={{ fov: 55, near: 0.1, far: 300, position: [0, 3, -6] }}
      className="pointer-events-none h-full w-full"
      style={{
        background: "linear-gradient(#87CEEB 0%, #87CEEB 48%, #4ade80 48%, #22c55e 100%)",
      }}
    >
      <Suspense
        fallback={
          <Html center>
            <span className="text-white text-sm animate-pulse">กำลังโหลดโลก 3D…</span>
          </Html>
        }
      >
        <SceneInner {...props} />
      </Suspense>
    </Canvas>
  );
}
