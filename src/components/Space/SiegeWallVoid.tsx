import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * The Siege Wall in physical space:
 * An enormous expanding irregular swath of pure starless blackness across the physical sky.
 * CANON LAW: MUST NEVER BE RENDERED AS A VISIBLE LATTICE, WIREFRAME, OR GRID IN PHYSICAL SPACE.
 */

export function SiegeWallVoid() {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  useFrame(() => {
    if (!meshRef.current) return;

    if (currentTime < 78.0) {
      meshRef.current.visible = false;
      meshRef.current.scale.set(0.001, 0.001, 0.001);
    } else {
      meshRef.current.visible = true;
      // Expands from t=78s to t=122s
      const progress = Math.min(1.0, (currentTime - 78.0) / 44.0);
      const scaleX = 80 + progress * 320;
      const scaleY = 60 + progress * 240;
      const scaleZ = 120 + progress * 280;
      meshRef.current.scale.set(scaleX, scaleY, scaleZ);
      
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.min(1.0, progress * 1.5);
      }
    }
  });

  return (
    <group position={[120, 40, -350]} rotation={[0.2, -0.4, 0.1]}>
      {/* Non-geometric irregular absorbing void silhouette */}
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.0}
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
