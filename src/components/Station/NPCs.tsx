import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';

interface NPCDef {
  id: string;
  name: string;
  role: string;
  suitColor: string;
  visorColor: string;
}

const NPC_DATA: NPCDef[] = [
  {
    id: 'vaelen',
    name: 'Commander Vaelen',
    role: 'Station Director',
    suitColor: '#334155', // Charcoal slate
    visorColor: '#38bdf8'  // Blue visor
  },
  {
    id: 'corin',
    name: 'Specialist Corin',
    role: 'Telemetry & Astrophysics',
    suitColor: '#1e293b', // Deep navy
    visorColor: '#f59e0b'  // Amber visor
  },
  {
    id: 'selene',
    name: 'Officer Selene',
    role: 'Sector Defense Liaison',
    suitColor: '#475569', // Steel grey
    visorColor: '#10b981'  // Emerald visor
  }
];

export function NPCs() {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const currentPhase = useTimelineStore((s) => s.currentPhase);
  const setSubtitle = useTimelineStore((s) => s.setSubtitle);

  const vaelenRef = useRef<THREE.Group>(null);
  const corinRef = useRef<THREE.Group>(null);
  const seleneRef = useRef<THREE.Group>(null);

  // Compute waypoint positions and dialogue for each NPC deterministically from timeline
  const getNPCTransform = (id: string, time: number) => {
    let pos: [number, number, number] = [0, 0, 0];
    let rotY = 0;
    let dialogue = '';

    if (id === 'vaelen') {
      if (time < 16.0) {
        pos = [-3.5, 0, -6.2];
        rotY = 0;
        dialogue = 'Solar flux nominal. Cluster traffic at standard density.';
      } else if (time < 32.0) {
        const t = Math.min(1.0, (time - 16.0) / 10.0);
        pos = [
          THREE.MathUtils.lerp(-3.5, -1.8, t),
          0,
          THREE.MathUtils.lerp(-6.2, -3.2, t)
        ];
        rotY = Math.PI / 3;
        dialogue = 'Priority dispatch from Aureal Gate? Confirm telemetry source!';
      } else if (time < 52.0) {
        pos = [-1.8, 0, -3.2];
        rotY = Math.PI / 3;
        dialogue = 'The Shard God himself? Why is sector quarantine authorization signed by divine protocol?';
      } else if (time < 78.0) {
        const t = Math.min(1.0, (time - 52.0) / 18.0);
        pos = [
          THREE.MathUtils.lerp(-1.8, -0.8, t),
          0,
          THREE.MathUtils.lerp(-3.2, 8.5, t)
        ];
        rotY = Math.PI;
        dialogue = 'All personnel, initiate emergency shuttle departure immediately!';
      } else {
        pos = [-0.8, Math.sin(time * 2) * 0.4 + 0.3, 8.5];
        rotY = Math.PI + Math.sin(time * 3) * 0.2;
        dialogue = 'The airlock docking clamps are fused—gravitational shear is tearing the ring!';
      }
    } else if (id === 'corin') {
      if (time < 16.0) {
        pos = [-7.8, 0, -1.0];
        rotY = Math.PI / 2;
        dialogue = 'Stellar corona baseline steady at 5,800 Kelvin.';
      } else if (time < 32.0) {
        const t = Math.min(1.0, (time - 16.0) / 10.0);
        pos = [
          THREE.MathUtils.lerp(-7.8, -1.2, t),
          0,
          THREE.MathUtils.lerp(-1.0, -1.8, t)
        ];
        rotY = -Math.PI / 6;
        dialogue = 'Starsilk signature detected... reality coefficients are dropping across the cluster.';
      } else if (time < 52.0) {
        pos = [-1.2, 0, -1.8];
        rotY = -Math.PI / 6;
        dialogue = 'This isn\'t a localized orbital strike. The central mass calculations... he\'s collapsing the entire star.';
      } else if (time < 78.0) {
        const t = Math.min(1.0, (time - 52.0) / 20.0);
        pos = [
          THREE.MathUtils.lerp(-1.2, 0.6, t),
          0,
          THREE.MathUtils.lerp(-1.8, 9.2, t)
        ];
        rotY = Math.PI;
        dialogue = 'Singularity threshold reached! Sensor arrays are blinding out!';
      } else {
        pos = [0.6, Math.sin(time * 2.5 + 1) * 0.5 + 0.2, 9.2];
        rotY = Math.PI * 0.9;
        dialogue = 'The distant systems... they\'re blinking out one by one...';
      }
    } else if (id === 'selene') {
      if (time < 16.0) {
        pos = [4.2, 0, -4.5];
        rotY = -Math.PI / 4;
        dialogue = 'Hal\'Ven IV defensive garrisons reporting all channels clear.';
      } else if (time < 32.0) {
        const t = Math.min(1.0, (time - 16.0) / 8.0);
        pos = [
          THREE.MathUtils.lerp(4.2, 1.8, t),
          0,
          THREE.MathUtils.lerp(-4.5, -3.0, t)
        ];
        rotY = -Math.PI / 3;
        dialogue = 'Drakken weaponized Starsilk at the gate? That was supposed to be impossible!';
      } else if (time < 52.0) {
        pos = [1.8, 0, -3.0];
        rotY = -Math.PI / 3;
        dialogue = 'The Shard God was hurt. He\'s sealing the cluster to cut the infection.';
      } else if (time < 78.0) {
        const t = Math.min(1.0, (time - 52.0) / 16.0);
        pos = [
          THREE.MathUtils.lerp(1.8, 0.0, t),
          0,
          THREE.MathUtils.lerp(-3.0, 7.8, t)
        ];
        rotY = Math.PI;
        dialogue = 'Radiation shielding failed! Get to the transport bay!';
      } else {
        pos = [0.0, Math.sin(time * 3.0 + 2) * 0.6 + 0.4, 7.8];
        rotY = Math.PI * 1.2;
        dialogue = 'The Siege Wall... it\'s not a wall... it\'s a grave.';
      }
    }

    return { pos, rotY, dialogue };
  };

  // Update narrative subtitle when phase changes (low-frequency React state update)
  useEffect(() => {
    const v = getNPCTransform('vaelen', currentTime);
    const c = getNPCTransform('corin', currentTime);
    const s = getNPCTransform('selene', currentTime);

    if (currentPhase === 'PHASE_A_NORMAL') {
      setSubtitle('Observation Station HV-88 — Hal\'Ven Cluster — Nominal Operations');
    } else if (currentPhase === 'PHASE_B_AUREAL_ALERT') {
      setSubtitle(`[Officer Selene]: "${s.dialogue}"`);
    } else if (currentPhase === 'PHASE_C_SHARD_GOD_AUTHORITY') {
      setSubtitle(`[Commander Vaelen]: "${v.dialogue}"`);
    } else if (currentPhase === 'PHASE_D_HELIOCIDE') {
      setSubtitle(`[Specialist Corin]: "${c.dialogue}"`);
    } else if (currentPhase === 'PHASE_E_CASCADE') {
      setSubtitle(`[Commander Vaelen]: "${v.dialogue}"`);
    } else if (currentPhase === 'PHASE_F_SIEGE_WALL') {
      setSubtitle(`[Officer Selene]: "${s.dialogue}"`);
    } else if (currentPhase === 'PHASE_G_STATION_LOSS') {
      setSubtitle('SYSTEM TELEMETRY TERMINATED — CONTAINMENT ACHIEVED');
    }
  }, [currentPhase, setSubtitle]);

  // Fast frame loop: only mutates object position/rotations directly on refs
  useFrame(() => {
    const v = getNPCTransform('vaelen', currentTime);
    if (vaelenRef.current) {
      vaelenRef.current.position.set(...v.pos);
      vaelenRef.current.rotation.y = v.rotY;
    }

    const c = getNPCTransform('corin', currentTime);
    if (corinRef.current) {
      corinRef.current.position.set(...c.pos);
      corinRef.current.rotation.y = c.rotY;
    }

    const s = getNPCTransform('selene', currentTime);
    if (seleneRef.current) {
      seleneRef.current.position.set(...s.pos);
      seleneRef.current.rotation.y = s.rotY;
    }
  });

  return (
    <group name="station-npcs">
      {NPC_DATA.map((npc) => {
        const ref = npc.id === 'vaelen' ? vaelenRef : npc.id === 'corin' ? corinRef : seleneRef;
        const info = getNPCTransform(npc.id, currentTime);

        return (
          <group key={npc.id} ref={ref} position={info.pos} rotation={[0, info.rotY, 0]}>
            {/* Stylized Humanoid Administration Suit */}
            <mesh position={[0, 1.1, 0]} castShadow>
              <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
              <meshStandardMaterial
                color={npc.suitColor}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>

            {/* Helmet & Visor */}
            <mesh position={[0, 1.7, 0]} castShadow>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.7, 0.12]}>
              <boxGeometry args={[0.22, 0.12, 0.1]} />
              <meshStandardMaterial
                color={npc.visorColor}
                emissive={npc.visorColor}
                emissiveIntensity={0.8}
              />
            </mesh>

            {/* Legs */}
            <mesh position={[-0.15, 0.45, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0.15, 0.45, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* In-world Character Overhead Name Tag */}
            <Text
              position={[0, 2.1, 0]}
              fontSize={0.12}
              color="#e2e8f0"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              {npc.name}
            </Text>
            <Text
              position={[0, 1.95, 0]}
              fontSize={0.08}
              color={npc.visorColor}
              anchorX="center"
              anchorY="bottom"
            >
              {npc.role}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
