import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * High-Fidelity Canonical Starsilk Extraction Architecture
 * 
 * Recreated with exact fidelity to the Starsilk BrandKit reference:
 * - Luminous translucent cyan silk tape / fiber-optic ribbon bands.
 * - Precision vertical barcode / reality-code frequency lines with variable line weights.
 * - Solid luminous boundary tracks on top and bottom edges.
 * - Deep cobalt/indigo translucent backing with brilliant cyan (#00f0ff) and white (#ffffff) laser-slit highlights.
 * - Multi-strand zero-G fluid dynamics unspooling from the star core in Phase C (t=26s) and Phase D (t=52s-78s).
 */

const StarsilkVertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uRibbonIndex;
  uniform float uTurbulence;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;

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
    float lenT = uv.x;

    // Organic zero-G silk flutter and travelling wave dynamics
    float waveSpeed = uTime * 1.8 + uRibbonIndex * 2.1;
    float wave1 = sin(lenT * 9.0 - waveSpeed) * (1.8 + lenT * 5.5);
    float wave2 = cos(lenT * 14.0 - waveSpeed * 1.3 + uRibbonIndex) * (1.2 + lenT * 3.2);
    float waveNoise = snoise(vec3(lenT * 4.0, uRibbonIndex * 2.5, uTime * 0.4)) * (2.0 + lenT * 6.0) * uTurbulence;

    // Longitudinal flutter
    pos += normal * (wave1 + waveNoise) * 0.6;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const StarsilkFragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uRibbonIndex;
  uniform float uIntensity;
  uniform sampler2D uBarcodeMap;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float lenT = vUv.x;
    float widthT = vUv.y; // 0.0 to 1.0 across ribbon width
    float centerOffset = abs(widthT - 0.5) * 2.0; // 0.0 at center, 1.0 at edges

    // Extraction progress threshold
    if (lenT > uProgress) discard;

    // Smooth unspooling leading tip fade
    float tipFade = smoothstep(uProgress, uProgress - 0.05, lenT);

    // Scroll the barcode reality-code along the ribbon
    vec2 barcodeUv = vec2(fract(lenT * 8.0 - uTime * 0.35 + uRibbonIndex * 0.17), widthT);
    vec4 barcodeTex = texture2D(uBarcodeMap, barcodeUv);

    // High-precision procedural multi-frequency barcode layers
    float coord = lenT * 180.0 - uTime * 6.0;
    float stripe1 = sin(coord);
    float stripe2 = sin(coord * 2.3 + 1.2);
    float stripe3 = sin(coord * 5.7 - 0.8);
    float barMix = step(0.15, stripe1 * 0.5 + stripe2 * 0.3 + stripe3 * 0.2);
    float fineBar = step(0.65, sin(coord * 11.0 + cos(coord * 3.0)));
    float combinedBarcode = clamp(barMix * 0.75 + fineBar * 0.45 + barcodeTex.r * 0.8, 0.0, 1.0);

    // Canonical BrandKit Palette
    vec3 coreCyan = vec3(0.0, 0.94, 1.0);       // #00f0ff Electric Cyan
    vec3 deepCobalt = vec3(0.0, 0.22, 0.85);    // #0038d9 Deep Boundary Blue
    vec3 pureWhite = vec3(0.92, 0.98, 1.0);     // #ecfaff Laser-Slit Highlight
    vec3 backingNavy = vec3(0.0, 0.08, 0.35);   // Translucent base film

    // Border glowing guide-rails (top and bottom edges of the tape)
    float edgeRails = smoothstep(0.78, 0.98, centerOffset);
    float edgeRim = pow(centerOffset, 4.0);

    // Longitudinal silk sheen / iridescent fiber highlights
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float fresnel = pow(1.0 - abs(dot(n, v)), 2.5);

    // Combine silk body colors
    vec3 baseColor = mix(backingNavy, deepCobalt, edgeRails * 0.8 + 0.2);
    baseColor = mix(baseColor, coreCyan, combinedBarcode * 0.85 + edgeRails * 0.6);
    baseColor = mix(baseColor, pureWhite, combinedBarcode * fineBar * 0.9 + edgeRim * 0.5);

    // Opacity: Translucent in the gaps, intensely solid and luminous on the barcode slits & rails
    float alpha = mix(0.35, 0.98, combinedBarcode * 0.7 + edgeRails * 0.65);
    alpha = clamp(alpha * tipFade * uIntensity, 0.0, 1.0);

    // Emission boosting for bloom & glow
    vec3 finalEmission = baseColor * (2.2 + combinedBarcode * 2.8 + edgeRails * 1.8 + fresnel * 1.2);

    gl_FragColor = vec4(finalEmission, alpha);
  }
`;

/**
 * Builds a procedural high-res 1024x128 barcode texture matching starsilk.png
 */
function createStarsilkBarcodeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background deep blue translucent backing
  ctx.fillStyle = '#001440';
  ctx.fillRect(0, 0, 1024, 128);

  // Top and bottom continuous bright cyan edge guide rails
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(0, 0, 1024, 12);
  ctx.fillRect(0, 116, 1024, 12);

  // Inner border highlight lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 10, 1024, 2);
  ctx.fillRect(0, 116, 1024, 2);

  // Draw procedural vertical barcode / macro frequency slits
  let x = 8;
  while (x < 1016) {
    const isCluster = Math.sin(x * 0.04) > -0.2;
    const barWidth = isCluster ? (Math.random() > 0.6 ? 3 : (Math.random() > 0.3 ? 1.5 : 1)) : (Math.random() > 0.8 ? 2 : 0.8);
    const gap = isCluster ? 1.5 + Math.random() * 3.5 : 4.0 + Math.random() * 9.0;

    const brightness = Math.random();
    if (brightness > 0.7) {
      ctx.fillStyle = '#ffffff'; // Brilliant white slit
    } else if (brightness > 0.3) {
      ctx.fillStyle = '#00f0ff'; // Electric cyan slit
    } else {
      ctx.fillStyle = '#0088ff'; // Deep azure slit
    }

    // Draw full-height vertical slit with slight padding from edge rails
    ctx.fillRect(x, 12, barWidth, 104);
    x += barWidth + gap;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Computes a smooth, non-flipping 3D ribbon geometry along a 3D spline
 */
function createSmoothRibbonGeometry(curve: THREE.CatmullRomCurve3, width: number, segments = 160): THREE.BufferGeometry {
  const points: THREE.Vector3[] = curve.getPoints(segments);
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  // Compute smooth parallel transport frames
  let prevNormal = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const tangent = curve.getTangent(u).normalize();
    tangents.push(tangent);

    // Project previous normal perpendicular to current tangent
    let normal = prevNormal.clone().sub(tangent.clone().multiplyScalar(prevNormal.dot(tangent))).normalize();
    if (normal.lengthSq() < 0.001) {
      normal = new THREE.Vector3(0, 1, 0).cross(tangent).normalize();
    }
    normals.push(normal);
    prevNormal = normal;

    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    binormals.push(binormal);
  }

  const geom = new THREE.PlaneGeometry(1, 1, segments, 1);
  const posAttr = geom.attributes.position;
  const uvAttr = geom.attributes.uv;

  for (let i = 0; i <= segments; i++) {
    const pt = points[i];
    const binormal = binormals[i];
    const u = i / segments;

    // Twist factor along the ribbon to create natural graceful silk coils
    const twist = Math.sin(u * Math.PI * 3.0) * 0.45;
    const normal = normals[i];
    const orientedBinormal = binormal.clone().multiplyScalar(Math.cos(twist)).add(normal.clone().multiplyScalar(Math.sin(twist)));

    // Vertex 0 (bottom edge, v = 0)
    const v0 = pt.clone().addScaledVector(orientedBinormal, -width * 0.5);
    posAttr.setXYZ(i * 2, v0.x, v0.y, v0.z);
    uvAttr.setXY(i * 2, u, 0.0);

    // Vertex 1 (top edge, v = 1)
    const v1 = pt.clone().addScaledVector(orientedBinormal, width * 0.5);
    posAttr.setXYZ(i * 2 + 1, v1.x, v1.y, v1.z);
    uvAttr.setXY(i * 2 + 1, u, 1.0);
  }

  geom.computeVertexNormals();
  return geom;
}

export function StarsilkExtraction() {
  const barcodeTexture = useMemo(() => createStarsilkBarcodeTexture(), []);

  // 6 canonical Starsilk strands with graceful, sweeping zero-G trajectories
  const ribbons = useMemo(() => {
    const starCenter = new THREE.Vector3(0, 0, -180);

    const curvesConfig = [
      // 1. Primary Hero Ribbon - Sweeps gracefully across the entire observatory view
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(-8, 8, -155),
          new THREE.Vector3(-28, 22, -120),
          new THREE.Vector3(-42, 18, -80),
          new THREE.Vector3(-32, -2, -45),
          new THREE.Vector3(-10, 4, -18),
          new THREE.Vector3(12, 16, 5)
        ],
        width: 3.6,
        index: 0
      },
      // 2. Intertwining Companion Ribbon - Spirals counter-clockwise around the hero ribbon
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(14, -10, -155),
          new THREE.Vector3(34, -18, -125),
          new THREE.Vector3(45, 2, -85),
          new THREE.Vector3(26, 24, -50),
          new THREE.Vector3(2, 14, -20),
          new THREE.Vector3(-18, 6, 2)
        ],
        width: 3.0,
        index: 1
      },
      // 3. Upward Arching Reality-Code Stream
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(6, 18, -145),
          new THREE.Vector3(12, 42, -105),
          new THREE.Vector3(-8, 52, -65),
          new THREE.Vector3(-28, 38, -25),
          new THREE.Vector3(-38, 20, 0)
        ],
        width: 2.4,
        index: 2
      },
      // 4. Planetary Vector Stream towards Hal'Ven IV orbital plane
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(18, -15, -150),
          new THREE.Vector3(48, -28, -120),
          new THREE.Vector3(65, -20, -85),
          new THREE.Vector3(55, -4, -40),
          new THREE.Vector3(32, 8, -10)
        ],
        width: 2.2,
        index: 3
      },
      // 5. Close Viewport S-Curve (dramatic foreground pass right in front of window)
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(-15, -6, -140),
          new THREE.Vector3(-22, 12, -95),
          new THREE.Vector3(-8, 20, -55),
          new THREE.Vector3(8, 6, -22),
          new THREE.Vector3(4, -2, -6),
          new THREE.Vector3(-8, 8, 8)
        ],
        width: 2.5,
        index: 4
      },
      // 6. Fast Fine Whip Thread
      {
        points: [
          starCenter.clone(),
          new THREE.Vector3(4, -18, -145),
          new THREE.Vector3(-12, -32, -110),
          new THREE.Vector3(-28, -18, -70),
          new THREE.Vector3(-14, 12, -30),
          new THREE.Vector3(18, 22, -2)
        ],
        width: 1.6,
        index: 5
      }
    ];

    return curvesConfig.map((config) => {
      const curve = new THREE.CatmullRomCurve3(config.points);
      const geom = createSmoothRibbonGeometry(curve, config.width, 160);
      return { geom, index: config.index };
    });
  }, []);

  const materials = useMemo(() => {
    return ribbons.map(({ index }) => {
      return new THREE.ShaderMaterial({
        vertexShader: StarsilkVertexShader,
        fragmentShader: StarsilkFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uRibbonIndex: { value: index },
          uTurbulence: { value: 1.0 },
          uIntensity: { value: 1.0 },
          uBarcodeMap: { value: barcodeTexture }
        },
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    });
  }, [ribbons, barcodeTexture]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const curTime = useTimelineStore.getState().currentTime;

    let progress = 0;
    let turbulence = 0.5;
    let intensity = 1.0;

    if (curTime < 26.0) {
      progress = 0;
      intensity = 0;
    } else if (curTime < 52.0) {
      // Phase C: Initial extraction begins, unspooling to 50% length
      const t = (curTime - 26.0) / 26.0;
      progress = t * 0.5;
      turbulence = 0.5 + t * 0.5;
      intensity = THREE.MathUtils.lerp(0.3, 1.0, t);
    } else if (curTime < 78.0) {
      // Phase D: Violent Heliocide extraction unspools 100% of the ribbons
      const t = (curTime - 52.0) / 26.0;
      progress = THREE.MathUtils.lerp(0.5, 1.0, Math.pow(t, 0.65));
      turbulence = 1.0 + Math.sin(curTime * 10.0) * 0.5;
      intensity = 1.4;
    } else if (curTime < 122.0) {
      // Phase E & F: Full cosmic expanse
      progress = 1.0;
      turbulence = 0.8;
      intensity = 1.2;
    } else {
      // Phase G: Containment lock
      progress = 1.0;
      const t = Math.min(1.0, (curTime - 122.0) / 16.0);
      turbulence = THREE.MathUtils.lerp(0.8, 0.35, t);
      intensity = THREE.MathUtils.lerp(1.2, 0.85, t);
    }

    materials.forEach((mat, idx) => {
      mat.uniforms.uTime.value = time;
      const strandDelay = idx * 0.05;
      mat.uniforms.uProgress.value = Math.max(0.0, Math.min(1.0, (progress - strandDelay) / (1.0 - strandDelay)));
      mat.uniforms.uTurbulence.value = turbulence;
      mat.uniforms.uIntensity.value = intensity;
    });
  });

  return (
    <group name="starsilk-extraction">
      {ribbons.map(({ geom }, idx) => (
        <mesh key={idx} geometry={geom} material={materials[idx]} />
      ))}
    </group>
  );
}
