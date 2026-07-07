import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { worldState } from "../game/worldState";

interface Props {
  target: React.RefObject<THREE.Group | null>;
  offset?: [number, number, number];
}

export function FollowCamera({
  target,
  offset = [0, 2.8, -6],
}: Props) {
  const vec = useRef(new THREE.Vector3());
  const shakeVec = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!target.current) return;
    const shake = worldState.fx.shake;
    const zoom = worldState.fx.speedLines ? 1.1 : 1;
    const [ox, oy, oz] = offset;
    const desired = vec.current.set(
      target.current.position.x + ox,
      target.current.position.y + oy,
      target.current.position.z + oz / zoom
    );

    if (shake > 0.01) {
      shakeVec.current.set(
        (Math.random() - 0.5) * shake * 0.35,
        (Math.random() - 0.5) * shake * 0.25,
        0
      );
      desired.add(shakeVec.current);
    }

    state.camera.position.lerp(desired, 0.14);
    const cam = state.camera;
    if (cam instanceof THREE.PerspectiveCamera) {
      const targetFov = 55 / zoom;
      if (Math.abs(cam.fov - targetFov) > 0.05) {
        cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.08);
        cam.updateProjectionMatrix();
      }
    }
    state.camera.lookAt(
      target.current.position.x,
      target.current.position.y + 1.2,
      target.current.position.z + 4
    );
  });

  return null;
}
