import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const DEBRIS_COUNT = 36;

interface DebrisItem {
  initialPos: [number, number, number];
  rotSpeed: [number, number, number];
  floatSpeed: number;
  floatAmplitude: number;
  type: 'box' | 'panel' | 'canister';
  scale: number;
}

export function DebrisField() {
  const groupRef = useRef<THREE.Group>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const debrisItems: DebrisItem[] = useMemo(() => {
    const items: DebrisItem[] = [];
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      items.push({
        initialPos: [
          (Math.random() - 0.5) * 14,
          Math.random() * 4.5 + 0.5,
          (Math.random() - 0.5) * 12
        ],
        rotSpeed: [
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0
        ],
        floatSpeed: 0.5 + Math.random() * 1.5,
        floatAmplitude: 0.3 + Math.random() * 0.8,
        type: i % 3 === 0 ? 'panel' : i % 3 === 1 ? 'box' : 'canister',
        scale: 0.2 + Math.random() * 0.4
      });
    }
    return items;
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (currentTime < 78.0) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const severity = Math.min(1.0, (currentTime - 78.0) / 20.0);

    debrisItems.forEach((item, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      // Zero-G floating drift
      const t = currentTime * item.floatSpeed;
      const yOffset = Math.sin(t) * item.floatAmplitude * severity;
      const xOffset = Math.cos(t * 0.7) * (item.floatAmplitude * 0.5) * severity;
      const zOffset = Math.sin(t * 0.5) * (item.floatAmplitude * 0.5) * severity;

      mesh.position.set(
        item.initialPos[0] + xOffset,
        item.initialPos[1] + yOffset,
        item.initialPos[2] + zOffset
      );

      mesh.rotation.x += item.rotSpeed[0] * delta * severity;
      mesh.rotation.y += item.rotSpeed[1] * delta * severity;
      mesh.rotation.z += item.rotSpeed[2] * delta * severity;
    });
  });

  return (
    <group ref={groupRef}>
      {debrisItems.map((item, idx) => (
        <mesh
          key={idx}
          ref={(el) => (meshRefs.current[idx] = el)}
          position={item.initialPos}
          scale={item.scale}
        >
          {item.type === 'panel' ? (
            <boxGeometry args={[1.2, 0.05, 0.8]} />
          ) : item.type === 'box' ? (
            <boxGeometry args={[0.6, 0.6, 0.6]} />
          ) : (
            <cylinderGeometry args={[0.2, 0.2, 0.8, 12]} />
          )}
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#334155' : '#475569'}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
