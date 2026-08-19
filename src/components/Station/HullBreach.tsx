import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';

export function HullBreach() {
  const breachGroupRef = useRef<THREE.Group>(null);
  const sparkLightRef = useRef<THREE.PointLight>(null);
  const arcLightRef = useRef<THREE.PointLight>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (breachGroupRef.current) {
      if (currentTime < 78.0) {
        breachGroupRef.current.position.set(0, 0, 0);
        breachGroupRef.current.rotation.set(0, 0, 0);
      } else {
        const breachProgress = Math.min(1.0, (currentTime - 78.0) / 16.0);
        // Structural tear outward into vacuum
        breachGroupRef.current.position.x = breachProgress * 0.95;
        breachGroupRef.current.position.y = breachProgress * 0.45;
        breachGroupRef.current.rotation.z = breachProgress * 0.4;
        breachGroupRef.current.rotation.y = -breachProgress * 0.25;
      }
    }

    // Violent intermittent high-voltage electrical sparking
    if (sparkLightRef.current && arcLightRef.current) {
      if (currentTime >= 78.0) {
        const sparkNoise = Math.sin(time * 65.0) * Math.cos(time * 43.0);
        const isArcing = sparkNoise > 0.65;
        sparkLightRef.current.intensity = isArcing ? 4.5 : 0.2;
        arcLightRef.current.intensity = isArcing ? 3.0 : 0.0;
      } else {
        sparkLightRef.current.intensity = 0;
        arcLightRef.current.intensity = 0;
      }
    }
  });

  if (currentTime < 78.0) {
    // Nominal sealed bulkhead
    return (
      <group position={[8.8, 3.5, 2.5]}>
        <mesh>
          <boxGeometry args={[0.25, 5.2, 5.0]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
        </mesh>
        <Text
          depthOffset={-1}
          position={[-0.15, 1.8, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.18}
          color="#64748b"
        >
          STRUCTURAL BULKHEAD 08-R
        </Text>
      </group>
    );
  }

  return (
    <group position={[8.8, 3.5, 2.5]}>
      {/* 1. Catastrophic Hull Rupture Frame */}
      <group ref={breachGroupRef}>
        {/* Curled Upper Jagged Titanium Shard */}
        <mesh position={[0.4, 1.8, -0.6]} rotation={[0.2, 0.4, 0.6]}>
          <boxGeometry args={[0.15, 2.4, 1.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Torn Lower Jagged Shard peeling downward */}
        <mesh position={[0.5, -1.6, 0.8]} rotation={[-0.3, -0.2, -0.7]}>
          <boxGeometry args={[0.15, 2.2, 2.0]} />
          <meshStandardMaterial color="#18181b" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Scorched Jagged Center Ribs */}
        <mesh position={[0.2, 0.2, -1.2]} rotation={[0.4, 0.1, 0.3]}>
          <boxGeometry args={[0.2, 1.6, 0.8]} />
          <meshStandardMaterial color="#7c2d12" metalness={0.85} roughness={0.35} />
        </mesh>
      </group>

      {/* 2. Exposed Internal Rib Framing & Insulation Batting */}
      <group position={[-0.1, 0, 0]}>
        {/* Sheared Structural Frame Stubs */}
        {[-1.8, -0.6, 0.6, 1.8].map((yOffset, idx) => (
          <mesh key={idx} position={[0, yOffset, 0]} rotation={[0, 0, 0.2 * (idx % 2 === 0 ? 1 : -1)]}>
            <boxGeometry args={[0.3, 0.2, 4.4]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}

        {/* Severed Conduit Bundle with Arcing Electrodes */}
        <mesh position={[-0.05, 0.8, -1.4]} rotation={[0.3, 0.5, 1.2]}>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.05, -0.7, 1.2]} rotation={[-0.4, -0.3, 1.0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* 3. Dynamic Spark & Electrical Arc Discharge Lights */}
      <pointLight ref={sparkLightRef} position={[-0.2, 0.8, -1.4]} color="#f97316" distance={8} />
      <pointLight ref={arcLightRef} position={[-0.2, -0.7, 1.2]} color="#67e8f9" distance={8} />

      {/* 4. Critical Warning Holographic HUD */}
      <Text
        depthOffset={-1}
        position={[-0.3, 2.2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.24}
        color="#ef4444"
      >
        ⚠ CRITICAL HULL INTEGRITY FAILURE
      </Text>
      <Text
        depthOffset={-1}
        position={[-0.3, 1.8, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.14}
        color="#fca5a5"
      >
        ATMOSPHERE VENTING // SEAL CORRIDOR 04
      </Text>
    </group>
  );
}
