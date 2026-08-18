import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTimelineStore } from '../../store/timelineStore';

export function HeliocidePostProcessing() {
  const { gl, scene } = useThree();
  const currentTime = useTimelineStore((s) => s.currentTime);
  const currentPhase = useTimelineStore((s) => s.currentPhase);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  useFrame(() => {
    // Dynamic exposure modulation during Heliocide & Cascade
    if (currentTime < 52.0) {
      gl.toneMappingExposure = 1.0;
    } else if (currentTime >= 52.0 && currentTime < 58.0) {
      // Violent exposure flare at collapse onset
      const flare = (currentTime - 52.0) / 6.0;
      gl.toneMappingExposure = 1.0 + Math.sin(flare * Math.PI) * 1.6;
    } else if (currentTime >= 58.0 && currentTime < 78.0) {
      // Settling into high contrast singularity illumination
      const t = (currentTime - 58.0) / 20.0;
      gl.toneMappingExposure = THREE.MathUtils.lerp(1.5, 0.85, t);
    } else if (currentTime >= 78.0 && currentTime < 122.0) {
      // Dimming ambient as stars extinguish
      const t = (currentTime - 78.0) / 44.0;
      gl.toneMappingExposure = THREE.MathUtils.lerp(0.85, 0.6, t);
    } else {
      // Final cold aftermath
      gl.toneMappingExposure = 0.5;
    }

    // Emergency background tint in station
    if (currentPhase === 'PHASE_D_HELIOCIDE' || currentPhase === 'PHASE_E_CASCADE') {
      const pulse = Math.sin(currentTime * 8.0) * 0.5 + 0.5;
      scene.fog = new THREE.FogExp2(new THREE.Color(0.04 + pulse * 0.03, 0.01, 0.02), 0.003);
    } else {
      scene.fog = new THREE.FogExp2(new THREE.Color(0.01, 0.02, 0.04), 0.001);
    }
  });

  return null;
}
