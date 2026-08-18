import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const TOTAL_STARS = 5000;

function createSeededRNG(seed = 17618934) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SPECTRAL_CLASSES = [
  { weight: 0.04, color: new THREE.Color('#9bb0ff') },
  { weight: 0.14, color: new THREE.Color('#cad7ff') },
  { weight: 0.20, color: new THREE.Color('#f8f9ff') },
  { weight: 0.30, color: new THREE.Color('#fff4e8') },
  { weight: 0.22, color: new THREE.Color('#ffd2a1') },
  { weight: 0.10, color: new THREE.Color('#ffb380') }
];

const StarVertexShader = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aExtinction;

  uniform float uCurrentTime;
  uniform float uExposure;
  uniform float uLensingIntensity;
  uniform vec3 uBlackHolePos;

  varying vec3 vColor;
  varying float vSize;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vSize = aSize;

    // Extinction factor
    float alpha = 1.0;
    if (aExtinction < 9000.0 && uCurrentTime >= aExtinction) {
      alpha = max(0.0, 1.0 - (uCurrentTime - aExtinction) / 3.0);
    }

    vec3 currentPos = position;

    // Relativistic Gravitational Lensing (Einstein light deflection)
    if (uLensingIntensity > 0.001) {
      vec3 toBH = uBlackHolePos - position;
      float distToBH = length(toBH);
      vec3 bhDir = normalize(uBlackHolePos);
      vec3 starDir = normalize(position);
      
      float angularSep = acos(clamp(dot(bhDir, starDir), -1.0, 1.0));
      // Einstein deflection: alpha_deflect = 4GM / (c^2 * b)
      if (angularSep < 0.85) {
        float b = max(0.04, angularSep);
        float deflection = (0.09 / b) * uLensingIntensity;
        // Tangential displacement vector perpendicular to black hole axis
        vec3 tangent = normalize(starDir - bhDir * dot(starDir, bhDir));
        vec3 deflectedDir = normalize(starDir + tangent * deflection);
        currentPos = deflectedDir * length(position);
        
        // Stars falling directly inside the event horizon shadow are completely occluded
        if (angularSep < 0.05 * uLensingIntensity) {
          alpha = 0.0;
        }
      }
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float projSize = aSize * (900.0 / -mvPosition.z) * sqrt(uExposure);

    if (projSize < 1.2) {
      vAlpha = alpha * clamp(projSize / 1.2, 0.2, 1.0) * uExposure;
      gl_PointSize = 1.2;
    } else {
      vAlpha = alpha * uExposure;
      gl_PointSize = projSize;
    }
  }
`;

const StarFragmentShader = `
  varying vec3 vColor;
  varying float vSize;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord) * 2.0;
    if (dist > 1.0) discard;

    float delta = fwidth(dist);
    float edgeAA = 1.0 - smoothstep(1.0 - max(delta * 1.5, 0.08), 1.0, dist);

    float core = exp(-dist * dist * 10.0);
    float halo = exp(-dist * 3.5) * 0.4;
    float profile = core + halo;

    float spike = 0.0;
    if (vSize > 3.2) {
      float hSpike = max(0.0, 1.0 - abs(coord.y) * 18.0) * max(0.0, 1.0 - abs(coord.x) * 2.5);
      float vSpike = max(0.0, 1.0 - abs(coord.x) * 18.0) * max(0.0, 1.0 - abs(coord.y) * 2.5);
      spike = (hSpike + vSpike) * 0.3 * (vSize / 5.0);
    }

    vec3 finalColor = vColor * (profile + spike);
    float finalAlpha = edgeAA * vAlpha * (profile + spike * 0.7);

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
  }
`;

export function DistantCascadingStars() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, extinctionTimes } = useMemo(() => {
    const rng = createSeededRNG(987654321);

    const pos = new Float32Array(TOTAL_STARS * 3);
    const col = new Float32Array(TOTAL_STARS * 3);
    const sz = new Float32Array(TOTAL_STARS);
    const ext = new Float32Array(TOTAL_STARS);

    for (let i = 0; i < TOTAL_STARS; i++) {
      const radius = 750 + rng() * 450;

      let galacticLat = (rng() - 0.5) * Math.PI;
      if (rng() < 0.65) {
        galacticLat = Math.pow(rng() - 0.5, 3) * Math.PI * 1.8;
      }
      const galacticLon = rng() * Math.PI * 2;

      const x = radius * Math.cos(galacticLat) * Math.cos(galacticLon);
      const y = radius * Math.sin(galacticLat);
      const z = radius * Math.cos(galacticLat) * Math.sin(galacticLon);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const magRoll = rng();
      const magnitude = Math.pow(magRoll, 3.4);
      sz[i] = THREE.MathUtils.lerp(1.5, 5.2, magnitude);

      let specClass = SPECTRAL_CLASSES[3];
      const roll = rng();
      let cumWeight = 0;
      for (const sc of SPECTRAL_CLASSES) {
        cumWeight += sc.weight;
        if (roll <= cumWeight) {
          specClass = sc;
          break;
        }
      }

      const intensity = THREE.MathUtils.lerp(0.5, 1.6, magnitude);
      col[i * 3] = specClass.color.r * intensity;
      col[i * 3 + 1] = specClass.color.g * intensity;
      col[i * 3 + 2] = specClass.color.b * intensity;

      const theta = Math.atan2(z, x);
      const isInSiegeSector = theta > 0.15 && theta < 2.45 && Math.abs(y) < 420;

      if (isInSiegeSector) {
        const normalizedAngle = (theta - 0.15) / 2.3;
        ext[i] = 78.0 + normalizedAngle * 36.0 + (rng() * 4.0 - 2.0);
      } else {
        ext[i] = 9999.0;
      }
    }

    return {
      positions: pos,
      colors: col,
      sizes: sz,
      extinctionTimes: ext
    };
  }, []);

  const uniforms = useMemo(() => ({
    uCurrentTime: { value: 0 },
    uExposure: { value: 1.0 },
    uLensingIntensity: { value: 0 },
    uBlackHolePos: { value: new THREE.Vector3(0, 0, -180) }
  }), []);

  useFrame(() => {
    if (!materialRef.current) return;
    const currentTime = useTimelineStore.getState().currentTime;
    materialRef.current.uniforms.uCurrentTime.value = currentTime;

    let exposure = 0.8;
    let lensing = 0;

    if (currentTime < 52.0) {
      exposure = 0.8;
      lensing = 0;
    } else if (currentTime >= 52.0 && currentTime < 58.0) {
      const flash = (currentTime - 52.0) / 6.0;
      exposure = THREE.MathUtils.lerp(0.8, 0.25, Math.sin(flash * Math.PI));
      lensing = flash * 0.4;
    } else if (currentTime >= 58.0 && currentTime < 78.0) {
      const t = (currentTime - 58.0) / 20.0;
      exposure = THREE.MathUtils.lerp(0.5, 1.35, t);
      lensing = THREE.MathUtils.lerp(0.4, 1.0, t);
    } else {
      exposure = 1.35;
      lensing = 1.0;
    }

    materialRef.current.uniforms.uExposure.value = exposure;
    materialRef.current.uniforms.uLensingIntensity.value = lensing;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aExtinction"
          args={[extinctionTimes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={StarVertexShader}
        fragmentShader={StarFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
