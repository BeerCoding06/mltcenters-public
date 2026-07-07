import { Suspense, memo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { AvatarCharacter } from "./AvatarCharacter";
import { FollowCamera } from "./FollowCamera";
import { ObstacleTrack } from "./ObstacleTrack";
import { worldState, subscribeObstacles, getObstacleSnapshot } from "../game/worldState";

function LandingBurst() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = worldState.fx.landingBurst;
  });
  return (
    <mesh ref={ref} visible={false} position={[0, 0.05, 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 1.2, 24]} />
      <meshBasicMaterial color="#86efac" transparent opacity={0.5} />
    </mesh>
  );
}

function SceneInner() {
  const playerRef = useRef<THREE.Group>(null);
  const trackRef = useRef<THREE.Group>(null);
  const obstacles = useSyncExternalStore(subscribeObstacles, getObstacleSnapshot, getObstacleSnapshot);

  useFrame(() => {
    if (playerRef.current) {
      playerRef.current.position.x = 0;
      playerRef.current.position.z = 0;
    }
    if (trackRef.current) {
      trackRef.current.position.z = -worldState.scrollZ;
    }
  });

  return (
    <>
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#87CEEB", 40, 120]} />

      <ambientLight intensity={0.68} />
      <hemisphereLight args={["#87CEEB", "#4ade80", 0.65]} />
      <directionalLight position={[5, 12, 8]} intensity={1.35} castShadow shadow-mapSize={[512, 512]} />

      <Stars radius={80} depth={40} count={600} factor={2.5} fade speed={0.35} />

      <group ref={playerRef}>
        <AvatarCharacter />
      </group>

      <LandingBurst />

      <FollowCamera target={playerRef} />

      <group ref={trackRef}>
        <ObstacleTrack obstacles={obstacles} scrollZ={0} />
      </group>
    </>
  );
}

function GameSceneCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      resize={{ scroll: false, debounce: { resize: 0, scroll: 0 } }}
      camera={{ fov: 55, near: 0.1, far: 300, position: [0, 3, -6] }}
      className="pointer-events-none h-full w-full touch-none"
    >
      <Suspense
        fallback={
          <Html center>
            <span className="text-white text-sm animate-pulse">กำลังโหลดโลก 3D…</span>
          </Html>
        }
      >
        <SceneInner />
      </Suspense>
    </Canvas>
  );
}

export const GameScene = memo(GameSceneCanvas);
