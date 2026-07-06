import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AnimState } from "../types";
import { RPM_AVATAR_URL } from "../services/api";

interface Props {
  animState: AnimState;
  speed: number;
  position: [number, number, number];
}

/**
 * Ready Player Me glTF avatar.
 * Drop Mixamo glTF clips in public/models/animations/ and set VITE_ANIM_* env vars.
 * Falls back to procedural bounce if no clips are available.
 */
export function AvatarCharacter({ animState, speed, position }: Props) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(RPM_AVATAR_URL);
  const cloned = useRef<THREE.Group | null>(null);

  if (!cloned.current) {
    cloned.current = scene.clone(true);
  }

  const { actions, mixer } = useAnimations(animations, group);
  const hasClips = animations.length > 0;
  const prevAnim = useRef<AnimState>("run");

  useEffect(() => {
    if (!hasClips) return;
    const pick =
      actions[animState] ||
      actions[Object.keys(actions).find((k) => k.toLowerCase().includes(animState)) || ""] ||
      actions[Object.keys(actions)[0]];
    if (!pick) return;
    Object.values(actions).forEach((a) => a?.fadeOut(0.15));
    pick.reset().fadeIn(0.15).play();
    if (animState === "run") pick.setEffectiveTimeScale(0.7 + speed * 0.06);
    prevAnim.current = animState;
  }, [animState, actions, hasClips, speed]);

  useFrame((state, delta) => {
    mixer?.update(delta);
    if (!group.current || hasClips) return;
    const t = state.clock.elapsedTime;
    if (animState === "run") {
      group.current.position.y = position[1] + Math.sin(t * 14) * 0.06;
      group.current.rotation.z = Math.sin(t * 14) * 0.04;
    } else if (animState === "jump") {
      group.current.position.y = position[1] + Math.abs(Math.sin(t * 8)) * 0.5;
    } else if (animState === "win") {
      group.current.rotation.y = Math.sin(t * 6) * 0.2;
    } else if (animState === "lose") {
      group.current.rotation.z = Math.sin(t * 3) * 0.08 - 0.1;
    }
  });

  return (
    <group ref={group} position={position} scale={1.1}>
      {cloned.current && <primitive object={cloned.current} />}
    </group>
  );
}

useGLTF.preload(RPM_AVATAR_URL);
