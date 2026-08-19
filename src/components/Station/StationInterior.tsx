import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';
import { MathUtils } from 'three';
import { TacticalConsole } from './TacticalConsole';
import { NPCs } from './NPCs';
import { DebrisField } from './DebrisField';
import { StationExterior } from './StationExterior';
import { ObservationGlass } from './ObservationGlass';
import { HullBreach } from './HullBreach';
import { DecompressionVFX } from './DecompressionVFX';

export function StationInterior() {
  const breachRef = useRef<THREE.Group>(null);
  const emergencyLightRef = useRef<THREE.PointLight>(null);
  const overheadLightRef = useRef<THREE.PointLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const windowRimLightRef = useRef<THREE.DirectionalLight>(null);
  const consoleSpotlightRef = useRef<THREE.SpotLight>(null);
  const strobeGroupRef = useRef<THREE.Group>(null);
  const structuralGroupRef = useRef<THREE.Group>(null);
  const ceilingGroupRef = useRef<THREE.Group>(null);
  const rearGroupRef = useRef<THREE.Group>(null);

  const currentTime = useTimelineStore((s) => s.currentTime);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Rotate emergency strobe beacons during alarms
    if (strobeGroupRef.current) {
      if (currentTime > 52.0) {
        strobeGroupRef.current.rotation.y = time * 6.0;
      } else {
        strobeGroupRef.current.rotation.y = 0;
      }
    }

    // Dynamic station catastrophic lighting overhaul
    if (
      emergencyLightRef.current &&
      overheadLightRef.current &&
      ambientLightRef.current &&
      windowRimLightRef.current &&
      consoleSpotlightRef.current
    ) {
      if (currentTime < 52.0) {
        // Phase A & B: Nominal operation with bright overhead power and warm solar illumination
        ambientLightRef.current.intensity = 0.35;
        ambientLightRef.current.color.set('#bae6fd');

        overheadLightRef.current.intensity = 1.2;
        overheadLightRef.current.color.set('#f8fafc');

        emergencyLightRef.current.intensity = 0.4;
        emergencyLightRef.current.color.set('#38bdf8');

        consoleSpotlightRef.current.intensity = 1.5;
        consoleSpotlightRef.current.color.set('#38bdf8');

        windowRimLightRef.current.intensity = 1.8;
        windowRimLightRef.current.color.set('#fff4e6');
      } else if (currentTime < 78.0) {
        // Phase D (Collapse): Blinding flash followed by catastrophic main generator failure
        const collapseT = (currentTime - 52.0) / 26.0;
        
        // Power grid failure flickering
        const powerFlicker = Math.sin(currentTime * 30.0) > 0 ? 0.2 : 0.02;
        overheadLightRef.current.intensity = (1.0 - collapseT) * powerFlicker * 1.5;
        overheadLightRef.current.color.set('#fed7aa');

        ambientLightRef.current.intensity = THREE.MathUtils.lerp(0.35, 0.06, collapseT);
        ambientLightRef.current.color.set('#0f172a');

        // Pulsing amber/red emergency warning
        const alertPulse = Math.sin(currentTime * 8.0) * 0.5 + 0.5;
        emergencyLightRef.current.intensity = 1.6 * alertPulse + 0.2;
        emergencyLightRef.current.color.set('#ef4444');

        consoleSpotlightRef.current.intensity = 0.6 * alertPulse;
        consoleSpotlightRef.current.color.set('#ef4444');

        // Window sunlight shifting from solar flash to dim cyan accretion
        windowRimLightRef.current.intensity = THREE.MathUtils.lerp(2.5, 0.4, collapseT);
        windowRimLightRef.current.color.set('#00f0ff');
      } else {
        // Phase E, F, G: Total power grid collapse, deep-space gloom, persistent emergency warning strobe
        ambientLightRef.current.intensity = 0.14; // Deep emergency ambient baseline
        ambientLightRef.current.color.set('#1e1b4b');

        overheadLightRef.current.intensity = 0.0; // Complete main power blackout

        // High-contrast emergency red pulsing strobe + continuous emergency level
        const strobe = (Math.sin(currentTime * 6.0) * 0.5 + 0.5) * 2.4 + 0.8;
        emergencyLightRef.current.intensity = strobe;
        emergencyLightRef.current.color.set('#ef4444');

        consoleSpotlightRef.current.intensity = 0.8;
        consoleSpotlightRef.current.color.set('#ef4444');

        // Faint cold accretion blue light penetrating the observation glass
        windowRimLightRef.current.intensity = 0.6;
        windowRimLightRef.current.color.set('#0284c7');
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

    if (currentTime >= 104.0) {
      const t = Math.min(1.0, (currentTime - 104.0) / 20.0);
      const ease = t * t;
      if (structuralGroupRef.current) {
        structuralGroupRef.current.position.x = MathUtils.lerp(0, -15.0, ease);
        structuralGroupRef.current.rotation.y = MathUtils.lerp(0, -0.4, ease);
        structuralGroupRef.current.rotation.z = MathUtils.lerp(0, -0.2, ease);
      }
      if (ceilingGroupRef.current) {
        ceilingGroupRef.current.position.y = MathUtils.lerp(0, 18.0, ease);
        ceilingGroupRef.current.rotation.x = MathUtils.lerp(0, -0.3, ease);
        ceilingGroupRef.current.rotation.z = MathUtils.lerp(0, 0.2, ease);
      }
      if (rearGroupRef.current) {
        rearGroupRef.current.position.z = MathUtils.lerp(0, 20.0, ease);
        rearGroupRef.current.rotation.x = MathUtils.lerp(0, 0.4, ease);
      }
    } else {
      if (structuralGroupRef.current) {
        structuralGroupRef.current.position.set(0,0,0);
        structuralGroupRef.current.rotation.set(0,0,0);
      }
      if (ceilingGroupRef.current) {
        ceilingGroupRef.current.position.set(0,0,0);
        ceilingGroupRef.current.rotation.set(0,0,0);
      }
      if (rearGroupRef.current) {
        rearGroupRef.current.position.set(0,0,0);
        rearGroupRef.current.rotation.set(0,0,0);
      }
    }
  });

  return (
    <group name="station-interior">
      {/* 1. Brushed Dark Titanium Modular Deck Plates */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[18, 0.1, 16]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.88}
          roughness={0.22}
        />
      </mesh>

      {/* Non-Skid Rubber Polymer Floor Guideline Inlays with Recessed Edge Luminaire */}
      <mesh position={[0, 0.01, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 13]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={currentTime > 52.0 ? 0.1 : 0.45}
          metalness={0.15}
          roughness={0.8}
        />
      </mesh>

      {/* Floor Guide Path Linear LED Strips */}
      {[-0.95, 0.95].map((xOffset, idx) => (
        <mesh key={`path-led-${idx}`} position={[xOffset, 0.02, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 13]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive={currentTime > 52.0 ? '#ef4444' : '#38bdf8'}
            emissiveIntensity={0.8}
            metalness={0.1}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Lateral Floor Hazard Caution Inlays */}
      {[-6, 6].map((xPos, idx) => (
        <mesh key={idx} position={[xPos, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 14]} />
          <meshStandardMaterial
            color="#eab308"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* 2. Anodized Titanium Window Arch & Structural Braces (Z = -7.9) */}
      <group position={[0, 3.5, -7.9]}>
        {/* Upper Arch Frame */}
        <mesh position={[0, 3.8, 0]}>
          <boxGeometry args={[18, 0.8, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.18} />
        </mesh>
        {/* Left / Right Heavy Window Pillars */}
        <mesh position={[-8.5, 0, 0]}>
          <boxGeometry args={[1.0, 7.5, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.18} />
        </mesh>
        <mesh position={[8.5, 0, 0]}>
          <boxGeometry args={[1.0, 7.5, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.18} />
        </mesh>
        {/* Chamfered Structural Intermediate Ribs */}
        <mesh position={[-3, 0, 0]}>
          <boxGeometry args={[0.3, 7.5, 0.5]} />
          <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[3, 0, 0]}>
          <boxGeometry args={[0.3, 7.5, 0.5]} />
          <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Low Safety Railing Barrier along Window Sill */}
        <mesh position={[0, -3.2, 0.4]}>
          <boxGeometry args={[16, 0.4, 0.2]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Custom Physical Reinforced Observation Glass */}
        <ObservationGlass />
      </group>

      {/* 3. Ceiling with Reinforced Structural Trusses, Linear Luminaires & Colored Utility Conduits */}
      <mesh position={[0, 7.0, 0]}>
        <boxGeometry args={[18, 0.2, 16]} />
        <meshStandardMaterial color="#0b0f19" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-5, 0, 5].map((zPos, i) => (
        <group key={i} position={[0, 6.7, zPos]}>
          {/* Main Transverse Gantry Beam */}
          <mesh>
            <boxGeometry args={[17.8, 0.35, 0.45]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Linear Luminaire Strip Fixture */}
          <mesh position={[0, -0.19, 0]}>
            <boxGeometry args={[12, 0.04, 0.12]} />
            <meshStandardMaterial
              color="#f8fafc"
              emissive={currentTime > 52.0 ? (currentTime > 78.0 ? '#000000' : '#ef4444') : '#f8fafc'}
              emissiveIntensity={currentTime > 52.0 ? (currentTime > 78.0 ? 0.0 : 0.8) : 1.2}
              metalness={0.2}
              roughness={0.2}
            />
          </mesh>
          {/* Conduit Line 1: Primary Coolant (Cyan) */}
          <mesh position={[0, -0.22, 0.18]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 17.6, 8]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Conduit Line 2: Life Support Atmosphere (Green) */}
          <mesh position={[0, -0.22, 0.0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 17.6, 8]} />
            <meshStandardMaterial color="#10b981" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Conduit Line 3: High-Voltage Magnetics (Amber) */}
          <mesh position={[0, -0.22, -0.18]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 17.6, 8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Emergency Rotating Strobe Beacon Pods */}
      <group ref={strobeGroupRef} position={[0, 6.4, -2]}>
        {[-4, 4].map((xPos, idx) => (
          <group key={idx} position={[xPos, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.15, 0.18, 0.25, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.15, 0]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={currentTime > 52.0 ? 1.5 : 0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Left Wall with Diagnostic Monitors, Air Quality Sensor, and Stencils */}
      <mesh position={[-8.9, 3.5, 0]}>
        <boxGeometry args={[0.2, 7.0, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Wall Diagnostic Terminals */}
      <group position={[-8.7, 3.0, -1]}>
        <mesh>
          <boxGeometry args={[0.1, 1.8, 3.5]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
        </mesh>
        <Text
          depthOffset={-1}
          position={[0.1, 0.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.16}
          color="#f0f9ff"
        >
          HV-88 ASTRO-TELEMETRY
        </Text>
      </group>

      {/* Stamped Bulkhead Serial Decal on Left Wall */}
      <Text
        depthOffset={-1}
        position={[-8.7, 5.2, 2.0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.2}
        color="#64748b"
      >
        SECTOR 04 // OBS-DECK // HV-88
      </Text>

      {/* 5. Right Wall with Structural Breach Bulkhead & Emergency Locker */}
      <mesh position={[8.9, 3.5, -4]}>
        <boxGeometry args={[0.2, 7.0, 8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Emergency O2 Breathing Apparatus Locker */}
      <group position={[8.7, 2.5, -3.5]}>
        <mesh>
          <boxGeometry args={[0.25, 2.0, 1.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <Text
          depthOffset={-1}
          position={[-0.15, 0.6, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.12}
          color="#10b981"
        >
          EMERGENCY O2
        </Text>
      </group>

      {/* Dynamic Hull Breach Architecture */}
      <HullBreach />

      {/* Atmospheric Decompression Particle VFX */}
      <DecompressionVFX />

      {/* 6. Back Wall & Evacuation Corridor (Z = 7.9) */}
      <mesh position={[-5.5, 3.5, 7.9]}>
        <boxGeometry args={[7.0, 7.0, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[5.5, 3.5, 7.9]}>
        <boxGeometry args={[7.0, 7.0, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Corridor Overhead Arch */}
      <mesh position={[0, 5.5, 7.9]}>
        <boxGeometry args={[4.0, 3.0, 0.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Evacuation Signage */}
      <Text
        depthOffset={-1}
        position={[0, 4.3, 7.7]}
        fontSize={0.25}
        color={currentTime > 52.0 ? '#ef4444' : '#38bdf8'}
        anchorX="center"
        anchorY="middle"
      >
        EVACUATION BAY 04 / SHUTTLE DOCK
      </Text>

      {/* Dynamic Catastrophic Practical Lighting Architecture */}
      <ambientLight ref={ambientLightRef} intensity={0.35} color="#bae6fd" />
      <pointLight ref={overheadLightRef} position={[0, 5.5, 0]} intensity={1.2} distance={15} color="#f8fafc" />
      <pointLight ref={emergencyLightRef} position={[0, 4.5, -2]} intensity={0.8} distance={12} color="#38bdf8" />
      <spotLight
        ref={consoleSpotlightRef}
        position={[0, 6.2, -0.5]}
        angle={0.65}
        penumbra={0.5}
        intensity={1.5}
        color="#38bdf8"
        distance={10}
      />
      <directionalLight ref={windowRimLightRef} position={[0, 8, -20]} intensity={1.8} color="#fff4e6" />

      {/* Interactive Central Tactical Console */}
      <TacticalConsole />

      {/* Inhabitant Crew NPCs */}
      <NPCs />

      {/* Zero-G Floating Physical Debris during Breach */}
      <DebrisField />

      {/* Hero-Tier Exterior Megastructure Architecture */}
      <StationExterior />
    </group>
  );
}
