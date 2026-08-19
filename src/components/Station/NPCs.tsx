import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * High-Fidelity Administration Crew NPC System
 *
 * Implements fully-articulated humanoid models with:
 * - PBR multi-layer Administration EVA suits
 * - Articulated limbs (pelvis, spine, shoulders, elbows, wrists, hands, hips, knees, ankles)
 * - Life-support EVA backpacks with twin O2 cylinders and status beacons
 * - Specular reflective visors with custom gold/cyan/emerald coatings
 * - Directional helmet task lights and illuminated chest telemetry matrices
 * - Realistic procedural kinematics:
 *     * Walking/running leg-swings, knee flexion, arm counter-swings, torso bobbing
 *     * Idle typing on wrist gauntlet and console
 *     * Authoritative window-watching / posture stances
 *     * Zero-G natural neutral body posture (NBP) floating with gentle limb drift
 */

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  rank: string;
  division: 'COMMAND' | 'SCIENCE' | 'SECURITY';
  primarySuitColor: string;
  accentColor: string;
  visorColor: string;
  insigniaColor: string;
  height: number;
}

const CREW_ROSTER: CrewMember[] = [
  {
    id: 'vaelen',
    name: 'Cmdr. Vaelen',
    role: 'Station Director',
    rank: 'O-6 COMMAND',
    division: 'COMMAND',
    primarySuitColor: '#1e293b',
    accentColor: '#d97706',
    visorColor: '#fbbf24',
    insigniaColor: '#f59e0b',
    height: 1.82,
  },
  {
    id: 'corin',
    name: 'Spec. Corin',
    role: 'Astrophysics & Telemetry',
    rank: 'T-4 SCIENCE',
    division: 'SCIENCE',
    primarySuitColor: '#334155',
    accentColor: '#0284c7',
    visorColor: '#38bdf8',
    insigniaColor: '#00e5ff',
    height: 1.76,
  },
  {
    id: 'selene',
    name: 'Off. Selene',
    role: 'Sector Defense Liaison',
    rank: 'S-5 SECURITY',
    division: 'SECURITY',
    primarySuitColor: '#0f172a',
    accentColor: '#059669',
    visorColor: '#34d399',
    insigniaColor: '#10b981',
    height: 1.79,
  },
];

// Waypoint data for deterministic timeline narrative
interface WaypointState {
  pos: [number, number, number];
  rotY: number;
  mode: 'OBSERVE' | 'TYPE' | 'WALK' | 'ALERT' | 'RUN' | 'ZERO_G';
  dialogue: string;
}

function getCrewWaypoint(id: string, time: number): WaypointState {
  if (id === 'vaelen') {
    if (time < 16.0) {
      return {
        pos: [-3.5, 0, -6.2],
        rotY: 0,
        mode: 'OBSERVE',
        dialogue: 'Solar flux nominal. Cluster traffic at standard density.',
      };
    } else if (time < 32.0) {
      const t = Math.min(1.0, (time - 16.0) / 10.0);
      return {
        pos: [
          THREE.MathUtils.lerp(-3.5, -1.8, t),
          0,
          THREE.MathUtils.lerp(-6.2, -3.2, t),
        ],
        rotY: Math.PI / 3,
        mode: t < 0.9 ? 'WALK' : 'ALERT',
        dialogue: 'Priority dispatch from Aureal Gate? Confirm telemetry source!',
      };
    } else if (time < 52.0) {
      return {
        pos: [-1.8, 0, -3.2],
        rotY: Math.PI / 3,
        mode: 'ALERT',
        dialogue: 'The Shard God himself? Why is sector quarantine authorization signed by divine protocol?',
      };
    } else if (time < 78.0) {
      const t = Math.min(1.0, (time - 52.0) / 18.0);
      return {
        pos: [
          THREE.MathUtils.lerp(-1.8, -0.8, t),
          0,
          THREE.MathUtils.lerp(-3.2, 8.5, t),
        ],
        rotY: Math.PI,
        mode: 'RUN',
        dialogue: 'All personnel, initiate emergency shuttle departure immediately!',
      };
    } else {
      return {
        pos: [-0.8, Math.sin(time * 1.5) * 0.4 + 0.9, 8.5],
        rotY: Math.PI + Math.sin(time * 2) * 0.25,
        mode: 'ZERO_G',
        dialogue: 'The airlock docking clamps are fused—gravitational shear is tearing the ring!',
      };
    }
  } else if (id === 'corin') {
    if (time < 16.0) {
      return {
        pos: [-7.8, 0, -1.0],
        rotY: Math.PI / 2,
        mode: 'TYPE',
        dialogue: 'Stellar corona baseline steady at 5,800 Kelvin.',
      };
    } else if (time < 32.0) {
      const t = Math.min(1.0, (time - 16.0) / 10.0);
      return {
        pos: [
          THREE.MathUtils.lerp(-7.8, -1.2, t),
          0,
          THREE.MathUtils.lerp(-1.0, -1.8, t),
        ],
        rotY: -Math.PI / 6,
        mode: t < 0.9 ? 'WALK' : 'ALERT',
        dialogue: 'Starsilk signature detected... reality coefficients are dropping across the cluster.',
      };
    } else if (time < 52.0) {
      return {
        pos: [-1.2, 0, -1.8],
        rotY: -Math.PI / 6,
        mode: 'TYPE',
        dialogue: 'This isn\'t a localized orbital strike. The central mass calculations... he\'s collapsing the entire star.',
      };
    } else if (time < 78.0) {
      const t = Math.min(1.0, (time - 52.0) / 20.0);
      return {
        pos: [
          THREE.MathUtils.lerp(-1.2, 0.6, t),
          0,
          THREE.MathUtils.lerp(-1.8, 9.2, t),
        ],
        rotY: Math.PI,
        mode: 'RUN',
        dialogue: 'Singularity threshold reached! Sensor arrays are blinding out!',
      };
    } else {
      return {
        pos: [0.6, Math.sin(time * 1.8 + 1.2) * 0.5 + 0.8, 9.2],
        rotY: Math.PI * 0.9 + Math.cos(time * 1.5) * 0.2,
        mode: 'ZERO_G',
        dialogue: 'The distant systems... they\'re blinking out one by one...',
      };
    }
  } else {
    // Selene
    if (time < 16.0) {
      return {
        pos: [4.2, 0, -4.5],
        rotY: -Math.PI / 4,
        mode: 'OBSERVE',
        dialogue: 'Hal\'Ven IV defensive garrisons reporting all channels clear.',
      };
    } else if (time < 32.0) {
      const t = Math.min(1.0, (time - 16.0) / 8.0);
      return {
        pos: [
          THREE.MathUtils.lerp(4.2, 1.8, t),
          0,
          THREE.MathUtils.lerp(-4.5, -3.0, t),
        ],
        rotY: -Math.PI / 3,
        mode: t < 0.9 ? 'WALK' : 'ALERT',
        dialogue: 'Drakken weaponized Starsilk at the gate? That was supposed to be impossible!',
      };
    } else if (time < 52.0) {
      return {
        pos: [1.8, 0, -3.0],
        rotY: -Math.PI / 3,
        mode: 'ALERT',
        dialogue: 'The Shard God was hurt. He\'s sealing the cluster to cut the infection.',
      };
    } else if (time < 78.0) {
      const t = Math.min(1.0, (time - 52.0) / 16.0);
      return {
        pos: [
          THREE.MathUtils.lerp(1.8, 0.0, t),
          0,
          THREE.MathUtils.lerp(-3.0, 7.8, t),
        ],
        rotY: Math.PI,
        mode: 'RUN',
        dialogue: 'Radiation shielding failed! Get to the transport bay!',
      };
    } else {
      return {
        pos: [0.0, Math.sin(time * 2.0 + 2.4) * 0.6 + 1.0, 7.8],
        rotY: Math.PI * 1.15 + Math.sin(time * 1.2) * 0.3,
        mode: 'ZERO_G',
        dialogue: 'The Siege Wall... it\'s not a wall... it\'s a grave.',
      };
    }
  }
}

/**
 * Individual Articulated Crew Character Component
 */
function ArticulatedCrewCharacter({ member }: { member: CrewMember }) {
  const isCatastrophe = useTimelineStore((s) => s.currentTime >= 52.0);

  const rootRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);

  // Reusable materials
  const suitMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: member.primarySuitColor,
        metalness: 0.35,
        roughness: 0.65,
      }),
    [member.primarySuitColor]
  );

  const armorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: member.accentColor,
        metalness: 0.7,
        roughness: 0.3,
      }),
    [member.accentColor]
  );

  const visorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: member.visorColor,
        emissive: member.visorColor,
        emissiveIntensity: 0.45,
        metalness: 0.95,
        roughness: 0.08,
      }),
    [member.visorColor]
  );

  const telemetryMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: member.insigniaColor,
        emissive: member.insigniaColor,
        emissiveIntensity: 0.9,
        metalness: 0.1,
        roughness: 0.2,
      }),
    [member.insigniaColor]
  );

  // Fast procedural animation loop
  useFrame((state) => {
    const wp = getCrewWaypoint(member.id, useTimelineStore.getState().currentTime);
    const time = state.clock.getElapsedTime();

    if (rootRef.current) {
      rootRef.current.position.set(...wp.pos);
      rootRef.current.rotation.y = wp.rotY;
    }

    // Kinematic joint animations based on active mode
    if (wp.mode === 'WALK' || wp.mode === 'RUN') {
      const walkFreq = wp.mode === 'RUN' ? 10.0 : 6.0;
      const legAmp = wp.mode === 'RUN' ? 0.75 : 0.45;
      const armAmp = wp.mode === 'RUN' ? 0.65 : 0.35;
      const walkCycle = time * walkFreq;

      // Leg swing (counter-phase)
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(walkCycle) * legAmp;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(walkCycle) * legAmp;

      // Knee flexion during back-swing
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = Math.max(0, -Math.sin(walkCycle) * 0.8);
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = Math.max(0, Math.sin(walkCycle) * 0.8);
      }

      // Arms swing in opposite phase to legs
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(walkCycle) * armAmp;
        leftArmRef.current.rotation.z = 0.15;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(walkCycle) * armAmp;
        rightArmRef.current.rotation.z = -0.15;
      }

      if (leftForearmRef.current) leftForearmRef.current.rotation.x = -0.3;
      if (rightForearmRef.current) rightForearmRef.current.rotation.x = -0.3;

      // Spine forward pitch when running
      if (spineRef.current) {
        spineRef.current.rotation.x = wp.mode === 'RUN' ? 0.2 : 0.05;
        spineRef.current.rotation.y = Math.sin(walkCycle) * 0.08;
      }
    } else if (wp.mode === 'OBSERVE') {
      // Hands behind back / authoritative observation stance
      const breath = Math.sin(time * 1.5) * 0.02;

      if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0.06);
      if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, -0.06);
      if (leftKneeRef.current) leftKneeRef.current.rotation.set(0, 0, 0);
      if (rightKneeRef.current) rightKneeRef.current.rotation.set(0, 0, 0);

      // Arms clasped at lower back
      if (leftArmRef.current) leftArmRef.current.rotation.set(-0.35, 0.2, 0.15);
      if (rightArmRef.current) rightArmRef.current.rotation.set(-0.35, -0.2, -0.15);
      if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.6, 0.3, 0);
      if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.6, -0.3, 0);

      if (spineRef.current) spineRef.current.rotation.set(breath, 0, 0);
      if (headRef.current) headRef.current.rotation.set(Math.sin(time * 0.7) * 0.05 - 0.05, Math.cos(time * 0.5) * 0.1, 0);
    } else if (wp.mode === 'TYPE') {
      // Typing on console or wrist gauntlet
      const breath = Math.sin(time * 2.0) * 0.02;
      const typeWiggle = Math.sin(time * 12.0) * 0.08;

      if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0.05);
      if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, -0.05);
      if (leftKneeRef.current) leftKneeRef.current.rotation.set(0, 0, 0);
      if (rightKneeRef.current) rightKneeRef.current.rotation.set(0, 0, 0);

      // Arms raised toward console interface
      if (leftArmRef.current) leftArmRef.current.rotation.set(0.7, 0.2, -0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.set(0.75 + typeWiggle * 0.5, -0.2, 0.1);
      if (leftForearmRef.current) leftForearmRef.current.rotation.set(-0.7, 0.2, 0);
      if (rightForearmRef.current) rightForearmRef.current.rotation.set(-0.8 + typeWiggle, -0.2, 0);

      if (spineRef.current) spineRef.current.rotation.set(0.1 + breath, 0, 0);
      if (headRef.current) headRef.current.rotation.set(0.15, Math.sin(time * 0.8) * 0.15, 0);
    } else if (wp.mode === 'ALERT') {
      // Urgent gesturing / looking between console and window
      const breath = Math.sin(time * 4.0) * 0.04;
      const gesture = Math.sin(time * 3.0) * 0.25;

      if (leftLegRef.current) leftLegRef.current.rotation.set(0.1, 0, 0.08);
      if (rightLegRef.current) rightLegRef.current.rotation.set(-0.1, 0, -0.08);
      if (leftKneeRef.current) leftKneeRef.current.rotation.set(0.1, 0, 0);
      if (rightKneeRef.current) rightKneeRef.current.rotation.set(0.05, 0, 0);

      if (leftArmRef.current) leftArmRef.current.rotation.set(0.8 + gesture, 0.3, 0.2);
      if (rightArmRef.current) rightArmRef.current.rotation.set(0.3, -0.3, -0.2);
      if (leftForearmRef.current) leftForearmRef.current.rotation.set(-0.4, 0.2, 0);
      if (rightForearmRef.current) rightForearmRef.current.rotation.set(-0.6, -0.2, 0);

      if (spineRef.current) spineRef.current.rotation.set(0.08 + breath, Math.sin(time * 2.0) * 0.15, 0);
      if (headRef.current) headRef.current.rotation.set(-0.1, Math.cos(time * 2.5) * 0.3, 0);
    } else if (wp.mode === 'ZERO_G') {
      // Natural Zero-G Neutral Body Posture (NBP) floating with gentle limb drift
      const floatTime = time * 1.5;

      if (leftLegRef.current) {
        leftLegRef.current.rotation.set(0.35 + Math.sin(floatTime * 0.8) * 0.15, 0, 0.15);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.set(0.4 + Math.cos(floatTime * 0.7) * 0.15, 0, -0.15);
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.set(0.55 + Math.sin(floatTime * 1.1) * 0.1, 0, 0);
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.set(0.6 + Math.cos(floatTime * 1.0) * 0.1, 0, 0);
      }

      // Arms floating relaxed in front of torso
      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(0.5 + Math.sin(floatTime * 0.9) * 0.2, 0.3, 0.35);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.set(0.55 + Math.cos(floatTime * 0.85) * 0.2, -0.3, -0.35);
      }
      if (leftForearmRef.current) leftForearmRef.current.rotation.set(-0.5, 0, 0);
      if (rightForearmRef.current) rightForearmRef.current.rotation.set(-0.55, 0, 0);

      if (spineRef.current) {
        spineRef.current.rotation.set(
          Math.sin(floatTime * 0.6) * 0.12,
          Math.cos(floatTime * 0.5) * 0.15,
          Math.sin(floatTime * 0.4) * 0.1
        );
      }
      if (headRef.current) {
        headRef.current.rotation.set(
          Math.sin(floatTime * 0.7) * 0.1,
          Math.cos(floatTime * 0.9) * 0.2,
          0
        );
      }
    }
  });

  const wp = getCrewWaypoint(member.id, useTimelineStore.getState().currentTime);

  return (
    <group ref={rootRef} position={wp.pos} rotation={[0, wp.rotY, 0]}>
      {/* Root Pelvis Group */}
      <group position={[0, 0.92, 0]}>
        {/* Pelvic Armor & Utility Belt */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.16, 0.24]} />
          <primitive object={armorMaterial} attach="material" />
        </mesh>
        {/* Belt Buckle & Mag-Holster */}
        <mesh position={[0, 0, 0.13]}>
          <boxGeometry args={[0.08, 0.08, 0.03]} />
          <primitive object={accentMaterial} attach="material" />
        </mesh>
        <mesh position={[0.18, -0.02, 0]}>
          <boxGeometry args={[0.06, 0.12, 0.12]} />
          <primitive object={armorMaterial} attach="material" />
        </mesh>

        {/* ---------------- UPPER BODY / SPINE ---------------- */}
        <group ref={spineRef} position={[0, 0.1, 0]}>
          {/* Abdominal Compression Ribbing */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.16, 0.22, 10]} />
            <primitive object={suitMaterial} attach="material" />
          </mesh>

          {/* Chest Carapace Cuirass */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.42, 0.32, 0.28]} />
            <primitive object={armorMaterial} attach="material" />
          </mesh>

          {/* Chest Telemetry Status Display Matrix */}
          <mesh position={[0, 0.36, 0.145]}>
            <planeGeometry args={[0.16, 0.1]} />
            <primitive object={telemetryMaterial} attach="material" />
          </mesh>

          {/* Division Collar Trim Strip */}
          <mesh position={[0, 0.5, 0.05]}>
            <boxGeometry args={[0.26, 0.04, 0.22]} />
            <primitive object={accentMaterial} attach="material" />
          </mesh>

          {/* EVA Life-Support Backpack */}
          <group position={[0, 0.34, -0.2]}>
            {/* Main Recirculator Housing */}
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.42, 0.14]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Twin High-Pressure O2 Canisters */}
            <mesh position={[-0.11, 0.02, -0.06]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.38, 8]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>
            <mesh position={[0.11, 0.02, -0.06]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.38, 8]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>
            {/* Emergency Status Beacon on Backpack */}
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color={isCatastrophe ? '#ef4444' : member.insigniaColor} />
            </mesh>
          </group>

          {/* ---------------- HEAD & HELMET ---------------- */}
          <group ref={headRef} position={[0, 0.58, 0]}>
            {/* Neck Ring Gasket */}
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.06, 12]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>

            {/* Helmet Shell Dome */}
            <mesh castShadow>
              <sphereGeometry args={[0.16, 20, 16]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>

            {/* Helmet Top Ridge Crest */}
            <mesh position={[0, 0.12, -0.02]}>
              <boxGeometry args={[0.06, 0.06, 0.24]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>

            {/* Curving Specular Gold/Reflective Visor */}
            <mesh position={[0, 0.01, 0.08]} rotation={[0.1, 0, 0]}>
              <sphereGeometry args={[0.13, 16, 16, 0, Math.PI, 0, Math.PI * 0.6]} />
              <primitive object={visorMaterial} attach="material" />
            </mesh>

            {/* Helmet Comms Ear-Pods */}
            <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>
            <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>

            {/* Directional Helmet Headlamp */}
            <mesh position={[0, 0.14, 0.1]}>
              <boxGeometry args={[0.05, 0.03, 0.04]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          </group>

          {/* ---------------- LEFT ARM ---------------- */}
          <group ref={leftArmRef} position={[-0.26, 0.44, 0]}>
            {/* Shoulder Pauldron Armor Plate */}
            <mesh position={[-0.04, 0, 0]} castShadow>
              <sphereGeometry args={[0.09, 10, 10]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>
            {/* Bicep Sleeve */}
            <mesh position={[-0.03, -0.14, 0]}>
              <cylinderGeometry args={[0.055, 0.05, 0.18, 8]} />
              <primitive object={suitMaterial} attach="material" />
            </mesh>

            {/* Left Forearm & Gauntlet */}
            <group ref={leftForearmRef} position={[-0.03, -0.24, 0]}>
              {/* Elbow Joint Ring */}
              <mesh position={[0, 0.02, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
              {/* Forearm Gauntlet with Wrist Terminal */}
              <mesh position={[0, -0.11, 0]} castShadow>
                <boxGeometry args={[0.09, 0.18, 0.09]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
              {/* Wrist Holographic Interface Screen */}
              <mesh position={[-0.048, -0.08, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[0.06, 0.08]} />
                <primitive object={telemetryMaterial} attach="material" />
              </mesh>
              {/* Gloved Hand */}
              <mesh position={[0, -0.24, 0]}>
                <boxGeometry args={[0.06, 0.08, 0.05]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
            </group>
          </group>

          {/* ---------------- RIGHT ARM ---------------- */}
          <group ref={rightArmRef} position={[0.26, 0.44, 0]}>
            {/* Shoulder Pauldron Armor Plate */}
            <mesh position={[0.04, 0, 0]} castShadow>
              <sphereGeometry args={[0.09, 10, 10]} />
              <primitive object={accentMaterial} attach="material" />
            </mesh>
            {/* Bicep Sleeve */}
            <mesh position={[0.03, -0.14, 0]}>
              <cylinderGeometry args={[0.055, 0.05, 0.18, 8]} />
              <primitive object={suitMaterial} attach="material" />
            </mesh>

            {/* Right Forearm & Gauntlet */}
            <group ref={rightForearmRef} position={[0.03, -0.24, 0]}>
              {/* Elbow Joint Ring */}
              <mesh position={[0, 0.02, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
              {/* Forearm Gauntlet */}
              <mesh position={[0, -0.11, 0]} castShadow>
                <boxGeometry args={[0.09, 0.18, 0.09]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
              {/* Gloved Hand */}
              <mesh position={[0, -0.24, 0]}>
                <boxGeometry args={[0.06, 0.08, 0.05]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
            </group>
          </group>
        </group>

        {/* ---------------- LEFT LEG ---------------- */}
        <group ref={leftLegRef} position={[-0.12, -0.08, 0]}>
          {/* Thigh Armor */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.065, 0.32, 8]} />
            <primitive object={suitMaterial} attach="material" />
          </mesh>

          {/* Left Shin & Knee */}
          <group ref={leftKneeRef} position={[0, -0.34, 0]}>
            {/* Knee Pad Protector */}
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.11, 0.1, 0.06]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Shin Guard */}
            <mesh position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.06, 0.32, 8]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Heavy Magnetic Deck Boot */}
            <mesh position={[0, -0.38, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.1, 0.22]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Boot Sole Magnetic Lock LED */}
            <mesh position={[0, -0.42, 0.04]}>
              <planeGeometry args={[0.08, 0.16]} />
              <meshBasicMaterial color={isCatastrophe ? '#ef4444' : '#10b981'} />
            </mesh>
          </group>
        </group>

        {/* ---------------- RIGHT LEG ---------------- */}
        <group ref={rightLegRef} position={[0.12, -0.08, 0]}>
          {/* Thigh Armor */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.065, 0.32, 8]} />
            <primitive object={suitMaterial} attach="material" />
          </mesh>

          {/* Right Shin & Knee */}
          <group ref={rightKneeRef} position={[0, -0.34, 0]}>
            {/* Knee Pad Protector */}
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.11, 0.1, 0.06]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Shin Guard */}
            <mesh position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.06, 0.32, 8]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Heavy Magnetic Deck Boot */}
            <mesh position={[0, -0.38, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.1, 0.22]} />
              <primitive object={armorMaterial} attach="material" />
            </mesh>
            {/* Boot Sole Magnetic Lock LED */}
            <mesh position={[0, -0.42, 0.04]}>
              <planeGeometry args={[0.08, 0.16]} />
              <meshBasicMaterial color={isCatastrophe ? '#ef4444' : '#10b981'} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Holographic In-World Nameplate & Telemetry Tag */}
      <group position={[0, 2.15, 0]}>
        <Text
          depthOffset={-1}
          fontSize={0.11}
          color="#f8fafc"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.012}
          outlineColor="#020617"
        >
          {member.name}
        </Text>
        <Text
          depthOffset={-1}
          position={[0, -0.12, 0]}
          fontSize={0.075}
          color={member.insigniaColor}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.008}
          outlineColor="#020617"
        >
          {member.rank} // {member.role}
        </Text>
      </group>
    </group>
  );
}

export function NPCs() {
    const setSubtitle = useTimelineStore((s) => s.setSubtitle);

  // Synchronize narrative subtitle state without high-frequency React churn
  useFrame(() => {
    const time = useTimelineStore.getState().currentTime;
    const v = getCrewWaypoint('vaelen', time);
    const c = getCrewWaypoint('corin', time);
    const s = getCrewWaypoint('selene', time);
    
    const phase = useTimelineStore.getState().currentPhase;
    let nextSubtitle = null;

    if (phase === 'PHASE_A_NORMAL') {
      nextSubtitle = 'Observation Station HV-88 — Hal\'Ven Cluster — Nominal Operations';
    } else if (phase === 'PHASE_B_AUREAL_ALERT') {
      nextSubtitle = `[Officer Selene]: "${s.dialogue}"`;
    } else if (phase === 'PHASE_C_SHARD_GOD_AUTHORITY') {
      nextSubtitle = `[Commander Vaelen]: "${v.dialogue}"`;
    } else if (phase === 'PHASE_D_HELIOCIDE') {
      nextSubtitle = `[Specialist Corin]: "${c.dialogue}"`;
    } else if (phase === 'PHASE_E_CASCADE') {
      nextSubtitle = `[Commander Vaelen]: "${v.dialogue}"`;
    } else if (phase === 'PHASE_F_SIEGE_WALL') {
      nextSubtitle = `[Officer Selene]: "${s.dialogue}"`;
    } else if (phase === 'PHASE_G_STATION_LOSS') {
      nextSubtitle = 'SYSTEM TELEMETRY TERMINATED — CONTAINMENT ACHIEVED';
    }
    
    if (useTimelineStore.getState().activeSubtitle !== nextSubtitle) {
      setSubtitle(nextSubtitle);
    }
  });

  return (
    <group name="station-npcs">
      {CREW_ROSTER.map((member) => (
        <ArticulatedCrewCharacter key={member.id} member={member} />
      ))}
    </group>
  );
}
