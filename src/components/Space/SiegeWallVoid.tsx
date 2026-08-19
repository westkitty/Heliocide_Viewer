import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * The Siege Wall in physical space:
 * An enormous expanding irregular swath of pure starless blackness across the physical sky.
 * STRICT CANON LAW:
 * - NEVER A VISIBLE LATTICE, WIREFRAME, OR GEOMETRIC GRID IN PHYSICAL SPACE.
 * - NEVER A FLOATING POLYGONAL 3D OBJECT.
 * - Pure sky-space celestial extinction masking with an organic, multi-scale causal advancing front.
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
  uniform float uProgress; // 0.0 to 1.0
  uniform float uTime;

  varying vec3 vWorldPosition;

  // Simplex noise for organic multi-scale boundary propagation
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    if (uProgress <= 0.001) discard;

    vec3 dir = normalize(vWorldPosition);
    float theta = atan(dir.z, dir.x);
    float elevation = dir.y;

    // Organic multi-scale boundary perturbations
    float n1 = snoise(dir * 2.5);
    float n2 = snoise(dir * 6.0);
    float organicFront = n1 * 0.22 + n2 * 0.08;

    float minTheta = 0.12 + organicFront * 0.5;
    float currentMaxTheta = minTheta + uProgress * (2.4 + organicFront);
    float elevationBound = 0.65 * (0.35 + uProgress * 0.65) + organicFront * 0.15;

    // Causal extinction front evaluation
    float inAzimuth = smoothstep(minTheta - 0.08, minTheta + 0.04, theta) * (1.0 - smoothstep(currentMaxTheta - 0.06, currentMaxTheta + 0.08, theta));
    float inElevation = 1.0 - smoothstep(elevationBound * 0.8, elevationBound, abs(elevation));

    float voidMask = inAzimuth * inElevation;
    if (voidMask <= 0.005) discard;

    // Pure starless black absorption of cosmos
    gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(voidMask * uProgress * 1.6, 0.0, 1.0));
  }
`;

export function SiegeWallVoid() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime: { value: 0 }
  }), []);

  useFrame(() => {
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
    materialRef.current.uniforms.uTime.value = currentTime;
  });

  return (
    <mesh scale={[-1, 1, 1]}>
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
