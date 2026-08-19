import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const DEBRIS_COUNT = 48;
const BREACH_TARGET = new THREE.Vector3(8.8, 3.5, 2.5);

// Seeded pseudo-random for deterministic debris placement
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

type DebrisType = 'hull_panel' | 'conduit_fragment' | 'equipment_box' | 'insulation' | 'glass_shard' | 'fastener';

interface DebrisItem {
  initialPos: [number, number, number];
  rotSpeed: [number, number, number];
  floatSpeed: number;
  floatAmplitude: number;
  driftStrength: number;      // How strongly pulled toward breach
  mass: number;               // Heavy items tumble slower, light ones faster
  type: DebrisType;
  scale: number;
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
}

const DEBRIS_CONFIGS: Record<DebrisType, {
  colors: string[];
  metalness: [number, number];
  roughness: [number, number];
  scaleRange: [number, number];
  massRange: [number, number];
  driftRange: [number, number];
  emissive: string;
  emissiveIntensity: number;
}> = {
  hull_panel: {
    colors: ['#0f172a', '#1e293b', '#18181b', '#27272a'],
    metalness: [0.85, 0.95],
    roughness: [0.15, 0.3],
    scaleRange: [0.3, 0.7],
    massRange: [3.0, 8.0],
    driftRange: [0.1, 0.3],
    emissive: '#000000',
    emissiveIntensity: 0,
  },
  conduit_fragment: {
    colors: ['#38bdf8', '#f59e0b', '#10b981', '#f97316'],
    metalness: [0.7, 0.85],
    roughness: [0.2, 0.4],
    scaleRange: [0.15, 0.4],
    massRange: [0.5, 2.0],
    driftRange: [0.4, 0.8],
    emissive: '#000000',
    emissiveIntensity: 0,
  },
  equipment_box: {
    colors: ['#334155', '#475569', '#1e3a5f', '#2d3748'],
    metalness: [0.5, 0.7],
    roughness: [0.4, 0.6],
    scaleRange: [0.2, 0.5],
    massRange: [1.5, 5.0],
    driftRange: [0.15, 0.35],
    emissive: '#000000',
    emissiveIntensity: 0,
  },
  insulation: {
    colors: ['#fef3c7', '#fde68a', '#d4d4d8', '#e5e5e5'],
    metalness: [0.0, 0.1],
    roughness: [0.85, 0.95],
    scaleRange: [0.15, 0.35],
    massRange: [0.1, 0.4],
    driftRange: [0.7, 1.0],
    emissive: '#000000',
    emissiveIntensity: 0,
  },
  glass_shard: {
    colors: ['#bae6fd', '#e0f2fe', '#f0f9ff', '#cffafe'],
    metalness: [0.1, 0.3],
    roughness: [0.05, 0.15],
    scaleRange: [0.08, 0.2],
    massRange: [0.2, 0.6],
    driftRange: [0.5, 0.9],
    emissive: '#bae6fd',
    emissiveIntensity: 0.15,
  },
  fastener: {
    colors: ['#94a3b8', '#64748b', '#a1a1aa', '#d4d4d8'],
    metalness: [0.9, 0.98],
    roughness: [0.1, 0.2],
    scaleRange: [0.04, 0.1],
    massRange: [0.05, 0.15],
    driftRange: [0.8, 1.0],
    emissive: '#000000',
    emissiveIntensity: 0,
  },
};

const TYPE_DISTRIBUTION: DebrisType[] = [
  'hull_panel', 'hull_panel', 'hull_panel', 'hull_panel', 'hull_panel', 'hull_panel', 'hull_panel', 'hull_panel',
  'conduit_fragment', 'conduit_fragment', 'conduit_fragment', 'conduit_fragment', 'conduit_fragment', 'conduit_fragment',
  'equipment_box', 'equipment_box', 'equipment_box', 'equipment_box', 'equipment_box',
  'insulation', 'insulation', 'insulation', 'insulation', 'insulation', 'insulation', 'insulation',
  'glass_shard', 'glass_shard', 'glass_shard', 'glass_shard', 'glass_shard', 'glass_shard', 'glass_shard', 'glass_shard',
  'fastener', 'fastener', 'fastener', 'fastener', 'fastener', 'fastener', 'fastener', 'fastener', 'fastener', 'fastener',
  'fastener', 'fastener', 'fastener', 'fastener',
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function DebrisField() {
  const groupRef = useRef<THREE.Group>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const debrisItems: DebrisItem[] = useMemo(() => {
    const items: DebrisItem[] = [];
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const s = 500 + i * 13;
      const type = TYPE_DISTRIBUTION[i % TYPE_DISTRIBUTION.length];
      const cfg = DEBRIS_CONFIGS[type];
      const r = seeded(s);

      items.push({
        initialPos: [
          (seeded(s + 1) - 0.5) * 15,
          seeded(s + 2) * 5.0 + 0.5,
          (seeded(s + 3) - 0.5) * 13
        ],
        rotSpeed: [
          (seeded(s + 4) - 0.5) * 3.0,
          (seeded(s + 5) - 0.5) * 3.0,
          (seeded(s + 6) - 0.5) * 3.0
        ],
        floatSpeed: 0.4 + seeded(s + 7) * 1.8,
        floatAmplitude: 0.2 + seeded(s + 8) * 0.9,
        driftStrength: lerp(cfg.driftRange[0], cfg.driftRange[1], seeded(s + 9)),
        mass: lerp(cfg.massRange[0], cfg.massRange[1], seeded(s + 10)),
        type,
        scale: lerp(cfg.scaleRange[0], cfg.scaleRange[1], r),
        color: cfg.colors[Math.floor(seeded(s + 11) * cfg.colors.length)],
        metalness: lerp(cfg.metalness[0], cfg.metalness[1], seeded(s + 12)),
        roughness: lerp(cfg.roughness[0], cfg.roughness[1], seeded(s + 13)),
        emissive: cfg.emissive,
        emissiveIntensity: cfg.emissiveIntensity,
      });
    }
    return items;
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (currentTime < 78.0) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const severity = Math.min(1.0, (currentTime - 78.0) / 18.0);

    debrisItems.forEach((item, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      // Zero-G floating drift with mass-dependent frequency
      const massInv = 1.0 / item.mass;
      const t = currentTime * item.floatSpeed;
      const yOffset = Math.sin(t) * item.floatAmplitude * severity;
      const xOffset = Math.cos(t * 0.7) * (item.floatAmplitude * 0.5) * severity;
      const zOffset = Math.sin(t * 0.5) * (item.floatAmplitude * 0.5) * severity;

      // Decompression drift toward breach — light objects drift faster
      const driftT = severity * item.driftStrength * massInv * 0.4;
      const driftDir = BREACH_TARGET.clone().sub(
        new THREE.Vector3(item.initialPos[0], item.initialPos[1], item.initialPos[2])
      ).normalize();

      mesh.position.set(
        item.initialPos[0] + xOffset + driftDir.x * driftT * 3.0,
        item.initialPos[1] + yOffset + driftDir.y * driftT * 2.0,
        item.initialPos[2] + zOffset + driftDir.z * driftT * 3.0
      );

      // Mass-dependent angular tumbling: lighter objects tumble faster
      const tumbleScale = massInv * 0.5 + 0.3;
      mesh.rotation.x += item.rotSpeed[0] * delta * severity * tumbleScale;
      mesh.rotation.y += item.rotSpeed[1] * delta * severity * tumbleScale;
      mesh.rotation.z += item.rotSpeed[2] * delta * severity * tumbleScale;
    });
  });

  return (
    <group ref={groupRef}>
      {debrisItems.map((item, idx) => (
        <mesh
          key={idx}
          ref={(el) => (meshRefs.current[idx] = el)}
          position={item.initialPos}
          scale={item.scale}
        >
          {renderDebrisGeometry(item.type)}
          <meshStandardMaterial
            color={item.color}
            metalness={item.metalness}
            roughness={item.roughness}
            emissive={item.emissive}
            emissiveIntensity={item.emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}

function renderDebrisGeometry(type: DebrisType) {
  switch (type) {
    case 'hull_panel':
      return <boxGeometry args={[1.4, 0.06, 0.9]} />;
    case 'conduit_fragment':
      return <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />;
    case 'equipment_box':
      return <boxGeometry args={[0.7, 0.5, 0.6]} />;
    case 'insulation':
      return <boxGeometry args={[0.8, 0.03, 0.6]} />;
    case 'glass_shard':
      return <boxGeometry args={[0.5, 0.01, 0.35]} />;
    case 'fastener':
      return <cylinderGeometry args={[0.03, 0.03, 0.12, 6]} />;
    default:
      return <boxGeometry args={[0.5, 0.5, 0.5]} />;
  }
}
