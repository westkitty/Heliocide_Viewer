import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const StarVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const StarFragmentShader = `
  uniform float uTime;
  uniform float uCollapseProgress; // 0.0 (normal) to 1.0 (singularity)
  uniform float uLensingIntensity;
  uniform vec3 uColorNormal;
  uniform vec3 uColorCollapsed;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // Simplex noise approximation
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
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(normal, viewDir));

    // Animated solar plasma texture
    float speed = 0.2 + uCollapseProgress * 1.5;
    float n1 = snoise(vPosition * 0.4 + vec3(0.0, 0.0, uTime * speed));
    float n2 = snoise(vPosition * 1.2 - vec3(0.0, uTime * speed * 1.3, 0.0));
    float plasma = 0.5 + 0.5 * (n1 * 0.6 + n2 * 0.4);

    // Normal solar state color
    vec3 coreColor = mix(uColorNormal, vec3(1.0, 1.0, 0.9), plasma * 0.8);
    float limbDarkening = pow(NdotV, 0.6);
    vec3 normalStar = coreColor * limbDarkening * 1.5;

    // Collapsed state: Accretion glow surrounding pure black singularity center
    float rim = 1.0 - NdotV;
    float accretionRing = pow(rim, 2.5) * (1.5 + plasma * 2.0);
    vec3 singularityColor = uColorCollapsed * accretionRing * 3.5;
    
    // Core event horizon (pitch black center in collapsed state)
    if (uCollapseProgress > 0.4) {
      float horizonFactor = smoothstep(0.4, 0.8, uCollapseProgress);
      float centerHole = smoothstep(0.35 * (1.0 - horizonFactor), 0.7, rim);
      singularityColor *= centerHole;
    }

    vec3 finalColor = mix(normalStar, singularityColor, uCollapseProgress);

    // Intense flash at collapse onset (around progress 0.3 - 0.6)
    float collapseFlash = smoothstep(0.2, 0.4, uCollapseProgress) * (1.0 - smoothstep(0.4, 0.65, uCollapseProgress)) * 4.0;
    finalColor += vec3(0.8, 0.9, 1.0) * collapseFlash;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function StarCollapseShader() {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCollapseProgress: { value: 0 },
    uLensingIntensity: { value: 0 },
    uColorNormal: { value: new THREE.Color('#ffaa33') },
    uColorCollapsed: { value: new THREE.Color('#00e5ff') }
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    uniforms.uTime.value += delta;

    const currentTime = useTimelineStore.getState().currentTime;

    // Calculate collapse progress from timeline (Phase D starts at 52s, fully collapsed by 78s)
    let progress = 0;
    if (currentTime < 52.0) {
      progress = 0;
    } else if (currentTime >= 52.0 && currentTime < 78.0) {
      progress = (currentTime - 52.0) / (78.0 - 52.0);
    } else {
      progress = 1.0;
    }

    uniforms.uCollapseProgress.value = progress;
    uniforms.uLensingIntensity.value = progress;

    // Physical contraction of the star geometry
    const baseScale = THREE.MathUtils.lerp(1.0, 0.28, progress);
    const pulse = progress > 0 && progress < 1 ? Math.sin(currentTime * 18.0) * 0.03 * (1 - progress) : 0;
    meshRef.current.scale.setScalar(Math.max(0.2, baseScale + pulse));

    // Slow majestic rotation
    meshRef.current.rotation.y += delta * (0.05 + progress * 0.4);

    if (coronaRef.current) {
      coronaRef.current.scale.setScalar((baseScale + pulse) * 1.45);
      coronaRef.current.rotation.z -= delta * 0.08;
    }
  });

  return (
    <group position={[0, 0, -180]}>
      {/* Central Star Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[18, 64, 64]} />
        <shaderMaterial
          vertexShader={StarVertexShader}
          fragmentShader={StarFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Relativistic Accretion / Corona Halo */}
      <mesh ref={coronaRef}>
        <ringGeometry args={[19, 32, 64]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Star Point Light illuminating the system */}
      <pointLight
        color="#00ddff"
        intensity={8000}
        distance={1200}
        decay={1.2}
      />
    </group>
  );
}
