import { useMemo } from "react";
import type { Obstacle, ObstacleKind } from "../game/types";

export type { Obstacle, ObstacleKind };

interface Props {
  obstacles: Obstacle[];
  scrollZ: number;
}

const POOL_SIZE = 24;

export function ObstacleTrack({ obstacles, scrollZ }: Props) {
  const segments = useMemo(() => Array.from({ length: 40 }, (_, i) => i), []);

  return (
    <group position={[0, 0, -scrollZ]}>
      {segments.map((i) => (
        <group key={i} position={[0, 0, i * 5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[8, 5]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#4ade80" : "#22c55e"} />
          </mesh>
          <mesh position={[-4.2, 0.5, 0]} castShadow>
            <boxGeometry args={[0.3, 1, 5]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
          <mesh position={[4.2, 0.5, 0]} castShadow>
            <boxGeometry args={[0.3, 1, 5]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}

      {segments
        .filter((_, i) => i % 3 === 0)
        .map((i) => (
          <group key={`tree-${i}`} position={[-5.5, 0, i * 5]}>
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.35, 2, 8]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
            <mesh position={[0, 2.6, 0]} castShadow>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>
          </group>
        ))}

      {obstacles.map((o) => (
        <ObstacleMesh key={o.id} kind={o.kind} z={o.z} cleared={o.cleared} />
      ))}

      <mesh position={[0, 0.01, POOL_SIZE * 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
    </group>
  );
}

function ObstacleMesh({
  kind,
  z,
  cleared,
}: {
  kind: ObstacleKind;
  z: number;
  cleared: boolean;
}) {
  const opacity = cleared ? 0.25 : 1;

  if (kind === "rock") {
    return (
      <mesh position={[0, 0.45, z]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#78716c" transparent opacity={opacity} />
      </mesh>
    );
  }
  if (kind === "woodBox") {
    return (
      <mesh position={[0, 0.5, z]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#a16207" transparent opacity={opacity} />
      </mesh>
    );
  }
  if (kind === "fence") {
    return (
      <group position={[0, 0, z]}>
        <mesh position={[-0.35, 0.45, 0]} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.08]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0.35, 0.45, 0]} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.08]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.9, 0.08, 0.08]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.9, 0.08, 0.08]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      </group>
    );
  }
  if (kind === "hole") {
    return (
      <mesh position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.85, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    );
  }
  if (kind === "tree") {
    return (
      <group position={[0, 0, z]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.28, 1.4, 8]} />
          <meshStandardMaterial color="#78350f" transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <coneGeometry args={[0.65, 1.2, 8]} />
          <meshStandardMaterial color="#15803d" transparent opacity={opacity} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={[0, 0.55, z]} castShadow>
      <boxGeometry args={[1.1, 1.1, 0.25]} />
      <meshStandardMaterial color="#dc2626" transparent opacity={opacity} />
    </mesh>
  );
}
