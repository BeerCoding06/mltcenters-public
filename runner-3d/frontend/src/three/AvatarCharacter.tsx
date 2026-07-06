import { Component, type ReactNode, Suspense } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AnimState } from "../game/types";
import { CartoonRunner } from "./CartoonRunner";
import { squashFactor } from "../game/easing";

interface Props {
  animState: AnimState;
  speed: number;
  jumpHeight: number;
  jumpProgress: number;
}

class AvatarErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function RpmAvatar({ url, animState, jumpHeight }: Props & { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const clone = useRef(scene.clone(true));
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (!animations.length) return;
    const key =
      Object.keys(actions).find((k) => k.toLowerCase().includes("run")) ||
      Object.keys(actions)[0];
    const action = key ? actions[key] : null;
    if (!action) return;
    Object.values(actions).forEach((a) => a?.fadeOut(0.15));
    action.reset().fadeIn(0.15).play();
  }, [animState, actions, animations.length]);

  useFrame((_, delta) => {
    mixer?.update(delta);
    if (group.current) group.current.position.y = jumpHeight;
  });

  return (
    <group ref={group} scale={1.1}>
      <primitive object={clone.current} />
    </group>
  );
}

export function AvatarCharacter({ animState, speed, jumpHeight, jumpProgress }: Props) {
  const rpmUrl = import.meta.env.VITE_RPM_AVATAR_URL?.trim();
  const squash = squashFactor(jumpProgress);

  if (!rpmUrl) {
    return (
      <CartoonRunner
        animState={animState}
        speed={speed}
        jumpHeight={jumpHeight}
        squash={squash}
      />
    );
  }

  return (
    <AvatarErrorBoundary
      fallback={
        <CartoonRunner
          animState={animState}
          speed={speed}
          jumpHeight={jumpHeight}
          squash={squash}
        />
      }
    >
      <Suspense
        fallback={
          <CartoonRunner
            animState={animState}
            speed={speed}
            jumpHeight={jumpHeight}
            squash={squash}
          />
        }
      >
        <RpmAvatar
          url={rpmUrl}
          animState={animState}
          speed={speed}
          jumpHeight={jumpHeight}
          jumpProgress={jumpProgress}
        />
      </Suspense>
    </AvatarErrorBoundary>
  );
}
