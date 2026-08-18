import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTimelineStore } from '../../store/timelineStore';

export function HeliocidePostProcessing() {
  const { gl, scene } = useThree();
  const fogRef = useRef<THREE.FogExp2>(new THREE.FogExp2(0x010204, 0.001));

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.fog = fogRef.current;
  }, [gl, scene]);

  useFrame(() => {
    const { currentTime, currentPhase } = useTimelineStore.getState();

    // Dynamic physically coherent exposure curve
    if (currentTime < 52.0) {
      gl.toneMappingExposure = 1.0;
    } else if (currentTime >= 52.0 && currentTime < 58.0) {
      // High-energy ionizing flash
      const flare = (currentTime - 52.0) / 6.0;
      gl.toneMappingExposure = 1.0 + Math.sin(flare * Math.PI) * 1.5;
    } else if (currentTime >= 58.0 && currentTime < 78.0) {
      // Settling into high-contrast singularity illumination
      const t = (currentTime - 58.0) / 20.0;
      gl.toneMappingExposure = THREE.MathUtils.lerp(1.4, 0.85, t);
    } else if (currentTime >= 78.0 && currentTime < 122.0) {
      // Dimming as cluster cascade extinguishes surrounding stars
      const t = (currentTime - 78.0) / 44.0;
      gl.toneMappingExposure = THREE.MathUtils.lerp(0.85, 0.6, t);
    } else {
      // Void aftermath
      gl.toneMappingExposure = 0.5;
    }

    // Emergency background atmosphere modulation without per-frame instantiation
    if (fogRef.current) {
      if (currentPhase === 'PHASE_D_HELIOCIDE' || currentPhase === 'PHASE_E_CASCADE') {
        const pulse = Math.sin(currentTime * 8.0) * 0.5 + 0.5;
        fogRef.current.color.setRGB(0.04 + pulse * 0.03, 0.01, 0.02);
        fogRef.current.density = 0.003;
      } else {
        fogRef.current.color.setRGB(0.01, 0.02, 0.04);
        fogRef.current.density = 0.001;
      }
    }
  });

  return null;
}
