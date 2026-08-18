import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * The Siege Wall in physical space:
 * An enormous expanding irregular swath of pure starless blackness across the physical sky.
 * STRICT CANON LAW:
 * - NEVER A VISIBLE LATTICE, WIREFRAME, OR GEOMETRIC GRID IN PHYSICAL SPACE.
 * - NEVER A FLOATING POLYGONAL 3D OBJECT/DODECAHEDRON IN FRONT OF THE CAMERA.
 * - Pure sky-space celestial extinction masking that erases the background cosmos.
 */

const VoidVertexShader = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const VoidFragmentShader = `
  uniform float uProgress; // 0.0 (unformed) to 1.0 (fully established swath)
  uniform float uTime;

  varying vec3 vWorldPosition;

  void main() {
    if (uProgress <= 0.001) discard;

    vec3 dir = normalize(vWorldPosition);
    float theta = atan(dir.z, dir.x); // Azimuthal angle around system
    float elevation = dir.y;

    // Sector bounds of the Siege Wall swath (expanding across azimuth 0.1 to 2.6)
    float minTheta = 0.1;
    float maxTheta = THREE_PI_RANGE_EXTENT();
    
    // Evaluate if view direction falls within the expanding swath
    float currentMaxTheta = minTheta + uProgress * 2.4;
    float elevationBound = 0.65 * (0.3 + uProgress * 0.7);

    // Smooth boundary feathering to prevent hard polygon edge
    float inAzimuth = smoothstep(minTheta - 0.1, minTheta + 0.05, theta) * (1.0 - smoothstep(currentMaxTheta - 0.08, currentMaxTheta + 0.12, theta));
    float inElevation = 1.0 - smoothstep(elevationBound * 0.75, elevationBound, abs(elevation));

    float voidMask = inAzimuth * inElevation;
    if (voidMask <= 0.005) discard;

    // Absolute starless black absorption
    gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(voidMask * uProgress * 1.5, 0.0, 1.0));
  }

  float THREE_PI_RANGE_EXTENT() {
    return 2.5;
  }
`;

export function SiegeWallVoid() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime: { value: 0 }
  }), []);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    const currentTime = useTimelineStore.getState().currentTime;

    // The Siege Wall begins expanding during Phase E (78s) and seals by Phase F (122s)
    let progress = 0;
    if (currentTime < 78.0) {
      progress = 0;
    } else if (currentTime >= 78.0 && currentTime < 122.0) {
      progress = (currentTime - 78.0) / (122.0 - 78.0);
    } else {
      progress = 1.0;
    }

    materialRef.current.uniforms.uProgress.value = progress;
    materialRef.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh scale={[-1, 1, 1]}>
      {/* Background celestial sphere (radius 1500) behind planetary infrastructure */}
      <sphereGeometry args={[1500, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VoidVertexShader}
        fragmentShader={VoidFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
