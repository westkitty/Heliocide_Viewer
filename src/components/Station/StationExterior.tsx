import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

export function StationExterior() {
  const exteriorGroupRef = useRef<THREE.Group>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const beaconBlink = Math.sin(currentTime * 6.0) > 0 ? 1.0 : 0.1;
  const isEmergency = currentTime > 52.0;

  useFrame(() => {
    if (currentTime > 78.0 && exteriorGroupRef.current) {
      // Catastrophic station structural deformation under gravitational shear
      const decay = Math.min(1.0, (currentTime - 78.0) / 45.0);
      exteriorGroupRef.current.rotation.z = Math.sin(currentTime * 2.0) * 0.05 * decay;
      exteriorGroupRef.current.rotation.x = Math.cos(currentTime * 1.5) * 0.04 * decay;
    }
  });

  return (
    <group ref={exteriorGroupRef} name="station-exterior-architecture">
      {/* 1. Observation Cupola Outer Armored Visor & Cowling (Z = -8.2 to -14.0) */}
      <group position={[0, 4.0, -8.6]}>
        {/* Heavy Upper Brow Armor Overhang */}
        <mesh position={[0, 4.2, -1.8]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[22, 1.6, 4.5]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
        {/* Lower Sill Armor Cowling */}
        <mesh position={[0, -4.2, -1.8]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[22, 1.6, 4.5]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
        {/* Lateral Structural Cupola Braces */}
        <mesh position={[-10.2, 0, -1.2]}>
          <boxGeometry args={[2.2, 10, 3.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[10.2, 0, -1.2]}>
          <boxGeometry args={[2.2, 10, 3.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
        </mesh>
      </group>

      {/* 2. Forward Sensor Spires & Interferometry Antenna Arrays */}
      <group position={[0, 8.5, -11.0]}>
        {/* Central Spine Mast */}
        <mesh position={[0, 4.0, 0]}>
          <cylinderGeometry args={[0.25, 0.45, 8.0, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Forward Transceiver Tip Beacon */}
        <mesh position={[0, 8.2, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial
            color={isEmergency ? '#ef4444' : '#38bdf8'}
            transparent
            opacity={beaconBlink}
          />
        </mesh>
        {/* Cross-Arm Interferometer Arrays */}
        <mesh position={[0, 5.0, 0]}>
          <boxGeometry args={[12, 0.15, 0.3]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-6, 5.0, 0]}>
          <sphereGeometry args={[0.2, 6, 6]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={beaconBlink} />
        </mesh>
        <mesh position={[6, 5.0, 0]}>
          <sphereGeometry args={[0.2, 6, 6]} />
          <meshBasicMaterial color="#10b981" transparent opacity={beaconBlink} />
        </mesh>
      </group>

      {/* 3. Lateral Mooring Spines & Docking Gantry Trusses */}
      <group position={[-16, 3.5, -2]}>
        {/* Left Port Mooring Arm */}
        <mesh position={[-8, 0, 0]}>
          <boxGeometry args={[16, 1.8, 2.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
        </mesh>
        {/* Docking Bay Guidance Lights */}
        {[-4, -8, -12].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, 1.0, 0]}>
            <sphereGeometry args={[0.25, 6, 6]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={beaconBlink} />
          </mesh>
        ))}
      </group>

      <group position={[16, 3.5, -2]}>
        {/* Right Starboard Mooring Arm */}
        <mesh position={[8, 0, 0]}>
          <boxGeometry args={[16, 1.8, 2.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
        </mesh>
        {/* Docking Bay Guidance Lights */}
        {[4, 8, 12].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, 1.0, 0]}>
            <sphereGeometry args={[0.25, 6, 6]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={beaconBlink} />
          </mesh>
        ))}
      </group>

      {/* 4. Giant Ventral Heat Rejection Radiators */}
      <group position={[0, -5.5, -4]}>
        {[-6, 0, 6].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, -4.0, 0]}>
            <boxGeometry args={[0.1, 8.0, 14.0]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive={isEmergency ? '#f97316' : '#000000'}
              emissiveIntensity={isEmergency ? 0.4 : 0.0}
              metalness={0.96}
              roughness={0.15}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
