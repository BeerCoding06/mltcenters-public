import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { AvatarCharacter } from "./AvatarCharacter";
import { FollowCamera } from "./FollowCamera";
import { ObstacleTrack, type Obstacle } from "./ObstacleTrack";
import { DODGE_RANGE_MAX, DODGE_RANGE_MIN, LANE_DODGE_X } from "../constants";
import type { AnimState } from "../types";

interface Props {
  speed: number;
  animState: AnimState;
  scrollZ: number;
  obstacles: Obstacle[];
  playerZ: number;
}

function pickAvoidLane(obstacleLane: number, obstacleId: number): number {
  if (obstacleLane === 0) {
    return obstacleId % 2 === 0 ? -LANE_DODGE_X : LANE_DODGE_X;
  }
  return obstacleLane > 0 ? -LANE_DODGE_X : LANE_DODGE_X;
}

function SceneInner({ speed, animState, scrollZ, obstacles, playerZ }: Props) {
  const playerRef = useRef<THREE.Group>(null);
  const laneX = useRef(0);
  const laneTarget = useRef(0);

  useEffect(() => {
    if (animState === "dodgeLeft") laneTarget.current = -LANE_DODGE_X;
    else if (animState === "dodgeRight") laneTarget.current = LANE_DODGE_X;
    else if (animState === "run" || animState === "idle") {
      const nearest = obstacles
        .map((o) => ({ o, dist: o.z - scrollZ }))
        .filter(({ dist }) => dist > DODGE_RANGE_MIN && dist < DODGE_RANGE_MAX)
        .sort((a, b) => a.dist - b.dist)[0];
      laneTarget.current = nearest
        ? pickAvoidLane(nearest.o.lane, nearest.o.id)
        : 0;
    }
  }, [animState, obstacles, scrollZ]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const nearest = obstacles
      .map((o) => ({ o, dist: o.z - scrollZ }))
      .filter(({ dist }) => dist > DODGE_RANGE_MIN && dist < DODGE_RANGE_MAX)
      .sort((a, b) => a.dist - b.dist)[0];

    let targetX = 0;
    if (animState === "dodgeLeft") targetX = -LANE_DODGE_X;
    else if (animState === "dodgeRight") targetX = LANE_DODGE_X;
    else if (nearest) targetX = pickAvoidLane(nearest.o.lane, nearest.o.id);

    laneTarget.current = targetX;
    const dodging =
      animState === "dodgeLeft" ||
      animState === "dodgeRight" ||
      Boolean(nearest);
    const lerpSpeed = dodging ? 20 : 7;
    laneX.current = THREE.MathUtils.lerp(laneX.current, laneTarget.current, delta * lerpSpeed);
    playerRef.current.position.x = laneX.current;
    playerRef.current.position.z = playerZ;
    playerRef.current.rotation.z = THREE.MathUtils.lerp(
      playerRef.current.rotation.z,
      -laneX.current * 0.12,
      delta * 10
    );
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
            <span className="text-white text-sm animate-pulse">กำลังโหลดโลก 3D…</span>
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
