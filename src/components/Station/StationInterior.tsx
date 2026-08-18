import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';
import { TacticalConsole } from './TacticalConsole';
import { NPCs } from './NPCs';
import { DebrisField } from './DebrisField';

export function StationInterior() {
  const breachRef = useRef<THREE.Group>(null);
  const emergencyLightRef = useRef<THREE.PointLight>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const currentPhase = useTimelineStore((s) => s.currentPhase);

  useFrame(() => {
    // Dynamic station lights & emergency flashing
    if (emergencyLightRef.current) {
      if (currentPhase === 'PHASE_A_NORMAL') {
        emergencyLightRef.current.intensity = 0.5;
        emergencyLightRef.current.color.set('#38bdf8');
      } else if (currentPhase === 'PHASE_B_AUREAL_ALERT' || currentPhase === 'PHASE_C_SHARD_GOD_AUTHORITY') {
        emergencyLightRef.current.intensity = 1.0 + Math.sin(currentTime * 5.0) * 0.5;
        emergencyLightRef.current.color.set('#f59e0b');
      } else {
        // Red flashing emergency
        const flash = Math.sin(currentTime * 10.0) > 0 ? 2.5 : 0.2;
        emergencyLightRef.current.intensity = flash;
        emergencyLightRef.current.color.set('#ef4444');
      }
    }

    // Physical hull breach animation during Phase E onwards
    if (breachRef.current) {
      if (currentTime < 78.0) {
        breachRef.current.position.set(0, 0, 0);
        breachRef.current.rotation.set(0, 0, 0);
      } else {
        const breachProgress = Math.min(1.0, (currentTime - 78.0) / 20.0);
        breachRef.current.position.x = breachProgress * 0.8;
        breachRef.current.position.y = breachProgress * 0.4;
        breachRef.current.rotation.z = breachProgress * 0.35;
      }
    }
  });

  return (
    <group name="station-interior">
      {/* 1. Main Observation Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[18, 0.1, 16]} />
        <meshStandardMaterial
          color="#0b0f19"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Floor Guideline inlays */}
      <mesh position={[0, 0.01, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 12]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.5}
        />
      </mesh>

      {/* 2. Panoramic Window Frame & Glass Facing Space (Z = -7.5) */}
      <group position={[0, 3.5, -7.9]}>
        {/* Upper Arch Frame */}
        <mesh position={[0, 3.8, 0]}>
          <boxGeometry args={[18, 0.8, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Left / Right Window Pillars */}
        <mesh position={[-8.5, 0, 0]}>
          <boxGeometry args={[1.0, 7.5, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[8.5, 0, 0]}>
          <boxGeometry args={[1.0, 7.5, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-3, 0, 0]}>
          <boxGeometry args={[0.3, 7.5, 0.5]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[3, 0, 0]}>
          <boxGeometry args={[0.3, 7.5, 0.5]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Transparent Reinforced Observation Glass */}
        <mesh>
          <planeGeometry args={[16, 7.0]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.08}
            roughness={0.05}
            transmission={0.95}
            thickness={0.5}
          />
        </mesh>
      </group>

      {/* 3. Ceiling with Reinforced Structural Trusses */}
      <mesh position={[0, 7.0, 0]}>
        <boxGeometry args={[18, 0.2, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {[-5, 0, 5].map((zPos, i) => (
        <mesh key={i} position={[0, 6.8, zPos]}>
          <boxGeometry args={[17.8, 0.3, 0.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* 4. Left Wall with Diagnostic Monitors */}
      <mesh position={[-8.9, 3.5, 0]}>
        <boxGeometry args={[0.2, 7.0, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Wall Diagnostic Terminals */}
      <group position={[-8.7, 3.0, -1]}>
        <mesh>
          <boxGeometry args={[0.1, 1.8, 3.5]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
        </mesh>
        <Text
          position={[0.1, 0.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.16}
          color="#f0f9ff"
        >
          HV-88 ASTRO-TELEMETRY
        </Text>
      </group>

      {/* 5. Right Wall with Structural Breach Bulkhead */}
      <mesh position={[8.9, 3.5, -4]}>
        <boxGeometry args={[0.2, 7.0, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Dynamic Rupture Bulkhead Section */}
      <group ref={breachRef} position={[8.8, 3.5, 3]}>
        <mesh>
          <boxGeometry args={[0.3, 5.0, 4.5]} />
          <meshStandardMaterial
            color={currentTime > 78.0 ? '#451a03' : '#1e293b'}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {currentTime > 78.0 && (
          <group position={[0.2, 0, 0]}>
            {/* Sparking Breach Points */}
            <pointLight color="#f97316" intensity={2.5} distance={6} />
            <Text
              position={[0, 1.5, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              fontSize={0.22}
              color="#ef4444"
            >
              ⚠ CRITICAL HULL BREACH
            </Text>
          </group>
        )}
      </group>

      {/* 6. Back Wall & Evacuation Corridor (Z = 7.9) */}
      <mesh position={[-5.5, 3.5, 7.9]}>
        <boxGeometry args={[7.0, 7.0, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[5.5, 3.5, 7.9]}>
        <boxGeometry args={[7.0, 7.0, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Corridor Overhead Arch */}
      <mesh position={[0, 5.5, 7.9]}>
        <boxGeometry args={[4.0, 3.0, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </mesh>

      {/* Evacuation Signage */}
      <Text
        position={[0, 4.3, 7.7]}
        fontSize={0.25}
        color={currentTime > 52.0 ? '#ef4444' : '#38bdf8'}
        anchorX="center"
        anchorY="middle"
      >
        EVACUATION BAY 04 / SHUTTLE DOCK
      </Text>

      {/* Corridor Extension Geometry */}
      <group position={[0, 0, 11]}>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[3.8, 0.1, 6.0]} />
          <meshStandardMaterial color="#090d16" roughness={0.3} />
        </mesh>
        <mesh position={[-2.0, 2.0, 0]}>
          <boxGeometry args={[0.2, 4.0, 6.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        <mesh position={[2.0, 2.0, 0]}>
          <boxGeometry args={[0.2, 4.0, 6.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
      </group>

      {/* Lighting Architecture */}
      <ambientLight intensity={0.4} color="#e0f2fe" />
      <pointLight position={[0, 5.5, 0]} intensity={1.2} distance={15} color="#bae6fd" />
      <pointLight ref={emergencyLightRef} position={[0, 4.5, -2]} intensity={0.8} distance={12} />

      {/* Interactive Central Tactical Console */}
      <TacticalConsole />

      {/* Inhabitant Crew NPCs */}
      <NPCs />

      {/* Zero-G Floating Physical Debris during Breach */}
      <DebrisField />
    </group>
  );
}
