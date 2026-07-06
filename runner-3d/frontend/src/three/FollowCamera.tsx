import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  target: React.RefObject<THREE.Group | null>;
  offset?: [number, number, number];
}

/** Third-person camera that follows the runner. */
export function FollowCamera({ target, offset = [0, 2.8, -6] }: Props) {
  const vec = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!target.current) return;
    const [ox, oy, oz] = offset;
    const desired = vec.current.set(
      target.current.position.x + ox,
      target.current.position.y + oy,
      target.current.position.z + oz
    );
    state.camera.position.lerp(desired, 0.08);
    state.camera.lookAt(
      target.current.position.x,
      target.current.position.y + 1.2,
      target.current.position.z + 4
    );
  });

  return null;
}
