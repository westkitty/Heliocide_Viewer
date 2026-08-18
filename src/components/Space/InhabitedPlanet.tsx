import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const PlanetVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const PlanetFragmentShader = `
  uniform sampler2D uSurfaceMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uCloudMap;
  uniform vec3 uStarPosition;
  uniform float uCurrentTime;
  uniform float uCityBlackout;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uStarPosition - vWorldPosition);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Exact solar incidence angle (Terminator)
    float NdotL = dot(normal, sunDir);
    float dayFactor = smoothstep(-0.12, 0.22, NdotL);
    float nightFactor = 1.0 - dayFactor;

    // Sample multi-scale procedural planetary maps
    vec4 surface = texture2D(uSurfaceMap, vUv);
    vec4 night = texture2D(uNightMap, vUv);
    vec4 clouds = texture2D(uCloudMap, vUv);

    // Ocean specular glint on sunward hemisphere
    float isOcean = smoothstep(0.15, 0.35, surface.b - max(surface.r, surface.g));
    vec3 halfVec = normalize(sunDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfVec));
    float specular = pow(NdotH, 48.0) * isOcean * dayFactor * 2.2;

    // Direct warm solar illumination (5800K)
    vec3 sunColor = vec3(1.0, 0.95, 0.88);
    vec3 ambientSpace = vec3(0.015, 0.02, 0.035);

    vec3 daySurface = mix(surface.rgb, clouds.rgb, clouds.a * 0.78);
    vec3 dayLit = daySurface * (max(0.0, NdotL) * sunColor + ambientSpace) + vec3(specular);

    // Night hemisphere: City lights clustered along tectonic coastlines and lowlands
    vec3 nightLit = night.rgb * (1.0 - uCityBlackout) * nightFactor * 2.4 + ambientSpace * 0.5;

    // Atmospheric Rayleigh scattering rim
    float rim = 1.0 - max(0.0, dot(normal, viewDir));
    vec3 atmosGlow = vec3(0.2, 0.55, 0.95) * pow(rim, 3.2) * (dayFactor * 1.6 + 0.12);

    vec3 finalColor = mix(nightLit, dayLit, dayFactor) + atmosGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Deterministic fractal noise for continental synthesis
function createPerlin2D() {
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(i * 127.1)) * 43758.5453) % (i + 1);
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

  function grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return function noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    const a = perm[X] + Y;
    const aa = perm[a];
    const ab = perm[a + 1];
    const b = perm[X + 1] + Y;
    const ba = perm[b];
    const bb = perm[b + 1];

    const g1 = grad(perm[aa], xf, yf);
    const g2 = grad(perm[ba], xf - 1, yf);
    const g3 = grad(perm[ab], xf, yf - 1);
    const g4 = grad(perm[bb], xf - 1, yf - 1);

    const x1 = THREE.MathUtils.lerp(g1, g2, u);
    const x2 = THREE.MathUtils.lerp(g3, g4, u);
    return THREE.MathUtils.lerp(x1, x2, v);
  };
}

export function InhabitedPlanet() {
  const planetGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { planetTexture, nightTexture, cloudTexture } = useMemo(() => {
    const width = 1024;
    const height = 512;
    const noise2D = createPerlin2D();

    function fbm(x: number, y: number, octaves = 6): number {
      let val = 0;
      let amp = 0.5;
      let freq = 1.0;
      for (let i = 0; i < octaves; i++) {
        val += amp * noise2D(x * freq, y * freq);
        freq *= 2.02;
        amp *= 0.5;
      }
      return val;
    }

    // 1. Procedural Geological Surface Canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = width;
    pCanvas.height = height;
    const pCtx = pCanvas.getContext('2d')!;
    const pImg = pCtx.createImageData(width, height);
    const pData = pImg.data;

    // 2. Night City Lights Canvas
    const nCanvas = document.createElement('canvas');
    nCanvas.width = width;
    nCanvas.height = height;
    const nCtx = nCanvas.getContext('2d')!;
    const nImg = nCtx.createImageData(width, height);
    const nData = nImg.data;

    // 3. Cloud Cover Canvas
    const cCanvas = document.createElement('canvas');
    cCanvas.width = width;
    cCanvas.height = height;
    const cCtx = cCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(width, height);
    const cData = cImg.data;

    for (let py = 0; py < height; py++) {
      const lat = (py / height) * Math.PI - Math.PI / 2; // -pi/2 to +pi/2
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      const absLat = Math.abs(lat);

      for (let px = 0; px < width; px++) {
        const lon = (px / width) * Math.PI * 2; // 0 to 2pi
        const idx = (py * width + px) * 4;

        // Spherical 3D coordinate sampling for seamless seamless topology
        const sx = cosLat * Math.cos(lon) * 2.5;
        const sy = cosLat * Math.sin(lon) * 2.5;
        const sz = sinLat * 2.5;

        // Continental cratons & tectonic plates
        const elevation = fbm(sx + 10.0, sy + sz + 10.0, 7) + 0.08 - absLat * 0.15;
        const mountainNoise = Math.pow(Math.abs(fbm(sx * 2.0 + sz * 1.5 + 30.0, sy * 2.0 + 30.0, 5)), 2.0) * 0.6;
        const totalElev = elevation + (elevation > 0.05 ? mountainNoise : 0);

        let r = 0, g = 0, b = 0;
        let cityGlow = 0;

        if (totalElev < -0.15) {
          // Deep Ocean Abyssal Trench
          r = 6; g = 22; b = 58;
        } else if (totalElev < 0.0) {
          // Continental Shelf & Shallow Coastal Waters
          const depthT = (totalElev + 0.15) / 0.15;
          r = Math.floor(THREE.MathUtils.lerp(6, 18, depthT));
          g = Math.floor(THREE.MathUtils.lerp(22, 68, depthT));
          b = Math.floor(THREE.MathUtils.lerp(58, 110, depthT));
        } else if (absLat > 1.25) {
          // Polar Ice Sheets & Glacial Caps
          r = 230; g = 242; b = 255;
        } else if (totalElev < 0.04) {
          // Coastal Beaches and Lowlands
          r = 42; g = 98; b = 54;
          // Dense civilization clustering along fertile coastlines
          cityGlow = Math.max(0, fbm(sx * 8.0, sy * 8.0, 4) * 255);
        } else if (totalElev < 0.22) {
          // Continental Plains & Temperate Forests
          r = 30; g = 82; b = 38;
          cityGlow = Math.max(0, fbm(sx * 6.0, sy * 6.0, 4) * 180);
        } else if (totalElev < 0.38) {
          // Arid Plateaus and Highlands
          r = 142; g = 118; b = 78;
        } else {
          // Alpine Mountain Peaks & Snowcaps
          const peakT = (totalElev - 0.38) / 0.3;
          r = Math.floor(THREE.MathUtils.lerp(120, 240, peakT));
          g = Math.floor(THREE.MathUtils.lerp(120, 245, peakT));
          b = Math.floor(THREE.MathUtils.lerp(130, 255, peakT));
        }

        pData[idx] = r;
        pData[idx + 1] = g;
        pData[idx + 2] = b;
        pData[idx + 3] = 255;

        // Night City Lights: Amber-gold mega-cities + cyan orbital uplink nodes
        if (cityGlow > 70 && totalElev >= 0.0 && absLat < 1.2) {
          const isNode = fbm(sx * 15.0, sy * 15.0, 2) > 0.35;
          if (isNode) {
            nData[idx] = 6;
            nData[idx + 1] = 214;
            nData[idx + 2] = 160;
            nData[idx + 3] = 255;
          } else {
            nData[idx] = 255;
            nData[idx + 1] = 195;
            nData[idx + 2] = 80;
            nData[idx + 3] = 255;
          }
        } else {
          nData[idx] = 0;
          nData[idx + 1] = 0;
          nData[idx + 2] = 0;
          nData[idx + 3] = 255;
        }

        // Swirling Coriolis Cloud Bands & Weather Fronts
        const cloudNoise = fbm(sx * 1.5 + lon * 0.5, sy * 1.5, 5);
        const cloudDensity = smoothstep(0.08, 0.45, cloudNoise);
        cData[idx] = 255;
        cData[idx + 1] = 255;
        cData[idx + 2] = 255;
        cData[idx + 3] = Math.floor(cloudDensity * 210);
      }
    }

    function smoothstep(min: number, max: number, value: number) {
      const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }

    pCtx.putImageData(pImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);
    cCtx.putImageData(cImg, 0, 0);

    const pTex = new THREE.CanvasTexture(pCanvas);
    const nTex = new THREE.CanvasTexture(nCanvas);
    const cTex = new THREE.CanvasTexture(cCanvas);
    return { planetTexture: pTex, nightTexture: nTex, cloudTexture: cTex };
  }, []);

  const uniforms = useMemo(() => ({
    uSurfaceMap: { value: planetTexture },
    uNightMap: { value: nightTexture },
    uCloudMap: { value: cloudTexture },
    uStarPosition: { value: new THREE.Vector3(0, 0, -180) },
    uCurrentTime: { value: 0 },
    uCityBlackout: { value: 0 }
  }), [planetTexture, nightTexture, cloudTexture]);

  useFrame((_, delta) => {
    if (!planetGroupRef.current || !materialRef.current) return;

    planetGroupRef.current.rotation.y += delta * 0.015;

    const currentTime = useTimelineStore.getState().currentTime;
    materialRef.current.uniforms.uCurrentTime.value = currentTime;

    let blackout = 0;
    if (currentTime < 52.0) {
      blackout = 0;
    } else if (currentTime < 78.0) {
      const t = (currentTime - 52.0) / 26.0;
      const flicker = Math.sin(currentTime * 25.0) > 0 ? 0.3 : 0.9;
      blackout = Math.min(1.0, t * flicker + t * 0.5);
    } else {
      blackout = 1.0;
    }
    materialRef.current.uniforms.uCityBlackout.value = blackout;

    if (currentTime > 78.0) {
      const decay = Math.min(1.0, (currentTime - 78.0) / 40.0);
      planetGroupRef.current.position.y = -25 - decay * 15;
      planetGroupRef.current.rotation.z = decay * 0.4;
    } else {
      planetGroupRef.current.position.y = -25;
      planetGroupRef.current.rotation.z = 0.05;
    }
  });

  return (
    <group ref={planetGroupRef} position={[65, -25, -120]}>
      {/* Complete Physically-Shaded Inhabited Planet with Exact Solar Direction */}
      <mesh>
        <sphereGeometry args={[24, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={PlanetVertexShader}
          fragmentShader={PlanetFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  );
}
