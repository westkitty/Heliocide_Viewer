import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

// Simple deterministic PRNG
function seedRandom(s: number) {
  return function() {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}


const ShockRingVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ShockRingFragmentShader = `
  uniform float uShockRadius; // 0.0 to 450.0
  uniform float uShockIntensity; // 0.0 to 1.0
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    if (uShockIntensity <= 0.001) discard;

    vec2 centered = vUv - vec2(0.5);
    float r = length(centered) * 2.0;

    // Thin, intense expanding relativistic shock front
    float ringWidth = 0.08;
    float shockEdge = smoothstep(1.0 - ringWidth, 1.0, r) * (1.0 - smoothstep(1.0, 1.0 + ringWidth * 0.5, r));

    // Trailing ionization plasma veil
    float trail = smoothstep(0.4, 1.0 - ringWidth, r) * pow(r, 4.0) * 0.45;

    float totalProfile = shockEdge + trail;
    if (totalProfile <= 0.01) discard;

    // Ionizing blue-white shock color (>50,000K leading edge)
    vec3 leadingEdge = vec3(0.88, 0.95, 1.0);
    vec3 trailingPlasma = vec3(0.12, 0.65, 1.0);
    vec3 shockColor = mix(trailingPlasma, leadingEdge, shockEdge / (totalProfile + 0.001)) * 3.5;

    float alpha = clamp(totalProfile * uShockIntensity, 0.0, 1.0);
    gl_FragColor = vec4(shockColor, alpha);
  }
`;

const TOTAL_EJECTA = 800;

export function CollapseShockwave() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ejectaRef = useRef<THREE.Points>(null);

  const ringUniforms = useMemo(() => ({
    uShockRadius: { value: 0 },
    uShockIntensity: { value: 0 },
    uTime: { value: 0 }
  }), []);

  const { ejectaVelocities, ejectaPositions, ejectaColors } = useMemo(() => {
    const pos = new Float32Array(TOTAL_EJECTA * 3);
    const vel = new Float32Array(TOTAL_EJECTA * 3);
    const col = new Float32Array(TOTAL_EJECTA * 3);

    for (let i = 0; i < TOTAL_EJECTA; i++) {
      // Random unit sphere direction with equatorial bias
      const prng = seedRandom(i * 1337);
      const theta = prng() * Math.PI * 2;
      const phi = (prng() - 0.5) * Math.PI * 0.7; // Equatorial concentration

      const speed = 45 + prng() * 120;
      const dx = Math.cos(phi) * Math.cos(theta);
      const dy = Math.sin(phi);
      const dz = Math.cos(phi) * Math.sin(theta);

      vel[i * 3] = dx * speed;
      vel[i * 3 + 1] = dy * speed;
      vel[i * 3 + 2] = dz * speed;

      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      // Incandescent white to ionized blue
      const blueShift = prng();
      col[i * 3] = THREE.MathUtils.lerp(0.9, 0.2, blueShift);
      col[i * 3 + 1] = THREE.MathUtils.lerp(0.95, 0.7, blueShift);
      col[i * 3 + 2] = 1.0;
    }

    return { ejectaVelocities: vel, ejectaPositions: pos, ejectaColors: col };
  }, []);

  useFrame((_, delta) => {
    ringUniforms.uTime.value += delta;
    const currentTime = useTimelineStore.getState().currentTime;

    // Shockwave event triggers at t=54.0s (onset of collapse) and expands through t=72.0s
    if (currentTime >= 54.0 && currentTime <= 74.0) {
      const shockProgress = (currentTime - 54.0) / 20.0;
      const shockScale = Math.pow(shockProgress, 0.75) * 480 + 2;
      const shockIntensity = (1.0 - shockProgress) * 1.5;

      if (ringRef.current) {
        ringRef.current.visible = true;
        ringRef.current.scale.set(shockScale, shockScale, shockScale);
      }
      ringUniforms.uShockRadius.value = shockScale;
      ringUniforms.uShockIntensity.value = shockIntensity;

      // Update particle ejecta positions
      if (ejectaRef.current) {
        ejectaRef.current.visible = true;
        const posAttr = ejectaRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const dt = (currentTime - 54.0);
        for (let i = 0; i < TOTAL_EJECTA; i++) {
          posAttr.setXYZ(
            i,
            ejectaVelocities[i * 3] * dt,
            ejectaVelocities[i * 3 + 1] * dt,
            ejectaVelocities[i * 3 + 2] * dt
          );
        }
        posAttr.needsUpdate = true;
      }
    } else {
      if (ringRef.current) ringRef.current.visible = false;
      if (ejectaRef.current) ejectaRef.current.visible = false;
      ringUniforms.uShockIntensity.value = 0;
    }
  });

  return (
    <group position={[0, 0, -180]}>
      {/* Expanding Relativistic Shockwave Ring */}
      <mesh ref={ringRef} visible={false} rotation={[-Math.PI / 2.3, 0.15, 0]}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          vertexShader={ShockRingVertexShader}
          fragmentShader={ShockRingFragmentShader}
          uniforms={ringUniforms}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Relativistic Plasma Ejecta Particulate */}
      <points ref={ejectaRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ejectaPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[ejectaColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={3.2}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
