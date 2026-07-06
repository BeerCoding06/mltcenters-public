import { useMemo } from "react";
import type { Obstacle, ObstacleKind } from "../game/types";

export type { Obstacle, ObstacleKind };

interface Props {
  obstacles: Obstacle[];
  scrollZ: number;
}

const SEG_LEN = 5;
const SEGMENTS_AHEAD = 48;
const SEGMENTS_BEHIND = 6;

export function ObstacleTrack({ obstacles, scrollZ }: Props) {
  const segmentZs = useMemo(() => {
    const anchor = Math.floor(scrollZ / SEG_LEN) * SEG_LEN;
    const start = anchor - SEGMENTS_BEHIND * SEG_LEN;
    return Array.from(
      { length: SEGMENTS_AHEAD + SEGMENTS_BEHIND },
      (_, i) => start + i * SEG_LEN
    );
  }, [Math.floor(scrollZ / SEG_LEN)]);

  const runwayCenterZ = scrollZ + 55;

  return (
    <group position={[0, 0, -scrollZ]}>
      {/* พื้นยาวต่อเนื่อง — กัน obstacle ลอยกลางอากาศ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, runwayCenterZ]}
        receiveShadow
      >
        <planeGeometry args={[9, 280]} />
        <meshStandardMaterial color="#3cb371" />
      </mesh>

      {segmentZs.map((segZ) => (
        <group key={segZ} position={[0, 0, segZ]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
            <planeGeometry args={[8, SEG_LEN]} />
            <meshStandardMaterial
              color={Math.floor(segZ / SEG_LEN) % 2 === 0 ? "#4ade80" : "#22c55e"}
            />
          </mesh>
          <mesh position={[-4.2, 0.5, 0]} castShadow>
            <boxGeometry args={[0.3, 1, SEG_LEN]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
          <mesh position={[4.2, 0.5, 0]} castShadow>
            <boxGeometry args={[0.3, 1, SEG_LEN]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}

      {segmentZs
        .filter((z) => Math.floor(z / SEG_LEN) % 3 === 0)
        .map((segZ) => (
          <group key={`tree-${segZ}`} position={[-5.5, 0, segZ]}>
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
      <mesh position={[0, 0.55, z]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#78716c" transparent opacity={opacity} />
      </mesh>
    );
  }
  if (kind === "woodBox") {
    return (
      <mesh position={[0, 0.45, z]} castShadow>
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
      <group position={[0, 0, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.35, 0.85, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
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
