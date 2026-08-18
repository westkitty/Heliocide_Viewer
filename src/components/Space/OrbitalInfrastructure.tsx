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
  const solarRingRef = useRef<THREE.Group>(null);
  const relayHabitatRef = useRef<THREE.Group>(null);
  const cargoGroupRef = useRef<THREE.Group>(null);
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
    // Solar Ring Rotation
    if (solarRingRef.current) {
      solarRingRef.current.rotation.z += delta * 0.02;
    }

    // Orbital Relay Habitat Precession
    if (relayHabitatRef.current) {
      relayHabitatRef.current.rotation.y += delta * 0.04;
      relayHabitatRef.current.rotation.x += delta * 0.01;
    }

    // Cargo Swarm Orbital Drifting
    if (cargoGroupRef.current) {
      cargoGroupRef.current.rotation.y += delta * 0.06;
    }

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

  const beaconBlink = Math.sin(currentTime * 8.0) > 0.0 ? 1.0 : 0.1;
  const isEmergency = currentTime > 52.0;

  return (
    <group ref={groupRef}>
      {/* 1. High-Detail Administration Patrol Cruisers & Traffic */}
      {ships.map((ship, idx) => (
        <group
          key={ship.name}
          ref={(el) => (shipRefs.current[idx] = el)}
          position={ship.initialPos}
        >
          {/* Main Armored Chassis Hull */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.9, 8.5]} />
            <meshStandardMaterial
              color={ship.color}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* Forward Sensor / Command Bridge with Multi-Deck Glass */}
          <mesh position={[0, 0.65, -2.6]}>
            <boxGeometry args={[1.8, 0.65, 2.4]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive={isEmergency ? '#ef4444' : '#0ea5e9'}
              emissiveIntensity={currentTime > 78.0 ? 0.2 : 0.8}
              roughness={0.1}
            />
          </mesh>

          {/* Lateral Gantry Outriggers & Solar Wings */}
          <mesh position={[3.2, 0, 0]}>
            <boxGeometry args={[3.4, 0.08, 5.5]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.95}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[-3.2, 0, 0]}>
            <boxGeometry args={[3.4, 0.08, 5.5]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.95}
              roughness={0.15}
            />
          </mesh>

          {/* Navigation Positional Beacons (Port Red / Starboard Green / Spine White) */}
          <mesh position={[4.9, 0.1, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[-4.9, 0.1, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[0, 1.1, -3.6]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={beaconBlink}
            />
          </mesh>

          {/* Ion Thruster Vectoring Assemblies */}
          <mesh position={[0, 0, 4.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.7, 0.9, 0.5, 16]} />
            <meshBasicMaterial
              color={isEmergency ? (currentTime < 78.0 ? '#f97316' : '#ef4444') : '#38bdf8'}
            />
          </mesh>
        </group>
      ))}

      {/* 2. Mega-Scale Solar Collector Ring Swarm around Hal'Ven Prime */}
      <group ref={solarRingRef} position={[0, 0, -180]} rotation={[0.45, 0.25, 0]}>
        {/* Structural Torus Ring Truss */}
        <mesh>
          <torusGeometry args={[56, 0.6, 16, 120]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.92}
            roughness={0.25}
          />
        </mesh>
        {/* Concentric Secondary Photovoltaic Rail */}
        <mesh>
          <torusGeometry args={[62, 0.35, 16, 120]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
        {/* Synchronous Ring Strobe Beacons */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 56, Math.sin(angle) * 56, 0]}
            >
              <sphereGeometry args={[0.6, 8, 8]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={beaconBlink}
              />
            </mesh>
          );
        })}
      </group>

      {/* 3. Deep-Space Quantum Relay & Habitation Spindle orbiting Hal'Ven IV */}
      <group ref={relayHabitatRef} position={[52, -14, -100]}>
        {/* Central Habitation Cylinder */}
        <mesh castShadow>
          <cylinderGeometry args={[1.8, 1.8, 14, 16]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.88}
            roughness={0.2}
          />
        </mesh>
        {/* Counter-Rotating Gravity Wheel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5.5, 0.45, 16, 32]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        {/* High-Gain Quantum Antenna Dish */}
        <mesh position={[0, 7.8, 0]} rotation={[-0.4, 0.2, 0]}>
          <coneGeometry args={[2.8, 1.2, 16, 1, true]} />
          <meshStandardMaterial
            color="#eab308"
            metalness={0.95}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Docking Gantry Guidance Beacon */}
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
