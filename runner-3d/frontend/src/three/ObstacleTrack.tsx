import { useMemo } from "react";

interface Obstacle {
  id: number;
  z: number;
  kind: "barrel" | "cone" | "crate";
}

interface Props {
  obstacles: Obstacle[];
  scrollZ: number;
}

export function ObstacleTrack({ obstacles, scrollZ }: Props) {
  const trackLength = 200;
  const segments = useMemo(() => Array.from({ length: 40 }, (_, i) => i), []);

  return (
    <group position={[0, 0, -scrollZ]}>
      {/* Ground track */}
      {segments.map((i) => (
        <group key={i} position={[0, 0, i * 5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
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

      {/* Cartoon trees */}
      {segments.filter((_, i) => i % 3 === 0).map((i) => (
        <group key={`tree-l-${i}`} position={[-6, 0, i * 5]}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 2, 8]} />
            <meshStandardMaterial color="#92400e" />
          </mesh>
          <mesh position={[0, 2.8, 0]} castShadow>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
        </group>
      ))}

      {obstacles.map((o) => (
        <ObstacleMesh key={o.id} kind={o.kind} position={[0, 0, o.z]} />
      ))}

      {/* Finish line */}
      <mesh position={[0, 0.01, trackLength]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
    </group>
  );
}

function ObstacleMesh({
  kind,
  position,
}: {
  kind: Obstacle["kind"];
  position: [number, number, number];
}) {
  if (kind === "barrel") {
    return (
      <mesh position={[position[0], 0.6, position[2]]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 12]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    );
  }
  if (kind === "cone") {
    return (
      <mesh position={[position[0], 0.5, position[2]]} castShadow>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    );
  }
  return (
    <mesh position={[position[0], 0.5, position[2]]} castShadow>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}

export type { Obstacle };
