import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * Starsilk Extraction Shader & 3D Ribbon Architecture
 * 
 * Based strictly on the canonical Starsilk BrandKit:
 * - Undulating, twisting luminescent cyan ribbon bands (cores #00f0ff, borders #0055ff, highlights #ffffff).
 * - Distinct vertical barcode / reality-code frequency stripes ("Starsilk Macros") moving along the ribbon.
 * - Extracted by the Shard God from the star's core starting in Phase C (t=26s) and violently unspooling in Phase D (t=52s-78s), causing the star's catastrophic collapse.
 */

const StarsilkVertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 to 1.0 extraction progress
  uniform float uRibbonIndex;
  uniform float uTurbulence;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  // Pseudo-random noise for organic ribbon billow
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
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float lenT = uv.x; // 0.0 at star core, 1.0 at outer tip
    float widthT = (uv.y - 0.5) * 2.0; // -1.0 to 1.0 across width

    // Sinuous undulating motion
    float waveSpeed = uTime * 2.5 + uRibbonIndex * 1.5;
    float wave1 = sin(lenT * 12.0 - waveSpeed) * (2.5 + lenT * 6.0);
    float wave2 = cos(lenT * 8.0 - waveSpeed * 0.7 + uRibbonIndex) * (1.8 + lenT * 4.5);
    float waveNoise = snoise(vec3(lenT * 3.0, uRibbonIndex, uTime * 0.5)) * (3.0 + lenT * 8.0) * uTurbulence;

    // Twist along ribbon length
    float twistAngle = lenT * 6.28318 * (1.5 + uRibbonIndex * 0.3) + uTime * 0.8;
    vec3 localNormal = vec3(-sin(twistAngle), cos(twistAngle), 0.0);
    vec3 localBinormal = vec3(cos(twistAngle), sin(twistAngle), 0.0);

    pos += localNormal * (wave1 + waveNoise) + localBinormal * wave2;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const StarsilkFragmentShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 to 1.0 extraction progress
  uniform float uRibbonIndex;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  // Hash for procedural barcode stripes
  float hash1(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  // Multi-frequency procedural barcode / macro data generator
  float barcodePattern(float u, float time) {
    float scrollU = u * 95.0 - time * 8.0;
    float cellIndex = floor(scrollU);
    float cellFrac = fract(scrollU);

    // Multi-scale digital density
    float h1 = hash1(cellIndex + uRibbonIndex * 17.31);
    float h2 = hash1(floor(scrollU * 0.5) + uRibbonIndex * 5.17);
    float h3 = hash1(floor(scrollU * 3.0));

    // Variable line width
    float barWidth = mix(0.18, 0.82, h1);
    float isBar = step(cellFrac, barWidth);

    // Occasional dense micro-bursts of macro code
    float density = step(0.35, h2) * (0.6 + h3 * 0.4);

    return isBar * density;
  }

  void main() {
    float lenT = vUv.x;
    float widthT = (vUv.y - 0.5) * 2.0; // -1.0 to 1.0

    // Discard portions beyond current unspooling length
    if (lenT > uProgress) discard;

    // Fade out smoothly at the unspooling tip
    float tipFade = smoothstep(uProgress, uProgress - 0.08, lenT);

    // Base BrandKit Colors
    vec3 deepAzure = vec3(0.0, 0.35, 1.0);     // Outer border glow
    vec3 electricCyan = vec3(0.0, 0.94, 1.0);  // Main luminous silk
    vec3 brightWhite = vec3(0.88, 0.98, 1.0);  // High-intensity barcode macros

    // Ribbon cross-section glow (bright edges and glowing center core)
    float edgeGlow = pow(abs(widthT), 2.2);
    float centerCore = exp(-pow(widthT / 0.35, 2.0));

    // Generate flowing barcode macro lines
    float barcode = barcodePattern(lenT, uTime);
    float fineSubMacro = barcodePattern(lenT * 2.5 + 0.5, uTime * 1.4) * 0.45;
    float totalBarcode = clamp(barcode + fineSubMacro, 0.0, 1.0);

    // Translucent silk base
    vec3 ribbonColor = mix(electricCyan, deepAzure, edgeGlow * 0.7);
    ribbonColor = mix(ribbonColor, brightWhite, totalBarcode * 0.85 + centerCore * 0.4);

    // Glowing border pinstripes
    float pinstripe = smoothstep(0.85, 0.98, abs(widthT)) * 1.5;
    ribbonColor += electricCyan * pinstripe;

    // Overall alpha with edge illumination and barcode modulation
    float baseAlpha = mix(0.45, 0.95, edgeGlow);
    baseAlpha += totalBarcode * 0.35;
    float finalAlpha = clamp(baseAlpha * tipFade * uIntensity, 0.0, 1.0);

    // Boost emission
    vec3 finalColor = ribbonColor * (1.8 + totalBarcode * 1.6 + pinstripe * 1.2);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

interface RibbonPathConfig {
  points: THREE.Vector3[];
  width: number;
  index: number;
}

export function StarsilkExtraction() {
  // Generate 5 distinct organic 3D spline curves for the extracted ribbons
  const ribbonGeometries = useMemo(() => {
    const starCenter = new THREE.Vector3(0, 0, -180);
    const configs: RibbonPathConfig[] = [
      // 1. Primary massive ribbon spiraling towards the top-left observatory viewport
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(-12, 14, -145),
          new THREE.Vector3(-32, 28, -100),
          new THREE.Vector3(-45, 18, -60),
          new THREE.Vector3(-30, 8, -20),
          new THREE.Vector3(-8, 3.5, 5)
        ],
        width: 3.2,
        index: 0
      },
      // 2. Secondary ribbon looping around the star accretion disc
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(18, -12, -150),
          new THREE.Vector3(42, -22, -115),
          new THREE.Vector3(55, -8, -75),
          new THREE.Vector3(38, 12, -35),
          new THREE.Vector3(15, 6, 0)
        ],
        width: 2.6,
        index: 1
      },
      // 3. Central tendril arcing upward into the cosmic void
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(8, 22, -140),
          new THREE.Vector3(2, 48, -95),
          new THREE.Vector3(-18, 55, -55),
          new THREE.Vector3(-35, 42, -15)
        ],
        width: 2.2,
        index: 2
      },
      // 4. Low tendril swooping towards Hal'Ven IV orbital plane
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(22, -18, -155),
          new THREE.Vector3(52, -32, -125),
          new THREE.Vector3(68, -26, -95),
          new THREE.Vector3(60, -12, -50)
        ],
        width: 2.0,
        index: 3
      },
      // 5. Fast whip tendril twisting directly past the observation deck glass
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(-18, -8, -140),
          new THREE.Vector3(-24, 6, -95),
          new THREE.Vector3(-12, 16, -50),
          new THREE.Vector3(0, 4, -12),
          new THREE.Vector3(6, 2, 2)
        ],
        width: 1.8,
        index: 4
      }
    ];

    return configs.map((config) => {
      const curve = new THREE.CatmullRomCurve3(config.points);
      const segments = 120;
      const widthSegments = 8;
      const geom = new THREE.PlaneGeometry(1, 1, segments, widthSegments);

      const posAttr = geom.attributes.position;
      const uvAttr = geom.attributes.uv;

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const pt = curve.getPoint(u);
        const tangent = curve.getTangent(u);
        
        // Compute normal and binormal along the curve
        const up = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);

        for (let j = 0; j <= widthSegments; j++) {
          const v = j / widthSegments;
          const offset = (v - 0.5) * config.width;
          const vertIndex = i * (widthSegments + 1) + j;

          const vertexPos = pt.clone().addScaledVector(normal, offset);
          posAttr.setXYZ(vertIndex, vertexPos.x, vertexPos.y, vertexPos.z);
          uvAttr.setXY(vertIndex, u, v);
        }
      }

      geom.computeVertexNormals();
      return { geom, index: config.index };
    });
  }, []);

  const materials = useMemo(() => {
    return ribbonGeometries.map(({ index }) => {
      return new THREE.ShaderMaterial({
        vertexShader: StarsilkVertexShader,
        fragmentShader: StarsilkFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uRibbonIndex: { value: index },
          uTurbulence: { value: 1.0 },
          uIntensity: { value: 1.0 }
        },
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    });
  }, [ribbonGeometries]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const curTime = useTimelineStore.getState().currentTime;

    // Timeline unspooling progression
    // Phase A & B (0-26s): 0 (hidden inside star)
    // Phase C (26-52s): Initial extraction begins, pulling out to 0.45
    // Phase D (52-78s): Rapid violent unspooling, length reaches 1.0 with high turbulence
    // Phase E & F (78-122s): Full ribbon expanse threading through space
    // Phase G (122-138s): Stabilized containment strands
    let progress = 0;
    let turbulence = 0.5;
    let intensity = 1.0;

    if (curTime < 26.0) {
      progress = 0;
      intensity = 0;
    } else if (curTime < 52.0) {
      const t = (curTime - 26.0) / 26.0;
      progress = t * 0.45;
      turbulence = 0.6 + t * 0.4;
      intensity = THREE.MathUtils.lerp(0.2, 0.9, t);
    } else if (curTime < 78.0) {
      const t = (curTime - 52.0) / 26.0;
      progress = THREE.MathUtils.lerp(0.45, 1.0, Math.pow(t, 0.7));
      turbulence = 1.0 + Math.sin(curTime * 12.0) * 0.4;
      intensity = 1.3;
    } else if (curTime < 122.0) {
      progress = 1.0;
      turbulence = 0.8;
      intensity = 1.1;
    } else {
      progress = 1.0;
      const t = Math.min(1.0, (curTime - 122.0) / 16.0);
      turbulence = THREE.MathUtils.lerp(0.8, 0.3, t);
      intensity = THREE.MathUtils.lerp(1.1, 0.7, t);
    }

    materials.forEach((mat, idx) => {
      mat.uniforms.uTime.value = time;
      // Stagger unspooling slightly across individual ribbon strands
      const strandDelay = idx * 0.06;
      mat.uniforms.uProgress.value = Math.max(0.0, Math.min(1.0, (progress - strandDelay) / (1.0 - strandDelay)));
      mat.uniforms.uTurbulence.value = turbulence;
      mat.uniforms.uIntensity.value = intensity;
    });
  });

  return (
    <group name="starsilk-extraction">
      {ribbonGeometries.map(({ geom }, idx) => (
        <mesh key={idx} geometry={geom} material={materials[idx]} />
      ))}
    </group>
  );
}
