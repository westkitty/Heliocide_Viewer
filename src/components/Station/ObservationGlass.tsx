import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const ObservationGlassShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uTimelineTime;
    uniform float uStressIntensity;
    uniform vec3 uEmergencyColor;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Pseudo-random hash for micro-scratches
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float scratchNoise(vec2 uv) {
      vec2 grid = uv * 320.0;
      vec2 ipos = floor(grid);
      vec2 fpos = fract(grid);
      float h = hash(ipos);
      float line = smoothstep(0.02, 0.0, abs(fpos.y - h));
      return line * step(0.92, h);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // 1. Fresnel Reflectance
      float NdotV = max(0.0, dot(normal, viewDir));
      float fresnel = pow(1.0 - NdotV, 3.5);

      // 2. Perimeter Stress & Edge Birefringence
      // Edge distance from glass margins [0, 1]
      float distFromEdge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0;
      float edgeStress = smoothstep(0.18, 0.0, distFromEdge) * (0.4 + uStressIntensity * 1.5);

      // Chromatic dispersion along polarized strain lines
      vec3 birefringenceColor = vec3(
        0.5 + 0.5 * sin(edgeStress * 25.0 + 0.0),
        0.5 + 0.5 * sin(edgeStress * 25.0 + 2.094),
        0.5 + 0.5 * sin(edgeStress * 25.0 + 4.188)
      );

      // 3. Micro-scratches & Vacuum Dust Condensation
      float scratches = scratchNoise(vUv) * 0.25;
      float frostCondensation = smoothstep(0.08, 0.0, distFromEdge) * 0.18;

      // 4. Interior Specular Highlight / Ghosted Glow
      vec3 glassTint = vec3(0.72, 0.90, 1.0);
      vec3 surfaceColor = glassTint * 0.03;

      // Blend reflections
      surfaceColor += birefringenceColor * edgeStress * 0.6;
      surfaceColor += vec3(scratches + frostCondensation);
      surfaceColor += fresnel * (glassTint * 0.35 + uEmergencyColor * 0.4);

      float alpha = clamp(0.05 + fresnel * 0.35 + edgeStress * 0.4 + scratches + frostCondensation, 0.0, 0.75);

      gl_FragColor = vec4(surfaceColor, alpha);
    }
  `
};

export function ObservationGlass() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTimelineTime: { value: 0 },
      uStressIntensity: { value: 0 },
      uEmergencyColor: { value: new THREE.Color('#38bdf8') }
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uTimelineTime.value = currentTime;

      // Structural stress intensity peaks during collapse and breach
      let stress = 0.0;
      if (currentTime >= 52.0 && currentTime < 78.0) {
        stress = (currentTime - 52.0) / 26.0;
      } else if (currentTime >= 78.0) {
        stress = 1.0;
      }
      materialRef.current.uniforms.uStressIntensity.value = stress;

      if (currentTime > 52.0) {
        const alertPulse = Math.sin(currentTime * 8.0) * 0.5 + 0.5;
        materialRef.current.uniforms.uEmergencyColor.value.set(
          alertPulse > 0.5 ? '#ef4444' : '#7f1d1d'
        );
      } else {
        materialRef.current.uniforms.uEmergencyColor.value.set('#38bdf8');
      }
    }
  });

  return (
    <mesh name="panoramic-observation-glass">
      <planeGeometry args={[16, 7.0, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ObservationGlassShader.vertexShader}
        fragmentShader={ObservationGlassShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}
