import { Component, type ReactNode, Suspense } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AnimState } from "../types";
import { CartoonRunner } from "./CartoonRunner";

interface Props {
  animState: AnimState;
  speed: number;
  position: [number, number, number];
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

function RpmAvatar({ url, animState, position }: Props & { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const clone = useRef(scene.clone(true));
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (!animations.length) return;
    const key = Object.keys(actions).find((k) => k.toLowerCase().includes(animState)) || Object.keys(actions)[0];
    const action = key ? actions[key] : null;
    if (!action) return;
    Object.values(actions).forEach((a) => a?.fadeOut(0.15));
    action.reset().fadeIn(0.15).play();
  }, [animState, actions, animations.length]);

  useFrame((_, delta) => mixer?.update(delta));

  return (
    <group ref={group} position={position} scale={1.1}>
      <primitive object={clone.current} />
    </group>
  );
}

/** Default: built-in cartoon. RPM only when VITE_RPM_AVATAR_URL is set. */
export function AvatarCharacter(props: Props) {
  const rpmUrl = import.meta.env.VITE_RPM_AVATAR_URL?.trim();

  if (!rpmUrl) {
    return <CartoonRunner {...props} />;
  }

  return (
    <AvatarErrorBoundary fallback={<CartoonRunner {...props} />}>
      <Suspense fallback={<CartoonRunner {...props} />}>
        <RpmAvatar url={rpmUrl} {...props} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}
