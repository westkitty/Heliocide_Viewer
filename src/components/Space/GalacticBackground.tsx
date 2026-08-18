import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const GalacticVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const GalacticFragmentShader = `
  uniform float uCurrentTime;

  varying vec3 vWorldPosition;
  varying vec2 vUv;

  // Simplex-style 3D noise for dust lanes
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
    vec3 dir = normalize(vWorldPosition);

    // Galactic Plane orientation tilted ~25 degrees
    float galacticLat = dir.y * 0.9 + dir.x * 0.4;
    float band = exp(-galacticLat * galacticLat * 8.0);

    // Fractal dark dust lanes cutting through galactic core
    float dust1 = snoise(dir * 3.5);
    float dust2 = snoise(dir * 8.0);
    float dustLanes = clamp(dust1 * 0.6 + dust2 * 0.4, 0.0, 1.0);
    float emission = max(0.0, band * (1.0 - dustLanes * 0.75));

    // Realistic restrained astronomical colors (deep space dark indigo with faint stellar warmth)
    vec3 baseSpace = vec3(0.002, 0.003, 0.006);
    vec3 galacticCore = vec3(0.025, 0.028, 0.038);
    vec3 dustTint = vec3(0.008, 0.006, 0.004);

    vec3 skyColor = mix(baseSpace, galacticCore, emission);
    skyColor = mix(skyColor, dustTint, band * dustLanes * 0.3);

    // Siege Wall extinction in targeted sector (theta between 0.2 and 2.4)
    float theta = atan(dir.z, dir.x);
    if (theta > 0.15 && theta < 2.45 && abs(dir.y) < 0.6) {
      float normalizedAngle = (theta - 0.15) / 2.3;
      float extTime = 78.0 + normalizedAngle * 36.0;
      if (uCurrentTime >= extTime) {
        float fade = clamp((uCurrentTime - extTime) / 4.0, 0.0, 1.0);
        skyColor *= (1.0 - fade);
      }
    }

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export function GalacticBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uCurrentTime: { value: 0 }
  }), []);

  useFrame(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uCurrentTime.value = useTimelineStore.getState().currentTime;
  });

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[1600, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={GalacticVertexShader}
        fragmentShader={GalacticFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
