import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const TOTAL_STARS = 4500;

// Deterministic Linear Congruential PRNG
function createSeededRNG(seed = 17618934) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Astronomical Harvard spectral types and B-V color temperatures
const SPECTRAL_CLASSES = [
  { weight: 0.04, color: new THREE.Color('#9bb0ff'), name: 'O/B Blue Giant' },
  { weight: 0.14, color: new THREE.Color('#cad7ff'), name: 'A White' },
  { weight: 0.20, color: new THREE.Color('#f8f9ff'), name: 'F Yellow-White' },
  { weight: 0.30, color: new THREE.Color('#fff4e8'), name: 'G Solar Yellow' },
  { weight: 0.22, color: new THREE.Color('#ffd2a1'), name: 'K Orange' },
  { weight: 0.10, color: new THREE.Color('#ffb380'), name: 'M Red Dwarf' }
];

export function DistantCascadingStars() {
  const pointsRef = useRef<THREE.Points>(null);

  // Deterministically generate astronomical starfield with galactic structure and realistic magnitudes
  const { positions, baseColors, sizes, extinctionTimes } = useMemo(() => {
    const rng = createSeededRNG(987654321);

    const pos = new Float32Array(TOTAL_STARS * 3);
    const col = new Float32Array(TOTAL_STARS * 3);
    const sz = new Float32Array(TOTAL_STARS);
    const ext = new Float32Array(TOTAL_STARS);

    for (let i = 0; i < TOTAL_STARS; i++) {
      // Celestial sphere radius (700 to 1100 units)
      const radius = 700 + rng() * 400;

      // Astronomical galactic coordinate concentration:
      // Galactic plane angle ~ 25 degrees tilt
      let galacticLat = (rng() - 0.5) * Math.PI;
      // Weight distribution toward galactic plane (concentrated in mid-latitudes)
      if (rng() < 0.65) {
        galacticLat = Math.pow(rng() - 0.5, 3) * Math.PI * 1.8;
      }
      const galacticLon = rng() * Math.PI * 2;

      // Transform galactic coordinates to cartesian sphere
      const x = radius * Math.cos(galacticLat) * Math.cos(galacticLon);
      const y = radius * Math.sin(galacticLat);
      const z = radius * Math.cos(galacticLat) * Math.sin(galacticLon);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Apparent magnitude distribution (power law: vast majority are faint sub-pixels, rare bright heroes)
      const magRoll = rng();
      const magnitude = Math.pow(magRoll, 3.2); // 0 (faint) to 1 (bright)
      sz[i] = THREE.MathUtils.lerp(1.2, 4.5, magnitude);

      // Select spectral class based on cumulative probability
      let specClass = SPECTRAL_CLASSES[3];
      const roll = rng();
      let cumWeight = 0;
      for (const sc of SPECTRAL_CLASSES) {
        cumWeight += sc.weight;
        if (roll <= cumWeight) {
          specClass = sc;
          break;
        }
      }

      // Modulate color intensity by apparent magnitude
      const intensity = THREE.MathUtils.lerp(0.45, 1.25, magnitude);
      col[i * 3] = specClass.color.r * intensity;
      col[i * 3 + 1] = specClass.color.g * intensity;
      col[i * 3 + 2] = specClass.color.b * intensity;

      // Extinction zone for the Siege Wall swath (sector theta between 0.2 and 2.4 radians)
      const theta = Math.atan2(z, x);
      const isInSiegeSector = theta > 0.15 && theta < 2.45 && Math.abs(y) < 420;

      if (isInSiegeSector) {
        const normalizedAngle = (theta - 0.15) / 2.3;
        ext[i] = 78.0 + normalizedAngle * 36.0 + (rng() * 4.0 - 2.0);
      } else {
        ext[i] = 9999.0;
      }
    }

    return {
      positions: pos,
      baseColors: col,
      sizes: sz,
      extinctionTimes: ext
    };
  }, []);

  const dynamicColors = useMemo(() => new Float32Array(baseColors), [baseColors]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const colorAttr = geometry.attributes.color;
    if (!colorAttr) return;

    const currentTime = useTimelineStore.getState().currentTime;
    let needsUpdate = false;

    for (let i = 0; i < TOTAL_STARS; i++) {
      const extTime = extinctionTimes[i];
      if (extTime >= 9999.0) continue;

      if (currentTime >= extTime) {
        // Star has collapsed/extinguished into the Siege Wall void
        const fadeProgress = Math.min(1.0, (currentTime - extTime) / 3.0);
        const factor = 1.0 - fadeProgress;

        dynamicColors[i * 3] = baseColors[i * 3] * factor;
        dynamicColors[i * 3 + 1] = baseColors[i * 3 + 1] * factor;
        dynamicColors[i * 3 + 2] = baseColors[i * 3 + 2] * factor;
        needsUpdate = true;
      } else {
        dynamicColors[i * 3] = baseColors[i * 3];
        dynamicColors[i * 3 + 1] = baseColors[i * 3 + 1];
        dynamicColors[i * 3 + 2] = baseColors[i * 3 + 2];
      }
    }

    if (needsUpdate) {
      colorAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[dynamicColors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.2}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
