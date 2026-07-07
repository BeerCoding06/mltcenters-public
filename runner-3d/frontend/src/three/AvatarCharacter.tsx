import { Component, type ReactNode, Suspense } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { worldState } from "../game/worldState";
import { CartoonRunner } from "./CartoonRunner";

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

function RpmAvatar({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const clone = useRef(scene.clone(true));
  const { actions, mixer } = useAnimations(animations, group);
  const lastAnim = useRef(worldState.animState);

  useEffect(() => {
    if (!animations.length) return;
    const key =
      Object.keys(actions).find((k) => k.toLowerCase().includes("run")) ||
      Object.keys(actions)[0];
    const action = key ? actions[key] : null;
    if (!action) return;
    Object.values(actions).forEach((a) => a?.fadeOut(0.15));
    action.reset().fadeIn(0.15).play();
  }, [actions, animations.length]);

  useFrame((_, delta) => {
    mixer?.update(delta);
    if (group.current) group.current.position.y = worldState.jumpHeight;
    if (lastAnim.current !== worldState.animState) {
      lastAnim.current = worldState.animState;
    }
  });

  return (
    <group ref={group} scale={1.1}>
      <primitive object={clone.current} />
    </group>
  );
}

export function AvatarCharacter() {
  const rpmUrl = import.meta.env.VITE_RPM_AVATAR_URL?.trim();

  if (!rpmUrl) {
    return <CartoonRunner />;
  }

  return (
    <AvatarErrorBoundary fallback={<CartoonRunner />}>
      <Suspense fallback={<CartoonRunner />}>
        <RpmAvatar url={rpmUrl} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}
