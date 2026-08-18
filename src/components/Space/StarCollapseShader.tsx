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
  uniform float uCurrentTime;
  uniform float uCollapseProgress; // 0.0 to 1.0
  uniform float uLensingIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

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

  float solarGranulation(vec3 pos, float time) {
    vec3 p = pos * 2.8 + vec3(0.0, time * 0.15, 0.0);
    float n1 = snoise(p);
    float n2 = snoise(p * 2.2 + vec3(time * 0.2, 0.0, 0.0));
    float n3 = snoise(p * 5.0 - vec3(0.0, 0.0, time * 0.3));
    float granule = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    return smoothstep(-0.4, 0.6, granule);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(normal, viewDir));
    float rim = 1.0 - NdotV;

    float convSpeed = 0.25 + uCollapseProgress * 3.5;
    float granules = solarGranulation(vPosition * 0.5, uTime * convSpeed);
    float macroFlow = snoise(vPosition * 0.2 + vec3(0.0, uTime * convSpeed * 0.4, 0.0)) * 0.5 + 0.5;

    // Physical Eddington solar limb darkening
    float mu = NdotV;
    float eddingtonLimb = clamp(1.0 - 0.65 * (1.0 - mu) - 0.25 * (1.0 - sqrt(max(0.0, mu))), 0.15, 1.0);

    // Normal solar colors (5800K)
    vec3 deepCore = vec3(1.0, 0.98, 0.92);
    vec3 cellGold = vec3(1.0, 0.76, 0.24);
    vec3 laneAmber = vec3(0.85, 0.42, 0.08);

    vec3 normalPhotosphere = mix(laneAmber, cellGold, granules);
    normalPhotosphere = mix(normalPhotosphere, deepCore, macroFlow * 0.6 + granules * 0.4) * eddingtonLimb * 1.8;

    vec3 surgeColor = vec3(0.75, 0.88, 1.0) * (2.5 + granules * 1.5);

    // Relativistic Doppler beaming on accretion boundary
    float dopplerBeam = 1.0 + normal.x * 0.65;
    vec3 accretionColor = vec3(0.0, 0.85, 1.0) * pow(rim, 2.2) * 4.2 * dopplerBeam;

    // Razor-sharp photon ring
    float photonRing = smoothstep(0.85, 0.94, rim) * (1.0 - smoothstep(0.94, 0.98, rim)) * 8.5;
    accretionColor += vec3(0.7, 0.95, 1.0) * photonRing;

    vec3 stateColor = normalPhotosphere;
    if (uCollapseProgress < 0.25) {
      float t = uCollapseProgress / 0.25;
      stateColor = mix(normalPhotosphere, surgeColor, t);
    } else if (uCollapseProgress < 0.6) {
      float t = (uCollapseProgress - 0.25) / 0.35;
      stateColor = mix(surgeColor, accretionColor, t);
    } else {
      stateColor = accretionColor;
    }

    if (uCollapseProgress > 0.3) {
      float horizonScale = smoothstep(0.3, 0.8, uCollapseProgress);
      float shadowThreshold = 0.82 * horizonScale;
      float shadowMask = smoothstep(shadowThreshold - 0.03, shadowThreshold + 0.02, rim);
      stateColor *= shadowMask;
    }

    gl_FragColor = vec4(stateColor, 1.0);
  }
`;

const AccretionVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const AccretionFragmentShader = `
  uniform float uTime;
  uniform float uCollapseProgress;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

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
    vec2 centered = vUv - vec2(0.5);
    float dist = length(centered) * 2.0;
    if (dist < 0.28 || dist > 1.0) discard;

    float angle = atan(centered.y, centered.x);

    // Keplerian orbital velocity (v ~ r^-0.5)
    float normDist = (dist - 0.28) / 0.72;
    float keplerOmega = pow(max(0.1, dist), -1.5) * 1.8;
    float rotAngle = angle + uTime * keplerOmega * (0.3 + uCollapseProgress * 0.7);

    // Relativistic Doppler Beaming Factor
    // Gas orbital velocity beta reaches 0.45c near inner edge
    float beta = mix(0.48, 0.15, normDist);
    float gamma = 1.0 / sqrt(max(0.01, 1.0 - beta * beta));
    // Approaching side (centered.x < 0) vs Receding side (centered.x > 0)
    float vDotView = -sin(angle); 
    float dopplerFactor = 1.0 / (gamma * (1.0 - beta * vDotView));
    float beamingIntensity = pow(dopplerFactor, 3.8);

    // Spiraling relativistic infall arms & viscous turbulence
    float spiral1 = snoise(vec3(cos(rotAngle * 3.0) * dist * 3.0, sin(rotAngle * 3.0) * dist * 3.0, dist * 2.0));
    float spiral2 = snoise(vec3(cos(rotAngle * 8.0) * dist * 6.0, sin(rotAngle * 8.0) * dist * 6.0, uTime * 0.4));
    float turbulence = 0.6 + spiral1 * 0.25 + spiral2 * 0.15;

    // Relativistic Doppler color shift (blue-boosted on approaching, red-dimmed on receding)
    vec3 iscoWhite = vec3(0.95, 0.98, 1.0);
    vec3 midCyan = vec3(0.0, 0.88, 1.0);
    vec3 outerBlue = vec3(0.05, 0.25, 0.75);
    vec3 recedingRedShift = vec3(0.35, 0.12, 0.45);

    vec3 discTempColor = mix(iscoWhite, midCyan, smoothstep(0.0, 0.45, normDist));
    discTempColor = mix(discTempColor, outerBlue, smoothstep(0.45, 1.0, normDist));
    discTempColor = mix(recedingRedShift, discTempColor, smoothstep(0.6, 1.2, dopplerFactor));

    vec3 discEmission = discTempColor * turbulence * (1.0 - smoothstep(0.7, 1.0, dist)) * 2.4 * beamingIntensity;

    vec3 normalCorona = vec3(1.0, 0.78, 0.32) * (1.0 - dist) * 2.0;
    vec3 finalColor = mix(normalCorona, discEmission, uCollapseProgress);

    float alpha = clamp((1.0 - smoothstep(0.65, 1.0, dist)) * turbulence * (0.6 + uCollapseProgress * 0.4) * min(2.0, beamingIntensity), 0.0, 1.0);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function StarCollapseShader() {
  const meshRef = useRef<THREE.Mesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const starUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCurrentTime: { value: 0 },
    uCollapseProgress: { value: 0 },
    uLensingIntensity: { value: 0 }
  }), []);

  const diskUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCollapseProgress: { value: 0 }
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    starUniforms.uTime.value += delta;
    diskUniforms.uTime.value += delta;

    const currentTime = useTimelineStore.getState().currentTime;
    starUniforms.uCurrentTime.value = currentTime;

    let progress = 0;
    if (currentTime < 52.0) {
      progress = 0;
    } else if (currentTime >= 52.0 && currentTime < 78.0) {
      progress = (currentTime - 52.0) / (78.0 - 52.0);
    } else {
      progress = 1.0;
    }

    starUniforms.uCollapseProgress.value = progress;
    starUniforms.uLensingIntensity.value = progress;
    diskUniforms.uCollapseProgress.value = progress;

    const baseScale = THREE.MathUtils.lerp(1.0, 0.28, progress);
    const pulse = progress > 0 && progress < 1 ? Math.sin(currentTime * 18.0) * 0.03 * (1 - progress) : 0;
    meshRef.current.scale.setScalar(Math.max(0.2, baseScale + pulse));

    meshRef.current.rotation.y += delta * (0.05 + progress * 0.5);

    if (diskRef.current) {
      diskRef.current.scale.setScalar((baseScale + pulse) * 1.6);
      diskRef.current.rotation.z -= delta * 0.03;
    }

    if (lightRef.current) {
      const normalColor = new THREE.Color('#fff4e6');
      const flashColor = new THREE.Color('#bae6fd');
      const collapsedColor = new THREE.Color('#0284c7');
      
      if (progress <= 0) {
        lightRef.current.color.copy(normalColor);
        lightRef.current.intensity = 15000;
      } else if (progress < 0.35) {
        const t = progress / 0.35;
        lightRef.current.color.lerpColors(normalColor, flashColor, t);
        lightRef.current.intensity = THREE.MathUtils.lerp(15000, 35000, t);
      } else {
        const t = (progress - 0.35) / 0.65;
        lightRef.current.color.lerpColors(flashColor, collapsedColor, t);
        lightRef.current.intensity = THREE.MathUtils.lerp(35000, 3200, t);
      }
    }
  });

  return (
    <group position={[0, 0, -180]}>
      {/* Central Star Core / Event Horizon Shadow */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[18, 64, 64]} />
        <shaderMaterial
          vertexShader={StarVertexShader}
          fragmentShader={StarFragmentShader}
          uniforms={starUniforms}
        />
      </mesh>

      {/* Relativistic Accretion Infall Disc with Doppler Beaming */}
      <mesh ref={diskRef} rotation={[-0.3, 0.2, 0]}>
        <planeGeometry args={[84, 84]} />
        <shaderMaterial
          vertexShader={AccretionVertexShader}
          fragmentShader={AccretionFragmentShader}
          uniforms={diskUniforms}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Dynamic Star Point Light */}
      <pointLight
        ref={lightRef}
        color="#fff4e6"
        intensity={15000}
        distance={1200}
        decay={1.2}
      />
    </group>
  );
}
