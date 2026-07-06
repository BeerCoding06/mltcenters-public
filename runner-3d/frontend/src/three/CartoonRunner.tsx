import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AnimState } from "../game/types";

interface Props {
  animState: AnimState;
  speed: number;
  jumpHeight: number;
  squash: number;
}

export function CartoonRunner({ animState, speed, jumpHeight, squash }: Props) {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const blend = useRef<AnimState>("run");

  useFrame((state, delta) => {
    if (!root.current) return;
    blend.current = animState;
    const t = state.clock.elapsedTime;
    const pace = 10 + speed * 0.85;
    const y = jumpHeight;
    const sq = squash;

    root.current.position.y = y;
    root.current.scale.set(1 / sq, sq, 1 / sq);

    const run = () => {
      const swing = Math.sin(t * pace * 1.2) * 0.72;
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      if (armL.current) armL.current.rotation.x = -swing * 0.65;
      if (armR.current) armR.current.rotation.x = swing * 0.65;
      root.current!.rotation.x = 0.08;
      root.current!.rotation.z = Math.sin(t * pace) * 0.03;
    };

    if (animState === "jump_start" || animState === "jump" || animState === "jump_land") {
      if (armL.current) {
        armL.current.rotation.x = -1.1;
        armL.current.rotation.z = 0.15;
      }
      if (armR.current) {
        armR.current.rotation.x = -1.1;
        armR.current.rotation.z = -0.15;
      }
      if (legL.current) legL.current.rotation.x = animState === "jump_land" ? 0.35 : -0.4;
      if (legR.current) legR.current.rotation.x = animState === "jump_land" ? 0.35 : -0.25;
      root.current.rotation.x = animState === "jump_start" ? 0.15 : -0.12;
    } else if (animState === "hit") {
      root.current.rotation.z = -0.35;
      root.current.rotation.x = 0.25;
      if (armL.current) armL.current.rotation.x = 0.5;
      if (armR.current) armR.current.rotation.x = 0.3;
    } else if (animState === "recover") {
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, 0, delta * 6);
      run();
    } else if (animState === "celebrate" || animState === "gameover") {
      root.current.rotation.y = Math.sin(t * 6) * 0.25;
      if (armL.current) armL.current.rotation.x = -2.2 + Math.sin(t * 8) * 0.2;
      if (armR.current) armR.current.rotation.x = -2.2 + Math.sin(t * 8) * 0.2;
    } else if (animState === "countdown") {
      root.current.position.y = y + Math.sin(t * 4) * 0.04;
    } else {
      run();
    }
  });

  const skin = "#ffcc80";
  const shirt = "#ff6b35";
  const pants = "#3b82f6";
  const shoe = "#1e293b";

  return (
    <group ref={root}>
      <group position={[0, 1.55, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
      <mesh ref={body} position={[0, 1.05, 0]} castShadow>
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
    </group>
  );
}
