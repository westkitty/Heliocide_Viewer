import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

interface ShipData {
  name: string;
  type: 'cruiser' | 'shuttle' | 'solar_array';
  initialPos: [number, number, number];
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  mass: number;
  scale: number;
}

export function OrbitalInfrastructure() {
  const groupRef = useRef<THREE.Group>(null);
  const solarRingRef = useRef<THREE.Group>(null);
  const relayHabitatRef = useRef<THREE.Group>(null);
  const cargoGroupRef = useRef<THREE.Group>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const ships: ShipData[] = useMemo(() => [
    {
      name: 'Administration Cruiser "Aethelgard"',
      type: 'cruiser',
      initialPos: [-45, 12, -90],
      orbitRadius: 95,
      orbitSpeed: 0.15,
      orbitInclination: 0.2,
      mass: 8500,
      scale: 1.1
    },
    {
      name: 'Transit Ferry "Hal\'Ven Shuttle 12"',
      type: 'shuttle',
      initialPos: [35, -10, -75],
      orbitRadius: 80,
      orbitSpeed: 0.22,
      orbitInclination: -0.15,
      mass: 1200,
      scale: 0.8
    },
    {
      name: 'Solar Relay Array "Alpha-Nine"',
      type: 'solar_array',
      initialPos: [-20, 28, -130],
      orbitRadius: 130,
      orbitSpeed: 0.08,
      orbitInclination: 0.35,
      mass: 4200,
      scale: 1.3
    }
  ], []);

  const shipRefs = useRef<(THREE.Group | null)[]>([]);
  const prevPositions = useRef<THREE.Vector3[]>([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3()
  ]);

  useFrame((_, delta) => {
    if (solarRingRef.current) {
      solarRingRef.current.rotation.z += delta * 0.02;
    }
    if (relayHabitatRef.current) {
      relayHabitatRef.current.rotation.y += delta * 0.04;
      relayHabitatRef.current.rotation.x += delta * 0.01;
    }
    if (cargoGroupRef.current) {
      cargoGroupRef.current.rotation.y += delta * 0.06;
    }

    ships.forEach((ship, idx) => {
      const ref = shipRefs.current[idx];
      if (!ref) return;

      const prevPos = prevPositions.current[idx];

      if (currentTime < 52.0) {
        // Nominal Newtonian orbital arc with inertial banking
        const angle = currentTime * ship.orbitSpeed + idx * 2.1;
        const x = Math.cos(angle) * ship.orbitRadius * 0.5 + ship.initialPos[0];
        const z = Math.sin(angle) * ship.orbitRadius * 0.5 + ship.initialPos[2];
        const y = Math.sin(angle * 2) * 5 + ship.initialPos[1];
        
        ref.position.set(x, y, z);
        
        // Velocity vector alignment & centripetal banking roll
        const bankRoll = -Math.sin(angle) * 0.25 * (ship.mass > 5000 ? 0.6 : 1.2);
        ref.rotation.set(
          Math.cos(angle * 2) * 0.08,
          -angle + Math.PI / 2,
          ship.orbitInclination + bankRoll
        );
      } else if (currentTime < 78.0) {
        // Heliocide onset: Maximum emergency escape burn with heavy inertial struggle
        const t = (currentTime - 52.0) / 26.0;
        const angle = (52.0 + (currentTime - 52.0) * 1.5) * ship.orbitSpeed + idx * 2.1;
        const radius = ship.orbitRadius * (1.0 - t * 0.25);
        const x = Math.cos(angle) * radius * 0.5 + ship.initialPos[0];
        const z = Math.sin(angle) * radius * 0.5 + ship.initialPos[2] * (1.0 - t * 0.3);
        const y = Math.sin(angle * 2) * 5 + ship.initialPos[1] - t * 8;
        
        ref.position.set(x, y, z);
        
        // Jittering attitude under high-thrust load
        const thrustJitter = Math.sin(currentTime * 30.0 + idx) * 0.04 * t;
        ref.rotation.set(
          ref.rotation.x + delta * (0.5 + t * 2.0) + thrustJitter,
          ref.rotation.y + delta * (0.8 + t * 3.0),
          ref.rotation.z + thrustJitter
        );
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

      prevPos.copy(ref.position);
    });
  });

  const beaconBlink = Math.sin(currentTime * 8.0) > 0.0 ? 1.0 : 0.1;
  const isEmergency = currentTime > 52.0;
  const engineThrustScale = currentTime < 52.0 ? 1.0 : (currentTime < 78.0 ? 2.4 : 0.2);

  return (
    <group ref={groupRef}>
      {/* 1. Hero High-Fidelity Naval & Civilian Spacecraft with Dynamic Propulsion */}
      {ships.map((ship, idx) => (
        <group
          key={ship.name}
          ref={(el) => (shipRefs.current[idx] = el)}
          position={ship.initialPos}
          scale={ship.scale}
        >
          {ship.type === 'cruiser' && (
            <group>
              {/* Armored Dagger Prow Hull */}
              <mesh castShadow receiveShadow position={[0, 0, -1.2]}>
                <boxGeometry args={[3.4, 1.1, 7.2]} />
                <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Stepped Command Bridge Superstructure */}
              <mesh position={[0, 0.85, -2.2]}>
                <boxGeometry args={[2.0, 0.65, 2.6]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
              </mesh>
              {/* Command Viewport Strip */}
              <mesh position={[0, 0.95, -3.52]}>
                <boxGeometry args={[1.6, 0.22, 0.1]} />
                <meshBasicMaterial color={isEmergency ? '#ef4444' : '#38bdf8'} />
              </mesh>
              {/* Dorsal Heat Rejection Radiators with thermal glow */}
              <mesh position={[0, 1.2, 0.8]}>
                <boxGeometry args={[0.08, 1.4, 4.2]} />
                <meshStandardMaterial
                  color="#0f172a"
                  emissive={isEmergency ? '#f97316' : '#000000'}
                  emissiveIntensity={isEmergency ? 0.6 : 0.0}
                  metalness={0.95}
                  roughness={0.1}
                />
              </mesh>
              {/* Lateral Sponsons with 4x RCS Quads */}
              <mesh position={[2.1, 0, -0.4]}>
                <boxGeometry args={[0.9, 0.8, 4.0]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.3} />
              </mesh>
              <mesh position={[-2.1, 0, -0.4]}>
                <boxGeometry args={[0.9, 0.8, 4.0]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.3} />
              </mesh>
              {/* Twin Heavy Ion Fusion Thruster Nacelles */}
              <mesh position={[1.1, 0, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.65, 0.85, 1.8, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
              </mesh>
              <mesh position={[-1.1, 0, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.65, 0.85, 1.8, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
              </mesh>
              {/* Dynamic Elongated Ion Exhaust Plumes */}
              <mesh
                position={[1.1, 0, 4.2 + engineThrustScale * 0.6]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[1, engineThrustScale, 1]}
              >
                <cylinderGeometry args={[0.45, 0.1, 1.2, 16]} />
                <meshBasicMaterial
                  color={isEmergency ? (currentTime < 78.0 ? '#f97316' : '#ef4444') : '#38bdf8'}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              <mesh
                position={[-1.1, 0, 4.2 + engineThrustScale * 0.6]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[1, engineThrustScale, 1]}
              >
                <cylinderGeometry args={[0.45, 0.1, 1.2, 16]} />
                <meshBasicMaterial
                  color={isEmergency ? (currentTime < 78.0 ? '#f97316' : '#ef4444') : '#38bdf8'}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              {/* Navigation Strobe Lights */}
              <mesh position={[2.6, 0.2, -2.4]}>
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
              <mesh position={[-2.6, 0.2, -2.4]}>
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshBasicMaterial color="#10b981" />
              </mesh>
            </group>
          )}

          {ship.type === 'shuttle' && (
            <group>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.8, 4.8]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.42, 0]}>
                <boxGeometry args={[2.42, 0.06, 4.82]} />
                <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.35, -1.6]}>
                <boxGeometry args={[1.4, 0.45, 1.4]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
              <mesh
                position={[0, 0, 2.6 + engineThrustScale * 0.5]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[1, engineThrustScale, 1]}
              >
                <cylinderGeometry args={[0.4, 0.05, 1.0, 16]} />
                <meshBasicMaterial color={isEmergency ? '#f97316' : '#60a5fa'} transparent opacity={0.8} />
              </mesh>
            </group>
          )}

          {ship.type === 'solar_array' && (
            <group>
              <mesh>
                <cylinderGeometry args={[0.9, 0.9, 5.0, 16]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
              </mesh>
              <mesh position={[4.2, 0, 0]}>
                <boxGeometry args={[6.5, 0.05, 3.8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.98} roughness={0.12} />
              </mesh>
              <mesh position={[-4.2, 0, 0]}>
                <boxGeometry args={[6.5, 0.05, 3.8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.98} roughness={0.12} />
              </mesh>
              <mesh position={[0, 2.9, 0]} rotation={[-0.3, 0.4, 0]}>
                <coneGeometry args={[1.6, 0.8, 16, 1, true]} />
                <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.1} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* 2. Mega-Scale Solar Collector Ring Swarm around Hal'Ven Prime */}
      <group ref={solarRingRef} position={[0, 0, -180]} rotation={[0.45, 0.25, 0]}>
        <mesh>
          <torusGeometry args={[56, 0.6, 16, 120]} />
          <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.25} />
        </mesh>
        <mesh>
          <torusGeometry args={[62, 0.35, 16, 120]} />
          <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.15} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 56, Math.sin(angle) * 56, 0]}
            >
              <sphereGeometry args={[0.6, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={beaconBlink} />
            </mesh>
          );
        })}
      </group>

      {/* 3. Deep-Space Quantum Relay & Habitation Spindle orbiting Hal'Ven IV */}
      <group ref={relayHabitatRef} position={[52, -14, -100]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.8, 1.8, 14, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5.5, 0.45, 16, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 7.8, 0]} rotation={[-0.4, 0.2, 0]}>
          <coneGeometry args={[2.8, 1.2, 16, 1, true]} />
          <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -7.5, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={beaconBlink} />
        </mesh>
      </group>

      {/* 4. Automated Cargo Tug Swarm & Orbital Defense Pods */}
      <group ref={cargoGroupRef} position={[65, -25, -120]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const orbitR = 32 + i * 3.5;
          const theta = (i / 6) * Math.PI * 2;
          return (
            <group
              key={i}
              position={[Math.cos(theta) * orbitR, Math.sin(theta * 2) * 4, Math.sin(theta) * orbitR]}
            >
              <mesh>
                <boxGeometry args={[0.8, 0.4, 1.2]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0, 0.7]}>
                <sphereGeometry args={[0.15, 6, 6]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}
