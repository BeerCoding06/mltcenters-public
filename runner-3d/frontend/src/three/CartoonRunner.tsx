import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AnimState } from "../types";

interface Props {
  animState: AnimState;
  speed: number;
  position: [number, number, number];
}

/**
 * Built-in cartoon runner — no external CDN, works offline.
 */
export function CartoonRunner({ animState, speed, position }: Props) {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const dodgeT = useRef(0);

  useFrame((state, delta) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    const pace = 10 + speed * 0.8;
    const isDodge = animState === "dodgeLeft" || animState === "dodgeRight";
    const dodgeDir = animState === "dodgeLeft" ? -1 : 1;

    if (isDodge) {
      dodgeT.current = Math.min(1, dodgeT.current + delta * 6);
    } else {
      dodgeT.current = Math.max(0, dodgeT.current - delta * 3);
    }

    if (animState === "run" || isDodge) {
      const swing = Math.sin(t * pace * 1.2) * 0.75;
      if (legL.current) {
        legL.current.rotation.x = isDodge ? (dodgeDir < 0 ? 0.55 : -0.15) : swing;
      }
      if (legR.current) {
        legR.current.rotation.x = isDodge ? (dodgeDir < 0 ? -0.15 : 0.55) : -swing;
      }
      if (armL.current) {
        armL.current.rotation.x = isDodge ? -0.5 + dodgeDir * 0.8 : -swing * 0.7;
        armL.current.rotation.z = isDodge ? dodgeDir * 0.65 : 0;
      }
      if (armR.current) {
        armR.current.rotation.x = isDodge ? -0.5 - dodgeDir * 0.5 : swing * 0.7;
        armR.current.rotation.z = isDodge ? -dodgeDir * 0.35 : 0;
      }
      root.current.position.y = position[1] + Math.abs(Math.sin(t * pace)) * 0.1;
      root.current.rotation.x = isDodge ? 0.28 : 0.08;
      root.current.rotation.z = isDodge
        ? dodgeDir * (0.35 + dodgeT.current * 0.2)
        : Math.sin(t * pace) * 0.03;
      root.current.rotation.y = isDodge ? dodgeDir * -0.28 : 0;
    } else if (animState === "idle") {
      root.current.position.y = position[1] + Math.sin(t * 2) * 0.03;
      root.current.rotation.set(0, 0, 0);
      if (legL.current) legL.current.rotation.x = 0;
      if (legR.current) legR.current.rotation.x = 0;
    } else if (animState === "jump") {
      root.current.position.y = position[1] + Math.abs(Math.sin(t * 10)) * 0.7;
      root.current.rotation.x = -0.15;
      if (armL.current) armL.current.rotation.x = -1.2;
      if (armR.current) armR.current.rotation.x = -1.2;
    } else if (animState === "win") {
      root.current.rotation.y = Math.sin(t * 8) * 0.3;
      root.current.position.y = position[1] + Math.abs(Math.sin(t * 8)) * 0.15;
      if (armL.current) armL.current.rotation.x = -2.5 + Math.sin(t * 8) * 0.3;
      if (armR.current) armR.current.rotation.x = -2.5 + Math.sin(t * 8) * 0.3;
    } else if (animState === "lose") {
      root.current.rotation.z = -0.25;
      root.current.position.y = position[1] - 0.2;
      root.current.rotation.x = 0.2;
    }

    if (head.current) {
      if (isDodge) {
        head.current.rotation.y = dodgeDir * 0.2;
        head.current.rotation.z = dodgeDir * 0.08;
      } else if (animState === "run") {
        head.current.rotation.y = Math.sin(t * 3) * 0.05;
        head.current.rotation.z = 0;
      }
    }
  });

  const skin = "#ffcc80";
  const shirt = "#ff6b35";
  const pants = "#3b82f6";
  const shoe = "#1e293b";

  return (
    <group ref={root} position={position}>
      <group position={[0, 1.55, 0]}>
        <mesh ref={head} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={skin} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.22]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.22]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, -0.02, 0.24]}>
          <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#c45c5c" />
        </mesh>
      </group>

      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.45, 8, 16]} />
        <meshStandardMaterial color={shirt} />
      </mesh>

      <group ref={armL} position={[-0.32, 1.15, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
      </group>
      <group ref={armR} position={[0.32, 1.15, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
      </group>

      <group ref={legL} position={[-0.12, 0.75, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.35, 4, 8]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.58, 0.05]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.22]} />
          <meshStandardMaterial color={shoe} />
        </mesh>
      </group>
      <group ref={legR} position={[0.12, 0.75, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.35, 4, 8]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.58, 0.05]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.22]} />
          <meshStandardMaterial color={shoe} />
        </mesh>
      </group>

      {/* Dodge trail hint */}
      {(animState === "dodgeLeft" || animState === "dodgeRight") && (
        <mesh position={[0, 0.05, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.55, 16]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}
