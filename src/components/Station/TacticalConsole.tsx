import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';
import { soundSystem } from '../../audio/SoundSystem';

export function TacticalConsole() {
  const holoRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const currentPhase = useTimelineStore((s) => s.currentPhase);

  useFrame((_, delta) => {
    if (holoRef.current) {
      holoRef.current.rotation.y += delta * 0.4;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.8;
      ringRef1.current.rotation.x += delta * 0.2;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * 0.6;
      ringRef2.current.rotation.y += delta * 0.3;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundSystem.playConsoleBeep();
    useTimelineStore.getState().setTacticalModalOpen(true, 'OVERVIEW');
  };

  const isAlert = currentPhase !== 'PHASE_A_NORMAL';
  const holoColor = currentPhase === 'PHASE_C_SHARD_GOD_AUTHORITY' ? '#00ffff' : isAlert ? '#f59e0b' : '#38bdf8';

  return (
    <group position={[0, 0, -3]} onClick={handleClick}>
      {/* Console Pedestal Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.5, 1.0, 8]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Console Top Table Ring */}
      <mesh position={[0, 1.02, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.2, 0.08, 16]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Hologram Projector Lens */}
      <mesh position={[0, 1.07, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.04, 32]} />
        <meshBasicMaterial color={holoColor} />
      </mesh>

      {/* 3D Floating Holographic Projection */}
      <group ref={holoRef} position={[0, 1.7, 0]}>
        {/* Central Tactical Node */}
        <mesh>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color={holoColor} wireframe />
        </mesh>

        {/* Tactical Orbital Rings */}
        <mesh ref={ringRef1}>
          <torusGeometry args={[0.45, 0.015, 8, 32]} />
          <meshBasicMaterial color={holoColor} transparent opacity={0.7} />
        </mesh>
        <mesh ref={ringRef2}>
          <torusGeometry args={[0.65, 0.015, 8, 32]} />
          <meshBasicMaterial color={holoColor} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* World-space Interactive Floating Prompt */}
      <group position={[0, 2.35, 0]}>
        <Text
          depthOffset={-1}
          fontSize={0.13}
          color={holoColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {isAlert ? '⚠ TACTICAL ALERT — CLICK TO INSPECT' : '[E] ACCESS TACTICAL CONSOLE'}
        </Text>
        <Text
          depthOffset={-1}
          position={[0, -0.16, 0]}
          fontSize={0.09}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          {currentTime < 32.0 ? 'HAL\'VEN CLUSTER SECTOR MAP' : 'SHARD GOD DOSSIER AVAILABLE'}
        </Text>
      </group>
    </group>
  );
}
