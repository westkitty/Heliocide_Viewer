import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

interface ShipData {
  name: string;
  initialPos: [number, number, number];
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  color: string;
}

export function OrbitalInfrastructure() {
  const groupRef = useRef<THREE.Group>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const ships: ShipData[] = useMemo(() => [
    {
      name: 'Administration Cruiser "Aethelgard"',
      initialPos: [-45, 12, -90],
      orbitRadius: 95,
      orbitSpeed: 0.15,
      orbitInclination: 0.2,
      color: '#e2e8f0'
    },
    {
      name: 'Transit Ferry "Hal\'Ven Shuttle 12"',
      initialPos: [35, -10, -75],
      orbitRadius: 80,
      orbitSpeed: 0.22,
      orbitInclination: -0.15,
      color: '#94a3b8'
    },
    {
      name: 'Solar Relay Array "Alpha-Nine"',
      initialPos: [-20, 28, -130],
      orbitRadius: 130,
      orbitSpeed: 0.08,
      orbitInclination: 0.35,
      color: '#cbd5e1'
    }
  ], []);

  const shipRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    ships.forEach((ship, idx) => {
      const ref = shipRefs.current[idx];
      if (!ref) return;

      if (currentTime < 52.0) {
        // Nominal orbital flight
        const angle = currentTime * ship.orbitSpeed + idx * 2.1;
        const x = Math.cos(angle) * ship.orbitRadius * 0.5 + ship.initialPos[0];
        const z = Math.sin(angle) * ship.orbitRadius * 0.5 + ship.initialPos[2];
        const y = Math.sin(angle * 2) * 5 + ship.initialPos[1];
        ref.position.set(x, y, z);
        ref.rotation.y = -angle + Math.PI / 2;
        ref.rotation.z = ship.orbitInclination;
      } else if (currentTime < 78.0) {
        // Heliocide onset: Emergency thrust attempt
        const t = (currentTime - 52.0) / 26.0;
        const angle = (52.0 + (currentTime - 52.0) * 1.5) * ship.orbitSpeed + idx * 2.1;
        const radius = ship.orbitRadius * (1.0 - t * 0.25);
        const x = Math.cos(angle) * radius * 0.5 + ship.initialPos[0];
        const z = Math.sin(angle) * radius * 0.5 + ship.initialPos[2] * (1.0 - t * 0.3);
        const y = Math.sin(angle * 2) * 5 + ship.initialPos[1] - t * 8;
        ref.position.set(x, y, z);
        ref.rotation.x += delta * (0.5 + t * 2.0);
        ref.rotation.y += delta * (0.8 + t * 3.0);
      } else {
        // Gravitational spiral / tumble into singularity
        const decay = Math.min(1.0, (currentTime - 78.0) / 45.0);
        const spiralSpeed = 3.0 + decay * 8.0;
        const spiralRadius = Math.max(2, (1.0 - decay) * 40);
        const angle = currentTime * spiralSpeed + idx * 3.0;
        const x = Math.cos(angle) * spiralRadius;
        const z = -180 + Math.sin(angle) * spiralRadius * 0.5 + (1.0 - decay) * 60;
        const y = -decay * 40;
        ref.position.set(x, y, z);
        ref.rotation.x += delta * 4.0;
        ref.rotation.y += delta * 5.0;
        ref.rotation.z += delta * 3.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {ships.map((ship, idx) => (
        <group
          key={ship.name}
          ref={(el) => (shipRefs.current[idx] = el)}
          position={ship.initialPos}
        >
          {/* Ship Hull Geometry */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.9, 8.5]} />
            <meshStandardMaterial
              color={ship.color}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* Forward Sensor / Command Bridge */}
          <mesh position={[0, 0.6, -2.5]}>
            <boxGeometry args={[1.6, 0.6, 2.2]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0284c7"
              emissiveIntensity={currentTime > 78.0 ? 0.1 : 0.6}
            />
          </mesh>

          {/* Radiant Solar Wings / Radiator Panels */}
          <mesh position={[2.8, 0, 0]}>
            <boxGeometry args={[2.5, 0.08, 5.0]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[-2.8, 0, 0]}>
            <boxGeometry args={[2.5, 0.08, 5.0]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>

          {/* Engine Thruster Glow */}
          <mesh position={[0, 0, 4.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.8, 0.4, 16]} />
            <meshBasicMaterial
              color={currentTime > 52.0 && currentTime < 78.0 ? '#ef4444' : '#38bdf8'}
            />
          </mesh>
        </group>
      ))}

      {/* Solar Collector Ring Habitat in high orbit */}
      <group position={[0, 0, -180]} rotation={[0.4, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[52, 0.4, 16, 100]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
