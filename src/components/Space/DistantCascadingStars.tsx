import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const TOTAL_STARS = 3500;

export function DistantCascadingStars() {
  const pointsRef = useRef<THREE.Points>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  // Generate star field with assigned cluster regions and extinction timing
  const { positions, baseColors, extinctionTimes } = useMemo(() => {
    const pos = new Float32Array(TOTAL_STARS * 3);
    const col = new Float32Array(TOTAL_STARS * 3);
    const ext = new Float32Array(TOTAL_STARS);

    for (let i = 0; i < TOTAL_STARS; i++) {
      // Distribute stars on a celestial sphere of radius 600 - 800
      const radius = 600 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color variation: white, faint blue, amber, soft violet
      const colorType = Math.random();
      let c: THREE.Color;
      if (colorType < 0.6) {
        c = new THREE.Color('#ffffff');
      } else if (colorType < 0.8) {
        c = new THREE.Color('#93c5fd'); // soft blue
      } else if (colorType < 0.95) {
        c = new THREE.Color('#fde68a'); // soft amber
      } else {
        c = new THREE.Color('#c4b5fd'); // soft violet
      }

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      // Assign sector for the Siege Wall swath (extinction zone: theta between 0.2 and 2.4 radians)
      const isInSiegeSector = theta > 0.2 && theta < 2.4 && Math.abs(y) < 350;

      if (isInSiegeSector) {
        // Cascade extinction between t=78s and t=115s sequentially based on angle
        const normalizedAngle = (theta - 0.2) / 2.2;
        ext[i] = 78.0 + normalizedAngle * 35.0 + (Math.random() * 4.0 - 2.0);
      } else {
        // Unaffected or background stars
        ext[i] = 9999.0;
      }
    }

    return {
      positions: pos,
      baseColors: col,
      extinctionTimes: ext
    };
  }, []);

  const dynamicColors = useMemo(() => new Float32Array(baseColors), [baseColors]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    if (!colorAttr) return;

    let colorsModified = false;

    for (let i = 0; i < TOTAL_STARS; i++) {
      const extTime = extinctionTimes[i];

      if (currentTime >= extTime) {
        // Star has collapsed/extinguished
        if (dynamicColors[i * 3] > 0 || dynamicColors[i * 3 + 1] > 0 || dynamicColors[i * 3 + 2] > 0) {
          dynamicColors[i * 3] = 0;
          dynamicColors[i * 3 + 1] = 0;
          dynamicColors[i * 3 + 2] = 0;
          colorsModified = true;
        }
      } else if (currentTime >= extTime - 1.5 && currentTime < extTime) {
        // Star is flashing / collapsing right now (bright blue-white spike)
        const flash = (currentTime - (extTime - 1.5)) / 1.5;
        dynamicColors[i * 3] = 0.5 + flash * 2.0;
        dynamicColors[i * 3 + 1] = 0.8 + flash * 3.0;
        dynamicColors[i * 3 + 2] = 1.0 + flash * 4.0;
        colorsModified = true;
      } else {
        // Normal brightness
        if (
          dynamicColors[i * 3] !== baseColors[i * 3] ||
          dynamicColors[i * 3 + 1] !== baseColors[i * 3 + 1] ||
          dynamicColors[i * 3 + 2] !== baseColors[i * 3 + 2]
        ) {
          dynamicColors[i * 3] = baseColors[i * 3];
          dynamicColors[i * 3 + 1] = baseColors[i * 3 + 1];
          dynamicColors[i * 3 + 2] = baseColors[i * 3 + 2];
          colorsModified = true;
        }
      }
    }

    if (colorsModified) {
      colorAttr.copyArray(dynamicColors);
      colorAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TOTAL_STARS}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={TOTAL_STARS}
          array={dynamicColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.4}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={false}
      />
    </points>
  );
}
